"""
Test Iteration 62 - Wealth Command v6.1.0
Revenue Layer (AUM Fees, Trading Fees, Subscriptions) + FX Trading Integration

Tests:
- Revenue Layer: fee schedules, subscription plans, fee calculation, invoicing
- FX Trading: currency pairs, accounts, orders, exposure analysis, hedging
- Health endpoint: version 6.1.0 with fx_trading capability
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthEndpoint:
    """Health check should show v6.1.0 with fx_trading capability"""
    
    def test_health_returns_v6_1_0(self):
        """Verify health endpoint returns version 6.1.0"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "healthy"
        assert data["version"] == "6.1.0"
        assert data["service"] == "wealth-command"
        
    def test_health_has_fx_trading_capability(self):
        """Verify fx_trading is in execution_layer"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        
        assert "execution_layer" in data
        assert data["execution_layer"]["fx_trading"]
        
    def test_health_has_revenue_layer(self):
        """Verify revenue_layer is present"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        
        assert "revenue_layer" in data
        assert data["revenue_layer"]["aum_fees"]
        assert data["revenue_layer"]["trading_fees"]
        assert data["revenue_layer"]["subscriptions"]
        
    def test_health_has_fx_capabilities(self):
        """Verify fx_trading and currency_hedging in capabilities"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        
        assert "capabilities" in data
        assert "fx_trading" in data["capabilities"]
        assert "currency_hedging" in data["capabilities"]


class TestRevenueLayerStatus:
    """Revenue Layer /api/revenue/status endpoint tests"""
    
    def test_revenue_status_returns_200(self):
        """Verify revenue status endpoint is operational"""
        response = requests.get(f"{BASE_URL}/api/revenue/status")
        assert response.status_code == 200
        
    def test_revenue_status_structure(self):
        """Verify revenue status response structure"""
        response = requests.get(f"{BASE_URL}/api/revenue/status")
        data = response.json()
        
        assert data["status"] == "operational"
        assert "total_clients_billed" in data
        assert "total_arr" in data
        assert "total_mrr" in data
        assert "fee_schedules" in data
        assert "subscription_plans" in data
        assert "outstanding_invoices" in data
        
    def test_revenue_status_has_clients(self):
        """Verify there are clients being billed"""
        response = requests.get(f"{BASE_URL}/api/revenue/status")
        data = response.json()
        
        assert data["total_clients_billed"] >= 3  # client_1, client_2, client_4


class TestRevenueLayerFeeSchedules:
    """Revenue Layer /api/revenue/fee-schedules endpoint tests"""
    
    def test_fee_schedules_returns_200(self):
        """Verify fee schedules endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/revenue/fee-schedules")
        assert response.status_code == 200
        
    def test_fee_schedules_structure(self):
        """Verify fee schedules response structure"""
        response = requests.get(f"{BASE_URL}/api/revenue/fee-schedules")
        data = response.json()
        
        assert "schedules" in data
        assert len(data["schedules"]) >= 4  # standard_aum, premium_aum, trading_commission, performance_fee
        
    def test_fee_schedules_has_standard_aum(self):
        """Verify standard_aum fee schedule exists"""
        response = requests.get(f"{BASE_URL}/api/revenue/fee-schedules")
        data = response.json()
        
        schedule_ids = [s["id"] for s in data["schedules"]]
        assert "standard_aum" in schedule_ids
        
    def test_fee_schedules_has_trading_commission(self):
        """Verify trading_commission fee schedule exists"""
        response = requests.get(f"{BASE_URL}/api/revenue/fee-schedules")
        data = response.json()
        
        schedule_ids = [s["id"] for s in data["schedules"]]
        assert "trading_commission" in schedule_ids


