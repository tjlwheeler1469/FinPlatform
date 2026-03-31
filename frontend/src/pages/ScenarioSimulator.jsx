import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Play,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  DollarSign,
  Percent,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Lightbulb,
  Save,
  Layers,
  BarChart3,
  LineChart as LineChartIcon
} from "lucide-react";
import { usePortfolio } from "@/App";
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
  ReferenceLine
} from "recharts";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

// Helper to safely get nested values from API response
const getResultValue = (result, key, defaultValue = 0) => {
  if (!result || !result.results) return defaultValue;
  const r = result.results;
  
  // Map frontend keys to backend response structure
  switch(key) {
    case 'retirement_wealth':
      return r.wealth_at_retirement?.median || r.retirement_wealth || defaultValue;
    case 'retirement_wealth_real':
      return r.wealth_at_retirement?.p50 || r.retirement_wealth_real || defaultValue;
    case 'annual_retirement_income':
      return r.wealth_at_retirement?.median * 0.04 || r.annual_retirement_income || defaultValue;
    case 'monthly_retirement_income':
      return (r.wealth_at_retirement?.median * 0.04 / 12) || r.monthly_retirement_income || defaultValue;
    case 'income_replacement_ratio':
      return r.income_replacement_ratio || 67;
    default:
      return r[key] || defaultValue;
  }
};

