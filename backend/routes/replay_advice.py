"""
AdviceOS Replay Advice Service
==============================
Full audit replay capability for advice journey:
- Input capture
- Scenario generation replay
- Decision recording
- Compliance check replay
- ASIC-ready export

This is a KILLER FEATURE for enterprise sales.
"""

import os
import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/replay", tags=["Advice Replay"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
advice_sessions_col = db["advice_sessions"]
replay_exports_col = db["replay_exports"]
audit_events_col = db["audit_events"]

# ==================== MODELS ====================

class AdviceSession(BaseModel):
    client_id: str
    client_name: str
    adviser_id: str
    adviser_name: str
    licensee_id: str = "lic_default"
    session_type: str = "scenario_analysis"  # scenario_analysis, review, rebalance

class AdviceInput(BaseModel):
    session_id: str
    input_type: str  # client_data, risk_profile, goals, constraints, market_data
    data: Dict[str, Any]
    captured_by: str

class ScenarioRecord(BaseModel):
    session_id: str
    scenario_id: str
    inputs_used: Dict[str, Any]
    scenarios_generated: List[Dict[str, Any]]
    assumptions: List[str]
    disclaimers: List[str]

class DecisionRecord(BaseModel):
    session_id: str
    scenario_id: str
    selected_option: str
    justification: str
    adviser_confirmation: bool
    client_acknowledgment: bool = False

class ComplianceRecord(BaseModel):
    session_id: str
    checks_performed: List[Dict[str, Any]]
    overall_result: str  # PASS, WARN, BLOCK
    breaches: List[Dict[str, Any]] = []
    overrides: List[Dict[str, Any]] = []

# ==================== SESSION MANAGEMENT ====================

@router.post("/session/start")
async def start_advice_session(session: AdviceSession) -> dict:
    """Start a new advice session for full replay capability."""
    session_id = f"ADV-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    session_doc = {
        "id": session_id,
        "client_id": session.client_id,
        "client_name": session.client_name,
        "adviser_id": session.adviser_id,
        "adviser_name": session.adviser_name,
        "licensee_id": session.licensee_id,
        "session_type": session.session_type,
        "status": "active",
        "started_at": now,
        "ended_at": None,
        "inputs": [],
        "scenarios": [],
        "decisions": [],
        "compliance_checks": [],
        "timeline": [{
            "timestamp": now,
            "event": "session_started",
            "description": f"Advice session started for client {session.client_name}"
        }]
    }
    
    await advice_sessions_col.insert_one(session_doc)
    
    # Log to audit
    try:
        from routes.audit_service import log_audit_event, AuditEvent
        await log_audit_event(AuditEvent(
            event_type="advice_session",
            entity_type="session",
            entity_id=session_id,
            user_id=session.adviser_id,
            licensee_id=session.licensee_id,
            action_description=f"Advice session started for client {session.client_name}"
        ))
    except:
        pass
    
    return {
        "session_id": session_id,
        "status": "active",
        "started_at": now,
        "message": "Advice session started - all inputs, scenarios, and decisions will be captured for replay"
    }

@router.post("/session/{session_id}/input")
async def capture_input(session_id: str, input_data: AdviceInput) -> dict:
    """Capture an input during the advice session."""
    now = datetime.now(timezone.utc).isoformat()
    
    input_record = {
        "id": f"inp_{uuid.uuid4().hex[:8]}",
        "input_type": input_data.input_type,
        "data": input_data.data,
        "captured_by": input_data.captured_by,
        "captured_at": now
    }
    
    await advice_sessions_col.update_one(
        {"id": session_id},
        {
            "$push": {
                "inputs": input_record,
                "timeline": {
                    "timestamp": now,
                    "event": "input_captured",
                    "description": f"Input captured: {input_data.input_type}"
                }
            }
        }
    )
    
    return {"success": True, "input_id": input_record["id"]}

