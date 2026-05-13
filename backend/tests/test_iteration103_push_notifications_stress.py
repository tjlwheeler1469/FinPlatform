"""
Test Suite for Iteration 103: Push Notifications & Stress Testing
Tests:
- Push Notification System (in-app, desktop, mobile push, email/SMS integration)
- Stress Testing Module (20,000 concurrent users simulation)
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPushNotificationStatus:
    """Push Notification Service Status Tests"""
    
    def test_push_status_endpoint(self):
        """Test /api/push/status returns operational status"""
        response = requests.get(f"{BASE_URL}/api/push/status")
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


class TestPushNotificationCRUD:
    """Push Notification CRUD Operations Tests"""
    
    def test_get_user_notifications_empty(self):
        """Test /api/push/notifications/{user_id} returns notifications list"""
        user_id = "test_user_103"
        response = requests.get(f"{BASE_URL}/api/push/notifications/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "notifications" in data
        assert "total" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)
        print(f"User {user_id} has {data['total']} notifications, {data['unread_count']} unread")
    
    def test_send_notification(self):
        """Test /api/push/send creates and stores notification"""
        user_id = "test_user_103"
        notification_data = {
            "user_id": user_id,
            "title": "Test Notification",
            "message": "This is a test notification from iteration 103",
            "notification_type": "info",
            "priority": "normal",
            "category": "general"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/send",
            json=notification_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert "notification_id" in data
        assert data["notification_id"].startswith("NOTIF-")
        print(f"Created notification: {data['notification_id']}")
        
        # Verify notification was stored
        get_response = requests.get(f"{BASE_URL}/api/push/notifications/{user_id}")
        assert get_response.status_code == 200
        notifications = get_response.json()["notifications"]
        assert any(n["notification_id"] == data["notification_id"] for n in notifications)
        print(f"Verified notification {data['notification_id']} is stored")
    
    def test_send_notification_with_action(self):
        """Test sending notification with action URL"""
        user_id = "test_user_103"
        notification_data = {
            "user_id": user_id,
            "title": "Compliance Alert",
            "message": "New breach detected requiring review",
            "notification_type": "breach",
            "priority": "urgent",
            "category": "compliance",
            "action_url": "/breach-register",
            "action_label": "View Breach"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/send",
            json=notification_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        print(f"Created urgent breach notification: {data['notification_id']}")


class TestNotificationPreferences:
    """Notification Preferences Tests"""
    
    def test_save_preferences(self):
        """Test /api/push/preferences saves user preferences"""
        user_id = "test_user_103"
        preferences = {
            "user_id": user_id,
            "in_app_enabled": True,
            "desktop_push_enabled": True,
            "mobile_push_enabled": False,
            "email_enabled": True,
            "sms_enabled": False,
            "categories": {
                "compliance": True,
                "platform_sync": True,
                "portfolio": True,
                "meeting": True,
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
        
        response = requests.post(
            f"{BASE_URL}/api/push/preferences",
            json=preferences
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        print(f"Saved preferences for user {user_id}")
    
    def test_get_preferences(self):
        """Test /api/push/preferences/{user_id} returns preferences"""
        user_id = "test_user_103"
        response = requests.get(f"{BASE_URL}/api/push/preferences/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert "in_app_enabled" in data
        assert "categories" in data
        print(f"Retrieved preferences for user {user_id}: in_app={data['in_app_enabled']}")


class TestDemoAndTestEndpoints:
    """Demo and Test Notification Endpoints"""
    
    def test_seed_demo_notifications(self):
        """Test /api/push/demo/seed-notifications creates demo data"""
        user_id = "demo_user"
        response = requests.post(
            f"{BASE_URL}/api/push/demo/seed-notifications?user_id={user_id}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert data["notifications_created"] == 5  # 5 demo notifications
        assert len(data["notification_ids"]) == 5
        print(f"Seeded {data['notifications_created']} demo notifications for {user_id}")
    
    def test_send_all_channels(self):
        """Test /api/push/test/send-all sends through all channels"""
        user_id = "test_user_103"
        response = requests.post(
            f"{BASE_URL}/api/push/test/send-all?user_id={user_id}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert "notification_id" in data
        assert "channels" in data
        assert "in_app" in data["channels"]
        assert "websocket" in data["channels"]
        print(f"Test notification sent through channels: {data['channels']}")


class TestBreachTrigger:
    """Breach Alert Trigger Tests"""
    
    def test_trigger_breach_notification(self):
        """Test /api/push/trigger/breach sends breach alerts"""
        response = requests.post(
            f"{BASE_URL}/api/push/trigger/breach",
            params={
                "breach_id": "BREACH-TEST-103",
                "breach_type": "Risk Profile Violation",
                "severity": "high",
                "adviser_id": "test_adviser_103",
                "description": "Client allocation exceeds risk tolerance by 15%"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        print("Breach notification triggered for BREACH-TEST-103")


class TestNotificationManagement:
    """Notification Management Tests (mark read, dismiss)"""
    
    def test_mark_notification_read(self):
        """Test marking a notification as read"""
        # First create a notification
        user_id = "test_user_103"
        create_response = requests.post(
            f"{BASE_URL}/api/push/send",
            json={
                "user_id": user_id,
                "title": "Read Test",
                "message": "Testing mark as read",
                "notification_type": "info",
                "priority": "normal",
                "category": "general"
            }
        )
        notification_id = create_response.json()["notification_id"]
        
        # Mark as read
        response = requests.put(
            f"{BASE_URL}/api/push/notifications/{notification_id}/read"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        print(f"Marked notification {notification_id} as read")
    
    def test_mark_all_read(self):
        """Test marking all notifications as read for a user"""
        user_id = "test_user_103"
        response = requests.put(
            f"{BASE_URL}/api/push/notifications/{user_id}/read-all"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        print(f"Marked all notifications as read for {user_id}, count: {data.get('marked_read', 0)}")


class TestStressTestSystemMetrics:
    """Stress Testing System Metrics Tests"""
    
    def test_system_metrics(self):
        """Test /api/stress-test/system/metrics returns CPU/Memory/Disk"""
        response = requests.get(f"{BASE_URL}/api/stress-test/system/metrics")
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
    
    def test_capacity_estimate(self):
        """Test /api/stress-test/system/capacity-estimate returns user capacity"""
        response = requests.get(f"{BASE_URL}/api/stress-test/system/capacity-estimate")
        assert response.status_code == 200
        
        data = response.json()
        assert "estimated_max_concurrent_users" in data
        assert "limiting_factor" in data
        assert "cpu_headroom_percent" in data
        assert "memory_headroom_mb" in data
        assert "recommendations" in data
        assert isinstance(data["recommendations"], list)
        
        print(f"Capacity estimate: {data['estimated_max_concurrent_users']} users, limited by {data['limiting_factor']}")


class TestStressTestHistory:
    """Stress Test History Tests"""
    
    def test_get_test_history(self):
        """Test /api/stress-test/history returns test history"""
        response = requests.get(f"{BASE_URL}/api/stress-test/history?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "tests" in data
        assert "total" in data
        assert isinstance(data["tests"], list)
        print(f"Test history: {data['total']} tests found")


class TestQuickStressTests:
    """Quick Stress Test Presets"""
    
    def test_quick_light_test(self):
        """Test /api/stress-test/quick/light runs a 100 user test"""
        response = requests.post(f"{BASE_URL}/api/stress-test/quick/light")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert "test_id" in data
        assert data["test_id"].startswith("STRESS-")
        assert data["config"]["concurrent_users"] == 100
        assert data["config"]["duration_seconds"] == 30
        print(f"Started light stress test: {data['test_id']}")
        
        # Wait a moment and check status
        time.sleep(2)
        status_response = requests.get(f"{BASE_URL}/api/stress-test/status/{data['test_id']}")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["status"] in ["starting", "running", "completed"]
        print(f"Test status: {status_data['status']}")


class TestNotificationFlood:
    """Notification Flood Test"""
    
    def test_notification_flood(self):
        """Test /api/stress-test/notifications/flood creates 10,000 notifications"""
        # Use smaller numbers for testing to avoid timeout
        response = requests.post(
            f"{BASE_URL}/api/stress-test/notifications/flood?user_count=100&notifications_per_user=10"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "test_id" in data
        assert data["test_id"].startswith("NOTIF-FLOOD-")
        assert "notifications_created" in data
        assert "throughput_per_second" in data
        assert data["notifications_created"] == 1000  # 100 users * 10 notifications
        
        print(f"Notification flood: {data['notifications_created']} created at {data['throughput_per_second']:.0f}/sec")


class TestPushSubscriptions:
    """Push Subscription Management Tests"""
    
    def test_subscribe_web_push(self):
        """Test subscribing to web push notifications"""
        subscription_data = {
            "user_id": "test_user_103",
            "subscription_type": "web_push",
            "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-103",
            "device_type": "web",
            "p256dh": "test-p256dh-key",
            "auth": "test-auth-key",
            "user_agent": "Mozilla/5.0 Test Browser"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json=subscription_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"]
        assert data["subscription_type"] == "web_push"
        print("Subscribed to web push for user test_user_103")
    
    def test_get_user_subscriptions(self):
        """Test getting user's push subscriptions"""
        user_id = "test_user_103"
        response = requests.get(f"{BASE_URL}/api/push/subscriptions/{user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert "subscriptions" in data
        assert "count" in data
        print(f"User {user_id} has {data['count']} subscriptions")


class TestPushLogs:
    """Push Notification Logs Tests"""
    
    def test_get_push_logs(self):
        """Test getting push notification delivery logs"""
        response = requests.get(f"{BASE_URL}/api/push/logs?limit=20")
        assert response.status_code == 200
        
        data = response.json()
        assert "logs" in data
        assert "total" in data
        assert isinstance(data["logs"], list)
        print(f"Push logs: {data['total']} entries")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
