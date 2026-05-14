"""
Deals — CRM-grade first-class entity for advice engagements.

A Deal represents an advice workflow (SOA, ROA, Implementation Pack, Insurance
Quote, Property Restructure, etc.) tied to a specific client and adviser, with
a tracked lifecycle stage so the practice can run a pipeline view.

Stages:
  draft       → adviser drafting recommendations
  review      → in compliance / paraplanner review
  signed      → client has signed the SOA/ROA
  executed    → trade tickets settled, super changes applied
  archived    → completed, kept for the 7-year record-retention period
  lost        → client did not proceed

Endpoints (all under /api/deals):
  GET    /                       list deals (paginated, filtered)
  GET    /{deal_id}              read one deal with audit history
  POST   /                       create a new deal
  PATCH  /{deal_id}              update fields
  POST   /{deal_id}/stage        transition stage
  POST   /{deal_id}/link         link an existing document/pack/ticket to the deal
  GET    /pipeline/summary       per-stage counts + $ pipeline value
"""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import uuid
import logging

from db import db
from routes.webhooks import emit as emit_webhook

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/deals", tags=["Deals"])

COL = "deals"
VALID_STAGES = ("draft", "review", "signed", "executed", "archived", "lost")
VALID_TYPES = ("soa", "roa", "implementation_pack", "insurance_quote",
               "property_restructure", "review_meeting", "rebalance", "other")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _strip_id(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


class DealCreate(BaseModel):
    client_id: str
    client_name: Optional[str] = ""
    deal_type: str = "soa"
    title: str
    adviser_id: Optional[str] = "default_adviser"
    adviser_name: Optional[str] = "Adviser"
    expected_value: Optional[float] = 0
    expected_close: Optional[str] = None
    notes: Optional[str] = ""


class DealUpdate(BaseModel):
    title: Optional[str] = None
    expected_value: Optional[float] = None
    expected_close: Optional[str] = None
    notes: Optional[str] = None
    adviser_id: Optional[str] = None
    adviser_name: Optional[str] = None


class DealStage(BaseModel):
    new_stage: str
    reason: Optional[str] = ""


class DealLink(BaseModel):
    kind: str  # "implementation_pack" | "advice_document" | "execution_ticket" | "notification"
    ref: str   # the foreign key (pack_id, document_ref, ticket_id, note_id)
    label: Optional[str] = ""


@router.post("")
async def create_deal(payload: DealCreate) -> dict:
    if payload.deal_type not in VALID_TYPES:
        raise HTTPException(400, f"deal_type must be one of {VALID_TYPES}")
    deal_id = f"deal_{uuid.uuid4().hex[:10]}"
    now = _now()
    doc = {
        "_id": deal_id,
        "deal_id": deal_id,
        "client_id": payload.client_id,
        "client_name": payload.client_name or "",
        "deal_type": payload.deal_type,
        "title": payload.title,
        "stage": "draft",
        "adviser_id": payload.adviser_id,
        "adviser_name": payload.adviser_name,
        "expected_value": float(payload.expected_value or 0),
        "expected_close": payload.expected_close,
        "notes": payload.notes or "",
        "links": [],
        "created_at": now,
        "updated_at": now,
        "history": [{"at": now, "event": "created", "by": payload.adviser_name, "stage": "draft"}],
    }
    await db[COL].insert_one(doc)
    return _strip_id(doc)


@router.get("")
async def list_deals(
    client_id: Optional[str] = None,
    stage: Optional[str] = None,
    deal_type: Optional[str] = None,
    adviser_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500),
    skip: int = Query(0, ge=0),
) -> dict:
    q: Dict[str, Any] = {}
    if client_id:
        q["client_id"] = client_id
    if stage:
        q["stage"] = stage
    if deal_type:
        q["deal_type"] = deal_type
    if adviser_id:
        q["adviser_id"] = adviser_id
    cursor = (
        db[COL].find(q, {"_id": 0})
        .sort("updated_at", -1)
        .skip(skip)
        .limit(limit)
    )
    deals = await cursor.to_list(length=limit)
    total = await db[COL].count_documents(q)
    return {"deals": deals, "count": len(deals), "total": total, "limit": limit, "skip": skip}


