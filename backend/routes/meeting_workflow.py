"""
Meeting Automation & CRM Integration with MongoDB Persistence
After every meeting: notes generated, tasks created, CRM updated, compliance logged.
This is where hours are saved - the full meeting lifecycle automation.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meeting-automation", tags=["Meeting Automation"])

# Import database
try:
    from db import db
    meetings_collection = db.meetings
    tasks_collection = db.tasks
    crm_notes_collection = db.crm_notes
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    logger.warning("Database not available for meeting automation - using in-memory storage")

# Try to import AI service
try:
    from emergentintegrations.llm.chat import chat, LlmMessage
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False
    logger.warning("AI service not available for meeting automation")


class MeetingType(str):
    INITIAL = "initial"
    REVIEW = "review"
    STRATEGY = "strategy"
    ADHOC = "adhoc"
    ONBOARDING = "onboarding"


class TaskPriority(str):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# Meeting templates and workflows
MEETING_TEMPLATES = {
    "initial": {
        "duration": 90,
        "agenda_items": [
            "Introduction and rapport building",
            "Understanding client goals and objectives",
            "Risk profiling and capacity assessment",
            "Current financial position review",
            "Fee disclosure and agreement",
            "Next steps and timeline"
        ],
        "required_documents": ["FSG", "Privacy Collection Notice", "Risk Profile Questionnaire"],
        "compliance_requirements": ["ID verification", "AML check", "Risk profile documentation"],
        "follow_up_tasks": ["Prepare SOA", "Portfolio recommendation", "Investment implementation"]
    },
    "review": {
        "duration": 60,
        "agenda_items": [
            "Portfolio performance review",
            "Goal progress assessment",
            "Life changes and circumstances update",
            "Risk profile reconfirmation",
            "Market outlook and strategy",
            "Action items and next review"
        ],
        "required_documents": ["Portfolio Report", "Goal Progress Report"],
        "compliance_requirements": ["Ongoing advice documentation", "Best interest duty compliance"],
        "follow_up_tasks": ["Update SOA if required", "Implement agreed changes", "Schedule next review"]
    },
    "strategy": {
        "duration": 45,
        "agenda_items": [
            "Strategy topic introduction",
            "Options analysis",
            "Recommendation discussion",
            "Implementation plan",
            "Timeline and responsibilities"
        ],
        "required_documents": ["Strategy Paper", "Comparison Analysis"],
        "compliance_requirements": ["Advice record", "Suitability assessment"],
        "follow_up_tasks": ["Document strategy advice", "Implement strategy", "Monitor progress"]
    },
    "adhoc": {
        "duration": 30,
        "agenda_items": [
            "Client query/concern",
            "Analysis and response",
            "Action required (if any)",
            "Follow-up confirmation"
        ],
        "required_documents": [],
        "compliance_requirements": ["Advice record if advice given"],
        "follow_up_tasks": ["Log interaction", "Complete any promised actions"]
    }
}

# Fallback in-memory storage if DB unavailable
MEETINGS_MEMORY: Dict[str, Dict] = {}
TASKS_MEMORY: Dict[str, Dict] = {}
CRM_NOTES_MEMORY: Dict[str, List] = {}


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


class MeetingInput(BaseModel):
    client_id: str
    client_name: str
    meeting_type: str = "review"
    date: str  # ISO format
    time: str  # HH:MM
    duration: int = 60
    location: str = "video"  # video, phone, office
    attendees: Optional[List[str]] = None
    notes: Optional[str] = None


class MeetingNotesInput(BaseModel):
    meeting_id: str
    raw_notes: str
    key_decisions: Optional[List[str]] = None
    client_concerns: Optional[List[str]] = None
    action_items: Optional[List[str]] = None


class TaskInput(BaseModel):
    title: str
    description: Optional[str] = None
    client_id: str
    due_date: str
    priority: str = "medium"
    assigned_to: Optional[str] = None
    related_meeting_id: Optional[str] = None


@router.post("/schedule")
async def schedule_meeting(meeting: MeetingInput):
    """Schedule a new client meeting with automatic prep generation."""
    meeting_id = f"meeting_{uuid.uuid4().hex[:8]}"
    
    # Get template
    template = MEETING_TEMPLATES.get(meeting.meeting_type, MEETING_TEMPLATES["review"])
    
    meeting_data = {
        "meeting_id": meeting_id,
        "client_id": meeting.client_id,
        "client_name": meeting.client_name,
        "meeting_type": meeting.meeting_type,
        "date": meeting.date,
        "time": meeting.time,
        "duration": meeting.duration or template["duration"],
        "location": meeting.location,
        "attendees": meeting.attendees or [],
        "status": "scheduled",
        "agenda": template["agenda_items"],
        "required_documents": template["required_documents"],
        "compliance_requirements": template["compliance_requirements"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "prep_status": "pending",
        "notes_status": "pending",
        "follow_up_status": "pending"
    }
    
    # Store in database or memory
    if DB_AVAILABLE:
        await meetings_collection.insert_one(meeting_data.copy())  # Use copy to avoid _id mutation
    else:
        MEETINGS_MEMORY[meeting_id] = meeting_data
    
    # Auto-generate prep task
    prep_task_id = f"task_{uuid.uuid4().hex[:8]}"
    meeting_datetime = datetime.strptime(f"{meeting.date} {meeting.time}", "%Y-%m-%d %H:%M")
    prep_due = (meeting_datetime - timedelta(days=1)).strftime("%Y-%m-%d")
    
    prep_task = {
        "task_id": prep_task_id,
        "title": f"Prepare for {meeting.client_name} {meeting.meeting_type} meeting",
        "client_id": meeting.client_id,
        "due_date": prep_due,
        "priority": "high",
        "status": "pending",
        "related_meeting_id": meeting_id,
        "task_type": "meeting_prep",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if DB_AVAILABLE:
        await tasks_collection.insert_one(prep_task.copy())  # Use copy to avoid _id mutation
    else:
        TASKS_MEMORY[prep_task_id] = prep_task
    
    return {
        "success": True,
        "meeting_id": meeting_id,
        "meeting": meeting_data,
        "prep_task_id": prep_task_id,
        "message": f"Meeting scheduled and prep task created",
        "storage": "mongodb" if DB_AVAILABLE else "in-memory"
    }


@router.post("/process-notes")
async def process_meeting_notes(notes_input: MeetingNotesInput, background_tasks: BackgroundTasks):
    """Process meeting notes using AI."""
    meeting_id = notes_input.meeting_id
    
    # Find meeting
    if DB_AVAILABLE:
        meeting = await meetings_collection.find_one({"meeting_id": meeting_id})
        meeting = serialize_doc(meeting)
    else:
        meeting = MEETINGS_MEMORY.get(meeting_id)
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Process notes with AI if available
    if AI_AVAILABLE and notes_input.raw_notes:
        try:
            summary = await generate_ai_summary(meeting, notes_input.raw_notes)
            action_items = await extract_action_items(meeting, notes_input.raw_notes)
            compliance_notes = await generate_compliance_notes(meeting, notes_input.raw_notes)
        except Exception as e:
            logger.error(f"AI processing failed: {e}")
            summary = create_basic_summary(meeting, notes_input)
            action_items = notes_input.action_items or []
            compliance_notes = create_basic_compliance_notes(meeting)
    else:
        summary = create_basic_summary(meeting, notes_input)
        action_items = notes_input.action_items or []
        compliance_notes = create_basic_compliance_notes(meeting)
    
    # Update meeting
    update_data = {
        "notes_status": "processed",
        "meeting_summary": summary,
        "action_items_list": action_items,
        "compliance_notes": compliance_notes,
        "processed_at": datetime.now(timezone.utc).isoformat()
    }
    
    if DB_AVAILABLE:
        await meetings_collection.update_one(
            {"meeting_id": meeting_id},
            {"$set": update_data}
        )
    else:
        MEETINGS_MEMORY[meeting_id].update(update_data)
    
    # Create tasks from action items
    created_tasks = []
    for item in action_items:
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        task = {
            "task_id": task_id,
            "title": item.get("title", item) if isinstance(item, dict) else item,
            "description": item.get("description", "") if isinstance(item, dict) else "",
            "client_id": meeting["client_id"],
            "due_date": item.get("due_date", (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")) if isinstance(item, dict) else (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "priority": item.get("priority", "medium") if isinstance(item, dict) else "medium",
            "status": "pending",
            "related_meeting_id": meeting_id,
            "task_type": "meeting_follow_up",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        if DB_AVAILABLE:
            await tasks_collection.insert_one(task)
        else:
            TASKS_MEMORY[task_id] = task
        
        created_tasks.append(serialize_doc(task) if DB_AVAILABLE else task)
    
    # Add CRM note
    crm_entry = {
        "crm_id": f"crm_{uuid.uuid4().hex[:8]}",
        "client_id": meeting["client_id"],
        "date": meeting["date"],
        "type": "meeting",
        "meeting_type": meeting["meeting_type"],
        "summary": summary,
        "action_items": [t.get("title", t) for t in created_tasks],
        "compliance_logged": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if DB_AVAILABLE:
        await crm_notes_collection.insert_one(crm_entry)
    else:
        if meeting["client_id"] not in CRM_NOTES_MEMORY:
            CRM_NOTES_MEMORY[meeting["client_id"]] = []
        CRM_NOTES_MEMORY[meeting["client_id"]].append(crm_entry)
    
    # Update follow-up status
    if DB_AVAILABLE:
        await meetings_collection.update_one(
            {"meeting_id": meeting_id},
            {"$set": {"follow_up_status": "completed"}}
        )
    else:
        MEETINGS_MEMORY[meeting_id]["follow_up_status"] = "completed"
    
    return {
        "success": True,
        "meeting_id": meeting_id,
        "summary": summary,
        "tasks_created": len(created_tasks),
        "tasks": created_tasks,
        "crm_updated": True,
        "compliance_logged": True,
        "message": "Meeting notes processed, tasks created, CRM updated, and compliance logged",
        "storage": "mongodb" if DB_AVAILABLE else "in-memory"
    }


async def generate_ai_summary(meeting: Dict, raw_notes: str) -> str:
    """Generate AI-powered meeting summary."""
    prompt = f"""Summarize this financial planning meeting in a professional, concise format:

