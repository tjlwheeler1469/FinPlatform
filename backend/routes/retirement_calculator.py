"""
Retirement Calculator - SMSF Planning Module
Comprehensive accumulation phase planning with various profiles, contributions, and asset modeling
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import math

router = APIRouter(prefix="/retirement", tags=["Retirement Calculator"])

# ============== ENUMS ==============

class InvestmentProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATELY_CONSERVATIVE = "moderately_conservative"
    BALANCED = "balanced"
    GROWTH = "growth"
    AGGRESSIVE = "aggressive"
    CUSTOM = "custom"

class FundType(str, Enum):
    INDUSTRY = "industry"
    RETAIL = "retail"
    SMSF = "smsf"
    SMA = "sma"  # Separately Managed Account
    MANAGED_ACCOUNT = "managed_account"

class AssetClass(str, Enum):
    CASH = "cash"
    FIXED_INCOME = "fixed_income"
    AUSTRALIAN_SHARES = "australian_shares"
    INTERNATIONAL_SHARES = "international_shares"
    PROPERTY = "property"
    INFRASTRUCTURE = "infrastructure"
    ALTERNATIVES = "alternatives"
    COMMODITIES = "commodities"

# ============== CONSTANTS - FY 2024-25 ==============

SUPER_CAPS = {
    "concessional_cap": 30000,  # Per year
    "non_concessional_cap": 120000,  # Per year
    "bring_forward_cap": 360000,  # 3-year bring forward
    "total_super_balance_threshold": 1900000,  # For contribution eligibility
    "preservation_age": 60,  # From 1 July 1964 onwards
    "transfer_balance_cap": 1900000,
    "div_293_threshold": 250000,  # Additional 15% tax
    "sg_rate": 11.5,  # Superannuation Guarantee rate %
    "low_income_threshold": 45400,  # For spouse contribution tax offset
    "government_co_contribution_threshold": 60400,
}

INVESTMENT_PROFILES = {
    "conservative": {
        "name": "Conservative",
        "description": "Lower risk, stable returns. Suitable for those close to retirement.",
        "target_return": 5.0,
        "volatility": 4.0,
        "allocation": {
            "cash": 20,
            "fixed_income": 45,
            "australian_shares": 15,
            "international_shares": 10,
            "property": 5,
            "alternatives": 5,
        }
    },
    "moderately_conservative": {
        "name": "Moderately Conservative",
        "description": "Balanced with a tilt towards defensive assets.",
        "target_return": 6.0,
        "volatility": 6.0,
        "allocation": {
            "cash": 10,
            "fixed_income": 35,
            "australian_shares": 25,
            "international_shares": 15,
            "property": 10,
            "alternatives": 5,
        }
    },
    "balanced": {
        "name": "Balanced",
        "description": "Mix of growth and defensive assets. Most common choice.",
        "target_return": 7.0,
        "volatility": 9.0,
        "allocation": {
            "cash": 5,
            "fixed_income": 25,
            "australian_shares": 30,
            "international_shares": 25,
            "property": 10,
            "alternatives": 5,
        }
    },
    "growth": {
        "name": "Growth",
        "description": "Higher growth focus with longer investment horizon.",
        "target_return": 8.0,
        "volatility": 12.0,
        "allocation": {
            "cash": 2,
            "fixed_income": 15,
            "australian_shares": 35,
            "international_shares": 30,
            "property": 10,
            "alternatives": 8,
        }
    },
    "aggressive": {
        "name": "Aggressive (High Growth)",
        "description": "Maximum growth potential with higher volatility.",
        "target_return": 9.5,
        "volatility": 16.0,
        "allocation": {
            "cash": 0,
            "fixed_income": 5,
            "australian_shares": 40,
            "international_shares": 40,
            "property": 8,
            "alternatives": 7,
        }
    }
}

ASSET_CLASS_ASSUMPTIONS = {
    "cash": {"expected_return": 4.5, "volatility": 0.5, "income_yield": 4.5},
    "fixed_income": {"expected_return": 5.0, "volatility": 4.0, "income_yield": 4.0},
    "australian_shares": {"expected_return": 8.5, "volatility": 15.0, "income_yield": 4.0},
    "international_shares": {"expected_return": 8.0, "volatility": 16.0, "income_yield": 2.0},
    "property": {"expected_return": 7.0, "volatility": 12.0, "income_yield": 5.0},
    "infrastructure": {"expected_return": 7.5, "volatility": 10.0, "income_yield": 4.5},
    "alternatives": {"expected_return": 7.0, "volatility": 8.0, "income_yield": 3.0},
    "commodities": {"expected_return": 5.5, "volatility": 18.0, "income_yield": 0.0},
}

FUND_COSTS = {
    "industry": {
        "admin_fee_percent": 0.15,
        "admin_fee_flat": 78,
        "investment_fee_percent": 0.50,
        "insurance_default": 500,
    },
    "retail": {
        "admin_fee_percent": 0.30,
        "admin_fee_flat": 100,
        "investment_fee_percent": 0.85,
        "insurance_default": 600,
    },
    "smsf": {
        "accounting_fee": 2500,
        "audit_fee": 800,
        "asic_fee": 65,
        "ato_levy": 259,
        "software_fee": 800,
        "investment_fee_percent": 0.20,
        "insurance_default": 0,  # User arranges separately
    },
    "sma": {
        "admin_fee_percent": 0.20,
        "admin_fee_flat": 0,
        "investment_fee_percent": 0.60,
        "platform_fee_percent": 0.25,
        "insurance_default": 0,
    },
    "managed_account": {
        "admin_fee_percent": 0.25,
        "admin_fee_flat": 0,
        "investment_fee_percent": 0.70,
        "advice_fee_percent": 0.50,
        "insurance_default": 0,
    },
}

# ============== MODELS ==============

class PersonalDetails(BaseModel):
    current_age: int = Field(..., ge=18, le=75)
    retirement_age: int = Field(..., ge=55, le=75)
    gender: str = Field(default="male")  # For life expectancy
    annual_income: float = Field(default=0, ge=0)
    tax_rate: float = Field(default=32.5, ge=0, le=47)  # Marginal tax rate %
    is_client: bool = Field(default=False)  # True if adviser is modeling for client
    client_name: Optional[str] = None

class AssetInput(BaseModel):
    asset_class: str
    current_value: float = Field(ge=0)
    custom_return_rate: Optional[float] = None  # Override default
    custom_yield: Optional[float] = None
    custom_volatility: Optional[float] = None

class ContributionInput(BaseModel):
    # Employer contributions
    employer_sg: float = Field(default=0, ge=0)  # Superannuation Guarantee
    employer_additional: float = Field(default=0, ge=0)  # Employer additional
    # Personal contributions
    salary_sacrifice: float = Field(default=0, ge=0)  # Pre-tax
    personal_deductible: float = Field(default=0, ge=0)  # Deductible contributions
    personal_non_concessional: float = Field(default=0, ge=0)  # After-tax
    # Other
    spouse_contribution: float = Field(default=0, ge=0)
    government_co_contribution: float = Field(default=0, ge=0)
    # Growth rates
    contribution_growth_rate: float = Field(default=3.0)  # Annual % increase
    
class CashflowInput(BaseModel):
    additional_lump_sum_year: Optional[int] = None
    additional_lump_sum_amount: float = Field(default=0, ge=0)
    planned_withdrawals: List[Dict[str, Any]] = Field(default=[])
    
class CostOverrides(BaseModel):
    admin_fee_override: Optional[float] = None
    investment_fee_override: Optional[float] = None
    insurance_override: Optional[float] = None
    advice_fee_override: Optional[float] = None
    accounting_fee_override: Optional[float] = None  # SMSF
    audit_fee_override: Optional[float] = None  # SMSF

class RetirementCalculationRequest(BaseModel):
    personal: PersonalDetails
    current_super_balance: float = Field(default=0, ge=0)
    fund_type: FundType = Field(default=FundType.INDUSTRY)
    investment_profile: InvestmentProfile = Field(default=InvestmentProfile.BALANCED)
    custom_allocation: Optional[Dict[str, float]] = None  # For custom profile
    custom_return_rate: Optional[float] = None  # Override profile return
    assets: List[AssetInput] = Field(default=[])
    contributions: ContributionInput = Field(default_factory=ContributionInput)
    cashflow: CashflowInput = Field(default_factory=CashflowInput)
    cost_overrides: CostOverrides = Field(default_factory=CostOverrides)
    inflation_rate: float = Field(default=2.5)
    include_age_pension: bool = Field(default=True)

class ScenarioCompareRequest(BaseModel):
    scenarios: List[RetirementCalculationRequest]
    scenario_names: List[str]

# ============== CALCULATION FUNCTIONS ==============

def calculate_fund_costs(balance: float, fund_type: str, cost_overrides: CostOverrides) -> Dict[str, float]:
    """Calculate annual fund costs based on fund type and balance"""
    costs = FUND_COSTS.get(fund_type, FUND_COSTS["industry"])
    
    if fund_type == "smsf":
        return {
            "accounting_fee": cost_overrides.accounting_fee_override or costs["accounting_fee"],
            "audit_fee": cost_overrides.audit_fee_override or costs["audit_fee"],
            "asic_fee": costs["asic_fee"],
            "ato_levy": costs["ato_levy"],
            "software_fee": costs["software_fee"],
            "investment_fee": balance * (costs["investment_fee_percent"] / 100),
            "insurance": cost_overrides.insurance_override or costs["insurance_default"],
            "total": 0  # Calculated below
        }
    else:
        admin_fee = (balance * costs["admin_fee_percent"] / 100) + costs.get("admin_fee_flat", 0)
        investment_fee = balance * (cost_overrides.investment_fee_override or costs["investment_fee_percent"]) / 100
        platform_fee = balance * costs.get("platform_fee_percent", 0) / 100
        advice_fee = balance * (cost_overrides.advice_fee_override or costs.get("advice_fee_percent", 0)) / 100
        insurance = cost_overrides.insurance_override or costs["insurance_default"]
        
        return {
            "admin_fee": admin_fee,
            "investment_fee": investment_fee,
            "platform_fee": platform_fee,
            "advice_fee": advice_fee,
            "insurance": insurance,
            "total": admin_fee + investment_fee + platform_fee + advice_fee + insurance
        }

def calculate_contributions_tax(contributions: ContributionInput, income: float) -> Dict[str, float]:
    """Calculate tax on concessional contributions"""
    total_concessional = (
        contributions.employer_sg +
        contributions.employer_additional +
        contributions.salary_sacrifice +
        contributions.personal_deductible
    )
    
    # Standard 15% contributions tax
    standard_tax = total_concessional * 0.15
    
    # Division 293 tax (additional 15% if income > threshold)
    div_293_tax = 0
    if income + total_concessional > SUPER_CAPS["div_293_threshold"]:
        excess = min(total_concessional, (income + total_concessional) - SUPER_CAPS["div_293_threshold"])
        div_293_tax = excess * 0.15
    
    return {
        "total_concessional": total_concessional,
        "standard_tax": standard_tax,
        "div_293_tax": div_293_tax,
        "total_tax": standard_tax + div_293_tax,
        "net_contribution": total_concessional - standard_tax - div_293_tax
    }

def calculate_portfolio_return(allocation: Dict[str, float], assets: List[AssetInput]) -> Dict[str, float]:
    """Calculate expected portfolio return based on allocation"""
    total_return = 0
    total_yield = 0
    total_volatility = 0
    
    # Create asset overrides map
    asset_overrides = {a.asset_class: a for a in assets}
    
    for asset_class, weight in allocation.items():
        if weight <= 0:
            continue
            
        defaults = ASSET_CLASS_ASSUMPTIONS.get(asset_class, ASSET_CLASS_ASSUMPTIONS["cash"])
        override = asset_overrides.get(asset_class)
        
        exp_return = override.custom_return_rate if override and override.custom_return_rate else defaults["expected_return"]
        exp_yield = override.custom_yield if override and override.custom_yield else defaults["income_yield"]
        exp_vol = override.custom_volatility if override and override.custom_volatility else defaults["volatility"]
        
        total_return += (weight / 100) * exp_return
        total_yield += (weight / 100) * exp_yield
        total_volatility += (weight / 100) * exp_vol
    
    return {
        "expected_return": round(total_return, 2),
        "expected_yield": round(total_yield, 2),
        "expected_volatility": round(total_volatility, 2)
    }

def project_balance(
    starting_balance: float,
    years: int,
    annual_return: float,
    annual_contributions: float,
    contribution_growth_rate: float,
    annual_costs: float,
    inflation_rate: float,
    lump_sums: Dict[int, float] = None
) -> List[Dict[str, Any]]:
    """Project balance year by year"""
    projections = []
    balance = starting_balance
    current_contribution = annual_contributions
    
    for year in range(1, years + 1):
        # Start of year balance
        start_balance = balance
        
        # Add lump sum if applicable
        lump_sum = (lump_sums or {}).get(year, 0)
        
        # Add contributions
        balance += current_contribution + lump_sum
        
        # Apply investment returns
        investment_return = balance * (annual_return / 100)
        balance += investment_return
        
        # Deduct costs
        costs = annual_costs * (1 + inflation_rate / 100) ** (year - 1)
        balance -= costs
        
        # Ensure non-negative
        balance = max(0, balance)
        
        # Calculate real (inflation-adjusted) value
        real_balance = balance / ((1 + inflation_rate / 100) ** year)
        
        projections.append({
            "year": year,
            "age": None,  # Set by caller
            "start_balance": round(start_balance, 2),
            "contributions": round(current_contribution + lump_sum, 2),
            "investment_return": round(investment_return, 2),
            "costs": round(costs, 2),
            "end_balance": round(balance, 2),
            "real_balance": round(real_balance, 2)
        })
        
        # Increase contributions for next year
        current_contribution *= (1 + contribution_growth_rate / 100)
    
    return projections

def calculate_retirement_income(balance: float, years_in_retirement: int, return_rate: float) -> Dict[str, float]:
    """Calculate sustainable retirement income using annuity formula"""
    if years_in_retirement <= 0:
        return {"annual_income": 0, "monthly_income": 0}
    
    # Sustainable withdrawal rate accounting for returns
    r = return_rate / 100
    n = years_in_retirement
    
    if r > 0:
        # Annuity formula: PMT = PV * r / (1 - (1 + r)^-n)
        annual_income = balance * r / (1 - (1 + r) ** -n)
    else:
        annual_income = balance / n
    
    return {
        "annual_income": round(annual_income, 2),
        "monthly_income": round(annual_income / 12, 2),
        "sustainable_rate": round((annual_income / balance) * 100, 2) if balance > 0 else 0
    }

# ============== ENDPOINTS ==============

@router.get("/profiles")
async def get_investment_profiles():
    """Get all available investment profiles with allocations"""
    return {
        "profiles": INVESTMENT_PROFILES,
        "asset_assumptions": ASSET_CLASS_ASSUMPTIONS
    }

@router.get("/super-caps")
async def get_super_caps():
    """Get current superannuation contribution caps and thresholds"""
    return {
        "financial_year": "2024-25",
        "caps": SUPER_CAPS,
        "description": {
            "concessional_cap": "Maximum pre-tax contributions (employer + salary sacrifice + personal deductible)",
            "non_concessional_cap": "Maximum after-tax contributions per year",
            "bring_forward_cap": "Maximum 3-year bring-forward for non-concessional (if under threshold)",
            "total_super_balance_threshold": "Balance above which non-concessional caps are reduced",
            "sg_rate": "Current Superannuation Guarantee rate (%)",
        }
    }

@router.get("/fund-costs")
async def get_fund_costs():
    """Get typical costs for different fund types"""
    return {
        "fund_types": FUND_COSTS,
        "notes": {
            "industry": "Industry super funds - typically lower fees",
            "retail": "Retail/bank funds - higher fees but more options",
            "smsf": "Self-Managed Super Fund - fixed costs, suitable for larger balances",
            "sma": "Separately Managed Account - direct share ownership",
            "managed_account": "Managed Account/MDA - adviser discretion"
        }
    }

@router.post("/calculate")
async def calculate_retirement(request: RetirementCalculationRequest):
    """
    Comprehensive retirement projection calculation
    Returns year-by-year projections with various scenarios
    """
    try:
        years_to_retirement = request.personal.retirement_age - request.personal.current_age
        if years_to_retirement <= 0:
            raise HTTPException(status_code=400, detail="Retirement age must be greater than current age")
        
        # Get investment profile allocation
        if request.investment_profile == InvestmentProfile.CUSTOM and request.custom_allocation:
            allocation = request.custom_allocation
        else:
            profile = INVESTMENT_PROFILES.get(request.investment_profile.value, INVESTMENT_PROFILES["balanced"])
            allocation = profile["allocation"]
        
        # Calculate portfolio returns
        portfolio_metrics = calculate_portfolio_return(allocation, request.assets)
        
        # Override return if specified
        annual_return = request.custom_return_rate if request.custom_return_rate else portfolio_metrics["expected_return"]
        
        # Calculate annual contributions
        contrib = request.contributions
        total_concessional = (
            contrib.employer_sg +
            contrib.employer_additional +
            contrib.salary_sacrifice +
            contrib.personal_deductible
        )
        total_non_concessional = contrib.personal_non_concessional
        
        # Tax on contributions
        contrib_tax = calculate_contributions_tax(contrib, request.personal.annual_income)
        
        # Net annual contribution (after contribution tax)
        net_annual_contribution = (
            total_concessional - contrib_tax["total_tax"] +
            total_non_concessional +
            contrib.spouse_contribution +
            contrib.government_co_contribution
        )
        
        # Calculate fund costs
        estimated_avg_balance = request.current_super_balance + (net_annual_contribution * years_to_retirement / 2)
        fund_costs = calculate_fund_costs(estimated_avg_balance, request.fund_type.value, request.cost_overrides)
        annual_costs = fund_costs.get("total", sum(v for k, v in fund_costs.items() if isinstance(v, (int, float)) and k != "total"))
        
        # Prepare lump sums
        lump_sums = {}
        if request.cashflow.additional_lump_sum_year and request.cashflow.additional_lump_sum_amount:
            lump_sums[request.cashflow.additional_lump_sum_year] = request.cashflow.additional_lump_sum_amount
        
        # Project balance
        projections = project_balance(
            starting_balance=request.current_super_balance,
            years=years_to_retirement,
            annual_return=annual_return,
            annual_contributions=net_annual_contribution,
            contribution_growth_rate=contrib.contribution_growth_rate,
            annual_costs=annual_costs,
            inflation_rate=request.inflation_rate,
            lump_sums=lump_sums
        )
        
        # Add age to projections
        for i, proj in enumerate(projections):
            proj["age"] = request.personal.current_age + proj["year"]
        
        # Final balance at retirement
        final_balance = projections[-1]["end_balance"] if projections else request.current_super_balance
        real_final_balance = projections[-1]["real_balance"] if projections else request.current_super_balance
        
        # Calculate retirement income (assuming 25 years in retirement)
        years_in_retirement = 90 - request.personal.retirement_age  # Life expectancy ~90
        retirement_income = calculate_retirement_income(final_balance, years_in_retirement, 5.0)
        
        # Generate scenarios (pessimistic, expected, optimistic)
        scenarios = {
            "pessimistic": {
                "return_rate": annual_return - 2,
                "final_balance": project_balance(
                    request.current_super_balance, years_to_retirement, annual_return - 2,
                    net_annual_contribution, contrib.contribution_growth_rate, annual_costs,
                    request.inflation_rate, lump_sums
                )[-1]["end_balance"] if years_to_retirement > 0 else request.current_super_balance
            },
            "expected": {
                "return_rate": annual_return,
                "final_balance": final_balance
            },
            "optimistic": {
                "return_rate": annual_return + 2,
                "final_balance": project_balance(
                    request.current_super_balance, years_to_retirement, annual_return + 2,
                    net_annual_contribution, contrib.contribution_growth_rate, annual_costs,
                    request.inflation_rate, lump_sums
                )[-1]["end_balance"] if years_to_retirement > 0 else request.current_super_balance
            }
        }
        
        return {
            "calculation_id": f"RET-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            "calculated_at": datetime.now(timezone.utc).isoformat(),
            "is_client_calculation": request.personal.is_client,
            "client_name": request.personal.client_name,
            
            "summary": {
                "current_age": request.personal.current_age,
                "retirement_age": request.personal.retirement_age,
                "years_to_retirement": years_to_retirement,
                "starting_balance": request.current_super_balance,
                "projected_final_balance": final_balance,
                "projected_final_balance_real": real_final_balance,
                "total_contributions": sum(p["contributions"] for p in projections),
                "total_investment_returns": sum(p["investment_return"] for p in projections),
                "total_costs": sum(p["costs"] for p in projections),
            },
            
            "investment": {
                "profile": request.investment_profile.value,
                "allocation": allocation,
                "expected_return": annual_return,
                "expected_yield": portfolio_metrics["expected_yield"],
                "expected_volatility": portfolio_metrics["expected_volatility"],
            },
            
            "contributions": {
                "annual_concessional": total_concessional,
                "annual_non_concessional": total_non_concessional,
                "contribution_tax": contrib_tax,
                "net_annual_contribution": net_annual_contribution,
                "caps_status": {
                    "concessional_remaining": max(0, SUPER_CAPS["concessional_cap"] - total_concessional),
                    "non_concessional_remaining": max(0, SUPER_CAPS["non_concessional_cap"] - total_non_concessional),
                    "within_caps": total_concessional <= SUPER_CAPS["concessional_cap"] and total_non_concessional <= SUPER_CAPS["non_concessional_cap"]
                }
            },
            
            "costs": {
                "fund_type": request.fund_type.value,
                "annual_costs_breakdown": fund_costs,
                "annual_costs_total": annual_costs,
                "lifetime_costs": sum(p["costs"] for p in projections),
            },
            
            "retirement_income": {
                "projected_annual_income": retirement_income["annual_income"],
                "projected_monthly_income": retirement_income["monthly_income"],
                "sustainable_withdrawal_rate": retirement_income["sustainable_rate"],
                "years_in_retirement_assumed": years_in_retirement,
            },
            
            "scenarios": scenarios,
            
            "projections": projections,
            
            "assumptions": {
                "inflation_rate": request.inflation_rate,
                "contribution_growth_rate": contrib.contribution_growth_rate,
                "super_caps": SUPER_CAPS,
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare-scenarios")
async def compare_scenarios(request: ScenarioCompareRequest):
    """Compare multiple retirement scenarios side by side"""
    if len(request.scenarios) != len(request.scenario_names):
        raise HTTPException(status_code=400, detail="Number of scenarios must match number of names")
    
    if len(request.scenarios) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 scenarios can be compared")
    
    results = []
    for i, scenario in enumerate(request.scenarios):
        calc_result = await calculate_retirement(scenario)
        results.append({
            "name": request.scenario_names[i],
            "summary": calc_result["summary"],
            "investment": calc_result["investment"],
            "costs": calc_result["costs"],
            "retirement_income": calc_result["retirement_income"],
        })
    
    return {
        "comparison_id": f"CMP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "compared_at": datetime.now(timezone.utc).isoformat(),
        "scenarios": results,
        "recommendation": _generate_recommendation(results)
    }

def _generate_recommendation(results: List[Dict]) -> str:
    """Generate a recommendation based on scenario comparison"""
    if not results:
        return "No scenarios to compare"
    
    best = max(results, key=lambda x: x["summary"]["projected_final_balance"])
    return f"Based on the analysis, '{best['name']}' provides the highest projected retirement balance of AUD ${best['summary']['projected_final_balance']:,.0f}."

@router.post("/smsf-viability")
async def check_smsf_viability(current_balance: float, expected_contributions_annual: float):
    """Check if SMSF is cost-effective compared to other fund types"""
    
    # Calculate 10-year costs for each fund type
    years = 10
    results = {}
    
    for fund_type in ["industry", "retail", "smsf"]:
        balance = current_balance
        total_costs = 0
        
        for year in range(years):
            balance += expected_contributions_annual
            costs = calculate_fund_costs(balance, fund_type, CostOverrides())
            annual_cost = costs.get("total", sum(v for k, v in costs.items() if isinstance(v, (int, float)) and k != "total"))
            total_costs += annual_cost
            balance += balance * 0.07 - annual_cost  # Assume 7% return
        
        results[fund_type] = {
            "projected_balance": round(balance, 2),
            "total_costs": round(total_costs, 2),
            "average_annual_cost": round(total_costs / years, 2)
        }
    
    # Determine recommendation
    smsf_breakeven = current_balance >= 200000 or (current_balance + expected_contributions_annual * 5) >= 400000
    
    return {
        "current_balance": current_balance,
        "expected_contributions_annual": expected_contributions_annual,
        "ten_year_comparison": results,
        "smsf_recommended": smsf_breakeven,
        "recommendation": (
            "SMSF may be cost-effective for your situation. Consider consulting an SMSF specialist."
            if smsf_breakeven else
            "An industry or retail fund may be more cost-effective until your balance grows above $400,000."
        ),
        "smsf_considerations": [
            "Requires annual audit and accounting",
            "Trustees must comply with superannuation laws",
            "More investment flexibility and control",
            "Can hold direct property",
            "Requires time commitment for administration"
        ]
    }

@router.get("/demo/sample-calculation")
async def get_sample_calculation():
    """Get a sample calculation for demonstration"""
    sample_request = RetirementCalculationRequest(
        personal=PersonalDetails(
            current_age=35,
            retirement_age=65,
            annual_income=120000,
            tax_rate=32.5
        ),
        current_super_balance=150000,
        fund_type=FundType.INDUSTRY,
        investment_profile=InvestmentProfile.BALANCED,
        contributions=ContributionInput(
            employer_sg=13800,  # 11.5% of 120k
            salary_sacrifice=10000,
            personal_non_concessional=5000,
            contribution_growth_rate=3.0
        )
    )
    
    return await calculate_retirement(sample_request)
