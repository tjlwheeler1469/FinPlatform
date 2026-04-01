import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Users, ArrowLeftRight, TrendingUp, TrendingDown, DollarSign, Shield,
  BarChart3, PieChart, Building2, Landmark, Wallet, Target
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";

const CLIENTS = {
  client_1: {
    name: "Wheeler Family", type: "Household", riskProfile: "Growth", age: 45,
    netWorth: 1978000, totalAssets: 2920000, totalDebt: 942000,
    allocation: { shares: 28, property: 42, super: 20, cash: 5, bonds: 3, other: 2 },
    income: 253400, expenses: 142000, performance: 6.2,
    metrics: { drift: 82, compliance: 95, engagement: 78, risk: 88, returns: 74 },
  },
  client_2: {
    name: "Chen Family Trust", type: "Trust", riskProfile: "Balanced", age: 52,
    netWorth: 4370000, totalAssets: 5780000, totalDebt: 1410000,
    allocation: { shares: 32, property: 28, super: 19, cash: 9, bonds: 8, other: 4 },
    income: 407000, expenses: 198000, performance: 8.5,
    metrics: { drift: 94, compliance: 100, engagement: 92, risk: 96, returns: 91 },
  },
  client_3: {
    name: "Robert Mitchell", type: "Individual", riskProfile: "Conservative", age: 58,
    netWorth: 1755000, totalAssets: 1755000, totalDebt: 0,
    allocation: { shares: 36, property: 0, super: 39, cash: 12, bonds: 10, other: 3 },
    income: 154500, expenses: 82000, performance: 4.1,
    metrics: { drift: 68, compliance: 78, engagement: 45, risk: 72, returns: 65 },
  },
  client_4: {
    name: "Williams Family", type: "Household", riskProfile: "Growth", age: 38,
    netWorth: 1330000, totalAssets: 2050000, totalDebt: 720000,
    allocation: { shares: 18, property: 59, super: 15, cash: 4, bonds: 2, other: 2 },
    income: 200000, expenses: 145000, performance: 9.8,
    metrics: { drift: 88, compliance: 90, engagement: 85, risk: 82, returns: 88 },
  },
  client_5: {
    name: "Patel SMSF", type: "SMSF", riskProfile: "Aggressive", age: 48,
    netWorth: 6670000, totalAssets: 8130000, totalDebt: 1460000,
    allocation: { shares: 30, property: 26, super: 23, cash: 9, bonds: 7, other: 5 },
    income: 466000, expenses: 225000, performance: 11.2,
    metrics: { drift: 91, compliance: 98, engagement: 96, risk: 94, returns: 95 },
  },
};

const formatCurrency = (v) => {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toLocaleString()}`;
};

const COLORS = ["#0f1d35", "#D4A84C", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

const ClientComparison = ({ embedded = false }) => {
  const [selected, setSelected] = useState(["client_1", "client_2", "client_3"]);

  const updateSelection = (idx, val) => {
    setSelected(prev => { const n = [...prev]; n[idx] = val; return n; });
  };

  const addSlot = () => { if (selected.length < 3) setSelected([...selected, "client_4"]); };
  const removeSlot = (idx) => { if (selected.length > 2) setSelected(selected.filter((_, i) => i !== idx)); };

  const clients = selected.map(id => CLIENTS[id]).filter(Boolean);

  // Radar chart data
  const radarData = ["drift", "compliance", "engagement", "risk", "returns"].map(key => {
    const point = { metric: key.charAt(0).toUpperCase() + key.slice(1) };
    clients.forEach((c, i) => { point[c.name] = c.metrics[key]; });
    return point;
  });

  // Bar chart — Net Worth
  const netWorthData = clients.map(c => ({ name: c.name.split(" ")[0], netWorth: c.netWorth, assets: c.totalAssets, debt: c.totalDebt }));

  // Allocation comparison
  const allocKeys = ["shares", "property", "super", "cash", "bonds", "other"];
  const allocData = allocKeys.map(key => {
    const point = { asset: key.charAt(0).toUpperCase() + key.slice(1) };
    clients.forEach(c => { point[c.name] = c.allocation[key]; });
    return point;
  });

  const content = (
    <div className="space-y-6" data-testid="client-comparison">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-[#D4A84C]" /> Client Comparison
          </h1>
          <p className="text-muted-foreground text-sm">Side-by-side analysis of client portfolios</p>
        </div>
        {selected.length < 3 && (
          <Button variant="outline" size="sm" onClick={addSlot} data-testid="add-comparison-slot">
            + Add Client
          </Button>
        )}
      </div>

      {/* Client Selectors */}
      <div className="grid grid-cols-3 gap-4">
        {selected.map((id, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <div className="h-3 w-3 rounded-full" style={{ background: COLORS[idx] }} />
            <Select value={id} onValueChange={v => updateSelection(idx, v)}>
              <SelectTrigger className="flex-1" data-testid={`select-client-${idx}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CLIENTS).map(([cid, c]) => (
                  <SelectItem key={cid} value={cid}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected.length > 2 && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeSlot(idx)}>x</Button>
            )}
          </div>
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        {clients.map((c, idx) => (
          <Card key={idx} className="border-t-4" style={{ borderTopColor: COLORS[idx] }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.type} &middot; {c.riskProfile} &middot; Age {c.age}</p>
                </div>
                <Badge variant="outline" className={`text-xs ${c.performance >= 8 ? "border-emerald-300 text-emerald-700" : c.performance >= 5 ? "border-blue-300 text-blue-700" : "border-amber-300 text-amber-700"}`}>
                  {c.performance >= 0 ? "+" : ""}{c.performance}%
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Net Worth</p>
                  <p className="font-bold text-sm">{formatCurrency(c.netWorth)}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Income</p>
                  <p className="font-bold text-sm">{formatCurrency(c.income)}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Assets</p>
                  <p className="font-bold text-sm">{formatCurrency(c.totalAssets)}</p>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-muted-foreground">Debt</p>
                  <p className="font-bold text-sm text-red-600">{formatCurrency(c.totalDebt)}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {Object.entries(c.metrics).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-20 capitalize">{k}</span>
                    <Progress value={v} className="h-1.5 flex-1" />
                    <span className={`text-[10px] font-medium ${v >= 80 ? "text-emerald-600" : v >= 60 ? "text-amber-600" : "text-red-600"}`}>{v}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Health Metrics Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  {clients.map((c, i) => (
                    <Radar key={c.name} name={c.name} dataKey={c.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Net Worth Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Worth & Leverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={netWorthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="assets" name="Total Assets" fill="#0f1d35" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="debt" name="Total Debt" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netWorth" name="Net Worth" fill="#D4A84C" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocation Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Asset Allocation Comparison (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allocData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="asset" tick={{ fontSize: 11 }} width={70} />
                <Tooltip formatter={v => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {clients.map((c, i) => (
                  <Bar key={c.name} dataKey={c.name} fill={COLORS[i]} radius={[0, 4, 4, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Savings & Cash Flow */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {clients.map((c, idx) => {
              const surplus = c.income - c.expenses;
              const savingsRate = Math.round((surplus / c.income) * 100);
              return (
                <div key={idx} className="space-y-2 p-3 rounded-lg bg-muted">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS[idx] }} />
                    {c.name}
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-600">Income: {formatCurrency(c.income)}</span>
                    <span className="text-red-600">Expenses: {formatCurrency(c.expenses)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">Surplus: {formatCurrency(surplus)}</span>
                    <span className="font-medium">Savings Rate: {savingsRate}%</span>
                  </div>
                  <Progress value={savingsRate} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default ClientComparison;
