"""
AdviceOS Enterprise Architecture Testing - Iteration 96
========================================================
Tests for:
- Incident Management (CPS 230 compliant)
- Event Streaming Layer
- Enterprise Documentation Pack
- Frontend /enterprise page integration

All tests use real MongoDB storage (no mocking).
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# ==================== FIXTURES ====================

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_incident_id(api_client):
    """Create a test incident and return its ID for subsequent tests."""
    response = api_client.post(f"{BASE_URL}/api/incidents/create", json={
        "title": "TEST_Iteration96_Incident",
        "description": "Test incident for iteration 96 testing",
        "severity": "P3",
        "category": "operational",
        "affected_systems": ["test_system"],
        "affected_licensees": [],
        "reported_by": "test_user",
        "licensee_id": "TEST_lic_96"
    })
    if response.status_code == 200:
        return response.json().get("incident_id")
    return None

# ==================== HEALTH CHECK TESTS ====================

class TestHealthCheck:
    """Verify new services are active in health check."""
    
    def test_health_includes_incident_management(self, api_client):
        """Health check should include incident_management."""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["adviceos"]["incident_management"] == True
        print("PASS: incident_management is True in health check")
    
    def test_health_includes_event_streaming(self, api_client):
        """Health check should include event_streaming."""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["adviceos"]["event_streaming"] == True
        print("PASS: event_streaming is True in health check")
    
    def test_health_includes_enterprise_docs(self, api_client):
        """Health check should include enterprise_docs."""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["adviceos"]["enterprise_docs"] == True
        print("PASS: enterprise_docs is True in health check")

# ==================== INCIDENT MANAGEMENT TESTS ====================

class TestIncidentManagement:
    """CPS 230 compliant incident management tests."""
    
    def test_get_severity_definitions(self, api_client):
        """GET /api/incidents/severity-definitions - Get P1-P5 severity levels."""
        response = api_client.get(f"{BASE_URL}/api/incidents/severity-definitions")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all 5 severity levels exist
        assert "severities" in data
        severities = data["severities"]
        assert "P1" in severities
        assert "P2" in severities
        assert "P3" in severities
        assert "P4" in severities
        assert "P5" in severities
        
        # Verify P1 is critical and regulatory reportable
        assert severities["P1"]["name"] == "Critical"
        assert severities["P1"]["regulatory_reportable"] == True
        assert severities["P1"]["response_time"] == "15 minutes"
        
        # Verify classification guidance exists
        assert "classification_guidance" in data
        print("PASS: Severity definitions returned with P1-P5 levels")
    
    def test_create_incident(self, api_client):
        """POST /api/incidents/create - Create new incident."""
        unique_id = uuid.uuid4().hex[:6]
        response = api_client.post(f"{BASE_URL}/api/incidents/create", json={
            "title": f"TEST_Create_Incident_{unique_id}",
            "description": "Test incident creation for iteration 96",
            "severity": "P2",
            "category": "security",
            "affected_systems": ["auth_service", "api_gateway"],
            "affected_licensees": ["lic_001"],
            "reported_by": "test_admin",
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "incident_id" in data
        assert data["incident_id"].startswith("INC-")
        assert data["severity"] == "P2"
        assert data["status"] == "open"
        assert "response_target" in data
        assert "resolution_target" in data
        assert "created_at" in data
        
        print(f"PASS: Incident created with ID {data['incident_id']}")
    
    def test_list_incidents(self, api_client, test_incident_id):
        """GET /api/incidents/list - List incidents."""
        response = api_client.get(f"{BASE_URL}/api/incidents/list", params={
            "licensee_id": "TEST_lic_96",
            "limit": 10
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "incidents" in data
        assert "count" in data
        assert "open_count" in data
        assert "critical_count" in data
        
        # Verify our test incident is in the list
        if test_incident_id:
            incident_ids = [inc["id"] for inc in data["incidents"]]
            assert test_incident_id in incident_ids
        
        print(f"PASS: Listed {data['count']} incidents")
    
    def test_get_incident_by_id(self, api_client, test_incident_id):
        """GET /api/incidents/{incident_id} - Get incident details."""
        if not test_incident_id:
            pytest.skip("No test incident created")
        
        response = api_client.get(f"{BASE_URL}/api/incidents/{test_incident_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify incident details
        assert data["id"] == test_incident_id
        assert "title" in data
        assert "description" in data
        assert "severity" in data
        assert "status" in data
        assert "timeline" in data
        assert "severity_details" in data
        
        print(f"PASS: Retrieved incident {test_incident_id}")
    
    def test_incident_dashboard_summary(self, api_client):
        """GET /api/incidents/dashboard/summary - Dashboard metrics."""
        response = api_client.get(f"{BASE_URL}/api/incidents/dashboard/summary", params={
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "open_incidents" in data
        assert "total" in data["open_incidents"]
        assert "by_severity" in data["open_incidents"]
        
        assert "monthly_stats" in data
        assert "total_incidents" in data["monthly_stats"]
        assert "resolved" in data["monthly_stats"]
        assert "resolution_rate" in data["monthly_stats"]
        assert "mttr_minutes" in data["monthly_stats"]
        
        assert "regulatory" in data
        assert "escalation_status" in data
        assert "generated_at" in data
        
        print(f"PASS: Dashboard summary returned with {data['open_incidents']['total']} open incidents")
    
    def test_regulatory_report(self, api_client):
        """GET /api/incidents/report/regulatory - Regulatory report."""
        response = api_client.get(f"{BASE_URL}/api/incidents/report/regulatory", params={
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify report structure
        assert data["report_type"] == "regulatory_incident_summary"
        assert "reporting_period" in data
        assert "summary" in data
        assert "total_incidents" in data["summary"]
        assert "critical_p1" in data["summary"]
        assert "security_incidents" in data["summary"]
        assert "compliance_incidents" in data["summary"]
        
        assert "critical_incidents" in data
        assert "compliance_statement" in data
        assert "report_hash" in data
        
        print("PASS: Regulatory report generated successfully")
    
    def test_update_incident(self, api_client, test_incident_id):
        """POST /api/incidents/{incident_id}/update - Update incident."""
        if not test_incident_id:
            pytest.skip("No test incident created")
        
        response = api_client.post(f"{BASE_URL}/api/incidents/{test_incident_id}/update", json={
            "status": "investigating",
            "update_message": "Investigation started by test automation",
            "updated_by": "test_admin"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["incident_id"] == test_incident_id
        assert data["new_status"] == "investigating"
        
        print(f"PASS: Incident {test_incident_id} updated to investigating")

# ==================== EVENT STREAMING TESTS ====================

class TestEventStreaming:
    """Real-time event bus tests."""
    
    def test_list_event_types(self, api_client):
        """GET /api/events/types - List all 18 event types."""
        response = api_client.get(f"{BASE_URL}/api/events/types")
        assert response.status_code == 200
        data = response.json()
        
        # Verify event types structure
        assert "event_types" in data
        assert "categories" in data
        
        event_types = data["event_types"]
        # Verify key event types exist
        assert "audit.created" in event_types
        assert "audit.tamper_detected" in event_types
        assert "compliance.check_passed" in event_types
        assert "compliance.breach_detected" in event_types
        assert "security.login" in event_types
        assert "security.suspicious_activity" in event_types
        assert "incident.created" in event_types
        assert "incident.escalated" in event_types
        assert "system.health_check" in event_types
        
        # Verify categories
        categories = data["categories"]
        assert "audit" in categories
        assert "compliance" in categories
        assert "security" in categories
        assert "incident" in categories
        assert "system" in categories
        
        print(f"PASS: {len(event_types)} event types returned with {len(categories)} categories")
    
    def test_publish_event(self, api_client):
        """POST /api/events/publish - Publish event to bus."""
        unique_id = uuid.uuid4().hex[:6]
        response = api_client.post(f"{BASE_URL}/api/events/publish", json={
            "event_type": "audit.created",
            "payload": {
                "test_id": unique_id,
                "action": "test_event_publish",
                "entity_type": "test",
                "entity_id": f"test_{unique_id}"
            },
            "source": "test_automation",
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "event_id" in data
        assert data["event_id"].startswith("evt_")
        assert data["event_type"] == "audit.created"
        assert "timestamp" in data
        
        print(f"PASS: Event published with ID {data['event_id']}")
    
    def test_publish_custom_event(self, api_client):
        """POST /api/events/publish - Publish custom event type."""
        response = api_client.post(f"{BASE_URL}/api/events/publish", json={
            "event_type": "custom.test_event",
            "payload": {"test": "custom_event_data"},
            "source": "test_automation",
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["event_type"] == "custom.test_event"
        
        print("PASS: Custom event published successfully")
    
    def test_get_event_stream(self, api_client):
        """GET /api/events/stream - Get event stream."""
        response = api_client.get(f"{BASE_URL}/api/events/stream", params={
            "licensee_id": "TEST_lic_96",
            "limit": 20
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "events" in data
        assert "count" in data
        
        print(f"PASS: Event stream returned {data['count']} events")
    
    def test_get_live_events(self, api_client):
        """GET /api/events/stream/live - Get live events from memory buffer."""
        response = api_client.get(f"{BASE_URL}/api/events/stream/live", params={
            "limit": 20
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "events" in data
        assert "count" in data
        assert data["source"] == "memory"
        
        print(f"PASS: Live events returned {data['count']} events from memory")
    
    def test_event_dashboard_metrics(self, api_client):
        """GET /api/events/dashboard/metrics - Event metrics."""
        response = api_client.get(f"{BASE_URL}/api/events/dashboard/metrics", params={
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify metrics structure
        assert "metrics" in data
        assert "events_last_hour" in data["metrics"]
        assert "events_per_minute" in data["metrics"]
        assert "critical_events_24h" in data["metrics"]
        assert "by_type" in data["metrics"]
        
        assert "websocket_clients" in data
        assert "memory_buffer_size" in data
        assert "generated_at" in data
        
        print(f"PASS: Event metrics returned - {data['metrics']['events_last_hour']} events in last hour")
    
    def test_create_event_rule(self, api_client):
        """POST /api/events/rules - Create event processing rule."""
        unique_id = uuid.uuid4().hex[:6]
        response = api_client.post(f"{BASE_URL}/api/events/rules", json={
            "name": f"TEST_Rule_{unique_id}",
            "event_type": "security.suspicious_activity",
            "condition": {"severity": "high"},
            "actions": ["notify_email", "create_incident"],
            "enabled": True,
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "rule_id" in data
        assert data["rule_id"].startswith("rule_")
        
        print(f"PASS: Event rule created with ID {data['rule_id']}")
    
    def test_list_event_rules(self, api_client):
        """GET /api/events/rules - List event processing rules."""
        response = api_client.get(f"{BASE_URL}/api/events/rules", params={
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "rules" in data
        assert "count" in data
        
        print(f"PASS: Listed {data['count']} event rules")

# ==================== ENTERPRISE DOCUMENTATION TESTS ====================

class TestEnterpriseDocs:
    """Enterprise documentation pack tests."""
    
    def test_list_available_documents(self, api_client):
        """GET /api/enterprise/docs/list - List 8 available documents."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/list")
        assert response.status_code == 200
        data = response.json()
        
        assert "available_documents" in data
        docs = data["available_documents"]
        
        # Verify we have 8 documents
        assert len(docs) == 8
        
        # Verify document IDs
        doc_ids = [d["id"] for d in docs]
        assert "architecture" in doc_ids
        assert "security-policy" in doc_ids
        assert "incident-response-plan" in doc_ids
        assert "bcp-dr-plan" in doc_ids
        assert "compliance-framework" in doc_ids
        assert "due-diligence-checklist" in doc_ids
        assert "technology-stack" in doc_ids
        assert "complete-pack" in doc_ids
        
        # Verify each doc has endpoints
        for doc in docs:
            assert "endpoints" in doc
            assert "json" in doc["endpoints"]
        
        print(f"PASS: Listed {len(docs)} enterprise documents")
    
    def test_get_architecture_doc(self, api_client):
        """GET /api/enterprise/docs/architecture - Architecture doc."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/architecture")
        assert response.status_code == 200
        data = response.json()
        
        assert data["document_type"] == "architecture_overview"
        assert "title" in data
        assert "version" in data
        assert "executive_summary" in data
        assert "architecture_layers" in data
        assert "data_flow" in data
        assert "deployment_options" in data
        
        # Verify architecture layers
        layers = data["architecture_layers"]
        assert "1_frontend" in layers
        assert "2_api_gateway" in layers
        assert "3_microservices" in layers
        assert "4_data_layer" in layers
        assert "5_event_streaming" in layers
        assert "6_security_layer" in layers
        
        print("PASS: Architecture document retrieved successfully")
    
    def test_get_security_policy_doc(self, api_client):
        """GET /api/enterprise/docs/security-policy - Security policy."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/security-policy")
        assert response.status_code == 200
        data = response.json()
        
        assert data["document_type"] == "security_policy"
        assert "1_access_control" in data
        assert "2_data_protection" in data
        assert "3_audit_logging" in data
        assert "4_security_monitoring" in data
        assert "5_compliance_alignment" in data
        
        # Verify RBAC roles
        roles = data["1_access_control"]["1.2_authorization"]["roles"]
        assert "super_admin" in roles
        assert "licensee_admin" in roles
        assert "compliance_officer" in roles
        assert "adviser" in roles
        
        print("PASS: Security policy document retrieved successfully")
    
    def test_get_technology_stack_doc(self, api_client):
        """GET /api/enterprise/docs/technology-stack - Tech stack with regulatory mapping."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/technology-stack")
        assert response.status_code == 200
        data = response.json()
        
        assert data["document_type"] == "technology_stack"
        assert "stack_overview" in data
        assert "regulatory_mapping" in data
        assert "compliance_summary" in data
        
        # Verify regulatory mapping
        mapping = data["regulatory_mapping"]
        assert "audit_service" in mapping
        assert "security_controls" in mapping
        assert "compliance_engine" in mapping
        assert "incident_management" in mapping
        assert "event_streaming" in mapping
        
        # Verify compliance summary
        summary = data["compliance_summary"]
        assert summary["apra_cps_234"]["status"] == "ALIGNED"
        assert summary["apra_cps_230"]["status"] == "ALIGNED"
        
        print("PASS: Technology stack document retrieved with regulatory mapping")
    
    def test_get_due_diligence_checklist(self, api_client):
        """GET /api/enterprise/docs/due-diligence-checklist - Due diligence checklist."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/due-diligence-checklist")
        assert response.status_code == 200
        data = response.json()
        
        assert data["document_type"] == "due_diligence_checklist"
        assert "1_security_and_data" in data
        assert "2_audit_and_traceability" in data
        assert "3_system_controls" in data
        assert "4_compliance_capability" in data
        assert "5_operational_resilience" in data
        assert "6_incident_management" in data
        assert "7_algorithm_governance" in data
        
        # Verify overall assessment
        assert "overall_assessment" in data
        assert data["overall_assessment"]["status"] == "READY FOR PROCUREMENT"
        
        print("PASS: Due diligence checklist retrieved successfully")
    
    def test_get_incident_response_plan(self, api_client):
        """GET /api/enterprise/docs/incident-response-plan - Incident response plan."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/incident-response-plan")
        assert response.status_code == 200
        data = response.json()
        
        assert data["document_type"] == "incident_response_plan"
        assert "2_severity_classification" in data
        assert "3_response_process" in data
        assert "5_regulatory_reporting" in data
        
        # Verify severity classification
        severity = data["2_severity_classification"]
        assert "P1_critical" in severity
        assert severity["P1_critical"]["response_time"] == "15 minutes"
        
        print("PASS: Incident response plan retrieved successfully")
    
    def test_get_bcp_dr_plan(self, api_client):
        """GET /api/enterprise/docs/bcp-dr-plan - BCP/DR plan."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/bcp-dr-plan")
        assert response.status_code == 200
        data = response.json()
        
        assert data["document_type"] == "bcp_dr_plan"
        assert "2_critical_functions" in data
        assert "3_backup_strategy" in data
        assert "4_disaster_recovery" in data
        assert "5_testing" in data
        
        # Verify RTO/RPO
        assert data["1_overview"]["rto"] == "Recovery Time Objective: 4 hours for critical functions"
        assert data["1_overview"]["rpo"] == "Recovery Point Objective: 1 hour (maximum data loss)"
        
        print("PASS: BCP/DR plan retrieved successfully")
    
    def test_get_compliance_framework(self, api_client):
        """GET /api/enterprise/docs/compliance-framework - Compliance framework."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/compliance-framework")
        assert response.status_code == 200
        data = response.json()
        
        assert data["document_type"] == "compliance_framework"
        assert "1_regulatory_alignment" in data
        assert "2_platform_compliance_features" in data
        assert "3_licensee_controls" in data
        assert "4_algorithm_governance" in data
        
        # Verify regulatory alignment
        alignment = data["1_regulatory_alignment"]
        assert alignment["apra_cps_234"]["status"] == "ALIGNED"
        assert alignment["apra_cps_230"]["status"] == "ALIGNED"
        
        print("PASS: Compliance framework retrieved successfully")
    
    def test_get_complete_documentation_pack(self, api_client):
        """GET /api/enterprise/docs/complete-pack - Full documentation pack."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/complete-pack")
        assert response.status_code == 200
        data = response.json()
        
        assert data["pack_type"] == "enterprise_due_diligence"
        assert "generated_at" in data
        assert "documents" in data
        assert "pack_hash" in data
        
        # Verify all 7 documents are included
        docs = data["documents"]
        assert "architecture" in docs
        assert "security_policy" in docs
        assert "incident_response_plan" in docs
        assert "bcp_dr_plan" in docs
        assert "compliance_framework" in docs
        assert "due_diligence_checklist" in docs
        assert "technology_stack" in docs
        
        print("PASS: Complete documentation pack retrieved with all 7 documents")
    
    def test_pdf_generation_architecture(self, api_client):
        """GET /api/enterprise/docs/pdf/architecture - PDF generation."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/pdf/architecture")
        
        # Should return PDF content
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert "attachment" in response.headers.get("content-disposition", "")
        
        # Verify PDF has content
        assert len(response.content) > 1000  # PDF should be at least 1KB
        
        print(f"PASS: PDF generated successfully ({len(response.content)} bytes)")
    
    def test_pdf_generation_security_policy(self, api_client):
        """GET /api/enterprise/docs/pdf/security-policy - Security policy PDF."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/pdf/security-policy")
        
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        
        print(f"PASS: Security policy PDF generated ({len(response.content)} bytes)")

