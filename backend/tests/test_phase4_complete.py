"""
Phase 4 Complete Testing - Wealth Operating System
Tests all 4 phases: Decision Engine Core, Visual Planning, Adviser Platform, Intelligence Layer
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://secure-rebuild-3.preview.emergentagent.com')
API = f"{BASE_URL}/api"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{API}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data


class TestDecisionEngineV2:
    """Phase 1: Decision Engine Core - v2 endpoints"""
    
    @pytest.fixture
    def financial_profile(self):
        return {
            "age": 45,
            "retirement_age": 60,
            "current_income": 185000,
            "annual_expenses": 120000,
            "total_assets": 2920000,
            "total_debt": 942000,
            "super_balance": 850000,
            "emergency_fund": 75000,
            "investment_portfolio": 450000,
            "property_value": 1500000,
            "savings_rate": 0.15,
            "mortgage_rate": 6.5,
            "mortgage_balance": 942000
        }
    
    def test_health_score_v2(self, financial_profile):
        """Test Decision Engine Health Score v2 endpoint"""
        response = requests.post(f"{API}/decision-engine/health-score-v2", json=financial_profile)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "score" in data
        assert "grade" in data
        assert "components" in data
        assert "retirement_probability" in data
        
        # Verify score is in valid range
        assert 0 <= data["score"] <= 100
        assert data["grade"] in ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D"]
    
    def test_recommendations_v2(self, financial_profile):
        """Test Decision Engine Recommendations v2 endpoint"""
        response = requests.post(f"{API}/decision-engine/recommendations-v2", json=financial_profile)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "recommendations" in data
        assert "profile_summary" in data
        
        # Verify recommendations have required fields
        recs = data["recommendations"]
        assert len(recs) > 0
        for rec in recs:
            assert "id" in rec
            assert "title" in rec
            assert "impact_primary" in rec
            assert "priority" in rec
            assert "category" in rec
    
    def test_monte_carlo_advanced(self):
        """Test Advanced Monte Carlo simulation"""
        payload = {
            "initial_value": 1978000,
            "annual_contribution": 50000,
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 15,
            "target_value": 3500000,
            "simulations": 1000,
            "inflation_rate": 0.03
        }
        response = requests.post(f"{API}/decision-engine/monte-carlo-advanced", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "success_probability" in data
        assert "median_outcome" in data
        assert "percentile_projections" in data


class TestLifeTimeline:
    """Phase 2: Visual Planning - Life Timeline"""
    
    def test_default_timeline(self):
        """Test default timeline generation"""
        response = requests.get(f"{API}/timeline/default?current_age=45")
        assert response.status_code == 200
        data = response.json()
        
        assert "events" in data
        assert "event_types" in data
        
        events = data["events"]
        assert len(events) > 0
        
        # Verify event structure
        for event in events:
            assert "id" in event
            assert "name" in event
            assert "event_type" in event
            assert "age" in event
    
    def test_calculate_timeline_impact(self):
        """Test timeline impact calculation"""
        payload = {
            "events": [
                {"id": "current", "name": "Current Position", "event_type": "investment_milestone", "age": 45, "year": 2026, "is_current": True},
                {"id": "retirement", "name": "Retirement", "event_type": "retirement", "age": 60, "year": 2041}
            ],
            "current_net_worth": 1978000,
            "annual_income": 185000,
            "savings_rate": 0.15,
            "growth_rate": 0.07
        }
        response = requests.post(f"{API}/timeline/calculate-impact", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "projections" in data
        assert "summary" in data
        assert "milestones" in data
        
        summary = data["summary"]
        assert "retirement_net_worth" in summary
        assert "years_to_retirement" in summary


class TestClientCRM:
    """Phase 3: Adviser Platform - Client CRM"""
    
    def test_get_clients(self):
        """Test getting client list"""
        response = requests.get(f"{API}/crm/clients")
        assert response.status_code == 200
        data = response.json()
        
        assert "clients" in data
        assert "summary" in data
        
        summary = data["summary"]
        assert "total" in summary
        assert "active" in summary
        assert "prospects" in summary
        assert "total_aum" in summary
        
        # Verify client structure
        clients = data["clients"]
        assert len(clients) > 0
        for client in clients:
            assert "client_id" in client
            assert "name" in client
            assert "status" in client
            assert "financial_summary" in client
    
    def test_get_tasks(self):
        """Test getting tasks"""
        response = requests.get(f"{API}/crm/tasks")
        assert response.status_code == 200
        data = response.json()
        
        assert "tasks" in data
        assert "total" in data
        
        tasks = data["tasks"]
        for task in tasks:
            assert "task_id" in task
            assert "title" in task
            assert "status" in task
            assert "priority" in task
    
    def test_workflow_stages(self):
        """Test getting workflow stages"""
        response = requests.get(f"{API}/crm/workflow/stages")
        assert response.status_code == 200
        data = response.json()
        
        assert "stages" in data
        stages = data["stages"]
        assert len(stages) == 6  # discovery, analysis, strategy, presentation, implementation, review
    
    def test_client_workflow(self):
        """Test getting client workflow"""
        response = requests.get(f"{API}/crm/workflow/client_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        assert "workflow_id" in data
        assert "current_stage" in data
        assert "stages" in data
        assert "progress_percentage" in data


class TestAIScenarioGenerator:
    """Phase 4: Intelligence Layer - AI Scenario Generator"""
    
    def test_generate_scenarios(self):
        """Test AI scenario generation endpoint"""
        payload = {
            "current_net_worth": 1978000,
            "annual_income": 185000,
            "annual_expenses": 120000,
            "savings_rate": 0.15,
            "retirement_age": 60,
            "current_age": 45,
            "risk_tolerance": "moderate"
        }
        response = requests.post(f"{API}/ai/generate-scenarios", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "generated_at" in data
        assert "current_trajectory" in data
        assert "scenarios" in data
        assert "recommendation" in data
        
        # Verify scenarios
        scenarios = data["scenarios"]
        assert len(scenarios) == 3  # conservative, balanced, aggressive
        
        for scenario in scenarios:
            assert "id" in scenario
            assert "name" in scenario
            assert "parameters" in scenario
            assert "projections" in scenario
            assert "key_actions" in scenario
            assert "pros" in scenario
            assert "cons" in scenario
    
    def test_generate_scenarios_conservative(self):
        """Test AI scenario generation with conservative risk tolerance"""
        payload = {
            "current_net_worth": 1978000,
            "annual_income": 185000,
            "annual_expenses": 120000,
            "savings_rate": 0.15,
            "retirement_age": 60,
            "current_age": 45,
            "risk_tolerance": "conservative"
        }
        response = requests.post(f"{API}/ai/generate-scenarios", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify recommendation matches risk tolerance
        assert data["recommendation"]["suggested_scenario"] == "conservative"
    
    def test_generate_scenarios_aggressive(self):
        """Test AI scenario generation with aggressive risk tolerance"""
        payload = {
            "current_net_worth": 1978000,
            "annual_income": 185000,
            "annual_expenses": 120000,
            "savings_rate": 0.15,
            "retirement_age": 60,
            "current_age": 45,
            "risk_tolerance": "aggressive"
        }
        response = requests.post(f"{API}/ai/generate-scenarios", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify recommendation matches risk tolerance
        assert data["recommendation"]["suggested_scenario"] == "aggressive"


class TestMonteCarloSimulation:
    """Test Monte Carlo simulation endpoints"""
    
    def test_basic_monte_carlo(self):
        """Test basic Monte Carlo simulation"""
        response = requests.post(f"{API}/analyze/monte-carlo", params={
            "initial_value": 1978000,
            "expected_return": 0.07,
            "volatility": 0.12,
            "years": 15,
            "simulations": 1000
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "final_value_mean" in data
        assert "final_value_median" in data
        assert "probability_of_loss" in data
        assert "percentile_projections" in data


class TestTaxCalculations:
    """Test tax calculation endpoints"""
    
    def test_personal_tax(self):
        """Test personal income tax calculation"""
        response = requests.post(f"{API}/analyze/tax", params={
            "taxable_income": 185000,
            "entity_type": "personal"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "taxable_income" in data
        assert "total_tax" in data
        assert "effective_rate" in data
        assert "net_income" in data
    
    def test_tax_rates(self):
        """Test tax rates endpoint"""
        response = requests.get(f"{API}/tax-rates")
        assert response.status_code == 200
        data = response.json()
        
        assert "personal" in data
        assert "company" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
