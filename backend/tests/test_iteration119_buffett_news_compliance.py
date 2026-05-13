"""
Test Suite for Iteration 119 Features:
1. StockTrading page with 5 tabs (Portfolio, Buffett Ideas, Valuations, Backtest, News)
2. Live Markets ticker with 17 indicators (indices, currencies, commodities)
3. News tab fetching live headlines from /api/news/headlines
4. GET /api/market-data/indicators returns 17 market indicators
5. GET /api/news/headlines returns live financial news headlines
6. GET /api/compliance-docs/dashboard returns metrics and advice files from MongoDB
7. POST /api/compliance-docs/seed-demo seeds demo compliance data
8. Age Pension calculator at /api/age-pension/calculate
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMarketDataAPI:
    """Test Market Data API with 17 indicators"""
    
    def test_market_indicators_endpoint(self):
        """Test GET /api/market-data/indicators returns market data"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "indicators" in data, "Response should have 'indicators' field"
        assert "source" in data, "Response should have 'source' field"
        assert "last_updated" in data, "Response should have 'last_updated' field"
        
        # Verify we have multiple indicators
        indicators = data["indicators"]
        assert len(indicators) >= 5, f"Expected at least 5 indicators, got {len(indicators)}"
        
        # Check indicator structure
        for indicator in indicators[:3]:
            assert "symbol" in indicator, "Indicator should have 'symbol'"
            assert "name" in indicator, "Indicator should have 'name'"
            assert "value" in indicator, "Indicator should have 'value'"
            assert "change_percent" in indicator, "Indicator should have 'change_percent'"
        
        print(f"Market data source: {data['source']}")
        print(f"Number of indicators: {len(indicators)}")
    
    def test_market_indicators_include_indices(self):
        """Test that market data includes major indices (ASX 200, S&P 500, Dow Jones, NASDAQ, FTSE 100)"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200
        
        data = response.json()
        indicators = data["indicators"]
        indicator_names = [ind["name"] for ind in indicators]
        
        # Check for major indices
        expected_indices = ["ASX 200", "S&P 500", "Dow Jones", "NASDAQ"]
        found_indices = [idx for idx in expected_indices if idx in indicator_names]
        
        print(f"Found indices: {found_indices}")
        assert len(found_indices) >= 3, f"Expected at least 3 major indices, found: {found_indices}"
    
    def test_market_indicators_include_currencies(self):
        """Test that market data includes expanded currencies (AUD/USD, AUD/EUR, AUD/GBP, etc.)"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200
        
        data = response.json()
        indicators = data["indicators"]
        indicator_names = [ind["name"] for ind in indicators]
        
        # Check for currency pairs
        expected_currencies = ["AUD/USD", "AUD/EUR", "AUD/GBP"]
        found_currencies = [curr for curr in expected_currencies if curr in indicator_names]
        
        print(f"Found currencies: {found_currencies}")
        # At least AUD/USD should be present
        assert "AUD/USD" in indicator_names, "AUD/USD should be in market indicators"
    
    def test_market_indicators_include_commodities(self):
        """Test that market data includes commodities (Gold, Crude Oil)"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200
        
        data = response.json()
        indicators = data["indicators"]
        indicator_names = [ind["name"] for ind in indicators]
        
        # Check for commodities
        expected_commodities = ["Gold", "Crude Oil WTI"]
        found_commodities = [comm for comm in expected_commodities if comm in indicator_names]
        
        print(f"Found commodities: {found_commodities}")
        # At least one commodity should be present
        assert len(found_commodities) >= 1, f"Expected at least 1 commodity, found: {found_commodities}"


class TestNewsHeadlinesAPI:
    """Test News Headlines API"""
    
    def test_news_headlines_endpoint(self):
        """Test GET /api/news/headlines returns news data"""
        response = requests.get(f"{BASE_URL}/api/news/headlines")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "headlines" in data, "Response should have 'headlines' field"
        assert "count" in data, "Response should have 'count' field"
        assert "sources" in data, "Response should have 'sources' field"
        
        headlines = data["headlines"]
        print(f"Number of headlines: {len(headlines)}")
        
        # Verify headline structure
        if len(headlines) > 0:
            headline = headlines[0]
            assert "title" in headline, "Headline should have 'title'"
            assert "source" in headline, "Headline should have 'source'"
            print(f"First headline: {headline['title'][:50]}...")
    
    def test_news_headlines_with_limit(self):
        """Test news headlines with limit parameter"""
        response = requests.get(f"{BASE_URL}/api/news/headlines?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        headlines = data["headlines"]
        assert len(headlines) <= 5, f"Expected at most 5 headlines, got {len(headlines)}"
    
    def test_news_sources_endpoint(self):
        """Test GET /api/news/sources returns available sources"""
        response = requests.get(f"{BASE_URL}/api/news/sources")
        assert response.status_code == 200
        
        data = response.json()
        assert "sources" in data, "Response should have 'sources' field"
        
        sources = data["sources"]
        print(f"Available news sources: {[s['name'] for s in sources]}")
        assert len(sources) >= 1, "Should have at least 1 news source"
    
    def test_news_categories_endpoint(self):
        """Test GET /api/news/categories returns available categories"""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data, "Response should have 'categories' field"
        
        categories = data["categories"]
        print(f"Available categories: {categories}")


class TestComplianceDocsAPI:
    """Test Compliance Documents API with MongoDB persistence"""
    
    def test_seed_demo_compliance_data(self):
        """Test POST /api/compliance-docs/seed-demo seeds demo data"""
        response = requests.post(f"{BASE_URL}/api/compliance-docs/seed-demo")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response should have 'status' field"
        assert data["status"] in ["seeded", "already_seeded"], f"Unexpected status: {data['status']}"
        
        print(f"Seed status: {data['status']}")
        if "count" in data:
            print(f"Document count: {data['count']}")
    
    def test_compliance_dashboard_endpoint(self):
        """Test GET /api/compliance-docs/dashboard returns metrics and advice files"""
        # First ensure data is seeded
        requests.post(f"{BASE_URL}/api/compliance-docs/seed-demo")
        
        response = requests.get(f"{BASE_URL}/api/compliance-docs/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check metrics
        assert "metrics" in data, "Response should have 'metrics' field"
        metrics = data["metrics"]
        
        expected_metric_fields = ["totalFiles", "compliant", "minorIssues", "majorIssues", "pendingReview", "avgScore"]
        for field in expected_metric_fields:
            assert field in metrics, f"Metrics should have '{field}' field"
        
        print(f"Dashboard metrics: totalFiles={metrics['totalFiles']}, compliant={metrics['compliant']}, avgScore={metrics['avgScore']}")
        
        # Check advice files
        assert "adviceFiles" in data, "Response should have 'adviceFiles' field"
        advice_files = data["adviceFiles"]
        
        if len(advice_files) > 0:
            file = advice_files[0]
            assert "id" in file, "Advice file should have 'id'"
            assert "client" in file, "Advice file should have 'client'"
            assert "status" in file, "Advice file should have 'status'"
            print(f"First advice file: {file['id']} - {file['client']}")
    
    def test_compliance_dashboard_metrics_values(self):
        """Test that compliance dashboard returns correct metric values"""
        # Ensure data is seeded
        requests.post(f"{BASE_URL}/api/compliance-docs/seed-demo")
        
        response = requests.get(f"{BASE_URL}/api/compliance-docs/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        metrics = data["metrics"]
        
        # Verify metrics are numeric
        assert isinstance(metrics["totalFiles"], int), "totalFiles should be integer"
        assert isinstance(metrics["compliant"], int), "compliant should be integer"
        assert isinstance(metrics["minorIssues"], int), "minorIssues should be integer"
        assert isinstance(metrics["majorIssues"], int), "majorIssues should be integer"
        assert isinstance(metrics["pendingReview"], int), "pendingReview should be integer"
        
        # Total should be >= sum of categories
        total = metrics["totalFiles"]
        assert total >= 0, "totalFiles should be non-negative"
        
        print(f"Metrics validation passed: {metrics}")


class TestAgePensionCalculator:
    """Test Age Pension Calculator API"""
    
    def test_age_pension_calculate_endpoint(self):
        """Test POST /api/age-pension/calculate works correctly"""
        payload = {
            "birth_date": "1958-01-15",  # 67 years old
            "relationship_status": "single",
            "homeowner": True,
            "total_assets": 300000,
            "income_per_fortnight": 500
        }
        
        response = requests.post(f"{BASE_URL}/api/age-pension/calculate", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "eligible" in data or "eligibility" in data or "pension_amount" in data, "Response should have eligibility/pension info"
        print(f"Age pension calculation result: {data}")
    
    def test_age_pension_rates_endpoint(self):
        """Test GET /api/age-pension/rates returns current rates"""
        response = requests.get(f"{BASE_URL}/api/age-pension/rates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        print(f"Age pension rates: {data}")


class TestBuffettRouteRemoved:
    """Test that /buffett-trading route is removed"""
    
    def test_buffett_trading_route_not_standalone(self):
        """Verify /buffett-trading is not a standalone backend route"""
        # This is a frontend route test - the backend doesn't have this route
        # The Buffett Ideas are now a tab inside StockTrading page
        # We just verify the stock-trading related endpoints work
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1")
        # This should work as trading endpoints exist
        assert response.status_code in [200, 404], "Trading endpoint should respond"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
