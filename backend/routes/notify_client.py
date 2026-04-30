"""
Client notification — sends email via Resend if RESEND_API_KEY is present,
otherwise records a MOCKED notification in the adviser action log.

Endpoints:
  POST /api/notify/client — send email to a client (or log mocked notification)
  GET  /api/notify/log    — list sent notifications (audit trail)
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import os
import uuid
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notify", tags=["Client Notifications"])
COLLECTION = "client_notifications"


class NotifyPayload(BaseModel):
    client_id: str
    client_name: Optional[str] = ""
    to_email: Optional[str] = None
    subject: str
    body: str
    source_item_id: Optional[str] = None
    actor: Optional[str] = "adviser"
    attachment_base64: Optional[str] = None  # base64 PDF content (no data: prefix)
    attachment_name: Optional[str] = None    # e.g. "SOA-Thompson-2026-04-30.pdf"


@router.post("/client")
async def notify_client(payload: NotifyPayload) -> dict:
    note_id = f"note_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    resend_key = os.environ.get("RESEND_API_KEY")
    mode = "live" if resend_key else "mocked"
    delivery_ref = None
    error = None

    if resend_key and payload.to_email:
        try:
            import resend
            resend.api_key = resend_key
            params = {
                "from": os.environ.get("RESEND_FROM_EMAIL", "adviser@wealth-command.app"),
                "to": [payload.to_email],
                "subject": payload.subject,
                "html": f"<pre style='font-family:system-ui;white-space:pre-wrap'>{payload.body}</pre>",
            }
            if payload.attachment_base64 and payload.attachment_name:
                # Resend expects a list of {filename, content} (base64 str)
                params["attachments"] = [{
                    "filename": payload.attachment_name,
                    "content": payload.attachment_base64,
                }]
            result = resend.Emails.send(params)
            delivery_ref = result.get("id") if isinstance(result, dict) else str(result)
        except Exception as e:
            logger.exception("Resend send failed")
            mode = "error"
            error = str(e)[:200]

    doc = {
        "_id": note_id,
        "note_id": note_id,
        "client_id": payload.client_id,
        "client_name": payload.client_name or "",
        "to_email": payload.to_email,
        "subject": payload.subject,
        "body": payload.body,
        "source_item_id": payload.source_item_id,
        "actor": payload.actor or "adviser",
        "mode": mode,
        "delivery_ref": delivery_ref,
        "error": error,
        "has_attachment": bool(payload.attachment_base64),
        "attachment_name": payload.attachment_name,
        "created_at": now,
    }
    await db[COLLECTION].insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "mode": mode, "notification": doc}


@router.get("/log")
async def list_notifications(client_id: Optional[str] = None, limit: int = 50) -> dict:
    q = {}
    if client_id:
        q["client_id"] = client_id
    cursor = db[COLLECTION].find(q, {"_id": 0}).sort("created_at", -1).limit(limit)
    notifications = await cursor.to_list(length=limit)
    return {"notifications": notifications, "total": len(notifications)}
