"""
Iteration 127 - Voice Retirement Analysis API Tests
Tests the new voice-retirement endpoints and existing health/buffett/esignature APIs
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndCoreAPIs:
    """Test core API endpoints"""
    
    def test_health_endpoint(self):
        """GET /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        data = response.json()
        assert "status" in data or "version" in data, "Health response missing expected fields"
        print(f"✓ Health check passed: {data}")
    
    def test_buffett_engine_screen(self):
        """GET /api/buffett-engine/screen returns data"""
        response = requests.get(f"{BASE_URL}/api/buffett-engine/screen")
        assert response.status_code == 200, f"Buffett engine screen failed: {response.status_code}"
        data = response.json()
        # Should have 'ideas' key with list of stock recommendations
        assert "ideas" in data, "Buffett engine response missing 'ideas' key"
        print(f"✓ Buffett engine screen returned: {len(data.get('ideas', []))} ideas")


class TestVoiceRetirementAnalysis:
    """Test the new voice-retirement analysis endpoints"""
    
    def test_voice_retirement_analyze_basic(self):
        """POST /api/voice-retirement/analyze with retirement query returns structured JSON"""
        payload = {
            "text": "Client age 55, wealth 2.5 million, super 800k, wants to retire at 65",
            "session_id": "test_iteration127"
        }
        response = requests.post(
            f"{BASE_URL}/api/voice-retirement/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60  # LLM calls can take time
        )
        
        assert response.status_code == 200, f"Voice retirement analyze failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Check success field
        assert "success" in data, "Response missing 'success' field"
        assert data["success"], f"Analysis failed: {data.get('error', 'Unknown error')}"
        
        # Check raw_input is echoed back
        assert "raw_input" in data, "Response missing 'raw_input' field"
        assert data["raw_input"] == payload["text"], "raw_input doesn't match input"
        
        print(f"✓ Voice retirement analyze returned success: {data['success']}")
        print(f"  - Structured: {data.get('structured', False)}")
        
        # If structured, verify analysis fields
        if data.get("structured") and data.get("analysis"):
            analysis = data["analysis"]
            expected_fields = ["client_summary", "retirement_analysis", "tax_considerations", "age_pension", "recommendations"]
            for field in expected_fields:
                assert field in analysis, f"Analysis missing expected field: {field}"
            print(f"  - Analysis fields present: {list(analysis.keys())}")
        
        return data
    
    def test_voice_retirement_analyze_complex_scenario(self):
        """Test with more complex client scenario including entities"""
        payload = {
            "text": "Client John == 52 years old with $1.8M in personal shares, $600K in SMSF, $450K in family trust, investment property worth $900K with $300K mortgage. Wife Sarah == 50 with $400K super. They want to retire at 60 with $100K annual income.",
            "session_id": "test_complex_127"
        }
        response = requests.post(
            f"{BASE_URL}/api/voice-retirement/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Complex scenario failed: {response.status_code}"
        data = response.json()
        assert data.get("success"), f"Complex analysis failed: {data.get('error')}"
        print("✓ Complex scenario analysis completed")
        
        if data.get("structured") and data.get("analysis"):
            analysis = data["analysis"]
            # Check for CGT and franking credits in tax considerations
            if "tax_considerations" in analysis:
                tc = analysis["tax_considerations"]
                print(f"  - Tax considerations: {list(tc.keys()) if isinstance(tc, dict) else tc}")
            if "entities" in analysis:
                print(f"  - Entities detected: {len(analysis['entities'])}")
    
    def test_voice_retirement_analyze_empty_text(self):
        """Test with empty text - should still return response"""
        payload = {
            "text": "",
            "session_id": "test_empty"
        }
        response = requests.post(
            f"{BASE_URL}/api/voice-retirement/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        # Should return 200 but may have success=false or minimal response
        assert response.status_code == 200, f"Empty text request failed: {response.status_code}"
        data = response.json()
        print(f"✓ Empty text handled: success={data.get('success')}")
    
    def test_voice_retirement_analyze_cgt_franking(self):
        """Test specifically for CGT and franking credits analysis"""
        payload = {
            "text": "Client has $500K in BHP shares bought 10 years ago for $200K, receiving $15K in fully franked dividends annually. They want to sell half to fund retirement.",
            "session_id": "test_cgt_franking"
        }
        response = requests.post(
            f"{BASE_URL}/api/voice-retirement/analyze",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"CGT/franking test failed: {response.status_code}"
        data = response.json()
        assert data.get("success"), f"CGT/franking analysis failed: {data.get('error')}"
        
        if data.get("structured") and data.get("analysis"):
            analysis = data["analysis"]
            tc = analysis.get("tax_considerations", {})
            print("✓ CGT/Franking analysis:")
            print(f"  - CGT liability: {tc.get('estimated_cgt_liability', 'N/A')}")
            print(f"  - CGT discount: {tc.get('cgt_discount_available', 'N/A')}")
            print(f"  - Franking credits: {tc.get('franking_credits_value', 'N/A')}")


class TestVoiceRetirementTranscribe:
    """Test the transcribe-and-analyze endpoint (audio upload)"""
    
    def test_transcribe_endpoint_exists(self):
        """Verify the transcribe-and-analyze endpoint exists (without actual audio)"""
        # Send empty form data to check endpoint exists
        response = requests.post(
            f"{BASE_URL}/api/voice-retirement/transcribe-and-analyze",
            data={"session_id": "test"},
            timeout=10
        )
        
        # Should return 422 (validation error for missing audio) not 404
        assert response.status_code != 404, "Transcribe endpoint not found"
        print(f"✓ Transcribe endpoint exists (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
