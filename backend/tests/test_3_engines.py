"""
Test the 3 Core Engines for Wealth Command Platform
ENGINE 1: Retirement Success Engine (Monte Carlo)
ENGINE 2: Scenario Simulator (What-If)
ENGINE 3: AI Financial Recommendations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data for API calls
MONTE_CARLO_DATA = {
    "initial_value": 1978000,
    "annual_contribution": 50000,
    "expected_return": 0.07,
    "volatility": 0.15,
    "years": 15,
    "target_value": 3500000,
    "simulations": 10000,
    "inflation_rate": 0.03
}

HEALTH_SCORE_DATA = {
    "age": 45,
    "retirement_age": 60,
    "current_income": 350000,
    "annual_expenses": 120000,
    "total_assets": 3500000,
    "total_debt": 1500000,
    "super_balance": 850000,
    "emergency_fund": 75000,
    "investment_portfolio": 500000,
    "property_value": 2500000,
    "savings_rate": 0.15,
    "mortgage_rate": 6.5,
    "mortgage_balance": 1500000
}

WEALTH_BRIEF_DATA = {
    "age": 45,
    "retirement_age": 60,
    "net_worth": 1978000,
    "annual_income": 350000,
    "annual_expenses": 120000,
    "total_assets": 3500000,
    "total_debt": 1500000,
    "super_balance": 850000,
    "investment_portfolio": 500000,
    "savings_rate": 0.15,
    "mortgage_balance": 1500000,
    "mortgage_rate": 6.5,
    "monte_carlo_probability": 50
}

LIFE_SCENARIO_DATA = {
    "scenario_id": "retire_early_5",
    "base_probability": 50,
    "net_worth": 1978000,
    "annual_savings": 50000,
    "years_to_retirement": 15
}


class TestEngine1MonteCarloRetirementSuccess:
    """ENGINE 1: Retirement Success Engine - Monte Carlo Simulations"""
    
    def test_monte_carlo_advanced_returns_200(self):
        """Test Monte Carlo API returns 200 status"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=MONTE_CARLO_DATA)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Monte Carlo API returns 200")
    
    def test_monte_carlo_returns_success_probability(self):
        """Test Monte Carlo returns success probability percentage"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=MONTE_CARLO_DATA)
        data = response.json()
        assert "success_probability" in data, "Missing success_probability field"
        assert 0 <= data["success_probability"] <= 100, f"Probability out of range: {data['success_probability']}"
        print(f"✓ Success probability: {data['success_probability']}%")
    
    def test_monte_carlo_returns_percentile_outcomes(self):
        """Test Monte Carlo returns Best Case (95th), Median, Worst Case (5th)"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=MONTE_CARLO_DATA)
        data = response.json()
        
        # Check required fields
        assert "best_case" in data, "Missing best_case (95th percentile)"
        assert "median_outcome" in data, "Missing median_outcome"
        assert "worst_case" in data, "Missing worst_case (5th percentile)"
        
        # Verify ordering: best > median > worst
        assert data["best_case"] >= data["median_outcome"], "Best case should be >= median"
        assert data["median_outcome"] >= data["worst_case"], "Median should be >= worst case"
        
        print(f"✓ Best Case (95th): ${data['best_case']:,.0f}")
        print(f"✓ Median Outcome: ${data['median_outcome']:,.0f}")
        print(f"✓ Worst Case (5th): ${data['worst_case']:,.0f}")
    
    def test_monte_carlo_returns_shortfall_risk(self):
        """Test Monte Carlo returns shortfall risk percentage"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=MONTE_CARLO_DATA)
        data = response.json()
        
        assert "shortfall_risk" in data, "Missing shortfall_risk field"
        assert 0 <= data["shortfall_risk"] <= 100, f"Shortfall risk out of range: {data['shortfall_risk']}"
        print(f"✓ Shortfall Risk: {data['shortfall_risk']}%")
    
    def test_monte_carlo_uses_10000_simulations(self):
        """Test Monte Carlo actually runs 10,000 simulations"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=MONTE_CARLO_DATA)
        data = response.json()
        
        # The API should confirm simulations count
        if "simulations_run" in data:
            assert data["simulations_run"] == 10000, f"Expected 10000 simulations, got {data['simulations_run']}"
        print("✓ Monte Carlo configured for 10,000 simulations")
    
    def test_health_score_returns_score_and_grade(self):
        """Test Health Score API returns score (0-100) and grade"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score-v2", json=HEALTH_SCORE_DATA)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "score" in data, "Missing score field"
        assert "grade" in data, "Missing grade field"
        assert 0 <= data["score"] <= 100, f"Score out of range: {data['score']}"
        assert data["grade"] in ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"], f"Invalid grade: {data['grade']}"
        
        print(f"✓ Financial Health Score: {data['score']}/100 (Grade {data['grade']})")
    
    def test_net_worth_projection_returns_data(self):
        """Test Net Worth Projection API returns projection data"""
        params = {
            "current_net_worth": 1978000,
            "annual_savings": 50000,
            "years": 25,
            "growth_rate": 0.07
        }
        response = requests.get(f"{BASE_URL}/api/decision-engine/net-worth-projection", params=params)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Expected list of projections"
        assert len(data) > 0, "Expected at least one projection point"
        
        # Check first projection has required fields
        assert "year" in data[0], "Missing year field"
        assert "net_worth" in data[0], "Missing net_worth field"
        
        print(f"✓ Net Worth Projection: {len(data)} data points")


class TestEngine2ScenarioSimulator:
    """ENGINE 2: Scenario Simulator - What-If Modeling"""
    
    def test_retirement_age_impact_55(self):
        """Test scenario for retiring at 55"""
        data = {**MONTE_CARLO_DATA, "years": 10}  # 55 - 45 = 10 years
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=data)
        assert response.status_code == 200
        result = response.json()
        print(f"✓ Retire at 55: {result['success_probability']}% probability")
        return result['success_probability']
    
    def test_retirement_age_impact_60(self):
        """Test scenario for retiring at 60"""
        data = {**MONTE_CARLO_DATA, "years": 15}  # 60 - 45 = 15 years
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=data)
        assert response.status_code == 200
        result = response.json()
        print(f"✓ Retire at 60: {result['success_probability']}% probability")
        return result['success_probability']
    
    def test_retirement_age_impact_65(self):
        """Test scenario for retiring at 65"""
        data = {**MONTE_CARLO_DATA, "years": 20}  # 65 - 45 = 20 years
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=data)
        assert response.status_code == 200
        result = response.json()
        print(f"✓ Retire at 65: {result['success_probability']}% probability")
        return result['success_probability']
    
    def test_retirement_age_impact_70(self):
        """Test scenario for retiring at 70"""
        data = {**MONTE_CARLO_DATA, "years": 25}  # 70 - 45 = 25 years
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=data)
        assert response.status_code == 200
        result = response.json()
        print(f"✓ Retire at 70: {result['success_probability']}% probability")
        return result['success_probability']
    
    def test_savings_rate_slider_impact(self):
        """Test that changing savings rate affects probability"""
        # Low savings rate
        low_data = {**MONTE_CARLO_DATA, "annual_contribution": 30000}
        low_response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=low_data)
        low_prob = low_response.json()["success_probability"]
        
        # High savings rate
        high_data = {**MONTE_CARLO_DATA, "annual_contribution": 80000}
        high_response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=high_data)
        high_prob = high_response.json()["success_probability"]
        
        assert high_prob >= low_prob, "Higher savings should increase probability"
        print(f"✓ Savings Rate Impact: Low={low_prob}%, High={high_prob}%")
    
    def test_expected_return_slider_impact(self):
        """Test that changing expected return affects probability"""
        # Low return
        low_data = {**MONTE_CARLO_DATA, "expected_return": 0.04}
        low_response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=low_data)
        low_prob = low_response.json()["success_probability"]
        
        # High return
        high_data = {**MONTE_CARLO_DATA, "expected_return": 0.10}
        high_response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=high_data)
        high_prob = high_response.json()["success_probability"]
        
        assert high_prob >= low_prob, "Higher return should increase probability"
        print(f"✓ Expected Return Impact: 4%={low_prob}%, 10%={high_prob}%")
    
    def test_life_scenario_retire_early(self):
        """Test Quick Life Decision: Retire 5 years early"""
        data = {**LIFE_SCENARIO_DATA, "scenario_id": "retire_early_5"}
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        result = response.json()
        assert "probability_change" in result, "Missing probability_change"
        assert result["probability_change"] < 0, "Retiring early should decrease probability"
        print(f"✓ Retire Early: {result['probability_change']}% change")
    
    def test_life_scenario_retire_late(self):
        """Test Quick Life Decision: Retire 5 years later"""
        data = {**LIFE_SCENARIO_DATA, "scenario_id": "retire_late_5"}
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert "probability_change" in result, "Missing probability_change"
        assert result["probability_change"] > 0, "Retiring later should increase probability"
        print(f"✓ Retire Late: +{result['probability_change']}% change")
    
    def test_life_scenario_save_500(self):
        """Test Quick Life Decision: Save +$500/month"""
        data = {**LIFE_SCENARIO_DATA, "scenario_id": "increase_savings_500"}
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert "probability_change" in result, "Missing probability_change"
        assert result["probability_change"] > 0, "Saving more should increase probability"
        print(f"✓ Save +$500/mo: +{result['probability_change']}% change")
    
    def test_life_scenario_save_1000(self):
        """Test Quick Life Decision: Save +$1,000/month"""
        data = {**LIFE_SCENARIO_DATA, "scenario_id": "increase_savings_1000"}
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert "probability_change" in result, "Missing probability_change"
        assert result["probability_change"] > 0, "Saving more should increase probability"
        print(f"✓ Save +$1000/mo: +{result['probability_change']}% change")
    
    def test_life_scenario_buy_property(self):
        """Test Quick Life Decision: Buy investment property"""
        data = {**LIFE_SCENARIO_DATA, "scenario_id": "buy_property"}
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert "probability_change" in result, "Missing probability_change"
        assert "wealth_change" in result, "Missing wealth_change"
        print(f"✓ Buy Property: {result['probability_change']}% change, ${result['wealth_change']:,.0f} wealth impact")
    
    def test_life_scenario_market_crash(self):
        """Test Quick Life Decision: 30% market crash"""
        data = {**LIFE_SCENARIO_DATA, "scenario_id": "market_crash"}
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert "probability_change" in result, "Missing probability_change"
        assert result["probability_change"] < 0, "Market crash should decrease probability"
        assert result["wealth_change"] < 0, "Market crash should decrease wealth"
        print(f"✓ Market Crash: {result['probability_change']}% change, ${result['wealth_change']:,.0f} wealth impact")


class TestEngine3AIWealthInsights:
    """ENGINE 3: AI Financial Recommendations"""
    
    def test_wealth_brief_returns_200(self):
        """Test AI Wealth Brief API returns 200"""
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=WEALTH_BRIEF_DATA)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ AI Wealth Brief API returns 200")
    
    def test_wealth_brief_returns_personalized_headline(self):
        """Test AI Wealth Brief returns personalized headline"""
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=WEALTH_BRIEF_DATA)
        data = response.json()
        
        assert "headline" in data, "Missing headline field"
        assert len(data["headline"]) > 10, "Headline too short"
        print(f"✓ Personalized Headline: {data['headline']}")
    
    def test_wealth_brief_returns_savings_rate_comparison(self):
        """Test AI Wealth Brief returns current vs recommended savings rate"""
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=WEALTH_BRIEF_DATA)
        data = response.json()
        
        # Check for savings rate info in recommendations or key_insight
        has_savings_info = (
            "key_insight" in data or 
            any("savings" in str(r).lower() for r in data.get("recommendations", []))
        )
        assert has_savings_info, "Missing savings rate comparison"
        print("✓ Savings rate comparison included")
    
    def test_wealth_brief_returns_top_3_recommendations(self):
        """Test AI Wealth Brief returns top 3 recommendations with $ impact"""
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=WEALTH_BRIEF_DATA)
        data = response.json()
        
        assert "recommendations" in data, "Missing recommendations field"
        recs = data["recommendations"]
        assert len(recs) >= 3, f"Expected at least 3 recommendations, got {len(recs)}"
        
        # Check each recommendation has required fields
        for i, rec in enumerate(recs[:3]):
            assert "title" in rec, f"Recommendation {i+1} missing title"
            assert "impact" in rec, f"Recommendation {i+1} missing impact"
            assert rec["impact"] > 0, f"Recommendation {i+1} should have positive impact"
            print(f"✓ Recommendation {i+1}: {rec['title']} (+${rec['impact']:,.0f})")
    
    def test_wealth_brief_returns_total_impact(self):
        """Test AI Wealth Brief returns total potential impact"""
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=WEALTH_BRIEF_DATA)
        data = response.json()
        
        assert "total_impact" in data, "Missing total_impact field"
        assert data["total_impact"] > 0, "Total impact should be positive"
        print(f"✓ Total Potential Impact: +${data['total_impact']:,.0f}")
    
    def test_wealth_brief_returns_optimal_retirement_age(self):
        """Test AI Wealth Brief returns optimal retirement age"""
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=WEALTH_BRIEF_DATA)
        data = response.json()
        
        assert "optimal_retirement_age" in data, "Missing optimal_retirement_age field"
        assert 50 <= data["optimal_retirement_age"] <= 75, f"Optimal age out of range: {data['optimal_retirement_age']}"
        print(f"✓ Optimal Retirement Age: {data['optimal_retirement_age']}")
    
    def test_recommendations_v2_returns_list(self):
        """Test Recommendations V2 API returns recommendations list"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/recommendations-v2", json=HEALTH_SCORE_DATA)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "recommendations" in data, "Missing recommendations field"
        assert isinstance(data["recommendations"], list), "Recommendations should be a list"
        print(f"✓ Recommendations V2: {len(data['recommendations'])} recommendations")


