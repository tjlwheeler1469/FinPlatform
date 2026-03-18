import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Sliders, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import debounce from "lodash/debounce";

const API = process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (value) => {
  if (value === undefined || value === null || isNaN(value)) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const DecisionCenter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Scenario parameters
  const [params, setParams] = useState({
    currentAge: 45,
    retirementAge: 65,
    currentWealth: 780000,
    annualSavings: 50000,
    annualExpenses: 80000,
    riskProfile: "balanced"
  });

  // Debounced API call
  const fetchScenario = useCallback(
    debounce(async (scenarioParams) => {
      setIsLoading(true);
      try {
        const response = await axios.post(`${API}/api/copilot/quick-scenario`, {
          current_age: scenarioParams.currentAge,
          retirement_age: scenarioParams.retirementAge,
          current_wealth: scenarioParams.currentWealth,
          annual_savings: scenarioParams.annualSavings,
          annual_expenses: scenarioParams.annualExpenses,
          risk_profile: scenarioParams.riskProfile
        });
        
        setResult(response.data);
      } catch (error) {
        console.error("Scenario error:", error);
        toast.error("Failed to calculate scenario");
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Fetch on mount and when params change
  useEffect(() => {
    fetchScenario(params);
  }, [params, fetchScenario]);

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const getRiskColor = (status) => {
    const colors = {
      excellent: "text-green-600 bg-green-50 border-green-200",
      on_track: "text-blue-600 bg-blue-50 border-blue-200",
      moderate: "text-yellow-600 bg-yellow-50 border-yellow-200",
      at_risk: "text-orange-600 bg-orange-50 border-orange-200",
      critical: "text-red-600 bg-red-50 border-red-200"
    };
    return colors[status] || colors.moderate;
  };

  const getProbabilityColor = (prob) => {
    if (prob >= 90) return "text-green-600";
    if (prob >= 75) return "text-blue-600";
    if (prob >= 60) return "text-yellow-600";
    if (prob >= 40) return "text-orange-600";
    return "text-red-600";
  };

  // Quick scenario buttons
  const quickScenarios = [
    { 
      name: "Retire 5 Years Earlier", 
      icon: Calendar,
      changes: { retirementAge: params.retirementAge - 5 }
    },
    { 
      name: "+20% Savings", 
      icon: TrendingUp,
      changes: { annualSavings: params.annualSavings * 1.2 }
    },
    { 
      name: "-20% Expenses", 
      icon: TrendingDown,
      changes: { annualExpenses: params.annualExpenses * 0.8 }
    },
    { 
      name: "Conservative Profile", 
      icon: AlertTriangle,
      changes: { riskProfile: "conservative" }
    }
  ];

  const applyQuickScenario = (changes) => {
    setParams(prev => ({ ...prev, ...changes }));
    toast.success("Scenario applied");
  };

  return (
    <Layout>
    <div className="space-y-6" data-testid="decision-center-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a2744] to-[#2a3a5c] flex items-center justify-center">
            <Sliders className="h-6 w-6 text-[#D4A84C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Decision Center</h1>
            <p className="text-muted-foreground">Real-time scenario modeling for client meetings</p>
          </div>
        </div>
        {isLoading && (
          <Badge variant="outline" className="animate-pulse">
            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
            Calculating...
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              Scenario Controls
            </CardTitle>
            <CardDescription>
              Adjust parameters to see instant impact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Age */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Current Age</label>
                <span className="text-sm font-bold">{params.currentAge}</span>
              </div>
              <Slider
                value={[params.currentAge]}
                onValueChange={([value]) => updateParam("currentAge", value)}
                min={25}
                max={70}
                step={1}
              />
            </div>

            {/* Retirement Age */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Retirement Age</label>
                <span className="text-sm font-bold">{params.retirementAge}</span>
              </div>
              <Slider
                value={[params.retirementAge]}
                onValueChange={([value]) => updateParam("retirementAge", value)}
                min={50}
                max={75}
                step={1}
              />
            </div>

            {/* Current Wealth */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Current Wealth</label>
                <span className="text-sm font-bold">{formatCurrency(params.currentWealth)}</span>
              </div>
              <Slider
                value={[params.currentWealth]}
                onValueChange={([value]) => updateParam("currentWealth", value)}
                min={100000}
                max={5000000}
                step={50000}
              />
            </div>

            {/* Annual Savings */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Annual Savings</label>
                <span className="text-sm font-bold">{formatCurrency(params.annualSavings)}</span>
              </div>
              <Slider
                value={[params.annualSavings]}
                onValueChange={([value]) => updateParam("annualSavings", value)}
                min={0}
                max={200000}
                step={5000}
              />
            </div>

            {/* Annual Expenses */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Retirement Expenses</label>
                <span className="text-sm font-bold">{formatCurrency(params.annualExpenses)}/year</span>
              </div>
              <Slider
                value={[params.annualExpenses]}
                onValueChange={([value]) => updateParam("annualExpenses", value)}
                min={30000}
                max={200000}
                step={5000}
              />
            </div>

            {/* Risk Profile */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Risk Profile</label>
              <Select
                value={params.riskProfile}
                onValueChange={(value) => updateParam("riskProfile", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Scenarios */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Quick Scenarios</p>
              <div className="grid grid-cols-2 gap-2">
                {quickScenarios.map((scenario, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 text-xs"
                    onClick={() => applyQuickScenario(scenario.changes)}
                  >
                    <scenario.icon className="h-3 w-3 mr-1" />
                    {scenario.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Success Probability */}
            <Card className={`${result?.risk_status ? getRiskColor(result.risk_status.status) : ""} border-2`}>
              <CardContent className="p-4 text-center">
                <div className="text-4xl font-bold">
                  {result?.success_probability?.toFixed(0) || 0}%
                </div>
                <p className="text-sm mt-1">Success Probability</p>
                {result?.risk_status && (
                  <Badge variant="outline" className="mt-2">
                    {result.risk_status.label}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Retirement Wealth */}
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#D4A84C]">
                  {formatCurrency(result?.retirement_wealth_median)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">At Retirement</p>
                <p className="text-xs text-muted-foreground">
                  Range: {formatCurrency(result?.retirement_wealth_range?.low)} - {formatCurrency(result?.retirement_wealth_range?.high)}
                </p>
              </CardContent>
            </Card>

            {/* Safe Spending */}
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  {formatCurrency(result?.safe_annual_spending)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Safe Annual Spending</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(result?.safe_monthly_spending)}/month
                </p>
              </CardContent>
            </Card>

            {/* Years to Retirement */}
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  {params.retirementAge - params.currentAge}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Years to Retirement</p>
                <p className="text-xs text-muted-foreground">
                  Retiring at age {params.retirementAge}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Probability Gauge */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Retirement Success Probability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-red-500">Critical</span>
                    <span className="text-xs text-orange-500">At Risk</span>
                    <span className="text-xs text-yellow-500">Moderate</span>
                    <span className="text-xs text-blue-500">On Track</span>
                    <span className="text-xs text-green-500">Excellent</span>
                  </div>
                  <div className="overflow-hidden h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
                    <div 
                      className="h-full bg-transparent"
                      style={{ 
                        marginLeft: `${result?.success_probability || 0}%`,
                        width: "4px",
                        backgroundColor: "#1a2744",
                        borderRadius: "2px"
                      }}
                    />
                  </div>
                  <div 
                    className="absolute top-8 transform -translate-x-1/2 transition-all duration-300"
                    style={{ left: `${result?.success_probability || 0}%` }}
                  >
                    <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#1a2744]" />
                    <div className="bg-[#1a2744] text-white text-xs px-2 py-1 rounded">
                      {result?.success_probability?.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {result?.recommendations && result.recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    {rec.type === "early_retirement" ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : rec.type === "delay_retirement" ? (
                      <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-purple-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {rec.impact}
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default DecisionCenter;
