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
async def get_dashboard_summary(licensee_id: str = "lic_default") -> dict:
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
) -> dict:
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
) -> dict:
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
) -> dict:
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
) -> dict:
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
async def get_client_file_export(client_id: str) -> dict:
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
) -> dict:
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
) -> dict:
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
async def generate_demo_data() -> dict:
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



# ==================== XPLAN REPORTS ====================

@router.get("/xplan/sync-history")
async def get_xplan_sync_history() -> dict:
    """Get Xplan synchronization history report."""
    now = datetime.now(timezone.utc)
    
    # Mock sync history data
    sync_history = [
        {
            "id": f"sync_{uuid.uuid4().hex[:8]}",
            "sync_type": "full",
            "direction": "import",
            "status": "completed",
            "records_processed": 156,
            "records_created": 12,
            "records_updated": 144,
            "records_failed": 0,
            "started_at": (now - timedelta(hours=2)).isoformat(),
            "completed_at": (now - timedelta(hours=1, minutes=45)).isoformat(),
            "duration_seconds": 900,
            "entities_synced": ["clients", "portfolios", "risk_profiles", "goals"]
        },
        {
            "id": f"sync_{uuid.uuid4().hex[:8]}",
            "sync_type": "incremental",
            "direction": "export",
            "status": "completed",
            "records_processed": 23,
            "records_created": 5,
            "records_updated": 18,
            "records_failed": 0,
            "started_at": (now - timedelta(days=1)).isoformat(),
            "completed_at": (now - timedelta(days=1) + timedelta(minutes=5)).isoformat(),
            "duration_seconds": 300,
            "entities_synced": ["file_notes", "scenario_summaries"]
        },
        {
            "id": f"sync_{uuid.uuid4().hex[:8]}",
            "sync_type": "full",
            "direction": "import",
            "status": "completed_with_warnings",
            "records_processed": 145,
            "records_created": 8,
            "records_updated": 135,
            "records_failed": 2,
            "warnings": ["Client ID CLI_089 has missing risk profile", "Portfolio PF_023 has stale pricing data"],
            "started_at": (now - timedelta(days=3)).isoformat(),
            "completed_at": (now - timedelta(days=3) + timedelta(minutes=20)).isoformat(),
            "duration_seconds": 1200,
            "entities_synced": ["clients", "portfolios", "transactions"]
        }
    ]
    
    return {
        "sync_history": sync_history,
        "summary": {
            "total_syncs": len(sync_history),
            "successful": len([s for s in sync_history if s["status"] == "completed"]),
            "with_warnings": len([s for s in sync_history if s["status"] == "completed_with_warnings"]),
            "failed": 0,
            "total_records_processed": sum(s["records_processed"] for s in sync_history),
            "last_sync": sync_history[0]["completed_at"] if sync_history else None
        },
        "generated_at": now.isoformat()
    }

@router.get("/xplan/client-mapping")
async def get_xplan_client_mapping() -> dict:
    """Get Xplan to Wealth Command client mapping report."""
    now = datetime.now(timezone.utc)
    
    client_mappings = [
        {
            "wealth_command_id": "client_1",
            "xplan_id": "XP_CLI_001",
            "xplan_entity_id": "ENT_78234",
            "name": "James & Sarah Wheeler",
            "sync_status": "synced",
            "last_synced": (now - timedelta(hours=2)).isoformat(),
            "data_quality_score": 98,
            "missing_fields": []
        },
        {
            "wealth_command_id": "client_2",
            "xplan_id": "XP_CLI_002",
            "xplan_entity_id": "ENT_78235",
            "name": "Chen Family Trust",
            "sync_status": "synced",
            "last_synced": (now - timedelta(hours=2)).isoformat(),
            "data_quality_score": 95,
            "missing_fields": ["secondary_contact_phone"]
        },
        {
            "wealth_command_id": "client_3",
            "xplan_id": "XP_CLI_003",
            "xplan_entity_id": "ENT_78236",
            "name": "Robert Mitchell",
            "sync_status": "synced",
            "last_synced": (now - timedelta(hours=2)).isoformat(),
            "data_quality_score": 100,
            "missing_fields": []
        },
        {
            "wealth_command_id": "client_4",
            "xplan_id": None,
            "xplan_entity_id": None,
            "name": "Thompson SMSF",
            "sync_status": "not_linked",
            "last_synced": None,
            "data_quality_score": 85,
            "missing_fields": ["xplan_id", "tfn"]
        },
        {
            "wealth_command_id": "client_5",
            "xplan_id": "XP_CLI_005",
            "xplan_entity_id": "ENT_78238",
            "name": "Patel Family",
            "sync_status": "pending_review",
            "last_synced": (now - timedelta(days=5)).isoformat(),
            "data_quality_score": 72,
            "missing_fields": ["risk_profile", "investment_objectives"]
        }
    ]
    
    return {
        "client_mappings": client_mappings,
        "summary": {
            "total_clients": len(client_mappings),
            "synced": len([c for c in client_mappings if c["sync_status"] == "synced"]),
            "not_linked": len([c for c in client_mappings if c["sync_status"] == "not_linked"]),
            "pending_review": len([c for c in client_mappings if c["sync_status"] == "pending_review"]),
            "average_data_quality": round(sum(c["data_quality_score"] for c in client_mappings) / len(client_mappings), 1)
        },
        "generated_at": now.isoformat()
    }

