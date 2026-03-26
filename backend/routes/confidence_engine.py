"""
Retirement Confidence Engine - Core Backend
Monte Carlo simulation-based retirement confidence scoring with multi-entity, multi-asset support
"""

import os
import math
import random
import logging
import numpy as np
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/confidence-engine", tags=["Retirement Confidence Engine"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ==================== MODELS ====================

class AssetInput(BaseModel):
    id: str
    name: str
    asset_class: str  # cash, fixed_income, au_shares, intl_shares, property, alternatives, super
    entity: str  # personal, joint, company, trust, smsf
    current_value: float
    cost_base: float
    expected_return: float = 7.0  # Annual %
    volatility: float = 12.0  # Annual standard deviation %
    is_listed: bool = True
    is_assessable: bool = True  # For Age Pension means test

class LiabilityInput(BaseModel):
    id: str
    name: str
    entity: str
    balance: float
    interest_rate: float
    monthly_payment: float
    years_remaining: int

class IncomeInput(BaseModel):
    id: str
    name: str
    entity: str
    annual_amount: float
    growth_rate: float = 3.0
    ends_at_retirement: bool = True
    is_taxable: bool = True

class ExpenseInput(BaseModel):
    category: str
    annual_amount: float
    escalation_rate: float = 3.0  # Above/below inflation adjustment
    is_essential: bool = True
    ends_at_age: Optional[int] = None  # e.g., mortgage ends at 65

class PersonInput(BaseModel):
    id: int
    name: str
    current_age: int
    retirement_age: int = 65
    life_expectancy: int = 90
    gender: str = "male"

class OneOffEvent(BaseModel):
    year: int
    amount: float
    description: str
    is_expense: bool = True  # False = income (e.g., inheritance)

class PlannedAssetSale(BaseModel):
    asset_id: str
    year: int
    percent_to_sell: float
    reason: str = ""

class ConfidenceRequest(BaseModel):
    """Full request for confidence calculation"""
    client_id: str = "demo_client"
    people: List[PersonInput]
    is_couple: bool = False
    assets: List[AssetInput]
    liabilities: List[LiabilityInput]
    incomes: List[IncomeInput]
    expenses: List[ExpenseInput]
    one_off_events: List[OneOffEvent] = []
    planned_sales: List[PlannedAssetSale] = []
    
    # Assumptions
    inflation_rate: float = 2.5
    super_contribution_rate: float = 12.0
    salary_sacrifice: float = 0
    include_age_pension: bool = True
    
    # Monte Carlo settings
    num_simulations: int = 1000  # Configurable
    
    # Target
    target_legacy: float = 0  # Desired amount to leave

class ScenarioInput(BaseModel):
    """A scenario for comparison"""
    scenario_id: str = Field(default_factory=lambda: f"SCEN-{uuid.uuid4().hex[:8].upper()}")
    name: str
    description: str = ""
    adjustments: Dict[str, Any] = {}  # Key adjustments from base case
    # Specific overrides
    retirement_age_override: Optional[int] = None
    spending_adjustment_percent: Optional[float] = None  # +10 = 10% more spending
    contribution_adjustment: Optional[float] = None  # Additional annual contribution
    return_adjustment_percent: Optional[float] = None  # -2 = 2% lower returns

class MultiScenarioRequest(BaseModel):
    """Request for multi-scenario comparison"""
    base_case: ConfidenceRequest
    scenarios: List[ScenarioInput]

# ==================== RISK PARAMETERS ====================

# Asset class parameters (expected return, volatility, correlation with market)
ASSET_CLASS_PARAMS = {
    "cash": {"return": 4.5, "volatility": 1.0, "market_beta": 0.0},
    "fixed_income": {"return": 5.5, "volatility": 5.0, "market_beta": 0.2},
    "au_shares": {"return": 8.5, "volatility": 18.0, "market_beta": 1.0},
    "intl_shares": {"return": 9.0, "volatility": 20.0, "market_beta": 1.1},
    "property": {"return": 6.0, "volatility": 12.0, "market_beta": 0.6},
    "alternatives": {"return": 7.0, "volatility": 15.0, "market_beta": 0.5},
    "super_accum": {"return": 7.5, "volatility": 10.0, "market_beta": 0.7},
    "super_pension": {"return": 7.0, "volatility": 8.0, "market_beta": 0.6},
    "crypto": {"return": 15.0, "volatility": 60.0, "market_beta": 1.5},
}

