"""
Crypto Integration Layer
Custody abstraction, unified reporting, and portfolio integration.
Makes crypto feel like any other asset class for advisors.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
from datetime import datetime, timezone
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/crypto", tags=["Crypto Integration"])


class CryptoExchange(str, Enum):
    BINANCE = "binance"
    COINBASE = "coinbase"
    KRAKEN = "kraken"
    FTX = "ftx"  # Historical
    GEMINI = "gemini"


class CustodyProvider(str, Enum):
    COINBASE_CUSTODY = "coinbase_custody"
    BITGO = "bitgo"
    FIREBLOCKS = "fireblocks"
    SELF_CUSTODY = "self_custody"


# Supported crypto assets with metadata
CRYPTO_ASSETS = {
    "BTC": {
        "name": "Bitcoin",
        "symbol": "BTC",
        "category": "store_of_value",
        "market_cap": 1320000000000,
        "risk_rating": "medium",
        "custody_supported": True,
        "staking_available": False,
        "tax_classification": "cgt_asset"
    },
    "ETH": {
        "name": "Ethereum",
        "symbol": "ETH",
        "category": "smart_contract_platform",
        "market_cap": 415000000000,
        "risk_rating": "medium",
        "custody_supported": True,
        "staking_available": True,
        "staking_apy": 4.2,
        "tax_classification": "cgt_asset"
    },
    "SOL": {
        "name": "Solana",
        "symbol": "SOL",
        "category": "smart_contract_platform",
        "market_cap": 65000000000,
        "risk_rating": "high",
        "custody_supported": True,
        "staking_available": True,
        "staking_apy": 6.8,
        "tax_classification": "cgt_asset"
    },
    "XRP": {
        "name": "XRP",
        "symbol": "XRP",
        "category": "payment",
        "market_cap": 28000000000,
        "risk_rating": "high",
        "custody_supported": True,
        "staking_available": False,
        "tax_classification": "cgt_asset"
    },
    "ADA": {
        "name": "Cardano",
        "symbol": "ADA",
        "category": "smart_contract_platform",
        "market_cap": 16000000000,
        "risk_rating": "high",
        "custody_supported": True,
        "staking_available": True,
        "staking_apy": 5.0,
        "tax_classification": "cgt_asset"
    },
    "LINK": {
        "name": "Chainlink",
        "symbol": "LINK",
        "category": "oracle",
        "market_cap": 8500000000,
        "risk_rating": "high",
        "custody_supported": True,
        "staking_available": True,
        "staking_apy": 4.5,
        "tax_classification": "cgt_asset"
    },
    "USDC": {
        "name": "USD Coin",
        "symbol": "USDC",
        "category": "stablecoin",
        "market_cap": 25000000000,
        "risk_rating": "low",
        "custody_supported": True,
        "staking_available": False,
        "tax_classification": "foreign_currency"
    },
    "USDT": {
        "name": "Tether",
        "symbol": "USDT",
        "category": "stablecoin",
        "market_cap": 95000000000,
        "risk_rating": "low",
        "custody_supported": True,
        "staking_available": False,
        "tax_classification": "foreign_currency"
    }
}


# Live crypto prices - fetched from CoinGecko with fallback
_live_crypto_cache = {"data": None, "timestamp": None}

CRYPTO_FALLBACK = {
    "BTC": {"price": 67500, "change_24h": 2.1, "change_7d": 5.8, "volume_24h": 28000000000},
    "ETH": {"price": 3450, "change_24h": -1.2, "change_7d": 3.2, "volume_24h": 15000000000},
    "SOL": {"price": 145, "change_24h": 4.5, "change_7d": 12.3, "volume_24h": 2500000000},
    "XRP": {"price": 0.52, "change_24h": 1.8, "change_7d": -2.1, "volume_24h": 1200000000},
    "ADA": {"price": 0.45, "change_24h": -0.5, "change_7d": 1.5, "volume_24h": 450000000},
    "LINK": {"price": 14.50, "change_24h": 3.2, "change_7d": 8.5, "volume_24h": 380000000},
    "USDC": {"price": 1.00, "change_24h": 0.0, "change_7d": 0.0, "volume_24h": 5000000000},
    "USDT": {"price": 1.00, "change_24h": 0.0, "change_7d": 0.0, "volume_24h": 45000000000},
}

COINGECKO_SYMBOL_MAP = {
    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana", "XRP": "ripple",
    "ADA": "cardano", "LINK": "chainlink", "USDC": "usd-coin", "USDT": "tether",
}

async def _fetch_live_crypto() -> Dict:
    """Fetch live crypto prices from CoinGecko with 60s cache."""
    import httpx
    now = datetime.now(timezone.utc)
    if _live_crypto_cache["data"] and _live_crypto_cache["timestamp"]:
        if (now - _live_crypto_cache["timestamp"]).total_seconds() < 60:
            return _live_crypto_cache["data"]
    try:
        coin_ids = ",".join(COINGECKO_SYMBOL_MAP.values())
        url = f"https://api.coingecko.com/api/v3/simple/price?ids={coin_ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true"
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            raw = resp.json()
        result = {}
        for symbol, cg_id in COINGECKO_SYMBOL_MAP.items():
            if cg_id in raw:
                d = raw[cg_id]
                result[symbol] = {
                    "price": round(d.get("usd", 0), 2),
                    "change_24h": round(d.get("usd_24h_change", 0), 2),
                    "change_7d": CRYPTO_FALLBACK.get(symbol, {}).get("change_7d", 0),
                    "volume_24h": d.get("usd_24h_vol", 0),
                }
            else:
                result[symbol] = CRYPTO_FALLBACK.get(symbol, {})
        _live_crypto_cache["data"] = result
        _live_crypto_cache["timestamp"] = now
        return result
    except Exception as e:
        logger.warning(f"CoinGecko fetch failed, using fallback: {e}")
        return CRYPTO_FALLBACK

def get_crypto_price(symbol: str) -> Dict:
    """Get crypto price (sync access to cache, fallback if no cache)."""
    if _live_crypto_cache["data"] and symbol in _live_crypto_cache["data"]:
        return _live_crypto_cache["data"][symbol]
    return CRYPTO_FALLBACK.get(symbol, {"price": 0, "change_24h": 0, "change_7d": 0, "volume_24h": 0})


# Client crypto holdings
CLIENT_CRYPTO_HOLDINGS = {
    "client_1": {
        "client_id": "client_1",
        "custody_provider": CustodyProvider.COINBASE_CUSTODY,
        "holdings": [
            {"symbol": "BTC", "quantity": 0.5, "cost_basis": 28000, "acquisition_date": "2023-06-15"},
            {"symbol": "ETH", "quantity": 5.0, "cost_basis": 9500, "acquisition_date": "2023-08-20"},
        ],
        "total_value": 51000,
        "total_gain": 13500,
        "allocation_pct": 5.5
    },
    "client_4": {
        "client_id": "client_4",
        "custody_provider": CustodyProvider.FIREBLOCKS,
        "holdings": [
            {"symbol": "BTC", "quantity": 3.0, "cost_basis": 150000, "acquisition_date": "2024-01-10"},
            {"symbol": "ETH", "quantity": 25.0, "cost_basis": 75000, "acquisition_date": "2024-02-15"},
            {"symbol": "SOL", "quantity": 200.0, "cost_basis": 18000, "acquisition_date": "2024-03-01"},
        ],
        "total_value": 318250,
        "total_gain": 75250,
        "allocation_pct": 4.2
    }
}


def calculate_crypto_value(holdings: List[Dict]) -> Dict:
    """Calculate current value and gains for crypto holdings."""
    total_value = 0
    total_cost = 0
    positions = []
    
    for h in holdings:
        symbol = h["symbol"]
        quantity = h["quantity"]
        cost_basis = h["cost_basis"]
        
        current_price = get_crypto_price(symbol).get("price", 0)
        current_value = quantity * current_price
        gain = current_value - cost_basis
        gain_pct = (gain / cost_basis * 100) if cost_basis > 0 else 0
        
        total_value += current_value
        total_cost += cost_basis
        
        positions.append({
            "symbol": symbol,
            "name": CRYPTO_ASSETS.get(symbol, {}).get("name", symbol),
            "quantity": quantity,
            "current_price": current_price,
            "current_value": current_value,
            "cost_basis": cost_basis,
            "unrealized_gain": gain,
            "unrealized_gain_pct": round(gain_pct, 2),
            "change_24h": get_crypto_price(symbol).get("change_24h", 0)
        })
    
    total_gain = total_value - total_cost
    total_gain_pct = (total_gain / total_cost * 100) if total_cost > 0 else 0
    
    return {
        "positions": positions,
        "total_value": round(total_value, 2),
        "total_cost_basis": round(total_cost, 2),
        "total_unrealized_gain": round(total_gain, 2),
        "total_unrealized_gain_pct": round(total_gain_pct, 2)
    }


# ==================== API ENDPOINTS ====================

@router.get("/assets")
async def get_crypto_assets():
    """Get all supported crypto assets."""
    return {
        "assets": [
            {
                "symbol": symbol,
                **data,
                "current_price": get_crypto_price(symbol).get("price", 0),
                "change_24h": get_crypto_price(symbol).get("change_24h", 0)
            }
            for symbol, data in CRYPTO_ASSETS.items()
        ],
        "total": len(CRYPTO_ASSETS)
    }


@router.get("/assets/{symbol}")
async def get_crypto_asset(symbol: str):
    """Get specific crypto asset details."""
    symbol = symbol.upper()
    
    if symbol not in CRYPTO_ASSETS:
        raise HTTPException(status_code=404, detail=f"Crypto asset {symbol} not found")
    
    return {
        "symbol": symbol,
        **CRYPTO_ASSETS[symbol],
        "price_data": get_crypto_price(symbol)
    }


@router.get("/prices")
async def get_crypto_prices():
    """Get all crypto prices (live from CoinGecko)."""
    prices = await _fetch_live_crypto()
    return {
        "prices": prices,
        "source": "CoinGecko",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/holdings/{client_id}")
async def get_client_crypto_holdings(client_id: str):
    """Get client crypto holdings with current valuations."""
    if client_id not in CLIENT_CRYPTO_HOLDINGS:
        return {
            "client_id": client_id,
            "has_crypto": False,
            "holdings": [],
            "total_value": 0
        }
    
    client = CLIENT_CRYPTO_HOLDINGS[client_id]
    valuation = calculate_crypto_value(client["holdings"])
    
    return {
        "client_id": client_id,
        "has_crypto": True,
        "custody_provider": client["custody_provider"],
        **valuation,
        "allocation_pct": client.get("allocation_pct", 0)
    }


@router.get("/portfolio-summary")
async def get_crypto_portfolio_summary():
    """Get summary of all crypto holdings across clients."""
    total_value = 0
    total_clients = 0
    by_asset = {}
    
    for client_id, client in CLIENT_CRYPTO_HOLDINGS.items():
        valuation = calculate_crypto_value(client["holdings"])
        total_value += valuation["total_value"]
        total_clients += 1
        
        for pos in valuation["positions"]:
            symbol = pos["symbol"]
            if symbol not in by_asset:
                by_asset[symbol] = {"total_quantity": 0, "total_value": 0, "client_count": 0}
            by_asset[symbol]["total_quantity"] += pos["quantity"]
            by_asset[symbol]["total_value"] += pos["current_value"]
            by_asset[symbol]["client_count"] += 1
    
    return {
        "total_crypto_value": round(total_value, 2),
        "total_clients_with_crypto": total_clients,
        "by_asset": [
            {"symbol": s, **d}
            for s, d in sorted(by_asset.items(), key=lambda x: x[1]["total_value"], reverse=True)
        ],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/custody-providers")
async def get_custody_providers():
    """Get available custody providers."""
    return {
        "providers": [
            {
                "id": CustodyProvider.COINBASE_CUSTODY.value,
                "name": "Coinbase Custody",
                "type": "institutional",
                "insurance_coverage": 320000000,
                "supported_assets": 200,
                "min_custody": 1000000,
                "fees": "0.50% annual"
            },
            {
                "id": CustodyProvider.BITGO.value,
                "name": "BitGo",
                "type": "institutional",
                "insurance_coverage": 250000000,
                "supported_assets": 400,
                "min_custody": 100000,
                "fees": "0.40% annual"
            },
            {
                "id": CustodyProvider.FIREBLOCKS.value,
                "name": "Fireblocks",
                "type": "institutional",
                "insurance_coverage": 150000000,
                "supported_assets": 1000,
                "min_custody": 50000,
                "fees": "subscription based"
            },
            {
                "id": CustodyProvider.SELF_CUSTODY.value,
                "name": "Self Custody",
                "type": "client_managed",
                "insurance_coverage": 0,
                "supported_assets": "unlimited",
                "min_custody": 0,
                "fees": "none"
            }
        ]
    }


@router.get("/tax-report/{client_id}")
async def get_crypto_tax_report(client_id: str, tax_year: int = 2025):
    """Generate crypto tax report for a client."""
    if client_id not in CLIENT_CRYPTO_HOLDINGS:
        return {
            "client_id": client_id,
            "tax_year": tax_year,
            "has_crypto": False,
            "taxable_events": 0
        }
    
    client = CLIENT_CRYPTO_HOLDINGS[client_id]
    valuation = calculate_crypto_value(client["holdings"])
    
    # Generate tax summary
    return {
        "client_id": client_id,
        "tax_year": tax_year,
        "has_crypto": True,
        "summary": {
            "total_holdings_value": valuation["total_value"],
            "total_cost_basis": valuation["total_cost_basis"],
            "unrealized_gains": valuation["total_unrealized_gain"],
            "realized_gains_ytd": 0,  # Would track actual sales
            "realized_losses_ytd": 0,
            "net_taxable": 0
        },
        "positions": [
            {
                "symbol": p["symbol"],
                "quantity": p["quantity"],
                "cost_basis": p["cost_basis"],
                "current_value": p["current_value"],
                "unrealized_gain": p["unrealized_gain"],
                "holding_period": "long_term",  # Would calculate from acquisition date
                "tax_treatment": CRYPTO_ASSETS.get(p["symbol"], {}).get("tax_classification", "cgt_asset")
            }
            for p in valuation["positions"]
        ],
        "notes": [
            "Crypto assets held >12 months eligible for 50% CGT discount",
            "Staking rewards taxable as ordinary income when received",
            "ATO requires detailed transaction records"
        ]
    }


@router.get("/staking-opportunities")
async def get_staking_opportunities():
    """Get available staking opportunities."""
    opportunities = []
    
    for symbol, data in CRYPTO_ASSETS.items():
        if data.get("staking_available"):
            opportunities.append({
                "symbol": symbol,
                "name": data["name"],
                "apy": data.get("staking_apy", 0),
                "risk_rating": data["risk_rating"],
                "lock_period": "flexible",
                "min_stake": 0.01 if symbol == "ETH" else 1,
                "custody_supported": data["custody_supported"]
            })
    
    return {
        "opportunities": sorted(opportunities, key=lambda x: x["apy"], reverse=True),
        "note": "Staking rewards are taxable as ordinary income in Australia"
    }


@router.post("/trade-preview")
async def preview_crypto_trade(
    client_id: str,
    symbol: str,
    side: str,
    quantity: float
):
    """Preview a crypto trade with cost and tax implications."""
    symbol = symbol.upper()
    
    if not get_crypto_price(symbol).get("price"):
        raise HTTPException(status_code=404, detail=f"Crypto {symbol} not found")
    
    price = get_crypto_price(symbol).get("price", 0)
    value = quantity * price
    
    # Estimate fees
    exchange_fee = value * 0.001  # 0.1%
    spread = value * 0.0005  # 0.05%
    
    # Tax implications for sells
    tax_impact = None
    if side == "sell" and client_id in CLIENT_CRYPTO_HOLDINGS:
        holdings = CLIENT_CRYPTO_HOLDINGS[client_id]["holdings"]
        matching = [h for h in holdings if h["symbol"] == symbol]
        if matching:
            avg_cost = matching[0]["cost_basis"] / matching[0]["quantity"]
            gain_per_unit = price - avg_cost
            total_gain = gain_per_unit * quantity
            if total_gain > 0:
                tax_impact = {
                    "estimated_gain": round(total_gain, 2),
                    "cgt_rate": 0.23,  # Top marginal less 50% discount
                    "estimated_tax": round(total_gain * 0.23, 2)
                }
    
    return {
        "preview_id": f"CPV_{uuid.uuid4().hex[:8]}",
        "symbol": symbol,
        "side": side,
        "quantity": quantity,
        "price": price,
        "gross_value": round(value, 2),
        "exchange_fee": round(exchange_fee, 2),
        "spread_cost": round(spread, 2),
        "total_cost": round(exchange_fee + spread, 2),
        "net_value": round(value - exchange_fee - spread if side == "buy" else value - exchange_fee - spread, 2),
        "tax_impact": tax_impact,
        "execution_venue": "binance" if value > 10000 else "coinbase"
    }


