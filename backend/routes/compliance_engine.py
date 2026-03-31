"""
AdviceOS Compliance Engine
==========================
Core compliance checking, audit logging, and regulatory enforcement.

Principle: System generates scenarios, not advice. Adviser makes all decisions.
"""

import os
import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Request, Body
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compliance", tags=["Compliance Engine"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
licensees_col = db["licensees"]
advisers_col = db["advisers"]
compliance_clients_col = db["compliance_clients"]
scenarios_col = db["scenarios"]
compliance_checks_col = db["compliance_checks"]
adviser_decisions_col = db["adviser_decisions"]
audit_logs_col = db["audit_logs"]
breach_flags_col = db["breach_flags"]
reports_col = db["reports"]
explainability_col = db["explainability_records"]

# ==================== AUDIT LOGGING ====================

def sanitize_for_json(obj) -> dict:
    """Remove MongoDB ObjectId and other non-serializable objects"""
    if obj is None:
        return None
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items() if k != '_id'}
    if isinstance(obj, list):
        return [sanitize_for_json(item) for item in obj]
    try:
        json.dumps(obj)
        return obj
    except (TypeError, ValueError):
        return str(obj)

async def log_audit(
    user_id: str,
    user_role: str,
    action_type: str,
    entity_type: str,
    entity_id: str,
    before_state: Optional[Dict] = None,
    after_state: Optional[Dict] = None,
    metadata: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> dict:
    """Create immutable audit log entry"""
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Sanitize states to remove MongoDB ObjectId
    clean_before = sanitize_for_json(before_state)
    clean_after = sanitize_for_json(after_state)
    
    # Generate hash for integrity
    hash_content = {
        "user_id": user_id,
        "action_type": action_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "timestamp": timestamp,
        "before_state": clean_before,
        "after_state": clean_after
    }
    hash_value = hashlib.sha256(json.dumps(hash_content, sort_keys=True).encode()).hexdigest()
    
    audit_entry = {
        "id": f"audit_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "user_role": user_role,
        "action_type": action_type,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "before_state": clean_before,
        "after_state": clean_after,
        "metadata": sanitize_for_json(metadata) or {},
        "timestamp": timestamp,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "hash": hash_value
    }
    
    await audit_logs_col.insert_one(audit_entry)
    return audit_entry

# ==================== COMPLIANCE RULES ENGINE ====================

DEFAULT_RULES_CONFIG = {
    "min_scenarios_required": 3,
    "require_adviser_confirmation": True,
    "require_override_justification": True,
    "max_equity_allocation": 0.80,
    "min_defensive_allocation": 0.20,
    "max_single_stock_weight": 0.10,
    "fee_threshold_warning": 0.015,
    "fee_threshold_block": 0.025,
    "risk_alignment_strict": True,
    "require_apl_compliance": True
}

# Risk profile to allocation ranges
RISK_ALLOCATION_RANGES = {
    "conservative": {"equity_max": 0.30, "defensive_min": 0.70},
    "moderately_conservative": {"equity_max": 0.45, "defensive_min": 0.55},
    "balanced": {"equity_max": 0.60, "defensive_min": 0.40},
    "moderately_aggressive": {"equity_max": 0.75, "defensive_min": 0.25},
    "aggressive": {"equity_max": 0.90, "defensive_min": 0.10}
}

async def check_compliance(
    scenario: Dict[str, Any],
    client_risk_profile: str,
    rules_config: Dict[str, Any],
    apl: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Run compliance checks on a scenario.
    Returns PASS, WARNING, or BLOCK with detailed rule results.
    """
    rules_triggered = []
    overall_result = "pass"
    
    allocation = scenario.get("allocation", {})
    metrics = scenario.get("metrics", {})
    products = scenario.get("products", [])
    
    # Calculate total equity and defensive
    total_equity = allocation.get("australian_equities", 0) + allocation.get("international_equities", 0)
    total_defensive = allocation.get("fixed_income", 0) + allocation.get("cash", 0)
    
    # Rule 1: Risk Profile Alignment
    risk_ranges = RISK_ALLOCATION_RANGES.get(client_risk_profile, RISK_ALLOCATION_RANGES["balanced"])
    if total_equity > risk_ranges["equity_max"]:
        rule_result = "block" if rules_config.get("risk_alignment_strict", True) else "warning"
        rules_triggered.append({
            "rule_id": "RISK_001",
            "rule_name": "Risk Profile Alignment - Equity",
            "description": "Equity allocation exceeds risk profile maximum",
            "result": rule_result,
            "details": f"Equity {total_equity*100:.1f}% exceeds {risk_ranges['equity_max']*100:.1f}% max for {client_risk_profile} profile",
            "threshold": f"{risk_ranges['equity_max']*100:.1f}%",
            "actual_value": f"{total_equity*100:.1f}%"
        })
        if rule_result == "block":
            overall_result = "block"
        elif overall_result != "block":
            overall_result = "warning"
    
    if total_defensive < risk_ranges["defensive_min"]:
        rule_result = "block" if rules_config.get("risk_alignment_strict", True) else "warning"
        rules_triggered.append({
            "rule_id": "RISK_002",
            "rule_name": "Risk Profile Alignment - Defensive",
            "description": "Defensive allocation below risk profile minimum",
            "result": rule_result,
            "details": f"Defensive {total_defensive*100:.1f}% below {risk_ranges['defensive_min']*100:.1f}% min for {client_risk_profile} profile",
            "threshold": f"{risk_ranges['defensive_min']*100:.1f}%",
            "actual_value": f"{total_defensive*100:.1f}%"
        })
        if rule_result == "block":
            overall_result = "block"
        elif overall_result != "block":
            overall_result = "warning"
    
    # Rule 2: Maximum Equity Allocation (Global)
    max_equity = rules_config.get("max_equity_allocation", 0.80)
    if total_equity > max_equity:
        rules_triggered.append({
            "rule_id": "ALLOC_001",
            "rule_name": "Maximum Equity Allocation",
            "description": "Total equity allocation exceeds licensee maximum",
            "result": "block",
            "details": f"Equity {total_equity*100:.1f}% exceeds global max {max_equity*100:.1f}%",
            "threshold": f"{max_equity*100:.1f}%",
            "actual_value": f"{total_equity*100:.1f}%"
        })
        overall_result = "block"
    
    # Rule 3: Fee Compliance
    total_fees = metrics.get("total_fees", 0)
    fee_warning = rules_config.get("fee_threshold_warning", 0.015)
    fee_block = rules_config.get("fee_threshold_block", 0.025)
    
    if total_fees > fee_block:
        rules_triggered.append({
            "rule_id": "FEE_001",
            "rule_name": "Fee Threshold - Block",
            "description": "Total fees exceed maximum threshold",
            "result": "block",
            "details": f"Total fees {total_fees*100:.2f}% exceed {fee_block*100:.2f}% maximum",
            "threshold": f"{fee_block*100:.2f}%",
            "actual_value": f"{total_fees*100:.2f}%"
        })
        overall_result = "block"
    elif total_fees > fee_warning:
        rules_triggered.append({
            "rule_id": "FEE_002",
            "rule_name": "Fee Threshold - Warning",
            "description": "Total fees above warning threshold",
            "result": "warning",
            "details": f"Total fees {total_fees*100:.2f}% above {fee_warning*100:.2f}% warning level",
            "threshold": f"{fee_warning*100:.2f}%",
            "actual_value": f"{total_fees*100:.2f}%"
        })
        if overall_result != "block":
            overall_result = "warning"
    
    # Rule 4: APL Compliance
    if rules_config.get("require_apl_compliance", True) and apl:
        apl_product_ids = {p["product_id"] for p in apl if p.get("status") == "approved"}
        for product in products:
            if product.get("product_id") not in apl_product_ids:
                rules_triggered.append({
                    "rule_id": "APL_001",
                    "rule_name": "Approved Product List",
                    "description": "Product not on Approved Product List",
                    "result": "block",
                    "details": f"Product '{product.get('name', product.get('product_id'))}' is not on the APL",
                    "threshold": "Must be on APL",
                    "actual_value": "Not found"
                })
                overall_result = "block"
    
    # Rule 5: Concentration Risk
    max_single_weight = rules_config.get("max_single_stock_weight", 0.10)
    for product in products:
        weight = product.get("weight", 0)
        if product.get("type") == "stock" and weight > max_single_weight:
            rules_triggered.append({
                "rule_id": "CONC_001",
                "rule_name": "Single Stock Concentration",
                "description": "Single stock weight exceeds maximum",
                "result": "warning",
                "details": f"'{product.get('name')}' at {weight*100:.1f}% exceeds {max_single_weight*100:.1f}% max",
                "threshold": f"{max_single_weight*100:.1f}%",
                "actual_value": f"{weight*100:.1f}%"
            })
            if overall_result != "block":
                overall_result = "warning"
    
    # Add PASS rule if no issues
    if not rules_triggered:
        rules_triggered.append({
            "rule_id": "PASS_001",
            "rule_name": "All Compliance Checks",
            "description": "All compliance rules passed",
            "result": "pass",
            "details": "Scenario meets all compliance requirements"
        })
    
    return {
        "overall_result": overall_result,
        "rules_triggered": rules_triggered,
        "apl_compliance": overall_result != "block" or not any(r["rule_id"].startswith("APL") for r in rules_triggered),
        "risk_alignment": not any(r["rule_id"].startswith("RISK") and r["result"] == "block" for r in rules_triggered),
        "fee_compliance": not any(r["rule_id"].startswith("FEE") and r["result"] == "block" for r in rules_triggered),
        "allocation_compliance": not any(r["rule_id"].startswith("ALLOC") and r["result"] == "block" for r in rules_triggered)
    }

# ==================== API ROUTES ====================

# --- Licensee Management ---

@router.post("/licensee")
async def create_licensee(
    name: str,
    afsl_number: str,
    contact_email: str,
    request: Request
) -> dict:
    """Create a new licensee (AFSL holder)"""
    licensee_id = f"lic_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    licensee = {
        "id": licensee_id,
        "name": name,
        "afsl_number": afsl_number,
        "contact_email": contact_email,
        "rules_config": DEFAULT_RULES_CONFIG,
        "apl": get_mock_apl(),
        "created_at": now,
        "updated_at": now,
        "status": "active"
    }
    
    await licensees_col.insert_one(licensee)
    
    # Audit log
    await log_audit(
        user_id="system",
        user_role="system",
        action_type="create",
        entity_type="licensee",
        entity_id=licensee_id,
        after_state=licensee,
        ip_address=request.client.host if request.client else None
    )
    
    del licensee["_id"]
    return licensee

@router.get("/licensee/{licensee_id}")
async def get_licensee(licensee_id: str) -> dict:
    """Get licensee details"""
    licensee = await licensees_col.find_one({"id": licensee_id}, {"_id": 0})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    return licensee

@router.put("/licensee/{licensee_id}/rules")
async def update_licensee_rules(
    licensee_id: str,
    rules_config: Dict[str, Any],
    request: Request
) -> dict:
    """Update licensee compliance rules"""
    licensee = await licensees_col.find_one({"id": licensee_id})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    before_state = {"rules_config": licensee.get("rules_config")}
    
    await licensees_col.update_one(
        {"id": licensee_id},
        {"$set": {
            "rules_config": rules_config,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Audit log
    await log_audit(
        user_id="admin",
        user_role="licensee_admin",
        action_type="update",
        entity_type="licensee",
        entity_id=licensee_id,
        before_state=before_state,
        after_state={"rules_config": rules_config},
        ip_address=request.client.host if request.client else None
    )
    
    return {"success": True, "message": "Rules updated"}

# --- Adviser Management ---

@router.post("/adviser")
async def create_adviser(
    licensee_id: str,
    name: str,
    email: str,
    ar_number: Optional[str] = None,
    request: Request = None
) -> dict:
    """Create a new adviser"""
    adviser_id = f"adv_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    adviser = {
        "id": adviser_id,
        "licensee_id": licensee_id,
        "name": name,
        "email": email,
        "ar_number": ar_number,
        "status": "active",
        "created_at": now,
        "updated_at": now,
        "last_login": None,
        "total_clients": 0,
        "total_scenarios": 0,
        "compliance_score": 100.0,
        "overrides_count": 0,
        "breaches_count": 0
    }
    
    await advisers_col.insert_one(adviser)
    
    # Audit log
    await log_audit(
        user_id="admin",
        user_role="licensee_admin",
        action_type="create",
        entity_type="adviser",
        entity_id=adviser_id,
        after_state=adviser,
        ip_address=request.client.host if request and request.client else None
    )
    
    del adviser["_id"]
    return adviser

@router.get("/adviser/{adviser_id}")
async def get_adviser(adviser_id: str) -> dict:
    """Get adviser details"""
    adviser = await advisers_col.find_one({"id": adviser_id}, {"_id": 0})
    if not adviser:
        raise HTTPException(status_code=404, detail="Adviser not found")
    return adviser

@router.get("/licensee/{licensee_id}/advisers")
async def get_licensee_advisers(licensee_id: str) -> dict:
    """Get all advisers for a licensee"""
    advisers = await advisers_col.find({"licensee_id": licensee_id}, {"_id": 0}).to_list(1000)
    return {"advisers": advisers, "count": len(advisers)}

# --- Compliance Checks ---

@router.post("/scenario-check")
async def run_compliance_check(
    scenario_set_id: str,
    scenario_id: str,
    client_risk_profile: str,
    licensee_id: str,
    scenario: Dict[str, Any] = Body(...),
    request: Request = None
):
    """Run compliance check on a scenario"""
    # Get licensee rules and APL
    licensee = await licensees_col.find_one({"id": licensee_id})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    rules_config = licensee.get("rules_config", DEFAULT_RULES_CONFIG)
    apl = licensee.get("apl", [])
    
    # Run compliance check
    check_result = await check_compliance(scenario, client_risk_profile, rules_config, apl)
    
    check_id = f"chk_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    compliance_check = {
        "id": check_id,
        "scenario_set_id": scenario_set_id,
        "scenario_id": scenario_id,
        "overall_result": check_result["overall_result"],
        "rules_triggered": check_result["rules_triggered"],
        "apl_compliance": check_result["apl_compliance"],
        "risk_alignment": check_result["risk_alignment"],
        "fee_compliance": check_result["fee_compliance"],
        "allocation_compliance": check_result["allocation_compliance"],
        "created_at": now,
        "checked_by": "system"
    }
    
    await compliance_checks_col.insert_one(compliance_check)
    
    # Create breach flag if blocked
    if check_result["overall_result"] == "block":
        breach_id = f"brch_{uuid.uuid4().hex[:12]}"
        breach = {
            "id": breach_id,
            "licensee_id": licensee_id,
            "adviser_id": scenario.get("adviser_id", "unknown"),
            "scenario_id": scenario_id,
            "client_id": scenario.get("client_id"),
            "breach_type": "compliance_block",
            "description": f"Scenario blocked: {', '.join(r['rule_name'] for r in check_result['rules_triggered'] if r['result'] == 'block')}",
            "severity": "high",
            "status": "open",
            "detected_at": now
        }
        await breach_flags_col.insert_one(breach)
    
    del compliance_check["_id"]
    return compliance_check

@router.get("/check/{check_id}")
async def get_compliance_check(check_id: str) -> dict:
    """Get compliance check details"""
    check = await compliance_checks_col.find_one({"id": check_id}, {"_id": 0})
    if not check:
        raise HTTPException(status_code=404, detail="Compliance check not found")
    return check

# --- Adviser Decisions ---

@router.post("/decision")
async def record_adviser_decision(
    scenario_set_id: str,
    adviser_id: str,
    selected_scenario_id: Optional[str],
    decision: str,
    justification_text: str,
    override_occurred: bool = False,
    override_reason: Optional[str] = None,
    confirmation: Dict[str, bool] = Body(...),
    request: Request = None
):
    """Record adviser's decision on a scenario set"""
    
    # Validate confirmation
    if not all([
        confirmation.get("reviewed_scenarios"),
        confirmation.get("client_best_interest"),
        confirmation.get("understood_risks")
    ]):
        raise HTTPException(
            status_code=400, 
            detail="Adviser must confirm: reviewed scenarios, client best interest, and understood risks"
        )
    
    # Require justification for override
    if override_occurred and not override_reason:
        raise HTTPException(
            status_code=400,
            detail="Override justification is required when overriding system output"
        )
    
    decision_id = f"dec_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    adviser_decision = {
        "id": decision_id,
        "scenario_set_id": scenario_set_id,
        "adviser_id": adviser_id,
        "selected_scenario_id": selected_scenario_id,
        "decision": decision,
        "confirmation": confirmation,
        "justification_text": justification_text,
        "override_occurred": override_occurred,
        "override_reason": override_reason,
        "created_at": now,
        "client_acknowledged": False,
        "client_acknowledgement_date": None
    }
    
    await adviser_decisions_col.insert_one(adviser_decision)
    
    # Update adviser stats
    update_fields = {"$inc": {"total_scenarios": 1}}
    if override_occurred:
        update_fields["$inc"]["overrides_count"] = 1
    
    await advisers_col.update_one(
        {"id": adviser_id},
        update_fields
    )
    
    # Audit log
    await log_audit(
        user_id=adviser_id,
        user_role="adviser",
        action_type="approve" if decision == "approved" else "update",
        entity_type="decision",
        entity_id=decision_id,
        after_state=adviser_decision,
        metadata={"override": override_occurred},
        ip_address=request.client.host if request and request.client else None
    )
    
    # Update scenario set status
    await scenarios_col.update_one(
        {"id": scenario_set_id},
        {"$set": {"status": decision, "updated_at": now}}
    )
    
    del adviser_decision["_id"]
    return adviser_decision

@router.get("/decision/{decision_id}")
async def get_adviser_decision(decision_id: str) -> dict:
    """Get adviser decision details"""
    decision = await adviser_decisions_col.find_one({"id": decision_id}, {"_id": 0})
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision

# --- Audit Logs ---

@router.get("/audit-logs")
async def get_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    action_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100
) -> dict:
    """Get audit logs with filtering"""
    query = {}
    
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if user_id:
        query["user_id"] = user_id
    if action_type:
        query["action_type"] = action_type
    if start_date:
        query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_date
        else:
            query["timestamp"] = {"$lte": end_date}
    
    logs = await audit_logs_col.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"logs": logs, "count": len(logs)}

