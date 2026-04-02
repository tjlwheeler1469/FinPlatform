import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Scale,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowRight,
  ArrowUpDown,
  DollarSign,
  Percent,
  RefreshCw,
  Target,
  Shield,
  Calculator,
  Download
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => {
  return `${value.toFixed(1)}%`;
};

const COLORS = ['#1a2744', '#D4A84C', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

// Risk profile target allocations
const RISK_PROFILES = {
  conservative: {
    name: "Conservative",
    description: "Capital preservation focus",
    targets: {
      cash: 30,
      bonds: 40,
      property: 15,
      australian_shares: 10,
      international_shares: 5
    }
  },
  moderately_conservative: {
    name: "Moderately Conservative",
    description: "Income with some growth",
    targets: {
      cash: 20,
      bonds: 30,
      property: 20,
      australian_shares: 20,
      international_shares: 10
    }
  },
  balanced: {
    name: "Balanced",
    description: "Mix of income and growth",
    targets: {
      cash: 10,
      bonds: 20,
      property: 25,
      australian_shares: 30,
      international_shares: 15
    }
  },
  growth: {
    name: "Growth",
    description: "Growth focus with some income",
    targets: {
      cash: 5,
      bonds: 10,
      property: 20,
      australian_shares: 40,
      international_shares: 25
    }
  },
  high_growth: {
    name: "High Growth",
    description: "Maximum growth potential",
    targets: {
      cash: 5,
      bonds: 5,
      property: 15,
      australian_shares: 45,
      international_shares: 30
    }
  }
};

const PortfolioRebalancing = ({ embedded = false }) => {
  const { sharePortfolio, properties, familyMembers, budget } = usePortfolio();
  
  const [selectedProfile, setSelectedProfile] = useState("balanced");
  const [customTargets, setCustomTargets] = useState({
    cash: 10,
    bonds: 20,
    property: 25,
    australian_shares: 30,
    international_shares: 15
  });
  const [useCustomTargets, setUseCustomTargets] = useState(false);
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5);
  const [taxConsideration, setTaxConsideration] = useState(true);
  const [includeSuper, setIncludeSuper] = useState(true);

  // Calculate current portfolio allocation
  const calculateCurrentAllocation = useCallback(() => {
    // Cash from budget/savings
    const cashValue = (budget?.income?.savings || 0) * 12 + 75000; // Base cash holdings
    
    // Bonds (mock - would come from actual holdings)
    const bondsValue = 80000;
    
    // Property
    const propertyValue = properties?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
    const propertyEquity = properties?.reduce((sum, p) => sum + (p.value - (p.mortgage || 0)), 0) || 650000;
    
    // Australian Shares
    const ausSharesValue = sharePortfolio?.filter(s => !s.sector?.includes('International'))
      .reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) || 320000;
    
    // International (ETFs and international shares)
    const intlSharesValue = sharePortfolio?.filter(s => s.sector?.includes('International') || s.symbol?.includes('VGS'))
      .reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) || 145000;
    
    // Super
    const superValue = includeSuper ? (familyMembers?.[0]?.superBalance || 580000) : 0;
    
    const totalValue = cashValue + bondsValue + propertyEquity + ausSharesValue + intlSharesValue + superValue;
    
    return {
      cash: { value: cashValue, percent: (cashValue / totalValue) * 100 },
      bonds: { value: bondsValue, percent: (bondsValue / totalValue) * 100 },
      property: { value: propertyEquity, percent: (propertyEquity / totalValue) * 100 },
      australian_shares: { value: ausSharesValue, percent: (ausSharesValue / totalValue) * 100 },
      international_shares: { value: intlSharesValue, percent: (intlSharesValue / totalValue) * 100 },
      super: { value: superValue, percent: (superValue / totalValue) * 100 },
      total: totalValue
    };
  }, [sharePortfolio, properties, familyMembers, budget, includeSuper]);

  const [currentAllocation, setCurrentAllocation] = useState(calculateCurrentAllocation());

  useEffect(() => {
    setCurrentAllocation(calculateCurrentAllocation());
  }, [calculateCurrentAllocation]);

  // Get target allocation
  const getTargetAllocation = () => {
    if (useCustomTargets) return customTargets;
    return RISK_PROFILES[selectedProfile].targets;
  };

  const targets = getTargetAllocation();

  // Calculate drift from targets
  const calculateDrift = () => {
    const drifts = [];
    
    Object.keys(targets).forEach(assetClass => {
      const current = currentAllocation[assetClass]?.percent || 0;
      const target = targets[assetClass] || 0;
      const drift = current - target;
      const needsRebalance = Math.abs(drift) > rebalanceThreshold;
      
      drifts.push({
        assetClass,
        name: assetClass.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        current: current,
        target: target,
        drift: drift,
        needsRebalance: needsRebalance,
        action: drift > 0 ? "Reduce" : drift < 0 ? "Increase" : "Hold",
        amountToTrade: Math.abs(drift / 100 * currentAllocation.total)
      });
    });
    
    return drifts;
  };

  const driftAnalysis = calculateDrift();
  const needsRebalancing = driftAnalysis.some(d => d.needsRebalance);
  const totalDrift = driftAnalysis.reduce((sum, d) => sum + Math.abs(d.drift), 0);

  // Generate rebalancing trades
  const generateTrades = () => {
    const trades = [];
    
    driftAnalysis.filter(d => d.needsRebalance).forEach(drift => {
      // Estimate tax impact for sells
      let taxImpact = 0;
      if (drift.action === "Reduce" && taxConsideration) {
        // Assume 20% unrealized gain and 30% marginal tax rate with 50% CGT discount
        taxImpact = drift.amountToTrade * 0.2 * 0.3 * 0.5;
      }
      
      trades.push({
        assetClass: drift.name,
        action: drift.action,
        amount: drift.amountToTrade,
        percentChange: drift.drift,
        taxImpact: taxImpact,
        netAmount: drift.amountToTrade - taxImpact
      });
    });
    
    return trades;
  };

  const suggestedTrades = generateTrades();

  // Pie chart data
  const currentPieData = Object.entries(currentAllocation)
    .filter(([key]) => key !== 'total' && key !== 'super')
    .map(([key, val], index) => ({
      name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: val.percent,
      color: COLORS[index % COLORS.length]
    }));

  const targetPieData = Object.entries(targets).map(([key, val], index) => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: val,
    color: COLORS[index % COLORS.length]
  }));

  // Bar chart data for comparison
  const comparisonData = Object.keys(targets).map(key => ({
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()).split(' ')[0],
    current: currentAllocation[key]?.percent || 0,
    target: targets[key] || 0
  }));

  // Radar chart data
  const radarData = Object.keys(targets).map(key => ({
    subject: key.replace('_', ' ').split(' ')[0],
    current: currentAllocation[key]?.percent || 0,
    target: targets[key] || 0,
    fullMark: 50
  }));

  // Export rebalancing plan
  const exportPlan = () => {
    const plan = {
      date: new Date().toISOString(),
      profile: useCustomTargets ? "Custom" : RISK_PROFILES[selectedProfile].name,
      currentValue: currentAllocation.total,
      trades: suggestedTrades,
      threshold: rebalanceThreshold,
      taxConsideration: taxConsideration
    };
    
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebalancing_plan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success("Rebalancing plan exported");
  };

  const content = (
      <div className="space-y-6" data-testid="portfolio-rebalancing-page">
        {/* Header */}
        {!embedded && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground flex items-center gap-2">
              <Scale className="h-8 w-8 text-[#D4A84C]" />
              Portfolio Rebalancing
            </h1>
            <p className="text-muted-foreground mt-1">
              Analyze and optimize your asset allocation
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportPlan} data-testid="export-plan-btn">
              <Download className="h-4 w-4 mr-2" /> Export Plan
            </Button>
          </div>
        </div>
        )}

        {/* Alert Banner */}
        {needsRebalancing ? (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-800">Rebalancing Recommended</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your portfolio has drifted {totalDrift.toFixed(1)}% from target allocation. 
              Consider rebalancing to maintain your risk profile.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800">Portfolio Balanced</AlertTitle>
            <AlertDescription className="text-green-700">
              Your portfolio is within the {rebalanceThreshold}% threshold of your target allocation.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#1a2744] text-white">
            <CardContent className="p-4">
              <p className="text-sm text-white/80">Total Portfolio</p>
              <p className="text-2xl font-bold">{formatCurrency(currentAllocation.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Risk Profile</p>
              <p className="text-xl font-bold">{useCustomTargets ? "Custom" : RISK_PROFILES[selectedProfile].name}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Drift</p>
              <p className={`text-2xl font-bold ${totalDrift > rebalanceThreshold ? 'text-amber-600' : 'text-green-600'}`}>
                {formatPercent(totalDrift)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Trades Suggested</p>
              <p className="text-2xl font-bold text-[#D4A84C]">{suggestedTrades.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analysis" data-testid="tab-analysis">Analysis</TabsTrigger>
            <TabsTrigger value="targets" data-testid="tab-targets">Target Allocation</TabsTrigger>
            <TabsTrigger value="trades" data-testid="tab-trades">Rebalancing Trades</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current vs Target Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current vs Target Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={300}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={comparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" domain={[0, 50]} unit="%" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(v) => formatPercent(v)} />
                        <Legend />
                        <Bar dataKey="current" fill="#1a2744" name="Current" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="target" fill="#D4A84C" name="Target" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Allocation Radar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={300}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 50]} />
                        <Radar name="Current" dataKey="current" stroke="#1a2744" fill="#1a2744" fillOpacity={0.5} />
                        <Radar name="Target" dataKey="target" stroke="#D4A84C" fill="#D4A84C" fillOpacity={0.3} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Drift Analysis Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Drift Analysis</CardTitle>
                <CardDescription>Comparison of current allocation vs target by asset class</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {driftAnalysis.map((item, index) => (
                    <div 
                      key={item.assetClass}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        item.needsRebalance ? 'border-amber-200 bg-amber-50/50' : 'bg-muted/30'
                      }`}
                      data-testid={`drift-${item.assetClass}`}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-3 h-10 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(currentAllocation[item.assetClass]?.value || 0)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-semibold">{formatPercent(item.current)}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-semibold">{formatPercent(item.target)}</p>
                        </div>
                        <div className="text-center w-24">
                          <p className="text-muted-foreground">Drift</p>
                          <p className={`font-bold ${
                            item.drift > 0 ? 'text-red-600' : item.drift < 0 ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {item.drift > 0 ? '+' : ''}{formatPercent(item.drift)}
                          </p>
                        </div>
                        <div className="w-20">
                          {item.needsRebalance ? (
                            <Badge className={item.action === "Reduce" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                              {item.action}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">Hold</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Target Allocation Tab */}
          <TabsContent value="targets" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Selection */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#D4A84C]" />
                    Target Allocation Profile
                  </CardTitle>
                  <CardDescription>Select a risk profile or customize your allocation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Use Custom Targets</p>
                      <p className="text-sm text-muted-foreground">Override risk profile with custom allocation</p>
                    </div>
                    <Switch 
                      checked={useCustomTargets}
                      onCheckedChange={setUseCustomTargets}
                      data-testid="use-custom-targets"
                    />
                  </div>
                  
                  {!useCustomTargets && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(RISK_PROFILES).map(([key, profile]) => (
                        <div
                          key={key}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedProfile === key ? 'border-[#1a2744] bg-[#1a2744]/5' : 'hover:border-muted-foreground'
                          }`}
                          onClick={() => setSelectedProfile(key)}
                          data-testid={`profile-${key}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">{profile.name}</p>
                            {selectedProfile === key && (
                              <CheckCircle className="h-5 w-5 text-[#1a2744]" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{profile.description}</p>
                          <div className="flex gap-1">
                            {Object.entries(profile.targets).map(([asset, pct], i) => (
                              <div 
                                key={asset}
                                className="h-2 rounded-full"
                                style={{ 
                                  backgroundColor: COLORS[i % COLORS.length],
                                  width: `${pct}%`
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {useCustomTargets && (
                    <div className="space-y-4">
                      {Object.entries(customTargets).map(([asset, value], index) => (
                        <div key={asset} className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              {asset.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Label>
                            <span className="font-semibold">{value}%</span>
                          </div>
                          <Slider
                            value={[value]}
                            onValueChange={(v) => {
                              const newTargets = { ...customTargets, [asset]: v[0] };
                              // Normalize to 100%
                              const total = Object.values(newTargets).reduce((a, b) => a + b, 0);
                              if (total > 100) {
                                newTargets[asset] = v[0] - (total - 100);
                              }
                              setCustomTargets(newTargets);
                            }}
                            max={60}
                            step={1}
                          />
                        </div>
                      ))}
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <p className="text-sm">Total: {Object.values(customTargets).reduce((a, b) => a + b, 0)}%</p>
                        {Object.values(customTargets).reduce((a, b) => a + b, 0) !== 100 && (
                          <p className="text-xs text-amber-600">Adjust to total 100%</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Target Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Target Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={250}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <RechartsPie>
                        <Pie
                          data={targetPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${value}%`}
                        >
                          {targetPieData.map((entry, index) => (
                            <Cell key={`item-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatPercent(v)} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="space-y-2 mt-2">
                    {targetPieData.map((item, index) => (
                      <div key={item.name} className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{formatPercent(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-[#D4A84C]" />
                  Suggested Rebalancing Trades
                </CardTitle>
                <CardDescription>
                  These trades would bring your portfolio back to target allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {suggestedTrades.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">No trades needed</p>
                    <p className="text-sm">Your portfolio is within the rebalancing threshold</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestedTrades.map((trade, index) => (
                      <div 
                        key={`item-${index}`}
                        className={`p-4 rounded-lg border ${
                          trade.action === "Reduce" ? 'border-red-200 bg-red-50/50' : 'border-blue-200 bg-blue-50/50'
                        }`}
                        data-testid={`trade-${index}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              trade.action === "Reduce" ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              {trade.action === "Reduce" ? (
                                <TrendingDown className={`h-6 w-6 text-red-600`} />
                              ) : (
                                <TrendingUp className={`h-6 w-6 text-blue-600`} />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{trade.action} {trade.assetClass}</p>
                              <p className="text-sm text-muted-foreground">
                                Drift: {trade.percentChange > 0 ? '+' : ''}{formatPercent(trade.percentChange)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatCurrency(trade.amount)}</p>
                            {trade.taxImpact > 0 && (
                              <p className="text-sm text-amber-600">
                                Est. CGT: {formatCurrency(trade.taxImpact)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Summary */}
                    <div className="p-4 bg-muted rounded-lg mt-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Total to Sell</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(suggestedTrades.filter(t => t.action === "Reduce").reduce((s, t) => s + t.amount, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total to Buy</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(suggestedTrades.filter(t => t.action === "Increase").reduce((s, t) => s + t.amount, 0))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Est. Tax Impact</p>
                          <p className="text-lg font-bold text-amber-600">
                            {formatCurrency(suggestedTrades.reduce((s, t) => s + t.taxImpact, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tax Considerations */}
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Tax Considerations</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Selling assets may trigger Capital Gains Tax. Consider holding assets for 12+ months to receive the 50% CGT discount. 
                      Consult with your tax advisor before making significant portfolio changes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#D4A84C]" />
                  Rebalancing Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Rebalancing Threshold</Label>
                    <span className="font-semibold">{rebalanceThreshold}%</span>
                  </div>
                  <Slider
                    value={[rebalanceThreshold]}
                    onValueChange={(v) => setRebalanceThreshold(v[0])}
                    min={1}
                    max={15}
                    step={1}
                    data-testid="rebalance-threshold-slider"
                  />
                  <p className="text-xs text-muted-foreground">
                    Rebalancing will be suggested when any asset class drifts more than {rebalanceThreshold}% from target
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Include Superannuation</p>
                    <p className="text-sm text-muted-foreground">Include super balance in total portfolio calculation</p>
                  </div>
                  <Switch 
                    checked={includeSuper}
                    onCheckedChange={setIncludeSuper}
                    data-testid="include-super-switch"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Tax-Aware Rebalancing</p>
                    <p className="text-sm text-muted-foreground">Estimate CGT impact on suggested trades</p>
                  </div>
                  <Switch 
                    checked={taxConsideration}
                    onCheckedChange={setTaxConsideration}
                    data-testid="tax-aware-switch"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#D4A84C]" />
                  Risk Profile Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-3 border rounded-lg">
                    <p className="font-semibold text-green-600">Conservative</p>
                    <p className="text-muted-foreground">Best for: Short timeframe (1-3 years), low risk tolerance, capital preservation focus</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-semibold text-blue-600">Balanced</p>
                    <p className="text-muted-foreground">Best for: Medium timeframe (5-7 years), moderate risk tolerance, income and growth</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-semibold text-purple-600">Growth</p>
                    <p className="text-muted-foreground">Best for: Long timeframe (7-10+ years), higher risk tolerance, wealth accumulation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );

  const wrapper = embedded ? content : <Layout>{content}</Layout>;
  return wrapper;
};

export default PortfolioRebalancing;
