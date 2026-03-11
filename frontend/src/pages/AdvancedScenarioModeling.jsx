import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ChartContainer from "@/components/ChartContainer";
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Copy,
  Download,
  Upload,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  Layers,
  GitBranch,
  Percent,
  Building2,
  Home,
  PiggyBank,
  Users,
  Calendar
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

// Tax calculation with 2024-25 brackets
const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 0.16 },
  { min: 45001, max: 135000, rate: 0.30 },
  { min: 135001, max: 190000, rate: 0.37 },
  { min: 190001, max: Infinity, rate: 0.45 }
];

const calculateTax = (income) => {
  let tax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income > bracket.min) {
      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      tax += Math.max(0, taxableInBracket) * bracket.rate;
    }
  }
  // Medicare levy 2%
  if (income > 24276) {
    tax += income * 0.02;
  }
  return Math.round(tax);
};

// Compound growth calculation
const calculateFutureValue = (presentValue, rate, years) => {
  return presentValue * Math.pow(1 + rate, years);
};

// Loan repayment calculation
const calculateLoanPayment = (principal, annualRate, years) => {
  const monthlyRate = annualRate / 12;
  const months = years * 12;
  if (monthlyRate === 0) return principal / months;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
};

const COLORS = ['#0F392B', '#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const defaultScenario = {
  id: Date.now(),
  name: "Base Case",
  description: "Current financial position",
  assumptions: {
    incomeGrowth: 3,
    inflationRate: 3,
    propertyGrowth: 5,
    shareGrowth: 7,
    interestRate: 6.5,
    superReturn: 7,
    retirementAge: 65
  },
  adjustments: {
    salaryChange: 0,
    additionalSuper: 0,
    propertyPurchase: false,
    propertyValue: 0,
    sellProperty: false,
    shareInvestment: 0,
    debtPaydown: 0
  }
};

