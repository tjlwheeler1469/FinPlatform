"""
Fathom AI Meeting Notes Integration
Integrates with Fathom.video API for automatic meeting transcription and AI summaries.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import logging
import os
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/fathom", tags=["Fathom Meeting Notes"])

# Fathom API configuration
FATHOM_API_URL = "https://api.fathom.video/v1"
FATHOM_API_KEY = os.environ.get("FATHOM_API_KEY", "")

# In-memory storage for meetings (would use MongoDB in production)
MEETINGS_STORE: Dict[str, Dict] = {}
MOCK_MODE = not FATHOM_API_KEY  # Use mock data if no API key


class MeetingCreate(BaseModel):
    title: str
    client_id: str
    client_name: str
    advisor_id: str
    advisor_name: str
    scheduled_time: str
    meeting_type: str = "video"  # video, in_person, phone
    platform: str = "zoom"  # zoom, teams, google_meet
    notes_before: Optional[str] = None
    agenda: Optional[List[str]] = None


class MeetingUpdate(BaseModel):
    status: Optional[str] = None
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    action_items: Optional[List[str]] = None
    key_topics: Optional[List[str]] = None


# Mock meeting data
MOCK_MEETINGS = {
    "MTG-DEMO001": {
        "meeting_id": "MTG-DEMO001",
        "fathom_id": "fathom_abc123",
        "title": "Quarterly Portfolio Review - Wheeler Family",
        "client_id": "client_1",
        "client_name": "James & Sarah Wheeler",
        "advisor_id": "advisor_1",
        "advisor_name": "Mark Thompson",
        "scheduled_time": "2025-12-15T10:00:00Z",
        "meeting_type": "video",
        "platform": "zoom",
        "status": "completed",
        "duration_minutes": 45,
        "created_at": "2025-12-10T09:00:00Z",
        "completed_at": "2025-12-15T10:45:00Z",
        "transcript": """
Mark: Good morning James, Sarah. Thanks for joining today's quarterly review.

James: Morning Mark, good to catch up.

Sarah: Hi Mark, we've been looking forward to this.

Mark: Let's start with your portfolio performance. Over the last quarter, you've seen a 4.2% return, which is ahead of the benchmark by about 0.8%. Your total portfolio is now sitting at $2.85 million.

James: That's great news. What's been driving the performance?

Mark: The equity holdings have done well, particularly the tech ETFs and BHP. CSL has been a bit flat but that's typical for healthcare stocks lately.

Sarah: What about our property allocation? I know the Parramatta unit has been performing well.

Mark: Yes, the investment property has appreciated about 3% this quarter. Rental yield is still strong at 4.2%. The family home in Mosman has also seen some growth, about 2% based on recent comparable sales.

James: We wanted to discuss increasing our super contributions before the end of the financial year. Is that still recommended?

Mark: Absolutely. Given your income levels, I'd recommend James maximizing his concessional contributions at $27,500, and Sarah should also contribute the maximum. This will give you significant tax benefits.

Sarah: What about the kids' education fund? We want to make sure Emily and Tom have enough when they need it.

Mark: The education fund is tracking well. You're at $85,000 against a $200,000 target. I'd suggest increasing the monthly contribution by $500 to ensure you hit the target by 2028.

James: One more thing - we've been thinking about reducing our exposure to banks. What do you think?

Mark: That's a reasonable consideration. You're currently overweight in financials at about 25%. I'd recommend trimming the CBA position and diversifying into international equities or perhaps some infrastructure.

Sarah: Great, let's do that.

Mark: I'll prepare a rebalancing proposal for you to review. Any other questions?

James: No, I think we're good. Thanks Mark.

Mark: Perfect. I'll send through the action items and follow up documents by end of week.
        """,
        "summary": """
**Meeting Summary - Wheeler Family Quarterly Review**

**Portfolio Performance:**
- Total portfolio value: $2.85M
- Quarterly return: 4.2% (0.8% above benchmark)
- Strong performance from tech ETFs and BHP
- Property appreciation of 3% on Parramatta investment

**Key Discussion Points:**
1. Super contributions - Recommended maximizing concessional contributions for both James and Sarah ($27,500 each)
2. Education fund - Currently $85,000 of $200,000 target; recommended increasing monthly contribution by $500
3. Sector allocation - Agreed to reduce bank exposure and diversify into international equities/infrastructure

**Decisions Made:**
- Proceed with maximum super contributions before EOFY
- Increase education fund contributions
- Rebalance portfolio to reduce financials exposure

