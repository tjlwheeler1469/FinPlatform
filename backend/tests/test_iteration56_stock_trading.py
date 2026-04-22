"""
Test Suite for Iteration 56 - Stock Trading System with CGT Calculations
Tests: Stock Trading APIs, CGT calculations, Holdings management, Meeting Prep redesign
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://retirement-readiness-2.preview.emergentagent.com')

class TestHealthAndBasics:
    """Basic health and connectivity tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")


class TestTradingHoldings:
    """Test trading holdings endpoints"""
    
    def test_get_client_holdings(self):
        """Test GET /api/trading/holdings/{client_id}"""
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "client_id" in data
        assert "client_name" in data
        assert "entity_type" in data
        assert "holdings" in data
        assert "summary" in data
        
        # Verify holdings data
        assert len(data["holdings"]) > 0
        holding = data["holdings"][0]
        assert "symbol" in holding
        assert "name" in holding
        assert "units" in holding
        assert "avg_cost" in holding
        assert "current_price" in holding
        assert "current_value" in holding
        assert "unrealized_gain" in holding
        assert "eligible_for_cgt_discount" in holding
        assert "is_loss" in holding
        
        # Verify summary
        assert "total_value" in data["summary"]
        assert "total_cost_base" in data["summary"]
        assert "total_unrealized_gain" in data["summary"]
        assert "gains_count" in data["summary"]
        assert "losses_count" in data["summary"]
        
        print(f"✓ Holdings for {data['client_name']}: {len(data['holdings'])} holdings, total value ${data['summary']['total_value']:,.2f}")
    
    def test_get_holdings_multiple_clients(self):
        """Test holdings for different client types"""
        clients = ["client_1", "client_2", "client_3", "client_4"]
        entity_types = []
        
        for client_id in clients:
            response = requests.get(f"{BASE_URL}/api/trading/holdings/{client_id}")
            assert response.status_code == 200
            data = response.json()
            entity_types.append(data["entity_type"])
            print(f"✓ {data['client_name']} ({data['entity_type']}): {len(data['holdings'])} holdings")
        
        # Verify different entity types
        assert "individual" in entity_types
        assert "trust" in entity_types
        assert "smsf_accumulation" in entity_types
        assert "company" in entity_types
    
    def test_get_holding_detail(self):
        """Test GET /api/trading/holding/{client_id}/{symbol}"""
        response = requests.get(f"{BASE_URL}/api/trading/holding/client_1/CBA.AX")
        assert response.status_code == 200
        data = response.json()
        
        assert "client_id" in data
        assert "holding" in data
        assert "cgt_preview_if_sold_today" in data
        
        # Verify CGT preview
        cgt = data["cgt_preview_if_sold_today"]
        assert "units_sold" in cgt
        assert "gross_capital_gain" in cgt
        assert "eligible_for_discount" in cgt
        assert "net_capital_gain" in cgt
        assert "estimated_cgt_liability" in cgt
        
        print(f"✓ Holding detail for CBA.AX: {data['holding']['units']} units, CGT preview included")
    
    def test_get_holding_with_loss(self):
        """Test holding that has unrealized loss (BHP.AX)"""
        response = requests.get(f"{BASE_URL}/api/trading/holding/client_1/BHP.AX")
        assert response.status_code == 200
        data = response.json()
        
        # BHP.AX should show a loss
        assert data["holding"]["unrealized_gain"] < 0
        assert data["cgt_preview_if_sold_today"]["is_capital_loss"] is True
        
        print(f"✓ BHP.AX shows unrealized loss: ${abs(data['holding']['unrealized_gain']):,.2f}")
    
    def test_holding_not_found(self):
        """Test 404 for non-existent holding"""
        response = requests.get(f"{BASE_URL}/api/trading/holding/client_1/INVALID.AX")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent holding")


