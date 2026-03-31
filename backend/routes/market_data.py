"""
Market Data API - Live ASX and global market indicators
Uses Yahoo Finance API for real-time market data
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import asyncio
from datetime import datetime

router = APIRouter(prefix="/market-data", tags=["Market Data"])

# Cache for market data (refresh every 5 minutes)
market_cache = {
    "data": None,
    "last_updated": None
}
CACHE_DURATION_SECONDS = 300  # 5 minutes

class MarketIndicator(BaseModel):
    symbol: str
    name: str
    value: float
    change: float
    change_percent: float
    last_updated: str

class MarketDataResponse(BaseModel):
    indicators: List[MarketIndicator]
    last_updated: str
    source: str

# Yahoo Finance symbols for Australian and global markets
MARKET_SYMBOLS = {
    "^AXJO": "ASX 200",
    "^GSPC": "S&P 500",
    "^DJI": "Dow Jones",
    "^IXIC": "NASDAQ",
    "^FTSE": "FTSE 100",
    "^N225": "Nikkei 225",
    "AUDUSD=X": "AUD/USD",
    "AUDEUR=X": "AUD/EUR",
    "AUDGBP=X": "AUD/GBP",
    "AUDJPY=X": "AUD/JPY",
    "AUDNZD=X": "AUD/NZD",
    "AUDCNY=X": "AUD/CNY",
    "^TNX": "US 10Y Bond",
    "^AORD": "All Ords",
    "BTC-AUD": "Bitcoin AUD",
    "GC=F": "Gold",
    "CL=F": "Crude Oil WTI"
}

async def fetch_yahoo_finance_quote(symbol: str, client: httpx.AsyncClient) -> Optional[dict]:
    """Fetch quote from Yahoo Finance API"""
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        params = {
            "interval": "1d",
            "range": "2d"
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        
        response = await client.get(url, params=params, headers=headers, timeout=10.0)
        
        if response.status_code == 200:
            data = response.json()
            result = data.get("chart", {}).get("result", [])
            if result:
                meta = result[0].get("meta", {})
                # Note: quote indicators available but using meta for price data
                _ = result[0].get("indicators", {}).get("quote", [{}])[0]
                
                current_price = meta.get("regularMarketPrice", 0)
                previous_close = meta.get("previousClose", current_price)
                
                change = current_price - previous_close
                change_percent = (change / previous_close * 100) if previous_close else 0
                
                return {
                    "symbol": symbol,
                    "name": MARKET_SYMBOLS.get(symbol, symbol),
                    "value": round(current_price, 4) if "=" in symbol else round(current_price, 2),
                    "change": round(change, 4) if "=" in symbol else round(change, 2),
                    "change_percent": round(change_percent, 2),
                    "last_updated": datetime.utcnow().isoformat()
                }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
    return None

async def fetch_all_market_data() -> List[MarketIndicator]:
    """Fetch all market indicators concurrently"""
    async with httpx.AsyncClient() as client:
        tasks = [fetch_yahoo_finance_quote(symbol, client) for symbol in MARKET_SYMBOLS.keys()]
        results = await asyncio.gather(*tasks)
        
        indicators = []
        for result in results:
            if result:
                indicators.append(MarketIndicator(**result))
        
        return indicators

def get_fallback_data() -> List[MarketIndicator]:
    """Return fallback/mock data if API fails"""
    now = datetime.utcnow().isoformat()
    return [
        MarketIndicator(symbol="^AXJO", name="ASX 200", value=7842.50, change=62.30, change_percent=0.80, last_updated=now),
        MarketIndicator(symbol="^GSPC", name="S&P 500", value=5123.40, change=61.48, change_percent=1.21, last_updated=now),
        MarketIndicator(symbol="^DJI", name="Dow Jones", value=39150.00, change=245.00, change_percent=0.63, last_updated=now),
        MarketIndicator(symbol="^IXIC", name="NASDAQ", value=16380.00, change=185.50, change_percent=1.15, last_updated=now),
        MarketIndicator(symbol="AUDUSD=X", name="AUD/USD", value=0.6720, change=-0.0020, change_percent=-0.30, last_updated=now),
        MarketIndicator(symbol="AUDEUR=X", name="AUD/EUR", value=0.6150, change=0.0010, change_percent=0.16, last_updated=now),
        MarketIndicator(symbol="AUDGBP=X", name="AUD/GBP", value=0.5280, change=-0.0015, change_percent=-0.28, last_updated=now),
        MarketIndicator(symbol="^TNX", name="US 10Y Bond", value=4.25, change=0.02, change_percent=0.47, last_updated=now),
        MarketIndicator(symbol="GC=F", name="Gold", value=2175.50, change=12.30, change_percent=0.57, last_updated=now),
        MarketIndicator(symbol="CL=F", name="Crude Oil WTI", value=78.45, change=-0.85, change_percent=-1.07, last_updated=now),
    ]

@router.get("/indicators", response_model=MarketDataResponse)
async def get_market_indicators():
    """Get live market indicators for dashboard display"""
    global market_cache
    
    now = datetime.utcnow()
    
    # Check cache
    if market_cache["data"] and market_cache["last_updated"]:
        cache_age = (now - market_cache["last_updated"]).total_seconds()
        if cache_age < CACHE_DURATION_SECONDS:
            return MarketDataResponse(
                indicators=market_cache["data"],
                last_updated=market_cache["last_updated"].isoformat(),
                source="cache"
            )
    
    # Fetch fresh data
    try:
        indicators = await fetch_all_market_data()
        
        if indicators:
            market_cache["data"] = indicators
            market_cache["last_updated"] = now
            return MarketDataResponse(
                indicators=indicators,
                last_updated=now.isoformat(),
                source="live"
            )
    except Exception as e:
        print(f"Error fetching market data: {e}")
    
    # Return fallback data if API fails
    fallback = get_fallback_data()
    return MarketDataResponse(
        indicators=fallback,
        last_updated=now.isoformat(),
        source="fallback"
    )

@router.get("/indicator/{symbol}")
async def get_single_indicator(symbol: str):
    """Get a single market indicator by symbol"""
    async with httpx.AsyncClient() as client:
        result = await fetch_yahoo_finance_quote(symbol, client)
        if result:
            return MarketIndicator(**result)
    raise HTTPException(status_code=404, detail=f"Symbol {symbol} not found")
