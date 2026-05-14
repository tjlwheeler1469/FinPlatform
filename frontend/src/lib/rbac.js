// Role-Based Access Control — frontend hooks + components.
// Role is stored in localStorage (`rbac_role`) and sent on every API call via
// the `X-Role` header. Permissions are derived from a small static matrix
// that mirrors `backend/routes/rbac.py`. Every gated action emits an audit
// event server-side via `/api/rbac/audit-gate` so denials are traceable.
//
// Usage:
//   const { role, can, AuthGate } = useRbac();
//   if (can("deal.create")) ...
//   <AuthGate permission="ticket.dispatch"><Button>Dispatch</Button></AuthGate>
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const API = process.env.REACT_APP_BACKEND_URL;
const STORAGE_KEY = "rbac_role";

export const ROLES = ["principal", "adviser", "paraplanner", "client"];

// Static mirror of backend/routes/rbac.py PERMISSION_MATRIX.
// Kept in sync deliberately so UI gates don't need a network round-trip.
const PERMISSION_MATRIX = {
  "client.view":             { principal: true,  adviser: true,  paraplanner: true,  client: true },
  "client.edit":             { principal: true,  adviser: true,  paraplanner: false, client: false },
  "client.delete":           { principal: true,  adviser: false, paraplanner: false, client: false },
  "deal.view":               { principal: true,  adviser: true,  paraplanner: true,  client: true },
  "deal.create":             { principal: true,  adviser: true,  paraplanner: true,  client: false },
  "deal.edit":               { principal: true,  adviser: true,  paraplanner: true,  client: false },
  "deal.stage_change":       { principal: true,  adviser: true,  paraplanner: false, client: false },
  "pack.create":             { principal: true,  adviser: true,  paraplanner: true,  client: false },
  "pack.dispatch":           { principal: true,  adviser: true,  paraplanner: false, client: false },
  "soa.send_to_client":      { principal: true,  adviser: true,  paraplanner: false, client: false },
  "soa.sign":                { principal: false, adviser: false, paraplanner: false, client: true },
  "ticket.dispatch":         { principal: true,  adviser: true,  paraplanner: false, client: false },
  "ticket.cancel":           { principal: true,  adviser: true,  paraplanner: false, client: false },
  "calculator.edit_algorithm": { principal: true, adviser: false, paraplanner: false, client: false },
  "calculator.run":          { principal: true,  adviser: true,  paraplanner: true,  client: true },
  "file.view":               { principal: true,  adviser: true,  paraplanner: true,  client: true },
  "file.upload":             { principal: true,  adviser: true,  paraplanner: true,  client: false },
  "file.delete":             { principal: true,  adviser: true,  paraplanner: false, client: false },
  "file.restore_version":    { principal: true,  adviser: true,  paraplanner: false, client: false },
  "firm.billing":            { principal: true,  adviser: false, paraplanner: false, client: false },
  "firm.settings":           { principal: true,  adviser: false, paraplanner: false, client: false },
  "webhook.manage":          { principal: true,  adviser: false, paraplanner: false, client: false },
  "rbac.manage":             { principal: true,  adviser: false, paraplanner: false, client: false },
};

const getRole = () => {
  try { return localStorage.getItem(STORAGE_KEY) || "adviser"; }
  catch { return "adviser"; }
};

export const setRole = (role) => {
  if (!ROLES.includes(role)) return;
  localStorage.setItem(STORAGE_KEY, role);
  window.dispatchEvent(new CustomEvent("rbac-role-changed", { detail: { role } }));
};

export const can = (role, permission) => {
  const m = PERMISSION_MATRIX[permission];
  if (!m) return false;
  return !!m[role];
};

// Server-side audit ping (fire-and-forget)
const auditGate = (role, permission, granted, targetKind, targetRef) => {
  try {
    fetch(`${API}/api/rbac/audit-gate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Role": role },
      body: JSON.stringify({ permission, role, granted, target_kind: targetKind, target_ref: targetRef }),
      keepalive: true,
    });
  } catch {}
};

// React hook
export const useRbac = () => {
  const [role, setRoleState] = useState(getRole());
  useEffect(() => {
    const onChange = (e) => setRoleState(e?.detail?.role || getRole());
    window.addEventListener("rbac-role-changed", onChange);
    return () => window.removeEventListener("rbac-role-changed", onChange);
  }, []);

  const check = useCallback((permission, opts = {}) => {
    const granted = can(role, permission);
    auditGate(role, permission, granted, opts.targetKind, opts.targetRef);
    return granted;
  }, [role]);

  const requireOrToast = useCallback((permission, opts = {}) => {
    const granted = check(permission, opts);
    if (!granted) toast.error("Not permitted", { description: `Your role (${role}) cannot ${permission}.` });
    return granted;
  }, [check, role]);

  return {
    role,
    setRole,
    can: check,
    requireOrToast,
    isPrincipal: role === "principal",
    isAdviser: role === "adviser",
    isClient: role === "client",
    permissions: Object.keys(PERMISSION_MATRIX).filter((p) => can(role, p)),
  };
};

// Render-prop component — hides children when the current role lacks the permission.
export const AuthGate = ({ permission, fallback = null, children }) => {
  const { role } = useRbac();
  if (!can(role, permission)) return fallback;
  return children;
};
