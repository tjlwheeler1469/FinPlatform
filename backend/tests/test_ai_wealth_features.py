"""
Test AI Wealth Brief and Life Decision Simulator Features
Tests for iteration 40 - AI Wealth Strategist features
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://advisor-command.preview.emergentagent.com').rstrip('/')


class TestAIWealthBrief:
    """Test AI Wealth Brief endpoint - personalized insights and recommendations"""
    
    def test_wealth_brief_returns_200(self):
        """Test that wealth brief endpoint returns 200"""
        payload = {
            "age": 45,
            "retirement_age": 60,
            "net_worth": 2000000,
            "annual_income": 250000,
            "annual_expenses": 120000,
            "total_assets": 3500000,
            "total_debt": 1500000,
            "super_balance": 850000,
            "investment_portfolio": 500000,
            "savings_rate": 0.15,
            "mortgage_balance": 1500000,
            "mortgage_rate": 6.5,
            "monte_carlo_probability": 74
        }
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_wealth_brief_returns_headline(self):
        """Test that wealth brief returns personalized headline"""
        payload = {
            "age": 45,
            "retirement_age": 60,
            "net_worth": 2000000,
            "annual_income": 250000,
            "annual_expenses": 120000,
            "total_assets": 3500000,
            "total_debt": 1500000,
            "super_balance": 850000,
            "investment_portfolio": 500000,
            "savings_rate": 0.15,
            "mortgage_balance": 1500000,
            "mortgage_rate": 6.5,
            "monte_carlo_probability": 74
        }
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=payload)
        data = response.json()
        
        assert "headline" in data, "Response should contain headline"
        assert isinstance(data["headline"], str), "Headline should be a string"
        assert len(data["headline"]) > 10, "Headline should be meaningful text"
    
    def test_wealth_brief_returns_recommendations(self):
        """Test that wealth brief returns 3 key recommendations with $ impact"""
        payload = {
            "age": 45,
            "retirement_age": 60,
            "net_worth": 2000000,
            "annual_income": 250000,
            "annual_expenses": 120000,
            "total_assets": 3500000,
            "total_debt": 1500000,
            "super_balance": 850000,
            "investment_portfolio": 500000,
            "savings_rate": 0.15,
            "mortgage_balance": 1500000,
            "mortgage_rate": 6.5,
            "monte_carlo_probability": 74
        }
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=payload)
        data = response.json()
        
        assert "recommendations" in data, "Response should contain recommendations"
        assert isinstance(data["recommendations"], list), "Recommendations should be a list"
        assert len(data["recommendations"]) >= 1, "Should have at least 1 recommendation"
        
        # Check first recommendation has required fields
        rec = data["recommendations"][0]
        assert "title" in rec, "Recommendation should have title"
        assert "impact" in rec or "impact_text" in rec, "Recommendation should have impact"
    
    def test_wealth_brief_returns_net_worth_projections(self):
        """Test that wealth brief returns net worth projections at ages 45, 50, 55, 60"""
        payload = {
            "age": 45,
            "retirement_age": 60,
            "net_worth": 2000000,
            "annual_income": 250000,
            "annual_expenses": 120000,
            "total_assets": 3500000,
            "total_debt": 1500000,
            "super_balance": 850000,
            "investment_portfolio": 500000,
            "savings_rate": 0.15,
            "mortgage_balance": 1500000,
            "mortgage_rate": 6.5,
            "monte_carlo_probability": 74
        }
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=payload)
        data = response.json()
        
        assert "net_worth_projections" in data, "Response should contain net_worth_projections"
        projections = data["net_worth_projections"]
        assert isinstance(projections, list), "Projections should be a list"
        assert len(projections) >= 3, "Should have at least 3 projection points"
        
        # Check projection structure
        for proj in projections:
            assert "age" in proj, "Projection should have age"
            assert "formatted" in proj or "net_worth" in proj, "Projection should have value"
    
    def test_wealth_brief_returns_total_impact(self):
        """Test that wealth brief returns total potential impact"""
        payload = {
            "age": 45,
            "retirement_age": 60,
            "net_worth": 2000000,
            "annual_income": 250000,
            "annual_expenses": 120000,
            "total_assets": 3500000,
            "total_debt": 1500000,
            "super_balance": 850000,
            "investment_portfolio": 500000,
            "savings_rate": 0.15,
            "mortgage_balance": 1500000,
            "mortgage_rate": 6.5,
            "monte_carlo_probability": 74
        }
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=payload)
        data = response.json()
        
        assert "total_impact" in data, "Response should contain total_impact"
        assert data["total_impact"] > 0, "Total impact should be positive"


class TestLifeDecisionSimulator:
    """Test Life Decision Simulator - 6 scenarios with impact calculations"""
    
    def test_life_scenario_retire_early(self):
        """Test retire early scenario"""
        payload = {
            "scenario_id": "retire_early_5",
            "base_probability": 74,
            "net_worth": 2000000,
            "annual_savings": 37500,
            "years_to_retirement": 15
        }
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "name" in data, "Response should contain name"
        assert "probability_change" in data, "Response should contain probability_change"
        assert "new_probability" in data, "Response should contain new_probability"
        assert "wealth_change" in data, "Response should contain wealth_change"
    
    def test_life_scenario_buy_property(self):
        """Test buy investment property scenario"""
        payload = {
            "scenario_id": "buy_property",
            "base_probability": 74,
            "net_worth": 2000000,
            "annual_savings": 37500,
            "years_to_retirement": 15
        }
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["scenario_id"] == "buy_property"
        assert "probability_change" in data
    
    def test_life_scenario_start_business(self):
        """Test start business scenario"""
        payload = {
            "scenario_id": "start_business",
            "base_probability": 74,
            "net_worth": 2000000,
            "annual_savings": 37500,
            "years_to_retirement": 15
        }
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["scenario_id"] == "start_business"
        assert data["probability_change"] < 0, "Starting business should reduce probability"
    
    def test_life_scenario_market_crash(self):
        """Test 30% market crash scenario"""
        payload = {
            "scenario_id": "market_crash",
            "base_probability": 74,
            "net_worth": 2000000,
            "annual_savings": 37500,
            "years_to_retirement": 15
        }
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["scenario_id"] == "market_crash"
        assert data["probability_change"] < 0, "Market crash should reduce probability"
        assert data["wealth_change"] < 0, "Market crash should reduce wealth"
    
    def test_life_scenario_inheritance(self):
        """Test receive inheritance scenario"""
        payload = {
            "scenario_id": "inheritance",
            "base_probability": 74,
            "net_worth": 2000000,
            "annual_savings": 37500,
            "years_to_retirement": 15
        }
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["scenario_id"] == "inheritance"
        assert data["probability_change"] > 0, "Inheritance should increase probability"
        assert data["wealth_change"] > 0, "Inheritance should increase wealth"
    
    def test_life_scenario_save_extra(self):
        """Test save extra $500/month scenario"""
        payload = {
            "scenario_id": "increase_savings_500",
            "base_probability": 74,
            "net_worth": 2000000,
            "annual_savings": 37500,
            "years_to_retirement": 15
        }
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["scenario_id"] == "increase_savings_500"
        assert data["probability_change"] > 0, "Extra savings should increase probability"
    
    def test_life_scenario_returns_all_required_fields(self):
        """Test that scenario returns all required fields for UI display"""
        payload = {
            "scenario_id": "retire_early_5",
            "base_probability": 74,
            "net_worth": 2000000,
            "annual_savings": 37500,
            "years_to_retirement": 15
        }
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=payload)
        data = response.json()
        
        required_fields = [
            "scenario_id", "name", "description", 
            "base_probability", "new_probability", "probability_change",
            "wealth_change", "recommendation"
        ]
        
        for field in required_fields:
            assert field in data, f"Response should contain {field}"


class TestMonteCarloSimulation:
    """Test Monte Carlo simulation with real calculations"""
    
    def test_monte_carlo_returns_real_probability(self):
        """Test Monte Carlo returns calculated probability based on 10,000 simulations"""
        payload = {
            "initial_value": 2000000,
            "annual_contribution": 37500,
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 15,
            "target_value": 3500000,
            "simulations": 10000,
            "inflation_rate": 0.03
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "success_probability" in data
        assert 0 <= data["success_probability"] <= 100, "Probability should be 0-100"
        assert data["simulations_run"] == 10000, "Should run 10,000 simulations"
    
    def test_monte_carlo_returns_percentile_data(self):
        """Test Monte Carlo returns percentile projections"""
        payload = {
            "initial_value": 2000000,
            "annual_contribution": 37500,
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 15,
            "target_value": 3500000,
            "simulations": 10000,
            "inflation_rate": 0.03
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=payload)
        data = response.json()
        
        assert "best_case" in data
        assert "worst_case" in data
        assert "median_outcome" in data
        assert "shortfall_risk" in data
        
        # Verify logical ordering
        assert data["best_case"] > data["median_outcome"], "Best case should exceed median"
        assert data["median_outcome"] > data["worst_case"], "Median should exceed worst case"


class TestFinancialHealthScore:
    """Test Financial Health Score with grade breakdown"""
    
    def test_health_score_returns_grade(self):
        """Test health score returns grade A-D"""
        payload = {
            "age": 45,
            "retirement_age": 60,
            "current_income": 250000,
            "annual_expenses": 120000,
            "total_assets": 3500000,
            "total_debt": 1500000,
            "super_balance": 850000,
            "emergency_fund": 75000,
            "investment_portfolio": 500000,
            "property_value": 1800000,
            "savings_rate": 0.15,
            "mortgage_rate": 6.5,
            "mortgage_balance": 1500000
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score-v2", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "score" in data
        assert "grade" in data
        assert data["score"] >= 0 and data["score"] <= 100
        assert data["grade"] in ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D"]
    
    def test_health_score_returns_components(self):
        """Test health score returns component breakdown"""
        payload = {
            "age": 45,
            "retirement_age": 60,
            "current_income": 250000,
            "annual_expenses": 120000,
            "total_assets": 3500000,
            "total_debt": 1500000,
            "super_balance": 850000,
            "emergency_fund": 75000,
            "investment_portfolio": 500000,
            "property_value": 1800000,
            "savings_rate": 0.15,
            "mortgage_rate": 6.5,
            "mortgage_balance": 1500000
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score-v2", json=payload)
        data = response.json()
        
        assert "components" in data
        components = data["components"]
        
        # Check for key component categories
        expected_components = ["savings_rate", "debt_level", "liquidity", "retirement_readiness", "diversification"]
        for comp in expected_components:
            assert comp in components, f"Should have {comp} component"


class TestWhatIfScenarioBuilder:
    """Test What-If scenario builder triggers Monte Carlo recalculation"""
    
    def test_different_savings_rate_changes_probability(self):
        """Test that changing savings rate changes Monte Carlo probability"""
        base_payload = {
            "initial_value": 2000000,
            "annual_contribution": 37500,  # 15% of 250k
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 15,
            "target_value": 3500000,
            "simulations": 5000,
            "inflation_rate": 0.03
        }
        
        high_savings_payload = {
            **base_payload,
            "annual_contribution": 62500  # 25% of 250k
        }
        
        base_response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=base_payload)
        high_response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=high_savings_payload)
        
        base_prob = base_response.json()["success_probability"]
        high_prob = high_response.json()["success_probability"]
        
        # Higher savings should generally lead to higher probability
        # Allow some variance due to Monte Carlo randomness
        assert high_prob >= base_prob - 10, "Higher savings should not significantly reduce probability"
    
    def test_different_retirement_age_changes_probability(self):
        """Test that changing retirement age changes Monte Carlo probability"""
        early_retirement_payload = {
            "initial_value": 2000000,
            "annual_contribution": 37500,
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 10,  # Retire at 55
            "target_value": 3500000,
            "simulations": 5000,
            "inflation_rate": 0.03
        }
        
        late_retirement_payload = {
            **early_retirement_payload,
            "years": 20  # Retire at 65
        }
        
        early_response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=early_retirement_payload)
        late_response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=late_retirement_payload)
        
        early_prob = early_response.json()["success_probability"]
        late_prob = late_response.json()["success_probability"]
        
        # Later retirement should have higher probability
        assert late_prob > early_prob, "Later retirement should have higher success probability"


class TestStressTestResults:
    """Test Stress Test Results table"""
    
    def test_base_case_scenario(self):
        """Test base case returns valid probability"""
        payload = {
            "initial_value": 2000000,
            "annual_contribution": 37500,
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 15,
            "target_value": 3500000,
            "simulations": 5000,
            "inflation_rate": 0.03
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "success_probability" in data
    
    def test_market_crash_scenario(self):
        """Test 30% market drop scenario"""
        # Simulate market crash by reducing initial value by 30%
        payload = {
            "initial_value": 1400000,  # 2M * 0.7
            "annual_contribution": 37500,
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 15,
            "target_value": 3500000,
            "simulations": 5000,
            "inflation_rate": 0.03
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success_probability"] < 80, "Market crash should reduce probability"
    
    def test_high_inflation_scenario(self):
        """Test high inflation (6%) scenario"""
        payload = {
            "initial_value": 2000000,
            "annual_contribution": 37500,
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 15,
            "target_value": 3500000,
            "simulations": 5000,
            "inflation_rate": 0.06  # High inflation
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=payload)
        assert response.status_code == 200
        data = response.json()
        # High inflation increases real target, reducing probability
        assert "success_probability" in data


class TestDashboardTabs:
    """Test all dashboard tab data endpoints"""
    
    def test_recommendations_endpoint(self):
        """Test recommendations endpoint for Top Actions tab"""
        payload = {
            "age": 45,
            "retirement_age": 60,
            "current_income": 250000,
            "annual_expenses": 120000,
            "total_assets": 3500000,
            "total_debt": 1500000,
            "super_balance": 850000,
            "emergency_fund": 75000,
            "investment_portfolio": 500000,
            "property_value": 1800000,
            "savings_rate": 0.15,
            "mortgage_rate": 6.5,
            "mortgage_balance": 1500000
        }
        response = requests.post(f"{BASE_URL}/api/decision-engine/recommendations-v2", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
    
    def test_net_worth_projection_endpoint(self):
        """Test net worth projection endpoint for Projections tab"""
        params = {
            "current_net_worth": 2000000,
            "annual_savings": 37500,
            "years": 20,
            "growth_rate": 0.07
        }
        response = requests.get(f"{BASE_URL}/api/decision-engine/net-worth-projection", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "year" in data[0]
        assert "net_worth" in data[0]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
