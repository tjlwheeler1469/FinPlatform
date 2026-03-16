"""
Scenarios Routes
Scenario simulation, comparison, and what-if analysis.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

# Import scenario simulator service
try:
    from services.scenario_simulator import ScenarioSimulator
    simulator = ScenarioSimulator()
except ImportError:
    simulator = None

# In-memory scenario storage
SAVED_SCENARIOS: Dict[str, Dict] = {}


class ScenarioInput(BaseModel):
    current_age: int = 35
    retirement_age: int = 65
    current_savings: float = 100000
    annual_income: float = 150000
    savings_rate: float = 0.15
    expected_return: float = 0.07
    inflation_rate: float = 0.025
    retirement_income_target: float = 80000
    super_balance: float = 200000
    property_value: float = 0
    debt: float = 0
    risk_profile: str = "balanced"


class ScenarioCompareRequest(BaseModel):
    scenarios: List[ScenarioInput]


class WhatIfRequest(BaseModel):
    base_scenario: ScenarioInput
    changes: Dict[str, Any]


def run_retirement_simulation(params: ScenarioInput, simulations: int = 1000) -> Dict[str, Any]:
    """Run Monte Carlo simulation for retirement planning."""
    np.random.seed(42)
    
    years_to_retirement = params.retirement_age - params.current_age
    years_in_retirement = 30  # Assume 30 years in retirement
    
    # Asset volatility based on risk profile
    volatility_map = {
        "conservative": 0.08,
        "balanced": 0.12,
        "growth": 0.16,
        "aggressive": 0.20
    }
    volatility = volatility_map.get(params.risk_profile, 0.12)
    
    # Run simulations
    results = np.zeros((simulations, years_to_retirement + years_in_retirement + 1))
    
    # Starting wealth
    initial_wealth = params.current_savings + params.super_balance
    results[:, 0] = initial_wealth
    
    # Accumulation phase
    annual_savings = params.annual_income * params.savings_rate
    for year in range(1, years_to_retirement + 1):
        returns = np.random.normal(params.expected_return, volatility, simulations)
        results[:, year] = results[:, year - 1] * (1 + returns) + annual_savings
    
    # Retirement phase
    real_retirement_income = params.retirement_income_target
    for year in range(years_to_retirement + 1, years_to_retirement + years_in_retirement + 1):
        returns = np.random.normal(params.expected_return * 0.7, volatility * 0.7, simulations)  # More conservative in retirement
        inflation_adjusted_withdrawal = real_retirement_income * ((1 + params.inflation_rate) ** (year - years_to_retirement))
        results[:, year] = np.maximum(0, results[:, year - 1] * (1 + returns) - inflation_adjusted_withdrawal)
    
    # Calculate success metrics
    wealth_at_retirement = results[:, years_to_retirement]
    final_wealth = results[:, -1]
    
    # Success = not running out of money in retirement
    success_count = np.sum(final_wealth > 0)
    success_probability = success_count / simulations * 100
    
    # Calculate key milestones
    first_100k_year = None
    first_million_year = None
    for year in range(years_to_retirement + 1):
        median_value = np.median(results[:, year])
        if first_100k_year is None and median_value >= 100000:
            first_100k_year = year
        if first_million_year is None and median_value >= 1000000:
            first_million_year = year
    
    return {
        "success_probability": round(success_probability, 1),
        "wealth_at_retirement": {
            "median": float(np.median(wealth_at_retirement)),
            "p10": float(np.percentile(wealth_at_retirement, 10)),
            "p90": float(np.percentile(wealth_at_retirement, 90))
        },
        "final_wealth": {
            "median": float(np.median(final_wealth)),
            "p10": float(np.percentile(final_wealth, 10)),
            "p90": float(np.percentile(final_wealth, 90))
        },
        "milestones": {
            "first_100k_year": first_100k_year,
            "first_million_year": first_million_year
        },
        "income_replacement_ratio": round(params.retirement_income_target / params.annual_income * 100, 1),
        "years_to_retirement": years_to_retirement,
        "projection_years": list(range(years_to_retirement + years_in_retirement + 1)),
        "projection_median": [float(np.median(results[:, i])) for i in range(years_to_retirement + years_in_retirement + 1)],
        "projection_p10": [float(np.percentile(results[:, i], 10)) for i in range(years_to_retirement + years_in_retirement + 1)],
        "projection_p90": [float(np.percentile(results[:, i], 90)) for i in range(years_to_retirement + years_in_retirement + 1)]
    }


@router.post("/simulate")
async def simulate_scenario(request: ScenarioInput):
    """Run retirement simulation for a scenario."""
    try:
        results = run_retirement_simulation(request)
        return {
            "input": request.dict(),
            "results": results,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def compare_scenarios(request: ScenarioCompareRequest):
    """Compare multiple scenarios side by side."""
    comparisons = []
    
    for i, scenario in enumerate(request.scenarios):
        try:
            results = run_retirement_simulation(scenario)
            comparisons.append({
                "scenario_index": i,
                "input": scenario.dict(),
                "results": results
            })
        except Exception as e:
            logger.error(f"Error simulating scenario {i}: {e}")
            comparisons.append({
                "scenario_index": i,
                "error": str(e)
            })
    
    return {
        "comparisons": comparisons,
        "best_success_probability": max(c["results"]["success_probability"] for c in comparisons if "results" in c) if comparisons else 0,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/what-if")
async def what_if_analysis(request: WhatIfRequest):
    """Calculate impact of changes to a scenario."""
    # Run base scenario
    base_results = run_retirement_simulation(request.base_scenario)
    
    # Apply changes and run modified scenario
    modified_params = request.base_scenario.dict()
    modified_params.update(request.changes)
    modified_scenario = ScenarioInput(**modified_params)
    modified_results = run_retirement_simulation(modified_scenario)
    
    # Calculate impact
    success_change = modified_results["success_probability"] - base_results["success_probability"]
    wealth_change = modified_results["wealth_at_retirement"]["median"] - base_results["wealth_at_retirement"]["median"]
    
    return {
        "base_scenario": {
            "input": request.base_scenario.dict(),
            "results": base_results
        },
        "modified_scenario": {
            "input": modified_scenario.dict(),
            "results": modified_results
        },
        "impact": {
            "success_probability_change": round(success_change, 1),
            "wealth_at_retirement_change": round(wealth_change, 0),
            "recommendation": "Positive impact" if success_change > 0 else "Consider alternative strategies"
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/presets")
async def get_scenario_presets():
    """Get preset scenario templates."""
    return {
        "presets": [
            {
                "name": "Early Retirement",
                "description": "Retire at 55 with aggressive savings",
                "params": {
                    "retirement_age": 55,
                    "savings_rate": 0.30,
                    "risk_profile": "growth"
                }
            },
            {
                "name": "Standard Retirement",
                "description": "Traditional retirement at 65",
                "params": {
                    "retirement_age": 65,
                    "savings_rate": 0.15,
                    "risk_profile": "balanced"
                }
            },
            {
                "name": "Conservative Approach",
                "description": "Lower risk, steady growth",
                "params": {
                    "retirement_age": 67,
                    "savings_rate": 0.20,
                    "risk_profile": "conservative",
                    "expected_return": 0.05
                }
            },
            {
                "name": "Wealth Builder",
                "description": "Maximize wealth accumulation",
                "params": {
                    "retirement_age": 60,
                    "savings_rate": 0.40,
                    "risk_profile": "aggressive"
                }
            }
        ]
    }


@router.post("/save")
async def save_scenario(name: str, scenario: ScenarioInput, user_id: str = "default"):
    """Save a scenario for later."""
    scenario_id = f"scen_{uuid.uuid4().hex[:8]}"
    
    saved = {
        "id": scenario_id,
        "name": name,
        "user_id": user_id,
        "scenario": scenario.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    SAVED_SCENARIOS[scenario_id] = saved
    return saved


@router.get("/saved")
async def get_saved_scenarios(user_id: str = "default"):
    """Get saved scenarios for a user."""
    user_scenarios = [s for s in SAVED_SCENARIOS.values() if s.get("user_id") == user_id]
    return {"scenarios": user_scenarios}


@router.delete("/saved/{scenario_id}")
async def delete_saved_scenario(scenario_id: str):
    """Delete a saved scenario."""
    if scenario_id not in SAVED_SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    del SAVED_SCENARIOS[scenario_id]
    return {"success": True}