const ScenarioSimulator = () => {
  const { portfolio } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("simulator");
  const [presets, setPresets] = useState(null);
  
  // Scenario inputs
  const [inputs, setInputs] = useState({
    current_age: 45,
    retirement_age: 65,
    life_expectancy: 90,
    current_savings: 200000,
    annual_income: 185000,
    annual_expenses: 100000,
    savings_rate: 0.20,
    current_super: 580000,
    employer_super_rate: 0.115,
    investment_return: 0.07,
    inflation_rate: 0.025,
    property_value: 1200000,
    property_growth: 0.04,
    debt_balance: 512000,
    debt_interest_rate: 0.0619,
    debt_repayment_monthly: 3850,
    risk_profile: "moderate"
  });

  useEffect(() => {
    fetchPresets();
    // Run initial simulation
    runSimulation();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await axios.get(`${API}/scenarios/presets`);
      setPresets(response.data.presets);
    } catch (error) {
      console.error("Error fetching presets:", error);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/scenarios/simulate`, inputs);
      setResult(response.data);
    } catch (error) {
      console.error("Error running simulation:", error);
      toast.error("Failed to run simulation");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (presetKey) => {
    const preset = presets[presetKey];
    if (preset && preset.changes) {
      setInputs(prev => ({ ...prev, ...preset.changes }));
      toast.success(`Applied preset: ${preset.name}`);
    }
  };

  // Debounced auto-simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 500);
    return () => clearTimeout(timer);
  }, [inputs]);

  const getStatusColor = (probability) => {
    if (probability >= 80) return "text-green-600";
    if (probability >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusBadge = (probability) => {
    if (probability >= 80) return { label: "On Track", variant: "default", color: "bg-green-500" };
    if (probability >= 60) return { label: "Needs Attention", variant: "secondary", color: "bg-amber-500" };
    return { label: "At Risk", variant: "destructive", color: "bg-red-500" };
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="scenario-simulator">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Scenario Simulator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Model "what-if" scenarios and see instant impact on retirement success
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={runSimulation} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Recalculate
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" /> Save Scenario
            </Button>
          </div>
        </div>

        {/* Main Result Card */}
        {result && (
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#1a2744]/90 text-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-1">Success Probability</p>
                  <p className={`text-4xl font-bold ${
                    result.results.success_probability >= 80 ? "text-green-400" :
                    result.results.success_probability >= 60 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {result.results.success_probability}%
                  </p>
                  <Badge className={`mt-2 ${getStatusBadge(result.results.success_probability).color}`}>
                    {getStatusBadge(result.results.success_probability).label}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-1">Retirement Wealth</p>
                  <p className="text-3xl font-bold text-[#D4A84C]">
                    {formatCurrency(getResultValue(result, 'retirement_wealth'))}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Real: {formatCurrency(getResultValue(result, 'retirement_wealth_real'))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-1">Annual Retirement Income</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(getResultValue(result, 'annual_retirement_income'))}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {formatCurrency(getResultValue(result, 'monthly_retirement_income'))}/month
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-1">Income Replacement</p>
                  <p className="text-3xl font-bold">
                    {getResultValue(result, 'income_replacement_ratio')}%
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    of current income
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Controls */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scenario Inputs</CardTitle>
              <CardDescription>Adjust values to see instant impact</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Presets */}
              {presets && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Quick Scenarios</label>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => applyPreset("retire_early")}>
                      Retire Early
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => applyPreset("increase_savings")}>
                      +5% Savings
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => applyPreset("conservative_returns")}>
                      Conservative
                    </Button>
                  </div>
                </div>
              )}

              {/* Age Inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label>Current Age</label>
                    <span className="font-medium">{inputs.current_age}</span>
                  </div>
                  <Slider
                    value={[inputs.current_age]}
                    onValueChange={([v]) => handleInputChange("current_age", v)}
                    min={25}
                    max={70}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label>Retirement Age</label>
                    <span className="font-medium">{inputs.retirement_age}</span>
                  </div>
                  <Slider
                    value={[inputs.retirement_age]}
                    onValueChange={([v]) => handleInputChange("retirement_age", v)}
                    min={50}
                    max={75}
                    step={1}
                  />
                </div>
              </div>

              {/* Financial Inputs */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label>Savings Rate</label>
                    <span className="font-medium">{(inputs.savings_rate * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[inputs.savings_rate * 100]}
                    onValueChange={([v]) => handleInputChange("savings_rate", v / 100)}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label>Annual Income</label>
                    <span className="font-medium">{formatCurrency(inputs.annual_income)}</span>
                  </div>
                  <Slider
                    value={[inputs.annual_income / 1000]}
                    onValueChange={([v]) => handleInputChange("annual_income", v * 1000)}
                    min={50}
                    max={500}
                    step={5}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label>Annual Expenses</label>
                    <span className="font-medium">{formatCurrency(inputs.annual_expenses)}</span>
                  </div>
                  <Slider
                    value={[inputs.annual_expenses / 1000]}
                    onValueChange={([v]) => handleInputChange("annual_expenses", v * 1000)}
                    min={30}
                    max={300}
                    step={5}
                  />
                </div>
              </div>

              {/* Investment Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Risk Profile</label>
                  <Select value={inputs.risk_profile} onValueChange={(v) => handleInputChange("risk_profile", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative (5% return)</SelectItem>
                      <SelectItem value="moderate">Moderate (7% return)</SelectItem>
                      <SelectItem value="aggressive">Aggressive (9% return)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label>Current Super Balance</label>
                    <span className="font-medium">{formatCurrency(inputs.current_super)}</span>
                  </div>
                  <Slider
                    value={[inputs.current_super / 10000]}
                    onValueChange={([v]) => handleInputChange("current_super", v * 10000)}
                    min={0}
                    max={200}
                    step={5}
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <label>Debt Balance</label>
                    <span className="font-medium">{formatCurrency(inputs.debt_balance)}</span>
                  </div>
                  <Slider
                    value={[inputs.debt_balance / 10000]}
                    onValueChange={([v]) => handleInputChange("debt_balance", v * 10000)}
                    min={0}
                    max={150}
                    step={5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="lg:col-span-2 space-y-4">
            {/* Net Worth Projection Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Wealth Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {result?.projections && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <AreaChart data={result.projections.filter((_, i) => i % 2 === 0)}>
                        <defs>
                          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1a2744" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#1a2744" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis 
                          dataKey="age" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `${v}`}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <Tooltip 
                          formatter={(v) => formatCurrency(v)}
                          labelFormatter={(v) => `Age ${v}`}
                        />
                        <ReferenceLine 
                          x={inputs.retirement_age} 
                          stroke="#D4A84C" 
                          strokeDasharray="5 5"
                          label={{ value: "Retirement", position: "top", fill: "#D4A84C" }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="net_worth" 
                          stroke="#1a2744" 
                          fill="url(#netWorthGradient)"
                          name="Net Worth"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            {result?.milestones && result.milestones.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Key Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {result.milestones.map((milestone, i) => (
                      <div key={`item-${i}`} className="p-3 border rounded-lg text-center">
                        <CheckCircle className={`h-6 w-6 mx-auto mb-2 ${
                          milestone.achieved ? "text-green-500" : "text-gray-300"
                        }`} />
                        <p className="font-medium text-sm">{milestone.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Age {milestone.age}
                        </p>
                        {!milestone.achieved && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {milestone.years_from_now}y away
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis & Recommendations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">Years to Retirement</span>
                    </div>
                    <p className="text-2xl font-bold">{result?.results?.years_to_retirement || 0} years</p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Monthly Savings Required</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(inputs.annual_income * inputs.savings_rate / 12)}/mo
                    </p>
                  </div>

                  {result?.results?.wealth_at_life_expectancy !== undefined && (
                    <div className={`p-3 rounded-lg ${
                      result.results.wealth_at_life_expectancy > 0 ? "bg-green-50" : "bg-red-50"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {result.results.wealth_at_life_expectancy > 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">Wealth at Age {inputs.life_expectancy}</span>
                      </div>
                      <p className={`text-2xl font-bold ${
                        result.results.wealth_at_life_expectancy > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {formatCurrency(Math.max(0, result.results.wealth_at_life_expectancy))}
                      </p>
                      {result.results.wealth_at_life_expectancy <= 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ Risk of running out of money before age {inputs.life_expectancy}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScenarioSimulator;
