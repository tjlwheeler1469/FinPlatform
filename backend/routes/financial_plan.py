"""
Financial Plan Generation System
Generates comprehensive financial plans from transaction scenarios.
Persists data to MongoDB.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient
import uuid
import logging
import os
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/financial-plan", tags=["Financial Plan"])

# LLM integration for AI-powered plan generation
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

def get_db():
    """Get MongoDB database connection."""
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]

def get_plans_collection():
    return get_db()["financial_plans"]


class Transaction(BaseModel):
    id: int
    type: str  # property, fund, stock, etf, crypto
    name: str
    amount: float
    details: Dict[str, Any]


class ScenarioData(BaseModel):
    client_id: str
    client_name: str
    transactions: List[Transaction]
    total_value: float
    timeframe: int  # years
    goals: Optional[List[str]] = None
    risk_profile: Optional[str] = "moderate"


class PlanGenerationRequest(BaseModel):
    scenario: ScenarioData
    include_tax_analysis: bool = True
    include_risk_assessment: bool = True
    include_projections: bool = True


def calculate_projections(transactions: List[Dict], timeframe: int) -> Dict:
    """Calculate investment projections."""
    total_initial = sum(t.get("amount", 0) for t in transactions)
    
    # Estimate returns based on asset types
    returns_by_type = {
        "property": 0.05,
        "fund": 0.07,
        "stock": 0.08,
        "etf": 0.075,
        "crypto": 0.10
    }
    
    projections = []
    value = total_initial
    
    for year in range(timeframe + 1):
        projections.append({
            "year": year,
            "value": round(value, 2),
            "growth": round(value - total_initial, 2) if year > 0 else 0
        })
        
        # Weighted average return
        weighted_return = 0
        for t in transactions:
            weight = t.get("amount", 0) / total_initial if total_initial > 0 else 0
            ret = returns_by_type.get(t.get("type"), 0.06)
            weighted_return += weight * ret
        
        value *= (1 + weighted_return)
    
    final_value = projections[-1]["value"]
    total_return = final_value - total_initial
    
    return {
        "initial_investment": total_initial,
        "projected_final_value": round(final_value, 2),
        "total_projected_return": round(total_return, 2),
        "return_percentage": round((total_return / total_initial * 100) if total_initial > 0 else 0, 2),
        "annualized_return": round(((final_value / total_initial) ** (1 / timeframe) - 1) * 100 if timeframe > 0 and total_initial > 0 else 0, 2),
        "yearly_projections": projections
    }


def calculate_tax_implications(transactions: List[Dict], timeframe: int) -> Dict:
    """Calculate tax implications of the investment strategy."""
    total_investment = sum(t.get("amount", 0) for t in transactions)
    
    # Estimate annual tax considerations
    annual_income_estimates = []
    
    for t in transactions:
        t_type = t.get("type", "")
        amount = t.get("amount", 0)
        
        if t_type == "property":
            # Rental yield estimate
            rental_yield = t.get("details", {}).get("expected_rental_yield", 4) / 100
            annual_income_estimates.append({
                "source": f"{t.get('name')} - Rental Income",
                "annual_income": round(amount * rental_yield, 2),
                "tax_treatment": "Assessable income"
            })
        elif t_type in ["fund", "etf"]:
            # Distribution yield
            dist_yield = t.get("details", {}).get("distribution_yield", 3) / 100
            annual_income_estimates.append({
                "source": f"{t.get('name')} - Distributions",
                "annual_income": round(amount * dist_yield, 2),
                "tax_treatment": "Assessable income (may include franking credits)"
            })
        elif t_type == "stock":
            # Dividend yield
            div_yield = t.get("details", {}).get("dividend_yield", 4) / 100
            annual_income_estimates.append({
                "source": f"{t.get('name')} - Dividends",
                "annual_income": round(amount * div_yield, 2),
                "tax_treatment": "Assessable income (franked dividends)"
            })
    
    total_annual_income = sum(i["annual_income"] for i in annual_income_estimates)
    
    # CGT considerations
    cgt_considerations = []
    for t in transactions:
        cgt_considerations.append({
            "asset": t.get("name"),
            "type": t.get("type"),
            "amount": t.get("amount"),
            "cgt_discount_eligible_from": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
            "note": "50% CGT discount applies after 12 months for individuals/trusts"
        })
    
    return {
        "estimated_annual_income": round(total_annual_income, 2),
        "income_breakdown": annual_income_estimates,
        "tax_at_32.5%": round(total_annual_income * 0.325, 2),
        "tax_at_37%": round(total_annual_income * 0.37, 2),
        "tax_at_45%": round(total_annual_income * 0.45, 2),
        "cgt_considerations": cgt_considerations,
        "tax_planning_recommendations": [
            "Consider timing of asset sales to maximize CGT discount",
            "Review franking credit utilization strategy",
            "Consider super contributions for tax-effective investing",
            f"Total investment of {total_investment:,.0f} generates ~{total_annual_income:,.0f} annual income"
        ]
    }


def assess_risk(transactions: List[Dict], risk_profile: str) -> Dict:
    """Assess portfolio risk based on transactions."""
    total = sum(t.get("amount", 0) for t in transactions)
    
    # Calculate allocation by asset type
    allocation = {}
    for t in transactions:
        t_type = t.get("type", "other")
        allocation[t_type] = allocation.get(t_type, 0) + t.get("amount", 0)
    
    allocation_pct = {k: round(v / total * 100, 1) if total > 0 else 0 for k, v in allocation.items()}
    
    # Risk scores by asset type
    risk_scores = {
        "cash": 1,
        "bonds": 2,
        "property": 4,
        "fund": 5,
        "etf": 5,
        "stock": 6,
        "crypto": 9
    }
    
    # Calculate weighted risk score
    weighted_risk = 0
    for t_type, amount in allocation.items():
        weight = amount / total if total > 0 else 0
        risk_score = risk_scores.get(t_type, 5)
        weighted_risk += weight * risk_score
    
    # Risk profile targets
    risk_targets = {
        "conservative": 3,
        "moderate": 5,
        "growth": 6,
        "aggressive": 7
    }
    
    target_risk = risk_targets.get(risk_profile, 5)
    risk_alignment = "aligned" if abs(weighted_risk - target_risk) < 1 else \
                    "higher_than_profile" if weighted_risk > target_risk else "lower_than_profile"
    
    # Diversification score
    asset_types = len([a for a in allocation.values() if a > 0])
    diversification = "excellent" if asset_types >= 4 else "good" if asset_types >= 3 else "limited" if asset_types >= 2 else "poor"
    
    # Risk warnings
    warnings = []
    if allocation_pct.get("crypto", 0) > 20:
        warnings.append({
            "type": "high_crypto_allocation",
            "severity": "high",
            "message": f"Crypto allocation of {allocation_pct.get('crypto')}% exceeds recommended maximum of 20%"
        })
    if allocation_pct.get("property", 0) > 50:
        warnings.append({
            "type": "property_concentration",
            "severity": "medium",
            "message": "High property concentration may reduce liquidity"
        })
    if asset_types < 3:
        warnings.append({
            "type": "low_diversification",
            "severity": "medium",
            "message": "Consider diversifying across more asset classes"
        })
    
    return {
        "portfolio_risk_score": round(weighted_risk, 1),
        "risk_scale": "1 (lowest) - 10 (highest)",
        "client_risk_profile": risk_profile,
        "target_risk_score": target_risk,
        "risk_alignment": risk_alignment,
        "allocation_breakdown": allocation_pct,
        "diversification_score": diversification,
        "number_of_asset_types": asset_types,
        "risk_warnings": warnings,
        "recommendations": [
            "Portfolio risk is well-balanced" if risk_alignment == "aligned" else 
            f"Consider adjusting portfolio to better align with {risk_profile} risk profile"
        ]
    }


async def generate_ai_summary(scenario: Dict, projections: Dict, tax_info: Dict, risk_assessment: Dict) -> str:
    """Generate AI-powered executive summary using Emergent LLM."""
    try:
        from emergentintegrations.llm.chat import chat, Message
        
        context = f"""
