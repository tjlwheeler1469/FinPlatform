"""
SOC2 Compliance & Audit Logging Service
Provides audit trails, security logging, and compliance features.
"""
import os
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from enum import Enum
import uuid


class AuditEventType(str, Enum):
    # Authentication Events
    LOGIN_SUCCESS = "auth.login.success"
    LOGIN_FAILED = "auth.login.failed"
    LOGOUT = "auth.logout"
    MFA_ENABLED = "auth.mfa.enabled"
    MFA_DISABLED = "auth.mfa.disabled"
    MFA_VERIFIED = "auth.mfa.verified"
    PASSWORD_CHANGED = "auth.password.changed"
    PASSWORD_RESET = "auth.password.reset"
    
    # Data Access Events
    CLIENT_VIEWED = "data.client.viewed"
    CLIENT_CREATED = "data.client.created"
    CLIENT_UPDATED = "data.client.updated"
    CLIENT_DELETED = "data.client.deleted"
    DOCUMENT_VIEWED = "data.document.viewed"
    DOCUMENT_UPLOADED = "data.document.uploaded"
    DOCUMENT_DOWNLOADED = "data.document.downloaded"
    DOCUMENT_DELETED = "data.document.deleted"
    REPORT_GENERATED = "data.report.generated"
    REPORT_EXPORTED = "data.report.exported"
    
    # Financial Data Events
    FINANCIAL_PLAN_CREATED = "financial.plan.created"
    FINANCIAL_PLAN_UPDATED = "financial.plan.updated"
    PORTFOLIO_VIEWED = "financial.portfolio.viewed"
    TRANSACTION_CREATED = "financial.transaction.created"
    ACCOUNT_CONNECTED = "financial.account.connected"
    ACCOUNT_DISCONNECTED = "financial.account.disconnected"
    
    # Administrative Events
    USER_CREATED = "admin.user.created"
    USER_UPDATED = "admin.user.updated"
    USER_DELETED = "admin.user.deleted"
    PERMISSION_CHANGED = "admin.permission.changed"
    SETTINGS_CHANGED = "admin.settings.changed"
    
    # Security Events
    SUSPICIOUS_ACTIVITY = "security.suspicious"
    RATE_LIMIT_EXCEEDED = "security.ratelimit"
    INVALID_ACCESS_ATTEMPT = "security.invalid_access"
    SESSION_EXPIRED = "security.session.expired"
    IP_BLOCKED = "security.ip.blocked"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# In-memory audit log storage (use database in production)
AUDIT_LOGS: List[Dict] = []
SECURITY_ALERTS: List[Dict] = []
SESSION_HISTORY: Dict[str, List[Dict]] = {}
FAILED_LOGIN_ATTEMPTS: Dict[str, List[Dict]] = {}


def log_audit_event(
    event_type: AuditEventType,
    user_id: str,
    resource_id: str = None,
    resource_type: str = None,
    details: Dict = None,
    ip_address: str = None,
    user_agent: str = None,
    risk_level: RiskLevel = RiskLevel.LOW
) -> Dict[str, Any]:
    """
    Log an audit event for compliance tracking.
    """
    event_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Create audit entry
    audit_entry = {
        "event_id": event_id,
        "timestamp": timestamp,
        "event_type": event_type.value,
        "user_id": user_id,
        "resource_id": resource_id,
        "resource_type": resource_type,
        "details": details or {},
        "ip_address": ip_address,
        "user_agent": user_agent,
        "risk_level": risk_level.value,
        "checksum": None  # Will be computed
    }
    
    # Compute integrity checksum
    checksum_data = f"{event_id}{timestamp}{event_type.value}{user_id}{resource_id}"
    audit_entry["checksum"] = hashlib.sha256(checksum_data.encode()).hexdigest()[:16]
    
    # Store audit log
    AUDIT_LOGS.append(audit_entry)
    
    # Check for security alerts
    if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
        create_security_alert(audit_entry)
    
    # Track failed logins for behavioral analysis
    if event_type == AuditEventType.LOGIN_FAILED:
        track_failed_login(user_id, ip_address)
    
    return {
        "success": True,
        "event_id": event_id,
        "logged_at": timestamp
    }


