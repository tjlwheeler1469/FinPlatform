from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import numpy as np
import pandas as pd
from io import BytesIO, StringIO
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Australian Investment Analyzer")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionRequest(BaseModel):
    session_id: str

# Investment Input Models
class PropertyInput(BaseModel):
    property_id: str = Field(default_factory=lambda: f"prop_{uuid.uuid4().hex[:8]}")
    name: str
    value: float
    rental_income: float = 0
    mortgage_amount: float = 0
    mortgage_rate: float = 0  # Annual interest rate %
    mortgage_term_years: int = 30
    annual_expenses: float = 0  # Rates, maintenance, insurance
    depreciation_building: float = 0
    depreciation_fixtures: float = 0

class InvestmentInput(BaseModel):
    cash_savings: float = 0
    term_deposit_amount: float = 0
    term_deposit_rate: float = 0  # %
    shares_value: float = 0
    shares_dividend_yield: float = 0  # %
    franking_percentage: float = 100  # % of dividends that are franked
    bonds_value: float = 0
    bonds_yield: float = 0  # %
    etf_value: float = 0
    etf_yield: float = 0
    smsf_balance: float = 0
    properties: List[PropertyInput] = []

class ExpenseInput(BaseModel):
    school_fees: float = 0
    childcare: float = 0
    health_insurance: float = 0
    private_expenses: float = 0  # Non-deductible
    work_related: float = 0  # Deductible
    other_deductible: float = 0

class ScenarioInput(BaseModel):
    scenario_id: str = Field(default_factory=lambda: f"scen_{uuid.uuid4().hex[:12]}")
    name: str
    entity_type: str = "personal"  # personal or company
    taxable_income: float = 0
    investments: InvestmentInput = InvestmentInput()
    expenses: ExpenseInput = ExpenseInput()
    simulation_years: int = 10
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScenarioCreate(BaseModel):
    name: str
    entity_type: str = "personal"
    taxable_income: float = 0
    investments: InvestmentInput = InvestmentInput()
    expenses: ExpenseInput = ExpenseInput()
    simulation_years: int = 10

# ==================== AUSTRALIAN TAX RATES - HISTORICAL ====================

