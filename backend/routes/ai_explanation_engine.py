"""
AI Explanation Engine for Retirement Confidence
Generates natural language explanations using LLM integration
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-explain", tags=["AI Explanation Engine"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ==================== MODELS ====================

class ConfidenceExplanationRequest(BaseModel):
    confidence_score: float
    risk_breakdown: Dict[str, float]
    statistics: Dict[str, Any]
    inputs: Dict[str, Any]
    client_name: str = "Client"
    is_couple: bool = False

class ActionRecommendation(BaseModel):
    action: str
    impact: str
    priority: str  # high, medium, low
    confidence_improvement: Optional[float] = None
    description: str

class RiskExplanation(BaseModel):
    risk_type: str
    severity: str  # low, moderate, high, critical
    explanation: str
    mitigation: str

# ==================== LLM INTEGRATION ====================

async def get_llm_explanation(prompt: str) -> str:
    """Get explanation from LLM"""
    try:
        # Try to use Emergent LLM integration
        from emergentintegrations.llm.chat import chat, LlmModel
        
        emergent_key = os.environ.get("EMERGENT_MODEL_API_KEY", "")
        if emergent_key:
            response = await chat(
                api_key=emergent_key,
                model=LlmModel.GPT_4O,  # Using GPT-4o for better explanations
                system_message="You are a retirement planning expert. Provide clear, actionable explanations in plain language. Be concise but comprehensive.",
                user_message=prompt,
                temperature=0.7
            )
            return response.message
    except Exception as e:
        logger.warning(f"LLM integration not available: {e}")
    
    # Fallback to rule-based explanations
    return None

def generate_rule_based_explanation(
    score: float,
    risk_breakdown: Dict[str, float],
    inputs: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate explanation using rules when LLM is not available"""
    
    # Score assessment
    if score >= 90:
        score_explanation = "Your retirement confidence is excellent. You have a very high probability of maintaining your lifestyle throughout retirement."
        overall_status = "excellent"
    elif score >= 75:
        score_explanation = "Your retirement confidence is good. You're on track, but there's room for optimization."
        overall_status = "good"
    elif score >= 50:
        score_explanation = "Your retirement confidence is moderate. Some adjustments are recommended to improve your financial security."
        overall_status = "moderate"
    elif score >= 25:
        score_explanation = "Your retirement confidence is concerning. Significant changes are needed to secure your retirement."
        overall_status = "concerning"
    else:
        score_explanation = "Your retirement confidence is critical. Urgent action is required to avoid running out of money in retirement."
        overall_status = "critical"
    
    # Identify primary risk
    risks = risk_breakdown
    primary_risk = max(risks, key=risks.get) if risks else "unknown"
    
    risk_explanations = {
        "longevity_risk": {
            "explanation": "Living longer than expected is your primary concern. While longevity is a blessing, it means your savings need to last longer.",
            "mitigation": "Consider delaying retirement, increasing savings, or purchasing a lifetime annuity to guarantee income."
        },
        "market_risk": {
            "explanation": "Investment volatility is your primary concern. Market downturns, especially early in retirement, could significantly impact your wealth.",
            "mitigation": "Review your asset allocation, consider reducing equity exposure, and maintain a cash buffer for 2-3 years of expenses."
        },
        "spending_risk": {
            "explanation": "Your spending level is the primary concern. Current expenses may be too high relative to your savings and income.",
            "mitigation": "Review discretionary spending, distinguish needs from wants, and create a detailed retirement budget."
        },
        "inflation_risk": {
            "explanation": "Inflation erosion is your primary concern. Rising prices could reduce your purchasing power over time.",
            "mitigation": "Include growth assets in your portfolio, consider inflation-linked investments, and plan for healthcare cost increases."
        }
    }
    
    primary_risk_info = risk_explanations.get(primary_risk, {
        "explanation": "Multiple factors are affecting your retirement confidence.",
        "mitigation": "A comprehensive review of your retirement plan is recommended."
    })
    
    # Generate actions
    actions = []
    
    if score < 90:
        net_worth = inputs.get("net_worth", 0)
        expenses = inputs.get("annual_expenses", 0)
        years_to_ret = inputs.get("years_to_retirement", 0)
        
        if years_to_ret > 0:
            actions.append({
                "action": "Increase retirement contributions",
                "impact": "Each additional $10,000 saved can improve confidence by 2-5%",
                "priority": "high" if score < 50 else "medium",
                "description": "Maximize salary sacrifice and consider additional voluntary contributions."
            })
        
        if expenses > net_worth * 0.05:
            actions.append({
                "action": "Review spending levels",
                "impact": "Reducing annual expenses by 10% could improve confidence by 5-10%",
                "priority": "high" if risks.get("spending_risk", 0) > 10 else "medium",
                "description": "Identify discretionary expenses that could be reduced in retirement."
            })
        
        if risks.get("market_risk", 0) > 15:
            actions.append({
                "action": "Rebalance portfolio",
                "impact": "Reducing volatility can improve confidence and reduce sequence risk",
                "priority": "medium",
                "description": "Consider shifting to a more conservative asset allocation as you approach retirement."
            })
        
        if years_to_ret > 5 and score < 70:
            actions.append({
                "action": "Consider working longer",
                "impact": "Each additional year of work can improve confidence by 3-8%",
                "priority": "high" if score < 50 else "low",
                "description": "Delaying retirement allows more saving time and reduces the number of retirement years to fund."
            })
    
    return {
        "score_explanation": score_explanation,
        "overall_status": overall_status,
        "primary_risk": primary_risk.replace("_", " ").title(),
        "primary_risk_explanation": primary_risk_info["explanation"],
        "primary_risk_mitigation": primary_risk_info["mitigation"],
        "recommended_actions": actions,
        "summary": f"With a {score:.0f}% confidence score, {score_explanation.split('.')[0].lower()}. Your biggest risk factor is {primary_risk.replace('_', ' ')}.",
        "generated_by": "rule_engine"
    }

