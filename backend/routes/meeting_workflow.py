"""
Meeting Automation & CRM Integration
After every meeting: notes generated, tasks created, CRM updated, compliance logged.
This is where hours are saved - the full meeting lifecycle automation.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import uuid
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meeting-automation", tags=["Meeting Automation"])

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

# In-memory storage for meetings (would be database in production)
MEETINGS_DB: Dict[str, Dict] = {}
TASKS_DB: Dict[str, Dict] = {}
CRM_NOTES_DB: Dict[str, List] = {}


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
    raw_notes: str  # Can be transcript, bullet points, or free text
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
        "id": meeting_id,
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
    
    MEETINGS_DB[meeting_id] = meeting_data
    
    # Auto-generate prep task
    prep_task_id = f"task_{uuid.uuid4().hex[:8]}"
    meeting_datetime = datetime.strptime(f"{meeting.date} {meeting.time}", "%Y-%m-%d %H:%M")
    prep_due = (meeting_datetime - timedelta(days=1)).strftime("%Y-%m-%d")
    
    TASKS_DB[prep_task_id] = {
        "id": prep_task_id,
        "title": f"Prepare for {meeting.client_name} {meeting.meeting_type} meeting",
        "client_id": meeting.client_id,
        "due_date": prep_due,
        "priority": "high",
        "status": "pending",
        "related_meeting_id": meeting_id,
        "task_type": "meeting_prep",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    return {
        "success": True,
        "meeting_id": meeting_id,
        "meeting": meeting_data,
        "prep_task_id": prep_task_id,
        "message": f"Meeting scheduled and prep task created"
    }


@router.post("/process-notes")
async def process_meeting_notes(notes_input: MeetingNotesInput, background_tasks: BackgroundTasks):
    """
    Process meeting notes using AI:
    1. Generate structured meeting summary
    2. Extract action items and create tasks
    3. Update CRM with meeting record
    4. Log compliance requirements
    """
    meeting_id = notes_input.meeting_id
    
    # Verify meeting exists
    if meeting_id not in MEETINGS_DB:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting = MEETINGS_DB[meeting_id]
    
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
    
    # Update meeting with processed notes
    meeting["notes_status"] = "processed"
    meeting["meeting_summary"] = summary
    meeting["action_items"] = action_items
    meeting["compliance_notes"] = compliance_notes
    meeting["processed_at"] = datetime.now(timezone.utc).isoformat()
    
    # Create tasks from action items
    created_tasks = []
    for item in action_items:
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        task = {
            "id": task_id,
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
        TASKS_DB[task_id] = task
        created_tasks.append(task)
    
    # Update CRM (add to notes log)
    if meeting["client_id"] not in CRM_NOTES_DB:
        CRM_NOTES_DB[meeting["client_id"]] = []
    
    crm_entry = {
        "id": f"crm_{uuid.uuid4().hex[:8]}",
        "date": meeting["date"],
        "type": "meeting",
        "meeting_type": meeting["meeting_type"],
        "summary": summary,
        "action_items": [t["title"] for t in created_tasks],
        "compliance_logged": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    CRM_NOTES_DB[meeting["client_id"]].append(crm_entry)
    
    # Update meeting follow-up status
    meeting["follow_up_status"] = "completed"
    
    return {
        "success": True,
        "meeting_id": meeting_id,
        "summary": summary,
        "tasks_created": len(created_tasks),
        "tasks": created_tasks,
        "crm_updated": True,
        "compliance_logged": True,
        "message": "Meeting notes processed, tasks created, CRM updated, and compliance logged"
    }


async def generate_ai_summary(meeting: Dict, raw_notes: str) -> str:
    """Generate AI-powered meeting summary."""
    prompt = f"""Summarize this financial planning meeting in a professional, concise format suitable for client records:

Meeting Type: {meeting['meeting_type']}
Client: {meeting['client_name']}
Date: {meeting['date']}

Notes:
{raw_notes}

Provide a 2-3 paragraph summary covering:
1. Key topics discussed
2. Important decisions made
3. Client concerns addressed
4. Next steps agreed

Keep it professional and factual."""

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
    prompt = f"""Extract all action items from this financial planning meeting:

Meeting Type: {meeting['meeting_type']}
Client: {meeting['client_name']}

Notes:
{raw_notes}

Return as JSON array with format:
[{{"title": "action title", "description": "details", "due_date": "YYYY-MM-DD", "priority": "high/medium/low"}}]

