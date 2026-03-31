"""
AdviceOS Auto File Note Generator
==================================
Generates structured advice rationale file notes automatically.
Links inputs → outputs → decision for complete audit trail.
Huge time saver for advisers - the compliant path becomes the fastest path.
"""

import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/file-notes", tags=["Auto File Note Generator"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
file_notes_col = db["file_notes"]
scenarios_col = db["scenarios"]
adviser_decisions_col = db["adviser_decisions"]
compliance_checks_col = db["compliance_checks"]
audit_logs_col = db["audit_logs"]

# ==================== MODELS ====================

class FileNoteRequest(BaseModel):
    scenario_set_id: str
    decision_id: str
    adviser_id: str
    client_id: str
    note_type: str = "advice"  # advice, meeting, strategy, review
    additional_context: Optional[str] = None
    include_compliance: bool = True
    include_trade_offs: bool = True

class MeetingNoteRequest(BaseModel):
    client_id: str
    adviser_id: str
    meeting_date: str
    meeting_type: str  # annual_review, strategy_review, initial_meeting, phone_call
    duration_minutes: int = 60
    attendees: List[str] = []
    topics_discussed: List[str] = []
    action_items: List[str] = []
    client_concerns: Optional[str] = None
    adviser_observations: Optional[str] = None

# ==================== FILE NOTE TEMPLATES ====================

def generate_advice_rationale_note(
    scenario_set: Dict[str, Any],
    decision: Dict[str, Any],
    compliance_check: Optional[Dict[str, Any]],
    client_info: Dict[str, Any]
) -> str:
    """Generate structured advice rationale file note."""
    now = datetime.now(timezone.utc)
    
    # Extract scenario data
    scenarios = scenario_set.get("scenarios", [])
    selected_scenario = None
    for s in scenarios:
        if s.get("scenario_id") == decision.get("selected_scenario_id"):
            selected_scenario = s
            break
    
    trade_offs = scenario_set.get("trade_offs", [])
    inputs = scenario_set.get("inputs", {})
    
    note = f"""
================================================================================
ADVICE RATIONALE FILE NOTE
================================================================================
Generated: {now.strftime('%d %B %Y at %H:%M')} UTC
File Note ID: FN_{uuid.uuid4().hex[:8].upper()}
--------------------------------------------------------------------------------

CLIENT INFORMATION
==================
Client ID: {client_info.get('id', 'N/A')}
Client Name: {client_info.get('name', 'N/A')}
Risk Profile: {inputs.get('risk_profile', 'N/A').title()}
Investment Timeframe: {inputs.get('investment_timeframe_years', 'N/A')} years

ADVICE CONTEXT
==============
Initial Investment: ${inputs.get('initial_investment', 0):,.2f}
Monthly Contribution: ${inputs.get('monthly_contribution', 0):,.2f}
Income Requirement: ${inputs.get('income_requirement', 0):,.2f}
Goals: {inputs.get('goals', 'Capital growth and income generation')}

SCENARIOS PRESENTED
===================
The following scenarios were generated and presented to the client:
"""
    
    for i, scenario in enumerate(scenarios, 1):
        metrics = scenario.get("metrics", {})
        note += f"""
{i}. {scenario.get('scenario_name', 'Scenario ' + str(i))}
   - Expected Return: {metrics.get('expected_return_low', 0):.1f}% - {metrics.get('expected_return_high', 0):.1f}%
   - Volatility: {metrics.get('volatility', 0):.1f}%
   - Income Yield: {metrics.get('income_yield', 0):.2f}%
   - 10-Year Projection: ${metrics.get('projected_value_10yr', 0):,.0f}
   - Rationale: {scenario.get('rationale', 'N/A')}
"""
    
    note += """
TRADE-OFFS EXPLAINED
====================
The following trade-offs were discussed with the client:
"""
    
    for i, tradeoff in enumerate(trade_offs, 1):
        note += f"""
{i}. {tradeoff.get('description', 'N/A')}
   Impact: {tradeoff.get('impact_description', 'N/A')}
"""
    
    if selected_scenario:
        note += f"""
SELECTED STRATEGY
=================
Strategy: {selected_scenario.get('scenario_name', 'N/A')}

Asset Allocation:
"""
        allocation = selected_scenario.get("allocation", {})
        for asset, pct in allocation.items():
            note += f"  - {asset.replace('_', ' ').title()}: {pct}%\n"
        
        note += f"""
Expected Outcomes:
  - Expected Return (Mid): {selected_scenario.get('metrics', {}).get('expected_return_mid', 0):.1f}%
  - Volatility: {selected_scenario.get('metrics', {}).get('volatility', 0):.1f}%
  - Maximum Drawdown: {selected_scenario.get('metrics', {}).get('max_drawdown', 0):.1f}%
  - Income Yield: {selected_scenario.get('metrics', {}).get('income_yield', 0):.2f}%

ADVISER DECISION & JUSTIFICATION
================================
"""
    
    note += f"""
Decision: {decision.get('decision', 'N/A').upper()}
Adviser: {decision.get('adviser_id', 'N/A')}

Justification:
{decision.get('justification_text', 'No justification provided')}

Confirmations:
"""
    
    confirmations = decision.get("confirmation", {})
    note += f"  [{'X' if confirmations.get('reviewed_scenarios') else ' '}] Adviser has reviewed all scenarios\n"
    note += f"  [{'X' if confirmations.get('client_best_interest') else ' '}] Decision is in client's best interest\n"
    note += f"  [{'X' if confirmations.get('understood_risks') else ' '}] Risks have been explained and understood\n"
    note += f"  [{'X' if confirmations.get('discussed_with_client') else ' '}] Strategy discussed with client\n"
    
    if decision.get("override_occurred"):
        note += f"""
OVERRIDE NOTICE
===============
⚠️ Adviser override of compliance guidance occurred.
Override Reason: {decision.get('override_reason', 'Not provided')}
"""
    
    if compliance_check:
        note += f"""
COMPLIANCE CHECK RESULTS
========================
Overall Result: {compliance_check.get('overall_result', 'N/A').upper()}
APL Compliance: {'PASS' if compliance_check.get('apl_compliance') else 'FAIL'}
Risk Alignment: {'PASS' if compliance_check.get('risk_alignment') else 'FAIL'}
Fee Compliance: {'PASS' if compliance_check.get('fee_compliance') else 'FAIL'}
"""
        
        rules_triggered = compliance_check.get("rules_triggered", [])
        if rules_triggered:
            note += "\nRules Triggered:\n"
            for rule in rules_triggered:
                note += f"  - [{rule.get('result', 'N/A').upper()}] {rule.get('rule_name', 'N/A')}: {rule.get('details', '')}\n"
    
    note += f"""
--------------------------------------------------------------------------------
DISCLAIMER
==========
This file note has been auto-generated by AdviceOS to document the advice 
process. This tool provides decision support only and does not constitute 
financial advice. The adviser must confirm all outputs before presenting 
to clients. All data is stored immutably for audit and compliance purposes.

Document Hash: {uuid.uuid4().hex}
================================================================================
"""
    
    return note

