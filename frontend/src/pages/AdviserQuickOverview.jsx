// Adviser Quick Overview — multi-entity, CGT-aware retirement planner that
// lives under the adviser's profile. Wraps the full 7-tab workbench but adds:
//   1. Export PDF — server-side rendered via /api/pdf-report/generate
//   2. Add as new client — converts the current state into a new household
//      record via POST /api/crm/clients
//
// The underlying engine + tabs are unchanged. This page is intended for
// modelling prospects before they're onboarded as a client.

import { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { PageShell, PillButton } from "@/components/PageShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, UserPlus, Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import RetirementPlanner from "./RetirementPlanner";

const API = process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const AdviserQuickOverview = () => {
  const navigate = useNavigate();
  const controlsRef = useRef(null);
  const lastSnapshotRef = useRef(null);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [addClientBusy, setAddClientBusy] = useState(false);
  const [newClient, setNewClient] = useState({ first_name: "", last_name: "", email: "", phone: "" });

  // Track the latest snapshot so we can render small KPI chips in the hero.
  const [snapshot, setSnapshot] = useState(null);
  const onReadyControls = useCallback((c) => {
    controlsRef.current = c;
    const s = c.getSnapshot();
    lastSnapshotRef.current = s;
    setSnapshot(s);
  }, []);

  // Poll the planner's ref-backed snapshot once a second so the hero KPIs
  // stay in sync as the adviser tweaks inputs in the embedded workbench.
  useEffect(() => {
    const id = setInterval(() => {
      if (controlsRef.current) {
        const s = controlsRef.current.getSnapshot();
        lastSnapshotRef.current = s;
        setSnapshot((prev) => {
          if (
            prev?.derived?.netWorth === s?.derived?.netWorth &&
            prev?.derived?.totalAssets === s?.derived?.totalAssets &&
            prev?.derived?.yearsToRetirement === s?.derived?.yearsToRetirement &&
            prev?.derived?.totalAnnualIncome === s?.derived?.totalAnnualIncome
          ) {
            return prev; // skip re-render when nothing material changed
          }
          return s;
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const grabSnapshot = () => {
    if (!controlsRef.current) return null;
    const s = controlsRef.current.getSnapshot();
    lastSnapshotRef.current = s;
    return s;
  };

  // ---------------- PDF EXPORT ----------------
  const handleExportPdf = useCallback(async () => {
    const s = grabSnapshot();
    if (!s) { toast.error("Workbench is still loading — try again in a moment."); return; }
    setPdfBusy(true);
    try {
      const primary = s.people?.[0] || {};
      const assetsByType = {};
      (s.assets || []).forEach((a) => {
        assetsByType[a.type] = (assetsByType[a.type] || 0) + (a.currentValue || 0);
      });

      const analysisData = {
        type: "retirement_analysis",
        client_summary: {
          name: `${primary.firstName || "Prospect"} ${primary.lastName || ""}`.trim() || "Prospect",
          age: primary.currentAge,
          retirement_age: primary.retirementAge,
          life_expectancy: primary.lifeExpectancy,
          years_to_retirement: s.derived?.yearsToRetirement,
          relationship: s.isCouple ? "Couple" : "Single",
        },
        current_position: {
          total_wealth: s.derived?.netWorth,
          total_assets: s.derived?.totalAssets,
          total_liabilities: s.derived?.totalLiabilities,
          super_balance: Object.entries(assetsByType)
            .filter(([t]) => t === "Super" || t === "SMSF")
            .reduce((sum, [, v]) => sum + v, 0),
          annual_income: s.derived?.totalAnnualIncome,
          monthly_expenses: s.derived?.totalMonthlyExpenses,
        },
        retirement_analysis: {
          total_retirement_fund_needed: (s.derived?.totalMonthlyExpenses || 0) * 12 * (s.derived?.retirementYears || 25) * 0.04 * 25,
          surplus_or_shortfall: 0,
        },
        entities: Object.entries(assetsByType).map(([type, value]) => ({
          name: type,
          value,
          ownership: type,
        })),
        assumptions: [
          `Investment return: ${s.assumptions?.expectedReturn || 7}% p.a.`,
          `Inflation: ${s.assumptions?.inflationRate || 2.5}%`,
          `Life expectancy: ${primary.lifeExpectancy} years`,
          `Years in retirement: ${s.derived?.retirementYears}`,
        ],
        recommendations: [
          "Review concessional contribution strategy to maximise tax efficiency",
          "Consider CGT-aware asset disposal sequencing in retirement",
          s.isCouple ? "Optimise spouse contribution splitting where eligible" : "Review SAPTO eligibility approaching pension age",
        ],
      };

      const res = await fetch(`${API}/api/pdf-report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_data: analysisData,
          report_title: `Quick Overview — ${analysisData.client_summary.name}`,
        }),
      });
      if (!res.ok) throw new Error(`PDF generation failed (${res.status})`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quick-overview-${(primary.firstName || "prospect").toLowerCase()}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF exported");
    } catch (e) {
      toast.error(`PDF export failed: ${e.message}`);
    } finally {
      setPdfBusy(false);
    }
  }, []);

  // ---------------- ADD AS NEW CLIENT ----------------
  const openAddClient = () => {
    const s = grabSnapshot();
    if (!s) { toast.error("Workbench is still loading — try again in a moment."); return; }
    const primary = s.people?.[0] || {};
    setNewClient({
      first_name: primary.firstName || "",
      last_name: primary.lastName || "",
      email: "",
      phone: "",
    });
    setAddClientOpen(true);
  };

  const submitAddClient = useCallback(async () => {
    if (!newClient.first_name || !newClient.last_name) {
      toast.error("First and last name are required.");
      return;
    }
    const s = lastSnapshotRef.current;
    if (!s) { toast.error("Workbench snapshot unavailable."); return; }

    setAddClientBusy(true);
    try {
      const fullName = `${newClient.first_name.trim()} ${newClient.last_name.trim()}`;
      const annualIncome = Math.round(s.derived?.totalAnnualIncome || 0);
      const payload = {
        name: fullName,
        email: newClient.email || `${newClient.first_name.toLowerCase()}.${newClient.last_name.toLowerCase()}@example.com`,
        phone: newClient.phone || "",
        status: "prospect",
        annual_income: annualIncome,
        notes: [
          "Source: Quick Overview",
          `Captured ${new Date().toLocaleString("en-AU")}`,
          `Net worth: ${formatCurrency(s.derived?.netWorth || 0)}`,
          `Assets: ${formatCurrency(s.derived?.totalAssets || 0)}`,
          `Liabilities: ${formatCurrency(s.derived?.totalLiabilities || 0)}`,
          `Years to retirement: ${s.derived?.yearsToRetirement ?? "—"}`,
          `Couple: ${s.isCouple ? "yes" : "no"}`,
        ].join("\n"),
      };
      const res = await fetch(`${API}/api/crm/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Client creation failed (${res.status}): ${err.slice(0, 120)}`);
      }
      const created = await res.json();
      const newId = created?.client?.client_id || created?.client_id || created?.id || fullName;
      // Persist the full retirement snapshot in localStorage keyed by the new
      // client_id so the adviser-hub can lift it back into the client record.
      try {
        const key = `quick_overview_snapshot_${newId}`;
        localStorage.setItem(key, JSON.stringify({
          captured_at: new Date().toISOString(),
          snapshot: {
            people: s.people,
            isCouple: s.isCouple,
            assumptions: s.assumptions,
            derived: s.derived,
          },
        }));
      } catch { /* ignore quota errors */ }
      toast.success(`${fullName} added as a new client.`);
      setAddClientOpen(false);
      setTimeout(() => navigate(`/adviser-hub?new=${encodeURIComponent(newId)}`), 600);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setAddClientBusy(false);
    }
  }, [newClient, navigate]);

  // ---------------- Hero metrics from latest snapshot ----------------
  const heroMetrics = snapshot
    ? [
        { label: "Net worth", value: formatCurrency(snapshot.derived?.netWorth) },
        { label: "Assets", value: formatCurrency(snapshot.derived?.totalAssets) },
        { label: "Years to retire", value: String(snapshot.derived?.yearsToRetirement ?? "—") },
        { label: "Annual income", value: formatCurrency(snapshot.derived?.totalAnnualIncome) },
      ]
    : [
        { label: "Status", value: "Loading" },
        { label: "Assets", value: "—" },
        { label: "Years to retire", value: "—" },
        { label: "Annual income", value: "—" },
      ];

  return (
    <Layout>
      <PageShell
        eyebrow="ADVISER · PROFILE"
        title="Quick overview"
        accent="multi-entity · CGT-aware"
        subtitle="A scratchpad for prospects. Model a complete household — multiple people, entities, assets, income, and tax — without onboarding them first. Export a PDF for the conversation, then promote to a real client when they sign on."
        meta={snapshot ? `LIVE · ${(snapshot.people?.[0]?.firstName || "prospect").toUpperCase()}` : "READY"}
        metrics={heroMetrics}
        actions={(
          <>
            <PillButton variant="ghost" onClick={handleExportPdf} disabled={pdfBusy || !snapshot} data-testid="qo-export-pdf">
              {pdfBusy
                ? <Loader2 className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5 animate-spin" />
                : <Download className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" />}
              {pdfBusy ? "Generating…" : "Export PDF"}
            </PillButton>
            <PillButton variant="primary" onClick={openAddClient} disabled={!snapshot} data-testid="qo-add-client">
              <UserPlus className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Add as new client
            </PillButton>
          </>
        )}
      >
        <div data-testid="quick-overview-page">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 mb-5 flex items-start gap-3">
            <FileSpreadsheet className="h-4 w-4 text-[#D4A84C] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-medium text-[#1a2744]">Working on a prospect?</p>
              <p>Model their full household here — assets, entities, income streams, planned sales, tax assumptions — without onboarding them. Export a polished PDF for your conversation, then click <span className="font-semibold text-[#1a2744]">Add as new client</span> when they sign on. Everything you've built carries across to their client record.</p>
            </div>
          </div>

          {/* Mount the full 7-tab workbench, headless (no Layout/PageShell of its own) */}
          <RetirementPlanner embedded onReadyControls={onReadyControls} />
        </div>
      </PageShell>

      {/* Add-as-new-client dialog */}
      <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
        <DialogContent className="max-w-md" data-testid="qo-add-client-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#1a2744]">Add as new client</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Promote this prospect into a full client record. The retirement snapshot you've built will be attached.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-[11px] tracking-wide text-slate-600">First name</Label>
              <Input value={newClient.first_name} onChange={(e) => setNewClient((v) => ({ ...v, first_name: e.target.value }))} className="h-10 text-sm rounded-lg" data-testid="qo-input-first" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] tracking-wide text-slate-600">Last name</Label>
              <Input value={newClient.last_name} onChange={(e) => setNewClient((v) => ({ ...v, last_name: e.target.value }))} className="h-10 text-sm rounded-lg" data-testid="qo-input-last" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-[11px] tracking-wide text-slate-600">Email</Label>
              <Input type="email" value={newClient.email} onChange={(e) => setNewClient((v) => ({ ...v, email: e.target.value }))} placeholder="optional" className="h-10 text-sm rounded-lg" data-testid="qo-input-email" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-[11px] tracking-wide text-slate-600">Phone</Label>
              <Input value={newClient.phone} onChange={(e) => setNewClient((v) => ({ ...v, phone: e.target.value }))} placeholder="optional" className="h-10 text-sm rounded-lg" data-testid="qo-input-phone" />
            </div>
          </div>
          <DialogFooter>
            <PillButton variant="ghost" onClick={() => setAddClientOpen(false)} disabled={addClientBusy}>Cancel</PillButton>
            <PillButton variant="primary" onClick={submitAddClient} disabled={addClientBusy} data-testid="qo-confirm-add">
              {addClientBusy ? <Loader2 className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" />}
              {addClientBusy ? "Adding…" : "Add client"}
            </PillButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdviserQuickOverview;
