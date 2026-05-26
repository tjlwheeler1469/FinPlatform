// Super Optimiser — Contribution scenarios with legally-accurate rules.
// Features:
//  • Concessional cap with annual indexing (FY25 $30k, rising with AWOTE)
//  • Non-concessional cap (4× concessional) + bring-forward rules (3-year cap for <75 yo)
//  • Pre-tax (15% contributions tax) vs post-tax (marginal-rate) comparison
//  • Carry-forward unused concessional (5-yr rolling, balance <$500k as at 30 June)
//  • Div 293 additional 15% tax for incomes >$250k
//  • Works with 10 scenarios — side-by-side
import { useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  BarChart, Bar,
} from "recharts";
import {
  Plus, Trash2, PiggyBank, Calculator, Info, TrendingUp, ArrowUpRight, ArrowDownRight, Gavel, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

// === Legal rules (editable via UI) ===
export const SUPER_RULES = {
  // Concessional cap by financial year. Indexes to AWOTE in $2,500 increments.
  concessionalCap: {
    "FY2024": 27500,
    "FY2025": 30000,
    "FY2026": 30000,   // provisionally unchanged
    "FY2027": 32500,
    "FY2028": 32500,
    "FY2029": 35000,
  },
  // Contributions tax
  contributionsTaxLow: 0.15, // inside super
  div293Threshold: 250000,    // combined income + concessional contributions
  div293Tax: 0.15,            // additional
  // Non-concessional
  nonConcessionalMultiplier: 4, // 4× concessional
  bringForwardTriggerBalance: 1900000, // 2024-25 TBC eligibility
  bringForwardMaxYears: 3,
  // Carry-forward
  carryForwardBalanceLimit: 500000, // <$500k at prior 30 Jun to use carry-forward
  carryForwardYears: 5,
  // Preservation / access
  preservationAge: 60,
  // Investment return assumption inside super
  defaultSuperReturn: 0.065,
};

const MARGINAL_RATES = [
  { from: 0, to: 18200, rate: 0.00, base: 0 },
  { from: 18201, to: 45000, rate: 0.16, base: 0 },
  { from: 45001, to: 135000, rate: 0.30, base: 4288 },
  { from: 135001, to: 190000, rate: 0.37, base: 31288 },
  { from: 190001, to: Infinity, rate: 0.45, base: 51638 },
];

const marginalRate = (income) => {
  const tier = MARGINAL_RATES.find((t) => income >= t.from && income <= t.to);
  return tier ? tier.rate : 0.45;
};

const incomeTax = (income) => {
  if (income <= 0) return 0;
  const tier = MARGINAL_RATES.find((t) => income >= t.from && income <= t.to);
  if (!tier) return 0;
  return tier.base + (income - (tier.from - 1)) * tier.rate;
};

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);
const fmtPct = (v) => `${(v || 0).toFixed(1)}%`;

