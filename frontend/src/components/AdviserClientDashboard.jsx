import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { PillButton } from "@/components/PageShell";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, AlertTriangle, Zap, Target, Calendar, FileText,
  Activity, DollarSign, ArrowRight, Briefcase, Home, PiggyBank, Building2,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Gauge, ChevronRight, Sparkles,
  Play, X,
} from "lucide-react";
import { CLIENT_DATA, computeClientTotals } from "@/data/clientData";
import { projectRetirement } from "@/components/ScenarioEngine";
import { generateReviewPackPDF } from "@/lib/pdfGenerator";
import ActionRail from "@/components/platform/ActionRail";

const fmt = (v) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v || 0}`;
};
const pct = (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

// -------- Row 1 Cards ----------
const RetirementReadinessCard = ({ confidence, surplus, topRisk, onImprove }) => {
  const tone = confidence >= 85 ? "emerald" : confidence >= 70 ? "amber" : "rose";
  const dotColor = { emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500" }[tone];
  const ringColor = { emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e" }[tone];
  const statusLabel = tone === "emerald" ? "On track" : tone === "amber" ? "Monitor" : "At risk";

  return (
    <Card className="border-slate-200" data-testid="card-retirement-readiness">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Retirement readiness
          </p>
          <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-end gap-5">
          {/* Ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="6" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="6"
                strokeDasharray={`${(confidence / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-2xl text-[#1a2744] tabular-nums" data-testid="confidence-score">{confidence}%</span>
              <span className="text-[9px] tracking-wide uppercase text-slate-500">confidence</span>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Success probability</p>
              <p className="font-serif text-lg text-[#1a2744] mt-0.5 tabular-nums">{confidence}%</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">{surplus >= 0 ? "Surplus" : "Shortfall"}</p>
              <p className={`font-serif text-base mt-0.5 tabular-nums ${surplus >= 0 ? "text-[#1a2744]" : "text-rose-600"}`}>{fmt(Math.abs(surplus))}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold mb-1">Top risk driver</p>
          <p className="text-sm text-slate-700 mb-3 leading-snug">{topRisk}</p>
          <PillButton variant="primary" className="w-full !justify-center" onClick={onImprove} data-testid="btn-improve-outcome">
            <Sparkles className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Improve outcome
          </PillButton>
        </div>
      </CardContent>
    </Card>
  );
};

const AlertsCard = ({ alerts }) => (
  <Card className="border-slate-200" data-testid="card-alerts">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Alerts &amp; exceptions
        </p>
        <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">{alerts.filter(a => a.level !== "green").length} active</span>
      </div>
      <div className="space-y-1">
        {alerts.map((a, i) => {
          const dotColor = { green: "bg-emerald-500", yellow: "bg-amber-500", red: "bg-rose-500" }[a.level];
          return (
            <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0" data-testid={`alert-item-${i}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor} mt-2 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1a2744] leading-snug">{a.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{a.detail}</p>
              </div>
              <span className="text-[10px] tracking-wide text-slate-500 font-mono uppercase">{a.delta}</span>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

const OpportunitiesCard = ({ opportunities, onAction }) => (
  <Card className="border-slate-200" data-testid="card-opportunities">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Opportunities
        </p>
        <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">{fmt(opportunities.reduce((s, o) => s + o.impact, 0))} potential</span>
      </div>
      <div className="space-y-1">
        {opportunities.map((o, i) => (
          <button key={i}
            className="w-full text-left flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors -mx-1 px-1 rounded"
            onClick={() => onAction(o)} data-testid={`opportunity-item-${i}`}>
            <div className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
              <o.icon className="h-3.5 w-3.5 text-[#1a2744]" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a2744] leading-snug">{o.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{o.detail}</p>
            </div>
            <span className="font-mono text-sm text-[#1a2744] whitespace-nowrap">{fmt(o.impact)}</span>
          </button>
        ))}
      </div>
    </CardContent>
  </Card>
);

// -------- Row 2 ----------
const BalanceSheetCard = ({ client, totals }) => {
  const byType = useMemo(() => {
    const grouped = {};
    client.assets.forEach(a => {
      const key = a.type === "Super" ? "Super / Pensions" :
        (a.type === "Trust Portfolio" || a.entity === "Trust") ? "Trusts / Entities" :
        a.type === "Cash" ? "Cash" :
        a.type === "Property" ? "Property" :
        (a.type === "Shares" || a.type === "Managed Fund") ? "Investments" : "Other";
      grouped[key] = (grouped[key] || 0) + a.value;
    });
    return grouped;
  }, [client]);

  const iconMap = { "Super / Pensions": PiggyBank, "Trusts / Entities": Building2, Property: Home, Investments: TrendingUp, Cash: DollarSign, Other: Briefcase };
  const maxVal = Math.max(...Object.values(byType), 1);

  return (
    <Card className="border-slate-200" data-testid="card-balance-sheet">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Household financial map</p>
            <p className="font-serif text-2xl text-[#1a2744] mt-1 tabular-nums">{fmt(totals.netWorth)}<span className="text-sm text-slate-500 font-sans font-normal ml-2">net worth</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Assets · liabilities</p>
            <p className="text-xs text-slate-700 font-mono mt-1">{fmt(totals.grossAssets)} · {fmt(totals.totalLiabilities)}</p>
          </div>
        </div>
        <div className="space-y-3">
          {Object.entries(byType).sort((a,b) => b[1] - a[1]).map(([type, val]) => {
            const Icon = iconMap[type] || Briefcase;
            return (
              <div key={type} className="flex items-center gap-3" data-testid={`asset-row-${type.toLowerCase().replace(/[^a-z]/g,"-")}`}>
                <div className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[#1a2744]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-slate-600">{type}</span>
                    <span className="font-mono text-xs text-[#1a2744]">{fmt(val)}</span>
                  </div>
                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4A84C] rounded-full transition-all" style={{ width: `${(val / maxVal) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Cash Flow + Liabilities summary */}
        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          <div>
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Income</p>
            <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">{fmt(client.profile.incomeHousehold)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Expenses</p>
            <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">{fmt(client.profile.expensesAnnual)}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Liabilities</p>
            <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">{fmt(totals.totalLiabilities)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Map a simulation item from the Intelligence Feed into concrete slider
// adjustments for the Live Scenario engine. Pure function, deterministic.
// Returns null if no meaningful mapping exists.
const mapSimulationToSliders = (sim, current, client) => {
  if (!sim) return null;
  const cat = String(sim.category || "").toLowerCase();
  const headline = String(sim.headline || "").toLowerCase();
  const next = { ...current };

  // 1) Portfolio / rebalance — pull volatility down toward Balanced (12σ)
  if (cat.includes("portfolio") || /rebalance|allocation|drift|equity/.test(headline)) {
    next.volatility = Math.max(8, Math.min(current.volatility, 12));
  }

  // 2) Contributions / super — bump annual contributions; size based on
  // financialImpact when available, else a sensible default.
  if (cat.includes("super") || cat.includes("contribution") || /contribut|salary sacrific|concessional/.test(headline)) {
    const yearsToRet = Math.max(1, current.retireAge - client.profile.age);
    const inferredYearly = Number.isFinite(sim.financialImpact)
      ? Math.max(5_000, Math.round(Math.abs(sim.financialImpact) / yearsToRet / 1000) * 1000)
      : 15_000;
    next.annualContrib = Math.min(300_000, current.annualContrib + inferredYearly);
  }

  // 3) Tax — add tax savings to contributions, scale by impact
  if (cat.includes("tax") || /tax|cgt|deduction|harvesting/.test(headline)) {
    const yearsToRet = Math.max(1, current.retireAge - client.profile.age);
    const inferred = Number.isFinite(sim.financialImpact)
      ? Math.max(2_000, Math.round(Math.abs(sim.financialImpact) / yearsToRet / 1000) * 1000)
      : 5_000;
    next.annualContrib = Math.min(300_000, current.annualContrib + inferred);
  }

  // 4) Spending — trim annual spending modestly to model outcome
  if (cat.includes("spend") || /budget|expense|drift|spending/.test(headline)) {
    next.annualSpend = Math.max(50_000, Math.round(current.annualSpend * 0.94));
  }

  // 5) Retirement timing — delay by 2 years to test sequencing buffer
  if (/sequenc|retirement age|delay|defer/.test(headline) || cat.includes("retirement")) {
    next.retireAge = Math.min(75, current.retireAge + 2);
  }

  // If nothing matched but the strategy has a positive financial impact,
  // assume contribution increase as a safe default.
  if (
    next.retireAge === current.retireAge &&
    next.annualSpend === current.annualSpend &&
    next.annualContrib === current.annualContrib &&
    next.volatility === current.volatility &&
    Number.isFinite(sim.financialImpact) && sim.financialImpact > 0
  ) {
    const yearsToRet = Math.max(1, current.retireAge - client.profile.age);
    next.annualContrib = Math.min(300_000, current.annualContrib + Math.max(5_000, Math.round(sim.financialImpact / yearsToRet / 1000) * 1000));
  }

  return next;
};

const EmbeddedScenarioCard = ({ client, baseConfidence, simulation, applyTrigger = 0, seed }) => {
  const liquidAssets = useMemo(() =>
    client.assets.filter(a => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio"].includes(a.type))
      .reduce((s, a) => s + a.value, 0),
  [client]);

  const [retireAge, setRetireAge] = useState(client.retirement.retirement_age);
  const [annualSpend, setAnnualSpend] = useState(client.retirement.retirement_spending);
  const [annualContrib, setAnnualContrib] = useState(client.retirement.annual_contributions);
  const [volatility, setVolatility] = useState(12); // σ% — 6%=conservative, 12%=balanced, 20%=aggressive

  // When the parent fires applyTrigger (Apply Simulation button on banner),
  // derive new slider values from the simulation payload and apply them.
  useEffect(() => {
    if (!applyTrigger || !simulation) return;
    const next = mapSimulationToSliders(
      simulation,
      { retireAge, annualSpend, annualContrib, volatility },
      client
    );
    if (!next) return;
    if (next.retireAge !== retireAge) setRetireAge(next.retireAge);
    if (next.annualSpend !== annualSpend) setAnnualSpend(next.annualSpend);
    if (next.annualContrib !== annualContrib) setAnnualContrib(next.annualContrib);
    if (next.volatility !== volatility) setVolatility(next.volatility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTrigger]);

  const scenario = useMemo(() => {
    const yearsToRet = Math.max(1, retireAge - client.profile.age);
    const result = projectRetirement({
      currentPortfolio: liquidAssets,
      annualContributions: annualContrib,
      annualSpending: annualSpend,
      yearsToRetirement: yearsToRet,
      expectedReturn: 0.065,
      volatility: volatility / 100,
      inflationRate: 0.03,
      seed,
    });
    return { ...result, yearsToRet };
  }, [liquidAssets, retireAge, annualSpend, annualContrib, volatility, client.profile.age, seed]);

  const delta = scenario.confidence - baseConfidence;

  return (
    <Card className="border-slate-200" data-testid="card-scenario-engine">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Live scenario
          </p>
          <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">Monte Carlo · 500 sims</span>
        </div>

        {/* Headline confidence — airy white block */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-serif text-4xl text-[#1a2744] tabular-nums" data-testid="scenario-confidence">{scenario.confidence}%</span>
            <span className="text-[10px] tracking-wide uppercase text-slate-500">confidence</span>
            {delta !== 0 && (
              <span className={`ml-auto text-xs font-mono flex items-center gap-0.5 ${delta > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {delta > 0 ? "+" : ""}{delta}% vs current
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Portfolio at retirement · <span className="font-mono text-[#1a2744]">{fmt(scenario.portfolioAtRetirement)}</span></p>
        </div>

        {/* "With Strategy" projection — only when arriving from Mission Control with an active simulation */}
        {simulation && (
          <div className="mb-5 rounded-xl border border-[#D4A84C]/40 bg-white p-4" data-testid="with-strategy-projection">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] tracking-[0.16em] uppercase text-[#8a6c1a] font-semibold">With strategy</p>
              <span className="text-[10px] tracking-wide uppercase font-mono text-[#8a6c1a]">{simulation.headline?.slice(0, 36)}</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              {Number.isFinite(simulation.scoreDelta) && (
                <span className="font-serif text-2xl text-[#1a2744] tabular-nums">
                  {Math.min(100, Math.max(0, baseConfidence + simulation.scoreDelta))}%
                </span>
              )}
              <span className="text-[10px] tracking-wide uppercase text-slate-500">projected confidence</span>
              {Number.isFinite(simulation.financialImpact) && simulation.financialImpact !== 0 && (
                <span className="ml-auto font-mono text-sm text-emerald-600">
                  {simulation.financialImpact >= 0 ? "+" : "−"}{fmt(Math.abs(simulation.financialImpact))} lifetime
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Click <span className="font-semibold text-[#1a2744]">Apply simulation</span> on the banner to push these into the sliders below.</p>
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-4">
          <div data-testid="slider-retire-age">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Retirement age</label>
              <span className="font-mono text-xs text-[#1a2744]">{retireAge}</span>
            </div>
            <Slider min={55} max={75} step={1} value={[retireAge]} onValueChange={(v) => setRetireAge(v[0])} />
          </div>
          <div data-testid="slider-spending">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Retirement spending</label>
              <span className="font-mono text-xs text-[#1a2744]">{fmt(annualSpend)}/yr</span>
            </div>
            <Slider min={50000} max={500000} step={5000} value={[annualSpend]} onValueChange={(v) => setAnnualSpend(v[0])} />
          </div>
          <div data-testid="slider-contributions">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Annual contributions</label>
              <span className="font-mono text-xs text-[#1a2744]">{fmt(annualContrib)}/yr</span>
            </div>
            <Slider min={0} max={300000} step={5000} value={[annualContrib]} onValueChange={(v) => setAnnualContrib(v[0])} />
          </div>
          <div data-testid="slider-volatility">
            <div className="flex justify-between mb-2">
              <label className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Portfolio volatility (σ)</label>
              <span className="font-mono text-xs text-[#1a2744]">
                {volatility}% · {volatility <= 8 ? "Conservative" : volatility <= 14 ? "Balanced" : volatility <= 18 ? "Growth" : "Aggressive"}
              </span>
            </div>
            <Slider min={4} max={24} step={1} value={[volatility]} onValueChange={(v) => setVolatility(v[0])} />
          </div>
        </div>

        {/* Quick presets */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <PillButton variant="ghost" data-testid="preset-retire-65" className="!justify-center"
            onClick={() => { setRetireAge(65); setAnnualSpend(client.retirement.retirement_spending); setAnnualContrib(client.retirement.annual_contributions); }}>
            Retire @ 65
          </PillButton>
          <PillButton variant="ghost" data-testid="preset-retire-67" className="!justify-center"
            onClick={() => { setRetireAge(67); setAnnualSpend(client.retirement.retirement_spending); setAnnualContrib(client.retirement.annual_contributions); }}>
            Retire @ 67
          </PillButton>
        </div>
      </CardContent>
    </Card>
  );
};

// -------- Row 3 ----------
const TodaysPrioritiesCard = () => {
  const navigate = useNavigate();
  const items = [
    { count: 3, label: "clients below 75% confidence", tone: "rose", icon: AlertTriangle, to: "/retirement-control-center", testid: "priority-confidence" },
    { count: 2, label: "urgent risks", tone: "amber", icon: Activity, to: "/budget-exposure", testid: "priority-risks" },
    { count: 1, label: "rebalance pending", tone: "amber", icon: TrendingUp, to: "/portfolio-rebalancing", testid: "priority-rebalance" },
    { count: 4, label: "reviews due this week", tone: "slate", icon: Calendar, to: "/adviser-compliance", testid: "priority-reviews" },
  ];
  return (
    <Card className="border-slate-200" data-testid="card-priorities">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Today's priorities
          </p>
          <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">{new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
        <div className="space-y-1">
          {items.map((item, i) => {
            const dotColor = { rose: "bg-rose-500", amber: "bg-amber-500", slate: "bg-slate-400" }[item.tone];
            return (
              <button
                key={i}
                type="button"
                onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors text-left -mx-1 px-1 rounded focus:outline-none focus:ring-2 focus:ring-[#D4A84C]"
                data-testid={item.testid}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor} flex-shrink-0`} />
                <item.icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                <span className="font-serif text-xl text-[#1a2744] tabular-nums">{item.count}</span>
                <span className="text-sm text-slate-700 flex-1">{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              </button>
            );
          })}
        </div>

        {/* Markets strip — moved here from Firm section */}
        <div className="mt-5 pt-4 border-t border-slate-100" data-testid="markets-strip">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Markets
            </p>
            <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono ml-auto">Live</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg border border-slate-200 bg-white text-center" data-testid="market-asx">
              <p className="text-[10px] tracking-wide uppercase text-slate-500">ASX 200</p>
              <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">7,856</p>
              <p className="text-[10px] text-emerald-600 flex items-center justify-center gap-0.5 font-mono"><ArrowUpRight className="h-2.5 w-2.5" />0.42%</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white text-center" data-testid="market-aud">
              <p className="text-[10px] tracking-wide uppercase text-slate-500">AUD/USD</p>
              <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">0.6545</p>
              <p className="text-[10px] text-rose-600 flex items-center justify-center gap-0.5 font-mono"><ArrowDownRight className="h-2.5 w-2.5" />0.15%</p>
            </div>
            <div className="p-3 rounded-lg border border-slate-200 bg-white text-center" data-testid="market-rba">
              <p className="text-[10px] tracking-wide uppercase text-slate-500">RBA Rate</p>
              <p className="font-serif text-base text-[#1a2744] mt-0.5 tabular-nums">4.35%</p>
              <p className="text-[10px] text-slate-500 font-mono">unchanged</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MeetingPrepCard = ({ client, onGeneratePack }) => {
  const nextMeeting = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 8);
    return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" });
  }, []);

  return (
    <Card className="border-slate-200" data-testid="card-meeting-prep">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Meeting prep
          </p>
          <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">{nextMeeting}</span>
        </div>
        <p className="font-serif text-lg text-[#1a2744] mb-4 leading-tight">Annual review · {client.profile.name}</p>
        <div className="space-y-2.5 mb-5">
          <div className="flex items-start gap-2.5 text-sm" data-testid="meeting-change-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
            <span className="text-slate-700">Confidence <span className="font-semibold text-[#1a2744]">dropped 4 pts</span> since last review</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm" data-testid="meeting-change-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
            <span className="text-slate-700">New <span className="font-semibold text-[#1a2744]">equity over-allocation</span> needs rebalance</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm" data-testid="meeting-change-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A84C] mt-2 flex-shrink-0" />
            <span className="text-slate-700">Recommend scenario · <span className="font-semibold text-[#1a2744]">Retire at 67 (+9% confidence)</span></span>
          </div>
        </div>
        <PillButton variant="primary" className="w-full !justify-center" onClick={onGeneratePack} data-testid="btn-generate-review-pack">
          <FileText className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Generate review pack
        </PillButton>
      </CardContent>
    </Card>
  );
};

// -------- Row 4 ----------
const WhatChangedCard = ({ changes }) => (
  <Card className="border-slate-200" data-testid="card-what-changed">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> What changed since last review
        </p>
        <span className="text-[10px] tracking-wide uppercase text-slate-500 font-mono">Last review · 3 months ago</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {changes.map((c, i) => {
          const ArrowIcon = c.delta >= 0 ? ArrowUpRight : ArrowDownRight;
          const sentiment = c.isNegative ? "rose" : "emerald";
          const toneText = sentiment === "emerald" ? "text-emerald-600" : "text-rose-600";
          return (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4" data-testid={`change-item-${i}`}>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold mb-2">{c.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-xl text-[#1a2744] tabular-nums">{c.current}</span>
                <span className={`text-[11px] font-mono flex items-center ${toneText}`}>
                  <ArrowIcon className="h-3 w-3" />
                  {Math.abs(c.delta)}{c.suffix}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono">was {c.previous}</p>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

// -------- Main Dashboard ----------
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
  // Full payload is stashed in sessionStorage so the banner can show
  // headline + score/$ impact and let the adviser apply or clear it.
  const [simulation, setSimulation] = useState(null);
  // Increments each time the adviser clicks "Apply Simulation". The Live
  // Scenario card watches this and snaps its sliders to a strategy preset.
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

  // Stable per-client seed so all Monte Carlo runs for this client (here,
  // in the Readiness Portal, Mission Control, etc.) return identical numbers.
  const stableSeed = useMemo(() => {
    let h = 0x811c9dc5;
    for (let i = 0; i < clientId.length; i++) {
      h ^= clientId.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h || 1;
  }, [clientId]);

  // Base retirement confidence (for reference)
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

  // Alerts from real data
  const alerts = useMemo(() => {
    const arr = [];
    const equityAlloc = client.rebalancing?.find(r => r.asset.includes("Shares") || r.asset.includes("Equities"));
    if (equityAlloc && Math.abs(equityAlloc.diff) > 7) {
      arr.push({ level: "yellow", title: "Portfolio drift", detail: `${equityAlloc.asset} ${equityAlloc.diff > 0 ? "over" : "under"} target by ${Math.abs(equityAlloc.diff)}%`, delta: `${equityAlloc.diff > 0 ? "+" : ""}${equityAlloc.diff}%` });
    }
    if (baseScenario.confidence < 75) arr.push({ level: "red", title: "Confidence drop", detail: `Below 75% threshold — review plan`, delta: `${baseScenario.confidence}%` });
    if ((client.profile.expensesAnnual || 0) / (client.profile.incomeHousehold || 1) > 0.55) {
      arr.push({ level: "yellow", title: "Spending drift", detail: "Household expenses exceed 55% of income", delta: "↑6%" });
    }
    arr.push({ level: "green", title: "Compliance", detail: "FDS + Fee Consent current", delta: "OK" });
    return arr.slice(0, 4);
  }, [client, baseScenario]);

  // Opportunities ranked by impact
  const opportunities = useMemo(() => [
    { icon: PiggyBank, title: "Maximise concessional contributions", detail: `$${((27500 - 12000)).toLocaleString()} remaining cap — ${client.profile.first_name}`, impact: 5800 },
    { icon: TrendingUp, title: "Rebalance overweight property", detail: "Shift 6% from property → global equities", impact: 42000 },
    { icon: Zap, title: "Tax-loss harvesting window", detail: "Realize $18k capital losses before EOFY", impact: 6300 },
    { icon: Briefcase, title: "Fee review opportunity", detail: "Consolidate super to reduce 0.35% admin fee", impact: 12500 },
  ].sort((a, b) => b.impact - a.impact), [client]);

  // What Changed (vs last review) — 'isNegative' flags deltas that represent worsening outcomes
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
    } catch (e) {
      toast.error("PDF generation failed");
    }
  };
  const handleRunScenario = () => toast.info("Scenario engine is embedded below — adjust the sliders live");
  const handleOppAction = (o) => toast.success(`Action: ${o.title}`, { description: `Estimated impact: ${fmt(o.impact)}` });

  const lastUpdatedText = new Date(liveTick).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-5" data-testid="adviser-client-dashboard">
      {/* SIMULATION BANNER — appears when arriving from Intelligence Feed → Simulate */}
      {simulation && (
        <Card className="border border-[#D4A84C]/40 bg-white" data-testid="simulation-banner">
          <CardContent className="p-4">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="h-8 w-8 rounded-full border border-[#D4A84C] bg-white flex items-center justify-center flex-shrink-0">
                <Play className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] tracking-[0.16em] font-semibold uppercase text-[#8a6c1a]">Simulating from mission control</p>
                  {simulation.urgency && (
                    <span className="text-[10px] tracking-wide uppercase font-mono text-[#8a6c1a]">· {simulation.urgency}</span>
                  )}
                </div>
                <p className="font-serif text-base text-[#1a2744] mt-1" data-testid="simulation-headline">{simulation.headline}</p>
                {simulation.message && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{simulation.message}</p>}
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                {Number.isFinite(simulation.scoreDelta) && (
                  <div>
                    <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Confidence Δ</p>
                    <p className={`font-serif text-lg tabular-nums ${simulation.scoreDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`} data-testid="simulation-score-delta">
                      {simulation.scoreDelta >= 0 ? "+" : ""}{simulation.scoreDelta} pts
                    </p>
                  </div>
                )}
                {Number.isFinite(simulation.financialImpact) && simulation.financialImpact !== 0 && (
                  <div>
                    <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Financial impact</p>
                    <p className={`font-serif text-lg tabular-nums ${simulation.financialImpact >= 0 ? "text-emerald-600" : "text-rose-600"}`} data-testid="simulation-financial-impact">
                      {simulation.financialImpact >= 0 ? "+" : "−"}{fmt(Math.abs(simulation.financialImpact))}
                    </p>
                  </div>
                )}
                {Number.isFinite(simulation.impactScore) && (
                  <div>
                    <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Priority</p>
                    <p className="font-serif text-lg text-[#1a2744] tabular-nums">{simulation.impactScore}</p>
                  </div>
                )}
              </div>
              <PillButton variant="primary" onClick={applySimulation} data-testid="apply-simulation" className="!bg-[#D4A84C] !text-[#1a2744] hover:!bg-[#b8902a]">
                <Zap className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Apply simulation
              </PillButton>
              <PillButton variant="ghost" onClick={clearSimulation} data-testid="clear-simulation">
                <X className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" /> Clear
              </PillButton>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Adjust the Live Scenario sliders below to test this strategy. Use Apply or Generate Advice from Mission Control once satisfied.</p>
          </CardContent>
        </Card>
      )}

      {/* GLOBAL HEADER — quick CTAs row only (identity & KPIs now live in PageShell above) */}
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
