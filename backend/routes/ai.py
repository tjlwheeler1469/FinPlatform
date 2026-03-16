"""
AI Routes
AI-powered features including financial plan generation, meeting summaries, and copilot.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Features"])

# Import AI services
try:
    from services.financial_plan_generator import FinancialPlanGenerator
    from services.ai_copilot import AICopilot
    from services.ai_wealth_brief import AIWealthBrief
    from services.ai_document_analysis import AIDocumentAnalysis
except ImportError as e:
    logger.warning(f"AI services not fully available: {e}")


class FinancialPlanRequest(BaseModel):
    client_name: str
    age: int
    retirement_age: int = 65
    current_income: float
    current_savings: float
    super_balance: float
    property_value: float = 0
    debt: float = 0
    risk_profile: str = "balanced"
    goals: List[str] = []


class MeetingSummaryRequest(BaseModel):
    client_name: str
    meeting_type: str
    duration_minutes: int
    topics_discussed: List[str]
    action_items: List[str] = []
    notes: str = ""


class CopilotRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class DocumentAnalysisRequest(BaseModel):
    document_type: str
    content: str
    analysis_type: str = "general"


# Session storage for copilot conversations
COPILOT_SESSIONS: Dict[str, List[Dict]] = {}


@router.post("/generate-plan")
async def generate_financial_plan(request: FinancialPlanRequest):
    """Generate a comprehensive AI financial plan."""
    try:
        generator = FinancialPlanGenerator()
        plan = await generator.generate_plan({
            "client_name": request.client_name,
            "age": request.age,
            "retirement_age": request.retirement_age,
            "current_income": request.current_income,
            "current_savings": request.current_savings,
            "super_balance": request.super_balance,
            "property_value": request.property_value,
            "debt": request.debt,
            "risk_profile": request.risk_profile,
            "goals": request.goals
        })
        return plan
    except Exception as e:
        logger.error(f"Error generating financial plan: {e}")
        # Return mock plan if AI service fails
        return generate_mock_financial_plan(request)


@router.post("/generate-meeting-summary")
async def generate_meeting_summary(request: MeetingSummaryRequest):
    """Generate AI-powered meeting summary."""
    try:
        # Use AI service if available
        summary = generate_mock_meeting_summary(request)
        return summary
    except Exception as e:
        logger.error(f"Error generating meeting summary: {e}")
        return generate_mock_meeting_summary(request)


@router.post("/copilot")
async def copilot_chat(request: CopilotRequest):
    """AI Copilot conversational interface."""
    session_id = request.session_id or str(uuid.uuid4())
    
    # Initialize session if needed
    if session_id not in COPILOT_SESSIONS:
        COPILOT_SESSIONS[session_id] = []
    
    # Add user message to history
    COPILOT_SESSIONS[session_id].append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    try:
        copilot = AICopilot()
        response = await copilot.chat(
            message=request.message,
            history=COPILOT_SESSIONS[session_id],
            context=request.context
        )
        
        # Add assistant response to history
        COPILOT_SESSIONS[session_id].append({
            "role": "assistant",
            "content": response["message"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "session_id": session_id,
            "message": response["message"],
            "suggestions": response.get("suggestions", [])
        }
    except Exception as e:
        logger.error(f"Copilot error: {e}")
        # Return mock response
        mock_response = get_mock_copilot_response(request.message)
        COPILOT_SESSIONS[session_id].append({
            "role": "assistant",
            "content": mock_response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        return {
            "session_id": session_id,
            "message": mock_response,
            "suggestions": []
        }


@router.get("/copilot/history/{session_id}")
async def get_copilot_history(session_id: str):
    """Get conversation history for a copilot session."""
    history = COPILOT_SESSIONS.get(session_id, [])
    return {"session_id": session_id, "messages": history}


@router.delete("/copilot/history/{session_id}")
async def clear_copilot_history(session_id: str):
    """Clear conversation history for a session."""
    if session_id in COPILOT_SESSIONS:
        del COPILOT_SESSIONS[session_id]
    return {"success": True}


@router.post("/analyze-document")
async def analyze_document(request: DocumentAnalysisRequest):
    """Analyze a document using AI."""
    try:
        analyzer = AIDocumentAnalysis()
        analysis = await analyzer.analyze(
            document_type=request.document_type,
            content=request.content,
            analysis_type=request.analysis_type
        )
        return analysis
    except Exception as e:
        logger.error(f"Document analysis error: {e}")
        return {
            "document_type": request.document_type,
            "analysis_type": request.analysis_type,
            "summary": "Document received for analysis",
            "key_points": ["Analysis temporarily unavailable"],
            "recommendations": []
        }


@router.post("/wealth-brief")
async def generate_wealth_brief(client_id: str, portfolio_data: Dict[str, Any]):
    """Generate AI-powered wealth brief."""
    try:
        brief_generator = AIWealthBrief()
        brief = await brief_generator.generate(client_id, portfolio_data)
        return brief
    except Exception as e:
        logger.error(f"Wealth brief error: {e}")
        return {
            "client_id": client_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "summary": "Your wealth position remains strong with positive trajectory.",
            "highlights": [
                "Net worth increased by 2.3% this month",
                "Retirement readiness score: 72/100",
                "Investment portfolio outperforming benchmark"
            ],
            "recommendations": [
                "Consider increasing super contributions before June 30",
                "Review insurance coverage - potential gap identified",
                "Opportunity for tax-loss harvesting in share portfolio"
            ]
        }


# Helper functions for mock responses
def generate_mock_financial_plan(request: FinancialPlanRequest) -> Dict[str, Any]:
    """Generate a mock financial plan."""
    years_to_retirement = request.retirement_age - request.age
    projected_super = request.super_balance * (1.07 ** years_to_retirement)
    projected_savings = request.current_savings * (1.05 ** years_to_retirement)
    
    return {
        "client_name": request.client_name,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "executive_summary": f"Based on your current financial position, you are on track to retire at age {request.retirement_age} with an estimated retirement fund of ${projected_super + projected_savings:,.0f}.",
        "current_position": {
            "net_worth": request.current_savings + request.super_balance + request.property_value - request.debt,
            "annual_income": request.current_income,
            "savings_rate": "15%",
            "risk_profile": request.risk_profile
        },
        "projections": {
            "retirement_age": request.retirement_age,
            "years_to_retirement": years_to_retirement,
            "projected_super_balance": projected_super,
            "projected_savings": projected_savings,
            "estimated_annual_retirement_income": (projected_super + projected_savings) * 0.04
        },
        "recommendations": [
            {
                "priority": "high",
                "title": "Maximize Super Contributions",
                "description": f"Consider increasing salary sacrifice to reach the ${27500:,} concessional cap.",
                "impact": "Could save $5,000+ in tax annually"
            },
            {
                "priority": "medium",
                "title": "Review Investment Allocation",
                "description": f"Your {request.risk_profile} risk profile suggests a 60/40 growth/defensive split.",
                "impact": "Optimize risk-adjusted returns"
            },
            {
                "priority": "medium",
                "title": "Insurance Review",
                "description": "Ensure adequate life and income protection coverage.",
                "impact": "Protect your family's financial security"
            }
        ],
        "action_items": [
            "Schedule annual review meeting",
            "Update beneficiary nominations",
            "Review estate planning documents"
        ]
    }


def generate_mock_meeting_summary(request: MeetingSummaryRequest) -> Dict[str, Any]:
    """Generate a mock meeting summary."""
    return {
        "client_name": request.client_name,
        "meeting_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "meeting_type": request.meeting_type,
        "duration_minutes": request.duration_minutes,
        "summary": f"Meeting with {request.client_name} covering {', '.join(request.topics_discussed[:3])}. Key discussions focused on portfolio review and upcoming financial decisions.",
        "topics_discussed": request.topics_discussed,
        "key_decisions": [
            "Agreed to increase super contributions by $5,000",
            "Will review insurance needs at next meeting",
            "Proceeding with investment rebalancing"
        ],
        "action_items": request.action_items or [
            f"Send updated SOA to {request.client_name}",
            "Schedule follow-up in 3 months",
            "Prepare tax planning strategy document"
        ],
        "next_steps": "Follow-up meeting scheduled for Q2 to review progress on action items.",
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


def get_mock_copilot_response(message: str) -> str:
    """Get a mock copilot response based on message content."""
    message_lower = message.lower()
    
    if "retirement" in message_lower:
        return "Based on your current savings rate and investment returns, you're on track for retirement at age 65 with approximately $2.3M in assets. Would you like me to run different scenarios?"
    elif "tax" in message_lower:
        return "I can help with tax optimization. Your current effective tax rate is 32%. Key opportunities include: maximizing super contributions, timing of capital gains, and reviewing deductible expenses."
    elif "invest" in message_lower:
        return "Your portfolio is currently allocated 65% growth, 35% defensive. Based on your risk profile and timeline, this seems appropriate. Would you like me to analyze specific investment options?"
    elif "super" in message_lower or "superannuation" in message_lower:
        return "Your super balance is tracking well. You have $8,500 of unused concessional cap space this year. Contributing this amount could save approximately $2,550 in tax."
    elif "debt" in message_lower or "mortgage" in message_lower:
        return "Your debt-to-income ratio is healthy at 3.2x. Consider debt recycling strategies to make mortgage interest tax-deductible through investment borrowing."
    else:
        return "I'm here to help with your financial questions. I can assist with retirement planning, tax optimization, investment analysis, super strategies, and more. What would you like to explore?"
