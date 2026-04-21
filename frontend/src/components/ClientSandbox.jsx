// ClientSandbox — playground for the end client to model "what if?" scenarios.
// Completely isolated: state lives only in this component, no writes to CLIENT_DATA,
// no calls to backend, and no sync to the adviser's portfolio. Clients cannot
// accidentally change the adviser's numbers from here.
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from "recharts";
import { FlaskConical, RotateCcw, Lock, TrendingUp, Sparkles, Info } from "lucide-react";
import { projectRetirement } from "@/lib/retirementEngine";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);
const fmtShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return fmt(v);
};

const defaultInputs = (seed = {}) => ({
  startingBalance: seed.startingBalance ?? 500_000,
  annualContrib: seed.annualContrib ?? 30_000,
  annualSpending: seed.annualSpending ?? 100_000,
  currentAge: seed.currentAge ?? 45,
  retireAge: seed.retireAge ?? 65,
  lifeExpectancy: seed.lifeExpectancy ?? 90,
  expectedReturn: seed.expectedReturn ?? 7.0,
  inflation: seed.inflation ?? 2.5,
});

/**
 * Props:
 *   seed - optional initial values (NOT live-linked; just one-time seed).
 */
const ClientSandbox = ({ seed = {} }) => {
  const [i, setI] = useState(() => defaultInputs(seed));
  const set = (k, v) => setI((p) => ({ ...p, [k]: v }));
  const reset = () => setI(defaultInputs(seed));

  const yearsToRetire = Math.max(0, i.retireAge - i.currentAge);
  const yearsInRetire = Math.max(1, i.lifeExpectancy - i.retireAge);

  const result = useMemo(() => {
    try {
      return projectRetirement({
        currentPortfolio: i.startingBalance,
        annualContributions: i.annualContrib,
        annualSpending: i.annualSpending,
        yearsToRetirement: yearsToRetire,
        yearsInRetirement: yearsInRetire,
        numSims: 300,
        expectedReturn: i.expectedReturn / 100,
        inflationRate: i.inflation / 100,
      });
    } catch {
      return null;
    }
  }, [i, yearsToRetire, yearsInRetire]);

  const confidence = result?.confidence ?? 0;
  const confidenceLabel = confidence >= 85 ? "Very Strong" : confidence >= 70 ? "On Track" : confidence >= 50 ? "Needs Work" : "At Risk";
  const confidenceColor = confidence >= 85 ? "text-emerald-600" : confidence >= 70 ? "text-sky-600" : confidence >= 50 ? "text-amber-600" : "text-rose-600";

  // Build projection trajectory for chart from retirementEngine trajectory array
  const chartData = useMemo(() => {
    if (!result?.trajectory) return [];
    return result.trajectory.map((t) => ({
      year: i.currentAge + t.year,
      median: t.p50,
      p10: t.p10,
      p90: t.p90,
    }));
  }, [result, i.currentAge]);

  return (
    <div className="space-y-5" data-testid="client-sandbox">
      {/* Playground banner */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-3 flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex-1 text-xs text-amber-900">
            <p className="font-semibold flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Playground mode</p>
            <p className="mt-0.5">Play with the sliders to see how different retirement scenarios might look. These numbers are <strong>local to your device only</strong> — they do not change anything in your adviser's plan or portfolio. Talk to your adviser if you'd like to make any of this real.</p>
          </div>
          <Button size="sm" variant="outline" onClick={reset} className="flex-shrink-0" data-testid="sandbox-reset"><RotateCcw className="h-3 w-3 mr-1" /> Reset</Button>
        </CardContent>
      </Card>

      {/* Headline result */}
      <Card className="border-[#D4A84C]/30 bg-gradient-to-br from-white to-[#D4A84C]/5">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Chance of lasting through retirement</p>
            <p className={`text-6xl font-bold ${confidenceColor}`} data-testid="sandbox-confidence">{Math.round(confidence)}%</p>
            <Badge className={`mt-1 ${confidence >= 70 ? "bg-emerald-500" : confidence >= 50 ? "bg-amber-500" : "bg-rose-500"}`}>{confidenceLabel}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Projected balance at retirement</p>
              <p className="text-xl font-bold text-[#1a2744]" data-testid="sandbox-balance-retire">{fmtShort(result?.portfolioAtRetirement || 0)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Years in retirement</p>
              <p className="text-xl font-bold text-[#1a2744]">{yearsInRetire}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Spending target (today's $)</p>
              <p className="text-xl font-bold text-[#1a2744]">{fmt(i.annualSpending)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Contributions / year</p>
              <p className="text-xl font-bold text-[#D4A84C]">{fmt(i.annualContrib)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sliders */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Your "what if" inputs</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-5">
          {[
            { k: "startingBalance", label: "Starting balance", min: 0, max: 5_000_000, step: 25_000, format: fmtShort, hint: "Your investable savings today" },
            { k: "annualContrib", label: "Savings per year", min: 0, max: 200_000, step: 1_000, format: fmt, hint: "How much you put away each year" },
            { k: "annualSpending", label: "Retirement spending / yr", min: 30_000, max: 300_000, step: 5_000, format: fmt, hint: "Yearly lifestyle cost in today's dollars" },
            { k: "currentAge", label: "Current age", min: 25, max: 75, step: 1, format: (v) => v, hint: null },
            { k: "retireAge", label: "Retire at age", min: 50, max: 80, step: 1, format: (v) => v, hint: null },
            { k: "lifeExpectancy", label: "Plan until age", min: 75, max: 105, step: 1, format: (v) => v, hint: null },
            { k: "expectedReturn", label: "Expected return", min: 2, max: 12, step: 0.5, format: (v) => `${v.toFixed(1)}%`, hint: "Average yearly portfolio return" },
            { k: "inflation", label: "Inflation", min: 0, max: 6, step: 0.25, format: (v) => `${v.toFixed(2)}%`, hint: null },
          ].map((s) => (
            <div key={s.k} data-testid={`sandbox-${s.k}`}>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold">{s.label}</Label>
                <span className="text-sm font-mono text-[#1a2744]">{s.format(i[s.k])}</span>
              </div>
              <Slider value={[i[s.k]]} min={s.min} max={s.max} step={s.step} onValueChange={(v) => set(s.k, v[0])} />
              {s.hint && <p className="text-[10px] text-muted-foreground mt-1">{s.hint}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Projection chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Projected balance over time</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 260, minHeight: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4A84C" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#D4A84C" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                <Tooltip formatter={(v) => fmt(v)} labelFormatter={(y) => `Age ${y}`} />
                <Area dataKey="p90" stroke="#D4A84C" fill="url(#rangeGrad)" strokeOpacity={0.4} />
                <Area dataKey="median" stroke="#1a2744" strokeWidth={2} fill="transparent" />
                <Area dataKey="p10" stroke="#9ca3af" strokeDasharray="3 3" fill="transparent" />
                <ReferenceLine x={i.retireAge} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Retire`, fill: "#ef4444", fontSize: 10, position: "top" }} />
              </AreaChart>
            </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground mt-2">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#1a2744]" />Median outcome</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#D4A84C]" />Best case (P90)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gray-400 border-t border-dashed" />Worst case (P10)</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 pb-4">
        <Lock className="h-3 w-3" /> Sandbox only — your adviser's plan remains unchanged.
        <span className="mx-1">·</span>
        <Info className="h-3 w-3" /> Want to make this your real plan? Message your adviser.
      </div>
    </div>
  );
};

export default ClientSandbox;
