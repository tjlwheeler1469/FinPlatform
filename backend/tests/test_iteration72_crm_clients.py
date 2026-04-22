"""
Test Suite for Iteration 72 - CRM with 8 Demo Clients
Tests: CRM endpoints for clients, analytics, and client-specific data
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://retirement-readiness-2.preview.emergentagent.com').rstrip('/')


class TestCRMClientsEndpoint:
    """Tests for GET /api/crm/clients - returns 8 clients with summary statistics"""
    
    def test_get_clients_returns_200(self):
        """GET /api/crm/clients should return 200"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        assert response.status_code == 200
        print("PASS: GET /api/crm/clients returns 200")
    
    def test_clients_list_has_8_clients(self):
        """Verify 8 demo clients are returned"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        
        assert "clients" in data
        assert len(data["clients"]) == 8
        print(f"PASS: 8 clients returned (actual: {len(data['clients'])})")
    
    def test_clients_summary_statistics(self):
        """Verify summary contains required statistics"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        
        assert "summary" in data
        summary = data["summary"]
        
        # Verify summary fields
        assert "total" in summary
        assert summary["total"] == 8
        
        assert "active" in summary
        assert summary["active"] == 6
        
        assert "total_aum" in summary
        assert summary["total_aum"] == 22280000  # $22.28M
        
        print(f"PASS: Summary stats - Total: {summary['total']}, Active: {summary['active']}, AUM: ${summary['total_aum']:,}")
    
    def test_client_data_structure(self):
        """Verify each client has required fields"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        
        required_fields = [
            "client_id", "name", "status", "stage", "total_wealth", 
            "annual_income", "accounts_count", "pending_tasks"
        ]
        
        for client in data["clients"]:
            for field in required_fields:
                assert field in client, f"Client {client.get('name', 'unknown')} missing field: {field}"
        
        print(f"PASS: All 8 clients have required fields: {required_fields}")
    
    def test_expected_clients_present(self):
        """Verify all 8 expected clients are present"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        
        expected_names = [
            "James & Sarah Wheeler",
            "Chen Family Trust",
            "Robert Mitchell",
            "Emma & David Williams",
            "Patel SMSF",
            "Anderson Partnership",
            "Sarah Kim",
            "Thompson Retirees"
        ]
        
        client_names = [c["name"] for c in data["clients"]]
        
        for expected in expected_names:
            assert expected in client_names, f"Expected client not found: {expected}"
        
        print(f"PASS: All 8 expected clients present")
    
    def test_client_wealth_data(self):
        """Verify specific client wealth data"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        data = response.json()
        
        # Create lookup by client_id
        clients_by_id = {c["client_id"]: c for c in data["clients"]}
        
        # Verify Wheeler client
        wheeler = clients_by_id.get("client_1")
        assert wheeler is not None
        assert wheeler["total_wealth"] == 2850000
        assert wheeler["name"] == "James & Sarah Wheeler"
        
        # Verify Chen Trust
        chen = clients_by_id.get("client_2")
        assert chen is not None
        assert chen["total_wealth"] == 5200000
        
        # Verify Williams prospect
        williams = clients_by_id.get("client_4")
        assert williams is not None
        assert williams["total_wealth"] == 980000
        assert williams["status"] == "prospect"
        
        print("PASS: Client wealth data verified (Wheeler: $2.85M, Chen: $5.2M, Williams: $980K)")


class TestCRMAnalyticsEndpoint:
    """Tests for GET /api/crm/analytics - comprehensive CRM analytics"""
    
    def test_analytics_returns_200(self):
        """GET /api/crm/analytics should return 200"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        assert response.status_code == 200
        print("PASS: GET /api/crm/analytics returns 200")
    
    def test_analytics_summary(self):
        """Verify analytics summary contains required fields"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        data = response.json()
        
        assert "summary" in data
        summary = data["summary"]
        
        assert summary["total_clients"] == 8
        assert summary["total_aum"] == 22280000
        assert "estimated_annual_revenue" in summary
        assert "avg_client_satisfaction" in summary
        
        print(f"PASS: Analytics summary - Clients: {summary['total_clients']}, AUM: ${summary['total_aum']:,}")
    
    def test_analytics_by_status(self):
        """Verify analytics breakdown by status"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        data = response.json()
        
        assert "by_status" in data
        by_status = data["by_status"]
        
        assert by_status["active"] == 6
        assert by_status["prospect"] == 1
        assert by_status["review"] == 1
        
        print(f"PASS: By status - Active: {by_status['active']}, Prospect: {by_status['prospect']}, Review: {by_status['review']}")
    
    def test_analytics_by_type(self):
        """Verify analytics breakdown by client type"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        data = response.json()
        
        assert "by_type" in data
        by_type = data["by_type"]
        
        # Verify different client types exist
        assert "household" in by_type
        assert "trust" in by_type
        assert "individual" in by_type
        assert "smsf" in by_type
        assert "partnership" in by_type
        
        print(f"PASS: Analytics by type includes all client types")
    
    def test_analytics_tasks(self):
        """Verify task analytics"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        data = response.json()
        
        assert "tasks" in data
        tasks = data["tasks"]
        
        assert "total_pending" in tasks
        assert tasks["total_pending"] == 10
        assert "by_priority" in tasks
        
        print(f"PASS: Task analytics - Total pending: {tasks['total_pending']}")


