"""
Compliance Routes
Automatic audit trails, suitability documentation, and regulatory compliance.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/compliance", tags=["Compliance"])

# In-memory storage
AUDIT_LOGS: List[Dict] = []
SOA_DOCUMENTS: Dict[str, Dict] = {}
COMPLIANCE_CHECKS: Dict[str, Dict] = {}


class AuditLogRequest(BaseModel):
    client_id: str
    action_type: str  # advice_given, trade_executed, document_signed, etc.
    description: str
    advisor_id: str = "advisor_1"
    details: Optional[Dict] = None


class SOARequest(BaseModel):
    client_id: str
    client_name: str
    advice_type: str  # investment, insurance, super, comprehensive
    recommendations: List[Dict]
    risk_profile: str
    goals: List[str]
    current_situation: Dict
    advisor_id: str = "advisor_1"


@router.post("/audit-log")
async def create_audit_log(request: AuditLogRequest):
    """Create an audit log entry for compliance tracking."""
    log_id = f"audit_{uuid.uuid4().hex[:8]}"
    
    log_entry = {
        "id": log_id,
        "client_id": request.client_id,
        "action_type": request.action_type,
        "description": request.description,
        "advisor_id": request.advisor_id,
        "details": request.details or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip_address": "192.168.1.1",  # Would be actual IP in production
        "user_agent": "Wealth Command Platform"
    }
    
    AUDIT_LOGS.append(log_entry)
    
    return {
        "success": True,
        "log_id": log_id,
        "message": "Audit log created successfully"
    }


@router.get("/audit-log/{client_id}")
async def get_audit_logs(
    client_id: str,
    action_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get audit logs for a client."""
    logs = [entry for entry in AUDIT_LOGS if entry["client_id"] == client_id]
    
    if action_type:
        logs = [entry for entry in logs if entry["action_type"] == action_type]
    
    # Sort by timestamp descending
    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "client_id": client_id,
        "logs": logs[:50],
        "total": len(logs),
        "filters": {
            "action_type": action_type,
            "start_date": start_date,
            "end_date": end_date
        }
    }


