"""
Iteration 74 - Transaction Modeler & Client Creation Tests
Testing:
1. Transaction Modeler API - Property, Fund, Stock modeling
2. Client Creation via CRM modal
3. Client Update API
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTransactionModelerPropertyAPI:
    """Test Transaction Modeler Property endpoint POST /api/transaction-modeling/property"""
    
    def test_property_buy_scenario_basic(self):
        """Test property buy scenario with basic parameters"""
        payload = {
            "transaction_type": "buy",
            "property_value": 850000,
            "deposit_percent": 20,
            "loan_interest_rate": 6.5,
            "loan_term_years": 30,
            "expected_rental_yield": 4.0,
            "expected_capital_growth": 5.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/property?client_id=client_1",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "client_id" in data, "Response should include client_id"
        assert "transaction_type" in data, "Response should include transaction_type"
        assert "analysis" in data, "Response should include analysis"
        
        # Verify analysis structure for buy scenario
        analysis = data["analysis"]
        assert "purchase_costs" in analysis, "Analysis should include purchase_costs"
        assert "loan_details" in analysis, "Analysis should include loan_details"
        assert "cash_flow" in analysis, "Analysis should include cash_flow"
        assert "summary" in analysis, "Analysis should include summary"
        
        print(f"Property buy scenario test PASSED - Total upfront cost: ${analysis['purchase_costs']['total_upfront_cost']:,.0f}")
    
    def test_property_buy_upfront_costs_calculation(self):
        """Verify upfront costs are calculated correctly (deposit, stamp duty, legal fees)"""
        payload = {
            "transaction_type": "buy",
            "property_value": 850000,
            "deposit_percent": 20,
            "loan_interest_rate": 6.5,
            "loan_term_years": 30,
            "expected_rental_yield": 4.0,
            "expected_capital_growth": 5.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/property?client_id=client_1",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        purchase_costs = data["analysis"]["purchase_costs"]
        
        # Verify deposit calculation: 850000 * 20% = 170000
        expected_deposit = 850000 * 0.20
        assert purchase_costs["deposit"] == expected_deposit, f"Deposit should be {expected_deposit}"
        assert purchase_costs["deposit_percent"] == 20, "Deposit percent should be 20"
        
        # Verify stamp duty exists and is positive
        assert purchase_costs["stamp_duty"] > 0, "Stamp duty should be calculated"
        
        # Verify legal fees and other costs exist
        assert purchase_costs["legal_fees"] > 0, "Legal fees should be present"
        assert purchase_costs["other_costs"] > 0, "Other costs should be present"
        
        # Verify total upfront cost
        assert purchase_costs["total_upfront_cost"] > expected_deposit, "Total upfront should be more than deposit"
        
        print("Upfront costs verification PASSED:")
        print(f"  Deposit: ${purchase_costs['deposit']:,.0f}")
        print(f"  Stamp Duty: ${purchase_costs['stamp_duty']:,.0f}")
        print(f"  Legal Fees: ${purchase_costs['legal_fees']:,.0f}")
        print(f"  Total: ${purchase_costs['total_upfront_cost']:,.0f}")
    
    def test_property_buy_cash_flow_calculation(self):
        """Verify annual cash flow is calculated (rental income, loan repayments)"""
        payload = {
            "transaction_type": "buy",
            "property_value": 850000,
            "deposit_percent": 20,
            "loan_interest_rate": 6.5,
            "loan_term_years": 30,
            "expected_rental_yield": 4.0,
            "expected_capital_growth": 5.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/property?client_id=client_1",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        cash_flow = data["analysis"]["cash_flow"]
        
        # Verify cash flow components exist
        assert "annual_rental_income" in cash_flow, "Should have annual_rental_income"
        assert "annual_loan_payment" in cash_flow, "Should have annual_loan_payment"
        assert "net_annual_cashflow" in cash_flow, "Should have net_annual_cashflow"
        assert "is_positively_geared" in cash_flow, "Should have is_positively_geared indicator"
        
        # Verify values are reasonable
        assert cash_flow["annual_rental_income"] > 0, "Rental income should be positive"
        assert cash_flow["annual_loan_payment"] > 0, "Loan payment should be positive"
        
        print("Cash flow verification PASSED:")
        print(f"  Annual Rental: ${cash_flow['annual_rental_income']:,.0f}")
        print(f"  Annual Loan Payment: ${cash_flow['annual_loan_payment']:,.0f}")
        print(f"  Net Cash Flow: ${cash_flow['net_annual_cashflow']:,.0f}")
        print(f"  Positively Geared: {cash_flow['is_positively_geared']}")
    
    def test_property_buy_10_year_projection(self):
        """Verify 10-year projection is calculated"""
        payload = {
            "transaction_type": "buy",
            "property_value": 850000,
            "deposit_percent": 20,
            "loan_interest_rate": 6.5,
            "loan_term_years": 30,
            "expected_rental_yield": 4.0,
            "expected_capital_growth": 5.0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/property?client_id=client_1",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        summary = data["analysis"]["summary"]
        
        # Verify 10-year summary exists
        assert "10_year_capital_growth" in summary, "Should have 10_year_capital_growth"
        assert "10_year_rental_income" in summary, "Should have 10_year_rental_income"
        assert "10_year_total_return" in summary, "Should have 10_year_total_return"
        assert "roi_10_year" in summary, "Should have roi_10_year"
        
        # Verify values are positive for growth scenario
        assert summary["10_year_capital_growth"] > 0, "Capital growth should be positive"
        assert summary["10_year_rental_income"] > 0, "Rental income should be positive"
        assert summary["10_year_total_return"] > 0, "Total return should be positive"
        
        print("10-year projection verification PASSED:")
        print(f"  Capital Growth: ${summary['10_year_capital_growth']:,.0f}")
        print(f"  Rental Income: ${summary['10_year_rental_income']:,.0f}")
        print(f"  Total Return: ${summary['10_year_total_return']:,.0f}")
        print(f"  ROI: {summary['roi_10_year']}%")


class TestTransactionModelerFundAPI:
    """Test Transaction Modeler Fund endpoint POST /api/transaction-modeling/fund"""
    
    def test_fund_buy_scenario_basic(self):
        """Test fund investment scenario"""
        payload = {
            "transaction_type": "buy",
            "fund_name": "Vanguard Australian Shares Index ETF",
            "amount": 100000,
            "expected_return": 7.0,
            "management_fee": 0.10,
            "distribution_yield": 3.5
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/fund?client_id=client_1",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "client_id" in data
        assert "transaction_type" in data
        assert "fund_name" in data
        assert "analysis" in data
        
        analysis = data["analysis"]
        assert "investment_details" in analysis
        assert "annual_analysis" in analysis
        assert "summary" in analysis
        
        print(f"Fund investment test PASSED - 10-year value: ${analysis['summary']['10_year_fund_value']:,.0f}")
    
    def test_fund_investment_returns_calculation(self):
        """Verify fund investment returns are calculated correctly"""
        payload = {
            "transaction_type": "buy",
            "fund_name": "Vanguard Australian Shares Index ETF",
            "amount": 100000,
            "expected_return": 7.0,
            "management_fee": 0.10,
            "distribution_yield": 3.5
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/fund?client_id=client_1",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        annual_analysis = data["analysis"]["annual_analysis"]
        
        # Verify net return is gross minus fees
        expected_net_return = 7.0 - 0.10
        assert annual_analysis["net_return_rate"] == expected_net_return, f"Net return should be {expected_net_return}"
        
        # Verify distribution exists
        assert annual_analysis["annual_distribution"] > 0, "Distribution should be positive"
        
        summary = data["analysis"]["summary"]
        assert summary["10_year_roi"] > 0, "10-year ROI should be positive"
        
        print("Fund returns verification PASSED:")
        print(f"  Net Return Rate: {annual_analysis['net_return_rate']}%")
        print(f"  10-year ROI: {summary['10_year_roi']}%")


class TestTransactionModelerStockAPI:
    """Test Transaction Modeler Stock endpoint POST /api/transaction-modeling/stock"""
    
    def test_stock_buy_scenario_basic(self):
        """Test stock buy scenario"""
        payload = {
            "transaction_type": "buy",
            "symbol": "CBA",
            "shares": 100,
            "price_per_share": 120
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/stock?client_id=client_1",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "client_id" in data
        assert "transaction_type" in data
        assert "symbol" in data
        assert "analysis" in data
        
        analysis = data["analysis"]
        assert "trade_details" in analysis
        assert "projections" in analysis
        assert "summary" in analysis
        
        # Verify trade value: 100 shares * $120 = $12,000
        assert analysis["trade_details"]["trade_value"] == 12000
        
        print(f"Stock buy test PASSED - Trade value: ${analysis['trade_details']['total_cost']:,.2f}")
    
    def test_stock_sell_scenario_with_cgt(self):
        """Test stock sell scenario with CGT calculation"""
        payload = {
            "transaction_type": "sell",
            "symbol": "CBA",
            "shares": 100,
            "price_per_share": 120,
            "purchase_date": "2023-01-01",
            "purchase_price": 95
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/stock?client_id=client_1",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        analysis = data["analysis"]
        
        # Verify trade details
        assert "trade_details" in analysis
        assert "cost_base" in analysis
        assert "profit_loss" in analysis
        assert "cgt_analysis" in analysis
        
        # Verify CGT calculation for holding > 12 months
        cgt = analysis["cgt_analysis"]
        assert "gross_gain" in cgt, "Should have gross_gain"
        assert "cgt_discount_eligible" in cgt, "Should have CGT discount eligibility"
        assert cgt["cgt_discount_eligible"], "Should be eligible for 50% discount (held > 12 months)"
        
        print("Stock sell with CGT test PASSED:")
        print(f"  Gross Gain: ${cgt['gross_gain']:,.2f}")
        print(f"  CGT Discount: {cgt['cgt_discount_eligible']}")
        print(f"  Tax Payable: ${cgt['tax_payable']:,.2f}")
    
    def test_stock_sell_missing_purchase_info(self):
        """Test stock sell fails when missing purchase info"""
        payload = {
            "transaction_type": "sell",
            "symbol": "CBA",
            "shares": 100,
            "price_per_share": 120
            # Missing purchase_date and purchase_price
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/stock?client_id=client_1",
            json=payload
        )
        
        # Should return 400 for missing required fields
        assert response.status_code == 400, f"Expected 400 for missing purchase info, got {response.status_code}"
        print("Stock sell validation test PASSED - correctly requires purchase info for CGT")


class TestCRMClientCreation:
    """Test CRM Client Creation POST /api/crm/clients"""
    
    def test_create_client_basic(self):
        """Test creating a new client with basic info"""
        payload = {
            "name": "TEST_John Smith",
            "email": "test_john@example.com",
            "phone": "0400 000 001",
            "address": "123 Test Street, Sydney NSW 2000",
            "type": "individual",
            "status": "prospect",
            "risk_profile": "Balanced",
            "adviser": "Mark Thompson",
            "annual_income": 150000,
            "notes": "Test client for iteration 74"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/crm/clients",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success"), "Response should indicate success"
        assert "client" in data, "Response should include client data"
        
        client = data["client"]
        assert client["name"] == "TEST_John Smith"
        assert client["email"] == "test_john@example.com"
        assert client["type"] == "individual"
        assert client["status"] == "prospect"
        assert client["risk_profile"] == "Balanced"
        assert "client_id" in client, "Should generate client_id"
        
        print(f"Client creation test PASSED - Created client: {client['client_id']}")
        return client["client_id"]
    
    def test_create_client_required_fields(self):
        """Test client creation validates required fields (name, email)"""
        payload = {
            "phone": "0400 000 001"
            # Missing name and email
        }
        
        response = requests.post(
            f"{BASE_URL}/api/crm/clients",
            json=payload
        )
        
        # Should fail validation - missing required fields
        assert response.status_code == 422, f"Expected 422 for missing required fields, got {response.status_code}"
        print("Client required fields validation test PASSED")
    
    def test_create_client_household_type(self):
        """Test creating a household type client"""
        payload = {
            "name": "TEST_Household Smith Family",
            "email": "test_smithfamily@example.com",
            "type": "household",
            "status": "prospect",
            "risk_profile": "Growth"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/crm/clients",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["client"]["type"] == "household"
        
        print("Household client creation test PASSED")


class TestCRMClientUpdate:
    """Test CRM Client Update PUT /api/crm/clients/{id}"""
    
    def test_update_existing_client(self):
        """Test updating an existing client"""
        # First get list of clients to find an existing one
        clients_response = requests.get(f"{BASE_URL}/api/crm/clients")
        assert clients_response.status_code == 200
        clients = clients_response.json()["clients"]
        
        if clients:
            client_id = clients[0]["client_id"]
            
            update_payload = {
                "phone": "0400 UPDATED",
                "notes": "Updated during iteration 74 testing"
            }
            
            response = requests.put(
                f"{BASE_URL}/api/crm/clients/{client_id}",
                json=update_payload
            )
            
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            data = response.json()
            
            assert data.get("success")
            assert data["client"]["phone"] == "0400 UPDATED"
            
            print(f"Client update test PASSED - Updated client: {client_id}")
        else:
            pytest.skip("No clients available to update")
    
    def test_update_nonexistent_client(self):
        """Test updating a non-existent client returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/crm/clients/nonexistent_client_xyz",
            json={"name": "Test"}
        )
        
        assert response.status_code == 404, f"Expected 404 for non-existent client, got {response.status_code}"
        print("Update non-existent client test PASSED - correctly returns 404")


