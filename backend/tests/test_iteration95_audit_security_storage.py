"""
Test Suite for Iteration 95 - AdviceOS Compliance Features
==========================================================
Tests for:
1. Immutable Audit Service - Hash chaining, tamper detection, regulatory export
2. Security Controls - RBAC, rate limiting, API key management
3. Object Storage - File uploads, audit export storage

ASIC/APRA/ISO compliance features testing
"""

import pytest
import requests
import os
import uuid
import time

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Verify new services are registered in health endpoint"""
    
    def test_health_check_includes_new_services(self):
        """Test that health check includes audit_service, security_controls, object_storage"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        
        # Check AdviceOS section includes new services
        adviceos = data.get("adviceos", {})
        assert adviceos.get("audit_service"), "audit_service should be True in health check"
        assert adviceos.get("security_controls"), "security_controls should be True in health check"
        assert adviceos.get("object_storage"), "object_storage should be True in health check"
        
        print("✓ Health check includes all new services: audit_service, security_controls, object_storage")


class TestAuditService:
    """Test Immutable Audit Service with hash chaining"""
    
    def test_create_audit_log(self):
        """POST /api/audit/log - Create immutable audit log with hash chaining"""
        payload = {
            "event_type": "create",
            "entity_type": "client",
            "entity_id": f"TEST_client_{uuid.uuid4().hex[:8]}",
            "user_id": "TEST_adviser_001",
            "user_role": "adviser",
            "licensee_id": "TEST_lic_001",
            "action_description": "Created new client record for testing",
            "before_state": None,
            "after_state": {"name": "Test Client", "status": "active"},
            "metadata": {"test": True, "iteration": 95}
        }
        
        response = requests.post(f"{BASE_URL}/api/audit/log", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert "event_id" in data
        assert data["event_id"].startswith("evt_")
        assert "timestamp" in data
        assert data["chain_verified"]
        
        print(f"✓ Created audit log: {data['event_id']}")
        return data["event_id"]
    
    def test_query_audit_events(self):
        """GET /api/audit/events - Query audit events"""
        # First create an event
        self.test_create_audit_log()
        
        response = requests.get(f"{BASE_URL}/api/audit/events", params={
            "licensee_id": "TEST_lic_001",
            "limit": 10
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "events" in data
        assert "count" in data
        assert isinstance(data["events"], list)
        
        print(f"✓ Query returned {data['count']} audit events")
    
    def test_verify_hash_chain(self):
        """GET /api/audit/chain/verify - Verify hash chain integrity"""
        response = requests.get(f"{BASE_URL}/api/audit/chain/verify", params={
            "licensee_id": "TEST_lic_001",
            "limit": 100
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "valid" in data
        assert "entries_checked" in data
        assert "verified_at" in data
        
        # Chain should be valid (no tampering)
        assert data["valid"], "Hash chain should be valid"
        
        print(f"✓ Hash chain verified: {data['entries_checked']} entries, valid={data['valid']}")
    
    def test_get_chain_status(self):
        """GET /api/audit/chain/status - Get chain status"""
        response = requests.get(f"{BASE_URL}/api/audit/chain/status", params={
            "licensee_id": "TEST_lic_001"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["licensee_id"] == "TEST_lic_001"
        assert "total_events" in data
        assert "chain_length" in data
        assert "last_hash" in data
        assert data["tamper_detection"] == "hash_chaining_active"
        
        print(f"✓ Chain status: {data['chain_length']} entries, tamper_detection={data['tamper_detection']}")
    
    def test_export_audit_pack(self):
        """POST /api/audit/export - Export audit pack without storage"""
        response = requests.post(f"{BASE_URL}/api/audit/export", params={
            "licensee_id": "TEST_lic_001",
            "format": "json",
            "save_to_storage": False
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "export_id" in data
        assert "event_count" in data
        assert "chain_verification" in data
        assert "certificate" in data
        
        # Verify certificate structure
        cert = data["certificate"]
        assert cert["type"] == "audit_export_certificate"
        assert "signature" in cert
        
        print(f"✓ Exported audit pack: {data['export_id']}, {data['event_count']} events")
    
    def test_export_audit_pack_with_storage(self):
        """POST /api/audit/export?save_to_storage=true - Export with object storage save"""
        response = requests.post(f"{BASE_URL}/api/audit/export", params={
            "licensee_id": "TEST_lic_001",
            "format": "json",
            "save_to_storage": True
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "export_id" in data
        assert "storage" in data
        
        storage = data["storage"]
        # Storage should either succeed or fail gracefully
        if storage.get("saved"):
            assert "path" in storage
            print(f"✓ Audit export saved to storage: {storage['path']}")
        else:
            print(f"✓ Audit export created (storage save failed gracefully: {storage.get('error', 'unknown')})")
    
    def test_regulatory_summary(self):
        """GET /api/audit/regulatory/summary - Regulatory compliance summary"""
        response = requests.get(f"{BASE_URL}/api/audit/regulatory/summary", params={
            "licensee_id": "TEST_lic_001"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["licensee_id"] == "TEST_lic_001"
        assert "reporting_period" in data
        assert "summary" in data
        assert "audit_integrity" in data
        assert "compliance_status" in data
        
        # Check compliance status
        compliance = data["compliance_status"]
        assert compliance["asic_requirements"] == "MET"
        assert compliance["apra_cps234"] == "MET"
        assert compliance["immutability"] == "ENFORCED"
        
        print(f"✓ Regulatory summary: ASIC={compliance['asic_requirements']}, APRA={compliance['apra_cps234']}")
    
    def test_hash_chain_integrity_multiple_events(self):
        """Test hash chaining by creating multiple events and verifying chain"""
        # Create 3 events in sequence
        event_ids = []
        for i in range(3):
            payload = {
                "event_type": "update",
                "entity_type": "scenario",
                "entity_id": f"TEST_scenario_{uuid.uuid4().hex[:8]}",
                "user_id": "TEST_adviser_chain",
                "user_role": "adviser",
                "licensee_id": "TEST_lic_chain",
                "action_description": f"Chain test event {i+1}",
                "before_state": {"version": i},
                "after_state": {"version": i+1}
            }
            response = requests.post(f"{BASE_URL}/api/audit/log", json=payload)
            assert response.status_code == 200
            event_ids.append(response.json()["event_id"])
        
        # Verify chain integrity
        response = requests.get(f"{BASE_URL}/api/audit/chain/verify", params={
            "licensee_id": "TEST_lic_chain"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["valid"], "Chain should remain valid after multiple events"
        assert data["entries_checked"] >= 3
        
        print(f"✓ Hash chain integrity verified after {len(event_ids)} events")


class TestSecurityControls:
    """Test Security Controls with RBAC"""
    
    def test_initialize_roles(self):
        """POST /api/security/roles/init - Initialize RBAC roles"""
        response = requests.post(f"{BASE_URL}/api/security/roles/init")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert "roles_initialized" in data
        assert "roles" in data
        
        # Should have default roles
        expected_roles = ["super_admin", "licensee_admin", "compliance_officer", "adviser", "support_staff", "auditor"]
        for role in expected_roles:
            assert role in data["roles"], f"Missing role: {role}"
        
        print(f"✓ Initialized {data['roles_initialized']} RBAC roles: {data['roles']}")
    
    def test_list_roles(self):
        """GET /api/security/roles - List all roles"""
        response = requests.get(f"{BASE_URL}/api/security/roles")
        assert response.status_code == 200
        
        data = response.json()
        assert "roles" in data
        assert "count" in data
        assert data["count"] >= 6  # At least default roles
        
        print(f"✓ Listed {data['count']} roles")
    
    def test_get_specific_role(self):
        """GET /api/security/roles/{role_name} - Get specific role permissions"""
        response = requests.get(f"{BASE_URL}/api/security/roles/adviser")
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "adviser"
        assert "permissions" in data
        assert "description" in data
        
        # Adviser should have specific permissions
        permissions = data["permissions"]
        assert "client:read" in permissions
        assert "scenario:create" in permissions
        
        print(f"✓ Got adviser role with {len(permissions)} permissions")
    
    def test_get_nonexistent_role(self):
        """GET /api/security/roles/{role_name} - 404 for nonexistent role"""
        response = requests.get(f"{BASE_URL}/api/security/roles/nonexistent_role_xyz")
        assert response.status_code == 404
        
        print("✓ Correctly returns 404 for nonexistent role")
    
    def test_check_permission(self):
        """POST /api/security/check-permission - Check user permission"""
        # This will return "User not found" since we don't have a real user
        response = requests.post(f"{BASE_URL}/api/security/check-permission", params={
            "user_id": "TEST_user_001",
            "permission": "client:read"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "has_permission" in data
        # User won't exist, so should return False with reason
        if not data["has_permission"]:
            assert "reason" in data
        
        print(f"✓ Permission check returned: has_permission={data['has_permission']}")
    
    def test_security_controls_status(self):
        """GET /api/security/controls/status - Security controls status"""
        response = requests.get(f"{BASE_URL}/api/security/controls/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "controls" in data
        assert "compliance_alignment" in data
        
        controls = data["controls"]
        assert "encryption" in controls
        assert "authentication" in controls
        assert "authorization" in controls
        assert "rate_limiting" in controls
        assert "audit_logging" in controls
        
        # Check compliance alignment
        compliance = data["compliance_alignment"]
        assert compliance["cps_234"] == "aligned"
        assert compliance["cps_230"] == "aligned"
        
        print(f"✓ Security controls status: CPS 234={compliance['cps_234']}, CPS 230={compliance['cps_230']}")
    
    def test_security_dashboard(self):
        """GET /api/security/dashboard - Security dashboard"""
        response = requests.get(f"{BASE_URL}/api/security/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "summary" in data
        assert "threat_level" in data
        assert "controls_status" in data
        assert "generated_at" in data
        
        summary = data["summary"]
        assert "security_events_24h" in summary
        assert "critical_events_7d" in summary
        assert "failed_logins_24h" in summary
        
        print(f"✓ Security dashboard: threat_level={data['threat_level']}, events_24h={summary['security_events_24h']}")
    
    def test_generate_api_key(self):
        """POST /api/security/api-keys/generate - Generate API key"""
        response = requests.post(f"{BASE_URL}/api/security/api-keys/generate", params={
            "name": f"TEST_key_{uuid.uuid4().hex[:8]}",
            "licensee_id": "TEST_lic_001",
            "permissions": ["api:read", "client:read"]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert "key_id" in data
        assert "api_key" in data
        assert data["api_key"].startswith("wc_")
        assert "warning" in data  # Should warn about storing key
        
        print(f"✓ Generated API key: {data['key_id']}, key_prefix={data['api_key'][:8]}...")
        return data["key_id"]
    
    def test_rate_limit_status(self):
        """GET /api/security/rate-limit/status - Rate limit status"""
        response = requests.get(f"{BASE_URL}/api/security/rate-limit/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "ip_address" in data
        assert "current_requests" in data
        assert "max_requests" in data
        assert "within_limit" in data
        assert "remaining" in data
        
        print(f"✓ Rate limit status: {data['current_requests']}/{data['max_requests']}, remaining={data['remaining']}")


class TestObjectStorage:
    """Test Object Storage Service"""
    
    def test_storage_status(self):
        """GET /api/storage/status - Storage service status"""
        response = requests.get(f"{BASE_URL}/api/storage/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["service"] == "object_storage"
        assert "status" in data
        assert "key_configured" in data
        assert "capabilities" in data
        
        # Should have audit_exports capability
        assert "audit_exports" in data["capabilities"]
        
        print(f"✓ Storage status: {data['status']}, key_configured={data['key_configured']}")
    
    def test_initialize_storage(self):
        """POST /api/storage/init - Initialize storage connection"""
        response = requests.post(f"{BASE_URL}/api/storage/init")
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert "message" in data
        
        if data["success"]:
            assert "key_prefix" in data
            print(f"✓ Storage initialized: key_prefix={data['key_prefix']}")
        else:
            print(f"✓ Storage init returned (expected if key not configured): {data['message']}")
    
    def test_list_audit_exports(self):
        """GET /api/storage/audit-exports - List audit exports"""
        response = requests.get(f"{BASE_URL}/api/storage/audit-exports", params={
            "licensee_id": "TEST_lic_001",
            "limit": 10
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "exports" in data
        assert "count" in data
        assert isinstance(data["exports"], list)
        
        print(f"✓ Listed {data['count']} audit exports")
    
    def test_list_files(self):
        """GET /api/storage/files - List files by category"""
        response = requests.get(f"{BASE_URL}/api/storage/files", params={
            "licensee_id": "TEST_lic_001",
            "limit": 10
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "files" in data
        assert "count" in data
        
        print(f"✓ Listed {data['count']} files")
    
    def test_document_backup_status(self):
        """GET /api/storage/document-backup/status - Document backup status"""
        response = requests.get(f"{BASE_URL}/api/storage/document-backup/status", params={
            "licensee_id": "TEST_lic_001"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["licensee_id"] == "TEST_lic_001"
        assert "total_files" in data
        assert "audit_exports" in data
        assert data["storage_provider"] == "emergent_object_storage"
        assert data["backup_status"] == "active"
        
        print(f"✓ Backup status: {data['total_files']} files, {data['audit_exports']} audit exports")


class TestAuditStatistics:
    """Test Audit Statistics and User Activity"""
    
    def test_audit_statistics(self):
        """GET /api/audit/statistics - Get audit statistics"""
        response = requests.get(f"{BASE_URL}/api/audit/statistics", params={
            "licensee_id": "TEST_lic_001"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "total_events" in data
        assert "today" in data
        assert "last_7_days" in data
        assert "by_event_type" in data
        assert data["retention_policy"] == "7_years"
        
        print(f"✓ Audit statistics: total={data['total_events']}, today={data['today']}")
    
    def test_user_activity(self):
        """GET /api/audit/user/{user_id}/activity - Get user activity"""
        response = requests.get(f"{BASE_URL}/api/audit/user/TEST_adviser_001/activity", params={
            "days": 30
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == "TEST_adviser_001"
        assert "total_events" in data
        assert "by_event_type" in data
        assert "recent_events" in data
        
        print(f"✓ User activity: {data['total_events']} events in last {data['period_days']} days")
    
    def test_entity_replay(self):
        """GET /api/audit/replay/{entity_type}/{entity_id} - Replay entity history"""
        # First create an event for a specific entity
        entity_id = f"TEST_replay_{uuid.uuid4().hex[:8]}"
        payload = {
            "event_type": "create",
            "entity_type": "client",
            "entity_id": entity_id,
            "user_id": "TEST_adviser_replay",
            "action_description": "Created for replay test"
        }
        requests.post(f"{BASE_URL}/api/audit/log", json=payload)
        
        # Now replay
        response = requests.get(f"{BASE_URL}/api/audit/replay/client/{entity_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_type"] == "client"
        assert data["entity_id"] == entity_id
        assert "timeline" in data
        assert "total_events" in data
        
        print(f"✓ Entity replay: {data['total_events']} events for {entity_id}")


class TestSecurityEvents:
    """Test Security Event Logging"""
    
    def test_log_security_event(self):
        """POST /api/security/events/log - Log a security event"""
        payload = {
            "event_type": "login",
            "user_id": "TEST_user_security",
            "details": {"method": "password", "success": True},
            "severity": "info"
        }
        
        response = requests.post(f"{BASE_URL}/api/security/events/log", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert data["logged"]
        
        print("✓ Logged security event")
    
    def test_get_security_events(self):
        """GET /api/security/events - Get security events"""
        response = requests.get(f"{BASE_URL}/api/security/events", params={
            "limit": 10
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "events" in data
        assert "count" in data
        
        print(f"✓ Retrieved {data['count']} security events")
    
    def test_get_security_events_filtered(self):
        """GET /api/security/events - Get filtered security events"""
        response = requests.get(f"{BASE_URL}/api/security/events", params={
            "event_type": "login",
            "severity": "info",
            "limit": 5
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "events" in data
        
        print(f"✓ Retrieved {data['count']} filtered security events")


class TestCreateCustomRole:
    """Test Custom Role Creation"""
    
    def test_create_custom_role(self):
        """POST /api/security/roles - Create a custom role"""
        role_name = f"TEST_custom_role_{uuid.uuid4().hex[:6]}"
        payload = {
            "name": role_name,
            "description": "Custom test role for iteration 95",
            "permissions": ["client:read", "scenario:read", "report:read"],
            "licensee_id": "TEST_lic_001"
        }
        
        response = requests.post(f"{BASE_URL}/api/security/roles", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert "role_id" in data
        
        print(f"✓ Created custom role: {role_name}")
        
        # Verify role exists
        response = requests.get(f"{BASE_URL}/api/security/roles/{role_name}")
        assert response.status_code == 200
        
        role_data = response.json()
        assert role_data["name"] == role_name
        assert len(role_data["permissions"]) == 3
        
        print(f"✓ Verified custom role has {len(role_data['permissions'])} permissions")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
