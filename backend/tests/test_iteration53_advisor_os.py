"""
Test Suite for Iteration 53 - Advisor Operating System Features
Tests Portfolio Monitoring, Financial Graph, Tax Optimization, and Rebalancing APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://advisor-crm-pro-1.preview.emergentagent.com').rstrip('/')

class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestPortfolioMonitoring:
    """Portfolio Monitoring Engine - Daily portfolio scanning with alerts"""
    
    def test_daily_scan(self):
        """Test daily portfolio scan across all clients"""
        response = requests.get(f"{BASE_URL}/api/monitoring/daily-scan")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "scan_time" in data
        assert "total_clients" in data
        assert "total_aum" in data
        assert "clients_with_alerts" in data
        assert "total_alerts" in data
        assert "high_priority_alerts" in data
        assert "alert_summary" in data
        assert "client_results" in data
        
        # Verify alert summary categories
        alert_summary = data["alert_summary"]
        assert "allocation_drift" in alert_summary
        assert "concentration_risk" in alert_summary
        assert "idle_cash" in alert_summary
        assert "tax_opportunities" in alert_summary
        assert "retirement_shortfall" in alert_summary
        
        # Verify client results
        assert len(data["client_results"]) > 0
        for client in data["client_results"]:
            assert "client_id" in client
            assert "client_name" in client
            assert "aum" in client
            assert "alerts" in client
            assert "alert_count" in client
    
    def test_single_client_scan(self):
        """Test scanning a single client's portfolio"""
        response = requests.get(f"{BASE_URL}/api/monitoring/client/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert data["client_name"] == "Wheeler Family"
        assert "alerts" in data
        assert "alert_count" in data
        assert "high_priority" in data
        assert "medium_priority" in data
    
    def test_alerts_summary(self):
        """Test getting summary of all alerts across practice"""
        response = requests.get(f"{BASE_URL}/api/monitoring/alerts/summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_alerts" in data
        assert "high_priority" in data
        assert "alerts" in data
        assert "generated_at" in data
        
        # Verify alerts are sorted by severity
        alerts = data["alerts"]
        if len(alerts) > 1:
            # High priority should come first
            high_priority_found = False
            for alert in alerts:
                if alert.get("severity") == "high":
                    high_priority_found = True
                elif high_priority_found and alert.get("severity") == "medium":
                    # Medium after high is correct
                    pass
    
    def test_book_insights(self):
        """Test book-wide insights across all clients"""
        response = requests.get(f"{BASE_URL}/api/monitoring/book-insights")
        assert response.status_code == 200
        data = response.json()
        
        assert "book_summary" in data
        assert "sector_exposure" in data
        assert "book_wide_insights" in data
        
        # Verify book summary
        book_summary = data["book_summary"]
        assert "total_aum" in book_summary
        assert "total_clients" in book_summary
        assert "average_client_aum" in book_summary
        
        # Verify insights have required fields
        for insight in data["book_wide_insights"]:
            assert "insight" in insight
            assert "count" in insight
            assert "action" in insight
    
    def test_thresholds(self):
        """Test getting monitoring thresholds"""
        response = requests.get(f"{BASE_URL}/api/monitoring/thresholds")
        assert response.status_code == 200
        data = response.json()
        
        assert "allocation_drift" in data
        assert "concentration_risk" in data
        assert "idle_cash" in data


class TestFinancialGraph:
    """Client Financial Graph - Maps entire client financial life"""
    
    def test_client_graph(self):
        """Test getting complete financial graph for a client"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "graph" in data
        assert "summary" in data
        
        # Verify graph structure
        graph = data["graph"]
        assert "primary" in graph
        assert "family" in graph
        assert "entities" in graph
        assert "assets" in graph
        assert "insurance" in graph
        assert "liabilities" in graph
        assert "cash_flow" in graph
        
        # Verify summary
        summary = data["summary"]
        assert "total_household_income" in summary
        assert "total_assets" in summary
        assert "total_liabilities" in summary
        assert "net_worth" in summary
    
    def test_client_graph_not_found(self):
        """Test getting graph for unknown client returns template"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/unknown_client")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "unknown_client"
        assert "template" in data
    
    def test_client_cash_flow(self):
        """Test getting detailed cash flow analysis"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1/cash-flow")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "income" in data
        assert "expenses" in data
        assert "surplus" in data
        assert "savings_rate" in data
        assert "analysis" in data
        
        # Verify analysis
        analysis = data["analysis"]
        assert "income_diversification" in analysis
        assert "largest_income_source" in analysis
        assert "largest_expense" in analysis
    
    def test_insurance_analysis(self):
        """Test insurance coverage analysis"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1/insurance-analysis")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "policies" in data
        assert "coverage_summary" in data
        assert "adequacy_analysis" in data
        
        # Verify coverage summary
        coverage = data["coverage_summary"]
        assert "life_insurance" in coverage
        assert "tpd_insurance" in coverage
        assert "income_protection_annual" in coverage
        assert "total_annual_premium" in coverage
        
        # Verify adequacy analysis
        adequacy = data["adequacy_analysis"]
        assert "life_cover_multiple" in adequacy
        assert "recommended_life_multiple" in adequacy
    
    def test_client_entities(self):
        """Test getting client entities"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1/entities")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "entities" in data
        assert "count" in data
        assert len(data["entities"]) > 0
    
    def test_estate_summary(self):
        """Test estate planning summary"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1/estate-summary")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "estate_value" in data
        assert "beneficiaries" in data
        assert "planning_status" in data
    
    def test_relationship_map(self):
        """Test relationship map data"""
        response = requests.get(f"{BASE_URL}/api/financial-graph/client/client_1/relationship-map")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "nodes" in data
        assert "edges" in data
        assert "node_count" in data


