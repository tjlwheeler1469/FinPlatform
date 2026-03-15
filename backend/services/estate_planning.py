"""
Estate Planning Module Service
Inheritance projections, trust planning, estate distribution.
"""
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np


def calculate_estate_projections(
    current_age: int,
    life_expectancy: int,
    current_net_worth: float,
    annual_growth_rate: float = 0.05,
    annual_expenses: float = 120000,
    super_balance: float = 600000,
    property_value: float = 2500000,
    investment_portfolio: float = 500000
) -> Dict[str, Any]:
    """
    Calculate estate projections including inheritance amounts.
    """
    
    years_remaining = life_expectancy - current_age
    
    # Project wealth at different ages
    projections = []
    value = current_net_worth
    
    for year in range(years_remaining + 1):
        age = current_age + year
        
        # Simple projection: growth minus expenses (simplified)
        if year > 0:
            value = value * (1 + annual_growth_rate) - annual_expenses
        
        projections.append({
            "age": age,
            "year": datetime.now().year + year,
            "projected_net_worth": max(0, value),
            "formatted": f"${max(0, value)/1000000:.1f}M" if value >= 1000000 else f"${max(0, value)/1000:.0f}K"
        })
    
    # Estate value at life expectancy
    final_estate = projections[-1]["projected_net_worth"] if projections else current_net_worth
    
    # Tax calculations (simplified Australian death taxes - mainly super death benefits tax)
    super_death_benefit_tax = super_balance * 0.15  # Non-dependent beneficiaries
    other_taxes = 0  # Australia has no inheritance tax on most assets
    
    return {
        "current_age": current_age,
        "life_expectancy": life_expectancy,
        "years_remaining": years_remaining,
        "current_net_worth": current_net_worth,
        "projected_estate_value": final_estate,
        "estate_composition": {
            "property": property_value,
            "super": super_balance,
            "investments": investment_portfolio,
            "other": current_net_worth - property_value - super_balance - investment_portfolio
        },
        "tax_implications": {
            "super_death_benefit_tax": super_death_benefit_tax,
            "capital_gains_tax": 0,  # Assets receive cost base reset on death
            "total_tax_liability": super_death_benefit_tax,
            "net_estate_after_tax": final_estate - super_death_benefit_tax
        },
        "projections": projections[::5] if len(projections) > 10 else projections  # Every 5 years
    }


def create_estate_plan(
    primary_name: str,
    spouse_name: str = None,
    beneficiaries: List[Dict] = None,
    assets: Dict[str, float] = None,
    special_bequests: List[Dict] = None,
    executor: str = None,
    guardians: List[str] = None
) -> Dict[str, Any]:
    """
    Generate an estate plan with distribution recommendations.
    """
    
    if beneficiaries is None:
        beneficiaries = [
            {"name": "Child 1", "relationship": "child", "percentage": 40},
            {"name": "Child 2", "relationship": "child", "percentage": 40},
            {"name": "Charity", "relationship": "charity", "percentage": 20}
        ]
    
    if assets is None:
        assets = {
            "family_home": 2500000,
            "investment_property": 1200000,
            "superannuation": 600000,
            "shares": 500000,
            "cash": 100000
        }
    
    total_assets = sum(assets.values())
    
    # Calculate distributions
    distributions = []
    for beneficiary in beneficiaries:
        amount = total_assets * (beneficiary["percentage"] / 100)
        distributions.append({
            "beneficiary": beneficiary["name"],
            "relationship": beneficiary["relationship"],
            "percentage": beneficiary["percentage"],
            "estimated_amount": amount,
            "formatted_amount": f"${amount/1000000:.1f}M" if amount >= 1000000 else f"${amount/1000:.0f}K"
        })
    
    # Estate planning recommendations
    recommendations = []
    
    # Super binding nominations
    recommendations.append({
        "action": "Update super binding death benefit nomination",
        "priority": "High",
        "detail": "Ensure binding nominations are current (valid for 3 years)",
        "impact": "Ensures super is distributed according to wishes, not trustee discretion"
    })
    
    # Family trust consideration
    if total_assets > 3000000:
        recommendations.append({
            "action": "Consider testamentary trust",
            "priority": "High",
            "detail": "Testamentary trust can provide tax benefits and asset protection for beneficiaries",
            "impact": "Potential tax savings of $10,000+ annually for beneficiaries"
        })
    
    # Power of Attorney
    recommendations.append({
        "action": "Review Enduring Power of Attorney",
        "priority": "High",
        "detail": "Ensure both financial and medical EPAs are in place",
        "impact": "Allows appointed person to make decisions if incapacitated"
    })
    
    # Life insurance review
    recommendations.append({
        "action": "Review life insurance coverage",
        "priority": "Medium",
        "detail": "Ensure adequate coverage for estate liquidity needs",
        "impact": "Prevents forced asset sales to settle estate"
    })
    
    return {
        "plan_id": f"EP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.now().isoformat(),
        "primary_holder": primary_name,
        "spouse": spouse_name,
        "total_estate_value": total_assets,
        "assets": assets,
        "beneficiaries": beneficiaries,
        "distributions": distributions,
        "special_bequests": special_bequests or [],
        "executor": executor or "To be appointed",
        "guardians": guardians or [],
        "recommendations": recommendations,
        "document_checklist": [
            {"document": "Will", "status": "Review recommended", "last_updated": "2024-06-15"},
            {"document": "Enduring Power of Attorney (Financial)", "status": "In place", "last_updated": "2024-06-15"},
            {"document": "Enduring Power of Attorney (Medical)", "status": "Review recommended", "last_updated": "2024-06-15"},
            {"document": "Super Binding Nomination", "status": "Update required", "last_updated": "2022-03-10"},
            {"document": "Family Trust Deed", "status": "In place", "last_updated": "2020-01-15"}
        ]
    }


def calculate_trust_distribution(
    trust_income: float,
    beneficiaries: List[Dict]
) -> Dict[str, Any]:
    """
    Calculate optimal trust distribution among beneficiaries.
    """
    
    distributions = []
    remaining_income = trust_income
    
    for beneficiary in beneficiaries:
        # Calculate tax-effective distribution based on beneficiary's tax position
        tax_free_threshold = beneficiary.get("tax_free_threshold", 18200)
        marginal_rate = beneficiary.get("marginal_rate", 0.19)
        
        # Simplified optimal distribution
        optimal_distribution = min(
            remaining_income * (beneficiary.get("percentage", 25) / 100),
            remaining_income
        )
        
        tax_on_distribution = max(0, optimal_distribution - tax_free_threshold) * marginal_rate
        
        distributions.append({
            "beneficiary": beneficiary["name"],
            "distribution": optimal_distribution,
            "tax_payable": tax_on_distribution,
            "net_after_tax": optimal_distribution - tax_on_distribution,
            "effective_tax_rate": (tax_on_distribution / optimal_distribution * 100) if optimal_distribution > 0 else 0
        })
        
        remaining_income -= optimal_distribution
    
    total_distributed = sum(d["distribution"] for d in distributions)
    total_tax = sum(d["tax_payable"] for d in distributions)
    
    return {
        "trust_income": trust_income,
        "total_distributed": total_distributed,
        "total_tax_payable": total_tax,
        "average_effective_rate": (total_tax / total_distributed * 100) if total_distributed > 0 else 0,
        "distributions": distributions,
        "recommendation": "Consider distributing more to lower-income beneficiaries to minimize overall tax"
    }
