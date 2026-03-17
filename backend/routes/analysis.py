"""
Analysis Routes
Investment analysis, Monte Carlo simulations, property comparison, and scenario analysis.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["Analysis"])


class MonteCarloRequest(BaseModel):
    initial_value: float
    expected_return: float = 0.07
    volatility: float = 0.15
    years: int = 10
    simulations: int = 1000


class PropertyInput(BaseModel):
    property_id: str = ""
    name: str
    value: float
    rental_income: float = 0
    mortgage_amount: float = 0
    mortgage_rate: float = 0
    mortgage_term_years: int = 30
    annual_expenses: float = 0
    depreciation_building: float = 0
    depreciation_fixtures: float = 0


class PropertyComparisonRequest(BaseModel):
    properties: List[Dict[str, Any]]
    marginal_tax_rate: float = 0.30
    investment_horizon_years: int = 10
    expected_capital_growth: float = 0.04


class LoanCalculationRequest(BaseModel):
    principal: float
    annual_rate: float
    years: int = 30


class FrankingRequest(BaseModel):
    dividend: float
    franking_percentage: float = 100


class NegativeGearingRequest(BaseModel):
    property_data: PropertyInput
    marginal_tax_rate: float = 0.30


def run_monte_carlo_simulation(
    initial_value: float,
    expected_return: float,
    volatility: float,
    years: int,
    simulations: int = 1000
) -> Dict[str, Any]:
    """Run Monte Carlo simulation for investment projections."""
    np.random.seed(42)
    
    results = np.zeros((simulations, years + 1))
    results[:, 0] = initial_value
    
    for year in range(1, years + 1):
        random_returns = np.random.normal(expected_return, volatility, simulations)
        results[:, year] = results[:, year - 1] * (1 + random_returns)
    
    final_values = results[:, -1]
    
    percentiles = {
        "years": list(range(years + 1)),
        "p10": [float(np.percentile(results[:, i], 10)) for i in range(years + 1)],
        "p25": [float(np.percentile(results[:, i], 25)) for i in range(years + 1)],
        "p50": [float(np.percentile(results[:, i], 50)) for i in range(years + 1)],
        "p75": [float(np.percentile(results[:, i], 75)) for i in range(years + 1)],
        "p90": [float(np.percentile(results[:, i], 90)) for i in range(years + 1)]
    }
    
    return {
        "initial_value": initial_value,
        "expected_return": expected_return * 100,
        "volatility": volatility * 100,
        "simulation_years": years,
        "num_simulations": simulations,
        "final_value_mean": float(np.mean(final_values)),
        "final_value_median": float(np.median(final_values)),
        "final_value_std": float(np.std(final_values)),
        "probability_of_loss": float(np.mean(final_values < initial_value) * 100),
        "probability_double": float(np.mean(final_values > initial_value * 2) * 100),
        "percentile_projections": percentiles,
        "best_case": float(np.max(final_values)),
        "worst_case": float(np.min(final_values))
    }


def calculate_loan_repayment(principal: float, annual_rate: float, years: int) -> Dict[str, Any]:
    """Calculate loan repayment schedule with variable rate scenarios."""
    monthly_rate = annual_rate / 100 / 12
    n_payments = years * 12
    
    if monthly_rate == 0:
        monthly_payment = principal / n_payments
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**n_payments) / ((1 + monthly_rate)**n_payments - 1)
    
    total_repayment = monthly_payment * n_payments
    total_interest = total_repayment - principal
    
    scenarios = []
    for rate_change in [-2, -1, 0, 1, 2]:
        new_rate = max(0, annual_rate + rate_change)
        new_monthly_rate = new_rate / 100 / 12
        if new_monthly_rate == 0:
            new_monthly = principal / n_payments
        else:
            new_monthly = principal * (new_monthly_rate * (1 + new_monthly_rate)**n_payments) / ((1 + new_monthly_rate)**n_payments - 1)
        scenarios.append({
            "rate_change": rate_change,
            "new_rate": new_rate,
            "monthly_payment": new_monthly,
            "annual_payment": new_monthly * 12,
            "total_interest": new_monthly * n_payments - principal
        })
    
    return {
        "principal": principal,
        "annual_rate": annual_rate,
        "term_years": years,
        "monthly_payment": monthly_payment,
        "annual_payment": monthly_payment * 12,
        "total_repayment": total_repayment,
        "total_interest": total_interest,
        "variable_rate_scenarios": scenarios
    }


def calculate_debt_to_equity(total_assets: float, total_debt: float) -> Dict[str, float]:
    """Calculate debt to equity ratio and related metrics."""
    equity = total_assets - total_debt
    debt_to_equity = (total_debt / equity) if equity > 0 else float('inf')
    debt_to_assets = (total_debt / total_assets) if total_assets > 0 else 0
    equity_ratio = (equity / total_assets) if total_assets > 0 else 0
    
    return {
        "total_assets": total_assets,
        "total_debt": total_debt,
        "equity": equity,
        "debt_to_equity_ratio": debt_to_equity,
        "debt_to_assets_ratio": debt_to_assets,
        "equity_ratio": equity_ratio,
        "leverage_multiple": (total_assets / equity) if equity > 0 else float('inf')
    }


def calculate_franking_credits(dividend: float, franking_percentage: float = 100) -> Dict[str, float]:
    """Calculate franking credits for dividends."""
    franking_rate = 0.25  # Base rate entity
    franked_portion = dividend * (franking_percentage / 100)
    unfranked_portion = dividend - franked_portion
    franking_credit = franked_portion * (franking_rate / (1 - franking_rate))
    grossed_up_dividend = dividend + franking_credit
    
    return {
        "cash_dividend": dividend,
        "franking_percentage": franking_percentage,
        "franked_portion": franked_portion,
        "unfranked_portion": unfranked_portion,
        "franking_credit": franking_credit,
        "grossed_up_dividend": grossed_up_dividend,
        "franking_rate_used": franking_rate * 100
    }


def calculate_negative_gearing(property_data: PropertyInput, marginal_tax_rate: float) -> Dict[str, Any]:
    """Calculate negative gearing benefits for a property."""
    annual_interest = property_data.mortgage_amount * (property_data.mortgage_rate / 100)
    
    total_deductions = (
        annual_interest +
        property_data.annual_expenses +
        property_data.depreciation_building +
        property_data.depreciation_fixtures
    )
    
    net_rental = property_data.rental_income - total_deductions
    
    tax_benefit = 0
    if net_rental < 0:
        tax_benefit = abs(net_rental) * marginal_tax_rate
    
    return {
        "property_name": property_data.name,
        "property_value": property_data.value,
        "rental_income": property_data.rental_income,
        "mortgage_interest": annual_interest,
        "other_expenses": property_data.annual_expenses,
        "depreciation": property_data.depreciation_building + property_data.depreciation_fixtures,
        "total_deductions": total_deductions,
        "net_rental_income": net_rental,
        "is_negatively_geared": net_rental < 0,
        "annual_tax_benefit": tax_benefit,
        "cash_flow_after_tax": net_rental + tax_benefit
    }


def compare_investment_properties(
    properties: List[Dict[str, Any]],
    marginal_tax_rate: float = 0.30,
    investment_horizon_years: int = 10,
    expected_capital_growth: float = 0.04
) -> Dict[str, Any]:
    """Compare multiple investment properties side by side."""
    comparisons = []
    
    for prop in properties:
        value = prop.get("value", 0)
        rental_income = prop.get("rental_income", 0)
        mortgage_amount = prop.get("mortgage_amount", 0)
        mortgage_rate = prop.get("mortgage_rate", 0) / 100
        annual_expenses = prop.get("annual_expenses", 0)
        depreciation = prop.get("depreciation_building", 0) + prop.get("depreciation_fixtures", 0)
        
        gross_yield = (rental_income / value * 100) if value > 0 else 0
        annual_interest = mortgage_amount * mortgage_rate
        total_costs = annual_interest + annual_expenses
        net_rental = rental_income - total_costs
        net_yield = (net_rental / value * 100) if value > 0 else 0
        
        is_negatively_geared = (rental_income - total_costs - depreciation) < 0
        total_deductions = annual_interest + annual_expenses + depreciation
        tax_benefit = 0
        if rental_income < total_deductions:
            tax_benefit = (total_deductions - rental_income) * marginal_tax_rate
        
        cash_flow_before_tax = rental_income - annual_interest - annual_expenses
        cash_flow_after_tax = cash_flow_before_tax + tax_benefit
        
        equity = value - mortgage_amount
        lvr = (mortgage_amount / value * 100) if value > 0 else 0
        
        deposit_assumed = equity if equity > 0 else value * 0.2
        return_on_equity = (cash_flow_after_tax / deposit_assumed * 100) if deposit_assumed > 0 else 0
        
        future_value = value * ((1 + expected_capital_growth) ** investment_horizon_years)
        capital_gain = future_value - value
        
        cumulative_cash_flow = cash_flow_after_tax * investment_horizon_years
        total_return = capital_gain + cumulative_cash_flow
        annualized_return = ((total_return / equity) / investment_horizon_years * 100) if equity > 0 else 0
        
        comparisons.append({
            "property_name": prop.get("name", "Unknown"),
            "property_id": prop.get("property_id", ""),
            "metrics": {
                "current_value": value,
                "rental_income": rental_income,
                "gross_yield": round(gross_yield, 2),
                "net_yield": round(net_yield, 2),
                "mortgage_amount": mortgage_amount,
                "mortgage_rate": prop.get("mortgage_rate", 0),
                "lvr": round(lvr, 1),
                "equity": equity
            },
            "cash_flow": {
                "annual_income": rental_income,
                "annual_interest": annual_interest,
                "annual_expenses": annual_expenses,
                "depreciation": depreciation,
                "total_deductions": total_deductions,
                "net_rental_income": net_rental,
                "tax_benefit": tax_benefit,
                "cash_flow_before_tax": cash_flow_before_tax,
                "cash_flow_after_tax": cash_flow_after_tax,
                "is_negatively_geared": is_negatively_geared
            },
            "returns": {
                "return_on_equity": round(return_on_equity, 2),
                "projected_value": round(future_value, 0),
                "expected_capital_gain": round(capital_gain, 0),
                "cumulative_cash_flow": round(cumulative_cash_flow, 0),
                "total_return": round(total_return, 0),
                "annualized_return": round(annualized_return, 2)
            }
        })
    
    if comparisons:
        best_yield = max(comparisons, key=lambda x: x["metrics"]["gross_yield"])
        best_cash_flow = max(comparisons, key=lambda x: x["cash_flow"]["cash_flow_after_tax"])
        best_growth = max(comparisons, key=lambda x: x["returns"]["annualized_return"])
        
        recommendations = {
            "best_for_yield": best_yield["property_name"],
            "best_for_cash_flow": best_cash_flow["property_name"],
            "best_for_growth": best_growth["property_name"]
        }
    else:
        recommendations = {}
    
    return {
        "comparisons": comparisons,
        "summary": {
            "total_properties": len(properties),
            "total_value": sum(p.get("value", 0) for p in properties),
            "total_debt": sum(p.get("mortgage_amount", 0) for p in properties),
            "total_equity": sum(c["metrics"]["equity"] for c in comparisons),
            "total_rental_income": sum(p.get("rental_income", 0) for p in properties),
            "total_cash_flow": sum(c["cash_flow"]["cash_flow_after_tax"] for c in comparisons),
            "average_yield": sum(c["metrics"]["gross_yield"] for c in comparisons) / len(comparisons) if comparisons else 0,
            "average_lvr": sum(c["metrics"]["lvr"] for c in comparisons) / len(comparisons) if comparisons else 0
        },
        "recommendations": recommendations,
        "analysis_parameters": {
            "marginal_tax_rate": marginal_tax_rate * 100,
            "investment_horizon": investment_horizon_years,
            "expected_growth_rate": expected_capital_growth * 100
        }
    }


@router.post("/monte-carlo")
async def analyze_monte_carlo(
    initial_value: float = Query(...),
    expected_return: float = Query(default=0.07),
    volatility: float = Query(default=0.15),
    years: int = Query(default=10),
    simulations: int = Query(default=1000)
):
    """Run Monte Carlo simulation."""
    return run_monte_carlo_simulation(
        initial_value,
        expected_return,
        volatility,
        years,
        min(simulations, 5000)
    )


@router.post("/loan")
async def analyze_loan(
    principal: float = Query(...),
    annual_rate: float = Query(...),
    years: int = Query(default=30)
):
    """Calculate loan repayment with variable rate scenarios."""
    return calculate_loan_repayment(principal, annual_rate, years)


@router.post("/debt-equity")
async def analyze_debt_equity(
    total_assets: float = Query(...),
    total_debt: float = Query(default=0)
):
    """Calculate debt to equity ratio."""
    return calculate_debt_to_equity(total_assets, total_debt)


@router.post("/franking")
async def analyze_franking(request: FrankingRequest):
    """Calculate franking credits."""
    return calculate_franking_credits(request.dividend, request.franking_percentage)


@router.post("/negative-gearing")
async def analyze_negative_gearing(request: NegativeGearingRequest):
    """Calculate negative gearing benefits."""
    return calculate_negative_gearing(request.property_data, request.marginal_tax_rate)


@router.post("/property-comparison")
async def analyze_property_comparison(request: PropertyComparisonRequest):
    """Compare multiple investment properties."""
    return compare_investment_properties(
        request.properties,
        request.marginal_tax_rate,
        request.investment_horizon_years,
        request.expected_capital_growth
    )



# ============= SMSF OPTIMIZER =============

@router.post("/smsf")
async def analyze_smsf(
    age: int = Query(...),
    current_super_balance: float = Query(...),
    taxable_income: float = Query(...),
    employer_contribution: float = Query(default=0),
    salary_sacrifice: float = Query(default=0),
    personal_contribution: float = Query(default=0),
    spouse_contribution: float = Query(default=0)
):
    """
    Optimize SMSF contributions for tax efficiency.
    """
    # Determine marginal tax rate
    if taxable_income <= 18200:
        marginal_rate = 0
    elif taxable_income <= 45000:
        marginal_rate = 0.19
    elif taxable_income <= 120000:
        marginal_rate = 0.325
    elif taxable_income <= 180000:
        marginal_rate = 0.37
    else:
        marginal_rate = 0.45
    
    # 2024-25 contribution caps
    concessional_cap = 30000  # Pre-tax contributions
    non_concessional_cap = 120000  # After-tax contributions
    
    # Calculate current total contributions
    total_concessional = employer_contribution + salary_sacrifice
    remaining_concessional = max(0, concessional_cap - total_concessional)
    
    # Tax saving from salary sacrifice
    tax_saving_per_dollar = max(0, marginal_rate - 0.15)
    
    # Optimal additional salary sacrifice
    optimal_sacrifice = remaining_concessional
    tax_saved = optimal_sacrifice * tax_saving_per_dollar
    
    # Projected balance (7% return, years to retirement)
    years_to_retirement = max(0, 67 - age)
    annual_contribution = employer_contribution + salary_sacrifice + personal_contribution
    
    projected_balance = current_super_balance
    for _ in range(years_to_retirement):
        projected_balance = projected_balance * 1.07 + annual_contribution
    
    # Generate recommendations
    recommendations = []
    if tax_saving_per_dollar > 0.10 and remaining_concessional > 0:
        recommendations.append({
            "type": "salary_sacrifice",
            "title": "Increase Salary Sacrifice",
            "description": f"You can contribute an additional ${remaining_concessional:,.0f} as salary sacrifice",
            "impact": f"Save ${tax_saved:,.0f} in tax",
            "priority": "high"
        })
    if age >= 60:
        recommendations.append({
            "type": "ttr",
            "title": "Transition to Retirement Strategy",
            "description": "Consider a TTR pension to reduce tax while still working",
            "impact": "Potential tax savings of 15-30%",
            "priority": "medium"
        })
    if years_to_retirement > 20:
        recommendations.append({
            "type": "investment",
            "title": "Growth Investment Strategy",
            "description": "With a long time horizon, consider a growth-oriented investment mix",
            "impact": "Higher long-term returns potential",
            "priority": "medium"
        })
    if current_super_balance < 500000 and age >= 50:
        recommendations.append({
            "type": "catchup",
            "title": "Catch-up Contributions Available",
            "description": "You may be eligible for carry-forward concessional contributions",
            "impact": "Up to $30k additional concessional per year",
            "priority": "high"
        })
    if not recommendations:
        recommendations.append({
            "type": "info",
            "title": "Strategy Optimized",
            "description": "Your SMSF strategy appears well-optimized",
            "impact": "Maintain current approach",
            "priority": "low"
        })
    
    return {
        "current_contributions": {
            "employer": employer_contribution,
            "salary_sacrifice": salary_sacrifice,
            "personal": personal_contribution,
            "spouse": spouse_contribution,
            "total_concessional": total_concessional,
            "total_non_concessional": personal_contribution + spouse_contribution
        },
        "caps": {
            "concessional": concessional_cap,
            "non_concessional": non_concessional_cap,
            "concessional_remaining": remaining_concessional,
            "non_concessional_remaining": non_concessional_cap - (personal_contribution + spouse_contribution)
        },
        "tax_analysis": {
            "marginal_rate": marginal_rate * 100,
            "super_tax_rate": 15,
            "tax_saving_per_dollar": tax_saving_per_dollar * 100,
            "potential_tax_saved": tax_saved
        },
        "projections": {
            "years_to_retirement": years_to_retirement,
            "current_balance": current_super_balance,
            "projected_balance_at_67": projected_balance,
            "assumed_return": 7.0
        },
        "recommendations": recommendations
    }


# ============= TAX COMPARISON =============

@router.post("/tax-comparison")
async def analyze_tax_comparison(
    income: float = Query(...),
    deductions: float = Query(default=0),
    has_private_health: bool = Query(default=False)
):
    """
    Compare tax across financial years.
    """
    taxable_income = max(0, income - deductions)
    
    # Calculate current year tax (2024-25 rates)
    def calc_tax_2024(taxable):
        if taxable <= 18200:
            return 0
        elif taxable <= 45000:
            return (taxable - 18200) * 0.16
        elif taxable <= 135000:
            return 4288 + (taxable - 45000) * 0.30
        elif taxable <= 190000:
            return 31288 + (taxable - 135000) * 0.37
        else:
            return 51638 + (taxable - 190000) * 0.45
    
    # Calculate previous year tax (2023-24 rates)
    def calc_tax_2023(taxable):
        if taxable <= 18200:
            return 0
        elif taxable <= 45000:
            return (taxable - 18200) * 0.19
        elif taxable <= 120000:
            return 5092 + (taxable - 45000) * 0.325
        elif taxable <= 180000:
            return 29467 + (taxable - 120000) * 0.37
        else:
            return 51667 + (taxable - 180000) * 0.45
    
    tax_2024 = calc_tax_2024(taxable_income)
    tax_2023 = calc_tax_2023(taxable_income)
    
    # Medicare levy
    medicare = taxable_income * 0.02 if taxable_income > 24276 else 0
    
    return {
        "taxable_income": taxable_income,
        "comparison": [
            {
                "year": "2024-25",
                "tax_payable": round(tax_2024, 2),
                "medicare_levy": round(medicare, 2),
                "total_tax": round(tax_2024 + medicare, 2),
                "effective_rate": round((tax_2024 + medicare) / taxable_income * 100, 2) if taxable_income > 0 else 0
            },
            {
                "year": "2023-24",
                "tax_payable": round(tax_2023, 2),
                "medicare_levy": round(medicare, 2),
                "total_tax": round(tax_2023 + medicare, 2),
                "effective_rate": round((tax_2023 + medicare) / taxable_income * 100, 2) if taxable_income > 0 else 0
            }
        ],
        "savings": {
            "amount": round(tax_2023 - tax_2024, 2),
            "percentage": round((tax_2023 - tax_2024) / tax_2023 * 100, 2) if tax_2023 > 0 else 0
        }
    }