You are a financial advisor creating an executive summary for a client's financial plan.

CLIENT: {scenario.get('client_name')}
TIMEFRAME: {scenario.get('timeframe')} years
RISK PROFILE: {scenario.get('risk_profile', 'moderate')}

INVESTMENT STRATEGY:
Total Investment: ${scenario.get('total_value', 0):,.0f}
Number of Investments: {len(scenario.get('transactions', []))}

PROJECTIONS:
- Initial Investment: ${projections.get('initial_investment', 0):,.0f}
- Projected Final Value: ${projections.get('projected_final_value', 0):,.0f}
- Annualized Return: {projections.get('annualized_return', 0)}%

TAX IMPLICATIONS:
- Estimated Annual Income: ${tax_info.get('estimated_annual_income', 0):,.0f}

RISK ASSESSMENT:
- Portfolio Risk Score: {risk_assessment.get('portfolio_risk_score', 0)}/10
- Diversification: {risk_assessment.get('diversification_score', 'N/A')}
- Risk Alignment: {risk_assessment.get('risk_alignment', 'N/A')}

Write a professional 3-4 paragraph executive summary that:
1. Summarizes the investment strategy
2. Highlights key projections and potential returns
3. Notes important tax considerations
4. Provides a risk assessment summary
5. Ends with a clear recommendation

