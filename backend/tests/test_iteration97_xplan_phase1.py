"""
Xplan Integration Phase 1 MVP Tests
====================================
Tests for Xplan Mock API and Integration Service:
- Mock API endpoints (clients, portfolios, transactions, risk, file notes)
- Integration service (OAuth, sync, field mapping, audit logging)
- File note write-back functionality
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test client IDs from mock data
TEST_CLIENT_IDS = ["XP-001", "XP-002", "XP-003", "XP-004", "XP-005"]


class TestXplanMockAPI:
    """Tests for Xplan Mock API endpoints at /api/xplan-mock/*"""
    
    def test_mock_health_check(self):
        """Test mock Xplan API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/xplan-mock/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["environment"] == "mock"
        assert "api_version" in data
        print(f"PASS: Mock health check - status: {data['status']}, version: {data['api_version']}")
    
    def test_mock_list_clients(self):
        """Test GET /api/xplan-mock/clients - List 5 mock clients"""
        response = requests.get(f"{BASE_URL}/api/xplan-mock/clients")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert len(data["clients"]) == 5
        assert data["total"] == 5
        
        # Verify client structure
        client = data["clients"][0]
        assert "client_id" in client
        assert "first_name" in client
        assert "last_name" in client
        assert "email" in client
        assert "address" in client
        print(f"PASS: List mock clients - {data['total']} clients returned")
    
    def test_mock_get_client_by_id(self):
        """Test GET /api/xplan-mock/clients/{id} - Get client by ID"""
        for client_id in TEST_CLIENT_IDS[:2]:
            response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/{client_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["client_id"] == client_id
            assert "first_name" in data
            assert "last_name" in data
            print(f"PASS: Get client {client_id} - {data['first_name']} {data['last_name']}")
    
    def test_mock_get_client_not_found(self):
        """Test 404 for non-existent client"""
        response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/INVALID-ID")
        assert response.status_code == 404
        print("PASS: 404 returned for non-existent client")
    
    def test_mock_get_portfolio(self):
        """Test GET /api/xplan-mock/clients/{id}/portfolio - Get portfolio"""
        client_id = "XP-001"
        response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/{client_id}/portfolio")
        assert response.status_code == 200
        data = response.json()
        
        assert "portfolio_id" in data
        assert "total_value" in data
        assert "holdings" in data
        assert "asset_class_split" in data
        assert isinstance(data["holdings"], list)
        assert len(data["holdings"]) > 0
        
        # Verify holding structure
        holding = data["holdings"][0]
        assert "security_code" in holding
        assert "product_name" in holding
        assert "quantity" in holding
        assert "price" in holding
        assert "value" in holding
        assert "asset_class" in holding
        print(f"PASS: Get portfolio for {client_id} - ${data['total_value']:,.2f}, {len(data['holdings'])} holdings")
    
    def test_mock_get_transactions(self):
        """Test GET /api/xplan-mock/clients/{id}/transactions - Get transactions"""
        client_id = "XP-002"
        response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/{client_id}/transactions")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == client_id
        assert "transactions" in data
        assert "total" in data
        assert len(data["transactions"]) > 0
        
        # Verify transaction structure
        tx = data["transactions"][0]
        assert "transaction_id" in tx
        assert "date" in tx
        assert "type" in tx
        assert "amount" in tx
        assert "product" in tx
        print(f"PASS: Get transactions for {client_id} - {data['total']} transactions")
    
    def test_mock_get_risk_profile(self):
        """Test GET /api/xplan-mock/clients/{id}/risk - Get risk profile"""
        for client_id in TEST_CLIENT_IDS:
            response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/{client_id}/risk")
            assert response.status_code == 200
            data = response.json()
            
            assert data["client_id"] == client_id
            assert "risk_score" in data
            assert "risk_band" in data
            assert "last_review_date" in data
            print(f"PASS: Risk profile for {client_id} - {data['risk_band']} (score: {data['risk_score']})")
    
    def test_mock_create_file_note(self):
        """Test POST /api/xplan-mock/clients/{id}/file_notes - Create file note"""
        client_id = "XP-001"
        note_data = {
            "title": "TEST_Scenario Analysis Note",
            "content": "This is a test file note created by automated testing.",
            "created_by": "TEST_ADV001"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/xplan-mock/clients/{client_id}/file_notes",
            json=note_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "note_id" in data
        assert data["client_id"] == client_id
        assert "created_date" in data
        print(f"PASS: Created file note {data['note_id']} for {client_id}")
    
    def test_mock_list_file_notes(self):
        """Test GET /api/xplan-mock/clients/{id}/file_notes - List file notes"""
        client_id = "XP-001"
        response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/{client_id}/file_notes")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == client_id
        assert "file_notes" in data
        assert "total" in data
        print(f"PASS: List file notes for {client_id} - {data['total']} notes")
    
    def test_mock_oauth_token(self):
        """Test POST /api/xplan-mock/oauth/token - Get OAuth token"""
        response = requests.post(
            f"{BASE_URL}/api/xplan-mock/oauth/token",
            data={
                "client_id": "mock_client",
                "client_secret": "mock_secret",
                "grant_type": "client_credentials"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "Bearer"
        assert "expires_in" in data
        assert "refresh_token" in data
        print(f"PASS: OAuth token obtained - expires in {data['expires_in']}s")


class TestXplanIntegrationService:
    """Tests for Xplan Integration Service at /api/xplan/*"""
    
    def test_integration_status(self):
        """Test GET /api/xplan/status - Integration status"""
        response = requests.get(f"{BASE_URL}/api/xplan/status")
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "mode" in data
        assert data["mode"] == "mock"  # Using mock API
        assert "capabilities" in data
        assert "read" in data["capabilities"]
        assert "write" in data["capabilities"]
        assert "clients" in data["capabilities"]["read"]
        assert "file_notes" in data["capabilities"]["write"]
        print(f"PASS: Integration status - mode: {data['mode']}, status: {data['status']}")
    
    def test_integration_connect(self):
        """Test POST /api/xplan/connect - OAuth connect"""
        response = requests.post(f"{BASE_URL}/api/xplan/connect")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "message" in data
        assert "token_prefix" in data
        print(f"PASS: Connected to Xplan - {data['message']}")
    
    def test_integration_list_clients(self):
        """Test GET /api/xplan/clients - List synced clients"""
        response = requests.get(f"{BASE_URL}/api/xplan/clients?sync_first=true")
        assert response.status_code == 200
        data = response.json()
        
        assert "clients" in data
        assert "total" in data
        assert "source" in data
        
        if data["total"] > 0:
            client = data["clients"][0]
            # Verify field mapping: client_id -> external_id
            assert "external_id" in client
            assert "first_name" in client
            assert "last_name" in client
            assert "source" in client
            assert client["source"] == "xplan"
        print(f"PASS: List synced clients - {data['total']} clients from {data['source']}")
    
    def test_integration_get_client_with_profile(self):
        """Test GET /api/xplan/clients/{id} - Get client with full profile"""
        client_id = "XP-001"
        response = requests.get(f"{BASE_URL}/api/xplan/clients/{client_id}?refresh=true")
        assert response.status_code == 200
        data = response.json()
        
        # Verify mapped fields
        assert data["external_id"] == client_id
        assert "first_name" in data
        assert "last_name" in data
        assert "risk_profile" in data  # From profile mapping
        assert "risk_score" in data    # From risk mapping
        assert "last_synced" in data
        print(f"PASS: Get client {client_id} with profile - risk: {data.get('risk_profile')}")
    
    def test_integration_get_portfolio(self):
        """Test GET /api/xplan/clients/{id}/portfolio - Get mapped portfolio"""
        client_id = "XP-002"
        response = requests.get(f"{BASE_URL}/api/xplan/clients/{client_id}/portfolio")
        assert response.status_code == 200
        data = response.json()
        
        # Verify mapped fields
        assert data["client_id"] == client_id
        assert "portfolio_id" in data
        assert "portfolio_value" in data
        assert "allocation" in data
        assert "holdings" in data
        assert "last_synced" in data
        
        if data["holdings"]:
            holding = data["holdings"][0]
            # Verify holding field mapping: security_code -> product_id
            assert "product_id" in holding
            assert "product_name" in holding
            assert "market_value" in holding
            assert "asset_class" in holding
        print(f"PASS: Get portfolio for {client_id} - ${data['portfolio_value']:,.2f}")
    
    def test_integration_get_transactions(self):
        """Test GET /api/xplan/clients/{id}/transactions - Get transactions"""
        client_id = "XP-003"
        response = requests.get(f"{BASE_URL}/api/xplan/clients/{client_id}/transactions")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == client_id
        assert "transactions" in data
        assert "total" in data
        
        if data["transactions"]:
            tx = data["transactions"][0]
            # Verify transaction field mapping
            assert "transaction_id" in tx
            assert "transaction_date" in tx
            assert "transaction_type" in tx
            assert "amount" in tx
            assert "product_id" in tx
        print(f"PASS: Get transactions for {client_id} - {data['total']} transactions")
    
    def test_integration_write_file_note(self):
        """Test POST /api/xplan/file-notes/write - Write file note to Xplan"""
        note_data = {
            "client_id": "XP-001",
            "title": "TEST_AdviceOS Scenario Summary",
            "content": "This is a test file note written through the integration service.",
            "adviser_id": "TEST_ADV001",
            "scenario_id": "TEST_SCN001",
            "compliance_result": "COMPLIANT"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/xplan/file-notes/write",
            json=note_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "note_id" in data
        assert data["client_id"] == "XP-001"
        assert data["synced_to_xplan"] is True
        print(f"PASS: File note written to Xplan - {data['note_id']}")
    
    def test_integration_list_file_notes(self):
        """Test GET /api/xplan/file-notes/{client_id} - List file notes"""
        client_id = "XP-001"
        response = requests.get(f"{BASE_URL}/api/xplan/file-notes/{client_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == client_id
        assert "local_notes" in data
        assert "xplan_notes" in data
        assert "total_local" in data
        assert "total_xplan" in data
        print(f"PASS: List file notes for {client_id} - local: {data['total_local']}, xplan: {data['total_xplan']}")
    
    def test_integration_api_logs(self):
        """Test GET /api/xplan/logs - API interaction logs"""
        response = requests.get(f"{BASE_URL}/api/xplan/logs?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        assert "total" in data
        
        if data["logs"]:
            log = data["logs"][0]
            assert "id" in log
            assert "user_id" in log
            assert "action" in log
            assert "xplan_endpoint" in log
            assert "timestamp" in log
        print(f"PASS: API logs retrieved - {data['total']} logs")
    
    def test_integration_sync_status(self):
        """Test GET /api/xplan/sync/status - Sync status"""
        response = requests.get(f"{BASE_URL}/api/xplan/sync/status")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_synced_clients" in data
        assert "sync_strategy" in data
        assert data["sync_strategy"]["primary"] == "real_time_on_load"
        print(f"PASS: Sync status - {data['total_synced_clients']} clients synced")
    
    def test_integration_sync_single_client(self):
        """Test POST /api/xplan/sync/client/{id} - Sync single client"""
        client_id = "XP-004"
        response = requests.post(f"{BASE_URL}/api/xplan/sync/client/{client_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["client_id"] == client_id
        assert "synced" in data
        assert data["synced"]["client_data"] is True
        assert data["synced"]["portfolio"] is True
        assert "duration_seconds" in data
        print(f"PASS: Synced client {client_id} in {data['duration_seconds']}s")


class TestFieldMapping:
    """Tests to verify Xplan fields are mapped to AdviceOS fields correctly"""
    
    def test_client_field_mapping(self):
        """Verify client_id -> external_id mapping"""
        # First sync a client
        response = requests.get(f"{BASE_URL}/api/xplan/clients/XP-001?refresh=true")
        assert response.status_code == 200
        data = response.json()
        
        # Verify mappings
        assert data["external_id"] == "XP-001"  # client_id -> external_id
        assert "dob" in data  # date_of_birth -> dob
        assert "source" in data
        assert data["source"] == "xplan"
        print("PASS: Client field mapping verified (client_id -> external_id)")
    
    def test_risk_profile_mapping(self):
        """Verify risk_band -> risk_profile mapping"""
        response = requests.get(f"{BASE_URL}/api/xplan/clients/XP-001?refresh=true")
        assert response.status_code == 200
        data = response.json()
        
        # risk_band from Xplan should map to risk_profile in AdviceOS
        assert "risk_profile" in data
        assert data["risk_profile"] in ["Balanced", "Growth", "Conservative", "High Growth", "Defensive"]
        print(f"PASS: Risk profile mapping verified - {data['risk_profile']}")
    
    def test_portfolio_holding_mapping(self):
        """Verify holdings mapped with product_id"""
        response = requests.get(f"{BASE_URL}/api/xplan/clients/XP-001/portfolio")
        assert response.status_code == 200
        data = response.json()
        
        if data["holdings"]:
            holding = data["holdings"][0]
            # security_code -> product_id
            assert "product_id" in holding
            # value -> market_value
            assert "market_value" in holding
            print(f"PASS: Portfolio holding mapping verified - product_id: {holding['product_id']}")
    
    def test_transaction_mapping(self):
        """Verify transaction field mapping"""
        response = requests.get(f"{BASE_URL}/api/xplan/clients/XP-001/transactions")
        assert response.status_code == 200
        data = response.json()
        
        if data["transactions"]:
            tx = data["transactions"][0]
            # date -> transaction_date
            assert "transaction_date" in tx
            # type -> transaction_type
            assert "transaction_type" in tx
            # product -> product_id
            assert "product_id" in tx
            print(f"PASS: Transaction mapping verified - type: {tx['transaction_type']}")


class TestAuditLogging:
    """Tests to verify audit logging of all API interactions"""
    
    def test_api_calls_logged(self):
        """Verify API calls are logged"""
        # Make a few API calls
        requests.get(f"{BASE_URL}/api/xplan/clients/XP-001?refresh=true")
        requests.get(f"{BASE_URL}/api/xplan/clients/XP-001/portfolio")
        
        # Check logs
        response = requests.get(f"{BASE_URL}/api/xplan/logs?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] > 0
        
        # Verify log structure
        log = data["logs"][0]
        assert "id" in log
        assert "user_id" in log
        assert "action" in log
        assert "xplan_endpoint" in log
        assert "status_code" in log
        assert "timestamp" in log
        print(f"PASS: API calls logged - {data['total']} logs found")
    
    def test_log_contains_duration(self):
        """Verify logs contain duration_ms"""
        response = requests.get(f"{BASE_URL}/api/xplan/logs?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        if data["logs"]:
            # Find a log with duration
            logs_with_duration = [l for l in data["logs"] if l.get("duration_ms") is not None]
            if logs_with_duration:
                log = logs_with_duration[0]
                assert "duration_ms" in log
                assert isinstance(log["duration_ms"], (int, float))
                print(f"PASS: Log duration tracked - {log['duration_ms']:.0f}ms")
            else:
                print("INFO: No logs with duration found yet")


class TestAllMockClients:
    """Test all 5 mock clients"""
    
    @pytest.mark.parametrize("client_id", TEST_CLIENT_IDS)
    def test_mock_client_exists(self, client_id):
        """Verify each mock client exists"""
        response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/{client_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["client_id"] == client_id
        print(f"PASS: Client {client_id} exists")
    
    @pytest.mark.parametrize("client_id", TEST_CLIENT_IDS)
    def test_mock_client_has_portfolio(self, client_id):
        """Verify each mock client has portfolio"""
        response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/{client_id}/portfolio")
        assert response.status_code == 200
        data = response.json()
        assert data["portfolio_id"] == f"PF-{client_id}"
        assert data["total_value"] > 0
        print(f"PASS: Client {client_id} has portfolio worth ${data['total_value']:,.2f}")
    
    @pytest.mark.parametrize("client_id", TEST_CLIENT_IDS)
    def test_mock_client_has_risk_profile(self, client_id):
        """Verify each mock client has risk profile"""
        response = requests.get(f"{BASE_URL}/api/xplan-mock/clients/{client_id}/risk")
        assert response.status_code == 200
        data = response.json()
        assert "risk_band" in data
        assert "risk_score" in data
        print(f"PASS: Client {client_id} risk: {data['risk_band']} (score: {data['risk_score']})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
