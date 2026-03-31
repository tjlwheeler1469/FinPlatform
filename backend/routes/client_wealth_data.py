"""
Client Wealth Data API for Retirement Planning
Provides unified access to client wealth data for the Retirement Planner
"""

import os
import logging
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/wealth-data", tags=["Client Wealth Data"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ==================== MODELS ====================

class AssetData(BaseModel):
    id: str
    name: str
    type: str  # cash, shares_au, shares_intl, property, super_accum, etc.
    entity: str  # personal, joint, company, trust, smsf
    value: float
    cost_base: float
    annual_yield: float = 5.0
    is_assessable: bool = True

class LiabilityData(BaseModel):
    id: str
    name: str
    entity: str
    balance: float
    interest_rate: float
    monthly_payment: float
    years_remaining: int

class IncomeData(BaseModel):
    id: str
    name: str
    entity: str
    amount: float
    type: str  # employment, rental, dividend, interest, etc.
    ends_at_retirement: bool = True

class ExpenseData(BaseModel):
    category: str
    label: str
    monthly: float
    escalation_rate: float = 3.0

class PersonData(BaseModel):
    id: int
    name: str
    current_age: int
    retirement_age: int = 65
    life_expectancy: int = 90
    gender: str = "male"

class ClientWealthSnapshot(BaseModel):
    client_id: str
    client_name: str
    as_at_date: str
    people: List[PersonData]
    is_couple: bool = False
    assets: List[AssetData]
    liabilities: List[LiabilityData]
    incomes: List[IncomeData]
    expenses: List[ExpenseData]
    total_assets: float
    total_liabilities: float
    net_worth: float
    total_income: float
    total_expenses: float

# ==================== API ENDPOINTS ====================

@router.get("/snapshot/{client_id}")
async def get_client_wealth_snapshot(client_id: str):
    """Get comprehensive wealth snapshot for a client for retirement planning"""
    db = await get_db()
    
    # Try to get from stored client data
    client = await db.clients.find_one({"client_id": client_id}, {"_id": 0})
    
    if client:
        # Build snapshot from stored data
        assets = await db.client_assets.find(
            {"client_id": client_id},
            {"_id": 0}
        ).to_list(length=100)
        
        liabilities = await db.client_liabilities.find(
            {"client_id": client_id},
            {"_id": 0}
        ).to_list(length=50)
        
        incomes = await db.client_incomes.find(
            {"client_id": client_id},
            {"_id": 0}
        ).to_list(length=50)
        
        return {
            "client_id": client_id,
            "client_name": client.get("name", "Client"),
            "as_at_date": datetime.now(timezone.utc).isoformat(),
            "people": client.get("people", []),
            "is_couple": client.get("is_couple", False),
            "assets": assets,
            "liabilities": liabilities,
            "incomes": incomes,
            "expenses": client.get("expenses", get_default_expenses()),
            "total_assets": sum(a.get("value", 0) for a in assets),
            "total_liabilities": sum(item.get("balance", 0) for item in liabilities),
            "net_worth": sum(a.get("value", 0) for a in assets) - sum(item.get("balance", 0) for item in liabilities),
            "total_income": sum(i.get("amount", 0) for i in incomes),
            "total_expenses": sum(e.get("monthly", 0) for e in client.get("expenses", get_default_expenses())) * 12
        }
    
    # Return sample data for demo purposes
    return get_demo_wealth_snapshot(client_id)

