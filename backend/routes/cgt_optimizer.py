"""
CGT Optimization Scenarios
Advanced Capital Gains Tax optimization with tax-loss harvesting and disposal strategies
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

router = APIRouter(prefix="/cgt-optimizer", tags=["CGT Optimization"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ==================== CGT RULES (2024-25) ====================

CGT_RATES = {
    "discount_rate": 0.50,  # 50% CGT discount for assets held > 12 months
    "discount_holding_period_days": 365,
    "smsf_discount_rate": 0.333,  # 33.3% discount for SMSFs
    "company_rate": 0.25,  # Company tax rate (base rate entities)
    "company_rate_large": 0.30,  # Company tax rate (non-base rate entities)
    "trust_rate": 0.47,  # Trusts distributed to individuals at marginal rate
}

# Individual tax rates 2024-25
INDIVIDUAL_TAX_RATES = [
    {"threshold": 0, "rate": 0, "base": 0},
    {"threshold": 18200, "rate": 0.19, "base": 0},
    {"threshold": 45000, "rate": 0.325, "base": 5092},
    {"threshold": 120000, "rate": 0.37, "base": 29467},
    {"threshold": 180000, "rate": 0.45, "base": 51667},
]

# Medicare levy
MEDICARE_LEVY = 0.02


# ==================== MODELS ====================

class AssetHolding(BaseModel):
    id: str
    name: str
    asset_type: str  # shares, property, crypto, managed_fund, other
    entity: str  # personal, joint, company, trust, smsf
    units: float = 1
    purchase_date: str  # YYYY-MM-DD
    cost_base: float
    current_value: float
    has_improvements: bool = False
    improvement_costs: float = 0
    acquisition_costs: float = 0  # stamp duty, legal fees, etc.


class OptimizationRequest(BaseModel):
    client_id: str
    taxable_income: float = 0  # Other taxable income this FY
    target_gain_loss: Optional[float] = None  # Target net CGT position
    holdings: List[AssetHolding]
    include_tax_loss_harvesting: bool = True
    consider_wash_sale_rules: bool = True
    optimization_goal: str = "minimize_tax"  # minimize_tax, realize_gains, balance


class DisposalScenario(BaseModel):
    holding_id: str
    units_to_sell: float
    expected_sale_price: float


# ==================== CALCULATION FUNCTIONS ====================

def calculate_individual_tax(taxable_income: float) -> Dict[str, float]:
    """Calculate individual income tax including Medicare levy."""
    if taxable_income <= 0:
        return {"tax": 0, "medicare": 0, "total": 0, "effective_rate": 0}
    
    tax = 0
    for i, bracket in enumerate(INDIVIDUAL_TAX_RATES):
        if i == len(INDIVIDUAL_TAX_RATES) - 1:
            if taxable_income > bracket["threshold"]:
                tax = bracket["base"] + (taxable_income - bracket["threshold"]) * bracket["rate"]
            break
        elif taxable_income <= INDIVIDUAL_TAX_RATES[i + 1]["threshold"]:
            if taxable_income > bracket["threshold"]:
                tax = bracket["base"] + (taxable_income - bracket["threshold"]) * bracket["rate"]
            break
    
    medicare = taxable_income * MEDICARE_LEVY if taxable_income > 23365 else 0
    total = tax + medicare
    effective_rate = total / taxable_income if taxable_income > 0 else 0
    
    return {
        "tax": round(tax, 2),
        "medicare": round(medicare, 2),
        "total": round(total, 2),
        "effective_rate": round(effective_rate * 100, 2)
    }


def calculate_marginal_rate(taxable_income: float) -> float:
    """Get marginal tax rate for given income level."""
    for i, bracket in enumerate(INDIVIDUAL_TAX_RATES):
        if i == len(INDIVIDUAL_TAX_RATES) - 1:
            return bracket["rate"] + MEDICARE_LEVY
        elif taxable_income <= INDIVIDUAL_TAX_RATES[i + 1]["threshold"]:
            return bracket["rate"] + MEDICARE_LEVY
    return 0.47  # Top rate + Medicare


def calculate_cgt_for_holding(
    holding: AssetHolding,
    sale_price: float,
    units_sold: float = None
) -> Dict[str, Any]:
    """Calculate CGT for a specific holding disposal."""
    if units_sold is None:
        units_sold = holding.units
    
    # Proportional values
    proportion = units_sold / holding.units if holding.units > 0 else 1
    cost_base = (holding.cost_base + holding.improvement_costs + holding.acquisition_costs) * proportion
    proceeds = sale_price * proportion if sale_price else holding.current_value * proportion
    
    # Calculate gain/loss
    gain_loss = proceeds - cost_base
    
    # Check holding period for discount
    purchase_date = datetime.strptime(holding.purchase_date, "%Y-%m-%d").date()
    today = date.today()
    holding_days = (today - purchase_date).days
    qualifies_for_discount = holding_days >= CGT_RATES["discount_holding_period_days"]
    
    # Apply discount based on entity
    if gain_loss > 0 and qualifies_for_discount:
        if holding.entity == "smsf":
            discount = CGT_RATES["smsf_discount_rate"]
        elif holding.entity in ["personal", "joint", "trust"]:
            discount = CGT_RATES["discount_rate"]
        else:  # company
            discount = 0
        
        discounted_gain = gain_loss * (1 - discount)
    else:
        discount = 0
        discounted_gain = gain_loss
    
    return {
        "holding_id": holding.id,
        "holding_name": holding.name,
        "entity": holding.entity,
        "units_sold": units_sold,
        "proceeds": round(proceeds, 2),
        "cost_base": round(cost_base, 2),
        "gross_gain_loss": round(gain_loss, 2),
        "is_gain": gain_loss > 0,
        "holding_days": holding_days,
        "qualifies_for_discount": qualifies_for_discount,
        "discount_rate": discount,
        "taxable_gain": round(discounted_gain, 2) if gain_loss > 0 else round(gain_loss, 2)
    }


def identify_tax_loss_harvesting_opportunities(
    holdings: List[AssetHolding],
    min_loss_threshold: float = 1000
) -> List[Dict[str, Any]]:
    """Identify holdings with unrealized losses suitable for harvesting."""
    opportunities = []
    
    for holding in holdings:
        cost_base = holding.cost_base + holding.improvement_costs + holding.acquisition_costs
        unrealized_gain_loss = holding.current_value - cost_base
        
        if unrealized_gain_loss < -min_loss_threshold:
            opportunities.append({
                "holding_id": holding.id,
                "holding_name": holding.name,
                "asset_type": holding.asset_type,
                "unrealized_loss": round(abs(unrealized_gain_loss), 2),
                "current_value": round(holding.current_value, 2),
                "cost_base": round(cost_base, 2),
                "potential_tax_benefit": round(abs(unrealized_gain_loss) * 0.39, 2),  # Assume 39% rate
                "wash_sale_risk": holding.asset_type in ["shares", "managed_fund"],
                "recommendation": "Consider selling to realize loss, then repurchase after 30 days to avoid wash sale rules"
            })
    
    # Sort by loss amount
    opportunities.sort(key=lambda x: x["unrealized_loss"], reverse=True)
    
    return opportunities


def optimize_disposal_order(
    holdings: List[AssetHolding],
    target_proceeds: float,
    optimization_goal: str = "minimize_tax"
) -> List[Dict[str, Any]]:
    """Determine optimal order to dispose holdings to minimize tax."""
    # Calculate CGT for each holding
    holding_analysis = []
    
    for holding in holdings:
        cgt = calculate_cgt_for_holding(holding, holding.current_value)
        
        # Score based on optimization goal
        if optimization_goal == "minimize_tax":
            # Prioritize: losses first, then long-term gains (discounted), then short-term
            if cgt["gross_gain_loss"] < 0:
                score = 1000 + abs(cgt["gross_gain_loss"])  # Losses are best
            elif cgt["qualifies_for_discount"]:
                score = 500 - cgt["taxable_gain"]  # Discounted gains next
            else:
                score = 0 - cgt["taxable_gain"]  # Short-term gains last
        elif optimization_goal == "realize_gains":
            # Prioritize gains
            score = cgt["gross_gain_loss"]
        else:  # balance
            score = 0
        
        holding_analysis.append({
            **cgt,
            "score": score
        })
    
    # Sort by score (higher is better)
    holding_analysis.sort(key=lambda x: x["score"], reverse=True)
    
    # Build disposal plan
    disposal_plan = []
    cumulative_proceeds = 0
    
    for holding in holding_analysis:
        if cumulative_proceeds >= target_proceeds:
            break
        
        # Calculate how much of this holding to sell
        remaining_needed = target_proceeds - cumulative_proceeds
        holding_value = holding["proceeds"]
        
        if holding_value <= remaining_needed:
            # Sell all
            disposal_plan.append({
                **holding,
                "action": "sell_all",
                "amount_to_sell": holding["proceeds"]
            })
            cumulative_proceeds += holding_value
        else:
            # Partial sale
            proportion = remaining_needed / holding_value
            disposal_plan.append({
                **holding,
                "action": "partial_sell",
                "proportion": round(proportion, 4),
                "amount_to_sell": round(remaining_needed, 2)
            })
            cumulative_proceeds += remaining_needed
    
    return disposal_plan


def generate_cgt_scenarios(
    holdings: List[AssetHolding],
    taxable_income: float
) -> List[Dict[str, Any]]:
    """Generate multiple CGT scenarios for comparison."""
    scenarios = []
    
    # Scenario 1: Sell all losers first
    losses = [h for h in holdings if h.current_value < h.cost_base]
    gains = [h for h in holdings if h.current_value >= h.cost_base]
    
    total_loss = sum(h.cost_base - h.current_value for h in losses)
    total_gain = sum(h.current_value - h.cost_base for h in gains)
    
    scenarios.append({
        "name": "Tax-Loss Harvesting",
        "description": "Realize all losses to offset gains",
        "holdings_to_sell": [h.id for h in losses],
        "total_loss_realized": round(total_loss, 2),
        "potential_tax_savings": round(total_loss * calculate_marginal_rate(taxable_income), 2),
        "recommendation": "Best if you have realized gains to offset"
    })
    
    # Scenario 2: Sell long-term holdings only
    long_term = [h for h in holdings if (date.today() - datetime.strptime(h.purchase_date, "%Y-%m-%d").date()).days >= 365]
    long_term_gains = sum(max(0, h.current_value - h.cost_base) for h in long_term)
    
    scenarios.append({
        "name": "Long-Term Only",
        "description": "Only sell holdings qualifying for 50% CGT discount",
        "holdings_to_sell": [h.id for h in long_term],
        "gross_gain": round(long_term_gains, 2),
        "taxable_gain": round(long_term_gains * 0.5, 2),
        "tax_payable": round(long_term_gains * 0.5 * calculate_marginal_rate(taxable_income), 2),
        "recommendation": "Best for maximizing CGT discount"
    })
    
    # Scenario 3: Balanced approach
    scenarios.append({
        "name": "Balanced Approach",
        "description": "Offset gains with losses, prioritize discounted assets",
        "net_position": round(total_gain - total_loss, 2),
        "estimated_tax": round(max(0, (total_gain - total_loss) * 0.5 * calculate_marginal_rate(taxable_income)), 2),
        "recommendation": "Best for overall tax efficiency"
    })
    
    # Scenario 4: Defer all
    scenarios.append({
        "name": "Defer Sales",
        "description": "Hold all assets, defer CGT events",
        "current_unrealized_gain": round(total_gain - total_loss, 2),
        "benefit": "No immediate tax liability",
        "risk": "Market movements may increase/decrease gains",
        "recommendation": "Best if expecting lower income next year or market decline"
    })
    
    return scenarios


# ==================== API ENDPOINTS ====================

@router.post("/analyze")
async def analyze_cgt_position(request: OptimizationRequest):
    """
    Comprehensive CGT analysis with optimization recommendations.
    """
    db = await get_db()
    
    # Calculate current position for each holding
    holding_analysis = []
    total_unrealized_gains = 0
    total_unrealized_losses = 0
    
    for holding in request.holdings:
        cgt = calculate_cgt_for_holding(holding, holding.current_value)
        holding_analysis.append(cgt)
        
        if cgt["gross_gain_loss"] > 0:
            total_unrealized_gains += cgt["gross_gain_loss"]
        else:
            total_unrealized_losses += abs(cgt["gross_gain_loss"])
    
    # Tax loss harvesting opportunities
    tax_loss_opportunities = identify_tax_loss_harvesting_opportunities(request.holdings) if request.include_tax_loss_harvesting else []
    
    # Generate scenarios
    scenarios = generate_cgt_scenarios(request.holdings, request.taxable_income)
    
    # Calculate tax impact
    net_position = total_unrealized_gains - total_unrealized_losses
    marginal_rate = calculate_marginal_rate(request.taxable_income)
    
    # Optimal strategy
    if net_position <= 0:
        optimal_strategy = "Realize losses to carry forward or offset other gains"
    elif total_unrealized_losses > 0:
        optimal_strategy = "Realize losses first, then consider discounted gains"
    else:
        optimal_strategy = "Prioritize selling long-term holdings for CGT discount"
    
    result = {
        "client_id": request.client_id,
        "analysis_date": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_holdings": len(request.holdings),
            "total_unrealized_gains": round(total_unrealized_gains, 2),
            "total_unrealized_losses": round(total_unrealized_losses, 2),
            "net_unrealized_position": round(net_position, 2),
            "estimated_marginal_rate": round(marginal_rate * 100, 2),
            "potential_tax_if_all_realized": round(max(0, net_position * 0.5 * marginal_rate), 2)
        },
        "holding_analysis": holding_analysis,
        "tax_loss_harvesting": tax_loss_opportunities,
        "scenarios": scenarios,
        "optimal_strategy": optimal_strategy,
        "recommendations": [
            {
                "priority": "high",
                "action": "Review holdings with unrealized losses before June 30",
                "benefit": f"Could save up to ${round(total_unrealized_losses * marginal_rate, 2):,.2f} in tax"
            },
            {
                "priority": "medium",
                "action": "Consider timing of sales around 12-month holding period",
                "benefit": "50% CGT discount on gains from assets held > 12 months"
            },
            {
                "priority": "low",
                "action": "Review asset allocation for CGT efficiency",
                "benefit": "Holding growth assets in tax-advantaged structures"
            }
        ]
    }
    
    # Store analysis
    await db.cgt_analyses.insert_one({
        "id": str(uuid.uuid4()),
        **result
    })
    
    return result


@router.post("/disposal-plan")
async def create_disposal_plan(
    request: OptimizationRequest,
    target_proceeds: float = Query(..., description="Target sale proceeds needed")
):
    """
    Create optimized disposal plan to raise target amount with minimum tax.
    """
    disposal_plan = optimize_disposal_order(
        request.holdings,
        target_proceeds,
        request.optimization_goal
    )
    
    # Calculate total tax impact
    total_taxable_gain = sum(d["taxable_gain"] for d in disposal_plan if d["taxable_gain"] > 0)
    total_losses = sum(abs(d["taxable_gain"]) for d in disposal_plan if d["taxable_gain"] < 0)
    net_taxable = max(0, total_taxable_gain - total_losses)
    
    marginal_rate = calculate_marginal_rate(request.taxable_income)
    estimated_tax = net_taxable * marginal_rate
    
    total_proceeds = sum(d.get("amount_to_sell", d["proceeds"]) for d in disposal_plan)
    
    return {
        "client_id": request.client_id,
        "target_proceeds": target_proceeds,
        "achieved_proceeds": round(total_proceeds, 2),
        "disposal_plan": disposal_plan,
        "tax_summary": {
            "total_taxable_gains": round(total_taxable_gain, 2),
            "total_losses_utilized": round(total_losses, 2),
            "net_taxable_gain": round(net_taxable, 2),
            "estimated_tax": round(estimated_tax, 2),
            "effective_tax_rate": round(estimated_tax / total_proceeds * 100, 2) if total_proceeds > 0 else 0
        },
        "optimization_goal": request.optimization_goal
    }


@router.get("/wash-sale-check")
async def check_wash_sale_rules(
    asset_name: str,
    sale_date: str,
    repurchase_date: str
):
    """
    Check if a sale and repurchase would trigger wash sale rules.
    """
    sale = datetime.strptime(sale_date, "%Y-%m-%d").date()
    repurchase = datetime.strptime(repurchase_date, "%Y-%m-%d").date()
    
    days_between = abs((repurchase - sale).days)
    
    # ATO generally looks at 30 days either side
    is_wash_sale = days_between <= 30
    
    return {
        "asset_name": asset_name,
        "sale_date": sale_date,
        "repurchase_date": repurchase_date,
        "days_between": days_between,
        "is_potential_wash_sale": is_wash_sale,
        "warning": "Loss may be denied if transaction lacks genuine commercial purpose" if is_wash_sale else None,
        "safe_repurchase_date": (sale + timedelta(days=31)).isoformat(),
        "ato_guidance": "The ATO may deny loss deduction if scheme has dominant purpose of obtaining tax benefit"
    }


@router.get("/rates")
async def get_cgt_rates():
    """Get current CGT rates and thresholds."""
    return {
        "financial_year": "2024-25",
        "cgt_discount": CGT_RATES,
        "individual_tax_rates": INDIVIDUAL_TAX_RATES,
        "medicare_levy": MEDICARE_LEVY,
        "notes": [
            "CGT discount applies to assets held for more than 12 months",
            "Companies do not receive CGT discount",
            "SMSFs receive 33.3% CGT discount (not 50%)",
            "Capital losses can only offset capital gains (not other income)",
            "Unused capital losses carry forward indefinitely"
        ]
    }


@router.post("/what-if")
async def what_if_analysis(
    holding: AssetHolding,
    sale_prices: List[float] = Query(..., description="List of potential sale prices to analyze")
):
    """
    What-if analysis for different sale price scenarios.
    """
    scenarios = []
    
    for price in sale_prices:
        cgt = calculate_cgt_for_holding(holding, price)
        scenarios.append({
            "sale_price": price,
            **cgt
        })
    
    return {
        "holding": {
            "id": holding.id,
            "name": holding.name,
            "cost_base": holding.cost_base,
            "current_value": holding.current_value
        },
        "scenarios": scenarios,
        "break_even_price": holding.cost_base + holding.improvement_costs + holding.acquisition_costs
    }