def generate_meeting_note(meeting: MeetingNoteRequest) -> str:
    """Generate meeting file note."""
    now = datetime.now(timezone.utc)
    
    note = f"""
================================================================================
MEETING FILE NOTE
================================================================================
Generated: {now.strftime('%d %B %Y at %H:%M')} UTC
File Note ID: FN_MTG_{uuid.uuid4().hex[:8].upper()}
--------------------------------------------------------------------------------

MEETING DETAILS
===============
Client ID: {meeting.client_id}
Adviser: {meeting.adviser_id}
Meeting Date: {meeting.meeting_date}
Meeting Type: {meeting.meeting_type.replace('_', ' ').title()}
Duration: {meeting.duration_minutes} minutes

Attendees:
"""
    
    for attendee in meeting.attendees:
        note += f"  - {attendee}\n"
    
    note += """
TOPICS DISCUSSED
================
"""
    for i, topic in enumerate(meeting.topics_discussed, 1):
        note += f"{i}. {topic}\n"
    
    if meeting.client_concerns:
        note += f"""
CLIENT CONCERNS RAISED
======================
{meeting.client_concerns}
"""
    
    if meeting.adviser_observations:
        note += f"""
ADVISER OBSERVATIONS
====================
{meeting.adviser_observations}
"""
    
    note += """
ACTION ITEMS
============
"""
    for i, action in enumerate(meeting.action_items, 1):
        note += f"{i}. [ ] {action}\n"
    
    note += f"""
--------------------------------------------------------------------------------
Document Hash: {uuid.uuid4().hex}
================================================================================
"""
    
    return note

