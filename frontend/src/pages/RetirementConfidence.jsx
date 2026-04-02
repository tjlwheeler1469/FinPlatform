import { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useLanguage } from '@/components/LanguageContext';
import { usePortfolio } from '@/App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Gauge, TrendingUp, TrendingDown, Shield, AlertTriangle, Zap, Brain,
  RefreshCw, Play, BarChart3, Activity, Target, Clock, DollarSign,
  PieChart, Lightbulb, ChevronRight, Info, CheckCircle2, XCircle,
  Users, Eye, UserCog, ArrowUp, ArrowDown, Flame, Snowflake,
  Download, Upload, Sparkles, Settings2
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Helper functions to replace nested ternaries
const getConfidenceRisk = (confidence) => {
  if (confidence >= 60) return ' with moderate risk.';
  if (confidence >= 40) return ' with elevated risk.';
  return ' and need immediate attention.';
};

const getDeltaColor = (delta) => {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-600';
};

const getDeltaBorderClass = (delta) => {
  if (delta > 0) return 'border-green-200 bg-green-50/50';
  if (delta < 0) return 'border-red-200 bg-red-50/50';
  return '';
};

const getDeltaBadgeClass = (delta) => {
  if (delta > 0) return 'bg-green-500';
  if (delta < 0) return 'bg-red-500';
  return 'bg-gray-500';
};

const getDeltaLabel = (delta) => {
  if (delta > 0) return 'Extended runway';
  if (delta < 0) return 'Increased risk';
  return 'No change';
};

const getDriverBarColor = (value, fallbackColor) => {
  if (value >= 80) return '#22c55e';
  if (value >= 50) return fallbackColor;
  return '#ef4444';
};

// ==================== PHASE 1: CLIENT POSITION SUMMARY ====================

