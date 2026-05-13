"""
Test Suite for Iteration 50 - UX Improvements
Tests for:
1. Client Wealth page - /api/wealth/overview
2. AI Insights page - /api/copilot/todays-insights
3. Compliance page - /api/compliance/check, /api/compliance/dashboard
4. Account Aggregation - /api/aggregation/accounts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestWealthOverviewAPI:
    """Tests for /api/wealth/overview endpoint"""
    
    def test_wealth_overview_returns_200(self):
        """Test wealth overview endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        assert response.status_code == 200
        
    def test_wealth_overview_has_summary(self):
        """Test wealth overview contains summary data"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        data = response.json()
        
        assert "summary" in data
        assert "total_assets" in data["summary"]
        assert "total_liabilities" in data["summary"]
        assert "net_worth" in data["summary"]
        assert data["summary"]["net_worth"] > 0
        
    def test_wealth_overview_has_asset_allocation(self):
        """Test wealth overview contains asset allocation"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        data = response.json()
        
        assert "asset_allocation" in data
        assert "cash" in data["asset_allocation"]
        assert "shares" in data["asset_allocation"]
        assert "property" in data["asset_allocation"]
        assert "super" in data["asset_allocation"]
        
    def test_wealth_overview_has_shares_with_buy_sell_data(self):
        """Test wealth overview contains shares data for buy/sell functionality"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        data = response.json()
        
        assert "shares" in data
        assert "holdings" in data["shares"]
        assert len(data["shares"]["holdings"]) > 0
        
        # Check first holding has required fields for buy/sell
        holding = data["shares"]["holdings"][0]
        assert "ticker" in holding
        assert "name" in holding
        assert "units" in holding
        assert "current_price" in holding
        assert "value" in holding
        
    def test_wealth_overview_has_property_data(self):
        """Test wealth overview contains property data"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        data = response.json()
        
        assert "property" in data
        assert "properties" in data["property"]
        assert len(data["property"]["properties"]) > 0
        
    def test_wealth_overview_has_super_data(self):
        """Test wealth overview contains super data"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        data = response.json()
        
        assert "super" in data
        assert "funds" in data["super"]
        assert "contributions_ytd" in data["super"]
        
    def test_wealth_overview_has_crypto_data(self):
        """Test wealth overview contains crypto data"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        data = response.json()
        
        assert "crypto" in data
        assert "holdings" in data["crypto"]


class TestWealthPerformanceAPI:
    """Tests for /api/wealth/performance endpoint"""
    
    def test_wealth_performance_returns_200(self):
        """Test wealth performance endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/wealth/performance/client_1")
        assert response.status_code == 200
        
    def test_wealth_performance_has_data_points(self):
        """Test wealth performance contains data points"""
        response = requests.get(f"{BASE_URL}/api/wealth/performance/client_1")
        data = response.json()
        
        assert "data_points" in data
        assert len(data["data_points"]) > 0
        assert "summary" in data


class TestWealthIncomeAPI:
    """Tests for /api/wealth/income endpoint"""
    
    def test_wealth_income_returns_200(self):
        """Test wealth income endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/wealth/income/client_1")
        assert response.status_code == 200
        
    def test_wealth_income_has_summary(self):
        """Test wealth income contains income summary"""
        response = requests.get(f"{BASE_URL}/api/wealth/income/client_1")
        data = response.json()
        
        assert "income_summary" in data
        assert "dividends" in data["income_summary"]
        assert "interest" in data["income_summary"]
        assert "rental_income" in data["income_summary"]


class TestWealthRebalanceAPI:
    """Tests for /api/wealth/rebalance endpoint"""
    
    def test_wealth_rebalance_returns_200(self):
        """Test wealth rebalance endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/wealth/rebalance/client_1")
        assert response.status_code == 200
        
    def test_wealth_rebalance_has_recommendations(self):
        """Test wealth rebalance contains recommendations"""
        response = requests.get(f"{BASE_URL}/api/wealth/rebalance/client_1")
        data = response.json()
        
        assert "recommendations" in data
        assert "current_allocation" in data
        assert "target_allocation" in data


class TestComplianceCheckAPI:
    """Tests for /api/compliance/check endpoint"""
    
    def test_compliance_check_returns_200(self):
        """Test compliance check endpoint returns 200"""
        response = requests.post(f"{BASE_URL}/api/compliance/check?client_id=client_1&check_type=full")
        assert response.status_code == 200
        
    def test_compliance_check_has_checks(self):
        """Test compliance check contains all required checks"""
        response = requests.post(f"{BASE_URL}/api/compliance/check?client_id=client_1&check_type=full")
        data = response.json()
        
        assert "checks" in data
        assert "kyc_status" in data["checks"]
        assert "risk_profile" in data["checks"]
        assert "suitability" in data["checks"]
        assert "fee_disclosure" in data["checks"]
        assert "aml_check" in data["checks"]
        
    def test_compliance_check_has_score(self):
        """Test compliance check contains score"""
        response = requests.post(f"{BASE_URL}/api/compliance/check?client_id=client_1&check_type=full")
        data = response.json()
        
        assert "score" in data
        assert "overall_status" in data
        assert data["score"] >= 0 and data["score"] <= 100


class TestComplianceDashboardAPI:
    """Tests for /api/compliance/dashboard endpoint"""
    
    def test_compliance_dashboard_returns_200(self):
        """Test compliance dashboard endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/compliance/dashboard")
        assert response.status_code == 200
        
    def test_compliance_dashboard_has_overview(self):
        """Test compliance dashboard contains overview"""
        response = requests.get(f"{BASE_URL}/api/compliance/dashboard")
        data = response.json()
        
        assert "overview" in data
        assert "total_clients" in data["overview"]
        assert "compliant" in data["overview"]
        assert "compliance_rate" in data["overview"]
        
    def test_compliance_dashboard_has_upcoming_reviews(self):
        """Test compliance dashboard contains upcoming reviews"""
        response = requests.get(f"{BASE_URL}/api/compliance/dashboard")
        data = response.json()
        
        assert "upcoming_reviews" in data
        assert len(data["upcoming_reviews"]) > 0
        
    def test_compliance_dashboard_has_risk_alerts(self):
        """Test compliance dashboard contains risk alerts"""
        response = requests.get(f"{BASE_URL}/api/compliance/dashboard")
        data = response.json()
        
        assert "risk_alerts" in data


