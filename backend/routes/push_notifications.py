"""
Push Notification Service for AdviceOS
Supports:
- In-app notifications with bell/notification center
- Browser desktop notifications via Web Push
- Mobile push notifications via Firebase Cloud Messaging (FCM)
- WebSocket real-time delivery
"""

import os
import json
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/push", tags=["Push Notifications"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# Firebase config (optional - for mobile push)
FIREBASE_SERVER_KEY = os.environ.get("FIREBASE_SERVER_KEY", "")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")

# ==================== MODELS ====================

class PushSubscription(BaseModel):
    """Web Push subscription from browser"""
    user_id: str
    subscription_type: str  # "web_push", "fcm", "apns"
    endpoint: Optional[str] = None  # For web push
    device_token: Optional[str] = None  # For FCM/APNS
    device_type: Optional[str] = None  # "web", "android", "ios"
    p256dh: Optional[str] = None  # Web push key
    auth: Optional[str] = None  # Web push auth
    user_agent: Optional[str] = None

class InAppNotification(BaseModel):
    """In-app notification model"""
    notification_id: str = Field(default_factory=lambda: f"NOTIF-{uuid.uuid4().hex[:12].upper()}")
    user_id: str
    title: str
    message: str
    notification_type: str  # "breach", "sync", "alert", "info", "success", "warning", "portfolio"
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    category: str = "general"  # "compliance", "platform_sync", "portfolio", "meeting", "document"
    action_url: Optional[str] = None
    action_label: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    read: bool = False
    dismissed: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: Optional[str] = None

class BroadcastNotification(BaseModel):
    """Notification to broadcast to multiple users"""
    title: str
    message: str
    notification_type: str
    priority: str = "normal"
    category: str = "general"
    target_users: List[str] = Field(default_factory=list)  # Empty = all users
    target_roles: List[str] = Field(default_factory=list)  # adviser, compliance_officer, etc.
    action_url: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    send_push: bool = True
    send_email: bool = False
    send_sms: bool = False

class NotificationPreferences(BaseModel):
    """User notification preferences"""
    user_id: str
    in_app_enabled: bool = True
    desktop_push_enabled: bool = True
    mobile_push_enabled: bool = True
    email_enabled: bool = True
    sms_enabled: bool = False
    # Category preferences
    categories: Dict[str, bool] = Field(default_factory=lambda: {
        "compliance": True,
        "platform_sync": True,
        "portfolio": True,
        "meeting": True,
        "document": True,
        "breach": True,
        "general": True
    })
    # Quiet hours
    quiet_hours_enabled: bool = False
    quiet_start: str = "22:00"
    quiet_end: str = "07:00"
    # Frequency
    digest_mode: bool = False  # Batch notifications into digest
    digest_frequency: str = "daily"  # "hourly", "daily", "weekly"

# ==================== SUBSCRIPTION MANAGEMENT ====================

@router.post("/subscribe")
async def subscribe_push(subscription: PushSubscription):
    """Register a push notification subscription"""
    db = await get_db()
    
    sub_dict = subscription.model_dump()
    sub_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    sub_dict["last_active"] = datetime.now(timezone.utc).isoformat()
    
    # Upsert subscription (update if same endpoint/token exists)
    if subscription.subscription_type == "web_push" and subscription.endpoint:
        await db.push_subscriptions.update_one(
            {"endpoint": subscription.endpoint},
            {"$set": sub_dict},
            upsert=True
        )
    elif subscription.device_token:
        await db.push_subscriptions.update_one(
            {"device_token": subscription.device_token},
            {"$set": sub_dict},
            upsert=True
        )
    else:
        await db.push_subscriptions.insert_one(sub_dict)
    
    return {
        "success": True,
        "message": "Push subscription registered",
        "subscription_type": subscription.subscription_type
    }

@router.delete("/unsubscribe/{user_id}")
async def unsubscribe_push(user_id: str, device_token: Optional[str] = None):
    """Unregister push notification subscription"""
    db = await get_db()
    
    query = {"user_id": user_id}
    if device_token:
        query["device_token"] = device_token
    
    result = await db.push_subscriptions.delete_many(query)
    
    return {
        "success": True,
        "deleted": result.deleted_count
    }

@router.get("/subscriptions/{user_id}")
async def get_user_subscriptions(user_id: str):
    """Get all push subscriptions for a user"""
    db = await get_db()
    
    subscriptions = await db.push_subscriptions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(length=50)
    
    return {
        "user_id": user_id,
        "subscriptions": subscriptions,
        "count": len(subscriptions)
    }

