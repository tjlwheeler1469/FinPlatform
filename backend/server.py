from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
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
        ],
        "disclaimer": "This report is for informational purposes only and does not constitute financial advice. Consult a qualified financial advisor for personalized recommendations."
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

# ==================== HEALTH CHECK ====================

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