class TestCRMClientByIdEndpoint:
    """Tests for GET /api/crm/clients/{client_id} - specific client details"""
    
    def test_get_client_by_id_returns_200(self):
        """GET /api/crm/clients/client_1 should return 200"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        assert response.status_code == 200
        print("PASS: GET /api/crm/clients/client_1 returns 200")
    
    def test_client_1_wheeler_data(self):
        """Verify Wheeler client has correct data"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        data = response.json()
        
        assert data["name"] == "James & Sarah Wheeler"
        assert data["total_wealth"] == 2850000
        assert data["status"] == "active"
        assert data["accounts_count"] == 8
        
        # Verify accounts data
        assert "accounts" in data
        assert len(data["accounts"]) == 8
        
        # Verify family data
        assert "family_members" in data
        assert len(data["family_members"]) == 4
        
        # Verify goals
        assert "goals" in data
        assert len(data["goals"]) == 4
        
        # Verify insurance
        assert "insurance" in data
        assert len(data["insurance"]) == 4
        
        print(f"PASS: Wheeler client - Wealth: ${data['total_wealth']:,}, Accounts: {len(data['accounts'])}, Family: {len(data['family_members'])}")
    
    def test_client_not_found_returns_404(self):
        """GET /api/crm/clients/nonexistent should return 404"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/nonexistent_client")
        assert response.status_code == 404
        print("PASS: GET /api/crm/clients/nonexistent returns 404")
    
    def test_all_clients_accessible_by_id(self):
        """Verify all 8 clients are accessible by ID"""
        client_ids = [
            "client_1", "client_2", "client_3", "client_4",
            "client_5", "client_6", "client_7", "client_8"
        ]
        
        for client_id in client_ids:
            response = requests.get(f"{BASE_URL}/api/crm/clients/{client_id}")
            assert response.status_code == 200, f"Failed to get client {client_id}"
            data = response.json()
            assert data["client_id"] == client_id
        
        print(f"PASS: All 8 clients accessible by ID")


class TestCRMTasksEndpoint:
    """Tests for GET /api/crm/tasks - task list"""
    
    def test_tasks_returns_200(self):
        """GET /api/crm/tasks should return 200"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        assert response.status_code == 200
        print("PASS: GET /api/crm/tasks returns 200")
    
    def test_tasks_count(self):
        """Verify 10 demo tasks are present"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        data = response.json()
        
        assert "tasks" in data
        assert len(data["tasks"]) == 10
        
        print(f"PASS: 10 tasks returned (actual: {len(data['tasks'])})")
    
    def test_task_priorities(self):
        """Verify tasks have different priorities"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        data = response.json()
        
        priorities = set(t["priority"] for t in data["tasks"])
        expected_priorities = {"urgent", "high", "medium", "low"}
        
        assert priorities == expected_priorities
        print(f"PASS: Tasks have all priority levels: {priorities}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
