"""
AdviceOS Event Streaming Layer
==============================
Real-time event bus for:
- Audit events
- Compliance triggers
- Incident notifications
- System monitoring
- WebSocket push to dashboards

Note: This is an in-process event bus. For production at scale,
integrate with Kafka/Kinesis via the integration hooks provided.
"""

import os
import uuid
import asyncio
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Callable
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["Event Streaming"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
event_stream_col = db["event_stream"]
event_subscriptions_col = db["event_subscriptions"]
event_rules_col = db["event_rules"]

# ==================== IN-MEMORY EVENT BUS ====================

class EventBus:
    """In-process event bus for real-time event distribution."""
    
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = defaultdict(list)
        self.websocket_clients: Dict[str, List[WebSocket]] = defaultdict(list)
        self.event_history: List[Dict[str, Any]] = []
        self.max_history = 1000
    
    def subscribe(self, event_type: str, callback: Callable):
        """Subscribe to an event type."""
        self.subscribers[event_type].append(callback)
    
    def unsubscribe(self, event_type: str, callback: Callable):
        """Unsubscribe from an event type."""
        if callback in self.subscribers[event_type]:
            self.subscribers[event_type].remove(callback)
    
    async def publish(self, event_type: str, payload: Dict[str, Any], source: str = "system"):
        """Publish an event to all subscribers."""
        event = {
            "id": f"evt_{uuid.uuid4().hex[:12]}",
            "type": event_type,
            "payload": payload,
            "source": source,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Store in history
        self.event_history.append(event)
        if len(self.event_history) > self.max_history:
            self.event_history = self.event_history[-self.max_history:]
        
        # Notify callback subscribers
        for callback in self.subscribers.get(event_type, []):
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event)
                else:
                    callback(event)
            except Exception as e:
                logger.error(f"Event subscriber error: {e}")
        
        # Notify wildcard subscribers
        for callback in self.subscribers.get("*", []):
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event)
                else:
                    callback(event)
            except Exception as e:
                logger.error(f"Event subscriber error: {e}")
        
        # Push to WebSocket clients
        await self._push_to_websockets(event_type, event)
        
        return event
    
    async def _push_to_websockets(self, event_type: str, event: Dict[str, Any]):
        """Push event to connected WebSocket clients."""
        # Push to specific event type subscribers
        for ws in self.websocket_clients.get(event_type, []):
            try:
                await ws.send_json(event)
            except Exception as e:
                logger.warning(f"WebSocket send failed: {e}")
        
        # Push to wildcard subscribers
        for ws in self.websocket_clients.get("*", []):
            try:
                await ws.send_json(event)
            except Exception as e:
                logger.warning(f"WebSocket send failed: {e}")
    
    def add_websocket(self, event_type: str, ws: WebSocket):
        """Add a WebSocket client for event type."""
        self.websocket_clients[event_type].append(ws)
    
    def remove_websocket(self, event_type: str, ws: WebSocket):
        """Remove a WebSocket client."""
        if ws in self.websocket_clients[event_type]:
            self.websocket_clients[event_type].remove(ws)
    
    def get_recent_events(self, event_type: Optional[str] = None, limit: int = 100) -> List[Dict]:
        """Get recent events from history."""
        events = self.event_history
        if event_type:
            events = [e for e in events if e["type"] == event_type]
        return events[-limit:]


# Global event bus instance
event_bus = EventBus()

# ==================== EVENT TYPES ====================

