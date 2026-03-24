import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Activity,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  DollarSign,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calculator,
  Clock,
  Percent,
  BarChart3,
  RefreshCw,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { usePortfolio } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
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

const formatPercent = (value) => `${value.toFixed(1)}%`;

const getStatusColor = (status) => {
  switch (status) {
    case "green": return "text-green-600 bg-green-50 border-green-200";
    case "blue": return "text-blue-600 bg-blue-50 border-blue-200";
    case "yellow": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "red": return "text-red-600 bg-red-50 border-red-200";
    default: return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

const getEffortBadge = (effort) => {
  switch (effort) {
    case "low": return <Badge className="bg-green-100 text-green-700">Easy</Badge>;
    case "medium": return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
    case "high": return <Badge className="bg-red-100 text-red-700">Complex</Badge>;
    default: return null;
  }
};

const DecisionDashboard = () => {
  const { portfolio, familyMembers, budget } = usePortfolio();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Get profile data from portfolio context
  const getProfileData = () => {
    const totalIncome = Object.values(budget.income).reduce((a, b) => a + b, 0) * 12;
    const totalExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0) * 12;
    const savingsRate = (totalIncome - totalExpenses) / totalIncome;
    
    return {
      age: familyMembers[0]?.age || 45,
      retirement_age: 65,
      current_income: totalIncome || portfolio.personal.taxableIncome,
      annual_expenses: totalExpenses || 120000,
      total_assets: portfolio.summary.totalAssets,
      total_debt: portfolio.summary.totalDebt,
      super_balance: portfolio.investments.smsf_balance,
      investment_portfolio: portfolio.investments.shares_value + portfolio.investments.etf_value + portfolio.investments.bonds_value,
      cash_savings: portfolio.investments.cash_savings + portfolio.investments.term_deposit_amount,
      property_value: portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0),
      property_debt: portfolio.investments.properties.reduce((sum, p) => sum + p.mortgage_amount, 0),
      savings_rate: savingsRate > 0 ? savingsRate : 0.15,
      risk_tolerance: "moderate",
      retirement_income_target: 80000
    };
  };

  // Fetch complete analysis
  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const profileData = getProfileData();
      const response = await axios.post(`${API}/decision-engine/complete-analysis`, profileData);
      setAnalysisData(response.data);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      toast.error("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [portfolio, familyMembers, budget]);

  // Prepare radar chart data
  const radarData = analysisData?.health_score?.dimensions 
    ? Object.entries(analysisData.health_score.dimensions).map(([key, value]) => ({
        dimension: value.label,
        score: (value.score / value.max) * 100,
        fullMark: 100
      }))
    : [];

  // Action links
  const ACTION_LINKS = {
    "superannuation": "/smsf-optimizer",
    "debt_optimization": "/loan-calculator",
    "savings": "/budget",
    "investments": "/share-portfolio",
    "cash_management": "/budget"
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#1a2744]" />
            <p className="mt-4 text-muted-foreground">Analyzing your financial position...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="decision-dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-[#D4A84C]" />
              Decision Engine
            </h1>
            <p className="text-muted-foreground mt-1">
              Your personalized financial action plan
            </p>
          </div>
          <Button 
            onClick={fetchAnalysis}
            variant="outline"
            data-testid="refresh-analysis-btn"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Analysis
          </Button>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Financial Health Score */}
          <Card className={`border-2 ${getStatusColor(analysisData?.health_score?.status_color)}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Financial Health Score</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold" data-testid="health-score">
                      {analysisData?.health_score?.total_score ?? 0}
                    </span>
                    <span className="text-xl text-muted-foreground">/ 100</span>
                  </div>
                  <Badge 
                    className={`mt-2 ${analysisData?.health_score?.status_color === 'green' ? 'bg-green-500' : 
                      analysisData?.health_score?.status_color === 'blue' ? 'bg-blue-500' : 
                      analysisData?.health_score?.status_color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
                  >
                    {analysisData?.health_score?.status}
                  </Badge>
                </div>
                <div className="h-16 w-16">
                  <Activity className={`h-full w-full ${
                    analysisData?.health_score?.status_color === 'green' ? 'text-green-500' :
                    analysisData?.health_score?.status_color === 'blue' ? 'text-blue-500' :
                    analysisData?.health_score?.status_color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Retirement Probability */}
          <Card className={`border-2 ${getStatusColor(analysisData?.retirement_probability?.status_color)}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Retirement Success</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold" data-testid="retirement-probability">
                      {analysisData?.retirement_probability?.success_probability}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Target: {analysisData?.retirement_probability?.target_probability}%
                  </p>
                </div>
                <div className="h-16 w-16">
                  <Target className={`h-full w-full ${
                    analysisData?.retirement_probability?.status_color === 'green' ? 'text-green-500' :
                    analysisData?.retirement_probability?.status_color === 'blue' ? 'text-blue-500' :
                    analysisData?.retirement_probability?.status_color === 'yellow' ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Action Impact */}
          <Card className="border-2 border-[#D4A84C] bg-[#D4A84C]/5">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Action Impact</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-[#1a2744]" data-testid="top-action-impact">
                      {analysisData?.top_actions?.[0]?.impact_text?.split(' ')[0] || '$0'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate max-w-[180px]">
                    {analysisData?.top_actions?.[0]?.title}
                  </p>
                </div>
                <div className="h-16 w-16">
                  <Zap className="h-full w-full text-[#D4A84C]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">Top Actions</TabsTrigger>
            <TabsTrigger value="details" data-testid="tab-details">Detailed Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Score Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                    Financial Health Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="#1a2744"
                          fill="#1a2744"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Top 3 Actions Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#D4A84C]" />
                    Top 3 Actions
                  </CardTitle>
                  <CardDescription>What you should do next</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisData?.top_actions?.slice(0, 3).map((action, index) => (
                    <div 
                      key={action.rank}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(ACTION_LINKS[action.category] || "/dashboard")}
                      data-testid={`action-${index}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-[#1a2744]' : index === 1 ? 'bg-[#D4A84C]' : 'bg-blue-500'
                      }`}>
                        {action.rank}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{action.title}</h4>
                          {getEffortBadge(action.effort)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                        <p className="text-sm font-bold text-[#1a2744] mt-2">{action.impact_text}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setActiveTab("actions")}
                  >
                    View All Actions
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Retirement Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#D4A84C]" />
                  Retirement Readiness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Years to Retirement</p>
                    <p className="text-3xl font-bold mt-1">
                      {analysisData?.retirement_probability?.parameters?.years_to_retirement}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Current Portfolio</p>
                    <p className="text-3xl font-bold mt-1">
                      {formatCurrency(analysisData?.retirement_probability?.parameters?.current_portfolio || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Projected at Retirement</p>
                    <p className="text-3xl font-bold mt-1 text-[#1a2744]">
                      {formatCurrency(analysisData?.retirement_probability?.projections?.median_final_balance || 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Income Target</p>
                    <p className="text-3xl font-bold mt-1">
                      {formatCurrency(analysisData?.retirement_probability?.parameters?.retirement_income_target || 0)}/yr
                    </p>
                  </div>
                </div>
                
                <Alert className={`mt-6 ${getStatusColor(analysisData?.retirement_probability?.status_color)}`}>
                  {analysisData?.retirement_probability?.status_color === 'green' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : analysisData?.retirement_probability?.status_color === 'yellow' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <AlertTitle>{analysisData?.retirement_probability?.status}</AlertTitle>
                  <AlertDescription>
                    {analysisData?.retirement_probability?.recommendation}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prioritized Actions</CardTitle>
                <CardDescription>
                  Actions ranked by financial impact. Click to take action.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisData?.top_actions?.map((action, index) => (
                  <div 
                    key={action.rank}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:border-[#1a2744] hover:bg-muted/50 cursor-pointer transition-all"
                    onClick={() => navigate(ACTION_LINKS[action.category] || "/dashboard")}
                    data-testid={`full-action-${index}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                      index === 0 ? 'bg-[#1a2744]' : index === 1 ? 'bg-[#D4A84C]' : 'bg-blue-500'
                    }`}>
                      {action.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-lg">{action.title}</h4>
                        {getEffortBadge(action.effort)}
                        <Badge variant="outline">{action.timeframe}</Badge>
                      </div>
                      <p className="text-muted-foreground">{action.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-[#1a2744]" />
                          <span className="font-bold text-[#1a2744]">{action.impact_text}</span>
                        </div>
                        <Badge variant="secondary">{action.category.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Metrics Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Health Score Dimensions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Health Score Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisData?.health_score?.dimensions && Object.entries(analysisData.health_score.dimensions).map(([key, dim]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{dim.label}</span>
                        <span className="font-semibold">{dim.score} / {dim.max}</span>
                      </div>
                      <Progress value={(dim.score / dim.max) * 100} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Financial Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Debt-to-Asset Ratio</p>
                      <p className="text-2xl font-bold">
                        {analysisData?.health_score?.metrics?.debt_to_asset_ratio}%
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Savings Rate</p>
                      <p className="text-2xl font-bold">
                        {analysisData?.health_score?.metrics?.savings_rate}%
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Emergency Fund</p>
                      <p className="text-2xl font-bold">
                        {analysisData?.health_score?.metrics?.emergency_fund_months} months
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Retirement Funded</p>
                      <p className="text-2xl font-bold">
                        {analysisData?.health_score?.metrics?.retirement_funded_pct}%
                      </p>
                    </div>
                    <div className="p-4 bg-[#1a2744]/5 rounded-lg col-span-2">
                      <p className="text-sm text-muted-foreground">Projected Super at 65</p>
                      <p className="text-3xl font-bold text-[#1a2744]">
                        {formatCurrency(analysisData?.health_score?.metrics?.projected_super_at_retirement || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations from Health Score */}
            {analysisData?.health_score?.recommendations?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Improvement Areas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysisData.health_score.recommendations.map((rec, index) => (
                    <Alert key={index} className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">{rec.action}</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        {rec.impact} • Priority: {rec.priority}
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <Card className="bg-[#1a2744] text-white">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold">Ready to optimize your financial future?</h3>
                <p className="text-white/70 mt-1">
                  Explore your life timeline or run detailed scenario analysis.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="bg-transparent border-white text-white hover:bg-white/10"
                  onClick={() => navigate("/life-timeline")}
                  data-testid="go-to-timeline-btn"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Life Timeline
                </Button>
                <Button 
                  className="bg-[#D4A84C] text-[#1a2744] hover:bg-[#D4A84C]/90"
                  onClick={() => navigate("/scenario-builder")}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Scenario Builder
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DecisionDashboard;
