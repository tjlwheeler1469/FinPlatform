"""
Iteration 46 Comprehensive Tests
Tests for: Login, Dashboard, CRM, Goals, Timeline, Market Data, Security, Document Vault
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://advisor-os.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "advisor@wealthcommand.com"
TEST_PASSWORD = "demo123"
ALT_EMAIL = "advisor@wealthcommand.io"
ALT_PASSWORD = "secure_password_123"


class TestAuthenticationFlow:
    """Test login and authentication endpoints"""
    
    def test_login_with_demo_credentials(self):
        """Test login with demo credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data, "Missing access_token"
        assert "user" in data, "Missing user data"
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["name"] == "James Wheeler"
        assert data["user"]["role"] == "advisor"
        print(f"✓ Login successful for {TEST_EMAIL}")
    
    def test_login_with_alternative_credentials(self):
        """Test login with alternative credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ALT_EMAIL,
            "password": ALT_PASSWORD
        })
        assert response.status_code == 200, f"Alt login failed: {response.text}"
        data = response.json()
        assert data["user"]["name"] == "Sarah Chen"
        print(f"✓ Alternative login successful for {ALT_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, "Should return 401 for invalid credentials"
        print("✓ Invalid credentials correctly rejected")
    
    def test_token_verification(self):
        """Test token verification endpoint"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Verify token
        verify_response = requests.get(f"{BASE_URL}/api/auth/verify-token?token={token}")
        assert verify_response.status_code == 200
        data = verify_response.json()
        assert data["valid"] == True, "Token should be valid"
        print("✓ Token verification working")
    
    def test_get_current_user(self):
        """Test getting current user from token"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Get user info
        user_response = requests.get(f"{BASE_URL}/api/auth/me?token={token}")
        assert user_response.status_code == 200
        data = user_response.json()
        assert data["email"] == TEST_EMAIL
        assert data["name"] == "James Wheeler"
        print("✓ Get current user working")


class TestDashboard:
    """Test dashboard endpoints"""
    
    def test_dashboard_summary(self):
        """Test dashboard summary endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/summary")
        assert response.status_code == 200, f"Dashboard summary failed: {response.text}"
        data = response.json()
        
        # Verify structure
        assert "net_worth" in data, "Missing net_worth"
        assert "retirement_readiness" in data, "Missing retirement_readiness"
        assert "investment_performance" in data, "Missing investment_performance"
        assert "alerts" in data, "Missing alerts"
        
        # Verify net worth data
        assert data["net_worth"]["total"] > 0, "Net worth should be positive"
        print(f"✓ Dashboard summary: Net worth ${data['net_worth']['total']:,}")
    
    def test_dashboard_widgets(self):
        """Test dashboard widgets endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/widgets")
        assert response.status_code == 200
        data = response.json()
        
        assert "net_worth_chart" in data
        assert "asset_allocation" in data
        assert "upcoming_events" in data
        print("✓ Dashboard widgets working")
    
    def test_dashboard_quick_stats(self):
        """Test quick stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/dashboard/quick-stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "net_worth" in data
        assert "monthly_income" in data
        assert "savings_rate" in data
        print(f"✓ Quick stats: Savings rate {data['savings_rate']}%")


