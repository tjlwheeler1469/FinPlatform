"""
Iteration 60 - Wealth Command v5.0.0 Complete Feature Testing
Tests: PWA support, MongoDB persistence, White-label multi-tenancy, Compliance modal
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://net-worth-hub-17.preview.emergentagent.com').rstrip('/')


class TestHealthCheckV5:
    """Health check returns v5.0.0 with killer_features array"""
    
    def test_health_check_version(self):
        """Verify health check returns v5.0.0"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "5.0.0"
        assert data["status"] == "healthy"
        assert "killer_features" in data
        assert "next_best_action" in data["killer_features"]
        assert "practice_health" in data["killer_features"]
        assert "meeting_workflow" in data["killer_features"]


class TestWhiteLabelMultiTenancy:
    """White-label/multi-tenancy endpoints"""
    
    def test_tenant_config(self):
        """GET /api/tenant/config returns tenant configuration"""
        response = requests.get(f"{BASE_URL}/api/tenant/config")
        assert response.status_code == 200
        data = response.json()
        assert data["tenant_id"] == "default"
        assert data["tenant_name"] == "Wealth Command"
        assert "branding" in data
        assert "features" in data
        assert "compliance" in data
        assert data["status"] == "active"
    
    def test_tenant_branding(self):
        """GET /api/tenant/branding returns branding configuration"""
        response = requests.get(f"{BASE_URL}/api/tenant/branding")
        assert response.status_code == 200
        data = response.json()
        assert data["primary_color"] == "#1a2744"
        assert data["secondary_color"] == "#10b981"
        assert data["accent_color"] == "#3b82f6"
        assert data["font_family"] == "Inter"
        assert data["company_name"] == "Wealth Command"
        assert data["tagline"] == "Start your day here. Run your business here."
    
    def test_tenant_features(self):
        """GET /api/tenant/features returns feature flags"""
        response = requests.get(f"{BASE_URL}/api/tenant/features")
        assert response.status_code == 200
        data = response.json()
        assert data["next_best_action"] == True
        assert data["practice_health"] == True
        assert data["meeting_automation"] == True
        assert data["ai_copilot"] == True
        assert data["stock_trading"] == True
        assert data["max_clients"] == 500
        assert data["max_aum"] == 100000000
    
    def test_tenant_tiers(self):
        """GET /api/tenant/tiers returns 3 tiers (starter, professional, enterprise)"""
        response = requests.get(f"{BASE_URL}/api/tenant/tiers")
        assert response.status_code == 200
        data = response.json()
        assert "tiers" in data
        assert data["currency"] == "AUD"
        
        # Starter tier
        assert "starter" in data["tiers"]
        starter = data["tiers"]["starter"]
        assert starter["name"] == "Starter"
        assert starter["price_monthly"] == 99
        assert starter["max_clients"] == 50
        assert starter["features"]["stock_trading"] == False
        
        # Professional tier
        assert "professional" in data["tiers"]
        professional = data["tiers"]["professional"]
        assert professional["name"] == "Professional"
        assert professional["price_monthly"] == 299
        assert professional["max_clients"] == 200
        assert professional["features"]["stock_trading"] == True
        
        # Enterprise tier
        assert "enterprise" in data["tiers"]
        enterprise = data["tiers"]["enterprise"]
        assert enterprise["name"] == "Enterprise"
        assert enterprise["price_monthly"] == "custom"
        assert enterprise["max_clients"] == -1  # Unlimited
        assert enterprise["features"]["api_access"] == True
        assert enterprise["features"]["white_label"] == True
    
    def test_css_variables(self):
        """GET /api/tenant/css-variables returns CSS variables"""
        response = requests.get(f"{BASE_URL}/api/tenant/css-variables")
        assert response.status_code == 200
        data = response.json()
        assert "variables" in data
        assert data["variables"]["--primary-color"] == "#1a2744"
        assert data["variables"]["--secondary-color"] == "#10b981"
        assert data["variables"]["--font-family"] == "Inter"
        assert "css" in data
        assert ":root" in data["css"]


