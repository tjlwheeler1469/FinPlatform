"""
AdviceOS Cost Reduction & ROI Dashboard
=======================================
Shows the business value of AdviceOS:
- Compliance hours saved
- Files auto-approved
- Breaches prevented
- ROI calculator

This is what CFOs care about.
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cost-reduction", tags=["Cost Reduction Dashboard"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
cost_metrics_col = db["cost_reduction_metrics"]
efficiency_logs_col = db["efficiency_logs"]

# ==================== COST ASSUMPTIONS ====================

COST_ASSUMPTIONS = {
    "compliance_officer_hourly_rate": 85,  # AUD per hour
    "adviser_hourly_rate": 120,  # AUD per hour
    "manual_file_review_hours": 2.5,  # Hours per file
    "automated_file_review_hours": 0.5,  # Hours per file with AdviceOS
    "manual_compliance_check_hours": 1.0,  # Hours per check
    "automated_compliance_check_hours": 0.1,  # Hours per check with AdviceOS
    "breach_remediation_cost": 5000,  # AUD per breach
    "regulatory_fine_average": 50000,  # AUD average fine
    "audit_preparation_hours": 40,  # Hours per audit
    "automated_audit_prep_hours": 8,  # Hours with AdviceOS
}

# ==================== MODELS ====================

class EfficiencyLog(BaseModel):
    event_type: str  # file_review, compliance_check, breach_prevented, audit_prep
    manual_time_hours: float
    automated_time_hours: float
    adviser_id: Optional[str] = None
    client_id: Optional[str] = None
    notes: Optional[str] = None
    licensee_id: str = "lic_default"

class ROICalculatorInput(BaseModel):
    num_advisers: int
    files_per_month: int
    compliance_checks_per_month: int
    audits_per_year: int
    current_breach_rate_percent: float
    licensee_id: str = "lic_default"

# ==================== TRACKING ENDPOINTS ====================

@router.post("/log")
async def log_efficiency_event(log: EfficiencyLog):
    """Log an efficiency event for cost reduction tracking."""
    log_id = f"eff_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    
    time_saved = log.manual_time_hours - log.automated_time_hours
    
    # Calculate cost saved based on event type
    if log.event_type in ["file_review", "audit_prep"]:
        hourly_rate = COST_ASSUMPTIONS["compliance_officer_hourly_rate"]
    else:
        hourly_rate = COST_ASSUMPTIONS["adviser_hourly_rate"]
    
    cost_saved = time_saved * hourly_rate
    
    log_doc = {
        "id": log_id,
        "event_type": log.event_type,
        "manual_time_hours": log.manual_time_hours,
        "automated_time_hours": log.automated_time_hours,
        "time_saved_hours": time_saved,
        "cost_saved_aud": cost_saved,
        "adviser_id": log.adviser_id,
        "client_id": log.client_id,
        "notes": log.notes,
        "licensee_id": log.licensee_id,
        "logged_at": now
    }
    
    await efficiency_logs_col.insert_one(log_doc)
    
    return {
        "success": True,
        "log_id": log_id,
        "time_saved_hours": time_saved,
        "cost_saved_aud": cost_saved
    }

# ==================== DASHBOARD ENDPOINTS ====================

@router.get("/dashboard")
async def get_cost_reduction_dashboard(licensee_id: str = "lic_default"):
    """Get cost reduction dashboard with all metrics."""
    now = datetime.now(timezone.utc)
    month_ago = (now - timedelta(days=30)).isoformat()
    year_ago = (now - timedelta(days=365)).isoformat()
    
    # Get monthly logs
    monthly_logs = await efficiency_logs_col.find({
        "licensee_id": licensee_id,
        "logged_at": {"$gte": month_ago}
    }).to_list(1000)
    
    # Get yearly logs
    yearly_logs = await efficiency_logs_col.find({
        "licensee_id": licensee_id,
        "logged_at": {"$gte": year_ago}
    }).to_list(10000)
    
    # Calculate monthly savings
    monthly_time_saved = sum(log.get("time_saved_hours", 0) for log in monthly_logs)
    monthly_cost_saved = sum(log.get("cost_saved_aud", 0) for log in monthly_logs)
    
    # Calculate yearly savings
    yearly_time_saved = sum(log.get("time_saved_hours", 0) for log in yearly_logs)
    yearly_cost_saved = sum(log.get("cost_saved_aud", 0) for log in yearly_logs)
    
    # Count by event type
    monthly_by_type = {}
    for log in monthly_logs:
        event_type = log.get("event_type", "other")
        if event_type not in monthly_by_type:
            monthly_by_type[event_type] = {"count": 0, "time_saved": 0, "cost_saved": 0}
        monthly_by_type[event_type]["count"] += 1
        monthly_by_type[event_type]["time_saved"] += log.get("time_saved_hours", 0)
        monthly_by_type[event_type]["cost_saved"] += log.get("cost_saved_aud", 0)
    
    # Get breach prevention stats (from incidents)
    try:
        incidents_col = db["incidents"]
        breaches_prevented = await incidents_col.count_documents({
            "licensee_id": licensee_id,
            "category": "compliance",
            "severity": {"$in": ["P1", "P2"]},
            "status": "resolved",
            "logged_at": {"$gte": year_ago}
        })
        breach_cost_avoided = breaches_prevented * COST_ASSUMPTIONS["breach_remediation_cost"]
    except Exception:
        breaches_prevented = 0
        breach_cost_avoided = 0
    
    # Get auto-approval stats (from compliance checks)
    try:
        scenarios_col = db["scenarios"]
        auto_approved = await scenarios_col.count_documents({
            "licensee_id": licensee_id,
            "compliance_result": "PASS",
            "created_at": {"$gte": month_ago}
        })
    except Exception:
        auto_approved = 0
    
    return {
        "summary": {
            "monthly_time_saved_hours": round(monthly_time_saved, 1),
            "monthly_cost_saved_aud": round(monthly_cost_saved, 2),
            "yearly_time_saved_hours": round(yearly_time_saved, 1),
            "yearly_cost_saved_aud": round(yearly_cost_saved, 2),
            "equivalent_fte_saved": round(yearly_time_saved / 2080, 2)  # 2080 hours per FTE per year
        },
        "compliance_efficiency": {
            "files_auto_approved_monthly": auto_approved,
            "breaches_prevented_yearly": breaches_prevented,
            "breach_cost_avoided_aud": breach_cost_avoided,
            "compliance_check_time_reduction_percent": 90  # From 1 hour to 6 mins
        },
        "breakdown_by_type": monthly_by_type,
        "adviser_productivity": {
            "time_saved_per_adviser_monthly_hours": round(monthly_time_saved / max(1, len(set(log.get("adviser_id") for log in monthly_logs if log.get("adviser_id")))), 1),
            "additional_client_capacity_percent": 15  # Estimate
        },
        "audit_readiness": {
            "audit_prep_time_reduction_percent": 80,  # From 40 hours to 8 hours
            "instant_evidence_export": True,
            "compliance_documentation_score": 95
        },
        "generated_at": now.isoformat()
    }

@router.post("/roi-calculator")
async def calculate_roi(input_data: ROICalculatorInput):
    """Calculate ROI for AdviceOS implementation."""
    
    # Current costs (manual)
    manual_file_review_cost = (
        input_data.files_per_month * 
        COST_ASSUMPTIONS["manual_file_review_hours"] * 
        COST_ASSUMPTIONS["compliance_officer_hourly_rate"] * 
        12  # Annual
    )
    
    manual_compliance_cost = (
        input_data.compliance_checks_per_month * 
        COST_ASSUMPTIONS["manual_compliance_check_hours"] * 
        COST_ASSUMPTIONS["adviser_hourly_rate"] * 
        12
    )
    
    manual_audit_cost = (
        input_data.audits_per_year * 
        COST_ASSUMPTIONS["audit_preparation_hours"] * 
        COST_ASSUMPTIONS["compliance_officer_hourly_rate"]
    )
    
    expected_breaches = (
        input_data.files_per_month * 12 * 
        (input_data.current_breach_rate_percent / 100)
    )
    
    breach_cost = expected_breaches * COST_ASSUMPTIONS["breach_remediation_cost"]
    
    total_manual_cost = manual_file_review_cost + manual_compliance_cost + manual_audit_cost + breach_cost
    
    # AdviceOS costs (automated)
    automated_file_review_cost = (
        input_data.files_per_month * 
        COST_ASSUMPTIONS["automated_file_review_hours"] * 
        COST_ASSUMPTIONS["compliance_officer_hourly_rate"] * 
        12
    )
    
    automated_compliance_cost = (
        input_data.compliance_checks_per_month * 
        COST_ASSUMPTIONS["automated_compliance_check_hours"] * 
        COST_ASSUMPTIONS["adviser_hourly_rate"] * 
        12
    )
    
    automated_audit_cost = (
        input_data.audits_per_year * 
        COST_ASSUMPTIONS["automated_audit_prep_hours"] * 
        COST_ASSUMPTIONS["compliance_officer_hourly_rate"]
    )
    
    # Breach reduction (assume 70% reduction)
    reduced_breach_cost = breach_cost * 0.3
    
    total_automated_cost = automated_file_review_cost + automated_compliance_cost + automated_audit_cost + reduced_breach_cost
    
    # Savings
    annual_savings = total_manual_cost - total_automated_cost
    
    # Time savings
    time_saved_hours = (
        (input_data.files_per_month * (COST_ASSUMPTIONS["manual_file_review_hours"] - COST_ASSUMPTIONS["automated_file_review_hours"]) * 12) +
        (input_data.compliance_checks_per_month * (COST_ASSUMPTIONS["manual_compliance_check_hours"] - COST_ASSUMPTIONS["automated_compliance_check_hours"]) * 12) +
        (input_data.audits_per_year * (COST_ASSUMPTIONS["audit_preparation_hours"] - COST_ASSUMPTIONS["automated_audit_prep_hours"]))
    )
    
    return {
        "input_parameters": {
            "num_advisers": input_data.num_advisers,
            "files_per_month": input_data.files_per_month,
            "compliance_checks_per_month": input_data.compliance_checks_per_month,
            "audits_per_year": input_data.audits_per_year,
            "current_breach_rate_percent": input_data.current_breach_rate_percent
        },
        "current_costs_annual": {
            "file_review": round(manual_file_review_cost, 2),
            "compliance_checks": round(manual_compliance_cost, 2),
            "audit_preparation": round(manual_audit_cost, 2),
            "breach_remediation": round(breach_cost, 2),
            "total": round(total_manual_cost, 2)
        },
        "with_adviceos_annual": {
            "file_review": round(automated_file_review_cost, 2),
            "compliance_checks": round(automated_compliance_cost, 2),
            "audit_preparation": round(automated_audit_cost, 2),
            "breach_remediation": round(reduced_breach_cost, 2),
            "total": round(total_automated_cost, 2)
        },
        "savings": {
            "annual_cost_savings_aud": round(annual_savings, 2),
            "annual_time_savings_hours": round(time_saved_hours, 1),
            "fte_equivalent_saved": round(time_saved_hours / 2080, 2),
            "breach_reduction_percent": 70,
            "roi_percent": round((annual_savings / max(1, total_automated_cost)) * 100, 1)
        },
        "summary": {
            "headline": f"Save ${round(annual_savings/1000, 0)}K annually",
            "time_headline": f"Save {round(time_saved_hours, 0)} hours per year",
            "breach_headline": f"Prevent {round(expected_breaches * 0.7, 0)} breaches annually"
        }
    }

@router.get("/metrics/live")
async def get_live_metrics(licensee_id: str = "lic_default"):
    """Get live cost reduction metrics for dashboard widgets."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0).isoformat()
    week_ago = (now - timedelta(days=7)).isoformat()
    
    # Today's savings
    today_logs = await efficiency_logs_col.find({
        "licensee_id": licensee_id,
        "logged_at": {"$gte": today_start}
    }).to_list(100)
    
    today_time_saved = sum(log.get("time_saved_hours", 0) for log in today_logs)
    today_cost_saved = sum(log.get("cost_saved_aud", 0) for log in today_logs)
    
    # This week's savings
    week_logs = await efficiency_logs_col.find({
        "licensee_id": licensee_id,
        "logged_at": {"$gte": week_ago}
    }).to_list(500)
    
    week_time_saved = sum(log.get("time_saved_hours", 0) for log in week_logs)
    week_cost_saved = sum(log.get("cost_saved_aud", 0) for log in week_logs)
    
    return {
        "today": {
            "time_saved_hours": round(today_time_saved, 2),
            "cost_saved_aud": round(today_cost_saved, 2),
            "events_processed": len(today_logs)
        },
        "this_week": {
            "time_saved_hours": round(week_time_saved, 2),
            "cost_saved_aud": round(week_cost_saved, 2),
            "events_processed": len(week_logs)
        },
        "updated_at": now.isoformat()
    }

