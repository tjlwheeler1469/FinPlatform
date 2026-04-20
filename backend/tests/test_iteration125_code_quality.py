"""
Test suite for Iteration 125 - Code Quality Fixes
Tests the refactored backend APIs after code quality improvements:
- Scenario templates API with AST-based safe arithmetic parser
- Knowledge graph query engine refactored methods
- Risk control mapping API
- AI Insights API
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://scenario-simulator-5.preview.emergentagent.com')


class TestHealthEndpoint:
    """Health check endpoint tests"""
    
    def test_health_returns_healthy(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert "adviceos" in data
        assert "execution_layer" in data


class TestScenarioTemplatesAPI:
    """Tests for scenario templates API with refactored _safe_eval_arithmetic"""
    
    def test_list_templates(self):
        """Test /api/scenario-templates/list returns templates"""
        response = requests.get(f"{BASE_URL}/api/scenario-templates/list")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert "categories" in data
        assert len(data["templates"]) > 0
        
    def test_get_single_template(self):
        """Test /api/scenario-templates/{id} returns specific template"""
        response = requests.get(f"{BASE_URL}/api/scenario-templates/early_retirement_55")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "early_retirement_55"
        assert "adjustments" in data
        assert "considerations" in data
        
    def test_apply_template_with_formula(self):
        """Test applying template with formula evaluation (uses refactored _safe_eval_arithmetic)"""
        # This tests the AST-based safe arithmetic parser
        response = requests.post(
            f"{BASE_URL}/api/scenario-templates/sabbatical_1year/apply",
            params={
                "current_age": 45,
                "retirement_age": 65,
                "net_worth": 1000000,
                "annual_income": 150000,
                "annual_expenses": 80000
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["template_id"] == "sabbatical_1year"
        # Check that formula "current_age + 2" was evaluated correctly
        assert "income_gap_start" in data["adjusted_inputs"]
        assert data["adjusted_inputs"]["income_gap_start"] == 47  # 45 + 2
        
    def test_apply_template_with_multiplier(self):
        """Test applying template with multiplier adjustment"""
        response = requests.post(
            f"{BASE_URL}/api/scenario-templates/early_retirement_55/apply",
            params={
                "current_age": 45,
                "retirement_age": 65,
                "net_worth": 1000000,
                "annual_income": 150000,
                "annual_expenses": 80000
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Check that annual_expenses was multiplied by 1.1
        assert data["adjusted_inputs"]["annual_expenses"] == 88000  # 80000 * 1.1
        assert data["adjusted_inputs"]["retirement_age"] == 55  # absolute value
        
    def test_apply_template_requirements_check(self):
        """Test that template requirements are checked"""
        response = requests.post(
            f"{BASE_URL}/api/scenario-templates/early_retirement_55/apply",
            params={
                "current_age": 45,
                "retirement_age": 65,
                "net_worth": 500000,  # Below min_net_worth of 2000000
                "annual_income": 150000,
                "annual_expenses": 80000
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["requirements_met"] == False
        assert len(data["requirement_issues"]) > 0


class TestBuffettEngineAPI:
    """Tests for Buffett Engine API with live data"""
    
    def test_buffett_screen_returns_data(self):
        """Test /api/buffett-engine/screen returns live stock data"""
        response = requests.get(f"{BASE_URL}/api/buffett-engine/screen")
        assert response.status_code == 200
        data = response.json()
        assert "ideas" in data
        assert len(data["ideas"]) > 0
        # Check structure of first idea
        first_idea = data["ideas"][0]
        assert "symbol" in first_idea
        assert "name" in first_idea
        assert "sector" in first_idea
        assert "action" in first_idea
        assert "confidence" in first_idea


class TestRiskControlAPI:
    """Tests for Risk Control Mapping API"""
    
    def test_risk_control_dashboard(self):
        """Test /api/risk-control/dashboard returns summary"""
        response = requests.get(f"{BASE_URL}/api/risk-control/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "risk_summary" in data
        assert "control_summary" in data
        assert "review_status" in data
        assert "regulatory_alignment" in data
        
    def test_risk_control_risks_list(self):
        """Test /api/risk-control/risks returns risks"""
        response = requests.get(f"{BASE_URL}/api/risk-control/risks")
        assert response.status_code == 200
        data = response.json()
        assert "risks" in data
        
    def test_risk_control_controls_list(self):
        """Test /api/risk-control/controls returns controls"""
        response = requests.get(f"{BASE_URL}/api/risk-control/controls")
        assert response.status_code == 200
        data = response.json()
        assert "controls" in data


class TestAIInsightsAPI:
    """Tests for AI Insights API"""
    
    def test_todays_insights(self):
        """Test /api/copilot/todays-insights returns insights"""
        response = requests.get(f"{BASE_URL}/api/copilot/todays-insights")
        assert response.status_code == 200
        data = response.json()
        assert "insights" in data
        assert "total_insights" in data
        assert "critical_count" in data
        # Check structure of insights
        if len(data["insights"]) > 0:
            first_insight = data["insights"][0]
            assert "type" in first_insight
            assert "priority" in first_insight
            assert "title" in first_insight


class TestXplanAPI:
    """Tests for Xplan Integration API"""
    
    def test_xplan_status(self):
        """Test /api/xplan/status returns connection status"""
        response = requests.get(f"{BASE_URL}/api/xplan/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data or "mode" in data
        assert "capabilities" in data
        
    def test_xplan_sync_status(self):
        """Test /api/xplan/sync/status returns sync status"""
        response = requests.get(f"{BASE_URL}/api/xplan/sync/status")
        assert response.status_code == 200
        data = response.json()
        # Should have sync-related fields
        assert "total_synced_clients" in data or "last_full_sync" in data


class TestWorkflowAPI:
    """Tests for Workflow Engine API"""
    
    def test_workflow_dashboard(self):
        """Test /api/workflow/dashboard returns workflow summary"""
        response = requests.get(f"{BASE_URL}/api/workflow/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "action_items" in data
        
    def test_workflow_templates(self):
        """Test /api/workflow/templates returns templates"""
        response = requests.get(f"{BASE_URL}/api/workflow/templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        
    def test_workflow_stats(self):
        """Test /api/workflow/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/workflow/stats")
        assert response.status_code == 200
        data = response.json()
        assert "totals" in data or "performance" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
