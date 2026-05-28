import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PillButton } from "@/components/PageShell";
import { toast } from "sonner";
import {
  TrendingUp, Zap, Activity, FileText,
  Briefcase, PiggyBank, Sparkles,
} from "lucide-react";
import { CLIENT_DATA, computeClientTotals } from "@/data/clientData";
import { projectRetirement } from "@/components/ScenarioEngine";
import { generateReviewPackPDF } from "@/lib/pdfGenerator";

import { fmt } from "./adviserClientDashboard/_utils";
import { RetirementReadinessCard } from "./adviserClientDashboard/RetirementReadinessCard";
import { AlertsCard } from "./adviserClientDashboard/AlertsCard";
import { OpportunitiesCard } from "./adviserClientDashboard/OpportunitiesCard";
import { BalanceSheetCard } from "./adviserClientDashboard/BalanceSheetCard";
import { EmbeddedScenarioCard } from "./adviserClientDashboard/EmbeddedScenarioCard";
import { TodaysPrioritiesCard } from "./adviserClientDashboard/TodaysPrioritiesCard";
import { MeetingPrepCard } from "./adviserClientDashboard/MeetingPrepCard";
import { WhatChangedCard } from "./adviserClientDashboard/WhatChangedCard";
import { SimulationBanner } from "./adviserClientDashboard/SimulationBanner";

