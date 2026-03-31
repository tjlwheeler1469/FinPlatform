"""
Real-time Market Data Service using Yahoo Finance
Provides live stock prices, portfolio tracking, and market analysis.
"""
import yfinance as yf
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Cache for market data (TTL: 5 minutes)
MARKET_CACHE: Dict[str, Dict] = {}
CACHE_TTL_SECONDS = 300

# Thread pool for async yfinance calls
executor = ThreadPoolExecutor(max_workers=4)


def get_stock_price(symbol: str) -> Dict[str, Any]:
    """
    Get real-time stock price for a symbol.
    Supports ASX (add .AX suffix), US markets, and global stocks.
    """
    cache_key = f"price_{symbol}"
    
    # Check cache
    if cache_key in MARKET_CACHE:
        cached = MARKET_CACHE[cache_key]
        if (datetime.now(timezone.utc) - datetime.fromisoformat(cached["cached_at"])).seconds < CACHE_TTL_SECONDS:
            return cached["data"]
    
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get current price
        current_price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose", 0)
        previous_close = info.get("previousClose", current_price)
        
        change = current_price - previous_close
        change_pct = (change / previous_close * 100) if previous_close else 0
        
        data = {
            "symbol": symbol,
            "name": info.get("shortName") or info.get("longName", symbol),
            "current_price": round(current_price, 2),
            "previous_close": round(previous_close, 2),
            "change": round(change, 2),
            "change_percent": round(change_pct, 2),
            "day_high": info.get("dayHigh", 0),
            "day_low": info.get("dayLow", 0),
            "volume": info.get("volume", 0),
            "market_cap": info.get("marketCap", 0),
            "pe_ratio": info.get("trailingPE"),
            "dividend_yield": info.get("dividendYield"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
            "currency": info.get("currency", "AUD"),
            "exchange": info.get("exchange", ""),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
        # Cache the result
        MARKET_CACHE[cache_key] = {
            "data": data,
            "cached_at": datetime.now(timezone.utc).isoformat()
        }
        
        return data
        
    except Exception as e:
        return {
            "symbol": symbol,
            "error": str(e),
            "current_price": 0,
            "change_percent": 0
        }


def get_stock_history(symbol: str, period: str = "1mo") -> Dict[str, Any]:
    """
    Get historical price data for a symbol.
    Periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    """
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        if hist.empty:
            return {"symbol": symbol, "error": "No data available", "history": []}
        
        history = []
        for date, row in hist.iterrows():
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"])
            })
        
        # Calculate returns
        if len(history) >= 2:
            start_price = history[0]["close"]
            end_price = history[-1]["close"]
            total_return = ((end_price - start_price) / start_price) * 100
        else:
            total_return = 0
        
        return {
            "symbol": symbol,
            "period": period,
            "total_return": round(total_return, 2),
            "data_points": len(history),
            "history": history
        }
        
    except Exception as e:
        return {"symbol": symbol, "error": str(e), "history": []}


