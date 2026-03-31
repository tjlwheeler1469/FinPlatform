"""
Client Pack Scheduler — Auto-schedule quarterly review pack generation.
Allows advisers to schedule, view, and download bundled client review packs.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uuid
import asyncio
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/client-pack", tags=["Client Pack Scheduler"])

# ── In-memory store (production: MongoDB) ──
SCHEDULES: dict = {}
GENERATED_PACKS: dict = {}

# ── Models ──
class ScheduleRequest(BaseModel):
    client_id: str
    client_name: str
    frequency: str = "quarterly"  # quarterly, monthly, annually
    next_run: Optional[str] = None
    include_portfolio: bool = True
    include_performance: bool = True
    include_compliance: bool = True
    adviser_notes: Optional[str] = None

class ScheduleResponse(BaseModel):
    schedule_id: str
    client_id: str
    client_name: str
    frequency: str
    next_run: str
    status: str
    created_at: str


def _next_quarter_date() -> str:
    now = datetime.now(timezone.utc)
    month = now.month
    if month <= 3:
        return f"{now.year}-04-01T00:00:00Z"
    elif month <= 6:
        return f"{now.year}-07-01T00:00:00Z"
    elif month <= 9:
        return f"{now.year}-10-01T00:00:00Z"
    else:
        return f"{now.year + 1}-01-01T00:00:00Z"


def _generate_mock_pack_data(client_name: str) -> dict:
    """Generate realistic pack data for a client."""
    import random
    portfolio_val = random.randint(800000, 8000000)
    ret = round(random.uniform(3.5, 14.2), 1)
    bench = round(ret - random.uniform(-1.5, 3.0), 1)
    return {
        "type": "client_pack",
        "client_name": client_name,
        "pack_title": f"Quarterly Review Pack - Q{((datetime.now().month - 1) // 3) + 1} {datetime.now().year}",
        "portfolio_summary": {
            "total_value": portfolio_val,
            "cash_position": int(portfolio_val * 0.05),
            "asset_allocation": [
                {"asset_class": "Australian Equities", "value": int(portfolio_val * 0.35), "percentage": "35%"},
                {"asset_class": "International Equities", "value": int(portfolio_val * 0.25), "percentage": "25%"},
                {"asset_class": "Fixed Income", "value": int(portfolio_val * 0.20), "percentage": "20%"},
                {"asset_class": "Property", "value": int(portfolio_val * 0.10), "percentage": "10%"},
                {"asset_class": "Alternatives", "value": int(portfolio_val * 0.05), "percentage": "5%"},
                {"asset_class": "Cash", "value": int(portfolio_val * 0.05), "percentage": "5%"},
            ],
            "top_holdings": [
                {"name": "CBA", "value": int(portfolio_val * 0.08), "weight": "8%", "return_ytd": f"+{round(random.uniform(5, 18), 1)}%"},
                {"name": "BHP", "value": int(portfolio_val * 0.06), "weight": "6%", "return_ytd": f"+{round(random.uniform(2, 12), 1)}%"},
                {"name": "CSL", "value": int(portfolio_val * 0.05), "weight": "5%", "return_ytd": f"+{round(random.uniform(8, 22), 1)}%"},
            ],
        },
        "performance_report": {
            "period": f"1 Jan {datetime.now().year} - {datetime.now().strftime('%d %b %Y')}",
            "portfolio_return": f"+{ret}%",
            "benchmark_return": f"+{bench}%",
            "alpha": f"+{round(ret - bench, 1)}%",
            "commentary": f"{client_name} portfolio outperformed the benchmark by {round(ret - bench, 1)}% this quarter, driven by strong equity selection in Australian financials and healthcare.",
            "attribution": [
                {"factor": "Asset Allocation", "contribution": f"+{round(random.uniform(0.5, 2.0), 1)}%"},
                {"factor": "Security Selection", "contribution": f"+{round(random.uniform(0.3, 1.5), 1)}%"},
                {"factor": "Currency", "contribution": f"{round(random.uniform(-0.5, 0.5), 1)}%"},
            ],
        },
        "compliance_checklist": {
            "review_status": random.choice(["Current", "Current", "Due Soon"]),
            "last_soa_date": (datetime.now() - timedelta(days=random.randint(30, 180))).strftime("%d %b %Y"),
            "next_review_due": (datetime.now() + timedelta(days=random.randint(30, 365))).strftime("%d %b %Y"),
            "fee_disclosure_current": True,
            "risk_profile_current": random.choice([True, True, False]),
            "items": [
                {"item": "Annual Review Completed", "status": "Complete", "notes": "Reviewed all holdings and risk profile"},
                {"item": "Fee Disclosure Statement", "status": "Complete", "notes": "FDS sent and acknowledged"},
                {"item": "Risk Profile Review", "status": random.choice(["Complete", "Pending"]), "notes": "Updated risk questionnaire"},
                {"item": "Insurance Needs Analysis", "status": random.choice(["Complete", "Overdue"]), "notes": "Life and TPD coverage reviewed"},
            ],
        },
        "key_recommendations": [
            "Consider rebalancing equity allocation back to strategic weights",
            "Review fixed income duration given rising rate environment",
            f"Total insurance coverage adequate for {client_name} current situation",
        ],
        "next_steps": [
            "Schedule Q2 review meeting",
            "Implement recommended rebalancing trades",
            "Update estate planning documents",
        ],
        "adviser_notes": f"Strong quarter for {client_name}. Portfolio well-positioned for current market conditions.",
        "disclaimer": "This client pack is for internal adviser use and client review meetings. It does not constitute personal financial advice.",
    }


@router.post("/schedule")
async def create_schedule(request: ScheduleRequest) -> dict:
    """Create a new client pack generation schedule."""
    schedule_id = f"sched_{uuid.uuid4().hex[:8]}"
    next_run = request.next_run or _next_quarter_date()

    schedule = {
        "schedule_id": schedule_id,
        "client_id": request.client_id,
        "client_name": request.client_name,
        "frequency": request.frequency,
        "next_run": next_run,
        "include_portfolio": request.include_portfolio,
        "include_performance": request.include_performance,
        "include_compliance": request.include_compliance,
        "adviser_notes": request.adviser_notes,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_generated": None,
        "packs_generated": 0,
    }
    SCHEDULES[schedule_id] = schedule

    return {
        "success": True,
        "schedule": schedule,
        "message": f"Client pack scheduled for {request.client_name} ({request.frequency}). Next run: {next_run}",
    }


@router.get("/schedules")
async def list_schedules(status: Optional[str] = None) -> dict:
    """List all client pack schedules."""
    schedules = list(SCHEDULES.values())
    if status:
        schedules = [s for s in schedules if s["status"] == status]
    schedules.sort(key=lambda s: s.get("next_run", ""), reverse=False)
    return {"schedules": schedules, "total": len(schedules), "active": sum(1 for s in schedules if s["status"] == "active")}


@router.delete("/schedule/{schedule_id}")
async def delete_schedule(schedule_id: str) -> dict:
    """Cancel a client pack schedule."""
    if schedule_id not in SCHEDULES:
        raise HTTPException(status_code=404, detail="Schedule not found")
    SCHEDULES[schedule_id]["status"] = "cancelled"
    return {"success": True, "message": "Schedule cancelled"}


@router.post("/generate/{client_id}")
async def generate_pack_now(client_id: str, client_name: str = "Client") -> dict:
    """Generate a client pack immediately (on demand)."""
    pack_id = f"pack_{uuid.uuid4().hex[:8]}"
    pack_data = _generate_mock_pack_data(client_name)

    pack_record = {
        "pack_id": pack_id,
        "client_id": client_id,
        "client_name": client_name,
        "pack_data": pack_data,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "ready",
        "download_url": f"/api/pdf-report/generate",
    }
    GENERATED_PACKS[pack_id] = pack_record

    return {
        "success": True,
        "pack": {
            "pack_id": pack_id,
            "client_name": client_name,
            "generated_at": pack_record["generated_at"],
            "status": "ready",
            "analysis_data": pack_data,
        },
        "message": f"Client pack generated for {client_name}. Ready for download.",
    }


@router.get("/packs")
async def list_generated_packs(client_id: Optional[str] = None) -> dict:
    """List all generated packs, optionally filtered by client."""
    packs = list(GENERATED_PACKS.values())
    if client_id:
        packs = [p for p in packs if p["client_id"] == client_id]
    packs.sort(key=lambda p: p.get("generated_at", ""), reverse=True)
    return {
        "packs": [
            {
                "pack_id": p["pack_id"],
                "client_id": p["client_id"],
                "client_name": p["client_name"],
                "generated_at": p["generated_at"],
                "status": p["status"],
            }
            for p in packs
        ],
        "total": len(packs),
    }


@router.get("/pack/{pack_id}")
async def get_pack(pack_id: str) -> dict:
    """Get a specific generated pack with its data."""
    if pack_id not in GENERATED_PACKS:
        raise HTTPException(status_code=404, detail="Pack not found")
    pack = GENERATED_PACKS[pack_id]
    return {
        "pack_id": pack["pack_id"],
        "client_name": pack["client_name"],
        "generated_at": pack["generated_at"],
        "status": pack["status"],
        "analysis_data": pack["pack_data"],
    }


@router.post("/generate-all")
async def generate_all_scheduled(background_tasks: BackgroundTasks) -> dict:
    """Trigger generation for all active schedules (simulates cron job)."""
    active = [s for s in SCHEDULES.values() if s["status"] == "active"]
    generated = []

    for schedule in active:
        pack_id = f"pack_{uuid.uuid4().hex[:8]}"
        pack_data = _generate_mock_pack_data(schedule["client_name"])
        pack_record = {
            "pack_id": pack_id,
            "client_id": schedule["client_id"],
            "client_name": schedule["client_name"],
            "pack_data": pack_data,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "status": "ready",
            "schedule_id": schedule["schedule_id"],
        }
        GENERATED_PACKS[pack_id] = pack_record
        schedule["last_generated"] = pack_record["generated_at"]
        schedule["packs_generated"] = schedule.get("packs_generated", 0) + 1
        generated.append({"pack_id": pack_id, "client_name": schedule["client_name"]})

    return {
        "success": True,
        "generated_count": len(generated),
        "packs": generated,
        "message": f"Generated {len(generated)} client packs for all active schedules.",
    }
