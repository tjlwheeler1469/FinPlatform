"""
Live Cryptocurrency Price Feed
Fetches real-time crypto prices from CoinGecko API (free tier).
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging
import httpx
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/crypto", tags=["Crypto Prices"])

# CoinGecko API (free tier - no API key required)
COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

# Cache for price data
_price_cache: Dict[str, Any] = {}
_cache_ttl = 60  # 60 seconds cache

def get_cached(key: str):
    """Get cached data if not expired."""
    if key in _price_cache:
        cached = _price_cache[key]
        if (datetime.now(timezone.utc) - cached["timestamp"]).total_seconds() < _cache_ttl:
            return cached["data"]
    return None

def set_cached(key: str, data: Any):
    """Cache data with timestamp."""
    _price_cache[key] = {
        "data": data,
        "timestamp": datetime.now(timezone.utc)
    }

# Mapping of common symbols to CoinGecko IDs
SYMBOL_TO_COINGECKO = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "LINK": "chainlink",
    "MATIC": "matic-network",
    "XRP": "ripple",
    "ADA": "cardano",
    "DOT": "polkadot",
    "DOGE": "dogecoin",
    "AVAX": "avalanche-2",
    "BNB": "binancecoin",
    "ATOM": "cosmos",
    "UNI": "uniswap",
    "LTC": "litecoin"
}


async def fetch_coingecko_prices(coin_ids: List[str], vs_currency: str = "aud") -> Dict:
    """Fetch prices from CoinGecko API."""
    try:
        ids_param = ",".join(coin_ids)
        url = f"{COINGECKO_API_URL}/simple/price"
        params = {
            "ids": ids_param,
            "vs_currencies": vs_currency,
            "include_24hr_change": "true",
            "include_market_cap": "true",
            "include_24hr_vol": "true"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"CoinGecko API error: {e}")
        return {}


async def fetch_coingecko_market_data(coin_ids: List[str], vs_currency: str = "aud") -> List[Dict]:
    """Fetch detailed market data from CoinGecko."""
    try:
        ids_param = ",".join(coin_ids)
        url = f"{COINGECKO_API_URL}/coins/markets"
        params = {
            "ids": ids_param,
            "vs_currency": vs_currency,
            "order": "market_cap_desc",
            "sparkline": "false",
            "price_change_percentage": "1h,24h,7d"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"CoinGecko market data error: {e}")
        return []


@router.get("/prices")
async def get_crypto_prices(symbols: str = "BTC,ETH,SOL,LINK,MATIC", currency: str = "aud"):
    """
    Get live cryptocurrency prices.
    
    Args:
        symbols: Comma-separated list of crypto symbols (e.g., "BTC,ETH,SOL")
        currency: Target currency (default: aud)
    """
    cache_key = f"prices_{symbols}_{currency}"
    cached = get_cached(cache_key)
    if cached:
        return cached
    
    # Convert symbols to CoinGecko IDs
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    coin_ids = [SYMBOL_TO_COINGECKO.get(s, s.lower()) for s in symbol_list]
    
    # Fetch from CoinGecko
    raw_data = await fetch_coingecko_prices(coin_ids, currency)
    
    # Format response
    prices = []
    for symbol in symbol_list:
        coin_id = SYMBOL_TO_COINGECKO.get(symbol, symbol.lower())
        if coin_id in raw_data:
            data = raw_data[coin_id]
            prices.append({
                "symbol": symbol,
                "name": coin_id.replace("-", " ").title(),
                "price": data.get(currency, 0),
                "change_24h": data.get(f"{currency}_24h_change", 0),
                "market_cap": data.get(f"{currency}_market_cap", 0),
                "volume_24h": data.get(f"{currency}_24h_vol", 0),
                "currency": currency.upper()
            })
    
    result = {
        "prices": prices,
        "currency": currency.upper(),
        "source": "CoinGecko",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cached": False
    }
    
    set_cached(cache_key, {**result, "cached": True})
    return result


@router.get("/market")
async def get_crypto_market_data(symbols: str = "BTC,ETH,SOL,LINK,MATIC", currency: str = "aud"):
    """
    Get detailed market data for cryptocurrencies.
    
    Args:
        symbols: Comma-separated list of crypto symbols
        currency: Target currency (default: aud)
    """
    cache_key = f"market_{symbols}_{currency}"
    cached = get_cached(cache_key)
    if cached:
        return cached
    
    # Convert symbols to CoinGecko IDs
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    coin_ids = [SYMBOL_TO_COINGECKO.get(s, s.lower()) for s in symbol_list]
    
    # Fetch from CoinGecko
    market_data = await fetch_coingecko_market_data(coin_ids, currency)
    
    # Format response
    coins = []
    for coin in market_data:
        # Find the symbol from our mapping
        symbol = next((k for k, v in SYMBOL_TO_COINGECKO.items() if v == coin.get("id")), coin.get("symbol", "").upper())
        coins.append({
            "symbol": symbol,
            "name": coin.get("name"),
            "image": coin.get("image"),
            "current_price": coin.get("current_price", 0),
            "market_cap": coin.get("market_cap", 0),
            "market_cap_rank": coin.get("market_cap_rank"),
            "total_volume": coin.get("total_volume", 0),
            "high_24h": coin.get("high_24h", 0),
            "low_24h": coin.get("low_24h", 0),
            "price_change_24h": coin.get("price_change_24h", 0),
            "price_change_percentage_24h": coin.get("price_change_percentage_24h", 0),
            "price_change_percentage_1h": coin.get("price_change_percentage_1h_in_currency", 0),
            "price_change_percentage_7d": coin.get("price_change_percentage_7d_in_currency", 0),
            "circulating_supply": coin.get("circulating_supply", 0),
            "total_supply": coin.get("total_supply"),
            "ath": coin.get("ath", 0),
            "ath_change_percentage": coin.get("ath_change_percentage", 0),
            "last_updated": coin.get("last_updated")
        })
    
    result = {
        "coins": coins,
        "currency": currency.upper(),
        "source": "CoinGecko",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cached": False
    }
    
    set_cached(cache_key, {**result, "cached": True})
    return result


@router.get("/global")
async def get_crypto_global_data():
    """Get global cryptocurrency market data."""
    cache_key = "global_data"
    cached = get_cached(cache_key)
    if cached:
        return cached
    
    try:
        url = f"{COINGECKO_API_URL}/global"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json().get("data", {})
        
        result = {
            "total_market_cap_aud": data.get("total_market_cap", {}).get("aud", 0),
            "total_volume_24h_aud": data.get("total_volume", {}).get("aud", 0),
            "btc_dominance": data.get("market_cap_percentage", {}).get("btc", 0),
            "eth_dominance": data.get("market_cap_percentage", {}).get("eth", 0),
            "active_cryptocurrencies": data.get("active_cryptocurrencies", 0),
            "markets": data.get("markets", 0),
            "market_cap_change_24h": data.get("market_cap_change_percentage_24h_usd", 0),
            "source": "CoinGecko",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "cached": False
        }
        
        set_cached(cache_key, {**result, "cached": True})
        return result
    except Exception as e:
        logger.error(f"CoinGecko global data error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch global crypto data")


@router.get("/portfolio/value")
async def calculate_portfolio_value(
    holdings: str = "BTC:0.85,ETH:8.5,SOL:45,LINK:250,MATIC:2500",
    currency: str = "aud"
):
    """
    Calculate live portfolio value based on holdings.
    
    Args:
        holdings: Comma-separated list of holdings in format SYMBOL:AMOUNT (e.g., "BTC:0.5,ETH:10")
        currency: Target currency (default: aud)
    """
    # Parse holdings
    holding_list = []
    for h in holdings.split(","):
        parts = h.strip().split(":")
        if len(parts) == 2:
            symbol = parts[0].upper()
            try:
                amount = float(parts[1])
                holding_list.append({"symbol": symbol, "amount": amount})
            except ValueError:
                continue
    
    if not holding_list:
        raise HTTPException(status_code=400, detail="Invalid holdings format")
    
    # Get live prices
    symbols = ",".join([h["symbol"] for h in holding_list])
    prices_data = await get_crypto_prices(symbols, currency)
    
    # Create price lookup
    price_lookup = {p["symbol"]: p for p in prices_data.get("prices", [])}
    
    # Calculate values
    portfolio = []
    total_value = 0
    total_change_24h = 0
    
    for holding in holding_list:
        symbol = holding["symbol"]
        amount = holding["amount"]
        price_info = price_lookup.get(symbol, {})
        
        price = price_info.get("price", 0)
        change_24h = price_info.get("change_24h", 0)
        value = price * amount
        
        portfolio.append({
            "symbol": symbol,
            "name": price_info.get("name", symbol),
            "amount": amount,
            "price": price,
            "value": round(value, 2),
            "change_24h": change_24h,
            "value_change_24h": round(value * (change_24h / 100), 2) if change_24h else 0
        })
        
        total_value += value
        if change_24h:
            total_change_24h += value * (change_24h / 100)
    
    # Calculate allocation percentages
    for p in portfolio:
        p["allocation"] = round((p["value"] / total_value * 100) if total_value > 0 else 0, 2)
    
    return {
        "portfolio": portfolio,
        "total_value": round(total_value, 2),
        "total_change_24h": round(total_change_24h, 2),
        "total_change_percentage": round((total_change_24h / (total_value - total_change_24h) * 100) if total_value > total_change_24h else 0, 2),
        "currency": currency.upper(),
        "source": "CoinGecko",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
