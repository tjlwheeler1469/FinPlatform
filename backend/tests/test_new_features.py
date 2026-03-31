"""
Backend API tests for new features:
- Stock price refresh (/api/stocks/get-prices)
- Lifecycle Planning (/api/lifecycle/retirement-plan, /api/lifecycle/estate-plan, /api/lifecycle/goal-planning)
- AI Financial Advisor chatbot (/api/chat/financial-advisor)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"SUCCESS: Health check passed - {data}")


class TestStockPrices:
    """Tests for /api/stocks/get-prices endpoint - MOCK DATA"""
    
    def test_get_stock_prices_valid_symbols(self):
        """Test getting prices for valid ASX symbols"""
        response = requests.post(f"{BASE_URL}/api/stocks/get-prices", json={
            "symbols": ["CBA", "BHP", "CSL"]
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "prices" in data
        assert "timestamp" in data
        assert "is_mock_data" in data
        
        # Verify we got prices for all symbols
        assert len(data["prices"]) == 3
        
        # Verify price data structure
        for price in data["prices"]:
            assert "symbol" in price
            assert "price" in price or "error" in price
            if "price" in price:
                assert price["price"] > 0
                assert "name" in price
                assert "sector" in price
                print(f"SUCCESS: {price['symbol']} - ${price['price']} ({price['name']})")
        
        # Verify mock data flag
        assert data["is_mock_data"] is True  # No Alpha Vantage key configured
        print(f"SUCCESS: Stock prices returned (mock data: {data['is_mock_data']})")
    
    def test_get_stock_prices_unknown_symbol(self):
        """Test getting prices for unknown symbol"""
        response = requests.post(f"{BASE_URL}/api/stocks/get-prices", json={
            "symbols": ["UNKNOWN123"]
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should return error for unknown symbol
        assert len(data["prices"]) == 1
        assert "error" in data["prices"][0]
        print(f"SUCCESS: Unknown symbol handled correctly - {data['prices'][0]}")
    
    def test_get_stock_prices_mixed_symbols(self):
        """Test getting prices for mix of valid and invalid symbols"""
        response = requests.post(f"{BASE_URL}/api/stocks/get-prices", json={
            "symbols": ["CBA", "INVALID", "WBC"]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["prices"]) == 3
        
        # CBA and WBC should have prices
        cba = next((p for p in data["prices"] if p["symbol"] == "CBA"), None)
        wbc = next((p for p in data["prices"] if p["symbol"] == "WBC"), None)
        invalid = next((p for p in data["prices"] if p["symbol"] == "INVALID"), None)
        
        assert cba is not None and "price" in cba
        assert wbc is not None and "price" in wbc
        assert invalid is not None and "error" in invalid
        print("SUCCESS: Mixed symbols handled correctly")


class TestRetirementPlanning:
    """Tests for /api/lifecycle/retirement-plan endpoint"""
    
    def test_retirement_plan_basic(self):
        """Test basic retirement plan calculation"""
        response = requests.post(f"{BASE_URL}/api/lifecycle/retirement-plan", json={
            "current_age": 45,
            "retirement_age": 67,
            "life_expectancy": 90,
            "current_super": 320000,
            "current_savings": 75000,
            "annual_income": 120000,
            "annual_expenses": 80000,
            "desired_retirement_income": 70000,
            "super_contribution_rate": 11.5,
            "salary_sacrifice": 5000,
            "investment_return": 7.0,
            "inflation_rate": 2.5
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "summary" in data
        assert "projections" in data
        assert "recommendations" in data
        assert "assumptions" in data
        
        # Verify summary fields
        summary = data["summary"]
        assert "current_age" in summary
        assert "retirement_age" in summary
        assert "years_to_retirement" in summary
        assert "total_at_retirement" in summary
        assert "sustainable_annual_income" in summary
        assert "income_gap" in summary
        assert "money_lasts_until_age" in summary
        
        # Verify calculations make sense
        assert summary["years_to_retirement"] == 22  # 67 - 45
        assert summary["total_at_retirement"] > 0
        assert summary["sustainable_annual_income"] > 0
        
        # Verify projections
        assert len(data["projections"]) > 0
        first_proj = data["projections"][0]
        assert "age" in first_proj
        assert "balance" in first_proj
        assert "phase" in first_proj
        
        print(f"SUCCESS: Retirement plan calculated")
        print(f"  - Total at retirement: ${summary['total_at_retirement']:,.0f}")
        print(f"  - Sustainable income: ${summary['sustainable_annual_income']:,.0f}/year")
        print(f"  - Money lasts until age: {summary['money_lasts_until_age']}")
    
    def test_retirement_plan_young_person(self):
        """Test retirement plan for young person with long horizon"""
        response = requests.post(f"{BASE_URL}/api/lifecycle/retirement-plan", json={
            "current_age": 25,
            "retirement_age": 67,
            "life_expectancy": 95,
            "current_super": 15000,
            "current_savings": 5000,
            "annual_income": 60000,
            "annual_expenses": 50000,
            "desired_retirement_income": 50000,
            "super_contribution_rate": 11.5,
            "salary_sacrifice": 0,
            "investment_return": 7.0,
            "inflation_rate": 2.5
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["summary"]["years_to_retirement"] == 42
        assert data["summary"]["total_at_retirement"] > 0
        print(f"SUCCESS: Young person retirement plan - ${data['summary']['total_at_retirement']:,.0f} at retirement")


class TestEstatePlanning:
    """Tests for /api/lifecycle/estate-plan endpoint"""
    
    def test_estate_plan_basic(self):
        """Test basic estate plan analysis"""
        response = requests.post(f"{BASE_URL}/api/lifecycle/estate-plan", json={
            "total_assets": 2920000,
            "total_super": 600000,
            "property_value": 1570000,
            "beneficiaries": [
                {"name": "Sarah Wheeler", "relationship": "spouse", "share_percent": 50},
                {"name": "Emily Wheeler", "relationship": "adult_child", "share_percent": 25},
                {"name": "Michael Wheeler", "relationship": "adult_child", "share_percent": 25}
            ],
            "has_will": True,
            "has_testamentary_trust": False,
            "has_power_of_attorney": True
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "estate_summary" in data
        assert "beneficiaries" in data
        assert "checklist" in data
        assert "recommendations" in data
        assert "tax_considerations" in data
        
        # Verify estate summary
        summary = data["estate_summary"]
        assert summary["total_estate_value"] == 2920000 + 600000  # assets + super
        assert summary["num_beneficiaries"] == 3
        
        # Verify beneficiary analysis
        assert len(data["beneficiaries"]) == 3
        spouse = next((b for b in data["beneficiaries"] if b["name"] == "Sarah Wheeler"), None)
        assert spouse is not None
        assert spouse["is_tax_dependant"] is True  # Spouse is tax dependant
        assert spouse["potential_super_tax"] == 0  # No tax for dependants
        
        # Adult children should have potential super tax
        emily = next((b for b in data["beneficiaries"] if b["name"] == "Emily Wheeler"), None)
        assert emily is not None
        assert emily["is_tax_dependant"] is False
        assert emily["potential_super_tax"] > 0  # Tax for non-dependants
        
        # Verify checklist
        assert len(data["checklist"]) > 0
        will_item = next((c for c in data["checklist"] if c["item"] == "Valid Will"), None)
        assert will_item is not None
        assert will_item["complete"] is True
        
        print(f"SUCCESS: Estate plan analyzed")
        print(f"  - Total estate: ${summary['total_estate_value']:,.0f}")
        print(f"  - Beneficiaries: {summary['num_beneficiaries']}")
        print(f"  - Potential super death tax: ${data['tax_considerations']['potential_super_death_tax']:,.0f}")
    
    def test_estate_plan_no_will(self):
        """Test estate plan without will - should get critical recommendation"""
        response = requests.post(f"{BASE_URL}/api/lifecycle/estate-plan", json={
            "total_assets": 1000000,
            "total_super": 200000,
            "property_value": 500000,
            "beneficiaries": [
                {"name": "Child 1", "relationship": "adult_child", "share_percent": 100}
            ],
            "has_will": False,
            "has_testamentary_trust": False,
            "has_power_of_attorney": False
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should have critical recommendation to create will
        will_rec = next((r for r in data["recommendations"] if "Will" in r["message"]), None)
        assert will_rec is not None
        assert will_rec["priority"] == "critical"
        print(f"SUCCESS: No will warning generated - {will_rec['message']}")


class TestGoalPlanning:
    """Tests for /api/lifecycle/goal-planning endpoint"""
    
    def test_goal_planning_basic(self):
        """Test basic goal planning analysis"""
        response = requests.post(f"{BASE_URL}/api/lifecycle/goal-planning", json={
            "goals": [
                {
                    "name": "Emergency Fund",
                    "target_amount": 50000,
                    "target_date": "2025-12-31",
                    "current_savings": 25000,
                    "monthly_contribution": 500,
                    "priority": "high"
                },
                {
                    "name": "Children's Education",
                    "target_amount": 150000,
                    "target_date": "2030-01-01",
                    "current_savings": 35000,
                    "monthly_contribution": 800,
                    "priority": "high"
                }
            ],
            "available_monthly_savings": 3000,
            "risk_tolerance": "moderate"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "goals" in data
        assert "summary" in data
        assert "recommendations" in data
        assert "assumptions" in data
        
        # Verify goals analysis
        assert len(data["goals"]) == 2
        for goal in data["goals"]:
            assert "name" in goal
            assert "target_amount" in goal
            assert "required_monthly" in goal
            assert "on_track" in goal
            assert "progress_percent" in goal
            print(f"  - {goal['name']}: {goal['progress_percent']}% complete, on_track={goal['on_track']}")
        
        # Verify summary
        summary = data["summary"]
        assert summary["total_goals"] == 2
        assert "goals_on_track" in summary
        assert "total_monthly_required" in summary
        assert "monthly_surplus_shortfall" in summary
        
        print(f"SUCCESS: Goal planning analyzed")
        print(f"  - Goals on track: {summary['goals_on_track']}/{summary['total_goals']}")
        print(f"  - Monthly required: ${summary['total_monthly_required']:,.0f}")
        print(f"  - Surplus/Shortfall: ${summary['monthly_surplus_shortfall']:,.0f}")
    
    def test_goal_planning_insufficient_savings(self):
        """Test goal planning with insufficient monthly savings"""
        response = requests.post(f"{BASE_URL}/api/lifecycle/goal-planning", json={
            "goals": [
                {
                    "name": "Big Goal",
                    "target_amount": 500000,
                    "target_date": "2027-01-01",
                    "current_savings": 0,
                    "monthly_contribution": 100,
                    "priority": "high"
                }
            ],
            "available_monthly_savings": 500,
            "risk_tolerance": "aggressive"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should show shortfall
        assert data["summary"]["monthly_surplus_shortfall"] < 0
        
        # Should have recommendation about needing more savings
        budget_rec = next((r for r in data["recommendations"] if r["type"] == "budget"), None)
        assert budget_rec is not None
        print(f"SUCCESS: Insufficient savings warning - {budget_rec['message']}")


class TestFinancialAdvisorChat:
    """Tests for /api/chat/financial-advisor endpoint - DEMO MODE"""
    
    def test_chat_basic_message(self):
        """Test basic chat message"""
        response = requests.post(f"{BASE_URL}/api/chat/financial-advisor", json={
            "message": "Hello, I need help with my finances"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "response" in data
        assert "conversation_id" in data
        assert "ai_enabled" in data
        assert "suggestions" in data
        
        # Should be in demo mode (no LLM key)
        assert data["ai_enabled"] is False
        
        # Should have suggestions
        assert len(data["suggestions"]) > 0
        
        print(f"SUCCESS: Chat response received (demo mode)")
        print(f"  - Response: {data['response'][:100]}...")
        print(f"  - AI enabled: {data['ai_enabled']}")
    
    def test_chat_tax_question(self):
        """Test chat with tax-related question"""
        response = requests.post(f"{BASE_URL}/api/chat/financial-advisor", json={
            "message": "What are the tax rates for 2024-25?"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should get tax-related response
        assert "tax" in data["response"].lower() or "18,200" in data["response"]
        print(f"SUCCESS: Tax question answered")
        print(f"  - Response: {data['response'][:150]}...")
    
    def test_chat_super_question(self):
        """Test chat with superannuation question"""
        response = requests.post(f"{BASE_URL}/api/chat/financial-advisor", json={
            "message": "How can I maximize my super contributions?"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should get super-related response
        assert "super" in data["response"].lower() or "contribution" in data["response"].lower()
        print(f"SUCCESS: Super question answered")
        print(f"  - Response: {data['response'][:150]}...")
    
    def test_chat_property_question(self):
        """Test chat with property investment question"""
        response = requests.post(f"{BASE_URL}/api/chat/financial-advisor", json={
            "message": "Should I invest in property?"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should get property-related response
        assert "property" in data["response"].lower() or "rental" in data["response"].lower()
        print(f"SUCCESS: Property question answered")
    
    def test_chat_with_conversation_id(self):
        """Test chat with existing conversation ID"""
        # First message
        response1 = requests.post(f"{BASE_URL}/api/chat/financial-advisor", json={
            "message": "Tell me about dividends"
        })
        assert response1.status_code == 200
        conv_id = response1.json()["conversation_id"]
        
        # Second message with same conversation ID
        response2 = requests.post(f"{BASE_URL}/api/chat/financial-advisor", json={
            "message": "What about franking credits?",
            "conversation_id": conv_id
        })
        assert response2.status_code == 200
        assert response2.json()["conversation_id"] == conv_id
        print(f"SUCCESS: Conversation ID maintained: {conv_id}")


class TestPropertyValuations:
    """Tests for /api/property/get-valuations endpoint - MOCK DATA"""
    
    def test_property_valuation_sydney(self):
        """Test property valuation for Sydney suburb"""
        response = requests.post(f"{BASE_URL}/api/property/get-valuations", json={
            "properties": [
                {
                    "name": "Sydney Investment Unit",
                    "value": 850000,
                    "suburb": "bondi",
                    "city": "sydney",
                    "property_type": "unit",
                    "bedrooms": 2
                }
            ]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "valuations" in data
        assert len(data["valuations"]) == 1
        
        valuation = data["valuations"][0]
        assert valuation["property_name"] == "Sydney Investment Unit"
        assert valuation["estimated_value"] > 0
        assert valuation["suburb"] == "bondi"
        assert valuation["data_source"] == "mock_suburb_medians"
        
        print(f"SUCCESS: Property valuation received")
        print(f"  - Current: ${valuation['current_value']:,.0f}")
        print(f"  - Estimated: ${valuation['estimated_value']:,.0f}")
        print(f"  - Change: {valuation['change_percent']}%")
    
    def test_suburb_data(self):
        """Test getting suburb median data"""
        response = requests.get(f"{BASE_URL}/api/property/suburb-data?city=sydney")
        assert response.status_code == 200
        data = response.json()
        
        assert data["city"] == "sydney"
        assert "suburbs" in data
        assert len(data["suburbs"]) > 0
        assert "bondi" in data["suburbs"]
        print(f"SUCCESS: Suburb data retrieved - {len(data['suburbs'])} suburbs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
