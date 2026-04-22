// Simplified Client Portal — high-level, read-only view.
// 5 sections only: Snapshot, Investments (view), Retirement, Documents, Messages.
// Any "edits" go to an adviser-pending queue (localStorage), not live data.
import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientSandbox from "@/components/ClientSandbox";
import SimpleGoals from "@/components/SimpleGoals";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar, Legend,
} from "recharts";
import {
  LayoutDashboard, TrendingUp, Gauge, FileText, MessageSquare,
  ShieldCheck, Lock, Send, CheckCircle2, FlaskConical, PiggyBank, Calculator, Landmark, Target,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import { projectRetirement } from "@/lib/retirementEngine";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);
const fmtShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

const ALLOC_COLORS = ["#1a2744", "#D4A84C", "#10b981", "#8b5cf6", "#06b6d4", "#f43f5e"];

const SnapshotTab = ({ client }) => {
  const totalAssets = client.assets.reduce((s, a) => s + a.value, 0);
  const totalLiab = client.liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiab;

  const allocation = useMemo(() => {
    const byType = client.assets.reduce((acc, a) => {
      const b = a.type === "Super" || a.type === "SMSF" ? "Super" : a.type === "Property" ? "Property" : a.type === "Shares" || a.type === "Managed Fund" || a.type === "Bonds" || a.type === "Alternatives" ? "Investments" : a.type === "Cash" ? "Cash" : "Other";
      acc[b] = (acc[b] || 0) + a.value;
      return acc;
    }, {});
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [client]);

  // Net worth trend — simulated historical trajectory
  const netWorthTrend = useMemo(() => {
    const months = 12;
    const out = [];
    const growthPerMonth = 0.007; // ~8.7% annual
    let v = netWorth / Math.pow(1 + growthPerMonth, months);
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < months; i++) {
      v = v * (1 + growthPerMonth + (Math.sin(i) * 0.004));
      out.push({ month: names[(new Date().getMonth() - (months - 1) + i + 12) % 12], value: Math.round(v) });
    }
    out[months - 1].value = netWorth; // lock current month
    return out;
  }, [netWorth]);

  // Cash flow last 6 months (from budget)
  const cashFlow = useMemo(() => {
    const b = client.budget || { monthlyIncome: 0, monthlyExpenses: 0 };
    const names = ["6mo ago", "5mo ago", "4mo ago", "3mo ago", "2mo ago", "Last mo"];
    return names.map((label, i) => ({
      name: label,
      income: Math.round(b.monthlyIncome * (1 + (i - 3) * 0.01)),
      expenses: Math.round(b.monthlyExpenses * (1 + (i - 3) * 0.015)),
    }));
  }, [client]);

  // Assets vs Liabilities bar
  const alData = [
    { name: "Assets", value: totalAssets, color: "#10b981" },
    { name: "Debt", value: totalLiab, color: "#ef4444" },
    { name: "Net Worth", value: netWorth, color: "#1a2744" },
  ];

  return (
    <div className="space-y-4">
      {/* Headline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white border-0">
          <CardContent className="p-6">
            <p className="text-xs uppercase tracking-wide text-white/60">Net Worth</p>
            <p className="text-5xl font-bold mt-1" data-testid="client-net-worth">{fmt(netWorth)}</p>
            <div className="grid grid-cols-2 gap-6 mt-5 pt-4 border-t border-white/10">
              <div><p className="text-[11px] text-white/60">Total Assets</p><p className="text-xl font-bold text-emerald-300">{fmtShort(totalAssets)}</p></div>
              <div><p className="text-[11px] text-white/60">Total Debt</p><p className="text-xl font-bold text-rose-300">{fmtShort(totalLiab)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">12-month trend</p>
            <div style={{ width: "100%", height: 120, minHeight: 120 }} className="mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthTrend} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4A84C" stopOpacity={0.5} /><stop offset="95%" stopColor="#D4A84C" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Area dataKey="value" stroke="#D4A84C" strokeWidth={2} fill="url(#nwGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">+{(((netWorth - netWorthTrend[0].value) / netWorthTrend[0].value) * 100).toFixed(1)}% this year</p>
          </CardContent>
        </Card>
      </div>

      {/* Allocation + Cash flow side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">How your wealth is allocated</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 240, minHeight: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {allocation.map((_, i) => <Cell key={i} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {allocation.map((a, i) => (
                <div key={a.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                  <span>{a.name} {fmtShort(a.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Income vs Expenses · 6 months</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 240, minHeight: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${Math.round(v/1000)}k`} width={50} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets vs Liabilities visualization */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Assets · Debt · Net Worth</CardTitle></CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 160, minHeight: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1e6).toFixed(1)}M`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {alData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a2744]/5 border-[#1a2744]/20">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-[#1a2744]" />
          <div className="flex-1">
            <p className="text-sm font-medium">Your adviser is actively managing this portfolio.</p>
            <p className="text-xs text-muted-foreground">Any changes you request go to your adviser for review — they won't affect live numbers until approved.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const InvestmentsTab = ({ client }) => {
  const grouped = useMemo(() => client.assets.reduce((acc, a) => {
    (acc[a.type] = acc[a.type] || []).push(a);
    return acc;
  }, {}), [client]);

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([type, list]) => (
        <Card key={type}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{type}</span>
              <span className="text-xs text-muted-foreground">{fmt(list.reduce((s, x) => s + x.value, 0))}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {list.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                <div>
                  <p className="font-medium">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.entity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{fmt(a.value)}</p>
                  {a.change !== undefined && (
                    <p className={`text-[11px] ${a.change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{a.change >= 0 ? "+" : ""}{a.change.toFixed(1)}%</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <p className="text-[11px] text-center text-muted-foreground py-2 flex items-center justify-center gap-1.5"><Lock className="h-3 w-3" />View only — contact your adviser to adjust holdings</p>
    </div>
  );
};

