"""
Execution Tickets — the bridge between adviser intent and downstream execution.
When an adviser clicks "Apply Strategy" from the Intelligence Feed, a ticket is
created and persisted. Downstream integrations (brokerage, super platforms,
insurance providers) can poll/subscribe to these tickets.

Ticket status lifecycle: draft → pending → executing → completed | failed | cancelled.
This is a MOCKED execution layer — no real brokerage calls. Use for audit + handoff.
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import uuid

from db import db

router = APIRouter(prefix="/execution", tags=["Execution Tickets"])

COLLECTION = "execution_tickets"


class TicketCreate(BaseModel):
    client_id: str
    client_name: Optional[str] = ""
    ticket_type: str  # trade | super_change | insurance_quote | contribution | rebalance
    headline: str
    message: Optional[str] = ""
    payload: Optional[Dict] = None  # free-form details (symbol/qty/fund/etc.)
    requested_by: str = "adviser"
    urgency: Optional[str] = "SOON"
    source_item_id: Optional[str] = None  # id of the feed item that spawned this


class TicketUpdate(BaseModel):
    status: Optional[str] = None  # pending | executing | completed | failed | cancelled
    adviser_notes: Optional[str] = None
    execution_ref: Optional[str] = None


@router.post("/tickets")
async def create_ticket(payload: TicketCreate) -> dict:
    tid = f"tkt_{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "_id": tid,
        "ticket_id": tid,
        "client_id": payload.client_id,
        "client_name": payload.client_name or "",
        "ticket_type": payload.ticket_type,
        "headline": payload.headline,
        "message": payload.message or "",
        "payload": payload.payload or {},
        "requested_by": payload.requested_by,
        "urgency": payload.urgency or "SOON",
        "source_item_id": payload.source_item_id,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "history": [{"at": now, "event": "created", "by": payload.requested_by}],
    }
    await db[COLLECTION].insert_one(doc)
    doc.pop("_id", None)
    return {"success": True, "ticket": doc}


@router.get("/tickets")
async def list_tickets(client_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50) -> dict:
    q = {}
    if client_id:
        q["client_id"] = client_id
    if status:
        q["status"] = status
    cursor = db[COLLECTION].find(q, {"_id": 0}).sort("updated_at", -1).limit(limit)
    tickets = await cursor.to_list(length=limit)
    return {"tickets": tickets, "total": len(tickets)}


@router.get("/tickets/{ticket_id}")
async def get_ticket(ticket_id: str) -> dict:
    t = await db[COLLECTION].find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return t


@router.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, payload: TicketUpdate) -> dict:
    existing = await db[COLLECTION].find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ticket not found")
    now = datetime.now(timezone.utc).isoformat()
    update = {"updated_at": now}
    history = {"at": now, "event": "updated", "by": "adviser"}
    if payload.status:
        update["status"] = payload.status
        history["status"] = payload.status
    if payload.adviser_notes is not None:
        update["adviser_notes"] = payload.adviser_notes
    if payload.execution_ref is not None:
        update["execution_ref"] = payload.execution_ref
    await db[COLLECTION].update_one(
        {"ticket_id": ticket_id},
        {"$set": update, "$push": {"history": history}},
    )
    fresh = await db[COLLECTION].find_one({"ticket_id": ticket_id}, {"_id": 0})
    return {"success": True, "ticket": fresh}


@router.get("/tickets/dashboard/summary")
async def tickets_summary() -> dict:
    """Aggregate counts for adviser dashboard widgets."""
    counts: Dict[str, int] = {}
    async for doc in db[COLLECTION].find({}, {"_id": 0, "status": 1}):
        s = doc.get("status", "unknown")
        counts[s] = counts.get(s, 0) + 1
    total = sum(counts.values())
    return {
        "total": total,
        "by_status": counts,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
