"""
FX Trading Integration
MetaTrader 5 / cTrader API integration for forex trading.
Multi-currency execution for international portfolios.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/fx", tags=["FX Trading"])


class FXPlatform(str, Enum):
    MT5 = "metatrader5"
    CTRADER = "ctrader"
    INTERNAL = "internal"


class FXOrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class FXOrderStatus(str, Enum):
    PENDING = "pending"
    EXECUTED = "executed"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


# Major currency pairs
FX_PAIRS = {
    "EUR/USD": {"bid": 1.0842, "ask": 1.0844, "spread": 0.0002, "pip_value": 10, "category": "major"},
    "GBP/USD": {"bid": 1.2685, "ask": 1.2688, "spread": 0.0003, "pip_value": 10, "category": "major"},
    "USD/JPY": {"bid": 149.52, "ask": 149.55, "spread": 0.03, "pip_value": 6.69, "category": "major"},
    "AUD/USD": {"bid": 0.6542, "ask": 0.6545, "spread": 0.0003, "pip_value": 10, "category": "major"},
    "USD/CHF": {"bid": 0.8825, "ask": 0.8828, "spread": 0.0003, "pip_value": 11.33, "category": "major"},
    "USD/CAD": {"bid": 1.3562, "ask": 1.3565, "spread": 0.0003, "pip_value": 7.37, "category": "major"},
    "NZD/USD": {"bid": 0.6125, "ask": 0.6128, "spread": 0.0003, "pip_value": 10, "category": "major"},
    
    # Crosses
    "EUR/GBP": {"bid": 0.8548, "ask": 0.8551, "spread": 0.0003, "pip_value": 12.68, "category": "cross"},
    "EUR/JPY": {"bid": 162.15, "ask": 162.20, "spread": 0.05, "pip_value": 6.69, "category": "cross"},
    "GBP/JPY": {"bid": 189.72, "ask": 189.78, "spread": 0.06, "pip_value": 6.69, "category": "cross"},
    "AUD/JPY": {"bid": 97.85, "ask": 97.90, "spread": 0.05, "pip_value": 6.69, "category": "cross"},
    "EUR/AUD": {"bid": 1.6568, "ask": 1.6573, "spread": 0.0005, "pip_value": 6.54, "category": "cross"},
    
    # Exotic
    "USD/SGD": {"bid": 1.3425, "ask": 1.3430, "spread": 0.0005, "pip_value": 7.45, "category": "exotic"},
    "USD/HKD": {"bid": 7.8125, "ask": 7.8135, "spread": 0.0010, "pip_value": 1.28, "category": "exotic"},
    "USD/CNH": {"bid": 7.2350, "ask": 7.2365, "spread": 0.0015, "pip_value": 1.38, "category": "exotic"},
}


# FX Account configurations
FX_ACCOUNTS = {
    "demo_mt5": {
        "account_id": "demo_mt5",
        "platform": FXPlatform.MT5,
        "broker": "IC Markets",
        "currency": "USD",
        "balance": 100000,
        "equity": 102500,
        "margin_used": 5000,
        "margin_free": 97500,
        "leverage": 100,
        "positions": [],
        "demo": True
    },
    "demo_ctrader": {
        "account_id": "demo_ctrader",
        "platform": FXPlatform.CTRADER,
        "broker": "Pepperstone",
        "currency": "USD",
        "balance": 50000,
        "equity": 51250,
        "margin_used": 2500,
        "margin_free": 48750,
        "leverage": 50,
        "positions": [],
        "demo": True
    }
}


# Client FX exposures
CLIENT_FX_EXPOSURES = {
    "client_1": {
        "client_id": "client_1",
        "base_currency": "AUD",
        "exposures": [
            {"currency": "USD", "amount": 230000, "percentage": 25},
            {"currency": "EUR", "amount": 50000, "percentage": 5.4},
            {"currency": "GBP", "amount": 25000, "percentage": 2.7}
        ],
        "hedging_strategy": "partial",
        "hedge_ratio": 50
    },
    "client_4": {
        "client_id": "client_4",
        "base_currency": "AUD",
        "exposures": [
            {"currency": "USD", "amount": 5725000, "percentage": 76.3},
            {"currency": "EUR", "amount": 150000, "percentage": 2.0},
            {"currency": "BTC", "amount": 318250, "percentage": 4.2}
        ],
        "hedging_strategy": "active",
        "hedge_ratio": 75
    }
}


# FX Orders storage
FX_ORDERS: Dict[str, Dict] = {}


class FXOrder(BaseModel):
    symbol: str
    side: str  # buy or sell
    volume: float  # In lots (1 lot = 100,000 units)
    order_type: FXOrderType = FXOrderType.MARKET
    limit_price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    account_id: str = "demo_mt5"


def simulate_fx_execution(order: FXOrder) -> Dict:
    """Simulate FX order execution."""
    if order.symbol not in FX_PAIRS:
        raise HTTPException(status_code=404, detail=f"FX pair {order.symbol} not found")
    
    pair = FX_PAIRS[order.symbol]
    
    # Determine execution price
    if order.side == "buy":
        price = pair["ask"]
    else:
        price = pair["bid"]
    
    # Calculate position value
    position_value = order.volume * 100000 * price  # 1 lot = 100,000 units
    
    # Calculate margin required (simplified)
    account = FX_ACCOUNTS.get(order.account_id, FX_ACCOUNTS["demo_mt5"])
    leverage = account.get("leverage", 100)
    margin_required = position_value / leverage
    
    # Commission (typical ECN)
    commission = order.volume * 7  # $7 per lot round-trip
    
    return {
        "execution_price": price,
        "position_value": round(position_value, 2),
        "margin_required": round(margin_required, 2),
        "commission": round(commission, 2),
        "spread_cost": round(order.volume * 100000 * pair["spread"], 2),
        "pip_value": pair["pip_value"] * order.volume
    }


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def get_fx_status():
    """Get FX trading status."""
    return {
        "status": "operational",
        "platforms": {
            "mt5": {
                "connected": False,
                "demo_available": True,
                "credentials_required": ["MT5_SERVER", "MT5_LOGIN", "MT5_PASSWORD"]
            },
            "ctrader": {
                "connected": False,
                "demo_available": True,
                "credentials_required": ["CTRADER_CLIENT_ID", "CTRADER_SECRET"]
            }
        },
        "pairs_available": len(FX_PAIRS),
        "demo_mode": True
    }


@router.get("/pairs")
async def get_fx_pairs(category: Optional[str] = None):
    """Get FX pairs with live quotes."""
    pairs = []
    
    for symbol, data in FX_PAIRS.items():
        if category and data["category"] != category:
            continue
        
        pairs.append({
            "symbol": symbol,
            **data,
            "mid": round((data["bid"] + data["ask"]) / 2, 5),
            "change_24h": round((data["bid"] - data["bid"] * 0.998) / (data["bid"] * 0.998) * 100, 2)  # Simulated
        })
    
    return {
        "pairs": pairs,
        "total": len(pairs),
        "categories": ["major", "cross", "exotic"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/pairs/{symbol}")
async def get_fx_pair(symbol: str):
    """Get specific FX pair details."""
    symbol = symbol.upper().replace("_", "/")
    
    if symbol not in FX_PAIRS:
        raise HTTPException(status_code=404, detail=f"FX pair {symbol} not found")
    
    data = FX_PAIRS[symbol]
    
    return {
        "symbol": symbol,
        **data,
        "mid": round((data["bid"] + data["ask"]) / 2, 5),
        "daily_range": {
            "high": round(data["ask"] * 1.005, 5),
            "low": round(data["bid"] * 0.995, 5)
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/accounts")
async def get_fx_accounts():
    """Get FX trading accounts."""
    return {
        "accounts": list(FX_ACCOUNTS.values())
    }


@router.get("/accounts/{account_id}")
async def get_fx_account(account_id: str):
    """Get specific FX account details."""
    if account_id not in FX_ACCOUNTS:
        raise HTTPException(status_code=404, detail="FX account not found")
    
    return FX_ACCOUNTS[account_id]


@router.post("/order")
async def place_fx_order(order: FXOrder):
    """Place an FX order."""
    execution = simulate_fx_execution(order)
    
    order_id = f"FX_{uuid.uuid4().hex[:8]}"
    
    fx_order = {
        "order_id": order_id,
        "symbol": order.symbol,
        "side": order.side,
        "volume": order.volume,
        "order_type": order.order_type,
        "execution_price": execution["execution_price"],
        "position_value": execution["position_value"],
        "margin_required": execution["margin_required"],
        "commission": execution["commission"],
        "spread_cost": execution["spread_cost"],
        "stop_loss": order.stop_loss,
        "take_profit": order.take_profit,
        "account_id": order.account_id,
        "status": FXOrderStatus.EXECUTED,
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "demo_mode": True
    }
    
    FX_ORDERS[order_id] = fx_order
    
    return {
        "success": True,
        "order": fx_order,
        "message": f"FX order executed: {order.side.upper()} {order.volume} lots {order.symbol} @ {execution['execution_price']}"
    }


@router.get("/orders")
async def get_fx_orders(account_id: Optional[str] = None, status: Optional[FXOrderStatus] = None):
    """Get FX order history."""
    orders = list(FX_ORDERS.values())
    
    if account_id:
        orders = [o for o in orders if o["account_id"] == account_id]
    if status:
        orders = [o for o in orders if o["status"] == status]
    
    return {
        "orders": orders,
        "total": len(orders)
    }


@router.get("/exposure/{client_id}")
async def get_client_fx_exposure(client_id: str):
    """Get client FX exposure analysis."""
    if client_id not in CLIENT_FX_EXPOSURES:
        return {
            "client_id": client_id,
            "has_fx_exposure": False,
            "exposures": []
        }
    
    exposure = CLIENT_FX_EXPOSURES[client_id]
    
    # Calculate hedge recommendations
    recommendations = []
    for exp in exposure["exposures"]:
        if exp["currency"] in ["USD", "EUR", "GBP"]:
            hedge_amount = exp["amount"] * exposure["hedge_ratio"] / 100
            pair = f"{exp['currency']}/{exposure['base_currency']}"
            if pair in FX_PAIRS or f"AUD/{exp['currency']}" in FX_PAIRS:
                recommendations.append({
                    "currency": exp["currency"],
                    "exposure": exp["amount"],
                    "recommended_hedge": round(hedge_amount, 2),
                    "hedge_instrument": f"{exp['currency']}/AUD forward" if exp["currency"] != "AUD" else None
                })
    
    return {
        "client_id": client_id,
        "base_currency": exposure["base_currency"],
        "has_fx_exposure": True,
        "exposures": exposure["exposures"],
        "hedging_strategy": exposure["hedging_strategy"],
        "hedge_ratio": exposure["hedge_ratio"],
        "recommendations": recommendations,
        "total_foreign_exposure": sum(e["amount"] for e in exposure["exposures"])
    }


@router.post("/hedge-preview")
async def preview_hedge(
    client_id: str,
    currency: str,
    amount: float,
    duration_months: int = 3
):
    """Preview a currency hedge."""
    # Find appropriate pair
    pair = f"{currency}/AUD"
    reverse_pair = f"AUD/{currency}"
    
    if pair in FX_PAIRS:
        quote = FX_PAIRS[pair]
        rate = quote["ask"]
    elif reverse_pair in FX_PAIRS:
        quote = FX_PAIRS[reverse_pair]
        rate = 1 / quote["bid"]
    else:
        raise HTTPException(status_code=404, detail=f"No FX pair available for {currency}/AUD")
    
    # Forward points (simplified - would come from real forward rates)
    forward_points = rate * 0.001 * duration_months  # ~10 pips per month
    forward_rate = rate + forward_points
    
    # Calculate hedge cost
    hedge_cost = amount * abs(forward_points / rate)
    
    return {
        "client_id": client_id,
        "currency_pair": f"{currency}/AUD",
        "amount_to_hedge": amount,
        "spot_rate": round(rate, 5),
        "forward_rate": round(forward_rate, 5),
        "forward_points": round(forward_points, 5),
        "duration_months": duration_months,
        "hedge_cost_aud": round(hedge_cost, 2),
        "hedge_cost_percent": round(hedge_cost / amount * 100, 3),
        "protected_value_aud": round(amount / forward_rate, 2),
        "recommendation": "Proceed" if hedge_cost / amount < 0.02 else "Review - cost exceeds 2%"
    }


@router.get("/market-hours")
async def get_market_hours():
    """Get FX market hours."""
    now = datetime.now(timezone.utc)
    
    sessions = {
        "sydney": {"open": "21:00", "close": "06:00", "status": "closed"},
        "tokyo": {"open": "00:00", "close": "09:00", "status": "closed"},
        "london": {"open": "08:00", "close": "17:00", "status": "closed"},
        "new_york": {"open": "13:00", "close": "22:00", "status": "closed"}
    }
    
    hour = now.hour
    
    # Determine active sessions (simplified)
    if 21 <= hour or hour < 6:
        sessions["sydney"]["status"] = "open"
    if 0 <= hour < 9:
        sessions["tokyo"]["status"] = "open"
    if 8 <= hour < 17:
        sessions["london"]["status"] = "open"
    if 13 <= hour < 22:
        sessions["new_york"]["status"] = "open"
    
    active_sessions = [s for s, d in sessions.items() if d["status"] == "open"]
    
    return {
        "current_time_utc": now.isoformat(),
        "market_open": len(active_sessions) > 0,
        "sessions": sessions,
        "active_sessions": active_sessions,
        "best_liquidity": "london_ny_overlap" if "london" in active_sessions and "new_york" in active_sessions else "normal"
    }
