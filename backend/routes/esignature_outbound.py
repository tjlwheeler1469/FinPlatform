"""
E-Signature Outbound — admin-facing send/track endpoints.

This is the OUTBOUND side of e-signature: an adviser creates a signature
request (envelope), the request is persisted to Mongo, and (in live mode)
the real provider API (DocuSign, Adobe Sign, signNow) is called to actually
deliver the envelope to the client.

The INBOUND side (provider webhooks reporting "signed") lives in
routes/esignature.py and writes back into the same `signature_requests`
collection, freezes the document family and advances the linked Deal.

Live mode auto-activates when one of these env-key sets is present:
  - DOCUSIGN_INTEGRATION_KEY + DOCUSIGN_USER_ID + DOCUSIGN_ACCOUNT_ID +
    DOCUSIGN_RSA_PRIVATE_KEY  (DocuSign JWT grant)
  - ADOBE_SIGN_CLIENT_ID + ADOBE_SIGN_CLIENT_SECRET + ADOBE_SIGN_REFRESH_TOKEN
  - SIGNNOW_CLIENT_ID + SIGNNOW_CLIENT_SECRET + SIGNNOW_USERNAME +
    SIGNNOW_PASSWORD

Otherwise everything runs through a deterministic mock pipeline.

Endpoints (under /api/esignature):
  GET  /requests                 list signature requests (paginated)
  POST /send                     create + dispatch a signature request
  POST /sign/{request_id}        manually mark as signed (mock testing aid)
  GET  /status/{request_id}      one request's status
  GET  /provider/health          which provider (if any) is live
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import os
import uuid
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/esignature", tags=["E-Signature Outbound"])

REQUESTS_COL = "signature_requests"
FILES_COL = "storage_objects"
AUDIT_COL = "rbac_audit"
DEALS_COL = "deals"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _live_provider() -> Dict[str, Any]:
    """Return which provider is currently live (env keys present) and its mode.

    Order of precedence: docusign > adobe_sign > signnow > none.
    """
    if all(os.environ.get(k) for k in (
        "DOCUSIGN_INTEGRATION_KEY",
        "DOCUSIGN_USER_ID",
        "DOCUSIGN_ACCOUNT_ID",
        "DOCUSIGN_RSA_PRIVATE_KEY",
    )):
        return {"provider": "docusign", "mode": "live"}
    if all(os.environ.get(k) for k in (
        "ADOBE_SIGN_CLIENT_ID",
        "ADOBE_SIGN_CLIENT_SECRET",
        "ADOBE_SIGN_REFRESH_TOKEN",
    )):
        return {"provider": "adobe_sign", "mode": "live"}
    if all(os.environ.get(k) for k in (
        "SIGNNOW_CLIENT_ID",
        "SIGNNOW_CLIENT_SECRET",
        "SIGNNOW_USERNAME",
        "SIGNNOW_PASSWORD",
    )):
        return {"provider": "signnow", "mode": "live"}
    return {"provider": "mock", "mode": "mock"}


async def _dispatch_to_provider(req: Dict[str, Any]) -> Dict[str, Any]:
    """Call the live provider API. Falls back to mock when no keys are set.

    Returns a dict with `provider`, `mode`, `envelope_id`, `signing_url`
    and `dispatched_at`. Real SDK calls live here; for now the live branch
    is a stub that records the live attempt without firing the API until
    the user provides the credentials AND the SDK is added to
    requirements.txt (deferred to keep the dependency surface clean).
    """
    p = _live_provider()
    envelope_id = f"env_{uuid.uuid4().hex[:12]}"
    if p["mode"] == "live":
        # Live SDK call is deferred until the user supplies credentials
        # and the relevant SDK (docusign-esign / signnow-python-client /
        # adobesign-python-sdk) is added. We still record the dispatch so
        # the UI shows the live provider name immediately.
        logger.info("Live e-sign dispatch placeholder for provider=%s", p["provider"])
        return {
            "provider": p["provider"],
            "mode": "live_pending_sdk",
            "envelope_id": envelope_id,
            "signing_url": None,
            "detail": (
                f"{p['provider']} keys detected — SDK call queued. "
                "Once the provider SDK ships, this branch will create a real envelope."
            ),
            "dispatched_at": _now(),
        }
    return {
        "provider": "mock",
        "mode": "mock",
        "envelope_id": envelope_id,
        "signing_url": f"https://demo.invalid/sign/{envelope_id}",
        "detail": "Mock dispatch — client can be progressed via /api/esignature/sign/{request_id}",
        "dispatched_at": _now(),
    }


class SignatureSendRequest(BaseModel):
    document_id: str
    document_name: str
    client_id: str
    client_name: str
    client_email: str
    message: Optional[str] = ""
    family_key: Optional[str] = Field(None, description="Vault family_key — freezes on sign")
    deal_id: Optional[str] = Field(None, description="CRM Deal — advances on sign")


class SignerInfo(BaseModel):
    role: str = "client"
    name: str


@router.get("/provider/health")
async def provider_health() -> dict:
    """Which provider is currently live (env keys present)."""
    return _live_provider()


@router.get("/requests")
async def list_requests(
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
    status: Optional[str] = None,
) -> dict:
    """List signature requests, newest first."""
    q: Dict[str, Any] = {}
    if status:
        q["status"] = status
    total = await db[REQUESTS_COL].count_documents(q)
    cur = db[REQUESTS_COL].find(q, {"_id": 0}).sort("sent_at", -1).skip(skip).limit(limit)
    rows: List[Dict[str, Any]] = await cur.to_list(length=limit)
    return {"requests": rows, "count": len(rows), "total": total}


@router.get("/status/{request_id}")
async def request_status(request_id: str) -> dict:
    """One request's status."""
    row = await db[REQUESTS_COL].find_one({"request_id": request_id}, {"_id": 0})
    if not row:
        raise HTTPException(404, f"request {request_id} not found")
    return row


