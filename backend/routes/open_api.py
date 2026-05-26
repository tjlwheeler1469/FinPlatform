"""
Open API platform — scoped API tokens + OpenAPI spec download.

The platform already runs FastAPI with a /docs Swagger UI. This module adds:
  - Scoped, hashed API tokens persisted in Mongo (`api_tokens`) so partners
    can be granted read/write access to specific resource scopes.
  - A simple revocation mechanism with full audit trail (re-uses rbac_audit).
  - A convenience endpoint that returns the OpenAPI 3.1 JSON so partners can
    auto-generate clients (e.g. via openapi-typescript-codegen).

Endpoints (under /api/open-api):
  GET   /tokens                    list issued tokens (hashed_secret never exposed)
  POST  /tokens                    issue a new token (returns plaintext ONCE)
  POST  /tokens/{token_id}/revoke  revoke a token
  GET   /spec                      retrieve full OpenAPI 3.1 spec for download
  GET   /scopes                    list available permission scopes
"""
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
import hashlib
import secrets
import uuid
import logging

from db import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/open-api", tags=["Open API Platform"])

COL = "api_tokens"
AUDIT = "rbac_audit"

AVAILABLE_SCOPES = [
    {"key": "clients.read", "label": "Read clients", "category": "Clients"},
    {"key": "clients.write", "label": "Create / update clients", "category": "Clients"},
    {"key": "deals.read", "label": "Read deals pipeline", "category": "Deals"},
    {"key": "deals.write", "label": "Create / advance deals", "category": "Deals"},
    {"key": "files.read", "label": "Download vault documents", "category": "Vault"},
    {"key": "files.write", "label": "Upload vault documents", "category": "Vault"},
    {"key": "webhooks.read", "label": "Read webhook subscriptions", "category": "Webhooks"},
    {"key": "webhooks.write", "label": "Manage webhook subscriptions", "category": "Webhooks"},
    {"key": "evidence.read", "label": "Generate compliance evidence packs", "category": "Compliance"},
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class IssueTokenRequest(BaseModel):
    name: str = Field(..., description="Friendly label, e.g. 'Mortgage Choice integration'")
    scopes: List[str] = Field(..., description="One or more of the keys in /scopes")
    expires_at: Optional[str] = Field(None, description="ISO datetime; null = never expires")


@router.get("/scopes")
async def list_scopes():
    cats: dict = {}
    for s in AVAILABLE_SCOPES:
        cats.setdefault(s["category"], []).append(s)
    return {"scopes": AVAILABLE_SCOPES, "categories": cats, "count": len(AVAILABLE_SCOPES)}


@router.get("/tokens")
async def list_tokens():
    cur = db[COL].find({}, {"_id": 0, "hashed_secret": 0}).sort("created_at", -1).limit(200)
    rows = await cur.to_list(length=200)
    active = sum(1 for r in rows if not r.get("revoked_at"))
    return {"tokens": rows, "count": len(rows), "active": active}


@router.post("/tokens")
async def issue_token(req: IssueTokenRequest, request: Request):
    # Validate scopes
    valid_keys = {s["key"] for s in AVAILABLE_SCOPES}
    unknown = [s for s in req.scopes if s not in valid_keys]
    if unknown:
        raise HTTPException(400, f"unknown scopes: {unknown}")
    if not req.scopes:
        raise HTTPException(400, "at least one scope is required")

    # Generate a token with a recognisable prefix (helps secret-scanners detect leaks).
    raw_token = f"hwc_{secrets.token_urlsafe(32)}"
    token_id = f"tok_{uuid.uuid4().hex[:10]}"
    record = {
        "token_id": token_id,
        "name": req.name,
        "scopes": req.scopes,
        "hashed_secret": _hash(raw_token),
        "token_prefix": raw_token[:10],  # last-4 style display, never the full secret
        "created_at": _now(),
        "expires_at": req.expires_at,
        "revoked_at": None,
        "last_used_at": None,
        "use_count": 0,
    }
    await db[COL].insert_one({**record})
    await db[AUDIT].insert_one({
        "audit_id": f"audit_{uuid.uuid4().hex[:10]}",
        "event": "api_token_issued",
        "token_id": token_id,
        "name": req.name,
        "scopes": req.scopes,
        "at": _now(),
        "ip": request.client.host if request.client else "unknown",
    })
    record.pop("_id", None)
    record.pop("hashed_secret", None)
    return {
        "success": True,
        "token_id": token_id,
        "token": raw_token,  # FULL plaintext — shown ONCE, never persisted in cleartext
        "warning": "Store this token securely. It will not be shown again. "
                   "If lost, revoke and issue a new one.",
        "record": record,
    }


@router.post("/tokens/{token_id}/revoke")
async def revoke_token(token_id: str, request: Request):
    row = await db[COL].find_one({"token_id": token_id})
    if not row:
        raise HTTPException(404, "token not found")
    if row.get("revoked_at"):
        raise HTTPException(400, "token already revoked")
    await db[COL].update_one({"token_id": token_id}, {"$set": {"revoked_at": _now()}})
    await db[AUDIT].insert_one({
        "audit_id": f"audit_{uuid.uuid4().hex[:10]}",
        "event": "api_token_revoked",
        "token_id": token_id,
        "at": _now(),
        "ip": request.client.host if request.client else "unknown",
    })
    return {"success": True, "token_id": token_id, "revoked_at": _now()}


@router.get("/spec")
async def openapi_spec(request: Request):
    """Return the FastAPI app's auto-generated OpenAPI 3.1 spec — usable
    directly with openapi-typescript-codegen / swagger-codegen for partner
    client SDK generation."""
    app = request.app
    return app.openapi()
