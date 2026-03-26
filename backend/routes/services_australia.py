"""
Services Australia Integration
Direct API-like integration for Age Pension calculations with real-time eligibility checks
"""

import os
import logging
from datetime import datetime, timezone, date, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/services-australia", tags=["Services Australia Integration"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ==================== 2024-25 RATES & THRESHOLDS ====================

# Updated rates as of March 2024 (indexed to CPI)
PENSION_RATES_2024 = {
    "single": {
        "maximum_fortnightly": 1116.30,
        "maximum_annual": 29023.80,
        "base_rate": 1020.60,
        "pension_supplement": 81.60,
        "energy_supplement": 14.10
    },
    "couple_combined": {
        "maximum_fortnightly": 1682.80,
        "maximum_annual": 43752.80,
        "base_rate": 1538.60,
        "pension_supplement": 123.00,
        "energy_supplement": 21.20
    },
    "couple_each": {
        "maximum_fortnightly": 841.40,
        "maximum_annual": 21876.40,
        "base_rate": 769.30,
        "pension_supplement": 61.50,
        "energy_supplement": 10.60
    }
}

# Assets test thresholds (2024-25)
ASSETS_TEST = {
    "homeowner": {
        "single": {
            "full_pension_limit": 301750,
            "part_pension_cutoff": 656500,
            "taper_rate": 3.00  # $3 per fortnight per $1000 over threshold
        },
        "couple_combined": {
            "full_pension_limit": 451500,
            "part_pension_cutoff": 986500,
            "taper_rate": 3.00
        }
    },
    "non_homeowner": {
        "single": {
            "full_pension_limit": 543750,
            "part_pension_cutoff": 898500,
            "taper_rate": 3.00
        },
        "couple_combined": {
            "full_pension_limit": 693500,
            "part_pension_cutoff": 1228500,
            "taper_rate": 3.00
        }
    }
}

# Income test thresholds (2024-25)
INCOME_TEST = {
    "single": {
        "free_area_fortnightly": 204,
        "free_area_annual": 5304,
        "taper_rate": 0.50,  # 50 cents per dollar over threshold
        "cutoff_annual": 63296  # Approximate cutoff (varies)
    },
    "couple_combined": {
        "free_area_fortnightly": 360,
        "free_area_annual": 9360,
        "taper_rate": 0.50,
        "cutoff_annual": 96812
    }
}

# Deeming rates (2024-25)
DEEMING_RATES = {
    "lower_rate": 0.25,  # 0.25% on first threshold
    "higher_rate": 2.25,  # 2.25% on balance above threshold
    "single_threshold": 60400,
    "couple_threshold": 100200
}

# Age pension age (gradually increasing)
PENSION_AGE_SCHEDULE = {
    "pre_1952-07-01": 65,
    "1952-07-01_to_1953-12-31": 65.5,
    "1954-01-01_to_1955-06-30": 66,
    "1955-07-01_to_1956-12-31": 66.5,
    "post_1957-01-01": 67
}


# ==================== MODELS ====================

class PensionAssessmentRequest(BaseModel):
    client_id: str
    date_of_birth: str  # YYYY-MM-DD
    partner_date_of_birth: Optional[str] = None
    is_homeowner: bool = True
    home_value: float = 0  # Not counted in assets test
    
    # Financial assets
    bank_accounts: float = 0
    term_deposits: float = 0
    shares_managed_funds: float = 0
    superannuation: float = 0
    account_based_pension: float = 0
    investment_property: float = 0
    other_assets: float = 0
    
    # Liabilities (netted off relevant assets)
    investment_property_loan: float = 0
    other_loans: float = 0
    
    # Income (annual)
    employment_income: float = 0
    rental_income: float = 0
    other_income: float = 0
    
    # Options
    include_projections: bool = True
    projection_years: int = 5


class PensionAssessmentResponse(BaseModel):
    client_id: str
    assessment_date: str
    eligibility: Dict[str, Any]
    assets_test: Dict[str, Any]
    income_test: Dict[str, Any]
    pension_entitlement: Dict[str, Any]
    recommendations: List[Dict[str, str]]
    projections: Optional[List[Dict[str, Any]]] = None


