"""
Real-Time Data Layer - Live Financial Data Infrastructure
Provides continuous data synchronization, real-time insights, and single source of truth.
Ready for custodian API integration when keys are available.
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging
import asyncio
import secrets
_rng = secrets.SystemRandom()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/realtime-data", tags=["Real-Time Data"])


class DataSourceType(str, Enum):
    CUSTODIAN = "custodian"
    MARKET_DATA = "market_data"
    PORTFOLIO = "portfolio"
    TRANSACTIONS = "transactions"
    CRM = "crm"


class SyncStatus(str, Enum):
    CONNECTED = "connected"
    SYNCING = "syncing"
    ERROR = "error"
    DISCONNECTED = "disconnected"
    DEMO_MODE = "demo_mode"


# In-memory data store (single source of truth)
LIVE_DATA_STORE = {
    "portfolios": {},
    "transactions": {},
    "market_data": {},
    "sync_status": {},
    "last_updates": {}
}

# WebSocket connections for real-time updates
ACTIVE_CONNECTIONS: List[WebSocket] = []

# Demo market data
DEMO_MARKET_DATA = {
    "AAPL": {"price": 182.30, "change": 1.2, "volume": 45000000},
    "MSFT": {"price": 395.80, "change": 0.8, "volume": 22000000},
    "GOOGL": {"price": 138.50, "change": -0.5, "volume": 18000000},
    "NVDA": {"price": 1200.00, "change": 2.1, "volume": 35000000},
    "META": {"price": 580.00, "change": 1.5, "volume": 12000000},
    "AMZN": {"price": 200.00, "change": 0.3, "volume": 28000000},
    "TSLA": {"price": 175.00, "change": -1.2, "volume": 55000000},
    "BRK.B": {"price": 450.00, "change": 0.2, "volume": 3000000},
    "JPM": {"price": 205.00, "change": 0.9, "volume": 8000000},
    "V": {"price": 295.00, "change": 0.6, "volume": 6000000},
}

# Demo portfolio data
DEMO_PORTFOLIOS = {
    "client_001": {
        "client_id": "client_001",
        "client_name": "Wheeler Family",
        "total_value": 2920000,
        "cash": 145000,
        "holdings": [
            {"symbol": "AAPL", "shares": 500, "avg_cost": 150.00, "current_price": 182.30, "market_value": 91150, "unrealized_pnl": 16150},
            {"symbol": "MSFT", "shares": 300, "avg_cost": 350.00, "current_price": 395.80, "market_value": 118740, "unrealized_pnl": 13740},
            {"symbol": "NVDA", "shares": 150, "avg_cost": 800.00, "current_price": 1200.00, "market_value": 180000, "unrealized_pnl": 60000},
            {"symbol": "GOOGL", "shares": 200, "avg_cost": 145.00, "current_price": 138.50, "market_value": 27700, "unrealized_pnl": -1300},
        ],
        "last_updated": datetime.now(timezone.utc).isoformat()
    },
    "client_002": {
        "client_id": "client_002",
        "client_name": "Chen Investment Trust",
        "total_value": 4200000,
        "cash": 210000,
        "holdings": [
            {"symbol": "AAPL", "shares": 800, "avg_cost": 155.00, "current_price": 182.30, "market_value": 145840, "unrealized_pnl": 21840},
            {"symbol": "MSFT", "shares": 500, "avg_cost": 360.00, "current_price": 395.80, "market_value": 197900, "unrealized_pnl": 17900},
            {"symbol": "NVDA", "shares": 400, "avg_cost": 850.00, "current_price": 1200.00, "market_value": 480000, "unrealized_pnl": 140000},
            {"symbol": "META", "shares": 200, "avg_cost": 400.00, "current_price": 580.00, "market_value": 116000, "unrealized_pnl": 36000},
        ],
        "last_updated": datetime.now(timezone.utc).isoformat()
    },
    "client_003": {
        "client_id": "client_003",
        "client_name": "Thompson SMSF",
        "total_value": 890000,
        "cash": 89000,
        "holdings": [
            {"symbol": "BRK.B", "shares": 100, "avg_cost": 420.00, "current_price": 450.00, "market_value": 45000, "unrealized_pnl": 3000},
            {"symbol": "JPM", "shares": 150, "avg_cost": 180.00, "current_price": 205.00, "market_value": 30750, "unrealized_pnl": 3750},
            {"symbol": "V", "shares": 100, "avg_cost": 270.00, "current_price": 295.00, "market_value": 29500, "unrealized_pnl": 2500},
        ],
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
}

# Demo transaction history
DEMO_TRANSACTIONS = {
    "client_001": [
        {"tx_id": "tx_001", "date": "2025-12-16", "type": "dividend", "symbol": "AAPL", "amount": 245.00, "description": "Q4 Dividend"},
        {"tx_id": "tx_002", "date": "2025-12-14", "type": "buy", "symbol": "MSFT", "shares": 10, "price": 390.00, "amount": -3900.00},
        {"tx_id": "tx_003", "date": "2025-12-10", "type": "sell", "symbol": "GOOGL", "shares": 20, "price": 140.00, "amount": 2800.00},
        {"tx_id": "tx_004", "date": "2025-12-05", "type": "contribution", "amount": 5000.00, "description": "Monthly contribution"},
    ]
}


# Initialize demo data
def initialize_demo_data():
    """Initialize the data store with demo data."""
    LIVE_DATA_STORE["portfolios"] = DEMO_PORTFOLIOS.copy()
    LIVE_DATA_STORE["market_data"] = DEMO_MARKET_DATA.copy()
    LIVE_DATA_STORE["transactions"] = DEMO_TRANSACTIONS.copy()
    LIVE_DATA_STORE["sync_status"] = {
        "custodian": SyncStatus.DEMO_MODE,
        "market_data": SyncStatus.DEMO_MODE,
        "portfolio": SyncStatus.DEMO_MODE
    }
    LIVE_DATA_STORE["last_updates"] = {
        "portfolios": datetime.now(timezone.utc).isoformat(),
        "market_data": datetime.now(timezone.utc).isoformat(),
        "transactions": datetime.now(timezone.utc).isoformat()
    }

initialize_demo_data()


async def simulate_price_update():
    """Simulate real-time price updates."""
    for symbol, data in LIVE_DATA_STORE["market_data"].items():
        # Random price movement (-1% to +1%)
        change_pct = _rng.uniform(-0.01, 0.01)
        new_price = data["price"] * (1 + change_pct)
        data["price"] = round(new_price, 2)
        data["change"] = round(change_pct * 100, 2)
    
    LIVE_DATA_STORE["last_updates"]["market_data"] = datetime.now(timezone.utc).isoformat()


async def update_portfolio_values():
    """Update portfolio values based on current market prices."""
    market_data = LIVE_DATA_STORE["market_data"]
    
    for client_id, portfolio in LIVE_DATA_STORE["portfolios"].items():
        total_holdings_value = 0
        for holding in portfolio["holdings"]:
            symbol = holding["symbol"]
            if symbol in market_data:
                current_price = market_data[symbol]["price"]
                holding["current_price"] = current_price
                holding["market_value"] = round(holding["shares"] * current_price, 2)
                holding["unrealized_pnl"] = round(holding["market_value"] - (holding["shares"] * holding["avg_cost"]), 2)
                total_holdings_value += holding["market_value"]
        
        portfolio["total_value"] = round(total_holdings_value + portfolio["cash"], 2)
        portfolio["last_updated"] = datetime.now(timezone.utc).isoformat()
    
    LIVE_DATA_STORE["last_updates"]["portfolios"] = datetime.now(timezone.utc).isoformat()


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def get_sync_status():
    """Get real-time data synchronization status."""
    return {
        "status": "operational",
        "mode": "demo",
        "data_sources": {
            "custodian": {
                "status": LIVE_DATA_STORE["sync_status"].get("custodian", SyncStatus.DISCONNECTED),
                "last_sync": LIVE_DATA_STORE["last_updates"].get("portfolios"),
                "ready_for_integration": True,
                "integration_type": "Alpaca, Interactive Brokers, DriveWealth"
            },
            "market_data": {
                "status": LIVE_DATA_STORE["sync_status"].get("market_data", SyncStatus.DISCONNECTED),
                "last_sync": LIVE_DATA_STORE["last_updates"].get("market_data"),
                "symbols_tracked": len(LIVE_DATA_STORE["market_data"])
            },
            "portfolio": {
                "status": LIVE_DATA_STORE["sync_status"].get("portfolio", SyncStatus.DISCONNECTED),
                "clients_tracked": len(LIVE_DATA_STORE["portfolios"])
            }
        },
        "single_source_of_truth": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/portfolios")
async def get_all_portfolios():
    """Get all portfolios from the single source of truth."""
    await update_portfolio_values()
    
    portfolios = list(LIVE_DATA_STORE["portfolios"].values())
    total_aum = sum(p["total_value"] for p in portfolios)
    total_unrealized = sum(
        sum(h["unrealized_pnl"] for h in p["holdings"])
        for p in portfolios
    )
    
    return {
        "portfolios": portfolios,
        "summary": {
            "total_clients": len(portfolios),
            "total_aum": total_aum,
            "total_unrealized_pnl": total_unrealized
        },
        "last_updated": LIVE_DATA_STORE["last_updates"]["portfolios"],
        "data_source": "demo"
    }


@router.get("/portfolios/{client_id}")
async def get_portfolio(client_id: str):
    """Get a specific client's portfolio."""
    await update_portfolio_values()
    
    portfolio = LIVE_DATA_STORE["portfolios"].get(client_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    return {
        "portfolio": portfolio,
        "last_updated": portfolio["last_updated"],
        "data_source": "demo"
    }


@router.get("/market-data")
async def get_market_data():
    """Get current market data."""
    await simulate_price_update()
    
    return {
        "prices": LIVE_DATA_STORE["market_data"],
        "last_updated": LIVE_DATA_STORE["last_updates"]["market_data"],
        "data_source": "demo"
    }


@router.get("/market-data/{symbol}")
async def get_symbol_data(symbol: str):
    """Get market data for a specific symbol."""
    symbol = symbol.upper()
    data = LIVE_DATA_STORE["market_data"].get(symbol)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    
    return {
        "symbol": symbol,
        **data,
        "last_updated": LIVE_DATA_STORE["last_updates"]["market_data"]
    }


@router.get("/transactions/{client_id}")
async def get_transactions(client_id: str, limit: int = 50):
    """Get transactions for a client."""
    transactions = LIVE_DATA_STORE["transactions"].get(client_id, [])
    
    return {
        "client_id": client_id,
        "transactions": transactions[:limit],
        "total": len(transactions),
        "last_updated": LIVE_DATA_STORE["last_updates"]["transactions"]
    }


@router.post("/refresh")
async def refresh_all_data():
    """Force refresh all data (simulates custodian sync)."""
    await simulate_price_update()
    await update_portfolio_values()
    
    return {
        "success": True,
        "message": "All data refreshed from source",
        "updated": {
            "market_data": True,
            "portfolios": True,
            "transactions": False  # Would come from custodian
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/execute-trade")
async def execute_trade(
    client_id: str,
    symbol: str,
    action: str,  # "buy" or "sell"
    shares: int,
    reason: str = ""
):
    """
    Execute a trade and update the single source of truth.
    This closes the loop: Insight → Decision → Action → Execution → Update
    """
    symbol = symbol.upper()
    now = datetime.now(timezone.utc)
    
    # Get current portfolio
    portfolio = LIVE_DATA_STORE["portfolios"].get(client_id)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get current price
    market_data = LIVE_DATA_STORE["market_data"].get(symbol)
    if not market_data:
        raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
    
    current_price = market_data["price"]
    trade_value = shares * current_price
    
    # Execute trade
    trade_id = f"trade_{uuid.uuid4().hex[:8]}"
    
    if action.lower() == "buy":
        if trade_value > portfolio["cash"]:
            raise HTTPException(status_code=400, detail="Insufficient cash")
        
        # Update cash
        portfolio["cash"] -= trade_value
        
        # Update or add holding
        existing = next((h for h in portfolio["holdings"] if h["symbol"] == symbol), None)
        if existing:
            total_cost = (existing["shares"] * existing["avg_cost"]) + trade_value
            existing["shares"] += shares
            existing["avg_cost"] = total_cost / existing["shares"]
        else:
            portfolio["holdings"].append({
                "symbol": symbol,
                "shares": shares,
                "avg_cost": current_price,
                "current_price": current_price,
                "market_value": trade_value,
                "unrealized_pnl": 0
            })
        
        tx_amount = -trade_value
        
    elif action.lower() == "sell":
        existing = next((h for h in portfolio["holdings"] if h["symbol"] == symbol), None)
        if not existing or existing["shares"] < shares:
            raise HTTPException(status_code=400, detail="Insufficient shares")
        
        # Update cash
        portfolio["cash"] += trade_value
        
        # Update holding
        existing["shares"] -= shares
        if existing["shares"] == 0:
            portfolio["holdings"].remove(existing)
        
        tx_amount = trade_value
        
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'buy' or 'sell'")
    
    # Record transaction
    transaction = {
        "tx_id": trade_id,
        "date": now.strftime("%Y-%m-%d"),
        "type": action.lower(),
        "symbol": symbol,
        "shares": shares,
        "price": current_price,
        "amount": tx_amount,
        "reason": reason
    }
    
    if client_id not in LIVE_DATA_STORE["transactions"]:
        LIVE_DATA_STORE["transactions"][client_id] = []
    LIVE_DATA_STORE["transactions"][client_id].insert(0, transaction)
    
    # Update portfolio value
    await update_portfolio_values()
    
    return {
        "success": True,
        "trade_id": trade_id,
        "execution": {
            "action": action.lower(),
            "symbol": symbol,
            "shares": shares,
            "price": current_price,
            "value": trade_value
        },
        "portfolio_updated": True,
        "new_portfolio_value": portfolio["total_value"],
        "new_cash_balance": portfolio["cash"],
        "timestamp": now.isoformat(),
        "message": f"Trade executed and portfolio updated in real-time"
    }


@router.get("/insights/drift")
async def get_portfolio_drift():
    """Get real-time portfolio drift analysis."""
    await update_portfolio_values()
    
    drift_analysis = []
    
    # Target allocation (simplified)
    target = {"tech": 30, "finance": 20, "other": 50}
    tech_symbols = ["AAPL", "MSFT", "GOOGL", "NVDA", "META", "AMZN", "TSLA"]
    finance_symbols = ["JPM", "V", "BRK.B"]
    
    for client_id, portfolio in LIVE_DATA_STORE["portfolios"].items():
        total_value = portfolio["total_value"]
        
        tech_value = sum(h["market_value"] for h in portfolio["holdings"] if h["symbol"] in tech_symbols)
        finance_value = sum(h["market_value"] for h in portfolio["holdings"] if h["symbol"] in finance_symbols)
        
        tech_pct = (tech_value / total_value * 100) if total_value > 0 else 0
        finance_pct = (finance_value / total_value * 100) if total_value > 0 else 0
        
        tech_drift = tech_pct - target["tech"]
        
        if abs(tech_drift) > 5:
            drift_analysis.append({
                "client_id": client_id,
                "client_name": portfolio["client_name"],
                "total_value": total_value,
                "sector_allocation": {
                    "tech": round(tech_pct, 1),
                    "finance": round(finance_pct, 1)
                },
                "drift": {
                    "tech": round(tech_drift, 1)
                },
                "requires_rebalance": abs(tech_drift) > 10,
                "priority": "high" if abs(tech_drift) > 10 else "medium"
            })
    
    return {
        "drift_analysis": drift_analysis,
        "clients_with_drift": len(drift_analysis),
        "high_priority": len([d for d in drift_analysis if d["priority"] == "high"]),
        "target_allocation": target,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time data streaming."""
    await websocket.accept()
    ACTIVE_CONNECTIONS.append(websocket)
    
    try:
        while True:
            # Simulate real-time updates
            await simulate_price_update()
            await update_portfolio_values()
            
            # Send update
            await websocket.send_json({
                "type": "market_update",
                "data": LIVE_DATA_STORE["market_data"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            await asyncio.sleep(5)  # Update every 5 seconds
            
    except WebSocketDisconnect:
        ACTIVE_CONNECTIONS.remove(websocket)


@router.get("/integration-status")
async def get_integration_status():
    """Get status of available integrations."""
    return {
        "available_integrations": {
            "alpaca": {
                "status": "sdk_installed",
                "ready": True,
                "requires": "ALPACA_API_KEY, ALPACA_SECRET_KEY",
                "capabilities": ["paper_trading", "live_trading", "market_data"]
            },
            "interactive_brokers": {
                "status": "not_configured",
                "ready": False,
                "requires": "IB Gateway or TWS, Client ID",
                "capabilities": ["trading", "market_data", "account_data"]
            },
            "yahoo_finance": {
                "status": "available",
                "ready": True,
                "requires": None,
                "capabilities": ["market_data", "historical_data"]
            }
        },
        "current_mode": "demo",
        "demo_data_available": True,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