EVENT_TYPES = {
    "audit.created": {
        "description": "New audit log entry created",
        "severity": "info",
        "category": "audit"
    },
    "audit.chain_verified": {
        "description": "Audit chain integrity verified",
        "severity": "info",
        "category": "audit"
    },
    "audit.tamper_detected": {
        "description": "Potential tampering detected in audit chain",
        "severity": "critical",
        "category": "security"
    },
    "compliance.check_passed": {
        "description": "Compliance check passed",
        "severity": "info",
        "category": "compliance"
    },
    "compliance.check_failed": {
        "description": "Compliance check failed",
        "severity": "warning",
        "category": "compliance"
    },
    "compliance.breach_detected": {
        "description": "Compliance breach detected",
        "severity": "high",
        "category": "compliance"
    },
    "compliance.override": {
        "description": "Adviser override of compliance warning",
        "severity": "warning",
        "category": "compliance"
    },
    "security.login": {
        "description": "User login event",
        "severity": "info",
        "category": "security"
    },
    "security.failed_login": {
        "description": "Failed login attempt",
        "severity": "warning",
        "category": "security"
    },
    "security.permission_denied": {
        "description": "Permission denied event",
        "severity": "warning",
        "category": "security"
    },
    "security.suspicious_activity": {
        "description": "Suspicious activity detected",
        "severity": "high",
        "category": "security"
    },
    "incident.created": {
        "description": "New incident created",
        "severity": "warning",
        "category": "incident"
    },
    "incident.escalated": {
        "description": "Incident escalated",
        "severity": "high",
        "category": "incident"
    },
    "incident.resolved": {
        "description": "Incident resolved",
        "severity": "info",
        "category": "incident"
    },
    "scenario.generated": {
        "description": "New scenario generated",
        "severity": "info",
        "category": "workflow"
    },
    "decision.recorded": {
        "description": "Adviser decision recorded",
        "severity": "info",
        "category": "workflow"
    },
    "system.health_check": {
        "description": "System health check",
        "severity": "info",
        "category": "system"
    },
    "system.error": {
        "description": "System error occurred",
        "severity": "high",
        "category": "system"
    }
}

# ==================== MODELS ====================

class PublishEvent(BaseModel):
    event_type: str
    payload: Dict[str, Any]
    source: str = "api"
    licensee_id: str = "lic_default"

class EventRule(BaseModel):
    name: str
    event_type: str
    condition: Dict[str, Any]  # e.g., {"severity": "critical", "category": "security"}
    actions: List[str]  # e.g., ["notify_email", "create_incident", "escalate"]
    enabled: bool = True
    licensee_id: str = "lic_default"

# ==================== API ENDPOINTS ====================

@router.get("/types")
async def list_event_types():
    """List all available event types."""
    return {
        "event_types": EVENT_TYPES,
        "categories": list(set(e["category"] for e in EVENT_TYPES.values()))
    }

