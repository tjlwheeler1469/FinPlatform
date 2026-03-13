import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
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
  TrendingUpIcon,
  Activity,
  ChevronRight,
  Wallet,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from "lucide-react";
import { usePortfolio } from "@/App";
import ChartContainer from "@/components/ChartContainer";
import axios from "axios";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
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

const COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

// Goal icons mapping
const GOAL_ICONS = {
  retirement: PiggyBank,
  house: Home,
  education: GraduationCap,
  travel: Plane,
  emergency: Shield,
  investment: TrendingUp,
  debt: CreditCard,
  default: Target
};

// Top Actions with $ Impact
const TOP_ACTIONS = [
  {
    id: 1,
    title: "Increase super contributions",
    description: "Salary sacrifice $500/month",
    impact: "+$520,000",
    impactLabel: "at retirement",
    priority: "high",
    icon: PiggyBank,
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    id: 2,
    title: "Refinance mortgage",
    description: "Switch to 5.89% rate",
    impact: "-$78,000",
    impactLabel: "interest saved",
    priority: "high",
    icon: Home,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    id: 3,
    title: "Increase emergency fund",
    description: "Build to 6 months expenses",
    impact: "+$45,000",
    impactLabel: "security buffer",
    priority: "medium",
    icon: Shield,
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  {
    id: 4,
    title: "Maximize franking credits",
    description: "Rebalance to dividend stocks",
    impact: "+$8,400",
    impactLabel: "tax refund/year",
    priority: "medium",
    icon: Calculator,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  }
];

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
  const { portfolio, recommendations } = usePortfolio();
  const [monteCarloData, setMonteCarloData] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // What-If Toggle State
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfParams, setWhatIfParams] = useState(DEFAULT_WHATIF);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [monteCarloRes, healthRes, netWorthRes] = await Promise.all([
          axios.post(`${API}/analyze/monte-carlo`, null, {
            params: {
              initial_value: portfolio.summary.netWorth,
              expected_return: whatIfParams.marketReturn / 100,
              volatility: 0.12,
              years: whatIfParams.retirementAge - 45,
              simulations: 1000
            }
          }),
          axios.post(`${API}/decision-engine/health-score`, {
            age: 45,
            current_income: portfolio.personal.taxableIncome,
            annual_expenses: 120000,
            total_assets: portfolio.summary.totalAssets,
            total_debt: portfolio.summary.totalDebt,
            super_balance: portfolio.investments.smsf_balance,
            emergency_fund: 75000,
            investment_portfolio: portfolio.investments.shares_value + portfolio.investments.etf_value,
            property_value: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0),
            savings_rate: whatIfParams.savingsRate / 100,
            retirement_age: whatIfParams.retirementAge,
            desired_retirement_income: 100000
          }),
          axios.get(`${API}/trends/net-worth/wheeler`)
        ]);
        
        setMonteCarloData(monteCarloRes.data);
        setHealthScore(healthRes.data);
        setNetWorthHistory(netWorthRes.data.history?.slice(-12) || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Set default values on error
        setHealthScore({ score: 82, grade: "B+", retirement_probability: 81 });
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
    
    // Calculate adjusted monthly savings based on savings rate
    const adjustedMonthlySavings = baseMonthlyIncome * (whatIfParams.savingsRate / 100);
    
    // Calculate adjusted cashflow
    const adjustedMonthlyCashflow = adjustedMonthlySavings;
    
    // Simple future value calculation with compound growth
    const annualReturn = whatIfParams.marketReturn / 100;
    const inflationAdjustedReturn = annualReturn - (whatIfParams.inflationRate / 100);
    
    // Future Value = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
    const fv = baseNetWorth * Math.pow(1 + inflationAdjustedReturn, yearsToRetirement) + 
               (adjustedMonthlySavings * 12) * ((Math.pow(1 + inflationAdjustedReturn, yearsToRetirement) - 1) / inflationAdjustedReturn);
    
    // Estimated retirement probability (simplified model)
    const retirementTarget = 3500000;
    const probabilityBase = Math.min(100, Math.round((fv / retirementTarget) * 75 + 
      (whatIfParams.savingsRate > 15 ? 10 : 0) + 
      (whatIfParams.marketReturn > 7 ? 5 : 0)));
    
    // Compare to defaults
    const defaultFV = baseNetWorth * Math.pow(1 + 0.04, 15) + 
                     (baseMonthlyIncome * 0.15 * 12) * ((Math.pow(1 + 0.04, 15) - 1) / 0.04);
    
    const netWorthDelta = fv - defaultFV;
    const cashflowDelta = adjustedMonthlySavings - (baseMonthlyIncome * 0.15);
    
    return {
      projectedNetWorth: fv,
      monthlyCashflow: adjustedMonthlyCashflow,
      retirementProbability: probabilityBase,
      netWorthDelta,
      cashflowDelta,
      isModified: JSON.stringify(whatIfParams) !== JSON.stringify(DEFAULT_WHATIF)
    };
  }, [whatIfParams, portfolio]);
  
  const resetWhatIf = () => {
    setWhatIfParams(DEFAULT_WHATIF);
  };

  // Calculate retirement probability from Monte Carlo
  const retirementProbability = monteCarloData?.success_probability || 81;
  const retirementTarget = 3500000;
  const projectedRetirement = monteCarloData?.percentile_projections?.p50?.[24] || 4200000;

  // Asset allocation for pie chart
  const assetAllocation = [
    { name: "Property", value: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0), color: COLORS[0] },
    { name: "Super", value: portfolio.investments.smsf_balance, color: COLORS[1] },
    { name: "Shares", value: portfolio.investments.shares_value, color: COLORS[2] },
    { name: "ETFs", value: portfolio.investments.etf_value, color: COLORS[3] },
    { name: "Cash", value: portfolio.investments.cash_savings + portfolio.investments.term_deposit_amount, color: COLORS[4] },
  ].filter(a => a.value > 0);

  // Net worth chart data
  const netWorthChartData = netWorthHistory.length > 0 
    ? netWorthHistory.map(h => ({
        month: h.date?.substring(5) || h.month,
        value: h.net_worth
      }))
    : Array.from({ length: 12 }, (_, i) => ({
        month: `M${i + 1}`,
        value: portfolio.summary.netWorth * (0.88 + (i * 0.01))
      }));

  // Cashflow data (simplified)
  const monthlyIncome = portfolio.personal.taxableIncome / 12;
  const monthlyExpenses = 10000;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = (monthlySavings / monthlyIncome) * 100;

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Financial Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              Your complete financial picture at a glance
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showWhatIf ? "default" : "outline"}
              onClick={() => setShowWhatIf(!showWhatIf)}
              data-testid="what-if-toggle-btn"
              className={showWhatIf ? "bg-[#D4A84C] hover:bg-[#D4A84C]/90 text-[#1a2744]" : ""}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              What-If
              {showWhatIf ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/scenarios")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Scenarios
            </Button>
            <Button 
              data-testid="ai-advisor-btn"
              onClick={() => navigate("/ai-advisor")}
              className="bg-[#1a2744] hover:bg-[#1a2744]/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Advisor
            </Button>
          </div>
        </div>

        {/* What-If Quick Toggle Bar */}
        {showWhatIf && (
          <Card className="border-[#D4A84C]/30 bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/5" data-testid="what-if-panel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-[#D4A84C]" />
                  <span className="font-semibold">What-If Scenario Builder</span>
                  {whatIfMetrics.isModified && (
                    <Badge className="bg-[#D4A84C] text-[#1a2744]">Modified</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetWhatIf}
                  disabled={!whatIfMetrics.isModified}
                  data-testid="what-if-reset-btn"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Savings Rate Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Savings Rate</label>
                    <span className="text-sm font-bold text-[#D4A84C]">{whatIfParams.savingsRate}%</span>
                  </div>
                  <Slider
                    value={[whatIfParams.savingsRate]}
                    onValueChange={(val) => setWhatIfParams(p => ({ ...p, savingsRate: val[0] }))}
                    min={5}
                    max={50}
                    step={1}
                    className="cursor-pointer"
                    data-testid="savings-rate-slider"
                  />
                  <p className="text-xs text-muted-foreground">% of income saved monthly</p>
                </div>

                {/* Market Return Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Market Return</label>
                    <span className="text-sm font-bold text-[#D4A84C]">{whatIfParams.marketReturn}%</span>
                  </div>
                  <Slider
                    value={[whatIfParams.marketReturn]}
                    onValueChange={(val) => setWhatIfParams(p => ({ ...p, marketReturn: val[0] }))}
                    min={2}
                    max={12}
                    step={0.5}
                    className="cursor-pointer"
                    data-testid="market-return-slider"
                  />
                  <p className="text-xs text-muted-foreground">Expected annual return</p>
                </div>

                {/* Retirement Age Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Retirement Age</label>
                    <span className="text-sm font-bold text-[#D4A84C]">{whatIfParams.retirementAge}</span>
                  </div>
                  <Slider
                    value={[whatIfParams.retirementAge]}
                    onValueChange={(val) => setWhatIfParams(p => ({ ...p, retirementAge: val[0] }))}
                    min={50}
                    max={70}
                    step={1}
                    className="cursor-pointer"
                    data-testid="retirement-age-slider"
                  />
                  <p className="text-xs text-muted-foreground">Target retirement age</p>
                </div>

                {/* Inflation Rate Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Inflation</label>
                    <span className="text-sm font-bold text-[#D4A84C]">{whatIfParams.inflationRate}%</span>
                  </div>
                  <Slider
                    value={[whatIfParams.inflationRate]}
                    onValueChange={(val) => setWhatIfParams(p => ({ ...p, inflationRate: val[0] }))}
                    min={1}
                    max={6}
                    step={0.5}
                    className="cursor-pointer"
                    data-testid="inflation-slider"
                  />
                  <p className="text-xs text-muted-foreground">Assumed inflation rate</p>
                </div>
              </div>

              {/* Impact Summary */}
              {whatIfMetrics.isModified && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-[#D4A84C]" />
                    <span className="text-sm font-semibold">Projected Impact</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-background rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground">Retirement Nest Egg</p>
                      <p className="text-lg font-bold">{formatCompact(whatIfMetrics.projectedNetWorth)}</p>
                      <div className={`flex items-center gap-1 text-xs ${whatIfMetrics.netWorthDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {whatIfMetrics.netWorthDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {whatIfMetrics.netWorthDelta >= 0 ? '+' : ''}{formatCompact(whatIfMetrics.netWorthDelta)}
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground">Monthly Savings</p>
                      <p className="text-lg font-bold">{formatCurrency(whatIfMetrics.monthlyCashflow)}</p>
                      <div className={`flex items-center gap-1 text-xs ${whatIfMetrics.cashflowDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {whatIfMetrics.cashflowDelta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {whatIfMetrics.cashflowDelta >= 0 ? '+' : ''}{formatCurrency(whatIfMetrics.cashflowDelta)}
                      </div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground">Success Probability</p>
                      <p className="text-lg font-bold">{whatIfMetrics.retirementProbability}%</p>
                      <div className={`flex items-center gap-1 text-xs ${whatIfMetrics.retirementProbability >= 80 ? 'text-green-600' : 'text-amber-500'}`}>
                        {whatIfMetrics.retirementProbability >= 80 ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {whatIfMetrics.retirementProbability >= 80 ? 'On Track' : 'Needs Review'}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <Button 
                        onClick={() => navigate('/scenarios')}
                        className="bg-[#1a2744] hover:bg-[#1a2744]/90"
                        data-testid="save-scenario-btn"
                      >
                        Save as Scenario
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Row 1: Key Metrics - The 4 Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Worth */}
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#1a2744]/80 text-white border-none cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/family-wealth')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/70">Net Worth</p>
                <Wallet className="h-5 w-5 text-[#D4A84C]" />
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(portfolio.summary.netWorth)}
              </p>
              <div className="flex items-center gap-1 mt-2 text-[#D4A84C]">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+12.4% YTD</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Cashflow */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/budget')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Monthly Cashflow</p>
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                +{formatCurrency(monthlySavings)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={savingsRate} className="h-2 flex-1" />
                <span className="text-sm text-muted-foreground">{savingsRate.toFixed(0)}% saved</span>
              </div>
            </CardContent>
          </Card>

          {/* Goal Progress */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/goal-tracker')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Goal Progress</p>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold">
                {GOALS_DATA.filter(g => g.onTrack).length}/{GOALS_DATA.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">goals on track</p>
              <div className="flex gap-1 mt-2">
                {GOALS_DATA.map(g => (
                  <div 
                    key={g.id} 
                    className={`h-2 flex-1 rounded-full ${g.onTrack ? 'bg-green-500' : 'bg-amber-500'}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Retirement Probability */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/monte-carlo')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Retirement Success</p>
                <PiggyBank className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{retirementProbability}%</p>
                <Badge variant={retirementProbability >= 80 ? "default" : "secondary"} className={retirementProbability >= 80 ? "bg-green-500" : "bg-amber-500"}>
                  {retirementProbability >= 80 ? "On Track" : "Review"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Monte Carlo: {retirementProbability}% chance of {formatCompact(retirementTarget)} by 60
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Financial Health Score + Top Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Health Score */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-[#D4A84C]" />
                Financial Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-muted/20"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(healthScore?.score || 82) * 3.52} 352`}
                      className="text-[#D4A84C]"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{healthScore?.score || 82}</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Savings Rate</span>
                  <span className="font-medium text-green-600">15% ✓</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Debt Ratio</span>
                  <span className="font-medium text-green-600">32% ✓</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Emergency Fund</span>
                  <span className="font-medium text-amber-600">4.2mo ⚠</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retirement Ready</span>
                  <span className="font-medium text-green-600">{retirementProbability}% ✓</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/decision-engine')}
              >
                View Full Analysis
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Top Actions with Impact */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                  Top Actions
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/ai-advisor')}>
                  Get AI Advice
                  <Sparkles className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TOP_ACTIONS.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <div 
                      key={action.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                      onClick={() => navigate('/decision-engine')}
                    >
                      <div className={`w-10 h-10 rounded-lg ${action.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{action.title}</p>
                          {index === 0 && (
                            <Badge className="bg-red-500 text-white text-[10px]">HIGH IMPACT</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{action.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold ${action.impact.startsWith('+') ? 'text-green-600' : 'text-blue-600'}`}>
                          {action.impact}
                        </p>
                        <p className="text-xs text-muted-foreground">{action.impactLabel}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Goals + Net Worth Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goal Progress Bars */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-[#D4A84C]" />
                  Goal Progress
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/goal-tracker')}>
                  Manage Goals
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {GOALS_DATA.map((goal) => {
                  const GoalIcon = GOAL_ICONS[goal.icon] || GOAL_ICONS.default;
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GoalIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{goal.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{goal.progress}%</span>
                          {goal.onTrack ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress 
                          value={goal.progress} 
                          className="h-3"
                        />
                        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                          <span>{formatCompact(goal.current)}</span>
                          <span>{formatCompact(goal.target)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Net Worth Chart */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-[#D4A84C]" />
                  Net Worth Trend
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/net-worth-trend')}>
                  Full History
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer height={200}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthChartData}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tickFormatter={(v) => formatCompact(v)}
                      tick={{ fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Net Worth"]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#1a2744" 
                      strokeWidth={2}
                      fill="url(#netWorthGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Asset Allocation + Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Allocation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                Asset Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer height={180}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {assetAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              <div className="space-y-2 mt-2">
                {assetAllocation.slice(0, 4).map((asset, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span className="text-muted-foreground">{asset.name}</span>
                    </div>
                    <span className="font-medium">{formatCompact(asset.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Recommendations */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-[#D4A84C]" />
                  AI Insights
                </CardTitle>
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  Powered by GPT-4
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations?.slice(0, 4).map((rec, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/ai-advisor')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                        rec.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {rec.type === 'tax_optimization' ? <Calculator className="h-4 w-4" /> :
                         rec.type === 'property' ? <Building2 className="h-4 w-4" /> :
                         rec.type === 'super' ? <PiggyBank className="h-4 w-4" /> :
                         <Lightbulb className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{rec.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{rec.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/ai-advisor')}
              >
                Get Personalized AI Advice
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
