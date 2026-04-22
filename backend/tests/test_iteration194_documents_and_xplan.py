"""
Iteration 194 focused retest:
- /api/documents + /api/documents/ should both return 200 (no 307)
- Response shape should contain {documents, total}
"""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://goal-feasibility-hub.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestDocumentsNoRedirect:
    """Verify both /api/documents and /api/documents/ return 200 without redirect."""

    def test_no_trailing_slash_returns_200(self, client):
        r = client.get(f"{BASE_URL}/api/documents", allow_redirects=False)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}; headers={dict(r.headers)}"
        data = r.json()
        assert "documents" in data
        assert "total" in data
        assert isinstance(data["documents"], list)
        assert data["total"] >= 3, f"Expected >=3 documents, got total={data['total']}"

    def test_trailing_slash_returns_200(self, client):
        r = client.get(f"{BASE_URL}/api/documents/", allow_redirects=False)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}; headers={dict(r.headers)}"
        data = r.json()
        assert "documents" in data
        assert data["total"] >= 3

    def test_shape_matches_spec(self, client):
        """Verify the spec shape: {documents: [...], total: N}."""
        r = client.get(f"{BASE_URL}/api/documents")
        assert r.status_code == 200
        data = r.json()
        assert set(data.keys()) >= {"documents", "total"}
        for doc in data["documents"]:
            assert "id" in doc
            assert "name" in doc
