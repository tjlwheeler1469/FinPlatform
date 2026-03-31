"""
Licensee Multi-tenant Dashboard
Enables multiple AFSL holders (licensees) to manage their own advisers, 
compliance rules, APLs, and monitor adviser activity.
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/licensee", tags=["Licensee Multi-tenant"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
licensees_col = db["licensees"]
advisers_col = db["advisers"]
scenarios_col = db["scenarios"]
compliance_checks_col = db["compliance_checks"]
adviser_decisions_col = db["adviser_decisions"]
audit_logs_col = db["audit_logs"]
breach_flags_col = db["breach_flags"]
apl_col = db["approved_product_lists"]

# ==================== MODELS ====================

class LicenseeCreate(BaseModel):
    name: str
    afsl_number: str
    abn: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    compliance_officer: Optional[str] = None
    risk_framework: Dict[str, Any] = Field(default_factory=dict)

class LicenseeUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    compliance_officer: Optional[str] = None
    risk_framework: Optional[Dict[str, Any]] = None
    rules_config: Optional[Dict[str, Any]] = None

class AdviserCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    ar_number: Optional[str] = None  # Authorised Representative Number
    status: str = "active"

class APLProduct(BaseModel):
    product_code: str
    product_name: str
    product_type: str  # managed_fund, etf, stock, hybrid, bond, etc.
    provider: str
    risk_rating: str  # low, medium, high, very_high
    approved_for: List[str] = []  # conservative, balanced, growth, etc.
    min_investment: float = 0
    max_allocation: float = 100
    notes: Optional[str] = None

class ComplianceRule(BaseModel):
    rule_id: str
    rule_name: str
    rule_type: str  # allocation, risk, fee, product, concentration
    description: str
    conditions: Dict[str, Any]
    action: str  # warn, block
    active: bool = True

# ==================== LICENSEE ENDPOINTS ====================

@router.post("/create")
async def create_licensee(licensee: LicenseeCreate) -> dict:
    """Create a new licensee (AFSL holder)."""
    # Check if AFSL already exists
    existing = await licensees_col.find_one({"afsl_number": licensee.afsl_number})
    if existing:
        raise HTTPException(status_code=400, detail="AFSL number already registered")
    
    licensee_id = f"lic_{uuid.uuid4().hex[:12]}"
    
    licensee_doc = {
        "id": licensee_id,
        "name": licensee.name,
        "afsl_number": licensee.afsl_number,
        "abn": licensee.abn,
        "contact_email": licensee.contact_email,
        "contact_phone": licensee.contact_phone,
        "address": licensee.address,
        "compliance_officer": licensee.compliance_officer,
        "risk_framework": licensee.risk_framework,
        "rules_config": {
            "max_equity_allocation": 80,
            "max_single_stock": 10,
            "max_fee_drag": 2.0,
            "require_risk_alignment": True,
            "require_apl_compliance": True
        },
        "apl": [],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await licensees_col.insert_one(licensee_doc)
    
    # Create audit log
    await audit_logs_col.insert_one({
        "id": f"audit_{uuid.uuid4().hex[:12]}",
        "user_id": "system",
        "user_role": "system",
        "action_type": "create",
        "entity_type": "licensee",
        "entity_id": licensee_id,
        "after_state": {"name": licensee.name, "afsl": licensee.afsl_number},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "licensee_id": licensee_id,
        "message": f"Licensee '{licensee.name}' created successfully"
    }

@router.get("/{licensee_id}")
async def get_licensee(licensee_id: str) -> dict:
    """Get licensee details."""
    licensee = await licensees_col.find_one({"id": licensee_id}, {"_id": 0})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    return licensee

@router.put("/{licensee_id}")
async def update_licensee(licensee_id: str, updates: LicenseeUpdate) -> dict:
    """Update licensee details."""
    licensee = await licensees_col.find_one({"id": licensee_id})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await licensees_col.update_one({"id": licensee_id}, {"$set": update_dict})
    
    return {"success": True, "message": "Licensee updated"}

@router.get("/{licensee_id}/dashboard")
async def get_licensee_dashboard(licensee_id: str) -> dict:
    """Get comprehensive licensee dashboard with metrics."""
    licensee = await licensees_col.find_one({"id": licensee_id}, {"_id": 0})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    # Get advisers
    advisers = await advisers_col.find(
        {"licensee_id": licensee_id},
        {"_id": 0}
    ).to_list(100)
    
    # Get scenarios
    total_scenarios = await scenarios_col.count_documents({"licensee_id": licensee_id})
    recent_scenarios = await scenarios_col.count_documents({
        "licensee_id": licensee_id,
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Get compliance checks
    all_checks = await compliance_checks_col.find(
        {"licensee_id": licensee_id},
        {"_id": 0, "overall_result": 1}
    ).to_list(10000)
    
    passed = len([c for c in all_checks if c.get("overall_result") == "pass"])
    warnings = len([c for c in all_checks if c.get("overall_result") == "warning"])
    blocked = len([c for c in all_checks if c.get("overall_result") == "block"])
    total_checks = len(all_checks)
    
    # Get breaches
    open_breaches = await breach_flags_col.count_documents({
        "licensee_id": licensee_id,
        "status": "open"
    })
    total_breaches = await breach_flags_col.count_documents({"licensee_id": licensee_id})
    
    # Get decisions with overrides
    total_decisions = await adviser_decisions_col.count_documents({"licensee_id": licensee_id})
    override_decisions = await adviser_decisions_col.count_documents({
        "licensee_id": licensee_id,
        "override_occurred": True
    })
    
    # Calculate compliance score
    compliance_score = round(passed / max(1, total_checks) * 100, 1) if total_checks > 0 else 100
    
    # Adviser activity summary
    adviser_activity = []
    for adviser in advisers[:10]:
        adviser_scenarios = await scenarios_col.count_documents({
            "licensee_id": licensee_id,
            "adviser_id": adviser.get("id")
        })
        adviser_overrides = await adviser_decisions_col.count_documents({
            "licensee_id": licensee_id,
            "adviser_id": adviser.get("id"),
            "override_occurred": True
        })
        adviser_activity.append({
            "adviser_id": adviser.get("id"),
            "name": adviser.get("name"),
            "status": adviser.get("status"),
            "scenarios": adviser_scenarios,
            "overrides": adviser_overrides
        })
    
    return {
        "licensee": {
            "id": licensee_id,
            "name": licensee.get("name"),
            "afsl_number": licensee.get("afsl_number"),
            "status": licensee.get("status")
        },
        "summary": {
            "compliance_score": compliance_score,
            "advisers": {
                "total": len(advisers),
                "active": len([a for a in advisers if a.get("status") == "active"])
            },
            "scenarios": {
                "total": total_scenarios,
                "last_30_days": recent_scenarios
            },
            "compliance_checks": {
                "total": total_checks,
                "passed": passed,
                "warnings": warnings,
                "blocked": blocked
            },
            "breaches": {
                "open": open_breaches,
                "total": total_breaches
            },
            "decisions": {
                "total": total_decisions,
                "overrides": override_decisions,
                "override_rate": round(override_decisions / max(1, total_decisions) * 100, 2)
            }
        },
        "adviser_activity": adviser_activity,
        "generated_at": now.isoformat()
    }

@router.get("/list/all")
async def list_all_licensees() -> dict:
    """List all licensees (admin view)."""
    licensees = await licensees_col.find({}, {"_id": 0}).to_list(100)
    
    # Enrich with adviser count
    for lic in licensees:
        adviser_count = await advisers_col.count_documents({"licensee_id": lic.get("id")})
        lic["adviser_count"] = adviser_count
    
    return {
        "licensees": licensees,
        "count": len(licensees)
    }

# ==================== ADVISER MANAGEMENT ====================

@router.post("/{licensee_id}/advisers")
async def add_adviser(licensee_id: str, adviser: AdviserCreate) -> dict:
    """Add an adviser to a licensee."""
    licensee = await licensees_col.find_one({"id": licensee_id})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    adviser_id = f"adv_{uuid.uuid4().hex[:12]}"
    
    adviser_doc = {
        "id": adviser_id,
        "licensee_id": licensee_id,
        "name": adviser.name,
        "email": adviser.email,
        "phone": adviser.phone,
        "ar_number": adviser.ar_number,
        "status": adviser.status,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await advisers_col.insert_one(adviser_doc)
    
    return {
        "success": True,
        "adviser_id": adviser_id,
        "message": f"Adviser '{adviser.name}' added to licensee"
    }

@router.get("/{licensee_id}/advisers")
async def get_licensee_advisers(licensee_id: str) -> dict:
    """Get all advisers for a licensee."""
    advisers = await advisers_col.find(
        {"licensee_id": licensee_id},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with activity data
    for adviser in advisers:
        adviser["scenario_count"] = await scenarios_col.count_documents({
            "adviser_id": adviser.get("id")
        })
        adviser["override_count"] = await adviser_decisions_col.count_documents({
            "adviser_id": adviser.get("id"),
            "override_occurred": True
        })
    
    return {
        "advisers": advisers,
        "count": len(advisers)
    }

@router.put("/{licensee_id}/advisers/{adviser_id}/status")
async def update_adviser_status(licensee_id: str, adviser_id: str, status: str) -> dict:
    """Update adviser status (active, suspended, terminated)."""
    result = await advisers_col.update_one(
        {"id": adviser_id, "licensee_id": licensee_id},
        {
            "$set": {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Adviser not found")
    
    # Create audit log
    await audit_logs_col.insert_one({
        "id": f"audit_{uuid.uuid4().hex[:12]}",
        "user_id": "licensee_admin",
        "user_role": "licensee_admin",
        "action_type": "status_change",
        "entity_type": "adviser",
        "entity_id": adviser_id,
        "after_state": {"status": status},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "message": f"Adviser status updated to {status}"}

# ==================== APL MANAGEMENT ====================

@router.post("/{licensee_id}/apl")
async def add_apl_product(licensee_id: str, product: APLProduct) -> dict:
    """Add a product to the Approved Product List."""
    licensee = await licensees_col.find_one({"id": licensee_id})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    product_doc = {
        "id": f"apl_{uuid.uuid4().hex[:8]}",
        "licensee_id": licensee_id,
        **product.model_dump(),
        "added_at": datetime.now(timezone.utc).isoformat(),
        "active": True
    }
    
    await apl_col.insert_one(product_doc)
    
    return {
        "success": True,
        "product_id": product_doc["id"],
        "message": f"Product '{product.product_name}' added to APL"
    }

@router.get("/{licensee_id}/apl")
async def get_apl(licensee_id: str, product_type: Optional[str] = None) -> dict:
    """Get Approved Product List for a licensee."""
    query = {"licensee_id": licensee_id, "active": True}
    if product_type:
        query["product_type"] = product_type
    
    products = await apl_col.find(query, {"_id": 0}).to_list(500)
    
    return {
        "products": products,
        "count": len(products),
        "licensee_id": licensee_id
    }

@router.delete("/{licensee_id}/apl/{product_id}")
async def remove_apl_product(licensee_id: str, product_id: str) -> dict:
    """Remove a product from the APL (soft delete)."""
    result = await apl_col.update_one(
        {"id": product_id, "licensee_id": licensee_id},
        {"$set": {"active": False, "removed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found in APL")
    
    return {"success": True, "message": "Product removed from APL"}

# ==================== COMPLIANCE RULES ====================

@router.post("/{licensee_id}/rules")
async def add_compliance_rule(licensee_id: str, rule: ComplianceRule) -> dict:
    """Add a custom compliance rule for the licensee."""
    licensee = await licensees_col.find_one({"id": licensee_id})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    rules_config = licensee.get("rules_config", {})
    custom_rules = rules_config.get("custom_rules", [])
    custom_rules.append(rule.model_dump())
    rules_config["custom_rules"] = custom_rules
    
    await licensees_col.update_one(
        {"id": licensee_id},
        {"$set": {"rules_config": rules_config, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": f"Rule '{rule.rule_name}' added"}

@router.get("/{licensee_id}/rules")
async def get_compliance_rules(licensee_id: str) -> dict:
    """Get all compliance rules for a licensee."""
    licensee = await licensees_col.find_one({"id": licensee_id}, {"_id": 0})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    rules_config = licensee.get("rules_config", {})
    
    # Standard rules
    standard_rules = [
        {
            "rule_id": "STD_001",
            "rule_name": "Maximum Equity Allocation",
            "rule_type": "allocation",
            "value": rules_config.get("max_equity_allocation", 80),
            "description": f"Maximum equity allocation cannot exceed {rules_config.get('max_equity_allocation', 80)}%"
        },
        {
            "rule_id": "STD_002",
            "rule_name": "Maximum Single Stock Concentration",
            "rule_type": "concentration",
            "value": rules_config.get("max_single_stock", 10),
            "description": f"Single stock cannot exceed {rules_config.get('max_single_stock', 10)}% of portfolio"
        },
        {
            "rule_id": "STD_003",
            "rule_name": "Maximum Fee Drag",
            "rule_type": "fee",
            "value": rules_config.get("max_fee_drag", 2.0),
            "description": f"Total fees cannot exceed {rules_config.get('max_fee_drag', 2.0)}% per annum"
        },
        {
            "rule_id": "STD_004",
            "rule_name": "Risk Profile Alignment",
            "rule_type": "risk",
            "active": rules_config.get("require_risk_alignment", True),
            "description": "Portfolio must align with client's stated risk profile"
        },
        {
            "rule_id": "STD_005",
            "rule_name": "APL Compliance",
            "rule_type": "product",
            "active": rules_config.get("require_apl_compliance", True),
            "description": "All products must be on the Approved Product List"
        }
    ]
    
    custom_rules = rules_config.get("custom_rules", [])
    
    return {
        "standard_rules": standard_rules,
        "custom_rules": custom_rules,
        "licensee_id": licensee_id
    }

@router.put("/{licensee_id}/rules/standard")
async def update_standard_rules(licensee_id: str, rules: Dict[str, Any]) -> dict:
    """Update standard compliance rule values."""
    licensee = await licensees_col.find_one({"id": licensee_id})
    if not licensee:
        raise HTTPException(status_code=404, detail="Licensee not found")
    
    rules_config = licensee.get("rules_config", {})
    
    # Update allowed fields
    allowed_fields = [
        "max_equity_allocation",
        "max_single_stock",
        "max_fee_drag",
        "require_risk_alignment",
        "require_apl_compliance"
    ]
    
    for field in allowed_fields:
        if field in rules:
            rules_config[field] = rules[field]
    
    await licensees_col.update_one(
        {"id": licensee_id},
        {"$set": {"rules_config": rules_config, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Compliance rules updated"}

# ==================== BREACH MONITORING ====================

@router.get("/{licensee_id}/breaches")
async def get_licensee_breaches(
    licensee_id: str,
    status: Optional[str] = None,
    severity: Optional[str] = None
) -> dict:
    """Get compliance breaches for a licensee."""
    query = {"licensee_id": licensee_id}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
    
    breaches = await breach_flags_col.find(query, {"_id": 0}).sort("detected_at", -1).to_list(200)
    
    return {
        "breaches": breaches,
        "count": len(breaches),
        "summary": {
            "open": len([b for b in breaches if b.get("status") == "open"]),
            "critical": len([b for b in breaches if b.get("severity") == "critical"]),
            "high": len([b for b in breaches if b.get("severity") == "high"])
        }
    }

@router.put("/{licensee_id}/breaches/{breach_id}/resolve")
async def resolve_breach(
    licensee_id: str,
    breach_id: str,
    resolution_note: str
) -> dict:
    """Resolve a compliance breach."""
    result = await breach_flags_col.update_one(
        {"id": breach_id, "licensee_id": licensee_id},
        {
            "$set": {
                "status": "resolved",
                "resolution_note": resolution_note,
                "resolved_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Breach not found")
    
    return {"success": True, "message": "Breach resolved"}

# ==================== AUDIT & REPORTING ====================

@router.get("/{licensee_id}/audit-trail")
async def get_licensee_audit_trail(
    licensee_id: str,
    limit: int = 100,
    entity_type: Optional[str] = None
) -> dict:
    """Get audit trail for licensee activities."""
    # Get all adviser IDs for this licensee
    advisers = await advisers_col.find(
        {"licensee_id": licensee_id},
        {"id": 1}
    ).to_list(100)
    adviser_ids = [a["id"] for a in advisers]
    adviser_ids.append(licensee_id)
    adviser_ids.append("licensee_admin")
    
    query = {"user_id": {"$in": adviser_ids}}
    if entity_type:
        query["entity_type"] = entity_type
    
    logs = await audit_logs_col.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "audit_logs": logs,
        "count": len(logs),
        "licensee_id": licensee_id
    }
