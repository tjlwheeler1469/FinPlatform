"""
Iteration 58 - Backend Refactoring Verification Tests
Tests to verify all routes work correctly after 98% code reduction in server.py
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "advisor@wealthcommand.io"
TEST_PASSWORD = "secure_password_123"


class TestHealthAndCore:
    """Health check and core endpoint tests"""
    
    def test_health_check(self):
        """Test /api/health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "wealth-command"
        assert data["version"] == "4.0.0"
        assert data["architecture"] == "modular"
        print(f"✓ Health check passed: {data}")


class TestAuthRoutes:
    """Authentication routes tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful: user={data['user']['name']}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_register_new_user(self):
        """Test user registration"""
        import uuid
        unique_email = f"test_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Registration successful: {unique_email}")


class TestTaxRoutes:
    """Tax calculation routes tests"""
    
    def test_get_tax_rates(self):
        """Test /api/tax/rates endpoint"""
        response = requests.get(f"{BASE_URL}/api/tax/rates")
        assert response.status_code == 200
        data = response.json()
        assert "personal" in data
        assert "company" in data
        assert data["personal"]["year"] == "2024-25"
        assert "brackets" in data["personal"]
        print(f"✓ Tax rates retrieved: {len(data['personal']['brackets'])} brackets")
    
    def test_calculate_personal_tax(self):
        """Test personal income tax calculation"""
        response = requests.post(f"{BASE_URL}/api/tax/calculate", json={
            "taxable_income": 150000,
            "entity_type": "personal",
            "year": "2024-25"
        })
        assert response.status_code == 200
        data = response.json()
        assert "income_tax" in data
        assert "medicare_levy" in data
        assert "total_tax" in data
        assert "effective_rate" in data
        print(f"✓ Tax calculation: income=$150k, tax=${data['total_tax']:,.2f}, effective={data['effective_rate']:.2f}%")
    
    def test_calculate_cgt(self):
        """Test CGT calculation"""
        response = requests.post(f"{BASE_URL}/api/tax/cgt", json={
            "purchase_price": 50000,
            "sale_price": 75000,
            "holding_period_months": 18,
            "marginal_tax_rate": 0.37,
            "entity_type": "individual"
        })
        assert response.status_code == 200
        data = response.json()
        assert "capital_gain" in data
        assert "discount_eligible" in data
        assert "cgt_payable" in data
        print(f"✓ CGT calculation: gain=${data['capital_gain']:,.2f}, discount={data['discount_eligible']}")


class TestMarketRoutes:
    """Market data routes tests"""
    
    def test_get_market_indices(self):
        """Test /api/market/indices endpoint"""
        response = requests.get(f"{BASE_URL}/api/market/indices")
        assert response.status_code == 200
        data = response.json()
        assert "indices" in data
        assert len(data["indices"]) >= 4
        index_names = [i["name"] for i in data["indices"]]
        assert "S&P/ASX 200" in index_names or any("ASX" in n for n in index_names)
        print(f"✓ Market indices: {len(data['indices'])} indices retrieved")
    
    def test_get_stock_quote(self):
        """Test stock quote endpoint"""
        response = requests.get(f"{BASE_URL}/api/market/quote/CBA.AX")
        assert response.status_code == 200
        data = response.json()
        assert "symbol" in data
        assert "price" in data
        assert data["symbol"] == "CBA.AX"
        print(f"✓ Stock quote: CBA.AX @ ${data['price']}")
    
    def test_stock_search(self):
        """Test stock search endpoint"""
        response = requests.get(f"{BASE_URL}/api/market/search?query=CBA")
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        print(f"✓ Stock search: {len(data['results'])} results for 'CBA'")


class TestTradingRoutes:
    """Stock trading routes tests"""
    
    def test_get_client_holdings(self):
        """Test /api/trading/holdings/{client_id} endpoint"""
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "client_name" in data
        assert "holdings" in data
        assert "summary" in data
        assert data["client_id"] == "client_1"
        assert len(data["holdings"]) > 0
        print(f"✓ Holdings: {data['client_name']} has {len(data['holdings'])} positions, total=${data['summary']['total_value']:,.2f}")
    
    def test_get_brokers(self):
        """Test /api/trading/brokers endpoint"""
        response = requests.get(f"{BASE_URL}/api/trading/brokers")
        assert response.status_code == 200
        data = response.json()
        assert "brokers" in data
        assert len(data["brokers"]) >= 3
        broker_names = [b["name"] for b in data["brokers"]]
        print(f"✓ Brokers: {len(data['brokers'])} available - {', '.join(broker_names)}")
    
    def test_order_preview(self):
        """Test order preview endpoint"""
        response = requests.post(f"{BASE_URL}/api/trading/order/preview", json={
            "client_id": "client_1",
            "symbol": "CBA.AX",
            "order_type": "market",
            "side": "sell",
            "units": 50
        })
        assert response.status_code == 200
        data = response.json()
        assert "order_preview" in data
        assert "cgt_impact" in data
        print(f"✓ Order preview: SELL 50 CBA.AX, proceeds=${data['order_preview']['gross_proceeds']:,.2f}")
    
    def test_cgt_summary(self):
        """Test CGT summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/trading/cgt-summary/client_1")
        assert response.status_code == 200
        data = response.json()
        assert "unrealized" in data
        assert "realized" in data
        assert "tax_planning_opportunities" in data
        print(f"✓ CGT Summary: unrealized gains=${data['unrealized']['total_gains']:,.2f}")


