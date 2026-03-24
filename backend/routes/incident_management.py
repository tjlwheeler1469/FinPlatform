"""
AdviceOS Enterprise Incident Management
=======================================
CPS 230 compliant incident management system:
- Severity classification (P1-P5)
- Escalation workflows
- Regulatory reporting capability
- Incident timeline tracking
- Root cause analysis
"""

import os
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from enum import Enum
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
incidents_col = db["incidents"]
incident_updates_col = db["incident_updates"]
escalation_rules_col = db["escalation_rules"]
incident_templates_col = db["incident_templates"]

# ==================== ENUMS & MODELS ====================

class SeverityLevel(str, Enum):
    P1_CRITICAL = "P1"  # System down, data breach, regulatory breach
    P2_HIGH = "P2"      # Major feature unavailable, compliance risk
    P3_MEDIUM = "P3"    # Degraded service, workaround available
    P4_LOW = "P4"       # Minor issue, cosmetic
    P5_INFO = "P5"      # Informational, no impact

class IncidentStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"
    CLOSED = "closed"

class IncidentCategory(str, Enum):
    SECURITY = "security"
    COMPLIANCE = "compliance"
    OPERATIONAL = "operational"
    DATA = "data"
    INTEGRATION = "integration"
    PERFORMANCE = "performance"

class CreateIncident(BaseModel):
    title: str
    description: str
    severity: SeverityLevel
    category: IncidentCategory
    affected_systems: List[str] = []
    affected_licensees: List[str] = []
    reported_by: str
    licensee_id: str = "lic_default"

class UpdateIncident(BaseModel):
    status: Optional[IncidentStatus] = None
    severity: Optional[SeverityLevel] = None
    update_message: str
    updated_by: str
    root_cause: Optional[str] = None
    resolution: Optional[str] = None
    lessons_learned: Optional[str] = None

class EscalationRule(BaseModel):
    severity: SeverityLevel
    escalation_after_minutes: int
    notify_roles: List[str]
    notify_emails: List[str] = []
    auto_escalate: bool = True

# ==================== SEVERITY DEFINITIONS ====================

SEVERITY_DEFINITIONS = {
    "P1": {
        "name": "Critical",
        "description": "Complete system outage, data breach, or major regulatory breach",
        "response_time": "15 minutes",
        "resolution_target": "4 hours",
        "escalation_to": ["CTO", "CISO", "CEO"],
        "regulatory_reportable": True,
        "examples": [
            "System completely unavailable",
            "Confirmed data breach",
            "ASIC/APRA reportable incident",
            "Complete loss of audit trail"
        ]
    },
    "P2": {
        "name": "High",
        "description": "Major feature unavailable or significant compliance risk",
        "response_time": "30 minutes",
        "resolution_target": "8 hours",
        "escalation_to": ["Engineering Lead", "Compliance Officer"],
        "regulatory_reportable": False,
        "examples": [
            "Compliance engine not validating",
            "Audit logging delayed",
            "Authentication issues",
            "Major integration failure (Xplan)"
        ]
    },
    "P3": {
        "name": "Medium",
        "description": "Degraded service with workaround available",
        "response_time": "2 hours",
        "resolution_target": "24 hours",
        "escalation_to": ["Team Lead"],
        "regulatory_reportable": False,
        "examples": [
            "Slow performance",
            "Single licensee affected",
            "PDF generation failing",
            "Non-critical feature unavailable"
        ]
    },
    "P4": {
        "name": "Low",
        "description": "Minor issue with minimal impact",
        "response_time": "8 hours",
        "resolution_target": "72 hours",
        "escalation_to": [],
        "regulatory_reportable": False,
        "examples": [
            "UI cosmetic issues",
            "Minor calculation discrepancy",
            "Documentation gaps"
        ]
    },
    "P5": {
        "name": "Informational",
        "description": "No immediate impact, tracked for awareness",
        "response_time": "Next business day",
        "resolution_target": "As scheduled",
        "escalation_to": [],
        "regulatory_reportable": False,
        "examples": [
            "Feature requests",
            "Performance optimization ideas",
            "Proactive maintenance"
        ]
    }
}

# ==================== HELPER FUNCTIONS ====================

async def log_incident_to_audit(incident_id: str, action: str, user_id: str, details: Dict[str, Any]):
    """Log incident actions to the audit trail."""
    try:
        from routes.audit_service import log_audit_event, AuditEvent
        await log_audit_event(AuditEvent(
            event_type="incident_management",
            entity_type="incident",
            entity_id=incident_id,
            user_id=user_id,
            action_description=action,
            metadata=details
        ))
    except Exception as e:
        logger.warning(f"Failed to log incident to audit: {e}")

