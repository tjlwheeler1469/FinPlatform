"""
Test suite for Client Authentication and Practice Management endpoints
Tests: /api/client/register, /api/client/login, /api/client/me, /api/client/logout
Tests: /api/practice/tasks, /api/practice/meetings, /api/practice/time-entries
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_CLIENT_EMAIL = f"test_client_{uuid.uuid4().hex[:8]}@test.com"
TEST_CLIENT_PASSWORD = "TestPassword123!"
TEST_CLIENT_NAME = "TEST_Client User"


class TestClientAuthentication:
    """Client authentication endpoint tests"""
    
    @pytest.fixture(scope="class")
    def client_session(self):
        """Shared requests session for client tests"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_client_register_success(self, client_session):
        """Test client registration"""
        response = client_session.post(f"{BASE_URL}/api/client/register", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD,
            "name": TEST_CLIENT_NAME,
            "adviser_code": None
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "client_id" in data, "Response should contain client_id"
        assert "token" in data, "Response should contain token"
        assert data["email"] == TEST_CLIENT_EMAIL
        assert data["name"] == TEST_CLIENT_NAME
        
        # Store token for later tests
        client_session.headers.update({"Authorization": f"Bearer {data['token']}"})
        print(f"✓ Client registered successfully: {data['client_id']}")
    
    def test_client_register_duplicate_email(self, client_session):
        """Test registration with duplicate email fails"""
        response = client_session.post(f"{BASE_URL}/api/client/register", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD,
            "name": "Another User"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        print("✓ Duplicate email registration correctly rejected")
    
    def test_client_login_success(self, client_session):
        """Test client login"""
        response = client_session.post(f"{BASE_URL}/api/client/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "client_id" in data
        assert "token" in data
        assert data["email"] == TEST_CLIENT_EMAIL
        
        # Update token
        client_session.headers.update({"Authorization": f"Bearer {data['token']}"})
        print(f"✓ Client login successful: {data['client_id']}")
    
    def test_client_login_invalid_password(self, client_session):
        """Test login with wrong password"""
        response = client_session.post(f"{BASE_URL}/api/client/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401, f"Expected 401 for invalid password, got {response.status_code}"
        print("✓ Invalid password correctly rejected")
    
    def test_client_login_nonexistent_email(self, client_session):
        """Test login with non-existent email"""
        response = client_session.post(f"{BASE_URL}/api/client/login", json={
            "email": "nonexistent@test.com",
            "password": TEST_CLIENT_PASSWORD
        })
        
        assert response.status_code == 401, f"Expected 401 for non-existent email, got {response.status_code}"
        print("✓ Non-existent email correctly rejected")
    
    def test_client_me_authenticated(self, client_session):
        """Test getting client profile when authenticated"""
        # First login to get fresh token
        login_response = client_session.post(f"{BASE_URL}/api/client/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        token = login_response.json()["token"]
        
        response = client_session.get(
            f"{BASE_URL}/api/client/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "client_id" in data
        assert data["email"] == TEST_CLIENT_EMAIL
        print(f"✓ Client profile retrieved: {data['email']}")
    
    def test_client_me_unauthenticated(self, client_session):
        """Test getting client profile without auth"""
        response = requests.get(f"{BASE_URL}/api/client/me")
        
        assert response.status_code == 401, f"Expected 401 for unauthenticated request, got {response.status_code}"
        print("✓ Unauthenticated /me request correctly rejected")
    
    def test_client_logout(self, client_session):
        """Test client logout"""
        # First login to get token
        login_response = client_session.post(f"{BASE_URL}/api/client/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASSWORD
        })
        token = login_response.json()["token"]
        
        response = client_session.post(
            f"{BASE_URL}/api/client/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("✓ Client logout successful")


class TestPracticeManagementEndpoints:
    """Practice Management endpoint tests - requires adviser authentication"""
    
    @pytest.fixture(scope="class")
    def adviser_session(self):
        """Create adviser session with authentication"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_practice_tasks_unauthenticated(self, adviser_session):
        """Test tasks endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/practice/tasks")
        
        # Should return 401 for unauthenticated request
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Tasks endpoint correctly requires authentication")
    
    def test_practice_meetings_unauthenticated(self, adviser_session):
        """Test meetings endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/practice/meetings")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Meetings endpoint correctly requires authentication")
    
    def test_practice_time_entries_unauthenticated(self, adviser_session):
        """Test time entries endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/practice/time-entries")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Time entries endpoint correctly requires authentication")
    
    def test_practice_dashboard_unauthenticated(self, adviser_session):
        """Test dashboard endpoint without auth"""
        response = requests.get(f"{BASE_URL}/api/practice/dashboard")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Dashboard endpoint correctly requires authentication")


class TestHealthAndRoot:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Root endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
