"""
Age Pension Modeling Service
Australian Age Pension eligibility and payment calculations based on Services Australia rules
"""

import os
import logging
from datetime import datetime, timezone, date
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/age-pension", tags=["Age Pension Modeling"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ==================== AGE PENSION RATES (2024-25) ====================

# Maximum fortnightly rates (as of March 2024)
MAX_PENSION_RATES = {
    "single": {
        "base": 1020.60,
        "pension_supplement": 81.60,
        "energy_supplement": 14.10,
        "total_fortnightly": 1116.30,
        "total_annual": 29023.80
    },
    "couple_combined": {
        "base": 1538.60,
        "pension_supplement": 123.00,
        "energy_supplement": 21.20,
        "total_fortnightly": 1682.80,
        "total_annual": 43752.80
    },
    "couple_each": {
        "base": 769.30,
        "pension_supplement": 61.50,
        "energy_supplement": 10.60,
        "total_fortnightly": 841.40,
        "total_annual": 21876.40
    }
}

# Assets test thresholds (2024-25)
ASSETS_THRESHOLDS = {
    "homeowner": {
        "single": {
            "full_pension": 301750,
            "part_pension_limit": 656500
        },
        "couple_combined": {
            "full_pension": 451500,
            "part_pension_limit": 986500
        }
    },
    "non_homeowner": {
        "single": {
            "full_pension": 543750,
            "part_pension_limit": 898500
        },
        "couple_combined": {
            "full_pension": 693500,
            "part_pension_limit": 1228500
        }
    }
}

# Assets test taper rate: $3 per fortnight for every $1000 over threshold
ASSETS_TAPER_RATE = 3.0  # $ per fortnight per $1000

# Income test thresholds (2024-25)
INCOME_THRESHOLDS = {
    "single": {
        "free_area": 204,  # per fortnight
        "taper_rate": 0.50  # 50 cents per dollar over free area
    },
    "couple_combined": {
        "free_area": 360,  # per fortnight
        "taper_rate": 0.50
    }
}

# Deeming rates (2024-25)
DEEMING_RATES = {
    "lower_rate": 0.0025,  # 0.25% on first threshold
    "higher_rate": 0.0225,  # 2.25% on balance
    "single_threshold": 60400,
    "couple_threshold": 100200
}

# Qualifying age by birth date
def get_qualifying_age(birth_year: int) -> float:
    """Get Age Pension qualifying age based on birth year"""
    if birth_year <= 1952:
        return 65.0
    elif birth_year <= 1953:
        return 65.5
    elif birth_year <= 1955:
        return 66.0
    elif birth_year <= 1956:
        return 66.5
    else:
        return 67.0

# ==================== MODELS ====================

class PersonDetails(BaseModel):
    name: str
    date_of_birth: str  # YYYY-MM-DD
    is_homeowner: bool = True
    residency_years: int = 10  # Years of Australian residency

class AssetDetails(BaseModel):
    financial_assets: float  # Cash, shares, super, managed funds
    real_assets: float = 0  # Investment property (not home if homeowner)
    personal_assets: float = 10000  # Car, furniture, etc.
    home_value: float = 0  # Only if homeowner (exempt from test)

class IncomeDetails(BaseModel):
    employment_income: float = 0
    investment_income: float = 0  # Actual (before deeming)
    super_income_stream: float = 0
    other_income: float = 0

class PensionEligibilityRequest(BaseModel):
    person: PersonDetails
    partner: Optional[PersonDetails] = None  # If couple
    assets: AssetDetails
    income: IncomeDetails

class PensionProjectionRequest(BaseModel):
    person: PersonDetails
    partner: Optional[PersonDetails] = None
    current_assets: AssetDetails
    current_income: IncomeDetails
    retirement_age: int = 67
    life_expectancy: int = 90
    asset_growth_rate: float = 5.0  # Annual %
    drawdown_rate: float = 5.0  # Annual %
    inflation_rate: float = 2.5

# ==================== CALCULATION FUNCTIONS ====================

def calculate_age(birth_date_str: str) -> float:
    """Calculate current age from birth date"""
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d").date()
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    return age

def calculate_deemed_income(financial_assets: float, is_couple: bool) -> float:
    """Calculate deemed income from financial assets"""
    threshold = DEEMING_RATES["couple_threshold"] if is_couple else DEEMING_RATES["single_threshold"]
    
    if financial_assets <= threshold:
        deemed_income = financial_assets * DEEMING_RATES["lower_rate"]
    else:
        lower_income = threshold * DEEMING_RATES["lower_rate"]
        higher_income = (financial_assets - threshold) * DEEMING_RATES["higher_rate"]
        deemed_income = lower_income + higher_income
    
    return deemed_income

