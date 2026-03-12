"""
Stress Testing and Reliability Verification for Australian Financial Planning SaaS
Tests secure data feeds with AES-256-GCM encryption (APRA CPS 234, Privacy Act 1988 compliant)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Basic health and API availability tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Australian Investment Analyzer" in data.get("message", "")
        print(f"✓ API root passed: {data}")
    
    def test_tax_rates_endpoint(self):
        """Test tax rates endpoint"""
        response = requests.get(f"{BASE_URL}/api/tax-rates")
        assert response.status_code == 200
        data = response.json()
        assert "personal" in data
        assert "company" in data
        print(f"✓ Tax rates endpoint passed")


class TestSecureDataFeeds:
    """Test secure data feeds with AES-256-GCM encryption"""
    
    def test_cdr_accounts_feed(self):
        """Test CDR bank accounts feed - GET /api/feeds/cdr/accounts/{customer_id}"""
        customer_id = "TEST_CUSTOMER_001"
        response = requests.get(f"{BASE_URL}/api/feeds/cdr/accounts/{customer_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        assert "accounts" in data["data"]
        assert "_security" in data
        assert data["_security"]["encrypted"] == True
        assert data["_security"]["encryption_standard"] == "AES-256-GCM"
        
        # Verify accounts have required fields
        accounts = data["data"]["accounts"]
        assert len(accounts) >= 1
        for account in accounts:
            assert "accountId" in account
            assert "balance" in account
            assert "productCategory" in account
        
        print(f"✓ CDR accounts feed passed: {len(accounts)} accounts returned with AES-256-GCM encryption")
    
    def test_cdr_transactions_feed(self):
        """Test CDR transactions feed - GET /api/feeds/cdr/transactions/{account_id}"""
        account_id = "ACC123456789012"
        response = requests.get(f"{BASE_URL}/api/feeds/cdr/transactions/{account_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        assert "transactions" in data["data"]
        assert "_security" in data
        assert data["_security"]["encrypted"] == True
        
        transactions = data["data"]["transactions"]
        print(f"✓ CDR transactions feed passed: {len(transactions)} transactions returned")
    
    def test_super_balance_feed(self):
        """Test superannuation balance feed - GET /api/feeds/super/{member_number}"""
        member_number = "MEM123456"
        response = requests.get(f"{BASE_URL}/api/feeds/super/{member_number}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "member_number" in data
        assert "fund" in data
        assert "balance" in data
        assert "investments" in data
        assert "_security" in data
        assert data["_security"]["apra_compliant"] == True
        
        # Verify balance structure
        balance = data["balance"]
        assert "total" in balance
        assert "currency" in balance
        assert balance["currency"] == "AUD"
        
        print(f"✓ Super balance feed passed: ${balance['total']:,.2f} total balance")
    
    def test_asx_prices_feed(self):
        """Test ASX stock prices feed - GET /api/feeds/asx/prices?symbols=BHP,CBA"""
        response = requests.get(f"{BASE_URL}/api/feeds/asx/prices?symbols=BHP,CBA")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "data" in data
        assert "meta" in data
        assert data["meta"]["exchange"] == "ASX"
        assert data["meta"]["currency"] == "AUD"
        
        prices = data["data"]
        assert len(prices) >= 1
        for price in prices:
            assert "symbol" in price
            assert "price" in price
            assert "name" in price
        
        print(f"✓ ASX prices feed passed: {len(prices)} stocks returned")
    
    def test_property_valuation_feed(self):
        """Test property valuation feed - GET /api/feeds/property/valuation?address=123+Test+St"""
        response = requests.get(f"{BASE_URL}/api/feeds/property/valuation?address=123+Test+St+Sydney")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "address" in data
        assert "valuation" in data
        assert "property_type" in data
        assert "_security" in data
        assert data["_security"]["encrypted"] == True
        
        valuation = data["valuation"]
        assert "estimate" in valuation
        assert "low" in valuation
        assert "high" in valuation
        assert "confidence" in valuation
        
        print(f"✓ Property valuation feed passed: ${valuation['estimate']:,.0f} estimate")


class TestSecurityCompliance:
    """Test security and encryption compliance endpoints"""
    
    def test_compliance_report(self):
        """Test security compliance report - GET /api/security/compliance"""
        response = requests.get(f"{BASE_URL}/api/security/compliance")
        assert response.status_code == 200
        data = response.json()
        
        # Verify compliance structure
        assert "encryption_status" in data
        assert "data_protection" in data
        assert "regulatory_compliance" in data
        
        # Verify encryption is AES-256-GCM
        encryption = data["encryption_status"]
        assert encryption["algorithm"] == "AES-256-GCM"
        assert "256" in encryption["key_strength"]
        assert encryption["compliant"] == True
        
        # Verify regulatory compliance
        compliance = data["regulatory_compliance"]
        assert compliance["apra_cps_234"] == "Compliant"
        assert compliance["privacy_act_1988"] == "Compliant"
        
        print(f"✓ Compliance report passed: {encryption['algorithm']} encryption, APRA CPS 234 compliant")
    
    def test_encryption_info(self):
        """Test encryption info endpoint - GET /api/security/encryption-info"""
        response = requests.get(f"{BASE_URL}/api/security/encryption-info")
        assert response.status_code == 200
        data = response.json()
        
        # Verify encryption configuration
        assert data["encryption_standard"] == "AES-256-GCM"
        assert data["key_length_bits"] == 256
        assert data["kdf_algorithm"] == "PBKDF2-SHA256"
        assert data["kdf_iterations"] >= 100000  # Exceeds OWASP minimum
        
        # Verify compliance certifications
        assert "compliance_certifications" in data
        certs = data["compliance_certifications"]
        assert certs["apra_cps_234"] == True
        assert certs["privacy_act_1988"] == True
        
        print(f"✓ Encryption info passed: {data['encryption_standard']}, {data['kdf_iterations']} KDF iterations")


class TestCRMEndpoints:
    """Test CRM endpoints for client management"""
    
    def test_crm_households(self):
        """Test CRM households endpoint"""
        response = requests.get(f"{BASE_URL}/api/crm/households")
        assert response.status_code == 200
        data = response.json()
        assert "households" in data
        print(f"✓ CRM households passed: {len(data['households'])} households")
    
    def test_crm_tasks(self):
        """Test CRM tasks endpoint"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        print(f"✓ CRM tasks passed: {len(data['tasks'])} tasks")
    
    def test_crm_meetings(self):
        """Test CRM meetings endpoint"""
        response = requests.get(f"{BASE_URL}/api/crm/meetings")
        assert response.status_code == 200
        data = response.json()
        assert "meetings" in data
        print(f"✓ CRM meetings passed: {len(data['meetings'])} meetings")