const PositionSummary = ({ result, baselineResult }) => {
  if (!result) return null;

  const confidence = result.confidence_score || result.display?.today || 0;
  const getPosition = () => {
    if (confidence >= 80) return { status: 'On Track', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    if (confidence >= 60) return { status: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (confidence >= 40) return { status: 'At Risk', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { status: 'Critical', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const position = getPosition();
  
  // Identify risks and strengths from the result
  const risks = [];
  const strengths = [];
  const actions = [];

  const factors = result.confidence_breakdown?.raw_factors || {};
  
  if ((result.monte_carlo?.success_rate_percent || 0) < 75) risks.push('Low Monte Carlo success rate');
  if ((factors.income_stability || 0) < 0.5) risks.push('Unstable income sources');
  if ((factors.spending_flexibility || 0) < 0.4) risks.push('High essential spending');
  if ((factors.diversification || 0) < 0.5) risks.push('Concentrated portfolio');
  if ((factors.longevity_protection || 0) < 0.5) risks.push('Longevity risk exposure');
  
  if ((factors.monte_carlo_success || 0) >= 0.9) strengths.push('Strong success probability');
  if ((factors.income_stability || 0) >= 0.7) strengths.push('Stable income sources');
  if ((factors.diversification || 0) >= 0.7) strengths.push('Well diversified portfolio');
  if ((factors.spending_flexibility || 0) >= 0.5) strengths.push('Flexible spending capacity');

  // Generate actions based on weakest factors
  if ((factors.monte_carlo_success || 0) < 0.8) actions.push({ action: 'Delay retirement by 2 years', impact: '+13%' });
  if ((factors.spending_flexibility || 0) < 0.5) actions.push({ action: 'Reduce spending by 15%', impact: '+8%' });
  if ((factors.diversification || 0) < 0.6) actions.push({ action: 'Diversify into bonds', impact: '+5%' });

  return (
    <Card className={`border-2 ${position.border} ${position.bg}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Position Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Summary */}
        <div className={`p-4 rounded-lg bg-white border ${position.border}`}>
          <p className="text-lg">
            <span className={`font-bold ${position.color}`}>You are {position.status.toLowerCase()}</span> for retirement 
            {getConfidenceRisk(confidence)}
          </p>
          {risks.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium text-red-600">Main risks:</span> {risks.slice(0, 2).join(', ')}.
            </p>
          )}
          {actions.length > 0 && (
            <div className="text-sm mt-2">
              <span className="font-medium text-green-600">Biggest improvement:</span> {actions[0]?.action} 
              <Badge className="ml-2 bg-green-500">{actions[0]?.impact}</Badge>
            </div>
          )}
        </div>

        {/* Risks & Strengths Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Key Risks
            </p>
            <div className="space-y-1">
              {risks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No significant risks identified</p>
              ) : (
                risks.slice(0, 3).map((risk, i) => (
                  <div key={`item-${i}`} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {risk}
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-500" />
              Key Strengths
            </p>
            <div className="space-y-1">
              {strengths.length === 0 ? (
                <p className="text-sm text-muted-foreground">Building towards stability</p>
              ) : (
                strengths.slice(0, 3).map((strength, i) => (
                  <div key={`item-${i}`} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {strength}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Improvement Actions */}
        {actions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Improvement Actions
            </p>
            <div className="space-y-2">
              {actions.slice(0, 3).map((action, i) => (
                <div key={`item-${i}`} className="flex items-center justify-between p-2 bg-white rounded border">
                  <span className="text-sm">{action.action}</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {action.impact}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== PHASE 2: CONFIDENCE DRIVER VISUALIZATION ====================

const ConfidenceDrivers = ({ factors }) => {
  if (!factors) return null;

  const drivers = [
    { 
      name: 'Savings Strength', 
      key: 'monte_carlo_success',
      value: (factors.monte_carlo_success || 0) * 100,
      description: 'Probability of not running out of money',
      color: '#3b82f6'
    },
    { 
      name: 'Market Risk', 
      key: 'downside_protection',
      value: (factors.downside_protection || 0) * 100,
      description: 'Protection against market downturns',
      color: '#22c55e'
    },
    { 
      name: 'Longevity Risk', 
      key: 'longevity_protection',
      value: (factors.longevity_protection || 0) * 100,
      description: 'Runway beyond life expectancy',
      color: '#ec4899'
    },
    { 
      name: 'Spending Flexibility', 
      key: 'spending_flexibility',
      value: (factors.spending_flexibility || 0) * 100,
      description: 'Ability to reduce spending if needed',
      color: '#f59e0b'
    },
    { 
      name: 'Diversification', 
      key: 'diversification',
      value: (factors.diversification || 0) * 100,
      description: 'Asset allocation spread',
      color: '#06b6d4'
    },
  ];

  const getStatus = (value) => {
    if (value >= 80) return { label: 'Strong', icon: <ArrowUp className="h-3 w-3" />, color: 'text-green-600' };
    if (value >= 50) return { label: 'Moderate', icon: <Activity className="h-3 w-3" />, color: 'text-blue-600' };
    return { label: 'Weak', icon: <ArrowDown className="h-3 w-3" />, color: 'text-red-600' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Confidence Drivers
        </CardTitle>
        <CardDescription>
          Visual breakdown of your confidence score components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {drivers.map((driver) => {
            const status = getStatus(driver.value);
            return (
              <div key={driver.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{driver.name}</span>
                    <p className="text-xs text-muted-foreground">{driver.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${status.color}`}>
                      {driver.value.toFixed(0)}%
                    </span>
                    <Badge variant="outline" className={status.color}>
                      {status.icon}
                      <span className="ml-1">{status.label}</span>
                    </Badge>
                  </div>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${driver.value}%`, 
                      backgroundColor: getDriverBarColor(driver.value, driver.color)
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== PHASE 3: SCENARIO DELTA ENGINE ====================

const ScenarioDelta = ({ baselineResult, currentResult, scenarios }) => {
  if (!currentResult) return null;

  const baseConfidence = baselineResult?.confidence_score || baselineResult?.display?.today || 0;
  const currentConfidence = currentResult?.confidence_score || currentResult?.display?.today || 0;
  const delta = currentConfidence - baseConfidence;
  
  const baseMedian = baselineResult?.monte_carlo?.percentiles?.p50_median || 0;
  const currentMedian = currentResult?.monte_carlo?.percentiles?.p50_median || 0;
  const surplusDelta = currentMedian - baseMedian;

  const formatCurrency = (value) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card className={getDeltaBorderClass(delta)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          Scenario Impact
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Confidence Change */}
          <div className="text-center p-4 bg-white rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Confidence Change</p>
            <p className={`text-3xl font-bold ${getDeltaColor(delta)}`}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {baseConfidence.toFixed(0)}% → {currentConfidence.toFixed(0)}%
            </p>
          </div>
          
          {/* Surplus/Shortfall Change */}
          <div className="text-center p-4 bg-white rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Surplus Change</p>
            <p className={`text-3xl font-bold ${getDeltaColor(surplusDelta)}`}>
              {surplusDelta > 0 ? '+' : ''}{formatCurrency(surplusDelta)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Median outcome change
            </p>
          </div>
          
          {/* Key Driver */}
          <div className="text-center p-4 bg-white rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Primary Driver</p>
            <p className="text-lg font-bold text-purple-600">
              {getDeltaLabel(delta)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Impact source
            </p>
          </div>
        </div>

        {/* Scenario Comparison */}
        {scenarios && scenarios.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Scenario Comparison:</p>
            {scenarios.slice(0, 4).map((scenario, i) => (
              <div key={`item-${i}`} className="flex items-center justify-between p-2 bg-white rounded border">
                <span className="text-sm">{scenario.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{scenario.confidence?.toFixed(0)}%</span>
                  {scenario.delta_vs_base !== undefined && (
                    <Badge className={getDeltaBadgeClass(scenario.delta_vs_base)}>
                      {scenario.delta_vs_base > 0 ? '+' : ''}{scenario.delta_vs_base?.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== PHASE 4: LIVE VS PLAN CONFIDENCE ====================

const LiveVsPlanConfidence = ({ liveConfidence, planConfidence, mode }) => {
  const diff = (planConfidence || 0) - (liveConfidence || 0);
  
  const getColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card className="border-2 border-dashed border-purple-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-5 w-5 text-purple-500" />
          Live vs Planned Confidence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Live Confidence */}
          <div className={`p-4 rounded-lg ${mode === 'background' ? 'ring-2 ring-blue-500' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Live Confidence</span>
              {mode === 'background' && <Badge className="bg-blue-500 text-xs">Active</Badge>}
            </div>
            <p className="text-3xl font-bold" style={{ color: getColor(liveConfidence) }}>
              {(liveConfidence || 0).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time market conditions
            </p>
          </div>
          
          {/* Plan Confidence */}
          <div className={`p-4 rounded-lg ${mode === 'presentation' ? 'ring-2 ring-purple-500' : 'bg-slate-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <UserCog className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Planned Confidence</span>
              {mode === 'presentation' && <Badge className="bg-purple-500 text-xs">Active</Badge>}
            </div>
            <p className="text-3xl font-bold" style={{ color: getColor(planConfidence) }}>
              {(planConfidence || 0).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Advisor scenario
            </p>
          </div>
        </div>
        
        {/* Difference Indicator */}
        {Math.abs(diff) > 0.5 && (
          <div className={`mt-4 p-3 rounded-lg ${diff > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {diff > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${diff > 0 ? 'text-green-700' : 'text-red-700'}`}>
                Planned scenario is {Math.abs(diff).toFixed(1)}% {diff > 0 ? 'higher' : 'lower'} than live
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== CONFIDENCE GAUGE COMPONENT ====================

const ConfidenceGauge = ({ today, afterChanges, afterStress, isAdvanced }) => {
  const getColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#3b82f6';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const getLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'At Risk';
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Today */}
      <div className="text-center p-4 bg-slate-50 rounded-xl">
        <p className="text-sm text-muted-foreground mb-2">Today</p>
        <p className="text-4xl font-bold" style={{ color: getColor(today) }}>
          {today?.toFixed(0) || '--'}%
        </p>
        <p className="text-xs text-muted-foreground mt-1">{getLabel(today)}</p>
      </div>
      
      {/* After Changes */}
      <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
        <p className="text-sm text-muted-foreground mb-2">After Changes</p>
        <p className="text-4xl font-bold" style={{ color: getColor(afterChanges) }}>
          {afterChanges?.toFixed(0) || '--'}%
        </p>
        {afterChanges && today && (
          <p className={`text-xs mt-1 ${afterChanges > today ? 'text-green-600' : 'text-red-600'}`}>
            {afterChanges > today ? '+' : ''}{(afterChanges - today).toFixed(1)}%
          </p>
        )}
      </div>
      
      {/* After Market Stress */}
      <div className="text-center p-4 bg-red-50 rounded-xl border-2 border-red-200">
        <p className="text-sm text-muted-foreground mb-2">After Stress</p>
        <p className="text-4xl font-bold" style={{ color: getColor(afterStress) }}>
          {afterStress?.toFixed(0) || '--'}%
        </p>
        {afterStress && today && (
          <p className="text-xs text-red-600 mt-1">
            {(afterStress - today).toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
};

// ==================== FACTOR BREAKDOWN COMPONENT ====================

const FactorBreakdown = ({ factors }) => {
  if (!factors) return null;

  const factorData = [
    { name: 'Monte Carlo', value: factors.monte_carlo_success * 100, weight: 35, color: '#3b82f6' },
    { name: 'Downside Protection', value: factors.downside_protection * 100, weight: 20, color: '#22c55e' },
    { name: 'Income Stability', value: factors.income_stability * 100, weight: 15, color: '#8b5cf6' },
    { name: 'Spending Flexibility', value: factors.spending_flexibility * 100, weight: 10, color: '#f59e0b' },
    { name: 'Diversification', value: factors.diversification * 100, weight: 10, color: '#06b6d4' },
    { name: 'Longevity Protection', value: factors.longevity_protection * 100, weight: 10, color: '#ec4899' },
  ];

  return (
    <div className="space-y-3">
      {factorData.map((factor) => (
        <div key={factor.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>{factor.name}</span>
            <span className="font-medium">{factor.value.toFixed(0)}% ({factor.weight}% weight)</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${factor.value}%`, backgroundColor: factor.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const RetirementConfidence = ({ embedded = false }) => {
  const { t } = useLanguage();
  const portfolioCtx = usePortfolio();
  // Engine mode: 'quick' or 'advanced'
  const [engineMode, setEngineMode] = useState('advanced');
  
  // Input state
  const [currentAge, setCurrentAge] = useState(45);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [currentPortfolio, setCurrentPortfolio] = useState(800000);
  const [annualContributions, setAnnualContributions] = useState(30000);
  const [retirementSpending, setRetirementSpending] = useState(80000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [returnVolatility, setReturnVolatility] = useState(15);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [numSimulations, setNumSimulations] = useState(10000);
  const [enableDynamicSpending, setEnableDynamicSpending] = useState(true);
  
  // Auto-import from portfolio context on mount
  useEffect(() => {
    if (portfolioCtx?.portfolio?.summary) {
      const s = portfolioCtx.portfolio.summary;
      if (s.netWorth > 0) setCurrentPortfolio(s.netWorth);
      if (s.annualIncome > 0) setAnnualContributions(Math.round(s.annualIncome * 0.15)); // 15% savings rate
      if (s.netIncome > 0) setRetirementSpending(Math.round(s.netIncome * 0.7)); // 70% of current net income
    }
    if (portfolioCtx?.portfolio?.personal) {
      const p = portfolioCtx.portfolio.personal;
      if (p.age > 0) setCurrentAge(p.age);
    }
  }, [portfolioCtx?.portfolio?.summary, portfolioCtx?.portfolio?.personal]);
  
  // Mode state (Presentation vs Background)
  const [mode, setMode] = useState('presentation');
  
  // Result state
  const [result, setResult] = useState(null);
  const [baselineResult, setBaselineResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scenarios, setScenarios] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate confidence
  const calculateConfidence = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = engineMode === 'advanced' 
        ? `${API_URL}/api/hybrid-engine/calculate`
        : `${API_URL}/api/confidence-engine/quick-calculate`;
      
      const body = engineMode === 'advanced' ? {
        client_id: 'demo_client',
        current_age: currentAge,
        retirement_age: retirementAge,
        life_expectancy: lifeExpectancy,
        current_portfolio: currentPortfolio,
        annual_contributions: annualContributions,
        retirement_spending: retirementSpending,
        expected_return: expectedReturn / 100,
        return_volatility: returnVolatility / 100,
        inflation_rate: inflationRate / 100,
        num_simulations: numSimulations,
        enable_dynamic_spending: enableDynamicSpending,
        mode: mode
      } : {
        current_age: currentAge,
        retirement_age: retirementAge,
        life_expectancy: lifeExpectancy,
        current_portfolio: currentPortfolio,
        annual_contributions: annualContributions,
        retirement_spending: retirementSpending,
        expected_return: expectedReturn / 100,
        inflation_rate: inflationRate / 100
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Normalize data structure for both engines
        const normalizedResult = engineMode === 'advanced' ? data : {
          ...data,
          display: {
            today: data.confidence_score,
            after_stress: data.stressed_confidence || data.confidence_score * 0.85
          },
          monte_carlo: data.monte_carlo || {
            success_rate_percent: data.success_rate_percent,
            percentiles: data.percentiles
          },
          stress_tests: data.stress_tests || {
            base_case: { success_rate: data.success_rate_percent },
            market_crash_30pct: { success_rate: data.success_rate_percent * 0.9, impact: -data.success_rate_percent * 0.1 },
            high_inflation_6pct: { success_rate: data.success_rate_percent * 0.95, impact: -data.success_rate_percent * 0.05 },
            longevity_plus_5yrs: { success_rate: data.success_rate_percent * 0.92, impact: -data.success_rate_percent * 0.08 }
          },
          explanation: data.explanation || { summary: data.rating || 'Calculation complete' }
        };
        
        setResult(normalizedResult);
        
        // Set baseline on first calculation
        if (!baselineResult) {
          setBaselineResult(normalizedResult);
          setHasChanges(false);
        } else {
          setHasChanges(true);
        }
        
        toast.success(`Confidence: ${(normalizedResult.confidence_score || normalizedResult.display?.today)?.toFixed(1)}%`);
      } else {
        toast.error('Calculation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to calculate confidence');
    }
    setLoading(false);
  }, [currentAge, retirementAge, lifeExpectancy, currentPortfolio, annualContributions, 
      retirementSpending, expectedReturn, returnVolatility, inflationRate, numSimulations, 
      enableDynamicSpending, mode, engineMode, baselineResult]);

  // Get AI suggestions
  const getAiSuggestions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hybrid-engine/ai-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'demo_client',
          current_age: currentAge,
          retirement_age: retirementAge,
          life_expectancy: lifeExpectancy,
          current_portfolio: currentPortfolio,
          annual_contributions: annualContributions,
          retirement_spending: retirementSpending,
          expected_return: expectedReturn / 100,
          return_volatility: returnVolatility / 100,
          inflation_rate: inflationRate / 100,
          num_simulations: 5000,
          enable_dynamic_spending: enableDynamicSpending,
          mode: mode
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data);
        toast.success('AI suggestions loaded');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Compare scenarios
  const compareScenarios = async () => {
    try {
      const response = await fetch(`${API_URL}/api/hybrid-engine/compare-scenarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'demo_client',
          base_request: {
            client_id: 'demo_client',
            current_age: currentAge,
            retirement_age: retirementAge,
            life_expectancy: lifeExpectancy,
            current_portfolio: currentPortfolio,
            annual_contributions: annualContributions,
            retirement_spending: retirementSpending,
            expected_return: expectedReturn / 100,
            return_volatility: returnVolatility / 100,
            inflation_rate: inflationRate / 100,
            num_simulations: 5000,
            enable_dynamic_spending: enableDynamicSpending
          },
          scenarios: [
            { name: 'Retire 2 Years Later', retirement_age: retirementAge + 2 },
            { name: 'Reduce Spending 15%', retirement_spending: retirementSpending * 0.85 },
            { name: 'Increase Savings $20k', annual_contributions: annualContributions + 20000 }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setScenarios(data.scenarios);
        toast.success('Scenarios compared');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Import from Net Worth
  const importFromNetWorth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wealth-data/snapshot/demo_client`);
      if (response.ok) {
        const data = await response.json();
        if (data.assets) {
          let superTotal = 0;
          let investmentTotal = 0;
          
          data.assets.forEach(asset => {
            if (asset.type === 'super_accumulation' || asset.type === 'super_pension') {
              superTotal += asset.value || 0;
            } else {
              investmentTotal += asset.value || 0;
            }
          });
          
          const netWorth = superTotal + investmentTotal;
          if (netWorth > 0) {
            setCurrentPortfolio(netWorth);
            toast.success(`Imported net worth: ${formatCurrency(netWorth)}`);
            setTimeout(() => calculateConfidence(), 100);
          }
        }
        
        if (data.people && data.people.length > 0) {
          const primary = data.people.find(p => p.is_primary) || data.people[0];
          if (primary.current_age) setCurrentAge(primary.current_age);
          if (primary.retirement_age) setRetirementAge(primary.retirement_age);
          if (primary.life_expectancy) setLifeExpectancy(primary.life_expectancy);
        }
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast.error('Failed to import from Net Worth');
    }
  };

  // Download PDF Report
  const downloadPDF = async () => {
    if (!result) {
      toast.error('Please calculate first');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/documents/generate/confidence-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'demo_client',
          confidence_score: result.confidence_score || result.display?.today,
          risk_breakdown: result.confidence_breakdown,
          projections: result.monte_carlo,
          stress_tests: result.stress_tests,
          inputs: result.inputs,
          explanation: result.explanation
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RetirementConfidence_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('PDF downloaded');
      } else {
        toast.error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to download PDF');
    }
  };

  // Initial calculation
  useEffect(() => {
    calculateConfidence();
  }, []);

  // Recalculate when engine mode changes
  useEffect(() => {
    if (result) {
      setBaselineResult(null);
      calculateConfidence();
    }
  }, [engineMode]);

  const content = (
      <div className="space-y-6" data-testid="retirement-confidence">
        {/* Header */}
        {!embedded && (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('retirement.title')}</h1>
            <p className="text-muted-foreground">
              {t('retirement.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Engine Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={engineMode === 'quick' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setEngineMode('quick')}
              >
                <Zap className="h-4 w-4 mr-1" />
                Quick
              </Button>
              <Button
                variant={engineMode === 'advanced' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setEngineMode('advanced')}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Advanced
              </Button>
            </div>
            
            {/* Mode Toggle (Advanced only) */}
            {engineMode === 'advanced' && (
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                <Button
                  variant={mode === 'presentation' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('presentation')}
                >
                  <UserCog className="h-4 w-4 mr-1" />
                  Advisor
                </Button>
                <Button
                  variant={mode === 'background' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('background')}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Live
                </Button>
              </div>
            )}
            
            <Badge variant="outline">{numSimulations.toLocaleString()} simulations</Badge>
            
            <Button variant="outline" size="sm" onClick={importFromNetWorth}>
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            
            <Button variant="outline" size="sm" onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            
            <Button onClick={calculateConfidence} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Calculate
            </Button>
          </div>
        </div>
        )}

        {/* Main Confidence Display */}
        {result && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                {engineMode === 'advanced' ? 'Multi-Factor Confidence Score' : 'Retirement Confidence Score'}
                {engineMode === 'advanced' && <Badge variant="secondary">Advanced</Badge>}
              </CardTitle>
              <CardDescription>
                Based on {result.monte_carlo?.num_simulations?.toLocaleString() || numSimulations.toLocaleString()} Monte Carlo simulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfidenceGauge
                today={baselineResult?.display?.today || result.display?.today || result.confidence_score}
                afterChanges={hasChanges ? (result.display?.today || result.confidence_score) : (baselineResult?.display?.today || result.display?.today || result.confidence_score)}
                afterStress={result.display?.after_stress || result.stressed_confidence}
                isAdvanced={engineMode === 'advanced'}
              />
              
              {/* Change indicator */}
              {hasChanges && baselineResult && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-blue-700">
                      Scenario modified. 
                      Delta: {(((result.display?.today || result.confidence_score) || 0) - ((baselineResult.display?.today || baselineResult.confidence_score) || 0)).toFixed(1)}%
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setBaselineResult(result);
                        setHasChanges(false);
                        toast.info('Baseline reset');
                      }}
                      className="ml-auto"
                    >
                      Set as Baseline
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold text-blue-600">
                    {(result.monte_carlo?.success_rate_percent || result.success_rate_percent)?.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Median Outcome</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(result.monte_carlo?.percentiles?.p50_median || result.percentiles?.p50)}
                  </p>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">10th Percentile</p>
                  <p className="text-xl font-bold text-amber-600">
                    {formatCurrency(result.monte_carlo?.percentiles?.p10 || result.percentiles?.p10)}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-muted-foreground">90th Percentile</p>
                  <p className="text-xl font-bold text-purple-600">
                    {formatCurrency(result.monte_carlo?.percentiles?.p90 || result.percentiles?.p90)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inputs">Inputs</TabsTrigger>
            <TabsTrigger value="factors" disabled={engineMode !== 'advanced'}>Factors</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="ai">AI Assist</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Phase 1: Position Summary */}
            {result && (
              <PositionSummary result={result} baselineResult={baselineResult} />
            )}

            {/* Phase 4: Live vs Plan Confidence */}
            {engineMode === 'advanced' && result && (
              <LiveVsPlanConfidence 
                liveConfidence={result.display?.today || result.confidence_score}
                planConfidence={baselineResult?.display?.today || baselineResult?.confidence_score || result.display?.today || result.confidence_score}
                mode={mode}
              />
            )}

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Phase 2: Confidence Drivers */}
              {engineMode === 'advanced' && result?.confidence_breakdown?.raw_factors && (
                <ConfidenceDrivers factors={result.confidence_breakdown.raw_factors} />
              )}

              {/* Phase 3: Scenario Delta */}
              {result && (
                <ScenarioDelta 
                  baselineResult={baselineResult || result}
                  currentResult={result}
                  scenarios={scenarios}
                />
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Stress Tests */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Stress Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result?.stress_tests && (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Base Case</span>
                          <span className="font-medium">{result.stress_tests.base_case?.success_rate?.toFixed(1)}%</span>
                        </div>
                        <Progress value={result.stress_tests.base_case?.success_rate} />
                      </div>
                      
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Market Crash (-30%)</span>
                          <span className="font-medium text-red-600">
                            {result.stress_tests.market_crash_30pct?.success_rate?.toFixed(1)}%
                            <span className="text-xs ml-1">({result.stress_tests.market_crash_30pct?.impact?.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <Progress value={result.stress_tests.market_crash_30pct?.success_rate} className="bg-red-100" />
                      </div>
                      
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">High Inflation (6%)</span>
                          <span className="font-medium text-amber-600">
                            {result.stress_tests.high_inflation_6pct?.success_rate?.toFixed(1)}%
                            <span className="text-xs ml-1">({result.stress_tests.high_inflation_6pct?.impact?.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <Progress value={result.stress_tests.high_inflation_6pct?.success_rate} className="bg-amber-100" />
                      </div>
                      
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Live 5 Years Longer</span>
                          <span className="font-medium text-purple-600">
                            {result.stress_tests.longevity_plus_5yrs?.success_rate?.toFixed(1)}%
                            <span className="text-xs ml-1">({result.stress_tests.longevity_plus_5yrs?.impact?.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <Progress value={result.stress_tests.longevity_plus_5yrs?.success_rate} className="bg-purple-100" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Explanation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result?.explanation && (
                    <div className="space-y-4">
                      <p className="text-sm">{result.explanation.summary}</p>
                      
                      {result.explanation.identified_risks?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Identified Risks:</h4>
                          <div className="space-y-2">
                            {result.explanation.identified_risks.map((risk, i) => (
                              <div key={`item-${i}`} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">{risk.factor}</p>
                                  <p className="text-xs text-muted-foreground">{risk.explanation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {result.explanation.recommendations?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
                          <div className="space-y-2">
                            {result.explanation.recommendations.slice(0, 3).map((rec, i) => (
                              <div key={`item-${i}`} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                                <Lightbulb className="h-4 w-4 text-green-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">{rec.action}</p>
                                  <p className="text-xs text-muted-foreground">{rec.impact}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inputs Tab */}
          <TabsContent value="inputs" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Personal Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Current Age: {currentAge}</Label>
                    <Slider
                      value={[currentAge]}
                      onValueChange={([v]) => setCurrentAge(v)}
                      min={25}
                      max={80}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Retirement Age: {retirementAge}</Label>
                    <Slider
                      value={[retirementAge]}
                      onValueChange={([v]) => setRetirementAge(v)}
                      min={currentAge + 1}
                      max={80}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Life Expectancy: {lifeExpectancy}</Label>
                    <Slider
                      value={[lifeExpectancy]}
                      onValueChange={([v]) => setLifeExpectancy(v)}
                      min={retirementAge + 5}
                      max={105}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Financial Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Current Portfolio: {formatCurrency(currentPortfolio)}</Label>
                    <Slider
                      value={[currentPortfolio]}
                      onValueChange={([v]) => setCurrentPortfolio(v)}
                      min={0}
                      max={10000000}
                      step={50000}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Annual Contributions: {formatCurrency(annualContributions)}</Label>
                    <Slider
                      value={[annualContributions]}
                      onValueChange={([v]) => setAnnualContributions(v)}
                      min={0}
                      max={200000}
                      step={5000}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Retirement Spending: {formatCurrency(retirementSpending)}/year</Label>
                    <Slider
                      value={[retirementSpending]}
                      onValueChange={([v]) => setRetirementSpending(v)}
                      min={30000}
                      max={300000}
                      step={5000}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Assumptions (Advanced only) */}
              {engineMode === 'advanced' && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="h-5 w-5" />
                      Market Assumptions
                      <Badge variant="secondary">Advanced</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <Label>Expected Return: {expectedReturn}%</Label>
                        <Slider
                          value={[expectedReturn]}
                          onValueChange={([v]) => setExpectedReturn(v)}
                          min={2}
                          max={12}
                          step={0.5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Volatility: {returnVolatility}%</Label>
                        <Slider
                          value={[returnVolatility]}
                          onValueChange={([v]) => setReturnVolatility(v)}
                          min={5}
                          max={30}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Inflation: {inflationRate}%</Label>
                        <Slider
                          value={[inflationRate]}
                          onValueChange={([v]) => setInflationRate(v)}
                          min={1}
                          max={8}
                          step={0.5}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-6">
                        <Label>Dynamic Spending</Label>
                        <Switch
                          checked={enableDynamicSpending}
                          onCheckedChange={setEnableDynamicSpending}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Factors Tab (Advanced only) */}
          <TabsContent value="factors" className="space-y-6">
            {engineMode === 'advanced' && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Confidence Factor Breakdown</CardTitle>
                    <CardDescription>
                      Each factor contributes to your overall confidence score
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FactorBreakdown factors={result?.confidence_breakdown?.raw_factors} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Factor Contributions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {result?.confidence_breakdown?.factor_contributions && (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <BarChart
                            data={Object.entries(result.confidence_breakdown.factor_contributions).map(([k, v]) => ({
                              name: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                              value: v
                            }))}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 40]} />
                            <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={compareScenarios}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare Scenarios
              </Button>
            </div>

            {scenarios.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {scenarios.map((scenario, i) => (
                  <Card key={`item-${i}`} className={i === 0 ? 'border-primary' : ''}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{scenario.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{scenario.confidence?.toFixed(0)}%</p>
                      {scenario.delta_vs_base !== undefined && (
                        <p className={`text-sm ${getDeltaColor(scenario.delta_vs_base)}`}>
                          {scenario.delta_vs_base > 0 ? '+' : ''}{scenario.delta_vs_base?.toFixed(1)}% vs current
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        MC Success: {scenario.monte_carlo_success?.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* AI Assist Tab */}
          <TabsContent value="ai" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={getAiSuggestions}>
                <Brain className="h-4 w-4 mr-2" />
                Get AI Suggestions
              </Button>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                AI suggestions require advisor approval. No automatic changes will be made.
              </AlertDescription>
            </Alert>

            {aiSuggestions && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Identified Risks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiSuggestions.identified_risks?.map((risk, i) => (
                        <div key={`item-${i}`} className="p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="font-medium">{risk.factor}</span>
                            <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'}>
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{risk.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiSuggestions.ai_suggestions?.map((suggestion, i) => (
                        <div key={`item-${i}`} className="p-3 bg-green-50 rounded-lg">
                          <p className="font-medium text-sm">{suggestion.suggestion}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-green-600">
                              {suggestion.current_confidence?.toFixed(0)}% → {suggestion.projected_confidence?.toFixed(0)}%
                              <span className="font-bold ml-1">
                                ({suggestion.delta > 0 ? '+' : ''}{suggestion.delta?.toFixed(1)}%)
                              </span>
                            </span>
                            <Badge variant="outline">
                              {suggestion.auto_applied ? 'Auto' : 'Manual'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.action_required}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default RetirementConfidence;
