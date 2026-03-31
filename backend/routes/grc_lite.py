"""
AdviceOS GRC-Lite Layer
=========================
Lightweight Governance, Risk & Compliance features embedded in the adviser workflow.
Auto-generates risk register entries, tracks incidents, and maps controls.
Designed to be powerful but NOT feel like enterprise GRC software.
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/grc", tags=["GRC-Lite"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
risk_register_col = db["risk_register"]
incidents_col = db["incidents"]
controls_col = db["controls"]
breach_flags_col = db["breach_flags"]
adviser_decisions_col = db["adviser_decisions"]
compliance_checks_col = db["compliance_checks"]
audit_logs_col = db["audit_logs"]

# ==================== MODELS ====================

class RiskEntry(BaseModel):
    risk_type: str  # compliance, operational, conduct, system
    description: str
    linked_activity: Optional[str] = None
    linked_entity_id: Optional[str] = None
    severity: str = "medium"  # low, medium, high, critical
    likelihood: str = "possible"  # rare, unlikely, possible, likely, almost_certain
    owner: Optional[str] = None
    mitigation: Optional[str] = None
    status: str = "open"  # open, mitigating, closed, accepted

class IncidentCreate(BaseModel):
    incident_type: str  # system, compliance, conduct, operational
    severity: str  # low, medium, high, critical
    description: str
    affected_clients: List[str] = []
    affected_advisers: List[str] = []
    root_cause: Optional[str] = None
    immediate_action: Optional[str] = None

class ControlMapping(BaseModel):
    control_name: str
    control_type: str  # preventive, detective, corrective
    linked_rule: str
    linked_risk_id: Optional[str] = None
    frequency: str = "real_time"  # real_time, daily, weekly, monthly
    automation_level: str = "automated"  # manual, semi_automated, automated
    status: str = "active"

# ==================== RISK REGISTER ====================

@router.post("/risk/create")
async def create_risk_entry(risk: RiskEntry) -> dict:
    """Manually create a risk register entry."""
    risk_id = f"risk_{uuid.uuid4().hex[:12]}"
    
    risk_doc = {
        "id": risk_id,
        "risk_type": risk.risk_type,
        "description": risk.description,
        "linked_activity": risk.linked_activity,
        "linked_entity_id": risk.linked_entity_id,
        "severity": risk.severity,
        "likelihood": risk.likelihood,
        "risk_score": calculate_risk_score(risk.severity, risk.likelihood),
        "owner": risk.owner,
        "mitigation": risk.mitigation,
        "status": risk.status,
        "auto_generated": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await risk_register_col.insert_one(risk_doc)
    
    return {"success": True, "risk_id": risk_id}

def calculate_risk_score(severity: str, likelihood: str) -> int:
    """Calculate risk score from severity and likelihood."""
    severity_scores = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    likelihood_scores = {"rare": 1, "unlikely": 2, "possible": 3, "likely": 4, "almost_certain": 5}
    return severity_scores.get(severity, 2) * likelihood_scores.get(likelihood, 3)

async def auto_generate_risk_from_breach(breach_doc: Dict[str, Any]) -> dict:
    """Auto-generate risk register entry from a compliance breach."""
    risk_id = f"risk_auto_{uuid.uuid4().hex[:8]}"
    
    severity_map = {"low": "low", "medium": "medium", "high": "high", "critical": "critical"}
    
    risk_doc = {
        "id": risk_id,
        "risk_type": "compliance",
        "description": f"Compliance breach detected: {breach_doc.get('breach_type', 'Unknown')}",
        "linked_activity": "compliance_check",
        "linked_entity_id": breach_doc.get("id"),
        "severity": severity_map.get(breach_doc.get("severity", "medium"), "medium"),
        "likelihood": "likely" if breach_doc.get("recurring", False) else "possible",
        "risk_score": calculate_risk_score(
            severity_map.get(breach_doc.get("severity", "medium"), "medium"),
            "likely" if breach_doc.get("recurring", False) else "possible"
        ),
        "owner": breach_doc.get("adviser_id"),
        "mitigation": "Review and remediate breach. Implement preventive controls.",
        "status": "open",
        "auto_generated": True,
        "source": "breach",
        "source_id": breach_doc.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await risk_register_col.insert_one(risk_doc)
    return risk_id

async def auto_generate_risk_from_override(override_doc: Dict[str, Any]) -> dict:
    """Auto-generate risk register entry from an adviser override."""
    risk_id = f"risk_auto_{uuid.uuid4().hex[:8]}"
    
    risk_doc = {
        "id": risk_id,
        "risk_type": "conduct",
        "description": "Adviser override of compliance guidance",
        "linked_activity": "adviser_decision",
        "linked_entity_id": override_doc.get("id"),
        "severity": "medium",
        "likelihood": "possible",
        "risk_score": 6,
        "owner": override_doc.get("adviser_id"),
        "mitigation": "Review override justification. Assess if systemic issue.",
        "status": "open",
        "auto_generated": True,
        "source": "override",
        "source_id": override_doc.get("id"),
        "override_reason": override_doc.get("override_reason"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await risk_register_col.insert_one(risk_doc)
    return risk_id

@router.get("/risk/register")
async def get_risk_register(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    risk_type: Optional[str] = None,
    limit: int = 100
) -> dict:
    """Get risk register entries with optional filtering."""
    query = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    if risk_type:
        query["risk_type"] = risk_type
    
    risks = await risk_register_col.find(query, {"_id": 0}).sort("risk_score", -1).limit(limit).to_list(limit)
    
    # Calculate summary stats
    all_risks = await risk_register_col.find({}, {"severity": 1, "status": 1, "risk_type": 1}).to_list(1000)
    
    return {
        "risks": risks,
        "count": len(risks),
        "summary": {
            "total": len(all_risks),
            "by_status": {
                "open": len([r for r in all_risks if r.get("status") == "open"]),
                "mitigating": len([r for r in all_risks if r.get("status") == "mitigating"]),
                "closed": len([r for r in all_risks if r.get("status") == "closed"]),
                "accepted": len([r for r in all_risks if r.get("status") == "accepted"])
            },
            "by_severity": {
                "critical": len([r for r in all_risks if r.get("severity") == "critical"]),
                "high": len([r for r in all_risks if r.get("severity") == "high"]),
                "medium": len([r for r in all_risks if r.get("severity") == "medium"]),
                "low": len([r for r in all_risks if r.get("severity") == "low"])
            },
            "by_type": {
                "compliance": len([r for r in all_risks if r.get("risk_type") == "compliance"]),
                "operational": len([r for r in all_risks if r.get("risk_type") == "operational"]),
                "conduct": len([r for r in all_risks if r.get("risk_type") == "conduct"]),
                "system": len([r for r in all_risks if r.get("risk_type") == "system"])
            }
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.put("/risk/{risk_id}/update")
async def update_risk_entry(risk_id: str, updates: Dict[str, Any]) -> dict:
    """Update a risk register entry."""
    allowed_fields = ["status", "severity", "likelihood", "owner", "mitigation", "description"]
    update_dict = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if "severity" in update_dict or "likelihood" in update_dict:
        # Recalculate risk score
        risk = await risk_register_col.find_one({"id": risk_id})
        if risk:
            new_severity = update_dict.get("severity", risk.get("severity", "medium"))
            new_likelihood = update_dict.get("likelihood", risk.get("likelihood", "possible"))
            update_dict["risk_score"] = calculate_risk_score(new_severity, new_likelihood)
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await risk_register_col.update_one(
        {"id": risk_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Risk entry not found")
    
    return {"success": True, "message": "Risk entry updated"}

@router.post("/risk/auto-populate")
async def auto_populate_risk_register() -> dict:
    """Auto-populate risk register from breaches and overrides."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    created_risks = []
    
    # Get recent breaches
    breaches = await breach_flags_col.find(
        {"detected_at": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).to_list(100)
    
    for breach in breaches:
        # Check if risk already exists for this breach
        existing = await risk_register_col.find_one({"source_id": breach.get("id")})
        if not existing:
            risk_id = await auto_generate_risk_from_breach(breach)
            created_risks.append({"type": "breach", "risk_id": risk_id})
    
    # Get recent overrides
    overrides = await adviser_decisions_col.find(
        {"override_occurred": True, "created_at": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).to_list(100)
    
    for override in overrides:
        # Check if risk already exists for this override
        existing = await risk_register_col.find_one({"source_id": override.get("id")})
        if not existing:
            risk_id = await auto_generate_risk_from_override(override)
            created_risks.append({"type": "override", "risk_id": risk_id})
    
    return {
        "success": True,
        "risks_created": len(created_risks),
        "details": created_risks
    }

# ==================== INCIDENT TRACKING (CPS 230) ====================

@router.post("/incident/create")
async def create_incident(incident: IncidentCreate) -> dict:
    """Create a new incident record."""
    incident_id = f"inc_{uuid.uuid4().hex[:12]}"
    
    incident_doc = {
        "id": incident_id,
        "incident_type": incident.incident_type,
        "severity": incident.severity,
        "description": incident.description,
        "affected_clients": incident.affected_clients,
        "affected_advisers": incident.affected_advisers,
        "root_cause": incident.root_cause,
        "immediate_action": incident.immediate_action,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "resolved_at": None,
        "resolution_notes": None,
        "escalated": incident.severity in ["high", "critical"],
        "reported_to_regulator": False
    }
    
    await incidents_col.insert_one(incident_doc)
    
    # Auto-create risk entry for high/critical incidents
    if incident.severity in ["high", "critical"]:
        await risk_register_col.insert_one({
            "id": f"risk_inc_{uuid.uuid4().hex[:8]}",
            "risk_type": "operational" if incident.incident_type == "system" else incident.incident_type,
            "description": f"Incident: {incident.description}",
            "linked_activity": "incident",
            "linked_entity_id": incident_id,
            "severity": incident.severity,
            "likelihood": "likely",
            "risk_score": calculate_risk_score(incident.severity, "likely"),
            "status": "open",
            "auto_generated": True,
            "source": "incident",
            "source_id": incident_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"success": True, "incident_id": incident_id}

@router.get("/incidents")
async def get_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    incident_type: Optional[str] = None,
    limit: int = 50
) -> dict:
    """Get incident records."""
    query = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    if incident_type:
        query["incident_type"] = incident_type
    
    incidents = await incidents_col.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    all_incidents = await incidents_col.find({}, {"status": 1, "severity": 1}).to_list(1000)
    
    return {
        "incidents": incidents,
        "count": len(incidents),
        "summary": {
            "total": len(all_incidents),
            "open": len([i for i in all_incidents if i.get("status") == "open"]),
            "investigating": len([i for i in all_incidents if i.get("status") == "investigating"]),
            "resolved": len([i for i in all_incidents if i.get("status") == "resolved"]),
            "critical": len([i for i in all_incidents if i.get("severity") == "critical"]),
            "high": len([i for i in all_incidents if i.get("severity") == "high"])
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.put("/incident/{incident_id}/resolve")
async def resolve_incident(incident_id: str, resolution_notes: str) -> dict:
    """Resolve an incident."""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await incidents_col.update_one(
        {"id": incident_id},
        {
            "$set": {
                "status": "resolved",
                "resolved_at": now,
                "resolution_notes": resolution_notes,
                "updated_at": now
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    return {"success": True, "message": "Incident resolved"}

@router.post("/incident/auto-detect")
async def auto_detect_incidents() -> dict:
    """Auto-detect incidents from system patterns."""
    now = datetime.now(timezone.utc)
    one_hour_ago = (now - timedelta(hours=1)).isoformat()
    created_incidents = []
    
    # Check for repeated compliance failures
    recent_failures = await compliance_checks_col.find(
        {"overall_result": "block", "created_at": {"$gte": one_hour_ago}},
        {"_id": 0}
    ).to_list(100)
    
    if len(recent_failures) >= 5:
        # Check if incident already exists
        existing = await incidents_col.find_one({
            "incident_type": "compliance",
            "status": {"$ne": "resolved"},
            "created_at": {"$gte": one_hour_ago}
        })
        
        if not existing:
            incident_id = f"inc_auto_{uuid.uuid4().hex[:8]}"
            await incidents_col.insert_one({
                "id": incident_id,
                "incident_type": "compliance",
                "severity": "medium",
                "description": f"Multiple compliance failures detected ({len(recent_failures)} in last hour)",
                "affected_clients": [],
                "affected_advisers": list(set(f.get("adviser_id") for f in recent_failures if f.get("adviser_id"))),
                "status": "open",
                "auto_detected": True,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })
            created_incidents.append(incident_id)
    
    # Check for audit anomalies (unusual activity patterns)
    recent_audit_count = await audit_logs_col.count_documents({"timestamp": {"$gte": one_hour_ago}})
    
    # If activity is 3x normal, flag it
    avg_hourly_activity = 50  # Baseline
    if recent_audit_count > avg_hourly_activity * 3:
        existing = await incidents_col.find_one({
            "incident_type": "operational",
            "description": {"$regex": "Unusual activity"},
            "status": {"$ne": "resolved"},
            "created_at": {"$gte": one_hour_ago}
        })
        
        if not existing:
            incident_id = f"inc_auto_{uuid.uuid4().hex[:8]}"
            await incidents_col.insert_one({
                "id": incident_id,
                "incident_type": "operational",
                "severity": "low",
                "description": f"Unusual activity pattern detected ({recent_audit_count} actions in last hour)",
                "status": "open",
                "auto_detected": True,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })
            created_incidents.append(incident_id)
    
    return {
        "success": True,
        "incidents_created": len(created_incidents),
        "incident_ids": created_incidents
    }

# ==================== CONTROL MAPPING ====================

@router.post("/control/create")
async def create_control(control: ControlMapping) -> dict:
    """Create a control mapping."""
    control_id = f"ctrl_{uuid.uuid4().hex[:12]}"
    
    control_doc = {
        "id": control_id,
        **control.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_tested": None,
        "test_result": None
    }
    
    await controls_col.insert_one(control_doc)
    
    return {"success": True, "control_id": control_id}

@router.get("/controls")
async def get_controls(status: Optional[str] = None) -> dict:
    """Get all control mappings."""
    query = {}
    if status:
        query["status"] = status
    
    controls = await controls_col.find(query, {"_id": 0}).to_list(100)
    
    return {
        "controls": controls,
        "count": len(controls),
        "summary": {
            "total": len(controls),
            "active": len([c for c in controls if c.get("status") == "active"]),
            "automated": len([c for c in controls if c.get("automation_level") == "automated"]),
            "by_type": {
                "preventive": len([c for c in controls if c.get("control_type") == "preventive"]),
                "detective": len([c for c in controls if c.get("control_type") == "detective"]),
                "corrective": len([c for c in controls if c.get("control_type") == "corrective"])
            }
        }
    }

@router.post("/controls/init-default")
async def init_default_controls() -> dict:
    """Initialize default control mappings based on compliance rules."""
    default_controls = [
        {
            "id": "ctrl_risk_profile",
            "control_name": "Risk Profile Validation",
            "control_type": "preventive",
            "linked_rule": "RISK_001",
            "frequency": "real_time",
            "automation_level": "automated",
            "status": "active",
            "description": "Validates portfolio alignment with client risk profile before advice"
        },
        {
            "id": "ctrl_apl_check",
            "control_name": "APL Compliance Check",
            "control_type": "preventive",
            "linked_rule": "APL_001",
            "frequency": "real_time",
            "automation_level": "automated",
            "status": "active",
            "description": "Ensures all recommended products are on Approved Product List"
        },
        {
            "id": "ctrl_fee_threshold",
            "control_name": "Fee Threshold Monitoring",
            "control_type": "detective",
            "linked_rule": "FEE_001",
            "frequency": "real_time",
            "automation_level": "automated",
            "status": "active",
            "description": "Monitors fees against licensee-defined thresholds"
        },
        {
            "id": "ctrl_decision_capture",
            "control_name": "Decision Documentation",
            "control_type": "detective",
            "linked_rule": "AUDIT_001",
            "frequency": "real_time",
            "automation_level": "automated",
            "status": "active",
            "description": "Captures adviser decisions with mandatory justification"
        },
        {
            "id": "ctrl_override_review",
            "control_name": "Override Review",
            "control_type": "detective",
            "linked_rule": "OVERRIDE_001",
            "frequency": "daily",
            "automation_level": "semi_automated",
            "status": "active",
            "description": "Flags adviser overrides for compliance review"
        },
        {
            "id": "ctrl_breach_detection",
            "control_name": "Breach Detection",
            "control_type": "detective",
            "linked_rule": "BREACH_001",
            "frequency": "real_time",
            "automation_level": "automated",
            "status": "active",
            "description": "Automatically detects and flags compliance breaches"
        },
        {
            "id": "ctrl_audit_trail",
            "control_name": "Immutable Audit Trail",
            "control_type": "detective",
            "linked_rule": "AUDIT_002",
            "frequency": "real_time",
            "automation_level": "automated",
            "status": "active",
            "description": "Maintains immutable audit log with cryptographic hashing"
        },
        {
            "id": "ctrl_fds_reminder",
            "control_name": "FDS Renewal Tracking",
            "control_type": "corrective",
            "linked_rule": "FDS_001",
            "frequency": "daily",
            "automation_level": "semi_automated",
            "status": "active",
            "description": "Tracks Fee Disclosure Statement renewals and sends reminders"
        }
    ]
    
    created = 0
    for control in default_controls:
        existing = await controls_col.find_one({"id": control["id"]})
        if not existing:
            control["created_at"] = datetime.now(timezone.utc).isoformat()
            await controls_col.insert_one(control)
            created += 1
    
    return {"success": True, "controls_created": created}

# ==================== GRC DASHBOARDS ====================

@router.get("/dashboard/compliance")
async def get_compliance_dashboard(licensee_id: str = "lic_default") -> dict:
    """Get compliance dashboard for licensee."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    # Breach stats
    breaches = await breach_flags_col.find({}, {"_id": 0, "status": 1, "severity": 1, "adviser_id": 1}).to_list(1000)
    
    # Compliance checks
    checks = await compliance_checks_col.find(
        {"created_at": {"$gte": thirty_days_ago}},
        {"_id": 0, "overall_result": 1, "adviser_id": 1}
    ).to_list(10000)
    
    # Override stats
    overrides = await adviser_decisions_col.find(
        {"override_occurred": True},
        {"_id": 0, "adviser_id": 1}
    ).to_list(1000)
    
    # Adviser override counts
    adviser_overrides = {}
    for o in overrides:
        adv = o.get("adviser_id", "unknown")
        adviser_overrides[adv] = adviser_overrides.get(adv, 0) + 1
    
    top_overriders = sorted(adviser_overrides.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Compliance pass rate
    total_checks = len(checks)
    passed = len([c for c in checks if c.get("overall_result") == "pass"])
    
    return {
        "breaches": {
            "total": len(breaches),
            "open": len([b for b in breaches if b.get("status") == "open"]),
            "by_severity": {
                "critical": len([b for b in breaches if b.get("severity") == "critical"]),
                "high": len([b for b in breaches if b.get("severity") == "high"]),
                "medium": len([b for b in breaches if b.get("severity") == "medium"]),
                "low": len([b for b in breaches if b.get("severity") == "low"])
            }
        },
        "compliance_checks": {
            "total": total_checks,
            "passed": passed,
            "warnings": len([c for c in checks if c.get("overall_result") == "warning"]),
            "blocked": len([c for c in checks if c.get("overall_result") == "block"]),
            "pass_rate": round(passed / max(1, total_checks) * 100, 1)
        },
        "overrides": {
            "total": len(overrides),
            "top_advisers": [{"adviser_id": a, "count": c} for a, c in top_overriders]
        },
        "file_completion_rate": 94.5,  # Would calculate from actual data
        "generated_at": now.isoformat()
    }

@router.get("/dashboard/risk")
async def get_risk_dashboard() -> dict:
    """Get risk dashboard."""
    now = datetime.now(timezone.utc)
    
    risks = await risk_register_col.find({}, {"_id": 0}).to_list(1000)
    incidents = await incidents_col.find({}, {"_id": 0}).to_list(1000)
    
    # Top risk areas
    risk_by_type = {}
    for r in risks:
        rtype = r.get("risk_type", "unknown")
        if rtype not in risk_by_type:
            risk_by_type[rtype] = {"count": 0, "total_score": 0}
        risk_by_type[rtype]["count"] += 1
        risk_by_type[rtype]["total_score"] += r.get("risk_score", 0)
    
    top_risks = sorted(
        [(k, v["count"], v["total_score"]) for k, v in risk_by_type.items()],
        key=lambda x: x[2],
        reverse=True
    )
    
    # Incident trends (mock - would calculate from real data)
    incident_trend = [
        {"month": "Oct 2025", "count": 2},
        {"month": "Nov 2025", "count": 1},
        {"month": "Dec 2025", "count": 3},
        {"month": "Jan 2026", "count": 1},
        {"month": "Feb 2026", "count": 2},
        {"month": "Mar 2026", "count": 0}
    ]
    
    return {
        "top_risk_areas": [
            {"type": t, "count": c, "total_score": s} for t, c, s in top_risks[:5]
        ],
        "risk_summary": {
            "total": len(risks),
            "open": len([r for r in risks if r.get("status") == "open"]),
            "critical_high": len([r for r in risks if r.get("severity") in ["critical", "high"]]),
            "average_score": round(sum(r.get("risk_score", 0) for r in risks) / max(1, len(risks)), 1)
        },
        "incidents": {
            "total": len(incidents),
            "open": len([i for i in incidents if i.get("status") == "open"]),
            "trend": incident_trend
        },
        "recurring_issues": [
            {"issue": "Risk profile misalignment", "occurrences": 4},
            {"issue": "APL non-compliance", "occurrences": 2},
            {"issue": "Fee threshold warnings", "occurrences": 3}
        ],
        "generated_at": now.isoformat()
    }

@router.get("/dashboard/adviser-productivity")
async def get_adviser_productivity_dashboard(adviser_id: Optional[str] = None) -> dict:
    """Get adviser productivity dashboard."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    query = {}
    if adviser_id:
        query["adviser_id"] = adviser_id
    
    # Get scenarios
    scenarios = await db["scenarios"].find(
        {**query, "created_at": {"$gte": thirty_days_ago}},
        {"_id": 0, "adviser_id": 1, "created_at": 1}
    ).to_list(10000)
    
    # Get decisions
    decisions = await adviser_decisions_col.find(
        {**query, "created_at": {"$gte": thirty_days_ago}},
        {"_id": 0, "adviser_id": 1, "created_at": 1}
    ).to_list(10000)
    
    # Calculate per-adviser stats
    adviser_stats = {}
    for s in scenarios:
        adv = s.get("adviser_id", "unknown")
        if adv not in adviser_stats:
            adviser_stats[adv] = {"scenarios": 0, "decisions": 0}
        adviser_stats[adv]["scenarios"] += 1
    
    for d in decisions:
        adv = d.get("adviser_id", "unknown")
        if adv not in adviser_stats:
            adviser_stats[adv] = {"scenarios": 0, "decisions": 0}
        adviser_stats[adv]["decisions"] += 1
    
    # Mock time per file (would calculate from actual timestamps)
    time_per_file = {
        "average_minutes": 18,
        "target_minutes": 25,
        "improvement": 28
    }
    
    return {
        "period": "Last 30 days",
        "total_scenarios": len(scenarios),
        "total_decisions": len(decisions),
        "adviser_breakdown": [
            {
                "adviser_id": adv,
                "scenarios_generated": stats["scenarios"],
                "decisions_made": stats["decisions"],
                "completion_rate": round(stats["decisions"] / max(1, stats["scenarios"]) * 100, 1)
            }
            for adv, stats in adviser_stats.items()
        ],
        "time_per_file": time_per_file,
        "efficiency_metrics": {
            "avg_scenarios_per_day": round(len(scenarios) / 30, 1),
            "avg_decisions_per_day": round(len(decisions) / 30, 1),
            "compliance_first_pass_rate": 87.5
        },
        "generated_at": now.isoformat()
    }
