"""
Decumulation Calculator - Pension Phase Planning Module
Comprehensive retirement income modeling with drawdown, assets, liabilities, and Age Pension
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import math

router = APIRouter(prefix="/decumulation", tags=["Decumulation Calculator"])

# ============== ENUMS ==============

class EntityType(str, Enum):
    INDIVIDUAL = "individual"
    JOINT = "joint"
    SMSF = "smsf"
    TRUST = "trust"
    COMPANY = "company"
    SUPER_FUND = "super_fund"

class AssetType(str, Enum):
    CASH = "cash"
    TERM_DEPOSIT = "term_deposit"
    SHARES_AUSTRALIAN = "shares_australian"
    SHARES_INTERNATIONAL = "shares_international"
    MANAGED_FUNDS = "managed_funds"
    ETF = "etf"
    PROPERTY_INVESTMENT = "property_investment"
    PROPERTY_RESIDENTIAL = "property_residential"
    SUPER_ACCUMULATION = "super_accumulation"
    SUPER_PENSION = "super_pension"
    ANNUITY = "annuity"
    BONDS = "bonds"
    COLLECTIBLES = "collectibles"
    BUSINESS_ASSETS = "business_assets"
    CRYPTOCURRENCY = "cryptocurrency"
    OTHER = "other"

class LiabilityType(str, Enum):
    MORTGAGE_PRIMARY = "mortgage_primary"
    MORTGAGE_INVESTMENT = "mortgage_investment"
    PERSONAL_LOAN = "personal_loan"
    CAR_LOAN = "car_loan"
    CREDIT_CARD = "credit_card"
    MARGIN_LOAN = "margin_loan"
    SMSF_LIMITED_RECOURSE = "smsf_limited_recourse"
    OTHER = "other"

class PensionType(str, Enum):
    ACCOUNT_BASED = "account_based"
    TRANSITION_TO_RETIREMENT = "transition_to_retirement"
    ANNUITY_LIFETIME = "annuity_lifetime"
    ANNUITY_FIXED_TERM = "annuity_fixed_term"
    DEFINED_BENEFIT = "defined_benefit"

class DrawdownStrategy(str, Enum):
    MINIMUM = "minimum"  # SMSF minimum only
    PERCENTAGE = "percentage"  # Fixed percentage
    FIXED_AMOUNT = "fixed_amount"  # Fixed dollar amount
    BUCKET = "bucket"  # Bucket strategy
    DYNAMIC = "dynamic"  # Adjusts based on returns

# ============== CONSTANTS - FY 2024-25 ==============

# Minimum Drawdown Rates (Age-based)
MINIMUM_DRAWDOWN_RATES = {
    "under_65": 4.0,
    "65_74": 5.0,
    "75_79": 6.0,
    "80_84": 7.0,
    "85_89": 9.0,
    "90_94": 11.0,
    "95_plus": 14.0
}

# Transfer Balance Cap
TRANSFER_BALANCE_CAP = 1900000  # $1.9M as of July 2024
DEFINED_BENEFIT_INCOME_CAP = 118750  # 16 x pension general rate

# Age Pension (Single) - March 2024 rates
AGE_PENSION = {
    "max_rate_single": 28514,  # Per year
    "max_rate_couple": 42988,  # Per year (combined)
    "supplement_single": 2182,  # Pension supplement
    "supplement_couple": 3288,
    "energy_supplement_single": 372,
    "energy_supplement_couple": 560,
    "assets_threshold_homeowner_single": 301750,
    "assets_threshold_homeowner_couple": 451500,
    "assets_threshold_non_homeowner_single": 543750,
    "assets_threshold_non_homeowner_couple": 693500,
    "assets_cutoff_homeowner_single": 656500,
    "assets_cutoff_homeowner_couple": 986500,
    "assets_cutoff_non_homeowner_single": 898500,
    "assets_cutoff_non_homeowner_couple": 1228500,
    "income_threshold_single": 204,  # Per fortnight
    "income_threshold_couple": 360,
    "taper_rate_assets": 0.03,  # $3 per $1000 over threshold per fortnight
    "taper_rate_income": 0.50,  # 50 cents per dollar over threshold
    "deeming_threshold_single": 60400,
    "deeming_threshold_couple": 100200,
    "deeming_rate_below": 0.25,  # 0.25% below threshold
    "deeming_rate_above": 2.25,  # 2.25% above threshold
    "pension_age": 67,
}

# Life Expectancy (simplified - ABS 2020-22)
LIFE_EXPECTANCY = {
    "male": {60: 25.3, 65: 21.0, 70: 17.0, 75: 13.3, 80: 10.0, 85: 7.2, 90: 5.1},
    "female": {60: 28.3, 65: 23.9, 70: 19.6, 75: 15.5, 80: 11.8, 85: 8.5, 90: 5.9}
}

# Asset Return Assumptions
ASSET_RETURN_ASSUMPTIONS = {
    "cash": {"return": 4.5, "yield": 4.5, "volatility": 0.5},
    "term_deposit": {"return": 4.8, "yield": 4.8, "volatility": 0.3},
    "shares_australian": {"return": 8.5, "yield": 4.0, "volatility": 15.0},
    "shares_international": {"return": 8.0, "yield": 2.0, "volatility": 16.0},
    "managed_funds": {"return": 7.5, "yield": 3.5, "volatility": 12.0},
    "etf": {"return": 8.0, "yield": 3.0, "volatility": 14.0},
    "property_investment": {"return": 6.5, "yield": 4.5, "volatility": 10.0},
    "property_residential": {"return": 5.0, "yield": 0.0, "volatility": 8.0},
    "super_accumulation": {"return": 7.0, "yield": 3.0, "volatility": 10.0},
    "super_pension": {"return": 6.5, "yield": 3.5, "volatility": 9.0},
    "annuity": {"return": 5.0, "yield": 5.0, "volatility": 0.0},
    "bonds": {"return": 5.0, "yield": 4.5, "volatility": 4.0},
    "collectibles": {"return": 4.0, "yield": 0.0, "volatility": 20.0},
    "business_assets": {"return": 10.0, "yield": 5.0, "volatility": 25.0},
    "cryptocurrency": {"return": 15.0, "yield": 0.0, "volatility": 60.0},
    "other": {"return": 5.0, "yield": 2.0, "volatility": 10.0},
}

# ============== MODELS ==============

class PersonDetails(BaseModel):
    name: Optional[str] = None
    current_age: int = Field(..., ge=55, le=100)
    gender: str = Field(default="male")  # For life expectancy
    is_homeowner: bool = Field(default=True)
    relationship_status: str = Field(default="single")  # single, partnered
    partner_age: Optional[int] = None

class AssetItem(BaseModel):
    name: str
    asset_type: AssetType
    entity: EntityType
    current_value: float = Field(ge=0)
    cost_base: Optional[float] = None  # For CGT
    annual_income: Optional[float] = None  # Override income calculation
    custom_return_rate: Optional[float] = None
    custom_yield: Optional[float] = None
    is_assessable_for_pension: bool = Field(default=True)  # Centrelink assessment
    notes: Optional[str] = None

class LiabilityItem(BaseModel):
    name: str
    liability_type: LiabilityType
    entity: EntityType
    current_balance: float = Field(ge=0)
    interest_rate: float = Field(default=6.0, ge=0)
    minimum_payment: Optional[float] = None
    secured_against: Optional[str] = None  # Asset name
    notes: Optional[str] = None

class SuperPensionAccount(BaseModel):
    name: str
    fund_name: str
    account_type: PensionType
    current_balance: float = Field(ge=0)
    commencement_date: Optional[str] = None
    reversionary_beneficiary: Optional[str] = None
    investment_option: str = Field(default="balanced")
    fees_percent: float = Field(default=0.8)
    insurance_premium: float = Field(default=0)

class IncomeStream(BaseModel):
    name: str
    annual_amount: float
    start_age: int
    end_age: Optional[int] = None  # None = lifetime
    is_taxable: bool = Field(default=True)
    is_indexed: bool = Field(default=False)
    indexation_rate: float = Field(default=2.5)

class ExpenseItem(BaseModel):
    name: str
    annual_amount: float
    category: str = Field(default="living")  # living, healthcare, leisure, etc.
    start_age: Optional[int] = None
    end_age: Optional[int] = None
    is_indexed: bool = Field(default=True)

class DrawdownSettings(BaseModel):
    strategy: DrawdownStrategy = Field(default=DrawdownStrategy.MINIMUM)
    target_income: Optional[float] = None  # For fixed_amount strategy
    target_percentage: Optional[float] = None  # For percentage strategy
    preserve_capital_until_age: Optional[int] = None
    legacy_target: float = Field(default=0)  # Target estate value

class DecumulationRequest(BaseModel):
    person: PersonDetails
    partner: Optional[PersonDetails] = None
    assets: List[AssetItem] = Field(default=[])
    liabilities: List[LiabilityItem] = Field(default=[])
    super_pensions: List[SuperPensionAccount] = Field(default=[])
    other_income: List[IncomeStream] = Field(default=[])
    expenses: List[ExpenseItem] = Field(default=[])
    drawdown_settings: DrawdownSettings = Field(default_factory=DrawdownSettings)
    inflation_rate: float = Field(default=2.5)
    projection_years: int = Field(default=30, ge=1, le=50)
    include_age_pension: bool = Field(default=True)
    is_client: bool = Field(default=False)
    client_name: Optional[str] = None

# ============== HELPER FUNCTIONS ==============

def get_minimum_drawdown_rate(age: int) -> float:
    """Get minimum drawdown rate based on age"""
    if age < 65:
        return MINIMUM_DRAWDOWN_RATES["under_65"]
    elif age < 75:
        return MINIMUM_DRAWDOWN_RATES["65_74"]
    elif age < 80:
        return MINIMUM_DRAWDOWN_RATES["75_79"]
    elif age < 85:
        return MINIMUM_DRAWDOWN_RATES["80_84"]
    elif age < 90:
        return MINIMUM_DRAWDOWN_RATES["85_89"]
    elif age < 95:
        return MINIMUM_DRAWDOWN_RATES["90_94"]
    else:
        return MINIMUM_DRAWDOWN_RATES["95_plus"]

def get_life_expectancy(age: int, gender: str) -> float:
    """Get remaining life expectancy"""
    table = LIFE_EXPECTANCY.get(gender, LIFE_EXPECTANCY["male"])
    # Find closest age bracket
    ages = sorted(table.keys())
    for i, a in enumerate(ages):
        if age <= a:
            return table[a]
    return table[ages[-1]]

def calculate_deemed_income(assets: float, is_single: bool = True) -> float:
    """Calculate deemed income for Age Pension assessment"""
    threshold = AGE_PENSION["deeming_threshold_single"] if is_single else AGE_PENSION["deeming_threshold_couple"]
    
    if assets <= threshold:
        return assets * (AGE_PENSION["deeming_rate_below"] / 100)
    else:
        below = threshold * (AGE_PENSION["deeming_rate_below"] / 100)
        above = (assets - threshold) * (AGE_PENSION["deeming_rate_above"] / 100)
        return below + above

def calculate_age_pension(
    assessable_assets: float,
    assessable_income: float,
    is_single: bool = True,
    is_homeowner: bool = True
) -> Dict[str, float]:
    """Calculate Age Pension entitlement"""
    
    # Determine thresholds based on homeowner status and relationship
    if is_single:
        if is_homeowner:
            assets_threshold = AGE_PENSION["assets_threshold_homeowner_single"]
            assets_cutoff = AGE_PENSION["assets_cutoff_homeowner_single"]
        else:
            assets_threshold = AGE_PENSION["assets_threshold_non_homeowner_single"]
            assets_cutoff = AGE_PENSION["assets_cutoff_non_homeowner_single"]
        income_threshold = AGE_PENSION["income_threshold_single"] * 26  # Annual
        max_pension = AGE_PENSION["max_rate_single"] + AGE_PENSION["supplement_single"] + AGE_PENSION["energy_supplement_single"]
    else:
        if is_homeowner:
            assets_threshold = AGE_PENSION["assets_threshold_homeowner_couple"]
            assets_cutoff = AGE_PENSION["assets_cutoff_homeowner_couple"]
        else:
            assets_threshold = AGE_PENSION["assets_threshold_non_homeowner_couple"]
            assets_cutoff = AGE_PENSION["assets_cutoff_non_homeowner_couple"]
        income_threshold = AGE_PENSION["income_threshold_couple"] * 26  # Annual
        max_pension = AGE_PENSION["max_rate_couple"] + AGE_PENSION["supplement_couple"] + AGE_PENSION["energy_supplement_couple"]
    
    # Assets test
    if assessable_assets > assets_cutoff:
        pension_assets_test = 0
    elif assessable_assets <= assets_threshold:
        pension_assets_test = max_pension
    else:
        reduction = (assessable_assets - assets_threshold) * AGE_PENSION["taper_rate_assets"]
        pension_assets_test = max(0, max_pension - reduction)
    
    # Income test
    if assessable_income <= income_threshold:
        pension_income_test = max_pension
    else:
        reduction = (assessable_income - income_threshold) * AGE_PENSION["taper_rate_income"]
        pension_income_test = max(0, max_pension - reduction)
    
    # Apply lower of two tests
    pension_amount = min(pension_assets_test, pension_income_test)
    
    return {
        "annual_pension": round(pension_amount, 2),
        "fortnightly_pension": round(pension_amount / 26, 2),
        "assets_test_result": round(pension_assets_test, 2),
        "income_test_result": round(pension_income_test, 2),
        "assessable_assets": assessable_assets,
        "assessable_income": assessable_income,
        "is_eligible": pension_amount > 0
    }

def calculate_asset_income(asset: AssetItem) -> float:
    """Calculate expected annual income from an asset"""
    if asset.annual_income is not None:
        return asset.annual_income
    
    assumptions = ASSET_RETURN_ASSUMPTIONS.get(asset.asset_type.value, ASSET_RETURN_ASSUMPTIONS["other"])
    yield_rate = asset.custom_yield if asset.custom_yield else assumptions["yield"]
    return asset.current_value * (yield_rate / 100)

def project_asset_value(current_value: float, return_rate: float, years: int, drawdown: float = 0) -> float:
    """Project asset value with growth and drawdowns"""
    value = current_value
    for _ in range(years):
        value = value * (1 + return_rate / 100) - drawdown
        if value < 0:
            return 0
    return value

# ============== ENDPOINTS ==============

@router.get("/rules")
async def get_pension_rules():
    """Get current pension phase rules and thresholds"""
    return {
        "minimum_drawdown_rates": MINIMUM_DRAWDOWN_RATES,
        "transfer_balance_cap": TRANSFER_BALANCE_CAP,
        "age_pension_rates": AGE_PENSION,
        "life_expectancy": LIFE_EXPECTANCY,
        "pension_age": AGE_PENSION["pension_age"],
        "notes": {
            "minimum_drawdown": "Minimum amount that must be withdrawn from super pension each year",
            "transfer_balance_cap": "Maximum amount that can be transferred into tax-free pension phase",
            "deeming": "How Centrelink calculates income from financial assets",
            "taper_rates": "Rate at which Age Pension reduces as assets/income increase"
        }
    }

@router.get("/asset-assumptions")
async def get_asset_assumptions():
    """Get default return assumptions by asset type"""
    return {
        "assumptions": ASSET_RETURN_ASSUMPTIONS,
        "entity_types": [e.value for e in EntityType],
        "asset_types": [a.value for a in AssetType],
        "liability_types": [item.value for item in LiabilityType]
    }

@router.post("/calculate")
async def calculate_decumulation(request: DecumulationRequest):
    """
    Comprehensive decumulation/pension phase projection
    """
    try:
        person = request.person
        is_single = request.partner is None
        
        # === CALCULATE TOTALS BY CATEGORY ===
        
        # Assets by type
        assets_by_type = {}
        for asset in request.assets:
            asset_type = asset.asset_type.value
            if asset_type not in assets_by_type:
                assets_by_type[asset_type] = {"count": 0, "total_value": 0, "items": []}
            assets_by_type[asset_type]["count"] += 1
            assets_by_type[asset_type]["total_value"] += asset.current_value
            assets_by_type[asset_type]["items"].append({
                "name": asset.name,
                "value": asset.current_value,
                "entity": asset.entity.value
            })
        
        # Assets by entity
        assets_by_entity = {}
        for asset in request.assets:
            entity = asset.entity.value
            if entity not in assets_by_entity:
                assets_by_entity[entity] = {"count": 0, "total_value": 0, "items": []}
            assets_by_entity[entity]["count"] += 1
            assets_by_entity[entity]["total_value"] += asset.current_value
            assets_by_entity[entity]["items"].append({
                "name": asset.name,
                "value": asset.current_value,
                "type": asset.asset_type.value
            })
        
        # Liabilities by type
        liabilities_by_type = {}
        for liability in request.liabilities:
            lib_type = liability.liability_type.value
            if lib_type not in liabilities_by_type:
                liabilities_by_type[lib_type] = {"count": 0, "total_balance": 0, "items": []}
            liabilities_by_type[lib_type]["count"] += 1
            liabilities_by_type[lib_type]["total_balance"] += liability.current_balance
            liabilities_by_type[lib_type]["items"].append({
                "name": liability.name,
                "balance": liability.current_balance,
                "rate": liability.interest_rate
            })
        
        # Calculate totals
        total_assets = sum(a.current_value for a in request.assets)
        total_super_pension = sum(p.current_balance for p in request.super_pensions)
        total_liabilities = sum(item.current_balance for item in request.liabilities)
        net_position = total_assets + total_super_pension - total_liabilities
        
        # Assessable assets for Age Pension (exclude home)
        assessable_assets = sum(
            a.current_value for a in request.assets 
            if a.is_assessable_for_pension and a.asset_type != AssetType.PROPERTY_RESIDENTIAL
        ) + total_super_pension
        
        # Calculate income from all sources
        asset_income = sum(calculate_asset_income(a) for a in request.assets)
        pension_income = sum(p.current_balance * 0.05 for p in request.super_pensions)  # Approx 5% drawdown
        other_income = sum(i.annual_amount for i in request.other_income if i.start_age <= person.current_age)
        _total_income = asset_income + pension_income + other_income
        
        # Deemed income for pension test
        deemed_income = calculate_deemed_income(assessable_assets, is_single)
        
        # Calculate Age Pension if eligible
        age_pension_result = None
        if request.include_age_pension and person.current_age >= AGE_PENSION["pension_age"]:
            age_pension_result = calculate_age_pension(
                assessable_assets,
                deemed_income + other_income,
                is_single,
                person.is_homeowner
            )
        
        # === CALCULATE MINIMUM DRAWDOWNS ===
        min_drawdown_rate = get_minimum_drawdown_rate(person.current_age)
        minimum_annual_drawdown = total_super_pension * (min_drawdown_rate / 100)
        
        # Life expectancy
        life_exp = get_life_expectancy(person.current_age, person.gender)
        
        # === DETERMINE ACTUAL DRAWDOWN ===
        settings = request.drawdown_settings
        if settings.strategy == DrawdownStrategy.MINIMUM:
            annual_drawdown = minimum_annual_drawdown
        elif settings.strategy == DrawdownStrategy.PERCENTAGE:
            annual_drawdown = total_super_pension * ((settings.target_percentage or 5) / 100)
        elif settings.strategy == DrawdownStrategy.FIXED_AMOUNT:
            annual_drawdown = settings.target_income or minimum_annual_drawdown
        else:
            annual_drawdown = minimum_annual_drawdown
        
        # Ensure at least minimum
        annual_drawdown = max(annual_drawdown, minimum_annual_drawdown)
        
        # === EXPENSE ANALYSIS ===
        total_expenses = sum(e.annual_amount for e in request.expenses)
        expense_by_category = {}
        for expense in request.expenses:
            if expense.category not in expense_by_category:
                expense_by_category[expense.category] = 0
            expense_by_category[expense.category] += expense.annual_amount
        
        # Income vs Expenses
        total_retirement_income = (
            annual_drawdown + 
            asset_income + 
            other_income + 
            (age_pension_result["annual_pension"] if age_pension_result else 0)
        )
        income_surplus_deficit = total_retirement_income - total_expenses
        
        # === YEAR BY YEAR PROJECTIONS ===
        projections = []
        current_super = total_super_pension
        current_assets = total_assets
        current_liabilities = total_liabilities
        age = person.current_age
        
        for year in range(1, request.projection_years + 1):
            # Update age
            age = person.current_age + year
            
            # Update minimum drawdown rate
            min_rate = get_minimum_drawdown_rate(age)
            min_drawdown = current_super * (min_rate / 100)
            
            # Calculate drawdown for this year
            if settings.strategy == DrawdownStrategy.MINIMUM:
                year_drawdown = min_drawdown
            elif settings.strategy == DrawdownStrategy.PERCENTAGE:
                year_drawdown = max(current_super * ((settings.target_percentage or 5) / 100), min_drawdown)
            elif settings.strategy == DrawdownStrategy.FIXED_AMOUNT:
                year_drawdown = max(settings.target_income or 0, min_drawdown)
            else:
                year_drawdown = min_drawdown
            
            # Super pension after drawdown and growth
            super_growth = (current_super - year_drawdown / 2) * 0.065  # 6.5% average
            current_super = max(0, current_super - year_drawdown + super_growth)
            
            # Other assets growth
            asset_growth = current_assets * 0.06  # 6% average
            current_assets += asset_growth
            
            # Liabilities reduction (simplified)
            liability_reduction = min(current_liabilities * 0.1, current_liabilities)
            current_liabilities -= liability_reduction
            
            # Asset income
            year_asset_income = current_assets * 0.035  # 3.5% yield
            
            # Age Pension
            year_assessable_assets = current_assets + current_super
            year_age_pension = 0
            if request.include_age_pension and age >= AGE_PENSION["pension_age"]:
                year_deemed = calculate_deemed_income(year_assessable_assets, is_single)
                ap_calc = calculate_age_pension(year_assessable_assets, year_deemed, is_single, person.is_homeowner)
                year_age_pension = ap_calc["annual_pension"]
            
            # Total income
            year_total_income = year_drawdown + year_asset_income + year_age_pension
            year_other_income = sum(
                i.annual_amount * (1 + request.inflation_rate/100)**(year-1)
                for i in request.other_income
                if (i.start_age is None or i.start_age <= age) and (i.end_age is None or i.end_age >= age)
            )
            year_total_income += year_other_income
            
            # Expenses (indexed)
            year_expenses = total_expenses * (1 + request.inflation_rate/100)**(year-1)
            
            # Net position
            net_pos = current_super + current_assets - current_liabilities
            
            projections.append({
                "year": year,
                "age": age,
                "super_balance": round(current_super, 2),
                "other_assets": round(current_assets, 2),
                "liabilities": round(current_liabilities, 2),
                "net_position": round(net_pos, 2),
                "super_drawdown": round(year_drawdown, 2),
                "asset_income": round(year_asset_income, 2),
                "age_pension": round(year_age_pension, 2),
                "other_income": round(year_other_income, 2),
                "total_income": round(year_total_income, 2),
                "expenses": round(year_expenses, 2),
                "surplus_deficit": round(year_total_income - year_expenses, 2),
                "minimum_drawdown_rate": min_rate
            })
        
        # === LONGEVITY ANALYSIS ===
        years_funds_last = request.projection_years
        for i, proj in enumerate(projections):
            if proj["super_balance"] <= 0 and proj["other_assets"] <= proj["liabilities"]:
                years_funds_last = i
                break
        
        # Final values
        final_proj = projections[-1] if projections else None
        
        return {
            "calculation_id": f"DEC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
            "calculated_at": datetime.now(timezone.utc).isoformat(),
            "is_client_calculation": request.is_client,
            "client_name": request.client_name,
            
            "summary": {
                "current_age": person.current_age,
                "life_expectancy_years": life_exp,
                "expected_lifespan": person.current_age + int(life_exp),
                "projection_years": request.projection_years,
            },
            
            "current_position": {
                "total_assets": round(total_assets, 2),
                "total_super_pension": round(total_super_pension, 2),
                "total_liabilities": round(total_liabilities, 2),
                "net_position": round(net_position, 2),
                "assessable_assets_pension": round(assessable_assets, 2),
            },
            
            "assets_by_type": assets_by_type,
            "assets_by_entity": assets_by_entity,
            "liabilities_by_type": liabilities_by_type,
            
            "income_analysis": {
                "asset_income": round(asset_income, 2),
                "pension_drawdown": round(annual_drawdown, 2),
                "other_income": round(other_income, 2),
                "age_pension": round(age_pension_result["annual_pension"], 2) if age_pension_result else 0,
                "total_income": round(total_retirement_income, 2),
                "total_expenses": round(total_expenses, 2),
                "surplus_deficit": round(income_surplus_deficit, 2),
            },
            
            "drawdown_analysis": {
                "strategy": settings.strategy.value,
                "minimum_drawdown_rate": min_drawdown_rate,
                "minimum_annual_drawdown": round(minimum_annual_drawdown, 2),
                "planned_annual_drawdown": round(annual_drawdown, 2),
                "transfer_balance_cap": TRANSFER_BALANCE_CAP,
                "within_transfer_balance_cap": total_super_pension <= TRANSFER_BALANCE_CAP,
            },
            
            "age_pension": age_pension_result,
            
            "expense_breakdown": expense_by_category,
            
            "longevity_analysis": {
                "years_funds_projected_to_last": years_funds_last,
                "fund_exhaustion_age": person.current_age + years_funds_last if years_funds_last < request.projection_years else None,
                "final_net_position": final_proj["net_position"] if final_proj else 0,
                "meets_legacy_target": (final_proj["net_position"] if final_proj else 0) >= settings.legacy_target,
            },
            
            "projections": projections,
            
            "assumptions": {
                "inflation_rate": request.inflation_rate,
                "super_return_rate": 6.5,
                "asset_return_rate": 6.0,
                "asset_yield_rate": 3.5,
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare-strategies")
async def compare_drawdown_strategies(request: DecumulationRequest):
    """Compare different drawdown strategies"""
    strategies = [
        DrawdownStrategy.MINIMUM,
        DrawdownStrategy.PERCENTAGE,
        DrawdownStrategy.FIXED_AMOUNT,
    ]
    
    results = []
    for strategy in strategies:
        modified_request = request.copy(deep=True)
        modified_request.drawdown_settings.strategy = strategy
        if strategy == DrawdownStrategy.PERCENTAGE:
            modified_request.drawdown_settings.target_percentage = 5.0
        elif strategy == DrawdownStrategy.FIXED_AMOUNT:
            # Target expenses
            total_expenses = sum(e.annual_amount for e in request.expenses)
            modified_request.drawdown_settings.target_income = total_expenses * 0.7  # 70% from super
        
        calc = await calculate_decumulation(modified_request)
        results.append({
            "strategy": strategy.value,
            "first_year_drawdown": calc["drawdown_analysis"]["planned_annual_drawdown"],
            "first_year_income": calc["income_analysis"]["total_income"],
            "years_funds_last": calc["longevity_analysis"]["years_funds_projected_to_last"],
            "final_net_position": calc["longevity_analysis"]["final_net_position"],
        })
    
    return {
        "comparison_id": f"COMP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        "strategies": results,
        "recommendation": _recommend_strategy(results, request.person.current_age)
    }

def _recommend_strategy(results: List[Dict], current_age: int) -> str:
    """Generate strategy recommendation"""
    # Simple heuristic
    longest_lasting = max(results, key=lambda x: x["years_funds_last"])
    highest_income = max(results, key=lambda x: x["first_year_income"])
    
    if current_age < 70:
        return f"Consider '{longest_lasting['strategy']}' strategy - your funds are projected to last {longest_lasting['years_funds_last']} years. You have time to grow your assets."
    else:
        return f"Consider '{highest_income['strategy']}' strategy - provides higher income of ${highest_income['first_year_income']:,.0f}/year while still lasting {highest_income['years_funds_last']} years."

@router.get("/demo/sample-calculation")
async def get_sample_decumulation():
    """Get a sample decumulation calculation for demonstration"""
    sample_request = DecumulationRequest(
        person=PersonDetails(
            name="John Smith",
            current_age=67,
            gender="male",
            is_homeowner=True,
            relationship_status="single"
        ),
        assets=[
            AssetItem(name="Family Home", asset_type=AssetType.PROPERTY_RESIDENTIAL, entity=EntityType.INDIVIDUAL, current_value=1200000, is_assessable_for_pension=False),
            AssetItem(name="Share Portfolio", asset_type=AssetType.SHARES_AUSTRALIAN, entity=EntityType.INDIVIDUAL, current_value=150000),
            AssetItem(name="Term Deposit", asset_type=AssetType.TERM_DEPOSIT, entity=EntityType.INDIVIDUAL, current_value=100000),
            AssetItem(name="Investment Property", asset_type=AssetType.PROPERTY_INVESTMENT, entity=EntityType.JOINT, current_value=650000),
        ],
        liabilities=[
            LiabilityItem(name="Investment Loan", liability_type=LiabilityType.MORTGAGE_INVESTMENT, entity=EntityType.JOINT, current_balance=200000, interest_rate=6.5)
        ],
        super_pensions=[
            SuperPensionAccount(name="Main Super", fund_name="AustralianSuper", account_type=PensionType.ACCOUNT_BASED, current_balance=850000, investment_option="balanced")
        ],
        other_income=[
            IncomeStream(name="Rental Income", annual_amount=35000, start_age=67, is_taxable=True)
        ],
        expenses=[
            ExpenseItem(name="Living Expenses", annual_amount=50000, category="living"),
            ExpenseItem(name="Healthcare", annual_amount=8000, category="healthcare"),
            ExpenseItem(name="Travel", annual_amount=15000, category="leisure", end_age=80),
        ],
        drawdown_settings=DrawdownSettings(strategy=DrawdownStrategy.MINIMUM),
        include_age_pension=True,
        projection_years=25
    )
    
    return await calculate_decumulation(sample_request)