@router.post("/session/{session_id}/scenario")
async def record_scenario(session_id: str, scenario: ScenarioRecord) -> dict:
    """Record scenario generation for replay."""
    now = datetime.now(timezone.utc).isoformat()
    
    scenario_record = {
        "scenario_id": scenario.scenario_id,
        "inputs_used": scenario.inputs_used,
        "scenarios_generated": scenario.scenarios_generated,
        "assumptions": scenario.assumptions,
        "disclaimers": scenario.disclaimers,
        "generated_at": now
    }
    
    await advice_sessions_col.update_one(
        {"id": session_id},
        {
            "$push": {
                "scenarios": scenario_record,
                "timeline": {
                    "timestamp": now,
                    "event": "scenarios_generated",
                    "description": f"Generated {len(scenario.scenarios_generated)} scenarios"
                }
            }
        }
    )
    
    return {"success": True, "scenario_id": scenario.scenario_id}

@router.post("/session/{session_id}/decision")
async def record_decision(session_id: str, decision: DecisionRecord) -> dict:
    """Record adviser decision for replay."""
    now = datetime.now(timezone.utc).isoformat()
    
    decision_record = {
        "id": f"dec_{uuid.uuid4().hex[:8]}",
        "scenario_id": decision.scenario_id,
        "selected_option": decision.selected_option,
        "justification": decision.justification,
        "adviser_confirmation": decision.adviser_confirmation,
        "client_acknowledgment": decision.client_acknowledgment,
        "recorded_at": now
    }
    
    await advice_sessions_col.update_one(
        {"id": session_id},
        {
            "$push": {
                "decisions": decision_record,
                "timeline": {
                    "timestamp": now,
                    "event": "decision_recorded",
                    "description": f"Adviser selected: {decision.selected_option}"
                }
            }
        }
    )
    
    return {"success": True, "decision_id": decision_record["id"]}

@router.post("/session/{session_id}/compliance")
async def record_compliance(session_id: str, compliance: ComplianceRecord) -> dict:
    """Record compliance check results."""
    now = datetime.now(timezone.utc).isoformat()
    
    compliance_record = {
        "id": f"comp_{uuid.uuid4().hex[:8]}",
        "checks_performed": compliance.checks_performed,
        "overall_result": compliance.overall_result,
        "breaches": compliance.breaches,
        "overrides": compliance.overrides,
        "checked_at": now
    }
    
    await advice_sessions_col.update_one(
        {"id": session_id},
        {
            "$push": {
                "compliance_checks": compliance_record,
                "timeline": {
                    "timestamp": now,
                    "event": "compliance_checked",
                    "description": f"Compliance result: {compliance.overall_result}"
                }
            }
        }
    )
    
    return {"success": True, "compliance_id": compliance_record["id"]}

@router.post("/session/{session_id}/end")
async def end_advice_session(session_id: str, adviser_id: str) -> dict:
    """End the advice session."""
    now = datetime.now(timezone.utc).isoformat()
    
    await advice_sessions_col.update_one(
        {"id": session_id},
        {
            "$set": {
                "status": "completed",
                "ended_at": now
            },
            "$push": {
                "timeline": {
                    "timestamp": now,
                    "event": "session_ended",
                    "description": "Advice session completed"
                }
            }
        }
    )
    
    return {"success": True, "session_id": session_id, "ended_at": now}

# ==================== REPLAY ENDPOINTS ====================

@router.get("/session/{session_id}")
async def get_session_for_replay(session_id: str) -> dict:
    """Get full advice session for replay."""
    session = await advice_sessions_col.find_one({"id": session_id}, {"_id": 0})
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session

@router.get("/session/{session_id}/timeline")
async def get_session_timeline(session_id: str) -> dict:
    """Get timeline view of advice session."""
    session = await advice_sessions_col.find_one({"id": session_id}, {"_id": 0})
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "client_name": session.get("client_name"),
        "adviser_name": session.get("adviser_name"),
        "status": session.get("status"),
        "started_at": session.get("started_at"),
        "ended_at": session.get("ended_at"),
        "timeline": session.get("timeline", []),
        "summary": {
            "inputs_count": len(session.get("inputs", [])),
            "scenarios_count": len(session.get("scenarios", [])),
            "decisions_count": len(session.get("decisions", [])),
            "compliance_checks": len(session.get("compliance_checks", []))
        }
    }

