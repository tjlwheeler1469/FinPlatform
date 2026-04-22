"""
Resend Email Service — transactional emails (invoice delivery, client pack, message-adviser).
All calls run async via asyncio.to_thread since resend SDK is sync.
"""
import os
import asyncio
import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/email-resend", tags=["Email (Resend)"])

# Lazy-imported so the backend still boots if `resend` isn't installed yet.
try:
    import resend  # type: ignore
    _RESEND_INSTALLED = True
except Exception:  # pragma: no cover
    resend = None
    _RESEND_INSTALLED = False


def _get_api_key() -> Optional[str]:
    return os.environ.get("RESEND_API_KEY")


def _get_sender() -> str:
    return os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str
    cc: Optional[List[EmailStr]] = None
    from_name: Optional[str] = None


class EmailResponse(BaseModel):
    status: str
    message: str
    email_id: Optional[str] = None
    mocked: bool = False


@router.get("/status")
async def email_status() -> dict:
    """Quick check so the UI can show a 'MOCKED' badge when no API key is set."""
    key = _get_api_key()
    return {
        "sdk_installed": _RESEND_INSTALLED,
        "api_key_configured": bool(key),
        "sender_email": _get_sender(),
        "mode": "live" if (_RESEND_INSTALLED and key) else "mocked",
    }


@router.post("/send", response_model=EmailResponse)
async def send_email(request: EmailRequest) -> EmailResponse:
    """
    Send a transactional email via Resend.
    Falls back to a mocked success response (logged, not sent) when the SDK
    isn't installed or RESEND_API_KEY is missing — so dev environments don't error.
    """
    key = _get_api_key()
    if not _RESEND_INSTALLED or not key:
        logger.info(
            "[email.send MOCKED] to=%s subject=%r (resend sdk=%s, key=%s)",
            request.recipient_email, request.subject, _RESEND_INSTALLED, bool(key),
        )
        return EmailResponse(
            status="mocked",
            message=f"MOCKED — would send to {request.recipient_email}. Set RESEND_API_KEY to send for real.",
            mocked=True,
        )

    resend.api_key = key
    from_line = f"{request.from_name} <{_get_sender()}>" if request.from_name else _get_sender()
    params = {
        "from": from_line,
        "to": [str(request.recipient_email)],
        "subject": request.subject,
        "html": request.html_content,
    }
    if request.cc:
        params["cc"] = [str(c) for c in request.cc]

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return EmailResponse(
            status="sent",
            message=f"Email sent to {request.recipient_email}",
            email_id=(result or {}).get("id"),
            mocked=False,
        )
    except Exception as exc:
        logger.exception("Resend send failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to send email: {exc}")
