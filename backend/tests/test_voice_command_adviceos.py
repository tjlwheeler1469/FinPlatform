"""
Unit tests for Voice Command Router and AdviceOS endpoints.
Tests the unified voice command system with page-context awareness and what-if scenarios.
"""

import pytest
import httpx
import os

API_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
if not API_URL.startswith("http"):
    API_URL = f"https://{API_URL}"


@pytest.fixture
def client():
    return httpx.Client(base_url=API_URL, timeout=60)


class TestVoiceCommandRouter:
    """Tests for the unified /api/voice-command/process endpoint."""

    def test_retirement_analysis(self, client: httpx.Client) -> None:
        """Test basic retirement analysis via voice command router."""
        response = client.post("/api/voice-command/process", json={
            "text": "Client age 55, wealth 2 million, super 600k, retire at 65",
            "page_context": "retirement",
            "session_id": "test_unit_1"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert data["result_type"] == "retirement_analysis"
        result = data["result"]
        assert "retirement_analysis" in result
        assert "tax_considerations" in result
        assert "recommendations" in result

    def test_stock_query(self, client: httpx.Client) -> None:
        """Test stock insight query on shares page."""
        response = client.post("/api/voice-command/process", json={
            "text": "How is BHP performing and what is the outlook?",
            "page_context": "shares",
            "session_id": "test_unit_2"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
        assert data["structured"]
        assert data["page_context"] == "shares"

    def test_general_query(self, client: httpx.Client) -> None:
        """Test general financial planning question."""
        response = client.post("/api/voice-command/process", json={
            "text": "What is the current concessional super contribution cap?",
            "page_context": "dashboard",
            "session_id": "test_unit_3"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"]

    def test_missing_text(self, client: httpx.Client) -> None:
        """Test error handling for missing text."""
        response = client.post("/api/voice-command/process", json={
            "page_context": "default",
            "session_id": "test_unit_4"
        })
        assert response.status_code == 422  # Validation error


class TestHealthAndExistingRoutes:
    """Verify existing routes still work after refactoring."""

    def test_health(self, client: httpx.Client) -> None:
        """Health endpoint returns 200."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "8.0.0"

    def test_buffett_screen(self, client: httpx.Client) -> None:
        """Buffett engine screen endpoint works."""
        response = client.get("/api/buffett-engine/screen")
        assert response.status_code == 200
        data = response.json()
        assert "ideas" in data
        assert "sentiment_score" in data

    def test_mfa_endpoint(self, client: httpx.Client) -> None:
        """MFA endpoint returns data."""
        response = client.get("/api/mfa/default_user")
        assert response.status_code == 200

    def test_voice_retirement_analyze(self, client: httpx.Client) -> None:
        """Original retirement analysis endpoint still works."""
        response = client.post("/api/voice-retirement/analyze", json={
            "text": "Client age 60, super 1.2M, retire at 67",
            "session_id": "test_unit_legacy"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"]
