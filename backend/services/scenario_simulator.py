"""
Enhanced Scenario Simulator Engine
Interactive financial scenario modeling with real-time calculations.
"""
import math
from typing import Dict, Any, List, Optional
from datetime import datetime
import numpy as np


def run_scenario_simulation(
    current_age: int,
    retirement_age: int,
    life_expectancy: int = 90,
    current_savings: float = 0,
    annual_income: float = 100000,
    annual_expenses: float = 80000,
    savings_rate: float = 0.15,
    current_super: float = 0,
    employer_super_rate: float = 0.115,
    investment_return: float = 0.07,
    inflation_rate: float = 0.025,
    property_value: float = 0,
    property_growth: float = 0.04,
    debt_balance: float = 0,
    debt_interest_rate: float = 0.06,
    debt_repayment_monthly: float = 0,
    risk_profile: str = "moderate"
) -> Dict[str, Any]:
    """
    Run comprehensive scenario simulation with Monte Carlo analysis.
    """
    
    years_to_retirement = retirement_age - current_age
    retirement_years = life_expectancy - retirement_age
    
    # Risk-adjusted returns
    risk_adjustments = {
        "conservative": {"return": 0.05, "volatility": 0.08},
        "moderate": {"return": 0.07, "volatility": 0.12},
        "aggressive": {"return": 0.09, "volatility": 0.18}
    }
    
    risk_params = risk_adjustments.get(risk_profile, risk_adjustments["moderate"])
    adjusted_return = risk_params["return"]
    volatility = risk_params["volatility"]
    
    # Calculate annual savings
    annual_savings = annual_income * savings_rate
    employer_super_contribution = annual_income * employer_super_rate
    
    # Project wealth accumulation phase
    projections = []
    wealth_data = {
        "savings": current_savings,
        "super": current_super,
        "property": property_value,
        "debt": debt_balance,
        "total_investments": current_savings
    }
    
    for year in range(years_to_retirement + 1):
        age = current_age + year
        
        # Apply investment returns
        wealth_data["savings"] *= (1 + adjusted_return)
        wealth_data["super"] *= (1 + adjusted_return)
        wealth_data["property"] *= (1 + property_growth)
        
        # Add contributions
        if year > 0:
            wealth_data["savings"] += annual_savings
            wealth_data["super"] += employer_super_contribution
            
            # Pay down debt
            annual_debt_repayment = debt_repayment_monthly * 12
            interest = wealth_data["debt"] * debt_interest_rate
            principal = max(0, annual_debt_repayment - interest)
            wealth_data["debt"] = max(0, wealth_data["debt"] - principal)
        
        # Calculate net worth
        net_worth = (
            wealth_data["savings"] + 
            wealth_data["super"] + 
            wealth_data["property"] - 
            wealth_data["debt"]
        )
        
        projections.append({
            "age": age,
            "year": year,
            "savings": round(wealth_data["savings"], 0),
            "super": round(wealth_data["super"], 0),
            "property": round(wealth_data["property"], 0),
            "debt": round(wealth_data["debt"], 0),
            "net_worth": round(net_worth, 0),
            "phase": "accumulation"
        })
    
    # Calculate retirement income
    retirement_wealth = projections[-1]["savings"] + projections[-1]["super"]
    
    # 4% safe withdrawal rate
    safe_withdrawal_rate = 0.04
    annual_retirement_income = retirement_wealth * safe_withdrawal_rate
    
    # Add age pension estimate (simplified)
    age_pension_annual = 28000 if retirement_wealth < 500000 else 14000 if retirement_wealth < 1000000 else 0
    total_retirement_income = annual_retirement_income + age_pension_annual
    
    # Calculate real (inflation-adjusted) values
    inflation_factor = (1 + inflation_rate) ** years_to_retirement
    real_retirement_income = total_retirement_income / inflation_factor
    real_retirement_wealth = retirement_wealth / inflation_factor
    
    # Run Monte Carlo simulation for success probability
    success_probability = run_monte_carlo(
        initial_wealth=retirement_wealth,
        annual_withdrawal=annual_expenses * inflation_factor,
        years=retirement_years,
        expected_return=adjusted_return,
        volatility=volatility,
        inflation=inflation_rate
    )
    
    # Project retirement phase (decumulation)
    retirement_projections = []
    remaining_wealth = retirement_wealth
    
    for year in range(retirement_years + 1):
        age = retirement_age + year
        
        if year > 0:
            # Investment returns
            remaining_wealth *= (1 + adjusted_return)
            # Withdrawals (inflation-adjusted)
            withdrawal = annual_expenses * ((1 + inflation_rate) ** (years_to_retirement + year))
            remaining_wealth -= withdrawal
            remaining_wealth = max(0, remaining_wealth)
        
        retirement_projections.append({
            "age": age,
            "year": years_to_retirement + year,
            "wealth": round(remaining_wealth, 0),
            "phase": "retirement"
        })
    
    # Combine projections
    all_projections = projections + retirement_projections[1:]
    
    # Calculate key milestones
    milestones = calculate_milestones(projections, retirement_wealth, current_age)
    
    return {
        "scenario_id": f"scenario_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "inputs": {
            "current_age": current_age,
            "retirement_age": retirement_age,
            "life_expectancy": life_expectancy,
            "annual_income": annual_income,
            "annual_expenses": annual_expenses,
            "savings_rate": savings_rate,
            "investment_return": adjusted_return,
            "risk_profile": risk_profile
        },
        "results": {
            "success_probability": round(success_probability, 1),
            "retirement_wealth": round(retirement_wealth, 0),
            "retirement_wealth_real": round(real_retirement_wealth, 0),
            "annual_retirement_income": round(total_retirement_income, 0),
            "annual_retirement_income_real": round(real_retirement_income, 0),
            "monthly_retirement_income": round(total_retirement_income / 12, 0),
            "years_to_retirement": years_to_retirement,
            "retirement_duration": retirement_years,
            "wealth_at_life_expectancy": round(retirement_projections[-1]["wealth"], 0),
            "income_replacement_ratio": round((total_retirement_income / annual_income) * 100, 1)
        },
        "milestones": milestones,
        "projections": all_projections,
        "analysis": {
            "status": "on_track" if success_probability >= 80 else "needs_attention" if success_probability >= 60 else "at_risk",
            "confidence": "high" if success_probability >= 85 else "medium" if success_probability >= 70 else "low"
        }
    }


