"""Iter 212 — Evidence Pack, Advice Marketplace, Open API, Branding."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://decision-engine-109.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------------- Evidence Pack ----------------
class TestEvidencePack:
    def test_preview_html(self, s):
        r = s.get(f"{API}/evidence/preview-html?days=30", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "html" in data and "payload" in data
        assert "metrics" in data["payload"]
        assert "<table" in data["html"]

    def test_generate_pdf(self, s):
        r = s.post(f"{API}/evidence/generate?days=30", timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert data.get("object_id")
        assert data.get("version", 0) >= 1
        assert data.get("bytes", 0) > 1000
        assert "metrics" in data
        m = data["metrics"]
        assert "total_files" in m and "compliance_rate" in m


# ---------------- Advice Marketplace ----------------
class TestAdviceMarketplace:
    def test_seed_idempotent(self, s):
        r = s.post(f"{API}/advice-marketplace/seed", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("total", 0) >= 6
        # 2nd call should not duplicate
        r2 = s.post(f"{API}/advice-marketplace/seed", timeout=30)
        assert r2.json().get("inserted") == 0

    def test_list_templates(self, s):
        r = s.get(f"{API}/advice-marketplace/templates", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert len(d["templates"]) >= 6
        cats = {f["category"] for f in d["categories"]}
        for c in ["tax", "super", "smsf", "estate"]:
            assert c in cats, f"missing category {c}; got {cats}"

    def test_clone_template_creates_deal(self, s):
        r = s.post(
            f"{API}/advice-marketplace/templates/tpl_eofy_tax_loss_harvest/clone",
            json={"client_id": "thompson_family"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        assert d.get("deal_id", "").startswith("deal_")
        deal = d["deal"]
        assert deal["source"] == "marketplace"
        assert deal["stage"] == "draft"
        assert "marketplace" in deal["tags"]


# ---------------- Open API platform ----------------
class TestOpenAPI:
    def test_scopes(self, s):
        r = s.get(f"{API}/open-api/scopes", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["count"] == 9
        assert len(d["scopes"]) == 9
        assert len(d["categories"]) == 5

    def test_issue_token_and_revoke(self, s):
        r = s.post(
            f"{API}/open-api/tokens",
            json={"name": "TEST_pytest_token", "scopes": ["clients.read", "deals.read"]},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        assert d["token"].startswith("hwc_")
        assert "warning" in d
        token_id = d["token_id"]
        # List must not expose hashed_secret
        lr = s.get(f"{API}/open-api/tokens", timeout=20).json()
        for tok in lr["tokens"]:
            assert "hashed_secret" not in tok
        # Revoke
        rv = s.post(f"{API}/open-api/tokens/{token_id}/revoke", timeout=20)
        assert rv.status_code == 200
        rvj = rv.json()
        assert rvj["success"] is True
        assert rvj.get("revoked_at")
        # Cannot revoke twice
        rv2 = s.post(f"{API}/open-api/tokens/{token_id}/revoke", timeout=20)
        assert rv2.status_code == 400

    def test_issue_invalid_scope(self, s):
        r = s.post(
            f"{API}/open-api/tokens",
            json={"name": "bad", "scopes": ["nonsense.scope"]},
            timeout=20,
        )
        assert r.status_code == 400

    def test_openapi_spec(self, s):
        r = s.get(f"{API}/open-api/spec", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["openapi", "paths", "info"]:
            assert k in d


# ---------------- Firm Branding ----------------
class TestBranding:
    def test_current(self, s):
        r = s.get(f"{API}/branding/current", timeout=20)
        assert r.status_code == 200
        d = r.json()
        for k in ["firm_name", "primary_color", "accent_color", "is_default"]:
            assert k in d

    def test_update_and_persist(self, s):
        r = s.post(
            f"{API}/branding/update", json={"primary_color": "#0F4C81"}, timeout=20
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["success"] is True
        assert d["branding"]["primary_color"] == "#0F4C81"
        # Verify via GET
        g = s.get(f"{API}/branding/current", timeout=20).json()
        assert g["primary_color"] == "#0F4C81"
        assert g["is_default"] is False

    def test_invalid_hex(self, s):
        r = s.post(
            f"{API}/branding/update", json={"primary_color": "#not-a-color"}, timeout=20
        )
        assert r.status_code == 400

    def test_reset(self, s):
        r = s.post(f"{API}/branding/reset", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["success"] is True
        assert d["branding"]["firm_name"] == "Halcyon Wealth Command Centre"
        assert d["branding"]["is_default"] is True


# ---------------- Regression: previously shipped routes ----------------
class TestRegressionPing:
    @pytest.mark.parametrize("ep", [
        "/clients",
        "/deals",
        "/webhooks",
        "/rbac/audit",
    ])
    def test_endpoint_reachable(self, s, ep):
        r = s.get(f"{API}{ep}", timeout=20)
        # Either 200 or 404 OK; just ensure not 5xx
        assert r.status_code < 500, f"{ep} -> {r.status_code}: {r.text[:200]}"