# CGT discount by entity
CGT_DISCOUNT = {
    "personal": 0.5,
    "joint": 0.5,
    "trust": 0.5,
    "company": 0.0,
    "smsf": 0.333,
}

# Mortality adjustment factors (simplified)
MORTALITY_ADJUSTMENT = {
    "male": 1.0,
    "female": 1.05,  # Women live ~5% longer on average
}

# ==================== MONTE CARLO ENGINE ====================

def run_monte_carlo_simulation(
    request: ConfidenceRequest,
    scenario_adjustments: Optional[ScenarioInput] = None
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation for retirement confidence
    Returns confidence score and risk breakdown
    """
    
    # Apply scenario adjustments if provided
    retirement_age = request.people[0].retirement_age
    if scenario_adjustments and scenario_adjustments.retirement_age_override:
        retirement_age = scenario_adjustments.retirement_age_override
    
    spending_multiplier = 1.0
    if scenario_adjustments and scenario_adjustments.spending_adjustment_percent:
        spending_multiplier = 1 + (scenario_adjustments.spending_adjustment_percent / 100)
    
    extra_contribution = 0
    if scenario_adjustments and scenario_adjustments.contribution_adjustment:
        extra_contribution = scenario_adjustments.contribution_adjustment
    
    return_adjustment = 0
    if scenario_adjustments and scenario_adjustments.return_adjustment_percent:
        return_adjustment = scenario_adjustments.return_adjustment_percent / 100
    
    # Key parameters
    current_age = request.people[0].current_age
    life_expectancy = request.people[0].life_expectancy
    years_to_retirement = max(0, retirement_age - current_age)
    retirement_years = life_expectancy - retirement_age
    total_years = life_expectancy - current_age
    
    # Calculate totals
    total_assets = sum(a.current_value for a in request.assets)
    total_liabilities = sum(l.balance for l in request.liabilities)
    net_worth = total_assets - total_liabilities
    
    # Calculate weighted portfolio return and volatility
    portfolio_return = 0
    portfolio_volatility_sq = 0
    if total_assets > 0:
        for asset in request.assets:
            weight = asset.current_value / total_assets
            params = ASSET_CLASS_PARAMS.get(asset.asset_class, {"return": 7, "volatility": 12})
            asset_return = (params["return"] + return_adjustment * 100) / 100
            asset_vol = params["volatility"] / 100
            portfolio_return += weight * asset_return
            portfolio_volatility_sq += (weight * asset_vol) ** 2
    
    portfolio_volatility = math.sqrt(portfolio_volatility_sq) if portfolio_volatility_sq > 0 else 0.10
    
    # Annual expenses
    base_expenses = sum(e.annual_amount for e in request.expenses) * spending_multiplier
    
    # Annual income (pre-retirement)
    employment_income = sum(i.annual_amount for i in request.incomes if i.ends_at_retirement)
    other_income = sum(i.annual_amount for i in request.incomes if not i.ends_at_retirement)
    
    # Super contributions
    annual_super_contrib = (employment_income * request.super_contribution_rate / 100) + request.salary_sacrifice + extra_contribution
    
    # Run simulations
    num_sims = request.num_simulations
    success_count = 0
    final_values = []
    shortfall_years = []
    
    # Track risk metrics
    longevity_failures = 0
    market_failures = 0
    spending_failures = 0
    inflation_failures = 0
    
    np.random.seed(42)  # For reproducibility in testing
    
    for sim in range(num_sims):
        # Initialize simulation state
        assets = net_worth
        super_balance = sum(a.current_value for a in request.assets if 'super' in a.asset_class)
        non_super_assets = assets - super_balance
        
        sim_success = True
        sim_shortfall_year = None
        failure_reason = None
        
        for year in range(total_years + 1):
            age = current_age + year
            is_retired = age >= retirement_age
            
            # Generate random market return
            market_return = np.random.normal(portfolio_return, portfolio_volatility)
            
            # Generate inflation shock
            inflation = np.random.normal(request.inflation_rate / 100, 0.01)
            
            # Calculate income
            if not is_retired:
                year_income = employment_income * ((1 + request.inflation_rate / 100) ** year)
                year_income += other_income * ((1 + request.inflation_rate / 100) ** year)
                
                # Super contributions
                super_balance += annual_super_contrib * ((1 + request.inflation_rate / 100) ** year)
                super_balance *= (1 + market_return * 0.8)  # Super has lower volatility
            else:
                # Retirement income
                year_income = other_income * ((1 + request.inflation_rate / 100) ** year)
                
                # Super drawdown
                min_drawdown_rate = get_minimum_drawdown_rate(age)
                drawdown = super_balance * max(min_drawdown_rate, 0.05)
                super_balance = max(0, super_balance * (1 + market_return * 0.7) - drawdown)
                year_income += drawdown
                
                # Age Pension (simplified)
                if request.include_age_pension and age >= 67:
                    assessable = non_super_assets + super_balance
                    pension = calculate_age_pension_simple(assessable, request.is_couple)
                    year_income += pension
            
            # Calculate expenses (inflation adjusted)
            year_expenses = base_expenses * ((1 + inflation) ** year)
            
            # One-off events
            current_year = datetime.now().year + year
            for event in request.one_off_events:
                if event.year == current_year:
                    if event.is_expense:
                        year_expenses += event.amount
                    else:
                        year_income += event.amount
            
            # Net cashflow
            net_cashflow = year_income - year_expenses
            
            # Update assets
            if not is_retired:
                non_super_assets += net_cashflow
                non_super_assets *= (1 + market_return)
            else:
                non_super_assets += net_cashflow
                non_super_assets *= (1 + market_return * 0.9)
            
            # Check for failure
            total_wealth = non_super_assets + super_balance
            if total_wealth < 0 and is_retired:
                sim_success = False
                sim_shortfall_year = year
                
                # Determine failure reason
                if year > retirement_years * 0.8:
                    longevity_failures += 1
                    failure_reason = "longevity"
                elif market_return < -0.15:
                    market_failures += 1
                    failure_reason = "market"
                elif inflation > 0.05:
                    inflation_failures += 1
                    failure_reason = "inflation"
                else:
                    spending_failures += 1
                    failure_reason = "spending"
                break
        
        if sim_success:
            success_count += 1
            final_values.append(non_super_assets + super_balance)
        else:
            shortfall_years.append(sim_shortfall_year)
            final_values.append(0)
    
    # Calculate confidence score
    confidence_score = (success_count / num_sims) * 100
    
    # Risk breakdown (normalized to sum to 100%)
    total_failures = num_sims - success_count
    if total_failures > 0:
        longevity_risk = (longevity_failures / total_failures) * (100 - confidence_score)
        market_risk = (market_failures / total_failures) * (100 - confidence_score)
        spending_risk = (spending_failures / total_failures) * (100 - confidence_score)
        inflation_risk = (inflation_failures / total_failures) * (100 - confidence_score)
    else:
        longevity_risk = market_risk = spending_risk = inflation_risk = 0
    
    # Calculate percentiles of final values
    final_values_arr = np.array(final_values)
    
    return {
        "confidence_score": round(confidence_score, 1),
        "risk_breakdown": {
            "longevity_risk": round(longevity_risk, 1),
            "market_risk": round(market_risk, 1),
            "spending_risk": round(spending_risk, 1),
            "inflation_risk": round(inflation_risk, 1),
        },
        "statistics": {
            "median_final_wealth": round(float(np.median(final_values_arr)), 0),
            "p10_final_wealth": round(float(np.percentile(final_values_arr, 10)), 0),
            "p90_final_wealth": round(float(np.percentile(final_values_arr, 90)), 0),
            "mean_final_wealth": round(float(np.mean(final_values_arr)), 0),
            "probability_of_ruin": round(100 - confidence_score, 1),
        },
        "inputs": {
            "net_worth": round(net_worth, 0),
            "years_to_retirement": years_to_retirement,
            "retirement_years": retirement_years,
            "portfolio_return": round(portfolio_return * 100, 1),
            "portfolio_volatility": round(portfolio_volatility * 100, 1),
            "annual_expenses": round(base_expenses, 0),
        },
        "simulations_run": num_sims,
    }

def get_minimum_drawdown_rate(age: int) -> float:
    """Get minimum super drawdown rate by age"""
    rates = {55: 0.04, 60: 0.04, 65: 0.05, 70: 0.05, 75: 0.06, 80: 0.07, 85: 0.09, 90: 0.11, 95: 0.14}
    for threshold_age in sorted(rates.keys(), reverse=True):
        if age >= threshold_age:
            return rates[threshold_age]
    return 0.04

def calculate_age_pension_simple(assessable_assets: float, is_couple: bool) -> float:
    """Simplified Age Pension calculation"""
    if is_couple:
        threshold = 451500
        max_pension = 43753
    else:
        threshold = 301750
        max_pension = 29024
    
    if assessable_assets <= threshold:
        return max_pension
    
    reduction = (assessable_assets - threshold) * 0.03
    return max(0, max_pension - reduction)

# ==================== API ENDPOINTS ====================

@router.post("/calculate")
async def calculate_confidence(request: ConfidenceRequest):
    """Calculate retirement confidence score with full risk breakdown"""
    
    result = run_monte_carlo_simulation(request)
    
    # Store calculation for history
    db = await get_db()
    calc_record = {
        "calc_id": f"CONF-{uuid.uuid4().hex[:8].upper()}",
        "client_id": request.client_id,
        "confidence_score": result["confidence_score"],
        "risk_breakdown": result["risk_breakdown"],
        "statistics": result["statistics"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.confidence_calculations.insert_one(calc_record)
    
    return {
        "success": True,
        "calc_id": calc_record["calc_id"],
        **result
    }

@router.post("/compare-scenarios")
async def compare_scenarios(request: MultiScenarioRequest):
    """Compare multiple scenarios side-by-side"""
    
    results = []
    
    # Calculate base case
    base_result = run_monte_carlo_simulation(request.base_case)
    results.append({
        "scenario_id": "BASE",
        "name": "Current Plan",
        "description": "Your current retirement trajectory",
        "confidence_score": base_result["confidence_score"],
        "risk_breakdown": base_result["risk_breakdown"],
        "statistics": base_result["statistics"],
        "adjustments": {}
    })
    
    # Calculate each scenario
    for scenario in request.scenarios:
        scenario_result = run_monte_carlo_simulation(request.base_case, scenario)
        
        # Calculate delta from base
        delta = scenario_result["confidence_score"] - base_result["confidence_score"]
        
        results.append({
            "scenario_id": scenario.scenario_id,
            "name": scenario.name,
            "description": scenario.description,
            "confidence_score": scenario_result["confidence_score"],
            "confidence_delta": round(delta, 1),
            "risk_breakdown": scenario_result["risk_breakdown"],
            "statistics": scenario_result["statistics"],
            "adjustments": {
                "retirement_age": scenario.retirement_age_override,
                "spending_adjustment": scenario.spending_adjustment_percent,
                "contribution_adjustment": scenario.contribution_adjustment,
                "return_adjustment": scenario.return_adjustment_percent,
            }
        })
    
    # Sort by confidence score descending
    results.sort(key=lambda x: x["confidence_score"], reverse=True)
    
    # Store comparison
    db = await get_db()
    comparison_record = {
        "comparison_id": f"COMP-{uuid.uuid4().hex[:8].upper()}",
        "client_id": request.base_case.client_id,
        "num_scenarios": len(results),
        "best_scenario": results[0]["name"],
        "best_score": results[0]["confidence_score"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.scenario_comparisons.insert_one(comparison_record)
    
    return {
        "success": True,
        "comparison_id": comparison_record["comparison_id"],
        "scenarios": results,
        "recommendation": get_scenario_recommendation(results)
    }

def get_scenario_recommendation(results: List[Dict]) -> Dict[str, Any]:
    """Generate recommendation based on scenario comparison"""
    base = next((r for r in results if r["scenario_id"] == "BASE"), None)
    best = results[0] if results else None
    
    if not base or not best:
        return {"recommendation": "Unable to generate recommendation"}
    
    if best["scenario_id"] == "BASE":
        return {
            "recommendation": "Your current plan is optimal among the scenarios tested.",
            "confidence_improvement": 0,
            "action": "Maintain current strategy"
        }
    
    improvement = best["confidence_score"] - base["confidence_score"]
    
    return {
        "recommendation": f"Consider '{best['name']}' for a {improvement:.1f}% improvement in retirement confidence.",
        "confidence_improvement": improvement,
        "best_scenario": best["name"],
        "action": best.get("description", "Review scenario details")
    }

@router.get("/risk-factors")
async def get_risk_factors():
    """Get descriptions of all risk factors"""
    return {
        "risk_factors": [
            {
                "id": "longevity_risk",
                "name": "Longevity Risk",
                "description": "Risk of outliving your savings due to living longer than expected",
                "mitigation": "Consider lifetime annuities, conservative drawdown rates, or working longer"
            },
            {
                "id": "market_risk",
                "name": "Market Risk",
                "description": "Risk of poor investment returns, especially early in retirement (sequence of returns risk)",
                "mitigation": "Diversify investments, reduce equity exposure near retirement, maintain cash buffer"
            },
            {
                "id": "spending_risk",
                "name": "Spending Risk",
                "description": "Risk of spending too much, especially on discretionary items or unexpected expenses",
                "mitigation": "Create detailed budget, build emergency fund, prioritize essential expenses"
            },
            {
                "id": "inflation_risk",
                "name": "Inflation Risk",
                "description": "Risk of inflation eroding purchasing power of savings over time",
                "mitigation": "Include growth assets, inflation-linked bonds, review spending annually"
            }
        ]
    }

@router.get("/history/{client_id}")
async def get_confidence_history(client_id: str, limit: int = 20):
    """Get confidence calculation history for a client"""
    db = await get_db()
    
    history = await db.confidence_calculations.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    return {
        "client_id": client_id,
        "history": history,
        "total": len(history)
    }

@router.post("/quick-calculate")
async def quick_calculate(
    net_worth: float,
    annual_income: float,
    annual_expenses: float,
    current_age: int,
    retirement_age: int = 65,
    life_expectancy: int = 90,
    is_couple: bool = False,
    num_simulations: int = 1000
):
    """Quick confidence calculation with minimal inputs"""
    
    # Create simplified request
    request = ConfidenceRequest(
        client_id="quick_calc",
        people=[PersonInput(id=1, name="Client", current_age=current_age, retirement_age=retirement_age, life_expectancy=life_expectancy)],
        is_couple=is_couple,
        assets=[
            AssetInput(id="A1", name="Portfolio", asset_class="au_shares", entity="personal", 
                      current_value=net_worth * 0.6, cost_base=net_worth * 0.4, expected_return=8.5, volatility=18),
            AssetInput(id="A2", name="Super", asset_class="super_accum", entity="smsf",
                      current_value=net_worth * 0.3, cost_base=net_worth * 0.3, expected_return=7.5, volatility=10),
            AssetInput(id="A3", name="Cash", asset_class="cash", entity="personal",
                      current_value=net_worth * 0.1, cost_base=net_worth * 0.1, expected_return=4.5, volatility=1),
        ],
        liabilities=[],
        incomes=[IncomeInput(id="I1", name="Income", entity="personal", annual_amount=annual_income, ends_at_retirement=True)],
        expenses=[ExpenseInput(category="living", annual_amount=annual_expenses, is_essential=True)],
        num_simulations=num_simulations
    )
    
    result = run_monte_carlo_simulation(request)
    
    return {
        "confidence_score": result["confidence_score"],
        "risk_breakdown": result["risk_breakdown"],
        "quick_assessment": get_quick_assessment(result["confidence_score"]),
        "statistics": result["statistics"]
    }

def get_quick_assessment(score: float) -> Dict[str, str]:
    """Get quick assessment based on confidence score"""
    if score >= 90:
        return {"status": "excellent", "message": "You're in excellent shape for retirement!", "color": "green"}
    elif score >= 75:
        return {"status": "good", "message": "You're on track, with room for improvement.", "color": "blue"}
    elif score >= 50:
        return {"status": "moderate", "message": "Some adjustments recommended to improve confidence.", "color": "yellow"}
    elif score >= 25:
        return {"status": "concerning", "message": "Significant changes needed to secure retirement.", "color": "orange"}
    else:
        return {"status": "critical", "message": "Urgent action required to avoid retirement shortfall.", "color": "red"}

@router.get("/asset-classes")
async def get_asset_class_parameters():
    """Get asset class parameters for reference"""
    return {
        "asset_classes": [
            {**{"id": k}, **v, "description": get_asset_class_description(k)}
            for k, v in ASSET_CLASS_PARAMS.items()
        ]
    }

def get_asset_class_description(asset_class: str) -> str:
    """Get description for asset class"""
    descriptions = {
        "cash": "Bank accounts, savings, money market funds",
        "fixed_income": "Bonds, term deposits, fixed interest investments",
        "au_shares": "Australian listed equities (ASX)",
        "intl_shares": "International listed equities",
        "property": "Real estate investments (residential, commercial)",
        "alternatives": "Hedge funds, private equity, commodities",
        "super_accum": "Superannuation in accumulation phase",
        "super_pension": "Superannuation in pension/drawdown phase",
        "crypto": "Cryptocurrency and digital assets"
    }
    return descriptions.get(asset_class, "Investment asset")