async def check_escalation_needed(incident: Dict[str, Any]) -> bool:
    """Check if incident needs escalation based on time and severity."""
    created_at = datetime.fromisoformat(incident["created_at"].replace("Z", "+00:00"))
    age_minutes = (datetime.now(timezone.utc) - created_at).total_seconds() / 60
    
    escalation_thresholds = {
        "P1": 15,
        "P2": 30,
        "P3": 120,
        "P4": 480,
        "P5": 1440
    }
    
    threshold = escalation_thresholds.get(incident["severity"], 60)
    return age_minutes > threshold and incident["status"] in ["open", "investigating"]

# ==================== API ENDPOINTS ====================

@router.get("/severity-definitions")
async def get_severity_definitions():
    """Get severity level definitions for incident classification."""
    return {
        "severities": SEVERITY_DEFINITIONS,
        "classification_guidance": {
            "rule_1": "When in doubt, classify higher - can always downgrade",
            "rule_2": "Any data breach is automatically P1",
            "rule_3": "Audit trail issues are minimum P2",
            "rule_4": "Client-facing issues are minimum P3"
        }
    }

@router.post("/create")
async def create_incident(incident: CreateIncident):
    """Create a new incident."""
    incident_id = f"INC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    incident_doc = {
        "id": incident_id,
        "title": incident.title,
        "description": incident.description,
        "severity": incident.severity.value,
        "category": incident.category.value,
        "status": IncidentStatus.OPEN.value,
        "affected_systems": incident.affected_systems,
        "affected_licensees": incident.affected_licensees,
        "reported_by": incident.reported_by,
        "licensee_id": incident.licensee_id,
        "created_at": now,
        "updated_at": now,
        "resolved_at": None,
        "closed_at": None,
        "root_cause": None,
        "resolution": None,
        "lessons_learned": None,
        "escalation_count": 0,
        "regulatory_reported": False,
        "timeline": [{
            "timestamp": now,
            "action": "created",
            "user": incident.reported_by,
            "message": f"Incident created with severity {incident.severity.value}"
        }]
    }
    
    await incidents_col.insert_one(incident_doc)
    
    # Log to audit
    await log_incident_to_audit(
        incident_id, 
        f"Incident created: {incident.title}", 
        incident.reported_by,
        {"severity": incident.severity.value, "category": incident.category.value}
    )
    
    # Check if regulatory reportable
    severity_def = SEVERITY_DEFINITIONS.get(incident.severity.value, {})
    
    return {
        "incident_id": incident_id,
        "severity": incident.severity.value,
        "status": "open",
        "response_target": severity_def.get("response_time"),
        "resolution_target": severity_def.get("resolution_target"),
        "regulatory_reportable": severity_def.get("regulatory_reportable", False),
        "escalation_contacts": severity_def.get("escalation_to", []),
        "created_at": now
    }

