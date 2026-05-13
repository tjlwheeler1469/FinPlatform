# Tests for Resend email service — mocked mode (no RESEND_API_KEY).
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://xplan-sync-hub.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestEmailResendStatus:
    def test_status_returns_mocked_mode(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/email-resend/status", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("sdk_installed")
        assert not data.get("api_key_configured")
        assert data.get("mode") == "mocked"


class TestEmailResendSend:
    def test_send_returns_mocked_response(self, api_client):
        payload = {
            "recipient_email": "test@example.com",
            "subject": "hi",
            "html_content": "<p>hi</p>",
        }
        r = api_client.post(f"{BASE_URL}/api/email-resend/send", json=payload, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "mocked"
        assert data.get("mocked")

    def test_send_invalid_email_returns_422(self, api_client):
        payload = {"recipient_email": "not-an-email", "subject": "hi", "html_content": "<p>hi</p>"}
        r = api_client.post(f"{BASE_URL}/api/email-resend/send", json=payload, timeout=15)
        assert r.status_code == 422

    def test_send_missing_subject_returns_422(self, api_client):
        payload = {"recipient_email": "test@example.com", "html_content": "<p>hi</p>"}
        r = api_client.post(f"{BASE_URL}/api/email-resend/send", json=payload, timeout=15)
        assert r.status_code == 422
