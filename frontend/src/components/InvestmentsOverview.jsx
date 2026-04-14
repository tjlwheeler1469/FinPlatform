import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, PieChart, Building2, Wallet, Shield,
  BarChart3, ArrowLeftRight, Landmark, FileText, DollarSign
} from "lucide-react";
import {
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);

// Shared data for consistency across Dashboard and Investments
export const PORTFOLIO_ASSETS = [
  { id: 1, name: "David - AustralianSuper", type: "Super", entity: "Super", value: 245000, change: 8.2 },
  { id: 2, name: "Sarah - REST Super", type: "Super", entity: "Super", value: 198000, change: 7.8 },
  { id: 3, name: "Family Home - Glen Waverley", type: "Property", entity: "Personal", value: 985000, change: 4.1 },
  { id: 4, name: "Investment Unit - Brunswick", type: "Property", entity: "Joint", value: 620000, change: 3.8 },
  { id: 5, name: "Vanguard High Growth ETF", type: "Shares", entity: "Personal", value: 42000, change: 9.5 },
  { id: 6, name: "BHP Group Shares", type: "Shares", entity: "Personal", value: 18500, change: 6.2 },
  { id: 7, name: "CBA Shares (DRP)", type: "Shares", entity: "Joint", value: 24000, change: 11.3 },
  { id: 8, name: "Emergency Fund - ING Savings", type: "Cash", entity: "Personal", value: 28000, change: 4.35 },
  { id: 9, name: "Term Deposit - Westpac 12m", type: "Cash", entity: "Joint", value: 35000, change: 4.65 },
  { id: 10, name: "Colonial First State Balanced", type: "Managed Fund", entity: "Personal", value: 32000, change: 5.8 },
  { id: 11, name: "Bitcoin (Coinbase)", type: "Crypto", entity: "Personal", value: 8500, change: 28.4 },
  { id: 12, name: "Toyota RAV4 Hybrid 2023", type: "Other", entity: "Personal", value: 42000, change: -12.0 },
];

const CHEN_ASSETS = [
  { id: 1, name: "Chen Family Trust - Equities", type: "Trust Portfolio", entity: "Trust", value: 1400000, change: 12.1 },
  { id: 2, name: "Chen Family Trust - Fixed Income", type: "Trust Portfolio", entity: "Trust", value: 900000, change: 5.4 },
  { id: 3, name: "Chen Family Trust - Alternatives", type: "Trust Portfolio", entity: "Trust", value: 500000, change: 8.7 },
  { id: 4, name: "Michael - AMP Super", type: "Super", entity: "Super", value: 720000, change: 9.1 },
  { id: 5, name: "Lisa - Hostplus Super", type: "Super", entity: "Super", value: 480000, change: 8.5 },
  { id: 6, name: "Family Home - Mosman", type: "Property", entity: "Personal", value: 1100000, change: 3.2 },
  { id: 7, name: "Cash Management Account", type: "Cash", entity: "Trust", value: 100000, change: 4.5 },
];

export const PORTFOLIO_LIABILITIES = [
  { id: 1, name: "Home Loan - CBA", type: "Mortgage", value: 285000, rate: 6.19 },
  { id: 2, name: "Investment Loan - ANZ", type: "Mortgage", value: 380000, rate: 6.49 },
  { id: 3, name: "Credit Card - Visa", type: "Credit", value: 4200, rate: 19.99 },
];

export const REBALANCING_DATA = [
  { asset: "Australian Shares", current: 28, target: 25, diff: 3, action: "Sell" },
  { asset: "International Shares", current: 12, target: 20, diff: -8, action: "Buy" },
  { asset: "Property", current: 42, target: 25, diff: 17, action: "Review" },
  { asset: "Bonds/Fixed Income", current: 8, target: 20, diff: -12, action: "Buy" },
  { asset: "Cash", current: 10, target: 10, diff: 0, action: "Hold" },
];

const CHEN_REBALANCING = [
  { asset: "Trust Equities", current: 27, target: 30, diff: -3, action: "Buy" },
  { asset: "Fixed Income", current: 17, target: 20, diff: -3, action: "Buy" },
  { asset: "Property", current: 21, target: 20, diff: 1, action: "Hold" },
  { asset: "Super", current: 23, target: 20, diff: 3, action: "Review" },
  { asset: "Cash", current: 2, target: 5, diff: -3, action: "Buy" },
  { asset: "Alternatives", current: 10, target: 5, diff: 5, action: "Sell" },
];

// Resolve active client for Investments view
const getActiveAssets = () => {
  try {
    const mode = localStorage.getItem('app_mode');
    if (mode === 'adviser') {
      const saved = localStorage.getItem('selected_client');
      if (saved) {
        const c = JSON.parse(saved);
        const id = c?.id || c?.client_id;
        if (id === 'chen_family' || id === 'client_2') return { assets: CHEN_ASSETS, liabilities: [], rebalancing: CHEN_REBALANCING };
      }
    }
  } catch { /* ignore */ }
  return { assets: PORTFOLIO_ASSETS, liabilities: PORTFOLIO_LIABILITIES, rebalancing: REBALANCING_DATA };
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
      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Assets</p>
            <p className="text-xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Liabilities</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
          </CardContent>
        </Card>
        <Card className="border-[#0f1d35]">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Net Worth</p>
            <p className="text-xl font-bold">{formatCurrency(netWorth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Weighted Return</p>
            <p className={`text-xl font-bold ${Number(weightedReturn) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {Number(weightedReturn) >= 0 ? "+" : ""}{weightedReturn}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Holdings</p>
            <p className="text-xl font-bold">{activeAssets.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Asset Allocation Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PieChart className="h-4 w-4 text-blue-500" /> Asset Allocation
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-purple-500" /> Holdings by Entity
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowLeftRight className="h-4 w-4 text-amber-500" /> Portfolio Rebalancing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeRebalancing.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg" data-testid={`rebalance-row-${i}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-sm w-40">{item.asset}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Current: {item.current}%</span>
                      <span className="text-muted-foreground">-></span>
                      <span className="font-medium">Target: {item.target}%</span>
                    </div>
                  </div>
                  <Badge className={
                    item.action === "Buy" ? "bg-green-500" : item.action === "Sell" ? "bg-red-500" : "bg-gray-500"
                  }>
                    {item.action} {Math.abs(item.diff)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spider / Radar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-[#1a2744]" /> Allocation Radar
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-[#D4A84C]" /> Top Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...activeAssets].sort((a, b) => b.value - a.value).slice(0, 6).map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                    asset.type === "Shares" ? "bg-blue-100 text-blue-600" :
                    asset.type === "Property" ? "bg-purple-100 text-purple-600" :
                    asset.type === "Super" ? "bg-green-100 text-green-600" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {asset.type === "Shares" ? <TrendingUp className="h-4 w-4" /> :
                     asset.type === "Property" ? <Building2 className="h-4 w-4" /> :
                     asset.type === "Super" ? <Shield className="h-4 w-4" /> :
                     <Wallet className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{asset.name}</p>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-1">{asset.type}</Badge>
                      <Badge variant="secondary" className="text-[10px] px-1">{asset.entity}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(asset.value)}</p>
                  <p className={`text-xs ${asset.change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
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