class TestCGTCalculations:
    """Test CGT calculation endpoints"""
    
    def test_calculate_cgt_with_discount(self):
        """Test CGT calculation for holding eligible for 50% discount"""
        response = requests.post(
            f"{BASE_URL}/api/trading/calculate-cgt",
            params={"client_id": "client_1", "symbol": "CBA.AX", "units_to_sell": 50}
        )
        assert response.status_code == 200
        data = response.json()
        
        cgt = data["cgt_calculation"]
        assert cgt["eligible_for_discount"] is True
        assert cgt["discount_percentage"] == 50
        assert cgt["gross_capital_gain"] > 0
        assert cgt["discount_applied"] > 0
        assert cgt["net_capital_gain"] == cgt["gross_capital_gain"] - cgt["discount_applied"]
        
        print(f"✓ CGT with discount: Gross ${cgt['gross_capital_gain']:,.2f}, Net ${cgt['net_capital_gain']:,.2f}, Tax ${cgt['estimated_cgt_liability']:,.2f}")
    
    def test_calculate_cgt_capital_loss(self):
        """Test CGT calculation for holding with loss (BHP.AX)"""
        response = requests.post(
            f"{BASE_URL}/api/trading/calculate-cgt",
            params={"client_id": "client_1", "symbol": "BHP.AX", "units_to_sell": 100}
        )
        assert response.status_code == 200
        data = response.json()
        
        cgt = data["cgt_calculation"]
        assert cgt["is_capital_loss"] is True
        assert cgt["gross_capital_gain"] < 0
        assert cgt["estimated_cgt_liability"] == 0  # No tax on losses
        
        # Check recommendation for tax-loss harvesting
        assert "recommendation" in data
        recs = data["recommendation"]["recommendations"]
        assert any(r["type"] == "tax_loss_harvesting" for r in recs)
        
        print(f"✓ Capital loss: ${abs(cgt['gross_capital_gain']):,.2f} - Tax-loss harvesting recommended")
    
    def test_calculate_cgt_different_entity_types(self):
        """Test CGT rates for different entity types"""
        # Individual (client_1) - 37% marginal rate
        resp1 = requests.post(
            f"{BASE_URL}/api/trading/calculate-cgt",
            params={"client_id": "client_1", "symbol": "CBA.AX", "units_to_sell": 10}
        )
        assert resp1.status_code == 200
        individual_rate = resp1.json()["cgt_calculation"]["marginal_tax_rate"]
        
        # Trust (client_2) - 45% rate
        resp2 = requests.post(
            f"{BASE_URL}/api/trading/calculate-cgt",
            params={"client_id": "client_2", "symbol": "NVDA", "units_to_sell": 10}
        )
        assert resp2.status_code == 200
        trust_rate = resp2.json()["cgt_calculation"]["marginal_tax_rate"]
        
        # SMSF (client_3) - 15% rate
        resp3 = requests.post(
            f"{BASE_URL}/api/trading/calculate-cgt",
            params={"client_id": "client_3", "symbol": "VAS.AX", "units_to_sell": 10}
        )
        assert resp3.status_code == 200
        smsf_rate = resp3.json()["cgt_calculation"]["marginal_tax_rate"]
        
        # Company (client_4) - 25% rate
        resp4 = requests.post(
            f"{BASE_URL}/api/trading/calculate-cgt",
            params={"client_id": "client_4", "symbol": "META", "units_to_sell": 10}
        )
        assert resp4.status_code == 200
        company_rate = resp4.json()["cgt_calculation"]["marginal_tax_rate"]
        
        print(f"✓ CGT rates: Individual {individual_rate*100}%, Trust {trust_rate*100}%, SMSF {smsf_rate*100}%, Company {company_rate*100}%")
        
        assert trust_rate == 0.45
        assert smsf_rate == 0.15
        assert company_rate == 0.25
    
    def test_cgt_summary(self):
        """Test GET /api/trading/cgt-summary/{client_id}"""
        response = requests.get(f"{BASE_URL}/api/trading/cgt-summary/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert "client_id" in data
        assert "entity_type" in data
        assert "financial_year" in data
        assert "unrealized" in data
        assert "realized" in data
        assert "tax_planning_opportunities" in data
        
        # Verify unrealized section
        unrealized = data["unrealized"]
        assert "total_gains" in unrealized
        assert "total_losses" in unrealized
        assert "net_position" in unrealized
        assert "discount_eligible_gains" in unrealized
        
        # Verify tax planning opportunities
        opps = data["tax_planning_opportunities"]
        assert len(opps) >= 2
        opp_types = [o["type"] for o in opps]
        assert "tax_loss_harvesting" in opp_types
        assert "cgt_discount" in opp_types
        
        print(f"✓ CGT Summary: Unrealized gains ${unrealized['total_gains']:,.2f}, losses ${unrealized['total_losses']:,.2f}")


class TestOrderManagement:
    """Test order preview and execution"""
    
    def test_order_preview_sell(self):
        """Test sell order preview with CGT impact"""
        response = requests.post(
            f"{BASE_URL}/api/trading/order/preview",
            json={
                "client_id": "client_1",
                "symbol": "VAS.AX",
                "side": "sell",
                "units": 100
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "order_preview" in data
        assert "cgt_impact" in data
        assert "recommendation" in data
        assert "remaining_holding" in data
        
        preview = data["order_preview"]
        assert preview["side"] == "SELL"
        assert preview["units"] == 100
        assert "gross_proceeds" in preview
        assert "brokerage_fee" in preview
        assert "net_proceeds" in preview
        
        print(f"✓ Sell preview: {preview['units']} units @ ${preview['price']}, Net ${preview['net_proceeds']:,.2f}")
    
    def test_order_preview_buy(self):
        """Test buy order preview"""
        response = requests.post(
            f"{BASE_URL}/api/trading/order/preview",
            json={
                "client_id": "client_1",
                "symbol": "NEW.AX",
                "side": "buy",
                "units": 100,
                "limit_price": 50.00
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        preview = data["order_preview"]
        assert preview["side"] == "BUY"
        assert "total_cost" in preview
        assert data["cgt_impact"] is None  # No CGT on buys
        
        print(f"✓ Buy preview: {preview['units']} units @ ${preview['price']}, Total ${preview['total_cost']:,.2f}")
    
    def test_order_execute_demo_mode(self):
        """Test order execution in demo mode"""
        response = requests.post(
            f"{BASE_URL}/api/trading/order/execute",
            json={
                "client_id": "client_1",
                "symbol": "VAS.AX",
                "side": "sell",
                "units": 10
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["demo_mode_notice"] is not None
        assert "order" in data
        assert data["order"]["demo_mode"] is True
        assert "order_id" in data["order"]
        
        print(f"✓ Order executed (DEMO): {data['order']['order_id']}")


class TestHoldingModification:
    """Test increase/decrease holding endpoints"""
    
    def test_increase_holding(self):
        """Test POST /api/trading/increase-holding"""
        response = requests.post(
            f"{BASE_URL}/api/trading/increase-holding",
            params={
                "client_id": "client_2",
                "symbol": "NVDA",
                "additional_units": 5,
                "purchase_price": 950.00
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["action"] == "holding_increased"
        assert "new_avg_cost" in data
        assert "new_total_units" in data
        assert data["demo_mode"] is True
        
        print(f"✓ Holding increased: {data['additional_units']} units added, new avg cost ${data['new_avg_cost']:.2f}")
    
    def test_decrease_holding(self):
        """Test POST /api/trading/decrease-holding"""
        response = requests.post(
            f"{BASE_URL}/api/trading/decrease-holding",
            params={
                "client_id": "client_2",
                "symbol": "MSFT",
                "units_to_sell": 10,
                "sale_price": 425.00
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["action"] == "holding_decreased"
        assert "cgt_event" in data
        assert "tax_summary" in data
        assert data["demo_mode"] is True
        
        tax = data["tax_summary"]
        print(f"✓ Holding decreased: {data['units_sold']} units sold, CGT ${tax['estimated_tax']:,.2f}")
    
    def test_decrease_holding_insufficient_units(self):
        """Test error when trying to sell more units than available"""
        response = requests.post(
            f"{BASE_URL}/api/trading/decrease-holding",
            params={
                "client_id": "client_1",
                "symbol": "CSL.AX",
                "units_to_sell": 1000  # More than available
            }
        )
        assert response.status_code == 400
        print("✓ 400 returned for insufficient units")


class TestBrokerIntegrations:
    """Test broker integration endpoints"""
    
    def test_get_brokers(self):
        """Test GET /api/trading/brokers"""
        response = requests.get(f"{BASE_URL}/api/trading/brokers")
        assert response.status_code == 200
        data = response.json()
        
        assert "brokers" in data
        assert len(data["brokers"]) >= 4
        
        broker_names = [b["name"] for b in data["brokers"]]
        assert "OpenMarkets" in broker_names
        assert "SelfWealth" in broker_names
        assert "Interactive Brokers" in broker_names
        assert "CMC Markets" in broker_names
        
        # All should be in demo mode
        for broker in data["brokers"]:
            assert broker["status"] == "demo"
            assert "fees" in broker
            assert "markets" in broker
        
        print(f"✓ {len(data['brokers'])} brokers available (all in demo mode)")


class TestMeetingPrepRedesign:
    """Test meeting prep endpoint (redesigned with light theme)"""
    
    def test_generate_meeting_prep(self):
        """Test POST /api/meeting-prep/generate"""
        response = requests.post(
            f"{BASE_URL}/api/meeting-prep/generate",
            json={
                "client_id": "client_1",
                "client_name": "Wheeler Family",
                "meeting_type": "review",
                "portfolio_value": 2920000,
                "ytd_return": 0.084,
                "retirement_probability": 72,
                "risk_profile": "Balanced",
                "age": 45
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "client_snapshot" in data or "snapshot" in data
        assert "portfolio_insights" in data
        assert "talking_points" in data
        
        print(f"✓ Meeting prep generated: {data.get('id', 'N/A')}")


class TestAdvisorCommandCenter:
    """Test unified command center (merged intelligence hub)"""
    
    def test_daily_digest(self):
        """Test GET /api/command-center/daily-digest"""
        response = requests.get(f"{BASE_URL}/api/command-center/daily-digest")
        assert response.status_code == 200
        data = response.json()
        
        assert "greeting" in data
        assert "metrics" in data
        assert "alerts" in data
        
        print(f"✓ Command center daily digest loaded")
    
    def test_monitoring_daily_scan(self):
        """Test GET /api/monitoring/daily-scan"""
        response = requests.get(f"{BASE_URL}/api/monitoring/daily-scan")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_clients" in data
        assert "total_alerts" in data
        
        print(f"✓ Monitoring scan: {data['total_clients']} clients, {data['total_alerts']} alerts")


class TestNavigationUpdates:
    """Test that navigation includes Trading section"""
    
    def test_stock_trading_page_accessible(self):
        """Verify stock trading page is accessible"""
        # This tests the frontend route exists by checking the API it calls
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1")
        assert response.status_code == 200
        print("✓ Stock trading API accessible (page should load)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
