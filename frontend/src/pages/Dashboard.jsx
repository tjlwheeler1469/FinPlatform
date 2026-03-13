import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  PiggyBank, 
  Calculator,
  ArrowRight,
  BarChart3,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Target,
  Shield,
  CreditCard,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  Zap,
  GraduationCap,
  Plane,
  Home,
  Heart,
  Activity,
  ChevronRight,
  Wallet,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowUpRight,
  DollarSign,
  LineChart,
  Info
} from "lucide-react";
import { usePortfolio } from "@/App";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart as RechartsLineChart,
  Line
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatCompact = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

// Sample goals data
const GOALS_DATA = [
  { id: 1, name: "Retirement at 60", target: 3500000, current: 2520000, progress: 72, icon: "retirement", onTrack: true },
  { id: 2, name: "Kids Education Fund", target: 200000, current: 182000, progress: 91, icon: "education", onTrack: true },
  { id: 3, name: "House Upgrade", target: 500000, current: 245000, progress: 49, icon: "house", onTrack: false },
  { id: 4, name: "Europe Trip 2026", target: 35000, current: 28000, progress: 80, icon: "travel", onTrack: true }
];

// Default What-If parameters
const DEFAULT_WHATIF = {
  savingsRate: 15,
  marketReturn: 7,
  retirementAge: 60,
  inflationRate: 3
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { portfolio } = usePortfolio();
  const [healthScore, setHealthScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [netWorthProjection, setNetWorthProjection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // What-If Toggle State
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfParams, setWhatIfParams] = useState(DEFAULT_WHATIF);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requestData = {
          age: 45,
          retirement_age: whatIfParams.retirementAge,
          current_income: portfolio.personal.taxableIncome,
          annual_expenses: 120000,
          total_assets: portfolio.summary.totalAssets,
          total_debt: portfolio.summary.totalDebt,
          super_balance: portfolio.investments.smsf_balance,
          emergency_fund: 75000,
          investment_portfolio: portfolio.investments.shares_value + portfolio.investments.etf_value,
          property_value: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0),
          savings_rate: whatIfParams.savingsRate / 100,
          mortgage_rate: 6.5,
          mortgage_balance: portfolio.summary.totalDebt
        };

        const [healthRes, recsRes, projectionRes] = await Promise.all([
          axios.post(`${API}/decision-engine/health-score-v2`, requestData),
          axios.post(`${API}/decision-engine/recommendations-v2`, requestData),
          axios.get(`${API}/decision-engine/net-worth-projection`, {
            params: {
              current_net_worth: portfolio.summary.netWorth,
              annual_savings: portfolio.personal.taxableIncome * (whatIfParams.savingsRate / 100),
              years: 20,
              growth_rate: whatIfParams.marketReturn / 100
            }
          })
        ]);
        
        setHealthScore(healthRes.data);
        setRecommendations(recsRes.data.recommendations || []);
        setNetWorthProjection(projectionRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setHealthScore({ score: 78, grade: "B+", retirement_probability: 81 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [portfolio, whatIfParams]);
  
  // Calculate What-If adjusted metrics
  const whatIfMetrics = useMemo(() => {
    const baseNetWorth = portfolio.summary.netWorth;
    const baseMonthlyIncome = portfolio.personal.taxableIncome / 12;
    const yearsToRetirement = whatIfParams.retirementAge - 45;
    const adjustedMonthlySavings = baseMonthlyIncome * (whatIfParams.savingsRate / 100);
    const annualReturn = whatIfParams.marketReturn / 100;
    const inflationAdjustedReturn = annualReturn - (whatIfParams.inflationRate / 100);
    
    const fv = baseNetWorth * Math.pow(1 + inflationAdjustedReturn, yearsToRetirement) + 
               (adjustedMonthlySavings * 12) * ((Math.pow(1 + inflationAdjustedReturn, yearsToRetirement) - 1) / inflationAdjustedReturn);
    
    const retirementTarget = 3500000;
    const probabilityBase = Math.min(100, Math.round((fv / retirementTarget) * 75 + 
      (whatIfParams.savingsRate > 15 ? 10 : 0) + 
      (whatIfParams.marketReturn > 7 ? 5 : 0)));
    
    const defaultFV = baseNetWorth * Math.pow(1 + 0.04, 15) + 
                     (baseMonthlyIncome * 0.15 * 12) * ((Math.pow(1 + 0.04, 15) - 1) / 0.04);
    
    return {
      projectedNetWorth: fv,
      monthlyCashflow: adjustedMonthlySavings,
      retirementProbability: probabilityBase,
      netWorthDelta: fv - defaultFV,
      cashflowDelta: adjustedMonthlySavings - (baseMonthlyIncome * 0.15),
      isModified: JSON.stringify(whatIfParams) !== JSON.stringify(DEFAULT_WHATIF)
    };
  }, [whatIfParams, portfolio]);
  
  const resetWhatIf = () => setWhatIfParams(DEFAULT_WHATIF);

  const retirementProbability = healthScore?.retirement_probability || 81;
  const monthlyIncome = portfolio.personal.taxableIncome / 12;
  const monthlyExpenses = 10000;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = (monthlySavings / monthlyIncome) * 100;
  const totalPotentialImpact = recommendations.reduce((sum, r) => sum + (r.impact_primary || 0), 0);

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard">
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Financial Overview
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Wheeler Family • Last updated today
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowWhatIf(!showWhatIf)}
              data-testid="what-if-toggle-btn"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              What-If Analysis
            </Button>
            <Button 
              size="sm"
              data-testid="ai-advisor-btn"
              onClick={() => navigate("/ai-advisor")}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Advisor
            </Button>
          </div>
        </div>

        {/* What-If Panel - Clean Design */}
        {showWhatIf && (
          <Card data-testid="what-if-panel">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    What-If Scenario Builder
                  </CardTitle>
                  <CardDescription>Adjust parameters to see projected outcomes</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={resetWhatIf} disabled={!whatIfMetrics.isModified}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { key: 'savingsRate', label: 'Savings Rate', min: 5, max: 50, step: 1, suffix: '%' },
                  { key: 'marketReturn', label: 'Market Return', min: 2, max: 12, step: 0.5, suffix: '%' },
                  { key: 'retirementAge', label: 'Retirement Age', min: 50, max: 70, step: 1, suffix: '' },
                  { key: 'inflationRate', label: 'Inflation', min: 1, max: 6, step: 0.5, suffix: '%' }
                ].map(slider => (
                  <div key={slider.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm text-muted-foreground">{slider.label}</label>
                      <span className="text-sm font-medium">{whatIfParams[slider.key]}{slider.suffix}</span>
                    </div>
                    <Slider
                      value={[whatIfParams[slider.key]]}
                      onValueChange={(val) => setWhatIfParams(p => ({ ...p, [slider.key]: val[0] }))}
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      className="cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {whatIfMetrics.isModified && (
                <div className="mt-6 pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Projected Retirement Balance</p>
                      <p className="text-lg font-semibold">{formatCompact(whatIfMetrics.projectedNetWorth)}</p>
                      <p className={`text-xs ${whatIfMetrics.netWorthDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {whatIfMetrics.netWorthDelta >= 0 ? '+' : ''}{formatCompact(whatIfMetrics.netWorthDelta)} vs baseline
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Savings</p>
                      <p className="text-lg font-semibold">{formatCurrency(whatIfMetrics.monthlyCashflow)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Success Probability</p>
                      <p className="text-lg font-semibold">{whatIfMetrics.retirementProbability}%</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Key Metrics - Clean Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/family-wealth')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Net Worth</p>
              <p className="text-2xl font-semibold">{formatCurrency(portfolio.summary.netWorth)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +12.4% this year
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/budget')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Monthly Cashflow</p>
              <p className="text-2xl font-semibold text-green-600">+{formatCurrency(monthlySavings)}</p>
              <p className="text-xs text-muted-foreground mt-1">{savingsRate.toFixed(0)}% savings rate</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/goal-tracker')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Goal Progress</p>
              <p className="text-2xl font-semibold">{GOALS_DATA.filter(g => g.onTrack).length} of {GOALS_DATA.length}</p>
              <p className="text-xs text-muted-foreground mt-1">goals on track</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/monte-carlo')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Retirement Probability</p>
              <p className="text-2xl font-semibold">{retirementProbability}%</p>
              <p className="text-xs text-muted-foreground mt-1">Monte Carlo analysis</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="actions">Recommended Actions</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Financial Health Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Financial Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-bold">{healthScore?.score || 78}</div>
                    <div>
                      <Badge variant="secondary" className="text-sm">{healthScore?.grade || 'B+'}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { label: 'Savings Rate', value: '15%', score: 85 },
                      { label: 'Debt Ratio', value: '32%', score: 70 },
                      { label: 'Emergency Fund', value: '4.2 mo', score: 60 },
                      { label: 'Retirement Readiness', value: `${retirementProbability}%`, score: retirementProbability },
                      { label: 'Diversification', value: 'Good', score: 80 }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Asset Allocation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Asset Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Property', value: portfolio.investments.properties.reduce((s, p) => s + p.value, 0), color: 'bg-blue-500' },
                      { name: 'Super', value: portfolio.investments.smsf_balance, color: 'bg-purple-500' },
                      { name: 'Shares & ETFs', value: portfolio.investments.shares_value + portfolio.investments.etf_value, color: 'bg-green-500' },
                      { name: 'Cash', value: 75000, color: 'bg-amber-500' }
                    ].map((asset, i) => {
                      const pct = (asset.value / portfolio.summary.totalAssets) * 100;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{asset.name}</span>
                            <span className="font-medium">{formatCompact(asset.value)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${asset.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Assets</span>
                      <span className="font-medium">{formatCurrency(portfolio.summary.totalAssets)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Liabilities</span>
                      <span className="font-medium text-red-600">{formatCurrency(portfolio.summary.totalDebt)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Net Worth</span>
                      <span className="font-semibold">{formatCurrency(portfolio.summary.netWorth)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Annual Income</span>
                      <span className="font-medium">{formatCurrency(portfolio.personal.taxableIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Annual Savings</span>
                      <span className="font-medium text-green-600">{formatCurrency(monthlySavings * 12)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recommended Actions Tab */}
          <TabsContent value="actions" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Recommended Actions
                    </CardTitle>
                    <CardDescription>AI-powered recommendations to optimize your wealth</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Potential Impact</p>
                    <p className="text-lg font-semibold text-green-600">+{formatCompact(totalPotentialImpact || 643000)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Action</th>
                        <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Description</th>
                        <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground">Impact</th>
                        <th className="text-center py-3 px-2 text-xs font-medium text-muted-foreground">Priority</th>
                        <th className="py-3 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(recommendations.length > 0 ? recommendations : [
                        { id: 1, title: "Increase super contributions", description: "Salary sacrifice $500/month to reach concessional cap", impact_primary: 520000, priority: "high", category: "super" },
                        { id: 2, title: "Refinance mortgage", description: "Switch to 5.89% rate to save on interest", impact_primary: 78000, priority: "high", category: "debt" },
                        { id: 3, title: "Build emergency fund", description: "Increase from 4.2 to 6 months expenses", impact_primary: 45000, priority: "medium", category: "savings" },
                        { id: 4, title: "Maximize franking credits", description: "Rebalance portfolio for tax efficiency", impact_primary: 8400, priority: "medium", category: "tax" }
                      ]).map((action, index) => (
                        <tr key={action.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="font-medium text-sm">{action.title}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-muted-foreground">{action.description}</td>
                          <td className="py-3 px-2 text-right">
                            <span className="font-semibold text-green-600">+{formatCompact(action.impact_primary)}</span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                              {action.priority}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate('/decision-engine')}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <LineChart className="h-4 w-4" />
                      Net Worth Projection
                    </CardTitle>
                    <CardDescription>Projected wealth growth over time</CardDescription>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="text-muted-foreground">2025</p>
                      <p className="font-semibold">{formatCompact(portfolio.summary.netWorth)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">2040</p>
                      <p className="font-semibold text-green-600">{formatCompact(netWorthProjection[15]?.net_worth || 3900000)}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={netWorthProjection.length > 0 ? netWorthProjection : [
                      { year: 2025, net_worth: 1978000 },
                      { year: 2028, net_worth: 2400000 },
                      { year: 2032, net_worth: 3100000 },
                      { year: 2036, net_worth: 3600000 },
                      { year: 2040, net_worth: 3900000 },
                      { year: 2045, net_worth: 4500000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), "Net Worth"]}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <ReferenceLine y={3500000} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="net_worth" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Milestones Table */}
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Projected Milestones</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-xs font-medium text-muted-foreground">Milestone</th>
                        <th className="text-center py-2 text-xs font-medium text-muted-foreground">Year</th>
                        <th className="text-right py-2 text-xs font-medium text-muted-foreground">Net Worth</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">$2M Net Worth</td>
                        <td className="py-2 text-center">2026</td>
                        <td className="py-2 text-right font-medium">$2,000,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">$3M Net Worth</td>
                        <td className="py-2 text-center">2032</td>
                        <td className="py-2 text-right font-medium">$3,000,000</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Retirement Target</td>
                        <td className="py-2 text-center">2040</td>
                        <td className="py-2 text-right font-medium">$3,500,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Financial Goals
                    </CardTitle>
                    <CardDescription>Track progress towards your financial objectives</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/goal-tracker')}>
                    Manage Goals
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 text-xs font-medium text-muted-foreground">Goal</th>
                      <th className="text-right py-3 text-xs font-medium text-muted-foreground">Current</th>
                      <th className="text-right py-3 text-xs font-medium text-muted-foreground">Target</th>
                      <th className="text-center py-3 text-xs font-medium text-muted-foreground">Progress</th>
                      <th className="text-center py-3 text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GOALS_DATA.map((goal) => (
                      <tr key={goal.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-sm">{goal.name}</td>
                        <td className="py-3 text-right text-sm">{formatCompact(goal.current)}</td>
                        <td className="py-3 text-right text-sm text-muted-foreground">{formatCompact(goal.target)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={goal.progress} className="h-2 flex-1" />
                            <span className="text-xs font-medium w-10 text-right">{goal.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          {goal.onTrack ? (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">On Track</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-xs">Behind</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
