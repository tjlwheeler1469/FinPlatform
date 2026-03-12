"""
Test Phase 2 APIs: Fact-Find, E-Signature, and MFA endpoints
"""
import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFactFindAPI:
    """Test Fact-Find (Digital Onboarding) endpoints"""
    
    def test_save_factfind(self):
        """Test saving a fact-find form"""
        # API expects: client_id, data (dict), progress, status
        factfind_data = {
            "client_id": "test_client_001",
            "data": {
                "personal": {
                    "first_name": "Test",
                    "last_name": "User",
                    "email": "test@example.com",
                    "phone_mobile": "0400000000"
                },
                "employment": {
                    "employment_status": "full_time",
                    "salary_gross": 120000
                },
                "assets": {
                    "superannuation": 250000,
                    "cash_bank": 50000
                },
                "liabilities": {
                    "home_loan": 400000
                },
                "insurance": {
                    "has_will": True
                },
                "goals": {
                    "retirement_age": 65
                },
                "risk": {
                    "answers": {},
                    "score": 0,
                    "profile": "balanced"
                }
            },
            "progress": 50,
            "status": "in_progress"
        }
        
        response = requests.post(f"{BASE_URL}/api/factfind", json=factfind_data)
        print(f"Save factfind response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("client_id") == "test_client_001"
        print(f"Factfind saved successfully: {data}")
    
    def test_get_factfind(self):
        """Test retrieving a fact-find form"""
        response = requests.get(f"{BASE_URL}/api/factfind/test_client_001")
        print(f"Get factfind response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("client_id") == "test_client_001"
        assert "data" in data
        print(f"Factfind retrieved: {data.get('client_id')}")
    
    def test_list_factfinds(self):
        """Test listing all fact-finds"""
        response = requests.get(f"{BASE_URL}/api/factfinds")
        print(f"List factfinds response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "factfinds" in data
        assert "total" in data
        print(f"Total factfinds: {data.get('total')}")


class TestESignatureAPI:
    """Test E-Signature (DocuSign MOCK) endpoints"""
    
    def test_send_signature_request(self):
        """Test sending a signature request"""
        # API expects: document_id, document_name, client_id, client_name, client_email
        request_data = {
            "document_id": "soa",
            "document_name": "Statement of Advice (SOA)",
            "client_id": "test_client_esign_001",
            "client_name": "Test Client",
            "client_email": "test@client.com",
            "message": "Please sign this document"
        }
        
        response = requests.post(f"{BASE_URL}/api/esignature/send", json=request_data)
        print(f"Send signature response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "request_id" in data
        print(f"Signature request created: {data.get('request_id')}")
        return data.get("request_id")
    
    def test_get_signature_requests(self):
        """Test getting all signature requests"""
        response = requests.get(f"{BASE_URL}/api/esignature/requests")
        print(f"Get signature requests response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "requests" in data
        print(f"Total signature requests: {len(data.get('requests', []))}")
    
    def test_sign_document(self):
        """Test signing a document"""
        # First create a request
        request_data = {
            "document_id": "fds",
            "document_name": "Fee Disclosure Statement",
            "client_id": "test_client_sign_001",
            "client_name": "Sign Test Client",
            "client_email": "signtest@client.com"
        }
        create_response = requests.post(f"{BASE_URL}/api/esignature/send", json=request_data)
        assert create_response.status_code == 200, f"Failed to create request: {create_response.text}"
        request_id = create_response.json().get("request_id")
        print(f"Created signature request: {request_id}")
        
        # Now sign it
        sign_data = {
            "name": "Sign Test Client",
            "role": "client"
        }
        response = requests.post(f"{BASE_URL}/api/esignature/sign/{request_id}", json=sign_data)
        print(f"Sign document response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"Document signed: {data}")
    
    def test_get_signature_request_by_id(self):
        """Test getting a specific signature request"""
        # First create a request
        request_data = {
            "document_id": "kyc",
            "document_name": "KYC Verification Form",
            "client_id": "test_client_get_001",
            "client_name": "Get Test Client",
            "client_email": "gettest@client.com"
        }
        create_response = requests.post(f"{BASE_URL}/api/esignature/send", json=request_data)
        assert create_response.status_code == 200, f"Failed to create request: {create_response.text}"
        request_id = create_response.json().get("request_id")
        print(f"Created signature request: {request_id}")
        
        # Get it by ID
        response = requests.get(f"{BASE_URL}/api/esignature/{request_id}")
        print(f"Get signature request by ID response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("request_id") == request_id
        print(f"Signature request retrieved: {data.get('request_id')}")


class TestMFAAPI:
    """Test MFA (Multi-Factor Authentication) endpoints"""
    
    def test_setup_mfa(self):
        """Test setting up MFA"""
        setup_data = {
            "user_id": "test_user_mfa_001",
            "enabled": True,
            "method": "totp",
            "secret": "ABCDEFGHIJKLMNOP"
        }
        
        response = requests.post(f"{BASE_URL}/api/mfa/setup", json=setup_data)
        print(f"Setup MFA response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("mfa_enabled") == True
        print(f"MFA setup successful: {data}")
    
    def test_get_mfa_status(self):
        """Test getting MFA status"""
        response = requests.get(f"{BASE_URL}/api/mfa/test_user_mfa_001")
        print(f"Get MFA status response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("user_id") == "test_user_mfa_001"
        assert data.get("enabled") == True
        print(f"MFA status: enabled={data.get('enabled')}")
    
    def test_verify_mfa(self):
        """Test verifying MFA code"""
        verify_data = {
            "user_id": "test_user_mfa_001",
            "code": "123456"  # Mock accepts any 6-digit code
        }
        
        response = requests.post(f"{BASE_URL}/api/mfa/verify", json=verify_data)
        print(f"Verify MFA response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"MFA verification: {data}")
    
    def test_disable_mfa(self):
        """Test disabling MFA"""
        disable_data = {
            "user_id": "test_user_mfa_001",
            "code": "123456"
        }
        
        response = requests.post(f"{BASE_URL}/api/mfa/disable", json=disable_data)
        print(f"Disable MFA response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"MFA disabled: {data}")


class TestHealthCheck:
    """Test basic health check"""
    
    def test_health(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Health check response: {response.status_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"Health check passed: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
