import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Target, TrendingUp, TrendingDown, DollarSign, PiggyBank, Shield, Users, Calendar,
  AlertTriangle, Plus, Trash2, Play, RefreshCw, Info, BarChart3, Zap, ChevronRight,
  Clock, Activity, Brain, Lightbulb, CheckCircle2, XCircle, ArrowRight, ArrowUp, ArrowDown,
  Gauge, CircleDollarSign, Building2, Briefcase, Heart, Flame, Snowflake, Download, FileDown,
  Eye, UserCog, History, UsersRound
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar
} from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== CONFIDENCE GAUGE COMPONENT ====================

const ConfidenceGauge = ({ score, size = 220 }) => {
  const getColor = (s) => {
    if (s >= 90) return '#22c55e';
    if (s >= 75) return '#3b82f6';
    if (s >= 50) return '#f59e0b';
    if (s >= 25) return '#f97316';
    return '#ef4444';
  };

  const getStatus = (s) => {
    if (s >= 90) return 'Excellent';
    if (s >= 75) return 'Good';
    if (s >= 50) return 'Moderate';
    if (s >= 25) return 'Concerning';
    return 'Critical';
  };

  const color = getColor(score);
  const status = getStatus(score);
  
  // Calculate the arc for the gauge (semi-circle)
  const radius = 80;
  const strokeWidth = 16;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const angle = (normalizedScore / 100) * 180; // 0 to 180 degrees
  
  // SVG arc calculation
  const startX = 20;
  const startY = 100;
  const endAngleRad = (180 - angle) * (Math.PI / 180);
  const endX = 100 + radius * Math.cos(endAngleRad);
  const endY = 100 - radius * Math.sin(endAngleRad);
  const largeArc = angle > 90 ? 1 : 0;
  
  // Background arc (full semi-circle)
  const bgPath = `M ${20} ${100} A ${radius} ${radius} 0 0 1 ${180} ${100}`;
  // Score arc
  const scorePath = normalizedScore > 0 
    ? `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`
    : '';

  return (
    <div className="flex flex-col items-center" data-testid="confidence-gauge">
      <div className="relative" style={{ width: size, height: size / 2 + 50 }}>
        <svg viewBox="0 0 200 130" className="w-full h-full">
          {/* Background arc */}
          <path
            d={bgPath}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Score arc */}
          {normalizedScore > 0 && (
            <path
              d={scorePath}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            />
          )}
          {/* Center text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="font-bold"
            style={{ fontSize: '36px', fill: color }}
          >
            {score.toFixed(0)}%
          </text>
          <text
            x="100"
            y="120"
            textAnchor="middle"
            className="font-medium"
            style={{ fontSize: '14px', fill: '#6b7280' }}
          >
            {status}
          </text>
        </svg>
        
        {/* Tick marks */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-between px-4 text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

// ==================== RISK BREAKDOWN COMPONENT ====================

const RiskBreakdown = ({ risks }) => {
  const riskItems = [
    { key: 'longevity_risk', label: 'Longevity', icon: Clock, color: '#8b5cf6', description: 'Risk of outliving savings' },
    { key: 'market_risk', label: 'Market', icon: TrendingDown, color: '#ef4444', description: 'Investment volatility risk' },
    { key: 'spending_risk', label: 'Spending', icon: DollarSign, color: '#f59e0b', description: 'Expense level risk' },
    { key: 'inflation_risk', label: 'Inflation', icon: Flame, color: '#f97316', description: 'Purchasing power erosion' },
  ];

  const totalRisk = Object.values(risks).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {riskItems.map((item) => {
        const value = risks[item.key] || 0;
        const Icon = item.icon;
        return (
          <div key={item.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" style={{ color: item.color }} />
                <span className="font-medium">{item.label}</span>
              </div>
              <span className="font-bold" style={{ color: item.color }}>{value.toFixed(1)}%</span>
            </div>
            <Progress value={totalRisk > 0 ? (value / totalRisk) * 100 : 0} className="h-2" />
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};

// ==================== SCENARIO CARD COMPONENT ====================

const ScenarioCard = ({ scenario, isBase, onSelect, selected }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card 
      className={`cursor-pointer transition-all ${selected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
      onClick={() => onSelect(scenario.scenario_id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{scenario.name}</CardTitle>
          {isBase && <Badge variant="outline">Current</Badge>}
        </div>
        {scenario.description && (
          <CardDescription>{scenario.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <span className={`text-4xl font-bold ${getScoreColor(scenario.confidence_score)}`}>
            {scenario.confidence_score.toFixed(0)}%
          </span>
          {scenario.confidence_delta !== undefined && scenario.confidence_delta !== 0 && (
            <div className={`flex items-center justify-center gap-1 mt-1 ${scenario.confidence_delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {scenario.confidence_delta > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              <span className="font-medium">{Math.abs(scenario.confidence_delta).toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        {scenario.adjustments && Object.keys(scenario.adjustments).some(k => scenario.adjustments[k] !== null) && (
          <div className="text-xs text-muted-foreground space-y-1">
            {scenario.adjustments.retirement_age && (
              <p>Retire at {scenario.adjustments.retirement_age}</p>
            )}
            {scenario.adjustments.spending_adjustment && (
              <p>Spending: {scenario.adjustments.spending_adjustment > 0 ? '+' : ''}{scenario.adjustments.spending_adjustment}%</p>
            )}
            {scenario.adjustments.contribution_adjustment && (
              <p>Extra contribution: ${scenario.adjustments.contribution_adjustment.toLocaleString()}/yr</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== MAIN COMPONENT ====================

export default function RetirementConfidenceEngine() {
  const [activeTab, setActiveTab] = useState('confidence');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // ==================== STATE ====================
  
  // Confidence result
  const [confidenceResult, setConfidenceResult] = useState(null);
  const [explanation, setExplanation] = useState(null);
  
  // Multi-scenario
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  
  // Inputs - People
  const [currentAge, setCurrentAge] = useState(45);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [isCouple, setIsCouple] = useState(true);
  const [partnerAge, setPartnerAge] = useState(43);
  
  // Inputs - Financial
  const [netWorth, setNetWorth] = useState(2000000);
  const [annualIncome, setAnnualIncome] = useState(200000);
  const [annualExpenses, setAnnualExpenses] = useState(100000);
  const [superBalance, setSuperBalance] = useState(600000);
  const [investmentBalance, setInvestmentBalance] = useState(400000);
  
  // Inputs - Assumptions
  const [inflationRate, setInflationRate] = useState(2.5);
  const [expectedReturn, setExpectedReturn] = useState(7.0);
  const [numSimulations, setNumSimulations] = useState(1000);
  
  // Scenario builder
  const [newScenarioName, setNewScenarioName] = useState('');
  const [scenarioRetirementAge, setScenarioRetirementAge] = useState(65);
  const [scenarioSpendingAdjust, setScenarioSpendingAdjust] = useState(0);
  const [scenarioContribAdjust, setScenarioContribAdjust] = useState(0);
  
  // Import state
  const [importing, setImporting] = useState(false);
  
  // View mode (advisor vs client)
  const [viewMode, setViewMode] = useState('advisor'); // 'advisor' or 'client'
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // History state
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Partner comparison state
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerComparison, setPartnerComparison] = useState(null);
  const [comparingPartner, setComparingPartner] = useState(false);
  const [partner2Assets, setPartner2Assets] = useState(800000);
  const [partner2Expenses, setPartner2Expenses] = useState(60000);
  const [partner2Age, setPartner2Age] = useState(43);
  
  // Scenario templates state
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(null);

  // ==================== FETCH TEMPLATES ====================
  
  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch(`${API_URL}/api/scenario-templates/list`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
    setLoadingTemplates(false);
  }, []);
  
  // ==================== APPLY TEMPLATE ====================
  
  const applyTemplate = async (templateId) => {
    setApplyingTemplate(templateId);
    try {
      const myAssets = netWorth + superBalance + investmentBalance;
      const response = await fetch(
        `${API_URL}/api/scenario-templates/${templateId}/apply?` +
        `current_age=${currentAge}&retirement_age=${retirementAge}` +
        `&net_worth=${myAssets}&annual_income=${annualIncome}&annual_expenses=${annualExpenses}` +
        `&super_balance=${superBalance}&is_couple=${isCouple}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Apply adjusted values
        if (data.adjusted_inputs) {
          const adj = data.adjusted_inputs;
          if (adj.retirement_age) setRetirementAge(adj.retirement_age);
          if (adj.annual_expenses) setAnnualExpenses(Math.round(adj.annual_expenses));
          if (adj.net_worth) setNetWorth(Math.round(adj.net_worth));
        }
        
        toast.success(`Applied "${data.template_name}" scenario!`);
        
        // Show considerations
        if (data.considerations?.length > 0) {
          setTimeout(() => {
            toast.info(data.considerations[0], { duration: 5000 });
          }, 1000);
        }
        
        // Recalculate
        setTimeout(() => calculateConfidence(), 100);
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error('Failed to apply scenario template');
    }
    setApplyingTemplate(null);
  };

  // ==================== FETCH HISTORY ====================
  
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_URL}/api/confidence-history/client/demo_client/chart-data?interval=monthly&periods=12`);
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
    setLoadingHistory(false);
  }, []);
  
  // ==================== PARTNER COMPARISON ====================
  
  const runPartnerComparison = async () => {
    setComparingPartner(true);
    try {
      const myAssets = netWorth + superBalance + investmentBalance;
      const response = await fetch(
        `${API_URL}/api/partner-comparison/quick-compare?` +
        `person1_assets=${myAssets}&person1_expenses=${annualExpenses}&person1_age=${currentAge}` +
        `&person2_assets=${partner2Assets}&person2_expenses=${partner2Expenses}&person2_age=${partner2Age}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setPartnerComparison(data);
        toast.success('Partner comparison complete!');
      }
    } catch (error) {
      console.error('Failed to compare:', error);
      toast.error('Failed to run comparison');
    }
    setComparingPartner(false);
  };
  
  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
    fetchTemplates();
  }, [fetchHistory, fetchTemplates]);

  // ==================== IMPORT FROM NET WORTH ====================
  
  const importFromNetWorth = async () => {
    setImporting(true);
    try {
      // Fetch wealth data from the client wealth endpoint
      const response = await fetch(`${API_URL}/api/wealth-data/snapshot/demo_client`);
      if (!response.ok) throw new Error('Failed to fetch wealth data');
      
      const wealthData = await response.json();
      
      // Pre-populate the sliders with real data
      if (wealthData.summary) {
        const summary = wealthData.summary;
        
        // Set net worth (total assets minus liabilities)
        if (summary.total_assets && summary.total_liabilities !== undefined) {
          const calculatedNetWorth = summary.total_assets - (summary.total_liabilities || 0);
          setNetWorth(Math.round(calculatedNetWorth));
        } else if (summary.net_worth) {
          setNetWorth(Math.round(summary.net_worth));
        }
        
        // Set super balance if available
        if (summary.super_balance) {
          setSuperBalance(Math.round(summary.super_balance));
        }
        
        // Set investment balance (shares + funds)
        if (summary.shares_value || summary.funds_value) {
          const investments = (summary.shares_value || 0) + (summary.funds_value || 0);
          setInvestmentBalance(Math.round(investments));
        }
      }
      
      // Set income from budgets if available
      if (wealthData.annual_income) {
        setAnnualIncome(Math.round(wealthData.annual_income));
      }
      
      // Set expenses from budgets if available
      if (wealthData.annual_expenses) {
        setAnnualExpenses(Math.round(wealthData.annual_expenses));
      }
      
      // Set ages if profile data available
      if (wealthData.primary_member) {
        if (wealthData.primary_member.age) {
          setCurrentAge(wealthData.primary_member.age);
        }
        if (wealthData.primary_member.retirement_age) {
          setRetirementAge(wealthData.primary_member.retirement_age);
        }
      }
      
      // Check if couple
      if (wealthData.is_couple !== undefined) {
        setIsCouple(wealthData.is_couple);
      }
      
      toast.success('Imported wealth data successfully! Recalculating confidence...');
      
      // Trigger recalculation after a short delay to ensure state is updated
      setTimeout(() => {
        calculateConfidence();
      }, 100);
      
    } catch (error) {
      console.error('Failed to import wealth data:', error);
      toast.error('Failed to import wealth data. Using sample data.');
    }
    setImporting(false);
  };

  // ==================== PDF REPORT GENERATION ====================
  
  const generatePdfReport = async () => {
    setGeneratingPdf(true);
    try {
      const reportData = {
        client_id: 'demo_client',
        client_name: isCouple ? 'James & Sarah Mitchell' : 'James Mitchell',
        adviser_name: 'Sarah Chen',
        report_date: new Date().toISOString().split('T')[0],
        confidence_score: confidenceResult?.confidence_score || 0,
        risk_breakdown: confidenceResult?.risk_breakdown || {},
        projections: confidenceResult?.projections || {},
        inputs: {
          current_age: currentAge,
          retirement_age: retirementAge,
          life_expectancy: lifeExpectancy,
          net_worth: netWorth,
          annual_income: annualIncome,
          annual_expenses: annualExpenses,
          super_balance: superBalance,
          investment_balance: investmentBalance,
          is_couple: isCouple,
          entity_type: 'personal'
        },
        assumptions: {
          inflation_rate: inflationRate,
          expected_return: expectedReturn,
          num_simulations: numSimulations
        },
        scenarios: scenarios,
        ai_explanation: explanation?.explanation || ''
      };

      const response = await fetch(`${API_URL}/api/documents/generate/confidence-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `confidence_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF report');
    }
    setGeneratingPdf(false);
  };

  const calculateConfidence = useCallback(async () => {
    setCalculating(true);
    try {
      const response = await fetch(
        `${API_URL}/api/confidence-engine/quick-calculate?` +
        `net_worth=${netWorth}&annual_income=${annualIncome}&annual_expenses=${annualExpenses}` +
        `&current_age=${currentAge}&retirement_age=${retirementAge}&life_expectancy=${lifeExpectancy}` +
        `&is_couple=${isCouple}&num_simulations=${numSimulations}`
      , { method: 'POST' });
      
      const result = await response.json();
      setConfidenceResult(result);
      
      // Get AI explanation
      getExplanation(result);
      
    } catch (error) {
      console.error('Failed to calculate confidence:', error);
      toast.error('Failed to calculate confidence score');
    }
    setCalculating(false);
  }, [netWorth, annualIncome, annualExpenses, currentAge, retirementAge, lifeExpectancy, isCouple, numSimulations]);

  const getExplanation = async (result) => {
    try {
      const response = await fetch(`${API_URL}/api/ai-explain/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidence_score: result.confidence_score,
          risk_breakdown: result.risk_breakdown,
          statistics: result.statistics,
          inputs: {
            net_worth: netWorth,
            years_to_retirement: retirementAge - currentAge,
            annual_expenses: annualExpenses,
            portfolio_return: expectedReturn,
            portfolio_volatility: 12
          },
          client_name: isCouple ? 'You and your partner' : 'You'
        })
      });
      
      const explanation = await response.json();
      setExplanation(explanation);
    } catch (error) {
      console.error('Failed to get explanation:', error);
    }
  };

  const addScenario = async () => {
    if (!newScenarioName.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }
    
    setLoading(true);
    try {
      // Calculate this scenario
      const adjustedRetAge = scenarioRetirementAge;
      const adjustedExpenses = annualExpenses * (1 + scenarioSpendingAdjust / 100);
      
      const response = await fetch(
        `${API_URL}/api/confidence-engine/quick-calculate?` +
        `net_worth=${netWorth}&annual_income=${annualIncome}&annual_expenses=${adjustedExpenses}` +
        `&current_age=${currentAge}&retirement_age=${adjustedRetAge}&life_expectancy=${lifeExpectancy}` +
        `&is_couple=${isCouple}&num_simulations=${numSimulations}`
      , { method: 'POST' });
      
      const result = await response.json();
      
      const baseScore = confidenceResult?.confidence_score || 0;
      
      const newScenario = {
        scenario_id: `SCEN-${Date.now()}`,
        name: newScenarioName,
        description: `Retire at ${adjustedRetAge}, spending ${scenarioSpendingAdjust >= 0 ? '+' : ''}${scenarioSpendingAdjust}%`,
        confidence_score: result.confidence_score,
        confidence_delta: result.confidence_score - baseScore,
        risk_breakdown: result.risk_breakdown,
        statistics: result.statistics,
        adjustments: {
          retirement_age: adjustedRetAge,
          spending_adjustment: scenarioSpendingAdjust,
          contribution_adjustment: scenarioContribAdjust
        }
      };
      
      setScenarios([...scenarios, newScenario]);
      setNewScenarioName('');
      toast.success(`Scenario "${newScenarioName}" added`);
    } catch (error) {
      toast.error('Failed to calculate scenario');
    }
    setLoading(false);
  };

  const removeScenario = (scenarioId) => {
    setScenarios(scenarios.filter(s => s.scenario_id !== scenarioId));
    if (selectedScenario === scenarioId) setSelectedScenario(null);
  };

  // Auto-calculate on mount and when key inputs change
  useEffect(() => {
    calculateConfidence();
  }, []);

  // Real-time updates with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateConfidence();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentAge, retirementAge, lifeExpectancy, netWorth, annualIncome, annualExpenses, isCouple]);

  // ==================== RENDER ====================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const yearsToRetirement = retirementAge - currentAge;
  const retirementYears = lifeExpectancy - retirementAge;

  return (
    <Layout>
      <div className="space-y-6 p-6" data-testid="confidence-engine-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Gauge className="h-8 w-8 text-primary" />
              Retirement Confidence Engine
            </h1>
            <p className="text-muted-foreground mt-1">
              Monte Carlo simulation-based retirement planning with real-time confidence scoring
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={importFromNetWorth} 
              disabled={importing}
              data-testid="import-net-worth-btn"
            >
              <Download className={`h-4 w-4 mr-2 ${importing ? 'animate-pulse' : ''}`} />
              Import from Net Worth
            </Button>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'advisor' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('advisor')}
                data-testid="view-mode-advisor"
              >
                <UserCog className="h-4 w-4 mr-1" />
                Advisor
              </Button>
              <Button
                variant={viewMode === 'client' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('client')}
                data-testid="view-mode-client"
              >
                <Eye className="h-4 w-4 mr-1" />
                Client
              </Button>
            </div>
            
            <Badge variant="outline" className="text-sm">
              {numSimulations.toLocaleString()} simulations
            </Badge>
            
            {/* PDF Download */}
            <Button 
              variant="outline" 
              onClick={generatePdfReport} 
              disabled={generatingPdf || !confidenceResult}
              data-testid="generate-pdf-btn"
            >
              <FileDown className={`h-4 w-4 mr-2 ${generatingPdf ? 'animate-pulse' : ''}`} />
              Download PDF
            </Button>
            
            <Button onClick={calculateConfidence} disabled={calculating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
          </div>
        </div>

        {/* Client View - Simplified */}
        {viewMode === 'client' && confidenceResult && (
          <div className="space-y-6">
            {/* Simple Confidence Display */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold text-slate-800">Your Retirement Readiness</h2>
                  <div className="max-w-xs mx-auto">
                    <ConfidenceGauge score={confidenceResult.confidence_score} size={200} />
                  </div>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Based on your current financial situation, you're on track for 
                    <span className="font-semibold text-slate-800"> {retirementYears} years </span>
                    of comfortable retirement.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Simple Summary Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-3xl font-bold">{yearsToRetirement}</p>
                  <p className="text-sm text-muted-foreground">Years Until Retirement</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-3xl font-bold">{formatCurrency(confidenceResult.statistics?.median_final_wealth || confidenceResult.projections?.median_wealth || 0)}</p>
                  <p className="text-sm text-muted-foreground">Expected Retirement Savings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-3xl font-bold">{retirementYears}</p>
                  <p className="text-sm text-muted-foreground">Years of Retirement</p>
                </CardContent>
              </Card>
            </div>

            {/* Simple Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  What You Can Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Consider working 2 more years</p>
                      <p className="text-sm text-muted-foreground">This could increase your confidence by 5-10%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Reduce expenses by 10%</p>
                      <p className="text-sm text-muted-foreground">This could increase your confidence by 5-8%</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium">Boost super contributions</p>
                      <p className="text-sm text-muted-foreground">An extra $10k/year could increase confidence by 3-5%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Advisor */}
            <Card className="bg-slate-800 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Have questions about your retirement plan?</p>
                      <p className="text-sm text-slate-300">Your advisor is here to help.</p>
                    </div>
                  </div>
                  <Button className="bg-white text-slate-800 hover:bg-slate-100">
                    Contact Advisor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advisor View - Full Details */}
        {viewMode === 'advisor' && confidenceResult && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Confidence Score */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Retirement Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConfidenceGauge score={confidenceResult.confidence_score} />
                <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Years to Retire</p>
                    <p className="text-2xl font-bold">{yearsToRetirement}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Retirement Years</p>
                    <p className="text-2xl font-bold">{retirementYears}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Breakdown */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Drivers
                </CardTitle>
                <CardDescription>What's affecting your score</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskBreakdown risks={confidenceResult.risk_breakdown} />
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Projected Outcomes
                </CardTitle>
                <CardDescription>Based on {numSimulations.toLocaleString()} simulations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600 font-medium">Best Case (90th percentile)</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(confidenceResult.statistics?.p90_final_wealth)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">Median Outcome</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(confidenceResult.statistics?.median_final_wealth)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs text-red-600 font-medium">Worst Case (10th percentile)</p>
                  <p className="text-xl font-bold text-red-700">
                    {formatCurrency(confidenceResult.statistics?.p10_final_wealth)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for different features - Advisor Only */}
        {viewMode === 'advisor' && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="confidence" data-testid="confidence-tab">
              <Gauge className="h-4 w-4 mr-2" /> Modeling
            </TabsTrigger>
            <TabsTrigger value="scenarios" data-testid="scenarios-tab">
              <Activity className="h-4 w-4 mr-2" /> Scenarios
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="history-tab">
              <History className="h-4 w-4 mr-2" /> History
            </TabsTrigger>
            <TabsTrigger value="partner" data-testid="partner-tab">
              <UsersRound className="h-4 w-4 mr-2" /> Partner
            </TabsTrigger>
            <TabsTrigger value="explanation" data-testid="explanation-tab">
              <Brain className="h-4 w-4 mr-2" /> AI
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">
              <Zap className="h-4 w-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Real-Time Modeling Tab */}
          <TabsContent value="confidence" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Interactive Sliders */}
              <Card>
                <CardHeader>
                  <CardTitle>Adjust Your Plan</CardTitle>
                  <CardDescription>Move sliders to see instant impact on confidence</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ages */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" /> Timeline
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Current Age</Label>
                        <span className="font-bold">{currentAge}</span>
                      </div>
                      <Slider
                        value={[currentAge]}
                        onValueChange={([v]) => setCurrentAge(v)}
                        min={25}
                        max={70}
                        step={1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Retirement Age</Label>
                        <span className="font-bold">{retirementAge}</span>
                      </div>
                      <Slider
                        value={[retirementAge]}
                        onValueChange={([v]) => setRetirementAge(v)}
                        min={55}
                        max={75}
                        step={1}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Life Expectancy</Label>
                        <span className="font-bold">{lifeExpectancy}</span>
                      </div>
                      <Slider
                        value={[lifeExpectancy]}
                        onValueChange={([v]) => setLifeExpectancy(v)}
                        min={75}
                        max={105}
                        step={1}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Financials */}
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> Financials
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Net Worth</Label>
                        <span className="font-bold">{formatCurrency(netWorth)}</span>
                      </div>
                      <Slider
                        value={[netWorth]}
                        onValueChange={([v]) => setNetWorth(v)}
                        min={100000}
                        max={10000000}
                        step={50000}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Annual Income</Label>
                        <span className="font-bold">{formatCurrency(annualIncome)}</span>
                      </div>
                      <Slider
                        value={[annualIncome]}
                        onValueChange={([v]) => setAnnualIncome(v)}
                        min={30000}
                        max={500000}
                        step={5000}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Annual Expenses</Label>
                        <span className="font-bold">{formatCurrency(annualExpenses)}</span>
                      </div>
                      <Slider
                        value={[annualExpenses]}
                        onValueChange={([v]) => setAnnualExpenses(v)}
                        min={20000}
                        max={300000}
                        step={5000}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Couple Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Planning as Couple</Label>
                      <p className="text-sm text-muted-foreground">Joint retirement planning</p>
                    </div>
                    <Switch checked={isCouple} onCheckedChange={setIsCouple} />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>One-click improvements to explore</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setRetirementAge(Math.min(75, retirementAge + 2))}
                  >
                    <span>Work 2 more years</span>
                    <Badge className="bg-green-500">+5-10% confidence</Badge>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setAnnualExpenses(annualExpenses * 0.9)}
                  >
                    <span>Reduce expenses by 10%</span>
                    <Badge className="bg-green-500">+5-8% confidence</Badge>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setNetWorth(netWorth + 100000)}
                  >
                    <span>Save additional $100k</span>
                    <Badge className="bg-green-500">+3-5% confidence</Badge>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setLifeExpectancy(Math.min(105, lifeExpectancy + 5))}
                  >
                    <span>Plan to age {lifeExpectancy + 5}</span>
                    <Badge className="bg-yellow-500">Stress test</Badge>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Multi-Scenario Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            {/* Scenario Builder */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Scenario</CardTitle>
                <CardDescription>Model different retirement strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label>Scenario Name</Label>
                    <Input
                      value={newScenarioName}
                      onChange={(e) => setNewScenarioName(e.target.value)}
                      placeholder="e.g., Early Retirement"
                    />
                  </div>
                  <div>
                    <Label>Retirement Age</Label>
                    <Input
                      type="number"
                      value={scenarioRetirementAge}
                      onChange={(e) => setScenarioRetirementAge(parseInt(e.target.value) || 65)}
                    />
                  </div>
                  <div>
                    <Label>Spending Change %</Label>
                    <Input
                      type="number"
                      value={scenarioSpendingAdjust}
                      onChange={(e) => setScenarioSpendingAdjust(parseFloat(e.target.value) || 0)}
                      placeholder="-10 or +20"
                    />
                  </div>
                  <div>
                    <Label>Extra Contribution/yr</Label>
                    <Input
                      type="number"
                      value={scenarioContribAdjust}
                      onChange={(e) => setScenarioContribAdjust(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addScenario} disabled={loading} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Scenario
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Base Case */}
              {confidenceResult && (
                <ScenarioCard
                  scenario={{
                    scenario_id: 'BASE',
                    name: 'Current Plan',
                    confidence_score: confidenceResult.confidence_score,
                    risk_breakdown: confidenceResult.risk_breakdown,
                    statistics: confidenceResult.statistics
                  }}
                  isBase={true}
                  onSelect={setSelectedScenario}
                  selected={selectedScenario === 'BASE'}
                />
              )}
              
              {/* Custom Scenarios */}
              {scenarios.map((scenario) => (
                <div key={scenario.scenario_id} className="relative">
                  <ScenarioCard
                    scenario={scenario}
                    isBase={false}
                    onSelect={setSelectedScenario}
                    selected={selectedScenario === scenario.scenario_id}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={(e) => { e.stopPropagation(); removeScenario(scenario.scenario_id); }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              
              {/* Add Scenario Placeholder */}
              {scenarios.length < 4 && (
                <Card className="border-dashed flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-muted/50"
                  onClick={() => document.querySelector('input[placeholder="e.g., Early Retirement"]')?.focus()}>
                  <div className="text-center text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2" />
                    <p>Add Scenario</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Advanced Scenario Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Advanced Scenario Templates
                </CardTitle>
                <CardDescription>Apply pre-built scenarios with one click</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.slice(0, 9).map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template.id)}
                        disabled={applyingTemplate === template.id}
                        className="scenario-card p-4 rounded-lg border text-left hover:border-primary transition-all disabled:opacity-50"
                        style={{ borderLeftColor: template.color, borderLeftWidth: '4px' }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{template.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          {applyingTemplate === template.id && (
                            <RefreshCw className="h-4 w-4 animate-spin flex-shrink-0" />
                          )}
                        </div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {template.category?.replace('_', ' ')}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Quick Presets */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Quick Adjustments</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setNewScenarioName('Retire at 60');
                      setScenarioRetirementAge(60);
                    }}>
                      Early Retirement (60)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setNewScenarioName('Work until 70');
                      setScenarioRetirementAge(70);
                    }}>
                      Work Longer (70)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setNewScenarioName('Frugal');
                      setScenarioSpendingAdjust(-20);
                    }}>
                      -20% Spending
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setNewScenarioName('Boost Savings');
                      setScenarioContribAdjust(20000);
                    }}>
                      +$20k/yr Savings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* History Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Confidence Score History
                  </CardTitle>
                  <CardDescription>Track your retirement confidence over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="h-64 flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : historyData?.chart_data?.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={historyData.chart_data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="confidence_score"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.3}
                            name="Confidence Score"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <p>No historical data available yet. Run some calculations to build history.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Trend */}
              {historyData?.chart_data?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Factors Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <LineChart data={historyData.chart_data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis domain={[0, 30]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="longevity_risk" stroke="#8b5cf6" name="Longevity" />
                          <Line type="monotone" dataKey="market_risk" stroke="#ef4444" name="Market" />
                          <Line type="monotone" dataKey="spending_risk" stroke="#f59e0b" name="Spending" />
                          <Line type="monotone" dataKey="inflation_risk" stroke="#f97316" name="Inflation" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={fetchHistory} disabled={loadingHistory}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingHistory ? 'animate-spin' : ''}`} />
                Refresh History
              </Button>
            </div>
          </TabsContent>

          {/* Partner Comparison Tab */}
          <TabsContent value="partner" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Partner Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersRound className="h-5 w-5" />
                    Compare with Partner
                  </CardTitle>
                  <CardDescription>See how planning together improves confidence</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Your details (Person 1) are pre-filled from the sliders above.
                      Enter your partner's details below.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Label>Partner's Total Assets</Label>
                    <Input
                      type="number"
                      value={partner2Assets}
                      onChange={(e) => setPartner2Assets(Number(e.target.value))}
                      placeholder="Total assets including super"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Partner's Annual Expenses</Label>
                    <Input
                      type="number"
                      value={partner2Expenses}
                      onChange={(e) => setPartner2Expenses(Number(e.target.value))}
                      placeholder="Annual living expenses"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Partner's Age</Label>
                    <Input
                      type="number"
                      value={partner2Age}
                      onChange={(e) => setPartner2Age(Number(e.target.value))}
                      min={25}
                      max={80}
                    />
                  </div>
                  
                  <Button onClick={runPartnerComparison} disabled={comparingPartner} className="w-full">
                    <UsersRound className={`h-4 w-4 mr-2 ${comparingPartner ? 'animate-pulse' : ''}`} />
                    {comparingPartner ? 'Comparing...' : 'Compare Scenarios'}
                  </Button>
                </CardContent>
              </Card>

              {/* Comparison Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {partnerComparison ? (
                    <div className="space-y-4">
                      {/* Confidence Bars */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>You Alone</span>
                            <span className="font-bold">{partnerComparison.person1_confidence?.toFixed(1)}%</span>
                          </div>
                          <Progress value={partnerComparison.person1_confidence} className="h-3" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Partner Alone</span>
                            <span className="font-bold">{partnerComparison.person2_confidence?.toFixed(1)}%</span>
                          </div>
                          <Progress value={partnerComparison.person2_confidence} className="h-3" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-green-600">Together</span>
                            <span className="font-bold text-green-600">{partnerComparison.together_confidence?.toFixed(1)}%</span>
                          </div>
                          <Progress value={partnerComparison.together_confidence} className="h-3 bg-green-100" />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Synergy Benefits */}
                      <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">
                          {partnerComparison.synergy_benefit > 0 ? '✨ ' : ''}
                          Synergy Benefit: +{partnerComparison.synergy_benefit?.toFixed(1)}%
                        </h4>
                        <p className="text-sm text-green-700">
                          Planning together saves ~${partnerComparison.expense_savings?.toLocaleString()}/year
                          through shared expenses.
                        </p>
                      </div>
                      
                      <Alert>
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription>
                          {partnerComparison.recommendation}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <UsersRound className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Enter partner details and click Compare to see results</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="explanation" className="space-y-6">
            {explanation && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Explanation */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Analysis
                    </CardTitle>
                    <CardDescription>
                      Powered by {explanation.generated_by === 'llm' ? 'GPT-4' : 'Rule Engine'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {explanation.ai_explanation ? (
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{explanation.ai_explanation}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>{explanation.overall_status?.toUpperCase()}</AlertTitle>
                          <AlertDescription>{explanation.score_explanation}</AlertDescription>
                        </Alert>
                        
                        <div className="p-4 rounded-lg bg-muted">
                          <h4 className="font-medium mb-2">Primary Risk: {explanation.primary_risk}</h4>
                          <p className="text-sm text-muted-foreground">{explanation.primary_risk_explanation}</p>
                          <p className="text-sm mt-2"><strong>Mitigation:</strong> {explanation.primary_risk_mitigation}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommended Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Recommended Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(explanation.recommended_actions || explanation.rule_based_backup?.recommended_actions || []).map((action, idx) => (
                        <div key={`item-${idx}`} className={`p-4 rounded-lg border ${
                          action.priority === 'high' ? 'border-red-200 bg-red-50' :
                          action.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                          'border-green-200 bg-green-50'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{action.action}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                            </div>
                            <Badge className={
                              action.priority === 'high' ? 'bg-red-500' :
                              action.priority === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }>
                              {action.priority}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mt-2">{action.impact}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Key Takeaways
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${confidenceResult?.confidence_score >= 75 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                          {confidenceResult?.confidence_score >= 75 ? 
                            <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">Confidence Score: {confidenceResult?.confidence_score.toFixed(0)}%</p>
                          <p className="text-sm text-muted-foreground">
                            {confidenceResult?.confidence_score >= 90 ? "You're in excellent shape!" :
                             confidenceResult?.confidence_score >= 75 ? "On track with room to optimize" :
                             confidenceResult?.confidence_score >= 50 ? "Some improvements recommended" :
                             "Action needed to secure retirement"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{yearsToRetirement} years to retirement</p>
                          <p className="text-sm text-muted-foreground">
                            {yearsToRetirement > 10 ? "Plenty of time to optimize" :
                             yearsToRetirement > 5 ? "Focus on maximizing contributions" :
                             "Final preparation phase"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <Target className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Median outcome: {formatCurrency(confidenceResult?.statistics?.median_final_wealth)}</p>
                          <p className="text-sm text-muted-foreground">Expected wealth at end of retirement</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Simulation Settings</CardTitle>
                  <CardDescription>Configure Monte Carlo parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Number of Simulations</Label>
                    <Select value={numSimulations.toString()} onValueChange={(v) => setNumSimulations(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 (Fast)</SelectItem>
                        <SelectItem value="1000">1,000 (Standard)</SelectItem>
                        <SelectItem value="5000">5,000 (Detailed)</SelectItem>
                        <SelectItem value="10000">10,000 (High Precision)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      More simulations = more accurate but slower
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Inflation Rate</Label>
                      <span className="font-bold">{inflationRate}%</span>
                    </div>
                    <Slider
                      value={[inflationRate]}
                      onValueChange={([v]) => setInflationRate(v)}
                      min={0}
                      max={10}
                      step={0.5}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Expected Investment Return</Label>
                      <span className="font-bold">{expectedReturn}%</span>
                    </div>
                    <Slider
                      value={[expectedReturn]}
                      onValueChange={([v]) => setExpectedReturn(v)}
                      min={2}
                      max={15}
                      step={0.5}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Factors Explained</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg border">
                    <h4 className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-purple-500" /> Longevity Risk
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      The risk of outliving your savings. We model this by simulating various lifespans.
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg border">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" /> Market Risk
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Investment volatility, especially sequence of returns risk early in retirement.
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg border">
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-yellow-500" /> Spending Risk
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      The risk that your spending level depletes savings faster than expected.
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg border">
                    <h4 className="font-medium flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" /> Inflation Risk
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      The erosion of purchasing power over time. Even 3% inflation halves value in 24 years.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </Layout>
  );
}