@router.get("/pipeline/summary")
async def pipeline_summary(adviser_id: Optional[str] = None) -> dict:
    """Per-stage counts and pipeline value for the adviser's kanban view."""
    match: Dict[str, Any] = {}
    if adviser_id:
        match["adviser_id"] = adviser_id
    pipeline = [
        {"$match": match},
        {"$group": {"_id": "$stage", "count": {"$sum": 1}, "value": {"$sum": "$expected_value"}}},
    ]
    rows = await db[COL].aggregate(pipeline).to_list(length=20)
    by_stage = {r["_id"]: {"count": r["count"], "value": r["value"]} for r in rows}
    out = []
    for s in VALID_STAGES:
        out.append({"stage": s, "count": by_stage.get(s, {}).get("count", 0), "value": by_stage.get(s, {}).get("value", 0)})
    total_count = sum(r["count"] for r in out)
    total_value = sum(r["value"] for r in out)
    return {"stages": out, "total_count": total_count, "total_value": total_value}


@router.get("/{deal_id}")
async def read_deal(deal_id: str) -> dict:
    doc = await db[COL].find_one({"deal_id": deal_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"Deal {deal_id} not found")
    return doc


@router.patch("/{deal_id}")
async def update_deal(deal_id: str, patch: DealUpdate) -> dict:
    sets = {k: v for k, v in patch.dict(exclude_none=True).items()}
    if not sets:
        raise HTTPException(400, "Empty update")
    sets["updated_at"] = _now()
    res = await db[COL].update_one(
        {"deal_id": deal_id},
        {"$set": sets, "$push": {"history": {"at": _now(), "event": "updated", "fields": list(sets.keys())}}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, f"Deal {deal_id} not found")
    return await read_deal(deal_id)


@router.post("/{deal_id}/stage")
async def transition_stage(deal_id: str, payload: DealStage, background: BackgroundTasks) -> dict:
    if payload.new_stage not in VALID_STAGES:
        raise HTTPException(400, f"stage must be one of {VALID_STAGES}")
    doc = await db[COL].find_one({"deal_id": deal_id}, {"_id": 0, "stage": 1})
    if not doc:
        raise HTTPException(404, f"Deal {deal_id} not found")
    if doc["stage"] == payload.new_stage:
        return await read_deal(deal_id)
    await db[COL].update_one(
        {"deal_id": deal_id},
        {
            "$set": {"stage": payload.new_stage, "updated_at": _now()},
            "$push": {"history": {
                "at": _now(), "event": "stage_changed",
                "from": doc["stage"], "to": payload.new_stage,
                "reason": payload.reason or "",
            }},
        },
    )
    updated = await read_deal(deal_id)
    # Fan-out to webhook subscribers
    await emit_webhook("deal.stage_changed",
                       {"deal_id": deal_id, "from": doc["stage"], "to": payload.new_stage,
                        "reason": payload.reason or "", "deal": updated},
                       background=background)
    # Specific signed / executed events for finer-grained subscribers
    if payload.new_stage == "signed":
        await emit_webhook("deal.signed", {"deal_id": deal_id, "deal": updated}, background=background)
    elif payload.new_stage == "executed":
        await emit_webhook("deal.executed", {"deal_id": deal_id, "deal": updated}, background=background)
    return updated


@router.post("/{deal_id}/link")
async def link_resource(deal_id: str, link: DealLink) -> dict:
    doc = await db[COL].find_one({"deal_id": deal_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, f"Deal {deal_id} not found")
    entry = {"kind": link.kind, "ref": link.ref, "label": link.label, "linked_at": _now()}
    await db[COL].update_one(
        {"deal_id": deal_id},
        {"$push": {"links": entry, "history": {"at": _now(), "event": "linked", "kind": link.kind, "ref": link.ref}}},
    )
    return await read_deal(deal_id)
