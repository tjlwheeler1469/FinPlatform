"""
Wealth Command v8.0 Feature Tests - Iteration 94
Tests for:
1. Knowledge Graph MongoDB persistence
2. Hybrid prices with enhanced data sources (BBSW)
3. PDF Report Generation (ReportLab)
4. Voice Interface (Whisper)
5. Notification Service (SendGrid/Twilio - graceful degradation)
6. Licensee Multi-tenant Dashboard
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Verify health check shows v8.0.0 with all new features"""
    
    def test_health_check_version(self):
        """Test health check returns version 8.0.0"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "8.0.0"
        assert data["status"] == "healthy"
        print(f"✓ Health check: version {data['version']}, status {data['status']}")
    
    def test_health_check_adviceos_features(self):
        """Test health check shows all AdviceOS features"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        
        adviceos = data.get("adviceos", {})
        assert adviceos.get("pdf_reports") == True, "PDF reports should be enabled"
        assert adviceos.get("notification_service") == True, "Notification service should be enabled"
        assert adviceos.get("voice_interface") == True, "Voice interface should be enabled"
        assert adviceos.get("licensee_dashboard") == True, "Licensee dashboard should be enabled"
        print(f"✓ AdviceOS features verified: {adviceos}")


class TestKnowledgeGraphMongoDB:
    """Test Knowledge Graph with MongoDB persistence"""
    
    def test_get_client_graph(self):
        """Test getting client financial graph from MongoDB"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert "client_id" in data
        assert "graph" in data
        assert "summary" in data
        
        # Verify graph structure
        graph = data.get("graph", {})
        assert "primary" in graph
        assert "family" in graph
        assert "entities" in graph
        
        # Verify summary calculations
        summary = data.get("summary", {})
        assert "total_assets" in summary
        assert "total_liabilities" in summary
        assert "net_worth" in summary
        
        print(f"✓ Client graph retrieved: net_worth=${summary.get('net_worth', 0):,.0f}")
    
    def test_get_client_entities(self):
        """Test getting client entities"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1/entities")
        assert response.status_code == 200
        data = response.json()
        
        assert "entities" in data
        assert "count" in data
        assert data["count"] > 0
        
        # Verify entity structure
        entities = data.get("entities", [])
        for entity in entities:
            assert "id" in entity
            assert "type" in entity
            assert "name" in entity
        
        print(f"✓ Client entities: {data['count']} entities found")
    
    def test_get_client_cash_flow(self):
        """Test getting client cash flow analysis"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1/cash-flow")
        assert response.status_code == 200
        data = response.json()
        
        assert "income" in data
        assert "expenses" in data
        assert "surplus" in data
        assert "savings_rate" in data
        
        print(f"✓ Cash flow: surplus=${data.get('surplus', 0):,.0f}, savings_rate={data.get('savings_rate', 0)}%")
    
    def test_save_client_graph(self):
        """Test saving client graph to MongoDB"""
        test_client_id = f"test_client_{uuid.uuid4().hex[:8]}"
        graph_data = {
            "primary": {
                "id": "test_person",
                "name": "Test User",
                "type": "individual"
            },
            "family": [],
            "entities": [],
            "assets": {"property": [], "vehicles": []},
            "liabilities": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/financial-graph/client/{test_client_id}/save",
            json=graph_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        # Verify persistence by fetching
        get_response = requests.get(f"{BASE_URL}/api/financial-graph/client/{test_client_id}")
        assert get_response.status_code == 200
        
        print(f"✓ Client graph saved and verified for {test_client_id}")


class TestHybridPrices:
    """Test Hybrid Securities Prices with enhanced data sources"""
    
    def test_get_hybrid_prices(self):
        """Test getting hybrid securities prices"""
        response = requests.get(f"{BASE_URL}/api/hybrids/prices")
        assert response.status_code == 200
        data = response.json()
        
        assert "hybrids" in data
        assert "bbsw_3m" in data
        assert "timestamp" in data
        
        # Verify BBSW rate is present
        bbsw = data.get("bbsw_3m")
        assert bbsw is not None
        assert isinstance(bbsw, (int, float))
        
        print(f"✓ Hybrid prices: {len(data.get('hybrids', []))} securities, BBSW 3M: {bbsw}%")
    
    def test_get_all_hybrid_prices(self):
        """Test getting all hybrid securities"""
        response = requests.get(f"{BASE_URL}/api/hybrids/all")
        assert response.status_code == 200
        data = response.json()
        
        hybrids = data.get("hybrids", [])
        assert len(hybrids) > 0
        
        # Verify hybrid structure
        for hybrid in hybrids[:3]:
            assert "symbol" in hybrid
            assert "name" in hybrid
            assert "issuer" in hybrid
            assert "margin_bbsw" in hybrid
            assert "running_yield" in hybrid
        
        print(f"✓ All hybrids: {len(hybrids)} securities retrieved")
    
    def test_hybrid_portfolio_value(self):
        """Test calculating hybrid portfolio value"""
        response = requests.get(f"{BASE_URL}/api/hybrids/portfolio/value")
        assert response.status_code == 200
        data = response.json()
        
        assert "portfolio" in data
        assert "total_market_value" in data
        assert "total_annual_income" in data
        assert "weighted_average_yield" in data
        
        print(f"✓ Portfolio value: ${data.get('total_market_value', 0):,.2f}, yield: {data.get('weighted_average_yield', 0)}%")
    
    def test_hybrid_info(self):
        """Test getting specific hybrid info"""
        response = requests.get(f"{BASE_URL}/api/hybrids/info/CBAPD")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("symbol") == "CBAPD"
        assert "name" in data
        assert "issuer" in data
        assert "call_date" in data
        assert "years_to_call" in data
        
        print(f"✓ Hybrid info: {data.get('name')}, years to call: {data.get('years_to_call')}")
    
    def test_hybrid_market_summary(self):
        """Test getting hybrid market summary"""
        response = requests.get(f"{BASE_URL}/api/hybrids/market/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_securities" in data
        assert "average_yield" in data
        assert "by_issuer" in data
        
        print(f"✓ Market summary: {data.get('total_securities')} securities, avg yield: {data.get('average_yield')}%")


class TestPDFReports:
    """Test PDF Report Generation"""
    
    def test_compliance_summary_pdf(self):
        """Test generating compliance summary PDF"""
        response = requests.get(f"{BASE_URL}/api/reports/pdf/compliance-summary")
        assert response.status_code == 200
        
        # Verify PDF content type
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type
        
        # Verify file size (should be > 1KB for a valid PDF)
        content_length = len(response.content)
        assert content_length > 1000, f"PDF too small: {content_length} bytes"
        
        # Verify PDF header
        assert response.content[:4] == b'%PDF', "Invalid PDF header"
        
        print(f"✓ Compliance summary PDF: {content_length:,} bytes")
    
    def test_audit_trail_pdf(self):
        """Test generating audit trail PDF"""
        response = requests.get(f"{BASE_URL}/api/reports/pdf/audit-trail")
        assert response.status_code == 200
        
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type
        
        content_length = len(response.content)
        assert content_length > 1000
        assert response.content[:4] == b'%PDF'
        
        print(f"✓ Audit trail PDF: {content_length:,} bytes")
    
    def test_breach_report_pdf(self):
        """Test generating breach report PDF"""
        response = requests.get(f"{BASE_URL}/api/reports/pdf/breach-report")
        assert response.status_code == 200
        
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type
        
        content_length = len(response.content)
        assert content_length > 1000
        assert response.content[:4] == b'%PDF'
        
        print(f"✓ Breach report PDF: {content_length:,} bytes")


class TestVoiceInterface:
    """Test Voice Interface endpoints"""
    
    def test_voice_status(self):
        """Test voice interface status"""
        response = requests.get(f"{BASE_URL}/api/voice/status")
        assert response.status_code == 200
        data = response.json()
        
        assert "whisper_configured" in data
        assert "status" in data
        assert "supported_formats" in data
        assert "max_file_size_mb" in data
        
        # Status should be 'ready' or 'not_configured'
        assert data["status"] in ["ready", "not_configured"]
        
        print(f"✓ Voice status: {data['status']}, whisper_configured: {data['whisper_configured']}")
    
    def test_voice_command_parsing(self):
        """Test voice command parsing via text endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            params={"text": "show my portfolio"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "text" in data
        assert "intent" in data
        assert "action" in data
        assert "response" in data
        
        # Verify intent detection
        assert data["intent"] == "show_portfolio"
        assert data["action"] == "/dashboard"
        
        print(f"✓ Voice command: intent={data['intent']}, action={data['action']}")
    
    def test_voice_command_compliance_check(self):
        """Test voice command for compliance check"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            params={"text": "run compliance check"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["intent"] == "compliance_check"
        assert data["action"] == "/adviceos"
        
        print(f"✓ Compliance command: intent={data['intent']}")
    
    def test_voice_command_help(self):
        """Test voice command for help"""
        response = requests.post(
            f"{BASE_URL}/api/voice/command",
            params={"text": "help"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["intent"] == "help"
        assert "response" in data
        
        print(f"✓ Help command: response length={len(data['response'])}")
    
    def test_supported_commands(self):
        """Test getting supported voice commands"""
        response = requests.get(f"{BASE_URL}/api/voice/supported-commands")
        assert response.status_code == 200
        data = response.json()
        
        assert "commands" in data
        assert "supported_formats" in data
        
        commands = data.get("commands", [])
        assert len(commands) > 0
        
        # Verify command structure
        for cmd in commands:
            assert "intent" in cmd
            assert "examples" in cmd
            assert "action" in cmd
        
        print(f"✓ Supported commands: {len(commands)} intents available")


class TestNotificationService:
    """Test Notification Service (graceful degradation when not configured)"""
    
    def test_notification_status(self):
        """Test notification service status"""
        response = requests.get(f"{BASE_URL}/api/notifications/status")
        assert response.status_code == 200
        data = response.json()
        
        assert "email" in data
        assert "sms" in data
        
        # Verify structure
        email_status = data.get("email", {})
        assert "provider" in email_status
        assert "configured" in email_status
        assert "status" in email_status
        
        sms_status = data.get("sms", {})
        assert "provider" in sms_status
        assert "configured" in sms_status
        assert "status" in sms_status
        
        print(f"✓ Notification status: email={email_status['status']}, sms={sms_status['status']}")
    
    def test_get_notification_settings(self):
        """Test getting notification settings"""
        response = requests.get(f"{BASE_URL}/api/notifications/settings/lic_default")
        assert response.status_code == 200
        data = response.json()
        
        assert "licensee_id" in data
        assert "email_enabled" in data
        assert "sms_enabled" in data
        assert "severity_threshold" in data
        
        print(f"✓ Notification settings: email_enabled={data['email_enabled']}, sms_enabled={data['sms_enabled']}")
    
    def test_save_notification_settings(self):
        """Test saving notification settings"""
        settings = {
            "licensee_id": "lic_test",
            "email_enabled": True,
            "sms_enabled": False,
            "email_recipients": ["test@example.com"],
            "sms_recipients": [],
            "severity_threshold": "high",
            "notify_on_override": True,
            "daily_digest": False,
            "digest_time": "09:00"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/notifications/settings",
            json=settings
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/notifications/settings/lic_test")
        assert get_response.status_code == 200
        saved = get_response.json()
        assert saved["severity_threshold"] == "high"
        
        print(f"✓ Notification settings saved and verified")
    
    def test_notification_logs(self):
        """Test getting notification logs"""
        response = requests.get(f"{BASE_URL}/api/notifications/logs")
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        assert "count" in data
        
        print(f"✓ Notification logs: {data['count']} entries")


class TestLicenseeDashboard:
    """Test Licensee Multi-tenant Dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test licensee"""
        self.test_afsl = f"TEST_{uuid.uuid4().hex[:8]}"
        self.test_licensee_id = None
    
    def test_create_licensee(self):
        """Test creating a new licensee"""
        licensee_data = {
            "name": "Test Financial Services",
            "afsl_number": f"TEST_{uuid.uuid4().hex[:8]}",
            "abn": "12 345 678 901",
            "contact_email": "compliance@testfs.com.au",
            "contact_phone": "+61 2 9999 9999",
            "address": "123 Test Street, Sydney NSW 2000",
            "compliance_officer": "John Smith"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/licensee/create",
            json=licensee_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "licensee_id" in data
        
        self.test_licensee_id = data["licensee_id"]
        print(f"✓ Licensee created: {data['licensee_id']}")
        
        return data["licensee_id"]
    
    def test_list_all_licensees(self):
        """Test listing all licensees"""
        response = requests.get(f"{BASE_URL}/api/licensee/list/all")
        assert response.status_code == 200
        data = response.json()
        
        assert "licensees" in data
        assert "count" in data
        
        print(f"✓ Licensees list: {data['count']} licensees")
    
    def test_get_licensee_dashboard(self):
        """Test getting licensee dashboard"""
        # First create a licensee
        licensee_id = self.test_create_licensee()
        
        response = requests.get(f"{BASE_URL}/api/licensee/{licensee_id}/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        assert "licensee" in data
        assert "summary" in data
        assert "adviser_activity" in data
        
        summary = data.get("summary", {})
        assert "compliance_score" in summary
        assert "advisers" in summary
        assert "scenarios" in summary
        
        print(f"✓ Licensee dashboard: compliance_score={summary.get('compliance_score')}%")
    
    def test_add_adviser_to_licensee(self):
        """Test adding an adviser to a licensee"""
        # First create a licensee
        licensee_id = self.test_create_licensee()
        
        adviser_data = {
            "name": "Jane Adviser",
            "email": "jane@testfs.com.au",
            "phone": "+61 400 000 000",
            "ar_number": "AR123456",
            "status": "active"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/licensee/{licensee_id}/advisers",
            json=adviser_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "adviser_id" in data
        
        print(f"✓ Adviser added: {data['adviser_id']}")
    
    def test_add_apl_product(self):
        """Test adding a product to APL"""
        # First create a licensee
        licensee_id = self.test_create_licensee()
        
        product_data = {
            "product_code": "VAS",
            "product_name": "Vanguard Australian Shares Index ETF",
            "product_type": "etf",
            "provider": "Vanguard",
            "risk_rating": "high",
            "approved_for": ["balanced", "growth"],
            "min_investment": 500,
            "max_allocation": 30,
            "notes": "Core Australian equity exposure"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/licensee/{licensee_id}/apl",
            json=product_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "product_id" in data
        
        print(f"✓ APL product added: {data['product_id']}")
    
    def test_get_compliance_rules(self):
        """Test getting compliance rules for a licensee"""
        # First create a licensee
        licensee_id = self.test_create_licensee()
        
        response = requests.get(f"{BASE_URL}/api/licensee/{licensee_id}/rules")
        assert response.status_code == 200
        data = response.json()
        
        assert "standard_rules" in data
        assert "custom_rules" in data
        
        standard_rules = data.get("standard_rules", [])
        assert len(standard_rules) > 0
        
        # Verify standard rule structure
        for rule in standard_rules:
            assert "rule_id" in rule
            assert "rule_name" in rule
            assert "rule_type" in rule
        
        print(f"✓ Compliance rules: {len(standard_rules)} standard rules")
    
    def test_add_custom_compliance_rule(self):
        """Test adding a custom compliance rule"""
        # First create a licensee
        licensee_id = self.test_create_licensee()
        
        rule_data = {
            "rule_id": "CUSTOM_001",
            "rule_name": "Maximum Crypto Allocation",
            "rule_type": "allocation",
            "description": "Cryptocurrency allocation cannot exceed 5% of portfolio",
            "conditions": {"asset_class": "crypto", "max_percent": 5},
            "action": "block",
            "active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/licensee/{licensee_id}/rules",
            json=rule_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        
        print(f"✓ Custom rule added: {rule_data['rule_name']}")


class TestWebsocketsCompatibility:
    """Test that websockets and alpaca-trade-api are compatible (no import errors)"""
    
    def test_alpaca_trading_endpoint(self):
        """Test Alpaca trading endpoint works (verifies no import errors)"""
        response = requests.get(f"{BASE_URL}/api/alpaca/status")
        # Should return 200 even if not configured
        assert response.status_code == 200
        data = response.json()
        
        # Verify endpoint responds (no import errors)
        assert "configured" in data or "status" in data or "paper_trading" in data
        
        print(f"✓ Alpaca endpoint working (no websockets conflict)")
    
    def test_realtime_data_endpoint(self):
        """Test realtime data endpoint works"""
        response = requests.get(f"{BASE_URL}/api/realtime/status")
        # Should return 200
        assert response.status_code == 200
        
        print(f"✓ Realtime data endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
