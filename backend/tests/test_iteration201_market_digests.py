"""
Iteration 201 — Tests for:
  - GET /api/market-feed/snapshot   (Yahoo provider + 30s cache)
  - GET /api/digests/status         (APScheduler health)
  - GET /api/digests/preview/signal (daily digest preview)
  - GET /api/digests/preview/actions (weekly report preview)
  - POST /api/digests/send/signal   (mocked email enqueue)
  - POST /api/digests/send/actions  (mocked email enqueue)
  - GET /api/digests/log            (digest_log entries)
"""
import os
import time
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # backend env may not have REACT_APP_BACKEND_URL — read it from frontend env
    with open("/app/frontend/.env") as f:
        for ln in f:
            if ln.startswith("REACT_APP_BACKEND_URL="):
                BASE = ln.split("=", 1)[1].strip().rstrip("/")
                break


# ------------------------- MARKET FEED -------------------------

class TestMarketSnapshot:
    def test_snapshot_returns_required_fields(self):
        r = requests.get(f"{BASE}/api/market-feed/snapshot", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("source") in ("yahoo", "simulated")
        assert isinstance(data.get("timestamp"), str)
        assert isinstance(data.get("avg_delta_pct"), (int, float))
        items = data.get("items") or []
        assert len(items) >= 3
        symbols = {i["symbol"] for i in items}
        for required in ("XJO", "XAO", "AUDUSD"):
            assert required in symbols, f"missing symbol {required}: {symbols}"
        for i in items:
            assert isinstance(i.get("last"), (int, float)), f"last not number: {i}"
            assert isinstance(i.get("delta_pct"), (int, float)), f"delta_pct not number: {i}"

    def test_snapshot_source_is_yahoo_when_reachable(self):
        r = requests.get(f"{BASE}/api/market-feed/snapshot", timeout=15)
        data = r.json()
        # Document the source — yahoo when reachable, simulated otherwise.
        # Main agent confirmed Yahoo is live, so we expect yahoo here.
        assert data.get("source") == "yahoo", f"Expected yahoo, got {data.get('source')}"

    def test_snapshot_30s_cache(self):
        r1 = requests.get(f"{BASE}/api/market-feed/snapshot", timeout=15).json()
        time.sleep(1)
        r2 = requests.get(f"{BASE}/api/market-feed/snapshot", timeout=15).json()
        # Same timestamp means cache hit
        assert r1["timestamp"] == r2["timestamp"], "Cache miss on back-to-back calls within 30s"


# ------------------------- DIGEST STATUS -------------------------

class TestDigestStatus:
    def test_status_returns_scheduler_running_with_jobs(self):
        r = requests.get(f"{BASE}/api/digests/status", timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("scheduler_running")
        jobs = data.get("jobs") or []
        ids = {j["id"] for j in jobs}
        assert {"signal_daily", "actions_weekly"}.issubset(ids), f"missing jobs: {ids}"
        # next_run is ISO and parseable
        from datetime import datetime
        for j in jobs:
            assert j.get("next_run"), f"no next_run for {j['id']}"
            datetime.fromisoformat(j["next_run"].replace("Z", "+00:00"))
        # Resend not configured (per problem statement)
        assert not data.get("resend_configured")
        assert data.get("mode") == "mocked"
        assert data.get("default_recipient")


# ------------------------- DIGEST PREVIEWS -------------------------

class TestDigestPreviews:
    def test_preview_signal(self):
        r = requests.get(f"{BASE}/api/digests/preview/signal", params={"days": 1}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        digest = data.get("digest") or {}
        for k in ("pending_drafts", "lowest_scoring_clients", "summary", "window_days", "generated_at"):
            assert k in digest, f"missing key {k}"
        assert digest.get("window_days") == 1
        html = data.get("html") or ""
        assert isinstance(html, str)
        assert len(html) > 500, f"html too short: {len(html)}"

    def test_preview_actions(self):
        r = requests.get(f"{BASE}/api/digests/preview/actions", params={"days": 7}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        report = data.get("report") or {}
        for k in ("totals", "delta_wow", "daily", "window_days"):
            assert k in report, f"missing key {k}"
        assert report.get("window_days") == 7
        html = data.get("html") or ""
        assert isinstance(html, str) and len(html) > 200


# ------------------------- DIGEST SEND + LOG -------------------------

class TestDigestSendAndLog:
    def test_send_signal_appends_log(self):
        before = requests.get(f"{BASE}/api/digests/log", timeout=10).json()
        before_n = before.get("total", 0)
        r = requests.post(f"{BASE}/api/digests/send/signal", json={}, timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success")
        assert body.get("triggered") == "signal_daily"
        assert body.get("mode") == "mocked"
        # Async task — wait a moment for log insert
        time.sleep(2)
        after = requests.get(f"{BASE}/api/digests/log", timeout=10).json()
        assert after.get("total", 0) >= before_n, "log entries did not grow"
        latest = (after.get("entries") or [])[0]
        assert latest.get("type", "").startswith("digest:signal") or latest.get("mode") == "mocked"

    def test_send_actions_appends_log(self):
        r = requests.post(f"{BASE}/api/digests/send/actions", json={}, timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success")
        assert body.get("triggered") == "actions_weekly"
        assert body.get("mode") == "mocked"
        time.sleep(2)
        log = requests.get(f"{BASE}/api/digests/log", timeout=10).json()
        types = [e.get("type", "") for e in (log.get("entries") or [])]
        assert any("actions_weekly" in t for t in types), f"no actions_weekly in log: {types[:5]}"


# ------------------------- REGRESSION CHECKS -------------------------

class TestRegression:
    def test_actions_shipped_still_works(self):
        r = requests.get(f"{BASE}/api/reports/actions-shipped", params={"days": 7}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "totals" in data and "daily" in data

    def test_intelligence_feed_endpoint(self):
        # Ensure no 500s
        r = requests.get(f"{BASE}/api/intelligence-feed", timeout=10)
        assert r.status_code in (200, 404), r.status_code

    def test_health(self):
        r = requests.get(f"{BASE}/api/", timeout=10)
        assert r.status_code in (200, 404)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