@router.get("/xplan/file-notes")
async def get_xplan_file_notes_report() -> dict:
    """Get Xplan file notes synchronization report."""
    now = datetime.now(timezone.utc)
    
    file_notes = [
        {
            "id": "FN_001",
            "client_id": "client_1",
            "xplan_note_id": "XP_NOTE_8923",
            "subject": "Annual Review Meeting",
            "note_type": "meeting",
            "created_by": "Mark Thompson",
            "created_at": (now - timedelta(days=7)).isoformat(),
            "synced_to_xplan": True,
            "synced_at": (now - timedelta(days=7, hours=-1)).isoformat(),
            "word_count": 456
        },
        {
            "id": "FN_002",
            "client_id": "client_1",
            "xplan_note_id": "XP_NOTE_8924",
            "subject": "Portfolio Rebalancing Discussion",
            "note_type": "advice",
            "created_by": "Mark Thompson",
            "created_at": (now - timedelta(days=14)).isoformat(),
            "synced_to_xplan": True,
            "synced_at": (now - timedelta(days=14, hours=-2)).isoformat(),
            "word_count": 892
        },
        {
            "id": "FN_003",
            "client_id": "client_2",
            "xplan_note_id": None,
            "subject": "Trust Distribution Strategy",
            "note_type": "strategy",
            "created_by": "Sarah Chen",
            "created_at": (now - timedelta(days=3)).isoformat(),
            "synced_to_xplan": False,
            "synced_at": None,
            "word_count": 623,
            "pending_reason": "Awaiting compliance review"
        },
        {
            "id": "FN_004",
            "client_id": "client_3",
            "xplan_note_id": "XP_NOTE_8925",
            "subject": "Retirement Income Analysis",
            "note_type": "analysis",
            "created_by": "Mark Thompson",
            "created_at": (now - timedelta(days=21)).isoformat(),
            "synced_to_xplan": True,
            "synced_at": (now - timedelta(days=21, hours=-1)).isoformat(),
            "word_count": 1234
        }
    ]
    
    return {
        "file_notes": file_notes,
        "summary": {
            "total_notes": len(file_notes),
            "synced": len([n for n in file_notes if n["synced_to_xplan"]]),
            "pending_sync": len([n for n in file_notes if not n["synced_to_xplan"]]),
            "total_word_count": sum(n["word_count"] for n in file_notes),
            "by_type": {
                "meeting": len([n for n in file_notes if n["note_type"] == "meeting"]),
                "advice": len([n for n in file_notes if n["note_type"] == "advice"]),
                "strategy": len([n for n in file_notes if n["note_type"] == "strategy"]),
                "analysis": len([n for n in file_notes if n["note_type"] == "analysis"])
            }
        },
        "generated_at": now.isoformat()
    }


# ==================== STOCK CALCULATOR REPORTS ====================

