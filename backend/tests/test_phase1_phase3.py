"""
Test Phase 1-3 Implementation: Dashboard Command Center & Scenario Comparison
Tests the new dashboard metrics, health score, monte carlo, net worth trend APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDashboardAPIs:
    """Test APIs used by the Dashboard Command Center"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_monte_carlo_simulation(self):
        """Test Monte Carlo simulation endpoint for retirement projections"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/monte-carlo",
            params={
                "initial_value": 1978000,
                "expected_return": 0.07,
                "volatility": 0.12,
                "years": 25,
                "simulations": 1000
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "initial_value" in data
        assert "final_value_mean" in data
        assert "final_value_median" in data
        assert "probability_of_loss" in data
        assert "percentile_projections" in data
        
        # Verify percentile projections
        percentiles = data["percentile_projections"]
        assert "p10" in percentiles
        assert "p50" in percentiles
        assert "p90" in percentiles
        assert len(percentiles["p50"]) == 26  # 25 years + initial
        
        print(f"✓ Monte Carlo: Median final value ${data['final_value_median']:,.0f}")
    
    def test_net_worth_trend(self):
        """Test net worth trend endpoint for Wheeler household"""
        response = requests.get(f"{BASE_URL}/api/trends/net-worth/wheeler")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "household_id" in data
        assert data["household_id"] == "wheeler"
        assert "history" in data
        assert len(data["history"]) > 0
        
        # Verify history data structure
        first_entry = data["history"][0]
        assert "date" in first_entry
        assert "net_worth" in first_entry
        assert "total_assets" in first_entry
        assert "total_liabilities" in first_entry
        
        print(f"✓ Net Worth Trend: {len(data['history'])} data points")
    
    def test_health_score_endpoint(self):
        """Test financial health score calculation endpoint"""
        payload = {
            "age": 45,
            "current_income": 185000,
            "annual_expenses": 120000,
            "total_assets": 2920000,
            "total_debt": 942000,
            "super_balance": 580000,
            "emergency_fund": 75000,
            "investment_portfolio": 465000,
            "property_value": 1570000,
            "savings_rate": 0.15,
            "retirement_age": 60,
            "desired_retirement_income": 100000
        }
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/health-score",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "total_score" in data
        assert "max_score" in data
        assert "status" in data
        assert "dimensions" in data
        
        # Verify score is reasonable
        assert 0 <= data["total_score"] <= 100
        assert data["max_score"] == 100
        
        # Verify dimensions
        dimensions = data["dimensions"]
        assert "savings_rate" in dimensions
        assert "debt_management" in dimensions
        assert "retirement_readiness" in dimensions
        
        print(f"✓ Health Score: {data['total_score']}/100 ({data['status']})")
    
    def test_tax_rates(self):
        """Test tax rates endpoint"""
        response = requests.get(f"{BASE_URL}/api/tax-rates")
        assert response.status_code == 200
        data = response.json()
        
        assert "personal" in data
        assert "company" in data
        assert data["personal"]["year"] == "2024-25"
        
        print("✓ Tax rates endpoint working")


class TestScenarioComparisonAPIs:
    """Test APIs that support Scenario Comparison functionality"""
    
    def test_tax_analysis(self):
        """Test tax analysis for scenario calculations"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/tax",
            params={
                "taxable_income": 185000,
                "entity_type": "personal"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "taxable_income" in data
        assert "total_tax" in data
        assert "effective_rate" in data
        assert "net_income" in data
        
        print(f"✓ Tax Analysis: ${data['total_tax']:,.0f} tax on ${data['taxable_income']:,.0f}")
    
    def test_loan_analysis(self):
        """Test loan repayment calculations"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/loan",
            params={
                "principal": 500000,
                "annual_rate": 6.5,
                "years": 30
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "monthly_payment" in data
        assert "total_repayment" in data
        assert "total_interest" in data
        assert "variable_rate_scenarios" in data
        
        print(f"✓ Loan Analysis: ${data['monthly_payment']:,.0f}/month")
    
    def test_debt_equity_analysis(self):
        """Test debt to equity ratio calculation"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/debt-equity",
            params={
                "total_assets": 2920000,
                "total_debt": 942000
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "equity" in data
        assert "debt_to_equity_ratio" in data
        assert "debt_to_assets_ratio" in data
        
        expected_equity = 2920000 - 942000
        assert data["equity"] == expected_equity
        
        print(f"✓ Debt/Equity: Ratio {data['debt_to_equity_ratio']:.2f}")


class TestExistingPages:
    """Test APIs for existing pages that should still work"""
    
    def test_crm_households(self):
        """Test CRM households endpoint"""
        response = requests.get(f"{BASE_URL}/api/crm/households")
        assert response.status_code == 200
        data = response.json()
        
        # API returns {"households": [...], "total": N}
        assert "households" in data
        households = data["households"]
        assert isinstance(households, list)
        assert len(households) >= 3  # Wheeler, Chen, Patel
        
        # Verify household structure
        household_names = [h["name"] for h in households]
        assert "Wheeler Family" in household_names
        
        print(f"✓ CRM Households: {len(households)} households")
    
    def test_crm_tasks(self):
        """Test CRM tasks endpoint"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ CRM Tasks: {len(data)} tasks")
    
    def test_crm_meetings(self):
        """Test CRM meetings endpoint"""
        response = requests.get(f"{BASE_URL}/api/crm/meetings")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ CRM Meetings: {len(data)} meetings")
    
    def test_smsf_analysis(self):
        """Test SMSF contribution analysis"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/smsf",
            params={
                "age": 45,
                "current_super_balance": 580000,
                "taxable_income": 185000,
                "employer_contribution": 20000,
                "salary_sacrifice": 5000
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "contributions" in data
        assert "caps" in data
        assert "tax_analysis" in data
        assert "projections" in data
        
        print(f"✓ SMSF Analysis: Projected balance ${data['projections']['projected_balance_at_67']:,.0f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
