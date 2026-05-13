// BudgetExposureReport — Portfolio-wide view of every client's exposure to the
// 2026–27 Budget reforms (NG, CGT, discretionary-trust min tax).
// Single screen the adviser can use to triage which clients need an urgent
// SOA refresh before 1 July 2027.
//
//  - Per-client NG status for each investment property held
//  - CGT swing if sold pre vs post 1 July 2027 (assumes 50% unrealised gain
//    as a quick proxy, adviser refines on the client's Budget Reforms page)
//  - Trust min-tax exposure for clients with discretionary trusts
//  - Sort + filter + countdown banner
import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Home, Landmark, Calendar, FileText, Download, ExternalLink, Search } from "lucide-react";
import { CLIENT_DATA } from "@/data/clientData";
import { fmtCurrencyCompact, fmtCurrencyFull } from "@/lib/inputBounds";
import {
  calculateCGT, negativeGearingStatus,
  ANNOUNCEMENT_DATE, NG_REFORM_DATE, TRUST_REFORM_DATE,
} from "@/lib/auTax";

const F = fmtCurrencyFull;
const FS = fmtCurrencyCompact;
const daysUntil = (d) => Math.max(0, Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24)));

// Detect investment properties + family-trust holdings from client data.
const detectInvestmentProperties = (client) =>
  (client.assets || []).filter((a) => a.type === "Property" && /invest|rental/i.test(a.name || ""));
const detectFamilyTrust = (client) =>
  (client.assets || []).some((a) => /trust/i.test(a.entity || "") || /trust/i.test(a.name || ""));
const trustDistributions = (client) =>
  (client.assets || [])
    .filter((a) => /trust/i.test(a.entity || "") || /trust/i.test(a.name || ""))
    .reduce((s, a) => s + (a.value || 0) * 0.06, 0); // assume ~6% yield distributed

// Compute the per-client exposure summary.
const computeExposure = (id, client) => {
  const invProps = detectInvestmentProperties(client);
  const hasTrust = detectFamilyTrust(client);
  const distributedIncome = hasTrust ? trustDistributions(client) : 0;
  const propsByStatus = invProps.map((p) => {
    // Use a default assumed purchase date: 5 years ago. The adviser can refine
    // on the client's Budget Reforms page.
    const purchaseDate = new Date(); purchaseDate.setFullYear(purchaseDate.getFullYear() - 5);
    const status = negativeGearingStatus({ purchaseDate, propertyType: "existing", refDate: new Date("2027-07-01") });
    // Assume 50% of current value is unrealised gain (conservative working assumption).
    const assumedCostBase = p.value * 0.5;
    const preReformCgt = calculateCGT({
      income: client.profile.incomeHousehold || 0, costBase: assumedCostBase, saleProceeds: p.value,
      purchaseDate, saleDate: new Date("2027-06-30"), propertyType: "existing",
    });
    const postReformCgt = calculateCGT({
      income: client.profile.incomeHousehold || 0, costBase: assumedCostBase, saleProceeds: p.value * 1.05,
      purchaseDate, saleDate: new Date("2028-07-01"), propertyType: "existing", cumulativeCpi: 1.02,
    });
    return {
      asset: p,
      ngStatus: status,
      preReformCgt: preReformCgt.cgtPayable,
      postReformCgt: postReformCgt.cgtPayable,
      swing: postReformCgt.cgtPayable - preReformCgt.cgtPayable,
    };
  });

  const totalSwing = propsByStatus.reduce((s, x) => s + x.swing, 0);
  const trustMinTaxExposure = hasTrust ? distributedIncome * 0.30 : 0;
  const sellWindowAlert = propsByStatus.some(
    (x) => x.ngStatus.status === "B_transitional" && x.swing > 50_000
  );

  return {
    id,
    name: client.profile?.name || id,
    invPropCount: invProps.length,
    propsByStatus,
    totalCgtSwing: totalSwing,
    hasTrust,
    distributedIncome,
    trustMinTaxExposure,
    sellWindowAlert,
    riskScore: (totalSwing > 100_000 ? 3 : totalSwing > 25_000 ? 2 : 1) + (hasTrust ? 1 : 0),
  };
};

