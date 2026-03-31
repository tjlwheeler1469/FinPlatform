"""
Stock Research & Screener Routes
ASX stock screening, intrinsic value analysis, and broker research.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone
import secrets
_rng = secrets.SystemRandom()
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/research", tags=["Stock Research"])

# ASX Stock Data (sample of 50 stocks)
ASX_STOCKS = {
    "BHP": {"name": "BHP Group", "sector": "Materials", "market_cap": 225000000000, "pe": 12.5, "dividend_yield": 5.2, "price": 45.20, "moat": "wide"},
    "CBA": {"name": "Commonwealth Bank", "sector": "Financials", "market_cap": 180000000000, "pe": 18.2, "dividend_yield": 3.8, "price": 108.50, "moat": "wide"},
    "CSL": {"name": "CSL Limited", "sector": "Healthcare", "market_cap": 130000000000, "pe": 35.5, "dividend_yield": 1.2, "price": 285.00, "moat": "wide"},
    "NAB": {"name": "National Australia Bank", "sector": "Financials", "market_cap": 95000000000, "pe": 14.8, "dividend_yield": 4.5, "price": 32.80, "moat": "narrow"},
    "WBC": {"name": "Westpac", "sector": "Financials", "market_cap": 80000000000, "pe": 13.5, "dividend_yield": 5.0, "price": 24.50, "moat": "narrow"},
    "ANZ": {"name": "ANZ Bank", "sector": "Financials", "market_cap": 75000000000, "pe": 12.8, "dividend_yield": 5.5, "price": 28.20, "moat": "narrow"},
    "WES": {"name": "Wesfarmers", "sector": "Consumer Discretionary", "market_cap": 72000000000, "pe": 28.5, "dividend_yield": 2.8, "price": 62.50, "moat": "wide"},
    "MQG": {"name": "Macquarie Group", "sector": "Financials", "market_cap": 68000000000, "pe": 15.2, "dividend_yield": 3.2, "price": 185.20, "moat": "wide"},
    "WOW": {"name": "Woolworths", "sector": "Consumer Staples", "market_cap": 45000000000, "pe": 22.5, "dividend_yield": 2.5, "price": 35.80, "moat": "wide"},
    "RIO": {"name": "Rio Tinto", "sector": "Materials", "market_cap": 42000000000, "pe": 8.5, "dividend_yield": 6.8, "price": 115.50, "moat": "wide"},
    "FMG": {"name": "Fortescue Metals", "sector": "Materials", "market_cap": 38000000000, "pe": 6.2, "dividend_yield": 8.5, "price": 19.80, "moat": "narrow"},
    "TCL": {"name": "Transurban", "sector": "Industrials", "market_cap": 35000000000, "pe": 45.0, "dividend_yield": 4.2, "price": 13.20, "moat": "wide"},
    "GMG": {"name": "Goodman Group", "sector": "Real Estate", "market_cap": 32000000000, "pe": 28.5, "dividend_yield": 1.5, "price": 22.50, "moat": "narrow"},
    "ALL": {"name": "Aristocrat Leisure", "sector": "Consumer Discretionary", "market_cap": 28000000000, "pe": 22.8, "dividend_yield": 1.8, "price": 42.80, "moat": "narrow"},
    "COL": {"name": "Coles Group", "sector": "Consumer Staples", "market_cap": 24000000000, "pe": 20.5, "dividend_yield": 3.5, "price": 18.20, "moat": "narrow"},
    "STO": {"name": "Santos", "sector": "Energy", "market_cap": 22000000000, "pe": 9.5, "dividend_yield": 4.5, "price": 7.85, "moat": "narrow"},
    "WDS": {"name": "Woodside Energy", "sector": "Energy", "market_cap": 55000000000, "pe": 11.2, "dividend_yield": 7.5, "price": 28.50, "moat": "narrow"},
    "TLS": {"name": "Telstra", "sector": "Communication Services", "market_cap": 42000000000, "pe": 22.5, "dividend_yield": 4.2, "price": 3.85, "moat": "narrow"},
    "REA": {"name": "REA Group", "sector": "Communication Services", "market_cap": 22000000000, "pe": 52.0, "dividend_yield": 1.0, "price": 185.50, "moat": "wide"},
    "SHL": {"name": "Sonic Healthcare", "sector": "Healthcare", "market_cap": 15000000000, "pe": 18.5, "dividend_yield": 3.2, "price": 32.50, "moat": "narrow"},
    "QBE": {"name": "QBE Insurance", "sector": "Financials", "market_cap": 18000000000, "pe": 14.5, "dividend_yield": 3.0, "price": 15.80, "moat": "none"},
    "SUN": {"name": "Suncorp", "sector": "Financials", "market_cap": 16000000000, "pe": 15.2, "dividend_yield": 5.0, "price": 14.20, "moat": "none"},
    "IAG": {"name": "Insurance Australia", "sector": "Financials", "market_cap": 12000000000, "pe": 16.8, "dividend_yield": 4.5, "price": 6.25, "moat": "none"},
    "ORG": {"name": "Origin Energy", "sector": "Energy", "market_cap": 14000000000, "pe": 12.5, "dividend_yield": 4.0, "price": 8.95, "moat": "none"},
    "MIN": {"name": "Mineral Resources", "sector": "Materials", "market_cap": 12000000000, "pe": 8.5, "dividend_yield": 2.5, "price": 58.50, "moat": "narrow"},
    "NCM": {"name": "Newcrest Mining", "sector": "Materials", "market_cap": 22000000000, "pe": 18.5, "dividend_yield": 1.5, "price": 26.80, "moat": "narrow"},
    "CPU": {"name": "Computershare", "sector": "Information Technology", "market_cap": 14000000000, "pe": 18.5, "dividend_yield": 2.0, "price": 25.50, "moat": "narrow"},
    "XRO": {"name": "Xero", "sector": "Information Technology", "market_cap": 18000000000, "pe": 85.0, "dividend_yield": 0.0, "price": 125.50, "moat": "narrow"},
    "WTC": {"name": "WiseTech Global", "sector": "Information Technology", "market_cap": 22000000000, "pe": 95.0, "dividend_yield": 0.2, "price": 72.50, "moat": "wide"},
    "ASX": {"name": "ASX Limited", "sector": "Financials", "market_cap": 12000000000, "pe": 28.5, "dividend_yield": 3.2, "price": 62.50, "moat": "wide"},
    "AGL": {"name": "AGL Energy", "sector": "Utilities", "market_cap": 8500000000, "pe": 15.5, "dividend_yield": 5.5, "price": 12.80, "moat": "none"},
    "AMP": {"name": "AMP Limited", "sector": "Financials", "market_cap": 4500000000, "pe": 12.5, "dividend_yield": 3.5, "price": 1.25, "moat": "none"},
    "APT": {"name": "Afterpay (Block)", "sector": "Information Technology", "market_cap": 8500000000, "pe": 0.0, "dividend_yield": 0.0, "price": 85.50, "moat": "narrow"},
    "TWE": {"name": "Treasury Wine", "sector": "Consumer Staples", "market_cap": 9500000000, "pe": 22.5, "dividend_yield": 2.5, "price": 12.50, "moat": "narrow"},
    "A2M": {"name": "a2 Milk Company", "sector": "Consumer Staples", "market_cap": 4500000000, "pe": 28.5, "dividend_yield": 0.0, "price": 6.25, "moat": "narrow"},
    "JBH": {"name": "JB Hi-Fi", "sector": "Consumer Discretionary", "market_cap": 5500000000, "pe": 12.5, "dividend_yield": 5.5, "price": 52.80, "moat": "narrow"},
    "HVN": {"name": "Harvey Norman", "sector": "Consumer Discretionary", "market_cap": 5200000000, "pe": 10.5, "dividend_yield": 6.0, "price": 4.85, "moat": "none"},
    "ORA": {"name": "Orora Limited", "sector": "Materials", "market_cap": 3800000000, "pe": 15.5, "dividend_yield": 4.2, "price": 3.25, "moat": "none"},
    "SGP": {"name": "Stockland", "sector": "Real Estate", "market_cap": 9500000000, "pe": 12.5, "dividend_yield": 5.8, "price": 4.25, "moat": "none"},
    "GPT": {"name": "GPT Group", "sector": "Real Estate", "market_cap": 8500000000, "pe": 14.5, "dividend_yield": 5.5, "price": 4.65, "moat": "none"},
    "MGR": {"name": "Mirvac Group", "sector": "Real Estate", "market_cap": 9200000000, "pe": 15.5, "dividend_yield": 4.8, "price": 2.35, "moat": "none"},
    "DXS": {"name": "Dexus", "sector": "Real Estate", "market_cap": 8500000000, "pe": 12.5, "dividend_yield": 6.5, "price": 8.25, "moat": "none"},
    "SCG": {"name": "Scentre Group", "sector": "Real Estate", "market_cap": 15000000000, "pe": 18.5, "dividend_yield": 5.0, "price": 2.95, "moat": "narrow"},
    "VCX": {"name": "Vicinity Centres", "sector": "Real Estate", "market_cap": 8500000000, "pe": 16.5, "dividend_yield": 5.5, "price": 1.95, "moat": "none"},
    "LLC": {"name": "Lendlease", "sector": "Real Estate", "market_cap": 6500000000, "pe": 22.5, "dividend_yield": 2.5, "price": 9.85, "moat": "none"},
    "QAN": {"name": "Qantas Airways", "sector": "Industrials", "market_cap": 9500000000, "pe": 8.5, "dividend_yield": 2.5, "price": 6.25, "moat": "narrow"},
    "SYD": {"name": "Sydney Airport", "sector": "Industrials", "market_cap": 22000000000, "pe": 45.0, "dividend_yield": 3.5, "price": 8.75, "moat": "wide"},
    "AZJ": {"name": "Aurizon Holdings", "sector": "Industrials", "market_cap": 8500000000, "pe": 15.5, "dividend_yield": 5.5, "price": 4.25, "moat": "narrow"},
    "SEK": {"name": "Seek Limited", "sector": "Communication Services", "market_cap": 9500000000, "pe": 35.5, "dividend_yield": 1.5, "price": 28.50, "moat": "narrow"},
    "CAR": {"name": "Carsales.com", "sector": "Communication Services", "market_cap": 8500000000, "pe": 42.5, "dividend_yield": 1.8, "price": 28.50, "moat": "wide"},
}


class ScreenerRequest(BaseModel):
    sectors: Optional[List[str]] = None
    min_market_cap: Optional[float] = None
    max_market_cap: Optional[float] = None
    min_pe: Optional[float] = None
    max_pe: Optional[float] = None
    min_dividend_yield: Optional[float] = None
    max_dividend_yield: Optional[float] = None
    moat_rating: Optional[List[str]] = None  # wide, narrow, none
    sort_by: str = "market_cap"
    sort_order: str = "desc"
    limit: int = 20


@router.post("/screener")
async def screen_stocks(request: ScreenerRequest):
    """
    Screen ASX stocks with multiple filters.
    
    Filters:
    - Sectors (Materials, Financials, Healthcare, etc.)
    - Market cap range
    - P/E ratio range
    - Dividend yield range
    - Moat rating (wide, narrow, none)
    """
    filtered = []
    
    for ticker, data in ASX_STOCKS.items():
        # Apply filters
        if request.sectors and data["sector"] not in request.sectors:
            continue
        if request.min_market_cap and data["market_cap"] < request.min_market_cap:
            continue
        if request.max_market_cap and data["market_cap"] > request.max_market_cap:
            continue
        if request.min_pe and data["pe"] < request.min_pe:
            continue
        if request.max_pe and data["pe"] > request.max_pe:
            continue
        if request.min_dividend_yield and data["dividend_yield"] < request.min_dividend_yield:
            continue
        if request.max_dividend_yield and data["dividend_yield"] > request.max_dividend_yield:
            continue
        if request.moat_rating and data["moat"] not in request.moat_rating:
            continue
        
        # Add random daily change
        change = _rng.uniform(-3, 3)
        
        filtered.append({
            "ticker": ticker,
            **data,
            "market_cap_formatted": f"${data['market_cap'] / 1e9:.1f}B",
            "change_percent": round(change, 2),
            "change_direction": "up" if change > 0 else "down"
        })
    
    # Sort results
    reverse = request.sort_order == "desc"
    sort_key = request.sort_by if request.sort_by in ["market_cap", "pe", "dividend_yield", "price"] else "market_cap"
    filtered.sort(key=lambda x: x.get(sort_key, 0), reverse=reverse)
    
    # Apply limit
    filtered = filtered[:request.limit]
    
    return {
        "stocks": filtered,
        "total": len(filtered),
        "filters_applied": {
            "sectors": request.sectors,
            "market_cap": f"${request.min_market_cap or 0:,.0f} - ${request.max_market_cap or 999999999999:,.0f}",
            "moat": request.moat_rating
        },
        "sectors_available": list(set(s["sector"] for s in ASX_STOCKS.values())),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/stock/{ticker}")
async def get_stock_details(ticker: str):
    """Get detailed stock information."""
    ticker = ticker.upper()
    if ticker not in ASX_STOCKS:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")
    
    stock = ASX_STOCKS[ticker]
    
    # Calculate intrinsic value (simplified DCF)
    if stock["pe"] > 0:
        earnings_per_share = stock["price"] / stock["pe"]
        growth_rate = 0.05 if stock["moat"] == "wide" else 0.03 if stock["moat"] == "narrow" else 0.02
        discount_rate = 0.10
        intrinsic_value = earnings_per_share * (1 + growth_rate) / (discount_rate - growth_rate)
    else:
        intrinsic_value = stock["price"]
    
    margin_of_safety = ((intrinsic_value - stock["price"]) / intrinsic_value) * 100
    
    return {
        "ticker": ticker,
        **stock,
        "market_cap_formatted": f"${stock['market_cap'] / 1e9:.1f}B",
        "intrinsic_value": round(intrinsic_value, 2),
        "margin_of_safety": round(margin_of_safety, 1),
        "valuation": "undervalued" if margin_of_safety > 15 else "fairly_valued" if margin_of_safety > -15 else "overvalued",
        "moat_analysis": {
            "rating": stock["moat"],
            "factors": _get_moat_factors(stock["moat"], stock["sector"])
        },
        "analyst_consensus": {
            "rating": _rng.choice(["buy", "hold", "sell"]),
            "target_price": round(stock["price"] * _rng.uniform(0.9, 1.3), 2),
            "analysts_count": _rng.randint(5, 25)
        },
        "key_metrics": {
            "pe_ratio": stock["pe"],
            "dividend_yield": stock["dividend_yield"],
            "price": stock["price"],
            "52w_high": round(stock["price"] * 1.2, 2),
            "52w_low": round(stock["price"] * 0.75, 2)
        }
    }


def _get_moat_factors(moat: str, sector: str) -> List[Dict]:
    """Generate moat factors based on rating."""
    if moat == "wide":
        return [
            {"factor": "Brand Strength", "score": 9, "description": "Strong brand recognition and customer loyalty"},
            {"factor": "Network Effects", "score": 8, "description": "Benefits from network effects"},
            {"factor": "Cost Advantages", "score": 7, "description": "Sustainable cost advantages"},
            {"factor": "Switching Costs", "score": 8, "description": "High customer switching costs"}
        ]
    elif moat == "narrow":
        return [
            {"factor": "Brand Strength", "score": 6, "description": "Moderate brand recognition"},
            {"factor": "Cost Advantages", "score": 5, "description": "Some cost advantages"},
            {"factor": "Switching Costs", "score": 5, "description": "Moderate switching costs"}
        ]
    else:
        return [
            {"factor": "Competitive Position", "score": 4, "description": "Limited competitive advantages"},
            {"factor": "Industry Dynamics", "score": 3, "description": "Competitive industry environment"}
        ]


@router.get("/intrinsic-values")
async def get_intrinsic_values(
    sector: Optional[str] = None,
    min_margin: float = Query(default=-100, description="Minimum margin of safety %"),
    limit: int = 20
):
    """Get intrinsic value analysis for all stocks."""
    results = []
    
    for ticker, stock in ASX_STOCKS.items():
        if sector and stock["sector"] != sector:
            continue
        
        # Calculate intrinsic value
        if stock["pe"] > 0:
            eps = stock["price"] / stock["pe"]
            growth = 0.05 if stock["moat"] == "wide" else 0.03 if stock["moat"] == "narrow" else 0.02
            intrinsic = eps * (1 + growth) / (0.10 - growth)
        else:
            intrinsic = stock["price"]
        
        margin = ((intrinsic - stock["price"]) / intrinsic) * 100
        
        if margin >= min_margin:
            results.append({
                "ticker": ticker,
                "name": stock["name"],
                "sector": stock["sector"],
                "price": stock["price"],
                "intrinsic_value": round(intrinsic, 2),
                "margin_of_safety": round(margin, 1),
                "moat": stock["moat"],
                "pe": stock["pe"],
                "dividend_yield": stock["dividend_yield"]
            })
    
    # Sort by margin of safety (highest first)
    results.sort(key=lambda x: x["margin_of_safety"], reverse=True)
    
    return {
        "stocks": results[:limit],
        "total": len(results),
        "average_margin": round(sum(r["margin_of_safety"] for r in results) / len(results) if results else 0, 1),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/dividends/calendar")
async def get_dividend_calendar(month: Optional[int] = None, year: Optional[int] = None):
    """Get dividend calendar with upcoming payments."""
    now = datetime.now()
    month = month or now.month
    year = year or now.year
    
    # Generate dividend calendar
    dividends = []
    for ticker, stock in ASX_STOCKS.items():
        if stock["dividend_yield"] > 0:
            # Random ex-div date in the month
            ex_div_day = _rng.randint(1, 28)
            payment_day = min(ex_div_day + 14, 28)
            
            # Calculate dividend amount
            annual_dividend = stock["price"] * (stock["dividend_yield"] / 100)
            dividend_per_share = annual_dividend / 2  # Semi-annual
            
            if _rng.random() > 0.5:  # 50% chance to be in this month
                dividends.append({
                    "ticker": ticker,
                    "name": stock["name"],
                    "ex_dividend_date": f"{year}-{month:02d}-{ex_div_day:02d}",
                    "payment_date": f"{year}-{month:02d}-{payment_day:02d}",
                    "dividend_per_share": round(dividend_per_share, 4),
                    "franking": _rng.choice([100, 100, 100, 50, 0]),  # Most are 100%
                    "yield": stock["dividend_yield"],
                    "frequency": "semi-annual"
                })
    
    # Sort by ex-dividend date
    dividends.sort(key=lambda x: x["ex_dividend_date"])
    
    return {
        "month": month,
        "year": year,
        "dividends": dividends,
        "total_companies": len(dividends),
        "total_dividends_value": sum(d["dividend_per_share"] for d in dividends)
    }


@router.get("/market-alerts")
async def get_market_alerts():
    """Get market alerts and news."""
    alerts = [
        {
            "id": "alert_1",
            "type": "price_alert",
            "severity": "high",
            "ticker": "BHP",
            "title": "BHP breaks 52-week high",
            "message": "BHP has broken through its 52-week high of $45.00",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "alert_2",
            "type": "dividend",
            "severity": "medium",
            "ticker": "CBA",
            "title": "CBA Dividend Declaration",
            "message": "CBA declared interim dividend of $2.15 per share",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "alert_3",
            "type": "earnings",
            "severity": "high",
            "ticker": "CSL",
            "title": "CSL Earnings Beat",
            "message": "CSL reported earnings 8% above consensus",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "alert_4",
            "type": "sector",
            "severity": "medium",
            "ticker": None,
            "title": "Materials Sector Rally",
            "message": "Materials sector up 2.3% on iron ore price surge",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "alert_5",
            "type": "macro",
            "severity": "high",
            "ticker": None,
            "title": "RBA Rate Decision",
            "message": "RBA holds rates steady at 4.35%",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    return {
        "alerts": alerts,
        "unread_count": len(alerts),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/sectors")
async def get_sector_breakdown():
    """Get market sector breakdown and performance."""
    sectors = {}
    
    for ticker, stock in ASX_STOCKS.items():
        sector = stock["sector"]
        if sector not in sectors:
            sectors[sector] = {
                "stocks": [],
                "total_market_cap": 0,
                "avg_pe": 0,
                "avg_yield": 0
            }
        sectors[sector]["stocks"].append(ticker)
        sectors[sector]["total_market_cap"] += stock["market_cap"]
    
    # Calculate averages
    sector_data = []
    for sector, data in sectors.items():
        sector_stocks = [ASX_STOCKS[t] for t in data["stocks"]]
        avg_pe = sum(s["pe"] for s in sector_stocks if s["pe"] > 0) / len([s for s in sector_stocks if s["pe"] > 0]) if any(s["pe"] > 0 for s in sector_stocks) else 0
        avg_yield = sum(s["dividend_yield"] for s in sector_stocks) / len(sector_stocks)
        
        sector_data.append({
            "sector": sector,
            "stock_count": len(data["stocks"]),
            "total_market_cap": data["total_market_cap"],
            "market_cap_formatted": f"${data['total_market_cap'] / 1e9:.1f}B",
            "avg_pe": round(avg_pe, 1),
            "avg_dividend_yield": round(avg_yield, 1),
            "change_percent": round(_rng.uniform(-2, 3), 2),
            "top_stocks": data["stocks"][:5]
        })
    
    # Sort by market cap
    sector_data.sort(key=lambda x: x["total_market_cap"], reverse=True)
    
    return {
        "sectors": sector_data,
        "total_market_cap": sum(s["total_market_cap"] for s in sector_data),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
