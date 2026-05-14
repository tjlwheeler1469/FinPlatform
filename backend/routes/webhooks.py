"""
Webhooks — Outbound event-driven integration layer.

When key events occur in the platform (deal stage transition, SOA signed,
threshold breach, etc.), we fire HTTP POSTs to every subscriber URL listening
on that event type. Each delivery is logged in `webhook_events` with status,
HTTP code, response excerpt and retry count.

Subscribers register a (event_type, target_url, secret) tuple. The secret is
used to HMAC-sign every payload — subscribers verify via the `X-Halcyon-Signature`
header.

Endpoints (under /api/webhooks):
  GET    /subscriptions               list all subscriptions
  POST   /subscriptions               create
  DELETE /subscriptions/{sub_id}
  PATCH  /subscriptions/{sub_id}      enable/disable
  GET    /events                      paginated event log
  POST   /events/{event_id}/retry     manual retry of a failed delivery

Event taxonomy (use these in `event_type`):
  deal.created · deal.stage_changed · deal.signed · deal.executed
  pack.created · pack.notify_sent
  doc.uploaded · doc.versioned · doc.restored
  threshold.confidence_drop · threshold.budget_surplus_drop
  ticket.dispatched · ticket.settled · ticket.failed
"""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import httpx
import hashlib
import hmac
import uuid
import json
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

SUBS = "webhook_subscriptions"
EVENTS = "webhook_events"

VALID_EVENT_TYPES = (
    "deal.created", "deal.stage_changed", "deal.signed", "deal.executed",
    "pack.created", "pack.notify_sent",
    "doc.uploaded", "doc.versioned", "doc.restored",
    "threshold.confidence_drop", "threshold.budget_surplus_drop",
    "ticket.dispatched", "ticket.settled", "ticket.failed",
)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sign(secret: str, body: bytes) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


class SubCreate(BaseModel):
    event_type: str = Field(..., description="dot.path event name")
    target_url: str
    secret: Optional[str] = None
    description: Optional[str] = ""
    active: bool = True


class SubPatch(BaseModel):
    active: Optional[bool] = None
    target_url: Optional[str] = None
    description: Optional[str] = None


@router.get("/subscriptions")
async def list_subs() -> dict:
    cur = db[SUBS].find({}, {"_id": 0, "secret": 0}).sort("created_at", -1)
    rows = await cur.to_list(length=200)
    return {"subscriptions": rows, "count": len(rows), "valid_event_types": list(VALID_EVENT_TYPES)}


@router.post("/subscriptions")
async def create_sub(payload: SubCreate) -> dict:
    if payload.event_type not in VALID_EVENT_TYPES:
        raise HTTPException(400, f"event_type must be one of {VALID_EVENT_TYPES}")
    sub_id = f"sub_{uuid.uuid4().hex[:10]}"
    secret = payload.secret or uuid.uuid4().hex
    doc = {
        "_id": sub_id,
        "sub_id": sub_id,
        "event_type": payload.event_type,
        "target_url": payload.target_url,
        "secret": secret,
        "description": payload.description or "",
        "active": payload.active,
        "created_at": _now(),
        "last_fired_at": None,
        "fire_count": 0,
        "success_count": 0,
        "failure_count": 0,
    }
    await db[SUBS].insert_one(doc)
    # Return secret once on creation so the subscriber can verify signatures
    return {"sub_id": sub_id, "secret": secret, **{k: v for k, v in doc.items() if k not in ("_id", "secret")}}


@router.patch("/subscriptions/{sub_id}")
async def patch_sub(sub_id: str, patch: SubPatch) -> dict:
    sets = {k: v for k, v in patch.dict(exclude_none=True).items()}
    if not sets:
        raise HTTPException(400, "empty update")
    sets["updated_at"] = _now()
    res = await db[SUBS].update_one({"sub_id": sub_id}, {"$set": sets})
    if res.matched_count == 0:
        raise HTTPException(404, "subscription not found")
    return await db[SUBS].find_one({"sub_id": sub_id}, {"_id": 0, "secret": 0})


