"""
Iteration 90 - Testing News Headlines, Decision Engine, and Xplan Sync Features
Tests:
1. GET /api/news/headlines - News from financial sources
2. GET /api/news/sources - List available news sources
3. POST /api/decision-engine/recommendations-v2 - Recommendations with impact_primary values
4. POST /api/xplan/enable-demo - Enable Xplan demo mode
5. GET /api/xplan/status - Check Xplan connection status
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestNewsHeadlines:
    """Test news headlines API endpoints"""
    
    def test_get_news_headlines(self):
        """Test GET /api/news/headlines returns news with required fields"""
        response = requests.get(f"{BASE_URL}/api/news/headlines", params={"limit": 10})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "headlines" in data, "Response should contain 'headlines' key"
        assert "count" in data, "Response should contain 'count' key"
        assert "sources" in data, "Response should contain 'sources' key"
        assert "fetched_at" in data, "Response should contain 'fetched_at' key"
        
        # Verify headlines structure
        if len(data["headlines"]) > 0:
            headline = data["headlines"][0]
            assert "source" in headline, "Headline should have 'source'"
            assert "title" in headline, "Headline should have 'title'"
            assert "link" in headline, "Headline should have 'link'"
            assert "summary" in headline, "Headline should have 'summary'"
            print(f"✓ News headlines returned {data['count']} items from sources: {data['sources']}")
        else:
            print("✓ News headlines endpoint working (fallback data may be used)")
    
    def test_get_news_headlines_with_category_filter(self):
        """Test GET /api/news/headlines with category filter"""
        response = requests.get(f"{BASE_URL}/api/news/headlines", params={"category": "markets", "limit": 5})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "headlines" in data
        # If headlines exist, verify category filter
        for headline in data["headlines"]:
            if headline.get("category"):
                assert headline["category"] == "markets", f"Expected category 'markets', got {headline['category']}"
        print("✓ News headlines category filter working")
    
    def test_get_news_sources(self):
        """Test GET /api/news/sources returns list of available sources"""
        response = requests.get(f"{BASE_URL}/api/news/sources")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "sources" in data, "Response should contain 'sources' key"
        assert len(data["sources"]) > 0, "Should have at least one source"
        
        # Verify source structure
        source = data["sources"][0]
        assert "id" in source, "Source should have 'id'"
        assert "name" in source, "Source should have 'name'"
        assert "category" in source, "Source should have 'category'"
        
        # Check for expected sources
        source_ids = [s["id"] for s in data["sources"]]
        expected_sources = ["cnbc", "wsj_markets", "ft", "afr", "economist"]
        found_sources = [s for s in expected_sources if s in source_ids]
        print(f"✓ News sources returned {len(data['sources'])} sources. Found expected: {found_sources}")
    
    def test_get_news_categories(self):
        """Test GET /api/news/categories returns list of categories"""
        response = requests.get(f"{BASE_URL}/api/news/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "categories" in data, "Response should contain 'categories' key"
        print(f"✓ News categories: {data['categories']}")


class TestDecisionEngine:
    """Test decision engine API endpoints"""
    
    def test_recommendations_v2_has_impact_primary(self):
        """Test POST /api/decision-engine/recommendations-v2 returns impact_primary numeric values"""
        payload = {
            "age": 45,
            "retirement_age": 65,
            "current_income": 180000,
            "annual_expenses": 120000,
            "total_assets": 2500000,
            "total_debt": 450000,
            "super_balance": 580000,
            "emergency_fund": 75000,
            "investment_portfolio": 350000,
            "property_value": 950000,
            "savings_rate": 0.15,
            "mortgage_rate": 6.5,
            "mortgage_balance": 450000
        }
        
        response = requests.post(f"{BASE_URL}/api/decision-engine/recommendations-v2", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success"), "Response should have success=True"
        assert "recommendations" in data, "Response should contain 'recommendations'"
        assert len(data["recommendations"]) > 0, "Should have at least one recommendation"
        
        # Verify each recommendation has impact_primary as numeric
        for rec in data["recommendations"]:
            assert "impact_primary" in rec, f"Recommendation '{rec.get('id')}' should have 'impact_primary'"
            assert isinstance(rec["impact_primary"], (int, float)), f"impact_primary should be numeric, got {type(rec['impact_primary'])}"
            print(f"  - {rec['id']}: impact_primary = {rec['impact_primary']}")
        
        print(f"✓ Recommendations-v2 returned {len(data['recommendations'])} recommendations with impact_primary values")
    
    def test_health_score_v2(self):
        """Test POST /api/decision-engine/health-score-v2 returns health score"""
        payload = {
            "age": 45,
            "retirement_age": 65,
            "current_income": 180000,
            "annual_expenses": 120000,
            "total_assets": 2500000,
            "total_debt": 450000,
            "super_balance": 580000,
            "emergency_fund": 75000,
            "investment_portfolio": 350000,
            "property_value": 950000,
            "savings_rate": 0.15,
            "mortgage_rate": 6.5,
            "mortgage_balance": 450000
        }
        
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score-v2", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success"), "Response should have success=True"
        assert "overall_score" in data, "Response should contain 'overall_score'"
        assert "grade" in data, "Response should contain 'grade'"
        assert "component_scores" in data, "Response should contain 'component_scores'"
        
        # Verify score is numeric and in valid range
        assert isinstance(data["overall_score"], (int, float)), "overall_score should be numeric"
        assert 0 <= data["overall_score"] <= 100, f"overall_score should be 0-100, got {data['overall_score']}"
        
        print(f"✓ Health Score: {data['overall_score']} (Grade: {data['grade']})")


class TestXplanSync:
    """Test Xplan sync functionality"""
    
    def test_enable_xplan_demo_mode(self):
        """Test POST /api/xplan/enable-demo enables demo mode"""
        response = requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success"), "Response should have success=True"
        assert data.get("mode") == "demo", "Mode should be 'demo'"
        print("✓ Xplan demo mode enabled")
    
    def test_xplan_status_after_demo_enabled(self):
        """Test GET /api/xplan/status shows connected in demo mode"""
        # First enable demo mode
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        # Then check status
        response = requests.get(f"{BASE_URL}/api/xplan/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("connected"), "Should be connected in demo mode"
        assert data.get("mode") == "demo", "Mode should be 'demo'"
        print(f"✓ Xplan status: connected={data['connected']}, mode={data['mode']}")
    
    def test_xplan_push_strategy(self):
        """Test POST /api/xplan/push can push strategy data"""
        # Enable demo mode first with default advisor_id
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        # Use default advisor_id which was configured by enable-demo
        payload = {
            "advisor_id": "default",
            "client_id": "test_client",
            "data_type": "strategy",
            "data": {
                "description": "Test goal update",
                "goalData": {
                    "name": "Test Retirement Goal",
                    "target": 2000000,
                    "current": 500000
                }
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/xplan/push", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success"), "Push should succeed in demo mode"
        print("✓ Xplan push strategy working (demo mode)")


class TestMacroDashboard:
    """Test macro dashboard endpoints used by MacroDashboard.jsx"""
    
    def test_macro_overview(self):
        """Test GET /api/macro/overview returns market overview"""
        response = requests.get(f"{BASE_URL}/api/macro/overview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "highlights" in data, "Response should contain 'highlights'"
        assert "market_status" in data, "Response should contain 'market_status'"
        print("✓ Macro overview working")
    
    def test_macro_indices(self):
        """Test GET /api/macro/indices returns market indices"""
        response = requests.get(f"{BASE_URL}/api/macro/indices")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Macro indices working")
    
    def test_macro_currencies(self):
        """Test GET /api/macro/currencies returns currency data"""
        response = requests.get(f"{BASE_URL}/api/macro/currencies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Macro currencies working")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
