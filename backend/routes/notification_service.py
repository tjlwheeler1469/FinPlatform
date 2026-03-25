"""
Notification Service for Compliance Breaches
Email (SendGrid) and SMS (Twilio) notifications when compliance breaches are detected.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Compliance Notifications"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
notification_logs_col = db["notification_logs"]
notification_settings_col = db["notification_settings"]
breach_flags_col = db["breach_flags"]

# SendGrid and Twilio config
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")

# ==================== MODELS ====================

class NotificationSettings(BaseModel):
    licensee_id: str
    email_enabled: bool = True
    sms_enabled: bool = True
    email_recipients: List[str] = []
    sms_recipients: List[str] = []
    severity_threshold: str = "medium"  # low, medium, high, critical
    notify_on_override: bool = True
    daily_digest: bool = False
    digest_time: str = "09:00"

class NotificationRequest(BaseModel):
    breach_id: str
    breach_type: str
    severity: str
    adviser_id: str
    adviser_name: str = ""
    client_id: str = ""
    description: str
    override_occurred: bool = False
    override_reason: Optional[str] = None

# ==================== EMAIL FUNCTIONS ====================

async def send_email_notification(
    to_emails: List[str],
    subject: str,
    body_text: str,
    body_html: str
) -> Dict[str, Any]:
    """Send email via SendGrid or mock mode."""
    db = await get_mock_db()
    
    if not SENDGRID_API_KEY:
        # MOCK MODE - Log to database instead of sending
        logger.info(f"MOCK EMAIL: Sending to {to_emails}")
        mock_log = {
            "log_id": f"EMAIL-MOCK-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{os.urandom(3).hex().upper()}",
            "type": "email",
            "mode": "mock",
            "to": to_emails,
            "subject": subject,
            "body_text": body_text[:500],  # Truncate for storage
            "body_html_preview": body_html[:500] if body_html else None,
            "status": "mock_sent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": "Mock mode - Email logged but not actually sent. Add SENDGRID_API_KEY for real emails."
        }
        await db.mock_notifications.insert_one(mock_log)
        
        # Broadcast via WebSocket for real-time display
        try:
            from .websocket_service import broadcast_notification
            await broadcast_notification(
                "email",
                f"Email: {subject}",
                f"Mock email to: {', '.join(to_emails)}",
                {"recipients": to_emails, "subject": subject}
            )
        except Exception:
            pass
        
        return {"success": True, "mock": True, "log_id": mock_log["log_id"], "recipients": to_emails}
    
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail, Email, To, Content
        
        sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        message = Mail(
            from_email=Email("compliance@wealthcommand.com", "Wealth Command Compliance"),
            to_emails=[To(email) for email in to_emails],
            subject=subject,
            plain_text_content=Content("text/plain", body_text),
            html_content=Content("text/html", body_html)
        )
        
        response = sg.send(message)
        
        return {
            "success": True,
            "status_code": response.status_code,
            "recipients": to_emails
        }
    except Exception as e:
        logger.error(f"SendGrid error: {e}")
        return {"success": False, "error": str(e)}

async def get_mock_db():
    """Get database for mock notifications"""
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def send_sms_notification(
    to_numbers: List[str],
    message: str
) -> Dict[str, Any]:
    """Send SMS via Twilio or mock mode."""
    db = await get_mock_db()
    
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        # MOCK MODE - Log to database instead of sending
        logger.info(f"MOCK SMS: Sending to {to_numbers}")
        mock_log = {
            "log_id": f"SMS-MOCK-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{os.urandom(3).hex().upper()}",
            "type": "sms",
            "mode": "mock",
            "to": to_numbers,
            "message": message[:160],  # SMS character limit
            "status": "mock_sent",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": "Mock mode - SMS logged but not actually sent. Add TWILIO credentials for real SMS."
        }
        await db.mock_notifications.insert_one(mock_log)
        
        # Broadcast via WebSocket for real-time display
        try:
            from .websocket_service import broadcast_notification
            await broadcast_notification(
                "sms",
                "SMS Notification",
                f"Mock SMS to: {', '.join(to_numbers)}",
                {"recipients": to_numbers, "message_preview": message[:50]}
            )
        except Exception:
            pass
        
        return {"success": True, "mock": True, "log_id": mock_log["log_id"], "recipients": to_numbers}
    
    try:
        from twilio.rest import Client
        
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        results = []
        
        for phone in to_numbers:
            try:
                msg = twilio_client.messages.create(
                    body=message,
                    from_=TWILIO_PHONE_NUMBER,
                    to=phone
                )
                results.append({"phone": phone, "sid": msg.sid, "success": True})
            except Exception as e:
                results.append({"phone": phone, "error": str(e), "success": False})
        
        return {
            "success": all(r["success"] for r in results),
            "results": results
        }
    except Exception as e:
        logger.error(f"Twilio error: {e}")
        return {"success": False, "error": str(e)}

# ==================== NOTIFICATION TEMPLATES ====================

def generate_breach_email(notification: NotificationRequest) -> tuple:
    """Generate email content for breach notification."""
    severity_colors = {
        "critical": "#DC2626",
        "high": "#EA580C",
        "medium": "#CA8A04",
        "low": "#16A34A"
    }
    color = severity_colors.get(notification.severity, "#6B7280")
    
    subject = f"⚠️ Compliance Breach Alert - {notification.severity.upper()}: {notification.breach_type}"
    
    body_text = f"""
