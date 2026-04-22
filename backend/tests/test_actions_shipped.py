"""Test Actions Shipped Report endpoint (iteration 200)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://retirement-readiness-2.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


REQUIRED_TOTALS = {
    "simulations", "strategies_applied", "advice_drafts_started",
    "advice_drafts_approved", "clients_notified", "tickets_created",
    "readiness_computes", "unique_clients_touched", "dollar_impact_approved",
}
REQUIRED_DELTA = {
    "simulations_pct", "strategies_applied_pct",
    "advice_drafts_approved_pct", "clients_notified_pct",
}


class TestActionsShipped:
    def test_default_7_days(self, client):
        r = client.get(f"{BASE_URL}/api/reports/actions-shipped?days=7")
        assert r.status_code == 200
        d = r.json()
        assert d["window_days"] == 7
        assert d["actor"] is None
        assert REQUIRED_TOTALS.issubset(d["totals"].keys())
        assert REQUIRED_DELTA.issubset(d["delta_wow"].keys())
        assert isinstance(d["daily"], list)
        assert len(d["daily"]) == 7
        for entry in d["daily"]:
            assert "date" in entry and "actions" in entry
            assert isinstance(entry["actions"], int)

    def test_30_days(self, client):
        r = client.get(f"{BASE_URL}/api/reports/actions-shipped?days=30")
        assert r.status_code == 200
        d = r.json()
        assert d["window_days"] == 30
        assert len(d["daily"]) == 30

    def test_actor_filter(self, client):
        r = client.get(f"{BASE_URL}/api/reports/actions-shipped?days=7&actor=adviser_001")
        assert r.status_code == 200
        d = r.json()
        assert d["actor"] == "adviser_001"
        assert REQUIRED_TOTALS.issubset(d["totals"].keys())

    def test_totals_are_numeric(self, client):
        r = client.get(f"{BASE_URL}/api/reports/actions-shipped?days=7")
        d = r.json()
        for k in REQUIRED_TOTALS:
            assert isinstance(d["totals"][k], int), f"{k} should be int"

    def test_delta_wow_numeric(self, client):
        r = client.get(f"{BASE_URL}/api/reports/actions-shipped?days=7")
        d = r.json()
        for k in REQUIRED_DELTA:
            assert isinstance(d["delta_wow"][k], (int, float)), f"{k} should be numeric"
