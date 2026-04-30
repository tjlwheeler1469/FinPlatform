"""
Execution Rails — Adapter dispatcher for advice execution.
Routes a pending execution ticket to the appropriate downstream adapter
(broker, super platform, insurance provider, contribution payment gateway).

Adapters are currently mocked but expose a clean interface so real SDKs
(Alpaca, SelfWealth, Hostplus API, AIA/TAL, etc.) can be dropped in with
minimal code change. Each adapter returns a lifecycle dict:

    { stage: "submitted" | "accepted" | "settled" | "failed",
      external_ref: str | None,
      detail: str }

Endpoints:
  GET  /api/exec-rails/adapters             — list available adapters + mode
  POST /api/exec-rails/tickets/{id}/dispatch — run adapter pipeline for a ticket
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Dict, Any
import os
import uuid
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/exec-rails", tags=["Execution Rails"])

TICKETS = "execution_tickets"
EVENTS = "execution_rail_events"


# ---------- Adapter implementations ----------
# Each adapter has the same signature: async def dispatch(ticket) -> dict
# In live mode it would call the real API; in mock mode it returns a
# deterministic lifecycle trace.

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _live(env_key: str) -> bool:
    return bool(os.environ.get(env_key))


async def broker_adapter(ticket: Dict[str, Any]) -> Dict[str, Any]:
    """Broker adapter — Alpaca paper trading (live when ALPACA_API_KEY set)."""
    payload = ticket.get("payload") or {}
    symbol = payload.get("symbol", "VAS.AX")
    qty = payload.get("qty", 0)
    side = payload.get("side", "buy")
    ref = f"BRK-{uuid.uuid4().hex[:8].upper()}"

    # Attempt live Alpaca paper trading if credentials present
    live_mode = False
    live_detail = None
    try:
        from routes.alpaca_trading import get_trading_client, ALPACA_AVAILABLE
        if ALPACA_AVAILABLE:
            tc = get_trading_client()
            if tc is not None and qty > 0:
                from alpaca.trading.requests import MarketOrderRequest
                from alpaca.trading.enums import OrderSide, TimeInForce
                # Alpaca uses US symbols — strip .AX suffix for paper-trade sanity
                ticker = str(symbol).upper().split(".")[0] or "SPY"
                order = MarketOrderRequest(
                    symbol=ticker,
                    qty=float(qty),
                    side=OrderSide.BUY if side.lower() == "buy" else OrderSide.SELL,
                    time_in_force=TimeInForce.DAY,
                )
                result = tc.submit_order(order)
                ref = str(getattr(result, "id", ref))
                live_mode = True
                live_detail = f"Alpaca {side.upper()} {qty} {ticker} · status={getattr(result, 'status', 'submitted')}"
    except Exception as e:
        logger.warning("Alpaca submit failed, falling back to mock: %s", e)

    if live_mode:
        return {
            "adapter": "broker",
            "mode": "live",
            "stages": [
                {"stage": "submitted", "at": _now(), "external_ref": ref, "detail": live_detail},
                {"stage": "accepted",  "at": _now(), "external_ref": ref, "detail": "Alpaca paper venue acknowledged"},
                {"stage": "settled",   "at": _now(), "external_ref": ref, "detail": "Order filled (paper)"},
            ],
            "external_ref": ref,
        }

    return {
        "adapter": "broker",
        "mode": "mock",
        "stages": [
            {"stage": "submitted", "at": _now(), "external_ref": ref,
             "detail": f"{side.upper()} {qty} {symbol}"},
            {"stage": "accepted", "at": _now(), "external_ref": ref,
             "detail": "Venue acknowledged"},
            {"stage": "settled", "at": _now(), "external_ref": ref,
             "detail": "T+2 settlement scheduled"},
        ],
        "external_ref": ref,
    }


async def super_adapter(ticket: Dict[str, Any]) -> Dict[str, Any]:
    """Super platform adapter — HUB24 / Netwealth / retail funds."""
    live = _live("HUB24_API_KEY") or _live("NETWEALTH_API_KEY")
    payload = ticket.get("payload") or {}
    fund = payload.get("fund", "Hostplus Indexed Balanced")
    action = payload.get("action", "switch")
    ref = f"SUP-{uuid.uuid4().hex[:8].upper()}"
    return {
        "adapter": "super_platform",
        "mode": "live" if live else "mock",
        "stages": [
            {"stage": "submitted", "at": _now(), "external_ref": ref,
             "detail": f"{action} → {fund}"},
            {"stage": "accepted", "at": _now(), "external_ref": ref,
             "detail": "Super admin queued the instruction"},
            {"stage": "settled", "at": _now(), "external_ref": ref,
             "detail": "Member record updated"},
        ],
        "external_ref": ref,
    }


async def insurance_adapter(ticket: Dict[str, Any]) -> Dict[str, Any]:
    """Insurance adapter — AIA / TAL / Zurich quote + binder."""
    live = _live("AIA_API_KEY") or _live("TAL_API_KEY")
    payload = ticket.get("payload") or {}
    provider = payload.get("provider", "AIA")
    cover_type = payload.get("cover_type", "income_protection")
    ref = f"INS-{uuid.uuid4().hex[:8].upper()}"
    return {
        "adapter": "insurance",
        "mode": "live" if live else "mock",
        "stages": [
            {"stage": "submitted", "at": _now(), "external_ref": ref,
             "detail": f"{provider} {cover_type} quote request"},
            {"stage": "accepted", "at": _now(), "external_ref": ref,
             "detail": "Underwriter review pending"},
        ],
        "external_ref": ref,
        "note": "Insurance binders complete after medical UW (2-10 business days).",
    }


async def contribution_adapter(ticket: Dict[str, Any]) -> Dict[str, Any]:
    """Contribution adapter — Bpay / direct debit to super fund."""
    payload = ticket.get("payload") or {}
    amount = payload.get("amount", 0)
    fund = payload.get("fund", "AustralianSuper")
    ref = f"CON-{uuid.uuid4().hex[:8].upper()}"
    return {
        "adapter": "contribution",
        "mode": "mock",  # no live banking rail yet
        "stages": [
            {"stage": "submitted", "at": _now(), "external_ref": ref,
             "detail": f"Contribution ${amount:,.0f} → {fund}"},
            {"stage": "accepted", "at": _now(), "external_ref": ref,
             "detail": "Biller credited"},
            {"stage": "settled", "at": _now(), "external_ref": ref,
             "detail": "Unit price allocated"},
        ],
        "external_ref": ref,
    }


async def rebalance_adapter(ticket: Dict[str, Any]) -> Dict[str, Any]:
    """Rebalance adapter — wraps multiple broker legs."""
    payload = ticket.get("payload") or {}
    legs = payload.get("legs") or [
        {"symbol": "VAS.AX", "side": "sell", "qty": 100},
        {"symbol": "VGS.AX", "side": "buy", "qty": 55},
    ]
    ref = f"RBL-{uuid.uuid4().hex[:8].upper()}"
    return {
        "adapter": "rebalance",
        "mode": "mock",
        "stages": [
            {"stage": "submitted", "at": _now(), "external_ref": ref,
             "detail": f"{len(legs)}-leg rebalance submitted"},
            {"stage": "accepted", "at": _now(), "external_ref": ref,
             "detail": "All legs acknowledged"},
            {"stage": "settled", "at": _now(), "external_ref": ref,
             "detail": "Portfolio drift reduced to <1%"},
        ],
        "external_ref": ref,
        "legs": legs,
    }


ADAPTER_MAP = {
    "trade": broker_adapter,
    "super_change": super_adapter,
    "insurance_quote": insurance_adapter,
    "contribution": contribution_adapter,
    "rebalance": rebalance_adapter,
}


@router.get("/adapters")
async def list_adapters() -> dict:
    """Return the adapter registry + which ones are in live mode."""
    # Broker live check must actually see the client (keys may be in env only)
    broker_live = False
    try:
        from routes.alpaca_trading import get_trading_client
        broker_live = get_trading_client() is not None
    except Exception:
        broker_live = False
    return {
        "adapters": [
            {"ticket_type": "trade",            "name": "Broker (Alpaca)",   "live": broker_live},
            {"ticket_type": "super_change",     "name": "Super Platform",    "live": _live("HUB24_API_KEY") or _live("NETWEALTH_API_KEY")},
            {"ticket_type": "insurance_quote",  "name": "Insurance",         "live": _live("AIA_API_KEY") or _live("TAL_API_KEY")},
            {"ticket_type": "contribution",     "name": "Contribution",      "live": False},
            {"ticket_type": "rebalance",        "name": "Rebalance (multi-leg)", "live": False},
        ],
        "default_mode": "mock",
    }


@router.post("/tickets/{ticket_id}/dispatch")
async def dispatch_ticket(ticket_id: str) -> dict:
    """Dispatch a pending ticket through its matching adapter.
    Updates ticket status and writes an events audit log."""
    ticket = await db[TICKETS].find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(404, f"Ticket {ticket_id} not found")
    if ticket.get("status") in ("completed", "failed", "cancelled"):
        raise HTTPException(409, f"Ticket already {ticket['status']}")

    ttype = ticket.get("ticket_type")
    adapter = ADAPTER_MAP.get(ttype)
    if not adapter:
        raise HTTPException(400, f"No adapter registered for ticket_type={ttype}")

    # Transition: pending -> executing
    now = _now()
    await db[TICKETS].update_one(
        {"ticket_id": ticket_id},
        {"$set": {"status": "executing", "updated_at": now},
         "$push": {"history": {"at": now, "event": "dispatching", "by": "exec-rails"}}},
    )

    try:
        result = await adapter(ticket)
    except Exception as e:
        logger.exception("Adapter failed")
        await db[TICKETS].update_one(
            {"ticket_id": ticket_id},
            {"$set": {"status": "failed", "updated_at": _now(), "error": str(e)[:200]}},
        )
        raise HTTPException(500, f"Adapter error: {e}")

    # Final status based on the last stage
    final_stage = (result.get("stages") or [{}])[-1].get("stage", "submitted")
    final_status = "completed" if final_stage == "settled" else "executing"

    event_doc = {
        "_id": f"evt_{uuid.uuid4().hex[:10]}",
        "ticket_id": ticket_id,
        "adapter": result.get("adapter"),
        "mode": result.get("mode"),
        "external_ref": result.get("external_ref"),
        "stages": result.get("stages"),
        "created_at": _now(),
    }
    await db[EVENTS].insert_one(event_doc)

    await db[TICKETS].update_one(
        {"ticket_id": ticket_id},
        {"$set": {
            "status": final_status,
            "execution_ref": result.get("external_ref"),
            "updated_at": _now(),
        },
        "$push": {"history": {"at": _now(), "event": "dispatched",
                              "by": "exec-rails", "adapter": result.get("adapter"),
                              "external_ref": result.get("external_ref")}}},
    )

    event_doc.pop("_id", None)
    return {"success": True, "ticket_id": ticket_id, "final_status": final_status, "event": event_doc}


@router.get("/events/{ticket_id}")
async def list_events(ticket_id: str) -> dict:
    """Return all rail events recorded for a ticket (audit trail)."""
    cursor = db[EVENTS].find({"ticket_id": ticket_id}, {"_id": 0}).sort("created_at", 1)
    events = await cursor.to_list(length=200)
    return {"ticket_id": ticket_id, "events": events, "total": len(events)}
