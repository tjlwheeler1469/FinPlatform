import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from "lucide-react";
import { usePortfolio } from "@/App";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatCompact = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

// Generate historical net worth data (simulated for demo)
// Uses a seeded approach so the last point always equals currentNetWorth
const generateHistoricalData = (currentNetWorth, months = 24) => {
  const data = [];
  const now = new Date();
  const debtRatio = 669200 / 2278000; // liabilities / assets ratio

  // Build path backward from current value
  // Start from ~75% and interpolate, ensuring last point = currentNetWorth
  const startValue = currentNetWorth * 0.75;

  // Use a seeded random to get consistent values per session
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Generate raw growth factors
  const rawFactors = [];
  for (let i = 0; i < months; i++) {
    rawFactors.push(0.005 + seededRandom() * 0.015 + (seededRandom() - 0.5) * 0.02);
  }

  // Calculate what the raw path gives us
  let rawEnd = startValue;
  for (const f of rawFactors) rawEnd *= (1 + f);

  // Scale factors so the path lands exactly on currentNetWorth
  const scaleFactor = Math.log(currentNetWorth / startValue) / Math.log(rawEnd / startValue);

  let nw = startValue;
  for (let i = months; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const idx = months - i;

    if (idx > 0) {
      const adjustedRate = rawFactors[idx - 1] * scaleFactor;
      nw = nw * (1 + adjustedRate);
    }
    // Force last point to exact value
    if (i === 0) nw = currentNetWorth;

    const assets = nw / (1 - debtRatio);
    const liabilities = assets - nw;

    data.push({
      date: date.toISOString().slice(0, 7),
      month: date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
      netWorth: Math.round(nw),
      assets: Math.round(assets),
      liabilities: Math.round(liabilities)
    });
  }

  return data;
};

const NetWorthTrend = ({ embedded = false, netWorthOverride }) => {
  const { portfolio } = usePortfolio();
  const baseNetWorth = netWorthOverride || portfolio.summary.netWorth || 1608800;
  const [timeRange, setTimeRange] = useState("24");
  const [chartType, setChartType] = useState("area");
  const [historicalData, setHistoricalData] = useState([]);

  useEffect(() => {
    const data = generateHistoricalData(baseNetWorth, parseInt(timeRange));
    setHistoricalData(data);
  }, [baseNetWorth, timeRange]);

  // Calculate stats
  const currentNetWorth = historicalData[historicalData.length - 1]?.netWorth || 0;
  const startNetWorth = historicalData[0]?.netWorth || 0;
  const absoluteChange = currentNetWorth - startNetWorth;
  const percentChange = startNetWorth > 0 ? ((absoluteChange / startNetWorth) * 100) : 0;
  
  // Calculate monthly average growth
  const monthlyGrowthRates = historicalData.slice(1).map((d, i) => {
    const prev = historicalData[i].netWorth;
    return prev > 0 ? ((d.netWorth - prev) / prev) * 100 : 0;
  });
  const avgMonthlyGrowth = monthlyGrowthRates.reduce((a, b) => a + b, 0) / monthlyGrowthRates.length;

  // Find best and worst months
  const bestMonth = historicalData.reduce((best, curr, i) => {
    if (i === 0) return best;
    const growth = curr.netWorth - historicalData[i-1].netWorth;
    return growth > best.growth ? { month: curr.month, growth } : best;
  }, { month: '', growth: -Infinity });

  const worstMonth = historicalData.reduce((worst, curr, i) => {
    if (i === 0) return worst;
    const growth = curr.netWorth - historicalData[i-1].netWorth;
    return growth < worst.growth ? { month: curr.month, growth } : worst;
  }, { month: '', growth: Infinity });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-bold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const content = (
    <>
      <div className="space-y-6" data-testid="net-worth-trend-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-[#D4A84C]" />
              Net Worth Trend
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your wealth over time
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">1 Year</SelectItem>
                <SelectItem value="24">2 Years</SelectItem>
                <SelectItem value="60">5 Years</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-[#1a2744] bg-[#1a2744]/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Current Net Worth</p>
              <p className="text-3xl font-bold text-[#1a2744]" data-testid="current-net-worth">
                {formatCurrency(currentNetWorth)}
              </p>
            </CardContent>
          </Card>
          <Card className={`border-2 ${absoluteChange >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Change ({timeRange}m)</p>
              <div className="flex items-center gap-2">
                {absoluteChange >= 0 ? (
                  <ArrowUp className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-red-600" />
                )}
                <p className={`text-2xl font-bold ${absoluteChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(absoluteChange))}
                </p>
              </div>
              <p className={`text-sm ${absoluteChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {absoluteChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg Monthly Growth</p>
              <p className={`text-2xl font-bold ${avgMonthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {avgMonthlyGrowth >= 0 ? '+' : ''}{avgMonthlyGrowth.toFixed(2)}%
              </p>
              <p className="text-sm text-muted-foreground">per month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Starting Value</p>
              <p className="text-2xl font-bold">
                {formatCurrency(startNetWorth)}
              </p>
              <p className="text-sm text-muted-foreground">{historicalData[0]?.month}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Net Worth Over Time</CardTitle>
            <CardDescription>
              Assets, liabilities, and net worth progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={400}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                {chartType === "area" ? (
                  <AreaChart data={historicalData}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="assetsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="assets"
                      name="Total Assets"
                      stroke="#10B981"
                      fill="url(#assetsGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      name="Net Worth"
                      stroke="#1a2744"
                      fill="url(#netWorthGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="assets" name="Total Assets" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="liabilities" name="Liabilities" stroke="#EF4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="netWorth" name="Net Worth" stroke="#1a2744" strokeWidth={3} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Performance Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Best Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                +{formatCurrency(bestMonth.growth)}
              </p>
              <p className="text-muted-foreground">{bestMonth.month}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Worst Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(worstMonth.growth)}
              </p>
              <p className="text-muted-foreground">{worstMonth.month}</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">About Net Worth Tracking</p>
                <p className="text-sm text-blue-700 mt-1">
                  Your net worth is calculated as Total Assets minus Total Liabilities. 
                  Tracking it over time helps you understand if you're building wealth effectively. 
                  Historical data shown is simulated based on your current position - connect 
                  your accounts for accurate historical tracking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default NetWorthTrend;
