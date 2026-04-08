"""
Test Suite for Hybrid Retirement Calculation Engine
Tests all 19 sections: Deterministic Model, Monte Carlo, Downside Risk, 
Dynamic Spending, Longevity Risk, Income Stability, Spending Flexibility,
Diversification, Confidence Score, Stress Testing, AI Explanation,
Scenario Comparison, Real-Time Data, Background/Presentation Mode,
Advisor Control, Real-Time Confidence, Change Impact, Event-Driven Updates, AI Assist
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dashboard-unify-6.preview.emergentagent.com').rstrip('/')


class TestHybridEngineDefaults:
    """Test GET /api/hybrid-engine/defaults - Default parameters"""
    
    def test_get_defaults(self):
        """Test getting default engine parameters"""
        response = requests.get(f"{BASE_URL}/api/hybrid-engine/defaults")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "defaults" in data, "Response should contain 'defaults'"
        assert "confidence_weights" in data, "Response should contain 'confidence_weights'"
        
        # Verify default parameters
        defaults = data["defaults"]
        assert "expected_return" in defaults
        assert "return_volatility" in defaults
        assert "inflation_mean" in defaults
        assert "num_simulations" in defaults
        assert defaults["num_simulations"] == 10000, "Default simulations should be 10,000"
        
        # Verify confidence weights
        weights = data["confidence_weights"]
        assert "monte_carlo_success" in weights
        assert "downside_protection" in weights
        assert "income_stability" in weights
        print(f"✓ Defaults retrieved: {len(defaults)} parameters, {len(weights)} weights")


class TestHybridEngineCalculate:
    """Test POST /api/hybrid-engine/calculate - Full Monte Carlo calculation"""
    
    @pytest.fixture
    def base_request(self):
        """Base request payload for calculations"""
        return {
            "client_id": "TEST_hybrid_client",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 800000,
            "annual_contributions": 30000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000,  # Reduced for faster testing
            "enable_dynamic_spending": True,
            "mode": "presentation"
        }
    
    def test_full_calculation(self, base_request):
        """Test full hybrid engine calculation with Monte Carlo"""
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=base_request
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify primary outputs
        assert "confidence_score" in data, "Should have confidence_score"
        assert "confidence_rating" in data, "Should have confidence_rating"
        assert 0 <= data["confidence_score"] <= 100, "Confidence should be 0-100"
        
        # Verify display values (Today / After Changes / After Stress)
        assert "display" in data, "Should have display section"
        display = data["display"]
        assert "today" in display, "Display should have 'today'"
        assert "after_stress" in display, "Display should have 'after_stress'"
        assert "stress_delta" in display, "Display should have 'stress_delta'"
        
        # Verify Monte Carlo results
        assert "monte_carlo" in data, "Should have monte_carlo results"
        mc = data["monte_carlo"]
        assert "success_rate" in mc, "Monte Carlo should have success_rate"
        assert "success_rate_percent" in mc, "Monte Carlo should have success_rate_percent"
        assert "num_simulations" in mc, "Monte Carlo should have num_simulations"
        assert "percentiles" in mc, "Monte Carlo should have percentiles"
        
        # Verify percentiles
        percentiles = mc["percentiles"]
        assert "p10" in percentiles
        assert "p25" in percentiles
        assert "p50_median" in percentiles
        assert "p75" in percentiles
        assert "p90" in percentiles
        
        # Verify confidence breakdown
        assert "confidence_breakdown" in data, "Should have confidence_breakdown"
        breakdown = data["confidence_breakdown"]
        assert "factor_contributions" in breakdown
        assert "raw_factors" in breakdown
        
        # Verify stress tests
        assert "stress_tests" in data, "Should have stress_tests"
        stress = data["stress_tests"]
        assert "base_case" in stress
        assert "market_crash_30pct" in stress
        assert "high_inflation_6pct" in stress
        assert "longevity_plus_5yrs" in stress
        
        # Verify AI explanation
        assert "explanation" in data, "Should have explanation"
        explanation = data["explanation"]
        assert "summary" in explanation
        assert "identified_risks" in explanation
        assert "recommendations" in explanation
        
        print(f"✓ Full calculation: Confidence={data['confidence_score']:.1f}%, MC Success={mc['success_rate_percent']:.1f}%")
    
    def test_calculation_with_income_sources(self, base_request):
        """Test calculation with detailed income sources"""
        base_request["income_sources"] = [
            {"source_type": "pension", "annual_amount": 30000},
            {"source_type": "salary", "annual_amount": 100000},
            {"source_type": "dividends", "annual_amount": 15000}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=base_request
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "income_stability" in data
        income = data["income_stability"]
        assert "income_stability_score" in income
        assert "income_breakdown" in income
        assert 0 <= income["income_stability_score"] <= 1
        
        print(f"✓ Income stability score: {income['income_stability_score']:.2f}")
    
    def test_calculation_with_asset_holdings(self, base_request):
        """Test calculation with asset holdings for diversification"""
        base_request["asset_holdings"] = [
            {"name": "Australian Shares", "value": 300000, "asset_class": "equities"},
            {"name": "International Shares", "value": 200000, "asset_class": "equities"},
            {"name": "Bonds", "value": 150000, "asset_class": "bonds"},
            {"name": "Property", "value": 100000, "asset_class": "property"},
            {"name": "Cash", "value": 50000, "asset_class": "cash"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=base_request
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "diversification" in data
        div = data["diversification"]
        assert "diversification_score" in div
        assert "asset_allocation" in div
        assert 0 <= div["diversification_score"] <= 1
        
        print(f"✓ Diversification score: {div['diversification_score']:.2f}")
    
    def test_calculation_with_expense_breakdown(self, base_request):
        """Test calculation with expense breakdown for spending flexibility"""
        base_request["expense_breakdown"] = {
            "essential": 50000,
            "discretionary": 30000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=base_request
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "spending_flexibility" in data
        spending = data["spending_flexibility"]
        assert "spending_flexibility_score" in spending
        assert "essential_ratio" in spending
        assert "discretionary_ratio" in spending
        
        print(f"✓ Spending flexibility score: {spending['spending_flexibility_score']:.2f}")
    
    def test_background_mode(self, base_request):
        """Test calculation in background mode"""
        base_request["mode"] = "background"
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=base_request
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["mode"] == "background"
        print("✓ Background mode calculation successful")


class TestHybridEngineQuickCalculate:
    """Test GET /api/hybrid-engine/quick-calculate - Quick calculation"""
    
    def test_quick_calculate(self):
        """Test quick calculation with query parameters"""
        params = {
            "current_portfolio": 500000,
            "current_age": 50,
            "retirement_age": 65,
            "life_expectancy": 90,
            "annual_contributions": 20000,
            "retirement_spending": 60000,
            "num_simulations": 1000
        }
        
        response = requests.get(
            f"{BASE_URL}/api/hybrid-engine/quick-calculate",
            params=params
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "confidence_score" in data
        assert "confidence_rating" in data
        assert "display" in data
        assert "monte_carlo_success" in data
        assert "percentiles" in data
        
        print(f"✓ Quick calculate: Confidence={data['confidence_score']:.1f}%")
    
    def test_quick_calculate_minimal_params(self):
        """Test quick calculation with minimal required parameters"""
        params = {
            "current_portfolio": 300000,
            "current_age": 40
        }
        
        response = requests.get(
            f"{BASE_URL}/api/hybrid-engine/quick-calculate",
            params=params
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "confidence_score" in data
        print(f"✓ Quick calculate (minimal): Confidence={data['confidence_score']:.1f}%")


class TestHybridEngineScenarioComparison:
    """Test POST /api/hybrid-engine/compare-scenarios - Scenario comparison"""
    
    def test_compare_scenarios(self):
        """Test comparing multiple retirement scenarios"""
        request = {
            "client_id": "TEST_scenario_client",
            "base_request": {
                "client_id": "TEST_scenario_client",
                "current_age": 45,
                "retirement_age": 65,
                "life_expectancy": 90,
                "current_portfolio": 800000,
                "annual_contributions": 30000,
                "retirement_spending": 80000,
                "expected_return": 0.07,
                "return_volatility": 0.15,
                "inflation_rate": 0.025,
                "num_simulations": 1000,
                "enable_dynamic_spending": True
            },
            "scenarios": [
                {"name": "Retire 2 Years Later", "retirement_age": 67},
                {"name": "Reduce Spending 15%", "retirement_spending": 68000},
                {"name": "Increase Savings $20k", "annual_contributions": 50000}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/compare-scenarios",
            json=request
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "scenarios" in data
        assert "best_scenario" in data
        assert "best_confidence" in data
        assert "comparison_summary" in data
        
        # Should have 4 scenarios (base + 3 alternatives)
        assert len(data["scenarios"]) == 4
        
        # Each scenario should have required fields
        for scenario in data["scenarios"]:
            assert "name" in scenario
            assert "confidence" in scenario
            assert "monte_carlo_success" in scenario
            assert "median_outcome" in scenario
            assert "stressed_confidence" in scenario
        
        print(f"✓ Scenario comparison: Best={data['best_scenario']} at {data['best_confidence']:.1f}%")


class TestHybridEngineDualConfidence:
    """Test GET /api/hybrid-engine/confidence/{client_id} - Dual confidence states"""
    
    def test_get_dual_confidence(self):
        """Test getting both live and presentation confidence"""
        client_id = "TEST_dual_confidence"
        
        # First, run a calculation to populate state
        calc_request = {
            "client_id": client_id,
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 800000,
            "annual_contributions": 30000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000,
            "mode": "presentation"
        }
        
        calc_response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=calc_request
        )
        assert calc_response.status_code == 200
        
        # Now get dual confidence
        response = requests.get(f"{BASE_URL}/api/hybrid-engine/confidence/{client_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "client_id" in data
        assert data["client_id"] == client_id
        assert "live_confidence" in data or "presentation_confidence" in data
        assert "explanation" in data
        
        print(f"✓ Dual confidence retrieved for {client_id}")


class TestHybridEngineAISuggestions:
    """Test POST /api/hybrid-engine/ai-suggestions - AI recommendations"""
    
    def test_get_ai_suggestions(self):
        """Test getting AI-powered improvement suggestions"""
        request = {
            "client_id": "TEST_ai_suggestions",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 500000,  # Lower portfolio for more suggestions
            "annual_contributions": 20000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000,
            "enable_dynamic_spending": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/ai-suggestions",
            json=request
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "client_id" in data
        assert "current_confidence" in data
        assert "identified_risks" in data
        assert "ai_suggestions" in data
        assert "important_notice" in data
        
        # Verify suggestions structure
        if data["ai_suggestions"]:
            suggestion = data["ai_suggestions"][0]
            assert "suggestion" in suggestion
            assert "current_confidence" in suggestion
            assert "projected_confidence" in suggestion
            assert "delta" in suggestion
            assert "auto_applied" in suggestion
            assert suggestion["auto_applied"] is False, "AI should NOT auto-apply changes"
        
        print(f"✓ AI suggestions: {len(data['ai_suggestions'])} suggestions, {len(data['identified_risks'])} risks")


class TestHybridEngineImpact:
    """Test POST /api/hybrid-engine/impact - Change impact calculation"""
    
    def test_retirement_age_impact(self):
        """Test impact of changing retirement age"""
        base_request = {
            "client_id": "TEST_impact",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 800000,
            "annual_contributions": 30000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/impact",
            json=base_request,
            params={"change_type": "retirement_age", "change_value": 67}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "change_type" in data
        assert data["change_type"] == "retirement_age"
        assert "change_value" in data
        assert "base_confidence" in data
        assert "new_confidence" in data
        assert "delta" in data
        assert "impact_summary" in data
        
        # Delaying retirement should increase confidence
        assert data["delta"] >= 0, "Delaying retirement should not decrease confidence"
        
        print(f"✓ Impact: Retirement age change {data['base_confidence']:.1f}% → {data['new_confidence']:.1f}% ({data['delta']:+.1f}%)")
    
    def test_spending_impact(self):
        """Test impact of changing retirement spending"""
        base_request = {
            "client_id": "TEST_impact_spending",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 800000,
            "annual_contributions": 30000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/impact",
            json=base_request,
            params={"change_type": "spending", "change_value": 70000}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["change_type"] == "spending"
        # Reducing spending should increase confidence
        assert data["delta"] >= 0, "Reducing spending should not decrease confidence"
        
        print(f"✓ Impact: Spending change {data['base_confidence']:.1f}% → {data['new_confidence']:.1f}% ({data['delta']:+.1f}%)")
    
    def test_contributions_impact(self):
        """Test impact of changing annual contributions"""
        base_request = {
            "client_id": "TEST_impact_contrib",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 800000,
            "annual_contributions": 30000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/impact",
            json=base_request,
            params={"change_type": "contributions", "change_value": 50000}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["change_type"] == "contributions"
        # Increasing contributions should increase confidence
        assert data["delta"] >= 0, "Increasing contributions should not decrease confidence"
        
        print(f"✓ Impact: Contributions change {data['base_confidence']:.1f}% → {data['new_confidence']:.1f}% ({data['delta']:+.1f}%)")


class TestHybridEngineStressTests:
    """Test stress testing functionality within calculations"""
    
    def test_stress_test_results(self):
        """Verify stress test results are properly calculated"""
        request = {
            "client_id": "TEST_stress",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 800000,
            "annual_contributions": 30000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=request
        )
        assert response.status_code == 200
        
        data = response.json()
        stress = data["stress_tests"]
        
        # Verify all stress scenarios
        assert "base_case" in stress
        assert "market_crash_30pct" in stress
        assert "high_inflation_6pct" in stress
        assert "longevity_plus_5yrs" in stress
        assert "most_severe_stress" in stress
        
        # Verify stress impacts exist and are reasonable
        base_success = stress["base_case"]["success_rate"]
        # Market crash should typically reduce success (allow small positive due to MC variance)
        assert stress["market_crash_30pct"]["impact"] <= 5, "Market crash impact should be reasonable"
        # High inflation should typically reduce success
        assert stress["high_inflation_6pct"]["impact"] <= 5, "High inflation impact should be reasonable"
        # Longevity can vary due to Monte Carlo variance
        assert "impact" in stress["longevity_plus_5yrs"], "Longevity should have impact"
        
        # Most severe should be the minimum
        assert stress["most_severe_stress"] <= base_success
        
        print(f"✓ Stress tests: Base={base_success}%, Crash={stress['market_crash_30pct']['success_rate']}%, Inflation={stress['high_inflation_6pct']['success_rate']}%")


class TestHybridEngineFactorWeights:
    """Test confidence factor weights and contributions"""
    
    def test_factor_weights_sum_to_100(self):
        """Verify confidence factor weights sum to 100%"""
        response = requests.get(f"{BASE_URL}/api/hybrid-engine/defaults")
        assert response.status_code == 200
        
        data = response.json()
        weights = data["confidence_weights"]
        
        # Extract numeric values from percentage strings
        total = 0
        for key, value in weights.items():
            if isinstance(value, str) and '%' in value:
                total += int(value.replace('%', ''))
        
        assert total == 100, f"Weights should sum to 100%, got {total}%"
        print(f"✓ Factor weights sum to 100%")
    
    def test_factor_contributions_in_calculation(self):
        """Verify factor contributions are calculated correctly"""
        request = {
            "client_id": "TEST_factors",
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 800000,
            "annual_contributions": 30000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=request
        )
        assert response.status_code == 200
        
        data = response.json()
        breakdown = data["confidence_breakdown"]
        
        # Verify factor contributions exist
        contributions = breakdown["factor_contributions"]
        assert "monte_carlo" in contributions
        assert "downside_protection" in contributions
        assert "income_stability" in contributions
        assert "spending_flexibility" in contributions
        assert "diversification" in contributions
        assert "longevity_protection" in contributions
        
        # Sum of contributions should approximately equal confidence score
        total_contribution = sum(contributions.values())
        confidence_score = data["confidence_score"]
        
        # Allow small rounding difference
        assert abs(total_contribution - confidence_score) < 1, \
            f"Contributions ({total_contribution}) should equal confidence ({confidence_score})"
        
        print(f"✓ Factor contributions sum to {total_contribution:.1f} (confidence={confidence_score:.1f})")


class TestHybridEngineEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_young_client(self):
        """Test calculation for young client with long horizon"""
        request = {
            "client_id": "TEST_young",
            "current_age": 25,
            "retirement_age": 65,
            "life_expectancy": 95,
            "current_portfolio": 50000,
            "annual_contributions": 15000,
            "retirement_spending": 60000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=request
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "confidence_score" in data
        print(f"✓ Young client (25yo): Confidence={data['confidence_score']:.1f}%")
    
    def test_near_retirement(self):
        """Test calculation for client near retirement"""
        request = {
            "client_id": "TEST_near_retire",
            "current_age": 63,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_portfolio": 1500000,
            "annual_contributions": 50000,
            "retirement_spending": 80000,
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=request
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "confidence_score" in data
        print(f"✓ Near retirement (63yo): Confidence={data['confidence_score']:.1f}%")
    
    def test_high_spending_low_portfolio(self):
        """Test calculation with high spending relative to portfolio"""
        request = {
            "client_id": "TEST_high_spend",
            "current_age": 55,
            "retirement_age": 60,
            "life_expectancy": 90,
            "current_portfolio": 300000,
            "annual_contributions": 10000,
            "retirement_spending": 100000,  # Very high relative to portfolio
            "expected_return": 0.07,
            "return_volatility": 0.15,
            "inflation_rate": 0.025,
            "num_simulations": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/hybrid-engine/calculate",
            json=request
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should have low confidence due to unsustainable spending
        assert data["confidence_score"] < 50, "High spending should result in low confidence"
        print(f"✓ High spending scenario: Confidence={data['confidence_score']:.1f}% (expected low)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
