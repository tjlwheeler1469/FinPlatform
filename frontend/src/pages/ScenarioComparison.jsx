import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calculator,
  PiggyBank,
  Home,
  Calendar,
  DollarSign,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Save
} from "lucide-react";
import { usePortfolio } from "@/App";
import ChartContainer from "@/components/ChartContainer";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

const formatCompact = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

// Default scenario template
const createScenario = (name, color, defaults = {}) => ({
  id: `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  color,
  retirementAge: defaults.retirementAge || 60,
  superContribution: defaults.superContribution || 500,
  savingsRate: defaults.savingsRate || 15,
  investmentReturn: defaults.investmentReturn || 7,
  inflationRate: defaults.inflationRate || 2.5,
  propertyGrowth: defaults.propertyGrowth || 4,
  salaryGrowth: defaults.salaryGrowth || 3,
  debtPaydown: defaults.debtPaydown || 0,
  // Calculated outputs
  retirementBalance: 0,
  monthlyRetirementIncome: 0,
  netWorthAt60: 0,
  successProbability: 0,
});

// Calculate scenario projections
const calculateScenario = (scenario, currentData) => {
  const yearsToRetirement = scenario.retirementAge - 45; // Assuming current age 45
  const currentNetWorth = currentData.netWorth || 1978000;
  const currentSuper = currentData.super || 580000;
  const annualIncome = currentData.income || 185000;
  
  // Super projection with contributions
  const annualSuperContrib = scenario.superContribution * 12;
  const superGrowth = scenario.investmentReturn / 100;
  let projectedSuper = currentSuper;
  
  for (let i = 0; i < yearsToRetirement; i++) {
    projectedSuper = (projectedSuper + annualSuperContrib) * (1 + superGrowth);
  }
  
  // Net worth projection
  const savingsPerYear = annualIncome * (scenario.savingsRate / 100);
  let projectedNetWorth = currentNetWorth;
  
  for (let i = 0; i < yearsToRetirement; i++) {
    projectedNetWorth = (projectedNetWorth + savingsPerYear) * (1 + (scenario.investmentReturn - scenario.inflationRate) / 100);
  }
  
  // Monthly retirement income (4% rule)
  const monthlyRetirementIncome = (projectedSuper * 0.04) / 12;
  
  // Success probability (simplified Monte Carlo approximation)
  const targetRetirement = 3500000;
  const successProbability = Math.min(95, Math.round((projectedSuper / targetRetirement) * 100));
  
  return {
    ...scenario,
    retirementBalance: Math.round(projectedSuper),
    monthlyRetirementIncome: Math.round(monthlyRetirementIncome),
    netWorthAt60: Math.round(projectedNetWorth),
    successProbability
  };
};

const SCENARIO_COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

// Stress Test Presets
const STRESS_TEST_PRESETS = [
  { 
    name: "Market Crash (-30%)", 
    icon: "📉",
    description: "Simulates a severe market downturn",
    overrides: { investmentReturn: -5, inflationRate: 4 }
  },
  { 
    name: "High Inflation", 
    icon: "💹",
    description: "Sustained 6% inflation scenario",
    overrides: { inflationRate: 6, investmentReturn: 5 }
  },
  { 
    name: "Job Loss (1 Year)", 
    icon: "💼",
    description: "No income for 12 months",
    overrides: { savingsRate: 0, superContribution: 0 }
  },
  { 
    name: "Property Crash", 
    icon: "🏠",
    description: "Property values drop 20%",
    overrides: { propertyGrowth: -10 }
  }
];

const ScenarioComparison = () => {
  const navigate = useNavigate();
  const { portfolio } = usePortfolio();
  
  const currentData = {
    netWorth: portfolio.summary.netWorth,
    super: portfolio.investments.smsf_balance,
    income: portfolio.personal.taxableIncome
  };
  
  const [scenarios, setScenarios] = useState([
    calculateScenario(createScenario("Current Path", SCENARIO_COLORS[0]), currentData),
    calculateScenario(createScenario("Aggressive Savings", SCENARIO_COLORS[1], { 
      savingsRate: 25, 
      superContribution: 1000 
    }), currentData),
    calculateScenario(createScenario("Early Retirement", SCENARIO_COLORS[2], { 
      retirementAge: 55, 
      superContribution: 1500,
      savingsRate: 30
    }), currentData),
  ]);
  
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [compareMode, setCompareMode] = useState(true);
  const [showStressTests, setShowStressTests] = useState(false);

  // Apply stress test to a scenario
  const applyStressTest = (preset) => {
    const stressScenario = calculateScenario(
      createScenario(preset.name, SCENARIO_COLORS[scenarios.length % SCENARIO_COLORS.length], preset.overrides),
      currentData
    );
    if (scenarios.length < 6) {
      setScenarios([...scenarios, stressScenario]);
    }
  };

  // Update scenario calculations when parameters change
  const updateScenario = (index, updates) => {
    setScenarios(prev => {
      const newScenarios = [...prev];
      const updated = { ...newScenarios[index], ...updates };
      newScenarios[index] = calculateScenario(updated, currentData);
      return newScenarios;
    });
  };

  // Add new scenario
  const addScenario = () => {
    if (scenarios.length < 4) {
      const newScenario = calculateScenario(
        createScenario(`Scenario ${scenarios.length + 1}`, SCENARIO_COLORS[scenarios.length]),
        currentData
      );
      setScenarios([...scenarios, newScenario]);
    }
  };

  // Remove scenario
  const removeScenario = (index) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter((_, i) => i !== index));
      if (selectedScenario >= scenarios.length - 1) {
        setSelectedScenario(Math.max(0, selectedScenario - 1));
      }
    }
  };

  // Duplicate scenario
  const duplicateScenario = (index) => {
    if (scenarios.length < 4) {
      const source = scenarios[index];
      const newScenario = calculateScenario({
        ...createScenario(`${source.name} (Copy)`, SCENARIO_COLORS[scenarios.length]),
        retirementAge: source.retirementAge,
        superContribution: source.superContribution,
        savingsRate: source.savingsRate,
        investmentReturn: source.investmentReturn,
        inflationRate: source.inflationRate,
      }, currentData);
      setScenarios([...scenarios, newScenario]);
    }
  };

  // Chart data for comparison
  const comparisonData = [
    {
      metric: "Retirement Balance",
      ...scenarios.reduce((acc, s, i) => ({ ...acc, [`scenario${i}`]: s.retirementBalance }), {})
    },
    {
      metric: "Monthly Income",
      ...scenarios.reduce((acc, s, i) => ({ ...acc, [`scenario${i}`]: s.monthlyRetirementIncome * 12 }), {})
    },
    {
      metric: "Net Worth at 60",
      ...scenarios.reduce((acc, s, i) => ({ ...acc, [`scenario${i}`]: s.netWorthAt60 }), {})
    }
  ];

  // Timeline projection data
  const timelineData = Array.from({ length: 25 }, (_, year) => {
    const data = { year: 45 + year };
    scenarios.forEach((s, i) => {
      const yearsFromNow = year;
      const growth = Math.pow(1 + (s.investmentReturn - s.inflationRate) / 100, yearsFromNow);
      data[`scenario${i}`] = Math.round(currentData.netWorth * growth + (s.savingsRate / 100 * currentData.income * yearsFromNow));
    });
    return data;
  });

  const activeScenario = scenarios[selectedScenario];

  return (
    <Layout>
      <div className="space-y-6" data-testid="scenario-comparison">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-[#D4A84C]" />
              Scenario Comparison
            </h1>
            <p className="text-muted-foreground mt-1">
              Compare different financial strategies side-by-side
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch 
                id="compare-mode" 
                checked={compareMode}
                onCheckedChange={setCompareMode}
              />
              <Label htmlFor="compare-mode" className="text-sm">Compare View</Label>
            </div>
            <Button 
              variant="outline"
              onClick={addScenario}
              disabled={scenarios.length >= 4}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Scenario
            </Button>
            <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90">
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
          </div>
        </div>

        {/* Scenario Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {scenarios.map((scenario, index) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                selectedScenario === index 
                  ? 'border-[#D4A84C] bg-[#D4A84C]/10' 
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: scenario.color }}
              />
              <span className="font-medium">{scenario.name}</span>
              {scenarios.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeScenario(index); }}
                  className="ml-2 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>
          ))}
        </div>

        {compareMode ? (
          <>
            {/* Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario, index) => (
                <Card 
                  key={scenario.id}
                  className={`cursor-pointer transition-all ${
                    selectedScenario === index ? 'ring-2 ring-[#D4A84C]' : ''
                  }`}
                  onClick={() => setSelectedScenario(index)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: scenario.color }}
                        />
                        <CardTitle className="text-base">{scenario.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); duplicateScenario(index); }}
                          className="p-1 hover:bg-muted rounded"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Key metrics */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Retire at</span>
                        <span className="font-bold">{scenario.retirementAge}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <Badge className={scenario.successProbability >= 80 ? 'bg-green-500' : 'bg-amber-500'}>
                          {scenario.successProbability}%
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Retirement Balance</span>
                        <span className="font-bold text-[#D4A84C]">{formatCompact(scenario.retirementBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Monthly Income</span>
                        <span className="font-medium">{formatCurrency(scenario.monthlyRetirementIncome)}</span>
                      </div>
                    </div>
                    
                    {/* Key assumptions */}
                    <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Super contribution</span>
                        <span>${scenario.superContribution}/mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Savings rate</span>
                        <span>{scenario.savingsRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected return</span>
                        <span>{scenario.investmentReturn}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Net Worth Projection by Scenario</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `Age ${v}`}
                      />
                      <YAxis 
                        tickFormatter={(v) => formatCompact(v)}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), scenarios[parseInt(name.replace('scenario', ''))]?.name]}
                        labelFormatter={(label) => `Age ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend 
                        formatter={(value) => scenarios[parseInt(value.replace('scenario', ''))]?.name}
                      />
                      {scenarios.map((s, i) => (
                        <Line 
                          key={s.id}
                          type="monotone" 
                          dataKey={`scenario${i}`}
                          stroke={s.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Single Scenario Editor */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Parameters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: activeScenario.color }}
                  />
                  {activeScenario.name} - Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Retirement Age */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Retirement Age</Label>
                    <span className="font-bold">{activeScenario.retirementAge}</span>
                  </div>
                  <Slider
                    value={[activeScenario.retirementAge]}
                    onValueChange={([v]) => updateScenario(selectedScenario, { retirementAge: v })}
                    min={50}
                    max={70}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50</span>
                    <span>70</span>
                  </div>
                </div>

                {/* Super Contribution */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Monthly Super Contribution</Label>
                    <span className="font-bold">${activeScenario.superContribution}</span>
                  </div>
                  <Slider
                    value={[activeScenario.superContribution]}
                    onValueChange={([v]) => updateScenario(selectedScenario, { superContribution: v })}
                    min={0}
                    max={2500}
                    step={100}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>$2,500</span>
                  </div>
                </div>

                {/* Savings Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Savings Rate</Label>
                    <span className="font-bold">{activeScenario.savingsRate}%</span>
                  </div>
                  <Slider
                    value={[activeScenario.savingsRate]}
                    onValueChange={([v]) => updateScenario(selectedScenario, { savingsRate: v })}
                    min={0}
                    max={50}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Investment Return */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Expected Investment Return</Label>
                    <span className="font-bold">{activeScenario.investmentReturn}%</span>
                  </div>
                  <Slider
                    value={[activeScenario.investmentReturn]}
                    onValueChange={([v]) => updateScenario(selectedScenario, { investmentReturn: v })}
                    min={3}
                    max={12}
                    step={0.5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3% (Conservative)</span>
                    <span>12% (Aggressive)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Projected Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Success Probability */}
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <div className="text-6xl font-bold" style={{ color: activeScenario.color }}>
                    {activeScenario.successProbability}%
                  </div>
                  <p className="text-muted-foreground mt-2">Retirement Success Probability</p>
                  <Badge 
                    className={`mt-2 ${activeScenario.successProbability >= 80 ? 'bg-green-500' : activeScenario.successProbability >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  >
                    {activeScenario.successProbability >= 80 ? 'On Track' : activeScenario.successProbability >= 60 ? 'Needs Attention' : 'At Risk'}
                  </Badge>
                </div>

                {/* Key Numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Retirement Balance</p>
                    <p className="text-2xl font-bold text-[#D4A84C]">{formatCompact(activeScenario.retirementBalance)}</p>
                    <p className="text-xs text-muted-foreground mt-1">at age {activeScenario.retirementAge}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Monthly Income</p>
                    <p className="text-2xl font-bold">{formatCurrency(activeScenario.monthlyRetirementIncome)}</p>
                    <p className="text-xs text-muted-foreground mt-1">sustainable withdrawal</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Net Worth at 60</p>
                    <p className="text-2xl font-bold">{formatCompact(activeScenario.netWorthAt60)}</p>
                    <p className="text-xs text-muted-foreground mt-1">projected total</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Years to Retire</p>
                    <p className="text-2xl font-bold">{activeScenario.retirementAge - 45}</p>
                    <p className="text-xs text-muted-foreground mt-1">from today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Want personalized recommendations based on your scenarios?</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/monte-carlo')}>
                  Run Monte Carlo
                </Button>
                <Button className="bg-[#1a2744] hover:bg-[#1a2744]/90" onClick={() => navigate('/ai-advisor')}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Analysis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ScenarioComparison;
