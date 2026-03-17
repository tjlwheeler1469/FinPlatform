"""
Iteration 66 - Wealth Command v7.2.0 Testing
Tests for:
1. Workflow Engine - Templates, Instances, Dashboard, Stats (Phase 2)
2. Book Intelligence - Overview, Insights, Tax Opportunities, Engagement Health, Sector Analysis (Phase 3)
3. Alpaca Paper Trading - Status, Demo Account, Demo Positions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint - verify v7.2.0"""
    
    def test_health_check_version_and_capabilities(self):
        """Test health endpoint returns v7.2.0 with new capabilities"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "7.2.0", f"Expected v7.2.0, got {data.get('version')}"
        
        # Verify new workflow engine capabilities
        workflow_engine = data.get("workflow_engine", {})
        assert workflow_engine.get("client_onboarding") == True
        assert workflow_engine.get("annual_review") == True
        assert workflow_engine.get("tax_planning") == True
        assert workflow_engine.get("portfolio_rebalance") == True
        
        # Verify book intelligence capability
        intelligence = data.get("intelligence", {})
        assert intelligence.get("book_intelligence") == True
        
        # Verify alpaca paper trading capability
        execution = data.get("execution_layer", {})
        assert execution.get("alpaca_paper_trading") == True
        
        # Check capabilities list
        capabilities = data.get("capabilities", [])
        assert "workflow_automation" in capabilities
        assert "book_intelligence" in capabilities
        assert "alpaca_paper_trading" in capabilities
        print(f"Health check passed: v{data['version']} with workflow engine, book intelligence, alpaca trading")


class TestWorkflowTemplates:
    """Workflow Engine - Template Management APIs"""
    
    def test_get_workflow_templates(self):
        """Test GET /api/workflow/templates"""
        response = requests.get(f"{BASE_URL}/api/workflow/templates")
        assert response.status_code == 200, f"Failed to get templates: {response.text}"
        
        data = response.json()
        assert "templates" in data
        assert "total" in data
        assert "categories" in data
        
        templates = data["templates"]
        assert len(templates) >= 4, f"Expected at least 4 templates, got {len(templates)}"
        
        # Verify template structure
        template_names = [t["name"] for t in templates]
        assert "New Client Onboarding" in template_names
        assert "Annual Client Review" in template_names
        assert "End of Financial Year Tax Planning" in template_names
        assert "Portfolio Rebalancing" in template_names
        
        # Verify categories
        categories = data["categories"]
        assert "onboarding" in categories
        assert "review" in categories
        assert "tax" in categories
        assert "investment" in categories
        
        print(f"Templates API passed: {data['total']} templates in {len(categories)} categories")
    
    def test_get_onboarding_template_details(self):
        """Test GET /api/workflow/templates/template_onboarding"""
        response = requests.get(f"{BASE_URL}/api/workflow/templates/template_onboarding")
        assert response.status_code == 200, f"Failed to get template: {response.text}"
        
        data = response.json()
        assert data["name"] == "New Client Onboarding"
        assert data["category"] == "onboarding"
        assert data["estimated_duration_days"] == 14
        
        steps = data.get("steps", [])
        assert len(steps) == 10, f"Expected 10 steps, got {len(steps)}"
        
        # Verify step structure
        first_step = steps[0]
        assert first_step["step_id"] == "step_1"
        assert first_step["name"] == "Initial Data Collection"
        assert first_step["type"] == "manual"
        
        print(f"Template detail API passed: {data['name']} with {len(steps)} steps")
    
    def test_get_annual_review_template(self):
        """Test GET /api/workflow/templates/annual_review"""
        response = requests.get(f"{BASE_URL}/api/workflow/templates/annual_review")
        assert response.status_code == 200, f"Failed to get template: {response.text}"
        
        data = response.json()
        assert data["name"] == "Annual Client Review"
        assert data["category"] == "review"
        assert data["estimated_duration_days"] == 7
        
        steps = data.get("steps", [])
        assert len(steps) == 8, f"Expected 8 steps, got {len(steps)}"
        print(f"Annual review template: {len(steps)} steps")


class TestWorkflowDashboard:
    """Workflow Engine - Dashboard & Stats APIs"""
    
    def test_workflow_dashboard(self):
        """Test GET /api/workflow/dashboard"""
        response = requests.get(f"{BASE_URL}/api/workflow/dashboard")
        assert response.status_code == 200, f"Failed to get dashboard: {response.text}"
        
        data = response.json()
        assert "summary" in data
        assert "action_items" in data
        assert "active_workflows" in data
        assert "timestamp" in data
        
        summary = data["summary"]
        assert "active_workflows" in summary
        assert "completed_workflows" in summary
        assert "paused_workflows" in summary
        assert "steps_needing_action" in summary
        
        print(f"Dashboard API passed: {summary['active_workflows']} active, {summary['completed_workflows']} completed")
    
    def test_workflow_stats(self):
        """Test GET /api/workflow/stats"""
        response = requests.get(f"{BASE_URL}/api/workflow/stats")
        assert response.status_code == 200, f"Failed to get stats: {response.text}"
        
        data = response.json()
        assert "totals" in data
        assert "performance" in data
        assert "templates_available" in data
        assert "timestamp" in data
        
        totals = data["totals"]
        assert "total_workflows" in totals
        assert "active" in totals
        assert "completed" in totals
        assert "cancelled" in totals
        assert "completion_rate" in totals
        
        performance = data["performance"]
        assert "avg_completion_days" in performance
        assert "workflows_completed_this_month" in performance
        
        assert data["templates_available"] >= 4
        print(f"Stats API passed: {data['templates_available']} templates, {totals['total_workflows']} total workflows")
    
    def test_workflow_instances_list(self):
        """Test GET /api/workflow/instances"""
        response = requests.get(f"{BASE_URL}/api/workflow/instances")
        assert response.status_code == 200, f"Failed to get instances: {response.text}"
        
        data = response.json()
        assert "workflows" in data
        assert "total" in data
        assert "active" in data
        assert "completed" in data
        assert "storage" in data
        
        print(f"Instances API passed: {data['total']} workflows, storage: {data['storage']}")


class TestWorkflowQuickStart:
    """Workflow Engine - Quick Start Workflow Creation"""
    
    def test_quick_start_client_onboarding(self):
        """Test POST /api/workflow/quick-start/client_onboarding"""
        response = requests.post(
            f"{BASE_URL}/api/workflow/quick-start/client_onboarding",
            params={
                "client_id": "test_client_001",
                "client_name": "Test Client Family"
            }
        )
        assert response.status_code == 200, f"Failed to create workflow: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "workflow_id" in data
        assert "workflow" in data
        assert "message" in data
        
        workflow = data["workflow"]
        assert workflow["client_id"] == "test_client_001"
        assert workflow["client_name"] == "Test Client Family"
        assert workflow["status"] == "active"
        assert workflow["total_steps"] == 10
        assert workflow["progress_percentage"] == 0
        
        # Verify all steps are created
        steps = workflow.get("steps", [])
        assert len(steps) == 10
        
        workflow_id = data["workflow_id"]
        print(f"Quick start API passed: Created workflow {workflow_id} with 10 steps")
        
        # Clean up - verify we can get this workflow
        get_response = requests.get(f"{BASE_URL}/api/workflow/instances/{workflow_id}")
        assert get_response.status_code == 200
        return workflow_id
    
    def test_quick_start_annual_review(self):
        """Test POST /api/workflow/quick-start/annual_review"""
        response = requests.post(
            f"{BASE_URL}/api/workflow/quick-start/annual_review",
            params={
                "client_id": "test_client_002",
                "client_name": "Wheeler Family"
            }
        )
        assert response.status_code == 200, f"Failed to create workflow: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        workflow = data["workflow"]
        assert workflow["total_steps"] == 8
        print(f"Annual review workflow created: {data['workflow_id']}")


class TestBookIntelligenceOverview:
    """Book Intelligence - Overview & Analytics APIs"""
    
    def test_book_intelligence_overview(self):
        """Test GET /api/book-intelligence/overview"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/overview")
        assert response.status_code == 200, f"Failed to get overview: {response.text}"
        
        data = response.json()
        assert "book_summary" in data
        assert "risk_distribution" in data
        assert "sector_allocation" in data
        assert "timestamp" in data
        
        summary = data["book_summary"]
        assert "total_clients" in summary
        assert "total_aum" in summary
        assert "average_client_aum" in summary
        assert "total_unrealized_gains" in summary
        assert "total_unrealized_losses" in summary
        assert "net_unrealized_pnl" in summary
        assert "average_engagement_score" in summary
        
        # Verify 12 demo clients
        assert summary["total_clients"] == 12
        assert summary["total_aum"] > 0
        
        # Verify risk distribution
        risk_dist = data["risk_distribution"]
        assert "Balanced" in risk_dist or "Growth" in risk_dist or "Conservative" in risk_dist
        
        # Verify sector allocation
        sector_alloc = data["sector_allocation"]
        assert "tech" in sector_alloc
        assert "finance" in sector_alloc
        
        print(f"Book overview passed: {summary['total_clients']} clients, ${summary['total_aum']:,.0f} AUM")
    
    def test_book_intelligence_insights(self):
        """Test GET /api/book-intelligence/insights"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/insights")
        assert response.status_code == 200, f"Failed to get insights: {response.text}"
        
        data = response.json()
        assert "insights" in data
        assert "total_insights" in data
        assert "critical_count" in data
        assert "high_priority_count" in data
        assert "generated_at" in data
        
        insights = data["insights"]
        assert len(insights) > 0, "Expected at least one insight"
        
        # Verify insight structure
        insight = insights[0]
        assert "id" in insight
        assert "category" in insight
        assert "priority" in insight
        assert "title" in insight
        assert "description" in insight
        assert "recommended_action" in insight
        
        print(f"Insights API passed: {data['total_insights']} insights, {data['high_priority_count']} high priority")


class TestBookIntelligenceAnalytics:
    """Book Intelligence - Detailed Analytics APIs"""
    
    def test_tax_opportunities(self):
        """Test GET /api/book-intelligence/tax-opportunities"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/tax-opportunities")
        assert response.status_code == 200, f"Failed to get tax ops: {response.text}"
        
        data = response.json()
        assert "total_harvestable_losses" in data
        assert "total_potential_tax_savings" in data
        assert "clients_with_opportunities" in data
        assert "opportunities" in data
        assert "days_to_eofy" in data
        assert "timestamp" in data
        
        assert data["total_harvestable_losses"] > 0
        assert data["total_potential_tax_savings"] > 0
        assert data["clients_with_opportunities"] > 0
        
        opportunities = data["opportunities"]
        assert len(opportunities) > 0
        
        # Verify opportunity structure
        opp = opportunities[0]
        assert "client_id" in opp
        assert "client_name" in opp
        assert "unrealized_losses" in opp
        assert "potential_tax_savings" in opp
        assert "priority" in opp
        
        print(f"Tax ops API passed: ${data['total_harvestable_losses']:,.0f} harvestable, ${data['total_potential_tax_savings']:,.0f} savings")
    
    def test_engagement_health(self):
        """Test GET /api/book-intelligence/engagement-health"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/engagement-health")
        assert response.status_code == 200, f"Failed to get engagement: {response.text}"
        
        data = response.json()
        assert "at_risk_count" in data
        assert "healthy_count" in data
        assert "total_revenue_at_risk" in data
        assert "at_risk_clients" in data
        assert "average_engagement" in data
        assert "timestamp" in data
        
        assert data["at_risk_count"] + data["healthy_count"] == 12  # Total clients
        assert data["average_engagement"] > 0
        
        # Verify at-risk client structure
        if data["at_risk_count"] > 0:
            at_risk = data["at_risk_clients"][0]
            assert "client_id" in at_risk
            assert "client_name" in at_risk
            assert "engagement_score" in at_risk
            assert "aum" in at_risk
            assert "revenue_at_risk" in at_risk
            assert "recommended_action" in at_risk
        
        print(f"Engagement API passed: {data['at_risk_count']} at risk, {data['healthy_count']} healthy, avg {data['average_engagement']}%")
    
    def test_sector_analysis(self):
        """Test GET /api/book-intelligence/sector-analysis"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/sector-analysis")
        assert response.status_code == 200, f"Failed to get sector analysis: {response.text}"
        
        data = response.json()
        assert "book_allocation" in data
        assert "concentration_risks" in data
        assert "total_aum" in data
        assert "recommended_thresholds" in data
        assert "timestamp" in data
        
        # Verify allocation percentages add up roughly to 100
        allocation = data["book_allocation"]
        total_pct = sum(allocation.values())
        assert 98 <= total_pct <= 102, f"Sector allocation should be ~100%, got {total_pct}%"
        
        # Verify thresholds
        thresholds = data["recommended_thresholds"]
        assert thresholds["max_single_sector"] == 30
        assert thresholds["max_correlated_sectors"] == 50
        
        print(f"Sector analysis passed: {len(allocation)} sectors, {len(data['concentration_risks'])} concentration risks")


