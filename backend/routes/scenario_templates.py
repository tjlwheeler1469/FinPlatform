"""
Advanced Scenario Templates
Pre-built retirement scenarios for common life situations
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import re

logger = logging.getLogger(__name__)


def _safe_eval_arithmetic(expr: str) -> float:
    """Safely evaluate simple arithmetic expressions (numbers and +, -, *, /)."""
    import ast
    import operator

    allowed_ops = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.USub: operator.neg,
    }

    def _eval_node(node):
        if isinstance(node, ast.Expression):
            return _eval_node(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            return float(node.value)
        if isinstance(node, ast.BinOp) and type(node.op) in allowed_ops:
            left = _eval_node(node.left)
            right = _eval_node(node.right)
            return allowed_ops[type(node.op)](left, right)
        if isinstance(node, ast.UnaryOp) and type(node.op) in allowed_ops:
            return allowed_ops[type(node.op)](_eval_node(node.operand))
        raise ValueError(f"Unsupported expression node: {ast.dump(node)}")

    sanitized = re.sub(r'[^0-9+\-*/.()\s]', '', str(expr))
    if not sanitized.strip():
        raise ValueError(f"Invalid arithmetic expression: {expr}")
    try:
        tree = ast.parse(sanitized.strip(), mode='eval')
        return float(_eval_node(tree))
    except Exception:
        raise ValueError(f"Cannot safely evaluate expression: {expr}")

router = APIRouter(prefix="/scenario-templates", tags=["Scenario Templates"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ==================== PREDEFINED TEMPLATES ====================

SCENARIO_TEMPLATES = {
    "early_retirement_55": {
        "id": "early_retirement_55",
        "name": "Early Retirement at 55",
        "category": "retirement_timing",
        "description": "Retire 10 years early - requires larger nest egg and careful planning",
        "icon": "rocket",
        "color": "#8b5cf6",
        "adjustments": {
            "retirement_age": {"value": 55, "type": "absolute"},
            "annual_expenses": {"value": 1.1, "type": "multiplier"},  # 10% higher pre-super expenses
            "super_access_age": {"value": 60, "type": "absolute"},
            "bridge_years": {"value": 5, "type": "absolute"}  # Years before super access
        },
        "considerations": [
            "Need investments outside super to fund ages 55-60",
            "No concessional super access until preservation age",
            "Higher healthcare costs without employer coverage",
            "Longer retirement period increases longevity risk"
        ],
        "typical_requirements": {
            "min_net_worth": 2000000,
            "min_investment_ratio": 0.4,  # 40% outside super
            "max_expense_ratio": 0.04  # 4% rule buffer
        }
    },
    "early_retirement_50": {
        "id": "early_retirement_50",
        "name": "FIRE at 50",
        "category": "retirement_timing",
        "description": "Financial Independence, Retire Early at 50",
        "icon": "flame",
        "color": "#ef4444",
        "adjustments": {
            "retirement_age": {"value": 50, "type": "absolute"},
            "annual_expenses": {"value": 0.85, "type": "multiplier"},  # FIRE lifestyle - 15% lower
            "savings_rate": {"value": 0.5, "type": "absolute"}  # 50% savings rate
        },
        "considerations": [
            "Requires aggressive savings (50%+ of income)",
            "10 years before super access - need substantial investments",
            "Consider geographic arbitrage or lean FIRE",
            "Part-time work can significantly boost success rate"
        ],
        "typical_requirements": {
            "min_net_worth": 2500000,
            "min_investment_ratio": 0.5,
            "max_expense_ratio": 0.035
        }
    },
    "sabbatical_1year": {
        "id": "sabbatical_1year",
        "name": "1-Year Career Break",
        "category": "career_break",
        "description": "Take a year off for travel, study, or personal projects",
        "icon": "plane",
        "color": "#06b6d4",
        "adjustments": {
            "income_gap_years": {"value": 1, "type": "absolute"},
            "income_gap_start": {"value": "current_age + 2", "type": "formula"},
            "annual_expenses_during_gap": {"value": 1.3, "type": "multiplier"},  # Travel/experiences
            "super_contributions_gap": {"value": 0, "type": "absolute"}
        },
        "considerations": [
            "One year of zero income + higher spending",
            "Impact on super contributions and compounding",
            "Career re-entry may affect future income",
            "Health insurance continuity"
        ],
        "typical_requirements": {
            "min_emergency_fund": 50000,
            "min_years_to_retirement": 10
        }
    },
    "sabbatical_2year": {
        "id": "sabbatical_2year",
        "name": "2-Year Extended Break",
        "category": "career_break",
        "description": "Extended break for major life change or world travel",
        "icon": "globe",
        "color": "#0ea5e9",
        "adjustments": {
            "income_gap_years": {"value": 2, "type": "absolute"},
            "income_gap_start": {"value": "current_age + 2", "type": "formula"},
            "annual_expenses_during_gap": {"value": 1.2, "type": "multiplier"},
            "super_contributions_gap": {"value": 0, "type": "absolute"}
        },
        "considerations": [
            "Two years of zero income",
            "Significant impact on retirement timeline",
            "May need to delay retirement by 2-4 years",
            "Consider rental income or passive investments"
        ],
        "typical_requirements": {
            "min_emergency_fund": 100000,
            "min_years_to_retirement": 15
        }
    },
    "inheritance_500k": {
        "id": "inheritance_500k",
        "name": "Expected Inheritance ($500k)",
        "category": "windfall",
        "description": "Model expected inheritance of $500,000",
        "icon": "gift",
        "color": "#22c55e",
        "adjustments": {
            "lump_sum_at_age": {"value": "current_age + 15", "type": "formula"},
            "lump_sum_amount": {"value": 500000, "type": "absolute"},
            "lump_sum_type": {"value": "inheritance", "type": "label"}
        },
        "considerations": [
            "Inheritance timing is uncertain",
            "May be reduced by care costs",
            "Tax implications depend on source",
            "Don't over-rely - have backup plan"
        ],
        "typical_requirements": {}
    },
    "inheritance_1m": {
        "id": "inheritance_1m",
        "name": "Expected Inheritance ($1M)",
        "category": "windfall",
        "description": "Model expected inheritance of $1,000,000",
        "icon": "gem",
        "color": "#a855f7",
        "adjustments": {
            "lump_sum_at_age": {"value": "current_age + 15", "type": "formula"},
            "lump_sum_amount": {"value": 1000000, "type": "absolute"},
            "lump_sum_type": {"value": "inheritance", "type": "label"}
        },
        "considerations": [
            "Large inheritance can significantly change retirement plans",
            "Consider estate planning implications",
            "May enable early retirement if received early",
            "Diversification of inherited assets important"
        ],
        "typical_requirements": {}
    },
    "downsize_home": {
        "id": "downsize_home",
        "name": "Downsize Home at 65",
        "category": "lifestyle_change",
        "description": "Sell family home and downsize to release equity",
        "icon": "home",
        "color": "#f59e0b",
        "adjustments": {
            "home_sale_age": {"value": 65, "type": "absolute"},
            "home_equity_release": {"value": 500000, "type": "absolute"},
            "new_home_cost": {"value": 600000, "type": "absolute"},
            "reduced_maintenance": {"value": -5000, "type": "annual_expense_change"}
        },
        "considerations": [
            "Capital gains exemption on principal residence",
            "Downsizer super contribution up to $300k each",
            "Reduced maintenance and utility costs",
            "Emotional attachment to family home"
        ],
        "typical_requirements": {
            "min_home_equity": 800000
        }
    },
    "sea_change": {
        "id": "sea_change",
        "name": "Sea/Tree Change",
        "category": "lifestyle_change",
        "description": "Relocate to regional area for lower cost of living",
        "icon": "tree-palm",
        "color": "#10b981",
        "adjustments": {
            "relocation_age": {"value": "retirement_age", "type": "formula"},
            "home_equity_release": {"value": 300000, "type": "absolute"},
            "annual_expenses": {"value": 0.75, "type": "multiplier"},  # 25% lower COL
            "one_time_relocation_cost": {"value": 50000, "type": "absolute"}
        },
        "considerations": [
            "Lower cost of living in regional areas",
            "Release equity from city property",
            "Access to healthcare may be limited",
            "Social connections and support network"
        ],
        "typical_requirements": {
            "min_home_equity": 500000
        }
    },
    "part_time_transition": {
        "id": "part_time_transition",
        "name": "Part-Time Transition (5 years)",
        "category": "retirement_timing",
        "description": "Gradually reduce work over 5 years before full retirement",
        "icon": "clock",
        "color": "#6366f1",
        "adjustments": {
            "transition_start": {"value": "retirement_age - 5", "type": "formula"},
            "income_year_1": {"value": 0.8, "type": "multiplier"},
            "income_year_2": {"value": 0.6, "type": "multiplier"},
            "income_year_3": {"value": 0.4, "type": "multiplier"},
            "income_year_4": {"value": 0.3, "type": "multiplier"},
            "income_year_5": {"value": 0.2, "type": "multiplier"}
        },
        "considerations": [
            "Smoother financial and psychological transition",
            "Maintains some income to reduce portfolio drawdown",
            "Employer may not support part-time arrangements",
            "Keeps skills and networks active"
        ],
        "typical_requirements": {}
    },
    "health_event": {
        "id": "health_event",
        "name": "Major Health Event",
        "category": "risk_scenario",
        "description": "Model impact of significant health costs",
        "icon": "heart-pulse",
        "color": "#dc2626",
        "adjustments": {
            "one_time_health_cost": {"value": 100000, "type": "absolute"},
            "health_event_age": {"value": 70, "type": "absolute"},
            "ongoing_health_increase": {"value": 15000, "type": "annual_expense_change"},
            "life_expectancy_reduction": {"value": 5, "type": "years_reduction"}
        },
        "considerations": [
            "Health costs can be significant even with Medicare",
            "Private health insurance gap coverage important",
            "Home modifications may be needed",
            "May qualify for Age Pension if assets depleted"
        ],
        "typical_requirements": {}
    },
    "aged_care": {
        "id": "aged_care",
        "name": "Aged Care Planning",
        "category": "risk_scenario",
        "description": "Plan for potential aged care accommodation",
        "icon": "building",
        "color": "#78716c",
        "adjustments": {
            "aged_care_start_age": {"value": 85, "type": "absolute"},
            "refundable_accommodation_deposit": {"value": 500000, "type": "absolute"},
            "daily_care_fees": {"value": 300, "type": "daily_cost"},
            "years_in_care": {"value": 3, "type": "absolute"}
        },
        "considerations": [
            "RAD (Refundable Accommodation Deposit) is refundable to estate",
            "Daily fees based on means testing",
            "Home may be exempt from assets test for 2 years",
            "Consider aged care insurance"
        ],
        "typical_requirements": {
            "min_liquid_assets": 500000
        }
    },
    "market_crash": {
        "id": "market_crash",
        "name": "Market Crash Stress Test",
        "category": "risk_scenario",
        "description": "Test portfolio resilience against 40% market decline",
        "icon": "trending-down",
        "color": "#b91c1c",
        "adjustments": {
            "market_drop_percent": {"value": 0.4, "type": "absolute"},
            "market_drop_year": {"value": "current_age + 1", "type": "formula"},
            "recovery_years": {"value": 5, "type": "absolute"}
        },
        "considerations": [
            "Sequence of returns risk is highest near retirement",
            "May need to delay retirement if crash occurs",
            "Diversification reduces but doesn't eliminate risk",
            "Cash buffer provides flexibility"
        ],
        "typical_requirements": {}
    },
    "divorce_scenario": {
        "id": "divorce_scenario",
        "name": "Asset Division (Divorce)",
        "category": "risk_scenario",
        "description": "Model impact of 50% asset division",
        "icon": "split",
        "color": "#9333ea",
        "adjustments": {
            "asset_reduction": {"value": 0.5, "type": "multiplier"},
            "super_reduction": {"value": 0.5, "type": "multiplier"},
            "annual_expenses": {"value": 0.7, "type": "multiplier"}  # Single expenses lower
        },
        "considerations": [
            "Super is typically split as part of settlement",
            "May need to sell family home",
            "Legal costs can be substantial",
            "May qualify for government benefits"
        ],
        "typical_requirements": {}
    },
    "business_exit": {
        "id": "business_exit",
        "name": "Business Sale/Exit",
        "category": "windfall",
        "description": "Plan for business sale proceeds",
        "icon": "briefcase",
        "color": "#0891b2",
        "adjustments": {
            "business_sale_age": {"value": 60, "type": "absolute"},
            "business_sale_proceeds": {"value": 2000000, "type": "absolute"},
            "cgt_payable": {"value": 200000, "type": "absolute"},  # After small business concessions
            "income_replacement_needed": {"value": 1, "type": "boolean"}
        },
        "considerations": [
            "Small business CGT concessions may apply",
            "Can contribute up to $500k to super under CGT cap",
            "Business value often overestimated",
            "Transition period may reduce income"
        ],
        "typical_requirements": {}
    }
}

TEMPLATE_CATEGORIES = {
    "retirement_timing": {
        "name": "Retirement Timing",
        "description": "Scenarios for different retirement ages and transitions",
        "icon": "calendar"
    },
    "career_break": {
        "name": "Career Breaks",
        "description": "Sabbaticals and time off from work",
        "icon": "pause"
    },
    "windfall": {
        "name": "Windfalls & Inheritance",
        "description": "Expected lump sums and business exits",
        "icon": "gift"
    },
    "lifestyle_change": {
        "name": "Lifestyle Changes",
        "description": "Downsizing, relocation, and major life changes",
        "icon": "home"
    },
    "risk_scenario": {
        "name": "Risk Scenarios",
        "description": "Stress tests and adverse event planning",
        "icon": "alert-triangle"
    }
}


# ==================== API ENDPOINTS ====================

@router.get("/list")
async def list_templates(category: Optional[str] = None):
    """Get all available scenario templates."""
    templates = list(SCENARIO_TEMPLATES.values())
    
    if category:
        templates = [t for t in templates if t["category"] == category]
    
    return {
        "templates": templates,
        "categories": TEMPLATE_CATEGORIES,
        "total_count": len(templates)
    }


@router.get("/categories")
async def list_categories():
    """Get all template categories."""
    return {"categories": TEMPLATE_CATEGORIES}


@router.get("/{template_id}")
async def get_template(template_id: str):
    """Get a specific template by ID."""
    template = SCENARIO_TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/{template_id}/apply")
async def apply_template(
    template_id: str,
    current_age: int = Query(...),
    retirement_age: int = Query(default=65),
    net_worth: float = Query(...),
    annual_income: float = Query(...),
    annual_expenses: float = Query(...),
    super_balance: float = Query(default=0),
    is_couple: bool = Query(default=False)
):
    """
    Apply a template to user's current inputs and return adjusted values.
    """
    template = SCENARIO_TEMPLATES.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Start with current values
    adjusted = {
        "current_age": current_age,
        "retirement_age": retirement_age,
        "net_worth": net_worth,
        "annual_income": annual_income,
        "annual_expenses": annual_expenses,
        "super_balance": super_balance,
        "is_couple": is_couple
    }
    
    adjustments = template.get("adjustments", {})
    applied_changes = []
    
    for key, adj in adjustments.items():
        adj_type = adj.get("type")
        adj_value = adj.get("value")
        
        if adj_type == "absolute":
            if key in adjusted:
                old_value = adjusted[key]
                adjusted[key] = adj_value
                applied_changes.append({
                    "field": key,
                    "old_value": old_value,
                    "new_value": adj_value,
                    "change_type": "set"
                })
        
        elif adj_type == "multiplier":
            if key in adjusted:
                old_value = adjusted[key]
                adjusted[key] = old_value * adj_value
                applied_changes.append({
                    "field": key,
                    "old_value": old_value,
                    "new_value": adjusted[key],
                    "change_type": f"multiply by {adj_value}"
                })
        
        elif adj_type == "formula":
            # Safely evaluate simple formulas using ast.literal_eval
            import ast
            if "current_age" in str(adj_value):
                safe_expr = str(adj_value).replace("current_age", str(current_age))
                try:
                    result = ast.literal_eval(safe_expr)
                except (ValueError, SyntaxError):
                    # Fallback: try simple arithmetic parsing
                    result = _safe_eval_arithmetic(safe_expr)
                adjusted[key] = result
                applied_changes.append({
                    "field": key,
                    "new_value": result,
                    "change_type": f"formula: {adj_value}"
                })
            elif "retirement_age" in str(adj_value):
                safe_expr = str(adj_value).replace("retirement_age", str(retirement_age))
                try:
                    result = ast.literal_eval(safe_expr)
                except (ValueError, SyntaxError):
                    result = _safe_eval_arithmetic(safe_expr)
                adjusted[key] = result
                applied_changes.append({
                    "field": key,
                    "new_value": result,
                    "change_type": f"formula: {adj_value}"
                })
        
        elif adj_type == "annual_expense_change":
            adjusted["annual_expenses"] = adjusted.get("annual_expenses", annual_expenses) + adj_value
            applied_changes.append({
                "field": "annual_expenses",
                "change": adj_value,
                "change_type": "annual_expense_adjustment"
            })
    
    # Check requirements
    requirements_met = True
    requirement_issues = []
    
    typical_reqs = template.get("typical_requirements", {})
    if typical_reqs.get("min_net_worth") and net_worth < typical_reqs["min_net_worth"]:
        requirements_met = False
        requirement_issues.append(
            f"Net worth ${net_worth:,.0f} is below recommended ${typical_reqs['min_net_worth']:,.0f}"
        )
    
    if typical_reqs.get("min_years_to_retirement"):
        years_to_retire = retirement_age - current_age
        if years_to_retire < typical_reqs["min_years_to_retirement"]:
            requirements_met = False
            requirement_issues.append(
                f"Only {years_to_retire} years to retirement, need at least {typical_reqs['min_years_to_retirement']}"
            )
    
    return {
        "template_id": template_id,
        "template_name": template["name"],
        "original_inputs": {
            "current_age": current_age,
            "retirement_age": retirement_age,
            "net_worth": net_worth,
            "annual_income": annual_income,
            "annual_expenses": annual_expenses,
            "super_balance": super_balance
        },
        "adjusted_inputs": adjusted,
        "applied_changes": applied_changes,
        "considerations": template.get("considerations", []),
        "requirements_met": requirements_met,
        "requirement_issues": requirement_issues
    }


@router.post("/custom/save")
async def save_custom_template(
    name: str,
    description: str,
    adjustments: Dict[str, Any],
    client_id: Optional[str] = None
):
    """Save a custom scenario template."""
    db = await get_db()
    
    template = {
        "id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "category": "custom",
        "adjustments": adjustments,
        "client_id": client_id,
        "created_at": datetime.now(timezone.utc),
        "is_custom": True
    }
    
    await db.custom_scenario_templates.insert_one(template)
    
    return {
        "template_id": template["id"],
        "message": "Custom template saved"
    }


@router.get("/custom/list")
async def list_custom_templates(client_id: Optional[str] = None):
    """List custom templates."""
    db = await get_db()
    
    query = {}
    if client_id:
        query["client_id"] = client_id
    
    cursor = db.custom_scenario_templates.find(query, {"_id": 0})
    templates = await cursor.to_list(length=100)
    
    return {"custom_templates": templates}
