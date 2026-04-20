// AdviserScenarioWorkshop — live retirement forecasting with adviser-input sliders.
// Inputs: monthly budget, retirement age, annual contributions, portfolio volatility (σ).
// Outputs: projection chart (AreaChart with 10th/50th/90th percentile bands) + comparison table.
// Embedded on the SimpleRetirement (adviser client profile retirement tab).
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ComposedChart,
} from "recharts";
import { Sliders, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const fmt = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

// Lightweight Monte Carlo that returns year-by-year percentiles
const simulateProjection = ({ currentPortfolio, annualContributions, annualSpending, yearsToRetirement, yearsInRetirement = 30, expectedReturn = 0.065, volatility = 0.12, inflationRate = 0.03 }) => {
  const SIMS = 300;
  const totalYears = yearsToRetirement + yearsInRetirement;
  const runs = [];

  for (let s = 0; s < SIMS; s++) {
    const series = [currentPortfolio];
    let bal = currentPortfolio;
    for (let y = 1; y <= totalYears; y++) {
      // Box–Muller normal sample
      const u1 = Math.random(), u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const r = expectedReturn + volatility * z;
      const cashflow = y <= yearsToRetirement ? annualContributions : -annualSpending * Math.pow(1 + inflationRate, y - yearsToRetirement);
      bal = bal * (1 + r) + cashflow;
      bal = Math.max(0, bal);
      series.push(bal);
    }
    runs.push(series);
  }

  // Compute percentiles per year
  const data = [];
  for (let y = 0; y <= totalYears; y++) {
    const vals = runs.map(r => r[y]).sort((a, b) => a - b);
    const p10 = vals[Math.floor(SIMS * 0.1)];
    const p50 = vals[Math.floor(SIMS * 0.5)];
    const p90 = vals[Math.floor(SIMS * 0.9)];
    data.push({ year: y, age: null, p10, p50, p90, band: p90 - p10, lower: p10 });
  }

  // Success = P50 at end > 0
  const finalBalances = runs.map(r => r[r.length - 1]);
  const success = finalBalances.filter(v => v > 0).length / SIMS;

  return { data, success: Math.round(success * 100) };
};

const AdviserScenarioWorkshop = ({ clientId: propClientId }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  const liquidAssets = useMemo(() =>
    client.assets.filter(a => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio"].includes(a.type))
      .reduce((s, a) => s + a.value, 0),
  [client]);

  // Slider state — initialized from client data
  const [monthlyBudget, setMonthlyBudget] = useState(Math.round(client.profile.expensesAnnual / 12));
  const [retireAge, setRetireAge] = useState(client.retirement.retirement_age);
  const [annualContrib, setAnnualContrib] = useState(client.retirement.annual_contributions);
  const [volatility, setVolatility] = useState(12);

  const yearsToRet = Math.max(1, retireAge - client.profile.age);
  const annualSpending = monthlyBudget * 12;

  // Base scenario (client's current plan)
  const baseScenario = useMemo(() => simulateProjection({
    currentPortfolio: liquidAssets,
    annualContributions: client.retirement.annual_contributions,
    annualSpending: client.retirement.retirement_spending,
    yearsToRetirement: Math.max(1, client.retirement.retirement_age - client.profile.age),
    volatility: 0.12,
  }), [liquidAssets, client]);

  // Adjusted scenario (driven by sliders)
  const scenario = useMemo(() => simulateProjection({
    currentPortfolio: liquidAssets,
    annualContributions: annualContrib,
    annualSpending,
    yearsToRetirement: yearsToRet,
    volatility: volatility / 100,
  }), [liquidAssets, annualContrib, annualSpending, yearsToRet, volatility]);

  // Chart data — decorate with age
  const chartData = scenario.data.map((d, i) => ({
    ...d,
    age: client.profile.age + i,
    retireLine: d.year === yearsToRet ? d.p50 : null,
  }));

  const confidenceDelta = scenario.success - baseScenario.success;
  const endMedian = scenario.data[scenario.data.length - 1].p50;
  const endP10 = scenario.data[scenario.data.length - 1].p10;
  const endP90 = scenario.data[scenario.data.length - 1].p90;

  const volLabel = volatility <= 8 ? "Conservative" : volatility <= 14 ? "Balanced" : volatility <= 18 ? "Growth" : "Aggressive";

  return (
    <Card data-testid="adviser-scenario-workshop">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#1a2744]" />
            <p className="text-sm font-semibold text-[#1a2744]">Scenario Workshop</p>
          </div>
          <Badge variant="outline" className="text-[10px]">Monte Carlo · 300 sims</Badge>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-5">
          {/* INPUT SLIDERS */}
          <div className="space-y-4">
            <div data-testid="ws-slider-budget">
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Monthly Budget</label>
                <span className="text-xs font-semibold text-[#1a2744]">${(monthlyBudget / 1000).toFixed(1)}k / mo</span>
              </div>
              <Slider min={3000} max={40000} step={500} value={[monthlyBudget]} onValueChange={(v) => setMonthlyBudget(v[0])} />
              <p className="text-[10px] text-muted-foreground mt-0.5">{fmt(annualSpending)}/yr in retirement</p>
            </div>

            <div data-testid="ws-slider-retire-age">
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Retirement Age</label>
                <span className="text-xs font-semibold text-[#1a2744]">{retireAge} ({yearsToRet}y away)</span>
              </div>
              <Slider min={55} max={75} step={1} value={[retireAge]} onValueChange={(v) => setRetireAge(v[0])} />
            </div>

            <div data-testid="ws-slider-contributions">
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Annual Contributions</label>
                <span className="text-xs font-semibold text-[#1a2744]">{fmt(annualContrib)}/yr</span>
              </div>
              <Slider min={0} max={300000} step={5000} value={[annualContrib]} onValueChange={(v) => setAnnualContrib(v[0])} />
            </div>

            <div data-testid="ws-slider-volatility">
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Portfolio Risk (σ)</label>
                <span className="text-xs font-semibold text-[#1a2744]">{volatility}% · {volLabel}</span>
              </div>
              <Slider min={4} max={24} step={1} value={[volatility]} onValueChange={(v) => setVolatility(v[0])} />
            </div>

            {/* Confidence summary */}
            <Card className="border-0 bg-gradient-to-br from-[#1a2744] to-[#2a3a5c] text-white" data-testid="ws-summary">
              <CardContent className="p-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{scenario.success}%</span>
                  <span className="text-xs text-white/70">confidence</span>
                  {confidenceDelta !== 0 && (
                    <span className={`ml-auto text-xs font-semibold ${confidenceDelta > 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {confidenceDelta > 0 ? "+" : ""}{confidenceDelta}% vs current
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/70 mt-1">Median portfolio at life expectancy: {fmt(endMedian)}</p>
              </CardContent>
            </Card>
          </div>

          {/* OUTPUT CHART + TABLE */}
          <div className="space-y-3 min-w-0">
            <div className="h-[260px]" data-testid="ws-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 15, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="age" tick={{ fontSize: 10 }} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                  <YAxis tickFormatter={fmt} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => fmt(v)} labelFormatter={(age) => `Age ${age}`} />
                  {/* Shaded confidence band (P10–P90) */}
                  <Area type="monotone" dataKey="p90" stackId={null} stroke="none" fill="#1a2744" fillOpacity={0.12} />
                  <Area type="monotone" dataKey="p10" stackId={null} stroke="none" fill="#ffffff" fillOpacity={1} />
                  {/* Median line */}
                  <Line type="monotone" dataKey="p50" stroke="#1a2744" strokeWidth={2} dot={false} name="Median" />
                  <Line type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={1} strokeDasharray="4 3" dot={false} name="90th pct" />
                  <Line type="monotone" dataKey="p10" stroke="#f43f5e" strokeWidth={1} strokeDasharray="4 3" dot={false} name="10th pct" />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Comparison table */}
            <div className="border rounded-md overflow-hidden" data-testid="ws-table">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 uppercase tracking-wide">Scenario</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600 uppercase tracking-wide">Confidence</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600 uppercase tracking-wide">Pessimistic (P10)</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600 uppercase tracking-wide">Median</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600 uppercase tracking-wide">Optimistic (P90)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-3 py-2 text-gray-700">Current Plan</td>
                    <td className="px-3 py-2 text-right font-semibold">{baseScenario.success}%</td>
                    <td className="px-3 py-2 text-right text-rose-700">{fmt(baseScenario.data[baseScenario.data.length - 1].p10)}</td>
                    <td className="px-3 py-2 text-right">{fmt(baseScenario.data[baseScenario.data.length - 1].p50)}</td>
                    <td className="px-3 py-2 text-right text-emerald-700">{fmt(baseScenario.data[baseScenario.data.length - 1].p90)}</td>
                  </tr>
                  <tr className="border-t bg-[#1a2744]/5">
                    <td className="px-3 py-2 font-semibold text-[#1a2744]">Your Scenario</td>
                    <td className="px-3 py-2 text-right font-bold text-[#1a2744]">{scenario.success}%</td>
                    <td className="px-3 py-2 text-right text-rose-700">{fmt(endP10)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{fmt(endMedian)}</td>
                    <td className="px-3 py-2 text-right text-emerald-700">{fmt(endP90)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Insight line */}
            <div className="flex items-start gap-2 text-xs p-3 rounded-md bg-gray-50">
              {scenario.success >= 85 ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> :
               scenario.success >= 70 ? <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" /> :
               <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5 flex-shrink-0" />}
              <p className="text-gray-700">
                {scenario.success >= 85 ? "Strong plan — funds last comfortably across downside cases." :
                 scenario.success >= 70 ? "Close to on-track. Consider a small increase in contributions or retirement age." :
                 "Plan falls short of sustainable outcome. Adjust the levers above to lift confidence above 70%."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdviserScenarioWorkshop;
