"""
Advice Copilot — LLM-powered Statement of Advice (SOA) drafting.
Adviser retains full amend/approve control. Every action is audit-logged.

Endpoints:
  POST /api/advice/drafts                  — generate a new draft from a feed item or raw brief
  GET  /api/advice/drafts/{draft_id}       — fetch a draft
  GET  /api/advice/drafts                  — list drafts (optionally by client)
  PATCH /api/advice/drafts/{draft_id}      — adviser amendment (edit body/title/tags)
  POST  /api/advice/drafts/{draft_id}/regenerate — regenerate with an amendment prompt
  POST  /api/advice/drafts/{draft_id}/approve    — lock as approved (adviser signs off)
  POST  /api/advice/drafts/{draft_id}/reject     — mark rejected with a reason
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Dict, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import uuid
import os
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/advice", tags=["Advice Copilot"])

COLLECTION = "advice_drafts"
LLM_MODEL = "gpt-5.2"
LLM_PROVIDER = "openai"


# ==================== MODELS ====================

class GenerateDraftPayload(BaseModel):
    client_id: str
    client_name: Optional[str] = ""
    headline: str = Field(..., description="Short action headline from the feed item")
    message: Optional[str] = ""
    context: Optional[Dict] = Field(default_factory=dict, description="Free-form context (readiness score, factors, opportunities, etc.)")
    actor: Optional[str] = "adviser"


class AmendDraftPayload(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    tags: Optional[List[str]] = None
    adviser_notes: Optional[str] = None


class RegeneratePayload(BaseModel):
    amendment_prompt: str = Field(..., description="Adviser's natural-language instruction to revise the draft")


class ApprovePayload(BaseModel):
    approved_by: str
    notes: Optional[str] = ""


class RejectPayload(BaseModel):
    rejected_by: str
    reason: str


# ==================== LLM HELPERS ====================

SYSTEM_PROMPT = """You are the advice-drafting copilot inside an AFSL-grade wealth platform.
You draft clear, compliant, client-ready strategy memos (not full SOAs).

RULES:
- Australian context (AUD, ATO/ASIC terminology where relevant).
- Never invent numbers; only use what the adviser provides in the context.
- Structure every response as:
    # <Strategy title>
    **Recommendation**: <one sentence>
    **Rationale**: 2-3 short bullets
    **Action steps**: 3-5 numbered steps the adviser will execute
    **Compliance notes**: any caveats, caps, or disclosures to highlight
    **Client talking points**: 2-3 simple sentences suitable for a client email
- Keep it under 350 words.
- The adviser WILL edit this; write it as a confident first draft, not a final document.
"""


async def _generate_with_llm(session_id: str, user_prompt: str) -> str:
    """Call the Emergent LLM via emergentintegrations. Returns plain text."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="EMERGENT_LLM_KEY not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model(LLM_PROVIDER, LLM_MODEL)

    msg = UserMessage(text=user_prompt)
    try:
        response = await chat.send_message(msg)
    except Exception as e:
        logger.exception("LLM call failed")
        raise HTTPException(status_code=502, detail=f"LLM call failed: {str(e)[:200]}")
    return response or ""


def _build_initial_prompt(p: GenerateDraftPayload) -> str:
    ctx = p.context or {}
    lines = [
        f"Client: {p.client_name or p.client_id}",
        f"Headline: {p.headline}",
    ]
    if p.message:
        lines.append(f"Context summary: {p.message}")
    if ctx.get("readiness_score") is not None:
        lines.append(f"Current retirement readiness score: {ctx['readiness_score']}/100 ({ctx.get('classification','')})")
    if ctx.get("score_delta"):
        lines.append(f"Projected readiness improvement: +{ctx['score_delta']} pts")
    if ctx.get("financial_impact"):
        lines.append(f"Projected $ impact: ${ctx['financial_impact']:,}")
    if ctx.get("urgency"):
        lines.append(f"Urgency: {ctx['urgency']}")
    if ctx.get("confidence"):
        lines.append(f"Confidence: {ctx['confidence']}%")
    if ctx.get("factors"):
        lines.append(f"Readiness factor snapshot: {ctx['factors']}")
    if ctx.get("opportunities"):
        lines.append(f"Other surfaced opportunities: {ctx['opportunities']}")
    lines.append("")
    lines.append("Draft the strategy memo now.")
    return "\n".join(lines)


# ==================== ENDPOINTS ====================

