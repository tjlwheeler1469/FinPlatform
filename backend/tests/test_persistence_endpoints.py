"""
Backend API tests for new persistence endpoints:
- Net Worth History (trends/net-worth)
- Debt Management (planning/debts)
- Insurance Coverage (planning/insurance)
- Revenue Tracking (billing/revenue)

Also tests backend refactoring - health endpoint and modular imports
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRefactoring:
    """Test backend health and modular refactoring"""
    
    def test_health_endpoint(self):
        """Verify server starts and health endpoint works after refactoring"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print(f"✓ Health endpoint working: {data}")
    
    def test_root_endpoint(self):
        """Verify root API endpoint works"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Australian Investment Analyzer" in data["message"]
        print(f"✓ Root endpoint working: {data}")
    
    def test_tax_rates_endpoint(self):
        """Verify tax rates endpoint works (uses imported tax_constants)"""
        response = requests.get(f"{BASE_URL}/api/tax-rates")
        assert response.status_code == 200
        data = response.json()
        assert "personal" in data
        assert "company" in data
        assert data["personal"]["year"] == "2024-25"
        print("✓ Tax rates endpoint working - confirms modular imports")


class TestNetWorthHistory:
    """Test GET /api/trends/net-worth/{household_id} and POST /api/trends/net-worth/snapshot"""
    
    def test_get_net_worth_history_demo_data(self):
        """GET /api/trends/net-worth/{household_id} - returns demo data when no real data"""
        household_id = "test_household_001"
        response = requests.get(f"{BASE_URL}/api/trends/net-worth/{household_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "household_id" in data
        assert data["household_id"] == household_id
        assert "history" in data
        assert "source" in data
        assert "data_points" in data
        
        # Verify history data structure
        assert len(data["history"]) > 0
        first_entry = data["history"][0]
        assert "date" in first_entry
        assert "net_worth" in first_entry
        assert "total_assets" in first_entry
        assert "total_liabilities" in first_entry
        
        print(f"✓ Net worth history returned {data['data_points']} data points (source: {data['source']})")
    
    def test_save_net_worth_snapshot(self):
        """POST /api/trends/net-worth/snapshot - saves net worth snapshot"""
        snapshot_data = {
            "household_id": "TEST_household_snapshot",
            "date": "2024-01",
            "net_worth": 1500000,
            "total_assets": 2200000,
            "total_liabilities": 700000,
            "breakdown": {
                "property": 1500000,
                "super": 400000,
                "shares": 200000,
                "cash": 100000
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/trends/net-worth/snapshot",
            json=snapshot_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert data["date"] == "2024-01"
        print(f"✓ Net worth snapshot saved successfully for date {data['date']}")
    
    def test_get_net_worth_with_months_param(self):
        """GET /api/trends/net-worth/{household_id}?months=6 - respects months parameter"""
        household_id = "test_household_002"
        response = requests.get(f"{BASE_URL}/api/trends/net-worth/{household_id}?months=6")
        
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        # Should return approximately 6 months of data (may be 7 due to inclusive range)
        assert len(data["history"]) <= 10
        print(f"✓ Net worth history with months=6 returned {len(data['history'])} data points")


class TestDebtManagement:
    """Test CRUD for /api/planning/debts endpoints"""
    
    def test_get_debts_demo_data(self):
        """GET /api/planning/debts/{household_id} - returns demo data when no real data"""
        household_id = "test_household_debts"
        response = requests.get(f"{BASE_URL}/api/planning/debts/{household_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "household_id" in data
        assert data["household_id"] == household_id
        assert "debts" in data
        assert "total_debt" in data
        assert "total_minimum_payment" in data
        assert "source" in data
        
        # Verify debts array structure
        assert len(data["debts"]) > 0
        first_debt = data["debts"][0]
        assert "debt_id" in first_debt
        assert "name" in first_debt
        assert "debt_type" in first_debt
        assert "balance" in first_debt
        assert "interest_rate" in first_debt
        assert "minimum_payment" in first_debt
        
        print(f"✓ Debts returned {len(data['debts'])} items, total: ${data['total_debt']:,} (source: {data['source']})")
    
    def test_save_debt_item(self):
        """POST /api/planning/debts - saves debt item"""
        debt_data = {
            "debt_id": "TEST_debt_001",
            "household_id": "TEST_household_debt_save",
            "name": "Test Personal Loan",
            "debt_type": "personal",
            "balance": 15000,
            "interest_rate": 9.99,
            "minimum_payment": 350,
            "term_months": 48
        }
        
        response = requests.post(
            f"{BASE_URL}/api/planning/debts",
            json=debt_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert data["debt_id"] == "TEST_debt_001"
        print(f"✓ Debt item saved successfully: {data['debt_id']}")
    
    def test_get_saved_debt(self):
        """Verify saved debt appears in GET response"""
        # First save a debt
        debt_data = {
            "debt_id": "TEST_debt_verify",
            "household_id": "TEST_household_verify",
            "name": "Verification Loan",
            "debt_type": "car",
            "balance": 20000,
            "interest_rate": 7.5,
            "minimum_payment": 400
        }
        
        save_response = requests.post(
            f"{BASE_URL}/api/planning/debts",
            json=debt_data
        )
        assert save_response.status_code == 200
        
        # Then get debts for that household
        get_response = requests.get(f"{BASE_URL}/api/planning/debts/TEST_household_verify")
        assert get_response.status_code == 200
        data = get_response.json()
        
        # Should have our saved debt
        assert data["source"] == "database"
        debt_ids = [d["debt_id"] for d in data["debts"]]
        assert "TEST_debt_verify" in debt_ids
        print("✓ Saved debt verified in GET response (source: database)")
    
    def test_delete_debt(self):
        """DELETE /api/planning/debts/{debt_id} - deletes debt"""
        # First save a debt to delete
        debt_data = {
            "debt_id": "TEST_debt_to_delete",
            "household_id": "TEST_household_delete",
            "name": "Debt to Delete",
            "debt_type": "credit",
            "balance": 5000,
            "interest_rate": 19.99,
            "minimum_payment": 100
        }
        
        save_response = requests.post(
            f"{BASE_URL}/api/planning/debts",
            json=debt_data
        )
        assert save_response.status_code == 200
        
        # Delete the debt
        delete_response = requests.delete(f"{BASE_URL}/api/planning/debts/TEST_debt_to_delete")
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["success"]
        assert data["debt_id"] == "TEST_debt_to_delete"
        print(f"✓ Debt deleted successfully: {data['debt_id']}")


class TestInsuranceCoverage:
    """Test CRUD for /api/planning/insurance endpoints"""
    
    def test_get_insurance_demo_data(self):
        """GET /api/planning/insurance/{household_id} - returns demo data when no real data"""
        household_id = "test_household_insurance"
        response = requests.get(f"{BASE_URL}/api/planning/insurance/{household_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "household_id" in data
        assert data["household_id"] == household_id
        assert "coverage" in data
        assert "source" in data
        
        # Verify coverage array structure
        assert len(data["coverage"]) > 0
        first_coverage = data["coverage"][0]
        assert "coverage_id" in first_coverage
        assert "insurance_type" in first_coverage
        assert "cover_amount" in first_coverage
        
        # Verify all insurance types are present in demo data
        insurance_types = [c["insurance_type"] for c in data["coverage"]]
        assert "life" in insurance_types
        assert "income" in insurance_types
        assert "tpd" in insurance_types
        assert "trauma" in insurance_types
        
        print(f"✓ Insurance coverage returned {len(data['coverage'])} policies (source: {data['source']})")
    
    def test_save_insurance_coverage(self):
        """POST /api/planning/insurance - saves insurance coverage"""
        coverage_data = {
            "coverage_id": "TEST_ins_001",
            "household_id": "TEST_household_insurance_save",
            "insurance_type": "life",
            "provider": "Test Insurance Co",
            "policy_number": "POL-12345",
            "cover_amount": 1000000,
            "premium_monthly": 150,
            "premium_frequency": "monthly",
            "expiry_date": "2030-12-31"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/planning/insurance",
            json=coverage_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert data["coverage_id"] == "TEST_ins_001"
        print(f"✓ Insurance coverage saved successfully: {data['coverage_id']}")
    
    def test_get_saved_insurance(self):
        """Verify saved insurance appears in GET response"""
        # First save insurance
        coverage_data = {
            "coverage_id": "TEST_ins_verify",
            "household_id": "TEST_household_ins_verify",
            "insurance_type": "income",
            "cover_amount": 10000,
            "premium_monthly": 200
        }
        
        save_response = requests.post(
            f"{BASE_URL}/api/planning/insurance",
            json=coverage_data
        )
        assert save_response.status_code == 200
        
        # Then get insurance for that household
        get_response = requests.get(f"{BASE_URL}/api/planning/insurance/TEST_household_ins_verify")
        assert get_response.status_code == 200
        data = get_response.json()
        
        # Should have our saved coverage
        assert data["source"] == "database"
        coverage_ids = [c["coverage_id"] for c in data["coverage"]]
        assert "TEST_ins_verify" in coverage_ids
        print("✓ Saved insurance verified in GET response (source: database)")


class TestRevenueTracking:
    """Test GET /api/billing/revenue/{adviser_id}"""
    
    def test_get_revenue_history_demo_data(self):
        """GET /api/billing/revenue/{adviser_id} - returns demo data when no real data"""
        adviser_id = "test_adviser_001"
        response = requests.get(f"{BASE_URL}/api/billing/revenue/{adviser_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "adviser_id" in data
        assert data["adviser_id"] == adviser_id
        assert "history" in data
        assert "source" in data
        
        # Verify history data structure
        assert len(data["history"]) > 0
        first_entry = data["history"][0]
        assert "month" in first_entry
        assert "advice_fees" in first_entry
        assert "service_fees" in first_entry
        assert "commissions" in first_entry
        assert "total" in first_entry
        
        print(f"✓ Revenue history returned {len(data['history'])} months (source: {data['source']})")
    
    def test_get_revenue_with_months_param(self):
        """GET /api/billing/revenue/{adviser_id}?months=6 - respects months parameter"""
        adviser_id = "test_adviser_002"
        response = requests.get(f"{BASE_URL}/api/billing/revenue/{adviser_id}?months=6")
        
        assert response.status_code == 200
        data = response.json()
        assert "history" in data
        # Should return approximately 6 months of data
        assert len(data["history"]) <= 8
        print(f"✓ Revenue history with months=6 returned {len(data['history'])} months")
    
    def test_revenue_data_values(self):
        """Verify revenue data has reasonable values"""
        adviser_id = "test_adviser_003"
        response = requests.get(f"{BASE_URL}/api/billing/revenue/{adviser_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        for entry in data["history"]:
            # Verify total equals sum of components
            calculated_total = entry["advice_fees"] + entry["service_fees"] + entry["commissions"]
            assert abs(entry["total"] - calculated_total) <= 2  # Allow for rounding
            
            # Verify values are positive
            assert entry["advice_fees"] >= 0
            assert entry["service_fees"] >= 0
            assert entry["commissions"] >= 0
            assert entry["total"] > 0
        
        print("✓ Revenue data values validated - all totals match component sums")


class TestExistingEndpoints:
    """Verify existing endpoints still work after refactoring"""
    
    def test_analyze_tax_endpoint(self):
        """POST /api/analyze/tax - verify tax calculation still works"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/tax",
            params={"taxable_income": 100000, "entity_type": "personal"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "taxable_income" in data
        assert "total_tax" in data
        assert "effective_rate" in data
        assert data["taxable_income"] == 100000
        print(f"✓ Tax analysis working: ${data['total_tax']:,.0f} tax on $100k income")
    
    def test_analyze_loan_endpoint(self):
        """POST /api/analyze/loan - verify loan calculation still works"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/loan",
            params={"principal": 500000, "annual_rate": 6.5, "years": 30}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "principal" in data
        assert "monthly_payment" in data
        assert "total_interest" in data
        print(f"✓ Loan analysis working: ${data['monthly_payment']:,.0f}/month for $500k loan")
    
    def test_enterprise_practice_overview(self):
        """GET /api/enterprise/practice-overview - verify practice overview works"""
        response = requests.get(f"{BASE_URL}/api/enterprise/practice-overview")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_clients" in data
        assert "total_aum" in data
        print(f"✓ Practice overview working: {data['total_clients']} clients, ${data['total_aum']:,} AUM")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests complete"""
    yield
    # Cleanup would require direct MongoDB access
    # For now, test data with TEST_ prefix can be identified and cleaned manually
    print("\n⚠ Test data with TEST_ prefix created - manual cleanup may be needed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
