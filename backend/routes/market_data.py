"""
Live Market Data Routes
Real-time stock prices and market data.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging

from services.stock_prices import (
    get_stock_price,
    get_multiple_prices,
    get_market_indices,
    get_historical_prices,
    search_stocks,
    async_get_stock_price,
    async_get_multiple_prices
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/quote/{symbol}")
async def get_quote(symbol: str):
    """Get real-time quote for a stock."""
    try:
        data = await async_get_stock_price(symbol)
        if "error" in data:
            raise HTTPException(status_code=404, detail=data["error"])
        return data
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quotes")
async def get_quotes(symbols: List[str]):
    """Get real-time quotes for multiple stocks."""
    try:
        data = await async_get_multiple_prices(symbols)
        return {
            "quotes": data,
            "count": len(data),
            "symbols_requested": symbols
        }
    except Exception as e:
        logger.error(f"Error fetching multiple quotes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/indices")
async def get_indices():
    """Get major market indices."""
    try:
        return get_market_indices()
    except Exception as e:
        logger.error(f"Error fetching indices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{symbol}")
async def get_history(symbol: str, period: str = "1mo"):
    """
    Get historical price data.
    Periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    """
    valid_periods = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
    if period not in valid_periods:
        raise HTTPException(status_code=400, detail=f"Invalid period. Use: {valid_periods}")
    
    try:
        return get_historical_prices(symbol, period)
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search(query: str, market: str = "AU"):
    """Search for stocks by name or symbol."""
    if len(query) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    results = search_stocks(query, market)
    return {
        "query": query,
        "market": market,
        "results": results,
        "count": len(results)
    }


@router.get("/asx/top")
async def get_asx_top():
    """Get top ASX stocks."""
    symbols = [
        "CBA.AX", "BHP.AX", "CSL.AX", "NAB.AX", "WBC.AX",
        "ANZ.AX", "WES.AX", "WOW.AX", "MQG.AX", "RIO.AX"
    ]
    
    try:
        quotes = await async_get_multiple_prices(symbols)
        return {
            "stocks": list(quotes.values()),
            "count": len(quotes),
            "market": "ASX"
        }
    except Exception as e:
        logger.error(f"Error fetching ASX top: {e}")
        raise HTTPException(status_code=500, detail=str(e))
