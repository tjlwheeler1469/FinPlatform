"""
Market snapshot — thin wrapper around a public market data source.
Falls back to a deterministic "simulated" payload when no external provider is wired.
Frontend polls this endpoint to drive the live market-pulse + readiness recalc.
"""
from fastapi import APIRouter
from datetime import datetime, timezone
import random

router = APIRouter(prefix="/market-feed", tags=["Market Feed"])

# ASX proxy symbols used for the snapshot. When/if a real feed is wired,
# replace the simulated section with a fetch() call.
_SYMBOLS = [
    {"symbol": "XJO", "name": "ASX 200"},
    {"symbol": "XAO", "name": "All Ordinaries"},
    {"symbol": "AUDUSD", "name": "AUD/USD"},
]


def _simulated_snapshot() -> dict:
    # Deterministic-ish random walk seeded by minute, so consecutive polls
    # within 30s return the same delta (avoids UI flicker).
    seed = int(datetime.now(timezone.utc).timestamp() // 30)
    rng = random.Random(seed)
    items = []
    for s in _SYMBOLS:
        delta_pct = (rng.random() - 0.5) * 1.2  # ±0.6%
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
    return _simulated_snapshot()
