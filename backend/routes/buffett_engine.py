"""
Buffett-Style Stock Screening API
Provides value-based stock screening data for ASX stocks using Yahoo Finance.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import yfinance as yf
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/buffett-engine", tags=["Buffett Engine"])

# Cache
_cache: Dict[str, Any] = {}
CACHE_TTL = 600  # 10 minutes

ASX_STOCKS = {
    "CBA.AX": {"name": "Commonwealth Bank", "sector": "Banks"},
    "BHP.AX": {"name": "BHP Group", "sector": "Mining"},
    "CSL.AX": {"name": "CSL Limited", "sector": "Healthcare"},
    "WBC.AX": {"name": "Westpac", "sector": "Banks"},
    "NAB.AX": {"name": "NAB", "sector": "Banks"},
    "ANZ.AX": {"name": "ANZ", "sector": "Banks"},
    "RIO.AX": {"name": "Rio Tinto", "sector": "Mining"},
    "FMG.AX": {"name": "Fortescue", "sector": "Mining"},
    "WES.AX": {"name": "Wesfarmers", "sector": "Retail"},
    "WOW.AX": {"name": "Woolworths", "sector": "Retail"},
    "TLS.AX": {"name": "Telstra", "sector": "Telco"},
    "MQG.AX": {"name": "Macquarie", "sector": "Financials"},
}

# Historical avg PE data (10-year averages — static reference)
HISTORICAL_PE = {
    "CBA.AX": {"avg": 15.5, "low": 11.2, "high": 22.5},
    "BHP.AX": {"avg": 14.2, "low": 8.1, "high": 21.3},
    "CSL.AX": {"avg": 38.5, "low": 28.4, "high": 55.2},
    "WBC.AX": {"avg": 13.9, "low": 9.5, "high": 18.2},
    "NAB.AX": {"avg": 13.2, "low": 9.8, "high": 17.6},
    "ANZ.AX": {"avg": 12.5, "low": 8.9, "high": 16.4},
    "RIO.AX": {"avg": 12.8, "low": 6.5, "high": 19.8},
    "FMG.AX": {"avg": 8.5, "low": 4.2, "high": 14.5},
    "WES.AX": {"avg": 22.8, "low": 16.5, "high": 32.1},
    "WOW.AX": {"avg": 21.5, "low": 15.2, "high": 28.9},
    "TLS.AX": {"avg": 18.2, "low": 12.8, "high": 25.5},
    "MQG.AX": {"avg": 14.5, "low": 10.2, "high": 21.5},
}


class StockScreenResult(BaseModel):
    symbol: str
    name: str
    sector: str
    price: float
    pe_current: Optional[float]
    pe_avg: float
    pe_low: float
    pe_high: float
    dividend_yield: Optional[float]
    market_cap: Optional[float]
    action: str
    confidence: int
    upside: str
    reason: str
    catalyst: str


class BuffettScreenResponse(BaseModel):
    ideas: List[StockScreenResult]
    sentiment_score: int
    sentiment_label: str
    sector_rankings: List[Dict[str, Any]]
    source: str
    timestamp: str


def _get_cached(key: str) -> Optional[Any]:
    if key in _cache:
        entry = _cache[key]
        if datetime.now(timezone.utc) - entry["ts"] < timedelta(seconds=CACHE_TTL):
            return entry["data"]
    return None


def _set_cache(key: str, data: Any) -> None:
    _cache[key] = {"data": data, "ts": datetime.now(timezone.utc)}


def _score_stock(symbol: str, info: Dict) -> StockScreenResult:
    """Score a stock using Buffett-style value metrics."""
    meta = ASX_STOCKS.get(symbol, {"name": symbol, "sector": "Unknown"})
    hist = HISTORICAL_PE.get(symbol, {"avg": 15, "low": 10, "high": 25})

    pe = info.get("trailingPE") or info.get("forwardPE")
    div_yield = info.get("dividendYield")
    price = info.get("regularMarketPrice") or info.get("previousClose") or 0
    mcap = info.get("marketCap")

    # Scoring logic
    confidence = 50
    reasons = []

    if pe and pe > 0:
        pe_ratio = pe / hist["avg"]
        if pe_ratio < 0.85:
            confidence += 25
            reasons.append(f"PE {pe:.1f} is {((1 - pe_ratio) * 100):.0f}% below 10Y avg")
        elif pe_ratio < 1.0:
            confidence += 10
            reasons.append(f"PE {pe:.1f} slightly below average")
        elif pe_ratio > 1.15:
            confidence -= 15
            reasons.append(f"PE {pe:.1f} is {((pe_ratio - 1) * 100):.0f}% above 10Y avg")

    if div_yield and div_yield > 0.04:
        confidence += 10
        reasons.append(f"Strong dividend yield {div_yield * 100:.1f}%")

    confidence = max(20, min(95, confidence))

    if confidence >= 70:
        action = "BUY"
    elif confidence >= 50:
        action = "HOLD"
    else:
        action = "AVOID"

    upside_pct = ((hist["avg"] / (pe or hist["avg"])) - 1) * 100 if pe else 0
    upside = f"+{upside_pct:.0f}%" if upside_pct >= 0 else f"{upside_pct:.0f}%"

    catalysts = {
        "Mining": "Commodity price recovery and China demand",
        "Banks": "Rate environment supporting NIM expansion",
        "Healthcare": "Global biotech pipeline and aging demographics",
        "Retail": "Consumer confidence recovery post-rate cuts",
        "Telco": "5G infrastructure buildout and enterprise growth",
        "Financials": "Strong institutional flows and advisory income",
    }

    return StockScreenResult(
        symbol=symbol,
        name=meta["name"],
        sector=meta["sector"],
        price=round(price, 2),
        pe_current=round(pe, 1) if pe else None,
        pe_avg=hist["avg"],
        pe_low=hist["low"],
        pe_high=hist["high"],
        dividend_yield=round(div_yield * 100, 1) if div_yield else None,
        market_cap=mcap,
        action=action,
        confidence=confidence,
        upside=upside,
        reason=". ".join(reasons) if reasons else "Neutral valuation at current levels.",
        catalyst=catalysts.get(meta["sector"], "Sector-specific drivers TBD"),
    )


@router.get("/screen", response_model=BuffettScreenResponse)
async def get_buffett_screen() -> BuffettScreenResponse:
    """Run Buffett-style value screen on ASX stocks."""
    cached = _get_cached("buffett_screen")
    if cached:
        return cached

    ideas = []
    source = "live"

    try:
        symbols = list(ASX_STOCKS.keys())
        tickers = yf.Tickers(" ".join(symbols))

        for symbol in symbols:
            try:
                ticker = tickers.tickers.get(symbol)
                if ticker:
                    info = ticker.info or {}
                    result = _score_stock(symbol, info)
                    ideas.append(result)
            except Exception as e:
                logger.warning(f"Failed to fetch {symbol}: {e}")
                # Use fallback for this stock
                ideas.append(_score_stock(symbol, {}))

    except Exception as e:
        logger.error(f"Yahoo Finance batch fetch failed: {e}")
        source = "fallback"
        for symbol in ASX_STOCKS:
            ideas.append(_score_stock(symbol, {}))

    # Sort by confidence descending
    ideas.sort(key=lambda x: x.confidence, reverse=True)

    # Calculate sector rankings
    sector_scores: Dict[str, List[int]] = {}
    for idea in ideas:
        sector_scores.setdefault(idea.sector, []).append(idea.confidence)

    sector_rankings = sorted(
        [{"sector": s, "score": round(sum(scores) / len(scores))} for s, scores in sector_scores.items()],
        key=lambda x: x["score"],
        reverse=True,
    )

    # Sentiment from average confidence
    avg_confidence = round(sum(i.confidence for i in ideas) / len(ideas)) if ideas else 50
    if avg_confidence >= 70:
        label = "Bullish"
    elif avg_confidence >= 55:
        label = "Moderately Bullish"
    elif avg_confidence >= 45:
        label = "Neutral"
    else:
        label = "Cautious"

    response = BuffettScreenResponse(
        ideas=ideas,
        sentiment_score=avg_confidence,
        sentiment_label=label,
        sector_rankings=sector_rankings,
        source=source,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

    _set_cache("buffett_screen", response)
    return response
