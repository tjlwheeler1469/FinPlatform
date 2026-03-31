"""
Locust Load Test for CGT (Capital Gains Tax) Endpoint
Run: locust -f locustfile_cgt.py --headless -u 50 -r 10 -t 60s --host=http://localhost:8001
"""
from locust import HttpUser, task, between
import secrets
import random
import json


class CGTLoadTest(HttpUser):
    """Load test user for CGT calculation endpoint."""
    
    wait_time = between(0.1, 0.5)  # Fast request rate
    
    # Sample holdings data for testing
    sample_holdings = [
        {
            "symbol": "BHP",
            "name": "BHP Group Ltd",
            "quantity": 500,
            "purchase_price": 42.50,
            "current_price": 48.30,
            "purchase_date": "2022-03-15"
        },
        {
            "symbol": "CSL",
            "name": "CSL Limited",
            "quantity": 100,
            "purchase_price": 285.00,
            "current_price": 312.45,
            "purchase_date": "2021-06-20"
        },
        {
            "symbol": "CBA",
            "name": "Commonwealth Bank",
            "quantity": 200,
            "purchase_price": 95.00,
            "current_price": 102.80,
            "purchase_date": "2023-01-10"
        },
        {
            "symbol": "WOW",
            "name": "Woolworths Group",
            "quantity": 300,
            "purchase_price": 38.50,
            "current_price": 32.10,
            "purchase_date": "2022-08-05"
        },
        {
            "symbol": "NAB",
            "name": "National Australia Bank",
            "quantity": 400,
            "purchase_price": 28.00,
            "current_price": 31.50,
            "purchase_date": "2020-11-12"
        },
        {
            "symbol": "ANZ",
            "name": "ANZ Banking Group",
            "quantity": 350,
            "purchase_price": 24.00,
            "current_price": 27.80,
            "purchase_date": "2021-03-25"
        },
        {
            "symbol": "TLS",
            "name": "Telstra Corporation",
            "quantity": 1000,
            "purchase_price": 3.80,
            "current_price": 4.15,
            "purchase_date": "2019-07-18"
        },
        {
            "symbol": "RIO",
            "name": "Rio Tinto Limited",
            "quantity": 150,
            "purchase_price": 115.00,
            "current_price": 128.50,
            "purchase_date": "2022-05-30"
        }
    ]
    
    @task(5)
    def calculate_cgt_simple(self):
        """Test CGT calculation with a small portfolio."""
        holdings = secrets.SystemRandom().sample(self.sample_holdings, k=random.randint(2, 4))
        
        payload = {
            "holdings": holdings,
            "financial_year": "2024-25",
            "marginal_tax_rate": 0.37
        }
        
        with self.client.post(
            "/api/trading/calculate-cgt",
            json=payload,
            catch_response=True,
            name="CGT - Simple (2-4 holdings)"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "total_gains" in data or "summary" in data:
                    response.success()
                else:
                    response.failure(f"Invalid response structure: {data.keys()}")
            else:
                response.failure(f"Status {response.status_code}: {response.text[:200]}")
    
    @task(3)
    def calculate_cgt_medium(self):
        """Test CGT calculation with a medium portfolio."""
        holdings = secrets.SystemRandom().sample(self.sample_holdings, k=random.randint(4, 6))
        
        payload = {
            "holdings": holdings,
            "financial_year": "2024-25",
            "marginal_tax_rate": 0.45
        }
        
        with self.client.post(
            "/api/trading/calculate-cgt",
            json=payload,
            catch_response=True,
            name="CGT - Medium (4-6 holdings)"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}")
    
    @task(2)
    def calculate_cgt_full(self):
        """Test CGT calculation with full portfolio."""
        payload = {
            "holdings": self.sample_holdings,
            "financial_year": "2024-25",
            "marginal_tax_rate": 0.325
        }
        
        with self.client.post(
            "/api/trading/calculate-cgt",
            json=payload,
            catch_response=True,
            name="CGT - Full (8 holdings)"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}")
    
    @task(1)
    def calculate_cgt_with_losses(self):
        """Test CGT with explicit loss harvesting."""
        # Include assets with losses
        loss_holdings = [h for h in self.sample_holdings if h["current_price"] < h["purchase_price"]]
        gain_holdings = [h for h in self.sample_holdings if h["current_price"] > h["purchase_price"]]
        
        holdings = loss_holdings[:2] + gain_holdings[:3]
        
        payload = {
            "holdings": holdings,
            "financial_year": "2024-25",
            "marginal_tax_rate": 0.37,
            "include_tax_loss_harvesting": True
        }
        
        with self.client.post(
            "/api/trading/calculate-cgt",
            json=payload,
            catch_response=True,
            name="CGT - With Tax Loss Harvesting"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}")


class CGTHealthCheckUser(HttpUser):
    """Secondary user to check endpoint health during load test."""
    
    wait_time = between(2, 5)
    
    @task
    def health_check(self):
        """Check API health during load test."""
        self.client.get("/api/health", name="Health Check")
    
    @task
    def get_tax_summary(self):
        """Get general tax summary."""
        self.client.get("/api/tax/summary", name="Tax Summary")


if __name__ == "__main__":
    import subprocess
    import sys
    
    # Run locust in headless mode for quick test
    cmd = [
        "locust",
        "-f", __file__,
        "--headless",
        "-u", "50",      # 50 users
        "-r", "10",      # 10 users/second spawn rate
        "-t", "60s",     # 60 second test duration
        "--host", "http://localhost:8001",
        "--csv", "/app/test_reports/cgt_load_test"
    ]
    
    print("Starting CGT Load Test...")
    print(f"Command: {' '.join(cmd)}")
    subprocess.run(cmd)