@router.post("/drafts")
async def generate_draft(payload: GenerateDraftPayload) -> dict:
    draft_id = f"adv_{uuid.uuid4().hex[:10]}"
    session_id = f"advice_{draft_id}"
    prompt = _build_initial_prompt(payload)

    body = await _generate_with_llm(session_id, prompt)

    draft = {
        "_id": draft_id,
        "draft_id": draft_id,
        "session_id": session_id,
        "client_id": payload.client_id,
        "client_name": payload.client_name or "",
        "headline": payload.headline,
        "message": payload.message or "",
        "context": payload.context or {},
        "actor": payload.actor or "adviser",
        "title": payload.headline,
        "body": body,
        "tags": [],
        "status": "draft",
        "version": 1,
        "history": [
            {"at": datetime.now(timezone.utc).isoformat(), "event": "generated", "by": payload.actor, "model": f"{LLM_PROVIDER}:{LLM_MODEL}"}
        ],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db[COLLECTION].insert_one(draft)
    draft.pop("_id", None)
    return {"success": True, "draft": draft}


@router.get("/drafts/{draft_id}")
async def get_draft(draft_id: str) -> dict:
    d = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Draft not found")
    return d


@router.get("/drafts")
async def list_drafts(client_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50) -> dict:
    q = {}
    if client_id:
        q["client_id"] = client_id
    if status:
        q["status"] = status
    cursor = db[COLLECTION].find(q, {"_id": 0}).sort("updated_at", -1).limit(limit)
    drafts = await cursor.to_list(length=limit)
    return {"drafts": drafts, "total": len(drafts)}


@router.patch("/drafts/{draft_id}")
async def amend_draft(draft_id: str, payload: AmendDraftPayload) -> dict:
    """Adviser amendment — updates title/body/tags/notes and bumps version."""
    existing = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Draft not found")
    if existing.get("status") == "approved":
        raise HTTPException(status_code=409, detail="Approved drafts cannot be amended")

    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    changed = []
    if payload.title is not None and payload.title != existing.get("title"):
        update["title"] = payload.title
        changed.append("title")
    if payload.body is not None and payload.body != existing.get("body"):
        update["body"] = payload.body
        changed.append("body")
    if payload.tags is not None:
        update["tags"] = payload.tags
        changed.append("tags")
    if payload.adviser_notes is not None:
        update["adviser_notes"] = payload.adviser_notes
        changed.append("notes")

    history_entry = {
        "at": update["updated_at"],
        "event": "amended",
        "by": "adviser",
        "fields": changed,
    }
    await db[COLLECTION].update_one(
        {"draft_id": draft_id},
        {"$set": update, "$inc": {"version": 1}, "$push": {"history": history_entry}},
    )
    fresh = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    return {"success": True, "draft": fresh, "changed": changed}


@router.post("/drafts/{draft_id}/regenerate")
async def regenerate_draft(draft_id: str, payload: RegeneratePayload) -> dict:
    """Use adviser's natural-language instructions to rewrite the body."""
    existing = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Draft not found")
    if existing.get("status") == "approved":
        raise HTTPException(status_code=409, detail="Approved drafts cannot be regenerated")

    prompt = (
        f"Previous draft:\n---\n{existing.get('body','')}\n---\n\n"
        f"Adviser amendment instructions: {payload.amendment_prompt}\n\n"
        "Rewrite the memo accordingly, preserving the structure (# title, Recommendation, Rationale, Action steps, Compliance notes, Client talking points). "
        "Keep it under 350 words."
    )
    new_body = await _generate_with_llm(existing["session_id"], prompt)

    history_entry = {
        "at": datetime.now(timezone.utc).isoformat(),
        "event": "regenerated",
        "by": "adviser",
        "instruction": payload.amendment_prompt,
    }
    await db[COLLECTION].update_one(
        {"draft_id": draft_id},
        {
            "$set": {"body": new_body, "updated_at": history_entry["at"]},
            "$inc": {"version": 1},
            "$push": {"history": history_entry},
        },
    )
    fresh = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    return {"success": True, "draft": fresh}


@router.post("/drafts/{draft_id}/approve")
async def approve_draft(draft_id: str, payload: ApprovePayload) -> dict:
    existing = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Draft not found")
    now = datetime.now(timezone.utc).isoformat()
    await db[COLLECTION].update_one(
        {"draft_id": draft_id},
        {
            "$set": {
                "status": "approved",
                "approved_by": payload.approved_by,
                "approved_at": now,
                "updated_at": now,
                "approval_notes": payload.notes or "",
            },
            "$push": {"history": {"at": now, "event": "approved", "by": payload.approved_by, "notes": payload.notes or ""}},
        },
    )
    fresh = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    return {"success": True, "draft": fresh}


@router.post("/drafts/{draft_id}/reject")
async def reject_draft(draft_id: str, payload: RejectPayload) -> dict:
    existing = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Draft not found")
    now = datetime.now(timezone.utc).isoformat()
    await db[COLLECTION].update_one(
        {"draft_id": draft_id},
        {
            "$set": {"status": "rejected", "rejected_by": payload.rejected_by, "rejected_at": now, "updated_at": now, "rejection_reason": payload.reason},
            "$push": {"history": {"at": now, "event": "rejected", "by": payload.rejected_by, "reason": payload.reason}},
        },
    )
    fresh = await db[COLLECTION].find_one({"draft_id": draft_id}, {"_id": 0})
    return {"success": True, "draft": fresh}
