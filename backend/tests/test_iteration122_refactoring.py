"""
Iteration 122 - Regression tests after major code refactoring
Tests: route_registry pattern, TypeScript migration, security fixes
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRouteRegistry:
    """Test health endpoint and route_registry pattern"""
    
    def test_health_endpoint_returns_200(self):
        """Test 1: Backend health endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["architecture"] == "modular"
        assert "execution_layer" in data
        assert "capabilities" in data
        print(f"✓ Health check passed: status={data['status']}, version={data['version']}")

class TestMarketDataAPI:
    """Test market data indicators API"""
    
    def test_market_data_returns_17_indicators(self):
        """Test 2: Market data API returns 17 live indicators"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators")
        assert response.status_code == 200
        data = response.json()
        assert "indicators" in data
        indicators = data["indicators"]
        assert len(indicators) == 17, f"Expected 17 indicators, got {len(indicators)}"
        
        # Verify key indicators are present
        symbols = [ind["symbol"] for ind in indicators]
        expected_symbols = ["^AXJO", "^GSPC", "^DJI", "^IXIC", "^FTSE", "AUDUSD=X"]
        for sym in expected_symbols:
            assert sym in symbols, f"Missing indicator: {sym}"
        
        # Verify indicator structure
        for ind in indicators:
            assert "symbol" in ind
            assert "name" in ind
            assert "value" in ind
            assert isinstance(ind["value"], (int, float))
        
        print(f"✓ Market data passed: {len(indicators)} indicators returned")

class TestNewsAPI:
    """Test news headlines API"""
    
    def test_news_returns_live_headlines(self):
        """Test 3: News API returns live headlines"""
        response = requests.get(f"{BASE_URL}/api/news/headlines")
        assert response.status_code == 200
        data = response.json()
        assert "headlines" in data
        assert "count" in data
        assert data["count"] > 0, "Expected at least 1 headline"
        
        # Verify headline structure
        headlines = data["headlines"]
        assert len(headlines) > 0
        for headline in headlines[:5]:  # Check first 5
            assert "title" in headline
            assert "source" in headline
            assert "link" in headline
        
        print(f"✓ News API passed: {data['count']} headlines from {len(data.get('sources', []))} sources")

class TestComplianceDashboardAPI:
    """Test compliance dashboard API with MongoDB data"""
    
    def test_compliance_dashboard_returns_mongodb_data(self):
        """Test 4: Compliance dashboard API returns MongoDB data"""
        response = requests.get(f"{BASE_URL}/api/compliance-docs/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify metrics structure
        assert "metrics" in data
        metrics = data["metrics"]
        assert "totalFiles" in metrics
        assert "reviewed" in metrics
        assert "compliant" in metrics
        assert "avgScore" in metrics
        
        # Verify advice files
        assert "adviceFiles" in data
        advice_files = data["adviceFiles"]
        assert len(advice_files) > 0, "Expected at least 1 advice file"
        
        # Verify advice file structure
        for file in advice_files:
            assert "id" in file
            assert "client" in file
            assert "status" in file
            assert file["status"] in ["compliant", "minor_issues", "major_issues", "pending_review"]
        
        print(f"✓ Compliance dashboard passed: {metrics['totalFiles']} files, avg score {metrics['avgScore']}")

class TestVoiceAssistantAPI:
    """Test voice assistant chat API"""
    
    def test_voice_assistant_chat_works(self):
        """Test 5: Voice assistant chat works via POST /api/voice-assistant/chat"""
        # Voice assistant uses FormData, not JSON
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            data={"message": "What is portfolio diversification?"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "session_id" in data
        assert "response" in data
        assert data["error"] is False
        assert len(data["response"]) > 50, "Expected a meaningful response"
        
        print(f"✓ Voice assistant passed: session_id={data['session_id'][:8]}...")

class TestBuffettTradingRouteRemoved:
    """Test that /buffett-trading route is removed"""
    
    def test_buffett_trading_route_removed(self):
        """Test 13: /buffett-trading route is removed (should return 404 or redirect)"""
        # This is a frontend route, but we can check if there's a backend endpoint
        # The route was removed from frontend, so we just verify no backend endpoint exists
        response = requests.get(f"{BASE_URL}/api/buffett-trading")
        # Should return 404 or 405 (method not allowed) since route doesn't exist
        assert response.status_code in [404, 405, 422], f"Expected 404/405/422, got {response.status_code}"
        print(f"✓ Buffett trading route check passed: status={response.status_code}")

class TestRouteRegistryIntegrity:
    """Test that route_registry loaded all routes correctly"""
    
    def test_multiple_routes_accessible(self):
        """Verify multiple routes from route_registry are accessible"""
        routes_to_test = [
            ("/api/health", "GET"),
            ("/api/market-data/indicators", "GET"),
            ("/api/news/headlines", "GET"),
            ("/api/compliance-docs/dashboard", "GET"),
            ("/api/xplan/status", "GET"),
        ]
        
        passed = 0
        for route, method in routes_to_test:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{route}")
            else:
                response = requests.post(f"{BASE_URL}{route}")
            
            if response.status_code in [200, 201]:
                passed += 1
            else:
                print(f"  Warning: {route} returned {response.status_code}")
        
        assert passed >= 4, f"Expected at least 4 routes to pass, got {passed}"
        print(f"✓ Route registry integrity: {passed}/{len(routes_to_test)} routes accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
