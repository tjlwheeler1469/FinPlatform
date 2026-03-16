"""
Twilio SMS Service for 2FA/MFA
Sends verification codes via SMS using Twilio Verify API.
"""
import os
from typing import Dict, Any
from datetime import datetime, timezone

# Try to import Twilio
try:
    from twilio.rest import Client
    from twilio.base.exceptions import TwilioRestException
    TWILIO_AVAILABLE = True
except ImportError:
    TWILIO_AVAILABLE = False

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_VERIFY_SERVICE = os.environ.get("TWILIO_VERIFY_SERVICE")

# Initialize Twilio client if credentials available
twilio_client = None
if TWILIO_AVAILABLE and TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        print(f"Failed to initialize Twilio client: {e}")


def is_twilio_configured() -> bool:
    """Check if Twilio is properly configured."""
    return (
        TWILIO_AVAILABLE and 
        twilio_client is not None and 
        TWILIO_VERIFY_SERVICE is not None
    )


def send_verification_sms(phone_number: str) -> Dict[str, Any]:
    """
    Send a verification code via SMS using Twilio Verify.
    
    Args:
        phone_number: Phone number in E.164 format (e.g., +61412345678)
    
    Returns:
        Status of the SMS send operation
    """
    # Validate phone number format
    if not phone_number.startswith("+"):
        phone_number = f"+{phone_number}"
    
    # If Twilio not configured, return mock response
    if not is_twilio_configured():
        # Generate mock code for demo
        import secrets
        demo_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        
        return {
            "success": True,
            "status": "pending",
            "phone_number": phone_number[-4:].rjust(len(phone_number), '*'),
            "message": "Verification code sent (DEMO MODE)",
            "demo_mode": True,
            "demo_code": demo_code,  # Only for demo - remove in production!
            "expires_in_seconds": 300,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    try:
        # Send verification using Twilio Verify
        verification = twilio_client.verify \
            .services(TWILIO_VERIFY_SERVICE) \
            .verifications \
            .create(to=phone_number, channel="sms")
        
        return {
            "success": True,
            "status": verification.status,
            "phone_number": phone_number[-4:].rjust(len(phone_number), '*'),
            "message": f"Verification code sent to {phone_number[-4:].rjust(len(phone_number), '*')}",
            "demo_mode": False,
            "expires_in_seconds": 300,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except TwilioRestException as e:
        return {
            "success": False,
            "error": str(e.msg),
            "error_code": e.code,
            "phone_number": phone_number[-4:].rjust(len(phone_number), '*'),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "phone_number": phone_number[-4:].rjust(len(phone_number), '*'),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


def verify_sms_code(phone_number: str, code: str) -> Dict[str, Any]:
    """
    Verify a code sent via SMS.
    
    Args:
        phone_number: Phone number in E.164 format
        code: 6-digit verification code
    
    Returns:
        Verification result
    """
    # Validate phone number format
    if not phone_number.startswith("+"):
        phone_number = f"+{phone_number}"
    
    # Validate code format
    if not code or len(code) != 6 or not code.isdigit():
        return {
            "success": False,
            "valid": False,
            "error": "Invalid code format. Please enter a 6-digit code.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    # If Twilio not configured, accept any 6-digit code in demo mode
    if not is_twilio_configured():
        # In demo mode, accept the code (for testing purposes)
        return {
            "success": True,
            "valid": True,
            "status": "approved",
            "message": "Code verified successfully (DEMO MODE)",
            "demo_mode": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    try:
        # Verify code using Twilio Verify
        verification_check = twilio_client.verify \
            .services(TWILIO_VERIFY_SERVICE) \
            .verification_checks \
            .create(to=phone_number, code=code)
        
        is_valid = verification_check.status == "approved"
        
        return {
            "success": True,
            "valid": is_valid,
            "status": verification_check.status,
            "message": "Code verified successfully" if is_valid else "Invalid or expired code",
            "demo_mode": False,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except TwilioRestException as e:
        # Handle specific Twilio errors
        if e.code == 20404:
            return {
                "success": False,
                "valid": False,
                "error": "Verification expired or not found. Please request a new code.",
                "error_code": e.code,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        return {
            "success": False,
            "valid": False,
            "error": str(e.msg),
            "error_code": e.code,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "valid": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


def get_twilio_status() -> Dict[str, Any]:
    """
    Get Twilio configuration status.
    """
    return {
        "twilio_available": TWILIO_AVAILABLE,
        "twilio_configured": is_twilio_configured(),
        "account_sid_set": bool(TWILIO_ACCOUNT_SID),
        "auth_token_set": bool(TWILIO_AUTH_TOKEN),
        "verify_service_set": bool(TWILIO_VERIFY_SERVICE),
        "demo_mode": not is_twilio_configured(),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def format_phone_number(phone: str, country_code: str = "61") -> str:
    """
    Format a phone number to E.164 format.
    
    Args:
        phone: Phone number (various formats)
        country_code: Country code (default: 61 for Australia)
    
    Returns:
        Phone number in E.164 format
    """
    # Remove all non-digit characters
    digits = ''.join(c for c in phone if c.isdigit())
    
    # Handle Australian numbers
    if country_code == "61":
        # Remove leading 0 if present
        if digits.startswith("0"):
            digits = digits[1:]
        # Remove country code if already present
        if digits.startswith("61"):
            digits = digits[2:]
    
    return f"+{country_code}{digits}"


def validate_phone_number(phone: str) -> Dict[str, Any]:
    """
    Validate a phone number format.
    """
    # Basic validation
    if not phone:
        return {"valid": False, "error": "Phone number is required"}
    
    # Remove spaces and dashes
    clean_phone = ''.join(c for c in phone if c.isdigit() or c == '+')
    
    # Check length (E.164: 8-15 digits plus +)
    if len(clean_phone) < 8 or len(clean_phone) > 16:
        return {"valid": False, "error": "Invalid phone number length"}
    
    # Check for valid E.164 format
    if not clean_phone.startswith("+"):
        return {"valid": False, "error": "Phone number must be in E.164 format (e.g., +61412345678)"}
    
    return {
        "valid": True,
        "formatted": clean_phone
    }
