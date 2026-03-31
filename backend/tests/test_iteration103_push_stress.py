"""
Test Suite for Iteration 103: Push Notification System and Stress Testing
Tests:
- Push notification service status and CRUD operations
- Notification preferences management
- Demo notification seeding
- Stress testing system metrics and capacity estimation
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

# ==================== PUSH NOTIFICATION TESTS ====================

class TestPushNotificationStatus:
    """Push notification service status tests"""
    
    def test_push_status_endpoint(self, api_client):
        """Test /api/push/status returns operational status"""
        response = api_client.get(f"{BASE_URL}/api/push/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "operational"
        assert "services" in data
        assert "in_app" in data["services"]
        assert "web_push" in data["services"]
        assert "fcm" in data["services"]
        assert "websocket" in data["services"]
        assert "timestamp" in data
        print(f"Push status: {data['status']}, services: {list(data['services'].keys())}")


class TestUserNotifications:
    """User notification CRUD tests"""
    
    def test_get_user_notifications(self, api_client):
        """Test /api/push/notifications/{user_id} returns user notifications"""
        user_id = "demo_user"
        response = api_client.get(f"{BASE_URL}/api/push/notifications/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "notifications" in data
        assert "total" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)
        print(f"User {user_id} has {data['total']} notifications, {data['unread_count']} unread")
    
    def test_get_notifications_with_filters(self, api_client):
        """Test notification filtering by unread_only"""
        user_id = "demo_user"
        response = api_client.get(f"{BASE_URL}/api/push/notifications/{user_id}?unread_only=true")
        assert response.status_code == 200
        
        data = response.json()
        assert "notifications" in data
        # All returned notifications should be unread
        for notif in data["notifications"]:
            assert notif.get("read") is False
        print(f"Unread notifications: {len(data['notifications'])}")


class TestDemoNotifications:
    """Demo notification seeding tests"""
    
    def test_seed_demo_notifications(self, api_client):
        """Test /api/push/demo/seed-notifications creates demo data"""
        user_id = "demo_user"
        response = api_client.post(f"{BASE_URL}/api/push/demo/seed-notifications?user_id={user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["notifications_created"] == 5  # 5 demo notifications
        assert "notification_ids" in data
        assert len(data["notification_ids"]) == 5
        print(f"Created {data['notifications_created']} demo notifications")
    
    def test_verify_seeded_notifications(self, api_client):
        """Verify seeded notifications appear in user's list"""
        user_id = "demo_user"
        response = api_client.get(f"{BASE_URL}/api/push/notifications/{user_id}?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 5  # At least the 5 we seeded
        
        # Check notification types from demo data
        notification_types = [n["notification_type"] for n in data["notifications"]]
        print(f"Notification types found: {set(notification_types)}")


class TestNotificationPreferences:
    """Notification preferences CRUD tests"""
    
    def test_get_default_preferences(self, api_client):
        """Test getting default preferences for new user"""
        user_id = f"test_user_{uuid.uuid4().hex[:8]}"
        response = api_client.get(f"{BASE_URL}/api/push/preferences/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        # Should return defaults
        assert data["user_id"] == user_id
        assert data["in_app_enabled"] is True
        assert data["desktop_push_enabled"] is True
        assert "categories" in data
        print(f"Default preferences for {user_id}: in_app={data['in_app_enabled']}")
    
    def test_save_preferences(self, api_client):
        """Test saving notification preferences"""
        user_id = f"test_user_{uuid.uuid4().hex[:8]}"
        preferences = {
            "user_id": user_id,
            "in_app_enabled": True,
            "desktop_push_enabled": False,
            "mobile_push_enabled": True,
            "email_enabled": True,
            "sms_enabled": False,
            "categories": {
                "compliance": True,
                "platform_sync": True,
                "portfolio": True,
                "meeting": False,
                "document": True,
                "breach": True,
                "general": True
            },
            "quiet_hours_enabled": True,
            "quiet_start": "22:00",
            "quiet_end": "07:00",
            "digest_mode": False,
            "digest_frequency": "daily"
        }
        
        response = api_client.post(f"{BASE_URL}/api/push/preferences", json=preferences)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        print(f"Saved preferences for {user_id}")
        
        # Verify saved preferences
        get_response = api_client.get(f"{BASE_URL}/api/push/preferences/{user_id}")
        assert get_response.status_code == 200
        
        saved = get_response.json()
        assert saved["desktop_push_enabled"] is False
        assert saved["quiet_hours_enabled"] is True
        assert saved["categories"]["meeting"] is False
        print(f"Verified preferences: desktop_push={saved['desktop_push_enabled']}, quiet_hours={saved['quiet_hours_enabled']}")


class TestNotificationActions:
    """Notification action tests (mark read, dismiss)"""
    
    def test_mark_notification_read(self, api_client):
        """Test marking a notification as read"""
        user_id = "demo_user"
        
        # First seed some notifications
        api_client.post(f"{BASE_URL}/api/push/demo/seed-notifications?user_id={user_id}")
        
        # Get notifications
        response = api_client.get(f"{BASE_URL}/api/push/notifications/{user_id}?unread_only=true")
        data = response.json()
        
        if data["notifications"]:
            notif_id = data["notifications"][0]["notification_id"]
            
            # Mark as read
            read_response = api_client.put(f"{BASE_URL}/api/push/notifications/{notif_id}/read")
            assert read_response.status_code == 200
            
            read_data = read_response.json()
            assert read_data["success"] is True
            print(f"Marked notification {notif_id} as read")
        else:
            print("No unread notifications to test")
    
    def test_mark_all_read(self, api_client):
        """Test marking all notifications as read"""
        user_id = "demo_user"
        
        response = api_client.put(f"{BASE_URL}/api/push/notifications/{user_id}/read-all")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        print(f"Marked {data.get('marked_read', 0)} notifications as read")


class TestSendNotification:
    """Test sending notifications"""
    
    def test_send_test_notification(self, api_client):
        """Test sending a test notification through all channels"""
        user_id = "demo_user"
        response = api_client.post(f"{BASE_URL}/api/push/test/send-all?user_id={user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "notification_id" in data
        assert "channels" in data
        print(f"Test notification sent: {data['notification_id']}, channels: {data['channels']}")


# ==================== STRESS TESTING TESTS ====================

class TestSystemMetrics:
    """System metrics endpoint tests"""
    
    def test_get_system_metrics(self, api_client):
        """Test /api/stress-test/system/metrics returns CPU/Memory/Disk"""
        response = api_client.get(f"{BASE_URL}/api/stress-test/system/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert "cpu_percent" in data
        assert "memory" in data
        assert "disk" in data
        assert "timestamp" in data
        
        # Validate memory structure
        assert "total_mb" in data["memory"]
        assert "used_mb" in data["memory"]
        assert "percent" in data["memory"]
        
        # Validate disk structure
        assert "total_gb" in data["disk"]
        assert "used_gb" in data["disk"]
        assert "percent" in data["disk"]
        
        print(f"System metrics: CPU={data['cpu_percent']}%, Memory={data['memory']['percent']}%, Disk={data['disk']['percent']}%")
    
    def test_get_capacity_estimate(self, api_client):
        """Test /api/stress-test/system/capacity-estimate returns capacity"""
        response = api_client.get(f"{BASE_URL}/api/stress-test/system/capacity-estimate")
        assert response.status_code == 200
        
        data = response.json()
        assert "estimated_max_concurrent_users" in data
        assert "limiting_factor" in data
        assert "cpu_headroom_percent" in data
        assert "memory_headroom_mb" in data
        assert "recommendations" in data
        assert "timestamp" in data
        
        assert isinstance(data["estimated_max_concurrent_users"], int)
        assert data["limiting_factor"] in ["CPU", "Memory"]
        assert isinstance(data["recommendations"], list)
        
        print(f"Capacity estimate: {data['estimated_max_concurrent_users']} users, limited by {data['limiting_factor']}")


class TestStressTestHistory:
    """Stress test history endpoint tests"""
    
    def test_get_test_history(self, api_client):
        """Test /api/stress-test/history returns test history"""
        response = api_client.get(f"{BASE_URL}/api/stress-test/history?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "tests" in data
        assert "total" in data
        assert isinstance(data["tests"], list)
        
        print(f"Test history: {data['total']} tests found")
        
        # If there are tests, validate structure
        if data["tests"]:
            test = data["tests"][0]
            assert "test_id" in test
            assert "status" in test
            print(f"Latest test: {test['test_id']} - {test['status']}")


class TestStressTestStatus:
    """Stress test status endpoint tests"""
    
    def test_get_nonexistent_test_status(self, api_client):
        """Test getting status of non-existent test returns 404"""
        response = api_client.get(f"{BASE_URL}/api/stress-test/status/NONEXISTENT-TEST")
        assert response.status_code == 404
        print("Non-existent test correctly returns 404")


# ==================== PUSH NOTIFICATION LOGS ====================

class TestPushLogs:
    """Push notification logs tests"""
    
    def test_get_push_logs(self, api_client):
        """Test /api/push/logs returns delivery logs"""
        response = api_client.get(f"{BASE_URL}/api/push/logs?limit=20")
        assert response.status_code == 200
        
        data = response.json()
        assert "logs" in data
        assert "total" in data
        assert isinstance(data["logs"], list)
        
        print(f"Push logs: {data['total']} entries")


# ==================== SUBSCRIPTION MANAGEMENT ====================

class TestPushSubscriptions:
    """Push subscription management tests"""
    
    def test_subscribe_web_push(self, api_client):
        """Test subscribing to web push notifications"""
        subscription = {
            "user_id": "test_user",
            "subscription_type": "web_push",
            "endpoint": f"https://fcm.googleapis.com/fcm/send/{uuid.uuid4().hex}",
            "device_type": "web",
            "p256dh": "test_p256dh_key",
            "auth": "test_auth_key",
            "user_agent": "Mozilla/5.0 Test Browser"
        }
        
        response = api_client.post(f"{BASE_URL}/api/push/subscribe", json=subscription)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["subscription_type"] == "web_push"
        print(f"Web push subscription created for user: {subscription['user_id']}")
    
    def test_get_user_subscriptions(self, api_client):
        """Test getting user's push subscriptions"""
        user_id = "test_user"
        response = api_client.get(f"{BASE_URL}/api/push/subscriptions/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == user_id
        assert "subscriptions" in data
        assert "count" in data
        
        print(f"User {user_id} has {data['count']} subscriptions")
    
    def test_unsubscribe_push(self, api_client):
        """Test unsubscribing from push notifications"""
        user_id = "test_user"
        response = api_client.delete(f"{BASE_URL}/api/push/unsubscribe/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        print(f"Unsubscribed user {user_id}, deleted {data['deleted']} subscriptions")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
