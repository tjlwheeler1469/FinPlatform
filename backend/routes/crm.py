"""
CRM Routes
Client Relationship Management for advisers.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/crm", tags=["Client CRM"])

# In-memory data stores (replace with MongoDB in production)
HOUSEHOLDS: Dict[str, Dict] = {}
NOTES: Dict[str, Dict] = {}
TASKS: Dict[str, Dict] = {}
MEETINGS: Dict[str, Dict] = {}


class HouseholdCreate(BaseModel):
    name: str
    members: List[Dict[str, Any]] = []
    primary_email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    risk_profile: str = "balanced"
    adviser_id: Optional[str] = None


class NoteCreate(BaseModel):
    household_id: str
    title: str
    content: str
    category: str = "general"


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    household_id: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[str] = None


class MeetingCreate(BaseModel):
    title: str
    household_id: str
    date: str
    time: str
    duration_minutes: int = 60
    meeting_type: str = "review"
    location: Optional[str] = None
    notes: Optional[str] = None


# Sample data initialization
def init_sample_data():
    """Initialize sample CRM data."""
    if not HOUSEHOLDS:
        sample_households = [
            {
                "id": "hh_001",
                "name": "Wheeler Family",
                "members": [
                    {"name": "James Wheeler", "age": 45, "role": "primary"},
                    {"name": "Sarah Wheeler", "age": 43, "role": "spouse"}
                ],
                "primary_email": "james@wheeler.com",
                "phone": "+61 400 123 456",
                "risk_profile": "growth",
                "net_worth": 1978000,
                "annual_income": 253400,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "hh_002",
                "name": "Chen Family",
                "members": [
                    {"name": "Michael Chen", "age": 38, "role": "primary"},
                    {"name": "Lisa Chen", "age": 36, "role": "spouse"}
                ],
                "primary_email": "michael@chen.com",
                "phone": "+61 400 234 567",
                "risk_profile": "balanced",
                "net_worth": 1250000,
                "annual_income": 180000,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "hh_003",
                "name": "Thompson Family",
                "members": [
                    {"name": "David Thompson", "age": 52, "role": "primary"}
                ],
                "primary_email": "david@thompson.com",
                "phone": "+61 400 345 678",
                "risk_profile": "conservative",
                "net_worth": 2450000,
                "annual_income": 320000,
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        for hh in sample_households:
            HOUSEHOLDS[hh["id"]] = hh

init_sample_data()


@router.get("/households")
async def get_households(
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all households with optional filtering."""
    households = list(HOUSEHOLDS.values())
    
    if status:
        households = [h for h in households if h.get("status") == status]
    
    if search:
        search_lower = search.lower()
        households = [h for h in households if search_lower in h["name"].lower()]
    
    return {
        "households": households,
        "total": len(households)
    }


@router.get("/households/{household_id}")
async def get_household(household_id: str):
    """Get a specific household by ID."""
    household = HOUSEHOLDS.get(household_id)
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    return household


