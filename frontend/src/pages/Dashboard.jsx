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
  PiggyBank, 
  Calculator,
  ArrowRight,
  BarChart3,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Target,
  Shield,
  Sparkles,
  RefreshCw,
  Zap,
  Activity,
  ChevronRight,
  Wallet,
  SlidersHorizontal,
  RotateCcw,
  DollarSign,
  LineChart,
  Link2,
  Building,
  CreditCard,
  Landmark,
  AlertTriangle,
  ArrowUpRight,
  Play,
  Brain,
  Home,
  Briefcase,
  Plane,
  TrendingDown as CrashIcon,
  Gift,
  Calendar,
  User
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
  BarChart,
  Bar,
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

// Goals data
const GOALS_DATA = [
  { id: 1, name: "Retirement at 60", target: 3500000, current: 2520000, progress: 72, onTrack: true },
  { id: 2, name: "Kids Education Fund", target: 200000, current: 182000, progress: 91, onTrack: true },
  { id: 3, name: "House Upgrade", target: 500000, current: 245000, progress: 49, onTrack: false },
  { id: 4, name: "Europe Trip 2026", target: 35000, current: 28000, progress: 80, onTrack: true }
];

// Connected accounts mock
const CONNECTED_ACCOUNTS = [
  { id: 1, name: "Commonwealth Bank", type: "bank", status: "connected", lastSync: "2 hours ago" },
  { id: 2, name: "Vanguard Super", type: "super", status: "connected", lastSync: "1 day ago" },
  { id: 3, name: "CommSec", type: "brokerage", status: "connected", lastSync: "4 hours ago" },
];

const ACCOUNT_ICONS = {
  bank: Building,
  super: Landmark,
  brokerage: BarChart3,
  credit: CreditCard
};

