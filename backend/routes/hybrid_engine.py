"""
World-Class Hybrid Retirement Calculation Engine
Deterministic modeling, Monte Carlo simulation, behavioral adjustments,
and multi-factor confidence scoring system.

CORE PRINCIPLE: Confidence must reflect probability, downside risk,
behavioral flexibility, and financial resilience.
"""

import os
import logging
import numpy as np
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import asyncio
from enum import Enum

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hybrid-engine", tags=["Hybrid Retirement Engine"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ==================== ENUMS AND CONSTANTS ====================

class EngineMode(str, Enum):
    BACKGROUND = "background"  # Real-time updates
    PRESENTATION = "presentation"  # Advisor-controlled


class IncomeType(str, Enum):
    PENSION = "pension"  # Stability: 1.0
    ANNUITY = "annuity"  # Stability: 1.0
    SALARY = "salary"  # Stability: 0.7
    BUSINESS = "business"  # Stability: 0.4
    DIVIDENDS = "dividends"  # Stability: 0.4
    RENTAL = "rental"  # Stability: 0.6
    OTHER = "other"  # Stability: 0.5


INCOME_STABILITY_WEIGHTS = {
    "pension": 1.0,
    "annuity": 1.0,
    "salary": 0.7,
    "rental": 0.6,
    "business": 0.4,
    "dividends": 0.4,
    "other": 0.5
}

# Confidence score weights (must sum to 1.0)
CONFIDENCE_WEIGHTS = {
    "monte_carlo": 0.35,
    "downside_risk": 0.20,
    "income_stability": 0.15,
    "spending_flexibility": 0.10,
    "diversification": 0.10,
    "longevity_risk": 0.10
}

DEFAULT_PARAMS = {
    "expected_return": 0.07,  # 7% nominal
    "return_volatility": 0.15,  # 15% std dev
    "inflation_mean": 0.025,  # 2.5%
    "inflation_std": 0.01,  # 1%
    "fee_rate": 0.005,  # 0.5% annual fees
    "income_growth": 0.03,  # 3% income growth
    "num_simulations": 10000,
    "dynamic_spending_low_threshold": 0.75,
    "dynamic_spending_high_threshold": 1.25,
    "dynamic_spending_reduction": 0.90,
    "dynamic_spending_increase": 1.05,
    "longevity_stress_years": 5
}


# ==================== INPUT MODELS ====================

class IncomeSource(BaseModel):
    source_type: str  # pension, annuity, salary, business, dividends, rental, other
    annual_amount: float
    start_age: Optional[int] = None
    end_age: Optional[int] = None


class AssetHolding(BaseModel):
    name: str
    value: float
    asset_class: str  # equities, bonds, property, cash, alternatives


class ExpenseBreakdown(BaseModel):
    essential: float  # Housing, food, healthcare, utilities
    discretionary: float  # Travel, entertainment, hobbies


class HybridEngineRequest(BaseModel):
    # Basic inputs
    client_id: str
    current_age: int
    retirement_age: int = 65
    life_expectancy: int = 90
    
    # Financial inputs
    current_portfolio: float
    annual_contributions: float = 0
    annual_withdrawals: float = 0  # Pre-retirement
    retirement_spending: float = 80000  # Annual spending in retirement
    
    # Detailed inputs
    income_sources: Optional[List[IncomeSource]] = None
    asset_holdings: Optional[List[AssetHolding]] = None
    expense_breakdown: Optional[ExpenseBreakdown] = None
    
    # Assumptions (overridable)
    expected_return: float = 0.07
    return_volatility: float = 0.15
    inflation_rate: float = 0.025
    fee_rate: float = 0.005
    
    # Engine settings
    num_simulations: int = 10000
    enable_dynamic_spending: bool = True
    mode: EngineMode = EngineMode.PRESENTATION


class ScenarioComparisonRequest(BaseModel):
    scenarios: List[HybridEngineRequest]
    scenario_names: List[str]


# ==================== SECTION 1: DETERMINISTIC MODEL ====================