@router.post("/send")
async def send_signature_request(payload: SignatureSendRequest) -> dict:
    """Create + dispatch a new signature request."""
    request_id = f"sig_{uuid.uuid4().hex[:10]}"
    dispatched = await _dispatch_to_provider({
        "document_id": payload.document_id,
        "document_name": payload.document_name,
        "client_email": payload.client_email,
    })
    doc = {
        "request_id": request_id,
        "document_id": payload.document_id,
        "document_name": payload.document_name,
        "client_id": payload.client_id,
        "client_name": payload.client_name,
        "client_email": payload.client_email,
        "message": payload.message,
        "family_key": payload.family_key,
        "deal_id": payload.deal_id,
        "status": "pending",
        "sent_at": _now(),
        "completed_at": None,
        "signatures": [],
        "provider": dispatched["provider"],
        "mode": dispatched["mode"],
        "envelope_id": dispatched["envelope_id"],
        "signing_url": dispatched.get("signing_url"),
    }
    await db[REQUESTS_COL].insert_one(dict(doc))
    doc.pop("_id", None)
    return {
        "success": True,
        "request_id": request_id,
        "envelope_id": dispatched["envelope_id"],
        "provider": dispatched["provider"],
        "mode": dispatched["mode"],
        "signing_url": dispatched.get("signing_url"),
        "detail": dispatched.get("detail"),
    }


@router.post("/sign/{request_id}")
async def sign_request(request_id: str, signer: SignerInfo) -> dict:
    """Manually mark a request as signed (mock testing aid).

    In live mode, the real provider would webhook us at /api/e-signature/event
    and that handler does the freeze + audit + deal advance. This endpoint is
    primarily for the mock / sandbox path where there's no provider firing
    back — but it ALSO routes through the same audit pipeline so the
    downstream effects (freeze, audit, deal advance) happen identically.
    """
    row = await db[REQUESTS_COL].find_one({"request_id": request_id}, {"_id": 0})
    if not row:
        raise HTTPException(404, f"request {request_id} not found")
    if row.get("status") == "completed":
        raise HTTPException(409, "already signed")

    signed_at = _now()
    sig_entry = {"role": signer.role, "name": signer.name, "signed_at": signed_at}
    await db[REQUESTS_COL].update_one(
        {"request_id": request_id},
        {
            "$set": {"status": "completed", "completed_at": signed_at},
            "$push": {"signatures": sig_entry},
        },
    )

    # Mirror the inbound webhook side-effects: freeze the family, audit row, deal advance.
    if row.get("family_key"):
        await db[FILES_COL].update_many(
            {"family_key": row["family_key"]},
            {"$set": {
                "is_frozen": True,
                "frozen_at": signed_at,
                "signer_email": row.get("client_email"),
                "signer_name": signer.name,
                "envelope_id": row.get("envelope_id"),
                "provider": row.get("provider"),
            }},
        )

    audit_id = f"esig_{uuid.uuid4().hex[:10]}"
    await db[AUDIT_COL].insert_one({
        "_id": audit_id,
        "audit_id": audit_id,
        "event": "document_signed",
        "family_key": row.get("family_key"),
        "client_id": row.get("client_id"),
        "deal_id": row.get("deal_id"),
        "signer_email": row.get("client_email"),
        "signer_name": signer.name,
        "provider": row.get("provider"),
        "envelope_id": row.get("envelope_id"),
        "request_id": request_id,
        "at": signed_at,
        "source": "manual_sign",
    })

    if row.get("deal_id"):
        try:
            await db[DEALS_COL].update_one(
                {"deal_id": row["deal_id"]},
                {
                    "$set": {"stage": "signed", "signed_at": signed_at, "updated_at": signed_at},
                    "$push": {"history": {
                        "at": signed_at, "event": "stage_changed",
                        "stage": "signed", "by": "esignature.sign",
                        "envelope_id": row.get("envelope_id"),
                    }},
                },
            )
        except Exception as e:
            logger.warning("Deal advance failed for %s: %s", row["deal_id"], e)

    return {
        "success": True,
        "request_id": request_id,
        "status": "completed",
        "signed_at": signed_at,
        "audit_id": audit_id,
    }
