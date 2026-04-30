"""Backend tests for Implementation Pack + Notify attachment + Alpaca adapter."""
import os
import base64
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://xplan-sync-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

CLIENT_ID = f"TEST_pack_{uuid.uuid4().hex[:6]}"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def sample_pdf_b64():
    # Tiny valid PDF
    pdf_bytes = b"%PDF-1.4\n%dummy test pdf content for impl pack\n%%EOF"
    return base64.b64encode(pdf_bytes).decode()


# --- Implementation Pack: orchestrator happy path ---
class TestImplementationPack:
    def test_create_pack_full(self, session, sample_pdf_b64):
        payload = {
            "doc_ref": f"SOA-{uuid.uuid4().hex[:6]}",
            "doc_type": "soa",
            "client_name": "TEST Thompson Family",
            "to_email": "test@example.com",
            "pdf_base64": sample_pdf_b64,
            "pdf_name": "TEST-SOA.pdf",
            "recommendations": [
                {"ticket_type": "trade", "headline": "Buy 100 VAS.AX",
                 "payload": {"symbol": "VAS.AX", "qty": 100, "side": "buy"}},
                {"ticket_type": "super_change", "headline": "Switch to indexed",
                 "payload": {"fund": "Hostplus Indexed Balanced", "action": "switch"}},
            ],
            "xmerge_tokens": {"client.name": "Thompson", "adviser.name": "Adviser"},
            "sections": [{"title": "Summary", "body": "..."}],
            "adviser_name": "Test Adviser",
        }
        r = session.post(f"{API}/implementation-pack/{CLIENT_ID}", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["pack_id"].startswith("pack_")
        assert isinstance(data["ticket_ids"], list)
        assert len(data["ticket_ids"]) == 2
        assert data["notify_mode"] in ("mocked", "live", "error")
        assert data["xmerge_mode"] in ("mock", "live")
        # Verify steps array
        steps = {s["step"]: s for s in data["steps"]}
        assert "pdf_stored" in steps and steps["pdf_stored"]["ok"] is True
        assert "notify_client" in steps
        assert "tickets_created" in steps and steps["tickets_created"]["count"] == 2
        assert "xmerge_push" in steps and steps["xmerge_push"]["ok"] is True
        # Stash
        pytest.pack_id = data["pack_id"]
        pytest.first_ticket_id = data["ticket_ids"][0]

    def test_list_packs(self, session):
        r = session.get(f"{API}/implementation-pack/{CLIENT_ID}")
        assert r.status_code == 200
        data = r.json()
        assert data["client_id"] == CLIENT_ID
        assert data["total"] >= 1
        assert any(p["pack_id"] == pytest.pack_id for p in data["packs"])

    def test_download_pdf(self, session):
        r = session.get(f"{API}/implementation-pack/pdf/{pytest.pack_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["pack_id"] == pytest.pack_id
        assert "pdf_base64" in data
        assert len(data["pdf_base64"]) > 10
        assert data["filename"] == "TEST-SOA.pdf"

    def test_download_pdf_404(self, session):
        r = session.get(f"{API}/implementation-pack/pdf/pack_doesnotexist")
        assert r.status_code == 404


# --- Execution Rails: adapters listing + dispatch via implementation-pack ticket ---
class TestExecutionRails:
    def test_adapters_listing(self, session):
        r = session.get(f"{API}/exec-rails/adapters")
        assert r.status_code == 200
        data = r.json()
        adapters = data["adapters"]
        broker = next((a for a in adapters if a["ticket_type"] == "trade"), None)
        assert broker is not None
        assert broker["name"] == "Broker (Alpaca)"
        # Without keys we expect live=False
        assert broker["live"] is False

    def test_dispatch_trade_ticket_mock(self, session):
        # Use the trade ticket created by implementation-pack
        r = session.post(f"{API}/exec-rails/tickets/{pytest.first_ticket_id}/dispatch")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        evt = data["event"]
        assert evt["adapter"] == "broker"
        assert evt["mode"] == "mock"  # No Alpaca keys configured
        assert isinstance(evt["stages"], list) and len(evt["stages"]) >= 1


# --- Notify Client: with and without attachment ---
class TestNotifyClient:
    def test_notify_with_attachment(self, session, sample_pdf_b64):
        body = {
            "client_id": CLIENT_ID,
            "client_name": "TEST Thompson",
            "to_email": "test@example.com",
            "subject": "Your SOA is ready",
            "body": "Please find attached.",
            "actor": "TEST_agent",
            "attachment_base64": sample_pdf_b64,
            "attachment_name": "SOA-Test.pdf",
        }
        r = session.post(f"{API}/notify/client", json=body)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        n = data["notification"]
        assert n["has_attachment"] is True
        assert n["attachment_name"] == "SOA-Test.pdf"
        assert data["mode"] in ("mocked", "live")

    def test_notify_without_attachment(self, session):
        body = {
            "client_id": CLIENT_ID,
            "client_name": "TEST Thompson",
            "to_email": "test@example.com",
            "subject": "Ping",
            "body": "Just a note.",
            "actor": "TEST_agent",
        }
        r = session.post(f"{API}/notify/client", json=body)
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        n = data["notification"]
        assert n["has_attachment"] is False
        assert n["attachment_name"] is None
