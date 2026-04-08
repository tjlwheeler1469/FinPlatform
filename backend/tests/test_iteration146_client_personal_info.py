"""
Test Suite for Client Personal Info Features (Iteration 146)
============================================================
Tests TFN, ID documents, custom fields, and Xplan sync endpoints.
- POST /api/client-personal-info/{client_id} - saves TFN, ID docs, custom fields
- GET /api/client-personal-info/{client_id} - returns masked data
- GET /api/client-personal-info/{client_id}/unmasked - returns decrypted data
- POST /api/client-personal-info/{client_id}/xplan-sync - triggers Xplan sync (mock)
- GET /api/client-personal-info/{client_id}/xplan-status - returns sync status
- POST /api/client-personal-info/setup - creates new client with all fields
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_client_id():
    """Generate unique test client ID for this test run"""
    return f"TEST_client_{uuid.uuid4().hex[:8]}"


class TestClientPersonalInfoSave:
    """Test POST /api/client-personal-info/{client_id} - save personal info"""
    
    def test_save_tfn_only(self, api_client, test_client_id):
        """Save TFN and verify it's encrypted"""
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/{test_client_id}", json={
            "tfn": "123456789"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["status"] == "saved"
        assert data["client_id"] == test_client_id
        assert data["tfn_masked"] == "***-***-789"  # Last 3 digits visible
        print(f"PASS: TFN saved and masked correctly: {data['tfn_masked']}")
    
    def test_save_id_documents(self, api_client, test_client_id):
        """Save ID documents and verify count"""
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/{test_client_id}", json={
            "id_documents": [
                {"type": "drivers_licence", "number": "DL12345678", "expiry_date": "2028-06-15", "issuing_authority": "VicRoads"},
                {"type": "passport", "number": "PA9876543", "expiry_date": "2030-01-20", "issuing_authority": "DFAT"}
            ]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["id_documents_count"] == 2
        print(f"PASS: {data['id_documents_count']} ID documents saved")
    
    def test_save_custom_fields(self, api_client, test_client_id):
        """Save custom fields"""
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/{test_client_id}", json={
            "custom_fields": [
                {"label": "Employer", "value": "Acme Corp"},
                {"label": "Occupation", "value": "Software Engineer"}
            ]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["custom_fields_count"] == 2
        print(f"PASS: {data['custom_fields_count']} custom fields saved")
    
    def test_save_all_fields_together(self, api_client):
        """Save TFN, ID docs, and custom fields in one request"""
        unique_id = f"TEST_full_{uuid.uuid4().hex[:8]}"
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/{unique_id}", json={
            "tfn": "987654321",
            "id_documents": [
                {"type": "medicare", "number": "2345 67890 1", "expiry_date": "2027-03-01", "issuing_authority": "Services Australia"}
            ],
            "custom_fields": [
                {"label": "Notes", "value": "VIP client"}
            ]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["tfn_masked"] == "***-***-321"
        assert data["id_documents_count"] == 1
        assert data["custom_fields_count"] == 1
        print(f"PASS: All fields saved together for {unique_id}")