class TestAnalysisEndpoints:
    """Test financial analysis endpoints"""
    
    def test_tax_analysis(self):
        """Test tax analysis endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/tax",
            params={"taxable_income": 150000, "entity_type": "personal"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_tax" in data
        assert "effective_rate" in data
        print(f"✓ Tax analysis passed: ${data['total_tax']:,.2f} tax on $150,000")
    
    def test_monte_carlo_simulation(self):
        """Test Monte Carlo simulation endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/monte-carlo",
            params={
                "initial_value": 100000,
                "expected_return": 0.08,
                "volatility": 0.15,
                "years": 10,
                "simulations": 100
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "final_value_median" in data
        assert "probability_of_loss" in data
        print(f"✓ Monte Carlo passed: median ${data['final_value_median']:,.0f}")
    
    def test_loan_analysis(self):
        """Test loan analysis endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/analyze/loan",
            params={"principal": 500000, "annual_rate": 6.5, "years": 30}
        )
        assert response.status_code == 200
        data = response.json()
        assert "monthly_payment" in data
        assert "total_interest" in data
        print(f"✓ Loan analysis passed: ${data['monthly_payment']:,.2f}/month")


class TestStressReliability:
    """Stress testing for reliability verification"""
    
    def test_rapid_api_calls(self):
        """Test rapid successive API calls for reliability"""
        endpoints = [
            "/api/health",
            "/api/tax-rates",
            "/api/feeds/asx/prices?symbols=BHP",
            "/api/security/compliance"
        ]
        
        success_count = 0
        total_calls = 20
        
        for i in range(total_calls):
            endpoint = endpoints[i % len(endpoints)]
            try:
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
                if response.status_code == 200:
                    success_count += 1
            except Exception as e:
                print(f"  Call {i+1} failed: {e}")
        
        success_rate = (success_count / total_calls) * 100
        assert success_rate >= 95, f"Success rate {success_rate}% below 95% threshold"
        print(f"✓ Stress test passed: {success_rate}% success rate ({success_count}/{total_calls})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
