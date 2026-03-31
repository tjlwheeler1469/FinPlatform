"""
Life Timeline Routes
Life event planning, milestones, and financial impact analysis.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, Any
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/timeline", tags=["Life Timeline"])

# In-memory storage
LIFE_EVENTS: Dict[str, Dict] = {}
MILESTONES: Dict[str, Dict] = {}


class LifeEventCreate(BaseModel):
    name: str
    event_type: str
    date: str
    estimated_cost: float = 0
    annual_impact: float = 0
    household_id: Optional[str] = None
    notes: Optional[str] = None
    category: str = "general"


class MilestoneCreate(BaseModel):
    name: str
    target_date: str
    household_id: Optional[str] = None
    financial_goal: float = 0
    category: str = "general"


# Initialize sample life events
def init_sample_events():
    if not LIFE_EVENTS:
        samples = [
            {
                "id": "event_001",
                "name": "First Child",
                "event_type": "family",
                "date": "2015-06-15",
                "category": "family",
                "estimated_cost": 15000,
                "annual_impact": -25000,
                "household_id": "hh_001",
                "status": "completed",
                "notes": "Additional childcare and education expenses"
            },
            {
                "id": "event_002",
                "name": "Home Purchase",
                "event_type": "property",
                "date": "2018-03-20",
                "category": "property",
                "estimated_cost": 950000,
                "annual_impact": -45000,
                "household_id": "hh_001",
                "status": "completed",
                "notes": "Primary residence in Sydney"
            },
            {
                "id": "event_003",
                "name": "Second Child",
                "event_type": "family",
                "date": "2020-09-10",
                "category": "family",
                "estimated_cost": 15000,
                "annual_impact": -20000,
                "household_id": "hh_001",
                "status": "completed"
            },
            {
                "id": "event_004",
                "name": "Child 1 High School",
                "event_type": "education",
                "date": "2027-02-01",
                "category": "education",
                "estimated_cost": 0,
                "annual_impact": -25000,
                "household_id": "hh_001",
                "status": "planned",
                "notes": "Private school fees"
            },
            {
                "id": "event_005",
                "name": "Child 1 University",
                "event_type": "education",
                "date": "2033-03-01",
                "category": "education",
                "estimated_cost": 0,
                "annual_impact": -35000,
                "household_id": "hh_001",
                "status": "planned",
                "notes": "Tertiary education support"
            },
            {
                "id": "event_006",
                "name": "Investment Property",
                "event_type": "property",
                "date": "2027-07-01",
                "category": "property",
                "estimated_cost": 850000,
                "annual_impact": 15000,
                "household_id": "hh_001",
                "status": "planned",
                "notes": "Rental investment property"
            },
            {
                "id": "event_007",
                "name": "Early Retirement",
                "event_type": "retirement",
                "date": "2040-01-01",
                "category": "retirement",
                "estimated_cost": 0,
                "annual_impact": -150000,
                "household_id": "hh_001",
                "status": "planned",
                "notes": "Target retirement at 60"
            },
            {
                "id": "event_008",
                "name": "World Travel Year",
                "event_type": "lifestyle",
                "date": "2041-06-01",
                "category": "lifestyle",
                "estimated_cost": 80000,
                "annual_impact": 0,
                "household_id": "hh_001",
                "status": "planned",
                "notes": "Extended travel after retirement"
            }
        ]
        for event in samples:
            LIFE_EVENTS[event["id"]] = event

init_sample_events()


@router.get("/events")
async def get_life_events(
    household_id: Optional[str] = None,
    status: Optional[str] = None,
    event_type: Optional[str] = None
):
    """Get all life events with optional filtering."""
    events = list(LIFE_EVENTS.values())
    
    if household_id:
        events = [e for e in events if e.get("household_id") == household_id]
    if status:
        events = [e for e in events if e.get("status") == status]
    if event_type:
        events = [e for e in events if e.get("event_type") == event_type]
    
    # Sort by date
    events.sort(key=lambda x: x.get("date", ""))
    
    # Calculate financial summary
    total_cost = sum(e.get("estimated_cost", 0) for e in events)
    annual_impact = sum(e.get("annual_impact", 0) for e in events)
    
    return {
        "events": events,
        "total": len(events),
        "financial_summary": {
            "total_one_time_costs": total_cost,
            "net_annual_impact": annual_impact
        }
    }


@router.get("/events/{event_id}")
async def get_life_event(event_id: str):
    """Get a specific life event."""
    event = LIFE_EVENTS.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/events")
async def create_life_event(request: LifeEventCreate):
    """Create a new life event."""
    event_id = f"event_{uuid.uuid4().hex[:8]}"
    
    event = {
        "id": event_id,
        "name": request.name,
        "event_type": request.event_type,
        "date": request.date,
        "category": request.category,
        "estimated_cost": request.estimated_cost,
        "annual_impact": request.annual_impact,
        "household_id": request.household_id,
        "notes": request.notes,
        "status": "planned",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    LIFE_EVENTS[event_id] = event
    return event


@router.put("/events/{event_id}")
async def update_life_event(event_id: str, updates: Dict[str, Any]):
    """Update a life event."""
    if event_id not in LIFE_EVENTS:
        raise HTTPException(status_code=404, detail="Event not found")
    
    LIFE_EVENTS[event_id].update(updates)
    LIFE_EVENTS[event_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return LIFE_EVENTS[event_id]


@router.delete("/events/{event_id}")
async def delete_life_event(event_id: str):
    """Delete a life event."""
    if event_id not in LIFE_EVENTS:
        raise HTTPException(status_code=404, detail="Event not found")
    
    del LIFE_EVENTS[event_id]
    return {"success": True}


@router.get("/categories")
async def get_event_categories():
    """Get available event categories."""
    return {
        "categories": [
            {"id": "family", "name": "Family", "icon": "users", "color": "#8b5cf6"},
            {"id": "property", "name": "Property", "icon": "home", "color": "#3b82f6"},
            {"id": "education", "name": "Education", "icon": "graduation-cap", "color": "#f59e0b"},
            {"id": "career", "name": "Career", "icon": "briefcase", "color": "#10b981"},
            {"id": "retirement", "name": "Retirement", "icon": "sunset", "color": "#ef4444"},
            {"id": "lifestyle", "name": "Lifestyle", "icon": "sparkles", "color": "#ec4899"},
            {"id": "health", "name": "Health", "icon": "heart", "color": "#f43f5e"},
            {"id": "general", "name": "General", "icon": "calendar", "color": "#6b7280"}
        ]
    }


@router.get("/impact/{household_id}")
async def calculate_financial_impact(household_id: str):
    """Calculate cumulative financial impact of life events."""
    events = [e for e in LIFE_EVENTS.values() if e.get("household_id") == household_id]
    events.sort(key=lambda x: x.get("date", ""))
    
    # Calculate year-by-year impact
    yearly_impact = {}
    # cumulative tracked inline
    
    for event in events:
        year = event.get("date", "")[:4]
        if year not in yearly_impact:
            yearly_impact[year] = {"one_time": 0, "annual": 0, "events": []}
        
        yearly_impact[year]["one_time"] += event.get("estimated_cost", 0)
        yearly_impact[year]["annual"] += event.get("annual_impact", 0)
        yearly_impact[year]["events"].append(event["name"])
    
    # Calculate running totals
    running_annual = 0
    timeline = []
    for year in sorted(yearly_impact.keys()):
        data = yearly_impact[year]
        running_annual += data["annual"]
        timeline.append({
            "year": year,
            "one_time_cost": data["one_time"],
            "annual_change": data["annual"],
            "running_annual_impact": running_annual,
            "events": data["events"]
        })
    
    return {
        "household_id": household_id,
        "timeline": timeline,
        "summary": {
            "total_one_time_costs": sum(e.get("estimated_cost", 0) for e in events),
            "final_annual_impact": running_annual,
            "planned_events": len([e for e in events if e.get("status") == "planned"]),
            "completed_events": len([e for e in events if e.get("status") == "completed"])
        }
    }


@router.post("/simulate")
async def simulate_timeline(
    household_id: str,
    current_net_worth: float = 1978000,
    annual_savings: float = 50000,
    growth_rate: float = 0.07
):
    """Simulate financial trajectory with life events."""
    events = [e for e in LIFE_EVENTS.values() if e.get("household_id") == household_id]
    
    # Get current year
    current_year = datetime.now().year
    projection_years = 30
    
    # Create year-by-year projection
    projection = []
    net_worth = current_net_worth
    annual_cash_flow = annual_savings
    
    for year in range(current_year, current_year + projection_years):
        year_str = str(year)
        
        # Apply events for this year
        year_events = [e for e in events if e.get("date", "").startswith(year_str)]
        one_time_impact = 0
        
        for event in year_events:
            one_time_impact += event.get("estimated_cost", 0)
            annual_cash_flow += event.get("annual_impact", 0)
        
        # Calculate net worth
        net_worth = (net_worth - one_time_impact) * (1 + growth_rate) + annual_cash_flow
        
        projection.append({
            "year": year,
            "net_worth": round(net_worth, 0),
            "annual_cash_flow": round(annual_cash_flow, 0),
            "events": [e["name"] for e in year_events]
        })
    
    return {
        "household_id": household_id,
        "projection": projection,
        "assumptions": {
            "starting_net_worth": current_net_worth,
            "base_annual_savings": annual_savings,
            "growth_rate": growth_rate * 100
        }
    }