def calculate_assets_test_reduction(
    assessable_assets: float,
    is_homeowner: bool,
    is_couple: bool
) -> Dict[str, Any]:
    """Calculate pension reduction under assets test"""
    
    status = "couple_combined" if is_couple else "single"
    owner_status = "homeowner" if is_homeowner else "non_homeowner"
    
    thresholds = ASSETS_THRESHOLDS[owner_status][status]
    full_pension_threshold = thresholds["full_pension"]
    part_pension_limit = thresholds["part_pension_limit"]
    
    if assessable_assets <= full_pension_threshold:
        return {
            "reduction_fortnightly": 0,
            "reduction_annual": 0,
            "eligible": True,
            "full_pension": True,
            "threshold_used": full_pension_threshold
        }
    
    if assessable_assets > part_pension_limit:
        return {
            "reduction_fortnightly": 999999,
            "reduction_annual": 999999,
            "eligible": False,
            "full_pension": False,
            "threshold_used": part_pension_limit,
            "assets_over_limit": assessable_assets - part_pension_limit
        }
    
    # Part pension - calculate reduction
    assets_over = assessable_assets - full_pension_threshold
    reduction_fortnightly = (assets_over / 1000) * ASSETS_TAPER_RATE
    
    return {
        "reduction_fortnightly": reduction_fortnightly,
        "reduction_annual": reduction_fortnightly * 26,
        "eligible": True,
        "full_pension": False,
        "assets_over_threshold": assets_over,
        "threshold_used": full_pension_threshold
    }

def calculate_income_test_reduction(
    fortnightly_income: float,
    is_couple: bool
) -> Dict[str, Any]:
    """Calculate pension reduction under income test"""
    
    thresholds = INCOME_THRESHOLDS["couple_combined" if is_couple else "single"]
    free_area = thresholds["free_area"]
    taper_rate = thresholds["taper_rate"]
    
    if fortnightly_income <= free_area:
        return {
            "reduction_fortnightly": 0,
            "reduction_annual": 0,
            "income_over_free_area": 0
        }
    
    income_over = fortnightly_income - free_area
    reduction_fortnightly = income_over * taper_rate
    
    return {
        "reduction_fortnightly": reduction_fortnightly,
        "reduction_annual": reduction_fortnightly * 26,
        "income_over_free_area": income_over
    }

def calculate_pension_entitlement(
    is_couple: bool,
    is_homeowner: bool,
    assessable_assets: float,
    annual_income: float,
    financial_assets: float
) -> Dict[str, Any]:
    """Calculate Age Pension entitlement applying both tests"""
    
    # Get maximum pension
    if is_couple:
        max_pension = MAX_PENSION_RATES["couple_combined"]
    else:
        max_pension = MAX_PENSION_RATES["single"]
    
    max_fortnightly = max_pension["total_fortnightly"]
    max_annual = max_pension["total_annual"]
    
    # Calculate deemed income
    deemed_income = calculate_deemed_income(financial_assets, is_couple)
    total_income = annual_income + deemed_income
    fortnightly_income = total_income / 26
    
    # Assets test
    assets_result = calculate_assets_test_reduction(assessable_assets, is_homeowner, is_couple)
    
    # Income test
    income_result = calculate_income_test_reduction(fortnightly_income, is_couple)
    
    # Apply the test that results in lower pension (more reduction)
    if not assets_result["eligible"]:
        return {
            "eligible": False,
            "reason": "Assets exceed threshold",
            "annual_pension": 0,
            "fortnightly_pension": 0,
            "assets_test": assets_result,
            "income_test": income_result,
            "deemed_income": deemed_income,
            "test_applied": "assets"
        }
    
    assets_reduction = assets_result["reduction_fortnightly"]
    income_reduction = income_result["reduction_fortnightly"]
    
    # Apply higher reduction
    reduction = max(assets_reduction, income_reduction)
    test_applied = "assets" if assets_reduction > income_reduction else "income"
    
    pension_fortnightly = max(0, max_fortnightly - reduction)
    pension_annual = pension_fortnightly * 26
    
    return {
        "eligible": pension_fortnightly > 0,
        "annual_pension": round(pension_annual, 2),
        "fortnightly_pension": round(pension_fortnightly, 2),
        "max_annual": max_annual,
        "max_fortnightly": max_fortnightly,
        "reduction_applied": round(reduction * 26, 2),
        "test_applied": test_applied,
        "assets_test": assets_result,
        "income_test": income_result,
        "deemed_income": round(deemed_income, 2),
        "full_pension": assets_result.get("full_pension", False) and income_reduction == 0
    }

# ==================== API ENDPOINTS ====================