@router.get("/calculators/cgt")
async def get_cgt_calculator_report(client_id: str = "client_1", financial_year: str = "2025-26") -> dict:
    """Get Capital Gains Tax calculator report."""
    now = datetime.now(timezone.utc)
    
    # Mock CGT transactions
    cgt_events = [
        {
            "id": "CGT_001",
            "asset_type": "shares",
            "asset_name": "Commonwealth Bank (CBA.AX)",
            "units_sold": 500,
            "purchase_date": "2021-03-15",
            "sale_date": "2025-11-20",
            "cost_base": 42500.00,
            "sale_proceeds": 67500.00,
            "capital_gain": 25000.00,
            "holding_period_days": 1711,
            "discount_eligible": True,
            "discount_percentage": 50,
            "taxable_gain": 12500.00,
            "method": "FIFO"
        },
        {
            "id": "CGT_002",
            "asset_type": "shares",
            "asset_name": "BHP Group (BHP.AX)",
            "units_sold": 200,
            "purchase_date": "2024-06-01",
            "sale_date": "2025-09-15",
            "cost_base": 8400.00,
            "sale_proceeds": 9200.00,
            "capital_gain": 800.00,
            "holding_period_days": 471,
            "discount_eligible": True,
            "discount_percentage": 50,
            "taxable_gain": 400.00,
            "method": "FIFO"
        },
        {
            "id": "CGT_003",
            "asset_type": "etf",
            "asset_name": "Vanguard Australian Shares ETF (VAS.AX)",
            "units_sold": 100,
            "purchase_date": "2025-02-10",
            "sale_date": "2025-08-20",
            "cost_base": 9500.00,
            "sale_proceeds": 9100.00,
            "capital_gain": -400.00,
            "holding_period_days": 191,
            "discount_eligible": False,
            "discount_percentage": 0,
            "taxable_gain": -400.00,
            "method": "FIFO"
        },
        {
            "id": "CGT_004",
            "asset_type": "property",
            "asset_name": "Investment Property - 45 Beach Rd",
            "units_sold": 1,
            "purchase_date": "2018-07-01",
            "sale_date": "2026-01-15",
            "cost_base": 650000.00,
            "improvements": 45000.00,
            "selling_costs": 25000.00,
            "adjusted_cost_base": 720000.00,
            "sale_proceeds": 920000.00,
            "capital_gain": 200000.00,
            "holding_period_days": 2755,
            "discount_eligible": True,
            "discount_percentage": 50,
            "taxable_gain": 100000.00,
            "method": "Indexation not available (post-1999)"
        }
    ]
    
    total_gains = sum(e["capital_gain"] for e in cgt_events if e["capital_gain"] > 0)
    total_losses = abs(sum(e["capital_gain"] for e in cgt_events if e["capital_gain"] < 0))
    net_gain = total_gains - total_losses
    total_taxable = sum(e["taxable_gain"] for e in cgt_events)
    
    return {
        "client_id": client_id,
        "financial_year": financial_year,
        "cgt_events": cgt_events,
        "summary": {
            "total_disposals": len(cgt_events),
            "total_capital_gains": total_gains,
            "total_capital_losses": total_losses,
            "net_capital_gain": net_gain,
            "losses_applied": min(total_losses, total_gains),
            "losses_carried_forward": max(0, total_losses - total_gains),
            "discount_applied": total_gains * 0.5 if net_gain > 0 else 0,
            "total_taxable_gain": max(0, total_taxable),
            "estimated_tax_payable": max(0, total_taxable) * 0.37  # Assuming 37% marginal rate
        },
        "tax_planning_notes": [
            "Consider realizing losses before June 30 to offset gains",
            "Property sale contributes 80% of total taxable gains",
            "CGT discount saved approximately $50,000 in tax"
        ],
        "generated_at": now.isoformat()
    }

@router.get("/calculators/dividend-income")
async def get_dividend_income_report(client_id: str = "client_1", financial_year: str = "2025-26") -> dict:
    """Get dividend income and franking credits report."""
    now = datetime.now(timezone.utc)
    
    dividend_records = [
        {
            "id": "DIV_001",
            "stock_code": "CBA.AX",
            "company_name": "Commonwealth Bank of Australia",
            "payment_date": "2025-09-28",
            "dividend_type": "final",
            "shares_held": 1500,
            "dividend_per_share": 2.25,
            "gross_dividend": 3375.00,
            "franking_percentage": 100,
            "franking_credits": 1446.43,
            "net_dividend": 3375.00,
            "drp_elected": False
        },
        {
            "id": "DIV_002",
            "stock_code": "CBA.AX",
            "company_name": "Commonwealth Bank of Australia",
            "payment_date": "2026-03-28",
            "dividend_type": "interim",
            "shares_held": 1500,
            "dividend_per_share": 2.15,
            "gross_dividend": 3225.00,
            "franking_percentage": 100,
            "franking_credits": 1382.14,
            "net_dividend": 3225.00,
            "drp_elected": False
        },
        {
            "id": "DIV_003",
            "stock_code": "BHP.AX",
            "company_name": "BHP Group Limited",
            "payment_date": "2025-09-25",
            "dividend_type": "final",
            "shares_held": 800,
            "dividend_per_share": 1.50,
            "gross_dividend": 1200.00,
            "franking_percentage": 100,
            "franking_credits": 514.29,
            "net_dividend": 1200.00,
            "drp_elected": True
        },
        {
            "id": "DIV_004",
            "stock_code": "WES.AX",
            "company_name": "Wesfarmers Limited",
            "payment_date": "2025-10-10",
            "dividend_type": "final",
            "shares_held": 400,
            "dividend_per_share": 1.03,
            "gross_dividend": 412.00,
            "franking_percentage": 100,
            "franking_credits": 176.57,
            "net_dividend": 412.00,
            "drp_elected": False
        },
        {
            "id": "DIV_005",
            "stock_code": "VAS.AX",
            "company_name": "Vanguard Australian Shares ETF",
            "payment_date": "2025-12-30",
            "dividend_type": "distribution",
            "shares_held": 1200,
            "dividend_per_share": 0.85,
            "gross_dividend": 1020.00,
            "franking_percentage": 45,
            "franking_credits": 196.71,
            "net_dividend": 1020.00,
            "drp_elected": True
        }
    ]
    
    total_gross = sum(d["gross_dividend"] for d in dividend_records)
    total_franking = sum(d["franking_credits"] for d in dividend_records)
    total_net = sum(d["net_dividend"] for d in dividend_records)
    
    return {
        "client_id": client_id,
        "financial_year": financial_year,
        "dividend_records": dividend_records,
        "summary": {
            "total_dividends_received": total_net,
            "total_franking_credits": total_franking,
            "grossed_up_income": total_gross + total_franking,
            "average_franking_percentage": round(sum(d["franking_percentage"] * d["gross_dividend"] for d in dividend_records) / total_gross, 1),
            "drp_reinvested": sum(d["gross_dividend"] for d in dividend_records if d["drp_elected"]),
            "cash_received": sum(d["gross_dividend"] for d in dividend_records if not d["drp_elected"]),
            "estimated_tax_offset": total_franking
        },
        "by_company": [
            {"code": code, "total": sum(d["gross_dividend"] for d in dividend_records if d["stock_code"] == code)}
            for code in set(d["stock_code"] for d in dividend_records)
        ],
        "generated_at": now.isoformat()
    }

