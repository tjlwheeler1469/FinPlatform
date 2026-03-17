"""
AI Meeting Notes & Compliance Automation
Automated meeting documentation, action items, and compliance logging.
"""
from fastapi import APIRouter, HTTPException
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

# In-memory storage for meetings
MEETINGS: Dict[str, Dict] = {}
COMPLIANCE_LOGS: List[Dict] = []


class MeetingNotesRequest(BaseModel):
    client_id: str
    client_name: str
    meeting_date: str
    meeting_type: str  # "annual_review", "strategy", "onboarding", "ad_hoc"
    attendees: List[str]
    topics_discussed: List[str]
    transcript: Optional[str] = None
    audio_summary: Optional[str] = None


class MeetingUpdateRequest(BaseModel):
    meeting_id: str
    field: str
    value: Any


def generate_meeting_notes_ai(request: MeetingNotesRequest) -> Dict:
    """Generate structured meeting notes using AI."""
    if not AI_AVAILABLE:
        return generate_meeting_notes_fallback(request)
    
    try:
        prompt = f"""As a financial adviser's assistant, generate comprehensive meeting notes from this information:

Client: {request.client_name}
Meeting Type: {request.meeting_type}
Date: {request.meeting_date}
Attendees: {', '.join(request.attendees)}
Topics Discussed: {', '.join(request.topics_discussed)}
{f'Transcript/Summary: {request.transcript}' if request.transcript else ''}
{f'Audio Summary: {request.audio_summary}' if request.audio_summary else ''}

Generate a structured summary including:
1. Meeting Summary (2-3 sentences)
2. Key Discussion Points (bullet points)
3. Client Concerns/Questions Raised
4. Advice Provided (be specific about any recommendations)
5. Action Items (with responsible party and deadline)
6. Follow-up Required
7. Compliance Notes (any regulatory considerations, risk warnings given, etc.)

Format the response as JSON with these keys: summary, key_points, client_concerns, advice_provided, action_items, follow_up, compliance_notes"""

        messages = [LlmMessage(role="user", content=prompt)]
        response = chat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            model="claude-sonnet-4-20250514",
            messages=messages,
            temperature=0.3
        )
        
        # Try to parse as JSON, otherwise return as text
        import json
        try:
            notes = json.loads(response.content)
        except:
            notes = {
                "summary": response.content[:500],
                "key_points": request.topics_discussed,
                "client_concerns": [],
                "advice_provided": [],
                "action_items": [],
                "follow_up": [],
                "compliance_notes": "Review meeting transcript for compliance items"
            }
        
        return {
            "success": True,
            "notes": notes,
            "ai_generated": True
        }
    except Exception as e:
        logger.error(f"AI meeting notes generation failed: {e}")
        return generate_meeting_notes_fallback(request)


def generate_meeting_notes_fallback(request: MeetingNotesRequest) -> Dict:
    """Generate structured meeting notes without AI."""
    return {
        "success": True,
        "notes": {
            "summary": f"{request.meeting_type.replace('_', ' ').title()} meeting with {request.client_name} on {request.meeting_date}",
            "key_points": request.topics_discussed,
            "client_concerns": ["Please manually add any client concerns discussed"],
            "advice_provided": ["Please manually add advice provided"],
            "action_items": [
                {
                    "item": "Review meeting notes and add details",
                    "responsible": "Adviser",
                    "deadline": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
                }
            ],
            "follow_up": ["Schedule follow-up if required"],
            "compliance_notes": "Please manually document any compliance-relevant discussions, risk warnings, and suitability assessments."
        },
        "ai_generated": False
    }