# ==================== DEMO DATA ====================

@router.post("/demo/seed-data")
async def seed_demo_data(licensee_id: str = "lic_default"):
    """Seed demo data for cost reduction dashboard."""
    now = datetime.now(timezone.utc)
    
    demo_events = [
        {"event_type": "file_review", "manual_time_hours": 2.5, "automated_time_hours": 0.5},
        {"event_type": "file_review", "manual_time_hours": 2.5, "automated_time_hours": 0.4},
        {"event_type": "file_review", "manual_time_hours": 2.5, "automated_time_hours": 0.6},
        {"event_type": "compliance_check", "manual_time_hours": 1.0, "automated_time_hours": 0.1},
        {"event_type": "compliance_check", "manual_time_hours": 1.0, "automated_time_hours": 0.08},
        {"event_type": "compliance_check", "manual_time_hours": 1.0, "automated_time_hours": 0.12},
        {"event_type": "audit_prep", "manual_time_hours": 40, "automated_time_hours": 8},
        {"event_type": "breach_prevented", "manual_time_hours": 20, "automated_time_hours": 0},
    ]
    
    for i, event in enumerate(demo_events):
        days_ago = i * 3  # Spread over time
        log_time = (now - timedelta(days=days_ago)).isoformat()
        
        time_saved = event["manual_time_hours"] - event["automated_time_hours"]
        hourly_rate = COST_ASSUMPTIONS["compliance_officer_hourly_rate"] if event["event_type"] in ["file_review", "audit_prep"] else COST_ASSUMPTIONS["adviser_hourly_rate"]
        cost_saved = time_saved * hourly_rate
        
        await efficiency_logs_col.insert_one({
            "id": f"demo_eff_{uuid.uuid4().hex[:8]}",
            "event_type": event["event_type"],
            "manual_time_hours": event["manual_time_hours"],
            "automated_time_hours": event["automated_time_hours"],
            "time_saved_hours": time_saved,
            "cost_saved_aud": cost_saved,
            "adviser_id": f"ADV00{i % 3 + 1}",
            "licensee_id": licensee_id,
            "logged_at": log_time
        })
    
    return {"success": True, "message": "Demo data seeded", "events_created": len(demo_events)}
