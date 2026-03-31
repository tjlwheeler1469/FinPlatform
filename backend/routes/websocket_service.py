"""
WebSocket Service for Real-Time Notifications
Provides live updates for Enterprise Dashboard, Platform Sync, and Compliance Alerts
"""

import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSocket"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "adviceos")

async def get_db() -> dict:
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ============== CONNECTION MANAGER ==============

class ConnectionManager:
    """Manages WebSocket connections for different channels"""
    
    def __init__(self) -> dict:
        # Channel -> Set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {
            "enterprise": set(),      # Enterprise dashboard updates
            "platform_sync": set(),   # Platform sync status
            "compliance": set(),      # Compliance alerts
            "notifications": set(),   # General notifications
            "incidents": set(),       # Incident updates
            "breaches": set(),        # Breach alerts
        }
        self.connection_metadata: Dict[WebSocket, Dict] = {}
    
    async def connect(self, websocket: WebSocket, channel: str, user_id: Optional[str] = None) -> dict:
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)
        self.connection_metadata[websocket] = {
            "channel": channel,
            "user_id": user_id,
            "connected_at": datetime.now(timezone.utc).isoformat()
        }
        logger.info(f"WebSocket connected to channel: {channel}, total: {len(self.active_connections[channel])}")
    
    def disconnect(self, websocket: WebSocket, channel: str) -> dict:
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
        if websocket in self.connection_metadata:
            del self.connection_metadata[websocket]
        logger.info(f"WebSocket disconnected from channel: {channel}")
    
    async def broadcast(self, channel: str, message: Dict[str, Any]) -> dict:
        """Broadcast message to all connections in a channel"""
        if channel not in self.active_connections:
            return
        
        dead_connections = set()
        message_json = json.dumps(message)
        
        for connection in self.active_connections[channel]:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending to websocket: {e}")
                dead_connections.add(connection)
        
        # Clean up dead connections
        for conn in dead_connections:
            self.active_connections[channel].discard(conn)
            if conn in self.connection_metadata:
                del self.connection_metadata[conn]
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]) -> dict:
        """Send message to specific user across all their connections"""
        message_json = json.dumps(message)
        for ws, metadata in self.connection_metadata.items():
            if metadata.get("user_id") == user_id:
                try:
                    await ws.send_text(message_json)
                except Exception:
                    pass
    
    def get_stats(self) -> Dict[str, int]:
        """Get connection statistics"""
        return {channel: len(conns) for channel, conns in self.active_connections.items()}

# Global connection manager
manager = ConnectionManager()

# ============== EVENT TYPES ==============

class WebSocketEvent(BaseModel):
    event_type: str
    channel: str
    data: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    event_id: str = Field(default_factory=lambda: f"EVT-{uuid.uuid4().hex[:8].upper()}")

# ============== WEBSOCKET ENDPOINTS ==============

@router.websocket("/enterprise")
async def websocket_enterprise(websocket: WebSocket) -> dict:
    """WebSocket for Enterprise Dashboard real-time updates"""
    await manager.connect(websocket, "enterprise")
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "event_type": "connected",
            "channel": "enterprise",
            "message": "Connected to Enterprise Dashboard updates",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
            elif message.get("type") == "subscribe":
                # Handle subscription to specific event types
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, "enterprise")

