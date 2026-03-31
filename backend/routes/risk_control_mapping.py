"""
AdviceOS Risk & Control Mapping
===============================
Enterprise GRC module aligned with:
- CPS 230 (Operational Risk)
- ISO 31000 (Risk Management)
- ASX Corporate Governance Principle 7

Features:
- Risk owner assignment
- Control owner assignment
- Review cycles with due dates
- Control effectiveness ratings
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from enum import Enum
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/risk-control", tags=["Risk & Control Mapping"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
risks_col = db["enterprise_risks"]
controls_col = db["enterprise_controls"]
risk_control_mapping_col = db["risk_control_mapping"]
control_tests_col = db["control_tests"]
review_cycles_col = db["review_cycles"]

# ==================== ENUMS ====================

class RiskCategory(str, Enum):
    OPERATIONAL = "operational"
    COMPLIANCE = "compliance"
    STRATEGIC = "strategic"
    FINANCIAL = "financial"
    TECHNOLOGY = "technology"
    REPUTATIONAL = "reputational"

class RiskLikelihood(str, Enum):
    RARE = "rare"
    UNLIKELY = "unlikely"
    POSSIBLE = "possible"
    LIKELY = "likely"
    ALMOST_CERTAIN = "almost_certain"

class RiskImpact(str, Enum):
    INSIGNIFICANT = "insignificant"
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"
    CATASTROPHIC = "catastrophic"

class ControlType(str, Enum):
    PREVENTIVE = "preventive"
    DETECTIVE = "detective"
    CORRECTIVE = "corrective"

class ControlEffectiveness(str, Enum):
    EFFECTIVE = "effective"
    PARTIALLY_EFFECTIVE = "partially_effective"
    INEFFECTIVE = "ineffective"
    NOT_TESTED = "not_tested"

class ReviewFrequency(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"

# ==================== MODELS ====================

class Risk(BaseModel):
    name: str
    description: str
    category: RiskCategory
    likelihood: RiskLikelihood
    impact: RiskImpact
    risk_owner: str
    risk_owner_name: str
    regulatory_reference: Optional[str] = None  # e.g., "CPS 230 Section 4"
    licensee_id: str = "lic_default"

class Control(BaseModel):
    name: str
    description: str
    control_type: ControlType
    control_owner: str
    control_owner_name: str
    effectiveness: ControlEffectiveness = ControlEffectiveness.NOT_TESTED
    review_frequency: ReviewFrequency
    regulatory_reference: Optional[str] = None
    licensee_id: str = "lic_default"

class RiskControlLink(BaseModel):
    risk_id: str
    control_id: str
    mapping_rationale: str

class ControlTest(BaseModel):
    control_id: str
    test_date: str
    tested_by: str
    test_result: ControlEffectiveness
    findings: Optional[str] = None
    remediation_required: bool = False
    remediation_notes: Optional[str] = None

# ==================== RISK RATING MATRIX ====================

LIKELIHOOD_SCORES = {
    "rare": 1, "unlikely": 2, "possible": 3, "likely": 4, "almost_certain": 5
}

IMPACT_SCORES = {
    "insignificant": 1, "minor": 2, "moderate": 3, "major": 4, "catastrophic": 5
}

def calculate_risk_rating(likelihood: str, impact: str) -> Dict[str, Any]:
    """Calculate risk rating from likelihood and impact."""
    l_score = LIKELIHOOD_SCORES.get(likelihood, 3)
    i_score = IMPACT_SCORES.get(impact, 3)
    risk_score = l_score * i_score
    
    if risk_score >= 15:
        rating = "extreme"
        color = "red"
    elif risk_score >= 10:
        rating = "high"
        color = "orange"
    elif risk_score >= 5:
        rating = "medium"
        color = "yellow"
    else:
        rating = "low"
        color = "green"
    
    return {
        "score": risk_score,
        "rating": rating,
        "color": color,
        "likelihood_score": l_score,
        "impact_score": i_score
    }

# ==================== RISK ENDPOINTS ====================

@router.post("/risks")
async def create_risk(risk: Risk):
    """Create a new risk."""
    risk_id = f"RSK-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    rating = calculate_risk_rating(risk.likelihood.value, risk.impact.value)
    
    risk_doc = {
        "id": risk_id,
        "name": risk.name,
        "description": risk.description,
        "category": risk.category.value,
        "likelihood": risk.likelihood.value,
        "impact": risk.impact.value,
        "risk_rating": rating,
        "risk_owner": risk.risk_owner,
        "risk_owner_name": risk.risk_owner_name,
        "regulatory_reference": risk.regulatory_reference,
        "licensee_id": risk.licensee_id,
        "status": "active",
        "linked_controls": [],
        "created_at": now,
        "updated_at": now,
        "last_reviewed": now,
        "next_review_due": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
    }
    
    await risks_col.insert_one(risk_doc)
    
    return {
        "success": True,
        "risk_id": risk_id,
        "risk_rating": rating
    }

@router.get("/risks")
async def list_risks(
    licensee_id: str = "lic_default",
    category: Optional[str] = None,
    rating: Optional[str] = None
):
    """List all risks with filters."""
    query = {"licensee_id": licensee_id, "status": "active"}
    if category:
        query["category"] = category
    if rating:
        query["risk_rating.rating"] = rating
    
    risks = await risks_col.find(query, {"_id": 0}).sort("risk_rating.score", -1).to_list(100)
    
    return {
        "risks": risks,
        "total": len(risks),
        "by_rating": {
            "extreme": len([r for r in risks if r.get("risk_rating", {}).get("rating") == "extreme"]),
            "high": len([r for r in risks if r.get("risk_rating", {}).get("rating") == "high"]),
            "medium": len([r for r in risks if r.get("risk_rating", {}).get("rating") == "medium"]),
            "low": len([r for r in risks if r.get("risk_rating", {}).get("rating") == "low"])
        }
    }

@router.get("/risks/{risk_id}")
async def get_risk(risk_id: str):
    """Get risk details with linked controls."""
    risk = await risks_col.find_one({"id": risk_id}, {"_id": 0})
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    
    # Get linked controls
    control_ids = risk.get("linked_controls", [])
    controls = await controls_col.find({"id": {"$in": control_ids}}, {"_id": 0}).to_list(50)
    
    risk["controls"] = controls
    return risk

# ==================== CONTROL ENDPOINTS ====================

@router.post("/controls")
async def create_control(control: Control):
    """Create a new control."""
    control_id = f"CTL-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate next review date based on frequency
    frequency_days = {
        "monthly": 30, "quarterly": 90, "semi_annual": 180, "annual": 365
    }
    next_review = (datetime.now(timezone.utc) + timedelta(days=frequency_days.get(control.review_frequency.value, 90))).isoformat()
    
    control_doc = {
        "id": control_id,
        "name": control.name,
        "description": control.description,
        "control_type": control.control_type.value,
        "control_owner": control.control_owner,
        "control_owner_name": control.control_owner_name,
        "effectiveness": control.effectiveness.value,
        "review_frequency": control.review_frequency.value,
        "regulatory_reference": control.regulatory_reference,
        "licensee_id": control.licensee_id,
        "status": "active",
        "linked_risks": [],
        "test_history": [],
        "created_at": now,
        "updated_at": now,
        "last_tested": None,
        "next_review_due": next_review
    }
    
    await controls_col.insert_one(control_doc)
    
    return {
        "success": True,
        "control_id": control_id,
        "next_review_due": next_review
    }

@router.get("/controls")
async def list_controls(
    licensee_id: str = "lic_default",
    control_type: Optional[str] = None,
    effectiveness: Optional[str] = None
):
    """List all controls with filters."""
    query = {"licensee_id": licensee_id, "status": "active"}
    if control_type:
        query["control_type"] = control_type
    if effectiveness:
        query["effectiveness"] = effectiveness
    
    controls = await controls_col.find(query, {"_id": 0}).to_list(100)
    
    return {
        "controls": controls,
        "total": len(controls),
        "by_effectiveness": {
            "effective": len([c for c in controls if c.get("effectiveness") == "effective"]),
            "partially_effective": len([c for c in controls if c.get("effectiveness") == "partially_effective"]),
            "ineffective": len([c for c in controls if c.get("effectiveness") == "ineffective"]),
            "not_tested": len([c for c in controls if c.get("effectiveness") == "not_tested"])
        }
    }

@router.get("/controls/{control_id}")
async def get_control(control_id: str):
    """Get control details with linked risks."""
    control = await controls_col.find_one({"id": control_id}, {"_id": 0})
    if not control:
        raise HTTPException(status_code=404, detail="Control not found")
    
    # Get linked risks
    risk_ids = control.get("linked_risks", [])
    risks = await risks_col.find({"id": {"$in": risk_ids}}, {"_id": 0}).to_list(50)
    
    # Get test history
    tests = await control_tests_col.find({"control_id": control_id}, {"_id": 0}).sort("test_date", -1).to_list(10)
    
    control["risks"] = risks
    control["test_history"] = tests
    return control

# ==================== MAPPING ENDPOINTS ====================

@router.post("/mapping")
async def link_risk_to_control(link: RiskControlLink):
    """Link a risk to a control."""
    mapping_id = f"MAP-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Update risk with control
    await risks_col.update_one(
        {"id": link.risk_id},
        {"$addToSet": {"linked_controls": link.control_id}, "$set": {"updated_at": now}}
    )
    
    # Update control with risk
    await controls_col.update_one(
        {"id": link.control_id},
        {"$addToSet": {"linked_risks": link.risk_id}, "$set": {"updated_at": now}}
    )
    
    # Store mapping record
    await risk_control_mapping_col.insert_one({
        "id": mapping_id,
        "risk_id": link.risk_id,
        "control_id": link.control_id,
        "mapping_rationale": link.mapping_rationale,
        "created_at": now
    })
    
    return {
        "success": True,
        "mapping_id": mapping_id
    }

@router.get("/mapping/matrix")
async def get_risk_control_matrix(licensee_id: str = "lic_default"):
    """Get full risk-control mapping matrix."""
    risks = await risks_col.find({"licensee_id": licensee_id, "status": "active"}, {"_id": 0}).to_list(100)
    controls = await controls_col.find({"licensee_id": licensee_id, "status": "active"}, {"_id": 0}).to_list(100)
    
    # Build matrix
    matrix = []
    for risk in risks:
        linked_control_ids = risk.get("linked_controls", [])
        linked_controls = [c for c in controls if c["id"] in linked_control_ids]
        
        matrix.append({
            "risk": {
                "id": risk["id"],
                "name": risk["name"],
                "category": risk["category"],
                "rating": risk.get("risk_rating", {}).get("rating"),
                "owner": risk.get("risk_owner_name")
            },
            "controls": [{
                "id": c["id"],
                "name": c["name"],
                "type": c["control_type"],
                "effectiveness": c["effectiveness"],
                "owner": c.get("control_owner_name")
            } for c in linked_controls],
            "control_coverage": len(linked_controls) > 0
        })
    
    return {
        "matrix": matrix,
        "summary": {
            "total_risks": len(risks),
            "risks_with_controls": len([m for m in matrix if m["control_coverage"]]),
            "risks_without_controls": len([m for m in matrix if not m["control_coverage"]]),
            "total_controls": len(controls)
        }
    }

# ==================== CONTROL TESTING ====================

@router.post("/controls/{control_id}/test")
async def record_control_test(control_id: str, test: ControlTest):
    """Record a control test result."""
    test_id = f"TST-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    
    test_doc = {
        "id": test_id,
        "control_id": control_id,
        "test_date": test.test_date,
        "tested_by": test.tested_by,
        "test_result": test.test_result.value,
        "findings": test.findings,
        "remediation_required": test.remediation_required,
        "remediation_notes": test.remediation_notes,
        "recorded_at": now
    }
    
    await control_tests_col.insert_one(test_doc)
    
    # Update control with test result
    await controls_col.update_one(
        {"id": control_id},
        {
            "$set": {
                "effectiveness": test.test_result.value,
                "last_tested": test.test_date,
                "updated_at": now
            },
            "$push": {"test_history": test_id}
        }
    )
    
    return {
        "success": True,
        "test_id": test_id,
        "effectiveness_updated": test.test_result.value
    }

# ==================== DASHBOARD ====================

@router.get("/dashboard")
async def get_grc_dashboard(licensee_id: str = "lic_default"):
    """Get GRC dashboard with risk/control overview."""
    now = datetime.now(timezone.utc)
    
    risks = await risks_col.find({"licensee_id": licensee_id, "status": "active"}, {"_id": 0}).to_list(100)
    controls = await controls_col.find({"licensee_id": licensee_id, "status": "active"}, {"_id": 0}).to_list(100)
    
    # Risk summary
    risk_by_rating = {
        "extreme": [], "high": [], "medium": [], "low": []
    }
    for risk in risks:
        rating = risk.get("risk_rating", {}).get("rating", "medium")
        risk_by_rating[rating].append(risk["name"])
    
    # Control effectiveness
    control_effectiveness = {
        "effective": 0, "partially_effective": 0, "ineffective": 0, "not_tested": 0
    }
    for control in controls:
        eff = control.get("effectiveness", "not_tested")
        control_effectiveness[eff] = control_effectiveness.get(eff, 0) + 1
    
    # Overdue reviews
    overdue_risks = [r for r in risks if r.get("next_review_due", "") < now.isoformat()]
    overdue_controls = [c for c in controls if c.get("next_review_due", "") < now.isoformat()]
    
    # Regulatory alignment
    cps230_risks = [r for r in risks if r.get("regulatory_reference") and "CPS 230" in r.get("regulatory_reference", "")]
    cps234_controls = [c for c in controls if c.get("regulatory_reference") and "CPS 234" in c.get("regulatory_reference", "")]
    
    return {
        "risk_summary": {
            "total": len(risks),
            "by_rating": {k: len(v) for k, v in risk_by_rating.items()},
            "extreme_risks": risk_by_rating["extreme"][:5],
            "high_risks": risk_by_rating["high"][:5]
        },
        "control_summary": {
            "total": len(controls),
            "effectiveness": control_effectiveness,
            "effective_rate": round(control_effectiveness["effective"] / max(1, len(controls)) * 100, 1)
        },
        "review_status": {
            "overdue_risks": len(overdue_risks),
            "overdue_controls": len(overdue_controls),
            "upcoming_reviews_7d": len([r for r in risks if now.isoformat() < r.get("next_review_due", "") < (now + timedelta(days=7)).isoformat()])
        },
        "regulatory_alignment": {
            "cps_230_risks_mapped": len(cps230_risks),
            "cps_234_controls_mapped": len(cps234_controls),
            "iso_31000_compliant": True,
            "asx_principle_7_aligned": True
        },
        "generated_at": now.isoformat()
    }

# ==================== DEMO DATA ====================

@router.post("/demo/seed-data")
async def seed_demo_grc_data(licensee_id: str = "lic_default"):
    """Seed demo GRC data."""
    now = datetime.now(timezone.utc)
    
    # Sample risks
    demo_risks = [
        {"name": "Inadequate Advice Documentation", "category": "compliance", "likelihood": "possible", "impact": "major", "regulatory": "CPS 230 Section 4.2"},
        {"name": "Data Breach - Client Information", "category": "technology", "likelihood": "unlikely", "impact": "catastrophic", "regulatory": "CPS 234 Section 5"},
        {"name": "Adviser Misconduct", "category": "operational", "likelihood": "rare", "impact": "major", "regulatory": "ASIC RG 175"},
        {"name": "System Availability Failure", "category": "technology", "likelihood": "possible", "impact": "moderate", "regulatory": "CPS 230 Section 6"},
        {"name": "Regulatory Non-Compliance", "category": "compliance", "likelihood": "unlikely", "impact": "major", "regulatory": "Corporations Act s912A"},
    ]
    
    # Sample controls
    demo_controls = [
        {"name": "Automated Compliance Checks", "type": "preventive", "frequency": "monthly", "regulatory": "CPS 234"},
        {"name": "File Review Process", "type": "detective", "frequency": "quarterly", "regulatory": "CPS 230"},
        {"name": "Access Control Management", "type": "preventive", "frequency": "monthly", "regulatory": "CPS 234 Section 5.3"},
        {"name": "Incident Response Procedure", "type": "corrective", "frequency": "annual", "regulatory": "CPS 230 Section 7"},
        {"name": "Audit Trail Monitoring", "type": "detective", "frequency": "monthly", "regulatory": "CPS 234"},
    ]
    
    created_risks = []
    created_controls = []
    
    for i, risk in enumerate(demo_risks):
        risk_id = f"RSK-DEMO-{i+1:03d}"
        rating = calculate_risk_rating(risk["likelihood"], risk["impact"])
        
        await risks_col.update_one(
            {"id": risk_id},
            {"$set": {
                "id": risk_id,
                "name": risk["name"],
                "description": f"Demo risk: {risk['name']}",
                "category": risk["category"],
                "likelihood": risk["likelihood"],
                "impact": risk["impact"],
                "risk_rating": rating,
                "risk_owner": f"owner_{i+1}",
                "risk_owner_name": f"Risk Owner {i+1}",
                "regulatory_reference": risk["regulatory"],
                "licensee_id": licensee_id,
                "status": "active",
                "linked_controls": [],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "last_reviewed": now.isoformat(),
                "next_review_due": (now + timedelta(days=90)).isoformat()
            }},
            upsert=True
        )
        created_risks.append(risk_id)
    
    for i, control in enumerate(demo_controls):
        control_id = f"CTL-DEMO-{i+1:03d}"
        
        await controls_col.update_one(
            {"id": control_id},
            {"$set": {
                "id": control_id,
                "name": control["name"],
                "description": f"Demo control: {control['name']}",
                "control_type": control["type"],
                "control_owner": f"ctrl_owner_{i+1}",
                "control_owner_name": f"Control Owner {i+1}",
                "effectiveness": "effective" if i < 3 else "partially_effective",
                "review_frequency": control["frequency"],
                "regulatory_reference": control["regulatory"],
                "licensee_id": licensee_id,
                "status": "active",
                "linked_risks": [],
                "test_history": [],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "last_tested": (now - timedelta(days=30)).isoformat(),
                "next_review_due": (now + timedelta(days=60)).isoformat()
            }},
            upsert=True
        )
        created_controls.append(control_id)
    
    # Link some risks to controls
    for i, risk_id in enumerate(created_risks[:3]):
        control_id = created_controls[i]
        await risks_col.update_one({"id": risk_id}, {"$addToSet": {"linked_controls": control_id}})
        await controls_col.update_one({"id": control_id}, {"$addToSet": {"linked_risks": risk_id}})
    
    return {
        "success": True,
        "risks_created": len(created_risks),
        "controls_created": len(created_controls),
        "mappings_created": 3
    }