class TestCRMClientsGet:
    """Test CRM Clients GET endpoints"""
    
    def test_get_all_clients(self):
        """Test getting all clients with summary"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "clients" in data
        assert "summary" in data
        assert isinstance(data["clients"], list)
        assert len(data["clients"]) >= 1, "Should have at least one client"
        
        # Verify summary structure
        summary = data["summary"]
        assert "total_aum" in summary
        assert "active" in summary
        assert "prospect" in summary
        
        print(f"Get all clients test PASSED - Found {len(data['clients'])} clients")
    
    def test_get_client_by_id(self):
        """Test getting a specific client by ID"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert data["name"] == "James & Sarah Wheeler"
        
        print(f"Get client by ID test PASSED - {data['name']}")


class TestTransactionModelerComprehensive:
    """Test comprehensive transaction modeling endpoint"""
    
    def test_comprehensive_scenario(self):
        """Test modeling multiple transactions"""
        payload = {
            "client_id": "client_1",
            "transactions": [
                {
                    "type": "property",
                    "details": {
                        "transaction_type": "buy",
                        "property_value": 500000,
                        "deposit_percent": 20
                    }
                },
                {
                    "type": "fund",
                    "details": {
                        "transaction_type": "buy",
                        "fund_name": "Vanguard",
                        "amount": 50000
                    }
                }
            ],
            "projection_years": 10
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/comprehensive",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "combined_impact" in data
        assert "summary" in data
        assert data["summary"]["total_transactions"] == 2
        
        print(f"Comprehensive scenario test PASSED - Cash required: ${data['combined_impact']['total_cash_required']:,.0f}")


class TestTransactionModelerScenarios:
    """Test saved scenarios endpoint"""
    
    def test_get_saved_scenarios(self):
        """Test getting saved scenarios for a client"""
        response = requests.get(
            f"{BASE_URL}/api/transaction-modeling/scenarios/client_1"
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "client_id" in data
        assert "scenarios" in data
        assert isinstance(data["scenarios"], list)
        
        print(f"Saved scenarios test PASSED - Found {len(data['scenarios'])} scenarios")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
