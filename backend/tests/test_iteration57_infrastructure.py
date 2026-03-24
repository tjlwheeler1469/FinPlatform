"""
Test Suite for Iteration 57 - Infrastructure Expansion
Tests for:
1. Real-time stock prices via yfinance
2. Email service via SendGrid (demo mode)
3. Basiq CDR integration for bank feeds (demo mode)
4. Broker API infrastructure
"""
import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://cost-governance.preview.emergentagent.com"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")


class TestMarketDataEndpoints:
    """Tests for real-time market data via yfinance"""
    
    def test_get_single_quote(self):
        """GET /api/market/quote/{symbol} - Real-time stock quote"""
        response = requests.get(f"{BASE_URL}/api/market/quote/CBA.AX")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "symbol" in data
        assert data["symbol"] == "CBA.AX"
        assert "price" in data or "current_price" in data
        assert "change" in data
        assert "change_percent" in data
        print(f"✓ Single quote test passed: CBA.AX price = ${data.get('price', data.get('current_price'))}")
    
    def test_get_multiple_quotes(self):
        """POST /api/market/quotes - Multiple stock quotes"""
        symbols = ["CBA.AX", "BHP.AX", "CSL.AX"]
        response = requests.post(
            f"{BASE_URL}/api/market/quotes",
            json=symbols
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "quotes" in data
        assert "count" in data
        assert data["count"] == 3
        assert "symbols_requested" in data
        
        # Verify each symbol has data
        for symbol in symbols:
            assert symbol in data["quotes"]
            quote = data["quotes"][symbol]
            assert "symbol" in quote
        print(f"✓ Multiple quotes test passed: {data['count']} quotes returned")
    
    def test_get_market_indices(self):
        """GET /api/market/indices - Major market indices"""
        response = requests.get(f"{BASE_URL}/api/market/indices")
        assert response.status_code == 200
        data = response.json()
        
        assert "indices" in data
        assert len(data["indices"]) > 0
        
        # Check for expected indices
        index_symbols = [idx["symbol"] for idx in data["indices"]]
        assert "^AXJO" in index_symbols or any("ASX" in str(idx) for idx in data["indices"])
        print(f"✓ Market indices test passed: {len(data['indices'])} indices returned")
    
    def test_get_historical_prices(self):
        """GET /api/market/history/{symbol} - Historical price data"""
        response = requests.get(f"{BASE_URL}/api/market/history/CBA.AX?period=1mo")
        assert response.status_code == 200
        data = response.json()
        
        assert "symbol" in data
        assert data["symbol"] == "CBA.AX"
        assert "period" in data
        # Data may be empty if market is closed or no recent data
        print(f"✓ Historical prices test passed: {data.get('data_points', 0)} data points")
    
    def test_stock_search(self):
        """GET /api/market/search - Stock search"""
        response = requests.get(f"{BASE_URL}/api/market/search?query=CBA")
        assert response.status_code == 200
        data = response.json()
        
        assert "query" in data
        assert "results" in data
        assert len(data["results"]) > 0
        
        # Verify CBA is in results
        symbols = [r["symbol"] for r in data["results"]]
        assert "CBA.AX" in symbols
        print(f"✓ Stock search test passed: {len(data['results'])} results for 'CBA'")
    
    def test_asx_top_stocks(self):
        """GET /api/market/asx/top - Top ASX stocks"""
        response = requests.get(f"{BASE_URL}/api/market/asx/top")
        assert response.status_code == 200
        data = response.json()
        
        assert "stocks" in data
        assert "count" in data
        assert data["count"] == 10
        assert data["market"] == "ASX"
        
        # Verify live data flag
        for stock in data["stocks"]:
            assert "is_live" in stock
            assert stock["is_live"] == True
        print(f"✓ ASX top stocks test passed: {data['count']} stocks with LIVE prices")


class TestEmailServiceEndpoints:
    """Tests for email service via SendGrid (demo mode)"""
    
    def test_email_service_status(self):
        """GET /api/email/status - Email service status"""
        response = requests.get(f"{BASE_URL}/api/email/status")
        assert response.status_code == 200
        data = response.json()
        
        assert "configured" in data
        assert "demo_mode" in data
        assert "sender_email" in data
        assert "templates_available" in data
        
        # Should be in demo mode without API key
        assert data["demo_mode"] == True
        assert "trade_confirmation" in data["templates_available"]
        print(f"✓ Email status test passed: demo_mode={data['demo_mode']}, templates={data['templates_available']}")
    
    def test_send_trade_confirmation(self):
        """POST /api/email/trade-confirmation - Send trade confirmation"""
        payload = {
            "to_email": "test@example.com",
            "order_id": "ORD-TEST-12345",
            "action": "BUY",
            "symbol": "CBA.AX",
            "security_name": "Commonwealth Bank of Australia",
            "units": 100,
            "price": 118.50,
            "gross_amount": 11850.00,
            "brokerage": 9.50,
            "net_amount": 11859.50,
            "is_demo": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/email/trade-confirmation",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["demo_mode"] == True
        assert "Trade Confirmation" in data["subject"]
        assert "would_send" in data
        print(f"✓ Trade confirmation email test passed: {data['subject']}")
    
    def test_send_test_email(self):
        """POST /api/email/test - Send test email"""
        response = requests.post(
            f"{BASE_URL}/api/email/test?to_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["demo_mode"] == True
        assert "Test Email" in data["subject"]
        print(f"✓ Test email test passed: {data['subject']}")


class TestBankFeedsEndpoints:
    """Tests for Basiq CDR integration (demo mode)"""
    
    def test_bank_feeds_status(self):
        """GET /api/bank-feeds/status - Basiq integration status"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/status")
        assert response.status_code == 200
        data = response.json()
        
        assert "configured" in data
        assert "demo_mode" in data
        assert "features" in data
        assert "cdr_compliant" in data
        
        # Should be in demo mode without API key
        assert data["demo_mode"] == True
        assert data["cdr_compliant"] == True
        print(f"✓ Bank feeds status test passed: demo_mode={data['demo_mode']}, banks={data.get('supported_banks', 'N/A')}")
    
    def test_get_institutions(self):
        """GET /api/bank-feeds/institutions - List supported banks"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/institutions")
        assert response.status_code == 200
        data = response.json()
        
        assert "institutions" in data
        assert "total" in data
        assert data["total"] == 12  # 12 Australian banks
        
        # Verify major banks are present
        bank_names = [inst["name"] for inst in data["institutions"]]
        assert "Commonwealth Bank" in bank_names
        assert "Westpac" in bank_names
        assert "ANZ Bank" in bank_names
        assert "National Australia Bank" in bank_names
        print(f"✓ Institutions test passed: {data['total']} banks supported")
    
    def test_create_basiq_user(self):
        """POST /api/bank-feeds/user - Create Basiq user"""
        response = requests.post(
            f"{BASE_URL}/api/bank-feeds/user?email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["id"].startswith("USR-")
        assert data["email"] == "test@example.com"
        assert data["demo_mode"] == True
        print(f"✓ Create user test passed: user_id={data['id']}")
    
    def test_create_bank_connection(self):
        """POST /api/bank-feeds/connect - Create bank connection"""
        response = requests.post(
            f"{BASE_URL}/api/bank-feeds/connect?user_id=test-user-123&institution_id=AU00001"
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["id"].startswith("CON-")
        assert data["status"] == "pending"
        assert "consent_url" in data
        assert data["demo_mode"] == True
        print(f"✓ Create connection test passed: connection_id={data['id']}")
    
    def test_get_linked_accounts(self):
        """GET /api/bank-feeds/accounts/{user_id} - Get linked accounts"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/accounts/test-user-123")
        assert response.status_code == 200
        data = response.json()
        
        assert "accounts" in data
        assert "total" in data
        assert data["total"] == 4  # Demo returns 4 accounts
        
        # Verify account types
        account_types = [acc["type"] for acc in data["accounts"]]
        assert "transaction" in account_types
        assert "savings" in account_types
        assert "credit-card" in account_types
        assert "loan" in account_types
        print(f"✓ Get accounts test passed: {data['total']} accounts")
    
    def test_get_transactions(self):
        """GET /api/bank-feeds/transactions/{user_id} - Get transactions"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/transactions/test-user-123")
        assert response.status_code == 200
        data = response.json()
        
        assert "transactions" in data
        assert "total" in data
        assert data["total"] == 10  # Demo returns 10 transactions
        
        # Verify transaction structure
        txn = data["transactions"][0]
        assert "id" in txn
        assert "date" in txn
        assert "description" in txn
        assert "amount" in txn
        assert "category" in txn
        print(f"✓ Get transactions test passed: {data['total']} transactions")
    
    def test_get_income_summary(self):
        """GET /api/bank-feeds/income/{user_id} - Income summary"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/income/test-user-123")
        assert response.status_code == 200
        data = response.json()
        
        assert "income_streams" in data
        assert "total_income" in data
        assert "monthly_average" in data
        
        # Verify income data
        assert data["total_income"] > 0
        assert data["monthly_average"] > 0
        print(f"✓ Income summary test passed: total=${data['total_income']}, monthly_avg=${data['monthly_average']}")
    
    def test_get_expense_summary(self):
        """GET /api/bank-feeds/expenses/{user_id} - Expense summary"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/expenses/test-user-123")
        assert response.status_code == 200
        data = response.json()
        
        assert "categories" in data
        assert "total_expenses" in data
        assert "monthly_average" in data
        
        # Verify expense categories
        categories = [cat["category"] for cat in data["categories"]]
        assert "Housing" in categories
        assert "Groceries" in categories
        print(f"✓ Expense summary test passed: total=${data['total_expenses']}, categories={len(data['categories'])}")
    
    def test_get_affordability(self):
        """GET /api/bank-feeds/affordability/{user_id} - Affordability metrics"""
        response = requests.get(f"{BASE_URL}/api/bank-feeds/affordability/test-user-123")
        assert response.status_code == 200
        data = response.json()
        
        assert "monthly_income" in data
        assert "monthly_expenses" in data
        assert "monthly_surplus" in data
        assert "affordability_score" in data
        
        # Verify calculations
        assert data["monthly_surplus"] == data["monthly_income"] - data["monthly_expenses"]
        assert data["affordability_score"] > 0
        print(f"✓ Affordability test passed: score={data['affordability_score']}, surplus=${data['monthly_surplus']}")


class TestTradingSystemIntegration:
    """Tests to verify trading system still works with new features"""
    
    def test_trading_holdings(self):
        """GET /api/trading/holdings/{client_id} - Verify trading still works"""
        response = requests.get(f"{BASE_URL}/api/trading/holdings/client_1")
        assert response.status_code == 200
        data = response.json()
        
        assert "holdings" in data
        assert len(data["holdings"]) > 0
        print(f"✓ Trading holdings test passed: {len(data['holdings'])} holdings")
    
    def test_trading_brokers(self):
        """GET /api/trading/brokers - Verify broker list"""
        response = requests.get(f"{BASE_URL}/api/trading/brokers")
        assert response.status_code == 200
        data = response.json()
        
        assert "brokers" in data
        assert len(data["brokers"]) >= 4
        print(f"✓ Trading brokers test passed: {len(data['brokers'])} brokers available")
    
    def test_order_preview(self):
        """POST /api/trading/order/preview - Order preview"""
        payload = {
            "client_id": "client_1",
            "symbol": "CBA.AX",
            "side": "buy",
            "units": 50
        }
        response = requests.post(
            f"{BASE_URL}/api/trading/order/preview",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify order preview response
        assert "symbol" in data or "order_preview" in data or "preview" in data
        print(f"✓ Order preview test passed")


class TestLiveStockPriceIntegration:
    """Tests to verify live stock prices are working"""
    
    def test_live_price_flag(self):
        """Verify is_live flag is True for real-time data"""
        response = requests.get(f"{BASE_URL}/api/market/asx/top")
        assert response.status_code == 200
        data = response.json()
        
        live_count = sum(1 for stock in data["stocks"] if stock.get("is_live", False))
        assert live_count == len(data["stocks"]), "All stocks should have is_live=True"
        print(f"✓ Live price flag test passed: {live_count}/{len(data['stocks'])} stocks are LIVE")
    
    def test_price_data_freshness(self):
        """Verify price data has recent timestamp"""
        response = requests.get(f"{BASE_URL}/api/market/quote/CBA.AX")
        assert response.status_code == 200
        data = response.json()
        
        if "timestamp" in data:
            timestamp = datetime.fromisoformat(data["timestamp"].replace("Z", "+00:00"))
            now = datetime.now(timestamp.tzinfo)
            age_seconds = (now - timestamp).total_seconds()
            # Data should be less than 10 minutes old (600 seconds)
            assert age_seconds < 600, f"Price data is {age_seconds}s old"
            print(f"✓ Price freshness test passed: data is {age_seconds:.0f}s old")
        else:
            print("✓ Price freshness test skipped: no timestamp in response")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
