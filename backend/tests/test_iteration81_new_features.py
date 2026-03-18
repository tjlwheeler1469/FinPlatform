"""
Iteration 81 - Testing New Backend Features
=============================================
Tests for:
1. Client Contact API: POST /api/client-contact/send-message, quick-action
2. Financial Plan Generation: POST /api/financial-plan/generate, GET /{plan_id}
3. Fathom Integration: GET /api/fathom/status, meetings, summaries, action-items
4. Knowledge Graph AI: POST /api/graph/ai/ask
5. Graph Actions: POST /api/graph/actions/{id}/adjust with transaction creation
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://knowledge-graph-ui.preview.emergentagent.com')


class TestClientContactAPI:
    """Tests for Client Contact & Messaging System"""
    
    def test_send_message_creates_message_with_id_and_status(self):
        """POST /api/client-contact/send-message should create message with ID and status=delivered"""
        response = requests.post(f"{BASE_URL}/api/client-contact/send-message", json={
            "client_id": "test_client_1",
            "client_name": "Test Client",
            "advisor_email": "advisor@test.com",
            "advisor_name": "Test Advisor",
            "subject": "Test Subject",
            "message": "This is a test message",
            "contact_method": "platform",
            "priority": "normal"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message_id" in data, "Response should have message_id"
        assert data["message_id"].startswith("MSG-"), "Message ID should start with MSG-"
        assert data["status"] == "delivered", f"Expected status 'delivered', got {data['status']}"
        assert "sent_at" in data, "Response should have sent_at timestamp"
        assert "confirmation" in data, "Response should have confirmation message"
        print(f"✓ Message created: {data['message_id']} with status={data['status']}")
    
    def test_send_email_message(self):
        """POST /api/client-contact/send-message with email contact method"""
        response = requests.post(f"{BASE_URL}/api/client-contact/send-message", json={
            "client_id": "test_client_2",
            "client_name": "Email Test Client",
            "advisor_email": "advisor@test.com",
            "advisor_name": "Test Advisor",
            "subject": "Email Test",
            "message": "This is an email test",
            "contact_method": "email",
            "priority": "high"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["delivery_method"] == "email"
        print(f"✓ Email message created: {data['message_id']}")
    
    def test_quick_action_schedule_meeting(self):
        """POST /api/client-contact/quick-action with schedule_meeting action"""
        response = requests.post(f"{BASE_URL}/api/client-contact/quick-action", json={
            "client_id": "test_client_1",
            "client_name": "Test Client",
            "action_type": "schedule_meeting",
            "details": {}
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "action_id" in data, "Response should have action_id"
        assert data["action_id"].startswith("ACT-"), "Action ID should start with ACT-"
        assert data["action_type"] == "schedule_meeting"
        assert "next_steps" in data, "Response should have next_steps"
        assert "message" in data, "Response should have message"
        print(f"✓ Schedule meeting action created: {data['action_id']}")
    
    def test_quick_action_request_statement(self):
        """POST /api/client-contact/quick-action with request_statement action"""
        response = requests.post(f"{BASE_URL}/api/client-contact/quick-action", json={
            "client_id": "test_client_1",
            "client_name": "Test Client",
            "action_type": "request_statement",
            "details": {}
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action_type"] == "request_statement"
        assert "estimated_delivery" in data, "Statement request should have estimated_delivery"
        print(f"✓ Request statement action: {data['action_id']}")
    
    def test_get_client_messages(self):
        """GET /api/client-contact/messages/{client_id} returns messages"""
        # First send a message
        requests.post(f"{BASE_URL}/api/client-contact/send-message", json={
            "client_id": "msg_test_client",
            "client_name": "Msg Test",
            "advisor_email": "advisor@test.com",
            "advisor_name": "Advisor",
            "subject": "Test",
            "message": "Test message"
        })
        
        response = requests.get(f"{BASE_URL}/api/client-contact/messages/msg_test_client")
        assert response.status_code == 200
        data = response.json()
        
        assert "messages" in data
        assert "total_count" in data
        print(f"✓ Client messages retrieved: {data['total_count']} messages")


class TestFinancialPlanAPI:
    """Tests for Financial Plan Generation"""
    
    def test_generate_plan_returns_projections_tax_risk(self):
        """POST /api/financial-plan/generate returns plan with projections, tax analysis, risk assessment"""
        response = requests.post(f"{BASE_URL}/api/financial-plan/generate", json={
            "scenario": {
                "client_id": "test_client_1",
                "client_name": "Test Wheeler Family",
                "transactions": [
                    {
                        "id": 1,
                        "type": "property",
                        "name": "Investment Property",
                        "amount": 850000,
                        "details": {"expected_rental_yield": 4.0, "expected_capital_growth": 5.0}
                    },
                    {
                        "id": 2,
                        "type": "fund",
                        "name": "VAS ETF",
                        "amount": 100000,
                        "details": {"expected_return": 7.0}
                    },
                    {
                        "id": 3,
                        "type": "stock",
                        "name": "BHP Shares",
                        "amount": 50000,
                        "details": {"dividend_yield": 5.0}
                    }
                ],
                "total_value": 1000000,
                "timeframe": 10,
                "goals": ["Retirement", "Wealth Growth"],
                "risk_profile": "moderate"
            },
            "include_tax_analysis": True,
            "include_risk_assessment": True,
            "include_projections": True
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify success and plan structure
        assert data.get("success") == True, "Response should indicate success"
        assert "plan" in data, "Response should have plan object"
        
        plan = data["plan"]
        
        # Verify plan ID
        assert "plan_id" in plan, "Plan should have plan_id"
        assert plan["plan_id"].startswith("PLAN-"), "Plan ID should start with PLAN-"
        
        # Verify projections
        assert "projections" in plan, "Plan should have projections"
        projections = plan["projections"]
        assert "initial_investment" in projections, "Projections should have initial_investment"
        assert "projected_final_value" in projections, "Projections should have projected_final_value"
        assert "annualized_return" in projections, "Projections should have annualized_return"
        assert "yearly_projections" in projections, "Projections should have yearly_projections"
        
        # Verify tax analysis
        assert "tax_analysis" in plan, "Plan should have tax_analysis"
        tax = plan["tax_analysis"]
        assert "estimated_annual_income" in tax, "Tax analysis should have estimated_annual_income"
        assert "cgt_considerations" in tax, "Tax analysis should have CGT considerations"
        
        # Verify risk assessment
        assert "risk_assessment" in plan, "Plan should have risk_assessment"
        risk = plan["risk_assessment"]
        assert "portfolio_risk_score" in risk, "Risk assessment should have portfolio_risk_score"
        assert "diversification_score" in risk, "Risk assessment should have diversification_score"
        
        # Verify executive summary
        assert "executive_summary" in plan, "Plan should have executive_summary"
        
        print(f"✓ Financial plan generated: {plan['plan_id']}")
        print(f"  - Projected final value: ${projections['projected_final_value']:,.0f}")
        print(f"  - Annualized return: {projections['annualized_return']}%")
        print(f"  - Risk score: {risk['portfolio_risk_score']}/10")
        
        return plan["plan_id"]
    
    def test_get_plan_by_id(self):
        """GET /api/financial-plan/{plan_id} retrieves stored plan"""
        # First create a plan
        create_response = requests.post(f"{BASE_URL}/api/financial-plan/generate", json={
            "scenario": {
                "client_id": "test_client_2",
                "client_name": "Plan Retrieval Test",
                "transactions": [{"id": 1, "type": "fund", "name": "Test Fund", "amount": 50000, "details": {}}],
                "total_value": 50000,
                "timeframe": 5,
                "risk_profile": "conservative"
            }
        })
        
        assert create_response.status_code == 200
        plan_id = create_response.json()["plan"]["plan_id"]
        
        # Now retrieve it
        response = requests.get(f"{BASE_URL}/api/financial-plan/{plan_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        plan = response.json()
        assert plan["plan_id"] == plan_id
        print(f"✓ Plan retrieved: {plan_id}")
    
    def test_plan_not_found(self):
        """GET /api/financial-plan/PLAN-NOTEXIST returns 404"""
        response = requests.get(f"{BASE_URL}/api/financial-plan/PLAN-NOTEXIST")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent plan")


class TestFathomIntegration:
    """Tests for Fathom AI Meeting Notes Integration"""
    
    def test_fathom_status(self):
        """GET /api/fathom/status returns integration status"""
        response = requests.get(f"{BASE_URL}/api/fathom/status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify status structure
        assert "status" in data, "Response should have status"
        assert "api_configured" in data, "Response should have api_configured"
        assert "mock_mode" in data, "Response should have mock_mode"
        assert "capabilities" in data, "Response should have capabilities"
        
        # Verify capabilities
        expected_capabilities = ["meeting_transcription", "ai_summary", "action_item_extraction"]
        for cap in expected_capabilities:
            assert cap in data["capabilities"], f"Missing capability: {cap}"
        
        print(f"✓ Fathom status: {data['status']}, mock_mode: {data['mock_mode']}")
    
    def test_list_meetings(self):
        """GET /api/fathom/meetings lists meetings with transcripts and summaries"""
        response = requests.get(f"{BASE_URL}/api/fathom/meetings")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "meetings" in data, "Response should have meetings array"
        assert "total_count" in data, "Response should have total_count"
        
        # Check if mock data is present
        if data["total_count"] > 0:
            meeting = data["meetings"][0]
            assert "meeting_id" in meeting, "Meeting should have meeting_id"
            assert "title" in meeting, "Meeting should have title"
            print(f"✓ Meetings listed: {data['total_count']} meetings, first: {meeting.get('title', 'N/A')}")
        else:
            print("✓ Meetings endpoint working (no meetings yet)")
    
    def test_get_meeting_summary(self):
        """GET /api/fathom/meetings/{id}/summary returns AI summary, key topics, action items"""
        # Use the demo meeting ID
        meeting_id = "MTG-DEMO001"
        response = requests.get(f"{BASE_URL}/api/fathom/meetings/{meeting_id}/summary")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "meeting_id" in data, "Response should have meeting_id"
        assert "summary" in data, "Response should have summary"
        assert "key_topics" in data, "Response should have key_topics"
        assert "action_items" in data, "Response should have action_items"
        
        print(f"✓ Meeting summary retrieved: {data['meeting_id']}")
        print(f"  - Key topics: {len(data.get('key_topics', []))}")
        print(f"  - Action items: {len(data.get('action_items', []))}")
    
    def test_get_meeting_action_items(self):
        """GET /api/fathom/meetings/{id}/action-items returns extracted action items"""
        meeting_id = "MTG-DEMO001"
        response = requests.get(f"{BASE_URL}/api/fathom/meetings/{meeting_id}/action-items")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "meeting_id" in data, "Response should have meeting_id"
        assert "action_items" in data, "Response should have action_items"
        assert "total_count" in data, "Response should have total_count"
        
        # Verify action item structure
        if data["total_count"] > 0:
            item = data["action_items"][0]
            assert "id" in item, "Action item should have id"
            assert "description" in item, "Action item should have description"
            assert "status" in item, "Action item should have status"
        
        print(f"✓ Action items retrieved: {data['total_count']} items")
    
    def test_meeting_not_found(self):
        """GET /api/fathom/meetings/INVALID returns 404"""
        response = requests.get(f"{BASE_URL}/api/fathom/meetings/MTG-INVALID123")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent meeting")


class TestKnowledgeGraphAI:
    """Tests for Knowledge Graph AI Q&A"""
    
    def test_ai_ask_returns_natural_language(self):
        """POST /api/graph/ai/ask returns natural language response (not raw JSON)"""
        response = requests.post(
            f"{BASE_URL}/api/graph/ai/ask",
            params={"question": "Which clients are most at risk for retirement?"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "question" in data, "Response should have question"
        assert "answer" in data, "Response should have answer"
        assert "data_sources_used" in data, "Response should have data_sources_used"
        
        # The answer should be a string (natural language)
        assert isinstance(data["answer"], str), "Answer should be a string"
        
        # Check if answer contains useful information (not just empty)
        assert len(data["answer"]) > 50, "Answer should be substantial"
        
        print(f"✓ AI Q&A working")
        print(f"  Question: {data['question']}")
        print(f"  Answer preview: {data['answer'][:200]}...")
    
    def test_ai_ask_retirement_risk(self):
        """AI should provide retirement risk information"""
        response = requests.post(
            f"{BASE_URL}/api/graph/ai/ask",
            params={"question": "Who is at retirement risk?"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check data sources include retirement risks
        assert "retirement_risks" in data.get("data_sources_used", [])
        print(f"✓ Retirement risk query uses correct data sources")
    
    def test_ai_ask_revenue_opportunities(self):
        """AI should provide revenue opportunity information"""
        response = requests.post(
            f"{BASE_URL}/api/graph/ai/ask",
            params={"question": "What are the revenue opportunities?"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "opportunities" in data.get("data_sources_used", [])
        print(f"✓ Revenue opportunity query uses correct data sources")


class TestGraphActionsExecution:
    """Tests for Graph Actions with Transaction Creation"""
    
    def test_get_pending_actions(self):
        """GET /api/graph/actions/pending returns pending actions"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/pending")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "actions" in data, "Response should have actions"
        assert "count" in data, "Response should have count"
        
        print(f"✓ Pending actions: {data['count']}")
    
    def test_get_action_details(self):
        """GET /api/graph/actions/{id}/details returns action with adjustable params"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/action_1/details")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "action" in data, "Response should have action"
        assert "adjustable_parameters" in data, "Response should have adjustable_parameters"
        
        # Verify adjustable parameters structure
        params = data["adjustable_parameters"]
        assert isinstance(params, list), "adjustable_parameters should be a list"
        
        if len(params) > 0:
            param = params[0]
            assert "name" in param, "Parameter should have name"
            assert "min" in param, "Parameter should have min"
            assert "max" in param, "Parameter should have max"
            assert "default" in param, "Parameter should have default"
        
        print(f"✓ Action details retrieved with {len(params)} adjustable parameters")
    
    def test_adjust_and_execute_action_creates_transaction(self):
        """POST /api/graph/actions/{id}/adjust executes action and creates transaction record"""
        # First check if action_1 is pending
        details_response = requests.get(f"{BASE_URL}/api/graph/actions/action_1/details")
        
        if details_response.status_code != 200:
            pytest.skip("Action action_1 not found, skipping execution test")
            return
        
        action_data = details_response.json()
        if action_data.get("action", {}).get("status") != "pending":
            # Try action_2 or action_3
            for action_id in ["action_2", "action_3"]:
                alt_response = requests.get(f"{BASE_URL}/api/graph/actions/{action_id}/details")
                if alt_response.status_code == 200:
                    alt_data = alt_response.json()
                    if alt_data.get("action", {}).get("status") == "pending":
                        test_action_id = action_id
                        break
            else:
                pytest.skip("No pending actions available for execution test")
                return
        else:
            test_action_id = "action_1"
        
        # Execute with adjustments
        response = requests.post(
            f"{BASE_URL}/api/graph/actions/{test_action_id}/adjust",
            json={
                "amount": 25000,
                "timeframe": 7,
                "price_limit": 5
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "message" in data, "Response should have message"
        assert "action" in data, "Response should have action"
        assert "transaction" in data, "Response should have transaction"
        
        # Verify transaction was created
        transaction = data["transaction"]
        assert "id" in transaction, "Transaction should have id"
        assert transaction["id"].startswith("txn_"), "Transaction ID should start with txn_"
        assert "executed_at" in transaction, "Transaction should have executed_at"
        assert "action_id" in transaction, "Transaction should reference action_id"
        
        # Verify adjustments were applied
        if "adjustments" in data:
            assert data["adjustments"].get("amount") == 25000
        
        print(f"✓ Action executed and transaction created: {transaction['id']}")
    
    def test_execute_nonexistent_action(self):
        """POST /api/graph/actions/INVALID/adjust returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/graph/actions/action_invalid_xyz/adjust",
            json={"amount": 1000}
        )
        assert response.status_code == 404
        print("✓ 404 returned for non-existent action")


class TestHealthEndpoint:
    """Basic health check"""
    
    def test_health_endpoint(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed, version: {data.get('version', 'N/A')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