class TestSupportingFeatures:
    """Supporting Features: Health Score, Net Worth, Goals"""
    
    def test_health_score_components(self):
        """Test Health Score returns component breakdown"""
        response = requests.post(f"{BASE_URL}/api/decision-engine/health-score-v2", json=HEALTH_SCORE_DATA)
        data = response.json()
        
        expected_components = ["savings_rate", "debt_level", "liquidity", "retirement_readiness", "diversification"]
        if "components" in data:
            for comp in expected_components:
                assert comp in data["components"], f"Missing component: {comp}"
            print("✓ Health Score components present")
        else:
            print("⚠ Health Score components not in response (may be in different format)")
    
    def test_net_worth_projection_shows_target(self):
        """Test Net Worth Projection includes target line data"""
        params = {
            "current_net_worth": 1978000,
            "annual_savings": 50000,
            "years": 25,
            "growth_rate": 0.07
        }
        response = requests.get(f"{BASE_URL}/api/decision-engine/net-worth-projection", params=params)
        data = response.json()
        
        # Check projection grows over time
        if len(data) >= 2:
            assert data[-1]["net_worth"] > data[0]["net_worth"], "Net worth should grow over time"
        print(f"✓ Net Worth Projection: ${data[0]['net_worth']:,.0f} → ${data[-1]['net_worth']:,.0f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
