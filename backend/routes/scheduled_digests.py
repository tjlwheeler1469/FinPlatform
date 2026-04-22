"""
Scheduled digests — daily "Signal" email + weekly "Actions Shipped" email.

Uses APScheduler AsyncIOScheduler attached to the FastAPI event loop.
Digest sending uses Resend if RESEND_API_KEY is set, otherwise logs MOCKED.

Jobs:
  - 08:00 AEST daily  → Signal digest (top ranked Intelligence Feed items)
  - Mon 08:00 AEST    → Weekly Actions Shipped report

Endpoints:
  GET /api/digests/status                 — scheduler health + next run times
  GET /api/digests/preview/signal         — preview the daily digest payload (no send)
  GET /api/digests/preview/actions        — preview the weekly report payload (no send)
  POST /api/digests/send/signal           — trigger the daily digest immediately (test/manual)
  POST /api/digests/send/actions          — trigger the weekly digest immediately (test/manual)
"""
from fastapi import APIRouter, Body
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
import os
import logging
import asyncio

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/digests", tags=["Scheduled Digests"])

_scheduler: Optional[AsyncIOScheduler] = None

# Default recipient list — in production this is a per-adviser query; for now a single catch-all.
_DEFAULT_ADVISER_RECIPIENT = os.environ.get("ADVISER_DIGEST_TO", "adviser@wealth-command.app")


# ==================== BUILDERS ====================

