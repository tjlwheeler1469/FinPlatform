"""
Test Suite for Knowledge Graph Dashboard - Iteration 80
========================================================
Tests the Financial Knowledge Graph API endpoints including:
- Graph overview and visualization
- Actions and insights
- AI-powered Q&A
- Adjustable action parameters
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://xplan-sync-hub.preview.emergentagent.com')


class TestGraphOverview:
    """Tests for /api/graph/overview endpoint"""
    
    def test_get_graph_overview_returns_200(self):
        """Test that graph overview endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/graph/overview")
        assert response.status_code == 200
        print("✓ Graph overview returns 200 OK")
    
    def test_graph_overview_has_summary(self):
        """Test that overview has summary with required fields"""
        response = requests.get(f"{BASE_URL}/api/graph/overview")
        data = response.json()
        
        assert "summary" in data
        summary = data["summary"]
        assert "total_nodes" in summary
        assert "total_relationships" in summary
        assert "total_aum" in summary
        assert "active_insights" in summary
        assert "pending_actions" in summary
        
        # Verify values are positive
        assert summary["total_nodes"] > 0
        assert summary["total_relationships"] > 0
        print(f"✓ Summary has {summary['total_nodes']} nodes, {summary['total_relationships']} relationships")
    
    def test_graph_overview_has_node_counts(self):
        """Test that overview has node counts by type"""
        response = requests.get(f"{BASE_URL}/api/graph/overview")
        data = response.json()
        
        assert "node_counts" in data
        node_counts = data["node_counts"]
        
        # Check for expected node types
        expected_types = ["Client", "Portfolio", "Asset", "Sector", "Insight", "Action"]
        for node_type in expected_types:
            assert node_type in node_counts, f"Missing node type: {node_type}"
        
        print(f"✓ Node counts include all expected types: {list(node_counts.keys())}")


class TestGraphVisualization:
    """Tests for /api/graph/visualization/data endpoint"""
    
    def test_get_visualization_data_returns_200(self):
        """Test that visualization data endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/graph/visualization/data")
        assert response.status_code == 200
        print("✓ Visualization data returns 200 OK")
    
    def test_visualization_data_has_nodes_and_links(self):
        """Test that visualization data has nodes and links arrays"""
        response = requests.get(f"{BASE_URL}/api/graph/visualization/data")
        data = response.json()
        
        assert "nodes" in data
        assert "links" in data
        assert isinstance(data["nodes"], list)
        assert isinstance(data["links"], list)
        assert len(data["nodes"]) > 0
        assert len(data["links"]) > 0
        
        print(f"✓ Visualization data has {len(data['nodes'])} nodes and {len(data['links'])} links")
    
    def test_visualization_node_structure(self):
        """Test that nodes have required visualization properties"""
        response = requests.get(f"{BASE_URL}/api/graph/visualization/data")
        data = response.json()
        
        node = data["nodes"][0]
        assert "id" in node
        assert "label" in node
        assert "name" in node
        assert "val" in node  # Node size
        assert "color" in node  # Node color
        assert "data" in node  # Additional data
        
        print(f"✓ Node structure valid: id={node['id']}, label={node['label']}")
    
    def test_visualization_link_structure(self):
        """Test that links have required properties"""
        response = requests.get(f"{BASE_URL}/api/graph/visualization/data")
        data = response.json()
        
        link = data["links"][0]
        assert "source" in link
        assert "target" in link
        assert "type" in link
        
        print(f"✓ Link structure valid: {link['source']} --{link['type']}--> {link['target']}")


class TestPendingActions:
    """Tests for /api/graph/actions/pending endpoint"""
    
    def test_get_pending_actions_returns_200(self):
        """Test that pending actions endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/pending")
        assert response.status_code == 200
        print("✓ Pending actions returns 200 OK")
    
    def test_pending_actions_has_count_and_list(self):
        """Test that response has count and actions list"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/pending")
        data = response.json()
        
        assert "count" in data
        assert "actions" in data
        assert isinstance(data["actions"], list)
        assert data["count"] == len(data["actions"])
        
        print(f"✓ Found {data['count']} pending actions")
    
    def test_pending_action_structure(self):
        """Test that each action has required fields"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/pending")
        data = response.json()
        
        if len(data["actions"]) > 0:
            action = data["actions"][0]
            assert "id" in action
            assert "title" in action
            assert "description" in action
            assert "type" in action
            assert "status" in action
            assert "priority" in action
            assert "impact_score" in action
            assert "client" in action
            assert "insight" in action
            
            assert action["status"] == "pending"
            print(f"✓ Action structure valid: {action['title']} (priority: {action['priority']})")
        else:
            print("⚠ No pending actions to test structure")


