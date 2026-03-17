"""
Real-Time Notification System
WebSocket-based real-time alerts, email notifications, and push notifications.
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timezone, timedelta
import uuid
import logging
import asyncio
import json
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notifications", tags=["Notifications"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}  # user_id -> connections
        self.connection_info: Dict[str, Dict] = {}  # connection_id -> metadata
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        self.connection_info[connection_id] = {
            "user_id": user_id,
            "websocket": websocket,
            "connected_at": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"WebSocket connected: user={user_id}, connection={connection_id}")
        return connection_id
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Clean up connection info
        for conn_id, info in list(self.connection_info.items()):
            if info.get("websocket") == websocket:
                del self.connection_info[conn_id]
                break
        
        logger.info(f"WebSocket disconnected: user={user_id}")
    
    async def send_personal(self, user_id: str, message: dict):
        """Send message to specific user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {e}")
    
    async def broadcast(self, message: dict, exclude_users: List[str] = None):
        """Broadcast message to all connected users."""
        exclude_users = exclude_users or []
        for user_id, connections in self.active_connections.items():
            if user_id not in exclude_users:
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        logger.error(f"Error broadcasting to user {user_id}: {e}")
    
    def get_connected_users(self) -> List[str]:
        return list(self.active_connections.keys())
    
    def is_user_connected(self, user_id: str) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


# Global connection manager
manager = ConnectionManager()

# Notification storage
NOTIFICATIONS: List[Dict] = []
NOTIFICATION_PREFERENCES: Dict[str, Dict] = {
    "adviser_001": {
        "email_alerts": True,
        "push_alerts": True,
        "websocket_alerts": True,
        "alert_types": {
            "portfolio_drift": {"email": True, "push": True, "threshold": 5},
            "tax_opportunity": {"email": True, "push": True, "min_saving": 1000},
            "compliance_due": {"email": True, "push": True, "days_before": 14},
            "client_login": {"email": False, "push": True},
            "market_event": {"email": False, "push": True},
            "idle_cash": {"email": True, "push": True, "threshold": 50000},
            "retirement_risk": {"email": True, "push": True},
            "meeting_reminder": {"email": True, "push": True, "hours_before": 24}
        },
        "quiet_hours": {"start": "22:00", "end": "07:00"},
        "email": "adviser@wealthcommand.io"
    }
}


class NotificationCreate(BaseModel):
    user_id: str
    notification_type: str
    title: str
    message: str
    priority: str = "medium"  # low, medium, high, critical
    data: Optional[Dict] = None
    action_url: Optional[str] = None


class EmailNotificationRequest(BaseModel):
    to_email: EmailStr
    subject: str
    html_content: str
    text_content: Optional[str] = None


class PushSubscription(BaseModel):
    user_id: str
    endpoint: str
    keys: Dict[str, str]


# Email service (using SendGrid when available)
async def send_email_notification(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str = None
) -> bool:
    """Send email notification via SendGrid or fallback."""
    try:
        # Check for SendGrid API key
        sendgrid_key = os.environ.get("SENDGRID_API_KEY")
        sender_email = os.environ.get("SENDER_EMAIL", "notifications@wealthcommand.io")
        
        if sendgrid_key:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            
            message = Mail(
                from_email=sender_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=text_content
            )
            
            sg = SendGridAPIClient(sendgrid_key)
            response = sg.send(message)
            
            logger.info(f"Email sent to {to_email}: status={response.status_code}")
            return response.status_code == 202
        else:
            # Demo mode - log email
            logger.info(f"[DEMO MODE] Email would be sent to {to_email}: {subject}")
            return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