@router.post("/calculate")
async def calculate_pension_eligibility(request: PensionEligibilityRequest):
    """Calculate Age Pension eligibility and estimated payment"""
    
    is_couple = request.partner is not None
    
    # Calculate age
    age = calculate_age(request.person.date_of_birth)
    birth_year = int(request.person.date_of_birth[:4])
    qualifying_age = get_qualifying_age(birth_year)
    
    if age < qualifying_age:
        years_until_eligible = qualifying_age - age
        return {
            "eligible": False,
            "reason": f"Not yet qualifying age. Eligible at age {qualifying_age}",
            "current_age": age,
            "qualifying_age": qualifying_age,
            "years_until_eligible": round(years_until_eligible, 1),
            "projected_eligibility_date": f"{int(birth_year + qualifying_age)}"
        }
    
    # Calculate assessable assets (exclude home if homeowner)
    assessable_assets = (
        request.assets.financial_assets +
        request.assets.real_assets +
        request.assets.personal_assets
    )
    
    # Calculate income
    total_income = (
        request.income.employment_income +
        request.income.investment_income +
        request.income.super_income_stream +
        request.income.other_income
    )
    
    # Calculate pension
    result = calculate_pension_entitlement(
        is_couple=is_couple,
        is_homeowner=request.person.is_homeowner,
        assessable_assets=assessable_assets,
        annual_income=total_income,
        financial_assets=request.assets.financial_assets
    )
    
    result["current_age"] = age
    result["qualifying_age"] = qualifying_age
    result["is_couple"] = is_couple
    result["is_homeowner"] = request.person.is_homeowner
    result["assessable_assets"] = assessable_assets
    result["actual_income"] = total_income
    
    return result

@router.post("/project")
async def project_pension_over_time(request: PensionProjectionRequest):
    """Project Age Pension payments over retirement"""
    
    is_couple = request.partner is not None
    birth_year = int(request.person.date_of_birth[:4])
    qualifying_age = get_qualifying_age(birth_year)
    current_age = calculate_age(request.person.date_of_birth)
    
    projection = []
    
    # Track assets over time
    financial_assets = request.current_assets.financial_assets
    
    for year in range(int(current_age), request.life_expectancy + 1):
        # Calculate pension for this year
        if year >= qualifying_age:
            assessable = (
                financial_assets +
                request.current_assets.real_assets +
                request.current_assets.personal_assets
            )
            
            # Simplified income (mostly from super drawdown)
            super_income = financial_assets * (request.drawdown_rate / 100)
            
            pension_result = calculate_pension_entitlement(
                is_couple=is_couple,
                is_homeowner=request.person.is_homeowner,
                assessable_assets=assessable,
                annual_income=super_income,
                financial_assets=financial_assets
            )
            
            pension_annual = pension_result["annual_pension"]
        else:
            pension_annual = 0
            pension_result = {"eligible": False, "reason": "Below qualifying age"}
        
        # Asset drawdown and growth
        if year >= request.retirement_age:
            drawdown = financial_assets * (request.drawdown_rate / 100)
            financial_assets = financial_assets - drawdown
            financial_assets = financial_assets * (1 + request.asset_growth_rate / 100)
        else:
            financial_assets = financial_assets * (1 + request.asset_growth_rate / 100)
        
        financial_assets = max(0, financial_assets)
        
        projection.append({
            "age": year,
            "year": datetime.now().year + (year - int(current_age)),
            "financial_assets": round(financial_assets, 0),
            "pension_annual": round(pension_annual, 0),
            "pension_fortnightly": round(pension_annual / 26, 2),
            "eligible": pension_result.get("eligible", False),
            "full_pension": pension_result.get("full_pension", False)
        })
    
    # Summary statistics
    total_pension = sum(p["pension_annual"] for p in projection)
    years_receiving = sum(1 for p in projection if p["eligible"])
    
    return {
        "projection": projection,
        "summary": {
            "qualifying_age": qualifying_age,
            "years_receiving_pension": years_receiving,
            "total_pension_received": round(total_pension, 0),
            "average_annual_pension": round(total_pension / max(1, years_receiving), 0),
            "first_year_eligible": int(qualifying_age),
            "is_couple": is_couple
        }
    }

@router.get("/rates")
async def get_current_pension_rates():
    """Get current Age Pension rates and thresholds"""
    return {
        "effective_date": "2024-03-20",
        "max_rates": MAX_PENSION_RATES,
        "assets_thresholds": ASSETS_THRESHOLDS,
        "income_thresholds": INCOME_THRESHOLDS,
        "deeming_rates": DEEMING_RATES,
        "taper_rate": f"${ASSETS_TAPER_RATE:.2f} per fortnight per $1,000 over threshold",
        "notes": [
            "Rates are indexed on 20 March and 20 September each year",
            "Deeming rates are set by the government and may change",
            "The qualifying age is 67 for those born on or after 1 January 1957"
        ]
    }

@router.get("/qualifying-age/{birth_year}")
async def get_qualifying_age_for_year(birth_year: int):
    """Get Age Pension qualifying age for a birth year"""
    age = get_qualifying_age(birth_year)
    return {
        "birth_year": birth_year,
        "qualifying_age": age,
        "eligible_from_year": birth_year + int(age),
        "eligible_from_month": "July" if age % 1 == 0.5 else "January"
    }