class TestActionDetails:
    """Tests for /api/graph/actions/{id}/details endpoint"""
    
    def test_get_action_details_returns_200(self):
        """Test that action details endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/action_1/details")
        assert response.status_code == 200
        print("✓ Action details returns 200 OK")
    
    def test_action_details_has_adjustable_parameters(self):
        """Test that action details include adjustable parameters"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/action_1/details")
        data = response.json()
        
        assert "adjustable_parameters" in data
        assert isinstance(data["adjustable_parameters"], list)
        assert len(data["adjustable_parameters"]) > 0
        
        print(f"✓ Found {len(data['adjustable_parameters'])} adjustable parameters")
    
    def test_adjustable_parameter_structure(self):
        """Test that adjustable parameters have required slider fields"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/action_1/details")
        data = response.json()
        
        param = data["adjustable_parameters"][0]
        assert "name" in param
        assert "label" in param
        assert "type" in param
        assert "min" in param
        assert "max" in param
        assert "step" in param
        assert "default" in param
        assert "unit" in param
        
        print(f"✓ Parameter structure valid: {param['label']} ({param['min']} - {param['max']} {param['unit']})")
    
    def test_action_details_has_client_info(self):
        """Test that action details include client information"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/action_1/details")
        data = response.json()
        
        assert "client" in data
        assert "name" in data["client"]
        assert "risk_profile" in data["client"]
        
        print(f"✓ Client info present: {data['client']['name']}")
    
    def test_action_details_has_portfolio_info(self):
        """Test that action details include portfolio information"""
        response = requests.get(f"{BASE_URL}/api/graph/actions/action_1/details")
        data = response.json()
        
        assert "portfolio" in data
        if data["portfolio"]:
            assert "total_value" in data["portfolio"]
            print(f"✓ Portfolio info present: ${data['portfolio']['total_value']:,.0f}")


class TestAIQuestion:
    """Tests for /api/graph/ai/ask endpoint"""
    
    def test_ai_ask_returns_200(self):
        """Test that AI ask endpoint returns 200 OK"""
        response = requests.post(
            f"{BASE_URL}/api/graph/ai/ask",
            params={"question": "Which clients are most at risk?"}
        )
        assert response.status_code == 200
        print("✓ AI ask endpoint returns 200 OK")
    
    def test_ai_ask_has_required_fields(self):
        """Test that AI response has question, answer, and metadata"""
        response = requests.post(
            f"{BASE_URL}/api/graph/ai/ask",
            params={"question": "Which clients are most at risk for retirement?"}
        )
        data = response.json()
        
        assert "question" in data
        assert "answer" in data
        assert "data_sources_used" in data
        assert "answered_at" in data
        
        # Answer should not be empty
        assert len(data["answer"]) > 0
        
        print(f"✓ AI response structure valid, sources used: {data['data_sources_used']}")
    
    def test_ai_ask_revenue_opportunities(self):
        """Test AI response for revenue opportunities question"""
        response = requests.post(
            f"{BASE_URL}/api/graph/ai/ask",
            params={"question": "Where are the best revenue opportunities?"}
        )
        data = response.json()
        
        assert response.status_code == 200
        assert "answer" in data
        assert "opportunities" in data.get("data_sources_used", [])
        
        print("✓ AI handles revenue opportunities question")


