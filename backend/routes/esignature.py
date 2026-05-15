"""
E-Signature — inbound webhook endpoint + document freeze + audit trail.

When an external e-signature provider (DocuSign, Adobe Sign, signNow, etc.)
reports that a client has signed an SOA / ROA / engagement letter, it POSTs
to `/api/e-signature/event`. We:

  1. Validate the (optional) HMAC signature against ESIGNATURE_INBOUND_SECRET.
  2. Mark every storage_object in the document family as `is_frozen: true`
     so `_persist()` refuses new versions for that family (closes the Deal).
  3. Record a structured event in `rbac_audit` with action="document.signed".
  4. Emit an outbound `deal.signed` webhook so downstream subscribers
     (Slack, Zapier, audit warehouse) get notified.

Endpoints (under /api/e-signature):
  POST /event              inbound webhook from e-sign provider
  GET  /signed             list signed documents (audit replay)
  GET  /status/{family_key}  one document's signed status
"""
from fastapi import APIRouter, HTTPException, Request, BackgroundTasks, Query
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import hashlib
import hmac
import os
import uuid
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/e-signature", tags=["E-Signature"])

FILES_COL = "storage_objects"
AUDIT_COL = "rbac_audit"
DEALS_COL = "deals"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _verify_signature(secret: Optional[str], body: bytes, sig_header: Optional[str]) -> bool:
    """Constant-time HMAC verification — only enforced when a secret is set."""
    if not secret:
        return True  # no secret configured = open inbound (dev mode)
    if not sig_header:
        return False
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig_header)


class ESignatureEvent(BaseModel):
    family_key: str = Field(..., description="document family that was signed")
    signer_email: str
    signer_name: Optional[str] = None
    provider: str = Field("docusign", description="docusign | adobe_sign | signnow | manual")
    envelope_id: Optional[str] = None
    signed_at: Optional[str] = None
    client_id: Optional[str] = None
    deal_id: Optional[str] = None


@router.post("/event")
async def receive_event(
    payload: ESignatureEvent,
    request: Request,
    background: BackgroundTasks,
) -> dict:
    """Inbound webhook. Freezes the document family + records to rbac_audit."""
    # HMAC verification (optional — only enforced when ESIGNATURE_INBOUND_SECRET set)
    secret = os.environ.get("ESIGNATURE_INBOUND_SECRET")
    sig = request.headers.get("X-Esignature-Signature")
    body = await request.body()
    if not _verify_signature(secret, body, sig):
        raise HTTPException(401, "invalid signature")

    fk = payload.family_key
    # Confirm the family exists (at least one version)
    existing = await db[FILES_COL].find_one({"family_key": fk}, {"_id": 0, "object_id": 1, "version": 1})
    if not existing:
        raise HTTPException(404, f"document family '{fk}' not found in Vault")

    signed_at = payload.signed_at or _now()
    # Step 1 — freeze every version in this family.
    freeze_result = await db[FILES_COL].update_many(
        {"family_key": fk},
        {"$set": {
            "is_frozen": True,
            "frozen_at": signed_at,
            "signer_email": payload.signer_email,
            "signer_name": payload.signer_name,
            "envelope_id": payload.envelope_id,
            "provider": payload.provider,
        }},
    )

    # Step 2 — write to rbac_audit so compliance can replay.
    audit_id = f"esig_{uuid.uuid4().hex[:10]}"
    await db[AUDIT_COL].insert_one({
        "_id": audit_id,
        "audit_id": audit_id,
        "event": "document_signed",
        "family_key": fk,
        "client_id": payload.client_id,
        "deal_id": payload.deal_id,
        "signer_email": payload.signer_email,
        "signer_name": payload.signer_name,
        "provider": payload.provider,
        "envelope_id": payload.envelope_id,
        "versions_frozen": freeze_result.modified_count,
        "at": signed_at,
        "ip": request.client.host if request.client else "unknown",
    })

    # Step 3 — advance the linked Deal to "signed" stage if present.
    if payload.deal_id:
        try:
            await db[DEALS_COL].update_one(
                {"deal_id": payload.deal_id},
                {
                    "$set": {"stage": "signed", "signed_at": signed_at, "updated_at": _now()},
                    "$push": {"history": {
                        "at": signed_at, "event": "stage_changed",
                        "stage": "signed", "by": "e-signature webhook",
                        "envelope_id": payload.envelope_id,
                    }},
                },
            )
        except Exception as e:
            logger.warning(f"Failed to advance deal {payload.deal_id}: {e}")

    # Step 4 — fan out a deal.signed outbound webhook so subscribers see it.
    try:
        from routes.webhooks import emit
        await emit("deal.signed", {
            "family_key": fk,
            "client_id": payload.client_id,
            "deal_id": payload.deal_id,
            "signer_email": payload.signer_email,
            "provider": payload.provider,
            "envelope_id": payload.envelope_id,
            "signed_at": signed_at,
        }, background=background)
    except Exception as e:
        logger.warning(f"Outbound emit failed: {e}")

    return {
        "success": True,
        "family_key": fk,
        "versions_frozen": freeze_result.modified_count,
        "audit_id": audit_id,
        "deal_id": payload.deal_id,
    }


@router.get("/signed")
async def list_signed(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
) -> dict:
    """List every signed document family (audit replay)."""
    cur = db[AUDIT_COL].find(
        {"event": "document_signed"},
        {"_id": 0},
    ).sort("at", -1).skip(skip).limit(limit)
    rows = await cur.to_list(length=limit)
    total = await db[AUDIT_COL].count_documents({"event": "document_signed"})
    return {"signed": rows, "count": len(rows), "total": total}


@router.get("/status/{family_key}")
async def family_status(family_key: str) -> dict:
    """Return signed/frozen status for a single document family."""
    latest = await db[FILES_COL].find_one(
        {"family_key": family_key, "deleted": {"$ne": True}},
        {"_id": 0},
        sort=[("version", -1)],
    )
    if not latest:
        raise HTTPException(404, "family not found")
    return {
        "family_key": family_key,
        "is_frozen": bool(latest.get("is_frozen")),
        "frozen_at": latest.get("frozen_at"),
        "signer_email": latest.get("signer_email"),
        "signer_name": latest.get("signer_name"),
        "envelope_id": latest.get("envelope_id"),
        "provider": latest.get("provider"),
        "latest_version": latest.get("version"),
    }
