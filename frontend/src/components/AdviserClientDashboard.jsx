import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { CLIENT_DATA, computeClientTotals } from "@/data/clientData";
import { projectRetirement } from "@/components/ScenarioEngine";

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

const EmbeddedScenarioCard = ({ client, totals, baseConfidence, onGenerate }) => {
  const liquidAssets = useMemo(() =>
    client.assets.filter(a => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio"].includes(a.type))
      .reduce((s, a) => s + a.value, 0),
  [client]);

  const [retireAge, setRetireAge] = useState(client.retirement.retirement_age);
  const [annualSpend, setAnnualSpend] = useState(client.retirement.retirement_spending);
  const [annualContrib, setAnnualContrib] = useState(client.retirement.annual_contributions);

  const scenario = useMemo(() => {
    const yearsToRet = Math.max(1, retireAge - client.profile.age);
    const result = projectRetirement({
      currentPortfolio: liquidAssets,
      annualContributions: annualContrib,
      annualSpending: annualSpend,
      yearsToRetirement: yearsToRet,
      expectedReturn: 0.065, volatility: 0.12, inflationRate: 0.03,
    });
    return { ...result, yearsToRet };
  }, [liquidAssets, retireAge, annualSpend, annualContrib, client.profile.age]);

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
  const items = [
    { count: 3, label: "clients below 75% confidence", tone: "rose", icon: AlertTriangle },
    { count: 2, label: "urgent risks", tone: "amber", icon: Activity },
    { count: 1, label: "rebalance pending", tone: "amber", icon: TrendingUp },
    { count: 4, label: "reviews due this week", tone: "gray", icon: Calendar },
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
            const bg = { rose: "bg-rose-50", amber: "bg-amber-50", gray: "bg-gray-50" }[item.tone];
            const text = { rose: "text-rose-700", amber: "text-amber-700", gray: "text-gray-700" }[item.tone];
            return (
              <div key={i} className={`flex items-center gap-3 p-2.5 rounded-md ${bg}`} data-testid={`priority-${i}`}>
                <item.icon className={`h-4 w-4 ${text}`} />
                <span className={`text-2xl font-bold ${text}`}>{item.count}</span>
                <span className="text-xs text-gray-700 flex-1">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            );
          })}
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
          const sentiment = c.positiveDown ? (c.delta <= 0 ? "emerald" : "rose") : (c.delta >= 0 ? "emerald" : "rose");
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
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const totals = computeClientTotals(clientId);
  const [liveTick, setLiveTick] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setLiveTick(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

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
    });
  }, [client]);

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

  // What Changed (vs last review)
  const changes = [
    { label: "Confidence", current: `${baseScenario.confidence}%`, delta: -4, suffix: "%", previous: `${baseScenario.confidence + 4}%`, positiveDown: false },
    { label: "Spending", current: fmt(client.profile.expensesAnnual), delta: 6, suffix: "%", previous: fmt(client.profile.expensesAnnual * 0.94), positiveDown: true },
    { label: "Equity Exposure", current: "42%", delta: 8, suffix: "pts", previous: "34%", positiveDown: false },
    { label: "Net Worth", current: fmt(totals.netWorth), delta: 3.2, suffix: "%", previous: fmt(totals.netWorth * 0.969), positiveDown: false },
  ];

  const handleImprove = () => toast.success("Opening scenario builder to improve outcome", { description: "Adjust the sliders in Row 2 to see confidence updates live" });
  const handleGeneratePack = () => toast.success("Generating Review Pack...", { description: "PDF will be ready in a few seconds" });
  const handleRunScenario = () => toast.info("Scenario engine is embedded below — adjust the sliders live");
  const handleOppAction = (o) => toast.success(`Action: ${o.title}`, { description: `Estimated impact: ${fmt(o.impact)}` });

  const lastUpdatedText = new Date(liveTick).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="space-y-5" data-testid="adviser-client-dashboard">
      {/* GLOBAL HEADER — sticky, premium */}
      <Card className="border-2 border-[#1a2744]/20 sticky top-2 z-20 shadow-sm" data-testid="client-dashboard-header">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
            {/* Client identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1a2744] to-[#2a3a5c] flex items-center justify-center text-white text-sm font-semibold">
                  {client.profile.first_name?.[0]}{client.profile.last_name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1a2744] leading-tight" data-testid="header-client-name">{client.profile.name}</p>
                  <p className="text-[11px] text-muted-foreground">{client.profile.status} · Age {client.profile.age} · {client.profile.riskProfile}</p>
                </div>
              </div>
            </div>

            {/* Metrics inline */}
            <div className="grid grid-cols-4 gap-4 flex-1">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Worth</p>
                <p className="text-base font-bold text-[#1a2744]" data-testid="header-net-worth">{fmt(totals.netWorth)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Confidence</p>
                <p className="text-base font-bold text-emerald-700" data-testid="header-confidence">{baseScenario.confidence}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Risk</p>
                <p className="text-base font-bold text-gray-800" data-testid="header-risk">{client.profile.riskProfile}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Updated</p>
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1" data-testid="header-updated">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live · {lastUpdatedText}
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={handleImprove} data-testid="cta-improve-outcome">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Improve Outcome
              </Button>
              <Button size="sm" variant="outline" onClick={handleRunScenario} data-testid="cta-run-scenario">
                <Activity className="h-3.5 w-3.5 mr-1" /> Run Scenario
              </Button>
              <Button size="sm" className="bg-[#1a2744] hover:bg-[#1a2744]/90" onClick={handleGeneratePack} data-testid="cta-generate-review-pack">
                <FileText className="h-3.5 w-3.5 mr-1" /> Generate Review Pack
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
          <EmbeddedScenarioCard client={client} totals={totals} baseConfidence={baseScenario.confidence} />
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