@router.post("/save/{client_id}")
async def save_client_wealth_data(client_id: str, data: ClientWealthSnapshot):
    """Save client wealth data for retirement planning"""
    db = await get_db()
    
    # Save client basic info
    await db.clients.update_one(
        {"client_id": client_id},
        {"$set": {
            "client_id": client_id,
            "name": data.client_name,
            "people": [p.model_dump() for p in data.people],
            "is_couple": data.is_couple,
            "expenses": [e.model_dump() for e in data.expenses],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Save assets
    await db.client_assets.delete_many({"client_id": client_id})
    if data.assets:
        assets_to_insert = [
            {**a.model_dump(), "client_id": client_id}
            for a in data.assets
        ]
        await db.client_assets.insert_many(assets_to_insert)
    
    # Save liabilities
    await db.client_liabilities.delete_many({"client_id": client_id})
    if data.liabilities:
        liabilities_to_insert = [
            {**item.model_dump(), "client_id": client_id}
            for item in data.liabilities
        ]
        await db.client_liabilities.insert_many(liabilities_to_insert)
    
    # Save incomes
    await db.client_incomes.delete_many({"client_id": client_id})
    if data.incomes:
        incomes_to_insert = [
            {**i.model_dump(), "client_id": client_id}
            for i in data.incomes
        ]
        await db.client_incomes.insert_many(incomes_to_insert)
    
    return {"success": True, "client_id": client_id}

@router.get("/list")
async def list_clients_with_wealth_data():
    """List all clients with wealth data"""
    db = await get_db()
    
    clients = await db.clients.find(
        {},
        {"_id": 0, "client_id": 1, "name": 1, "updated_at": 1}
    ).to_list(length=100)
    
    # Add demo client if no real clients
    if not clients:
        clients = [
            {"client_id": "demo_client", "name": "Demo Client", "updated_at": datetime.now(timezone.utc).isoformat()}
        ]
    
    return {"clients": clients, "total": len(clients)}

@router.get("/entities")
async def get_entity_types():
    """Get available entity types for wealth organization"""
    return {
        "entities": [
            {"value": "personal", "label": "Personal", "icon": "👤", "color": "#3b82f6", "cgt_discount": 0.5},
            {"value": "joint", "label": "Joint", "icon": "👥", "color": "#8b5cf6", "cgt_discount": 0.5},
            {"value": "company", "label": "Company", "icon": "🏢", "color": "#f59e0b", "cgt_discount": 0},
            {"value": "trust", "label": "Family Trust", "icon": "🏛️", "color": "#22c55e", "cgt_discount": 0.5},
            {"value": "smsf", "label": "SMSF", "icon": "💼", "color": "#ec4899", "cgt_discount": 0.333}
        ]
    }

@router.get("/asset-types")
async def get_asset_types():
    """Get available asset types with default yields"""
    return {
        "asset_types": [
            {"value": "cash", "label": "Cash", "default_yield": 4.5},
            {"value": "term_deposit", "label": "Term Deposit", "default_yield": 5.0},
            {"value": "shares_au", "label": "Australian Shares", "default_yield": 8.5},
            {"value": "shares_intl", "label": "International Shares", "default_yield": 9.0},
            {"value": "etf", "label": "ETFs", "default_yield": 8.0},
            {"value": "managed_fund", "label": "Managed Funds", "default_yield": 7.5},
            {"value": "property", "label": "Property", "default_yield": 6.0},
            {"value": "super_accum", "label": "Super (Accumulation)", "default_yield": 7.5},
            {"value": "super_pension", "label": "Super (Pension)", "default_yield": 7.0},
            {"value": "bonds", "label": "Bonds", "default_yield": 5.5},
            {"value": "crypto", "label": "Crypto", "default_yield": 12.0}
        ]
    }

# ==================== HELPER FUNCTIONS ====================

def get_default_expenses():
    """Get default expense categories"""
    return [
        {"category": "housing", "label": "Housing & Utilities", "monthly": 2500, "escalation_rate": 3.0},
        {"category": "food", "label": "Food & Groceries", "monthly": 1200, "escalation_rate": 3.0},
        {"category": "transport", "label": "Transport", "monthly": 800, "escalation_rate": 3.0},
        {"category": "health", "label": "Health & Medical", "monthly": 400, "escalation_rate": 4.0},
        {"category": "insurance", "label": "Insurance", "monthly": 300, "escalation_rate": 3.0},
        {"category": "entertainment", "label": "Entertainment & Dining", "monthly": 600, "escalation_rate": 3.0},
        {"category": "travel", "label": "Travel & Holidays", "monthly": 500, "escalation_rate": 3.0},
        {"category": "personal", "label": "Personal & Clothing", "monthly": 300, "escalation_rate": 3.0},
        {"category": "education", "label": "Education", "monthly": 0, "escalation_rate": 4.0},
        {"category": "other", "label": "Other", "monthly": 400, "escalation_rate": 3.0}
    ]

def get_demo_wealth_snapshot(client_id: str):
    """Get demo wealth snapshot for testing"""
    return {
        "client_id": client_id,
        "client_name": "James & Sarah Mitchell",
        "as_at_date": datetime.now(timezone.utc).isoformat(),
        "people": [
            {"id": 1, "name": "James", "current_age": 45, "retirement_age": 65, "life_expectancy": 90, "gender": "male"},
            {"id": 2, "name": "Sarah", "current_age": 43, "retirement_age": 65, "life_expectancy": 92, "gender": "female"}
        ],
        "is_couple": True,
        "assets": [
            {"id": "A001", "name": "Family Home", "type": "property", "entity": "joint", "value": 1200000, "cost_base": 600000, "annual_yield": 5.0, "is_assessable": False},
            {"id": "A002", "name": "Share Portfolio - James", "type": "shares_au", "entity": "personal", "value": 250000, "cost_base": 150000, "annual_yield": 8.5, "is_assessable": True},
            {"id": "A003", "name": "Super - James", "type": "super_accum", "entity": "smsf", "value": 450000, "cost_base": 450000, "annual_yield": 7.5, "is_assessable": True},
            {"id": "A004", "name": "Super - Sarah", "type": "super_accum", "entity": "smsf", "value": 320000, "cost_base": 320000, "annual_yield": 7.5, "is_assessable": True},
            {"id": "A005", "name": "Term Deposit", "type": "term_deposit", "entity": "joint", "value": 100000, "cost_base": 100000, "annual_yield": 5.0, "is_assessable": True},
            {"id": "A006", "name": "Investment Property", "type": "property", "entity": "trust", "value": 650000, "cost_base": 400000, "annual_yield": 6.0, "is_assessable": True},
            {"id": "A007", "name": "ETF Portfolio", "type": "etf", "entity": "company", "value": 180000, "cost_base": 140000, "annual_yield": 8.0, "is_assessable": True}
        ],
        "liabilities": [
            {"id": "L001", "name": "Home Mortgage", "entity": "joint", "balance": 350000, "interest_rate": 6.5, "monthly_payment": 2800, "years_remaining": 15},
            {"id": "L002", "name": "Investment Loan", "entity": "trust", "balance": 200000, "interest_rate": 7.0, "monthly_payment": 1500, "years_remaining": 20}
        ],
        "incomes": [
            {"id": "I001", "name": "Salary - James", "entity": "personal", "amount": 150000, "type": "employment", "ends_at_retirement": True},
            {"id": "I002", "name": "Salary - Sarah", "entity": "personal", "amount": 95000, "type": "employment", "ends_at_retirement": True},
            {"id": "I003", "name": "Rental Income", "entity": "trust", "amount": 36000, "type": "rental", "ends_at_retirement": False},
            {"id": "I004", "name": "Dividend Income", "entity": "company", "amount": 12000, "type": "dividend", "ends_at_retirement": False}
        ],
        "expenses": get_default_expenses(),
        "total_assets": 3150000,
        "total_liabilities": 550000,
        "net_worth": 2600000,
        "total_income": 293000,
        "total_expenses": 84000
    }