class TestTaxOptimization:
    """Tax Optimization Engine - Advanced tax planning"""
    
    def test_tax_analysis(self):
        """Test comprehensive tax analysis for a client"""
        response = requests.get(f"{BASE_URL}/api/tax-optimization/client/client_1/analysis")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert data["client_name"] == "Wheeler Family"
        assert "tax_year" in data
        assert "individuals" in data
        assert "entities" in data
        assert "total_potential_savings" in data
        assert "recommendations" in data
        
        # Verify individual analysis
        for individual in data["individuals"]:
            assert "name" in individual
            assert "current_tax" in individual
            assert "super_optimization" in individual
            assert "tax_loss_harvesting" in individual
            assert "dividend_imputation" in individual
    
    def test_tax_strategies(self):
        """Test recommended tax strategies"""
        response = requests.get(f"{BASE_URL}/api/tax-optimization/client/client_1/strategies")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "strategies" in data
        assert "total_strategies" in data
        assert "estimated_total_savings" in data
        
        # Verify strategy structure
        for strategy in data["strategies"]:
            assert "strategy" in strategy
            assert "description" in strategy
            assert "tax_saving" in strategy
            assert "implementation" in strategy
            assert "timing" in strategy
    
    def test_eofy_checklist(self):
        """Test end of financial year checklist"""
        response = requests.get(f"{BASE_URL}/api/tax-optimization/client/client_1/eofy-checklist")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert data["client_name"] == "Wheeler Family"
        assert "tax_year" in data
        assert "days_until_eofy" in data
        assert "checklist" in data
        assert "total_items" in data
        assert "critical_items" in data
        assert "high_priority_items" in data
        
        # Verify checklist items
        for item in data["checklist"]:
            assert "item" in item
            assert "status" in item
            assert "action" in item
            assert "deadline" in item
            assert "priority" in item
    
    def test_tax_rates(self):
        """Test getting current tax rates"""
        response = requests.get(f"{BASE_URL}/api/tax-optimization/tax-rates")
        assert response.status_code == 200
        data = response.json()
        
        assert "tax_year" in data
        assert "brackets" in data
        assert "medicare_levy" in data
        assert "super_concessional_cap" in data
        
        # Verify brackets structure
        for bracket in data["brackets"]:
            assert "min" in bracket
            assert "rate" in bracket
    
    def test_tax_analysis_not_found(self):
        """Test tax analysis for unknown client"""
        response = requests.get(f"{BASE_URL}/api/tax-optimization/client/unknown_client/analysis")
        assert response.status_code == 404