def run_deterministic_model(
    current_portfolio: float,
    current_age: int,
    retirement_age: int,
    life_expectancy: int,
    annual_contributions: float,
    retirement_spending: float,
    expected_return: float = 0.07,
    inflation_rate: float = 0.025,
    income_growth: float = 0.03,
    fee_rate: float = 0.005
) -> Dict[str, Any]:
    """
    SECTION 1: Deterministic baseline model.
    
    For each year t:
    Portfolio[t] = Portfolio[t-1] + Contributions[t] - Withdrawals[t] 
                   + (Portfolio[t-1] * Return[t]) - Fees[t]
    """
    years_to_retirement = retirement_age - current_age
    retirement_years = life_expectancy - retirement_age
    total_years = life_expectancy - current_age
    
    portfolio_path = [current_portfolio]
    contributions = annual_contributions
    # withdrawals tracked via retirement_withdrawals
    retirement_withdrawals = retirement_spending
    
    year_of_depletion = None
    
    for year in range(1, total_years + 1):
        current_year_age = current_age + year
        prev_portfolio = portfolio_path[-1]
        
        # Accumulation phase
        if current_year_age <= retirement_age:
            year_contributions = contributions
            year_withdrawals = 0
            contributions *= (1 + income_growth)
        # Retirement phase
        else:
            year_contributions = 0
            year_withdrawals = retirement_withdrawals
            retirement_withdrawals *= (1 + inflation_rate)
        
        # Calculate new portfolio value
        investment_return = prev_portfolio * expected_return
        fees = prev_portfolio * fee_rate
        
        new_portfolio = prev_portfolio + year_contributions - year_withdrawals + investment_return - fees
        
        # Check for depletion
        if new_portfolio < 0 and year_of_depletion is None:
            year_of_depletion = current_year_age
            new_portfolio = 0
        
        portfolio_path.append(max(0, new_portfolio))
    
    final_portfolio = portfolio_path[-1]
    required_wealth = retirement_spending * retirement_years  # Simplified
    shortfall = max(0, required_wealth - final_portfolio) if final_portfolio == 0 else 0
    
    return {
        "final_portfolio": round(final_portfolio, 2),
        "year_of_depletion": year_of_depletion,
        "depletes_early": year_of_depletion is not None and year_of_depletion < life_expectancy,
        "baseline_shortfall": round(shortfall, 2),
        "portfolio_path": [round(p, 2) for p in portfolio_path[::5]],  # Sample every 5 years
        "portfolio_at_retirement": round(portfolio_path[years_to_retirement], 2) if years_to_retirement < len(portfolio_path) else 0
    }


# ==================== SECTION 2: MONTE CARLO ENGINE ====================