# ==================== API ENDPOINTS ====================

@router.post("/explain")
async def explain_confidence(request: ConfidenceExplanationRequest):
    """Generate AI explanation for confidence score"""
    
    # Try LLM first
    prompt = f"""
    Analyze this retirement confidence assessment and provide a clear explanation:
    
    Client: {request.client_name} {"(Couple)" if request.is_couple else "(Individual)"}
    Confidence Score: {request.confidence_score}%
    
    Risk Breakdown:
    - Longevity Risk: {request.risk_breakdown.get('longevity_risk', 0):.1f}%
    - Market Risk: {request.risk_breakdown.get('market_risk', 0):.1f}%
    - Spending Risk: {request.risk_breakdown.get('spending_risk', 0):.1f}%
    - Inflation Risk: {request.risk_breakdown.get('inflation_risk', 0):.1f}%
    
    Key Metrics:
    - Net Worth: ${request.inputs.get('net_worth', 0):,.0f}
    - Years to Retirement: {request.inputs.get('years_to_retirement', 0)}
    - Annual Expenses: ${request.inputs.get('annual_expenses', 0):,.0f}
    - Portfolio Return: {request.inputs.get('portfolio_return', 0):.1f}%
    - Portfolio Volatility: {request.inputs.get('portfolio_volatility', 0):.1f}%
    
    Statistics:
    - Median Final Wealth: ${request.statistics.get('median_final_wealth', 0):,.0f}
    - 10th Percentile (worst case): ${request.statistics.get('p10_final_wealth', 0):,.0f}
    - 90th Percentile (best case): ${request.statistics.get('p90_final_wealth', 0):,.0f}
    
    Please provide:
    1. A 2-3 sentence explanation of what this confidence score means
    2. The biggest risk and why
    3. Top 3 specific actions to improve the score, with estimated impact
    4. A one-sentence summary suitable for a dashboard
    """
    
    llm_response = await get_llm_explanation(prompt)
    
    if llm_response:
        # Parse LLM response and structure it
        explanation = {
            "ai_explanation": llm_response,
            "generated_by": "llm",
            "model": "gpt-4o",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Also include rule-based for comparison
        rule_based = generate_rule_based_explanation(
            request.confidence_score,
            request.risk_breakdown,
            request.inputs
        )
        explanation["rule_based_backup"] = rule_based
    else:
        # Use rule-based explanation
        explanation = generate_rule_based_explanation(
            request.confidence_score,
            request.risk_breakdown,
            request.inputs
        )
        explanation["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    # Store explanation
    db = await get_db()
    await db.ai_explanations.insert_one({
        "explanation_id": f"EXP-{uuid.uuid4().hex[:8].upper()}",
        "confidence_score": request.confidence_score,
        **explanation
    })
    
    return explanation

@router.post("/recommendations")
async def get_recommendations(
    confidence_score: float,
    risk_breakdown: Dict[str, float],
    current_age: int,
    retirement_age: int,
    net_worth: float,
    annual_expenses: float
):
    """Get specific action recommendations"""
    
    recommendations = []
    
    # Contribution recommendation
    if retirement_age > current_age:
        years_to_ret = retirement_age - current_age
        if confidence_score < 80:
            extra_needed = (80 - confidence_score) * net_worth * 0.01  # Rough estimate
            annual_extra = extra_needed / years_to_ret if years_to_ret > 0 else extra_needed
            recommendations.append(ActionRecommendation(
                action="Increase Annual Savings",
                impact=f"Save an additional ${annual_extra:,.0f} per year",
                priority="high" if confidence_score < 50 else "medium",
                confidence_improvement=min(15, (80 - confidence_score) * 0.5),
                description=f"Increasing contributions by ${annual_extra:,.0f} annually could improve your confidence score by up to {min(15, (80 - confidence_score) * 0.5):.0f}%"
            ))
    
    # Spending recommendation
    if risk_breakdown.get("spending_risk", 0) > 10:
        spending_reduction = annual_expenses * 0.1
        recommendations.append(ActionRecommendation(
            action="Reduce Discretionary Spending",
            impact=f"Reduce expenses by ${spending_reduction:,.0f} per year",
            priority="high" if risk_breakdown.get("spending_risk", 0) > 20 else "medium",
            confidence_improvement=8,
            description=f"Reducing annual expenses by 10% (${spending_reduction:,.0f}) could significantly improve sustainability"
        ))
    
    # Retirement age recommendation
    if confidence_score < 70 and retirement_age > current_age:
        recommendations.append(ActionRecommendation(
            action="Consider Delaying Retirement",
            impact="Work 2 more years",
            priority="medium",
            confidence_improvement=12,
            description="Each year of delayed retirement adds savings and reduces the retirement period to fund"
        ))
    
    # Portfolio recommendation
    if risk_breakdown.get("market_risk", 0) > 15:
        recommendations.append(ActionRecommendation(
            action="Rebalance to Lower Risk",
            impact="Shift 10-20% from equities to bonds",
            priority="medium",
            confidence_improvement=5,
            description="Reducing portfolio volatility can improve confidence and reduce sequence of returns risk"
        ))
    
    # Sort by priority and confidence improvement
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: (priority_order.get(x.priority, 1), -(x.confidence_improvement or 0)))
    
    return {
        "recommendations": [r.model_dump() for r in recommendations[:5]],
        "total_potential_improvement": sum(r.confidence_improvement or 0 for r in recommendations[:3]),
        "top_priority": recommendations[0].action if recommendations else "Maintain current plan"
    }

@router.get("/risk-explanation/{risk_type}")
async def explain_risk(risk_type: str):
    """Get detailed explanation for a specific risk type"""
    
    risk_explanations = {
        "longevity_risk": RiskExplanation(
            risk_type="Longevity Risk",
            severity="varies",
            explanation="""
            Longevity risk is the possibility that you will outlive your retirement savings. 
            With increasing life expectancies, this risk is growing more significant. 
            
            Key factors:
            • Average life expectancy is increasing by about 2-3 months per year
            • Women typically live 4-5 years longer than men
            • Healthcare advances may further extend lifespans
            • Family history can indicate your personal longevity
            
            Impact:
            A 65-year-old today has a 50% chance of living past 85 and a 25% chance of reaching 95.
            """,
            mitigation="""
            Strategies to mitigate longevity risk:
            1. Use conservative life expectancy estimates (plan to age 95+)
            2. Consider lifetime annuities for guaranteed income
            3. Maintain some growth assets even in retirement
            4. Delay claiming Age Pension to maximize benefits
            5. Consider part-time work in early retirement
            """
        ),
        "market_risk": RiskExplanation(
            risk_type="Market Risk",
            severity="varies",
            explanation="""
            Market risk refers to the potential for investment losses due to market fluctuations.
            This is particularly dangerous through "sequence of returns risk" - poor returns early 
            in retirement can devastate your portfolio even if average returns are acceptable.
            
            Key factors:
            • Share markets can fall 30-50% in severe downturns
            • Recovery can take 3-7 years
            • Early retirement withdrawals during downturns compound losses
            • Higher equity allocation = higher market risk
            """,
            mitigation="""
            Strategies to mitigate market risk:
            1. Maintain 2-3 years of expenses in cash/bonds as a buffer
            2. Gradually reduce equity exposure approaching retirement
            3. Diversify across asset classes and geographies
            4. Consider a "bucket strategy" for different time horizons
            5. Avoid selling during market downturns
            """
        ),
        "spending_risk": RiskExplanation(
            risk_type="Spending Risk",
            severity="varies",
            explanation="""
            Spending risk is the danger of withdrawing too much from your portfolio, 
            especially in the early years of retirement.
            
            Key factors:
            • The "4% rule" is a guideline, not a guarantee
            • Lifestyle inflation can erode savings
            • Unexpected expenses (health, home repairs) can occur
            • Desire to help family members financially
            
            Research shows that retirees who overspend in early retirement often 
            face significant shortfalls later in life.
            """,
            mitigation="""
            Strategies to mitigate spending risk:
            1. Create a detailed retirement budget before retiring
            2. Distinguish essential vs discretionary expenses
            3. Plan for known large expenses (car replacement, travel)
            4. Build an emergency fund separate from retirement savings
            5. Review and adjust spending annually
            """
        ),
        "inflation_risk": RiskExplanation(
            risk_type="Inflation Risk",
            severity="varies",
            explanation="""
            Inflation risk is the erosion of purchasing power over time. 
            Even moderate inflation significantly impacts long retirements.
            
            Key factors:
            • 3% inflation halves purchasing power in 24 years
            • Healthcare costs typically rise faster than general inflation
            • Fixed incomes become less valuable over time
            • Unexpected inflation spikes can be devastating
            
            Example: $50,000/year in today's dollars will feel like 
            $25,000/year in purchasing power after 24 years at 3% inflation.
            """,
            mitigation="""
            Strategies to mitigate inflation risk:
            1. Include growth assets (shares, property) in your portfolio
            2. Consider inflation-linked bonds (Treasury Indexed Bonds)
            3. Maintain flexibility to adjust spending
            4. Plan for healthcare costs to rise faster than inflation
            5. Review retirement income needs annually
            """
        )
    }
    
    if risk_type not in risk_explanations:
        raise HTTPException(404, f"Risk type '{risk_type}' not found")
    
    return risk_explanations[risk_type].model_dump()

@router.post("/client-summary")
async def generate_client_summary(
    client_name: str,
    confidence_score: float,
    risk_breakdown: Dict[str, float],
    years_to_retirement: int
):
    """Generate a simple client-friendly summary"""
    
    # Determine status
    if confidence_score >= 90:
        status = "on_track"
        emoji = "🎉"
        message = f"Great news, {client_name}! You're in excellent shape for retirement."
    elif confidence_score >= 75:
        status = "good"
        emoji = "👍"
        message = f"{client_name}, you're on a good path to retirement with some room for improvement."
    elif confidence_score >= 50:
        status = "attention"
        emoji = "📊"
        message = f"{client_name}, your retirement plan needs some attention to ensure long-term security."
    else:
        status = "action_required"
        emoji = "⚠️"
        message = f"{client_name}, we need to discuss some important changes to your retirement plan."
    
    # Simple actions (max 3)
    actions = []
    primary_risk = max(risk_breakdown, key=risk_breakdown.get) if risk_breakdown else None
    
    if primary_risk == "spending_risk":
        actions.append("Review your expected retirement expenses")
    elif primary_risk == "market_risk":
        actions.append("Consider rebalancing your investment portfolio")
    elif primary_risk == "longevity_risk":
        actions.append("Ensure your plan accounts for living to age 95+")
    elif primary_risk == "inflation_risk":
        actions.append("Include growth assets to protect against inflation")
    
    if confidence_score < 80 and years_to_retirement > 0:
        actions.append("Explore increasing your super contributions")
    
    if confidence_score < 60:
        actions.append("Schedule a comprehensive retirement review")
    
    return {
        "client_name": client_name,
        "confidence_score": confidence_score,
        "status": status,
        "emoji": emoji,
        "message": message,
        "simple_actions": actions[:3],
        "years_to_retirement": years_to_retirement,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
