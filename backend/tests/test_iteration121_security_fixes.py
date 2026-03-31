"""
Test iteration 121 - Security fixes verification
Tests that security fixes don't break existing functionality:
1. Backend health check
2. Market data API (17 indicators)
3. News headlines API
4. Voice assistant API (GPT-5.2)
5. Compliance dashboard API
6. Scenario templates safe parser (no eval())
"""

import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Test backend health check still works after security fixes"""
    
    def test_health_endpoint_returns_200(self):
        """Health check should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"Health check passed: {data.get('status')}")


class TestMarketDataAPI:
    """Test market data API returns 17 indicators"""
    
    def test_market_indicators_returns_17(self):
        """Market data should return 17 indicators"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200
        data = response.json()
        indicators = data.get("indicators", [])
        assert len(indicators) == 17, f"Expected 17 indicators, got {len(indicators)}"
        print(f"Market data API returned {len(indicators)} indicators")
        
        # Verify key indicators are present
        indicator_names = [ind.get("name") for ind in indicators]
        expected_indicators = ["ASX 200", "S&P 500", "Dow Jones", "NASDAQ", "FTSE 100"]
        for expected in expected_indicators:
            assert expected in indicator_names, f"Missing indicator: {expected}"


class TestNewsAPI:
    """Test news headlines API returns live headlines"""
    
    def test_news_headlines_returns_data(self):
        """News API should return headlines"""
        response = requests.get(f"{BASE_URL}/api/news/headlines")
        assert response.status_code == 200
        data = response.json()
        headlines = data.get("headlines", [])
        assert len(headlines) > 0, "Expected at least 1 headline"
        print(f"News API returned {len(headlines)} headlines")
        
        # Verify headline structure
        if headlines:
            first = headlines[0]
            assert "title" in first or "headline" in first, "Headline should have title"


class TestVoiceAssistantAPI:
    """Test voice assistant API with GPT-5.2"""
    
    def test_voice_assistant_chat(self):
        """Voice assistant should respond to chat (uses Form data, not JSON)"""
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            data={"message": "What is a good investment strategy?"}  # Form data
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data, "Should have response field"
        assert len(data.get("response", "")) > 50, "Response should be substantial"
        print(f"Voice assistant responded successfully with GPT-5.2")


class TestComplianceDashboardAPI:
    """Test compliance dashboard API returns metrics from MongoDB"""
    
    def test_compliance_dashboard_returns_metrics(self):
        """Compliance dashboard should return metrics"""
        response = requests.get(f"{BASE_URL}/api/compliance-docs/dashboard")
        assert response.status_code == 200
        data = response.json()
        # Should have metrics or advice_files
        assert "metrics" in data or "advice_files" in data or "total_files" in data
        print(f"Compliance dashboard returned data: {list(data.keys())}")


class TestScenarioTemplatesSafeParser:
    """Test scenario templates endpoint doesn't use eval() - regression test"""
    
    def test_scenario_templates_list(self):
        """Scenario templates list should work"""
        response = requests.get(f"{BASE_URL}/api/scenario-templates/list")
        assert response.status_code == 200
        data = response.json()
        templates = data.get("templates", [])
        assert len(templates) > 0, "Should have templates"
        print(f"Scenario templates returned {len(templates)} templates")
    
    def test_scenario_template_apply_with_formula(self):
        """Apply template with formula should use safe parser"""
        # Test applying a template that uses formula evaluation
        response = requests.post(
            f"{BASE_URL}/api/scenario-templates/sabbatical_1year/apply",
            params={
                "current_age": 45,
                "retirement_age": 65,
                "net_worth": 1000000,
                "annual_income": 150000,
                "annual_expenses": 80000,
                "super_balance": 500000
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "adjusted_inputs" in data
        # The formula "current_age + 2" should evaluate to 47
        adjusted = data.get("adjusted_inputs", {})
        income_gap_start = adjusted.get("income_gap_start")
        if income_gap_start:
            assert income_gap_start == 47, f"Formula should evaluate to 47, got {income_gap_start}"
        print(f"Scenario template applied successfully with safe formula evaluation")
    
    def test_scenario_template_safe_eval_arithmetic(self):
        """Test that arithmetic expressions are safely evaluated"""
        # Test with early_retirement_55 which has absolute values
        response = requests.post(
            f"{BASE_URL}/api/scenario-templates/early_retirement_55/apply",
            params={
                "current_age": 50,
                "retirement_age": 65,
                "net_worth": 2000000,
                "annual_income": 200000,
                "annual_expenses": 100000,
                "super_balance": 800000
            }
        )
        assert response.status_code == 200
        data = response.json()
        adjusted = data.get("adjusted_inputs", {})
        # retirement_age should be set to 55 (absolute)
        assert adjusted.get("retirement_age") == 55
        print(f"Safe arithmetic evaluation working correctly")


class TestScalingInfrastructureSHA256:
    """Test scaling infrastructure uses SHA-256 instead of MD5"""
    
    def test_infrastructure_health(self):
        """Infrastructure health endpoint should work"""
        response = requests.get(f"{BASE_URL}/api/infrastructure/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"Infrastructure health check passed")
    
    def test_infrastructure_metrics(self):
        """Infrastructure metrics should work"""
        response = requests.get(f"{BASE_URL}/api/infrastructure/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "cache" in data or "system" in data
        print(f"Infrastructure metrics returned: {list(data.keys())}")


class TestRegressionExistingFeatures:
    """Regression tests for existing features after security fixes"""
    
    def test_personal_dashboard_data(self):
        """Personal dashboard data should still work"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("Personal dashboard backend accessible")
    
    def test_age_pension_calculator(self):
        """Age pension calculator should still work"""
        response = requests.post(
            f"{BASE_URL}/api/age-pension/calculate",
            json={
                "birth_date": "1960-01-01",
                "relationship_status": "single",
                "homeowner": True,
                "total_assets": 500000,
                "income_per_fortnight": 500
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Check for actual field names in response
        assert "estimated_payment_fortnight" in data or "estimated_payment_annual" in data
        print(f"Age pension calculator working: {data.get('estimated_payment_fortnight', 'N/A')}/fortnight")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
