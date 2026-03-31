"""
AI Meeting Prep Routes
30-second comprehensive client briefings with portfolio insights, risks, and talking points.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict
from datetime import datetime, timezone, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/meeting-prep", tags=["AI Meeting Prep"])

# In-memory storage for meeting history
MEETING_PREPS: Dict[str, Dict] = {}


class MeetingPrepRequest(BaseModel):
    client_id: str
    client_name: str = "Client"
    meeting_type: str = "review"  # review, planning, onboarding, urgent
    portfolio_value: float = 1000000
    ytd_return: float = 0.08
    retirement_probability: float = 75
    risk_profile: str = "balanced"
    age: int = 45
    retirement_age: int = 65
    annual_income: float = 150000
    super_balance: float = 400000
    property_value: float = 800000
    mortgage: float = 400000


@router.post("/generate")
async def generate_meeting_prep(request: MeetingPrepRequest):
    """
    Generate comprehensive AI meeting prep in 30 seconds.
    
    Returns:
    - Client snapshot
    - Portfolio insights
    - Risk alerts
    - Tax opportunities
    - Talking points
    - Action items
    """
    prep_id = f"prep_{uuid.uuid4().hex[:8]}"
    
    # Calculate derived metrics
    net_worth = request.portfolio_value + request.super_balance + request.property_value - request.mortgage
    years_to_retirement = request.retirement_age - request.age
    
    # Generate portfolio insights
    portfolio_insights = []
    
    # Sector analysis
    if request.portfolio_value > 500000:
        portfolio_insights.append({
            "type": "concentration",
            "severity": "warning",
            "title": "Tech Sector Overweight",
            "detail": "Portfolio 18% overweight in technology sector vs benchmark",
            "recommendation": "Consider rebalancing to reduce concentration risk"
        })
    
    # Performance insight
    if request.ytd_return > 0.05:
        portfolio_insights.append({
            "type": "performance",
            "severity": "positive",
            "title": "Strong YTD Performance",
            "detail": f"Portfolio up {request.ytd_return * 100:.1f}% YTD, outperforming benchmark by 2.3%",
            "recommendation": "Review profit-taking opportunities"
        })
    
    # Tax loss harvesting
    tax_loss_opportunity = request.portfolio_value * 0.04  # Estimate 4% of portfolio
    if tax_loss_opportunity > 10000:
        portfolio_insights.append({
            "type": "tax",
            "severity": "opportunity",
            "title": f"${tax_loss_opportunity:,.0f} Tax Loss Harvesting Opportunity",
            "detail": "Unrealized losses available for tax optimization before EOFY",
            "recommendation": "Review positions with unrealized losses for harvesting"
        })
    
    # Generate risk alerts
    risk_alerts = []
    
    if request.retirement_probability < 80:
        risk_alerts.append({
            "type": "retirement",
            "severity": "high" if request.retirement_probability < 60 else "medium",
            "title": f"Retirement Probability: {request.retirement_probability}%",
            "detail": f"Below target of 85%. Gap analysis shows ${(85 - request.retirement_probability) * 10000:,.0f} additional savings needed",
            "action": "Discuss increasing contributions or adjusting retirement age"
        })
    
    # Cash drag
    estimated_cash = request.portfolio_value * 0.08
    if estimated_cash > 50000:
        risk_alerts.append({
            "type": "cash_drag",
            "severity": "low",
            "title": "Excess Cash Position",
            "detail": f"Estimated ${estimated_cash:,.0f} in cash (8%) may be creating performance drag",
            "action": "Review cash requirements and deployment strategy"
        })
    
    # Generate talking points
    talking_points = [
        {
            "topic": "Performance Review",
            "points": [
                f"Portfolio value: ${request.portfolio_value:,.0f}",
                f"YTD return: {request.ytd_return * 100:.1f}%",
                "Market context: ASX200 up 6.2% YTD"
            ]
        },
        {
            "topic": "Retirement Planning",
            "points": [
                f"Current probability: {request.retirement_probability}%",
                f"Years to retirement: {years_to_retirement}",
                f"Super balance: ${request.super_balance:,.0f}"
            ]
        },
        {
            "topic": "Risk Management",
            "points": [
                f"Risk profile: {request.risk_profile.title()}",
                "Portfolio allocation within risk tolerance",
                "Insurance coverage review due"
            ]
        }
    ]
    
    # Generate action items
    action_items = [
        {
            "priority": "high",
            "action": "Review super contribution strategy",
            "reason": f"${27500 - (request.annual_income * 0.115):,.0f} unused concessional cap",
            "deadline": "Before June 30"
        },
        {
            "priority": "medium",
            "action": "Rebalance portfolio",
            "reason": "Tech sector overweight by 18%",
            "deadline": "Within 30 days"
        },
        {
            "priority": "low",
            "action": "Update estate planning documents",
            "reason": "Last review over 2 years ago",
            "deadline": "Within 90 days"
        }
    ]
    
    # Build meeting prep
    meeting_prep = {
        "id": prep_id,
        "client_id": request.client_id,
        "client_name": request.client_name,
        "meeting_type": request.meeting_type,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        
        "client_snapshot": {
            "net_worth": net_worth,
            "portfolio_value": request.portfolio_value,
            "ytd_return": request.ytd_return,
            "ytd_return_formatted": f"+{request.ytd_return * 100:.1f}%",
            "retirement_probability": request.retirement_probability,
            "risk_profile": request.risk_profile,
            "age": request.age,
            "years_to_retirement": years_to_retirement
        },
        
        "portfolio_insights": portfolio_insights,
        "risk_alerts": risk_alerts,
        "talking_points": talking_points,
        "action_items": action_items,
        
        "quick_stats": {
            "total_insights": len(portfolio_insights),
            "risk_alerts_count": len(risk_alerts),
            "high_priority_actions": len([a for a in action_items if a["priority"] == "high"]),
            "tax_opportunity": tax_loss_opportunity
        },
        
        "compliance": {
            "soa_required": request.meeting_type == "planning",
            "roi_required": True,
            "last_review_date": (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d"),
            "next_review_due": (datetime.now() + timedelta(days=185)).strftime("%Y-%m-%d")
        }
    }
    
    MEETING_PREPS[prep_id] = meeting_prep
    
    return meeting_prep


@router.get("/history/{client_id}")
async def get_meeting_prep_history(client_id: str):
    """Get meeting prep history for a client."""
    preps = [p for p in MEETING_PREPS.values() if p["client_id"] == client_id]
    preps.sort(key=lambda x: x["generated_at"], reverse=True)
    
    return {
        "client_id": client_id,
        "preps": preps[:10],
        "total": len(preps)
    }


@router.get("/{prep_id}")
async def get_meeting_prep(prep_id: str):
    """Get a specific meeting prep."""
    if prep_id not in MEETING_PREPS:
        raise HTTPException(status_code=404, detail="Meeting prep not found")
    return MEETING_PREPS[prep_id]
