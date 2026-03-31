"""
AdviceOS Breach Register
========================
CPS 230 compliant breach register:
- Breach logging with severity
- ASIC reportable flag
- Regulatory reporting triggers
- Escalation workflow visualization
- Separate from incidents (breaches are compliance-specific)
"""

import os
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from enum import Enum
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/breaches", tags=["Breach Register"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
breaches_col = db["breach_register"]
breach_escalations_col = db["breach_escalations"]

# ==================== ENUMS ====================

class BreachSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class BreachCategory(str, Enum):
    ADVICE_QUALITY = "advice_quality"
    DOCUMENTATION = "documentation"
    DISCLOSURE = "disclosure"
    CONFLICT_OF_INTEREST = "conflict_of_interest"
    PRODUCT_SUITABILITY = "product_suitability"
    FEE_DISCLOSURE = "fee_disclosure"
    PRIVACY = "privacy"
    OTHER = "other"

class BreachStatus(str, Enum):
    IDENTIFIED = "identified"
    INVESTIGATING = "investigating"
    CONFIRMED = "confirmed"
    REMEDIATED = "remediated"
    CLOSED = "closed"
    REPORTED_TO_ASIC = "reported_to_asic"

class ASICReportableReason(str, Enum):
    SIGNIFICANT_BREACH = "significant_breach"
    SYSTEMIC_ISSUE = "systemic_issue"
    CLIENT_DETRIMENT = "client_detriment"
    REPORTABLE_SITUATION = "reportable_situation"

# ==================== ASIC REPORTING CRITERIA ====================

ASIC_REPORTING_CRITERIA = {
    "significant_breach": {
        "description": "Breach of core obligations that constitutes a significant breach",
        "timeline_days": 30,
        "examples": [
            "Failure to act in best interests of client",
            "Providing advice without appropriate basis",
            "Failure to prioritize client interests"
        ]
    },
    "systemic_issue": {
        "description": "Issue affecting multiple clients or representing a pattern",
        "timeline_days": 30,
        "examples": [
            "Same error across multiple advice files",
            "System-wide compliance failure",
            "Training or supervision gap"
        ]
    },
    "client_detriment": {
        "description": "Breach causing or likely to cause significant detriment to clients",
        "timeline_days": 30,
        "examples": [
            "Financial loss to clients",
            "Inappropriate product recommendations",
            "Failure to disclose material information"
        ]
    },
    "reportable_situation": {
        "description": "Situation requiring immediate notification",
        "timeline_days": 1,
        "examples": [
            "Fraud or dishonesty",
            "Gross negligence",
            "Significant breach discovered"
        ]
    }
}

# ==================== MODELS ====================

class Breach(BaseModel):
    title: str
    description: str
    severity: BreachSeverity
    category: BreachCategory
    adviser_id: Optional[str] = None
    adviser_name: Optional[str] = None
    client_id: Optional[str] = None
    client_name: Optional[str] = None
    identified_by: str
    identified_date: str
    root_cause: Optional[str] = None
    licensee_id: str = "lic_default"

class BreachUpdate(BaseModel):
    status: Optional[BreachStatus] = None
    update_notes: str
    updated_by: str
    remediation_action: Optional[str] = None
    client_notified: bool = False
    compensation_required: bool = False
    compensation_amount: Optional[float] = None

class ASICReport(BaseModel):
    breach_id: str
    reportable_reason: ASICReportableReason
    report_reference: str
    reported_by: str
    report_date: str
    asic_response: Optional[str] = None

# ==================== HELPER FUNCTIONS ====================

def assess_asic_reportable(breach: Dict[str, Any]) -> Dict[str, Any]:
    """Assess if breach is ASIC reportable."""
    severity = breach.get("severity", "low")
    category = breach.get("category", "other")
    
    reportable = False
    reasons = []
    timeline_days = 30
    
    # Critical breaches are almost always reportable
    if severity == "critical":
        reportable = True
        reasons.append("Critical severity breach")
        timeline_days = 1
    
    # High severity with client impact
    if severity == "high" and category in ["advice_quality", "product_suitability", "conflict_of_interest"]:
        reportable = True
        reasons.append("High severity advice/suitability breach")
    
    # Multiple affected clients indicates systemic issue
    if breach.get("affected_clients_count", 0) > 1:
        reportable = True
        reasons.append("Multiple clients affected - potential systemic issue")
    
    # Financial detriment
    if breach.get("compensation_required") or breach.get("client_financial_loss"):
        reportable = True
        reasons.append("Client financial detriment")
    
    return {
        "is_reportable": reportable,
        "reasons": reasons,
        "deadline_days": timeline_days,
        "deadline_date": (datetime.now(timezone.utc) + timedelta(days=timeline_days)).isoformat() if reportable else None,
        "guidance": ASIC_REPORTING_CRITERIA
    }