def run_monte_carlo_simulation(
    current_portfolio: float,
    current_age: int,
    retirement_age: int,
    life_expectancy: int,
    annual_contributions: float,
    retirement_spending: float,
    expected_return: float = 0.07,
    return_volatility: float = 0.15,
    inflation_mean: float = 0.025,
    inflation_std: float = 0.01,
    income_growth: float = 0.03,
    fee_rate: float = 0.005,
    num_simulations: int = 10000,
    enable_dynamic_spending: bool = True,
    dynamic_low_threshold: float = 0.75,
    dynamic_high_threshold: float = 1.25
) -> Dict[str, Any]:
    """
    SECTION 2: Monte Carlo simulation with N=10,000 runs.
    
    For each simulation:
        For each year t:
            Return[t] ~ Normal(mean=μ, std=σ)
            Inflation[t] ~ Normal(mean=i, std=i_std)
    """
    _years_to_retirement = retirement_age - current_age
    _retirement_years = life_expectancy - retirement_age
    total_years = life_expectancy - current_age
    
    # Pre-compute expected portfolio path for dynamic spending thresholds
    _deterministic = run_deterministic_model(
        current_portfolio, current_age, retirement_age, life_expectancy,
        annual_contributions, retirement_spending, expected_return,
        inflation_mean, income_growth, fee_rate
    )
    
    # Store final outcomes
    final_portfolios = np.zeros(num_simulations)
    successful_simulations = 0
    portfolio_paths = []
    
    # Set seed for reproducibility in demos
    np.random.seed(42)
    
    for sim in range(num_simulations):
        portfolio = current_portfolio
        contributions = annual_contributions
        withdrawals = retirement_spending
        expected_path_value = current_portfolio
        
        sim_success = True
        sim_path = [portfolio]
        
        for year in range(1, total_years + 1):
            current_year_age = current_age + year
            
            # Generate random returns and inflation
            annual_return = np.random.normal(expected_return, return_volatility)
            annual_inflation = np.random.normal(inflation_mean, inflation_std)
            
            # Update expected path for dynamic spending reference
            expected_return_this_year = expected_return
            expected_path_value = expected_path_value * (1 + expected_return_this_year - fee_rate)
            
            # SECTION 4: Dynamic Spending Model
            if enable_dynamic_spending and current_year_age > retirement_age:
                threshold_low = expected_path_value * dynamic_low_threshold
                threshold_high = expected_path_value * dynamic_high_threshold
                
                if portfolio < threshold_low:
                    withdrawals *= 0.9  # Reduce spending by 10%
                elif portfolio > threshold_high:
                    withdrawals *= 1.05  # Increase spending by 5%
            
            # Accumulation vs retirement phase
            if current_year_age <= retirement_age:
                year_contributions = contributions
                year_withdrawals = 0
                contributions *= (1 + income_growth)
            else:
                year_contributions = 0
                year_withdrawals = withdrawals
                withdrawals *= (1 + annual_inflation)
            
            # Calculate new portfolio
            investment_return = portfolio * annual_return
            fees = portfolio * fee_rate
            
            portfolio = portfolio + year_contributions - year_withdrawals + investment_return - fees
            
            # Check for failure
            if portfolio < 0:
                portfolio = 0
                sim_success = False
            
            sim_path.append(portfolio)
        
        final_portfolios[sim] = portfolio
        if sim_success and portfolio > 0:
            successful_simulations += 1
        
        # Store sample paths for percentile analysis
        if sim < 100:
            portfolio_paths.append(sim_path)
    
    # Calculate success rate
    success_rate = successful_simulations / num_simulations
    
    # SECTION 3: Downside Risk (Tail Risk)
    _sorted_outcomes = np.sort(final_portfolios)
    p10 = np.percentile(final_portfolios, 10)
    p25 = np.percentile(final_portfolios, 25)
    p50 = np.percentile(final_portfolios, 50)
    p75 = np.percentile(final_portfolios, 75)
    p90 = np.percentile(final_portfolios, 90)
    
    # Required wealth (simplified: 25x annual spending)
    required_wealth = retirement_spending * 25
    downside_risk_score = max(0, min(1, 1 - (p10 / required_wealth))) if required_wealth > 0 else 0
    
    return {
        "success_rate": round(success_rate, 4),
        "success_rate_percent": round(success_rate * 100, 1),
        "num_simulations": num_simulations,
        "percentiles": {
            "p10": round(p10, 2),
            "p25": round(p25, 2),
            "p50_median": round(p50, 2),
            "p75": round(p75, 2),
            "p90": round(p90, 2)
        },
        "mean_outcome": round(np.mean(final_portfolios), 2),
        "std_outcome": round(np.std(final_portfolios), 2),
        "downside_risk_score": round(downside_risk_score, 4),
        "probability_of_ruin": round(1 - success_rate, 4),
        "dynamic_spending_enabled": enable_dynamic_spending
    }


# ==================== SECTION 5: LONGEVITY RISK ====================

def calculate_longevity_risk(
    current_portfolio: float,
    current_age: int,
    retirement_age: int,
    life_expectancy: int,
    annual_contributions: float,
    retirement_spending: float,
    expected_return: float = 0.07,
    inflation_rate: float = 0.025,
    stress_years: int = 5
) -> Dict[str, Any]:
    """
    SECTION 5: Longevity Risk Assessment
    
    StressLongevity = LifeExpectancy + 5 years
    Run deterministic model with StressLongevity.
    """
    # Base case
    base_result = run_deterministic_model(
        current_portfolio, current_age, retirement_age, life_expectancy,
        annual_contributions, retirement_spending, expected_return, inflation_rate
    )
    
    # Stress case (live 5 years longer)
    stress_life_expectancy = life_expectancy + stress_years
    stress_result = run_deterministic_model(
        current_portfolio, current_age, retirement_age, stress_life_expectancy,
        annual_contributions, retirement_spending, expected_return, inflation_rate
    )
    
    # Longevity risk score: 1 if depletes before stress life expectancy, else 0
    longevity_risk_score = 1.0 if stress_result["depletes_early"] else 0.0
    
    # Partial score based on remaining portfolio ratio
    if not stress_result["depletes_early"] and base_result["final_portfolio"] > 0:
        portfolio_ratio = stress_result["final_portfolio"] / base_result["final_portfolio"]
        longevity_risk_score = max(0, 1 - portfolio_ratio)
    
    return {
        "base_life_expectancy": life_expectancy,
        "stress_life_expectancy": stress_life_expectancy,
        "base_final_portfolio": base_result["final_portfolio"],
        "stress_final_portfolio": stress_result["final_portfolio"],
        "base_depletes": base_result["depletes_early"],
        "stress_depletes": stress_result["depletes_early"],
        "longevity_risk_score": round(longevity_risk_score, 4)
    }


