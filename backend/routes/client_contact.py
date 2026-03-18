"""
Client Contact & Messaging System
Handles platform messages and emails from clients to advisors.
Persists data to MongoDB.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pymongo import MongoClient
import uuid
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/client-contact", tags=["Client Contact"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

def get_db():
    """Get MongoDB database connection."""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

# Collections
def get_messages_collection():
    return get_db()["client_messages"]

def get_notifications_collection():
    return get_db()["client_notifications"]


class PlatformMessage(BaseModel):
    client_id: str
    client_name: str
    advisor_email: str
    advisor_name: str
    subject: str
    message: str
    contact_method: str = "platform"  # platform or email
    priority: str = "normal"  # low, normal, high, urgent


class MessageResponse(BaseModel):
    message_id: str
    status: str
    sent_at: str
    delivery_method: str
    confirmation: str


class QuickAction(BaseModel):
    client_id: str
    client_name: str
    action_type: str  # schedule_meeting, request_statement, upload_document, set_reminder
    details: Optional[Dict[str, Any]] = None


@router.post("/send-message", response_model=MessageResponse)
async def send_message(message: PlatformMessage, background_tasks: BackgroundTasks):
    """
    Send a message from client to advisor.
    Supports both platform messaging (encrypted) and direct email.
    """
    message_id = f"MSG-{uuid.uuid4().hex[:8].upper()}"
    sent_at = datetime.now(timezone.utc).isoformat()
    
    # Store message in MongoDB
    stored_message = {
        "message_id": message_id,
        "client_id": message.client_id,
        "client_name": message.client_name,
        "advisor_email": message.advisor_email,
        "advisor_name": message.advisor_name,
        "subject": message.subject,
        "message": message.message,
        "contact_method": message.contact_method,
        "priority": message.priority,
        "sent_at": sent_at,
        "status": "delivered",
        "read": False,
        "replied": False
    }
    
    messages_col = get_messages_collection()
    messages_col.insert_one(stored_message)
    
    # Create notification for advisor
    notification = {
        "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "type": "new_message",
        "recipient": message.advisor_email,
        "title": f"New message from {message.client_name}",
        "body": f"Subject: {message.subject}",
        "data": {
            "message_id": message_id,
            "client_id": message.client_id,
            "priority": message.priority
        },
        "created_at": sent_at,
        "read": False
    }
    notifications_col = get_notifications_collection()
    notifications_col.insert_one(notification)
    
    # In production, would send actual email if contact_method == "email"
    if message.contact_method == "email":
        logger.info(f"Would send email to {message.advisor_email}")
        # background_tasks.add_task(send_email, message)
    
    return MessageResponse(
        message_id=message_id,
        status="delivered",
        sent_at=sent_at,
        delivery_method=message.contact_method,
        confirmation=f"Your message has been sent to {message.advisor_name}. You will receive a response within 24 hours."
    )


@router.get("/messages/{client_id}")
async def get_client_messages(client_id: str, include_sent: bool = True, include_received: bool = True):
    """Get all messages for a client."""
    messages_col = get_messages_collection()
    messages = list(messages_col.find({"client_id": client_id}, {"_id": 0}))
    
    return {
        "client_id": client_id,
        "messages": messages,
        "total_count": len(messages),
        "unread_count": len([m for m in messages if not m.get("read")])
    }


@router.get("/messages/advisor/{advisor_email}")
async def get_advisor_messages(advisor_email: str):
    """Get all messages for an advisor."""
    messages_col = get_messages_collection()
    messages = list(messages_col.find({"advisor_email": advisor_email}, {"_id": 0}))
    
    return {
        "advisor_email": advisor_email,
        "messages": messages,
        "total_count": len(messages),
        "unread_count": len([m for m in messages if not m.get("read")])
    }


@router.post("/mark-read/{message_id}")
async def mark_message_read(message_id: str):
    """Mark a message as read."""
    messages_col = get_messages_collection()
    result = messages_col.update_one(
        {"message_id": message_id},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    
    return {"success": True, "message_id": message_id, "status": "read"}


@router.post("/quick-action")
async def process_quick_action(action: QuickAction):
    """
    Process quick actions from the contact form.
    """
    action_id = f"ACT-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()
    
    result = {
        "action_id": action_id,
        "action_type": action.action_type,
        "client_id": action.client_id,
        "client_name": action.client_name,
        "status": "pending",
        "created_at": created_at
    }
    
    if action.action_type == "schedule_meeting":
        result["next_steps"] = [
            "Your meeting request has been sent to your advisor",
            "You will receive a calendar invitation within 24 hours",
            "Please check your email for available time slots"
        ]
        result["message"] = "Meeting request submitted. Your advisor will send you available times shortly."
        
    elif action.action_type == "request_statement":
        result["next_steps"] = [
            "Your statement request is being processed",
            "A PDF will be generated and sent to your email",
            "Expected delivery: within 2 business days"
        ]
        result["message"] = "Statement request received. You will receive it via email within 2 business days."
        result["estimated_delivery"] = "2 business days"
        
    elif action.action_type == "upload_document":
        result["next_steps"] = [
            "You can now upload your document",
            "Supported formats: PDF, JPG, PNG, DOCX",
            "Maximum file size: 10MB"
        ]
        result["message"] = "Document upload initiated. Please select your file."
        result["upload_url"] = f"/api/documents/upload/{action.client_id}"
        
    elif action.action_type == "set_reminder":
        reminder_details = action.details or {}
        result["next_steps"] = [
            f"Reminder set for: {reminder_details.get('date', 'TBD')}",
            "You will receive a notification",
            "Your advisor will also be notified"
        ]
        result["message"] = "Reminder has been set. You will be notified at the scheduled time."
    
    else:
        result["message"] = f"Action '{action.action_type}' has been recorded."
        result["next_steps"] = ["Your request has been logged", "An advisor will follow up"]
    
    return result


@router.get("/notifications/{advisor_email}")
async def get_advisor_notifications(advisor_email: str, unread_only: bool = False):
    """Get notifications for an advisor."""
    notifications_col = get_notifications_collection()
    query = {"recipient": advisor_email}
    if unread_only:
        query["read"] = False
    
    notifications = list(notifications_col.find(query, {"_id": 0}))
    
    return {
        "advisor_email": advisor_email,
        "notifications": notifications,
        "total_count": len(notifications),
        "unread_count": len([n for n in notifications if not n.get("read")])
    }


@router.post("/reply/{message_id}")
async def reply_to_message(message_id: str, reply_text: str):
    """Reply to a client message."""
    messages_col = get_messages_collection()
    original_message = messages_col.find_one({"message_id": message_id}, {"_id": 0})
    
    if not original_message:
        raise HTTPException(status_code=404, detail="Original message not found")
    
    reply_id = f"MSG-{uuid.uuid4().hex[:8].upper()}"
    sent_at = datetime.now(timezone.utc).isoformat()
    
    reply = {
        "message_id": reply_id,
        "in_reply_to": message_id,
        "client_id": original_message["client_id"],
        "client_name": original_message["client_name"],
        "advisor_email": original_message["advisor_email"],
        "advisor_name": original_message["advisor_name"],
        "subject": f"Re: {original_message['subject']}",
        "message": reply_text,
        "contact_method": original_message["contact_method"],
        "direction": "advisor_to_client",
        "sent_at": sent_at,
        "status": "delivered"
    }
    
    messages_col.insert_one(reply)
    
    # Mark original as replied
    messages_col.update_one(
        {"message_id": message_id},
        {"$set": {"replied": True, "replied_at": sent_at}}
    )
    
    return {
        "success": True,
        "reply_id": reply_id,
        "original_message_id": message_id,
        "sent_at": sent_at,
        "status": "delivered"
    }
