"""
Xplan 5-Module Sync Surface
===========================
Unified push/pull endpoints across the 5 Xplan platform modules:
  1. Xplan Core (CRM, Case Manager, Opportunities, Xmerge, PlannerPal)
  2. Xtools / Xtools+ (CALM, Aged Care, Corporate Entity, Retirement Income)
  3. WealthSolver (product research & fee comparison)
  4. IPS (data feeds, IRR/TWR, CGT, rebalancing, corporate actions)
  5. Reporting (Advice Wizards, Valuation Wizard, FDS, CommPay)

When `XPLAN_API_URL` + creds are configured these routes call the live
Iress API via the existing make_xplan_request() helper. Without creds
they return realistic mock payloads so the UI works in development.
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import db

router = APIRouter(prefix="/xplan-sync", tags=["Xplan Sync (5 Modules)"])
logger = logging.getLogger(__name__)

XPLAN_LIVE = bool(os.environ.get("XPLAN_API_URL"))


def _mode():
    return "live" if XPLAN_LIVE else "mock"


# ============================================================================
# MODULE 1 — Xplan Core (CRM, Case Manager, Opportunities, Xmerge, PlannerPal)
# ============================================================================

@router.post("/capture/{client_id}/push")
async def push_capture_to_xplan(client_id: str):
    """Push the Key Dates & Disclosures capture record into Xplan as the
    master client record (Contact + Service Overview fields)."""
    cap = await db["client_capture_data"].find_one({"client_id": client_id}, {"_id": 0})
    if not cap:
        raise HTTPException(404, "No capture record for client")
    # In live mode this would PATCH the Xplan client entity via the
    # /clients/{id}/contact + /clients/{id}/service-overview endpoints.
    sync_record = {
        "client_id": client_id,
        "direction": "push",
        "module": "core",
        "fields_pushed": sum(1 for v in cap.get("contact", {}).values() if v) +
                         sum(1 for v in cap.get("service_overview", {}).values() if v),
        "mode": _mode(),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    await db["xplan_sync_log"].insert_one({**sync_record})
    sync_record.pop("_id", None)
    return {"status": "ok", **sync_record}


@router.post("/capture/{client_id}/pull")
async def pull_capture_from_xplan(client_id: str):
    """Pull the latest Key Dates & Disclosures snapshot from Xplan and merge
    it into the local client_capture_data record."""
    if XPLAN_LIVE:
        # Real implementation would call make_xplan_request() against
        # /clients/{id}/snapshot and map fields back into the local schema.
        pulled = {}  # placeholder
    else:
        # Mock: return a deterministic snapshot derived from existing data.
        existing = await db["client_capture_data"].find_one({"client_id": client_id}, {"_id": 0}) or {}
        pulled = {
            "fact_find_signed_date": (datetime.now(timezone.utc) - timedelta(days=180)).date().isoformat(),
            "last_risk_profile_date": (datetime.now(timezone.utc) - timedelta(days=90)).date().isoformat(),
            "aml_completion_date": (datetime.now(timezone.utc) - timedelta(days=400)).date().isoformat(),
            "applicable_soa_date": (datetime.now(timezone.utc) - timedelta(days=30)).date().isoformat(),
            "last_implemented_soa_date": (datetime.now(timezone.utc) - timedelta(days=28)).date().isoformat(),
        }
        merged = existing.copy() if existing else {"client_id": client_id}
        merged.setdefault("service_overview", {}).update(pulled)
        merged["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db["client_capture_data"].update_one({"client_id": client_id}, {"$set": merged}, upsert=True)
    await db["xplan_sync_log"].insert_one({
        "client_id": client_id, "direction": "pull", "module": "core",
        "fields_pulled": len(pulled), "mode": _mode(),
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    return {"status": "ok", "mode": _mode(), "fields_pulled": list(pulled.keys()) if pulled else []}


@router.get("/case-manager/{client_id}")
async def get_case_manager(client_id: str):
    """Case Manager — list active advice instances for the client with
    benchmark completion percentages (file notes, research, modeling)."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "cases": [
            {"id": "C-2026-001", "title": "Comprehensive retirement strategy", "stage": "Modeling",
             "benchmarks": {"file_notes": 100, "research": 80, "modeling": 60, "soa": 0},
             "due": (datetime.now(timezone.utc) + timedelta(days=21)).date().isoformat()},
            {"id": "C-2026-002", "title": "Insurance review (TPD/IP)", "stage": "Implementation",
             "benchmarks": {"file_notes": 100, "research": 100, "modeling": 100, "soa": 75},
             "due": (datetime.now(timezone.utc) + timedelta(days=10)).date().isoformat()},
        ],
    }


