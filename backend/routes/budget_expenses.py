"""
Budget & Expenses Module
Comprehensive budgeting with goals, alerts, and tracking
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime, timezone
from enum import Enum
import uuid
import os

router = APIRouter(prefix="/budget", tags=["Budget & Expenses"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "adviceos")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ============== ENUMS ==============

class ExpenseCategory(str, Enum):
    HOUSING = "housing"
    UTILITIES = "utilities"
    GROCERIES = "groceries"
    TRANSPORT = "transport"
    INSURANCE = "insurance"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    DINING = "dining"
    SHOPPING = "shopping"
    SUBSCRIPTIONS = "subscriptions"
    PERSONAL = "personal"
    SAVINGS = "savings"
    DEBT_REPAYMENT = "debt_repayment"
    INVESTMENTS = "investments"
    SUPERANNUATION = "superannuation"
    OTHER = "other"

class IncomeCategory(str, Enum):
    SALARY = "salary"
    BONUS = "bonus"
    RENTAL = "rental"
    DIVIDENDS = "dividends"
    INTEREST = "interest"
    BUSINESS = "business"
    PENSION = "pension"
    GOVERNMENT = "government"
    OTHER = "other"

class Frequency(str, Enum):
    WEEKLY = "weekly"
    FORTNIGHTLY = "fortnightly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    ONE_OFF = "one_off"

class AlertType(str, Enum):
    OVER_BUDGET = "over_budget"
    APPROACHING_LIMIT = "approaching_limit"
    GOAL_ACHIEVED = "goal_achieved"
    GOAL_AT_RISK = "goal_at_risk"
    UNUSUAL_SPENDING = "unusual_spending"
    INCOME_CHANGE = "income_change"

class GoalStatus(str, Enum):
    ACTIVE = "active"
    ON_TRACK = "on_track"
    AT_RISK = "at_risk"
    ACHIEVED = "achieved"
    FAILED = "failed"
    PAUSED = "paused"

# ============== FREQUENCY CONVERSION ==============

FREQUENCY_TO_MONTHLY = {
    "weekly": 52 / 12,
    "fortnightly": 26 / 12,
    "monthly": 1,
    "quarterly": 1 / 3,
    "annual": 1 / 12,
    "one_off": 1 / 12  # Spread over year
}

CATEGORY_ICONS = {
    "housing": "🏠",
    "utilities": "⚡",
    "groceries": "🛒",
    "transport": "🚗",
    "insurance": "🛡️",
    "healthcare": "🏥",
    "education": "📚",
    "entertainment": "🎬",
    "dining": "🍽️",
    "shopping": "🛍️",
    "subscriptions": "📱",
    "personal": "👤",
    "savings": "💰",
    "debt_repayment": "💳",
    "investments": "📈",
    "superannuation": "🏦",
    "other": "📦"
}

# ============== MODELS ==============

class IncomeItem(BaseModel):
    income_id: Optional[str] = None
    source: str
    category: IncomeCategory
    amount: float = Field(ge=0)
    frequency: Frequency
    is_taxable: bool = True
    notes: Optional[str] = None

class ExpenseItem(BaseModel):
    expense_id: Optional[str] = None
    description: str
    category: ExpenseCategory
    amount: float = Field(ge=0)
    frequency: Frequency
    is_essential: bool = True
    notes: Optional[str] = None

class BudgetGoal(BaseModel):
    goal_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    target_amount: float = Field(ge=0)
    current_amount: float = Field(default=0, ge=0)
    target_date: Optional[str] = None
    monthly_contribution: Optional[float] = None
    category: Optional[str] = None  # e.g., "savings", "emergency_fund", "holiday"
    status: GoalStatus = GoalStatus.ACTIVE
    auto_transfer: bool = False

class BudgetAlert(BaseModel):
    alert_id: Optional[str] = None
    alert_type: AlertType
    category: Optional[str] = None
    threshold_percentage: float = Field(default=80, ge=0, le=100)
    is_enabled: bool = True
    message: Optional[str] = None

class ClientBudget(BaseModel):
    client_id: str
    client_name: str
    incomes: List[IncomeItem] = []
    expenses: List[ExpenseItem] = []
    goals: List[BudgetGoal] = []
    alerts: List[BudgetAlert] = []
    category_budgets: Dict[str, float] = {}  # Category -> monthly budget limit

class BudgetTransaction(BaseModel):
    transaction_id: Optional[str] = None
    client_id: str
    date: str
    description: str
    amount: float
    category: str
    is_income: bool = False
    notes: Optional[str] = None

# ============== ENDPOINTS ==============

@router.get("/categories")
async def get_budget_categories():
    """Get all available budget categories with icons"""
    return {
        "expense_categories": [
            {"id": c.value, "name": c.value.replace("_", " ").title(), "icon": CATEGORY_ICONS.get(c.value, "📦")}
            for c in ExpenseCategory
        ],
        "income_categories": [
            {"id": c.value, "name": c.value.replace("_", " ").title()}
            for c in IncomeCategory
        ],
        "frequencies": [
            {"id": f.value, "name": f.value.replace("_", " ").title(), "monthly_multiplier": FREQUENCY_TO_MONTHLY[f.value]}
            for f in Frequency
        ]
    }

@router.post("/client/{client_id}")
async def create_or_update_budget(client_id: str, budget: ClientBudget):
    """Create or update a client's budget"""
    db = await get_db()
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Add IDs to items if missing
    for income in budget.incomes:
        if not income.income_id:
            income.income_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    
    for expense in budget.expenses:
        if not expense.expense_id:
            expense.expense_id = f"EXP-{uuid.uuid4().hex[:6].upper()}"
    
    for goal in budget.goals:
        if not goal.goal_id:
            goal.goal_id = f"GOAL-{uuid.uuid4().hex[:6].upper()}"
    
    for alert in budget.alerts:
        if not alert.alert_id:
            alert.alert_id = f"ALERT-{uuid.uuid4().hex[:6].upper()}"
    
    budget_dict = budget.dict()
    budget_dict["updated_at"] = now
    
    await db.client_budgets.update_one(
        {"client_id": client_id},
        {"$set": budget_dict, "$setOnInsert": {"created_at": now}},
        upsert=True
    )
    
    # Calculate summary
    summary = await calculate_budget_summary(client_id)
    
    return {
        "client_id": client_id,
        "status": "saved",
        "summary": summary
    }

