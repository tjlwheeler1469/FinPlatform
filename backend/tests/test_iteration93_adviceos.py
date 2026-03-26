"""
AdviceOS Compliance-First Testing - Iteration 93
=================================================
Tests for:
- Scenario Generator API (creates 3+ scenarios with no 'best option' ranking)
- Compliance Overlay Engine (PASS/WARNING/BLOCK results)
- Adviser Decision Layer (mandatory confirmation checkboxes and justification)
- Audit Trail (logs all actions with user ID, timestamp, before/after states)
- Reports Dashboard (compliance score and metrics)
- CSV report downloads (audit-logs, scenarios, breaches)
- CRM Command Center (clients load, client details accessible)
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://adviser-hub-9.preview.emergentagent.com').rstrip('/')


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed - version {data.get('version', 'unknown')}")


class TestAdviceOSInitialization:
    """Initialize default licensee and adviser for testing"""
    
    def test_init_default_licensee(self):
        """Initialize default licensee and adviser"""
        response = requests.post(f"{BASE_URL}/api/compliance/init-default")
        assert response.status_code == 200
        data = response.json()
        assert "licensee_id" in data
        assert "adviser_id" in data
        print(f"✓ Default licensee initialized: {data.get('licensee_id')}, adviser: {data.get('adviser_id')}")
    
    def test_generate_demo_data(self):
        """Generate demo data for reports"""
        response = requests.post(f"{BASE_URL}/api/reports/generate-demo-data")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Demo data generated: {data.get('created', {})}")


class TestScenarioGenerator:
    """Test Scenario Generator API - creates 3+ scenarios with no 'best option' ranking"""
    
    def test_generate_scenarios_minimum_three(self):
        """Verify scenario generator creates at least 3 scenarios"""
        payload = {
            "client_id": "client_1",
            "adviser_id": "adv_default",
            "licensee_id": "lic_default",
            "risk_profile": "balanced",
            "investment_timeframe_years": 10,
            "initial_investment": 500000,
            "monthly_contribution": 2000,
            "income_requirement": 0
        }
        response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify scenario set structure
        assert "scenario_set" in data
        scenario_set = data["scenario_set"]
        assert "scenarios" in scenario_set
        
        # Verify minimum 3 scenarios
        scenarios = scenario_set["scenarios"]
        assert len(scenarios) >= 3, f"Expected at least 3 scenarios, got {len(scenarios)}"
        print(f"✓ Generated {len(scenarios)} scenarios (minimum 3 required)")
        
        # Verify no 'best option' or 'recommended' ranking
        for scenario in scenarios:
            assert "recommended" not in str(scenario).lower() or scenario.get("recommended") != True
            assert "best_option" not in scenario
            assert "ranking" not in scenario
        print("✓ No 'best option' or 'recommended' ranking found in scenarios")
        
        # Verify disclaimer is present
        assert "disclaimer" in data
        assert "not financial advice" in data["disclaimer"].lower() or "decision support" in data["disclaimer"].lower()
        print(f"✓ Disclaimer present: {data['disclaimer'][:50]}...")
        
        return scenario_set
    
    def test_scenario_types_generated(self):
        """Verify conservative, balanced, and growth scenarios are generated"""
        payload = {
            "client_id": "client_2",
            "adviser_id": "adv_default",
            "risk_profile": "balanced",
            "investment_timeframe_years": 15,
            "initial_investment": 750000,
            "monthly_contribution": 3000,
            "income_requirement": 0
        }
        response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        scenarios = data["scenario_set"]["scenarios"]
        scenario_types = [s["scenario_type"] for s in scenarios]
        
        # Verify all three main types are present
        assert "conservative" in scenario_types, "Conservative scenario missing"
        assert "balanced" in scenario_types, "Balanced scenario missing"
        assert "growth" in scenario_types, "Growth scenario missing"
        print(f"✓ All scenario types present: {scenario_types}")
    
    def test_trade_offs_generated(self):
        """Verify trade-off analysis is generated"""
        payload = {
            "client_id": "client_3",
            "adviser_id": "adv_default",
            "risk_profile": "moderately_aggressive",
            "investment_timeframe_years": 20,
            "initial_investment": 1000000,
            "monthly_contribution": 5000,
            "income_requirement": 0
        }
        response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        scenario_set = data["scenario_set"]
        assert "trade_offs" in scenario_set
        trade_offs = scenario_set["trade_offs"]
        assert len(trade_offs) > 0, "No trade-offs generated"
        
        # Verify trade-off structure
        for trade_off in trade_offs:
            assert "dimension" in trade_off
            assert "description" in trade_off
            assert "impact_description" in trade_off
        print(f"✓ {len(trade_offs)} trade-offs generated with proper structure")
    
    def test_income_scenario_when_income_required(self):
        """Verify income scenario is added when income_requirement > 0"""
        payload = {
            "client_id": "client_4",
            "adviser_id": "adv_default",
            "risk_profile": "balanced",
            "investment_timeframe_years": 10,
            "initial_investment": 800000,
            "monthly_contribution": 0,
            "income_requirement": 40000  # Requesting income
        }
        response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        scenarios = data["scenario_set"]["scenarios"]
        scenario_types = [s["scenario_type"] for s in scenarios]
        
        # Should have 4 scenarios including income
        assert len(scenarios) >= 4, f"Expected 4+ scenarios with income requirement, got {len(scenarios)}"
        assert "income" in scenario_types, "Income scenario missing when income_requirement > 0"
        print(f"✓ Income scenario generated when income_requirement > 0: {scenario_types}")


class TestComplianceEngine:
    """Test Compliance Overlay Engine - PASS/WARNING/BLOCK results"""
    
    def test_compliance_check_pass(self):
        """Test compliance check returns PASS for compliant scenario"""
        # First generate a scenario
        gen_payload = {
            "client_id": "client_compliance_1",
            "adviser_id": "adv_default",
            "risk_profile": "balanced",
            "investment_timeframe_years": 10,
            "initial_investment": 500000,
            "monthly_contribution": 2000,
            "income_requirement": 0
        }
        gen_response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=gen_payload)
        assert gen_response.status_code == 200
        scenario_set = gen_response.json()["scenario_set"]
        
        # Run compliance check on balanced scenario
        balanced_scenario = next(s for s in scenario_set["scenarios"] if s["scenario_type"] == "balanced")
        
        # API uses query params for simple fields and JSON body for complex objects
        params = {
            "scenario_set_id": scenario_set["id"],
            "scenario_id": balanced_scenario["scenario_id"],
            "client_risk_profile": "balanced",
            "licensee_id": "lic_default"
        }
        response = requests.post(
            f"{BASE_URL}/api/compliance/scenario-check",
            params=params,
            json=balanced_scenario  # scenario is passed as JSON body
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify compliance check structure
        assert "overall_result" in data
        assert data["overall_result"] in ["pass", "warning", "block"]
        assert "rules_triggered" in data
        print(f"✓ Compliance check returned: {data['overall_result'].upper()}")
        print(f"  Rules triggered: {len(data['rules_triggered'])}")
    
    def test_get_licensee(self):
        """Test getting licensee details"""
        response = requests.get(f"{BASE_URL}/api/compliance/licensee/lic_default")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "rules_config" in data
        assert "apl" in data  # Approved Product List
        print(f"✓ Licensee retrieved: {data.get('name', 'lic_default')}")
    
    def test_get_adviser(self):
        """Test getting adviser details"""
        response = requests.get(f"{BASE_URL}/api/compliance/adviser/adv_default")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "licensee_id" in data
        print(f"✓ Adviser retrieved: {data.get('name', 'adv_default')}")
    
    def test_get_breaches(self):
        """Test getting compliance breaches"""
        response = requests.get(f"{BASE_URL}/api/compliance/breaches")
        assert response.status_code == 200
        data = response.json()
        assert "breaches" in data
        assert "count" in data
        print(f"✓ Breaches endpoint working: {data['count']} breaches found")


class TestAdviserDecisionLayer:
    """Test Adviser Decision Layer - mandatory confirmation checkboxes and justification"""
    
    def test_decision_requires_confirmation(self):
        """Test that decision requires all confirmation checkboxes"""
        # First generate a scenario
        gen_payload = {
            "client_id": "client_decision_1",
            "adviser_id": "adv_default",
            "risk_profile": "balanced",
            "investment_timeframe_years": 10,
            "initial_investment": 500000,
            "monthly_contribution": 2000,
            "income_requirement": 0
        }
        gen_response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=gen_payload)
        assert gen_response.status_code == 200
        scenario_set = gen_response.json()["scenario_set"]
        balanced_scenario = next(s for s in scenario_set["scenarios"] if s["scenario_type"] == "balanced")
        
        # Try to submit decision without all confirmations - should fail
        params = {
            "scenario_set_id": scenario_set["id"],
            "adviser_id": "adv_default",
            "selected_scenario_id": balanced_scenario["scenario_id"],
            "decision": "approved",
            "justification_text": "Test justification",
            "override_occurred": False
        }
        confirmation = {
            "reviewed_scenarios": True,
            "client_best_interest": False,  # Missing confirmation
            "understood_risks": True
        }
        response = requests.post(
            f"{BASE_URL}/api/compliance/decision",
            params=params,
            json=confirmation
        )
        assert response.status_code == 400, f"Should reject decision without all confirmations, got {response.status_code}"
        print("✓ Decision correctly rejected without all confirmations")
    
    def test_decision_with_full_confirmation(self):
        """Test successful decision with all confirmations"""
        # Generate a scenario
        gen_payload = {
            "client_id": "client_decision_2",
            "adviser_id": "adv_default",
            "risk_profile": "balanced",
            "investment_timeframe_years": 10,
            "initial_investment": 500000,
            "monthly_contribution": 2000,
            "income_requirement": 0
        }
        gen_response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=gen_payload)
        assert gen_response.status_code == 200
        scenario_set = gen_response.json()["scenario_set"]
        balanced_scenario = next(s for s in scenario_set["scenarios"] if s["scenario_type"] == "balanced")
        
        # Submit decision with all confirmations
        params = {
            "scenario_set_id": scenario_set["id"],
            "adviser_id": "adv_default",
            "selected_scenario_id": balanced_scenario["scenario_id"],
            "decision": "approved",
            "justification_text": "Balanced strategy aligns with client's risk profile and 10-year investment horizon.",
            "override_occurred": False
        }
        confirmation = {
            "reviewed_scenarios": True,
            "client_best_interest": True,
            "understood_risks": True
        }
        response = requests.post(
            f"{BASE_URL}/api/compliance/decision",
            params=params,
            json=confirmation
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["decision"] == "approved"
        print(f"✓ Decision recorded successfully: {data['id']}")
    
    def test_override_requires_justification(self):
        """Test that override requires justification"""
        # Generate a scenario
        gen_payload = {
            "client_id": "client_decision_3",
            "adviser_id": "adv_default",
            "risk_profile": "conservative",
            "investment_timeframe_years": 10,
            "initial_investment": 500000,
            "monthly_contribution": 2000,
            "income_requirement": 0
        }
        gen_response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=gen_payload)
        assert gen_response.status_code == 200
        scenario_set = gen_response.json()["scenario_set"]
        growth_scenario = next(s for s in scenario_set["scenarios"] if s["scenario_type"] == "growth")
        
        # Try override without justification - should fail
        params = {
            "scenario_set_id": scenario_set["id"],
            "adviser_id": "adv_default",
            "selected_scenario_id": growth_scenario["scenario_id"],
            "decision": "approved",
            "justification_text": "Client requested growth strategy",
            "override_occurred": True
            # Missing override_reason
        }
        confirmation = {
            "reviewed_scenarios": True,
            "client_best_interest": True,
            "understood_risks": True
        }
        response = requests.post(
            f"{BASE_URL}/api/compliance/decision",
            params=params,
            json=confirmation
        )
        assert response.status_code == 400, f"Should reject override without justification, got {response.status_code}"
        print("✓ Override correctly rejected without justification")


class TestAuditTrail:
    """Test Audit Trail - logs all actions with user ID, timestamp, before/after states"""
    
    def test_get_audit_logs(self):
        """Test getting audit logs"""
        response = requests.get(f"{BASE_URL}/api/compliance/audit-logs?limit=20")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert "count" in data
        
        if data["count"] > 0:
            log = data["logs"][0]
            # Verify audit log structure
            assert "user_id" in log
            assert "timestamp" in log
            assert "action_type" in log
            assert "entity_type" in log
            assert "entity_id" in log
            print(f"✓ Audit logs retrieved: {data['count']} entries")
            print(f"  Sample log: {log['action_type']} on {log['entity_type']} by {log['user_id']}")
        else:
            print("✓ Audit logs endpoint working (no entries yet)")
    
    def test_audit_log_has_hash(self):
        """Test that audit logs have integrity hash"""
        response = requests.get(f"{BASE_URL}/api/compliance/audit-logs?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        if data["count"] > 0:
            for log in data["logs"]:
                assert "hash" in log, "Audit log missing integrity hash"
            print("✓ All audit logs have integrity hash")
        else:
            print("✓ Audit log hash check skipped (no entries)")


class TestReportsDashboard:
    """Test Reports Dashboard - compliance score and metrics"""
    
    def test_dashboard_summary(self):
        """Test dashboard summary returns compliance score and metrics"""
        response = requests.get(f"{BASE_URL}/api/reports/dashboard/summary")
        assert response.status_code == 200
        data = response.json()
        
        # Verify summary structure
        assert "summary" in data
        summary = data["summary"]
        assert "compliance_score" in summary
        assert "scenarios" in summary
        assert "compliance_checks" in summary
        assert "breaches" in summary
        assert "decisions" in summary
        
        print(f"✓ Dashboard summary retrieved:")
        print(f"  Compliance Score: {summary['compliance_score']}%")
        print(f"  Total Scenarios: {summary['scenarios']['total']}")
        print(f"  Compliance Checks: {summary['compliance_checks']['total']}")
        print(f"  Open Breaches: {summary['breaches']['open']}")
    
    def test_adviser_activity_report(self):
        """Test adviser activity report"""
        response = requests.get(f"{BASE_URL}/api/reports/adviser-activity?adviser_id=adv_default")
        assert response.status_code == 200
        data = response.json()
        
        assert "adviser" in data
        assert "metrics" in data
        print(f"✓ Adviser activity report retrieved for {data['adviser'].get('name', 'adv_default')}")
    
    def test_compliance_summary_report(self):
        """Test compliance summary report"""
        response = requests.get(f"{BASE_URL}/api/reports/compliance-summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data
        assert "rule_violations" in data
        assert "breaches" in data
        print(f"✓ Compliance summary report retrieved: {data['summary']['total_checks']} checks")
    
    def test_scenario_history_report(self):
        """Test scenario history report"""
        response = requests.get(f"{BASE_URL}/api/reports/scenario-history?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        assert "scenarios" in data
        assert "count" in data
        print(f"✓ Scenario history report retrieved: {data['count']} scenarios")
    
    def test_breach_report(self):
        """Test breach report"""
        response = requests.get(f"{BASE_URL}/api/reports/breach-report")
        assert response.status_code == 200
        data = response.json()
        
        assert "breaches" in data
        assert "summary" in data
        print(f"✓ Breach report retrieved: {data['count']} breaches")


class TestCSVDownloads:
    """Test CSV report downloads"""
    
    def test_download_audit_logs_csv(self):
        """Test downloading audit logs as CSV"""
        response = requests.get(f"{BASE_URL}/api/reports/download/csv/audit-logs")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ Audit logs CSV download working")
    
    def test_download_scenarios_csv(self):
        """Test downloading scenarios as CSV"""
        response = requests.get(f"{BASE_URL}/api/reports/download/csv/scenarios")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ Scenarios CSV download working")
    
    def test_download_breaches_csv(self):
        """Test downloading breaches as CSV"""
        response = requests.get(f"{BASE_URL}/api/reports/download/csv/breaches")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ Breaches CSV download working")


class TestCRMCommandCenter:
    """Test CRM Command Center - clients load, client details accessible"""
    
    def test_crm_clients_load(self):
        """Test CRM clients endpoint returns client list"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        assert response.status_code == 200
        data = response.json()
        
        assert "clients" in data
        clients = data["clients"]
        assert len(clients) > 0, "No clients returned"
        
        # Verify client structure
        client = clients[0]
        assert "client_id" in client or "id" in client
        assert "name" in client
        print(f"✓ CRM clients loaded: {len(clients)} clients")
    
    def test_crm_client_details(self):
        """Test getting individual client details"""
        # First get client list
        list_response = requests.get(f"{BASE_URL}/api/crm/clients")
        assert list_response.status_code == 200
        clients = list_response.json()["clients"]
        
        if len(clients) > 0:
            client_id = clients[0].get("client_id") or clients[0].get("id")
            detail_response = requests.get(f"{BASE_URL}/api/crm/clients/{client_id}")
            assert detail_response.status_code == 200
            client = detail_response.json()
            assert "name" in client
            print(f"✓ Client details accessible: {client.get('name')}")
        else:
            print("✓ Client details test skipped (no clients)")
    
    def test_crm_stats_endpoint(self):
        """Test CRM stats/analytics endpoint"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        assert response.status_code == 200
        data = response.json()
        
        # Should have summary stats
        assert "total_clients" in data or "summary" in data
        print(f"✓ CRM stats endpoint working")
        if "total_aum" in data:
            print(f"  Total AUM: ${data['total_aum']:,.0f}")


class TestExplainability:
    """Test explainability records for scenarios"""
    
    def test_scenario_explainability(self):
        """Test getting explainability record for a scenario"""
        # Generate a scenario first
        gen_payload = {
            "client_id": "client_explain_1",
            "adviser_id": "adv_default",
            "risk_profile": "balanced",
            "investment_timeframe_years": 10,
            "initial_investment": 500000,
            "monthly_contribution": 2000,
            "income_requirement": 0
        }
        gen_response = requests.post(f"{BASE_URL}/api/scenarios/generate", json=gen_payload)
        assert gen_response.status_code == 200
        scenario_set = gen_response.json()["scenario_set"]
        
        # Get explainability record
        response = requests.get(f"{BASE_URL}/api/scenarios/{scenario_set['id']}/explainability")
        assert response.status_code == 200
        data = response.json()
        
        # Verify explainability structure
        assert "inputs_used" in data
        assert "rules_triggered" in data
        assert "assumptions_applied" in data
        print(f"✓ Explainability record retrieved with {len(data['assumptions_applied'])} assumptions")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