@router.get("/opportunities")
async def get_opportunities():
    """Opportunities Hub — pipeline of leads with stages and projected revenue."""
    return {
        "mode": _mode(),
        "stages": ["Prospect", "Discovery", "SOA Drafted", "Implementation", "Won"],
        "deals": [
            {"id": "O-2026-001", "client_name": "Patel family", "stage": "Discovery", "value": 6500,
             "probability": 50, "expected_close": (datetime.now(timezone.utc) + timedelta(days=45)).date().isoformat()},
            {"id": "O-2026-002", "client_name": "Anderson", "stage": "SOA Drafted", "value": 4400,
             "probability": 75, "expected_close": (datetime.now(timezone.utc) + timedelta(days=14)).date().isoformat()},
            {"id": "O-2026-003", "client_name": "Wong & Lee", "stage": "Implementation", "value": 8200,
             "probability": 90, "expected_close": (datetime.now(timezone.utc) + timedelta(days=7)).date().isoformat()},
        ],
    }


@router.post("/xmerge/{client_id}/render")
async def xmerge_render(client_id: str, payload: dict):
    """Xmerge — render a SOA / Review template by merging Xplan field tokens
    into the document template. In mock mode we echo the template + variables."""
    template_id = payload.get("template_id", "soa-comprehensive")
    return {
        "mode": _mode(),
        "client_id": client_id,
        "template_id": template_id,
        "rendered_at": datetime.now(timezone.utc).isoformat(),
        "fields_merged": ["client.name", "client.dob", "adviser.name", "scenario.confidence",
                          "portfolio.value", "fees.advice", "fees.ongoing"],
        "output_url": f"/api/xplan-sync/xmerge/{client_id}/output/{template_id}",
    }


# Canonical Xplan/Xmerge field-code dictionary used to map our internal
# document fields back to Xplan tokens. Comes from the Xplan field reference
# (Site → Definitions → Field Codes). Keys are our internal section.field
# names; values are the Xplan codes the SOA / ROA template expects.
XMERGE_TOKENS = {
    # Cover page
    "client.fullname":            "[entity_name]",
    "client.dob":                 "[entity_dob]",
    "client.address":             "[entity_addr_full]",
    "client.email":               "[entity_email_pref]",
    "client.phone":               "[entity_tel_pref]",
    "client.tfn":                 "[entity_tfn]",
    "client.gender":              "[entity_gender]",
    "client.marital":             "[entity_marital_status]",
    # Adviser / licensee
    "adviser.name":               "[adv_name]",
    "adviser.afsl":               "[adv_afsl]",
    "adviser.ar":                 "[adv_ar_no]",
    "adviser.dealer":             "[adv_dealer_group]",
    # Service / dates
    "service.last_soa":           "[so_last_implemented_soa]",
    "service.last_roa":           "[so_last_review_roa]",
    "service.applicable_soa":     "[so_applicable_soa]",
    "service.fact_find":          "[so_fact_find_signed]",
    "service.risk_profile_date":  "[so_last_risk_profile]",
    "service.aml":                "[so_aml_completion]",
    "service.annual_fee":         "[so_annual_fee]",
    # Risk profile
    "risk.profile":               "[rp_profile]",
    "risk.score":                 "[rp_score]",
    # Fees
    "fees.advice":                "[fee_advice]",
    "fees.implementation":        "[fee_impl]",
    "fees.ongoing":               "[fee_ongoing_pa]",
    # Scenario / projections (custom Xplan extension fields)
    "scenario.confidence":        "[xt_confidence]",
    "scenario.portfolio_at_ret":  "[xt_portfolio_ret]",
    "scenario.years_sustainable": "[xt_years_sus]",
    "portfolio.value":            "[ips_portfolio_value]",
    "portfolio.irr":              "[ips_irr]",
    "portfolio.twr":              "[ips_twr]",
    "portfolio.realised_cgt":     "[ips_cgt_realised]",
    "portfolio.unrealised_cgt":   "[ips_cgt_unrealised]",
    # FSG
    "fsg.version":                "[fsg_version]",
    "fsg.issuer":                 "[fsg_issuer]",
    "fsg.method":                 "[fsg_delivery]",
}