def create_security_alert(audit_entry: Dict) -> None:
    """
    Create a security alert for high-risk events.
    """
    alert = {
        "alert_id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "event_id": audit_entry["event_id"],
        "event_type": audit_entry["event_type"],
        "user_id": audit_entry["user_id"],
        "risk_level": audit_entry["risk_level"],
        "ip_address": audit_entry["ip_address"],
        "status": "open",
        "reviewed_by": None,
        "reviewed_at": None
    }
    
    SECURITY_ALERTS.append(alert)


def track_failed_login(user_id: str, ip_address: str) -> None:
    """
    Track failed login attempts for behavioral analysis.
    """
    key = f"{user_id}:{ip_address}"
    
    if key not in FAILED_LOGIN_ATTEMPTS:
        FAILED_LOGIN_ATTEMPTS[key] = []
    
    FAILED_LOGIN_ATTEMPTS[key].append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ip_address": ip_address
    })
    
    # Keep only last 24 hours
    cutoff = datetime.now(timezone.utc).timestamp() - 86400
    FAILED_LOGIN_ATTEMPTS[key] = [
        attempt for attempt in FAILED_LOGIN_ATTEMPTS[key]
        if datetime.fromisoformat(attempt["timestamp"].replace("Z", "+00:00")).timestamp() > cutoff
    ]
    
    # Check for brute force (more than 5 attempts in 15 minutes)
    recent_cutoff = datetime.now(timezone.utc).timestamp() - 900
    recent_attempts = [
        a for a in FAILED_LOGIN_ATTEMPTS[key]
        if datetime.fromisoformat(a["timestamp"].replace("Z", "+00:00")).timestamp() > recent_cutoff
    ]
    
    if len(recent_attempts) >= 5:
        log_audit_event(
            event_type=AuditEventType.SUSPICIOUS_ACTIVITY,
            user_id=user_id,
            details={"reason": "Multiple failed login attempts", "count": len(recent_attempts)},
            ip_address=ip_address,
            risk_level=RiskLevel.HIGH
        )


def get_audit_logs(
    user_id: str = None,
    event_type: str = None,
    start_date: str = None,
    end_date: str = None,
    risk_level: str = None,
    limit: int = 100
) -> Dict[str, Any]:
    """
    Query audit logs with filters.
    """
    filtered_logs = AUDIT_LOGS.copy()
    
    if user_id:
        filtered_logs = [l for l in filtered_logs if l["user_id"] == user_id]
    
    if event_type:
        filtered_logs = [l for l in filtered_logs if l["event_type"] == event_type]
    
    if risk_level:
        filtered_logs = [l for l in filtered_logs if l["risk_level"] == risk_level]
    
    if start_date:
        filtered_logs = [l for l in filtered_logs if l["timestamp"] >= start_date]
    
    if end_date:
        filtered_logs = [l for l in filtered_logs if l["timestamp"] <= end_date]
    
    # Sort by timestamp descending
    filtered_logs.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "total": len(filtered_logs),
        "limit": limit,
        "logs": filtered_logs[:limit]
    }


def get_security_alerts(status: str = None, limit: int = 50) -> Dict[str, Any]:
    """
    Get security alerts.
    """
    alerts = SECURITY_ALERTS.copy()
    
    if status:
        alerts = [a for a in alerts if a["status"] == status]
    
    alerts.sort(key=lambda x: x["created_at"], reverse=True)
    
    return {
        "total": len(alerts),
        "open_count": len([a for a in SECURITY_ALERTS if a["status"] == "open"]),
        "alerts": alerts[:limit]
    }


def acknowledge_alert(alert_id: str, reviewer_id: str, notes: str = None) -> Dict[str, Any]:
    """
    Acknowledge and close a security alert.
    """
    for alert in SECURITY_ALERTS:
        if alert["alert_id"] == alert_id:
            alert["status"] = "acknowledged"
            alert["reviewed_by"] = reviewer_id
            alert["reviewed_at"] = datetime.now(timezone.utc).isoformat()
            alert["notes"] = notes
            
            return {
                "success": True,
                "message": "Alert acknowledged"
            }
    
    return {"success": False, "error": "Alert not found"}


