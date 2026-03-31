import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChartContainer from "@/components/ChartContainer";
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Info
} from "lucide-react";
import { usePortfolio } from "@/App";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

// Simulated benchmark data (in real app, this would come from an API)
const generateHistoricalData = (shares, months = 12) => {
  const data = [];
  const today = new Date();
  
  // Calculate current portfolio value
  const currentValue = shares.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
  const costBase = shares.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  
  // Generate historical performance with some variance
  for (let i = months; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    
    // Simulate portfolio growth with volatility
    const monthsFromStart = months - i;
    const portfolioGrowthRate = ((currentValue - costBase) / costBase) / months;
    const randomVariance = (Math.random() - 0.5) * 0.03;
    const portfolioValue = costBase * (1 + (portfolioGrowthRate * monthsFromStart) + randomVariance);
    
    // Benchmark indices (simulated)
    const asx200Base = 7500;
    const sp500Base = 4500;
    
    // ASX 200 - ~8% annual return with volatility
    const asx200Growth = 0.08 / 12;
    const asx200Value = asx200Base * (1 + (asx200Growth * monthsFromStart) + (Math.random() - 0.5) * 0.02);
    
    // S&P 500 - ~10% annual return with volatility
    const sp500Growth = 0.10 / 12;
    const sp500Value = sp500Base * (1 + (sp500Growth * monthsFromStart) + (Math.random() - 0.5) * 0.025);
    
    data.push({
      date: date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
      portfolio: Math.round(portfolioValue),
      portfolioReturn: ((portfolioValue - costBase) / costBase) * 100,
      asx200: Math.round(asx200Value),
      asx200Return: ((asx200Value - asx200Base) / asx200Base) * 100,
      sp500: Math.round(sp500Value),
      sp500Return: ((sp500Value - sp500Base) / sp500Base) * 100
    });
  }
  
  return data;
};

const COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const HoldingsPerformance = () => {
  const { sharePortfolio, getPortfolioValueByOwnership, getDividendsByOwnership, familyMembers, company } = usePortfolio();
  const [timeRange, setTimeRange] = useState("12m");
  const [benchmark, setBenchmark] = useState("asx200");

  // Calculate portfolio metrics
  const portfolioValues = getPortfolioValueByOwnership();
  const dividends = getDividendsByOwnership();
  
  const totalValue = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
  const totalCostBase = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.purchasePrice), 0);
  const totalGainLoss = totalValue - totalCostBase;
  const totalReturn = totalCostBase > 0 ? (totalGainLoss / totalCostBase) * 100 : 0;
  
  const totalDividendIncome = sharePortfolio.reduce((sum, s) => 
    sum + (s.quantity * s.currentPrice * (s.dividendYield / 100)), 0
  );
  const dividendYield = totalValue > 0 ? (totalDividendIncome / totalValue) * 100 : 0;
  
  // Total return including dividends (simplified annual)
  const totalReturnWithDividends = totalReturn + dividendYield;

  // Generate historical data based on time range
  const MONTH_MAP = { "3m": 3, "6m": 6, "1y": 12 };
  const months = MONTH_MAP[timeRange] || 24;
  const historicalData = useMemo(() => generateHistoricalData(sharePortfolio, months), [sharePortfolio, months]);

  // Sector allocation data
  const sectorData = useMemo(() => {
    const sectors = {};
    sharePortfolio.forEach(share => {
      const sector = share.sector || 'Other';
      const value = share.quantity * share.currentPrice;
      sectors[sector] = (sectors[sector] || 0) + value;
    });
    return Object.entries(sectors).map(([name, value], i) => ({
      name,
      value,
      percentage: (value / totalValue) * 100,
      color: COLORS[i % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [sharePortfolio, totalValue]);

  // Individual stock performance
  const stockPerformance = useMemo(() => {
    return sharePortfolio.map(share => {
      const value = share.quantity * share.currentPrice;
      const costBase = share.quantity * share.purchasePrice;
      const gainLoss = value - costBase;
      const returnPct = costBase > 0 ? (gainLoss / costBase) * 100 : 0;
      const annualDividend = value * (share.dividendYield / 100);
      
      return {
        ...share,
        value,
        costBase,
        gainLoss,
        returnPct,
        annualDividend,
        totalReturn: returnPct + share.dividendYield,
        weight: (value / totalValue) * 100
      };
    }).sort((a, b) => b.value - a.value);
  }, [sharePortfolio, totalValue]);

  // Best and worst performers
  const bestPerformer = stockPerformance.reduce((best, s) => s.returnPct > best.returnPct ? s : best, stockPerformance[0]);
  const worstPerformer = stockPerformance.reduce((worst, s) => s.returnPct < worst.returnPct ? s : worst, stockPerformance[0]);

  // Benchmark comparison
  const latestData = historicalData[historicalData.length - 1];
  const benchmarkReturn = benchmark === "asx200" ? latestData?.asx200Return : latestData?.sp500Return;
  const outperformance = totalReturn - (benchmarkReturn || 0);

  return (
    <Layout>
      <div className="space-y-6" data-testid="holdings-performance-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Holdings Performance
            </h1>
            <p className="text-muted-foreground mt-1">
              Track portfolio performance vs market benchmarks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="2y">2 Years</SelectItem>
              </SelectContent>
            </Select>
            <Select value={benchmark} onValueChange={setBenchmark}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asx200">ASX 200</SelectItem>
                <SelectItem value="sp500">S&P 500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-[#1a2744] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/70">Total Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
              <p className="text-xs text-white/60">{sharePortfolio.length} holdings</p>
            </CardContent>
          </Card>
          <Card className={totalGainLoss >= 0 ? "bg-[#10B981]/10 border-[#10B981]" : "bg-destructive/10 border-destructive"}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Capital Gain/Loss</p>
              <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                {formatCurrency(totalGainLoss)}
              </p>
              <p className={`text-xs ${totalGainLoss >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                {formatPercent(totalReturn)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#D4A84C]/10 border-[#D4A84C]">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Annual Dividends</p>
              <p className="text-2xl font-bold text-[#D4A84C]">{formatCurrency(totalDividendIncome)}</p>
              <p className="text-xs text-[#D4A84C]">{dividendYield.toFixed(2)}% yield</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Return</p>
              <p className={`text-2xl font-bold ${totalReturnWithDividends >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                {formatPercent(totalReturnWithDividends)}
              </p>
              <p className="text-xs text-muted-foreground">Capital + Dividends</p>
            </CardContent>
          </Card>
          <Card className={outperformance >= 0 ? "bg-[#10B981]/10" : "bg-amber-50"}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">vs {benchmark === "asx200" ? "ASX 200" : "S&P 500"}</p>
              <p className={`text-2xl font-bold ${outperformance >= 0 ? 'text-[#10B981]' : 'text-amber-600'}`}>
                {formatPercent(outperformance)}
              </p>
              <p className="text-xs text-muted-foreground">
                {outperformance >= 0 ? 'Outperforming' : 'Underperforming'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance vs Benchmark</CardTitle>
            <CardDescription>Portfolio returns compared to {benchmark === "asx200" ? "ASX 200" : "S&P 500"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={350}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    tickFormatter={(v) => `${v.toFixed(0)}%`} 
                    stroke="hsl(var(--muted-foreground))"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    formatter={(v, name) => [`${v.toFixed(2)}%`, name]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="portfolioReturn" 
                    name="Portfolio" 
                    stroke="#1a2744" 
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={`${benchmark}Return`} 
                    name={benchmark === "asx200" ? "ASX 200" : "S&P 500"} 
                    stroke="#D4A84C" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sector Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Sector Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer height={200}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RechartsPie>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`item-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </RechartsPie>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-2 mt-4">
                {sectorData.slice(0, 5).map((sector, i) => (
                  <div key={`item-${i}`} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                      <span className="truncate max-w-[120px]">{sector.name}</span>
                    </div>
                    <span className="font-medium">{sector.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top & Bottom Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Best & Worst Performers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bestPerformer && (
                <div className="p-3 rounded-lg bg-[#10B981]/10 border border-[#10B981]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-5 w-5 text-[#10B981]" />
                      <div>
                        <p className="font-semibold">{bestPerformer.symbol}</p>
                        <p className="text-xs text-muted-foreground">{bestPerformer.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#10B981]">{formatPercent(bestPerformer.returnPct)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(bestPerformer.gainLoss)}</p>
                    </div>
                  </div>
                </div>
              )}
              {worstPerformer && worstPerformer.symbol !== bestPerformer?.symbol && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="font-semibold">{worstPerformer.symbol}</p>
                        <p className="text-xs text-muted-foreground">{worstPerformer.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-destructive">{formatPercent(worstPerformer.returnPct)}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(worstPerformer.gainLoss)}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Dividend Champions */}
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2 text-[#D4A84C]">Top Dividend Payers</p>
                {stockPerformance
                  .sort((a, b) => b.dividendYield - a.dividendYield)
                  .slice(0, 3)
                  .map((stock, i) => (
                    <div key={`item-${i}`} className="flex justify-between text-sm py-1">
                      <span>{stock.symbol}</span>
                      <span className="font-medium">{stock.dividendYield.toFixed(1)}% yield</span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>

          {/* Risk Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Portfolio Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Holdings</p>
                  <p className="text-xl font-bold">{sharePortfolio.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Sectors</p>
                  <p className="text-xl font-bold">{sectorData.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Avg Dividend</p>
                  <p className="text-xl font-bold">{dividendYield.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Top Holding</p>
                  <p className="text-xl font-bold">{stockPerformance[0]?.weight.toFixed(0)}%</p>
                </div>
              </div>

              <div className="p-3 rounded-lg border">
                <p className="text-sm font-medium mb-2">Concentration Risk</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Top 3 holdings</span>
                    <span className="font-medium">
                      {stockPerformance.slice(0, 3).reduce((sum, s) => sum + s.weight, 0).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Largest sector</span>
                    <span className="font-medium">{sectorData[0]?.percentage.toFixed(0)}%</span>
                  </div>
                </div>
                {stockPerformance[0]?.weight > 25 && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ Consider diversifying - largest holding is over 25%
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Holdings Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3">Symbol</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-right p-3">Value</th>
                    <th className="text-right p-3">Weight</th>
                    <th className="text-right p-3">Gain/Loss</th>
                    <th className="text-right p-3">Return</th>
                    <th className="text-right p-3">Div Yield</th>
                    <th className="text-right p-3">Total Return</th>
                  </tr>
                </thead>
                <tbody>
                  {stockPerformance.map((stock, i) => (
                    <tr key={`item-${i}`} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-semibold">{stock.symbol}</td>
                      <td className="p-3 text-muted-foreground">{stock.name}</td>
                      <td className="text-right p-3">{formatCurrency(stock.value)}</td>
                      <td className="text-right p-3">{stock.weight.toFixed(1)}%</td>
                      <td className={`text-right p-3 ${stock.gainLoss >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                        {formatCurrency(stock.gainLoss)}
                      </td>
                      <td className={`text-right p-3 font-medium ${stock.returnPct >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                        {formatPercent(stock.returnPct)}
                      </td>
                      <td className="text-right p-3 text-[#D4A84C]">{stock.dividendYield.toFixed(1)}%</td>
                      <td className={`text-right p-3 font-bold ${stock.totalReturn >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                        {formatPercent(stock.totalReturn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Performance Data Note</p>
                <p>
                  Historical performance data shown is simulated for demonstration purposes based on 
                  current holdings. Benchmark returns (ASX 200, S&P 500) are approximated. Past 
                  performance is not indicative of future results. Always consult official sources 
                  for actual benchmark data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HoldingsPerformance;
