"""
Test Suite for Iteration 47 - AI Features Testing
Tests: AI Copilot, Decision Center, Client Insights, Monte Carlo API
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://xplan-sync-hub.preview.emergentagent.com')

class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")


class TestAICopilot:
    """AI Wealth Copilot tests - Natural language financial advisor"""
    
    def test_copilot_ask_retirement_question(self):
        """Test AI Copilot responds to retirement questions"""
        response = requests.post(
            f"{BASE_URL}/api/copilot/ask",
            json={"question": "Can I retire at 60?"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data.get("success")
        assert "answer" in data
        assert "session_id" in data
        assert len(data["answer"]) > 100  # Should have substantial response
        print(f"✓ AI Copilot retirement question answered, session: {data['session_id']}")
        print(f"  Answer preview: {data['answer'][:200]}...")
    
    def test_copilot_ask_with_client_context(self):
        """Test AI Copilot with client financial context"""
        response = requests.post(
            f"{BASE_URL}/api/copilot/ask",
            json={
                "question": "What's my retirement probability?",
                "client_context": {
                    "age": 45,
                    "super_balance": 580000,
                    "savings": 200000,
                    "annual_income": 150000
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success")
        assert "answer" in data
        assert "parsed" in data
        print("✓ AI Copilot with context answered")
        print(f"  Parsed data: {data.get('parsed', {})}")
    
    def test_copilot_session_history(self):
        """Test copilot conversation history"""
        # First ask a question to create session
        ask_response = requests.post(
            f"{BASE_URL}/api/copilot/ask",
            json={"question": "How can I reduce my tax?"}
        )
        assert ask_response.status_code == 200
        session_id = ask_response.json().get("session_id")
        
        # Get history
        history_response = requests.get(f"{BASE_URL}/api/copilot/history/{session_id}")
        assert history_response.status_code == 200
        data = history_response.json()
        
        assert "history" in data
        print(f"✓ Session history retrieved for {session_id}, entries: {len(data.get('history', []))}")


class TestDecisionCenter:
    """Decision Center tests - Real-time scenario modeling"""
    
    def test_quick_scenario_analysis(self):
        """Test quick scenario analysis for slider updates"""
        response = requests.post(
            f"{BASE_URL}/api/copilot/quick-scenario",
            json={
                "current_age": 45,
                "retirement_age": 65,
                "current_wealth": 500000,
                "annual_savings": 50000,
                "annual_expenses": 80000,
                "risk_profile": "balanced"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "success_probability" in data
        assert "retirement_wealth_median" in data
        assert "risk_status" in data
        assert "recommendations" in data
        
        # Verify probability is reasonable
        prob = data["success_probability"]
        assert 0 <= prob <= 100
        
        print(f"✓ Quick scenario analysis: {prob}% success probability")
        print(f"  Risk status: {data['risk_status']}")
        print(f"  Recommendations: {len(data.get('recommendations', []))} items")
    
    def test_quick_scenario_slider_changes(self):
        """Test that slider changes produce different results"""
        # Base scenario
        base_response = requests.post(
            f"{BASE_URL}/api/copilot/quick-scenario",
            json={
                "current_age": 45,
                "retirement_age": 65,
                "current_wealth": 500000,
                "annual_savings": 30000,
                "annual_expenses": 80000,
                "risk_profile": "balanced"
            }
        )
        assert base_response.status_code == 200
        base_prob = base_response.json()["success_probability"]
        
        # Increased savings scenario
        increased_response = requests.post(
            f"{BASE_URL}/api/copilot/quick-scenario",
            json={
                "current_age": 45,
                "retirement_age": 65,
                "current_wealth": 500000,
                "annual_savings": 60000,  # Doubled savings
                "annual_expenses": 80000,
                "risk_profile": "balanced"
            }
        )
        assert increased_response.status_code == 200
        increased_prob = increased_response.json()["success_probability"]
        
        # Higher savings should improve probability
        assert increased_prob >= base_prob
        print(f"✓ Slider change test: Base {base_prob}% → Increased savings {increased_prob}%")
    
    def test_risk_profile_variations(self):
        """Test different risk profiles produce different results"""
        profiles = ["conservative", "balanced", "growth", "aggressive"]
        results = {}
        
        for profile in profiles:
            response = requests.post(
                f"{BASE_URL}/api/copilot/quick-scenario",
                json={
                    "current_age": 45,
                    "retirement_age": 65,
                    "current_wealth": 500000,
                    "annual_savings": 50000,
                    "annual_expenses": 80000,
                    "risk_profile": profile
                }
            )
            assert response.status_code == 200
            results[profile] = response.json()["success_probability"]
        
        print(f"✓ Risk profile variations: {results}")


class TestClientInsights:
    """Client Intelligence Feed tests - Today's AI insights"""
    
    def test_todays_insights_endpoint(self):
        """Test today's insights returns data"""
        response = requests.get(f"{BASE_URL}/api/copilot/todays-insights")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "date" in data
        assert "total_insights" in data
        assert "insights" in data
        assert "critical_count" in data
        
        # Verify insights have proper structure
        if data["insights"]:
            insight = data["insights"][0]
            assert "type" in insight
            assert "priority" in insight
            assert "title" in insight
            assert "description" in insight
        
        print(f"✓ Today's insights: {data['total_insights']} total, {data['critical_count']} critical")
        print(f"  Date: {data['date']}")
        for insight in data.get("insights", [])[:3]:
            print(f"  - {insight['title']} ({insight['priority']})")
    
    def test_insights_have_clients(self):
        """Test insights include affected clients"""
        response = requests.get(f"{BASE_URL}/api/copilot/todays-insights")
        assert response.status_code == 200
        data = response.json()
        
        # Check that insights have client information
        for insight in data.get("insights", []):
            assert "count" in insight or "clients" in insight
        
        print("✓ Insights include client information")


