import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight, Wallet, TrendingUp, PiggyBank, Gauge, Save, RotateCcw,
  ChevronDown, ChevronUp, Plus, Trash2, Check, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import { CLIENT_DATA, getActiveClientId, computeClientTotals } from "@/data/clientData";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);
const pct = (v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

// Projection engine: computes portfolio at retirement given inputs
const projectRetirement = ({ currentPortfolio, annualContributions, annualSpending, yearsToRetirement, expectedReturn = 0.065, inflationRate = 0.03 }) => {
  const realReturn = expectedReturn - inflationRate;
  let balance = currentPortfolio;
  const netSavings = annualContributions; // contributions during working years
  const trajectory = [{ year: 0, balance }];

  // Accumulation phase
  for (let y = 1; y <= yearsToRetirement; y++) {
    balance = balance * (1 + realReturn) + netSavings;
    trajectory.push({ year: y, balance, phase: "accumulation" });
  }
  const portfolioAtRetirement = balance;

  // Drawdown phase (25 years in retirement)
  const retirementYears = 25;
  let runOut = false;
  let runOutYear = 0;
  for (let y = 1; y <= retirementYears; y++) {
    balance = balance * (1 + realReturn * 0.7) - annualSpending; // lower return in retirement
    if (balance < 0 && !runOut) { runOut = true; runOutYear = y; balance = 0; }
    trajectory.push({ year: yearsToRetirement + y, balance, phase: "drawdown" });
  }

  // Confidence score (simplified)
  const targetBalance = annualSpending * retirementYears;
  const confidenceRaw = Math.min(100, (portfolioAtRetirement / targetBalance) * 100);
  const confidence = Math.round(confidenceRaw);

  return { portfolioAtRetirement, confidence, trajectory, runOut, runOutYear, retirementYears };
};

const DEFAULT_SCENARIOS = (clientData) => {
  const totals = computeClientTotals(getActiveClientId());
  const r = clientData.retirement;
  const monthlyIncome = (clientData.profile.incomeHousehold || 185000) / 12;
  const monthlyExpenses = (clientData.profile.expensesAnnual || 95000) / 12;

  return [
    {
      id: "current",
      name: "Current Plan",
      color: "#1a2744",
      locked: true,
      budget: { monthlyIncome: Math.round(monthlyIncome), monthlyExpenses: Math.round(monthlyExpenses), extraSavings: 0 },
      investments: { annualContributions: r.annual_contributions, expectedReturn: 6.5 },
      retirement: { retirementAge: r.retirement_age, annualSpending: r.retirement_spending },
    },
    {
      id: "aggressive",
      name: "Aggressive Savings",
      color: "#22c55e",
      locked: false,
      budget: { monthlyIncome: Math.round(monthlyIncome), monthlyExpenses: Math.round(monthlyExpenses * 0.85), extraSavings: Math.round(monthlyExpenses * 0.15) },
      investments: { annualContributions: Math.round(r.annual_contributions * 1.3), expectedReturn: 7.0 },
      retirement: { retirementAge: r.retirement_age, annualSpending: Math.round(r.retirement_spending * 0.9) },
    },
  ];
};

const ScenarioCard = ({ scenario, baseResult, result, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const delta = result.confidence - baseResult.confidence;
  const portfolioDelta = result.portfolioAtRetirement - baseResult.portfolioAtRetirement;

  return (
    <Card className={`border-l-4 ${scenario.locked ? "bg-muted/20" : ""}`} style={{ borderLeftColor: scenario.color }} data-testid={`scenario-${scenario.id}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenario.color }} />
            <span className="font-semibold text-sm">{scenario.name}</span>
            {scenario.locked && <Badge variant="outline" className="text-[10px]">Base</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {!scenario.locked && delta !== 0 && (
              <Badge className={delta > 0 ? "bg-emerald-500" : "bg-red-500"} data-testid={`delta-${scenario.id}`}>
                {delta > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {delta > 0 ? "+" : ""}{delta}% confidence
              </Badge>
            )}
            {!scenario.locked && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>}
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">Monthly Savings</p>
            <p className="text-sm font-bold">{fmt(scenario.budget.monthlyIncome - scenario.budget.monthlyExpenses + scenario.budget.extraSavings)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Annual Contributions</p>
            <p className="text-sm font-bold">{fmt(scenario.investments.annualContributions)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Portfolio at Retire</p>
            <p className="text-sm font-bold" style={{ color: scenario.color }}>{fmt(result.portfolioAtRetirement)}</p>
            {!scenario.locked && portfolioDelta !== 0 && (
              <p className={`text-[10px] ${portfolioDelta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                {portfolioDelta > 0 ? "+" : ""}{fmt(portfolioDelta)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Confidence</p>
            <p className="text-lg font-bold" style={{ color: result.confidence >= 80 ? "#22c55e" : result.confidence >= 60 ? "#3b82f6" : "#f59e0b" }}>
              {result.confidence}%
            </p>
          </div>
        </div>

        {/* Expand/Collapse */}
        {!scenario.locked && (
          <>
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {expanded ? "Hide" : "Adjust"} Scenario
            </Button>

            {expanded && (
              <div className="mt-3 space-y-4 border-t pt-3">
                {/* BUDGET */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Wallet className="h-3 w-3" /> BUDGET</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs"><span>Monthly Expenses</span><span className="font-medium">{fmt(scenario.budget.monthlyExpenses)}/mo</span></div>
                      <Slider value={[scenario.budget.monthlyExpenses]} min={Math.round(scenario.budget.monthlyIncome * 0.3)} max={scenario.budget.monthlyIncome} step={100}
                        onValueChange={([v]) => onUpdate({ ...scenario, budget: { ...scenario.budget, monthlyExpenses: v } })} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs"><span>Extra Monthly Savings</span><span className="font-medium">{fmt(scenario.budget.extraSavings)}/mo</span></div>
                      <Slider value={[scenario.budget.extraSavings]} min={0} max={5000} step={100}
                        onValueChange={([v]) => onUpdate({ ...scenario, budget: { ...scenario.budget, extraSavings: v } })} className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* INVESTMENTS */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> INVESTMENTS</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs"><span>Annual Super/Contributions</span><span className="font-medium">{fmt(scenario.investments.annualContributions)}/yr</span></div>
                      <Slider value={[scenario.investments.annualContributions]} min={0} max={120000} step={1000}
                        onValueChange={([v]) => onUpdate({ ...scenario, investments: { ...scenario.investments, annualContributions: v } })} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs"><span>Expected Return</span><span className="font-medium">{scenario.investments.expectedReturn}%</span></div>
                      <Slider value={[scenario.investments.expectedReturn * 10]} min={30} max={100} step={5}
                        onValueChange={([v]) => onUpdate({ ...scenario, investments: { ...scenario.investments, expectedReturn: v / 10 } })} className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* RETIREMENT */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><Gauge className="h-3 w-3" /> RETIREMENT</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs"><span>Retirement Age</span><span className="font-medium">{scenario.retirement.retirementAge}</span></div>
                      <Slider value={[scenario.retirement.retirementAge]} min={55} max={75} step={1}
                        onValueChange={([v]) => onUpdate({ ...scenario, retirement: { ...scenario.retirement, retirementAge: v } })} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs"><span>Annual Spending in Retirement</span><span className="font-medium">{fmt(scenario.retirement.annualSpending)}/yr</span></div>
                      <Slider value={[scenario.retirement.annualSpending]} min={30000} max={200000} step={2000}
                        onValueChange={([v]) => onUpdate({ ...scenario, retirement: { ...scenario.retirement, annualSpending: v } })} className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Flow visualization
const FlowStep = ({ icon: Icon, label, value, subtext, color, isLast }) => (
  <div className="flex items-center gap-2">
    <div className="flex flex-col items-center text-center min-w-[100px]">
      <div className="w-9 h-9 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: `${color}15`, color }}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold">{value}</p>
      {subtext && <p className="text-[10px] text-muted-foreground">{subtext}</p>}
    </div>
    {!isLast && <ArrowRight className="h-4 w-4 text-muted-foreground/50 mx-1" />}
  </div>
);

const ScenarioEngine = ({ embedded = false }) => {
  const clientId = getActiveClientId();
  const clientData = CLIENT_DATA[clientId];
  const totals = useMemo(() => computeClientTotals(clientId), [clientId]);
  const [scenarios, setScenarios] = useState(() => DEFAULT_SCENARIOS(clientData));
  const [savedScenarios, setSavedScenarios] = useState([]);

  const results = useMemo(() => {
    return scenarios.map((s) => {
      const yearsToRetirement = s.retirement.retirementAge - clientData.retirement.current_age;
      const monthlySurplus = s.budget.monthlyIncome - s.budget.monthlyExpenses + s.budget.extraSavings;
      const totalAnnualSavings = s.investments.annualContributions + monthlySurplus * 12;
      return projectRetirement({
        currentPortfolio: totals.netWorth,
        annualContributions: totalAnnualSavings,
        annualSpending: s.retirement.annualSpending,
        yearsToRetirement: Math.max(1, yearsToRetirement),
        expectedReturn: s.investments.expectedReturn / 100,
      });
    });
  }, [scenarios, totals.netWorth, clientData.retirement.current_age]);

  const baseResult = results[0];

  // Build trajectory data for the chart — merge all scenario trajectories by age
  const trajectoryData = useMemo(() => {
    const currentAge = clientData.retirement.current_age;
    const maxYears = Math.max(...results.map((r) => r.trajectory.length));
    const data = [];
    for (let i = 0; i < maxYears; i++) {
      const point = { age: currentAge + i };
      scenarios.forEach((s, si) => {
        const t = results[si]?.trajectory[i];
        point[s.name] = t ? Math.max(0, Math.round(t.balance)) : 0;
      });
      data.push(point);
    }
    return data;
  }, [results, scenarios, clientData.retirement.current_age]);

  const updateScenario = useCallback((idx, updated) => {
    setScenarios((prev) => prev.map((s, i) => (i === idx ? updated : s)));
  }, []);

  const deleteScenario = useCallback((idx) => {
    setScenarios((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addScenario = useCallback(() => {
    const r = clientData.retirement;
    const colors = ["#8b5cf6", "#ec4899", "#f97316", "#14b8a6"];
    const newId = `scenario_${Date.now()}`;
    setScenarios((prev) => [
      ...prev,
      {
        id: newId,
        name: `Scenario ${prev.length}`,
        color: colors[(prev.length - 1) % colors.length],
        locked: false,
        budget: { monthlyIncome: Math.round(clientData.profile.incomeHousehold / 12), monthlyExpenses: Math.round(clientData.profile.expensesAnnual / 12), extraSavings: 0 },
        investments: { annualContributions: r.annual_contributions, expectedReturn: 6.5 },
        retirement: { retirementAge: r.retirement_age, annualSpending: r.retirement_spending },
      },
    ]);
  }, [clientData]);

  const saveCurrentScenarios = useCallback(() => {
    setSavedScenarios([...scenarios.filter((s) => !s.locked)]);
  }, [scenarios]);

  const content = (
    <div className="space-y-6" data-testid="scenario-engine">
      {/* Flow visualization for the base scenario */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">CURRENT PLAN FLOW</p>
          <div className="flex items-center justify-center flex-wrap gap-1">
            <FlowStep icon={Wallet} label="Budget" value={`${fmt(scenarios[0].budget.monthlyIncome - scenarios[0].budget.monthlyExpenses)}/mo`} subtext="net savings" color="#1a2744" />
            <FlowStep icon={TrendingUp} label="Invest" value={fmt(scenarios[0].investments.annualContributions)} subtext="annual" color="#3b82f6" />
            <FlowStep icon={PiggyBank} label="Portfolio" value={fmt(baseResult.portfolioAtRetirement)} subtext={`at age ${scenarios[0].retirement.retirementAge}`} color="#8b5cf6" />
            <FlowStep icon={Gauge} label="Confidence" value={`${baseResult.confidence}%`} subtext={baseResult.confidence >= 80 ? "on track" : "needs work"} color={baseResult.confidence >= 80 ? "#22c55e" : "#f59e0b"} isLast />
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Scenarios</h3>
        <div className="flex gap-2">
          {scenarios.length > 1 && (
            <Button variant="outline" size="sm" className="text-xs" onClick={saveCurrentScenarios} data-testid="save-scenarios">
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          )}
          {scenarios.length < 5 && (
            <Button variant="outline" size="sm" className="text-xs" onClick={addScenario} data-testid="add-scenario">
              <Plus className="h-3 w-3 mr-1" /> Add Scenario
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {scenarios.map((s, i) => (
          <ScenarioCard
            key={s.id}
            scenario={s}
            baseResult={baseResult}
            result={results[i]}
            onUpdate={(updated) => updateScenario(i, updated)}
            onDelete={() => deleteScenario(i)}
          />
        ))}
      </div>

      {/* Projected Balance Trajectory Chart */}
      <Card data-testid="trajectory-chart">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Projected Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  {scenarios.map((s) => (
                    <linearGradient key={s.id} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="age"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}`}
                  label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 11 }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`}
                  width={60}
                />
                <Tooltip
                  formatter={(v, name) => [fmt(v), name]}
                  labelFormatter={(v) => `Age ${v}`}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine
                  x={clientData.retirement.retirement_age}
                  stroke="#D4A84C"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: "Retire", fill: "#D4A84C", fontSize: 10, position: "top" }}
                />
                {scenarios.map((s) => (
                  <Area
                    key={s.id}
                    type="monotone"
                    dataKey={s.name}
                    stroke={s.color}
                    strokeWidth={s.locked ? 2.5 : 1.5}
                    fill={`url(#grad-${s.id})`}
                    dot={false}
                    strokeDasharray={s.locked ? undefined : "6 3"}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#D4A84C] inline-block" style={{ borderTop: "2px dashed #D4A84C" }} /> Retirement</span>
            <span>Solid = Base plan</span>
            <span>Dashed = Scenarios</span>
          </div>
        </CardContent>
      </Card>

      {/* Comparison table */}
      {scenarios.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scenario Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="comparison-table">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                    {scenarios.map((s) => (
                      <th key={s.id} className="py-2 px-2 font-medium text-center" style={{ color: s.color }}>
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b">
                    <td className="py-2 pr-4">Monthly Savings</td>
                    {scenarios.map((s) => (
                      <td key={s.id} className="py-2 px-2 text-center font-medium">
                        {fmt(s.budget.monthlyIncome - s.budget.monthlyExpenses + s.budget.extraSavings)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Annual Contributions</td>
                    {scenarios.map((s) => (
                      <td key={s.id} className="py-2 px-2 text-center font-medium">{fmt(s.investments.annualContributions)}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Retirement Age</td>
                    {scenarios.map((s) => (
                      <td key={s.id} className="py-2 px-2 text-center font-medium">{s.retirement.retirementAge}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Annual Spend (Retired)</td>
                    {scenarios.map((s) => (
                      <td key={s.id} className="py-2 px-2 text-center font-medium">{fmt(s.retirement.annualSpending)}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4">Portfolio at Retirement</td>
                    {results.map((r, i) => (
                      <td key={scenarios[i].id} className="py-2 px-2 text-center font-bold" style={{ color: scenarios[i].color }}>
                        {fmt(r.portfolioAtRetirement)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <td className="py-2 pr-4 font-semibold">Confidence Score</td>
                    {results.map((r, i) => (
                      <td key={scenarios[i].id} className="py-2 px-2 text-center font-bold text-base" style={{ color: r.confidence >= 80 ? "#22c55e" : r.confidence >= 60 ? "#3b82f6" : "#f59e0b" }}>
                        {r.confidence}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">vs Current Plan</td>
                    {results.map((r, i) => (
                      <td key={scenarios[i].id} className="py-2 px-2 text-center font-medium">
                        {i === 0 ? "—" : (
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

      {/* Saved scenarios */}
      {savedScenarios.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> {savedScenarios.length} scenario(s) saved</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return content;
};

export default ScenarioEngine;