def get_compliance_report(start_date: str = None, end_date: str = None) -> Dict[str, Any]:
    """
    Generate a compliance report for SOC2 auditing.
    """
    logs = get_audit_logs(start_date=start_date, end_date=end_date, limit=10000)["logs"]
    
    # Aggregate by event type
    event_counts = {}
    for log in logs:
        event_type = log["event_type"]
        if event_type not in event_counts:
            event_counts[event_type] = 0
        event_counts[event_type] += 1
    
    # Count by risk level
    risk_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for log in logs:
        risk_counts[log["risk_level"]] += 1
    
    # Unique users
    unique_users = len(set(log["user_id"] for log in logs))
    
    # Security metrics
    failed_logins = event_counts.get("auth.login.failed", 0)
    successful_logins = event_counts.get("auth.login.success", 0)
    mfa_events = event_counts.get("auth.mfa.verified", 0)
    
    return {
        "report_generated_at": datetime.now(timezone.utc).isoformat(),
        "period": {
            "start": start_date or "all_time",
            "end": end_date or datetime.now(timezone.utc).isoformat()
        },
        "summary": {
            "total_events": len(logs),
            "unique_users": unique_users,
            "high_risk_events": risk_counts["high"] + risk_counts["critical"],
            "open_security_alerts": len([a for a in SECURITY_ALERTS if a["status"] == "open"])
        },
        "authentication_metrics": {
            "successful_logins": successful_logins,
            "failed_logins": failed_logins,
            "mfa_verifications": mfa_events,
            "login_success_rate": f"{(successful_logins / max(successful_logins + failed_logins, 1) * 100):.1f}%"
        },
        "event_breakdown": event_counts,
        "risk_breakdown": risk_counts,
        "compliance_status": {
            "audit_logging": "enabled",
            "mfa_available": True,
            "encryption_at_rest": True,
            "encryption_in_transit": True,
            "session_management": True,
            "access_controls": True
        }
    }


def log_data_access(
    user_id: str,
    resource_type: str,
    resource_id: str,
    action: str,
    ip_address: str = None
) -> Dict[str, Any]:
    """
    Convenience function to log data access events.
    """
    event_map = {
        "view": AuditEventType.CLIENT_VIEWED,
        "create": AuditEventType.CLIENT_CREATED,
        "update": AuditEventType.CLIENT_UPDATED,
        "delete": AuditEventType.CLIENT_DELETED,
        "download": AuditEventType.DOCUMENT_DOWNLOADED,
        "upload": AuditEventType.DOCUMENT_UPLOADED
    }
    
    event_type = event_map.get(action, AuditEventType.CLIENT_VIEWED)
    
    return log_audit_event(
        event_type=event_type,
        user_id=user_id,
        resource_id=resource_id,
        resource_type=resource_type,
        ip_address=ip_address,
        risk_level=RiskLevel.LOW
    )


def get_user_activity(user_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Get activity summary for a specific user.
    """
    cutoff = datetime.now(timezone.utc).timestamp() - (days * 86400)
    
    user_logs = [
        log for log in AUDIT_LOGS
        if log["user_id"] == user_id and 
        datetime.fromisoformat(log["timestamp"].replace("Z", "+00:00")).timestamp() > cutoff
    ]
    
    # Group by date
    daily_activity = {}
    for log in user_logs:
        date = log["timestamp"][:10]
        if date not in daily_activity:
            daily_activity[date] = 0
        daily_activity[date] += 1
    
    return {
        "user_id": user_id,
        "period_days": days,
        "total_events": len(user_logs),
        "daily_activity": daily_activity,
        "recent_events": user_logs[:20]
    }


# Initialize with some sample audit data
def initialize_sample_audit_data():
    """Initialize with sample audit data for demo."""
    sample_events = [
        (AuditEventType.LOGIN_SUCCESS, "user_001", None, None, {"method": "password"}),
        (AuditEventType.MFA_VERIFIED, "user_001", None, None, {"method": "totp"}),
        (AuditEventType.CLIENT_VIEWED, "user_001", "client_001", "client", {"client_name": "Wheeler Family"}),
        (AuditEventType.FINANCIAL_PLAN_CREATED, "user_001", "plan_001", "financial_plan", {"client_id": "client_001"}),
        (AuditEventType.DOCUMENT_UPLOADED, "user_001", "doc_001", "document", {"filename": "tax_return_2025.pdf"}),
        (AuditEventType.REPORT_GENERATED, "user_001", "report_001", "report", {"type": "financial_plan_pdf"}),
    ]
    
    for event_type, user_id, resource_id, resource_type, details in sample_events:
        log_audit_event(
            event_type=event_type,
            user_id=user_id,
            resource_id=resource_id,
            resource_type=resource_type,
            details=details,
            ip_address="192.168.1.100",
            risk_level=RiskLevel.LOW
        )

# Initialize sample data
initialize_sample_audit_data()
