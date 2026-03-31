"""
Iteration 83 - Testing MongoDB Persistence for Client Contact and Financial Plan
Tests:
1. POST /api/client-contact/send-message - Persist messages to MongoDB
2. GET /api/client-contact/messages/{client_id} - Retrieve messages from MongoDB
3. POST /api/financial-plan/generate - Generate and persist plan to MongoDB
4. GET /api/financial-plan/{plan_id} - Retrieve plan from MongoDB
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

class TestClientContactPersistence:
    """Test Client Contact API with MongoDB Persistence"""
    
    @pytest.fixture
    def test_message_data(self):
        """Generate unique test message data"""
        unique_id = uuid.uuid4().hex[:8]
        return {
            "client_id": f"TEST_client_{unique_id}",
            "client_name": f"Test Client {unique_id}",
            "advisor_email": "test.advisor@wealthcommand.io",
            "advisor_name": "Test Advisor",
            "subject": f"Test Message Subject {unique_id}",
            "message": f"Test message content from pytest - {unique_id}",
            "contact_method": "platform",
            "priority": "normal"
        }
    
    def test_send_message_returns_success(self, test_message_data):
        """POST /api/client-contact/send-message should return success with message_id"""
        response = requests.post(
            f"{BASE_URL}/api/client-contact/send-message",
            json=test_message_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message_id" in data, "Response should include message_id"
        assert data["status"] == "delivered", f"Expected status 'delivered', got {data.get('status')}"
        assert data["delivery_method"] == "platform", f"Delivery method should match request"
        assert "confirmation" in data, "Response should include confirmation message"
        
        print(f"✅ Message sent successfully: {data['message_id']}")
        return data["message_id"], test_message_data["client_id"]
    
    def test_retrieve_messages_from_mongodb(self, test_message_data):
        """Test full flow: Send message -> Retrieve from MongoDB"""
        # Send message first
        send_response = requests.post(
            f"{BASE_URL}/api/client-contact/send-message",
            json=test_message_data
        )
        assert send_response.status_code == 200
        sent_message = send_response.json()
        message_id = sent_message["message_id"]
        client_id = test_message_data["client_id"]
        
        # Retrieve messages for client
        get_response = requests.get(
            f"{BASE_URL}/api/client-contact/messages/{client_id}"
        )
        
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        
        data = get_response.json()
        assert "messages" in data, "Response should include messages array"
        assert "total_count" in data, "Response should include total_count"
        assert data["client_id"] == client_id, "Client ID should match"
        
        # Verify sent message is in the retrieved list
        messages = data["messages"]
        found_message = None
        for msg in messages:
            if msg.get("message_id") == message_id:
                found_message = msg
                break
        
        assert found_message is not None, f"Message {message_id} should be in retrieved messages"
        assert found_message["subject"] == test_message_data["subject"], "Subject should match"
        assert found_message["message"] == test_message_data["message"], "Message content should match"
        
        print(f"✅ Message persisted and retrieved: {message_id}")
        print(f"   Total messages for client: {data['total_count']}")
    
    def test_mark_message_read(self, test_message_data):
        """Test marking a message as read"""
        # Send message first
        send_response = requests.post(
            f"{BASE_URL}/api/client-contact/send-message",
            json=test_message_data
        )
        message_id = send_response.json()["message_id"]
        
        # Mark as read
        read_response = requests.post(
            f"{BASE_URL}/api/client-contact/mark-read/{message_id}"
        )
        
        assert read_response.status_code == 200, f"Expected 200, got {read_response.status_code}"
        data = read_response.json()
        assert data["success"] is True
        assert data["status"] == "read"
        
        print(f"✅ Message marked as read: {message_id}")


class TestFinancialPlanPersistence:
    """Test Financial Plan API with MongoDB Persistence"""
    
    @pytest.fixture
    def test_plan_request(self):
        """Generate unique test plan request data"""
        unique_id = uuid.uuid4().hex[:8]
        return {
            "scenario": {
                "client_id": f"TEST_client_{unique_id}",
                "client_name": f"Test Client {unique_id}",
                "transactions": [
                    {
                        "id": 1,
                        "type": "stock",
                        "name": "Test Stock Investment",
                        "amount": 50000,
                        "details": {
                            "symbol": "CBA",
                            "expected_return": 8.0
                        }
                    },
                    {
                        "id": 2,
                        "type": "etf",
                        "name": "Test ETF Investment",
                        "amount": 30000,
                        "details": {
                            "etf_name": "VAS",
                            "expected_return": 7.5
                        }
                    }
                ],
                "total_value": 80000,
                "timeframe": 10,
                "goals": ["Retirement"],
                "risk_profile": "moderate"
            },
            "include_tax_analysis": True,
            "include_risk_assessment": True,
            "include_projections": True
        }
    
    def test_generate_plan_returns_success(self, test_plan_request):
        """POST /api/financial-plan/generate should return success with plan_id"""
        response = requests.post(
            f"{BASE_URL}/api/financial-plan/generate",
            json=test_plan_request,
            timeout=30  # Plan generation can take a bit longer
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] is True, "Response should indicate success"
        assert "plan" in data, "Response should include plan object"
        
        plan = data["plan"]
        assert "plan_id" in plan, "Plan should have plan_id"
        assert plan["plan_id"].startswith("PLAN-"), "Plan ID should start with PLAN-"
        assert "executive_summary" in plan, "Plan should include executive_summary"
        assert "projections" in plan, "Plan should include projections"
        assert "tax_analysis" in plan, "Plan should include tax_analysis"
        assert "risk_assessment" in plan, "Plan should include risk_assessment"
        
        print(f"✅ Financial plan generated: {plan['plan_id']}")
        return plan["plan_id"]
    
    def test_retrieve_plan_from_mongodb(self, test_plan_request):
        """Test full flow: Generate plan -> Retrieve from MongoDB"""
        # Generate plan first
        gen_response = requests.post(
            f"{BASE_URL}/api/financial-plan/generate",
            json=test_plan_request,
            timeout=30
        )
        assert gen_response.status_code == 200
        plan_id = gen_response.json()["plan"]["plan_id"]
        
        # Retrieve plan
        get_response = requests.get(f"{BASE_URL}/api/financial-plan/{plan_id}")
        
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        
        plan = get_response.json()
        assert plan["plan_id"] == plan_id, "Plan ID should match"
        assert plan["client"]["id"] == test_plan_request["scenario"]["client_id"], "Client ID should match"
        assert plan["client"]["name"] == test_plan_request["scenario"]["client_name"], "Client name should match"
        assert "projections" in plan, "Retrieved plan should have projections"
        assert "tax_analysis" in plan, "Retrieved plan should have tax_analysis"
        
        print(f"✅ Plan persisted and retrieved: {plan_id}")
        print(f"   Projected final value: ${plan['projections'].get('projected_final_value', 0):,.0f}")
    
    def test_retrieve_nonexistent_plan_returns_404(self):
        """GET /api/financial-plan/{nonexistent_id} should return 404"""
        response = requests.get(f"{BASE_URL}/api/financial-plan/PLAN-NONEXISTENT")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Correctly returns 404 for nonexistent plan")
    
    def test_plan_projections_structure(self, test_plan_request):
        """Verify projections are calculated correctly"""
        response = requests.post(
            f"{BASE_URL}/api/financial-plan/generate",
            json=test_plan_request,
            timeout=30
        )
        assert response.status_code == 200
        
        plan = response.json()["plan"]
        projections = plan["projections"]
        
        assert "initial_investment" in projections, "Should have initial_investment"
        assert "projected_final_value" in projections, "Should have projected_final_value"
        assert "annualized_return" in projections, "Should have annualized_return"
        assert "yearly_projections" in projections, "Should have yearly_projections"
        
        # Verify initial investment matches
        assert projections["initial_investment"] == test_plan_request["scenario"]["total_value"]
        
        # Verify yearly projections has correct length
        assert len(projections["yearly_projections"]) == test_plan_request["scenario"]["timeframe"] + 1
        
        print(f"✅ Projections calculated correctly")
        print(f"   Initial: ${projections['initial_investment']:,.0f}")
        print(f"   Final: ${projections['projected_final_value']:,.0f}")
        print(f"   Annualized return: {projections['annualized_return']}%")


class TestTransactionModelerIntegration:
    """Test Transaction Modeler API integration"""
    
    def test_fund_modeling_endpoint(self):
        """Test fund modeling returns valid projections"""
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/fund?client_id=test_client",
            json={
                "transaction_type": "buy",
                "fund_name": "VAS",
                "amount": 100000,
                "expected_return": 7.0,
                "management_fee": 0.10,
                "distribution_yield": 3.5,
                "projection_years": 10
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "analysis" in data, "Response should include analysis"
        print("✅ Fund modeling endpoint working")
    
    def test_stock_modeling_endpoint(self):
        """Test stock modeling returns valid projections"""
        response = requests.post(
            f"{BASE_URL}/api/transaction-modeling/stock?client_id=test_client",
            json={
                "transaction_type": "buy",
                "symbol": "CBA",
                "shares": 100,
                "price_per_share": 120,
                "expected_return": 8.0,
                "dividend_yield": 4.5,
                "purchase_date": "2023-01-01",
                "purchase_price": 95
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "analysis" in data, "Response should include analysis"
        print("✅ Stock modeling endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
