"""
Test suite for Retirement Confidence Engine APIs
Tests: confidence_engine.py, ai_explanation_engine.py, adviser_intelligence.py
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://goal-feasibility-hub.preview.emergentagent.com')

class TestConfidenceEngineQuickCalculate:
    """Tests for /api/confidence-engine/quick-calculate endpoint"""
    
    def test_quick_calculate_basic(self):
        """Test basic quick calculate with default parameters"""
        response = requests.post(
            f"{BASE_URL}/api/confidence-engine/quick-calculate",
            params={
                "net_worth": 2000000,
                "annual_income": 200000,
                "annual_expenses": 100000,
                "current_age": 45,
                "retirement_age": 65,
                "life_expectancy": 90,
                "is_couple": True,
                "num_simulations": 100
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "confidence_score" in data
        assert "risk_breakdown" in data
        assert "statistics" in data
        assert "quick_assessment" in data
        
        # Verify confidence score is valid percentage
        assert 0 <= data["confidence_score"] <= 100
        
        # Verify risk breakdown has all 4 risk categories
        risk_breakdown = data["risk_breakdown"]
        assert "longevity_risk" in risk_breakdown
        assert "market_risk" in risk_breakdown
        assert "spending_risk" in risk_breakdown
        assert "inflation_risk" in risk_breakdown
        
        # Verify statistics
        stats = data["statistics"]
        assert "median_final_wealth" in stats
        assert "p10_final_wealth" in stats
        assert "p90_final_wealth" in stats
        
        print(f"PASS: Quick calculate returned confidence score: {data['confidence_score']}%")
    
    def test_quick_calculate_low_net_worth(self):
        """Test with lower net worth to see risk breakdown"""
        response = requests.post(
            f"{BASE_URL}/api/confidence-engine/quick-calculate",
            params={
                "net_worth": 500000,
                "annual_income": 100000,
                "annual_expenses": 80000,
                "current_age": 55,
                "retirement_age": 65,
                "life_expectancy": 90,
                "is_couple": False,
                "num_simulations": 100
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Lower net worth should result in lower confidence
        assert data["confidence_score"] < 100
        print(f"PASS: Low net worth scenario returned confidence: {data['confidence_score']}%")
    
    def test_quick_calculate_high_expenses(self):
        """Test with high expenses relative to net worth"""
        response = requests.post(
            f"{BASE_URL}/api/confidence-engine/quick-calculate",
            params={
                "net_worth": 1000000,
                "annual_income": 150000,
                "annual_expenses": 150000,  # High expenses
                "current_age": 50,
                "retirement_age": 65,
                "life_expectancy": 95,
                "is_couple": True,
                "num_simulations": 100
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # High expenses should show spending risk
        assert "spending_risk" in data["risk_breakdown"]
        print(f"PASS: High expenses scenario returned confidence: {data['confidence_score']}%")


class TestConfidenceEngineRiskFactors:
    """Tests for /api/confidence-engine/risk-factors endpoint"""
    
    def test_get_risk_factors(self):
        """Test getting risk factor descriptions"""
        response = requests.get(f"{BASE_URL}/api/confidence-engine/risk-factors")
        assert response.status_code == 200
        data = response.json()
        
        assert "risk_factors" in data
        risk_factors = data["risk_factors"]
        
        # Should have 4 risk factors
        assert len(risk_factors) == 4
        
        # Verify each risk factor has required fields
        for rf in risk_factors:
            assert "id" in rf
            assert "name" in rf
            assert "description" in rf
            assert "mitigation" in rf
        
        # Verify specific risk factors exist
        risk_ids = [rf["id"] for rf in risk_factors]
        assert "longevity_risk" in risk_ids
        assert "market_risk" in risk_ids
        assert "spending_risk" in risk_ids
        assert "inflation_risk" in risk_ids
        
        print("PASS: Risk factors endpoint returned all 4 risk categories")


class TestConfidenceEngineAssetClasses:
    """Tests for /api/confidence-engine/asset-classes endpoint"""
    
    def test_get_asset_classes(self):
        """Test getting asset class parameters"""
        response = requests.get(f"{BASE_URL}/api/confidence-engine/asset-classes")
        assert response.status_code == 200
        data = response.json()
        
        assert "asset_classes" in data
        asset_classes = data["asset_classes"]
        
        # Should have multiple asset classes
        assert len(asset_classes) >= 5
        
        # Verify each asset class has required fields
        for ac in asset_classes:
            assert "id" in ac
            assert "return" in ac
            assert "volatility" in ac
            assert "market_beta" in ac
            assert "description" in ac
        
        print(f"PASS: Asset classes endpoint returned {len(asset_classes)} asset classes")


class TestAIExplanationEngine:
    """Tests for /api/ai-explain/* endpoints"""
    
    def test_explain_confidence(self):
        """Test AI explanation for confidence score"""
        response = requests.post(
            f"{BASE_URL}/api/ai-explain/explain",
            json={
                "confidence_score": 75.0,
                "risk_breakdown": {
                    "longevity_risk": 10.0,
                    "market_risk": 8.0,
                    "spending_risk": 5.0,
                    "inflation_risk": 2.0
                },
                "statistics": {
                    "median_final_wealth": 3000000,
                    "p10_final_wealth": 1000000,
                    "p90_final_wealth": 6000000
                },
                "inputs": {
                    "net_worth": 1500000,
                    "years_to_retirement": 15,
                    "annual_expenses": 80000,
                    "portfolio_return": 7.0,
                    "portfolio_volatility": 12.0
                },
                "client_name": "Test Client"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have explanation fields (rule-based fallback)
        assert "score_explanation" in data or "ai_explanation" in data
        assert "generated_by" in data
        assert "timestamp" in data
        
        # If rule-based, should have recommended actions
        if data.get("generated_by") == "rule_engine":
            assert "recommended_actions" in data
            assert "primary_risk" in data
            assert "overall_status" in data
        
        print(f"PASS: AI explanation generated by: {data.get('generated_by')}")
    
    def test_explain_excellent_score(self):
        """Test explanation for excellent confidence score"""
        response = requests.post(
            f"{BASE_URL}/api/ai-explain/explain",
            json={
                "confidence_score": 95.0,
                "risk_breakdown": {
                    "longevity_risk": 2.0,
                    "market_risk": 2.0,
                    "spending_risk": 1.0,
                    "inflation_risk": 0.0
                },
                "statistics": {
                    "median_final_wealth": 8000000
                },
                "inputs": {
                    "net_worth": 5000000,
                    "years_to_retirement": 10,
                    "annual_expenses": 100000,
                    "portfolio_return": 7.0,
                    "portfolio_volatility": 10.0
                },
                "client_name": "Wealthy Client"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Excellent score should have positive status
        if data.get("generated_by") == "rule_engine":
            assert data.get("overall_status") == "excellent"
        
        print("PASS: Excellent score explanation generated")
    
    def test_risk_explanation_longevity(self):
        """Test detailed risk explanation for longevity risk"""
        response = requests.get(f"{BASE_URL}/api/ai-explain/risk-explanation/longevity_risk")
        assert response.status_code == 200
        data = response.json()
        
        assert data["risk_type"] == "Longevity Risk"
        assert "explanation" in data
        assert "mitigation" in data
        
        print("PASS: Longevity risk explanation retrieved")
    
    def test_risk_explanation_market(self):
        """Test detailed risk explanation for market risk"""
        response = requests.get(f"{BASE_URL}/api/ai-explain/risk-explanation/market_risk")
        assert response.status_code == 200
        data = response.json()
        
        assert data["risk_type"] == "Market Risk"
        assert "explanation" in data
        assert "mitigation" in data
        
        print("PASS: Market risk explanation retrieved")
    
    def test_risk_explanation_invalid(self):
        """Test invalid risk type returns 404"""
        response = requests.get(f"{BASE_URL}/api/ai-explain/risk-explanation/invalid_risk")
        assert response.status_code == 404
        
        print("PASS: Invalid risk type returns 404")
    
    def test_client_summary(self):
        """Test client-friendly summary generation"""
        response = requests.post(
            f"{BASE_URL}/api/ai-explain/client-summary",
            params={
                "client_name": "John Smith",
                "confidence_score": 65.0,
                "years_to_retirement": 10
            },
            json={
                "longevity_risk": 15.0,
                "market_risk": 10.0,
                "spending_risk": 8.0,
                "inflation_risk": 2.0
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_name"] == "John Smith"
        assert data["confidence_score"] == 65.0
        assert "status" in data
        assert "message" in data
        assert "simple_actions" in data
        
        print(f"PASS: Client summary generated with status: {data['status']}")


class TestAdviserIntelligence:
    """Tests for /api/adviser-insights/* endpoints"""
    
    def test_adviser_dashboard(self):
        """Test adviser intelligence dashboard"""
        response = requests.get(f"{BASE_URL}/api/adviser-insights/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify summary section
        assert "summary" in data
        summary = data["summary"]
        assert "total_clients" in summary
        assert "average_confidence" in summary
        assert "clients_below_target" in summary
        assert "clients_at_risk" in summary
        
        # Verify alerts section
        assert "alerts" in data
        
        # Verify opportunities section
        assert "opportunities" in data
        
        # Verify insights section
        assert "insights" in data
        
        # Verify confidence distribution
        assert "confidence_distribution" in data
        dist = data["confidence_distribution"]
        assert "excellent" in dist
        assert "good" in dist
        assert "moderate" in dist
        assert "concerning" in dist
        assert "critical" in dist
        
        print(f"PASS: Adviser dashboard returned {summary['total_clients']} clients, avg confidence: {summary['average_confidence']}%")
    
    def test_client_list(self):
        """Test getting client list"""
        response = requests.get(f"{BASE_URL}/api/adviser-insights/clients")
        assert response.status_code == 200
        data = response.json()
        
        assert "clients" in data
        assert "total" in data
        
        # Verify client data structure
        if data["clients"]:
            client = data["clients"][0]
            assert "client_id" in client
            assert "name" in client
            assert "confidence_score" in client
        
        print(f"PASS: Client list returned {data['total']} clients")
    
    def test_client_list_sorted(self):
        """Test client list sorting"""
        response = requests.get(
            f"{BASE_URL}/api/adviser-insights/clients",
            params={"sort_by": "confidence_score", "order": "asc"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify sorting (ascending)
        clients = data["clients"]
        if len(clients) > 1:
            for i in range(len(clients) - 1):
                assert clients[i].get("confidence_score", 0) <= clients[i+1].get("confidence_score", 0)
        
        print("PASS: Client list sorted correctly")
    
    def test_alerts(self):
        """Test getting all alerts"""
        response = requests.get(f"{BASE_URL}/api/adviser-insights/alerts")
        assert response.status_code == 200
        data = response.json()
        
        assert "alerts" in data
        assert "total" in data
        assert "by_severity" in data
        
        # Verify severity breakdown
        by_severity = data["by_severity"]
        assert "critical" in by_severity
        assert "high" in by_severity
        assert "medium" in by_severity
        assert "low" in by_severity
        
        print(f"PASS: Alerts endpoint returned {data['total']} alerts")
    
    def test_opportunities(self):
        """Test getting opportunities"""
        response = requests.get(f"{BASE_URL}/api/adviser-insights/opportunities")
        assert response.status_code == 200
        data = response.json()
        
        assert "opportunities" in data
        assert "total" in data
        assert "total_potential_improvement" in data
        
        print(f"PASS: Opportunities endpoint returned {data['total']} opportunities")
    
    def test_bulk_actions(self):
        """Test bulk action recommendations"""
        response = requests.get(f"{BASE_URL}/api/adviser-insights/bulk-actions")
        assert response.status_code == 200
        data = response.json()
        
        assert "bulk_actions" in data
        assert "total_clients_requiring_action" in data
        
        # Verify bulk action structure
        for action in data["bulk_actions"]:
            assert "action" in action
            assert "clients" in action
            assert "count" in action
            assert "description" in action
        
        print(f"PASS: Bulk actions returned {len(data['bulk_actions'])} action categories")


class TestConfidenceEngineHistory:
    """Tests for confidence calculation history"""
    
    def test_get_history(self):
        """Test getting confidence history for a client"""
        response = requests.get(f"{BASE_URL}/api/confidence-engine/history/demo_client")
        assert response.status_code == 200
        data = response.json()
        
        assert "client_id" in data
        assert "history" in data
        assert "total" in data
        
        print(f"PASS: History endpoint returned {data['total']} records")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
