"""
Iteration 67 - Phase 6, 7, 8 Complete Testing
Tests Meeting Automation Engine, Client Portal, Advanced AI Copilot, and Batch Execution
Version: 7.3.0 with 28 capabilities
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://retire-dash-1.preview.emergentagent.com').rstrip('/')

class TestHealthAndStatus:
    """Health check and version verification"""
    
    def test_health_check_v7_3_0(self):
        """Verify backend is healthy at v7.3.0 with 28 capabilities"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "7.3.0"
        assert len(data["capabilities"]) == 28
        # Verify new Phase 6, 7, 8 capabilities
        assert "meeting_to_everything" in data["capabilities"]
        assert "batch_execution" in data["capabilities"]
        assert "client_portal" in data["capabilities"]
        assert "ai_copilot_advanced" in data["capabilities"]
        assert "natural_language_queries" in data["capabilities"]
        print(f"✓ Health check passed: v{data['version']} with {len(data['capabilities'])} capabilities")


class TestMeetingAutomationEngine:
    """Phase 6 - Meeting Automation Engine Tests"""
    
    def test_meeting_automation_dashboard(self):
        """GET /api/meeting-automation/dashboard - Meeting automation stats"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "total_meetings_processed" in data["summary"]
        assert "pending_tasks" in data["summary"]
        assert "draft_emails_pending" in data["summary"]
        assert "time_saved_hours" in data["summary"]
        print(f"✓ Meeting dashboard: {data['summary']['total_meetings_processed']} meetings processed")
    
    def test_meeting_automation_process(self):
        """POST /api/meeting-automation/process - Process meeting transcript"""
        payload = {
            "client_id": "test_client_001",
            "client_name": "Test Client",
            "meeting_type": "annual_review",
            "transcript": "This is a test meeting transcript discussing retirement planning and investment strategy. The client expressed concerns about market volatility and wants to ensure their portfolio is properly diversified. We discussed increasing super contributions and reviewed their risk profile. Action items include reviewing the portfolio allocation and sending a follow-up email."
        }
        response = requests.post(f"{BASE_URL}/api/meeting-automation/process", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "meeting_id" in data
        assert "summary" in data
        assert "outputs" in data
        assert "stats" in data
        # Verify outputs generated
        assert data["stats"]["crm_updates_generated"] > 0
        assert data["stats"]["tasks_created"] > 0
        assert data["stats"]["emails_drafted"] > 0
        assert data["stats"]["compliance_notes_logged"] > 0
        print(f"✓ Meeting processed: {data['stats']['tasks_created']} tasks, {data['stats']['emails_drafted']} emails")
        return data["meeting_id"]
    
    def test_meeting_automation_tasks(self):
        """GET /api/meeting-automation/tasks - Get generated tasks"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/tasks")
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert "total" in data
        assert "pending" in data
        print(f"✓ Tasks retrieved: {data['total']} total, {data['pending']} pending")
    
    def test_meeting_automation_emails(self):
        """GET /api/meeting-automation/emails - Get draft emails"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/emails")
        assert response.status_code == 200
        data = response.json()
        assert "emails" in data
        assert "total" in data
        print(f"✓ Emails retrieved: {data['total']} total")


class TestBatchExecution:
    """Phase 6 - Batch Execution Layer Tests"""
    
    def test_batch_execution_status(self):
        """GET /api/batch-execution/status - Batch execution system status"""
        response = requests.get(f"{BASE_URL}/api/batch-execution/status")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert "alpaca_connected" in data
        assert "demo_mode" in data
        assert "pending_batches" in data
        assert "total_executions" in data
        print(f"✓ Batch execution status: {data['status']}, Alpaca: {'connected' if data['alpaca_connected'] else 'demo mode'}")
    
    def test_batch_execution_one_click_actions(self):
        """GET /api/batch-execution/one-click-actions - AI-identified execution actions"""
        response = requests.get(f"{BASE_URL}/api/batch-execution/one-click-actions")
        assert response.status_code == 200
        data = response.json()
        assert "actions" in data
        assert "total" in data
        assert "high_priority" in data
        assert len(data["actions"]) >= 3  # Should have rebalance, tax harvest, deploy cash
        # Verify action structure
        for action in data["actions"]:
            assert "action_id" in action
            assert "title" in action
            assert "description" in action
            assert "affected_clients" in action
            assert "execution_type" in action
        print(f"✓ One-click actions: {data['total']} actions, {data['high_priority']} high priority")
    
    def test_batch_execution_preview_rebalance(self):
        """POST /api/batch-execution/preview/rebalance - Preview rebalancing trades"""
        client_ids = ["client_1", "client_2"]
        response = requests.post(f"{BASE_URL}/api/batch-execution/preview/rebalance", json=client_ids)
        assert response.status_code == 200
        data = response.json()
        assert "preview_id" in data
        assert data["execution_type"] == "rebalance"
        assert "clients" in data
        assert "summary" in data
        assert "requires_approval" in data
        print(f"✓ Rebalance preview: {data['summary']['total_trades']} trades across {data['summary']['total_clients']} clients")
    
    def test_batch_execution_preview_tax_harvest(self):
        """POST /api/batch-execution/preview/tax-harvest - Preview tax harvesting trades"""
        client_ids = ["client_1", "client_2", "client_3"]
        response = requests.post(f"{BASE_URL}/api/batch-execution/preview/tax-harvest", json=client_ids)
        assert response.status_code == 200
        data = response.json()
        assert "preview_id" in data
        assert data["execution_type"] == "tax_harvest"
        assert "clients" in data
        assert "summary" in data
        assert "total_potential_tax_savings" in data["summary"]
        print(f"✓ Tax harvest preview: ${data['summary']['total_potential_tax_savings']:,.0f} potential savings")
    
    def test_batch_execution_execute(self):
        """POST /api/batch-execution/execute - Execute batch trades"""
        payload = {
            "execution_type": "rebalance",
            "client_ids": ["client_1"],
            "reason": "Test batch execution",
            "auto_execute": False
        }
        response = requests.post(f"{BASE_URL}/api/batch-execution/execute", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "batch_id" in data
        assert "trades_generated" in data
        assert data["requires_approval"] is True  # auto_execute was False
        print(f"✓ Batch created: {data['batch_id']}, {data['trades_generated']} trades")
    
    def test_batch_execution_batches(self):
        """GET /api/batch-execution/batches - Get all batch jobs"""
        response = requests.get(f"{BASE_URL}/api/batch-execution/batches")
        assert response.status_code == 200
        data = response.json()
        assert "batches" in data
        assert "total" in data
        print(f"✓ Batches retrieved: {data['total']} total")


class TestClientPortal:
    """Phase 7 - Client Portal Tests"""
    
    def test_client_portal_dashboard(self):
        """GET /api/client-portal/dashboard/{client_id} - Client portal dashboard"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "name" in data
        assert "household" in data
        assert "advisor" in data
        assert "summary" in data
        # Verify summary fields
        assert "net_worth" in data["summary"]
        assert "goals_count" in data["summary"]
        assert "goals_on_track" in data["summary"]
        print(f"✓ Client dashboard: {data['name']}, Net Worth: ${data['summary']['net_worth']:,.0f}")
    
    def test_client_portal_net_worth(self):
        """GET /api/client-portal/net-worth/{client_id} - Client net worth breakdown"""
        response = requests.get(f"{BASE_URL}/api/client-portal/net-worth/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "current" in data
        assert "history" in data
        assert "assets" in data
        assert "liabilities" in data
        # Verify current net worth structure
        assert "total" in data["current"]
        assert "breakdown" in data["current"]
        print(f"✓ Net worth: ${data['current']['total']:,.0f}")
    
    def test_client_portal_portfolios(self):
        """GET /api/client-portal/portfolios/{client_id} - Client portfolios"""
        response = requests.get(f"{BASE_URL}/api/client-portal/portfolios/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "portfolios" in data
        assert "summary" in data
        # Verify portfolio structure
        assert len(data["portfolios"]) > 0
        for portfolio in data["portfolios"]:
            assert "portfolio_id" in portfolio
            assert "name" in portfolio
            assert "value" in portfolio
            assert "holdings" in portfolio
        print(f"✓ Portfolios: {data['summary']['portfolio_count']} portfolios, ${data['summary']['total_value']:,.0f}")
    
    def test_client_portal_goals(self):
        """GET /api/client-portal/goals/{client_id} - Client financial goals"""
        response = requests.get(f"{BASE_URL}/api/client-portal/goals/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "goals" in data
        assert "summary" in data
        # Verify goals structure
        assert len(data["goals"]) > 0
        for goal in data["goals"]:
            assert "goal_id" in goal
            assert "name" in goal
            assert "target_amount" in goal
            assert "current_amount" in goal
            assert "progress_pct" in goal
            assert "status" in goal
        print(f"✓ Goals: {data['summary']['total_goals']} goals, {data['summary']['on_track']} on track")
    
    def test_client_portal_insights(self):
        """GET /api/client-portal/insights/{client_id} - Client insights"""
        response = requests.get(f"{BASE_URL}/api/client-portal/insights/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "insights" in data
        print(f"✓ Insights: {len(data['insights'])} insights")
    
    def test_client_portal_notifications(self):
        """GET /api/client-portal/notifications/{client_id} - Client notifications"""
        response = requests.get(f"{BASE_URL}/api/client-portal/notifications/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "notifications" in data
        assert "unread_count" in data
        print(f"✓ Notifications: {len(data['notifications'])} total, {data['unread_count']} unread")
    
    def test_client_portal_documents(self):
        """GET /api/client-portal/documents/{client_id} - Client documents"""
        response = requests.get(f"{BASE_URL}/api/client-portal/documents/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "documents" in data
        assert "pending_signature" in data
        print(f"✓ Documents: {len(data['documents'])} documents, {data['pending_signature']} pending signature")
    
    def test_client_portal_performance(self):
        """GET /api/client-portal/performance-summary/{client_id} - Performance summary"""
        response = requests.get(f"{BASE_URL}/api/client-portal/performance-summary/portal_001")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "performance" in data
        assert "risk_metrics" in data
        assert "income" in data
        print(f"✓ Performance: YTD {data['performance']['ytd_return']}%")


class TestAICopilotAdvanced:
    """Phase 8 - Advanced AI Copilot Tests"""
    
    def test_ai_copilot_query_rebalancing(self):
        """POST /api/ai-copilot/query - Natural language query about rebalancing"""
        payload = {"query": "Which clients need rebalancing?"}
        response = requests.post(f"{BASE_URL}/api/ai-copilot/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "query_id" in data
        assert "query" in data
        assert "category" in data
        assert data["category"] == "portfolios"
        assert "response" in data
        assert "answer" in data["response"]
        assert "data" in data["response"]
        assert "suggestions" in data["response"]
        print(f"✓ Query 'rebalancing': {data['category']} category, {len(data['response']['data'])} clients found")
    
    def test_ai_copilot_query_retirement_risk(self):
        """POST /api/ai-copilot/query - Natural language query about retirement risk"""
        payload = {"query": "Who is at retirement risk?"}
        response = requests.post(f"{BASE_URL}/api/ai-copilot/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "risk"
        assert "data" in data["response"]
        print(f"✓ Query 'retirement risk': {len(data['response']['data'])} clients at risk")
    
    def test_ai_copilot_query_compliance(self):
        """POST /api/ai-copilot/query - Natural language query about compliance"""
        payload = {"query": "What compliance items need attention?"}
        response = requests.post(f"{BASE_URL}/api/ai-copilot/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "compliance"
        assert "data" in data["response"]
        print(f"✓ Query 'compliance': {len(data['response']['data'])} items need attention")
    
    def test_ai_copilot_query_tax(self):
        """POST /api/ai-copilot/query - Natural language query about tax opportunities"""
        payload = {"query": "Show me tax-loss harvesting opportunities"}
        response = requests.post(f"{BASE_URL}/api/ai-copilot/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "portfolios"
        assert "data" in data["response"]
        print(f"✓ Query 'tax': {len(data['response']['data'])} opportunities found")
    
    def test_ai_copilot_suggestions(self):
        """GET /api/ai-copilot/suggestions - Query suggestions"""
        response = requests.get(f"{BASE_URL}/api/ai-copilot/suggestions")
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert "high_priority" in data
        assert len(data["suggestions"]) >= 5
        # Verify suggestion structure
        for suggestion in data["suggestions"]:
            assert "query" in suggestion
            assert "category" in suggestion
            assert "urgency" in suggestion
            assert "preview" in suggestion
        print(f"✓ Suggestions: {len(data['suggestions'])} suggestions, {data['high_priority']} high priority")
    
    def test_ai_copilot_quick_insights(self):
        """GET /api/ai-copilot/quick-insights - Quick dashboard insights"""
        response = requests.get(f"{BASE_URL}/api/ai-copilot/quick-insights")
        assert response.status_code == 200
        data = response.json()
        assert "insights" in data
        assert len(data["insights"]) >= 4
        # Verify insight structure
        for insight in data["insights"]:
            assert "category" in insight
            assert "title" in insight
            assert "value" in insight
            assert "action" in insight
        print(f"✓ Quick insights: {len(data['insights'])} insights")
    
    def test_ai_copilot_conversation_starters(self):
        """GET /api/ai-copilot/conversation-starters - Daily conversation starters"""
        response = requests.get(f"{BASE_URL}/api/ai-copilot/conversation-starters")
        assert response.status_code == 200
        data = response.json()
        assert "starters" in data
        assert "daily_focus" in data
        assert len(data["starters"]) >= 3
        print(f"✓ Conversation starters: {len(data['starters'])} starters")


class TestIntegration:
    """Integration tests across all phases"""
    
    def test_meeting_to_batch_execution_flow(self):
        """Test meeting → task → batch execution flow"""
        # 1. Process a meeting about rebalancing
        meeting_payload = {
            "client_id": "integration_test_001",
            "client_name": "Integration Test Client",
            "meeting_type": "strategy_session",
            "transcript": "Discussed portfolio allocation and need to rebalance the investment holdings. Client wants to reduce tech exposure and increase fixed income. Will need to execute rebalancing trades across all accounts."
        }
        meeting_res = requests.post(f"{BASE_URL}/api/meeting-automation/process", json=meeting_payload)
        assert meeting_res.status_code == 200
        meeting_data = meeting_res.json()
        
        # 2. Verify tasks were created
        tasks_res = requests.get(f"{BASE_URL}/api/meeting-automation/tasks?status=pending")
        assert tasks_res.status_code == 200
        
        # 3. Check one-click actions are available
        actions_res = requests.get(f"{BASE_URL}/api/batch-execution/one-click-actions")
        assert actions_res.status_code == 200
        actions_data = actions_res.json()
        
        # 4. Verify batch execution is ready
        status_res = requests.get(f"{BASE_URL}/api/batch-execution/status")
        assert status_res.status_code == 200
        
        print(f"✓ Integration flow: Meeting processed → {meeting_data['stats']['tasks_created']} tasks → {actions_data['total']} batch actions available")
    
    def test_client_portal_comprehensive(self):
        """Test all client portal endpoints work together"""
        client_id = "portal_001"
        
        # Get all client data
        dashboard_res = requests.get(f"{BASE_URL}/api/client-portal/dashboard/{client_id}")
        net_worth_res = requests.get(f"{BASE_URL}/api/client-portal/net-worth/{client_id}")
        portfolios_res = requests.get(f"{BASE_URL}/api/client-portal/portfolios/{client_id}")
        goals_res = requests.get(f"{BASE_URL}/api/client-portal/goals/{client_id}")
        
        assert all([
            dashboard_res.status_code == 200,
            net_worth_res.status_code == 200,
            portfolios_res.status_code == 200,
            goals_res.status_code == 200
        ])
        
        dashboard = dashboard_res.json()
        net_worth = net_worth_res.json()
        portfolios = portfolios_res.json()
        goals = goals_res.json()
        
        # Verify data consistency
        assert dashboard["summary"]["net_worth"] == net_worth["current"]["total"]
        assert dashboard["summary"]["goals_count"] == goals["summary"]["total_goals"]
        
        print(f"✓ Client portal comprehensive: {dashboard['name']} - ${dashboard['summary']['net_worth']:,.0f} net worth, {goals['summary']['total_goals']} goals")
    
    def test_ai_copilot_multiple_queries(self):
        """Test multiple AI copilot queries in sequence"""
        queries = [
            "Which clients need rebalancing?",
            "Who is at retirement risk?",
            "Show me tax opportunities",
            "What compliance items need attention?",
            "Who are my highest value clients?"
        ]
        
        for query in queries:
            response = requests.post(f"{BASE_URL}/api/ai-copilot/query", json={"query": query})
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            assert "answer" in data["response"]
        
        print(f"✓ AI Copilot: {len(queries)} queries processed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
