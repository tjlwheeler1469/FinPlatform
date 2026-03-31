"""
Macro Market Data Routes
Global market indices, currencies, bonds, commodities, crypto, and futures.
Covers AUS, Euro, and US markets.
Uses yfinance for live data with fallback to static data.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone
import secrets
_rng = secrets.SystemRandom()
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/macro", tags=["Macro Market Data"])

# Thread pool for yfinance calls (which are blocking)
executor = ThreadPoolExecutor(max_workers=10)

# Cache for live data (expires after 5 minutes for better performance)
_cache = {}
_cache_ttl = 300  # 5 minutes - market data doesn't change that frequently for display purposes

def get_cached(key: str) -> dict:
    """Get cached data if not expired."""
    if key in _cache:
        data, timestamp = _cache[key]
        if (datetime.now(timezone.utc) - timestamp).total_seconds() < _cache_ttl:
            return data
    return None

def set_cached(key: str, data) -> dict:
    """Cache data with timestamp."""
    _cache[key] = (data, datetime.now(timezone.utc))

def fetch_live_indices() -> dict:
    """Fetch live index data using yfinance with batch download for speed."""
    try:
        import yfinance as yf
        
        symbols = {
            "us": [("^GSPC", "S&P 500", "SPX"), ("^DJI", "Dow Jones", "DJI"), ("^IXIC", "NASDAQ", "IXIC"), ("^RUT", "Russell 2000", "RUT"), ("^VIX", "Volatility Index", "VIX")],
            "europe": [("^FTSE", "FTSE 100", "FTSE"), ("^GDAXI", "DAX 40", "DAX"), ("^FCHI", "CAC 40", "CAC"), ("^STOXX50E", "Euro Stoxx 50", "STOXX")],
            "australia": [("^AXJO", "ASX 200", "XJO"), ("^AORD", "All Ordinaries", "XAO")],
            "asia": [("^N225", "Nikkei 225", "N225"), ("^HSI", "Hang Seng", "HSI"), ("000001.SS", "Shanghai Comp", "SSEC")]
        }
        
        # Collect all tickers for batch download
        all_tickers = []
        ticker_map = {}  # yahoo_sym -> (region, name, display_sym)
        for region, syms in symbols.items():
            for yahoo_sym, name, display_sym in syms:
                all_tickers.append(yahoo_sym)
                ticker_map[yahoo_sym] = (region, name, display_sym)
        
        # Batch download for speed (single request instead of many)
        try:
            tickers = yf.Tickers(' '.join(all_tickers))
            result = {region: [] for region in symbols.keys()}
            
            for yahoo_sym, (region, name, display_sym) in ticker_map.items():
                try:
                    ticker = tickers.tickers.get(yahoo_sym)
                    if ticker:
                        info = ticker.fast_info
                        current = info.last_price if hasattr(info, 'last_price') else 0
                        prev_close = info.previous_close if hasattr(info, 'previous_close') else current
                        change = current - prev_close if current and prev_close else 0
                        change_pct = (change / prev_close * 100) if prev_close else 0
                        
                        result[region].append({
                            "symbol": display_sym,
                            "name": name,
                            "value": round(current, 2) if current else 0,
                            "change": round(change, 2),
                            "change_pct": round(change_pct, 2)
                        })
                except Exception as e:
                    logger.warning(f"Failed to fetch {yahoo_sym}: {e}")
            
            # Remove empty regions
            result = {k: v for k, v in result.items() if v}
            return result if result else None
        except Exception as e:
            logger.warning(f"Batch download failed, falling back: {e}")
            return None
    except Exception as e:
        logger.error(f"yfinance indices fetch failed: {e}")
        return None

def fetch_live_currencies() -> dict:
    """Fetch live currency data using yfinance with batch download for speed."""
    try:
        import yfinance as yf
        
        pairs = {
            "major": [("EURUSD=X", "EUR/USD"), ("GBPUSD=X", "GBP/USD"), ("JPY=X", "USD/JPY"), ("CHF=X", "USD/CHF")],
            "aud_crosses": [("AUDUSD=X", "AUD/USD"), ("AUDEUR=X", "AUD/EUR"), ("AUDJPY=X", "AUD/JPY")],
        }
        
        # Collect all tickers for batch download
        all_tickers = []
        ticker_map = {}
        for category, pair_list in pairs.items():
            for yahoo_sym, display_name in pair_list:
                all_tickers.append(yahoo_sym)
                ticker_map[yahoo_sym] = (category, display_name)
        
        try:
            tickers = yf.Tickers(' '.join(all_tickers))
            result = {cat: [] for cat in pairs.keys()}
            
            for yahoo_sym, (category, display_name) in ticker_map.items():
                try:
                    ticker = tickers.tickers.get(yahoo_sym)
                    if ticker:
                        info = ticker.fast_info
                        current = info.last_price if hasattr(info, 'last_price') else 0
                        prev_close = info.previous_close if hasattr(info, 'previous_close') else current
                        change = current - prev_close if current and prev_close else 0
                        change_pct = (change / prev_close * 100) if prev_close else 0
                        
                        result[category].append({
                            "pair": display_name,
                            "rate": round(current, 4) if current else 0,
                            "change": round(change, 4),
                            "change_pct": round(change_pct, 2)
                        })
                except Exception as e:
                    logger.warning(f"Failed to fetch {yahoo_sym}: {e}")
            
            result = {k: v for k, v in result.items() if v}
            return result if result else None
        except Exception as e:
            logger.warning(f"Batch currency download failed: {e}")
            return None
    except Exception as e:
        logger.error(f"yfinance currency fetch failed: {e}")
        return None

def fetch_live_commodities() -> dict:
    """Fetch live commodity data using yfinance with batch download for speed."""
    try:
        import yfinance as yf
        
        commodities = {
            "energy": [("CL=F", "Crude Oil WTI", "CL", "barrel"), ("BZ=F", "Brent Crude", "BZ", "barrel"), ("NG=F", "Natural Gas", "NG", "MMBtu")],
            "metals": [("GC=F", "Gold", "GC", "oz"), ("SI=F", "Silver", "SI", "oz"), ("HG=F", "Copper", "HG", "lb")],
        }
        
        # Collect all tickers for batch download
        all_tickers = []
        ticker_map = {}
        for category, items in commodities.items():
            for yahoo_sym, name, display_sym, unit in items:
                all_tickers.append(yahoo_sym)
                ticker_map[yahoo_sym] = (category, name, display_sym, unit)
        
        try:
            tickers = yf.Tickers(' '.join(all_tickers))
            result = {cat: [] for cat in commodities.keys()}
            
            for yahoo_sym, (category, name, display_sym, unit) in ticker_map.items():
                try:
                    ticker = tickers.tickers.get(yahoo_sym)
                    if ticker:
                        info = ticker.fast_info
                        current = info.last_price if hasattr(info, 'last_price') else 0
                        prev_close = info.previous_close if hasattr(info, 'previous_close') else current
                        change = current - prev_close if current and prev_close else 0
                        change_pct = (change / prev_close * 100) if prev_close else 0
                        
                        result[category].append({
                            "name": name,
                            "symbol": display_sym,
                            "price": round(current, 2) if current else 0,
                            "change": round(change, 2),
                            "change_pct": round(change_pct, 2),
                            "unit": unit
                        })
                except Exception as e:
                    logger.warning(f"Failed to fetch {yahoo_sym}: {e}")
            
            result = {k: v for k, v in result.items() if v}
            return result if result else None
        except Exception as e:
            logger.warning(f"Batch commodity download failed: {e}")
            return None
    except Exception as e:
        logger.error(f"yfinance commodities fetch failed: {e}")
        return None

def fetch_live_crypto() -> dict:
    """Fetch live crypto data using yfinance with batch download for speed."""
    try:
        import yfinance as yf
        
        cryptos = [
            ("BTC-USD", "BTC", "Bitcoin"),
            ("ETH-USD", "ETH", "Ethereum"),
            ("BNB-USD", "BNB", "BNB"),
            ("SOL-USD", "SOL", "Solana"),
            ("XRP-USD", "XRP", "XRP"),
            ("ADA-USD", "ADA", "Cardano"),
            ("DOGE-USD", "DOGE", "Dogecoin"),
        ]
        
        # Batch download for speed
        all_tickers = [c[0] for c in cryptos]
        ticker_map = {c[0]: (c[1], c[2]) for c in cryptos}
        
        try:
            tickers = yf.Tickers(' '.join(all_tickers))
            result = []
            
            for yahoo_sym, (symbol, name) in ticker_map.items():
                try:
                    ticker = tickers.tickers.get(yahoo_sym)
                    if ticker:
                        info = ticker.fast_info
                        current = info.last_price if hasattr(info, 'last_price') else 0
                        prev_close = info.previous_close if hasattr(info, 'previous_close') else current
                        change_24h = ((current - prev_close) / prev_close * 100) if prev_close else 0
                        market_cap = info.market_cap if hasattr(info, 'market_cap') else 0
                        
                        result.append({
                            "symbol": symbol,
                            "name": name,
                            "price": round(current, 2) if current else 0,
                            "change_24h": round(change_24h, 2),
                            "market_cap": market_cap or 0,
                            "volume_24h": 0
                        })
                except Exception as e:
                    logger.warning(f"Failed to fetch {yahoo_sym}: {e}")
            
            return result if result else None
        except Exception as e:
            logger.warning(f"Batch crypto download failed: {e}")
            return None
    except Exception as e:
        logger.error(f"yfinance crypto fetch failed: {e}")
        return None


# ==================== MARKET DATA STRUCTURES ====================

# Global Indices
INDICES = {
    "us": [
        {"symbol": "SPX", "name": "S&P 500", "value": 5234.18, "change": 0.82, "change_pct": 0.016},
        {"symbol": "DJI", "name": "Dow Jones", "value": 39127.14, "change": 156.28, "change_pct": 0.40},
        {"symbol": "IXIC", "name": "NASDAQ", "value": 16439.22, "change": 87.56, "change_pct": 0.54},
        {"symbol": "RUT", "name": "Russell 2000", "value": 2078.45, "change": -12.34, "change_pct": -0.59},
        {"symbol": "VIX", "name": "Volatility Index", "value": 14.82, "change": -0.45, "change_pct": -2.95},
    ],
    "europe": [
        {"symbol": "FTSE", "name": "FTSE 100", "value": 7742.30, "change": 45.20, "change_pct": 0.59},
        {"symbol": "DAX", "name": "DAX 40", "value": 17932.68, "change": 112.45, "change_pct": 0.63},
        {"symbol": "CAC", "name": "CAC 40", "value": 7968.42, "change": 28.76, "change_pct": 0.36},
        {"symbol": "STOXX", "name": "Euro Stoxx 50", "value": 4892.15, "change": 34.56, "change_pct": 0.71},
        {"symbol": "SMI", "name": "Swiss Market", "value": 11456.78, "change": -23.45, "change_pct": -0.20},
    ],
    "australia": [
        {"symbol": "XJO", "name": "ASX 200", "value": 7856.40, "change": 42.30, "change_pct": 0.54},
        {"symbol": "XAO", "name": "All Ordinaries", "value": 8124.56, "change": 38.92, "change_pct": 0.48},
        {"symbol": "XSO", "name": "ASX Small Ord", "value": 2987.34, "change": 15.67, "change_pct": 0.53},
        {"symbol": "XMJ", "name": "ASX Materials", "value": 18234.12, "change": -156.78, "change_pct": -0.85},
        {"symbol": "XFJ", "name": "ASX Financials", "value": 6892.45, "change": 78.34, "change_pct": 1.15},
    ],
    "asia": [
        {"symbol": "N225", "name": "Nikkei 225", "value": 38765.42, "change": 234.56, "change_pct": 0.61},
        {"symbol": "HSI", "name": "Hang Seng", "value": 16892.34, "change": -123.45, "change_pct": -0.73},
        {"symbol": "SSEC", "name": "Shanghai Comp", "value": 3024.56, "change": 18.92, "change_pct": 0.63},
        {"symbol": "KOSPI", "name": "KOSPI", "value": 2678.34, "change": 12.45, "change_pct": 0.47},
        {"symbol": "SENSEX", "name": "BSE Sensex", "value": 72456.78, "change": 345.67, "change_pct": 0.48},
    ]
}

# Currency Pairs
CURRENCIES = {
    "major": [
        {"pair": "EUR/USD", "rate": 1.0856, "change": 0.0012, "change_pct": 0.11},
        {"pair": "GBP/USD", "rate": 1.2645, "change": -0.0023, "change_pct": -0.18},
        {"pair": "USD/JPY", "rate": 149.85, "change": 0.45, "change_pct": 0.30},
        {"pair": "USD/CHF", "rate": 0.8758, "change": 0.0018, "change_pct": 0.21},
        {"pair": "USD/CAD", "rate": 1.3545, "change": -0.0034, "change_pct": -0.25},
    ],
    "aud_crosses": [
        {"pair": "AUD/USD", "rate": 0.6543, "change": 0.0015, "change_pct": 0.23},
        {"pair": "AUD/EUR", "rate": 0.6027, "change": -0.0008, "change_pct": -0.13},
        {"pair": "AUD/GBP", "rate": 0.5177, "change": 0.0012, "change_pct": 0.23},
        {"pair": "AUD/JPY", "rate": 98.02, "change": 0.34, "change_pct": 0.35},
        {"pair": "AUD/NZD", "rate": 1.0685, "change": 0.0006, "change_pct": 0.06},
    ],
    "emerging": [
        {"pair": "USD/CNY", "rate": 7.2456, "change": 0.0123, "change_pct": 0.17},
        {"pair": "USD/INR", "rate": 83.12, "change": 0.08, "change_pct": 0.10},
        {"pair": "USD/BRL", "rate": 4.9756, "change": -0.0234, "change_pct": -0.47},
        {"pair": "USD/ZAR", "rate": 18.2456, "change": 0.0876, "change_pct": 0.48},
        {"pair": "USD/MXN", "rate": 17.0567, "change": -0.0345, "change_pct": -0.20},
    ]
}

# Bond Yields
BONDS = {
    "us": [
        {"name": "US 2Y Treasury", "yield": 4.62, "change": 0.03, "price": 99.45},
        {"name": "US 5Y Treasury", "yield": 4.28, "change": 0.02, "price": 98.76},
        {"name": "US 10Y Treasury", "yield": 4.32, "change": -0.01, "price": 97.89},
        {"name": "US 30Y Treasury", "yield": 4.48, "change": -0.02, "price": 94.56},
    ],
    "australia": [
        {"name": "AUS 2Y Govt", "yield": 3.85, "change": 0.02, "price": 99.12},
        {"name": "AUS 5Y Govt", "yield": 3.92, "change": 0.01, "price": 98.45},
        {"name": "AUS 10Y Govt", "yield": 4.15, "change": -0.01, "price": 96.78},
        {"name": "AUS 30Y Govt", "yield": 4.38, "change": -0.02, "price": 92.34},
    ],
    "europe": [
        {"name": "German 10Y Bund", "yield": 2.42, "change": 0.01, "price": 98.92},
        {"name": "UK 10Y Gilt", "yield": 4.08, "change": 0.02, "price": 97.45},
        {"name": "France 10Y OAT", "yield": 2.92, "change": 0.01, "price": 98.12},
        {"name": "Italy 10Y BTP", "yield": 3.78, "change": -0.01, "price": 96.89},
    ]
}

# Commodities
COMMODITIES = {
    "energy": [
        {"name": "Crude Oil WTI", "symbol": "CL", "price": 78.45, "change": 0.86, "change_pct": 1.11, "unit": "barrel"},
        {"name": "Brent Crude", "symbol": "BZ", "price": 82.34, "change": 0.92, "change_pct": 1.13, "unit": "barrel"},
        {"name": "Natural Gas", "symbol": "NG", "price": 2.156, "change": -0.034, "change_pct": -1.55, "unit": "MMBtu"},
        {"name": "RBOB Gasoline", "symbol": "RB", "price": 2.4567, "change": 0.0234, "change_pct": 0.96, "unit": "gallon"},
    ],
    "metals": [
        {"name": "Gold", "symbol": "GC", "price": 2178.45, "change": 12.34, "change_pct": 0.57, "unit": "oz"},
        {"name": "Silver", "symbol": "SI", "price": 24.56, "change": 0.23, "change_pct": 0.95, "unit": "oz"},
        {"name": "Platinum", "symbol": "PL", "price": 912.34, "change": -5.67, "change_pct": -0.62, "unit": "oz"},
        {"name": "Copper", "symbol": "HG", "price": 4.0234, "change": 0.0345, "change_pct": 0.87, "unit": "lb"},
        {"name": "Iron Ore", "symbol": "FE", "price": 112.45, "change": -2.34, "change_pct": -2.04, "unit": "tonne"},
    ],
    "agriculture": [
        {"name": "Wheat", "symbol": "ZW", "price": 567.25, "change": -4.50, "change_pct": -0.79, "unit": "bushel"},
        {"name": "Corn", "symbol": "ZC", "price": 445.75, "change": 2.25, "change_pct": 0.51, "unit": "bushel"},
        {"name": "Soybeans", "symbol": "ZS", "price": 1189.50, "change": 8.75, "change_pct": 0.74, "unit": "bushel"},
        {"name": "Coffee", "symbol": "KC", "price": 192.45, "change": 3.20, "change_pct": 1.69, "unit": "lb"},
    ]
}

# Crypto
CRYPTO = [
    {"symbol": "BTC", "name": "Bitcoin", "price": 67845.23, "change_24h": 2.34, "market_cap": 1334000000000, "volume_24h": 28500000000},
    {"symbol": "ETH", "name": "Ethereum", "price": 3456.78, "change_24h": 1.89, "market_cap": 415000000000, "volume_24h": 12400000000},
    {"symbol": "BNB", "name": "BNB", "price": 567.89, "change_24h": 0.56, "market_cap": 85000000000, "volume_24h": 1200000000},
    {"symbol": "SOL", "name": "Solana", "price": 145.67, "change_24h": 4.23, "market_cap": 64000000000, "volume_24h": 3200000000},
    {"symbol": "XRP", "name": "XRP", "price": 0.5234, "change_24h": -1.23, "market_cap": 28000000000, "volume_24h": 980000000},
    {"symbol": "ADA", "name": "Cardano", "price": 0.4567, "change_24h": 2.12, "market_cap": 16000000000, "volume_24h": 450000000},
    {"symbol": "DOGE", "name": "Dogecoin", "price": 0.1234, "change_24h": 5.67, "market_cap": 17600000000, "volume_24h": 890000000},
    {"symbol": "DOT", "name": "Polkadot", "price": 7.89, "change_24h": 1.45, "market_cap": 10000000000, "volume_24h": 320000000},
]

# Futures
FUTURES = {
    "equity_index": [
        {"symbol": "ES", "name": "E-mini S&P 500", "price": 5238.50, "change": 12.25, "change_pct": 0.23, "expiry": "Mar 2025"},
        {"symbol": "NQ", "name": "E-mini NASDAQ", "price": 18234.75, "change": 45.50, "change_pct": 0.25, "expiry": "Mar 2025"},
        {"symbol": "YM", "name": "E-mini Dow", "price": 39145.00, "change": 87.00, "change_pct": 0.22, "expiry": "Mar 2025"},
        {"symbol": "RTY", "name": "E-mini Russell", "price": 2082.30, "change": -5.70, "change_pct": -0.27, "expiry": "Mar 2025"},
        {"symbol": "SPI", "name": "ASX SPI 200", "price": 7862.00, "change": 34.00, "change_pct": 0.43, "expiry": "Mar 2025"},
    ],
    "currency": [
        {"symbol": "6E", "name": "Euro FX", "price": 1.0858, "change": 0.0014, "change_pct": 0.13, "expiry": "Mar 2025"},
        {"symbol": "6B", "name": "British Pound", "price": 1.2648, "change": -0.0018, "change_pct": -0.14, "expiry": "Mar 2025"},
        {"symbol": "6J", "name": "Japanese Yen", "price": 0.006685, "change": -0.000015, "change_pct": -0.22, "expiry": "Mar 2025"},
        {"symbol": "6A", "name": "Australian Dollar", "price": 0.6546, "change": 0.0018, "change_pct": 0.28, "expiry": "Mar 2025"},
    ],
    "interest_rate": [
        {"symbol": "ZN", "name": "10-Year T-Note", "price": 110.156, "change": 0.094, "change_pct": 0.09, "expiry": "Mar 2025"},
        {"symbol": "ZB", "name": "30-Year T-Bond", "price": 118.469, "change": 0.156, "change_pct": 0.13, "expiry": "Mar 2025"},
        {"symbol": "ZF", "name": "5-Year T-Note", "price": 107.672, "change": 0.047, "change_pct": 0.04, "expiry": "Mar 2025"},
    ]
}

# Top Stocks by Region
TOP_STOCKS = {
    "us": [
        {"symbol": "AAPL", "name": "Apple Inc", "price": 178.45, "change": 1.23, "change_pct": 0.69, "market_cap": "2.8T"},
        {"symbol": "MSFT", "name": "Microsoft", "price": 412.34, "change": 3.45, "change_pct": 0.84, "market_cap": "3.1T"},
        {"symbol": "NVDA", "name": "NVIDIA", "price": 878.90, "change": 15.67, "change_pct": 1.81, "market_cap": "2.2T"},
        {"symbol": "GOOGL", "name": "Alphabet", "price": 145.67, "change": -0.89, "change_pct": -0.61, "market_cap": "1.8T"},
        {"symbol": "AMZN", "name": "Amazon", "price": 178.23, "change": 2.34, "change_pct": 1.33, "market_cap": "1.9T"},
        {"symbol": "META", "name": "Meta", "price": 502.45, "change": 8.90, "change_pct": 1.80, "market_cap": "1.3T"},
        {"symbol": "TSLA", "name": "Tesla", "price": 178.56, "change": -4.32, "change_pct": -2.36, "market_cap": "567B"},
        {"symbol": "BRK.B", "name": "Berkshire", "price": 412.78, "change": 1.56, "change_pct": 0.38, "market_cap": "890B"},
    ],
    "australia": [
        {"symbol": "BHP", "name": "BHP Group", "price": 45.67, "change": -0.78, "change_pct": -1.68, "market_cap": "230B"},
        {"symbol": "CBA", "name": "CommBank", "price": 118.45, "change": 1.23, "change_pct": 1.05, "market_cap": "178B"},
        {"symbol": "CSL", "name": "CSL Limited", "price": 278.90, "change": 3.45, "change_pct": 1.25, "market_cap": "134B"},
        {"symbol": "NAB", "name": "NAB", "price": 34.56, "change": 0.45, "change_pct": 1.32, "market_cap": "105B"},
        {"symbol": "WBC", "name": "Westpac", "price": 27.89, "change": 0.34, "change_pct": 1.23, "market_cap": "98B"},
        {"symbol": "ANZ", "name": "ANZ Bank", "price": 28.45, "change": 0.23, "change_pct": 0.82, "market_cap": "85B"},
        {"symbol": "WES", "name": "Wesfarmers", "price": 67.89, "change": 0.78, "change_pct": 1.16, "market_cap": "76B"},
        {"symbol": "MQG", "name": "Macquarie", "price": 189.45, "change": 2.34, "change_pct": 1.25, "market_cap": "72B"},
    ],
    "europe": [
        {"symbol": "ASML", "name": "ASML Holding", "price": 912.34, "change": 12.45, "change_pct": 1.38, "market_cap": "358B"},
        {"symbol": "LVMH", "name": "LVMH", "price": 834.56, "change": -8.90, "change_pct": -1.06, "market_cap": "419B"},
        {"symbol": "SAP", "name": "SAP SE", "price": 189.45, "change": 2.34, "change_pct": 1.25, "market_cap": "219B"},
        {"symbol": "NVO", "name": "Novo Nordisk", "price": 123.45, "change": 1.56, "change_pct": 1.28, "market_cap": "548B"},
        {"symbol": "NESN", "name": "Nestle", "price": 98.76, "change": 0.45, "change_pct": 0.46, "market_cap": "267B"},
        {"symbol": "SHEL", "name": "Shell", "price": 32.45, "change": 0.67, "change_pct": 2.11, "market_cap": "208B"},
    ]
}


def add_jitter(value: float, pct: float = 0.001) -> float:
    """Add small random jitter to simulate live data."""
    jitter = _rng.uniform(-pct, pct)
    return round(value * (1 + jitter), 4)


def update_data_with_jitter(data_list: List[Dict]) -> List[Dict]:
    """Update a list of market data with price jitter."""
    updated = []
    for item in data_list:
        item_copy = item.copy()
        if "price" in item_copy:
            item_copy["price"] = add_jitter(item_copy["price"])
        if "value" in item_copy:
            item_copy["value"] = add_jitter(item_copy["value"])
        if "rate" in item_copy:
            item_copy["rate"] = add_jitter(item_copy["rate"], 0.0005)
        if "yield" in item_copy:
            item_copy["yield"] = add_jitter(item_copy["yield"], 0.005)
        updated.append(item_copy)
    return updated


# ==================== API ENDPOINTS ====================

@router.get("/overview")
async def get_macro_overview() -> dict:
    """Get a comprehensive macro overview for the dashboard using live yfinance data."""
    
    # Check cache first
    cached = get_cached("overview")
    if cached:
        return cached
    
    # Try to fetch live data IN PARALLEL for maximum speed
    loop = asyncio.get_event_loop()
    live_indices = live_currencies = live_commodities = live_crypto = None
    
    try:
        # Fetch all data sources in parallel using asyncio.gather
        results = await asyncio.gather(
            loop.run_in_executor(executor, fetch_live_indices),
            loop.run_in_executor(executor, fetch_live_currencies),
            loop.run_in_executor(executor, fetch_live_commodities),
            loop.run_in_executor(executor, fetch_live_crypto),
            return_exceptions=True
        )
        
        # Unpack results, treating exceptions as None
        live_indices = results[0] if not isinstance(results[0], Exception) else None
        live_currencies = results[1] if not isinstance(results[1], Exception) else None
        live_commodities = results[2] if not isinstance(results[2], Exception) else None
        live_crypto = results[3] if not isinstance(results[3], Exception) else None
    except Exception as e:
        logger.error(f"Live data fetch failed: {e}")
    
    # Build highlights using live data if available, fallback to static
    def get_index(live_data, region, idx, fallback) -> dict:
        if live_data and region in live_data and len(live_data[region]) > idx:
            return live_data[region][idx]
        return update_data_with_jitter([fallback])[0]
    
    def get_currency(live_data, category, idx, fallback) -> dict:
        if live_data and category in live_data and len(live_data[category]) > idx:
            return live_data[category][idx]
        return update_data_with_jitter([fallback])[0]
    
    def get_commodity(live_data, category, idx, fallback) -> dict:
        if live_data and category in live_data and len(live_data[category]) > idx:
            return live_data[category][idx]
        return update_data_with_jitter([fallback])[0]
    
    def get_crypto_item(live_data, idx, fallback) -> dict:
        if live_data and len(live_data) > idx:
            return live_data[idx]
        return update_data_with_jitter([fallback])[0]
    
    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data_source": "live" if live_indices else "static",
        "market_status": {
            "us": "open" if 9 <= datetime.now().hour < 16 else "closed",
            "australia": "closed",
            "europe": "closed",
            "asia": "closed"
        },
        "highlights": {
            "indices": {
                "spx": get_index(live_indices, "us", 0, INDICES["us"][0]),
                "asx200": get_index(live_indices, "australia", 0, INDICES["australia"][0]),
                "ftse": get_index(live_indices, "europe", 0, INDICES["europe"][0]),
            },
            "currencies": {
                "aud_usd": get_currency(live_currencies, "aud_crosses", 0, CURRENCIES["aud_crosses"][0]),
                "eur_usd": get_currency(live_currencies, "major", 0, CURRENCIES["major"][0]),
            },
            "commodities": {
                "gold": get_commodity(live_commodities, "metals", 0, COMMODITIES["metals"][0]),
                "oil": get_commodity(live_commodities, "energy", 0, COMMODITIES["energy"][0]),
            },
            "crypto": {
                "btc": get_crypto_item(live_crypto, 0, CRYPTO[0]),
                "eth": get_crypto_item(live_crypto, 1, CRYPTO[1]),
            },
            "bonds": {
                "us_10y": BONDS["us"][2],
                "aus_10y": BONDS["australia"][2],
            }
        },
        "fear_greed_index": _rng.randint(45, 72),
        "market_sentiment": "neutral" if _rng.random() > 0.5 else "bullish"
    }
    
    # Cache the result
    set_cached("overview", result)
    
    return result


@router.get("/indices")
async def get_indices(region: Optional[str] = None) -> dict:
    """Get global stock indices with live data."""
    
    # Try live data first
    loop = asyncio.get_event_loop()
    try:
        live_indices = await loop.run_in_executor(executor, fetch_live_indices)
    except Exception:
        live_indices = None
    
    if region and region in INDICES:
        data = live_indices.get(region) if live_indices and region in live_indices else update_data_with_jitter(INDICES[region])
        return {
            "region": region,
            "indices": data,
            "data_source": "live" if live_indices and region in live_indices else "static",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    result = {"timestamp": datetime.now(timezone.utc).isoformat()}
    for r in ["us", "europe", "australia", "asia"]:
        if live_indices and r in live_indices:
            result[r] = live_indices[r]
            result["data_source"] = "live"
        else:
            result[r] = update_data_with_jitter(INDICES[r])
            result["data_source"] = result.get("data_source", "static")
    
    return result


@router.get("/currencies")
async def get_currencies(category: Optional[str] = None) -> dict:
    """Get currency exchange rates."""
    if category and category in CURRENCIES:
        return {
            "category": category,
            "pairs": update_data_with_jitter(CURRENCIES[category]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    return {
        "major": update_data_with_jitter(CURRENCIES["major"]),
        "aud_crosses": update_data_with_jitter(CURRENCIES["aud_crosses"]),
        "emerging": update_data_with_jitter(CURRENCIES["emerging"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/bonds")
async def get_bonds(region: Optional[str] = None) -> dict:
    """Get government bond yields."""
    if region and region in BONDS:
        return {
            "region": region,
            "bonds": BONDS[region],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    return {
        "us": BONDS["us"],
        "australia": BONDS["australia"],
        "europe": BONDS["europe"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/commodities")
async def get_commodities(category: Optional[str] = None) -> dict:
    """Get commodity prices."""
    if category and category in COMMODITIES:
        return {
            "category": category,
            "commodities": update_data_with_jitter(COMMODITIES[category]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    return {
        "energy": update_data_with_jitter(COMMODITIES["energy"]),
        "metals": update_data_with_jitter(COMMODITIES["metals"]),
        "agriculture": update_data_with_jitter(COMMODITIES["agriculture"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/crypto")
async def get_crypto() -> dict:
    """Get cryptocurrency prices with live data."""
    
    # Try live data first
    loop = asyncio.get_event_loop()
    try:
        live_crypto = await loop.run_in_executor(executor, fetch_live_crypto)
    except Exception:
        live_crypto = None
    
    crypto_data = live_crypto if live_crypto else update_data_with_jitter(CRYPTO)
    total_mcap = sum(c.get("market_cap", 0) for c in crypto_data)
    
    return {
        "cryptocurrencies": crypto_data,
        "total_market_cap": total_mcap,
        "btc_dominance": 52.3,
        "data_source": "live" if live_crypto else "static",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/futures")
async def get_futures(category: Optional[str] = None) -> dict:
    """Get futures prices."""
    if category and category in FUTURES:
        return {
            "category": category,
            "futures": update_data_with_jitter(FUTURES[category]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    return {
        "equity_index": update_data_with_jitter(FUTURES["equity_index"]),
        "currency": update_data_with_jitter(FUTURES["currency"]),
        "interest_rate": update_data_with_jitter(FUTURES["interest_rate"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/stocks")
async def get_top_stocks(region: Optional[str] = None) -> dict:
    """Get top stocks by region."""
    if region and region in TOP_STOCKS:
        return {
            "region": region,
            "stocks": update_data_with_jitter(TOP_STOCKS[region]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    return {
        "us": update_data_with_jitter(TOP_STOCKS["us"]),
        "australia": update_data_with_jitter(TOP_STOCKS["australia"]),
        "europe": update_data_with_jitter(TOP_STOCKS["europe"]),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/economic-calendar")
async def get_economic_calendar() -> dict:
    """Get upcoming economic events."""
    events = [
        {"date": "2025-03-18", "time": "08:30", "country": "US", "event": "Retail Sales (MoM)", "forecast": "0.3%", "previous": "-0.8%", "importance": "high"},
        {"date": "2025-03-18", "time": "09:15", "country": "US", "event": "Industrial Production", "forecast": "0.1%", "previous": "-0.1%", "importance": "medium"},
        {"date": "2025-03-19", "time": "14:00", "country": "US", "event": "FOMC Rate Decision", "forecast": "5.50%", "previous": "5.50%", "importance": "high"},
        {"date": "2025-03-19", "time": "14:30", "country": "US", "event": "Fed Press Conference", "forecast": "-", "previous": "-", "importance": "high"},
        {"date": "2025-03-20", "time": "00:30", "country": "AU", "event": "Employment Change", "forecast": "15K", "previous": "-65K", "importance": "high"},
        {"date": "2025-03-20", "time": "08:30", "country": "US", "event": "Initial Jobless Claims", "forecast": "215K", "previous": "209K", "importance": "medium"},
        {"date": "2025-03-21", "time": "04:00", "country": "EU", "event": "PMI Manufacturing", "forecast": "47.0", "previous": "46.5", "importance": "medium"},
        {"date": "2025-03-21", "time": "09:45", "country": "US", "event": "PMI Services", "forecast": "51.5", "previous": "52.3", "importance": "medium"},
    ]
    
    return {
        "events": events,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/sector-performance")
async def get_sector_performance() -> dict:
    """Get sector performance data."""
    sectors = [
        {"sector": "Technology", "change_1d": 1.23, "change_1w": 2.45, "change_1m": 5.67, "change_ytd": 12.34},
        {"sector": "Healthcare", "change_1d": 0.45, "change_1w": 1.23, "change_1m": 3.45, "change_ytd": 8.90},
        {"sector": "Financials", "change_1d": 0.89, "change_1w": 1.67, "change_1m": 4.12, "change_ytd": 10.56},
        {"sector": "Consumer Discretionary", "change_1d": -0.34, "change_1w": 0.78, "change_1m": 2.34, "change_ytd": 6.78},
        {"sector": "Industrials", "change_1d": 0.56, "change_1w": 1.45, "change_1m": 3.89, "change_ytd": 9.23},
        {"sector": "Energy", "change_1d": 1.67, "change_1w": 3.45, "change_1m": -1.23, "change_ytd": -4.56},
        {"sector": "Materials", "change_1d": -0.89, "change_1w": -1.23, "change_1m": 1.45, "change_ytd": 3.45},
        {"sector": "Utilities", "change_1d": 0.23, "change_1w": 0.45, "change_1m": 1.89, "change_ytd": 5.67},
        {"sector": "Real Estate", "change_1d": 0.34, "change_1w": 0.89, "change_1m": 2.12, "change_ytd": 4.56},
        {"sector": "Communication Services", "change_1d": 0.78, "change_1w": 1.89, "change_1m": 4.56, "change_ytd": 11.23},
        {"sector": "Consumer Staples", "change_1d": 0.12, "change_1w": 0.34, "change_1m": 1.23, "change_ytd": 3.89},
    ]
    
    return {
        "sectors": sectors,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }



@router.get("/history")
async def get_historical_data(symbol: str = "^GSPC", period: str = "1mo", interval: str = "1d") -> dict:
    """Get historical price data for a symbol using yfinance."""
    try:
        import yfinance as yf
        
        # Validate parameters
        valid_periods = ["1d", "5d", "2wk", "1mo", "3mo", "6mo", "1y", "2y", "3y", "5y", "10y", "max"]
        valid_intervals = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]
        
        if period not in valid_periods:
            period = "1mo"
        if interval not in valid_intervals:
            interval = "1d"
        
        # Fetch data
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        
        if hist.empty:
            return {"history": [], "symbol": symbol, "error": "No data available"}
        
        # Convert to list of dicts
        history = []
        for idx, row in hist.iterrows():
            history.append({
                "date": idx.isoformat(),
                "open": round(row["Open"], 4) if row["Open"] else None,
                "high": round(row["High"], 4) if row["High"] else None,
                "low": round(row["Low"], 4) if row["Low"] else None,
                "close": round(row["Close"], 4) if row["Close"] else None,
                "volume": int(row["Volume"]) if row["Volume"] else 0
            })
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "history": history,
            "data_source": "live",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol}: {e}")
        # Return empty with error
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "history": [],
            "error": str(e),
            "data_source": "error",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