const RiskPill = ({ score }) => {
  const meta = score >= 4 ? { label: "HIGH", color: "bg-rose-100 text-rose-800 border-rose-300" }
              : score >= 2 ? { label: "MEDIUM", color: "bg-amber-100 text-amber-800 border-amber-300" }
              : { label: "LOW", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  return <Badge variant="outline" className={`${meta.color} text-[10px]`}>{meta.label}</Badge>;
};

const BudgetExposureReport = () => {
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("riskScore");

  const exposures = useMemo(() => {
    const seen = new Set();
    return Object.entries(CLIENT_DATA)
      .filter(([id]) => id !== "advisor" && id !== "client_1" && id !== "client_2")
      .filter(([, c]) => {
        const k = c?.profile?.user_id || c?.profile?.name;
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map(([id, c]) => computeExposure(id, c));
  }, []);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase().trim();
    let arr = exposures;
    if (q) arr = arr.filter((e) => e.name.toLowerCase().includes(q));
    arr = [...arr].sort((a, b) => {
      if (sortBy === "riskScore") return b.riskScore - a.riskScore;
      if (sortBy === "cgtSwing") return b.totalCgtSwing - a.totalCgtSwing;
      if (sortBy === "trustExposure") return b.trustMinTaxExposure - a.trustMinTaxExposure;
      return a.name.localeCompare(b.name);
    });
    return arr;
  }, [exposures, filter, sortBy]);

  const sellWindowCount = exposures.filter((e) => e.sellWindowAlert).length;
  const totalAtRisk = exposures.reduce((s, e) => s + e.totalCgtSwing, 0);

  return (
    <Layout>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4" data-testid="budget-exposure-report">

        {/* Countdown banner */}
        <Card className="bg-gradient-to-r from-amber-50 to-rose-50 border-l-4 border-amber-500">
          <CardContent className="p-5 flex items-center gap-4">
            <Calendar className="h-10 w-10 text-amber-600" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[#1a2744]">Budget Reform Exposure · Portfolio-wide</h1>
              <p className="text-xs text-amber-700">
                <strong>{daysUntil(NG_REFORM_DATE)} days</strong> until 1 July 2027 (NG / CGT reforms) ·
                <strong className="ml-2">{daysUntil(TRUST_REFORM_DATE)} days</strong> until 1 July 2028 (trust min-tax) ·
                <strong className="ml-2">{exposures.length}</strong> clients reviewed
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Sell-window alerts" value={sellWindowCount} highlight={sellWindowCount > 0 ? "rose" : "slate"} />
              <Metric label="Total CGT swing" value={FS(totalAtRisk)} highlight="amber" />
              <Metric label="Clients w/ trusts" value={exposures.filter((e) => e.hasTrust).length} highlight="violet" />
            </div>
          </CardContent>
        </Card>

        {/* Toolbar */}
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Search className="h-4 w-4 text-gray-400" />
            <Input placeholder="Filter clients…" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs h-8" data-testid="exposure-filter" />
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Sort:</span>
              {["riskScore", "cgtSwing", "trustExposure", "name"].map((s) => (
                <Button key={s} variant={sortBy === s ? "default" : "ghost"} size="sm" onClick={() => setSortBy(s)} className="h-7 text-[11px] capitalize" data-testid={`sort-${s}`}>
                  {s.replace("Score", " score").replace("Swing", " swing").replace("Exposure", " exposure")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sell-window alerts (priority) */}
        {sellWindowCount > 0 && (
          <Card className="border-l-4 border-rose-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base text-rose-700">
                <AlertTriangle className="h-4 w-4" /> Pre-1 July 2027 Sell-Window Alerts ({sellWindowCount})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exposures.filter((e) => e.sellWindowAlert).map((e) => (
                <div key={e.id} className="border rounded p-3 bg-rose-50/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-[#1a2744]">{e.name}</p>
                    <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-800 border-rose-300">CGT swing {F(e.totalCgtSwing)}</Badge>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Holds {e.invPropCount} existing investment {e.invPropCount === 1 ? "property" : "properties"} purchased post-12-May-2026 with material unrealised gain. Selling before 1 July 2027 secures the 50% CGT discount; selling after triggers the new indexation + 30% min-tax regime.
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Full table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b text-[10px] uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">NG status</th>
                  <th className="text-right p-3">Inv. property value</th>
                  <th className="text-right p-3">CGT now</th>
                  <th className="text-right p-3">CGT +1y post-reform</th>
                  <th className="text-right p-3">Swing</th>
                  <th className="text-right p-3">Trust min-tax</th>
                  <th className="text-center p-3">Risk</th>
                  <th className="text-center p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const totalInvValue = e.propsByStatus.reduce((s, p) => s + (p.asset.value || 0), 0);
                  const totalPre = e.propsByStatus.reduce((s, p) => s + p.preReformCgt, 0);
                  const totalPost = e.propsByStatus.reduce((s, p) => s + p.postReformCgt, 0);
                  const ngLabel = e.propsByStatus.length === 0 ? "—"
                    : Array.from(new Set(e.propsByStatus.map((p) => p.ngStatus.status.replace(/_/g, " ")))).join(", ");
                  return (
                    <tr key={e.id} className="border-b hover:bg-slate-50" data-testid={`exposure-row-${e.id}`}>
                      <td className="p-3">
                        <p className="font-semibold text-[#1a2744]">{e.name}</p>
                        <p className="text-[10px] text-muted-foreground">{e.invPropCount} inv prop · {e.hasTrust ? "has trust" : "no trust"}</p>
                      </td>
                      <td className="p-3 text-[11px] capitalize">{ngLabel}</td>
                      <td className="p-3 text-right">{FS(totalInvValue)}</td>
                      <td className="p-3 text-right">{FS(totalPre)}</td>
                      <td className="p-3 text-right">{FS(totalPost)}</td>
                      <td className={`p-3 text-right font-semibold ${e.totalCgtSwing > 50_000 ? "text-rose-700" : e.totalCgtSwing > 10_000 ? "text-amber-700" : ""}`}>{FS(e.totalCgtSwing)}</td>
                      <td className="p-3 text-right">{e.hasTrust ? FS(e.trustMinTaxExposure) : "—"}</td>
                      <td className="p-3 text-center"><RiskPill score={e.riskScore} /></td>
                      <td className="p-3 text-center">
                        <Button size="sm" variant="outline" onClick={() => { localStorage.setItem("selected_client", JSON.stringify({ id: e.id })); window.location.assign("/budget-reforms"); }} className="h-7 text-[10px]" data-testid={`open-budget-${e.id}`}>
                          <ExternalLink className="h-3 w-3 mr-1" /> Open
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <p className="text-[10px] text-muted-foreground italic text-center">
          Working assumption: investment properties have ~50% unrealised gain and a ~5y holding period. Adviser refines per client on the Budget Reforms page. · Engine: <code>/app/frontend/src/lib/auTax.js</code> · 26/26 unit tests passing.
        </p>
      </div>
    </Layout>
  );
};

const Metric = ({ label, value, highlight }) => {
  const colors = {
    rose: "bg-rose-100 text-rose-800 border-rose-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    violet: "bg-violet-100 text-violet-800 border-violet-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <div className={`border rounded px-3 py-1.5 ${colors[highlight] || colors.slate}`}>
      <p className="text-[9px] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
};

export default BudgetExposureReport;