// Compute a single strategy for a given FY
const computeStrategy = (inputs, rules = SUPER_RULES) => {
  const {
    salary, age, superBalance, unusedConcessionalFY = 0,
    sgContribRate = 0.115,
    concessionalExtra, // pre-tax extra (salary sacrifice)
    nonConcessional,   // post-tax contribution
    useBringForward = false,
    useCarryForward = false,
    fy = "FY2025",
    years = 15,
    returnRate = rules.defaultSuperReturn,
  } = inputs;

  const baseCap = rules.concessionalCap[fy] || 30000;
  let effectiveConcessionalCap = baseCap;
  if (useCarryForward && superBalance < rules.carryForwardBalanceLimit) {
    effectiveConcessionalCap += unusedConcessionalFY; // stacks prior 5yr unused
  }

  const sgContribution = salary * sgContribRate;
  const totalConcessional = Math.min(sgContribution + concessionalExtra, effectiveConcessionalCap);
  const concessionalExcess = Math.max(0, sgContribution + concessionalExtra - effectiveConcessionalCap);

  // Non-concessional cap
  let ncCap = baseCap * rules.nonConcessionalMultiplier;
  if (useBringForward && superBalance < rules.bringForwardTriggerBalance && age < 75) {
    ncCap = baseCap * rules.nonConcessionalMultiplier * rules.bringForwardMaxYears;
  }
  const ncContribution = Math.min(nonConcessional, ncCap);
  const ncExcess = Math.max(0, nonConcessional - ncCap);

  // Tax on concessional: 15% inside fund, plus Div 293 if triggered
  const combinedIncomeForDiv293 = salary + totalConcessional;
  const div293Due = combinedIncomeForDiv293 > rules.div293Threshold;
  const div293Amount = div293Due
    ? Math.min(totalConcessional, combinedIncomeForDiv293 - rules.div293Threshold) * rules.div293Tax
    : 0;
  const contribTaxInFund = totalConcessional * rules.contributionsTaxLow;
  const netIntoFund = totalConcessional - contribTaxInFund + ncContribution;

  // Tax saving from salary sacrifice (vs receiving income personally)
  const taxableIncomeNormal = salary;
  const taxableIncomeSacrificed = salary - concessionalExtra;
  const personalTaxSaved = incomeTax(taxableIncomeNormal) - incomeTax(taxableIncomeSacrificed);
  const superTaxIncurred = concessionalExtra * rules.contributionsTaxLow;
  const netTaxAdvantage = personalTaxSaved - superTaxIncurred - div293Amount;

  // Project end super balance
  const yearlyNet = netIntoFund;
  let balance = superBalance;
  const trajectory = [{ year: 0, balance: Math.round(balance), age }];
  for (let y = 1; y <= years; y++) {
    balance = balance * (1 + returnRate) + yearlyNet;
    trajectory.push({ year: y, balance: Math.round(balance), age: age + y });
  }

  return {
    effectiveConcessionalCap,
    baseCap,
    sgContribution,
    totalConcessional,
    concessionalExcess,
    ncCap,
    ncContribution,
    ncExcess,
    contribTaxInFund,
    div293Amount,
    div293Due,
    netIntoFund,
    personalTaxSaved,
    superTaxIncurred,
    netTaxAdvantage,
    endBalance: Math.round(balance),
    trajectory,
  };
};