# ==================== NOTIFICATION PREFERENCES ====================

@router.post("/preferences")
async def save_preferences(preferences: NotificationPreferences):
    """Save user notification preferences"""
    db = await get_db()
    
    pref_dict = preferences.model_dump()
    pref_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.notification_preferences.update_one(
        {"user_id": preferences.user_id},
        {"$set": pref_dict},
        upsert=True
    )
    
    return {"success": True, "message": "Preferences saved"}

@router.get("/preferences/{user_id}")
async def get_preferences(user_id: str):
    """Get user notification preferences"""
    db = await get_db()
    
    preferences = await db.notification_preferences.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not preferences:
        # Return defaults
        return NotificationPreferences(user_id=user_id).model_dump()
    
    return preferences

# ==================== IN-APP NOTIFICATIONS ====================

@router.post("/send")
async def send_notification(notification: InAppNotification, background_tasks: BackgroundTasks):
    """Send an in-app notification to a user"""
    db = await get_db()
    
    notif_dict = notification.model_dump()
    
    # Store notification
    await db.in_app_notifications.insert_one(notif_dict)
    
    # Broadcast via WebSocket
    background_tasks.add_task(broadcast_to_user, notification.user_id, notif_dict)
    
    # Check if push notifications should be sent
    prefs = await db.notification_preferences.find_one({"user_id": notification.user_id})
    if prefs:
        # Check category preference
        category_enabled = prefs.get("categories", {}).get(notification.category, True)
        
        if category_enabled:
            # Check quiet hours
            in_quiet_hours = False
            if prefs.get("quiet_hours_enabled"):
                now = datetime.now(timezone.utc)
                current_time = now.strftime("%H:%M")
                quiet_start = prefs.get("quiet_start", "22:00")
                quiet_end = prefs.get("quiet_end", "07:00")
                
                if quiet_start <= quiet_end:
                    in_quiet_hours = quiet_start <= current_time <= quiet_end
                else:
                    in_quiet_hours = current_time >= quiet_start or current_time <= quiet_end
            
            if not in_quiet_hours:
                # Send desktop/mobile push if enabled
                if prefs.get("desktop_push_enabled") or prefs.get("mobile_push_enabled"):
                    background_tasks.add_task(send_push_to_user, notification.user_id, notif_dict)
    else:
        # No preferences = send everything
        background_tasks.add_task(send_push_to_user, notification.user_id, notif_dict)
    
    return {
        "success": True,
        "notification_id": notification.notification_id,
        "message": "Notification sent"
    }

@router.post("/broadcast")
async def broadcast_notification(broadcast: BroadcastNotification, background_tasks: BackgroundTasks):
    """Broadcast a notification to multiple users"""
    db = await get_db()
    
    # Determine target users
    target_user_ids = list(broadcast.target_users) if broadcast.target_users else []
    
    # Add users by role if specified
    if broadcast.target_roles:
        role_users = await db.users.find(
            {"role": {"$in": broadcast.target_roles}},
            {"user_id": 1, "_id": 0}
        ).to_list(length=10000)
        target_user_ids.extend([u["user_id"] for u in role_users])
    
    # If no targets specified, get all users
    if not target_user_ids:
        all_users = await db.users.find({}, {"user_id": 1, "_id": 0}).to_list(length=10000)
        target_user_ids = [u["user_id"] for u in all_users]
        
        # If still no users, use a default
        if not target_user_ids:
            target_user_ids = ["default_user"]
    
    # Remove duplicates
    target_user_ids = list(set(target_user_ids))
    
    notifications_created = []
    for user_id in target_user_ids:
        notification = InAppNotification(
            user_id=user_id,
            title=broadcast.title,
            message=broadcast.message,
            notification_type=broadcast.notification_type,
            priority=broadcast.priority,
            category=broadcast.category,
            action_url=broadcast.action_url,
            data=broadcast.data
        )
        notif_dict = notification.model_dump()
        await db.in_app_notifications.insert_one(notif_dict)
        notifications_created.append(notification.notification_id)
        
        # Send via WebSocket and Push
        background_tasks.add_task(broadcast_to_user, user_id, notif_dict)
        if broadcast.send_push:
            background_tasks.add_task(send_push_to_user, user_id, notif_dict)
    
    # Also broadcast to WebSocket channels
    background_tasks.add_task(broadcast_to_channels, broadcast.model_dump())
    
    return {
        "success": True,
        "notifications_sent": len(notifications_created),
        "target_users": len(target_user_ids),
        "notification_ids": notifications_created[:10]  # Return first 10 IDs
    }