@router.websocket("/platform-sync")
async def websocket_platform_sync(websocket: WebSocket) -> dict:
    """WebSocket for Platform Sync real-time updates"""
    await manager.connect(websocket, "platform_sync")
    try:
        await websocket.send_json({
            "event_type": "connected",
            "channel": "platform_sync",
            "message": "Connected to Platform Sync updates",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
            elif message.get("type") == "request_status":
                # Send current platform status
                from .platform_integrations import platform_connections, PLATFORM_CONFIGS
                status = []
                for platform_id, config in PLATFORM_CONFIGS.items():
                    conn = platform_connections.get(platform_id, {})
                    status.append({
                        "platform": platform_id,
                        "name": config["name"],
                        "status": conn.get("status", "disconnected"),
                        "last_sync": conn.get("last_sync"),
                        "clients_synced": conn.get("clients_synced", 0)
                    })
                await websocket.send_json({
                    "event_type": "platform_status",
                    "data": status,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, "platform_sync")

@router.websocket("/compliance")
async def websocket_compliance(websocket: WebSocket) -> dict:
    """WebSocket for Compliance alerts real-time"""
    await manager.connect(websocket, "compliance")
    try:
        await websocket.send_json({
            "event_type": "connected",
            "channel": "compliance",
            "message": "Connected to Compliance alerts",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, "compliance")

@router.websocket("/notifications")
async def websocket_notifications(websocket: WebSocket) -> dict:
    """WebSocket for general notifications"""
    await manager.connect(websocket, "notifications")
    try:
        await websocket.send_json({
            "event_type": "connected",
            "channel": "notifications",
            "message": "Connected to Notifications",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, "notifications")

# ============== BROADCAST FUNCTIONS (Called from other modules) ==============

async def broadcast_platform_sync_event(platform: str, event_type: str, data: Dict[str, Any]) -> dict:
    """Broadcast platform sync event to all connected clients"""
    await manager.broadcast("platform_sync", {
        "event_type": event_type,
        "platform": platform,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def broadcast_compliance_alert(alert_type: str, severity: str, data: Dict[str, Any]) -> dict:
    """Broadcast compliance alert to all connected clients"""
    await manager.broadcast("compliance", {
        "event_type": "compliance_alert",
        "alert_type": alert_type,
        "severity": severity,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def broadcast_breach_notification(breach_data: Dict[str, Any]) -> dict:
    """Broadcast breach notification"""
    await manager.broadcast("breaches", {
        "event_type": "new_breach",
        "data": breach_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    # Also send to compliance channel
    await manager.broadcast("compliance", {
        "event_type": "breach_alert",
        "data": breach_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def broadcast_incident_update(incident_data: Dict[str, Any], update_type: str = "new") -> dict:
    """Broadcast incident update"""
    await manager.broadcast("incidents", {
        "event_type": f"incident_{update_type}",
        "data": incident_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    # Also send to enterprise channel
    await manager.broadcast("enterprise", {
        "event_type": f"incident_{update_type}",
        "data": incident_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

async def broadcast_notification(notification_type: str, title: str, message: str, data: Optional[Dict] = None) -> dict:
    """Broadcast general notification"""
    await manager.broadcast("notifications", {
        "event_type": "notification",
        "notification_type": notification_type,
        "title": title,
        "message": message,
        "data": data or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

# ============== REST ENDPOINTS ==============

@router.get("/stats")
async def get_websocket_stats() -> dict:
    """Get WebSocket connection statistics"""
    return {
        "connections": manager.get_stats(),
        "total": sum(manager.get_stats().values()),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/broadcast/{channel}")
async def broadcast_to_channel(channel: str, event_type: str, data: Dict[str, Any]) -> dict:
    """Manually broadcast a message to a channel (for testing)"""
    if channel not in manager.active_connections:
        raise HTTPException(status_code=404, detail=f"Channel {channel} not found")
    
    await manager.broadcast(channel, {
        "event_type": event_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "status": "broadcast_sent",
        "channel": channel,
        "connections_reached": len(manager.active_connections.get(channel, set()))
    }

@router.post("/test-notification")
async def send_test_notification() -> dict:
    """Send a test notification to all channels"""
    test_message = {
        "event_type": "test",
        "message": "This is a test notification from AdviceOS",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    for channel in manager.active_connections.keys():
        await manager.broadcast(channel, test_message)
    
    return {
        "status": "test_sent",
        "channels": list(manager.active_connections.keys()),
        "stats": manager.get_stats()
    }
