"""
Compare with Partner Feature
Side-by-side comparison of individual vs couple retirement confidence scores
"""

import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any
from fastapi import APIRouter, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import numpy as np

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/partner-comparison", tags=["Partner Comparison"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ==================== MODELS ====================

class PersonProfile(BaseModel):
    name: str
    current_age: int
    retirement_age: int = 65
    life_expectancy: int = 90
    net_worth: float
    annual_income: float
    annual_expenses: float
    super_balance: float = 0
    investment_balance: float = 0


class PartnerComparisonRequest(BaseModel):
    client_id: str
    person1: PersonProfile
    person2: PersonProfile
    shared_assets: float = 0  # Jointly owned assets
    shared_liabilities: float = 0
    combined_expenses: float = 0  # Expenses that reduce when combined (housing, etc.)
    num_simulations: int = 1000


class ComparisonResult(BaseModel):
    scenario: str
    confidence_score: float
    risk_breakdown: Dict[str, float]
    projected_wealth: Dict[str, float]
    years_to_retirement: int
    retirement_years: int


# ==================== MONTE CARLO SIMULATION ====================

def run_monte_carlo_simulation(
    initial_wealth: float,
    annual_income: float,
    annual_expenses: float,
    years_to_retirement: int,
    retirement_years: int,
    num_simulations: int = 1000,
    expected_return: float = 0.07,
    volatility: float = 0.15,
    inflation: float = 0.025
) -> Dict[str, Any]:
    """Run Monte Carlo simulation for retirement confidence."""
    
    np.random.seed(42)  # For reproducibility in demos
    
    final_wealths = []
    ruin_count = 0
    
    for _ in range(num_simulations):
        wealth = initial_wealth
        current_income = annual_income
        current_expenses = annual_expenses
        
        # Accumulation phase
        for year in range(years_to_retirement):
            # Random return
            annual_return = np.random.normal(expected_return, volatility)
            
            # Grow wealth
            wealth = wealth * (1 + annual_return) + current_income - current_expenses
            
            # Inflation adjustments
            current_income *= (1 + inflation)
            current_expenses *= (1 + inflation)
            
            if wealth < 0:
                wealth = 0
                break
        
        # wealth captured at retirement
        
        # Decumulation phase
        for year in range(retirement_years):
            if wealth <= 0:
                ruin_count += 1
                break
            
            # Random return
            annual_return = np.random.normal(expected_return * 0.8, volatility * 0.7)  # More conservative
            
            # Withdraw expenses
            wealth = wealth * (1 + annual_return) - current_expenses
            current_expenses *= (1 + inflation)
        
        final_wealths.append(max(0, wealth))
    
    # Calculate statistics
    final_wealths = np.array(final_wealths)
    probability_of_success = (num_simulations - ruin_count) / num_simulations
    confidence_score = probability_of_success * 100
    
    # Risk breakdown (simplified)
    longevity_risk = max(0, (1 - probability_of_success) * 40)
    market_risk = min(30, volatility * 100)
    spending_risk = min(20, (annual_expenses / initial_wealth) * 100) if initial_wealth > 0 else 20
    inflation_risk = min(10, inflation * 200)
    
    return {
        "confidence_score": round(confidence_score, 1),
        "risk_breakdown": {
            "longevity_risk": round(longevity_risk, 1),
            "market_risk": round(market_risk, 1),
            "spending_risk": round(spending_risk, 1),
            "inflation_risk": round(inflation_risk, 1)
        },
        "projected_wealth": {
            "median": round(float(np.median(final_wealths)), 0),
            "p10": round(float(np.percentile(final_wealths, 10)), 0),
            "p90": round(float(np.percentile(final_wealths, 90)), 0),
            "mean": round(float(np.mean(final_wealths)), 0)
        },
        "probability_of_ruin": round((ruin_count / num_simulations) * 100, 1)
    }


# ==================== API ENDPOINTS ====================

