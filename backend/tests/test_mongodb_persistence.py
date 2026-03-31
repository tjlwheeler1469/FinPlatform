"""
Test MongoDB Persistence for Database Migration Features
- Digital Onboarding (Fact-Find) - POST/GET /api/factfind
- E-Signatures - POST/GET /api/esignature/*
- MFA Settings - POST/GET /api/mfa/*
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_"

class TestFactFindMongoDB:
    """Test MongoDB persistence for Digital Onboarding / Fact-Find"""
    
    def test_save_factfind_creates_new_record(self):
        """POST /api/factfind - Create new fact-find record"""
        client_id = f"{TEST_PREFIX}client_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "client_id": client_id,
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
                }
            },
            "progress": 30,
            "status": "in_progress"
        }
        
        response = requests.post(f"{BASE_URL}/api/factfind", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["client_id"] == client_id
        print(f"✓ Created fact-find for client: {client_id}")
        
        # Store for cleanup
        self.__class__.test_client_id = client_id
    
    def test_get_factfind_retrieves_from_db(self):
        """GET /api/factfind/{client_id} - Retrieve fact-find from MongoDB"""
        client_id = getattr(self.__class__, 'test_client_id', None)
        if not client_id:
            pytest.skip("No test client_id from previous test")
        
        response = requests.get(f"{BASE_URL}/api/factfind/{client_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify data structure
        assert data["client_id"] == client_id
        assert "data" in data
        assert data["data"]["personal"]["first_name"] == "Test"
        assert data["data"]["employment"]["salary_gross"] == 120000
        assert data["progress"] == 30
        assert data["status"] == "in_progress"
        print(f"✓ Retrieved fact-find from MongoDB: {client_id}")
    
    def test_update_factfind_persists_changes(self):
        """POST /api/factfind - Update existing fact-find"""
        client_id = getattr(self.__class__, 'test_client_id', None)
        if not client_id:
            pytest.skip("No test client_id from previous test")
        
        # Update with new data
        payload = {
            "client_id": client_id,
            "data": {
                "personal": {
                    "first_name": "Test",
                    "last_name": "User Updated",
                    "email": "test.updated@example.com",
                    "phone_mobile": "0400000001"
                },
                "employment": {
                    "employment_status": "full_time",
                    "salary_gross": 150000  # Updated salary
                },
                "assets": {
                    "superannuation": 300000,  # Updated super
                    "cash_bank": 75000
                }
            },
            "progress": 60,  # Updated progress
            "status": "in_progress"
        }
        
        response = requests.post(f"{BASE_URL}/api/factfind", json=payload)
        assert response.status_code == 200
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/factfind/{client_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["data"]["personal"]["last_name"] == "User Updated"
        assert data["data"]["employment"]["salary_gross"] == 150000
        assert data["progress"] == 60
        print(f"✓ Updated fact-find persisted in MongoDB")
    
    def test_get_nonexistent_factfind_returns_404(self):
        """GET /api/factfind/{client_id} - Non-existent returns 404"""
        response = requests.get(f"{BASE_URL}/api/factfind/nonexistent_client_xyz")
        assert response.status_code == 404
        print("✓ Non-existent fact-find returns 404")
    
    def test_list_factfinds(self):
        """GET /api/factfinds - List all fact-finds"""
        response = requests.get(f"{BASE_URL}/api/factfinds")
        
        assert response.status_code == 200
        data = response.json()
        assert "factfinds" in data
        assert "total" in data
        assert isinstance(data["factfinds"], list)
        print(f"✓ Listed {data['total']} fact-finds from MongoDB")


class TestESignatureMongoDB:
    """Test MongoDB persistence for E-Signature requests"""
    
    def test_send_signature_request_saves_to_db(self):
        """POST /api/esignature/send - Create signature request"""
        request_id = f"sig_{TEST_PREFIX}{uuid.uuid4().hex[:8]}"
        
        payload = {
            "request_id": request_id,
            "document_id": "soa",
            "document_name": "Statement of Advice (SOA)",
            "client_id": f"{TEST_PREFIX}client_esign",
            "client_name": "Test Client",
            "client_email": "test.esign@example.com",
            "message": "Please sign this document"
        }
        
        response = requests.post(f"{BASE_URL}/api/esignature/send", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["request_id"] == request_id
        print(f"✓ Created signature request: {request_id}")
        
        # Store for subsequent tests
        self.__class__.test_request_id = request_id
    
    def test_list_signature_requests_from_db(self):
        """GET /api/esignature/requests - List all requests from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/esignature/requests")
        
        assert response.status_code == 200
        data = response.json()
        assert "requests" in data
        assert "total" in data
        assert isinstance(data["requests"], list)
        print(f"✓ Listed {data['total']} signature requests from MongoDB")
    
    def test_sign_document_updates_in_db(self):
        """POST /api/esignature/sign/{id} - Sign document and update in MongoDB"""
        request_id = getattr(self.__class__, 'test_request_id', None)
        if not request_id:
            pytest.skip("No test request_id from previous test")
        
        signature_data = {
            "role": "client",
            "name": "Test Signer"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/esignature/sign/{request_id}",
            json=signature_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["signatures_count"] >= 1
        print(f"✓ Signed document, status: {data['status']}")
    
    def test_get_signature_request_from_db(self):
        """GET /api/esignature/{request_id} - Get specific request from MongoDB"""
        request_id = getattr(self.__class__, 'test_request_id', None)
        if not request_id:
            pytest.skip("No test request_id from previous test")
        
        response = requests.get(f"{BASE_URL}/api/esignature/{request_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["request_id"] == request_id
        assert data["document_name"] == "Statement of Advice (SOA)"
        assert len(data["signatures"]) >= 1
        assert data["signatures"][0]["name"] == "Test Signer"
        print(f"✓ Retrieved signature request with {len(data['signatures'])} signature(s)")
    
    def test_get_nonexistent_signature_request_returns_404(self):
        """GET /api/esignature/{request_id} - Non-existent returns 404"""
        response = requests.get(f"{BASE_URL}/api/esignature/nonexistent_sig_xyz")
        assert response.status_code == 404
        print("✓ Non-existent signature request returns 404")


class TestMFAMongoDB:
    """Test MongoDB persistence for MFA settings"""
    
    def test_setup_mfa_saves_to_db(self):
        """POST /api/mfa/setup - Setup MFA and save to MongoDB"""
        user_id = f"{TEST_PREFIX}user_mfa_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "user_id": user_id,
            "enabled": True,
            "method": "totp",
            "secret": "ABCD1234EFGH5678IJKL9012MNOP3456",
            "backup_codes": [
                {"code": "ABCD-1234", "used": False},
                {"code": "EFGH-5678", "used": False},
                {"code": "IJKL-9012", "used": False}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/mfa/setup", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] is True
        assert data["user_id"] == user_id
        assert data["mfa_enabled"] is True
        print(f"✓ Setup MFA for user: {user_id}")
        
        # Store for subsequent tests
        self.__class__.test_user_id = user_id
    
    def test_get_mfa_status_from_db(self):
        """GET /api/mfa/{user_id} - Retrieve MFA status from MongoDB"""
        user_id = getattr(self.__class__, 'test_user_id', None)
        if not user_id:
            pytest.skip("No test user_id from previous test")
        
        response = requests.get(f"{BASE_URL}/api/mfa/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == user_id
        assert data["enabled"] is True
        assert data["method"] == "totp"
        assert len(data["backup_codes"]) == 3
        print(f"✓ Retrieved MFA status from MongoDB: enabled={data['enabled']}")
    
    def test_verify_mfa_code(self):
        """POST /api/mfa/verify - Verify MFA code (mock accepts any 6-digit)"""
        user_id = getattr(self.__class__, 'test_user_id', None)
        if not user_id:
            pytest.skip("No test user_id from previous test")
        
        payload = {
            "user_id": user_id,
            "code": "123456"  # Mock accepts any 6-digit code
        }
        
        response = requests.post(f"{BASE_URL}/api/mfa/verify", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print("✓ MFA verification successful (mock)")
    
    def test_verify_mfa_invalid_code(self):
        """POST /api/mfa/verify - Invalid code returns failure"""
        payload = {
            "user_id": "any_user",
            "code": "12345"  # Only 5 digits - invalid
        }
        
        response = requests.post(f"{BASE_URL}/api/mfa/verify", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        print("✓ Invalid MFA code correctly rejected")
    
    def test_disable_mfa_updates_db(self):
        """POST /api/mfa/disable - Disable MFA and update in MongoDB"""
        user_id = getattr(self.__class__, 'test_user_id', None)
        if not user_id:
            pytest.skip("No test user_id from previous test")
        
        payload = {
            "user_id": user_id,
            "code": "123456"  # Valid 6-digit code
        }
        
        response = requests.post(f"{BASE_URL}/api/mfa/disable", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify MFA is disabled in DB
        get_response = requests.get(f"{BASE_URL}/api/mfa/{user_id}")
        assert get_response.status_code == 200
        mfa_data = get_response.json()
        assert mfa_data["enabled"] is False
        print("✓ MFA disabled and persisted in MongoDB")
    
    def test_get_mfa_nonexistent_user_returns_default(self):
        """GET /api/mfa/{user_id} - Non-existent user returns default disabled state"""
        response = requests.get(f"{BASE_URL}/api/mfa/nonexistent_user_xyz")
        
        assert response.status_code == 200
        data = response.json()
        assert data["enabled"] is False
        assert data["method"] is None
        print("✓ Non-existent user returns default MFA disabled state")


class TestDataPersistence:
    """Test that data persists across requests (simulating page refresh)"""
    
    def test_factfind_data_persists(self):
        """Verify fact-find data persists after creation"""
        client_id = f"{TEST_PREFIX}persist_test_{uuid.uuid4().hex[:8]}"
        
        # Create
        create_payload = {
            "client_id": client_id,
            "data": {"test_field": "persistence_test_value"},
            "progress": 50,
            "status": "in_progress"
        }
        create_response = requests.post(f"{BASE_URL}/api/factfind", json=create_payload)
        assert create_response.status_code == 200
        
        # Retrieve (simulating page refresh)
        get_response = requests.get(f"{BASE_URL}/api/factfind/{client_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["data"]["test_field"] == "persistence_test_value"
        assert data["progress"] == 50
        print("✓ Fact-find data persists across requests (MongoDB)")
    
    def test_esignature_data_persists(self):
        """Verify e-signature data persists after creation"""
        request_id = f"sig_{TEST_PREFIX}persist_{uuid.uuid4().hex[:8]}"
        
        # Create
        create_payload = {
            "request_id": request_id,
            "document_id": "fds",
            "document_name": "Fee Disclosure Statement",
            "client_id": "persist_client",
            "client_name": "Persist Test Client",
            "client_email": "persist@test.com"
        }
        create_response = requests.post(f"{BASE_URL}/api/esignature/send", json=create_payload)
        assert create_response.status_code == 200
        
        # Retrieve (simulating page refresh)
        get_response = requests.get(f"{BASE_URL}/api/esignature/{request_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["document_name"] == "Fee Disclosure Statement"
        assert data["client_name"] == "Persist Test Client"
        print("✓ E-signature data persists across requests (MongoDB)")
    
    def test_mfa_data_persists(self):
        """Verify MFA data persists after setup"""
        user_id = f"{TEST_PREFIX}mfa_persist_{uuid.uuid4().hex[:8]}"
        
        # Setup
        setup_payload = {
            "user_id": user_id,
            "enabled": True,
            "method": "totp",
            "secret": "PERSIST_TEST_SECRET_12345678",
            "backup_codes": [{"code": "TEST-CODE", "used": False}]
        }
        setup_response = requests.post(f"{BASE_URL}/api/mfa/setup", json=setup_payload)
        assert setup_response.status_code == 200
        
        # Retrieve (simulating page refresh)
        get_response = requests.get(f"{BASE_URL}/api/mfa/{user_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["enabled"] is True
        assert data["method"] == "totp"
        print("✓ MFA data persists across requests (MongoDB)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
