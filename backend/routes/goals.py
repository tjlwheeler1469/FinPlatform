"""
Goals Routes
Financial goal tracking and progress monitoring.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/goals", tags=["Goals"])

# In-memory goal storage
GOALS: Dict[str, Dict] = {}


class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    target_date: Optional[str] = None
    category: str = "savings"
    priority: str = "medium"
    household_id: Optional[str] = None
    notes: Optional[str] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


# Initialize sample goals
def init_sample_goals():
    if not GOALS:
        samples = [
            {
                "id": "goal_001",
                "name": "Emergency Fund",
                "target_amount": 50000,
                "current_amount": 35000,
                "target_date": "2025-06-30",
                "category": "savings",
                "priority": "high",
                "household_id": "hh_001",
                "status": "in_progress",
                "progress": 70,
                "created_at": "2024-01-15T10:00:00Z"
            },
            {
                "id": "goal_002",
                "name": "Investment Property Deposit",
                "target_amount": 200000,
                "current_amount": 85000,
                "target_date": "2026-12-31",
                "category": "property",
                "priority": "medium",
                "household_id": "hh_001",
                "status": "in_progress",
                "progress": 42.5,
                "created_at": "2024-03-01T10:00:00Z"
            },
            {
                "id": "goal_003",
                "name": "Kids Education Fund",
                "target_amount": 150000,
                "current_amount": 45000,
                "target_date": "2032-01-01",
                "category": "education",
                "priority": "medium",
                "household_id": "hh_001",
                "status": "in_progress",
                "progress": 30,
                "created_at": "2024-02-01T10:00:00Z"
            },
            {
                "id": "goal_004",
                "name": "Early Retirement Fund",
                "target_amount": 2000000,
                "current_amount": 580000,
                "target_date": "2040-01-01",
                "category": "retirement",
                "priority": "high",
                "household_id": "hh_001",
                "status": "in_progress",
                "progress": 29,
                "created_at": "2024-01-01T10:00:00Z"
            }
        ]
        for goal in samples:
            GOALS[goal["id"]] = goal

init_sample_goals()


@router.get("/")
async def list_goals(
    household_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None
):
    """List all goals with optional filtering."""
    goals = list(GOALS.values())
    
    if household_id:
        goals = [g for g in goals if g.get("household_id") == household_id]
    if category:
        goals = [g for g in goals if g.get("category") == category]
    if status:
        goals = [g for g in goals if g.get("status") == status]
    
    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    goals.sort(key=lambda x: priority_order.get(x.get("priority", "medium"), 1))
    
    return {
        "goals": goals,
        "total": len(goals),
        "summary": {
            "total_target": sum(g.get("target_amount", 0) for g in goals),
            "total_current": sum(g.get("current_amount", 0) for g in goals),
            "overall_progress": round(
                sum(g.get("current_amount", 0) for g in goals) / 
                sum(g.get("target_amount", 1) for g in goals) * 100, 1
            ) if goals else 0
        }
    }


@router.get("/{goal_id}")
async def get_goal(goal_id: str):
    """Get a specific goal."""
    goal = GOALS.get(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.post("/")
async def create_goal(request: GoalCreate):
    """Create a new financial goal."""
    goal_id = f"goal_{uuid.uuid4().hex[:8]}"
    
    progress = (request.current_amount / request.target_amount * 100) if request.target_amount > 0 else 0
    
    goal = {
        "id": goal_id,
        "name": request.name,
        "target_amount": request.target_amount,
        "current_amount": request.current_amount,
        "target_date": request.target_date,
        "category": request.category,
        "priority": request.priority,
        "household_id": request.household_id,
        "notes": request.notes,
        "status": "completed" if progress >= 100 else "in_progress",
        "progress": round(progress, 1),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    GOALS[goal_id] = goal
    return goal


@router.put("/{goal_id}")
async def update_goal(goal_id: str, request: GoalUpdate):
    """Update a goal."""
    if goal_id not in GOALS:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    updates = request.dict(exclude_none=True)
    GOALS[goal_id].update(updates)
    
    # Recalculate progress
    target = GOALS[goal_id].get("target_amount", 1)
    current = GOALS[goal_id].get("current_amount", 0)
    progress = (current / target * 100) if target > 0 else 0
    GOALS[goal_id]["progress"] = round(progress, 1)
    
    # Update status based on progress
    if progress >= 100:
        GOALS[goal_id]["status"] = "completed"
    
    GOALS[goal_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return GOALS[goal_id]


@router.delete("/{goal_id}")
async def delete_goal(goal_id: str):
    """Delete a goal."""
    if goal_id not in GOALS:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    del GOALS[goal_id]
    return {"success": True, "message": "Goal deleted"}


@router.post("/{goal_id}/contribute")
async def contribute_to_goal(goal_id: str, amount: float):
    """Add contribution to a goal."""
    if goal_id not in GOALS:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    GOALS[goal_id]["current_amount"] = GOALS[goal_id].get("current_amount", 0) + amount
    
    # Recalculate progress
    target = GOALS[goal_id].get("target_amount", 1)
    current = GOALS[goal_id].get("current_amount", 0)
    progress = (current / target * 100) if target > 0 else 0
    GOALS[goal_id]["progress"] = round(progress, 1)
    
    if progress >= 100:
        GOALS[goal_id]["status"] = "completed"
    
    GOALS[goal_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "goal": GOALS[goal_id],
        "contribution": amount,
        "new_progress": GOALS[goal_id]["progress"]
    }


@router.get("/categories/list")
async def get_goal_categories():
    """Get list of goal categories."""
    return {
        "categories": [
            {"id": "savings", "name": "Savings", "icon": "piggy-bank", "color": "#22c55e"},
            {"id": "property", "name": "Property", "icon": "home", "color": "#3b82f6"},
            {"id": "retirement", "name": "Retirement", "icon": "sunset", "color": "#f59e0b"},
            {"id": "education", "name": "Education", "icon": "graduation-cap", "color": "#8b5cf6"},
            {"id": "investment", "name": "Investment", "icon": "trending-up", "color": "#10b981"},
            {"id": "debt", "name": "Debt Payoff", "icon": "credit-card", "color": "#ef4444"},
            {"id": "travel", "name": "Travel", "icon": "plane", "color": "#06b6d4"},
            {"id": "other", "name": "Other", "icon": "target", "color": "#6b7280"}
        ]
    }


@router.get("/analytics/{household_id}")
async def get_goals_analytics(household_id: str):
    """Get goal analytics for a household."""
    household_goals = [g for g in GOALS.values() if g.get("household_id") == household_id]
    
    if not household_goals:
        return {
            "household_id": household_id,
            "summary": {"total_goals": 0},
            "by_category": [],
            "on_track": [],
            "at_risk": []
        }
    
    # Calculate summary
    total_target = sum(g.get("target_amount", 0) for g in household_goals)
    total_current = sum(g.get("current_amount", 0) for g in household_goals)
    
    # Group by category
    categories = {}
    for goal in household_goals:
        cat = goal.get("category", "other")
        if cat not in categories:
            categories[cat] = {"count": 0, "target": 0, "current": 0}
        categories[cat]["count"] += 1
        categories[cat]["target"] += goal.get("target_amount", 0)
        categories[cat]["current"] += goal.get("current_amount", 0)
    
    by_category = [
        {
            "category": cat,
            "count": data["count"],
            "target": data["target"],
            "current": data["current"],
            "progress": round(data["current"] / data["target"] * 100, 1) if data["target"] > 0 else 0
        }
        for cat, data in categories.items()
    ]
    
    # Determine on-track vs at-risk
    on_track = [g for g in household_goals if g.get("progress", 0) >= 50]
    at_risk = [g for g in household_goals if g.get("progress", 0) < 30]
    
    return {
        "household_id": household_id,
        "summary": {
            "total_goals": len(household_goals),
            "completed": len([g for g in household_goals if g.get("status") == "completed"]),
            "in_progress": len([g for g in household_goals if g.get("status") == "in_progress"]),
            "total_target": total_target,
            "total_current": total_current,
            "overall_progress": round(total_current / total_target * 100, 1) if total_target > 0 else 0
        },
        "by_category": by_category,
        "on_track": [{"id": g["id"], "name": g["name"], "progress": g.get("progress", 0)} for g in on_track],
        "at_risk": [{"id": g["id"], "name": g["name"], "progress": g.get("progress", 0)} for g in at_risk]
    }