# ==================== SECTION 6: INCOME STABILITY SCORE ====================

def calculate_income_stability(income_sources: List[IncomeSource]) -> Dict[str, Any]:
    """
    SECTION 6: Income Stability Score
    
    Stable income (pension, annuity) = 1.0
    Semi-stable (salary) = 0.7
    Variable (business, dividends) = 0.4
    """
    if not income_sources:
        return {"income_stability_score": 0.5, "income_breakdown": {}}
    
    total_income = sum(s.annual_amount for s in income_sources)
    if total_income == 0:
        return {"income_stability_score": 0.5, "income_breakdown": {}}
    
    weighted_stability = 0
    breakdown = {}
    
    for source in income_sources:
        weight = source.annual_amount / total_income
        stability = INCOME_STABILITY_WEIGHTS.get(source.source_type, 0.5)
        weighted_stability += weight * stability
        
        breakdown[source.source_type] = {
            "amount": source.annual_amount,
            "weight": round(weight, 4),
            "stability": stability
        }
    
    return {
        "income_stability_score": round(weighted_stability, 4),
        "income_breakdown": breakdown,
        "total_income": total_income
    }


# ==================== SECTION 7: SPENDING FLEXIBILITY SCORE ====================

def calculate_spending_flexibility(expense_breakdown: Optional[ExpenseBreakdown]) -> Dict[str, Any]:
    """
    SECTION 7: Spending Flexibility Score
    
    EssentialSpendingRatio = essential_expenses / total_expenses
    SpendingFlexibilityScore = 1 - EssentialSpendingRatio
    """
    if not expense_breakdown:
        # Default assumption: 60% essential, 40% discretionary
        return {
            "spending_flexibility_score": 0.40,
            "essential_ratio": 0.60,
            "discretionary_ratio": 0.40,
            "using_default": True
        }
    
    total = expense_breakdown.essential + expense_breakdown.discretionary
    if total == 0:
        return {"spending_flexibility_score": 0.5, "essential_ratio": 0.5, "discretionary_ratio": 0.5}
    
    essential_ratio = expense_breakdown.essential / total
    flexibility_score = 1 - essential_ratio
    
    return {
        "spending_flexibility_score": round(flexibility_score, 4),
        "essential_ratio": round(essential_ratio, 4),
        "discretionary_ratio": round(1 - essential_ratio, 4),
        "essential_amount": expense_breakdown.essential,
        "discretionary_amount": expense_breakdown.discretionary,
        "using_default": False
    }


# ==================== SECTION 8: DIVERSIFICATION SCORE ====================

def calculate_diversification(asset_holdings: Optional[List[AssetHolding]]) -> Dict[str, Any]:
    """
    SECTION 8: Diversification Score
    
    MaxAssetWeight = largest asset %
    DiversificationScore = 1 - MaxAssetWeight
    """
    if not asset_holdings:
        # Default: assume diversified
        return {
            "diversification_score": 0.70,
            "max_asset_weight": 0.30,
            "asset_allocation": {},
            "using_default": True
        }
    
    total_value = sum(h.value for h in asset_holdings)
    if total_value == 0:
        return {"diversification_score": 0.5, "max_asset_weight": 0.5, "asset_allocation": {}}
    
    # Calculate allocation by asset class
    allocation = {}
    for holding in asset_holdings:
        asset_class = holding.asset_class
        if asset_class not in allocation:
            allocation[asset_class] = 0
        allocation[asset_class] += holding.value
    
    # Convert to percentages
    allocation_pct = {k: round(v / total_value, 4) for k, v in allocation.items()}
    
    # Max concentration
    max_weight = max(allocation_pct.values()) if allocation_pct else 0.5
    diversification_score = 1 - max_weight
    
    return {
        "diversification_score": round(diversification_score, 4),
        "max_asset_weight": round(max_weight, 4),
        "max_asset_class": max(allocation_pct, key=allocation_pct.get) if allocation_pct else None,
        "asset_allocation": allocation_pct,
        "total_portfolio_value": total_value,
        "using_default": False
    }