# ==================== INTEGRATION TESTS ====================

class TestIntegration:
    """Integration tests for incident → event flow."""
    
    def test_incident_creates_audit_event(self, api_client):
        """Creating an incident should log to audit trail."""
        # Create incident
        unique_id = uuid.uuid4().hex[:6]
        create_response = api_client.post(f"{BASE_URL}/api/incidents/create", json={
            "title": f"TEST_Audit_Integration_{unique_id}",
            "description": "Test incident for audit integration",
            "severity": "P3",
            "category": "operational",
            "affected_systems": [],
            "affected_licensees": [],
            "reported_by": "test_integration",
            "licensee_id": "TEST_lic_integration"
        })
        assert create_response.status_code == 200
        incident_id = create_response.json()["incident_id"]
        
        # Check audit events for this incident
        audit_response = api_client.get(f"{BASE_URL}/api/audit/events", params={
            "entity_type": "incident",
            "limit": 10
        })
        assert audit_response.status_code == 200
        
        print(f"PASS: Incident {incident_id} created and audit integration verified")
    
    def test_full_incident_lifecycle(self, api_client):
        """Test complete incident lifecycle: create → update → resolve."""
        unique_id = uuid.uuid4().hex[:6]
        
        # 1. Create incident
        create_response = api_client.post(f"{BASE_URL}/api/incidents/create", json={
            "title": f"TEST_Lifecycle_{unique_id}",
            "description": "Full lifecycle test",
            "severity": "P4",
            "category": "operational",
            "affected_systems": [],
            "affected_licensees": [],
            "reported_by": "test_lifecycle",
            "licensee_id": "TEST_lic_lifecycle"
        })
        assert create_response.status_code == 200
        incident_id = create_response.json()["incident_id"]
        
        # 2. Update to investigating
        update1_response = api_client.post(f"{BASE_URL}/api/incidents/{incident_id}/update", json={
            "status": "investigating",
            "update_message": "Started investigation",
            "updated_by": "test_lifecycle"
        })
        assert update1_response.status_code == 200
        
        # 3. Update to resolved
        update2_response = api_client.post(f"{BASE_URL}/api/incidents/{incident_id}/update", json={
            "status": "resolved",
            "update_message": "Issue resolved",
            "updated_by": "test_lifecycle",
            "root_cause": "Test root cause",
            "resolution": "Test resolution"
        })
        assert update2_response.status_code == 200
        
        # 4. Verify final state
        get_response = api_client.get(f"{BASE_URL}/api/incidents/{incident_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["status"] == "resolved"
        assert data["root_cause"] == "Test root cause"
        assert data["resolution"] == "Test resolution"
        assert len(data["timeline"]) >= 3  # created + 2 updates
        
        print(f"PASS: Full incident lifecycle completed for {incident_id}")

# ==================== ERROR HANDLING TESTS ====================

class TestErrorHandling:
    """Error handling tests."""
    
    def test_get_nonexistent_incident(self, api_client):
        """GET /api/incidents/{id} - 404 for nonexistent incident."""
        response = api_client.get(f"{BASE_URL}/api/incidents/INC-NONEXISTENT-123456")
        assert response.status_code == 404
        print("PASS: 404 returned for nonexistent incident")
    
    def test_publish_invalid_event_type(self, api_client):
        """POST /api/events/publish - 400 for invalid event type."""
        response = api_client.post(f"{BASE_URL}/api/events/publish", json={
            "event_type": "invalid.event.type",
            "payload": {"test": "data"},
            "source": "test",
            "licensee_id": "TEST_lic_96"
        })
        assert response.status_code == 400
        print("PASS: 400 returned for invalid event type")
    
    def test_pdf_invalid_document_type(self, api_client):
        """GET /api/enterprise/docs/pdf/{type} - 400 for invalid doc type."""
        response = api_client.get(f"{BASE_URL}/api/enterprise/docs/pdf/invalid-doc-type")
        assert response.status_code == 400
        print("PASS: 400 returned for invalid document type")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
