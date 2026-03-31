"""
Stock Trading & Order Management System
Buy/sell listed stocks with CGT calculations and broker integration.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
import uuid
import logging
import secrets
_rng = secrets.SystemRandom()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trading", tags=["Stock Trading"])

# Australian CGT rates (2024-25)
CGT_DISCOUNT_THRESHOLD_DAYS = 365  # 12 months for 50% CGT discount
CGT_RATES = {
    "individual": {
        "0-18200": 0,
        "18201-45000": 0.19,
        "45001-120000": 0.325,
        "120001-180000": 0.37,
        "180001+": 0.45
    },
    "company": 0.25,  # Small business rate
    "trust": 0.45,    # Distributed at highest marginal
    "smsf_accumulation": 0.15,
    "smsf_pension": 0
}

# Mock holdings data with cost base tracking
CLIENT_HOLDINGS = {
    "client_1": {
        "name": "Wheeler Family",
        "entity_type": "individual",
        "taxable_income": 180000,
        "holdings": [
            {"symbol": "CBA.AX", "name": "Commonwealth Bank", "units": 200, "avg_cost": 98.50, "current_price": 118.50, "purchase_date": "2022-06-15", "sector": "Financials"},
            {"symbol": "BHP.AX", "name": "BHP Group", "units": 300, "avg_cost": 45.20, "current_price": 42.80, "purchase_date": "2023-03-10", "sector": "Materials"},
            {"symbol": "CSL.AX", "name": "CSL Limited", "units": 50, "avg_cost": 285.00, "current_price": 298.00, "purchase_date": "2021-11-20", "sector": "Healthcare"},
            {"symbol": "VAS.AX", "name": "Vanguard Aus Shares", "units": 500, "avg_cost": 88.00, "current_price": 96.50, "purchase_date": "2022-01-05", "sector": "ETF"},
            {"symbol": "VGS.AX", "name": "Vanguard Intl Shares", "units": 300, "avg_cost": 102.00, "current_price": 118.40, "purchase_date": "2023-08-15", "sector": "ETF"},
        ]
    },
    "client_2": {
        "name": "Chen Investment Trust",
        "entity_type": "trust",
        "taxable_income": 250000,
        "holdings": [
            {"symbol": "NVDA", "name": "NVIDIA Corp", "units": 150, "avg_cost": 300.00, "current_price": 900.00, "purchase_date": "2022-12-01", "sector": "Technology"},
            {"symbol": "MSFT", "name": "Microsoft Corp", "units": 200, "avg_cost": 260.00, "current_price": 420.00, "purchase_date": "2021-06-15", "sector": "Technology"},
            {"symbol": "AAPL", "name": "Apple Inc", "units": 300, "avg_cost": 140.00, "current_price": 180.00, "purchase_date": "2022-03-20", "sector": "Technology"},
            {"symbol": "VGS.AX", "name": "Vanguard Intl Shares", "units": 1000, "avg_cost": 95.00, "current_price": 118.40, "purchase_date": "2023-05-10", "sector": "ETF"},
        ]
    },
    "client_3": {
        "name": "Thompson SMSF",
        "entity_type": "smsf_accumulation",
        "taxable_income": 0,
        "holdings": [
            {"symbol": "VAS.AX", "name": "Vanguard Aus Shares", "units": 200, "avg_cost": 88.00, "current_price": 96.50, "purchase_date": "2023-01-15", "sector": "ETF"},
            {"symbol": "VAF.AX", "name": "Vanguard Aus Fixed Int", "units": 500, "avg_cost": 50.00, "current_price": 49.00, "purchase_date": "2022-09-01", "sector": "Bonds"},
        ]
    },
    "client_4": {
        "name": "Patel Holdings",
        "entity_type": "company",
        "taxable_income": 500000,
        "holdings": [
            {"symbol": "TSLA", "name": "Tesla Inc", "units": 200, "avg_cost": 425.00, "current_price": 260.00, "purchase_date": "2021-11-01", "sector": "Technology"},
            {"symbol": "AMZN", "name": "Amazon.com", "units": 150, "avg_cost": 160.00, "current_price": 185.00, "purchase_date": "2023-06-15", "sector": "Technology"},
            {"symbol": "META", "name": "Meta Platforms", "units": 180, "avg_cost": 250.00, "current_price": 550.00, "purchase_date": "2022-08-20", "sector": "Technology"},
        ]
    }
}

# Order book for pending orders
PENDING_ORDERS: Dict[str, Dict] = {}
EXECUTED_ORDERS: List[Dict] = []

# Broker integrations (mock)
BROKER_CONNECTIONS = {
    "openmarkets": {"name": "OpenMarkets", "status": "demo", "markets": ["ASX"], "fees": {"flat": 9.50, "percent": 0}},
    "selfwealth": {"name": "SelfWealth", "status": "demo", "markets": ["ASX", "US"], "fees": {"flat": 9.50, "percent": 0}},
    "interactive_brokers": {"name": "Interactive Brokers", "status": "demo", "markets": ["ASX", "US", "Global"], "fees": {"flat": 0, "percent": 0.0005}},
    "cmc_markets": {"name": "CMC Markets", "status": "demo", "markets": ["ASX", "US"], "fees": {"flat": 0, "percent": 0.0008}},
}


class OrderRequest(BaseModel):
    client_id: str
    symbol: str
    order_type: str = "market"  # market, limit
    side: str  # buy, sell
    units: int
    limit_price: Optional[float] = None
    notes: Optional[str] = None


class CGTCalculation(BaseModel):
    symbol: str
    units_sold: int
    sale_price: float
    cost_base: float
    purchase_date: str
    sale_date: str
    holding_period_days: int
    eligible_for_discount: bool
    gross_gain: float
    discount_amount: float
    net_capital_gain: float
    estimated_tax: float
    tax_rate: float


def calculate_cgt(
    units: int,
    cost_base: float,
    sale_price: float,
    purchase_date: str,
    entity_type: str,
    taxable_income: float = 180000
) -> Dict:
    """Calculate CGT for a stock sale."""
    
    # Parse dates
    purchase_dt = datetime.strptime(purchase_date, "%Y-%m-%d")
    sale_dt = datetime.now()
    holding_days = (sale_dt - purchase_dt).days
    
    # Calculate gross gain/loss
    total_cost = units * cost_base
    total_proceeds = units * sale_price
    gross_gain = total_proceeds - total_cost
    
    # Determine if eligible for 50% CGT discount (12+ months for individuals/trusts)
    eligible_for_discount = (
        holding_days >= CGT_DISCOUNT_THRESHOLD_DAYS and 
        entity_type in ["individual", "trust"] and
        gross_gain > 0
    )
    
    # Calculate discount
    discount_amount = gross_gain * 0.5 if eligible_for_discount else 0
    net_capital_gain = max(0, gross_gain - discount_amount)
    
    # Determine tax rate based on entity type
    if entity_type == "company":
        tax_rate = CGT_RATES["company"]
    elif entity_type == "smsf_accumulation":
        tax_rate = CGT_RATES["smsf_accumulation"]
    elif entity_type == "smsf_pension":
        tax_rate = CGT_RATES["smsf_pension"]
    elif entity_type == "trust":
        tax_rate = CGT_RATES["trust"]
    else:
        # Individual - use marginal rate based on income
        if taxable_income <= 18200:
            tax_rate = 0
        elif taxable_income <= 45000:
            tax_rate = 0.19
        elif taxable_income <= 120000:
            tax_rate = 0.325
        elif taxable_income <= 180000:
            tax_rate = 0.37
        else:
            tax_rate = 0.45
    
    # Calculate estimated tax
    estimated_tax = net_capital_gain * tax_rate if gross_gain > 0 else 0
    
    return {
        "units_sold": units,
        "cost_base_per_unit": cost_base,
        "sale_price_per_unit": sale_price,
        "total_cost_base": round(total_cost, 2),
        "total_proceeds": round(total_proceeds, 2),
        "purchase_date": purchase_date,
        "sale_date": sale_dt.strftime("%Y-%m-%d"),
        "holding_period_days": holding_days,
        "holding_period_months": round(holding_days / 30.44, 1),
        "eligible_for_discount": eligible_for_discount,
        "gross_capital_gain": round(gross_gain, 2),
        "is_capital_loss": gross_gain < 0,
        "discount_applied": discount_amount if eligible_for_discount else 0,
        "discount_percentage": 50 if eligible_for_discount else 0,
        "net_capital_gain": round(net_capital_gain, 2),
        "entity_type": entity_type,
        "marginal_tax_rate": tax_rate,
        "estimated_cgt_liability": round(estimated_tax, 2),
        "effective_tax_rate": round((estimated_tax / gross_gain * 100), 2) if gross_gain > 0 else 0
    }


@router.get("/holdings/{client_id}")
async def get_client_holdings(client_id: str):
    """Get all holdings for a client with current valuations and unrealized gains."""
    if client_id not in CLIENT_HOLDINGS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_HOLDINGS[client_id]
    holdings_with_analysis = []
    total_value = 0
    total_cost = 0
    total_unrealized_gain = 0
    
    for holding in client["holdings"]:
        current_value = holding["units"] * holding["current_price"]
        cost_base = holding["units"] * holding["avg_cost"]
        unrealized_gain = current_value - cost_base
        unrealized_gain_pct = (unrealized_gain / cost_base * 100) if cost_base > 0 else 0
        
        # Calculate days held
        purchase_dt = datetime.strptime(holding["purchase_date"], "%Y-%m-%d")
        days_held = (datetime.now() - purchase_dt).days
        
        holdings_with_analysis.append({
            **holding,
            "current_value": round(current_value, 2),
            "cost_base_total": round(cost_base, 2),
            "unrealized_gain": round(unrealized_gain, 2),
            "unrealized_gain_pct": round(unrealized_gain_pct, 2),
            "days_held": days_held,
            "eligible_for_cgt_discount": days_held >= CGT_DISCOUNT_THRESHOLD_DAYS,
            "is_loss": unrealized_gain < 0
        })
        
        total_value += current_value
        total_cost += cost_base
        total_unrealized_gain += unrealized_gain
    
    return {
        "client_id": client_id,
        "client_name": client["name"],
        "entity_type": client["entity_type"],
        "holdings": holdings_with_analysis,
        "summary": {
            "total_value": round(total_value, 2),
            "total_cost_base": round(total_cost, 2),
            "total_unrealized_gain": round(total_unrealized_gain, 2),
            "total_unrealized_gain_pct": round((total_unrealized_gain / total_cost * 100) if total_cost > 0 else 0, 2),
            "holdings_count": len(client["holdings"]),
            "gains_count": len([h for h in holdings_with_analysis if h["unrealized_gain"] > 0]),
            "losses_count": len([h for h in holdings_with_analysis if h["unrealized_gain"] < 0])
        }
    }


@router.get("/holding/{client_id}/{symbol}")
async def get_holding_detail(client_id: str, symbol: str):
    """Get detailed information about a specific holding."""
    if client_id not in CLIENT_HOLDINGS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_HOLDINGS[client_id]
    holding = next((h for h in client["holdings"] if h["symbol"] == symbol), None)
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    current_value = holding["units"] * holding["current_price"]
    cost_base = holding["units"] * holding["avg_cost"]
    unrealized_gain = current_value - cost_base
    
    # Calculate CGT preview if sold today
    cgt_preview = calculate_cgt(
        units=holding["units"],
        cost_base=holding["avg_cost"],
        sale_price=holding["current_price"],
        purchase_date=holding["purchase_date"],
        entity_type=client["entity_type"],
        taxable_income=client["taxable_income"]
    )
    
    return {
        "client_id": client_id,
        "client_name": client["name"],
        "holding": {
            **holding,
            "current_value": round(current_value, 2),
            "cost_base_total": round(cost_base, 2),
            "unrealized_gain": round(unrealized_gain, 2)
        },
        "cgt_preview_if_sold_today": cgt_preview
    }


@router.post("/calculate-cgt")
async def calculate_cgt_preview(
    client_id: str,
    symbol: str,
    units_to_sell: int
):
    """Calculate CGT impact for selling a specific number of units."""
    if client_id not in CLIENT_HOLDINGS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_HOLDINGS[client_id]
    holding = next((h for h in client["holdings"] if h["symbol"] == symbol), None)
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    if units_to_sell > holding["units"]:
        raise HTTPException(status_code=400, detail=f"Cannot sell {units_to_sell} units. Only {holding['units']} available.")
    
    cgt_calc = calculate_cgt(
        units=units_to_sell,
        cost_base=holding["avg_cost"],
        sale_price=holding["current_price"],
        purchase_date=holding["purchase_date"],
        entity_type=client["entity_type"],
        taxable_income=client["taxable_income"]
    )
    
    return {
        "client_id": client_id,
        "client_name": client["name"],
        "symbol": symbol,
        "holding_name": holding["name"],
        "cgt_calculation": cgt_calc,
        "recommendation": get_cgt_recommendation(cgt_calc)
    }


def get_cgt_recommendation(cgt_calc: Dict) -> Dict:
    """Generate recommendation based on CGT calculation."""
    recommendations = []
    
    if cgt_calc["is_capital_loss"]:
        recommendations.append({
            "type": "tax_loss_harvesting",
            "message": f"This sale would realize a capital loss of ${abs(cgt_calc['gross_capital_gain']):,.2f}",
            "benefit": "Can offset against capital gains this financial year",
            "priority": "high" if abs(cgt_calc["gross_capital_gain"]) > 10000 else "medium"
        })
    elif cgt_calc["eligible_for_discount"]:
        recommendations.append({
            "type": "cgt_discount",
            "message": f"50% CGT discount applies (held > 12 months)",
            "benefit": f"Saves ${cgt_calc['discount_applied']:,.2f} in tax",
            "priority": "info"
        })
    elif cgt_calc["holding_period_days"] < CGT_DISCOUNT_THRESHOLD_DAYS:
        days_until_discount = CGT_DISCOUNT_THRESHOLD_DAYS - cgt_calc["holding_period_days"]
        recommendations.append({
            "type": "wait_for_discount",
            "message": f"Wait {days_until_discount} more days to qualify for 50% CGT discount",
            "benefit": f"Could save ~${cgt_calc['gross_capital_gain'] * 0.5 * cgt_calc['marginal_tax_rate']:,.2f} in tax",
            "priority": "high" if cgt_calc["gross_capital_gain"] > 20000 else "medium"
        })
    
    return {
        "recommendations": recommendations,
        "summary": "Loss - consider harvesting" if cgt_calc["is_capital_loss"] else 
                   "Discount applies" if cgt_calc["eligible_for_discount"] else
                   f"Wait {CGT_DISCOUNT_THRESHOLD_DAYS - cgt_calc['holding_period_days']} days for discount"
    }


@router.post("/order/preview")
async def preview_order(order: OrderRequest):
    """Preview an order before execution with full cost and CGT analysis."""
    if order.client_id not in CLIENT_HOLDINGS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_HOLDINGS[order.client_id]
    
    if order.side == "sell":
        holding = next((h for h in client["holdings"] if h["symbol"] == order.symbol), None)
        if not holding:
            raise HTTPException(status_code=404, detail="Holding not found")
        if order.units > holding["units"]:
            raise HTTPException(status_code=400, detail=f"Insufficient units. Available: {holding['units']}")
        
        price = order.limit_price or holding["current_price"]
        proceeds = order.units * price
        
        # Calculate CGT
        cgt_calc = calculate_cgt(
            units=order.units,
            cost_base=holding["avg_cost"],
            sale_price=price,
            purchase_date=holding["purchase_date"],
            entity_type=client["entity_type"],
            taxable_income=client["taxable_income"]
        )
        
        # Calculate fees
        broker = BROKER_CONNECTIONS["selfwealth"]
        fees = max(broker["fees"]["flat"], proceeds * broker["fees"]["percent"])
        
        return {
            "order_preview": {
                "client_id": order.client_id,
                "client_name": client["name"],
                "side": "SELL",
                "symbol": order.symbol,
                "name": holding["name"],
                "units": order.units,
                "price": price,
                "gross_proceeds": round(proceeds, 2),
                "brokerage_fee": round(fees, 2),
                "net_proceeds": round(proceeds - fees, 2)
            },
            "cgt_impact": cgt_calc,
            "recommendation": get_cgt_recommendation(cgt_calc),
            "remaining_holding": {
                "units": holding["units"] - order.units,
                "value": round((holding["units"] - order.units) * holding["current_price"], 2)
            }
        }
    else:
        # Buy order
        price = order.limit_price or 100  # Would get from market data
        cost = order.units * price
        broker = BROKER_CONNECTIONS["selfwealth"]
        fees = max(broker["fees"]["flat"], cost * broker["fees"]["percent"])
        
        return {
            "order_preview": {
                "client_id": order.client_id,
                "client_name": client["name"],
                "side": "BUY",
                "symbol": order.symbol,
                "units": order.units,
                "price": price,
                "gross_cost": round(cost, 2),
                "brokerage_fee": round(fees, 2),
                "total_cost": round(cost + fees, 2)
            },
            "cgt_impact": None,
            "note": "New purchase - CGT will apply when sold"
        }


@router.post("/order/execute")
async def execute_order(order: OrderRequest, background_tasks: BackgroundTasks):
    """Execute a stock order (DEMO MODE - no real trades)."""
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    
    # Get preview first
    preview = await preview_order(order)
    
    executed_order = {
        "order_id": order_id,
        "status": "executed",
        "execution_time": datetime.now(timezone.utc).isoformat(),
        "demo_mode": True,
        **preview["order_preview"],
        "cgt_impact": preview.get("cgt_impact"),
        "confirmation": f"Order {order_id} executed successfully (DEMO MODE)"
    }
    
    EXECUTED_ORDERS.append(executed_order)
    
    return {
        "success": True,
        "order": executed_order,
        "demo_mode_notice": "This is a simulated trade. No real money was used.",
        "next_steps": [
            "In production, this would execute via broker API",
            "CGT event would be recorded for tax reporting",
            "Portfolio would be updated automatically"
        ]
    }


@router.get("/orders/{client_id}")
async def get_client_orders(client_id: str):
    """Get order history for a client."""
    client_orders = [o for o in EXECUTED_ORDERS if o.get("client_id") == client_id]
    
    return {
        "client_id": client_id,
        "orders": client_orders,
        "total_orders": len(client_orders),
        "demo_mode": True
    }


@router.get("/brokers")
async def get_available_brokers():
    """Get list of available broker integrations."""
    return {
        "brokers": [
            {
                "id": key,
                **value,
                "integration_status": "Available for integration"
            }
            for key, value in BROKER_CONNECTIONS.items()
        ],
        "note": "All brokers currently in demo mode. Production integration requires API credentials."
    }


@router.post("/increase-holding")
async def increase_holding(
    client_id: str,
    symbol: str,
    additional_units: int,
    purchase_price: float
):
    """Add to an existing holding (buy more shares)."""
    if client_id not in CLIENT_HOLDINGS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_HOLDINGS[client_id]
    holding = next((h for h in client["holdings"] if h["symbol"] == symbol), None)
    
    if not holding:
        # Create new holding
        new_holding = {
            "symbol": symbol,
            "name": f"New Holding - {symbol}",
            "units": additional_units,
            "avg_cost": purchase_price,
            "current_price": purchase_price,
            "purchase_date": datetime.now().strftime("%Y-%m-%d"),
            "sector": "Unknown"
        }
        client["holdings"].append(new_holding)
        
        return {
            "success": True,
            "action": "new_holding_created",
            "holding": new_holding,
            "cgt_note": "New holding created. CGT will apply when sold based on this purchase date and price."
        }
    
    # Calculate new weighted average cost
    existing_value = holding["units"] * holding["avg_cost"]
    new_value = additional_units * purchase_price
    total_units = holding["units"] + additional_units
    new_avg_cost = (existing_value + new_value) / total_units
    
    # Update holding (in real system, this would go to database)
    old_avg_cost = holding["avg_cost"]
    holding["units"] = total_units
    holding["avg_cost"] = round(new_avg_cost, 4)
    
    return {
        "success": True,
        "action": "holding_increased",
        "symbol": symbol,
        "name": holding["name"],
        "previous_units": total_units - additional_units,
        "additional_units": additional_units,
        "new_total_units": total_units,
        "previous_avg_cost": old_avg_cost,
        "purchase_price": purchase_price,
        "new_avg_cost": round(new_avg_cost, 4),
        "total_value": round(total_units * holding["current_price"], 2),
        "cgt_note": "Average cost base updated. Original purchase date retained for CGT discount eligibility.",
        "demo_mode": True
    }


@router.post("/decrease-holding")
async def decrease_holding(
    client_id: str,
    symbol: str,
    units_to_sell: int,
    sale_price: Optional[float] = None
):
    """Reduce a holding (sell shares) with CGT calculation."""
    if client_id not in CLIENT_HOLDINGS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_HOLDINGS[client_id]
    holding = next((h for h in client["holdings"] if h["symbol"] == symbol), None)
    
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    
    if units_to_sell > holding["units"]:
        raise HTTPException(status_code=400, detail=f"Cannot sell {units_to_sell} units. Only {holding['units']} available.")
    
    # Use current price if no sale price provided
    price = sale_price or holding["current_price"]
    
    # Calculate CGT
    cgt_calc = calculate_cgt(
        units=units_to_sell,
        cost_base=holding["avg_cost"],
        sale_price=price,
        purchase_date=holding["purchase_date"],
        entity_type=client["entity_type"],
        taxable_income=client["taxable_income"]
    )
    
    # Calculate brokerage
    proceeds = units_to_sell * price
    broker = BROKER_CONNECTIONS["selfwealth"]
    fees = max(broker["fees"]["flat"], proceeds * broker["fees"]["percent"])
    
    # Update holding
    remaining_units = holding["units"] - units_to_sell
    
    result = {
        "success": True,
        "action": "holding_decreased",
        "symbol": symbol,
        "name": holding["name"],
        "units_sold": units_to_sell,
        "sale_price": price,
        "gross_proceeds": round(proceeds, 2),
        "brokerage_fee": round(fees, 2),
        "net_proceeds": round(proceeds - fees, 2),
        "remaining_units": remaining_units,
        "remaining_value": round(remaining_units * holding["current_price"], 2) if remaining_units > 0 else 0,
        "cgt_event": cgt_calc,
        "tax_summary": {
            "gross_capital_gain": cgt_calc["gross_capital_gain"],
            "cgt_discount_applied": cgt_calc["eligible_for_discount"],
            "net_capital_gain": cgt_calc["net_capital_gain"],
            "estimated_tax": cgt_calc["estimated_cgt_liability"]
        },
        "demo_mode": True
    }
    
    # Remove holding if fully sold
    if remaining_units == 0:
        client["holdings"] = [h for h in client["holdings"] if h["symbol"] != symbol]
        result["holding_status"] = "fully_liquidated"
    else:
        holding["units"] = remaining_units
        result["holding_status"] = "partially_sold"
    
    return result


@router.get("/cgt-summary/{client_id}")
async def get_cgt_summary(client_id: str):
    """Get CGT summary for the financial year."""
    if client_id not in CLIENT_HOLDINGS:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = CLIENT_HOLDINGS[client_id]
    
    # Calculate unrealized gains/losses
    unrealized_gains = 0
    unrealized_losses = 0
    discount_eligible_gains = 0
    
    for holding in client["holdings"]:
        gain = (holding["current_price"] - holding["avg_cost"]) * holding["units"]
        purchase_dt = datetime.strptime(holding["purchase_date"], "%Y-%m-%d")
        days_held = (datetime.now() - purchase_dt).days
        
        if gain > 0:
            unrealized_gains += gain
            if days_held >= CGT_DISCOUNT_THRESHOLD_DAYS:
                discount_eligible_gains += gain
        else:
            unrealized_losses += abs(gain)
    
    # Mock realized gains from executed orders
    realized_gains = sum(
        o.get("cgt_impact", {}).get("net_capital_gain", 0) 
        for o in EXECUTED_ORDERS 
        if o.get("client_id") == client_id
    )
    
    return {
        "client_id": client_id,
        "client_name": client["name"],
        "entity_type": client["entity_type"],
        "financial_year": "2024-25",
        "unrealized": {
            "total_gains": round(unrealized_gains, 2),
            "total_losses": round(unrealized_losses, 2),
            "net_position": round(unrealized_gains - unrealized_losses, 2),
            "discount_eligible_gains": round(discount_eligible_gains, 2)
        },
        "realized": {
            "total_gains": round(realized_gains, 2),
            "total_losses": 0,  # Would track from actual sales
            "net_capital_gain": round(realized_gains, 2)
        },
        "tax_planning_opportunities": [
            {
                "type": "tax_loss_harvesting",
                "available_losses": round(unrealized_losses, 2),
                "potential_offset": round(min(unrealized_losses, unrealized_gains) * 0.45, 2),
                "description": "Harvest losses to offset gains"
            },
            {
                "type": "cgt_discount",
                "eligible_amount": round(discount_eligible_gains, 2),
                "discount_value": round(discount_eligible_gains * 0.5, 2),
                "description": "Holdings eligible for 50% CGT discount"
            }
        ]
    }