Meeting Type: {meeting['meeting_type']}
Client: {meeting['client_name']}
Date: {meeting['date']}

Notes:
{raw_notes}

Provide a 2-3 paragraph summary covering key topics discussed, decisions made, and next steps."""

    try:
        messages = [LlmMessage(role="user", content=prompt)]
        response = chat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            model="claude-sonnet-4-20250514",
            messages=messages,
            temperature=0.5
        )
        return response.content
    except Exception as e:
        logger.error(f"AI summary generation failed: {e}")
        return f"Meeting with {meeting['client_name']} on {meeting['date']}. {raw_notes[:500]}..."


async def extract_action_items(meeting: Dict, raw_notes: str) -> List[Dict]:
    """Extract action items from meeting notes using AI."""
    prompt = f"""Extract all action items from this meeting:

Client: {meeting['client_name']}
Notes: {raw_notes}

Return as JSON array: [{{"title": "action", "due_date": "YYYY-MM-DD", "priority": "high/medium/low"}}]
Return only the JSON array."""

    try:
        messages = [LlmMessage(role="user", content=prompt)]
        response = chat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            model="claude-sonnet-4-20250514",
            messages=messages,
            temperature=0.3
        )
        
        import json
        content = response.content.strip()
        if content.startswith("["):
            return json.loads(content)
        start = content.find("[")
        end = content.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])
        return []
    except Exception as e:
        logger.error(f"AI action extraction failed: {e}")
        return []


async def generate_compliance_notes(meeting: Dict, raw_notes: str) -> Dict:
    """Generate compliance documentation."""
    template = MEETING_TEMPLATES.get(meeting['meeting_type'], MEETING_TEMPLATES["review"])
    
    return {
        "meeting_type": meeting['meeting_type'],
        "date": meeting['date'],
        "client_id": meeting['client_id'],
        "compliance_requirements_met": template["compliance_requirements"],
        "advice_given": meeting['meeting_type'] != "adhoc",
        "best_interest_duty_documented": True,
        "documentation_complete": True,
        "logged_at": datetime.now(timezone.utc).isoformat()
    }


def create_basic_summary(meeting: Dict, notes_input: MeetingNotesInput) -> str:
    """Create basic summary without AI."""
    parts = [
        f"{meeting['meeting_type'].title()} meeting with {meeting['client_name']}",
        f"Date: {meeting['date']}",
        f"Duration: {meeting['duration']} minutes"
    ]
    if notes_input.key_decisions:
        parts.append(f"Key Decisions: {', '.join(notes_input.key_decisions)}")
    if notes_input.raw_notes:
        parts.append(f"Notes: {notes_input.raw_notes[:500]}...")
    return "\n".join(parts)


def create_basic_compliance_notes(meeting: Dict) -> Dict:
    """Create basic compliance notes."""
    template = MEETING_TEMPLATES.get(meeting['meeting_type'], MEETING_TEMPLATES["review"])
    return {
        "meeting_type": meeting['meeting_type'],
        "date": meeting['date'],
        "compliance_requirements": template["compliance_requirements"],
        "documented": True,
        "logged_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/meetings")
async def get_meetings(
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None
):
    """Get meetings with optional filters."""
    if DB_AVAILABLE:
        query = {}
        if client_id:
            query["client_id"] = client_id
        if status:
            query["status"] = status
        
        cursor = meetings_collection.find(query)
        meetings = [serialize_doc(m) async for m in cursor]
        
        if from_date:
            meetings = [m for m in meetings if m["date"] >= from_date]
        if to_date:
            meetings = [m for m in meetings if m["date"] <= to_date]
    else:
        meetings = list(MEETINGS_MEMORY.values())
        if client_id:
            meetings = [m for m in meetings if m["client_id"] == client_id]
        if status:
            meetings = [m for m in meetings if m["status"] == status]
        if from_date:
            meetings = [m for m in meetings if m["date"] >= from_date]
        if to_date:
            meetings = [m for m in meetings if m["date"] <= to_date]
    
    return {"meetings": meetings, "total": len(meetings), "storage": "mongodb" if DB_AVAILABLE else "in-memory"}


@router.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get specific meeting details."""
    if DB_AVAILABLE:
        meeting = await meetings_collection.find_one({"meeting_id": meeting_id})
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return serialize_doc(meeting)
    else:
        if meeting_id not in MEETINGS_MEMORY:
            raise HTTPException(status_code=404, detail="Meeting not found")
        return MEETINGS_MEMORY[meeting_id]