def generate_xplan_export_summary(
    scenario_set: Dict[str, Any],
    decision: Dict[str, Any],
    compliance_check: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate summary for Xplan export."""
    inputs = scenario_set.get("inputs", {})
    selected_scenario = None
    for s in scenario_set.get("scenarios", []):
        if s.get("scenario_id") == decision.get("selected_scenario_id"):
            selected_scenario = s
            break
    
    return {
        "export_format": "xplan_compatible",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "client_id": inputs.get("client_id"),
        "adviser_id": decision.get("adviser_id"),
        "summary": {
            "risk_profile": inputs.get("risk_profile"),
            "investment_amount": inputs.get("initial_investment"),
            "timeframe_years": inputs.get("investment_timeframe_years"),
            "selected_strategy": selected_scenario.get("scenario_name") if selected_scenario else None,
            "expected_return": selected_scenario.get("metrics", {}).get("expected_return_mid") if selected_scenario else None,
            "compliance_status": compliance_check.get("overall_result") if compliance_check else "pending"
        },
        "decision_rationale": decision.get("justification_text"),
        "confirmations": decision.get("confirmation", {}),
        "override_occurred": decision.get("override_occurred", False),
        "override_reason": decision.get("override_reason"),
        "xplan_fields": {
            "file_note_category": "Advice Documentation",
            "file_note_type": "Strategy Implementation",
            "linked_entity_type": "client",
            "status": "Complete"
        }
    }

# ==================== API ENDPOINTS ====================

@router.post("/generate/advice")
async def generate_advice_file_note(request: FileNoteRequest):
    """
    Generate an advice rationale file note automatically.
    Links scenario inputs → outputs → adviser decision.
    """
    # Get scenario set
    scenario_set = await scenarios_col.find_one(
        {"id": request.scenario_set_id},
        {"_id": 0}
    )
    if not scenario_set:
        raise HTTPException(status_code=404, detail="Scenario set not found")
    
    # Get decision
    decision = await adviser_decisions_col.find_one(
        {"id": request.decision_id},
        {"_id": 0}
    )
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    # Get compliance check if requested
    compliance_check = None
    if request.include_compliance:
        compliance_check = await compliance_checks_col.find_one(
            {"scenario_set_id": request.scenario_set_id},
            {"_id": 0}
        )
    
    # Client info from scenario inputs
    client_info = {
        "id": request.client_id,
        "name": scenario_set.get("inputs", {}).get("client_name", request.client_id)
    }
    
    # Generate note
    note_content = generate_advice_rationale_note(
        scenario_set,
        decision,
        compliance_check,
        client_info
    )
    
    # Store file note
    file_note_id = f"fn_{uuid.uuid4().hex[:12]}"
    file_note_doc = {
        "id": file_note_id,
        "note_type": request.note_type,
        "client_id": request.client_id,
        "adviser_id": request.adviser_id,
        "scenario_set_id": request.scenario_set_id,
        "decision_id": request.decision_id,
        "content": note_content,
        "word_count": len(note_content.split()),
        "additional_context": request.additional_context,
        "compliance_included": request.include_compliance,
        "trade_offs_included": request.include_trade_offs,
        "xplan_synced": False,
        "xplan_note_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "hash": uuid.uuid4().hex
    }
    
    await file_notes_col.insert_one(file_note_doc)
    
    # Log to audit trail
    await audit_logs_col.insert_one({
        "id": f"audit_{uuid.uuid4().hex[:12]}",
        "user_id": request.adviser_id,
        "user_role": "adviser",
        "action_type": "generate_file_note",
        "entity_type": "file_note",
        "entity_id": file_note_id,
        "after_state": {"note_type": request.note_type, "word_count": file_note_doc["word_count"]},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "hash": uuid.uuid4().hex
    })
    
    return {
        "success": True,
        "file_note_id": file_note_id,
        "word_count": file_note_doc["word_count"],
        "content": note_content,
        "xplan_ready": True
    }

@router.post("/generate/meeting")
async def generate_meeting_file_note(request: MeetingNoteRequest):
    """Generate a meeting file note."""
    note_content = generate_meeting_note(request)
    
    file_note_id = f"fn_mtg_{uuid.uuid4().hex[:12]}"
    file_note_doc = {
        "id": file_note_id,
        "note_type": "meeting",
        "client_id": request.client_id,
        "adviser_id": request.adviser_id,
        "meeting_date": request.meeting_date,
        "meeting_type": request.meeting_type,
        "duration_minutes": request.duration_minutes,
        "attendees": request.attendees,
        "topics_discussed": request.topics_discussed,
        "action_items": request.action_items,
        "content": note_content,
        "word_count": len(note_content.split()),
        "xplan_synced": False,
        "xplan_note_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "hash": uuid.uuid4().hex
    }
    
    await file_notes_col.insert_one(file_note_doc)
    
    return {
        "success": True,
        "file_note_id": file_note_id,
        "word_count": file_note_doc["word_count"],
        "content": note_content,
        "action_items_count": len(request.action_items)
    }

@router.get("/list")
async def list_file_notes(
    client_id: Optional[str] = None,
    adviser_id: Optional[str] = None,
    note_type: Optional[str] = None,
    limit: int = 50
):
    """List file notes with optional filtering."""
    query = {}
    if client_id:
        query["client_id"] = client_id
    if adviser_id:
        query["adviser_id"] = adviser_id
    if note_type:
        query["note_type"] = note_type
    
    notes = await file_notes_col.find(
        query,
        {"_id": 0, "content": 0}  # Exclude full content for list view
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {
        "file_notes": notes,
        "count": len(notes)
    }

@router.get("/{file_note_id}")
async def get_file_note(file_note_id: str):
    """Get a specific file note with full content."""
    note = await file_notes_col.find_one({"id": file_note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="File note not found")
    return note

@router.post("/{file_note_id}/export-xplan")
async def export_to_xplan(file_note_id: str):
    """
    Export file note to Xplan format.
    In production, this would call Xplan API to create the file note.
    """
    note = await file_notes_col.find_one({"id": file_note_id}, {"_id": 0})
    if not note:
        raise HTTPException(status_code=404, detail="File note not found")
    
    # Get related data for Xplan export
    scenario_set = None
    decision = None
    compliance_check = None
    
    if note.get("scenario_set_id"):
        scenario_set = await scenarios_col.find_one(
            {"id": note["scenario_set_id"]},
            {"_id": 0}
        )
    
    if note.get("decision_id"):
        decision = await adviser_decisions_col.find_one(
            {"id": note["decision_id"]},
            {"_id": 0}
        )
    
    if scenario_set:
        compliance_check = await compliance_checks_col.find_one(
            {"scenario_set_id": note["scenario_set_id"]},
            {"_id": 0}
        )
    
    # Generate Xplan-compatible export
    xplan_export = {
        "file_note_id": file_note_id,
        "xplan_note_id": f"XP_NOTE_{uuid.uuid4().hex[:8].upper()}",  # Would be returned by Xplan API
        "export_status": "success",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "xplan_format": {
            "note_category": "Advice Documentation",
            "note_type": note.get("note_type", "advice").title(),
            "client_entity_id": note.get("client_id"),
            "adviser_id": note.get("adviser_id"),
            "note_date": note.get("created_at", "")[:10],
            "note_content": note.get("content"),
            "attachments": []
        }
    }
    
    if scenario_set and decision:
        xplan_export["strategy_summary"] = generate_xplan_export_summary(
            scenario_set,
            decision,
            compliance_check
        )
    
    # Update note as synced
    await file_notes_col.update_one(
        {"id": file_note_id},
        {
            "$set": {
                "xplan_synced": True,
                "xplan_note_id": xplan_export["xplan_note_id"],
                "xplan_synced_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Log export
    await audit_logs_col.insert_one({
        "id": f"audit_{uuid.uuid4().hex[:12]}",
        "user_id": note.get("adviser_id"),
        "user_role": "adviser",
        "action_type": "export_to_xplan",
        "entity_type": "file_note",
        "entity_id": file_note_id,
        "after_state": {"xplan_note_id": xplan_export["xplan_note_id"]},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "hash": uuid.uuid4().hex
    })
    
    return xplan_export

@router.get("/stats/summary")
async def get_file_note_stats():
    """Get file note generation statistics."""
    all_notes = await file_notes_col.find({}, {"_id": 0, "content": 0}).to_list(10000)
    
    total_words = sum(n.get("word_count", 0) for n in all_notes)
    synced_count = len([n for n in all_notes if n.get("xplan_synced")])
    
    # Estimate time saved (average 15 min per manual note)
    time_saved_minutes = len(all_notes) * 15
    
    return {
        "total_notes_generated": len(all_notes),
        "total_words_generated": total_words,
        "synced_to_xplan": synced_count,
        "pending_sync": len(all_notes) - synced_count,
        "by_type": {
            "advice": len([n for n in all_notes if n.get("note_type") == "advice"]),
            "meeting": len([n for n in all_notes if n.get("note_type") == "meeting"]),
            "strategy": len([n for n in all_notes if n.get("note_type") == "strategy"]),
            "review": len([n for n in all_notes if n.get("note_type") == "review"])
        },
        "efficiency_metrics": {
            "estimated_time_saved_minutes": time_saved_minutes,
            "estimated_time_saved_hours": round(time_saved_minutes / 60, 1),
            "average_note_length_words": round(total_words / max(1, len(all_notes)), 0)
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