@router.post("/compare")
async def compare_with_partner(request: PartnerComparisonRequest):
    """
    Compare retirement confidence: Person 1 alone, Person 2 alone, and Together.
    Shows the value of financial planning as a couple.
    """
    db = await get_db()
    
    p1 = request.person1
    p2 = request.person2
    
    # Calculate years to retirement (use younger person's timeline for couple)
    p1_years_to_retire = max(0, p1.retirement_age - p1.current_age)
    p2_years_to_retire = max(0, p2.retirement_age - p2.current_age)
    couple_years_to_retire = min(p1_years_to_retire, p2_years_to_retire)
    
    # Calculate retirement years (use longer life expectancy)
    p1_retirement_years = max(0, p1.life_expectancy - p1.retirement_age)
    p2_retirement_years = max(0, p2.life_expectancy - p2.retirement_age)
    couple_retirement_years = max(p1_retirement_years, p2_retirement_years)
    
    # Scenario 1: Person 1 Alone
    p1_result = run_monte_carlo_simulation(
        initial_wealth=p1.net_worth + p1.super_balance + p1.investment_balance,
        annual_income=p1.annual_income,
        annual_expenses=p1.annual_expenses,
        years_to_retirement=p1_years_to_retire,
        retirement_years=p1_retirement_years,
        num_simulations=request.num_simulations
    )
    
    # Scenario 2: Person 2 Alone
    p2_result = run_monte_carlo_simulation(
        initial_wealth=p2.net_worth + p2.super_balance + p2.investment_balance,
        annual_income=p2.annual_income,
        annual_expenses=p2.annual_expenses,
        years_to_retirement=p2_years_to_retire,
        retirement_years=p2_retirement_years,
        num_simulations=request.num_simulations
    )
    
    # Scenario 3: Together as Couple
    # Combined assets (including shared)
    combined_wealth = (
        p1.net_worth + p1.super_balance + p1.investment_balance +
        p2.net_worth + p2.super_balance + p2.investment_balance +
        request.shared_assets - request.shared_liabilities
    )
    
    # Combined income
    combined_income = p1.annual_income + p2.annual_income
    
    # Combined expenses (with synergy - typically 20-30% savings)
    individual_expenses = p1.annual_expenses + p2.annual_expenses
    expense_synergy = request.combined_expenses if request.combined_expenses > 0 else individual_expenses * 0.75
    
    couple_result = run_monte_carlo_simulation(
        initial_wealth=combined_wealth,
        annual_income=combined_income,
        annual_expenses=expense_synergy,
        years_to_retirement=couple_years_to_retire,
        retirement_years=couple_retirement_years,
        num_simulations=request.num_simulations
    )
    
    # Calculate synergy benefits
    avg_individual_score = (p1_result["confidence_score"] + p2_result["confidence_score"]) / 2
    synergy_benefit = couple_result["confidence_score"] - avg_individual_score
    
    expense_savings = individual_expenses - expense_synergy
    expense_savings_percent = (expense_savings / individual_expenses * 100) if individual_expenses > 0 else 0
    
    # Determine which partner benefits more
    p1_improvement = couple_result["confidence_score"] - p1_result["confidence_score"]
    p2_improvement = couple_result["confidence_score"] - p2_result["confidence_score"]
    
    if p1_improvement > p2_improvement:
        primary_beneficiary = p1.name
        benefit_explanation = f"{p1.name} gains more confidence from combined resources"
    elif p2_improvement > p1_improvement:
        primary_beneficiary = p2.name
        benefit_explanation = f"{p2.name} gains more confidence from combined resources"
    else:
        primary_beneficiary = "Both equally"
        benefit_explanation = "Both partners benefit equally from combining resources"
    
    comparison = {
        "client_id": request.client_id,
        "comparison_date": datetime.now(timezone.utc).isoformat(),
        "scenarios": {
            "person1_alone": {
                "name": p1.name,
                "confidence_score": p1_result["confidence_score"],
                "risk_breakdown": p1_result["risk_breakdown"],
                "projected_wealth": p1_result["projected_wealth"],
                "years_to_retirement": p1_years_to_retire,
                "retirement_years": p1_retirement_years,
                "annual_expenses": p1.annual_expenses,
                "total_assets": p1.net_worth + p1.super_balance + p1.investment_balance
            },
            "person2_alone": {
                "name": p2.name,
                "confidence_score": p2_result["confidence_score"],
                "risk_breakdown": p2_result["risk_breakdown"],
                "projected_wealth": p2_result["projected_wealth"],
                "years_to_retirement": p2_years_to_retire,
                "retirement_years": p2_retirement_years,
                "annual_expenses": p2.annual_expenses,
                "total_assets": p2.net_worth + p2.super_balance + p2.investment_balance
            },
            "together_as_couple": {
                "confidence_score": couple_result["confidence_score"],
                "risk_breakdown": couple_result["risk_breakdown"],
                "projected_wealth": couple_result["projected_wealth"],
                "years_to_retirement": couple_years_to_retire,
                "retirement_years": couple_retirement_years,
                "combined_expenses": expense_synergy,
                "combined_assets": combined_wealth
            }
        },
        "synergy_analysis": {
            "confidence_improvement": round(synergy_benefit, 1),
            "expense_savings_annual": round(expense_savings, 0),
            "expense_savings_percent": round(expense_savings_percent, 1),
            "primary_beneficiary": primary_beneficiary,
            "benefit_explanation": benefit_explanation,
            "p1_confidence_gain": round(p1_improvement, 1),
            "p2_confidence_gain": round(p2_improvement, 1)
        },
        "recommendations": [
            {
                "title": "Combined Planning Benefits",
                "description": f"Planning together improves overall confidence by {abs(synergy_benefit):.1f} percentage points",
                "impact": "high" if synergy_benefit > 5 else "medium" if synergy_benefit > 0 else "low"
            },
            {
                "title": "Expense Synergies",
                "description": f"Living together typically reduces expenses by ${expense_savings:,.0f}/year ({expense_savings_percent:.1f}%)",
                "impact": "high" if expense_savings_percent > 20 else "medium"
            },
            {
                "title": "Risk Diversification",
                "description": "Combined income streams reduce dependency on single source",
                "impact": "medium"
            },
            {
                "title": "Survivor Planning",
                "description": f"Plan for {couple_retirement_years} retirement years (longer life expectancy)",
                "impact": "high"
            }
        ],
        "visualization_data": {
            "chart_type": "bar_comparison",
            "labels": [p1.name, p2.name, "Together"],
            "confidence_scores": [
                p1_result["confidence_score"],
                p2_result["confidence_score"],
                couple_result["confidence_score"]
            ],
            "projected_median_wealth": [
                p1_result["projected_wealth"]["median"],
                p2_result["projected_wealth"]["median"],
                couple_result["projected_wealth"]["median"]
            ]
        }
    }
    
    # Store comparison
    await db.partner_comparisons.insert_one({
        "id": str(uuid.uuid4()),
        **comparison
    })
    
    return comparison