class TestRevenueLayerSubscriptionPlans:
    """Revenue Layer /api/revenue/subscription-plans endpoint tests"""
    
    def test_subscription_plans_returns_200(self):
        """Verify subscription plans endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/revenue/subscription-plans")
        assert response.status_code == 200
        
    def test_subscription_plans_structure(self):
        """Verify subscription plans response structure"""
        response = requests.get(f"{BASE_URL}/api/revenue/subscription-plans")
        data = response.json()
        
        assert "plans" in data
        assert "currency" in data
        assert data["currency"] == "AUD"
        
    def test_subscription_plans_has_three_tiers(self):
        """Verify starter, professional, enterprise plans exist"""
        response = requests.get(f"{BASE_URL}/api/revenue/subscription-plans")
        data = response.json()
        
        plan_ids = [p["id"] for p in data["plans"]]
        assert "starter" in plan_ids
        assert "professional" in plan_ids
        assert "enterprise" in plan_ids
        
    def test_subscription_plans_pricing(self):
        """Verify subscription plan pricing"""
        response = requests.get(f"{BASE_URL}/api/revenue/subscription-plans")
        data = response.json()
        
        plans = {p["id"]: p for p in data["plans"]}
        
        assert plans["starter"]["price_monthly"] == 99
        assert plans["professional"]["price_monthly"] == 299
        assert plans["enterprise"]["price_monthly"] == 999


class TestRevenueLayerCalculateFee:
    """Revenue Layer /api/revenue/calculate-fee endpoint tests"""
    
    def test_calculate_fee_returns_200(self):
        """Verify calculate fee endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/calculate-fee",
            params={"aum": 1000000, "schedule_id": "standard_aum"}
        )
        assert response.status_code == 200
        
    def test_calculate_fee_structure(self):
        """Verify calculate fee response structure"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/calculate-fee",
            params={"aum": 1000000, "schedule_id": "standard_aum"}
        )
        data = response.json()
        
        assert "aum" in data
        assert "schedule" in data
        assert "annual_fee_gross" in data
        assert "annual_fee_net" in data
        assert "quarterly_fee" in data
        assert "monthly_fee" in data
        assert "effective_rate" in data
        assert "breakdown" in data
        
    def test_calculate_fee_tiered_calculation(self):
        """Verify tiered fee calculation is correct"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/calculate-fee",
            params={"aum": 1000000, "schedule_id": "standard_aum"}
        )
        data = response.json()
        
        # For $1M: $500k @ 1.25% + $500k @ 1.00% = $6,250 + $5,000 = $11,250
        assert data["annual_fee_gross"] == 11250.0
        
    def test_calculate_fee_with_discount(self):
        """Verify discount is applied correctly"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/calculate-fee",
            params={"aum": 1000000, "schedule_id": "standard_aum", "discount_percent": 10}
        )
        data = response.json()
        
        assert data["discount_percent"] == 10
        assert data["discount_amount"] == 1125.0  # 10% of $11,250
        assert data["annual_fee_net"] == 10125.0  # $11,250 - $1,125


class TestRevenueLayerCalculateTradingFee:
    """Revenue Layer /api/revenue/calculate-trading-fee endpoint tests"""
    
    def test_calculate_trading_fee_returns_200(self):
        """Verify calculate trading fee endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/calculate-trading-fee",
            params={"asset_class": "equity_au", "trade_value": 10000}
        )
        assert response.status_code == 200
        
    def test_calculate_trading_fee_structure(self):
        """Verify calculate trading fee response structure"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/calculate-trading-fee",
            params={"asset_class": "equity_au", "trade_value": 10000}
        )
        data = response.json()
        
        assert "asset_class" in data
        assert "trade_value" in data
        assert "commission" in data
        assert "net_value" in data
        
    def test_calculate_trading_fee_au_equity(self):
        """Verify AU equity trading fee ($9.50 flat)"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/calculate-trading-fee",
            params={"asset_class": "equity_au", "trade_value": 10000}
        )
        data = response.json()
        
        assert data["commission"] == 9.50
        assert data["net_value"] == 9990.50
        
    def test_calculate_trading_fee_crypto(self):
        """Verify crypto trading fee (0.10%)"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/calculate-trading-fee",
            params={"asset_class": "crypto", "trade_value": 10000}
        )
        data = response.json()
        
        assert data["commission"] == 10.0  # 0.10% of $10,000


class TestRevenueLayerClientFees:
    """Revenue Layer /api/revenue/client/{client_id}/fees endpoint tests"""
    
    def test_client_fees_returns_200(self):
        """Verify client fees endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/revenue/client/client_1/fees")
        assert response.status_code == 200
        
    def test_client_fees_structure(self):
        """Verify client fees response structure"""
        response = requests.get(f"{BASE_URL}/api/revenue/client/client_1/fees")
        data = response.json()
        
        assert "client_id" in data
        assert "client_name" in data
        assert "fee_schedule" in data
        assert "current_aum" in data
        assert "annual_fee_gross" in data
        assert "annual_fee_net" in data
        assert "quarterly_fee" in data
        assert "effective_rate" in data
        
    def test_client_fees_client_1(self):
        """Verify client_1 (Wheeler Family) fee details"""
        response = requests.get(f"{BASE_URL}/api/revenue/client/client_1/fees")
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert data["client_name"] == "Wheeler Family"
        assert data["fee_schedule"] == "standard_aum"
        assert data["current_aum"] == 920000
        
    def test_client_fees_not_found(self):
        """Verify 404 for non-existent client"""
        response = requests.get(f"{BASE_URL}/api/revenue/client/nonexistent_client/fees")
        assert response.status_code == 404


