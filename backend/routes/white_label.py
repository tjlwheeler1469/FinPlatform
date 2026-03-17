"""
White-Label & Multi-Tenancy Configuration
Allows customization of branding, features, and settings per tenant.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tenant", tags=["White-Label & Multi-Tenancy"])


class TenantBranding(BaseModel):
    """Branding configuration for a tenant."""
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: str = "#1a2744"
    secondary_color: str = "#10b981"
    accent_color: str = "#3b82f6"
    font_family: str = "Inter"
    company_name: str = "Wealth Command"
    tagline: str = "Start your day here. Run your business here."
    support_email: str = "support@wealthcommand.io"
    support_phone: Optional[str] = None
    website_url: Optional[str] = None


class TenantFeatures(BaseModel):
    """Feature flags for a tenant."""
    # Core features
    next_best_action: bool = True
    practice_health: bool = True
    meeting_automation: bool = True
    ai_copilot: bool = True
    
    # Trading features
    stock_trading: bool = True
    cgt_calculations: bool = True
    rebalancing: bool = True
    
    # Intelligence features
    cross_client_intelligence: bool = True
    tax_optimization: bool = True
    portfolio_monitoring: bool = True
    
    # Integration features
    bank_feeds: bool = True
    email_notifications: bool = True
    document_generation: bool = True
    
    # Advanced features
    client_portal: bool = True
    mobile_app: bool = True
    api_access: bool = False
    white_label: bool = False
    
    # Limits
    max_clients: int = 500
    max_aum: int = 100000000  # $100M
    max_users: int = 5


class TenantCompliance(BaseModel):
    """Compliance settings for a tenant."""
    jurisdiction: str = "AU"
    afsl_number: Optional[str] = None
    afsl_holder: Optional[str] = None
    require_disclaimer: bool = True
    disclaimer_version: str = "v5"
    audit_logging: bool = True
    data_retention_days: int = 2555  # 7 years
    gdpr_compliant: bool = True
    sox_compliant: bool = False


class TenantConfig(BaseModel):
    """Complete tenant configuration."""
    tenant_id: str
    tenant_name: str
    subdomain: Optional[str] = None
    custom_domain: Optional[str] = None
    branding: TenantBranding = TenantBranding()
    features: TenantFeatures = TenantFeatures()
    compliance: TenantCompliance = TenantCompliance()
    created_at: str = ""
    updated_at: str = ""
    status: str = "active"  # active, suspended, trial


# Default tenant configuration
DEFAULT_TENANT = TenantConfig(
    tenant_id="default",
    tenant_name="Wealth Command",
    subdomain="app",
    branding=TenantBranding(),
    features=TenantFeatures(),
    compliance=TenantCompliance()
)

# In-memory tenant storage (would be database in production)
TENANTS_DB: Dict[str, TenantConfig] = {
    "default": DEFAULT_TENANT
}

# Tenant tiers
TENANT_TIERS = {
    "starter": {
        "name": "Starter",
        "max_clients": 50,
        "max_users": 2,
        "max_aum": 25000000,
        "features": {
            "next_best_action": True,
            "practice_health": True,
            "stock_trading": False,
            "cross_client_intelligence": False,
            "api_access": False,
            "white_label": False
        },
        "price_monthly": 99
    },
    "professional": {
        "name": "Professional",
        "max_clients": 200,
        "max_users": 5,
        "max_aum": 100000000,
        "features": {
            "next_best_action": True,
            "practice_health": True,
            "stock_trading": True,
            "cross_client_intelligence": True,
            "api_access": False,
            "white_label": False
        },
        "price_monthly": 299
    },
    "enterprise": {
        "name": "Enterprise",
        "max_clients": -1,  # Unlimited
        "max_users": -1,
        "max_aum": -1,
        "features": {
            "next_best_action": True,
            "practice_health": True,
            "stock_trading": True,
            "cross_client_intelligence": True,
            "api_access": True,
            "white_label": True
        },
        "price_monthly": "custom"
    }
}


@router.get("/config")
async def get_tenant_config(tenant_id: str = "default"):
    """Get tenant configuration."""
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant = TENANTS_DB[tenant_id]
    return {
        "tenant_id": tenant.tenant_id,
        "tenant_name": tenant.tenant_name,
        "branding": tenant.branding.model_dump(),
        "features": tenant.features.model_dump(),
        "compliance": tenant.compliance.model_dump(),
        "status": tenant.status
    }


@router.get("/branding")
async def get_tenant_branding(tenant_id: str = "default"):
    """Get tenant branding configuration."""
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return TENANTS_DB[tenant_id].branding.model_dump()


@router.get("/features")
async def get_tenant_features(tenant_id: str = "default"):
    """Get tenant feature flags."""
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return TENANTS_DB[tenant_id].features.model_dump()


@router.post("/config")
async def create_tenant(config: TenantConfig):
    """Create a new tenant configuration."""
    if config.tenant_id in TENANTS_DB:
        raise HTTPException(status_code=400, detail="Tenant already exists")
    
    config.created_at = datetime.now(timezone.utc).isoformat()
    config.updated_at = config.created_at
    
    TENANTS_DB[config.tenant_id] = config
    
    return {
        "success": True,
        "tenant_id": config.tenant_id,
        "message": f"Tenant '{config.tenant_name}' created successfully"
    }


@router.put("/config/{tenant_id}")
async def update_tenant(tenant_id: str, updates: Dict[str, Any]):
    """Update tenant configuration."""
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant = TENANTS_DB[tenant_id]
    
    # Update branding
    if "branding" in updates:
        for key, value in updates["branding"].items():
            if hasattr(tenant.branding, key):
                setattr(tenant.branding, key, value)
    
    # Update features
    if "features" in updates:
        for key, value in updates["features"].items():
            if hasattr(tenant.features, key):
                setattr(tenant.features, key, value)
    
    # Update compliance
    if "compliance" in updates:
        for key, value in updates["compliance"].items():
            if hasattr(tenant.compliance, key):
                setattr(tenant.compliance, key, value)
    
    tenant.updated_at = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "tenant_id": tenant_id,
        "message": "Tenant configuration updated"
    }


@router.put("/branding/{tenant_id}")
async def update_branding(tenant_id: str, branding: TenantBranding):
    """Update tenant branding."""
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    TENANTS_DB[tenant_id].branding = branding
    TENANTS_DB[tenant_id].updated_at = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "tenant_id": tenant_id,
        "branding": branding.model_dump()
    }


@router.get("/tiers")
async def get_tenant_tiers():
    """Get available tenant tiers."""
    return {
        "tiers": TENANT_TIERS,
        "currency": "AUD"
    }


@router.get("/css-variables")
async def get_css_variables(tenant_id: str = "default"):
    """Get CSS variables for tenant branding."""
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    branding = TENANTS_DB[tenant_id].branding
    
    return {
        "variables": {
            "--primary-color": branding.primary_color,
            "--secondary-color": branding.secondary_color,
            "--accent-color": branding.accent_color,
            "--font-family": branding.font_family,
        },
        "css": f"""
:root {{
  --primary-color: {branding.primary_color};
  --secondary-color: {branding.secondary_color};
  --accent-color: {branding.accent_color};
  --font-family: {branding.font_family}, -apple-system, BlinkMacSystemFont, sans-serif;
}}
""".strip()
    }


@router.get("/list")
async def list_tenants():
    """List all tenants (admin only)."""
    return {
        "tenants": [
            {
                "tenant_id": t.tenant_id,
                "tenant_name": t.tenant_name,
                "subdomain": t.subdomain,
                "status": t.status,
                "created_at": t.created_at
            }
            for t in TENANTS_DB.values()
        ],
        "total": len(TENANTS_DB)
    }


@router.delete("/config/{tenant_id}")
async def delete_tenant(tenant_id: str):
    """Delete a tenant (soft delete - sets status to suspended)."""
    if tenant_id not in TENANTS_DB:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if tenant_id == "default":
        raise HTTPException(status_code=400, detail="Cannot delete default tenant")
    
    TENANTS_DB[tenant_id].status = "suspended"
    TENANTS_DB[tenant_id].updated_at = datetime.now(timezone.utc).isoformat()
    
    return {
        "success": True,
        "tenant_id": tenant_id,
        "status": "suspended"
    }
