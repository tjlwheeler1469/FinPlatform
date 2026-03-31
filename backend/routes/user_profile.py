"""
User Profile API - Manage user profile data and preferences
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import os
from pymongo import MongoClient

router = APIRouter(prefix="/api/user-profile", tags=["User Profile"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]
profiles_collection = db["user_profiles"]

class UserProfile(BaseModel):
    user_id: str
    first_name: str
    last_name: str
    partner_first_name: Optional[str] = None
    partner_last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format
    partner_date_of_birth: Optional[str] = None
    marital_status: str = "single"  # single, married, de_facto, divorced, widowed
    retirement_age: int = 67
    partner_retirement_age: Optional[int] = 67
    risk_profile: str = "balanced"  # conservative, moderately_conservative, balanced, growth, high_growth
    annual_income: Optional[float] = None
    partner_annual_income: Optional[float] = None
    annual_expenses: Optional[float] = None
    children: int = 0
    home_owner: bool = True
    preferred_language: str = "en"
    currency: str = "AUD"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    partner_first_name: Optional[str] = None
    partner_last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    partner_date_of_birth: Optional[str] = None
    marital_status: Optional[str] = None
    retirement_age: Optional[int] = None
    partner_retirement_age: Optional[int] = None
    risk_profile: Optional[str] = None
    annual_income: Optional[float] = None
    partner_annual_income: Optional[float] = None
    annual_expenses: Optional[float] = None
    children: Optional[int] = None
    home_owner: Optional[bool] = None
    preferred_language: Optional[str] = None
    currency: Optional[str] = None

# Default profile for demo (Thompson family)
DEFAULT_PROFILE = {
    "user_id": "thompson_family",
    "first_name": "David",
    "last_name": "Thompson",
    "partner_first_name": "Sarah",
    "partner_last_name": "Thompson",
    "email": "david.sarah@example.com",
    "phone": "+61 412 345 678",
    "date_of_birth": "1976-03-15",
    "partner_date_of_birth": "1976-08-22",
    "marital_status": "married",
    "retirement_age": 67,
    "partner_retirement_age": 67,
    "risk_profile": "balanced",
    "annual_income": 125000,
    "partner_annual_income": 60000,
    "annual_expenses": 95000,
    "children": 2,
    "home_owner": True,
    "preferred_language": "en",
    "currency": "AUD",
    "created_at": "2024-01-15T00:00:00",
    "updated_at": datetime.utcnow().isoformat()
}

def calculate_age(birth_date_str: str) -> int:
    """Calculate age from birth date string"""
    if not birth_date_str:
        return 0
    try:
        birth_date = datetime.fromisoformat(birth_date_str.replace('Z', '+00:00'))
        today = datetime.now()
        age = today.year - birth_date.year
        if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
            age -= 1
        return age
    except Exception:
        return 0

@router.get("/{user_id}", response_model=UserProfile)
async def get_profile(user_id: str):
    """Get user profile by ID"""
    # Try to get from database
    profile = profiles_collection.find_one({"user_id": user_id}, {"_id": 0})
    
    if not profile:
        # Return default profile for demo
        if user_id == "thompson_family" or user_id == "default":
            return UserProfile(**DEFAULT_PROFILE)
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return UserProfile(**profile)

@router.put("/{user_id}", response_model=UserProfile)
async def update_profile(user_id: str, update_data: ProfileUpdateRequest):
    """Update user profile"""
    # Get existing profile or create default
    existing = profiles_collection.find_one({"user_id": user_id}, {"_id": 0})
    
    if not existing:
        existing = DEFAULT_PROFILE.copy()
        existing["user_id"] = user_id
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True, exclude_none=True)
    update_dict["updated_at"] = datetime.utcnow().isoformat()
    
    for key, value in update_dict.items():
        existing[key] = value
    
    # Upsert to database
    profiles_collection.update_one(
        {"user_id": user_id},
        {"$set": existing},
        upsert=True
    )
    
    return UserProfile(**existing)

@router.post("/", response_model=UserProfile)
async def create_profile(profile: UserProfile):
    """Create a new user profile"""
    profile_dict = profile.dict()
    profile_dict["created_at"] = datetime.utcnow().isoformat()
    profile_dict["updated_at"] = datetime.utcnow().isoformat()
    
    # Check if exists
    existing = profiles_collection.find_one({"user_id": profile.user_id})
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    
    profiles_collection.insert_one(profile_dict)
    
    return profile

@router.get("/{user_id}/summary")
async def get_profile_summary(user_id: str) -> Dict[str, Any]:
    """Get profile summary with calculated fields"""
    profile = await get_profile(user_id)
    
    age = calculate_age(profile.date_of_birth)
    partner_age = calculate_age(profile.partner_date_of_birth) if profile.partner_date_of_birth else None
    
    years_to_retirement = max(0, profile.retirement_age - age) if age else profile.retirement_age - 50
    
    combined_income = (profile.annual_income or 0) + (profile.partner_annual_income or 0)
    savings_rate = ((combined_income - (profile.annual_expenses or 0)) / combined_income * 100) if combined_income > 0 else 0
    
    display_name = f"{profile.first_name}"
    if profile.partner_first_name:
        display_name += f" & {profile.partner_first_name} {profile.last_name}"
    else:
        display_name += f" {profile.last_name}"
    
    return {
        "user_id": profile.user_id,
        "display_name": display_name,
        "age": age,
        "partner_age": partner_age,
        "marital_status": profile.marital_status,
        "years_to_retirement": years_to_retirement,
        "retirement_age": profile.retirement_age,
        "combined_income": combined_income,
        "annual_expenses": profile.annual_expenses,
        "savings_rate": round(savings_rate, 1),
        "risk_profile": profile.risk_profile,
        "children": profile.children,
        "home_owner": profile.home_owner,
        "preferred_language": profile.preferred_language
    }
