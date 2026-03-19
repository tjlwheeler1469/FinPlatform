"""
Test Suite for Wealth Command v7.4.0 - Iteration 68
New features:
1. Feedback & Learning System at /api/feedback-loop/*
2. Enhanced Execution Engine at /api/execution-engine/*
3. Real-Time Data Layer at /api/realtime-data/*
4. Health endpoint with 32 capabilities
"""
import pytest
import requests
import os

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://scenario-modeler.preview.emergentagent.com"

class TestHealthEndpoint:
    """Test v7.4.0 health endpoint with 32 capabilities"""
    
    def test_health_returns_v740(self):
        """Verify health endpoint returns version 7.4.0"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "7.4.0"
        assert data["status"] == "healthy"
        print(f"✓ Health endpoint returns version 7.4.0")
    
    def test_health_has_32_capabilities(self):
        """Verify health endpoint lists 32 capabilities"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        capabilities = data.get("capabilities", [])
        assert len(capabilities) >= 32, f"Expected 32+ capabilities, got {len(capabilities)}"
        print(f"✓ Health endpoint lists {len(capabilities)} capabilities")
    
    def test_health_has_feedback_loop_section(self):
        """Verify health endpoint includes feedback_loop section"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "feedback_loop" in data
        fb = data["feedback_loop"]
        assert fb.get("advisor_preferences") == True
        assert fb.get("outcome_tracking") == True
        assert fb.get("personalized_recommendations") == True
        assert fb.get("learning_system") == True
        print("✓ Health endpoint includes complete feedback_loop section")
    
    def test_health_has_new_capabilities(self):
        """Verify health endpoint includes new v7.4.0 capabilities"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        capabilities = data.get("capabilities", [])
        required_caps = [
            "feedback_learning",
            "execution_loop_closure",
            "realtime_data_layer",
            "single_source_of_truth"
        ]
        for cap in required_caps:
            assert cap in capabilities, f"Missing capability: {cap}"
        print("✓ Health endpoint includes all new v7.4.0 capabilities")