const AdviserClientDashboard = ({ clientId = "thompson_family" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const totals = computeClientTotals(clientId);

  const [liveTick, setLiveTick] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setLiveTick(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  // Simulation arriving from Intelligence Feed → /dashboard?simulate=1.
  const [simulation, setSimulation] = useState(null);
  const [applyTrigger, setApplyTrigger] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("simulate") !== "1") return;
    try {
      const raw = sessionStorage.getItem(`pending_simulation:${clientId}`);
      if (raw) setSimulation(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [location.search, clientId]);

  const clearSimulation = () => {
    try { sessionStorage.removeItem(`pending_simulation:${clientId}`); } catch { /* ignore */ }
    setSimulation(null);
    navigate(`/dashboard`, { replace: true });
  };

  const applySimulation = () => {
    setApplyTrigger((n) => n + 1);
    toast.success("Strategy applied to Live Scenario", {
      description: "Sliders updated below — confidence recalculating.",
    });
  };

  // Stable per-client seed so all Monte Carlo runs return identical numbers.
  const stableSeed = useMemo(() => {
    let h = 0x811c9dc5;
    for (let i = 0; i < clientId.length; i++) {
      h ^= clientId.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h || 1;
  }, [clientId]);

  const baseScenario = useMemo(() => {
    const liquidAssets = client.assets.filter(a => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio"].includes(a.type))
      .reduce((s, a) => s + a.value, 0);
    const yearsToRet = Math.max(1, client.retirement.retirement_age - client.profile.age);
    return projectRetirement({
      currentPortfolio: liquidAssets,
      annualContributions: client.retirement.annual_contributions,
      annualSpending: client.retirement.retirement_spending,
      yearsToRetirement: yearsToRet,
      seed: stableSeed,
    });
  }, [client, stableSeed]);

  const surplus = baseScenario.portfolioAtRetirement - (client.retirement.retirement_spending * 25);
  const topRisk = surplus < 0
    ? "Spending exceeds projected drawdown capacity"
    : baseScenario.confidence < 80
    ? "Portfolio drift — equity over-allocation"
    : "Sequencing risk near retirement";

  const alerts = useMemo(() => {
    const arr = [];
    const equityAlloc = client.rebalancing?.find(r => r.asset.includes("Shares") || r.asset.includes("Equities"));
    if (equityAlloc && Math.abs(equityAlloc.diff) > 7) {
      arr.push({ level: "yellow", title: "Portfolio drift", detail: `${equityAlloc.asset} ${equityAlloc.diff > 0 ? "over" : "under"} target by ${Math.abs(equityAlloc.diff)}%`, delta: `${equityAlloc.diff > 0 ? "+" : ""}${equityAlloc.diff}%` });
    }
    if (baseScenario.confidence < 75) arr.push({ level: "red", title: "Confidence drop", detail: "Below 75% threshold — review plan", delta: `${baseScenario.confidence}%` });
    if ((client.profile.expensesAnnual || 0) / (client.profile.incomeHousehold || 1) > 0.55) {
      arr.push({ level: "yellow", title: "Spending drift", detail: "Household expenses exceed 55% of income", delta: "↑6%" });
    }
    arr.push({ level: "green", title: "Compliance", detail: "FDS + Fee Consent current", delta: "OK" });
    return arr.slice(0, 4);
  }, [client, baseScenario]);

  const opportunities = useMemo(() => [
    { icon: PiggyBank, title: "Maximise concessional contributions", detail: `$${((27500 - 12000)).toLocaleString()} remaining cap — ${client.profile.first_name}`, impact: 5800 },
    { icon: TrendingUp, title: "Rebalance overweight property", detail: "Shift 6% from property → global equities", impact: 42000 },
    { icon: Zap, title: "Tax-loss harvesting window", detail: "Realize $18k capital losses before EOFY", impact: 6300 },
    { icon: Briefcase, title: "Fee review opportunity", detail: "Consolidate super to reduce 0.35% admin fee", impact: 12500 },
  ].sort((a, b) => b.impact - a.impact), [client]);

  const changes = [
    { label: "Confidence", current: `${baseScenario.confidence}%`, delta: -4, suffix: "%", previous: `${baseScenario.confidence + 4}%`, isNegative: true },
    { label: "Spending", current: fmt(client.profile.expensesAnnual), delta: 6, suffix: "%", previous: fmt(client.profile.expensesAnnual * 0.94), isNegative: true },
    { label: "Equity Exposure", current: "42%", delta: 8, suffix: "pts", previous: "34%", isNegative: true },
    { label: "Net Worth", current: fmt(totals.netWorth), delta: 3.2, suffix: "%", previous: fmt(totals.netWorth * 0.969), isNegative: false },
  ];

  const handleImprove = () => toast.success("Opening scenario builder to improve outcome", { description: "Adjust the sliders in Row 2 to see confidence updates live" });
  const handleGeneratePack = () => {
    try {
      generateReviewPackPDF({
        clientId,
        confidence: baseScenario.confidence,
        changes,
        opportunities,
        alerts,
      });
      toast.success("Review Pack PDF downloaded", { description: `Generated for ${client.profile.name}` });
    } catch {
      toast.error("PDF generation failed");
    }
  };
  const handleRunScenario = () => toast.info("Scenario engine is embedded below — adjust the sliders live");
  const handleOppAction = (o) => toast.success(`Action: ${o.title}`, { description: `Estimated impact: ${fmt(o.impact)}` });

  const lastUpdatedText = new Date(liveTick).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-5" data-testid="adviser-client-dashboard">
      {simulation && (
        <SimulationBanner
          simulation={simulation}
          onApply={applySimulation}
          onClear={clearSimulation}
        />
      )}

      {/* GLOBAL HEADER — quick CTAs row only (identity & KPIs live in PageShell above) */}
      <div className="flex items-center gap-2 flex-wrap" data-testid="client-dashboard-header">
        <PillButton variant="ghost" onClick={handleImprove} data-testid="cta-improve-outcome">
          <Sparkles className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Improve outcome
        </PillButton>
        <PillButton variant="ghost" onClick={handleRunScenario} data-testid="cta-run-scenario">
          <Activity className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Scenario
        </PillButton>
        <PillButton variant="primary" onClick={handleGeneratePack} data-testid="cta-generate-review-pack">
          <FileText className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Generate review pack
        </PillButton>
        <span className="ml-auto text-[10px] tracking-[0.18em] uppercase text-slate-500 font-mono flex items-center gap-1.5" data-testid="header-updated">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live · {lastUpdatedText}
        </span>
      </div>

      {/* ROW 1: HERO — 3 equal cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RetirementReadinessCard confidence={baseScenario.confidence} surplus={surplus} topRisk={topRisk} onImprove={handleImprove} />
        <AlertsCard alerts={alerts} />
        <OpportunitiesCard opportunities={opportunities} onAction={handleOppAction} />
      </div>

      {/* ROW 2: PLANNING — 60/40 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <BalanceSheetCard client={client} totals={totals} />
        </div>
        <div className="lg:col-span-2">
          <EmbeddedScenarioCard client={client} baseConfidence={baseScenario.confidence} simulation={simulation} applyTrigger={applyTrigger} seed={stableSeed} />
        </div>
      </div>

      {/* ROW 3: WORKFLOW — 2 equal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodaysPrioritiesCard />
        <MeetingPrepCard client={client} onGeneratePack={handleGeneratePack} />
      </div>

      {/* ROW 4: DELTA */}
      <WhatChangedCard changes={changes} />
    </div>
  );
};

export default AdviserClientDashboard;
