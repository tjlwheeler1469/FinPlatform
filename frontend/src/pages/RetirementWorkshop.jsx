// RetirementWorkshop — Unified retirement confidence workshop for advisers.
// Features:
//  • Full adviser inputs (Budget, Investments, Goals, Market Assumptions) — editable
//  • Multi-scenario comparison (up to 5 scenarios, side-by-side)
//  • Monte Carlo projection with P10/P50/P90 bands
//  • Extensively validated calculations (unit-tested engine in @/lib/retirementEngine)
import { useMemo, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Line, ReferenceLine, ComposedChart,
} from "recharts";
import {
  Plus, Trash2, Save, RotateCcw, TrendingUp, Wallet, Target, Sliders,
  Info, ArrowUpRight, ArrowDownRight, CheckCircle2, AlertTriangle, Gauge,
  Calculator,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { projectRetirement, buildScenarioFromInputs } from "@/lib/retirementEngine";

const fmt = (v) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const fmtShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const SCENARIO_COLORS = ["#1a2744", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

// Build the initial adviser input set from the active client's data
const buildInitialInputs = (client) => {
  const liquidAssets = client.assets
    .filter((a) => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio", "SMSF", "Bonds", "Alternatives"].includes(a.type))
    .reduce((s, a) => s + a.value, 0);

  const monthlyIncome = Math.round((client.profile.incomeHousehold || 185000) / 12);
  const monthlyExpenses = Math.round((client.profile.expensesAnnual || 95000) / 12);

  return {
    // Personal
    currentAge: client.retirement.current_age,
    retirementAge: client.retirement.retirement_age,
    lifeExpectancy: client.retirement.life_expectancy,
    // Budget
    monthlyIncome,
    monthlyExpenses,
    extraMonthlySavings: 0,
    // Investments
    currentPortfolio: liquidAssets,
    annualContributions: client.retirement.annual_contributions,
    expectedReturn: 6.5,
    volatility: 12,
    inflationRate: 2.5,
    // Goals
    retirementSpending: client.retirement.retirement_spending,
    legacyGoal: 0,
  };
};

const FieldRow = ({ label, children, hint }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <Label className="text-xs text-gray-700">{label}</Label>
      {hint && (
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs"><p className="text-xs">{hint}</p></TooltipContent>
          </UITooltip>
        </TooltipProvider>
      )}
    </div>
    {children}
  </div>
);

// Single scenario editor panel
const ScenarioEditor = ({ scenario, onChange, onRemove, isBase, color, result, baseResult }) => {
  const update = (patch) => onChange({ ...scenario, inputs: { ...scenario.inputs, ...patch } });
  const i = scenario.inputs;

  const deltaConfidence = baseResult ? result.confidence - baseResult.confidence : 0;
  const deltaPortfolio = baseResult ? result.portfolioAtRetirement - baseResult.portfolioAtRetirement : 0;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }} data-testid={`scenario-panel-${scenario.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <Input
              value={scenario.name}
              onChange={(e) => onChange({ ...scenario, name: e.target.value })}
              className="h-7 text-sm font-semibold w-48 border-0 focus-visible:ring-1"
              disabled={isBase}
              data-testid={`scenario-name-${scenario.id}`}
            />
            {isBase && <Badge variant="outline" className="text-[10px]">Base</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {!isBase && deltaConfidence !== 0 && (
              <Badge className={deltaConfidence > 0 ? "bg-emerald-500" : "bg-red-500"}>
                {deltaConfidence > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {deltaConfidence > 0 ? "+" : ""}{deltaConfidence}%
              </Badge>
            )}
            {!isBase && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove} data-testid={`remove-scenario-${scenario.id}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Summary */}
        <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-md" style={{ backgroundColor: `${color}08` }} data-testid={`scenario-metrics-${scenario.id}`}>
          <div data-testid={`metric-confidence-${scenario.id}`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Confidence</p>
            <p className="text-2xl font-bold" style={{ color: result.confidence >= 80 ? "#10b981" : result.confidence >= 60 ? "#3b82f6" : "#f59e0b" }}>
              {result.confidence}%
            </p>
          </div>
          <div data-testid={`metric-at-retirement-${scenario.id}`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">At Retirement</p>
            <p className="text-lg font-bold" style={{ color }}>{fmtShort(result.portfolioAtRetirement)}</p>
            {!isBase && deltaPortfolio !== 0 && (
              <p className={`text-[9px] ${deltaPortfolio > 0 ? "text-emerald-600" : "text-red-600"}`}>
                {deltaPortfolio > 0 ? "+" : ""}{fmtShort(deltaPortfolio)}
              </p>
            )}
          </div>
          <div data-testid={`metric-p10-${scenario.id}`}>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">P10 Balance</p>
            <p className="text-lg font-bold text-rose-600">{fmtShort(result.p10AtLifeEnd)}</p>
          </div>
        </div>

        <Tabs defaultValue="budget" className="w-full">
          <TabsList className="grid grid-cols-4 w-full h-8">
            <TabsTrigger value="budget" className="text-[11px]" data-testid={`tab-budget-${scenario.id}`}><Wallet className="h-3 w-3 mr-1" />Budget</TabsTrigger>
            <TabsTrigger value="investments" className="text-[11px]" data-testid={`tab-investments-${scenario.id}`}><TrendingUp className="h-3 w-3 mr-1" />Invest</TabsTrigger>
            <TabsTrigger value="goals" className="text-[11px]" data-testid={`tab-goals-${scenario.id}`}><Target className="h-3 w-3 mr-1" />Goals</TabsTrigger>
            <TabsTrigger value="assumptions" className="text-[11px]" data-testid={`tab-assumptions-${scenario.id}`}><Sliders className="h-3 w-3 mr-1" />Assum.</TabsTrigger>
          </TabsList>

          <TabsContent value="budget" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Monthly Income" hint="Household combined take-home income.">
                <Input type="number" value={i.monthlyIncome} onChange={(e) => update({ monthlyIncome: +e.target.value })} className="h-8 text-sm" data-testid={`input-income-${scenario.id}`} />
              </FieldRow>
              <FieldRow label="Monthly Expenses" hint="Total household spending per month today.">
                <Input type="number" value={i.monthlyExpenses} onChange={(e) => update({ monthlyExpenses: +e.target.value })} className="h-8 text-sm" data-testid={`input-expenses-${scenario.id}`} />
              </FieldRow>
              <FieldRow label="Extra Monthly Savings" hint="Additional savings beyond current rate (will be added to annual contributions).">
                <Input type="number" value={i.extraMonthlySavings} onChange={(e) => update({ extraMonthlySavings: +e.target.value })} className="h-8 text-sm" data-testid={`input-extra-${scenario.id}`} />
              </FieldRow>
              <div className="flex items-end">
                <div className="w-full p-2 rounded bg-gray-50 text-xs">
                  <p className="text-muted-foreground">Net monthly surplus</p>
                  <p className="font-semibold">{fmt(i.monthlyIncome - i.monthlyExpenses + i.extraMonthlySavings)}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="investments" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Current Portfolio" hint="Sum of investible assets (super + shares + funds + cash).">
                <Input type="number" value={i.currentPortfolio} onChange={(e) => update({ currentPortfolio: +e.target.value })} className="h-8 text-sm" data-testid={`input-portfolio-${scenario.id}`} />
              </FieldRow>
              <FieldRow label="Annual Contributions" hint="Super contributions + savings to investment accounts per year.">
                <Input type="number" value={i.annualContributions} onChange={(e) => update({ annualContributions: +e.target.value })} className="h-8 text-sm" data-testid={`input-contrib-${scenario.id}`} />
              </FieldRow>
            </div>
            <FieldRow label={`Expected Return: ${i.expectedReturn}% p.a.`} hint="Average nominal annual return.">
              <Slider value={[i.expectedReturn * 10]} min={30} max={100} step={5} onValueChange={([v]) => update({ expectedReturn: v / 10 })} />
            </FieldRow>
            <FieldRow label={`Volatility (σ): ${i.volatility}%`} hint="Standard deviation of annual returns. Growth: 12-15%. Conservative: 6-8%.">
              <Slider value={[i.volatility]} min={4} max={24} step={1} onValueChange={([v]) => update({ volatility: v })} />
            </FieldRow>
          </TabsContent>

          <TabsContent value="goals" className="space-y-3 pt-3">
            <div className="grid grid-cols-3 gap-3">
              <FieldRow label="Current Age">
                <Input type="number" value={i.currentAge} onChange={(e) => update({ currentAge: +e.target.value })} className="h-8 text-sm" data-testid={`input-age-${scenario.id}`} />
              </FieldRow>
              <FieldRow label="Retirement Age">
                <Input type="number" value={i.retirementAge} onChange={(e) => update({ retirementAge: +e.target.value })} className="h-8 text-sm" data-testid={`input-retire-age-${scenario.id}`} />
              </FieldRow>
              <FieldRow label="Life Expectancy">
                <Input type="number" value={i.lifeExpectancy} onChange={(e) => update({ lifeExpectancy: +e.target.value })} className="h-8 text-sm" data-testid={`input-life-${scenario.id}`} />
              </FieldRow>
            </div>
            <FieldRow label="Annual Retirement Spending" hint="Desired annual spending in retirement (in today's dollars).">
              <Input type="number" value={i.retirementSpending} onChange={(e) => update({ retirementSpending: +e.target.value })} className="h-8 text-sm" data-testid={`input-spend-${scenario.id}`} />
            </FieldRow>
            <FieldRow label="Legacy / Inheritance Goal" hint="Desired balance remaining at life expectancy (0 = spend all).">
              <Input type="number" value={i.legacyGoal} onChange={(e) => update({ legacyGoal: +e.target.value })} className="h-8 text-sm" data-testid={`input-legacy-${scenario.id}`} />
            </FieldRow>
          </TabsContent>

          <TabsContent value="assumptions" className="space-y-3 pt-3">
            <FieldRow label={`Inflation Rate: ${i.inflationRate}% p.a.`} hint="Long-run CPI assumption.">
              <Slider value={[i.inflationRate * 10]} min={10} max={60} step={5} onValueChange={([v]) => update({ inflationRate: v / 10 })} />
            </FieldRow>
            <div className="text-[11px] text-muted-foreground p-3 bg-gray-50 rounded">
              <p><strong>Real return:</strong> {(i.expectedReturn - i.inflationRate).toFixed(1)}% (after inflation)</p>
              <p><strong>Years to retire:</strong> {Math.max(0, i.retirementAge - i.currentAge)}</p>
              <p><strong>Years in retirement:</strong> {Math.max(0, i.lifeExpectancy - i.retirementAge)}</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const RetirementWorkshop = ({ embedded = false, clientId: propClientId }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const initialInputs = useMemo(() => buildInitialInputs(client), [client]);

  const [scenarios, setScenarios] = useState(() => [
    { id: "base", name: "Current Plan", inputs: { ...initialInputs } },
    {
      id: "aggressive",
      name: "Aggressive Savings",
      inputs: {
        ...initialInputs,
        monthlyExpenses: Math.round(initialInputs.monthlyExpenses * 0.85),
        extraMonthlySavings: Math.round(initialInputs.monthlyIncome * 0.05),
        annualContributions: Math.round(initialInputs.annualContributions * 1.3),
      },
    },
  ]);

  const results = useMemo(
    () => scenarios.map((s) => projectRetirement(buildScenarioFromInputs(s.inputs))),
    [scenarios]
  );
  const baseResult = results[0];

  // Merge trajectories by age for chart
  const chartData = useMemo(() => {
    const maxLen = Math.max(...results.map((r) => r.trajectory.length));
    const data = [];
    for (let y = 0; y < maxLen; y++) {
      const point = { age: scenarios[0].inputs.currentAge + y };
      scenarios.forEach((s, idx) => {
        const t = results[idx].trajectory[y];
        if (t) {
          point[s.name] = Math.round(t.p50);
          point[`${s.name}_p10`] = Math.round(t.p10);
          point[`${s.name}_p90`] = Math.round(t.p90);
          point[`${s.name}_band`] = [Math.round(t.p10), Math.round(t.p90)];
        }
      });
      data.push(point);
    }
    return data;
  }, [scenarios, results]);

  const addScenario = useCallback(() => {
    const baseInputs = scenarios[0].inputs;
    const newId = `s_${Date.now()}`;
    setScenarios((prev) => [
      ...prev,
      { id: newId, name: `Scenario ${prev.length + 1}`, inputs: { ...baseInputs } },
    ]);
  }, [scenarios]);

  const updateScenario = useCallback((idx, updated) => {
    setScenarios((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  }, []);

  const removeScenario = useCallback((idx) => {
    setScenarios((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const resetAll = useCallback(() => {
    setScenarios([
      { id: "base", name: "Current Plan", inputs: { ...initialInputs } },
    ]);
    toast.success("Reset to client's current plan");
  }, [initialInputs]);

  const content = (
      <div className="space-y-6" data-testid="retirement-workshop-page">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Gauge className="h-6 w-6 text-[#D4A84C]" />
              Retirement Workshop · {client.profile.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-scenario Monte Carlo analysis · {scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""} · {results[0]?.numSims || 500} sims each
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetAll} data-testid="reset-btn">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
            </Button>
            <Button variant="outline" size="sm" onClick={addScenario} disabled={scenarios.length >= 5} data-testid="add-scenario-btn">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Scenario
            </Button>
          </div>
        </div>

        {/* Scenario Editors (stacked) */}
        <div className="space-y-4">
          {scenarios.map((s, idx) => (
            <ScenarioEditor
              key={s.id}
              scenario={s}
              onChange={(updated) => updateScenario(idx, updated)}
              onRemove={() => removeScenario(idx)}
              isBase={idx === 0}
              color={SCENARIO_COLORS[idx % SCENARIO_COLORS.length]}
              result={results[idx]}
              baseResult={idx === 0 ? null : baseResult}
            />
          ))}
        </div>

        {/* Projection Chart */}
        <Card data-testid="projection-chart">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Projected Portfolio Balance (Monte Carlo · P10 / P50 / P90)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    {scenarios.map((s, idx) => (
                      <linearGradient key={`band-${s.id}`} id={`band-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SCENARIO_COLORS[idx % SCENARIO_COLORS.length]} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={SCENARIO_COLORS[idx % SCENARIO_COLORS.length]} stopOpacity={0.03} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} width={65} />
                  <Tooltip
                    formatter={(v, name) => {
                      if (Array.isArray(v)) return [null, null];
                      if (name.includes("_p") || name.includes("_band")) return [null, null];
                      return [fmt(v), name];
                    }}
                    labelFormatter={(v) => `Age ${v}`}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} payload={scenarios.map((s, idx) => ({ value: s.name, type: "line", color: SCENARIO_COLORS[idx % SCENARIO_COLORS.length] }))} />
                  <ReferenceLine x={scenarios[0].inputs.retirementAge} stroke="#D4A84C" strokeDasharray="5 5" strokeWidth={2} label={{ value: "Retire", fill: "#D4A84C", fontSize: 10, position: "top" }} />
                  {/* Confidence bands */}
                  {scenarios.map((s, idx) => (
                    <Area key={`band-${s.id}`} type="monotone" dataKey={`${s.name}_band`} stroke="none" fill={`url(#band-${s.id})`} legendType="none" tooltipType="none" isAnimationActive={false} />
                  ))}
                  {/* Median lines */}
                  {scenarios.map((s, idx) => (
                    <Line key={s.id} type="monotone" dataKey={s.name} stroke={SCENARIO_COLORS[idx % SCENARIO_COLORS.length]} strokeWidth={idx === 0 ? 2.5 : 1.8} dot={false} strokeDasharray={idx === 0 ? undefined : "5 3"} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
              <span>Shaded = 10th–90th percentile range</span>
              <span>Lines = median (P50)</span>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {scenarios.length > 1 && (
          <Card data-testid="comparison-table">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Scenario Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                      {scenarios.map((s, idx) => (
                        <th key={s.id} className="py-2 px-2 font-medium text-center" style={{ color: SCENARIO_COLORS[idx] }}>{s.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    <tr className="border-b">
                      <td className="py-2 pr-4">Monthly Surplus</td>
                      {scenarios.map((s) => (
                        <td key={s.id} className="py-2 px-2 text-center font-medium">{fmt(s.inputs.monthlyIncome - s.inputs.monthlyExpenses + s.inputs.extraMonthlySavings)}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Annual Contributions</td>
                      {scenarios.map((s) => (
                        <td key={s.id} className="py-2 px-2 text-center font-medium">{fmt(s.inputs.annualContributions)}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Retirement Age / Years</td>
                      {scenarios.map((s) => (
                        <td key={s.id} className="py-2 px-2 text-center font-medium">{s.inputs.retirementAge} / {s.inputs.retirementAge - s.inputs.currentAge}y</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Annual Spend in Retirement</td>
                      {scenarios.map((s) => (
                        <td key={s.id} className="py-2 px-2 text-center font-medium">{fmt(s.inputs.retirementSpending)}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Expected Return / Vol</td>
                      {scenarios.map((s) => (
                        <td key={s.id} className="py-2 px-2 text-center font-medium">{s.inputs.expectedReturn}% / σ{s.inputs.volatility}</td>
                      ))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-semibold">Portfolio at Retirement (P50)</td>
                      {results.map((r, idx) => (
                        <td key={idx} className="py-2 px-2 text-center font-bold" style={{ color: SCENARIO_COLORS[idx] }}>{fmt(r.portfolioAtRetirement)}</td>
                      ))}
                    </tr>
                    <tr className="border-b text-muted-foreground">
                      <td className="py-1.5 pr-4 pl-2">P10 at end of life</td>
                      {results.map((r, idx) => <td key={idx} className="py-1.5 px-2 text-center text-rose-600 text-xs">{fmt(r.p10AtLifeEnd)}</td>)}
                    </tr>
                    <tr className="border-b text-muted-foreground">
                      <td className="py-1.5 pr-4 pl-2">P90 at end of life</td>
                      {results.map((r, idx) => <td key={idx} className="py-1.5 px-2 text-center text-emerald-600 text-xs">{fmt(r.p90AtLifeEnd)}</td>)}
                    </tr>
                    <tr className="border-b bg-[#1a2744]/5">
                      <td className="py-2 pr-4 font-semibold">Monte Carlo Confidence</td>
                      {results.map((r, idx) => (
                        <td key={idx} className="py-2 px-2 text-center font-bold text-base" style={{ color: r.confidence >= 80 ? "#10b981" : r.confidence >= 60 ? "#3b82f6" : "#f59e0b" }}>
                          {r.confidence}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">vs Current Plan</td>
                      {results.map((r, idx) => (
                        <td key={idx} className="py-2 px-2 text-center font-medium">
                          {idx === 0 ? "—" : (
                            <span className={r.confidence - baseResult.confidence > 0 ? "text-emerald-600" : r.confidence - baseResult.confidence < 0 ? "text-red-600" : ""}>
                              {r.confidence - baseResult.confidence > 0 ? "+" : ""}{r.confidence - baseResult.confidence}%
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
  );

  return embedded ? content : <Layout><div className="p-6">{content}</div></Layout>;
};

export default RetirementWorkshop;