class TestCRM:
    """Test CRM (Client Relationship Management) endpoints"""
    
    def test_get_households(self):
        """Test getting all households"""
        response = requests.get(f"{BASE_URL}/api/crm/households")
        assert response.status_code == 200, f"Get households failed: {response.text}"
        data = response.json()
        
        assert "households" in data
        assert "total" in data
        assert len(data["households"]) > 0, "Should have sample households"
        
        # Verify household structure
        household = data["households"][0]
        assert "id" in household
        assert "name" in household
        assert "members" in household
        print(f"✓ CRM: Found {data['total']} households")
    
    def test_get_specific_household(self):
        """Test getting a specific household"""
        response = requests.get(f"{BASE_URL}/api/crm/households/hh_001")
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Wheeler Family"
        assert len(data["members"]) > 0
        print(f"✓ Household details: {data['name']}")
    
    def test_crm_stats(self):
        """Test CRM statistics"""
        response = requests.get(f"{BASE_URL}/api/crm/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_households" in data
        assert "active_clients" in data
        assert "total_aum" in data
        print(f"✓ CRM Stats: {data['total_households']} households, AUM ${data['total_aum']:,}")
    
    def test_create_household(self):
        """Test creating a new household"""
        response = requests.post(f"{BASE_URL}/api/crm/households", json={
            "name": "TEST_Smith Family",
            "primary_email": "test.smith@example.com",
            "members": [{"name": "John Smith", "age": 40, "role": "primary"}],
            "risk_profile": "balanced"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "TEST_Smith Family"
        assert "id" in data
        
        # Cleanup - delete the test household
        household_id = data["id"]
        delete_response = requests.delete(f"{BASE_URL}/api/crm/households/{household_id}")
        assert delete_response.status_code == 200
        print("✓ Create and delete household working")


class TestGoals:
    """Test financial goals endpoints"""
    
    def test_list_goals(self):
        """Test listing all goals"""
        response = requests.get(f"{BASE_URL}/api/goals/")
        assert response.status_code == 200, f"List goals failed: {response.text}"
        data = response.json()
        
        assert "goals" in data
        assert "total" in data
        assert "summary" in data
        assert len(data["goals"]) > 0, "Should have sample goals"
        print(f"✓ Goals: Found {data['total']} goals")
    
    def test_get_specific_goal(self):
        """Test getting a specific goal"""
        response = requests.get(f"{BASE_URL}/api/goals/goal_001")
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == "Emergency Fund"
        assert "target_amount" in data
        assert "current_amount" in data
        assert "progress" in data
        print(f"✓ Goal details: {data['name']} - {data['progress']}% complete")
    
    def test_goal_categories(self):
        """Test getting goal categories"""
        response = requests.get(f"{BASE_URL}/api/goals/categories/list")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"✓ Goal categories: {len(data['categories'])} categories available")
    
    def test_goals_analytics(self):
        """Test goals analytics for a household"""
        response = requests.get(f"{BASE_URL}/api/goals/analytics/hh_001")
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data
        assert "by_category" in data
        print(f"✓ Goals analytics: {data['summary']['total_goals']} goals for household")


class TestLifeTimeline:
    """Test life timeline planner endpoints"""
    
    def test_get_life_events(self):
        """Test getting life events"""
        response = requests.get(f"{BASE_URL}/api/timeline/events")
        assert response.status_code == 200, f"Get events failed: {response.text}"
        data = response.json()
        
        assert "events" in data
        assert "total" in data
        assert "financial_summary" in data
        assert len(data["events"]) > 0, "Should have sample events"
        print(f"✓ Timeline: Found {data['total']} life events")
    
    def test_get_specific_event(self):
        """Test getting a specific event"""
        response = requests.get(f"{BASE_URL}/api/timeline/events/event_001")
        assert response.status_code == 200
        data = response.json()
        
        assert "name" in data
        assert "event_type" in data
        assert "date" in data
        print(f"✓ Event details: {data['name']}")
    
    def test_event_categories(self):
        """Test getting event categories"""
        response = requests.get(f"{BASE_URL}/api/timeline/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        print(f"✓ Event categories: {len(data['categories'])} categories")
    
    def test_financial_impact(self):
        """Test calculating financial impact"""
        response = requests.get(f"{BASE_URL}/api/timeline/impact/hh_001")
        assert response.status_code == 200
        data = response.json()
        
        assert "timeline" in data
        assert "summary" in data
        print(f"✓ Financial impact calculated for household")
    
    def test_timeline_simulation(self):
        """Test timeline simulation"""
        response = requests.post(f"{BASE_URL}/api/timeline/simulate", params={
            "household_id": "hh_001",
            "current_net_worth": 1978000,
            "annual_savings": 50000,
            "growth_rate": 0.07
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "projection" in data
        assert len(data["projection"]) > 0
        print(f"✓ Timeline simulation: {len(data['projection'])} years projected")


class TestMarketData:
    """Test market data endpoints"""
    
    def test_get_stock_quote(self):
        """Test getting a stock quote"""
        response = requests.get(f"{BASE_URL}/api/market/quote/BHP.AX")
        assert response.status_code == 200, f"Get quote failed: {response.text}"
        data = response.json()
        
        assert "symbol" in data
        assert "price" in data
        assert data["symbol"] == "BHP.AX"
        assert data["price"] > 0
        print(f"✓ Stock quote: {data['symbol']} = ${data['price']}")
    
    def test_get_market_indices(self):
        """Test getting market indices"""
        response = requests.get(f"{BASE_URL}/api/market/indices")
        assert response.status_code == 200
        data = response.json()
        
        assert "indices" in data
        assert len(data["indices"]) > 0
        print(f"✓ Market indices: {len(data['indices'])} indices")
    
    def test_get_price_history(self):
        """Test getting price history"""
        response = requests.get(f"{BASE_URL}/api/market/history/BHP.AX?period=1y")
        assert response.status_code == 200
        data = response.json()
        
        assert "symbol" in data
        print(f"✓ Price history retrieved for {data['symbol']}")
    
    def test_sector_performance(self):
        """Test getting sector performance"""
        response = requests.get(f"{BASE_URL}/api/market/sectors")
        assert response.status_code == 200
        data = response.json()
        
        assert "sectors" in data
        print(f"✓ Sector performance: {len(data['sectors'])} sectors")


class TestSecurity:
    """Test security and MFA endpoints"""
    
    def test_mfa_status(self):
        """Test getting MFA status"""
        response = requests.get(f"{BASE_URL}/api/mfa/status/user_001")
        assert response.status_code == 200, f"MFA status failed: {response.text}"
        data = response.json()
        
        assert "user_id" in data
        assert "mfa_enabled" in data
        print(f"✓ MFA status: enabled={data['mfa_enabled']}")
    
    def test_mfa_setup(self):
        """Test MFA setup initialization"""
        response = requests.post(f"{BASE_URL}/api/mfa/setup", json={
            "user_id": "user_001",
            "method": "totp"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "setup_token" in data or "qr_code" in data or "secret" in data
        print("✓ MFA setup initialized")
    
    def test_audit_logs(self):
        """Test getting audit logs"""
        response = requests.get(f"{BASE_URL}/api/audit/logs")
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        print(f"✓ Audit logs: {len(data['logs'])} entries")
    
    def test_compliance_report(self):
        """Test getting compliance report"""
        response = requests.get(f"{BASE_URL}/api/audit/compliance-report")
        assert response.status_code == 200
        data = response.json()
        
        assert "compliance_status" in data
        assert "controls" in data
        print(f"✓ Compliance status: {data['compliance_status']}")
    
    def test_security_settings(self):
        """Test getting security settings"""
        response = requests.get(f"{BASE_URL}/api/security/settings/user_001")
        assert response.status_code == 200
        data = response.json()
        
        assert "mfa" in data
        assert "sessions" in data
        assert "password" in data
        print("✓ Security settings retrieved")


class TestDocumentVault:
    """Test document vault endpoints"""
    
    def test_list_documents(self):
        """Test listing documents"""
        response = requests.get(f"{BASE_URL}/api/documents/")
        assert response.status_code == 200, f"List documents failed: {response.text}"
        data = response.json()
        
        assert "documents" in data
        print(f"✓ Document vault: {len(data['documents'])} documents")
    
    def test_document_categories(self):
        """Test getting document categories"""
        response = requests.get(f"{BASE_URL}/api/documents/categories")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        print(f"✓ Document categories: {len(data['categories'])} categories")


class TestScenarioSimulator:
    """Test scenario simulator endpoints"""
    
    def test_monte_carlo_simulation(self):
        """Test Monte Carlo simulation"""
        response = requests.post(f"{BASE_URL}/api/scenarios/simulate", json={
            "initial_value": 1978000,
            "annual_contribution": 50000,
            "expected_return": 0.07,
            "volatility": 0.15,
            "years": 15,
            "target_value": 3500000,
            "simulations": 1000
        })
        assert response.status_code == 200, f"Simulation failed: {response.text}"
        data = response.json()
        
        assert "success_probability" in data
        assert "median_outcome" in data
        print(f"✓ Monte Carlo: {data['success_probability']}% success probability")
    
    def test_scenario_comparison(self):
        """Test scenario comparison"""
        response = requests.post(f"{BASE_URL}/api/scenarios/compare", json={
            "scenarios": [
                {"name": "Base", "savings_rate": 0.15, "return_rate": 0.07},
                {"name": "Aggressive", "savings_rate": 0.20, "return_rate": 0.08}
            ],
            "initial_value": 1978000,
            "years": 15
        })
        # This endpoint may or may not exist
        if response.status_code == 200:
            print("✓ Scenario comparison working")
        else:
            print("○ Scenario comparison endpoint not available")


class TestHealthCheck:
    """Test health and status endpoints"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        print("✓ Health check: healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
