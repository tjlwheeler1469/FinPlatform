"""
Real-time Advisor-Client Collaboration
WebSocket-based real-time communication for collaborative financial planning
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/collaboration", tags=["Real-time Collaboration"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db() -> dict:
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ==================== CONNECTION MANAGER ====================

class ConnectionManager:
    """Manages WebSocket connections for real-time collaboration."""
    
    def __init__(self) -> dict:
        # session_id -> list of websockets
        self._active_connections: Dict[str, List[WebSocket]] = {}
        # websocket -> user info
        self._user_info: Dict[WebSocket, Dict[str, Any]] = {}
        # session_id -> session state
        self._session_state: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str, user_info: Dict[str, Any]) -> dict:
        """Connect a user to a collaboration session."""
        await websocket.accept()
        
        if session_id not in self._active_connections:
            self._active_connections[session_id] = []
            self._session_state[session_id] = {
                "created_at": datetime.now(timezone.utc).isoformat(),
                "participants": [],
                "current_view": "confidence",
                "shared_inputs": {},
                "chat_history": [],
                "cursor_positions": {}
            }
        
        self._active_connections[session_id].append(websocket)
        self._user_info[websocket] = {**user_info, "session_id": session_id}
        
        # Add to participants
        self._session_state[session_id]["participants"].append({
            "user_id": user_info.get("user_id"),
            "name": user_info.get("name"),
            "role": user_info.get("role"),
            "joined_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Notify others
        await self.broadcast(session_id, {
            "type": "user_joined",
            "user": user_info,
            "participants": self._session_state[session_id]["participants"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, exclude=websocket)
        
        # Send current state to new user
        await websocket.send_json({
            "type": "session_state",
            "state": self._session_state[session_id]
        })
        
        logger.info(f"User {user_info.get('name')} joined session {session_id}")
    
    def disconnect(self, websocket: WebSocket) -> dict:
        """Disconnect a user from their session."""
        user_info = self._user_info.get(websocket)
        if not user_info:
            return
        
        session_id = user_info.get("session_id")
        if session_id and session_id in self._active_connections:
            self._active_connections[session_id].remove(websocket)
            
            # Remove from participants
            self._session_state[session_id]["participants"] = [
                p for p in self._session_state[session_id]["participants"]
                if p.get("user_id") != user_info.get("user_id")
            ]
            
            # Clean up empty sessions
            if not self._active_connections[session_id]:
                del self._active_connections[session_id]
                del self._session_state[session_id]
        
        if websocket in self._user_info:
            del self._user_info[websocket]
        
        logger.info(f"User {user_info.get('name')} left session {session_id}")
    
    async def broadcast(self, session_id: str, message: Dict[str, Any], exclude: WebSocket = None) -> dict:
        """Broadcast message to all users in a session."""
        if session_id not in self._active_connections:
            return
        
        for connection in self._active_connections[session_id]:
            if connection != exclude:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message: {e}")
    
    async def send_to_user(self, session_id: str, user_id: str, message: Dict[str, Any]) -> dict:
        """Send message to specific user."""
        if session_id not in self._active_connections:
            return
        
        for connection in self._active_connections[session_id]:
            if self._user_info.get(connection, {}).get("user_id") == user_id:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send message to user: {e}")
    
    def update_session_state(self, session_id: str, key: str, value: Any) -> dict:
        """Update session state."""
        if session_id in self._session_state:
            self._session_state[session_id][key] = value
    
    def get_session_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get current session state."""
        return self._session_state.get(session_id)
    
    def get_active_sessions(self) -> List[Dict[str, Any]]:
        """Get list of active collaboration sessions."""
        return [
            {
                "session_id": sid,
                "participant_count": len(connections),
                "participants": self._session_state.get(sid, {}).get("participants", [])
            }
            for sid, connections in self._active_connections.items()
        ]


# Global connection manager
manager = ConnectionManager()


# ==================== MODELS ====================

class CreateSessionRequest(BaseModel):
    client_id: str
    advisor_id: str
    advisor_name: str
    client_name: str
    session_type: str = "planning"  # planning, review, emergency


class ChatMessage(BaseModel):
    sender_id: str
    sender_name: str
    message: str
    message_type: str = "text"  # text, suggestion, question, action


# ==================== REST API ENDPOINTS ====================

@router.post("/sessions/create")
async def create_collaboration_session(request: CreateSessionRequest) -> dict:
    """Create a new collaboration session."""
    db = await get_db()
    
    session_id = str(uuid.uuid4())[:8]  # Short ID for easy sharing
    
    session = {
        "session_id": session_id,
        "client_id": request.client_id,
        "advisor_id": request.advisor_id,
        "advisor_name": request.advisor_name,
        "client_name": request.client_name,
        "session_type": request.session_type,
        "status": "active",
        "created_at": datetime.now(timezone.utc),
        "join_url": f"/confidence-engine?session={session_id}"
    }
    
    await db.collaboration_sessions.insert_one(session)
    
    return {
        "session_id": session_id,
        "join_url": session["join_url"],
        "message": "Share this session ID with your client to start collaborating"
    }


@router.get("/sessions/{session_id}")
async def get_session_info(session_id: str) -> dict:
    """Get session information."""
    db = await get_db()
    
    session = await db.collaboration_sessions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add real-time info
    live_state = manager.get_session_state(session_id)
    if live_state:
        session["live_participants"] = live_state.get("participants", [])
        session["is_live"] = True
    else:
        session["is_live"] = False
    
    return session