// Life Decision Scenarios
const LIFE_SCENARIOS = [
  { id: "retire_early_5", name: "Retire 5 years early", icon: Calendar, color: "text-blue-600" },
  { id: "buy_property", name: "Buy investment property", icon: Home, color: "text-green-600" },
  { id: "start_business", name: "Start a business", icon: Briefcase, color: "text-purple-600" },
  { id: "market_crash", name: "30% market crash", icon: CrashIcon, color: "text-red-600" },
  { id: "inheritance", name: "Receive inheritance", icon: Gift, color: "text-amber-600" },
  { id: "increase_savings_500", name: "Save extra $500/mo", icon: PiggyBank, color: "text-emerald-600" },
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
  const [monteCarloResult, setMonteCarloResult] = useState(null);
  const [wealthBrief, setWealthBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("brief");
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [whatIfParams, setWhatIfParams] = useState(DEFAULT_WHATIF);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [scenarioResult, setScenarioResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const yearsToRetirement = whatIfParams.retirementAge - 45;
        const annualSavings = portfolio.personal.taxableIncome * (whatIfParams.savingsRate / 100);
        const retirementTarget = 3500000;
        
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

        const monteCarloData = {
          initial_value: portfolio.summary.netWorth,
          annual_contribution: annualSavings,
          expected_return: whatIfParams.marketReturn / 100,
          volatility: 0.15,
          years: yearsToRetirement,
          target_value: retirementTarget,
          simulations: 10000,
          inflation_rate: whatIfParams.inflationRate / 100
        };

        const [healthRes, recsRes, projectionRes, monteCarloRes] = await Promise.all([
          axios.post(`${API}/decision-engine/health-score-v2`, requestData),
          axios.post(`${API}/decision-engine/recommendations-v2`, requestData),
          axios.get(`${API}/decision-engine/net-worth-projection`, {
            params: {
              current_net_worth: portfolio.summary.netWorth,
              annual_savings: annualSavings,
              years: 20,
              growth_rate: whatIfParams.marketReturn / 100
            }
          }),
          axios.post(`${API}/decision-engine/monte-carlo-advanced`, monteCarloData)
        ]);
        
        setHealthScore(healthRes.data);
        setRecommendations(recsRes.data.recommendations || []);
        setNetWorthProjection(projectionRes.data || []);
        setMonteCarloResult(monteCarloRes.data);

        // Fetch AI Wealth Brief
        const wealthBriefData = {
          age: 45,
          retirement_age: whatIfParams.retirementAge,
          net_worth: portfolio.summary.netWorth,
          annual_income: portfolio.personal.taxableIncome,
          annual_expenses: 120000,
          total_assets: portfolio.summary.totalAssets,
          total_debt: portfolio.summary.totalDebt,
          super_balance: portfolio.investments.smsf_balance,
          investment_portfolio: portfolio.investments.shares_value + portfolio.investments.etf_value,
          savings_rate: whatIfParams.savingsRate / 100,
          mortgage_balance: portfolio.summary.totalDebt,
          mortgage_rate: 6.5,
          monte_carlo_probability: monteCarloRes.data?.success_probability || 50
        };
        
        const briefRes = await axios.post(`${API}/ai/wealth-brief`, wealthBriefData);
        setWealthBrief(briefRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setHealthScore({ score: 78, grade: "B+", retirement_probability: 81 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [portfolio, whatIfParams]);

  // Handle life scenario selection
  const handleScenarioClick = async (scenarioId) => {
    setSelectedScenario(scenarioId);
    try {
      const res = await axios.post(`${API}/ai/life-scenario`, {
        scenario_id: scenarioId,
        base_probability: retirementProbability,
        net_worth: portfolio.summary.netWorth,
        annual_savings: portfolio.personal.taxableIncome * (whatIfParams.savingsRate / 100),
        years_to_retirement: whatIfParams.retirementAge - 45
      });
      setScenarioResult(res.data);
    } catch (error) {
      console.error("Error calculating scenario:", error);
    }
  };
  
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
    
    return {
      projectedNetWorth: fv,
      monthlyCashflow: adjustedMonthlySavings,
      retirementProbability: probabilityBase,
      isModified: JSON.stringify(whatIfParams) !== JSON.stringify(DEFAULT_WHATIF)
    };
  }, [whatIfParams, portfolio]);
  
  const resetWhatIf = () => setWhatIfParams(DEFAULT_WHATIF);

  const retirementProbability = monteCarloResult?.success_probability || healthScore?.retirement_probability || 74;
  const projectedBalance = monteCarloResult?.median_outcome || 3200000;
  const monthlyRetirementIncome = Math.round(projectedBalance * 0.04 / 12);
  const monthlyIncome = portfolio.personal.taxableIncome / 12;
  const monthlyExpenses = 10000;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = (monthlySavings / monthlyIncome) * 100;
  const totalPotentialImpact = wealthBrief?.total_impact || recommendations.reduce((sum, r) => sum + (r.impact_primary || 0), 0);

  const scenarioComparison = [
    { name: `Retire at ${whatIfParams.retirementAge}`, probability: retirementProbability, balance: projectedBalance, monthly: monthlyRetirementIncome },
    { name: 'Retire at 65', probability: Math.min(99, retirementProbability + 15), balance: projectedBalance * 1.28, monthly: Math.round(projectedBalance * 1.28 * 0.04 / 12) },
    { name: 'Market Crash', probability: Math.max(30, retirementProbability - 22), balance: projectedBalance * 0.75, monthly: Math.round(projectedBalance * 0.75 * 0.04 / 12) },
  ];

  const stressTests = [
    { scenario: 'Base Case', probability: retirementProbability, change: 0 },
    { scenario: '30% Market Drop', probability: Math.max(30, retirementProbability - 22), change: -22 },
    { scenario: 'High Inflation (6%)', probability: Math.max(35, retirementProbability - 13), change: -13 },
    { scenario: 'Job Loss (1yr)', probability: Math.max(40, retirementProbability - 6), change: -6 },
  ];

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Your Financial Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Wheeler Family • AI-Powered Wealth Strategy</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowWhatIf(!showWhatIf)}>
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              What-If
            </Button>
            <Button size="sm" onClick={() => navigate("/ai-advisor")}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Advisor
            </Button>
          </div>
        </div>

        {/* AI WEALTH BRIEF - THE HERO SECTION */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Brain className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 text-sm font-medium">AI Wealth Brief</p>
                <h2 className="text-2xl font-bold mt-1">
                  {wealthBrief?.headline || `You can retire at ${whatIfParams.retirementAge} with strategic adjustments`}
                </h2>
              </div>
            </div>
            
            {/* Key Insight */}
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-white/90">
                {wealthBrief?.key_insight || `Implementing 3 key changes could add $${(totalPotentialImpact/1000000).toFixed(1)}M to your retirement wealth.`}
              </p>
            </div>

            {/* Top 3 Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(wealthBrief?.recommendations || [
                { title: "Maximize super contributions", impact: 380000, impact_text: "+$380K to retirement" },
                { title: "Refinance mortgage", impact: 68000, impact_text: "$68K interest saved" },
                { title: "Increase growth allocation", impact: 45000, impact_text: "+$45K from returns" }
              ]).slice(0, 3).map((rec, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm">{rec.title}</span>
                  </div>
                  <p className="text-amber-400 font-semibold">{rec.impact_text || formatCompact(rec.impact)}</p>
                </div>
              ))}
            </div>

            {/* Net Worth Projection Timeline */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-white/70 mb-3">Your Wealth Trajectory</p>
              <div className="flex items-end justify-between gap-4">
                {(wealthBrief?.net_worth_projections || [
                  { age: 45, formatted: "$2.0M" },
                  { age: 50, formatted: "$2.8M" },
                  { age: 55, formatted: "$4.0M" },
                  { age: 60, formatted: "$5.5M" }
                ]).map((proj, i) => (
                  <div key={i} className="text-center flex-1">
                    <div className="h-16 flex items-end justify-center mb-2">
                      <div 
                        className="w-full max-w-[40px] bg-gradient-to-t from-amber-500 to-amber-400 rounded-t"
                        style={{ height: `${Math.min(100, (i + 1) * 25)}%` }}
                      />
                    </div>
                    <p className="text-lg font-bold">{proj.formatted}</p>
                    <p className="text-xs text-white/60">Age {proj.age}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HERO ROW: Retirement Probability + Health Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monte Carlo */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Retirement Success Probability</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold">{Math.round(retirementProbability)}%</span>
                    <Badge variant={retirementProbability >= 80 ? "default" : "secondary"} className={retirementProbability >= 80 ? "bg-green-500" : "bg-amber-500"}>
                      {retirementProbability >= 80 ? "On Track" : "Needs Attention"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Based on {monteCarloResult?.simulations_run?.toLocaleString() || "10,000"} Monte Carlo simulations</p>
                  <p className="text-sm mt-1">Target: <span className="font-medium">85%</span> • Gap: <span className={retirementProbability >= 85 ? "text-green-600" : "text-amber-600"}>{retirementProbability >= 85 ? "None" : `${Math.round(85 - retirementProbability)}%`}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Projected Balance at {whatIfParams.retirementAge}</p>
                  <p className="text-2xl font-semibold">{formatCompact(projectedBalance)}</p>
                  <p className="text-sm text-muted-foreground mt-2">Monthly Income</p>
                  <p className="text-lg font-medium">{formatCurrency(monthlyRetirementIncome)}/mo</p>
                </div>
              </div>
              
              {monteCarloResult && (
                <div className="mt-4 grid grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Best Case (95th)</p>
                    <p className="font-medium text-green-600">{formatCompact(monteCarloResult.best_case)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Median Outcome</p>
                    <p className="font-medium">{formatCompact(monteCarloResult.median_outcome)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Worst Case (5th)</p>
                    <p className="font-medium text-red-600">{formatCompact(monteCarloResult.worst_case)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Shortfall Risk</p>
                    <p className="font-medium text-amber-600">{monteCarloResult.shortfall_risk}%</p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium mb-3">Quick Scenario Comparison</p>
                <div className="grid grid-cols-3 gap-4">
                  {scenarioComparison.map((scenario, i) => (
                    <div key={i} className={`p-3 rounded-lg ${i === 0 ? 'bg-blue-50 border border-blue-200' : 'bg-muted/50'}`}>
                      <p className="text-xs text-muted-foreground">{scenario.name}</p>
                      <p className="text-xl font-semibold">{Math.round(scenario.probability)}%</p>
                      <p className="text-xs text-muted-foreground">{formatCompact(scenario.balance)}</p>
                    </div>
                  ))}
                </div>
                <Button variant="link" size="sm" className="mt-2 p-0 h-auto" onClick={() => navigate('/scenario-comparison')}>
                  Compare more scenarios <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Financial Health Score */}
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Financial Health Score</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" 
                      className="text-primary" 
                      strokeDasharray={`${(healthScore?.score || 78) * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{healthScore?.score || 78}</span>
                  </div>
                </div>
                <div>
                  <Badge variant="secondary" className="text-lg px-3">{healthScore?.grade || 'B+'}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Savings Rate', value: `${Math.round(savingsRate)}%`, good: savingsRate >= 15 },
                  { label: 'Debt Ratio', value: '32%', good: true },
                  { label: 'Emergency Fund', value: '4.2mo', good: false },
                  { label: 'Diversification', value: 'Good', good: true }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={item.good ? 'text-green-600' : 'text-amber-600'}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KEY METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-sm" onClick={() => navigate('/family-wealth')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Net Worth</p>
              <p className="text-2xl font-semibold">{formatCurrency(portfolio.summary.netWorth)}</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +12.4% YTD
              </p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-sm" onClick={() => navigate('/budget')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Monthly Cashflow</p>
              <p className="text-2xl font-semibold text-green-600">+{formatCurrency(monthlySavings)}</p>
              <p className="text-xs text-muted-foreground mt-1">{savingsRate.toFixed(0)}% savings rate</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-sm" onClick={() => navigate('/goal-tracker')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Goals Progress</p>
              <p className="text-2xl font-semibold">{GOALS_DATA.filter(g => g.onTrack).length}/{GOALS_DATA.length}</p>
              <p className="text-xs text-muted-foreground mt-1">on track</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-sm" onClick={() => navigate('/life-timeline')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Years to Retirement</p>
              <p className="text-2xl font-semibold">{whatIfParams.retirementAge - 45}</p>
              <p className="text-xs text-muted-foreground mt-1">Target age: {whatIfParams.retirementAge}</p>
            </CardContent>
          </Card>
        </div>

        {/* What-If Panel */}
        {showWhatIf && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">What-If Scenario Builder</CardTitle>
                <Button variant="ghost" size="sm" onClick={resetWhatIf} disabled={!whatIfMetrics.isModified}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{slider.label}</span>
                      <span className="font-medium">{whatIfParams[slider.key]}{slider.suffix}</span>
                    </div>
                    <Slider
                      value={[whatIfParams[slider.key]]}
                      onValueChange={(val) => setWhatIfParams(p => ({ ...p, [slider.key]: val[0] }))}
                      min={slider.min} max={slider.max} step={slider.step}
                    />
                  </div>
                ))}
              </div>
              {whatIfMetrics.isModified && (
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">New Retirement Balance</p>
                    <p className="text-lg font-semibold">{formatCompact(whatIfMetrics.projectedNetWorth)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">New Success Probability</p>
                    <p className="text-lg font-semibold">{whatIfMetrics.retirementProbability}%</p>
                  </div>
                  <div className="flex items-end">
                    <Button size="sm" onClick={() => navigate('/scenario-comparison')}>
                      Save Scenario <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* LIFE DECISION SIMULATOR */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Life Decision Simulator</CardTitle>
            </div>
            <CardDescription>See how major life decisions impact your financial future</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {LIFE_SCENARIOS.map((scenario) => {
                const Icon = scenario.icon;
                const isSelected = selectedScenario === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => handleScenarioClick(scenario.id)}
                    className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${
                      isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${scenario.color} mb-2`} />
                    <p className="text-sm font-medium">{scenario.name}</p>
                  </button>
                );
              })}
            </div>
            
            {/* Scenario Result */}
            {scenarioResult && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{scenarioResult.name}</h4>
                  <Badge variant={scenarioResult.probability_change < 0 ? "destructive" : "default"}>
                    {scenarioResult.probability_change > 0 ? '+' : ''}{scenarioResult.probability_change}% probability
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{scenarioResult.description}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Probability</p>
                    <p className="text-lg font-semibold">{Math.round(scenarioResult.base_probability)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">New Probability</p>
                    <p className={`text-lg font-semibold ${scenarioResult.probability_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.round(scenarioResult.new_probability)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Wealth Impact</p>
                    <p className={`text-lg font-semibold ${scenarioResult.wealth_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {scenarioResult.wealth_change >= 0 ? '+' : ''}{formatCompact(scenarioResult.wealth_change)}
                    </p>
                  </div>
                </div>
                <p className="text-sm mt-3 font-medium text-primary">{scenarioResult.recommendation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MAIN TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="brief">AI Insights</TabsTrigger>
            <TabsTrigger value="actions">Top Actions</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          {/* AI INSIGHTS TAB */}
          <TabsContent value="brief" className="mt-4 space-y-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Wealth Command Insights</CardTitle>
                </div>
                <CardDescription>AI-powered recommendations to optimize your financial position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Retirement Probability</p>
                      <p className="text-3xl font-bold">{Math.round(retirementProbability)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Potential with All Actions</p>
                      <p className="text-3xl font-bold text-green-600">{Math.min(95, Math.round(retirementProbability) + 15)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Impact</p>
                      <p className="text-2xl font-semibold text-green-600">+{formatCompact(totalPotentialImpact || 643000)}</p>
                    </div>
                  </div>
                </div>

                <p className="text-sm font-medium mb-3">Recommended Actions</p>
                <div className="space-y-3">
                  {(wealthBrief?.recommendations || recommendations.slice(0, 4) || [
                    { id: 1, title: "Increase super contributions", description: "+$500/month to reach concessional cap", impact: 380000, impact_text: "retirement wealth" },
                    { id: 2, title: "Refinance mortgage", description: "Switch to 5.89% rate", impact: 68000, impact_text: "interest saved" },
                    { id: 3, title: "Adjust portfolio allocation", description: "Increase growth assets by 10%", impact: 45000, impact_text: "+0.7% annual return" }
                  ]).map((action, i) => (
                    <div key={action.id || i} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{action.title}</p>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+{formatCompact(action.impact || action.impact_primary)}</p>
                        <p className="text-xs text-muted-foreground">{action.impact_text || action.impact_label}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate('/decision-engine')}>
                        <Play className="h-3 w-3 mr-1" /> Take Action
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button className="w-full mt-4" onClick={() => navigate('/ai-advisor')}>
                  <Sparkles className="h-4 w-4 mr-2" /> Get Personalized AI Analysis
                </Button>
              </CardContent>
            </Card>

            {/* Stress Test Results */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">Stress Test Results</CardTitle>
                </div>
                <CardDescription>How your plan holds up under adverse conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Scenario</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Success Rate</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stressTests.map((test, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3">{test.scenario}</td>
                        <td className="py-3 text-center font-medium">{Math.round(test.probability)}%</td>
                        <td className={`py-3 text-right font-medium ${test.change < 0 ? 'text-red-600' : test.change > 0 ? 'text-green-600' : ''}`}>
                          {test.change !== 0 && (test.change > 0 ? '+' : '')}{test.change}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/scenario-comparison')}>
                  Run More Stress Tests <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TOP ACTIONS TAB */}
          <TabsContent value="actions" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Recommended Actions</CardTitle>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Potential Impact</p>
                    <p className="text-lg font-semibold text-green-600">+{formatCompact(totalPotentialImpact || 643000)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 text-xs font-medium text-muted-foreground">Rank</th>
                      <th className="text-left py-3 text-xs font-medium text-muted-foreground">Action</th>
                      <th className="text-right py-3 text-xs font-medium text-muted-foreground">Impact</th>
                      <th className="text-center py-3 text-xs font-medium text-muted-foreground">Priority</th>
                      <th className="py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(wealthBrief?.recommendations || recommendations || [
                      { id: 1, title: "Increase super contributions", description: "+$500/month to cap", impact: 380000, difficulty: "easy" },
                      { id: 2, title: "Refinance mortgage", description: "Switch to 5.89%", impact: 68000, difficulty: "medium" },
                      { id: 3, title: "Adjust portfolio allocation", description: "+10% growth assets", impact: 45000, difficulty: "easy" },
                      { id: 4, title: "Build emergency fund", description: "6 months expenses", impact: 30000, difficulty: "medium" },
                      { id: 5, title: "Maximize franking credits", description: "Tax efficiency", impact: 12000, difficulty: "easy" },
                      { id: 6, title: "Review insurance coverage", description: "Income protection", impact: 8000, difficulty: "complex" }
                    ]).map((action, i) => (
                      <tr key={action.id || i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3">
                          <p className="font-medium text-sm">{action.title}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </td>
                        <td className="py-3 text-right font-semibold text-green-600">+{formatCompact(action.impact || action.impact_primary)}</td>
                        <td className="py-3 text-center">
                          <Badge variant={action.difficulty === 'easy' ? 'default' : action.difficulty === 'medium' ? 'secondary' : 'outline'}>
                            {action.difficulty || action.priority || 'medium'}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROJECTIONS TAB */}
          <TabsContent value="projections" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Net Worth Projection</CardTitle>
                  <div className="flex gap-6 text-sm">
                    <div><p className="text-muted-foreground">2025</p><p className="font-semibold">{formatCompact(portfolio.summary.netWorth)}</p></div>
                    <div><p className="text-muted-foreground">2040</p><p className="font-semibold text-green-600">{formatCompact(netWorthProjection[15]?.net_worth || 3900000)}</p></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={netWorthProjection.length > 0 ? netWorthProjection : [
                      { year: 2025, net_worth: 1978000 },
                      { year: 2028, net_worth: 2400000 },
                      { year: 2032, net_worth: 3100000 },
                      { year: 2036, net_worth: 3600000 },
                      { year: 2040, net_worth: 3900000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip formatter={(value) => [formatCurrency(value), "Net Worth"]} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <ReferenceLine y={3500000} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: 'Target', fontSize: 10 }} />
                      <Area type="monotone" dataKey="net_worth" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GOALS TAB */}
          <TabsContent value="goals" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Goal Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Goal</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Current</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Target</th>
                      <th className="py-2 px-4 font-medium text-muted-foreground">Progress</th>
                      <th className="text-center py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GOALS_DATA.map((goal) => (
                      <tr key={goal.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{goal.name}</td>
                        <td className="py-3 text-right">{formatCompact(goal.current)}</td>
                        <td className="py-3 text-right text-muted-foreground">{formatCompact(goal.target)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Progress value={goal.progress} className="h-2 flex-1" />
                            <span className="text-xs w-8 text-right">{goal.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant="secondary" className={goal.onTrack ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}>
                            {goal.onTrack ? 'On Track' : 'Behind'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONNECTED ACCOUNTS TAB */}
          <TabsContent value="accounts" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Connected Accounts</CardTitle>
                    <CardDescription>Link your financial accounts for automatic data sync</CardDescription>
                  </div>
                  <Button size="sm">
                    <Link2 className="h-4 w-4 mr-2" /> Connect Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CONNECTED_ACCOUNTS.map((account) => {
                    const Icon = ACCOUNT_ICONS[account.type] || Building;
                    return (
                      <div key={account.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{account.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" /> Connected
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">Synced {account.lastSync}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-6 pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Suggested Connections</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Australian Super', type: 'super' },
                      { name: 'Westpac', type: 'bank' },
                      { name: 'NAB', type: 'bank' },
                      { name: 'SelfWealth', type: 'brokerage' }
                    ].map((suggestion, i) => {
                      const Icon = ACCOUNT_ICONS[suggestion.type] || Building;
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 border border-dashed rounded-lg hover:bg-muted/50 cursor-pointer">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{suggestion.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{suggestion.type}</p>
                          </div>
                          <Button variant="outline" size="sm">Connect</Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
