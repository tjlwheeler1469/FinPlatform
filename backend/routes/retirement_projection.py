"""
Retirement Portfolio Projection API
=====================================
Consolidates all assets into one portfolio, then runs
deterministic + Monte Carlo retirement projections based on
configurable inputs (assets, expenses, inflation, yield, CGT, tax).
"""

import os
import math
import random
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

router = APIRouter(prefix="/retirement-projection", tags=["Retirement Projection"])

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

projections_col = db["retirement_projections"]


class ProjectionInput(BaseModel):
    client_id: str
    # Portfolio
    total_portfolio: float = 1500000
    super_balance: float = 400000
    property_value: float = 850000
    cash_savings: float = 50000
    other_assets: float = 0
    # Income & Expenses
    annual_income: float = 180000
    annual_expenses: float = 90000
    annual_savings: float = 50000
    # Retirement
    current_age: int = 45
    retirement_age: int = 65
    life_expectancy: int = 90
    # Rates
    inflation_rate: float = 3.0
    expected_yield: float = 7.0
    super_return: float = 8.0
    # Tax
    marginal_tax_rate: float = 37.0
    cgt_rate: float = 23.5  # 50% discount on 47%
    annual_cgt_liability: float = 5000
    annual_tax_deductions: float = 15000
    # Drawdown
    drawdown_strategy: str = "constant"  # constant, bucket, dynamic
    # Monte Carlo
    simulations: int = 1000
    volatility: float = 12.0