def get_portfolio_value(holdings: List[Dict]) -> Dict[str, Any]:
    """
    Calculate real-time portfolio value from holdings.
    
    holdings format: [{"symbol": "VAS.AX", "units": 100, "cost_basis": 95.00}, ...]
    """
    portfolio_value = 0
    total_cost = 0
    positions = []
    
    for holding in holdings:
        symbol = holding.get("symbol", "")
        units = holding.get("units", 0)
        cost_basis = holding.get("cost_basis", 0)
        
        # Get current price
        price_data = get_stock_price(symbol)
        current_price = price_data.get("current_price", 0)
        
        if current_price > 0:
            market_value = units * current_price
            cost_value = units * cost_basis
            gain_loss = market_value - cost_value
            gain_loss_pct = (gain_loss / cost_value * 100) if cost_value > 0 else 0
            
            positions.append({
                "symbol": symbol,
                "name": price_data.get("name", symbol),
                "units": units,
                "cost_basis": cost_basis,
                "current_price": current_price,
                "market_value": round(market_value, 2),
                "cost_value": round(cost_value, 2),
                "gain_loss": round(gain_loss, 2),
                "gain_loss_percent": round(gain_loss_pct, 2),
                "day_change_percent": price_data.get("change_percent", 0),
                "weight": 0  # Will calculate after total
            })
            
            portfolio_value += market_value
            total_cost += cost_value
    
    # Calculate weights
    for position in positions:
        position["weight"] = round((position["market_value"] / portfolio_value * 100) if portfolio_value > 0 else 0, 2)
    
    # Sort by weight descending
    positions.sort(key=lambda x: x["weight"], reverse=True)
    
    total_gain_loss = portfolio_value - total_cost
    total_return_pct = (total_gain_loss / total_cost * 100) if total_cost > 0 else 0
    
    return {
        "total_value": round(portfolio_value, 2),
        "total_cost": round(total_cost, 2),
        "total_gain_loss": round(total_gain_loss, 2),
        "total_return_percent": round(total_return_pct, 2),
        "positions_count": len(positions),
        "positions": positions,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


def get_market_indices() -> Dict[str, Any]:
    """
    Get major market indices for dashboard display.
    """
    indices = [
        {"symbol": "^AXJO", "name": "ASX 200"},
        {"symbol": "^GSPC", "name": "S&P 500"},
        {"symbol": "^DJI", "name": "Dow Jones"},
        {"symbol": "^IXIC", "name": "NASDAQ"},
        {"symbol": "^FTSE", "name": "FTSE 100"},
        {"symbol": "^N225", "name": "Nikkei 225"},
    ]
    
    results = []
    for idx in indices:
        try:
            data = get_stock_price(idx["symbol"])
            results.append({
                "symbol": idx["symbol"],
                "name": idx["name"],
                "value": data.get("current_price", 0),
                "change": data.get("change", 0),
                "change_percent": data.get("change_percent", 0)
            })
        except Exception:
            results.append({
                "symbol": idx["symbol"],
                "name": idx["name"],
                "value": 0,
                "change": 0,
                "change_percent": 0
            })
    
    return {
        "indices": results,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


def get_sector_performance() -> Dict[str, Any]:
    """
    Get sector ETF performance for sector analysis.
    Using Australian sector ETFs.
    """
    sectors = [
        {"symbol": "VAS.AX", "name": "Australian Shares", "sector": "Broad Market"},
        {"symbol": "VGS.AX", "name": "International Shares", "sector": "Global"},
        {"symbol": "VAF.AX", "name": "Fixed Interest", "sector": "Bonds"},
        {"symbol": "VAP.AX", "name": "Property", "sector": "Real Estate"},
        {"symbol": "VGE.AX", "name": "Emerging Markets", "sector": "Emerging"},
        {"symbol": "VDHG.AX", "name": "Diversified High Growth", "sector": "Diversified"},
    ]
    
    results = []
    for sector in sectors:
        try:
            data = get_stock_price(sector["symbol"])
            hist = get_stock_history(sector["symbol"], "1y")
            
            results.append({
                "symbol": sector["symbol"],
                "name": sector["name"],
                "sector": sector["sector"],
                "current_price": data.get("current_price", 0),
                "day_change": data.get("change_percent", 0),
                "ytd_return": hist.get("total_return", 0)
            })
        except Exception:
            results.append({
                "symbol": sector["symbol"],
                "name": sector["name"],
                "sector": sector["sector"],
                "current_price": 0,
                "day_change": 0,
                "ytd_return": 0
            })
    
    return {
        "sectors": results,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


def search_stocks(query: str, limit: int = 10) -> List[Dict]:
    """
    Search for stocks by name or symbol.
    """
    # Common Australian and US stocks for search
    common_stocks = [
        {"symbol": "BHP.AX", "name": "BHP Group", "exchange": "ASX"},
        {"symbol": "CBA.AX", "name": "Commonwealth Bank", "exchange": "ASX"},
        {"symbol": "CSL.AX", "name": "CSL Limited", "exchange": "ASX"},
        {"symbol": "NAB.AX", "name": "National Australia Bank", "exchange": "ASX"},
        {"symbol": "WBC.AX", "name": "Westpac Banking", "exchange": "ASX"},
        {"symbol": "ANZ.AX", "name": "ANZ Group", "exchange": "ASX"},
        {"symbol": "WES.AX", "name": "Wesfarmers", "exchange": "ASX"},
        {"symbol": "WOW.AX", "name": "Woolworths Group", "exchange": "ASX"},
        {"symbol": "TLS.AX", "name": "Telstra", "exchange": "ASX"},
        {"symbol": "RIO.AX", "name": "Rio Tinto", "exchange": "ASX"},
        {"symbol": "VAS.AX", "name": "Vanguard Australian Shares", "exchange": "ASX"},
        {"symbol": "VGS.AX", "name": "Vanguard International Shares", "exchange": "ASX"},
        {"symbol": "AAPL", "name": "Apple Inc", "exchange": "NASDAQ"},
        {"symbol": "MSFT", "name": "Microsoft", "exchange": "NASDAQ"},
        {"symbol": "GOOGL", "name": "Alphabet (Google)", "exchange": "NASDAQ"},
        {"symbol": "AMZN", "name": "Amazon", "exchange": "NASDAQ"},
        {"symbol": "TSLA", "name": "Tesla", "exchange": "NASDAQ"},
        {"symbol": "META", "name": "Meta Platforms", "exchange": "NASDAQ"},
        {"symbol": "NVDA", "name": "NVIDIA", "exchange": "NASDAQ"},
    ]
    
    query_lower = query.lower()
    results = [
        stock for stock in common_stocks
        if query_lower in stock["symbol"].lower() or query_lower in stock["name"].lower()
    ]
    
    return results[:limit]


def get_dividend_calendar(symbols: List[str]) -> Dict[str, Any]:
    """
    Get upcoming dividend dates for portfolio holdings.
    """
    dividends = []
    
    for symbol in symbols:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            div_yield = info.get("dividendYield", 0)
            div_rate = info.get("dividendRate", 0)
            ex_date = info.get("exDividendDate")
            
            if div_rate and div_rate > 0:
                dividends.append({
                    "symbol": symbol,
                    "name": info.get("shortName", symbol),
                    "dividend_yield": round((div_yield or 0) * 100, 2),
                    "annual_dividend": round(div_rate, 2),
                    "ex_dividend_date": datetime.fromtimestamp(ex_date).isoformat() if ex_date else None,
                    "payment_frequency": "Quarterly" if div_rate > 0 else "None"
                })
        except Exception:
            pass
    
    # Sort by ex-dividend date
    dividends.sort(key=lambda x: x.get("ex_dividend_date") or "9999", reverse=False)
    
    return {
        "dividends": dividends,
        "total_annual_income": sum(d.get("annual_dividend", 0) for d in dividends),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


def get_portfolio_allocation(holdings: List[Dict]) -> Dict[str, Any]:
    """
    Analyze portfolio allocation by sector, geography, and asset class.
    """
    portfolio = get_portfolio_value(holdings)
    
    # Asset class mapping (simplified)
    asset_classes = {
        "VAS.AX": "Australian Equities",
        "VGS.AX": "International Equities",
        "VAF.AX": "Fixed Income",
        "VAP.AX": "Property",
        "VGE.AX": "Emerging Markets",
        "VDHG.AX": "Diversified",
    }
    
    allocation = {}
    for position in portfolio.get("positions", []):
        symbol = position.get("symbol", "")
        asset_class = asset_classes.get(symbol, "Other")
        
        if asset_class not in allocation:
            allocation[asset_class] = {
                "value": 0,
                "weight": 0,
                "positions": []
            }
        
        allocation[asset_class]["value"] += position.get("market_value", 0)
        allocation[asset_class]["positions"].append(position)
    
    # Calculate weights
    total = portfolio.get("total_value", 1)
    for asset_class in allocation:
        allocation[asset_class]["weight"] = round(allocation[asset_class]["value"] / total * 100, 2)
    
    return {
        "total_value": portfolio.get("total_value", 0),
        "allocation": allocation,
        "positions_count": len(portfolio.get("positions", [])),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
