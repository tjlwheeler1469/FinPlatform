"""
Iteration 91 - Testing ASX Stock Prices and Client Navigation
1. GET /api/live/stock/CBA - should return live ASX stock data with .AX suffix
2. GET /api/live/stock/BHP - should return live ASX stock data with .AX suffix
3. Verify data_source field indicates 'live' or 'mock' appropriately
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestASXStockPrices:
    """Test ASX stock price endpoints with .AX suffix handling"""
    
    def test_cba_stock_returns_data(self):
        """GET /api/live/stock/CBA should return stock data"""
        response = requests.get(f"{BASE_URL}/api/live/stock/CBA")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify required fields
        assert "symbol" in data, "Response should contain 'symbol'"
        assert data["symbol"] == "CBA", f"Expected symbol 'CBA', got {data['symbol']}"
        assert "name" in data, "Response should contain 'name'"
        assert "price" in data, "Response should contain 'price'"
        assert "change" in data, "Response should contain 'change'"
        assert "change_percent" in data, "Response should contain 'change_percent'"
        assert "data_source" in data, "Response should contain 'data_source'"
        assert "last_updated" in data, "Response should contain 'last_updated'"
        
        # Verify price is a valid number
        assert isinstance(data["price"], (int, float)), "Price should be numeric"
        assert data["price"] > 0, "Price should be positive"
        
        # Verify data_source is either 'live' or 'mock'
        assert data["data_source"] in ["live", "mock"], f"data_source should be 'live' or 'mock', got {data['data_source']}"
        
        print(f"CBA Stock Data: price=${data['price']}, change={data['change_percent']}%, source={data['data_source']}")
    
    def test_bhp_stock_returns_data(self):
        """GET /api/live/stock/BHP should return stock data"""
        response = requests.get(f"{BASE_URL}/api/live/stock/BHP")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify required fields
        assert "symbol" in data, "Response should contain 'symbol'"
        assert data["symbol"] == "BHP", f"Expected symbol 'BHP', got {data['symbol']}"
        assert "name" in data, "Response should contain 'name'"
        assert "price" in data, "Response should contain 'price'"
        assert "change" in data, "Response should contain 'change'"
        assert "change_percent" in data, "Response should contain 'change_percent'"
        assert "data_source" in data, "Response should contain 'data_source'"
        
        # Verify price is a valid number
        assert isinstance(data["price"], (int, float)), "Price should be numeric"
        assert data["price"] > 0, "Price should be positive"
        
        # Verify data_source is either 'live' or 'mock'
        assert data["data_source"] in ["live", "mock"], f"data_source should be 'live' or 'mock', got {data['data_source']}"
        
        print(f"BHP Stock Data: price=${data['price']}, change={data['change_percent']}%, source={data['data_source']}")
    
    def test_cba_stock_has_asx_specific_fields(self):
        """CBA should have ASX-specific fields like sector"""
        response = requests.get(f"{BASE_URL}/api/live/stock/CBA")
        assert response.status_code == 200
        
        data = response.json()
        # CBA is a Financials sector stock
        assert "sector" in data, "Response should contain 'sector'"
        assert data["sector"] == "Financials", f"CBA sector should be 'Financials', got {data['sector']}"
        
        # Should have name
        assert "Commonwealth Bank" in data.get("name", ""), f"CBA name should contain 'Commonwealth Bank', got {data.get('name')}"
        
        print(f"CBA Sector: {data['sector']}, Name: {data['name']}")
    
    def test_bhp_stock_has_asx_specific_fields(self):
        """BHP should have ASX-specific fields like sector"""
        response = requests.get(f"{BASE_URL}/api/live/stock/BHP")
        assert response.status_code == 200
        
        data = response.json()
        # BHP is a Materials sector stock
        assert "sector" in data, "Response should contain 'sector'"
        assert data["sector"] == "Materials", f"BHP sector should be 'Materials', got {data['sector']}"
        
        # Should have name
        assert "BHP" in data.get("name", ""), f"BHP name should contain 'BHP', got {data.get('name')}"
        
        print(f"BHP Sector: {data['sector']}, Name: {data['name']}")
    
    def test_invalid_stock_returns_404(self):
        """Invalid stock symbol should return 404"""
        response = requests.get(f"{BASE_URL}/api/live/stock/INVALID123")
        assert response.status_code == 404, f"Expected 404 for invalid symbol, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Error response should contain 'detail'"
        print(f"Invalid stock error: {data['detail']}")
    
    def test_stock_batch_endpoint(self):
        """GET /api/live/stocks/batch should return multiple stocks"""
        response = requests.get(f"{BASE_URL}/api/live/stocks/batch?symbols=CBA,BHP")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "stocks" in data, "Response should contain 'stocks'"
        assert "count" in data, "Response should contain 'count'"
        assert data["count"] >= 2, f"Expected at least 2 stocks, got {data['count']}"
        
        # Verify both CBA and BHP are in the response
        symbols = [s["symbol"] for s in data["stocks"]]
        assert "CBA" in symbols, "CBA should be in batch response"
        assert "BHP" in symbols, "BHP should be in batch response"
        
        print(f"Batch stocks returned: {symbols}")


class TestCRMClientNavigation:
    """Test CRM client navigation endpoints"""
    
    def test_crm_clients_endpoint(self):
        """GET /api/crm/clients should return client list"""
        response = requests.get(f"{BASE_URL}/api/crm/clients")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "clients" in data, "Response should contain 'clients'"
        assert isinstance(data["clients"], list), "clients should be a list"
        
        if len(data["clients"]) > 0:
            client = data["clients"][0]
            assert "client_id" in client, "Client should have 'client_id'"
            assert "name" in client, "Client should have 'name'"
            print(f"First client: {client['name']} (ID: {client['client_id']})")
        
        print(f"Total clients: {len(data['clients'])}")
    
    def test_crm_analytics_endpoint(self):
        """GET /api/crm/analytics should return analytics data"""
        response = requests.get(f"{BASE_URL}/api/crm/analytics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should have some analytics data
        assert isinstance(data, dict), "Analytics should return a dict"
        print(f"Analytics data keys: {list(data.keys())}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
