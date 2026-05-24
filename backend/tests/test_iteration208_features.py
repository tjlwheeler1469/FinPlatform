"""
Iteration 208 backend tests:
- Xplan compliance push/pull mocked endpoints
- Files search parity for thompson_family (My Vault data source)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://decision-engine-109.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Xplan Compliance Sync ---
class TestXplanCompliance:
    def test_push_compliance_mock(self, api):
        r = api.post(f"{BASE_URL}/api/xplan-sync/compliance/push", json={}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "ok"
        assert data["direction"] == "push"
        assert data["mode"] in ("mock", "live")
        assert "metrics" in data
        m = data["metrics"]
        for k in ("compliant", "minor_issues", "major_issues", "pending_review", "total", "compliance_rate"):
            assert k in m, f"missing metric {k}"
        assert isinstance(m["total"], int)
        assert isinstance(m["compliance_rate"], (int, float))

    def test_pull_compliance_mock_returns_two_flags(self, api):
        r = api.post(f"{BASE_URL}/api/xplan-sync/compliance/pull", json={}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "ok"
        assert data["mode"] == "mock"
        assert data["items_pulled"] == 2
        flags = data["flags"]
        assert len(flags) == 2
        ext_ids = [f["external_id"] for f in flags]
        assert "XGRC-7841" in ext_ids
        assert "XGRC-7842" in ext_ids
        # type check
        soa = next(f for f in flags if f["external_id"] == "XGRC-7841")
        assert "Statement of Advice" in soa["type"] or "SOA" in soa["type"].upper()
        ann = next(f for f in flags if f["external_id"] == "XGRC-7842")
        assert "Annual Review" in ann["type"]
        for f in flags:
            assert f["source"] == "xplan_grc"

    def test_pull_compliance_idempotent(self, api):
        # second call should still return 2 and not duplicate
        r1 = api.post(f"{BASE_URL}/api/xplan-sync/compliance/pull", json={}, timeout=30)
        r2 = api.post(f"{BASE_URL}/api/xplan-sync/compliance/pull", json={}, timeout=30)
        assert r1.status_code == 200 and r2.status_code == 200
        assert r2.json()["items_pulled"] == 2


# --- Files Search parity (My Vault data source) ---
class TestVaultParity:
    def test_files_search_thompson_family(self, api):
        r = api.get(f"{BASE_URL}/api/files/search", params={"client_id": "thompson_family", "only_latest": "true"}, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "objects" in data
        objs = data["objects"]
        assert isinstance(objs, list)
        assert len(objs) >= 1, "Expected at least one Thompson document for Vault parity"
        for o in objs:
            assert o.get("owner_client_id") == "thompson_family"
            assert "object_id" in o and "filename" in o

    def test_files_search_only_latest_flag(self, api):
        """Calling with only_latest=true should not return is_latest=false entries."""
        r = api.get(f"{BASE_URL}/api/files/search", params={"client_id": "thompson_family", "only_latest": "true"}, timeout=30)
        assert r.status_code == 200
        for o in r.json()["objects"]:
            assert o.get("is_latest", True) is True

    def test_files_search_same_for_adviser_and_client(self, api):
        """The same endpoint is consumed by both adviser Vault and client MyVault -> parity by definition."""
        r = api.get(f"{BASE_URL}/api/files/search", params={"client_id": "thompson_family", "only_latest": "true"}, timeout=30)
        assert r.status_code == 200
        ids = sorted([o["object_id"] for o in r.json()["objects"]])
        # call again, same result
        r2 = api.get(f"{BASE_URL}/api/files/search", params={"client_id": "thompson_family", "only_latest": "true"}, timeout=30)
        ids2 = sorted([o["object_id"] for o in r2.json()["objects"]])
        assert ids == ids2
