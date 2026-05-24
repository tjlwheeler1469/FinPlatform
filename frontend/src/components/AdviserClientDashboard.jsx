import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
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
  const colorBg = { emerald: "bg-emerald-50 border-emerald-200", amber: "bg-amber-50 border-amber-200", rose: "bg-rose-50 border-rose-200" }[tone];
  const colorText = { emerald: "text-emerald-700", amber: "text-amber-700", rose: "text-rose-700" }[tone];
  const ringColor = { emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e" }[tone];

  return (
    <Card className={`${colorBg} border-2`} data-testid="card-retirement-readiness">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gauge className={`h-4 w-4 ${colorText}`} />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Retirement Readiness</p>
          </div>
          <Badge variant="outline" className={colorText}>{tone === "emerald" ? "On Track" : tone === "amber" ? "Monitor" : "At Risk"}</Badge>
        </div>
        <div className="flex items-end gap-4">
          {/* Ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth="8"
                strokeDasharray={`${(confidence / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[#1a2744]" data-testid="confidence-score">{confidence}%</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">confidence</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Success Probability</p>
              <p className="text-lg font-semibold">{confidence}%</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{surplus >= 0 ? "Surplus" : "Shortfall"}</p>
              <p className={`text-sm font-semibold ${surplus >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmt(Math.abs(surplus))}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Top Risk Driver</p>
          <p className="text-xs font-medium text-gray-800 mb-2.5">{topRisk}</p>
          <Button size="sm" className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90" onClick={onImprove} data-testid="btn-improve-outcome">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Improve Outcome
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AlertsCard = ({ alerts }) => (
  <Card className="border-2" data-testid="card-alerts">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alerts & Exceptions</p>
        </div>
        <Badge variant="outline">{alerts.filter(a => a.level !== "green").length} active</Badge>
      </div>
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const dotColor = { green: "bg-emerald-500", yellow: "bg-amber-500", red: "bg-rose-500" }[a.level];
          const textColor = { green: "text-emerald-700", yellow: "text-amber-700", red: "text-rose-700" }[a.level];
          return (
            <div key={i} className="flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors" data-testid={`alert-item-${i}`}>
              <div className={`h-2.5 w-2.5 rounded-full ${dotColor} mt-1 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.detail}</p>
              </div>
              <span className={`text-[10px] font-medium ${textColor} uppercase tracking-wide`}>{a.delta}</span>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

const OpportunitiesCard = ({ opportunities, onAction }) => (
  <Card className="border-2" data-testid="card-opportunities">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#D4A84C]" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Opportunities</p>
        </div>
        <Badge className="bg-[#D4A84C]/10 text-[#8a6d2a] border-[#D4A84C]/40">{fmt(opportunities.reduce((s, o) => s + o.impact, 0))} potential</Badge>
      </div>
      <div className="space-y-2">
        {opportunities.map((o, i) => (
          <button key={i}
            className="w-full text-left flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => onAction(o)} data-testid={`opportunity-item-${i}`}>
            <div className="h-6 w-6 rounded-md bg-[#1a2744]/5 flex items-center justify-center flex-shrink-0">
              <o.icon className="h-3.5 w-3.5 text-[#1a2744]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">{o.title}</p>
              <p className="text-[11px] text-muted-foreground">{o.detail}</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">{fmt(o.impact)}</span>
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
    <Card data-testid="card-balance-sheet">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Household Financial Map</p>
            <p className="text-xl font-bold text-[#1a2744] mt-0.5">{fmt(totals.netWorth)}<span className="text-sm text-muted-foreground font-normal ml-1">net worth</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase">Assets → Liab</p>
            <p className="text-xs font-semibold">{fmt(totals.grossAssets)} - {fmt(totals.totalLiabilities)}</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {Object.entries(byType).sort((a,b) => b[1] - a[1]).map(([type, val]) => {
            const Icon = iconMap[type] || Briefcase;
            return (
              <div key={type} className="flex items-center gap-3" data-testid={`asset-row-${type.toLowerCase().replace(/[^a-z]/g,"-")}`}>
                <div className="h-7 w-7 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[#1a2744]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{type}</span>
                    <span className="text-xs font-semibold text-gray-900">{fmt(val)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1a2744] rounded-full transition-all" style={{ width: `${(val / maxVal) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Cash Flow + Liabilities summary */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Income</p>
            <p className="text-sm font-semibold text-emerald-700">{fmt(client.profile.incomeHousehold)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Expenses</p>
            <p className="text-sm font-semibold text-rose-700">{fmt(client.profile.expensesAnnual)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">Liabilities</p>
            <p className="text-sm font-semibold text-gray-700">{fmt(totals.totalLiabilities)}</p>
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
    <Card data-testid="card-scenario-engine">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#1a2744]" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live Scenario</p>
          </div>
          <Badge variant="outline" className="text-[10px]">Monte Carlo · 500 sims</Badge>
        </div>

        {/* Headline confidence */}
        <div className="bg-gradient-to-br from-[#1a2744] to-[#2a3a5c] text-white rounded-lg p-4 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold" data-testid="scenario-confidence">{scenario.confidence}%</span>
            <span className="text-xs text-white/70">confidence</span>
            {delta !== 0 && (
              <span className={`ml-auto text-xs font-semibold flex items-center gap-0.5 ${delta > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {delta > 0 ? "+" : ""}{delta}% vs current
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/70 mt-1">Portfolio at retirement: {fmt(scenario.portfolioAtRetirement)}</p>
        </div>

        {/* "With Strategy" projection — only when arriving from Mission Control with an active simulation */}
        {simulation && (
          <div className="mb-4 rounded-lg border border-[#D4A84C] bg-[#FFFDF7] p-3" data-testid="with-strategy-projection">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a6c1a]">With Strategy</p>
              <Badge variant="outline" className="text-[10px] border-[#D4A84C] text-[#8a6c1a]">{simulation.headline?.slice(0, 36)}</Badge>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              {Number.isFinite(simulation.scoreDelta) && (
                <span className="text-2xl font-bold text-emerald-700">
                  {Math.min(100, Math.max(0, baseConfidence + simulation.scoreDelta))}%
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">projected confidence</span>
              {Number.isFinite(simulation.financialImpact) && simulation.financialImpact !== 0 && (
                <span className="ml-auto text-[12px] font-semibold text-emerald-700">
                  {simulation.financialImpact >= 0 ? "+" : "−"}{fmt(Math.abs(simulation.financialImpact))} lifetime
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Click <strong>Apply Simulation</strong> on the banner to push these values into the sliders below.</p>
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-3">
          <div data-testid="slider-retire-age">
            <div className="flex justify-between mb-1.5">
              <label className="text-[11px] font-medium text-gray-700">Retirement Age</label>
              <span className="text-xs font-semibold text-[#1a2744]">{retireAge}</span>
            </div>
            <Slider min={55} max={75} step={1} value={[retireAge]} onValueChange={(v) => setRetireAge(v[0])} />
          </div>
          <div data-testid="slider-spending">
            <div className="flex justify-between mb-1.5">
              <label className="text-[11px] font-medium text-gray-700">Retirement Spending</label>
              <span className="text-xs font-semibold text-[#1a2744]">{fmt(annualSpend)}/yr</span>
            </div>
            <Slider min={50000} max={500000} step={5000} value={[annualSpend]} onValueChange={(v) => setAnnualSpend(v[0])} />
          </div>
          <div data-testid="slider-contributions">
            <div className="flex justify-between mb-1.5">
              <label className="text-[11px] font-medium text-gray-700">Annual Contributions</label>
              <span className="text-xs font-semibold text-[#1a2744]">{fmt(annualContrib)}/yr</span>
            </div>
            <Slider min={0} max={300000} step={5000} value={[annualContrib]} onValueChange={(v) => setAnnualContrib(v[0])} />
          </div>
          <div data-testid="slider-volatility">
            <div className="flex justify-between mb-1.5">
              <label className="text-[11px] font-medium text-gray-700">Portfolio Volatility (σ)</label>
              <span className="text-xs font-semibold text-[#1a2744]">
                {volatility}% · {volatility <= 8 ? "Conservative" : volatility <= 14 ? "Balanced" : volatility <= 18 ? "Growth" : "Aggressive"}
              </span>
            </div>
            <Slider min={4} max={24} step={1} value={[volatility]} onValueChange={(v) => setVolatility(v[0])} />
          </div>
        </div>

        {/* Quick presets */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button variant="outline" size="sm" className="text-xs h-8" data-testid="preset-retire-65"
            onClick={() => { setRetireAge(65); setAnnualSpend(client.retirement.retirement_spending); setAnnualContrib(client.retirement.annual_contributions); }}>
            Retire @ 65
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" data-testid="preset-retire-67"
            onClick={() => { setRetireAge(67); setAnnualSpend(client.retirement.retirement_spending); setAnnualContrib(client.retirement.annual_contributions); }}>
            Retire @ 67
          </Button>
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
    { count: 4, label: "reviews due this week", tone: "gray", icon: Calendar, to: "/adviser-compliance", testid: "priority-reviews" },
  ];
  return (
    <Card data-testid="card-priorities">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#1a2744]" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today's Priorities</p>
          </div>
          <Badge variant="outline" className="text-[10px]">{new Date().toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" })}</Badge>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => {
            const bg = { rose: "bg-rose-50 hover:bg-rose-100", amber: "bg-amber-50 hover:bg-amber-100", gray: "bg-gray-50 hover:bg-gray-100" }[item.tone];
            const text = { rose: "text-rose-700", amber: "text-amber-700", gray: "text-gray-700" }[item.tone];
            return (
              <button
                key={i}
                type="button"
                onClick={() => navigate(item.to)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-colors text-left ${bg} cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4A84C]`}
                data-testid={item.testid}
              >
                <item.icon className={`h-4 w-4 ${text}`} />
                <span className={`text-2xl font-bold ${text}`}>{item.count}</span>
                <span className="text-xs text-gray-700 flex-1">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Markets strip — moved here from Firm section */}
        <div className="mt-4 pt-3 border-t" data-testid="markets-strip">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-[#1a2744]" />
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Markets</p>
            <Badge variant="outline" className="text-[9px] ml-auto">Live</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded bg-gray-50 text-center" data-testid="market-asx">
              <p className="text-[10px] text-muted-foreground">ASX 200</p>
              <p className="text-sm font-bold text-[#1a2744]">7,856</p>
              <p className="text-[10px] text-emerald-600 flex items-center justify-center gap-0.5"><ArrowUpRight className="h-2.5 w-2.5" />0.42%</p>
            </div>
            <div className="p-2 rounded bg-gray-50 text-center" data-testid="market-aud">
              <p className="text-[10px] text-muted-foreground">AUD/USD</p>
              <p className="text-sm font-bold text-[#1a2744]">0.6545</p>
              <p className="text-[10px] text-rose-600 flex items-center justify-center gap-0.5"><ArrowDownRight className="h-2.5 w-2.5" />0.15%</p>
            </div>
            <div className="p-2 rounded bg-gray-50 text-center" data-testid="market-rba">
              <p className="text-[10px] text-muted-foreground">RBA Rate</p>
              <p className="text-sm font-bold text-[#1a2744]">4.35%</p>
              <p className="text-[10px] text-muted-foreground">unchanged</p>
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
    <Card data-testid="card-meeting-prep">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#1a2744]" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meeting Prep</p>
          </div>
          <Badge variant="outline" className="text-[10px]">{nextMeeting}</Badge>
        </div>
        <p className="text-sm font-semibold text-[#1a2744] mb-3">Annual Review: {client.profile.name}</p>
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-2 text-xs" data-testid="meeting-change-1">
            <TrendingDown className="h-3.5 w-3.5 text-rose-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Confidence <strong>dropped 4 pts</strong> since last review</span>
          </div>
          <div className="flex items-start gap-2 text-xs" data-testid="meeting-change-2">
            <Activity className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">New <strong>equity over-allocation</strong> needs rebalance</span>
          </div>
          <div className="flex items-start gap-2 text-xs" data-testid="meeting-change-3">
            <Sparkles className="h-3.5 w-3.5 text-[#D4A84C] mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Recommend scenario: <strong>Retire at 67 (+9% confidence)</strong></span>
          </div>
        </div>
        <Button className="w-full bg-[#1a2744] hover:bg-[#1a2744]/90" size="sm" onClick={onGeneratePack} data-testid="btn-generate-review-pack">
          <FileText className="h-3.5 w-3.5 mr-1.5" /> Generate Review Pack
        </Button>
      </CardContent>
    </Card>
  );
};

// -------- Row 4 ----------
const WhatChangedCard = ({ changes }) => (
  <Card data-testid="card-what-changed">
    <CardContent className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#1a2744]" />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What Changed Since Last Review</p>
        </div>
        <span className="text-[11px] text-muted-foreground">Last review: 3 months ago</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {changes.map((c, i) => {
          const ArrowIcon = c.delta >= 0 ? ArrowUpRight : ArrowDownRight;
          // isNegative flag: true means this metric-direction is bad (e.g. spending up, confidence down)
          const sentiment = c.isNegative ? "rose" : "emerald";
          const toneText = sentiment === "emerald" ? "text-emerald-700" : "text-rose-700";
          return (
            <div key={i} className="border rounded-md p-3" data-testid={`change-item-${i}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{c.label}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-[#1a2744]">{c.current}</span>
                <span className={`text-xs font-semibold flex items-center ${toneText}`}>
                  <ArrowIcon className="h-3 w-3" />
                  {Math.abs(c.delta)}{c.suffix}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">was {c.previous}</p>
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
        <Card className="border-2 border-[#D4A84C] bg-gradient-to-r from-[#FFF8E7] to-[#FFFDF7] shadow-md" data-testid="simulation-banner">
          <CardContent className="p-4">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="h-9 w-9 rounded-full bg-[#D4A84C] flex items-center justify-center text-white flex-shrink-0">
                <Play className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8a6c1a]">Simulating from Mission Control</p>
                  {simulation.urgency && (
                    <Badge variant="outline" className="text-[10px] border-[#D4A84C] text-[#8a6c1a]">{simulation.urgency}</Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#1a2744] mt-0.5" data-testid="simulation-headline">{simulation.headline}</p>
                {simulation.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{simulation.message}</p>}
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                {Number.isFinite(simulation.scoreDelta) && (
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Confidence Δ</p>
                    <p className={`text-lg font-bold ${simulation.scoreDelta >= 0 ? "text-emerald-700" : "text-rose-600"}`} data-testid="simulation-score-delta">
                      {simulation.scoreDelta >= 0 ? "+" : ""}{simulation.scoreDelta} pts
                    </p>
                  </div>
                )}
                {Number.isFinite(simulation.financialImpact) && simulation.financialImpact !== 0 && (
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Financial Impact</p>
                    <p className={`text-lg font-bold ${simulation.financialImpact >= 0 ? "text-emerald-700" : "text-rose-600"}`} data-testid="simulation-financial-impact">
                      {simulation.financialImpact >= 0 ? "+" : "−"}{fmt(Math.abs(simulation.financialImpact))}
                    </p>
                  </div>
                )}
                {Number.isFinite(simulation.impactScore) && (
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Priority</p>
                    <p className="text-lg font-bold text-[#1a2744]">{simulation.impactScore}</p>
                  </div>
                )}
              </div>
              <Button size="sm" variant="default" onClick={applySimulation} data-testid="apply-simulation" className="bg-[#D4A84C] hover:bg-[#b8902a] text-white">
                <Zap className="h-4 w-4 mr-1" /> Apply Simulation
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSimulation} data-testid="clear-simulation" className="text-muted-foreground hover:text-[#1a2744]">
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Adjust the Live Scenario sliders below to test this strategy. Use Apply or Generate Advice from Mission Control once satisfied.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GLOBAL HEADER — sticky, premium */}
      <Card className="border-2 border-[#1a2744]/20 sticky top-2 z-20 shadow-sm" data-testid="client-dashboard-header">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
            {/* Client identity */}
            <div className="flex items-center gap-3 min-w-0 lg:min-w-[220px]">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1a2744] to-[#2a3a5c] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                {client.profile.first_name?.[0]}{client.profile.last_name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1a2744] leading-tight truncate" data-testid="header-client-name" title={client.profile.name}>{client.profile.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{client.profile.status} · Age {client.profile.age} · {client.profile.riskProfile}</p>
              </div>
            </div>

            {/* Metrics inline — flex-wrap instead of rigid grid */}
            <div className="flex flex-wrap gap-5 sm:gap-7 flex-1 items-center">
              <div className="flex-shrink-0 min-w-[88px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">Net Worth</p>
                <p className="text-base font-bold text-[#1a2744] leading-tight" data-testid="header-net-worth">{fmt(totals.netWorth)}</p>
              </div>
              <div className="flex-shrink-0 min-w-[88px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">Confidence</p>
                <p className="text-base font-bold text-emerald-700 leading-tight" data-testid="header-confidence">{baseScenario.confidence}%</p>
              </div>
              <div className="flex-shrink-0 min-w-[88px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">Risk</p>
                <p className="text-base font-bold text-gray-800 leading-tight" data-testid="header-risk">{client.profile.riskProfile}</p>
              </div>
              <div className="flex-shrink-0 min-w-[110px]">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">Updated</p>
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1 leading-tight whitespace-nowrap" data-testid="header-updated">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" /> Live · {lastUpdatedText}
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-2 flex-wrap lg:flex-nowrap flex-shrink-0">
              <Button size="sm" variant="outline" onClick={handleImprove} data-testid="cta-improve-outcome">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Improve
              </Button>
              <Button size="sm" variant="outline" onClick={handleRunScenario} data-testid="cta-run-scenario">
                <Activity className="h-3.5 w-3.5 mr-1" /> Scenario
              </Button>
              <Button size="sm" className="bg-[#1a2744] hover:bg-[#1a2744]/90" onClick={handleGeneratePack} data-testid="cta-generate-review-pack">
                <FileText className="h-3.5 w-3.5 mr-1" /> Review Pack
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