@router.post("/publish")
async def publish_event(event: PublishEvent):
    """Publish an event to the event bus."""
    if event.event_type not in EVENT_TYPES and not event.event_type.startswith("custom."):
        raise HTTPException(
            status_code=400,
            detail=f"Unknown event type. Use one of: {list(EVENT_TYPES.keys())} or prefix with 'custom.'"
        )
    
    # Add licensee to payload
    event.payload["licensee_id"] = event.licensee_id
    
    # Publish to bus
    published = await event_bus.publish(event.event_type, event.payload, event.source)
    
    # Persist to database
    await event_stream_col.insert_one({
        **published,
        "licensee_id": event.licensee_id,
        "persisted_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "event_id": published["id"],
        "event_type": event.event_type,
        "timestamp": published["timestamp"]
    }

@router.get("/stream")
async def get_event_stream(
    event_type: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    licensee_id: str = "lic_default",
    limit: int = 100
):
    """Get recent events from the stream."""
    query = {"licensee_id": licensee_id}
    
    if event_type:
        query["type"] = event_type
    if category:
        query["type"] = {"$regex": f"^{category}\\."}
    
    events = await event_stream_col.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return {
        "events": events,
        "count": len(events)
    }

@router.get("/stream/live")
async def get_live_events(limit: int = 50, event_type: Optional[str] = None):
    """Get live events from in-memory buffer."""
    events = event_bus.get_recent_events(event_type, limit)
    return {
        "events": events,
        "count": len(events),
        "source": "memory"
    }

@router.websocket("/ws/{event_type}")
async def websocket_events(websocket: WebSocket, event_type: str):
    """WebSocket endpoint for real-time event streaming."""
    await websocket.accept()
    
    # Add to subscribers
    event_bus.add_websocket(event_type, websocket)
    
    try:
        # Send initial connection message
        await websocket.send_json({
            "type": "connected",
            "subscribed_to": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Keep connection alive
        while True:
            # Wait for any client messages (ping/pong)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send heartbeat
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
    except WebSocketDisconnect:
        pass
    finally:
        event_bus.remove_websocket(event_type, websocket)

@router.post("/rules")
async def create_event_rule(rule: EventRule):
    """Create an event processing rule."""
    rule_id = f"rule_{uuid.uuid4().hex[:8]}"
    
    rule_doc = {
        "id": rule_id,
        "name": rule.name,
        "event_type": rule.event_type,
        "condition": rule.condition,
        "actions": rule.actions,
        "enabled": rule.enabled,
        "licensee_id": rule.licensee_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "triggered_count": 0
    }
    
    await event_rules_col.insert_one(rule_doc)
    
    return {
        "success": True,
        "rule_id": rule_id,
        "event_type": rule.event_type
    }

@router.get("/rules")
async def list_event_rules(licensee_id: str = "lic_default"):
    """List event processing rules."""
    rules = await event_rules_col.find(
        {"licensee_id": licensee_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"rules": rules, "count": len(rules)}

@router.get("/dashboard/metrics")
async def event_metrics(licensee_id: str = "lic_default"):
    """Get event stream metrics."""
    now = datetime.now(timezone.utc)
    hour_ago = (now - timedelta(hours=1)).isoformat()
    day_ago = (now - timedelta(days=1)).isoformat()
    
    # Hourly events
    hourly_count = await event_stream_col.count_documents({
        "licensee_id": licensee_id,
        "timestamp": {"$gte": hour_ago}
    })
    
    # Daily events by type
    pipeline = [
        {"$match": {"licensee_id": licensee_id, "timestamp": {"$gte": day_ago}}},
        {"$group": {"_id": "$type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_type = await event_stream_col.aggregate(pipeline).to_list(20)
    
    # Critical events
    critical_events = await event_stream_col.count_documents({
        "licensee_id": licensee_id,
        "timestamp": {"$gte": day_ago},
        "type": {"$in": ["audit.tamper_detected", "compliance.breach_detected", "security.suspicious_activity", "incident.created"]}
    })
    
    return {
        "metrics": {
            "events_last_hour": hourly_count,
            "events_per_minute": round(hourly_count / 60, 2),
            "critical_events_24h": critical_events,
            "by_type": {item["_id"]: item["count"] for item in by_type}
        },
        "websocket_clients": {
            event_type: len(clients) 
            for event_type, clients in event_bus.websocket_clients.items()
        },
        "memory_buffer_size": len(event_bus.event_history),
        "generated_at": now.isoformat()
    }

# ==================== HELPER FUNCTIONS FOR OTHER MODULES ====================

async def emit_audit_event(event_type: str, payload: Dict[str, Any]):
    """Helper to emit audit events from other modules."""
    await event_bus.publish(f"audit.{event_type}", payload, "audit_service")

async def emit_compliance_event(event_type: str, payload: Dict[str, Any]):
    """Helper to emit compliance events from other modules."""
    await event_bus.publish(f"compliance.{event_type}", payload, "compliance_engine")

async def emit_security_event(event_type: str, payload: Dict[str, Any]):
    """Helper to emit security events from other modules."""
    await event_bus.publish(f"security.{event_type}", payload, "security_service")

async def emit_incident_event(event_type: str, payload: Dict[str, Any]):
    """Helper to emit incident events from other modules."""
    await event_bus.publish(f"incident.{event_type}", payload, "incident_management")