# Push notification service
async def send_push_notification(
    user_id: str,
    title: str,
    body: str,
    data: Dict = None
) -> bool:
    """Send push notification (Web Push API compatible)."""
    try:
        # In production, this would use pywebpush
        # For now, we'll use WebSocket as a push mechanism
        if manager.is_user_connected(user_id):
            await manager.send_personal(user_id, {
                "type": "push_notification",
                "title": title,
                "body": body,
                "data": data or {},
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            return True
        else:
            logger.info(f"[PUSH] User {user_id} not connected, notification queued")
            return False
    except Exception as e:
        logger.error(f"Failed to send push notification to {user_id}: {e}")
        return False


def get_user_preferences(user_id: str) -> Dict:
    """Get notification preferences for a user."""
    return NOTIFICATION_PREFERENCES.get(user_id, {
        "email_alerts": True,
        "push_alerts": True,
        "websocket_alerts": True,
        "alert_types": {},
        "email": None
    })


def should_send_notification(user_id: str, notification_type: str, channel: str) -> bool:
    """Check if notification should be sent based on user preferences."""
    prefs = get_user_preferences(user_id)
    
    # Check global channel settings
    if channel == "email" and not prefs.get("email_alerts", True):
        return False
    if channel == "push" and not prefs.get("push_alerts", True):
        return False
    if channel == "websocket" and not prefs.get("websocket_alerts", True):
        return False
    
    # Check quiet hours
    quiet_hours = prefs.get("quiet_hours")
    if quiet_hours and channel in ["push", "email"]:
        now = datetime.now()
        start = datetime.strptime(quiet_hours.get("start", "22:00"), "%H:%M").replace(
            year=now.year, month=now.month, day=now.day
        )
        end = datetime.strptime(quiet_hours.get("end", "07:00"), "%H:%M").replace(
            year=now.year, month=now.month, day=now.day
        )
        if start <= now <= end:
            return False
    
    # Check alert type preferences
    alert_prefs = prefs.get("alert_types", {}).get(notification_type, {})
    return alert_prefs.get(channel, True)


async def create_and_send_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "medium",
    data: Dict = None,
    action_url: str = None,
    background_tasks: BackgroundTasks = None
) -> Dict:
    """Create notification and send via appropriate channels."""
    notification_id = f"notif_{uuid.uuid4().hex[:8]}"
    
    notification = {
        "id": notification_id,
        "user_id": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "priority": priority,
        "data": data or {},
        "action_url": action_url,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "read": False,
        "channels_sent": []
    }
    
    NOTIFICATIONS.append(notification)
    
    # Send via WebSocket (real-time)
    if should_send_notification(user_id, notification_type, "websocket"):
        await manager.send_personal(user_id, {
            "type": "notification",
            "notification": notification
        })
        notification["channels_sent"].append("websocket")
    
    # Send via Push
    if should_send_notification(user_id, notification_type, "push"):
        await send_push_notification(user_id, title, message, data)
        notification["channels_sent"].append("push")
    
    # Send via Email (background task for async)
    if should_send_notification(user_id, notification_type, "email"):
        prefs = get_user_preferences(user_id)
        email = prefs.get("email")
        if email:
            html_content = generate_email_html(title, message, notification_type, action_url)
            if background_tasks:
                background_tasks.add_task(send_email_notification, email, title, html_content, message)
            else:
                await send_email_notification(email, title, html_content, message)
            notification["channels_sent"].append("email")
    
    return notification


def generate_email_html(title: str, message: str, notification_type: str, action_url: str = None) -> str:
    """Generate professional HTML email content."""
    icon_colors = {
        "portfolio_drift": "#DC2626",
        "tax_opportunity": "#16A34A",
        "compliance_due": "#D97706",
        "client_login": "#2563EB",
        "market_event": "#7C3AED",
        "idle_cash": "#0891B2",
        "retirement_risk": "#EA580C",
        "meeting_reminder": "#4F46E5"
    }
    
    color = icon_colors.get(notification_type, "#1a2744")
    
    action_button = ""
    if action_url:
        action_button = f'''
        <tr>
            <td align="center" style="padding: 20px 0;">
                <a href="{action_url}" style="background-color: {color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Take Action
                </a>
            </td>
        </tr>
        '''
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(to right, #1a2744, #2a3754); padding: 24px; border-radius: 8px 8px 0 0;">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td>
                                            <h1 style="margin: 0; color: white; font-size: 20px; font-weight: bold;">
                                                Wealth Command
                                            </h1>
                                            <p style="margin: 4px 0 0; color: #D4A84C; font-size: 12px;">
                                                Advisor Intelligence Alert
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 32px 24px;">
                                <div style="border-left: 4px solid {color}; padding-left: 16px; margin-bottom: 24px;">
                                    <h2 style="margin: 0 0 8px; color: #1a2744; font-size: 18px;">
                                        {title}
                                    </h2>
                                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                        {message}
                                    </p>
                                </div>
                                
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                    {action_button}
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 24px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
                                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                    This is an automated alert from Wealth Command.<br>
                                    <a href="#" style="color: #6b7280;">Manage notification preferences</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    '''


# WebSocket endpoint
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket connection for real-time notifications."""
    connection_id = await manager.connect(websocket, user_id)
    
    try:
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "connection_id": connection_id,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Send any unread notifications
        unread = [n for n in NOTIFICATIONS if n.get("user_id") == user_id and not n.get("read")]
        if unread:
            await websocket.send_json({
                "type": "unread_notifications",
                "notifications": unread[-10:],  # Last 10 unread
                "total_unread": len(unread)
            })
        
        # Keep connection alive and listen for messages
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=30)
                
                # Handle different message types
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                elif data.get("type") == "mark_read":
                    notification_id = data.get("notification_id")
                    for n in NOTIFICATIONS:
                        if n.get("id") == notification_id:
                            n["read"] = True
                            break
                    await websocket.send_json({"type": "notification_marked_read", "id": notification_id})
                elif data.get("type") == "get_notifications":
                    user_notifications = [n for n in NOTIFICATIONS if n.get("user_id") == user_id][-50:]
                    await websocket.send_json({"type": "notifications_list", "notifications": user_notifications})
                    
            except asyncio.TimeoutError:
                # Send keepalive ping
                await websocket.send_json({"type": "ping"})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)


# REST API endpoints
@router.post("/send")
async def send_notification(
    notification: NotificationCreate,
    background_tasks: BackgroundTasks
):
    """Send a notification to a user."""
    result = await create_and_send_notification(
        user_id=notification.user_id,
        notification_type=notification.notification_type,
        title=notification.title,
        message=notification.message,
        priority=notification.priority,
        data=notification.data,
        action_url=notification.action_url,
        background_tasks=background_tasks
    )
    
    return {
        "success": True,
        "notification": result
    }


@router.post("/broadcast")
async def broadcast_notification(
    title: str,
    message: str,
    notification_type: str = "system",
    priority: str = "medium",
    exclude_users: List[str] = None
):
    """Broadcast notification to all connected users."""
    notification = {
        "id": f"notif_{uuid.uuid4().hex[:8]}",
        "type": notification_type,
        "title": title,
        "message": message,
        "priority": priority,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await manager.broadcast({
        "type": "broadcast",
        "notification": notification
    }, exclude_users=exclude_users or [])
    
    return {
        "success": True,
        "recipients": len(manager.get_connected_users()),
        "notification": notification
    }


@router.get("/user/{user_id}")
async def get_user_notifications(user_id: str, limit: int = 50, unread_only: bool = False):
    """Get notifications for a user."""
    user_notifications = [n for n in NOTIFICATIONS if n.get("user_id") == user_id]
    
    if unread_only:
        user_notifications = [n for n in user_notifications if not n.get("read")]
    
    user_notifications.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {
        "notifications": user_notifications[:limit],
        "total": len(user_notifications),
        "unread": len([n for n in user_notifications if not n.get("read")])
    }


@router.post("/user/{user_id}/mark-read")
async def mark_notifications_read(user_id: str, notification_ids: List[str] = None):
    """Mark notifications as read."""
    count = 0
    for n in NOTIFICATIONS:
        if n.get("user_id") == user_id:
            if notification_ids is None or n.get("id") in notification_ids:
                if not n.get("read"):
                    n["read"] = True
                    count += 1
    
    return {
        "success": True,
        "marked_read": count
    }


@router.get("/user/{user_id}/preferences")
async def get_notification_preferences(user_id: str):
    """Get notification preferences for a user."""
    return get_user_preferences(user_id)


@router.put("/user/{user_id}/preferences")
async def update_notification_preferences(user_id: str, preferences: Dict):
    """Update notification preferences for a user."""
    if user_id not in NOTIFICATION_PREFERENCES:
        NOTIFICATION_PREFERENCES[user_id] = {}
    
    NOTIFICATION_PREFERENCES[user_id].update(preferences)
    
    return {
        "success": True,
        "preferences": NOTIFICATION_PREFERENCES[user_id]
    }


@router.get("/connections")
async def get_active_connections():
    """Get list of active WebSocket connections."""
    return {
        "connected_users": manager.get_connected_users(),
        "total_connections": sum(len(conns) for conns in manager.active_connections.values())
    }


@router.post("/test-email")
async def test_email_notification(to_email: EmailStr, background_tasks: BackgroundTasks):
    """Send a test email notification."""
    html_content = generate_email_html(
        "Test Notification",
        "This is a test notification from Wealth Command. If you received this, email notifications are working correctly.",
        "system",
        None
    )
    
    background_tasks.add_task(
        send_email_notification,
        to_email,
        "Wealth Command Test Notification",
        html_content,
        "This is a test notification from Wealth Command."
    )
    
    return {
        "success": True,
        "message": f"Test email queued for delivery to {to_email}"
    }


# Alert triggers - these can be called from monitoring engine
@router.post("/trigger/portfolio-drift")
async def trigger_portfolio_drift_alert(
    user_id: str,
    client_name: str,
    client_id: str,
    drift_percent: float,
    background_tasks: BackgroundTasks
):
    """Trigger portfolio drift alert."""
    return await create_and_send_notification(
        user_id=user_id,
        notification_type="portfolio_drift",
        title=f"Portfolio Drift Alert: {client_name}",
        message=f"Portfolio has drifted {drift_percent:.1f}% from target allocation. Rebalancing recommended.",
        priority="high" if drift_percent > 10 else "medium",
        data={"client_id": client_id, "drift_percent": drift_percent},
        action_url=f"/client-wealth?client={client_id}",
        background_tasks=background_tasks
    )


@router.post("/trigger/tax-opportunity")
async def trigger_tax_opportunity_alert(
    user_id: str,
    client_name: str,
    client_id: str,
    potential_saving: float,
    opportunity_type: str,
    background_tasks: BackgroundTasks
):
    """Trigger tax opportunity alert."""
    return await create_and_send_notification(
        user_id=user_id,
        notification_type="tax_opportunity",
        title=f"Tax Opportunity: {client_name}",
        message=f"{opportunity_type} opportunity identified. Potential tax saving of ${potential_saving:,.0f}.",
        priority="high",
        data={"client_id": client_id, "potential_saving": potential_saving, "type": opportunity_type},
        action_url=f"/tax-analysis?client={client_id}",
        background_tasks=background_tasks
    )


@router.post("/trigger/compliance-due")
async def trigger_compliance_alert(
    user_id: str,
    client_name: str,
    client_id: str,
    review_type: str,
    days_until_due: int,
    background_tasks: BackgroundTasks
):
    """Trigger compliance review due alert."""
    priority = "critical" if days_until_due < 0 else "high" if days_until_due < 7 else "medium"
    
    return await create_and_send_notification(
        user_id=user_id,
        notification_type="compliance_due",
        title=f"{'OVERDUE: ' if days_until_due < 0 else ''}{review_type}: {client_name}",
        message=f"Client {review_type.lower()} is {'overdue by ' + str(abs(days_until_due)) + ' days' if days_until_due < 0 else 'due in ' + str(days_until_due) + ' days'}.",
        priority=priority,
        data={"client_id": client_id, "review_type": review_type, "days_until_due": days_until_due},
        action_url=f"/compliance?client={client_id}",
        background_tasks=background_tasks
    )


@router.post("/trigger/meeting-reminder")
async def trigger_meeting_reminder(
    user_id: str,
    client_name: str,
    client_id: str,
    meeting_time: str,
    meeting_type: str,
    background_tasks: BackgroundTasks
):
    """Trigger meeting reminder."""
    return await create_and_send_notification(
        user_id=user_id,
        notification_type="meeting_reminder",
        title=f"Upcoming Meeting: {client_name}",
        message=f"{meeting_type} scheduled for {meeting_time}. Click to prepare your meeting brief.",
        priority="medium",
        data={"client_id": client_id, "meeting_time": meeting_time, "meeting_type": meeting_type},
        action_url=f"/meeting-prep?client={client_id}",
        background_tasks=background_tasks
    )
