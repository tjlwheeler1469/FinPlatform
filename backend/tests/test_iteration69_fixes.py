"""
Iteration 69 - Testing fixes for:
1. Stock Screener page (/stock-research) - displays within app layout (NOT as popup)
2. Calculator endpoints work with Query params (loan, monte-carlo, smsf, debt-equity)
3. New Trading pages: Bonds, Cash & Term Deposits, Managed Funds
4. Navigation shows all new Trading items
5. Default route (/) redirects to /daily-briefing
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://knowledge-graph-ui.preview.emergentagent.com').rstrip('/')


class TestCalculatorEndpoints:
    """Test all calculator endpoints now accept Query params"""

    def test_loan_calculator(self):
        """Test loan calculator with query params"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/loan",
            params={
                "principal": 500000,
                "annual_rate": 6.5,
                "years": 30
            }
        )
        assert response.status_code == 200, f"Loan calculator failed: {response.text}"
        data = response.json()
        assert "principal" in data
        assert "monthly_payment" in data
        assert "total_interest" in data
        assert data["principal"] == 500000
        assert data["term_years"] == 30
        print(f"✓ Loan Calculator: Monthly payment ${data['monthly_payment']:.2f}")

    def test_monte_carlo_simulator(self):
        """Test Monte Carlo simulator with query params"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/monte-carlo",
            params={
                "initial_value": 100000,
                "expected_return": 0.07,
                "volatility": 0.15,
                "years": 10,
                "simulations": 100
            }
        )
        assert response.status_code == 200, f"Monte Carlo failed: {response.text}"
        data = response.json()
        assert "initial_value" in data
        assert "final_value_mean" in data
        assert "percentile_projections" in data
        assert data["initial_value"] == 100000
        print(f"✓ Monte Carlo: Projected mean ${data['final_value_mean']:.2f}")

    def test_smsf_optimizer(self):
        """Test SMSF optimizer with query params"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/smsf",
            params={
                "age": 45,
                "current_super_balance": 500000,
                "taxable_income": 150000,
                "employer_contribution": 15000,
                "salary_sacrifice": 5000
            }
        )
        assert response.status_code == 200, f"SMSF optimizer failed: {response.text}"
        data = response.json()
        assert "current_contributions" in data
        assert "caps" in data
        assert "tax_analysis" in data
        assert "projections" in data
        assert "recommendations" in data
        print(f"✓ SMSF Optimizer: Projected balance at 67 = ${data['projections']['projected_balance_at_67']:.2f}")

    def test_debt_equity_calculator(self):
        """Test debt-equity calculator with query params"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/debt-equity",
            params={
                "total_assets": 2000000,
                "total_debt": 800000
            }
        )
        assert response.status_code == 200, f"Debt-equity calculator failed: {response.text}"
        data = response.json()
        assert "equity" in data
        assert "debt_to_equity_ratio" in data
        assert "debt_to_assets_ratio" in data
        assert data["total_assets"] == 2000000
        assert data["total_debt"] == 800000
        assert data["equity"] == 1200000
        print(f"✓ Debt/Equity: Ratio = {data['debt_to_equity_ratio']:.2f}")


class TestResearchEndpoints:
    """Test Stock Research endpoints for Stock Screener page"""

    def test_stock_screener_endpoint(self):
        """Test stock screener endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/research/screener",
            json={"limit": 10}
        )
        assert response.status_code == 200, f"Stock screener failed: {response.text}"
        data = response.json()
        assert "stocks" in data
        print(f"✓ Stock Screener: {len(data['stocks'])} stocks returned")

    def test_intrinsic_values_endpoint(self):
        """Test intrinsic values endpoint"""
        response = requests.get(f"{BASE_URL}/api/research/intrinsic-values?limit=5")
        assert response.status_code == 200, f"Intrinsic values failed: {response.text}"
        data = response.json()
        assert "stocks" in data
        print(f"✓ Intrinsic Values: {len(data['stocks'])} stocks returned")

    def test_dividends_calendar(self):
        """Test dividends calendar endpoint"""
        response = requests.get(f"{BASE_URL}/api/research/dividends/calendar")
        assert response.status_code == 200, f"Dividends calendar failed: {response.text}"
        data = response.json()
        assert "dividends" in data
        print(f"✓ Dividends Calendar: {len(data['dividends'])} entries")

    def test_market_alerts(self):
        """Test market alerts endpoint"""
        response = requests.get(f"{BASE_URL}/api/research/market-alerts")
        assert response.status_code == 200, f"Market alerts failed: {response.text}"
        data = response.json()
        assert "alerts" in data
        print(f"✓ Market Alerts: {len(data['alerts'])} alerts")

    def test_sectors_endpoint(self):
        """Test sectors endpoint"""
        response = requests.get(f"{BASE_URL}/api/research/sectors")
        assert response.status_code == 200, f"Sectors failed: {response.text}"
        data = response.json()
        assert "sectors" in data
        print(f"✓ Sectors: {len(data['sectors'])} sectors")


class TestHealthAndVersion:
    """Test health endpoint and API status"""

    def test_health_endpoint(self):
        """Test health endpoint returns expected version"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert "version" in data
        assert "status" in data
        assert data["status"] == "healthy"
        print(f"✓ Health: Version {data['version']}, Status: {data['status']}")


class TestFrankingAndNegativeGearing:
    """Test franking and negative gearing endpoints"""

    def test_franking_credits(self):
        """Test franking credits calculation"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/franking",
            json={
                "dividend": 1000,
                "franking_percentage": 100
            }
        )
        assert response.status_code == 200, f"Franking credits failed: {response.text}"
        data = response.json()
        assert "franking_credit" in data
        assert "grossed_up_dividend" in data
        print(f"✓ Franking Credits: ${data['franking_credit']:.2f}")

    def test_negative_gearing(self):
        """Test negative gearing calculation"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/negative-gearing",
            json={
                "property_data": {
                    "name": "Test Property",
                    "value": 800000,
                    "rental_income": 30000,
                    "mortgage_amount": 600000,
                    "mortgage_rate": 6.5,
                    "annual_expenses": 5000,
                    "depreciation_building": 8000,
                    "depreciation_fixtures": 2000
                },
                "marginal_tax_rate": 0.37
            }
        )
        assert response.status_code == 200, f"Negative gearing failed: {response.text}"
        data = response.json()
        assert "is_negatively_geared" in data
        assert "annual_tax_benefit" in data
        print(f"✓ Negative Gearing: Tax benefit ${data['annual_tax_benefit']:.2f}")


class TestTaxComparison:
    """Test tax comparison endpoint"""

    def test_tax_comparison(self):
        """Test tax comparison calculation"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/tax-comparison",
            params={
                "income": 150000,
                "deductions": 5000
            }
        )
        assert response.status_code == 200, f"Tax comparison failed: {response.text}"
        data = response.json()
        assert "taxable_income" in data
        assert "comparison" in data
        assert "savings" in data
        assert len(data["comparison"]) == 2  # 2024-25 and 2023-24
        print(f"✓ Tax Comparison: Savings from new rates ${data['savings']['amount']:.2f}")


# Run tests when executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
