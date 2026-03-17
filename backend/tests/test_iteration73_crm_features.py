"""
Test Iteration 73 - CRM Command Center & Client 360 View Features
Tests for:
- CRM Command Center endpoints
- Client data retrieval
- Analytics endpoints
- Search and filter functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCRMClientsEndpoint:
    """Tests for /api/crm/clients endpoint - main CRM data"""
    
    def test_get_all_clients_success(self):
        """GET /api/crm/clients returns client list with summary"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "clients" in data
        assert "summary" in data
        assert "timestamp" in data
        
        # Verify we have clients
        assert isinstance(data["clients"], list)
        assert len(data["clients"]) >= 5  # Should have at least 5 demo clients
        
    def test_clients_summary_contains_metrics(self):
        """GET /api/crm/clients summary contains required metrics"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        
        assert response.status_code == 200
        summary = response.json()["summary"]
        
        # Check all required summary fields
        assert "total" in summary
        assert "active" in summary
        assert "prospect" in summary
        assert "review" in summary
        assert "total_aum" in summary
        assert "pending_tasks" in summary
        assert "urgent_tasks" in summary
        
        # Verify values are reasonable
        assert summary["total"] >= 5
        assert summary["active"] >= 0
        assert summary["total_aum"] > 0  # Should have some AUM
        
    def test_client_data_structure(self):
        """Each client has required fields for CRM display"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        
        assert response.status_code == 200
        clients = response.json()["clients"]
        
        # Check first client has all required fields
        client = clients[0]
        required_fields = [
            "client_id", "name", "email", "phone", "status", "type",
            "total_wealth", "wealth_change", "wealth_change_percent"
        ]
        
        for field in required_fields:
            assert field in client, f"Missing field: {field}"
            
    def test_client_has_accounts_data(self):
        """Each client should have accounts array"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        
        assert response.status_code == 200
        clients = response.json()["clients"]
        
        # First client (Wheeler) should have accounts
        wheeler_client = next((c for c in clients if "Wheeler" in c["name"]), None)
        assert wheeler_client is not None
        assert "accounts" in wheeler_client
        assert len(wheeler_client["accounts"]) > 0
        
    def test_filter_by_status_active(self):
        """GET /api/crm/clients?status=active filters correctly"""
        response = requests.get(f"{BASE_URL}/api/crm/clients?status=active")
        
        assert response.status_code == 200
        clients = response.json()["clients"]
        
        # All returned clients should be active
        for client in clients:
            assert client["status"] == "active"
            
    def test_filter_by_status_prospect(self):
        """GET /api/crm/clients?status=prospect filters correctly"""
        response = requests.get(f"{BASE_URL}/api/crm/clients?status=prospect")
        
        assert response.status_code == 200
        clients = response.json()["clients"]
        
        # All returned clients should be prospects
        for client in clients:
            assert client["status"] == "prospect"
            
    def test_filter_by_status_review(self):
        """GET /api/crm/clients?status=review filters correctly"""
        response = requests.get(f"{BASE_URL}/api/crm/clients?status=review")
        
        assert response.status_code == 200
        clients = response.json()["clients"]
        
        # All returned clients should be in review
        for client in clients:
            assert client["status"] == "review"
            
    def test_search_by_name(self):
        """GET /api/crm/clients?search=Wheeler finds matching clients"""
        response = requests.get(f"{BASE_URL}/api/crm/clients?search=Wheeler")
        
        assert response.status_code == 200
        clients = response.json()["clients"]
        
        # Should find at least Wheeler client
        assert len(clients) >= 1
        # First result should match search term
        assert any("Wheeler" in c["name"] for c in clients)
        
    def test_search_by_email(self):
        """GET /api/crm/clients?search=email finds matching clients"""
        response = requests.get(f"{BASE_URL}/api/crm/clients?search=james.wheeler")
        
        assert response.status_code == 200
        clients = response.json()["clients"]
        
        # Should find Wheeler client by email
        assert len(clients) >= 1


class TestCRMClientByIdEndpoint:
    """Tests for /api/crm/clients/{client_id} endpoint"""
    
    def test_get_specific_client_success(self):
        """GET /api/crm/clients/client_1 returns client details"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        
        assert response.status_code == 200
        client = response.json()
        
        assert "client_id" in client
        assert client["client_id"] == "client_1"
        assert "name" in client
        assert "Wheeler" in client["name"]
        
    def test_get_client_includes_tasks(self):
        """GET /api/crm/clients/{id} includes client tasks"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        
        assert response.status_code == 200
        client = response.json()
        
        # Should have tasks field
        assert "tasks" in client
        
    def test_get_client_includes_accounts(self):
        """GET /api/crm/clients/{id} includes account details"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        
        assert response.status_code == 200
        client = response.json()
        
        assert "accounts" in client
        assert len(client["accounts"]) > 0
        
        # Check account structure
        account = client["accounts"][0]
        assert "type" in account or "name" in account
        assert "balance" in account
        
    def test_get_client_includes_family(self):
        """GET /api/crm/clients/{id} includes family members"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        
        assert response.status_code == 200
        client = response.json()
        
        assert "family_members" in client
        assert len(client["family_members"]) > 0
        
    def test_get_client_includes_goals(self):
        """GET /api/crm/clients/{id} includes financial goals"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        
        assert response.status_code == 200
        client = response.json()
        
        assert "goals" in client
        assert len(client["goals"]) > 0
        
        # Check goal structure
        goal = client["goals"][0]
        assert "name" in goal
        assert "target" in goal
        assert "current" in goal
        assert "progress" in goal
        
    def test_get_nonexistent_client_returns_404(self):
        """GET /api/crm/clients/invalid_id returns 404"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/nonexistent_client_xyz")
        
        assert response.status_code == 404


class TestCRMAnalyticsEndpoint:
    """Tests for /api/crm/analytics endpoint"""
    
    def test_get_analytics_success(self):
        """GET /api/crm/analytics returns analytics data"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "summary" in data
        assert "by_status" in data
        assert "by_type" in data
        assert "by_risk_profile" in data
        assert "tasks" in data
        assert "timestamp" in data
        
    def test_analytics_summary_contains_key_metrics(self):
        """Analytics summary contains required KPIs"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        
        assert response.status_code == 200
        summary = response.json()["summary"]
        
        assert "total_clients" in summary
        assert "total_aum" in summary
        assert "average_aum" in summary
        assert "estimated_annual_revenue" in summary
        
        # Values should be positive
        assert summary["total_clients"] > 0
        assert summary["total_aum"] > 0
        
    def test_analytics_by_status_breakdown(self):
        """Analytics provides client breakdown by status"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        
        assert response.status_code == 200
        by_status = response.json()["by_status"]
        
        assert "active" in by_status
        assert "prospect" in by_status
        assert "review" in by_status
        
        # Should have some active clients
        assert by_status["active"] >= 0
        
    def test_analytics_by_type_breakdown(self):
        """Analytics provides AUM breakdown by client type"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        
        assert response.status_code == 200
        by_type = response.json()["by_type"]
        
        # Should have different client types
        assert len(by_type) > 0
        
    def test_analytics_tasks_summary(self):
        """Analytics includes task summary"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        
        assert response.status_code == 200
        tasks = response.json()["tasks"]
        
        assert "total_pending" in tasks
        assert "by_priority" in tasks
        
        # Check priority breakdown
        by_priority = tasks["by_priority"]
        assert "urgent" in by_priority
        assert "high" in by_priority
        assert "medium" in by_priority


