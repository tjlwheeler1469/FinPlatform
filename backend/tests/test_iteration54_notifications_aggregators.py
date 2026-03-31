"""
Test Suite for Iteration 54 - Notification System, CDR Data Aggregators, and Document Generation
Tests the new features:
1. Notification System with demo notifications and simulation
2. Australian CDR Data Aggregator research endpoints
3. Document generation service for SOA PDFs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://wealth-consolidation.preview.emergentagent.com').rstrip('/')


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestNotificationDemo:
    """Test notification demo endpoints"""
    
    def test_get_demo_notifications(self):
        """GET /api/notifications/demo - should return 8 sample notifications with channels info"""
        response = requests.get(f"{BASE_URL}/api/notifications/demo")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data["success"] is True
        assert data["demo_mode"] is True
        assert "integration_status" in data
        assert "notification_types" in data
        assert "sample_notifications" in data
        
        # Verify 8 sample notifications
        assert data["total_samples"] == 8
        assert len(data["sample_notifications"]) == 8
        
        # Verify integration status has all channels
        integration = data["integration_status"]
        assert "websocket" in integration
        assert "push" in integration
        assert "email" in integration
        assert "sms" in integration
        
        # Verify notification types
        notification_types = [nt["type"] for nt in data["notification_types"]]
        expected_types = ["portfolio_drift", "tax_opportunity", "compliance_due", 
                        "idle_cash", "retirement_risk", "meeting_reminder", 
                        "market_event", "client_login"]
        for expected in expected_types:
            assert expected in notification_types
        
        # Verify sample notification structure
        sample = data["sample_notifications"][0]
        assert "id" in sample
        assert "type" in sample
        assert "title" in sample
        assert "message" in sample
        assert "priority" in sample
        assert "channels" in sample
        
        # Verify channels in sample notification
        channels = sample["channels"]
        assert "websocket" in channels
        assert "push" in channels
        assert "email" in channels
    
    def test_get_notification_summary(self):
        """GET /api/notifications/summary - should return system status and statistics"""
        response = requests.get(f"{BASE_URL}/api/notifications/summary")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "system_status" in data
        assert "statistics" in data
        assert "active_connections" in data
        assert "configured_channels" in data
        
        # Verify system status
        status = data["system_status"]
        assert "websocket" in status
        assert "push" in status
        assert "email" in status
        assert "sms" in status
        
        # Verify statistics
        stats = data["statistics"]
        assert "total_notifications" in stats
        assert "unread" in stats
        assert "by_priority" in stats
    
    def test_simulate_notification_delivery(self):
        """POST /api/notifications/demo/simulate - should simulate notification delivery"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/demo/simulate",
            params={"notification_type": "portfolio_drift", "client_id": "client_1"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify simulation result structure
        assert "simulation_id" in data
        assert "simulated_at" in data
        assert "notification_type" in data
        assert data["notification_type"] == "portfolio_drift"
        assert "channels_simulated" in data
        
        # Verify channels simulated
        channels = data["channels_simulated"]
        assert "websocket" in channels
        assert "push" in channels
        assert "email" in channels
        
        # Verify each channel has status
        for channel, info in channels.items():
            assert "status" in info
            assert info["status"] == "simulated"
            assert "action" in info
        
        # Verify notification preview
        assert "notification_preview" in data
        assert "user_preferences_checked" in data
        assert "quiet_hours_checked" in data
        assert "would_be_delivered" in data
    
    def test_get_email_preview(self):
        """GET /api/notifications/demo/email-preview/{notification_id} - should return HTML email preview"""
        response = requests.get(f"{BASE_URL}/api/notifications/demo/email-preview/demo_notif_001")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data["notification_id"] == "demo_notif_001"
        assert "notification_type" in data
        assert "subject" in data
        assert "html_preview" in data
        assert "plain_text" in data
        
        # Verify HTML content
        html = data["html_preview"]
        assert "<!DOCTYPE html>" in html
        assert "Wealth Command" in html
        assert "Portfolio Drift Alert" in html
    
    def test_email_preview_not_found(self):
        """GET /api/notifications/demo/email-preview/{invalid_id} - should return 404"""
        response = requests.get(f"{BASE_URL}/api/notifications/demo/email-preview/invalid_id")
        assert response.status_code == 404


class TestDataAggregators:
    """Test CDR data aggregator endpoints"""
    
    def test_get_aggregator_options(self):
        """GET /api/data-aggregators/options - should return 5 CDR providers"""
        response = requests.get(f"{BASE_URL}/api/data-aggregators/options")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "aggregators" in data
        assert "total" in data
        assert "cdr_note" in data
        
        # Verify 5 providers
        assert data["total"] == 5
        assert len(data["aggregators"]) == 5
        
        # Verify expected providers
        provider_ids = [agg["id"] for agg in data["aggregators"]]
        expected_providers = ["basiq", "frollo", "yodlee", "moneytree", "finicity"]
        for expected in expected_providers:
            assert expected in provider_ids
        
        # Verify aggregator structure
        for agg in data["aggregators"]:
            assert "id" in agg
            assert "name" in agg
            assert "description" in agg
            assert "cdr_accredited" in agg
            assert agg["cdr_accredited"] is True  # All should be CDR accredited
            assert "supported_banks" in agg
            assert "integration_effort" in agg
            assert "sandbox_available" in agg
    
    def test_get_aggregator_details(self):
        """GET /api/data-aggregators/options/{aggregator_id} - should return detailed info"""
        response = requests.get(f"{BASE_URL}/api/data-aggregators/options/basiq")
        assert response.status_code == 200
        data = response.json()
        
        # Verify detailed structure
        assert data["name"] == "Basiq"
        assert "description" in data
        assert "website" in data
        assert "documentation" in data
        assert "cdr_accredited" in data
        assert "supported_banks" in data
        assert "features" in data
        assert "data_types" in data
        assert "pricing_model" in data
        assert "integration_effort" in data
        assert "time_to_integrate" in data
        assert "sandbox_available" in data
        assert "best_for" in data
        
        # Verify features is a list
        assert isinstance(data["features"], list)
        assert len(data["features"]) > 0
    
    def test_get_aggregator_not_found(self):
        """GET /api/data-aggregators/options/{invalid_id} - should return 404"""
        response = requests.get(f"{BASE_URL}/api/data-aggregators/options/invalid_provider")
        assert response.status_code == 404
    
    def test_get_recommendation_wealth_management(self):
        """POST /api/data-aggregators/recommend - should return recommendation for wealth_management"""
        response = requests.post(
            f"{BASE_URL}/api/data-aggregators/recommend",
            json={"use_case": "wealth_management"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data["use_case"] == "wealth_management"
        assert "recommendation" in data
        assert "integration_steps" in data
        assert "estimated_timeline" in data
        assert "regulatory_note" in data
        
        # Verify recommendation structure
        rec = data["recommendation"]
        assert "primary" in rec
        assert "secondary" in rec
        
        # Verify primary recommendation
        primary = rec["primary"]
        assert "id" in primary
        assert "name" in primary
        assert "reason" in primary
        assert "features" in primary
        assert "time_to_integrate" in primary
        
        # For wealth_management, primary should be yodlee
        assert primary["id"] == "yodlee"
        
        # Verify integration steps
        assert isinstance(data["integration_steps"], list)
        assert len(data["integration_steps"]) > 0
    
    def test_get_recommendation_financial_planning(self):
        """POST /api/data-aggregators/recommend - should return recommendation for financial_planning"""
        response = requests.post(
            f"{BASE_URL}/api/data-aggregators/recommend",
            json={"use_case": "financial_planning"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # For financial_planning, primary should be basiq
        assert data["recommendation"]["primary"]["id"] == "basiq"
    
    def test_get_cdr_requirements(self):
        """GET /api/data-aggregators/cdr-requirements - should return CDR compliance info"""
        response = requests.get(f"{BASE_URL}/api/data-aggregators/cdr-requirements")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "overview" in data
        assert "key_statistics" in data
        assert "participation_paths" in data
        assert "data_available" in data
        assert "consent_requirements" in data
        assert "security_requirements" in data
        assert "resources" in data
        
        # Verify key statistics
        stats = data["key_statistics"]
        assert "data_requests_2025" in stats
        assert "active_users_goal_2030" in stats
        assert "projected_productivity_gains" in stats
        
        # Verify participation paths
        paths = data["participation_paths"]
        assert len(paths) == 3
        for path in paths:
            assert "path" in path
            assert "description" in path
            assert "pros" in path
            assert "cons" in path
            assert "cost" in path
        
        # Verify resources
        resources = data["resources"]
        assert "cdr_portal" in resources
        assert "accc_guidance" in resources
        assert "technical_standards" in resources
    
    def test_get_implementation_roadmap(self):
        """GET /api/data-aggregators/implementation-roadmap - should return integration phases"""
        response = requests.get(f"{BASE_URL}/api/data-aggregators/implementation-roadmap")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "title" in data
        assert "current_state" in data
        assert "target_state" in data
        assert "phases" in data
        assert "total_estimated_time" in data
        assert "budget_estimate" in data
        assert "next_steps" in data
        
        # Verify phases
        phases = data["phases"]
        assert len(phases) == 4
        for phase in phases:
            assert "phase" in phase
            assert "name" in phase
            assert "duration" in phase
            assert "tasks" in phase
        
        # Verify budget estimate
        budget = data["budget_estimate"]
        assert "development" in budget
        assert "provider_fees" in budget
        assert "compliance" in budget


class TestDocumentGeneration:
    """Test document generation endpoints"""
    
    def test_get_soa_template(self):
        """GET /api/documents/generate/soa/template - should return SOA template structure"""
        response = requests.get(f"{BASE_URL}/api/documents/generate/soa/template")
        assert response.status_code == 200
        data = response.json()
        
        # Verify template structure
        assert "template" in data
        template = data["template"]
        
        # Verify required fields
        required_fields = [
            "client_id", "client_name", "adviser_name", "adviser_afsl",
            "advice_date", "advice_summary", "recommendations", "risk_profile",
            "current_situation", "goals", "strategy", "fees", "warnings"
        ]
        for field in required_fields:
            assert field in template
        
        # Verify nested structures
        assert isinstance(template["recommendations"], list)
        assert isinstance(template["goals"], list)
        assert isinstance(template["warnings"], list)
        
        # Verify fees structure
        fees = template["fees"]
        assert "advice_fee" in fees
        assert "ongoing_fee" in fees
        assert "implementation_fee" in fees
    
    def test_generate_compliance_checklist(self):
        """POST /api/documents/generate/compliance-checklist - should generate checklist PDF"""
        response = requests.post(
            f"{BASE_URL}/api/documents/generate/compliance-checklist",
            params={"client_id": "client_1", "review_type": "annual"}
        )
        assert response.status_code == 200
        
        # Verify PDF content type
        assert response.headers.get("content-type") == "application/pdf"
        
        # Verify content disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition
        assert "Compliance_Checklist" in content_disposition
        
        # Verify PDF content starts with PDF header
        assert response.content[:4] == b'%PDF'


class TestNotificationSimulationTypes:
    """Test simulation for different notification types"""
    
    @pytest.mark.parametrize("notification_type", [
        "portfolio_drift",
        "tax_opportunity",
        "compliance_due",
        "idle_cash",
        "retirement_risk",
        "meeting_reminder",
        "market_event",
        "client_login"
    ])
    def test_simulate_all_notification_types(self, notification_type):
        """Test simulation works for all notification types"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/demo/simulate",
            params={"notification_type": notification_type}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["notification_type"] == notification_type
        assert "channels_simulated" in data


class TestEmailPreviewAllNotifications:
    """Test email preview for all demo notifications"""
    
    @pytest.mark.parametrize("notification_id", [
        "demo_notif_001",
        "demo_notif_002",
        "demo_notif_003",
        "demo_notif_004",
        "demo_notif_005",
        "demo_notif_006",
        "demo_notif_007",
        "demo_notif_008"
    ])
    def test_email_preview_all_notifications(self, notification_id):
        """Test email preview works for all demo notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications/demo/email-preview/{notification_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["notification_id"] == notification_id
        assert "html_preview" in data
        assert "<!DOCTYPE html>" in data["html_preview"]


class TestAggregatorRecommendationUseCases:
    """Test recommendations for all use cases"""
    
    @pytest.mark.parametrize("use_case,expected_primary", [
        ("wealth_management", "yodlee"),
        ("financial_planning", "basiq"),
        ("compliance_verification", "basiq"),
        ("client_portal", "frollo")
    ])
    def test_recommendation_use_cases(self, use_case, expected_primary):
        """Test recommendations return correct primary provider for each use case"""
        response = requests.post(
            f"{BASE_URL}/api/data-aggregators/recommend",
            json={"use_case": use_case}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["use_case"] == use_case
        assert data["recommendation"]["primary"]["id"] == expected_primary


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