# ==================== SECTION 9: CONFIDENCE SCORE ====================

def calculate_confidence_score(
    monte_carlo_success_rate: float,
    downside_risk_score: float,
    income_stability_score: float,
    spending_flexibility_score: float,
    diversification_score: float,
    longevity_risk_score: float
) -> Dict[str, Any]:
    """
    SECTION 9: Multi-Factor Confidence Score
    
    ConfidenceScore =
      (0.35 * MonteCarloSuccessRate)
    + (0.20 * (1 - DownsideRiskScore))
    + (0.15 * IncomeStabilityScore)
    + (0.10 * SpendingFlexibilityScore)
    + (0.10 * DiversificationScore)
    + (0.10 * (1 - LongevityRiskScore))
    
    Scale to 0-100.
    """
    # Normalize inputs to 0-1
    mc_factor = max(0, min(1, monte_carlo_success_rate))
    downside_factor = max(0, min(1, 1 - downside_risk_score))
    income_factor = max(0, min(1, income_stability_score))
    spending_factor = max(0, min(1, spending_flexibility_score))
    diversification_factor = max(0, min(1, diversification_score))
    longevity_factor = max(0, min(1, 1 - longevity_risk_score))
    
    # Weighted calculation
    confidence = (
        CONFIDENCE_WEIGHTS["monte_carlo"] * mc_factor +
        CONFIDENCE_WEIGHTS["downside_risk"] * downside_factor +
        CONFIDENCE_WEIGHTS["income_stability"] * income_factor +
        CONFIDENCE_WEIGHTS["spending_flexibility"] * spending_factor +
        CONFIDENCE_WEIGHTS["diversification"] * diversification_factor +
        CONFIDENCE_WEIGHTS["longevity_risk"] * longevity_factor
    )
    
    # Scale to 0-100
    confidence_score = confidence * 100
    
    # Contribution breakdown
    contributions = {
        "monte_carlo": round(CONFIDENCE_WEIGHTS["monte_carlo"] * mc_factor * 100, 2),
        "downside_protection": round(CONFIDENCE_WEIGHTS["downside_risk"] * downside_factor * 100, 2),
        "income_stability": round(CONFIDENCE_WEIGHTS["income_stability"] * income_factor * 100, 2),
        "spending_flexibility": round(CONFIDENCE_WEIGHTS["spending_flexibility"] * spending_factor * 100, 2),
        "diversification": round(CONFIDENCE_WEIGHTS["diversification"] * diversification_factor * 100, 2),
        "longevity_protection": round(CONFIDENCE_WEIGHTS["longevity_risk"] * longevity_factor * 100, 2)
    }
    
    return {
        "confidence_score": round(confidence_score, 1),
        "confidence_rating": get_confidence_rating(confidence_score),
        "factor_contributions": contributions,
        "weights_used": CONFIDENCE_WEIGHTS,
        "raw_factors": {
            "monte_carlo_success": round(mc_factor, 4),
            "downside_protection": round(downside_factor, 4),
            "income_stability": round(income_factor, 4),
            "spending_flexibility": round(spending_factor, 4),
            "diversification": round(diversification_factor, 4),
            "longevity_protection": round(longevity_factor, 4)
        }
    }


def get_confidence_rating(score: float) -> str:
    if score >= 90:
        return "Excellent"
    elif score >= 80:
        return "Very Good"
    elif score >= 70:
        return "Good"
    elif score >= 60:
        return "Fair"
    elif score >= 50:
        return "Moderate"
    elif score >= 40:
        return "Concerning"
    else:
        return "Critical"


# ==================== SECTION 10: STRESS TESTING ====================