@router.get("/history/{client_id}")
async def get_comparison_history(
    client_id: str,
    limit: int = Query(default=10, ge=1, le=50)
):
    """Get historical partner comparisons for a client."""
    db = await get_db()
    
    cursor = db.partner_comparisons.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("comparison_date", -1).limit(limit)
    
    comparisons = await cursor.to_list(length=limit)
    
    return {
        "client_id": client_id,
        "comparisons": comparisons,
        "total_count": len(comparisons)
    }


@router.post("/quick-compare")
async def quick_partner_comparison(
    person1_assets: float = Query(..., description="Person 1 total assets"),
    person1_expenses: float = Query(..., description="Person 1 annual expenses"),
    person1_age: int = Query(..., description="Person 1 current age"),
    person2_assets: float = Query(..., description="Person 2 total assets"),
    person2_expenses: float = Query(..., description="Person 2 annual expenses"),
    person2_age: int = Query(..., description="Person 2 current age"),
    combined_expense_reduction: float = Query(default=0.25, description="Expense reduction when combined (0.25 = 25%)")
):
    """Quick comparison without full profile data."""
    
    retirement_age = 65
    life_expectancy = 90
    
    # Person 1
    p1_years = max(0, retirement_age - person1_age)
    p1_retire_years = max(0, life_expectancy - retirement_age)
    p1_result = run_monte_carlo_simulation(
        initial_wealth=person1_assets,
        annual_income=0,  # Assume retired or near retirement
        annual_expenses=person1_expenses,
        years_to_retirement=p1_years,
        retirement_years=p1_retire_years,
        num_simulations=500
    )
    
    # Person 2
    p2_years = max(0, retirement_age - person2_age)
    p2_retire_years = max(0, life_expectancy - retirement_age)
    p2_result = run_monte_carlo_simulation(
        initial_wealth=person2_assets,
        annual_income=0,
        annual_expenses=person2_expenses,
        years_to_retirement=p2_years,
        retirement_years=p2_retire_years,
        num_simulations=500
    )
    
    # Together
    combined_assets = person1_assets + person2_assets
    combined_expenses = (person1_expenses + person2_expenses) * (1 - combined_expense_reduction)
    couple_years = min(p1_years, p2_years)
    couple_retire_years = max(p1_retire_years, p2_retire_years)
    
    couple_result = run_monte_carlo_simulation(
        initial_wealth=combined_assets,
        annual_income=0,
        annual_expenses=combined_expenses,
        years_to_retirement=couple_years,
        retirement_years=couple_retire_years,
        num_simulations=500
    )
    
    synergy = couple_result["confidence_score"] - (p1_result["confidence_score"] + p2_result["confidence_score"]) / 2
    
    return {
        "person1_confidence": p1_result["confidence_score"],
        "person2_confidence": p2_result["confidence_score"],
        "together_confidence": couple_result["confidence_score"],
        "synergy_benefit": round(synergy, 1),
        "expense_savings": round((person1_expenses + person2_expenses) - combined_expenses, 0),
        "recommendation": "Planning together provides significant benefits" if synergy > 5 else "Individual planning may be suitable"
    }


@router.get("/benefits")
async def get_partnership_benefits():
    """Get information about benefits of planning as a couple."""
    return {
        "financial_synergies": [
            {
                "category": "Housing",
                "typical_savings": "30-50%",
                "description": "Shared mortgage/rent, utilities, and maintenance"
            },
            {
                "category": "Insurance",
                "typical_savings": "10-20%",
                "description": "Couple discounts on health, home, and car insurance"
            },
            {
                "category": "Food & Groceries",
                "typical_savings": "15-25%",
                "description": "Bulk buying and reduced waste"
            },
            {
                "category": "Transportation",
                "typical_savings": "20-30%",
                "description": "Shared vehicle, combined trips"
            },
            {
                "category": "Subscriptions",
                "typical_savings": "40-50%",
                "description": "Family plans for streaming, gym, etc."
            }
        ],
        "investment_benefits": [
            "Diversified income sources reduce risk",
            "Combined assets provide better investment options",
            "Tax optimization through income splitting",
            "Higher Age Pension thresholds for couples"
        ],
        "planning_considerations": [
            "Align retirement dates where possible",
            "Consider survivorship scenarios",
            "Review beneficiary nominations",
            "Plan for potential care needs"
        ]
    }
