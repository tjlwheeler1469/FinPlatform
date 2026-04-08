"""
Iteration 147 - Retirement Projection & Client Setup Tests
===========================================================
Tests for:
1. POST /api/retirement-projection/calculate - Monte Carlo + deterministic projection
2. GET /api/retirement-projection/{client_id} - Get last saved projection
3. POST /api/client-personal-info/setup - Create new client with entities
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestRetirementProjectionCalculate:
    """Tests for POST /api/retirement-projection/calculate"""

    def test_calculate_projection_success(self, api_client):
        """Test successful retirement projection calculation"""
        payload = {
            "client_id": f"TEST_proj_{uuid.uuid4().hex[:8]}",
            "total_portfolio": 1500000,
            "super_balance": 400000,
            "property_value": 850000,
            "cash_savings": 50000,
            "other_assets": 0,
            "annual_income": 180000,
            "annual_expenses": 90000,
            "annual_savings": 50000,
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "inflation_rate": 3.0,
            "expected_yield": 7.0,
            "super_return": 8.0,
            "marginal_tax_rate": 37.0,
            "cgt_rate": 23.5,
            "annual_cgt_liability": 5000,
            "annual_tax_deductions": 15000,
            "drawdown_strategy": "constant",
            "simulations": 100,  # Reduced for faster test
            "volatility": 12.0
        }
        
        response = api_client.post(f"{BASE_URL}/api/retirement-projection/calculate", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify response structure
        assert "client_id" in data
        assert "calculated_at" in data
        assert "consolidated_assets" in data
        assert "years_to_retirement" in data
        assert "years_in_retirement" in data
        
        # Verify deterministic projection
        assert "deterministic" in data
        assert "timeline" in data["deterministic"]
        assert "final_portfolio" in data["deterministic"]
        assert len(data["deterministic"]["timeline"]) > 0
        
        # Verify Monte Carlo results
        assert "monte_carlo" in data
        mc = data["monte_carlo"]
        assert "simulations" in mc
        assert "success_rate" in mc
        assert "percentiles" in mc
        assert "depletion_risk" in mc
        
        # Verify percentiles
        percentiles = mc["percentiles"]
        assert "p10" in percentiles
        assert "p25" in percentiles
        assert "p50_median" in percentiles
        assert "p75" in percentiles
        assert "p90" in percentiles
        
        # Verify tax summary
        assert "tax_summary" in data
        tax = data["tax_summary"]
        assert "total_cgt_lifetime" in tax
        assert "total_tax_savings" in tax
        assert "net_tax_impact" in tax
        
        # Verify recommendations
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
        
        print(f"SUCCESS: Projection calculated - Success Rate: {mc['success_rate']}%, Median: ${mc['percentiles']['p50_median']:,}")

    def test_calculate_projection_with_high_success_rate(self, api_client):
        """Test projection with parameters that should yield high success rate"""
        payload = {
            "client_id": f"TEST_high_{uuid.uuid4().hex[:8]}",
            "total_portfolio": 3000000,
            "super_balance": 800000,
            "property_value": 1000000,
            "cash_savings": 200000,
            "other_assets": 100000,
            "annual_income": 250000,
            "annual_expenses": 80000,
            "annual_savings": 100000,
            "current_age": 50,
            "retirement_age": 60,
            "life_expectancy": 85,
            "inflation_rate": 2.5,
            "expected_yield": 6.0,
            "super_return": 7.0,
            "marginal_tax_rate": 37.0,
            "cgt_rate": 23.5,
            "annual_cgt_liability": 3000,
            "annual_tax_deductions": 20000,
            "simulations": 100,
            "volatility": 10.0
        }
        
        response = api_client.post(f"{BASE_URL}/api/retirement-projection/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        # With high assets and low expenses, success rate should be high
        assert data["monte_carlo"]["success_rate"] >= 70, f"Expected high success rate, got {data['monte_carlo']['success_rate']}%"
        
        # Should have positive recommendation
        has_positive = any(r.get("type") == "positive" for r in data.get("recommendations", []))
        print(f"SUCCESS: High success rate scenario - {data['monte_carlo']['success_rate']}%, has positive recommendation: {has_positive}")

    def test_calculate_projection_timeline_structure(self, api_client):
        """Test that timeline has correct structure for each year"""
        payload = {
            "client_id": f"TEST_timeline_{uuid.uuid4().hex[:8]}",
            "total_portfolio": 1000000,
            "super_balance": 300000,
            "property_value": 500000,
            "cash_savings": 50000,
            "current_age": 55,
            "retirement_age": 65,
            "life_expectancy": 85,
            "simulations": 50
        }
        
        response = api_client.post(f"{BASE_URL}/api/retirement-projection/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        timeline = data["deterministic"]["timeline"]
        
        # Should have entries from current age to life expectancy
        expected_years = (85 - 55) + 1  # 31 years
        assert len(timeline) == expected_years, f"Expected {expected_years} timeline entries, got {len(timeline)}"
        
        # Check first entry
        first = timeline[0]
        assert first["year"] == 0
        assert first["age"] == 55
        assert first["phase"] == "accumulation"
        assert "portfolio" in first
        assert "super" in first
        assert "property" in first
        assert "total" in first
        assert "expenses" in first
        
        # Check retirement transition
        retirement_entry = next((t for t in timeline if t["age"] == 65), None)
        assert retirement_entry is not None
        assert retirement_entry["phase"] == "retirement"
        
        print(f"SUCCESS: Timeline has {len(timeline)} entries with correct structure")


class TestRetirementProjectionGet:
    """Tests for GET /api/retirement-projection/{client_id}"""

    def test_get_existing_projection(self, api_client):
        """Test retrieving a previously calculated projection"""
        client_id = f"TEST_get_{uuid.uuid4().hex[:8]}"
        
        # First calculate a projection
        calc_payload = {
            "client_id": client_id,
            "total_portfolio": 1000000,
            "super_balance": 200000,
            "property_value": 600000,
            "cash_savings": 30000,
            "current_age": 40,
            "retirement_age": 65,
            "life_expectancy": 90,
            "simulations": 50
        }
        
        calc_response = api_client.post(f"{BASE_URL}/api/retirement-projection/calculate", json=calc_payload)
        assert calc_response.status_code == 200
        
        # Now retrieve it
        get_response = api_client.get(f"{BASE_URL}/api/retirement-projection/{client_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["has_projection"] == True
        assert data["client_id"] == client_id
        assert "monte_carlo" in data
        assert "deterministic" in data
        assert "tax_summary" in data
        
        print(f"SUCCESS: Retrieved projection for {client_id}")

    def test_get_nonexistent_projection(self, api_client):
        """Test retrieving projection for client with no projection"""
        client_id = f"TEST_nonexistent_{uuid.uuid4().hex[:8]}"
        
        response = api_client.get(f"{BASE_URL}/api/retirement-projection/{client_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["has_projection"] == False
        assert data["client_id"] == client_id
        
        print(f"SUCCESS: Correctly returned has_projection=False for nonexistent client")


class TestClientSetup:
    """Tests for POST /api/client-personal-info/setup"""

    def test_create_client_basic(self, api_client):
        """Test creating a new client with basic info"""
        payload = {
            "first_name": "TEST_John",
            "last_name": "Smith",
            "email": "test.john@example.com",
            "phone": "+61400000001"
        }
        
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/setup", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["status"] == "created"
        assert "client_id" in data
        assert "name" in data
        assert data["name"] == "TEST_John Smith"
        
        print(f"SUCCESS: Created client {data['client_id']} - {data['name']}")

    def test_create_client_with_tfn_and_id(self, api_client):
        """Test creating client with TFN and ID documents"""
        payload = {
            "first_name": "TEST_Jane",
            "last_name": "Doe",
            "email": "test.jane@example.com",
            "date_of_birth": "1985-03-15",
            "address": "123 Test Street, Sydney NSW 2000",
            "tfn": "123456789",
            "id_documents": [
                {
                    "type": "drivers_licence",
                    "number": "DL12345678",
                    "expiry_date": "2028-06-30",
                    "issuing_authority": "VicRoads"
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/setup", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "created"
        assert "tfn_masked" in data
        # TFN should be masked as ***-***-XXX
        assert data["tfn_masked"].startswith("***-***-")
        assert data["id_documents_count"] == 1
        
        print(f"SUCCESS: Created client with TFN (masked: {data['tfn_masked']}) and {data['id_documents_count']} ID doc")

    def test_create_client_with_entities(self, api_client):
        """Test creating client with entities (trusts, companies, SMSFs)"""
        payload = {
            "first_name": "TEST_David",
            "last_name": "Thompson",
            "email": "test.david@example.com",
            "custom_fields": [
                {"label": "Entity: Thompson Family Trust", "value": "Family Trust (ABN: 12 345 678 901) — Trustee: David Thompson"},
                {"label": "Entity: Thompson Holdings Pty Ltd", "value": "Company (Pty Ltd) (ABN: 98 765 432 109)"},
                {"label": "Entity: Thompson SMSF", "value": "SMSF (ABN: 11 222 333 444)"}
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/setup", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "created"
        assert data["custom_fields_count"] == 3
        
        print(f"SUCCESS: Created client with {data['custom_fields_count']} entities")

    def test_create_client_minimal(self, api_client):
        """Test creating client with only required fields"""
        payload = {
            "first_name": "TEST_Minimal",
            "last_name": "User"
        }
        
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/setup", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "created"
        assert data["name"] == "TEST_Minimal User"
        
        print(f"SUCCESS: Created minimal client {data['client_id']}")


class TestHealthCheck:
    """Basic health check tests"""

    def test_api_health(self, api_client):
        """Test that API is responding"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("SUCCESS: API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
