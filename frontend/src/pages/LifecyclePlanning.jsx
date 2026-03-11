import { useState } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target,
  TrendingUp,
  Calendar,
  Users,
  PiggyBank,
  Home,
  GraduationCap,
  Briefcase,
  Heart,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Calculator,
  FileText
} from "lucide-react";
import { usePortfolio } from "@/App";
import { toast } from "sonner";
import axios from "axios";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
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

const LifecyclePlanning = () => {
  const { familyMembers, portfolio } = usePortfolio();
  const primaryMember = familyMembers.find(m => m.relationship === 'primary') || familyMembers[0];

  const [activeTab, setActiveTab] = useState("retirement");
  const [loading, setLoading] = useState(false);

  // Retirement Planning State
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

  // Estate Planning State
  const [estatePlan, setEstatePlan] = useState({
    total_assets: portfolio?.summary?.totalAssets || 2920000,
    total_super: familyMembers.reduce((sum, m) => sum + (m.superBalance || 0), 0),
    property_value: portfolio?.investments?.properties?.reduce((sum, p) => sum + p.value, 0) || 1570000,
    beneficiaries: familyMembers.filter(m => m.relationship !== 'primary').map(m => ({
      name: m.name,
      relationship: m.relationship === 'spouse' ? 'spouse' : m.age < 18 ? 'child_under_18' : 'adult_child',
      share_percent: 100 / (familyMembers.length - 1 || 1)
    })),
    has_will: false,
    has_testamentary_trust: false,
    has_power_of_attorney: false
  });
  const [estateResult, setEstateResult] = useState(null);

  // Goal Planning State
  const [goals, setGoals] = useState([
    { name: "Emergency Fund", target_amount: 50000, target_date: "2025-12-31", current_savings: 25000, monthly_contribution: 500, priority: "high" },
    { name: "Children's Education", target_amount: 150000, target_date: "2030-01-01", current_savings: 35000, monthly_contribution: 800, priority: "high" },
    { name: "Holiday Home", target_amount: 300000, target_date: "2035-01-01", current_savings: 0, monthly_contribution: 1000, priority: "low" }
  ]);
  const [goalResult, setGoalResult] = useState(null);
  const [availableMonthlySavings, setAvailableMonthlySavings] = useState(3000);
  const [riskTolerance, setRiskTolerance] = useState("moderate");

  // Calculate Retirement Plan
  const calculateRetirement = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/lifecycle/retirement-plan`, retirementPlan);
      setRetirementResult(response.data);
      toast.success("Retirement plan calculated");
    } catch (error) {
      console.error("Error calculating retirement:", error);
      toast.error("Failed to calculate retirement plan");
    } finally {
      setLoading(false);
    }
  };

  // Calculate Estate Plan
  const calculateEstate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/lifecycle/estate-plan`, estatePlan);
      setEstateResult(response.data);
      toast.success("Estate plan analyzed");
    } catch (error) {
      console.error("Error calculating estate:", error);
      toast.error("Failed to analyze estate plan");
    } finally {
      setLoading(false);
    }
  };

  // Calculate Goal Planning
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
      console.error("Error calculating goals:", error);
      toast.error("Failed to analyze goals");
    } finally {
      setLoading(false);
    }
  };

  // Add new goal
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

  // Remove goal
  const removeGoal = (index) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  // Update goal
  const updateGoal = (index, field, value) => {
    const updated = [...goals];
    updated[index] = { ...updated[index], [field]: value };
    setGoals(updated);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="lifecycle-planning-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Manrope'] text-foreground">
            Lifecycle Planning
          </h1>
          <p className="text-muted-foreground mt-1">
            Retirement, estate planning, and financial goal setting
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="retirement" className="flex items-center gap-1">
              <PiggyBank className="h-4 w-4" /> Retirement
            </TabsTrigger>
            <TabsTrigger value="estate" className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Estate
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1">
              <Target className="h-4 w-4" /> Goals
            </TabsTrigger>
          </TabsList>

          {/* Retirement Planning Tab */}
          <TabsContent value="retirement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Form */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Retirement Parameters</CardTitle>
                  <CardDescription>Enter your retirement planning details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Current Age</Label>
                      <Input
                        type="number"
                        value={retirementPlan.current_age}
                        onChange={e => setRetirementPlan({...retirementPlan, current_age: Number(e.target.value)})}
                        data-testid="current-age-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Retirement Age</Label>
                      <Input
                        type="number"
                        value={retirementPlan.retirement_age}
                        onChange={e => setRetirementPlan({...retirementPlan, retirement_age: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Current Super Balance</Label>
                    <Input
                      type="number"
                      value={retirementPlan.current_super}
                      onChange={e => setRetirementPlan({...retirementPlan, current_super: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Current Savings</Label>
                    <Input
                      type="number"
                      value={retirementPlan.current_savings}
                      onChange={e => setRetirementPlan({...retirementPlan, current_savings: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Annual Income</Label>
                    <Input
                      type="number"
                      value={retirementPlan.annual_income}
                      onChange={e => setRetirementPlan({...retirementPlan, annual_income: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Annual Expenses</Label>
                    <Input
                      type="number"
                      value={retirementPlan.annual_expenses}
                      onChange={e => setRetirementPlan({...retirementPlan, annual_expenses: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Desired Retirement Income</Label>
                    <Input
                      type="number"
                      value={retirementPlan.desired_retirement_income}
                      onChange={e => setRetirementPlan({...retirementPlan, desired_retirement_income: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Salary Sacrifice (Annual)</Label>
                    <Input
                      type="number"
                      value={retirementPlan.salary_sacrifice}
                      onChange={e => setRetirementPlan({...retirementPlan, salary_sacrifice: Number(e.target.value)})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Investment Return %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={retirementPlan.investment_return}
                        onChange={e => setRetirementPlan({...retirementPlan, investment_return: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inflation %</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={retirementPlan.inflation_rate}
                        onChange={e => setRetirementPlan({...retirementPlan, inflation_rate: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={calculateRetirement} 
                    className="w-full bg-[#0F392B]"
                    disabled={loading}
                    data-testid="calculate-retirement-btn"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {loading ? "Calculating..." : "Calculate Plan"}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="lg:col-span-2 space-y-6">
                {retirementResult ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-[#0F392B] text-white">
                        <CardContent className="p-4">
                          <p className="text-sm text-white/80">At Retirement</p>
                          <p className="text-xl font-bold">{formatCurrency(retirementResult.summary.total_at_retirement)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Sustainable Income</p>
                          <p className="text-xl font-bold text-[#10B981]">
                            {formatCurrency(retirementResult.summary.sustainable_annual_income)}/yr
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Income Gap</p>
                          <p className={`text-xl font-bold ${retirementResult.summary.income_gap > 0 ? 'text-destructive' : 'text-[#10B981]'}`}>
                            {retirementResult.summary.income_gap > 0 ? '-' : ''}{formatCurrency(Math.abs(retirementResult.summary.income_gap))}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className={retirementResult.summary.shortfall_years > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-[#10B981]/10 border-[#10B981]/30'}>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Money Lasts Until</p>
                          <p className="text-xl font-bold">
                            Age {retirementResult.summary.money_lasts_until_age}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Projection Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-['Manrope']">Wealth Projection</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer height={300}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={retirementResult.projections}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis 
                                dataKey="age" 
                                stroke="hsl(var(--muted-foreground))"
                                tickFormatter={(v) => `${v}`}
                              />
                              <YAxis 
                                tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`}
                                stroke="hsl(var(--muted-foreground))"
                              />
                              <Tooltip 
                                formatter={(v) => formatCurrency(v)}
                                labelFormatter={(v) => `Age ${v}`}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="balance" 
                                stroke="#0F392B"
                                fill="#0F392B"
                                fillOpacity={0.3}
                                name="Balance"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-['Manrope']">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {retirementResult.recommendations.map((rec, i) => (
                            <div key={i} className={`p-4 rounded-lg border ${
                              rec.priority === 'high' ? 'bg-destructive/5 border-destructive/20' :
                              rec.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                              'bg-muted/50'
                            }`}>
                              <div className="flex items-start gap-3">
                                <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}>
                                  {rec.priority}
                                </Badge>
                                <div>
                                  <p className="font-medium">{rec.message}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{rec.action}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter your details and click Calculate Plan</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Estate Planning Tab */}
          <TabsContent value="estate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Form */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="font-['Manrope']">Estate Details</CardTitle>
                  <CardDescription>Review your estate planning setup</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Total Assets</Label>
                    <Input
                      type="number"
                      value={estatePlan.total_assets}
                      onChange={e => setEstatePlan({...estatePlan, total_assets: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Superannuation</Label>
                    <Input
                      type="number"
                      value={estatePlan.total_super}
                      onChange={e => setEstatePlan({...estatePlan, total_super: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Property Value</Label>
                    <Input
                      type="number"
                      value={estatePlan.property_value}
                      onChange={e => setEstatePlan({...estatePlan, property_value: Number(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">Estate Documents</Label>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <Label>Valid Will</Label>
                      </div>
                      <Switch
                        checked={estatePlan.has_will}
                        onCheckedChange={(v) => setEstatePlan({...estatePlan, has_will: v})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <Label>Power of Attorney</Label>
                      </div>
                      <Switch
                        checked={estatePlan.has_power_of_attorney}
                        onCheckedChange={(v) => setEstatePlan({...estatePlan, has_power_of_attorney: v})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <Label>Testamentary Trust</Label>
                      </div>
                      <Switch
                        checked={estatePlan.has_testamentary_trust}
                        onCheckedChange={(v) => setEstatePlan({...estatePlan, has_testamentary_trust: v})}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={calculateEstate} 
                    className="w-full bg-[#0F392B]"
                    disabled={loading}
                    data-testid="calculate-estate-btn"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    {loading ? "Analyzing..." : "Analyze Estate"}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="lg:col-span-2 space-y-6">
                {estateResult ? (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card className="bg-[#0F392B] text-white">
                        <CardContent className="p-4">
                          <p className="text-sm text-white/80">Total Estate</p>
                          <p className="text-xl font-bold">{formatCurrency(estateResult.estate_summary.total_estate_value)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Super Component</p>
                          <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(estateResult.estate_summary.total_super)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Potential Super Tax</p>
                          <p className="text-xl font-bold text-destructive">{formatCurrency(estateResult.tax_considerations.potential_super_death_tax)}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Checklist */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-['Manrope']">Estate Planning Checklist</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {estateResult.checklist.map((item, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${
                              item.complete ? 'bg-[#10B981]/10' : 
                              item.priority === 'critical' ? 'bg-destructive/10' : 'bg-muted/50'
                            }`}>
                              <div className="flex items-center gap-3">
                                {item.complete ? (
                                  <CheckCircle className="h-5 w-5 text-[#10B981]" />
                                ) : (
                                  <AlertTriangle className={`h-5 w-5 ${item.priority === 'critical' ? 'text-destructive' : 'text-amber-500'}`} />
                                )}
                                <span className="font-medium">{item.item}</span>
                              </div>
                              <Badge variant={item.complete ? 'secondary' : item.priority === 'critical' ? 'destructive' : 'outline'}>
                                {item.complete ? 'Complete' : item.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Beneficiaries */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-['Manrope']">Beneficiary Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {estateResult.beneficiaries.map((ben, i) => (
                            <div key={i} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">{ben.name}</span>
                                  <Badge variant="outline">{ben.relationship}</Badge>
                                  {ben.is_tax_dependant && (
                                    <Badge className="bg-[#10B981]">Tax Dependant</Badge>
                                  )}
                                </div>
                                <span className="text-sm text-muted-foreground">{ben.share_percent.toFixed(1)}%</span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Inheritance</p>
                                  <p className="font-semibold">{formatCurrency(ben.estimated_inheritance)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Potential Tax</p>
                                  <p className="font-semibold text-destructive">{formatCurrency(ben.potential_super_tax)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Net Amount</p>
                                  <p className="font-semibold text-[#10B981]">{formatCurrency(ben.net_inheritance)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    {estateResult.recommendations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="font-['Manrope']">Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {estateResult.recommendations.map((rec, i) => (
                              <div key={i} className={`p-4 rounded-lg border ${
                                rec.priority === 'critical' ? 'bg-destructive/5 border-destructive/20' :
                                rec.priority === 'high' ? 'bg-amber-50 border-amber-200' :
                                'bg-muted/50'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'secondary' : 'outline'}>
                                    {rec.priority}
                                  </Badge>
                                  <div>
                                    <p className="font-medium">{rec.message}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Review your estate details and click Analyze Estate</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Goal Planning Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Goals Input */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Financial Goals</h3>
                  <Button variant="outline" onClick={addGoal} data-testid="add-goal-btn">
                    <Plus className="h-4 w-4 mr-2" /> Add Goal
                  </Button>
                </div>

                {goals.map((goal, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <Input
                          value={goal.name}
                          onChange={e => updateGoal(index, 'name', e.target.value)}
                          className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0 max-w-[200px]"
                          placeholder="Goal Name"
                        />
                        <div className="flex items-center gap-2">
                          <Select value={goal.priority} onValueChange={v => updateGoal(index, 'priority', v)}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon" onClick={() => removeGoal(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Target Amount</Label>
                          <Input
                            type="number"
                            value={goal.target_amount}
                            onChange={e => updateGoal(index, 'target_amount', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Target Date</Label>
                          <Input
                            type="date"
                            value={goal.target_date}
                            onChange={e => updateGoal(index, 'target_date', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Current Savings</Label>
                          <Input
                            type="number"
                            value={goal.current_savings}
                            onChange={e => updateGoal(index, 'current_savings', Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Monthly Contribution</Label>
                          <Input
                            type="number"
                            value={goal.monthly_contribution}
                            onChange={e => updateGoal(index, 'monthly_contribution', Number(e.target.value))}
                          />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{formatCurrency(goal.current_savings)}</span>
                          <span>{formatCurrency(goal.target_amount)}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#0F392B] transition-all"
                            style={{ width: `${Math.min(100, (goal.current_savings / goal.target_amount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Settings & Results */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-['Manrope'] text-base">Planning Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Available Monthly Savings</Label>
                      <Input
                        type="number"
                        value={availableMonthlySavings}
                        onChange={e => setAvailableMonthlySavings(Number(e.target.value))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Risk Tolerance</Label>
                      <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">Conservative (4% return)</SelectItem>
                          <SelectItem value="moderate">Moderate (6% return)</SelectItem>
                          <SelectItem value="aggressive">Aggressive (8% return)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={calculateGoals} 
                      className="w-full bg-[#0F392B]"
                      disabled={loading}
                      data-testid="calculate-goals-btn"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      {loading ? "Analyzing..." : "Analyze Goals"}
                    </Button>
                  </CardContent>
                </Card>

                {goalResult && (
                  <>
                    {/* Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-['Manrope'] text-base">Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goals On Track</span>
                          <span className="font-semibold">
                            {goalResult.summary.goals_on_track} / {goalResult.summary.total_goals}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Monthly Required</span>
                          <span className="font-semibold">{formatCurrency(goalResult.summary.total_monthly_required)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-semibold">{formatCurrency(goalResult.summary.available_monthly)}</span>
                        </div>
                        <div className={`flex justify-between p-2 rounded ${
                          goalResult.summary.monthly_surplus_shortfall >= 0 ? 'bg-[#10B981]/10' : 'bg-destructive/10'
                        }`}>
                          <span className="font-medium">
                            {goalResult.summary.monthly_surplus_shortfall >= 0 ? 'Surplus' : 'Shortfall'}
                          </span>
                          <span className={`font-bold ${
                            goalResult.summary.monthly_surplus_shortfall >= 0 ? 'text-[#10B981]' : 'text-destructive'
                          }`}>
                            {formatCurrency(Math.abs(goalResult.summary.monthly_surplus_shortfall))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Goal Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-['Manrope'] text-base">Goal Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {goalResult.goals.map((g, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {g.on_track ? (
                                <CheckCircle className="h-4 w-4 text-[#10B981]" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              )}
                              <span className="text-sm truncate max-w-[100px]">{g.name}</span>
                            </div>
                            <span className="text-sm font-medium">{g.progress_percent}%</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default LifecyclePlanning;
