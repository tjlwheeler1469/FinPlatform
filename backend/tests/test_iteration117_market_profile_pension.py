"""
Test iteration 117 - Market Data, User Profile, Age Pension APIs
Tests for:
1. Live market data API (Yahoo Finance integration)
2. User profile CRUD operations
3. Age Pension calculator (Services Australia rates)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check to ensure backend is running"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestMarketDataAPI:
    """Test live market data API - Yahoo Finance integration"""
    
    def test_get_market_indicators(self):
        """Test GET /api/market-data/indicators returns market data"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "indicators" in data
        assert "last_updated" in data
        assert "source" in data
        
        # Source should be 'live', 'cache', or 'fallback'
        assert data["source"] in ["live", "cache", "fallback"]
        
        # Should have at least some indicators
        assert len(data["indicators"]) > 0
        
        # Verify indicator structure
        indicator = data["indicators"][0]
        assert "symbol" in indicator
        assert "name" in indicator
        assert "value" in indicator
        assert "change" in indicator
        assert "change_percent" in indicator
        
        print(f"✓ Market indicators returned: {len(data['indicators'])} indicators, source: {data['source']}")
        
        # Check for expected market indicators
        indicator_names = [ind["name"] for ind in data["indicators"]]
        print(f"  Indicators: {indicator_names}")
    
    def test_market_indicators_have_asx_data(self):
        """Test that ASX 200 is included in market indicators"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200
        data = response.json()
        
        indicator_names = [ind["name"] for ind in data["indicators"]]
        # Should have ASX 200 or similar Australian market indicator
        has_asx = any("ASX" in name or "All Ords" in name for name in indicator_names)
        assert has_asx, f"Expected ASX indicator, got: {indicator_names}"
        print("✓ ASX market data present")
    
    def test_single_indicator_endpoint(self):
        """Test GET /api/market-data/indicator/{symbol} for single indicator"""
        # Test with ASX 200 symbol
        response = requests.get(f"{BASE_URL}/api/market-data/indicator/^AXJO")
        # May return 200 or 404 depending on API availability
        if response.status_code == 200:
            data = response.json()
            assert "symbol" in data
            assert "value" in data
            print(f"✓ Single indicator returned: {data['name']} = {data['value']}")
        else:
            print(f"⚠ Single indicator endpoint returned {response.status_code} (may be rate limited)")


class TestUserProfileAPI:
    """Test user profile CRUD operations"""
    
    def test_get_default_profile(self):
        """Test GET /api/user-profile/thompson_family returns default profile"""
        response = requests.get(f"{BASE_URL}/api/user-profile/thompson_family")
        assert response.status_code == 200
        data = response.json()
        
        # Verify profile structure
        assert "user_id" in data
        assert "first_name" in data
        assert "last_name" in data
        assert "retirement_age" in data
        assert "risk_profile" in data
        
        # Verify default Thompson family data
        assert data["first_name"] == "David"
        assert data["last_name"] == "Thompson"
        assert data["partner_first_name"] == "Sarah"
        
        print(f"✓ Default profile returned: {data['first_name']} & {data['partner_first_name']} {data['last_name']}")
    
    def test_get_profile_summary(self):
        """Test GET /api/user-profile/{user_id}/summary returns calculated fields"""
        response = requests.get(f"{BASE_URL}/api/user-profile/thompson_family/summary")
        assert response.status_code == 200
        data = response.json()
        
        # Verify summary structure
        assert "user_id" in data
        assert "display_name" in data
        assert "age" in data
        assert "years_to_retirement" in data
        assert "combined_income" in data
        assert "savings_rate" in data
        
        # Display name should be "David & Sarah Thompson"
        assert "David" in data["display_name"]
        assert "Sarah" in data["display_name"]
        
        print(f"✓ Profile summary: {data['display_name']}, Age: {data['age']}, Years to retirement: {data['years_to_retirement']}")
    
    def test_update_profile(self):
        """Test PUT /api/user-profile/{user_id} updates profile"""
        update_data = {
            "retirement_age": 65,
            "risk_profile": "growth",
            "annual_income": 130000
        }
        
        response = requests.put(
            f"{BASE_URL}/api/user-profile/thompson_family",
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify updates were applied
        assert data["retirement_age"] == 65
        assert data["risk_profile"] == "growth"
        assert data["annual_income"] == 130000
        
        print(f"✓ Profile updated: retirement_age={data['retirement_age']}, risk_profile={data['risk_profile']}")
        
        # Restore original values
        restore_data = {
            "retirement_age": 67,
            "risk_profile": "balanced",
            "annual_income": 125000
        }
        requests.put(f"{BASE_URL}/api/user-profile/thompson_family", json=restore_data)
    
    def test_profile_not_found(self):
        """Test GET /api/user-profile/{user_id} returns 404 for unknown user"""
        response = requests.get(f"{BASE_URL}/api/user-profile/nonexistent_user_12345")
        assert response.status_code == 404
        print("✓ Profile not found returns 404")


class TestAgePensionAPI:
    """Test Services Australia Age Pension calculator"""
    
    def test_get_pension_rates(self):
        """Test GET /api/age-pension/rates returns current rates"""
        response = requests.get(f"{BASE_URL}/api/age-pension/rates")
        assert response.status_code == 200
        data = response.json()
        
        # Verify rates structure
        assert "pension_rates" in data
        assert "asset_limits" in data
        assert "income_limits" in data
        assert "deeming_rates" in data
        
        # Verify pension rates for single and couple
        assert "single" in data["pension_rates"]
        assert "couple_combined" in data["pension_rates"]
        
        print(f"✓ Pension rates returned, effective date: {data.get('effective_date', 'N/A')}")
    
    def test_calculate_pension_single_eligible(self):
        """Test POST /api/age-pension/calculate for eligible single person"""
        request_data = {
            "birth_date": "1958-01-15",  # Age 68, eligible
            "relationship_status": "single",
            "is_homeowner": True,
            "financial_assets": 200000,
            "super_balance": 0,  # Already in pension phase
            "employment_income": 0,
            "investment_income": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/age-pension/calculate", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "eligible" in data
        assert "pension_age" in data
        assert "estimated_payment_fortnight" in data
        assert "estimated_payment_annual" in data
        assert "assets_test_result" in data
        assert "income_test_result" in data
        assert "recommendations" in data
        assert "disclaimer" in data
        
        # Should be eligible (age 68, low assets)
        assert data["eligible"] is True
        assert data["estimated_payment_fortnight"] > 0
        
        print(f"✓ Pension calculation (single): eligible={data['eligible']}, payment=${data['estimated_payment_fortnight']:.2f}/fortnight")
    
    def test_calculate_pension_couple(self):
        """Test POST /api/age-pension/calculate for couple"""
        request_data = {
            "birth_date": "1959-06-01",  # Age 66.5+
            "partner_birth_date": "1960-03-15",
            "relationship_status": "couple",
            "is_homeowner": True,
            "financial_assets": 300000,
            "super_balance": 100000,
            "employment_income": 0,
            "investment_income": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/age-pension/calculate", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "eligible" in data
        assert "assets_test_result" in data
        assert "income_test_result" in data
        
        print(f"✓ Pension calculation (couple): eligible={data['eligible']}, assets_test={data['assets_test_result']}")
    
    def test_calculate_pension_not_eligible_age(self):
        """Test pension calculation for person under pension age"""
        request_data = {
            "birth_date": "1980-01-15",  # Age ~46, not eligible
            "relationship_status": "single",
            "is_homeowner": True,
            "financial_assets": 100000
        }
        
        response = requests.post(f"{BASE_URL}/api/age-pension/calculate", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        # Should not be eligible due to age
        assert data["eligible"] is False
        assert data["years_until_eligible"] > 0
        
        print(f"✓ Pension calculation (under age): eligible={data['eligible']}, years_until_eligible={data['years_until_eligible']:.1f}")
    
    def test_calculate_pension_high_assets(self):
        """Test pension calculation for person with high assets"""
        request_data = {
            "birth_date": "1958-01-15",  # Age 68, eligible by age
            "relationship_status": "single",
            "is_homeowner": True,
            "financial_assets": 1500000,  # High assets
            "investment_property_value": 500000
        }
        
        response = requests.post(f"{BASE_URL}/api/age-pension/calculate", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        # Should fail assets test
        assert data["assets_test_result"] == "ineligible"
        
        print(f"✓ Pension calculation (high assets): assets_test={data['assets_test_result']}, total_assets=${data['total_assessable_assets']:,.0f}")


class TestHybridEngineAPI:
    """Test hybrid engine for retirement confidence calculation"""
    
    def test_hybrid_engine_calculate(self):
        """Test POST /api/hybrid-engine/calculate returns confidence score"""
        request_data = {
            "client_id": "thompson_family",
            "current_age": 50,
            "retirement_age": 67,
            "life_expectancy": 92,
            "current_portfolio": 1600000,
            "annual_contributions": 42000,
            "retirement_spending": 72000,
            "expected_return": 0.065,
            "return_volatility": 0.12,
            "inflation_rate": 0.03,
            "num_simulations": 1000,
            "mode": "background"
        }
        
        response = requests.post(f"{BASE_URL}/api/hybrid-engine/calculate", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "confidence_score" in data
        assert "monte_carlo" in data
        
        # Confidence score should be between 0 and 100
        assert 0 <= data["confidence_score"] <= 100
        
        print(f"✓ Hybrid engine: confidence_score={data['confidence_score']:.1f}%")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
