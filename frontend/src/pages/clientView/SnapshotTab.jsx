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
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">How your wealth is allocated</CardTitle></CardHeader>
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
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
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

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Assets · Debt · Net Worth</CardTitle></CardHeader>
        <CardContent>
          <div style={{ width: "100%", height: 160, minHeight: 160 }}>
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
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

export default SnapshotTab;
