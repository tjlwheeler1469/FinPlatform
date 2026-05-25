// Xplan Sync Hub
// =============
// Unified dashboard exposing all 5 Xplan modules with Pull / Push controls.
// Each module surfaces the same data shape it would receive from a live
// Iress integration; without credentials the backend returns deterministic
// mock payloads (mode = "mock") so the platform is fully usable today.
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import {
  RefreshCw, Upload, Download, Database, Activity, Briefcase, BarChart3,
  FileText, Receipt, Users, FileSearch, ChevronRight, ShieldCheck,
  ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, History,
} from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

const fmt = (v) =>
  typeof v === "number" ? (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : v >= 1_000 ? `$${Math.round(v / 1_000)}k` : `$${v.toLocaleString()}`) : v;

const Stat = ({ label, value, hint }) => (
  <div className="border rounded p-3 bg-slate-50">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-base font-bold text-[#1a2744]">{value}</p>
    {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
  </div>
);

const ModeBadge = ({ mode }) => (
  <Badge variant="outline" className={mode === "live" ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}>
    {mode === "live" ? "Live · Iress" : "Mock · Dev"}
  </Badge>
);

const fetchJson = async (url, init) => {
  const r = await fetch(`${API}${url}`, init);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

const XplanSyncHub = () => {
  const [clientId, setClientId] = useState(() => getActiveClientId() || "thompson_family");
  const [tab, setTab] = useState("core");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});

  const load = async (key, url, init) => {
    setLoading((s) => ({ ...s, [key]: true }));
    try {
      const v = await fetchJson(url, init);
      setData((s) => ({ ...s, [key]: v }));
    } catch (e) {
      toast.error(`Load failed: ${key}`, { description: String(e).slice(0, 120) });
    } finally {
      setLoading((s) => ({ ...s, [key]: false }));
    }
  };

  // Auto-load relevant data when a tab is opened or client changes.
  useEffect(() => {
    if (tab === "core") {
      load("cases", `/api/xplan-sync/case-manager/${clientId}`);
      load("oppos", `/api/xplan-sync/opportunities`);
    } else if (tab === "xtools") {
      load("calm", `/api/xplan-sync/xtools/calm/${clientId}/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ years: 30 }) });
      load("agedcare", `/api/xplan-sync/xtools/aged-care/${clientId}/model`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      load("retirement", `/api/xplan-sync/xtools/retirement-income/${clientId}/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    } else if (tab === "wealthsolver") {
      load("ws_super", `/api/xplan-sync/wealthsolver/products?category=super`);
      load("ws_ins", `/api/xplan-sync/wealthsolver/insurance-in-super`);
    } else if (tab === "ips") {
      load("perf", `/api/xplan-sync/ips/${clientId}/performance?period=ytd`);
      load("alloc", `/api/xplan-sync/ips/${clientId}/allocation`);
      load("cgt", `/api/xplan-sync/ips/${clientId}/cgt`);
      load("corpact", `/api/xplan-sync/ips/${clientId}/corporate-actions`);
    } else if (tab === "reporting") {
      load("val", `/api/xplan-sync/reporting/${clientId}/valuation`, { method: "POST" });
      load("commpay", `/api/xplan-sync/reporting/commpay`);
    } else if (tab === "synclog") {
      load("synclog", `/api/xplan-sync/log?limit=100`);
      load("xmerge_tokens", `/api/xplan-sync/xmerge/tokens`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, clientId]);

  const pushCompliance = async () => {
    try {
      const r = await fetchJson(`/api/xplan-sync/compliance/push`, { method: "POST" });
      toast.success(`Compliance pushed (${r.mode})`, { description: `${r.metrics?.total ?? 0} files · ${r.metrics?.compliance_rate ?? 0}% compliant` });
      load("synclog", `/api/xplan-sync/log?limit=100`);
    } catch (e) { toast.error("Push failed", { description: String(e).slice(0, 120) }); }
  };

  const pullCompliance = async () => {
    try {
      const r = await fetchJson(`/api/xplan-sync/compliance/pull`, { method: "POST" });
      toast.success(`Pulled ${r.items_pulled} GRC flag${r.items_pulled === 1 ? "" : "s"} (${r.mode})`);
      load("synclog", `/api/xplan-sync/log?limit=100`);
    } catch (e) { toast.error("Pull failed", { description: String(e).slice(0, 120) }); }
  };

  const syncFeeds = async () => {
    try {
      const r = await fetchJson(`/api/xplan-sync/ips/${clientId}/sync-feeds`, { method: "POST" });
      toast.success(`IPS feeds synced (${r.mode})`, { description: `${r.transactions_imported} transactions, ${r.prices_updated} prices` });
    } catch (e) { toast.error("Sync failed", { description: String(e).slice(0, 120) }); }
  };

  const generateFds = async () => {
    try {
      const r = await fetchJson(`/api/xplan-sync/reporting/${clientId}/fds`, { method: "POST" });
      toast.success(`FDS generated (${r.mode})`, { description: `Ref: ${r.fds_pdf_ref}` });
    } catch (e) { toast.error("FDS failed", { description: String(e).slice(0, 120) }); }
  };

  const ModuleHeader = ({ icon: Icon, title, subtitle, mode, children }) => (
    <div className="flex items-start gap-3 mb-3 flex-wrap">
      <div className="h-10 w-10 rounded-md bg-[#3B9CDC]/10 flex items-center justify-center"><Icon className="h-5 w-5 text-[#3B9CDC]" /></div>
      <div className="flex-1 min-w-[260px]">
        <h2 className="text-base font-bold text-[#1a2744]">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {mode && <ModeBadge mode={mode} />}
      {children}
    </div>
  );

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto p-4 space-y-4" data-testid="xplan-sync-hub">
        <Card>
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <Database className="h-6 w-6 text-[#3B9CDC]" />
            <div className="flex-1 min-w-[260px]">
              <h1 className="text-xl font-bold text-[#1a2744]">Xplan Sync Hub</h1>
              <p className="text-xs text-muted-foreground">Push & Pull across all 5 Xplan modules · Core · Xtools+ · WealthSolver · IPS · Reporting</p>
            </div>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="text-sm border rounded px-2 py-1 bg-white" data-testid="hub-client-select">
              {Object.entries(CLIENT_DATA).filter(([k]) => k !== "advisor").map(([id, c]) => (
                <option key={id} value={id}>{c?.profile?.name || id}</option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="core" data-testid="hub-tab-core"><Users className="h-3.5 w-3.5 mr-1" /> Core CRM</TabsTrigger>
            <TabsTrigger value="xtools" data-testid="hub-tab-xtools"><Activity className="h-3.5 w-3.5 mr-1" /> Xtools+</TabsTrigger>
            <TabsTrigger value="wealthsolver" data-testid="hub-tab-wealthsolver"><Briefcase className="h-3.5 w-3.5 mr-1" /> WealthSolver</TabsTrigger>
            <TabsTrigger value="ips" data-testid="hub-tab-ips"><BarChart3 className="h-3.5 w-3.5 mr-1" /> IPS</TabsTrigger>
            <TabsTrigger value="reporting" data-testid="hub-tab-reporting"><FileText className="h-3.5 w-3.5 mr-1" /> Reporting</TabsTrigger>
            <TabsTrigger value="synclog" data-testid="hub-tab-synclog"><History className="h-3.5 w-3.5 mr-1" /> Sync Log</TabsTrigger>
          </TabsList>

          {/* MODULE 1 — Core */}
          <TabsContent value="core" className="space-y-4 mt-3">
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={Users} title="Case Manager" subtitle="Active advice instances with benchmark completion (file notes · research · modeling · SOA)" mode={data.cases?.mode} />
                <div className="space-y-2">
                  {(data.cases?.cases || []).map((c) => (
                    <div key={c.id} className="border rounded p-3 hover:bg-slate-50">
                      <div className="flex items-center justify-between mb-2">
                        <div><p className="font-semibold text-sm">{c.title}</p><p className="text-[10px] text-muted-foreground">{c.id} · Stage: {c.stage} · Due {c.due}</p></div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(c.benchmarks).map(([k, v]) => (
                          <div key={k} className="text-center"><p className="text-[10px] uppercase text-muted-foreground">{k.replace("_", " ")}</p><p className="text-sm font-bold">{v}%</p></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={Briefcase} title="Opportunities Hub" subtitle="Lead pipeline · projected revenue" mode={data.oppos?.mode} />
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="text-left py-2">Client</th><th className="text-left">Stage</th><th className="text-right">Value</th><th className="text-right">Probability</th><th className="text-right">Close</th></tr></thead>
                  <tbody>
                    {(data.oppos?.deals || []).map((d) => (
                      <tr key={d.id} className="border-t"><td className="py-2 font-medium">{d.client_name}</td><td>{d.stage}</td><td className="text-right">{fmt(d.value)}</td><td className="text-right">{d.probability}%</td><td className="text-right text-muted-foreground">{d.expected_close}</td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODULE 2 — Xtools+ */}
          <TabsContent value="xtools" className="space-y-4 mt-3">
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={Activity} title="CALM (Cash Flow, Assets & Liabilities)" subtitle="Multi-year holistic projection with Auto Allocation" mode={data.calm?.mode} />
                {data.calm?.result && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Years modelled" value={data.calm.years} />
                    <Stat label="Lifestyle score" value={data.calm.result.lifestyle_score} />
                    <Stat label="Super at year 30" value={fmt(data.calm.result.super_at_year_end[data.calm.years - 1])} />
                    <Stat label="Debt at year 30" value={fmt(data.calm.result.debt_at_year_end[data.calm.years - 1])} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={FileSearch} title="Aged Care Modelling" subtitle={data.agedcare?.regulator} mode={data.agedcare?.mode} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(data.agedcare?.scenarios || []).map((s, i) => (
                    <div key={i} className="border rounded p-3"><p className="text-xs font-semibold mb-1">{s.option}</p>{s.rad ? <p className="text-[11px]">RAD: {fmt(s.rad)}</p> : null}{s.dap_pa ? <p className="text-[11px]">DAP/yr: {fmt(s.dap_pa)}</p> : null}<p className="text-[11px]">Means-tested: {fmt(s.means_tested_fee_pa)}/yr</p></div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={Activity} title="Retirement Income Tool 2026" subtitle="Decumulation strategy comparison" mode={data.retirement?.mode} />
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="text-left">Strategy</th><th className="text-right">Income p.a.</th><th className="text-right">Longevity</th><th className="text-right">Confidence</th></tr></thead>
                  <tbody>{(data.retirement?.strategies || []).map((s, i) => <tr key={i} className="border-t"><td className="py-2">{s.name}</td><td className="text-right">{fmt(s.income_pa)}</td><td className="text-right">{s.longevity_yrs} yrs</td><td className="text-right font-semibold">{s.confidence}%</td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODULE 3 — WealthSolver */}
          <TabsContent value="wealthsolver" className="space-y-4 mt-3">
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={Briefcase} title="Product Benchmarking — Super (top 6 of 890+)" subtitle="Fees · 5y returns · ratings" mode={data.ws_super?.mode} />
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="text-left">Product</th><th className="text-right">Fee p.a.</th><th className="text-right">5y return</th><th className="text-right">Rating</th></tr></thead>
                  <tbody>{(data.ws_super?.results || []).map((p, i) => <tr key={i} className="border-t"><td className="py-2 font-medium">{p.name}</td><td className="text-right">{p.fee_pa_pct}%</td><td className="text-right text-emerald-700">{p["5yr_return_pct"]}%</td><td className="text-right">{"★".repeat(p.rating)}</td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={FileSearch} title="Insurance Inside Super" subtitle="Cover comparison" mode={data.ws_ins?.mode} />
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="text-left">Fund</th><th className="text-right">Death</th><th className="text-right">TPD</th><th className="text-right">IP / mo</th><th className="text-right">Premium p.a.</th></tr></thead>
                  <tbody>{(data.ws_ins?.policies || []).map((p, i) => <tr key={i} className="border-t"><td className="py-2 font-medium">{p.fund}</td><td className="text-right">{fmt(p.death)}</td><td className="text-right">{fmt(p.tpd)}</td><td className="text-right">{fmt(p.ip_monthly)}</td><td className="text-right">{fmt(p.premium_pa)}</td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODULE 4 — IPS */}
          <TabsContent value="ips" className="space-y-4 mt-3">
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={BarChart3} title="IPS Performance & Allocation" subtitle="IRR · TWR · benchmark · drift" mode={data.perf?.mode}>
                  <Button size="sm" variant="outline" onClick={syncFeeds} className="border-[#3B9CDC] text-[#3B9CDC]"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Sync Feeds</Button>
                </ModuleHeader>
                {data.perf && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <Stat label="IRR" value={`${data.perf.irr_pct}%`} />
                    <Stat label="TWR" value={`${data.perf.twr_pct}%`} />
                    <Stat label="Benchmark" value={`${data.perf.benchmark_pct}%`} />
                    <Stat label="Alpha" value={`+${data.perf.alpha_pct}%`} />
                  </div>
                )}
                {data.alloc && (
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Allocation drift (current vs target)</p>
                    <div className="space-y-1">
                      {Object.keys(data.alloc.current).map((k) => (
                        <div key={k} className="flex items-center gap-3 text-xs">
                          <span className="w-32">{k}</span>
                          <span className="font-bold w-12 text-right">{data.alloc.current[k]}%</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="w-12 text-right">{data.alloc.target[k]}%</span>
                          <span className={`text-[10px] ${Math.abs(data.alloc.current[k] - data.alloc.target[k]) > data.alloc.drift_pct_max ? "text-rose-600 font-bold" : "text-emerald-600"}`}>
                            ({data.alloc.current[k] - data.alloc.target[k] > 0 ? "+" : ""}{data.alloc.current[k] - data.alloc.target[k]}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={Receipt} title="Capital Gains Tax (CGT)" subtitle="Realised + unrealised + carry-forward" mode={data.cgt?.mode} />
                {data.cgt && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Realised FYTD" value={fmt(data.cgt.realised_fytd)} />
                    <Stat label="Unrealised" value={fmt(data.cgt.unrealised)} />
                    <Stat label="Discount eligible" value={`${data.cgt.discount_eligible_pct}%`} />
                    <Stat label="Loss carry-fwd" value={fmt(data.cgt.loss_carry_forward)} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={Activity} title="Corporate Actions" subtitle="Dividends · returns of capital · splits" mode={data.corpact?.mode} />
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="text-left">Holding</th><th className="text-left">Type</th><th className="text-right">Per unit</th><th className="text-right">Ex-date</th></tr></thead>
                  <tbody>{(data.corpact?.events || []).map((e, i) => <tr key={i} className="border-t"><td className="py-2 font-medium">{e.holding}</td><td>{e.type}</td><td className="text-right">${e.amount_per_unit.toFixed(2)}</td><td className="text-right text-muted-foreground">{e.ex_date}</td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODULE 5 — Reporting */}
          <TabsContent value="reporting" className="space-y-4 mt-3">
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={FileText} title="Valuation Wizard" subtitle="Instant portfolio valuation for the meeting" mode={data.val?.mode} />
                {data.val && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Portfolio value" value={fmt(data.val.portfolio_value)} />
                    <Stat label="Cash position" value={fmt(data.val.cash_position)} />
                    <Stat label="Today's movement" value={fmt(data.val.market_movement_today)} />
                    <Stat label="% movement" value={`${data.val.market_movement_pct}%`} />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={FileText} title="Fee Disclosure Statement (FDS)" subtitle="Annual disclosure required under FOFA" mode={data.commpay?.mode}>
                  <Button size="sm" variant="outline" onClick={generateFds} className="border-[#3B9CDC] text-[#3B9CDC]"><FileText className="h-3.5 w-3.5 mr-1" /> Generate FDS</Button>
                </ModuleHeader>
                <p className="text-xs text-muted-foreground">Auto-generated from recorded revenue + service agreement. Click <em>Generate FDS</em> to produce the latest period.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={Receipt} title="CommPay" subtitle="Adviser remuneration & invoice payments" mode={data.commpay?.mode} />
                {data.commpay && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Month" value={data.commpay.month} />
                    <Stat label="Revenue MTD" value={fmt(data.commpay.revenue_to_date)} />
                    <Stat label="Open invoices" value={data.commpay.invoices_outstanding} />
                    <Stat label="Outstanding" value={fmt(data.commpay.outstanding_total)} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODULE 6 — Firm-level Sync Log + push/pull audit trail */}
          <TabsContent value="synclog" className="space-y-4 mt-3">
            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={ShieldCheck} title="Compliance push & pull" subtitle="Firm-level snapshot to Xplan GRC + inbound pull of external breach flags" mode={data.synclog?.mode}>
                  <Button size="sm" variant="outline" onClick={pushCompliance} className="border-emerald-500 text-emerald-700" data-testid="hub-push-compliance">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> Push compliance
                  </Button>
                  <Button size="sm" variant="outline" onClick={pullCompliance} className="border-sky-500 text-sky-700" data-testid="hub-pull-compliance">
                    <ArrowDownLeft className="h-3.5 w-3.5 mr-1" /> Pull compliance
                  </Button>
                </ModuleHeader>
                <p className="text-[11px] text-muted-foreground">
                  Every push aggregates `compliance_documents` and writes a `direction=push` row to the audit log. Every pull surfaces external GRC flags as pending-review rows in the Compliance Dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                {(() => {
                  // Normalize tokens — backend returns either an array or an
                  // object map; we coerce to an array for safe rendering.
                  const raw = data.xmerge_tokens?.tokens;
                  const tokenList = Array.isArray(raw)
                    ? raw
                    : (raw && typeof raw === "object")
                      ? Object.entries(raw).map(([name, placeholder]) => ({ name, placeholder, description: placeholder }))
                      : [];
                  return (
                    <>
                      <ModuleHeader icon={FileSearch} title="Xmerge token catalogue" subtitle={`${tokenList.length} merge tokens registered for SOA / ROA / FSG generation`} mode={data.xmerge_tokens?.mode} />
                      {tokenList.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {tokenList.slice(0, 12).map((t, i) => (
                            <div key={i} className="border rounded p-2 bg-slate-50">
                              <p className="text-[11px] font-mono text-[#1a2744]">{t.token || t.name || String(t)}</p>
                              {(t.description || t.placeholder) && <p className="text-[10px] text-muted-foreground mt-0.5">{t.description || t.placeholder}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                      {tokenList.length > 12 && (
                        <p className="text-[10px] text-muted-foreground mt-2">… and {tokenList.length - 12} more</p>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <ModuleHeader icon={History} title={`Delivery audit log (${(data.synclog?.entries || []).length} events)`} subtitle="Every push and pull to / from Xplan — fully replayable" mode={data.synclog?.mode}>
                  <Button size="sm" variant="outline" onClick={() => load("synclog", `/api/xplan-sync/log?limit=100`)}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</Button>
                </ModuleHeader>
                {(data.synclog?.entries || []).length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">No sync events recorded yet. Use the Push / Pull buttons above to populate this log.</p>
                ) : (
                  <div className="divide-y" data-testid="hub-sync-log">
                    {(data.synclog?.entries || []).map((e, i) => {
                      const DirIcon = e.direction === "push" ? ArrowUpRight : ArrowDownLeft;
                      const dirColor = e.direction === "push" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-sky-300 text-sky-700 bg-sky-50";
                      return (
                        <div key={i} className="py-2 flex items-center gap-2 flex-wrap text-[12px]" data-testid={`hub-event-${i}`}>
                          <Badge variant="outline" className={`${dirColor} text-[10px] gap-1`}><DirIcon className="h-3 w-3" />{e.direction}</Badge>
                          <Badge variant="outline" className="text-[10px]">{e.module || "compliance"}</Badge>
                          <span className="text-muted-foreground">
                            {e.metrics && (<>total <strong>{e.metrics.total ?? 0}</strong> · {e.metrics.compliance_rate ?? 0}% compliant</>)}
                            {e.items_pulled !== undefined && (<>pulled <strong>{e.items_pulled}</strong></>)}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-auto"><Clock className="h-2.5 w-2.5 inline mr-1" />{e.ts ? new Date(e.ts).toLocaleString() : "—"}</span>
                          {e.mode === "live" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700">MOCK</Badge>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-[10px] text-muted-foreground text-center">
              Set <code>XPLAN_API_KEY</code> in the backend <code>.env</code> to flip every adapter from MOCK → LIVE — no other code changes required.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default XplanSyncHub;
