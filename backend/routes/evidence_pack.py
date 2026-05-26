"""
Compliance Evidence Pack — one-click PDF bundle that snapshots the audit-log
+ Compliance Dashboard metrics + last-30-days of e-signature events, ready
to hand to an external auditor or PI insurer.

Built on the existing headless-Chromium PDF renderer (`routes/pdf_render.py`)
so the output is letter-quality typesetting, not a canvas screenshot.

Endpoints (under /api/evidence):
  GET   /preview-html        render the HTML preview for the in-app preview pane
  POST  /generate            render HTML → PDF → persist to Vault, return object_id
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
import logging

from db import db
from routes.pdf_render import _render_pdf_bytes, CHROMIUM  # reuse existing renderer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/evidence", tags=["Compliance Evidence Pack"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _fmt_dt(iso: str | None) -> str:
    if not iso:
        return "—"
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%d %b %Y · %H:%M UTC")
    except Exception:
        return iso


async def _aggregate_payload(days_back: int = 30) -> dict:
    """Aggregate everything the Evidence Pack will display."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days_back)).isoformat()

    # 1) Compliance metrics (same shape the Compliance Dashboard reads)
    coll = db["compliance_documents"]
    total = await coll.count_documents({})
    approved = await coll.count_documents({"review_outcome": "approved"})
    pending = await coll.count_documents({"status": {"$in": ["pending_review", "pending_signature"]}})
    rejected = await coll.count_documents({"review_outcome": {"$in": ["rejected", "requires_changes"]}})
    rate = round((approved / total) * 100, 1) if total else 0

    # 2) Xplan sync log (last N days)
    sync_cur = db["xplan_sync_log"].find(
        {"ts": {"$gte": cutoff}}, {"_id": 0}
    ).sort("ts", -1).limit(200)
    sync_entries = await sync_cur.to_list(length=200)

    # 3) E-signature audit (last N days)
    esig_cur = db["rbac_audit"].find(
        {"event": "document_signed", "at": {"$gte": cutoff}}, {"_id": 0}
    ).sort("at", -1).limit(200)
    esig_entries = await esig_cur.to_list(length=200)

    # 4) Recent RBAC denials (security signal)
    deny_cur = db["rbac_audit"].find(
        {"event": {"$ne": "document_signed"}, "status": "denied",
         "at": {"$gte": cutoff}}, {"_id": 0}
    ).sort("at", -1).limit(50)
    deny_entries = await deny_cur.to_list(length=50)

    return {
        "generated_at": _now_iso(),
        "window_days": days_back,
        "metrics": {
            "total_files": total, "approved": approved,
            "pending": pending, "rejected": rejected,
            "compliance_rate": rate,
        },
        "sync_log": sync_entries,
        "esig_audit": esig_entries,
        "rbac_denials": deny_entries,
    }


