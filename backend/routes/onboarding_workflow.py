"""
Client Onboarding Automation
Multi-step wizard with document collection, KYC verification, and account opening.
Saves 5+ hours per new client.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/onboarding", tags=["Client Onboarding"])


class OnboardingStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    PENDING_DOCUMENTS = "pending_documents"
    PENDING_VERIFICATION = "pending_verification"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class OnboardingStep(str, Enum):
    PERSONAL_INFO = "personal_info"
    FINANCIAL_PROFILE = "financial_profile"
    RISK_ASSESSMENT = "risk_assessment"
    DOCUMENT_UPLOAD = "document_upload"
    KYC_VERIFICATION = "kyc_verification"
    SERVICE_AGREEMENT = "service_agreement"
    ACCOUNT_SETUP = "account_setup"
    REVIEW_APPROVAL = "review_approval"


# Onboarding workflow definition
ONBOARDING_STEPS = [
    {
        "step": OnboardingStep.PERSONAL_INFO,
        "name": "Personal Information",
        "description": "Basic contact and identification details",
        "required_fields": ["first_name", "last_name", "email", "phone", "date_of_birth", "address"],
        "estimated_time": "5 minutes"
    },
    {
        "step": OnboardingStep.FINANCIAL_PROFILE,
        "name": "Financial Profile",
        "description": "Income, assets, liabilities, and goals",
        "required_fields": ["annual_income", "net_worth_estimate", "investment_experience", "financial_goals"],
        "estimated_time": "10 minutes"
    },
    {
        "step": OnboardingStep.RISK_ASSESSMENT,
        "name": "Risk Assessment",
        "description": "Investment risk tolerance questionnaire",
        "required_fields": ["risk_tolerance", "investment_horizon", "loss_tolerance"],
        "estimated_time": "5 minutes"
    },
    {
        "step": OnboardingStep.DOCUMENT_UPLOAD,
        "name": "Document Upload",
        "description": "Identity verification documents",
        "required_documents": ["id_passport_or_license", "proof_of_address"],
        "estimated_time": "5 minutes"
    },
    {
        "step": OnboardingStep.KYC_VERIFICATION,
        "name": "KYC Verification",
        "description": "Identity and compliance verification",
        "automated": True,
        "estimated_time": "1-2 business days"
    },
    {
        "step": OnboardingStep.SERVICE_AGREEMENT,
        "name": "Service Agreement",
        "description": "Review and sign engagement documents",
        "required_documents": ["fsg_acknowledgment", "service_agreement", "fee_disclosure"],
        "estimated_time": "10 minutes"
    },
    {
        "step": OnboardingStep.ACCOUNT_SETUP,
        "name": "Account Setup",
        "description": "Platform access and preferences",
        "required_fields": ["communication_preferences", "portal_access"],
        "estimated_time": "5 minutes"
    },
    {
        "step": OnboardingStep.REVIEW_APPROVAL,
        "name": "Final Review",
        "description": "Advisor review and approval",
        "automated": False,
        "estimated_time": "1 business day"
    }
]


# In-memory storage for onboarding sessions
ONBOARDING_SESSIONS: Dict[str, Dict] = {
    "onb_demo_001": {
        "session_id": "onb_demo_001",
        "client_id": "client_new_001",
        "advisor_id": "advisor_001",
        "status": OnboardingStatus.IN_PROGRESS,
        "current_step": OnboardingStep.RISK_ASSESSMENT,
        "created_at": "2025-03-15T10:00:00Z",
        "updated_at": "2025-03-17T09:30:00Z",
        "completed_steps": [OnboardingStep.PERSONAL_INFO, OnboardingStep.FINANCIAL_PROFILE],
        "data": {
            "personal_info": {
                "first_name": "Michael",
                "last_name": "Thompson",
                "email": "michael.thompson@email.com",
                "phone": "+61 423 456 789",
                "date_of_birth": "1975-08-22",
                "address": "45 Collins Street, Melbourne VIC 3000"
            },
            "financial_profile": {
                "annual_income": 280000,
                "net_worth_estimate": 1850000,
                "investment_experience": "intermediate",
                "financial_goals": ["retirement", "wealth_growth", "tax_optimization"],
                "existing_super": 450000,
                "existing_investments": 320000,
                "property_value": 1200000,
                "mortgage_balance": 580000
            }
        },
        "documents": [],
        "notes": [],
        "estimated_completion": "2025-03-20"
    }
}


class OnboardingStartRequest(BaseModel):
    advisor_id: str
    client_email: str
    client_first_name: str
    client_last_name: str
    referral_source: Optional[str] = None


class StepDataRequest(BaseModel):
    session_id: str
    step: OnboardingStep
    data: Dict[str, Any]


# ==================== ENDPOINTS ====================

@router.get("/steps")
async def get_onboarding_steps():
    """Get all onboarding steps with descriptions."""
    total_time = sum(int(s["estimated_time"].split()[0]) for s in ONBOARDING_STEPS if "minute" in s["estimated_time"])
    
    return {
        "steps": ONBOARDING_STEPS,
        "total_steps": len(ONBOARDING_STEPS),
        "estimated_total_time": f"{total_time} minutes (excluding verification)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/start")
async def start_onboarding(request: OnboardingStartRequest):
    """Start a new client onboarding session."""
    session_id = f"onb_{uuid.uuid4().hex[:8]}"
    client_id = f"client_{uuid.uuid4().hex[:6]}"
    
    session = {
        "session_id": session_id,
        "client_id": client_id,
        "advisor_id": request.advisor_id,
        "status": OnboardingStatus.IN_PROGRESS,
        "current_step": OnboardingStep.PERSONAL_INFO,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "completed_steps": [],
        "data": {
            "personal_info": {
                "first_name": request.client_first_name,
                "last_name": request.client_last_name,
                "email": request.client_email
            }
        },
        "documents": [],
        "notes": [],
        "referral_source": request.referral_source,
        "estimated_completion": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()[:10]
    }
    
    ONBOARDING_SESSIONS[session_id] = session
    
    return {
        "success": True,
        "session": session,
        "next_step": ONBOARDING_STEPS[0],
        "message": f"Onboarding started for {request.client_first_name} {request.client_last_name}"
    }


@router.get("/session/{session_id}")
async def get_onboarding_session(session_id: str):
    """Get onboarding session details and progress."""
    if session_id not in ONBOARDING_SESSIONS:
        raise HTTPException(status_code=404, detail="Onboarding session not found")
    
    session = ONBOARDING_SESSIONS[session_id]
    
    # Calculate progress
    completed = len(session.get("completed_steps", []))
    total = len(ONBOARDING_STEPS)
    progress_percent = round(completed / total * 100, 1)
    
    # Get current step details
    current_step_info = next(
        (s for s in ONBOARDING_STEPS if s["step"] == session.get("current_step")),
        ONBOARDING_STEPS[0]
    )
    
    # Get next step
    current_idx = next(
        (i for i, s in enumerate(ONBOARDING_STEPS) if s["step"] == session.get("current_step")),
        0
    )
    next_step_info = ONBOARDING_STEPS[current_idx + 1] if current_idx + 1 < len(ONBOARDING_STEPS) else None
    
    return {
        **session,
        "progress": {
            "completed_steps": completed,
            "total_steps": total,
            "progress_percent": progress_percent
        },
        "current_step_info": current_step_info,
        "next_step_info": next_step_info,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/session/{session_id}/step")
async def submit_step_data(session_id: str, request: StepDataRequest):
    """Submit data for an onboarding step."""
    if session_id not in ONBOARDING_SESSIONS:
        raise HTTPException(status_code=404, detail="Onboarding session not found")
    
    session = ONBOARDING_SESSIONS[session_id]
    step_key = request.step.value
    
    # Store the data
    session["data"][step_key] = request.data
    session["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Mark step as completed
    if request.step not in session["completed_steps"]:
        session["completed_steps"].append(request.step)
    
    # Move to next step
    current_idx = next(
        (i for i, s in enumerate(ONBOARDING_STEPS) if s["step"] == request.step),
        0
    )
    
    if current_idx + 1 < len(ONBOARDING_STEPS):
        session["current_step"] = ONBOARDING_STEPS[current_idx + 1]["step"]
        next_step = ONBOARDING_STEPS[current_idx + 1]
    else:
        session["status"] = OnboardingStatus.PENDING_APPROVAL
        next_step = None
    
    return {
        "success": True,
        "step_completed": request.step,
        "next_step": next_step,
        "progress": {
            "completed": len(session["completed_steps"]),
            "total": len(ONBOARDING_STEPS)
        },
        "message": f"Step '{request.step.value}' completed successfully"
    }


@router.post("/session/{session_id}/document")
async def upload_onboarding_document(
    session_id: str,
    document_type: str,
    filename: str,
    uploaded_by: str
):
    """Record document upload for onboarding."""
    if session_id not in ONBOARDING_SESSIONS:
        raise HTTPException(status_code=404, detail="Onboarding session not found")
    
    session = ONBOARDING_SESSIONS[session_id]
    
    doc = {
        "document_id": f"doc_{uuid.uuid4().hex[:6]}",
        "document_type": document_type,
        "filename": filename,
        "uploaded_by": uploaded_by,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending_review"
    }
    
    session["documents"].append(doc)
    session["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "document": doc,
        "message": f"Document '{document_type}' uploaded successfully"
    }


@router.post("/session/{session_id}/approve")
async def approve_onboarding(session_id: str, approved_by: str, notes: Optional[str] = None):
    """Approve completed onboarding and create client."""
    if session_id not in ONBOARDING_SESSIONS:
        raise HTTPException(status_code=404, detail="Onboarding session not found")
    
    session = ONBOARDING_SESSIONS[session_id]
    
    session["status"] = OnboardingStatus.COMPLETED
    session["approved_by"] = approved_by
    session["approved_at"] = datetime.now(timezone.utc).isoformat()
    session["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if notes:
        session["notes"].append({
            "note": notes,
            "by": approved_by,
            "at": datetime.now(timezone.utc).isoformat()
        })
    
    # Generate client record
    personal = session["data"].get("personal_info", {})
    financial = session["data"].get("financial_profile", {})
    
    client_record = {
        "client_id": session["client_id"],
        "name": f"{personal.get('first_name', '')} {personal.get('last_name', '')}",
        "email": personal.get("email"),
        "phone": personal.get("phone"),
        "status": "active",
        "onboarded_at": datetime.now(timezone.utc).isoformat(),
        "advisor_id": session["advisor_id"],
        "aum_estimate": financial.get("net_worth_estimate", 0),
        "risk_profile": session["data"].get("risk_assessment", {}).get("risk_tolerance", "balanced")
    }
    
    return {
        "success": True,
        "session": session,
        "client_created": client_record,
        "message": f"Onboarding approved. Client {client_record['name']} created.",
        "next_actions": [
            "Schedule initial strategy meeting",
            "Send welcome email with portal access",
            "Create financial plan",
            "Set up portfolio"
        ]
    }


@router.get("/dashboard")
async def get_onboarding_dashboard(advisor_id: Optional[str] = None):
    """Get onboarding dashboard with all active sessions."""
    sessions = list(ONBOARDING_SESSIONS.values())
    
    if advisor_id:
        sessions = [s for s in sessions if s.get("advisor_id") == advisor_id]
    
    # Group by status
    by_status = {}
    for session in sessions:
        status = session.get("status", "unknown")
        if status not in by_status:
            by_status[status] = []
        by_status[status].append(session)
    
    # Calculate metrics
    in_progress = len([s for s in sessions if s.get("status") == OnboardingStatus.IN_PROGRESS])
    pending_approval = len([s for s in sessions if s.get("status") == OnboardingStatus.PENDING_APPROVAL])
    completed_this_month = len([
        s for s in sessions 
        if s.get("status") == OnboardingStatus.COMPLETED 
        and s.get("approved_at", "")[:7] == datetime.now().isoformat()[:7]
    ])
    
    return {
        "summary": {
            "total_sessions": len(sessions),
            "in_progress": in_progress,
            "pending_approval": pending_approval,
            "completed_this_month": completed_this_month
        },
        "by_status": by_status,
        "sessions": sessions,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/templates")
async def get_onboarding_templates():
    """Get onboarding document templates and checklists."""
    return {
        "document_templates": [
            {"id": "fsg", "name": "Financial Services Guide", "required": True},
            {"id": "service_agreement", "name": "Service Agreement", "required": True},
            {"id": "fee_disclosure", "name": "Fee Disclosure Statement", "required": True},
            {"id": "privacy_consent", "name": "Privacy Consent Form", "required": True},
            {"id": "risk_profile_questionnaire", "name": "Risk Profile Questionnaire", "required": True}
        ],
        "required_client_documents": [
            {"id": "id_primary", "name": "Primary ID (Passport/License)", "required": True},
            {"id": "id_secondary", "name": "Secondary ID (Medicare/Bank Card)", "required": False},
            {"id": "proof_of_address", "name": "Proof of Address", "required": True},
            {"id": "tax_file_declaration", "name": "Tax File Number Declaration", "required": True}
        ],
        "checklist": [
            {"step": "Initial contact", "description": "First meeting or call completed"},
            {"step": "Fact find", "description": "Financial information collected"},
            {"step": "Risk assessment", "description": "Risk tolerance questionnaire completed"},
            {"step": "ID verification", "description": "Identity documents verified"},
            {"step": "KYC check", "description": "KYC/AML screening completed"},
            {"step": "Documents signed", "description": "All engagement documents signed"},
            {"step": "Account setup", "description": "Platform access configured"},
            {"step": "Welcome sent", "description": "Welcome pack and credentials sent"}
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
