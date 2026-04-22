"""
Actions Shipped Report — weekly adviser activity aggregator.

Aggregates from:
  - adviser_actions       (simulate, apply, generate, notify logs)
  - advice_drafts         (how many approved in period)
  - execution_tickets     (strategies applied)
  - client_notifications  (emails sent / mocked)
  - readiness_events      (simulations run)
"""
from fastapi import APIRouter
from typing import Optional
from datetime import datetime, timezone, timedelta

from db import db

router = APIRouter(prefix="/reports", tags=["Adviser Reports"])


def _cutoff(days: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()


@router.get("/actions-shipped")
async def actions_shipped(
    days: int = 7,
    actor: Optional[str] = None,
) -> dict:
    """Return the adviser's "actions shipped" metrics for the last N days.

    Query:
      - days:  lookback window (default 7)
      - actor: restrict to a specific adviser id (optional; defaults to all)
    """
    cutoff_iso = _cutoff(days)
    prev_cutoff_iso = _cutoff(days * 2)

    # Base filter on timestamp field
    def ts_query(start: str, end: str = None, extra: dict = None) -> dict:
        q = {"timestamp": {"$gte": start}}
        if end:
            q["timestamp"]["$lt"] = end
        if actor:
            q["actor"] = actor
        if extra:
            q.update(extra)
        return q

    async def _count(collection: str, query: dict) -> int:
        return await db[collection].count_documents(query)

    # ── Current window counts ──────────────────────────────────────
    sims          = await _count("adviser_actions", ts_query(cutoff_iso, extra={"action": "simulate"}))
    applies       = await _count("adviser_actions", ts_query(cutoff_iso, extra={"action": "apply"}))
    generates     = await _count("adviser_actions", ts_query(cutoff_iso, extra={"action": "generate"}))

    readiness_q = {"timestamp": {"$gte": cutoff_iso}}
    if actor:
        readiness_q["actor"] = actor
    readiness_runs = await db["readiness_events"].count_documents(readiness_q)

    tickets_q = {"created_at": {"$gte": cutoff_iso}}
    if actor:
        tickets_q["requested_by"] = actor
    tickets_created = await db["execution_tickets"].count_documents(tickets_q)

    approved_q = {"approved_at": {"$gte": cutoff_iso}}
    if actor:
        approved_q["approved_by"] = actor
    drafts_approved = await db["advice_drafts"].count_documents(approved_q)

    notifs_q = {"created_at": {"$gte": cutoff_iso}}
    if actor:
        notifs_q["actor"] = actor
    notifs_sent = await db["client_notifications"].count_documents(notifs_q)

    # ── Previous window (for WoW delta) ────────────────────────────
    prev_sims     = await _count("adviser_actions", {"timestamp": {"$gte": prev_cutoff_iso, "$lt": cutoff_iso}, "action": "simulate", **({"actor": actor} if actor else {})})
    prev_applies  = await _count("adviser_actions", {"timestamp": {"$gte": prev_cutoff_iso, "$lt": cutoff_iso}, "action": "apply", **({"actor": actor} if actor else {})})
    prev_drafts   = await db["advice_drafts"].count_documents({"approved_at": {"$gte": prev_cutoff_iso, "$lt": cutoff_iso}, **({"approved_by": actor} if actor else {})})
    prev_notifs   = await db["client_notifications"].count_documents({"created_at": {"$gte": prev_cutoff_iso, "$lt": cutoff_iso}, **({"actor": actor} if actor else {})})

    # ── Unique clients touched ─────────────────────────────────────
    distinct_clients = set()
    async for doc in db["adviser_actions"].find({"timestamp": {"$gte": cutoff_iso}, **({"actor": actor} if actor else {})}, {"client_id": 1}):
        if doc.get("client_id"):
            distinct_clients.add(doc["client_id"])

    # ── $ impact (sum from approved advice drafts context.financial_impact) ──
    dollar_impact = 0
    async for d in db["advice_drafts"].find(
        {"approved_at": {"$gte": cutoff_iso}, **({"approved_by": actor} if actor else {})},
        {"context": 1},
    ):
        fi = (d.get("context") or {}).get("financial_impact") or 0
        try:
            dollar_impact += int(fi)
        except (TypeError, ValueError):
            pass

    # ── Daily breakdown for sparkline (last `days` days) ───────────
    daily = []
    today = datetime.now(timezone.utc).date()
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc).isoformat()
        day_end = datetime.combine(day + timedelta(days=1), datetime.min.time()).replace(tzinfo=timezone.utc).isoformat()
        qfilter = {"timestamp": {"$gte": day_start, "$lt": day_end}}
        if actor:
            qfilter["actor"] = actor
        count = await db["adviser_actions"].count_documents(qfilter)
        daily.append({"date": day.isoformat(), "actions": count})

    # ── Assemble response ─────────────────────────────────────────
    def pct(curr: int, prev: int) -> float:
        if prev == 0:
            return 100.0 if curr > 0 else 0.0
        return round(((curr - prev) / prev) * 100, 1)

    return {
        "window_days": days,
        "actor": actor,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "totals": {
            "simulations": sims,
            "strategies_applied": applies,
            "advice_drafts_started": generates,
            "advice_drafts_approved": drafts_approved,
            "clients_notified": notifs_sent,
            "tickets_created": tickets_created,
            "readiness_computes": readiness_runs,
            "unique_clients_touched": len(distinct_clients),
            "dollar_impact_approved": dollar_impact,
        },
        "delta_wow": {
            "simulations_pct": pct(sims, prev_sims),
            "strategies_applied_pct": pct(applies, prev_applies),
            "advice_drafts_approved_pct": pct(drafts_approved, prev_drafts),
            "clients_notified_pct": pct(notifs_sent, prev_notifs),
        },
        "daily": daily,
    }
