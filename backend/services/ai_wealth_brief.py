"""
AI Wealth Brief Service
Generates personalized AI-powered financial insights and recommendations.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np


def calculate_optimal_retirement_age(
    current_age: int,
    net_worth: float,
    annual_savings: float,
    target_retirement_wealth: float,
    expected_return: float = 0.07
) -> int:
    """Calculate the optimal retirement age based on current trajectory."""
    for test_age in range(current_age + 1, 75):
        years = test_age - current_age
        projected = net_worth * (1 + expected_return) ** years + \
                   annual_savings * ((1 + expected_return) ** years - 1) / expected_return
        if projected >= target_retirement_wealth:
            return test_age
    return 70  # Default max


def generate_wealth_brief(
    age: int,
    retirement_age: int,
    net_worth: float,
    annual_income: float,
    annual_expenses: float,
    total_assets: float,
    total_debt: float,
    super_balance: float,
    investment_portfolio: float,
    savings_rate: float,
    mortgage_balance: float = 0,
    mortgage_rate: float = 6.5,
    monte_carlo_probability: float = 50.0
) -> Dict[str, Any]:
    """
    Generate personalized AI Wealth Brief with actionable insights.
    This is the core "AI Wealth Strategist" feature.
    """
    
    # Calculate key metrics
    years_to_retirement = retirement_age - age
    annual_savings = annual_income * savings_rate
    monthly_savings = annual_savings / 12
    monthly_income = annual_income / 12
    monthly_expenses = annual_expenses / 12
    
    # Calculate retirement target (25x annual expenses - 4% rule)
    retirement_target = annual_expenses * 25
    
    # Calculate optimal retirement age
    optimal_retirement_age = calculate_optimal_retirement_age(
        age, net_worth, annual_savings, retirement_target
    )
    
    # Generate headline insight
    if monte_carlo_probability >= 85:
        headline = f"You're on track to retire comfortably at {retirement_age}"
        headline_sentiment = "positive"
    elif monte_carlo_probability >= 70:
        headline = f"You can retire at {optimal_retirement_age} with minor adjustments"
        headline_sentiment = "neutral"
    else:
        headline = f"Action needed: Consider retiring at {optimal_retirement_age} instead of {retirement_age}"
        headline_sentiment = "warning"
    
    # Generate smart recommendations with specific $ impact
    recommendations = []
    total_impact = 0
    
    # 1. Savings Rate Optimization
    if savings_rate < 0.20:
        target_savings_rate = min(0.25, savings_rate + 0.05)
        additional_monthly = monthly_income * (target_savings_rate - savings_rate)
        additional_annual = additional_monthly * 12
        future_value = additional_annual * ((1.07 ** years_to_retirement - 1) / 0.07) * 1.07
        
        recommendations.append({
            "id": "increase_savings",
            "title": f"Increase savings by ${additional_monthly:,.0f}/month",
            "description": f"Boost savings rate from {savings_rate*100:.0f}% to {target_savings_rate*100:.0f}%",
            "impact": future_value,
            "impact_text": f"+{future_value/1000000:.1f}M to retirement wealth",
            "difficulty": "medium",
            "category": "savings",
            "years_earlier": max(0, round(future_value / (annual_expenses * 2)))
        })
        total_impact += future_value
    
    # 2. Super Contribution Optimization
    current_concessional = annual_income * 0.115  # Default SG rate
    concessional_cap = 30000
    additional_super = concessional_cap - current_concessional
    
    if additional_super > 5000:
        # Tax savings from concessional contributions
        marginal_rate = 0.37 if annual_income > 135000 else (0.325 if annual_income > 45000 else 0.19)
        tax_savings = additional_super * (marginal_rate - 0.15)
        
        # Future value of additional super
        super_future_value = additional_super * ((1.07 ** years_to_retirement - 1) / 0.07) * 1.07
        
        recommendations.append({
            "id": "max_super",
            "title": f"Salary sacrifice ${additional_super/12:,.0f}/month to super",
            "description": f"Maximize concessional contributions to ${concessional_cap:,}/year cap",
            "impact": super_future_value,
            "impact_text": f"+{super_future_value/1000000:.1f}M retirement + ${tax_savings:,.0f}/yr tax savings",
            "difficulty": "easy",
            "category": "super",
            "tax_savings": tax_savings
        })
        total_impact += super_future_value
    
    # 3. Mortgage Refinancing
    if mortgage_balance > 100000 and mortgage_rate > 5.5:
        potential_rate = 5.89
        rate_reduction = mortgage_rate - potential_rate
        if rate_reduction > 0.3:
            annual_savings_mortgage = mortgage_balance * (rate_reduction / 100)
            lifetime_savings = annual_savings_mortgage * min(25, years_to_retirement)
            
            recommendations.append({
                "id": "refinance",
                "title": "Refinance mortgage to lower rate",
                "description": f"Switch from {mortgage_rate:.1f}% to ~{potential_rate}% (save {rate_reduction:.1f}%)",
                "impact": lifetime_savings,
                "impact_text": f"${lifetime_savings/1000:,.0f}K interest saved over loan life",
                "difficulty": "medium",
                "category": "debt",
                "annual_savings": annual_savings_mortgage
            })
            total_impact += lifetime_savings
    
    # 4. Investment Allocation Optimization
    if investment_portfolio > 50000:
        # Suggest growth tilt for younger investors
        if age < 50:
            _potential_extra_return = 0.01  # 1% extra from growth tilt — used inline below
            extra_wealth = investment_portfolio * ((1 + 0.08) ** years_to_retirement - (1 + 0.07) ** years_to_retirement)
            
            recommendations.append({
                "id": "growth_tilt",
                "title": "Increase growth asset allocation",
                "description": "Shift 10% from bonds/cash to growth assets (shares, property)",
                "impact": extra_wealth,
                "impact_text": f"+{extra_wealth/1000000:.1f}M from higher long-term returns",
                "difficulty": "easy",
                "category": "investments"
            })
            total_impact += extra_wealth
    
    # 5. Emergency Fund
    emergency_months = 75000 / monthly_expenses  # Assume $75k emergency fund
    if emergency_months < 6:
        gap = (6 * monthly_expenses) - 75000
        if gap > 10000:
            recommendations.append({
                "id": "emergency_fund",
                "title": f"Build emergency fund by ${gap/12:,.0f}/month",
                "description": f"Increase from {emergency_months:.1f} to 6 months of expenses",
                "impact": gap,
                "impact_text": f"${gap:,.0f} security buffer",
                "difficulty": "easy",
                "category": "savings"
            })
    
    # 6. Debt Recycling (Advanced)
    if mortgage_balance > 200000 and investment_portfolio > 100000:
        tax_benefit = mortgage_balance * 0.06 * 0.37  # Interest deduction
        
        recommendations.append({
            "id": "debt_recycling",
            "title": "Implement debt recycling strategy",
            "description": "Convert non-deductible home debt to tax-deductible investment debt",
            "impact": tax_benefit * years_to_retirement,
            "impact_text": f"${tax_benefit:,.0f}/yr tax deduction",
            "difficulty": "complex",
            "category": "tax"
        })
        total_impact += tax_benefit * years_to_retirement
    
    # Sort by impact and take top 3
    recommendations.sort(key=lambda x: x['impact'], reverse=True)
    top_recommendations = recommendations[:3]
    
    # Calculate years earlier retirement possible
    if total_impact > 0:
        years_earlier = min(10, round(total_impact / (annual_expenses * 3)))
    else:
        years_earlier = 0
    
    # Generate net worth projections
    projections = []
    current_year = datetime.now().year
    _value = net_worth  # snapshot retained for trace; projections computed per-loop below
    for i in range(0, years_to_retirement + 5, 5):
        if i == 0:
            proj_value = net_worth
        else:
            proj_value = net_worth * (1.07 ** i) + annual_savings * ((1.07 ** i - 1) / 0.07)
        
        projections.append({
            "age": age + i,
            "year": current_year + i,
            "net_worth": round(proj_value),
            "formatted": f"${proj_value/1000000:.1f}M" if proj_value >= 1000000 else f"${proj_value/1000:.0f}K"
        })
    
    # Life decision scenarios
    life_scenarios = [
        {
            "id": "retire_early",
            "name": "Retire 5 years early",
            "description": f"Retire at {retirement_age - 5} instead of {retirement_age}",
            "impact_probability": -15,
            "impact_wealth": -annual_savings * 5 * 1.5,
            "verdict": "Possible with increased savings"
        },
        {
            "id": "buy_house",
            "name": "Buy investment property",
            "description": "Purchase $800K property with $160K deposit",
            "impact_probability": -5,
            "impact_wealth": 200000,  # Potential equity gain
            "verdict": "Consider if cash flow positive"
        },
        {
            "id": "start_business",
            "name": "Start a business",
            "description": "Invest $100K into new venture",
            "impact_probability": -20,
            "impact_wealth": 0,  # High variance
            "verdict": "High risk, maintain emergency fund"
        },
        {
            "id": "market_crash",
            "name": "30% market crash",
            "description": "Major market downturn scenario",
            "impact_probability": -25,
            "impact_wealth": -net_worth * 0.3,
            "verdict": "Stay the course, don't sell"
        }
    ]
    
    return {
        "headline": headline,
        "headline_sentiment": headline_sentiment,
        "optimal_retirement_age": optimal_retirement_age,
        "current_retirement_age": retirement_age,
        "years_to_retirement": years_to_retirement,
        "monte_carlo_probability": monte_carlo_probability,
        "retirement_target": retirement_target,
        "current_trajectory": {
            "on_track": monte_carlo_probability >= 75,
            "gap_to_target": max(0, 85 - monte_carlo_probability),
            "projected_retirement_wealth": projections[-1]["net_worth"] if projections else net_worth
        },
        "key_insight": f"Implementing these {len(top_recommendations)} changes could add ${total_impact/1000000:.1f}M to your retirement wealth and let you retire {years_earlier} years earlier.",
        "recommendations": top_recommendations,
        "total_impact": total_impact,
        "years_earlier_possible": years_earlier,
        "net_worth_projections": projections,
        "life_scenarios": life_scenarios,
        "financial_snapshot": {
            "net_worth": net_worth,
            "annual_income": annual_income,
            "annual_savings": annual_savings,
            "savings_rate": savings_rate * 100,
            "monthly_cashflow": monthly_savings
        },
        "generated_at": datetime.now().isoformat()
    }


def generate_life_scenario_impact(
    scenario_id: str,
    base_probability: float,
    net_worth: float,
    annual_savings: float,
    years_to_retirement: int
) -> Dict[str, Any]:
    """Calculate the impact of a life decision scenario."""
    
    scenarios = {
        "retire_early_5": {
            "name": "Retire 5 years earlier",
            "probability_change": -12,
            "wealth_change_pct": -0.15,
            "description": "5 fewer years of savings and growth"
        },
        "retire_late_5": {
            "name": "Retire 5 years later", 
            "probability_change": +15,
            "wealth_change_pct": +0.25,
            "description": "5 more years of compounding"
        },
        "buy_property": {
            "name": "Buy investment property",
            "probability_change": -5,
            "wealth_change_pct": +0.10,
            "description": "Leverage for growth, but reduced liquidity"
        },
        "start_business": {
            "name": "Start a business",
            "probability_change": -20,
            "wealth_change_pct": 0,
            "description": "High risk/reward, uncertain outcome"
        },
        "market_crash": {
            "name": "30% market crash",
            "probability_change": -22,
            "wealth_change_pct": -0.30,
            "description": "Major downturn in first 5 years"
        },
        "high_inflation": {
            "name": "High inflation (6%)",
            "probability_change": -13,
            "wealth_change_pct": -0.15,
            "description": "Purchasing power erosion"
        },
        "job_loss": {
            "name": "Job loss (1 year)",
            "probability_change": -8,
            "wealth_change_pct": -0.05,
            "description": "1 year of reduced income"
        },
        "inheritance": {
            "name": "Receive $500K inheritance",
            "probability_change": +20,
            "wealth_change_pct": +0.25,
            "description": "Windfall accelerates goals"
        },
        "increase_savings_500": {
            "name": "Save extra $500/month",
            "probability_change": +8,
            "wealth_change_pct": +0.12,
            "description": "Consistent additional savings"
        },
        "increase_savings_1000": {
            "name": "Save extra $1,000/month",
            "probability_change": +15,
            "wealth_change_pct": +0.22,
            "description": "Significant savings boost"
        }
    }
    
    scenario = scenarios.get(scenario_id, scenarios["retire_early_5"])
    
    new_probability = max(10, min(99, base_probability + scenario["probability_change"]))
    new_wealth = net_worth * (1 + scenario["wealth_change_pct"])
    
    return {
        "scenario_id": scenario_id,
        "name": scenario["name"],
        "description": scenario["description"],
        "base_probability": base_probability,
        "new_probability": new_probability,
        "probability_change": scenario["probability_change"],
        "base_wealth": net_worth,
        "projected_wealth": new_wealth,
        "wealth_change": new_wealth - net_worth,
        "recommendation": "Proceed with caution" if scenario["probability_change"] < -10 else "Viable option"
    }
