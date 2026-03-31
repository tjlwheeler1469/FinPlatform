"""
Market Data Routes
Real-time market data, stock quotes, and indices using Yahoo Finance.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market", tags=["Market Data"])

# Import market data service
try:
    from services.market_data import MarketDataService
    market_service = MarketDataService()
except ImportError as e:
    logger.warning(f"Market data service not available: {e}")
    market_service = None


class PortfolioValueRequest(BaseModel):
    holdings: List[Dict[str, Any]]


class StockSearchRequest(BaseModel):
    query: str
    limit: int = 10


@router.get("/quote/{symbol}")
async def get_stock_quote(symbol: str):
    """Get real-time stock quote."""
    try:
        if market_service:
            quote = await market_service.get_quote(symbol)
            return quote
        else:
            # Mock response
            return get_mock_quote(symbol)
    except Exception as e:
        logger.error(f"Error fetching quote for {symbol}: {e}")
        return get_mock_quote(symbol)


@router.get("/indices")
async def get_market_indices():
    """Get major market indices."""
    try:
        if market_service:
            indices = await market_service.get_indices()
            return indices
        else:
            return get_mock_indices()
    except Exception as e:
        logger.error(f"Error fetching indices: {e}")
        return get_mock_indices()


@router.get("/history/{symbol}")
async def get_price_history(
    symbol: str,
    period: str = "1y",
    interval: str = "1d"
):
    """Get historical price data."""
    try:
        if market_service:
            history = await market_service.get_history(symbol, period, interval)
            return history
        else:
            return {"symbol": symbol, "period": period, "data": []}
    except Exception as e:
        logger.error(f"Error fetching history for {symbol}: {e}")
        return {"symbol": symbol, "period": period, "data": [], "error": str(e)}


@router.post("/portfolio-value")
async def calculate_portfolio_value(request: PortfolioValueRequest):
    """Calculate real-time portfolio value."""
    total_value = 0
    total_cost = 0
    positions = []
    
    for holding in request.holdings:
        symbol = holding.get("symbol", "")
        units = holding.get("units", holding.get("quantity", 0))
        cost_basis = holding.get("cost_basis", holding.get("purchase_price", 0))
        
        try:
            if market_service:
                quote = await market_service.get_quote(symbol)
                current_price = quote.get("price", 0)
                name = quote.get("name", symbol)
            else:
                mock_quote = get_mock_quote(symbol)
                current_price = mock_quote.get("price", 0)
                name = mock_quote.get("name", symbol)
            
            market_value = current_price * units
            cost_value = cost_basis * units
            gain_loss = market_value - cost_value
            gain_loss_percent = (gain_loss / cost_value * 100) if cost_value > 0 else 0
            
            total_value += market_value
            total_cost += cost_value
            
            positions.append({
                "symbol": symbol,
                "name": name,
                "units": units,
                "current_price": current_price,
                "cost_basis": cost_basis,
                "market_value": market_value,
                "gain_loss": gain_loss,
                "gain_loss_percent": gain_loss_percent,
                "day_change_percent": mock_quote.get("change_percent", 0) if not market_service else 0,
                "weight": 0  # Will be calculated below
            })
        except Exception as e:
            logger.error(f"Error calculating value for {symbol}: {e}")
            positions.append({
                "symbol": symbol,
                "name": symbol,
                "units": units,
                "current_price": 0,
                "market_value": 0,
                "gain_loss": 0,
                "gain_loss_percent": 0,
                "day_change_percent": 0,
                "weight": 0,
                "error": str(e)
            })
    
    # Calculate weights
    for position in positions:
        if total_value > 0:
            position["weight"] = (position.get("market_value", 0) / total_value) * 100
    
    total_gain_loss = total_value - total_cost
    total_return_percent = (total_gain_loss / total_cost * 100) if total_cost > 0 else 0
    
    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "total_gain_loss": total_gain_loss,
        "total_return_percent": total_return_percent,
        "positions": positions,
        "calculated_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/search")
async def search_stocks(query: str, limit: int = 10):
    """Search for stocks by name or symbol."""
    try:
        if market_service:
            results = await market_service.search(query, limit)
            return results
        else:
            return get_mock_search_results(query)
    except Exception as e:
        logger.error(f"Error searching for {query}: {e}")
        return {"query": query, "results": []}


@router.get("/sectors")
async def get_sector_performance():
    """Get sector ETF performance."""
    try:
        if market_service:
            sectors = await market_service.get_sectors()
            return sectors
        else:
            return get_mock_sectors()
    except Exception as e:
        logger.error(f"Error fetching sectors: {e}")
        return get_mock_sectors()


@router.get("/news/{symbol}")
async def get_stock_news(symbol: str, limit: int = 5):
    """Get news for a stock."""
    return {
        "symbol": symbol,
        "news": [
            {
                "title": f"Latest update on {symbol}",
                "source": "Market Watch",
                "date": datetime.now(timezone.utc).isoformat(),
                "summary": "Market analysts remain optimistic about the stock's performance."
            }
        ]
    }


# Mock data functions
def get_mock_quote(symbol: str) -> Dict[str, Any]:
    """Get mock quote data."""
    mock_prices = {
        "CBA.AX": {"price": 118.50, "change": 1.25, "change_percent": 1.07, "name": "Commonwealth Bank"},
        "BHP.AX": {"price": 42.80, "change": -0.45, "change_percent": -1.04, "name": "BHP Group"},
        "VAS.AX": {"price": 96.50, "change": 0.80, "change_percent": 0.84, "name": "Vanguard Australian Shares ETF"},
        "CSL.AX": {"price": 298.00, "change": 3.20, "change_percent": 1.09, "name": "CSL Limited"},
        "WBC.AX": {"price": 26.80, "change": 0.15, "change_percent": 0.56, "name": "Westpac Banking"},
        "TLS.AX": {"price": 4.05, "change": 0.02, "change_percent": 0.50, "name": "Telstra Group"},
        "WOW.AX": {"price": 31.20, "change": -0.30, "change_percent": -0.95, "name": "Woolworths Group"},
        "AAPL": {"price": 182.50, "change": 2.30, "change_percent": 1.28, "name": "Apple Inc"},
        "MSFT": {"price": 378.90, "change": 4.50, "change_percent": 1.20, "name": "Microsoft Corp"},
        "GOOGL": {"price": 141.20, "change": 1.80, "change_percent": 1.29, "name": "Alphabet Inc"}
    }
    
    if symbol in mock_prices:
        return {
            "symbol": symbol,
            **mock_prices[symbol],
            "currency": "AUD" if ".AX" in symbol else "USD",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    return {
        "symbol": symbol,
        "price": 100.00,
        "change": 0.00,
        "change_percent": 0.00,
        "name": symbol,
        "currency": "AUD" if ".AX" in symbol else "USD",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def get_mock_indices() -> Dict[str, Any]:
    """Get mock market indices."""
    return {
        "indices": [
            {"symbol": "^AXJO", "name": "S&P/ASX 200", "value": 8245.30, "change": 45.20, "change_percent": 0.55},
            {"symbol": "^GSPC", "name": "S&P 500", "value": 5892.50, "change": 28.40, "change_percent": 0.48},
            {"symbol": "^DJI", "name": "Dow Jones", "value": 42850.00, "change": 185.30, "change_percent": 0.43},
            {"symbol": "^IXIC", "name": "NASDAQ", "value": 19250.80, "change": 125.60, "change_percent": 0.66},
            {"symbol": "^FTSE", "name": "FTSE 100", "value": 8420.50, "change": -12.30, "change_percent": -0.15},
            {"symbol": "^N225", "name": "Nikkei 225", "value": 39850.20, "change": 320.40, "change_percent": 0.81}
        ],
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


def get_mock_sectors() -> Dict[str, Any]:
    """Get mock sector performance."""
    return {
        "sectors": [
            {"name": "Financials", "etf": "XLF", "change_percent": 0.85, "ytd": 12.3},
            {"name": "Technology", "etf": "XLK", "change_percent": 1.20, "ytd": 18.5},
            {"name": "Healthcare", "etf": "XLV", "change_percent": 0.45, "ytd": 8.2},
            {"name": "Energy", "etf": "XLE", "change_percent": -0.65, "ytd": 5.8},
            {"name": "Materials", "etf": "XLB", "change_percent": 0.30, "ytd": 4.2},
            {"name": "Consumer Discretionary", "etf": "XLY", "change_percent": 0.95, "ytd": 15.1},
            {"name": "Utilities", "etf": "XLU", "change_percent": 0.15, "ytd": 3.5},
            {"name": "Real Estate", "etf": "XLRE", "change_percent": 0.55, "ytd": 6.8}
        ],
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


def get_mock_search_results(query: str) -> Dict[str, Any]:
    """Get mock search results."""
    all_stocks = [
        {"symbol": "CBA.AX", "name": "Commonwealth Bank of Australia", "type": "stock", "exchange": "ASX"},
        {"symbol": "BHP.AX", "name": "BHP Group Limited", "type": "stock", "exchange": "ASX"},
        {"symbol": "CSL.AX", "name": "CSL Limited", "type": "stock", "exchange": "ASX"},
        {"symbol": "VAS.AX", "name": "Vanguard Australian Shares ETF", "type": "etf", "exchange": "ASX"},
        {"symbol": "AAPL", "name": "Apple Inc", "type": "stock", "exchange": "NASDAQ"},
        {"symbol": "MSFT", "name": "Microsoft Corporation", "type": "stock", "exchange": "NASDAQ"}
    ]
    
    query_lower = query.lower()
    results = [s for s in all_stocks if query_lower in s["symbol"].lower() or query_lower in s["name"].lower()]
    
    return {"query": query, "results": results[:10]}