class TestFeedbackLearningSystem:
    """Test Feedback & Learning System at /api/feedback-loop/*"""
    
    def test_learning_status(self):
        """GET /api/feedback-loop/learning-status returns learning system status"""
        response = requests.get(f"{BASE_URL}/api/feedback-loop/learning-status")
        assert response.status_code == 200
        data = response.json()
        assert "learning_system" in data
        assert data["learning_system"]["status"] == "active"
        assert "total_feedback_points" in data["learning_system"]
        assert "total_outcome_records" in data["learning_system"]
        print("✓ GET /api/feedback-loop/learning-status returns active status")
    
    def test_recommendations_for_advisor(self):
        """GET /api/feedback-loop/recommendations/{advisor_id} returns personalized recommendations"""
        response = requests.get(f"{BASE_URL}/api/feedback-loop/recommendations/default")
        assert response.status_code == 200
        data = response.json()
        assert data["advisor_id"] == "default"
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
        assert len(data["recommendations"]) > 0
        # Check recommendation structure
        rec = data["recommendations"][0]
        assert "action_type" in rec
        assert "title" in rec
        assert "personalized_score" in rec
        print(f"✓ GET /api/feedback-loop/recommendations/default returns {len(data['recommendations'])} recommendations")
    
    def test_advisor_analytics(self):
        """GET /api/feedback-loop/analytics/{advisor_id} returns advisor analytics"""
        response = requests.get(f"{BASE_URL}/api/feedback-loop/analytics/default")
        assert response.status_code == 200
        data = response.json()
        assert data["advisor_id"] == "default"
        assert "summary" in data
        assert "learning_progress" in data
        assert "preferences" in data
        print("✓ GET /api/feedback-loop/analytics/default returns comprehensive analytics")
    
    def test_record_feedback(self):
        """POST /api/feedback-loop/feedback records feedback on recommendation"""
        payload = {
            "action_id": "test_action_001",
            "action_type": "rebalance",
            "feedback_type": "accepted",
            "advisor_id": "test_advisor",
            "reason": "Good recommendation"
        }
        response = requests.post(
            f"{BASE_URL}/api/feedback-loop/feedback",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "feedback_id" in data
        assert data["preferences_updated"] == True
        print(f"✓ POST /api/feedback-loop/feedback records feedback with ID: {data['feedback_id']}")
    
    def test_simulate_learning(self):
        """POST /api/feedback-loop/simulate-learning simulates learning data"""
        response = requests.post(
            f"{BASE_URL}/api/feedback-loop/simulate-learning?advisor_id=test_advisor&num_actions=5"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["simulated_feedback"] == 5
        assert "simulated_outcomes" in data
        print(f"✓ POST /api/feedback-loop/simulate-learning simulated {data['simulated_feedback']} actions")
    
    def test_learning_insights(self):
        """GET /api/feedback-loop/insights/{advisor_id} returns AI insights"""
        response = requests.get(f"{BASE_URL}/api/feedback-loop/insights/default")
        assert response.status_code == 200
        data = response.json()
        assert data["advisor_id"] == "default"
        assert "insights" in data
        assert "recommendations_for_improvement" in data
        print(f"✓ GET /api/feedback-loop/insights/default returns {len(data.get('insights', []))} insights")


class TestEnhancedExecutionEngine:
    """Test Enhanced Execution Engine at /api/execution-engine/*"""
    
    def test_loop_status(self):
        """GET /api/execution-engine/loop-status returns execution loop health"""
        response = requests.get(f"{BASE_URL}/api/execution-engine/loop-status")
        assert response.status_code == 200
        data = response.json()
        assert "loop_health" in data
        assert "components" in data
        # Check all components are active
        components = data["components"]
        for comp in ["insight_generation", "decision_support", "action_execution", 
                     "portfolio_update", "crm_update", "outcome_capture", "learning_system"]:
            assert components.get(comp) == "active", f"Component {comp} not active"
        print("✓ GET /api/execution-engine/loop-status shows all components active")
    
    def test_execute_action(self):
        """POST /api/execution-engine/execute executes an action through the full loop"""
        payload = {
            "action_type": "buy",
            "client_id": "client_001",
            "details": {
                "symbol": "AAPL",
                "action": "buy",
                "shares": 10
            },
            "advisor_id": "test_advisor",
            "auto_update_crm": True,
            "capture_feedback": True
        }
        response = requests.post(
            f"{BASE_URL}/api/execution-engine/execute",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert "execution_id" in data
        assert "steps_completed" in data
        assert "validation" in data["steps_completed"]
        assert "execution" in data["steps_completed"]
        assert data["portfolio_updated"] == True
        assert data["crm_updated"] == True
        assert data["outcome_captured"] == True
        print(f"✓ POST /api/execution-engine/execute completed with loop_closed={data.get('loop_closed')}")
    
    def test_get_executions(self):
        """GET /api/execution-engine/executions returns execution history"""
        response = requests.get(f"{BASE_URL}/api/execution-engine/executions")
        assert response.status_code == 200
        data = response.json()
        assert "executions" in data
        assert "total" in data
        assert "completed" in data
        print(f"✓ GET /api/execution-engine/executions returns {data['total']} executions")
    
    def test_get_execution_metrics(self):
        """GET /api/execution-engine/metrics returns execution metrics"""
        response = requests.get(f"{BASE_URL}/api/execution-engine/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "metrics_by_action_type" in data
        assert "total_executions" in data
        print(f"✓ GET /api/execution-engine/metrics returns {data['total_executions']} total executions")
    
    def test_execute_from_insight(self):
        """POST /api/execution-engine/execute-insight executes from insight (preview mode)"""
        response = requests.post(
            f"{BASE_URL}/api/execution-engine/execute-insight?insight_id=rebalance_001&advisor_id=test_advisor&auto_execute=false"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["auto_executed"] == False
        assert "preview" in data
        assert "proposed_action" in data["preview"]
        print("✓ POST /api/execution-engine/execute-insight returns preview without auto-execute")


class TestRealtimeDataLayer:
    """Test Real-Time Data Layer at /api/realtime-data/*"""
    
    def test_data_layer_status(self):
        """GET /api/realtime-data/status returns data layer status"""
        response = requests.get(f"{BASE_URL}/api/realtime-data/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert data["mode"] == "demo"
        assert data["single_source_of_truth"] == True
        assert "data_sources" in data
        print("✓ GET /api/realtime-data/status returns operational in demo mode")
    
    def test_get_all_portfolios(self):
        """GET /api/realtime-data/portfolios returns all portfolios"""
        response = requests.get(f"{BASE_URL}/api/realtime-data/portfolios")
        assert response.status_code == 200
        data = response.json()
        assert "portfolios" in data
        assert len(data["portfolios"]) >= 3
        assert "summary" in data
        assert "total_aum" in data["summary"]
        print(f"✓ GET /api/realtime-data/portfolios returns {len(data['portfolios'])} portfolios with ${data['summary']['total_aum']:,.0f} AUM")
    
    def test_get_single_portfolio(self):
        """GET /api/realtime-data/portfolios/{client_id} returns specific portfolio"""
        response = requests.get(f"{BASE_URL}/api/realtime-data/portfolios/client_001")
        assert response.status_code == 200
        data = response.json()
        assert "portfolio" in data
        portfolio = data["portfolio"]
        assert portfolio["client_id"] == "client_001"
        assert "client_name" in portfolio
        assert "holdings" in portfolio
        assert "cash" in portfolio
        print(f"✓ GET /api/realtime-data/portfolios/client_001 returns {portfolio['client_name']}")
    
    def test_get_market_data(self):
        """GET /api/realtime-data/market-data returns market data"""
        response = requests.get(f"{BASE_URL}/api/realtime-data/market-data")
        assert response.status_code == 200
        data = response.json()
        assert "prices" in data
        assert "AAPL" in data["prices"]
        assert "MSFT" in data["prices"]
        assert "NVDA" in data["prices"]
        print(f"✓ GET /api/realtime-data/market-data returns {len(data['prices'])} symbols")
    
    def test_get_drift_analysis(self):
        """GET /api/realtime-data/insights/drift returns drift analysis"""
        response = requests.get(f"{BASE_URL}/api/realtime-data/insights/drift")
        assert response.status_code == 200
        data = response.json()
        assert "drift_analysis" in data
        assert "clients_with_drift" in data
        assert "target_allocation" in data
        print(f"✓ GET /api/realtime-data/insights/drift returns {data['clients_with_drift']} clients with drift")
    
    def test_execute_trade(self):
        """POST /api/realtime-data/execute-trade executes a trade"""
        response = requests.post(
            f"{BASE_URL}/api/realtime-data/execute-trade?client_id=client_001&symbol=AAPL&action=buy&shares=5&reason=test"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "trade_id" in data
        assert "execution" in data
        assert data["portfolio_updated"] == True
        print(f"✓ POST /api/realtime-data/execute-trade executed {data['execution']['action']} {data['execution']['shares']} {data['execution']['symbol']}")
    
    def test_refresh_data(self):
        """POST /api/realtime-data/refresh refreshes all data"""
        response = requests.post(f"{BASE_URL}/api/realtime-data/refresh")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["updated"]["market_data"] == True
        assert data["updated"]["portfolios"] == True
        print("✓ POST /api/realtime-data/refresh successfully refreshed data")
    
    def test_get_integration_status(self):
        """GET /api/realtime-data/integration-status returns integration status"""
        response = requests.get(f"{BASE_URL}/api/realtime-data/integration-status")
        assert response.status_code == 200
        data = response.json()
        assert "available_integrations" in data
        assert "alpaca" in data["available_integrations"]
        assert "yahoo_finance" in data["available_integrations"]
        assert data["current_mode"] == "demo"
        print("✓ GET /api/realtime-data/integration-status shows available integrations")
    
    def test_get_client_transactions(self):
        """GET /api/realtime-data/transactions/{client_id} returns transactions"""
        response = requests.get(f"{BASE_URL}/api/realtime-data/transactions/client_001")
        assert response.status_code == 200
        data = response.json()
        assert data["client_id"] == "client_001"
        assert "transactions" in data
        # After our test trade, should have transactions
        print(f"✓ GET /api/realtime-data/transactions/client_001 returns {len(data['transactions'])} transactions")


class TestRecordOutcome:
    """Test outcome recording for learning system"""
    
    def test_record_outcome(self):
        """POST /api/feedback-loop/outcome records action outcome"""
        payload = {
            "action_id": "test_action_002",
            "action_type": "rebalance",
            "status": "success",
            "client_ids": ["client_001"],
            "advisor_id": "test_advisor",
            "metrics": {
                "portfolio_impact": 15000,
                "revenue_impact": 500,
                "tax_savings": 0
            },
            "notes": "Test outcome"
        }
        response = requests.post(
            f"{BASE_URL}/api/feedback-loop/outcome",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "outcome_id" in data
        print(f"✓ POST /api/feedback-loop/outcome recorded with ID: {data['outcome_id']}")
    
    def test_get_outcomes(self):
        """GET /api/feedback-loop/outcomes returns outcome history"""
        response = requests.get(f"{BASE_URL}/api/feedback-loop/outcomes?days=30")
        assert response.status_code == 200
        data = response.json()
        assert "outcomes" in data
        assert "aggregate_metrics" in data
        assert "period_days" in data
        print(f"✓ GET /api/feedback-loop/outcomes returns {len(data['outcomes'])} outcomes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
