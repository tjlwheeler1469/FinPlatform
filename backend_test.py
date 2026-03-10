import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import time

class AustralianInvestmentAPITester:
    def __init__(self, base_url="https://wealth-optimizer-au.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"name": name, "details": details})

    def test_health_check(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Response: {data}"
            self.log_test("Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("Health Check", False, str(e))
            return False

    def test_root_endpoint(self):
        """Test root API endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("Root Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Root Endpoint", False, str(e))
            return False

    def test_tax_rates_api(self):
        """Test tax rates API - should return current 2024-25 Australian rates"""
        try:
            response = requests.get(f"{self.api_url}/tax-rates", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify it has expected structure
                has_personal = 'personal' in data
                has_company = 'company' in data
                has_brackets = has_personal and 'brackets' in data['personal']
                
                success = has_personal and has_company and has_brackets
                details = f"Status: {response.status_code}, Has personal: {has_personal}, Has company: {has_company}, Has brackets: {has_brackets}"
                
                if success:
                    # Check for 2024-25 tax year
                    year = data['personal'].get('year', '')
                    success = '2024-25' in year
                    details += f", Year: {year}"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Tax Rates API (2024-25)", success, details)
            return success
        except Exception as e:
            self.log_test("Tax Rates API (2024-25)", False, str(e))
            return False

    def test_personal_tax_calculation(self):
        """Test personal tax calculation at $120,000 income"""
        try:
            response = requests.post(
                f"{self.api_url}/analyze/tax",
                params={
                    "taxable_income": 120000,
                    "entity_type": "personal"
                },
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected fields
                required_fields = ['taxable_income', 'income_tax', 'medicare_levy', 'total_tax', 'effective_rate', 'net_income']
                has_fields = all(field in data for field in required_fields)
                
                # Check reasonable values for $120k income
                reasonable_tax = 20000 <= data.get('total_tax', 0) <= 40000
                reasonable_rate = 20 <= data.get('effective_rate', 0) <= 35
                
                success = has_fields and reasonable_tax and reasonable_rate
                details = f"Status: {response.status_code}, Total tax: ${data.get('total_tax', 0):,.0f}, Rate: {data.get('effective_rate', 0):.1f}%"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Personal Tax Calculation ($120k)", success, details)
            return success
        except Exception as e:
            self.log_test("Personal Tax Calculation ($120k)", False, str(e))
            return False

    def test_company_tax_calculation(self):
        """Test company tax calculation"""
        try:
            response = requests.post(
                f"{self.api_url}/analyze/tax",
                params={
                    "taxable_income": 100000,
                    "entity_type": "company",
                    "is_base_rate_entity": True
                },
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected fields
                required_fields = ['taxable_income', 'company_tax', 'net_profit', 'tax_rate']
                has_fields = all(field in data for field in required_fields)
                
                # Check 25% rate for base rate entity
                expected_tax = 25000  # 25% of 100k
                actual_tax = data.get('company_tax', 0)
                correct_tax = abs(actual_tax - expected_tax) < 100
                
                success = has_fields and correct_tax
                details = f"Status: {response.status_code}, Tax: ${actual_tax:,.0f}, Rate: {data.get('tax_rate', 0)}%"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Company Tax Calculation", success, details)
            return success
        except Exception as e:
            self.log_test("Company Tax Calculation", False, str(e))
            return False

    def test_franking_credits_calculator(self):
        """Test franking credits calculator API"""
        try:
            response = requests.post(
                f"{self.api_url}/analyze/franking",
                params={
                    "dividend": 10000,
                    "franking_percentage": 100
                },
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected fields
                required_fields = ['cash_dividend', 'franking_credit', 'grossed_up_dividend']
                has_fields = all(field in data for field in required_fields)
                
                # Check reasonable franking credit (should be around 25% of dividend for base rate)
                franking_credit = data.get('franking_credit', 0)
                reasonable_credit = 2000 <= franking_credit <= 4000  # Roughly 25-40% of $10k
                
                success = has_fields and reasonable_credit
                details = f"Status: {response.status_code}, Franking credit: ${franking_credit:,.0f}"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Franking Credits Calculator", success, details)
            return success
        except Exception as e:
            self.log_test("Franking Credits Calculator", False, str(e))
            return False

    def test_negative_gearing_calculator(self):
        """Test negative gearing calculator API for properties"""
        try:
            property_data = {
                "name": "Test Property",
                "value": 800000,
                "rental_income": 35000,
                "mortgage_amount": 600000,
                "mortgage_rate": 6.5,
                "mortgage_term_years": 30,
                "annual_expenses": 8000,
                "depreciation_building": 5000,
                "depreciation_fixtures": 2000
            }
            
            response = requests.post(
                f"{self.api_url}/analyze/negative-gearing",
                json=property_data,
                params={"marginal_tax_rate": 0.30},
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected fields
                required_fields = ['property_name', 'net_rental_income', 'is_negatively_geared', 'cash_flow_after_tax']
                has_fields = all(field in data for field in required_fields)
                
                # Check if calculation makes sense
                has_property_name = data.get('property_name') == "Test Property"
                has_boolean_gearing = isinstance(data.get('is_negatively_geared'), bool)
                
                success = has_fields and has_property_name and has_boolean_gearing
                details = f"Status: {response.status_code}, Negatively geared: {data.get('is_negatively_geared')}, Cash flow: ${data.get('cash_flow_after_tax', 0):,.0f}"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Negative Gearing Calculator", success, details)
            return success
        except Exception as e:
            self.log_test("Negative Gearing Calculator", False, str(e))
            return False

    def test_monte_carlo_simulation(self):
        """Test Monte Carlo simulation API"""
        try:
            response = requests.post(
                f"{self.api_url}/analyze/monte-carlo",
                params={
                    "initial_value": 100000,
                    "expected_return": 0.07,
                    "volatility": 0.15,
                    "years": 10,
                    "simulations": 1000
                },
                timeout=15  # Longer timeout for simulation
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected fields
                required_fields = ['initial_value', 'final_value_mean', 'final_value_median', 'percentile_projections']
                has_fields = all(field in data for field in required_fields)
                
                # Check reasonable results
                initial = data.get('initial_value', 0)
                final_mean = data.get('final_value_mean', 0)
                growth_reasonable = final_mean > initial * 1.5  # Should grow over 10 years
                
                # Check percentile projections structure
                projections = data.get('percentile_projections', {})
                has_projections = 'years' in projections and 'p50' in projections
                
                success = has_fields and growth_reasonable and has_projections
                details = f"Status: {response.status_code}, Mean final: ${final_mean:,.0f}, Growth: {(final_mean/initial-1)*100:.1f}%"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Monte Carlo Simulation", success, details)
            return success
        except Exception as e:
            self.log_test("Monte Carlo Simulation", False, str(e))
            return False

    def test_loan_calculator(self):
        """Test loan calculator API with variable rate scenarios"""
        try:
            response = requests.post(
                f"{self.api_url}/analyze/loan",
                params={
                    "principal": 500000,
                    "annual_rate": 6.5,
                    "years": 30
                },
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected fields
                required_fields = ['principal', 'monthly_payment', 'total_interest', 'variable_rate_scenarios']
                has_fields = all(field in data for field in required_fields)
                
                # Check reasonable monthly payment for $500k at 6.5%
                monthly = data.get('monthly_payment', 0)
                reasonable_payment = 2500 <= monthly <= 4000
                
                # Check variable rate scenarios
                scenarios = data.get('variable_rate_scenarios', [])
                has_scenarios = len(scenarios) >= 3  # Should have multiple scenarios
                
                success = has_fields and reasonable_payment and has_scenarios
                details = f"Status: {response.status_code}, Monthly: ${monthly:,.0f}, Scenarios: {len(scenarios)}"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Loan Calculator", success, details)
            return success
        except Exception as e:
            self.log_test("Loan Calculator", False, str(e))
            return False

    def test_debt_to_equity_calculator(self):
        """Test debt to equity ratio calculator API"""
        try:
            response = requests.post(
                f"{self.api_url}/analyze/debt-equity",
                params={
                    "total_assets": 1000000,
                    "total_debt": 600000
                },
                timeout=10
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected fields
                required_fields = ['total_assets', 'total_debt', 'equity', 'debt_to_equity_ratio']
                has_fields = all(field in data for field in required_fields)
                
                # Check calculations
                expected_equity = 400000  # 1M - 600k
                expected_ratio = 1.5  # 600k / 400k
                
                actual_equity = data.get('equity', 0)
                actual_ratio = data.get('debt_to_equity_ratio', 0)
                
                correct_equity = abs(actual_equity - expected_equity) < 1000
                correct_ratio = abs(actual_ratio - expected_ratio) < 0.1
                
                success = has_fields and correct_equity and correct_ratio
                details = f"Status: {response.status_code}, Equity: ${actual_equity:,.0f}, D/E Ratio: {actual_ratio:.2f}"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Debt to Equity Calculator", success, details)
            return success
        except Exception as e:
            self.log_test("Debt to Equity Calculator", False, str(e))
            return False

    def test_full_scenario_analysis(self):
        """Test full scenario analysis API"""
        try:
            scenario_data = {
                "name": "Test Scenario",
                "entity_type": "personal",
                "taxable_income": 120000,
                "investments": {
                    "cash_savings": 50000,
                    "shares_value": 100000,
                    "shares_dividend_yield": 4.0,
                    "franking_percentage": 100,
                    "properties": [{
                        "name": "Investment Property",
                        "value": 800000,
                        "rental_income": 35000,
                        "mortgage_amount": 600000,
                        "mortgage_rate": 6.5,
                        "annual_expenses": 8000
                    }]
                },
                "expenses": {
                    "school_fees": 15000,
                    "work_related": 5000
                },
                "simulation_years": 10
            }
            
            response = requests.post(
                f"{self.api_url}/analyze/full-scenario",
                json=scenario_data,
                timeout=15
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                # Verify expected sections
                required_sections = ['summary', 'tax_analysis', 'property_analyses', 'debt_equity_analysis']
                has_sections = all(section in data for section in required_sections)
                
                # Check summary data
                summary = data.get('summary', {})
                has_summary_fields = 'total_assets' in summary and 'net_worth' in summary
                
                success = has_sections and has_summary_fields
                details = f"Status: {response.status_code}, Net worth: ${summary.get('net_worth', 0):,.0f}"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Full Scenario Analysis", success, details)
            return success
        except Exception as e:
            self.log_test("Full Scenario Analysis", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🧪 Starting Australian Investment Analysis API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Basic connectivity tests
        self.test_health_check()
        self.test_root_endpoint()
        
        # Tax and rates tests
        self.test_tax_rates_api()
        self.test_personal_tax_calculation()
        self.test_company_tax_calculation()
        
        # Investment analysis tests
        self.test_franking_credits_calculator()
        self.test_negative_gearing_calculator()
        self.test_monte_carlo_simulation()
        
        # Loan and debt tests
        self.test_loan_calculator()
        self.test_debt_to_equity_calculator()
        
        # Comprehensive analysis
        self.test_full_scenario_analysis()
        
        # Summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  • {test['name']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ success as passing

def main():
    """Main test execution"""
    tester = AustralianInvestmentAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())