class TestCRMTasksEndpoint:
    """Tests for /api/crm/tasks endpoint"""
    
    def test_get_all_tasks_success(self):
        """GET /api/crm/tasks returns task list"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "tasks" in data
        assert isinstance(data["tasks"], list)
        
    def test_task_has_required_fields(self):
        """Each task has required fields"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        
        assert response.status_code == 200
        tasks = response.json()["tasks"]
        
        if len(tasks) > 0:
            task = tasks[0]
            assert "id" in task
            assert "title" in task
            assert "priority" in task
            assert "status" in task


class TestClientDataIntegrity:
    """Tests for client data consistency"""
    
    def test_total_aum_matches_client_sum(self):
        """Summary total_aum should match sum of client wealth"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        
        assert response.status_code == 200
        data = response.json()
        
        # Calculate sum of client wealth
        total_wealth = sum(c.get("total_wealth", 0) for c in data["clients"])
        
        # Compare with summary (allow for floating point differences)
        assert abs(data["summary"]["total_aum"] - total_wealth) < 1000
        
    def test_active_count_matches_filtered_count(self):
        """Summary active count should match filtered results"""
        # Get summary
        all_response = requests.get(f"{BASE_URL}/api/crm/clients")
        assert all_response.status_code == 200
        summary_active = all_response.json()["summary"]["active"]
        
        # Get filtered
        filtered_response = requests.get(f"{BASE_URL}/api/crm/clients?status=active")
        assert filtered_response.status_code == 200
        filtered_count = len(filtered_response.json()["clients"])
        
        assert summary_active == filtered_count


class TestDemoClientData:
    """Tests for specific demo client data"""
    
    def test_wheeler_family_exists(self):
        """Wheeler family client should exist with correct data"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_1")
        
        assert response.status_code == 200
        client = response.json()
        
        assert "Wheeler" in client["name"]
        assert client["status"] == "active"
        assert client["total_wealth"] > 2000000  # Wheeler has ~$2.85M
        
    def test_chen_family_trust_exists(self):
        """Chen Family Trust should exist"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_2")
        
        assert response.status_code == 200
        client = response.json()
        
        assert "Chen" in client["name"]
        assert client["type"] == "trust"
        
    def test_prospect_client_exists(self):
        """Williams prospect client should exist"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_4")
        
        assert response.status_code == 200
        client = response.json()
        
        assert "Williams" in client["name"]
        assert client["status"] == "prospect"
        
    def test_review_client_exists(self):
        """Mitchell review client should exist"""
        response = requests.get(f"{BASE_URL}/api/crm/clients/client_3")
        
        assert response.status_code == 200
        client = response.json()
        
        assert "Mitchell" in client["name"]
        assert client["status"] == "review"
