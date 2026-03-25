"""
Client Profile Retirement Data Module
Store and sync retirement calculator results to client profiles
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import os

router = APIRouter(prefix="/client-profile", tags=["Client Profile"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "adviceos")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ============== ENUMS ==============

class EntityStructure(str, Enum):
    PERSONAL = "personal"
    JOINT = "joint"
    COMPANY = "company"
    TRUST = "trust"
    SMSF = "smsf"
    SUPER_FUND = "super_fund"

class CalculationType(str, Enum):
    ACCUMULATION = "accumulation"
    DECUMULATION = "decumulation"
    COMBINED = "combined"

# ============== MODELS ==============

class StructureBalance(BaseModel):
    structure: EntityStructure
    structure_name: Optional[str] = None  # e.g., "Smith Family Trust"
    super_balance: float = Field(default=0, ge=0)
    investment_balance: float = Field(default=0, ge=0)
    property_value: float = Field(default=0, ge=0)
    cash_balance: float = Field(default=0, ge=0)
    liabilities: float = Field(default=0, ge=0)
    net_position: float = Field(default=0)

class RetirementProfileData(BaseModel):
    # Client identification
    client_id: str
    client_name: str
    adviser_id: Optional[str] = None
    
    # Personal details
    current_age: int = Field(ge=18, le=100)
    retirement_age: int = Field(ge=55, le=85)
    gender: str = Field(default="male")
    is_homeowner: bool = Field(default=True)
    relationship_status: str = Field(default="single")
    
    # Multi-structure balances
    structures: List[StructureBalance] = Field(default=[])
    
    # Calculation results - Accumulation
    accumulation_calculation_id: Optional[str] = None
    projected_balance_at_retirement: Optional[float] = None
    projected_balance_real: Optional[float] = None
    total_contributions: Optional[float] = None
    investment_profile: Optional[str] = None
    
    # Calculation results - Decumulation
    decumulation_calculation_id: Optional[str] = None
    drawdown_strategy: Optional[str] = None
    projected_annual_income: Optional[float] = None
    years_funds_last: Optional[int] = None
    age_pension_eligible: Optional[bool] = None
    age_pension_annual: Optional[float] = None
    
    # Asset allocation
    asset_allocation: Optional[Dict[str, float]] = None
    
    # Goals
    legacy_target: Optional[float] = None
    income_target: Optional[float] = None
    
    # Metadata
    last_accumulation_calc: Optional[str] = None
    last_decumulation_calc: Optional[str] = None
    notes: Optional[str] = None

class SaveRetirementDataRequest(BaseModel):
    client_id: str
    client_name: str
    calculation_type: CalculationType
    calculation_id: str
    calculation_data: Dict[str, Any]
    structures: Optional[List[StructureBalance]] = None
    push_to_platforms: Optional[List[str]] = None  # Platform IDs

class MultiStructureCalculationRequest(BaseModel):
    """Request for combined multi-structure retirement calculation"""
    client_id: str
    client_name: str
    calculation_type: CalculationType
    
    # Personal details
    current_age: int
    retirement_age: int
    gender: str = "male"
    
    # Multiple structures to include
    structures: List[Dict[str, Any]]  # Each structure has its own assets/super
    
    # Combined settings
    investment_profile: str = "balanced"
    inflation_rate: float = 2.5
    include_age_pension: bool = True
    
    # For decumulation
    drawdown_strategy: Optional[str] = None
    target_income: Optional[float] = None

# ============== ENDPOINTS ==============

@router.post("/retirement/save")
async def save_retirement_data(request: SaveRetirementDataRequest):
    """
    Save retirement calculator results to a client's profile
    Optionally push to connected platforms
    """
    db = await get_db()
    
    # Prepare profile data
    now = datetime.now(timezone.utc).isoformat()
    
    profile_update = {
        "client_id": request.client_id,
        "client_name": request.client_name,
        "updated_at": now
    }
    
    # Add calculation-specific data
    if request.calculation_type == CalculationType.ACCUMULATION:
        profile_update.update({
            "accumulation_calculation_id": request.calculation_id,
            "last_accumulation_calc": now,
            "projected_balance_at_retirement": request.calculation_data.get("summary", {}).get("projected_final_balance"),
            "projected_balance_real": request.calculation_data.get("summary", {}).get("projected_final_balance_real"),
            "total_contributions": request.calculation_data.get("summary", {}).get("total_contributions"),
            "investment_profile": request.calculation_data.get("investment", {}).get("profile"),
            "asset_allocation": request.calculation_data.get("investment", {}).get("allocation"),
            "current_age": request.calculation_data.get("summary", {}).get("current_age"),
            "retirement_age": request.calculation_data.get("summary", {}).get("retirement_age"),
        })
    elif request.calculation_type == CalculationType.DECUMULATION:
        profile_update.update({
            "decumulation_calculation_id": request.calculation_id,
            "last_decumulation_calc": now,
            "drawdown_strategy": request.calculation_data.get("drawdown_analysis", {}).get("strategy"),
            "projected_annual_income": request.calculation_data.get("income_analysis", {}).get("total_income"),
            "years_funds_last": request.calculation_data.get("longevity_analysis", {}).get("years_funds_projected_to_last"),
            "age_pension_eligible": request.calculation_data.get("age_pension", {}).get("eligible"),
            "age_pension_annual": request.calculation_data.get("age_pension", {}).get("annual_pension"),
            "current_age": request.calculation_data.get("summary", {}).get("current_age"),
            "legacy_target": request.calculation_data.get("drawdown_analysis", {}).get("legacy_target"),
        })
    
    # Add structures if provided
    if request.structures:
        profile_update["structures"] = [s.dict() for s in request.structures]
    
    # Upsert to database
    result = await db.client_retirement_profiles.update_one(
        {"client_id": request.client_id},
        {"$set": profile_update},
        upsert=True
    )
    
    # Store full calculation for history
    await db.retirement_calculations.insert_one({
        "calculation_id": request.calculation_id,
        "client_id": request.client_id,
        "calculation_type": request.calculation_type.value,
        "data": request.calculation_data,
        "structures": [s.dict() for s in request.structures] if request.structures else None,
        "created_at": now
    })
    
    # Push to platforms if requested
    push_results = []
    if request.push_to_platforms:
        from .platform_integrations import push_retirement_data, RetirementDataPush, Platform
        
        push_request = RetirementDataPush(
            client_id=request.client_id,
            target_platforms=[Platform(p) for p in request.push_to_platforms],
            calculation_type=request.calculation_type.value,
            calculation_id=request.calculation_id,
            data=request.calculation_data
        )
        
        push_result = await push_retirement_data(push_request)
        push_results = push_result.get("results", [])
    
    return {
        "status": "success",
        "client_id": request.client_id,
        "calculation_id": request.calculation_id,
        "calculation_type": request.calculation_type.value,
        "profile_updated": True,
        "saved_at": now,
        "platform_push_results": push_results if push_results else None,
        "message": f"Retirement {request.calculation_type.value} data saved to client profile"
    }

@router.get("/retirement/{client_id}")
async def get_retirement_profile(client_id: str):
    """Get a client's retirement profile data"""
    db = await get_db()
    
    profile = await db.client_retirement_profiles.find_one(
        {"client_id": client_id},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail=f"No retirement profile found for client {client_id}")
    
    # Get calculation history
    calculations = await db.retirement_calculations.find(
        {"client_id": client_id},
        {"_id": 0, "data": 0}  # Exclude full data for summary
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    return {
        "profile": profile,
        "calculation_history": calculations
    }

@router.get("/retirement/{client_id}/calculation/{calculation_id}")
async def get_calculation_detail(client_id: str, calculation_id: str):
    """Get full details of a specific calculation"""
    db = await get_db()
    
    calculation = await db.retirement_calculations.find_one(
        {"client_id": client_id, "calculation_id": calculation_id},
        {"_id": 0}
    )
    
    if not calculation:
        raise HTTPException(status_code=404, detail=f"Calculation {calculation_id} not found")
    
    return calculation

@router.get("/retirement")
async def list_retirement_profiles(
    adviser_id: Optional[str] = None,
    limit: int = 50
):
    """List all client retirement profiles"""
    db = await get_db()
    
    query = {}
    if adviser_id:
        query["adviser_id"] = adviser_id
    
    profiles = await db.client_retirement_profiles.find(
        query,
        {"_id": 0}
    ).sort("updated_at", -1).limit(limit).to_list(length=limit)
    
    return {
        "profiles": profiles,
        "total": len(profiles)
    }

@router.post("/multi-structure/calculate")
async def calculate_multi_structure(request: MultiStructureCalculationRequest):
    """
    Calculate retirement projections across multiple structures combined
    Aggregates Personal + Joint + SMSF + Trust + Company assets
    """
    
    # Aggregate totals across structures
    total_super = 0
    total_investments = 0
    total_property = 0
    total_cash = 0
    total_liabilities = 0
    structure_breakdown = []
    
    for structure in request.structures:
        struct_type = structure.get("structure", "personal")
        struct_name = structure.get("name", struct_type.title())
        
        super_bal = structure.get("super_balance", 0)
        invest_bal = structure.get("investment_balance", 0)
        property_val = structure.get("property_value", 0)
        cash_bal = structure.get("cash_balance", 0)
        liabilities = structure.get("liabilities", 0)
        
        struct_total = super_bal + invest_bal + property_val + cash_bal
        struct_net = struct_total - liabilities
        
        total_super += super_bal
        total_investments += invest_bal
        total_property += property_val
        total_cash += cash_bal
        total_liabilities += liabilities
        
        structure_breakdown.append({
            "structure": struct_type,
            "name": struct_name,
            "super_balance": super_bal,
            "investment_balance": invest_bal,
            "property_value": property_val,
            "cash_balance": cash_bal,
            "total_assets": struct_total,
            "liabilities": liabilities,
            "net_position": struct_net
        })
    
    total_assets = total_super + total_investments + total_property + total_cash
    net_position = total_assets - total_liabilities
    
    # Investment profile returns
    profile_returns = {
        "conservative": 5.0,
        "moderately_conservative": 6.0,
        "balanced": 7.0,
        "growth": 8.0,
        "aggressive": 9.5
    }
    annual_return = profile_returns.get(request.investment_profile, 7.0)
    
    # Calculate projections based on type
    if request.calculation_type in [CalculationType.ACCUMULATION, CalculationType.COMBINED]:
        years_to_retirement = request.retirement_age - request.current_age
        
        # Simple projection (would use full calculator in production)
        projected_super = total_super * ((1 + annual_return/100) ** years_to_retirement)
        projected_investments = total_investments * ((1 + (annual_return-1)/100) ** years_to_retirement)
        projected_property = total_property * ((1 + 5/100) ** years_to_retirement)
        projected_cash = total_cash * ((1 + 4/100) ** years_to_retirement)
        
        # Assume liabilities paid down
        projected_liabilities = max(0, total_liabilities - (total_liabilities / years_to_retirement * years_to_retirement * 0.8))
        
        projected_total = projected_super + projected_investments + projected_property + projected_cash
        projected_net = projected_total - projected_liabilities
    else:
        years_to_retirement = 0
        projected_total = total_assets
        projected_net = net_position
        projected_super = total_super
        projected_investments = total_investments
        projected_property = total_property
        projected_cash = total_cash
        projected_liabilities = total_liabilities
    
    calculation_id = f"MULTI-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    result = {
        "calculation_id": calculation_id,
        "calculation_type": request.calculation_type.value,
        "is_multi_structure": True,
        "calculated_at": datetime.now(timezone.utc).isoformat(),
        
        "client": {
            "client_id": request.client_id,
            "client_name": request.client_name,
            "current_age": request.current_age,
            "retirement_age": request.retirement_age
        },
        
        "current_position": {
            "total_super": total_super,
            "total_investments": total_investments,
            "total_property": total_property,
            "total_cash": total_cash,
            "total_assets": total_assets,
            "total_liabilities": total_liabilities,
            "net_position": net_position,
            "structures_count": len(request.structures)
        },
        
        "structure_breakdown": structure_breakdown,
        
        "projected_position": {
            "years_to_retirement": years_to_retirement,
            "projected_super": round(projected_super, 2),
            "projected_investments": round(projected_investments, 2),
            "projected_property": round(projected_property, 2),
            "projected_cash": round(projected_cash, 2),
            "projected_total": round(projected_total, 2),
            "projected_liabilities": round(projected_liabilities, 2),
            "projected_net_position": round(projected_net, 2)
        },
        
        "investment_profile": {
            "profile": request.investment_profile,
            "annual_return": annual_return,
            "inflation_rate": request.inflation_rate
        },
        
        "asset_allocation": {
            "super": round(total_super / total_assets * 100, 1) if total_assets > 0 else 0,
            "investments": round(total_investments / total_assets * 100, 1) if total_assets > 0 else 0,
            "property": round(total_property / total_assets * 100, 1) if total_assets > 0 else 0,
            "cash": round(total_cash / total_assets * 100, 1) if total_assets > 0 else 0
        }
    }
    
    # Add decumulation specific data if applicable
    if request.calculation_type in [CalculationType.DECUMULATION, CalculationType.COMBINED]:
        # Simplified decumulation projection
        sustainable_rate = 4.5  # Safe withdrawal rate
        annual_income = net_position * (sustainable_rate / 100)
        years_funds_last = int(net_position / annual_income) if annual_income > 0 else 0
        
        result["decumulation"] = {
            "drawdown_strategy": request.drawdown_strategy or "minimum",
            "sustainable_withdrawal_rate": sustainable_rate,
            "projected_annual_income": round(annual_income, 2),
            "years_funds_projected_to_last": min(years_funds_last, 40),
            "target_income": request.target_income
        }
    
    return result

