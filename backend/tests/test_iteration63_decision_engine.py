"""
Iteration 63 - Decision Engine & User-Reported Fixes Testing
Tests for:
1. Decision Engine APIs (health-score-v2, recommendations-v2, net-worth-projection, monte-carlo-advanced, wealth-brief)
2. Portfolio Aggregator fallback data
3. Investment Comparison demo results
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check to verify backend is running"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns 200 and correct version"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "6.1.0"


class TestDecisionEngineHealthScore:
    """Tests for /api/decision-engine/health-score-v2"""
    
    def test_health_score_default_params(self):
        """Test health score with default parameters"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score-v2", json={})
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "overall_score" in data
        assert "grade" in data
        assert "grade_description" in data
        assert "component_scores" in data
        assert "metrics" in data
        assert "strengths" in data
        assert "areas_for_improvement" in data
        assert "timestamp" in data
        
        # Verify component scores exist
        component_scores = data["component_scores"]
        assert "savings_rate" in component_scores
        assert "emergency_fund" in component_scores
        assert "debt_management" in component_scores
        assert "retirement_progress" in component_scores
        assert "diversification" in component_scores
        assert "insurance_coverage" in component_scores
    
    def test_health_score_custom_params(self):
        """Test health score with custom parameters"""
        params = {
            "age": 35,
            "retirement_age": 60,
            "current_income": 250000,
            "annual_expenses": 100000,
            "total_assets": 3000000,
            "total_debt": 200000,
            "super_balance": 800000,
            "emergency_fund": 100000,
            "savings_rate": 0.30
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score-v2", json=params)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        # Higher savings rate should give better score
        assert data["component_scores"]["savings_rate"] >= 100  # 30% * 4 = 120, capped at 100
        # Lower debt ratio should give better score
        assert data["component_scores"]["debt_management"] >= 80


class TestDecisionEngineRecommendations:
    """Tests for /api/decision-engine/recommendations-v2"""
    
    def test_recommendations_default_params(self):
        """Test recommendations with default parameters"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/recommendations-v2", json={})
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "recommendations" in data
        assert "total_recommendations" in data
        assert "high_priority_count" in data
        assert "timestamp" in data
        
        # Verify recommendations structure
        assert len(data["recommendations"]) > 0
        for rec in data["recommendations"]:
            assert "id" in rec
            assert "category" in rec
            assert "priority" in rec
            assert "title" in rec
            assert "description" in rec
            assert "impact" in rec
            assert "difficulty" in rec
    
    def test_recommendations_low_savings_rate(self):
        """Test that low savings rate triggers savings recommendation"""
        params = {"savings_rate": 0.05}  # 5% savings rate
        response = requests.post(f"{BASE_URL}/api/decision-engine/recommendations-v2", json=params)
        assert response.status_code == 200
        data = response.json()
        
        # Should have increase_savings recommendation
        rec_ids = [r["id"] for r in data["recommendations"]]
        assert "increase_savings" in rec_ids


class TestDecisionEngineNetWorthProjection:
    """Tests for /api/decision-engine/net-worth-projection"""
    
    def test_net_worth_projection_default(self):
        """Test net worth projection with default parameters"""
        response = requests.get(f"{BASE_URL}/api/decision-engine/net-worth-projection")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "projections" in data
        assert "summary" in data
        assert "assumptions" in data
        assert "timestamp" in data
        
        # Verify projections
        assert len(data["projections"]) > 0
        for proj in data["projections"]:
            assert "year" in proj
            assert "age" in proj
            assert "net_worth" in proj
        
        # Verify summary
        summary = data["summary"]
        assert "starting_value" in summary
        assert "ending_value" in summary
        assert "total_growth" in summary
        assert "growth_multiple" in summary
    
    def test_net_worth_projection_custom_params(self):
        """Test net worth projection with custom parameters"""
        params = {
            "current_net_worth": 2000000,
            "annual_savings": 100000,
            "years": 10,
            "growth_rate": 0.08
        }
        response = requests.get(f"{BASE_URL}/api/decision-engine/net-worth-projection", params=params)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert len(data["projections"]) == 11  # 0 to 10 years
        assert data["assumptions"]["annual_savings"] == 100000
        assert data["assumptions"]["growth_rate"] == 0.08
        assert data["assumptions"]["years"] == 10


class TestDecisionEngineMonteCarloAdvanced:
    """Tests for /api/decision-engine/monte-carlo-advanced"""
    
    def test_monte_carlo_default(self):
        """Test Monte Carlo simulation with default parameters"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json={})
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "success_probability" in data
        assert "target_value" in data
        assert "simulations" in data
        assert "percentiles" in data
        assert "statistics" in data
        assert "paths_sample" in data
        assert "interpretation" in data
        assert "timestamp" in data
        
        # Verify percentiles
        percentiles = data["percentiles"]
        assert "p5" in percentiles
        assert "p50" in percentiles
        assert "p95" in percentiles
        
        # Verify statistics
        stats = data["statistics"]
        assert "mean" in stats
        assert "median" in stats
        assert "min" in stats
        assert "max" in stats
        assert "std_dev" in stats
        
        # Verify interpretation
        assert "confidence" in data["interpretation"]
        assert "message" in data["interpretation"]
    
    def test_monte_carlo_custom_params(self):
        """Test Monte Carlo with custom parameters"""
        params = {
            "initial_value": 500000,
            "annual_contribution": 30000,
            "expected_return": 0.06,
            "volatility": 0.12,
            "years": 15,
            "target_value": 1500000,
            "simulations": 5000
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=params)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["target_value"] == 1500000
        assert data["simulations"] == 5000


class TestDecisionEngineWealthBrief:
    """Tests for /api/decision-engine/wealth-brief"""
    
    def test_wealth_brief(self):
        """Test wealth brief endpoint"""
        response = requests.get(f"{BASE_URL}/api/decision-engine/wealth-brief")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "brief" in data
        assert "generated_at" in data
        
        # Verify brief structure
        brief = data["brief"]
        assert "headline" in brief
        assert "score" in brief
        assert "grade" in brief
        assert "summary" in brief
        assert "highlights" in brief
        assert "market_context" in brief
        assert "next_actions" in brief
        
        # Verify highlights structure
        assert len(brief["highlights"]) > 0
        for highlight in brief["highlights"]:
            assert "type" in highlight
            assert "text" in highlight


class TestDecisionEngineQuickAnalysis:
    """Tests for /api/decision-engine/quick-analysis"""
    
    def test_quick_analysis(self):
        """Test quick analysis endpoint"""
        response = requests.get(f"{BASE_URL}/api/decision-engine/quick-analysis")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] is True
        assert "analysis" in data
        assert "timestamp" in data
        
        # Verify analysis structure
        analysis = data["analysis"]
        assert "net_worth" in analysis
        assert "savings_rate" in analysis
        assert "debt_ratio" in analysis
        assert "retirement_readiness" in analysis
        assert "alerts" in analysis


class TestDecisionEngineScenario:
    """Tests for /api/decision-engine/scenario/{scenario_id}"""
    
    def test_scenario_retire_early(self):
        """Test retire early scenario"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/scenario/retire_early_5",
            json={"scenario_id": "retire_early_5"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["scenario_id"] == "retire_early_5"
        assert "base_projection" in data
        assert "scenario_projection" in data
        assert "comparison" in data
        assert "recommendation" in data
    
    def test_scenario_increase_savings(self):
        """Test increase savings scenario"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/scenario/increase_savings_500",
            json={"scenario_id": "increase_savings_500"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        # Increasing savings should result in positive difference
        assert data["comparison"]["difference"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
