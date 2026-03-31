"""
Test Suite for Wealth Command Super App Features - Iteration 49
Tests: AI Meeting Prep, Stock Research, Compliance Center, Wealth Dashboard
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAIMeetingPrep:
    """AI Meeting Prep - 30-second client briefings"""
    
    def test_generate_meeting_prep(self):
        """Test POST /api/meeting-prep/generate"""
        payload = {
            "client_id": "test_client_1",
            "client_name": "John Smith",
            "meeting_type": "review",
            "portfolio_value": 1000000,
            "ytd_return": 0.08,
            "retirement_probability": 75,
            "risk_profile": "balanced",
            "age": 45,
            "retirement_age": 65
        }
        response = requests.post(f"{BASE_URL}/api/meeting-prep/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["client_id"] == "test_client_1"
        assert data["client_name"] == "John Smith"
        assert "client_snapshot" in data
        assert "portfolio_insights" in data
        assert "risk_alerts" in data
        assert "talking_points" in data
        assert "action_items" in data
        assert "quick_stats" in data
        assert "compliance" in data
        
        # Verify client snapshot
        snapshot = data["client_snapshot"]
        assert snapshot["portfolio_value"] == 1000000
        assert snapshot["ytd_return"] == 0.08
        assert snapshot["retirement_probability"] == 75
    
    def test_meeting_prep_with_minimal_data(self):
        """Test meeting prep with only required fields"""
        payload = {"client_id": "minimal_client"}
        response = requests.post(f"{BASE_URL}/api/meeting-prep/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["client_id"] == "minimal_client"
        assert "portfolio_insights" in data


class TestStockResearch:
    """Stock Research & Screener - ASX stocks with moat analysis"""
    
    def test_stock_screener_basic(self):
        """Test POST /api/research/screener with basic filters"""
        payload = {"limit": 10}
        response = requests.post(f"{BASE_URL}/api/research/screener", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "stocks" in data
        assert "total" in data
        assert "sectors_available" in data
        assert len(data["stocks"]) <= 10
        
        # Verify stock structure
        if data["stocks"]:
            stock = data["stocks"][0]
            assert "ticker" in stock
            assert "name" in stock
            assert "sector" in stock
            assert "market_cap" in stock
            assert "pe" in stock
            assert "dividend_yield" in stock
            assert "moat" in stock
    
    def test_stock_screener_sector_filter(self):
        """Test screener with sector filter"""
        payload = {"sectors": ["Financials"], "limit": 5}
        response = requests.post(f"{BASE_URL}/api/research/screener", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # All stocks should be in Financials sector
        for stock in data["stocks"]:
            assert stock["sector"] == "Financials"
    
    def test_stock_screener_moat_filter(self):
        """Test screener with moat rating filter"""
        payload = {"moat_rating": ["wide"], "limit": 10}
        response = requests.post(f"{BASE_URL}/api/research/screener", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        for stock in data["stocks"]:
            assert stock["moat"] == "wide"
    
    def test_get_stock_details(self):
        """Test GET /api/research/stock/{ticker}"""
        response = requests.get(f"{BASE_URL}/api/research/stock/BHP")
        assert response.status_code == 200
        data = response.json()
        
        assert data["ticker"] == "BHP"
        assert data["name"] == "BHP Group"
        assert "intrinsic_value" in data
        assert "margin_of_safety" in data
        assert "valuation" in data
        assert "moat_analysis" in data
        assert "analyst_consensus" in data
        assert "key_metrics" in data
    
    def test_get_stock_details_not_found(self):
        """Test stock details for non-existent ticker"""
        response = requests.get(f"{BASE_URL}/api/research/stock/INVALID")
        assert response.status_code == 404
    
    def test_intrinsic_values(self):
        """Test GET /api/research/intrinsic-values"""
        response = requests.get(f"{BASE_URL}/api/research/intrinsic-values")
        assert response.status_code == 200
        data = response.json()
        
        assert "stocks" in data
        assert "total" in data
        assert "average_margin" in data
        
        if data["stocks"]:
            stock = data["stocks"][0]
            assert "ticker" in stock
            assert "intrinsic_value" in stock
            assert "margin_of_safety" in stock
    
    def test_dividend_calendar(self):
        """Test GET /api/research/dividends/calendar"""
        response = requests.get(f"{BASE_URL}/api/research/dividends/calendar")
        assert response.status_code == 200
        data = response.json()
        
        assert "month" in data
        assert "year" in data
        assert "dividends" in data
        assert "total_companies" in data
        
        if data["dividends"]:
            dividend = data["dividends"][0]
            assert "ticker" in dividend
            assert "ex_dividend_date" in dividend
            assert "payment_date" in dividend
            assert "dividend_per_share" in dividend
            assert "franking" in dividend
    
    def test_market_alerts(self):
        """Test GET /api/research/market-alerts"""
        response = requests.get(f"{BASE_URL}/api/research/market-alerts")
        assert response.status_code == 200
        data = response.json()
        
        assert "alerts" in data
        assert "unread_count" in data
        
        if data["alerts"]:
            alert = data["alerts"][0]
            assert "id" in alert
            assert "type" in alert
            assert "severity" in alert
            assert "title" in alert
            assert "message" in alert
    
    def test_sector_breakdown(self):
        """Test GET /api/research/sectors"""
        response = requests.get(f"{BASE_URL}/api/research/sectors")
        assert response.status_code == 200
        data = response.json()
        
        assert "sectors" in data
        assert "total_market_cap" in data
        
        if data["sectors"]:
            sector = data["sectors"][0]
            assert "sector" in sector
            assert "stock_count" in sector
            assert "total_market_cap" in sector
            assert "avg_pe" in sector
            assert "avg_dividend_yield" in sector


class TestComplianceCenter:
    """Compliance Center - Audit trails, SOA generation, regulatory compliance"""
    
    def test_compliance_dashboard(self):
        """Test GET /api/compliance/dashboard"""
        response = requests.get(f"{BASE_URL}/api/compliance/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        assert "overview" in data
        assert "upcoming_reviews" in data
        assert "recent_activity" in data
        assert "risk_alerts" in data
        assert "metrics" in data
        
        # Verify overview structure
        overview = data["overview"]
        assert "total_clients" in overview
        assert "compliant" in overview
        assert "action_required" in overview
        assert "compliance_rate" in overview
    
    def test_compliance_check(self):
        """Test POST /api/compliance/check"""
        response = requests.post(f"{BASE_URL}/api/compliance/check?client_id=client_1&check_type=full")
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["client_id"] == "client_1"
        assert "overall_status" in data
        assert "score" in data
        assert "checks" in data
        
        # Verify checks structure
        checks = data["checks"]
        assert "kyc_status" in checks
        assert "risk_profile" in checks
        assert "suitability" in checks
        assert "fee_disclosure" in checks
        assert "aml_check" in checks
    
    def test_soa_generation(self):
        """Test POST /api/compliance/soa/generate"""
        payload = {
            "client_id": "test_client_soa",
            "client_name": "Test Client",
            "advice_type": "comprehensive",
            "recommendations": [
                {"title": "Increase super contributions", "summary": "Max concessional cap", "implementation_cost": 0, "ongoing_fee": 0}
            ],
            "risk_profile": "balanced",
            "goals": ["Retirement", "Education funding"],
            "current_situation": {
                "personal": {"age": 45, "occupation": "Professional"},
                "financial": {"income": 150000, "expenses": 100000}
            }
        }
        response = requests.post(f"{BASE_URL}/api/compliance/soa/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "soa_id" in data
        assert "soa" in data
        
        soa = data["soa"]
        assert soa["client_id"] == "test_client_soa"
        assert soa["client_name"] == "Test Client"
        assert "sections" in soa
        assert "compliance_checks" in soa
    
    def test_audit_log_creation(self):
        """Test POST /api/compliance/audit-log"""
        payload = {
            "client_id": "test_client_audit",
            "action_type": "advice_given",
            "description": "Test audit log entry",
            "advisor_id": "advisor_1"
        }
        response = requests.post(f"{BASE_URL}/api/compliance/audit-log", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "log_id" in data
    
    def test_get_audit_logs(self):
        """Test GET /api/compliance/audit-log/{client_id}"""
        # First create an audit log
        payload = {
            "client_id": "test_audit_client",
            "action_type": "document_signed",
            "description": "Test document signed"
        }
        requests.post(f"{BASE_URL}/api/compliance/audit-log", json=payload)
        
        # Then retrieve logs
        response = requests.get(f"{BASE_URL}/api/compliance/audit-log/test_audit_client")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "test_audit_client"
        assert "logs" in data
        assert "total" in data


class TestWealthDashboard:
    """Wealth Dashboard - Comprehensive wealth tracking across all asset classes"""
    
    def test_wealth_overview(self):
        """Test GET /api/wealth/overview/{client_id}"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "summary" in data
        assert "asset_allocation" in data
        assert "cash" in data
        assert "shares" in data
        assert "etfs" in data
        assert "managed_funds" in data
        assert "property" in data
        assert "super" in data
        assert "crypto" in data
        
        # Verify summary structure
        summary = data["summary"]
        assert "total_assets" in summary
        assert "total_liabilities" in summary
        assert "net_worth" in summary
        assert "net_worth_change_ytd" in summary
        
        # Verify asset allocation
        allocation = data["asset_allocation"]
        assert "cash" in allocation
        assert "shares" in allocation
        assert "property" in allocation
        assert "super" in allocation
    
    def test_wealth_performance(self):
        """Test GET /api/wealth/performance/{client_id}"""
        response = requests.get(f"{BASE_URL}/api/wealth/performance/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "period" in data
        assert "data_points" in data
        assert "summary" in data
        
        # Verify data points structure
        if data["data_points"]:
            point = data["data_points"][0]
            assert "date" in point
            assert "value" in point
        
        # Verify summary
        summary = data["summary"]
        assert "start_value" in summary
        assert "end_value" in summary
        assert "percentage_return" in summary
    
    def test_wealth_income(self):
        """Test GET /api/wealth/income/{client_id}"""
        response = requests.get(f"{BASE_URL}/api/wealth/income/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "income_summary" in data
        assert "total_passive_income" in data
        
        income = data["income_summary"]
        assert "dividends" in income
        assert "interest" in income
        assert "rental_income" in income
        assert "distributions" in income
    
    def test_rebalance_recommendations(self):
        """Test GET /api/wealth/rebalance/{client_id}"""
        response = requests.get(f"{BASE_URL}/api/wealth/rebalance/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "current_allocation" in data
        assert "target_allocation" in data
        assert "recommendations" in data
        assert "drift_score" in data
        
        # Verify recommendations structure
        if data["recommendations"]:
            rec = data["recommendations"][0]
            assert "asset_class" in rec
            assert "current_percent" in rec
            assert "target_percent" in rec
            assert "action" in rec
            assert "priority" in rec


class TestIntegrationFlows:
    """Integration tests for complete workflows"""
    
    def test_meeting_prep_to_compliance_flow(self):
        """Test flow: Generate meeting prep -> Create audit log -> Run compliance check"""
        # Step 1: Generate meeting prep
        prep_payload = {
            "client_id": "integration_test_client",
            "client_name": "Integration Test",
            "meeting_type": "planning"
        }
        prep_response = requests.post(f"{BASE_URL}/api/meeting-prep/generate", json=prep_payload)
        assert prep_response.status_code == 200
        prep_data = prep_response.json()
        
        # Step 2: Create audit log for the meeting
        audit_payload = {
            "client_id": "integration_test_client",
            "action_type": "meeting_prep_generated",
            "description": f"Meeting prep generated: {prep_data['id']}"
        }
        audit_response = requests.post(f"{BASE_URL}/api/compliance/audit-log", json=audit_payload)
        assert audit_response.status_code == 200
        
        # Step 3: Run compliance check
        check_response = requests.post(f"{BASE_URL}/api/compliance/check?client_id=integration_test_client")
        assert check_response.status_code == 200
        check_data = check_response.json()
        assert check_data["overall_status"] in ["compliant", "action_required"]
    
    def test_research_to_wealth_flow(self):
        """Test flow: Screen stocks -> Get details -> Check wealth allocation"""
        # Step 1: Screen for high dividend stocks
        screen_payload = {"min_dividend_yield": 5.0, "limit": 5}
        screen_response = requests.post(f"{BASE_URL}/api/research/screener", json=screen_payload)
        assert screen_response.status_code == 200
        screen_data = screen_response.json()
        
        # Step 2: Get details for first stock
        if screen_data["stocks"]:
            ticker = screen_data["stocks"][0]["ticker"]
            detail_response = requests.get(f"{BASE_URL}/api/research/stock/{ticker}")
            assert detail_response.status_code == 200
        
        # Step 3: Check wealth allocation
        wealth_response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        assert wealth_response.status_code == 200
        wealth_data = wealth_response.json()
        assert "shares" in wealth_data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