def _html(payload: dict) -> str:
    m = payload["metrics"]
    rows_sync = "".join(
        f"<tr><td>{_fmt_dt(e.get('ts'))}</td><td><span class='pill {e.get('direction', '')}'>{e.get('direction', '—')}</span></td><td>{e.get('module', '—')}</td><td>{e.get('mode', '—')}</td><td>{e.get('items_pulled', '—') if e.get('direction') == 'pull' else (e.get('metrics') or {}).get('total', '—')}</td></tr>"
        for e in payload["sync_log"]
    ) or "<tr><td colspan='5' class='empty'>No sync events recorded in this window.</td></tr>"

    rows_esig = "".join(
        f"<tr><td>{_fmt_dt(e.get('at'))}</td><td>{e.get('family_key', '—')}</td><td>{e.get('signer_email', '—')}</td><td>{e.get('provider', '—')}</td><td>{e.get('envelope_id', '—')}</td></tr>"
        for e in payload["esig_audit"]
    ) or "<tr><td colspan='5' class='empty'>No e-signature events recorded in this window.</td></tr>"

    rows_deny = "".join(
        f"<tr><td>{_fmt_dt(e.get('at'))}</td><td>{e.get('user_id', e.get('actor', '—'))}</td><td>{e.get('action', e.get('event', '—'))}</td><td>{e.get('reason', '—')}</td></tr>"
        for e in payload["rbac_denials"]
    ) or "<tr><td colspan='4' class='empty'>No RBAC denials in this window. ✓</td></tr>"

    return f"""<!doctype html>
<html><head><meta charset='utf-8'>
<title>Compliance Evidence Pack · {datetime.now(timezone.utc).strftime('%d %b %Y')}</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{ font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a2744; margin: 0; padding: 36px 42px; font-size: 11pt; line-height: 1.45; }}
  .header {{ border-bottom: 2px solid #D4A84C; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }}
  .eyebrow {{ font-size: 10pt; letter-spacing: .15em; text-transform: uppercase; color: #6b7280; font-weight: 600; }}
  h1 {{ font-size: 28pt; margin: 4px 0 0; font-weight: 700; }}
  .accent {{ color: #D4A84C; }}
  .meta {{ font-size: 9.5pt; color: #6b7280; }}
  .kpis {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }}
  .kpi {{ border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; }}
  .kpi .label {{ font-size: 8.5pt; text-transform: uppercase; letter-spacing: .1em; color: #6b7280; font-weight: 600; }}
  .kpi .value {{ font-size: 22pt; font-weight: 700; margin-top: 4px; }}
  h2 {{ font-size: 14pt; margin-top: 28px; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 14px; }}
  th {{ background: #f9fafb; text-align: left; padding: 8px 10px; font-size: 9pt; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; font-weight: 600; border-bottom: 1px solid #e5e7eb; }}
  td {{ padding: 7px 10px; border-bottom: 1px solid #f3f4f6; font-size: 10pt; vertical-align: top; }}
  .pill {{ display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 8.5pt; font-weight: 600; }}
  .pill.push {{ background: #ecfdf5; color: #047857; }}
  .pill.pull {{ background: #eff6ff; color: #1e40af; }}
  .empty {{ text-align: center; color: #9ca3af; font-style: italic; padding: 16px; }}
  .footer {{ margin-top: 36px; padding-top: 14px; border-top: 1px solid #e5e7eb; font-size: 8.5pt; color: #6b7280; text-align: center; }}
  .watermark {{ position: fixed; bottom: 8px; right: 14px; font-size: 7.5pt; color: #b8c2d1; text-transform: uppercase; letter-spacing: .1em; }}
</style></head><body>
  <div class='header'>
    <div>
      <div class='eyebrow'>Compliance · Evidence Pack</div>
      <h1>Audit <span class='accent'>snapshot</span></h1>
      <div class='meta'>Generated {_fmt_dt(payload['generated_at'])} · {payload['window_days']}-day rolling window</div>
    </div>
    <div class='meta' style='text-align:right'>
      <strong>Halcyon Wealth Command Centre</strong><br>
      Server-side rendered · letter-quality PDF
    </div>
  </div>

  <div class='kpis'>
    <div class='kpi'><div class='label'>Total advice files</div><div class='value'>{m['total_files']}</div></div>
    <div class='kpi'><div class='label'>Approved</div><div class='value' style='color:#059669'>{m['approved']}</div></div>
    <div class='kpi'><div class='label'>Pending review</div><div class='value' style='color:#d97706'>{m['pending']}</div></div>
    <div class='kpi'><div class='label'>Compliance rate</div><div class='value accent'>{m['compliance_rate']}%</div></div>
  </div>

  <h2>1 · Xplan sync delivery log ({len(payload['sync_log'])} events)</h2>
  <table>
    <thead><tr><th>When (UTC)</th><th>Direction</th><th>Module</th><th>Mode</th><th>Items</th></tr></thead>
    <tbody>{rows_sync}</tbody>
  </table>

  <h2>2 · E-signature events ({len(payload['esig_audit'])} signed)</h2>
  <table>
    <thead><tr><th>When (UTC)</th><th>Document family</th><th>Signer</th><th>Provider</th><th>Envelope</th></tr></thead>
    <tbody>{rows_esig}</tbody>
  </table>

  <h2>3 · RBAC access denials ({len(payload['rbac_denials'])} blocked)</h2>
  <table>
    <thead><tr><th>When (UTC)</th><th>User</th><th>Action</th><th>Reason</th></tr></thead>
    <tbody>{rows_deny}</tbody>
  </table>

  <div class='footer'>
    Generated automatically from <code>/api/evidence/generate</code> · Source: MongoDB rbac_audit + xplan_sync_log + compliance_documents · Each row is independently replayable via the matching API endpoint.
  </div>
  <div class='watermark'>EVIDENCE PACK · CONFIDENTIAL</div>
</body></html>"""


@router.get("/preview-html")
async def preview_html(days: int = 30):
    payload = await _aggregate_payload(days_back=days)
    return {"html": _html(payload), "payload": payload}


@router.post("/generate")
async def generate_evidence_pdf(days: int = 30):
    """Render the HTML evidence pack and persist it to the Vault under
    family_key='compliance_evidence_pack' so versions accumulate over time."""
    if not CHROMIUM:
        raise HTTPException(503, "Server-side PDF rendering unavailable on this host. "
                                 "Install chromium / chromium-browser / google-chrome.")
    payload = await _aggregate_payload(days_back=days)
    html = _html(payload)
    pdf_bytes = await _render_pdf_bytes(html, paper_size="A4", margin_mm=12)
    from routes.local_files import _persist
    filename = f"compliance-evidence-pack_{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"
    obj = await _persist(
        pdf_bytes,
        filename=filename, mime="application/pdf",
        owner_client_id=None,
        tags=["compliance", "evidence_pack", "audit"],
        source_deal_id=None, source_pack_id=None,
        family_key="compliance_evidence_pack",
    )
    return {
        "success": True,
        "object_id": obj["object_id"],
        "version": obj["version"],
        "filename": filename,
        "bytes": len(pdf_bytes),
        "metrics": payload["metrics"],
        "window_days": days,
    }