class TestRevenueLayerInvoiceGeneration:
    """Revenue Layer /api/revenue/invoice/generate/{client_id} endpoint tests"""
    
    def test_invoice_generate_returns_200(self):
        """Verify invoice generation endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/invoice/generate/client_1",
            params={"period_start": "2025-01-01", "period_end": "2025-03-31"}
        )
        assert response.status_code == 200
        
    def test_invoice_generate_structure(self):
        """Verify invoice response structure"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/invoice/generate/client_1",
            params={"period_start": "2025-01-01", "period_end": "2025-03-31"}
        )
        data = response.json()
        
        assert "invoice_id" in data
        assert "client_id" in data
        assert "client_name" in data
        assert "period_start" in data
        assert "period_end" in data
        assert "line_items" in data
        assert "subtotal" in data
        assert "gst" in data
        assert "total" in data
        assert "currency" in data
        assert "status" in data
        assert "due_date" in data
        
    def test_invoice_generate_has_gst(self):
        """Verify invoice includes GST (10%)"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/invoice/generate/client_2",
            params={"period_start": "2025-01-01", "period_end": "2025-03-31"}
        )
        data = response.json()
        
        # GST should be 10% of net amount
        expected_gst = data["net_amount"] * 0.10
        assert abs(data["gst"] - expected_gst) < 0.01
        
    def test_invoice_generate_not_found(self):
        """Verify 404 for non-existent client"""
        response = requests.post(
            f"{BASE_URL}/api/revenue/invoice/generate/nonexistent_client",
            params={"period_start": "2025-01-01", "period_end": "2025-03-31"}
        )
        assert response.status_code == 404


class TestRevenueLayerRevenueReport:
    """Revenue Layer /api/revenue/revenue-report endpoint tests"""
    
    def test_revenue_report_returns_200(self):
        """Verify revenue report endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/revenue/revenue-report")
        assert response.status_code == 200
        
    def test_revenue_report_structure(self):
        """Verify revenue report response structure"""
        response = requests.get(f"{BASE_URL}/api/revenue/revenue-report")
        data = response.json()
        
        assert "year" in data
        assert "generated_at" in data
        assert "summary" in data
        assert "by_segment" in data
        assert "growth" in data
        assert "projections" in data
        
    def test_revenue_report_summary(self):
        """Verify revenue report summary fields"""
        response = requests.get(f"{BASE_URL}/api/revenue/revenue-report")
        data = response.json()
        
        summary = data["summary"]
        assert "total_aum" in summary
        assert "total_arr" in summary
        assert "total_mrr" in summary
        assert "ytd_collected" in summary
        assert "average_fee_rate" in summary
        
    def test_revenue_report_segments(self):
        """Verify revenue report has client segments"""
        response = requests.get(f"{BASE_URL}/api/revenue/revenue-report")
        data = response.json()
        
        segments = data["by_segment"]
        assert "high_value" in segments
        assert "core" in segments
        assert "emerging" in segments


