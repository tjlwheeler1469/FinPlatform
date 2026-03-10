"""
Backend API tests for new features:
- Salary Packaging Calculator (/api/analyze/salary-packaging)
- Property Comparison Tool (/api/analyze/property-comparison)
- Scenario Comparison (/api/analyze/scenario-comparison)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:8001')

class TestHealthCheck:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


class TestSalaryPackagingAPI:
    """Tests for Salary Packaging Calculator API"""
    
    def test_salary_packaging_basic(self):
        """Test basic salary packaging calculation"""
        payload = {
            "gross_salary": 150000,
            "packaging_items": [
                {"type": "novated_lease", "amount": 15000},
                {"type": "laptop", "amount": 2500}
            ],
            "is_nfp_employee": False,
            "nfp_cap": 0,
            "marginal_tax_rate": 0.37
        }
        response = requests.post(f"{BASE_URL}/api/analyze/salary-packaging", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "gross_salary" in data
        assert "total_packaged_amount" in data
        assert "total_fbt_exempt" in data
        assert "total_fbt_liable" in data
        assert "fbt_payable" in data
        assert "income_tax_saved" in data
        assert "net_benefit" in data
        assert "items_analysis" in data
        assert "recommendations" in data
        
        # Verify data values
        assert data["gross_salary"] == 150000
        assert data["total_packaged_amount"] == 17500
        assert data["total_fbt_exempt"] == 2500  # laptop is FBT exempt
        assert data["total_fbt_liable"] == 15000  # novated lease is FBT liable
        assert len(data["items_analysis"]) == 2
    
    def test_salary_packaging_nfp_employee(self):
        """Test salary packaging for NFP employee with FBT cap"""
        payload = {
            "gross_salary": 120000,
            "packaging_items": [
                {"type": "health_insurance", "amount": 5000},
                {"type": "super_contribution", "amount": 10000}
            ],
            "is_nfp_employee": True,
            "nfp_cap": 17000,
            "marginal_tax_rate": 0.30
        }
        response = requests.post(f"{BASE_URL}/api/analyze/salary-packaging", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_nfp_employee"] == True
        assert "nfp_cap_used" in data
        assert "nfp_cap_remaining" in data
    
    def test_salary_packaging_empty_items(self):
        """Test salary packaging with no items"""
        payload = {
            "gross_salary": 100000,
            "packaging_items": [],
            "is_nfp_employee": False,
            "nfp_cap": 0,
            "marginal_tax_rate": 0.30
        }
        response = requests.post(f"{BASE_URL}/api/analyze/salary-packaging", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_packaged_amount"] == 0
        assert data["fbt_payable"] == 0
    
    def test_salary_packaging_items_endpoint(self):
        """Test get packaging items endpoint"""
        response = requests.get(f"{BASE_URL}/api/salary-packaging/items")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "nfp_caps" in data
        assert "fbt_rate" in data
        assert len(data["items"]) > 0


class TestPropertyComparisonAPI:
    """Tests for Property Comparison Tool API"""
    
    def test_property_comparison_single(self):
        """Test property comparison with single property"""
        payload = {
            "properties": [
                {
                    "property_id": "prop_001",
                    "name": "Sydney Unit",
                    "value": 850000,
                    "rental_income": 36000,
                    "mortgage_amount": 510000,
                    "mortgage_rate": 6.29,
                    "annual_expenses": 8500,
                    "depreciation_building": 6500,
                    "depreciation_fixtures": 3200
                }
            ],
            "marginal_tax_rate": 0.30,
            "investment_horizon_years": 10,
            "expected_capital_growth": 0.04
        }
        response = requests.post(f"{BASE_URL}/api/analyze/property-comparison", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "comparisons" in data
        assert "summary" in data
        assert "recommendations" in data
        
        # Verify comparison data
        assert len(data["comparisons"]) == 1
        comp = data["comparisons"][0]
        assert comp["property_name"] == "Sydney Unit"
        assert "metrics" in comp
        assert "cash_flow" in comp
        assert "returns" in comp
        assert "scores" in comp
        
        # Verify metrics
        assert comp["metrics"]["current_value"] == 850000
        assert comp["metrics"]["rental_income"] == 36000
        assert "gross_yield" in comp["metrics"]
        assert "net_yield" in comp["metrics"]
        assert "lvr" in comp["metrics"]
    
    def test_property_comparison_multiple(self):
        """Test property comparison with multiple properties"""
        payload = {
            "properties": [
                {
                    "property_id": "prop_001",
                    "name": "Sydney Unit",
                    "value": 850000,
                    "rental_income": 36000,
                    "mortgage_amount": 510000,
                    "mortgage_rate": 6.29,
                    "annual_expenses": 8500,
                    "depreciation_building": 6500,
                    "depreciation_fixtures": 3200
                },
                {
                    "property_id": "prop_002",
                    "name": "Melbourne Townhouse",
                    "value": 720000,
                    "rental_income": 32000,
                    "mortgage_amount": 432000,
                    "mortgage_rate": 6.15,
                    "annual_expenses": 7200,
                    "depreciation_building": 5800,
                    "depreciation_fixtures": 2800
                }
            ],
            "marginal_tax_rate": 0.37,
            "investment_horizon_years": 15,
            "expected_capital_growth": 0.05
        }
        response = requests.post(f"{BASE_URL}/api/analyze/property-comparison", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["comparisons"]) == 2
        
        # Verify summary totals
        assert data["summary"]["total_properties"] == 2
        assert data["summary"]["total_value"] == 850000 + 720000
        
        # Verify recommendations
        assert "best_for_yield" in data["recommendations"]
        assert "best_for_cash_flow" in data["recommendations"]
        assert "best_for_growth" in data["recommendations"]


class TestScenarioComparisonAPI:
    """Tests for Scenario Comparison API"""
    
    def test_scenario_comparison_two_scenarios(self):
        """Test scenario comparison with two scenarios"""
        payload = {
            "scenarios": [
                {
                    "name": "Current Portfolio",
                    "entity_type": "personal",
                    "taxable_income": 185000,
                    "investments": {
                        "cash_savings": 75000,
                        "term_deposit_amount": 150000,
                        "term_deposit_rate": 4.8,
                        "shares_value": 320000,
                        "shares_dividend_yield": 4.2,
                        "franking_percentage": 85,
                        "bonds_value": 80000,
                        "bonds_yield": 5.2,
                        "etf_value": 145000,
                        "etf_yield": 3.5,
                        "smsf_balance": 580000,
                        "properties": []
                    }
                },
                {
                    "name": "High Growth",
                    "entity_type": "personal",
                    "taxable_income": 185000,
                    "investments": {
                        "cash_savings": 30000,
                        "term_deposit_amount": 50000,
                        "term_deposit_rate": 4.8,
                        "shares_value": 500000,
                        "shares_dividend_yield": 3.0,
                        "franking_percentage": 70,
                        "bonds_value": 0,
                        "bonds_yield": 0,
                        "etf_value": 400000,
                        "etf_yield": 2.5,
                        "smsf_balance": 580000,
                        "properties": []
                    }
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/api/analyze/scenario-comparison", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "comparisons" in data
        assert "differences" in data
        assert "best_for" in data
        assert "summary" in data
        
        # Verify comparisons
        assert len(data["comparisons"]) == 2
        for comp in data["comparisons"]:
            assert "scenario_name" in comp
            assert "summary" in comp
            assert "income" in comp
            assert "tax" in comp
            assert "allocation" in comp
        
        # Verify best_for recommendations
        assert "net_worth" in data["best_for"]
        assert "net_income" in data["best_for"]
        assert "tax_efficiency" in data["best_for"]
        assert "lowest_risk" in data["best_for"]
        
        # Verify summary
        assert data["summary"]["scenarios_compared"] == 2
        assert "highest_net_worth" in data["summary"]
        assert "net_worth_range" in data["summary"]
    
    def test_scenario_comparison_with_properties(self):
        """Test scenario comparison including property investments"""
        payload = {
            "scenarios": [
                {
                    "name": "Property Heavy",
                    "entity_type": "personal",
                    "taxable_income": 150000,
                    "investments": {
                        "cash_savings": 50000,
                        "term_deposit_amount": 0,
                        "term_deposit_rate": 0,
                        "shares_value": 100000,
                        "shares_dividend_yield": 4.0,
                        "franking_percentage": 85,
                        "bonds_value": 0,
                        "bonds_yield": 0,
                        "etf_value": 50000,
                        "etf_yield": 3.5,
                        "smsf_balance": 300000,
                        "properties": [
                            {"value": 800000, "rental_income": 35000, "mortgage_amount": 500000}
                        ]
                    }
                },
                {
                    "name": "Shares Heavy",
                    "entity_type": "personal",
                    "taxable_income": 150000,
                    "investments": {
                        "cash_savings": 100000,
                        "term_deposit_amount": 100000,
                        "term_deposit_rate": 4.5,
                        "shares_value": 500000,
                        "shares_dividend_yield": 4.5,
                        "franking_percentage": 90,
                        "bonds_value": 100000,
                        "bonds_yield": 5.0,
                        "etf_value": 200000,
                        "etf_yield": 3.5,
                        "smsf_balance": 300000,
                        "properties": []
                    }
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/api/analyze/scenario-comparison", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["comparisons"]) == 2
        
        # Verify property data is included
        property_scenario = next(c for c in data["comparisons"] if c["scenario_name"] == "Property Heavy")
        assert property_scenario["properties"]["count"] == 1
        assert property_scenario["properties"]["total_value"] == 800000


class TestEdgeCases:
    """Edge case tests for all new APIs"""
    
    def test_salary_packaging_high_income(self):
        """Test salary packaging for very high income earner"""
        payload = {
            "gross_salary": 500000,
            "packaging_items": [
                {"type": "novated_lease", "amount": 30000},
                {"type": "super_contribution", "amount": 27500}
            ],
            "is_nfp_employee": False,
            "nfp_cap": 0,
            "marginal_tax_rate": 0.45
        }
        response = requests.post(f"{BASE_URL}/api/analyze/salary-packaging", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["gross_salary"] == 500000
        assert len(data["recommendations"]) > 0
    
    def test_property_comparison_no_mortgage(self):
        """Test property comparison with fully paid property"""
        payload = {
            "properties": [
                {
                    "property_id": "prop_001",
                    "name": "Paid Off Property",
                    "value": 1000000,
                    "rental_income": 50000,
                    "mortgage_amount": 0,
                    "mortgage_rate": 0,
                    "annual_expenses": 10000,
                    "depreciation_building": 8000,
                    "depreciation_fixtures": 4000
                }
            ],
            "marginal_tax_rate": 0.37,
            "investment_horizon_years": 10,
            "expected_capital_growth": 0.04
        }
        response = requests.post(f"{BASE_URL}/api/analyze/property-comparison", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        comp = data["comparisons"][0]
        assert comp["metrics"]["lvr"] == 0
        assert comp["cash_flow"]["annual_interest"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