Keep it concise and professional. Use Australian financial terminology.
"""
        
        messages = [
            Message(role="system", content="You are a senior financial advisor writing for high-net-worth clients."),
            Message(role="user", content=context)
        ]
        
        response = await chat(
            api_key=EMERGENT_LLM_KEY,
            model="gpt-4o",
            messages=messages
        )
        
        return response.content if hasattr(response, 'content') else str(response)
        
    except Exception as e:
        logger.warning(f"AI summary generation failed: {e}")
        # Fallback summary
        return f"""
**Executive Summary - Financial Plan for {scenario.get('client_name')}**

This financial plan outlines a comprehensive investment strategy with a {scenario.get('timeframe')}-year timeframe, 
aligned with a {scenario.get('risk_profile', 'moderate')} risk profile.

**Investment Overview:**
The proposed strategy involves a total investment of ${scenario.get('total_value', 0):,.0f} across 
{len(scenario.get('transactions', []))} investment vehicles. Based on current market conditions and 
historical performance data, we project a final portfolio value of ${projections.get('projected_final_value', 0):,.0f}, 
representing an annualized return of approximately {projections.get('annualized_return', 0)}%.

**Tax Considerations:**
The strategy is expected to generate approximately ${tax_info.get('estimated_annual_income', 0):,.0f} in 
annual income from dividends, distributions, and rental yields. We recommend reviewing the timing of any 
future asset sales to maximize CGT discount eligibility.

**Risk Assessment:**
With a portfolio risk score of {risk_assessment.get('portfolio_risk_score', 0)}/10 and 
{risk_assessment.get('diversification_score', 'adequate')} diversification, the strategy 
is {risk_assessment.get('risk_alignment', 'aligned')} with your stated risk profile.

