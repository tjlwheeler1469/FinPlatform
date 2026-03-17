"""
Test Suite for Wealth Command v7.1.0 - CRM Foundation
Tests Household Intelligence and Compliance & Audit Layer APIs

Household Intelligence:
- Multi-generational family trees
- Business entities (trusts, companies, SMSFs)
- Professional networks
- Net worth aggregation

Compliance & Audit Layer:
- Full audit logs
- KYC/AML workflows
- Document management
- Approval workflows
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHouseholdList:
    """Test /api/household/list endpoint"""
    
    def test_list_households_returns_200(self):
        """Test that household list endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/household/list")
        assert response.status_code == 200
        
        data = response.json()
        assert "households" in data
        assert "total" in data
        assert "timestamp" in data
        assert isinstance(data["households"], list)
        assert data["total"] >= 1  # At least Wheeler Family
    
    def test_list_households_contains_wheeler_family(self):
        """Test that Wheeler Family is in the household list"""
        response = requests.get(f"{BASE_URL}/api/household/list")
        assert response.status_code == 200
        
        data = response.json()
        households = data["households"]
        wheeler = next((h for h in households if h["household_id"] == "hh_wheeler"), None)
        
        assert wheeler is not None
        assert wheeler["name"] == "Wheeler Family"
        assert wheeler["members_count"] == 6
        assert wheeler["entities_count"] == 4
        assert "estimated_net_worth" in wheeler


class TestHouseholdDetail:
    """Test /api/household/{household_id} endpoint"""
    
    def test_get_wheeler_household_returns_200(self):
        """Test getting complete Wheeler household details"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler")
        assert response.status_code == 200
        
        data = response.json()
        assert data["household_id"] == "hh_wheeler"
        assert data["name"] == "Wheeler Family"
        assert "members" in data
        assert "relationships" in data
        assert "entities" in data
        assert "professionals" in data
        assert "aggregated_financials" in data
    
    def test_wheeler_household_has_6_members(self):
        """Test Wheeler household has 6 family members"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["members"]) == 6
        
        # Verify primary member
        primary = next((m for m in data["members"] if m["is_primary"]), None)
        assert primary is not None
        assert primary["first_name"] == "John"
        assert primary["last_name"] == "Wheeler"
    
    def test_wheeler_household_aggregated_financials(self):
        """Test aggregated financials are calculated correctly"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler")
        assert response.status_code == 200
        
        data = response.json()
        financials = data["aggregated_financials"]
        
        assert "total_member_income" in financials
        assert "total_entity_assets" in financials
        assert "total_entity_liabilities" in financials
        assert "total_entity_net_worth" in financials
        assert financials["total_member_income"] > 0
        assert financials["total_entity_assets"] > 0
    
    def test_nonexistent_household_returns_404(self):
        """Test that nonexistent household returns 404"""
        response = requests.get(f"{BASE_URL}/api/household/hh_nonexistent")
        assert response.status_code == 404


class TestFamilyTree:
    """Test /api/household/{household_id}/family-tree endpoint"""
    
    def test_get_family_tree_returns_200(self):
        """Test getting family tree structure"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/family-tree")
        assert response.status_code == 200
        
        data = response.json()
        assert data["household_id"] == "hh_wheeler"
        assert "nodes" in data
        assert "edges" in data
        assert "total_members" in data
        assert "generations" in data
    
    def test_family_tree_has_correct_nodes(self):
        """Test family tree has correct node structure"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/family-tree")
        assert response.status_code == 200
        
        data = response.json()
        nodes = data["nodes"]
        
        assert len(nodes) == 6
        
        # Check node structure
        for node in nodes:
            assert "id" in node
            assert "name" in node
            assert "occupation" in node
            assert "status" in node
    
    def test_family_tree_has_relationships(self):
        """Test family tree has relationship edges"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/family-tree")
        assert response.status_code == 200
        
        data = response.json()
        edges = data["edges"]
        
        assert len(edges) >= 7  # At least 7 relationships
        
        # Check edge structure
        for edge in edges:
            assert "from" in edge
            assert "to" in edge
            assert "type" in edge
            assert "label" in edge
    
    def test_family_tree_generations(self):
        """Test family tree counts generations correctly"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/family-tree")
        assert response.status_code == 200
        
        data = response.json()
        assert data["generations"] >= 2  # At least 2 generations


class TestHouseholdEntities:
    """Test /api/household/{household_id}/entities endpoint"""
    
    def test_get_entities_returns_200(self):
        """Test getting household entities"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/entities")
        assert response.status_code == 200
        
        data = response.json()
        assert data["household_id"] == "hh_wheeler"
        assert "entities" in data
        assert "by_type" in data
        assert "summary" in data
    
    def test_wheeler_has_4_entities(self):
        """Test Wheeler household has 4 entities"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/entities")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["entities"]) == 4
        assert data["summary"]["total_entities"] == 4
    
    def test_entities_include_trust_company_smsf(self):
        """Test entities include trust, company, and SMSF"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/entities")
        assert response.status_code == 200
        
        data = response.json()
        entity_types = data["summary"]["entity_types"]
        
        assert "family_trust" in entity_types
        assert "company" in entity_types
        assert "smsf" in entity_types
    
    def test_entities_have_roles(self):
        """Test entities have associated roles"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/entities")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check Wheeler Family Trust has roles
        family_trust = next((e for e in data["entities"] if e["name"] == "Wheeler Family Trust"), None)
        assert family_trust is not None
        assert "roles" in family_trust
        assert len(family_trust["roles"]) > 0
    
    def test_entities_summary_financials(self):
        """Test entities summary has correct financials"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/entities")
        assert response.status_code == 200
        
        data = response.json()
        summary = data["summary"]
        
        assert summary["total_assets"] > 0
        assert summary["total_net_worth"] > 0


