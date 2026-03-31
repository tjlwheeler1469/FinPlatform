"""
AdviceOS Scenario Generator Engine
===================================
Generates multiple financial scenarios WITHOUT making recommendations.

Core Principle: System generates scenarios, not advice.
- Minimum 3 scenarios
- No "best option" identified
- No ranking as "recommended"
- Adviser must select final strategy
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import logging
import math

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scenarios", tags=["Scenario Generator"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
scenarios_col = db["scenarios"]
explainability_col = db["explainability_records"]
audit_logs_col = db["audit_logs"]

# ==================== REQUEST/RESPONSE MODELS ====================

class ScenarioInputs(BaseModel):
    client_id: str
    adviser_id: str
    licensee_id: str = "lic_default"
    risk_profile: str = "balanced"
    investment_timeframe_years: int = 10
    initial_investment: float
    monthly_contribution: float = 0
    income_requirement: float = 0
    goals: List[Dict[str, Any]] = []
    current_portfolio: Optional[Dict[str, Any]] = None
    constraints: Optional[Dict[str, Any]] = None

# ==================== ALLOCATION TEMPLATES ====================

# Base allocations by risk profile
ALLOCATION_TEMPLATES = {
    "conservative": {
        "base": {
            "australian_equities": 0.15,
            "international_equities": 0.10,
            "fixed_income": 0.45,
            "cash": 0.25,
            "property": 0.05,
            "alternatives": 0.00
        },
        "expected_return": (0.04, 0.05, 0.06),  # low, mid, high
        "volatility": 0.06,
        "max_drawdown": 0.10
    },
    "moderately_conservative": {
        "base": {
            "australian_equities": 0.20,
            "international_equities": 0.15,
            "fixed_income": 0.40,
            "cash": 0.15,
            "property": 0.07,
            "alternatives": 0.03
        },
        "expected_return": (0.05, 0.06, 0.07),
        "volatility": 0.08,
        "max_drawdown": 0.15
    },
    "balanced": {
        "base": {
            "australian_equities": 0.25,
            "international_equities": 0.25,
            "fixed_income": 0.30,
            "cash": 0.10,
            "property": 0.07,
            "alternatives": 0.03
        },
        "expected_return": (0.06, 0.07, 0.085),
        "volatility": 0.10,
        "max_drawdown": 0.20
    },
    "moderately_aggressive": {
        "base": {
            "australian_equities": 0.30,
            "international_equities": 0.35,
            "fixed_income": 0.20,
            "cash": 0.05,
            "property": 0.05,
            "alternatives": 0.05
        },
        "expected_return": (0.07, 0.085, 0.10),
        "volatility": 0.13,
        "max_drawdown": 0.28
    },
    "aggressive": {
        "base": {
            "australian_equities": 0.35,
            "international_equities": 0.45,
            "fixed_income": 0.10,
            "cash": 0.03,
            "property": 0.02,
            "alternatives": 0.05
        },
        "expected_return": (0.08, 0.10, 0.12),
        "volatility": 0.16,
        "max_drawdown": 0.35
    }
}

# Sample products for each asset class (from APL)
SAMPLE_PRODUCTS = {
    "australian_equities": [
        {"product_id": "VAS", "name": "Vanguard Australian Shares ETF", "fee": 0.0010, "type": "etf"},
        {"product_id": "IOZ", "name": "iShares Core S&P/ASX 200 ETF", "fee": 0.0005, "type": "etf"},
    ],
    "international_equities": [
        {"product_id": "VGS", "name": "Vanguard MSCI International ETF", "fee": 0.0018, "type": "etf"},
        {"product_id": "IVV", "name": "iShares S&P 500 ETF", "fee": 0.0004, "type": "etf"},
    ],
    "fixed_income": [
        {"product_id": "VAF", "name": "Vanguard Australian Fixed Interest ETF", "fee": 0.0010, "type": "etf"},
        {"product_id": "IAF", "name": "iShares Core Composite Bond ETF", "fee": 0.0015, "type": "etf"},
    ],
    "cash": [
        {"product_id": "AAA", "name": "Betashares High Interest Cash ETF", "fee": 0.0018, "type": "etf"},
    ],
    "diversified": [
        {"product_id": "VDHG", "name": "Vanguard Diversified High Growth ETF", "fee": 0.0027, "type": "etf"},
        {"product_id": "VDGR", "name": "Vanguard Diversified Growth ETF", "fee": 0.0027, "type": "etf"},
        {"product_id": "VDBA", "name": "Vanguard Diversified Balanced ETF", "fee": 0.0027, "type": "etf"},
        {"product_id": "VDCO", "name": "Vanguard Diversified Conservative ETF", "fee": 0.0027, "type": "etf"},
    ]
}

# ==================== SCENARIO GENERATION ====================

def calculate_projected_value(
    initial: float,
    monthly: float,
    years: int,
    annual_return: float
) -> float:
    """Calculate future value with monthly contributions"""
    monthly_rate = annual_return / 12
    months = years * 12
    
    # Future value of initial investment
    fv_initial = initial * ((1 + monthly_rate) ** months)
    
    # Future value of monthly contributions (annuity)
    if monthly_rate > 0 and monthly > 0:
        fv_contributions = monthly * (((1 + monthly_rate) ** months - 1) / monthly_rate)
    else:
        fv_contributions = monthly * months
    
    return fv_initial + fv_contributions

def calculate_income_yield(allocation: Dict[str, float]) -> float:
    """Estimate income yield from allocation"""
    yields = {
        "australian_equities": 0.035,
        "international_equities": 0.015,
        "fixed_income": 0.045,
        "cash": 0.04,
        "property": 0.04,
        "alternatives": 0.02
    }
    
    total_yield = sum(allocation.get(k, 0) * v for k, v in yields.items())
    return total_yield

def generate_scenario(
    scenario_type: str,
    inputs: ScenarioInputs,
    base_template: Dict[str, Any],
    adjustment_factor: float = 1.0
) -> Dict[str, Any]:
    """Generate a single scenario"""
    scenario_id = f"scn_{uuid.uuid4().hex[:12]}"
    
    # Adjust allocation based on scenario type
    allocation = base_template["base"].copy()
    
    if scenario_type == "conservative":
        # Reduce equity, increase defensive
        equity_reduction = 0.10
        allocation["australian_equities"] = max(0.05, allocation["australian_equities"] - equity_reduction * 0.5)
        allocation["international_equities"] = max(0.05, allocation["international_equities"] - equity_reduction * 0.5)
        allocation["fixed_income"] = min(0.60, allocation["fixed_income"] + equity_reduction * 0.6)
        allocation["cash"] = min(0.30, allocation["cash"] + equity_reduction * 0.4)
        expected_returns = (base_template["expected_return"][0] - 0.01, base_template["expected_return"][1] - 0.01, base_template["expected_return"][2] - 0.01)
        volatility = base_template["volatility"] * 0.8
        max_drawdown = base_template["max_drawdown"] * 0.7
        
    elif scenario_type == "growth":
        # Increase equity, reduce defensive
        equity_increase = 0.10
        allocation["australian_equities"] = min(0.40, allocation["australian_equities"] + equity_increase * 0.4)
        allocation["international_equities"] = min(0.50, allocation["international_equities"] + equity_increase * 0.6)
        allocation["fixed_income"] = max(0.10, allocation["fixed_income"] - equity_increase * 0.7)
        allocation["cash"] = max(0.02, allocation["cash"] - equity_increase * 0.3)
        expected_returns = (base_template["expected_return"][0] + 0.01, base_template["expected_return"][1] + 0.015, base_template["expected_return"][2] + 0.02)
        volatility = base_template["volatility"] * 1.3
        max_drawdown = base_template["max_drawdown"] * 1.3
        
    elif scenario_type == "income":
        # Focus on income-generating assets
        allocation["australian_equities"] = max(0.15, allocation["australian_equities"] - 0.05)
        allocation["international_equities"] = max(0.10, allocation["international_equities"] - 0.10)
        allocation["fixed_income"] = min(0.50, allocation["fixed_income"] + 0.10)
        allocation["property"] = min(0.15, allocation.get("property", 0.05) + 0.05)
        expected_returns = (base_template["expected_return"][0], base_template["expected_return"][1] - 0.005, base_template["expected_return"][2] - 0.01)
        volatility = base_template["volatility"] * 0.9
        max_drawdown = base_template["max_drawdown"] * 0.85
        
    else:  # balanced (default)
        expected_returns = base_template["expected_return"]
        volatility = base_template["volatility"]
        max_drawdown = base_template["max_drawdown"]
    
    # Normalize allocation to 100%
    total = sum(allocation.values())
    allocation = {k: v / total for k, v in allocation.items()}
    
    # Calculate metrics
    income_yield = calculate_income_yield(allocation)
    total_fees = 0.0015  # Average weighted fee
    
    # Calculate Sharpe ratio (simplified)
    risk_free_rate = 0.04
    sharpe_ratio = (expected_returns[1] - risk_free_rate) / volatility
    
    # Project future values
    projected_10yr = calculate_projected_value(
        inputs.initial_investment,
        inputs.monthly_contribution,
        10,
        expected_returns[1]
    )
    projected_20yr = calculate_projected_value(
        inputs.initial_investment,
        inputs.monthly_contribution,
        20,
        expected_returns[1]
    )
    
    # Calculate probability of meeting goal (simplified Monte Carlo approximation)
    if inputs.goals:
        primary_goal = inputs.goals[0]
        target = primary_goal.get("target_amount", projected_10yr)
        years_to_goal = min(inputs.investment_timeframe_years, 20)
        projected_at_goal = calculate_projected_value(
            inputs.initial_investment,
            inputs.monthly_contribution,
            years_to_goal,
            expected_returns[1]
        )
        # Simplified probability based on projected vs target
        probability = min(0.95, max(0.20, projected_at_goal / target))
    else:
        probability = 0.75
    
    # Assign products
    products = []
    for asset_class, weight in allocation.items():
        if weight > 0 and asset_class in SAMPLE_PRODUCTS:
            product = SAMPLE_PRODUCTS[asset_class][0].copy()
            product["weight"] = weight
            product["value"] = inputs.initial_investment * weight
            products.append(product)
    
    # Generate rationale
    rationales = {
        "conservative": "This scenario prioritizes capital preservation and income stability. Lower growth potential but reduced volatility and drawdown risk.",
        "balanced": "This scenario provides a balance between growth and stability. Moderate equity exposure with diversified defensive holdings.",
        "growth": "This scenario targets higher long-term growth. Higher equity allocation increases both return potential and volatility.",
        "income": "This scenario focuses on generating regular income. Emphasizes dividend-paying equities and fixed income securities."
    }
    
    risks = {
        "conservative": [
            "Lower growth may not keep pace with inflation over long periods",
            "Income yield may decrease if interest rates fall",
            "May not achieve higher growth goals"
        ],
        "balanced": [
            "Moderate exposure to equity market volatility",
            "Returns may underperform in strong bull markets",
            "Currency risk from international holdings"
        ],
        "growth": [
            "Higher short-term volatility and potential drawdowns",
            "May require longer recovery time after market downturns",
            "Higher sensitivity to global economic conditions"
        ],
        "income": [
            "Concentrated in income-generating assets which may underperform growth assets",
            "Interest rate sensitivity affects fixed income holdings",
            "Dividend yields not guaranteed"
        ]
    }
    
    considerations = [
        "Past performance is not indicative of future results",
        "Projections are estimates only and actual returns will vary",
        "Regular review and rebalancing may be required",
        "Tax implications should be considered separately"
    ]
    
    scenario_names = {
        "conservative": "Conservative Strategy",
        "balanced": "Balanced Strategy", 
        "growth": "Growth Strategy",
        "income": "Income-Focused Strategy"
    }
    
    return {
        "scenario_id": scenario_id,
        "scenario_type": scenario_type,
        "scenario_name": scenario_names.get(scenario_type, f"{scenario_type.title()} Strategy"),
        "allocation": allocation,
        "metrics": {
            "expected_return_low": round(expected_returns[0] * 100, 2),
            "expected_return_mid": round(expected_returns[1] * 100, 2),
            "expected_return_high": round(expected_returns[2] * 100, 2),
            "volatility": round(volatility * 100, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "max_drawdown": round(max_drawdown * 100, 2),
            "income_yield": round(income_yield * 100, 2),
            "total_fees": round(total_fees * 100, 3),
            "projected_value_10yr": round(projected_10yr, 0),
            "projected_value_20yr": round(projected_20yr, 0),
            "probability_meeting_goal": round(probability * 100, 1)
        },
        "products": products,
        "rationale": rationales.get(scenario_type, ""),
        "risks": risks.get(scenario_type, []),
        "considerations": considerations
    }

def generate_comparison_summary(scenarios: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate comparison summary for scenarios"""
    return {
        "return_range": {
            "lowest": min(s["metrics"]["expected_return_mid"] for s in scenarios),
            "highest": max(s["metrics"]["expected_return_mid"] for s in scenarios),
            "difference": max(s["metrics"]["expected_return_mid"] for s in scenarios) - min(s["metrics"]["expected_return_mid"] for s in scenarios)
        },
        "risk_range": {
            "lowest_volatility": min(s["metrics"]["volatility"] for s in scenarios),
            "highest_volatility": max(s["metrics"]["volatility"] for s in scenarios),
            "difference": max(s["metrics"]["volatility"] for s in scenarios) - min(s["metrics"]["volatility"] for s in scenarios)
        },
        "projected_value_10yr": {
            "lowest": min(s["metrics"]["projected_value_10yr"] for s in scenarios),
            "highest": max(s["metrics"]["projected_value_10yr"] for s in scenarios),
            "difference": max(s["metrics"]["projected_value_10yr"] for s in scenarios) - min(s["metrics"]["projected_value_10yr"] for s in scenarios)
        },
        "income_yield_range": {
            "lowest": min(s["metrics"]["income_yield"] for s in scenarios),
            "highest": max(s["metrics"]["income_yield"] for s in scenarios)
        },
        "note": "These scenarios represent different approaches. No scenario is recommended over others. Adviser must evaluate suitability for client's specific circumstances."
    }