class TestCopilotTodaysInsightsAPI:
    """Tests for /api/copilot/todays-insights endpoint"""
    
    def test_todays_insights_returns_200(self):
        """Test today's insights endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/copilot/todays-insights")
        assert response.status_code == 200
        
    def test_todays_insights_has_insights(self):
        """Test today's insights contains insights array"""
        response = requests.get(f"{BASE_URL}/api/copilot/todays-insights")
        data = response.json()
        
        assert "insights" in data
        assert len(data["insights"]) > 0
        
    def test_todays_insights_has_required_fields(self):
        """Test each insight has required fields"""
        response = requests.get(f"{BASE_URL}/api/copilot/todays-insights")
        data = response.json()
        
        for insight in data["insights"]:
            assert "type" in insight
            assert "priority" in insight
            assert "title" in insight
            assert "description" in insight
            assert "action" in insight
            
    def test_todays_insights_has_summary(self):
        """Test today's insights contains summary counts"""
        response = requests.get(f"{BASE_URL}/api/copilot/todays-insights")
        data = response.json()
        
        assert "total_insights" in data
        assert "critical_count" in data


class TestAggregationAccountsAPI:
    """Tests for /api/aggregation/accounts endpoint"""
    
    def test_aggregation_accounts_returns_200(self):
        """Test aggregation accounts endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/aggregation/accounts")
        assert response.status_code == 200
        
    def test_aggregation_accounts_has_summary(self):
        """Test aggregation accounts contains summary"""
        response = requests.get(f"{BASE_URL}/api/aggregation/accounts")
        data = response.json()
        
        assert "accounts" in data
        assert "summary" in data
        assert "total_balance" in data["summary"]


class TestAggregationInstitutionsAPI:
    """Tests for /api/aggregation/institutions endpoint"""
    
    def test_aggregation_institutions_returns_200(self):
        """Test aggregation institutions endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/aggregation/institutions")
        assert response.status_code == 200
        
    def test_aggregation_institutions_has_banks(self):
        """Test aggregation institutions contains Australian banks"""
        response = requests.get(f"{BASE_URL}/api/aggregation/institutions")
        data = response.json()
        
        assert "institutions" in data
        assert len(data["institutions"]) > 0
        
        # Check for major Australian banks
        institution_ids = [i["id"] for i in data["institutions"]]
        assert "cba" in institution_ids
        assert "westpac" in institution_ids
        assert "nab" in institution_ids
        assert "anz" in institution_ids


class TestComplianceSOAAPI:
    """Tests for /api/compliance/soa endpoints"""
    
    def test_soa_generate_returns_200(self):
        """Test SOA generation endpoint returns 200"""
        payload = {
            "client_id": "client_1",
            "client_name": "Test Client",
            "advice_type": "investment",
            "recommendations": [
                {"title": "Increase super contributions", "summary": "Maximize tax benefits"}
            ],
            "risk_profile": "balanced",
            "goals": ["Retirement", "Wealth building"],
            "current_situation": {
                "personal": {"age": 45},
                "financial": {"net_worth": 500000}
            }
        }
        response = requests.post(f"{BASE_URL}/api/compliance/soa/generate", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert data["success"]
        assert "soa_id" in data


class TestComplianceAuditLogAPI:
    """Tests for /api/compliance/audit-log endpoints"""
    
    def test_audit_log_create_returns_200(self):
        """Test audit log creation endpoint returns 200"""
        payload = {
            "client_id": "client_1",
            "action_type": "advice_given",
            "description": "Test audit log entry"
        }
        response = requests.post(f"{BASE_URL}/api/compliance/audit-log", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert data["success"]
        
    def test_audit_log_get_returns_200(self):
        """Test audit log retrieval endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/compliance/audit-log/client_1")
        assert response.status_code == 200
        
        data = response.json()
        assert "logs" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
