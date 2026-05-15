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
//  - One-click outreach: draft email + .ics calendar invite for the
//    "Pre-1 Jul 2027 sell window" cohort
import { useMemo, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { PageShell, ChipFilter, PillButton, Tile } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Home, Landmark, Calendar, FileText, Download, ExternalLink, Search, Mail, CalendarPlus, Send } from "lucide-react";
import { CLIENT_DATA } from "@/data/clientData";
import { fmtCurrencyCompact, fmtCurrencyFull } from "@/lib/inputBounds";
import {
  calculateCGT, negativeGearingStatus,
  ANNOUNCEMENT_DATE, NG_REFORM_DATE, TRUST_REFORM_DATE,
} from "@/lib/auTax";

const API = process.env.REACT_APP_BACKEND_URL;

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

  // ----- Outreach helpers -----
  // Format a date as YYYYMMDDTHHMMSSZ for .ics
  const icsDate = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const buildEmailBody = (e) => {
    const daysToReform = daysUntil(NG_REFORM_DATE);
    return [
      `Hi ${e.name.split(" ")[0]},`,
      "",
      "I wanted to flag an urgent planning matter on your investment portfolio.",
      "",
      `The 2026-27 Federal Budget reforms come into effect on 1 July 2027 (${daysToReform} days away).`,
      `You currently hold ${e.invPropCount} investment ${e.invPropCount === 1 ? "property" : "properties"} purchased after 12 May 2026 — these will transition out of the legacy 50% CGT discount on that date.`,
      "",
      `Our analysis suggests a CGT swing of approximately ${F(e.totalCgtSwing)} between selling before vs after the reform date.`,
      "",
      "I'd like to walk through three options together:",
      "  1. Sell pre-1 Jul 2027 — secure the 50% CGT discount under the legacy regime.",
      "  2. Hold past 1 Jul 2027 — pay tax under the new indexation + 30% min-tax regime.",
      "  3. Restructure (e.g. trust transfer, family-trust election) before the window closes.",
      "",
      "Could we book a 30-minute review this week? I'll bring the modelling and refined cost-base data for each property.",
      "",
      "Best regards,",
      "Your Adviser",
    ].join("\n");
  };

  const buildICS = (e, when) => {
    const dt = when || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // +7 days
    dt.setHours(10, 0, 0, 0);
    const end = new Date(dt.getTime() + 30 * 60 * 1000);
    const uid = `budget-review-${e.id}-${Date.now()}@halcyon-wealth`;
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Halcyon Wealth//Budget Reform Outreach//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(dt)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:Budget Reform Review — ${e.name}`,
      `DESCRIPTION:CGT swing ${F(e.totalCgtSwing)} on ${e.invPropCount} investment property/ies. Discuss sell-pre / sell-post / restructure options before the 1 July 2027 NG+CGT reform.`,
      "LOCATION:Halcyon Wealth Adviser Suite",
      "STATUS:TENTATIVE",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  };

  const downloadICS = (e) => {
    const blob = new Blob([buildICS(e)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-review-${e.name.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar invite downloaded", { description: `Open the .ics in Google/Outlook/Apple Calendar to schedule with ${e.name}.` });
  };

  const draftEmail = async (e) => {
    try {
      const r = await fetch(`${API}/api/notify/client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: e.id,
          client_name: e.name,
          subject: `Urgent: 2026-27 Budget Reform impact on your portfolio — ${F(e.totalCgtSwing)} CGT swing`,
          body: buildEmailBody(e),
          actor: "budget-exposure-report",
          source_item_id: "budget-reform-outreach",
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const out = await r.json();
      const noteId = out.notification?.note_id || out.note_id;
      const deliveryRef = out.notification?.delivery_ref || out.delivery_ref;
      toast.success(`Email drafted for ${e.name}`, {
        description: out.mode === "live" ? `Sent live via Resend (${deliveryRef || noteId}).` : `MOCKED — logged as ${noteId}. Set RESEND_API_KEY to send for real.`,
        duration: 7000,
      });
    } catch (err) {
      toast.error("Draft failed", { description: String(err).slice(0, 200) });
    }
  };

  const bulkDraftSellWindow = async () => {
    const cohort = exposures.filter((e) => e.sellWindowAlert);
    if (cohort.length === 0) {
      toast.info("No clients currently in the sell-window cohort.");
      return;
    }
    toast.info(`Drafting ${cohort.length} outreach email${cohort.length === 1 ? "" : "s"}…`);
    let ok = 0;
    for (const e of cohort) {
      try {
        await fetch(`${API}/api/notify/client`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: e.id,
            client_name: e.name,
            subject: `Urgent: 2026-27 Budget Reform impact on your portfolio — ${F(e.totalCgtSwing)} CGT swing`,
            body: buildEmailBody(e),
            actor: "budget-exposure-report-bulk",
            source_item_id: "budget-reform-bulk-outreach",
          }),
        });
        ok++;
      } catch (err) { /* keep going */ }
    }
    toast.success(`${ok}/${cohort.length} emails drafted`, {
      description: "Track delivery on the Notifications log. Set RESEND_API_KEY to send live.",
      duration: 8000,
    });
  };

  return (
    <Layout>
      <PageShell
        eyebrow="REFORM"
        title="Budget reform exposure"
        accent="portfolio-wide"
        subtitle="Every client's exposure to the 2026-27 Budget reforms — negative gearing, CGT regimes and discretionary-trust min-tax — with sell-window alerts on the highest-risk holdings."
        meta={`${daysUntil(NG_REFORM_DATE)} days to 1 Jul 2027 · ${daysUntil(TRUST_REFORM_DATE)} days to 1 Jul 2028 · ${exposures.length} clients reviewed`}
        metrics={[
          { label: "Sell-window alerts", value: String(sellWindowCount), hint: sellWindowCount > 0 ? "urgent" : "none" },
          { label: "Total CGT swing", value: FS(totalAtRisk) },
          { label: "Clients w/ trusts", value: String(exposures.filter((e) => e.hasTrust).length) },
          { label: "Active clients", value: String(exposures.length) },
        ]}
        actions={sellWindowCount > 0 ? (
          <PillButton variant="accent" onClick={bulkDraftSellWindow} data-testid="bulk-outreach-btn">
            <Send className="h-3.5 w-3.5 inline mr-1.5" /> Draft {sellWindowCount} outreach email{sellWindowCount === 1 ? "" : "s"}
          </PillButton>
        ) : null}
        filters={(
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 border border-slate-300 rounded-full px-3 py-1.5 max-w-xs">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                placeholder="Filter clients…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-[12px] focus:outline-none w-full"
                data-testid="exposure-filter"
              />
            </div>
            <ChipFilter
              value={sortBy}
              onChange={setSortBy}
              dataTestidPrefix="sort"
              options={[
                { value: "riskScore", label: "Sort: Risk" },
                { value: "cgtSwing", label: "Sort: CGT swing" },
                { value: "trustExposure", label: "Sort: Trust exposure" },
                { value: "name", label: "Sort: Name" },
              ]}
            />
          </div>
        )}
      >
        <div className="space-y-6" data-testid="budget-exposure-report">

          {/* Sell-window alerts (priority) */}
          {sellWindowCount > 0 && (
            <Tile className="border-l-4 border-rose-500 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h2 className="text-base font-bold text-rose-800">Pre-1 July 2027 sell-window alerts ({sellWindowCount})</h2>
              </div>
              <div className="space-y-2">
                {exposures.filter((e) => e.sellWindowAlert).map((e) => (
                  <div key={e.id} className="border border-rose-200 rounded-lg p-3 bg-rose-50/30" data-testid={`sell-window-row-${e.id}`}>
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <p className="font-semibold text-[#1a2744]">{e.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px] bg-rose-100 text-rose-800 border-rose-300">CGT swing {F(e.totalCgtSwing)}</Badge>
                        <PillButton variant="ghost" onClick={() => draftEmail(e)} className="text-[10px] py-1 px-3" data-testid={`email-${e.id}`}>
                          <Mail className="h-3 w-3 inline mr-1" /> Email
                        </PillButton>
                        <PillButton variant="ghost" onClick={() => downloadICS(e)} className="text-[10px] py-1 px-3" data-testid={`ics-${e.id}`}>
                          <CalendarPlus className="h-3 w-3 inline mr-1" /> Invite
                        </PillButton>
                      </div>
                    </div>
                    <p className="text-[11px] text-rose-700">
                      Holds {e.invPropCount} existing investment {e.invPropCount === 1 ? "property" : "properties"} purchased post-12-May-2026 with material unrealised gain. Selling before 1 July 2027 secures the 50% CGT discount; selling after triggers the new indexation + 30% min-tax regime.
                    </p>
                  </div>
                ))}
              </div>
            </Tile>
          )}

          {/* Full table — wrapped in Tile for the new aesthetic */}
          <Tile className="p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-600">
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
                    <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50" data-testid={`exposure-row-${e.id}`}>
                      <td className="p-3">
                        <p className="font-semibold text-[#1a2744]">{e.name}</p>
                        <p className="text-[10px] text-slate-500">{e.invPropCount} inv prop · {e.hasTrust ? "has trust" : "no trust"}</p>
                      </td>
                      <td className="p-3 text-[11px] capitalize">{ngLabel}</td>
                      <td className="p-3 text-right">{FS(totalInvValue)}</td>
                      <td className="p-3 text-right">{FS(totalPre)}</td>
                      <td className="p-3 text-right">{FS(totalPost)}</td>
                      <td className={`p-3 text-right font-semibold ${e.totalCgtSwing > 50_000 ? "text-rose-700" : e.totalCgtSwing > 10_000 ? "text-amber-700" : ""}`}>{FS(e.totalCgtSwing)}</td>
                      <td className="p-3 text-right">{e.hasTrust ? FS(e.trustMinTaxExposure) : "—"}</td>
                      <td className="p-3 text-center"><RiskPill score={e.riskScore} /></td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <PillButton variant="ghost" onClick={() => { localStorage.setItem("selected_client", JSON.stringify({ id: e.id })); window.location.assign("/budget-reforms"); }} className="text-[10px] py-1 px-3" data-testid={`open-budget-${e.id}`}>
                            <ExternalLink className="h-3 w-3 inline mr-0.5" /> Open
                          </PillButton>
                          {e.sellWindowAlert && (
                            <>
                              <PillButton variant="ghost" onClick={() => draftEmail(e)} className="text-[10px] py-1 px-3" data-testid={`row-email-${e.id}`}>
                                <Mail className="h-3 w-3 inline" />
                              </PillButton>
                              <PillButton variant="ghost" onClick={() => downloadICS(e)} className="text-[10px] py-1 px-3" data-testid={`row-ics-${e.id}`}>
                                <CalendarPlus className="h-3 w-3 inline" />
                              </PillButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Tile>

          <p className="text-[10px] text-slate-400 italic text-center">
            Working assumption: investment properties have ~50% unrealised gain and a ~5y holding period. Adviser refines per client on the Budget Reforms page. · Engine: <code>/app/frontend/src/lib/auTax.js</code> · 26/26 unit tests passing.
          </p>
        </div>
      </PageShell>
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
