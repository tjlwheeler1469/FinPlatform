"""
Iteration 128 - Voice Command Router Tests
Tests the new unified /api/voice-command/process endpoint with:
- Page-context awareness (retirement, shares, adviceos, etc.)
- What-if scenario support with session memory
- Structured JSON responses (retirement_analysis, stock_insight, compliance_check, scenario_analysis)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Basic health and existing endpoint tests"""
    
    def test_health_endpoint(self):
        """GET /api/health returns 200 with version 8.0.0"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("version") == "8.0.0"
        print(f"✓ Health endpoint: status={data['status']}, version={data['version']}")
    
    def test_buffett_engine_screen(self):
        """GET /api/buffett-engine/screen returns stock ideas"""
        response = requests.get(f"{BASE_URL}/api/buffett-engine/screen")
        assert response.status_code == 200
        data = response.json()
        assert "ideas" in data
        assert len(data["ideas"]) > 0
        # Verify structure of stock ideas
        first_idea = data["ideas"][0]
        assert "symbol" in first_idea
        assert "action" in first_idea
        assert first_idea["action"] in ["BUY", "AVOID", "HOLD"]
        print(f"✓ Buffett engine: {len(data['ideas'])} stock ideas returned")


class TestVoiceCommandRetirementContext:
    """Tests for voice command with retirement page context"""
    
    def test_retirement_analysis_basic(self):
        """POST /api/voice-command/process with retirement context returns retirement_analysis type"""
        response = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "Client age 55, wealth $2.5M, super $800K, retire at 65",
                "page_context": "retirement",
                "session_id": f"test_ret_{int(time.time())}"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify success and structured response
        assert data.get("success")
        assert data.get("structured")
        assert data.get("result_type") == "retirement_analysis"
        assert data.get("page_context") == "retirement"
        
        # Verify result structure
        result = data.get("result", {})
        assert result.get("type") == "retirement_analysis"
        assert "client_summary" in result
        assert "retirement_analysis" in result
        assert "tax_considerations" in result
        
        # Verify CGT and franking credits are present
        tax = result.get("tax_considerations", {})
        assert "estimated_cgt_liability" in tax or "franking_credits_value" in tax
        
        print(f"✓ Retirement analysis: type={result['type']}, has CGT/franking info")
    
    def test_retirement_analysis_with_cgt_franking(self):
        """Verify retirement analysis includes CGT and franking credits details"""
        response = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "Client age 60, $3M wealth, $1.2M super, $500K in Australian shares with franking credits, retire at 67",
                "page_context": "retirement",
                "session_id": f"test_cgt_{int(time.time())}"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success")
        
        result = data.get("result", {})
        tax = result.get("tax_considerations", {})
        
        # Should have franking credits explanation
        assert "franking_credits_value" in tax or "franking_credits_explanation" in tax
        print(f"✓ CGT/Franking: CGT={tax.get('estimated_cgt_liability')}, Franking={tax.get('franking_credits_value')}")


class TestVoiceCommandSharesContext:
    """Tests for voice command with shares page context"""
    
    def test_stock_insight_query(self):
        """POST /api/voice-command/process with shares context returns stock_insight type"""
        response = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "How is BHP performing?",
                "page_context": "shares",
                "session_id": f"test_shares_{int(time.time())}"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success")
        assert data.get("structured")
        assert data.get("result_type") == "stock_insight"
        assert data.get("page_context") == "shares"
        
        result = data.get("result", {})
        assert result.get("type") == "stock_insight"
        assert "summary" in result
        assert "data_points" in result
        
        print(f"✓ Stock insight: type={result['type']}, summary length={len(result.get('summary', ''))}")


class TestVoiceCommandWhatIfScenario:
    """Tests for what-if scenario support with session memory"""
    
    def test_what_if_follow_up(self):
        """Test what-if follow-up uses previous session context"""
        session_id = f"whatif_test_{int(time.time())}"
        
        # Step 1: Initial retirement analysis
        response1 = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "Client age 55, wealth $2.5M, super $800K, property $450K, retire at 65",
                "page_context": "retirement",
                "session_id": session_id
            }
        )
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1.get("success")
        assert data1.get("result_type") == "retirement_analysis"
        print(f"✓ Initial analysis: session={session_id}")
        
        # Small delay to ensure session is stored
        time.sleep(0.5)
        
        # Step 2: What-if follow-up with same session_id
        response2 = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "what if they sell the property",
                "page_context": "retirement",
                "session_id": session_id
            }
        )
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2.get("success")
        
        result2 = data2.get("result", {})
        
        # Verify what_if_comparison is present
        assert "what_if_comparison" in result2, "what_if_comparison should be present in follow-up"
        wif = result2.get("what_if_comparison", {})
        assert "summary" in wif, "what_if_comparison should have summary"
        
        print(f"✓ What-if follow-up: has comparison={bool(wif)}, summary={wif.get('summary', '')[:50]}...")


class TestVoiceCommandOtherContexts:
    """Tests for other page contexts"""
    
    def test_adviceos_context(self):
        """Test voice command with adviceos context"""
        response = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "Run a compliance check for client Wheeler",
                "page_context": "adviceos",
                "session_id": f"test_adviceos_{int(time.time())}"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success")
        assert data.get("page_context") == "adviceos"
        print(f"✓ AdviceOS context: result_type={data.get('result_type')}")
    
    def test_dashboard_context(self):
        """Test voice command with dashboard context"""
        response = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "Give me a portfolio summary",
                "page_context": "dashboard",
                "session_id": f"test_dashboard_{int(time.time())}"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success")
        assert data.get("page_context") == "dashboard"
        print(f"✓ Dashboard context: result_type={data.get('result_type')}")
    
    def test_default_context(self):
        """Test voice command with default context"""
        response = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "What is the current super contribution cap?",
                "page_context": "default",
                "session_id": f"test_default_{int(time.time())}"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success")
        print(f"✓ Default context: result_type={data.get('result_type')}")


class TestVoiceCommandEdgeCases:
    """Edge case tests for voice command endpoint"""
    
    def test_empty_text(self):
        """Test with empty text - should still return a response"""
        response = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "",
                "page_context": "retirement"
            }
        )
        # Should return 200 but may have error in response
        assert response.status_code in [200, 400, 422]
        print(f"✓ Empty text: status={response.status_code}")
    
    def test_missing_page_context(self):
        """Test with missing page_context - should default to 'default'"""
        response = requests.post(
            f"{BASE_URL}/api/voice-command/process",
            json={
                "text": "What is the weather like?"
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Should use default context
        assert data.get("page_context") in ["default", None]
        print(f"✓ Missing context: page_context={data.get('page_context')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