const COLORS = ["#1a2744", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#d946ef", "#84cc16", "#f43f5e", "#3b82f6"];

const StrategyCard = ({ strategy, onChange, onRemove, color, idx, rules }) => {
  const update = (patch) => onChange({ ...strategy, inputs: { ...strategy.inputs, ...patch } });
  const result = computeStrategy(strategy.inputs, rules);
  const i = strategy.inputs;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }} data-testid={`super-strategy-${strategy.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <Input value={strategy.name} onChange={(e) => onChange({ ...strategy, name: e.target.value })} className="h-7 text-sm font-semibold w-56 border-0 focus-visible:ring-1" data-testid={`strat-name-${strategy.id}`} />
            {idx === 0 && <Badge variant="outline" className="text-[10px]">Base</Badge>}
          </div>
          {idx > 0 && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-md" style={{ backgroundColor: `${color}08` }}>
          <div><p className="text-[10px] text-muted-foreground uppercase">End Balance</p><p className="text-base font-bold" style={{ color }}>{fmt(result.endBalance)}</p></div>
          <div><p className="text-[10px] text-muted-foreground uppercase">Net Tax Saved</p><p className={`text-base font-bold ${result.netTaxAdvantage >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(result.netTaxAdvantage)}</p></div>
          <div><p className="text-[10px] text-muted-foreground uppercase">Concessional</p><p className="text-base font-bold">{fmt(result.totalConcessional)}</p><p className="text-[9px] text-muted-foreground">cap {fmt(result.effectiveConcessionalCap)}</p></div>
          <div><p className="text-[10px] text-muted-foreground uppercase">Non-Concess.</p><p className="text-base font-bold">{fmt(result.ncContribution)}</p><p className="text-[9px] text-muted-foreground">cap {fmt(result.ncCap)}</p></div>
        </div>

        {/* Alerts */}
        {result.concessionalExcess > 0 && (
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs"><Info className="h-3 w-3 text-amber-600 mt-0.5" /><span className="text-amber-800">Excess concessional: {fmt(result.concessionalExcess)} will be taxed at marginal rate + interest charge.</span></div>
        )}
        {result.div293Due && (
          <div className="flex items-start gap-2 p-2 bg-rose-50 border border-rose-200 rounded text-xs"><Gavel className="h-3 w-3 text-rose-600 mt-0.5" /><span className="text-rose-800">Div 293 triggered: extra 15% tax = {fmt(result.div293Amount)} (income + concessional {">"} ${rules.div293Threshold.toLocaleString()}).</span></div>
        )}

        {/* Sliders */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between"><Label className="text-xs">Salary Sacrifice (pre-tax): {fmt(i.concessionalExtra)}/yr</Label></div>
            <Slider value={[i.concessionalExtra]} min={0} max={60000} step={500} onValueChange={([v]) => update({ concessionalExtra: v })} data-testid={`slider-concess-${strategy.id}`} />
          </div>
          <div>
            <div className="flex justify-between"><Label className="text-xs">Non-Concessional (post-tax): {fmt(i.nonConcessional)}/yr</Label></div>
            <Slider value={[i.nonConcessional]} min={0} max={360000} step={1000} onValueChange={([v]) => update({ nonConcessional: v })} data-testid={`slider-nonconcess-${strategy.id}`} />
          </div>
          <div>
            <div className="flex justify-between"><Label className="text-xs">Expected Return: {fmtPct(i.returnRate * 100)}</Label></div>
            <Slider value={[i.returnRate * 1000]} min={30} max={100} step={5} onValueChange={([v]) => update({ returnRate: v / 1000 })} />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={i.useBringForward} onChange={(e) => update({ useBringForward: e.target.checked })} data-testid={`bringfwd-${strategy.id}`} />
              Use bring-forward NCC
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={i.useCarryForward} onChange={(e) => update({ useCarryForward: e.target.checked })} data-testid={`carryfwd-${strategy.id}`} />
              Use carry-forward CC
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SuperOptimiser = ({ clientId = "thompson_family", embedded = false, defaults = {} }) => {
  const [rules, setRules] = useState(SUPER_RULES);
  const [showRules, setShowRules] = useState(false);
  const [fy, setFy] = useState("FY2025");
  const baseDefaults = {
    salary: defaults.salary || 320000,
    age: defaults.age || 50,
    superBalance: defaults.superBalance || 1850000,
    unusedConcessionalFY: defaults.unusedConcessionalFY || 0,
    sgContribRate: 0.115,
    concessionalExtra: 15000,
    nonConcessional: 0,
    useBringForward: false,
    useCarryForward: false,
    fy,
    years: 15,
    returnRate: rules.defaultSuperReturn,
  };

  const [strategies, setStrategies] = useState(() => [
    { id: "base", name: "Current Plan (SG only)", inputs: { ...baseDefaults, concessionalExtra: 0 } },
    { id: "max_cc", name: "Max Concessional", inputs: { ...baseDefaults, concessionalExtra: Math.min(30000 - baseDefaults.salary * 0.115, 30000) } },
  ]);

  const results = useMemo(() => strategies.map((s) => computeStrategy({ ...s.inputs, fy }, rules)), [strategies, rules, fy]);

  const chartData = useMemo(() => {
    const maxLen = Math.max(...results.map((r) => r.trajectory.length));
    const data = [];
    for (let y = 0; y < maxLen; y++) {
      const p = { year: baseDefaults.age + y };
      strategies.forEach((s, idx) => {
        const t = results[idx].trajectory[y];
        if (t) p[s.name] = t.balance;
      });
      data.push(p);
    }
    return data;
  }, [strategies, results, baseDefaults.age]);

  const addStrategy = useCallback(() => {
    if (strategies.length >= 10) { toast.error("Max 10 strategies"); return; }
    setStrategies((prev) => [...prev, { id: `s_${Date.now()}`, name: `Strategy ${prev.length + 1}`, inputs: { ...prev[0].inputs } }]);
  }, [strategies]);

  const updateStrategy = useCallback((idx, s) => setStrategies((prev) => prev.map((x, i) => (i === idx ? s : x))), []);
  const removeStrategy = useCallback((idx) => setStrategies((prev) => prev.filter((_, i) => i !== idx)), []);

  const content = (
    <div className="space-y-6" data-testid="super-optimiser">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1a2744] flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-[#D4A84C]" />
            Contribution Calculator
          </h2>
          <p className="text-xs text-muted-foreground">Strategy modelling · concessional + non-concessional caps · Div 293 · bring-forward & carry-forward · {strategies.length} scenario{strategies.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs">
            <Label className="text-[10px] uppercase">Financial Year</Label>
            <select value={fy} onChange={(e) => setFy(e.target.value)} className="h-8 border rounded px-2 text-sm ml-1" data-testid="fy-selector">
              {Object.keys(rules.concessionalCap).map((f) => <option key={f} value={f}>{f} · cap {fmt(rules.concessionalCap[f])}</option>)}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowRules(!showRules)} data-testid="rules-btn"><Gavel className="h-3.5 w-3.5 mr-1.5" /> Legal Rules</Button>
          <Button variant="outline" size="sm" onClick={addStrategy} disabled={strategies.length >= 10} data-testid="add-strategy-btn"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Strategy</Button>
        </div>
      </div>

      {showRules && (
        <Card className="bg-amber-50 border-amber-200" data-testid="rules-editor">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gavel className="h-4 w-4" /> Superannuation Rules (Editable — reflects legal changes)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(rules.concessionalCap).map(([k, v]) => (
                <div key={k}>
                  <Label className="text-[10px] uppercase">{k} Concessional Cap</Label>
                  <Input type="number" value={v} onChange={(e) => setRules({ ...rules, concessionalCap: { ...rules.concessionalCap, [k]: +e.target.value } })} className="h-8 text-sm" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><Label className="text-[10px] uppercase">Contributions Tax</Label><Input type="number" step="0.01" value={rules.contributionsTaxLow} onChange={(e) => setRules({ ...rules, contributionsTaxLow: +e.target.value })} className="h-8 text-sm" /></div>
              <div><Label className="text-[10px] uppercase">Div 293 Threshold</Label><Input type="number" value={rules.div293Threshold} onChange={(e) => setRules({ ...rules, div293Threshold: +e.target.value })} className="h-8 text-sm" /></div>
              <div><Label className="text-[10px] uppercase">NCC Multiplier</Label><Input type="number" value={rules.nonConcessionalMultiplier} onChange={(e) => setRules({ ...rules, nonConcessionalMultiplier: +e.target.value })} className="h-8 text-sm" /></div>
              <div><Label className="text-[10px] uppercase">Carry-fwd Balance Limit</Label><Input type="number" value={rules.carryForwardBalanceLimit} onChange={(e) => setRules({ ...rules, carryForwardBalanceLimit: +e.target.value })} className="h-8 text-sm" /></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {strategies.map((s, idx) => (
          <StrategyCard
            key={s.id}
            strategy={s}
            onChange={(updated) => updateStrategy(idx, updated)}
            onRemove={() => removeStrategy(idx)}
            color={COLORS[idx % COLORS.length]}
            idx={idx}
            rules={rules}
          />
        ))}
      </div>

      {/* Projection Chart */}
      <Card data-testid="super-projection-chart">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Super Balance Projection · {baseDefaults.years || 15} years</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} width={65} />
                <Tooltip formatter={(v) => fmt(v)} labelFormatter={(v) => `Age ${v}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine x={rules.preservationAge} stroke="#D4A84C" strokeDasharray="5 5" label={{ value: `Preservation ${rules.preservationAge}`, fill: "#D4A84C", fontSize: 10 }} />
                {strategies.map((s, idx) => (
                  <Line key={s.id} type="monotone" dataKey={s.name} stroke={COLORS[idx % COLORS.length]} strokeWidth={idx === 0 ? 2.5 : 1.8} dot={false} strokeDasharray={idx === 0 ? undefined : "4 3"} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {strategies.length > 1 && (
        <Card data-testid="super-comparison-table">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Strategy Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                    {strategies.map((s, idx) => <th key={s.id} className="py-2 px-2 text-center font-medium" style={{ color: COLORS[idx] }}>{s.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Pre-tax extra", (_, r) => fmt(r.totalConcessional - r.sgContribution)],
                    ["Post-tax extra", (s) => fmt(s.inputs.nonConcessional)],
                    ["Super tax in fund", (_, r) => fmt(r.contribTaxInFund)],
                    ["Personal tax saved", (_, r) => fmt(r.personalTaxSaved)],
                    ["Div 293 tax", (_, r) => fmt(r.div293Amount)],
                    ["Net tax advantage", (_, r) => ({ txt: fmt(r.netTaxAdvantage), color: r.netTaxAdvantage >= 0 ? "#10b981" : "#f43f5e" })],
                    ["End super balance", (_, r) => ({ txt: fmt(r.endBalance), bold: true })],
                  ].map(([label, fn], rowIdx) => (
                    <tr key={label} className={`border-b ${label === "End super balance" ? "bg-gray-50 font-semibold" : ""}`}>
                      <td className="py-2 pr-4">{label}</td>
                      {strategies.map((s, idx) => {
                        const out = fn(s, results[idx]);
                        const val = typeof out === "object" ? out.txt : out;
                        const style = typeof out === "object" ? { color: out.color, fontWeight: out.bold ? 700 : undefined } : {};
                        return <td key={s.id} className="py-2 px-2 text-center" style={style}>{val}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return content;
};

export default SuperOptimiser;
