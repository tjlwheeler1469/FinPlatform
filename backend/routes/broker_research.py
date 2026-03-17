"""
Broker Research Reports
Stock research, analyst ratings, price targets, and investment recommendations.
For both Personal and Adviser modes.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/research", tags=["Broker Research"])


# Sample broker research data
BROKER_RESEARCH = {
    "AAPL": {
        "symbol": "AAPL",
        "company": "Apple Inc",
        "sector": "Technology",
        "current_price": 178.45,
        "consensus_rating": "Buy",
        "consensus_score": 4.2,  # Out of 5
        "price_target": {
            "mean": 198.50,
            "high": 225.00,
            "low": 165.00,
            "median": 195.00
        },
        "analyst_coverage": 42,
        "ratings_breakdown": {
            "strong_buy": 18,
            "buy": 12,
            "hold": 10,
            "sell": 2,
            "strong_sell": 0
        },
        "recent_reports": [
            {"broker": "Morgan Stanley", "rating": "Overweight", "target": 210, "date": "2025-03-15", "analyst": "Erik Woodring"},
            {"broker": "Goldman Sachs", "rating": "Buy", "target": 198, "date": "2025-03-12", "analyst": "Michael Ng"},
            {"broker": "JPMorgan", "rating": "Overweight", "target": 205, "date": "2025-03-10", "analyst": "Samik Chatterjee"},
        ],
        "key_metrics": {
            "pe_ratio": 28.5,
            "forward_pe": 24.2,
            "peg_ratio": 2.8,
            "ev_ebitda": 22.1,
            "dividend_yield": 0.55,
            "revenue_growth": 8.2,
            "eps_growth": 12.4
        },
        "investment_thesis": "Apple continues to dominate the premium smartphone market with strong services growth. The company's ecosystem lock-in and brand loyalty provide pricing power and recurring revenue streams.",
        "risks": ["China exposure", "Regulatory scrutiny", "Smartphone market saturation"],
        "catalysts": ["AI integration", "Services growth", "New product categories"]
    },
    "MSFT": {
        "symbol": "MSFT",
        "company": "Microsoft Corporation",
        "sector": "Technology",
        "current_price": 412.34,
        "consensus_rating": "Strong Buy",
        "consensus_score": 4.6,
        "price_target": {
            "mean": 465.00,
            "high": 520.00,
            "low": 380.00,
            "median": 460.00
        },
        "analyst_coverage": 48,
        "ratings_breakdown": {
            "strong_buy": 28,
            "buy": 14,
            "hold": 6,
            "sell": 0,
            "strong_sell": 0
        },
        "recent_reports": [
            {"broker": "UBS", "rating": "Buy", "target": 480, "date": "2025-03-14", "analyst": "Karl Keirstead"},
            {"broker": "Citi", "rating": "Buy", "target": 470, "date": "2025-03-11", "analyst": "Tyler Radke"},
            {"broker": "Barclays", "rating": "Overweight", "target": 455, "date": "2025-03-08", "analyst": "Raimo Lenschow"},
        ],
        "key_metrics": {
            "pe_ratio": 36.2,
            "forward_pe": 30.5,
            "peg_ratio": 2.1,
            "ev_ebitda": 24.8,
            "dividend_yield": 0.72,
            "revenue_growth": 15.8,
            "eps_growth": 18.2
        },
        "investment_thesis": "Microsoft's Azure cloud platform and AI integration via OpenAI partnership position it as a key beneficiary of enterprise digital transformation and AI adoption.",
        "risks": ["Cloud competition", "Antitrust concerns", "Valuation"],
        "catalysts": ["AI monetization", "Azure growth", "Gaming segment expansion"]
    },
    "BHP": {
        "symbol": "BHP",
        "company": "BHP Group Limited",
        "sector": "Materials",
        "current_price": 45.67,
        "consensus_rating": "Buy",
        "consensus_score": 3.9,
        "price_target": {
            "mean": 52.00,
            "high": 58.00,
            "low": 42.00,
            "median": 51.50
        },
        "analyst_coverage": 28,
        "ratings_breakdown": {
            "strong_buy": 8,
            "buy": 12,
            "hold": 6,
            "sell": 2,
            "strong_sell": 0
        },
        "recent_reports": [
            {"broker": "Macquarie", "rating": "Outperform", "target": 54, "date": "2025-03-13", "analyst": "Hayden Bairstow"},
            {"broker": "UBS", "rating": "Buy", "target": 52, "date": "2025-03-09", "analyst": "Lachlan Shaw"},
            {"broker": "Citi", "rating": "Buy", "target": 50, "date": "2025-03-05", "analyst": "Paul McTaggart"},
        ],
        "key_metrics": {
            "pe_ratio": 12.4,
            "forward_pe": 10.8,
            "peg_ratio": 1.2,
            "ev_ebitda": 5.8,
            "dividend_yield": 5.2,
            "revenue_growth": -2.4,
            "eps_growth": -8.5
        },
        "investment_thesis": "BHP offers exposure to iron ore, copper, and potash with strong cash generation supporting attractive dividends. Copper exposure positions it well for energy transition demand.",
        "risks": ["China demand", "Iron ore price volatility", "ESG concerns"],
        "catalysts": ["Copper projects", "China stimulus", "Dividend yield"]
    },
    "CBA": {
        "symbol": "CBA",
        "company": "Commonwealth Bank of Australia",
        "sector": "Financials",
        "current_price": 118.45,
        "consensus_rating": "Hold",
        "consensus_score": 3.1,
        "price_target": {
            "mean": 105.00,
            "high": 125.00,
            "low": 85.00,
            "median": 102.00
        },
        "analyst_coverage": 18,
        "ratings_breakdown": {
            "strong_buy": 2,
            "buy": 4,
            "hold": 8,
            "sell": 3,
            "strong_sell": 1
        },
        "recent_reports": [
            {"broker": "Morgan Stanley", "rating": "Underweight", "target": 95, "date": "2025-03-14", "analyst": "Richard Wiles"},
            {"broker": "Macquarie", "rating": "Neutral", "target": 108, "date": "2025-03-10", "analyst": "Victor German"},
            {"broker": "Goldman Sachs", "rating": "Sell", "target": 92, "date": "2025-03-06", "analyst": "Andrew Lyons"},
        ],
        "key_metrics": {
            "pe_ratio": 22.8,
            "forward_pe": 20.5,
            "peg_ratio": 3.2,
            "ev_ebitda": None,
            "dividend_yield": 3.8,
            "revenue_growth": 4.2,
            "eps_growth": 2.8
        },
        "investment_thesis": "CBA is Australia's largest bank with leading digital capabilities and strong retail franchise. Premium valuation reflects quality but limits upside.",
        "risks": ["Competition", "Housing market", "Margin pressure"],
        "catalysts": ["Digital banking", "Wealth management", "Cost management"]
    },
    "NVDA": {
        "symbol": "NVDA",
        "company": "NVIDIA Corporation",
        "sector": "Technology",
        "current_price": 878.90,
        "consensus_rating": "Strong Buy",
        "consensus_score": 4.8,
        "price_target": {
            "mean": 1050.00,
            "high": 1400.00,
            "low": 750.00,
            "median": 1020.00
        },
        "analyst_coverage": 52,
        "ratings_breakdown": {
            "strong_buy": 38,
            "buy": 10,
            "hold": 4,
            "sell": 0,
            "strong_sell": 0
        },
        "recent_reports": [
            {"broker": "Bank of America", "rating": "Buy", "target": 1200, "date": "2025-03-15", "analyst": "Vivek Arya"},
            {"broker": "Wedbush", "rating": "Outperform", "target": 1100, "date": "2025-03-12", "analyst": "Dan Ives"},
            {"broker": "KeyBanc", "rating": "Overweight", "target": 1050, "date": "2025-03-08", "analyst": "John Vinh"},
        ],
        "key_metrics": {
            "pe_ratio": 68.5,
            "forward_pe": 42.0,
            "peg_ratio": 1.1,
            "ev_ebitda": 52.3,
            "dividend_yield": 0.02,
            "revenue_growth": 122.0,
            "eps_growth": 168.0
        },
        "investment_thesis": "NVIDIA dominates the AI accelerator market with its GPU architecture. Data center demand driven by AI training and inference creates strong multi-year growth runway.",
        "risks": ["Valuation", "Competition (AMD, custom chips)", "Supply constraints"],
        "catalysts": ["AI demand", "Data center growth", "New product cycles"]
    }
}

# ASX stocks
ASX_RESEARCH = {
    "CSL": {
        "symbol": "CSL",
        "company": "CSL Limited",
        "sector": "Healthcare",
        "current_price": 278.90,
        "consensus_rating": "Buy",
        "consensus_score": 4.1,
        "price_target": {"mean": 310.00, "high": 340.00, "low": 260.00, "median": 305.00},
        "analyst_coverage": 16,
        "ratings_breakdown": {"strong_buy": 6, "buy": 7, "hold": 3, "sell": 0, "strong_sell": 0},
        "recent_reports": [
            {"broker": "Macquarie", "rating": "Outperform", "target": 320, "date": "2025-03-12", "analyst": "Craig Wong-Pan"},
            {"broker": "UBS", "rating": "Buy", "target": 308, "date": "2025-03-08", "analyst": "Sean Laaman"},
        ],
        "investment_thesis": "CSL is a global leader in blood plasma products with strong IP and scale advantages.",
        "risks": ["Plasma collection costs", "Competition", "Currency exposure"],
        "catalysts": ["Product pipeline", "Seqirus growth", "Vifor integration"]
    },
    "WES": {
        "symbol": "WES",
        "company": "Wesfarmers Limited",
        "sector": "Consumer Discretionary",
        "current_price": 67.89,
        "consensus_rating": "Hold",
        "consensus_score": 3.4,
        "price_target": {"mean": 62.00, "high": 72.00, "low": 52.00, "median": 61.00},
        "analyst_coverage": 14,
        "ratings_breakdown": {"strong_buy": 2, "buy": 4, "hold": 6, "sell": 2, "strong_sell": 0},
        "recent_reports": [
            {"broker": "Citi", "rating": "Neutral", "target": 64, "date": "2025-03-11", "analyst": "Bryan Raymond"},
            {"broker": "JPMorgan", "rating": "Overweight", "target": 70, "date": "2025-03-07", "analyst": "Shaun Cousins"},
        ],
        "investment_thesis": "Wesfarmers owns market-leading retail brands including Bunnings and Kmart.",
        "risks": ["Consumer spending", "Lithium investment", "Competition"],
        "catalysts": ["Bunnings expansion", "Kmart margin improvement", "Lithium ramp-up"]
    }
}

# Merge ASX into main research
BROKER_RESEARCH.update(ASX_RESEARCH)


def add_price_movement(data: Dict) -> Dict:
    """Add simulated price movement to research data."""
    data = data.copy()
    jitter = random.uniform(-0.02, 0.02)
    data["current_price"] = round(data["current_price"] * (1 + jitter), 2)
    return data


@router.get("/stock/{symbol}")
async def get_stock_research(symbol: str):
    """Get comprehensive broker research for a stock."""
    symbol = symbol.upper()
    
    if symbol not in BROKER_RESEARCH:
        raise HTTPException(status_code=404, detail=f"No research available for {symbol}")
    
    research = add_price_movement(BROKER_RESEARCH[symbol])
    
    # Calculate upside/downside
    current = research["current_price"]
    mean_target = research["price_target"]["mean"]
    upside = ((mean_target - current) / current) * 100
    
    research["upside_to_target"] = round(upside, 1)
    research["last_updated"] = datetime.now(timezone.utc).isoformat()
    
    return research


@router.get("/stocks")
async def get_multiple_stock_research(symbols: str = Query(..., description="Comma-separated list of symbols")):
    """Get research for multiple stocks."""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    
    results = []
    for symbol in symbol_list:
        if symbol in BROKER_RESEARCH:
            research = add_price_movement(BROKER_RESEARCH[symbol])
            current = research["current_price"]
            mean_target = research["price_target"]["mean"]
            upside = ((mean_target - current) / current) * 100
            
            results.append({
                "symbol": symbol,
                "company": research["company"],
                "current_price": research["current_price"],
                "consensus_rating": research["consensus_rating"],
                "price_target": research["price_target"]["mean"],
                "upside": round(upside, 1),
                "analyst_coverage": research["analyst_coverage"]
            })
    
    return {
        "stocks": results,
        "count": len(results),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/top-rated")
async def get_top_rated_stocks(region: str = "all", limit: int = 10):
    """Get top-rated stocks by analyst consensus."""
    
    all_stocks = list(BROKER_RESEARCH.values())
    
    # Sort by consensus score
    sorted_stocks = sorted(all_stocks, key=lambda x: x["consensus_score"], reverse=True)
    
    results = []
    for stock in sorted_stocks[:limit]:
        stock = add_price_movement(stock)
        current = stock["current_price"]
        mean_target = stock["price_target"]["mean"]
        upside = ((mean_target - current) / current) * 100
        
        results.append({
            "symbol": stock["symbol"],
            "company": stock["company"],
            "sector": stock["sector"],
            "current_price": stock["current_price"],
            "consensus_rating": stock["consensus_rating"],
            "consensus_score": stock["consensus_score"],
            "price_target": stock["price_target"]["mean"],
            "upside": round(upside, 1),
            "analyst_coverage": stock["analyst_coverage"],
            "top_catalyst": stock.get("catalysts", ["Growth"])[0]
        })
    
    return {
        "top_rated": results,
        "region": region,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/upgrades-downgrades")
async def get_ratings_changes(days: int = 7):
    """Get recent analyst upgrades and downgrades."""
    
    # Simulated ratings changes
    changes = [
        {"date": "2025-03-17", "symbol": "NVDA", "broker": "Bank of America", "old_rating": "Buy", "new_rating": "Strong Buy", "old_target": 1000, "new_target": 1200, "change": "upgrade"},
        {"date": "2025-03-16", "symbol": "CBA", "broker": "Morgan Stanley", "old_rating": "Equal-Weight", "new_rating": "Underweight", "old_target": 105, "new_target": 95, "change": "downgrade"},
        {"date": "2025-03-15", "symbol": "AAPL", "broker": "Morgan Stanley", "old_rating": "Equal-Weight", "new_rating": "Overweight", "old_target": 185, "new_target": 210, "change": "upgrade"},
        {"date": "2025-03-14", "symbol": "BHP", "broker": "Macquarie", "old_rating": "Neutral", "new_rating": "Outperform", "old_target": 48, "new_target": 54, "change": "upgrade"},
        {"date": "2025-03-13", "symbol": "CSL", "broker": "UBS", "old_rating": "Neutral", "new_rating": "Buy", "old_target": 285, "new_target": 308, "change": "upgrade"},
        {"date": "2025-03-12", "symbol": "MSFT", "broker": "Citi", "old_rating": "Buy", "new_rating": "Buy", "old_target": 450, "new_target": 470, "change": "target_raise"},
        {"date": "2025-03-11", "symbol": "WES", "broker": "Citi", "old_rating": "Buy", "new_rating": "Neutral", "old_target": 70, "new_target": 64, "change": "downgrade"},
    ]
    
    upgrades = [c for c in changes if c["change"] == "upgrade"]
    downgrades = [c for c in changes if c["change"] == "downgrade"]
    target_changes = [c for c in changes if c["change"] == "target_raise"]
    
    return {
        "changes": changes,
        "summary": {
            "upgrades": len(upgrades),
            "downgrades": len(downgrades),
            "target_raises": len(target_changes),
            "period_days": days
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/sectors")
async def get_sector_ratings():
    """Get aggregated sector ratings and recommendations."""
    
    sectors = {}
    for stock in BROKER_RESEARCH.values():
        sector = stock["sector"]
        if sector not in sectors:
            sectors[sector] = {"stocks": [], "total_score": 0, "count": 0}
        sectors[sector]["stocks"].append(stock["symbol"])
        sectors[sector]["total_score"] += stock["consensus_score"]
        sectors[sector]["count"] += 1
    
    sector_ratings = []
    for sector, data in sectors.items():
        avg_score = data["total_score"] / data["count"]
        sector_ratings.append({
            "sector": sector,
            "average_rating": round(avg_score, 2),
            "rating_label": "Strong Buy" if avg_score >= 4.5 else "Buy" if avg_score >= 3.5 else "Hold" if avg_score >= 2.5 else "Sell",
            "stocks_covered": data["count"],
            "top_picks": data["stocks"][:3]
        })
    
    sector_ratings.sort(key=lambda x: x["average_rating"], reverse=True)
    
    return {
        "sectors": sector_ratings,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/screener")
async def stock_screener(
    min_rating: float = Query(3.5, ge=1, le=5),
    min_upside: float = Query(10, ge=0),
    sector: Optional[str] = None,
    max_pe: Optional[float] = None
):
    """Screen stocks based on research criteria."""
    
    results = []
    
    for stock in BROKER_RESEARCH.values():
        # Filter by rating
        if stock["consensus_score"] < min_rating:
            continue
        
        # Filter by sector
        if sector and stock["sector"].lower() != sector.lower():
            continue
        
        # Calculate upside
        current = stock["current_price"]
        target = stock["price_target"]["mean"]
        upside = ((target - current) / current) * 100
        
        if upside < min_upside:
            continue
        
        # Filter by PE
        if max_pe and stock["key_metrics"].get("pe_ratio") and stock["key_metrics"]["pe_ratio"] > max_pe:
            continue
        
        results.append({
            "symbol": stock["symbol"],
            "company": stock["company"],
            "sector": stock["sector"],
            "price": stock["current_price"],
            "target": target,
            "upside": round(upside, 1),
            "rating": stock["consensus_rating"],
            "score": stock["consensus_score"],
            "pe_ratio": stock["key_metrics"].get("pe_ratio"),
            "dividend_yield": stock["key_metrics"].get("dividend_yield")
        })
    
    results.sort(key=lambda x: x["upside"], reverse=True)
    
    return {
        "results": results,
        "count": len(results),
        "filters": {
            "min_rating": min_rating,
            "min_upside": min_upside,
            "sector": sector,
            "max_pe": max_pe
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