# ==================== CALCULATION FUNCTIONS ====================

def calculate_pension_age(dob_str: str) -> Dict[str, Any]:
    """Calculate pension age based on date of birth."""
    dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
    
    if dob < date(1952, 7, 1):
        pension_age = 65
    elif dob < date(1954, 1, 1):
        pension_age = 65.5
    elif dob < date(1955, 7, 1):
        pension_age = 66
    elif dob < date(1957, 1, 1):
        pension_age = 66.5
    else:
        pension_age = 67
    
    # Calculate pension start date
    pension_years = int(pension_age)
    pension_months = int((pension_age - pension_years) * 12)
    
    pension_start = date(
        dob.year + pension_years + (dob.month + pension_months - 1) // 12,
        (dob.month + pension_months - 1) % 12 + 1,
        dob.day
    )
    
    today = date.today()
    current_age = (today - dob).days / 365.25
    years_to_pension = max(0, (pension_start - today).days / 365.25)
    
    return {
        "pension_age": pension_age,
        "pension_start_date": pension_start.isoformat(),
        "current_age": round(current_age, 1),
        "years_to_pension": round(years_to_pension, 1),
        "is_eligible_now": today >= pension_start
    }


def calculate_deemed_income(financial_assets: float, is_couple: bool) -> Dict[str, Any]:
    """Calculate deemed income from financial assets."""
    threshold = DEEMING_RATES["couple_threshold"] if is_couple else DEEMING_RATES["single_threshold"]
    
    if financial_assets <= threshold:
        deemed_income = financial_assets * (DEEMING_RATES["lower_rate"] / 100)
    else:
        deemed_income = (
            threshold * (DEEMING_RATES["lower_rate"] / 100) +
            (financial_assets - threshold) * (DEEMING_RATES["higher_rate"] / 100)
        )
    
    return {
        "financial_assets": financial_assets,
        "deeming_threshold": threshold,
        "lower_rate": DEEMING_RATES["lower_rate"],
        "higher_rate": DEEMING_RATES["higher_rate"],
        "deemed_income_annual": round(deemed_income, 2),
        "deemed_income_fortnightly": round(deemed_income / 26, 2)
    }


def apply_assets_test(
    assessable_assets: float,
    is_homeowner: bool,
    is_couple: bool
) -> Dict[str, Any]:
    """Apply the assets test to determine pension reduction."""
    category = "homeowner" if is_homeowner else "non_homeowner"
    status = "couple_combined" if is_couple else "single"
    
    thresholds = ASSETS_TEST[category][status]
    rates = PENSION_RATES_2024["couple_combined" if is_couple else "single"]
    
    full_limit = thresholds["full_pension_limit"]
    cutoff = thresholds["part_pension_cutoff"]
    taper_rate = thresholds["taper_rate"]
    
    if assessable_assets <= full_limit:
        reduction = 0
        status_result = "full_pension"
    elif assessable_assets >= cutoff:
        reduction = rates["maximum_fortnightly"]
        status_result = "no_pension"
    else:
        excess = assessable_assets - full_limit
        reduction = (excess / 1000) * taper_rate
        status_result = "part_pension"
    
    pension_amount = max(0, rates["maximum_fortnightly"] - reduction)
    
    return {
        "assessable_assets": assessable_assets,
        "full_pension_limit": full_limit,
        "part_pension_cutoff": cutoff,
        "excess_assets": max(0, assessable_assets - full_limit),
        "taper_rate_per_1000": taper_rate,
        "fortnightly_reduction": round(reduction, 2),
        "pension_after_assets_test": round(pension_amount, 2),
        "status": status_result,
        "homeowner_status": category,
        "relationship_status": "couple" if is_couple else "single"
    }


