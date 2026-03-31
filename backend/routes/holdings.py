"""
Holdings Management Routes
Advanced portfolio holdings editing for all asset types.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/holdings", tags=["Holdings Management"])

# In-memory storage for demonstration
PORTFOLIOS: Dict[str, Dict] = {}
TRANSACTIONS: List[Dict] = []


class HoldingBase(BaseModel):
    asset_type: str  # shares, etf, crypto, property, super, cash
    symbol: Optional[str] = None
    name: str
    units: float
    current_price: float
    cost_basis: float
    currency: str = "AUD"


class TransactionRequest(BaseModel):
    client_id: str
    asset_type: str
    symbol: Optional[str] = None
    name: str
    transaction_type: str  # buy, sell, dividend, contribution, withdrawal
    units: float
    price: float
    fees: float = 0
    notes: Optional[str] = None


class RebalanceRequest(BaseModel):
    client_id: str
    target_allocations: Dict[str, float]  # asset_class -> percentage


def get_client_portfolio(client_id: str) -> Dict:
    """Get or create client portfolio."""
    if client_id not in PORTFOLIOS:
        PORTFOLIOS[client_id] = generate_sample_portfolio(client_id)
    return PORTFOLIOS[client_id]


def generate_sample_portfolio(client_id: str) -> Dict:
    """Generate a sample portfolio for demonstration."""
    return {
        "client_id": client_id,
        "holdings": {
            "shares": [
                {"symbol": "CBA", "name": "Commonwealth Bank", "units": 200, "cost_basis": 98.50, "current_price": 118.50, "asset_class": "Australian Equities"},
                {"symbol": "BHP", "name": "BHP Group", "units": 300, "cost_basis": 45.20, "current_price": 42.80, "asset_class": "Australian Equities"},
                {"symbol": "CSL", "name": "CSL Limited", "units": 50, "cost_basis": 285.00, "current_price": 298.00, "asset_class": "Healthcare"},
                {"symbol": "WOW", "name": "Woolworths", "units": 150, "cost_basis": 36.50, "current_price": 31.20, "asset_class": "Consumer Staples"},
                {"symbol": "NAB", "name": "NAB", "units": 400, "cost_basis": 32.00, "current_price": 34.20, "asset_class": "Australian Equities"},
                {"symbol": "TLS", "name": "Telstra", "units": 1000, "cost_basis": 3.85, "current_price": 4.05, "asset_class": "Telecommunications"},
            ],
            "etfs": [
                {"symbol": "VAS", "name": "Vanguard Australian Shares", "units": 500, "cost_basis": 88.00, "current_price": 96.50, "asset_class": "Australian Equities"},
                {"symbol": "VGS", "name": "Vanguard Intl Shares", "units": 300, "cost_basis": 102.00, "current_price": 118.40, "asset_class": "International Equities"},
                {"symbol": "VDHG", "name": "Vanguard Diversified High Growth", "units": 200, "cost_basis": 62.00, "current_price": 68.50, "asset_class": "Diversified"},
                {"symbol": "IVV", "name": "iShares S&P 500", "units": 100, "cost_basis": 580.00, "current_price": 625.00, "asset_class": "US Equities"},
            ],
            "crypto": [
                {"symbol": "BTC", "name": "Bitcoin", "units": 0.5, "cost_basis": 45000.00, "current_price": 98500.00, "asset_class": "Cryptocurrency"},
                {"symbol": "ETH", "name": "Ethereum", "units": 5.0, "cost_basis": 2800.00, "current_price": 3450.00, "asset_class": "Cryptocurrency"},
            ],
            "property": [
                {"name": "Sydney Investment Unit", "units": 1, "cost_basis": 650000, "current_price": 850000, "address": "Unit 42, 150 Elizabeth St, Sydney", "asset_class": "Property"},
                {"name": "Melbourne Townhouse", "units": 1, "cost_basis": 580000, "current_price": 720000, "address": "15 Chapel St, South Yarra", "asset_class": "Property"},
            ],
            "super": [
                {"name": "Australian Super - Growth", "units": 1, "cost_basis": 450000, "current_price": 580000, "asset_class": "Superannuation"},
            ],
            "cash": [
                {"name": "Transaction Account", "units": 1, "cost_basis": 75000, "current_price": 75000, "institution": "CBA", "asset_class": "Cash"},
                {"name": "Term Deposit", "units": 1, "cost_basis": 150000, "current_price": 157500, "institution": "Westpac", "rate": 5.0, "maturity": "2025-06-15", "asset_class": "Cash"},
            ]
        },
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.get("/portfolio/{client_id}")
async def get_portfolio(client_id: str):
    """Get complete portfolio holdings for a client."""
    portfolio = get_client_portfolio(client_id)
    
    # Calculate totals
    total_value = 0
    total_cost = 0
    by_asset_class = {}
    
    for asset_type, holdings in portfolio["holdings"].items():
        for holding in holdings:
            value = holding["units"] * holding["current_price"]
            cost = holding["units"] * holding["cost_basis"]
            total_value += value
            total_cost += cost
            
            asset_class = holding.get("asset_class", "Other")
            if asset_class not in by_asset_class:
                by_asset_class[asset_class] = 0
            by_asset_class[asset_class] += value
    
    # Calculate allocation percentages
    allocation = {k: round((v / total_value) * 100, 2) for k, v in by_asset_class.items()} if total_value > 0 else {}
    
    return {
        "client_id": client_id,
        "holdings": portfolio["holdings"],
        "summary": {
            "total_value": round(total_value, 2),
            "total_cost": round(total_cost, 2),
            "total_gain_loss": round(total_value - total_cost, 2),
            "total_return_percent": round(((total_value - total_cost) / total_cost) * 100, 2) if total_cost > 0 else 0
        },
        "allocation": allocation,
        "by_asset_class": {k: round(v, 2) for k, v in by_asset_class.items()},
        "last_updated": portfolio.get("last_updated", datetime.now(timezone.utc).isoformat())
    }


@router.post("/transaction")
async def execute_transaction(request: TransactionRequest):
    """Execute a buy/sell transaction."""
    portfolio = get_client_portfolio(request.client_id)
    
    # Map asset type to holdings key
    asset_key = request.asset_type if request.asset_type in portfolio["holdings"] else "shares"
    
    # Find existing holding
    existing = None
    for i, holding in enumerate(portfolio["holdings"].get(asset_key, [])):
        if holding.get("symbol") == request.symbol or holding.get("name") == request.name:
            existing = i
            break
    
    transaction_id = f"txn_{uuid.uuid4().hex[:8]}"
    transaction_value = request.units * request.price
    
    if request.transaction_type == "buy":
        if existing is not None:
            # Update existing holding
            h = portfolio["holdings"][asset_key][existing]
            old_value = h["units"] * h["cost_basis"]
            new_value = old_value + transaction_value
            new_units = h["units"] + request.units
            h["units"] = new_units
            h["cost_basis"] = new_value / new_units  # Average cost basis
        else:
            # Add new holding
            new_holding = {
                "symbol": request.symbol,
                "name": request.name,
                "units": request.units,
                "cost_basis": request.price,
                "current_price": request.price,
                "asset_class": "Australian Equities"  # Default
            }
            if asset_key not in portfolio["holdings"]:
                portfolio["holdings"][asset_key] = []
            portfolio["holdings"][asset_key].append(new_holding)
    
    elif request.transaction_type == "sell":
        if existing is None:
            raise HTTPException(status_code=404, detail="Holding not found")
        
        h = portfolio["holdings"][asset_key][existing]
        if request.units > h["units"]:
            raise HTTPException(status_code=400, detail="Cannot sell more units than owned")
        
        # Calculate realized gain/loss
        realized_gain = (request.price - h["cost_basis"]) * request.units
        
        h["units"] -= request.units
        if h["units"] <= 0:
            portfolio["holdings"][asset_key].pop(existing)
        
        # Record transaction
        transaction = {
            "id": transaction_id,
            "client_id": request.client_id,
            "asset_type": request.asset_type,
            "symbol": request.symbol,
            "name": request.name,
            "transaction_type": request.transaction_type,
            "units": request.units,
            "price": request.price,
            "total_value": transaction_value,
            "fees": request.fees,
            "realized_gain": realized_gain,
            "notes": request.notes,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        TRANSACTIONS.append(transaction)
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "transaction": transaction,
            "realized_gain": realized_gain,
            "message": f"Successfully sold {request.units} units of {request.symbol or request.name}"
        }
    
    # Record buy transaction
    transaction = {
        "id": transaction_id,
        "client_id": request.client_id,
        "asset_type": request.asset_type,
        "symbol": request.symbol,
        "name": request.name,
        "transaction_type": request.transaction_type,
        "units": request.units,
        "price": request.price,
        "total_value": transaction_value,
        "fees": request.fees,
        "notes": request.notes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    TRANSACTIONS.append(transaction)
    
    portfolio["last_updated"] = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "transaction_id": transaction_id,
        "transaction": transaction,
        "message": f"Successfully bought {request.units} units of {request.symbol or request.name}"
    }


@router.get("/transactions/{client_id}")
async def get_transactions(client_id: str, limit: int = 50):
    """Get transaction history for a client."""
    client_transactions = [t for t in TRANSACTIONS if t.get("client_id") == client_id]
    client_transactions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {
        "client_id": client_id,
        "transactions": client_transactions[:limit],
        "total": len(client_transactions)
    }


@router.get("/asset-types")
async def get_asset_types():
    """Get supported asset types and their configurations."""
    return {
        "asset_types": [
            {"key": "shares", "name": "Shares", "icon": "LineChart", "supports_symbol": True},
            {"key": "etfs", "name": "ETFs", "icon": "PieChart", "supports_symbol": True},
            {"key": "crypto", "name": "Cryptocurrency", "icon": "Bitcoin", "supports_symbol": True},
            {"key": "property", "name": "Property", "icon": "Home", "supports_symbol": False},
            {"key": "super", "name": "Superannuation", "icon": "PiggyBank", "supports_symbol": False},
            {"key": "cash", "name": "Cash & Deposits", "icon": "Banknote", "supports_symbol": False},
            {"key": "bonds", "name": "Bonds", "icon": "FileText", "supports_symbol": True},
            {"key": "options", "name": "Options", "icon": "Target", "supports_symbol": True},
        ]
    }


@router.post("/rebalance/calculate")
async def calculate_rebalance(request: RebalanceRequest):
    """Calculate trades needed to rebalance portfolio to target allocation."""
    portfolio = get_client_portfolio(request.client_id)
    
    # Calculate current total
    total_value = 0
    current_allocation = {}
    
    for asset_type, holdings in portfolio["holdings"].items():
        for holding in holdings:
            value = holding["units"] * holding["current_price"]
            total_value += value
            asset_class = holding.get("asset_class", "Other")
            if asset_class not in current_allocation:
                current_allocation[asset_class] = 0
            current_allocation[asset_class] += value
    
    # Calculate required trades
    trades = []
    for asset_class, target_pct in request.target_allocations.items():
        target_value = total_value * (target_pct / 100)
        current_value = current_allocation.get(asset_class, 0)
        difference = target_value - current_value
        
        if abs(difference) > 100:  # Only suggest trades > $100
            trades.append({
                "asset_class": asset_class,
                "current_value": round(current_value, 2),
                "current_percent": round((current_value / total_value) * 100, 2) if total_value > 0 else 0,
                "target_value": round(target_value, 2),
                "target_percent": target_pct,
                "action": "buy" if difference > 0 else "sell",
                "amount": round(abs(difference), 2)
            })
    
    return {
        "client_id": request.client_id,
        "total_portfolio_value": round(total_value, 2),
        "current_allocation": {k: round((v / total_value) * 100, 2) for k, v in current_allocation.items()} if total_value > 0 else {},
        "target_allocation": request.target_allocations,
        "suggested_trades": trades,
        "estimated_trading_cost": round(sum(t["amount"] for t in trades) * 0.001, 2),  # 0.1% estimated cost
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/performance/{client_id}")
async def get_holdings_performance(client_id: str):
    """Get detailed performance metrics for all holdings."""
    portfolio = get_client_portfolio(client_id)
    
    performance = []
    for asset_type, holdings in portfolio["holdings"].items():
        for holding in holdings:
            value = holding["units"] * holding["current_price"]
            cost = holding["units"] * holding["cost_basis"]
            gain_loss = value - cost
            return_pct = (gain_loss / cost) * 100 if cost > 0 else 0
            
            performance.append({
                "asset_type": asset_type,
                "symbol": holding.get("symbol", "N/A"),
                "name": holding.get("name", "Unknown"),
                "units": holding["units"],
                "cost_basis": holding["cost_basis"],
                "current_price": holding["current_price"],
                "market_value": round(value, 2),
                "total_cost": round(cost, 2),
                "gain_loss": round(gain_loss, 2),
                "return_percent": round(return_pct, 2),
                "asset_class": holding.get("asset_class", "Other")
            })
    
    # Sort by gain/loss descending
    performance.sort(key=lambda x: x["gain_loss"], reverse=True)
    
    # Top winners and losers
    winners = [p for p in performance if p["gain_loss"] > 0][:5]
    losers = [p for p in performance if p["gain_loss"] < 0][-5:][::-1]
    
    return {
        "client_id": client_id,
        "all_holdings": performance,
        "top_winners": winners,
        "top_losers": losers,
        "summary": {
            "total_holdings": len(performance),
            "total_value": round(sum(p["market_value"] for p in performance), 2),
            "total_cost": round(sum(p["total_cost"] for p in performance), 2),
            "total_gain_loss": round(sum(p["gain_loss"] for p in performance), 2),
            "winners_count": len([p for p in performance if p["gain_loss"] > 0]),
            "losers_count": len([p for p in performance if p["gain_loss"] < 0])
        },
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