def run_monte_carlo(
    initial_wealth: float,
    annual_withdrawal: float,
    years: int,
    expected_return: float,
    volatility: float,
    inflation: float,
    simulations: int = 1000
) -> float:
    """
    Run Monte Carlo simulation to calculate retirement success probability.
    """
    successes = 0
    
    for _ in range(simulations):
        wealth = initial_wealth
        withdrawal = annual_withdrawal
        
        for year in range(years):
            # Random return based on volatility
            random_return = np.random.normal(expected_return, volatility)
            wealth = wealth * (1 + random_return) - withdrawal
            withdrawal *= (1 + inflation)  # Inflation-adjust withdrawal
            
            if wealth <= 0:
                break
        
        if wealth > 0:
            successes += 1
    
    return (successes / simulations) * 100


def calculate_milestones(projections: List[Dict], retirement_wealth: float, current_age: int) -> List[Dict]:
    """
    Calculate key financial milestones.
    """
    milestones = []
    
    # First $100k
    for proj in projections:
        if proj["net_worth"] >= 100000:
            milestones.append({
                "name": "First $100k",
                "age": proj["age"],
                "years_from_now": proj["age"] - current_age,
                "achieved": proj["age"] <= current_age
            })
            break
    
    # $500k milestone
    for proj in projections:
        if proj["net_worth"] >= 500000:
            milestones.append({
                "name": "$500k Net Worth",
                "age": proj["age"],
                "years_from_now": proj["age"] - current_age,
                "achieved": proj["age"] <= current_age
            })
            break
    
    # $1M milestone
    for proj in projections:
        if proj["net_worth"] >= 1000000:
            milestones.append({
                "name": "Millionaire",
                "age": proj["age"],
                "years_from_now": proj["age"] - current_age,
                "achieved": proj["age"] <= current_age
            })
            break
    
    # $2M milestone
    for proj in projections:
        if proj["net_worth"] >= 2000000:
            milestones.append({
                "name": "$2M Net Worth",
                "age": proj["age"],
                "years_from_now": proj["age"] - current_age,
                "achieved": proj["age"] <= current_age
            })
            break
    
    # Debt-free milestone
    for proj in projections:
        if proj["debt"] == 0 and projections[0]["debt"] > 0:
            milestones.append({
                "name": "Debt Free",
                "age": proj["age"],
                "years_from_now": proj["age"] - current_age,
                "achieved": proj["age"] <= current_age
            })
            break
    
    return milestones