def apply_income_test(
    total_income: float,
    deemed_income: float,
    is_couple: bool
) -> Dict[str, Any]:
    """Apply the income test to determine pension reduction."""
    status = "couple_combined" if is_couple else "single"
    thresholds = INCOME_TEST[status]
    rates = PENSION_RATES_2024["couple_combined" if is_couple else "single"]
    
    total_assessable_income = total_income + deemed_income
    free_area = thresholds["free_area_annual"]
    taper_rate = thresholds["taper_rate"]
    
    if total_assessable_income <= free_area:
        reduction = 0
        status_result = "full_pension"
    else:
        excess = total_assessable_income - free_area
        annual_reduction = excess * taper_rate
        fortnightly_reduction = annual_reduction / 26
        
        if fortnightly_reduction >= rates["maximum_fortnightly"]:
            reduction = rates["maximum_fortnightly"]
            status_result = "no_pension"
        else:
            reduction = fortnightly_reduction
            status_result = "part_pension"
    
    pension_amount = max(0, rates["maximum_fortnightly"] - reduction)
    
    return {
        "total_assessable_income": round(total_assessable_income, 2),
        "employment_and_other_income": round(total_income, 2),
        "deemed_income": round(deemed_income, 2),
        "free_area_annual": free_area,
        "excess_income": max(0, round(total_assessable_income - free_area, 2)),
        "taper_rate": taper_rate,
        "fortnightly_reduction": round(reduction, 2),
        "pension_after_income_test": round(pension_amount, 2),
        "status": status_result
    }


def generate_recommendations(
    assets_result: Dict,
    income_result: Dict,
    request: PensionAssessmentRequest
) -> List[Dict[str, str]]:
    """Generate actionable recommendations based on assessment."""
    recommendations = []
    
    # Assets test recommendations
    if assets_result["status"] == "no_pension":
        excess = assets_result["assessable_assets"] - assets_result["part_pension_cutoff"]
        recommendations.append({
            "category": "assets",
            "priority": "high",
            "title": "Assets exceed pension cutoff",
            "description": f"Your assessable assets exceed the cutoff by ${excess:,.0f}. "
                         f"Consider strategies to reduce assessable assets while maintaining lifestyle."
        })
    elif assets_result["status"] == "part_pension":
        potential_gain = assets_result["fortnightly_reduction"] * 26
        recommendations.append({
            "category": "assets",
            "priority": "medium",
            "title": "Opportunity to increase pension",
            "description": f"Reducing assessable assets could increase your pension by up to ${potential_gain:,.0f}/year. "
                         f"Consider prepaying expenses, home improvements, or funeral bonds."
        })
    
    # Income test recommendations
    if income_result["status"] == "no_pension" and income_result["excess_income"] > 0:
        recommendations.append({
            "category": "income",
            "priority": "high",
            "title": "Income exceeds pension cutoff",
            "description": "Your assessable income exceeds the cutoff. "
                         "Consider timing of income or salary sacrifice strategies."
        })
    
    # Super recommendations
    if request.superannuation > 0 and not request.account_based_pension:
        recommendations.append({
            "category": "super",
            "priority": "medium",
            "title": "Superannuation strategy",
            "description": "Converting super to an account-based pension may provide tax benefits "
                         "while still being assessed under deeming rules."
        })
    
    # Home ownership
    if not request.is_homeowner and request.investment_property > 0:
        recommendations.append({
            "category": "home",
            "priority": "medium",
            "title": "Consider home purchase",
            "description": "Purchasing a principal residence would remove the home value from the assets test "
                         "and give you access to higher asset thresholds."
        })
    
    # General
    recommendations.append({
        "category": "review",
        "priority": "low",
        "title": "Regular review recommended",
        "description": "Pension thresholds are indexed twice yearly (March and September). "
                     "Review your situation annually to optimize entitlements."
    })
    
    return recommendations