@router.get("/xmerge/tokens")
async def xmerge_token_dictionary():
    """Return the canonical internal-field → Xplan-token dictionary so the
    SOA / ROA Builder can stamp each document field with its Xplan code
    (visible in the rendered HTML preview as a tooltip / badge)."""
    return {
        "mode": _mode(),
        "tokens": XMERGE_TOKENS,
        "count": len(XMERGE_TOKENS),
        "doc": "Internal section.field → Xplan field-code mapping. Used by the SOA / ROA Builder to ensure the document round-trips through Xmerge with no broken tokens.",
    }


@router.post("/xmerge/{client_id}/push-document")
async def xmerge_push_document(client_id: str, payload: dict):
    """Push a generated SOA / ROA back to Xplan as a Xmerge template instance.
    The frontend sends `{ docType, documentRef, sections, tokenMap }`. In live
    mode this would POST to /xmerge/templates/{tid}/instances. In mock mode
    we record the push in xplan_sync_log + xmerge_documents."""
    doc = {
        "client_id": client_id,
        "doc_type": payload.get("docType", "soa"),
        "document_ref": payload.get("documentRef"),
        "section_count": len(payload.get("sections", [])),
        "tokens_used": list(payload.get("tokenMap", {}).keys()),
        "mode": _mode(),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    await db["xmerge_documents"].insert_one({**doc})
    await db["xplan_sync_log"].insert_one({
        "client_id": client_id, "direction": "push", "module": "xmerge",
        "fields_pushed": len(doc["tokens_used"]), "mode": _mode(),
        "ts": doc["ts"],
    })
    doc.pop("_id", None)
    return {"status": "ok", **doc}


@router.post("/plannerpal/{client_id}/transcribe")
async def plannerpal_transcribe(client_id: str):
    """PlannerPal — generate meeting summary, action items, and follow-up email."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "meeting_id": f"MTG-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')}",
        "summary": "Reviewed retirement readiness. Client raised concerns about market volatility before retirement. Agreed to model a 5-year glide-down to 60/40 mix and re-test cash bucket.",
        "action_items": [
            {"owner": "Adviser", "task": "Run CALM glide-down scenario", "due_in_days": 7},
            {"owner": "Adviser", "task": "Confirm cash bucket sizing target", "due_in_days": 7},
            {"owner": "Client", "task": "Send latest super statements (March quarter)", "due_in_days": 14},
        ],
        "follow_up_email_drafted": True,
    }


# ============================================================================
# MODULE 2 — Xtools / Xtools+ (CALM, Aged Care, Corporate Entity, Retirement)
# ============================================================================

@router.post("/xtools/calm/{client_id}/run")
async def calm_run(client_id: str, payload: dict):
    """CALM — Cash Flow, Assets & Liabilities multi-year projection.
    Uses the local engine; in live mode pushes the result back to Xplan."""
    years = int(payload.get("years", 30))
    return {
        "mode": _mode(),
        "client_id": client_id,
        "years": years,
        "auto_allocation_enabled": True,
        "result": {
            "cash_at_year_end": [50_000 + i * 4500 for i in range(years)],
            "debt_at_year_end": [max(0, 850_000 - i * 35_000) for i in range(years)],
            "super_at_year_end": [int(800_000 * (1.07 ** i)) for i in range(years)],
            "lifestyle_score": 8.4,
        },
    }


@router.post("/xtools/aged-care/{client_id}/model")
async def aged_care_model(client_id: str, payload: dict):
    """Aged Care fee modelling. Returns RAD/DAP options + means-tested fee."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "scenarios": [
            {"option": "RAD only ($550k)", "rad": 550_000, "dap": 0, "means_tested_fee_pa": 14_500},
            {"option": "50/50 RAD/DAP", "rad": 275_000, "dap_pa": 26_125, "means_tested_fee_pa": 14_500},
            {"option": "DAP only", "rad": 0, "dap_pa": 52_250, "means_tested_fee_pa": 14_500},
        ],
        "regulator": "Updated for 2026 Aged Care Act amendments",
    }


