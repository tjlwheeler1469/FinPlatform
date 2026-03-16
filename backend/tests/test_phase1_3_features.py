"""
Test Phase 1-3 Features: Decision Engine, Life Timeline, Client CRM
Tests the new v2 endpoints and services for the Wealth Operating System
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://portfolio-intel-18.preview.emergentagent.com').rstrip('/')

# Test data for Decision Engine
DECISION_ENGINE_PROFILE = {
    "age": 45,
    "retirement_age": 60,
    "current_income": 185000,
    "annual_expenses": 120000,
    "total_assets": 2920000,
    "total_debt": 942000,
    "super_balance": 450000,
    "emergency_fund": 75000,
    "investment_portfolio": 350000,
    "property_value": 1800000,
    "savings_rate": 0.15,
    "mortgage_rate": 6.5,
    "mortgage_balance": 942000
}


class TestDecisionEngineV2:
    """Test Decision Engine v2 endpoints"""
    
    def test_health_score_v2_returns_200(self):
        """Test health-score-v2 endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/health-score-v2",
            json=DECISION_ENGINE_PROFILE
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "grade" in data
        assert "components" in data
    
    def test_health_score_v2_returns_valid_score(self):
        """Test health score is between 0 and 100"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/health-score-v2",
            json=DECISION_ENGINE_PROFILE
        )
        data = response.json()
        assert 0 <= data["score"] <= 100
        assert data["grade"] in ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D"]
    
    def test_health_score_v2_has_all_components(self):
        """Test health score has all 5 components"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/health-score-v2",
            json=DECISION_ENGINE_PROFILE
        )
        data = response.json()
        expected_components = ["savings_rate", "debt_level", "liquidity", "retirement_readiness", "diversification"]
        for comp in expected_components:
            assert comp in data["components"]
            assert "score" in data["components"][comp]
            assert "status" in data["components"][comp]
    
    def test_recommendations_v2_returns_200(self):
        """Test recommendations-v2 endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/recommendations-v2",
            json=DECISION_ENGINE_PROFILE
        )
        assert response.status_code == 200
        data = response.json()
        assert "recommendations" in data
        assert "profile_summary" in data
    
    def test_recommendations_v2_returns_6_recommendations(self):
        """Test recommendations returns up to 6 recommendations"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/recommendations-v2",
            json=DECISION_ENGINE_PROFILE
        )
        data = response.json()
        assert len(data["recommendations"]) <= 6
        assert len(data["recommendations"]) > 0
    
    def test_recommendations_v2_has_required_fields(self):
        """Test each recommendation has required fields"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/recommendations-v2",
            json=DECISION_ENGINE_PROFILE
        )
        data = response.json()
        required_fields = ["id", "title", "description", "action", "impact_primary", "impact_label", "priority", "category", "difficulty", "timeframe"]
        for rec in data["recommendations"]:
            for field in required_fields:
                assert field in rec, f"Missing field: {field}"
    
    def test_recommendations_v2_impact_is_positive(self):
        """Test recommendation impacts are positive numbers"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/recommendations-v2",
            json=DECISION_ENGINE_PROFILE
        )
        data = response.json()
        for rec in data["recommendations"]:
            assert rec["impact_primary"] > 0


