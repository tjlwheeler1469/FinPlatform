import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar, Legend,
} from "recharts";
import { ShieldCheck } from "lucide-react";
import { fmt, fmtShort, ALLOC_COLORS } from "./utils";

const SnapshotTab = ({ client }) => {
  const totalAssets = client.assets.reduce((s, a) => s + a.value, 0);
  const totalLiab = client.liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiab;

  const allocation = useMemo(() => {
    const byType = client.assets.reduce((acc, a) => {
      const b = a.type === "Super" || a.type === "SMSF" ? "Super"
        : a.type === "Property" ? "Property"
        : a.type === "Shares" || a.type === "Managed Fund" || a.type === "Bonds" || a.type === "Alternatives" ? "Investments"
        : a.type === "Cash" ? "Cash" : "Other";
      acc[b] = (acc[b] || 0) + a.value;
      return acc;
    }, {});
    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }, [client]);

  const netWorthTrend = useMemo(() => {
    const months = 12;
    const out = [];
    const growthPerMonth = 0.007;
    let v = netWorth / Math.pow(1 + growthPerMonth, months);
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 0; i < months; i++) {
      v = v * (1 + growthPerMonth + (Math.sin(i) * 0.004));
      out.push({ month: names[(new Date().getMonth() - (months - 1) + i + 12) % 12], value: Math.round(v) });
    }
    out[months - 1].value = netWorth;
    return out;
  }, [netWorth]);

  const cashFlow = useMemo(() => {
    const b = client.budget || { monthlyIncome: 0, monthlyExpenses: 0 };
    const names = ["6mo ago", "5mo ago", "4mo ago", "3mo ago", "2mo ago", "Last mo"];
    return names.map((label, i) => ({
      name: label,
      income: Math.round(b.monthlyIncome * (1 + (i - 3) * 0.01)),
      expenses: Math.round(b.monthlyExpenses * (1 + (i - 3) * 0.015)),
    }));
  }, [client]);

  const alData = [
    { name: "Assets", value: totalAssets, color: "#10b981" },
    { name: "Debt", value: totalLiab, color: "#ef4444" },
    { name: "Net Worth", value: netWorth, color: "#1a2744" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-7">
          <p className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-semibold">Net worth</p>
          <p className="font-serif text-5xl text-[#1a2744] mt-2 tabular-nums" data-testid="client-net-worth">{fmt(netWorth)}</p>
          <div className="grid grid-cols-2 gap-6 mt-6 pt-5 border-t border-slate-100">
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500">Total assets</p>
              <p className="font-serif text-xl text-[#1a2744] mt-0.5 tabular-nums">{fmtShort(totalAssets)}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500">Total debt</p>
              <p className="font-serif text-xl text-[#1a2744] mt-0.5 tabular-nums">{fmtShort(totalLiab)}</p>
            </div>
          </div>
        </div>
        <Card className="border-slate-200">
          <CardContent className="p-5">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">12-month trend</p>
            <div style={{ width: "100%", height: 120, minHeight: 120 }} className="mt-2">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <AreaChart data={netWorthTrend} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                  <defs><linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4A84C" stopOpacity={0.4} /><stop offset="95%" stopColor="#D4A84C" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Area dataKey="value" stroke="#D4A84C" strokeWidth={2} fill="url(#nwGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 mt-1"><span className="text-emerald-600 font-semibold">+{(((netWorth - netWorthTrend[0].value) / netWorthTrend[0].value) * 100).toFixed(1)}%</span> this year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">How your wealth is allocated</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 240, minHeight: 240 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
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
                <div key={a.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                  <span>{a.name} {fmtShort(a.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-2"><CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Income vs expenses · 6 months</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 240, minHeight: 240 }}>
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={cashFlow} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `$${Math.round(v/1000)}k`} width={50} axisLine={false} tickLine={false} />
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

      <Card className="border-slate-200">
        <CardHeader className="pb-2"><CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Assets · debt · net worth</CardTitle></CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 160, minHeight: 160 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={alData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `$${(v/1e6).toFixed(1)}M`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {alData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-[#D4A84C] flex-shrink-0" strokeWidth={1.5} />
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1a2744]">Your adviser is actively managing this portfolio.</p>
          <p className="text-xs text-slate-500 mt-0.5">Any changes you request go to your adviser for review — they won't affect live numbers until approved.</p>
        </div>
      </div>
    </div>
  );
};

export default SnapshotTab;