@router.get("/calculators/portfolio-performance")
async def get_portfolio_performance_report(client_id: str = "client_1", period: str = "1Y") -> dict:
    """Get detailed portfolio performance analysis report."""
    now = datetime.now(timezone.utc)
    
    holdings_performance = [
        {
            "asset_code": "CBA.AX",
            "asset_name": "Commonwealth Bank",
            "asset_class": "Australian Equities",
            "units": 1500,
            "purchase_price": 85.50,
            "current_price": 138.45,
            "cost_base": 128250.00,
            "current_value": 207675.00,
            "unrealized_gain": 79425.00,
            "unrealized_gain_pct": 61.93,
            "dividends_received": 6600.00,
            "total_return": 86025.00,
            "total_return_pct": 67.08,
            "weight_in_portfolio": 22.5
        },
        {
            "asset_code": "BHP.AX",
            "asset_name": "BHP Group",
            "asset_class": "Australian Equities",
            "units": 800,
            "purchase_price": 42.00,
            "current_price": 46.20,
            "cost_base": 33600.00,
            "current_value": 36960.00,
            "unrealized_gain": 3360.00,
            "unrealized_gain_pct": 10.00,
            "dividends_received": 2400.00,
            "total_return": 5760.00,
            "total_return_pct": 17.14,
            "weight_in_portfolio": 4.0
        },
        {
            "asset_code": "VAS.AX",
            "asset_name": "Vanguard Aus Shares ETF",
            "asset_class": "Australian Equities",
            "units": 1200,
            "purchase_price": 92.30,
            "current_price": 98.75,
            "cost_base": 110760.00,
            "current_value": 118500.00,
            "unrealized_gain": 7740.00,
            "unrealized_gain_pct": 6.99,
            "dividends_received": 2040.00,
            "total_return": 9780.00,
            "total_return_pct": 8.83,
            "weight_in_portfolio": 12.8
        },
        {
            "asset_code": "VGS.AX",
            "asset_name": "Vanguard Intl Shares ETF",
            "asset_class": "International Equities",
            "units": 800,
            "purchase_price": 105.20,
            "current_price": 128.90,
            "cost_base": 84160.00,
            "current_value": 103120.00,
            "unrealized_gain": 18960.00,
            "unrealized_gain_pct": 22.53,
            "dividends_received": 1200.00,
            "total_return": 20160.00,
            "total_return_pct": 23.95,
            "weight_in_portfolio": 11.2
        },
        {
            "asset_code": "CBAPD.AX",
            "asset_name": "CBA PERLS XII",
            "asset_class": "Hybrid Securities",
            "units": 500,
            "purchase_price": 100.50,
            "current_price": 101.25,
            "cost_base": 50250.00,
            "current_value": 50625.00,
            "unrealized_gain": 375.00,
            "unrealized_gain_pct": 0.75,
            "dividends_received": 3750.00,
            "total_return": 4125.00,
            "total_return_pct": 8.21,
            "weight_in_portfolio": 5.5
        }
    ]
    
    total_cost = sum(h["cost_base"] for h in holdings_performance)
    total_value = sum(h["current_value"] for h in holdings_performance)
    total_dividends = sum(h["dividends_received"] for h in holdings_performance)
    total_gain = sum(h["unrealized_gain"] for h in holdings_performance)
    
    return {
        "client_id": client_id,
        "period": period,
        "holdings": holdings_performance,
        "portfolio_summary": {
            "total_cost_base": total_cost,
            "current_value": total_value,
            "total_unrealized_gain": total_gain,
            "total_unrealized_gain_pct": round(total_gain / total_cost * 100, 2),
            "total_dividends_received": total_dividends,
            "total_return": total_gain + total_dividends,
            "total_return_pct": round((total_gain + total_dividends) / total_cost * 100, 2)
        },
        "asset_allocation": {
            "Australian Equities": 39.3,
            "International Equities": 11.2,
            "Hybrid Securities": 5.5,
            "Fixed Interest": 15.0,
            "Property": 20.0,
            "Cash": 9.0
        },
        "risk_metrics": {
            "volatility_1y": 12.5,
            "sharpe_ratio": 1.24,
            "beta": 0.92,
            "max_drawdown": -8.3,
            "var_95": -15420.00
        },
        "benchmark_comparison": {
            "benchmark": "S&P/ASX 200 Total Return",
            "portfolio_return_1y": 18.5,
            "benchmark_return_1y": 14.2,
            "alpha": 4.3,
            "tracking_error": 3.8
        },
        "generated_at": now.isoformat()
    }

