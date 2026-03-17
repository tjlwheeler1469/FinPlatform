"""
Test Suite for Wealth Command v7.0.0 - Execution Brain Features
Tests: Macro Data APIs, Action Layer APIs, Broker Research APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMacroDataAPIs:
    """Test Macro Market Data endpoints - Global indices, currencies, bonds, commodities, crypto, futures"""
    
    def test_macro_overview(self):
        """Test /api/macro/overview returns comprehensive market overview"""
        response = requests.get(f"{BASE_URL}/api/macro/overview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "timestamp" in data
        assert "market_status" in data
        assert "highlights" in data
        assert "fear_greed_index" in data
        
        # Verify market status structure
        market_status = data["market_status"]
        assert "us" in market_status
        assert "australia" in market_status
        assert "europe" in market_status
        
        # Verify highlights structure
        highlights = data["highlights"]
        assert "indices" in highlights
        assert "currencies" in highlights
        assert "commodities" in highlights
        assert "crypto" in highlights
        assert "bonds" in highlights
        
        print(f"✓ Macro overview: fear_greed_index={data['fear_greed_index']}, sentiment={data.get('market_sentiment')}")
    
    def test_macro_indices(self):
        """Test /api/macro/indices returns global stock indices"""
        response = requests.get(f"{BASE_URL}/api/macro/indices")
        assert response.status_code == 200
        
        data = response.json()
        assert "us" in data
        assert "europe" in data
        assert "australia" in data
        assert "asia" in data
        assert "timestamp" in data
        
        # Verify US indices structure
        us_indices = data["us"]
        assert len(us_indices) > 0
        assert "symbol" in us_indices[0]
        assert "name" in us_indices[0]
        assert "value" in us_indices[0]
        
        print(f"✓ Indices: US={len(data['us'])}, Europe={len(data['europe'])}, Australia={len(data['australia'])}, Asia={len(data['asia'])}")
    
    def test_macro_indices_by_region(self):
        """Test /api/macro/indices with region filter"""
        response = requests.get(f"{BASE_URL}/api/macro/indices?region=us")
        assert response.status_code == 200
        
        data = response.json()
        assert data["region"] == "us"
        assert "indices" in data
        assert len(data["indices"]) > 0
        
        print(f"✓ US indices filtered: {len(data['indices'])} indices")
    
    def test_macro_currencies(self):
        """Test /api/macro/currencies returns FX rates"""
        response = requests.get(f"{BASE_URL}/api/macro/currencies")
        assert response.status_code == 200
        
        data = response.json()
        assert "major" in data
        assert "aud_crosses" in data
        assert "emerging" in data
        assert "timestamp" in data
        
        # Verify currency pair structure
        major = data["major"]
        assert len(major) > 0
        assert "pair" in major[0]
        assert "rate" in major[0]
        
        print(f"✓ Currencies: major={len(data['major'])}, aud_crosses={len(data['aud_crosses'])}, emerging={len(data['emerging'])}")
    
    def test_macro_bonds(self):
        """Test /api/macro/bonds returns bond yields"""
        response = requests.get(f"{BASE_URL}/api/macro/bonds")
        assert response.status_code == 200
        
        data = response.json()
        assert "us" in data
        assert "australia" in data
        assert "europe" in data
        assert "timestamp" in data
        
        # Verify bond structure
        us_bonds = data["us"]
        assert len(us_bonds) > 0
        assert "name" in us_bonds[0]
        assert "yield" in us_bonds[0]
        
        print(f"✓ Bonds: US={len(data['us'])}, Australia={len(data['australia'])}, Europe={len(data['europe'])}")
    
    def test_macro_commodities(self):
        """Test /api/macro/commodities returns commodity prices"""
        response = requests.get(f"{BASE_URL}/api/macro/commodities")
        assert response.status_code == 200
        
        data = response.json()
        assert "energy" in data
        assert "metals" in data
        assert "agriculture" in data
        assert "timestamp" in data
        
        # Verify commodity structure
        metals = data["metals"]
        assert len(metals) > 0
        assert "name" in metals[0]
        assert "price" in metals[0]
        
        print(f"✓ Commodities: energy={len(data['energy'])}, metals={len(data['metals'])}, agriculture={len(data['agriculture'])}")
    
    def test_macro_crypto(self):
        """Test /api/macro/crypto returns cryptocurrency prices"""
        response = requests.get(f"{BASE_URL}/api/macro/crypto")
        assert response.status_code == 200
        
        data = response.json()
        assert "cryptocurrencies" in data
        assert "total_market_cap" in data
        assert "btc_dominance" in data
        assert "timestamp" in data
        
        cryptos = data["cryptocurrencies"]
        assert len(cryptos) > 0
        assert "symbol" in cryptos[0]
        assert "price" in cryptos[0]
        
        print(f"✓ Crypto: {len(cryptos)} cryptocurrencies, total_market_cap={data['total_market_cap']}")
    
    def test_macro_futures(self):
        """Test /api/macro/futures returns futures data"""
        response = requests.get(f"{BASE_URL}/api/macro/futures")
        assert response.status_code == 200
        
        data = response.json()
        assert "equity_index" in data
        assert "currency" in data
        assert "interest_rate" in data
        assert "timestamp" in data
        
        equity_futures = data["equity_index"]
        assert len(equity_futures) > 0
        assert "symbol" in equity_futures[0]
        assert "price" in equity_futures[0]
        
        print(f"✓ Futures: equity_index={len(data['equity_index'])}, currency={len(data['currency'])}, interest_rate={len(data['interest_rate'])}")


class TestActionLayerAPIs:
    """Test Action Layer endpoints - Next Best Actions, batch execution, tax harvesting"""
    
    def test_next_best_actions(self):
        """Test /api/actions/next-best-actions returns prioritized actions"""
        response = requests.get(f"{BASE_URL}/api/actions/next-best-actions")
        assert response.status_code == 200
        
        data = response.json()
        assert "advisor_id" in data
        assert "actions" in data
        assert "summary" in data
        assert "timestamp" in data
        
        actions = data["actions"]
        assert len(actions) > 0
        
        # Verify action structure
        action = actions[0]
        assert "action_id" in action
        assert "type" in action
        assert "priority" in action
        assert "title" in action
        assert "description" in action
        assert "impact" in action
        assert "one_click" in action
        
        # Verify summary
        summary = data["summary"]
        assert "total_actions" in summary
        assert "high_priority" in summary
        
        print(f"✓ Next Best Actions: {len(actions)} actions, {summary['high_priority']} high priority")
    
    def test_batch_rebalance_execute(self):
        """Test /api/actions/execute/batch-rebalance executes batch trades"""
        response = requests.post(f"{BASE_URL}/api/actions/execute/batch-rebalance")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "execution_id" in data
        assert data["status"] == "completed"
        assert "summary" in data
        assert "portfolios" in data
        assert data["demo_mode"] == True
        
        summary = data["summary"]
        assert "portfolios_rebalanced" in summary
        assert "total_trades_executed" in summary
        
        print(f"✓ Batch Rebalance: {summary['portfolios_rebalanced']} portfolios, {summary['total_trades_executed']} trades")
    
    def test_tax_harvest_execute(self):
        """Test /api/actions/execute/tax-harvest executes tax harvesting"""
        payload = {
            "client_id": "test_client_001",
            "max_losses_to_harvest": 50000,
            "wash_sale_aware": True,
            "execute_immediately": True
        }
        response = requests.post(f"{BASE_URL}/api/actions/execute/tax-harvest", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "execution_id" in data
        assert data["status"] == "completed"
        assert "harvested_positions" in data
        assert "replacement_positions" in data
        assert "summary" in data
        assert data["demo_mode"] == True
        
        summary = data["summary"]
        assert "total_losses_harvested" in summary
        assert "estimated_tax_savings" in summary
        
        print(f"✓ Tax Harvest: ${summary['total_losses_harvested']} harvested, ${summary['estimated_tax_savings']} tax savings")
    
    def test_batch_rebalance_preview(self):
        """Test /api/actions/preview/batch-rebalance shows preview"""
        response = requests.get(f"{BASE_URL}/api/actions/preview/batch-rebalance")
        assert response.status_code == 200
        
        data = response.json()
        assert data["preview"] == True
        assert "drift_threshold" in data
        assert "portfolios_affected" in data
        assert "total_trades" in data
        assert "portfolios" in data
        assert "execute_url" in data
        
        print(f"✓ Batch Rebalance Preview: {data['portfolios_affected']} portfolios, {data['total_trades']} trades")
    
    def test_tax_harvest_preview(self):
        """Test /api/actions/preview/tax-harvest shows preview"""
        response = requests.get(f"{BASE_URL}/api/actions/preview/tax-harvest")
        assert response.status_code == 200
        
        data = response.json()
        assert data["preview"] == True
        assert "opportunities" in data
        assert "summary" in data
        
        summary = data["summary"]
        assert "total_harvestable_loss" in summary
        assert "total_estimated_tax_savings" in summary
        
        print(f"✓ Tax Harvest Preview: ${summary['total_harvestable_loss']} harvestable, ${summary['total_estimated_tax_savings']} savings")
    
    def test_execution_log(self):
        """Test /api/actions/execution-log returns history"""
        response = requests.get(f"{BASE_URL}/api/actions/execution-log")
        assert response.status_code == 200
        
        data = response.json()
        assert "executions" in data
        assert "total" in data
        assert "timestamp" in data
        
        print(f"✓ Execution Log: {data['total']} executions")
    
    def test_action_queue(self):
        """Test /api/actions/queue returns queue status"""
        response = requests.get(f"{BASE_URL}/api/actions/queue")
        assert response.status_code == 200
        
        data = response.json()
        assert "queue" in data
        assert "total" in data
        assert "by_priority" in data
        
        print(f"✓ Action Queue: {data['total']} items")


class TestBrokerResearchAPIs:
    """Test Broker Research endpoints - Analyst ratings, price targets, upgrades/downgrades"""
    
    def test_top_rated_stocks(self):
        """Test /api/broker-research/top-rated returns top rated stocks"""
        response = requests.get(f"{BASE_URL}/api/broker-research/top-rated")
        assert response.status_code == 200
        
        data = response.json()
        assert "stocks" in data
        assert "total" in data
        assert "timestamp" in data
        
        stocks = data["stocks"]
        assert len(stocks) > 0
        
        # Verify stock structure
        stock = stocks[0]
        assert "symbol" in stock
        assert "company" in stock
        assert "consensus_rating" in stock
        assert "current_price" in stock
        assert "price_target" in stock
        
        print(f"✓ Top Rated: {len(stocks)} stocks")
    
    def test_stock_detail(self):
        """Test /api/broker-research/stock/NVDA returns stock detail"""
        response = requests.get(f"{BASE_URL}/api/broker-research/stock/NVDA")
        assert response.status_code == 200
        
        data = response.json()
        assert data["symbol"] == "NVDA"
        assert "company" in data
        assert "sector" in data
        assert "current_price" in data
        assert "consensus_rating" in data
        assert "price_target" in data
        assert "ratings_breakdown" in data
        assert "recent_reports" in data
        
        # Verify price target structure
        price_target = data["price_target"]
        assert "mean" in price_target
        assert "high" in price_target
        assert "low" in price_target
        
        print(f"✓ NVDA Detail: rating={data['consensus_rating']}, target=${price_target['mean']}")
    
    def test_stock_detail_not_found(self):
        """Test /api/broker-research/stock/INVALID returns 404"""
        response = requests.get(f"{BASE_URL}/api/broker-research/stock/INVALIDXYZ")
        assert response.status_code == 404
        
        print(f"✓ Invalid stock returns 404 as expected")
    
    def test_upgrades_downgrades(self):
        """Test /api/broker-research/upgrades-downgrades returns changes"""
        response = requests.get(f"{BASE_URL}/api/broker-research/upgrades-downgrades")
        assert response.status_code == 200
        
        data = response.json()
        assert "changes" in data
        assert "summary" in data
        assert "timestamp" in data
        
        changes = data["changes"]
        assert len(changes) > 0
        
        # Verify change structure
        change = changes[0]
        assert "symbol" in change
        assert "broker" in change
        assert "change" in change
        assert "old_rating" in change
        assert "new_rating" in change
        
        summary = data["summary"]
        assert "upgrades" in summary
        assert "downgrades" in summary
        
        print(f"✓ Rating Changes: {summary['upgrades']} upgrades, {summary['downgrades']} downgrades")
    
    def test_sector_ratings(self):
        """Test /api/broker-research/sectors returns sector ratings"""
        response = requests.get(f"{BASE_URL}/api/broker-research/sectors")
        assert response.status_code == 200
        
        data = response.json()
        assert "sectors" in data
        assert "timestamp" in data
        
        sectors = data["sectors"]
        assert len(sectors) > 0
        
        # Verify sector structure
        sector = sectors[0]
        assert "sector" in sector
        assert "average_rating" in sector
        assert "rating_label" in sector
        assert "stocks_covered" in sector
        assert "top_picks" in sector
        
        print(f"✓ Sector Ratings: {len(sectors)} sectors")
    
    def test_filter_by_sector(self):
        """Test /api/broker-research/top-rated with sector filter"""
        response = requests.get(f"{BASE_URL}/api/broker-research/top-rated?sector=Technology")
        assert response.status_code == 200
        
        data = response.json()
        assert "top_rated" in data
        
        # All returned stocks should be in Technology sector
        for stock in data["top_rated"]:
            assert stock["sector"] == "Technology"
        
        print(f"✓ Sector Filter: {len(data['top_rated'])} Technology stocks")


class TestAdditionalMacroEndpoints:
    """Test additional macro data endpoints"""
    
    def test_economic_calendar(self):
        """Test /api/macro/economic-calendar returns events"""
        response = requests.get(f"{BASE_URL}/api/macro/economic-calendar")
        assert response.status_code == 200
        
        data = response.json()
        assert "events" in data
        assert "timestamp" in data
        
        events = data["events"]
        assert len(events) > 0
        
        event = events[0]
        assert "date" in event
        assert "event" in event
        assert "country" in event
        
        print(f"✓ Economic Calendar: {len(events)} events")
    
    def test_sector_performance(self):
        """Test /api/macro/sector-performance returns sector data"""
        response = requests.get(f"{BASE_URL}/api/macro/sector-performance")
        assert response.status_code == 200
        
        data = response.json()
        assert "sectors" in data
        assert "timestamp" in data
        
        sectors = data["sectors"]
        assert len(sectors) > 0
        
        sector = sectors[0]
        assert "sector" in sector
        assert "change_1d" in sector
        assert "change_ytd" in sector
        
        print(f"✓ Sector Performance: {len(sectors)} sectors")
    
    def test_top_stocks(self):
        """Test /api/macro/stocks returns top stocks by region"""
        response = requests.get(f"{BASE_URL}/api/macro/stocks")
        assert response.status_code == 200
        
        data = response.json()
        assert "us" in data
        assert "australia" in data
        assert "europe" in data
        
        print(f"✓ Top Stocks: US={len(data['us'])}, Australia={len(data['australia'])}, Europe={len(data['europe'])}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