def generate_compliance_log(meeting_id: str, meeting_data: Dict) -> Dict:
    """Generate compliance log entry for a meeting."""
    compliance_entry = {
        "id": f"comp_{uuid.uuid4().hex[:8]}",
        "meeting_id": meeting_id,
        "client_id": meeting_data.get("client_id"),
        "client_name": meeting_data.get("client_name"),
        "meeting_type": meeting_data.get("meeting_type"),
        "meeting_date": meeting_data.get("meeting_date"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "compliance_checklist": {
            "client_identified": True,
            "suitability_assessed": meeting_data.get("meeting_type") in ["annual_review", "strategy"],
            "risk_profile_confirmed": meeting_data.get("meeting_type") == "annual_review",
            "advice_documented": len(meeting_data.get("notes", {}).get("advice_provided", [])) > 0,
            "warnings_given": True,  # Assumed standard warnings given
            "record_of_advice": meeting_data.get("meeting_type") in ["annual_review", "strategy"]
        },
        "regulatory_references": [
            "ASIC RG 175 - Licensing: Financial product advisers",
            "Corporations Act 2001 - s945A Best interests duty",
            "Corporations Act 2001 - s961B Best interests duty (advisers)"
        ],
        "review_status": "pending",
        "reviewer": None,
        "reviewed_at": None
    }
    
    COMPLIANCE_LOGS.append(compliance_entry)
    return compliance_entry


@router.post("/generate-notes")
async def generate_meeting_notes(request: MeetingNotesRequest):
    """Generate AI-powered meeting notes from meeting information."""
    meeting_id = f"meeting_{uuid.uuid4().hex[:8]}"
    
    # Generate notes
    notes_result = generate_meeting_notes_ai(request)
    
    # Create meeting record
    meeting_record = {
        "id": meeting_id,
        "client_id": request.client_id,
        "client_name": request.client_name,
        "meeting_date": request.meeting_date,
        "meeting_type": request.meeting_type,
        "attendees": request.attendees,
        "topics_discussed": request.topics_discussed,
        "notes": notes_result.get("notes", {}),
        "ai_generated": notes_result.get("ai_generated", False),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "draft"
    }
    
    MEETINGS[meeting_id] = meeting_record
    
    # Generate compliance log
    compliance_entry = generate_compliance_log(meeting_id, meeting_record)
    
    return {
        "success": True,
        "meeting_id": meeting_id,
        "meeting": meeting_record,
        "compliance_entry": compliance_entry,
        "next_steps": [
            "Review and edit the generated notes",
            "Complete compliance checklist",
            "Finalize and send to client if required"
        ]
    }


@router.get("/meeting/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get meeting details and notes."""
    if meeting_id not in MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return MEETINGS[meeting_id]


@router.put("/meeting/{meeting_id}")
async def update_meeting(meeting_id: str, request: MeetingUpdateRequest):
    """Update meeting notes or details."""
    if meeting_id not in MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting = MEETINGS[meeting_id]
    
    # Update nested notes if field starts with "notes."
    if request.field.startswith("notes."):
        nested_field = request.field.replace("notes.", "")
        meeting["notes"][nested_field] = request.value
    else:
        meeting[request.field] = request.value
    
    meeting["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "meeting": meeting
    }


@router.post("/meeting/{meeting_id}/finalize")
async def finalize_meeting(meeting_id: str):
    """Finalize meeting notes and mark compliance as complete."""
    if meeting_id not in MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting = MEETINGS[meeting_id]
    meeting["status"] = "finalized"
    meeting["finalized_at"] = datetime.now(timezone.utc).isoformat()
    
    # Update compliance log
    for log in COMPLIANCE_LOGS:
        if log["meeting_id"] == meeting_id:
            log["review_status"] = "approved"
            log["reviewed_at"] = datetime.now(timezone.utc).isoformat()
            break
    
    return {
        "success": True,
        "meeting": meeting,
        "message": "Meeting notes finalized and compliance log updated"
    }


@router.get("/meetings")
async def list_meetings(
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """List all meetings with optional filters."""
    meetings = list(MEETINGS.values())
    
    if client_id:
        meetings = [m for m in meetings if m.get("client_id") == client_id]
    if status:
        meetings = [m for m in meetings if m.get("status") == status]
    
    meetings.sort(key=lambda x: x.get("meeting_date", ""), reverse=True)
    
    return {
        "meetings": meetings[:limit],
        "total": len(meetings)
    }


@router.get("/compliance-logs")
async def get_compliance_logs(
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """Get compliance logs with optional filters."""
    logs = COMPLIANCE_LOGS.copy()
    
    if client_id:
        logs = [l for l in logs if l.get("client_id") == client_id]
    if status:
        logs = [l for l in logs if l.get("review_status") == status]
    
    logs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {
        "logs": logs[:limit],
        "total": len(logs),
        "pending_review": len([l for l in logs if l.get("review_status") == "pending"])
    }


@router.post("/generate-follow-up-email")
async def generate_follow_up_email(meeting_id: str):
    """Generate a follow-up email for the client after a meeting."""
    if meeting_id not in MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting = MEETINGS[meeting_id]
    
    if AI_AVAILABLE:
        try:
            prompt = f"""Generate a professional follow-up email to send to a financial advice client after a meeting.

Client: {meeting['client_name']}
Meeting Type: {meeting['meeting_type']}
Meeting Date: {meeting['meeting_date']}
Key Discussion Points: {', '.join(meeting['notes'].get('key_points', ['General review']))}
Action Items: {meeting['notes'].get('action_items', [])}

Generate a warm, professional email that:
1. Thanks them for their time
2. Summarizes key discussion points
3. Lists agreed action items
4. Provides next steps
5. Includes standard compliance footer

Keep it concise and professional."""

            messages = [LlmMessage(role="user", content=prompt)]
            response = chat(
                api_key=os.environ.get("EMERGENT_LLM_KEY"),
                model="claude-sonnet-4-20250514",
                messages=messages,
                temperature=0.5
            )
            
            return {
                "success": True,
                "email_content": response.content,
                "ai_generated": True,
                "meeting_id": meeting_id
            }
        except Exception as e:
            logger.error(f"Email generation failed: {e}")
    
    # Fallback template
    action_items_text = "\n".join([
        f"- {item.get('item', item) if isinstance(item, dict) else item}" 
        for item in meeting['notes'].get('action_items', ['Review meeting discussion'])
    ])
    
    email_template = f"""Dear {meeting['client_name']},

Thank you for taking the time to meet with us on {meeting['meeting_date']}. It was a pleasure discussing your financial situation and goals.

Key Points from Our Meeting:
{chr(10).join(['- ' + point for point in meeting['notes'].get('key_points', ['General financial review'])])}

Agreed Action Items:
{action_items_text}

We will be in touch regarding the next steps. In the meantime, please don't hesitate to contact us if you have any questions.

Best regards,
Your Financial Adviser

---
Disclaimer: This email is a summary of our meeting discussion. It does not constitute personal financial advice. Please refer to your Statement of Advice for detailed recommendations.
"""
    
    return {
        "success": True,
        "email_content": email_template,
        "ai_generated": False,
        "meeting_id": meeting_id
    }


@router.post("/voice-to-notes")
async def voice_to_notes(
    client_id: str,
    client_name: str,
    audio_transcript: str,
    meeting_type: str = "ad_hoc"
):
    """Convert voice transcript to structured meeting notes."""
    # Create a MeetingNotesRequest from the transcript
    request = MeetingNotesRequest(
        client_id=client_id,
        client_name=client_name,
        meeting_date=datetime.now().strftime("%Y-%m-%d"),
        meeting_type=meeting_type,
        attendees=["Adviser", client_name],
        topics_discussed=["See transcript"],
        transcript=audio_transcript
    )
    
    return await generate_meeting_notes(request)