@router.get("/notifications/{user_id}")
async def get_user_notifications(
    user_id: str,
    limit: int = 50,
    unread_only: bool = False,
    category: Optional[str] = None
):
    """Get notifications for a user"""
    db = await get_db()
    
    query = {"user_id": user_id, "dismissed": False}
    if unread_only:
        query["read"] = False
    if category:
        query["category"] = category
    
    notifications = await db.in_app_notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    # Count unread
    unread_count = await db.in_app_notifications.count_documents({
        "user_id": user_id,
        "read": False,
        "dismissed": False
    })
    
    return {
        "notifications": notifications,
        "total": len(notifications),
        "unread_count": unread_count
    }

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    db = await get_db()
    
    result = await db.in_app_notifications.update_one(
        {"notification_id": notification_id},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": result.modified_count > 0}

@router.put("/notifications/{user_id}/read-all")
async def mark_all_read(user_id: str):
    """Mark all notifications as read for a user"""
    db = await get_db()
    
    result = await db.in_app_notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "marked_read": result.modified_count}

@router.delete("/notifications/{notification_id}")
async def dismiss_notification(notification_id: str):
    """Dismiss (soft delete) a notification"""
    db = await get_db()
    
    result = await db.in_app_notifications.update_one(
        {"notification_id": notification_id},
        {"$set": {"dismissed": True, "dismissed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": result.modified_count > 0}

@router.delete("/notifications/{user_id}/clear-all")
async def clear_all_notifications(user_id: str):
    """Clear all notifications for a user"""
    db = await get_db()
    
    result = await db.in_app_notifications.update_many(
        {"user_id": user_id},
        {"$set": {"dismissed": True, "dismissed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "cleared": result.modified_count}

# ==================== PUSH DELIVERY FUNCTIONS ====================

async def broadcast_to_user(user_id: str, notification: Dict[str, Any]):
    """Broadcast notification to user via WebSocket"""
    try:
        from .websocket_service import manager
        await manager.send_to_user(user_id, {
            "event_type": "notification",
            "data": notification
        })
    except Exception as e:
        logger.error(f"Failed to broadcast to user {user_id}: {e}")

async def broadcast_to_channels(notification: Dict[str, Any]):
    """Broadcast notification to relevant WebSocket channels"""
    try:
        from .websocket_service import broadcast_notification
        await broadcast_notification(
            notification.get("notification_type", "info"),
            notification.get("title", "Notification"),
            notification.get("message", ""),
            notification.get("data", {})
        )
    except Exception as e:
        logger.error(f"Failed to broadcast to channels: {e}")

async def send_push_to_user(user_id: str, notification: Dict[str, Any]):
    """Send push notification to user's registered devices"""
    db = await get_db()
    
    # Get user's push subscriptions
    subscriptions = await db.push_subscriptions.find(
        {"user_id": user_id}
    ).to_list(length=20)
    
    for sub in subscriptions:
        try:
            if sub.get("subscription_type") == "web_push":
                await send_web_push(sub, notification)
            elif sub.get("subscription_type") == "fcm":
                await send_fcm_push(sub, notification)
        except Exception as e:
            logger.error(f"Failed to send push to {sub.get('subscription_type')}: {e}")

async def send_web_push(subscription: Dict, notification: Dict):
    """Send Web Push notification (mock implementation)"""
    db = await get_db()
    
    # Log the push notification (mock mode)
    push_log = {
        "log_id": f"WEBPUSH-{uuid.uuid4().hex[:8].upper()}",
        "type": "web_push",
        "mode": "mock",
        "endpoint": subscription.get("endpoint", "")[:100],
        "user_id": subscription.get("user_id"),
        "title": notification.get("title"),
        "message": notification.get("message")[:200] if notification.get("message") else None,
        "notification_type": notification.get("notification_type"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "note": "Mock mode - Web Push logged. In production, would use pywebpush library."
    }
    await db.push_notification_logs.insert_one(push_log)
    
    logger.info(f"MOCK WEB PUSH: {notification.get('title')} to {subscription.get('user_id')}")

async def send_fcm_push(subscription: Dict, notification: Dict):
    """Send Firebase Cloud Messaging push notification"""
    db = await get_db()
    
    if not FIREBASE_SERVER_KEY:
        # Mock mode
        push_log = {
            "log_id": f"FCM-{uuid.uuid4().hex[:8].upper()}",
            "type": "fcm",
            "mode": "mock",
            "device_token": subscription.get("device_token", "")[:50] + "...",
            "user_id": subscription.get("user_id"),
            "device_type": subscription.get("device_type"),
            "title": notification.get("title"),
            "message": notification.get("message")[:200] if notification.get("message") else None,
            "notification_type": notification.get("notification_type"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": "Mock mode - FCM push logged. Add FIREBASE_SERVER_KEY for real mobile push."
        }
        await db.push_notification_logs.insert_one(push_log)
        
        logger.info(f"MOCK FCM PUSH: {notification.get('title')} to {subscription.get('device_type')}")
        return
    
    # Real FCM implementation would go here
    # Using Firebase Admin SDK
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging
        
        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            # Would need to load credentials from env or file
            pass
        
        message = messaging.Message(
            notification=messaging.Notification(
                title=notification.get("title"),
                body=notification.get("message"),
            ),
            data={
                "notification_id": notification.get("notification_id", ""),
                "notification_type": notification.get("notification_type", ""),
                "action_url": notification.get("action_url", "")
            },
            token=subscription.get("device_token")
        )
        
        response = messaging.send(message)
        logger.info(f"FCM message sent: {response}")
        
    except Exception as e:
        logger.error(f"FCM error: {e}")

# ==================== NOTIFICATION TRIGGERS ====================

@router.post("/trigger/breach")
async def trigger_breach_notification(
    breach_id: str,
    breach_type: str,
    severity: str,
    adviser_id: str,
    description: str,
    background_tasks: BackgroundTasks
):
    """Trigger breach notification to relevant users"""
    db = await get_db()
    
    # Create notification
    notification = InAppNotification(
        user_id=adviser_id,
        title=f"Compliance Breach: {breach_type}",
        message=description,
        notification_type="breach",
        priority="urgent" if severity in ["critical", "high"] else "high",
        category="breach",
        action_url=f"/breach-register?id={breach_id}",
        action_label="View Breach",
        data={"breach_id": breach_id, "severity": severity}
    )
    
    # Send to adviser
    await send_notification(notification, background_tasks)
    
    # Also notify compliance officers
    compliance_officers = await db.users.find(
        {"role": "compliance_officer"},
        {"user_id": 1, "_id": 0}
    ).to_list(length=100)
    
    for officer in compliance_officers:
        officer_notif = InAppNotification(
            user_id=officer["user_id"],
            title=f"Breach Alert: {breach_type}",
            message=f"Adviser {adviser_id}: {description}",
            notification_type="breach",
            priority="urgent" if severity in ["critical", "high"] else "high",
            category="compliance",
            action_url=f"/breach-register?id={breach_id}",
            data={"breach_id": breach_id, "severity": severity, "adviser_id": adviser_id}
        )
        await send_notification(officer_notif, background_tasks)
    
    # Also send via email/SMS (existing notification service)
    try:
        from .notification_service import send_breach_alert, NotificationRequest
        await send_breach_alert(NotificationRequest(
            breach_id=breach_id,
            breach_type=breach_type,
            severity=severity,
            adviser_id=adviser_id,
            description=description
        ), background_tasks)
    except Exception as e:
        logger.error(f"Failed to send email/SMS breach alert: {e}")
    
    return {"success": True, "message": "Breach notification sent"}

@router.post("/trigger/sync-complete")
async def trigger_sync_complete(
    platform: str,
    platform_name: str,
    clients_synced: int,
    records_updated: int,
    user_id: str,
    background_tasks: BackgroundTasks
):
    """Trigger notification when platform sync completes"""
    notification = InAppNotification(
        user_id=user_id,
        title=f"{platform_name} Sync Complete",
        message=f"Successfully synced {clients_synced} clients and {records_updated} records.",
        notification_type="sync",
        priority="normal",
        category="platform_sync",
        action_url="/live-sync",
        action_label="View Details",
        data={"platform": platform, "clients_synced": clients_synced}
    )
    
    await send_notification(notification, background_tasks)
    
    return {"success": True}

@router.post("/trigger/portfolio-alert")
async def trigger_portfolio_alert(
    user_id: str,
    alert_type: str,  # "drop", "threshold", "rebalance"
    title: str,
    message: str,
    portfolio_data: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Trigger portfolio alert notification"""
    notification = InAppNotification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type="portfolio",
        priority="high" if alert_type == "drop" else "normal",
        category="portfolio",
        action_url="/family-wealth",
        action_label="View Portfolio",
        data=portfolio_data
    )
    
    await send_notification(notification, background_tasks)
    
    return {"success": True}

# ==================== STATUS ENDPOINTS ====================

@router.get("/status")
async def get_push_status():
    """Get push notification service status"""
    db = await get_db()
    
    total_subscriptions = await db.push_subscriptions.count_documents({})
    total_notifications = await db.in_app_notifications.count_documents({})
    unread_notifications = await db.in_app_notifications.count_documents({"read": False})
    push_logs = await db.push_notification_logs.count_documents({})
    
    return {
        "status": "operational",
        "services": {
            "in_app": {
                "status": "ready",
                "total_notifications": total_notifications,
                "unread": unread_notifications
            },
            "web_push": {
                "status": "mock_mode",
                "note": "Web Push logged but not sent. Requires VAPID keys for real delivery.",
                "subscriptions": await db.push_subscriptions.count_documents({"subscription_type": "web_push"})
            },
            "fcm": {
                "status": "ready" if FIREBASE_SERVER_KEY else "mock_mode",
                "note": "Firebase Cloud Messaging" + (" configured" if FIREBASE_SERVER_KEY else " - Add FIREBASE_SERVER_KEY for mobile push"),
                "subscriptions": await db.push_subscriptions.count_documents({"subscription_type": "fcm"})
            },
            "websocket": {
                "status": "ready",
                "note": "Real-time WebSocket delivery available"
            }
        },
        "total_subscriptions": total_subscriptions,
        "push_logs": push_logs,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/logs")
async def get_push_logs(limit: int = 50, notification_type: Optional[str] = None):
    """Get push notification delivery logs"""
    db = await get_db()
    
    query = {}
    if notification_type:
        query["type"] = notification_type
    
    logs = await db.push_notification_logs.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    return {
        "logs": logs,
        "total": len(logs)
    }

# ==================== TEST ENDPOINTS ====================

@router.post("/test/send-all")
async def test_send_all_channels(user_id: str = "test_user"):
    """Send test notification through all channels"""
    db = await get_db()
    
    notification = InAppNotification(
        user_id=user_id,
        title="Test Notification",
        message="This is a test notification from AdviceOS. If you see this, notifications are working!",
        notification_type="info",
        priority="normal",
        category="general",
        data={"test": True}
    )
    
    notif_dict = notification.model_dump()
    
    # Store in-app notification
    await db.in_app_notifications.insert_one(notif_dict)
    
    # Broadcast via WebSocket
    await broadcast_to_user(user_id, notif_dict)
    await broadcast_to_channels(notif_dict)
    
    # Send push (mock)
    await send_push_to_user(user_id, notif_dict)
    
    return {
        "success": True,
        "notification_id": notification.notification_id,
        "channels": ["in_app", "websocket", "web_push", "fcm"],
        "message": "Test notification sent through all channels"
    }

@router.post("/demo/seed-notifications")
async def seed_demo_notifications(user_id: str = "demo_user"):
    """Seed demo notifications for testing"""
    db = await get_db()
    
    demo_notifications = [
        {
            "title": "Compliance Breach Detected",
            "message": "Client allocation outside risk profile bounds. Immediate review required.",
            "notification_type": "breach",
            "priority": "urgent",
            "category": "compliance",
            "action_url": "/breach-register"
        },
        {
            "title": "AMP North Sync Complete",
            "message": "Successfully synced 45 clients and 128 portfolio records.",
            "notification_type": "sync",
            "priority": "normal",
            "category": "platform_sync",
            "action_url": "/live-sync"
        },
        {
            "title": "Portfolio Alert: Market Drop",
            "message": "Client portfolio has dropped 5% in the last 24 hours.",
            "notification_type": "portfolio",
            "priority": "high",
            "category": "portfolio",
            "action_url": "/family-wealth"
        },
        {
            "title": "SOA Requires Review",
            "message": "Statement of Advice for James Mitchell is pending compliance review.",
            "notification_type": "document",
            "priority": "normal",
            "category": "document",
            "action_url": "/adviser-compliance"
        },
        {
            "title": "Meeting Reminder",
            "message": "Client meeting with Sarah Thompson in 30 minutes.",
            "notification_type": "meeting",
            "priority": "high",
            "category": "meeting",
            "action_url": "/meeting-prep"
        }
    ]
    
    created = []
    for notif_data in demo_notifications:
        notification = InAppNotification(
            user_id=user_id,
            **notif_data
        )
        notif_dict = notification.model_dump()
        await db.in_app_notifications.insert_one(notif_dict)
        created.append(notification.notification_id)
    
    return {
        "success": True,
        "notifications_created": len(created),
        "notification_ids": created
    }
