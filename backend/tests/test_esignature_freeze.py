"""Backend tests for E-Signature inbound webhook + document freeze.

Validates the full flow:
  1. Upload v1 of a doc to a known family
  2. POST /api/e-signature/event to mark it signed
  3. Confirm versions are frozen, audit recorded
  4. Attempt v2 upload — must be rejected with 423
  5. /status endpoint reports frozen with envelope/signer detail
"""
import os
import base64
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://decision-engine-109.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def family_key():
    return f"TEST_esig_{uuid.uuid4().hex[:8]}"


def _upload(session, family_key: str, version_marker: str) -> dict:
    pdf = f"%PDF-1.4\nfake-content-{version_marker}\n%%EOF".encode()
    r = session.post(f"{API}/files/upload-base64", json={
        "filename": f"SOA_{version_marker}.pdf",
        "mime": "application/pdf",
        "content_base64": base64.b64encode(pdf).decode(),
        "family_key": family_key,
        "owner_client_id": "test_client",
        "tags": ["soa", "test"],
    })
    return r


class TestESignatureFlow:
    def test_freeze_on_signature(self, session, family_key):
        # Step 1 — upload v1
        r1 = _upload(session, family_key, "v1")
        assert r1.status_code == 200, f"v1 upload failed: {r1.text}"
        v1 = r1.json()
        assert v1["version"] == 1
        assert v1["is_latest"] is True

        # Step 2 — sign it
        r_sign = session.post(f"{API}/e-signature/event", json={
            "family_key": family_key,
            "signer_email": "client@example.com",
            "signer_name": "Test Client",
            "provider": "docusign",
            "envelope_id": f"env_{uuid.uuid4().hex[:8]}",
            "client_id": "test_client",
        })
        assert r_sign.status_code == 200, f"sign failed: {r_sign.text}"
        sig = r_sign.json()
        assert sig["success"] is True
        assert sig["versions_frozen"] == 1
        assert sig["audit_id"].startswith("esig_")

        # Step 3 — status reports frozen + signer + envelope
        r_status = session.get(f"{API}/e-signature/status/{family_key}")
        assert r_status.status_code == 200
        status = r_status.json()
        assert status["is_frozen"] is True
        assert status["signer_email"] == "client@example.com"
        assert status["provider"] == "docusign"
        assert status["envelope_id"]

        # Step 4 — v2 upload must be rejected with 423
        r2 = _upload(session, family_key, "v2")
        assert r2.status_code == 423, f"v2 should be blocked but got {r2.status_code}: {r2.text}"
        assert "frozen" in r2.text.lower()

    def test_signature_404_unknown_family(self, session):
        r = session.post(f"{API}/e-signature/event", json={
            "family_key": f"nonexistent_{uuid.uuid4().hex[:8]}",
            "signer_email": "x@y.com",
        })
        assert r.status_code == 404

    def test_signed_log_includes_recent_event(self, session, family_key):
        # Set up a fresh family then sign it
        r1 = _upload(session, family_key, "v1")
        assert r1.status_code == 200

        env_id = f"env_audit_{uuid.uuid4().hex[:6]}"
        r_sign = session.post(f"{API}/e-signature/event", json={
            "family_key": family_key,
            "signer_email": "auditor@example.com",
            "provider": "adobe_sign",
            "envelope_id": env_id,
        })
        assert r_sign.status_code == 200

        # Audit log should include this event
        r_log = session.get(f"{API}/e-signature/signed?limit=50")
        assert r_log.status_code == 200
        signed_log = r_log.json()
        envelopes = [s.get("envelope_id") for s in signed_log["signed"]]
        assert env_id in envelopes