# Historical Personal Tax Brackets
HISTORICAL_TAX_BRACKETS = {
    "2024-25": {
        "brackets": [
            (18200, 0),
            (45000, 0.16),
            (135000, 0.30),
            (190000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 24276,
        "description": "Stage 3 tax cuts - reduced rates"
    },
    "2023-24": {
        "brackets": [
            (18200, 0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 23365,
        "description": "Pre-Stage 3 rates"
    },
    "2022-23": {
        "brackets": [
            (18200, 0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 22801,
        "description": "LMITO ended"
    },
    "2021-22": {
        "brackets": [
            (18200, 0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 22801,
        "description": "With LMITO offset"
    },
    "2020-21": {
        "brackets": [
            (18200, 0),
            (45000, 0.19),
            (120000, 0.325),
            (180000, 0.37),
            (float('inf'), 0.45)
        ],
        "medicare_threshold": 22801,
        "description": "COVID response"
    }
}

PERSONAL_TAX_BRACKETS_2024_25 = HISTORICAL_TAX_BRACKETS["2024-25"]["brackets"]
PERSONAL_TAX_BRACKETS_2025_26 = HISTORICAL_TAX_BRACKETS["2024-25"]["brackets"]

# Company Tax Rates - Historical
HISTORICAL_COMPANY_RATES = {
    "2024-25": {"base": 0.25, "full": 0.30},
    "2023-24": {"base": 0.25, "full": 0.30},
    "2022-23": {"base": 0.25, "full": 0.30},
    "2021-22": {"base": 0.25, "full": 0.30},
    "2020-21": {"base": 0.26, "full": 0.30}
}

COMPANY_TAX_RATE_BASE = 0.25  # Base rate entities (aggregated turnover < $50m)
COMPANY_TAX_RATE_FULL = 0.30  # Full rate

MEDICARE_LEVY_RATE = 0.02
MEDICARE_LEVY_THRESHOLD = 24276  # Singles threshold 2024-25

# CGT Discount Rate
CGT_DISCOUNT_INDIVIDUAL = 0.50  # 50% discount for assets held > 12 months
CGT_DISCOUNT_SMSF = 0.333  # 33.33% discount for SMSF

# SMSF Contribution Caps 2024-25
SMSF_CONCESSIONAL_CAP = 30000  # Pre-tax contributions cap
SMSF_NON_CONCESSIONAL_CAP = 120000  # After-tax contributions cap
SMSF_BRING_FORWARD_CAP = 360000  # 3-year bring forward rule
SMSF_TOTAL_SUPER_BALANCE_LIMIT = 1900000  # TSB limit for non-concessional
SMSF_TAX_RATE = 0.15  # Tax rate on contributions and earnings
SMSF_PENSION_TAX_RATE = 0.0  # Tax-free in pension phase
DIV_293_THRESHOLD = 250000  # Division 293 threshold

# ==================== TAX CALCULATION FUNCTIONS ====================

def calculate_personal_income_tax(taxable_income: float, year: str = "2024-25") -> Dict[str, float]:
    """Calculate Australian personal income tax"""
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

def calculate_company_tax(taxable_income: float, is_base_rate_entity: bool = True) -> Dict[str, float]:
    """Calculate Australian company tax"""
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
    """Calculate Australian personal income tax for any historical year"""
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
    """Calculate Australian Capital Gains Tax"""
    
    # Cost base = purchase price + improvements + selling costs
    cost_base = purchase_price + improvement_costs + selling_costs
    
    # Capital gain/loss
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
    
    # Check for CGT discount eligibility (held > 12 months)
    discount_eligible = holding_period_months >= 12
    
    if entity_type == "individual":
        discount = CGT_DISCOUNT_INDIVIDUAL if discount_eligible else 0
    elif entity_type == "smsf":
        discount = CGT_DISCOUNT_SMSF if discount_eligible else 0
    else:  # company - no discount
        discount = 0
    
    # Apply discount
    taxable_gain = capital_gain * (1 - discount)
    
    # CGT payable at marginal rate
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
    """Calculate SMSF contribution strategy and tax benefits"""
    
    # Calculate total concessional contributions
    total_concessional = employer_contribution + salary_sacrifice + personal_contribution
    
    # Check caps
    concessional_cap_exceeded = total_concessional > SMSF_CONCESSIONAL_CAP
    excess_concessional = max(0, total_concessional - SMSF_CONCESSIONAL_CAP)
    
    # Non-concessional eligibility based on TSB
    can_make_non_concessional = current_super_balance < SMSF_TOTAL_SUPER_BALANCE_LIMIT
    
    # Bring forward rule (under 75)
    bring_forward_available = age < 75 and current_super_balance < (SMSF_TOTAL_SUPER_BALANCE_LIMIT - SMSF_NON_CONCESSIONAL_CAP)
    
    # Tax savings from salary sacrifice
    # Compare tax on income vs 15% super tax
    marginal_rate = 0
    for threshold, rate in PERSONAL_TAX_BRACKETS_2024_25:
        if taxable_income <= threshold:
            marginal_rate = rate
            break
    if marginal_rate == 0 and taxable_income > 190000:
        marginal_rate = 0.45
    
    # Tax saved = (marginal rate - super tax rate) * salary sacrifice
    tax_saved_salary_sacrifice = (marginal_rate - SMSF_TAX_RATE) * min(salary_sacrifice, SMSF_CONCESSIONAL_CAP - employer_contribution)
    
    # Division 293 additional tax
    div_293_applicable = (taxable_income + total_concessional) > DIV_293_THRESHOLD
    div_293_tax = 0
    if div_293_applicable:
        div_293_income = min(total_concessional, (taxable_income + total_concessional) - DIV_293_THRESHOLD)
        div_293_tax = div_293_income * 0.15  # Additional 15%
    
    # Spouse contribution tax offset
    spouse_tax_offset = 0
    if spouse_contribution > 0:
        # Max $540 offset for $3000 contribution if spouse earns < $37,000
        spouse_tax_offset = min(540, spouse_contribution * 0.18)
    
    # Remaining cap space
    remaining_concessional_cap = max(0, SMSF_CONCESSIONAL_CAP - total_concessional)
    
    # Projected balance growth (15 years to retirement assumption)
    years_to_retirement = max(0, 67 - age)
    projected_balance = current_super_balance
    annual_contribution = total_concessional + spouse_contribution
    growth_rate = 0.07  # 7% average return
    
    for _ in range(years_to_retirement):
        projected_balance = projected_balance * (1 + growth_rate) + annual_contribution
    
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
        "recommendations": generate_smsf_recommendations(
            age, current_super_balance, total_concessional, 
            remaining_concessional_cap, marginal_rate, div_293_applicable
        )
    }

def generate_smsf_recommendations(
    age: int, 
    balance: float, 
    total_concessional: float,
    remaining_cap: float,
    marginal_rate: float,
    div_293: bool
) -> List[str]:
    """Generate SMSF contribution recommendations"""
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

def generate_pdf_report_data(scenario_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Generate structured data for PDF report"""
    return {
        "report_title": f"Investment Analysis Report - {scenario_analysis.get('scenario_name', 'Unnamed')}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sections": [
            {
                "title": "Executive Summary",
                "data": scenario_analysis.get("summary", {})
            },
            {
                "title": "Income Breakdown",
                "data": scenario_analysis.get("income_breakdown", {})
            },
            {
                "title": "Tax Analysis",
                "data": scenario_analysis.get("tax_analysis", {})
            },
            {
                "title": "Property Portfolio",
                "data": scenario_analysis.get("property_analyses", [])
            },
            {
                "title": "Debt & Equity Analysis",
                "data": scenario_analysis.get("debt_equity_analysis", {})
            },
            {
                "title": "Investment Projections",
                "data": scenario_analysis.get("monte_carlo_projection", {})
            }
        ]
    }

# ==================== SALARY PACKAGING CALCULATOR ====================

# FBT Rates and Thresholds 2024-25
FBT_RATE = 0.47  # FBT rate
FBT_GROSS_UP_RATE_TYPE_1 = 2.0802  # GST claimable
FBT_GROSS_UP_RATE_TYPE_2 = 1.8868  # No GST

# Common salary packaging items
PACKAGING_ITEMS = {
    "novated_lease": {"fbt_exempt": False, "gst_claimable": True, "description": "Novated car lease"},
    "laptop": {"fbt_exempt": True, "gst_claimable": True, "description": "Portable electronic devices (one per FBT year)"},
    "super_contribution": {"fbt_exempt": True, "gst_claimable": False, "description": "Additional super contributions"},
    "work_related_items": {"fbt_exempt": True, "gst_claimable": True, "description": "Work-related equipment"},
    "meal_entertainment": {"fbt_exempt": False, "gst_claimable": True, "description": "Meal entertainment"},
    "living_away_allowance": {"fbt_exempt": False, "gst_claimable": False, "description": "Living away from home"},
    "car_parking": {"fbt_exempt": False, "gst_claimable": False, "description": "Car parking"},
    "health_insurance": {"fbt_exempt": False, "gst_claimable": False, "description": "Private health insurance"},
}

# Not-for-profit exemption caps
NFP_CAP_HOSPITALS = 17000  # Public hospitals, ambulance services
NFP_CAP_CHARITIES = 31177  # Public benevolent institutions

def calculate_salary_packaging(
    gross_salary: float,
    packaging_items: List[Dict[str, Any]],
    is_nfp_employee: bool = False,
    nfp_cap: float = 0,
    marginal_tax_rate: float = 0.30
) -> Dict[str, Any]:
    """Calculate salary packaging benefits and FBT implications"""
    
    total_packaged = 0
    total_fbt_exempt = 0
    total_fbt_liable = 0
    fbt_payable = 0
    items_analysis = []
    
    for item in packaging_items:
        item_type = item.get("type", "other")
        amount = item.get("amount", 0)
        item_config = PACKAGING_ITEMS.get(item_type, {"fbt_exempt": False, "gst_claimable": False})
        
        is_exempt = item_config.get("fbt_exempt", False)
        gst_claimable = item_config.get("gst_claimable", False)
        
        # For NFP employees, certain benefits are capped and exempt
        if is_nfp_employee and nfp_cap > 0:
            exempt_amount = min(amount, max(0, nfp_cap - total_fbt_exempt))
            liable_amount = amount - exempt_amount
            total_fbt_exempt += exempt_amount
        elif is_exempt:
            exempt_amount = amount
            liable_amount = 0
            total_fbt_exempt += amount
        else:
            exempt_amount = 0
            liable_amount = amount
        
        # Calculate FBT for liable amount
        if liable_amount > 0:
            gross_up_rate = FBT_GROSS_UP_RATE_TYPE_1 if gst_claimable else FBT_GROSS_UP_RATE_TYPE_2
            taxable_value = liable_amount * gross_up_rate
            fbt_on_item = taxable_value * FBT_RATE
            fbt_payable += fbt_on_item
            total_fbt_liable += liable_amount
        else:
            fbt_on_item = 0
        
        total_packaged += amount
        
        items_analysis.append({
            "type": item_type,
            "description": item_config.get("description", item_type),
            "amount": amount,
            "fbt_exempt_amount": exempt_amount,
            "fbt_liable_amount": liable_amount,
            "fbt_payable": fbt_on_item,
            "is_fbt_exempt": is_exempt or (is_nfp_employee and exempt_amount > 0)
        })
    
    # Calculate tax savings
    # Pre-tax salary packaging reduces taxable income
    tax_on_full_salary = calculate_personal_income_tax(gross_salary)["total_tax"]
    reduced_taxable = gross_salary - total_fbt_exempt  # Only exempt items reduce taxable income
    tax_on_reduced = calculate_personal_income_tax(reduced_taxable)["total_tax"]
    income_tax_saved = tax_on_full_salary - tax_on_reduced
    
    # Net benefit = tax saved - FBT paid (by employer, but often passed to employee)
    net_benefit = income_tax_saved - fbt_payable
    
    # Effective value of packaging
    effective_value = total_packaged + net_benefit
    
    return {
        "gross_salary": gross_salary,
        "total_packaged_amount": total_packaged,
        "total_fbt_exempt": total_fbt_exempt,
        "total_fbt_liable": total_fbt_liable,
        "fbt_payable": fbt_payable,
        "income_tax_saved": income_tax_saved,
        "net_benefit": net_benefit,
        "effective_value": effective_value,
        "items_analysis": items_analysis,
        "is_nfp_employee": is_nfp_employee,
        "nfp_cap_used": total_fbt_exempt if is_nfp_employee else 0,
        "nfp_cap_remaining": max(0, nfp_cap - total_fbt_exempt) if is_nfp_employee else 0,
        "recommendations": generate_packaging_recommendations(
            gross_salary, total_packaged, total_fbt_exempt, 
            is_nfp_employee, nfp_cap, marginal_tax_rate
        )
    }

def generate_packaging_recommendations(
    salary: float,
    packaged: float,
    exempt: float,
    is_nfp: bool,
    nfp_cap: float,
    marginal_rate: float
) -> List[str]:
    """Generate salary packaging recommendations"""
    recommendations = []
    
    if is_nfp and nfp_cap > exempt:
        remaining = nfp_cap - exempt
        potential_saving = remaining * marginal_rate
        recommendations.append(
            f"You have ${remaining:,.0f} NFP cap remaining. Using this could save ~${potential_saving:,.0f} in tax."
        )
    
    if marginal_rate >= 0.37:
        recommendations.append(
            "High income earner - consider maximizing super contributions before other packaging."
        )
    
    if packaged < salary * 0.1:
        recommendations.append(
            "Consider packaging work-related items like laptops (FBT exempt) to increase tax benefits."
        )
    
    recommendations.append(
        "Review novated lease options for your next vehicle - can provide significant tax savings."
    )
    
    if not recommendations:
        recommendations.append("Current packaging strategy is well optimized.")
    
    return recommendations

# ==================== PROPERTY COMPARISON CALCULATOR ====================

def compare_investment_properties(
    properties: List[Dict[str, Any]],
    marginal_tax_rate: float = 0.30,
    investment_horizon_years: int = 10,
    expected_capital_growth: float = 0.04
) -> Dict[str, Any]:
    """Compare multiple investment properties side by side"""
    
    comparisons = []
    
    for prop in properties:
        # Basic property metrics
        value = prop.get("value", 0)
        rental_income = prop.get("rental_income", 0)
        mortgage_amount = prop.get("mortgage_amount", 0)
        mortgage_rate = prop.get("mortgage_rate", 0) / 100
        annual_expenses = prop.get("annual_expenses", 0)
        depreciation = prop.get("depreciation_building", 0) + prop.get("depreciation_fixtures", 0)
        
        # Calculate yields
        gross_yield = (rental_income / value * 100) if value > 0 else 0
        
        # Annual costs
        annual_interest = mortgage_amount * mortgage_rate
        total_costs = annual_interest + annual_expenses
        
        # Net rental income
        net_rental = rental_income - total_costs
        net_yield = (net_rental / value * 100) if value > 0 else 0
        
        # Cash flow analysis
        is_negatively_geared = (rental_income - total_costs - depreciation) < 0
        
        # Tax deductions
        total_deductions = annual_interest + annual_expenses + depreciation
        tax_benefit = 0
        if rental_income < total_deductions:
            tax_benefit = (total_deductions - rental_income) * marginal_tax_rate
        
        # After-tax cash flow
        cash_flow_before_tax = rental_income - annual_interest - annual_expenses
        cash_flow_after_tax = cash_flow_before_tax + tax_benefit
        
        # Equity position
        equity = value - mortgage_amount
        lvr = (mortgage_amount / value * 100) if value > 0 else 0
        
        # Return on equity (cash on cash)
        deposit_assumed = equity if equity > 0 else value * 0.2
        return_on_equity = (cash_flow_after_tax / deposit_assumed * 100) if deposit_assumed > 0 else 0
        
        # Projected values
        future_value = value * ((1 + expected_capital_growth) ** investment_horizon_years)
        capital_gain = future_value - value
        
        # Total return calculation
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
            },
            "scores": {
                "yield_score": min(100, gross_yield * 15),  # Scale yield to score
                "cash_flow_score": 50 + (cash_flow_after_tax / 1000),  # Centered at 50
                "growth_potential": min(100, expected_capital_growth * 100 * 20),
                "risk_score": 100 - lvr  # Lower LVR = lower risk
            }
        })
    
    # Rank properties
    for metric in ["gross_yield", "return_on_equity", "cash_flow_after_tax"]:
        if metric == "cash_flow_after_tax":
            values = [c["cash_flow"]["cash_flow_after_tax"] for c in comparisons]
        elif metric == "gross_yield":
            values = [c["metrics"]["gross_yield"] for c in comparisons]
        else:
            values = [c["returns"]["return_on_equity"] for c in comparisons]
        
        sorted_indices = sorted(range(len(values)), key=lambda i: values[i], reverse=True)
        for rank, idx in enumerate(sorted_indices):
            if "rankings" not in comparisons[idx]:
                comparisons[idx]["rankings"] = {}
            comparisons[idx]["rankings"][metric] = rank + 1
    
    # Find best property for different strategies
    best_yield = max(comparisons, key=lambda x: x["metrics"]["gross_yield"])
    best_cash_flow = max(comparisons, key=lambda x: x["cash_flow"]["cash_flow_after_tax"])
    best_growth = max(comparisons, key=lambda x: x["returns"]["annualized_return"])
    
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
        "recommendations": {
            "best_for_yield": best_yield["property_name"],
            "best_for_cash_flow": best_cash_flow["property_name"],
            "best_for_growth": best_growth["property_name"]
        },
        "analysis_parameters": {
            "marginal_tax_rate": marginal_tax_rate * 100,
            "investment_horizon": investment_horizon_years,
            "expected_growth_rate": expected_capital_growth * 100
        }
    }

# ==================== SCENARIO COMPARISON ====================

class ScenarioComparisonInput(BaseModel):
    scenarios: List[Dict[str, Any]]
    
def compare_scenarios(scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Compare multiple investment scenarios side by side"""
    
    comparisons = []
    
    for scenario in scenarios:
        name = scenario.get("name", "Unnamed")
        entity_type = scenario.get("entity_type", "personal")
        taxable_income = scenario.get("taxable_income", 0)
        investments = scenario.get("investments", {})
        expenses = scenario.get("expenses", {})
        
        # Calculate totals
        total_liquid = (
            investments.get("cash_savings", 0) +
            investments.get("term_deposit_amount", 0) +
            investments.get("shares_value", 0) +
            investments.get("bonds_value", 0) +
            investments.get("etf_value", 0)
        )
        
        properties = investments.get("properties", [])
        total_property = sum(p.get("value", 0) for p in properties)
        total_mortgage = sum(p.get("mortgage_amount", 0) for p in properties)
        
        total_assets = total_liquid + total_property + investments.get("smsf_balance", 0)
        total_debt = total_mortgage
        net_worth = total_assets - total_debt
        
        # Investment income
        term_deposit_income = investments.get("term_deposit_amount", 0) * investments.get("term_deposit_rate", 0) / 100
        dividend_income = investments.get("shares_value", 0) * investments.get("shares_dividend_yield", 0) / 100
        bond_income = investments.get("bonds_value", 0) * investments.get("bonds_yield", 0) / 100
        etf_income = investments.get("etf_value", 0) * investments.get("etf_yield", 0) / 100
        rental_income = sum(p.get("rental_income", 0) for p in properties)
        
        total_investment_income = term_deposit_income + dividend_income + bond_income + etf_income + rental_income
        
        # Tax calculation
        if entity_type == "personal":
            tax_result = calculate_personal_income_tax(taxable_income + total_investment_income)
            total_tax = tax_result["total_tax"]
            effective_rate = tax_result["effective_rate"]
        else:
            tax_result = calculate_company_tax(taxable_income + total_investment_income)
            total_tax = tax_result["company_tax"]
            effective_rate = tax_result["tax_rate"]
        
        net_income = taxable_income + total_investment_income - total_tax
        
        # Debt metrics
        debt_to_equity = (total_debt / net_worth) if net_worth > 0 else float('inf')
        debt_to_assets = (total_debt / total_assets * 100) if total_assets > 0 else 0
        
        comparisons.append({
            "scenario_name": name,
            "entity_type": entity_type,
            "summary": {
                "total_assets": total_assets,
                "total_debt": total_debt,
                "net_worth": net_worth,
                "debt_to_equity": round(debt_to_equity, 2),
                "debt_to_assets_pct": round(debt_to_assets, 1)
            },
            "income": {
                "employment_income": taxable_income,
                "investment_income": total_investment_income,
                "total_income": taxable_income + total_investment_income
            },
            "tax": {
                "total_tax": total_tax,
                "effective_rate": effective_rate,
                "net_income": net_income
            },
            "allocation": {
                "cash_and_deposits": investments.get("cash_savings", 0) + investments.get("term_deposit_amount", 0),
                "shares": investments.get("shares_value", 0),
                "etfs": investments.get("etf_value", 0),
                "bonds": investments.get("bonds_value", 0),
                "property": total_property,
                "super": investments.get("smsf_balance", 0)
            },
            "properties": {
                "count": len(properties),
                "total_value": total_property,
                "total_mortgage": total_mortgage,
                "total_rental": rental_income
            }
        })
    
    # Calculate differences between scenarios
    if len(comparisons) >= 2:
        base = comparisons[0]
        differences = []
        for comp in comparisons[1:]:
            diff = {
                "compared_to": base["scenario_name"],
                "scenario": comp["scenario_name"],
                "net_worth_diff": comp["summary"]["net_worth"] - base["summary"]["net_worth"],
                "tax_diff": comp["tax"]["total_tax"] - base["tax"]["total_tax"],
                "income_diff": comp["income"]["total_income"] - base["income"]["total_income"],
                "net_income_diff": comp["tax"]["net_income"] - base["tax"]["net_income"]
            }
            differences.append(diff)
    else:
        differences = []
    
    # Find best scenario for each metric
    best_net_worth = max(comparisons, key=lambda x: x["summary"]["net_worth"])
    best_income = max(comparisons, key=lambda x: x["tax"]["net_income"])
    lowest_tax = min(comparisons, key=lambda x: x["tax"]["effective_rate"])
    lowest_risk = min(comparisons, key=lambda x: x["summary"]["debt_to_equity"] if x["summary"]["debt_to_equity"] != float('inf') else 999)
    
    return {
        "comparisons": comparisons,
        "differences": differences,
        "best_for": {
            "net_worth": best_net_worth["scenario_name"],
            "net_income": best_income["scenario_name"],
            "tax_efficiency": lowest_tax["scenario_name"],
            "lowest_risk": lowest_risk["scenario_name"]
        },
        "summary": {
            "scenarios_compared": len(scenarios),
            "highest_net_worth": max(c["summary"]["net_worth"] for c in comparisons),
            "lowest_net_worth": min(c["summary"]["net_worth"] for c in comparisons),
            "net_worth_range": max(c["summary"]["net_worth"] for c in comparisons) - min(c["summary"]["net_worth"] for c in comparisons)
        }
    }

def calculate_franking_credits(dividend: float, franking_percentage: float = 100) -> Dict[str, float]:
    """Calculate franking credits for dividends"""
    franking_rate = COMPANY_TAX_RATE_BASE  # Assume base rate entity
    franked_portion = dividend * (franking_percentage / 100)
    unfranked_portion = dividend - franked_portion
    
    # Franking credit = Franked dividend × (company tax rate / (1 - company tax rate))
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
    """Calculate negative gearing benefits for a property"""
    # Annual interest
    annual_interest = property_data.mortgage_amount * (property_data.mortgage_rate / 100)
    
    # Total deductions
    total_deductions = (
        annual_interest +
        property_data.annual_expenses +
        property_data.depreciation_building +
        property_data.depreciation_fixtures
    )
    
    # Net rental position
    net_rental = property_data.rental_income - total_deductions
    
    # Tax benefit (if negative gearing)
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

def calculate_loan_repayment(principal: float, annual_rate: float, years: int) -> Dict[str, Any]:
    """Calculate loan repayment schedule with variable rate scenarios"""
    monthly_rate = annual_rate / 100 / 12
    n_payments = years * 12
    
    if monthly_rate == 0:
        monthly_payment = principal / n_payments
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate)**n_payments) / ((1 + monthly_rate)**n_payments - 1)
    
    total_repayment = monthly_payment * n_payments
    total_interest = total_repayment - principal
    
    # Variable rate scenarios
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
    """Calculate debt to equity ratio and related metrics"""
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

def run_monte_carlo_simulation(
    initial_value: float,
    expected_return: float,
    volatility: float,
    years: int,
    simulations: int = 1000
) -> Dict[str, Any]:
    """Run Monte Carlo simulation for investment projections"""
    np.random.seed(42)  # For reproducibility
    
    # Generate random returns for each simulation
    results = np.zeros((simulations, years + 1))
    results[:, 0] = initial_value
    
    for year in range(1, years + 1):
        # Generate random annual returns using log-normal distribution
        random_returns = np.random.normal(expected_return, volatility, simulations)
        results[:, year] = results[:, year - 1] * (1 + random_returns)
    
    final_values = results[:, -1]
    
    # Calculate percentiles for each year
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

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> User:
    """Get current authenticated user from session token"""
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/session")
async def create_session(session_req: SessionRequest, response: Response):
    """Exchange session_id for session_token"""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_req.session_id}
            )
            
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            
            data = resp.json()
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data["name"],
                "picture": data.get("picture"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = {
        "session_id": f"sess_{uuid.uuid4().hex[:16]}",
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user"""
    user = await get_current_user(request)
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== SCENARIO ENDPOINTS ====================

@api_router.post("/scenarios", response_model=Dict)
async def create_scenario(scenario: ScenarioCreate, request: Request):
    """Create a new investment scenario"""
    user = await get_current_user(request)
    
    scenario_data = scenario.model_dump()
    scenario_data["scenario_id"] = f"scen_{uuid.uuid4().hex[:12]}"
    scenario_data["user_id"] = user.user_id
    scenario_data["created_at"] = datetime.now(timezone.utc).isoformat()
    scenario_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Convert nested models to dicts
    if "investments" in scenario_data:
        investments = scenario_data["investments"]
        if "properties" in investments:
            investments["properties"] = [p if isinstance(p, dict) else p for p in investments["properties"]]
    
    await db.scenarios.insert_one(scenario_data)
    
    result = await db.scenarios.find_one(
        {"scenario_id": scenario_data["scenario_id"]},
        {"_id": 0}
    )
    return result

@api_router.get("/scenarios", response_model=List[Dict])
async def get_scenarios(request: Request):
    """Get all scenarios for current user"""
    user = await get_current_user(request)
    
    scenarios = await db.scenarios.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    return scenarios

@api_router.get("/scenarios/{scenario_id}", response_model=Dict)
async def get_scenario(scenario_id: str, request: Request):
    """Get a specific scenario"""
    user = await get_current_user(request)
    
    scenario = await db.scenarios.find_one(
        {"scenario_id": scenario_id, "user_id": user.user_id},
        {"_id": 0}
    )
    
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return scenario

@api_router.put("/scenarios/{scenario_id}", response_model=Dict)
async def update_scenario(scenario_id: str, scenario: ScenarioCreate, request: Request):
    """Update a scenario"""
    user = await get_current_user(request)
    
    existing = await db.scenarios.find_one(
        {"scenario_id": scenario_id, "user_id": user.user_id}
    )
    
    if not existing:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    update_data = scenario.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.scenarios.update_one(
        {"scenario_id": scenario_id},
        {"$set": update_data}
    )
    
    result = await db.scenarios.find_one(
        {"scenario_id": scenario_id},
        {"_id": 0}
    )
    return result

@api_router.delete("/scenarios/{scenario_id}")
async def delete_scenario(scenario_id: str, request: Request):
    """Delete a scenario"""
    user = await get_current_user(request)
    
    result = await db.scenarios.delete_one(
        {"scenario_id": scenario_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scenario not found")
    
    return {"message": "Scenario deleted"}

# ==================== ANALYSIS ENDPOINTS ====================

@api_router.post("/analyze/tax")
async def analyze_tax(
    taxable_income: float,
    entity_type: str = "personal",
    is_base_rate_entity: bool = True
):
    """Calculate tax for given income"""
    if entity_type == "personal":
        return calculate_personal_income_tax(taxable_income)
    else:
        return calculate_company_tax(taxable_income, is_base_rate_entity)

@api_router.post("/analyze/franking")
async def analyze_franking(
    dividend: float,
    franking_percentage: float = 100
):
    """Calculate franking credits"""
    return calculate_franking_credits(dividend, franking_percentage)

@api_router.post("/analyze/negative-gearing")
async def analyze_negative_gearing(
    property_data: PropertyInput,
    marginal_tax_rate: float = 0.30
):
    """Calculate negative gearing benefits"""
    return calculate_negative_gearing(property_data, marginal_tax_rate)

@api_router.post("/analyze/loan")
async def analyze_loan(
    principal: float,
    annual_rate: float,
    years: int = 30
):
    """Calculate loan repayment with variable rate scenarios"""
    return calculate_loan_repayment(principal, annual_rate, years)

@api_router.post("/analyze/debt-equity")
async def analyze_debt_equity(
    total_assets: float,
    total_debt: float
):
    """Calculate debt to equity ratio"""
    return calculate_debt_to_equity(total_assets, total_debt)

@api_router.post("/analyze/monte-carlo")
async def analyze_monte_carlo(
    initial_value: float,
    expected_return: float = 0.07,
    volatility: float = 0.15,
    years: int = 10,
    simulations: int = 1000
):
    """Run Monte Carlo simulation"""
    return run_monte_carlo_simulation(
        initial_value,
        expected_return,
        volatility,
        years,
        min(simulations, 5000)  # Cap simulations
    )

@api_router.post("/analyze/full-scenario")
async def analyze_full_scenario(scenario: ScenarioCreate):
    """Comprehensive analysis of an investment scenario"""
    inv = scenario.investments
    exp = scenario.expenses
    
    # Calculate total assets and debt
    total_property_value = sum(p.value for p in inv.properties)
    total_mortgage = sum(p.mortgage_amount for p in inv.properties)
    
    total_assets = (
        inv.cash_savings +
        inv.term_deposit_amount +
        inv.shares_value +
        inv.bonds_value +
        inv.etf_value +
        inv.smsf_balance +
        total_property_value
    )
    
    total_debt = total_mortgage
    
    # Investment income
    term_deposit_income = inv.term_deposit_amount * (inv.term_deposit_rate / 100)
    dividend_income = inv.shares_value * (inv.shares_dividend_yield / 100)
    bond_income = inv.bonds_value * (inv.bonds_yield / 100)
    etf_income = inv.etf_value * (inv.etf_yield / 100)
    
    # Property analysis
    property_analyses = []
    total_rental_income = 0
    total_property_deductions = 0
    
    # Calculate marginal tax rate first
    if scenario.entity_type == "personal":
        tax_result = calculate_personal_income_tax(scenario.taxable_income)
        # Get marginal rate from last bracket
        marginal_rate = 0.30  # Default
        for threshold, rate in PERSONAL_TAX_BRACKETS_2024_25:
            if scenario.taxable_income <= threshold:
                marginal_rate = rate
                break
    else:
        marginal_rate = COMPANY_TAX_RATE_BASE
    
    for prop in inv.properties:
        prop_analysis = calculate_negative_gearing(prop, marginal_rate)
        property_analyses.append(prop_analysis)
        total_rental_income += prop.rental_income
        total_property_deductions += prop_analysis["total_deductions"]
    
    # Franking credits
    franking_result = calculate_franking_credits(dividend_income, inv.franking_percentage)
    
    # Calculate taxable income with all sources
    total_investment_income = (
        term_deposit_income +
        franking_result["grossed_up_dividend"] +
        bond_income +
        etf_income +
        total_rental_income -
        total_property_deductions
    )
    
    total_deductions = (
        exp.work_related +
        exp.other_deductible +
        total_property_deductions
    )
    
    adjusted_taxable_income = scenario.taxable_income + total_investment_income - exp.work_related - exp.other_deductible
    
    # Tax calculation
    if scenario.entity_type == "personal":
        tax_analysis = calculate_personal_income_tax(adjusted_taxable_income)
        # Add franking credit offset
        tax_analysis["franking_credit_offset"] = franking_result["franking_credit"]
        tax_analysis["total_tax"] = max(0, tax_analysis["total_tax"] - franking_result["franking_credit"])
        tax_analysis["net_income"] = adjusted_taxable_income - tax_analysis["total_tax"]
    else:
        tax_analysis = calculate_company_tax(adjusted_taxable_income)
    
    # Debt to equity
    debt_equity = calculate_debt_to_equity(total_assets, total_debt)
    
    # Monte Carlo for total investment portfolio
    investment_portfolio = inv.shares_value + inv.etf_value
    monte_carlo = None
    if investment_portfolio > 0:
        # Blend expected return based on allocation
        weighted_return = 0.07  # Conservative estimate
        monte_carlo = run_monte_carlo_simulation(
            investment_portfolio,
            weighted_return,
            0.15,
            scenario.simulation_years,
            1000
        )
    
    # Loan analysis for all properties
    loan_analyses = []
    for prop in inv.properties:
        if prop.mortgage_amount > 0:
            loan_analysis = calculate_loan_repayment(
                prop.mortgage_amount,
                prop.mortgage_rate,
                prop.mortgage_term_years
            )
            loan_analysis["property_name"] = prop.name
            loan_analyses.append(loan_analysis)
    
    return {
        "scenario_name": scenario.name,
        "entity_type": scenario.entity_type,
        "summary": {
            "total_assets": total_assets,
            "total_debt": total_debt,
            "net_worth": total_assets - total_debt,
            "total_investment_income": total_investment_income,
            "total_deductions": total_deductions
        },
        "income_breakdown": {
            "employment_income": scenario.taxable_income,
            "term_deposit_income": term_deposit_income,
            "dividend_income": dividend_income,
            "franking_credits": franking_result["franking_credit"],
            "bond_income": bond_income,
            "etf_income": etf_income,
            "net_rental_income": total_rental_income - total_property_deductions
        },
        "expense_breakdown": {
            "school_fees": exp.school_fees,
            "childcare": exp.childcare,
            "health_insurance": exp.health_insurance,
            "private_expenses": exp.private_expenses,
            "deductible_expenses": exp.work_related + exp.other_deductible
        },
        "tax_analysis": tax_analysis,
        "franking_analysis": franking_result,
        "property_analyses": property_analyses,
        "debt_equity_analysis": debt_equity,
        "loan_analyses": loan_analyses,
        "monte_carlo_projection": monte_carlo
    }

# ==================== TAX RATES INFO ====================

@api_router.get("/tax-rates")
async def get_tax_rates():
    """Get current Australian tax rates"""
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

@api_router.get("/tax-rates/historical")
async def get_historical_tax_rates():
    """Get historical Australian tax rates for comparison"""
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

@api_router.post("/analyze/tax-comparison")
async def analyze_tax_comparison(
    taxable_income: float,
    years: List[str] = ["2024-25", "2023-24", "2022-23"]
):
    """Compare tax across different years"""
    comparisons = []
    for year in years:
        if year in HISTORICAL_TAX_BRACKETS:
            result = calculate_personal_income_tax_historical(taxable_income, year)
            comparisons.append(result)
    
    # Calculate savings from Stage 3 cuts
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

@api_router.post("/analyze/cgt")
async def analyze_capital_gains(
    purchase_price: float,
    sale_price: float,
    holding_period_months: int,
    marginal_tax_rate: float = 0.30,
    entity_type: str = "individual",
    improvement_costs: float = 0,
    selling_costs: float = 0
):
    """Calculate Capital Gains Tax"""
    return calculate_capital_gains_tax(
        purchase_price,
        sale_price,
        holding_period_months,
        marginal_tax_rate,
        entity_type,
        improvement_costs,
        selling_costs
    )

@api_router.post("/analyze/smsf")
async def analyze_smsf_contributions(
    age: int,
    current_super_balance: float,
    taxable_income: float,
    employer_contribution: float = 0,
    salary_sacrifice: float = 0,
    personal_contribution: float = 0,
    spouse_contribution: float = 0
):
    """Calculate SMSF contribution strategy and benefits"""
    return calculate_smsf_contribution_strategy(
        age,
        current_super_balance,
        taxable_income,
        employer_contribution,
        salary_sacrifice,
        personal_contribution,
        spouse_contribution
    )

@api_router.post("/analyze/full-scenario/report")
async def generate_scenario_report(scenario: ScenarioCreate, request: Request):
    """Generate comprehensive report data for a scenario"""
    # First run the full analysis
    analysis = await analyze_full_scenario(scenario)
    
    # Generate report structure
    report_data = generate_pdf_report_data(analysis)
    
    return report_data

# ==================== SALARY PACKAGING ENDPOINTS ====================

class PackagingItem(BaseModel):
    type: str
    amount: float

class SalaryPackagingRequest(BaseModel):
    gross_salary: float
    packaging_items: List[PackagingItem]
    is_nfp_employee: bool = False
    nfp_cap: float = 0
    marginal_tax_rate: float = 0.30

@api_router.post("/analyze/salary-packaging")
async def analyze_salary_packaging(request: SalaryPackagingRequest):
    """Calculate salary packaging benefits and FBT implications"""
    items = [{"type": item.type, "amount": item.amount} for item in request.packaging_items]
    return calculate_salary_packaging(
        request.gross_salary,
        items,
        request.is_nfp_employee,
        request.nfp_cap,
        request.marginal_tax_rate
    )

@api_router.get("/salary-packaging/items")
async def get_packaging_items():
    """Get list of available salary packaging items"""
    return {
        "items": [
            {"type": key, **value}
            for key, value in PACKAGING_ITEMS.items()
        ],
        "nfp_caps": {
            "hospitals": NFP_CAP_HOSPITALS,
            "charities": NFP_CAP_CHARITIES
        },
        "fbt_rate": FBT_RATE * 100
    }

# ==================== PROPERTY COMPARISON ENDPOINTS ====================

class PropertyComparisonRequest(BaseModel):
    properties: List[Dict[str, Any]]
    marginal_tax_rate: float = 0.30
    investment_horizon_years: int = 10
    expected_capital_growth: float = 0.04

@api_router.post("/analyze/property-comparison")
async def analyze_property_comparison(request: PropertyComparisonRequest):
    """Compare multiple investment properties"""
    return compare_investment_properties(
        request.properties,
        request.marginal_tax_rate,
        request.investment_horizon_years,
        request.expected_capital_growth
    )

# ==================== SCENARIO COMPARISON ENDPOINTS ====================

@api_router.post("/analyze/scenario-comparison")
async def analyze_scenario_comparison(request: ScenarioComparisonInput):
    """Compare multiple investment scenarios side by side"""
    return compare_scenarios(request.scenarios)

# ==================== TAX LOSS HARVESTING ====================

class HoldingInput(BaseModel):
    symbol: str
    name: str
    purchase_price: float
    current_price: float
    quantity: float
    purchase_date: str  # YYYY-MM-DD format
    asset_type: str = "shares"  # shares, etf, crypto

class TaxLossHarvestingRequest(BaseModel):
    holdings: List[HoldingInput]
    realized_gains: float = 0  # Already realized gains this FY
    marginal_tax_rate: float = 0.37

def calculate_tax_loss_harvesting(holdings: List[Dict], realized_gains: float, marginal_rate: float):
    """Analyze holdings for tax loss harvesting opportunities"""
    from datetime import datetime
    
    opportunities = []
    total_unrealized_gains = 0
    total_unrealized_losses = 0
    
    for h in holdings:
        cost_basis = h["purchase_price"] * h["quantity"]
        current_value = h["current_price"] * h["quantity"]
        gain_loss = current_value - cost_basis
        gain_loss_pct = ((h["current_price"] - h["purchase_price"]) / h["purchase_price"]) * 100 if h["purchase_price"] > 0 else 0
        
        # Calculate holding period
        try:
            purchase_dt = datetime.strptime(h["purchase_date"], "%Y-%m-%d")
            days_held = (datetime.now() - purchase_dt).days
        except:
            days_held = 0
        
        # CGT discount eligibility (held > 12 months)
        cgt_discount_eligible = days_held > 365
        
        if gain_loss < 0:
            total_unrealized_losses += abs(gain_loss)
            # Tax benefit from harvesting this loss
            tax_benefit = abs(gain_loss) * marginal_rate
            
            opportunities.append({
                "symbol": h["symbol"],
                "name": h["name"],
                "type": "loss",
                "cost_basis": round(cost_basis, 2),
                "current_value": round(current_value, 2),
                "unrealized_loss": round(abs(gain_loss), 2),
                "gain_loss_pct": round(gain_loss_pct, 1),
                "days_held": days_held,
                "tax_benefit": round(tax_benefit, 2),
                "recommendation": "Consider selling to harvest loss",
                "wash_sale_warning": "Avoid repurchasing within 30 days to prevent wash sale"
            })
        else:
            total_unrealized_gains += gain_loss
    
    # Sort by largest loss first
    opportunities.sort(key=lambda x: x.get("unrealized_loss", 0), reverse=True)
    
    # Calculate potential tax savings
    max_harvestable = min(total_unrealized_losses, realized_gains + total_unrealized_gains)
    potential_tax_savings = max_harvestable * marginal_rate
    
    # Net position after offsetting
    net_gains_after_harvest = max(0, realized_gains - total_unrealized_losses)
    
    return {
        "opportunities": opportunities,
        "summary": {
            "total_unrealized_gains": round(total_unrealized_gains, 2),
            "total_unrealized_losses": round(total_unrealized_losses, 2),
            "realized_gains_ytd": round(realized_gains, 2),
            "max_harvestable_losses": round(max_harvestable, 2),
            "potential_tax_savings": round(potential_tax_savings, 2),
            "net_gains_after_harvest": round(net_gains_after_harvest, 2),
            "tax_on_net_gains": round(net_gains_after_harvest * marginal_rate * 0.5, 2)  # With 50% CGT discount
        },
        "recommendations": generate_harvest_recommendations(
            total_unrealized_losses, realized_gains, total_unrealized_gains, marginal_rate
        )
    }

def generate_harvest_recommendations(losses: float, realized: float, unrealized_gains: float, rate: float):
    """Generate actionable tax loss harvesting recommendations"""
    recs = []
    
    if losses > 0 and realized > 0:
        offset = min(losses, realized)
        savings = offset * rate
        recs.append(f"Harvest ${offset:,.0f} in losses to offset your ${realized:,.0f} realized gains, saving ${savings:,.0f} in tax")
    
    if losses > realized and unrealized_gains > 0:
        carry_forward = losses - realized
        recs.append(f"After offsetting realized gains, you can carry forward ${carry_forward:,.0f} in losses to future years")
    
    if losses == 0:
        recs.append("No tax loss harvesting opportunities found - all positions are in profit")
    
    recs.append("Remember: Losses can be carried forward indefinitely to offset future capital gains")
    recs.append("Wash sale rule: Avoid repurchasing substantially identical securities within 30 days")
    
    return recs

@api_router.post("/analyze/tax-loss-harvesting")
async def analyze_tax_loss_harvesting(request: TaxLossHarvestingRequest):
    """Analyze portfolio for tax loss harvesting opportunities"""
    holdings = [h.dict() for h in request.holdings]
    return calculate_tax_loss_harvesting(
        holdings,
        request.realized_gains,
        request.marginal_tax_rate
    )

# ==================== DIVIDEND REINVESTMENT CALCULATOR ====================

class DividendReinvestmentRequest(BaseModel):
    initial_investment: float
    dividend_yield: float  # Annual yield as decimal (e.g., 0.04 for 4%)
    capital_growth_rate: float = 0.05  # Annual growth rate
    dividend_growth_rate: float = 0.03  # Annual dividend growth
    years: int = 20
    reinvest_dividends: bool = True
    tax_rate: float = 0.30  # Marginal tax rate for dividends
    franking_percentage: float = 0.85  # % of dividends that are franked

# Historical dividend growth rates for Australian market
HISTORICAL_DIVIDEND_GROWTH = {
    "asx_5yr": 0.032,  # 3.2% average 5-year
    "asx_10yr": 0.028,  # 2.8% average 10-year
    "banks_5yr": 0.025,
    "banks_10yr": 0.022,
    "resources_5yr": 0.045,
    "resources_10yr": 0.038,
    "reits_5yr": 0.035,
    "reits_10yr": 0.030
}

def calculate_dividend_reinvestment(
    initial: float,
    div_yield: float,
    cap_growth: float,
    div_growth: float,
    years: int,
    reinvest: bool,
    tax_rate: float,
    franking_pct: float
):
    """Calculate dividend reinvestment vs cash comparison"""
    
    reinvest_data = []
    cash_data = []
    
    # Reinvestment scenario
    reinvest_value = initial
    reinvest_shares = 1000  # Assume 1000 units initially
    reinvest_cumulative_dividends = 0
    current_div_yield = div_yield
    
    # Cash dividend scenario
    cash_value = initial
    cash_cumulative_dividends = 0
    cash_current_div_yield = div_yield
    
    for year in range(1, years + 1):
        # REINVEST SCENARIO
        # Capital appreciation
        reinvest_value *= (1 + cap_growth)
        
        # Dividend payment (on current value)
        dividend_amount = reinvest_value * current_div_yield
        
        # Franking credit calculation
        franked_amount = dividend_amount * franking_pct
        unfranked_amount = dividend_amount * (1 - franking_pct)
        franking_credit = franked_amount * (0.30 / 0.70)  # Gross up
        
        # Tax on dividends (reduced by franking credits)
        gross_dividend = dividend_amount + franking_credit
        tax_payable = gross_dividend * tax_rate - franking_credit
        net_dividend = dividend_amount - max(0, tax_payable)
        
        # Reinvest net dividend
        reinvest_value += net_dividend
        reinvest_cumulative_dividends += dividend_amount
        
        # Increase dividend yield for next year
        current_div_yield *= (1 + div_growth)
        
        reinvest_data.append({
            "year": year,
            "portfolio_value": round(reinvest_value, 2),
            "dividend_paid": round(dividend_amount, 2),
            "cumulative_dividends": round(reinvest_cumulative_dividends, 2),
            "total_return": round(reinvest_value - initial, 2)
        })
        
        # CASH DIVIDEND SCENARIO
        cash_value *= (1 + cap_growth)
        cash_dividend = cash_value * cash_current_div_yield
        
        # Same tax calculation
        cash_franked = cash_dividend * franking_pct
        cash_franking_credit = cash_franked * (0.30 / 0.70)
        cash_gross = cash_dividend + cash_franking_credit
        cash_tax = cash_gross * tax_rate - cash_franking_credit
        cash_net_dividend = cash_dividend - max(0, cash_tax)
        
        cash_cumulative_dividends += cash_net_dividend
        cash_current_div_yield *= (1 + div_growth)
        
        cash_data.append({
            "year": year,
            "portfolio_value": round(cash_value, 2),
            "dividend_received": round(cash_net_dividend, 2),
            "cumulative_dividends": round(cash_cumulative_dividends, 2),
            "total_wealth": round(cash_value + cash_cumulative_dividends, 2)
        })
    
    # Final comparison
    final_reinvest = reinvest_data[-1]["portfolio_value"]
    final_cash_total = cash_data[-1]["total_wealth"]
    reinvest_advantage = final_reinvest - final_cash_total
    
    # CAGR calculations
    reinvest_cagr = ((final_reinvest / initial) ** (1/years) - 1) * 100
    cash_cagr = ((final_cash_total / initial) ** (1/years) - 1) * 100
    
    return {
        "reinvest_projection": reinvest_data,
        "cash_projection": cash_data,
        "comparison": {
            "initial_investment": initial,
            "years": years,
            "final_reinvest_value": round(final_reinvest, 2),
            "final_cash_portfolio": round(cash_data[-1]["portfolio_value"], 2),
            "final_cash_dividends": round(cash_cumulative_dividends, 2),
            "final_cash_total": round(final_cash_total, 2),
            "reinvest_advantage": round(reinvest_advantage, 2),
            "reinvest_advantage_pct": round((reinvest_advantage / initial) * 100, 1),
            "reinvest_cagr": round(reinvest_cagr, 2),
            "cash_cagr": round(cash_cagr, 2)
        },
        "inputs": {
            "dividend_yield": div_yield * 100,
            "capital_growth": cap_growth * 100,
            "dividend_growth": div_growth * 100,
            "tax_rate": tax_rate * 100,
            "franking_percentage": franking_pct * 100
        },
        "historical_benchmarks": HISTORICAL_DIVIDEND_GROWTH,
        "recommendations": generate_drip_recommendations(
            reinvest_advantage, final_reinvest, initial, years, div_yield
        )
    }

def generate_drip_recommendations(advantage: float, final_val: float, initial: float, years: int, yield_rate: float):
    """Generate dividend reinvestment recommendations"""
    recs = []
    
    multiple = final_val / initial
    recs.append(f"Over {years} years, reinvesting dividends grows ${initial:,.0f} to ${final_val:,.0f} ({multiple:.1f}x)")
    
    if advantage > 0:
        recs.append(f"Dividend reinvestment provides ${advantage:,.0f} MORE than taking cash dividends")
        recs.append("The power of compounding makes reinvestment increasingly beneficial over time")
    
    if yield_rate >= 0.05:
        recs.append("High-yield stocks benefit significantly from reinvestment due to larger dividend amounts")
    
    recs.append("Consider DRP (Dividend Reinvestment Plan) to automate reinvestment without brokerage fees")
    recs.append("For income needs, taking cash dividends may be preferable despite lower total returns")
    
    return recs

@api_router.post("/analyze/dividend-reinvestment")
async def analyze_dividend_reinvestment(request: DividendReinvestmentRequest):
    """Calculate dividend reinvestment vs cash comparison"""
    return calculate_dividend_reinvestment(
        request.initial_investment,
        request.dividend_yield,
        request.capital_growth_rate,
        request.dividend_growth_rate,
        request.years,
        request.reinvest_dividends,
        request.tax_rate,
        request.franking_percentage
    )

@api_router.get("/dividend/historical-growth")
async def get_historical_dividend_growth():
    """Get historical dividend growth rates for Australian market"""
    return {
        "rates": HISTORICAL_DIVIDEND_GROWTH,
        "description": {
            "asx_5yr": "ASX 200 average dividend growth (5-year)",
            "asx_10yr": "ASX 200 average dividend growth (10-year)",
            "banks_5yr": "Big 4 Banks average (5-year)",
            "banks_10yr": "Big 4 Banks average (10-year)",
            "resources_5yr": "Mining/Resources sector (5-year)",
            "resources_10yr": "Mining/Resources sector (10-year)",
            "reits_5yr": "A-REITs average (5-year)",
            "reits_10yr": "A-REITs average (10-year)"
        }
    }

# ==================== REAL-TIME DATA ENDPOINTS ====================

# ASX Stock mock data - realistic prices as of late 2025
ASX_MOCK_PRICES = {
    "CBA": {"name": "Commonwealth Bank", "base_price": 118.50, "sector": "Financials"},
    "BHP": {"name": "BHP Group", "base_price": 42.80, "sector": "Materials"},
    "CSL": {"name": "CSL Limited", "base_price": 298.00, "sector": "Healthcare"},
    "WBC": {"name": "Westpac Banking", "base_price": 26.80, "sector": "Financials"},
    "NAB": {"name": "National Australia Bank", "base_price": 35.20, "sector": "Financials"},
    "ANZ": {"name": "ANZ Group", "base_price": 28.90, "sector": "Financials"},
    "WOW": {"name": "Woolworths Group", "base_price": 31.20, "sector": "Consumer Staples"},
    "WES": {"name": "Wesfarmers", "base_price": 72.50, "sector": "Consumer Discretionary"},
    "TLS": {"name": "Telstra Group", "base_price": 4.05, "sector": "Telecommunications"},
    "RIO": {"name": "Rio Tinto", "base_price": 118.20, "sector": "Materials"},
    "FMG": {"name": "Fortescue Metals", "base_price": 18.90, "sector": "Materials"},
    "MQG": {"name": "Macquarie Group", "base_price": 215.00, "sector": "Financials"},
    "GMG": {"name": "Goodman Group", "base_price": 35.80, "sector": "Real Estate"},
    "TCL": {"name": "Transurban", "base_price": 13.20, "sector": "Industrials"},
    "ALL": {"name": "Aristocrat Leisure", "base_price": 52.30, "sector": "Consumer Discretionary"},
    "COL": {"name": "Coles Group", "base_price": 18.45, "sector": "Consumer Staples"},
    "STO": {"name": "Santos", "base_price": 7.20, "sector": "Energy"},
    "WDS": {"name": "Woodside Energy", "base_price": 26.50, "sector": "Energy"},
    "REA": {"name": "REA Group", "base_price": 215.00, "sector": "Information Technology"},
    "JHX": {"name": "James Hardie", "base_price": 55.80, "sector": "Materials"},
    "VAS": {"name": "Vanguard Australian Shares ETF", "base_price": 96.50, "sector": "ETF"},
    "VGS": {"name": "Vanguard MSCI Index International", "base_price": 112.30, "sector": "ETF"},
    "IVV": {"name": "iShares S&P 500 ETF", "base_price": 58.90, "sector": "ETF"},
}

# Sydney suburb median prices (mock data based on realistic 2025 values)
SYDNEY_SUBURB_MEDIANS = {
    "sydney": 1450000,
    "north sydney": 1680000,
    "parramatta": 920000,
    "chatswood": 1850000,
    "bondi": 2100000,
    "manly": 2450000,
    "cronulla": 1650000,
    "newtown": 1380000,
    "marrickville": 1420000,
    "strathfield": 1750000,
    "burwood": 1520000,
    "hurstville": 1180000,
    "bankstown": 980000,
    "liverpool": 850000,
    "penrith": 780000,
}

MELBOURNE_SUBURB_MEDIANS = {
    "melbourne": 980000,
    "south yarra": 1450000,
    "toorak": 3200000,
    "richmond": 1280000,
    "st kilda": 1150000,
    "brighton": 2100000,
    "hawthorn": 1650000,
    "malvern": 1850000,
    "carlton": 920000,
    "fitzroy": 1380000,
    "brunswick": 1050000,
    "footscray": 820000,
    "box hill": 1120000,
    "glen waverley": 1380000,
}

BRISBANE_SUBURB_MEDIANS = {
    "brisbane": 750000,
    "new farm": 1450000,
    "paddington": 1280000,
    "ascot": 1650000,
    "bulimba": 1380000,
    "west end": 920000,
    "toowong": 980000,
    "indooroopilly": 1050000,
    "chermside": 720000,
}

import random

class StockPriceRequest(BaseModel):
    symbols: List[str]

class PropertyValuationRequest(BaseModel):
    properties: List[Dict[str, Any]]

@api_router.post("/stocks/get-prices")
async def get_stock_prices(request: StockPriceRequest):
    """
    Get current stock prices for given symbols.
    Currently uses mock data - ready for Alpha Vantage API integration.
    Add ALPHA_VANTAGE_KEY to .env to enable real data.
    """
    alpha_vantage_key = os.environ.get('ALPHA_VANTAGE_KEY')
    
    results = []
    for symbol in request.symbols:
        # Normalize symbol (remove .AX suffix if present)
        clean_symbol = symbol.upper().replace('.AX', '')
        
        if alpha_vantage_key:
            # TODO: Implement real Alpha Vantage API call
            # For now, fall back to mock data
            pass
        
        # Mock data with realistic price variation
        if clean_symbol in ASX_MOCK_PRICES:
            stock_info = ASX_MOCK_PRICES[clean_symbol]
            # Add random variation of ±3% to simulate market movement
            variation = random.uniform(-0.03, 0.03)
            current_price = round(stock_info["base_price"] * (1 + variation), 2)
            change = round(current_price - stock_info["base_price"], 2)
            change_percent = round((change / stock_info["base_price"]) * 100, 2)
            
            results.append({
                "symbol": clean_symbol,
                "name": stock_info["name"],
                "price": current_price,
                "change": change,
                "change_percent": change_percent,
                "sector": stock_info["sector"],
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "data_source": "mock"  # Will be "alpha_vantage" when real API is used
            })
        else:
            # Unknown symbol - return error
            results.append({
                "symbol": clean_symbol,
                "error": f"Symbol {clean_symbol} not found",
                "data_source": "mock"
            })
    
    return {
        "prices": results,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "is_mock_data": alpha_vantage_key is None,
        "note": "Add ALPHA_VANTAGE_KEY to backend/.env for real-time data" if not alpha_vantage_key else None
    }

@api_router.post("/property/get-valuations")
async def get_property_valuations(request: PropertyValuationRequest):
    """
    Get estimated property valuations based on suburb median data.
    Uses mock suburb median data - simulates REA/CoreLogic style valuations.
    """
    results = []
    
    for prop in request.properties:
        property_name = prop.get("name", "Unknown Property")
        current_value = prop.get("value", 0)
        suburb = prop.get("suburb", "").lower().strip()
        city = prop.get("city", "sydney").lower().strip()
        property_type = prop.get("property_type", "house")  # house, unit, townhouse
        bedrooms = prop.get("bedrooms", 3)
        
        # Get suburb median from appropriate city
        suburb_medians = SYDNEY_SUBURB_MEDIANS
        if city == "melbourne":
            suburb_medians = MELBOURNE_SUBURB_MEDIANS
        elif city == "brisbane":
            suburb_medians = BRISBANE_SUBURB_MEDIANS
        
        # Find matching suburb or use city average
        median_price = suburb_medians.get(suburb, suburb_medians.get(city, 1000000))
        
        # Adjust for property type
        type_multiplier = 1.0
        if property_type == "unit":
            type_multiplier = 0.65
        elif property_type == "townhouse":
            type_multiplier = 0.85
        
        # Adjust for bedrooms (base is 3 bedrooms)
        bedroom_adjustment = 1 + (bedrooms - 3) * 0.1
        
        # Calculate estimated value with some randomness
        base_estimate = median_price * type_multiplier * bedroom_adjustment
        variation = random.uniform(-0.05, 0.05)  # ±5% variation
        estimated_value = round(base_estimate * (1 + variation), -3)  # Round to nearest $1000
        
        # Calculate annual growth (mock - based on historical averages)
        annual_growth_rate = random.uniform(0.03, 0.07)  # 3-7% annual growth
        
        # Calculate change from current value if provided
        value_change = estimated_value - current_value if current_value > 0 else 0
        change_percent = round((value_change / current_value) * 100, 1) if current_value > 0 else 0
        
        results.append({
            "property_name": property_name,
            "current_value": current_value,
            "estimated_value": estimated_value,
            "value_change": value_change,
            "change_percent": change_percent,
            "suburb": suburb or "unknown",
            "city": city,
            "suburb_median": median_price,
            "property_type": property_type,
            "bedrooms": bedrooms,
            "annual_growth_estimate": round(annual_growth_rate * 100, 1),
            "confidence": "medium",  # Would be high/medium/low based on data quality
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "data_source": "mock_suburb_medians"
        })
    
    return {
        "valuations": results,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "methodology": "Suburb median pricing with property type and bedroom adjustments",
        "disclaimer": "Estimates based on suburb median data. For accurate valuations, consult a licensed valuer."
    }

@api_router.get("/property/suburb-data")
async def get_suburb_data(city: str = "sydney"):
    """Get available suburb median data for a city"""
    city = city.lower()
    if city == "sydney":
        return {"city": "sydney", "suburbs": SYDNEY_SUBURB_MEDIANS}
    elif city == "melbourne":
        return {"city": "melbourne", "suburbs": MELBOURNE_SUBURB_MEDIANS}
    elif city == "brisbane":
        return {"city": "brisbane", "suburbs": BRISBANE_SUBURB_MEDIANS}
    else:
        return {"city": city, "suburbs": {}, "error": "City not found"}

# ==================== LIFECYCLE PLANNING ENDPOINTS ====================

class RetirementPlanRequest(BaseModel):
    current_age: int
    retirement_age: int = 67
    life_expectancy: int = 90
    current_super: float
    current_savings: float
    annual_income: float
    annual_expenses: float
    desired_retirement_income: float
    super_contribution_rate: float = 11.5  # SG rate
    salary_sacrifice: float = 0
    investment_return: float = 7.0  # %
    inflation_rate: float = 2.5  # %

class EstateplanRequest(BaseModel):
    total_assets: float
    total_super: float
    property_value: float
    beneficiaries: List[Dict[str, Any]]
    has_will: bool = False
    has_testamentary_trust: bool = False
    has_power_of_attorney: bool = False

class FinancialGoal(BaseModel):
    name: str
    target_amount: float
    target_date: str  # YYYY-MM-DD
    current_savings: float = 0
    monthly_contribution: float = 0
    priority: str = "medium"  # high, medium, low

class GoalPlanningRequest(BaseModel):
    goals: List[FinancialGoal]
    available_monthly_savings: float
    risk_tolerance: str = "moderate"  # conservative, moderate, aggressive

@api_router.post("/lifecycle/retirement-plan")
async def calculate_retirement_plan(request: RetirementPlanRequest):
    """Calculate comprehensive retirement plan with projections"""
    years_to_retirement = request.retirement_age - request.current_age
    years_in_retirement = request.life_expectancy - request.retirement_age
    
    # Real return (after inflation)
    real_return = (1 + request.investment_return/100) / (1 + request.inflation_rate/100) - 1
    
    # Project super balance at retirement
    annual_sg = request.annual_income * (request.super_contribution_rate / 100)
    total_annual_contribution = annual_sg + request.salary_sacrifice
    
    # Future value of super at retirement
    super_at_retirement = request.current_super
    for year in range(years_to_retirement):
        super_at_retirement = super_at_retirement * (1 + request.investment_return/100) + total_annual_contribution
    
    # Future value of savings at retirement
    annual_savings = request.annual_income - request.annual_expenses
    savings_at_retirement = request.current_savings
    for year in range(years_to_retirement):
        savings_at_retirement = savings_at_retirement * (1 + request.investment_return/100) + max(0, annual_savings)
    
    total_at_retirement = super_at_retirement + savings_at_retirement
    
    # Calculate sustainable withdrawal rate (4% rule adjusted)
    sustainable_income = total_at_retirement * 0.04
    
    # Calculate retirement income gap
    income_gap = request.desired_retirement_income - sustainable_income
    
    # Age pension eligibility (simplified)
    age_pension_eligible = request.retirement_age >= 67
    age_pension_estimate = 28514 if age_pension_eligible and total_at_retirement < 656500 else 0  # Single rate 2024-25
    
    # Generate year-by-year projection
    projections = []
    balance = request.current_super + request.current_savings
    for year in range(years_to_retirement + 1):
        age = request.current_age + year
        if year < years_to_retirement:
            # Accumulation phase
            contribution = total_annual_contribution + max(0, annual_savings)
            balance = balance * (1 + request.investment_return/100) + contribution
            phase = "accumulation"
        else:
            # Retirement phase
            withdrawal = request.desired_retirement_income
            balance = balance * (1 + real_return) - withdrawal
            phase = "retirement"
        
        projections.append({
            "year": year,
            "age": age,
            "balance": round(balance, 0),
            "phase": phase
        })
    
    # Continue retirement projections
    for year in range(1, years_in_retirement + 1):
        age = request.retirement_age + year
        withdrawal = request.desired_retirement_income
        balance = max(0, balance * (1 + real_return) - withdrawal)
        projections.append({
            "year": years_to_retirement + year,
            "age": age,
            "balance": round(balance, 0),
            "phase": "retirement"
        })
    
    # Check if money lasts
    money_lasts_until = request.life_expectancy
    for proj in projections:
        if proj["balance"] <= 0:
            money_lasts_until = proj["age"]
            break
    
    shortfall = request.life_expectancy - money_lasts_until
    
    # Generate recommendations
    recommendations = []
    if income_gap > 0:
        extra_savings_needed = income_gap / 0.04  # Reverse 4% rule
        recommendations.append({
            "type": "savings",
            "priority": "high",
            "message": f"Increase retirement savings by ${extra_savings_needed:,.0f} to meet income goal",
            "action": "Consider increasing salary sacrifice or other investments"
        })
    
    if request.salary_sacrifice < 30000 - annual_sg:
        max_additional = min(30000 - annual_sg, request.annual_income * 0.15)
        tax_savings = max_additional * 0.22  # Approximate tax savings
        recommendations.append({
            "type": "super",
            "priority": "high",
            "message": f"Maximize concessional contributions - you can add ${max_additional:,.0f} more",
            "action": f"Salary sacrifice could save ~${tax_savings:,.0f} in tax annually"
        })
    
    if shortfall > 0:
        recommendations.append({
            "type": "longevity",
            "priority": "high",
            "message": f"Current plan runs out {shortfall} years before life expectancy",
            "action": "Consider reducing retirement spending or working longer"
        })
    
    if not age_pension_eligible:
        recommendations.append({
            "type": "pension",
            "priority": "medium",
            "message": "Age pension available from age 67",
            "action": "Factor in potential pension income for later retirement years"
        })
    
    return {
        "summary": {
            "current_age": request.current_age,
            "retirement_age": request.retirement_age,
            "years_to_retirement": years_to_retirement,
            "years_in_retirement": years_in_retirement,
            "super_at_retirement": round(super_at_retirement, 0),
            "savings_at_retirement": round(savings_at_retirement, 0),
            "total_at_retirement": round(total_at_retirement, 0),
            "sustainable_annual_income": round(sustainable_income, 0),
            "desired_income": request.desired_retirement_income,
            "income_gap": round(income_gap, 0),
            "age_pension_estimate": age_pension_estimate,
            "money_lasts_until_age": money_lasts_until,
            "shortfall_years": shortfall
        },
        "projections": projections,
        "recommendations": recommendations,
        "assumptions": {
            "investment_return": request.investment_return,
            "inflation_rate": request.inflation_rate,
            "withdrawal_rate": 4.0
        }
    }

@api_router.post("/lifecycle/estate-plan")
async def calculate_estate_plan(request: EstateplanRequest):
    """Analyze estate planning considerations"""
    total_estate = request.total_assets + request.total_super
    num_beneficiaries = len(request.beneficiaries)
    
    # Calculate per-beneficiary share (simplified equal split)
    per_beneficiary = total_estate / num_beneficiaries if num_beneficiaries > 0 else total_estate
    
    # Tax implications
    # Super death benefits tax (for non-dependants)
    taxable_super_component = request.total_super * 0.85  # Assume 85% taxable
    super_death_tax_rate = 0.17  # 15% + 2% Medicare levy for non-dependants
    
    beneficiary_analysis = []
    for ben in request.beneficiaries:
        is_dependant = ben.get("relationship") in ["spouse", "child_under_18", "financial_dependant"]
        ben_share = total_estate * (ben.get("share_percent", 100/num_beneficiaries) / 100)
        
        # Calculate potential tax on super component
        super_share = request.total_super * (ben.get("share_percent", 100/num_beneficiaries) / 100)
        super_tax = 0 if is_dependant else super_share * 0.85 * super_death_tax_rate
        
        beneficiary_analysis.append({
            "name": ben.get("name", "Unknown"),
            "relationship": ben.get("relationship", "other"),
            "is_tax_dependant": is_dependant,
            "share_percent": ben.get("share_percent", 100/num_beneficiaries),
            "estimated_inheritance": round(ben_share, 0),
            "potential_super_tax": round(super_tax, 0),
            "net_inheritance": round(ben_share - super_tax, 0)
        })
    
    # Estate planning checklist
    checklist = [
        {"item": "Valid Will", "complete": request.has_will, "priority": "critical"},
        {"item": "Power of Attorney", "complete": request.has_power_of_attorney, "priority": "high"},
        {"item": "Super Beneficiary Nominations", "complete": False, "priority": "high"},  # Assumed not set
        {"item": "Testamentary Trust", "complete": request.has_testamentary_trust, "priority": "medium"},
    ]
    
    # Recommendations
    recommendations = []
    if not request.has_will:
        recommendations.append({
            "priority": "critical",
            "message": "Create a valid Will immediately",
            "reason": "Without a Will, your estate will be distributed according to intestacy laws"
        })
    
    if not request.has_power_of_attorney:
        recommendations.append({
            "priority": "high", 
            "message": "Establish Enduring Power of Attorney",
            "reason": "Ensures someone can manage your affairs if you become incapacitated"
        })
    
    if request.total_super > 500000 and not request.has_testamentary_trust:
        recommendations.append({
            "priority": "medium",
            "message": "Consider a Testamentary Trust",
            "reason": "Can provide tax benefits for beneficiaries and asset protection"
        })
    
    # Check for potential super tax issues
    non_dependant_beneficiaries = [b for b in request.beneficiaries if b.get("relationship") not in ["spouse", "child_under_18", "financial_dependant"]]
    if non_dependant_beneficiaries and request.total_super > 100000:
        recommendations.append({
            "priority": "high",
            "message": "Review super beneficiary nominations",
            "reason": "Non-dependant beneficiaries may pay up to 17% tax on taxable super components"
        })
    
    return {
        "estate_summary": {
            "total_estate_value": total_estate,
            "total_assets": request.total_assets,
            "total_super": request.total_super,
            "property_value": request.property_value,
            "num_beneficiaries": num_beneficiaries
        },
        "beneficiaries": beneficiary_analysis,
        "checklist": checklist,
        "recommendations": recommendations,
        "tax_considerations": {
            "super_taxable_component_estimate": round(taxable_super_component, 0),
            "potential_super_death_tax": round(taxable_super_component * super_death_tax_rate, 0),
            "note": "Super death benefits tax only applies to non-tax-dependant beneficiaries"
        }
    }

@api_router.post("/lifecycle/goal-planning")
async def calculate_goal_planning(request: GoalPlanningRequest):
    """Analyze financial goals and create savings plan"""
    from datetime import datetime
    
    # Risk-based return assumptions
    returns_by_risk = {
        "conservative": 0.04,
        "moderate": 0.06,
        "aggressive": 0.08
    }
    expected_return = returns_by_risk.get(request.risk_tolerance, 0.06)
    
    goal_analyses = []
    total_monthly_needed = 0
    
    for goal in request.goals:
        try:
            target_date = datetime.strptime(goal.target_date, "%Y-%m-%d")
            months_remaining = max(1, (target_date.year - datetime.now().year) * 12 + (target_date.month - datetime.now().month))
        except:
            months_remaining = 60  # Default 5 years
        
        # Calculate required monthly savings
        gap = goal.target_amount - goal.current_savings
        if gap <= 0:
            required_monthly = 0
            on_track = True
        else:
            # PMT calculation with investment returns
            monthly_rate = expected_return / 12
            if monthly_rate > 0:
                required_monthly = gap * (monthly_rate) / ((1 + monthly_rate)**months_remaining - 1)
            else:
                required_monthly = gap / months_remaining
            
            on_track = goal.monthly_contribution >= required_monthly
        
        # Project outcome with current contribution
        projected_value = goal.current_savings
        for month in range(int(months_remaining)):
            projected_value = projected_value * (1 + expected_return/12) + goal.monthly_contribution
        
        shortfall = goal.target_amount - projected_value
        
        goal_analyses.append({
            "name": goal.name,
            "target_amount": goal.target_amount,
            "current_savings": goal.current_savings,
            "target_date": goal.target_date,
            "months_remaining": months_remaining,
            "current_monthly": goal.monthly_contribution,
            "required_monthly": round(required_monthly, 2),
            "projected_value": round(projected_value, 0),
            "shortfall": round(max(0, shortfall), 0),
            "on_track": on_track,
            "priority": goal.priority,
            "progress_percent": round((goal.current_savings / goal.target_amount) * 100, 1) if goal.target_amount > 0 else 0
        })
        
        total_monthly_needed += required_monthly
    
    # Allocation recommendation
    surplus = request.available_monthly_savings - total_monthly_needed
    
    recommendations = []
    if surplus < 0:
        recommendations.append({
            "type": "budget",
            "message": f"You need ${abs(surplus):,.0f} more monthly savings to achieve all goals",
            "action": "Consider prioritizing goals or extending timelines"
        })
        
        # Prioritize goals
        high_priority = [g for g in goal_analyses if g["priority"] == "high"]
        if high_priority:
            high_priority_total = sum(g["required_monthly"] for g in high_priority)
            if request.available_monthly_savings >= high_priority_total:
                recommendations.append({
                    "type": "prioritization",
                    "message": "Focus on high-priority goals first",
                    "action": f"Allocate ${high_priority_total:,.0f}/month to high-priority goals"
                })
    else:
        recommendations.append({
            "type": "success",
            "message": f"You have ${surplus:,.0f} monthly surplus after all goals",
            "action": "Consider adding new goals or increasing investment contributions"
        })
    
    return {
        "goals": goal_analyses,
        "summary": {
            "total_goals": len(request.goals),
            "goals_on_track": sum(1 for g in goal_analyses if g["on_track"]),
            "total_monthly_required": round(total_monthly_needed, 2),
            "available_monthly": request.available_monthly_savings,
            "monthly_surplus_shortfall": round(surplus, 2)
        },
        "recommendations": recommendations,
        "assumptions": {
            "risk_tolerance": request.risk_tolerance,
            "expected_return": expected_return * 100
        }
    }

# ==================== TAX NOTIFICATION ENDPOINTS ====================

class NotificationPreferences(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    enable_email: bool = True
    enable_sms: bool = False
    reminder_days_before: int = 7

class TaxDeadline(BaseModel):
    name: str
    due_date: str  # YYYY-MM-DD
    category: str  # BAS, Super, PAYG, Tax Return, FBT
    amount_due: Optional[float] = None
    notes: Optional[str] = None

# Tax deadlines for 2024-25 FY (pre-populated)
AUSTRALIAN_TAX_DEADLINES = [
    {"name": "Q1 BAS Due", "due_date": "2024-10-28", "category": "BAS"},
    {"name": "Q1 Super Guarantee Due", "due_date": "2024-10-28", "category": "Super"},
    {"name": "Q2 BAS Due", "due_date": "2025-02-28", "category": "BAS"},
    {"name": "Q2 Super Guarantee Due", "due_date": "2025-01-28", "category": "Super"},
    {"name": "Q3 BAS Due", "due_date": "2025-04-28", "category": "BAS"},
    {"name": "Q3 Super Guarantee Due", "due_date": "2025-04-28", "category": "Super"},
    {"name": "Q4 BAS Due", "due_date": "2025-07-28", "category": "BAS"},
    {"name": "Q4 Super Guarantee Due", "due_date": "2025-07-28", "category": "Super"},
    {"name": "Individual Tax Return Due", "due_date": "2025-10-31", "category": "Tax Return"},
    {"name": "Company Tax Return Due", "due_date": "2025-02-28", "category": "Tax Return"},
    {"name": "FBT Return Due", "due_date": "2025-05-21", "category": "FBT"},
    {"name": "PAYG Summary Due", "due_date": "2025-08-14", "category": "PAYG"},
]

@api_router.get("/notifications/tax-deadlines")
async def get_tax_deadlines():
    """Get upcoming Australian tax deadlines"""
    from datetime import datetime
    
    today = datetime.now().date()
    deadlines = []
    
    for deadline in AUSTRALIAN_TAX_DEADLINES:
        try:
            due_date = datetime.strptime(deadline["due_date"], "%Y-%m-%d").date()
            days_until = (due_date - today).days
            
            status = "upcoming"
            if days_until < 0:
                status = "overdue"
            elif days_until <= 7:
                status = "due_soon"
            elif days_until <= 30:
                status = "approaching"
            
            deadlines.append({
                **deadline,
                "days_until": days_until,
                "status": status
            })
        except:
            continue
    
    # Sort by due date
    deadlines.sort(key=lambda x: x["due_date"])
    
    return {
        "deadlines": deadlines,
        "summary": {
            "overdue": sum(1 for d in deadlines if d["status"] == "overdue"),
            "due_soon": sum(1 for d in deadlines if d["status"] == "due_soon"),
            "approaching": sum(1 for d in deadlines if d["status"] == "approaching")
        }
    }

@api_router.post("/notifications/preferences")
async def save_notification_preferences(preferences: NotificationPreferences, request: Request):
    """Save user notification preferences (requires auth)"""
    # Note: This endpoint would require SendGrid/Twilio integration
    # Currently returns mock response
    return {
        "status": "saved",
        "preferences": preferences.model_dump(),
        "note": "Email/SMS notifications require SendGrid/Twilio API keys to be configured",
        "integration_status": {
            "email": "not_configured",
            "sms": "not_configured"
        }
    }

# ==================== AI CHATBOT PLACEHOLDER ====================

class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None

@api_router.post("/chat/financial-advisor")
async def financial_advisor_chat(request: ChatMessage):
    """
    AI Financial Advisor Chatbot endpoint.
    Currently returns helpful pre-defined responses.
    Add OPENAI_API_KEY or ANTHROPIC_API_KEY to enable AI responses.
    """
    message = request.message.lower()
    
    # Check for LLM API key
    openai_key = os.environ.get('OPENAI_API_KEY')
    anthropic_key = os.environ.get('ANTHROPIC_API_KEY')
    emergent_key = os.environ.get('EMERGENT_LLM_KEY')
    
    has_ai = bool(openai_key or anthropic_key or emergent_key)
    
    if has_ai:
        # TODO: Implement actual LLM integration
        pass
    
    # Pre-defined helpful responses based on keywords
    responses = {
        "tax": "For Australian tax questions, I recommend consulting the ATO website or a registered tax agent. Key rates for 2024-25: Tax-free threshold is $18,200, then 16% up to $45,000, 30% up to $135,000, 37% up to $190,000, and 45% above that. Medicare levy is 2%.",
        "super": "Superannuation Guarantee is currently 11.5% for 2024-25. The concessional contributions cap is $30,000 per year. Consider salary sacrifice to maximize tax benefits - contributions are taxed at only 15%.",
        "property": "For investment property analysis, consider: gross rental yield (annual rent / property value), negative gearing benefits if expenses exceed income, and capital gains tax implications. The CGT discount is 50% for assets held over 12 months.",
        "dividend": "Australian dividends often come with franking credits. Fully franked dividends include a credit for tax already paid by the company (at 25-30%). This credit reduces your tax liability or may result in a refund.",
        "invest": "Key investment principles: diversification across asset classes, understanding your risk tolerance, time horizon, and tax implications. Consider a mix of growth (shares, property) and defensive (bonds, cash) assets.",
        "retirement": "Retirement planning involves estimating your desired income, calculating required savings, and maximizing super contributions. The 4% rule suggests you can withdraw 4% of your retirement savings annually with low risk of running out.",
        "debt": "Good debt (investment loans) can be tax-deductible and build wealth. Bad debt (consumer credit) should be paid off first. Aim for a debt-to-asset ratio below 50% for financial stability.",
    }
    
    # Find matching response
    response_text = "I'm your AI Financial Advisor assistant. I can help with questions about Australian tax, superannuation, property investment, dividends, retirement planning, and debt management. What would you like to know?"
    
    for keyword, response in responses.items():
        if keyword in message:
            response_text = response
            break
    
    return {
        "response": response_text,
        "conversation_id": request.conversation_id or f"conv_{uuid.uuid4().hex[:12]}",
        "ai_enabled": has_ai,
        "note": "Add LLM API key (OPENAI_API_KEY, ANTHROPIC_API_KEY, or EMERGENT_LLM_KEY) for AI-powered responses" if not has_ai else None,
        "suggestions": [
            "How do franking credits work?",
            "What's the best super strategy?",
            "Should I negatively gear a property?",
            "How much do I need for retirement?"
        ]
    }

# ==================== HEALTH CHECK ====================

# ==================== CLIENT AUTHENTICATION ====================

class ClientLoginRequest(BaseModel):
    email: str
    password: str

class ClientRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    adviser_code: Optional[str] = None

class ClientProfile(BaseModel):
    client_id: str
    email: str
    name: str
    adviser_id: Optional[str] = None
    adviser_name: Optional[str] = None
    created_at: str

import hashlib
import secrets

def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{hashed.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt, hash_value = stored_hash.split(':')
        hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return hashed.hex() == hash_value
    except:
        return False

def generate_client_token() -> str:
    """Generate a secure client token"""
    return secrets.token_urlsafe(32)

@api_router.post("/client/register")
async def client_register(request: ClientRegisterRequest):
    """Register a new client"""
    # Check if client already exists
    existing = await db.clients.find_one({"email": request.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    client_id = f"client_{uuid.uuid4().hex[:12]}"
    password_hash = hash_password(request.password)
    
    # Find adviser by code if provided
    adviser_id = None
    adviser_name = None
    if request.adviser_code:
        adviser = await db.advisers.find_one({"adviser_code": request.adviser_code}, {"_id": 0})
        if adviser:
            adviser_id = adviser.get("adviser_id")
            adviser_name = adviser.get("name")
    
    client_data = {
        "client_id": client_id,
        "email": request.email,
        "name": request.name,
        "password_hash": password_hash,
        "adviser_id": adviser_id,
        "adviser_name": adviser_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.clients.insert_one(client_data)
    
    # Generate token
    token = generate_client_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_data = {
        "session_id": f"csess_{uuid.uuid4().hex[:16]}",
        "client_id": client_id,
        "token": token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_sessions.insert_one(session_data)
    
    return {
        "client_id": client_id,
        "email": request.email,
        "name": request.name,
        "token": token,
        "adviser_name": adviser_name
    }

@api_router.post("/client/login")
async def client_login(request: ClientLoginRequest, response: Response):
    """Login a client"""
    client_doc = await db.clients.find_one({"email": request.email}, {"_id": 0})
    
    if not client_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(request.password, client_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate new token
    token = generate_client_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_data = {
        "session_id": f"csess_{uuid.uuid4().hex[:16]}",
        "client_id": client_doc["client_id"],
        "token": token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.client_sessions.insert_one(session_data)
    
    # Set cookie
    response.set_cookie(
        key="client_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "client_id": client_doc["client_id"],
        "email": client_doc["email"],
        "name": client_doc["name"],
        "token": token,
        "adviser_name": client_doc.get("adviser_name")
    }

@api_router.get("/client/me")
async def get_client_profile(request: Request):
    """Get current client profile"""
    token = request.cookies.get("client_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.client_sessions.find_one({"token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    client_doc = await db.clients.find_one(
        {"client_id": session["client_id"]},
        {"_id": 0, "password_hash": 0}
    )
    
    if not client_doc:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return client_doc

@api_router.post("/client/logout")
async def client_logout(request: Request, response: Response):
    """Logout client"""
    token = request.cookies.get("client_token")
    if token:
        await db.client_sessions.delete_one({"token": token})
    
    response.delete_cookie(key="client_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== PRACTICE MANAGEMENT ====================

class ClientNote(BaseModel):
    note_id: str = Field(default_factory=lambda: f"note_{uuid.uuid4().hex[:12]}")
    client_id: str
    title: str
    content: str
    category: str = "general"  # general, meeting, call, email, compliance
    is_private: bool = False
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Meeting(BaseModel):
    meeting_id: str = Field(default_factory=lambda: f"meet_{uuid.uuid4().hex[:12]}")
    client_id: str
    title: str
    description: Optional[str] = None
    scheduled_at: str
    duration_minutes: int = 60
    location: Optional[str] = None
    meeting_type: str = "review"  # review, planning, onboarding, compliance
    status: str = "scheduled"  # scheduled, completed, cancelled, rescheduled
    notes: Optional[str] = None
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:12]}")
    client_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: str
    priority: str = "medium"  # low, medium, high, urgent
    status: str = "pending"  # pending, in_progress, completed, cancelled
    category: str = "general"  # general, compliance, review, follow_up
    assigned_to: str
    created_by: str
    completed_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TimeEntry(BaseModel):
    entry_id: str = Field(default_factory=lambda: f"time_{uuid.uuid4().hex[:12]}")
    client_id: str
    date: str
    hours: float
    description: str
    activity_type: str = "consulting"  # consulting, research, admin, meeting, travel
    is_billable: bool = True
    hourly_rate: float = 0
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Invoice(BaseModel):
    invoice_id: str = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    invoice_number: str
    client_id: str
    issue_date: str
    due_date: str
    line_items: List[Dict[str, Any]]
    subtotal: float
    gst: float
    total: float
    status: str = "draft"  # draft, sent, paid, overdue, cancelled
    notes: Optional[str] = None
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ComplianceRecord(BaseModel):
    record_id: str = Field(default_factory=lambda: f"comp_{uuid.uuid4().hex[:12]}")
    client_id: str
    record_type: str  # soa_review, fds_issued, risk_assessment, kyc_update, annual_review
    description: str
    completed_at: str
    next_due: Optional[str] = None
    documents: List[str] = []
    created_by: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Client Notes Endpoints
@api_router.post("/practice/notes")
async def create_client_note(note: ClientNote, request: Request):
    """Create a client note"""
    user = await get_current_user(request)
    note_data = note.model_dump()
    note_data["created_by"] = user.user_id
    await db.client_notes.insert_one(note_data)
    return await db.client_notes.find_one({"note_id": note_data["note_id"]}, {"_id": 0})

@api_router.get("/practice/notes/{client_id}")
async def get_client_notes(client_id: str, request: Request):
    """Get all notes for a client"""
    await get_current_user(request)
    notes = await db.client_notes.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return notes

@api_router.delete("/practice/notes/{note_id}")
async def delete_client_note(note_id: str, request: Request):
    """Delete a client note"""
    await get_current_user(request)
    result = await db.client_notes.delete_one({"note_id": note_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# Meeting Scheduler Endpoints
@api_router.post("/practice/meetings")
async def create_meeting(meeting: Meeting, request: Request):
    """Create a meeting"""
    user = await get_current_user(request)
    meeting_data = meeting.model_dump()
    meeting_data["created_by"] = user.user_id
    await db.meetings.insert_one(meeting_data)
    return await db.meetings.find_one({"meeting_id": meeting_data["meeting_id"]}, {"_id": 0})

@api_router.get("/practice/meetings")
async def get_meetings(request: Request, client_id: Optional[str] = None, status: Optional[str] = None):
    """Get meetings with optional filters"""
    await get_current_user(request)
    query = {}
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status
    
    meetings = await db.meetings.find(query, {"_id": 0}).sort("scheduled_at", 1).to_list(100)
    return meetings

@api_router.put("/practice/meetings/{meeting_id}")
async def update_meeting(meeting_id: str, meeting: Meeting, request: Request):
    """Update a meeting"""
    await get_current_user(request)
    meeting_data = meeting.model_dump()
    meeting_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.meetings.update_one(
        {"meeting_id": meeting_id},
        {"$set": meeting_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    return await db.meetings.find_one({"meeting_id": meeting_id}, {"_id": 0})

# Task Tracking Endpoints
@api_router.post("/practice/tasks")
async def create_task(task: Task, request: Request):
    """Create a task"""
    user = await get_current_user(request)
    task_data = task.model_dump()
    task_data["created_by"] = user.user_id
    await db.tasks.insert_one(task_data)
    return await db.tasks.find_one({"task_id": task_data["task_id"]}, {"_id": 0})

@api_router.get("/practice/tasks")
async def get_tasks(
    request: Request,
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None
):
    """Get tasks with optional filters"""
    await get_current_user(request)
    query = {}
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("due_date", 1).to_list(200)
    return tasks

@api_router.put("/practice/tasks/{task_id}")
async def update_task(task_id: str, task: Task, request: Request):
    """Update a task"""
    await get_current_user(request)
    task_data = task.model_dump()
    task_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if task_data.get("status") == "completed" and not task_data.get("completed_at"):
        task_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tasks.update_one(
        {"task_id": task_id},
        {"$set": task_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return await db.tasks.find_one({"task_id": task_id}, {"_id": 0})

# Time Tracking Endpoints
@api_router.post("/practice/time-entries")
async def create_time_entry(entry: TimeEntry, request: Request):
    """Create a time entry"""
    user = await get_current_user(request)
    entry_data = entry.model_dump()
    entry_data["created_by"] = user.user_id
    await db.time_entries.insert_one(entry_data)
    return await db.time_entries.find_one({"entry_id": entry_data["entry_id"]}, {"_id": 0})

@api_router.get("/practice/time-entries")
async def get_time_entries(
    request: Request,
    client_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get time entries with filters"""
    await get_current_user(request)
    query = {}
    if client_id:
        query["client_id"] = client_id
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    entries = await db.time_entries.find(query, {"_id": 0}).sort("date", -1).to_list(500)
    
    # Calculate totals
    total_hours = sum(e.get("hours", 0) for e in entries)
    billable_hours = sum(e.get("hours", 0) for e in entries if e.get("is_billable"))
    total_value = sum(e.get("hours", 0) * e.get("hourly_rate", 0) for e in entries if e.get("is_billable"))
    
    return {
        "entries": entries,
        "summary": {
            "total_entries": len(entries),
            "total_hours": total_hours,
            "billable_hours": billable_hours,
            "non_billable_hours": total_hours - billable_hours,
            "total_billable_value": total_value
        }
    }

# Invoice Endpoints
@api_router.post("/practice/invoices")
async def create_invoice(invoice: Invoice, request: Request):
    """Create an invoice"""
    user = await get_current_user(request)
    invoice_data = invoice.model_dump()
    invoice_data["created_by"] = user.user_id
    await db.invoices.insert_one(invoice_data)
    return await db.invoices.find_one({"invoice_id": invoice_data["invoice_id"]}, {"_id": 0})

@api_router.get("/practice/invoices")
async def get_invoices(request: Request, client_id: Optional[str] = None, status: Optional[str] = None):
    """Get invoices with optional filters"""
    await get_current_user(request)
    query = {}
    if client_id:
        query["client_id"] = client_id
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("issue_date", -1).to_list(200)
    
    # Calculate totals
    total_invoiced = sum(i.get("total", 0) for i in invoices)
    total_paid = sum(i.get("total", 0) for i in invoices if i.get("status") == "paid")
    total_outstanding = sum(i.get("total", 0) for i in invoices if i.get("status") in ["sent", "overdue"])
    
    return {
        "invoices": invoices,
        "summary": {
            "total_invoices": len(invoices),
            "total_invoiced": total_invoiced,
            "total_paid": total_paid,
            "total_outstanding": total_outstanding
        }
    }

@api_router.put("/practice/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, status: str, request: Request):
    """Update invoice status"""
    await get_current_user(request)
    if status not in ["draft", "sent", "paid", "overdue", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.invoices.update_one(
        {"invoice_id": invoice_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})

# Compliance Audit Trail
@api_router.post("/practice/compliance")
async def create_compliance_record(record: ComplianceRecord, request: Request):
    """Create a compliance record"""
    user = await get_current_user(request)
    record_data = record.model_dump()
    record_data["created_by"] = user.user_id
    await db.compliance_records.insert_one(record_data)
    return await db.compliance_records.find_one({"record_id": record_data["record_id"]}, {"_id": 0})

@api_router.get("/practice/compliance/{client_id}")
async def get_compliance_records(client_id: str, request: Request):
    """Get compliance records for a client"""
    await get_current_user(request)
    records = await db.compliance_records.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(100)
    
    # Check for upcoming compliance items
    today = datetime.now(timezone.utc).date().isoformat()
    upcoming_items = [
        r for r in records 
        if r.get("next_due") and r.get("next_due") >= today
    ]
    overdue_items = [
        r for r in records 
        if r.get("next_due") and r.get("next_due") < today
    ]
    
    return {
        "records": records,
        "summary": {
            "total_records": len(records),
            "upcoming_due": len(upcoming_items),
            "overdue": len(overdue_items)
        }
    }

# Practice Dashboard Summary
@api_router.get("/practice/dashboard")
async def get_practice_dashboard(request: Request):
    """Get practice management dashboard summary"""
    await get_current_user(request)
    
    today = datetime.now(timezone.utc).date().isoformat()
    this_week = (datetime.now(timezone.utc) + timedelta(days=7)).date().isoformat()
    
    # Get upcoming meetings
    upcoming_meetings = await db.meetings.find(
        {"scheduled_at": {"$gte": today}, "status": "scheduled"},
        {"_id": 0}
    ).sort("scheduled_at", 1).to_list(10)
    
    # Get pending tasks
    pending_tasks = await db.tasks.find(
        {"status": {"$in": ["pending", "in_progress"]}},
        {"_id": 0}
    ).sort("due_date", 1).to_list(20)
    
    # Get urgent tasks (due this week)
    urgent_tasks = [t for t in pending_tasks if t.get("due_date", "") <= this_week]
    
    # Get recent time entries
    recent_time = await db.time_entries.find(
        {},
        {"_id": 0}
    ).sort("date", -1).to_list(30)
    
    # Calculate this month's billing
    month_start = datetime.now(timezone.utc).replace(day=1).date().isoformat()
    monthly_entries = [e for e in recent_time if e.get("date", "") >= month_start]
    monthly_hours = sum(e.get("hours", 0) for e in monthly_entries)
    monthly_billable = sum(
        e.get("hours", 0) * e.get("hourly_rate", 0) 
        for e in monthly_entries if e.get("is_billable")
    )
    
    # Get outstanding invoices
    outstanding_invoices = await db.invoices.find(
        {"status": {"$in": ["sent", "overdue"]}},
        {"_id": 0}
    ).to_list(50)
    total_outstanding = sum(i.get("total", 0) for i in outstanding_invoices)
    
    return {
        "upcoming_meetings": upcoming_meetings[:5],
        "urgent_tasks": urgent_tasks[:10],
        "pending_tasks_count": len(pending_tasks),
        "billing_summary": {
            "monthly_hours": monthly_hours,
            "monthly_billable_value": monthly_billable,
            "outstanding_invoices": len(outstanding_invoices),
            "total_outstanding": total_outstanding
        },
        "recent_activity": {
            "time_entries_this_month": len(monthly_entries)
        }
    }

# ==================== FACT-FIND & DIGITAL ONBOARDING ====================

class FactFindData(BaseModel):
    client_id: str
    data: Dict[str, Any]
    progress: int = 0
    status: str = "in_progress"  # in_progress, completed, pending_review
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/factfind")
async def save_factfind(factfind: FactFindData):
    """Save or update client fact-find data"""
    factfind_dict = factfind.dict()
    factfind_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    factfind_dict["created_at"] = factfind_dict["created_at"].isoformat() if isinstance(factfind_dict["created_at"], datetime) else factfind_dict["created_at"]
    
    # Upsert - update if exists, insert if not
    result = await db.factfinds.update_one(
        {"client_id": factfind.client_id},
        {"$set": factfind_dict},
        upsert=True
    )
    
    return {"success": True, "client_id": factfind.client_id, "modified": result.modified_count > 0}

@api_router.get("/factfind/{client_id}")
async def get_factfind(client_id: str):
    """Get client fact-find data"""
    factfind = await db.factfinds.find_one({"client_id": client_id}, {"_id": 0})
    if not factfind:
        raise HTTPException(status_code=404, detail="Fact-find not found")
    return factfind

@api_router.get("/factfinds")
async def list_factfinds():
    """List all fact-finds with summary"""
    factfinds = await db.factfinds.find({}, {"_id": 0}).to_list(100)
    return {"factfinds": factfinds, "total": len(factfinds)}

# ==================== E-SIGNATURE / DOCUSIGN MOCK ====================

class SignatureRequest(BaseModel):
    request_id: str = Field(default_factory=lambda: f"sig_{uuid.uuid4().hex[:12]}")
    document_id: str
    document_name: str
    client_id: str
    client_name: str
    client_email: str
    message: Optional[str] = None
    status: str = "pending"  # pending, sent, partially_signed, completed, expired, cancelled
    signatures: List[Dict[str, Any]] = []
    sent_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

@api_router.post("/esignature/send")
async def send_signature_request(request: SignatureRequest):
    """Send a document for e-signature (mock)"""
    request_dict = request.dict()
    request_dict["sent_at"] = request_dict["sent_at"].isoformat() if isinstance(request_dict["sent_at"], datetime) else request_dict["sent_at"]
    request_dict["expires_at"] = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()
    
    await db.signature_requests.insert_one(request_dict)
    
    return {
        "success": True,
        "request_id": request.request_id,
        "message": f"Signature request sent to {request.client_email} (MOCK)"
    }

@api_router.get("/esignature/requests")
async def list_signature_requests():
    """List all signature requests"""
    requests = await db.signature_requests.find({}, {"_id": 0}).to_list(100)
    return {"requests": requests, "total": len(requests)}

@api_router.post("/esignature/sign/{request_id}")
async def sign_document(request_id: str, signature_data: Dict[str, Any]):
    """Sign a document (mock)"""
    # Find the request
    sig_request = await db.signature_requests.find_one({"request_id": request_id})
    if not sig_request:
        raise HTTPException(status_code=404, detail="Signature request not found")
    
    # Add signature
    new_signature = {
        "role": signature_data.get("role", "client"),
        "name": signature_data.get("name"),
        "signed_at": datetime.now(timezone.utc).isoformat()
    }
    
    signatures = sig_request.get("signatures", [])
    signatures.append(new_signature)
    
    # Update status
    status = "completed" if len(signatures) >= 2 else "partially_signed"
    completed_at = datetime.now(timezone.utc).isoformat() if status == "completed" else None
    
    await db.signature_requests.update_one(
        {"request_id": request_id},
        {"$set": {"signatures": signatures, "status": status, "completed_at": completed_at}}
    )
    
    return {"success": True, "status": status, "signatures_count": len(signatures)}

@api_router.get("/esignature/{request_id}")
async def get_signature_request(request_id: str):
    """Get signature request details"""
    request = await db.signature_requests.find_one({"request_id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Signature request not found")
    return request

# ==================== MFA / TWO-FACTOR AUTHENTICATION ====================

class MFASetup(BaseModel):
    user_id: str
    enabled: bool = False
    method: Optional[str] = None  # totp, sms, email
    secret: Optional[str] = None
    backup_codes: List[Dict[str, Any]] = []
    setup_at: Optional[datetime] = None

@api_router.post("/mfa/setup")
async def setup_mfa(setup: MFASetup):
    """Setup or update MFA for user"""
    setup_dict = setup.dict()
    if setup.setup_at:
        setup_dict["setup_at"] = setup.setup_at.isoformat()
    else:
        setup_dict["setup_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.mfa_settings.update_one(
        {"user_id": setup.user_id},
        {"$set": setup_dict},
        upsert=True
    )
    
    return {"success": True, "user_id": setup.user_id, "mfa_enabled": setup.enabled}

@api_router.get("/mfa/{user_id}")
async def get_mfa_status(user_id: str):
    """Get MFA status for user"""
    mfa = await db.mfa_settings.find_one({"user_id": user_id}, {"_id": 0})
    if not mfa:
        return {"user_id": user_id, "enabled": False, "method": None}
    return mfa

@api_router.post("/mfa/verify")
async def verify_mfa(data: Dict[str, Any]):
    """Verify MFA code (mock - accepts any 6-digit code)"""
    user_id = data.get("user_id")
    code = data.get("code", "")
    
    # Mock verification - accept any 6-digit code
    if len(code) == 6 and code.isdigit():
        # Update last used
        await db.mfa_settings.update_one(
            {"user_id": user_id},
            {"$set": {"last_used": datetime.now(timezone.utc).isoformat()}}
        )
        return {"success": True, "message": "MFA verification successful (MOCK)"}
    
    return {"success": False, "message": "Invalid MFA code"}

@api_router.post("/mfa/disable")
async def disable_mfa(data: Dict[str, Any]):
    """Disable MFA for user"""
    user_id = data.get("user_id")
    code = data.get("code", "")
    
    # Mock verification
    if len(code) == 6 and code.isdigit():
        await db.mfa_settings.update_one(
            {"user_id": user_id},
            {"$set": {
                "enabled": False,
                "method": None,
                "secret": None,
                "backup_codes": []
            }}
        )
        return {"success": True, "message": "MFA disabled"}
    
    return {"success": False, "message": "Invalid MFA code"}

# ==================== IMPORT/EXPORT API ====================

# Template for client data import
CLIENT_IMPORT_TEMPLATE = {
    "personal": {
        "title": "", "first_name": "", "middle_name": "", "last_name": "",
        "date_of_birth": "", "gender": "", "marital_status": "", "citizenship": "",
        "tax_file_number": "", "address_street": "", "address_suburb": "",
        "address_state": "", "address_postcode": "", "phone_mobile": "",
        "phone_home": "", "email": ""
    },
    "employment": {
        "employment_status": "", "occupation": "", "employer_name": "",
        "years_employed": 0, "salary_gross": 0, "bonus_commission": 0,
        "other_income": 0, "rental_income": 0, "dividend_income": 0
    },
    "assets": {
        "cash_bank": 0, "term_deposits": 0, "shares_managed_funds": 0,
        "superannuation": 0, "investment_property": 0, "home_residence": 0,
        "motor_vehicles": 0, "household_contents": 0, "other_assets": 0
    },
    "liabilities": {
        "home_loan": 0, "investment_loan": 0, "car_loan": 0,
        "personal_loan": 0, "credit_cards": 0, "hecs_help": 0, "other_debts": 0
    },
    "insurance": {
        "life_insurance": 0, "tpd_insurance": 0, "income_protection": 0,
        "trauma_insurance": 0, "health_insurance": "", "has_will": False
    },
    "goals": {
        "retirement_age": 65, "retirement_income": 0
    }
}

ADVISER_IMPORT_TEMPLATE = {
    "adviser_id": "",
    "first_name": "", "last_name": "", "email": "", "phone": "",
    "afsl_number": "", "authorised_representative_number": "",
    "practice_name": "", "practice_address": "",
    "specializations": [], "qualifications": []
}

def flatten_dict(d, parent_key='', sep='_'):
    """Flatten a nested dictionary"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def unflatten_dict(d, sep='_'):
    """Unflatten a dictionary back to nested structure"""
    result = {}
    for key, value in d.items():
        parts = key.split(sep)
        current = result
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value
    return result

@api_router.get("/import/template/{data_type}")
async def get_import_template(data_type: str, format: str = "json"):
    """Get import template for client or adviser data"""
    if data_type == "client":
        template = CLIENT_IMPORT_TEMPLATE
    elif data_type == "adviser":
        template = ADVISER_IMPORT_TEMPLATE
    else:
        raise HTTPException(status_code=400, detail="Invalid data_type. Use 'client' or 'adviser'")
    
    if format == "json":
        return {"template": template, "data_type": data_type}
    
    elif format == "csv":
        # Flatten the template for CSV
        flat_template = flatten_dict(template) if data_type == "client" else template
        df = pd.DataFrame([flat_template])
        output = StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={data_type}_template.csv"}
        )
    
    elif format == "xlsx":
        flat_template = flatten_dict(template) if data_type == "client" else template
        df = pd.DataFrame([flat_template])
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name=data_type.capitalize())
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={data_type}_template.xlsx"}
        )
    
    raise HTTPException(status_code=400, detail="Invalid format. Use 'json', 'csv', or 'xlsx'")

@api_router.post("/import/clients")
async def import_clients(file: UploadFile = File(...)):
    """Import client data from CSV, JSON, or Excel file"""
    filename = file.filename.lower()
    content = await file.read()
    
    try:
        if filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
            if isinstance(data, dict):
                data = [data]
        
        elif filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(content))
            df = df.fillna('')
            data = df.to_dict(orient='records')
            # Unflatten CSV data
            data = [unflatten_dict(record) for record in data]
        
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(BytesIO(content))
            df = df.fillna('')
            data = df.to_dict(orient='records')
            # Unflatten Excel data
            data = [unflatten_dict(record) for record in data]
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use .json, .csv, or .xlsx")
        
        # Process and save each client
        imported = 0
        errors = []
        
        for i, client_data in enumerate(data):
            try:
                # Generate client_id if not provided
                client_id = client_data.get('client_id') or f"client_{uuid.uuid4().hex[:8]}"
                
                # Prepare fact-find data
                factfind = {
                    "client_id": client_id,
                    "data": client_data,
                    "progress": 0,
                    "status": "imported",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "import_source": filename
                }
                
                # Calculate progress based on filled fields
                flat_data = flatten_dict(client_data)
                filled_fields = sum(1 for v in flat_data.values() if v and v != 0)
                total_fields = len(flat_data)
                factfind["progress"] = int((filled_fields / total_fields) * 100) if total_fields > 0 else 0
                
                # Save to MongoDB
                await db.factfinds.update_one(
                    {"client_id": client_id},
                    {"$set": factfind},
                    upsert=True
                )
                imported += 1
                
            except Exception as e:
                errors.append({"row": i + 1, "error": str(e)})
        
        return {
            "success": True,
            "imported": imported,
            "total": len(data),
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.post("/import/advisers")
async def import_advisers(file: UploadFile = File(...)):
    """Import adviser data from CSV, JSON, or Excel file"""
    filename = file.filename.lower()
    content = await file.read()
    
    try:
        if filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
            if isinstance(data, dict):
                data = [data]
        
        elif filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(content))
            df = df.fillna('')
            data = df.to_dict(orient='records')
        
        elif filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(BytesIO(content))
            df = df.fillna('')
            data = df.to_dict(orient='records')
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use .json, .csv, or .xlsx")
        
        # Process and save each adviser
        imported = 0
        errors = []
        
        for i, adviser_data in enumerate(data):
            try:
                adviser_id = adviser_data.get('adviser_id') or f"adv_{uuid.uuid4().hex[:8]}"
                adviser_data['adviser_id'] = adviser_id
                adviser_data['created_at'] = datetime.now(timezone.utc).isoformat()
                adviser_data['updated_at'] = datetime.now(timezone.utc).isoformat()
                adviser_data['import_source'] = filename
                
                await db.advisers.update_one(
                    {"adviser_id": adviser_id},
                    {"$set": adviser_data},
                    upsert=True
                )
                imported += 1
                
            except Exception as e:
                errors.append({"row": i + 1, "error": str(e)})
        
        return {
            "success": True,
            "imported": imported,
            "total": len(data),
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/export/clients")
async def export_clients(format: str = "json", client_ids: Optional[str] = None):
    """Export client data to CSV, JSON, or Excel file"""
    # Build query
    query = {}
    if client_ids:
        ids = [id.strip() for id in client_ids.split(',')]
        query = {"client_id": {"$in": ids}}
    
    # Get data from MongoDB
    factfinds = await db.factfinds.find(query, {"_id": 0}).to_list(1000)
    
    if not factfinds:
        raise HTTPException(status_code=404, detail="No client data found")
    
    # Extract client data
    clients = []
    for ff in factfinds:
        client = ff.get('data', {})
        client['client_id'] = ff.get('client_id')
        client['progress'] = ff.get('progress', 0)
        client['status'] = ff.get('status', 'unknown')
        clients.append(client)
    
    if format == "json":
        return {"clients": clients, "total": len(clients)}
    
    elif format == "csv":
        # Flatten nested data for CSV
        flat_clients = [flatten_dict(c) for c in clients]
        df = pd.DataFrame(flat_clients)
        output = StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=clients_export_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    
    elif format == "xlsx":
        flat_clients = [flatten_dict(c) for c in clients]
        df = pd.DataFrame(flat_clients)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Clients')
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=clients_export_{datetime.now().strftime('%Y%m%d')}.xlsx"}
        )
    
    raise HTTPException(status_code=400, detail="Invalid format. Use 'json', 'csv', or 'xlsx'")

@api_router.get("/export/advisers")
async def export_advisers(format: str = "json"):
    """Export adviser data to CSV, JSON, or Excel file"""
    advisers = await db.advisers.find({}, {"_id": 0}).to_list(1000)
    
    if not advisers:
        raise HTTPException(status_code=404, detail="No adviser data found")
    
    if format == "json":
        return {"advisers": advisers, "total": len(advisers)}
    
    elif format == "csv":
        df = pd.DataFrame(advisers)
        output = StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=advisers_export_{datetime.now().strftime('%Y%m%d')}.csv"}
        )
    
    elif format == "xlsx":
        df = pd.DataFrame(advisers)
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Advisers')
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=advisers_export_{datetime.now().strftime('%Y%m%d')}.xlsx"}
        )
    
    raise HTTPException(status_code=400, detail="Invalid format. Use 'json', 'csv', or 'xlsx'")

@api_router.get("/advisers")
async def list_advisers():
    """List all advisers"""
    advisers = await db.advisers.find({}, {"_id": 0}).to_list(100)
    return {"advisers": advisers, "total": len(advisers)}

@api_router.get("/advisers/{adviser_id}")
async def get_adviser(adviser_id: str):
    """Get adviser details"""
    adviser = await db.advisers.find_one({"adviser_id": adviser_id}, {"_id": 0})
    if not adviser:
        raise HTTPException(status_code=404, detail="Adviser not found")
    return adviser

# ==================== STRATEGIC PLANNING - INVESTMENT ANALYSIS ====================

# Tax rates by structure
TAX_STRUCTURES = {
    "personal": {
        "name": "Personal/Joint",
        "income_tax_brackets": [
            {"threshold": 18200, "rate": 0},
            {"threshold": 45000, "rate": 0.19},
            {"threshold": 120000, "rate": 0.325},
            {"threshold": 180000, "rate": 0.37},
            {"threshold": float('inf'), "rate": 0.45}
        ],
        "cgt_discount": 0.50,  # 50% discount if held > 12 months
        "medicare_levy": 0.02,
        "franking_credit_refundable": True
    },
    "company": {
        "name": "Company",
        "flat_tax_rate": 0.25,  # Base rate entity
        "cgt_discount": 0,  # No CGT discount for companies
        "retained_earnings_tax": 0.25,
        "dividend_distribution_franking": 0.25,
        "franking_credit_refundable": False
    },
    "trust": {
        "name": "Family Trust",
        "distribution_flexibility": True,
        "streaming_allowed": True,
        "cgt_discount": 0.50,  # If distributed to individuals
        "income_tax": "distributed_to_beneficiaries",
        "franking_credit_refundable": True  # If distributed to individuals
    },
    "smsf": {
        "name": "SMSF",
        "accumulation_tax_rate": 0.15,
        "pension_phase_tax_rate": 0,
        "cgt_discount": 0.333,  # 1/3 discount (effectively 10% tax)
        "contribution_caps": {
            "concessional": 27500,
            "non_concessional": 110000
        }
    }
}

# Asset class expected returns and characteristics
ASSET_CLASSES = {
    "au_shares": {
        "name": "Australian Shares",
        "expected_return": 0.08,  # 8% average
        "volatility": 0.18,
        "dividend_yield": 0.04,
        "franking_rate": 0.70,  # 70% of dividends are franked
        "growth_component": 0.04,
        "income_component": 0.04
    },
    "international_shares": {
        "name": "International Shares",
        "expected_return": 0.09,
        "volatility": 0.20,
        "dividend_yield": 0.02,
        "franking_rate": 0,  # No franking on international
        "growth_component": 0.07,
        "income_component": 0.02,
        "currency_risk": True
    },
    "property": {
        "name": "Property",
        "expected_return": 0.07,
        "volatility": 0.12,
        "rental_yield": 0.035,
        "growth_component": 0.035,
        "income_component": 0.035,
        "depreciation_benefits": True,
        "negative_gearing_eligible": True
    },
    "crypto": {
        "name": "Cryptocurrency",
        "expected_return": 0.15,  # Higher expected return
        "volatility": 0.80,  # Very high volatility
        "dividend_yield": 0,
        "growth_component": 0.15,
        "income_component": 0,
        "cgt_asset": True,
        "no_franking": True
    },
    "bonds": {
        "name": "Bonds/Fixed Interest",
        "expected_return": 0.045,
        "volatility": 0.05,
        "interest_yield": 0.045,
        "growth_component": 0,
        "income_component": 0.045
    },
    "cash": {
        "name": "Cash/Term Deposits",
        "expected_return": 0.04,
        "volatility": 0.01,
        "interest_yield": 0.04,
        "growth_component": 0,
        "income_component": 0.04
    }
}

def calculate_personal_tax(income: float) -> float:
    """Calculate personal income tax"""
    tax = 0
    prev_threshold = 0
    for bracket in TAX_STRUCTURES["personal"]["income_tax_brackets"]:
        if income > bracket["threshold"]:
            tax += (bracket["threshold"] - prev_threshold) * bracket["rate"]
            prev_threshold = bracket["threshold"]
        else:
            tax += (income - prev_threshold) * bracket["rate"]
            break
    # Add Medicare levy
    tax += income * TAX_STRUCTURES["personal"]["medicare_levy"]
    return tax

def calculate_investment_outcome(
    investment_amount: float,
    asset_class: str,
    holding_period_years: int,
    tax_structure: str,
    marginal_tax_rate: float = 0.37
) -> Dict[str, Any]:
    """Calculate investment outcome for a given asset class and tax structure"""
    
    asset = ASSET_CLASSES.get(asset_class)
    if not asset:
        return {"error": "Invalid asset class"}
    
    structure = TAX_STRUCTURES.get(tax_structure)
    if not structure:
        return {"error": "Invalid tax structure"}
    
    # Calculate gross returns
    growth_return = investment_amount * ((1 + asset["growth_component"]) ** holding_period_years - 1)
    income_return = investment_amount * asset.get("income_component", 0) * holding_period_years
    
    total_gross = growth_return + income_return
    ending_value = investment_amount + total_gross
    
    # Calculate taxes based on structure
    if tax_structure == "personal":
        # Income tax on dividends/interest
        franking_credits = income_return * asset.get("franking_rate", 0) * 0.30 / 0.70
        taxable_income = income_return + franking_credits
        income_tax = taxable_income * marginal_tax_rate - franking_credits
        
        # CGT on growth
        if holding_period_years >= 1:
            cgt_discount = structure["cgt_discount"]
        else:
            cgt_discount = 0
        taxable_gain = growth_return * (1 - cgt_discount)
        cgt = taxable_gain * marginal_tax_rate
        
        total_tax = max(0, income_tax) + cgt
        
    elif tax_structure == "company":
        # Flat tax on all income
        total_tax = total_gross * structure["flat_tax_rate"]
        
    elif tax_structure == "trust":
        # Distributed to beneficiaries - assume distributed to individual at marginal rate
        franking_credits = income_return * asset.get("franking_rate", 0) * 0.30 / 0.70
        taxable_income = income_return + franking_credits
        income_tax = taxable_income * marginal_tax_rate - franking_credits
        
        # CGT with discount if distributed to individuals
        if holding_period_years >= 1:
            cgt_discount = structure["cgt_discount"]
        else:
            cgt_discount = 0
        taxable_gain = growth_return * (1 - cgt_discount)
        cgt = taxable_gain * marginal_tax_rate
        
        total_tax = max(0, income_tax) + cgt
        
    elif tax_structure == "smsf":
        # SMSF rates
        income_tax = income_return * structure["accumulation_tax_rate"]
        
        if holding_period_years >= 1:
            # 1/3 CGT discount
            taxable_gain = growth_return * (1 - structure["cgt_discount"])
        else:
            taxable_gain = growth_return
        cgt = taxable_gain * structure["accumulation_tax_rate"]
        
        total_tax = income_tax + cgt
    else:
        total_tax = 0
    
    after_tax_return = total_gross - total_tax
    after_tax_value = investment_amount + after_tax_return
    
    return {
        "asset_class": asset["name"],
        "tax_structure": structure["name"],
        "investment_amount": investment_amount,
        "holding_period_years": holding_period_years,
        "gross_return": round(total_gross, 2),
        "growth_return": round(growth_return, 2),
        "income_return": round(income_return, 2),
        "total_tax": round(total_tax, 2),
        "after_tax_return": round(after_tax_return, 2),
        "ending_value_gross": round(ending_value, 2),
        "ending_value_after_tax": round(after_tax_value, 2),
        "effective_tax_rate": round((total_tax / total_gross * 100) if total_gross > 0 else 0, 2),
        "annualized_return_gross": round((((ending_value / investment_amount) ** (1/holding_period_years)) - 1) * 100, 2),
        "annualized_return_after_tax": round((((after_tax_value / investment_amount) ** (1/holding_period_years)) - 1) * 100, 2)
    }

@api_router.post("/strategic/investment-comparison")
async def compare_investments(data: Dict[str, Any]):
    """Compare investment outcomes across asset classes and tax structures"""
    investment_amount = data.get("investment_amount", 100000)
    holding_period = data.get("holding_period_years", 10)
    marginal_tax_rate = data.get("marginal_tax_rate", 0.37)
    asset_classes = data.get("asset_classes", list(ASSET_CLASSES.keys()))
    tax_structures = data.get("tax_structures", list(TAX_STRUCTURES.keys()))
    
    results = []
    
    for asset_class in asset_classes:
        for tax_structure in tax_structures:
            outcome = calculate_investment_outcome(
                investment_amount,
                asset_class,
                holding_period,
                tax_structure,
                marginal_tax_rate
            )
            if "error" not in outcome:
                results.append(outcome)
    
    # Sort by after-tax return
    results.sort(key=lambda x: x["after_tax_return"], reverse=True)
    
    # Find best option per asset class
    best_by_asset = {}
    for result in results:
        asset = result["asset_class"]
        if asset not in best_by_asset:
            best_by_asset[asset] = result
        elif result["after_tax_return"] > best_by_asset[asset]["after_tax_return"]:
            best_by_asset[asset] = result
    
    # Find best option per structure
    best_by_structure = {}
    for result in results:
        structure = result["tax_structure"]
        if structure not in best_by_structure:
            best_by_structure[structure] = result
        elif result["after_tax_return"] > best_by_structure[structure]["after_tax_return"]:
            best_by_structure[structure] = result
    
    return {
        "parameters": {
            "investment_amount": investment_amount,
            "holding_period_years": holding_period,
            "marginal_tax_rate": marginal_tax_rate
        },
        "all_results": results,
        "best_overall": results[0] if results else None,
        "best_by_asset_class": best_by_asset,
        "best_by_tax_structure": best_by_structure,
        "asset_classes": ASSET_CLASSES,
        "tax_structures": TAX_STRUCTURES
    }

@api_router.get("/strategic/tax-structures")
async def get_tax_structures():
    """Get available tax structures and their characteristics"""
    # Make a copy and replace float('inf') with None for JSON serialization
    import copy
    tax_structures_json = copy.deepcopy(TAX_STRUCTURES)
    if "personal" in tax_structures_json and "income_tax_brackets" in tax_structures_json["personal"]:
        for bracket in tax_structures_json["personal"]["income_tax_brackets"]:
            if bracket.get("threshold") == float('inf'):
                bracket["threshold"] = None
    return {"tax_structures": tax_structures_json}

@api_router.get("/strategic/asset-classes")
async def get_asset_classes():
    """Get available asset classes and their characteristics"""
    return {"asset_classes": ASSET_CLASSES}

@api_router.get("/")
async def root():
    return {"message": "Australian Investment Analyzer API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
