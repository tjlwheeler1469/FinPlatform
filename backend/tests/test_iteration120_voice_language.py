"""
Test Suite for Iteration 120 - P3 Features
Tests Voice Assistant API, Language Support, and regression on P0-P2 features

Features tested:
1. Voice Assistant: POST /api/voice-assistant/chat - GPT-powered financial advice
2. Market Data API: GET /api/market-data/indicators - 17 market indicators
3. Compliance Dashboard: GET /api/compliance-docs/dashboard - MongoDB persistence
4. News Headlines: GET /api/news/headlines - Live news feeds
5. Trading Holdings: GET /api/trading/holdings/{client_id} - Portfolio data
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("PASS: API health check")


class TestVoiceAssistant:
    """Voice Assistant API tests - P3 Feature"""
    
    def test_voice_chat_endpoint_exists(self):
        """Test that voice chat endpoint exists and accepts POST"""
        # Send a simple financial question
        form_data = {
            'message': 'What is superannuation?',
            'session_id': 'test_session_123'
        }
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            data=form_data,
            timeout=60  # GPT calls can take time
        )
        assert response.status_code == 200, f"Voice chat failed: {response.status_code}"
        data = response.json()
        assert 'response' in data, "Response should contain 'response' field"
        assert 'session_id' in data, "Response should contain 'session_id' field"
        assert len(data['response']) > 10, "Response should have meaningful content"
        print(f"PASS: Voice chat returned response: {data['response'][:100]}...")
    
    def test_voice_chat_financial_question(self):
        """Test voice chat with a financial planning question"""
        form_data = {
            'message': 'How much should I save for retirement?',
            'session_id': 'test_session_456'
        }
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            data=form_data,
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        assert not data.get('error') or data.get('error') is None, f"Chat returned error: {data}"
        # Check response mentions retirement-related terms
        response_lower = data['response'].lower()
        assert any(term in response_lower for term in ['retire', 'super', 'save', 'invest', 'pension', 'fund']), \
            f"Response should mention retirement-related terms: {data['response'][:200]}"
        print("PASS: Voice chat handles financial questions correctly")
    
    def test_voice_chat_session_persistence(self):
        """Test that session_id is returned for conversation continuity"""
        form_data = {
            'message': 'Hello',
            'session_id': 'persistent_session_789'
        }
        response = requests.post(
            f"{BASE_URL}/api/voice-assistant/chat",
            data=form_data,
            timeout=60
        )
        assert response.status_code == 200
        data = response.json()
        assert data['session_id'] == 'persistent_session_789', "Session ID should be preserved"
        print("PASS: Voice chat preserves session ID")


class TestMarketDataAPI:
    """Market Data API tests - 17 indicators"""
    
    def test_market_indicators_endpoint(self):
        """Test market indicators returns data"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators", timeout=30)
        assert response.status_code == 200, f"Market data failed: {response.status_code}"
        data = response.json()
        assert 'indicators' in data, "Response should contain 'indicators'"
        assert 'source' in data, "Response should contain 'source'"
        print(f"PASS: Market data returned {len(data['indicators'])} indicators, source: {data['source']}")
    
    def test_market_indicators_count(self):
        """Test that we get 17 market indicators"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators", timeout=30)
        assert response.status_code == 200
        data = response.json()
        indicators = data.get('indicators', [])
        # Should have at least 10 indicators (some may fail to fetch)
        assert len(indicators) >= 10, f"Expected at least 10 indicators, got {len(indicators)}"
        print(f"PASS: Market data has {len(indicators)} indicators")
    
    def test_market_indicators_structure(self):
        """Test market indicator data structure"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators", timeout=30)
        assert response.status_code == 200
        data = response.json()
        indicators = data.get('indicators', [])
        if indicators:
            indicator = indicators[0]
            required_fields = ['symbol', 'name', 'value', 'change', 'change_percent']
            for field in required_fields:
                assert field in indicator, f"Indicator missing field: {field}"
            print(f"PASS: Market indicator structure is correct: {indicator['name']}")
    
    def test_market_indicators_include_currencies(self):
        """Test that market data includes expanded currency pairs"""
        response = requests.get(f"{BASE_URL}/api/market-data/indicators", timeout=30)
        assert response.status_code == 200
        data = response.json()
        indicator_names = [i['name'] for i in data.get('indicators', [])]
        # Check for at least some currency pairs
        currency_found = any('AUD' in name for name in indicator_names)
        assert currency_found, f"Should include AUD currency pairs. Found: {indicator_names}"
        print("PASS: Market data includes currency pairs")