@router.delete("/subscriptions/{sub_id}")
async def delete_sub(sub_id: str) -> dict:
    res = await db[SUBS].delete_one({"sub_id": sub_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "subscription not found")
    return {"success": True, "sub_id": sub_id}


@router.get("/events")
async def list_events(
    event_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
) -> dict:
    q: Dict[str, Any] = {}
    if event_type:
        q["event_type"] = event_type
    if status:
        q["status"] = status
    cur = db[EVENTS].find(q, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    rows = await cur.to_list(length=limit)
    total = await db[EVENTS].count_documents(q)
    return {"events": rows, "count": len(rows), "total": total}


@router.post("/events/{event_id}/retry")
async def retry_event(event_id: str, background: BackgroundTasks) -> dict:
    event = await db[EVENTS].find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(404, "event not found")
    sub = await db[SUBS].find_one({"sub_id": event["sub_id"]}, {"_id": 0})
    if not sub:
        raise HTTPException(404, "subscription gone")
    background.add_task(_deliver, sub, event["payload"], event_id)
    return {"success": True, "event_id": event_id, "queued_retry": True}


@router.post("/test-fire")
async def test_fire(event_type: str, payload: Optional[Dict[str, Any]] = None,
                    background: BackgroundTasks = None) -> dict:
    """Manually fire a test webhook for QA / dashboard 'Send test event' button."""
    if event_type not in VALID_EVENT_TYPES:
        raise HTTPException(400, f"event_type must be one of {VALID_EVENT_TYPES}")
    fired = await emit(event_type, payload or {"test": True, "ts": _now()},
                       background=background)
    return {"event_type": event_type, "fired_to": fired}


# ============================================================================
#  Public emit function — called by other routes when events occur.
# ============================================================================

async def emit(event_type: str, payload: Dict[str, Any],
               *, background: Optional[BackgroundTasks] = None) -> int:
    """Fan-out an event to every active subscriber listening on this event type.
    Returns the number of subscribers it fired to. Each delivery is recorded
    in `webhook_events` whether it succeeds or fails."""
    subs_cursor = db[SUBS].find({"event_type": event_type, "active": True}, {"_id": 0})
    subs = await subs_cursor.to_list(length=100)
    if not subs:
        return 0
    for sub in subs:
        if background is not None:
            background.add_task(_deliver, sub, payload)
        else:
            # Synchronous-ish dispatch (best-effort) when no BackgroundTasks
            await _deliver(sub, payload)
    return len(subs)


async def _deliver(sub: dict, payload: dict, retry_of: Optional[str] = None):
    event_id = retry_of or f"evt_{uuid.uuid4().hex[:10]}"
    body = json.dumps({"event_type": sub["event_type"], "data": payload,
                       "delivered_at": _now()}).encode()
    sig = _sign(sub["secret"], body)
    headers = {
        "Content-Type": "application/json",
        "X-Halcyon-Signature": sig,
        "X-Halcyon-Event": sub["event_type"],
        "X-Halcyon-Subscription": sub["sub_id"],
    }
    status_code = 0
    response_excerpt = ""
    delivery_status = "failed"
    err = None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(sub["target_url"], content=body, headers=headers)
            status_code = r.status_code
            response_excerpt = (r.text or "")[:500]
            if 200 <= status_code < 300:
                delivery_status = "delivered"
    except Exception as e:
        err = str(e)[:300]
    # Persist event record
    event_doc = {
        "_id": event_id,
        "event_id": event_id,
        "sub_id": sub["sub_id"],
        "event_type": sub["event_type"],
        "target_url": sub["target_url"],
        "payload": payload,
        "status": delivery_status,
        "http_status": status_code,
        "response_excerpt": response_excerpt,
        "error": err,
        "signature": sig,
        "retry_of": retry_of,
        "created_at": _now(),
    }
    if retry_of:
        await db[EVENTS].update_one({"event_id": retry_of}, {"$set": event_doc}, upsert=True)
    else:
        await db[EVENTS].insert_one(event_doc)
    # Stats update on the sub
    await db[SUBS].update_one(
        {"sub_id": sub["sub_id"]},
        {
            "$set": {"last_fired_at": _now()},
            "$inc": {
                "fire_count": 1,
                "success_count": 1 if delivery_status == "delivered" else 0,
                "failure_count": 1 if delivery_status != "delivered" else 0,
            },
        },
    )
