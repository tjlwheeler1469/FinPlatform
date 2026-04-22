"""
Market snapshot — real-time quotes from Yahoo Finance (no key required),
with a deterministic simulated fallback if the upstream is unreachable.

Frontend polls this endpoint to drive the live market-pulse + readiness recalc.
"""
from fastapi import APIRouter
from datetime import datetime, timezone
import random
import logging
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/market-feed", tags=["Market Feed"])

# ASX & FX symbols via Yahoo Finance unofficial JSON endpoint.
SYMBOLS = [
    {"yahoo": "^AXJO",   "symbol": "XJO",    "name": "ASX 200"},
    {"yahoo": "^AORD",   "symbol": "XAO",    "name": "All Ordinaries"},
    {"yahoo": "AUDUSD=X","symbol": "AUDUSD", "name": "AUD/USD"},
]

_YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote"
_YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{}"

# Cache for 30s to avoid hammering Yahoo
_CACHE = {"payload": None, "expires_at": 0}
_CACHE_TTL_SECONDS = 30


async def _fetch_yahoo_quote() -> dict | None:
    """Primary fetch: Yahoo's v7 quote endpoint (single request, all symbols)."""
    params = {"symbols": ",".join(s["yahoo"] for s in SYMBOLS)}
    headers = {"User-Agent": "Mozilla/5.0 (compatible; WealthPlatform/1.0)"}
    try:
        async with httpx.AsyncClient(timeout=6.0, headers=headers) as client:
            r = await client.get(_YAHOO_QUOTE_URL, params=params)
            if r.status_code != 200:
                return None
            data = r.json()
            results = (data.get("quoteResponse") or {}).get("result") or []
            by_symbol = {q.get("symbol"): q for q in results}
            items = []
            for s in SYMBOLS:
                q = by_symbol.get(s["yahoo"])
                if not q:
                    return None
                items.append({
                    "symbol": s["symbol"],
                    "name": s["name"],
                    "last": q.get("regularMarketPrice"),
                    "delta_pct": round(q.get("regularMarketChangePercent") or 0, 3),
                })
            if not items:
                return None
            avg = sum(i["delta_pct"] for i in items) / max(1, len(items))
            return {
                "source": "yahoo",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "items": items,
                "avg_delta_pct": round(avg, 3),
            }
    except Exception as e:
        logger.info(f"Yahoo v7 quote failed: {e}")
        return None


async def _fetch_yahoo_chart_fallback() -> dict | None:
    """Secondary fetch: v8 chart endpoint per-symbol. Handles regions where v7 is blocked."""
    items = []
    headers = {"User-Agent": "Mozilla/5.0 (compatible; WealthPlatform/1.0)"}
    try:
        async with httpx.AsyncClient(timeout=6.0, headers=headers) as client:
            for s in SYMBOLS:
                r = await client.get(_YAHOO_CHART_URL.format(s["yahoo"]), params={"interval": "1d", "range": "2d"})
                if r.status_code != 200:
                    return None
                chart = r.json()
                result = (chart.get("chart") or {}).get("result") or []
                if not result:
                    return None
                meta = result[0].get("meta") or {}
                last = meta.get("regularMarketPrice")
                prev = meta.get("previousClose") or meta.get("chartPreviousClose")
                if last is None or prev is None or prev == 0:
                    return None
                delta_pct = ((last - prev) / prev) * 100
                items.append({
                    "symbol": s["symbol"],
                    "name": s["name"],
                    "last": last,
                    "delta_pct": round(delta_pct, 3),
                })
            avg = sum(i["delta_pct"] for i in items) / max(1, len(items))
            return {
                "source": "yahoo",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "items": items,
                "avg_delta_pct": round(avg, 3),
            }
    except Exception as e:
        logger.info(f"Yahoo v8 chart fallback failed: {e}")
        return None


def _simulated_snapshot() -> dict:
    # Deterministic-ish random walk seeded by minute, so consecutive polls
    # within 30s return the same delta (avoids UI flicker).
    seed = int(datetime.now(timezone.utc).timestamp() // 30)
    rng = random.Random(seed)
    items = []
    for s in SYMBOLS:
        delta_pct = (rng.random() - 0.5) * 1.2
        items.append({
            "symbol": s["symbol"],
            "name": s["name"],
            "last": 7500 + rng.uniform(-50, 50) if s["symbol"] == "XJO" else round(0.66 + (rng.random() - 0.5) * 0.01, 4),
            "delta_pct": round(delta_pct, 3),
        })
    avg = sum(i["delta_pct"] for i in items) / max(1, len(items))
    return {
        "source": "simulated",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "items": items,
        "avg_delta_pct": round(avg, 3),
    }


@router.get("/snapshot")
async def market_snapshot() -> dict:
    now = datetime.now(timezone.utc).timestamp()
    if _CACHE["payload"] and now < _CACHE["expires_at"]:
        return _CACHE["payload"]

    payload = await _fetch_yahoo_quote()
    if payload is None:
        payload = await _fetch_yahoo_chart_fallback()
    if payload is None:
        payload = _simulated_snapshot()

    _CACHE["payload"] = payload
    _CACHE["expires_at"] = now + _CACHE_TTL_SECONDS
    return payload