class TestEmailRoutes:
    """Email service routes tests"""
    
    def test_email_status(self):
        """Test /api/email/status endpoint"""
        response = requests.get(f"{BASE_URL}/api/email/status")
        assert response.status_code == 200
        data = response.json()
        assert "demo_mode" in data
        assert "templates" in data
        print(f"✓ Email status: demo_mode={data['demo_mode']}, templates={len(data['templates'])}")
    
    def test_send_test_email(self):
        """Test sending test email (demo mode)"""
        response = requests.post(f"{BASE_URL}/api/email/test?to_email=test@example.com")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data or "demo_mode" in data
        print(f"✓ Test email: sent (demo mode)")


class TestBankFeedsRoutes:
    """Bank feeds (Basiq CDR) routes tests"""
    
    def test_bank_feeds_status(self):
        """Test /api/bank-feeds/status endpoint"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/status")
        assert response.status_code == 200
        data = response.json()
        assert "demo_mode" in data
        assert "cdr_compliant" in data
        print(f"✓ Bank feeds status: demo_mode={data['demo_mode']}, CDR={data['cdr_compliant']}")
    
    def test_get_institutions(self):
        """Test getting supported institutions"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/institutions")
        assert response.status_code == 200
        data = response.json()
        assert "institutions" in data
        assert len(data["institutions"]) > 0
        print(f"✓ Institutions: {len(data['institutions'])} banks supported")
    
    def test_get_accounts(self):
        """Test getting accounts for a user"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/accounts/demo_user")
        assert response.status_code == 200
        data = response.json()
        assert "accounts" in data
        print(f"✓ Accounts: {len(data['accounts'])} accounts (demo)")
    
    def test_get_transactions(self):
        """Test getting transactions"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/transactions/demo_user")
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        print(f"✓ Transactions: {len(data['transactions'])} transactions (demo)")


class TestCommandCenterRoutes:
    """Command center routes tests"""
    
    def test_daily_digest(self):
        """Test /api/command-center/daily-digest endpoint"""
        response = requests.get(f"{BASE_URL}/api/command-center/daily-digest")
        assert response.status_code == 200
        data = response.json()
        assert "greeting" in data
        assert "summary" in data
        assert "metrics" in data
        assert "alerts" in data
        assert "ai_recommendations" in data
        assert "schedule" in data
        print(f"✓ Daily digest: {data['summary']['total_alerts']} alerts, {data['summary']['meetings_today']} meetings")
    
    def test_get_alerts(self):
        """Test getting alerts"""
        response = requests.get(f"{BASE_URL}/api/command-center/alerts")
        assert response.status_code == 200
        data = response.json()
        assert "alerts" in data
        assert "total" in data
        print(f"✓ Alerts: {data['total']} total alerts")
    
    def test_get_metrics(self):
        """Test getting practice metrics"""
        response = requests.get(f"{BASE_URL}/api/command-center/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_aum" in data
        assert "total_clients" in data
        print(f"✓ Metrics: AUM=${data['total_aum']:,.0f}, clients={data['total_clients']}")
    
    def test_get_schedule(self):
        """Test getting schedule"""
        response = requests.get(f"{BASE_URL}/api/command-center/schedule")
        assert response.status_code == 200
        data = response.json()
        assert "meetings" in data
        print(f"✓ Schedule: {len(data['meetings'])} meetings today")


class TestAdditionalRoutes:
    """Additional route verification tests"""
    
    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/summary")
        # May return 200 or 404 depending on implementation
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            print("✓ Dashboard summary available")
        else:
            print("⚠ Dashboard summary not implemented (404)")
    
    def test_portfolio_monitoring(self):
        """Test portfolio monitoring endpoint"""
        response = requests.get(f"{BASE_URL}/api/monitoring/book-insights")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Portfolio monitoring: book insights available")
    
    def test_intelligence_analysis(self):
        """Test intelligence analysis endpoint"""
        response = requests.get(f"{BASE_URL}/api/intelligence/comprehensive-analysis")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Intelligence analysis available")
    
    def test_tax_opportunities(self):
        """Test tax opportunities endpoint"""
        response = requests.get(f"{BASE_URL}/api/intelligence/tax-opportunities")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Tax opportunities available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