class TestHouseholdProfessionals:
    """Test /api/household/{household_id}/professionals endpoint"""
    
    def test_get_professionals_returns_200(self):
        """Test getting professional network"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/professionals")
        assert response.status_code == 200
        
        data = response.json()
        assert data["household_id"] == "hh_wheeler"
        assert "professionals" in data
        assert "by_type" in data
        assert "summary" in data
    
    def test_wheeler_has_3_professionals(self):
        """Test Wheeler household has 3 professionals"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/professionals")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["professionals"]) == 3
        assert data["summary"]["total_professionals"] == 3
    
    def test_professionals_include_accountant_lawyer_broker(self):
        """Test professionals include accountant, lawyer, and mortgage broker"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/professionals")
        assert response.status_code == 200
        
        data = response.json()
        types_covered = data["summary"]["types_covered"]
        
        assert "accountant" in types_covered
        assert "lawyer" in types_covered
        assert "mortgage_broker" in types_covered
    
    def test_professionals_have_specializations(self):
        """Test professionals have specializations"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/professionals")
        assert response.status_code == 200
        
        data = response.json()
        
        accountant = next((p for p in data["professionals"] if p["professional_type"] == "accountant"), None)
        assert accountant is not None
        assert "specializations" in accountant
        assert len(accountant["specializations"]) > 0


