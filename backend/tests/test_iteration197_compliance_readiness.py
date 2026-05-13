"""Iteration 197 — Compliance audit /readiness-events endpoints (Phase 2)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://xplan-sync-hub.preview.emergentagent.com").rstrip("/")
PREFIX = f"{BASE_URL}/api/compliance-audit"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ── POST /readiness-events ──────────────────────────────────────────────────
class TestReadinessEventPost:
    def test_post_minimal_valid_event(self, session):
        payload = {
            "client_id": "TEST_iter197_a",
            "client_name": "TEST Thompson",
            "score": 92,
            "classification": "STRONG",
            "factors": [{"id": "income", "score": 88}, {"id": "longevity", "score": 95}],
            "inputs": {"current_age": 55, "retirement_age": 62},
            "num_sims": 200,
            "actor": "adviser",
        }
        r = session.post(f"{PREFIX}/readiness-events", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success")
        assert "event_id" in body and isinstance(body["event_id"], str) and body["event_id"].startswith("rre_")

    def test_post_missing_client_id_returns_400(self, session):
        r = session.post(f"{PREFIX}/readiness-events", json={"score": 50}, timeout=10)
        assert r.status_code == 400, r.text
        assert "client_id" in r.text.lower()

    def test_post_then_visible_in_list(self, session):
        unique_id = f"TEST_iter197_b_{int(time.time())}"
        payload = {"client_id": unique_id, "client_name": "TEST Persisted", "score": 70, "classification": "WATCHLIST"}
        r = session.post(f"{PREFIX}/readiness-events", json=payload, timeout=10)
        assert r.status_code == 200
        # Verify GET returns it
        r2 = session.get(f"{PREFIX}/readiness-events", params={"client_id": unique_id}, timeout=10)
        assert r2.status_code == 200
        data = r2.json()
        assert data.get("total", 0) >= 1
        events = data.get("events", [])
        assert any(ev.get("client_id") == unique_id for ev in events)
        # Validate event shape
        ev = next(e for e in events if e["client_id"] == unique_id)
        assert ev["client_name"] == "TEST Persisted"
        assert ev["score"] == 70
        assert ev["classification"] == "WATCHLIST"


# ── GET /readiness-events ───────────────────────────────────────────────────
class TestReadinessEventsList:
    def test_list_returns_envelope(self, session):
        r = session.get(f"{PREFIX}/readiness-events", timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert "events" in body and isinstance(body["events"], list)
        assert "total" in body and isinstance(body["total"], int)
        assert "total_all" in body and isinstance(body["total_all"], int)
        assert "timestamp" in body

    def test_list_respects_limit(self, session):
        # seed 3 events
        for i in range(3):
            session.post(f"{PREFIX}/readiness-events", json={"client_id": "TEST_iter197_limit", "score": 80 + i}, timeout=10)
        r = session.get(f"{PREFIX}/readiness-events", params={"client_id": "TEST_iter197_limit", "limit": 2}, timeout=10)
        assert r.status_code == 200
        assert len(r.json()["events"]) <= 2


# ── GET /readiness-events/summary ───────────────────────────────────────────
class TestReadinessEventsSummary:
    def test_summary_shape(self, session):
        # seed across buckets
        session.post(f"{PREFIX}/readiness-events", json={"client_id": "TEST_iter197_sum_strong", "score": 95}, timeout=10)
        session.post(f"{PREFIX}/readiness-events", json={"client_id": "TEST_iter197_sum_ot", "score": 80}, timeout=10)
        session.post(f"{PREFIX}/readiness-events", json={"client_id": "TEST_iter197_sum_wl", "score": 65}, timeout=10)
        session.post(f"{PREFIX}/readiness-events", json={"client_id": "TEST_iter197_sum_ar", "score": 40}, timeout=10)
        r = session.get(f"{PREFIX}/readiness-events/summary", timeout=10)
        assert r.status_code == 200
        body = r.json()
        for k in ("total_events", "unique_clients", "by_client", "by_day", "score_buckets"):
            assert k in body, f"missing key {k}"
        sb = body["score_buckets"]
        for k in ("strong", "on_track", "watchlist", "at_risk"):
            assert k in sb
        assert body["total_events"] >= 4
        assert sb["strong"] >= 1 and sb["on_track"] >= 1 and sb["watchlist"] >= 1 and sb["at_risk"] >= 1


# ── Smoke checks for related routes ─────────────────────────────────────────
class TestRelated:
    def test_audit_log_smoke(self, session):
        r = session.get(f"{PREFIX}/audit-log", timeout=10)
        assert r.status_code == 200
        assert "logs" in r.json()

    def test_compliance_dashboard_smoke(self, session):
        r = session.get(f"{PREFIX}/dashboard", timeout=10)
        assert r.status_code == 200
        body = r.json()
        assert "kyc" in body and "approvals" in body and "documents" in body and "audit" in body
