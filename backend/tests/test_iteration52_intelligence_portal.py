"""
Test Suite for Iteration 52 - Cross-Client Intelligence Engine, Client Portal, and Meeting Automation
Tests new features: Intelligence Engine, Client Portal Auth, Meeting Automation
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://smart-insights-dash.preview.emergentagent.com').rstrip('/')

# Test credentials - loaded from environment
CLIENT_PORTAL_EMAIL = os.environ.get('CLIENT_PORTAL_EMAIL', 'client_wheeler@email.com')
CLIENT_PORTAL_PASSWORD = os.environ.get('CLIENT_PORTAL_PASSWORD', 'wheeler2025')
TEST_CLIENT_ID = "client_1"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestCrossClientIntelligenceEngine:
    """Tests for Cross-Client Intelligence Engine - NEW in Iteration 52"""
    
    def test_comprehensive_analysis(self):
        """Test comprehensive cross-client analysis endpoint"""
        response = requests.get(f"{BASE_URL}/api/intelligence/comprehensive-analysis")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "generated_at" in data
        assert "practice_summary" in data
        assert "portfolio_drift" in data
        assert "tax_opportunities" in data
        assert "engagement" in data
        assert "fee_optimization" in data
        assert "goals" in data
        assert "priority_actions" in data
        
        # Verify practice summary
        summary = data["practice_summary"]
        assert "total_aum" in summary
        assert "total_clients" in summary
        assert "average_client_aum" in summary
        assert "health_score" in summary
        assert summary["total_clients"] == 8
        assert summary["total_aum"] == 21260000
    
    def test_portfolio_drift_analysis(self):
        """Test portfolio drift analysis endpoint"""
        response = requests.get(f"{BASE_URL}/api/intelligence/portfolio-drift")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_clients" in data
        assert "clients_needing_rebalance" in data
        assert "average_drift" in data
        assert "drift_by_client" in data
        assert "common_overweight_assets" in data
        assert "batch_rebalance_opportunity" in data
        assert "estimated_trades" in data
        
        # Verify drift data
        assert data["total_clients"] == 8
        assert isinstance(data["drift_by_client"], list)
        assert len(data["drift_by_client"]) == 8
    
    def test_tax_opportunities_analysis(self):
        """Test tax opportunities analysis endpoint"""
        response = requests.get(f"{BASE_URL}/api/intelligence/tax-opportunities")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_clients_with_opportunities" in data
        assert "total_harvestable_losses" in data
        assert "total_unused_super_cap" in data
        assert "total_potential_tax_savings" in data
        assert "opportunities_by_client" in data
        assert "eofy_deadline" in data
        assert "days_until_eofy" in data
        assert "urgency" in data
        
        # Verify data values
        assert data["total_clients_with_opportunities"] == 8
        assert data["total_harvestable_losses"] == 307000
        assert data["eofy_deadline"] == "June 30, 2025"
    
    def test_engagement_analysis(self):
        """Test client engagement analysis endpoint"""
        response = requests.get(f"{BASE_URL}/api/intelligence/engagement")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_clients" in data
        assert "at_risk_count" in data
        assert "reviews_overdue" in data
        assert "average_engagement_score" in data
        assert "clients_not_logged_90_days" in data
        assert "engagement_by_client" in data
        assert "recommended_actions" in data
        
        # Verify data
        assert data["total_clients"] == 8
        assert isinstance(data["engagement_by_client"], list)
        assert len(data["engagement_by_client"]) == 8
    
    def test_fee_optimization_analysis(self):
        """Test fee optimization analysis endpoint"""
        response = requests.get(f"{BASE_URL}/api/intelligence/fee-optimization")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_aum" in data
        assert "current_fee_rate" in data
        assert "current_annual_fees" in data
        assert "optimal_fee_rate" in data
        assert "optimal_annual_fees" in data
        assert "potential_annual_savings" in data
        assert "recommendation" in data
        assert "action_required" in data
        assert "platforms_to_contact" in data
        
        # Verify data
        assert data["total_aum"] == 21260000
        assert data["current_fee_rate"] == 0.85
        assert data["optimal_fee_rate"] == 0.45
        assert data["action_required"] == True
    
    def test_goals_analysis(self):
        """Test goals analysis endpoint"""
        response = requests.get(f"{BASE_URL}/api/intelligence/goals-analysis")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_goals" in data
        assert "goals_on_track" in data
        assert "goals_at_risk" in data
        assert "success_rate" in data
        assert "at_risk_goals" in data
        assert "all_goals" in data
        
        # Verify data
        assert data["total_goals"] == 8
        assert data["goals_on_track"] == 6
        assert data["goals_at_risk"] == 2
        assert data["success_rate"] == 75.0


class TestClientPortalAuth:
    """Tests for Client Portal Authentication - NEW in Iteration 52"""
    
    def test_client_login_success(self):
        """Test successful client portal login"""
        response = requests.post(
            f"{BASE_URL}/api/client-portal/auth/login",
            json={"email": CLIENT_PORTAL_EMAIL, "password": CLIENT_PORTAL_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert "token" in data
        assert "user" in data
        assert "expires_in" in data
        
        # Verify user data
        user = data["user"]
        assert user["email"] == CLIENT_PORTAL_EMAIL
        assert user["name"] == "James Wheeler"
        assert user["linked_client_id"] == "client_1"
        assert "permissions" in user
        assert "view_portfolio" in user["permissions"]
    
    def test_client_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/client-portal/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_client_login_wrong_password(self):
        """Test login with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/client-portal/auth/login",
            json={"email": CLIENT_PORTAL_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401


class TestClientPortalEndpoints:
    """Tests for Client Portal Endpoints - NEW in Iteration 52"""
    
    @pytest.fixture
    def client_token(self):
        """Get client portal token"""
        response = requests.post(
            f"{BASE_URL}/api/client-portal/auth/login",
            json={"email": CLIENT_PORTAL_EMAIL, "password": CLIENT_PORTAL_PASSWORD}
        )
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Client portal login failed")
    
    def test_client_dashboard(self, client_token):
        """Test client dashboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard?token={client_token}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "client_id" in data
        assert "portfolio_summary" in data
        assert "goals" in data
        assert "upcoming_appointments" in data
        assert "recent_documents" in data
        assert "unread_messages" in data
        assert "last_updated" in data
        
        # Verify portfolio summary
        portfolio = data["portfolio_summary"]
        assert portfolio["total_value"] == 2920000
        assert "change_24h" in portfolio
        assert "change_ytd" in portfolio
    
    def test_client_portfolio(self, client_token):
        """Test client portfolio endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolio?token={client_token}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "client_id" in data
        assert "holdings" in data
        assert "performance" in data
        assert "last_updated" in data
        
        # Verify holdings
        assert len(data["holdings"]) == 5
        assert data["performance"]["total_value"] == 2920000
    
    def test_client_goals(self, client_token):
        """Test client goals endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/goals?token={client_token}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "client_id" in data
        assert "goals" in data
        assert "last_updated" in data
        
        # Verify goals
        assert len(data["goals"]) == 2
        goal = data["goals"][0]
        assert "id" in goal
        assert "name" in goal
        assert "target_amount" in goal
        assert "current_amount" in goal
        assert "progress" in goal
        assert "status" in goal
    
    def test_client_net_worth(self, client_token):
        """Test client net worth endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth?token={client_token}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "client_id" in data
        assert "assets" in data
        assert "liabilities" in data
        assert "summary" in data
        assert "change_from_last_month" in data
        
        # Verify summary
        summary = data["summary"]
        assert summary["total_assets"] == 6500000
        assert summary["total_liabilities"] == 850000
        assert summary["net_worth"] == 5650000
    
    def test_client_documents(self, client_token):
        """Test client documents endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/documents?token={client_token}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "client_id" in data
        assert "documents" in data
        assert "categories" in data
        
        # Verify documents
        assert len(data["documents"]) == 5
    
    def test_client_messages(self, client_token):
        """Test client messages endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/messages?token={client_token}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "messages" in data
        assert "unread" in data
    
    def test_send_message_to_adviser(self, client_token):
        """Test sending message to adviser"""
        response = requests.post(
            f"{BASE_URL}/api/client-portal/messages/send?token={client_token}",
            json={"subject": "Test Message", "message": "This is a test message from pytest"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "message_id" in data
        assert "sent_at" in data
    
    def test_invalid_token(self):
        """Test endpoints with invalid token"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard?token=invalid_token")
        assert response.status_code == 401


class TestMeetingAutomation:
    """Tests for Meeting Automation - NEW in Iteration 52"""
    
    def test_generate_meeting_notes(self):
        """Test generating meeting notes"""
        response = requests.post(
            f"{BASE_URL}/api/meeting-automation/generate-notes",
            json={
                "client_id": "client_1",
                "client_name": "Wheeler Family",
                "meeting_date": "2025-03-17",
                "meeting_type": "annual_review",
                "attendees": ["James Wheeler", "Sarah Wheeler", "John Adviser"],
                "topics_discussed": ["Portfolio performance", "Retirement planning", "Tax optimization"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data["success"] == True
        assert "meeting_id" in data
        assert "meeting" in data
        assert "compliance_entry" in data
        assert "next_steps" in data
        
        # Verify meeting data
        meeting = data["meeting"]
        assert meeting["client_id"] == "client_1"
        assert meeting["client_name"] == "Wheeler Family"
        assert meeting["meeting_type"] == "annual_review"
        assert "notes" in meeting
        assert meeting["status"] == "draft"
        
        # Verify compliance entry
        compliance = data["compliance_entry"]
        assert "compliance_checklist" in compliance
        assert "regulatory_references" in compliance
        assert compliance["review_status"] == "pending"
        
        return data["meeting_id"]
    
    def test_generate_follow_up_email(self):
        """Test generating follow-up email"""
        # First create a meeting
        create_response = requests.post(
            f"{BASE_URL}/api/meeting-automation/generate-notes",
            json={
                "client_id": "client_1",
                "client_name": "Wheeler Family",
                "meeting_date": "2025-03-17",
                "meeting_type": "annual_review",
                "attendees": ["James Wheeler", "John Adviser"],
                "topics_discussed": ["Portfolio review", "Tax planning"]
            }
        )
        assert create_response.status_code == 200
        meeting_id = create_response.json()["meeting_id"]
        
        # Generate follow-up email
        response = requests.post(f"{BASE_URL}/api/meeting-automation/generate-follow-up-email?meeting_id={meeting_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert data["success"] == True
        assert "email_content" in data
        assert "ai_generated" in data
        assert data["meeting_id"] == meeting_id
        
        # Verify email content
        assert "Wheeler Family" in data["email_content"]
        assert "Thank you" in data["email_content"]
    
    def test_list_meetings(self):
        """Test listing meetings"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/meetings")
        assert response.status_code == 200
        data = response.json()
        
        assert "meetings" in data
        assert "total" in data
    
    def test_get_compliance_logs(self):
        """Test getting compliance logs"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/compliance-logs")
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        assert "total" in data
        assert "pending_review" in data
    
    def test_meeting_not_found(self):
        """Test getting non-existent meeting"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/meeting/nonexistent_meeting")
        assert response.status_code == 404


class TestExistingEndpoints:
    """Tests to verify existing endpoints continue to work"""
    
    def test_command_center_daily_digest(self):
        """Test command center daily digest still works"""
        response = requests.get(f"{BASE_URL}/api/command-center/daily-digest")
        assert response.status_code == 200
        data = response.json()
        
        assert "generated_at" in data
        assert "greeting" in data
        assert "summary" in data
        assert "metrics" in data
        assert "alerts" in data
        assert "ai_recommendations" in data
        assert "schedule" in data
        assert "quick_actions" in data
    
    def test_holdings_portfolio(self):
        """Test holdings portfolio still works"""
        response = requests.get(f"{BASE_URL}/api/holdings/portfolio/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert "client_id" in data
        assert "holdings" in data
        assert "summary" in data
        assert "allocation" in data
    
    def test_wealth_overview(self):
        """Test wealth overview still works"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert "client_id" in data
        assert "asset_allocation" in data
        assert "cash" in data
    
    def test_compliance_dashboard(self):
        """Test compliance dashboard still works"""
        response = requests.get(f"{BASE_URL}/api/compliance/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        assert "overview" in data
        assert "metrics" in data
        assert "risk_alerts" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