const AdvancedScenarioModeling = () => {
  const { familyMembers, portfolio, sharePortfolio, trust, company, budget } = usePortfolio();
  
  const [scenarios, setScenarios] = useState([
    { ...defaultScenario, id: 1, name: "Base Case" },
    { ...defaultScenario, id: 2, name: "Aggressive Growth", assumptions: { ...defaultScenario.assumptions, shareGrowth: 10, propertyGrowth: 7 } }
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState(1);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState([1, 2]);
  const [projectionYears, setProjectionYears] = useState(10);
  const [activeTab, setActiveTab] = useState("builder");

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  // Calculate current net worth
  const currentNetWorth = useMemo(() => {
    const propertyValue = portfolio.investments?.properties?.reduce((sum, p) => sum + p.value, 0) || 0;
    const propertyDebt = portfolio.investments?.properties?.reduce((sum, p) => sum + (p.mortgage_amount || 0), 0) || 0;
    const shareValue = sharePortfolio.reduce((sum, s) => sum + s.quantity * s.currentPrice, 0);
    const cash = portfolio.investments?.cash_savings || 0;
    const termDeposit = portfolio.investments?.term_deposit_amount || 0;
    const superBalance = familyMembers.reduce((sum, m) => sum + (m.superBalance || 0), 0);
    
    return {
      propertyValue,
      propertyDebt,
      shareValue,
      cash,
      termDeposit,
      superBalance,
      totalAssets: propertyValue + shareValue + cash + termDeposit + superBalance,
      totalDebt: propertyDebt,
      netWorth: propertyValue + shareValue + cash + termDeposit + superBalance - propertyDebt
    };
  }, [portfolio, sharePortfolio, familyMembers]);

  // Calculate annual income and tax
  const currentIncome = useMemo(() => {
    const salaryIncome = familyMembers.reduce((sum, m) => sum + (m.salaryIncome || m.taxableIncome || 0), 0);
    const dividendIncome = sharePortfolio.reduce((sum, s) => 
      sum + (s.quantity * s.currentPrice * (s.dividendYield / 100)), 0);
    const rentalIncome = portfolio.investments?.properties?.reduce((sum, p) => sum + (p.rental_income || 0), 0) || 0;
    const totalIncome = salaryIncome + dividendIncome + rentalIncome;
    const totalTax = familyMembers.reduce((sum, m) => sum + calculateTax(m.taxableIncome || 0), 0);
    
    return { salaryIncome, dividendIncome, rentalIncome, totalIncome, totalTax };
  }, [familyMembers, sharePortfolio, portfolio]);

  // Generate projection data for a scenario
  const generateProjection = (scenario) => {
    const data = [];
    let netWorth = currentNetWorth.netWorth;
    let propertyValue = currentNetWorth.propertyValue;
    let shareValue = currentNetWorth.shareValue;
    let superBalance = currentNetWorth.superBalance;
    let debt = currentNetWorth.propertyDebt;
    let income = currentIncome.totalIncome;
    
    const { assumptions, adjustments } = scenario;
    
    // Apply adjustments
    if (adjustments.propertyPurchase && adjustments.propertyValue > 0) {
      propertyValue += adjustments.propertyValue;
      debt += adjustments.propertyValue * 0.8; // Assume 80% LVR
    }
    if (adjustments.sellProperty) {
      const soldValue = currentNetWorth.propertyValue * 0.3; // Sell 30%
      propertyValue -= soldValue;
      debt -= soldValue * 0.6; // Assume 60% of sold value was debt
    }
    shareValue += adjustments.shareInvestment;
    superBalance += adjustments.additionalSuper;
    debt -= adjustments.debtPaydown;
    income *= (1 + adjustments.salaryChange / 100);

    for (let year = 0; year <= projectionYears; year++) {
      // Growth calculations
      if (year > 0) {
        propertyValue *= (1 + assumptions.propertyGrowth / 100);
        shareValue *= (1 + assumptions.shareGrowth / 100);
        superBalance *= (1 + assumptions.superReturn / 100);
        income *= (1 + assumptions.incomeGrowth / 100);
        
        // Debt reduction (assume 3% principal paydown per year)
        debt *= 0.97;
        
        // Add super contributions (11.5% of salary)
        superBalance += income * 0.115;
      }

      netWorth = propertyValue + shareValue + superBalance + currentNetWorth.cash - debt;
      
      data.push({
        year: `Year ${year}`,
        yearNum: year,
        netWorth: Math.round(netWorth),
        propertyValue: Math.round(propertyValue),
        shareValue: Math.round(shareValue),
        superBalance: Math.round(superBalance),
        debt: Math.round(debt),
        income: Math.round(income)
      });
    }
    
    return data;
  };

  // Generate projections for all scenarios
  const projections = useMemo(() => {
    const result = {};
    scenarios.forEach(scenario => {
      result[scenario.id] = generateProjection(scenario);
    });
    return result;
  }, [scenarios, projectionYears, currentNetWorth, currentIncome]);

  // Comparison chart data
  const comparisonData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= projectionYears; i++) {
      const point = { year: `Year ${i}` };
      selectedComparison.forEach(scenarioId => {
        const scenario = scenarios.find(s => s.id === scenarioId);
        if (scenario && projections[scenarioId]) {
          point[scenario.name] = projections[scenarioId][i]?.netWorth || 0;
        }
      });
      data.push(point);
    }
    return data;
  }, [projections, selectedComparison, scenarios, projectionYears]);

  // Add new scenario
  const addScenario = () => {
    const newScenario = {
      ...defaultScenario,
      id: Date.now(),
      name: `Scenario ${scenarios.length + 1}`,
      description: "New scenario"
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newScenario.id);
    toast.success("New scenario created");
  };

  // Duplicate scenario
  const duplicateScenario = (id) => {
    const source = scenarios.find(s => s.id === id);
    if (source) {
      const newScenario = {
        ...JSON.parse(JSON.stringify(source)),
        id: Date.now(),
        name: `${source.name} (Copy)`
      };
      setScenarios([...scenarios, newScenario]);
      setActiveScenarioId(newScenario.id);
      toast.success("Scenario duplicated");
    }
  };

  // Delete scenario
  const deleteScenario = (id) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter(s => s.id !== id));
      if (activeScenarioId === id) {
        setActiveScenarioId(scenarios[0].id);
      }
      toast.success("Scenario deleted");
    }
  };

  // Update scenario
  const updateScenario = (id, field, value) => {
    setScenarios(scenarios.map(s => {
      if (s.id === id) {
        const parts = field.split('.');
        if (parts.length === 2) {
          return { ...s, [parts[0]]: { ...s[parts[0]], [parts[1]]: value } };
        }
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  // Calculate scenario outcomes
  const scenarioOutcomes = useMemo(() => {
    return scenarios.map(scenario => {
      const projection = projections[scenario.id];
      const finalYear = projection?.[projectionYears];
      const startYear = projection?.[0];
      
      return {
        ...scenario,
        finalNetWorth: finalYear?.netWorth || 0,
        startNetWorth: startYear?.netWorth || 0,
        totalGrowth: finalYear ? ((finalYear.netWorth - startYear.netWorth) / startYear.netWorth * 100) : 0,
        annualizedReturn: finalYear ? (Math.pow(finalYear.netWorth / startYear.netWorth, 1 / projectionYears) - 1) * 100 : 0
      };
    });
  }, [scenarios, projections, projectionYears]);

  // Radar chart data for scenario comparison
  const radarData = useMemo(() => {
    return [
      { metric: "Growth Rate", fullMark: 15 },
      { metric: "Risk Level", fullMark: 10 },
      { metric: "Diversification", fullMark: 10 },
      { metric: "Liquidity", fullMark: 10 },
      { metric: "Tax Efficiency", fullMark: 10 },
      { metric: "Cash Flow", fullMark: 10 }
    ].map(item => {
      const result = { ...item };
      selectedComparison.forEach(id => {
        const scenario = scenarios.find(s => s.id === id);
        if (scenario) {
          // Calculate metrics based on scenario assumptions
          const a = scenario.assumptions;
          result[scenario.name] = {
            "Growth Rate": (a.shareGrowth + a.propertyGrowth) / 2,
            "Risk Level": 10 - (a.shareGrowth - 7), // Higher growth = higher risk
            "Diversification": 7,
            "Liquidity": scenario.adjustments.debtPaydown > 0 ? 8 : 6,
            "Tax Efficiency": scenario.adjustments.additionalSuper > 0 ? 9 : 6,
            "Cash Flow": 10 - (a.interestRate - 5)
          }[item.metric] || 5;
        }
      });
      return result;
    });
  }, [selectedComparison, scenarios]);

  return (
    <Layout>
      <div className="space-y-6" data-testid="advanced-scenario-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
              Advanced Scenario Modeling
            </h1>
            <p className="text-muted-foreground mt-1">
              Model and compare different financial strategies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-4">
              <Label className="text-sm">Compare Mode</Label>
              <Switch
                checked={comparisonMode}
                onCheckedChange={setComparisonMode}
              />
            </div>
            <Button variant="outline" onClick={addScenario} data-testid="add-scenario-btn">
              <Plus className="h-4 w-4 mr-2" />
              New Scenario
            </Button>
          </div>
        </div>

        {/* Current Position Summary */}
        <Card className="bg-[#0F392B] text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div>
                <p className="text-white/70 text-sm">Current Net Worth</p>
                <p className="text-3xl font-bold">{formatCurrency(currentNetWorth.netWorth)}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Total Assets</p>
                <p className="text-2xl font-bold">{formatCurrency(currentNetWorth.totalAssets)}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Total Debt</p>
                <p className="text-2xl font-bold text-red-300">{formatCurrency(currentNetWorth.totalDebt)}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Annual Income</p>
                <p className="text-2xl font-bold text-[#D4AF37]">{formatCurrency(currentIncome.totalIncome)}</p>
              </div>
              <div>
                <p className="text-white/70 text-sm">Projection Years</p>
                <Select value={projectionYears.toString()} onValueChange={(v) => setProjectionYears(Number(v))}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="15">15 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                    <SelectItem value="30">30 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="builder">Scenario Builder</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          {/* Scenario Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scenario List */}
              <Card>
                <CardHeader>
                  <CardTitle>Scenarios</CardTitle>
                  <CardDescription>{scenarios.length} scenarios created</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scenarios.map(scenario => (
                    <div 
                      key={scenario.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        activeScenarioId === scenario.id ? 'border-[#0F392B] bg-[#0F392B]/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setActiveScenarioId(scenario.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{scenario.name}</p>
                          <p className="text-xs text-muted-foreground">{scenario.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); duplicateScenario(scenario.id); }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {scenarios.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteScenario(scenario.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {projections[scenario.id]?.[projectionYears]?.netWorth 
                            ? formatCurrency(projections[scenario.id][projectionYears].netWorth)
                            : 'N/A'
                          }
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Scenario Editor */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Edit: {activeScenario.name}</CardTitle>
                      <CardDescription>Configure assumptions and adjustments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Scenario Name</Label>
                      <Input
                        value={activeScenario.name}
                        onChange={(e) => updateScenario(activeScenarioId, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={activeScenario.description}
                        onChange={(e) => updateScenario(activeScenarioId, 'description', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Market Assumptions */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#10B981]" />
                      Market Assumptions
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Income Growth (%)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={activeScenario.assumptions.incomeGrowth}
                          onChange={(e) => updateScenario(activeScenarioId, 'assumptions.incomeGrowth', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Property Growth (%)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={activeScenario.assumptions.propertyGrowth}
                          onChange={(e) => updateScenario(activeScenarioId, 'assumptions.propertyGrowth', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Share Growth (%)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={activeScenario.assumptions.shareGrowth}
                          onChange={(e) => updateScenario(activeScenarioId, 'assumptions.shareGrowth', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Interest Rate (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={activeScenario.assumptions.interestRate}
                          onChange={(e) => updateScenario(activeScenarioId, 'assumptions.interestRate', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Super Return (%)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={activeScenario.assumptions.superReturn}
                          onChange={(e) => updateScenario(activeScenarioId, 'assumptions.superReturn', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Inflation (%)</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={activeScenario.assumptions.inflationRate}
                          onChange={(e) => updateScenario(activeScenarioId, 'assumptions.inflationRate', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Retirement Age</Label>
                        <Input
                          type="number"
                          value={activeScenario.assumptions.retirementAge}
                          onChange={(e) => updateScenario(activeScenarioId, 'assumptions.retirementAge', Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Strategic Adjustments */}
                  <div className="p-4 rounded-lg bg-[#D4AF37]/10 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#D4AF37]" />
                      Strategic Adjustments
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Salary Change (%)</Label>
                          <span className="font-medium">{activeScenario.adjustments.salaryChange}%</span>
                        </div>
                        <Slider
                          value={[activeScenario.adjustments.salaryChange]}
                          onValueChange={(v) => updateScenario(activeScenarioId, 'adjustments.salaryChange', v[0])}
                          min={-50}
                          max={100}
                          step={5}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Additional Super Contribution</Label>
                          <span className="font-medium">{formatCurrency(activeScenario.adjustments.additionalSuper)}</span>
                        </div>
                        <Slider
                          value={[activeScenario.adjustments.additionalSuper]}
                          onValueChange={(v) => updateScenario(activeScenarioId, 'adjustments.additionalSuper', v[0])}
                          min={0}
                          max={30000}
                          step={1000}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Additional Share Investment</Label>
                          <span className="font-medium">{formatCurrency(activeScenario.adjustments.shareInvestment)}</span>
                        </div>
                        <Slider
                          value={[activeScenario.adjustments.shareInvestment]}
                          onValueChange={(v) => updateScenario(activeScenarioId, 'adjustments.shareInvestment', v[0])}
                          min={0}
                          max={500000}
                          step={10000}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Debt Paydown</Label>
                          <span className="font-medium">{formatCurrency(activeScenario.adjustments.debtPaydown)}</span>
                        </div>
                        <Slider
                          value={[activeScenario.adjustments.debtPaydown]}
                          onValueChange={(v) => updateScenario(activeScenarioId, 'adjustments.debtPaydown', v[0])}
                          min={0}
                          max={500000}
                          step={10000}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/50">
                        <div>
                          <Label>Buy Property</Label>
                          <p className="text-xs text-muted-foreground">Add investment property</p>
                        </div>
                        <Switch
                          checked={activeScenario.adjustments.propertyPurchase}
                          onCheckedChange={(v) => updateScenario(activeScenarioId, 'adjustments.propertyPurchase', v)}
                        />
                      </div>
                      {activeScenario.adjustments.propertyPurchase && (
                        <div className="space-y-2">
                          <Label className="text-xs">Property Value</Label>
                          <Input
                            type="number"
                            value={activeScenario.adjustments.propertyValue}
                            onChange={(e) => updateScenario(activeScenarioId, 'adjustments.propertyValue', Number(e.target.value))}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/50">
                        <div>
                          <Label>Sell Property</Label>
                          <p className="text-xs text-muted-foreground">Sell 30% of portfolio</p>
                        </div>
                        <Switch
                          checked={activeScenario.adjustments.sellProperty}
                          onCheckedChange={(v) => updateScenario(activeScenarioId, 'adjustments.sellProperty', v)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projections Tab */}
          <TabsContent value="projections" className="space-y-6">
            {comparisonMode ? (
              <>
                {/* Scenario Selection for Comparison */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <Label>Compare scenarios:</Label>
                      {scenarios.map(scenario => (
                        <div key={scenario.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`compare-${scenario.id}`}
                            checked={selectedComparison.includes(scenario.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedComparison([...selectedComparison, scenario.id]);
                              } else {
                                setSelectedComparison(selectedComparison.filter(id => id !== scenario.id));
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`compare-${scenario.id}`} className="text-sm">
                            {scenario.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Net Worth Comparison</CardTitle>
                    <CardDescription>Projected net worth across selected scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer height={400}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                          <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Legend />
                          {selectedComparison.map((id, i) => {
                            const scenario = scenarios.find(s => s.id === id);
                            return scenario ? (
                              <Line
                                key={id}
                                type="monotone"
                                dataKey={scenario.name}
                                stroke={COLORS[i % COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                              />
                            ) : null;
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Outcome Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenarioOutcomes
                    .filter(s => selectedComparison.includes(s.id))
                    .map((outcome, i) => (
                      <Card key={outcome.id} className="border-t-4" style={{ borderTopColor: COLORS[i % COLORS.length] }}>
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{outcome.name}</h4>
                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Final Net Worth</span>
                              <span className="font-bold">{formatCurrency(outcome.finalNetWorth)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Growth</span>
                              <span className={`font-bold ${outcome.totalGrowth >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>
                                {outcome.totalGrowth.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Annualized Return</span>
                              <span className="font-medium">{outcome.annualizedReturn.toFixed(2)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </>
            ) : (
              <>
                {/* Single Scenario Projection */}
                <Card>
                  <CardHeader>
                    <CardTitle>{activeScenario.name} - Wealth Projection</CardTitle>
                    <CardDescription>Breakdown by asset class over {projectionYears} years</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer height={400}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projections[activeScenarioId]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                          <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Legend />
                          <Area type="monotone" dataKey="propertyValue" name="Property" stackId="1" fill="#0F392B" stroke="#0F392B" />
                          <Area type="monotone" dataKey="shareValue" name="Shares" stackId="1" fill="#D4AF37" stroke="#D4AF37" />
                          <Area type="monotone" dataKey="superBalance" name="Super" stackId="1" fill="#10B981" stroke="#10B981" />
                          <Line type="monotone" dataKey="debt" name="Debt" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Year 0 Net Worth</p>
                      <p className="text-2xl font-bold">{formatCurrency(projections[activeScenarioId]?.[0]?.netWorth || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Year {projectionYears} Net Worth</p>
                      <p className="text-2xl font-bold text-[#10B981]">
                        {formatCurrency(projections[activeScenarioId]?.[projectionYears]?.netWorth || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Total Growth</p>
                      <p className="text-2xl font-bold text-[#D4AF37]">
                        {scenarioOutcomes.find(s => s.id === activeScenarioId)?.totalGrowth.toFixed(1) || 0}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Annualized Return</p>
                      <p className="text-2xl font-bold">
                        {scenarioOutcomes.find(s => s.id === activeScenarioId)?.annualizedReturn.toFixed(2) || 0}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scenario Ranking */}
              <Card>
                <CardHeader>
                  <CardTitle>Scenario Ranking</CardTitle>
                  <CardDescription>By projected net worth at year {projectionYears}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scenarioOutcomes
                      .sort((a, b) => b.finalNetWorth - a.finalNetWorth)
                      .map((outcome, i) => (
                        <div key={outcome.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              i === 0 ? 'bg-[#D4AF37]' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium">{outcome.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Growth: {outcome.totalGrowth.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(outcome.finalNetWorth)}</p>
                            <p className="text-xs text-muted-foreground">
                              +{formatCurrency(outcome.finalNetWorth - outcome.startNetWorth)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-[#D4AF37]" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scenarioOutcomes.length > 1 && (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#10B981]/10">
                        <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Best Performing Scenario</p>
                          <p className="text-sm text-muted-foreground">
                            "{scenarioOutcomes.sort((a, b) => b.finalNetWorth - a.finalNetWorth)[0].name}" 
                            projects the highest net worth of {formatCurrency(scenarioOutcomes.sort((a, b) => b.finalNetWorth - a.finalNetWorth)[0].finalNetWorth)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#D4AF37]/10">
                        <TrendingUp className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Growth Difference</p>
                          <p className="text-sm text-muted-foreground">
                            The difference between best and worst scenarios is{' '}
                            {formatCurrency(
                              Math.max(...scenarioOutcomes.map(s => s.finalNetWorth)) -
                              Math.min(...scenarioOutcomes.map(s => s.finalNetWorth))
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {activeScenario.adjustments.additionalSuper > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#3B82F6]/10">
                      <PiggyBank className="h-5 w-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Super Contribution Impact</p>
                        <p className="text-sm text-muted-foreground">
                          Additional super contribution of {formatCurrency(activeScenario.adjustments.additionalSuper)}/year 
                          provides tax savings and compounding growth benefits
                        </p>
                      </div>
                    </div>
                  )}

                  {activeScenario.adjustments.debtPaydown > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#10B981]/10">
                      <TrendingDown className="h-5 w-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Debt Reduction Strategy</p>
                        <p className="text-sm text-muted-foreground">
                          Paying down {formatCurrency(activeScenario.adjustments.debtPaydown)} reduces interest 
                          expense and improves cash flow
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800">Important Note</p>
                      <p className="text-sm text-amber-700">
                        Projections are based on assumed growth rates and do not account for market volatility, 
                        tax changes, or personal circumstances. Consult a financial advisor.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Year-by-Year Table */}
            <Card>
              <CardHeader>
                <CardTitle>Year-by-Year Projection: {activeScenario.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3">Year</th>
                        <th className="text-right p-3">Net Worth</th>
                        <th className="text-right p-3">Property</th>
                        <th className="text-right p-3">Shares</th>
                        <th className="text-right p-3">Super</th>
                        <th className="text-right p-3">Debt</th>
                        <th className="text-right p-3">Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projections[activeScenarioId]?.slice(0, 11).map((row, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3 font-medium">{row.year}</td>
                          <td className="text-right p-3 font-bold text-[#0F392B]">{formatCurrency(row.netWorth)}</td>
                          <td className="text-right p-3">{formatCurrency(row.propertyValue)}</td>
                          <td className="text-right p-3">{formatCurrency(row.shareValue)}</td>
                          <td className="text-right p-3">{formatCurrency(row.superBalance)}</td>
                          <td className="text-right p-3 text-destructive">{formatCurrency(row.debt)}</td>
                          <td className="text-right p-3 text-[#D4AF37]">{formatCurrency(row.income)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdvancedScenarioModeling;
