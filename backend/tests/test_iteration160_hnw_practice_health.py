"""
Iteration 160 — HNW practice health backend verification.

Validates that /api/practice-health/dashboard and /metrics return HNW-scaled
key metrics: total_aum=$480M, total_clients=47, total_revenue=$4.52M.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Health check
class TestPracticeHealthHNW:
    def test_dashboard_returns_200_with_hnw_metrics(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/practice-health/dashboard", timeout=15)
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:200]}"
        data = r.json()
        assert "key_metrics" in data
        km = data["key_metrics"]
        assert km["total_aum"] == 480_000_000, f"expected 480M AUM got {km['total_aum']}"
        assert km["total_clients"] == 47, f"expected 47 clients got {km['total_clients']}"
        assert km["total_revenue"] == 4_520_000, f"expected 4.52M revenue got {km['total_revenue']}"

    def test_metrics_endpoint_also_hnw(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/practice-health/metrics", timeout=15)
        assert r.status_code == 200
        km = r.json()
        assert km["total_aum"] == 480_000_000
        assert km["total_clients"] == 47
        assert km["total_revenue"] == 4_520_000
        # Derived averages sanity
        assert km["average_client_aum"] > 10_000_000, "avg client AUM should be >$10M in HNW book"

    def test_trends_show_hnw_scale(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/practice-health/trends", timeout=15)
        assert r.status_code == 200
        data = r.json()
        q1 = data["metrics"]["2025-Q1"]
        assert q1["aum"] == 480_000_000
        assert q1["clients"] == 47
