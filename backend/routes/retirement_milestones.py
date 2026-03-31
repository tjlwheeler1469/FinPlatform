"""
Client Retirement Milestones Module
Track key milestones and targets for ideal client retirement
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid
import os

router = APIRouter(prefix="/milestones", tags=["Retirement Milestones"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "adviceos")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ============== ENUMS ==============

class MilestoneCategory(str, Enum):
    ACCUMULATION = "accumulation"
    CONTRIBUTION = "contribution"
    DEBT_REDUCTION = "debt_reduction"
    INSURANCE = "insurance"
    ESTATE = "estate"
    PENSION = "pension"
    AGE_PENSION = "age_pension"
    TRANSITION = "transition"

class MilestoneStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class MilestonePriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

# ============== STANDARD MILESTONES ==============

STANDARD_MILESTONES = {
    "accumulation": [
        {
            "name": "Reach Super Balance Target",
            "description": "Achieve target superannuation balance for retirement",
            "metric": "super_balance",
            "default_target": 1000000
        },
        {
            "name": "Max Concessional Contributions",
            "description": "Maximize tax-effective concessional contributions annually",
            "metric": "concessional_contributions",
            "default_target": 30000
        },
        {
            "name": "Build Emergency Fund",
            "description": "Maintain 6 months of expenses in accessible cash",
            "metric": "emergency_fund_months",
            "default_target": 6
        }
    ],
    "debt_reduction": [
        {
            "name": "Pay Off Home Mortgage",
            "description": "Clear primary residence mortgage before retirement",
            "metric": "home_mortgage_balance",
            "default_target": 0
        },
        {
            "name": "Eliminate High-Interest Debt",
            "description": "Clear credit cards and personal loans",
            "metric": "high_interest_debt",
            "default_target": 0
        }
    ],
    "insurance": [
        {
            "name": "Adequate Life Insurance",
            "description": "Ensure life cover meets family needs",
            "metric": "life_cover_multiple",
            "default_target": 10  # x annual income
        },
        {
            "name": "Income Protection",
            "description": "Have income protection covering 75% of income",
            "metric": "ip_cover_percentage",
            "default_target": 75
        },
        {
            "name": "TPD Insurance Review",
            "description": "Review Total & Permanent Disability cover",
            "metric": "tpd_review_done",
            "default_target": 1
        }
    ],
    "pension": [
        {
            "name": "Commence Account-Based Pension",
            "description": "Start pension phase at retirement",
            "metric": "pension_commenced",
            "default_target": 1
        },
        {
            "name": "Optimize Pension Drawdown",
            "description": "Set optimal drawdown rate for longevity",
            "metric": "drawdown_optimized",
            "default_target": 1
        },
        {
            "name": "Transfer Balance Cap Check",
            "description": "Ensure within $1.9M transfer balance cap",
            "metric": "tbc_remaining",
            "default_target": 1900000
        }
    ],
    "estate": [
        {
            "name": "Update Will",
            "description": "Ensure will is current and reflects wishes",
            "metric": "will_updated",
            "default_target": 1
        },
        {
            "name": "Enduring Power of Attorney",
            "description": "Have valid EPA in place",
            "metric": "epa_in_place",
            "default_target": 1
        },
        {
            "name": "Binding Death Nomination",
            "description": "Update super fund death benefit nomination",
            "metric": "bdn_current",
            "default_target": 1
        }
    ],
    "transition": [
        {
            "name": "Transition to Retirement Strategy",
            "description": "Implement TTR strategy if appropriate",
            "metric": "ttr_strategy",
            "default_target": 1
        },
        {
            "name": "Centrelink Assessment",
            "description": "Complete Age Pension eligibility assessment",
            "metric": "centrelink_assessed",
            "default_target": 1
        }
    ]
}

# ============== MODELS ==============

class Milestone(BaseModel):
    milestone_id: Optional[str] = None
    client_id: str
    name: str
    description: Optional[str] = None
    category: MilestoneCategory
    status: MilestoneStatus = MilestoneStatus.NOT_STARTED
    priority: MilestonePriority = MilestonePriority.MEDIUM
    target_date: Optional[str] = None  # ISO date string
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    metric: Optional[str] = None
    progress_percentage: Optional[float] = None
    notes: Optional[str] = None
    adviser_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class MilestoneUpdate(BaseModel):
    status: Optional[MilestoneStatus] = None
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    target_date: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[MilestonePriority] = None

class ClientMilestonePlan(BaseModel):
    client_id: str
    client_name: str
    retirement_age: int = 67
    current_age: int
    adviser_id: Optional[str] = None
    use_standard_milestones: bool = True
    custom_milestones: Optional[List[Milestone]] = None

# ============== HELPER FUNCTIONS ==============

def calculate_progress(current: float, target: float, invert: bool = False) -> float:
    """Calculate progress percentage. Invert for debt reduction targets."""
    if target == 0:
        return 100.0 if current == 0 else 0.0
    
    if invert:
        # For debt reduction: 100% = debt is 0, 0% = debt equals original
        progress = ((target - current) / target) * 100 if current <= target else 0
    else:
        progress = (current / target) * 100
    
    return min(100.0, max(0.0, progress))

def determine_status(progress: float, target_date: Optional[str]) -> MilestoneStatus:
    """Determine milestone status based on progress and date."""
    if progress >= 100:
        return MilestoneStatus.COMPLETED
    
    if target_date:
        target = datetime.fromisoformat(target_date.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        
        if now > target:
            return MilestoneStatus.OVERDUE
        
        # Calculate expected progress based on time
        # If less than expected, it's at risk
        days_remaining = (target - now).days
        if days_remaining < 30 and progress < 80:
            return MilestoneStatus.AT_RISK
    
    if progress > 0:
        return MilestoneStatus.ON_TRACK if progress >= 50 else MilestoneStatus.IN_PROGRESS
    
    return MilestoneStatus.NOT_STARTED

# ============== ENDPOINTS ==============

@router.get("/templates")
async def get_milestone_templates():
    """Get standard milestone templates by category"""
    return {
        "templates": STANDARD_MILESTONES,
        "categories": [c.value for c in MilestoneCategory],
        "priorities": [p.value for p in MilestonePriority],
        "statuses": [s.value for s in MilestoneStatus]
    }

@router.post("/client/{client_id}/initialize")
async def initialize_client_milestones(client_id: str, plan: ClientMilestonePlan):
    """Initialize milestones for a client based on their retirement plan"""
    db = await get_db()
    
    milestones = []
    years_to_retirement = plan.retirement_age - plan.current_age
    retirement_date = datetime(
        datetime.now().year + years_to_retirement, 
        7, 1  # Default to July 1
    ).isoformat()
    
    if plan.use_standard_milestones:
        for category, templates in STANDARD_MILESTONES.items():
            for template in templates:
                milestone = {
                    "milestone_id": f"MS-{uuid.uuid4().hex[:8].upper()}",
                    "client_id": client_id,
                    "client_name": plan.client_name,
                    "name": template["name"],
                    "description": template["description"],
                    "category": category,
                    "metric": template["metric"],
                    "target_value": template["default_target"],
                    "current_value": 0,
                    "progress_percentage": 0,
                    "status": MilestoneStatus.NOT_STARTED.value,
                    "priority": MilestonePriority.MEDIUM.value,
                    "target_date": retirement_date if category in ["accumulation", "debt_reduction", "pension"] else None,
                    "adviser_id": plan.adviser_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                milestones.append(milestone)
    
    # Add custom milestones
    if plan.custom_milestones:
        for custom in plan.custom_milestones:
            custom_dict = custom.dict()
            custom_dict["milestone_id"] = f"MS-{uuid.uuid4().hex[:8].upper()}"
            custom_dict["client_id"] = client_id
            custom_dict["created_at"] = datetime.now(timezone.utc).isoformat()
            custom_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
            milestones.append(custom_dict)
    
    # Save to database
    if milestones:
        await db.client_milestones.delete_many({"client_id": client_id})  # Clear existing
        await db.client_milestones.insert_many(milestones)
        # Remove MongoDB _id from response
        for m in milestones:
            if "_id" in m:
                del m["_id"]
    
    return {
        "client_id": client_id,
        "milestones_created": len(milestones),
        "retirement_target_date": retirement_date,
        "years_to_retirement": years_to_retirement,
        "milestones": milestones
    }

@router.get("/client/{client_id}")
async def get_client_milestones(client_id: str, category: Optional[str] = None):
    """Get all milestones for a client"""
    db = await get_db()
    
    query = {"client_id": client_id}
    if category:
        query["category"] = category
    
    milestones = await db.client_milestones.find(
        query,
        {"_id": 0}
    ).sort([("priority", 1), ("target_date", 1)]).to_list(length=100)
    
    # Calculate summary stats
    total = len(milestones)
    completed = sum(1 for m in milestones if m.get("status") == "completed")
    at_risk = sum(1 for m in milestones if m.get("status") in ["at_risk", "overdue"])
    on_track = sum(1 for m in milestones if m.get("status") == "on_track")
    
    return {
        "client_id": client_id,
        "milestones": milestones,
        "summary": {
            "total": total,
            "completed": completed,
            "on_track": on_track,
            "at_risk": at_risk,
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0
        }
    }

@router.put("/client/{client_id}/{milestone_id}")
async def update_milestone(client_id: str, milestone_id: str, update: MilestoneUpdate):
    """Update a specific milestone"""
    db = await get_db()
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Recalculate progress if values changed
    if "current_value" in update_data or "target_value" in update_data:
        milestone = await db.client_milestones.find_one(
            {"client_id": client_id, "milestone_id": milestone_id},
            {"_id": 0}
        )
        if milestone:
            current = update_data.get("current_value", milestone.get("current_value", 0))
            target = update_data.get("target_value", milestone.get("target_value", 0))
            is_debt = "debt" in milestone.get("category", "") or "mortgage" in milestone.get("metric", "")
            
            progress = calculate_progress(current, target, invert=is_debt)
            update_data["progress_percentage"] = round(progress, 1)
            
            # Auto-update status based on progress
            target_date = update_data.get("target_date", milestone.get("target_date"))
            update_data["status"] = determine_status(progress, target_date).value
    
    result = await db.client_milestones.update_one(
        {"client_id": client_id, "milestone_id": milestone_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    # Return updated milestone
    updated = await db.client_milestones.find_one(
        {"client_id": client_id, "milestone_id": milestone_id},
        {"_id": 0}
    )
    
    return updated

@router.post("/client/{client_id}/milestone")
async def add_milestone(client_id: str, milestone: Milestone):
    """Add a new milestone for a client"""
    db = await get_db()
    
    milestone_dict = milestone.dict()
    milestone_dict["milestone_id"] = f"MS-{uuid.uuid4().hex[:8].upper()}"
    milestone_dict["client_id"] = client_id
    milestone_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    milestone_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.client_milestones.insert_one(milestone_dict)
    if "_id" in milestone_dict:
        del milestone_dict["_id"]
    
    return milestone_dict

@router.delete("/client/{client_id}/{milestone_id}")
async def delete_milestone(client_id: str, milestone_id: str):
    """Delete a milestone"""
    db = await get_db()
    
    result = await db.client_milestones.delete_one(
        {"client_id": client_id, "milestone_id": milestone_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Milestone not found")
    
    return {"deleted": True, "milestone_id": milestone_id}

@router.get("/adviser/{adviser_id}/summary")
async def get_adviser_milestone_summary(adviser_id: str):
    """Get milestone summary across all clients for an adviser"""
    db = await get_db()
    
    pipeline = [
        {"$match": {"adviser_id": adviser_id}},
        {"$group": {
            "_id": "$client_id",
            "client_name": {"$first": "$client_name"},
            "total": {"$sum": 1},
            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}},
            "at_risk": {"$sum": {"$cond": [{"$in": ["$status", ["at_risk", "overdue"]]}, 1, 0]}},
            "on_track": {"$sum": {"$cond": [{"$eq": ["$status", "on_track"]}, 1, 0]}}
        }},
        {"$project": {
            "_id": 0,
            "client_id": "$_id",
            "client_name": 1,
            "total": 1,
            "completed": 1,
            "at_risk": 1,
            "on_track": 1,
            "completion_rate": {
                "$cond": [
                    {"$eq": ["$total", 0]},
                    0,
                    {"$multiply": [{"$divide": ["$completed", "$total"]}, 100]}
                ]
            }
        }},
        {"$sort": {"at_risk": -1, "completion_rate": 1}}
    ]
    
    clients = await db.client_milestones.aggregate(pipeline).to_list(length=100)
    
    # Overall summary
    total_milestones = sum(c.get("total", 0) for c in clients)
    total_completed = sum(c.get("completed", 0) for c in clients)
    total_at_risk = sum(c.get("at_risk", 0) for c in clients)
    
    return {
        "adviser_id": adviser_id,
        "clients": clients,
        "overall": {
            "total_clients": len(clients),
            "total_milestones": total_milestones,
            "total_completed": total_completed,
            "total_at_risk": total_at_risk,
            "overall_completion_rate": round(total_completed / total_milestones * 100, 1) if total_milestones > 0 else 0
        }
    }

@router.get("/client/{client_id}/retirement-readiness")
async def get_retirement_readiness(client_id: str):
    """Calculate overall retirement readiness score based on milestones"""
    db = await get_db()
    
    milestones = await db.client_milestones.find(
        {"client_id": client_id},
        {"_id": 0}
    ).to_list(length=100)
    
    if not milestones:
        return {"client_id": client_id, "message": "No milestones found"}
    
    # Weight by priority
    priority_weights = {
        "critical": 3.0,
        "high": 2.0,
        "medium": 1.5,
        "low": 1.0
    }
    
    total_weight = 0
    weighted_progress = 0
    
    category_scores = {}
    
    for m in milestones:
        weight = priority_weights.get(m.get("priority", "medium"), 1.0)
        progress = m.get("progress_percentage", 0)
        
        total_weight += weight
        weighted_progress += weight * progress
        
        # Track by category
        cat = m.get("category", "other")
        if cat not in category_scores:
            category_scores[cat] = {"total_weight": 0, "weighted_progress": 0, "count": 0}
        category_scores[cat]["total_weight"] += weight
        category_scores[cat]["weighted_progress"] += weight * progress
        category_scores[cat]["count"] += 1
    
    overall_score = round(weighted_progress / total_weight, 1) if total_weight > 0 else 0
    
    # Category breakdown
    categories = {}
    for cat, data in category_scores.items():
        categories[cat] = {
            "score": round(data["weighted_progress"] / data["total_weight"], 1) if data["total_weight"] > 0 else 0,
            "milestone_count": data["count"]
        }
    
    # Determine readiness level
    if overall_score >= 80:
        readiness_level = "excellent"
        readiness_message = "On track for ideal retirement"
    elif overall_score >= 60:
        readiness_level = "good"
        readiness_message = "Making good progress, some areas need attention"
    elif overall_score >= 40:
        readiness_level = "fair"
        readiness_message = "Several milestones need attention"
    else:
        readiness_level = "needs_attention"
        readiness_message = "Significant work needed to meet retirement goals"
    
    return {
        "client_id": client_id,
        "overall_readiness_score": overall_score,
        "readiness_level": readiness_level,
        "readiness_message": readiness_message,
        "category_scores": categories,
        "total_milestones": len(milestones),
        "critical_milestones_at_risk": sum(1 for m in milestones if m.get("priority") == "critical" and m.get("status") in ["at_risk", "overdue"])
    }