class TestAlpacaTrading:
    """Alpaca Trading - Status and Demo Endpoints"""
    
    def test_alpaca_status(self):
        """Test GET /api/alpaca/status"""
        response = requests.get(f"{BASE_URL}/api/alpaca/status")
        assert response.status_code == 200, f"Failed to get status: {response.text}"
        
        data = response.json()
        assert "status" in data
        assert "sdk_installed" in data
        assert "configured" in data
        assert "message" in data
        
        # SDK should be installed
        assert data["sdk_installed"] == True, "Alpaca SDK should be installed"
        
        # Configuration status depends on API keys
        status = data["status"]
        assert status in ["connected", "not_configured", "error", "unavailable"]
        
        print(f"Alpaca status: {status}, SDK installed: {data['sdk_installed']}, configured: {data['configured']}")
    
    def test_alpaca_demo_account(self):
        """Test GET /api/alpaca/demo/account"""
        response = requests.get(f"{BASE_URL}/api/alpaca/demo/account")
        assert response.status_code == 200, f"Failed to get demo account: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["demo_mode"] == True
        assert "account" in data
        assert "message" in data
        
        account = data["account"]
        assert account["account_id"] == "DEMO_ACCOUNT"
        assert account["status"] == "ACTIVE"
        assert "buying_power" in account
        assert "cash" in account
        assert "portfolio_value" in account
        assert "equity" in account
        assert "daily_pnl" in account
        
        assert account["buying_power"] == 100000.00
        assert account["cash"] == 50000.00
        assert account["portfolio_value"] == 150000.00
        
        print(f"Demo account passed: ${account['portfolio_value']:,.0f} portfolio value, ${account['buying_power']:,.0f} buying power")
    
    def test_alpaca_demo_positions(self):
        """Test GET /api/alpaca/demo/positions"""
        response = requests.get(f"{BASE_URL}/api/alpaca/demo/positions")
        assert response.status_code == 200, f"Failed to get demo positions: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["demo_mode"] == True
        assert "positions" in data
        assert "summary" in data
        assert "message" in data
        
        positions = data["positions"]
        assert len(positions) == 3, f"Expected 3 demo positions, got {len(positions)}"
        
        # Verify position structure
        position = positions[0]
        assert "symbol" in position
        assert "qty" in position
        assert "avg_entry_price" in position
        assert "current_price" in position
        assert "market_value" in position
        assert "unrealized_pl" in position
        assert "unrealized_pl_pct" in position
        assert "side" in position
        
        # Verify demo symbols
        symbols = [p["symbol"] for p in positions]
        assert "AAPL" in symbols
        assert "MSFT" in symbols
        assert "GOOGL" in symbols
        
        summary = data["summary"]
        assert summary["total_positions"] == 3
        assert summary["total_market_value"] > 0
        
        print(f"Demo positions passed: {summary['total_positions']} positions, ${summary['total_market_value']:,.0f} value")