# ==================== BREACH ENDPOINTS ====================

@router.post("/register")
async def register_breach(breach: Breach):
    """Register a new breach in the breach register."""
    breach_id = f"BRH-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    breach_doc = {
        "id": breach_id,
        "title": breach.title,
        "description": breach.description,
        "severity": breach.severity.value,
        "category": breach.category.value,
        "status": BreachStatus.IDENTIFIED.value,
        "adviser_id": breach.adviser_id,
        "adviser_name": breach.adviser_name,
        "client_id": breach.client_id,
        "client_name": breach.client_name,
        "identified_by": breach.identified_by,
        "identified_date": breach.identified_date,
        "root_cause": breach.root_cause,
        "licensee_id": breach.licensee_id,
        "asic_reportable": False,
        "asic_reported": False,
        "asic_report_reference": None,
        "remediation_status": "pending",
        "client_notified": False,
        "compensation_required": False,
        "compensation_amount": None,
        "created_at": now,
        "updated_at": now,
        "timeline": [{
            "timestamp": now,
            "event": "breach_registered",
            "user": breach.identified_by,
            "notes": f"Breach registered: {breach.title}"
        }]
    }
    
    # Assess ASIC reportability
    asic_assessment = assess_asic_reportable(breach_doc)
    breach_doc["asic_assessment"] = asic_assessment
    breach_doc["asic_reportable"] = asic_assessment["is_reportable"]
    
    await breaches_col.insert_one(breach_doc)
    
    # Log to audit
    try:
        from routes.audit_service import log_audit_event, AuditEvent
        await log_audit_event(AuditEvent(
            event_type="breach_registered",
            entity_type="breach",
            entity_id=breach_id,
            user_id=breach.identified_by,
            licensee_id=breach.licensee_id,
            action_description=f"Breach registered: {breach.title} ({breach.severity.value})"
        ))
    except Exception:
        pass
    
    return {
        "breach_id": breach_id,
        "severity": breach.severity.value,
        "status": "identified",
        "asic_reportable": asic_assessment["is_reportable"],
        "asic_deadline": asic_assessment.get("deadline_date"),
        "message": "Breach registered successfully"
    }

