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



# ==================== ECONOMIC INDICATORS ====================

ECONOMIC_INDICATORS = {
    "cash_rate": {
        "name": "RBA Cash Rate",
        "value": 4.35,
        "unit": "%",
        "source": "Reserve Bank of Australia",
        "last_updated": "2024-03-19",
        "trend": "holding"
    },
    "inflation_cpi": {
        "name": "CPI Inflation (Annual)",
        "value": 3.4,
        "unit": "%",
        "source": "ABS",
        "target_range": "2-3%"
    },
    "unemployment": {
        "name": "Unemployment Rate",
        "value": 3.7,
        "unit": "%",
        "source": "ABS"
    },
    "gdp_growth": {
        "name": "GDP Growth (Annual)",
        "value": 1.5,
        "unit": "%",
        "source": "ABS"
    },
    "10yr_bond": {
        "name": "10-Year Government Bond Yield",
        "value": 4.15,
        "unit": "%",
        "source": "RBA"
    }
}

SUPER_FUND_PERFORMANCE = {
    "growth": {"name": "Growth (70/30)", "1yr": 11.2, "5yr": 8.1, "10yr": 8.5},
    "balanced": {"name": "Balanced (50/50)", "1yr": 8.5, "5yr": 6.4, "10yr": 6.8},
    "conservative": {"name": "Conservative (30/70)", "1yr": 5.8, "5yr": 4.5, "10yr": 4.9},
    "high_growth": {"name": "High Growth (90/10)", "1yr": 14.5, "5yr": 9.2, "10yr": 9.8}
}

PENSION_RATE_HISTORY = [
    {"date": "2024-03-20", "single": 1116.30, "couple": 1682.80},
    {"date": "2023-09-20", "single": 1096.70, "couple": 1653.40},
    {"date": "2023-03-20", "single": 1064.00, "couple": 1604.00},
]


@router.get("/economic-indicators")
async def get_economic_indicators():
    """Get Australian economic indicators."""
    from datetime import datetime, timezone
    return {
        "indicators": ECONOMIC_INDICATORS,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": "RBA, ABS"
    }


@router.get("/super-performance")
async def get_super_performance():
    """Get superannuation fund performance benchmarks."""
    return {
        "options": SUPER_FUND_PERFORMANCE,
        "note": "Returns shown are after fees. Past performance is not indicative of future performance."
    }


@router.get("/pension-rates/history")
async def get_pension_rate_history():
    """Get historical Age Pension rate changes."""
    return {
        "history": PENSION_RATE_HISTORY,
        "next_indexation": "2024-09-20",
        "source": "Services Australia"
    }


@router.get("/pension-rates/forecast")
async def forecast_pension_rates(years: int = 5):
    """Forecast future pension rates based on inflation."""
    current = PENSION_RATE_HISTORY[0]
    inflation = 0.025
    from datetime import datetime
    
    forecasts = []
    for i in range(years + 1):
        factor = (1 + inflation) ** i
        forecasts.append({
            "year": datetime.now().year + i,
            "single_fortnightly": round(current["single"] * factor, 2),
            "single_annual": round(current["single"] * factor * 26, 2),
            "couple_fortnightly": round(current["couple"] * factor, 2),
            "couple_annual": round(current["couple"] * factor * 26, 2)
        })
    
    return {"forecasts": forecasts, "inflation_assumption": inflation}
