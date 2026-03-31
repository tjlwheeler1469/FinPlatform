"""
Tax Analysis Routes
Handles all tax calculation endpoints including CGT, income tax, and comparisons.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tax", tags=["Tax Analysis"])

# Import tax constants from services
from services.tax_constants import (
    HISTORICAL_TAX_BRACKETS,
    PERSONAL_TAX_BRACKETS_2024_25,
    HISTORICAL_COMPANY_RATES,
    COMPANY_TAX_RATE_BASE,
    COMPANY_TAX_RATE_FULL,
    MEDICARE_LEVY_RATE,
    MEDICARE_LEVY_THRESHOLD,
    CGT_DISCOUNT_INDIVIDUAL,
    CGT_DISCOUNT_SMSF,
    SMSF_CONCESSIONAL_CAP,
    SMSF_NON_CONCESSIONAL_CAP,
    SMSF_BRING_FORWARD_CAP,
    SMSF_TOTAL_SUPER_BALANCE_LIMIT,
    SMSF_TAX_RATE,
    DIV_293_THRESHOLD,
)


class TaxCalculationRequest(BaseModel):
    taxable_income: float
    entity_type: str = "personal"
    is_base_rate_entity: bool = True
    year: str = "2024-25"


class CGTCalculationRequest(BaseModel):
    purchase_price: float
    sale_price: float
    holding_period_months: int
    marginal_tax_rate: float = 0.30
    entity_type: str = "individual"
    improvement_costs: float = 0
    selling_costs: float = 0


class SMSFContributionRequest(BaseModel):
    age: int
    current_super_balance: float
    taxable_income: float
    employer_contribution: float = 0
    salary_sacrifice: float = 0
    personal_contribution: float = 0
    spouse_contribution: float = 0


def calculate_personal_income_tax(taxable_income: float, year: str = "2024-25") -> Dict[str, Any]:
    """Calculate Australian personal income tax."""
    brackets = PERSONAL_TAX_BRACKETS_2024_25
    
    tax = 0
    prev_threshold = 0
    breakdown = []
    
    for threshold, rate in brackets:
        if taxable_income <= prev_threshold:
            break
        taxable_in_bracket = min(taxable_income, threshold) - prev_threshold
        tax_in_bracket = taxable_in_bracket * rate
        tax += tax_in_bracket
        if taxable_in_bracket > 0 and rate > 0:
            breakdown.append({
                "bracket": f"${prev_threshold:,.0f} - ${threshold:,.0f}" if threshold != float('inf') else f"${prev_threshold:,.0f}+",
                "rate": rate * 100,
                "taxable": taxable_in_bracket,
                "tax": tax_in_bracket
            })
        prev_threshold = threshold
    
    # Medicare levy
    medicare_levy = 0
    if taxable_income > MEDICARE_LEVY_THRESHOLD:
        medicare_levy = taxable_income * MEDICARE_LEVY_RATE
    
    total_tax = tax + medicare_levy
    effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else 0
    
    return {
        "taxable_income": taxable_income,
        "income_tax": tax,
        "medicare_levy": medicare_levy,
        "total_tax": total_tax,
        "effective_rate": effective_rate,
        "net_income": taxable_income - total_tax,
        "breakdown": breakdown
    }


def calculate_company_tax(taxable_income: float, is_base_rate_entity: bool = True) -> Dict[str, Any]:
    """Calculate Australian company tax."""
    rate = COMPANY_TAX_RATE_BASE if is_base_rate_entity else COMPANY_TAX_RATE_FULL
    tax = taxable_income * rate
    
    return {
        "taxable_income": taxable_income,
        "tax_rate": rate * 100,
        "company_tax": tax,
        "net_profit": taxable_income - tax,
        "is_base_rate_entity": is_base_rate_entity
    }


def calculate_personal_income_tax_historical(taxable_income: float, year: str = "2024-25") -> Dict[str, Any]:
    """Calculate Australian personal income tax for any historical year."""
    if year not in HISTORICAL_TAX_BRACKETS:
        year = "2024-25"
    
    brackets = HISTORICAL_TAX_BRACKETS[year]["brackets"]
    medicare_threshold = HISTORICAL_TAX_BRACKETS[year]["medicare_threshold"]
    
    tax = 0
    prev_threshold = 0
    breakdown = []
    
    for threshold, rate in brackets:
        if taxable_income <= prev_threshold:
            break
        taxable_in_bracket = min(taxable_income, threshold) - prev_threshold
        tax_in_bracket = taxable_in_bracket * rate
        tax += tax_in_bracket
        if taxable_in_bracket > 0 and rate > 0:
            breakdown.append({
                "bracket": f"${prev_threshold:,.0f} - ${threshold:,.0f}" if threshold != float('inf') else f"${prev_threshold:,.0f}+",
                "rate": rate * 100,
                "taxable": taxable_in_bracket,
                "tax": tax_in_bracket
            })
        prev_threshold = threshold
    
    medicare_levy = 0
    if taxable_income > medicare_threshold:
        medicare_levy = taxable_income * MEDICARE_LEVY_RATE
    
    total_tax = tax + medicare_levy
    effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else 0
    
    return {
        "year": year,
        "taxable_income": taxable_income,
        "income_tax": tax,
        "medicare_levy": medicare_levy,
        "total_tax": total_tax,
        "effective_rate": effective_rate,
        "net_income": taxable_income - total_tax,
        "breakdown": breakdown,
        "description": HISTORICAL_TAX_BRACKETS[year]["description"]
    }


def calculate_capital_gains_tax(
    purchase_price: float,
    sale_price: float,
    holding_period_months: int,
    marginal_tax_rate: float,
    entity_type: str = "individual",
    improvement_costs: float = 0,
    selling_costs: float = 0
) -> Dict[str, Any]:
    """Calculate Australian Capital Gains Tax."""
    cost_base = purchase_price + improvement_costs + selling_costs
    capital_gain = sale_price - cost_base
    
    if capital_gain <= 0:
        return {
            "purchase_price": purchase_price,
            "sale_price": sale_price,
            "cost_base": cost_base,
            "capital_gain": capital_gain,
            "is_loss": True,
            "capital_loss": abs(capital_gain),
            "taxable_gain": 0,
            "cgt_payable": 0,
            "effective_cgt_rate": 0,
            "discount_applied": False,
            "discount_percentage": 0,
            "holding_period_months": holding_period_months,
            "note": "Capital loss can be carried forward to offset future gains"
        }
    
    discount_eligible = holding_period_months >= 12
    
    if entity_type == "individual":
        discount = CGT_DISCOUNT_INDIVIDUAL if discount_eligible else 0
    elif entity_type == "smsf":
        discount = CGT_DISCOUNT_SMSF if discount_eligible else 0
    else:
        discount = 0
    
    taxable_gain = capital_gain * (1 - discount)
    cgt_payable = taxable_gain * marginal_tax_rate
    effective_cgt_rate = (cgt_payable / capital_gain * 100) if capital_gain > 0 else 0
    
    return {
        "purchase_price": purchase_price,
        "sale_price": sale_price,
        "improvement_costs": improvement_costs,
        "selling_costs": selling_costs,
        "cost_base": cost_base,
        "capital_gain": capital_gain,
        "is_loss": False,
        "discount_eligible": discount_eligible,
        "discount_applied": discount > 0,
        "discount_percentage": discount * 100,
        "taxable_gain": taxable_gain,
        "marginal_tax_rate": marginal_tax_rate * 100,
        "cgt_payable": cgt_payable,
        "effective_cgt_rate": effective_cgt_rate,
        "net_proceeds": sale_price - selling_costs - cgt_payable,
        "holding_period_months": holding_period_months,
        "entity_type": entity_type
    }


def calculate_smsf_contribution_strategy(
    age: int,
    current_super_balance: float,
    taxable_income: float,
    employer_contribution: float = 0,
    salary_sacrifice: float = 0,
    personal_contribution: float = 0,
    spouse_contribution: float = 0
) -> Dict[str, Any]:
    """Calculate SMSF contribution strategy and tax benefits."""
    total_concessional = employer_contribution + salary_sacrifice + personal_contribution
    concessional_cap_exceeded = total_concessional > SMSF_CONCESSIONAL_CAP
    excess_concessional = max(0, total_concessional - SMSF_CONCESSIONAL_CAP)
    can_make_non_concessional = current_super_balance < SMSF_TOTAL_SUPER_BALANCE_LIMIT
    bring_forward_available = age < 75 and current_super_balance < (SMSF_TOTAL_SUPER_BALANCE_LIMIT - SMSF_NON_CONCESSIONAL_CAP)
    
    marginal_rate = 0
    for threshold, rate in PERSONAL_TAX_BRACKETS_2024_25:
        if taxable_income <= threshold:
            marginal_rate = rate
            break
    if marginal_rate == 0 and taxable_income > 190000:
        marginal_rate = 0.45
    
    tax_saved_salary_sacrifice = (marginal_rate - SMSF_TAX_RATE) * min(salary_sacrifice, SMSF_CONCESSIONAL_CAP - employer_contribution)
    
    div_293_applicable = (taxable_income + total_concessional) > DIV_293_THRESHOLD
    div_293_tax = 0
    if div_293_applicable:
        div_293_income = min(total_concessional, (taxable_income + total_concessional) - DIV_293_THRESHOLD)
        div_293_tax = div_293_income * 0.15
    
    spouse_tax_offset = 0
    if spouse_contribution > 0:
        spouse_tax_offset = min(540, spouse_contribution * 0.18)
    
    remaining_concessional_cap = max(0, SMSF_CONCESSIONAL_CAP - total_concessional)
    years_to_retirement = max(0, 67 - age)
    projected_balance = current_super_balance
    annual_contribution = total_concessional + spouse_contribution
    growth_rate = 0.07
    
    for _ in range(years_to_retirement):
        projected_balance = projected_balance * (1 + growth_rate) + annual_contribution
    
    recommendations = generate_smsf_recommendations(
        age, current_super_balance, total_concessional, 
        remaining_concessional_cap, marginal_rate, div_293_applicable
    )
    
    return {
        "current_age": age,
        "current_super_balance": current_super_balance,
        "contributions": {
            "employer_contribution": employer_contribution,
            "salary_sacrifice": salary_sacrifice,
            "personal_contribution": personal_contribution,
            "spouse_contribution": spouse_contribution,
            "total_concessional": total_concessional,
            "total_non_concessional": spouse_contribution
        },
        "caps": {
            "concessional_cap": SMSF_CONCESSIONAL_CAP,
            "concessional_used": total_concessional,
            "concessional_remaining": remaining_concessional_cap,
            "cap_exceeded": concessional_cap_exceeded,
            "excess_amount": excess_concessional,
            "non_concessional_cap": SMSF_NON_CONCESSIONAL_CAP,
            "can_make_non_concessional": can_make_non_concessional,
            "bring_forward_available": bring_forward_available,
            "bring_forward_cap": SMSF_BRING_FORWARD_CAP if bring_forward_available else 0
        },
        "tax_analysis": {
            "marginal_tax_rate": marginal_rate * 100,
            "super_tax_rate": SMSF_TAX_RATE * 100,
            "tax_saved_salary_sacrifice": tax_saved_salary_sacrifice,
            "div_293_applicable": div_293_applicable,
            "div_293_additional_tax": div_293_tax,
            "spouse_tax_offset": spouse_tax_offset,
            "total_tax_benefit": tax_saved_salary_sacrifice + spouse_tax_offset - div_293_tax
        },
        "projections": {
            "years_to_retirement": years_to_retirement,
            "projected_balance_at_67": projected_balance,
            "assumed_growth_rate": growth_rate * 100,
            "annual_contribution": annual_contribution
        },
        "recommendations": recommendations
    }


def generate_smsf_recommendations(
    age: int, 
    balance: float, 
    total_concessional: float,
    remaining_cap: float,
    marginal_rate: float,
    div_293: bool
) -> List[str]:
    """Generate SMSF contribution recommendations."""
    recommendations = []
    
    if remaining_cap > 0 and marginal_rate > SMSF_TAX_RATE:
        tax_saving = remaining_cap * (marginal_rate - SMSF_TAX_RATE)
        recommendations.append(
            f"Consider additional ${remaining_cap:,.0f} salary sacrifice to save ${tax_saving:,.0f} in tax"
        )
    
    if balance < 500000 and age > 50:
        recommendations.append(
            "Consider catch-up contributions using unused cap from previous years"
        )
    
    if div_293:
        recommendations.append(
            "Division 293 applies - additional 15% tax on some super contributions"
        )
    
    if age >= 60:
        recommendations.append(
            "Consider transition to retirement strategy to access super tax-effectively"
        )
    
    if balance > 1700000:
        recommendations.append(
            "Approaching transfer balance cap - review pension strategies"
        )
    
    if not recommendations:
        recommendations.append("Current contribution strategy is optimal")
    
    return recommendations


@router.post("/calculate")
async def calculate_tax(request: TaxCalculationRequest):
    """Calculate tax for given income."""
    if request.entity_type == "personal":
        return calculate_personal_income_tax(request.taxable_income, request.year)
    else:
        return calculate_company_tax(request.taxable_income, request.is_base_rate_entity)


@router.post("/cgt")
async def calculate_cgt(request: CGTCalculationRequest):
    """Calculate Capital Gains Tax."""
    return calculate_capital_gains_tax(
        request.purchase_price,
        request.sale_price,
        request.holding_period_months,
        request.marginal_tax_rate,
        request.entity_type,
        request.improvement_costs,
        request.selling_costs
    )


@router.post("/smsf")
async def calculate_smsf(request: SMSFContributionRequest):
    """Calculate SMSF contribution strategy and benefits."""
    return calculate_smsf_contribution_strategy(
        request.age,
        request.current_super_balance,
        request.taxable_income,
        request.employer_contribution,
        request.salary_sacrifice,
        request.personal_contribution,
        request.spouse_contribution
    )


@router.get("/rates")
async def get_tax_rates():
    """Get current Australian tax rates."""
    return {
        "personal": {
            "year": "2024-25",
            "brackets": [
                {"threshold": 18200, "rate": 0, "description": "Tax-free threshold"},
                {"threshold": 45000, "rate": 16, "description": "16% on $18,201 - $45,000"},
                {"threshold": 135000, "rate": 30, "description": "30% on $45,001 - $135,000"},
                {"threshold": 190000, "rate": 37, "description": "37% on $135,001 - $190,000"},
                {"threshold": None, "rate": 45, "description": "45% on $190,001+"}
            ],
            "medicare_levy": {
                "rate": 2,
                "threshold": MEDICARE_LEVY_THRESHOLD
            }
        },
        "company": {
            "base_rate": COMPANY_TAX_RATE_BASE * 100,
            "full_rate": COMPANY_TAX_RATE_FULL * 100,
            "base_rate_threshold": 50000000
        },
        "franking_credit_rate": COMPANY_TAX_RATE_BASE * 100
    }


@router.get("/rates/historical")
async def get_historical_tax_rates():
    """Get historical Australian tax rates for comparison."""
    result = {}
    for year, data in HISTORICAL_TAX_BRACKETS.items():
        brackets = []
        prev = 0
        for threshold, rate in data["brackets"]:
            brackets.append({
                "from": prev,
                "to": threshold if threshold != float('inf') else None,
                "rate": rate * 100
            })
            prev = threshold
        result[year] = {
            "brackets": brackets,
            "medicare_threshold": data["medicare_threshold"],
            "description": data["description"]
        }
    return {
        "personal": result,
        "company": HISTORICAL_COMPANY_RATES
    }


@router.post("/comparison")
async def compare_tax_years(
    taxable_income: float,
    years: List[str] = ["2024-25", "2023-24", "2022-23"]
):
    """Compare tax across different years."""
    comparisons = []
    for year in years:
        if year in HISTORICAL_TAX_BRACKETS:
            result = calculate_personal_income_tax_historical(taxable_income, year)
            comparisons.append(result)
    
    if len(comparisons) >= 2:
        current = comparisons[0]
        previous = comparisons[1]
        savings = previous["total_tax"] - current["total_tax"]
    else:
        savings = 0
    
    return {
        "taxable_income": taxable_income,
        "comparisons": comparisons,
        "stage_3_savings": savings,
        "savings_percentage": (savings / comparisons[1]["total_tax"] * 100) if len(comparisons) >= 2 and comparisons[1]["total_tax"] > 0 else 0
    }
