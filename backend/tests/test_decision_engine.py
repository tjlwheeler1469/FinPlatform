"""
Test Decision Engine APIs - Phase 1 Features
Tests for:
- POST /api/decision-engine/health-score - Financial Health Score 0-100 with 6 dimensions
- POST /api/decision-engine/retirement-probability - Monte Carlo retirement success probability
- POST /api/decision-engine/top-actions - Top 3 prioritized actions with dollar impact
- POST /api/decision-engine/life-timeline - Year-by-year projections with milestones
- POST /api/decision-engine/complete-analysis - Combined analysis
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test profile data matching frontend mock data
TEST_PROFILE = {
    "age": 45,
    "retirement_age": 65,
    "current_income": 185000,
    "annual_expenses": 120000,
    "total_assets": 2920000,
    "total_debt": 942000,
    "super_balance": 580000,
    "investment_portfolio": 545000,
    "cash_savings": 225000,
    "property_value": 1570000,
    "property_debt": 942000,
    "savings_rate": 0.15,
    "risk_tolerance": "moderate",
    "retirement_income_target": 80000
}

# Test timeline data
TEST_TIMELINE = {
    "current_age": 45,
    "life_expectancy": 90,
    "events": [
        {"event_type": "children_education", "target_age": 52, "target_amount": 100000, "priority": "high", "description": "Children's University"},
        {"event_type": "house_upgrade", "target_age": 55, "target_amount": 200000, "priority": "medium", "description": "Home Renovation"},
        {"event_type": "retirement", "target_age": 65, "target_amount": 0, "priority": "high", "description": "Retirement"}
    ],
    "current_assets": 2920000,
    "current_debt": 942000,
    "annual_income": 185000,
    "annual_savings": 50000,
    "expected_return": 0.07,
    "inflation_rate": 0.025
}


class TestHealthScoreAPI:
    """Test Financial Health Score endpoint"""
    
    def test_health_score_returns_200(self):
        """Test health score endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score", json=TEST_PROFILE)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_health_score_returns_total_score(self):
        """Test health score returns total_score between 0-100"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score", json=TEST_PROFILE)
        data = response.json()
        
        assert "total_score" in data, "Response should contain total_score"
        assert 0 <= data["total_score"] <= 100, f"Score should be 0-100, got {data['total_score']}"
    
    def test_health_score_returns_6_dimensions(self):
        """Test health score returns 6 dimensions"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score", json=TEST_PROFILE)
        data = response.json()
        
        assert "dimensions" in data, "Response should contain dimensions"
        dimensions = data["dimensions"]
        
        expected_dimensions = ["savings_rate", "debt_management", "diversification", "retirement_readiness", "emergency_fund", "tax_efficiency"]
        for dim in expected_dimensions:
            assert dim in dimensions, f"Missing dimension: {dim}"
            assert "score" in dimensions[dim], f"Dimension {dim} should have score"
            assert "max" in dimensions[dim], f"Dimension {dim} should have max"
            assert "label" in dimensions[dim], f"Dimension {dim} should have label"
    
    def test_health_score_returns_status(self):
        """Test health score returns status and status_color"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score", json=TEST_PROFILE)
        data = response.json()
        
        assert "status" in data, "Response should contain status"
        assert "status_color" in data, "Response should contain status_color"
        assert data["status_color"] in ["green", "blue", "yellow", "red"], f"Invalid status_color: {data['status_color']}"
    
    def test_health_score_returns_metrics(self):
        """Test health score returns key metrics"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score", json=TEST_PROFILE)
        data = response.json()
        
        assert "metrics" in data, "Response should contain metrics"
        metrics = data["metrics"]
        
        expected_metrics = ["debt_to_asset_ratio", "savings_rate", "emergency_fund_months"]
        for metric in expected_metrics:
            assert metric in metrics, f"Missing metric: {metric}"


class TestRetirementProbabilityAPI:
    """Test Retirement Probability endpoint (Monte Carlo)"""
    
    def test_retirement_probability_returns_200(self):
        """Test retirement probability endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/retirement-probability", json=TEST_PROFILE)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_retirement_probability_returns_success_probability(self):
        """Test retirement probability returns success_probability 0-100"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/retirement-probability", json=TEST_PROFILE)
        data = response.json()
        
        assert "success_probability" in data, "Response should contain success_probability"
        assert 0 <= data["success_probability"] <= 100, f"Probability should be 0-100, got {data['success_probability']}"
    
    def test_retirement_probability_returns_projections(self):
        """Test retirement probability returns projections"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/retirement-probability", json=TEST_PROFILE)
        data = response.json()
        
        assert "projections" in data, "Response should contain projections"
        projections = data["projections"]
        
        assert "median_final_balance" in projections, "Projections should have median_final_balance"
        assert "p10_final_balance" in projections, "Projections should have p10_final_balance"
        assert "p90_final_balance" in projections, "Projections should have p90_final_balance"
    
    def test_retirement_probability_returns_status(self):
        """Test retirement probability returns status"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/retirement-probability", json=TEST_PROFILE)
        data = response.json()
        
        assert "status" in data, "Response should contain status"
        assert "status_color" in data, "Response should contain status_color"
        assert "recommendation" in data, "Response should contain recommendation"


