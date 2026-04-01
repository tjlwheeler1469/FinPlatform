"""
Test Suite for Iteration 51 - Command Center, Live Data, and Holdings Management
Tests the new features added for Wealth Command platform:
- Command Center Daily Digest API
- Command Center Alerts API
- Live Market Data API
- Live Stock Data API
- Holdings Portfolio API
- Holdings Transaction API
- Holdings Performance API
- Existing Wealth Dashboard API
- Compliance endpoints
- AI Copilot endpoints
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://smsf-stability-fix.preview.emergentagent.com').rstrip('/')


class TestCommandCenterAPIs:
    """Test Command Center endpoints - NEW feature"""
    
    def test_daily_digest_returns_200(self):
        """Test GET /api/command-center/daily-digest returns 200"""
        response = requests.get(f"{BASE_URL}/api/command-center/daily-digest")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "generated_at" in data
        assert "greeting" in data
        assert "summary" in data
        assert "metrics" in data
        assert "alerts" in data
        assert "ai_recommendations" in data
        assert "schedule" in data
        assert "quick_actions" in data
    
    def test_daily_digest_summary_structure(self):
        """Test daily digest summary has correct structure"""
        response = requests.get(f"{BASE_URL}/api/command-center/daily-digest")
        data = response.json()
        
        summary = data["summary"]
        assert "total_alerts" in summary
        assert "alert_counts" in summary
        assert "requires_immediate_attention" in summary
        assert "meetings_today" in summary
        
        # Verify alert counts structure
        alert_counts = summary["alert_counts"]
        assert "critical" in alert_counts
        assert "high" in alert_counts
        assert "medium" in alert_counts
        assert "low" in alert_counts
    
    def test_daily_digest_metrics_structure(self):
        """Test daily digest metrics has correct structure"""
        response = requests.get(f"{BASE_URL}/api/command-center/daily-digest")
        data = response.json()
        
        metrics = data["metrics"]
        assert "total_aum" in metrics
        assert "aum_change_24h" in metrics
        assert "total_clients" in metrics
        assert "active_clients" in metrics
        assert "reviews_due_30d" in metrics
        assert "compliance_score" in metrics
        assert "meetings_today" in metrics
    
    def test_daily_digest_alerts_structure(self):
        """Test daily digest alerts have correct structure"""
        response = requests.get(f"{BASE_URL}/api/command-center/daily-digest")
        data = response.json()
        
        alerts = data["alerts"]
        assert len(alerts) > 0
        
        # Check first alert structure
        alert = alerts[0]
        assert "id" in alert
        assert "type" in alert
        assert "priority" in alert
        assert "title" in alert
        assert "description" in alert
        assert "action_text" in alert
        assert "action_route" in alert
    
    def test_alerts_endpoint_returns_200(self):
        """Test GET /api/command-center/alerts returns 200"""
        response = requests.get(f"{BASE_URL}/api/command-center/alerts")
        assert response.status_code == 200
        data = response.json()
        
        assert "alerts" in data
        assert "total" in data
        assert len(data["alerts"]) > 0
    
    def test_alerts_filter_by_priority(self):
        """Test alerts can be filtered by priority"""
        response = requests.get(f"{BASE_URL}/api/command-center/alerts?priority=high")
        assert response.status_code == 200
        data = response.json()
        
        # All returned alerts should be high priority
        for alert in data["alerts"]:
            assert alert["priority"] == "high"
    
    def test_dismiss_alert_returns_200(self):
        """Test POST /api/command-center/alerts/{alert_id}/dismiss returns 200"""
        response = requests.post(f"{BASE_URL}/api/command-center/alerts/test_alert_123/dismiss")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["alert_id"] == "test_alert_123"
        assert "dismissed_at" in data
    
    def test_snooze_alert_returns_200(self):
        """Test POST /api/command-center/alerts/{alert_id}/snooze returns 200"""
        response = requests.post(f"{BASE_URL}/api/command-center/alerts/test_alert_456/snooze?hours=24")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["alert_id"] == "test_alert_456"
        assert "snoozed_until" in data
    
    def test_metrics_endpoint_returns_200(self):
        """Test GET /api/command-center/metrics returns 200"""
        response = requests.get(f"{BASE_URL}/api/command-center/metrics")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_aum" in data
        assert "total_clients" in data
    
    def test_schedule_endpoint_returns_200(self):
        """Test GET /api/command-center/schedule returns 200"""
        response = requests.get(f"{BASE_URL}/api/command-center/schedule")
        assert response.status_code == 200
        data = response.json()
        
        assert "date" in data
        assert "meetings" in data
    
    def test_quick_insights_endpoint_returns_200(self):
        """Test GET /api/command-center/quick-insights returns 200"""
        response = requests.get(f"{BASE_URL}/api/command-center/quick-insights")
        assert response.status_code == 200
        data = response.json()
        
        assert "insights" in data
        assert "generated_at" in data


class TestLiveDataAPIs:
    """Test Live Market Data endpoints - NEW feature"""
    
    def test_market_summary_returns_200(self):
        """Test GET /api/live/market-summary returns 200"""
        response = requests.get(f"{BASE_URL}/api/live/market-summary")
        assert response.status_code == 200
        data = response.json()
        
        assert "indices" in data
        assert "top_gainers" in data
        assert "top_losers" in data
        assert "market_status" in data
        assert "last_updated" in data
    
    def test_market_summary_indices_structure(self):
        """Test market summary indices have correct structure"""
        response = requests.get(f"{BASE_URL}/api/live/market-summary")
        data = response.json()
        
        indices = data["indices"]["indices"]
        assert len(indices) > 0
        
        # Check first index structure
        index = indices[0]
        assert "symbol" in index
        assert "name" in index
        assert "value" in index
        assert "change" in index
        assert "change_percent" in index
    
    def test_stock_data_returns_200(self):
        """Test GET /api/live/stock/{symbol} returns 200"""
        response = requests.get(f"{BASE_URL}/api/live/stock/CBA")
        assert response.status_code == 200
        data = response.json()
        
        assert data["symbol"] == "CBA"
        assert "name" in data
        assert "price" in data
        assert "change" in data
        assert "change_percent" in data
        assert "volume" in data
        assert "data_source" in data
    
    def test_stock_data_multiple_symbols(self):
        """Test stock data for multiple ASX symbols"""
        symbols = ["BHP", "CSL", "NAB", "WBC"]
        for symbol in symbols:
            response = requests.get(f"{BASE_URL}/api/live/stock/{symbol}")
            assert response.status_code == 200
            data = response.json()
            assert data["symbol"] == symbol
    
    def test_stock_data_invalid_symbol_returns_404(self):
        """Test invalid stock symbol returns 404"""
        response = requests.get(f"{BASE_URL}/api/live/stock/INVALID123")
        assert response.status_code == 404
    
    def test_indices_endpoint_returns_200(self):
        """Test GET /api/live/indices returns 200"""
        response = requests.get(f"{BASE_URL}/api/live/indices")
        assert response.status_code == 200
        data = response.json()
        
        assert "indices" in data
        assert "last_updated" in data
    
    def test_stocks_batch_returns_200(self):
        """Test GET /api/live/stocks/batch returns 200"""
        response = requests.get(f"{BASE_URL}/api/live/stocks/batch?symbols=CBA,BHP,CSL")
        assert response.status_code == 200
        data = response.json()
        
        assert "stocks" in data
        assert "count" in data
        assert data["count"] == 3
    
    def test_portfolio_live_value_returns_200(self):
        """Test GET /api/live/portfolio/live-value returns 200"""
        response = requests.get(f"{BASE_URL}/api/live/portfolio/live-value?client_id=client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "holdings" in data
        assert "summary" in data
        assert "last_updated" in data
    
    def test_etfs_endpoint_returns_200(self):
        """Test GET /api/live/etfs returns 200"""
        response = requests.get(f"{BASE_URL}/api/live/etfs")
        assert response.status_code == 200
        data = response.json()
        
        assert "etfs" in data
        assert "count" in data
    
    def test_sector_performance_returns_200(self):
        """Test GET /api/live/sector-performance returns 200"""
        response = requests.get(f"{BASE_URL}/api/live/sector-performance")
        assert response.status_code == 200
        data = response.json()
        
        assert "sectors" in data
        assert "last_updated" in data
    
    def test_watchlist_returns_200(self):
        """Test GET /api/live/watchlist returns 200"""
        response = requests.get(f"{BASE_URL}/api/live/watchlist?client_id=client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "watchlist" in data
        assert "count" in data


class TestHoldingsAPIs:
    """Test Holdings Management endpoints - NEW feature"""
    
    def test_portfolio_returns_200(self):
        """Test GET /api/holdings/portfolio/{client_id} returns 200"""
        response = requests.get(f"{BASE_URL}/api/holdings/portfolio/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "holdings" in data
        assert "summary" in data
        assert "allocation" in data
        assert "by_asset_class" in data
    
    def test_portfolio_holdings_structure(self):
        """Test portfolio holdings have correct structure"""
        response = requests.get(f"{BASE_URL}/api/holdings/portfolio/client_1")
        data = response.json()
        
        holdings = data["holdings"]
        assert "shares" in holdings
        assert "etfs" in holdings
        assert "crypto" in holdings
        assert "property" in holdings
        assert "super" in holdings
        assert "cash" in holdings
    
    def test_portfolio_summary_structure(self):
        """Test portfolio summary has correct structure"""
        response = requests.get(f"{BASE_URL}/api/holdings/portfolio/client_1")
        data = response.json()
        
        summary = data["summary"]
        assert "total_value" in summary
        assert "total_cost" in summary
        assert "total_gain_loss" in summary
        assert "total_return_percent" in summary
    
    def test_transaction_buy_returns_200(self):
        """Test POST /api/holdings/transaction (buy) returns 200"""
        payload = {
            "client_id": "client_1",
            "asset_type": "shares",
            "symbol": "NAB",
            "name": "National Australia Bank",
            "transaction_type": "buy",
            "units": 5,
            "price": 34.50,
            "fees": 9.95
        }
        response = requests.post(f"{BASE_URL}/api/holdings/transaction", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "transaction_id" in data
        assert "transaction" in data
        assert data["transaction"]["transaction_type"] == "buy"
    
    def test_transaction_sell_returns_200(self):
        """Test POST /api/holdings/transaction (sell) returns 200"""
        payload = {
            "client_id": "client_1",
            "asset_type": "shares",
            "symbol": "TLS",
            "name": "Telstra",
            "transaction_type": "sell",
            "units": 10,
            "price": 4.10,
            "fees": 9.95
        }
        response = requests.post(f"{BASE_URL}/api/holdings/transaction", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "transaction_id" in data
        assert "realized_gain" in data
    
    def test_transactions_history_returns_200(self):
        """Test GET /api/holdings/transactions/{client_id} returns 200"""
        response = requests.get(f"{BASE_URL}/api/holdings/transactions/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "transactions" in data
        assert "total" in data
    
    def test_asset_types_returns_200(self):
        """Test GET /api/holdings/asset-types returns 200"""
        response = requests.get(f"{BASE_URL}/api/holdings/asset-types")
        assert response.status_code == 200
        data = response.json()
        
        assert "asset_types" in data
        assert len(data["asset_types"]) > 0
        
        # Check first asset type structure
        asset_type = data["asset_types"][0]
        assert "key" in asset_type
        assert "name" in asset_type
        assert "icon" in asset_type
    
    def test_rebalance_calculate_returns_200(self):
        """Test POST /api/holdings/rebalance/calculate returns 200"""
        payload = {
            "client_id": "client_1",
            "target_allocations": {
                "Australian Equities": 30,
                "International Equities": 20,
                "Property": 25,
                "Cash": 10,
                "Superannuation": 15
            }
        }
        response = requests.post(f"{BASE_URL}/api/holdings/rebalance/calculate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "total_portfolio_value" in data
        assert "current_allocation" in data
        assert "target_allocation" in data
        assert "suggested_trades" in data
    
    def test_performance_returns_200(self):
        """Test GET /api/holdings/performance/{client_id} returns 200"""
        response = requests.get(f"{BASE_URL}/api/holdings/performance/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "all_holdings" in data
        assert "top_winners" in data
        assert "top_losers" in data
        assert "summary" in data
    
    def test_performance_summary_structure(self):
        """Test performance summary has correct structure"""
        response = requests.get(f"{BASE_URL}/api/holdings/performance/client_1")
        data = response.json()
        
        summary = data["summary"]
        assert "total_holdings" in summary
        assert "total_value" in summary
        assert "total_cost" in summary
        assert "total_gain_loss" in summary
        assert "winners_count" in summary
        assert "losers_count" in summary


class TestExistingWealthDashboardAPIs:
    """Test existing Wealth Dashboard endpoints still work"""
    
    def test_wealth_overview_returns_200(self):
        """Test GET /api/wealth/overview/{client_id} returns 200"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert "summary" in data
        assert "asset_allocation" in data
    
    def test_wealth_overview_summary_structure(self):
        """Test wealth overview summary has correct structure"""
        response = requests.get(f"{BASE_URL}/api/wealth/overview/client_1")
        data = response.json()
        
        summary = data["summary"]
        assert "total_assets" in summary
        assert "total_liabilities" in summary
        assert "net_worth" in summary


class TestComplianceAPIs:
    """Test Compliance endpoints still work"""
    
    def test_compliance_check_returns_200(self):
        """Test POST /api/compliance/check returns 200"""
        # Compliance check uses query parameters
        response = requests.post(f"{BASE_URL}/api/compliance/check?client_id=client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert "compliance_score" in data or "score" in data or "status" in data or "checks" in data
    
    def test_compliance_dashboard_returns_200(self):
        """Test GET /api/compliance/dashboard returns 200"""
        response = requests.get(f"{BASE_URL}/api/compliance/dashboard")
        assert response.status_code == 200


class TestAICopilotAPIs:
    """Test AI Copilot endpoints still work"""
    
    def test_todays_insights_returns_200(self):
        """Test GET /api/copilot/todays-insights returns 200"""
        response = requests.get(f"{BASE_URL}/api/copilot/todays-insights")
        assert response.status_code == 200
        data = response.json()
        
        assert "insights" in data or isinstance(data, list)


class TestHealthEndpoint:
    """Test health endpoint"""
    
    def test_health_returns_200(self):
        """Test GET /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
