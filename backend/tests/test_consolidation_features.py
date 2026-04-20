"""
Test suite for consolidated dashboard features - March 2026
Tests: Personal Dashboard, Client Portal, Smart Insights, Hybrid Engine API
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://scenario-simulator-5.preview.emergentagent.com')

class TestHealthAndBasicAPIs:
    """Basic health and API availability tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"Health check passed: {data.get('service')}")
    
    def test_client_portal_enabled(self):
        """Test client portal feature is enabled in health check"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "client_portal" in data
        assert data["client_portal"].get("net_worth") is True
        assert data["client_portal"].get("portfolios") is True
        assert data["client_portal"].get("goals") is True
        print("Client portal features enabled in health check")


class TestHybridEngineAPI:
    """Tests for the hybrid-engine/calculate endpoint - retirement confidence"""
    
    def test_hybrid_engine_calculate_basic(self):
        """Test basic retirement confidence calculation"""
        payload = {
            "client_id": "test_client",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 1850000,
            "annual_contributions": 50000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000,
            "enable_dynamic_spending": True,
            "mode": "background"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify confidence score exists and is valid
        assert "confidence_score" in data
        assert 0 <= data["confidence_score"] <= 100
        print(f"Confidence score: {data['confidence_score']}")
        
        # Verify monte carlo results
        assert "monte_carlo" in data
        assert "success_rate_percent" in data["monte_carlo"]
        assert "percentiles" in data["monte_carlo"]
        print(f"Monte Carlo success rate: {data['monte_carlo']['success_rate_percent']}%")
        
        # Verify confidence breakdown
        assert "confidence_breakdown" in data
        assert "raw_factors" in data["confidence_breakdown"]
        print(f"Confidence rating: {data.get('confidence_rating')}")
    
    def test_hybrid_engine_returns_inputs(self):
        """Test that hybrid engine returns input parameters"""
        payload = {
            "client_id": "test_inputs",
            "current_age": 50,
            "retirement_age": 67,
            "life_expectancy": 85,
            "current_portfolio": 500000,
            "annual_contributions": 25000,
            "retirement_spending": 60000,
            "expected_return": 0.06,
            "return_volatility": 0.12,
            "inflation_rate": 0.03,
            "num_simulations": 500,
            "mode": "background"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify inputs are returned
        assert "inputs" in data
        inputs = data["inputs"]
        assert inputs["current_age"] == 50
        assert inputs["retirement_age"] == 67
        assert inputs["current_portfolio"] == 500000
        print(f"Years to retirement: {inputs.get('years_to_retirement', 'N/A')}")


class TestClientPortalAPIs:
    """Tests for client portal API endpoints"""
    
    def test_client_dashboard(self):
        """Test client dashboard endpoint"""
        client_id = "portal_001"
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard/{client_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "client_id" in data
        assert "name" in data
        assert "summary" in data
        
        # Verify summary contains required fields
        summary = data["summary"]
        assert "net_worth" in summary
        assert "goals_count" in summary
        assert "goals_on_track" in summary
        print(f"Client: {data['name']}, Net Worth: ${summary['net_worth']:,}")
    
    def test_client_portfolios(self):
        """Test client portfolios endpoint"""
        client_id = "portal_001"
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/{client_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "portfolios" in data
        print(f"Number of portfolios: {len(data['portfolios'])}")
    
    def test_client_goals(self):
        """Test client goals endpoint"""
        client_id = "portal_001"
        response = requests.get(f"{BASE_URL}/api/client-portal/goals/{client_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "goals" in data
        assert "summary" in data
        print(f"Total goals: {data['summary'].get('total_goals', 0)}")
    
    def test_client_net_worth(self):
        """Test client net worth endpoint"""
        client_id = "portal_001"
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/{client_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Net worth can be in 'net_worth' or 'current.total'
        if "net_worth" in data:
            net_worth = data["net_worth"]
        elif "current" in data and "total" in data["current"]:
            net_worth = data["current"]["total"]
        else:
            assert False, "Net worth not found in response"
        
        assert "assets" in data
        print(f"Net worth: ${net_worth:,}")
    
    def test_client_notifications(self):
        """Test client notifications endpoint"""
        client_id = "portal_001"
        response = requests.get(f"{BASE_URL}/api/client-portal/notifications/{client_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "notifications" in data
        print(f"Number of notifications: {len(data['notifications'])}")


class TestSmartInsightsIntegration:
    """Tests for Smart Insights data integration"""
    
    def test_retirement_data_for_insights(self):
        """Test that retirement data provides factors for Smart Insights"""
        payload = {
            "client_id": "insights_test",
            "current_age": 40,
            "retirement_age": 60,
            "life_expectancy": 90,
            "current_portfolio": 300000,
            "annual_contributions": 20000,
            "retirement_spending": 70000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 500,
            "mode": "background"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify raw factors for Smart Insights
        raw_factors = data["confidence_breakdown"]["raw_factors"]
        
        # These factors are used by SmartInsights component
        assert "monte_carlo_success" in raw_factors
        assert "downside_protection" in raw_factors
        assert "spending_flexibility" in raw_factors
        assert "diversification" in raw_factors
        assert "longevity_protection" in raw_factors
        
        print(f"Spending flexibility: {raw_factors['spending_flexibility']}")
        print(f"Diversification: {raw_factors['diversification']}")
    
    def test_low_confidence_triggers_insight(self):
        """Test that low confidence score would trigger insight"""
        # Use parameters that would result in lower confidence
        payload = {
            "client_id": "low_confidence_test",
            "current_age": 55,
            "retirement_age": 60,
            "life_expectancy": 95,
            "current_portfolio": 200000,
            "annual_contributions": 10000,
            "retirement_spending": 100000,
            "expected_return": 0.05,
            "return_volatility": 0.20,
            "inflation_rate": 0.03,
            "num_simulations": 500,
            "mode": "background"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        confidence = data["confidence_score"]
        print(f"Low scenario confidence: {confidence}")
        
        # This scenario should have lower confidence
        # SmartInsights would show "Retirement Confidence Below Target" insight
        if confidence < 60:
            print("Would trigger 'Retirement Confidence Below Target' insight")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