const RetirementTab = ({ client }) => {
  const liquidAssets = client.assets.filter((a) => ["Super", "Shares", "Managed Fund", "Cash", "SMSF", "Bonds", "Alternatives"].includes(a.type)).reduce((s, a) => s + a.value, 0);
  const superAssets = client.assets.filter((a) => ["Super", "SMSF"].includes(a.type));
  const totalSuper = superAssets.reduce((s, a) => s + a.value, 0);
  const result = projectRetirement({
    currentPortfolio: liquidAssets,
    annualContributions: client.retirement.annual_contributions,
    annualSpending: client.retirement.retirement_spending,
    yearsToRetirement: Math.max(0, client.retirement.retirement_age - client.retirement.current_age),
    yearsInRetirement: Math.max(1, client.retirement.life_expectancy - client.retirement.retirement_age),
    numSims: 300,
  });

  const chartData = result.trajectory.map((t, i) => ({ age: client.retirement.current_age + i, p10: t.p10, p50: t.p50, p90: t.p90 }));
  const tone = result.confidence >= 80 ? "text-emerald-600" : result.confidence >= 60 ? "text-blue-600" : "text-amber-600";

  // Concessional cap usage (FY25 $30k)
  const concessionalCap = 30000;
  const concessionalUsed = Math.min(client.retirement.annual_contributions, concessionalCap);
  const capUsedPct = Math.round((concessionalUsed / concessionalCap) * 100);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Retirement Confidence</p>
          <p className={`text-6xl font-bold ${tone} my-2`} data-testid="client-retirement-confidence">{result.confidence}%</p>
          <p className="text-sm">You can retire at age <strong>{client.retirement.retirement_age}</strong> spending <strong>{fmt(client.retirement.retirement_spending)}</strong>/yr.</p>
          <p className="text-[11px] text-muted-foreground mt-2">Based on {result.numSims} Monte Carlo simulations · {client.retirement.retirement_age - client.retirement.current_age} years to go</p>
        </CardContent>
      </Card>

      {/* Side-by-side: Current Plan (left) vs Try Your Own Scenarios sandbox (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* LEFT: Current plan */}
        <div className="space-y-4" data-testid="client-retirement-current">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Your Current Plan · Projected balance (P10 · P50 · P90)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} width={55} />
                    <Tooltip formatter={(v) => fmt(v)} labelFormatter={(v) => `Age ${v}`} />
                    <Line type="monotone" dataKey="p10" stroke="#f43f5e" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="P10 (pessimistic)" />
                    <Line type="monotone" dataKey="p50" stroke="#1a2744" strokeWidth={2.5} dot={false} name="P50 (median)" />
                    <Line type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="P90 (optimistic)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Super & Pension summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Landmark className="h-4 w-4 text-[#D4A84C]" /> Super &amp; Pension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Super Balance</p>
                  <p className="text-xl font-bold text-[#1a2744]">{fmtShort(totalSuper)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Annual Contributions</p>
                  <p className="text-xl font-bold text-[#1a2744]">{fmt(client.retirement.annual_contributions)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Retirement Age</p>
                  <p className="text-xl font-bold text-[#1a2744]">{client.retirement.retirement_age}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1"><span>Concessional cap usage (FY25 ${(concessionalCap/1000).toFixed(0)}k)</span><span className="font-semibold">{capUsedPct}%</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#D4A84C]" style={{ width: `${Math.min(100, capUsedPct)}%` }} /></div>
              </div>

              {superAssets.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  {superAssets.map((s, i) => (
                    <div key={i} className="flex justify-between text-sm py-1">
                      <span className="text-muted-foreground">{s.name}</span>
                      <span className="font-semibold">{fmt(s.value)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 pt-1"><Lock className="h-3 w-3" /> View only — speak to your adviser to adjust contributions</p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Scenarios & Sandbox — side by side for easy comparison */}
        <Card className="border-[#D4A84C]/40 bg-gradient-to-br from-amber-50/40 to-white" data-testid="client-retirement-sandbox">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[#D4A84C]" /> Try Your Own Scenarios
            </CardTitle>
            <p className="text-xs text-muted-foreground">Experiment with contributions, retirement age, and spending — results update live, side-by-side with your current plan.</p>
          </CardHeader>
          <CardContent>
            <ClientSandbox
              seed={{
                startingBalance: liquidAssets,
                annualContrib: client.retirement.annual_contributions,
                annualSpending: client.retirement.retirement_spending,
                currentAge: client.retirement.current_age,
                retireAge: client.retirement.retirement_age,
                lifeExpectancy: client.retirement.life_expectancy,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const BudgetTab = ({ client }) => {
  const b = client.budget || { monthlyIncome: 0, monthlyExpenses: 0, savingsRate: 0 };
  const monthlySavings = b.monthlyIncome - b.monthlyExpenses;
  const annualIncome = (client.profile?.incomeHousehold) || (b.monthlyIncome * 12);
  const annualExpenses = (client.profile?.expensesAnnual) || (b.monthlyExpenses * 12);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Household Cash Flow</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">Monthly In</p>
              <p className="text-xl font-bold text-emerald-700">{fmtShort(b.monthlyIncome)}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-rose-700">Monthly Out</p>
              <p className="text-xl font-bold text-rose-700">{fmtShort(b.monthlyExpenses)}</p>
            </div>
            <div className="p-3 bg-[#1a2744]/5 rounded">
              <p className="text-[10px] uppercase tracking-wide text-[#1a2744]">Monthly Saved</p>
              <p className="text-xl font-bold text-[#1a2744]">{fmtShort(monthlySavings)}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1"><span>Savings rate</span><span className="font-semibold text-[#D4A84C]">{b.savingsRate}%</span></div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-emerald-500 to-[#D4A84C]" style={{ width: `${Math.min(100, b.savingsRate)}%` }} /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Annual Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Household income (annual)</span><span className="font-semibold">{fmt(annualIncome)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Household expenses (annual)</span><span className="font-semibold">{fmt(annualExpenses)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-sm text-muted-foreground">Annual savings</span><span className="font-semibold text-emerald-600">{fmt(annualIncome - annualExpenses)}</span></div>
            <div className="flex justify-between py-2"><span className="text-sm font-semibold text-[#1a2744]">Effective savings rate</span><span className="font-bold text-[#D4A84C]">{b.savingsRate}%</span></div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 pt-3"><Lock className="h-3 w-3" /> View only — all cash flow data is managed by your adviser</p>
        </CardContent>
      </Card>
    </div>
  );
};

const TaxTab = ({ client }) => {
  const income = client.profile?.incomeHousehold || (client.budget?.monthlyIncome * 12) || 0;
  const superConcessional = Math.min(client.retirement?.annual_contributions || 0, 30000);
  // 2025 AU tax bands (combined household rough estimate — for illustration only)
  const bands = [
    { from: 0, to: 18200, rate: 0 },
    { from: 18200, to: 45000, rate: 0.16 },
    { from: 45000, to: 135000, rate: 0.30 },
    { from: 135000, to: 190000, rate: 0.37 },
    { from: 190000, to: Infinity, rate: 0.45 },
  ];
  const taxable = Math.max(0, income - superConcessional);
  let tax = 0;
  for (const b of bands) {
    if (taxable > b.from) tax += (Math.min(taxable, b.to) - b.from) * b.rate;
  }
  const medicare = taxable * 0.02;
  const totalTax = tax + medicare;
  const netIncome = income - totalTax - superConcessional;
  const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Estimated Annual Tax Position</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gross Income</p>
              <p className="text-lg font-bold text-[#1a2744]">{fmtShort(income)}</p>
            </div>
            <div className="p-3 bg-[#D4A84C]/10 rounded">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Super Salary-Sac</p>
              <p className="text-lg font-bold text-[#D4A84C]">{fmtShort(superConcessional)}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-rose-700">Est. Tax + Medicare</p>
              <p className="text-lg font-bold text-rose-700">{fmtShort(totalTax)}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">Net (After Tax)</p>
              <p className="text-lg font-bold text-emerald-700">{fmtShort(netIncome)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Marginal Tax Bands Applied</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {bands.filter((b) => taxable > b.from).map((b, i) => {
              const applied = Math.min(taxable, b.to) - b.from;
              return (
                <div key={i} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">{fmt(b.from)}{b.to !== Infinity ? ` – ${fmt(b.to)}` : "+"} · {(b.rate * 100).toFixed(0)}%</span>
                  <span className="font-semibold">{fmt(applied * b.rate)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between pt-3 mt-2 border-t">
            <span className="font-semibold text-[#1a2744]">Effective tax rate</span>
            <span className="font-bold text-[#D4A84C]">{effectiveRate.toFixed(1)}%</span>
          </div>
          <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 pt-3"><Lock className="h-3 w-3" /> Illustrative only — your adviser's tax models include your full entity structure &amp; deductions</p>
        </CardContent>
      </Card>
    </div>
  );
};

const DocumentsTab = () => {
  const docs = [
    { name: "Statement of Advice (SOA)", date: "Mar 2025", status: "signed" },
    { name: "Financial Services Guide (FSG) v5", date: "Jan 2025", status: "current" },
    { name: "Fee Disclosure Statement", date: "Apr 2025", status: "awaiting" },
    { name: "Annual Review Pack 2024", date: "Nov 2024", status: "signed" },
  ];
  return (
    <div className="space-y-2">
      {docs.map((d, i) => (
        <Card key={i}>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#1a2744]" />
              <div>
                <p className="text-sm font-medium">{d.name}</p>
                <p className="text-[11px] text-muted-foreground">{d.date}</p>
              </div>
            </div>
            <Badge variant={d.status === "signed" ? "default" : d.status === "awaiting" ? "outline" : "secondary"} className={d.status === "signed" ? "bg-emerald-500" : ""}>
              {d.status === "signed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {d.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const MessagesTab = ({ clientId }) => {
  const [msg, setMsg] = useState("");
  const [thread, setThread] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`client_msgs_${clientId}`) || "[]"); } catch { return []; }
  });

  const send = () => {
    if (!msg.trim()) return;
    const entry = { from: "client", body: msg, ts: new Date().toISOString() };
    const updated = [...thread, entry];
    setThread(updated);
    localStorage.setItem(`client_msgs_${clientId}`, JSON.stringify(updated));
    setMsg("");
    toast.success("Message sent to your adviser");
  };

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Message your adviser</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {thread.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No messages yet</p>}
          {thread.map((m, i) => (
            <div key={i} className={`p-2.5 rounded-lg text-sm ${m.from === "client" ? "bg-[#1a2744]/10 ml-8" : "bg-gray-100 mr-8"}`}>
              <p>{m.body}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(m.ts).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask your adviser anything…" rows={2} data-testid="client-msg-input" />
          <Button onClick={send} className="bg-[#1a2744]" data-testid="client-msg-send"><Send className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SimpleClientView = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto p-4" data-testid="simple-client-view">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#1a2744]">Hello, {client.profile.name.split(" & ")[0]}</h1>
          <p className="text-xs text-muted-foreground">A calm, simple view of your wealth · managed by {client.profile.advisor || "your adviser"}</p>
        </div>
        <Tabs defaultValue="snapshot">
          <TabsList className="bg-white border w-full justify-start h-10 overflow-x-auto">
            <TabsTrigger value="snapshot" className="gap-1.5 flex-shrink-0" data-testid="client-tab-snapshot"><LayoutDashboard className="h-3.5 w-3.5" />Snapshot</TabsTrigger>
            <TabsTrigger value="retirement" className="gap-1.5 flex-shrink-0" data-testid="client-tab-retire"><Gauge className="h-3.5 w-3.5" />Retirement &amp; Super</TabsTrigger>
            <TabsTrigger value="investments" className="gap-1.5 flex-shrink-0" data-testid="client-tab-invest"><TrendingUp className="h-3.5 w-3.5" />Investments</TabsTrigger>
            <TabsTrigger value="budget" className="gap-1.5 flex-shrink-0" data-testid="client-tab-budget"><PiggyBank className="h-3.5 w-3.5" />Budget</TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5 flex-shrink-0" data-testid="client-tab-goals"><Target className="h-3.5 w-3.5" />Goals &amp; Scenarios</TabsTrigger>
            <TabsTrigger value="tax" className="gap-1.5 flex-shrink-0" data-testid="client-tab-tax"><Calculator className="h-3.5 w-3.5" />Tax Centre</TabsTrigger>
            <TabsTrigger value="docs" className="gap-1.5 flex-shrink-0" data-testid="client-tab-docs"><FileText className="h-3.5 w-3.5" />Documents</TabsTrigger>
            <TabsTrigger value="msgs" className="gap-1.5 flex-shrink-0" data-testid="client-tab-msgs"><MessageSquare className="h-3.5 w-3.5" />Messages</TabsTrigger>
          </TabsList>
          <TabsContent value="snapshot" className="pt-4"><SnapshotTab client={client} /></TabsContent>
          <TabsContent value="retirement" className="pt-4"><RetirementTab client={client} /></TabsContent>
          <TabsContent value="investments" className="pt-4"><InvestmentsTab client={client} /></TabsContent>
          <TabsContent value="budget" className="pt-4"><BudgetTab client={client} /></TabsContent>
          <TabsContent value="goals" className="pt-4"><SimpleGoals embedded clientId={clientId} /></TabsContent>
          <TabsContent value="tax" className="pt-4"><TaxTab client={client} /></TabsContent>
          <TabsContent value="docs" className="pt-4"><DocumentsTab /></TabsContent>
          <TabsContent value="msgs" className="pt-4"><MessagesTab clientId={clientId} /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SimpleClientView;
