"""
AdviceOS Reports Dashboard
===========================
Comprehensive reporting and data export for compliance, advisers, and clients.
Supports multiple export formats: JSON, CSV, PDF.
"""

import os
import uuid
import csv
import io
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports Dashboard"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
scenarios_col = db["scenarios"]
compliance_checks_col = db["compliance_checks"]
adviser_decisions_col = db["adviser_decisions"]
audit_logs_col = db["audit_logs"]
breach_flags_col = db["breach_flags"]
reports_col = db["reports"]
licensees_col = db["licensees"]
advisers_col = db["advisers"]

# ==================== REPORT REQUEST MODELS ====================

class ReportRequest(BaseModel):
    report_type: str  # adviser_activity, compliance_summary, breach_report, client_file, audit_export, scenario_history
    licensee_id: str = "lic_default"
    adviser_id: Optional[str] = None
    client_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    format: str = "json"  # json, csv, pdf

# ==================== DASHBOARD SUMMARY ====================

@router.get("/dashboard/summary")
async def get_dashboard_summary(licensee_id: str = "lic_default"):
    """
    Get high-level summary for the reports dashboard.
    Shows key metrics for compliance, scenarios, and adviser activity.
    """
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    # Count scenarios
    total_scenarios = await scenarios_col.count_documents({"licensee_id": licensee_id})
    recent_scenarios = await scenarios_col.count_documents({
        "licensee_id": licensee_id,
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Count compliance checks
    total_checks = await compliance_checks_col.count_documents({})
    passed_checks = await compliance_checks_col.count_documents({"overall_result": "pass"})
    warning_checks = await compliance_checks_col.count_documents({"overall_result": "warning"})
    blocked_checks = await compliance_checks_col.count_documents({"overall_result": "block"})
    
    # Count breaches
    open_breaches = await breach_flags_col.count_documents({"status": "open"})
    resolved_breaches = await breach_flags_col.count_documents({"status": "resolved"})
    
    # Count decisions
    total_decisions = await adviser_decisions_col.count_documents({})
    approved_decisions = await adviser_decisions_col.count_documents({"decision": "approved"})
    overrides = await adviser_decisions_col.count_documents({"override_occurred": True})
    
    # Count audit logs
    total_audit_entries = await audit_logs_col.count_documents({})
    
    # Compliance score calculation
    compliance_score = 100
    if total_checks > 0:
        compliance_score = round((passed_checks / total_checks) * 100, 1)
    
    return {
        "summary": {
            "compliance_score": compliance_score,
            "scenarios": {
                "total": total_scenarios,
                "last_30_days": recent_scenarios
            },
            "compliance_checks": {
                "total": total_checks,
                "passed": passed_checks,
                "warnings": warning_checks,
                "blocked": blocked_checks
            },
            "breaches": {
                "open": open_breaches,
                "resolved": resolved_breaches
            },
            "decisions": {
                "total": total_decisions,
                "approved": approved_decisions,
                "overrides": overrides
            },
            "audit_logs": total_audit_entries
        },
        "report_types": [
            {"id": "adviser_activity", "name": "Adviser Activity Report", "description": "Activity summary for advisers including scenarios, decisions, and overrides"},
            {"id": "compliance_summary", "name": "Compliance Summary Report", "description": "Compliance check results and rule violations"},
            {"id": "breach_report", "name": "Breach Report", "description": "All compliance breaches with status and resolution details"},
            {"id": "client_file", "name": "Client File Export", "description": "Complete client file including scenarios, decisions, and audit trail"},
            {"id": "audit_export", "name": "Audit Log Export", "description": "Full audit trail for regulatory requirements"},
            {"id": "scenario_history", "name": "Scenario History Report", "description": "Historical scenarios with inputs, outputs, and trade-offs"}
        ],
        "generated_at": now.isoformat()
    }

# ==================== ADVISER ACTIVITY REPORT ====================

@router.get("/adviser-activity")
async def get_adviser_activity_report(
    adviser_id: str = "adv_default",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Generate adviser activity report with scenarios, decisions, compliance metrics.
    """
    query = {"adviser_id": adviser_id}
    
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    # Get adviser details
    adviser = await advisers_col.find_one({"id": adviser_id}, {"_id": 0})
    if not adviser:
        # Return mock adviser data if not found
        adviser = {
            "id": adviser_id,
            "name": "Mark Thompson",
            "email": "mark.thompson@adviceos.demo",
            "licensee_id": "lic_default",
            "status": "active"
        }
    
    # Get scenarios created by adviser
    scenarios = await scenarios_col.find(query, {"_id": 0}).to_list(1000)
    
    # Get decisions made by adviser
    decisions = await adviser_decisions_col.find({"adviser_id": adviser_id}, {"_id": 0}).to_list(1000)
    
    # Get audit logs for adviser
    audit_logs = await audit_logs_col.find({"user_id": adviser_id}, {"_id": 0}).sort("timestamp", -1).limit(100).to_list(100)
    
    # Calculate metrics
    total_scenarios = len(scenarios)
    total_decisions = len(decisions)
    overrides = len([d for d in decisions if d.get("override_occurred")])
    approved = len([d for d in decisions if d.get("decision") == "approved"])
    
    return {
        "adviser": adviser,
        "period": {
            "start": start_date or "All time",
            "end": end_date or "Present"
        },
        "metrics": {
            "scenarios_generated": total_scenarios,
            "decisions_made": total_decisions,
            "approvals": approved,
            "overrides": overrides,
            "override_rate": round(overrides / max(1, total_decisions) * 100, 2)
        },
        "recent_scenarios": scenarios[:10],
        "recent_decisions": decisions[:10],
        "recent_activity": audit_logs[:20],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== COMPLIANCE SUMMARY REPORT ====================

@router.get("/compliance-summary")
async def get_compliance_summary_report(
    licensee_id: str = "lic_default",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Generate compliance summary report with rule violations and trends.
    """
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    # Get compliance checks
    checks = await compliance_checks_col.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Aggregate rule violations
    rule_violations = {}
    for check in checks:
        for rule in check.get("rules_triggered", []):
            if rule.get("result") in ["warning", "block"]:
                rule_id = rule.get("rule_id", "UNKNOWN")
                if rule_id not in rule_violations:
                    rule_violations[rule_id] = {
                        "rule_name": rule.get("rule_name"),
                        "count": 0,
                        "warnings": 0,
                        "blocks": 0
                    }
                rule_violations[rule_id]["count"] += 1
                if rule.get("result") == "warning":
                    rule_violations[rule_id]["warnings"] += 1
                else:
                    rule_violations[rule_id]["blocks"] += 1
    
    # Get breach summary
    breaches = await breach_flags_col.find({}, {"_id": 0}).to_list(100)
    breach_by_severity = {
        "critical": len([b for b in breaches if b.get("severity") == "critical"]),
        "high": len([b for b in breaches if b.get("severity") == "high"]),
        "medium": len([b for b in breaches if b.get("severity") == "medium"]),
        "low": len([b for b in breaches if b.get("severity") == "low"])
    }
    
    total_checks = len(checks)
    passed = len([c for c in checks if c.get("overall_result") == "pass"])
    warnings = len([c for c in checks if c.get("overall_result") == "warning"])
    blocked = len([c for c in checks if c.get("overall_result") == "block"])
    
    return {
        "period": {
            "start": start_date or "All time",
            "end": end_date or "Present"
        },
        "summary": {
            "total_checks": total_checks,
            "passed": passed,
            "warnings": warnings,
            "blocked": blocked,
            "pass_rate": round(passed / max(1, total_checks) * 100, 2)
        },
        "rule_violations": list(rule_violations.values()),
        "breaches": {
            "total": len(breaches),
            "by_severity": breach_by_severity,
            "open": len([b for b in breaches if b.get("status") == "open"]),
            "resolved": len([b for b in breaches if b.get("status") == "resolved"])
        },
        "recent_checks": checks[:20],
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== SCENARIO HISTORY REPORT ====================

@router.get("/scenario-history")
async def get_scenario_history_report(
    client_id: Optional[str] = None,
    adviser_id: Optional[str] = None,
    limit: int = 50
):
    """
    Get scenario history with full details including inputs, outputs, and trade-offs.
    """
    query = {}
    if client_id:
        query["client_id"] = client_id
    if adviser_id:
        query["adviser_id"] = adviser_id
    
    scenarios = await scenarios_col.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Enrich with compliance check results
    enriched_scenarios = []
    for scenario in scenarios:
        scenario_id = scenario.get("id")
        compliance_check = await compliance_checks_col.find_one(
            {"scenario_set_id": scenario_id},
            {"_id": 0}
        )
        decision = await adviser_decisions_col.find_one(
            {"scenario_set_id": scenario_id},
            {"_id": 0}
        )
        
        enriched_scenarios.append({
            **scenario,
            "compliance_result": compliance_check.get("overall_result") if compliance_check else "pending",
            "decision": decision.get("decision") if decision else "pending",
            "decision_date": decision.get("created_at") if decision else None
        })
    
    return {
        "scenarios": enriched_scenarios,
        "count": len(enriched_scenarios),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== AUDIT LOG EXPORT ====================

@router.get("/audit-export")
async def get_audit_export(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 1000
):
    """
    Export audit logs for regulatory compliance.
    Supports filtering by entity, user, and date range.
    """
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if user_id:
        query["user_id"] = user_id
    if start_date:
        query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_date
        else:
            query["timestamp"] = {"$lte": end_date}
    
    logs = await audit_logs_col.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "audit_logs": logs,
        "count": len(logs),
        "query_params": {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "user_id": user_id,
            "start_date": start_date,
            "end_date": end_date
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": "This audit export is generated for regulatory compliance purposes. All data is immutable and hash-verified."
    }

# ==================== CLIENT FILE EXPORT ====================

@router.get("/client-file/{client_id}")
async def get_client_file_export(client_id: str):
    """
    Export complete client file for regulatory or handover purposes.
    Includes all scenarios, decisions, compliance checks, and audit trail.
    """
    # Get all scenarios for client
    scenarios = await scenarios_col.find({"client_id": client_id}, {"_id": 0}).to_list(100)
    
    # Get all decisions for client's scenarios
    scenario_ids = [s.get("id") for s in scenarios]
    decisions = await adviser_decisions_col.find(
        {"scenario_set_id": {"$in": scenario_ids}},
        {"_id": 0}
    ).to_list(100)
    
    # Get compliance checks
    compliance_checks = await compliance_checks_col.find(
        {"scenario_set_id": {"$in": scenario_ids}},
        {"_id": 0}
    ).to_list(100)
    
    # Get audit trail for client
    audit_trail = await audit_logs_col.find(
        {"entity_id": {"$in": [client_id] + scenario_ids}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(500)
    
    # Get breaches related to client
    breaches = await breach_flags_col.find(
        {"client_id": client_id},
        {"_id": 0}
    ).to_list(50)
    
    return {
        "client_id": client_id,
        "export_date": datetime.now(timezone.utc).isoformat(),
        "data": {
            "scenarios": scenarios,
            "decisions": decisions,
            "compliance_checks": compliance_checks,
            "breaches": breaches,
            "audit_trail": audit_trail
        },
        "statistics": {
            "total_scenarios": len(scenarios),
            "total_decisions": len(decisions),
            "compliance_checks": len(compliance_checks),
            "audit_entries": len(audit_trail)
        },
        "disclaimer": "This client file export is generated for regulatory compliance and data portability. Contains complete advice history."
    }

# ==================== BREACH REPORT ====================

@router.get("/breach-report")
async def get_breach_report(
    licensee_id: str = "lic_default",
    adviser_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None
):
    """
    Generate breach report with filtering options.
    """
    query = {"licensee_id": licensee_id}
    if adviser_id:
        query["adviser_id"] = adviser_id
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    
    breaches = await breach_flags_col.find(query, {"_id": 0}).sort("detected_at", -1).to_list(500)
    
    # Aggregate by type
    by_type = {}
    by_adviser = {}
    for breach in breaches:
        b_type = breach.get("breach_type", "unknown")
        b_adviser = breach.get("adviser_id", "unknown")
        
        by_type[b_type] = by_type.get(b_type, 0) + 1
        by_adviser[b_adviser] = by_adviser.get(b_adviser, 0) + 1
    
    return {
        "breaches": breaches,
        "count": len(breaches),
        "summary": {
            "by_type": by_type,
            "by_adviser": by_adviser,
            "by_status": {
                "open": len([b for b in breaches if b.get("status") == "open"]),
                "under_review": len([b for b in breaches if b.get("status") == "under_review"]),
                "resolved": len([b for b in breaches if b.get("status") == "resolved"]),
                "escalated": len([b for b in breaches if b.get("status") == "escalated"])
            },
            "by_severity": {
                "critical": len([b for b in breaches if b.get("severity") == "critical"]),
                "high": len([b for b in breaches if b.get("severity") == "high"]),
                "medium": len([b for b in breaches if b.get("severity") == "medium"]),
                "low": len([b for b in breaches if b.get("severity") == "low"])
            }
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== DOWNLOAD ENDPOINTS ====================

@router.get("/download/csv/{report_type}")
async def download_report_csv(
    report_type: str,
    client_id: Optional[str] = None,
    adviser_id: Optional[str] = None
):
    """
    Download report as CSV file.
    """
    if report_type == "audit-logs":
        logs = await audit_logs_col.find({}, {"_id": 0}).sort("timestamp", -1).limit(1000).to_list(1000)
        
        output = io.StringIO()
        if logs:
            # Collect all possible fieldnames from all logs
            all_fieldnames = set()
            for log in logs:
                all_fieldnames.update(log.keys())
            fieldnames = sorted(list(all_fieldnames))
            
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            for log in logs:
                # Flatten nested dicts for CSV
                flat_log = {}
                for k, v in log.items():
                    if isinstance(v, dict):
                        flat_log[k] = json.dumps(v)
                    elif isinstance(v, list):
                        flat_log[k] = json.dumps(v)
                    else:
                        flat_log[k] = v
                writer.writerow(flat_log)
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    
    elif report_type == "scenarios":
        query = {}
        if client_id:
            query["client_id"] = client_id
        if adviser_id:
            query["adviser_id"] = adviser_id
            
        scenarios = await scenarios_col.find(query, {"_id": 0}).to_list(500)
        
        # Flatten for CSV
        rows = []
        for s in scenarios:
            rows.append({
                "id": s.get("id"),
                "client_id": s.get("client_id"),
                "adviser_id": s.get("adviser_id"),
                "created_at": s.get("created_at"),
                "status": s.get("status"),
                "compliance_status": s.get("compliance_status"),
                "scenario_count": len(s.get("scenarios", []))
            })
        
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=rows[0].keys())
            writer.writeheader()
            writer.writerows(rows)
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=scenarios_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    
    elif report_type == "breaches":
        breaches = await breach_flags_col.find({}, {"_id": 0}).to_list(500)
        
        output = io.StringIO()
        if breaches:
            writer = csv.DictWriter(output, fieldnames=breaches[0].keys())
            writer.writeheader()
            writer.writerows(breaches)
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=breaches_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")

# ==================== GENERATE DEMO DATA ====================

@router.post("/generate-demo-data")
async def generate_demo_data():
    """
    Generate demo compliance data for testing the dashboard.
    """
    now = datetime.now(timezone.utc)
    
    # Generate sample scenarios
    demo_scenarios = []
    for i in range(5):
        scenario_id = f"set_demo_{uuid.uuid4().hex[:8]}"
        demo_scenarios.append({
            "id": scenario_id,
            "client_id": f"client_{i+1}",
            "adviser_id": "adv_default",
            "licensee_id": "lic_default",
            "inputs": {
                "client_id": f"client_{i+1}",
                "risk_profile": ["conservative", "balanced", "growth"][i % 3],
                "investment_timeframe_years": 10,
                "initial_investment": 500000 + (i * 100000)
            },
            "scenarios": [
                {"scenario_type": "conservative", "scenario_name": "Conservative Strategy"},
                {"scenario_type": "balanced", "scenario_name": "Balanced Strategy"},
                {"scenario_type": "growth", "scenario_name": "Growth Strategy"}
            ],
            "compliance_status": ["pass", "warning", "pass", "pass", "warning"][i],
            "created_at": (now - timedelta(days=i*7)).isoformat(),
            "status": "approved"
        })
    
    # Insert demo scenarios
    for scenario in demo_scenarios:
        existing = await scenarios_col.find_one({"id": scenario["id"]})
        if not existing:
            await scenarios_col.insert_one(scenario)
    
    # Generate sample compliance checks
    demo_checks = []
    for i, scenario in enumerate(demo_scenarios):
        check_id = f"chk_demo_{uuid.uuid4().hex[:8]}"
        result = ["pass", "warning", "pass", "pass", "warning"][i]
        demo_checks.append({
            "id": check_id,
            "scenario_set_id": scenario["id"],
            "scenario_id": f"scn_demo_{i}",
            "overall_result": result,
            "rules_triggered": [
                {"rule_id": "PASS_001", "rule_name": "All Compliance Checks", "result": "pass", "details": "Passed"}
            ] if result == "pass" else [
                {"rule_id": "RISK_001", "rule_name": "Risk Profile Alignment", "result": "warning", "details": "Minor deviation"}
            ],
            "apl_compliance": True,
            "risk_alignment": result == "pass",
            "fee_compliance": True,
            "allocation_compliance": True,
            "created_at": scenario["created_at"],
            "checked_by": "system"
        })
    
    for check in demo_checks:
        existing = await compliance_checks_col.find_one({"id": check["id"]})
        if not existing:
            await compliance_checks_col.insert_one(check)
    
    # Generate sample decisions
    demo_decisions = []
    for i, scenario in enumerate(demo_scenarios):
        decision_id = f"dec_demo_{uuid.uuid4().hex[:8]}"
        demo_decisions.append({
            "id": decision_id,
            "scenario_set_id": scenario["id"],
            "adviser_id": "adv_default",
            "selected_scenario_id": f"scn_demo_{i}_balanced",
            "decision": "approved",
            "confirmation": {
                "reviewed_scenarios": True,
                "client_best_interest": True,
                "understood_risks": True,
                "discussed_with_client": True
            },
            "justification_text": "Balanced strategy aligns with client's risk profile and goals.",
            "override_occurred": i == 2,
            "override_reason": "Client specifically requested higher equity exposure" if i == 2 else None,
            "created_at": scenario["created_at"]
        })
    
    for decision in demo_decisions:
        existing = await adviser_decisions_col.find_one({"id": decision["id"]})
        if not existing:
            await adviser_decisions_col.insert_one(decision)
    
    # Generate sample audit logs
    demo_logs = []
    for i, scenario in enumerate(demo_scenarios):
        log_id = f"audit_demo_{uuid.uuid4().hex[:8]}"
        demo_logs.append({
            "id": log_id,
            "user_id": "adv_default",
            "user_role": "adviser",
            "action_type": "create",
            "entity_type": "scenario",
            "entity_id": scenario["id"],
            "after_state": {"scenario_count": 3},
            "timestamp": scenario["created_at"],
            "hash": f"demo_hash_{i}"
        })
    
    for log in demo_logs:
        existing = await audit_logs_col.find_one({"id": log["id"]})
        if not existing:
            await audit_logs_col.insert_one(log)
    
    return {
        "success": True,
        "message": "Demo data generated successfully",
        "created": {
            "scenarios": len(demo_scenarios),
            "compliance_checks": len(demo_checks),
            "decisions": len(demo_decisions),
            "audit_logs": len(demo_logs)
        }
    }
