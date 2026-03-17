"""
Real-Time Stock Price Service
Fetches live prices from Yahoo Finance for ASX and US stocks.
"""
import yfinance as yf
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from functools import lru_cache
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

# Thread pool for async yfinance calls
executor = ThreadPoolExecutor(max_workers=10)

# Cache for stock data (5 minute TTL)
_price_cache: Dict[str, Dict] = {}
_cache_expiry: Dict[str, datetime] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes


def _is_cache_valid(symbol: str) -> bool:
    """Check if cached data is still valid."""
    if symbol not in _cache_expiry:
        return False
    return datetime.now(timezone.utc) < _cache_expiry[symbol]


def _update_cache(symbol: str, data: Dict):
    """Update cache with new data."""
    _price_cache[symbol] = data
    _cache_expiry[symbol] = datetime.now(timezone.utc) + timedelta(seconds=CACHE_TTL_SECONDS)


def get_stock_price(symbol: str) -> Dict:
    """
    Get real-time stock price for a symbol.
    Supports ASX (add .AX suffix) and US stocks.
    """
    # Check cache first
    if _is_cache_valid(symbol):
        return _price_cache[symbol]
    
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get current price
        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose', 0)
        previous_close = info.get('previousClose', current_price)
        
        # Calculate change
        change = current_price - previous_close
        change_pct = (change / previous_close * 100) if previous_close else 0
        
        data = {
            "symbol": symbol,
            "name": info.get('shortName') or info.get('longName', symbol),
            "current_price": round(current_price, 2),
            "previous_close": round(previous_close, 2),
            "change": round(change, 2),
            "change_percent": round(change_pct, 2),
            "day_high": round(info.get('dayHigh', current_price), 2),
            "day_low": round(info.get('dayLow', current_price), 2),
            "volume": info.get('volume', 0),
            "market_cap": info.get('marketCap', 0),
            "pe_ratio": info.get('trailingPE'),
            "dividend_yield": info.get('dividendYield'),
            "52_week_high": round(info.get('fiftyTwoWeekHigh', 0), 2),
            "52_week_low": round(info.get('fiftyTwoWeekLow', 0), 2),
            "currency": info.get('currency', 'AUD' if '.AX' in symbol else 'USD'),
            "exchange": info.get('exchange', 'ASX' if '.AX' in symbol else 'NYSE'),
            "sector": info.get('sector'),
            "industry": info.get('industry'),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "is_live": True
        }
        
        _update_cache(symbol, data)
        return data
        
    except Exception as e:
        logger.warning(f"Error fetching price for {symbol}: {e}")
        # Return cached data if available, even if expired
        if symbol in _price_cache:
            cached = _price_cache[symbol].copy()
            cached["is_live"] = False
            cached["cache_note"] = "Using cached data due to API error"
            return cached
        
        return {
            "symbol": symbol,
            "error": str(e),
            "is_live": False
        }


def get_multiple_prices(symbols: List[str]) -> Dict[str, Dict]:
    """Get prices for multiple symbols efficiently."""
    results = {}
    
    # Check cache first
    uncached_symbols = []
    for symbol in symbols:
        if _is_cache_valid(symbol):
            results[symbol] = _price_cache[symbol]
        else:
            uncached_symbols.append(symbol)
    
    # Fetch uncached symbols
    if uncached_symbols:
        try:
            # Use yfinance download for batch
            tickers = yf.Tickers(' '.join(uncached_symbols))
            
            for symbol in uncached_symbols:
                try:
                    ticker = tickers.tickers.get(symbol)
                    if ticker:
                        info = ticker.info
                        current_price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose', 0)
                        previous_close = info.get('previousClose', current_price)
                        change = current_price - previous_close
                        change_pct = (change / previous_close * 100) if previous_close else 0
                        
                        data = {
                            "symbol": symbol,
                            "name": info.get('shortName', symbol),
                            "current_price": round(current_price, 2),
                            "previous_close": round(previous_close, 2),
                            "change": round(change, 2),
                            "change_percent": round(change_pct, 2),
                            "volume": info.get('volume', 0),
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "is_live": True
                        }
                        _update_cache(symbol, data)
                        results[symbol] = data
                except Exception as e:
                    logger.warning(f"Error processing {symbol}: {e}")
                    results[symbol] = {"symbol": symbol, "error": str(e), "is_live": False}
                    
        except Exception as e:
            logger.error(f"Batch fetch error: {e}")
            for symbol in uncached_symbols:
                results[symbol] = get_stock_price(symbol)
    
    return results


