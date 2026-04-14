"""
Test Client Portal Redesign APIs
Tests for the redesigned client portal with 6 phases:
1. Hero section with confidence score
2. Plain English summary
3. Improvement actions
4. Timeline visual
5. Advisor guidance
6. No complexity (simplified data)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestClientPortalDashboard:
    """Test /api/client-portal/dashboard/{client_id} endpoint"""
    
    def test_dashboard_returns_200(self):
        """Test dashboard endpoint returns 200 for portal_001"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard/portal_001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("TEST PASS: Dashboard returns 200")
    
    def test_dashboard_contains_client_name(self):
        """Test dashboard returns client name 'David Thompson'"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard/portal_001")
        data = response.json()
        assert "name" in data, "Response missing 'name' field"
        assert data["name"] == "David Thompson", f"Expected 'David Thompson', got '{data['name']}'"
        print(f"TEST PASS: Client name is '{data['name']}'")
    
    def test_dashboard_contains_advisor_info(self):
        """Test dashboard returns advisor info for Phase 5"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard/portal_001")
        data = response.json()
        assert "advisor" in data, "Response missing 'advisor' field"
        assert "name" in data["advisor"], "Advisor missing 'name' field"
        assert data["advisor"]["name"] == "Sarah Chen", f"Expected 'Sarah Chen', got '{data['advisor']['name']}'"
        print(f"TEST PASS: Advisor name is '{data['advisor']['name']}'")
    
    def test_dashboard_contains_summary(self):
        """Test dashboard returns summary with goals_on_track for Phase 2"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard/portal_001")
        data = response.json()
        assert "summary" in data, "Response missing 'summary' field"
        assert "goals_on_track" in data["summary"], "Summary missing 'goals_on_track'"
        assert data["summary"]["goals_on_track"] >= 0, "goals_on_track should be >= 0"
        print(f"TEST PASS: Goals on track = {data['summary']['goals_on_track']}")


class TestHybridEngineCalculate:
    """Test /api/hybrid-engine/calculate endpoint for confidence score"""
    
    def test_calculate_returns_200(self):
        """Test hybrid engine calculate returns 200"""
        payload = {
            "client_id": "portal_001",
            "current_age": 50,
            "retirement_age": 67,
            "life_expectancy": 92,
            "current_portfolio": 1609800,
            "annual_contributions": 42000,
            "retirement_spending": 72000,
            "expected_return": 0.065,
            "return_volatility": 0.12,
            "inflation_rate": 0.03,
            "num_simulations": 3000,
            "enable_dynamic_spending": True,
            "mode": "background"
        }
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("TEST PASS: Hybrid engine calculate returns 200")
    
    def test_calculate_returns_confidence_score(self):
        """Test hybrid engine returns confidence_score ~83.5 (rounds to 84%)"""
        payload = {
            "client_id": "portal_001",
            "current_age": 50,
            "retirement_age": 67,
            "life_expectancy": 92,
            "current_portfolio": 1609800,
            "annual_contributions": 42000,
            "retirement_spending": 72000,
            "expected_return": 0.065,
            "return_volatility": 0.12,
            "inflation_rate": 0.03,
            "num_simulations": 3000,
            "enable_dynamic_spending": True,
            "mode": "background"
        }
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        assert "confidence_score" in data, "Response missing 'confidence_score'"
        score = data["confidence_score"]
        assert 80 <= score <= 90, f"Expected confidence_score between 80-90, got {score}"
        print(f"TEST PASS: Confidence score = {score} (rounds to {round(score)}%)")
    
    def test_calculate_returns_inputs_for_timeline(self):
        """Test hybrid engine returns inputs with years_to_retirement for Phase 4"""
        payload = {
            "client_id": "portal_001",
            "current_age": 50,
            "retirement_age": 67,
            "life_expectancy": 92,
            "current_portfolio": 1609800,
            "annual_contributions": 42000,
            "retirement_spending": 72000,
            "expected_return": 0.065,
            "return_volatility": 0.12,
            "inflation_rate": 0.03,
            "num_simulations": 3000,
            "enable_dynamic_spending": True,
            "mode": "background"
        }
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        assert "inputs" in data, "Response missing 'inputs'"
        inputs = data["inputs"]
        assert "current_age" in inputs, "Inputs missing 'current_age'"
        assert "retirement_age" in inputs, "Inputs missing 'retirement_age'"
        years_to_retirement = inputs["retirement_age"] - inputs["current_age"]
        assert years_to_retirement == 17, f"Expected 17 years to retirement, got {years_to_retirement}"
        print(f"TEST PASS: Years to retirement = {years_to_retirement}")
    
    def test_calculate_returns_confidence_rating(self):
        """Test hybrid engine returns confidence_rating for badge display"""
        payload = {
            "client_id": "portal_001",
            "current_age": 50,
            "retirement_age": 67,
            "life_expectancy": 92,
            "current_portfolio": 1609800,
            "annual_contributions": 42000,
            "retirement_spending": 72000,
            "expected_return": 0.065,
            "return_volatility": 0.12,
            "inflation_rate": 0.03,
            "num_simulations": 3000,
            "enable_dynamic_spending": True,
            "mode": "background"
        }
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        assert "confidence_rating" in data, "Response missing 'confidence_rating'"
        rating = data["confidence_rating"]
        assert rating in ["Very Good", "Good", "Fair", "Poor"], f"Unexpected rating: {rating}"
        print(f"TEST PASS: Confidence rating = '{rating}'")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
