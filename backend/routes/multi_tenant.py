"""
Multi-Tenant Isolation Service for AFSL/Licensee Management
Provides data isolation, tenant context management, and licensee-specific access controls
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tenants", tags=["Multi-Tenant Management"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "wealth_command")

async def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

# ==================== MODELS ====================

class LicenseeDetails(BaseModel):
    licensee_id: str = Field(default_factory=lambda: f"LIC-{uuid.uuid4().hex[:8].upper()}")
    name: str
    afsl_number: str
    abn: str = ""
    address: str = ""
    phone: str = ""
    email: str = ""
    status: str = "active"  # active, suspended, terminated
    
class LicenseeSettings(BaseModel):
    licensee_id: str
    branding: Dict[str, str] = Field(default_factory=lambda: {
        "primary_color": "#1a2744",
        "secondary_color": "#D4A84C",
        "logo_url": ""
    })
    compliance_settings: Dict[str, Any] = Field(default_factory=lambda: {
        "breach_notification_threshold": "medium",
        "auto_flag_risk_tolerance_breach": True,
        "require_dual_approval_for_soa": False,
        "file_note_mandatory": True
    })
    allowed_products: List[str] = Field(default_factory=lambda: [
        "managed_funds", "etf", "shares", "bonds", "super", "insurance"
    ])
    feature_flags: Dict[str, bool] = Field(default_factory=lambda: {
        "enable_xplan_integration": True,
        "enable_platform_sync": True,
        "enable_ai_recommendations": True,
        "enable_breach_alerts": True
    })

class AdviserDetails(BaseModel):
    adviser_id: str = Field(default_factory=lambda: f"ADV-{uuid.uuid4().hex[:8].upper()}")
    licensee_id: str
    name: str
    ar_number: str  # Authorised Representative number
    email: str
    phone: str = ""
    role: str = "adviser"  # adviser, compliance_officer, admin
    status: str = "active"

class TenantContext(BaseModel):
    """Context object passed through requests for tenant isolation"""
    licensee_id: str
    adviser_id: Optional[str] = None
    user_role: str = "adviser"
    permissions: List[str] = Field(default_factory=list)

# ==================== TENANT CONTEXT DEPENDENCY ====================

async def get_tenant_context(
    x_licensee_id: str = Header(None),
    x_adviser_id: str = Header(None),
    x_user_role: str = Header(default="adviser")
) -> TenantContext:
    """
    Extract tenant context from request headers.
    In production, this would validate against auth tokens.
    """
    if not x_licensee_id:
        # Default to demo licensee for testing
        x_licensee_id = "LIC-DEMO0001"
    
    # Get permissions based on role
    permissions = get_role_permissions(x_user_role)
    
    return TenantContext(
        licensee_id=x_licensee_id,
        adviser_id=x_adviser_id,
        user_role=x_user_role,
        permissions=permissions
    )

def get_role_permissions(role: str) -> List[str]:
    """Get permissions for a given role"""
    role_permissions = {
        "adviser": [
            "view_clients", "edit_clients", "create_soa", "view_reports",
            "submit_trade", "view_portfolio"
        ],
        "compliance_officer": [
            "view_clients", "view_all_advisers", "review_soa", "approve_soa",
            "view_breaches", "resolve_breaches", "view_reports", "run_audits"
        ],
        "admin": [
            "view_clients", "edit_clients", "delete_clients",
            "manage_advisers", "manage_settings", "view_all_data",
            "view_breaches", "resolve_breaches", "manage_compliance"
        ],
        "super_admin": ["*"]  # All permissions
    }
    return role_permissions.get(role, [])

# ==================== LICENSEE MANAGEMENT ====================

@router.post("/licensees")
async def create_licensee(details: LicenseeDetails):
    """Create a new licensee (tenant)"""
    db = await get_db()
    
    # Check for duplicate AFSL
    existing = await db.licensees.find_one({"afsl_number": details.afsl_number})
    if existing:
        raise HTTPException(400, f"Licensee with AFSL {details.afsl_number} already exists")
    
    licensee_data = details.model_dump()
    licensee_data["created_at"] = datetime.now(timezone.utc).isoformat()
    licensee_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.licensees.insert_one(licensee_data)
    
    # Create default settings
    default_settings = LicenseeSettings(licensee_id=details.licensee_id)
    await db.licensee_settings.insert_one(default_settings.model_dump())
    
    return {
        "success": True,
        "licensee_id": details.licensee_id,
        "message": "Licensee created successfully"
    }

@router.get("/licensees/{licensee_id}")
async def get_licensee(licensee_id: str):
    """Get licensee details"""
    db = await get_db()
    
    licensee = await db.licensees.find_one(
        {"licensee_id": licensee_id},
        {"_id": 0}
    )
    
    if not licensee:
        raise HTTPException(404, f"Licensee {licensee_id} not found")
    
    return licensee

@router.get("/licensees")
async def list_licensees(status: Optional[str] = None):
    """List all licensees"""
    db = await get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    licensees = await db.licensees.find(
        query,
        {"_id": 0}
    ).to_list(length=100)
    
    return {"licensees": licensees, "total": len(licensees)}

@router.put("/licensees/{licensee_id}")
async def update_licensee(licensee_id: str, details: LicenseeDetails):
    """Update licensee details"""
    db = await get_db()
    
    update_data = details.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.licensees.update_one(
        {"licensee_id": licensee_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(404, f"Licensee {licensee_id} not found")
    
    return {"success": True, "message": "Licensee updated"}

# ==================== LICENSEE SETTINGS ====================

@router.get("/licensees/{licensee_id}/settings")
async def get_licensee_settings(licensee_id: str):
    """Get licensee settings"""
    db = await get_db()
    
    settings = await db.licensee_settings.find_one(
        {"licensee_id": licensee_id},
        {"_id": 0}
    )
    
    if not settings:
        # Return default settings
        return LicenseeSettings(licensee_id=licensee_id).model_dump()
    
    return settings

@router.put("/licensees/{licensee_id}/settings")
async def update_licensee_settings(licensee_id: str, settings: LicenseeSettings):
    """Update licensee settings"""
    db = await get_db()
    
    settings_data = settings.model_dump()
    settings_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.licensee_settings.update_one(
        {"licensee_id": licensee_id},
        {"$set": settings_data},
        upsert=True
    )
    
    return {"success": True, "message": "Settings updated"}

# ==================== ADVISER MANAGEMENT ====================

@router.post("/advisers")
async def create_adviser(details: AdviserDetails):
    """Create a new adviser under a licensee"""
    db = await get_db()
    
    # Verify licensee exists
    licensee = await db.licensees.find_one({"licensee_id": details.licensee_id})
    if not licensee:
        raise HTTPException(404, f"Licensee {details.licensee_id} not found")
    
    # Check for duplicate AR number
    existing = await db.advisers.find_one({"ar_number": details.ar_number})
    if existing:
        raise HTTPException(400, f"Adviser with AR {details.ar_number} already exists")
    
    adviser_data = details.model_dump()
    adviser_data["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.advisers.insert_one(adviser_data)
    
    return {
        "success": True,
        "adviser_id": details.adviser_id,
        "message": "Adviser created successfully"
    }

@router.get("/advisers")
async def list_advisers(
    context: TenantContext = Depends(get_tenant_context),
    status: Optional[str] = None
):
    """List advisers for the current licensee"""
    db = await get_db()
    
    query = {"licensee_id": context.licensee_id}
    if status:
        query["status"] = status
    
    advisers = await db.advisers.find(
        query,
        {"_id": 0}
    ).to_list(length=500)
    
    return {"advisers": advisers, "total": len(advisers)}

@router.get("/advisers/{adviser_id}")
async def get_adviser(
    adviser_id: str,
    context: TenantContext = Depends(get_tenant_context)
):
    """Get adviser details (with tenant isolation)"""
    db = await get_db()
    
    adviser = await db.advisers.find_one(
        {
            "adviser_id": adviser_id,
            "licensee_id": context.licensee_id
        },
        {"_id": 0}
    )
    
    if not adviser:
        raise HTTPException(404, f"Adviser {adviser_id} not found")
    
    return adviser

# ==================== DATA ISOLATION QUERIES ====================

@router.get("/data/clients")
async def get_tenant_clients(
    context: TenantContext = Depends(get_tenant_context),
    limit: int = 100
):
    """Get clients for the current tenant with proper isolation"""
    db = await get_db()
    
    # Build query based on role
    if context.user_role == "super_admin":
        query = {}  # Super admin sees all
    elif context.user_role == "compliance_officer":
        query = {"licensee_id": context.licensee_id}  # All within licensee
    else:
        query = {
            "licensee_id": context.licensee_id,
            "adviser_id": context.adviser_id  # Only own clients
        }
    
    clients = await db.clients.find(
        query,
        {"_id": 0}
    ).limit(limit).to_list(length=limit)
    
    return {
        "clients": clients,
        "total": len(clients),
        "tenant": context.licensee_id,
        "scope": "all" if context.user_role in ["super_admin", "compliance_officer"] else "own"
    }

@router.get("/data/breaches")
async def get_tenant_breaches(
    context: TenantContext = Depends(get_tenant_context),
    status: Optional[str] = None,
    limit: int = 100
):
    """Get compliance breaches for the current tenant"""
    db = await get_db()
    
    if "view_breaches" not in context.permissions and "*" not in context.permissions:
        raise HTTPException(403, "Not authorized to view breaches")
    
    query = {"licensee_id": context.licensee_id}
    if status:
        query["status"] = status
    
    # Non-compliance officers only see their own breaches
    if context.user_role not in ["compliance_officer", "admin", "super_admin"]:
        query["adviser_id"] = context.adviser_id
    
    breaches = await db.breach_flags.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {
        "breaches": breaches,
        "total": len(breaches),
        "tenant": context.licensee_id
    }

@router.get("/data/documents")
async def get_tenant_documents(
    context: TenantContext = Depends(get_tenant_context),
    doc_type: Optional[str] = None,
    limit: int = 100
):
    """Get compliance documents for the current tenant"""
    db = await get_db()
    
    query = {"licensee_id": context.licensee_id}
    if doc_type:
        query["doc_type"] = doc_type
    
    # Non-compliance officers only see their own documents
    if context.user_role not in ["compliance_officer", "admin", "super_admin"]:
        query["adviser_id"] = context.adviser_id
    
    docs = await db.compliance_documents.find(
        query,
        {"_id": 0, "html_content": 0}  # Exclude large content
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {
        "documents": docs,
        "total": len(docs),
        "tenant": context.licensee_id
    }

# ==================== AUDIT & COMPLIANCE ====================

@router.get("/audit/access-log")
async def get_access_log(
    context: TenantContext = Depends(get_tenant_context),
    days: int = 7
):
    """Get access audit log for the tenant"""
    db = await get_db()
    
    if context.user_role not in ["compliance_officer", "admin", "super_admin"]:
        raise HTTPException(403, "Not authorized to view audit logs")
    
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    logs = await db.audit_logs.find(
        {
            "licensee_id": context.licensee_id,
            "timestamp": {"$gte": cutoff.isoformat()}
        },
        {"_id": 0}
    ).sort("timestamp", -1).limit(1000).to_list(length=1000)
    
    return {
        "logs": logs,
        "total": len(logs),
        "period_days": days,
        "tenant": context.licensee_id
    }

@router.post("/audit/log")
async def log_audit_event(
    action: str,
    resource: str,
    details: Dict[str, Any],
    context: TenantContext = Depends(get_tenant_context)
):
    """Log an audit event"""
    db = await get_db()
    
    log_entry = {
        "log_id": f"AUDIT-{uuid.uuid4().hex[:12].upper()}",
        "licensee_id": context.licensee_id,
        "adviser_id": context.adviser_id,
        "user_role": context.user_role,
        "action": action,
        "resource": resource,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.audit_logs.insert_one(log_entry)
    
    return {"success": True, "log_id": log_entry["log_id"]}

# ==================== DEMO DATA ====================

@router.post("/demo/setup")
async def setup_demo_tenant():
    """Set up demo tenant data for testing"""
    db = await get_db()
    
    # Create demo licensee
    demo_licensee = LicenseeDetails(
        licensee_id="LIC-DEMO0001",
        name="Demo Financial Services",
        afsl_number="123456",
        abn="12 345 678 901",
        address="123 Demo Street, Sydney NSW 2000",
        phone="02 1234 5678",
        email="compliance@demofinancial.com.au"
    )
    
    await db.licensees.update_one(
        {"licensee_id": demo_licensee.licensee_id},
        {"$set": demo_licensee.model_dump()},
        upsert=True
    )
    
    # Create demo advisers
    demo_advisers = [
        AdviserDetails(
            adviser_id="ADV-DEMO001",
            licensee_id="LIC-DEMO0001",
            name="John Smith",
            ar_number="AR001234",
            email="john.smith@demofinancial.com.au",
            role="adviser"
        ),
        AdviserDetails(
            adviser_id="ADV-DEMO002",
            licensee_id="LIC-DEMO0001",
            name="Sarah Johnson",
            ar_number="AR001235",
            email="sarah.johnson@demofinancial.com.au",
            role="compliance_officer"
        )
    ]
    
    for adviser in demo_advisers:
        await db.advisers.update_one(
            {"adviser_id": adviser.adviser_id},
            {"$set": adviser.model_dump()},
            upsert=True
        )
    
    return {
        "success": True,
        "message": "Demo tenant created",
        "licensee_id": demo_licensee.licensee_id,
        "advisers": [a.adviser_id for a in demo_advisers]
    }
