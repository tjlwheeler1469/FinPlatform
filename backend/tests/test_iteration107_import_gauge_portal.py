"""
Test Iteration 107: Import from Net Worth, Gauge Design, Client Portal Layout
Tests for:
1. Import from Net Worth button - /api/wealth-data/snapshot/{client_id} endpoint
2. Confidence gauge design (custom SVG semicircle)
3. Client Portal using Layout component with sidebar navigation
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWealthDataSnapshot:
    """Tests for /api/wealth-data/snapshot endpoint used by Import from Net Worth button"""
    
    def test_wealth_snapshot_demo_client(self):
        """Test wealth snapshot returns data for demo_client"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/snapshot/demo_client")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields for import functionality
        assert "client_id" in data, "Missing client_id"
        assert data["client_id"] == "demo_client"
        assert "client_name" in data, "Missing client_name"
        assert "is_couple" in data, "Missing is_couple flag"
        assert "total_assets" in data, "Missing total_assets"
        assert "total_liabilities" in data, "Missing total_liabilities"
        assert "net_worth" in data, "Missing net_worth"
        assert "total_income" in data, "Missing total_income"
        assert "total_expenses" in data, "Missing total_expenses"
        
        print(f"PASS: Wealth snapshot returns complete data for demo_client")
        print(f"  - Net Worth: ${data['net_worth']:,}")
        print(f"  - Total Assets: ${data['total_assets']:,}")
        print(f"  - Is Couple: {data['is_couple']}")
    
    def test_wealth_snapshot_has_people_data(self):
        """Test wealth snapshot includes people data for age import"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/snapshot/demo_client")
        assert response.status_code == 200
        
        data = response.json()
        assert "people" in data, "Missing people array"
        assert len(data["people"]) > 0, "People array is empty"
        
        person = data["people"][0]
        assert "current_age" in person, "Missing current_age in person"
        assert "retirement_age" in person, "Missing retirement_age in person"
        assert "name" in person, "Missing name in person"
        
        print(f"PASS: People data available for age import")
        print(f"  - Primary person: {person['name']}, Age: {person['current_age']}, Retirement: {person['retirement_age']}")
    
    def test_wealth_snapshot_has_assets_breakdown(self):
        """Test wealth snapshot includes detailed assets for super/investment import"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/snapshot/demo_client")
        assert response.status_code == 200
        
        data = response.json()
        assert "assets" in data, "Missing assets array"
        assert len(data["assets"]) > 0, "Assets array is empty"
        
        # Check for super and investment assets
        asset_types = [a.get("type") for a in data["assets"]]
        has_super = any("super" in t for t in asset_types)
        has_investments = any(t in ["shares_au", "shares_intl", "etf", "managed_fund"] for t in asset_types)
        
        assert has_super, "No superannuation assets found"
        assert has_investments, "No investment assets found"
        
        # Calculate totals for verification
        super_total = sum(a["value"] for a in data["assets"] if "super" in a.get("type", ""))
        investment_total = sum(a["value"] for a in data["assets"] if a.get("type") in ["shares_au", "shares_intl", "etf", "managed_fund"])
        
        print(f"PASS: Assets breakdown available for import")
        print(f"  - Super Balance: ${super_total:,}")
        print(f"  - Investment Balance: ${investment_total:,}")
    
    def test_wealth_snapshot_unknown_client_returns_demo(self):
        """Test that unknown client_id returns demo data (graceful fallback)"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/snapshot/unknown_client_xyz")
        assert response.status_code == 200, f"Expected 200 for unknown client, got {response.status_code}"
        
        data = response.json()
        assert "net_worth" in data, "Should return demo data with net_worth"
        assert data["net_worth"] > 0, "Demo data should have positive net worth"
        
        print(f"PASS: Unknown client returns demo data gracefully")


class TestClientPortalEndpoints:
    """Tests for Client Portal API endpoints"""
    
    def test_client_portal_dashboard(self):
        """Test client portal dashboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard/portal_001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "name" in data, "Missing client name"
        assert "summary" in data, "Missing summary"
        
        if data.get("summary"):
            summary = data["summary"]
            assert "net_worth" in summary, "Missing net_worth in summary"
            
        print(f"PASS: Client portal dashboard returns data")
        print(f"  - Client: {data.get('name', 'N/A')}")
    
    def test_client_portal_net_worth(self):
        """Test client portal net worth endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should have assets and/or liabilities
        has_financial_data = "assets" in data or "liabilities" in data or "net_worth" in data
        assert has_financial_data, "Missing financial data in net worth response"
        
        print(f"PASS: Client portal net worth endpoint working")
    
    def test_client_portal_goals(self):
        """Test client portal goals endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/goals/portal_001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "goals" in data or "summary" in data, "Missing goals data"
        
        print(f"PASS: Client portal goals endpoint working")
    
    def test_client_portal_notifications(self):
        """Test client portal notifications endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/notifications/portal_001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "notifications" in data, "Missing notifications array"
        
        print(f"PASS: Client portal notifications endpoint working")
        print(f"  - Notifications count: {len(data.get('notifications', []))}")


class TestConfidenceEngineIntegration:
    """Tests for Confidence Engine with imported data"""
    
    def test_quick_calculate_with_imported_values(self):
        """Test confidence calculation with values that would come from import"""
        # Get demo wealth data first
        wealth_response = requests.get(f"{BASE_URL}/api/wealth-data/snapshot/demo_client")
        assert wealth_response.status_code == 200
        wealth_data = wealth_response.json()
        
        # Extract values like the import function would
        net_worth = wealth_data.get("net_worth", 2000000)
        total_income = wealth_data.get("total_income", 200000)
        total_expenses = wealth_data.get("total_expenses", 100000)
        
        # Get age from people
        people = wealth_data.get("people", [])
        current_age = people[0].get("current_age", 45) if people else 45
        retirement_age = people[0].get("retirement_age", 65) if people else 65
        is_couple = wealth_data.get("is_couple", False)
        
        # Call confidence engine with imported values
        response = requests.post(
            f"{BASE_URL}/api/confidence-engine/quick-calculate",
            params={
                "net_worth": net_worth,
                "annual_income": total_income,
                "annual_expenses": total_expenses,
                "current_age": current_age,
                "retirement_age": retirement_age,
                "life_expectancy": 90,
                "is_couple": is_couple,
                "num_simulations": 100
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "confidence_score" in data, "Missing confidence_score"
        assert "risk_breakdown" in data, "Missing risk_breakdown"
        assert "statistics" in data, "Missing statistics"
        
        score = data["confidence_score"]
        assert 0 <= score <= 100, f"Confidence score {score} out of range"
        
        print(f"PASS: Confidence calculation with imported values")
        print(f"  - Imported Net Worth: ${net_worth:,}")
        print(f"  - Imported Age: {current_age}, Retirement: {retirement_age}")
        print(f"  - Calculated Confidence: {score:.1f}%")


class TestWealthDataListAndEntities:
    """Tests for supporting wealth data endpoints"""
    
    def test_list_clients(self):
        """Test listing clients with wealth data"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "clients" in data, "Missing clients array"
        assert "total" in data, "Missing total count"
        
        print(f"PASS: Client list endpoint working")
        print(f"  - Total clients: {data['total']}")
    
    def test_entity_types(self):
        """Test entity types endpoint"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/entities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "entities" in data, "Missing entities array"
        
        entity_values = [e["value"] for e in data["entities"]]
        expected_entities = ["personal", "joint", "company", "trust", "smsf"]
        for entity in expected_entities:
            assert entity in entity_values, f"Missing entity type: {entity}"
        
        print(f"PASS: Entity types endpoint working")
        print(f"  - Entities: {entity_values}")
    
    def test_asset_types(self):
        """Test asset types endpoint"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/asset-types")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "asset_types" in data, "Missing asset_types array"
        
        asset_values = [a["value"] for a in data["asset_types"]]
        expected_assets = ["cash", "shares_au", "property", "super_accum"]
        for asset in expected_assets:
            assert asset in asset_values, f"Missing asset type: {asset}"
        
        print(f"PASS: Asset types endpoint working")
        print(f"  - Asset types count: {len(asset_values)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