class TestFXTradingStatus:
    """FX Trading /api/fx/status endpoint tests"""
    
    def test_fx_status_returns_200(self):
        """Verify FX status endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/fx/status")
        assert response.status_code == 200
        
    def test_fx_status_structure(self):
        """Verify FX status response structure"""
        response = requests.get(f"{BASE_URL}/api/fx/status")
        data = response.json()
        
        assert data["status"] == "operational"
        assert "platforms" in data
        assert "pairs_available" in data
        assert "demo_mode" in data
        
    def test_fx_status_platforms(self):
        """Verify MT5 and cTrader platforms are listed"""
        response = requests.get(f"{BASE_URL}/api/fx/status")
        data = response.json()
        
        assert "mt5" in data["platforms"]
        assert "ctrader" in data["platforms"]
        assert data["platforms"]["mt5"]["demo_available"]
        assert data["platforms"]["ctrader"]["demo_available"]


class TestFXTradingPairs:
    """FX Trading /api/fx/pairs endpoint tests"""
    
    def test_fx_pairs_returns_200(self):
        """Verify FX pairs endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/fx/pairs")
        assert response.status_code == 200
        
    def test_fx_pairs_structure(self):
        """Verify FX pairs response structure"""
        response = requests.get(f"{BASE_URL}/api/fx/pairs")
        data = response.json()
        
        assert "pairs" in data
        assert "total" in data
        assert "categories" in data
        assert "timestamp" in data
        
    def test_fx_pairs_has_major_pairs(self):
        """Verify major currency pairs exist"""
        response = requests.get(f"{BASE_URL}/api/fx/pairs")
        data = response.json()
        
        symbols = [p["symbol"] for p in data["pairs"]]
        assert "EUR/USD" in symbols
        assert "GBP/USD" in symbols
        assert "USD/JPY" in symbols
        assert "AUD/USD" in symbols
        
    def test_fx_pairs_filter_by_category(self):
        """Verify filtering by category works"""
        response = requests.get(f"{BASE_URL}/api/fx/pairs", params={"category": "major"})
        data = response.json()
        
        for pair in data["pairs"]:
            assert pair["category"] == "major"


class TestFXTradingPairDetail:
    """FX Trading /api/fx/pairs/{symbol} endpoint tests"""
    
    def test_fx_pair_detail_returns_200(self):
        """Verify FX pair detail endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/fx/pairs/EUR_USD")
        assert response.status_code == 200
        
    def test_fx_pair_detail_structure(self):
        """Verify FX pair detail response structure"""
        response = requests.get(f"{BASE_URL}/api/fx/pairs/EUR_USD")
        data = response.json()
        
        assert data["symbol"] == "EUR/USD"
        assert "bid" in data
        assert "ask" in data
        assert "spread" in data
        assert "pip_value" in data
        assert "mid" in data
        assert "daily_range" in data
        
    def test_fx_pair_detail_not_found(self):
        """Verify 404 for non-existent pair"""
        response = requests.get(f"{BASE_URL}/api/fx/pairs/XXX_YYY")
        assert response.status_code == 404


class TestFXTradingAccounts:
    """FX Trading /api/fx/accounts endpoint tests"""
    
    def test_fx_accounts_returns_200(self):
        """Verify FX accounts endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/fx/accounts")
        assert response.status_code == 200
        
    def test_fx_accounts_structure(self):
        """Verify FX accounts response structure"""
        response = requests.get(f"{BASE_URL}/api/fx/accounts")
        data = response.json()
        
        assert "accounts" in data
        assert len(data["accounts"]) >= 2  # demo_mt5, demo_ctrader
        
    def test_fx_accounts_has_demo_accounts(self):
        """Verify demo accounts exist"""
        response = requests.get(f"{BASE_URL}/api/fx/accounts")
        data = response.json()
        
        account_ids = [a["account_id"] for a in data["accounts"]]
        assert "demo_mt5" in account_ids
        assert "demo_ctrader" in account_ids