def get_market_indices() -> Dict[str, Dict]:
    """Get major market indices."""
    indices = {
        "^AXJO": "S&P/ASX 200",
        "^AORD": "All Ordinaries",
        "^GSPC": "S&P 500",
        "^DJI": "Dow Jones",
        "^IXIC": "NASDAQ",
        "^FTSE": "FTSE 100"
    }
    
    results = {}
    for symbol, name in indices.items():
        try:
            data = get_stock_price(symbol)
            data["index_name"] = name
            results[symbol] = data
        except Exception as e:
            results[symbol] = {"symbol": symbol, "index_name": name, "error": str(e)}
    
    return results


def get_historical_prices(symbol: str, period: str = "1mo") -> Dict:
    """
    Get historical price data.
    Periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    """
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period)
        
        if hist.empty:
            return {"symbol": symbol, "error": "No data available"}
        
        # Convert to list of dicts
        prices = []
        for date, row in hist.iterrows():
            prices.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"])
            })
        
        return {
            "symbol": symbol,
            "period": period,
            "data_points": len(prices),
            "prices": prices,
            "start_date": prices[0]["date"] if prices else None,
            "end_date": prices[-1]["date"] if prices else None
        }
        
    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {e}")
        return {"symbol": symbol, "error": str(e)}


def search_stocks(query: str, market: str = "AU") -> List[Dict]:
    """Search for stocks by name or symbol."""
    # Common ASX stocks for search
    asx_stocks = {
        "CBA.AX": "Commonwealth Bank of Australia",
        "BHP.AX": "BHP Group Limited",
        "CSL.AX": "CSL Limited",
        "NAB.AX": "National Australia Bank",
        "WBC.AX": "Westpac Banking Corporation",
        "ANZ.AX": "ANZ Group Holdings",
        "WES.AX": "Wesfarmers Limited",
        "WOW.AX": "Woolworths Group Limited",
        "MQG.AX": "Macquarie Group Limited",
        "TLS.AX": "Telstra Corporation",
        "RIO.AX": "Rio Tinto Limited",
        "FMG.AX": "Fortescue Metals Group",
        "NCM.AX": "Newcrest Mining",
        "STO.AX": "Santos Limited",
        "WDS.AX": "Woodside Energy",
        "ALL.AX": "Aristocrat Leisure",
        "REA.AX": "REA Group",
        "XRO.AX": "Xero Limited",
        "MIN.AX": "Mineral Resources",
        "JHX.AX": "James Hardie Industries",
        "VAS.AX": "Vanguard Australian Shares ETF",
        "VGS.AX": "Vanguard MSCI International ETF",
        "A200.AX": "BetaShares Australia 200 ETF",
        "IVV.AX": "iShares S&P 500 ETF",
        "NDQ.AX": "BetaShares NASDAQ 100 ETF"
    }
    
    us_stocks = {
        "AAPL": "Apple Inc",
        "MSFT": "Microsoft Corporation",
        "GOOGL": "Alphabet Inc",
        "AMZN": "Amazon.com Inc",
        "NVDA": "NVIDIA Corporation",
        "META": "Meta Platforms Inc",
        "TSLA": "Tesla Inc",
        "BRK-B": "Berkshire Hathaway",
        "JPM": "JPMorgan Chase",
        "V": "Visa Inc",
        "JNJ": "Johnson & Johnson",
        "UNH": "UnitedHealth Group",
        "MA": "Mastercard Inc",
        "PG": "Procter & Gamble",
        "HD": "Home Depot",
        "DIS": "Walt Disney",
        "NFLX": "Netflix Inc",
        "ADBE": "Adobe Inc",
        "CRM": "Salesforce Inc",
        "PYPL": "PayPal Holdings"
    }
    
    stocks = asx_stocks if market == "AU" else us_stocks
    query_lower = query.lower()
    
    results = []
    for symbol, name in stocks.items():
        if query_lower in symbol.lower() or query_lower in name.lower():
            results.append({
                "symbol": symbol,
                "name": name,
                "market": "ASX" if ".AX" in symbol else "US"
            })
    
    return results[:10]  # Limit to 10 results


# Async wrapper for use in FastAPI
async def async_get_stock_price(symbol: str) -> Dict:
    """Async wrapper for get_stock_price."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, get_stock_price, symbol)


async def async_get_multiple_prices(symbols: List[str]) -> Dict[str, Dict]:
    """Async wrapper for get_multiple_prices."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, get_multiple_prices, symbols)