def project_pension_over_time(
    current_assessment: Dict,
    years: int,
    asset_growth_rate: float = 0.03,
    inflation_rate: float = 0.025
) -> List[Dict[str, Any]]:
    """Project pension entitlements over future years."""
    projections = []
    
    current_assets = current_assessment["assets_test"]["assessable_assets"]
    current_pension = current_assessment["pension_entitlement"]["annual_pension"]
    
    for year in range(years + 1):
        # Assets grow at assumed rate
        projected_assets = current_assets * ((1 + asset_growth_rate) ** year)
        
        # Thresholds indexed to inflation
        inflation_factor = (1 + inflation_rate) ** year
        projected_cutoff = current_assessment["assets_test"]["part_pension_cutoff"] * inflation_factor
        
        # Simple projection (actual calculation would need full reassessment)
        if projected_assets >= projected_cutoff:
            projected_pension = 0
        else:
            # Rough estimate based on current relationship
            asset_ratio = projected_assets / current_assets if current_assets > 0 else 1
            projected_pension = max(0, current_pension * (2 - asset_ratio))
        
        projections.append({
            "year": datetime.now().year + year,
            "projected_assets": round(projected_assets, 0),
            "projected_cutoff": round(projected_cutoff, 0),
            "projected_annual_pension": round(projected_pension, 0),
            "assumptions": {
                "asset_growth_rate": asset_growth_rate,
                "inflation_rate": inflation_rate
            }
        })
    
    return projections


# ==================== API ENDPOINTS ====================

@router.post("/assess", response_model=PensionAssessmentResponse)
async def assess_pension_eligibility(request: PensionAssessmentRequest):
    """
    Comprehensive pension assessment based on Services Australia rules.
    Returns eligibility, entitlement calculations, and recommendations.
    """
    db = await get_db()
    
    # Determine couple status
    is_couple = request.partner_date_of_birth is not None
    
    # Calculate pension age eligibility
    eligibility = calculate_pension_age(request.date_of_birth)
    
    if is_couple and request.partner_date_of_birth:
        partner_eligibility = calculate_pension_age(request.partner_date_of_birth)
        eligibility["partner"] = partner_eligibility
        eligibility["both_eligible"] = eligibility["is_eligible_now"] and partner_eligibility["is_eligible_now"]
    
    # Calculate assessable assets
    financial_assets = (
        request.bank_accounts +
        request.term_deposits +
        request.shares_managed_funds +
        request.superannuation +
        request.account_based_pension
    )
    
    other_assets = (
        request.investment_property - request.investment_property_loan +
        request.other_assets - request.other_loans
    )
    
    total_assessable_assets = financial_assets + max(0, other_assets)
    
    # Calculate deemed income
    deeming = calculate_deemed_income(financial_assets, is_couple)
    
    # Total other income
    total_other_income = (
        request.employment_income +
        request.rental_income +
        request.other_income
    )
    
    # Apply assets test
    assets_result = apply_assets_test(
        total_assessable_assets,
        request.is_homeowner,
        is_couple
    )
    
    # Apply income test
    income_result = apply_income_test(
        total_other_income,
        deeming["deemed_income_annual"],
        is_couple
    )
    
    # Determine final pension (lower of two tests)
    pension_from_assets = assets_result["pension_after_assets_test"]
    pension_from_income = income_result["pension_after_income_test"]
    
    final_pension_fortnightly = min(pension_from_assets, pension_from_income)
    final_pension_annual = final_pension_fortnightly * 26
    
    # Determine which test is limiting
    limiting_test = "assets" if pension_from_assets <= pension_from_income else "income"
    
    rates = PENSION_RATES_2024["couple_combined" if is_couple else "single"]
    
    pension_entitlement = {
        "fortnightly_pension": round(final_pension_fortnightly, 2),
        "annual_pension": round(final_pension_annual, 2),
        "maximum_fortnightly": rates["maximum_fortnightly"],
        "maximum_annual": rates["maximum_annual"],
        "percentage_of_maximum": round(final_pension_fortnightly / rates["maximum_fortnightly"] * 100, 1) if rates["maximum_fortnightly"] > 0 else 0,
        "limiting_test": limiting_test,
        "status": "full" if final_pension_fortnightly >= rates["maximum_fortnightly"] * 0.99 else "part" if final_pension_fortnightly > 0 else "none",
        "components": {
            "base_rate": round(min(rates["base_rate"], final_pension_fortnightly), 2),
            "pension_supplement": round(min(rates["pension_supplement"], max(0, final_pension_fortnightly - rates["base_rate"])), 2),
            "energy_supplement": round(rates["energy_supplement"] if final_pension_fortnightly > 0 else 0, 2)
        }
    }
    
    # Generate recommendations
    assessment = {
        "assets_test": assets_result,
        "income_test": income_result,
        "pension_entitlement": pension_entitlement
    }
    recommendations = generate_recommendations(assets_result, income_result, request)
    
    # Generate projections if requested
    projections = None
    if request.include_projections:
        projections = project_pension_over_time(
            assessment,
            request.projection_years
        )
    
    # Store assessment
    assessment_record = {
        "id": str(uuid.uuid4()),
        "client_id": request.client_id,
        "assessment_date": datetime.now(timezone.utc),
        "request": request.dict(),
        "results": {
            "eligibility": eligibility,
            "assets_test": assets_result,
            "income_test": income_result,
            "pension_entitlement": pension_entitlement
        }
    }
    await db.pension_assessments.insert_one(assessment_record)
    
    return PensionAssessmentResponse(
        client_id=request.client_id,
        assessment_date=datetime.now(timezone.utc).isoformat(),
        eligibility=eligibility,
        assets_test=assets_result,
        income_test=income_result,
        pension_entitlement=pension_entitlement,
        recommendations=recommendations,
        projections=projections
    )


