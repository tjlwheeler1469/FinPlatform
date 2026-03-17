"""
Tax Optimization Engine
Advanced tax planning and optimization across multiple strategies.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tax-optimization", tags=["Tax Optimization"])

# Australian tax rates 2024-25
TAX_BRACKETS = [
    {"min": 0, "max": 18200, "rate": 0, "base": 0},
    {"min": 18201, "max": 45000, "rate": 0.19, "base": 0},
    {"min": 45001, "max": 120000, "rate": 0.325, "base": 5092},
    {"min": 120001, "max": 180000, "rate": 0.37, "base": 29467},
    {"min": 180001, "max": float('inf'), "rate": 0.45, "base": 51667}
]

SUPER_CONCESSIONAL_CAP = 30000  # 2024-25
SUPER_NON_CONCESSIONAL_CAP = 120000
SUPER_TAX_RATE = 0.15
MEDICARE_LEVY = 0.02
CGT_DISCOUNT = 0.50  # 50% discount for assets held > 12 months

# Sample client tax data
CLIENT_TAX_DATA = {
    "client_1": {
        "name": "Wheeler Family",
        "tax_year": "2024-25",
        "individuals": [
            {
                "name": "James Wheeler",
                "taxable_income": 280000,
                "salary_sacrifice_ytd": 15000,
                "super_balance": 580000,
                "concessional_contrib_ytd": 15000,
                "non_concessional_contrib_ytd": 0,
                "dividend_income": 8500,
                "franking_credits": 3640,
                "rental_income": 15000,
                "rental_deductions": 22000,
                "unrealized_gains": {
                    "CBA": {"cost": 19700, "value": 23700, "held_months": 36},
                    "BHP": {"cost": 13560, "value": 12840, "held_months": 24},
                    "CSL": {"cost": 14250, "value": 14900, "held_months": 18}
                },
                "unrealized_losses": {
                    "BHP": {"cost": 13560, "value": 12840, "loss": 720}
                }
            },
            {
                "name": "Sarah Wheeler",
                "taxable_income": 175000,
                "salary_sacrifice_ytd": 10000,
                "super_balance": 320000,
                "concessional_contrib_ytd": 10000,
                "non_concessional_contrib_ytd": 0,
                "dividend_income": 3500,
                "franking_credits": 1500,
                "unrealized_gains": {},
                "unrealized_losses": {}
            }
        ],
        "entities": [
            {
                "type": "family_trust",
                "name": "Wheeler Family Trust",
                "income": 65000,
                "distributions": [
                    {"to": "James Wheeler", "amount": 32500},
                    {"to": "Sarah Wheeler", "amount": 32500}
                ]
            },
            {
                "type": "company",
                "name": "Wheeler Consulting Pty Ltd",
                "revenue": 680000,
                "expenses": 460000,
                "profit": 220000,
                "tax_paid": 55000,
                "franking_account": 55000,
                "retained_earnings": 165000
            }
        ]
    },
    "client_2": {
        "name": "Chen Investment Trust",
        "tax_year": "2024-25",
        "individuals": [
            {
                "name": "Michael Chen",
                "taxable_income": 420000,
                "salary_sacrifice_ytd": 27500,
                "super_balance": 1200000,
                "concessional_contrib_ytd": 27500,
                "non_concessional_contrib_ytd": 50000,
                "dividend_income": 25000,
                "franking_credits": 10700,
                "unrealized_gains": {
                    "NVDA": {"cost": 45000, "value": 135000, "held_months": 30},
                    "MSFT": {"cost": 52000, "value": 84000, "held_months": 48},
                    "META": {"cost": 45000, "value": 99000, "held_months": 24}
                },
                "unrealized_losses": {
                    "TSLA": {"cost": 85000, "value": 52000, "loss": 33000}
                }
            }
        ],
        "entities": []
    }
}


def calculate_tax(taxable_income: float) -> Dict:
    """Calculate tax payable for given taxable income."""
    tax = 0
    bracket_used = None
    
    for bracket in TAX_BRACKETS:
        if bracket["min"] <= taxable_income <= bracket["max"] or bracket["max"] == float('inf'):
            tax = bracket["base"] + bracket["rate"] * (taxable_income - bracket["min"] + 1)
            bracket_used = bracket
            break
    
    medicare = taxable_income * MEDICARE_LEVY
    total_tax = tax + medicare
    
    return {
        "taxable_income": taxable_income,
        "income_tax": round(tax, 2),
        "medicare_levy": round(medicare, 2),
        "total_tax": round(total_tax, 2),
        "marginal_rate": bracket_used["rate"] * 100 if bracket_used else 0,
        "effective_rate": round(total_tax / taxable_income * 100, 2) if taxable_income > 0 else 0
    }


def calculate_super_contribution_benefit(individual: Dict) -> Dict:
    """Calculate potential benefit from additional super contributions."""
    current_contrib = individual.get("concessional_contrib_ytd", 0)
    remaining_cap = max(0, SUPER_CONCESSIONAL_CAP - current_contrib)
    marginal_rate = 0.45 if individual.get("taxable_income", 0) > 180000 else 0.37
    
    # Tax saved by contributing to super (taxed at 15% vs marginal rate)
    tax_saving = remaining_cap * (marginal_rate - SUPER_TAX_RATE)
    
    return {
        "current_contributions": current_contrib,
        "remaining_cap": remaining_cap,
        "max_additional_contribution": remaining_cap,
        "tax_saving_if_maxed": round(tax_saving, 2),
        "recommendation": f"Contribute additional ${remaining_cap:,.0f} to save ${tax_saving:,.0f} in tax" if remaining_cap > 0 else "Concessional cap reached"
    }


def calculate_tax_loss_harvest(individual: Dict) -> Dict:
    """Calculate tax-loss harvesting opportunities."""
    losses = individual.get("unrealized_losses", {})
    gains = individual.get("unrealized_gains", {})
    
    total_losses = sum(l.get("loss", 0) for l in losses.values())
    total_gains = sum(
        (g.get("value", 0) - g.get("cost", 0)) * (1 - CGT_DISCOUNT if g.get("held_months", 0) > 12 else 1)
        for g in gains.values()
    )
    
    marginal_rate = 0.45 if individual.get("taxable_income", 0) > 180000 else 0.37
    
    # Potential tax savings from harvesting losses
    harvestable = []
    for symbol, data in losses.items():
        loss = data.get("loss", 0)
        if loss > 0:
            tax_saving = loss * marginal_rate
            harvestable.append({
                "symbol": symbol,
                "loss": loss,
                "tax_saving": round(tax_saving, 2)
            })
    
    return {
        "total_unrealized_losses": total_losses,
        "total_unrealized_gains": round(total_gains, 2),
        "net_position": round(total_gains - total_losses, 2),
        "harvestable_positions": harvestable,
        "total_potential_tax_saving": round(total_losses * marginal_rate, 2),
        "recommendation": f"Harvest ${total_losses:,.0f} in losses to save ${total_losses * marginal_rate:,.0f}" if total_losses > 1000 else "No significant harvesting opportunities"
    }


def calculate_dividend_imputation_benefit(individual: Dict) -> Dict:
    """Calculate benefit from franking credits."""
    dividend_income = individual.get("dividend_income", 0)
    franking_credits = individual.get("franking_credits", 0)
    
    # Grossed up dividend
    grossed_up = dividend_income + franking_credits
    
    # Tax on grossed up dividend at marginal rate
    marginal_rate = 0.45 if individual.get("taxable_income", 0) > 180000 else 0.37
    tax_on_dividend = grossed_up * marginal_rate
    
    # Franking credit offset
    net_tax = tax_on_dividend - franking_credits
    
    return {
        "cash_dividend": dividend_income,
        "franking_credits": franking_credits,
        "grossed_up_dividend": grossed_up,
        "tax_before_credits": round(tax_on_dividend, 2),
        "net_tax_payable": round(max(0, net_tax), 2),
        "franking_credit_refund": round(abs(net_tax), 2) if net_tax < 0 else 0,
        "effective_dividend_rate": round(max(0, net_tax) / dividend_income * 100, 2) if dividend_income > 0 else 0
    }


def calculate_negative_gearing_benefit(individual: Dict) -> Dict:
    """Calculate negative gearing tax benefit."""
    rental_income = individual.get("rental_income", 0)
    rental_deductions = individual.get("rental_deductions", 0)
    
    net_rental = rental_income - rental_deductions
    marginal_rate = 0.45 if individual.get("taxable_income", 0) > 180000 else 0.37
    
    if net_rental < 0:
        tax_benefit = abs(net_rental) * marginal_rate
        return {
            "rental_income": rental_income,
            "deductions": rental_deductions,
            "net_rental_loss": abs(net_rental),
            "tax_benefit": round(tax_benefit, 2),
            "recommendation": f"Rental loss of ${abs(net_rental):,.0f} reduces tax by ${tax_benefit:,.0f}"
        }
    else:
        return {
            "rental_income": rental_income,
            "deductions": rental_deductions,
            "net_rental_profit": net_rental,
            "additional_tax": round(net_rental * marginal_rate, 2),
            "recommendation": "Property is positively geared - consider depreciation review"
        }


@router.get("/client/{client_id}/analysis")
async def get_tax_analysis(client_id: str):
    """Get comprehensive tax analysis for a client."""
    if client_id not in CLIENT_TAX_DATA:
        raise HTTPException(status_code=404, detail="Client tax data not found")
    
    client = CLIENT_TAX_DATA[client_id]
    analysis = {
        "client_id": client_id,
        "client_name": client.get("name"),
        "tax_year": client.get("tax_year"),
        "individuals": [],
        "entities": client.get("entities", []),
        "total_potential_savings": 0,
        "recommendations": []
    }
    
    for individual in client.get("individuals", []):
        tax_calc = calculate_tax(individual.get("taxable_income", 0))
        super_benefit = calculate_super_contribution_benefit(individual)
        harvest = calculate_tax_loss_harvest(individual)
        dividends = calculate_dividend_imputation_benefit(individual)
        
        negative_gearing = None
        if individual.get("rental_income"):
            negative_gearing = calculate_negative_gearing_benefit(individual)
        
        individual_analysis = {
            "name": individual.get("name"),
            "current_tax": tax_calc,
            "super_optimization": super_benefit,
            "tax_loss_harvesting": harvest,
            "dividend_imputation": dividends,
            "negative_gearing": negative_gearing
        }
        
        # Calculate total potential savings
        savings = (
            super_benefit.get("tax_saving_if_maxed", 0) +
            harvest.get("total_potential_tax_saving", 0)
        )
        analysis["total_potential_savings"] += savings
        
        # Generate recommendations
        if super_benefit.get("remaining_cap", 0) > 5000:
            analysis["recommendations"].append({
                "type": "super_contribution",
                "individual": individual.get("name"),
                "action": super_benefit.get("recommendation"),
                "saving": super_benefit.get("tax_saving_if_maxed", 0),
                "priority": "high"
            })
        
        if harvest.get("total_potential_tax_saving", 0) > 1000:
            analysis["recommendations"].append({
                "type": "tax_loss_harvest",
                "individual": individual.get("name"),
                "action": harvest.get("recommendation"),
                "saving": harvest.get("total_potential_tax_saving", 0),
                "priority": "high"
            })
        
        analysis["individuals"].append(individual_analysis)
    
    analysis["total_potential_savings"] = round(analysis["total_potential_savings"], 2)
    
    return analysis


@router.get("/client/{client_id}/strategies")
async def get_tax_strategies(client_id: str):
    """Get recommended tax strategies for a client."""
    if client_id not in CLIENT_TAX_DATA:
        raise HTTPException(status_code=404, detail="Client tax data not found")
    
    client = CLIENT_TAX_DATA[client_id]
    strategies = []
    
    for individual in client.get("individuals", []):
        income = individual.get("taxable_income", 0)
        
        # Strategy 1: Salary Sacrifice
        if income > 120000:
            remaining_cap = SUPER_CONCESSIONAL_CAP - individual.get("concessional_contrib_ytd", 0)
            if remaining_cap > 0:
                strategies.append({
                    "strategy": "Salary Sacrifice to Super",
                    "individual": individual.get("name"),
                    "description": f"Redirect ${remaining_cap:,.0f} of pre-tax salary to superannuation",
                    "tax_saving": round(remaining_cap * 0.30, 2),  # Difference between marginal and super rate
                    "implementation": "Contact payroll to set up salary sacrifice arrangement",
                    "timing": "Before June 30"
                })
        
        # Strategy 2: Tax-Loss Harvesting
        losses = individual.get("unrealized_losses", {})
        if losses:
            total_loss = sum(l.get("loss", 0) for l in losses.values())
            if total_loss > 1000:
                strategies.append({
                    "strategy": "Tax-Loss Harvesting",
                    "individual": individual.get("name"),
                    "description": f"Sell underperforming positions to realize ${total_loss:,.0f} in losses",
                    "tax_saving": round(total_loss * 0.39, 2),
                    "implementation": "Execute sell orders for loss-making positions",
                    "timing": "Before June 30 for current FY benefit"
                })
        
        # Strategy 3: Spouse Contribution
        if income > 200000 and len(client.get("individuals", [])) > 1:
            strategies.append({
                "strategy": "Spouse Super Contribution",
                "individual": individual.get("name"),
                "description": "Make spouse contribution up to $3,000 for tax offset",
                "tax_saving": 540,
                "implementation": "Make contribution to spouse's super fund",
                "timing": "Before June 30"
            })
    
    # Entity strategies
    for entity in client.get("entities", []):
        if entity.get("type") == "company":
            if entity.get("retained_earnings", 0) > 100000:
                strategies.append({
                    "strategy": "Dividend Distribution Planning",
                    "entity": entity.get("name"),
                    "description": "Consider timing of franked dividends to optimize tax",
                    "tax_saving": "Variable based on shareholder marginal rates",
                    "implementation": "Review dividend policy with accountant",
                    "timing": "Quarterly review"
                })
    
    return {
        "client_id": client_id,
        "strategies": strategies,
        "total_strategies": len(strategies),
        "estimated_total_savings": sum(s.get("tax_saving", 0) for s in strategies if isinstance(s.get("tax_saving"), (int, float))),
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/client/{client_id}/eofy-checklist")
async def get_eofy_checklist(client_id: str):
    """Get end of financial year tax checklist."""
    if client_id not in CLIENT_TAX_DATA:
        raise HTTPException(status_code=404, detail="Client tax data not found")
    
    client = CLIENT_TAX_DATA[client_id]
    checklist = []
    
    for individual in client.get("individuals", []):
        # Super contributions
        contr = individual.get("concessional_contrib_ytd", 0)
        if contr < SUPER_CONCESSIONAL_CAP:
            checklist.append({
                "item": "Maximize Super Contributions",
                "individual": individual.get("name"),
                "status": "incomplete",
                "action": f"Contribute additional ${SUPER_CONCESSIONAL_CAP - contr:,.0f}",
                "deadline": "June 30",
                "priority": "high"
            })
        
        # Tax-loss harvesting
        if individual.get("unrealized_losses"):
            checklist.append({
                "item": "Review Tax-Loss Harvesting",
                "individual": individual.get("name"),
                "status": "review_required",
                "action": "Assess loss-making positions for potential sale",
                "deadline": "June 25 (allow settlement time)",
                "priority": "high"
            })
        
        # Prepay deductible expenses
        checklist.append({
            "item": "Prepay Deductible Expenses",
            "individual": individual.get("name"),
            "status": "review_required",
            "action": "Consider prepaying insurance, subscriptions, interest",
            "deadline": "June 30",
            "priority": "medium"
        })
    
    # Entity checklist items
    for entity in client.get("entities", []):
        if entity.get("type") == "family_trust":
            checklist.append({
                "item": "Trust Distribution Resolution",
                "entity": entity.get("name"),
                "status": "required",
                "action": "Ensure distribution resolution is documented",
                "deadline": "June 30",
                "priority": "critical"
            })
        
        if entity.get("type") == "company":
            checklist.append({
                "item": "Review Retained Earnings",
                "entity": entity.get("name"),
                "status": "review_required",
                "action": "Consider dividend declaration timing",
                "deadline": "June 30",
                "priority": "medium"
            })
    
    return {
        "client_id": client_id,
        "client_name": client.get("name"),
        "tax_year": client.get("tax_year"),
        "days_until_eofy": max(0, (datetime(2025, 6, 30) - datetime.now()).days),
        "checklist": checklist,
        "total_items": len(checklist),
        "critical_items": len([c for c in checklist if c.get("priority") == "critical"]),
        "high_priority_items": len([c for c in checklist if c.get("priority") == "high"])
    }


@router.post("/calculate-tax")
async def calculate_tax_endpoint(taxable_income: float):
    """Calculate tax for a given taxable income."""
    return calculate_tax(taxable_income)


@router.get("/tax-rates")
async def get_tax_rates():
    """Get current Australian tax rates."""
    return {
        "tax_year": "2024-25",
        "brackets": TAX_BRACKETS,
        "medicare_levy": MEDICARE_LEVY,
        "super_concessional_cap": SUPER_CONCESSIONAL_CAP,
        "super_non_concessional_cap": SUPER_NON_CONCESSIONAL_CAP,
        "super_tax_rate": SUPER_TAX_RATE,
        "cgt_discount": CGT_DISCOUNT
    }