@router.get("/client/{client_id}")
async def get_client_budget(client_id: str):
    """Get a client's budget with calculated summaries"""
    db = await get_db()
    
    budget = await db.client_budgets.find_one(
        {"client_id": client_id},
        {"_id": 0}
    )
    
    if not budget:
        return {"client_id": client_id, "message": "No budget found"}
    
    # Calculate summary
    summary = await calculate_budget_summary(client_id)
    budget["summary"] = summary
    
    # Check for active alerts
    alerts = await check_budget_alerts(client_id)
    budget["active_alerts"] = alerts
    
    return budget

async def calculate_budget_summary(client_id: str) -> Dict:
    """Calculate budget summary with monthly/annual figures"""
    db = await get_db()
    
    budget = await db.client_budgets.find_one(
        {"client_id": client_id},
        {"_id": 0, "incomes": 1, "expenses": 1, "goals": 1, "category_budgets": 1}
    )
    
    if not budget:
        return {}
    
    # Calculate monthly income
    monthly_income = 0
    income_by_category = {}
    for income in budget.get("incomes", []):
        monthly = income["amount"] * FREQUENCY_TO_MONTHLY.get(income["frequency"], 1)
        monthly_income += monthly
        cat = income["category"]
        income_by_category[cat] = income_by_category.get(cat, 0) + monthly
    
    # Calculate monthly expenses
    monthly_expenses = 0
    expenses_by_category = {}
    essential_expenses = 0
    discretionary_expenses = 0
    
    for expense in budget.get("expenses", []):
        monthly = expense["amount"] * FREQUENCY_TO_MONTHLY.get(expense["frequency"], 1)
        monthly_expenses += monthly
        cat = expense["category"]
        expenses_by_category[cat] = expenses_by_category.get(cat, 0) + monthly
        
        if expense.get("is_essential", True):
            essential_expenses += monthly
        else:
            discretionary_expenses += monthly
    
    # Calculate goal contributions
    total_goal_contributions = sum(
        g.get("monthly_contribution", 0) for g in budget.get("goals", [])
        if g.get("status") in ["active", "on_track"]
    )
    
    # Calculate surplus/deficit
    monthly_surplus = monthly_income - monthly_expenses - total_goal_contributions
    annual_surplus = monthly_surplus * 12
    
    # Calculate budget adherence by category
    category_adherence = {}
    category_budgets = budget.get("category_budgets", {})
    for cat, spent in expenses_by_category.items():
        budgeted = category_budgets.get(cat, spent)  # Default to spent if no budget
        if budgeted > 0:
            adherence = (spent / budgeted) * 100
            category_adherence[cat] = {
                "budgeted": round(budgeted, 2),
                "spent": round(spent, 2),
                "adherence_percentage": round(adherence, 1),
                "status": "over" if adherence > 100 else "warning" if adherence > 80 else "good"
            }
    
    return {
        "monthly_income": round(monthly_income, 2),
        "annual_income": round(monthly_income * 12, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "annual_expenses": round(monthly_expenses * 12, 2),
        "essential_expenses": round(essential_expenses, 2),
        "discretionary_expenses": round(discretionary_expenses, 2),
        "goal_contributions": round(total_goal_contributions, 2),
        "monthly_surplus": round(monthly_surplus, 2),
        "annual_surplus": round(annual_surplus, 2),
        "savings_rate": round((monthly_surplus / monthly_income * 100), 1) if monthly_income > 0 else 0,
        "income_by_category": {k: round(v, 2) for k, v in income_by_category.items()},
        "expenses_by_category": {k: round(v, 2) for k, v in expenses_by_category.items()},
        "category_adherence": category_adherence
    }

async def check_budget_alerts(client_id: str) -> List[Dict]:
    """Check and return active budget alerts"""
    db = await get_db()
    
    budget = await db.client_budgets.find_one(
        {"client_id": client_id},
        {"_id": 0}
    )
    
    if not budget:
        return []
    
    active_alerts = []
    now = datetime.now(timezone.utc).isoformat()
    
    # Check category budget alerts
    summary = await calculate_budget_summary(client_id)
    category_adherence = summary.get("category_adherence", {})
    
    for alert in budget.get("alerts", []):
        if not alert.get("is_enabled", True):
            continue
        
        alert_type = alert.get("alert_type")
        category = alert.get("category")
        threshold = alert.get("threshold_percentage", 80)
        
        if alert_type == "over_budget" and category:
            adherence = category_adherence.get(category, {})
            if adherence.get("adherence_percentage", 0) >= 100:
                active_alerts.append({
                    "alert_id": alert.get("alert_id"),
                    "type": "over_budget",
                    "category": category,
                    "message": f"Over budget in {category}: {adherence.get('spent')} vs {adherence.get('budgeted')} budgeted",
                    "severity": "high",
                    "timestamp": now
                })
        
        elif alert_type == "approaching_limit" and category:
            adherence = category_adherence.get(category, {})
            percentage = adherence.get("adherence_percentage", 0)
            if threshold <= percentage < 100:
                active_alerts.append({
                    "alert_id": alert.get("alert_id"),
                    "type": "approaching_limit",
                    "category": category,
                    "message": f"Approaching budget limit in {category}: {percentage:.0f}% used",
                    "severity": "medium",
                    "timestamp": now
                })
    
    # Check goal alerts
    for goal in budget.get("goals", []):
        if goal.get("status") not in ["active", "on_track"]:
            continue
        
        target_date = goal.get("target_date")
        if target_date:
            target = datetime.fromisoformat(target_date.replace('Z', '+00:00'))
            current = datetime.now(timezone.utc)
            
            if current > target and goal.get("current_amount", 0) < goal.get("target_amount", 0):
                active_alerts.append({
                    "alert_id": f"GOAL-ALERT-{goal.get('goal_id')}",
                    "type": "goal_at_risk",
                    "goal_name": goal.get("name"),
                    "message": f"Goal '{goal.get('name')}' is past due date",
                    "severity": "high",
                    "timestamp": now
                })
            elif goal.get("current_amount", 0) >= goal.get("target_amount", 0):
                active_alerts.append({
                    "alert_id": f"GOAL-ACHIEVED-{goal.get('goal_id')}",
                    "type": "goal_achieved",
                    "goal_name": goal.get("name"),
                    "message": f"Goal '{goal.get('name')}' has been achieved!",
                    "severity": "info",
                    "timestamp": now
                })
    
    return active_alerts

@router.post("/client/{client_id}/goal")
async def add_budget_goal(client_id: str, goal: BudgetGoal):
    """Add a new budget goal"""
    db = await get_db()
    
    goal_dict = goal.dict()
    goal_dict["goal_id"] = f"GOAL-{uuid.uuid4().hex[:6].upper()}"
    
    result = await db.client_budgets.update_one(
        {"client_id": client_id},
        {"$push": {"goals": goal_dict}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return goal_dict

@router.put("/client/{client_id}/goal/{goal_id}")
async def update_budget_goal(client_id: str, goal_id: str, goal: BudgetGoal):
    """Update a budget goal"""
    db = await get_db()
    
    goal_dict = goal.dict()
    goal_dict["goal_id"] = goal_id
    
    result = await db.client_budgets.update_one(
        {"client_id": client_id, "goals.goal_id": goal_id},
        {"$set": {"goals.$": goal_dict}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return goal_dict

@router.delete("/client/{client_id}/goal/{goal_id}")
async def delete_budget_goal(client_id: str, goal_id: str):
    """Delete a budget goal"""
    db = await get_db()
    
    await db.client_budgets.update_one(
        {"client_id": client_id},
        {"$pull": {"goals": {"goal_id": goal_id}}}
    )
    
    return {"deleted": True, "goal_id": goal_id}

@router.post("/client/{client_id}/transaction")
async def record_transaction(client_id: str, transaction: BudgetTransaction):
    """Record a budget transaction"""
    db = await get_db()
    
    trans_dict = transaction.dict()
    trans_dict["transaction_id"] = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    trans_dict["client_id"] = client_id
    trans_dict["recorded_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.budget_transactions.insert_one(trans_dict)
    
    if "_id" in trans_dict:
        del trans_dict["_id"]
    
    return trans_dict

@router.get("/client/{client_id}/transactions")
async def get_transactions(client_id: str, month: Optional[str] = None, category: Optional[str] = None):
    """Get transactions for a client"""
    db = await get_db()
    
    query = {"client_id": client_id}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    if category:
        query["category"] = category
    
    transactions = await db.budget_transactions.find(
        query,
        {"_id": 0}
    ).sort("date", -1).to_list(length=500)
    
    return {
        "client_id": client_id,
        "transactions": transactions,
        "total": len(transactions)
    }

@router.get("/client/{client_id}/spending-analysis")
async def get_spending_analysis(client_id: str, months: int = 3):
    """Get spending analysis over specified months"""
    db = await get_db()
    
    # Get budget summary
    summary = await calculate_budget_summary(client_id)
    
    # Get recent transactions by category
    from datetime import timedelta
    start_date = (datetime.now() - timedelta(days=months * 30)).isoformat()[:10]
    
    transactions = await db.budget_transactions.find(
        {"client_id": client_id, "date": {"$gte": start_date}, "is_income": False},
        {"_id": 0}
    ).to_list(length=1000)
    
    # Analyze by category
    category_totals = {}
    for t in transactions:
        cat = t.get("category", "other")
        category_totals[cat] = category_totals.get(cat, 0) + t.get("amount", 0)
    
    # Compare to budget
    budget = await db.client_budgets.find_one({"client_id": client_id}, {"_id": 0, "category_budgets": 1})
    category_budgets = budget.get("category_budgets", {}) if budget else {}
    
    analysis = []
    for cat, total in category_totals.items():
        monthly_avg = total / months if months > 0 else 0
        budgeted = category_budgets.get(cat, 0)
        
        analysis.append({
            "category": cat,
            "icon": CATEGORY_ICONS.get(cat, "📦"),
            "total_spent": round(total, 2),
            "monthly_average": round(monthly_avg, 2),
            "monthly_budget": round(budgeted, 2),
            "variance": round(budgeted - monthly_avg, 2) if budgeted > 0 else None,
            "status": "over" if monthly_avg > budgeted > 0 else "under" if budgeted > 0 else "unbudgeted"
        })
    
    return {
        "client_id": client_id,
        "analysis_period_months": months,
        "category_analysis": sorted(analysis, key=lambda x: x["total_spent"], reverse=True),
        "total_spent": round(sum(category_totals.values()), 2),
        "budget_summary": summary
    }

@router.get("/demo/sample")
async def get_demo_budget():
    """Get a sample budget for demo purposes"""
    return {
        "client_id": "DEMO-001",
        "client_name": "Sample Client",
        "incomes": [
            {"income_id": "INC-001", "source": "Primary Employment", "category": "salary", "amount": 8500, "frequency": "monthly", "is_taxable": True},
            {"income_id": "INC-002", "source": "Rental Property", "category": "rental", "amount": 2800, "frequency": "monthly", "is_taxable": True},
            {"income_id": "INC-003", "source": "Share Dividends", "category": "dividends", "amount": 4500, "frequency": "annual", "is_taxable": True}
        ],
        "expenses": [
            {"expense_id": "EXP-001", "description": "Mortgage Repayment", "category": "housing", "amount": 3200, "frequency": "monthly", "is_essential": True},
            {"expense_id": "EXP-002", "description": "Electricity & Gas", "category": "utilities", "amount": 350, "frequency": "monthly", "is_essential": True},
            {"expense_id": "EXP-003", "description": "Groceries", "category": "groceries", "amount": 250, "frequency": "weekly", "is_essential": True},
            {"expense_id": "EXP-004", "description": "Car Loan", "category": "transport", "amount": 450, "frequency": "fortnightly", "is_essential": True},
            {"expense_id": "EXP-005", "description": "Health Insurance", "category": "insurance", "amount": 3600, "frequency": "annual", "is_essential": True},
            {"expense_id": "EXP-006", "description": "Dining Out", "category": "dining", "amount": 400, "frequency": "monthly", "is_essential": False},
            {"expense_id": "EXP-007", "description": "Subscriptions", "category": "subscriptions", "amount": 120, "frequency": "monthly", "is_essential": False}
        ],
        "goals": [
            {"goal_id": "GOAL-001", "name": "Emergency Fund", "target_amount": 30000, "current_amount": 15000, "monthly_contribution": 500, "status": "on_track"},
            {"goal_id": "GOAL-002", "name": "Holiday Fund", "target_amount": 10000, "current_amount": 3500, "monthly_contribution": 300, "status": "active"},
            {"goal_id": "GOAL-003", "name": "Investment Property Deposit", "target_amount": 100000, "current_amount": 45000, "monthly_contribution": 1500, "status": "on_track"}
        ],
        "category_budgets": {
            "housing": 3500,
            "utilities": 400,
            "groceries": 1200,
            "transport": 1200,
            "insurance": 400,
            "dining": 500,
            "entertainment": 300,
            "subscriptions": 150
        }
    }