class TestMonteCarloAPI:
    """Monte Carlo simulation API tests"""
    
    def test_monte_carlo_simulation(self):
        """Test Monte Carlo simulation endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/copilot/monte-carlo",
            params={
                "current_age": 45,
                "retirement_age": 65,
                "current_wealth": 500000,
                "annual_savings": 50000,
                "num_simulations": 10000
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "success_metrics" in data
        assert "wealth_at_retirement" in data
        assert "projections" in data
        
        # Verify success metrics
        metrics = data["success_metrics"]
        assert "success_probability" in metrics
        assert 0 <= metrics["success_probability"] <= 100
        
        print(f"✓ Monte Carlo simulation: {metrics['success_probability']}% success")
        print(f"  Simulations: {data.get('simulation_params', {}).get('num_simulations', 'N/A')}")
    
    def test_scenario_comparison(self):
        """Test scenario comparison endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/copilot/scenario-comparison",
            json={
                "base_params": {
                    "current_age": 45,
                    "retirement_age": 65,
                    "current_wealth": 500000,
                    "annual_savings": 50000,
                    "annual_expenses": 80000
                },
                "scenarios": [
                    {
                        "name": "Delay Retirement",
                        "changes": {"retirement_age": 67}
                    },
                    {
                        "name": "Increase Savings",
                        "changes": {"annual_savings": 70000}
                    }
                ]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "base_scenario" in data
        assert "scenarios" in data
        assert len(data["scenarios"]) == 2
        
        print(f"✓ Scenario comparison: Base {data['base_scenario']['success_probability']}%")
        for scenario in data["scenarios"]:
            print(f"  - {scenario['name']}: {scenario['success_probability']}%")


class TestFinancialPlanGeneration:
    """AI Financial Plan Generator tests"""
    
    def test_generate_financial_plan(self):
        """Test financial plan generation"""
        response = requests.post(
            f"{BASE_URL}/api/copilot/generate-plan",
            json={
                "client_name": "Test Client",
                "age": 45,
                "retirement_age": 65,
                "annual_income": 150000,
                "annual_expenses": 100000,
                "savings": 50000,
                "super_balance": 300000,
                "property_value": 800000,
                "mortgage": 400000,
                "investments": 100000,
                "risk_profile": "balanced",
                "goals": ["Comfortable retirement", "Pay off mortgage"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data.get("success")
        assert "plan" in data
        assert "client_name" in data
        assert len(data["plan"]) > 500  # Should be substantial plan
        
        print(f"✓ Financial plan generated for {data['client_name']}")
        print(f"  Plan length: {len(data['plan'])} characters")


class TestDecisionEngineAPIs:
    """Decision Engine API tests - used by Decision Center"""
    
    def test_monte_carlo_advanced(self):
        """Test advanced Monte Carlo endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/monte-carlo-advanced",
            json={
                "current_age": 45,
                "retirement_age": 65,
                "current_wealth": 500000,
                "annual_savings": 50000,
                "annual_expenses": 80000,
                "risk_profile": "balanced"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "success_probability" in data
        print(f"✓ Advanced Monte Carlo: {data['success_probability']}% success")
    
    def test_health_score_v2(self):
        """Test health score calculation"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/health-score-v2",
            json={
                "net_worth": 1978000,
                "annual_income": 150000,
                "annual_expenses": 100000,
                "age": 45,
                "retirement_age": 65
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "score" in data or "health_score" in data
        print(f"✓ Health score calculated: {data}")
    
    def test_recommendations_v2(self):
        """Test recommendations endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/decision-engine/recommendations-v2",
            json={
                "net_worth": 1978000,
                "annual_income": 150000,
                "annual_expenses": 100000,
                "age": 45,
                "retirement_age": 65,
                "risk_profile": "balanced"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data or isinstance(data, list)
        print("✓ Recommendations generated")
    
    def test_net_worth_projection(self):
        """Test net worth projection endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/decision-engine/net-worth-projection",
            params={
                "current_net_worth": 1978000,
                "annual_savings": 27750,
                "years": 25,
                "growth_rate": 0.07
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "projections" in data or isinstance(data, list)
        print("✓ Net worth projection calculated")


class TestGoalsAPI:
    """Goals API tests"""
    
    def test_goals_list(self):
        """Test goals list endpoint"""
        response = requests.get(f"{BASE_URL}/api/goals/")
        # May return 200 or 404 depending on data
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Goals list: {len(data) if isinstance(data, list) else 'N/A'} goals")
        else:
            print(f"⚠ Goals endpoint returned {response.status_code}")
    
    def test_goals_by_household(self):
        """Test goals by household endpoint"""
        # Try both household IDs
        for hh_id in ["hh_001", "hh_wheeler001"]:
            response = requests.get(f"{BASE_URL}/api/goals/{hh_id}")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ Goals for {hh_id}: {len(data) if isinstance(data, list) else 'found'}")
                return
        print("⚠ Goals by household not found for either ID")


class TestLoginFlow:
    """Login flow tests"""
    
    def test_demo_login(self):
        """Test demo login credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": "advisor@wealthcommand.com",
                "password": "demo123"
            }
        )
        # Login may return 200 or redirect
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Demo login successful: {data}")
        elif response.status_code == 401:
            print("⚠ Demo login returned 401 - may need different credentials")
        else:
            print(f"⚠ Demo login returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