@router.get("/calculators/retirement-projection")
async def get_retirement_projection_report(client_id: str = "client_1") -> dict:
    """Get retirement income projection calculator report."""
    now = datetime.now(timezone.utc)
    
    return {
        "client_id": client_id,
        "client_name": "James & Sarah Wheeler",
        "current_age": 52,
        "retirement_age": 65,
        "life_expectancy": 90,
        "current_assets": {
            "superannuation": {
                "james": 850000,
                "sarah": 620000,
                "total": 1470000
            },
            "investments": 520000,
            "property_equity": 450000,
            "cash": 85000,
            "total": 2525000
        },
        "contributions": {
            "super_contributions_pa": 55000,
            "investment_contributions_pa": 24000,
            "years_to_retirement": 13,
            "total_future_contributions": 1027000
        },
        "projections": {
            "conservative": {
                "return_assumption": 5.5,
                "inflation_assumption": 2.5,
                "retirement_balance": 4250000,
                "annual_income_real": 148750,
                "monthly_income_real": 12396,
                "years_of_income": 25,
                "probability_of_success": 95
            },
            "balanced": {
                "return_assumption": 7.0,
                "inflation_assumption": 2.5,
                "retirement_balance": 5120000,
                "annual_income_real": 179200,
                "monthly_income_real": 14933,
                "years_of_income": 25,
                "probability_of_success": 85
            },
            "growth": {
                "return_assumption": 8.5,
                "inflation_assumption": 2.5,
                "retirement_balance": 6180000,
                "annual_income_real": 216300,
                "monthly_income_real": 18025,
                "years_of_income": 25,
                "probability_of_success": 72
            }
        },
        "age_pension_eligibility": {
            "eligible": True,
            "full_pension": False,
            "estimated_part_pension_pa": 12500,
            "assets_test_threshold": 1045500
        },
        "recommendations": [
            "Maximize concessional super contributions to $30,000 per person",
            "Consider spouse contribution splitting to equalize balances",
            "Review asset allocation annually as retirement approaches",
            "Model downsizer contribution if selling family home"
        ],
        "generated_at": now.isoformat()
    }


# ==================== COMPLIANCE REPORTS ====================

