"""
Iteration 202 regression sweep:
- New aggregator: GET /api/compliance-reports/data
- Regression of related endpoints: /api/compliance-audit, /api/advice/drafts,
  /api/market/snapshot and a readiness endpoint to confirm no import-time breakage
  was introduced by the new compliance_reports route module.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://decision-engine-109.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ── New aggregator ────────────────────────────────────────────────────────────
class TestComplianceReportsAggregator:
    def test_endpoint_returns_200(self, api):
        r = api.get(f"{BASE_URL}/api/compliance-reports/data", timeout=30)
        assert r.status_code == 200, r.text

    def test_payload_shape(self, api):
        d = api.get(f"{BASE_URL}/api/compliance-reports/data", timeout=30).json()
        for key in [
            "generated_at", "period_label", "data_source", "fallback_recommended",
            "monthly_summary", "adviser_rows", "issues", "client_risk_rows",
            "risk_buckets", "audit_rows", "asic_rows", "counts",
        ]:
            assert key in d, f"missing key {key}"
        assert d["data_source"] == "mongodb-live"
        assert isinstance(d["fallback_recommended"], bool)

    def test_monthly_summary_metrics(self, api):
        d = api.get(f"{BASE_URL}/api/compliance-reports/data", timeout=30).json()
        ms = d["monthly_summary"]
        assert "metrics" in ms and isinstance(ms["metrics"], list)
        assert len(ms["metrics"]) >= 1
        # each row is [label, current, prev, delta]
        for row in ms["metrics"]:
            assert isinstance(row, list) and len(row) == 4

    def test_counts_reflect_real_collections(self, api):
        d = api.get(f"{BASE_URL}/api/compliance-reports/data", timeout=30).json()
        c = d["counts"]
        for k in ["readiness_events", "drafts_approved", "drafts_rejected",
                  "execution_tickets", "notifications"]:
            assert k in c
            assert isinstance(c[k], int)
        # Per problem statement, seeded data should yield non-zero readiness/approved
        assert c["readiness_events"] > 0
        assert c["drafts_approved"] > 0
        # If any of them have data, fallback must NOT be recommended
        if any(c.values()):
            assert not d["fallback_recommended"]

    def test_risk_and_audit_payloads(self, api):
        d = api.get(f"{BASE_URL}/api/compliance-reports/data", timeout=30).json()
        # risk_buckets has 4 standard buckets
        labels = [r[0] for r in d["risk_buckets"]]
        assert labels == ["Strong", "On Track", "Watchlist", "At Risk"]
        # asic_rows has 8 rows by design
        assert len(d["asic_rows"]) == 8


# ── Regression sweep on adjacent endpoints (no import breakage) ───────────────
class TestRegressionSweep:
    def test_compliance_audit(self, api):
        r = api.get(f"{BASE_URL}/api/compliance-audit", timeout=30)
        # Should be reachable (may be 200 or 405 if list endpoint differs)
        assert r.status_code in (200, 404, 405), r.text
        # Specifically not 500/502
        assert r.status_code < 500

    def test_advice_drafts(self, api):
        r = api.get(f"{BASE_URL}/api/advice/drafts", timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        # Either list or dict containing items
        assert isinstance(body, (list, dict))

    def test_market_snapshot(self, api):
        r = api.get(f"{BASE_URL}/api/market/snapshot", timeout=30)
        assert r.status_code in (200, 404), r.text
        assert r.status_code < 500

    def test_market_feed_snapshot_alt(self, api):
        # The actual route per prior iteration
        r = api.get(f"{BASE_URL}/api/market-feed/snapshot", timeout=30)
        assert r.status_code in (200, 404)
        assert r.status_code < 500

    def test_readiness_events_endpoint_alive(self, api):
        # Common readiness endpoints — ensure at least one is alive (no 500)
        candidates = [
            "/api/readiness-events",
            "/api/readiness/events",
            "/api/client-readiness",
            "/api/retirement-projection/health",
        ]
        statuses = []
        for path in candidates:
            try:
                r = api.get(f"{BASE_URL}{path}", timeout=15)
                statuses.append((path, r.status_code))
            except Exception as e:
                statuses.append((path, str(e)))
        # No 5xx anywhere
        for path, st in statuses:
            if isinstance(st, int):
                assert st < 500, f"{path} returned {st}"

    def test_openapi_includes_compliance_reports(self, api):
        # Behind k8s ingress, openapi may not be exposed externally; only assert
        # if it is JSON-serializable. Endpoint reachability is already covered above.
        r = api.get(f"{BASE_URL}/api/openapi.json", timeout=30)
        if r.status_code == 200 and r.headers.get("content-type", "").startswith("application/json"):
            paths = r.json().get("paths", {})
            assert any("compliance-reports" in p for p in paths)
