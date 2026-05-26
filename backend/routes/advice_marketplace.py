"""
Advice Marketplace — curated catalogue of pre-built advice strategy templates
that advisers can browse, preview and clone into their own Deals pipeline.

Each template is a versioned, JSON-shaped strategy (e.g. "EOFY tax loss harvest",
"Bring-forward NCC for under-75s", "Discretionary trust succession after Jul
2028"). Clone creates a new Deal pointing at the source template so we can
track marketplace-driven advice creation in the audit log.

Endpoints (under /api/advice-marketplace):
  GET   /templates                list available templates (filter by category)
  GET   /templates/{template_id}  fetch a single template (with full payload)
  POST  /templates/{id}/clone     create a new Deal cloned from this template
  POST  /seed                     idempotent demo catalogue seed
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/advice-marketplace", tags=["Advice Marketplace"])

COL = "advice_templates"
DEALS = "deals"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CloneRequest(BaseModel):
    client_id: str
    title_override: Optional[str] = None


@router.get("/templates")
async def list_templates(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    q: dict = {}
    if category and category != "all":
        q["category"] = category
    if search:
        q["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"summary": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}},
        ]
    cur = db[COL].find(q, {"_id": 0, "payload": 0}).sort("popularity", -1).limit(200)
    rows = await cur.to_list(length=200)

    # Aggregate the category facet so the UI chip filter is data-driven.
    facet_cur = db[COL].aggregate([
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$project": {"category": "$_id", "count": 1, "_id": 0}},
    ])
    facets = await facet_cur.to_list(length=20)
    return {"templates": rows, "count": len(rows), "categories": facets}


@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    row = await db[COL].find_one({"template_id": template_id}, {"_id": 0})
    if not row:
        raise HTTPException(404, "template not found")
    return row


@router.post("/templates/{template_id}/clone")
async def clone_template(template_id: str, req: CloneRequest):
    """Spawn a Deal from this template — exactly what an adviser would build
    manually, but pre-filled with the marketplace strategy payload."""
    template = await db[COL].find_one({"template_id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(404, "template not found")

    deal_id = f"deal_{uuid.uuid4().hex[:10]}"
    deal = {
        "deal_id": deal_id,
        "client_id": req.client_id,
        "title": req.title_override or template["title"],
        "stage": "draft",
        "value": template.get("estimated_fee", 2500),
        "source": "marketplace",
        "source_template_id": template_id,
        "source_template_title": template["title"],
        "summary": template.get("summary", ""),
        "tags": list(set(["marketplace"] + (template.get("tags") or []))),
        "created_at": _now(),
        "updated_at": _now(),
        "history": [{
            "at": _now(),
            "event": "cloned_from_marketplace",
            "template_id": template_id,
            "by": "adviser",
        }],
    }
    await db[DEALS].insert_one({**deal})
    await db[COL].update_one({"template_id": template_id}, {"$inc": {"clone_count": 1}})
    deal.pop("_id", None)
    return {"success": True, "deal_id": deal_id, "deal": deal}


@router.post("/seed")
async def seed_marketplace():
    """Idempotent demo seed — 6 pre-built strategy templates across 4 categories."""
    demos = [
        {
            "template_id": "tpl_eofy_tax_loss_harvest", "category": "tax",
            "title": "EOFY Tax Loss Harvest",
            "summary": "Realise capital losses on underperforming holdings to offset gains made during the financial year. Targets clients with ≥3 separate parcels in red and ≥$5k of net realised gains YTD.",
            "tags": ["eofy", "cgt", "tax_planning"],
            "estimated_fee": 1850, "popularity": 95, "complexity": "medium", "duration_days": 7,
            "payload": {"ruleset_version": "auTax v2.3 (FY26-27)", "deliverables": ["ROA letter", "Trade ticket schedule", "30-day wash-sale checklist"], "min_portfolio_size": 250_000},
        },
        {
            "template_id": "tpl_bring_forward_ncc", "category": "super",
            "title": "Bring-forward NCC for under-75s",
            "summary": "3-year non-concessional contribution bring-forward strategy. Maximises the $360k cap (3 × $120k) before age 75 when work test re-applies.",
            "tags": ["super", "ncc", "bring_forward"],
            "estimated_fee": 2200, "popularity": 87, "complexity": "low", "duration_days": 5,
            "payload": {"ruleset_version": "SIS Act 2024 update", "deliverables": ["SOA", "Fund contribution form", "TBC monitoring schedule"], "min_super_balance": 0, "max_super_balance": 1_900_000},
        },
        {
            "template_id": "tpl_smsf_lrba_payoff", "category": "smsf",
            "title": "SMSF Limited-Recourse Borrowing Payoff",
            "summary": "Refinance or pay down an LRBA before transition-to-retirement to remove the $1.9M TBC drag and unlock pension phase. Includes lender comparison + actuarial impact.",
            "tags": ["smsf", "lrba", "retirement"],
            "estimated_fee": 4200, "popularity": 62, "complexity": "high", "duration_days": 14,
            "payload": {"deliverables": ["SOA", "Lender briefing pack", "Actuarial certificate"], "min_lrba_balance": 250_000},
        },
        {
            "template_id": "tpl_trust_succession_2028", "category": "estate",
            "title": "Discretionary Trust Succession (post-Jul 2028)",
            "summary": "Pre-position the trust deed and family-trust-election for the 30% minimum-tax regime taking effect 1 July 2028. Includes deed variation checklist + corporate trustee resolution.",
            "tags": ["trust", "estate", "budget_reform_2027"],
            "estimated_fee": 3800, "popularity": 73, "complexity": "high", "duration_days": 10,
            "payload": {"deliverables": ["SOA", "Trust deed variation", "Family Trust Election form", "Corporate trustee resolutions"], "applicable_dates": {"reform_effective": "2028-07-01"}},
        },
        {
            "template_id": "tpl_negative_gearing_transitional", "category": "tax",
            "title": "Negative Gearing Transitional Hold/Sell Review",
            "summary": "Decision pack for clients holding post-12-May-2026 investment properties (B_transitional): sell-pre / sell-post / restructure modelling under the 2026-27 Budget rules.",
            "tags": ["negative_gearing", "cgt", "budget_reform_2027"],
            "estimated_fee": 2950, "popularity": 81, "complexity": "medium", "duration_days": 7,
            "payload": {"deliverables": ["SOA", "3-path comparison model", "Settlement timeline"], "applicable_dates": {"announcement": "2026-05-12", "reform_effective": "2027-07-01"}},
        },
        {
            "template_id": "tpl_estate_bdbn_refresh", "category": "estate",
            "title": "Binding Death Benefit Nomination (BDBN) refresh",
            "summary": "3-year BDBN refresh + reversionary pension election review for clients with super balances ≥ $500k. Includes blended-family / step-children edge cases.",
            "tags": ["bdbn", "estate", "super"],
            "estimated_fee": 1250, "popularity": 68, "complexity": "low", "duration_days": 3,
            "payload": {"deliverables": ["Updated BDBN form", "Reversionary election letter", "Witness pack"]},
        },
    ]
    inserted = 0
    for t in demos:
        if await db[COL].find_one({"template_id": t["template_id"]}):
            continue
        t["clone_count"] = 0
        t["created_at"] = _now()
        await db[COL].insert_one({**t})
        inserted += 1
    total = await db[COL].count_documents({})
    return {"status": "ok", "inserted": inserted, "total": total}