@router.post("/households")
async def create_household(request: HouseholdCreate):
    """Create a new household."""
    household_id = f"hh_{uuid.uuid4().hex[:8]}"
    
    household = {
        "id": household_id,
        "name": request.name,
        "members": request.members,
        "primary_email": request.primary_email,
        "phone": request.phone,
        "address": request.address,
        "risk_profile": request.risk_profile,
        "adviser_id": request.adviser_id,
        "status": "active",
        "net_worth": 0,
        "annual_income": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    HOUSEHOLDS[household_id] = household
    return household


@router.put("/households/{household_id}")
async def update_household(household_id: str, updates: Dict[str, Any]):
    """Update a household."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    HOUSEHOLDS[household_id].update(updates)
    HOUSEHOLDS[household_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return HOUSEHOLDS[household_id]


@router.delete("/households/{household_id}")
async def delete_household(household_id: str):
    """Delete a household."""
    if household_id not in HOUSEHOLDS:
        raise HTTPException(status_code=404, detail="Household not found")
    
    del HOUSEHOLDS[household_id]
    return {"success": True, "message": "Household deleted"}


# Notes endpoints
@router.post("/notes")
async def create_note(request: NoteCreate):
    """Create a new note for a household."""
    note_id = f"note_{uuid.uuid4().hex[:8]}"
    
    note = {
        "id": note_id,
        "household_id": request.household_id,
        "title": request.title,
        "content": request.content,
        "category": request.category,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    NOTES[note_id] = note
    return note


@router.get("/notes/{household_id}")
async def get_notes(household_id: str):
    """Get all notes for a household."""
    household_notes = [n for n in NOTES.values() if n["household_id"] == household_id]
    return {"notes": household_notes}


@router.delete("/notes/{note_id}")
async def delete_note(note_id: str):
    """Delete a note."""
    if note_id not in NOTES:
        raise HTTPException(status_code=404, detail="Note not found")
    
    del NOTES[note_id]
    return {"success": True}


# Tasks endpoints
@router.get("/tasks")
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    household_id: Optional[str] = None
):
    """Get tasks with optional filtering."""
    tasks = list(TASKS.values())
    
    if status:
        tasks = [t for t in tasks if t.get("status") == status]
    if priority:
        tasks = [t for t in tasks if t.get("priority") == priority]
    if household_id:
        tasks = [t for t in tasks if t.get("household_id") == household_id]
    
    return {"tasks": tasks}


@router.post("/tasks")
async def create_task(request: TaskCreate):
    """Create a new task."""
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    task = {
        "id": task_id,
        "title": request.title,
        "description": request.description,
        "household_id": request.household_id,
        "due_date": request.due_date,
        "priority": request.priority,
        "assigned_to": request.assigned_to,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    TASKS[task_id] = task
    return task


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, updates: Dict[str, Any]):
    """Update a task."""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    TASKS[task_id].update(updates)
    TASKS[task_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return TASKS[task_id]


@router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task."""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    
    del TASKS[task_id]
    return {"success": True}


# Meetings endpoints
@router.get("/meetings")
async def get_meetings(
    household_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get meetings with optional filtering."""
    meetings = list(MEETINGS.values())
    
    if household_id:
        meetings = [m for m in meetings if m.get("household_id") == household_id]
    
    # Sort by date
    meetings.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    return {"meetings": meetings}


@router.post("/meetings")
async def create_meeting(request: MeetingCreate):
    """Schedule a new meeting."""
    meeting_id = f"meet_{uuid.uuid4().hex[:8]}"
    
    meeting = {
        "id": meeting_id,
        "title": request.title,
        "household_id": request.household_id,
        "date": request.date,
        "time": request.time,
        "duration_minutes": request.duration_minutes,
        "meeting_type": request.meeting_type,
        "location": request.location,
        "notes": request.notes,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    MEETINGS[meeting_id] = meeting
    return meeting


@router.put("/meetings/{meeting_id}")
async def update_meeting(meeting_id: str, updates: Dict[str, Any]):
    """Update a meeting."""
    if meeting_id not in MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    MEETINGS[meeting_id].update(updates)
    MEETINGS[meeting_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return MEETINGS[meeting_id]


@router.delete("/meetings/{meeting_id}")
async def delete_meeting(meeting_id: str):
    """Delete a meeting."""
    if meeting_id not in MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    del MEETINGS[meeting_id]
    return {"success": True}


# Dashboard stats
@router.get("/stats")
async def get_crm_stats():
    """Get CRM dashboard statistics."""
    households = list(HOUSEHOLDS.values())
    tasks = list(TASKS.values())
    meetings = list(MEETINGS.values())
    
    active_clients = len([h for h in households if h.get("status") == "active"])
    pending_tasks = len([t for t in tasks if t.get("status") == "pending"])
    upcoming_meetings = len([m for m in meetings if m.get("status") == "scheduled"])
    total_aum = sum(h.get("net_worth", 0) for h in households)
    
    return {
        "total_households": len(households),
        "active_clients": active_clients,
        "pending_tasks": pending_tasks,
        "upcoming_meetings": upcoming_meetings,
        "total_aum": total_aum,
        "average_net_worth": total_aum / len(households) if households else 0
    }