class TestInsights:
    """Tests for /api/graph/insights endpoint"""
    
    def test_get_insights_returns_200(self):
        """Test that insights endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/graph/insights")
        assert response.status_code == 200
        print("✓ Insights endpoint returns 200 OK")
    
    def test_insights_has_count_and_list(self):
        """Test that response has count and insights list"""
        response = requests.get(f"{BASE_URL}/api/graph/insights")
        data = response.json()
        
        assert "count" in data
        assert "insights" in data
        assert len(data["insights"]) > 0
        
        print(f"✓ Found {data['count']} insights")
    
    def test_insight_structure(self):
        """Test that each insight has required fields"""
        response = requests.get(f"{BASE_URL}/api/graph/insights")
        data = response.json()
        
        insight = data["insights"][0]
        assert "id" in insight
        assert "type" in insight
        assert "severity" in insight
        assert "title" in insight
        assert "description" in insight
        assert "affected_clients" in insight
        
        print(f"✓ Insight structure valid: {insight['title']} (severity: {insight['severity']})")


class TestRetirementRisk:
    """Tests for /api/graph/queries/retirement-risk endpoint"""
    
    def test_retirement_risk_returns_200(self):
        """Test that retirement risk query returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/graph/queries/retirement-risk")
        assert response.status_code == 200
        print("✓ Retirement risk endpoint returns 200 OK")
    
    def test_retirement_risk_has_results(self):
        """Test that response has query info and results"""
        response = requests.get(f"{BASE_URL}/api/graph/queries/retirement-risk")
        data = response.json()
        
        assert "query" in data
        assert "results" in data
        assert len(data["results"]) > 0
        
        print(f"✓ Found {len(data['results'])} clients at retirement risk")
    
    def test_retirement_risk_structure(self):
        """Test that each risk result has required fields"""
        response = requests.get(f"{BASE_URL}/api/graph/queries/retirement-risk")
        data = response.json()
        
        result = data["results"][0]
        assert "client_id" in result
        assert "client_name" in result
        assert "retirement_risk" in result
        
        risk = result["retirement_risk"]
        assert "funding_ratio" in risk
        assert "risk_score" in risk
        assert "risk_factors" in risk
        
        print(f"✓ Risk structure valid: {result['client_name']} (funding: {risk['funding_ratio']}%)")


class TestRevenueOpportunities:
    """Tests for /api/graph/queries/revenue-opportunities endpoint"""
    
    def test_revenue_opportunities_returns_200(self):
        """Test that revenue opportunities query returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/graph/queries/revenue-opportunities")
        assert response.status_code == 200
        print("✓ Revenue opportunities endpoint returns 200 OK")
    
    def test_revenue_opportunities_has_results(self):
        """Test that response has results with potential revenue"""
        response = requests.get(f"{BASE_URL}/api/graph/queries/revenue-opportunities")
        data = response.json()
        
        assert "results" in data
        assert "total_potential_revenue" in data
        assert len(data["results"]) > 0
        
        print(f"✓ Total potential revenue: ${data['total_potential_revenue']:,.0f}")


class TestCrossClientRisks:
    """Tests for /api/graph/queries/cross-client-risks endpoint"""
    
    def test_cross_client_risks_returns_200(self):
        """Test that cross-client risks query returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/graph/queries/cross-client-risks")
        assert response.status_code == 200
        print("✓ Cross-client risks endpoint returns 200 OK")
    
    def test_cross_client_risks_has_results(self):
        """Test that response has risk results"""
        response = requests.get(f"{BASE_URL}/api/graph/queries/cross-client-risks")
        data = response.json()
        
        assert "results" in data
        # May have zero results if no cross-client risks
        print(f"✓ Found {len(data['results'])} cross-client risks")


class TestExecuteAction:
    """Tests for /api/graph/actions/{id}/adjust endpoint"""
    
    def test_execute_action_with_adjustments(self):
        """Test executing an action with adjusted parameters"""
        # Note: This test modifies data, so we'll use a POST but expect it to work
        response = requests.post(
            f"{BASE_URL}/api/graph/actions/action_1/adjust",
            json={
                "amount": 50000,
                "timeframe": 14,
                "price_limit": 3.0
            }
        )
        
        # Should return 200 or 400 if already executed
        assert response.status_code in [200, 400]
        
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            assert "transaction" in data
            print(f"✓ Action executed successfully with transaction: {data['transaction']['id']}")
        else:
            print("⚠ Action may already be executed (expected behavior)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
