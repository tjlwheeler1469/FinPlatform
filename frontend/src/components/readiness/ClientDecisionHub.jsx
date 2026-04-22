// Client Decision Hub — the retirement-first adviser view of a single client.
// 6 sections: Outcome · What Moves The Needle · Scenario Simulator · Risk Panel · Opportunity Engine · Decision Graph.
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Gauge, Target, Sliders, Shield, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Activity } from "lucide-react";
import ReadinessDial from "@/components/readiness/ReadinessDial";
import DecisionGraph from "@/components/readiness/DecisionGraph";
import { whatMovesTheNeedle, riskPanel } from "@/engine/retirementReadinessEngine";
import { computeReadinessCached, onRecalc, startMarketFeed, getMarketPulse, onMarketPulse, pulseNow } from "@/engine/readinessCache";
import { evaluateRules } from "@/engine/rulesEngine";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const severityStyles = {
  high: "bg-rose-100 text-rose-700 border-rose-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-sky-100 text-sky-700 border-sky-200",
  critical: "bg-rose-200 text-rose-900 border-rose-400",
  info: "bg-slate-100 text-slate-700 border-slate-200",
};

const ClientDecisionHub = ({ client }) => {
  // Scenario simulator overrides
  const [retireAge, setRetireAge] = useState(client.retirement?.retirement_age || 67);
  const [contrib, setContrib] = useState(client.retirement?.annual_contributions || 0);
  const [spending, setSpending] = useState(client.retirement?.retirement_spending || 150000);
  const [expectedReturn, setExpectedReturn] = useState(6.5);
  const [inflation, setInflation] = useState(2.5);
  const [pulse, setPulse] = useState(() => getMarketPulse());

  // ── Scenario presets ──
  const applyPreset = (preset) => {
    const baseAge = client.retirement?.retirement_age || 67;
    const baseContrib = client.retirement?.annual_contributions || 0;
    const baseSpend = client.retirement?.retirement_spending || 150000;
    if (preset === "baseline") {
      setRetireAge(baseAge);
      setContrib(baseContrib);
      setSpending(baseSpend);
      setExpectedReturn(6.5);
      setInflation(2.5);
    } else if (preset === "aggressive") {
      setRetireAge(Math.max(55, baseAge - 2));
      setContrib(30000);
      setSpending(Math.round(baseSpend * 1.1));
      setExpectedReturn(8.0);
      setInflation(2.5);
    } else if (preset === "cautious") {
      setRetireAge(baseAge + 2);
      setContrib(Math.max(baseContrib, 15000));
      setSpending(Math.round(baseSpend * 0.9));
      setExpectedReturn(4.5);
      setInflation(3.0);
    } else if (preset === "part_time") {
      setRetireAge(baseAge + 3);
      setContrib(Math.max(0, Math.round(baseContrib * 0.5)));
      setSpending(Math.round(baseSpend * 0.95));
      setExpectedReturn(6.0);
      setInflation(2.5);
    }
  };

  const clientId = client.profile?.user_id || client.profile?.name || "unknown";
  // Force recompute counter bumped by market-feed / user-edit event bus
  const [recalcTick, setRecalcTick] = useState(0);

  useEffect(() => {
    startMarketFeed();
    const off = onRecalc(clientId, () => setRecalcTick((t) => t + 1));
    const offWild = onRecalc("*", () => setRecalcTick((t) => t + 1));
    const offPulse = onMarketPulse((p) => setPulse(p));
    return () => { off(); offWild(); offPulse(); };
  }, [clientId]);

  const baseReadiness = useMemo(() => computeReadinessCached(clientId, client, { numSims: 250 }), [clientId, client, recalcTick]);
  const rules = useMemo(() => evaluateRules(client, baseReadiness), [client, baseReadiness]);
  const risks = useMemo(() => riskPanel(client), [client]);
  const topActions = useMemo(() => whatMovesTheNeedle(client), [client]);

  const scenarioClient = useMemo(() => ({
    ...client,
    retirement: {
      ...client.retirement,
      retirement_age: retireAge,
      annual_contributions: contrib,
      retirement_spending: spending,
    },
  }), [client, retireAge, contrib, spending]);

  const scenarioReadiness = useMemo(
    () => computeReadinessCached(`${clientId}:scenario`, scenarioClient, { numSims: 150, expectedReturn: expectedReturn / 100, inflationRate: inflation / 100 }),
    [clientId, scenarioClient, expectedReturn, inflation]
  );

  const scoreDelta = scenarioReadiness.score - baseReadiness.score;

  return (
    <div className="space-y-5" data-testid="client-decision-hub">
      {/* ── Header — big score dial ── */}
      <Card className="bg-gradient-to-br from-[#0f1d35] to-[#1a2744] text-white border-0">
        <CardContent className="p-5 flex flex-col md:flex-row items-center gap-6">
          <ReadinessDial score={baseReadiness.score} size={180} testId="hub-score-dial" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/60">Retirement Readiness Score</p>
                <h2 className="text-2xl font-bold">{client.profile?.name}</h2>
              </div>
              <div
                className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-1 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => pulseNow()}
                title="Click to force a market pulse"
                data-testid="market-pulse-hud"
              >
                <Activity className={`h-3.5 w-3.5 ${pulse.lastDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`} />
                <div className="text-[10px] leading-tight">
                  <div className="text-white/60 uppercase tracking-wider">Market</div>
                  <div className={`font-bold tabular-nums ${pulse.lastDelta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {(pulse.pctFromBaseline >= 0 ? "+" : "")}{pulse.pctFromBaseline.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-white/10">
              {baseReadiness.factors.map((f) => (
                <div key={f.id} data-testid={`factor-${f.id}`}>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider">{f.label}</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-bold tabular-nums">{f.score}</span>
                    <span className="text-[10px] text-white/40">/{f.weight}% weight</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 1 — Retirement Outcome ── */}
      <Card data-testid="section-outcome">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Gauge className="h-4 w-4 text-[#D4A84C]" /> 1 · Retirement Outcome</CardTitle>
          <CardDescription>Projected income, probability, and capital sufficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-emerald-50/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sustainable Income</p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">{fmt(baseReadiness.outcome.sustainableIncome)}</p>
              <p className="text-[10px] text-muted-foreground">/year, real</p>
            </div>
            <div className="p-3 rounded-lg border bg-blue-50/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Probability of Success</p>
              <p className="text-2xl font-bold text-blue-700 tabular-nums">{baseReadiness.outcome.probabilityOfSuccess}%</p>
              <p className="text-[10px] text-muted-foreground">Monte Carlo · 300 runs</p>
            </div>
            <div className="p-3 rounded-lg border bg-amber-50/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Funding Gap</p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums">{fmt(baseReadiness.outcome.fundingGap)}</p>
              <p className="text-[10px] text-muted-foreground">vs 4% rule target</p>
            </div>
            <div className="p-3 rounded-lg border bg-slate-50/40">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Years of Sustainability</p>
              <p className="text-2xl font-bold text-slate-700 tabular-nums">{baseReadiness.outcome.yearsSustainability}+</p>
              <p className="text-[10px] text-muted-foreground">on P50 path</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-rose-50"><span className="text-[10px] uppercase text-rose-700">P10 (pessimistic)</span><p className="font-bold text-rose-700">{fmt(baseReadiness.outcome.confidenceBands.p10)}</p></div>
            <div className="p-2 rounded bg-[#1a2744]/5"><span className="text-[10px] uppercase text-[#1a2744]">P50 (median)</span><p className="font-bold text-[#1a2744]">{fmt(baseReadiness.outcome.confidenceBands.p50)}</p></div>
            <div className="p-2 rounded bg-emerald-50"><span className="text-[10px] uppercase text-emerald-700">P90 (optimistic)</span><p className="font-bold text-emerald-700">{fmt(baseReadiness.outcome.confidenceBands.p90)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2 — What Moves The Needle ── */}
      <Card data-testid="section-needle">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-[#D4A84C]" /> 2 · What Moves The Needle</CardTitle>
          <CardDescription>Top 3 actions ranked by readiness-score uplift</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topActions.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border hover:border-[#D4A84C]/60 transition-colors" data-testid={`needle-action-${i}`}>
                <span className="w-6 h-6 rounded-full bg-[#D4A84C]/20 text-[#7a5d1f] text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a2744]">{a.label}</p>
                  <p className="text-xs text-muted-foreground">Projected score after change: <span className="font-semibold text-emerald-700">{a.score}</span></p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`flex items-center gap-1 font-bold ${a.uplift >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {a.uplift >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="tabular-nums">{a.uplift >= 0 ? "+" : ""}{a.uplift}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3 — Scenario Simulator ── */}
      <Card data-testid="section-simulator">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Sliders className="h-4 w-4 text-[#D4A84C]" /> 3 · Scenario Simulator</CardTitle>
              <CardDescription>Adjust inputs · score recalculates live</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-1.5" data-testid="scenario-presets">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Presets:</span>
              <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => applyPreset("baseline")} data-testid="preset-baseline">Baseline</Button>
              <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => applyPreset("aggressive")} data-testid="preset-aggressive">Aggressive</Button>
              <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] border-sky-300 text-sky-700 hover:bg-sky-50" onClick={() => applyPreset("cautious")} data-testid="preset-cautious">Cautious</Button>
              <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => applyPreset("part_time")} data-testid="preset-part-time">Part-time Work</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1.5"><Label>Retirement age</Label><span className="font-semibold tabular-nums">{retireAge}</span></div>
                <Slider value={[retireAge]} min={55} max={75} step={1} onValueChange={(v) => setRetireAge(v[0])} data-testid="sim-retire-age" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><Label>Annual contributions</Label><span className="font-semibold tabular-nums">{fmt(contrib)}</span></div>
                <Slider value={[contrib]} min={0} max={60000} step={1000} onValueChange={(v) => setContrib(v[0])} data-testid="sim-contrib" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><Label>Retirement spending</Label><span className="font-semibold tabular-nums">{fmt(spending)}</span></div>
                <Slider value={[spending]} min={50000} max={400000} step={5000} onValueChange={(v) => setSpending(v[0])} data-testid="sim-spending" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><Label>Expected real return</Label><span className="font-semibold tabular-nums">{expectedReturn.toFixed(1)}%</span></div>
                <Slider value={[expectedReturn * 10]} min={20} max={100} step={5} onValueChange={(v) => setExpectedReturn(v[0] / 10)} data-testid="sim-return" />
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><Label>Inflation</Label><span className="font-semibold tabular-nums">{inflation.toFixed(1)}%</span></div>
                <Slider value={[inflation * 10]} min={10} max={60} step={1} onValueChange={(v) => setInflation(v[0] / 10)} data-testid="sim-inflation" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-lg">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Scenario readiness</p>
              <ReadinessDial score={scenarioReadiness.score} size={170} testId="sim-score-dial" />
              <div className={`mt-3 flex items-center gap-1.5 font-bold text-sm ${scoreDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`} data-testid="sim-delta">
                {scoreDelta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {scoreDelta >= 0 ? "+" : ""}{scoreDelta} pts vs baseline ({baseReadiness.score})
              </div>
              <div className="grid grid-cols-3 gap-2 w-full mt-4 text-center text-[11px]">
                <div><p className="text-muted-foreground">Success</p><p className="font-bold">{scenarioReadiness.outcome.probabilityOfSuccess}%</p></div>
                <div><p className="text-muted-foreground">Income</p><p className="font-bold">{fmt(scenarioReadiness.outcome.sustainableIncome)}</p></div>
                <div><p className="text-muted-foreground">Gap</p><p className="font-bold">{fmt(scenarioReadiness.outcome.fundingGap)}</p></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 4 — Risk Panel ── */}
      <Card data-testid="section-risks">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-[#D4A84C]" /> 4 · Risk Panel</CardTitle>
          <CardDescription>Longevity · Inflation · Sequence · Concentration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {risks.map((r) => (
              <div key={r.id} className="p-3 rounded-lg border" data-testid={`risk-${r.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold">{r.label}</p>
                  <Badge variant="outline" className={`text-[9px] ${severityStyles[r.severity]}`}>{r.severity}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{r.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 5 — Opportunity Engine ── */}
      <Card data-testid="section-opportunities">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-[#D4A84C]" /> 5 · Opportunity Engine</CardTitle>
          <CardDescription>Ranked opportunities + triggered alerts from the Rules Engine</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.alerts.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-rose-700 font-semibold">Alerts</p>
              {rules.alerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-rose-200 bg-rose-50/50" data-testid={`alert-${a.id}`}>
                  <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1a2744]">{a.title}</p>
                      <Badge variant="outline" className={`text-[9px] ${severityStyles[a.severity]}`}>{a.severity}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rules.opportunities.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">Opportunities</p>
              {rules.opportunities.map((o) => (
                <div key={o.id} className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/40" data-testid={`opp-${o.id}`}>
                  <Lightbulb className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1a2744]">{o.title}</p>
                      <Badge variant="outline" className={`text-[9px] ${severityStyles[o.severity]}`}>{o.severity}</Badge>
                      {o.value > 0 && <Badge variant="outline" className="text-[9px] bg-emerald-100 text-emerald-800 border-emerald-300">{fmt(o.value)} value</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{o.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rules.alerts.length === 0 && rules.opportunities.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-6">No alerts or opportunities triggered.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Section 6 — Financial Decision Graph ── */}
      <DecisionGraph client={client} readiness={baseReadiness} rules={rules} topActions={topActions} />
    </div>
  );
};

export default ClientDecisionHub;
