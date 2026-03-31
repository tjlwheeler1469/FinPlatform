"""
Services Australia Age Pension Calculator API
Estimates Age Pension eligibility and payments based on current rates (2025-2026)
Note: This is an estimation tool - actual pension depends on Centrelink assessment
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

router = APIRouter(prefix="/age-pension", tags=["Age Pension"])

# Age Pension rates as of March 2026 (per fortnight)
# Source: Services Australia - updated rates
PENSION_RATES = {
    "single": {
        "max_basic_rate": 1116.30,
        "pension_supplement": 81.60,
        "energy_supplement": 14.10,
        "max_total": 1212.00  # per fortnight
    },
    "couple_combined": {
        "max_basic_rate": 1682.80,  # combined
        "pension_supplement": 123.00,  # combined
        "energy_supplement": 21.20,  # combined  
        "max_total": 1827.00  # per fortnight combined
    },
    "couple_each": {
        "max_basic_rate": 841.40,
        "pension_supplement": 61.50,
        "energy_supplement": 10.60,
        "max_total": 913.50  # per fortnight each
    }
}

# Asset test limits (as of March 2026)
ASSET_LIMITS = {
    "single_homeowner": {
        "full_pension": 314000,
        "part_pension": 695500
    },
    "single_non_homeowner": {
        "full_pension": 566000,
        "part_pension": 947500
    },
    "couple_homeowner": {
        "full_pension": 470000,
        "part_pension": 1045500
    },
    "couple_non_homeowner": {
        "full_pension": 722000,
        "part_pension": 1297500
    }
}

# Income test limits (per fortnight)
INCOME_LIMITS = {
    "single": {
        "free_area": 204,  # No reduction below this
        "taper_rate": 0.50  # 50c reduction per $1 over free area
    },
    "couple_combined": {
        "free_area": 360,
        "taper_rate": 0.50
    }
}

# Age Pension age based on birth date
def get_pension_age(birth_date: date) -> float:
    """Get Age Pension age based on birth date"""
    if birth_date < date(1952, 7, 1):
        return 65.0
    elif birth_date < date(1953, 7, 1):
        return 65.5
    elif birth_date < date(1954, 7, 1):
        return 66.0
    elif birth_date < date(1955, 7, 1):
        return 66.5
    else:
        return 67.0  # Anyone born after 1 July 1957

class RelationshipStatus(str, Enum):
    single = "single"
    couple = "couple"

class PensionRequest(BaseModel):
    birth_date: str  # ISO format YYYY-MM-DD
    partner_birth_date: Optional[str] = None
    relationship_status: RelationshipStatus = RelationshipStatus.single
    is_homeowner: bool = True
    
    # Assets (excluding home if homeowner)
    financial_assets: float = 0  # Bank, super, shares, managed funds
    investment_property_value: float = 0
    other_assets: float = 0  # Cars, boats, personal effects over $10k
    
    # Income (fortnightly)
    employment_income: float = 0
    investment_income: float = 0  # Deemed income calculated if not provided
    other_income: float = 0
    
    # Super and pension
    super_balance: float = 0
    account_based_pension_balance: float = 0

class PensionResult(BaseModel):
    eligible: bool
    pension_age: float
    years_until_eligible: float
    current_age: float
    
    # Payment estimates (fortnightly)
    estimated_payment_fortnight: float
    estimated_payment_annual: float
    
    # Test results
    assets_test_result: str  # "full", "part", "ineligible"
    income_test_result: str  # "full", "part", "ineligible"
    
    # Breakdown
    total_assessable_assets: float
    total_assessable_income: float
    asset_limit_used: float
    income_free_area: float
    
    # Recommendations
    recommendations: List[str]
    
    # Disclaimers
    disclaimer: str

def calculate_deemed_income(financial_assets: float, is_single: bool) -> float:
    """Calculate deemed income from financial assets per fortnight"""
    # Deeming thresholds (single: $60,400, couple: $100,200)
    if is_single:
        threshold = 60400
        lower_rate = 0.0025 / 26  # 0.25% p.a. converted to fortnightly
        higher_rate = 0.0225 / 26  # 2.25% p.a. converted to fortnightly
    else:
        threshold = 100200
        lower_rate = 0.0025 / 26
        higher_rate = 0.0225 / 26
    
    if financial_assets <= threshold:
        return financial_assets * lower_rate
    else:
        below_threshold = threshold * lower_rate
        above_threshold = (financial_assets - threshold) * higher_rate
        return below_threshold + above_threshold

def calculate_age(birth_date_str: str) -> float:
    """Calculate current age from birth date"""
    birth = datetime.strptime(birth_date_str, "%Y-%m-%d").date()
    today = date.today()
    age = today.year - birth.year
    if today.month < birth.month or (today.month == birth.month and today.day < birth.day):
        age -= 1
    # Add partial year
    days_since_birthday = (today - date(today.year, birth.month, birth.day)).days
    if days_since_birthday < 0:
        days_since_birthday = (today - date(today.year - 1, birth.month, birth.day)).days
    age += days_since_birthday / 365.25
    return round(age, 1)

@router.post("/calculate", response_model=PensionResult)
async def calculate_pension(request: PensionRequest):
    """Calculate Age Pension eligibility and estimated payment"""
    
    # Calculate ages
    birth_date = datetime.strptime(request.birth_date, "%Y-%m-%d").date()
    current_age = calculate_age(request.birth_date)
    pension_age = get_pension_age(birth_date)
    years_until_eligible = max(0, pension_age - current_age)
    
    is_single = request.relationship_status == RelationshipStatus.single
    is_homeowner = request.is_homeowner
    
    # Calculate total assessable assets
    total_assets = (
        request.financial_assets +
        request.investment_property_value +
        request.other_assets +
        request.super_balance +
        request.account_based_pension_balance
    )
    
    # Get asset limits
    if is_single:
        limits_key = "single_homeowner" if is_homeowner else "single_non_homeowner"
    else:
        limits_key = "couple_homeowner" if is_homeowner else "couple_non_homeowner"
    
    asset_limits = ASSET_LIMITS[limits_key]
    
    # Determine asset test result
    if total_assets <= asset_limits["full_pension"]:
        asset_test_result = "full"
    elif total_assets <= asset_limits["part_pension"]:
        asset_test_result = "part"
    else:
        asset_test_result = "ineligible"
    
    # Calculate income (fortnightly)
    deemed_income = calculate_deemed_income(
        request.financial_assets + request.super_balance + request.account_based_pension_balance,
        is_single
    )
    
    total_income = (
        request.employment_income +
        (request.investment_income if request.investment_income > 0 else deemed_income) +
        request.other_income
    )
    
    # Get income test parameters
    income_key = "single" if is_single else "couple_combined"
    income_params = INCOME_LIMITS[income_key]
    
    # Determine income test result
    if total_income <= income_params["free_area"]:
        income_test_result = "full"
    else:
        income_test_result = "part"
    
    # Get max pension rate
    rate_key = "single" if is_single else "couple_combined"
    max_pension = PENSION_RATES[rate_key]["max_total"]
    
    # Calculate payment based on tests (take lower of asset or income test)
    
    # Asset test reduction
    if asset_test_result == "full":
        asset_payment = max_pension
    elif asset_test_result == "part":
        # $3 reduction per $1000 over full pension limit (per fortnight)
        excess_assets = total_assets - asset_limits["full_pension"]
        asset_reduction = (excess_assets / 1000) * 3
        asset_payment = max(0, max_pension - asset_reduction)
    else:
        asset_payment = 0
    
    # Income test reduction
    if income_test_result == "full":
        income_payment = max_pension
    else:
        excess_income = total_income - income_params["free_area"]
        income_reduction = excess_income * income_params["taper_rate"]
        income_payment = max(0, max_pension - income_reduction)
    
    # Final payment is lower of two tests
    estimated_payment = min(asset_payment, income_payment)
    
    # Check eligibility
    eligible = years_until_eligible <= 0 and estimated_payment > 0
    
    # Generate recommendations
    recommendations = []
    
    if years_until_eligible > 0:
        recommendations.append(f"You will be eligible for Age Pension in {years_until_eligible:.1f} years at age {pension_age}.")
    
    if asset_test_result == "ineligible":
        over_limit = total_assets - asset_limits["part_pension"]
        recommendations.append(f"Your assets exceed the limit by ${over_limit:,.0f}. Consider spending down or gifting strategies (within limits).")
    
    if estimated_payment < max_pension and estimated_payment > 0:
        if asset_payment < income_payment:
            recommendations.append("Your payment is limited by the assets test. Spending down assets may increase your pension.")
        else:
            recommendations.append("Your payment is limited by the income test. Reducing assessable income may increase your pension.")
    
    if request.super_balance > 0 and years_until_eligible > 0:
        recommendations.append("Consider your super drawdown strategy - it affects both assets and deemed income tests.")
    
    if not recommendations:
        recommendations.append("You appear eligible for the full Age Pension rate.")
    
    return PensionResult(
        eligible=eligible,
        pension_age=pension_age,
        years_until_eligible=years_until_eligible,
        current_age=current_age,
        estimated_payment_fortnight=round(estimated_payment, 2),
        estimated_payment_annual=round(estimated_payment * 26, 2),
        assets_test_result=asset_test_result,
        income_test_result=income_test_result,
        total_assessable_assets=total_assets,
        total_assessable_income=round(total_income, 2),
        asset_limit_used=asset_limits["full_pension"],
        income_free_area=income_params["free_area"],
        recommendations=recommendations,
        disclaimer="This is an estimate only. Actual Age Pension entitlement is determined by Services Australia based on your full circumstances. Rates and thresholds are subject to change."
    )

@router.get("/rates")
async def get_current_rates():
    """Get current Age Pension rates and thresholds"""
    return {
        "effective_date": "2026-03-20",
        "pension_rates": PENSION_RATES,
        "asset_limits": ASSET_LIMITS,
        "income_limits": INCOME_LIMITS,
        "deeming_rates": {
            "lower_rate": "0.25% p.a.",
            "higher_rate": "2.25% p.a.",
            "single_threshold": 60400,
            "couple_threshold": 100200
        },
        "pension_age": "67 (for anyone born after 1 January 1957)",
        "source": "Services Australia (estimated rates for 2025-2026)"
    }
