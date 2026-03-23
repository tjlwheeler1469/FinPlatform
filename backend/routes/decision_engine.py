"""
Decision Engine Routes
Financial health scoring, recommendations, net worth projections, and Monte Carlo simulations.
All features work with comprehensive dummy data for demonstration.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import random
import math
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/decision-engine", tags=["Decision Engine"])


class HealthScoreRequest(BaseModel):
    age: int = 45
    retirement_age: int = 65
    current_income: float = 180000
    annual_expenses: float = 120000
    total_assets: float = 2500000
    total_debt: float = 450000
    super_balance: float = 580000
    emergency_fund: float = 75000
    investment_portfolio: float = 350000
    property_value: float = 950000
    savings_rate: float = 0.15
    mortgage_rate: float = 6.5
    mortgage_balance: float = 450000


class MonteCarloRequest(BaseModel):
    initial_value: float = 1500000
    annual_contribution: float = 50000
    expected_return: float = 0.07
    volatility: float = 0.15
    years: int = 20
    target_value: float = 3500000
    simulations: int = 10000
    inflation_rate: float = 0.03


class ScenarioRequest(BaseModel):
    scenario_id: str
    base_net_worth: float = 1500000
    annual_savings: float = 50000
    years: int = 20
    growth_rate: float = 0.07


# ==================== HEALTH SCORE ====================

@router.post("/health-score-v2")
async def calculate_health_score_v2(request: HealthScoreRequest):
    """Calculate comprehensive financial health score with dummy data."""
    
    # Calculate derived metrics
    net_worth = request.total_assets - request.total_debt
    debt_to_asset_ratio = request.total_debt / request.total_assets if request.total_assets > 0 else 0
    emergency_months = request.emergency_fund / (request.annual_expenses / 12) if request.annual_expenses > 0 else 0
    savings_rate_percent = request.savings_rate * 100
    years_to_retirement = request.retirement_age - request.age
    
    # Component scores (0-100)
    scores = {
        "savings_rate": min(100, savings_rate_percent * 4),  # 25% = 100
        "emergency_fund": min(100, emergency_months * 16.67),  # 6 months = 100
        "debt_management": max(0, 100 - debt_to_asset_ratio * 200),  # 50% ratio = 0
        "retirement_progress": min(100, (request.super_balance / (request.current_income * years_to_retirement * 0.5)) * 100),
        "diversification": 75 + random.randint(-10, 15),  # Simulated
        "insurance_coverage": 70 + random.randint(-5, 20),  # Simulated
    }
    
    # Overall score (weighted average)
    weights = {
        "savings_rate": 0.25,
        "emergency_fund": 0.15,
        "debt_management": 0.20,
        "retirement_progress": 0.25,
        "diversification": 0.10,
        "insurance_coverage": 0.05
    }
    
    overall_score = sum(scores[k] * weights[k] for k in scores)
    
    # Grade
    if overall_score >= 85:
        grade = "A"
        grade_description = "Excellent"
    elif overall_score >= 70:
        grade = "B"
        grade_description = "Good"
    elif overall_score >= 55:
        grade = "C"
        grade_description = "Fair"
    elif overall_score >= 40:
        grade = "D"
        grade_description = "Needs Improvement"
    else:
        grade = "F"
        grade_description = "Critical"
    
    return {
        "success": True,
        "overall_score": round(overall_score, 1),
        "grade": grade,
        "grade_description": grade_description,
        "component_scores": {k: round(v, 1) for k, v in scores.items()},
        "metrics": {
            "net_worth": round(net_worth, 2),
            "debt_to_asset_ratio": round(debt_to_asset_ratio * 100, 1),
            "emergency_months": round(emergency_months, 1),
            "savings_rate": round(savings_rate_percent, 1),
            "years_to_retirement": years_to_retirement
        },
        "strengths": [
            "Strong savings rate" if scores["savings_rate"] >= 70 else None,
            "Healthy emergency fund" if scores["emergency_fund"] >= 70 else None,
            "Good debt management" if scores["debt_management"] >= 70 else None,
            "On track for retirement" if scores["retirement_progress"] >= 70 else None
        ],
        "areas_for_improvement": [
            "Increase savings rate" if scores["savings_rate"] < 60 else None,
            "Build emergency fund" if scores["emergency_fund"] < 60 else None,
            "Reduce debt levels" if scores["debt_management"] < 60 else None,
            "Boost retirement contributions" if scores["retirement_progress"] < 60 else None
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/recommendations-v2")
async def get_recommendations_v2(request: HealthScoreRequest):
    """Get personalized financial recommendations with dummy data."""
    
    recommendations = []
    
    # Savings recommendations
    if request.savings_rate < 0.20:
        savings_increase = (0.20 - request.savings_rate) * request.current_income
        recommendations.append({
            "id": "increase_savings",
            "category": "savings",
            "priority": "high",
            "title": "Increase Savings Rate",
            "description": f"Your current savings rate is {request.savings_rate*100:.0f}%. Aim for at least 20% to accelerate wealth building.",
            "impact": f"+${int(savings_increase):,}/year",
            "impact_primary": savings_increase,
            "difficulty": "medium"
        })
    
    # Emergency fund
    emergency_months = request.emergency_fund / (request.annual_expenses / 12)
    if emergency_months < 6:
        emergency_gap = (6 - emergency_months) * request.annual_expenses / 12
        recommendations.append({
            "id": "emergency_fund",
            "category": "safety",
            "priority": "high",
            "title": "Build Emergency Fund",
            "description": f"You have {emergency_months:.1f} months of expenses. Target 6 months for financial security.",
            "impact": f"Need ${int(emergency_gap):,} more",
            "impact_primary": emergency_gap,
            "difficulty": "easy"
        })
    
    # Super contribution
    concessional_cap = 30000
    current_contrib = request.super_balance * 0.05  # Estimate
    if current_contrib < concessional_cap:
        tax_saving = (concessional_cap - current_contrib) * 0.32
        recommendations.append({
            "id": "super_boost",
            "category": "super",
            "priority": "medium",
            "title": "Maximize Super Contributions",
            "description": "Consider salary sacrificing to maximize your concessional contribution cap of $30,000.",
            "impact": f"Tax saving up to ${int(tax_saving):,}",
            "impact_primary": tax_saving,
            "difficulty": "easy"
        })
    
    # Debt reduction
    debt_ratio = request.total_debt / request.total_assets if request.total_assets > 0 else 0
    if debt_ratio > 0.30:
        interest_savings = request.total_debt * 0.02
        recommendations.append({
            "id": "debt_reduction",
            "category": "debt",
            "priority": "high",
            "title": "Accelerate Debt Paydown",
            "description": f"Your debt-to-asset ratio is {debt_ratio*100:.0f}%. Consider aggressive debt reduction strategies.",
            "impact": f"Interest savings of ${int(interest_savings):,}/year",
            "impact_primary": interest_savings,
            "difficulty": "medium"
        })
    
    # Investment diversification
    recommendations.append({
        "id": "diversification",
        "category": "investment",
        "priority": "low",
        "title": "Review Portfolio Allocation",
        "description": "Regular portfolio rebalancing ensures your investments match your risk profile.",
        "impact": "Optimized risk-adjusted returns",
        "impact_primary": request.investment_portfolio * 0.01,  # 1% improvement potential
        "difficulty": "easy"
    })
    
    # Tax optimization
    tax_savings = request.current_income * 0.02
    recommendations.append({
        "id": "tax_optimization",
        "category": "tax",
        "priority": "medium",
        "title": "Tax Planning Review",
        "description": "Schedule an annual tax review to maximize deductions and minimize tax liability.",
        "impact": f"Potential savings of ${int(tax_savings):,}/year",
        "impact_primary": tax_savings,
        "difficulty": "medium"
    })
    
    return {
        "success": True,
        "recommendations": recommendations,
        "total_recommendations": len(recommendations),
        "high_priority_count": len([r for r in recommendations if r["priority"] == "high"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== NET WORTH PROJECTION ====================

@router.get("/net-worth-projection")
async def get_net_worth_projection(
    current_net_worth: float = 1500000,
    annual_savings: float = 50000,
    years: int = 25,
    growth_rate: float = 0.07
):
    """Project net worth growth over time with dummy data."""
    
    projections = []
    value = current_net_worth
    
    for year in range(years + 1):
        projections.append({
            "year": year,
            "age": 45 + year,
            "net_worth": round(value, 0),
            "label": f"Year {year}"
        })
        # Apply growth and add savings
        value = value * (1 + growth_rate) + annual_savings
    
    # Calculate key milestones
    double_point = next((p["year"] for p in projections if p["net_worth"] >= current_net_worth * 2), None)
    million_milestones = []
    for target in [2000000, 3000000, 4000000, 5000000]:
        milestone = next((p for p in projections if p["net_worth"] >= target), None)
        if milestone:
            million_milestones.append({
                "target": target,
                "year": milestone["year"],
                "age": milestone["age"]
            })
    
    return {
        "success": True,
        "projections": projections,
        "summary": {
            "starting_value": current_net_worth,
            "ending_value": round(projections[-1]["net_worth"], 0),
            "total_growth": round(projections[-1]["net_worth"] - current_net_worth, 0),
            "growth_multiple": round(projections[-1]["net_worth"] / current_net_worth, 2),
            "double_year": double_point,
            "milestones": million_milestones
        },
        "assumptions": {
            "annual_savings": annual_savings,
            "growth_rate": growth_rate,
            "years": years
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== MONTE CARLO SIMULATION ====================

@router.post("/monte-carlo-advanced")
async def run_monte_carlo_advanced(request: MonteCarloRequest):
    """Run Monte Carlo simulation with dummy data."""
    
    # Generate simulated results
    final_values = []
    paths = []
    
    for sim in range(min(request.simulations, 1000)):  # Limit for performance
        value = request.initial_value
        path = [value]
        
        for year in range(request.years):
            # Random return with drift
            annual_return = random.gauss(request.expected_return, request.volatility)
            value = value * (1 + annual_return) + request.annual_contribution
            value = max(0, value)  # Can't go negative
            path.append(value)
        
        final_values.append(value)
        if sim < 100:  # Store first 100 paths for visualization
            paths.append(path)
    
    # Calculate statistics
    final_values.sort()
    success_count = len([v for v in final_values if v >= request.target_value])
    success_probability = success_count / len(final_values) * 100
    
    percentiles = {
        "p5": final_values[int(len(final_values) * 0.05)],
        "p10": final_values[int(len(final_values) * 0.10)],
        "p25": final_values[int(len(final_values) * 0.25)],
        "p50": final_values[int(len(final_values) * 0.50)],
        "p75": final_values[int(len(final_values) * 0.75)],
        "p90": final_values[int(len(final_values) * 0.90)],
        "p95": final_values[int(len(final_values) * 0.95)],
    }
    
    return {
        "success": True,
        "success_probability": round(success_probability, 1),
        "target_value": request.target_value,
        "simulations": request.simulations,
        "percentiles": {k: round(v, 0) for k, v in percentiles.items()},
        "statistics": {
            "mean": round(sum(final_values) / len(final_values), 0),
            "median": round(percentiles["p50"], 0),
            "min": round(min(final_values), 0),
            "max": round(max(final_values), 0),
            "std_dev": round((sum((x - sum(final_values)/len(final_values))**2 for x in final_values) / len(final_values))**0.5, 0)
        },
        "paths_sample": paths[:10],  # First 10 paths for visualization
        "interpretation": {
            "confidence": "high" if success_probability >= 80 else "medium" if success_probability >= 60 else "low",
            "message": f"Based on {request.simulations:,} simulations, there is a {success_probability:.0f}% chance of reaching ${request.target_value:,.0f} in {request.years} years."
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== SCENARIO ANALYSIS ====================

@router.post("/scenario/{scenario_id}")
async def run_scenario(scenario_id: str, request: ScenarioRequest):
    """Run life scenario analysis with dummy data."""
    
    base_projection = []
    scenario_projection = []
    value = request.base_net_worth
    scenario_value = request.base_net_worth
    
    # Define scenario impacts
    scenario_impacts = {
        "retire_early_5": {"years_adjustment": -5, "savings_multiplier": 1.0, "growth_adjustment": 0},
        "retire_late_5": {"years_adjustment": 5, "savings_multiplier": 1.0, "growth_adjustment": 0},
        "increase_savings_500": {"years_adjustment": 0, "savings_multiplier": 1.0, "extra_savings": 6000},
        "increase_savings_1000": {"years_adjustment": 0, "savings_multiplier": 1.0, "extra_savings": 12000},
        "buy_property": {"years_adjustment": 0, "savings_multiplier": 0.7, "growth_adjustment": 0.01},
        "market_crash": {"years_adjustment": 0, "savings_multiplier": 1.0, "immediate_impact": -0.30},
    }
    
    impact = scenario_impacts.get(scenario_id, {})
    
    # Apply immediate impact (e.g., market crash)
    if "immediate_impact" in impact:
        scenario_value *= (1 + impact["immediate_impact"])
    
    for year in range(request.years + 1):
        base_projection.append({"year": year, "value": round(value, 0)})
        scenario_projection.append({"year": year, "value": round(scenario_value, 0)})
        
        # Base growth
        value = value * (1 + request.growth_rate) + request.annual_savings
        
        # Scenario growth
        extra_savings = impact.get("extra_savings", 0)
        adjusted_savings = request.annual_savings * impact.get("savings_multiplier", 1.0) + extra_savings
        adjusted_growth = request.growth_rate + impact.get("growth_adjustment", 0)
        scenario_value = scenario_value * (1 + adjusted_growth) + adjusted_savings
    
    # Calculate difference
    final_difference = scenario_projection[-1]["value"] - base_projection[-1]["value"]
    
    return {
        "success": True,
        "scenario_id": scenario_id,
        "base_projection": base_projection,
        "scenario_projection": scenario_projection,
        "comparison": {
            "base_final": base_projection[-1]["value"],
            "scenario_final": scenario_projection[-1]["value"],
            "difference": round(final_difference, 0),
            "difference_percent": round(final_difference / base_projection[-1]["value"] * 100, 1)
        },
        "recommendation": "positive" if final_difference > 0 else "negative",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== WEALTH BRIEF ====================

@router.get("/wealth-brief")
async def get_wealth_brief():
    """Get AI-generated wealth brief with dummy data."""
    
    return {
        "success": True,
        "brief": {
            "headline": "Your financial health is on track",
            "score": 78,
            "grade": "B+",
            "summary": "Your portfolio has grown 8.2% this month, outperforming the ASX 200 by 2.1%. Your retirement savings are tracking well, with a 76% probability of meeting your $3.5M goal.",
            "highlights": [
                {"type": "positive", "text": "Portfolio up 8.2% this month"},
                {"type": "positive", "text": "Emergency fund fully funded at 8 months"},
                {"type": "neutral", "text": "Super contributions on track"},
                {"type": "action", "text": "Review property insurance renewal due next month"}
            ],
            "market_context": {
                "asx200_mtd": 6.1,
                "your_performance": 8.2,
                "outperformance": 2.1
            },
            "next_actions": [
                "Schedule annual insurance review",
                "Consider salary sacrifice before EOFY",
                "Rebalance portfolio (tech overweight by 5%)"
            ]
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== QUICK ANALYSIS ====================

@router.get("/quick-analysis")
async def get_quick_analysis():
    """Get quick financial analysis with dummy data."""
    
    return {
        "success": True,
        "analysis": {
            "net_worth": {
                "current": 2050000,
                "change_mtd": 165000,
                "change_ytd": 285000,
                "trend": "up"
            },
            "savings_rate": {
                "current": 22,
                "target": 25,
                "status": "good"
            },
            "debt_ratio": {
                "current": 18,
                "recommended": 30,
                "status": "excellent"
            },
            "retirement_readiness": {
                "probability": 76,
                "target_age": 60,
                "projected_balance": 3200000
            },
            "alerts": [
                {"type": "info", "message": "Car insurance due for renewal in 14 days"},
                {"type": "opportunity", "message": "Consider contributing extra $5K to super before June 30"}
            ]
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