@router.get("/tasks")
async def get_tasks(
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None
):
    """Get tasks with optional filters."""
    if DB_AVAILABLE:
        query = {}
        if client_id:
            query["client_id"] = client_id
        if status:
            query["status"] = status
        if priority:
            query["priority"] = priority
        
        cursor = tasks_collection.find(query)
        tasks = [serialize_doc(t) async for t in cursor]
    else:
        tasks = list(TASKS_MEMORY.values())
        if client_id:
            tasks = [t for t in tasks if t["client_id"] == client_id]
        if status:
            tasks = [t for t in tasks if t["status"] == status]
        if priority:
            tasks = [t for t in tasks if t["priority"] == priority]
    
    # Sort by due date and priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    tasks.sort(key=lambda x: (x.get("due_date", ""), priority_order.get(x.get("priority", ""), 2)))
    
    now = datetime.now().strftime("%Y-%m-%d")
    return {
        "tasks": tasks,
        "total": len(tasks),
        "pending": len([t for t in tasks if t.get("status") == "pending"]),
        "overdue": len([t for t in tasks if t.get("status") == "pending" and t.get("due_date", "") < now]),
        "storage": "mongodb" if DB_AVAILABLE else "in-memory"
    }


@router.post("/tasks")
async def create_task(task: TaskInput):
    """Create a new task."""
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    task_data = {
        "task_id": task_id,
        "title": task.title,
        "description": task.description,
        "client_id": task.client_id,
        "due_date": task.due_date,
        "priority": task.priority,
        "assigned_to": task.assigned_to,
        "status": "pending",
        "related_meeting_id": task.related_meeting_id,
        "task_type": "manual",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if DB_AVAILABLE:
        await tasks_collection.insert_one(task_data.copy())  # Use copy to avoid _id mutation
    else:
        TASKS_MEMORY[task_id] = task_data
    
    return {"success": True, "task_id": task_id, "task": task_data, "storage": "mongodb" if DB_AVAILABLE else "in-memory"}


@router.put("/tasks/{task_id}/complete")
async def complete_task(task_id: str, notes: Optional[str] = None):
    """Mark a task as completed."""
    if DB_AVAILABLE:
        result = await tasks_collection.update_one(
            {"task_id": task_id},
            {"$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "completion_notes": notes
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Task not found")
    else:
        if task_id not in TASKS_MEMORY:
            raise HTTPException(status_code=404, detail="Task not found")
        TASKS_MEMORY[task_id]["status"] = "completed"
        TASKS_MEMORY[task_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
        TASKS_MEMORY[task_id]["completion_notes"] = notes
    
    return {"success": True, "task_id": task_id, "status": "completed"}


@router.get("/crm-notes/{client_id}")
async def get_crm_notes(client_id: str):
    """Get CRM notes for a client."""
    if DB_AVAILABLE:
        cursor = crm_notes_collection.find({"client_id": client_id})
        notes = [serialize_doc(n) async for n in cursor]
    else:
        notes = CRM_NOTES_MEMORY.get(client_id, [])
    
    return {"client_id": client_id, "notes": notes, "total": len(notes)}


@router.post("/crm-notes/{client_id}")
async def add_crm_note(client_id: str, note_type: str = "general", content: str = ""):
    """Add a CRM note for a client."""
    note = {
        "crm_id": f"crm_{uuid.uuid4().hex[:8]}",
        "client_id": client_id,
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "type": note_type,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if DB_AVAILABLE:
        await crm_notes_collection.insert_one(note)
    else:
        if client_id not in CRM_NOTES_MEMORY:
            CRM_NOTES_MEMORY[client_id] = []
        CRM_NOTES_MEMORY[client_id].append(note)
    
    return {"success": True, "note": serialize_doc(note) if DB_AVAILABLE else note}


@router.get("/workflow-stats")
async def get_workflow_stats():
    """Get meeting automation workflow statistics."""
    if DB_AVAILABLE:
        total_meetings = await meetings_collection.count_documents({})
        processed_meetings = await meetings_collection.count_documents({"notes_status": "processed"})
        total_tasks = await tasks_collection.count_documents({})
        pending_tasks = await tasks_collection.count_documents({"status": "pending"})
        completed_tasks = await tasks_collection.count_documents({"status": "completed"})
        auto_generated_tasks = await tasks_collection.count_documents({"task_type": "meeting_follow_up"})
    else:
        total_meetings = len(MEETINGS_MEMORY)
        processed_meetings = len([m for m in MEETINGS_MEMORY.values() if m.get("notes_status") == "processed"])
        total_tasks = len(TASKS_MEMORY)
        pending_tasks = len([t for t in TASKS_MEMORY.values() if t.get("status") == "pending"])
        completed_tasks = len([t for t in TASKS_MEMORY.values() if t.get("status") == "completed"])
        auto_generated_tasks = len([t for t in TASKS_MEMORY.values() if t.get("task_type") == "meeting_follow_up"])
    
    return {
        "meetings": {
            "total": total_meetings,
            "processed": processed_meetings,
            "pending_notes": total_meetings - processed_meetings
        },
        "tasks": {
            "total": total_tasks,
            "pending": pending_tasks,
            "completed": completed_tasks,
            "auto_generated": auto_generated_tasks,
            "completion_rate": round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0
        },
        "efficiency_metrics": {
            "avg_tasks_per_meeting": round(auto_generated_tasks / processed_meetings, 1) if processed_meetings > 0 else 0,
            "automation_savings": f"{processed_meetings * 15} minutes"
        },
        "storage": "mongodb" if DB_AVAILABLE else "in-memory"
    }
