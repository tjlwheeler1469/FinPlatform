"""
Test Suite for Iteration 44: Security, Compliance & Scenario Simulator Features
Tests: 2FA/MFA, SOC2 Audit Logging, Enhanced Scenario Simulator
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://advisor-platform-15.preview.emergentagent.com')

class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        """Test /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")


class TestMFASetup:
    """Test 2FA/MFA Setup endpoints"""
    
    def test_mfa_setup_returns_totp_secret(self):
        """Test /api/mfa/setup returns TOTP secret and QR code data"""
        response = requests.post(f"{BASE_URL}/api/mfa/setup", json={
            "user_id": "user_001",
            "user_email": "advisor@wealthcommand.com"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify TOTP secret is returned
        assert "secret" in data, "Missing 'secret' in response"
        assert len(data["secret"]) > 0, "Secret should not be empty"
        
        # Verify QR code data is returned
        assert "qr_code_data" in data or "provisioning_uri" in data, "Missing QR code data"
        
        # Verify backup codes are returned
        assert "backup_codes" in data, "Missing 'backup_codes' in response"
        assert len(data["backup_codes"]) > 0, "Backup codes should not be empty"
        
        print(f"✓ MFA Setup passed: secret={data['secret'][:8]}..., backup_codes={len(data['backup_codes'])}")
    
    def test_mfa_status_returns_configuration(self):
        """Test /api/mfa/status/{user_id} returns MFA configuration"""
        user_id = "user_001"
        response = requests.get(f"{BASE_URL}/api/mfa/status/{user_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields
        assert "user_id" in data, "Missing 'user_id' in response"
        assert "mfa_enabled" in data, "Missing 'mfa_enabled' in response"
        assert "totp_configured" in data, "Missing 'totp_configured' in response"
        assert "backup_codes_remaining" in data, "Missing 'backup_codes_remaining' in response"
        
        print(f"✓ MFA Status passed: user_id={data['user_id']}, mfa_enabled={data['mfa_enabled']}")
    
    def test_mfa_verify_totp_invalid_code(self):
        """Test /api/mfa/verify-totp with invalid code returns error"""
        response = requests.post(f"{BASE_URL}/api/mfa/verify-totp", json={
            "user_id": "user_001",
            "code": "000000"  # Invalid code
        })
        # Should return 200 with success=false or 400
        assert response.status_code in [200, 400]
        data = response.json()
        
        if response.status_code == 200:
            assert data.get("success") == False or "error" in data
        print(f"✓ MFA Verify TOTP (invalid code) handled correctly")
    
    def test_mfa_send_sms_code(self):
        """Test /api/mfa/send-sms sends SMS code (MOCKED)"""
        response = requests.post(f"{BASE_URL}/api/mfa/send-sms", json={
            "user_id": "user_001",
            "phone_number": "+61400000000"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data, "Missing 'success' in response"
        assert data["success"] == True, "SMS send should succeed"
        
        # Demo code should be returned (MOCKED)
        if "demo_code" in data:
            print(f"✓ SMS Code sent (MOCKED): demo_code={data['demo_code']}")
        else:
            print(f"✓ SMS Code sent: message={data.get('message', 'sent')}")


class TestAuditLogging:
    """Test SOC2 Compliance Audit Logging endpoints"""
    
    def test_audit_logs_returns_entries(self):
        """Test /api/audit/logs returns audit trail entries"""
        response = requests.get(f"{BASE_URL}/api/audit/logs", params={"limit": 20})
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "logs" in data, "Missing 'logs' in response"
        assert "total" in data, "Missing 'total' in response"
        assert isinstance(data["logs"], list), "logs should be a list"
        
        # Verify log entry structure if logs exist
        if len(data["logs"]) > 0:
            log = data["logs"][0]
            assert "event_id" in log, "Missing 'event_id' in log entry"
            assert "timestamp" in log, "Missing 'timestamp' in log entry"
            assert "event_type" in log, "Missing 'event_type' in log entry"
            assert "user_id" in log, "Missing 'user_id' in log entry"
            assert "risk_level" in log, "Missing 'risk_level' in log entry"
        
        print(f"✓ Audit Logs passed: total={data['total']}, returned={len(data['logs'])}")
    
    def test_audit_logs_filter_by_user(self):
        """Test /api/audit/logs with user_id filter"""
        response = requests.get(f"{BASE_URL}/api/audit/logs", params={
            "user_id": "user_001",
            "limit": 10
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        # All logs should be for the specified user
        for log in data["logs"]:
            assert log["user_id"] == "user_001", f"Log user_id mismatch: {log['user_id']}"
        
        print(f"✓ Audit Logs filter by user passed: {len(data['logs'])} logs for user_001")
    
    def test_compliance_report_returns_soc2_data(self):
        """Test /api/audit/compliance-report returns SOC2 compliance data"""
        response = requests.get(f"{BASE_URL}/api/audit/compliance-report")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required sections
        assert "report_generated_at" in data, "Missing 'report_generated_at'"
        assert "summary" in data, "Missing 'summary' section"
        assert "authentication_metrics" in data, "Missing 'authentication_metrics' section"
        assert "compliance_status" in data, "Missing 'compliance_status' section"
        
        # Verify summary fields
        summary = data["summary"]
        assert "total_events" in summary, "Missing 'total_events' in summary"
        assert "unique_users" in summary, "Missing 'unique_users' in summary"
        assert "high_risk_events" in summary, "Missing 'high_risk_events' in summary"
        
        # Verify compliance status fields
        compliance = data["compliance_status"]
        assert "audit_logging" in compliance, "Missing 'audit_logging' in compliance_status"
        assert "mfa_available" in compliance, "Missing 'mfa_available' in compliance_status"
        assert "encryption_at_rest" in compliance, "Missing 'encryption_at_rest' in compliance_status"
        
        print(f"✓ Compliance Report passed: total_events={summary['total_events']}, compliance_status={compliance}")
    
    def test_audit_log_event(self):
        """Test /api/audit/log creates audit entry"""
        response = requests.post(f"{BASE_URL}/api/audit/log", json={
            "event_type": "auth.login.success",
            "user_id": "user_001",
            "resource_id": None,
            "resource_type": None,
            "details": {"method": "password", "test": True},
            "ip_address": "192.168.1.100",
            "risk_level": "low"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "success" in data, "Missing 'success' in response"
        assert data["success"] == True, "Audit log should succeed"
        assert "event_id" in data, "Missing 'event_id' in response"
        
        print(f"✓ Audit Log Event created: event_id={data['event_id']}")
    
    def test_security_alerts(self):
        """Test /api/audit/alerts returns security alerts"""
        response = requests.get(f"{BASE_URL}/api/audit/alerts")
        assert response.status_code == 200
        data = response.json()
        
        assert "alerts" in data, "Missing 'alerts' in response"
        assert "total" in data, "Missing 'total' in response"
        assert "open_count" in data, "Missing 'open_count' in response"
        
        print(f"✓ Security Alerts passed: total={data['total']}, open={data['open_count']}")


class TestScenarioSimulator:
    """Test Enhanced Scenario Simulator with Monte Carlo"""
    
    def test_scenario_simulate_monte_carlo(self):
        """Test /api/scenarios/simulate runs Monte Carlo simulation"""
        response = requests.post(f"{BASE_URL}/api/scenarios/simulate", json={
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "current_savings": 200000,
            "annual_income": 185000,
            "annual_expenses": 100000,
            "savings_rate": 0.20,
            "current_super": 580000,
            "employer_super_rate": 0.115,
            "investment_return": 0.07,
            "inflation_rate": 0.025,
            "property_value": 1200000,
            "property_growth": 0.04,
            "debt_balance": 512000,
            "debt_interest_rate": 0.0619,
            "debt_repayment_monthly": 3850,
            "risk_profile": "moderate"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify scenario_id
        assert "scenario_id" in data, "Missing 'scenario_id'"
        
        # Verify inputs are echoed back
        assert "inputs" in data, "Missing 'inputs' section"
        assert data["inputs"]["current_age"] == 45
        assert data["inputs"]["retirement_age"] == 65
        
        # Verify results section
        assert "results" in data, "Missing 'results' section"
        results = data["results"]
        assert "success_probability" in results, "Missing 'success_probability'"
        assert "retirement_wealth" in results, "Missing 'retirement_wealth'"
        assert "annual_retirement_income" in results, "Missing 'annual_retirement_income'"
        assert "years_to_retirement" in results, "Missing 'years_to_retirement'"
        
        # Verify projections
        assert "projections" in data, "Missing 'projections' section"
        assert len(data["projections"]) > 0, "Projections should not be empty"
        
        # Verify milestones
        assert "milestones" in data, "Missing 'milestones' section"
        
        # Verify analysis
        assert "analysis" in data, "Missing 'analysis' section"
        assert "status" in data["analysis"], "Missing 'status' in analysis"
        
        print(f"✓ Scenario Simulate passed: success_probability={results['success_probability']}%, retirement_wealth=${results['retirement_wealth']:,.0f}")
    
    def test_scenario_presets_returns_templates(self):
        """Test /api/scenarios/presets returns quick scenario templates"""
        response = requests.get(f"{BASE_URL}/api/scenarios/presets")
        assert response.status_code == 200
        data = response.json()
        
        # Verify presets structure
        assert "presets" in data, "Missing 'presets' in response"
        assert "count" in data, "Missing 'count' in response"
        
        presets = data["presets"]
        assert len(presets) > 0, "Presets should not be empty"
        
        # Verify preset structure
        expected_presets = ["retire_early", "retire_late", "increase_savings", "conservative_returns", "aggressive_growth"]
        for preset_key in expected_presets:
            if preset_key in presets:
                preset = presets[preset_key]
                assert "name" in preset, f"Missing 'name' in preset {preset_key}"
                assert "description" in preset, f"Missing 'description' in preset {preset_key}"
                assert "changes" in preset, f"Missing 'changes' in preset {preset_key}"
        
        print(f"✓ Scenario Presets passed: count={data['count']}, presets={list(presets.keys())}")
    
    def test_scenario_compare(self):
        """Test /api/scenarios/compare compares multiple scenarios"""
        response = requests.post(f"{BASE_URL}/api/scenarios/compare", json={
            "scenarios": [
                {
                    "scenario_id": "scenario_1",
                    "name": "Conservative",
                    "results": {
                        "success_probability": 75,
                        "retirement_wealth": 1500000,
                        "annual_retirement_income": 60000
                    }
                },
                {
                    "scenario_id": "scenario_2",
                    "name": "Aggressive",
                    "results": {
                        "success_probability": 85,
                        "retirement_wealth": 2000000,
                        "annual_retirement_income": 80000
                    }
                }
            ]
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify comparison structure
        assert "scenarios" in data, "Missing 'scenarios' in response"
        assert "best_scenario" in data, "Missing 'best_scenario' in response"
        assert "worst_scenario" in data, "Missing 'worst_scenario' in response"
        
        print(f"✓ Scenario Compare passed: best={data['best_scenario']['name']}, worst={data['worst_scenario']['name']}")
    
    def test_scenario_what_if(self):
        """Test /api/scenarios/what-if calculates impact of changes"""
        response = requests.post(f"{BASE_URL}/api/scenarios/what-if", json={
            "base_scenario": {
                "inputs": {
                    "current_age": 45,
                    "retirement_age": 65,
                    "life_expectancy": 90,
                    "current_savings": 200000,
                    "annual_income": 185000,
                    "annual_expenses": 100000,
                    "savings_rate": 0.20,
                    "current_super": 580000,
                    "risk_profile": "moderate"
                },
                "results": {
                    "success_probability": 80,
                    "retirement_wealth": 1800000,
                    "annual_retirement_income": 72000
                }
            },
            "changes": {
                "savings_rate": 0.25
            }
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify what-if structure
        assert "base_scenario" in data, "Missing 'base_scenario'"
        assert "new_scenario" in data, "Missing 'new_scenario'"
        assert "impact" in data, "Missing 'impact'"
        
        # Verify impact calculations
        impact = data["impact"]
        assert "success_probability_change" in impact, "Missing 'success_probability_change'"
        assert "retirement_wealth_change" in impact, "Missing 'retirement_wealth_change'"
        
        print(f"✓ Scenario What-If passed: probability_change={impact['success_probability_change']}, wealth_change=${impact['retirement_wealth_change']:,.0f}")


class TestExistingFeatures:
    """Test existing features still work (regression tests)"""
    
    def test_documents_list(self):
        """Test /api/documents returns documents list"""
        response = requests.get(f"{BASE_URL}/api/documents")
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data or isinstance(data, list)
        print(f"✓ Documents list passed")
    
    def test_accounts_aggregated(self):
        """Test /api/accounts/aggregated returns accounts (MOCKED)"""
        response = requests.get(f"{BASE_URL}/api/accounts/aggregated")
        assert response.status_code == 200
        data = response.json()
        assert "accounts" in data or "summary" in data
        print(f"✓ Accounts aggregated passed (MOCKED)")
    
    def test_copilot_suggestions(self):
        """Test /api/copilot/suggestions returns suggestions"""
        response = requests.get(f"{BASE_URL}/api/copilot/suggestions")
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data or isinstance(data, list)
        print(f"✓ Copilot suggestions passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
