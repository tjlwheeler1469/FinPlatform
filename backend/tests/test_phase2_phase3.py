"""
Test suite for Phase 2 (CRM, Goals, Compliance) and Phase 3 (AI Advisor, Portfolio Aggregator) APIs
Tests all new endpoints for the financial dashboard decision engine
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCRMHouseholds:
    """Test CRM Households endpoints"""
    
    def test_get_households_returns_200(self):
        """GET /api/crm/households returns 200 with households list"""
        response = requests.get(f"{BASE_URL}/api/crm/households")
        assert response.status_code == 200
        data = response.json()
        assert "households" in data
        assert "total" in data
        assert isinstance(data["households"], list)
        print(f"✓ GET /api/crm/households - Returns {data['total']} households")
    
    def test_get_households_returns_3_sample_households(self):
        """GET /api/crm/households returns 3 sample households"""
        response = requests.get(f"{BASE_URL}/api/crm/households")
        assert response.status_code == 200
        data = response.json()
        assert len(data["households"]) >= 3
        
        # Verify household structure
        household = data["households"][0]
        assert "household_id" in household
        assert "name" in household
        assert "primary_contact" in household
        assert "status" in household
        assert "total_assets" in household
        assert "net_worth" in household
        print("✓ Households have correct structure with required fields")
    
    def test_get_household_by_id(self):
        """GET /api/crm/households/{household_id} returns specific household"""
        response = requests.get(f"{BASE_URL}/api/crm/households/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        assert data["household_id"] == "hh_wheeler001"
        assert "Wheeler" in data["name"]
        assert "members" in data
        print("✓ GET /api/crm/households/hh_wheeler001 - Returns Wheeler Family")


class TestCRMTasks:
    """Test CRM Tasks endpoints"""
    
    def test_get_tasks_returns_200(self):
        """GET /api/crm/tasks returns 200 with tasks list"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert "total" in data
        assert isinstance(data["tasks"], list)
        print(f"✓ GET /api/crm/tasks - Returns {data['total']} tasks")
    
    def test_tasks_have_required_fields(self):
        """Tasks have all required fields"""
        response = requests.get(f"{BASE_URL}/api/crm/tasks")
        assert response.status_code == 200
        data = response.json()
        assert len(data["tasks"]) > 0
        
        task = data["tasks"][0]
        assert "task_id" in task
        assert "title" in task
        assert "priority" in task
        assert "status" in task
        assert "category" in task
        print("✓ Tasks have required fields: task_id, title, priority, status, category")
    
    def test_create_task(self):
        """POST /api/crm/tasks creates a new task"""
        task_data = {
            "household_id": "hh_wheeler001",
            "title": "TEST_Task_Review",
            "description": "Test task for automated testing",
            "priority": "medium",
            "category": "general"
        }
        response = requests.post(f"{BASE_URL}/api/crm/tasks", json=task_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert "task_id" in data
        print(f"✓ POST /api/crm/tasks - Created task {data['task_id']}")


class TestCRMMeetings:
    """Test CRM Meetings endpoints"""
    
    def test_get_meetings_returns_200(self):
        """GET /api/crm/meetings returns 200 with meetings list"""
        response = requests.get(f"{BASE_URL}/api/crm/meetings")
        assert response.status_code == 200
        data = response.json()
        assert "meetings" in data
        assert "total" in data
        assert isinstance(data["meetings"], list)
        print(f"✓ GET /api/crm/meetings - Returns {data['total']} meetings")
    
    def test_meetings_have_required_fields(self):
        """Meetings have all required fields"""
        response = requests.get(f"{BASE_URL}/api/crm/meetings")
        assert response.status_code == 200
        data = response.json()
        assert len(data["meetings"]) > 0
        
        meeting = data["meetings"][0]
        assert "meeting_id" in meeting
        assert "title" in meeting
        assert "meeting_type" in meeting
        assert "scheduled_at" in meeting
        assert "duration_minutes" in meeting
        assert "location" in meeting
        print("✓ Meetings have required fields: meeting_id, title, meeting_type, scheduled_at, duration_minutes, location")


class TestCRMNotes:
    """Test CRM Notes endpoints"""
    
    def test_get_notes_returns_200(self):
        """GET /api/crm/notes/{household_id} returns 200 with notes list"""
        response = requests.get(f"{BASE_URL}/api/crm/notes/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        assert "notes" in data
        assert isinstance(data["notes"], list)
        print(f"✓ GET /api/crm/notes/hh_wheeler001 - Returns {len(data['notes'])} notes")
    
    def test_create_note(self):
        """POST /api/crm/notes creates a new note"""
        note_data = {
            "household_id": "hh_wheeler001",
            "content": "TEST_Note for automated testing",
            "note_type": "general"
        }
        response = requests.post(f"{BASE_URL}/api/crm/notes", json=note_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert "note_id" in data
        print(f"✓ POST /api/crm/notes - Created note {data['note_id']}")


class TestGoalTracker:
    """Test Goal Tracker endpoints"""
    
    def test_get_goals_returns_200(self):
        """GET /api/goals/{household_id} returns 200 with goals list"""
        response = requests.get(f"{BASE_URL}/api/goals/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        assert "goals" in data
        assert "total" in data
        assert isinstance(data["goals"], list)
        print(f"✓ GET /api/goals/hh_wheeler001 - Returns {data['total']} goals")
    
    def test_get_goals_returns_4_goals(self):
        """GET /api/goals/hh_wheeler001 returns 4 goals"""
        response = requests.get(f"{BASE_URL}/api/goals/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        assert len(data["goals"]) >= 4
        print("✓ Goals endpoint returns at least 4 goals")
    
    def test_goals_have_progress_percent(self):
        """Goals have progress_percent field"""
        response = requests.get(f"{BASE_URL}/api/goals/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        for goal in data["goals"]:
            assert "goal_id" in goal
            assert "name" in goal
            assert "goal_type" in goal
            assert "target_amount" in goal
            assert "current_amount" in goal
            assert "progress_percent" in goal
            assert 0 <= goal["progress_percent"] <= 100
        print("✓ All goals have progress_percent between 0-100")
    
    def test_goals_include_retirement_education_house_emergency(self):
        """Goals include retirement, education, house, and emergency types"""
        response = requests.get(f"{BASE_URL}/api/goals/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        goal_types = [g["goal_type"] for g in data["goals"]]
        assert "retirement" in goal_types
        assert "education" in goal_types
        assert "house" in goal_types
        assert "emergency" in goal_types
        print("✓ Goals include all 4 types: retirement, education, house, emergency")
    
    def test_create_goal(self):
        """POST /api/goals creates a new goal"""
        goal_data = {
            "household_id": "hh_wheeler001",
            "name": "TEST_Goal_Travel",
            "goal_type": "travel",
            "target_amount": 50000,
            "current_amount": 10000,
            "monthly_contribution": 500,
            "priority": "low"
        }
        response = requests.post(f"{BASE_URL}/api/goals", json=goal_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert "goal_id" in data
        print(f"✓ POST /api/goals - Created goal {data['goal_id']}")


class TestAIAdvisor:
    """Test AI Advisor endpoints"""
    
    def test_generate_advice_returns_200(self):
        """POST /api/ai/generate-advice returns 200 with AI recommendations"""
        request_data = {
            "household_id": "hh_wheeler001",
            "context": {
                "net_worth": 1978000,
                "total_assets": 2920000,
                "total_debt": 942000,
                "annual_income": 253400,
                "age": 45,
                "retirement_age": 65,
                "risk_profile": "moderate"
            },
            "question": "What are the top 3 actions I should take right now?",
            "advice_type": "general"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-advice", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert "advice_id" in data
        assert "recommendations" in data
        print(f"✓ POST /api/ai/generate-advice - Returns AI advice {data['advice_id']}")
    
    def test_ai_advice_has_recommendations(self):
        """AI advice includes recommendations with required fields"""
        request_data = {
            "household_id": "hh_wheeler001",
            "context": {"net_worth": 1978000},
            "question": "How can I reduce my tax?",
            "advice_type": "tax"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-advice", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["recommendations"]) >= 3
        rec = data["recommendations"][0]
        assert "rank" in rec
        assert "title" in rec
        assert "description" in rec
        assert "impact" in rec
        assert "confidence" in rec
        assert "timeframe" in rec
        print("✓ AI recommendations have required fields: rank, title, description, impact, confidence, timeframe")
    
    def test_ai_advice_has_analysis(self):
        """AI advice includes analysis section"""
        request_data = {
            "household_id": "hh_wheeler001",
            "context": {"net_worth": 1978000},
            "question": "Am I on track for retirement?",
            "advice_type": "retirement"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-advice", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "analysis" in data
        assert "key_strengths" in data["analysis"]
        assert "areas_for_improvement" in data["analysis"]
        print("✓ AI advice includes analysis with key_strengths and areas_for_improvement")
    
    def test_ai_advice_has_retirement_outlook(self):
        """AI advice includes retirement outlook"""
        request_data = {
            "household_id": "hh_wheeler001",
            "context": {"net_worth": 1978000, "age": 45},
            "question": "What is my retirement outlook?",
            "advice_type": "general"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-advice", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "retirement_outlook" in data
        assert "success_probability" in data["retirement_outlook"]
        print("✓ AI advice includes retirement_outlook with success_probability")
    
    def test_ai_advice_has_disclaimers(self):
        """AI advice includes disclaimers"""
        request_data = {
            "household_id": "hh_wheeler001",
            "context": {},
            "question": "Should I invest more?",
            "advice_type": "investment"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-advice", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "disclaimers" in data
        assert len(data["disclaimers"]) > 0
        print(f"✓ AI advice includes {len(data['disclaimers'])} disclaimers")
    
    def test_ai_advice_has_llm_metadata(self):
        """AI advice includes LLM metadata"""
        request_data = {
            "household_id": "hh_wheeler001",
            "context": {},
            "question": "Test question",
            "advice_type": "general"
        }
        response = requests.post(f"{BASE_URL}/api/ai/generate-advice", json=request_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "llm_metadata" in data
        assert "confidence_score" in data["llm_metadata"]
        print(f"✓ AI advice includes llm_metadata with confidence_score: {data['llm_metadata']['confidence_score']}")
    
    def test_get_advice_history(self):
        """GET /api/ai/advice-history/{household_id} returns advice history"""
        response = requests.get(f"{BASE_URL}/api/ai/advice-history/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        assert "advice_history" in data
        assert "total" in data
        print(f"✓ GET /api/ai/advice-history - Returns {data['total']} advice records")


class TestPortfolioAggregator:
    """Test Portfolio Aggregator endpoints"""
    
    def test_get_aggregated_portfolio_returns_200(self):
        """GET /api/portfolio/aggregated/{household_id} returns 200"""
        response = requests.get(f"{BASE_URL}/api/portfolio/aggregated/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        assert "household_id" in data
        assert data["household_id"] == "hh_wheeler001"
        print("✓ GET /api/portfolio/aggregated/hh_wheeler001 - Returns 200")
    
    def test_aggregated_portfolio_has_totals(self):
        """Aggregated portfolio has total_assets, total_liabilities, net_worth"""
        response = requests.get(f"{BASE_URL}/api/portfolio/aggregated/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_assets" in data
        assert "total_liabilities" in data
        assert "net_worth" in data
        assert data["total_assets"] > 0
        assert data["net_worth"] == data["total_assets"] - data["total_liabilities"]
        print(f"✓ Portfolio totals: Assets={data['total_assets']}, Liabilities={data['total_liabilities']}, Net Worth={data['net_worth']}")
    
    def test_aggregated_portfolio_has_9_accounts(self):
        """Aggregated portfolio returns 9 connected accounts"""
        response = requests.get(f"{BASE_URL}/api/portfolio/aggregated/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        assert "accounts" in data
        assert len(data["accounts"]) >= 9
        print(f"✓ Portfolio has {len(data['accounts'])} connected accounts")
    
    def test_accounts_have_required_fields(self):
        """Accounts have all required fields"""
        response = requests.get(f"{BASE_URL}/api/portfolio/aggregated/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        for account in data["accounts"]:
            assert "account_id" in account
            assert "institution" in account
            assert "account_type" in account
            assert "account_name" in account
            assert "balance" in account
            assert "status" in account
            assert "last_synced" in account
        print("✓ All accounts have required fields")
    
    def test_accounts_include_all_types(self):
        """Accounts include bank, super, brokerage, mortgage types"""
        response = requests.get(f"{BASE_URL}/api/portfolio/aggregated/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        account_types = [a["account_type"] for a in data["accounts"]]
        assert "bank" in account_types
        assert "super" in account_types
        assert "brokerage" in account_types
        assert "mortgage" in account_types
        print("✓ Accounts include all types: bank, super, brokerage, mortgage")
    
    def test_aggregated_portfolio_has_asset_allocation(self):
        """Aggregated portfolio has asset allocation breakdown"""
        response = requests.get(f"{BASE_URL}/api/portfolio/aggregated/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        assert "asset_allocation" in data
        allocation = data["asset_allocation"]
        assert "cash" in allocation
        assert "shares" in allocation
        assert "super" in allocation
        assert "property" in allocation
        
        # Verify allocation has amount and percent
        for key, value in allocation.items():
            assert "amount" in value
            assert "percent" in value
        print("✓ Asset allocation includes cash, shares, super, property with amounts and percentages")
    
    def test_aggregated_portfolio_has_monthly_snapshot(self):
        """Aggregated portfolio has monthly snapshot"""
        response = requests.get(f"{BASE_URL}/api/portfolio/aggregated/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        
        assert "monthly_snapshot" in data
        snapshot = data["monthly_snapshot"]
        assert "income" in snapshot
        assert "expenses" in snapshot
        assert "savings" in snapshot
        assert "savings_rate" in snapshot
        print(f"✓ Monthly snapshot: Income={snapshot['income']}, Expenses={snapshot['expenses']}, Savings={snapshot['savings']}")
    
    def test_sync_portfolio(self):
        """POST /api/portfolio/sync/{household_id} syncs all accounts"""
        response = requests.post(f"{BASE_URL}/api/portfolio/sync/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert "synced_at" in data
        print(f"✓ POST /api/portfolio/sync - Synced at {data['synced_at']}")


class TestComplianceLayer:
    """Test Compliance Layer endpoints"""
    
    def test_get_audit_log_returns_200(self):
        """GET /api/compliance/audit-log returns 200"""
        response = requests.get(f"{BASE_URL}/api/compliance/audit-log")
        assert response.status_code == 200
        data = response.json()
        assert "audit_log" in data
        assert "total" in data
        print(f"✓ GET /api/compliance/audit-log - Returns {data['total']} audit entries")
    
    def test_get_risk_assessment(self):
        """GET /api/compliance/risk-assessment/{household_id} returns risk assessment"""
        response = requests.get(f"{BASE_URL}/api/compliance/risk-assessment/hh_wheeler001")
        assert response.status_code == 200
        data = response.json()
        assert "risk_score" in data
        assert "risk_profile" in data
        assert "recommendation" in data
        print(f"✓ Risk assessment: Score={data['risk_score']}, Profile={data['risk_profile']}")


class TestAdviceWorkflow:
    """Test Advice Workflow endpoints"""
    
    def test_get_advice_records(self):
        """GET /api/advice/records returns advice records"""
        response = requests.get(f"{BASE_URL}/api/advice/records")
        assert response.status_code == 200
        data = response.json()
        assert "records" in data
        assert "total" in data
        print(f"✓ GET /api/advice/records - Returns {data['total']} advice records")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