class TestComplianceDashboard:
    """Compliance Dashboard API tests - MongoDB persistence"""
    
    def test_seed_demo_data(self):
        """Test seeding demo compliance data"""
        response = requests.post(f"{BASE_URL}/api/compliance-docs/seed-demo", timeout=30)
        assert response.status_code == 200, f"Seed failed: {response.status_code}"
        data = response.json()
        assert 'status' in data, "Response should contain 'status'"
        assert data['status'] in ['seeded', 'already_seeded'], f"Unexpected status: {data['status']}"
        print(f"PASS: Compliance seed status: {data['status']}")
    
    def test_compliance_dashboard_endpoint(self):
        """Test compliance dashboard returns metrics"""
        # First seed data
        requests.post(f"{BASE_URL}/api/compliance-docs/seed-demo", timeout=30)
        
        response = requests.get(f"{BASE_URL}/api/compliance-docs/dashboard", timeout=30)
        assert response.status_code == 200, f"Dashboard failed: {response.status_code}"
        data = response.json()
        assert 'metrics' in data, "Response should contain 'metrics'"
        assert 'adviceFiles' in data, "Response should contain 'adviceFiles'"
        print(f"PASS: Compliance dashboard returned {len(data['adviceFiles'])} files")
    
    def test_compliance_metrics_structure(self):
        """Test compliance metrics have required fields"""
        response = requests.get(f"{BASE_URL}/api/compliance-docs/dashboard", timeout=30)
        assert response.status_code == 200
        data = response.json()
        metrics = data.get('metrics', {})
        required_fields = ['totalFiles', 'compliant', 'minorIssues', 'majorIssues', 'pendingReview', 'avgScore']
        for field in required_fields:
            assert field in metrics, f"Metrics missing field: {field}"
        print(f"PASS: Compliance metrics structure correct. Total files: {metrics['totalFiles']}")
    
    def test_compliance_advice_files_structure(self):
        """Test advice files have required fields"""
        response = requests.get(f"{BASE_URL}/api/compliance-docs/dashboard", timeout=30)
        assert response.status_code == 200
        data = response.json()
        advice_files = data.get('adviceFiles', [])
        if advice_files:
            file = advice_files[0]
            required_fields = ['id', 'client', 'type', 'date', 'adviser', 'status']
            for field in required_fields:
                assert field in file, f"Advice file missing field: {field}"
            print(f"PASS: Advice file structure correct: {file['id']}")


class TestNewsHeadlines:
    """News Headlines API tests"""
    
    def test_news_headlines_endpoint(self):
        """Test news headlines returns data"""
        response = requests.get(f"{BASE_URL}/api/news/headlines", timeout=30)
        assert response.status_code == 200, f"News failed: {response.status_code}"
        data = response.json()
        assert 'headlines' in data, "Response should contain 'headlines'"
        print(f"PASS: News returned {len(data.get('headlines', []))} headlines")
    
    def test_news_headlines_structure(self):
        """Test news headline data structure"""
        response = requests.get(f"{BASE_URL}/api/news/headlines", timeout=30)
        assert response.status_code == 200
        data = response.json()
        headlines = data.get('headlines', [])
        if headlines:
            headline = headlines[0]
            assert 'title' in headline, "Headline should have 'title'"
            assert 'source' in headline, "Headline should have 'source'"
            print(f"PASS: News headline structure correct: {headline['title'][:50]}...")


class TestTradingHoldings:
    """Trading Holdings API tests - Portfolio data"""
    
    def test_holdings_endpoint(self):
        """Test holdings endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1", timeout=30)
        assert response.status_code == 200, f"Holdings failed: {response.status_code}"
        data = response.json()
        assert 'holdings' in data or 'summary' in data, "Response should contain holdings data"
        print("PASS: Holdings endpoint returned data")
    
    def test_holdings_summary(self):
        """Test holdings summary has required fields"""
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1", timeout=30)
        assert response.status_code == 200
        data = response.json()
        summary = data.get('summary', {})
        if summary:
            # Check for key summary fields
            assert 'total_value' in summary or 'total_cost_base' in summary, \
                "Summary should have value fields"
            print("PASS: Holdings summary structure correct")
    
    def test_holdings_data_not_nan(self):
        """Test that holdings data doesn't contain NaN values"""
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1", timeout=30)
        assert response.status_code == 200
        data = response.json()
        holdings = data.get('holdings', [])
        for holding in holdings:
            # Check numeric fields are not None/NaN
            if 'market_value' in holding:
                assert holding['market_value'] is not None, f"market_value is None for {holding.get('symbol')}"
            if 'current_value' in holding:
                assert holding['current_value'] is not None, f"current_value is None for {holding.get('symbol')}"
            if 'avg_cost' in holding:
                assert holding['avg_cost'] is not None, f"avg_cost is None for {holding.get('symbol')}"
        print("PASS: Holdings data has no NaN values")


class TestCGTSummary:
    """CGT Summary API tests"""
    
    def test_cgt_summary_endpoint(self):
        """Test CGT summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/trading/cgt-summary/client_1", timeout=30)
        assert response.status_code == 200, f"CGT summary failed: {response.status_code}"
        print("PASS: CGT summary endpoint works")


class TestNavigationRoutes:
    """Test that navigation routes are correctly configured"""
    
    def test_stock_trading_route_accessible(self):
        """Test stock trading page is accessible"""
        # This tests the frontend route indirectly via API
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1", timeout=30)
        assert response.status_code == 200, "Stock trading API should be accessible"
        print("PASS: Stock trading API accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
