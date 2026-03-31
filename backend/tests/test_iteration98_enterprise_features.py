"""
AdviceOS Enterprise Features Testing - Iteration 98
====================================================
Testing 4 new enterprise features:
1. Replay Advice - Audit mode with advice reconstruction
2. Cost Reduction Dashboard - ROI calculator with configurable benchmarks
3. Risk & Control Mapping - Matrix AND table view (GRC module)
4. Breach Register - ASIC reporting compliance
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestReplayAdvice:
    """Replay Advice - Full audit replay capability for advice journey"""
    
    def test_get_sessions_list(self):
        """GET /api/replay/sessions - Returns list of advice sessions"""
        response = requests.get(f"{BASE_URL}/api/replay/sessions")
        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert "total" in data
        print(f"PASS: GET /api/replay/sessions - Found {data['total']} sessions")
    
    def test_create_demo_session(self):
        """POST /api/replay/demo/create-sample-session - Creates demo session"""
        response = requests.post(f"{BASE_URL}/api/replay/demo/create-sample-session")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "session_id" in data
        assert data["session_id"].startswith("ADV-DEMO-")
        print(f"PASS: POST /api/replay/demo/create-sample-session - Created {data['session_id']}")
        return data["session_id"]
    
    def test_get_session_details(self):
        """GET /api/replay/session/{session_id} - Returns full session with timeline"""
        # First create a session
        create_resp = requests.post(f"{BASE_URL}/api/replay/demo/create-sample-session")
        session_id = create_resp.json()["session_id"]
        
        # Get session details
        response = requests.get(f"{BASE_URL}/api/replay/session/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert "timeline" in data
        assert "inputs" in data
        assert "scenarios" in data
        assert "decisions" in data
        assert "compliance_checks" in data
        print(f"PASS: GET /api/replay/session/{session_id} - Timeline has {len(data['timeline'])} events")
    
    def test_get_session_timeline(self):
        """GET /api/replay/session/{session_id}/timeline - Returns timeline view"""
        # First create a session
        create_resp = requests.post(f"{BASE_URL}/api/replay/demo/create-sample-session")
        session_id = create_resp.json()["session_id"]
        
        response = requests.get(f"{BASE_URL}/api/replay/session/{session_id}/timeline")
        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == session_id
        assert "timeline" in data
        assert "summary" in data
        print(f"PASS: GET /api/replay/session/{session_id}/timeline - Summary: {data['summary']}")
    
    def test_export_session_json(self):
        """GET /api/replay/session/{session_id}/export - Exports ASIC-ready format (JSON)"""
        # First create a session
        create_resp = requests.post(f"{BASE_URL}/api/replay/demo/create-sample-session")
        session_id = create_resp.json()["session_id"]
        
        response = requests.get(f"{BASE_URL}/api/replay/session/{session_id}/export?format=json")
        assert response.status_code == 200
        data = response.json()
        assert "export_metadata" in data
        assert data["export_metadata"]["export_type"] == "ASIC_ADVICE_RECORD"
        assert "advice_session" in data
        assert "participants" in data
        assert "regulatory_notes" in data
        print(f"PASS: GET /api/replay/session/{session_id}/export - Export ID: {data['export_metadata']['export_id']}")
    
    def test_dashboard_stats(self):
        """GET /api/replay/dashboard/stats - Returns replay statistics"""
        response = requests.get(f"{BASE_URL}/api/replay/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_sessions" in data
        assert "monthly_sessions" in data
        assert "completion_rate" in data
        assert "exports_generated" in data
        print(f"PASS: GET /api/replay/dashboard/stats - Total: {data['total_sessions']}, Completion: {data['completion_rate']}%")
    
    def test_start_new_session(self):
        """POST /api/replay/session/start - Starts a new advice session"""
        payload = {
            "client_id": "TEST-XP-001",
            "client_name": "Test Client",
            "adviser_id": "TEST-ADV001",
            "adviser_name": "Test Adviser",
            "session_type": "scenario_analysis"
        }
        response = requests.post(f"{BASE_URL}/api/replay/session/start", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert data["status"] == "active"
        print(f"PASS: POST /api/replay/session/start - Started {data['session_id']}")
    
    def test_session_not_found(self):
        """GET /api/replay/session/NONEXISTENT - Returns 404"""
        response = requests.get(f"{BASE_URL}/api/replay/session/NONEXISTENT-SESSION")
        assert response.status_code == 404
        print("PASS: GET /api/replay/session/NONEXISTENT - Returns 404")


class TestCostReduction:
    """Cost Reduction Dashboard - ROI calculator with configurable benchmarks"""
    
    def test_get_dashboard(self):
        """GET /api/cost-reduction/dashboard - Returns savings metrics"""
        response = requests.get(f"{BASE_URL}/api/cost-reduction/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "compliance_efficiency" in data
        assert "breakdown_by_type" in data
        assert "adviser_productivity" in data
        assert "audit_readiness" in data
        print(f"PASS: GET /api/cost-reduction/dashboard - Yearly savings: ${data['summary']['yearly_cost_saved_aud']}")
    
    def test_roi_calculator(self):
        """POST /api/cost-reduction/roi-calculator - Calculates ROI with configurable inputs"""
        payload = {
            "num_advisers": 10,
            "files_per_month": 50,
            "compliance_checks_per_month": 200,
            "audits_per_year": 2,
            "current_breach_rate_percent": 5.0
        }
        response = requests.post(f"{BASE_URL}/api/cost-reduction/roi-calculator", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "input_parameters" in data
        assert "current_costs_annual" in data
        assert "with_adviceos_annual" in data
        assert "savings" in data
        assert "summary" in data
        assert data["savings"]["annual_cost_savings_aud"] > 0
        print(f"PASS: POST /api/cost-reduction/roi-calculator - Annual savings: ${data['savings']['annual_cost_savings_aud']}")
    
    def test_live_metrics(self):
        """GET /api/cost-reduction/metrics/live - Returns live savings metrics"""
        response = requests.get(f"{BASE_URL}/api/cost-reduction/metrics/live")
        assert response.status_code == 200
        data = response.json()
        assert "today" in data
        assert "this_week" in data
        assert "updated_at" in data
        print(f"PASS: GET /api/cost-reduction/metrics/live - Today: {data['today']['events_processed']} events")
    
    def test_seed_demo_data(self):
        """POST /api/cost-reduction/demo/seed-data - Seeds demo efficiency data"""
        response = requests.post(f"{BASE_URL}/api/cost-reduction/demo/seed-data")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "events_created" in data
        print(f"PASS: POST /api/cost-reduction/demo/seed-data - Created {data['events_created']} events")
    
    def test_log_efficiency_event(self):
        """POST /api/cost-reduction/log - Logs an efficiency event"""
        payload = {
            "event_type": "file_review",
            "manual_time_hours": 2.5,
            "automated_time_hours": 0.5,
            "adviser_id": "TEST-ADV001",
            "notes": "Test efficiency log"
        }
        response = requests.post(f"{BASE_URL}/api/cost-reduction/log", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "time_saved_hours" in data
        assert "cost_saved_aud" in data
        assert data["time_saved_hours"] == 2.0  # 2.5 - 0.5
        print(f"PASS: POST /api/cost-reduction/log - Saved {data['time_saved_hours']}h, ${data['cost_saved_aud']}")


class TestRiskControlMapping:
    """Risk & Control Mapping - GRC module with matrix and table views"""
    
    def test_get_risks(self):
        """GET /api/risk-control/risks - Returns risk register"""
        response = requests.get(f"{BASE_URL}/api/risk-control/risks")
        assert response.status_code == 200
        data = response.json()
        assert "risks" in data
        assert "total" in data
        assert "by_rating" in data
        print(f"PASS: GET /api/risk-control/risks - Found {data['total']} risks")
    
    def test_get_controls(self):
        """GET /api/risk-control/controls - Returns control register"""
        response = requests.get(f"{BASE_URL}/api/risk-control/controls")
        assert response.status_code == 200
        data = response.json()
        assert "controls" in data
        assert "total" in data
        assert "by_effectiveness" in data
        print(f"PASS: GET /api/risk-control/controls - Found {data['total']} controls")
    
    def test_get_mapping_matrix(self):
        """GET /api/risk-control/mapping/matrix - Returns risk-control matrix"""
        response = requests.get(f"{BASE_URL}/api/risk-control/mapping/matrix")
        assert response.status_code == 200
        data = response.json()
        assert "matrix" in data
        assert "summary" in data
        assert "total_risks" in data["summary"]
        assert "risks_with_controls" in data["summary"]
        print(f"PASS: GET /api/risk-control/mapping/matrix - {data['summary']['risks_with_controls']}/{data['summary']['total_risks']} risks covered")
    
    def test_get_grc_dashboard(self):
        """GET /api/risk-control/dashboard - Returns GRC dashboard"""
        response = requests.get(f"{BASE_URL}/api/risk-control/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "risk_summary" in data
        assert "control_summary" in data
        assert "review_status" in data
        assert "regulatory_alignment" in data
        print(f"PASS: GET /api/risk-control/dashboard - {data['control_summary']['effective_rate']}% controls effective")
    
    def test_seed_demo_data(self):
        """POST /api/risk-control/demo/seed-data - Seeds demo GRC data"""
        response = requests.post(f"{BASE_URL}/api/risk-control/demo/seed-data")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "risks_created" in data
        assert "controls_created" in data
        print(f"PASS: POST /api/risk-control/demo/seed-data - {data['risks_created']} risks, {data['controls_created']} controls")
    
    def test_create_risk(self):
        """POST /api/risk-control/risks - Creates a new risk"""
        payload = {
            "name": "TEST Risk - Data Breach",
            "description": "Test risk for automated testing",
            "category": "technology",
            "likelihood": "possible",
            "impact": "major",
            "risk_owner": "TEST-OWNER-001",
            "risk_owner_name": "Test Owner",
            "regulatory_reference": "CPS 234"
        }
        response = requests.post(f"{BASE_URL}/api/risk-control/risks", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "risk_id" in data
        assert "risk_rating" in data
        print(f"PASS: POST /api/risk-control/risks - Created {data['risk_id']} with rating {data['risk_rating']['rating']}")
    
    def test_create_control(self):
        """POST /api/risk-control/controls - Creates a new control"""
        payload = {
            "name": "TEST Control - Access Management",
            "description": "Test control for automated testing",
            "control_type": "preventive",
            "control_owner": "TEST-CTRL-001",
            "control_owner_name": "Test Control Owner",
            "review_frequency": "quarterly",
            "regulatory_reference": "CPS 234"
        }
        response = requests.post(f"{BASE_URL}/api/risk-control/controls", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "control_id" in data
        print(f"PASS: POST /api/risk-control/controls - Created {data['control_id']}")


class TestBreachRegister:
    """Breach Register - ASIC reporting compliance"""
    
    def test_get_breach_register(self):
        """GET /api/breaches/register - Returns breach list"""
        response = requests.get(f"{BASE_URL}/api/breaches/register")
        assert response.status_code == 200
        data = response.json()
        assert "breaches" in data
        assert "total" in data
        assert "asic_reportable_count" in data
        assert "pending_asic_report" in data
        print(f"PASS: GET /api/breaches/register - Found {data['total']} breaches, {data['asic_reportable_count']} ASIC reportable")
    
    def test_get_breach_dashboard(self):
        """GET /api/breaches/dashboard - Returns breach metrics and ASIC reporting status"""
        response = requests.get(f"{BASE_URL}/api/breaches/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "by_severity" in data
        assert "by_category" in data
        assert "asic_reporting" in data
        assert "remediation" in data
        assert "criteria" in data
        print(f"PASS: GET /api/breaches/dashboard - {data['summary']['total_breaches']} total, {data['asic_reporting']['pending_report']} pending ASIC")
    
    def test_seed_demo_breaches(self):
        """POST /api/breaches/demo/seed-data - Seeds demo breaches"""
        response = requests.post(f"{BASE_URL}/api/breaches/demo/seed-data")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "breaches_created" in data
        print(f"PASS: POST /api/breaches/demo/seed-data - Created {data['breaches_created']} breaches")
    
    def test_register_breach(self):
        """POST /api/breaches/register - Registers a new breach"""
        payload = {
            "title": "TEST Breach - Documentation Gap",
            "description": "Test breach for automated testing",
            "severity": "medium",
            "category": "documentation",
            "adviser_id": "TEST-ADV001",
            "adviser_name": "Test Adviser",
            "identified_by": "test_automation",
            "identified_date": "2026-01-15"
        }
        response = requests.post(f"{BASE_URL}/api/breaches/register", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "breach_id" in data
        assert data["breach_id"].startswith("BRH-")
        assert "asic_reportable" in data
        print(f"PASS: POST /api/breaches/register - Created {data['breach_id']}, ASIC reportable: {data['asic_reportable']}")
        return data["breach_id"]
    
    def test_get_breach_details(self):
        """GET /api/breaches/register/{breach_id} - Returns breach details"""
        # First create a breach
        payload = {
            "title": "TEST Breach for Details",
            "description": "Test breach",
            "severity": "low",
            "category": "other",
            "identified_by": "test",
            "identified_date": "2026-01-15"
        }
        create_resp = requests.post(f"{BASE_URL}/api/breaches/register", json=payload)
        breach_id = create_resp.json()["breach_id"]
        
        response = requests.get(f"{BASE_URL}/api/breaches/register/{breach_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == breach_id
        assert "timeline" in data
        print(f"PASS: GET /api/breaches/register/{breach_id} - Timeline has {len(data['timeline'])} events")
    
    def test_update_breach(self):
        """POST /api/breaches/register/{breach_id}/update - Updates breach status"""
        # First create a breach
        payload = {
            "title": "TEST Breach for Update",
            "description": "Test breach",
            "severity": "medium",
            "category": "documentation",
            "identified_by": "test",
            "identified_date": "2026-01-15"
        }
        create_resp = requests.post(f"{BASE_URL}/api/breaches/register", json=payload)
        breach_id = create_resp.json()["breach_id"]
        
        # Update the breach
        update_payload = {
            "status": "investigating",
            "update_notes": "Investigation started by test automation",
            "updated_by": "test_automation"
        }
        response = requests.post(f"{BASE_URL}/api/breaches/register/{breach_id}/update", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert data["new_status"] == "investigating"
        print(f"PASS: POST /api/breaches/register/{breach_id}/update - Status: {data['new_status']}")
    
    def test_regulatory_report(self):
        """GET /api/breaches/report/regulatory - Generates regulatory breach report"""
        response = requests.get(f"{BASE_URL}/api/breaches/report/regulatory")
        assert response.status_code == 200
        data = response.json()
        assert "report_id" in data
        assert "report_type" in data
        assert data["report_type"] == "breach_register_summary"
        assert "summary" in data
        assert "certification" in data
        print(f"PASS: GET /api/breaches/report/regulatory - Report ID: {data['report_id']}")
    
    def test_breach_not_found(self):
        """GET /api/breaches/register/NONEXISTENT - Returns 404"""
        response = requests.get(f"{BASE_URL}/api/breaches/register/NONEXISTENT-BREACH")
        assert response.status_code == 404
        print("PASS: GET /api/breaches/register/NONEXISTENT - Returns 404")


class TestHealthCheck:
    """Verify new routes are registered in health check"""
    
    def test_health_check(self):
        """GET /api/health - Verify server is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"PASS: GET /api/health - Server healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
