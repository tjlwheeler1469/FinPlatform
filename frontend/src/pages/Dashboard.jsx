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
  Activity,
  ChevronRight,
  Wallet,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowUpRight,
  DollarSign,
  LineChart
} from "lucide-react";
import { usePortfolio } from "@/App";
import ChartContainer from "@/components/ChartContainer";
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
  const [monteCarloData, setMonteCarloData] = useState(null);
  const [healthScore, setHealthScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [netWorthProjection, setNetWorthProjection] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

        const [monteCarloRes, healthRes, recsRes, projectionRes] = await Promise.all([
          axios.post(`${API}/analyze/monte-carlo`, null, {
            params: {
              initial_value: portfolio.summary.netWorth,
              expected_return: whatIfParams.marketReturn / 100,
              volatility: 0.12,
              years: whatIfParams.retirementAge - 45,
              simulations: 1000
            }
          }),
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
        
        setMonteCarloData(monteCarloRes.data);
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

  const retirementProbability = monteCarloData?.success_probability || healthScore?.retirement_probability || 81;
  const monthlyIncome = portfolio.personal.taxableIncome / 12;
  const monthlyExpenses = 10000;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = (monthlySavings / monthlyIncome) * 100;

  // Total potential impact from recommendations
  const totalPotentialImpact = recommendations.reduce((sum, r) => sum + (r.impact_primary || 0), 0);

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Financial Decision Engine
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered insights to optimize your wealth
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
            <Button variant="outline" onClick={() => navigate("/scenarios")}>
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
                  {whatIfMetrics.isModified && <Badge className="bg-[#D4A84C] text-[#1a2744]">Modified</Badge>}
                </div>
                <Button variant="ghost" size="sm" onClick={resetWhatIf} disabled={!whatIfMetrics.isModified}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { key: 'savingsRate', label: 'Savings Rate', min: 5, max: 50, step: 1, suffix: '%', desc: '% of income saved monthly' },
                  { key: 'marketReturn', label: 'Market Return', min: 2, max: 12, step: 0.5, suffix: '%', desc: 'Expected annual return' },
                  { key: 'retirementAge', label: 'Retirement Age', min: 50, max: 70, step: 1, suffix: '', desc: 'Target retirement age' },
                  { key: 'inflationRate', label: 'Inflation', min: 1, max: 6, step: 0.5, suffix: '%', desc: 'Assumed inflation rate' }
                ].map(slider => (
                  <div key={slider.key} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">{slider.label}</label>
                      <span className="text-sm font-bold text-[#D4A84C]">{whatIfParams[slider.key]}{slider.suffix}</span>
                    </div>
                    <Slider
                      value={[whatIfParams[slider.key]]}
                      onValueChange={(val) => setWhatIfParams(p => ({ ...p, [slider.key]: val[0] }))}
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">{slider.desc}</p>
                  </div>
                ))}
              </div>

              {whatIfMetrics.isModified && (
                <div className="mt-4 pt-4 border-t border-border">
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
                    </div>
                    <div className="bg-background rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground">Success Probability</p>
                      <p className="text-lg font-bold">{whatIfMetrics.retirementProbability}%</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <Button onClick={() => navigate('/scenarios')} className="bg-[#1a2744] hover:bg-[#1a2744]/90">
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

        {/* SECTION 1: Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Worth */}
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#1a2744]/80 text-white border-none cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/family-wealth')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-white/70">Net Worth</p>
                <Wallet className="h-5 w-5 text-[#D4A84C]" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(portfolio.summary.netWorth)}</p>
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
              <p className="text-3xl font-bold text-green-600">+{formatCurrency(monthlySavings)}</p>
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
              <p className="text-3xl font-bold">{GOALS_DATA.filter(g => g.onTrack).length}/{GOALS_DATA.length}</p>
              <p className="text-sm text-muted-foreground mt-1">goals on track</p>
              <div className="flex gap-1 mt-2">
                {GOALS_DATA.map(g => (
                  <div key={g.id} className={`h-2 flex-1 rounded-full ${g.onTrack ? 'bg-green-500' : 'bg-amber-500'}`} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Retirement Success - PROMINENT */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-[#D4A84C]/30" onClick={() => navigate('/monte-carlo')}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Retirement Success</p>
                <PiggyBank className="h-5 w-5 text-[#D4A84C]" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{retirementProbability}%</p>
                <Badge className={retirementProbability >= 80 ? "bg-green-500" : "bg-amber-500"}>
                  {retirementProbability >= 80 ? "On Track" : "Review"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Monte Carlo: {retirementProbability}% probability
              </p>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: Financial Health + Top Actions (THE DECISION ENGINE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Financial Health Score - LARGE & PROMINENT */}
          <Card className="lg:col-span-4 bg-gradient-to-br from-[#1a2744]/5 to-[#D4A84C]/10 border-[#D4A84C]/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-[#D4A84C]" />
                Financial Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Large Score Display */}
              <div className="flex items-center justify-center py-6">
                <div className="relative">
                  <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="14" fill="none" className="text-muted/20" />
                    <circle
                      cx="80" cy="80" r="70"
                      stroke="url(#scoreGradient)" strokeWidth="14" fill="none"
                      strokeDasharray={`${(healthScore?.score || 78) * 4.4} 440`}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#D4A84C" />
                        <stop offset="100%" stopColor="#1a2744" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold">{healthScore?.score || 78}</span>
                    <Badge className="mt-2 bg-[#D4A84C] text-[#1a2744] text-lg px-3">
                      {healthScore?.grade || 'B+'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Score Components */}
              <div className="space-y-2 mt-2">
                {[
                  { label: 'Savings Rate', value: '15%', status: 'good' },
                  { label: 'Debt Ratio', value: '32%', status: 'good' },
                  { label: 'Emergency Fund', value: '4.2mo', status: 'warning' },
                  { label: 'Retirement Ready', value: `${retirementProbability}%`, status: 'good' },
                  { label: 'Diversification', value: 'Good', status: 'good' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className={`font-medium ${item.status === 'good' ? 'text-green-600' : 'text-amber-600'}`}>
                      {item.value} {item.status === 'good' ? '✓' : '⚠'}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/decision-engine')}>
                View Full Analysis
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* TOP ACTIONS - THE CORE DECISION ENGINE */}
          <Card className="lg:col-span-8">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Lightbulb className="h-6 w-6 text-[#D4A84C]" />
                    Recommended Actions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    AI-powered insights to optimize your wealth
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Potential Impact</p>
                  <p className="text-2xl font-bold text-green-600">+{formatCompact(totalPotentialImpact || 643000)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(recommendations.length > 0 ? recommendations.slice(0, 4) : [
                  { id: 1, title: "Increase super contributions", description: "Salary sacrifice $500/month to reach concessional cap", impact_primary: 520000, impact_label: "retirement balance", priority: "high", category: "super" },
                  { id: 2, title: "Refinance mortgage", description: "Switch to 5.89% rate to save on interest", impact_primary: 78000, impact_label: "interest saved", priority: "high", category: "debt" },
                  { id: 3, title: "Build emergency fund", description: "Increase from 4.2 to 6 months expenses", impact_primary: 45000, impact_label: "security buffer", priority: "medium", category: "savings" },
                  { id: 4, title: "Maximize franking credits", description: "Rebalance portfolio for tax efficiency", impact_primary: 8400, impact_label: "tax refund/year", priority: "medium", category: "tax" }
                ]).map((action, index) => {
                  const icons = { super: PiggyBank, debt: Home, savings: Shield, tax: Calculator };
                  const colors = { super: 'text-purple-600 bg-purple-50', debt: 'text-blue-600 bg-blue-50', savings: 'text-amber-600 bg-amber-50', tax: 'text-green-600 bg-green-50' };
                  const Icon = icons[action.category] || Lightbulb;
                  const colorClass = colors[action.category] || 'text-gray-600 bg-gray-50';
                  
                  return (
                    <div 
                      key={action.id}
                      className="flex items-center gap-4 p-4 rounded-xl border hover:border-[#D4A84C]/50 hover:bg-muted/30 transition-all cursor-pointer group"
                      onClick={() => navigate('/decision-engine')}
                    >
                      {/* Rank Badge */}
                      <div className="w-8 h-8 rounded-full bg-[#1a2744] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl ${colorClass.split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-6 w-6 ${colorClass.split(' ')[0]}`} />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{action.title}</p>
                          {action.priority === 'high' && (
                            <Badge className="bg-red-500 text-white text-[10px]">HIGH IMPACT</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                      
                      {/* Impact */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-green-600">
                          +{formatCompact(action.impact_primary)}
                        </p>
                        <p className="text-xs text-muted-foreground">{action.impact_label}</p>
                      </div>
                      
                      {/* Action Button */}
                      <Button 
                        size="sm" 
                        className="bg-[#1a2744] hover:bg-[#1a2744]/90 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); navigate('/decision-engine'); }}
                      >
                        Take Action
                        <ArrowUpRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  );
                })}
              </div>
              
              <Button className="w-full mt-4 bg-[#D4A84C] hover:bg-[#D4A84C]/90 text-[#1a2744]" onClick={() => navigate('/ai-advisor')}>
                <Sparkles className="h-4 w-4 mr-2" />
                Get Personalized AI Advice
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 3: Net Worth Projection + Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Net Worth Projection Chart - PROMINENT */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <LineChart className="h-5 w-5 text-[#D4A84C]" />
                  Net Worth Projection
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">2025</p>
                    <p className="font-bold">{formatCompact(portfolio.summary.netWorth)}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">2040</p>
                    <p className="font-bold text-green-600">{formatCompact(netWorthProjection[15]?.net_worth || 3900000)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer height={220}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={netWorthProjection.length > 0 ? netWorthProjection : [
                    { year: 2025, net_worth: 1978000 },
                    { year: 2027, net_worth: 2300000 },
                    { year: 2030, net_worth: 2800000 },
                    { year: 2035, net_worth: 3500000 },
                    { year: 2040, net_worth: 3900000 },
                    { year: 2045, net_worth: 4500000 }
                  ]}>
                    <defs>
                      <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value), "Net Worth"]}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <ReferenceLine y={3500000} stroke="#D4A84C" strokeDasharray="5 5" label={{ value: 'Target', fill: '#D4A84C', fontSize: 10 }} />
                    <Area type="monotone" dataKey="net_worth" stroke="#1a2744" strokeWidth={2} fill="url(#netWorthGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
              
              {/* Milestones */}
              <div className="flex justify-between mt-4 pt-4 border-t">
                {[
                  { year: 2027, label: '$2M', emoji: '💰' },
                  { year: 2032, label: '$3M', emoji: '💎' },
                  { year: 2038, label: '$4M', emoji: '🏆' }
                ].map((m, i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg">{m.emoji}</p>
                    <p className="font-bold">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.year}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Goal Progress */}
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
                            <Badge className="bg-green-500 text-white text-[10px]">On Track</Badge>
                          ) : (
                            <Badge className="bg-amber-500 text-white text-[10px]">Behind</Badge>
                          )}
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={goal.progress} className="h-3" />
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
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