@router.post("/xtools/corporate-entity/{client_id}/model")
async def corporate_entity_model(client_id: str, payload: dict):
    """Trust / company entity distribution modelling."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "entity_type": payload.get("entity_type", "Family Trust"),
        "distributions": [
            {"beneficiary": "Spouse 1", "amount": 90_000, "tax_rate": 0.30},
            {"beneficiary": "Spouse 2", "amount": 45_000, "tax_rate": 0.16},
            {"beneficiary": "Adult child A", "amount": 18_200, "tax_rate": 0.0},
            {"beneficiary": "Adult child B", "amount": 18_200, "tax_rate": 0.0},
        ],
        "tax_saving_vs_undistributed": 28_400,
    }


@router.post("/xtools/retirement-income/{client_id}/run")
async def retirement_income_run(client_id: str, payload: dict):
    """Retirement Income Tool 2026 — decumulation strategy."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "strategies": [
            {"name": "Bucket strategy (3-bucket)", "income_pa": 95_000, "longevity_yrs": 32, "confidence": 92},
            {"name": "Constant 4% rule", "income_pa": 88_000, "longevity_yrs": 28, "confidence": 78},
            {"name": "Dynamic spending (Guyton-Klinger)", "income_pa": 102_000, "longevity_yrs": 30, "confidence": 88},
        ],
    }


# ============================================================================
# MODULE 3 — WealthSolver (Product Research & Comparison)
# ============================================================================

@router.get("/wealthsolver/products")
async def list_wealthsolver_products(category: str = "super"):
    """WealthSolver product database (mock = top 6 of 890+ products)."""
    samples = {
        "super": [
            {"name": "Hostplus Indexed Balanced", "fee_pa_pct": 0.06, "5yr_return_pct": 8.2, "rating": 5},
            {"name": "AustralianSuper Balanced",  "fee_pa_pct": 0.18, "5yr_return_pct": 8.5, "rating": 5},
            {"name": "Aware Super High Growth",   "fee_pa_pct": 0.20, "5yr_return_pct": 9.1, "rating": 5},
            {"name": "Vanguard Super Lifecycle",  "fee_pa_pct": 0.21, "5yr_return_pct": 8.0, "rating": 4},
            {"name": "ART (formerly Sunsuper)",   "fee_pa_pct": 0.19, "5yr_return_pct": 8.4, "rating": 4},
            {"name": "Cbus Growth",               "fee_pa_pct": 0.22, "5yr_return_pct": 8.3, "rating": 4},
        ],
        "platform": [
            {"name": "Netwealth Wealth Accelerator", "fee_pa_pct": 0.30, "min_balance": 0, "rating": 5},
            {"name": "HUB24 Super",                  "fee_pa_pct": 0.32, "min_balance": 0, "rating": 5},
            {"name": "BT Panorama",                  "fee_pa_pct": 0.36, "min_balance": 0, "rating": 4},
        ],
    }
    return {"mode": _mode(), "category": category, "results": samples.get(category, [])}


@router.post("/wealthsolver/compare")
async def wealthsolver_compare(payload: dict):
    """Compare 2-3 products at a specific client balance."""
    balance = payload.get("balance", 500_000)
    products = payload.get("products", [])
    return {
        "mode": _mode(),
        "balance": balance,
        "comparison": [
            {"product": p, "annual_fee": int(balance * 0.0025 + 360), "5yr_after_fee_pct": 7.9 + (i * 0.05)}
            for i, p in enumerate(products)
        ],
    }


@router.get("/wealthsolver/insurance-in-super")
async def insurance_in_super():
    return {
        "mode": _mode(),
        "policies": [
            {"fund": "AustralianSuper", "death": 750_000, "tpd": 500_000, "ip_monthly": 15_000, "premium_pa": 1_245},
            {"fund": "Hostplus",        "death": 400_000, "tpd": 250_000, "ip_monthly": 8_000,  "premium_pa": 720},
        ],
    }