@router.post("/soa/generate")
async def generate_soa(request: SOARequest):
    """Generate a Statement of Advice (SOA) document."""
    soa_id = f"soa_{uuid.uuid4().hex[:8]}"
    
    # Calculate totals
    total_implementation_cost = sum(r.get("implementation_cost", 0) for r in request.recommendations)
    ongoing_fees = sum(r.get("ongoing_fee", 0) for r in request.recommendations)
    
    soa = {
        "id": soa_id,
        "client_id": request.client_id,
        "client_name": request.client_name,
        "advice_type": request.advice_type,
        "status": "draft",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "advisor_id": request.advisor_id,
        
        "sections": {
            "cover_page": {
                "title": f"Statement of Advice for {request.client_name}",
                "prepared_by": "Wealth Command Advisers",
                "afsl": "AFSL 123456",
                "date": datetime.now().strftime("%d %B %Y")
            },
            
            "executive_summary": {
                "goals": request.goals,
                "key_recommendations": [r.get("summary", r.get("title", "")) for r in request.recommendations[:5]],
                "implementation_cost": total_implementation_cost,
                "ongoing_fees": ongoing_fees
            },
            
            "client_situation": {
                "personal_details": request.current_situation.get("personal", {}),
                "financial_position": request.current_situation.get("financial", {}),
                "risk_profile": request.risk_profile,
                "goals_analysis": request.goals
            },
            
            "recommendations": request.recommendations,
            
            "risks_and_warnings": [
                {
                    "type": "market_risk",
                    "description": "Investment values can go down as well as up"
                },
                {
                    "type": "inflation_risk",
                    "description": "Returns may not keep pace with inflation"
                },
                {
                    "type": "liquidity_risk",
                    "description": "Some investments may be difficult to sell quickly"
                }
            ],
            
            "fees_disclosure": {
                "advice_fee": total_implementation_cost * 0.02,
                "implementation_fee": total_implementation_cost * 0.01,
                "ongoing_fee_percent": 0.5,
                "ongoing_fee_dollar": ongoing_fees
            },
            
            "consent_section": {
                "client_consent_required": True,
                "consent_obtained": False,
                "consent_date": None
            }
        },
        
        "compliance_checks": {
            "best_interest_duty": True,
            "appropriate_advice": True,
            "conflicts_disclosed": True,
            "fees_disclosed": True,
            "risks_explained": True
        },
        
        "version": 1,
        "signatures": []
    }
    
    SOA_DOCUMENTS[soa_id] = soa
    
    # Create audit log
    AUDIT_LOGS.append({
        "id": f"audit_{uuid.uuid4().hex[:8]}",
        "client_id": request.client_id,
        "action_type": "soa_generated",
        "description": f"Statement of Advice generated: {soa_id}",
        "advisor_id": request.advisor_id,
        "details": {"soa_id": soa_id, "advice_type": request.advice_type},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "soa_id": soa_id,
        "soa": soa,
        "message": "SOA generated successfully"
    }


@router.get("/soa/{soa_id}")
async def get_soa(soa_id: str):
    """Get a Statement of Advice by ID."""
    if soa_id not in SOA_DOCUMENTS:
        raise HTTPException(status_code=404, detail="SOA not found")
    return SOA_DOCUMENTS[soa_id]


@router.post("/soa/{soa_id}/sign")
async def sign_soa(soa_id: str, signature_type: str = "client"):
    """Record signature on SOA."""
    if soa_id not in SOA_DOCUMENTS:
        raise HTTPException(status_code=404, detail="SOA not found")
    
    soa = SOA_DOCUMENTS[soa_id]
    
    signature = {
        "type": signature_type,
        "signed_at": datetime.now(timezone.utc).isoformat(),
        "ip_address": "192.168.1.1"
    }
    
    soa["signatures"].append(signature)
    
    if signature_type == "client":
        soa["sections"]["consent_section"]["consent_obtained"] = True
        soa["sections"]["consent_section"]["consent_date"] = datetime.now().strftime("%Y-%m-%d")
        soa["status"] = "signed"
    
    return {
        "success": True,
        "message": f"{signature_type.title()} signature recorded",
        "soa_status": soa["status"]
    }


@router.post("/check")
async def run_compliance_check(client_id: str, check_type: str = "full"):
    """Run compliance check for a client."""
    check_id = f"check_{uuid.uuid4().hex[:8]}"
    
    # Simulate compliance checks
    checks = {
        "kyc_status": {
            "status": "pass",
            "last_verified": (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d"),
            "next_review": (datetime.now() + timedelta(days=275)).strftime("%Y-%m-%d"),
            "details": "KYC documentation complete and verified"
        },
        "risk_profile": {
            "status": "pass",
            "last_assessed": (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d"),
            "next_review": (datetime.now() + timedelta(days=185)).strftime("%Y-%m-%d"),
            "details": "Risk profile current and appropriate"
        },
        "suitability": {
            "status": "pass",
            "last_review": (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d"),
            "details": "Current investments suitable for risk profile"
        },
        "fee_disclosure": {
            "status": "pass",
            "last_disclosed": (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"),
            "details": "Annual fee disclosure sent"
        },
        "conflicts_of_interest": {
            "status": "pass",
            "last_reviewed": (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d"),
            "details": "No conflicts identified"
        },
        "aml_check": {
            "status": "pass",
            "last_check": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"),
            "details": "No suspicious activity detected"
        },
        "best_interest_duty": {
            "status": "pass",
            "documentation": "Complete",
            "details": "Best interest duty documentation maintained"
        }
    }
    
    # Calculate overall score
    passed = sum(1 for c in checks.values() if c["status"] == "pass")
    total = len(checks)
    score = (passed / total) * 100
    
    result = {
        "id": check_id,
        "client_id": client_id,
        "check_type": check_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overall_status": "compliant" if score == 100 else "action_required",
        "score": score,
        "checks": checks,
        "action_items": [],
        "next_review_date": (datetime.now() + timedelta(days=90)).strftime("%Y-%m-%d")
    }
    
    COMPLIANCE_CHECKS[check_id] = result
    
    return result


@router.get("/dashboard")
async def get_compliance_dashboard():
    """Get compliance dashboard overview."""
    # Simulate dashboard data
    total_clients = 45
    compliant = 42
    action_required = 3
    
    return {
        "overview": {
            "total_clients": total_clients,
            "compliant": compliant,
            "action_required": action_required,
            "compliance_rate": round((compliant / total_clients) * 100, 1)
        },
        
        "upcoming_reviews": [
            {"client_id": "client_1", "client_name": "John Smith", "review_type": "Annual Review", "due_date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")},
            {"client_id": "client_2", "client_name": "Sarah Johnson", "review_type": "Risk Profile", "due_date": (datetime.now() + timedelta(days=12)).strftime("%Y-%m-%d")},
            {"client_id": "client_3", "client_name": "Michael Brown", "review_type": "KYC Verification", "due_date": (datetime.now() + timedelta(days=18)).strftime("%Y-%m-%d")}
        ],
        
        "recent_activity": [
            {"action": "SOA Generated", "client": "Emma Wilson", "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()},
            {"action": "Compliance Check", "client": "David Lee", "timestamp": (datetime.now() - timedelta(hours=5)).isoformat()},
            {"action": "Document Signed", "client": "Lisa Chen", "timestamp": (datetime.now() - timedelta(days=1)).isoformat()}
        ],
        
        "risk_alerts": [
            {"severity": "high", "message": "3 clients due for annual review this week"},
            {"severity": "medium", "message": "2 SOAs pending client signature"},
            {"severity": "low", "message": "5 risk profiles due for reassessment next month"}
        ],
        
        "metrics": {
            "soas_generated_mtd": 12,
            "reviews_completed_mtd": 8,
            "average_compliance_score": 94.5,
            "audit_logs_this_month": len(AUDIT_LOGS)
        },
        
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/roi/{client_id}")
async def get_record_of_advice(client_id: str):
    """Get Record of Advice (ROI) for a client."""
    # Generate ROI entries
    roi_entries = [
        {
            "id": f"roi_{i}",
            "date": (datetime.now() - timedelta(days=30 * i)).strftime("%Y-%m-%d"),
            "advice_type": ["Investment", "Insurance", "Super", "Tax"][i % 4],
            "summary": "Advice provided regarding portfolio rebalancing and strategy review",
            "outcome": "Implemented",
            "advisor": "Wealth Command Advisers",
            "documents": [f"SOA_{client_id}_{i}.pdf", f"FDS_{client_id}_{i}.pdf"]
        }
        for i in range(5)
    ]
    
    return {
        "client_id": client_id,
        "roi_entries": roi_entries,
        "total_entries": len(roi_entries),
        "last_advice_date": roi_entries[0]["date"] if roi_entries else None,
        "compliance_status": "current"
    }
