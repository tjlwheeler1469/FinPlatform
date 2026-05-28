"""Iteration 223 backend regression tests:
- POST /api/crm/clients (Quick Overview → Add as new client)
- POST /api/pdf-report/generate (Quick Overview → Export PDF)
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://decision-engine-109.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- CRM clients ---
class TestCrmClients:
    def test_create_quick_overview_client(self, api):
        payload = {
            "name": "Test Quick",
            "email": "test@example.com",
            "status": "prospect",
            "annual_income": 150000,
        }
        r = api.post(f"{BASE_URL}/api/crm/clients", json=payload)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("success") is True
        client = body.get("client") or {}
        assert client.get("client_id", "").startswith("client_")
        assert client.get("name") == "Test Quick"
        assert client.get("status") == "prospect"


# --- PDF report ---
class TestPdfReport:
    def test_generate_retirement_pdf(self, api):
        body = {
            "analysis_data": {
                "type": "retirement_analysis",
                "client_summary": {"name": "X", "age": 45, "retirement_age": 67, "years_to_retirement": 22},
                "current_position": {"total_wealth": 2100000, "super_balance": 350000, "annual_income": 150000},
                "retirement_analysis": {"total_retirement_fund_needed": 1800000, "surplus_or_shortfall": 300000},
                "entities": [{"name": "Super", "value": 350000}],
                "assumptions": ["Return 7%"],
                "recommendations": ["Foo"],
            }
        }
        r = api.post(f"{BASE_URL}/api/pdf-report/generate", json=body)
        assert r.status_code == 200, r.text[:300]
        assert "application/pdf" in r.headers.get("content-type", ""), r.headers
        assert r.content[:4] == b"%PDF", "Body must start with %PDF"
        assert len(r.content) > 1000
