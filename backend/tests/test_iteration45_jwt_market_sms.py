"""
Iteration 45 Backend Tests
Tests for: JWT Authentication, Market Data (Yahoo Finance), Twilio SMS (demo mode)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://advisor-platform-15.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "advisor@wealthcommand.com"
TEST_PASSWORD = "demo123"


class TestJWTAuthentication:
    """JWT Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "token_type" in data, "Missing token_type in response"
        assert data["token_type"] == "bearer", "Token type should be bearer"
        assert "expires_in" in data, "Missing expires_in in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == TEST_EMAIL, "User email mismatch"
        print(f"✓ Login successful, token received, user: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_login_wrong_password(self):
        """Test login with correct email but wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Wrong password correctly rejected with 401")
    
    def test_verify_token_valid(self):
        """Test token verification with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Verify the token
        response = requests.get(f"{BASE_URL}/api/auth/verify-token", params={"token": token})
        assert response.status_code == 200, f"Token verification failed: {response.text}"
        
        data = response.json()
        assert data.get("valid") == True, "Token should be valid"
        assert "payload" in data, "Missing payload in response"
        assert data["payload"]["email"] == TEST_EMAIL, "Email mismatch in token payload"
        print(f"✓ Token verified successfully, payload: {data['payload']}")
    
    def test_verify_token_invalid(self):
        """Test token verification with invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/verify-token", params={"token": "invalid_token_here"})
        assert response.status_code == 200  # Returns 200 with valid=false
        
        data = response.json()
        assert data.get("valid") == False, "Invalid token should return valid=false"
        print("✓ Invalid token correctly identified")
    
    def test_get_current_user(self):
        """Test getting current user from token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get current user
        response = requests.get(f"{BASE_URL}/api/auth/me", params={"token": token})
        assert response.status_code == 200, f"Get user failed: {response.text}"
        
        data = response.json()
        assert data["email"] == TEST_EMAIL, "Email mismatch"
        assert "name" in data, "Missing name in response"
        assert "role" in data, "Missing role in response"
        print(f"✓ Current user retrieved: {data['name']} ({data['role']})")
    
    def test_refresh_token(self):
        """Test token refresh"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Refresh the token
        response = requests.post(f"{BASE_URL}/api/auth/refresh-token", params={"token": token})
        assert response.status_code == 200, f"Token refresh failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing new access_token"
        assert data["access_token"] != token, "New token should be different"
        print("✓ Token refreshed successfully")
    
    def test_register_new_user(self):
        """Test user registration"""
        import uuid
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "testpass123",
            "name": "Test User",
            "role": "client"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Registration should succeed"
        assert "user_id" in data, "Missing user_id in response"
        print(f"✓ User registered: {test_email}")
    
    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,  # Already exists
            "password": "testpass123",
            "name": "Duplicate User",
            "role": "client"
        })
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        print("✓ Duplicate email correctly rejected")


class TestMarketData:
    """Market Data (Yahoo Finance) endpoint tests"""
    
    def test_get_stock_quote(self):
        """Test getting stock quote for Australian stock"""
        response = requests.get(f"{BASE_URL}/api/market/quote/BHP.AX")
        assert response.status_code == 200, f"Quote request failed: {response.text}"
        
        data = response.json()
        assert "symbol" in data, "Missing symbol in response"
        assert data["symbol"] == "BHP.AX", "Symbol mismatch"
        assert "current_price" in data, "Missing current_price"
        assert "change_percent" in data, "Missing change_percent"
        assert data["current_price"] > 0, "Price should be positive"
        print(f"✓ BHP.AX quote: ${data['current_price']} ({data['change_percent']}%)")
    
    def test_get_us_stock_quote(self):
        """Test getting stock quote for US stock"""
        response = requests.get(f"{BASE_URL}/api/market/quote/AAPL")
        assert response.status_code == 200, f"Quote request failed: {response.text}"
        
        data = response.json()
        assert data["symbol"] == "AAPL", "Symbol mismatch"
        assert data["current_price"] > 0, "Price should be positive"
        print(f"✓ AAPL quote: ${data['current_price']} ({data['change_percent']}%)")
    
    def test_get_market_indices(self):
        """Test getting major market indices"""
        response = requests.get(f"{BASE_URL}/api/market/indices")
        assert response.status_code == 200, f"Indices request failed: {response.text}"
        
        data = response.json()
        assert "indices" in data, "Missing indices in response"
        assert len(data["indices"]) > 0, "Should have at least one index"
        
        # Check for expected indices
        index_names = [idx["name"] for idx in data["indices"]]
        assert "ASX 200" in index_names or any("ASX" in name for name in index_names), "Should include ASX 200"
        print(f"✓ Market indices retrieved: {len(data['indices'])} indices")
        for idx in data["indices"][:3]:
            print(f"  - {idx['name']}: {idx['value']} ({idx['change_percent']}%)")
    
    def test_get_stock_history(self):
        """Test getting stock price history"""
        response = requests.get(f"{BASE_URL}/api/market/history/VAS.AX", params={"period": "1mo"})
        assert response.status_code == 200, f"History request failed: {response.text}"
        
        data = response.json()
        assert "symbol" in data, "Missing symbol"
        assert "history" in data, "Missing history"
        assert len(data["history"]) > 0, "Should have historical data"
        
        # Check history data structure
        first_point = data["history"][0]
        assert "date" in first_point, "Missing date in history"
        assert "close" in first_point, "Missing close price in history"
        print(f"✓ VAS.AX history: {len(data['history'])} data points, return: {data.get('total_return', 'N/A')}%")
    
    def test_portfolio_value_calculation(self):
        """Test portfolio value calculation with holdings"""
        holdings = [
            {"symbol": "VAS.AX", "units": 100, "cost_basis": 95.00},
            {"symbol": "BHP.AX", "units": 50, "cost_basis": 42.00}
        ]
        
        response = requests.post(f"{BASE_URL}/api/market/portfolio-value", json={"holdings": holdings})
        assert response.status_code == 200, f"Portfolio value request failed: {response.text}"
        
        data = response.json()
        assert "total_value" in data, "Missing total_value"
        assert "total_cost" in data, "Missing total_cost"
        assert "total_gain_loss" in data, "Missing total_gain_loss"
        assert "positions" in data, "Missing positions"
        assert len(data["positions"]) == 2, "Should have 2 positions"
        
        # Verify calculations
        assert data["total_value"] > 0, "Total value should be positive"
        print(f"✓ Portfolio value: ${data['total_value']:,.2f} (gain/loss: ${data['total_gain_loss']:,.2f})")
    
    def test_stock_search(self):
        """Test stock search functionality"""
        response = requests.get(f"{BASE_URL}/api/market/search", params={"query": "BHP"})
        assert response.status_code == 200, f"Search request failed: {response.text}"
        
        data = response.json()
        assert "results" in data, "Missing results in response"
        assert len(data["results"]) > 0, "Should find at least one result"
        
        # Check that BHP is in results
        symbols = [r["symbol"] for r in data["results"]]
        assert any("BHP" in s for s in symbols), "BHP should be in search results"
        print(f"✓ Search 'BHP': {len(data['results'])} results found")
    
    def test_sector_performance(self):
        """Test sector ETF performance"""
        response = requests.get(f"{BASE_URL}/api/market/sectors")
        assert response.status_code == 200, f"Sectors request failed: {response.text}"
        
        data = response.json()
        assert "sectors" in data, "Missing sectors in response"
        assert len(data["sectors"]) > 0, "Should have sector data"
        print(f"✓ Sector performance: {len(data['sectors'])} sectors")


class TestTwilioSMS:
    """Twilio SMS (demo mode) endpoint tests"""
    
    def test_sms_status(self):
        """Test SMS configuration status"""
        response = requests.get(f"{BASE_URL}/api/sms/status")
        assert response.status_code == 200, f"SMS status request failed: {response.text}"
        
        data = response.json()
        assert "twilio_available" in data, "Missing twilio_available"
        assert "demo_mode" in data, "Missing demo_mode"
        # In demo mode, twilio_configured should be False
        print(f"✓ SMS Status: demo_mode={data['demo_mode']}, configured={data.get('twilio_configured', False)}")
    
    def test_send_verification_demo_mode(self):
        """Test sending verification SMS in demo mode"""
        response = requests.post(f"{BASE_URL}/api/sms/send-verification", json={
            "phone_number": "+61412345678"
        })
        assert response.status_code == 200, f"Send verification failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should succeed in demo mode"
        assert data.get("demo_mode") == True, "Should be in demo mode"
        assert "demo_code" in data, "Should return demo_code in demo mode"
        assert len(data["demo_code"]) == 6, "Demo code should be 6 digits"
        print(f"✓ SMS verification sent (demo mode), code: {data['demo_code']}")
    
    def test_verify_sms_code_demo_mode(self):
        """Test verifying SMS code in demo mode"""
        # In demo mode, any 6-digit code should work
        response = requests.post(f"{BASE_URL}/api/sms/verify-code", json={
            "phone_number": "+61412345678",
            "code": "123456"
        })
        assert response.status_code == 200, f"Verify code failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should succeed in demo mode"
        assert data.get("valid") == True, "Code should be valid in demo mode"
        assert data.get("demo_mode") == True, "Should be in demo mode"
        print("✓ SMS code verified (demo mode)")
    
    def test_verify_invalid_code_format(self):
        """Test verifying invalid code format"""
        response = requests.post(f"{BASE_URL}/api/sms/verify-code", json={
            "phone_number": "+61412345678",
            "code": "12345"  # Only 5 digits
        })
        assert response.status_code == 200  # Returns 200 with success=false
        
        data = response.json()
        assert data.get("success") == False or data.get("valid") == False, "Invalid code format should fail"
        print("✓ Invalid code format correctly rejected")
    
    def test_format_phone_number(self):
        """Test phone number formatting"""
        response = requests.post(f"{BASE_URL}/api/sms/format-number", params={
            "phone": "0412345678",
            "country_code": "61"
        })
        assert response.status_code == 200, f"Format number failed: {response.text}"
        
        data = response.json()
        assert "formatted" in data, "Missing formatted number"
        assert data["formatted"].startswith("+61"), "Should start with +61"
        print(f"✓ Phone formatted: 0412345678 -> {data['formatted']}")
    
    def test_validate_phone_number(self):
        """Test phone number validation"""
        response = requests.post(f"{BASE_URL}/api/sms/validate-number", params={
            "phone": "+61412345678"
        })
        assert response.status_code == 200, f"Validate number failed: {response.text}"
        
        data = response.json()
        assert data.get("valid") == True, "Valid phone should pass validation"
        print("✓ Phone number validated")


class TestScenarioSimulator:
    """Scenario Simulator endpoint tests"""
    
    def test_simulate_scenario(self):
        """Test scenario simulation with Monte Carlo"""
        scenario_input = {
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_savings": 200000,
            "annual_income": 185000,
            "annual_expenses": 100000,
            "savings_rate": 0.20,
            "current_super": 580000,
            "employer_super_rate": 0.115,
            "investment_return": 0.07,
            "inflation_rate": 0.025,
            "property_value": 1200000,
            "property_growth": 0.04,
            "debt_balance": 512000,
            "debt_interest_rate": 0.0619,
            "debt_repayment_monthly": 3850,
            "risk_profile": "moderate"
        }
        
        response = requests.post(f"{BASE_URL}/api/scenarios/simulate", json=scenario_input)
        assert response.status_code == 200, f"Simulation failed: {response.text}"
        
        data = response.json()
        assert "results" in data, "Missing results"
        assert "projections" in data, "Missing projections"
        
        results = data["results"]
        assert "success_probability" in results, "Missing success_probability"
        assert "retirement_wealth" in results, "Missing retirement_wealth"
        assert 0 <= results["success_probability"] <= 100, "Probability should be 0-100"
        
        print(f"✓ Scenario simulated: {results['success_probability']}% success probability")
        print(f"  Retirement wealth: ${results['retirement_wealth']:,.0f}")
    
    def test_get_scenario_presets(self):
        """Test getting scenario presets"""
        response = requests.get(f"{BASE_URL}/api/scenarios/presets")
        assert response.status_code == 200, f"Presets request failed: {response.text}"
        
        data = response.json()
        assert "presets" in data, "Missing presets"
        assert len(data["presets"]) > 0, "Should have presets"
        print(f"✓ Scenario presets: {list(data['presets'].keys())}")


class TestMFAEndpoints:
    """MFA/2FA endpoint tests"""
    
    def test_mfa_status(self):
        """Test getting MFA status"""
        response = requests.get(f"{BASE_URL}/api/mfa/status/user_001")
        assert response.status_code == 200, f"MFA status failed: {response.text}"
        
        data = response.json()
        assert "mfa_enabled" in data, "Missing mfa_enabled"
        print(f"✓ MFA status: enabled={data['mfa_enabled']}")
    
    def test_mfa_setup(self):
        """Test MFA setup initialization"""
        response = requests.post(f"{BASE_URL}/api/mfa/setup", json={
            "user_id": "user_001",
            "user_email": TEST_EMAIL
        })
        assert response.status_code == 200, f"MFA setup failed: {response.text}"
        
        data = response.json()
        assert "secret" in data, "Missing secret"
        assert "qr_code_url" in data or "provisioning_uri" in data, "Missing QR code data"
        print("✓ MFA setup initialized")


class TestAuditLogging:
    """Audit logging endpoint tests"""
    
    def test_get_audit_logs(self):
        """Test getting audit logs"""
        response = requests.get(f"{BASE_URL}/api/audit/logs", params={"limit": 10})
        assert response.status_code == 200, f"Audit logs failed: {response.text}"
        
        data = response.json()
        assert "logs" in data, "Missing logs"
        print(f"✓ Audit logs: {len(data['logs'])} entries")
    
    def test_compliance_report(self):
        """Test getting compliance report"""
        response = requests.get(f"{BASE_URL}/api/audit/compliance-report")
        assert response.status_code == 200, f"Compliance report failed: {response.text}"
        
        data = response.json()
        assert "summary" in data or "compliance_status" in data, "Missing compliance data"
        print("✓ Compliance report retrieved")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("✓ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