@router.get("/register")
async def list_breaches(
    licensee_id: str = "lic_default",
    status: Optional[str] = None,
    severity: Optional[str] = None,
    asic_reportable: Optional[bool] = None,
    limit: int = 50
):
    """List breaches with filters."""
    query = {"licensee_id": licensee_id}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    if asic_reportable is not None:
        query["asic_reportable"] = asic_reportable
    
    breaches = await breaches_col.find(
        query,
        {"_id": 0, "timeline": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "breaches": breaches,
        "total": len(breaches),
        "asic_reportable_count": len([b for b in breaches if b.get("asic_reportable")]),
        "pending_asic_report": len([b for b in breaches if b.get("asic_reportable") and not b.get("asic_reported")])
    }

@router.get("/register/{breach_id}")
async def get_breach(breach_id: str):
    """Get breach details with full timeline."""
    breach = await breaches_col.find_one({"id": breach_id}, {"_id": 0})
    if not breach:
        raise HTTPException(status_code=404, detail="Breach not found")
    return breach

@router.post("/register/{breach_id}/update")
async def update_breach(breach_id: str, update: BreachUpdate):
    """Update breach status or add notes."""
    breach = await breaches_col.find_one({"id": breach_id})
    if not breach:
        raise HTTPException(status_code=404, detail="Breach not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    update_fields = {"updated_at": now}
    timeline_event = {
        "timestamp": now,
        "event": "breach_updated",
        "user": update.updated_by,
        "notes": update.update_notes
    }
    
    if update.status:
        update_fields["status"] = update.status.value
        timeline_event["event"] = f"status_changed_to_{update.status.value}"
    
    if update.remediation_action:
        update_fields["remediation_action"] = update.remediation_action
        update_fields["remediation_status"] = "in_progress"
    
    if update.client_notified:
        update_fields["client_notified"] = True
        update_fields["client_notified_date"] = now
    
    if update.compensation_required:
        update_fields["compensation_required"] = True
        update_fields["compensation_amount"] = update.compensation_amount
    
    await breaches_col.update_one(
        {"id": breach_id},
        {
            "$set": update_fields,
            "$push": {"timeline": timeline_event}
        }
    )
    
    # Re-assess ASIC reportability
    updated_breach = await breaches_col.find_one({"id": breach_id})
    asic_assessment = assess_asic_reportable(updated_breach)
    
    await breaches_col.update_one(
        {"id": breach_id},
        {"$set": {"asic_assessment": asic_assessment, "asic_reportable": asic_assessment["is_reportable"]}}
    )
    
    return {
        "success": True,
        "breach_id": breach_id,
        "new_status": update.status.value if update.status else breach["status"],
        "asic_reportable": asic_assessment["is_reportable"]
    }

@router.post("/register/{breach_id}/report-asic")
async def report_to_asic(breach_id: str, report: ASICReport):
    """Record ASIC report for a breach."""
    breach = await breaches_col.find_one({"id": breach_id})
    if not breach:
        raise HTTPException(status_code=404, detail="Breach not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await breaches_col.update_one(
        {"id": breach_id},
        {
            "$set": {
                "asic_reported": True,
                "asic_report_reference": report.report_reference,
                "asic_reported_date": report.report_date,
                "asic_reported_by": report.reported_by,
                "asic_reportable_reason": report.reportable_reason.value,
                "status": BreachStatus.REPORTED_TO_ASIC.value,
                "updated_at": now
            },
            "$push": {
                "timeline": {
                    "timestamp": now,
                    "event": "reported_to_asic",
                    "user": report.reported_by,
                    "notes": f"Reported to ASIC - Reference: {report.report_reference}"
                }
            }
        }
    )
    
    # Log to audit
    try:
        from routes.audit_service import log_audit_event, AuditEvent
        await log_audit_event(AuditEvent(
            event_type="asic_report",
            entity_type="breach",
            entity_id=breach_id,
            user_id=report.reported_by,
            action_description=f"Breach reported to ASIC: {report.report_reference}"
        ))
    except Exception:
        pass
    
    return {
        "success": True,
        "breach_id": breach_id,
        "asic_reference": report.report_reference,
        "status": "reported_to_asic"
    }

# ==================== DASHBOARD ====================

@router.get("/dashboard")
async def breach_dashboard(licensee_id: str = "lic_default"):
    """Get breach register dashboard."""
    now = datetime.now(timezone.utc)
    year_start = datetime(now.year, 1, 1, tzinfo=timezone.utc).isoformat()
    month_ago = (now - timedelta(days=30)).isoformat()
    
    all_breaches = await breaches_col.find({"licensee_id": licensee_id}).to_list(1000)
    ytd_breaches = [b for b in all_breaches if b.get("created_at", "") >= year_start]
    monthly_breaches = [b for b in all_breaches if b.get("created_at", "") >= month_ago]
    
    # By severity
    by_severity = {}
    for b in ytd_breaches:
        sev = b.get("severity", "low")
        by_severity[sev] = by_severity.get(sev, 0) + 1
    
    # By category
    by_category = {}
    for b in ytd_breaches:
        cat = b.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + 1
    
    # By status
    by_status = {}
    for b in all_breaches:
        status = b.get("status", "identified")
        by_status[status] = by_status.get(status, 0) + 1
    
    # ASIC reporting
    asic_reportable = [b for b in all_breaches if b.get("asic_reportable")]
    asic_reported = [b for b in all_breaches if b.get("asic_reported")]
    pending_asic = [b for b in asic_reportable if not b.get("asic_reported")]
    
    # Overdue ASIC reports
    overdue_asic = []
    for b in pending_asic:
        deadline = b.get("asic_assessment", {}).get("deadline_date")
        if deadline and deadline < now.isoformat():
            overdue_asic.append(b)
    
    return {
        "summary": {
            "total_breaches": len(all_breaches),
            "ytd_breaches": len(ytd_breaches),
            "monthly_breaches": len(monthly_breaches),
            "open_breaches": len([b for b in all_breaches if b.get("status") not in ["closed", "remediated"]])
        },
        "by_severity": by_severity,
        "by_category": by_category,
        "by_status": by_status,
        "asic_reporting": {
            "total_reportable": len(asic_reportable),
            "reported": len(asic_reported),
            "pending_report": len(pending_asic),
            "overdue": len(overdue_asic),
            "overdue_breaches": [{"id": b["id"], "title": b["title"], "deadline": b.get("asic_assessment", {}).get("deadline_date")} for b in overdue_asic]
        },
        "remediation": {
            "pending": len([b for b in all_breaches if b.get("remediation_status") == "pending"]),
            "in_progress": len([b for b in all_breaches if b.get("remediation_status") == "in_progress"]),
            "completed": len([b for b in all_breaches if b.get("remediation_status") == "completed"]),
            "compensation_total": sum(b.get("compensation_amount", 0) for b in all_breaches if b.get("compensation_required"))
        },
        "criteria": ASIC_REPORTING_CRITERIA,
        "generated_at": now.isoformat()
    }

@router.get("/report/regulatory")
async def generate_regulatory_report(
    licensee_id: str = "lic_default",
    period_start: Optional[str] = None,
    period_end: Optional[str] = None
):
    """Generate regulatory breach report."""
    now = datetime.now(timezone.utc)
    
    if not period_start:
        period_start = datetime(now.year, 1, 1, tzinfo=timezone.utc).isoformat()
    if not period_end:
        period_end = now.isoformat()
    
    breaches = await breaches_col.find({
        "licensee_id": licensee_id,
        "created_at": {"$gte": period_start, "$lte": period_end}
    }, {"_id": 0}).to_list(1000)
    
    report_id = f"BRH-RPT-{uuid.uuid4().hex[:8].upper()}"
    
    return {
        "report_id": report_id,
        "report_type": "breach_register_summary",
        "period": {
            "start": period_start[:10],
            "end": period_end[:10]
        },
        "licensee_id": licensee_id,
        "summary": {
            "total_breaches": len(breaches),
            "by_severity": {
                "critical": len([b for b in breaches if b.get("severity") == "critical"]),
                "high": len([b for b in breaches if b.get("severity") == "high"]),
                "medium": len([b for b in breaches if b.get("severity") == "medium"]),
                "low": len([b for b in breaches if b.get("severity") == "low"])
            },
            "asic_reported": len([b for b in breaches if b.get("asic_reported")]),
            "compensation_paid": sum(b.get("compensation_amount", 0) for b in breaches if b.get("compensation_required"))
        },
        "breaches": [{
            "id": b["id"],
            "title": b["title"],
            "severity": b["severity"],
            "category": b["category"],
            "status": b["status"],
            "identified_date": b.get("identified_date"),
            "asic_reported": b.get("asic_reported", False),
            "asic_reference": b.get("asic_report_reference")
        } for b in breaches],
        "certification": {
            "generated_at": now.isoformat(),
            "generated_by": "AdviceOS Breach Register",
            "hash": hashlib.sha256(f"{report_id}{len(breaches)}{period_start}".encode()).hexdigest()
        }
    }

# ==================== DEMO DATA ====================

@router.post("/demo/seed-data")
async def seed_demo_breaches(licensee_id: str = "lic_default"):
    """Seed demo breach data."""
    now = datetime.now(timezone.utc)
    
    demo_breaches = [
        {
            "title": "Incomplete Risk Profile Documentation",
            "description": "Client risk profile questionnaire was not fully completed before advice provided",
            "severity": "medium",
            "category": "documentation",
            "adviser_id": "ADV001",
            "adviser_name": "John Smith"
        },
        {
            "title": "Fee Disclosure Omission",
            "description": "Ongoing advice fees not clearly disclosed in SOA",
            "severity": "high",
            "category": "fee_disclosure",
            "adviser_id": "ADV002",
            "adviser_name": "Sarah Johnson"
        },
        {
            "title": "Product Outside APL",
            "description": "Recommended product not on Approved Product List",
            "severity": "high",
            "category": "product_suitability",
            "adviser_id": "ADV001",
            "adviser_name": "John Smith"
        }
    ]
    
    created = []
    for i, breach in enumerate(demo_breaches):
        breach_id = f"BRH-DEMO-{i+1:03d}"
        days_ago = (i + 1) * 7
        identified_date = (now - timedelta(days=days_ago)).isoformat()
        
        breach_doc = {
            "id": breach_id,
            "title": breach["title"],
            "description": breach["description"],
            "severity": breach["severity"],
            "category": breach["category"],
            "status": "identified" if i == 0 else "investigating",
            "adviser_id": breach["adviser_id"],
            "adviser_name": breach["adviser_name"],
            "client_id": f"XP-00{i+1}",
            "client_name": f"Demo Client {i+1}",
            "identified_by": "compliance_team",
            "identified_date": identified_date,
            "licensee_id": licensee_id,
            "asic_reportable": breach["severity"] == "high",
            "asic_reported": False,
            "remediation_status": "pending",
            "created_at": identified_date,
            "updated_at": now.isoformat(),
            "timeline": [{
                "timestamp": identified_date,
                "event": "breach_registered",
                "user": "compliance_team",
                "notes": f"Breach identified: {breach['title']}"
            }]
        }
        
        if breach["severity"] == "high":
            breach_doc["asic_assessment"] = assess_asic_reportable(breach_doc)
        
        await breaches_col.update_one(
            {"id": breach_id},
            {"$set": breach_doc},
            upsert=True
        )
        created.append(breach_id)
    
    return {"success": True, "breaches_created": len(created), "ids": created}
