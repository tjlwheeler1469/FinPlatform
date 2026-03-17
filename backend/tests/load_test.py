"""
Wealth Command Load Testing Suite
Tests 10,000 simultaneous users across personal, adviser, and client profiles.
"""
from locust import HttpUser, task, between, events
import random
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test user profiles
ADVISER_USERS = [
    {"email": "advisor@wealthcommand.io", "password": "secure_password_123"},
    {"email": "advisor2@wealthcommand.io", "password": "secure_password_123"},
]

CLIENT_IDS = ["client_1", "client_2", "client_3", "client_4"]


class AdviserUser(HttpUser):
    """Simulates adviser workflows - 60% of traffic"""
    weight = 60
    wait_time = between(1, 5)
    
    def on_start(self):
        """Login at start"""
        self.token = None
        self.login()
    
    def login(self):
        """Authenticate adviser"""
        user = random.choice(ADVISER_USERS)
        with self.client.post(
            "/api/auth/login",
            json=user,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                response.success()
            else:
                response.failure(f"Login failed: {response.status_code}")
    
    @property
    def headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(10)
    def command_center(self):
        """Load Command Center - Most frequent"""
        self.client.get("/api/command-center/daily-digest", headers=self.headers, name="Command Center")
    
    @task(9)
    def next_best_actions(self):
        """Get next best actions - KILLER FEATURE"""
        self.client.get("/api/next-action/today?limit=8", headers=self.headers, name="Next Best Actions")
    
    @task(8)
    def practice_health(self):
        """Get practice health dashboard - KILLER FEATURE"""
        self.client.get("/api/practice-health/dashboard", headers=self.headers, name="Practice Health")
    
    @task(8)
    def portfolio_monitoring(self):
        """Check daily portfolio scan"""
        self.client.get("/api/monitoring/daily-scan", headers=self.headers, name="Portfolio Monitoring")
    
    @task(7)
    def cross_client_intelligence(self):
        """Get cross-client insights"""
        self.client.get("/api/monitoring/book-insights", headers=self.headers, name="Cross-Client Intel")
    
    @task(6)
    def tax_opportunities(self):
        """Check tax opportunities"""
        self.client.get("/api/intelligence/tax-opportunities", headers=self.headers, name="Tax Opportunities")
    
    @task(5)
    def client_holdings(self):
        """Get client holdings"""
        client_id = random.choice(CLIENT_IDS)
        self.client.get(f"/api/trading/holdings/{client_id}", headers=self.headers, name="Client Holdings")
    
    @task(5)
    def cgt_summary(self):
        """Get CGT summary"""
        client_id = random.choice(CLIENT_IDS)
        self.client.get(f"/api/trading/cgt-summary/{client_id}", headers=self.headers, name="CGT Summary")
    
    @task(4)
    def practice_health(self):
        """Check practice health"""
        self.client.get("/api/intelligence/practice-health", headers=self.headers, name="Practice Health")
    
    @task(4)
    def notifications(self):
        """Get notifications"""
        self.client.get("/api/notifications/demo", headers=self.headers, name="Notifications")
    
    @task(3)
    def meeting_prep(self):
        """Generate meeting prep"""
        client_id = random.choice(CLIENT_IDS)
        self.client.post(
            "/api/meeting-prep/generate",
            json={
                "client_id": client_id,
                "client_name": f"Test Client {client_id}",
                "meeting_type": "review",
                "portfolio_value": random.randint(500000, 5000000),
                "ytd_return": random.uniform(0.05, 0.15),
                "retirement_probability": random.randint(50, 90),
                "risk_profile": random.choice(["Conservative", "Balanced", "Growth"]),
                "age": random.randint(35, 65)
            },
            headers=self.headers,
            name="Meeting Prep"
        )
    
    @task(3)
    def financial_graph(self):
        """Get client financial graph"""
        client_id = random.choice(CLIENT_IDS)
        self.client.get(f"/api/financial-graph/{client_id}", headers=self.headers, name="Financial Graph")
    
    @task(2)
    def calculate_cgt(self):
        """Calculate CGT for a trade"""
        client_id = random.choice(CLIENT_IDS)
        self.client.get(
            f"/api/trading/calculate-cgt?client_id={client_id}&symbol=CBA.AX&units_to_sell=50",
            headers=self.headers,
            name="Calculate CGT"
        )
    
    @task(2)
    def rebalancing_preview(self):
        """Preview rebalancing"""
        client_id = random.choice(CLIENT_IDS)
        self.client.get(f"/api/rebalancing/{client_id}/preview", headers=self.headers, name="Rebalancing Preview")
    
    @task(2)
    def tax_optimization(self):
        """Get tax optimization analysis"""
        client_id = random.choice(CLIENT_IDS)
        self.client.get(f"/api/tax-optimization/{client_id}/analysis", headers=self.headers, name="Tax Optimization")
    
    @task(1)
    def ai_copilot_query(self):
        """AI Copilot query"""
        queries = [
            "Which clients have tax-loss opportunities?",
            "Who has >30% US equities?",
            "Which portfolios need rebalancing?",
            "Show clients approaching retirement"
        ]
        self.client.post(
            "/api/copilot/query",
            json={"query": random.choice(queries), "context": "adviser_dashboard"},
            headers=self.headers,
            name="AI Copilot Query"
        )


class ClientPortalUser(HttpUser):
    """Simulates client portal access - 25% of traffic"""
    weight = 25
    wait_time = between(2, 8)
    
    def on_start(self):
        self.token = None
        self.client_login()
    
    def client_login(self):
        """Login as client"""
        with self.client.post(
            "/api/client-portal/auth/login",
            json={"email": "client_wheeler@email.com", "password": "wheeler2025"},
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                response.success()
            else:
                response.failure(f"Client login failed: {response.status_code}")
    
    @property
    def headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}
    
    @task(10)
    def client_dashboard(self):
        """View client dashboard"""
        self.client.get("/api/client-portal/dashboard/client_1", headers=self.headers, name="Client Dashboard")
    
    @task(5)
    def client_portfolio(self):
        """View portfolio"""
        self.client.get("/api/trading/holdings/client_1", headers=self.headers, name="Client Portfolio")
    
    @task(3)
    def client_goals(self):
        """View goals"""
        self.client.get("/api/goals/client_1", headers=self.headers, name="Client Goals")
    
    @task(2)
    def client_documents(self):
        """View documents"""
        self.client.get("/api/documents/client_1", headers=self.headers, name="Client Documents")


class PublicUser(HttpUser):
    """Simulates unauthenticated API access - 15% of traffic"""
    weight = 15
    wait_time = between(1, 3)
    
    @task(10)
    def health_check(self):
        """API health check"""
        self.client.get("/api/health", name="Health Check")
    
    @task(5)
    def market_summary(self):
        """Get market summary"""
        self.client.get("/api/live-data/market-summary", name="Market Summary")
    
    @task(3)
    def brokers_list(self):
        """Get available brokers"""
        self.client.get("/api/trading/brokers", name="Brokers List")
    
    @task(2)
    def data_aggregators(self):
        """Get CDR aggregators"""
        self.client.get("/api/data-aggregators/options", name="Data Aggregators")


# Statistics tracking
test_results = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "response_times": []
}


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, response, context, exception, **kwargs):
    """Track all requests"""
    test_results["total_requests"] += 1
    test_results["response_times"].append(response_time)
    
    if exception:
        test_results["failed_requests"] += 1
    else:
        test_results["successful_requests"] += 1


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Generate final report"""
    avg_response = sum(test_results["response_times"]) / len(test_results["response_times"]) if test_results["response_times"] else 0
    p95_response = sorted(test_results["response_times"])[int(len(test_results["response_times"]) * 0.95)] if test_results["response_times"] else 0
    
    print("\n" + "="*60)
    print("WEALTH COMMAND LOAD TEST RESULTS")
    print("="*60)
    print(f"Total Requests: {test_results['total_requests']:,}")
    print(f"Successful: {test_results['successful_requests']:,}")
    print(f"Failed: {test_results['failed_requests']:,}")
    print(f"Success Rate: {(test_results['successful_requests']/test_results['total_requests']*100):.2f}%" if test_results['total_requests'] > 0 else "N/A")
    print(f"Avg Response Time: {avg_response:.2f}ms")
    print(f"P95 Response Time: {p95_response:.2f}ms")
    print("="*60)


if __name__ == "__main__":
    print("Run with: locust -f load_test.py --host=https://advisor-os.preview.emergentagent.com")
    print("Or for headless: locust -f load_test.py --headless -u 10000 -r 100 -t 5m --host=URL")