class TestHouseholdNetWorth:
    """Test /api/household/{household_id}/net-worth endpoint"""
    
    def test_get_net_worth_returns_200(self):
        """Test getting household net worth"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/net-worth")
        assert response.status_code == 200
        
        data = response.json()
        assert data["household_id"] == "hh_wheeler"
        assert "member_assets" in data
        assert "entity_assets" in data
        assert "summary" in data
    
    def test_net_worth_has_member_assets(self):
        """Test net worth includes member assets"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/net-worth")
        assert response.status_code == 200
        
        data = response.json()
        member_assets = data["member_assets"]
        
        assert len(member_assets) == 6
        
        for member in member_assets:
            assert "member_id" in member
            assert "name" in member
            assert "total" in member
            assert "super" in member
            assert "investments" in member
    
    def test_net_worth_has_entity_assets(self):
        """Test net worth includes entity assets"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/net-worth")
        assert response.status_code == 200
        
        data = response.json()
        entity_assets = data["entity_assets"]
        
        assert len(entity_assets) == 4
        
        for entity in entity_assets:
            assert "entity_id" in entity
            assert "name" in entity
            assert "type" in entity
            assert "assets" in entity
            assert "liabilities" in entity
            assert "net_worth" in entity
    
    def test_net_worth_summary_by_asset_class(self):
        """Test net worth summary includes asset class breakdown"""
        response = requests.get(f"{BASE_URL}/api/household/hh_wheeler/net-worth")
        assert response.status_code == 200
        
        data = response.json()
        summary = data["summary"]
        
        assert "household_net_worth" in summary
        assert "by_asset_class" in summary
        
        by_class = summary["by_asset_class"]
        assert "superannuation" in by_class
        assert "investments" in by_class
        assert "business" in by_class
        assert "smsf" in by_class


# ==================== COMPLIANCE & AUDIT TESTS ====================

class TestComplianceDashboard:
    """Test /api/compliance-audit/dashboard endpoint"""
    
    def test_get_dashboard_returns_200(self):
        """Test getting compliance dashboard"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "kyc" in data
        assert "approvals" in data
        assert "documents" in data
        assert "audit" in data
        assert "alerts" in data
        assert "timestamp" in data
    
    def test_dashboard_kyc_summary(self):
        """Test dashboard has KYC summary"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        kyc = data["kyc"]
        
        assert "total_clients" in kyc
        assert "by_status" in kyc
        assert kyc["total_clients"] >= 2
    
    def test_dashboard_approvals_summary(self):
        """Test dashboard has approvals summary"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        approvals = data["approvals"]
        
        assert "total" in approvals
        assert "by_status" in approvals
        assert "pending" in approvals


class TestAuditLog:
    """Test /api/compliance-audit/audit-log endpoint"""
    
    def test_get_audit_log_returns_200(self):
        """Test getting audit log"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/audit-log")
        assert response.status_code == 200
        
        data = response.json()
        assert "logs" in data
        assert "total" in data
        assert "filters_applied" in data
        assert "timestamp" in data
    
    def test_audit_log_has_entries(self):
        """Test audit log has demo entries"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/audit-log")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["logs"]) >= 5  # Demo data has 5 entries
    
    def test_audit_log_entry_structure(self):
        """Test audit log entries have correct structure"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/audit-log")
        assert response.status_code == 200
        
        data = response.json()
        log = data["logs"][0]
        
        assert "log_id" in log
        assert "timestamp" in log
        assert "user_id" in log
        assert "action" in log
        assert "resource_type" in log
        assert "success" in log
    
    def test_audit_log_with_limit(self):
        """Test audit log respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/audit-log?limit=2")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["logs"]) <= 2


class TestAuditLogSummary:
    """Test /api/compliance-audit/audit-log/summary endpoint"""
    
    def test_get_audit_summary_returns_200(self):
        """Test getting audit summary"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/audit-log/summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "period_days" in data
        assert "total_events" in data
        assert "by_action" in data
        assert "by_user" in data
        assert "by_resource_type" in data
        assert "failed_events" in data
    
    def test_audit_summary_by_action(self):
        """Test audit summary groups by action"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/audit-log/summary")
        assert response.status_code == 200
        
        data = response.json()
        by_action = data["by_action"]
        
        # Demo data has login, read, trade, document_upload, approve
        assert len(by_action) >= 1


class TestKYCDashboard:
    """Test /api/compliance-audit/kyc/dashboard endpoint"""
    
    def test_get_kyc_dashboard_returns_200(self):
        """Test getting KYC dashboard"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/kyc/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "summary" in data
        assert "expiring_soon" in data
        assert "pending_reviews" in data
        assert "timestamp" in data
    
    def test_kyc_dashboard_summary(self):
        """Test KYC dashboard has summary"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/kyc/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        summary = data["summary"]
        
        assert "total_clients" in summary
        assert "by_status" in summary
        assert summary["total_clients"] >= 2


