"""
RBAC — Role-Based Access Control.

Four roles with hierarchical permission inheritance:

  principal    practice owner — full access incl. firm settings, billing
  adviser      can do all client work, generate SOAs, dispatch trades
  paraplanner  can draft SOAs, view client data; cannot send to client or trade
  client       end-user; can view own data, sign documents, see Vault

Permissions are plain dot-notation strings like `deal.create`, `pack.dispatch`,
`file.delete`, `webhook.manage`, `client.edit`, `firm.billing`. We use a small
explicit matrix instead of inheritance trees to keep audit-ready clarity.

Endpoints (under /api/rbac):
  GET  /me                          current role + permission set
  GET  /roles                       full role matrix (for admin UI)
  GET  /audit                       paginated permission-grant audit trail
  POST /set-role                    DEMO ONLY — set the current session's role

In production this would attach to the real auth system. For now we honour an
`X-Role` header so the frontend can switch role for testing.
"""
from fastapi import APIRouter, HTTPException, Request, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
import uuid

from db import db

router = APIRouter(prefix="/rbac", tags=["RBAC"])

COL = "rbac_audit"

# ---------- Permission matrix ----------
ROLES = ("principal", "adviser", "paraplanner", "client")

# Each permission listed once; True means the role has it.
PERMISSION_MATRIX: Dict[str, Dict[str, bool]] = {
    # Client data
    "client.view":             {"principal": True,  "adviser": True,  "paraplanner": True,  "client": True},
    "client.edit":             {"principal": True,  "adviser": True,  "paraplanner": False, "client": False},
    "client.delete":           {"principal": True,  "adviser": False, "paraplanner": False, "client": False},

    # Deals
    "deal.view":               {"principal": True,  "adviser": True,  "paraplanner": True,  "client": True},
    "deal.create":             {"principal": True,  "adviser": True,  "paraplanner": True,  "client": False},
    "deal.edit":               {"principal": True,  "adviser": True,  "paraplanner": True,  "client": False},
    "deal.stage_change":       {"principal": True,  "adviser": True,  "paraplanner": False, "client": False},

    # Advice documents (SOA/ROA) + Implementation Pack
    "pack.create":             {"principal": True,  "adviser": True,  "paraplanner": True,  "client": False},
    "pack.dispatch":           {"principal": True,  "adviser": True,  "paraplanner": False, "client": False},
    "soa.send_to_client":      {"principal": True,  "adviser": True,  "paraplanner": False, "client": False},
    "soa.sign":                {"principal": False, "adviser": False, "paraplanner": False, "client": True},

    # Execution
    "ticket.dispatch":         {"principal": True,  "adviser": True,  "paraplanner": False, "client": False},
    "ticket.cancel":           {"principal": True,  "adviser": True,  "paraplanner": False, "client": False},

    # Calculator algorithms — engine code lives in lib/auTax.js but only
    # principals can change firm-wide assumption defaults.
    "calculator.edit_algorithm": {"principal": True, "adviser": False, "paraplanner": False, "client": False},
    "calculator.run":          {"principal": True,  "adviser": True,  "paraplanner": True,  "client": True},

    # Document Vault
    "file.view":               {"principal": True,  "adviser": True,  "paraplanner": True,  "client": True},
    "file.upload":             {"principal": True,  "adviser": True,  "paraplanner": True,  "client": False},
    "file.delete":             {"principal": True,  "adviser": True,  "paraplanner": False, "client": False},
    "file.restore_version":    {"principal": True,  "adviser": True,  "paraplanner": False, "client": False},

    # Firm-wide
    "firm.billing":            {"principal": True,  "adviser": False, "paraplanner": False, "client": False},
    "firm.settings":           {"principal": True,  "adviser": False, "paraplanner": False, "client": False},
    "webhook.manage":          {"principal": True,  "adviser": False, "paraplanner": False, "client": False},
    "rbac.manage":             {"principal": True,  "adviser": False, "paraplanner": False, "client": False},
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def role_permissions(role: str) -> List[str]:
    """Return all permissions granted to a role."""
    if role not in ROLES:
        return []
    return [perm for perm, matrix in PERMISSION_MATRIX.items() if matrix.get(role)]


def has_permission(role: str, permission: str) -> bool:
    matrix = PERMISSION_MATRIX.get(permission)
    if matrix is None:
        return False
    return bool(matrix.get(role, False))


def _current_role(request: Request) -> str:
    """Pull the active role from header (dev/demo) — replace with real auth
    integration in production. Defaults to `adviser`."""
    role = request.headers.get("X-Role", "adviser").lower().strip()
    return role if role in ROLES else "adviser"


@router.get("/me")
async def whoami(request: Request) -> dict:
    role = _current_role(request)
    return {
        "role": role,
        "permissions": role_permissions(role),
        "is_principal": role == "principal",
        "valid_roles": list(ROLES),
    }


@router.get("/roles")
async def list_roles() -> dict:
    """Return the full role-permission matrix for the admin UI."""
    return {
        "roles": list(ROLES),
        "permissions": list(PERMISSION_MATRIX.keys()),
        "matrix": PERMISSION_MATRIX,
    }


class RoleAction(BaseModel):
    role: str


@router.post("/set-role")
async def set_role_demo(payload: RoleAction, request: Request) -> dict:
    """DEMO endpoint — records the role choice in the audit log so we can
    verify gates. In production the role comes from the JWT, not a POST."""
    if payload.role not in ROLES:
        raise HTTPException(400, f"role must be one of {ROLES}")
    audit_id = f"rbac_{uuid.uuid4().hex[:10]}"
    await db[COL].insert_one({
        "_id": audit_id,
        "audit_id": audit_id,
        "event": "set_role",
        "from_role": _current_role(request),
        "to_role": payload.role,
        "at": _now(),
        "ip": request.client.host if request.client else "unknown",
    })
    return {"success": True, "role": payload.role, "permissions": role_permissions(payload.role)}


@router.get("/audit")
async def list_audit(
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0),
) -> dict:
    cur = db[COL].find({}, {"_id": 0}).sort("at", -1).skip(skip).limit(limit)
    rows = await cur.to_list(length=limit)
    total = await db[COL].count_documents({})
    return {"audit": rows, "count": len(rows), "total": total}


class GateCheck(BaseModel):
    permission: str
    target_kind: Optional[str] = None
    target_ref: Optional[str] = None
    granted: bool
    role: str


@router.post("/audit-gate")
async def audit_gate(check: GateCheck, request: Request) -> dict:
    """Frontend calls this on every protected action so we keep a full
    server-side trail of who tried what (including denials)."""
    audit_id = f"gate_{uuid.uuid4().hex[:10]}"
    await db[COL].insert_one({
        "_id": audit_id,
        "audit_id": audit_id,
        "event": "gate_check",
        "permission": check.permission,
        "role": check.role,
        "granted": check.granted,
        "target_kind": check.target_kind,
        "target_ref": check.target_ref,
        "at": _now(),
        "ip": request.client.host if request.client else "unknown",
    })
    return {"success": True, "audit_id": audit_id}