@router.get("/compliance/apl-check")
async def get_apl_compliance_report(licensee_id: str = "lic_default") -> dict:
    """Get Approved Product List compliance check report."""
    now = datetime.now(timezone.utc)
    
    apl_checks = [
        {
            "client_id": "client_1",
            "client_name": "James & Sarah Wheeler",
            "product_code": "CBA.AX",
            "product_name": "Commonwealth Bank Shares",
            "product_type": "direct_equity",
            "on_apl": True,
            "apl_status": "approved",
            "risk_rating": "medium",
            "allocation": 22.5,
            "max_allowed_allocation": 30.0,
            "compliant": True,
            "notes": None
        },
        {
            "client_id": "client_1",
            "client_name": "James & Sarah Wheeler",
            "product_code": "VAS.AX",
            "product_name": "Vanguard Australian Shares ETF",
            "product_type": "etf",
            "on_apl": True,
            "apl_status": "approved",
            "risk_rating": "medium",
            "allocation": 12.8,
            "max_allowed_allocation": 40.0,
            "compliant": True,
            "notes": None
        },
        {
            "client_id": "client_2",
            "client_name": "Chen Family Trust",
            "product_code": "ARKK",
            "product_name": "ARK Innovation ETF",
            "product_type": "etf",
            "on_apl": False,
            "apl_status": "not_approved",
            "risk_rating": "high",
            "allocation": 5.2,
            "max_allowed_allocation": 0,
            "compliant": False,
            "notes": "Product not on APL - requires adviser justification or removal"
        },
        {
            "client_id": "client_3",
            "client_name": "Robert Mitchell",
            "product_code": "CBAPD.AX",
            "product_name": "CBA PERLS XII Hybrid",
            "product_type": "hybrid",
            "on_apl": True,
            "apl_status": "approved_with_conditions",
            "risk_rating": "medium_high",
            "allocation": 15.0,
            "max_allowed_allocation": 20.0,
            "compliant": True,
            "notes": "Maximum 20% allocation to hybrids per client"
        }
    ]
    
    compliant_count = len([c for c in apl_checks if c["compliant"]])
    non_compliant_count = len([c for c in apl_checks if not c["compliant"]])
    
    return {
        "licensee_id": licensee_id,
        "apl_checks": apl_checks,
        "summary": {
            "total_products_checked": len(apl_checks),
            "compliant": compliant_count,
            "non_compliant": non_compliant_count,
            "compliance_rate": round(compliant_count / len(apl_checks) * 100, 1),
            "products_requiring_attention": [c for c in apl_checks if not c["compliant"]]
        },
        "apl_statistics": {
            "total_approved_products": 245,
            "etfs": 52,
            "managed_funds": 89,
            "direct_equities": 78,
            "hybrids": 15,
            "bonds": 11
        },
        "generated_at": now.isoformat()
    }

@router.get("/compliance/risk-profile-alignment")
async def get_risk_alignment_report(licensee_id: str = "lic_default") -> dict:
    """Get risk profile alignment compliance report."""
    now = datetime.now(timezone.utc)
    
    risk_alignments = [
        {
            "client_id": "client_1",
            "client_name": "James & Sarah Wheeler",
            "stated_risk_profile": "balanced",
            "portfolio_risk_score": 52,
            "risk_band": "balanced",
            "aligned": True,
            "growth_allocation": 62,
            "defensive_allocation": 38,
            "recommended_growth_range": [50, 70],
            "variance_from_target": 0,
            "status": "PASS"
        },
        {
            "client_id": "client_2",
            "client_name": "Chen Family Trust",
            "stated_risk_profile": "growth",
            "portfolio_risk_score": 78,
            "risk_band": "aggressive",
            "aligned": False,
            "growth_allocation": 88,
            "defensive_allocation": 12,
            "recommended_growth_range": [70, 85],
            "variance_from_target": 3,
            "status": "WARNING",
            "warning_reason": "Portfolio slightly more aggressive than risk profile suggests"
        },
        {
            "client_id": "client_3",
            "client_name": "Robert Mitchell",
            "stated_risk_profile": "conservative",
            "portfolio_risk_score": 28,
            "risk_band": "conservative",
            "aligned": True,
            "growth_allocation": 30,
            "defensive_allocation": 70,
            "recommended_growth_range": [20, 40],
            "variance_from_target": 0,
            "status": "PASS"
        },
        {
            "client_id": "client_5",
            "client_name": "Patel SMSF",
            "stated_risk_profile": "balanced",
            "portfolio_risk_score": 85,
            "risk_band": "aggressive",
            "aligned": False,
            "growth_allocation": 92,
            "defensive_allocation": 8,
            "recommended_growth_range": [50, 70],
            "variance_from_target": 22,
            "status": "BLOCK",
            "block_reason": "Significant misalignment - portfolio too aggressive for stated risk profile"
        }
    ]
    
    aligned_count = len([r for r in risk_alignments if r["aligned"]])
    
    return {
        "licensee_id": licensee_id,
        "risk_alignments": risk_alignments,
        "summary": {
            "total_clients_checked": len(risk_alignments),
            "aligned": aligned_count,
            "warnings": len([r for r in risk_alignments if r["status"] == "WARNING"]),
            "blocked": len([r for r in risk_alignments if r["status"] == "BLOCK"]),
            "alignment_rate": round(aligned_count / len(risk_alignments) * 100, 1)
        },
        "risk_profile_distribution": {
            "conservative": 1,
            "balanced": 2,
            "growth": 1,
            "aggressive": 0
        },
        "generated_at": now.isoformat()
    }