**Recommendation:** We recommend proceeding with this investment strategy, subject to your review 
and confirmation of the underlying assumptions. Regular quarterly reviews are advised to ensure 
the portfolio remains aligned with your goals.
"""


@router.post("/generate")
async def generate_financial_plan(request: PlanGenerationRequest, background_tasks: BackgroundTasks):
    """
    Generate a comprehensive financial plan from a transaction scenario.
    """
    plan_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now(timezone.utc).isoformat()
    
    scenario = request.scenario
    transactions = [t.model_dump() for t in scenario.transactions]
    
    # Calculate projections
    projections = calculate_projections(transactions, scenario.timeframe) if request.include_projections else {}
    
    # Calculate tax implications
    tax_analysis = calculate_tax_implications(transactions, scenario.timeframe) if request.include_tax_analysis else {}
    
    # Assess risk
    risk_assessment = assess_risk(transactions, scenario.risk_profile) if request.include_risk_assessment else {}
    
    # Generate AI summary
    executive_summary = await generate_ai_summary(
        scenario.model_dump(),
        projections,
        tax_analysis,
        risk_assessment
    )
    
    # Build the plan
    plan = {
        "plan_id": plan_id,
        "version": "1.0",
        "status": "draft",
        "created_at": created_at,
        "client": {
            "id": scenario.client_id,
            "name": scenario.client_name,
            "risk_profile": scenario.risk_profile
        },
        "scenario": {
            "timeframe_years": scenario.timeframe,
            "total_investment": scenario.total_value,
            "transactions": transactions,
            "goals": scenario.goals or []
        },
        "executive_summary": executive_summary,
        "projections": projections,
        "tax_analysis": tax_analysis,
        "risk_assessment": risk_assessment,
        "recommendations": [
            {
                "category": "Investment",
                "recommendation": "Proceed with the proposed investment strategy",
                "priority": "high",
                "timeframe": "Immediate"
            },
            {
                "category": "Tax Planning",
                "recommendation": "Review super contribution strategy before EOFY",
                "priority": "medium",
                "timeframe": "Before June 30"
            },
            {
                "category": "Review",
                "recommendation": "Schedule quarterly portfolio review",
                "priority": "medium",
                "timeframe": "Quarterly"
            }
        ],
        "disclaimers": [
            "This plan is based on projections and assumptions that may not reflect actual future performance.",
            "Past performance is not a reliable indicator of future performance.",
            "Consider seeking independent financial advice before making investment decisions.",
            "Tax information is general in nature. Consult a tax professional for specific advice."
        ],
        "next_steps": [
            "Review and approve this financial plan",
            "Sign the Statement of Advice (SOA)",
            "Execute the proposed transactions",
            "Set up regular review meetings"
        ]
    }
    
    # Store the plan in MongoDB
    plans_col = get_plans_collection()
    plans_col.insert_one(plan)
    
    # Remove _id for response
    plan.pop("_id", None)
    
    return {
        "success": True,
        "plan": plan,
        "download_url": f"/api/financial-plan/{plan_id}/download",
        "share_url": f"/api/financial-plan/{plan_id}/share"
    }


@router.get("/{plan_id}")
async def get_plan(plan_id: str):
    """Retrieve a generated financial plan."""
    plans_col = get_plans_collection()
    plan = plans_col.find_one({"plan_id": plan_id}, {"_id": 0})
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return plan


@router.get("/{plan_id}/download")
async def download_plan(plan_id: str, format: str = "pdf"):
    """Download a financial plan in various formats."""
    plans_col = get_plans_collection()
    plan = plans_col.find_one({"plan_id": plan_id}, {"_id": 0})
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # In production, would generate actual PDF/DOCX
    return {
        "plan_id": plan_id,
        "format": format,
        "status": "ready",
        "download_url": f"/downloads/plans/{plan_id}.{format}",
        "note": "PDF generation would be implemented in production"
    }


@router.post("/{plan_id}/approve")
async def approve_plan(plan_id: str, approved_by: str):
    """Mark a plan as approved."""
    plans_col = get_plans_collection()
    
    result = plans_col.update_one(
        {"plan_id": plan_id},
        {"$set": {
            "status": "approved",
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "approved_by": approved_by
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {
        "success": True,
        "plan_id": plan_id,
        "status": "approved",
        "message": "Financial plan has been approved. Ready for implementation."
    }


@router.get("/client/{client_id}/plans")
async def get_client_plans(client_id: str):
    """Get all plans for a client."""
    plans_col = get_plans_collection()
    client_plans = list(plans_col.find({"client.id": client_id}, {"_id": 0}))
    
    return {
        "client_id": client_id,
        "plans": client_plans,
        "total_count": len(client_plans)
    }
