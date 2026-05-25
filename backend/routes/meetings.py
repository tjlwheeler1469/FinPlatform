"""
Client meeting notes — Mongo-persisted log surfaced in the client-facing
MyVault > Meeting Notes tab and the adviser's Comms Ledger.

Endpoints (under /api/meetings):
  GET   /by-client/{client_id}   list every meeting note for a client
  POST  /log                     create a new meeting record (adviser-side)
  GET   /{meeting_id}            retrieve one
  POST  /seed-demo               idempotent demo seed for testing
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
import uuid

from db import db

router = APIRouter(prefix="/meetings", tags=["Meetings"])
COL = "client_meetings"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class MeetingNote(BaseModel):
    title: str
    date: str = Field(..., description="ISO date — YYYY-MM-DD")
    summary: str
    attendees: str
    client_id: str
    recording_available: bool = False
    adviser_name: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


@router.get("/by-client/{client_id}")
async def list_meetings_for_client(client_id: str, limit: int = 50):
    cur = db[COL].find({"client_id": client_id}, {"_id": 0}).sort("date", -1).limit(limit)
    rows = await cur.to_list(length=limit)
    return {"meetings": rows, "count": len(rows)}


@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str):
    row = await db[COL].find_one({"meeting_id": meeting_id}, {"_id": 0})
    if not row:
        raise HTTPException(404, "meeting not found")
    return row


@router.post("/log")
async def log_meeting(note: MeetingNote):
    mid = f"mn_{uuid.uuid4().hex[:10]}"
    doc = {
        "meeting_id": mid,
        "client_id": note.client_id,
        "title": note.title,
        "date": note.date,
        "summary": note.summary,
        "attendees": note.attendees,
        "recording_available": note.recording_available,
        "adviser_name": note.adviser_name,
        "tags": note.tags,
        "created_at": _now(),
    }
    await db[COL].insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.post("/seed-demo")
async def seed_demo_meetings():
    """Idempotently seed 4 meeting notes for thompson_family + 2 for chen_family
    so the MyVault > Meeting Notes tab has real data to render."""
    demos = [
        # thompson_family
        ("thompson_family", "Annual Strategy Review 2026", "2026-03-18",
         "Reviewed portfolio rebalancing, super contribution strategy and estate planning updates.",
         "David Thompson, Sarah Thompson, Sarah Chen (Adviser)", True, ["annual_review", "strategy"]),
        ("thompson_family", "Q4 2025 Portfolio Review", "2025-12-10",
         "Discussed Q4 performance (+9.4% YTD), agreed to rotate 5% from property into Australian equities.",
         "David Thompson, Sarah Chen", True, ["quarterly_review"]),
        ("thompson_family", "EOFY Tax Planning Session", "2025-05-22",
         "Actioned concessional super top-up, CGT harvesting from Telstra holding, trust distribution resolution drafted.",
         "David Thompson, Sarah Thompson, Sarah Chen", False, ["tax_planning", "eofy"]),
        ("thompson_family", "SMSF Trustee Annual Meeting", "2024-11-08",
         "Reviewed SMSF investment strategy, rebalanced property allocation, updated BDBN.",
         "David Thompson, Sarah Chen", False, ["smsf"]),
        # chen_family
        ("chen_family", "Budget Reform Pre-Meeting", "2026-04-02",
         "Walked through the 2026-27 NG / CGT changes; agreed to model sell-window scenarios for Surry Hills investment apartment.",
         "Michael Chen, Lisa Chen, Sarah Chen", True, ["budget_reform", "tax_planning"]),
        ("chen_family", "Annual Review 2025", "2025-09-12",
         "Trust distribution strategy refreshed for FY26; insurance held inside super reviewed and adequate.",
         "Michael Chen, Sarah Chen", True, ["annual_review"]),
    ]
    inserted = 0
    for cid, title, date, summary, attendees, rec, tags in demos:
        existing = await db[COL].find_one({"client_id": cid, "title": title})
        if existing:
            continue
        mid = f"mn_seed_{uuid.uuid4().hex[:8]}"
        await db[COL].insert_one({
            "meeting_id": mid, "client_id": cid, "title": title, "date": date,
            "summary": summary, "attendees": attendees, "recording_available": rec,
            "adviser_name": "Sarah Chen", "tags": tags, "created_at": _now(),
        })
        inserted += 1
    total = await db[COL].count_documents({})
    return {"status": "ok", "inserted": inserted, "total": total}