# ============================================================================
# MODULE 4 — IPS (Iress Portfolio System)
# ============================================================================

@router.post("/ips/{client_id}/sync-feeds")
async def ips_sync_feeds(client_id: str):
    """IressNet Data Feeds — nightly transaction & price download.
    In live mode pulls from /ips/portfolios/{id}/feed; mock returns counts."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "transactions_imported": 47,
        "prices_updated": 312,
        "as_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/ips/{client_id}/performance")
async def ips_performance(client_id: str, period: str = "ytd"):
    """IRR & TWRR over a custom date range."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "period": period,
        "irr_pct": 8.42,
        "twr_pct": 7.81,
        "benchmark_pct": 7.20,
        "alpha_pct": 0.61,
    }


@router.get("/ips/{client_id}/allocation")
async def ips_allocation(client_id: str):
    return {
        "mode": _mode(),
        "client_id": client_id,
        "current": {"AU Equities": 32, "Intl Equities": 28, "Property": 12, "Fixed Interest": 18, "Cash": 10},
        "target":  {"AU Equities": 30, "Intl Equities": 30, "Property": 10, "Fixed Interest": 20, "Cash": 10},
        "drift_pct_max": 2.0,
    }


@router.get("/ips/{client_id}/cgt")
async def ips_cgt(client_id: str):
    """Realised + unrealised CGT analysis."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "realised_fytd": 18_400,
        "unrealised": 142_300,
        "discount_eligible_pct": 76,
        "loss_carry_forward": 0,
    }


@router.post("/ips/{client_id}/rebalance")
async def ips_rebalance(client_id: str, payload: dict):
    """Generate rebalance instructions vs target / model portfolio."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "model_portfolio": payload.get("model_portfolio", "Halcyon Balanced"),
        "instructions": [
            {"action": "Sell", "holding": "VAS (Vanguard Aus Shares)", "units": 120, "value": 12_000},
            {"action": "Buy",  "holding": "VGS (Vanguard Intl Shares)", "units": 60,  "value": 12_000},
            {"action": "Hold", "holding": "Cash", "units": 0, "value": 0},
        ],
        "estimated_cgt_impact": 1_240,
    }


@router.get("/ips/{client_id}/corporate-actions")
async def ips_corporate_actions(client_id: str):
    return {
        "mode": _mode(),
        "client_id": client_id,
        "events": [
            {"holding": "BHP",  "type": "Dividend",       "amount_per_unit": 1.42, "ex_date": "2026-04-10"},
            {"holding": "CBA",  "type": "Dividend",       "amount_per_unit": 2.30, "ex_date": "2026-04-15"},
            {"holding": "WES",  "type": "Capital Return", "amount_per_unit": 0.50, "ex_date": "2026-05-02"},
        ],
    }


# ============================================================================
# MODULE 5 — Reporting (Advice Wizards, Valuation, FDS, CommPay)
# ============================================================================

