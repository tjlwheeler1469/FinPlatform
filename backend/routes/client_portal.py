"""
Client Portal Authentication & Features
Separate authentication and features for client-facing portal.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
import uuid
import hashlib
import logging
import jwt
import os

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/client-portal", tags=["Client Portal"])

# JWT settings for client portal (separate from adviser)
CLIENT_JWT_SECRET = os.environ.get("JWT_SECRET", "halcyon_client_portal_secret_key_2025")
CLIENT_JWT_ALGORITHM = "HS256"
CLIENT_JWT_EXPIRY_HOURS = 24

# In-memory storage for demo
CLIENT_USERS: Dict[str, Dict] = {
    "client_wheeler@email.com": {
        "id": "cuser_001",
        "email": "client_wheeler@email.com",
        "password_hash": hashlib.sha256("wheeler2025".encode()).hexdigest(),
        "name": "James Wheeler",
        "linked_client_id": "client_1",
        "adviser_id": "adviser_001",
        "created_at": "2024-01-15T00:00:00Z",
        "last_login": None,
        "portal_access": True,
        "permissions": ["view_portfolio", "view_documents", "view_goals", "message_adviser"]
    },
    "client_chen@email.com": {
        "id": "cuser_002",
        "email": "client_chen@email.com",
        "password_hash": hashlib.sha256("chen2025".encode()).hexdigest(),
        "name": "Michael Chen",
        "linked_client_id": "client_2",
        "adviser_id": "adviser_001",
        "created_at": "2024-02-20T00:00:00Z",
        "last_login": None,
        "portal_access": True,
        "permissions": ["view_portfolio", "view_documents", "view_goals", "message_adviser"]
    }
}

CLIENT_SESSIONS: Dict[str, Dict] = {}


class ClientLoginRequest(BaseModel):
    email: str
    password: str


class ClientRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    linked_client_id: str
    adviser_id: str


class MessageRequest(BaseModel):
    subject: str
    message: str


# In-memory messages
MESSAGES: List[Dict] = []


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_client_token(user_id: str, email: str, client_id: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "client_id": client_id,
        "type": "client_portal",
        "exp": datetime.now(timezone.utc) + timedelta(hours=CLIENT_JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, CLIENT_JWT_SECRET, algorithm=CLIENT_JWT_ALGORITHM)


def verify_client_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, CLIENT_JWT_SECRET, algorithms=[CLIENT_JWT_ALGORITHM])
        if payload.get("type") != "client_portal":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/auth/login")
async def client_login(request: ClientLoginRequest):
    """Login for client portal users."""
    user = CLIENT_USERS.get(request.email)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["password_hash"] != hash_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("portal_access", False):
        raise HTTPException(status_code=403, detail="Portal access disabled")
    
    # Update last login
    user["last_login"] = datetime.now(timezone.utc).isoformat()
    
    # Create token
    token = create_client_token(user["id"], user["email"], user["linked_client_id"])
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "linked_client_id": user["linked_client_id"],
            "permissions": user["permissions"]
        },
        "expires_in": CLIENT_JWT_EXPIRY_HOURS * 3600
    }


@router.post("/auth/register")
async def client_register(request: ClientRegisterRequest):
    """Register new client portal user (typically initiated by adviser)."""
    if request.email in CLIENT_USERS:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"cuser_{uuid.uuid4().hex[:8]}"
    
    CLIENT_USERS[request.email] = {
        "id": user_id,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "name": request.name,
        "linked_client_id": request.linked_client_id,
        "adviser_id": request.adviser_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None,
        "portal_access": True,
        "permissions": ["view_portfolio", "view_documents", "view_goals", "message_adviser"]
    }
    
    return {
        "success": True,
        "user_id": user_id,
        "message": "Client portal access created successfully"
    }


@router.get("/dashboard")
async def get_client_dashboard(token: str):
    """Get client dashboard data."""
    payload = verify_client_token(token)
    client_id = payload.get("client_id")
    
    # Mock portfolio summary
    portfolio_summary = {
        "total_value": 2920000,
        "change_24h": 12500,
        "change_24h_percent": 0.43,
        "change_ytd": 185000,
        "change_ytd_percent": 6.76
    }
    
    # Mock goals
    goals = [
        {"name": "Retirement at 65", "progress": 72, "target": 3500000, "current": 2520000},
        {"name": "Children's Education", "progress": 45, "target": 200000, "current": 90000}
    ]
    
    # Upcoming appointments
    appointments = [
        {
            "id": "apt_001",
            "title": "Quarterly Review",
            "date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "time": "10:00",
            "type": "video"
        }
    ]
    
    # Recent documents
    documents = [
        {"id": "doc_001", "name": "Statement of Advice - Q4 2024", "date": "2024-12-15", "type": "pdf"},
        {"id": "doc_002", "name": "Portfolio Report - December 2024", "date": "2024-12-31", "type": "pdf"},
        {"id": "doc_003", "name": "Tax Summary - FY2024", "date": "2024-07-15", "type": "pdf"}
    ]
    
    return {
        "client_id": client_id,
        "portfolio_summary": portfolio_summary,
        "goals": goals,
        "upcoming_appointments": appointments,
        "recent_documents": documents,
        "unread_messages": len([m for m in MESSAGES if m.get("client_id") == client_id and not m.get("read")]),
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.get("/portfolio")
async def get_client_portfolio(token: str):
    """Get detailed portfolio view for client."""
    payload = verify_client_token(token)
    client_id = payload.get("client_id")
    
    holdings = [
        {"asset": "Australian Shares", "value": 1022000, "allocation": 35, "return_ytd": 8.2},
        {"asset": "International Shares", "value": 730000, "allocation": 25, "return_ytd": 12.5},
        {"asset": "Bonds & Fixed Income", "value": 584000, "allocation": 20, "return_ytd": 3.1},
        {"asset": "Property", "value": 438000, "allocation": 15, "return_ytd": 5.8},
        {"asset": "Cash", "value": 146000, "allocation": 5, "return_ytd": 4.2}
    ]
    
    performance = {
        "total_value": 2920000,
        "total_return_ytd": 185000,
        "total_return_ytd_percent": 6.76,
        "total_return_inception": 520000,
        "total_return_inception_percent": 21.67,
        "benchmark_return_ytd": 5.8,
        "outperformance": 0.96
    }
    
    return {
        "client_id": client_id,
        "holdings": holdings,
        "performance": performance,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.get("/goals")
async def get_client_goals(token: str):
    """Get client goals and progress."""
    payload = verify_client_token(token)
    client_id = payload.get("client_id")
    
    goals = [
        {
            "id": "goal_001",
            "name": "Retirement at 65",
            "target_amount": 3500000,
            "current_amount": 2520000,
            "progress": 72,
            "target_date": "2045-01-01",
            "status": "on_track",
            "monthly_contribution": 3500,
            "projected_outcome": 3850000
        },
        {
            "id": "goal_002",
            "name": "Children's Education Fund",
            "target_amount": 200000,
            "current_amount": 90000,
            "progress": 45,
            "target_date": "2032-01-01",
            "status": "on_track",
            "monthly_contribution": 800,
            "projected_outcome": 215000
        }
    ]
    
    return {
        "client_id": client_id,
        "goals": goals,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.get("/documents")
async def get_client_documents(token: str, category: Optional[str] = None):
    """Get client documents."""
    payload = verify_client_token(token)
    client_id = payload.get("client_id")
    
    documents = [
        {"id": "doc_001", "name": "Statement of Advice - Q4 2024", "date": "2024-12-15", "type": "pdf", "category": "advice", "size": "2.3 MB"},
        {"id": "doc_002", "name": "Portfolio Report - December 2024", "date": "2024-12-31", "type": "pdf", "category": "reports", "size": "1.8 MB"},
        {"id": "doc_003", "name": "Tax Summary - FY2024", "date": "2024-07-15", "type": "pdf", "category": "tax", "size": "456 KB"},
        {"id": "doc_004", "name": "Insurance Policy Schedule", "date": "2024-06-01", "type": "pdf", "category": "insurance", "size": "890 KB"},
        {"id": "doc_005", "name": "Fee Disclosure Statement", "date": "2024-01-15", "type": "pdf", "category": "compliance", "size": "234 KB"},
    ]
    
    if category:
        documents = [d for d in documents if d["category"] == category]
    
    return {
        "client_id": client_id,
        "documents": documents,
        "categories": ["advice", "reports", "tax", "insurance", "compliance"]
    }


@router.post("/messages/send")
async def send_message_to_adviser(token: str, request: MessageRequest):
    """Send a message to the adviser."""
    payload = verify_client_token(token)
    client_id = payload.get("client_id")
    user_email = payload.get("email")
    
    message = {
        "id": f"msg_{uuid.uuid4().hex[:8]}",
        "client_id": client_id,
        "from": user_email,
        "to": "adviser",
        "subject": request.subject,
        "message": request.message,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "read": False,
        "type": "client_to_adviser"
    }
    
    MESSAGES.append(message)
    
    return {
        "success": True,
        "message_id": message["id"],
        "sent_at": message["sent_at"]
    }


@router.get("/messages")
async def get_messages(token: str, limit: int = 20):
    """Get client messages."""
    payload = verify_client_token(token)
    client_id = payload.get("client_id")
    
    client_messages = [m for m in MESSAGES if m.get("client_id") == client_id]
    client_messages.sort(key=lambda x: x.get("sent_at", ""), reverse=True)
    
    return {
        "messages": client_messages[:limit],
        "unread": len([m for m in client_messages if not m.get("read") and m.get("type") == "adviser_to_client"])
    }


@router.get("/net-worth")
async def get_net_worth(token: str):
    """Get comprehensive net worth view."""
    payload = verify_client_token(token)
    client_id = payload.get("client_id")
    
    assets = {
        "investments": {
            "shares": 1752000,
            "managed_funds": 584000,
            "etfs": 438000,
            "cash_investments": 146000,
            "subtotal": 2920000
        },
        "superannuation": {
            "personal_super": 580000,
            "spouse_super": 320000,
            "subtotal": 900000
        },
        "property": {
            "family_home": 1850000,
            "investment_property": 720000,
            "subtotal": 2570000
        },
        "other_assets": {
            "vehicles": 85000,
            "collectibles": 25000,
            "subtotal": 110000
        }
    }
    
    liabilities = {
        "mortgage_family_home": 450000,
        "mortgage_investment": 380000,
        "car_loan": 15000,
        "credit_cards": 5000,
        "total": 850000
    }
    
    total_assets = sum(cat["subtotal"] for cat in assets.values())
    net_worth = total_assets - liabilities["total"]
    
    return {
        "client_id": client_id,
        "assets": assets,
        "liabilities": liabilities,
        "summary": {
            "total_assets": total_assets,
            "total_liabilities": liabilities["total"],
            "net_worth": net_worth
        },
        "change_from_last_month": {
            "amount": 45000,
            "percent": 0.71
        },
        "last_updated": datetime.now(timezone.utc).isoformat()
    }


@router.post("/appointment/request")
async def request_appointment(
    token: str,
    preferred_date: str,
    preferred_time: str,
    meeting_type: str = "video",
    notes: Optional[str] = None
):
    """Request an appointment with adviser."""
    payload = verify_client_token(token)
    client_id = payload.get("client_id")
    
    appointment_request = {
        "id": f"apt_req_{uuid.uuid4().hex[:8]}",
        "client_id": client_id,
        "preferred_date": preferred_date,
        "preferred_time": preferred_time,
        "meeting_type": meeting_type,
        "notes": notes,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc).isoformat()
    }
    
    return {
        "success": True,
        "request": appointment_request,
        "message": "Appointment request submitted. Your adviser will confirm shortly."
    }