class TestFXTradingOrder:
    """FX Trading /api/fx/order endpoint tests"""
    
    def test_fx_order_returns_200(self):
        """Verify FX order endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/fx/order",
            json={
                "symbol": "EUR/USD",
                "side": "buy",
                "volume": 0.1,
                "order_type": "market",
                "account_id": "demo_mt5"
            }
        )
        assert response.status_code == 200
        
    def test_fx_order_structure(self):
        """Verify FX order response structure"""
        response = requests.post(
            f"{BASE_URL}/api/fx/order",
            json={
                "symbol": "EUR/USD",
                "side": "buy",
                "volume": 0.1,
                "order_type": "market",
                "account_id": "demo_mt5"
            }
        )
        data = response.json()
        
        assert data["success"]
        assert "order" in data
        assert "message" in data
        
        order = data["order"]
        assert "order_id" in order
        assert order["symbol"] == "EUR/USD"
        assert order["side"] == "buy"
        assert order["volume"] == 0.1
        assert order["status"] == "executed"
        assert order["demo_mode"]
        
    def test_fx_order_sell(self):
        """Verify sell order works"""
        response = requests.post(
            f"{BASE_URL}/api/fx/order",
            json={
                "symbol": "GBP/USD",
                "side": "sell",
                "volume": 0.5,
                "order_type": "market",
                "account_id": "demo_ctrader"
            }
        )
        data = response.json()
        
        assert data["success"]
        assert data["order"]["side"] == "sell"


class TestFXTradingOrders:
    """FX Trading /api/fx/orders endpoint tests"""
    
    def test_fx_orders_returns_200(self):
        """Verify FX orders endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/fx/orders")
        assert response.status_code == 200
        
    def test_fx_orders_structure(self):
        """Verify FX orders response structure"""
        response = requests.get(f"{BASE_URL}/api/fx/orders")
        data = response.json()
        
        assert "orders" in data
        assert "total" in data


class TestFXTradingExposure:
    """FX Trading /api/fx/exposure/{client_id} endpoint tests"""
    
    def test_fx_exposure_returns_200(self):
        """Verify FX exposure endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/fx/exposure/client_1")
        assert response.status_code == 200
        
    def test_fx_exposure_structure(self):
        """Verify FX exposure response structure"""
        response = requests.get(f"{BASE_URL}/api/fx/exposure/client_1")
        data = response.json()
        
        assert "client_id" in data
        assert "has_fx_exposure" in data
        
    def test_fx_exposure_client_1(self):
        """Verify client_1 has FX exposure"""
        response = requests.get(f"{BASE_URL}/api/fx/exposure/client_1")
        data = response.json()
        
        assert data["client_id"] == "client_1"
        assert data["has_fx_exposure"]
        assert "exposures" in data
        assert "hedging_strategy" in data
        assert "recommendations" in data
        
    def test_fx_exposure_no_exposure(self):
        """Verify client without exposure returns empty"""
        response = requests.get(f"{BASE_URL}/api/fx/exposure/client_3")
        data = response.json()
        
        assert not data["has_fx_exposure"]


class TestFXTradingHedgePreview:
    """FX Trading /api/fx/hedge-preview endpoint tests"""
    
    def test_hedge_preview_returns_200(self):
        """Verify hedge preview endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/fx/hedge-preview",
            params={
                "client_id": "client_1",
                "currency": "USD",
                "amount": 100000,
                "duration_months": 3
            }
        )
        assert response.status_code == 200
        
    def test_hedge_preview_structure(self):
        """Verify hedge preview response structure"""
        response = requests.post(
            f"{BASE_URL}/api/fx/hedge-preview",
            params={
                "client_id": "client_1",
                "currency": "USD",
                "amount": 100000,
                "duration_months": 3
            }
        )
        data = response.json()
        
        assert "client_id" in data
        assert "currency_pair" in data
        assert "amount_to_hedge" in data
        assert "spot_rate" in data
        assert "forward_rate" in data
        assert "forward_points" in data
        assert "duration_months" in data
        assert "hedge_cost_aud" in data
        assert "hedge_cost_percent" in data
        assert "protected_value_aud" in data
        assert "recommendation" in data


class TestFXTradingMarketHours:
    """FX Trading /api/fx/market-hours endpoint tests"""
    
    def test_market_hours_returns_200(self):
        """Verify market hours endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/fx/market-hours")
        assert response.status_code == 200
        
    def test_market_hours_structure(self):
        """Verify market hours response structure"""
        response = requests.get(f"{BASE_URL}/api/fx/market-hours")
        data = response.json()
        
        assert "current_time_utc" in data
        assert "market_open" in data
        assert "sessions" in data
        assert "active_sessions" in data
        assert "best_liquidity" in data
        
    def test_market_hours_sessions(self):
        """Verify all trading sessions are listed"""
        response = requests.get(f"{BASE_URL}/api/fx/market-hours")
        data = response.json()
        
        sessions = data["sessions"]
        assert "sydney" in sessions
        assert "tokyo" in sessions
        assert "london" in sessions
        assert "new_york" in sessions


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