class TestTopActionsAPI:
    """Test Top Actions endpoint"""
    
    def test_top_actions_returns_200(self):
        """Test top actions endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/top-actions", json=TEST_PROFILE)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_top_actions_returns_actions_list(self):
        """Test top actions returns list of actions"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/top-actions", json=TEST_PROFILE)
        data = response.json()
        
        assert "actions" in data, "Response should contain actions"
        assert isinstance(data["actions"], list), "Actions should be a list"
        assert len(data["actions"]) >= 3, f"Should have at least 3 actions, got {len(data['actions'])}"
    
    def test_top_actions_have_required_fields(self):
        """Test each action has required fields"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/top-actions", json=TEST_PROFILE)
        data = response.json()
        
        for action in data["actions"][:3]:  # Check top 3
            assert "rank" in action, "Action should have rank"
            assert "title" in action, "Action should have title"
            assert "description" in action, "Action should have description"
            assert "impact_text" in action, "Action should have impact_text"
            assert "category" in action, "Action should have category"
            assert "effort" in action, "Action should have effort"
            assert "timeframe" in action, "Action should have timeframe"
    
    def test_top_actions_are_ranked(self):
        """Test actions are properly ranked 1, 2, 3..."""
        response = requests.post(f"{BASE_URL}/api/decision-engine/top-actions", json=TEST_PROFILE)
        data = response.json()
        
        ranks = [action["rank"] for action in data["actions"]]
        assert ranks == sorted(ranks), "Actions should be sorted by rank"
        assert ranks[0] == 1, "First action should have rank 1"


class TestLifeTimelineAPI:
    """Test Life Timeline endpoint"""
    
    def test_life_timeline_returns_200(self):
        """Test life timeline endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/life-timeline", json=TEST_TIMELINE)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_life_timeline_returns_projections(self):
        """Test life timeline returns year-by-year projections"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/life-timeline", json=TEST_TIMELINE)
        data = response.json()
        
        assert "projections" in data, "Response should contain projections"
        assert isinstance(data["projections"], list), "Projections should be a list"
        assert len(data["projections"]) > 0, "Should have projections"
        
        # Check first projection has required fields
        first = data["projections"][0]
        assert "age" in first, "Projection should have age"
        assert "year" in first, "Projection should have year"
        assert "net_worth" in first, "Projection should have net_worth"
    
    def test_life_timeline_returns_milestones(self):
        """Test life timeline returns milestones"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/life-timeline", json=TEST_TIMELINE)
        data = response.json()
        
        assert "milestones" in data, "Response should contain milestones"
        assert isinstance(data["milestones"], list), "Milestones should be a list"
    
    def test_life_timeline_returns_summary(self):
        """Test life timeline returns summary"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/life-timeline", json=TEST_TIMELINE)
        data = response.json()
        
        assert "summary" in data, "Response should contain summary"
        summary = data["summary"]
        
        assert "current_net_worth" in summary, "Summary should have current_net_worth"
        assert "projected_retirement_net_worth" in summary, "Summary should have projected_retirement_net_worth"


class TestCompleteAnalysisAPI:
    """Test Complete Analysis endpoint (combined)"""
    
    def test_complete_analysis_returns_200(self):
        """Test complete analysis endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/complete-analysis", json=TEST_PROFILE)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_complete_analysis_returns_health_score(self):
        """Test complete analysis includes health_score"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/complete-analysis", json=TEST_PROFILE)
        data = response.json()
        
        assert "health_score" in data, "Response should contain health_score"
        assert "total_score" in data["health_score"], "health_score should have total_score"
        assert "dimensions" in data["health_score"], "health_score should have dimensions"
    
    def test_complete_analysis_returns_retirement_probability(self):
        """Test complete analysis includes retirement_probability"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/complete-analysis", json=TEST_PROFILE)
        data = response.json()
        
        assert "retirement_probability" in data, "Response should contain retirement_probability"
        assert "success_probability" in data["retirement_probability"], "retirement_probability should have success_probability"
    
    def test_complete_analysis_returns_top_actions(self):
        """Test complete analysis includes top_actions"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/complete-analysis", json=TEST_PROFILE)
        data = response.json()
        
        assert "top_actions" in data, "Response should contain top_actions"
        assert isinstance(data["top_actions"], list), "top_actions should be a list"
        assert len(data["top_actions"]) >= 3, "Should have at least 3 actions"
    
    def test_complete_analysis_returns_generated_at(self):
        """Test complete analysis includes timestamp"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/complete-analysis", json=TEST_PROFILE)
        data = response.json()
        
        assert "generated_at" in data, "Response should contain generated_at timestamp"


class TestEdgeCases:
    """Test edge cases and validation"""
    
    def test_health_score_with_zero_assets(self):
        """Test health score handles zero assets"""
        profile = TEST_PROFILE.copy()
        profile["total_assets"] = 0
        profile["total_debt"] = 0
        
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score", json=profile)
        assert response.status_code == 200, f"Should handle zero assets: {response.text}"
    
    def test_retirement_probability_with_high_savings(self):
        """Test retirement probability with high savings rate"""
        profile = TEST_PROFILE.copy()
        profile["savings_rate"] = 0.40
        
        response = requests.post(f"{BASE_URL}/api/decision-engine/retirement-probability", json=profile)
        assert response.status_code == 200
        data = response.json()
        assert data["success_probability"] > 50, "High savings should have good probability"
    
    def test_life_timeline_with_no_events(self):
        """Test life timeline with empty events list"""
        timeline = TEST_TIMELINE.copy()
        timeline["events"] = []
        
        response = requests.post(f"{BASE_URL}/api/decision-engine/life-timeline", json=timeline)
        assert response.status_code == 200, f"Should handle empty events: {response.text}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