class TestKYCClient:
    """Test /api/compliance-audit/kyc/{client_id} endpoint"""
    
    def test_get_kyc_client_1_returns_200(self):
        """Test getting KYC for client_1"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/kyc/client_1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == "client_1"
        assert data["client_name"] == "John Wheeler"
        assert data["status"] == "approved"
    
    def test_kyc_client_has_verification_details(self):
        """Test KYC record has verification details"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/kyc/client_1")
        assert response.status_code == 200
        
        data = response.json()
        assert "verification_date" in data
        assert "expiry_date" in data
        assert "documents_verified" in data
        assert "risk_rating" in data
        assert "history" in data
    
    def test_kyc_nonexistent_client_returns_not_started(self):
        """Test KYC for nonexistent client returns not_started status"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/kyc/client_nonexistent")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "not_started"


class TestDocuments:
    """Test /api/compliance-audit/documents endpoint"""
    
    def test_get_documents_returns_200(self):
        """Test getting documents list"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/documents")
        assert response.status_code == 200
        
        data = response.json()
        assert "documents" in data
        assert "total" in data
        assert "timestamp" in data
    
    def test_documents_has_demo_data(self):
        """Test documents list has demo data"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/documents")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["documents"]) >= 3  # Demo has 3 documents
    
    def test_document_structure(self):
        """Test document has correct structure"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/documents")
        assert response.status_code == 200
        
        data = response.json()
        doc = data["documents"][0]
        
        assert "document_id" in doc
        assert "client_id" in doc
        assert "document_type" in doc
        assert "title" in doc
        assert "filename" in doc
        assert "uploaded_by" in doc
        assert "uploaded_at" in doc
    
    def test_documents_filter_by_client(self):
        """Test documents can be filtered by client"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/documents?client_id=client_1")
        assert response.status_code == 200
        
        data = response.json()
        for doc in data["documents"]:
            assert doc["client_id"] == "client_1"


class TestApprovals:
    """Test /api/compliance-audit/approvals endpoint"""
    
    def test_get_approvals_returns_200(self):
        """Test getting approvals list"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/approvals")
        assert response.status_code == 200
        
        data = response.json()
        assert "approvals" in data
        assert "total" in data
        assert "pending_count" in data
        assert "timestamp" in data
    
    def test_approvals_has_demo_data(self):
        """Test approvals list has demo data"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/approvals")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["approvals"]) >= 3  # Demo has 3 approvals
    
    def test_approval_structure(self):
        """Test approval has correct structure"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/approvals")
        assert response.status_code == 200
        
        data = response.json()
        approval = data["approvals"][0]
        
        assert "approval_id" in approval
        assert "approval_type" in approval
        assert "status" in approval
        assert "requested_by" in approval
        assert "requested_at" in approval
        assert "client_id" in approval
        assert "details" in approval


class TestApprovalsDashboard:
    """Test /api/compliance-audit/approvals/dashboard endpoint"""
    
    def test_get_approvals_dashboard_returns_200(self):
        """Test getting approvals dashboard"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/approvals/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "summary" in data
        assert "pending_approvals" in data
        assert "escalated_approvals" in data
        assert "timestamp" in data
    
    def test_approvals_dashboard_summary(self):
        """Test approvals dashboard has summary"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/approvals/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        summary = data["summary"]
        
        assert "total_approvals" in summary
        assert "pending" in summary
        assert "escalated" in summary
        assert "by_type" in summary
        assert "by_status" in summary
    
    def test_approvals_dashboard_has_pending(self):
        """Test approvals dashboard shows pending approvals"""
        response = requests.get(f"{BASE_URL}/api/compliance-audit/approvals/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        # Demo data has at least 1 pending approval
        assert data["summary"]["pending"] >= 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
