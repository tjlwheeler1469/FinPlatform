"""
Test Iteration 84 - Live Price Feeds for Crypto and Hybrids
Tests CoinGecko API integration for crypto and ASX/yfinance for hybrid securities.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCryptoPrices:
    """Test live cryptocurrency price endpoints via CoinGecko"""
    
    def test_crypto_prices_endpoint(self):
        """GET /api/crypto/prices returns prices (old format from crypto_integration.py)
        NOTE: The /api/crypto/prices route is handled by crypto_integration.py, not crypto_prices.py
        due to route registration order conflict. The new CoinGecko endpoints work via /portfolio/value."""
        response = requests.get(f"{BASE_URL}/api/crypto/prices")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Validate response structure (from crypto_integration.py)
        assert "prices" in data, "Response missing 'prices' key"
        assert "timestamp" in data, "Response missing 'timestamp' key"
        
        # Note: This uses the OLD static prices from crypto_integration.py
        # The NEW live prices are accessed via /api/crypto/portfolio/value
        print(f"Crypto prices endpoint returned {len(data['prices'])} prices (static from crypto_integration.py)")
    
    def test_crypto_prices_via_portfolio(self):
        """Test live crypto prices via portfolio/value endpoint (CoinGecko integration)"""
        response = requests.get(f"{BASE_URL}/api/crypto/portfolio/value", params={
            "holdings": "BTC:1,ETH:1",
            "currency": "aud"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "portfolio" in data
        assert "source" in data
        assert data["source"] == "CoinGecko", f"Expected CoinGecko source, got {data.get('source')}"
        
        symbols = [p["symbol"] for p in data["portfolio"]]
        print(f"Live CoinGecko prices via portfolio: {symbols}")
    
    def test_crypto_global_endpoint(self):
        """GET /api/crypto/global should return global crypto market data"""
        response = requests.get(f"{BASE_URL}/api/crypto/global")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Validate response structure
        assert "source" in data, "Response missing 'source' key"
        assert "timestamp" in data, "Response missing 'timestamp' key"
        
        # Check for global metrics (may be 0 if rate limited)
        expected_fields = ["total_market_cap_aud", "btc_dominance", "active_cryptocurrencies"]
        for field in expected_fields:
            assert field in data, f"Response missing '{field}' key"
        
        print(f"Global data: BTC dominance={data.get('btc_dominance', 0):.2f}%, Active cryptos={data.get('active_cryptocurrencies', 0)}")
    
    def test_crypto_portfolio_value_endpoint(self):
        """GET /api/crypto/portfolio/value should calculate portfolio with live prices"""
        response = requests.get(f"{BASE_URL}/api/crypto/portfolio/value", params={
            "holdings": "BTC:0.85,ETH:8.5,SOL:45",
            "currency": "aud"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Validate response structure
        assert "portfolio" in data, "Response missing 'portfolio' key"
        assert "total_value" in data, "Response missing 'total_value' key"
        assert "currency" in data, "Response missing 'currency' key"
        assert "source" in data, "Response missing 'source' key"
        
        # Validate portfolio array
        assert isinstance(data["portfolio"], list), "portfolio should be a list"
        assert len(data["portfolio"]) == 3, f"Expected 3 holdings, got {len(data['portfolio'])}"
        
        # Validate individual holdings
        for holding in data["portfolio"]:
            assert "symbol" in holding, "Holding missing 'symbol'"
            assert "amount" in holding, "Holding missing 'amount'"
            assert "price" in holding, "Holding missing 'price'"
            assert "value" in holding, "Holding missing 'value'"
            assert "allocation" in holding, "Holding missing 'allocation'"
        
        print(f"Portfolio value: ${data['total_value']:,.2f} AUD, holdings: {len(data['portfolio'])}")
    
    def test_crypto_portfolio_invalid_holdings(self):
        """Test portfolio endpoint with invalid holdings format"""
        response = requests.get(f"{BASE_URL}/api/crypto/portfolio/value", params={
            "holdings": "invalid"
        })
        assert response.status_code == 400, f"Expected 400 for invalid holdings, got {response.status_code}"
    
    def test_crypto_market_endpoint(self):
        """GET /api/crypto/market should return detailed market data"""
        response = requests.get(f"{BASE_URL}/api/crypto/market", params={
            "symbols": "BTC,ETH",
            "currency": "aud"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "coins" in data, "Response missing 'coins' key"
        print(f"Market data returned {len(data.get('coins', []))} coins")


class TestHybridPrices:
    """Test hybrid securities price endpoints via ASX/yfinance"""
    
    def test_hybrid_prices_endpoint(self):
        """GET /api/hybrids/prices should return hybrid security prices"""
        response = requests.get(f"{BASE_URL}/api/hybrids/prices")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Validate response structure
        assert "hybrids" in data, "Response missing 'hybrids' key"
        assert "bbsw_3m" in data, "Response missing 'bbsw_3m' key"
        assert "source" in data, "Response missing 'source' key"
        assert "timestamp" in data, "Response missing 'timestamp' key"
        
        # Validate hybrids array has data
        assert isinstance(data["hybrids"], list), "hybrids should be a list"
        assert len(data["hybrids"]) > 0, "Should return at least one hybrid"
        
        # Validate individual hybrid structure
        hybrid = data["hybrids"][0]
        assert "symbol" in hybrid, "Hybrid missing 'symbol'"
        assert "name" in hybrid, "Hybrid missing 'name'"
        assert "price" in hybrid, "Hybrid missing 'price'"
        assert "running_yield" in hybrid, "Hybrid missing 'running_yield'"
        
        print(f"Hybrid prices endpoint returned {len(data['hybrids'])} hybrids, BBSW 3M: {data['bbsw_3m']}%")
    
    def test_hybrid_prices_with_custom_symbols(self):
        """Test hybrid prices with specific symbols"""
        response = requests.get(f"{BASE_URL}/api/hybrids/prices", params={
            "symbols": "CBAPD,WBCPI"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["hybrids"]) == 2, f"Expected 2 hybrids, got {len(data['hybrids'])}"
        
        symbols = [h["symbol"] for h in data["hybrids"]]
        assert "CBAPD" in symbols, "CBAPD should be in results"
        assert "WBCPI" in symbols, "WBCPI should be in results"
        print(f"Custom symbols returned: {symbols}")
    
    def test_hybrid_all_endpoint(self):
        """GET /api/hybrids/all should return all tracked hybrid securities"""
        response = requests.get(f"{BASE_URL}/api/hybrids/all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "hybrids" in data, "Response missing 'hybrids' key"
        
        # Should have 10 tracked hybrids based on code
        assert len(data["hybrids"]) == 10, f"Expected 10 hybrids, got {len(data['hybrids'])}"
        
        symbols = [h["symbol"] for h in data["hybrids"]]
        expected = ["CBAPD", "CBAPE", "WBCPI", "WBCPJ", "ANZPJ", "ANZPK", "NABPH", "NABPI", "MQGPD", "MQGPE"]
        for sym in expected:
            assert sym in symbols, f"{sym} should be in all hybrids"
        
        print(f"All hybrids: {len(data['hybrids'])} securities tracked")
    
    def test_hybrid_portfolio_value_endpoint(self):
        """GET /api/hybrids/portfolio/value should calculate hybrid portfolio value"""
        response = requests.get(f"{BASE_URL}/api/hybrids/portfolio/value", params={
            "holdings": "CBAPD:300,WBCPI:200,ANZPJ:250"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Validate response structure
        assert "portfolio" in data, "Response missing 'portfolio' key"
        assert "total_face_value" in data, "Response missing 'total_face_value' key"
        assert "total_market_value" in data, "Response missing 'total_market_value' key"
        assert "total_annual_income" in data, "Response missing 'total_annual_income' key"
        assert "weighted_average_yield" in data, "Response missing 'weighted_average_yield' key"
        
        # Validate portfolio array
        assert isinstance(data["portfolio"], list), "portfolio should be a list"
        assert len(data["portfolio"]) == 3, f"Expected 3 holdings, got {len(data['portfolio'])}"
        
        # Validate individual holdings
        for holding in data["portfolio"]:
            assert "symbol" in holding, "Holding missing 'symbol'"
            assert "units" in holding, "Holding missing 'units'"
            assert "price" in holding, "Holding missing 'price'"
            assert "market_value" in holding, "Holding missing 'market_value'"
            assert "running_yield" in holding, "Holding missing 'running_yield'"
            assert "quarterly_distribution" in holding, "Holding missing 'quarterly_distribution'"
        
        print(f"Hybrid portfolio: Face ${data['total_face_value']:,.0f}, Market ${data['total_market_value']:,.0f}, Yield {data['weighted_average_yield']:.2f}%")
    
    def test_hybrid_portfolio_invalid_holdings(self):
        """Test portfolio endpoint with invalid holdings format"""
        response = requests.get(f"{BASE_URL}/api/hybrids/portfolio/value", params={
            "holdings": "invalid"
        })
        assert response.status_code == 400, f"Expected 400 for invalid holdings, got {response.status_code}"
    
    def test_hybrid_info_endpoint(self):
        """GET /api/hybrids/info/{symbol} should return detailed hybrid info"""
        response = requests.get(f"{BASE_URL}/api/hybrids/info/CBAPD")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "symbol" in data, "Response missing 'symbol'"
        assert "name" in data, "Response missing 'name'"
        assert "issuer" in data, "Response missing 'issuer'"
        assert "call_date" in data, "Response missing 'call_date'"
        assert "franking" in data, "Response missing 'franking'"
        
        print(f"CBAPD info: {data['name']}, Call: {data['call_date']}, Franking: {data['franking']}%")
    
    def test_hybrid_info_not_found(self):
        """Test info endpoint with unknown symbol"""
        response = requests.get(f"{BASE_URL}/api/hybrids/info/UNKNOWN")
        assert response.status_code == 404, f"Expected 404 for unknown symbol, got {response.status_code}"
    
    def test_hybrid_market_summary_endpoint(self):
        """GET /api/hybrids/market/summary should return market summary"""
        response = requests.get(f"{BASE_URL}/api/hybrids/market/summary")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total_securities" in data, "Response missing 'total_securities'"
        assert "average_price" in data, "Response missing 'average_price'"
        assert "average_yield" in data, "Response missing 'average_yield'"
        assert "by_issuer" in data, "Response missing 'by_issuer'"
        
        print(f"Market summary: {data['total_securities']} securities, Avg yield: {data['average_yield']:.2f}%")


class TestHealthCheck:
    """Verify health endpoint still works"""
    
    def test_health_endpoint(self):
        """GET /api/health should return healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        print(f"Health check passed, version: {data.get('version', 'unknown')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