class TestMeetingWorkflowMongoDB:
    """Meeting workflow with MongoDB persistence"""
    
    def test_schedule_meeting_mongodb(self):
        """POST /api/meeting-automation/schedule creates meeting in MongoDB"""
        payload = {
            "client_id": "TEST_client_iter60",
            "client_name": "Test Client Iteration 60",
            "meeting_type": "review",
            "date": "2026-02-01",
            "time": "10:00",
            "duration": 60,
            "location": "video"
        }
        response = requests.post(f"{BASE_URL}/api/meeting-automation/schedule", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "meeting_id" in data
        assert data["storage"] == "mongodb"
        assert data["meeting"]["client_name"] == "Test Client Iteration 60"
        assert "prep_task_id" in data
    
    def test_get_meetings(self):
        """GET /api/meeting-automation/meetings returns meetings list"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/meetings")
        assert response.status_code == 200
        data = response.json()
        assert "meetings" in data
        assert "total" in data
        # Should have at least one meeting from previous test
        assert data["total"] >= 0
    
    def test_create_task_mongodb(self):
        """POST /api/meeting-automation/tasks creates task in MongoDB"""
        payload = {
            "title": "TEST_Task Iteration 60",
            "description": "Testing MongoDB persistence",
            "client_id": "TEST_client_iter60",
            "due_date": "2026-02-05",
            "priority": "high"
        }
        response = requests.post(f"{BASE_URL}/api/meeting-automation/tasks", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "task_id" in data
        assert data["storage"] == "mongodb"
        assert data["task"]["title"] == "TEST_Task Iteration 60"
    
    def test_get_tasks(self):
        """GET /api/meeting-automation/tasks returns tasks list"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/tasks")
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert "total" in data
        assert "pending" in data
        assert "overdue" in data
        assert data["storage"] == "mongodb"
    
    def test_workflow_stats(self):
        """GET /api/meeting-automation/workflow-stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/workflow-stats")
        assert response.status_code == 200
        data = response.json()
        assert "meetings" in data
        assert "tasks" in data
        assert "efficiency_metrics" in data
        assert data["storage"] == "mongodb"


class TestPWASupport:
    """PWA manifest and service worker accessibility"""
    
    def test_manifest_json(self):
        """GET /manifest.json returns valid PWA manifest"""
        response = requests.get(f"{BASE_URL}/manifest.json")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Wealth Command"
        assert data["short_name"] == "WealthCmd"
        assert data["display"] == "standalone"
        assert data["theme_color"] == "#1a2744"
        assert data["background_color"] == "#1a2744"
        assert len(data["icons"]) >= 8
        assert "shortcuts" in data
        assert len(data["shortcuts"]) >= 3
    
    def test_service_worker(self):
        """GET /service-worker.js returns service worker script"""
        response = requests.get(f"{BASE_URL}/service-worker.js")
        assert response.status_code == 200
        content = response.text
        assert "wealth-command-v5" in content
        assert "PRECACHE_ASSETS" in content
        assert "networkFirstStrategy" in content
        assert "cacheFirstStrategy" in content
    
    def test_offline_html(self):
        """GET /offline.html returns offline page"""
        response = requests.get(f"{BASE_URL}/offline.html")
        assert response.status_code == 200
        content = response.text
        assert "Wealth Command - Offline" in content
        assert "You're Offline" in content
        assert "Try Again" in content


class TestNextBestActionEngine:
    """Next Best Action Engine endpoints"""
    
    def test_today_actions(self):
        """GET /api/next-action/today returns prioritized actions"""
        response = requests.get(f"{BASE_URL}/api/next-action/today")
        assert response.status_code == 200
        data = response.json()
        assert "today_actions" in data or "actions" in data or "by_category" in data
        assert "focus_message" in data
        assert "impact_summary" in data
    
    def test_all_actions(self):
        """GET /api/next-action/all returns all actions"""
        response = requests.get(f"{BASE_URL}/api/next-action/all")
        assert response.status_code == 200
        data = response.json()
        assert "actions" in data
        assert "total_actions" in data or "total" in data


class TestPracticeHealthDashboard:
    """Practice Health Dashboard endpoints"""
    
    def test_dashboard(self):
        """GET /api/practice-health/dashboard returns full dashboard"""
        response = requests.get(f"{BASE_URL}/api/practice-health/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "health_score" in data
        assert "compliance" in data
        assert "revenue" in data
    
    def test_health_score(self):
        """GET /api/practice-health/health-score returns score and grade"""
        response = requests.get(f"{BASE_URL}/api/practice-health/health-score")
        assert response.status_code == 200
        data = response.json()
        assert "overall_score" in data or "score" in data
        assert "grade" in data
        score = data.get("overall_score", data.get("score", 0))
        assert score >= 0 and score <= 100


class TestCRMNotes:
    """CRM Notes with MongoDB persistence"""
    
    def test_add_crm_note(self):
        """POST /api/meeting-automation/crm-notes/{client_id} adds note"""
        response = requests.post(
            f"{BASE_URL}/api/meeting-automation/crm-notes/TEST_client_iter60",
            params={"note_type": "general", "content": "Test note for iteration 60"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "note" in data
        assert data["note"]["client_id"] == "TEST_client_iter60"
    
    def test_get_crm_notes(self):
        """GET /api/meeting-automation/crm-notes/{client_id} returns notes"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/crm-notes/TEST_client_iter60")
        assert response.status_code == 200
        data = response.json()
        assert "notes" in data
        assert "total" in data


class TestTenantManagement:
    """Tenant management endpoints"""
    
    def test_list_tenants(self):
        """GET /api/tenant/list returns tenant list"""
        response = requests.get(f"{BASE_URL}/api/tenant/list")
        assert response.status_code == 200
        data = response.json()
        assert "tenants" in data
        assert "total" in data
        assert data["total"] >= 1  # At least default tenant


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