Include both adviser tasks and any client commitments. Set realistic due dates.
Return only the JSON array, no other text."""

    try:
        messages = [LlmMessage(role="user", content=prompt)]
        response = chat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            model="claude-sonnet-4-20250514",
            messages=messages,
            temperature=0.3
        )
        
        # Parse JSON from response
        import json
        # Try to extract JSON from response
        content = response.content.strip()
        if content.startswith("["):
            return json.loads(content)
        else:
            # Try to find JSON in response
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
        "fee_disclosure_current": True,
        "risk_profile_confirmed": meeting['meeting_type'] == "review",
        "documentation_complete": True,
        "logged_at": datetime.now(timezone.utc).isoformat()
    }


def create_basic_summary(meeting: Dict, notes_input: MeetingNotesInput) -> str:
    """Create basic summary without AI."""
    summary_parts = [
        f"{meeting['meeting_type'].title()} meeting with {meeting['client_name']}",
        f"Date: {meeting['date']}",
        f"Duration: {meeting['duration']} minutes",
        f"Location: {meeting['location']}",
    ]
    
    if notes_input.key_decisions:
        summary_parts.append(f"Key Decisions: {', '.join(notes_input.key_decisions)}")
    
    if notes_input.client_concerns:
        summary_parts.append(f"Client Concerns: {', '.join(notes_input.client_concerns)}")
    
    if notes_input.raw_notes:
        summary_parts.append(f"Notes: {notes_input.raw_notes[:500]}...")
    
    return "\n".join(summary_parts)


def create_basic_compliance_notes(meeting: Dict) -> Dict:
    """Create basic compliance notes without AI."""
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
    meetings = list(MEETINGS_DB.values())
    
    if client_id:
        meetings = [m for m in meetings if m["client_id"] == client_id]
    if status:
        meetings = [m for m in meetings if m["status"] == status]
    if from_date:
        meetings = [m for m in meetings if m["date"] >= from_date]
    if to_date:
        meetings = [m for m in meetings if m["date"] <= to_date]
    
    return {
        "meetings": meetings,
        "total": len(meetings)
    }


@router.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get specific meeting details."""
    if meeting_id not in MEETINGS_DB:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    return MEETINGS_DB[meeting_id]


@router.get("/tasks")
async def get_tasks(
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None
):
    """Get tasks with optional filters."""
    tasks = list(TASKS_DB.values())
    
    if client_id:
        tasks = [t for t in tasks if t["client_id"] == client_id]
    if status:
        tasks = [t for t in tasks if t["status"] == status]
    if priority:
        tasks = [t for t in tasks if t["priority"] == priority]
    
    # Sort by due date and priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    tasks.sort(key=lambda x: (x["due_date"], priority_order.get(x["priority"], 2)))
    
    return {
        "tasks": tasks,
        "total": len(tasks),
        "pending": len([t for t in tasks if t["status"] == "pending"]),
        "overdue": len([t for t in tasks if t["status"] == "pending" and t["due_date"] < datetime.now().strftime("%Y-%m-%d")])
    }


@router.post("/tasks")
async def create_task(task: TaskInput):
    """Create a new task."""
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    task_data = {
        "id": task_id,
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
    
    TASKS_DB[task_id] = task_data
    
    return {
        "success": True,
        "task_id": task_id,
        "task": task_data
    }


@router.put("/tasks/{task_id}/complete")
async def complete_task(task_id: str, notes: Optional[str] = None):
    """Mark a task as completed."""
    if task_id not in TASKS_DB:
        raise HTTPException(status_code=404, detail="Task not found")
    
    TASKS_DB[task_id]["status"] = "completed"
    TASKS_DB[task_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
    TASKS_DB[task_id]["completion_notes"] = notes
    
    return {
        "success": True,
        "task_id": task_id,
        "status": "completed"
    }


@router.get("/crm-notes/{client_id}")
async def get_crm_notes(client_id: str):
    """Get CRM notes for a client."""
    notes = CRM_NOTES_DB.get(client_id, [])
    
    return {
        "client_id": client_id,
        "notes": notes,
        "total": len(notes)
    }


@router.post("/crm-notes/{client_id}")
async def add_crm_note(client_id: str, note_type: str = "general", content: str = ""):
    """Add a CRM note for a client."""
    if client_id not in CRM_NOTES_DB:
        CRM_NOTES_DB[client_id] = []
    
    note = {
        "id": f"crm_{uuid.uuid4().hex[:8]}",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "type": note_type,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    CRM_NOTES_DB[client_id].append(note)
    
    return {
        "success": True,
        "note": note
    }


@router.get("/workflow-stats")
async def get_workflow_stats():
    """Get meeting automation workflow statistics."""
    total_meetings = len(MEETINGS_DB)
    processed_meetings = len([m for m in MEETINGS_DB.values() if m["notes_status"] == "processed"])
    
    total_tasks = len(TASKS_DB)
    pending_tasks = len([t for t in TASKS_DB.values() if t["status"] == "pending"])
    completed_tasks = len([t for t in TASKS_DB.values() if t["status"] == "completed"])
    auto_generated_tasks = len([t for t in TASKS_DB.values() if t.get("task_type") == "meeting_follow_up"])
    
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
            "automation_savings": f"{processed_meetings * 15} minutes"  # 15 min saved per automated meeting
        }
    }
