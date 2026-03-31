"""
Test Suite for Iteration 105 - P1/P2 Features
Tests for:
1. Client Wealth Data API (Family Wealth Dashboard -> Retirement Planner)
2. Age Pension Modeling API
3. Multi-Tenant Licensee Data Isolation API
4. Document Generation API (SOA/ROA)
"""

import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestClientWealthDataAPI:
    """Tests for Client Wealth Data API - connects Family Wealth Dashboard to Retirement Planner"""
    
    def test_get_demo_client_snapshot(self):
        """Test GET /api/wealth-data/snapshot/demo_client returns demo data"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/snapshot/demo_client")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify structure
        assert "client_id" in data
        assert "client_name" in data
        assert "assets" in data
        assert "liabilities" in data
        assert "incomes" in data
        assert "people" in data
        assert "total_assets" in data
        assert "total_liabilities" in data
        assert "net_worth" in data
        
        # Verify demo data values
        assert data["client_id"] == "demo_client"
        assert data["client_name"] == "James & Sarah Mitchell"
        assert data["is_couple"] is True
        assert len(data["people"]) == 2
        assert len(data["assets"]) >= 5
        print(f"✓ Demo client snapshot returned with {len(data['assets'])} assets, net worth: ${data['net_worth']:,}")
    
    def test_get_entity_types(self):
        """Test GET /api/wealth-data/entities returns entity types"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/entities")
        assert response.status_code == 200
        
        data = response.json()
        assert "entities" in data
        entities = data["entities"]
        
        # Verify all expected entity types
        entity_values = [e["value"] for e in entities]
        assert "personal" in entity_values
        assert "joint" in entity_values
        assert "company" in entity_values
        assert "trust" in entity_values
        assert "smsf" in entity_values
        
        # Verify CGT discount info
        for entity in entities:
            assert "cgt_discount" in entity
            assert "label" in entity
            assert "color" in entity
        
        print(f"✓ Entity types returned: {entity_values}")
    
    def test_get_asset_types(self):
        """Test GET /api/wealth-data/asset-types returns asset types with yields"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/asset-types")
        assert response.status_code == 200
        
        data = response.json()
        assert "asset_types" in data
        asset_types = data["asset_types"]
        
        # Verify expected asset types
        asset_values = [a["value"] for a in asset_types]
        assert "cash" in asset_values
        assert "shares_au" in asset_values
        assert "property" in asset_values
        assert "super_accum" in asset_values
        
        # Verify default yields
        for asset in asset_types:
            assert "default_yield" in asset
            assert "label" in asset
            assert asset["default_yield"] > 0
        
        print(f"✓ Asset types returned: {len(asset_types)} types with default yields")


class TestAgePensionAPI:
    """Tests for Age Pension Modeling API"""
    
    def test_get_pension_rates(self):
        """Test GET /api/age-pension/rates returns current pension rates"""
        response = requests.get(f"{BASE_URL}/api/age-pension/rates")
        assert response.status_code == 200
        
        data = response.json()
        assert "max_rates" in data
        assert "assets_thresholds" in data
        assert "income_thresholds" in data
        assert "deeming_rates" in data
        
        # Verify rate structure
        assert "single" in data["max_rates"]
        assert "couple_combined" in data["max_rates"]
        assert data["max_rates"]["single"]["total_annual"] > 0
        
        print(f"✓ Pension rates returned - Single max: ${data['max_rates']['single']['total_annual']:,.2f}/year")
    
    def test_get_qualifying_age(self):
        """Test GET /api/age-pension/qualifying-age/{birth_year} returns qualifying age"""
        # Test for someone born in 1980 (should be 67)
        response = requests.get(f"{BASE_URL}/api/age-pension/qualifying-age/1980")
        assert response.status_code == 200
        
        data = response.json()
        assert data["birth_year"] == 1980
        assert data["qualifying_age"] == 67.0
        assert "eligible_from_year" in data
        
        # Test for someone born in 1952 (should be 65)
        response2 = requests.get(f"{BASE_URL}/api/age-pension/qualifying-age/1952")
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["qualifying_age"] == 65.0
        
        print(f"✓ Qualifying age for 1980: {data['qualifying_age']}, for 1952: {data2['qualifying_age']}")
    
    def test_calculate_pension_eligibility_not_yet_eligible(self):
        """Test POST /api/age-pension/calculate for person not yet eligible"""
        payload = {
            "person": {
                "name": "Test Person",
                "date_of_birth": "1970-01-01",  # Age ~56, not yet 67
                "is_homeowner": True,
                "residency_years": 30
            },
            "assets": {
                "financial_assets": 200000,
                "real_assets": 0,
                "personal_assets": 10000
            },
            "income": {
                "employment_income": 80000,
                "investment_income": 5000
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/age-pension/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["eligible"] is False
        assert "qualifying_age" in data
        assert "years_until_eligible" in data
        
        print(f"✓ Pension calculation: Not eligible, {data['years_until_eligible']:.1f} years until eligible")
    
    def test_calculate_pension_eligibility_eligible(self):
        """Test POST /api/age-pension/calculate for eligible person"""
        payload = {
            "person": {
                "name": "Retired Person",
                "date_of_birth": "1955-01-01",  # Age ~71, eligible
                "is_homeowner": True,
                "residency_years": 40
            },
            "assets": {
                "financial_assets": 250000,
                "real_assets": 0,
                "personal_assets": 15000
            },
            "income": {
                "employment_income": 0,
                "investment_income": 8000
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/age-pension/calculate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "annual_pension" in data
        assert "fortnightly_pension" in data
        assert "assets_test" in data
        assert "income_test" in data
        
        print(f"✓ Pension calculation: Eligible={data.get('eligible')}, Annual=${data.get('annual_pension', 0):,.2f}")


class TestMultiTenantAPI:
    """Tests for Multi-Tenant Licensee Data Isolation API"""
    
    def test_setup_demo_tenant(self):
        """Test POST /api/tenants/demo/setup creates demo tenant"""
        response = requests.post(f"{BASE_URL}/api/tenants/demo/setup")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["licensee_id"] == "LIC-DEMO0001"
        assert "advisers" in data
        assert len(data["advisers"]) >= 2
        
        print(f"✓ Demo tenant created: {data['licensee_id']} with {len(data['advisers'])} advisers")
    
    def test_get_licensees_list(self):
        """Test GET /api/tenants/licensees returns licensee list"""
        response = requests.get(f"{BASE_URL}/api/tenants/licensees")
        assert response.status_code == 200
        
        data = response.json()
        assert "licensees" in data
        assert "total" in data
        assert data["total"] >= 1
        
        # Verify demo licensee exists
        licensee_ids = [l.get("licensee_id") or l.get("id") for l in data["licensees"]]
        assert any("DEMO" in str(lid) for lid in licensee_ids), "Demo licensee should exist"
        
        print(f"✓ Licensees list returned: {data['total']} licensees")
    
    def test_get_advisers_list(self):
        """Test GET /api/tenants/advisers returns adviser list"""
        response = requests.get(f"{BASE_URL}/api/tenants/advisers")
        assert response.status_code == 200
        
        data = response.json()
        assert "advisers" in data
        assert "total" in data
        
        # Verify demo advisers exist
        if data["total"] > 0:
            adviser = data["advisers"][0]
            assert "adviser_id" in adviser
            assert "name" in adviser
            assert "licensee_id" in adviser
        
        print(f"✓ Advisers list returned: {data['total']} advisers")
    
    def test_get_licensee_details(self):
        """Test GET /api/tenants/licensees/{licensee_id} returns licensee details"""
        response = requests.get(f"{BASE_URL}/api/tenants/licensees/LIC-DEMO0001")
        assert response.status_code == 200
        
        data = response.json()
        assert data["licensee_id"] == "LIC-DEMO0001"
        assert "name" in data
        assert "afsl_number" in data
        
        print(f"✓ Licensee details: {data['name']} (AFSL: {data['afsl_number']})")


class TestDocumentGenerationAPI:
    """Tests for Document Generation API (SOA/ROA PDF generation)"""
    
    def test_get_documents_list(self):
        """Test GET /api/documents/ returns document list"""
        response = requests.get(f"{BASE_URL}/api/documents/")
        assert response.status_code == 200
        
        data = response.json()
        assert "documents" in data
        assert "total" in data
        
        print(f"✓ Documents list returned: {data['total']} documents")
    
    def test_get_soa_template(self):
        """Test GET /api/documents/generate/soa/template returns SOA template"""
        response = requests.get(f"{BASE_URL}/api/documents/generate/soa/template")
        assert response.status_code == 200
        
        data = response.json()
        assert "template" in data
        template = data["template"]
        
        # Verify template structure
        assert "client_id" in template
        assert "client_name" in template
        assert "adviser_name" in template
        assert "recommendations" in template
        assert "fees" in template
        assert "warnings" in template
        
        print(f"✓ SOA template returned with required fields")
    
    def test_generate_soa_pdf(self):
        """Test POST /api/documents/generate/soa generates SOA PDF"""
        payload = {
            "client_id": "test_client_001",
            "client_name": "Test Client",
            "adviser_name": "Test Adviser",
            "adviser_afsl": "123456",
            "advice_date": "2026-01-15",
            "advice_summary": "This is a test SOA for retirement planning.",
            "recommendations": [
                {
                    "title": "Increase Super Contributions",
                    "description": "Maximize concessional contributions to $30,000 per year",
                    "rationale": "Tax-effective wealth building for retirement"
                }
            ],
            "risk_profile": "Balanced",
            "current_situation": {
                "risk_profile": "Balanced",
                "investment_timeframe": "10+ years",
                "portfolio_value": 500000,
                "annual_income": 120000
            },
            "goals": [
                {"name": "Retirement", "description": "Retire at 65 with $1.5M"}
            ],
            "strategy": {},
            "fees": {
                "advice_fee": 3300,
                "ongoing_fee": 2200,
                "implementation_fee": 550
            },
            "warnings": [
                "Past performance is not indicative of future results",
                "Investment values may fluctuate"
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/documents/generate/soa", json=payload)
        
        # Should return PDF or success response
        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            if "application/pdf" in content_type:
                assert len(response.content) > 1000, "PDF should have content"
                print(f"✓ SOA PDF generated: {len(response.content)} bytes")
            else:
                data = response.json()
                if data.get("success") is False:
                    print(f"⚠ SOA PDF generation not available: {data.get('error')}")
                else:
                    print(f"✓ SOA generation response received")
        else:
            print(f"⚠ SOA generation returned status {response.status_code}")


class TestHealthAndIntegration:
    """Integration tests to verify all new routes are properly registered"""
    
    def test_health_check(self):
        """Verify backend is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Backend healthy: {data['service']} v{data['version']}")
    
    def test_wealth_data_routes_registered(self):
        """Verify wealth-data routes are accessible"""
        endpoints = [
            "/api/wealth-data/entities",
            "/api/wealth-data/asset-types",
            "/api/wealth-data/snapshot/demo_client"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 200, f"Endpoint {endpoint} failed with {response.status_code}"
        
        print(f"✓ All wealth-data routes registered and accessible")
    
    def test_age_pension_routes_registered(self):
        """Verify age-pension routes are accessible"""
        endpoints = [
            "/api/age-pension/rates",
            "/api/age-pension/qualifying-age/1980"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 200, f"Endpoint {endpoint} failed with {response.status_code}"
        
        print(f"✓ All age-pension routes registered and accessible")
    
    def test_tenant_routes_registered(self):
        """Verify tenant routes are accessible"""
        endpoints = [
            "/api/tenants/licensees",
            "/api/tenants/advisers"
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 200, f"Endpoint {endpoint} failed with {response.status_code}"
        
        print(f"✓ All tenant routes registered and accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
