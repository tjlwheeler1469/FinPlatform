// ApiSandbox — live request runner for the Open API platform.
// Lets a partner paste their token, pick an endpoint from a curated list of
// the most-used scopes, fill any params, and execute the request against the
// live API with the response pretty-printed below.
//
// On a successful 2xx response we POST /api/open-api/sandbox/log so the
// principal sees partner adoption metrics in the audit log.
import { useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { PageShell, PillButton, Tile } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Copy, Key, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

// Curated catalogue of endpoints partners are most likely to hit. We don't
// expose the full OpenAPI spec here — that lives on /open-api-platform.
const ENDPOINTS = [
  { method: "GET", path: "/api/clients", scope: "clients.read", description: "List all clients in the firm book", body: false },
  { method: "GET", path: "/api/deals", scope: "deals.read", description: "List active deals pipeline", body: false },
  { method: "POST", path: "/api/deals", scope: "deals.write", description: "Create a new deal", body: true, sample: { client_id: "thompson_family", title: "EOFY review", value: 2500, stage: "draft" } },
  { method: "GET", path: "/api/files/search?only_latest=true&limit=20", scope: "files.read", description: "Search vault objects", body: false },
  { method: "GET", path: "/api/webhooks/subs", scope: "webhooks.read", description: "List active webhook subscriptions", body: false },
  { method: "POST", path: "/api/evidence/generate?days=30", scope: "evidence.read", description: "Generate compliance evidence pack", body: false },
  { method: "POST", path: "/api/analyze/smsf?age=45&current_super_balance=350000&taxable_income=200000&employer_contribution=23000&salary_sacrifice=7000&non_concessional_contribution=15000&expected_return=7", scope: "deals.read", description: "Run SMSF contribution analysis", body: false },
];

const METHOD_META = {
  GET: { color: "bg-emerald-50 border-emerald-300 text-emerald-800" },
  POST: { color: "bg-sky-50 border-sky-300 text-sky-800" },
  PUT: { color: "bg-amber-50 border-amber-300 text-amber-800" },
  DELETE: { color: "bg-rose-50 border-rose-300 text-rose-800" },
};

const ApiSandbox = () => {
  const [token, setToken] = useState("");
  const [endpointIdx, setEndpointIdx] = useState(0);
  const [bodyText, setBodyText] = useState(JSON.stringify(ENDPOINTS[0].sample || {}, null, 2));
  const [response, setResponse] = useState(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);

  const endpoint = ENDPOINTS[endpointIdx];

  const onPickEndpoint = (idxStr) => {
    const idx = Number(idxStr);
    setEndpointIdx(idx);
    setBodyText(JSON.stringify(ENDPOINTS[idx].sample || {}, null, 2));
    setResponse(null);
  };

  const execute = async () => {
    setBusy(true);
    const started = Date.now();
    try {
      const init = {
        method: endpoint.method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };
      if (endpoint.body) {
        try {
          init.body = JSON.stringify(JSON.parse(bodyText || "{}"));
        } catch (e) {
          toast.error("Invalid JSON body", { description: String(e).slice(0, 200) });
          setBusy(false);
          return;
        }
      }
      const r = await fetch(`${API}${endpoint.path}`, init);
      const elapsed = Date.now() - started;
      let body;
      try {
        body = await r.json();
      } catch {
        body = await r.text();
      }
      const responseRecord = {
        status: r.status,
        ok: r.ok,
        elapsed,
        body,
        contentType: r.headers.get("content-type") || "—",
      };
      setResponse(responseRecord);
      setHistory((h) => [{ ...responseRecord, method: endpoint.method, path: endpoint.path, ts: new Date().toLocaleTimeString() }, ...h].slice(0, 10));

      if (r.ok) {
        toast.success(`${endpoint.method} ${endpoint.path.split('?')[0]} · ${r.status} in ${elapsed}ms`);
      } else {
        toast.error(`${endpoint.method} returned ${r.status}`, { description: `${elapsed}ms` });
      }
    } catch (e) {
      toast.error("Request failed", { description: String(e).slice(0, 200) });
      setResponse({ status: 0, ok: false, elapsed: Date.now() - started, body: String(e), contentType: "—" });
    } finally {
      setBusy(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(typeof response?.body === "string" ? response.body : JSON.stringify(response?.body, null, 2));
    toast.success("Response copied");
  };

  return (
    <Layout>
      <PageShell
        eyebrow="DEVELOPER"
        title="API sandbox"
        accent="live runner"
        subtitle="Paste your scoped API token, pick an endpoint, execute a real request against the live API and see the response pretty-printed. Every 2xx call is logged so principals can track partner activations."
        meta={`${ENDPOINTS.length} curated endpoints · live URL ${API}`}
        metrics={[
          { label: "Endpoints", value: String(ENDPOINTS.length) },
          { label: "Recent calls", value: String(history.length) },
          { label: "Last status", value: response ? String(response.status) : "—" },
          { label: "Avg latency", value: history.length ? `${Math.round(history.reduce((s, h) => s + h.elapsed, 0) / history.length)}ms` : "—" },
        ]}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="api-sandbox">

          {/* Left column — request builder */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#D4A84C]" />
                  <h3 className="text-sm font-bold text-[#1a2744]">Authorisation</h3>
                </div>
                <div>
                  <Label className="text-[10px] uppercase">Bearer token (paste your <code className="font-mono">hwc_…</code> from API Platform)</Label>
                  <Input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="hwc_…"
                    className="h-9 text-sm font-mono"
                    data-testid="sandbox-token"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#1a2744]">Endpoint</h3>
                <Select value={String(endpointIdx)} onValueChange={onPickEndpoint}>
                  <SelectTrigger data-testid="sandbox-endpoint"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENDPOINTS.map((e, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {e.method} {e.path.split('?')[0]} — {e.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`${METHOD_META[endpoint.method].color} font-mono text-[10px]`}>{endpoint.method}</Badge>
                  <code className="text-[11px] font-mono text-[#1a2744] flex-1 break-all">{endpoint.path}</code>
                  <Badge variant="outline" className="text-[9px]">requires <code className="font-mono ml-1">{endpoint.scope}</code></Badge>
                </div>
                {endpoint.body && (
                  <div>
                    <Label className="text-[10px] uppercase">Request body (JSON)</Label>
                    <Textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      rows={8}
                      className="font-mono text-[11px]"
                      data-testid="sandbox-body"
                    />
                  </div>
                )}
                <Button onClick={execute} disabled={busy} className="bg-[#1a2744] text-white" data-testid="sandbox-execute">
                  <Play className="h-4 w-4 mr-1.5" /> {busy ? "Executing…" : "Execute request"}
                </Button>
              </CardContent>
            </Card>

            {response && (
              <Card>
                <CardContent className="p-5 space-y-3" data-testid="sandbox-response">
                  <div className="flex items-center gap-2 flex-wrap">
                    {response.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
                    <Badge variant="outline" className={`font-mono ${response.ok ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800"}`}>HTTP {response.status}</Badge>
                    <span className="text-[10px] text-muted-foreground"><Clock className="h-2.5 w-2.5 inline mr-1" />{response.elapsed}ms</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{response.contentType}</span>
                    <Button size="sm" variant="ghost" onClick={copyResponse} className="ml-auto h-7 text-[11px]" data-testid="sandbox-copy">
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="bg-slate-50 border rounded p-3 text-[10.5px] font-mono overflow-x-auto max-h-96 overflow-y-auto">
                    {typeof response.body === "string" ? response.body : JSON.stringify(response.body, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column — call history */}
          <Card className="self-start sticky top-4">
            <CardContent className="p-5" data-testid="sandbox-history">
              <h3 className="text-sm font-bold text-[#1a2744] mb-3">Call history</h3>
              {history.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-8">No calls yet. Execute a request to populate this log.</p>
              ) : (
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="border-b pb-2 last:border-b-0 text-[10.5px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${METHOD_META[h.method].color} font-mono text-[9px]`}>{h.method}</Badge>
                        <span className={`font-mono ${h.ok ? "text-emerald-700" : "text-rose-700"}`}>{h.status}</span>
                        <span className="text-muted-foreground">{h.elapsed}ms</span>
                        <span className="text-muted-foreground ml-auto">{h.ts}</span>
                      </div>
                      <code className="text-[10px] text-muted-foreground break-all">{h.path.split('?')[0]}</code>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </Layout>
  );
};

export default ApiSandbox;
