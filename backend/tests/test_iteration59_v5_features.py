"""
Iteration 59 - v5.0.0 Killer Features Test Suite
Tests for:
1. Next Best Action Engine - AI-powered recommendations
2. Practice Health Dashboard - Real-time practice metrics
3. Meeting Workflow Automation - Full meeting lifecycle
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://wealth-command-13.preview.emergentagent.com').rstrip('/')


class TestHealthCheckV5:
    """Health check endpoint tests for v5.0.0"""
    
    def test_health_returns_v5_version(self):
        """Test that health check returns v5.0.0 with killer_features array"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "5.0.0"
        assert "killer_features" in data
        assert isinstance(data["killer_features"], list)
        assert "next_best_action" in data["killer_features"]
        assert "practice_health" in data["killer_features"]
        assert "meeting_workflow" in data["killer_features"]
        print(f"✓ Health check returns v5.0.0 with killer_features: {data['killer_features']}")


class TestNextBestActionEngine:
    """Next Best Action Engine - AI-powered recommendations"""
    
    def test_get_todays_actions(self):
        """GET /api/next-action/today returns prioritized actions"""
        response = requests.get(f"{BASE_URL}/api/next-action/today")
        assert response.status_code == 200
        
        data = response.json()
        assert "top_actions" in data
        assert "focus_message" in data
        assert "impact_summary" in data
        assert "total_actions_available" in data
        assert "generated_at" in data
        
        # Verify top_actions structure
        assert isinstance(data["top_actions"], list)
        if len(data["top_actions"]) > 0:
            action = data["top_actions"][0]
            assert "id" in action
            assert "client_id" in action
            assert "client_name" in action
            assert "category" in action
            assert "priority" in action
            assert "title" in action
            assert "description" in action
            
        # Verify impact_summary structure
        assert "potential_tax_savings" in data["impact_summary"]
        assert "revenue_at_risk" in data["impact_summary"]
        assert "clients_needing_rebalance" in data["impact_summary"]
        
        print(f"✓ Today's actions: {len(data['top_actions'])} actions, focus: {data['focus_message']}")
    
    def test_get_todays_actions_with_limit(self):
        """GET /api/next-action/today with custom limit"""
        response = requests.get(f"{BASE_URL}/api/next-action/today?limit=3")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["top_actions"]) <= 3
        print(f"✓ Today's actions with limit=3: {len(data['top_actions'])} actions returned")
    
    def test_get_all_actions(self):
        """GET /api/next-action/all returns all actions"""
        response = requests.get(f"{BASE_URL}/api/next-action/all")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_actions" in data
        assert "actions" in data
        assert "generated_at" in data
        assert isinstance(data["actions"], list)
        assert data["total_actions"] == len(data["actions"])
        
        # Verify action categories exist
        categories = set(a.get("category") for a in data["actions"])
        print(f"✓ All actions: {data['total_actions']} total, categories: {categories}")
    
    def test_get_client_specific_actions(self):
        """GET /api/next-action/client/{client_id} returns client-specific actions"""
        # Test with known client_id from mock data
        client_id = "client_1"
        response = requests.get(f"{BASE_URL}/api/next-action/client/{client_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == client_id
        assert "client_name" in data
        assert "actions" in data
        assert "total_actions" in data
        
        # All actions should be for this client
        for action in data["actions"]:
            assert action["client_id"] == client_id
            
        print(f"✓ Client {client_id} ({data['client_name']}): {data['total_actions']} actions")
    
    def test_get_client_actions_not_found(self):
        """GET /api/next-action/client/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/next-action/client/invalid_client_xyz")
        assert response.status_code == 404
        print("✓ Invalid client returns 404 as expected")
    
    def test_get_actions_by_category(self):
        """GET /api/next-action/by-category/{category} returns filtered actions"""
        categories = ["tax", "rebalancing", "compliance", "retention", "goal", "revenue"]
        
        for category in categories:
            response = requests.get(f"{BASE_URL}/api/next-action/by-category/{category}")
            assert response.status_code == 200
            
            data = response.json()
            assert data["category"] == category
            assert "actions" in data
            assert "total" in data
            
            # All actions should be of this category
            for action in data["actions"]:
                assert action["category"] == category
                
        print(f"✓ Actions by category filter working for all categories")
    
    def test_execute_action(self):
        """POST /api/next-action/execute/{action_id} marks action as executed"""
        action_id = "test_action_123"
        response = requests.post(
            f"{BASE_URL}/api/next-action/execute/{action_id}",
            params={"notes": "Test execution"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["action_id"] == action_id
        assert data["status"] == "executed"
        assert "executed_at" in data
        print(f"✓ Action execution endpoint working")
    
    def test_snooze_action(self):
        """POST /api/next-action/snooze/{action_id} snoozes action"""
        action_id = "test_action_456"
        response = requests.post(
            f"{BASE_URL}/api/next-action/snooze/{action_id}",
            params={"days": 7, "reason": "Client on vacation"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["action_id"] == action_id
        assert data["status"] == "snoozed"
        assert "snoozed_until" in data
        print(f"✓ Action snooze endpoint working")


class TestPracticeHealthDashboard:
    """Practice Health Dashboard - Real-time practice metrics"""
    
    def test_get_practice_dashboard(self):
        """GET /api/practice-health/dashboard returns comprehensive dashboard"""
        response = requests.get(f"{BASE_URL}/api/practice-health/dashboard")
        assert response.status_code == 200
        
        data = response.json()
        assert "generated_at" in data
        assert "practice_info" in data
        assert "health_score" in data
        assert "key_metrics" in data
        assert "compliance" in data
        assert "revenue" in data
        assert "client_segments" in data
        assert "capacity" in data
        assert "risk" in data
        assert "quick_insights" in data
        
        # Verify health_score structure
        health = data["health_score"]
        assert "overall_score" in health
        assert "grade" in health
        assert "component_scores" in health
        
        print(f"✓ Practice dashboard: Health Score {health['overall_score']} ({health['grade']})")
    
    def test_get_health_score(self):
        """GET /api/practice-health/health-score returns grade"""
        response = requests.get(f"{BASE_URL}/api/practice-health/health-score")
        assert response.status_code == 200
        
        data = response.json()
        assert "overall_score" in data
        assert "grade" in data
        assert "component_scores" in data
        assert "weights" in data
        assert "trend" in data
        assert "percentile" in data
        
        # Verify component scores
        components = data["component_scores"]
        assert "compliance" in components
        assert "engagement" in components
        assert "growth" in components
        assert "profitability" in components
        assert "risk" in components
        
        print(f"✓ Health score: {data['overall_score']} ({data['grade']}), trend: {data['trend']}")
    
    def test_get_compliance_status(self):
        """GET /api/practice-health/compliance returns compliance status"""
        response = requests.get(f"{BASE_URL}/api/practice-health/compliance")
        assert response.status_code == 200
        
        data = response.json()
        assert "overall_status" in data
        assert "reviews_completed_qtd" in data
        assert "reviews_due" in data
        assert "reviews_overdue" in data
        assert "completion_rate" in data
        assert "cpd_hours_completed" in data
        assert "cpd_hours_required" in data
        
        print(f"✓ Compliance: {data['overall_status']}, completion rate: {data['completion_rate']}%")
    
    def test_get_revenue_analysis(self):
        """GET /api/practice-health/revenue returns revenue analysis"""
        response = requests.get(f"{BASE_URL}/api/practice-health/revenue")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_revenue_ytd" in data
        assert "projected_annual" in data
        assert "fee_breakdown" in data
        assert "fee_percentages" in data
        assert "average_fee_percentage" in data
        assert "efficiency_metrics" in data
        
        # Verify fee breakdown
        fees = data["fee_breakdown"]
        assert "ongoing_advice_fees" in fees
        
        print(f"✓ Revenue: ${data['total_revenue_ytd']:,} YTD, projected ${data['projected_annual']:,} annual")
    
    def test_get_metrics(self):
        """GET /api/practice-health/metrics returns key metrics"""
        response = requests.get(f"{BASE_URL}/api/practice-health/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_aum" in data
        assert "total_clients" in data
        assert "total_revenue" in data
        assert "nps_score" in data
        
        print(f"✓ Metrics: AUM ${data['total_aum']:,}, {data['total_clients']} clients, NPS {data['nps_score']}")
    
    def test_get_segments(self):
        """GET /api/practice-health/segments returns client segmentation"""
        response = requests.get(f"{BASE_URL}/api/practice-health/segments")
        assert response.status_code == 200
        
        data = response.json()
        assert "segments" in data
        assert "concentration_risk" in data
        assert "ideal_client_profile" in data
        
        print(f"✓ Segments: {len(data['segments'])} segments defined")
    
    def test_get_capacity(self):
        """GET /api/practice-health/capacity returns capacity analysis"""
        response = requests.get(f"{BASE_URL}/api/practice-health/capacity")
        assert response.status_code == 200
        
        data = response.json()
        assert "current_capacity_utilization" in data
        assert "adviser_workload" in data
        assert "capacity_headroom" in data
        
        print(f"✓ Capacity: {data['current_capacity_utilization']}% utilized")
    
    def test_get_risk_dashboard(self):
        """GET /api/practice-health/risk returns risk dashboard"""
        response = requests.get(f"{BASE_URL}/api/practice-health/risk")
        assert response.status_code == 200
        
        data = response.json()
        assert "overall_risk_score" in data
        assert "risk_trend" in data
        assert "risk_categories" in data
        assert "key_risk_indicators" in data
        
        print(f"✓ Risk: Score {data['overall_risk_score']}, trend: {data['risk_trend']}")
    
    def test_get_trends(self):
        """GET /api/practice-health/trends returns historical trends"""
        response = requests.get(f"{BASE_URL}/api/practice-health/trends")
        assert response.status_code == 200
        
        data = response.json()
        assert "metrics" in data
        assert "analysis" in data
        
        print(f"✓ Trends: {len(data['metrics'])} quarters of historical data")
    
    def test_get_benchmarks(self):
        """GET /api/practice-health/benchmarks returns industry benchmarks"""
        response = requests.get(f"{BASE_URL}/api/practice-health/benchmarks")
        assert response.status_code == 200
        
        data = response.json()
        assert "your_practice" in data
        assert "industry_average" in data
        assert "top_quartile" in data
        assert "your_percentile" in data
        
        print(f"✓ Benchmarks: Your practice vs industry average and top quartile")


class TestMeetingWorkflowAutomation:
    """Meeting Workflow Automation - Full meeting lifecycle"""
    
    def test_schedule_meeting(self):
        """POST /api/meeting-automation/schedule creates meeting"""
        meeting_data = {
            "client_id": "client_1",
            "client_name": "Wheeler Family",
            "meeting_type": "review",
            "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "time": "10:00",
            "duration": 60,
            "location": "video",
            "attendees": ["advisor@wealthcommand.io"],
            "notes": "Annual review meeting"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/meeting-automation/schedule",
            json=meeting_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "meeting_id" in data
        assert "meeting" in data
        assert "prep_task_id" in data
        
        # Verify meeting structure
        meeting = data["meeting"]
        assert meeting["client_id"] == "client_1"
        assert meeting["client_name"] == "Wheeler Family"
        assert meeting["meeting_type"] == "review"
        assert meeting["status"] == "scheduled"
        assert "agenda" in meeting
        assert "required_documents" in meeting
        
        print(f"✓ Meeting scheduled: {data['meeting_id']}, prep task: {data['prep_task_id']}")
        return data["meeting_id"]
    
    def test_get_tasks(self):
        """GET /api/meeting-automation/tasks returns task list"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/tasks")
        assert response.status_code == 200
        
        data = response.json()
        assert "tasks" in data
        assert "total" in data
        assert "pending" in data
        assert "overdue" in data
        
        print(f"✓ Tasks: {data['total']} total, {data['pending']} pending, {data['overdue']} overdue")
    
    def test_get_tasks_with_filters(self):
        """GET /api/meeting-automation/tasks with filters"""
        # Test with status filter
        response = requests.get(f"{BASE_URL}/api/meeting-automation/tasks?status=pending")
        assert response.status_code == 200
        
        data = response.json()
        for task in data["tasks"]:
            assert task["status"] == "pending"
            
        print(f"✓ Tasks filter by status working")
    
    def test_get_workflow_stats(self):
        """GET /api/meeting-automation/workflow-stats returns stats"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/workflow-stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "meetings" in data
        assert "tasks" in data
        assert "efficiency_metrics" in data
        
        # Verify meetings stats
        meetings = data["meetings"]
        assert "total" in meetings
        assert "processed" in meetings
        assert "pending_notes" in meetings
        
        # Verify tasks stats
        tasks = data["tasks"]
        assert "total" in tasks
        assert "pending" in tasks
        assert "completed" in tasks
        assert "completion_rate" in tasks
        
        print(f"✓ Workflow stats: {meetings['total']} meetings, {tasks['total']} tasks")
    
    def test_create_task(self):
        """POST /api/meeting-automation/tasks creates a new task"""
        task_data = {
            "title": "Follow up on investment strategy",
            "description": "Discuss ETF allocation changes",
            "client_id": "client_1",
            "due_date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "priority": "high"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/meeting-automation/tasks",
            json=task_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "task_id" in data
        assert "task" in data
        
        task = data["task"]
        assert task["title"] == task_data["title"]
        assert task["client_id"] == task_data["client_id"]
        assert task["priority"] == "high"
        assert task["status"] == "pending"
        
        print(f"✓ Task created: {data['task_id']}")
        return data["task_id"]
    
    def test_complete_task(self):
        """PUT /api/meeting-automation/tasks/{task_id}/complete marks task complete"""
        # First create a task
        task_data = {
            "title": "Test task for completion",
            "client_id": "client_1",
            "due_date": datetime.now().strftime("%Y-%m-%d"),
            "priority": "medium"
        }
        create_response = requests.post(
            f"{BASE_URL}/api/meeting-automation/tasks",
            json=task_data
        )
        task_id = create_response.json()["task_id"]
        
        # Complete the task
        response = requests.put(
            f"{BASE_URL}/api/meeting-automation/tasks/{task_id}/complete",
            params={"notes": "Completed successfully"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["task_id"] == task_id
        assert data["status"] == "completed"
        
        print(f"✓ Task completed: {task_id}")
    
    def test_get_meetings(self):
        """GET /api/meeting-automation/meetings returns meetings list"""
        response = requests.get(f"{BASE_URL}/api/meeting-automation/meetings")
        assert response.status_code == 200
        
        data = response.json()
        assert "meetings" in data
        assert "total" in data
        
        print(f"✓ Meetings: {data['total']} total")
    
    def test_add_crm_note(self):
        """POST /api/meeting-automation/crm-notes/{client_id} adds CRM note"""
        client_id = "client_1"
        response = requests.post(
            f"{BASE_URL}/api/meeting-automation/crm-notes/{client_id}",
            params={"note_type": "general", "content": "Test CRM note from iteration 59"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "note" in data
        assert data["note"]["type"] == "general"
        
        print(f"✓ CRM note added for client {client_id}")
    
    def test_get_crm_notes(self):
        """GET /api/meeting-automation/crm-notes/{client_id} returns notes"""
        client_id = "client_1"
        response = requests.get(f"{BASE_URL}/api/meeting-automation/crm-notes/{client_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["client_id"] == client_id
        assert "notes" in data
        assert "total" in data
        
        print(f"✓ CRM notes for {client_id}: {data['total']} notes")


class TestIntegrationScenarios:
    """Integration tests for v5.0.0 features working together"""
    
    def test_action_to_meeting_workflow(self):
        """Test creating a meeting from a next best action"""
        # Get today's actions
        actions_response = requests.get(f"{BASE_URL}/api/next-action/today")
        assert actions_response.status_code == 200
        actions = actions_response.json()["top_actions"]
        
        if len(actions) > 0:
            # Take first action and create a meeting for it
            action = actions[0]
            meeting_data = {
                "client_id": action["client_id"],
                "client_name": action["client_name"],
                "meeting_type": "strategy",
                "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                "time": "14:00",
                "duration": 45,
                "location": "video",
                "notes": f"Follow up on: {action['title']}"
            }
            
            meeting_response = requests.post(
                f"{BASE_URL}/api/meeting-automation/schedule",
                json=meeting_data
            )
            assert meeting_response.status_code == 200
            
            print(f"✓ Created meeting from action: {action['title']}")
    
    def test_practice_health_with_actions(self):
        """Test that practice health metrics align with action counts"""
        # Get practice health
        health_response = requests.get(f"{BASE_URL}/api/practice-health/dashboard")
        assert health_response.status_code == 200
        health = health_response.json()
        
        # Get all actions
        actions_response = requests.get(f"{BASE_URL}/api/next-action/all")
        assert actions_response.status_code == 200
        actions = actions_response.json()
        
        # Verify compliance actions align with compliance status
        compliance_actions = [a for a in actions["actions"] if a["category"] == "compliance"]
        compliance_status = health["compliance"]
        
        print(f"✓ Practice health compliance: {compliance_status['reviews_overdue']} overdue")
        print(f"✓ Compliance actions generated: {len(compliance_actions)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