COMPLIANCE BREACH NOTIFICATION
================================

Severity: {notification.severity.upper()}
Type: {notification.breach_type}
Adviser: {notification.adviser_name or notification.adviser_id}
Client: {notification.client_id}

Description:
{notification.description}

{"OVERRIDE OCCURRED" if notification.override_occurred else ""}
{f"Override Reason: {notification.override_reason}" if notification.override_reason else ""}

Action Required:
Please review this breach in the Wealth Command compliance dashboard.

This is an automated notification from Wealth Command AdviceOS.
    """
    
    body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {color}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }}
        .severity-badge {{ display: inline-block; padding: 4px 12px; background: {color}; color: white; border-radius: 4px; font-weight: bold; }}
        .override-alert {{ background: #FEF3C7; border: 1px solid #D97706; padding: 15px; border-radius: 4px; margin: 15px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
        .btn {{ display: inline-block; padding: 10px 20px; background: #D4A84C; color: #000; text-decoration: none; border-radius: 4px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>⚠️ Compliance Breach Notification</h2>
        </div>
        <div class="content">
            <p><span class="severity-badge">{notification.severity.upper()}</span></p>
            
            <h3>{notification.breach_type}</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0;"><strong>Adviser:</strong></td>
                    <td>{notification.adviser_name or notification.adviser_id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Client:</strong></td>
                    <td>{notification.client_id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0;"><strong>Breach ID:</strong></td>
                    <td style="font-family: monospace;">{notification.breach_id}</td>
                </tr>
            </table>
            
            <p><strong>Description:</strong></p>
            <p style="background: #fff; padding: 15px; border-left: 4px solid {color};">{notification.description}</p>
            
            {"<div class='override-alert'><strong>⚠️ OVERRIDE OCCURRED</strong><br/>Adviser overrode compliance guidance.<br/><br/><strong>Reason:</strong> " + (notification.override_reason or "Not provided") + "</div>" if notification.override_occurred else ""}
            
            <p style="text-align: center; margin-top: 20px;">
                <a href="#" class="btn">Review in Dashboard</a>
            </p>
        </div>
        <div class="footer">
            This is an automated notification from Wealth Command AdviceOS.<br/>
            © 2026 Wealth Command - Compliance-First Financial Platform
        </div>
    </div>
</body>
</html>
    """
    
    return subject, body_text, body_html

def generate_breach_sms(notification: NotificationRequest) -> str:
    """Generate SMS content for breach notification."""
    return f"""WEALTH COMMAND ALERT
{notification.severity.upper()} Breach: {notification.breach_type}
Adviser: {notification.adviser_name or notification.adviser_id}
{"⚠️ OVERRIDE OCCURRED" if notification.override_occurred else ""}
Review required in compliance dashboard."""

# ==================== API ENDPOINTS ====================

@router.post("/settings")
async def save_notification_settings(settings: NotificationSettings):
    """Save notification settings for a licensee."""
    settings_dict = settings.model_dump()
    settings_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await notification_settings_col.update_one(
        {"licensee_id": settings.licensee_id},
        {"$set": settings_dict},
        upsert=True
    )
    
    return {"success": True, "message": "Notification settings saved"}

@router.get("/settings/{licensee_id}")
async def get_notification_settings(licensee_id: str):
    """Get notification settings for a licensee."""
    settings = await notification_settings_col.find_one(
        {"licensee_id": licensee_id},
        {"_id": 0}
    )
    
    if not settings:
        # Return defaults
        return {
            "licensee_id": licensee_id,
            "email_enabled": True,
            "sms_enabled": True,
            "email_recipients": [],
            "sms_recipients": [],
            "severity_threshold": "medium",
            "notify_on_override": True,
            "daily_digest": False,
            "digest_time": "09:00"
        }
    
    return settings