class TestBookIntelligenceAdditional:
    """Book Intelligence - Additional Analytics APIs"""
    
    def test_retirement_analysis(self):
        """Test GET /api/book-intelligence/retirement-analysis"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/retirement-analysis")
        assert response.status_code == 200, f"Failed to get retirement analysis: {response.text}"
        
        data = response.json()
        assert "summary" in data
        assert "near_retirement_clients" in data
        assert "clients_needing_review" in data
        assert "timestamp" in data
        
        summary = data["summary"]
        assert "near_retirement" in summary
        assert "mid_term" in summary
        assert "long_term" in summary
        
        # Total should equal 12 clients
        total = summary["near_retirement"] + summary["mid_term"] + summary["long_term"]
        assert total == 12, f"Expected 12 total clients, got {total}"
        
        print(f"Retirement analysis passed: {summary['near_retirement']} near, {summary['mid_term']} mid, {summary['long_term']} long-term")
    
    def test_risk_analysis(self):
        """Test GET /api/book-intelligence/risk-analysis"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/risk-analysis")
        assert response.status_code == 200, f"Failed to get risk analysis: {response.text}"
        
        data = response.json()
        assert "distribution" in data
        assert "total_clients" in data
        assert "total_aum" in data
        assert "timestamp" in data
        
        assert data["total_clients"] == 12
        assert data["total_aum"] > 0
        
        # Verify distribution has risk profiles
        distribution = data["distribution"]
        assert len(distribution) > 0
        
        # Verify risk profile structure
        for profile, info in distribution.items():
            assert "count" in info
            assert "aum" in info
            assert "aum_percentage" in info
            assert "clients" in info
        
        print(f"Risk analysis passed: {len(distribution)} risk profiles, {data['total_clients']} clients")
    
    def test_clients_needing_action(self):
        """Test GET /api/book-intelligence/clients-needing-action"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/clients-needing-action")
        assert response.status_code == 200, f"Failed to get action items: {response.text}"
        
        data = response.json()
        assert "action_items" in data
        assert "total_actions" in data
        assert "by_type" in data
        assert "timestamp" in data
        
        by_type = data["by_type"]
        assert "tax_harvest" in by_type
        assert "engagement" in by_type
        assert "risk_review" in by_type
        
        print(f"Action items passed: {data['total_actions']} actions ({by_type})")
    
    def test_performance_attribution(self):
        """Test GET /api/book-intelligence/performance-attribution"""
        response = requests.get(f"{BASE_URL}/api/book-intelligence/performance-attribution")
        assert response.status_code == 200, f"Failed to get performance attribution: {response.text}"
        
        data = response.json()
        assert "book_performance" in data
        assert "sector_attribution" in data
        assert "top_performers" in data
        assert "bottom_performers" in data
        assert "timestamp" in data
        
        perf = data["book_performance"]
        assert "total_unrealized_pnl" in perf
        assert "pnl_as_percentage" in perf
        assert "total_aum" in perf
        
        assert len(data["top_performers"]) == 3
        assert len(data["bottom_performers"]) == 3
        
        print(f"Performance attribution passed: {perf['pnl_as_percentage']}% return, {len(data['sector_attribution'])} sectors")


class TestWorkflowAdvanced:
    """Workflow Engine - Advanced Operations"""
    
    def test_create_workflow_via_api(self):
        """Test POST /api/workflow/create"""
        response = requests.post(
            f"{BASE_URL}/api/workflow/create",
            json={
                "template_id": "template_rebalance",
                "name": "Portfolio Rebalance - Smith Family",
                "description": "Q1 2025 rebalancing",
                "client_id": "smith_001",
                "client_name": "Smith Family Trust",
                "trigger_type": "manual"
            }
        )
        assert response.status_code == 200, f"Failed to create workflow: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "workflow_id" in data
        
        workflow = data["workflow"]
        assert workflow["name"] == "Portfolio Rebalance - Smith Family"
        assert workflow["client_name"] == "Smith Family Trust"
        assert workflow["total_steps"] == 6
        
        print(f"Create workflow passed: {data['workflow_id']}")
        return data["workflow_id"]
    
    def test_workflow_by_client(self):
        """Test GET /api/workflow/by-client/{client_id}/active"""
        # First create a workflow for the client
        requests.post(
            f"{BASE_URL}/api/workflow/quick-start/client_onboarding",
            params={
                "client_id": "client_for_test",
                "client_name": "Test Client"
            }
        )
        
        response = requests.get(f"{BASE_URL}/api/workflow/by-client/client_for_test/active")
        assert response.status_code == 200, f"Failed to get client workflows: {response.text}"
        
        data = response.json()
        assert data["client_id"] == "client_for_test"
        assert "workflows" in data
        assert "total" in data
        assert data["total"] >= 1
        
        print(f"Client workflows passed: {data['total']} workflows for client")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