@router.get("/sessions")
async def list_active_sessions(advisor_id: Optional[str] = None) -> dict:
    """List active collaboration sessions."""
    db = await get_db()
    
    query = {"status": "active"}
    if advisor_id:
        query["advisor_id"] = advisor_id
    
    cursor = db.collaboration_sessions.find(query, {"_id": 0}).sort("created_at", -1).limit(20)
    sessions = await cursor.to_list(length=20)
    
    # Add live info
    active_sessions = manager.get_active_sessions()
    active_ids = {s["session_id"] for s in active_sessions}
    
    for session in sessions:
        session["is_live"] = session["session_id"] in active_ids
    
    return {"sessions": sessions}


@router.post("/sessions/{session_id}/end")
async def end_session(session_id: str) -> dict:
    """End a collaboration session."""
    db = await get_db()
    
    result = await db.collaboration_sessions.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "status": "ended",
                "ended_at": datetime.now(timezone.utc)
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Notify all participants
    await manager.broadcast(session_id, {
        "type": "session_ended",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "message": "Session ended"}


# ==================== WEBSOCKET ENDPOINT ====================

@router.websocket("/ws/{session_id}")
async def collaboration_websocket(
    websocket: WebSocket,
    session_id: str,
    user_id: str = Query(...),
    name: str = Query(...),
    role: str = Query(default="client")  # advisor or client
):
    """WebSocket endpoint for real-time collaboration."""
    
    user_info = {
        "user_id": user_id,
        "name": name,
        "role": role
    }
    
    await manager.connect(websocket, session_id, user_info)
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "input_change":
                # User changed an input value
                field = data.get("field")
                value = data.get("value")
                
                # Update session state
                session_state = manager.get_session_state(session_id)
                if session_state:
                    if "shared_inputs" not in session_state:
                        session_state["shared_inputs"] = {}
                    session_state["shared_inputs"][field] = value
                
                # Broadcast to others
                await manager.broadcast(session_id, {
                    "type": "input_changed",
                    "field": field,
                    "value": value,
                    "changed_by": name,
                    "role": role,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }, exclude=websocket)
            
            elif message_type == "cursor_move":
                # Track cursor position for collaborative editing
                await manager.broadcast(session_id, {
                    "type": "cursor_update",
                    "user_id": user_id,
                    "name": name,
                    "position": data.get("position"),
                    "element": data.get("element")
                }, exclude=websocket)
            
            elif message_type == "chat":
                # Chat message
                chat_msg = {
                    "id": str(uuid.uuid4()),
                    "sender_id": user_id,
                    "sender_name": name,
                    "role": role,
                    "message": data.get("message"),
                    "message_type": data.get("message_type", "text"),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                
                # Store in session state
                session_state = manager.get_session_state(session_id)
                if session_state:
                    session_state.setdefault("chat_history", []).append(chat_msg)
                
                # Broadcast
                await manager.broadcast(session_id, {
                    "type": "chat_message",
                    **chat_msg
                })
            
            elif message_type == "view_change":
                # User navigated to different tab/view
                await manager.broadcast(session_id, {
                    "type": "view_changed",
                    "view": data.get("view"),
                    "changed_by": name,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }, exclude=websocket)
            
            elif message_type == "highlight":
                # User highlighted something to show others
                await manager.broadcast(session_id, {
                    "type": "highlight",
                    "element": data.get("element"),
                    "message": data.get("message"),
                    "highlighted_by": name,
                    "role": role,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }, exclude=websocket)
            
            elif message_type == "action_suggestion":
                # Advisor suggesting an action
                await manager.broadcast(session_id, {
                    "type": "action_suggested",
                    "action": data.get("action"),
                    "parameters": data.get("parameters"),
                    "suggested_by": name,
                    "role": role,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            elif message_type == "screen_share_start":
                await manager.broadcast(session_id, {
                    "type": "screen_share_started",
                    "sharer": name,
                    "role": role
                }, exclude=websocket)
            
            elif message_type == "screen_share_stop":
                await manager.broadcast(session_id, {
                    "type": "screen_share_stopped",
                    "sharer": name
                }, exclude=websocket)
            
            elif message_type == "ping":
                # Keep alive
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(session_id, {
            "type": "user_left",
            "user": user_info,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ==================== COLLABORATION FEATURES ====================

@router.post("/sessions/{session_id}/snapshot")
async def save_session_snapshot(session_id: str) -> dict:
    """Save current session state as a snapshot."""
    db = await get_db()
    
    state = manager.get_session_state(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="No active session found")
    
    snapshot = {
        "session_id": session_id,
        "snapshot_id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc),
        "state": state
    }
    
    await db.session_snapshots.insert_one(snapshot)
    
    return {
        "snapshot_id": snapshot["snapshot_id"],
        "message": "Session snapshot saved"
    }


@router.get("/sessions/{session_id}/chat-history")
async def get_chat_history(session_id: str) -> dict:
    """Get chat history for a session."""
    state = manager.get_session_state(session_id)
    
    if state:
        return {"chat_history": state.get("chat_history", [])}
    
    # Try to get from database for ended sessions
    db = await get_db()
    session = await db.collaboration_sessions.find_one(
        {"session_id": session_id},
        {"_id": 0, "chat_history": 1}
    )
    
    return {"chat_history": session.get("chat_history", []) if session else []}