@router.post("/send-breach-alert")
async def send_breach_alert(
    notification: NotificationRequest,
    background_tasks: BackgroundTasks
):
    """
    Send breach notification via email and SMS.
    Triggered automatically when a compliance breach is detected.
    """
    # Get licensee settings
    settings = await notification_settings_col.find_one(
        {"licensee_id": "lic_default"},  # Would normally get from breach
        {"_id": 0}
    )
    
    if not settings:
        settings = {
            "email_enabled": True,
            "sms_enabled": True,
            "email_recipients": ["compliance@demo.com"],
            "sms_recipients": ["+61400000000"],
            "severity_threshold": "medium",
            "notify_on_override": True
        }
    
    # Check severity threshold
    severity_levels = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    threshold_level = severity_levels.get(settings.get("severity_threshold", "medium"), 2)
    breach_level = severity_levels.get(notification.severity, 2)
    
    if breach_level < threshold_level and not (notification.override_occurred and settings.get("notify_on_override")):
        return {
            "success": True,
            "message": "Breach below notification threshold",
            "email_sent": False,
            "sms_sent": False
        }
    
    results = {
        "breach_id": notification.breach_id,
        "email_sent": False,
        "sms_sent": False
    }
    
    # Send email notification
    if settings.get("email_enabled") and settings.get("email_recipients"):
        subject, body_text, body_html = generate_breach_email(notification)
        email_result = await send_email_notification(
            settings["email_recipients"],
            subject,
            body_text,
            body_html
        )
        results["email_sent"] = email_result.get("success", False)
        results["email_result"] = email_result
    
    # Send SMS notification
    if settings.get("sms_enabled") and settings.get("sms_recipients"):
        sms_message = generate_breach_sms(notification)
        sms_result = await send_sms_notification(
            settings["sms_recipients"],
            sms_message
        )
        results["sms_sent"] = sms_result.get("success", False)
        results["sms_result"] = sms_result
    
    # Log notification
    log_entry = {
        "breach_id": notification.breach_id,
        "notification_type": "breach_alert",
        "severity": notification.severity,
        "email_sent": results["email_sent"],
        "sms_sent": results["sms_sent"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await notification_logs_col.insert_one(log_entry)
    
    return results

@router.post("/test-email")
async def test_email_notification(email: str):
    """Send a test email notification."""
    result = await send_email_notification(
        [email],
        "Test: Wealth Command Compliance Notification",
        "This is a test notification from Wealth Command AdviceOS compliance system.",
        "<h2>Test Notification</h2><p>This is a test notification from Wealth Command AdviceOS compliance system.</p>"
    )
    return {"success": result.get("success", False), "result": result}

@router.post("/test-sms")
async def test_sms_notification(phone: str):
    """Send a test SMS notification."""
    result = await send_sms_notification(
        [phone],
        "Test: Wealth Command Compliance Alert System - If you received this, SMS notifications are working."
    )
    return {"success": result.get("success", False), "result": result}

@router.get("/logs")
async def get_notification_logs(
    limit: int = 50,
    breach_id: Optional[str] = None
):
    """Get notification logs."""
    query = {}
    if breach_id:
        query["breach_id"] = breach_id
    
    logs = await notification_logs_col.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "logs": logs,
        "count": len(logs)
    }

@router.get("/status")
async def get_notification_status():
    """Check notification service status."""
    return {
        "email": {
            "provider": "SendGrid",
            "configured": bool(SENDGRID_API_KEY),
            "status": "ready" if SENDGRID_API_KEY else "mock_mode"
        },
        "sms": {
            "provider": "Twilio",
            "configured": all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]),
            "status": "ready" if all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]) else "mock_mode"
        },
        "mock_mode_note": "When not configured, notifications are logged to database and broadcast via WebSocket for real-time display. Add API keys to send real notifications.",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/mock-notifications")
async def get_mock_notifications(limit: int = 50, notification_type: Optional[str] = None):
    """Get mock notifications (sent in mock mode)."""
    db = await get_mock_db()
    
    query = {}
    if notification_type:
        query["type"] = notification_type
    
    notifications = await db.mock_notifications.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    return {
        "notifications": notifications,
        "total": len(notifications),
        "mode": "mock",
        "note": "These notifications were logged but not actually sent. Add SendGrid/Twilio API keys for real delivery."
    }

@router.post("/send-test-mock")
async def send_test_mock_notification(email: str = "test@example.com", phone: str = "+61400000000"):
    """Send test notifications in mock mode to verify logging works."""
    email_result = await send_email_notification(
        [email],
        "Test: AdviceOS Mock Email Notification",
        "This is a test mock email from AdviceOS. If you see this in the logs, mock mode is working correctly.",
        "<h2>Test Mock Email</h2><p>This is a test mock email from AdviceOS.</p><p>Mock mode is working correctly.</p>"
    )
    
    sms_result = await send_sms_notification(
        [phone],
        "Test: AdviceOS Mock SMS - If you see this in logs, mock mode is working."
    )
    
    return {
        "email_result": email_result,
        "sms_result": sms_result,
        "message": "Test notifications sent in mock mode. Check /api/notifications/mock-notifications to see logged messages."
    }

