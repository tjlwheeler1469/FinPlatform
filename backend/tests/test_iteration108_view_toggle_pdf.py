"""
Test Iteration 108 Features:
1. Advisor/Client view toggle in Confidence Engine
2. PDF Document Generation for Confidence Engine reports
3. Client view simplified UI elements
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestConfidenceReportPDFGeneration:
    """Test PDF generation for Confidence Engine reports"""
    
    def test_confidence_report_endpoint_exists(self):
        """Test that the confidence report PDF endpoint exists"""
        # Test with minimal valid payload
        payload = {
            "client_id": "test_client_001",
            "client_name": "Test Client",
            "adviser_name": "Test Adviser",
            "report_date": datetime.now().strftime("%Y-%m-%d"),
            "confidence_score": 75.5,
            "risk_breakdown": {
                "longevity_risk": 15.0,
                "market_risk": 20.0,
                "spending_risk": 10.0,
                "inflation_risk": 5.0
            },
            "projections": {
                "best_case_wealth": 3000000,
                "median_wealth": 2000000,
                "worst_case_wealth": 1000000
            },
            "inputs": {
                "current_age": 45,
                "retirement_age": 65,
                "life_expectancy": 90,
                "net_worth": 2000000,
                "annual_income": 200000,
                "annual_expenses": 100000,
                "super_balance": 600000,
                "investment_balance": 400000,
                "is_couple": True,
                "entity_type": "personal"
            },
            "assumptions": {
                "inflation_rate": 2.5,
                "expected_return": 7.0,
                "num_simulations": 1000
            },
            "scenarios": [],
            "ai_explanation": ""
        }
        
        response = requests.post(
            f"{BASE_URL}/api/documents/generate/confidence-report",
            json=payload
        )
        
        # Should return 200 with PDF content
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert response.headers.get('content-type') == 'application/pdf', f"Expected PDF content type, got {response.headers.get('content-type')}"
    
    def test_confidence_report_pdf_content(self):
        """Test that PDF is generated with valid content"""
        payload = {
            "client_id": "pdf_test_client",
            "client_name": "James & Sarah Mitchell",
            "adviser_name": "Sarah Chen",
            "report_date": "2026-01-15",
            "confidence_score": 82.5,
            "risk_breakdown": {
                "longevity_risk": 12.5,
                "market_risk": 18.0,
                "spending_risk": 8.5,
                "inflation_risk": 6.0
            },
            "projections": {
                "best_case_wealth": 4500000,
                "median_wealth": 3200000,
                "worst_case_wealth": 1800000
            },
            "inputs": {
                "current_age": 50,
                "retirement_age": 65,
                "life_expectancy": 92,
                "net_worth": 2500000,
                "annual_income": 250000,
                "annual_expenses": 120000,
                "super_balance": 800000,
                "investment_balance": 500000,
                "is_couple": True,
                "entity_type": "joint"
            },
            "assumptions": {
                "inflation_rate": 2.5,
                "expected_return": 7.0,
                "num_simulations": 1000
            },
            "scenarios": [
                {
                    "name": "Early Retirement",
                    "confidence_score": 72.0,
                    "adjustments": {"retirement_age": 60}
                }
            ],
            "ai_explanation": "Based on your current financial situation, you are on track for a comfortable retirement."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/documents/generate/confidence-report",
            json=payload
        )
        
        assert response.status_code == 200
        
        # Check PDF magic bytes (PDF files start with %PDF)
        content = response.content
        assert content[:4] == b'%PDF', "Response should be a valid PDF file"
        
        # Check content disposition header
        content_disposition = response.headers.get('content-disposition', '')
        assert 'attachment' in content_disposition, "Should have attachment disposition"
        assert 'filename=' in content_disposition, "Should have filename in disposition"
    
    def test_confidence_report_with_ai_explanation(self):
        """Test PDF generation with AI explanation included"""
        payload = {
            "client_id": "ai_test_client",
            "client_name": "Test User",
            "adviser_name": "Test Adviser",
            "report_date": "2026-01-15",
            "confidence_score": 65.0,
            "risk_breakdown": {
                "longevity_risk": 20.0,
                "market_risk": 25.0,
                "spending_risk": 15.0,
                "inflation_risk": 10.0
            },
            "projections": {
                "best_case_wealth": 2000000,
                "median_wealth": 1500000,
                "worst_case_wealth": 800000
            },
            "inputs": {
                "current_age": 55,
                "retirement_age": 65,
                "life_expectancy": 90,
                "net_worth": 1500000,
                "annual_income": 150000,
                "annual_expenses": 90000,
                "super_balance": 400000,
                "investment_balance": 300000,
                "is_couple": False,
                "entity_type": "personal"
            },
            "assumptions": {
                "inflation_rate": 3.0,
                "expected_return": 6.5,
                "num_simulations": 500
            },
            "scenarios": [],
            "ai_explanation": "Your retirement confidence score of 65% indicates moderate readiness. Consider increasing your super contributions by $10,000 per year to improve your score by approximately 5-8%."
        }
        
        response = requests.post(
            f"{BASE_URL}/api/documents/generate/confidence-report",
            json=payload
        )
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'application/pdf'
        assert len(response.content) > 1000, "PDF should have substantial content"


class TestConfidenceEngineQuickCalculate:
    """Test confidence engine calculation endpoint (used by both views)"""
    
    def test_quick_calculate_endpoint(self):
        """Test the quick calculate endpoint returns valid confidence data"""
        params = {
            "net_worth": 2000000,
            "annual_income": 200000,
            "annual_expenses": 100000,
            "current_age": 45,
            "retirement_age": 65,
            "life_expectancy": 90,
            "is_couple": True,
            "num_simulations": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/confidence-engine/quick-calculate",
            params=params
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "confidence_score" in data, "Should have confidence_score"
        assert "risk_breakdown" in data, "Should have risk_breakdown"
        assert "statistics" in data, "Should have statistics"
        
        # Verify confidence score is valid
        assert 0 <= data["confidence_score"] <= 100, "Confidence score should be 0-100"
        
        # Verify risk breakdown has expected keys
        risk = data["risk_breakdown"]
        assert "longevity_risk" in risk
        assert "market_risk" in risk
        assert "spending_risk" in risk
        assert "inflation_risk" in risk


class TestAIExplanationEndpoint:
    """Test AI explanation endpoint used by Confidence Engine"""
    
    def test_ai_explain_endpoint(self):
        """Test AI explanation endpoint returns valid explanation"""
        payload = {
            "confidence_score": 75.0,
            "risk_breakdown": {
                "longevity_risk": 15.0,
                "market_risk": 20.0,
                "spending_risk": 10.0,
                "inflation_risk": 5.0
            },
            "statistics": {
                "median_final_wealth": 2500000,
                "p10_final_wealth": 1200000,
                "p90_final_wealth": 4000000
            },
            "inputs": {
                "net_worth": 2000000,
                "years_to_retirement": 20,
                "annual_expenses": 100000,
                "portfolio_return": 7.0,
                "portfolio_volatility": 12
            },
            "client_name": "Test Client"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai-explain/explain",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have explanation content (either AI or rule-based)
        assert "explanation" in data or "ai_explanation" in data or "score_explanation" in data


class TestWealthDataForImport:
    """Test wealth data endpoint used by Import from Net Worth feature"""
    
    def test_wealth_snapshot_for_demo_client(self):
        """Test wealth snapshot returns data for demo client"""
        response = requests.get(f"{BASE_URL}/api/wealth-data/snapshot/demo_client")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify client data exists
        assert "client_id" in data, "Should have client_id"
        assert "assets" in data, "Should have assets"
        
        # Verify assets array has data for import
        assert len(data["assets"]) > 0, "Should have at least one asset"


class TestDocumentGenerationTemplates:
    """Test document generation template endpoints"""
    
    def test_soa_template_endpoint(self):
        """Test SOA template endpoint returns template structure"""
        response = requests.get(f"{BASE_URL}/api/documents/generate/soa/template")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "template" in data, "Should have template structure"
        template = data["template"]
        
        # Verify template has required fields
        assert "client_id" in template
        assert "client_name" in template
        assert "adviser_name" in template
        assert "recommendations" in template
        assert "fees" in template


class TestClientPortalEndpoints:
    """Test Client Portal endpoints (used by Client view)"""
    
    def test_client_portal_dashboard(self):
        """Test client portal dashboard endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/dashboard/portal_001")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify dashboard structure
        assert "name" in data or "summary" in data, "Should have client data"
    
    def test_client_portal_goals(self):
        """Test client portal goals endpoint"""
        response = requests.get(f"{BASE_URL}/api/client-portal/goals/portal_001")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have goals data
        assert "goals" in data or "summary" in data


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