@router.get("/structures")
async def get_available_structures():
    """Get list of available entity structures with descriptions"""
    return {
        "structures": [
            {
                "id": "personal",
                "name": "Personal / Individual",
                "description": "Assets held in your own name",
                "tax_treatment": "Personal tax rates apply",
                "asset_protection": "Limited",
                "icon": "user"
            },
            {
                "id": "joint",
                "name": "Joint",
                "description": "Assets held jointly with spouse/partner",
                "tax_treatment": "Income split 50/50 or as per ownership",
                "asset_protection": "Limited",
                "icon": "users"
            },
            {
                "id": "company",
                "name": "Company",
                "description": "Assets held through a company structure",
                "tax_treatment": "30% company tax rate (25% for base rate entities)",
                "asset_protection": "Good - separate legal entity",
                "icon": "building"
            },
            {
                "id": "trust",
                "name": "Family Trust",
                "description": "Assets held in a discretionary family trust",
                "tax_treatment": "Distributed to beneficiaries at their marginal rates",
                "asset_protection": "Good - assets held by trustee",
                "icon": "shield"
            },
            {
                "id": "smsf",
                "name": "SMSF",
                "description": "Self-Managed Superannuation Fund",
                "tax_treatment": "15% accumulation, 0% pension phase",
                "asset_protection": "Excellent - protected from creditors",
                "icon": "piggy-bank"
            },
            {
                "id": "super_fund",
                "name": "Industry/Retail Super",
                "description": "Industry or retail superannuation fund",
                "tax_treatment": "15% accumulation, 0% pension phase",
                "asset_protection": "Excellent - protected from creditors",
                "icon": "landmark"
            }
        ],
        "note": "Different structures offer various tax, asset protection, and estate planning benefits. Consult a financial adviser for personalized advice."
    }