def generate_trade_offs(scenarios: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Generate trade-off analysis between scenarios"""
    trade_offs = []
    
    # Find conservative and growth scenarios
    conservative = next((s for s in scenarios if s["scenario_type"] == "conservative"), scenarios[0])
    growth = next((s for s in scenarios if s["scenario_type"] == "growth"), scenarios[-1])
    balanced = next((s for s in scenarios if s["scenario_type"] == "balanced"), scenarios[1])
    
    # Risk vs Return trade-off
    return_diff = growth["metrics"]["expected_return_mid"] - conservative["metrics"]["expected_return_mid"]
    volatility_diff = growth["metrics"]["volatility"] - conservative["metrics"]["volatility"]
    trade_offs.append({
        "dimension": "risk_return",
        "description": "Risk vs Return Trade-off",
        "scenario_a": conservative["scenario_name"],
        "scenario_b": growth["scenario_name"],
        "impact_description": f"Increasing equity exposure increases expected return by {return_diff:.1f}% p.a. but increases volatility by {volatility_diff:.1f}%",
        "quantitative_impact": {
            "return_increase": return_diff,
            "volatility_increase": volatility_diff,
            "ratio": round(return_diff / volatility_diff, 2) if volatility_diff > 0 else 0
        }
    })
    
    # Income vs Growth trade-off
    income_scenario = next((s for s in scenarios if s["scenario_type"] == "income"), balanced)
    yield_diff = income_scenario["metrics"]["income_yield"] - growth["metrics"]["income_yield"]
    growth_diff = growth["metrics"]["projected_value_10yr"] - income_scenario["metrics"]["projected_value_10yr"]
    trade_offs.append({
        "dimension": "income_growth",
        "description": "Income vs Growth Trade-off",
        "scenario_a": income_scenario["scenario_name"],
        "scenario_b": growth["scenario_name"],
        "impact_description": f"Focusing on income increases yield by {yield_diff:.1f}% but reduces projected 10-year value by ${growth_diff:,.0f}",
        "quantitative_impact": {
            "yield_increase": yield_diff,
            "value_reduction": growth_diff
        }
    })
    
    # Fees impact over time
    avg_fee = sum(s["metrics"]["total_fees"] for s in scenarios) / len(scenarios)
    fee_impact_10yr = sum(s["metrics"]["projected_value_10yr"] for s in scenarios) / len(scenarios) * avg_fee / 100 * 10
    trade_offs.append({
        "dimension": "fees_outcomes",
        "description": "Fee Impact Over Time",
        "scenario_a": "Lower Fee Options",
        "scenario_b": "Higher Fee Options",
        "impact_description": f"Average fee of {avg_fee:.2f}% p.a. compounds to approximately ${fee_impact_10yr:,.0f} over 10 years",
        "quantitative_impact": {
            "average_fee": avg_fee,
            "estimated_fee_cost_10yr": fee_impact_10yr
        }
    })
    
    return trade_offs

# ==================== API ROUTES ====================

@router.post("/generate")
async def generate_scenarios(inputs: ScenarioInputs, request: Request):
    """
    Generate multiple financial scenarios.
    
    IMPORTANT: This generates scenarios for comparison, NOT recommendations.
    - Minimum 3 scenarios generated
    - No scenario is marked as "recommended"
    - Adviser must review and select
    """
    # Get base template for risk profile
    base_template = ALLOCATION_TEMPLATES.get(inputs.risk_profile, ALLOCATION_TEMPLATES["balanced"])
    
    # Generate minimum 3 scenarios (conservative, balanced, growth) + income if relevant
    scenario_types = ["conservative", "balanced", "growth"]
    if inputs.income_requirement > 0:
        scenario_types.append("income")
    
    scenarios = []
    for scenario_type in scenario_types:
        scenario = generate_scenario(scenario_type, inputs, base_template)
        scenarios.append(scenario)
    
    # Generate comparison summary
    comparison = generate_comparison_summary(scenarios)
    
    # Generate trade-offs
    trade_offs = generate_trade_offs(scenarios)
    
    # Create scenario set
    scenario_set_id = f"set_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    expires = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    
    scenario_set = {
        "id": scenario_set_id,
        "client_id": inputs.client_id,
        "adviser_id": inputs.adviser_id,
        "licensee_id": inputs.licensee_id,
        "inputs": inputs.dict(),
        "scenarios": scenarios,
        "trade_offs": trade_offs,
        "comparison_summary": comparison,
        "compliance_status": "pending",  # Will be updated by compliance check
        "created_at": now,
        "expires_at": expires,
        "status": "pending_review"
    }
    
    # Save to database
    await scenarios_col.insert_one(scenario_set)
    
    # Create explainability record
    explainability = {
        "id": f"exp_{uuid.uuid4().hex[:12]}",
        "entity_type": "scenario_set",
        "entity_id": scenario_set_id,
        "inputs_used": inputs.dict(),
        "rules_triggered": [
            {"rule": "allocation_template", "value": inputs.risk_profile},
            {"rule": "scenario_types", "value": scenario_types}
        ],
        "assumptions_applied": [
            "Risk-free rate: 4.0%",
            f"Investment timeframe: {inputs.investment_timeframe_years} years",
            f"Monthly contributions: ${inputs.monthly_contribution:,.0f}",
            "Returns are before-tax estimates",
            "Inflation not explicitly modeled"
        ],
        "calculations_performed": [
            {"calc": "future_value", "method": "compound_growth_with_contributions"},
            {"calc": "sharpe_ratio", "method": "(return - risk_free) / volatility"},
            {"calc": "income_yield", "method": "weighted_average_by_asset_class"}
        ],
        "alternative_scenarios": [s["scenario_name"] for s in scenarios],
        "created_at": now,
        "version": "1.0"
    }
    await explainability_col.insert_one(explainability)
    
    # Audit log
    await audit_logs_col.insert_one({
        "id": f"audit_{uuid.uuid4().hex[:12]}",
        "user_id": inputs.adviser_id,
        "user_role": "adviser",
        "action_type": "create",
        "entity_type": "scenario",
        "entity_id": scenario_set_id,
        "after_state": {"scenario_count": len(scenarios), "types": scenario_types},
        "timestamp": now,
        "ip_address": request.client.host if request.client else None,
        "hash": ""
    })
    
    # Remove MongoDB _id
    del scenario_set["_id"]
    
    return {
        "scenario_set": scenario_set,
        "disclaimer": "This tool provides decision support only. This is not financial advice. Adviser must confirm all outputs."
    }

@router.get("/{scenario_set_id}")
async def get_scenario_set(scenario_set_id: str):
    """Get a scenario set by ID"""
    scenario_set = await scenarios_col.find_one({"id": scenario_set_id}, {"_id": 0})
    if not scenario_set:
        raise HTTPException(status_code=404, detail="Scenario set not found")
    return scenario_set

@router.get("/{scenario_set_id}/explainability")
async def get_scenario_explainability(scenario_set_id: str):
    """Get explainability record for a scenario set"""
    record = await explainability_col.find_one(
        {"entity_type": "scenario_set", "entity_id": scenario_set_id},
        {"_id": 0}
    )
    if not record:
        raise HTTPException(status_code=404, detail="Explainability record not found")
    return record

@router.get("/client/{client_id}")
async def get_client_scenarios(client_id: str, limit: int = 10):
    """Get scenarios for a client"""
    scenarios = await scenarios_col.find(
        {"client_id": client_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return {"scenarios": scenarios, "count": len(scenarios)}

@router.get("/adviser/{adviser_id}")
async def get_adviser_scenarios(adviser_id: str, status: Optional[str] = None, limit: int = 50):
    """Get scenarios created by an adviser"""
    query = {"adviser_id": adviser_id}
    if status:
        query["status"] = status
    
    scenarios = await scenarios_col.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return {"scenarios": scenarios, "count": len(scenarios)}
