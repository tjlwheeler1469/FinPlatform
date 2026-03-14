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
  ArrowRight,
  BarChart3,
  Lightbulb,
  CheckCircle,
  Target,
  Shield,
  Sparkles,
  RefreshCw,
  Zap,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  LineChart,
  Link2,
  Building,
  CreditCard,
  Landmark,
  AlertTriangle,
  Play,
  Brain,
  Home,
  Briefcase,
  TrendingDown,
  Gift,
  Calendar,
  PiggyBank,
  Percent,
  Clock,
  DollarSign
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
  ReferenceLine
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

// Life Decision Scenarios
const LIFE_SCENARIOS = [
  { id: "retire_early_5", name: "Retire 5 years early", icon: Calendar, color: "text-blue-600" },
  { id: "retire_late_5", name: "Retire 5 years later", icon: Clock, color: "text-green-600" },
  { id: "increase_savings_500", name: "Save +$500/month", icon: PiggyBank, color: "text-emerald-600" },
  { id: "increase_savings_1000", name: "Save +$1,000/month", icon: DollarSign, color: "text-teal-600" },
  { id: "buy_property", name: "Buy investment property", icon: Home, color: "text-purple-600" },
  { id: "market_crash", name: "30% market crash", icon: TrendingDown, color: "text-red-600" },
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
  const [showScenarioBuilder, setShowScenarioBuilder] = useState(false);
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
              years: 25,
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
  
  const resetWhatIf = () => {
    setWhatIfParams(DEFAULT_WHATIF);
    setSelectedScenario(null);
    setScenarioResult(null);
  };

  // Key metrics
  const retirementProbability = monteCarloResult?.success_probability || 50;
  const projectedBalance = monteCarloResult?.median_outcome || 3200000;
  const safeSpending = Math.round(projectedBalance * 0.04); // 4% rule
  const monthlyRetirementIncome = Math.round(safeSpending / 12);
  const monthlyIncome = portfolio.personal.taxableIncome / 12;
  const monthlyExpenses = 10000;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const currentSavingsRate = (monthlySavings / monthlyIncome) * 100;
  const totalPotentialImpact = wealthBrief?.total_impact || 800000;
  const yearsToRetirement = whatIfParams.retirementAge - 45;

  // Scenario comparison for the slider
  const scenarioComparisons = useMemo(() => {
    const baseProb = retirementProbability;
    return [
      { age: 55, probability: Math.max(20, baseProb - 25), label: "Retire at 55" },
      { age: 60, probability: baseProb, label: "Retire at 60", current: whatIfParams.retirementAge === 60 },
      { age: 65, probability: Math.min(95, baseProb + 18), label: "Retire at 65" },
      { age: 70, probability: Math.min(99, baseProb + 30), label: "Retire at 70" },
    ];
  }, [retirementProbability, whatIfParams.retirementAge]);

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Your Financial Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Wheeler Family • Powered by AI</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={showScenarioBuilder ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowScenarioBuilder(!showScenarioBuilder)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Scenario Builder
            </Button>
            <Button size="sm" onClick={() => navigate("/ai-advisor")}>
              <Sparkles className="h-4 w-4 mr-2" />
              AI Advisor
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ENGINE 1: RETIREMENT SUCCESS ENGINE (Monte Carlo)
            The HERO metric - "Will I run out of money?"
        ═══════════════════════════════════════════════════════════════════ */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-slate-50 to-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Probability Display */}
              <div className="lg:col-span-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">RETIREMENT READINESS</span>
                </div>
                
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-6xl font-bold tracking-tight">{Math.round(retirementProbability)}%</span>
                  <Badge 
                    variant={retirementProbability >= 80 ? "default" : retirementProbability >= 60 ? "secondary" : "destructive"}
                    className={retirementProbability >= 80 ? "bg-green-500" : retirementProbability >= 60 ? "bg-amber-500" : "bg-red-500"}
                  >
                    {retirementProbability >= 80 ? "On Track" : retirementProbability >= 60 ? "Needs Attention" : "At Risk"}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  Probability of retirement success based on 10,000 Monte Carlo simulations
                </p>

                {/* Risk indicator */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Risk of running out of money</span>
                    <span className="font-semibold text-red-600">{Math.round(100 - retirementProbability)}%</span>
                  </div>
                  <Progress 
                    value={100 - retirementProbability} 
                    className="h-2"
                  />
                </div>
              </div>

              {/* Key Retirement Metrics */}
              <div className="lg:col-span-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Safe Annual Spending</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(safeSpending)}</p>
                    <p className="text-xs text-muted-foreground">per year in retirement</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Income</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlyRetirementIncome)}</p>
                    <p className="text-xs text-muted-foreground">sustainable withdrawal</p>
                  </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg border shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Projected Retirement Balance</p>
                      <p className="text-2xl font-bold">{formatCompact(projectedBalance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Retirement Age</p>
                      <p className="text-2xl font-bold">{whatIfParams.retirementAge}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monte Carlo Stats */}
              <div className="lg:col-span-3">
                <p className="text-xs font-medium text-muted-foreground mb-3">MONTE CARLO OUTCOMES</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="text-xs text-muted-foreground">Best Case (95th)</span>
                    <span className="font-semibold text-green-600">{formatCompact(monteCarloResult?.best_case || 8000000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="text-xs text-muted-foreground">Median Outcome</span>
                    <span className="font-semibold">{formatCompact(projectedBalance)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="text-xs text-muted-foreground">Worst Case (5th)</span>
                    <span className="font-semibold text-red-600">{formatCompact(monteCarloResult?.worst_case || 2000000)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-amber-50 rounded">
                    <span className="text-xs text-muted-foreground">Shortfall Risk</span>
                    <span className="font-semibold text-amber-600">{monteCarloResult?.shortfall_risk || 5}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            ENGINE 2: SCENARIO SIMULATOR
            Interactive "What If" modeling
        ═══════════════════════════════════════════════════════════════════ */}
        {showScenarioBuilder && (
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-lg">Scenario Simulator</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={resetWhatIf}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Reset
                </Button>
              </div>
              <CardDescription>Move the sliders to see how changes affect your retirement probability</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Retirement Age Comparison */}
              <div className="mb-6 p-4 bg-white rounded-lg border">
                <p className="text-sm font-medium mb-4">Retirement Age Impact</p>
                <div className="grid grid-cols-4 gap-4">
                  {scenarioComparisons.map((scenario) => (
                    <button
                      key={scenario.age}
                      onClick={() => setWhatIfParams(p => ({ ...p, retirementAge: scenario.age }))}
                      className={`p-4 rounded-lg text-center transition-all ${
                        whatIfParams.retirementAge === scenario.age 
                          ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <p className="text-xs opacity-80">{scenario.label}</p>
                      <p className="text-3xl font-bold">{scenario.probability}%</p>
                      <p className="text-xs opacity-80">success</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameter Sliders */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { key: 'savingsRate', label: 'Savings Rate', min: 5, max: 40, step: 1, suffix: '%', color: 'text-emerald-600' },
                  { key: 'marketReturn', label: 'Expected Return', min: 3, max: 10, step: 0.5, suffix: '%', color: 'text-blue-600' },
                  { key: 'retirementAge', label: 'Retirement Age', min: 50, max: 70, step: 1, suffix: '', color: 'text-purple-600' },
                  { key: 'inflationRate', label: 'Inflation', min: 2, max: 6, step: 0.5, suffix: '%', color: 'text-red-600' }
                ].map(slider => (
                  <div key={slider.key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{slider.label}</span>
                      <span className={`font-bold ${slider.color}`}>
                        {whatIfParams[slider.key]}{slider.suffix}
                      </span>
                    </div>
                    <Slider
                      value={[whatIfParams[slider.key]]}
                      onValueChange={(val) => setWhatIfParams(p => ({ ...p, [slider.key]: val[0] }))}
                      min={slider.min} max={slider.max} step={slider.step}
                      className="cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Life Decision Quick Scenarios */}
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium mb-3">Quick Life Decisions</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {LIFE_SCENARIOS.map((scenario) => {
                    const Icon = scenario.icon;
                    const isSelected = selectedScenario === scenario.id;
                    return (
                      <button
                        key={scenario.id}
                        onClick={() => handleScenarioClick(scenario.id)}
                        className={`p-3 rounded-lg border text-center transition-all hover:shadow-md ${
                          isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mx-auto ${scenario.color} mb-1`} />
                        <p className="text-xs font-medium leading-tight">{scenario.name}</p>
                      </button>
                    );
                  })}
                </div>
                
                {/* Scenario Result */}
                {scenarioResult && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{scenarioResult.name}</h4>
                      <Badge variant={scenarioResult.probability_change < 0 ? "destructive" : "default"}>
                        {scenarioResult.probability_change > 0 ? '+' : ''}{scenarioResult.probability_change}% probability
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{scenarioResult.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Current</p>
                        <p className="text-xl font-bold">{Math.round(scenarioResult.base_probability)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">After Change</p>
                        <p className={`text-xl font-bold ${scenarioResult.probability_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {Math.round(scenarioResult.new_probability)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Wealth Impact</p>
                        <p className={`text-xl font-bold ${scenarioResult.wealth_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {scenarioResult.wealth_change >= 0 ? '+' : ''}{formatCompact(scenarioResult.wealth_change)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ENGINE 3: AI FINANCIAL RECOMMENDATIONS
            The "AI Wealth Brief" - Actionable advice
        ═══════════════════════════════════════════════════════════════════ */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Brain className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-amber-400 text-sm font-medium">AI WEALTH INSIGHTS</p>
                <h2 className="text-xl font-bold mt-1">
                  {wealthBrief?.headline || `You can retire at ${wealthBrief?.optimal_retirement_age || whatIfParams.retirementAge}`}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">Potential Impact</p>
                <p className="text-2xl font-bold text-amber-400">+{formatCompact(totalPotentialImpact)}</p>
              </div>
            </div>

            {/* Current vs Recommended */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-white/5 rounded-lg">
              <div>
                <p className="text-xs text-white/60 mb-1">Your savings rate</p>
                <p className="text-3xl font-bold">{Math.round(currentSavingsRate)}%</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Recommended</p>
                <p className="text-3xl font-bold text-amber-400">20%</p>
              </div>
            </div>

            {/* Key Insight */}
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-white/90 text-sm">
                {wealthBrief?.key_insight || `Increasing savings by $${Math.round((0.20 - currentSavingsRate/100) * portfolio.personal.taxableIncome / 12).toLocaleString()}/month → +${formatCompact(totalPotentialImpact)} retirement wealth`}
              </p>
            </div>

            {/* Top 3 Recommendations */}
            <p className="text-xs text-white/60 mb-3">TOP 3 IMPROVEMENTS</p>
            <div className="space-y-3">
              {(wealthBrief?.recommendations || [
                { title: "Increase super contributions", impact: 380000, impact_text: "Salary sacrifice to concessional cap" },
                { title: "Refinance mortgage", impact: 68000, impact_text: "Switch to lower rate" },
                { title: "Increase equity allocation", impact: 45000, impact_text: "Shift 10% from bonds to growth" }
              ]).slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{rec.title}</p>
                    <p className="text-xs text-white/60">{rec.description || rec.impact_text}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-400">+{formatCompact(rec.impact)}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900" 
              onClick={() => navigate('/ai-advisor')}
            >
              <Sparkles className="h-4 w-4 mr-2" /> Get Full AI Analysis
            </Button>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            SUPPORTING METRICS ROW
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Financial Health Score */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/health-score')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Financial Health</p>
                <Badge variant="secondary">{healthScore?.grade || 'B+'}</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 transform -rotate-90">
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/20" />
                    <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" 
                      className="text-primary" 
                      strokeDasharray={`${(healthScore?.score || 78) * 1.5} 150`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{healthScore?.score || 78}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>out of 100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Worth */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/family-wealth')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(portfolio.summary.netWorth)}</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +12.4% YTD
              </p>
            </CardContent>
          </Card>

          {/* Monthly Cashflow */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/budget')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Monthly Savings</p>
              <p className="text-2xl font-bold text-green-600">+{formatCurrency(monthlySavings)}</p>
              <p className="text-xs text-muted-foreground mt-1">{currentSavingsRate.toFixed(0)}% savings rate</p>
            </CardContent>
          </Card>

          {/* Years to Retirement */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/life-timeline')}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Years to Retirement</p>
              <p className="text-2xl font-bold">{yearsToRetirement}</p>
              <p className="text-xs text-muted-foreground mt-1">Target age: {whatIfParams.retirementAge}</p>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            NET WORTH PROJECTION CHART
        ═══════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Net Worth Projection</CardTitle>
                <CardDescription>Your wealth trajectory over time</CardDescription>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Today</p>
                  <p className="font-semibold">{formatCompact(portfolio.summary.netWorth)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">At Retirement</p>
                  <p className="font-semibold text-green-600">{formatCompact(projectedBalance)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netWorthProjection.length > 0 ? netWorthProjection : [
                  { year: 2025, net_worth: 1978000 },
                  { year: 2030, net_worth: 2800000 },
                  { year: 2035, net_worth: 4000000 },
                  { year: 2040, net_worth: 5500000 },
                  { year: 2045, net_worth: 7200000 },
                  { year: 2050, net_worth: 9500000 }
                ]}>
                  <defs>
                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), "Net Worth"]} 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} 
                  />
                  <ReferenceLine 
                    y={3500000} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5" 
                    label={{ value: 'Target', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="net_worth" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    fill="url(#colorNetWorth)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            GOAL PROGRESS
        ═══════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Goal Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Retirement", target: 3500000, current: portfolio.summary.netWorth, icon: Target },
                { name: "Education Fund", target: 200000, current: 182000, icon: Calendar },
                { name: "House Upgrade", target: 500000, current: 245000, icon: Home },
                { name: "Emergency Fund", target: 60000, current: 75000, icon: Shield }
              ].map((goal, i) => {
                const progress = Math.min(100, (goal.current / goal.target) * 100);
                const Icon = goal.icon;
                return (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{goal.name}</p>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <p className="text-2xl font-bold">{Math.round(progress)}%</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCompact(goal.current)} / {formatCompact(goal.target)}
                      </p>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <Badge 
                      variant="secondary" 
                      className={`mt-2 ${progress >= 100 ? 'bg-green-50 text-green-700' : progress >= 70 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}
                    >
                      {progress >= 100 ? 'Achieved!' : progress >= 70 ? 'On Track' : 'Behind'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('/scenario-comparison')}>
            <BarChart3 className="h-4 w-4 mr-2" /> Compare Scenarios
          </Button>
          <Button variant="outline" onClick={() => navigate('/life-timeline')}>
            <Calendar className="h-4 w-4 mr-2" /> Life Timeline
          </Button>
          <Button variant="outline" onClick={() => navigate('/client-crm')}>
            <Building className="h-4 w-4 mr-2" /> Client CRM
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
