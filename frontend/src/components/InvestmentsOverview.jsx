import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, PieChart, Building2, Wallet, Shield,
  BarChart3, ArrowLeftRight,
} from "lucide-react";
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

// Muted navy/gold/slate palette — replaces the previous rainbow CHART_COLORS
// so the Investments page matches the airy Retirement Planner aesthetic.
const CHART_COLORS = ["#1a2744", "#D4A84C", "#475569", "#94a3b8", "#2d3a55", "#b8902a", "#64748b", "#cbd5e1"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);

const getActiveAssets = () => {
  const id = getActiveClientId();
  const d = CLIENT_DATA[id] || CLIENT_DATA.thompson_family;
  return { assets: d.assets, liabilities: d.liabilities, rebalancing: d.rebalancing };
};


const InvestmentsOverview = () => {
  const { assets: activeAssets, liabilities: activeLiabilities, rebalancing: activeRebalancing } = getActiveAssets();

  const totalValue = useMemo(() => activeAssets.reduce((s, a) => s + a.value, 0), [activeAssets]);
  const totalLiabilities = useMemo(() => activeLiabilities.reduce((s, l) => s + l.value, 0), [activeLiabilities]);
  const netWorth = totalValue - totalLiabilities;

  // Allocation by type
  const allocationByType = useMemo(() => {
    const grouped = {};
    activeAssets.forEach(a => {
      grouped[a.type] = (grouped[a.type] || 0) + a.value;
    });
    return Object.entries(grouped)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length], pct: ((value / totalValue) * 100).toFixed(1) }))
      .sort((a, b) => b.value - a.value);
  }, [totalValue, activeAssets]);

  // Allocation by entity
  const allocationByEntity = useMemo(() => {
    const grouped = {};
    activeAssets.forEach(a => {
      grouped[a.entity] = (grouped[a.entity] || 0) + a.value;
    });
    return Object.entries(grouped)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [activeAssets]);

  // Performance summary
  const weightedReturn = useMemo(() => {
    const total = activeAssets.reduce((s, a) => s + a.value * (a.change / 100), 0);
    return ((total / totalValue) * 100).toFixed(1);
  }, [totalValue, activeAssets]);

  // Radar chart data for rebalancing
  const radarData = useMemo(() =>
    activeRebalancing.map(item => ({
      subject: item.asset.split(" ")[0],
      current: item.current,
      target: item.target,
      fullMark: 50
    })),
  [activeRebalancing]);

  return (
    <div className="space-y-6" data-testid="investments-overview">
      {/* Summary Strip — airy white cards · navy serif (Image 3 reference) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="investments-kpi-strip">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Total assets</p>
            <p className="font-serif text-xl text-[#1a2744] mt-1.5 tabular-nums">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Total liabilities</p>
            <p className="font-serif text-xl text-[#1a2744] mt-1.5 tabular-nums">{formatCurrency(totalLiabilities)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Net worth</p>
            <p className="font-serif text-xl text-[#1a2744] mt-1.5 tabular-nums">{formatCurrency(netWorth)}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Weighted return</p>
            <p className="font-serif text-xl text-[#1a2744] mt-1.5 tabular-nums">
              <span className="text-xs text-[#D4A84C] font-sans mr-1">{Number(weightedReturn) >= 0 ? "▲" : "▼"}</span>
              {Number(weightedReturn) >= 0 ? "+" : ""}{weightedReturn}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold">Holdings</p>
            <p className="font-serif text-xl text-[#1a2744] mt-1.5 tabular-nums">{activeAssets.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Asset Allocation Pie */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
              <PieChart className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Asset allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RechartsPie>
                  <Pie data={allocationByType} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2} dataKey="value">
                    {allocationByType.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Entity Breakdown */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Holdings by entity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={allocationByEntity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                  <XAxis type="number" tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {allocationByEntity.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Rebalancing — ABOVE Top Holdings, with spider/radar chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
              <ArrowLeftRight className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Portfolio rebalancing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeRebalancing.map((item, i) => {
                const tone = item.action === "Buy"
                  ? "border-[#1a2744] text-[#1a2744] bg-white"
                  : item.action === "Sell"
                  ? "border-[#D4A84C] text-[#8a6c1a] bg-white"
                  : "border-slate-300 text-slate-600 bg-white";
                return (
                  <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white" data-testid={`rebalance-row-${i}`}>
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-sm w-40 text-[#1a2744]">{item.asset}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">Current: {item.current}%</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-medium text-[#1a2744]">Target: {item.target}%</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-semibold ${tone}`}>
                      {item.action} {Math.abs(item.diff)}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Spider / Radar Chart */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Allocation radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 50]} tick={{ fontSize: 10 }} />
                  <Radar name="Current" dataKey="current" stroke="#1a2744" fill="#1a2744" fillOpacity={0.4} />
                  <Radar name="Target" dataKey="target" stroke="#D4A84C" fill="#D4A84C" fillOpacity={0.25} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Holdings */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-semibold flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-[#D4A84C]" strokeWidth={1.5} /> Top holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...activeAssets].sort((a, b) => b.value - a.value).slice(0, 6).map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center border border-slate-200 bg-white text-[#1a2744]">
                    {asset.type === "Shares" ? <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} /> :
                     asset.type === "Property" ? <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} /> :
                     asset.type === "Super" ? <Shield className="h-3.5 w-3.5" strokeWidth={1.5} /> :
                     <Wallet className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1a2744]">{asset.name}</p>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-1 border-slate-300 text-slate-600">{asset.type}</Badge>
                      <Badge variant="outline" className="text-[10px] px-1 border-slate-200 text-slate-500">{asset.entity}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-[#1a2744]">{formatCurrency(asset.value)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    <span className="text-[#D4A84C] mr-1">{asset.change >= 0 ? "▲" : "▼"}</span>
                    {asset.change >= 0 ? "+" : ""}{asset.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvestmentsOverview;