def compare_scenarios(scenarios: List[Dict]) -> Dict[str, Any]:
    """
    Compare multiple scenarios side by side.
    """
    if not scenarios:
        return {"error": "No scenarios to compare"}
    
    comparison = {
        "scenarios": [],
        "best_scenario": None,
        "worst_scenario": None,
        "summary": {}
    }
    
    for i, scenario in enumerate(scenarios):
        results = scenario.get("results", {})
        comparison["scenarios"].append({
            "scenario_id": scenario.get("scenario_id", f"scenario_{i+1}"),
            "name": scenario.get("name", f"Scenario {i+1}"),
            "success_probability": results.get("success_probability", 0),
            "retirement_wealth": results.get("retirement_wealth", 0),
            "annual_retirement_income": results.get("annual_retirement_income", 0)
        })
    
    # Find best and worst
    sorted_scenarios = sorted(
        comparison["scenarios"], 
        key=lambda x: x["success_probability"],
        reverse=True
    )
    
    comparison["best_scenario"] = sorted_scenarios[0]
    comparison["worst_scenario"] = sorted_scenarios[-1]
    
    # Calculate differences
    if len(scenarios) >= 2:
        best = comparison["best_scenario"]
        worst = comparison["worst_scenario"]
        comparison["summary"] = {
            "probability_difference": best["success_probability"] - worst["success_probability"],
            "wealth_difference": best["retirement_wealth"] - worst["retirement_wealth"],
            "income_difference": best["annual_retirement_income"] - worst["annual_retirement_income"]
        }
    
    return comparison


def calculate_what_if(
    base_scenario: Dict,
    changes: Dict
) -> Dict[str, Any]:
    """
    Calculate the impact of specific changes to a base scenario.
    """
    # Extract base inputs
    base_inputs = base_scenario.get("inputs", {})
    
    # Apply changes
    new_inputs = {**base_inputs, **changes}
    
    # Run new simulation
    new_scenario = run_scenario_simulation(**new_inputs)
    
    # Calculate impact
    base_results = base_scenario.get("results", {})
    new_results = new_scenario.get("results", {})
    
    impact = {
        "success_probability_change": new_results.get("success_probability", 0) - base_results.get("success_probability", 0),
        "retirement_wealth_change": new_results.get("retirement_wealth", 0) - base_results.get("retirement_wealth", 0),
        "income_change": new_results.get("annual_retirement_income", 0) - base_results.get("annual_retirement_income", 0),
        "changes_applied": changes
    }
    
    return {
        "base_scenario": base_scenario,
        "new_scenario": new_scenario,
        "impact": impact,
        "recommendation": generate_impact_recommendation(impact)
    }


def generate_impact_recommendation(impact: Dict) -> str:
    """
    Generate a recommendation based on the scenario impact.
    """
    prob_change = impact.get("success_probability_change", 0)
    _wealth_change = impact.get("retirement_wealth_change", 0)  # reserved for tooltip
    
    if prob_change > 10:
        return f"This change significantly improves your retirement outlook (+{prob_change:.1f}% success probability)"
    elif prob_change > 5:
        return f"This change moderately improves your retirement outlook (+{prob_change:.1f}% success probability)"
    elif prob_change > 0:
        return f"This change slightly improves your retirement outlook (+{prob_change:.1f}% success probability)"
    elif prob_change < -10:
        return f"Warning: This change significantly reduces your retirement success probability ({prob_change:.1f}%)"
    elif prob_change < -5:
        return f"Caution: This change moderately reduces your retirement success probability ({prob_change:.1f}%)"
    elif prob_change < 0:
        return f"Note: This change slightly reduces your retirement success probability ({prob_change:.1f}%)"
    else:
        return "This change has minimal impact on your retirement outlook"


# Preset scenarios for quick analysis
PRESET_SCENARIOS = {
    "retire_early": {
        "name": "Early Retirement (Age 55)",
        "description": "Retire 5 years earlier than planned",
        "changes": {"retirement_age": 55}
    },
    "retire_late": {
        "name": "Delayed Retirement (Age 67)",
        "description": "Work 2 additional years",
        "changes": {"retirement_age": 67}
    },
    "increase_savings": {
        "name": "Boost Savings (+5%)",
        "description": "Increase savings rate by 5 percentage points",
        "changes": {"savings_rate_delta": 0.05}
    },
    "conservative_returns": {
        "name": "Conservative Market",
        "description": "Lower expected investment returns",
        "changes": {"risk_profile": "conservative"}
    },
    "aggressive_growth": {
        "name": "Aggressive Growth",
        "description": "Higher risk, higher potential returns",
        "changes": {"risk_profile": "aggressive"}
    },
    "pay_off_debt": {
        "name": "Accelerate Debt Payoff",
        "description": "Double debt repayments",
        "changes": {"debt_repayment_multiplier": 2}
    },
    "market_crash": {
        "name": "Market Crash Scenario",
        "description": "Simulate a 30% market decline",
        "changes": {"initial_wealth_reduction": 0.3}
    }
}


def get_preset_scenarios() -> Dict[str, Any]:
    """Get available preset scenarios."""
    return {
        "presets": PRESET_SCENARIOS,
        "count": len(PRESET_SCENARIOS)
    }
