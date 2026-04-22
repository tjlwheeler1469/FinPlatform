// Future Impact Engine™ — the defining feature.
// "I can see my future changing in front of me."
// Sliders + shock scenarios → instant delta-based projections.
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Rocket, TrendingUp, TrendingDown, Zap, Sliders, AlertTriangle,
  Target, ArrowRight, Trophy, Flame, Snowflake, Clock, RotateCcw,
} from "lucide-react";
import { computeReadinessCached } from "@/engine/readinessCache";
import { whatMovesTheNeedle } from "@/engine/retirementReadinessEngine";
import NumberRoll from "@/components/ui/NumberRoll";

const fmtMoney = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const fmtSigned = (v, money = false) => {
  if (v === 0 || Number.isNaN(v)) return "±0";
  const prefix = v > 0 ? "+" : "";
  return prefix + (money ? fmtMoney(v) : v.toString());
};

// ── Delta tile ─────────────────────────────────────────────────────────
const DeltaTile = ({ label, base, scenario, isMoney = false, isPct = false, testId, invert = false }) => {
  const delta = scenario - base;
  const positive = invert ? delta < 0 : delta > 0;
  const neutral = delta === 0;
  const color = neutral ? "text-slate-600" : positive ? "text-emerald-700" : "text-rose-700";
  const bg = neutral ? "bg-slate-50" : positive ? "bg-emerald-50/60" : "bg-rose-50/60";
  const Icon = neutral ? ArrowRight : positive ? TrendingUp : TrendingDown;
  const fmt = (v) => isMoney ? fmtMoney(v) : isPct ? `${Math.round(v)}%` : Math.round(v).toString();
  return (
    <div className={`p-3 rounded-lg border ${bg}`} data-testid={testId}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2 mt-0.5">
        <span className="text-xs text-slate-500 tabular-nums">{fmt(base)}</span>
        <ArrowRight className="h-3 w-3 text-slate-400" />
        <NumberRoll
          value={scenario}
          duration={500}
          format={fmt}
          className="text-lg font-bold text-[#1a2744] tabular-nums"
          testId={`${testId}-value`}
        />
      </div>
      <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${color}`}>
        <Icon className="h-3 w-3" />
        <NumberRoll
          value={delta}
          duration={500}
          format={(v) => {
            if (Math.abs(v) < 0.01) return "±0";
            const signed = v > 0 ? "+" : "";
            if (isMoney) return signed + fmtMoney(v);
            if (isPct) return `${signed}${Math.round(v)} pts`;
            return `${signed}${Math.round(v)}` + (label.includes("Years") ? " yrs" : " pts");
          }}
          className="tabular-nums"
        />
      </div>
    </div>
  );
};

// ── Confidence band strip ──────────────────────────────────────────────
const ConfidenceBand = ({ p10, p50, p90, testId }) => {
  const max = Math.max(p10, p50, p90, 1);
  return (
    <div className="p-3 rounded-lg border bg-slate-50/30" data-testid={testId}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence Bands (at life end)</span>
        <span className="text-[10px] text-muted-foreground">P10 / P50 / P90</span>
      </div>
      <div className="space-y-1.5">
        {[
          { label: "P10 (pessimistic)", v: p10, color: "#e11d48", bg: "#fecdd3" },
          { label: "P50 (median)",      v: p50, color: "#1a2744", bg: "#cbd5e1" },
          { label: "P90 (optimistic)",  v: p90, color: "#10b981", bg: "#a7f3d0" },
        ].map((b) => (
          <div key={b.label} className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-24 flex-shrink-0">{b.label}</span>
            <div className="flex-1 h-3 rounded-full relative overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(b.v / max) * 100}%`, backgroundColor: b.bg }} />
            </div>
            <span className="text-[11px] font-bold tabular-nums w-16 text-right" style={{ color: b.color }}>{fmtMoney(b.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Shock scenarios ────────────────────────────────────────────────────
const SHOCKS = {
  market_crash: { label: "Market crash −30%", icon: Flame,      accent: "#e11d48", assetMultiplier: 0.70, returnDelta: 0,   infDelta: 0,    ageDelta: 0  },
  inflation:    { label: "Inflation spike +3%", icon: Snowflake,accent: "#7c3aed", assetMultiplier: 1.0,  returnDelta: -0.02, infDelta: 0.03, ageDelta: 0 },
  early_retire: { label: "Early retirement −5yr", icon: Clock,  accent: "#f59e0b", assetMultiplier: 1.0,  returnDelta: 0,    infDelta: 0,    ageDelta: -5 },
};

// ── Main component ─────────────────────────────────────────────────────
const FutureImpactEngine = ({ client, baseReadiness }) => {
  const clientId = client.profile?.user_id || client.profile?.name || "unknown";
  const base = baseReadiness;

  // Sliders
  const [retireAge, setRetireAge] = useState(client.retirement?.retirement_age || 67);
  const [contrib, setContrib] = useState(client.retirement?.annual_contributions || 0);
  const [spending, setSpending] = useState(client.retirement?.retirement_spending || 150000);
  const [expectedReturn, setExpectedReturn] = useState(6.5);
  const [inflation, setInflation] = useState(2.5);

  // Shocks (toggles)
  const [shocks, setShocks] = useState({ market_crash: false, inflation: false, early_retire: false });

  // Reset when client changes
  useEffect(() => {
    setRetireAge(client.retirement?.retirement_age || 67);
    setContrib(client.retirement?.annual_contributions || 0);
    setSpending(client.retirement?.retirement_spending || 150000);
    setExpectedReturn(6.5);
    setInflation(2.5);
    setShocks({ market_crash: false, inflation: false, early_retire: false });
  }, [client]);

  const applyPreset = (preset) => {
    const baseAge = client.retirement?.retirement_age || 67;
    const baseContrib = client.retirement?.annual_contributions || 0;
    const baseSpend = client.retirement?.retirement_spending || 150000;
    if (preset === "baseline") {
      setRetireAge(baseAge); setContrib(baseContrib); setSpending(baseSpend); setExpectedReturn(6.5); setInflation(2.5);
      setShocks({ market_crash: false, inflation: false, early_retire: false });
    } else if (preset === "aggressive") {
      setRetireAge(Math.max(55, baseAge - 2)); setContrib(30000); setSpending(Math.round(baseSpend * 1.1)); setExpectedReturn(8.0); setInflation(2.5);
    } else if (preset === "cautious") {
      setRetireAge(baseAge + 2); setContrib(Math.max(baseContrib, 15000)); setSpending(Math.round(baseSpend * 0.9)); setExpectedReturn(4.5); setInflation(3.0);
    } else if (preset === "part_time") {
      setRetireAge(baseAge + 3); setContrib(Math.max(0, Math.round(baseContrib * 0.5))); setSpending(Math.round(baseSpend * 0.95)); setExpectedReturn(6.0); setInflation(2.5);
    }
  };

  // Build the shocked scenario client
  const scenarioClient = useMemo(() => {
    const shockedAssets = shocks.market_crash
      ? (client.assets || []).map((a) => {
          const isGrowth = ["Shares", "Managed Fund", "Alternatives", "Trust Portfolio", "Crypto", "Super", "SMSF"].includes(a.type);
          return { ...a, value: (a.value || 0) * (isGrowth ? SHOCKS.market_crash.assetMultiplier : 0.9) };
        })
      : (client.assets || []);

    const ageOffset = shocks.early_retire ? SHOCKS.early_retire.ageDelta : 0;

    return {
      ...client,
      assets: shockedAssets,
      retirement: {
        ...client.retirement,
        retirement_age: retireAge + ageOffset,
        annual_contributions: contrib,
        retirement_spending: spending,
      },
    };
  }, [client, retireAge, contrib, spending, shocks]);

  const scenarioOpts = useMemo(() => {
    let r = expectedReturn / 100;
    let i = inflation / 100;
    if (shocks.inflation) { r += SHOCKS.inflation.returnDelta; i += SHOCKS.inflation.infDelta; }
    return { numSims: 150, expectedReturn: r, inflationRate: i };
  }, [expectedReturn, inflation, shocks]);

  const scenario = useMemo(
    () => computeReadinessCached(`${clientId}:fie`, scenarioClient, scenarioOpts),
    [clientId, scenarioClient, scenarioOpts]
  );

  // Lifetime income $ impact = annual income × years in retirement
  const yearsInRet = Math.max(1, (client.retirement?.life_expectancy || 92) - (scenarioClient.retirement?.retirement_age || 67));
  const baseLifetime = base.outcome.sustainableIncome * yearsInRet;
  const scenarioLifetime = scenario.outcome.sustainableIncome * yearsInRet;

  // Risk change proxy = negative of (risk-factor score delta)
  const baseRiskScore = base.factors.find((f) => f.id === "risk")?.score || 50;
  const scenarioRiskScore = scenario.factors.find((f) => f.id === "risk")?.score || 50;

  const [showWhatMatters, setShowWhatMatters] = useState(false);
  const topActions = useMemo(() => whatMovesTheNeedle(client), [client]);

  return (
    <Card data-testid="future-impact-engine" className="border-[#D4A84C]/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4 text-[#D4A84C]" /> 3 · Future Impact Engine™
            </CardTitle>
            <CardDescription>See your future change in real time. Move a slider, flip a shock — instant delta.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" data-testid="fie-presets">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Presets:</span>
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => applyPreset("baseline")} data-testid="fie-preset-baseline">
              <RotateCcw className="h-3 w-3 mr-1" /> Baseline
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => applyPreset("aggressive")} data-testid="fie-preset-aggressive">Aggressive</Button>
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] border-sky-300 text-sky-700 hover:bg-sky-50" onClick={() => applyPreset("cautious")} data-testid="fie-preset-cautious">Cautious</Button>
            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => applyPreset("part_time")} data-testid="fie-preset-parttime">Part-time</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── INSTANT DELTA STRIP — the hero ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2" data-testid="fie-delta-strip">
          <DeltaTile label="Readiness Score" base={base.score} scenario={scenario.score} testId="delta-score" />
          <DeltaTile label="Lifetime Income" base={baseLifetime} scenario={scenarioLifetime} isMoney testId="delta-lifetime" />
          <DeltaTile label="Success Probability" base={base.outcome.probabilityOfSuccess} scenario={scenario.outcome.probabilityOfSuccess} isPct testId="delta-probability" />
          <DeltaTile label="Years Sustainable" base={base.outcome.yearsSustainability} scenario={scenario.outcome.yearsSustainability} testId="delta-years" />
          <DeltaTile label="Risk Exposure" base={baseRiskScore} scenario={scenarioRiskScore} testId="delta-risk" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Column 1: Sliders ── */}
          <div className="lg:col-span-1 space-y-4 p-3 rounded-lg bg-slate-50/40 border">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Sliders className="h-4 w-4 text-[#D4A84C]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1a2744]">Levers</span>
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">Retirement age</Label><span className="font-semibold tabular-nums text-sm">{retireAge}</span></div>
              <Slider value={[retireAge]} min={55} max={75} step={1} onValueChange={(v) => setRetireAge(v[0])} data-testid="fie-slider-age" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">Annual contributions</Label><span className="font-semibold tabular-nums text-sm">{fmtMoney(contrib)}</span></div>
              <Slider value={[contrib]} min={0} max={60000} step={1000} onValueChange={(v) => setContrib(v[0])} data-testid="fie-slider-contrib" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">Retirement spending</Label><span className="font-semibold tabular-nums text-sm">{fmtMoney(spending)}</span></div>
              <Slider value={[spending]} min={50000} max={400000} step={5000} onValueChange={(v) => setSpending(v[0])} data-testid="fie-slider-spending" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">Expected real return</Label><span className="font-semibold tabular-nums text-sm">{expectedReturn.toFixed(1)}%</span></div>
              <Slider value={[expectedReturn * 10]} min={20} max={100} step={5} onValueChange={(v) => setExpectedReturn(v[0] / 10)} data-testid="fie-slider-return" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><Label className="text-xs">Inflation</Label><span className="font-semibold tabular-nums text-sm">{inflation.toFixed(1)}%</span></div>
              <Slider value={[inflation * 10]} min={10} max={60} step={1} onValueChange={(v) => setInflation(v[0] / 10)} data-testid="fie-slider-inflation" />
            </div>
          </div>

          {/* ── Column 2: Shock Simulator ── */}
          <div className="lg:col-span-1 space-y-3 p-3 rounded-lg bg-slate-50/40 border">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#D4A84C]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1a2744]">Shock Simulator</span>
              </div>
              <Badge variant="outline" className="text-[9px]">Toggle a crisis</Badge>
            </div>
            {Object.entries(SHOCKS).map(([key, sh]) => {
              const ShIcon = sh.icon;
              return (
                <div key={key} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${shocks[key] ? "border-rose-300 bg-rose-50/60" : "bg-white"}`} data-testid={`shock-${key}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${sh.accent}15` }}>
                    <ShIcon className="h-4 w-4" style={{ color: sh.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1a2744]">{sh.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {key === "market_crash" && "Growth assets drop 30%, defensive drop 10%."}
                      {key === "inflation" && "CPI +3% · real returns −2%."}
                      {key === "early_retire" && "Retire 5 years sooner — no prep time."}
                    </p>
                  </div>
                  <Switch checked={shocks[key]} onCheckedChange={(v) => setShocks((s) => ({ ...s, [key]: v }))} data-testid={`shock-toggle-${key}`} />
                </div>
              );
            })}
            {(shocks.market_crash || shocks.inflation || shocks.early_retire) && (
              <div className="flex items-center gap-2 p-2 rounded bg-rose-100/60 border border-rose-200">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
                <p className="text-[11px] text-rose-700">Shock mode active — deltas above reflect crisis scenario.</p>
              </div>
            )}
          </div>

          {/* ── Column 3: Confidence bands + What Matters Most ── */}
          <div className="lg:col-span-1 space-y-3">
            <ConfidenceBand
              p10={scenario.outcome.confidenceBands.p10}
              p50={scenario.outcome.confidenceBands.p50}
              p90={scenario.outcome.confidenceBands.p90}
              testId="fie-confidence-bands"
            />

            <div className="p-3 rounded-lg border bg-gradient-to-br from-[#D4A84C]/10 to-[#D4A84C]/5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-[#D4A84C]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7a5d1f]">What Matters Most</span>
              </div>
              {!showWhatMatters ? (
                <>
                  <p className="text-[11px] text-muted-foreground mb-2">Top 3 actions that will move this client the most, ranked by score uplift.</p>
                  <Button size="sm" className="w-full bg-[#1a2744] hover:bg-[#0f1d35] text-xs gap-1.5" onClick={() => setShowWhatMatters(true)} data-testid="fie-reveal-wmm">
                    <Target className="h-3 w-3" /> Reveal top 3
                  </Button>
                </>
              ) : (
                <div className="space-y-1.5" data-testid="fie-wmm-list">
                  {topActions.map((a, i) => (
                    <div key={a.id} className="flex items-center gap-2 p-2 rounded bg-white border" data-testid={`fie-wmm-${a.id}`}>
                      <span className="w-5 h-5 rounded-full bg-[#1a2744] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className="flex-1 text-[11px] font-medium text-[#1a2744] truncate">{a.label}</span>
                      <span className={`text-[11px] font-bold tabular-nums ${a.uplift >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {a.uplift >= 0 ? "+" : ""}{a.uplift} pts
                      </span>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="w-full text-[11px] h-7" onClick={() => setShowWhatMatters(false)}>Collapse</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FutureImpactEngine;