@router.post("/calculate")
async def calculate_projection(inp: ProjectionInput):
    years_to_retire = max(0, inp.retirement_age - inp.current_age)
    years_in_retirement = max(1, inp.life_expectancy - inp.retirement_age)
    total_years = years_to_retire + years_in_retirement

    # Consolidate total assets
    total_assets = inp.total_portfolio + inp.super_balance + inp.property_value + inp.cash_savings + inp.other_assets

    # ============ DETERMINISTIC PROJECTION ============
    det_timeline = []
    portfolio = inp.total_portfolio + inp.cash_savings + inp.other_assets
    super_bal = inp.super_balance
    prop_val = inp.property_value
    for year in range(total_years + 1):
        age = inp.current_age + year
        is_retired = age >= inp.retirement_age
        inflation_mult = (1 + inp.inflation_rate / 100) ** year
        expenses_adj = inp.annual_expenses * inflation_mult

        if not is_retired:
            # Accumulation phase
            portfolio *= (1 + inp.expected_yield / 100)
            portfolio += inp.annual_savings
            portfolio -= inp.annual_cgt_liability
            super_bal *= (1 + inp.super_return / 100)
            super_bal += min(30000, inp.annual_income * 0.115)  # SG contributions
            prop_val *= 1.04  # Property growth ~4% pa
        else:
            # Drawdown phase
            if age == 60:
                portfolio += super_bal  # Access super at 60
                super_bal = 0
            elif age < 60:
                super_bal *= (1 + inp.super_return / 100)

            portfolio *= (1 + inp.expected_yield / 100)
            portfolio -= expenses_adj
            portfolio -= inp.annual_cgt_liability * 0.5  # Reduced CGT in retirement
            prop_val *= 1.04

        total = portfolio + super_bal + prop_val
        det_timeline.append({
            "year": year,
            "age": age,
            "phase": "retirement" if is_retired else "accumulation",
            "portfolio": round(max(0, portfolio)),
            "super": round(max(0, super_bal)),
            "property": round(prop_val),
            "total": round(max(0, total)),
            "expenses": round(expenses_adj),
        })

    # ============ MONTE CARLO SIMULATION ============
    num_sims = min(inp.simulations, 2000)
    final_values = []
    ran_out_at = []

    for _ in range(num_sims):
        p = inp.total_portfolio + inp.cash_savings + inp.other_assets
        s = inp.super_balance
        depleted_year = None

        for year in range(1, total_years + 1):
            age = inp.current_age + year
            is_retired = age >= inp.retirement_age
            inflation_mult = (1 + inp.inflation_rate / 100) ** year
            expenses_adj = inp.annual_expenses * inflation_mult

            # Random return with volatility
            ret = random.gauss(inp.expected_yield / 100, inp.volatility / 100)
            s_ret = random.gauss(inp.super_return / 100, inp.volatility / 100 * 0.7)

            if not is_retired:
                p *= (1 + ret)
                p += inp.annual_savings - inp.annual_cgt_liability
                s *= (1 + s_ret)
                s += min(30000, inp.annual_income * 0.115)
            else:
                if age == 60:
                    p += s
                    s = 0
                elif age < 60:
                    s *= (1 + s_ret)
                p *= (1 + ret)
                p -= expenses_adj
                p -= inp.annual_cgt_liability * 0.5

            if p <= 0 and depleted_year is None:
                depleted_year = age
                p = 0

        final_values.append(max(0, p + s))
        if depleted_year:
            ran_out_at.append(depleted_year)

    final_values.sort()
    success_count = sum(1 for v in final_values if v > 0)
    success_rate = (success_count / num_sims) * 100

    percentiles = {
        "p10": round(final_values[int(num_sims * 0.10)]),
        "p25": round(final_values[int(num_sims * 0.25)]),
        "p50_median": round(final_values[int(num_sims * 0.50)]),
        "p75": round(final_values[int(num_sims * 0.75)]),
        "p90": round(final_values[int(num_sims * 0.90)]),
    }

    avg_depletion_age = round(sum(ran_out_at) / len(ran_out_at)) if ran_out_at else None

    # ============ TAX SUMMARY ============
    total_cgt = inp.annual_cgt_liability * total_years
    total_tax_saved = inp.annual_tax_deductions * years_to_retire
    net_tax_impact = total_tax_saved - total_cgt

    # ============ RECOMMENDATIONS ============
    recommendations = []
    if success_rate < 70:
        recommendations.append({"type": "warning", "text": f"Success rate is {success_rate:.0f}% — consider increasing savings or reducing expenses"})
    if inp.annual_savings < inp.annual_expenses * 0.3:
        recommendations.append({"type": "info", "text": "Savings rate is below 30% of expenses — increasing contributions improves outcomes"})
    if inp.cgt_rate > 20:
        recommendations.append({"type": "info", "text": "Consider tax-loss harvesting to reduce CGT drag on returns"})
    if inp.expected_yield > 10:
        recommendations.append({"type": "warning", "text": "Expected yield above 10% is aggressive — consider stress-testing with lower returns"})
    if success_rate >= 90:
        recommendations.append({"type": "positive", "text": f"Strong position — {success_rate:.0f}% probability of funding retirement to age {inp.life_expectancy}"})

    # Save projection
    result = {
        "client_id": inp.client_id,
        "calculated_at": datetime.now(timezone.utc).isoformat(),
        "inputs": inp.model_dump(),
        "consolidated_assets": round(total_assets),
        "years_to_retirement": years_to_retire,
        "years_in_retirement": years_in_retirement,
        "deterministic": {
            "timeline": det_timeline,
            "final_portfolio": det_timeline[-1]["total"] if det_timeline else 0,
        },
        "monte_carlo": {
            "simulations": num_sims,
            "success_rate": round(success_rate, 1),
            "percentiles": percentiles,
            "depletion_risk": round(len(ran_out_at) / num_sims * 100, 1),
            "avg_depletion_age": avg_depletion_age,
        },
        "tax_summary": {
            "total_cgt_lifetime": round(total_cgt),
            "total_tax_savings": round(total_tax_saved),
            "net_tax_impact": round(net_tax_impact),
        },
        "recommendations": recommendations,
    }

    await projections_col.replace_one(
        {"client_id": inp.client_id},
        result,
        upsert=True
    )

    # Remove _id
    result.pop("_id", None)
    return result


@router.get("/{client_id}")
async def get_last_projection(client_id: str):
    doc = await projections_col.find_one({"client_id": client_id}, {"_id": 0})
    if not doc:
        return {"client_id": client_id, "has_projection": False}
    doc["has_projection"] = True
    return doc