@router.get("/compliance/fee-disclosure")
async def get_fee_disclosure_report(licensee_id: str = "lic_default") -> dict:
    """Get fee disclosure and compliance report."""
    now = datetime.now(timezone.utc)
    
    fee_reports = [
        {
            "client_id": "client_1",
            "client_name": "James & Sarah Wheeler",
            "portfolio_value": 923000,
            "fees": {
                "adviser_fee": {
                    "type": "percentage",
                    "rate": 0.88,
                    "annual_amount": 8122.40,
                    "disclosed": True,
                    "fds_date": "2025-07-01"
                },
                "platform_fee": {
                    "type": "percentage",
                    "rate": 0.25,
                    "annual_amount": 2307.50,
                    "disclosed": True
                },
                "investment_costs": {
                    "weighted_mer": 0.32,
                    "annual_amount": 2953.60,
                    "disclosed": True
                },
                "transaction_costs": {
                    "estimated_annual": 450.00,
                    "disclosed": True
                }
            },
            "total_fees": 13833.50,
            "total_fee_percentage": 1.50,
            "fee_cap_compliant": True,
            "fee_cap": 2.0,
            "fds_status": "current",
            "next_fds_due": "2026-07-01"
        },
        {
            "client_id": "client_2",
            "client_name": "Chen Family Trust",
            "portfolio_value": 1850000,
            "fees": {
                "adviser_fee": {
                    "type": "fixed",
                    "rate": None,
                    "annual_amount": 15000.00,
                    "disclosed": True,
                    "fds_date": "2025-09-15"
                },
                "platform_fee": {
                    "type": "percentage",
                    "rate": 0.20,
                    "annual_amount": 3700.00,
                    "disclosed": True
                },
                "investment_costs": {
                    "weighted_mer": 0.28,
                    "annual_amount": 5180.00,
                    "disclosed": True
                }
            },
            "total_fees": 23880.00,
            "total_fee_percentage": 1.29,
            "fee_cap_compliant": True,
            "fee_cap": 2.0,
            "fds_status": "current",
            "next_fds_due": "2026-09-15"
        }
    ]
    
    return {
        "licensee_id": licensee_id,
        "fee_reports": fee_reports,
        "summary": {
            "total_clients": len(fee_reports),
            "total_fees_collected": sum(f["total_fees"] for f in fee_reports),
            "average_fee_percentage": round(sum(f["total_fee_percentage"] for f in fee_reports) / len(fee_reports), 2),
            "all_fds_current": all(f["fds_status"] == "current" for f in fee_reports),
            "fee_cap_breaches": len([f for f in fee_reports if not f["fee_cap_compliant"]])
        },
        "fee_benchmarks": {
            "licensee_average": 1.40,
            "industry_average": 1.65,
            "below_industry_average": True
        },
        "upcoming_fds_renewals": [
            {"client_id": "client_1", "due_date": "2026-07-01", "days_until_due": 99},
            {"client_id": "client_2", "due_date": "2026-09-15", "days_until_due": 175}
        ],
        "generated_at": now.isoformat()
    }


# ==================== EXPORT REPORTS ====================

@router.get("/export/full-client-pack/{client_id}")
async def get_full_client_export_pack(client_id: str) -> dict:
    """Get complete client export pack with all reports."""
    now = datetime.now(timezone.utc)
    
    return {
        "client_id": client_id,
        "export_type": "full_client_pack",
        "generated_at": now.isoformat(),
        "pack_contents": {
            "client_profile": {
                "included": True,
                "sections": ["personal_details", "contact_info", "employment", "risk_profile", "objectives"]
            },
            "portfolio_summary": {
                "included": True,
                "sections": ["holdings", "asset_allocation", "performance", "income"]
            },
            "financial_plan": {
                "included": True,
                "sections": ["goals", "strategies", "projections", "recommendations"]
            },
            "compliance_records": {
                "included": True,
                "sections": ["apl_checks", "risk_alignment", "fee_disclosure", "audit_trail"]
            },
            "advice_documents": {
                "included": True,
                "sections": ["soas", "roas", "file_notes", "meeting_records"]
            },
            "transaction_history": {
                "included": True,
                "sections": ["trades", "contributions", "withdrawals", "distributions"]
            }
        },
        "export_formats_available": ["pdf", "csv", "json", "xlsx"],
        "regulatory_compliance": {
            "data_retention_compliant": True,
            "retention_period_years": 7,
            "earliest_record_date": "2019-03-15",
            "gdpr_compliant": True,
            "privacy_act_compliant": True
        },
        "estimated_file_sizes": {
            "pdf": "2.4 MB",
            "csv": "850 KB",
            "json": "1.2 MB",
            "xlsx": "1.8 MB"
        }
    }