@router.get("/rates/current")
async def get_current_rates():
    """Get current Age Pension rates and thresholds."""
    return {
        "effective_date": "2024-03-20",
        "next_indexation": "2024-09-20",
        "pension_rates": PENSION_RATES_2024,
        "assets_test": ASSETS_TEST,
        "income_test": INCOME_TEST,
        "deeming_rates": DEEMING_RATES,
        "pension_age_schedule": PENSION_AGE_SCHEDULE,
        "notes": [
            "Rates are indexed twice yearly (March 20 and September 20)",
            "Assets test thresholds indexed to CPI",
            "Income test free areas indexed to PBLCI (Pensioner and Beneficiary Living Cost Index)",
            "Deeming rates are set by the Minister and can change at any time"
        ]
    }


@router.get("/eligibility/age")
async def check_age_eligibility(
    date_of_birth: str = Query(..., description="Date of birth in YYYY-MM-DD format")
):
    """Quick check for Age Pension age eligibility."""
    try:
        eligibility = calculate_pension_age(date_of_birth)
        return eligibility
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")


@router.get("/calculator/quick")
async def quick_pension_calculator(
    assessable_assets: float = Query(..., ge=0),
    annual_income: float = Query(default=0, ge=0),
    is_homeowner: bool = Query(default=True),
    is_couple: bool = Query(default=False)
):
    """Quick pension estimate without full assessment."""
    # Calculate deemed income (assume 50% of assets are financial)
    financial_assets = assessable_assets * 0.5
    deeming = calculate_deemed_income(financial_assets, is_couple)
    
    # Apply tests
    assets_result = apply_assets_test(assessable_assets, is_homeowner, is_couple)
    income_result = apply_income_test(annual_income, deeming["deemed_income_annual"], is_couple)
    
    # Final pension
    final_pension = min(
        assets_result["pension_after_assets_test"],
        income_result["pension_after_income_test"]
    )
    
    return {
        "estimated_fortnightly_pension": round(final_pension, 2),
        "estimated_annual_pension": round(final_pension * 26, 2),
        "assets_test_result": assets_result["status"],
        "income_test_result": income_result["status"],
        "limiting_factor": "assets" if assets_result["pension_after_assets_test"] < income_result["pension_after_income_test"] else "income",
        "note": "This is an estimate only. Full assessment required for accurate calculation."
    }


@router.get("/history/{client_id}")
async def get_assessment_history(
    client_id: str,
    limit: int = Query(default=10, ge=1, le=100)
):
    """Get historical pension assessments for a client."""
    db = await get_db()
    
    cursor = db.pension_assessments.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("assessment_date", -1).limit(limit)
    
    assessments = await cursor.to_list(length=limit)
    
    return {
        "client_id": client_id,
        "assessments": assessments,
        "total_count": len(assessments)
    }
