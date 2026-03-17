"""
Cross-Platform Reconciliation Engine
Unifies positions, trades, balances, and pricing across all brokers and exchanges.
Creates a single source of truth for every client's financial state.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reconciliation", tags=["Cross-Platform Reconciliation"])


class DataSource(str, Enum):
    ALPACA = "alpaca"
    IBKR = "interactive_brokers"
    BINANCE = "binance"
    COINBASE = "coinbase"
    ASX_BROKER = "asx_broker"
    MANUAL = "manual"
    BANK = "bank"


class ReconciliationStatus(str, Enum):
    MATCHED = "matched"
    DISCREPANCY = "discrepancy"
    PENDING = "pending"
    MANUAL_REVIEW = "manual_review"


# Unified client data from multiple sources
UNIFIED_CLIENT_DATA = {
    "client_1": {
        "client_id": "client_1",
        "client_name": "Wheeler Family",
        "accounts": [
            {
                "account_id": "WHL_ALPACA_001",
                "source": DataSource.ALPACA,
                "account_type": "brokerage",
                "currency": "USD",
                "cash_balance": 45000,
                "positions_value": 185000,
                "total_value": 230000,
                "last_sync": "2025-03-17T05:00:00Z"
            },
            {
                "account_id": "WHL_ASX_001",
                "source": DataSource.ASX_BROKER,
                "account_type": "brokerage",
                "currency": "AUD",
                "cash_balance": 25000,
                "positions_value": 420000,
                "total_value": 445000,
                "last_sync": "2025-03-17T05:00:00Z"
            },
            {
                "account_id": "WHL_COINBASE_001",
                "source": DataSource.COINBASE,
                "account_type": "crypto",
                "currency": "USD",
                "cash_balance": 5000,
                "positions_value": 51000,
                "total_value": 56000,
                "last_sync": "2025-03-17T05:00:00Z"
            },
            {
                "account_id": "WHL_BANK_001",
                "source": DataSource.BANK,
                "account_type": "savings",
                "currency": "AUD",
                "cash_balance": 185000,
                "positions_value": 0,
                "total_value": 185000,
                "last_sync": "2025-03-16T23:00:00Z"
            }
        ],
        "unified_positions": [],  # Will be populated
        "total_aum": 920000,
        "reconciliation_status": ReconciliationStatus.MATCHED
    },
    "client_4": {
        "client_id": "client_4",
        "client_name": "Patel Holdings",
        "accounts": [
            {
                "account_id": "PTL_IBKR_001",
                "source": DataSource.IBKR,
                "account_type": "brokerage",
                "currency": "USD",
                "cash_balance": 525000,
                "positions_value": 5200000,
                "total_value": 5725000,
                "last_sync": "2025-03-17T05:00:00Z"
            },
            {
                "account_id": "PTL_BINANCE_001",
                "source": DataSource.BINANCE,
                "account_type": "crypto",
                "currency": "USD",
                "cash_balance": 50000,
                "positions_value": 318250,
                "total_value": 368250,
                "last_sync": "2025-03-17T05:00:00Z"
            },
            {
                "account_id": "PTL_ASX_001",
                "source": DataSource.ASX_BROKER,
                "account_type": "brokerage",
                "currency": "AUD",
                "cash_balance": 150000,
                "positions_value": 1256750,
                "total_value": 1406750,
                "last_sync": "2025-03-17T05:00:00Z"
            }
        ],
        "unified_positions": [],
        "total_aum": 7500000,
        "reconciliation_status": ReconciliationStatus.MATCHED
    }
}


# Position data by source
POSITIONS_BY_SOURCE = {
    "client_1": {
        DataSource.ALPACA: [
            {"symbol": "AAPL", "quantity": 200, "value": 35700, "cost_basis": 32000},
            {"symbol": "MSFT", "quantity": 100, "value": 37825, "cost_basis": 35000},
            {"symbol": "GOOGL", "quantity": 150, "value": 21420, "cost_basis": 20000},
            {"symbol": "VTI", "quantity": 300, "value": 72000, "cost_basis": 68000},
        ],
        DataSource.ASX_BROKER: [
            {"symbol": "CBA.AX", "quantity": 500, "value": 59250, "cost_basis": 55000},
            {"symbol": "BHP.AX", "quantity": 1000, "value": 45200, "cost_basis": 42000},
            {"symbol": "CSL.AX", "quantity": 200, "value": 57000, "cost_basis": 52000},
            {"symbol": "VAS.AX", "quantity": 1500, "value": 138750, "cost_basis": 130000},
            {"symbol": "VAF.AX", "quantity": 2000, "value": 97800, "cost_basis": 96000},
        ],
        DataSource.COINBASE: [
            {"symbol": "BTC", "quantity": 0.5, "value": 33750, "cost_basis": 28000},
            {"symbol": "ETH", "quantity": 5.0, "value": 17250, "cost_basis": 9500},
        ]
    }
}


# Transaction history for reconciliation
TRANSACTION_HISTORY = {
    "client_1": [
        {"date": "2025-03-15", "source": DataSource.ALPACA, "type": "buy", "symbol": "AAPL", "quantity": 50, "price": 177.50, "total": 8875},
        {"date": "2025-03-14", "source": DataSource.ASX_BROKER, "type": "dividend", "symbol": "CBA.AX", "amount": 450},
        {"date": "2025-03-12", "source": DataSource.COINBASE, "type": "buy", "symbol": "ETH", "quantity": 1.0, "price": 3400, "total": 3400},
    ]
}


def reconcile_positions(client_id: str) -> Dict:
    """Reconcile positions across all sources for a client."""
    if client_id not in POSITIONS_BY_SOURCE:
        return {"positions": [], "status": ReconciliationStatus.PENDING}
    
    unified = {}
    sources_data = POSITIONS_BY_SOURCE[client_id]
    
    for source, positions in sources_data.items():
        for pos in positions:
            symbol = pos["symbol"]
            if symbol not in unified:
                unified[symbol] = {
                    "symbol": symbol,
                    "total_quantity": 0,
                    "total_value": 0,
                    "total_cost_basis": 0,
                    "sources": [],
                    "asset_class": "crypto" if symbol in ["BTC", "ETH", "SOL"] else "equity"
                }
            
            unified[symbol]["total_quantity"] += pos["quantity"]
            unified[symbol]["total_value"] += pos["value"]
            unified[symbol]["total_cost_basis"] += pos["cost_basis"]
            unified[symbol]["sources"].append({
                "source": source.value,
                "quantity": pos["quantity"],
                "value": pos["value"]
            })
    
    # Calculate gains
    for symbol, data in unified.items():
        data["unrealized_gain"] = data["total_value"] - data["total_cost_basis"]
        data["unrealized_gain_pct"] = round(
            (data["unrealized_gain"] / data["total_cost_basis"] * 100) 
            if data["total_cost_basis"] > 0 else 0, 2
        )
    
    return {
        "positions": list(unified.values()),
        "status": ReconciliationStatus.MATCHED,
        "reconciled_at": datetime.now(timezone.utc).isoformat()
    }


def reconcile_cash(client_id: str) -> Dict:
    """Reconcile cash balances across all accounts."""
    if client_id not in UNIFIED_CLIENT_DATA:
        return {"cash_balances": [], "total": 0}
    
    client = UNIFIED_CLIENT_DATA[client_id]
    cash_by_currency = {}
    
    for account in client["accounts"]:
        currency = account["currency"]
        if currency not in cash_by_currency:
            cash_by_currency[currency] = {"currency": currency, "total": 0, "accounts": []}
        
        cash_by_currency[currency]["total"] += account["cash_balance"]
        cash_by_currency[currency]["accounts"].append({
            "account_id": account["account_id"],
            "source": account["source"].value,
            "balance": account["cash_balance"]
        })
    
    return {
        "cash_balances": list(cash_by_currency.values()),
        "total_usd_equivalent": sum(
            b["total"] * (1 if b["currency"] == "USD" else 0.65)  # Simple AUD->USD
            for b in cash_by_currency.values()
        ),
        "reconciled_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== API ENDPOINTS ====================

@router.get("/status")
async def get_reconciliation_status():
    """Get overall reconciliation status."""
    total_clients = len(UNIFIED_CLIENT_DATA)
    matched = len([c for c in UNIFIED_CLIENT_DATA.values() 
                   if c["reconciliation_status"] == ReconciliationStatus.MATCHED])
    
    return {
        "status": "operational",
        "total_clients": total_clients,
        "reconciled": matched,
        "discrepancies": total_clients - matched,
        "last_full_reconciliation": datetime.now(timezone.utc).isoformat(),
        "data_sources": [s.value for s in DataSource]
    }


@router.get("/client/{client_id}")
async def get_unified_client_view(client_id: str):
    """Get unified view of all client data across platforms."""
    if client_id not in UNIFIED_CLIENT_DATA:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = UNIFIED_CLIENT_DATA[client_id]
    positions = reconcile_positions(client_id)
    cash = reconcile_cash(client_id)
    
    # Calculate totals
    total_positions = sum(p["total_value"] for p in positions["positions"])
    total_cash = cash["total_usd_equivalent"]
    total_aum = total_positions + total_cash
    
    return {
        "client_id": client_id,
        "client_name": client["client_name"],
        "total_aum": round(total_aum, 2),
        "total_positions_value": round(total_positions, 2),
        "total_cash": round(total_cash, 2),
        "accounts": client["accounts"],
        "accounts_count": len(client["accounts"]),
        "unified_positions": positions["positions"],
        "positions_count": len(positions["positions"]),
        "cash_balances": cash["cash_balances"],
        "reconciliation_status": client["reconciliation_status"],
        "last_reconciled": datetime.now(timezone.utc).isoformat(),
        "by_asset_class": {
            "equities": sum(p["total_value"] for p in positions["positions"] if p["asset_class"] == "equity"),
            "crypto": sum(p["total_value"] for p in positions["positions"] if p["asset_class"] == "crypto"),
            "cash": total_cash
        }
    }


@router.get("/client/{client_id}/positions")
async def get_unified_positions(client_id: str):
    """Get reconciled positions for a client."""
    positions = reconcile_positions(client_id)
    
    return {
        "client_id": client_id,
        **positions,
        "total_value": sum(p["total_value"] for p in positions["positions"]),
        "total_unrealized_gain": sum(p["unrealized_gain"] for p in positions["positions"])
    }


@router.get("/client/{client_id}/cash")
async def get_unified_cash(client_id: str):
    """Get reconciled cash balances for a client."""
    return {
        "client_id": client_id,
        **reconcile_cash(client_id)
    }


@router.get("/client/{client_id}/transactions")
async def get_transaction_history(
    client_id: str,
    days: int = 30,
    source: Optional[str] = None
):
    """Get transaction history across all platforms."""
    if client_id not in TRANSACTION_HISTORY:
        return {"transactions": [], "total": 0}
    
    transactions = TRANSACTION_HISTORY[client_id]
    
    if source:
        transactions = [t for t in transactions if t["source"].value == source]
    
    cutoff = datetime.now() - timedelta(days=days)
    transactions = [
        t for t in transactions 
        if datetime.strptime(t["date"], "%Y-%m-%d") > cutoff
    ]
    
    return {
        "client_id": client_id,
        "transactions": transactions,
        "total": len(transactions),
        "period_days": days
    }


@router.post("/reconcile/{client_id}")
async def trigger_reconciliation(client_id: str):
    """Trigger reconciliation for a specific client."""
    if client_id not in UNIFIED_CLIENT_DATA:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Perform reconciliation
    positions = reconcile_positions(client_id)
    cash = reconcile_cash(client_id)
    
    # Update status
    UNIFIED_CLIENT_DATA[client_id]["reconciliation_status"] = positions["status"]
    
    return {
        "success": True,
        "client_id": client_id,
        "reconciliation_status": positions["status"],
        "positions_reconciled": len(positions["positions"]),
        "cash_accounts_reconciled": len(cash["cash_balances"]),
        "completed_at": datetime.now(timezone.utc).isoformat()
    }


@router.post("/reconcile-all")
async def trigger_full_reconciliation():
    """Trigger reconciliation for all clients."""
    results = []
    
    for client_id in UNIFIED_CLIENT_DATA.keys():
        try:
            positions = reconcile_positions(client_id)
            UNIFIED_CLIENT_DATA[client_id]["reconciliation_status"] = positions["status"]
            results.append({
                "client_id": client_id,
                "status": positions["status"],
                "positions": len(positions["positions"])
            })
        except Exception as e:
            results.append({
                "client_id": client_id,
                "status": ReconciliationStatus.MANUAL_REVIEW,
                "error": str(e)
            })
    
    matched = len([r for r in results if r["status"] == ReconciliationStatus.MATCHED])
    
    return {
        "success": True,
        "total_clients": len(results),
        "matched": matched,
        "discrepancies": len(results) - matched,
        "results": results,
        "completed_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/discrepancies")
async def get_discrepancies():
    """Get all reconciliation discrepancies."""
    discrepancies = []
    
    for client_id, client in UNIFIED_CLIENT_DATA.items():
        if client["reconciliation_status"] != ReconciliationStatus.MATCHED:
            discrepancies.append({
                "client_id": client_id,
                "client_name": client["client_name"],
                "status": client["reconciliation_status"],
                "accounts": len(client["accounts"])
            })
    
    return {
        "discrepancies": discrepancies,
        "total": len(discrepancies)
    }


@router.get("/portfolio-summary")
async def get_portfolio_summary():
    """Get aggregated portfolio summary across all clients."""
    total_aum = 0
    total_clients = 0
    by_source = {}
    by_asset_class = {"equities": 0, "crypto": 0, "cash": 0}
    
    for client_id, client in UNIFIED_CLIENT_DATA.items():
        total_aum += client["total_aum"]
        total_clients += 1
        
        for account in client["accounts"]:
            source = account["source"].value
            if source not in by_source:
                by_source[source] = {"value": 0, "accounts": 0}
            by_source[source]["value"] += account["total_value"]
            by_source[source]["accounts"] += 1
        
        positions = reconcile_positions(client_id)
        for pos in positions["positions"]:
            if pos["asset_class"] == "equity":
                by_asset_class["equities"] += pos["total_value"]
            elif pos["asset_class"] == "crypto":
                by_asset_class["crypto"] += pos["total_value"]
        
        cash = reconcile_cash(client_id)
        by_asset_class["cash"] += cash["total_usd_equivalent"]
    
    return {
        "total_aum": round(total_aum, 2),
        "total_clients": total_clients,
        "by_source": [
            {"source": s, **d} for s, d in by_source.items()
        ],
        "by_asset_class": by_asset_class,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