def run_stress_tests(
    current_portfolio: float,
    current_age: int,
    retirement_age: int,
    life_expectancy: int,
    annual_contributions: float,
    retirement_spending: float,
    expected_return: float = 0.07,
    return_volatility: float = 0.15,
    inflation_rate: float = 0.025,
    num_simulations: int = 5000
) -> Dict[str, Any]:
    """
    SECTION 10: Stress Testing
    
    1. Market crash: Immediate -30% portfolio drop
    2. High inflation: Inflation = 6% sustained
    3. Longevity stress: +5 years
    """
    # Base case
    base_mc = run_monte_carlo_simulation(
        current_portfolio, current_age, retirement_age, life_expectancy,
        annual_contributions, retirement_spending, expected_return,
        return_volatility, inflation_rate, 0.01, 0.03, 0.005, num_simulations
    )
    
    # Stress 1: Market Crash (-30%)
    crash_portfolio = current_portfolio * 0.70
    crash_mc = run_monte_carlo_simulation(
        crash_portfolio, current_age, retirement_age, life_expectancy,
        annual_contributions, retirement_spending, expected_return,
        return_volatility, inflation_rate, 0.01, 0.03, 0.005, num_simulations
    )
    
    # Stress 2: High Inflation (6%)
    high_inflation_mc = run_monte_carlo_simulation(
        current_portfolio, current_age, retirement_age, life_expectancy,
        annual_contributions, retirement_spending, expected_return,
        return_volatility, 0.06, 0.02, 0.03, 0.005, num_simulations
    )
    
    # Stress 3: Longevity (+5 years)
    longevity_mc = run_monte_carlo_simulation(
        current_portfolio, current_age, retirement_age, life_expectancy + 5,
        annual_contributions, retirement_spending, expected_return,
        return_volatility, inflation_rate, 0.01, 0.03, 0.005, num_simulations
    )
    
    return {
        "base_case": {
            "success_rate": base_mc["success_rate_percent"],
            "median_outcome": base_mc["percentiles"]["p50_median"],
            "p10_outcome": base_mc["percentiles"]["p10"]
        },
        "market_crash_30pct": {
            "success_rate": crash_mc["success_rate_percent"],
            "median_outcome": crash_mc["percentiles"]["p50_median"],
            "p10_outcome": crash_mc["percentiles"]["p10"],
            "impact": round(crash_mc["success_rate_percent"] - base_mc["success_rate_percent"], 1)
        },
        "high_inflation_6pct": {
            "success_rate": high_inflation_mc["success_rate_percent"],
            "median_outcome": high_inflation_mc["percentiles"]["p50_median"],
            "p10_outcome": high_inflation_mc["percentiles"]["p10"],
            "impact": round(high_inflation_mc["success_rate_percent"] - base_mc["success_rate_percent"], 1)
        },
        "longevity_plus_5yrs": {
            "success_rate": longevity_mc["success_rate_percent"],
            "median_outcome": longevity_mc["percentiles"]["p50_median"],
            "p10_outcome": longevity_mc["percentiles"]["p10"],
            "impact": round(longevity_mc["success_rate_percent"] - base_mc["success_rate_percent"], 1)
        },
        "most_severe_stress": min(
            crash_mc["success_rate_percent"],
            high_inflation_mc["success_rate_percent"],
            longevity_mc["success_rate_percent"]
        )
    }


# ==================== SECTION 11: AI EXPLANATION ENGINE ====================

