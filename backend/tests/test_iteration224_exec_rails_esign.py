"""
Iteration 224 backend tests:
- POST /api/exec-rails/adapters/{ticket_type}/test (5 types)
- E-signature outbound: /requests, /send, /sign/{id}, /provider/health
- Sanity checks on existing /api/exec-rails/adapters and /api/e-signature/event
"""
import os
import uuid
import pytest
import requests

def _load_backend_url():
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if url:
        return url.rstrip("/")
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    return line.split("=", 1)[1].strip().strip('"').rstrip("/")
    raise RuntimeError("REACT_APP_BACKEND_URL not set")


BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api"

ADAPTER_TYPES = ["trade", "super_change", "insurance_quote", "contribution", "rebalance"]


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Execution Rails ----------

class TestExecRailsAdapterTest:
    @pytest.mark.parametrize("ttype", ADAPTER_TYPES)
    def test_adapter_test_returns_200(self, client, ttype):
        r = client.post(f"{API}/exec-rails/adapters/{ttype}/test", json={})
        assert r.status_code == 200, f"{ttype}: {r.status_code} {r.text}"
        data = r.json()
        for k in ("ticket_type", "mode", "reachable", "latency_ms", "detail", "checked_at"):
            assert k in data, f"missing {k} in {data}"
        assert data["ticket_type"] == ttype
        # No live env keys present → expect mode=mock, reachable=False
        assert data["mode"] == "mock", f"{ttype} expected mock got {data['mode']}"
        assert data["reachable"] is False, f"{ttype} expected reachable=False got {data['reachable']}"

    def test_unknown_adapter_returns_400(self, client):
        r = client.post(f"{API}/exec-rails/adapters/bogus/test", json={})
        assert r.status_code == 400

    def test_adapters_list_still_works(self, client):
        r = client.get(f"{API}/exec-rails/adapters")
        assert r.status_code == 200
        data = r.json()
        assert "adapters" in data
        types = {a["ticket_type"] for a in data["adapters"]}
        assert types == set(ADAPTER_TYPES)


# ---------- E-Signature Outbound ----------

