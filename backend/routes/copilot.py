"""
AI Copilot Routes
Natural language financial advisor and AI-powered features.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/copilot", tags=["AI Copilot"])

# Import AI services
try:
    from services.ai_wealth_copilot import AIWealthCopilot, AIInsightEngine, AIFinancialPlanGenerator
    from services.financial_intelligence import MonteCarloEngine, DecisionCenter
    AI_AVAILABLE = True
except ImportError as e:
    logger.warning(f"AI services not available: {e}")
    AI_AVAILABLE = False

# Session storage for copilot conversations
COPILOT_SESSIONS: Dict[str, Any] = {}


class CopilotQuery(BaseModel):
    question: str
    session_id: Optional[str] = None
    client_context: Optional[Dict[str, Any]] = None


class PlanGenerationRequest(BaseModel):
    client_name: str
    age: int = 45
    retirement_age: int = 65
    annual_income: float = 150000
    annual_expenses: float = 100000
    savings: float = 50000
    super_balance: float = 300000
    property_value: float = 800000
    mortgage: float = 400000
    investments: float = 100000
    other_debt: float = 0
    risk_profile: str = "balanced"
    goals: List[str] = []


class InsightRequest(BaseModel):
    clients: List[Dict[str, Any]]


class ScenarioRequest(BaseModel):
    current_age: int = 45
    retirement_age: int = 65
    current_wealth: float = 500000
    annual_savings: float = 50000
    annual_expenses: float = 80000
    risk_profile: str = "balanced"


@router.post("/ask")
async def ask_copilot(request: CopilotQuery):
    """
    Ask the AI Wealth Copilot a question.
    
    Example questions:
    - "Can Sarah retire at 60?"
    - "What's my retirement probability?"
    - "How can I reduce my tax?"
    - "Should I increase super contributions?"
    """
    try:
        # Get or create session
        session_id = request.session_id
        
        if session_id and session_id in COPILOT_SESSIONS:
            copilot = COPILOT_SESSIONS[session_id]
        else:
            copilot = AIWealthCopilot(session_id=session_id)
            COPILOT_SESSIONS[copilot.session_id] = copilot
        
        # Get response
        response = await copilot.ask(request.question, request.client_context)
        
        return {
            "success": True,
            "session_id": copilot.session_id,
            "question": request.question,
            "answer": response.get("answer", ""),
            "parsed": response.get("parsed", {}),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Copilot error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}")
async def get_copilot_history(session_id: str):
    """Get conversation history for a session."""
    if session_id not in COPILOT_SESSIONS:
        return {"session_id": session_id, "history": []}
    
    copilot = COPILOT_SESSIONS[session_id]
    return {
        "session_id": session_id,
        "history": copilot.get_history()
    }


@router.delete("/history/{session_id}")
async def clear_copilot_history(session_id: str):
    """Clear conversation history."""
    if session_id in COPILOT_SESSIONS:
        COPILOT_SESSIONS[session_id].clear_history()
    return {"success": True}


@router.post("/generate-plan")
async def generate_financial_plan(request: PlanGenerationRequest):
    """
    Generate a comprehensive AI financial plan.
    
    Inputs client data and generates:
    - Executive summary
    - Retirement strategy with probability
    - Investment recommendations
    - Tax optimization strategies
    - Action plan
    """
    try:
        generator = AIFinancialPlanGenerator()
        
        plan = await generator.generate_plan({
            "name": request.client_name,
            "age": request.age,
            "retirement_age": request.retirement_age,
            "annual_income": request.annual_income,
            "annual_expenses": request.annual_expenses,
            "savings": request.savings,
            "super_balance": request.super_balance,
            "property_value": request.property_value,
            "mortgage": request.mortgage,
            "investments": request.investments,
            "other_debt": request.other_debt,
            "risk_profile": request.risk_profile,
            "goals": request.goals or ["Comfortable retirement", "Pay off mortgage", "Build wealth"]
        })
        
        return plan
        
    except Exception as e:
        logger.error(f"Plan generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/insights")
async def get_client_insights(request: InsightRequest):
    """
    Generate AI-powered insights for advisor's clients.
    
    Returns insights like:
    - "3 clients at retirement risk"
    - "2 clients could retire earlier"
    - "5 clients have super optimization opportunities"
    """
    try:
        engine = AIInsightEngine()
        insights = await engine.generate_client_insights(request.clients)
        
        # Group by type
        grouped = {}
        for insight in insights:
            insight_type = insight.get("type", "general")
            if insight_type not in grouped:
                grouped[insight_type] = []
            grouped[insight_type].append(insight)
        
        # Summary counts
        summary = {
            "total_insights": len(insights),
            "critical": len([i for i in insights if i.get("priority") == "critical"]),
            "high": len([i for i in insights if i.get("priority") == "high"]),
            "medium": len([i for i in insights if i.get("priority") == "medium"]),
            "low": len([i for i in insights if i.get("priority") == "low"])
        }
        
        return {
            "insights": insights,
            "grouped": grouped,
            "summary": summary,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick-scenario")
async def quick_scenario_analysis(request: ScenarioRequest):
    """
    Quick scenario analysis for real-time Decision Center.
    
    Returns instant updates for slider-based scenario modeling.
    """
    try:
        decision_center = DecisionCenter()
        
        result = decision_center.quick_analysis(
            current_age=request.current_age,
            retirement_age=request.retirement_age,
            current_wealth=request.current_wealth,
            annual_savings=request.annual_savings,
            annual_expenses=request.annual_expenses,
            risk_profile=request.risk_profile
        )
        
        return {
            **result,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Quick scenario error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/monte-carlo")
async def run_monte_carlo(
    current_age: int = 45,
    retirement_age: int = 65,
    current_wealth: float = 500000,
    annual_savings: float = 50000,
    annual_expenses: float = 80000,
    super_balance: float = 300000,
    annual_income: float = 150000,
    expected_return: float = 0.07,
    volatility: float = 0.15,
    num_simulations: int = 10000
):
    """
    Run comprehensive Monte Carlo simulation.
    
    Returns:
    - Success probability
    - Wealth projections at retirement
    - Safe withdrawal rates
    - Risk metrics
    """
    try:
        engine = MonteCarloEngine(num_simulations=min(num_simulations, 10000))
        
        result = engine.run_retirement_simulation(
            current_age=current_age,
            retirement_age=retirement_age,
            current_wealth=current_wealth,
            annual_savings=annual_savings,
            annual_expenses=annual_expenses,
            expected_return=expected_return,
            volatility=volatility,
            super_balance=super_balance,
            annual_income=annual_income
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Monte Carlo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scenario-comparison")
async def compare_scenarios(
    base_params: Dict[str, Any],
    scenarios: List[Dict[str, Any]]
):
    """
    Compare multiple scenarios against base case.
    
    Example scenarios:
    - {"name": "Retire Early", "changes": {"retirement_age": 60}}
    - {"name": "Increase Savings", "changes": {"annual_savings": 60000}}
    """
    try:
        engine = MonteCarloEngine(num_simulations=5000)
        
        result = engine.run_scenario_comparison(base_params, scenarios)
        
        return result
        
    except Exception as e:
        logger.error(f"Scenario comparison error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Today's Insights endpoint for advisor dashboard
@router.get("/todays-insights")
async def get_todays_insights():
    """
    Get today's AI-generated insights for the advisor dashboard.
    
    This is the "AI Client Intelligence Feed" showing:
    - Clients at retirement risk
    - Clients who could retire earlier
    - Tax optimization opportunities
    - Clients overspending
    """
    # Sample insights - in production these would be generated from real client data
    insights = [
        {
            "type": "retirement_risk",
            "priority": "high",
            "count": 3,
            "title": "3 clients at retirement risk",
            "description": "Portfolio projections below target retirement income",
            "clients": ["Thompson Family", "Martinez Family", "Wilson Family"],
            "action": "Schedule review meetings"
        },
        {
            "type": "early_retirement",
            "priority": "medium",
            "count": 2,
            "title": "2 clients could retire earlier",
            "description": "Projections show retirement possible 3-5 years earlier than planned",
            "clients": ["Wheeler Family", "Chen Family"],
            "action": "Discuss early retirement options"
        },
        {
            "type": "tax_optimization",
            "priority": "medium",
            "count": 5,
            "title": "5 clients have super optimization opportunities",
            "description": "Unused concessional cap space totaling $45,000+",
            "clients": ["Wheeler Family", "Chen Family", "Patel Family", "Jones Family", "Smith Family"],
            "action": "Review salary sacrifice strategies"
        },
        {
            "type": "spending_alert",
            "priority": "high",
            "count": 2,
            "title": "2 clients overspending",
            "description": "Expenses exceeding sustainable withdrawal rates",
            "clients": ["Roberts Family", "Brown Family"],
            "action": "Schedule budget review"
        },
        {
            "type": "rebalance_needed",
            "priority": "low",
            "count": 4,
            "title": "4 portfolios need rebalancing",
            "description": "Allocation drifted >5% from target",
            "clients": ["Multiple clients"],
            "action": "Review portfolio allocations"
        }
    ]
    
    return {
        "date": datetime.now(timezone.utc).strftime("%B %d, %Y"),
        "total_insights": sum(i["count"] for i in insights),
        "critical_count": len([i for i in insights if i["priority"] == "high"]),
        "insights": insights,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