@router.get("/list")
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    licensee_id: str = "lic_default",
    include_closed: bool = False,
    limit: int = 50
):
    """List incidents with filtering."""
    query = {"licensee_id": licensee_id}
    
    if status:
        query["status"] = status
    elif not include_closed:
        query["status"] = {"$nin": ["closed"]}
    
    if severity:
        query["severity"] = severity
    if category:
        query["category"] = category
    
    incidents = await incidents_col.find(
        query,
        {"_id": 0, "timeline": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Add escalation status
    for inc in incidents:
        inc["needs_escalation"] = await check_escalation_needed(inc)
    
    return {
        "incidents": incidents,
        "count": len(incidents),
        "open_count": len([i for i in incidents if i["status"] == "open"]),
        "critical_count": len([i for i in incidents if i["severity"] == "P1"])
    }

@router.get("/{incident_id}")
async def get_incident(incident_id: str):
    """Get incident details with full timeline."""
    incident = await incidents_col.find_one({"id": incident_id}, {"_id": 0})
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Get severity definition
    severity_def = SEVERITY_DEFINITIONS.get(incident["severity"], {})
    incident["severity_details"] = severity_def
    incident["needs_escalation"] = await check_escalation_needed(incident)
    
    return incident

@router.post("/{incident_id}/update")
async def update_incident(incident_id: str, update: UpdateIncident):
    """Update incident status or add update."""
    incident = await incidents_col.find_one({"id": incident_id})
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Build update
    update_doc = {
        "updated_at": now,
        "$push": {
            "timeline": {
                "timestamp": now,
                "action": update.status.value if update.status else "update",
                "user": update.updated_by,
                "message": update.update_message
            }
        }
    }
    
    set_fields = {"updated_at": now}
    
    if update.status:
        set_fields["status"] = update.status.value
        if update.status == IncidentStatus.RESOLVED:
            set_fields["resolved_at"] = now
        elif update.status == IncidentStatus.CLOSED:
            set_fields["closed_at"] = now
    
    if update.severity:
        set_fields["severity"] = update.severity.value
    if update.root_cause:
        set_fields["root_cause"] = update.root_cause
    if update.resolution:
        set_fields["resolution"] = update.resolution
    if update.lessons_learned:
        set_fields["lessons_learned"] = update.lessons_learned
    
    await incidents_col.update_one(
        {"id": incident_id},
        {"$set": set_fields, "$push": update_doc["$push"]}
    )
    
    # Log to audit
    await log_incident_to_audit(
        incident_id,
        f"Incident updated: {update.update_message}",
        update.updated_by,
        {"new_status": update.status.value if update.status else None}
    )
    
    return {
        "success": True,
        "incident_id": incident_id,
        "new_status": update.status.value if update.status else incident["status"],
        "updated_at": now
    }

@router.post("/{incident_id}/escalate")
async def escalate_incident(incident_id: str, escalated_by: str, reason: str):
    """Manually escalate an incident."""
    incident = await incidents_col.find_one({"id": incident_id})
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Get escalation contacts
    severity_def = SEVERITY_DEFINITIONS.get(incident["severity"], {})
    escalation_contacts = severity_def.get("escalation_to", [])
    
    await incidents_col.update_one(
        {"id": incident_id},
        {
            "$set": {"updated_at": now},
            "$inc": {"escalation_count": 1},
            "$push": {
                "timeline": {
                    "timestamp": now,
                    "action": "escalated",
                    "user": escalated_by,
                    "message": f"Escalated: {reason}",
                    "escalation_contacts": escalation_contacts
                }
            }
        }
    )
    
    await log_incident_to_audit(
        incident_id,
        f"Incident escalated: {reason}",
        escalated_by,
        {"escalation_contacts": escalation_contacts}
    )
    
    return {
        "success": True,
        "incident_id": incident_id,
        "escalation_count": incident.get("escalation_count", 0) + 1,
        "escalation_contacts": escalation_contacts,
        "escalated_at": now
    }

@router.post("/{incident_id}/regulatory-report")
async def mark_regulatory_reported(
    incident_id: str,
    reported_by: str,
    report_reference: str,
    regulator: str = "ASIC"
):
    """Mark incident as reported to regulator."""
    incident = await incidents_col.find_one({"id": incident_id})
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await incidents_col.update_one(
        {"id": incident_id},
        {
            "$set": {
                "regulatory_reported": True,
                "regulatory_report_reference": report_reference,
                "regulatory_reported_to": regulator,
                "regulatory_reported_at": now,
                "regulatory_reported_by": reported_by,
                "updated_at": now
            },
            "$push": {
                "timeline": {
                    "timestamp": now,
                    "action": "regulatory_reported",
                    "user": reported_by,
                    "message": f"Reported to {regulator} - Reference: {report_reference}"
                }
            }
        }
    )
    
    await log_incident_to_audit(
        incident_id,
        f"Incident reported to {regulator}",
        reported_by,
        {"regulator": regulator, "reference": report_reference}
    )
    
    return {
        "success": True,
        "incident_id": incident_id,
        "regulator": regulator,
        "report_reference": report_reference,
        "reported_at": now
    }

@router.get("/dashboard/summary")
async def incident_dashboard(licensee_id: str = "lic_default"):
    """Get incident management dashboard summary."""
    now = datetime.now(timezone.utc)
    month_ago = (now - timedelta(days=30)).isoformat()
    
    # Open incidents by severity
    open_incidents = await incidents_col.find(
        {"licensee_id": licensee_id, "status": {"$nin": ["closed", "resolved"]}}
    ).to_list(100)
    
    by_severity = {}
    for inc in open_incidents:
        sev = inc.get("severity", "P5")
        by_severity[sev] = by_severity.get(sev, 0) + 1
    
    # Monthly stats
    monthly_total = await incidents_col.count_documents({
        "licensee_id": licensee_id,
        "created_at": {"$gte": month_ago}
    })
    
    monthly_resolved = await incidents_col.count_documents({
        "licensee_id": licensee_id,
        "resolved_at": {"$gte": month_ago}
    })
    
    # MTTR (Mean Time To Resolution) calculation
    resolved_incidents = await incidents_col.find({
        "licensee_id": licensee_id,
        "resolved_at": {"$ne": None},
        "created_at": {"$gte": month_ago}
    }).to_list(100)
    
    mttr_minutes = 0
    if resolved_incidents:
        total_resolution_time = 0
        for inc in resolved_incidents:
            created = datetime.fromisoformat(inc["created_at"].replace("Z", "+00:00"))
            resolved = datetime.fromisoformat(inc["resolved_at"].replace("Z", "+00:00"))
            total_resolution_time += (resolved - created).total_seconds() / 60
        mttr_minutes = total_resolution_time / len(resolved_incidents)
    
    # Regulatory reportable
    regulatory_count = await incidents_col.count_documents({
        "licensee_id": licensee_id,
        "regulatory_reported": True,
        "created_at": {"$gte": month_ago}
    })
    
    return {
        "open_incidents": {
            "total": len(open_incidents),
            "by_severity": by_severity,
            "critical_p1": by_severity.get("P1", 0),
            "high_p2": by_severity.get("P2", 0)
        },
        "monthly_stats": {
            "total_incidents": monthly_total,
            "resolved": monthly_resolved,
            "resolution_rate": round(monthly_resolved / max(1, monthly_total) * 100, 1),
            "mttr_minutes": round(mttr_minutes, 1),
            "mttr_hours": round(mttr_minutes / 60, 2)
        },
        "regulatory": {
            "reported_this_month": regulatory_count,
            "pending_report": len([i for i in open_incidents if SEVERITY_DEFINITIONS.get(i["severity"], {}).get("regulatory_reportable")])
        },
        "escalation_status": {
            "needs_escalation": len([i for i in open_incidents if i.get("needs_escalation")])
        },
        "generated_at": now.isoformat()
    }

@router.get("/report/regulatory")
async def generate_regulatory_report(
    licensee_id: str = "lic_default",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Generate regulatory incident report for ASIC/APRA."""
    now = datetime.now(timezone.utc)
    
    if not start_date:
        start_date = (now - timedelta(days=90)).isoformat()
    if not end_date:
        end_date = now.isoformat()
    
    incidents = await incidents_col.find({
        "licensee_id": licensee_id,
        "created_at": {"$gte": start_date, "$lte": end_date}
    }, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Categorize
    p1_incidents = [i for i in incidents if i["severity"] == "P1"]
    security_incidents = [i for i in incidents if i["category"] == "security"]
    compliance_incidents = [i for i in incidents if i["category"] == "compliance"]
    reported_incidents = [i for i in incidents if i.get("regulatory_reported")]
    
    return {
        "report_type": "regulatory_incident_summary",
        "reporting_period": {
            "start": start_date[:10],
            "end": end_date[:10]
        },
        "licensee_id": licensee_id,
        "summary": {
            "total_incidents": len(incidents),
            "critical_p1": len(p1_incidents),
            "security_incidents": len(security_incidents),
            "compliance_incidents": len(compliance_incidents),
            "regulatory_reported": len(reported_incidents)
        },
        "critical_incidents": [{
            "id": i["id"],
            "title": i["title"],
            "severity": i["severity"],
            "status": i["status"],
            "created_at": i["created_at"],
            "resolved_at": i.get("resolved_at"),
            "root_cause": i.get("root_cause"),
            "regulatory_reported": i.get("regulatory_reported", False)
        } for i in p1_incidents],
        "security_incidents": [{
            "id": i["id"],
            "title": i["title"],
            "severity": i["severity"],
            "status": i["status"],
            "created_at": i["created_at"]
        } for i in security_incidents[:10]],
        "compliance_statement": {
            "all_p1_addressed": all(i["status"] in ["resolved", "closed"] for i in p1_incidents) if p1_incidents else True,
            "reportable_incidents_filed": len(reported_incidents),
            "incident_response_process": "active",
            "escalation_procedures": "documented"
        },
        "generated_at": now.isoformat(),
        "report_hash": hashlib.sha256(f"{licensee_id}{start_date}{end_date}{len(incidents)}".encode()).hexdigest()
    }