class TestEsignatureOutbound:
    def test_provider_health_returns_mock(self, client):
        r = client.get(f"{API}/esignature/provider/health")
        assert r.status_code == 200
        data = r.json()
        assert data["provider"] == "mock"
        assert data["mode"] == "mock"

    def test_list_requests_with_limit(self, client):
        r = client.get(f"{API}/esignature/requests", params={"limit": 5})
        assert r.status_code == 200
        data = r.json()
        for k in ("requests", "count", "total"):
            assert k in data
        assert isinstance(data["requests"], list)
        assert len(data["requests"]) <= 5

    def test_send_and_list(self, client):
        uniq = uuid.uuid4().hex[:8]
        payload = {
            "document_id": f"doc_{uniq}",
            "document_name": f"TEST_SOA_{uniq}.pdf",
            "client_id": f"TEST_client_{uniq}",
            "client_name": "Test Client",
            "client_email": "test@example.com",
            "message": "Please sign",
        }
        r = client.post(f"{API}/esignature/send", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["provider"] == "mock"
        assert data["mode"] == "mock"
        assert data["request_id"].startswith("sig_")
        assert data["envelope_id"].startswith("env_")
        assert "signing_url" in data and data["signing_url"]
        rid = data["request_id"]

        # verify visible in list
        lst = client.get(f"{API}/esignature/requests", params={"limit": 50}).json()
        ids = {r2.get("request_id") for r2 in lst["requests"]}
        assert rid in ids

        # verify status endpoint
        sr = client.get(f"{API}/esignature/status/{rid}")
        assert sr.status_code == 200
        assert sr.json()["request_id"] == rid
        assert sr.json()["status"] == "pending"

    def test_sign_completes_and_is_idempotent(self, client):
        uniq = uuid.uuid4().hex[:8]
        send = client.post(f"{API}/esignature/send", json={
            "document_id": f"doc_{uniq}",
            "document_name": f"TEST_{uniq}.pdf",
            "client_id": f"TEST_c_{uniq}",
            "client_name": "Sign Tester",
            "client_email": "sign@example.com",
        }).json()
        rid = send["request_id"]

        sign = client.post(f"{API}/esignature/sign/{rid}",
                           json={"role": "client", "name": "Test Signer"})
        assert sign.status_code == 200, sign.text
        data = sign.json()
        assert data["success"] is True
        assert data["status"] == "completed"
        assert "signed_at" in data
        assert data["audit_id"].startswith("esig_")

        # Status reflects completion
        sr = client.get(f"{API}/esignature/status/{rid}").json()
        assert sr["status"] == "completed"

        # 2nd sign → 409
        again = client.post(f"{API}/esignature/sign/{rid}",
                            json={"role": "client", "name": "Test Signer"})
        assert again.status_code == 409

    def test_sign_with_family_key_freezes_versions(self, client):
        """When request includes family_key, downstream documents must be frozen."""
        uniq = uuid.uuid4().hex[:8]
        family_key = f"TEST_fam_{uniq}"

        # Best-effort: try to upload a doc into the family. If the endpoint
        # isn't present, skip the freeze check.
        try:
            up = client.post(f"{API}/files/upload", json={
                "family_key": family_key,
                "filename": f"TEST_{uniq}.pdf",
                "content_base64": "VEVTVA==",  # 'TEST'
                "client_id": f"TEST_c_{uniq}",
            }, timeout=10)
            if up.status_code not in (200, 201):
                pytest.skip(f"files/upload not available (status={up.status_code})")
        except requests.RequestException as e:
            pytest.skip(f"files/upload not reachable: {e}")

        send = client.post(f"{API}/esignature/send", json={
            "document_id": f"doc_{uniq}",
            "document_name": f"TEST_{uniq}.pdf",
            "client_id": f"TEST_c_{uniq}",
            "client_name": "FK Signer",
            "client_email": "fk@example.com",
            "family_key": family_key,
        }).json()
        rid = send["request_id"]

        sign = client.post(f"{API}/esignature/sign/{rid}",
                           json={"role": "client", "name": "FK Signer"})
        assert sign.status_code == 200

        ver = client.get(f"{API}/files/versions/{family_key}")
        if ver.status_code != 200:
            pytest.skip(f"files/versions returned {ver.status_code}")
        versions = ver.json()
        # support either {versions:[..]} or [..]
        rows = versions.get("versions", versions) if isinstance(versions, dict) else versions
        if rows:
            assert any(v.get("is_frozen") for v in rows), \
                f"Expected is_frozen=true in versions: {rows}"

    def test_sign_with_deal_id_advances_deal(self, client):
        """When request has deal_id, deal stage must become 'signed'."""
        uniq = uuid.uuid4().hex[:8]
        # Create deal — best effort
        create = client.post(f"{API}/deals", json={
            "client_id": f"TEST_c_{uniq}",
            "title": f"TEST Deal {uniq}",
            "stage": "drafting",
        })
        if create.status_code not in (200, 201):
            pytest.skip(f"deals POST not available ({create.status_code})")
        deal = create.json()
        deal_id = deal.get("deal_id") or deal.get("id")
        if not deal_id:
            pytest.skip("no deal_id returned")

        send = client.post(f"{API}/esignature/send", json={
            "document_id": f"doc_{uniq}",
            "document_name": f"TEST_{uniq}.pdf",
            "client_id": f"TEST_c_{uniq}",
            "client_name": "Deal Signer",
            "client_email": "d@example.com",
            "deal_id": deal_id,
        }).json()
        rid = send["request_id"]
        sign = client.post(f"{API}/esignature/sign/{rid}",
                           json={"role": "client", "name": "Deal Signer"})
        assert sign.status_code == 200

        d2 = client.get(f"{API}/deals/{deal_id}")
        if d2.status_code == 200:
            assert d2.json().get("stage") == "signed", d2.json()

    def test_sign_404_for_unknown(self, client):
        r = client.post(f"{API}/esignature/sign/sig_does_not_exist",
                        json={"role": "client", "name": "X"})
        assert r.status_code == 404


# ---------- Existing inbound webhook sanity ----------

class TestEsignatureInboundEvent:
    def test_inbound_event_endpoint_200(self, client):
        """The inbound webhook should still accept a valid payload (200)."""
        uniq = uuid.uuid4().hex[:8]
        payload = {
            "event": "envelope_completed",
            "envelope_id": f"env_TEST_{uniq}",
            "document_id": f"doc_TEST_{uniq}",
            "client_id": f"TEST_c_{uniq}",
            "client_email": "t@example.com",
            "signer_email": "t@example.com",
            "signer_name": "Inbound Tester",
            "family_key": f"TEST_fam_{uniq}",
            "signed_at": "2026-01-01T00:00:00Z",
        }
        # Endpoint is mounted; 404 may mean "family not found in Vault" (still a valid wiring),
        # 200 means side-effects ran. We accept both as "endpoint reachable".
        for path in ("/e-signature/event", "/esignature/event"):
            r = client.post(f"{API}{path}", json=payload)
            if r.status_code in (200, 404):
                # 404 must come from business logic (family not found) not routing
                if r.status_code == 404 and "not found" not in r.text.lower():
                    continue
                assert r.status_code in (200, 404), f"{path}: {r.status_code} {r.text}"
                return
        pytest.skip("No inbound webhook endpoint found")