@router.get("/audit-logs/replay/{entity_type}/{entity_id}")
async def replay_audit_trail(entity_type: str, entity_id: str) -> dict:
    """Replay full audit trail for an entity"""
    logs = await audit_logs_col.find(
        {"entity_type": entity_type, "entity_id": entity_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    return {
        "entity_type": entity_type,
        "entity_id": entity_id,
        "trail": logs,
        "count": len(logs)
    }

# --- Breach Management ---

@router.get("/breaches")
async def get_breaches(
    licensee_id: Optional[str] = None,
    adviser_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100
) -> dict:
    """Get breach flags"""
    query = {}
    if licensee_id:
        query["licensee_id"] = licensee_id
    if adviser_id:
        query["adviser_id"] = adviser_id
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    
    breaches = await breach_flags_col.find(query, {"_id": 0}).sort("detected_at", -1).limit(limit).to_list(limit)
    return {"breaches": breaches, "count": len(breaches)}

@router.put("/breaches/{breach_id}/resolve")
async def resolve_breach(
    breach_id: str,
    resolution_notes: str,
    reviewed_by: str,
    request: Request
) -> dict:
    """Resolve a breach flag"""
    breach = await breach_flags_col.find_one({"id": breach_id})
    if not breach:
        raise HTTPException(status_code=404, detail="Breach not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await breach_flags_col.update_one(
        {"id": breach_id},
        {"$set": {
            "status": "resolved",
            "resolved_at": now,
            "resolution_notes": resolution_notes,
            "reviewed_by": reviewed_by
        }}
    )
    
    # Audit log
    await log_audit(
        user_id=reviewed_by,
        user_role="licensee_admin",
        action_type="update",
        entity_type="breach",
        entity_id=breach_id,
        before_state={"status": breach["status"]},
        after_state={"status": "resolved", "resolution_notes": resolution_notes},
        ip_address=request.client.host if request.client else None
    )
    
    return {"success": True, "message": "Breach resolved"}

# --- Mock APL ---

def get_mock_apl() -> List[Dict[str, Any]]:
    """Get mock Approved Product List"""
    return [
        {"product_id": "VAS", "product_name": "Vanguard Australian Shares ETF", "product_type": "etf", "provider": "Vanguard", "risk_rating": 6, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.25},
        {"product_id": "VGS", "product_name": "Vanguard MSCI International ETF", "product_type": "etf", "provider": "Vanguard", "risk_rating": 6, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.25},
        {"product_id": "VAF", "product_name": "Vanguard Australian Fixed Interest ETF", "product_type": "etf", "provider": "Vanguard", "risk_rating": 3, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.30},
        {"product_id": "IVV", "product_name": "iShares S&P 500 ETF", "product_type": "etf", "provider": "BlackRock", "risk_rating": 6, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.20},
        {"product_id": "IOZ", "product_name": "iShares Core S&P/ASX 200 ETF", "product_type": "etf", "provider": "BlackRock", "risk_rating": 6, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.25},
        {"product_id": "IAF", "product_name": "iShares Core Composite Bond ETF", "product_type": "etf", "provider": "BlackRock", "risk_rating": 3, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.30},
        {"product_id": "VDHG", "product_name": "Vanguard Diversified High Growth ETF", "product_type": "etf", "provider": "Vanguard", "risk_rating": 6, "approved_date": "2021-01-01", "status": "approved", "max_allocation": 1.0},
        {"product_id": "VDGR", "product_name": "Vanguard Diversified Growth ETF", "product_type": "etf", "provider": "Vanguard", "risk_rating": 5, "approved_date": "2021-01-01", "status": "approved", "max_allocation": 1.0},
        {"product_id": "VDBA", "product_name": "Vanguard Diversified Balanced ETF", "product_type": "etf", "provider": "Vanguard", "risk_rating": 4, "approved_date": "2021-01-01", "status": "approved", "max_allocation": 1.0},
        {"product_id": "VDCO", "product_name": "Vanguard Diversified Conservative ETF", "product_type": "etf", "provider": "Vanguard", "risk_rating": 3, "approved_date": "2021-01-01", "status": "approved", "max_allocation": 1.0},
        {"product_id": "AAA", "product_name": "Betashares Australian High Interest Cash ETF", "product_type": "etf", "provider": "Betashares", "risk_rating": 1, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.30},
        {"product_id": "CBA.AX", "product_name": "Commonwealth Bank of Australia", "product_type": "stock", "provider": "Direct", "risk_rating": 5, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.05},
        {"product_id": "BHP.AX", "product_name": "BHP Group", "product_type": "stock", "provider": "Direct", "risk_rating": 6, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.05},
        {"product_id": "CSL.AX", "product_name": "CSL Limited", "product_type": "stock", "provider": "Direct", "risk_rating": 5, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.05},
        {"product_id": "WBC.AX", "product_name": "Westpac Banking Corporation", "product_type": "stock", "provider": "Direct", "risk_rating": 5, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.05},
        {"product_id": "NAB.AX", "product_name": "National Australia Bank", "product_type": "stock", "provider": "Direct", "risk_rating": 5, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.05},
        {"product_id": "ANZ.AX", "product_name": "ANZ Banking Group", "product_type": "stock", "provider": "Direct", "risk_rating": 5, "approved_date": "2020-01-01", "status": "approved", "max_allocation": 0.05},
    ]

# --- Initialize Default Licensee ---

@router.post("/init-default")
async def initialize_default_licensee() -> dict:
    """Initialize default licensee and adviser for demo"""
    # Check if already exists
    existing = await licensees_col.find_one({"id": "lic_default"})
    if existing:
        return {"message": "Default licensee already exists", "licensee_id": "lic_default", "adviser_id": "adv_default"}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create default licensee
    licensee = {
        "id": "lic_default",
        "name": "AdviceOS Demo Practice",
        "afsl_number": "000000",
        "contact_email": "admin@adviceos.demo",
        "rules_config": DEFAULT_RULES_CONFIG,
        "apl": get_mock_apl(),
        "created_at": now,
        "updated_at": now,
        "status": "active"
    }
    await licensees_col.insert_one(licensee)
    
    # Create default adviser
    adviser = {
        "id": "adv_default",
        "licensee_id": "lic_default",
        "name": "Mark Thompson",
        "email": "mark.thompson@adviceos.demo",
        "ar_number": "AR001234",
        "status": "active",
        "created_at": now,
        "updated_at": now,
        "last_login": now,
        "total_clients": 8,
        "total_scenarios": 0,
        "compliance_score": 100.0,
        "overrides_count": 0,
        "breaches_count": 0
    }
    await advisers_col.insert_one(adviser)
    
    return {
        "message": "Default licensee and adviser created",
        "licensee_id": "lic_default",
        "adviser_id": "adv_default"
    }
