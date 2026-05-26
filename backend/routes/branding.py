"""
White-label / Firm Branding — single-document config that lets a Principal
adviser customise the visual identity of the entire app for their firm.

Settings persisted in Mongo (collection: `firm_branding`, document _id="default").
The frontend fetches `/api/branding/current` on app boot and applies firm name,
primary/accent colours, logo URL and PDF footer text app-wide.

Endpoints (under /api/branding):
  GET   /current        return the active firm branding doc
  POST  /update         upsert the firm branding doc (RBAC: principal-only)
  POST  /reset          revert to Halcyon Wealth defaults
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional
import uuid
import re
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/branding", tags=["Firm Branding"])

COL = "firm_branding"
DOC_ID = "default"
AUDIT = "rbac_audit"


DEFAULT_BRANDING = {
    "firm_name": "Halcyon Wealth Command Centre",
    "tagline": "Retirement Readiness · Financial Decision OS",
    "primary_color": "#1a2744",   # navy
    "accent_color": "#D4A84C",    # gold
    "logo_url": None,
    "favicon_url": None,
    "pdf_footer": "Halcyon Wealth · Authorised Representative",
    "support_email": "advisers@halcyon-wealth.com.au",
    "domain": None,
    "afsl": None,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _validate_hex(c: str | None, field: str) -> str | None:
    if c is None:
        return None
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", c):
        raise HTTPException(400, f"{field} must be a 6-character hex colour like #1a2744")
    return c


class BrandingUpdate(BaseModel):
    firm_name: Optional[str] = Field(None, max_length=200)
    tagline: Optional[str] = Field(None, max_length=300)
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    pdf_footer: Optional[str] = Field(None, max_length=500)
    support_email: Optional[str] = None
    domain: Optional[str] = None
    afsl: Optional[str] = None


@router.get("/current")
async def get_current():
    row = await db[COL].find_one({"_id": DOC_ID}, {"_id": 0})
    if not row:
        return {**DEFAULT_BRANDING, "is_default": True}
    return {**row, "is_default": False}


@router.post("/update")
async def update_branding(payload: BrandingUpdate, request: Request):
    patch = {k: v for k, v in payload.dict().items() if v is not None}
    if "primary_color" in patch:
        _validate_hex(patch["primary_color"], "primary_color")
    if "accent_color" in patch:
        _validate_hex(patch["accent_color"], "accent_color")
    if not patch:
        raise HTTPException(400, "no fields to update")

    patch["updated_at"] = _now()
    await db[COL].update_one({"_id": DOC_ID}, {"$set": patch}, upsert=True)
    await db[AUDIT].insert_one({
        "audit_id": f"audit_{uuid.uuid4().hex[:10]}",
        "event": "firm_branding_updated",
        "fields_changed": list(patch.keys()),
        "at": _now(),
        "ip": request.client.host if request.client else "unknown",
    })
    row = await db[COL].find_one({"_id": DOC_ID}, {"_id": 0})
    return {"success": True, "branding": row}


@router.post("/reset")
async def reset_branding(request: Request):
    await db[COL].delete_one({"_id": DOC_ID})
    await db[AUDIT].insert_one({
        "audit_id": f"audit_{uuid.uuid4().hex[:10]}",
        "event": "firm_branding_reset",
        "at": _now(),
        "ip": request.client.host if request.client else "unknown",
    })
    return {"success": True, "branding": {**DEFAULT_BRANDING, "is_default": True}}
