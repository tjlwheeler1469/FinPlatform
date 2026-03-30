"""
Iteration 85 Tests - Wealth Command Improvements
Tests for:
1. Client Portal API - portfolios with all asset types (stocks, funds, bonds, hybrids, crypto, cash)
2. Client Portal API - net_worth breakdown with all asset types
3. Knowledge Graph tabs verification (no graph tab)
4. Transaction Modeler tabs verification (7 tabs including bonds, hybrids)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://smart-insights-dash.preview.emergentagent.com').rstrip('/')


class TestClientPortalPortfolios:
    """Test Client Portal portfolios include all asset types"""
    
    def test_portfolios_endpoint_returns_data(self):
        """Test that portfolios endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "portfolios" in data
        assert len(data["portfolios"]) > 0
    
    def test_portfolios_include_stocks(self):
        """Test that portfolios include stock holdings"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        data = response.json()
        all_holdings = []
        for portfolio in data["portfolios"]:
            all_holdings.extend(portfolio.get("holdings", []))
        stock_types = [h["type"] for h in all_holdings]
        assert "stock" in stock_types, "No stock holdings found in portfolios"
    
    def test_portfolios_include_etfs(self):
        """Test that portfolios include ETF holdings"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        data = response.json()
        all_holdings = []
        for portfolio in data["portfolios"]:
            all_holdings.extend(portfolio.get("holdings", []))
        holding_types = [h["type"] for h in all_holdings]
        assert "etf" in holding_types, "No ETF holdings found in portfolios"
    
    def test_portfolios_include_funds(self):
        """Test that portfolios include managed fund holdings"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        data = response.json()
        all_holdings = []
        for portfolio in data["portfolios"]:
            all_holdings.extend(portfolio.get("holdings", []))
        holding_types = [h["type"] for h in all_holdings]
        assert "fund" in holding_types, "No fund holdings found in portfolios"
    
    def test_portfolios_include_bonds(self):
        """Test that portfolios include bond holdings"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        data = response.json()
        all_holdings = []
        for portfolio in data["portfolios"]:
            all_holdings.extend(portfolio.get("holdings", []))
        holding_types = [h["type"] for h in all_holdings]
        assert "bond" in holding_types or "bond_etf" in holding_types, "No bond holdings found in portfolios"
    
    def test_portfolios_include_hybrids(self):
        """Test that portfolios include hybrid holdings"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        data = response.json()
        all_holdings = []
        for portfolio in data["portfolios"]:
            all_holdings.extend(portfolio.get("holdings", []))
        holding_types = [h["type"] for h in all_holdings]
        assert "hybrid" in holding_types, "No hybrid holdings found in portfolios"
    
    def test_portfolios_include_crypto(self):
        """Test that portfolios include crypto holdings"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        data = response.json()
        all_holdings = []
        for portfolio in data["portfolios"]:
            all_holdings.extend(portfolio.get("holdings", []))
        holding_types = [h["type"] for h in all_holdings]
        assert "crypto" in holding_types, "No crypto holdings found in portfolios"
    
    def test_portfolios_include_cash(self):
        """Test that portfolios include cash/term deposit holdings"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        data = response.json()
        all_holdings = []
        for portfolio in data["portfolios"]:
            all_holdings.extend(portfolio.get("holdings", []))
        holding_types = [h["type"] for h in all_holdings]
        assert "cash" in holding_types or "term_deposit" in holding_types, "No cash/term deposit holdings found in portfolios"


class TestClientPortalNetWorth:
    """Test Client Portal net_worth breakdown includes all asset types"""
    
    def test_net_worth_endpoint_returns_data(self):
        """Test that net-worth endpoint returns valid data"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "current" in data
        assert "breakdown" in data["current"]
    
    def test_net_worth_includes_stocks(self):
        """Test that net_worth breakdown includes stocks"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        data = response.json()
        breakdown = data["current"]["breakdown"]
        assert "stocks" in breakdown
        assert breakdown["stocks"] > 0
    
    def test_net_worth_includes_etfs(self):
        """Test that net_worth breakdown includes etfs"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        data = response.json()
        breakdown = data["current"]["breakdown"]
        assert "etfs" in breakdown
        assert breakdown["etfs"] > 0
    
    def test_net_worth_includes_managed_funds(self):
        """Test that net_worth breakdown includes managed_funds"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        data = response.json()
        breakdown = data["current"]["breakdown"]
        assert "managed_funds" in breakdown
        assert breakdown["managed_funds"] > 0
    
    def test_net_worth_includes_bonds(self):
        """Test that net_worth breakdown includes bonds"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        data = response.json()
        breakdown = data["current"]["breakdown"]
        assert "bonds" in breakdown
        assert breakdown["bonds"] > 0
    
    def test_net_worth_includes_hybrids(self):
        """Test that net_worth breakdown includes hybrids"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        data = response.json()
        breakdown = data["current"]["breakdown"]
        assert "hybrids" in breakdown
        assert breakdown["hybrids"] > 0
    
    def test_net_worth_includes_crypto(self):
        """Test that net_worth breakdown includes crypto"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        data = response.json()
        breakdown = data["current"]["breakdown"]
        assert "crypto" in breakdown
        assert breakdown["crypto"] > 0
    
    def test_net_worth_includes_cash(self):
        """Test that net_worth breakdown includes cash"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        data = response.json()
        breakdown = data["current"]["breakdown"]
        assert "cash" in breakdown
        assert breakdown["cash"] > 0


class TestKnowledgeGraphEndpoints:
    """Test Knowledge Graph API endpoints"""
    
    def test_graph_overview_endpoint(self):
        """Test that graph overview endpoint works"""
        response = requests.get(f"{BASE_URL}/api/graph/overview")
        assert response.status_code == 200
    
    def test_graph_insights_endpoint(self):
        """Test that graph insights endpoint works"""
        response = requests.get(f"{BASE_URL}/api/graph/insights")
        assert response.status_code == 200
    
    def test_graph_actions_endpoint(self):
        """Test that graph actions endpoint works"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/pending")
        assert response.status_code == 200


class TestTransactionModelingEndpoints:
    """Test Transaction Modeling API endpoints"""
    
    def test_property_modeling_endpoint(self):
        """Test property modeling endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/property?client_id=client_1",
            json={
                "transaction_type": "buy",
                "property_value": 850000,
                "deposit_percent": 20,
                "loan_interest_rate": 6.5,
                "loan_term_years": 30,
                "expected_rental_yield": 4.0,
                "expected_capital_growth": 5.0
            }
        )
        assert response.status_code == 200
    
    def test_fund_modeling_endpoint(self):
        """Test fund modeling endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/fund?client_id=client_1",
            json={
                "transaction_type": "buy",
                "fund_name": "Test Fund",
                "amount": 100000,
                "expected_return": 7.0,
                "management_fee": 0.10,
                "distribution_yield": 3.5,
                "projection_years": 10
            }
        )
        assert response.status_code == 200
    
    def test_stock_modeling_endpoint(self):
        """Test stock modeling endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/stock?client_id=client_1",
            json={
                "transaction_type": "buy",
                "symbol": "CBA",
                "shares": 100,
                "price_per_share": 120,
                "expected_return": 8.0,
                "dividend_yield": 4.5
            }
        )
        assert response.status_code == 200


class TestHealthEndpoints:
    """Test basic health endpoints"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
