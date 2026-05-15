"""Iteration 199: Advice Copilot LLM, execution tickets, notify, market feed, compliance trail."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://decision-engine-109.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ==================== ADVICE COPILOT ====================
class TestAdviceCopilot:
    draft_id = None

    def test_generate_draft(self, s):
        payload = {
            "client_id": "chen_family",
            "client_name": "Michael & Lisa Chen",
            "headline": "Rebalance to growth-tilt portfolio",
            "message": "Client == 12 years from retirement and currently 60/40.",
            "context": {"readiness_score": 78, "classification": "on_track", "score_delta": 6, "financial_impact": 145000, "urgency": "SOON", "confidence": 82},
            "actor": "adviser",
        }
        r = s.post(f"{API}/advice/drafts", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"]
        d = data["draft"]
        assert d["status"] == "draft"
        assert d["version"] == 1
        assert len(d["body"]) > 200, f"body too short: {len(d['body'])}"
        body_lower = d["body"].lower()
        assert "recommendation" in body_lower
        assert "rationale" in body_lower
        assert "action steps" in body_lower
        assert any(h["event"] == "generated" for h in d["history"])
        TestAdviceCopilot.draft_id = d["draft_id"]

    def test_get_and_list_drafts(self, s):
        did = TestAdviceCopilot.draft_id
        assert did
        r = s.get(f"{API}/advice/drafts/{did}", timeout=15)
        assert r.status_code == 200
        assert r.json()["draft_id"] == did
        # list with filter
        r2 = s.get(f"{API}/advice/drafts", params={"client_id": "chen_family"}, timeout=15)
        assert r2.status_code == 200
        assert any(d["draft_id"] == did for d in r2.json()["drafts"])

    def test_amend_draft(self, s):
        did = TestAdviceCopilot.draft_id
        r = s.patch(f"{API}/advice/drafts/{did}", json={"title": "Rebalance — adviser amended", "adviser_notes": "Tighten language."}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["success"]
        assert "title" in data["changed"]
        assert data["draft"]["version"] == 2
        assert data["draft"]["title"] == "Rebalance — adviser amended"

    def test_regenerate_draft(self, s):
        did = TestAdviceCopilot.draft_id
        r = s.post(f"{API}/advice/drafts/{did}/regenerate", json={"amendment_prompt": "Make it 100 words max and blunt."}, timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()["draft"]
        assert d["version"] >= 3
        assert any(h["event"] == "regenerated" for h in d["history"])

    def test_approve_locks_draft(self, s):
        did = TestAdviceCopilot.draft_id
        r = s.post(f"{API}/advice/drafts/{did}/approve", json={"approved_by": "adviser_001", "notes": "ok"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["draft"]["status"] == "approved"
        # now amend should 409
        r2 = s.patch(f"{API}/advice/drafts/{did}", json={"title": "no"}, timeout=15)
        assert r2.status_code == 409
        # regenerate should 409
        r3 = s.post(f"{API}/advice/drafts/{did}/regenerate", json={"amendment_prompt": "no"}, timeout=15)
        assert r3.status_code == 409

    def test_reject_endpoint(self, s):
        # generate a fresh one to reject
        r = s.post(f"{API}/advice/drafts", json={
            "client_id": "thompson_family", "client_name": "Thompson", "headline": "Test reject", "message": "x", "context": {}, "actor": "adviser"
        }, timeout=60)
        did = r.json()["draft"]["draft_id"]
        r2 = s.post(f"{API}/advice/drafts/{did}/reject", json={"rejected_by": "adviser_001", "reason": "not appropriate"}, timeout=15)
        assert r2.status_code == 200
        assert r2.json()["draft"]["status"] == "rejected"


# ==================== EXECUTION TICKETS ====================
class TestExecutionTickets:
    ticket_id = None

    def test_create_ticket(self, s):
        r = s.post(f"{API}/execution/tickets", json={
            "client_id": "chen_family", "client_name": "Chen", "ticket_type": "rebalance",
            "headline": "Apply rebalance", "message": "shift 10% to growth", "payload": {"from": "balanced", "to": "growth"},
            "requested_by": "adviser", "urgency": "SOON",
        }, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["success"]
        assert d["ticket"]["status"] == "pending"
        TestExecutionTickets.ticket_id = d["ticket"]["ticket_id"]

    def test_list_and_get(self, s):
        tid = TestExecutionTickets.ticket_id
        r = s.get(f"{API}/execution/tickets", timeout=15)
        assert r.status_code == 200
        assert any(t["ticket_id"] == tid for t in r.json()["tickets"])
        r2 = s.get(f"{API}/execution/tickets/{tid}", timeout=15)
        assert r2.status_code == 200

    def test_patch(self, s):
        tid = TestExecutionTickets.ticket_id
        r = s.patch(f"{API}/execution/tickets/{tid}", json={"status": "executing", "adviser_notes": "go"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["ticket"]["status"] == "executing"

    def test_summary(self, s):
        r = s.get(f"{API}/execution/tickets/dashboard/summary", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "total" in d and "by_status" in d
        assert d["total"] >= 1


# ==================== NOTIFY CLIENT ====================
class TestNotify:
    def test_notify_mocked(self, s):
        r = s.post(f"{API}/notify/client", json={
            "client_id": "chen_family", "client_name": "Chen",
            "to_email": "test@example.com", "subject": "Update", "body": "hi", "actor": "adviser",
        }, timeout=15)
        assert r.status_code == 200
        d = r.json()
        # RESEND_API_KEY is intentionally absent
        assert d["mode"] == "mocked"
        assert d["notification"]["mode"] == "mocked"

    def test_notify_log(self, s):
        r = s.get(f"{API}/notify/log", params={"client_id": "chen_family"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["total"] >= 1


# ==================== MARKET SNAPSHOT ====================
class TestMarketSnapshot:
    def test_snapshot(self, s):
        r = s.get(f"{API}/market-feed/snapshot", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["source"] == "simulated"
        assert "items" in d and len(d["items"]) >= 3
        symbols = {i["symbol"] for i in d["items"]}
        assert {"XJO", "XAO", "AUDUSD"}.issubset(symbols)
        assert "avg_delta_pct" in d


# ==================== COMPLIANCE AUDIT (Mongo persistence) ====================
class TestComplianceAudit:
    def test_log_readiness_event(self, s):
        r = s.post(f"{API}/compliance-audit/readiness-events", json={
            "client_id": "chen_family", "client_name": "Chen", "score": 78,
            "classification": "on_track", "factors": [{"id": "savings", "score": 80}],
            "inputs": {"age": 53}, "num_sims": 1000, "actor": "adviser",
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["success"]

    def test_list_readiness_events(self, s):
        r = s.get(f"{API}/compliance-audit/readiness-events", params={"client_id": "chen_family"}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["total"] >= 1

    def test_readiness_summary(self, s):
        r = s.get(f"{API}/compliance-audit/readiness-events/summary", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "total_events" in d
        assert d["total_events"] >= 1

    def test_log_adviser_action(self, s):
        r = s.post(f"{API}/compliance-audit/adviser-actions", json={
            "actor": "adviser", "action": "generate", "item_id": "feed_1",
            "client_id": "chen_family", "headline": "Generated advice",
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["success"]

    def test_list_adviser_actions(self, s):
        r = s.get(f"{API}/compliance-audit/adviser-actions", params={"client_id": "chen_family"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["total"] >= 1
        # filter by action
        r2 = s.get(f"{API}/compliance-audit/adviser-actions", params={"action": "generate"}, timeout=15)
        assert r2.status_code == 200
        assert all(a["action"] == "generate" for a in r2.json()["actions"])