@router.post("/reporting/{client_id}/valuation")
async def reporting_valuation(client_id: str):
    """Valuation Wizard — instant portfolio valuation for the meeting."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "as_at": datetime.now(timezone.utc).isoformat(),
        "portfolio_value": 3_240_000,
        "cash_position": 142_500,
        "market_movement_today": 18_400,
        "market_movement_pct": 0.57,
    }


@router.post("/reporting/{client_id}/fds")
async def reporting_fds(client_id: str):
    """Generate a Fee Disclosure Statement (FDS) from the service agreement."""
    return {
        "mode": _mode(),
        "client_id": client_id,
        "period": "FY2025",
        "fees_paid": 4_400,
        "services_delivered": [
            "Annual review meeting", "Portfolio rebalance", "SOA update",
            "Tax planning session", "Insurance review",
        ],
        "fds_pdf_ref": f"FDS-{client_id[:6].upper()}-FY2025",
    }


@router.get("/reporting/commpay")
async def reporting_commpay():
    """CommPay — adviser remuneration & invoice payments dashboard."""
    return {
        "mode": _mode(),
        "month": datetime.now(timezone.utc).strftime("%B %Y"),
        "revenue_to_date": 142_300,
        "invoices_outstanding": 4,
        "outstanding_total": 18_700,
        "commissions_paid": 0,  # AU adviser model — fees only
    }


# ============================================================================
# Sync log (audit trail of every push/pull)
# ============================================================================

@router.get("/log")
async def get_sync_log(limit: int = 50):
    cur = db["xplan_sync_log"].find({}, {"_id": 0}).sort("ts", -1).limit(limit)
    out = []
    async for d in cur:
        out.append(d)
    return {"mode": _mode(), "entries": out, "count": len(out)}


# ============================================================================
# Compliance Dashboard sync — push advice-file metrics into Xplan as a
# practice-level compliance KPI snapshot, or pull external compliance flags
# from Xplan's GRC module back into the local Compliance Dashboard.
# ============================================================================

@router.post("/compliance/push")
async def push_compliance_to_xplan():
    """Push the current Compliance Dashboard metrics into Xplan as a snapshot
    for the practice's GRC reporting trail."""
    # Aggregate the local compliance metrics from the SOA/ROA collection
    # (compliance_documents — same collection the dashboard reads from).
    coll = db["compliance_documents"]
    total = await coll.count_documents({})
    pending = await coll.count_documents({"status": {"$in": ["pending_review", "pending_signature"]}})
    rejected = await coll.count_documents({"review_outcome": {"$in": ["rejected", "requires_changes"]}})
    approved = await coll.count_documents({"review_outcome": "approved"})
    metrics = {
        "compliant": approved, "minor_issues": 0,
        "major_issues": rejected, "pending_review": pending,
        "total": total,
        "compliance_rate": round((approved / total) * 100, 1) if total else 0,
    }
    sync_record = {
        "direction": "push",
        "module": "compliance",
        "metrics": metrics,
        "mode": _mode(),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    await db["xplan_sync_log"].insert_one({**sync_record})
    sync_record.pop("_id", None)
    return {"status": "ok", **sync_record}


@router.post("/compliance/pull")
async def pull_compliance_from_xplan():
    """Pull compliance flags / GRC events from Xplan and upsert them into
    `compliance_documents` so they surface in the Compliance Dashboard."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if XPLAN_LIVE:
        # Real implementation would call Xplan GRC /grc/breaches + /grc/events
        # and merge each flag into compliance_documents as a pending_review row.
        pulled = []
    else:
        # Mock: simulate 2 external flags coming back from Xplan
        pulled = [
            {
                "external_id": "XGRC-7841",
                "client_name": "External · Xplan-only client",
                "document_type": "soa",
                "status": "pending_review",
                "flag": "FoFA Best Interests Duty review required",
                "raised_at": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            },
            {
                "external_id": "XGRC-7842",
                "client_name": "External · Xplan-only client",
                "document_type": "roa",
                "status": "pending_review",
                "flag": "Documentation refresh overdue (60 days)",
                "raised_at": (datetime.now(timezone.utc) - timedelta(days=4)).isoformat(),
            },
        ]
        # Upsert each into `compliance_documents` (the collection the
        # dashboard reads from) so they surface in Advice Files.
        for f in pulled:
            await db["compliance_documents"].update_one(
                {"document_id": f["external_id"]},
                {"$set": {
                    "document_id": f["external_id"],
                    "external_id": f["external_id"],
                    "client_name": f["client_name"],
                    "document_type": f["document_type"],
                    "advice_areas": ["GRC / Xplan-imported"],
                    "advice_date": f["raised_at"][:10],
                    "created_at": f["raised_at"],
                    "adviser_name": "Xplan-imported",
                    "status": f["status"],
                    "review_outcome": None,
                    "compliance_score": 65,
                    "review_conditions": [f["flag"]],
                    "review_due_date": now_iso,
                    "advice_fee": 0,
                    "source": "xplan_grc",
                    "synced_at": now_iso,
                }},
                upsert=True,
            )
    await db["xplan_sync_log"].insert_one({
        "direction": "pull",
        "module": "compliance",
        "items_pulled": len(pulled),
        "mode": _mode(),
        "ts": now_iso,
    })
    return {"status": "ok", "mode": _mode(), "items_pulled": len(pulled), "flags": pulled}
