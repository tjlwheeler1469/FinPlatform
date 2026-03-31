"""
Test Suite for Iteration 101 - New Features Testing
Tests: WebSocket Service, Enhanced Mock Notifications, Xplan Phase 2, Live Sync Dashboard, Save to Client Profile
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWebSocketService:
    """WebSocket Service API Tests"""
    
    def test_ws_stats_endpoint(self):
        """GET /api/ws/stats - Returns WebSocket connection statistics"""
        response = requests.get(f"{BASE_URL}/api/ws/stats")
        assert response.status_code == 200
        data = response.json()
        assert "connections" in data
        assert "total" in data
        assert "timestamp" in data
        print(f"PASS: WebSocket stats - {data['total']} total connections")
    
    def test_ws_test_notification(self):
        """POST /api/ws/test-notification - Send test notification to all channels"""
        response = requests.post(f"{BASE_URL}/api/ws/test-notification")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "test_sent"
        assert "channels" in data
        print(f"PASS: Test notification sent to channels: {data['channels']}")


class TestNotificationServiceMockMode:
    """Enhanced Mock Mode Notification Tests"""
    
    def test_notification_status(self):
        """GET /api/notifications/status - Shows mock_mode for email and sms"""
        response = requests.get(f"{BASE_URL}/api/notifications/status")
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "sms" in data
        # Should be in mock mode since no API keys configured
        assert data["email"]["status"] == "mock_mode"
        assert data["sms"]["status"] == "mock_mode"
        print(f"PASS: Notification status - Email: {data['email']['status']}, SMS: {data['sms']['status']}")
    
    def test_send_test_mock_notification(self):
        """POST /api/notifications/send-test-mock - Sends test email and SMS in mock mode"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/send-test-mock",
            params={"email": "test@example.com", "phone": "+61400000000"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email_result" in data
        assert "sms_result" in data
        assert data["email_result"]["success"] is True
        assert data["email_result"]["mock"] is True
        assert data["sms_result"]["success"] is True
        assert data["sms_result"]["mock"] is True
        print(f"PASS: Mock notifications sent - Email log_id: {data['email_result'].get('log_id')}, SMS log_id: {data['sms_result'].get('log_id')}")
    
    def test_get_mock_notifications(self):
        """GET /api/notifications/mock-notifications - Returns logged mock notifications"""
        response = requests.get(f"{BASE_URL}/api/notifications/mock-notifications", params={"limit": 20})
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "total" in data
        assert data["mode"] == "mock"
        print(f"PASS: Retrieved {data['total']} mock notifications")
    
    def test_get_mock_notifications_by_type(self):
        """GET /api/notifications/mock-notifications - Filter by type (email/sms)"""
        response = requests.get(f"{BASE_URL}/api/notifications/mock-notifications", params={"notification_type": "email"})
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        # All returned should be email type
        for notif in data["notifications"]:
            assert notif.get("type") == "email"
        print(f"PASS: Filtered mock notifications by type - {len(data['notifications'])} email notifications")


class TestXplanPhase2:
    """Xplan Phase 2 - Scenario Upload and Deep Portfolio Sync Tests"""
    
    def test_xplan_status(self):
        """GET /api/xplan/status - Check Xplan integration status"""
        response = requests.get(f"{BASE_URL}/api/xplan/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "mode" in data
        assert "capabilities" in data
        print(f"PASS: Xplan status - Mode: {data['mode']}, Status: {data['status']}")
    
    def test_scenario_upload(self):
        """POST /api/xplan/scenarios/upload - Upload scenario document to Xplan"""
        scenario_data = {
            "client_id": "TEST_CLIENT_001",
            "scenario_name": "TEST Retirement Projection 2026",
            "scenario_type": "retirement",
            "document_type": "advice_document",
            "content": {
                "current_age": 55,
                "retirement_age": 65,
                "current_balance": 500000,
                "projected_balance": 1200000,
                "annual_contribution": 25000
            },
            "projections": [
                {"year": 2026, "balance": 550000},
                {"year": 2027, "balance": 610000}
            ],
            "recommendations": [
                "Increase salary sacrifice by $5,000",
                "Consider growth investment profile"
            ],
            "adviser_id": "ADV_TEST_001",
            "notes": "Test scenario upload for iteration 101"
        }
        response = requests.post(f"{BASE_URL}/api/xplan/scenarios/upload", json=scenario_data)
        assert response.status_code == 200
        data = response.json()
        assert "scenario_id" in data
        assert data["scenario_id"].startswith("SCN-")
        print(f"PASS: Scenario uploaded - ID: {data['scenario_id']}")
    
    def test_get_client_scenarios(self):
        """GET /api/xplan/scenarios/{client_id} - Returns client scenarios"""
        response = requests.get(f"{BASE_URL}/api/xplan/scenarios/TEST_CLIENT_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "scenarios" in data
        assert "total" in data
        print(f"PASS: Retrieved {data['total']} scenarios for client TEST_CLIENT_001")
    
    def test_deep_portfolio_sync(self):
        """POST /api/xplan/portfolio/deep-sync - Performs deep portfolio sync"""
        sync_request = {
            "client_id": "TEST_CLIENT_002",
            "include_transactions": True,
            "include_performance": True,
            "include_tax_lots": True,
            "date_range_days": 365
        }
        response = requests.post(f"{BASE_URL}/api/xplan/portfolio/deep-sync", json=sync_request)
        assert response.status_code == 200
        data = response.json()
        assert "sync_id" in data
        assert data["sync_id"].startswith("DEEP-")
        assert "components" in data
        assert "holdings" in data["components"]
        print(f"PASS: Deep sync completed - ID: {data['sync_id']}, Components: {list(data['components'].keys())}")
    
    def test_get_deep_portfolio_data(self):
        """GET /api/xplan/portfolio/deep/{client_id} - Returns deep sync data"""
        response = requests.get(f"{BASE_URL}/api/xplan/portfolio/deep/TEST_CLIENT_002")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        # Either has deep sync data or message about no data
        if "sync_id" in data:
            assert "holdings" in data or "components" in data
            print(f"PASS: Deep portfolio data retrieved for TEST_CLIENT_002")
        else:
            print(f"PASS: Deep portfolio endpoint working - {data.get('message', 'No data yet')}")


class TestClientProfileRetirement:
    """Client Profile Retirement - Save to Profile Tests"""
    
    def test_get_structures(self):
        """GET /api/client-profile/structures - Returns available structure types"""
        response = requests.get(f"{BASE_URL}/api/client-profile/structures")
        assert response.status_code == 200
        data = response.json()
        assert "structures" in data
        # Should have 6 structure types
        assert len(data["structures"]) >= 6
        structure_ids = [s["id"] for s in data["structures"]]
        assert "personal" in structure_ids
        assert "smsf" in structure_ids
        print(f"PASS: Retrieved {len(data['structures'])} structure types")
    
    def test_save_retirement_calculation(self):
        """POST /api/client-profile/retirement/save - Saves retirement calculation to client profile"""
        save_data = {
            "client_id": "TEST_CLIENT_SAVE_001",
            "client_name": "Test Client Save",
            "calculation_type": "accumulation",
            "calculation_id": f"CALC-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "calculation_data": {
                "summary": {
                    "projected_final_balance": 1500000,
                    "retirement_age": 65,
                    "years_to_retirement": 30
                },
                "projections": [
                    {"year": 2026, "balance": 200000},
                    {"year": 2027, "balance": 250000}
                ]
            },
            "push_to_platforms": None
        }
        response = requests.post(f"{BASE_URL}/api/client-profile/retirement/save", json=save_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("profile_updated") is True
        print(f"PASS: Retirement calculation saved - Client ID: {data['client_id']}")
    
    def test_save_decumulation_calculation(self):
        """POST /api/client-profile/retirement/save - Saves decumulation calculation"""
        save_data = {
            "client_id": "TEST_CLIENT_DECUM_001",
            "client_name": "Test Decumulation Client",
            "calculation_type": "decumulation",
            "calculation_id": f"CALC-DECUM-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "calculation_data": {
                "summary": {
                    "total_assets": 2000000,
                    "annual_drawdown": 80000,
                    "years_funds_last": 30
                },
                "projections": []
            },
            "structures": [
                {
                    "structure": "personal",
                    "structure_name": "Personal Assets",
                    "super_balance": 0,
                    "investment_balance": 500000,
                    "property_value": 1000000,
                    "liabilities": 0
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/api/client-profile/retirement/save", json=save_data)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("profile_updated") is True
        print(f"PASS: Decumulation calculation saved - Client ID: {data['client_id']}")


class TestPlatformIntegrations:
    """Platform Integrations - Verify existing functionality still works"""
    
    def test_platforms_status(self):
        """GET /api/platforms/status - Returns platform connection status"""
        response = requests.get(f"{BASE_URL}/api/platforms/status")
        assert response.status_code == 200
        data = response.json()
        assert "connections" in data
        print(f"PASS: Platform status - {len(data['connections'])} platforms")
    
    def test_demo_all_clients(self):
        """GET /api/platforms/demo/all-clients - Returns all demo clients"""
        response = requests.get(f"{BASE_URL}/api/platforms/demo/all-clients")
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        print(f"PASS: Demo clients - {len(data['clients'])} clients")
    
    def test_demo_portfolio_summary(self):
        """GET /api/platforms/demo/portfolio-summary - Returns portfolio summary"""
        response = requests.get(f"{BASE_URL}/api/platforms/demo/portfolio-summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_aum" in data
        print(f"PASS: Portfolio summary - Total AUM: ${data['total_aum']:,}")


class TestHealthCheck:
    """Health Check - Verify new features are enabled"""
    
    def test_health_check_new_features(self):
        """GET /api/health - Verify new features are enabled"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        
        # Check AdviceOS features
        adviceos = data.get("adviceos", {})
        assert adviceos.get("websocket_service") is True
        assert adviceos.get("notification_service") is True
        assert adviceos.get("xplan_phase2") is True
        assert adviceos.get("platform_integrations") is True
        assert adviceos.get("client_profile_retirement") is True
        
        print(f"PASS: Health check - All new features enabled")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