**Next Steps:**
- Advisor to prepare rebalancing proposal
- Send follow-up documentation by end of week
- Schedule next review for Q2 2026
        """,
        "action_items": [
            "Prepare rebalancing proposal to reduce financials exposure",
            "Process maximum super contributions for James ($27,500)",
            "Process maximum super contributions for Sarah ($27,500)",
            "Increase education fund monthly contribution by $500",
            "Send meeting summary and documents by Friday",
            "Schedule Q2 2026 review meeting"
        ],
        "key_topics": [
            "Portfolio Performance",
            "Super Contributions",
            "Education Fund",
            "Sector Rebalancing",
            "Property Investment"
        ],
        "sentiment": "positive",
        "client_satisfaction": "high"
    }
}


async def fathom_api_request(method: str, endpoint: str, data: Dict = None) -> Dict:
    """Make a request to the Fathom API."""
    if MOCK_MODE:
        raise HTTPException(status_code=503, detail="Fathom API key not configured. Using mock mode.")
    
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {FATHOM_API_KEY}",
            "Content-Type": "application/json"
        }
        
        url = f"{FATHOM_API_URL}/{endpoint}"
        
        if method == "GET":
            response = await client.get(url, headers=headers)
        elif method == "POST":
            response = await client.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = await client.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = await client.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        if response.status_code >= 400:
            logger.error(f"Fathom API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail="Fathom API error")
        
        return response.json()


@router.get("/status")
async def get_fathom_status() -> dict:
    """Check Fathom integration status."""
    return {
        "status": "connected" if FATHOM_API_KEY else "mock_mode",
        "api_configured": bool(FATHOM_API_KEY),
        "mock_mode": MOCK_MODE,
        "capabilities": [
            "meeting_transcription",
            "ai_summary",
            "action_item_extraction",
            "topic_detection",
            "sentiment_analysis"
        ],
        "supported_platforms": ["zoom", "google_meet", "microsoft_teams"],
        "note": "Set FATHOM_API_KEY environment variable to enable live integration" if MOCK_MODE else "Live integration active"
    }


@router.post("/meetings")
async def create_meeting(meeting: MeetingCreate) -> dict:
    """Create a new meeting record."""
    meeting_id = f"MTG-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()
    
    meeting_record = {
        "meeting_id": meeting_id,
        "fathom_id": None,
        **meeting.model_dump(),
        "status": "scheduled",
        "created_at": created_at,
        "transcript": None,
        "summary": None,
        "action_items": [],
        "key_topics": []
    }
    
    MEETINGS_STORE[meeting_id] = meeting_record
    
    # If Fathom API is configured, create meeting in Fathom
    if not MOCK_MODE:
        try:
            fathom_response = await fathom_api_request("POST", "meetings", {
                "title": meeting.title,
                "scheduled_time": meeting.scheduled_time,
                "platform": meeting.platform
            })
            meeting_record["fathom_id"] = fathom_response.get("id")
        except Exception as e:
            logger.warning(f"Could not create Fathom meeting: {e}")
    
    return {
        "success": True,
        "meeting": meeting_record,
        "note": "Meeting created. Fathom will automatically capture notes when the meeting starts." if not MOCK_MODE else "Meeting created in mock mode."
    }


@router.get("/meetings/{meeting_id}")
async def get_meeting(meeting_id: str) -> dict:
    """Get meeting details including transcript and summary."""
    # Check stored meetings first
    if meeting_id in MEETINGS_STORE:
        return MEETINGS_STORE[meeting_id]
    
    # Check mock meetings
    if meeting_id in MOCK_MEETINGS:
        return MOCK_MEETINGS[meeting_id]
    
    # Try Fathom API
    if not MOCK_MODE:
        try:
            return await fathom_api_request("GET", f"meetings/{meeting_id}")
        except Exception:
            pass
    
    raise HTTPException(status_code=404, detail="Meeting not found")


@router.get("/meetings")
async def list_meetings(
    client_id: Optional[str] = None,
    advisor_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20
) -> dict:
    """List meetings with optional filters."""
    # Combine stored and mock meetings
    all_meetings = list(MEETINGS_STORE.values()) + list(MOCK_MEETINGS.values())
    
    # Apply filters
    if client_id:
        all_meetings = [m for m in all_meetings if m.get("client_id") == client_id]
    if advisor_id:
        all_meetings = [m for m in all_meetings if m.get("advisor_id") == advisor_id]
    if status:
        all_meetings = [m for m in all_meetings if m.get("status") == status]
    
    # Sort by scheduled time descending
    all_meetings.sort(key=lambda m: m.get("scheduled_time", ""), reverse=True)
    
    return {
        "meetings": all_meetings[:limit],
        "total_count": len(all_meetings),
        "mock_mode": MOCK_MODE
    }


@router.put("/meetings/{meeting_id}")
async def update_meeting(meeting_id: str, update: MeetingUpdate) -> dict:
    """Update meeting details."""
    if meeting_id not in MEETINGS_STORE and meeting_id not in MOCK_MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Get existing meeting
    meeting = MEETINGS_STORE.get(meeting_id) or MOCK_MEETINGS.get(meeting_id)
    
    # Apply updates
    update_data = update.model_dump(exclude_none=True)
    meeting.update(update_data)
    meeting["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Store updated meeting
    MEETINGS_STORE[meeting_id] = meeting
    
    return {
        "success": True,
        "meeting": meeting
    }


@router.post("/meetings/{meeting_id}/complete")
async def complete_meeting(meeting_id: str) -> dict:
    """Mark a meeting as complete and trigger AI processing."""
    if meeting_id not in MEETINGS_STORE and meeting_id not in MOCK_MEETINGS:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting = MEETINGS_STORE.get(meeting_id) or MOCK_MEETINGS.get(meeting_id)
    meeting["status"] = "completed"
    meeting["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    # In production, this would trigger Fathom's AI processing
    # For demo, we'll use the mock summary
    if not meeting.get("summary"):
        meeting["summary"] = "Meeting completed. AI summary generation in progress..."
        meeting["action_items"] = ["Review meeting recording", "Follow up on discussed items"]
    
    MEETINGS_STORE[meeting_id] = meeting
    
    return {
        "success": True,
        "meeting": meeting,
        "note": "Meeting marked as complete. AI processing initiated."
    }


@router.get("/meetings/{meeting_id}/transcript")
async def get_meeting_transcript(meeting_id: str) -> dict:
    """Get the full meeting transcript."""
    meeting = None
    
    if meeting_id in MEETINGS_STORE:
        meeting = MEETINGS_STORE[meeting_id]
    elif meeting_id in MOCK_MEETINGS:
        meeting = MOCK_MEETINGS[meeting_id]
    else:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    return {
        "meeting_id": meeting_id,
        "title": meeting.get("title"),
        "transcript": meeting.get("transcript"),
        "duration_minutes": meeting.get("duration_minutes"),
        "speakers": ["Mark Thompson", meeting.get("client_name", "Client")]
    }


@router.get("/meetings/{meeting_id}/summary")
async def get_meeting_summary(meeting_id: str) -> dict:
    """Get the AI-generated meeting summary."""
    meeting = None
    
    if meeting_id in MEETINGS_STORE:
        meeting = MEETINGS_STORE[meeting_id]
    elif meeting_id in MOCK_MEETINGS:
        meeting = MOCK_MEETINGS[meeting_id]
    else:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    return {
        "meeting_id": meeting_id,
        "title": meeting.get("title"),
        "summary": meeting.get("summary"),
        "key_topics": meeting.get("key_topics", []),
        "action_items": meeting.get("action_items", []),
        "sentiment": meeting.get("sentiment"),
        "client_satisfaction": meeting.get("client_satisfaction")
    }


@router.get("/meetings/{meeting_id}/action-items")
async def get_meeting_action_items(meeting_id: str) -> dict:
    """Get extracted action items from a meeting."""
    meeting = None
    
    if meeting_id in MEETINGS_STORE:
        meeting = MEETINGS_STORE[meeting_id]
    elif meeting_id in MOCK_MEETINGS:
        meeting = MOCK_MEETINGS[meeting_id]
    else:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    action_items = meeting.get("action_items", [])
    
    return {
        "meeting_id": meeting_id,
        "title": meeting.get("title"),
        "action_items": [
            {
                "id": f"AI-{i+1}",
                "description": item,
                "status": "pending",
                "assigned_to": meeting.get("advisor_name"),
                "due_date": None
            }
            for i, item in enumerate(action_items)
        ],
        "total_count": len(action_items)
    }


@router.post("/meetings/{meeting_id}/action-items/{item_id}/complete")
async def complete_action_item(meeting_id: str, item_id: str) -> dict:
    """Mark an action item as complete."""
    return {
        "success": True,
        "meeting_id": meeting_id,
        "item_id": item_id,
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/client/{client_id}/meetings")
async def get_client_meetings(client_id: str, limit: int = 10) -> dict:
    """Get all meetings for a specific client."""
    return await list_meetings(client_id=client_id, limit=limit)


@router.get("/advisor/{advisor_id}/meetings")
async def get_advisor_meetings(advisor_id: str, limit: int = 20) -> dict:
    """Get all meetings for a specific advisor."""
    return await list_meetings(advisor_id=advisor_id, limit=limit)


@router.post("/webhook/fathom")
async def fathom_webhook(payload: Dict[str, Any]) -> dict:
    """
    Webhook endpoint for Fathom callbacks.
    Fathom will call this when meeting transcription/summary is ready.
    """
    event_type = payload.get("event")
    fathom_meeting_id = payload.get("meeting_id")
    
    logger.info(f"Received Fathom webhook: {event_type} for meeting {fathom_meeting_id}")
    
    # Find matching meeting
    matching_meeting = None
    for meeting_id, meeting in MEETINGS_STORE.items():
        if meeting.get("fathom_id") == fathom_meeting_id:
            matching_meeting = meeting
            break
    
    if not matching_meeting:
        logger.warning(f"No matching meeting found for Fathom ID: {fathom_meeting_id}")
        return {"status": "no_matching_meeting"}
    
    # Handle different event types
    if event_type == "transcription.complete":
        matching_meeting["transcript"] = payload.get("transcript")
        matching_meeting["status"] = "transcribed"
        
    elif event_type == "summary.complete":
        matching_meeting["summary"] = payload.get("summary")
        matching_meeting["action_items"] = payload.get("action_items", [])
        matching_meeting["key_topics"] = payload.get("key_topics", [])
        matching_meeting["status"] = "completed"
    
    elif event_type == "meeting.ended":
        matching_meeting["duration_minutes"] = payload.get("duration_minutes")
        matching_meeting["completed_at"] = payload.get("ended_at")
    
    return {"status": "processed", "event": event_type}
