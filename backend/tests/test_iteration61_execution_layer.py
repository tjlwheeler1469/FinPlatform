"""
Iteration 61 - Wealth Command v6.0.0 Unified Execution Layer Tests
Testing: Execution Layer, Portfolio Engine, Smart Router, Crypto, Real-Time Data, Reconciliation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health check endpoint tests - v6.0.0 verification"""
    
    def test_health_returns_v6_with_execution_layer(self):
        """Health check should return v6.0.0 with execution_layer object"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "6.0.0"
        assert "execution_layer" in data
        
        # Verify execution layer components
        exec_layer = data["execution_layer"]
        assert exec_layer["trading"] == True
        assert exec_layer["portfolio_engine"] == True
        assert exec_layer["smart_router"] == True
        assert exec_layer["realtime_data"] == True
        assert exec_layer["crypto"] == True
        assert exec_layer["reconciliation"] == True
        
        # Verify capabilities include new features
        capabilities = data["capabilities"]
        assert "block_trading" in capabilities
        assert "model_portfolios" in capabilities
        assert "auto_rebalancing" in capabilities
        assert "multi_asset_execution" in capabilities
        assert "cross_platform_reconciliation" in capabilities
        print(f"✓ Health check v6.0.0 with execution_layer: {exec_layer}")


class TestExecutionLayer:
    """Unified Execution Layer - Trading endpoints"""
    
    def test_execution_status_operational(self):
        """GET /api/execution/status returns operational"""
        response = requests.get(f"{BASE_URL}/api/execution/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "operational"
        assert "brokers" in data
        assert "alpaca" in data["brokers"]
        assert "crypto" in data["brokers"]
        assert "features" in data
        assert data["features"]["block_trading"] == True
        assert data["features"]["model_portfolios"] == True
        print(f"✓ Execution status: {data['status']}, features: {list(data['features'].keys())}")
    
    def test_submit_order_demo_mode(self):
        """POST /api/execution/order submits order in demo mode"""
        response = requests.post(
            f"{BASE_URL}/api/execution/order",
            params={
                "client_id": "TEST_client_1",
                "symbol": "AAPL",
                "side": "buy",
                "quantity": 10,
                "asset_class": "equity",
                "order_type": "market"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "order_id" in data
        assert data["order_id"].startswith("ORD_")
        assert data["status"] in ["filled", "submitted"]
        assert data["demo_mode"] == True
        print(f"✓ Order submitted: {data['order_id']}, status: {data['status']}, demo: {data['demo_mode']}")
    
    def test_get_positions(self):
        """GET /api/execution/positions/{account_id} returns positions"""
        response = requests.get(f"{BASE_URL}/api/execution/positions/TEST_account_1")
        assert response.status_code == 200
        
        data = response.json()
        assert "positions" in data
        assert "total_positions" in data
        assert data["demo_mode"] == True
        assert len(data["positions"]) >= 0
        print(f"✓ Positions retrieved: {data['total_positions']} positions, demo: {data['demo_mode']}")
    
    def test_get_orders(self):
        """GET /api/execution/orders returns order history"""
        response = requests.get(f"{BASE_URL}/api/execution/orders")
        assert response.status_code == 200
        
        data = response.json()
        assert "orders" in data
        assert "total" in data
        print(f"✓ Orders retrieved: {data['total']} orders")


class TestPortfolioEngine:
    """Portfolio Execution Engine - Model portfolios & rebalancing"""
    
    def test_get_model_portfolios_returns_5(self):
        """GET /api/portfolio-engine/models returns 5 model portfolios"""
        response = requests.get(f"{BASE_URL}/api/portfolio-engine/models")
        assert response.status_code == 200
        
        data = response.json()
        assert "models" in data
        assert data["total"] == 5
        
        # Verify model portfolio names
        model_names = [m["name"] for m in data["models"]]
        assert "Conservative Income" in model_names
        assert "Balanced Growth" in model_names
        assert "Growth Focused" in model_names
        assert "Aggressive Tech Growth" in model_names
        assert "Crypto Allocation Strategy" in model_names
        print(f"✓ Model portfolios: {data['total']} models - {model_names}")
    
    def test_analyze_rebalance_drift(self):
        """GET /api/portfolio-engine/rebalance/analyze/{client_id} analyzes drift"""
        response = requests.get(f"{BASE_URL}/api/portfolio-engine/rebalance/analyze/client_1")
        assert response.status_code == 200
        
        data = response.json()
        assert "plan_id" in data
        assert "client_id" in data
        assert "analysis" in data
        assert "current_drift" in data["analysis"]
        assert "needs_rebalance" in data["analysis"]
        assert "actions" in data
        assert "summary" in data
        print(f"✓ Rebalance analysis: drift={data['analysis']['current_drift']}%, needs_rebalance={data['analysis']['needs_rebalance']}")
    
    def test_get_drift_report(self):
        """GET /api/portfolio-engine/drift-report returns drift report"""
        response = requests.get(f"{BASE_URL}/api/portfolio-engine/drift-report")
        assert response.status_code == 200
        
        data = response.json()
        assert "generated_at" in data
        assert "models" in data
        assert "summary" in data
        assert "total_clients" in data["summary"]
        assert "total_aum" in data["summary"]
        assert "clients_in_drift" in data["summary"]
        print(f"✓ Drift report: {data['summary']['total_clients']} clients, {data['summary']['clients_in_drift']} in drift")
    
    def test_get_client_portfolios(self):
        """GET /api/portfolio-engine/clients returns client portfolio assignments"""
        response = requests.get(f"{BASE_URL}/api/portfolio-engine/clients")
        assert response.status_code == 200
        
        data = response.json()
        assert "clients" in data
        assert "total" in data
        assert data["total"] >= 3  # At least 3 pre-defined clients
        print(f"✓ Client portfolios: {data['total']} clients")


class TestSmartRouter:
    """Smart Order Router - Intelligent order routing"""
    
    def test_route_order(self):
        """POST /api/smart-router/route returns routing decision"""
        # API requires JSON body with specific fields
        route_request = {
            "client_id": "TEST_client_1",
            "symbol": "AAPL",
            "asset_class": "equity",
            "side": "buy",
            "quantity": 100,
            "order_value": 17850,
            "urgency": "normal"
        }
        response = requests.post(
            f"{BASE_URL}/api/smart-router/route",
            json=route_request
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "routing_id" in data
        assert "recommended_venue" in data
        assert "analysis" in data
        assert "estimated_cost" in data["analysis"]
        print(f"✓ Route decision: venue={data['recommended_venue']}, cost=${data['analysis']['estimated_cost']}")
    
    def test_get_venues(self):
        """GET /api/smart-router/venues returns venue configs"""
        response = requests.get(f"{BASE_URL}/api/smart-router/venues")
        assert response.status_code == 200
        
        data = response.json()
        assert "venues" in data
        assert len(data["venues"]) >= 5  # At least 5 venues configured
        
        venue_names = [v["name"] for v in data["venues"]]
        print(f"✓ Venues: {len(data['venues'])} venues - {venue_names}")
    
    def test_compliance_check(self):
        """POST /api/smart-router/compliance/check runs compliance"""
        response = requests.post(
            f"{BASE_URL}/api/smart-router/compliance/check",
            params={
                "client_id": "client_1",
                "symbol": "AAPL",
                "side": "buy",
                "quantity": 100,
                "order_value": 17850
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        # API returns overall_status instead of check_id
        assert "overall_status" in data
        assert "can_proceed" in data
        assert "checks" in data
        assert data["overall_status"] in ["approved", "pending_review", "rejected", "flagged"]
        print(f"✓ Compliance check: status={data['overall_status']}, can_proceed={data['can_proceed']}, checks={len(data['checks'])}")


class TestCryptoIntegration:
    """Crypto Integration - Custody & trading"""
    
    def test_get_crypto_assets_returns_8(self):
        """GET /api/crypto/assets returns 8 crypto assets"""
        response = requests.get(f"{BASE_URL}/api/crypto/assets")
        assert response.status_code == 200
        
        data = response.json()
        assert "assets" in data
        assert data["total"] == 8
        
        symbols = [a["symbol"] for a in data["assets"]]
        # Actual assets: BTC, ETH, SOL, XRP, ADA, LINK, USDC, USDT
        expected = ["BTC", "ETH", "SOL", "XRP", "ADA", "LINK", "USDC", "USDT"]
        for sym in expected:
            assert sym in symbols, f"Missing crypto asset: {sym}"
        print(f"✓ Crypto assets: {data['total']} assets - {symbols}")
    
    def test_get_crypto_holdings(self):
        """GET /api/crypto/holdings/{client_id} returns holdings"""
        response = requests.get(f"{BASE_URL}/api/crypto/holdings/client_1")
        assert response.status_code == 200
        
        data = response.json()
        assert "client_id" in data
        assert "has_crypto" in data
        if data["has_crypto"]:
            assert "positions" in data
            assert "total_value" in data
            print(f"✓ Crypto holdings: {len(data['positions'])} positions, value=${data['total_value']}")
        else:
            print(f"✓ Crypto holdings: client has no crypto")
    
    def test_get_crypto_portfolio_summary(self):
        """GET /api/crypto/portfolio-summary returns summary"""
        response = requests.get(f"{BASE_URL}/api/crypto/portfolio-summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_crypto_value" in data
        assert "total_clients_with_crypto" in data
        assert "by_asset" in data
        assert "timestamp" in data
        print(f"✓ Crypto summary: ${data['total_crypto_value']}, {data['total_clients_with_crypto']} clients")
    
    def test_get_custody_providers(self):
        """GET /api/crypto/custody-providers returns providers"""
        response = requests.get(f"{BASE_URL}/api/crypto/custody-providers")
        assert response.status_code == 200
        
        data = response.json()
        assert "providers" in data
        assert len(data["providers"]) >= 4
        
        provider_names = [p["name"] for p in data["providers"]]
        print(f"✓ Custody providers: {len(data['providers'])} - {provider_names}")


class TestRealTimeData:
    """Real-Time Data Layer - Live prices & WebSocket"""
    
    def test_get_live_prices(self):
        """GET /api/realtime/prices returns live prices"""
        response = requests.get(f"{BASE_URL}/api/realtime/prices")
        assert response.status_code == 200
        
        data = response.json()
        assert "prices" in data
        assert "timestamp" in data
        
        # Should have at least 16 symbols
        assert len(data["prices"]) >= 16
        
        # Verify key symbols present
        prices = data["prices"]
        assert "AAPL" in prices
        assert "MSFT" in prices
        assert "BTC" in prices
        assert "ETH" in prices
        print(f"✓ Live prices: {len(data['prices'])} symbols tracked")
    
    def test_get_market_indices(self):
        """GET /api/realtime/indices returns market indices"""
        response = requests.get(f"{BASE_URL}/api/realtime/indices")
        assert response.status_code == 200
        
        data = response.json()
        assert "indices" in data
        assert "timestamp" in data
        
        indices = data["indices"]
        assert "^GSPC" in indices  # S&P 500
        assert "^DJI" in indices   # Dow Jones
        assert "^IXIC" in indices  # NASDAQ
        assert "^AXJO" in indices  # ASX 200
        print(f"✓ Market indices: {len(data['indices'])} indices")
    
    def test_get_market_summary(self):
        """GET /api/realtime/market-summary returns summary"""
        response = requests.get(f"{BASE_URL}/api/realtime/market-summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "timestamp" in data
        assert "indices" in data
        assert "top_gainers" in data
        assert "top_losers" in data
        assert "most_active" in data
        assert "market_mood" in data
        assert data["market_mood"] in ["bullish", "bearish"]
        print(f"✓ Market summary: mood={data['market_mood']}, {len(data['top_gainers'])} gainers, {len(data['top_losers'])} losers")
    
    def test_realtime_status(self):
        """GET /api/realtime/status returns operational status"""
        response = requests.get(f"{BASE_URL}/api/realtime/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "operational"
        assert "symbols_tracked" in data
        assert data["symbols_tracked"] >= 16
        print(f"✓ Realtime status: {data['status']}, {data['symbols_tracked']} symbols")


class TestReconciliation:
    """Cross-Platform Reconciliation Engine"""
    
    def test_reconciliation_status_operational(self):
        """GET /api/reconciliation/status returns operational"""
        response = requests.get(f"{BASE_URL}/api/reconciliation/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "operational"
        assert "total_clients" in data
        assert "reconciled" in data
        assert "data_sources" in data
        
        # Should have 7 data sources
        assert len(data["data_sources"]) >= 7
        print(f"✓ Reconciliation status: {data['status']}, {data['total_clients']} clients, {len(data['data_sources'])} sources")
    
    def test_get_unified_client_view(self):
        """GET /api/reconciliation/client/{client_id} returns unified view"""
        response = requests.get(f"{BASE_URL}/api/reconciliation/client/client_1")
        assert response.status_code == 200
        
        data = response.json()
        assert "client_id" in data
        assert "client_name" in data
        assert "total_aum" in data
        assert "accounts" in data
        assert "unified_positions" in data
        assert "cash_balances" in data
        assert "reconciliation_status" in data
        assert "by_asset_class" in data
        
        # Verify asset class breakdown
        assert "equities" in data["by_asset_class"]
        assert "crypto" in data["by_asset_class"]
        assert "cash" in data["by_asset_class"]
        print(f"✓ Unified view: {data['client_name']}, AUM=${data['total_aum']}, {len(data['accounts'])} accounts")
    
    def test_reconcile_all_clients(self):
        """POST /api/reconciliation/reconcile-all reconciles all clients"""
        response = requests.post(f"{BASE_URL}/api/reconciliation/reconcile-all")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "total_clients" in data
        assert "matched" in data
        assert "discrepancies" in data
        assert "results" in data
        assert "completed_at" in data
        print(f"✓ Reconcile all: {data['total_clients']} clients, {data['matched']} matched, {data['discrepancies']} discrepancies")
    
    def test_get_portfolio_summary(self):
        """GET /api/reconciliation/portfolio-summary returns aggregated summary"""
        response = requests.get(f"{BASE_URL}/api/reconciliation/portfolio-summary")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_aum" in data
        assert "total_clients" in data
        assert "by_source" in data
        assert "by_asset_class" in data
        print(f"✓ Portfolio summary: AUM=${data['total_aum']}, {data['total_clients']} clients")


class TestBlockTrading:
    """Block Trading - Execute once, allocate to many"""
    
    def test_submit_block_order(self):
        """POST /api/execution/block-order submits block order"""
        block_order = {
            "symbol": "AAPL",
            "asset_class": "equity",
            "side": "buy",
            "total_quantity": 1000,
            "order_type": "market",
            "allocations": [
                {"client_id": "TEST_client_1", "percentage": 40},
                {"client_id": "TEST_client_2", "percentage": 35},
                {"client_id": "TEST_client_3", "percentage": 25}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/execution/block-order",
            json=block_order
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "block_id" in data
        assert data["block_id"].startswith("BLK_")
        assert data["status"] == "filled"
        assert data["allocations_count"] == 3
        assert "child_orders" in data
        assert len(data["child_orders"]) == 3
        print(f"✓ Block order: {data['block_id']}, {data['allocations_count']} allocations, {len(data['child_orders'])} child orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
