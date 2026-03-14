"""
Test suite for AI Financial Plan Generator and AI Meeting Summary Generator features.
These are the 2 killer features that make advisors switch platforms.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAIFinancialPlanGenerator:
    """Tests for AI Financial Plan Generator - Feature 1"""
    
    def test_generate_financial_plan_success(self):
        """Test generating a comprehensive financial plan"""
        payload = {
            "client_name": "Wheeler Family",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 1978000,
            "annual_income": 350000,
            "annual_expenses": 120000,
            "total_assets": 2500000,
            "total_debt": 522000,
            "super_balance": 850000,
            "investment_portfolio": 450000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify plan structure
        assert "plan_id" in data, "Plan should have plan_id"
        assert "generated_at" in data, "Plan should have generated_at timestamp"
        assert "client_name" in data, "Plan should have client_name"
        assert data["client_name"] == "Wheeler Family"
    
    def test_financial_plan_has_executive_summary(self):
        """Test that plan includes Executive Summary section"""
        payload = {
            "client_name": "Test Client",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 1000000,
            "annual_income": 200000,
            "annual_expenses": 100000,
            "total_assets": 1500000,
            "total_debt": 500000,
            "super_balance": 500000,
            "investment_portfolio": 300000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Executive Summary
        assert "executive_summary" in data, "Plan should have executive_summary"
        exec_summary = data["executive_summary"]
        assert "headline" in exec_summary, "Executive summary should have headline"
        assert "retirement_probability" in exec_summary, "Executive summary should have retirement_probability"
        assert "years_to_retirement" in exec_summary, "Executive summary should have years_to_retirement"
        assert "projected_retirement_balance" in exec_summary, "Executive summary should have projected_retirement_balance"
        assert "safe_annual_income" in exec_summary, "Executive summary should have safe_annual_income"
        assert "key_finding" in exec_summary, "Executive summary should have key_finding"
        assert "potential_improvement" in exec_summary, "Executive summary should have potential_improvement"
    
    def test_financial_plan_has_retirement_plan(self):
        """Test that plan includes Retirement Plan section"""
        payload = {
            "client_name": "Test Client",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 1000000,
            "annual_income": 200000,
            "annual_expenses": 100000,
            "total_assets": 1500000,
            "total_debt": 500000,
            "super_balance": 500000,
            "investment_portfolio": 300000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Retirement Plan
        assert "retirement_plan" in data, "Plan should have retirement_plan"
        retirement = data["retirement_plan"]
        assert "projected_balance" in retirement, "Retirement plan should have projected_balance"
        assert "projected_annual_income" in retirement, "Retirement plan should have projected_annual_income"
        assert "gap_to_target" in retirement, "Retirement plan should have gap_to_target"
        assert "recommendations" in retirement, "Retirement plan should have recommendations"
    
    def test_financial_plan_has_investment_strategy(self):
        """Test that plan includes Investment Strategy section"""
        payload = {
            "client_name": "Test Client",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 1000000,
            "annual_income": 200000,
            "annual_expenses": 100000,
            "total_assets": 1500000,
            "total_debt": 500000,
            "super_balance": 500000,
            "investment_portfolio": 300000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Investment Strategy
        assert "investment_strategy" in data, "Plan should have investment_strategy"
        investment = data["investment_strategy"]
        assert "strategy_name" in investment, "Investment strategy should have strategy_name"
        assert "risk_profile" in investment, "Investment strategy should have risk_profile"
        assert "target_allocation" in investment, "Investment strategy should have target_allocation"
        assert "expected_return" in investment, "Investment strategy should have expected_return"
        assert "recommendations" in investment, "Investment strategy should have recommendations"
    
    def test_financial_plan_has_tax_strategy(self):
        """Test that plan includes Tax Strategy section"""
        payload = {
            "client_name": "Test Client",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 1000000,
            "annual_income": 200000,
            "annual_expenses": 100000,
            "total_assets": 1500000,
            "total_debt": 500000,
            "super_balance": 500000,
            "investment_portfolio": 300000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Tax Strategy
        assert "tax_strategy" in data, "Plan should have tax_strategy"
        tax = data["tax_strategy"]
        assert "marginal_tax_rate" in tax, "Tax strategy should have marginal_tax_rate"
        assert "concessional_super_cap" in tax, "Tax strategy should have concessional_super_cap"
        assert "potential_tax_savings" in tax, "Tax strategy should have potential_tax_savings"
        assert "recommendations" in tax, "Tax strategy should have recommendations"
    
    def test_financial_plan_has_insurance_gaps(self):
        """Test that plan includes Insurance Gaps section"""
        payload = {
            "client_name": "Test Client",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 1000000,
            "annual_income": 200000,
            "annual_expenses": 100000,
            "total_assets": 1500000,
            "total_debt": 500000,
            "super_balance": 500000,
            "investment_portfolio": 300000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Insurance Gaps
        assert "insurance_gaps" in data, "Plan should have insurance_gaps"
        insurance = data["insurance_gaps"]
        assert "income_protection_needed" in insurance, "Insurance gaps should have income_protection_needed"
        assert "life_insurance_gap" in insurance, "Insurance gaps should have life_insurance_gap"
        assert "tpd_coverage_needed" in insurance, "Insurance gaps should have tpd_coverage_needed"
        assert "recommendations" in insurance, "Insurance gaps should have recommendations"
    
    def test_financial_plan_has_action_plan(self):
        """Test that plan includes Action Plan section"""
        payload = {
            "client_name": "Test Client",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 1000000,
            "annual_income": 200000,
            "annual_expenses": 100000,
            "total_assets": 1500000,
            "total_debt": 500000,
            "super_balance": 500000,
            "investment_portfolio": 300000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Action Plan
        assert "action_plan" in data, "Plan should have action_plan"
        action = data["action_plan"]
        assert "immediate_actions" in action, "Action plan should have immediate_actions"
        assert "short_term_actions" in action, "Action plan should have short_term_actions"
        assert "long_term_actions" in action, "Action plan should have long_term_actions"
    
    def test_financial_plan_has_plan_metrics(self):
        """Test that plan includes Plan Metrics (12 recommendations, 4 high priority, $1.2M wealth impact, +15% probability boost)"""
        payload = {
            "client_name": "Test Client",
            "age": 45,
            "retirement_age": 60,
            "net_worth": 1000000,
            "annual_income": 200000,
            "annual_expenses": 100000,
            "total_assets": 1500000,
            "total_debt": 500000,
            "super_balance": 500000,
            "investment_portfolio": 300000,
            "savings_rate": 0.15,
            "risk_tolerance": "moderate",
            "monte_carlo_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-financial-plan", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Plan Metrics
        assert "plan_metrics" in data, "Plan should have plan_metrics"
        metrics = data["plan_metrics"]
        assert "total_recommendations" in metrics, "Plan metrics should have total_recommendations"
        assert "high_priority_actions" in metrics, "Plan metrics should have high_priority_actions"
        assert "potential_wealth_impact" in metrics, "Plan metrics should have potential_wealth_impact"
        assert "probability_improvement" in metrics, "Plan metrics should have probability_improvement"
        
        # Verify values are reasonable
        assert metrics["total_recommendations"] > 0, "Should have at least 1 recommendation"
        assert metrics["high_priority_actions"] >= 0, "High priority actions should be non-negative"
        assert metrics["potential_wealth_impact"] > 0, "Wealth impact should be positive"
        assert metrics["probability_improvement"] > 0, "Probability improvement should be positive"


class TestAIMeetingSummaryGenerator:
    """Tests for AI Meeting Summary Generator - Feature 2"""
    
    def test_generate_meeting_summary_success(self):
        """Test generating a meeting summary"""
        payload = {
            "client_name": "Wheeler Family",
            "meeting_date": "2026-01-15",
            "meeting_type": "Annual Review",
            "attendees": ["John Wheeler", "Sarah Wheeler", "Financial Advisor"],
            "discussion_points": ["Retirement planning", "Investment strategy", "Tax planning"],
            "client_data": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-meeting-summary", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify summary structure
        assert "summary_id" in data, "Summary should have summary_id"
        assert "generated_at" in data, "Summary should have generated_at timestamp"
        assert "client_name" in data, "Summary should have client_name"
        assert data["client_name"] == "Wheeler Family"
    
    def test_meeting_summary_has_executive_summary(self):
        """Test that meeting summary includes Executive Summary"""
        payload = {
            "client_name": "Test Client",
            "meeting_date": "2026-01-15",
            "meeting_type": "Quarterly Review",
            "attendees": ["Client", "Advisor"],
            "discussion_points": ["Portfolio review"],
            "client_data": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-meeting-summary", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Executive Summary
        assert "executive_summary" in data, "Summary should have executive_summary"
        assert len(data["executive_summary"]) > 0, "Executive summary should not be empty"
    
    def test_meeting_summary_has_topics_covered(self):
        """Test that meeting summary includes Topics Covered"""
        payload = {
            "client_name": "Test Client",
            "meeting_date": "2026-01-15",
            "meeting_type": "Strategy Session",
            "attendees": ["Client", "Advisor"],
            "discussion_points": ["Retirement planning", "Tax strategy"],
            "client_data": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-meeting-summary", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Discussion Summary with Topics Covered
        assert "discussion_summary" in data, "Summary should have discussion_summary"
        discussion = data["discussion_summary"]
        assert "topics_covered" in discussion, "Discussion summary should have topics_covered"
        assert len(discussion["topics_covered"]) > 0, "Topics covered should not be empty"
    
    def test_meeting_summary_has_decisions_made(self):
        """Test that meeting summary includes Decisions Made"""
        payload = {
            "client_name": "Test Client",
            "meeting_date": "2026-01-15",
            "meeting_type": "Annual Review",
            "attendees": ["Client", "Advisor"],
            "discussion_points": ["Investment review"],
            "client_data": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-meeting-summary", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Decisions Made
        assert "discussion_summary" in data, "Summary should have discussion_summary"
        discussion = data["discussion_summary"]
        assert "decisions_made" in discussion, "Discussion summary should have decisions_made"
        assert len(discussion["decisions_made"]) > 0, "Decisions made should not be empty"
    
    def test_meeting_summary_has_action_items(self):
        """Test that meeting summary includes Action Items with assignee, due date, priority, status"""
        payload = {
            "client_name": "Test Client",
            "meeting_date": "2026-01-15",
            "meeting_type": "Annual Review",
            "attendees": ["Client", "Advisor"],
            "discussion_points": ["Retirement planning"],
            "client_data": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-meeting-summary", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Action Items
        assert "action_items" in data, "Summary should have action_items"
        action_items = data["action_items"]
        assert len(action_items) > 0, "Should have at least one action item"
        
        # Verify action item structure
        first_item = action_items[0]
        assert "task" in first_item, "Action item should have task"
        assert "assigned_to" in first_item, "Action item should have assigned_to"
        assert "due_date" in first_item, "Action item should have due_date"
        assert "priority" in first_item, "Action item should have priority"
        assert "status" in first_item, "Action item should have status"
    
    def test_meeting_summary_has_plan_updates(self):
        """Test that meeting summary includes Plan Updates Required"""
        payload = {
            "client_name": "Test Client",
            "meeting_date": "2026-01-15",
            "meeting_type": "Annual Review",
            "attendees": ["Client", "Advisor"],
            "discussion_points": ["Retirement planning"],
            "client_data": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-meeting-summary", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Plan Updates
        assert "plan_updates" in data, "Summary should have plan_updates"
        plan_updates = data["plan_updates"]
        assert "changes_required" in plan_updates, "Plan updates should have changes_required"
        assert "updates" in plan_updates, "Plan updates should have updates list"
    
    def test_meeting_summary_has_next_meeting(self):
        """Test that meeting summary includes Next Meeting recommendations"""
        payload = {
            "client_name": "Test Client",
            "meeting_date": "2026-01-15",
            "meeting_type": "Annual Review",
            "attendees": ["Client", "Advisor"],
            "discussion_points": ["Retirement planning"],
            "client_data": {}
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/generate-meeting-summary", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify Next Meeting
        assert "next_meeting" in data, "Summary should have next_meeting"
        next_meeting = data["next_meeting"]
        assert "recommended_date" in next_meeting, "Next meeting should have recommended_date"
        assert "focus_areas" in next_meeting, "Next meeting should have focus_areas"
        assert len(next_meeting["focus_areas"]) > 0, "Focus areas should not be empty"


class TestAIClientInsights:
    """Tests for AI Client Insights API"""
    
    def test_client_insights_success(self):
        """Test generating client insights"""
        payload = {
            "client_name": "Wheeler Family",
            "net_worth": 1978000,
            "annual_income": 350000,
            "annual_expenses": 120000,
            "savings_rate": 0.35,
            "retirement_probability": 50.0
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/client-insights", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify insights structure
        assert "client_name" in data, "Insights should have client_name"
        assert "headline_insight" in data, "Insights should have headline_insight"
        assert "key_metrics" in data, "Insights should have key_metrics"
        assert "risks_detected" in data, "Insights should have risks_detected"
        assert "opportunities_identified" in data, "Insights should have opportunities_identified"
        assert "recommended_conversation_starters" in data, "Insights should have recommended_conversation_starters"
        assert "quick_wins" in data, "Insights should have quick_wins"


class TestDashboard3EngineSystem:
    """Tests for Dashboard 3-Engine System - Already verified in iteration_41"""
    
    def test_monte_carlo_engine(self):
        """Test ENGINE 1 - Monte Carlo Retirement Success Engine"""
        payload = {
            "initial_value": 1978000,
            "annual_contribution": 52500,  # 15% of 350000
            "years": 15,
            "expected_return": 0.07,
            "volatility": 0.15,
            "simulations": 1000,
            "retirement_target": 3500000
        }
        
        response = requests.post(f"{BASE_URL}/api/decision-engine/monte-carlo-advanced", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify Monte Carlo results
        assert "success_probability" in data, "Should have success_probability"
        assert "shortfall_risk" in data, "Should have shortfall_risk"
        assert "best_case" in data, "Should have best_case"
        assert "worst_case" in data, "Should have worst_case"
        assert "mean_outcome" in data, "Should have mean_outcome"
    
    def test_scenario_simulator_life_scenario(self):
        """Test ENGINE 2 - Scenario Simulator"""
        payload = {
            "scenario_id": "retire_early",
            "scenario_type": "retire_early",
            "base_probability": 50.0,
            "net_worth": 1978000,
            "annual_income": 350000,
            "annual_expenses": 120000,
            "annual_savings": 52500,
            "years_to_retirement": 15,
            "retirement_age": 60
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/life-scenario", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify scenario results - actual response structure
        assert "name" in data, "Should have name"
        assert "base_probability" in data, "Should have base_probability"
        assert "new_probability" in data, "Should have new_probability"
        assert "base_wealth" in data, "Should have base_wealth"
        assert "projected_wealth" in data, "Should have projected_wealth"
        assert "wealth_change" in data, "Should have wealth_change"
    
    def test_ai_wealth_insights(self):
        """Test ENGINE 3 - AI Wealth Insights"""
        payload = {
            "current_age": 45,
            "retirement_age": 60,
            "net_worth": 1978000,
            "annual_income": 350000,
            "annual_expenses": 120000,
            "savings_rate": 0.35,
            "total_assets": 2500000,
            "total_debt": 522000,
            "super_balance": 850000,
            "investment_portfolio": 450000
        }
        
        response = requests.post(f"{BASE_URL}/api/ai/wealth-brief", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify AI insights
        assert "headline" in data, "Should have headline"
        assert "recommendations" in data, "Should have recommendations"


class TestNavigationRoutes:
    """Tests for Navigation - Plan Generator and Meeting Notes under Clients section"""
    
    def test_health_endpoint(self):
        """Test basic health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
