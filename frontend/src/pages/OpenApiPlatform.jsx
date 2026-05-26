// OpenApiPlatform — developer self-serve for partner integrations.
//
// Lets a Principal adviser:
//   1. Browse the available permission scopes (9 across 5 categories).
//   2. Issue a scoped, hashed API token (plaintext shown ONCE).
//   3. Revoke an existing token with full audit trail.
//   4. Download the OpenAPI 3.1 spec for auto-generating partner SDKs.
//
// Wires to /api/open-api/* (see backend routes/open_api.py).
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { PageShell, PillButton, Tile } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Key, Plus, Copy, Trash2, FileCode, Download, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("en-AU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const OpenApiPlatform = () => {
  const [tokens, setTokens] = useState([]);
  const [scopes, setScopes] = useState({ scopes: [], categories: {} });
  const [showIssue, setShowIssue] = useState(false);
  const [newName, setNewName] = useState("");
  const [newScopes, setNewScopes] = useState([]);
  const [issuedToken, setIssuedToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [tokensRes, scopesRes] = await Promise.all([
        fetch(`${API}/api/open-api/tokens`),
        fetch(`${API}/api/open-api/scopes`),
      ]);
      setTokens(((await tokensRes.json()).tokens) || []);
      setScopes(await scopesRes.json());
    } catch (e) {
      toast.error("Failed to load API platform", { description: String(e).slice(0, 200) });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const issueToken = async () => {
    if (!newName.trim()) { toast.warning("Give the token a friendly name first"); return; }
    if (newScopes.length === 0) { toast.warning("Pick at least one scope"); return; }
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/open-api/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, scopes: newScopes }),
      });
      if (!r.ok) throw new Error((await r.json())?.detail || `HTTP ${r.status}`);
      const out = await r.json();
      setIssuedToken(out.token);
      toast.success("Token issued — copy it now", { description: out.warning, duration: 9000 });
      setNewName("");
      setNewScopes([]);
      setShowIssue(false);
      refresh();
    } catch (e) {
      toast.error("Issue failed", { description: String(e).slice(0, 200) });
    } finally { setBusy(false); }
  };

  const revokeToken = async (tokenId) => {
    if (!window.confirm(`Revoke token ${tokenId}? Any partner using it will lose access immediately.`)) return;
    try {
      const r = await fetch(`${API}/api/open-api/tokens/${tokenId}/revoke`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      toast.success("Token revoked", { description: `${tokenId} can no longer be used.` });
      refresh();
    } catch (e) {
      toast.error("Revoke failed", { description: String(e).slice(0, 200) });
    }
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadSpec = async () => {
    try {
      const r = await fetch(`${API}/api/open-api/spec`);
      const spec = await r.json();
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "halcyon-wealth-openapi.json"; a.click();
      URL.revokeObjectURL(url);
      toast.success("OpenAPI spec downloaded", { description: `${Object.keys(spec.paths || {}).length} endpoints documented. Feed to openapi-typescript-codegen.` });
    } catch (e) { toast.error("Download failed", { description: String(e).slice(0, 200) }); }
  };

  const activeCount = useMemo(() => tokens.filter((t) => !t.revoked_at).length, [tokens]);
  const revokedCount = tokens.length - activeCount;

  return (
    <Layout>
      <PageShell
        eyebrow="DEVELOPERS"
        title="Open API platform"
        accent={tokens.length ? `${activeCount} active` : "ready"}
        subtitle="Self-serve API tokens with granular permission scopes. HMAC-hashed at rest, audit-logged on every issue / revoke, and instantly downloadable as an OpenAPI 3.1 spec for partner SDK generation."
        meta={`${scopes.count || 0} permission scopes across ${Object.keys(scopes.categories || {}).length} resource categories`}
        metrics={[
          { label: "Active tokens", value: String(activeCount) },
          { label: "Revoked", value: String(revokedCount), hint: "audit retained" },
          { label: "Scopes", value: String(scopes.count || 0) },
          { label: "Categories", value: String(Object.keys(scopes.categories || {}).length) },
        ]}
        actions={(
          <>
            <PillButton variant="ghost" onClick={downloadSpec} data-testid="api-download-spec">
              <FileCode className="h-3.5 w-3.5 inline mr-1.5" /> Download OpenAPI
            </PillButton>
            <PillButton onClick={() => setShowIssue((v) => !v)} data-testid="api-issue-toggle">
              <Plus className="h-3.5 w-3.5 inline mr-1.5" /> Issue token
            </PillButton>
          </>
        )}
      >
        <div className="space-y-4" data-testid="open-api-platform">

          {/* Show newly-issued plaintext token ONCE */}
          {issuedToken && (
            <Card className="border-2 border-amber-400 bg-amber-50" data-testid="issued-token-banner">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  <p className="text-sm font-bold text-amber-900">New token — copy it now. It will not be shown again.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-amber-300 rounded p-2 font-mono text-[11px] break-all">
                  <span className="flex-1">{issuedToken}</span>
                  <Button size="sm" variant="ghost" onClick={() => copy(issuedToken)} className="h-7 flex-shrink-0" data-testid="copy-issued-token">
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <Button size="sm" variant="outline" onClick={() => setIssuedToken(null)} className="h-7 text-[11px]" data-testid="dismiss-issued-token">
                  I&apos;ve saved it — dismiss
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Issue panel */}
          {showIssue && (
            <Card>
              <CardContent className="p-5 space-y-4" data-testid="issue-panel">
                <h3 className="text-sm font-bold text-[#1a2744] flex items-center gap-2"><Key className="h-4 w-4 text-[#D4A84C]" /> Issue new API token</h3>
                <div>
                  <Label className="text-[10px] uppercase">Friendly name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Mortgage Choice integration" className="h-9 text-sm" data-testid="new-token-name" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase mb-2 block">Scopes ({newScopes.length} selected)</Label>
                  <div className="space-y-3">
                    {Object.entries(scopes.categories || {}).map(([cat, list]) => (
                      <div key={cat}>
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">{cat}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                          {list.map((s) => (
                            <label key={s.key} className="flex items-center gap-2 text-[12px] border rounded p-2 hover:bg-slate-50 cursor-pointer" data-testid={`scope-${s.key.replace(/\./g, "-")}`}>
                              <Checkbox
                                checked={newScopes.includes(s.key)}
                                onCheckedChange={(c) => setNewScopes((v) => c ? [...v, s.key] : v.filter((x) => x !== s.key))}
                              />
                              <span><code className="text-[10px] text-slate-500">{s.key}</code><br />{s.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={issueToken} disabled={busy} className="bg-[#1a2744] text-white" data-testid="issue-confirm">
                    {busy ? "Issuing…" : "Issue token"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowIssue(false); setNewScopes([]); setNewName(""); }}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token list */}
          <Card>
            <CardContent className="p-0" data-testid="token-list">
              <div className="p-3 border-b flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1a2744]" />
                <p className="text-sm font-semibold">Tokens ({tokens.length})</p>
              </div>
              {tokens.length === 0 && !loading && (
                <p className="text-center text-xs text-muted-foreground py-10">No tokens issued yet. Click <strong>Issue token</strong> to create one.</p>
              )}
              {tokens.map((t) => (
                <div key={t.token_id} className="border-t p-3 flex items-start gap-3 flex-wrap" data-testid={`token-${t.token_id}`}>
                  <Key className={`h-4 w-4 mt-1 ${t.revoked_at ? "text-slate-300" : "text-[#D4A84C]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a2744]">{t.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{t.token_prefix}…  ·  {t.token_id}</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {(t.scopes || []).map((s) => <Badge key={s} variant="outline" className="text-[9px] font-mono">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="text-[10px] text-right text-muted-foreground">
                    <p>Issued {fmtDate(t.created_at)}</p>
                    <p>Used {t.use_count || 0} times</p>
                    {t.revoked_at && <p className="text-rose-700">Revoked {fmtDate(t.revoked_at)}</p>}
                  </div>
                  {!t.revoked_at && (
                    <Button size="sm" variant="ghost" onClick={() => revokeToken(t.token_id)} className="h-7 text-rose-600" data-testid={`revoke-${t.token_id}`}>
                      <Trash2 className="h-3 w-3 mr-1" /> Revoke
                    </Button>
                  )}
                  {t.revoked_at && <Badge variant="outline" className="text-[9px] bg-rose-50 border-rose-200 text-rose-700">REVOKED</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> Tokens are SHA-256 hashed at rest. Every issue + revoke is logged to <code className="font-mono">rbac_audit</code>. Use the OpenAPI download to generate partner SDKs in TypeScript / Python / Go.
          </p>
        </div>
      </PageShell>
    </Layout>
  );
};

export default OpenApiPlatform;
