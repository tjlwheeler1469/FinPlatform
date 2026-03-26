"""
Test iteration 110: New features testing
- Real-time Collaboration (WebSocket sessions)
- Advanced Scenario Templates (14 pre-built templates)
- Market Data (Economic indicators, pension forecasts)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCollaborationSessions:
    """Test real-time collaboration session endpoints"""
    
    def test_create_collaboration_session(self):
        """POST /api/collaboration/sessions/create - Create a new collaboration session"""
        response = requests.post(
            f"{BASE_URL}/api/collaboration/sessions/create",
            json={
                "client_id": "test_client_001",
                "advisor_id": "test_advisor_001",
                "advisor_name": "Test Advisor",
                "client_name": "Test Client",
                "session_type": "planning"
            }
        )
        print(f"Create session response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "session_id" in data, "Response should contain session_id"
        assert "join_url" in data, "Response should contain join_url"
        assert "message" in data, "Response should contain message"
        print(f"Created session: {data['session_id']}")
        return data["session_id"]
    
    def test_get_session_info(self):
        """GET /api/collaboration/sessions/{session_id} - Get session info"""
        # First create a session
        create_response = requests.post(
            f"{BASE_URL}/api/collaboration/sessions/create",
            json={
                "client_id": "test_client_002",
                "advisor_id": "test_advisor_002",
                "advisor_name": "Test Advisor 2",
                "client_name": "Test Client 2",
                "session_type": "review"
            }
        )
        assert create_response.status_code == 200
        session_id = create_response.json()["session_id"]
        
        # Get session info
        response = requests.get(f"{BASE_URL}/api/collaboration/sessions/{session_id}")
        print(f"Get session info response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["session_id"] == session_id
        assert data["client_id"] == "test_client_002"
        assert data["advisor_id"] == "test_advisor_002"
        assert "status" in data
        print(f"Session info: {data}")
    
    def test_get_nonexistent_session(self):
        """GET /api/collaboration/sessions/{session_id} - 404 for non-existent session"""
        response = requests.get(f"{BASE_URL}/api/collaboration/sessions/nonexistent123")
        print(f"Get nonexistent session response: {response.status_code}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_list_active_sessions(self):
        """GET /api/collaboration/sessions - List active sessions"""
        response = requests.get(f"{BASE_URL}/api/collaboration/sessions")
        print(f"List sessions response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "sessions" in data, "Response should contain sessions list"
        print(f"Found {len(data['sessions'])} sessions")


class TestScenarioTemplates:
    """Test advanced scenario templates endpoints"""
    
    def test_list_all_templates(self):
        """GET /api/scenario-templates/list - Get all templates"""
        response = requests.get(f"{BASE_URL}/api/scenario-templates/list")
        print(f"List templates response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "templates" in data, "Response should contain templates"
        assert "categories" in data, "Response should contain categories"
        assert "total_count" in data, "Response should contain total_count"
        
        templates = data["templates"]
        assert len(templates) >= 10, f"Expected at least 10 templates, got {len(templates)}"
        print(f"Found {len(templates)} templates")
        
        # Verify template structure
        for template in templates[:3]:
            assert "id" in template
            assert "name" in template
            assert "category" in template
            assert "description" in template
            print(f"  - {template['name']} ({template['category']})")
    
    def test_list_templates_by_category(self):
        """GET /api/scenario-templates/list?category=retirement_timing"""
        response = requests.get(f"{BASE_URL}/api/scenario-templates/list?category=retirement_timing")
        print(f"List templates by category response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        templates = data["templates"]
        for template in templates:
            assert template["category"] == "retirement_timing"
        print(f"Found {len(templates)} retirement_timing templates")
    
    def test_get_specific_template(self):
        """GET /api/scenario-templates/{id} - Get specific template"""
        template_id = "early_retirement_55"
        response = requests.get(f"{BASE_URL}/api/scenario-templates/{template_id}")
        print(f"Get template response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == template_id
        assert data["name"] == "Early Retirement at 55"
        assert "adjustments" in data
        assert "considerations" in data
        print(f"Template: {data['name']}")
        print(f"Adjustments: {data['adjustments']}")
    
    def test_get_nonexistent_template(self):
        """GET /api/scenario-templates/{id} - 404 for non-existent template"""
        response = requests.get(f"{BASE_URL}/api/scenario-templates/nonexistent_template")
        print(f"Get nonexistent template response: {response.status_code}")
        assert response.status_code == 404
    
    def test_apply_template(self):
        """POST /api/scenario-templates/{id}/apply - Apply template to user inputs"""
        template_id = "early_retirement_55"
        response = requests.post(
            f"{BASE_URL}/api/scenario-templates/{template_id}/apply",
            params={
                "current_age": 45,
                "retirement_age": 65,
                "net_worth": 2000000,
                "annual_income": 200000,
                "annual_expenses": 100000,
                "super_balance": 600000,
                "is_couple": True
            }
        )
        print(f"Apply template response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["template_id"] == template_id
        assert data["template_name"] == "Early Retirement at 55"
        assert "original_inputs" in data
        assert "adjusted_inputs" in data
        assert "applied_changes" in data
        assert "considerations" in data
        
        # Verify retirement age was adjusted to 55
        assert data["adjusted_inputs"]["retirement_age"] == 55
        print(f"Applied changes: {data['applied_changes']}")
    
    def test_apply_sabbatical_template(self):
        """POST /api/scenario-templates/sabbatical_1year/apply"""
        response = requests.post(
            f"{BASE_URL}/api/scenario-templates/sabbatical_1year/apply",
            params={
                "current_age": 40,
                "retirement_age": 65,
                "net_worth": 1500000,
                "annual_income": 150000,
                "annual_expenses": 80000,
                "super_balance": 400000,
                "is_couple": False
            }
        )
        print(f"Apply sabbatical template response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["template_name"] == "1-Year Career Break"
        print(f"Sabbatical considerations: {data['considerations'][:2]}")
    
    def test_list_categories(self):
        """GET /api/scenario-templates/categories"""
        response = requests.get(f"{BASE_URL}/api/scenario-templates/categories")
        print(f"List categories response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        categories = data["categories"]
        
        expected_categories = ["retirement_timing", "career_break", "windfall", "lifestyle_change", "risk_scenario"]
        for cat in expected_categories:
            assert cat in categories, f"Missing category: {cat}"
        print(f"Categories: {list(categories.keys())}")


class TestMarketDataEndpoints:
    """Test market data endpoints including economic indicators and pension forecasts"""
    
    def test_get_economic_indicators(self):
        """GET /api/market/economic-indicators - Get Australian economic indicators"""
        response = requests.get(f"{BASE_URL}/api/market/economic-indicators")
        print(f"Economic indicators response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "indicators" in data, "Response should contain indicators"
        assert "timestamp" in data, "Response should contain timestamp"
        
        indicators = data["indicators"]
        expected_indicators = ["cash_rate", "inflation_cpi", "unemployment", "gdp_growth", "10yr_bond"]
        for ind in expected_indicators:
            assert ind in indicators, f"Missing indicator: {ind}"
            assert "value" in indicators[ind]
            assert "name" in indicators[ind]
        
        print(f"Cash Rate: {indicators['cash_rate']['value']}%")
        print(f"CPI Inflation: {indicators['inflation_cpi']['value']}%")
        print(f"Unemployment: {indicators['unemployment']['value']}%")
    
    def test_get_super_performance(self):
        """GET /api/market/super-performance - Get super fund benchmarks"""
        response = requests.get(f"{BASE_URL}/api/market/super-performance")
        print(f"Super performance response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "options" in data, "Response should contain options"
        
        options = data["options"]
        expected_options = ["growth", "balanced", "conservative", "high_growth"]
        for opt in expected_options:
            assert opt in options, f"Missing option: {opt}"
            assert "1yr" in options[opt]
            assert "5yr" in options[opt]
            assert "10yr" in options[opt]
        
        print(f"Growth 1yr: {options['growth']['1yr']}%")
        print(f"Balanced 5yr: {options['balanced']['5yr']}%")
    
    def test_get_pension_rate_history(self):
        """GET /api/market/pension-rates/history - Get pension rate history"""
        response = requests.get(f"{BASE_URL}/api/market/pension-rates/history")
        print(f"Pension rate history response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "history" in data, "Response should contain history"
        assert "next_indexation" in data, "Response should contain next_indexation"
        
        history = data["history"]
        assert len(history) > 0, "History should not be empty"
        
        # Verify structure
        for entry in history:
            assert "date" in entry
            assert "single" in entry
            assert "couple" in entry
        
        print(f"Latest pension rate (single): ${history[0]['single']}/fortnight")
        print(f"Latest pension rate (couple): ${history[0]['couple']}/fortnight")
    
    def test_get_pension_rate_forecast(self):
        """GET /api/market/pension-rates/forecast - Get forecasted pension rates"""
        response = requests.get(f"{BASE_URL}/api/market/pension-rates/forecast?years=5")
        print(f"Pension rate forecast response: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "forecasts" in data, "Response should contain forecasts"
        assert "inflation_assumption" in data, "Response should contain inflation_assumption"
        
        forecasts = data["forecasts"]
        assert len(forecasts) == 6, f"Expected 6 forecasts (current + 5 years), got {len(forecasts)}"
        
        # Verify structure
        for forecast in forecasts:
            assert "year" in forecast
            assert "single_fortnightly" in forecast
            assert "single_annual" in forecast
            assert "couple_fortnightly" in forecast
            assert "couple_annual" in forecast
        
        print(f"Inflation assumption: {data['inflation_assumption']*100}%")
        print(f"Year {forecasts[0]['year']} single annual: ${forecasts[0]['single_annual']:,.2f}")
        print(f"Year {forecasts[-1]['year']} single annual: ${forecasts[-1]['single_annual']:,.2f}")
    
    def test_pension_forecast_custom_years(self):
        """GET /api/market/pension-rates/forecast?years=10 - Custom forecast period"""
        response = requests.get(f"{BASE_URL}/api/market/pension-rates/forecast?years=10")
        print(f"Pension forecast 10 years response: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        forecasts = data["forecasts"]
        assert len(forecasts) == 11, f"Expected 11 forecasts, got {len(forecasts)}"


class TestExistingMarketEndpoints:
    """Verify existing market endpoints still work"""
    
    def test_market_indices(self):
        """GET /api/market/indices - Get market indices"""
        response = requests.get(f"{BASE_URL}/api/market/indices")
        print(f"Market indices response: {response.status_code}")
        assert response.status_code == 200
    
    def test_asx_top(self):
        """GET /api/market/asx/top - Get top ASX stocks"""
        response = requests.get(f"{BASE_URL}/api/market/asx/top")
        print(f"ASX top response: {response.status_code}")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
