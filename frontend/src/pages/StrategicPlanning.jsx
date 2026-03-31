import { useState, useMemo, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import ChartContainer from "@/components/ChartContainer";
import { ComplianceFooter, CalculatorDisclaimer } from "@/components/ComplianceDisclaimer";
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  GitBranch,
  Scale,
  PiggyBank,
  Users,
  Calendar,
  HeartPulse,
  FileText,
  Home,
  Briefcase
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import axios from "axios";
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Helper functions to replace nested ternaries
const getChecklistBgClass = (item) => {
  if (item.complete) return 'bg-[#10B981]/10';
  if (item.priority === 'critical') return 'bg-destructive/10';
  return 'bg-muted/50';
};

const getChecklistBadgeVariant = (item) => {
  if (item.complete) return 'secondary';
  if (item.priority === 'critical') return 'destructive';
  return 'outline';
};

const getChecklistIconClass = (priority) => {
  if (priority === 'critical') return 'text-destructive';
  return 'text-amber-500';
};

const getRelationship = (member) => {
  if (member.relationship === 'spouse') return 'spouse';
  if (member.age < 18) return 'child_under_18';
  return 'adult_child';
};

const getRankBadgeClass = (index) => {
  if (index === 0) return 'bg-[#D4A84C]';
  if (index === 1) return 'bg-gray-400';
  return 'bg-amber-700';
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Tax calculation with 2024-25 brackets (Stage 3)
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
  if (income > 24276) tax += income * 0.02; // Medicare
  return Math.round(tax);
};

const COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

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

const StrategicPlanning = () => {
  const { familyMembers, portfolio, sharePortfolio, trust, company, budget } = usePortfolio();
  const primaryMember = familyMembers.find(m => m.relationship === 'primary') || familyMembers[0];

  const [mainTab, setMainTab] = useState("lifecycle");
  const [loading, setLoading] = useState(false);

  // ==================== LIFECYCLE STATE ====================
  const [lifecycleTab, setLifecycleTab] = useState("retirement");
  
  const [retirementPlan, setRetirementPlan] = useState({
    current_age: primaryMember?.age || 45,
    retirement_age: 67,
    life_expectancy: 90,
    current_super: primaryMember?.superBalance || 320000,
    current_savings: portfolio?.investments?.cash_savings || 75000,
    annual_income: primaryMember?.salaryIncome || 120000,
    annual_expenses: 80000,
    desired_retirement_income: 70000,
    super_contribution_rate: 11.5,
    salary_sacrifice: 5000,
    investment_return: 7.0,
    inflation_rate: 2.5
  });
  const [retirementResult, setRetirementResult] = useState(null);

  const [estatePlan, setEstatePlan] = useState({
    total_assets: portfolio?.summary?.totalAssets || 2920000,
    total_super: familyMembers.reduce((sum, m) => sum + (m.superBalance || 0), 0),
    property_value: portfolio?.investments?.properties?.reduce((sum, p) => sum + p.value, 0) || 1570000,
    beneficiaries: familyMembers.filter(m => m.relationship !== 'primary').map(m => ({
      name: m.name,
      relationship: getRelationship(m),
      share_percent: 100 / (familyMembers.length - 1 || 1)
    })),
    has_will: false,
    has_testamentary_trust: false,
    has_power_of_attorney: false
  });
  const [estateResult, setEstateResult] = useState(null);

  const [goals, setGoals] = useState([
    { name: "Emergency Fund", target_amount: 50000, target_date: "2025-12-31", current_savings: 25000, monthly_contribution: 500, priority: "high" },
    { name: "Children's Education", target_amount: 150000, target_date: "2030-01-01", current_savings: 35000, monthly_contribution: 800, priority: "high" },
    { name: "Holiday Home", target_amount: 300000, target_date: "2035-01-01", current_savings: 0, monthly_contribution: 1000, priority: "low" }
  ]);
  const [goalResult, setGoalResult] = useState(null);
  const [availableMonthlySavings, setAvailableMonthlySavings] = useState(3000);
  const [riskTolerance, setRiskTolerance] = useState("moderate");

  // ==================== SCENARIO STATE ====================
  const [scenarios, setScenarios] = useState([
    { ...defaultScenario, id: 1, name: "Base Case" },
    { ...defaultScenario, id: 2, name: "Aggressive Growth", assumptions: { ...defaultScenario.assumptions, shareGrowth: 10, propertyGrowth: 7 } }
  ]);
  const [activeScenarioId, setActiveScenarioId] = useState(1);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState([1, 2]);
  const [projectionYears, setProjectionYears] = useState(10);
  const [scenarioTab, setScenarioTab] = useState("builder");

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  // Current net worth calculation
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

  // Current income
  const currentIncome = useMemo(() => {
    const salaryIncome = familyMembers.reduce((sum, m) => sum + (m.salaryIncome || m.taxableIncome || 0), 0);
    const dividendIncome = sharePortfolio.reduce((sum, s) => 
      sum + (s.quantity * s.currentPrice * (s.dividendYield / 100)), 0);
    const rentalIncome = portfolio.investments?.properties?.reduce((sum, p) => sum + (p.rental_income || 0), 0) || 0;
    const totalIncome = salaryIncome + dividendIncome + rentalIncome;
    const totalTax = familyMembers.reduce((sum, m) => sum + calculateTax(m.taxableIncome || 0), 0);
    
    return { salaryIncome, dividendIncome, rentalIncome, totalIncome, totalTax };
  }, [familyMembers, sharePortfolio, portfolio]);

  // Generate projection for a scenario
  const generateProjection = (scenario) => {
    const data = [];
    let netWorth = currentNetWorth.netWorth;
    let propertyValue = currentNetWorth.propertyValue;
    let shareValue = currentNetWorth.shareValue;
    let superBalance = currentNetWorth.superBalance;
    let debt = currentNetWorth.propertyDebt;
    let income = currentIncome.totalIncome;
    
    const { assumptions, adjustments } = scenario;
    
    if (adjustments.propertyPurchase && adjustments.propertyValue > 0) {
      propertyValue += adjustments.propertyValue;
      debt += adjustments.propertyValue * 0.8;
    }
    if (adjustments.sellProperty) {
      const soldValue = currentNetWorth.propertyValue * 0.3;
      propertyValue -= soldValue;
      debt -= soldValue * 0.6;
    }
    shareValue += adjustments.shareInvestment;
    superBalance += adjustments.additionalSuper;
    debt -= adjustments.debtPaydown;
    income *= (1 + adjustments.salaryChange / 100);

    for (let year = 0; year <= projectionYears; year++) {
      if (year > 0) {
        propertyValue *= (1 + assumptions.propertyGrowth / 100);
        shareValue *= (1 + assumptions.shareGrowth / 100);
        superBalance *= (1 + assumptions.superReturn / 100);
        income *= (1 + assumptions.incomeGrowth / 100);
        debt *= 0.97;
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

  const projections = useMemo(() => {
    const result = {};
    scenarios.forEach(scenario => {
      result[scenario.id] = generateProjection(scenario);
    });
    return result;
  }, [scenarios, projectionYears, currentNetWorth, currentIncome]);

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

  // ==================== API CALLS ====================
  const calculateRetirement = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/lifecycle/retirement-plan`, retirementPlan);
      setRetirementResult(response.data);
      toast.success("Retirement plan calculated");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to calculate retirement plan");
    } finally {
      setLoading(false);
    }
  };

  const calculateEstate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/lifecycle/estate-plan`, estatePlan);
      setEstateResult(response.data);
      toast.success("Estate plan analyzed");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze estate plan");
    } finally {
      setLoading(false);
    }
  };

  const calculateGoals = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/lifecycle/goal-planning`, {
        goals,
        available_monthly_savings: availableMonthlySavings,
        risk_tolerance: riskTolerance
      });
      setGoalResult(response.data);
      toast.success("Goals analyzed");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to analyze goals");
    } finally {
      setLoading(false);
    }
  };

  // ==================== SCENARIO HELPERS ====================
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

  const deleteScenario = (id) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter(s => s.id !== id));
      if (activeScenarioId === id) {
        setActiveScenarioId(scenarios[0].id);
      }
      toast.success("Scenario deleted");
    }
  };

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

  const addGoal = () => {
    setGoals([...goals, {
      name: "New Goal",
      target_amount: 10000,
      target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      current_savings: 0,
      monthly_contribution: 100,
      priority: "medium"
    }]);
  };

  const removeGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const updateGoal = (index, field, value) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], [field]: value };
    setGoals(updated);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="strategic-planning-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Strategic Planning
            </h1>
            <p className="text-muted-foreground mt-1">
              Lifecycle planning, scenario modeling, and what-if analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={projectionYears.toString()} onValueChange={(v) => setProjectionYears(Number(v))}>
              <SelectTrigger className="w-32">
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

        {/* Current Position Summary */}
        <Card className="bg-[#1a2744] text-white">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-white/70 text-xs">Net Worth</p>
                <p className="text-2xl font-bold">{formatCurrency(currentNetWorth.netWorth)}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs">Total Assets</p>
                <p className="text-xl font-bold">{formatCurrency(currentNetWorth.totalAssets)}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs">Total Debt</p>
                <p className="text-xl font-bold text-red-300">{formatCurrency(currentNetWorth.totalDebt)}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs">Annual Income</p>
                <p className="text-xl font-bold text-[#D4A84C]">{formatCurrency(currentIncome.totalIncome)}</p>
              </div>
              <div>
                <p className="text-white/70 text-xs">Annual Tax</p>
                <p className="text-xl font-bold">{formatCurrency(currentIncome.totalTax)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="lifecycle" className="flex items-center gap-1">
              <HeartPulse className="h-4 w-4" /> Lifecycle
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" /> Scenarios
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-1">
              <Scale className="h-4 w-4" /> Compare
            </TabsTrigger>
            <TabsTrigger value="whatif" className="flex items-center gap-1">
              <Target className="h-4 w-4" /> What-If
            </TabsTrigger>
          </TabsList>

          {/* ==================== LIFECYCLE TAB ==================== */}
          <TabsContent value="lifecycle" className="space-y-6">
            <Tabs value={lifecycleTab} onValueChange={setLifecycleTab}>
              <TabsList>
                <TabsTrigger value="retirement">
                  <PiggyBank className="h-4 w-4 mr-1" /> Retirement
                </TabsTrigger>
                <TabsTrigger value="estate">
                  <FileText className="h-4 w-4 mr-1" /> Estate
                </TabsTrigger>
                <TabsTrigger value="goals">
                  <Target className="h-4 w-4 mr-1" /> Goals
                </TabsTrigger>
              </TabsList>

              {/* Retirement Tab */}
              <TabsContent value="retirement" className="space-y-6">
                <CalculatorDisclaimer calculatorName="retirement calculator" />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Retirement Parameters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Current Age</Label>
                          <Input
                            type="number"
                            value={retirementPlan.current_age}
                            onChange={e => setRetirementPlan({...retirementPlan, current_age: Number(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Retirement Age</Label>
                          <Input
                            type="number"
                            value={retirementPlan.retirement_age}
                            onChange={e => setRetirementPlan({...retirementPlan, retirement_age: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Current Super Balance</Label>
                        <Input type="number" value={retirementPlan.current_super} onChange={e => setRetirementPlan({...retirementPlan, current_super: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Annual Income</Label>
                        <Input type="number" value={retirementPlan.annual_income} onChange={e => setRetirementPlan({...retirementPlan, annual_income: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Desired Retirement Income</Label>
                        <Input type="number" value={retirementPlan.desired_retirement_income} onChange={e => setRetirementPlan({...retirementPlan, desired_retirement_income: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Salary Sacrifice (Annual)</Label>
                        <Input type="number" value={retirementPlan.salary_sacrifice} onChange={e => setRetirementPlan({...retirementPlan, salary_sacrifice: Number(e.target.value)})} />
                      </div>
                      <Button onClick={calculateRetirement} className="w-full bg-[#1a2744]" disabled={loading}>
                        <Calculator className="h-4 w-4 mr-2" />
                        {loading ? "Calculating..." : "Calculate"}
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2 space-y-4">
                    {retirementResult ? (
                      <>
                        <div className="grid grid-cols-4 gap-3">
                          <Card className="bg-[#1a2744] text-white">
                            <CardContent className="p-3">
                              <p className="text-xs text-white/70">At Retirement</p>
                              <p className="text-lg font-bold">{formatCurrency(retirementResult.summary.total_at_retirement)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">Sustainable Income</p>
                              <p className="text-lg font-bold text-[#10B981]">{formatCurrency(retirementResult.summary.sustainable_annual_income)}/yr</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">Income Gap</p>
                              <p className={`text-lg font-bold ${retirementResult.summary.income_gap > 0 ? 'text-destructive' : 'text-[#10B981]'}`}>
                                {retirementResult.summary.income_gap > 0 ? '-' : ''}{formatCurrency(Math.abs(retirementResult.summary.income_gap))}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className={retirementResult.summary.shortfall_years > 0 ? 'bg-destructive/10' : 'bg-[#10B981]/10'}>
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">Lasts Until</p>
                              <p className="text-lg font-bold">Age {retirementResult.summary.money_lasts_until_age}</p>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardContent className="p-4">
                            <ChartContainer height={250}>
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={retirementResult.projections}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis dataKey="age" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                                  <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                                  <Tooltip formatter={(v) => formatCurrency(v)} labelFormatter={(v) => `Age ${v}`} />
                                  <Area type="monotone" dataKey="balance" stroke="#1a2744" fill="#1a2744" fillOpacity={0.3} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </ChartContainer>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card className="h-[300px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Click Calculate to see projections</p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Estate Tab */}
              <TabsContent value="estate" className="space-y-6">
                <CalculatorDisclaimer calculatorName="estate planning tool" />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Estate Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Total Assets</Label>
                        <Input type="number" value={estatePlan.total_assets} onChange={e => setEstatePlan({...estatePlan, total_assets: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total Super</Label>
                        <Input type="number" value={estatePlan.total_super} onChange={e => setEstatePlan({...estatePlan, total_super: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Valid Will</Label>
                          <Switch checked={estatePlan.has_will} onCheckedChange={(v) => setEstatePlan({...estatePlan, has_will: v})} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Power of Attorney</Label>
                          <Switch checked={estatePlan.has_power_of_attorney} onCheckedChange={(v) => setEstatePlan({...estatePlan, has_power_of_attorney: v})} />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Testamentary Trust</Label>
                          <Switch checked={estatePlan.has_testamentary_trust} onCheckedChange={(v) => setEstatePlan({...estatePlan, has_testamentary_trust: v})} />
                        </div>
                      </div>
                      <Button onClick={calculateEstate} className="w-full bg-[#1a2744]" disabled={loading}>
                        <Calculator className="h-4 w-4 mr-2" />
                        {loading ? "Analyzing..." : "Analyze"}
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2 space-y-4">
                    {estateResult ? (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          <Card className="bg-[#1a2744] text-white">
                            <CardContent className="p-3">
                              <p className="text-xs text-white/70">Total Estate</p>
                              <p className="text-lg font-bold">{formatCurrency(estateResult.estate_summary.total_estate_value)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">Super Component</p>
                              <p className="text-lg font-bold text-[#D4A84C]">{formatCurrency(estateResult.estate_summary.total_super)}</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <p className="text-xs text-muted-foreground">Potential Tax</p>
                              <p className="text-lg font-bold text-destructive">{formatCurrency(estateResult.tax_considerations.potential_super_death_tax)}</p>
                            </CardContent>
                          </Card>
                        </div>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Estate Planning Checklist</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {estateResult.checklist.map((item, i) => (
                                <div key={`item-${i}`} className={`flex items-center justify-between p-2 rounded ${getChecklistBgClass(item)}`}>
                                  <div className="flex items-center gap-2">
                                    {item.complete ? <CheckCircle className="h-4 w-4 text-[#10B981]" /> : <AlertTriangle className={`h-4 w-4 ${getChecklistIconClass(item.priority)}`} />}
                                    <span className="text-sm">{item.item}</span>
                                  </div>
                                  <Badge variant={getChecklistBadgeVariant(item)} className="text-xs">
                                    {item.complete ? 'Done' : item.priority}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card className="h-[300px] flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Click Analyze to review estate</p>
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Goals Tab */}
              <TabsContent value="goals" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Financial Goals</h3>
                  <Button variant="outline" size="sm" onClick={addGoal}>
                    <Plus className="h-4 w-4 mr-1" /> Add Goal
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-3">
                    {goals.map((goal, index) => (
                      <Card key={`item-${index}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Input value={goal.name} onChange={e => updateGoal(index, 'name', e.target.value)} className="font-medium border-0 p-0 h-auto max-w-[150px]" />
                            <div className="flex items-center gap-2">
                              <Select value={goal.priority} onValueChange={v => updateGoal(index, 'priority', v)}>
                                <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeGoal(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div><Label className="text-[10px]">Target</Label><Input type="number" value={goal.target_amount} onChange={e => updateGoal(index, 'target_amount', Number(e.target.value))} className="h-8 text-sm" /></div>
                            <div><Label className="text-[10px]">Date</Label><Input type="date" value={goal.target_date} onChange={e => updateGoal(index, 'target_date', e.target.value)} className="h-8 text-sm" /></div>
                            <div><Label className="text-[10px]">Current</Label><Input type="number" value={goal.current_savings} onChange={e => updateGoal(index, 'current_savings', Number(e.target.value))} className="h-8 text-sm" /></div>
                            <div><Label className="text-[10px]">Monthly</Label><Input type="number" value={goal.monthly_contribution} onChange={e => updateGoal(index, 'monthly_contribution', Number(e.target.value))} className="h-8 text-sm" /></div>
                          </div>
                          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-[#1a2744]" style={{ width: `${Math.min(100, (goal.current_savings / goal.target_amount) * 100)}%` }} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Planning Settings</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Monthly Savings Available</Label>
                          <Input type="number" value={availableMonthlySavings} onChange={e => setAvailableMonthlySavings(Number(e.target.value))} />
                        </div>
                        <div>
                          <Label className="text-xs">Risk Tolerance</Label>
                          <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conservative">Conservative (4%)</SelectItem>
                              <SelectItem value="moderate">Moderate (6%)</SelectItem>
                              <SelectItem value="aggressive">Aggressive (8%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={calculateGoals} className="w-full bg-[#1a2744]" disabled={loading}>
                          <Calculator className="h-4 w-4 mr-2" />
                          {loading ? "Analyzing..." : "Analyze Goals"}
                        </Button>
                      </CardContent>
                    </Card>

                    {goalResult && (
                      <Card>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Goals On Track</span>
                            <span className="font-bold">{goalResult.summary.goals_on_track}/{goalResult.summary.total_goals}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Monthly Required</span>
                            <span className="font-bold">{formatCurrency(goalResult.summary.total_monthly_required)}</span>
                          </div>
                          <div className={`p-2 rounded text-sm ${goalResult.summary.monthly_surplus_shortfall >= 0 ? 'bg-[#10B981]/10' : 'bg-destructive/10'}`}>
                            <span className="font-medium">{goalResult.summary.monthly_surplus_shortfall >= 0 ? 'Surplus: ' : 'Shortfall: '}</span>
                            <span className="font-bold">{formatCurrency(Math.abs(goalResult.summary.monthly_surplus_shortfall))}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ==================== SCENARIOS TAB ==================== */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Scenario Builder</h3>
              <Button variant="outline" onClick={addScenario}>
                <Plus className="h-4 w-4 mr-2" /> New Scenario
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Scenario List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Scenarios ({scenarios.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {scenarios.map(scenario => (
                    <div 
                      key={scenario.id}
                      className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                        activeScenarioId === scenario.id ? 'border-[#1a2744] bg-[#1a2744]/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setActiveScenarioId(scenario.id)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{scenario.name}</p>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); duplicateScenario(scenario.id); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          {scenarios.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); deleteScenario(scenario.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {formatCurrency(projections[scenario.id]?.[projectionYears]?.netWorth || 0)}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Scenario Editor */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Input value={activeScenario.name} onChange={(e) => updateScenario(activeScenarioId, 'name', e.target.value)} className="font-semibold border-0 p-0 h-auto text-lg max-w-[200px]" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Assumptions */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#10B981]" /> Market Assumptions
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { key: 'incomeGrowth', label: 'Income Growth %' },
                        { key: 'propertyGrowth', label: 'Property Growth %' },
                        { key: 'shareGrowth', label: 'Share Growth %' },
                        { key: 'interestRate', label: 'Interest Rate %' },
                        { key: 'superReturn', label: 'Super Return %' },
                        { key: 'inflationRate', label: 'Inflation %' },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-[10px]">{label}</Label>
                          <Input type="number" step="0.5" value={activeScenario.assumptions[key]} onChange={(e) => updateScenario(activeScenarioId, `assumptions.${key}`, Number(e.target.value))} className="h-8" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adjustments */}
                  <div className="p-3 rounded-lg bg-[#D4A84C]/10">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#D4A84C]" /> Strategic Adjustments
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Salary Change</span><span>{activeScenario.adjustments.salaryChange}%</span></div>
                        <Slider value={[activeScenario.adjustments.salaryChange]} onValueChange={(v) => updateScenario(activeScenarioId, 'adjustments.salaryChange', v[0])} min={-50} max={100} step={5} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Extra Super</span><span>{formatCurrency(activeScenario.adjustments.additionalSuper)}</span></div>
                        <Slider value={[activeScenario.adjustments.additionalSuper]} onValueChange={(v) => updateScenario(activeScenarioId, 'adjustments.additionalSuper', v[0])} min={0} max={30000} step={1000} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Share Investment</span><span>{formatCurrency(activeScenario.adjustments.shareInvestment)}</span></div>
                        <Slider value={[activeScenario.adjustments.shareInvestment]} onValueChange={(v) => updateScenario(activeScenarioId, 'adjustments.shareInvestment', v[0])} min={0} max={500000} step={10000} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span>Debt Paydown</span><span>{formatCurrency(activeScenario.adjustments.debtPaydown)}</span></div>
                        <Slider value={[activeScenario.adjustments.debtPaydown]} onValueChange={(v) => updateScenario(activeScenarioId, 'adjustments.debtPaydown', v[0])} min={0} max={500000} step={10000} />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4 pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Switch checked={activeScenario.adjustments.propertyPurchase} onCheckedChange={(v) => updateScenario(activeScenarioId, 'adjustments.propertyPurchase', v)} />
                        <Label className="text-sm">Buy Property</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={activeScenario.adjustments.sellProperty} onCheckedChange={(v) => updateScenario(activeScenarioId, 'adjustments.sellProperty', v)} />
                        <Label className="text-sm">Sell Property (30%)</Label>
                      </div>
                    </div>
                  </div>

                  {/* Projection Chart */}
                  <Card>
                    <CardContent className="p-4">
                      <ChartContainer height={250}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={projections[activeScenarioId]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                            <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Legend />
                            <Area type="monotone" dataKey="propertyValue" name="Property" stackId="1" fill="#1a2744" stroke="#1a2744" />
                            <Area type="monotone" dataKey="shareValue" name="Shares" stackId="1" fill="#D4A84C" stroke="#D4A84C" />
                            <Area type="monotone" dataKey="superBalance" name="Super" stackId="1" fill="#10B981" stroke="#10B981" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================== COMPARE TAB ==================== */}
          <TabsContent value="compare" className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <Label>Compare scenarios:</Label>
                  {scenarios.map(scenario => (
                    <div key={scenario.id} className="flex items-center gap-2">
                      <input type="checkbox" id={`cmp-${scenario.id}`} checked={selectedComparison.includes(scenario.id)} onChange={(e) => {
                        if (e.target.checked) setSelectedComparison([...selectedComparison, scenario.id]);
                        else setSelectedComparison(selectedComparison.filter(id => id !== scenario.id));
                      }} className="rounded" />
                      <label htmlFor={`cmp-${scenario.id}`} className="text-sm">{scenario.name}</label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Net Worth Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={350}>
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
                          <Line key={id} type="monotone" dataKey={scenario.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                        ) : null;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarioOutcomes.filter(s => selectedComparison.includes(s.id)).map((outcome, i) => (
                <Card key={outcome.id} className="border-t-4" style={{ borderTopColor: COLORS[i % COLORS.length] }}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold">{outcome.name}</h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Final Net Worth</span><span className="font-bold">{formatCurrency(outcome.finalNetWorth)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total Growth</span><span className={`font-bold ${outcome.totalGrowth >= 0 ? 'text-[#10B981]' : 'text-destructive'}`}>{outcome.totalGrowth.toFixed(1)}%</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Annualized Return</span><span className="font-medium">{outcome.annualizedReturn.toFixed(2)}%</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ==================== WHAT-IF TAB ==================== */}
          <TabsContent value="whatif" className="space-y-6">
            <CalculatorDisclaimer calculatorName="what-if analysis tool" />
            
            <Card>
              <CardHeader>
                <CardTitle>Scenario Rankings</CardTitle>
                <CardDescription>Ranked by projected net worth at year {projectionYears}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scenarioOutcomes.sort((a, b) => b.finalNetWorth - a.finalNetWorth).map((outcome, i) => (
                    <div key={outcome.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeClass(i)}`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{outcome.name}</p>
                          <p className="text-xs text-muted-foreground">Growth: {outcome.totalGrowth.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(outcome.finalNetWorth)}</p>
                        <p className="text-xs text-muted-foreground">+{formatCurrency(outcome.finalNetWorth - outcome.startNetWorth)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-[#D4A84C]" /> Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scenarioOutcomes.length > 1 && (
                  <>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#10B981]/10">
                      <CheckCircle className="h-5 w-5 text-[#10B981] flex-shrink-0" />
                      <div>
                        <p className="font-medium">Best Scenario</p>
                        <p className="text-sm text-muted-foreground">
                          "{scenarioOutcomes.sort((a, b) => b.finalNetWorth - a.finalNetWorth)[0].name}" 
                          projects {formatCurrency(scenarioOutcomes.sort((a, b) => b.finalNetWorth - a.finalNetWorth)[0].finalNetWorth)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#D4A84C]/10">
                      <TrendingUp className="h-5 w-5 text-[#D4A84C] flex-shrink-0" />
                      <div>
                        <p className="font-medium">Difference</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(Math.max(...scenarioOutcomes.map(s => s.finalNetWorth)) - Math.min(...scenarioOutcomes.map(s => s.finalNetWorth)))} between best and worst
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">Important Note</p>
                    <p className="text-sm text-amber-700">
                      Projections are based on assumed growth rates and do not account for market volatility, tax changes, or personal circumstances. 
                      Consult a licensed financial adviser (AFSL holder) for personal advice.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default StrategicPlanning;