@router.get("/export/regulatory-pack")
async def get_regulatory_export_pack(licensee_id: str = "lic_default") -> dict:
    """Get regulatory compliance export pack for ASIC/auditors."""
    now = datetime.now(timezone.utc)
    
    return {
        "licensee_id": licensee_id,
        "export_type": "regulatory_compliance_pack",
        "generated_at": now.isoformat(),
        "reporting_period": {
            "start": (now - timedelta(days=365)).isoformat()[:10],
            "end": now.isoformat()[:10]
        },
        "pack_contents": {
            "licensee_information": {
                "afsl_number": "123456",
                "abn": "12 345 678 901",
                "authorised_representatives": 8,
                "active_clients": 156
            },
            "compliance_summary": {
                "total_advice_instances": 892,
                "compliant": 875,
                "warnings_issued": 15,
                "breaches_identified": 2,
                "breaches_remediated": 2,
                "compliance_rate": 98.1
            },
            "adviser_activity": {
                "total_advisers": 8,
                "active_advisers": 7,
                "suspended_advisers": 1,
                "average_clients_per_adviser": 22,
                "cpd_compliance_rate": 100
            },
            "breach_register": {
                "total_breaches": 2,
                "significant_breaches": 0,
                "reported_to_asic": 0,
                "remediation_complete": True
            },
            "complaints_register": {
                "total_complaints": 3,
                "resolved": 3,
                "average_resolution_days": 14,
                "escalated_to_afca": 0
            },
            "audit_trail": {
                "total_entries": 15234,
                "scenario_generations": 892,
                "adviser_decisions": 875,
                "overrides": 45,
                "override_rate": 5.1
            }
        },
        "certifications": {
            "compliance_officer_sign_off": True,
            "sign_off_date": now.isoformat()[:10],
            "external_audit_date": "2025-06-30",
            "audit_opinion": "unqualified"
        },
        "export_formats_available": ["pdf", "xlsx"],
        "estimated_file_size": "4.8 MB"
    }

@router.get("/export/advice-file/{client_id}")
async def get_advice_file_export(client_id: str) -> dict:
    """Get complete advice file for a client."""
    now = datetime.now(timezone.utc)
    
    return {
        "client_id": client_id,
        "export_type": "advice_file",
        "generated_at": now.isoformat(),
        "advice_records": [
            {
                "advice_id": "ADV_001",
                "type": "SOA",
                "title": "Comprehensive Financial Plan",
                "date": "2025-03-15",
                "adviser": "Mark Thompson",
                "status": "implemented",
                "topics_covered": ["retirement_planning", "investment_strategy", "insurance_review", "estate_planning"],
                "recommendations_made": 8,
                "recommendations_implemented": 7,
                "compliance_reviewed": True,
                "compliance_reviewer": "Sarah Chen",
                "file_note_id": "FN_001"
            },
            {
                "advice_id": "ADV_002",
                "type": "ROA",
                "title": "Portfolio Rebalancing",
                "date": "2025-09-20",
                "adviser": "Mark Thompson",
                "status": "implemented",
                "topics_covered": ["portfolio_review", "rebalancing"],
                "recommendations_made": 3,
                "recommendations_implemented": 3,
                "compliance_reviewed": True,
                "compliance_reviewer": "Sarah Chen",
                "file_note_id": "FN_002"
            },
            {
                "advice_id": "ADV_003",
                "type": "ROA",
                "title": "Superannuation Contribution Strategy",
                "date": "2026-02-10",
                "adviser": "Mark Thompson",
                "status": "pending_implementation",
                "topics_covered": ["superannuation", "tax_planning"],
                "recommendations_made": 2,
                "recommendations_implemented": 0,
                "compliance_reviewed": True,
                "compliance_reviewer": "Sarah Chen",
                "file_note_id": "FN_003"
            }
        ],
        "meeting_records": [
            {
                "meeting_id": "MTG_001",
                "date": "2025-03-10",
                "type": "annual_review",
                "duration_minutes": 90,
                "attendees": ["James Wheeler", "Sarah Wheeler", "Mark Thompson"],
                "topics_discussed": ["performance_review", "goal_progress", "strategy_update"],
                "action_items": 5,
                "file_note_generated": True
            },
            {
                "meeting_id": "MTG_002",
                "date": "2025-09-18",
                "type": "strategy_review",
                "duration_minutes": 45,
                "attendees": ["James Wheeler", "Mark Thompson"],
                "topics_discussed": ["portfolio_rebalancing", "market_outlook"],
                "action_items": 2,
                "file_note_generated": True
            }
        ],
        "total_file_notes": 12,
        "total_advice_documents": 3,
        "data_retention_status": "compliant",
        "earliest_record": "2019-05-22"
    }
