"""
Test Suite for Xplan Integration - Iteration 89
================================================
Tests for Xplan system of record integration with Wealth Command.
Features: Demo mode, client sync, portfolio sync, push capabilities.
Note: Xplan API is MOCKED using demo mode for testing.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestXplanStatus:
    """Test Xplan connection status endpoint"""
    
    def test_get_xplan_status_default(self):
        """GET /api/xplan/status should return connection status"""
        response = requests.get(f"{BASE_URL}/api/xplan/status")
        assert response.status_code == 200
        
        data = response.json()
        # Should have connection info
        assert "connected" in data
        assert "mode" in data
        print(f"Xplan status: connected={data['connected']}, mode={data['mode']}")


class TestXplanDemoMode:
    """Test Xplan demo mode functionality"""
    
    def test_enable_demo_mode(self):
        """POST /api/xplan/enable-demo should enable demo mode"""
        response = requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("mode") == "demo"
        print(f"Demo mode enabled: {data}")
    
    def test_status_after_demo_enabled(self):
        """Status should show demo mode after enabling"""
        # First enable demo mode
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        # Check status
        response = requests.get(f"{BASE_URL}/api/xplan/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("connected") is True
        assert data.get("mode") == "demo"
        assert "site_url" in data
        print(f"Status after demo: {data}")


class TestXplanSync:
    """Test Xplan sync functionality"""
    
    def test_start_full_sync(self):
        """POST /api/xplan/sync should start a sync process"""
        # Enable demo mode first
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        # Start sync
        response = requests.post(f"{BASE_URL}/api/xplan/sync", json={
            "advisor_id": "default",
            "sync_type": "full"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("sync_type") == "full"
        print(f"Sync started: {data}")
    
    def test_start_clients_only_sync(self):
        """POST /api/xplan/sync with sync_type=clients"""
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        response = requests.post(f"{BASE_URL}/api/xplan/sync", json={
            "advisor_id": "default",
            "sync_type": "clients"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("sync_type") == "clients"
        print(f"Clients sync started: {data}")


class TestXplanClients:
    """Test Xplan synced clients endpoint"""
    
    def test_get_synced_clients(self):
        """GET /api/xplan/clients should return synced clients after sync"""
        # Enable demo mode and sync first
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        requests.post(f"{BASE_URL}/api/xplan/sync", json={
            "advisor_id": "default",
            "sync_type": "full"
        })
        
        # Wait a bit for background sync to complete
        import time
        time.sleep(3)
        
        # Get clients
        response = requests.get(f"{BASE_URL}/api/xplan/clients")
        assert response.status_code == 200
        
        data = response.json()
        assert "clients" in data
        assert "count" in data
        
        clients = data["clients"]
        print(f"Synced clients count: {data['count']}")
        
        # In demo mode, should have demo clients
        if len(clients) > 0:
            client = clients[0]
            # Check client has expected fields
            assert "entity_id" in client
            assert "first_name" in client
            assert "last_name" in client
            print(f"First client: {client.get('first_name')} {client.get('last_name')}")


class TestXplanClientDetails:
    """Test Xplan client details endpoint"""
    
    def test_get_client_details(self):
        """GET /api/xplan/client/{client_id} should return detailed client data"""
        # Enable demo mode and sync first
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        requests.post(f"{BASE_URL}/api/xplan/sync", json={
            "advisor_id": "default",
            "sync_type": "full"
        })
        
        # Wait for sync
        import time
        time.sleep(3)
        
        # Get clients list first
        clients_response = requests.get(f"{BASE_URL}/api/xplan/clients")
        clients_data = clients_response.json()
        
        if clients_data.get("count", 0) > 0:
            client_id = clients_data["clients"][0]["entity_id"]
            
            # Get client details
            response = requests.get(f"{BASE_URL}/api/xplan/client/{client_id}")
            assert response.status_code == 200
            
            data = response.json()
            assert "client" in data
            assert "portfolios" in data
            assert "assets" in data
            assert "goals" in data
            
            print(f"Client details for {client_id}: client={data['client'] is not None}, portfolios={len(data['portfolios'])}, assets={len(data['assets'])}, goals={len(data['goals'])}")
        else:
            pytest.skip("No clients found to test details")
    
    def test_get_nonexistent_client(self):
        """GET /api/xplan/client/{invalid_id} should return 404"""
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        response = requests.get(f"{BASE_URL}/api/xplan/client/nonexistent_client_123")
        assert response.status_code == 404
        print("Correctly returned 404 for nonexistent client")


class TestXplanTestConnection:
    """Test Xplan connection testing endpoint"""
    
    def test_connection_demo_mode(self):
        """POST /api/xplan/test-connection with demo site"""
        response = requests.post(f"{BASE_URL}/api/xplan/test-connection", json={
            "site_url": "demo",
            "username": "test_user",
            "password": "test_pass"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("mode") == "demo"
        print(f"Test connection (demo): {data}")


class TestXplanSyncHistory:
    """Test Xplan sync history endpoint"""
    
    def test_get_sync_history(self):
        """GET /api/xplan/sync-history should return sync history"""
        # Enable demo mode and do a sync first
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        requests.post(f"{BASE_URL}/api/xplan/sync", json={
            "advisor_id": "default",
            "sync_type": "full"
        })
        
        # Wait for sync
        import time
        time.sleep(3)
        
        # Get history
        response = requests.get(f"{BASE_URL}/api/xplan/sync-history")
        assert response.status_code == 200
        
        data = response.json()
        assert "history" in data
        
        history = data["history"]
        print(f"Sync history entries: {len(history)}")
        
        if len(history) > 0:
            entry = history[0]
            # Check history entry has expected fields
            assert "sync_type" in entry or "data_type" in entry  # Push logs have data_type
            print(f"Latest sync entry: {entry}")


class TestXplanConfigure:
    """Test Xplan configuration endpoint"""
    
    def test_configure_demo_mode(self):
        """POST /api/xplan/configure with demo credentials"""
        response = requests.post(f"{BASE_URL}/api/xplan/configure", json={
            "site_url": "demo",
            "username": "demo_user",
            "password": "demo_pass",
            "app_id": "wealth-command",
            "use_2fa": False,
            "auth_method": "basic"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("mode") == "demo"
        print(f"Configure response: {data}")


class TestXplanPush:
    """Test Xplan push functionality (MOCKED in demo mode)"""
    
    def test_push_note_to_xplan(self):
        """POST /api/xplan/push should push data to Xplan (mocked)"""
        # Enable demo mode first
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        # Push a note
        response = requests.post(f"{BASE_URL}/api/xplan/push", json={
            "advisor_id": "default",
            "client_id": "xplan_001",
            "data_type": "note",
            "data": {
                "title": "Test Note from Wealth Command",
                "content": "This is a test note pushed from Wealth Command"
            }
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("mode") == "demo"
        assert "xplan_ref" in data
        print(f"Push note response: {data}")
    
    def test_push_strategy_to_xplan(self):
        """POST /api/xplan/push strategy should work (mocked)"""
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        response = requests.post(f"{BASE_URL}/api/xplan/push", json={
            "advisor_id": "default",
            "client_id": "xplan_001",
            "data_type": "strategy",
            "data": {
                "name": "Retirement Strategy",
                "description": "Aggressive growth strategy for retirement"
            }
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        print(f"Push strategy response: {data}")
    
    def test_push_document_to_xplan(self):
        """POST /api/xplan/push document should work (mocked)"""
        requests.post(f"{BASE_URL}/api/xplan/enable-demo")
        
        response = requests.post(f"{BASE_URL}/api/xplan/push", json={
            "advisor_id": "default",
            "client_id": "xplan_001",
            "data_type": "document",
            "data": {
                "title": "SOA Document",
                "content_type": "pdf",
                "description": "Statement of Advice"
            }
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        print(f"Push document response: {data}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