def generate_ai_explanation(
    confidence_result: Dict[str, Any],
    monte_carlo_result: Dict[str, Any],
    longevity_result: Dict[str, Any],
    spending_flexibility: Dict[str, Any],
    diversification: Dict[str, Any],
    request: HybridEngineRequest
) -> Dict[str, Any]:
    """
    SECTION 11: AI Explanation Engine
    
    Identify top negative contributors and generate actionable recommendations.
    """
    risks = []
    recommendations = []
    
    confidence_score = confidence_result["confidence_score"]
    factors = confidence_result["raw_factors"]
    
    # Analyze each factor
    if factors["monte_carlo_success"] < 0.75:
        risks.append({
            "factor": "Probability of Success",
            "severity": "high" if factors["monte_carlo_success"] < 0.5 else "medium",
            "explanation": f"Only {monte_carlo_result['success_rate_percent']}% of simulations succeed"
        })
        
        # Calculate improvement suggestions
        years_to_delay = 0
        for years in [1, 2, 3, 5]:
            test_retirement = request.retirement_age + years
            if test_retirement < request.life_expectancy:
                years_to_delay = years
                break
        
        recommendations.append({
            "action": f"Delay retirement by {years_to_delay} years",
            "impact": f"+{min(15, years_to_delay * 5)}% confidence",
            "priority": "high"
        })
    
    if factors["downside_protection"] < 0.6:
        risks.append({
            "factor": "Downside Risk",
            "severity": "high",
            "explanation": "High exposure to worst-case outcomes (10th percentile)"
        })
        recommendations.append({
            "action": "Increase allocation to defensive assets",
            "impact": "Reduce tail risk exposure",
            "priority": "medium"
        })
    
    if factors["longevity_protection"] < 0.7:
        risks.append({
            "factor": "Longevity Risk",
            "severity": "medium",
            "explanation": "Portfolio may not last if you live 5+ years beyond expectation"
        })
        recommendations.append({
            "action": "Consider longevity insurance or annuity",
            "impact": "Protect against outliving assets",
            "priority": "medium"
        })
    
    if spending_flexibility["spending_flexibility_score"] < 0.3:
        risks.append({
            "factor": "Spending Rigidity",
            "severity": "medium",
            "explanation": f"{round(spending_flexibility.get('essential_ratio', 0.7) * 100)}% of spending is essential/fixed"
        })
        
        reduction_pct = round((1 - spending_flexibility["spending_flexibility_score"]) * 15)
        recommendations.append({
            "action": f"Reduce discretionary spending by {reduction_pct}%",
            "impact": f"+{round(reduction_pct * 0.5)}% confidence",
            "priority": "medium"
        })
    
    if diversification["diversification_score"] < 0.5:
        max_class = diversification.get("max_asset_class", "unknown")
        risks.append({
            "factor": "Concentration Risk",
            "severity": "medium",
            "explanation": f"Portfolio concentrated in {max_class} ({round(diversification.get('max_asset_weight', 0.5) * 100)}%)"
        })
        recommendations.append({
            "action": "Diversify across more asset classes",
            "impact": "Reduce single-asset risk",
            "priority": "low"
        })
    
    # Sort by priority
    priority_order = {"high": 0, "medium": 1, "low": 2}
    recommendations.sort(key=lambda x: priority_order.get(x["priority"], 2))
    
    # Generate summary
    if confidence_score >= 80:
        summary = "You are well-positioned for retirement. Minor optimizations possible."
    elif confidence_score >= 60:
        summary = "Your retirement plan is reasonable but has some vulnerabilities."
    elif confidence_score >= 40:
        summary = "Your retirement plan needs significant adjustments to reduce risk."
    else:
        summary = "Your retirement plan is at high risk. Immediate action recommended."
    
    return {
        "summary": summary,
        "confidence_score": confidence_score,
        "confidence_rating": confidence_result["confidence_rating"],
        "identified_risks": risks,
        "recommendations": recommendations[:5],  # Top 5
        "top_improvement": recommendations[0] if recommendations else None
    }


# ==================== SECTION 17: CHANGE IMPACT ENGINE ====================

def calculate_change_impact(
    base_request: HybridEngineRequest,
    modified_request: HybridEngineRequest,
    base_confidence: float
) -> Dict[str, Any]:
    """
    SECTION 17: Change Impact Engine
    
    Show immediate change in confidence and delta vs previous.
    """
    # Identify what changed
    changes = []
    
    if modified_request.retirement_age != base_request.retirement_age:
        changes.append({
            "field": "retirement_age",
            "from": base_request.retirement_age,
            "to": modified_request.retirement_age,
            "description": f"Retirement age: {base_request.retirement_age} → {modified_request.retirement_age}"
        })
    
    if modified_request.retirement_spending != base_request.retirement_spending:
        pct_change = round((modified_request.retirement_spending - base_request.retirement_spending) / base_request.retirement_spending * 100, 1)
        changes.append({
            "field": "retirement_spending",
            "from": base_request.retirement_spending,
            "to": modified_request.retirement_spending,
            "description": f"Annual spending: ${base_request.retirement_spending:,.0f} → ${modified_request.retirement_spending:,.0f} ({pct_change:+}%)"
        })
    
    if modified_request.annual_contributions != base_request.annual_contributions:
        changes.append({
            "field": "annual_contributions",
            "from": base_request.annual_contributions,
            "to": modified_request.annual_contributions,
            "description": f"Annual contributions: ${base_request.annual_contributions:,.0f} → ${modified_request.annual_contributions:,.0f}"
        })
    
    return {
        "changes_detected": changes,
        "base_confidence": base_confidence,
        "requires_recalculation": len(changes) > 0
    }