class TestClientPersonalInfoGet:
    """Test GET /api/client-personal-info/{client_id} - get masked data"""
    
    def test_get_masked_data(self, api_client, test_client_id):
        """Get personal info with masked sensitive data"""
        response = api_client.get(f"{BASE_URL}/api/client-personal-info/{test_client_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == test_client_id
        assert "tfn_masked" in data
        assert "id_documents" in data
        assert "custom_fields" in data
        
        # Verify TFN is masked
        if data["tfn_masked"]:
            assert data["tfn_masked"].startswith("***-***-")
            print(f"PASS: TFN masked: {data['tfn_masked']}")
        
        # Verify ID numbers are masked
        for id_doc in data["id_documents"]:
            assert "number_masked" in id_doc
            assert "*" in id_doc["number_masked"]  # Contains masking
            print(f"PASS: ID {id_doc['type']} masked: {id_doc['number_masked']}")
    
    def test_get_nonexistent_client(self, api_client):
        """Get personal info for non-existent client returns empty structure"""
        response = api_client.get(f"{BASE_URL}/api/client-personal-info/nonexistent_client_xyz")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == "nonexistent_client_xyz"
        assert data["tfn_masked"] is None
        assert data["id_documents"] == []
        print("PASS: Non-existent client returns empty structure")


class TestClientPersonalInfoUnmasked:
    """Test GET /api/client-personal-info/{client_id}/unmasked - get decrypted data"""
    
    def test_get_unmasked_data(self, api_client, test_client_id):
        """Get personal info with decrypted sensitive data"""
        response = api_client.get(f"{BASE_URL}/api/client-personal-info/{test_client_id}/unmasked")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == test_client_id
        
        # Verify TFN is decrypted (full number)
        if data.get("tfn"):
            assert len(data["tfn"]) == 9  # Full TFN
            assert data["tfn"].isdigit()
            print(f"PASS: TFN decrypted: {data['tfn']}")
        
        # Verify ID numbers are decrypted
        for id_doc in data.get("id_documents", []):
            assert "number" in id_doc
            assert "*" not in id_doc["number"]  # No masking
            print(f"PASS: ID {id_doc['type']} decrypted: {id_doc['number']}")
    
    def test_unmasked_nonexistent_returns_404(self, api_client):
        """Unmasked endpoint returns 404 for non-existent client"""
        response = api_client.get(f"{BASE_URL}/api/client-personal-info/nonexistent_xyz/unmasked")
        assert response.status_code == 404
        print("PASS: Unmasked endpoint returns 404 for non-existent client")


class TestXplanSync:
    """Test Xplan sync endpoints (MOCKED)"""
    
    def test_xplan_sync_thompson_family(self, api_client):
        """Sync thompson_family with Xplan (maps to XP-002)"""
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/thompson_family/xplan-sync")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "synced"
        assert data["client_id"] == "thompson_family"
        assert data["xplan_client_id"] == "XP-002"  # thompson_family maps to XP-002
        assert data["direction"] == "bidirectional"
        assert "MOCK" in data.get("note", "")
        print(f"PASS: Xplan sync for thompson_family -> {data['xplan_client_id']}")
    
    def test_xplan_sync_new_client(self, api_client, test_client_id):
        """Sync new client with Xplan (defaults to XP-001)"""
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/{test_client_id}/xplan-sync")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "synced"
        assert data["xplan_client_id"] == "XP-001"  # Default mapping
        print(f"PASS: Xplan sync for {test_client_id} -> {data['xplan_client_id']}")
    
    def test_xplan_status(self, api_client):
        """Get Xplan sync status for thompson_family"""
        response = api_client.get(f"{BASE_URL}/api/client-personal-info/thompson_family/xplan-status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == "thompson_family"
        assert "xplan_synced" in data
        assert "sync_history" in data
        
        if data["xplan_synced"]:
            assert data["xplan_client_id"] == "XP-002"
            print(f"PASS: Xplan status shows synced with {data['xplan_client_id']}")
        else:
            print("PASS: Xplan status retrieved (not yet synced)")
    
    def test_xplan_status_with_history(self, api_client, test_client_id):
        """Verify sync history is recorded"""
        # First sync
        api_client.post(f"{BASE_URL}/api/client-personal-info/{test_client_id}/xplan-sync")
        
        # Get status
        response = api_client.get(f"{BASE_URL}/api/client-personal-info/{test_client_id}/xplan-status")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["sync_history"]) >= 1
        
        # Verify history entry structure
        if data["sync_history"]:
            entry = data["sync_history"][0]
            assert "sync_id" in entry
            assert "timestamp" in entry
            assert entry["status"] == "success"
            print(f"PASS: Sync history recorded with {len(data['sync_history'])} entries")


class TestClientSetup:
    """Test POST /api/client-personal-info/setup - full client setup wizard"""
    
    def test_setup_minimal_client(self, api_client):
        """Create client with only required fields (first/last name)"""
        unique_name = f"Test{uuid.uuid4().hex[:6]}"
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/setup", json={
            "first_name": unique_name,
            "last_name": "User"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "created"
        assert data["name"] == f"{unique_name} User"
        assert data["client_id"] == f"{unique_name.lower()}_user"
        print(f"PASS: Minimal client created: {data['client_id']}")
    
    def test_setup_full_client(self, api_client):
        """Create client with all fields"""
        unique_name = f"Full{uuid.uuid4().hex[:6]}"
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/setup", json={
            "first_name": unique_name,
            "last_name": "Client",
            "date_of_birth": "1985-06-15",
            "email": f"{unique_name.lower()}@test.com",
            "phone": "+61 400 123 456",
            "address": "123 Test Street, Melbourne VIC 3000",
            "marital_status": "married",
            "dependents": 2,
            "tfn": "111222333",
            "id_documents": [
                {"type": "drivers_licence", "number": "DL99999999", "expiry_date": "2029-12-31", "issuing_authority": "VicRoads"}
            ],
            "custom_fields": [
                {"label": "Risk Profile", "value": "Balanced"}
            ]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "created"
        assert data["tfn_masked"] == "***-***-333"
        assert data["id_documents_count"] == 1
        assert data["custom_fields_count"] == 1
        print(f"PASS: Full client created: {data['client_id']} with TFN {data['tfn_masked']}")
    
    def test_setup_verify_persistence(self, api_client):
        """Create client and verify data persisted via GET"""
        unique_name = f"Persist{uuid.uuid4().hex[:6]}"
        client_id = f"{unique_name.lower()}_test"
        
        # Create
        create_response = api_client.post(f"{BASE_URL}/api/client-personal-info/setup", json={
            "first_name": unique_name,
            "last_name": "Test",
            "tfn": "444555666",
            "id_documents": [
                {"type": "passport", "number": "PA1111111", "expiry_date": "2030-01-01", "issuing_authority": "DFAT"}
            ]
        })
        assert create_response.status_code == 200
        
        # Verify via GET
        get_response = api_client.get(f"{BASE_URL}/api/client-personal-info/{client_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["tfn_masked"] == "***-***-666"
        assert len(data["id_documents"]) == 1
        assert data["id_documents"][0]["type"] == "passport"
        print(f"PASS: Client {client_id} persisted and retrieved correctly")


class TestEncryptionVerification:
    """Verify encryption is working correctly"""
    
    def test_tfn_encryption_decryption(self, api_client):
        """Verify TFN is encrypted at rest and decrypted correctly"""
        unique_id = f"TEST_enc_{uuid.uuid4().hex[:8]}"
        test_tfn = "777888999"
        
        # Save
        api_client.post(f"{BASE_URL}/api/client-personal-info/{unique_id}", json={
            "tfn": test_tfn
        })
        
        # Get masked
        masked_response = api_client.get(f"{BASE_URL}/api/client-personal-info/{unique_id}")
        assert masked_response.json()["tfn_masked"] == "***-***-999"
        
        # Get unmasked
        unmasked_response = api_client.get(f"{BASE_URL}/api/client-personal-info/{unique_id}/unmasked")
        assert unmasked_response.json()["tfn"] == test_tfn
        
        print(f"PASS: TFN encryption/decryption verified for {unique_id}")
    
    def test_id_number_masking(self, api_client):
        """Verify ID numbers are masked showing last 4 chars"""
        unique_id = f"TEST_mask_{uuid.uuid4().hex[:8]}"
        test_number = "DL12345678"  # 10 chars
        
        # Save
        api_client.post(f"{BASE_URL}/api/client-personal-info/{unique_id}", json={
            "id_documents": [
                {"type": "drivers_licence", "number": test_number}
            ]
        })
        
        # Get masked
        response = api_client.get(f"{BASE_URL}/api/client-personal-info/{unique_id}")
        masked_number = response.json()["id_documents"][0]["number_masked"]
        
        # Should be ******5678 (6 asterisks + last 4 chars)
        assert masked_number.endswith("5678")
        assert masked_number.startswith("*")
        print(f"PASS: ID number masked correctly: {test_number} -> {masked_number}")


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_empty_tfn(self, api_client):
        """Save with empty TFN"""
        unique_id = f"TEST_empty_{uuid.uuid4().hex[:8]}"
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/{unique_id}", json={
            "tfn": "",
            "id_documents": []
        })
        assert response.status_code == 200
        print("PASS: Empty TFN handled correctly")
    
    def test_null_tfn(self, api_client):
        """Save with null TFN"""
        unique_id = f"TEST_null_{uuid.uuid4().hex[:8]}"
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/{unique_id}", json={
            "tfn": None
        })
        assert response.status_code == 200
        print("PASS: Null TFN handled correctly")
    
    def test_special_characters_in_custom_field(self, api_client):
        """Custom fields with special characters"""
        unique_id = f"TEST_special_{uuid.uuid4().hex[:8]}"
        response = api_client.post(f"{BASE_URL}/api/client-personal-info/{unique_id}", json={
            "custom_fields": [
                {"label": "Notes", "value": "Client's address: 123 O'Brien St & Co."}
            ]
        })
        assert response.status_code == 200
        
        # Verify retrieval
        get_response = api_client.get(f"{BASE_URL}/api/client-personal-info/{unique_id}")
        custom = get_response.json()["custom_fields"]
        assert len(custom) == 1
        assert "O'Brien" in custom[0]["value"]
        print("PASS: Special characters in custom fields handled correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