class TestLifeTimeline:
    """Test Life Timeline endpoints"""
    
    def test_default_timeline_returns_200(self):
        """Test default timeline endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/timeline/default?current_age=45")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert "event_types" in data
    
    def test_default_timeline_has_events(self):
        """Test default timeline has expected events"""
        response = requests.get(f"{BASE_URL}/api/timeline/default?current_age=45")
        data = response.json()
        assert len(data["events"]) > 0
        
        # Check for key events
        event_types = [e["event_type"] for e in data["events"]]
        assert "career_start" in event_types
        assert "retirement" in event_types
    
    def test_default_timeline_events_have_required_fields(self):
        """Test timeline events have required fields"""
        response = requests.get(f"{BASE_URL}/api/timeline/default?current_age=45")
        data = response.json()
        required_fields = ["id", "name", "event_type", "age", "year", "financial_impact"]
        for event in data["events"]:
            for field in required_fields:
                assert field in event, f"Missing field: {field}"
    
    def test_calculate_impact_returns_200(self):
        """Test calculate-impact endpoint returns 200"""
        # First get default timeline
        timeline_response = requests.get(f"{BASE_URL}/api/timeline/default?current_age=45")
        events = timeline_response.json()["events"]
        
        # Calculate impact
        response = requests.post(
            f"{BASE_URL}/api/timeline/calculate-impact",
            json={
                "events": events,
                "current_net_worth": 1978000,
                "annual_income": 185000,
                "savings_rate": 0.15
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "projections" in data
        assert "summary" in data
    
    def test_calculate_impact_has_projections(self):
        """Test calculate-impact returns projections"""
        timeline_response = requests.get(f"{BASE_URL}/api/timeline/default?current_age=45")
        events = timeline_response.json()["events"]
        
        response = requests.post(
            f"{BASE_URL}/api/timeline/calculate-impact",
            json={
                "events": events,
                "current_net_worth": 1978000,
                "annual_income": 185000,
                "savings_rate": 0.15
            }
        )
        data = response.json()
        assert len(data["projections"]) > 0
        
        # Check projection structure
        proj = data["projections"][0]
        assert "age" in proj
        assert "year" in proj
        assert "net_worth" in proj
    
    def test_calculate_impact_has_milestones(self):
        """Test calculate-impact returns milestones"""
        timeline_response = requests.get(f"{BASE_URL}/api/timeline/default?current_age=45")
        events = timeline_response.json()["events"]
        
        response = requests.post(
            f"{BASE_URL}/api/timeline/calculate-impact",
            json={
                "events": events,
                "current_net_worth": 1978000,
                "annual_income": 185000,
                "savings_rate": 0.15
            }
        )
        data = response.json()
        assert "milestones" in data
    
    def test_calculate_impact_summary(self):
        """Test calculate-impact returns summary with retirement info"""
        timeline_response = requests.get(f"{BASE_URL}/api/timeline/default?current_age=45")
        events = timeline_response.json()["events"]
        
        response = requests.post(
            f"{BASE_URL}/api/timeline/calculate-impact",
            json={
                "events": events,
                "current_net_worth": 1978000,
                "annual_income": 185000,
                "savings_rate": 0.15
            }
        )
        data = response.json()
        summary = data["summary"]
        assert "retirement_age" in summary
        assert "retirement_net_worth" in summary
        assert "years_to_retirement" in summary


class TestClientCRM:
    """Test Client CRM endpoints"""
    
    def test_get_clients_returns_200(self):
        """Test get clients endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "summary" in data
    
    def test_get_clients_returns_demo_data(self):
        """Test get clients returns demo client data"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        assert len(data["clients"]) == 4
        
        # Check for expected clients
        client_names = [c["name"] for c in data["clients"]]
        assert "John & Sarah Wheeler" in client_names
        assert "Michael Chen" in client_names
    
    def test_get_clients_summary(self):
        """Test get clients returns correct summary"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        summary = data["summary"]
        
        assert summary["total"] == 4
        assert "active" in summary
        assert "prospects" in summary
        assert "review_due" in summary
        assert "total_aum" in summary
        assert summary["total_aum"] > 0
    
    def test_client_has_required_fields(self):
        """Test each client has required fields"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        
        required_fields = ["client_id", "name", "email", "status", "financial_summary", "advice_stage"]
        for client in data["clients"]:
            for field in required_fields:
                assert field in client, f"Missing field: {field}"
    
    def test_client_financial_summary(self):
        """Test client financial summary has required fields"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        
        for client in data["clients"]:
            fs = client["financial_summary"]
            assert "net_worth" in fs
            assert "total_assets" in fs
            assert "annual_income" in fs
    
    def test_get_tasks_returns_200(self):
        """Test get tasks endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
    
    def test_tasks_have_required_fields(self):
        """Test tasks have required fields"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        data = response.json()
        
        required_fields = ["task_id", "title", "status", "priority"]
        for task in data["tasks"]:
            for field in required_fields:
                assert field in task, f"Missing field: {field}"
    
    def test_get_workflow_stages_returns_200(self):
        """Test get workflow stages endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/crm/workflow/stages")
        assert response.status_code == 200
        data = response.json()
        assert "stages" in data
    
    def test_workflow_stages_complete(self):
        """Test workflow has all expected stages"""
        response = requests.get(f"{BASE_URL}/api/crm/workflow/stages")
        data = response.json()
        
        expected_stages = ["discovery", "analysis", "strategy", "presentation", "implementation", "review"]
        stage_names = [s["stage"] for s in data["stages"]]
        for stage in expected_stages:
            assert stage in stage_names


class TestOldEndpointsStillWork:
    """Test that old endpoints still work after updates"""
    
    def test_old_health_score_endpoint(self):
        """Test old health-score endpoint still works"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/health-score",
            json={
                "age": 45,
                "retirement_age": 60,
                "current_income": 185000,
                "annual_expenses": 120000,
                "total_assets": 2920000,
                "total_debt": 942000,
                "super_balance": 450000,
                "cash_savings": 75000,
                "investment_portfolio": 350000,
                "property_value": 1800000,
                "property_debt": 942000,
                "savings_rate": 0.15,
                "risk_tolerance": "moderate"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "score" in data
        assert "grade" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
