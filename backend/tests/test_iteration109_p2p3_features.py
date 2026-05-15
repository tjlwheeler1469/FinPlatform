"""
Test Suite for Iteration 109 - P2/P3 Features
Tests for:
1. Horizontal Scaling Infrastructure (scaling_infrastructure.py)
2. Historical Confidence Score Tracking (confidence_history.py)
3. Services Australia Age Pension API (services_australia.py)
4. CGT Optimization Scenarios (cgt_optimizer.py)
5. Partner Comparison Feature (partner_comparison.py)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://decision-engine-109.preview.emergentagent.com').rstrip('/')


class TestScalingInfrastructure:
    """Tests for horizontal scaling infrastructure endpoints"""
    
    def test_health_check(self):
        """Test GET /api/infrastructure/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/infrastructure/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["status"] == "healthy", f"Expected healthy status, got {data.get('status')}"
        assert "timestamp" in data, "Missing timestamp in response"
        assert "version" in data, "Missing version in response"
        assert "components" in data, "Missing components in response"
        
        # Verify all components are operational
        components = data["components"]
        assert components.get("cache") == "operational"
        assert components.get("rate_limiter") == "operational"
        assert components.get("job_queue") == "operational"
        assert components.get("database") == "operational"
        print("PASS: Health check returned healthy status with all components operational")
    
    def test_system_metrics(self):
        """Test GET /api/infrastructure/metrics returns system metrics"""
        response = requests.get(f"{BASE_URL}/api/infrastructure/metrics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "system" in data, "Missing system metrics"
        assert "cache" in data, "Missing cache metrics"
        assert "rate_limiter" in data, "Missing rate_limiter metrics"
        assert "job_queue" in data, "Missing job_queue metrics"
        assert "connection_pool" in data, "Missing connection_pool metrics"
        
        # Verify system metrics structure
        system = data["system"]
        assert "uptime_seconds" in system
        assert "total_requests" in system
        assert "response_times" in system
        print(f"PASS: System metrics returned with uptime: {system.get('uptime_human', 'N/A')}")
    
    def test_scaling_config(self):
        """Test GET /api/infrastructure/scaling/config returns scaling configuration"""
        response = requests.get(f"{BASE_URL}/api/infrastructure/scaling/config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("target_users") == 20000, "Expected target_users to be 20000"
        assert "cache" in data
        assert "rate_limiting" in data
        assert "connection_pooling" in data
        assert "horizontal_scaling" in data
        print(f"PASS: Scaling config returned for {data['target_users']} users")


class TestConfidenceHistory:
    """Tests for historical confidence score tracking endpoints"""
    
    def test_get_client_history(self):
        """Test GET /api/confidence-history/client/{client_id} returns historical scores"""
        client_id = "demo_client"
        response = requests.get(f"{BASE_URL}/api/confidence-history/client/{client_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("client_id") == client_id, f"Expected client_id {client_id}"
        assert "history" in data, "Missing history array"
        assert "trend" in data, "Missing trend data"
        assert "summary" in data, "Missing summary data"
        
        # Verify trend structure
        trend = data["trend"]
        assert "direction" in trend
        assert "change_percent" in trend
        assert "average" in trend
        print(f"PASS: Client history returned with {len(data['history'])} records, trend: {trend['direction']}")
    
    def test_get_chart_data(self):
        """Test GET /api/confidence-history/client/{client_id}/chart-data returns chart-ready data"""
        client_id = "demo_client"
        response = requests.get(f"{BASE_URL}/api/confidence-history/client/{client_id}/chart-data?interval=monthly&periods=12")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("client_id") == client_id
        assert data.get("interval") == "monthly"
        assert "chart_data" in data, "Missing chart_data array"
        
        # Verify chart data structure
        if data["chart_data"]:
            first_point = data["chart_data"][0]
            assert "period" in first_point
            assert "confidence_score" in first_point
            assert "longevity_risk" in first_point
            assert "market_risk" in first_point
        print(f"PASS: Chart data returned with {len(data['chart_data'])} data points")
    
    def test_get_milestones(self):
        """Test GET /api/confidence-history/client/{client_id}/milestones returns milestones"""
        client_id = "demo_client"
        response = requests.get(f"{BASE_URL}/api/confidence-history/client/{client_id}/milestones")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("client_id") == client_id
        assert "milestones" in data
        assert "summary" in data
        print(f"PASS: Milestones returned with {len(data['milestones'])} milestones")


class TestServicesAustralia:
    """Tests for Services Australia Age Pension API endpoints"""
    
    def test_get_current_rates(self):
        """Test GET /api/services-australia/rates/current returns pension rates"""
        response = requests.get(f"{BASE_URL}/api/services-australia/rates/current")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "effective_date" in data
        assert "pension_rates" in data
        assert "assets_test" in data
        assert "income_test" in data
        assert "deeming_rates" in data
        
        # Verify pension rates structure
        rates = data["pension_rates"]
        assert "single" in rates
        assert "couple_combined" in rates
        assert rates["single"]["maximum_fortnightly"] > 0
        print(f"PASS: Current pension rates returned, single max: ${rates['single']['maximum_fortnightly']}/fortnight")
    
    def test_age_eligibility(self):
        """Test GET /api/services-australia/eligibility/age returns age eligibility"""
        dob = "1960-05-15"
        response = requests.get(f"{BASE_URL}/api/services-australia/eligibility/age?date_of_birth={dob}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pension_age" in data
        assert "pension_start_date" in data
        assert "current_age" in data
        assert "is_eligible_now" in data
        print(f"PASS: Age eligibility returned - pension age: {data['pension_age']}, eligible now: {data['is_eligible_now']}")
    
    def test_pension_assessment(self):
        """Test POST /api/services-australia/assess returns full pension assessment"""
        payload = {
            "client_id": "test_client",
            "date_of_birth": "1960-05-15",
            "is_homeowner": True,
            "bank_accounts": 50000,
            "term_deposits": 100000,
            "shares_managed_funds": 200000,
            "superannuation": 400000,
            "account_based_pension": 0,
            "investment_property": 0,
            "other_assets": 50000,
            "employment_income": 0,
            "rental_income": 0,
            "other_income": 5000,
            "include_projections": True,
            "projection_years": 5
        }
        
        response = requests.post(f"{BASE_URL}/api/services-australia/assess", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("client_id") == "test_client"
        assert "eligibility" in data
        assert "assets_test" in data
        assert "income_test" in data
        assert "pension_entitlement" in data
        assert "recommendations" in data
        
        # Verify pension entitlement structure
        entitlement = data["pension_entitlement"]
        assert "fortnightly_pension" in entitlement
        assert "annual_pension" in entitlement
        assert "status" in entitlement
        print(f"PASS: Pension assessment returned - status: {entitlement['status']}, annual: ${entitlement['annual_pension']}")
    
    def test_quick_calculator(self):
        """Test GET /api/services-australia/calculator/quick returns quick estimate"""
        response = requests.get(
            f"{BASE_URL}/api/services-australia/calculator/quick"
            f"?assessable_assets=500000&annual_income=10000&is_homeowner=true&is_couple=false"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "estimated_fortnightly_pension" in data
        assert "estimated_annual_pension" in data
        assert "assets_test_result" in data
        assert "income_test_result" in data
        print(f"PASS: Quick calculator returned - estimated annual: ${data['estimated_annual_pension']}")


class TestCGTOptimizer:
    """Tests for CGT Optimization endpoints"""
    
    def test_get_cgt_rates(self):
        """Test GET /api/cgt-optimizer/rates returns CGT rates"""
        response = requests.get(f"{BASE_URL}/api/cgt-optimizer/rates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("financial_year") == "2024-25"
        assert "cgt_discount" in data
        assert "individual_tax_rates" in data
        assert "medicare_levy" in data
        assert "notes" in data
        
        # Verify CGT discount
        discount = data["cgt_discount"]
        assert discount.get("discount_rate") == 0.50
        print(f"PASS: CGT rates returned for FY {data['financial_year']}")
    
    def test_cgt_analysis(self):
        """Test POST /api/cgt-optimizer/analyze returns CGT analysis"""
        payload = {
            "client_id": "test_client",
            "taxable_income": 100000,
            "holdings": [
                {
                    "id": "holding1",
                    "name": "BHP Shares",
                    "asset_type": "shares",
                    "entity": "personal",
                    "units": 1000,
                    "purchase_date": "2020-01-15",
                    "cost_base": 30000,
                    "current_value": 45000
                },
                {
                    "id": "holding2",
                    "name": "CBA Shares",
                    "asset_type": "shares",
                    "entity": "personal",
                    "units": 500,
                    "purchase_date": "2024-06-01",
                    "cost_base": 50000,
                    "current_value": 48000
                }
            ],
            "include_tax_loss_harvesting": True,
            "optimization_goal": "minimize_tax"
        }
        
        response = requests.post(f"{BASE_URL}/api/cgt-optimizer/analyze", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("client_id") == "test_client"
        assert "summary" in data
        assert "holding_analysis" in data
        assert "scenarios" in data
        assert "optimal_strategy" in data
        assert "recommendations" in data
        
        # Verify summary structure
        summary = data["summary"]
        assert "total_holdings" in summary
        assert "total_unrealized_gains" in summary
        assert "total_unrealized_losses" in summary
        print(f"PASS: CGT analysis returned - unrealized gains: ${summary['total_unrealized_gains']}, losses: ${summary['total_unrealized_losses']}")
    
    def test_wash_sale_check(self):
        """Test GET /api/cgt-optimizer/wash-sale-check returns wash sale analysis"""
        response = requests.get(
            f"{BASE_URL}/api/cgt-optimizer/wash-sale-check"
            f"?asset_name=BHP&sale_date=2024-12-01&repurchase_date=2024-12-15"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("asset_name") == "BHP"
        assert "days_between" in data
        assert "is_potential_wash_sale" in data
        assert "safe_repurchase_date" in data
        print(f"PASS: Wash sale check returned - is wash sale: {data['is_potential_wash_sale']}")


class TestPartnerComparison:
    """Tests for Partner Comparison endpoints"""
    
    def test_quick_compare(self):
        """Test POST /api/partner-comparison/quick-compare returns comparison results"""
        response = requests.post(
            f"{BASE_URL}/api/partner-comparison/quick-compare"
            f"?person1_assets=1500000&person1_expenses=80000&person1_age=55"
            f"&person2_assets=800000&person2_expenses=60000&person2_age=52"
            f"&combined_expense_reduction=0.25"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "person1_confidence" in data
        assert "person2_confidence" in data
        assert "together_confidence" in data
        assert "synergy_benefit" in data
        assert "expense_savings" in data
        assert "recommendation" in data
        
        # Verify synergy benefit is calculated
        assert isinstance(data["synergy_benefit"], (int, float))
        print(f"PASS: Quick compare returned - P1: {data['person1_confidence']}%, P2: {data['person2_confidence']}%, Together: {data['together_confidence']}%, Synergy: {data['synergy_benefit']}%")
    
    def test_full_comparison(self):
        """Test POST /api/partner-comparison/compare returns full comparison"""
        payload = {
            "client_id": "test_client",
            "person1": {
                "name": "John",
                "current_age": 55,
                "retirement_age": 65,
                "life_expectancy": 90,
                "net_worth": 1000000,
                "annual_income": 150000,
                "annual_expenses": 80000,
                "super_balance": 400000,
                "investment_balance": 200000
            },
            "person2": {
                "name": "Jane",
                "current_age": 52,
                "retirement_age": 65,
                "life_expectancy": 92,
                "net_worth": 600000,
                "annual_income": 100000,
                "annual_expenses": 60000,
                "super_balance": 300000,
                "investment_balance": 100000
            },
            "shared_assets": 500000,
            "combined_expenses": 100000,
            "num_simulations": 500
        }
        
        response = requests.post(f"{BASE_URL}/api/partner-comparison/compare", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("client_id") == "test_client"
        assert "scenarios" in data
        assert "synergy_analysis" in data
        assert "recommendations" in data
        assert "visualization_data" in data
        
        # Verify scenarios structure
        scenarios = data["scenarios"]
        assert "person1_alone" in scenarios
        assert "person2_alone" in scenarios
        assert "together_as_couple" in scenarios
        
        # Verify synergy analysis
        synergy = data["synergy_analysis"]
        assert "confidence_improvement" in synergy
        assert "expense_savings_annual" in synergy
        print(f"PASS: Full comparison returned - synergy improvement: {synergy['confidence_improvement']}%")
    
    def test_partnership_benefits(self):
        """Test GET /api/partner-comparison/benefits returns partnership benefits info"""
        response = requests.get(f"{BASE_URL}/api/partner-comparison/benefits")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "financial_synergies" in data
        assert "investment_benefits" in data
        assert "planning_considerations" in data
        
        # Verify financial synergies structure
        synergies = data["financial_synergies"]
        assert len(synergies) > 0
        assert "category" in synergies[0]
        assert "typical_savings" in synergies[0]
        print(f"PASS: Partnership benefits returned with {len(synergies)} synergy categories")


class TestIntegration:
    """Integration tests across multiple endpoints"""
    
    def test_confidence_history_after_calculation(self):
        """Test that confidence history is available after calculations"""
        # First, run a quick calculation
        calc_response = requests.post(
            f"{BASE_URL}/api/confidence-engine/quick-calculate"
            f"?net_worth=2000000&annual_income=200000&annual_expenses=100000"
            f"&current_age=45&retirement_age=65&life_expectancy=90"
            f"&is_couple=true&num_simulations=500"
        )
        assert calc_response.status_code == 200
        
        # Then check history is available
        history_response = requests.get(f"{BASE_URL}/api/confidence-history/client/demo_client/chart-data")
        assert history_response.status_code == 200
        
        data = history_response.json()
        assert "chart_data" in data
        print("PASS: Integration test - confidence calculation and history retrieval working")
    
    def test_all_new_endpoints_accessible(self):
        """Verify all new P2/P3 endpoints are accessible"""
        endpoints = [
            ("GET", "/api/infrastructure/health"),
            ("GET", "/api/infrastructure/metrics"),
            ("GET", "/api/confidence-history/client/demo_client"),
            ("GET", "/api/confidence-history/client/demo_client/chart-data"),
            ("GET", "/api/services-australia/rates/current"),
            ("GET", "/api/services-australia/eligibility/age?date_of_birth=1960-01-01"),
            ("GET", "/api/cgt-optimizer/rates"),
            ("GET", "/api/partner-comparison/benefits"),
        ]
        
        results = []
        for method, endpoint in endpoints:
            url = f"{BASE_URL}{endpoint}"
            if method == "GET":
                response = requests.get(url)
            else:
                response = requests.post(url)
            
            results.append({
                "endpoint": endpoint,
                "status": response.status_code,
                "success": response.status_code == 200
            })
        
        failed = [r for r in results if not r["success"]]
        assert len(failed) == 0, f"Failed endpoints: {failed}"
        print(f"PASS: All {len(endpoints)} new endpoints accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
