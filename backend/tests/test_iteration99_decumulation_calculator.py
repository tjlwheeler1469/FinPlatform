"""
Test Suite for Decumulation Calculator (Pension Phase) - Iteration 99
Tests all backend API endpoints for the pension phase planning module
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDecumulationCalculatorRules:
    """Tests for GET /api/decumulation/rules endpoint - pension rules and thresholds"""
    
    def test_get_pension_rules_success(self):
        """Test that rules endpoint returns pension rules, minimum drawdown rates, age pension thresholds"""
        response = requests.get(f"{BASE_URL}/api/decumulation/rules")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify minimum drawdown rates exist
        assert "minimum_drawdown_rates" in data, "Missing minimum_drawdown_rates"
        rates = data["minimum_drawdown_rates"]
        assert "under_65" in rates, "Missing under_65 rate"
        assert "65_74" in rates, "Missing 65_74 rate"
        assert "75_79" in rates, "Missing 75_79 rate"
        assert "80_84" in rates, "Missing 80_84 rate"
        assert "85_89" in rates, "Missing 85_89 rate"
        assert "90_94" in rates, "Missing 90_94 rate"
        assert "95_plus" in rates, "Missing 95_plus rate"
        
        # Verify rates are correct (FY 2024-25)
        assert rates["under_65"] == 4.0, f"Expected 4.0 for under_65, got {rates['under_65']}"
        assert rates["65_74"] == 5.0, f"Expected 5.0 for 65_74, got {rates['65_74']}"
        assert rates["95_plus"] == 14.0, f"Expected 14.0 for 95_plus, got {rates['95_plus']}"
        
        # Verify transfer balance cap
        assert "transfer_balance_cap" in data, "Missing transfer_balance_cap"
        assert data["transfer_balance_cap"] == 1900000, f"Expected $1.9M TBC, got {data['transfer_balance_cap']}"
        
        # Verify age pension rates
        assert "age_pension_rates" in data, "Missing age_pension_rates"
        pension_rates = data["age_pension_rates"]
        assert "max_rate_single" in pension_rates, "Missing max_rate_single"
        assert "max_rate_couple" in pension_rates, "Missing max_rate_couple"
        assert "assets_threshold_homeowner_single" in pension_rates, "Missing assets_threshold_homeowner_single"
        assert "deeming_rate_below" in pension_rates, "Missing deeming_rate_below"
        assert "deeming_rate_above" in pension_rates, "Missing deeming_rate_above"
        
        # Verify pension age
        assert "pension_age" in data, "Missing pension_age"
        assert data["pension_age"] == 67, f"Expected pension age 67, got {data['pension_age']}"
        
        # Verify life expectancy tables
        assert "life_expectancy" in data, "Missing life_expectancy"
        assert "male" in data["life_expectancy"], "Missing male life expectancy"
        assert "female" in data["life_expectancy"], "Missing female life expectancy"
        
        print("PASS: GET /api/decumulation/rules returns all pension rules correctly")


class TestDecumulationCalculatorAssetAssumptions:
    """Tests for GET /api/decumulation/asset-assumptions endpoint"""
    
    def test_get_asset_assumptions_success(self):
        """Test that asset-assumptions endpoint returns return assumptions by asset type"""
        response = requests.get(f"{BASE_URL}/api/decumulation/asset-assumptions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify assumptions exist
        assert "assumptions" in data, "Missing assumptions"
        assumptions = data["assumptions"]
        
        # Verify key asset types have return assumptions
        expected_asset_types = ["cash", "term_deposit", "shares_australian", "shares_international", 
                               "managed_funds", "etf", "property_investment", "super_pension", "bonds"]
        for asset_type in expected_asset_types:
            assert asset_type in assumptions, f"Missing {asset_type} in assumptions"
            assert "return" in assumptions[asset_type], f"Missing return for {asset_type}"
            assert "yield" in assumptions[asset_type], f"Missing yield for {asset_type}"
            assert "volatility" in assumptions[asset_type], f"Missing volatility for {asset_type}"
        
        # Verify entity types list
        assert "entity_types" in data, "Missing entity_types"
        assert "individual" in data["entity_types"], "Missing individual entity type"
        assert "smsf" in data["entity_types"], "Missing smsf entity type"
        
        # Verify asset types list
        assert "asset_types" in data, "Missing asset_types"
        assert "cash" in data["asset_types"], "Missing cash asset type"
        assert "super_pension" in data["asset_types"], "Missing super_pension asset type"
        
        # Verify liability types list
        assert "liability_types" in data, "Missing liability_types"
        assert "mortgage_primary" in data["liability_types"], "Missing mortgage_primary liability type"
        
        print("PASS: GET /api/decumulation/asset-assumptions returns all assumptions correctly")


class TestDecumulationCalculatorSampleCalculation:
    """Tests for GET /api/decumulation/demo/sample-calculation endpoint"""
    
    def test_get_sample_calculation_success(self):
        """Test that sample-calculation endpoint returns a full sample calculation"""
        response = requests.get(f"{BASE_URL}/api/decumulation/demo/sample-calculation")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify calculation ID
        assert "calculation_id" in data, "Missing calculation_id"
        assert data["calculation_id"].startswith("DEC-"), f"Invalid calculation_id format: {data['calculation_id']}"
        
        # Verify calculated_at timestamp
        assert "calculated_at" in data, "Missing calculated_at"
        
        # Verify summary
        assert "summary" in data, "Missing summary"
        summary = data["summary"]
        assert "current_age" in summary, "Missing current_age in summary"
        assert "life_expectancy_years" in summary, "Missing life_expectancy_years"
        assert "expected_lifespan" in summary, "Missing expected_lifespan"
        assert "projection_years" in summary, "Missing projection_years"
        
        # Verify current position
        assert "current_position" in data, "Missing current_position"
        position = data["current_position"]
        assert "total_assets" in position, "Missing total_assets"
        assert "total_super_pension" in position, "Missing total_super_pension"
        assert "total_liabilities" in position, "Missing total_liabilities"
        assert "net_position" in position, "Missing net_position"
        
        # Verify assets by type
        assert "assets_by_type" in data, "Missing assets_by_type"
        
        # Verify assets by entity
        assert "assets_by_entity" in data, "Missing assets_by_entity"
        
        # Verify income analysis
        assert "income_analysis" in data, "Missing income_analysis"
        income = data["income_analysis"]
        assert "asset_income" in income, "Missing asset_income"
        assert "pension_drawdown" in income, "Missing pension_drawdown"
        assert "total_income" in income, "Missing total_income"
        assert "total_expenses" in income, "Missing total_expenses"
        assert "surplus_deficit" in income, "Missing surplus_deficit"
        
        # Verify drawdown analysis
        assert "drawdown_analysis" in data, "Missing drawdown_analysis"
        drawdown = data["drawdown_analysis"]
        assert "strategy" in drawdown, "Missing strategy"
        assert "minimum_drawdown_rate" in drawdown, "Missing minimum_drawdown_rate"
        assert "minimum_annual_drawdown" in drawdown, "Missing minimum_annual_drawdown"
        assert "planned_annual_drawdown" in drawdown, "Missing planned_annual_drawdown"
        assert "transfer_balance_cap" in drawdown, "Missing transfer_balance_cap"
        
        # Verify age pension calculation
        assert "age_pension" in data, "Missing age_pension"
        if data["age_pension"]:  # May be None if not eligible
            assert "annual_pension" in data["age_pension"], "Missing annual_pension"
            assert "is_eligible" in data["age_pension"], "Missing is_eligible"
        
        # Verify longevity analysis
        assert "longevity_analysis" in data, "Missing longevity_analysis"
        longevity = data["longevity_analysis"]
        assert "years_funds_projected_to_last" in longevity, "Missing years_funds_projected_to_last"
        assert "final_net_position" in longevity, "Missing final_net_position"
        
        # Verify projections array
        assert "projections" in data, "Missing projections"
        assert isinstance(data["projections"], list), "projections should be a list"
        assert len(data["projections"]) > 0, "projections should not be empty"
        
        # Verify projection structure
        first_proj = data["projections"][0]
        assert "year" in first_proj, "Missing year in projection"
        assert "age" in first_proj, "Missing age in projection"
        assert "super_balance" in first_proj, "Missing super_balance in projection"
        assert "other_assets" in first_proj, "Missing other_assets in projection"
        assert "liabilities" in first_proj, "Missing liabilities in projection"
        assert "net_position" in first_proj, "Missing net_position in projection"
        assert "super_drawdown" in first_proj, "Missing super_drawdown in projection"
        assert "age_pension" in first_proj, "Missing age_pension in projection"
        assert "total_income" in first_proj, "Missing total_income in projection"
        assert "expenses" in first_proj, "Missing expenses in projection"
        assert "surplus_deficit" in first_proj, "Missing surplus_deficit in projection"
        
        # Verify assumptions
        assert "assumptions" in data, "Missing assumptions"
        
        print("PASS: GET /api/decumulation/demo/sample-calculation returns full calculation")


class TestDecumulationCalculatorCalculate:
    """Tests for POST /api/decumulation/calculate endpoint"""
    
    def test_calculate_basic_request(self):
        """Test basic calculation with minimal required fields"""
        request_data = {
            "person": {
                "current_age": 67,
                "gender": "male",
                "is_homeowner": True,
                "relationship_status": "single"
            },
            "assets": [
                {
                    "name": "TEST_Family Home",
                    "asset_type": "property_residential",
                    "entity": "individual",
                    "current_value": 1000000,
                    "is_assessable_for_pension": False
                }
            ],
            "liabilities": [],
            "super_pensions": [
                {
                    "name": "TEST_Main Super",
                    "fund_name": "Test Fund",
                    "account_type": "account_based",
                    "current_balance": 500000
                }
            ],
            "expenses": [
                {
                    "name": "Living Expenses",
                    "annual_amount": 50000,
                    "category": "living"
                }
            ],
            "projection_years": 20,
            "include_age_pension": True
        }
        
        response = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify calculation completed
        assert "calculation_id" in data, "Missing calculation_id"
        assert "current_position" in data, "Missing current_position"
        assert "projections" in data, "Missing projections"
        
        # Verify position values
        position = data["current_position"]
        assert position["total_assets"] == 1000000, f"Expected total_assets 1000000, got {position['total_assets']}"
        assert position["total_super_pension"] == 500000, f"Expected total_super_pension 500000, got {position['total_super_pension']}"
        assert position["net_position"] == 1500000, f"Expected net_position 1500000, got {position['net_position']}"
        
        # Verify projections count matches requested years
        assert len(data["projections"]) == 20, f"Expected 20 projections, got {len(data['projections'])}"
        
        print("PASS: POST /api/decumulation/calculate works with basic request")
    
    def test_calculate_with_liabilities(self):
        """Test calculation with liabilities included"""
        request_data = {
            "person": {
                "current_age": 65,
                "gender": "female",
                "is_homeowner": True,
                "relationship_status": "partnered"
            },
            "assets": [
                {
                    "name": "TEST_Investment Property",
                    "asset_type": "property_investment",
                    "entity": "joint",
                    "current_value": 650000,
                    "is_assessable_for_pension": True
                }
            ],
            "liabilities": [
                {
                    "name": "TEST_Investment Loan",
                    "liability_type": "mortgage_investment",
                    "entity": "joint",
                    "current_balance": 200000,
                    "interest_rate": 6.5
                }
            ],
            "super_pensions": [
                {
                    "name": "TEST_Super",
                    "fund_name": "Test Fund",
                    "account_type": "account_based",
                    "current_balance": 400000
                }
            ],
            "expenses": [],
            "projection_years": 15
        }
        
        response = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        position = data["current_position"]
        
        # Verify liabilities are included
        assert position["total_liabilities"] == 200000, f"Expected total_liabilities 200000, got {position['total_liabilities']}"
        assert position["net_position"] == 850000, f"Expected net_position 850000, got {position['net_position']}"
        
        # Verify liabilities by type
        assert "liabilities_by_type" in data, "Missing liabilities_by_type"
        assert "mortgage_investment" in data["liabilities_by_type"], "Missing mortgage_investment in liabilities_by_type"
        
        print("PASS: POST /api/decumulation/calculate handles liabilities correctly")
    
    def test_calculate_different_drawdown_strategies(self):
        """Test calculation with different drawdown strategies"""
        base_request = {
            "person": {
                "current_age": 70,
                "gender": "male",
                "is_homeowner": True,
                "relationship_status": "single"
            },
            "assets": [],
            "liabilities": [],
            "super_pensions": [
                {
                    "name": "TEST_Super",
                    "fund_name": "Test Fund",
                    "account_type": "account_based",
                    "current_balance": 800000
                }
            ],
            "expenses": [
                {"name": "Living", "annual_amount": 60000, "category": "living"}
            ],
            "projection_years": 10
        }
        
        # Test minimum strategy
        request_min = {**base_request, "drawdown_settings": {"strategy": "minimum"}}
        response_min = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_min)
        assert response_min.status_code == 200
        data_min = response_min.json()
        assert data_min["drawdown_analysis"]["strategy"] == "minimum"
        
        # Test percentage strategy
        request_pct = {**base_request, "drawdown_settings": {"strategy": "percentage", "target_percentage": 6.0}}
        response_pct = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_pct)
        assert response_pct.status_code == 200
        data_pct = response_pct.json()
        assert data_pct["drawdown_analysis"]["strategy"] == "percentage"
        
        # Test fixed_amount strategy
        request_fixed = {**base_request, "drawdown_settings": {"strategy": "fixed_amount", "target_income": 70000}}
        response_fixed = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_fixed)
        assert response_fixed.status_code == 200
        data_fixed = response_fixed.json()
        assert data_fixed["drawdown_analysis"]["strategy"] == "fixed_amount"
        
        print("PASS: POST /api/decumulation/calculate handles different drawdown strategies")
    
    def test_calculate_age_pension_eligibility(self):
        """Test that age pension is calculated correctly based on age"""
        # Person under pension age (67)
        request_under = {
            "person": {"current_age": 60, "gender": "male", "is_homeowner": True, "relationship_status": "single"},
            "assets": [],
            "liabilities": [],
            "super_pensions": [{"name": "TEST_Super", "fund_name": "Fund", "account_type": "account_based", "current_balance": 300000}],
            "expenses": [],
            "projection_years": 10,
            "include_age_pension": True
        }
        
        response_under = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_under)
        assert response_under.status_code == 200
        data_under = response_under.json()
        # Under 67, should not have age pension
        assert data_under["age_pension"] is None, "Should not have age pension under 67"
        
        # Person at pension age
        request_at = {
            "person": {"current_age": 67, "gender": "male", "is_homeowner": True, "relationship_status": "single"},
            "assets": [],
            "liabilities": [],
            "super_pensions": [{"name": "TEST_Super", "fund_name": "Fund", "account_type": "account_based", "current_balance": 300000}],
            "expenses": [],
            "projection_years": 10,
            "include_age_pension": True
        }
        
        response_at = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_at)
        assert response_at.status_code == 200
        data_at = response_at.json()
        # At 67 with $300k super, should have some age pension
        assert data_at["age_pension"] is not None, "Should have age pension at 67"
        assert "annual_pension" in data_at["age_pension"], "Missing annual_pension"
        
        print("PASS: POST /api/decumulation/calculate handles age pension eligibility correctly")


class TestDecumulationCalculatorCompareStrategies:
    """Tests for POST /api/decumulation/compare-strategies endpoint"""
    
    def test_compare_strategies_success(self):
        """Test that compare-strategies endpoint compares different drawdown strategies"""
        request_data = {
            "person": {
                "current_age": 67,
                "gender": "male",
                "is_homeowner": True,
                "relationship_status": "single"
            },
            "assets": [
                {
                    "name": "TEST_Shares",
                    "asset_type": "shares_australian",
                    "entity": "individual",
                    "current_value": 200000,
                    "is_assessable_for_pension": True
                }
            ],
            "liabilities": [],
            "super_pensions": [
                {
                    "name": "TEST_Super",
                    "fund_name": "Test Fund",
                    "account_type": "account_based",
                    "current_balance": 600000
                }
            ],
            "expenses": [
                {"name": "Living", "annual_amount": 50000, "category": "living"},
                {"name": "Healthcare", "annual_amount": 8000, "category": "healthcare"}
            ],
            "projection_years": 25,
            "include_age_pension": True
        }
        
        response = requests.post(f"{BASE_URL}/api/decumulation/compare-strategies", json=request_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify comparison ID
        assert "comparison_id" in data, "Missing comparison_id"
        assert data["comparison_id"].startswith("COMP-"), f"Invalid comparison_id format: {data['comparison_id']}"
        
        # Verify strategies array
        assert "strategies" in data, "Missing strategies"
        assert isinstance(data["strategies"], list), "strategies should be a list"
        assert len(data["strategies"]) >= 3, f"Expected at least 3 strategies, got {len(data['strategies'])}"
        
        # Verify each strategy has required fields
        strategy_names = []
        for strategy in data["strategies"]:
            assert "strategy" in strategy, "Missing strategy name"
            assert "first_year_drawdown" in strategy, "Missing first_year_drawdown"
            assert "first_year_income" in strategy, "Missing first_year_income"
            assert "years_funds_last" in strategy, "Missing years_funds_last"
            assert "final_net_position" in strategy, "Missing final_net_position"
            strategy_names.append(strategy["strategy"])
        
        # Verify all three strategies are compared
        assert "minimum" in strategy_names, "Missing minimum strategy"
        assert "percentage" in strategy_names, "Missing percentage strategy"
        assert "fixed_amount" in strategy_names, "Missing fixed_amount strategy"
        
        # Verify recommendation
        assert "recommendation" in data, "Missing recommendation"
        assert isinstance(data["recommendation"], str), "recommendation should be a string"
        assert len(data["recommendation"]) > 0, "recommendation should not be empty"
        
        print("PASS: POST /api/decumulation/compare-strategies compares strategies correctly")


class TestDecumulationCalculatorValidation:
    """Tests for input validation"""
    
    def test_calculate_invalid_age(self):
        """Test that invalid age is rejected"""
        request_data = {
            "person": {
                "current_age": 40,  # Below minimum of 55
                "gender": "male",
                "is_homeowner": True,
                "relationship_status": "single"
            },
            "assets": [],
            "liabilities": [],
            "super_pensions": [],
            "expenses": [],
            "projection_years": 10
        }
        
        response = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_data)
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422 for invalid age, got {response.status_code}"
        
        print("PASS: POST /api/decumulation/calculate rejects invalid age")
    
    def test_calculate_missing_person(self):
        """Test that missing person field is rejected"""
        request_data = {
            "assets": [],
            "liabilities": [],
            "super_pensions": [],
            "expenses": [],
            "projection_years": 10
        }
        
        response = requests.post(f"{BASE_URL}/api/decumulation/calculate", json=request_data)
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422 for missing person, got {response.status_code}"
        
        print("PASS: POST /api/decumulation/calculate rejects missing person")


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """Test that health endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Health check endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
