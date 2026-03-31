"""
Authentication Routes
Handles login, registration, JWT tokens, and session management.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from datetime import datetime, timedelta, timezone
import secrets
import hashlib
import jwt
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# In-memory user store (use MongoDB in production)
USERS_DB: Dict[str, Dict] = {
    "advisor@wealthcommand.com": {
        "id": "user_001",
        "email": "advisor@wealthcommand.com",
        "password_hash": hashlib.sha256("demo123".encode()).hexdigest(),
        "name": "James Wheeler",
        "role": "advisor",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mfa_enabled": False
    },
    "advisor@wealthcommand.io": {
        "id": "user_002",
        "email": "advisor@wealthcommand.io",
        "password_hash": hashlib.sha256("secure_password_123".encode()).hexdigest(),
        "name": "Sarah Chen",
        "role": "advisor",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mfa_enabled": False
    },
    "client@example.com": {
        "id": "user_003",
        "email": "client@example.com",
        "password_hash": hashlib.sha256("client123".encode()).hexdigest(),
        "name": "Michael Thompson",
        "role": "client",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mfa_enabled": False
    }
}

SESSIONS: Dict[str, Dict] = {}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    mfa_code: Optional[str] = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "client"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict


def create_jwt_token(user_id: str, email: str, role: str) -> str:
    """Create a JWT token for authenticated user."""
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> Dict:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"valid": True, "payload": payload}
    except jwt.ExpiredSignatureError:
        return {"valid": False, "error": "Token expired"}
    except jwt.InvalidTokenError:
        return {"valid": False, "error": "Invalid token"}


def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/login")
async def login(request: LoginRequest):
    """Authenticate user and return JWT token."""
    user = USERS_DB.get(request.email)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["password_hash"] != hash_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check MFA if enabled
    if user.get("mfa_enabled") and not request.mfa_code:
        return {
            "requires_mfa": True,
            "message": "MFA code required"
        }
    
    # Create JWT token
    token = create_jwt_token(user["id"], user["email"], user["role"])
    
    # Create session
    session_id = secrets.token_urlsafe(32)
    SESSIONS[session_id] = {
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)).isoformat()
    }
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": JWT_EXPIRATION_HOURS * 3600,
        "session_id": session_id,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }


@router.post("/register")
async def register(request: RegisterRequest):
    """Register a new user."""
    if request.email in USERS_DB:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{secrets.token_hex(4)}"
    
    USERS_DB[request.email] = {
        "id": user_id,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "name": request.name,
        "role": request.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "mfa_enabled": False
    }
    
    return {
        "success": True,
        "user_id": user_id,
        "message": "Registration successful"
    }


@router.post("/logout")
async def logout(session_id: str = None):
    """Invalidate session."""
    if session_id and session_id in SESSIONS:
        del SESSIONS[session_id]
    
    return {"success": True, "message": "Logged out"}


@router.get("/verify-token")
async def verify_token(token: str):
    """Verify a JWT token."""
    result = verify_jwt_token(token)
    return result


@router.get("/me")
async def get_current_user(token: str):
    """Get current user from token."""
    result = verify_jwt_token(token)
    
    if not result["valid"]:
        raise HTTPException(status_code=401, detail=result["error"])
    
    payload = result["payload"]
    email = payload.get("email")
    user = USERS_DB.get(email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "mfa_enabled": user.get("mfa_enabled", False)
    }


@router.post("/refresh-token")
async def refresh_token(token: str):
    """Refresh an existing JWT token."""
    result = verify_jwt_token(token)
    
    if not result["valid"]:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    payload = result["payload"]
    new_token = create_jwt_token(
        payload["sub"],
        payload["email"],
        payload["role"]
    )
    
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "expires_in": JWT_EXPIRATION_HOURS * 3600
    }


@router.post("/change-password")
async def change_password(
    email: str,
    current_password: str,
    new_password: str
):
    """Change user password."""
    user = USERS_DB.get(email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user["password_hash"] != hash_password(current_password):
        raise HTTPException(status_code=401, detail="Current password incorrect")
    
    USERS_DB[email]["password_hash"] = hash_password(new_password)
    
    return {"success": True, "message": "Password changed successfully"}
