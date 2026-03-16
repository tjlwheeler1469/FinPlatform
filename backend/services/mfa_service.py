"""
Two-Factor Authentication (2FA/MFA) Service
Supports TOTP (App-based) and SMS verification.
"""
import os
import pyotp
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
import base64

# In-memory storage for demo (use Redis/DB in production)
MFA_SECRETS: Dict[str, Dict] = {}
MFA_SESSIONS: Dict[str, Dict] = {}
SMS_CODES: Dict[str, Dict] = {}
BACKUP_CODES: Dict[str, List[str]] = {}


def generate_totp_secret(user_id: str, user_email: str) -> Dict[str, Any]:
    """
    Generate a new TOTP secret for a user.
    Returns the secret and QR code provisioning URI.
    """
    # Generate a secure random secret
    secret = pyotp.random_base32()
    
    # Store the secret
    MFA_SECRETS[user_id] = {
        "secret": secret,
        "type": "totp",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "verified": False,
        "user_email": user_email
    }
    
    # Generate provisioning URI for QR code
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user_email,
        issuer_name="Wealth Command"
    )
    
    # Generate backup codes
    backup_codes = generate_backup_codes(user_id)
    
    return {
        "secret": secret,
        "provisioning_uri": provisioning_uri,
        "backup_codes": backup_codes,
        "qr_code_data": f"otpauth://totp/Wealth%20Command:{user_email}?secret={secret}&issuer=Wealth%20Command"
    }


def verify_totp(user_id: str, code: str) -> Dict[str, Any]:
    """
    Verify a TOTP code from authenticator app.
    """
    if user_id not in MFA_SECRETS:
        return {"success": False, "error": "MFA not set up for this user"}
    
    secret = MFA_SECRETS[user_id]["secret"]
    totp = pyotp.TOTP(secret)
    
    # Verify with a window of 1 (allows for slight time drift)
    if totp.verify(code, valid_window=1):
        # Mark as verified if first time
        if not MFA_SECRETS[user_id]["verified"]:
            MFA_SECRETS[user_id]["verified"] = True
        
        # Create MFA session
        session_token = create_mfa_session(user_id)
        
        return {
            "success": True,
            "session_token": session_token,
            "message": "TOTP verification successful"
        }
    
    # Check backup codes
    if user_id in BACKUP_CODES and code in BACKUP_CODES[user_id]:
        BACKUP_CODES[user_id].remove(code)  # One-time use
        session_token = create_mfa_session(user_id)
        return {
            "success": True,
            "session_token": session_token,
            "message": "Backup code used successfully",
            "backup_codes_remaining": len(BACKUP_CODES[user_id])
        }
    
    return {"success": False, "error": "Invalid verification code"}


def generate_sms_code(user_id: str, phone_number: str) -> Dict[str, Any]:
    """
    Generate a 6-digit SMS verification code.
    In production, this would integrate with Twilio/SMS provider.
    """
    # Generate 6-digit code
    code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
    
    # Store with expiry (5 minutes)
    SMS_CODES[user_id] = {
        "code": code,
        "phone": phone_number,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
        "attempts": 0
    }
    
    # In production, send SMS here via Twilio
    # For demo, we'll return the code (remove in production!)
    return {
        "success": True,
        "message": f"Verification code sent to {phone_number[-4:].rjust(len(phone_number), '*')}",
        "expires_in_seconds": 300,
        # DEMO ONLY - remove in production:
        "demo_code": code
    }


def verify_sms_code(user_id: str, code: str) -> Dict[str, Any]:
    """
    Verify SMS code.
    """
    if user_id not in SMS_CODES:
        return {"success": False, "error": "No SMS code pending for this user"}
    
    sms_data = SMS_CODES[user_id]
    
    # Check expiry
    expires_at = datetime.fromisoformat(sms_data["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        del SMS_CODES[user_id]
        return {"success": False, "error": "Verification code expired"}
    
    # Check attempts (max 3)
    if sms_data["attempts"] >= 3:
        del SMS_CODES[user_id]
        return {"success": False, "error": "Too many failed attempts. Please request a new code."}
    
    # Verify code
    if sms_data["code"] == code:
        del SMS_CODES[user_id]
        session_token = create_mfa_session(user_id)
        return {
            "success": True,
            "session_token": session_token,
            "message": "SMS verification successful"
        }
    
    # Increment attempts
    SMS_CODES[user_id]["attempts"] += 1
    remaining = 3 - SMS_CODES[user_id]["attempts"]
    
    return {
        "success": False,
        "error": f"Invalid code. {remaining} attempts remaining."
    }


def generate_backup_codes(user_id: str, count: int = 10) -> List[str]:
    """
    Generate one-time backup codes for account recovery.
    """
    codes = []
    for _ in range(count):
        # Generate 8-character alphanumeric code
        code = secrets.token_hex(4).upper()
        # Format as XXXX-XXXX
        formatted_code = f"{code[:4]}-{code[4:]}"
        codes.append(formatted_code)
    
    BACKUP_CODES[user_id] = codes.copy()
    return codes


def create_mfa_session(user_id: str) -> str:
    """
    Create an MFA-verified session token.
    """
    session_token = secrets.token_urlsafe(32)
    
    MFA_SESSIONS[session_token] = {
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat(),
        "mfa_verified": True
    }
    
    return session_token


def verify_mfa_session(session_token: str) -> Dict[str, Any]:
    """
    Verify if a session has passed MFA.
    """
    if session_token not in MFA_SESSIONS:
        return {"valid": False, "error": "Invalid session"}
    
    session = MFA_SESSIONS[session_token]
    expires_at = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
    
    if datetime.now(timezone.utc) > expires_at:
        del MFA_SESSIONS[session_token]
        return {"valid": False, "error": "Session expired"}
    
    return {
        "valid": True,
        "user_id": session["user_id"],
        "mfa_verified": session["mfa_verified"]
    }


def get_mfa_status(user_id: str) -> Dict[str, Any]:
    """
    Get MFA configuration status for a user.
    """
    has_totp = user_id in MFA_SECRETS and MFA_SECRETS[user_id]["verified"]
    backup_codes_count = len(BACKUP_CODES.get(user_id, []))
    
    return {
        "user_id": user_id,
        "mfa_enabled": has_totp,
        "totp_configured": has_totp,
        "sms_configured": False,  # Would check against user profile
        "backup_codes_remaining": backup_codes_count,
        "last_verified": MFA_SECRETS.get(user_id, {}).get("created_at")
    }


def disable_mfa(user_id: str, verification_code: str) -> Dict[str, Any]:
    """
    Disable MFA for a user (requires current code verification).
    """
    # Verify current code first
    verify_result = verify_totp(user_id, verification_code)
    
    if not verify_result["success"]:
        return {"success": False, "error": "Invalid verification code. MFA not disabled."}
    
    # Remove MFA data
    if user_id in MFA_SECRETS:
        del MFA_SECRETS[user_id]
    if user_id in BACKUP_CODES:
        del BACKUP_CODES[user_id]
    
    return {
        "success": True,
        "message": "MFA has been disabled for your account"
    }


def regenerate_backup_codes(user_id: str, verification_code: str) -> Dict[str, Any]:
    """
    Regenerate backup codes (requires verification).
    """
    verify_result = verify_totp(user_id, verification_code)
    
    if not verify_result["success"]:
        return {"success": False, "error": "Invalid verification code"}
    
    new_codes = generate_backup_codes(user_id)
    
    return {
        "success": True,
        "backup_codes": new_codes,
        "message": "New backup codes generated. Previous codes are now invalid."
    }