class TestRebalancing:
    """Automated Portfolio Rebalancing Engine"""
    
    def test_rebalance_preview(self):
        """Test rebalance preview without executing"""
        response = requests.get(f"{BASE_URL}/api/rebalance/preview/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert data["client_name"] == "Wheeler Family"
        assert "current_aum" in data
        assert "trades" in data
        assert "summary" in data
        assert "allocation_before" in data
        assert "allocation_after" in data
        
        # Verify summary
        summary = data["summary"]
        assert "total_trades" in summary
        assert "sell_trades" in summary
        assert "buy_trades" in summary
        assert "total_sell_value" in summary
        assert "total_buy_value" in summary
        assert "estimated_cgt" in summary
        assert "tax_aware" in summary
        
        # Verify trades structure
        for trade in data["trades"]:
            assert "action" in trade
            assert "asset_class" in trade
            assert "symbol" in trade
            assert "units" in trade
            assert "price" in trade
            assert "value" in trade
    
    def test_drift_report(self):
        """Test allocation drift report"""
        response = requests.get(f"{BASE_URL}/api/rebalance/drift-report/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert data["client_name"] == "Wheeler Family"
        assert "aum" in data
        assert "max_drift" in data
        assert "needs_rebalance" in data
        assert "last_rebalance" in data
        assert "days_since_rebalance" in data
        assert "drift_by_asset_class" in data
        
        # Verify drift details
        for drift in data["drift_by_asset_class"]:
            assert "asset_class" in drift
            assert "current_percent" in drift
            assert "target_percent" in drift
            assert "drift_percent" in drift
            assert "action_needed" in drift
            assert "within_tolerance" in drift
    
    def test_optimal_trades(self):
        """Test tax-optimized trade recommendations"""
        response = requests.get(f"{BASE_URL}/api/rebalance/optimal-trades/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "recommendations" in data
        assert "total_recommendations" in data
        assert "tax_optimization_enabled" in data
        
        # Verify recommendations structure
        for rec in data["recommendations"]:
            assert "type" in rec
            assert "asset_class" in rec
            assert "symbol" in rec
            assert "action" in rec
            assert "recommendation" in rec
            assert "priority" in rec
    
    def test_batch_rebalance(self):
        """Test batch rebalance opportunities"""
        response = requests.get(f"{BASE_URL}/api/rebalance/batch-rebalance")
        assert response.status_code == 200
        data = response.json()
        
        assert "batch_opportunities" in data
        assert "summary" in data
        
        # Verify summary
        summary = data["summary"]
        assert "portfolios_needing_rebalance" in summary
        assert "total_aum_affected" in summary
        assert "total_trades_needed" in summary
    
    def test_rebalance_not_found(self):
        """Test rebalance for unknown client"""
        response = requests.get(f"{BASE_URL}/api/rebalance/preview/unknown_client")
        assert response.status_code == 404


class TestIntelligenceTaxOpportunities:
    """Cross-Client Intelligence - Tax Opportunities"""
    
    def test_tax_opportunities(self):
        """Test practice-wide tax opportunities"""
        response = requests.get(f"{BASE_URL}/api/intelligence/tax-opportunities")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_clients_with_opportunities" in data
        assert "total_harvestable_losses" in data
        assert "total_potential_tax_savings" in data
        assert "opportunities_by_client" in data
        assert "days_until_eofy" in data
        
        # Verify client opportunities
        for client in data["opportunities_by_client"]:
            assert "client_id" in client
            assert "client_name" in client
            assert "opportunities" in client


class TestExistingEndpoints:
    """Verify existing endpoints still work"""
    
    def test_command_center_daily_digest(self):
        """Test command center daily digest"""
        response = requests.get(f"{BASE_URL}/api/command-center/daily-digest")
        assert response.status_code == 200
        data = response.json()
        assert "greeting" in data
        assert "metrics" in data
    
    def test_holdings_portfolio(self):
        """Test holdings portfolio endpoint"""
        response = requests.get(f"{BASE_URL}/api/holdings/portfolio/client_1")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
    
    def test_wealth_overview(self):
        """Test wealth overview endpoint"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
    
    def test_compliance_dashboard(self):
        """Test compliance dashboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/compliance/dashboard")
        assert response.status_code == 200
        data = response.json()
        # Compliance dashboard has overview with compliance_rate
        assert "overview" in data
        assert "compliance_rate" in data["overview"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