@router.get("/client/{client_id}/sessions")
async def list_client_sessions(
    client_id: str,
    licensee_id: str = "lic_default",
    limit: int = 20
) -> dict:
    """List all advice sessions for a client."""
    sessions = await advice_sessions_col.find(
        {"client_id": client_id, "licensee_id": licensee_id},
        {"_id": 0, "timeline": 0, "inputs": 0}
    ).sort("started_at", -1).limit(limit).to_list(limit)
    
    return {
        "client_id": client_id,
        "sessions": sessions,
        "total": len(sessions)
    }

@router.get("/sessions")
async def list_all_sessions(
    licensee_id: str = "lic_default",
    status: Optional[str] = None,
    adviser_id: Optional[str] = None,
    limit: int = 50
) -> dict:
    """List all advice sessions with filters."""
    query = {"licensee_id": licensee_id}
    if status:
        query["status"] = status
    if adviser_id:
        query["adviser_id"] = adviser_id
    
    sessions = await advice_sessions_col.find(
        query,
        {"_id": 0, "timeline": 0, "inputs": 0}
    ).sort("started_at", -1).limit(limit).to_list(limit)
    
    return {
        "sessions": sessions,
        "total": len(sessions)
    }

# ==================== ASIC-READY EXPORT ====================

@router.get("/session/{session_id}/export")
async def export_session_asic_ready(session_id: str, format: str = "json") -> dict:
    """Export advice session in ASIC-ready format."""
    session = await advice_sessions_col.find_one({"id": session_id}, {"_id": 0})
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    now = datetime.now(timezone.utc)
    export_id = f"EXP-{uuid.uuid4().hex[:8].upper()}"
    
    # Build ASIC-ready export
    export_data = {
        "export_metadata": {
            "export_id": export_id,
            "export_type": "ASIC_ADVICE_RECORD",
            "exported_at": now.isoformat(),
            "format_version": "1.0",
            "hash": hashlib.sha256(f"{session_id}{now.isoformat()}".encode()).hexdigest()
        },
        "advice_session": {
            "session_id": session["id"],
            "session_type": session.get("session_type"),
            "status": session.get("status"),
            "duration": {
                "started_at": session.get("started_at"),
                "ended_at": session.get("ended_at")
            }
        },
        "participants": {
            "client": {
                "client_id": session.get("client_id"),
                "client_name": session.get("client_name")
            },
            "adviser": {
                "adviser_id": session.get("adviser_id"),
                "adviser_name": session.get("adviser_name")
            },
            "licensee_id": session.get("licensee_id")
        },
        "inputs_captured": session.get("inputs", []),
        "scenarios_generated": session.get("scenarios", []),
        "decisions_made": session.get("decisions", []),
        "compliance_checks": session.get("compliance_checks", []),
        "full_timeline": session.get("timeline", []),
        "regulatory_notes": {
            "disclaimer": "This record is generated for regulatory compliance purposes. All advice provided was subject to the compliance checks documented herein.",
            "asic_compliance": "Record maintained in accordance with Corporations Act 2001 requirements",
            "retention_period": "7 years from date of advice"
        }
    }
    
    # Store export record
    await replay_exports_col.insert_one({
        "export_id": export_id,
        "session_id": session_id,
        "exported_at": now.isoformat(),
        "format": format,
        "exported_by": "system"
    })
    
    if format == "pdf":
        # Generate PDF
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            
            buffer = BytesIO()
            pdf = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
            styles = getSampleStyleSheet()
            story = []
            
            # Title
            title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=16, spaceAfter=20)
            story.append(Paragraph("ASIC ADVICE RECORD EXPORT", title_style))
            story.append(Paragraph(f"Export ID: {export_id}", styles['Normal']))
            story.append(Paragraph(f"Session ID: {session_id}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Session Info
            story.append(Paragraph("SESSION DETAILS", styles['Heading2']))
            story.append(Paragraph(f"Client: {session.get('client_name')}", styles['Normal']))
            story.append(Paragraph(f"Adviser: {session.get('adviser_name')}", styles['Normal']))
            story.append(Paragraph(f"Started: {session.get('started_at')}", styles['Normal']))
            story.append(Paragraph(f"Status: {session.get('status')}", styles['Normal']))
            story.append(Spacer(1, 15))
            
            # Timeline
            story.append(Paragraph("ADVICE TIMELINE", styles['Heading2']))
            for event in session.get("timeline", []):
                story.append(Paragraph(f"• {event['timestamp'][:19]} - {event['event']}: {event['description']}", styles['Normal']))
            story.append(Spacer(1, 15))
            
            # Compliance
            story.append(Paragraph("COMPLIANCE CHECKS", styles['Heading2']))
            for check in session.get("compliance_checks", []):
                story.append(Paragraph(f"Result: {check.get('overall_result')}", styles['Normal']))
                if check.get("breaches"):
                    story.append(Paragraph(f"Breaches: {len(check.get('breaches', []))}", styles['Normal']))
            story.append(Spacer(1, 15))
            
            # Decisions
            story.append(Paragraph("DECISIONS RECORDED", styles['Heading2']))
            for decision in session.get("decisions", []):
                story.append(Paragraph(f"Selected: {decision.get('selected_option')}", styles['Normal']))
                story.append(Paragraph(f"Justification: {decision.get('justification')}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Footer
            story.append(Paragraph("REGULATORY COMPLIANCE NOTE", styles['Heading2']))
            story.append(Paragraph("This record is maintained in accordance with Corporations Act 2001 requirements. Retention period: 7 years from date of advice.", styles['Normal']))
            story.append(Paragraph(f"Hash: {export_data['export_metadata']['hash']}", styles['Normal']))
            
            pdf.build(story)
            buffer.seek(0)
            
            return Response(
                content=buffer.getvalue(),
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="asic_export_{session_id}.pdf"'}
            )
        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            # Fall back to JSON
            pass
    
    return export_data

@router.get("/dashboard/stats")
async def replay_dashboard_stats(licensee_id: str = "lic_default") -> dict:
    """Get replay/advice session statistics."""
    now = datetime.now(timezone.utc)
    month_ago = (now - timedelta(days=30)).isoformat()
    
    # Total sessions
    total = await advice_sessions_col.count_documents({"licensee_id": licensee_id})
    
    # Monthly sessions
    monthly = await advice_sessions_col.count_documents({
        "licensee_id": licensee_id,
        "started_at": {"$gte": month_ago}
    })
    
    # Completed sessions
    completed = await advice_sessions_col.count_documents({
        "licensee_id": licensee_id,
        "status": "completed"
    })
    
    # Sessions with compliance issues
    with_issues = await advice_sessions_col.count_documents({
        "licensee_id": licensee_id,
        "compliance_checks.overall_result": {"$in": ["WARN", "BLOCK"]}
    })
    
    # Exports generated
    exports = await replay_exports_col.count_documents({})
    
    return {
        "total_sessions": total,
        "monthly_sessions": monthly,
        "completed_sessions": completed,
        "completion_rate": round(completed / max(1, total) * 100, 1),
        "sessions_with_compliance_issues": with_issues,
        "compliance_issue_rate": round(with_issues / max(1, total) * 100, 1),
        "exports_generated": exports,
        "generated_at": now.isoformat()
    }

# ==================== MOCK DATA FOR DEMO ====================

@router.post("/demo/create-sample-session")
async def create_sample_session() -> dict:
    """Create a sample advice session for demo purposes."""
    session_id = f"ADV-DEMO-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now(timezone.utc)
    
    sample_session = {
        "id": session_id,
        "client_id": "XP-001",
        "client_name": "James Mitchell",
        "adviser_id": "ADV001",
        "adviser_name": "Sarah Johnson",
        "licensee_id": "lic_default",
        "session_type": "scenario_analysis",
        "status": "completed",
        "started_at": (now - timedelta(hours=2)).isoformat(),
        "ended_at": (now - timedelta(hours=1)).isoformat(),
        "inputs": [
            {
                "id": "inp_001",
                "input_type": "client_data",
                "data": {"age": 58, "retirement_target": 65, "current_super": 850000},
                "captured_by": "ADV001",
                "captured_at": (now - timedelta(hours=2)).isoformat()
            },
            {
                "id": "inp_002",
                "input_type": "risk_profile",
                "data": {"score": 65, "band": "Balanced", "review_date": "2025-11-15"},
                "captured_by": "ADV001",
                "captured_at": (now - timedelta(hours=2)).isoformat()
            },
            {
                "id": "inp_003",
                "input_type": "goals",
                "data": {"primary": "Retirement income", "secondary": "Wealth preservation", "time_horizon": "7 years"},
                "captured_by": "ADV001",
                "captured_at": (now - timedelta(hours=2)).isoformat()
            }
        ],
        "scenarios": [
            {
                "scenario_id": "SCN-001",
                "inputs_used": {"risk_profile": "Balanced", "time_horizon": "7 years", "current_value": 850000},
                "scenarios_generated": [
                    {"option": "A", "allocation": "60/40 Growth/Defensive", "projected_value": 1150000, "income_at_65": 57500},
                    {"option": "B", "allocation": "50/50 Balanced", "projected_value": 1050000, "income_at_65": 52500},
                    {"option": "C", "allocation": "40/60 Conservative", "projected_value": 950000, "income_at_65": 47500}
                ],
                "assumptions": ["7% p.a. growth assets", "4% p.a. defensive assets", "2.5% inflation"],
                "disclaimers": ["Past performance not indicative of future results", "Scenarios are illustrative only"],
                "generated_at": (now - timedelta(hours=1, minutes=45)).isoformat()
            }
        ],
        "decisions": [
            {
                "id": "dec_001",
                "scenario_id": "SCN-001",
                "selected_option": "Option B - 50/50 Balanced",
                "justification": "Client prefers moderate growth with capital preservation given 7-year timeline to retirement. Option B provides balance between growth potential and downside protection.",
                "adviser_confirmation": True,
                "client_acknowledgment": True,
                "recorded_at": (now - timedelta(hours=1, minutes=15)).isoformat()
            }
        ],
        "compliance_checks": [
            {
                "id": "comp_001",
                "checks_performed": [
                    {"check": "Risk Profile Alignment", "result": "PASS", "details": "Selected allocation matches Balanced risk profile"},
                    {"check": "APL Compliance", "result": "PASS", "details": "All recommended products on APL"},
                    {"check": "Fee Disclosure", "result": "PASS", "details": "All fees disclosed"},
                    {"check": "Best Interests Duty", "result": "PASS", "details": "Recommendation aligned with client goals"}
                ],
                "overall_result": "PASS",
                "breaches": [],
                "overrides": [],
                "checked_at": (now - timedelta(hours=1, minutes=10)).isoformat()
            }
        ],
        "timeline": [
            {"timestamp": (now - timedelta(hours=2)).isoformat(), "event": "session_started", "description": "Advice session started for client James Mitchell"},
            {"timestamp": (now - timedelta(hours=2)).isoformat(), "event": "input_captured", "description": "Input captured: client_data"},
            {"timestamp": (now - timedelta(hours=2)).isoformat(), "event": "input_captured", "description": "Input captured: risk_profile"},
            {"timestamp": (now - timedelta(hours=2)).isoformat(), "event": "input_captured", "description": "Input captured: goals"},
            {"timestamp": (now - timedelta(hours=1, minutes=45)).isoformat(), "event": "scenarios_generated", "description": "Generated 3 scenarios"},
            {"timestamp": (now - timedelta(hours=1, minutes=15)).isoformat(), "event": "decision_recorded", "description": "Adviser selected: Option B - 50/50 Balanced"},
            {"timestamp": (now - timedelta(hours=1, minutes=10)).isoformat(), "event": "compliance_checked", "description": "Compliance result: PASS"},
            {"timestamp": (now - timedelta(hours=1)).isoformat(), "event": "session_ended", "description": "Advice session completed"}
        ]
    }
    
    await advice_sessions_col.insert_one(sample_session)
    
    return {
        "success": True,
        "session_id": session_id,
        "message": "Sample advice session created for demo"
    }