async def _build_signal_digest(days: int = 1) -> Dict:
    """Top N pending intelligence items over last `days`. Source: adviser_actions + advice_drafts."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    # New drafts awaiting approval
    pending = await db["advice_drafts"].find(
        {"status": "draft", "updated_at": {"$gte": cutoff}}, {"_id": 0},
    ).sort("updated_at", -1).limit(5).to_list(length=5)

    # Fresh readiness events in window (for "clients needing attention")
    recent_readiness = await db["readiness_events"].aggregate([
        {"$match": {"timestamp": {"$gte": cutoff}}},
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": "$client_id",
            "latest_score": {"$first": "$score"},
            "client_name": {"$first": "$client_name"},
            "timestamp": {"$first": "$timestamp"},
        }},
        {"$sort": {"latest_score": 1}},
        {"$limit": 5},
    ]).to_list(length=5)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "window_days": days,
        "pending_drafts": pending,
        "lowest_scoring_clients": recent_readiness,
        "summary": f"{len(pending)} drafts awaiting approval · {len(recent_readiness)} clients reviewed in last {days}d",
    }


async def _build_actions_report(days: int = 7) -> Dict:
    """Mirrors /api/reports/actions-shipped but inlined for scheduler independence."""
    from routes.adviser_reports import actions_shipped
    return await actions_shipped(days=days, actor=None)


def _signal_html(digest: Dict) -> str:
    pending = digest.get("pending_drafts", [])
    low = digest.get("lowest_scoring_clients", [])
    rows_pending = "".join([
        f"<li style='margin:6px 0'><b>{d.get('client_name') or d.get('client_id')}</b>: {d.get('headline') or d.get('title')}</li>"
        for d in pending
    ]) or "<li style='color:#64748b'>No drafts awaiting approval.</li>"
    rows_low = "".join([
        f"<li style='margin:6px 0'><b>{c.get('client_name') or c.get('_id')}</b> — score <b>{c.get('latest_score')}</b></li>"
        for c in low
    ]) or "<li style='color:#64748b'>No recent readiness events.</li>"
    return f"""
    <div style='font-family:system-ui,Segoe UI,Roboto,Arial;max-width:640px;margin:0 auto;color:#1a2744'>
      <h2 style='margin:0 0 6px;color:#1a2744'>🌅 Morning Signal — {datetime.now(timezone.utc).strftime('%a %d %b %Y')}</h2>
      <p style='color:#64748b;margin:0 0 18px'>{digest.get('summary', '')}</p>
      <h3 style='border-bottom:2px solid #D4A84C;padding-bottom:4px'>Drafts awaiting your approval</h3>
      <ul style='padding-left:18px'>{rows_pending}</ul>
      <h3 style='border-bottom:2px solid #D4A84C;padding-bottom:4px'>Lowest-scoring clients (attention)</h3>
      <ul style='padding-left:18px'>{rows_low}</ul>
      <p style='color:#64748b;font-size:11px;margin-top:22px'>Open the Retirement Control Center to act on any of these in one click.</p>
    </div>
    """


def _actions_html(report: Dict) -> str:
    t = report.get("totals", {})
    d = report.get("delta_wow", {})
    return f"""
    <div style='font-family:system-ui,Segoe UI,Roboto,Arial;max-width:640px;margin:0 auto;color:#1a2744'>
      <h2 style='margin:0 0 6px'>🏆 Actions Shipped — last {report.get('window_days',7)} days</h2>
      <p style='color:#64748b;margin:0 0 18px'>How this book moved the needle this week.</p>
      <table style='width:100%;border-collapse:collapse'>
        <tr>
          <td style='padding:10px;border:1px solid #e2e8f0'><b>Simulations</b><br>{t.get('simulations',0)} <span style='color:#64748b'>({d.get('simulations_pct',0)}% WoW)</span></td>
          <td style='padding:10px;border:1px solid #e2e8f0'><b>Strategies applied</b><br>{t.get('strategies_applied',0)} <span style='color:#64748b'>({d.get('strategies_applied_pct',0)}% WoW)</span></td>
        </tr>
        <tr>
          <td style='padding:10px;border:1px solid #e2e8f0'><b>Drafts approved</b><br>{t.get('advice_drafts_approved',0)} <span style='color:#64748b'>({d.get('advice_drafts_approved_pct',0)}% WoW)</span></td>
          <td style='padding:10px;border:1px solid #e2e8f0'><b>Clients notified</b><br>{t.get('clients_notified',0)} <span style='color:#64748b'>({d.get('clients_notified_pct',0)}% WoW)</span></td>
        </tr>
        <tr>
          <td style='padding:10px;border:1px solid #e2e8f0'><b>Clients touched</b><br>{t.get('unique_clients_touched',0)}</td>
          <td style='padding:10px;border:1px solid #e2e8f0'><b>$ impact approved</b><br>${t.get('dollar_impact_approved',0):,}</td>
        </tr>
      </table>
      <p style='color:#64748b;font-size:11px;margin-top:22px'>Generated {report.get('generated_at','')}</p>
    </div>
    """


# ==================== SEND HELPER ====================

async def _send_email(subject: str, html: str, digest_type: str) -> Dict:
    """Send via Resend if key present, otherwise persist mocked notification."""
    resend_key = os.environ.get("RESEND_API_KEY")
    to = _DEFAULT_ADVISER_RECIPIENT
    now = datetime.now(timezone.utc).isoformat()
    mode = "live" if resend_key else "mocked"
    delivery_ref = None
    error = None

    if resend_key:
        try:
            import resend
            resend.api_key = resend_key
            result = resend.Emails.send({
                "from": os.environ.get("RESEND_FROM_EMAIL", "adviser@wealth-command.app"),
                "to": [to],
                "subject": subject,
                "html": html,
            })
            delivery_ref = result.get("id") if isinstance(result, dict) else str(result)
        except Exception as e:
            mode = "error"
            error = str(e)[:200]

    log = {
        "type": f"digest:{digest_type}",
        "subject": subject,
        "to": to,
        "mode": mode,
        "delivery_ref": delivery_ref,
        "error": error,
        "created_at": now,
    }
    await db["digest_log"].insert_one(log)
    log.pop("_id", None)
    return log


# ==================== SCHEDULED JOBS ====================

async def _job_signal_digest():
    logger.info("[digest] running daily Signal digest job")
    digest = await _build_signal_digest(days=1)
    html = _signal_html(digest)
    await _send_email(
        subject=f"🌅 Morning Signal — {datetime.now(timezone.utc).strftime('%a %d %b')}",
        html=html,
        digest_type="signal_daily",
    )


async def _job_actions_digest():
    logger.info("[digest] running weekly Actions Shipped digest job")
    report = await _build_actions_report(days=7)
    html = _actions_html(report)
    await _send_email(
        subject=f"🏆 Actions Shipped — week of {datetime.now(timezone.utc).strftime('%d %b %Y')}",
        html=html,
        digest_type="actions_weekly",
    )


def start_scheduler() -> AsyncIOScheduler:
    """Called once from FastAPI startup. Idempotent."""
    global _scheduler
    if _scheduler and _scheduler.running:
        return _scheduler
    _scheduler = AsyncIOScheduler(timezone="Australia/Sydney")
    # 08:00 AEST every day
    _scheduler.add_job(_job_signal_digest, CronTrigger(hour=8, minute=0), id="signal_daily", replace_existing=True)
    # Monday 08:00 AEST
    _scheduler.add_job(_job_actions_digest, CronTrigger(day_of_week="mon", hour=8, minute=0), id="actions_weekly", replace_existing=True)
    _scheduler.start()
    logger.info("[digest] scheduler started (signal_daily + actions_weekly)")
    return _scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None


# ==================== ENDPOINTS ====================

@router.get("/status")
async def digest_status() -> dict:
    jobs = []
    if _scheduler:
        for j in _scheduler.get_jobs():
            jobs.append({
                "id": j.id,
                "next_run": j.next_run_time.isoformat() if j.next_run_time else None,
                "trigger": str(j.trigger),
            })
    resend_key_set = bool(os.environ.get("RESEND_API_KEY"))
    return {
        "scheduler_running": bool(_scheduler and _scheduler.running),
        "jobs": jobs,
        "resend_configured": resend_key_set,
        "mode": "live" if resend_key_set else "mocked",
        "default_recipient": _DEFAULT_ADVISER_RECIPIENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/preview/signal")
async def preview_signal(days: int = 1) -> dict:
    digest = await _build_signal_digest(days=days)
    return {"digest": digest, "html": _signal_html(digest)}


@router.get("/preview/actions")
async def preview_actions(days: int = 7) -> dict:
    report = await _build_actions_report(days=days)
    return {"report": report, "html": _actions_html(report)}


@router.post("/send/signal")
async def send_signal_now(payload: Dict = Body(default={})) -> dict:
    asyncio.create_task(_job_signal_digest())
    return {"success": True, "triggered": "signal_daily", "mode": "live" if os.environ.get("RESEND_API_KEY") else "mocked"}


@router.post("/send/actions")
async def send_actions_now(payload: Dict = Body(default={})) -> dict:
    asyncio.create_task(_job_actions_digest())
    return {"success": True, "triggered": "actions_weekly", "mode": "live" if os.environ.get("RESEND_API_KEY") else "mocked"}


@router.get("/log")
async def digest_log(limit: int = 20) -> dict:
    cursor = db["digest_log"].find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    entries = await cursor.to_list(length=limit)
    return {"entries": entries, "total": len(entries)}
