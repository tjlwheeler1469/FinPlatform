// RbacAdmin — permission matrix viewer + role switcher (demo).
import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, XCircle, UserCog } from "lucide-react";
import { useRbac, setRole, ROLES } from "@/lib/rbac";

// Static mirror — kept in sync with lib/rbac.js for the visual matrix
const PERMISSIONS = [
  ["Client data", ["client.view", "client.edit", "client.delete"]],
  ["Deals", ["deal.view", "deal.create", "deal.edit", "deal.stage_change"]],
  ["Advice docs", ["pack.create", "pack.dispatch", "soa.send_to_client", "soa.sign"]],
  ["Execution", ["ticket.dispatch", "ticket.cancel"]],
  ["Calculator", ["calculator.edit_algorithm", "calculator.run"]],
  ["Vault", ["file.view", "file.upload", "file.delete", "file.restore_version"]],
  ["Firm-wide", ["firm.billing", "firm.settings", "webhook.manage", "rbac.manage"]],
];

const ROLE_MATRIX = {
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

const Cell = ({ on }) => on ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" /> : <XCircle className="h-4 w-4 text-slate-300 mx-auto" />;

const RbacAdmin = () => {
  const { role: currentRole } = useRbac();
  const [showMatrix, setShowMatrix] = useState(true);

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto p-4 space-y-4" data-testid="rbac-admin">
        <Card>
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <Shield className="h-6 w-6 text-[#1a2744]" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#1a2744]">Role-Based Access Control</h1>
              <p className="text-xs text-muted-foreground">
                Current session role: <strong className="text-[#1a2744]">{currentRole}</strong> · Permission matrix below mirrors backend `routes/rbac.py`.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><UserCog className="h-4 w-4" /> Demo: switch role</CardTitle></CardHeader>
          <CardContent className="flex gap-2 pt-2 flex-wrap">
            {ROLES.map((r) => (
              <Button
                key={r}
                variant={currentRole === r ? "default" : "outline"}
                size="sm"
                onClick={() => setRole(r)}
                data-testid={`rbac-role-${r}`}
                className="capitalize"
              >
                {r}
              </Button>
            ))}
            <span className="text-[11px] text-muted-foreground self-center ml-2">
              In production this is set by your auth provider (JWT, OIDC, etc.). The frontend forwards it as `X-Role` on every API call.
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Permission matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm" data-testid="rbac-matrix">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wide text-slate-600">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} className={`px-3 py-2 text-center text-[10px] uppercase tracking-wide ${currentRole === r ? "bg-amber-50 text-amber-800 font-bold" : "text-slate-600"}`}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(([group, perms]) => (
                  <>
                    <tr key={group} className="bg-slate-100 border-t">
                      <td colSpan={5} className="px-3 py-1.5 text-[10px] uppercase tracking-wide font-bold text-slate-600">{group}</td>
                    </tr>
                    {perms.map((p) => (
                      <tr key={p} className="border-t hover:bg-slate-50">
                        <td className="px-3 py-1.5 text-[12px] font-mono text-[#1a2744]">{p}</td>
                        {ROLES.map((r) => (
                          <td key={r} className={`px-3 py-1.5 ${currentRole === r ? "bg-amber-50" : ""}`}>
                            <Cell on={ROLE_MATRIX[p]?.[r]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground italic text-center">
          Every gated action calls <code>/api/rbac/audit-gate</code> (success or denial) so the firm has a full server-side audit trail.
        </p>
      </div>
    </Layout>
  );
};

export default RbacAdmin;
