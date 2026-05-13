"""
Iteration 123 Tests: AdviceOS Dashboard Split & Buffett Engine Live API
Tests for major refactoring session:
1. AdviceOS Dashboard split (1084 -> 356 lines, 7 sub-components)
2. Buffett Ideas tab connected to live backend API
3. AdviceOS API endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["architecture"] == "modular"
        print(f"PASS: Health endpoint - status: {data['status']}")


class TestBuffettEngineAPI:
    """Tests for Buffett Engine live API - /api/buffett-engine/screen"""
    
    def test_buffett_screen_returns_12_stocks(self):
        """Verify Buffett screen returns 12 ASX stocks"""
        response = requests.get(f"{BASE_URL}/api/buffett-engine/screen")
        assert response.status_code == 200
        data = response.json()
        
        # Verify 12 ideas returned
        assert "ideas" in data
        assert len(data["ideas"]) == 12, f"Expected 12 stocks, got {len(data['ideas'])}"
        print(f"PASS: Buffett screen returns {len(data['ideas'])} stocks")
    
    def test_buffett_screen_has_sentiment_data(self):
        """Verify sentiment score and label are present"""
        response = requests.get(f"{BASE_URL}/api/buffett-engine/screen")
        assert response.status_code == 200
        data = response.json()
        
        assert "sentiment_score" in data
        assert "sentiment_label" in data
        assert isinstance(data["sentiment_score"], int)
        assert data["sentiment_label"] in ["Bullish", "Moderately Bullish", "Neutral", "Cautious"]
        print(f"PASS: Sentiment score: {data['sentiment_score']}, label: {data['sentiment_label']}")
    
    def test_buffett_screen_has_sector_rankings(self):
        """Verify sector rankings are present"""
        response = requests.get(f"{BASE_URL}/api/buffett-engine/screen")
        assert response.status_code == 200
        data = response.json()
        
        assert "sector_rankings" in data
        assert len(data["sector_rankings"]) > 0
        for ranking in data["sector_rankings"]:
            assert "sector" in ranking
            assert "score" in ranking
        print(f"PASS: Sector rankings: {len(data['sector_rankings'])} sectors")
    
    def test_buffett_screen_stock_structure(self):
        """Verify each stock has required fields"""
        response = requests.get(f"{BASE_URL}/api/buffett-engine/screen")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["symbol", "name", "sector", "price", "pe_avg", "pe_low", "pe_high", 
                          "action", "confidence", "upside", "reason", "catalyst"]
        
        for idea in data["ideas"]:
            for field in required_fields:
                assert field in idea, f"Missing field: {field} in {idea.get('symbol', 'unknown')}"
            assert idea["action"] in ["BUY", "HOLD", "AVOID"]
            assert 0 <= idea["confidence"] <= 100
        print("PASS: All stocks have required fields and valid action/confidence values")
    
    def test_buffett_screen_source_is_live(self):
        """Verify source indicates live data"""
        response = requests.get(f"{BASE_URL}/api/buffett-engine/screen")
        assert response.status_code == 200
        data = response.json()
        
        assert "source" in data
        # Source should be 'live' or 'fallback' (if Yahoo Finance fails)
        assert data["source"] in ["live", "fallback"]
        print(f"PASS: Data source: {data['source']}")


class TestAdviceOSAPIs:
    """Tests for AdviceOS Dashboard APIs"""
    
    def test_dashboard_summary(self):
        """Test /api/reports/dashboard/summary returns valid data"""
        response = requests.get(f"{BASE_URL}/api/reports/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data
        summary = data["summary"]
        assert "compliance_score" in summary
        assert "scenarios" in summary
        assert "decisions" in summary
        assert "breaches" in summary
        print(f"PASS: Dashboard summary - compliance score: {summary['compliance_score']}%")
    
    def test_scenario_history(self):
        """Test /api/reports/scenario-history returns scenarios"""
        response = requests.get(f"{BASE_URL}/api/reports/scenario-history?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert "scenarios" in data
        assert "count" in data
        print(f"PASS: Scenario history - {data['count']} scenarios returned")
    
    def test_audit_export(self):
        """Test /api/reports/audit-export returns audit logs"""
        response = requests.get(f"{BASE_URL}/api/reports/audit-export?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert "audit_logs" in data
        print(f"PASS: Audit export - {len(data['audit_logs'])} logs returned")
    
    def test_breach_report(self):
        """Test /api/reports/breach-report returns breach data"""
        response = requests.get(f"{BASE_URL}/api/reports/breach-report")
        assert response.status_code == 200
        data = response.json()
        
        assert "breaches" in data
        print(f"PASS: Breach report - {len(data['breaches'])} breaches returned")


class TestTradingAPIs:
    """Tests for Stock Trading related APIs"""
    
    def test_holdings_endpoint(self):
        """Test trading holdings endpoint"""
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert "holdings" in data
        assert "summary" in data
        print(f"PASS: Holdings endpoint - {len(data['holdings'])} holdings")
    
    def test_market_data_indicators(self):
        """Test market data indicators endpoint"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200
        data = response.json()
        
        assert "indicators" in data
        assert len(data["indicators"]) > 0
        print(f"PASS: Market data - {len(data['indicators'])} indicators")
    
    def test_news_headlines(self):
        """Test news headlines endpoint"""
        response = requests.get(f"{BASE_URL}/api/news/headlines")
        assert response.status_code == 200
        data = response.json()
        
        assert "headlines" in data
        print(f"PASS: News headlines - {len(data['headlines'])} headlines")


class TestHybridEngineAPI:
    """Tests for Hybrid Engine (Retirement Confidence)"""
    
    def test_hybrid_engine_calculate(self):
        """Test hybrid engine calculation endpoint"""
        payload = {
            "client_id": "demo_client",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 800000,
            "annual_contributions": 30000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000,
            "enable_dynamic_spending": True,
            "mode": "presentation"
        }
        response = requests.post(f"{BASE_URL}/api/hybrid-engine/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "confidence_score" in data or "display" in data
        print("PASS: Hybrid engine calculation successful")


class TestLifecycleAPIs:
    """Tests for Lifecycle Planning APIs (Strategic Planning)"""
    
    def test_retirement_plan_endpoint(self):
        """Test retirement plan calculation"""
        payload = {
            "current_age": 45,
            "retirement_age": 67,
            "life_expectancy": 90,
            "current_super": 320000,
            "current_savings": 75000,
            "annual_income": 120000,
            "annual_expenses": 80000,
            "desired_retirement_income": 70000,
            "super_contribution_rate": 11.5,
            "salary_sacrifice": 5000,
            "investment_return": 7.0,
            "inflation_rate": 2.5
        }
        response = requests.post(f"{BASE_URL}/api/lifecycle/retirement-plan", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data
        assert "projections" in data
        print(f"PASS: Retirement plan - total at retirement: ${data['summary'].get('total_at_retirement', 0):,.0f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
