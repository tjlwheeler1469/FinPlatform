import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Percent,
  Target,
  Scale,
  Building2,
  PiggyBank,
  Calculator,
  BarChart3,
  Clock,
  Zap
} from "lucide-react";
import { usePortfolio } from "@/App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ComplianceFooter, CalculatorDisclaimer } from "@/components/ComplianceDisclaimer";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
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

const COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];

const FinancialRecommendations = () => {
  const { portfolio } = usePortfolio();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [monteCarloData, setMonteCarloData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Action links for recommendations
  const ACTION_LINKS = {
    "Rebalance portfolio": "/strategic-planning",
    "Review asset allocation": "/strategic-planning",
    "Continue monitoring": "/dashboard",
    "Consider debt reduction strategy": "/loan-calculator",
    "Review loan terms annually": "/loan-calculator",
    "Consider investment leverage": "/strategic-planning",
    "Add missing asset classes": "/share-portfolio",
    "Add international ETFs": "/share-portfolio",
    "Annual rebalancing": "/strategic-planning",
    "Build cash reserves": "/budget",
    "Deploy idle cash": "/share-portfolio",
    "Maintain current levels": "/dashboard",
    "Tax optimization review": "/tax-analysis-sync",
    "Annual tax planning": "/tax-calendar",
    "Review super contributions": "/smsf-optimizer",
    "Update depreciation report": "/property-portfolio"
  };

  const handleActionClick = (action) => {
    const path = ACTION_LINKS[action] || "/dashboard";
    navigate(path);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post(`${API}/analyze/monte-carlo`, null, {
          params: {
            initial_value: portfolio.investments.shares_value + portfolio.investments.etf_value,
            expected_return: 0.08,
            volatility: 0.15,
            years: 10,
            simulations: 1000
          }
        });
        setMonteCarloData(response.data);
      } catch (error) {
        console.error("Error fetching Monte Carlo data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [portfolio]);

  // Calculate key financial metrics
  const totalAssets = portfolio.summary.totalAssets;
  const totalDebt = portfolio.summary.totalDebt;
  const netWorth = portfolio.summary.netWorth;
  const annualIncome = portfolio.summary.annualIncome;
  const totalTax = portfolio.summary.totalTax;
  
  // Debt metrics
  const debtToAssetRatio = (totalDebt / totalAssets) * 100;
  const debtToEquityRatio = (totalDebt / netWorth) * 100;
  const debtServiceRatio = ((totalDebt * 0.065) / annualIncome) * 100; // Assume 6.5% interest
  
  // Investment metrics
  const liquidAssets = portfolio.investments.cash_savings + 
                       portfolio.investments.term_deposit_amount + 
                       portfolio.investments.shares_value + 
                       portfolio.investments.etf_value + 
                       portfolio.investments.bonds_value;
  const illiquidAssets = portfolio.investments.properties.reduce((sum, p) => sum + p.value, 0) + 
                         portfolio.investments.smsf_balance;
  const liquidityRatio = (liquidAssets / totalAssets) * 100;
  
  // Risk metrics
  const expectedReturn = 8; // 8% expected return
  const portfolioVolatility = 15; // 15% volatility
  const sharpeRatio = (expectedReturn - 4.5) / portfolioVolatility; // Risk-free rate ~4.5%
  const riskAdjustedReturn = expectedReturn / portfolioVolatility;
  
  // Diversification score (0-100)
  const assetClasses = [
    portfolio.investments.cash_savings > 0 ? 1 : 0,
    portfolio.investments.term_deposit_amount > 0 ? 1 : 0,
    portfolio.investments.shares_value > 0 ? 1 : 0,
    portfolio.investments.etf_value > 0 ? 1 : 0,
    portfolio.investments.bonds_value > 0 ? 1 : 0,
    portfolio.investments.properties.length > 0 ? 1 : 0,
    portfolio.investments.smsf_balance > 0 ? 1 : 0
  ];
  const diversificationScore = (assetClasses.reduce((a, b) => a + b, 0) / 7) * 100;
  
  // Tax efficiency
  const effectiveTaxRate = (totalTax / annualIncome) * 100;
  const taxEfficiencyScore = Math.max(0, 100 - (effectiveTaxRate * 2)); // Higher rate = lower score
  
  // Generate dynamic recommendations based on metrics
  const generateRecommendations = () => {
    const recommendations = [];
    
    // Debt recommendations
    if (debtToAssetRatio > 50) {
      recommendations.push({
        id: 1,
        category: "debt",
        priority: "high",
        title: "High Debt Exposure",
        description: `Your debt-to-asset ratio of ${debtToAssetRatio.toFixed(0)}% exceeds the recommended 50%. This increases financial risk during market downturns.`,
        impact: "Risk Reduction",
        action: "Consider debt reduction strategy",
        metric: debtToAssetRatio,
        target: 50,
        icon: AlertTriangle,
        color: "#EF4444"
      });
    } else if (debtToAssetRatio > 30) {
      recommendations.push({
        id: 1,
        category: "debt",
        priority: "medium",
        title: "Moderate Debt Levels",
        description: `Debt-to-asset ratio of ${debtToAssetRatio.toFixed(0)}% is manageable. Monitor interest rate changes and maintain emergency funds.`,
        impact: "Stability",
        action: "Review loan terms annually",
        metric: debtToAssetRatio,
        target: 30,
        icon: Scale,
        color: "#D4A84C"
      });
    } else {
      recommendations.push({
        id: 1,
        category: "debt",
        priority: "low",
        title: "Strong Debt Position",
        description: `Your debt-to-asset ratio of ${debtToAssetRatio.toFixed(0)}% is healthy. You may have capacity for strategic leverage if appropriate.`,
        impact: "Opportunity",
        action: "Consider investment leverage",
        metric: debtToAssetRatio,
        target: 30,
        icon: CheckCircle,
        color: "#10B981"
      });
    }
    
    // Risk/Return recommendations
    if (sharpeRatio < 0.3) {
      recommendations.push({
        id: 2,
        category: "risk",
        priority: "high",
        title: "Poor Risk-Adjusted Returns",
        description: `Sharpe ratio of ${sharpeRatio.toFixed(2)} indicates returns don't adequately compensate for risk. Consider rebalancing to more efficient assets.`,
        impact: formatCurrency(netWorth * 0.02) + "/year potential gain",
        action: "Rebalance portfolio",
        metric: sharpeRatio * 100,
        target: 50,
        icon: TrendingDown,
        color: "#EF4444"
      });
    } else if (sharpeRatio < 0.5) {
      recommendations.push({
        id: 2,
        category: "risk",
        priority: "medium",
        title: "Moderate Risk Efficiency",
        description: `Sharpe ratio of ${sharpeRatio.toFixed(2)} shows reasonable risk-adjusted returns. Minor optimization could improve efficiency.`,
        impact: formatCurrency(netWorth * 0.01) + "/year potential gain",
        action: "Review asset allocation",
        metric: sharpeRatio * 100,
        target: 50,
        icon: Target,
        color: "#D4A84C"
      });
    } else {
      recommendations.push({
        id: 2,
        category: "risk",
        priority: "low",
        title: "Excellent Risk Efficiency",
        description: `Sharpe ratio of ${sharpeRatio.toFixed(2)} indicates strong risk-adjusted returns. Portfolio is well-optimized.`,
        impact: "Maintain current strategy",
        action: "Continue monitoring",
        metric: sharpeRatio * 100,
        target: 50,
        icon: CheckCircle,
        color: "#10B981"
      });
    }
    
    // Diversification recommendations
    if (diversificationScore < 50) {
      recommendations.push({
        id: 3,
        category: "diversification",
        priority: "high",
        title: "Low Diversification",
        description: `Portfolio concentration in ${assetClasses.reduce((a, b) => a + b, 0)} of 7 asset classes increases risk. Diversify across more asset types.`,
        impact: "Risk Reduction",
        action: "Add missing asset classes",
        metric: diversificationScore,
        target: 70,
        icon: BarChart3,
        color: "#EF4444"
      });
    } else if (diversificationScore < 70) {
      recommendations.push({
        id: 3,
        category: "diversification",
        priority: "medium",
        title: "Moderate Diversification",
        description: `Good spread across ${assetClasses.reduce((a, b) => a + b, 0)} asset classes. Consider adding international exposure or alternative investments.`,
        impact: "Reduced Volatility",
        action: "Add international ETFs",
        metric: diversificationScore,
        target: 70,
        icon: BarChart3,
        color: "#D4A84C"
      });
    } else {
      recommendations.push({
        id: 3,
        category: "diversification",
        priority: "low",
        title: "Well Diversified",
        description: `Portfolio spans ${assetClasses.reduce((a, b) => a + b, 0)} asset classes with good diversification. Continue rebalancing periodically.`,
        impact: "Maintain Balance",
        action: "Annual rebalancing",
        metric: diversificationScore,
        target: 70,
        icon: CheckCircle,
        color: "#10B981"
      });
    }
    
    // Liquidity recommendations
    if (liquidityRatio < 20) {
      recommendations.push({
        id: 4,
        category: "liquidity",
        priority: "high",
        title: "Low Liquidity",
        description: `Only ${liquidityRatio.toFixed(0)}% of assets are liquid. Maintain at least 6 months expenses in accessible funds.`,
        impact: "Emergency Preparedness",
        action: "Build cash reserves",
        metric: liquidityRatio,
        target: 25,
        icon: DollarSign,
        color: "#EF4444"
      });
    } else if (liquidityRatio > 50) {
      recommendations.push({
        id: 4,
        category: "liquidity",
        priority: "medium",
        title: "Excess Liquidity",
        description: `${liquidityRatio.toFixed(0)}% in liquid assets may be excessive. Consider deploying excess cash for higher returns.`,
        impact: formatCurrency((liquidAssets * 0.5) * 0.04) + "/year potential gain",
        action: "Deploy idle cash",
        metric: liquidityRatio,
        target: 30,
        icon: Zap,
        color: "#D4A84C"
      });
    } else {
      recommendations.push({
        id: 4,
        category: "liquidity",
        priority: "low",
        title: "Balanced Liquidity",
        description: `${liquidityRatio.toFixed(0)}% liquidity provides good flexibility while maximizing growth potential.`,
        impact: "Optimal Balance",
        action: "Maintain current levels",
        metric: liquidityRatio,
        target: 30,
        icon: CheckCircle,
        color: "#10B981"
      });
    }
    
    // Tax optimization recommendations
    if (effectiveTaxRate > 30) {
      recommendations.push({
        id: 5,
        category: "tax",
        priority: "high",
        title: "High Tax Burden",
        description: `Effective tax rate of ${effectiveTaxRate.toFixed(1)}% is above optimal. Multiple strategies available to reduce.`,
        impact: formatCurrency(totalTax * 0.2) + "/year potential savings",
        action: "Tax optimization review",
        metric: 100 - effectiveTaxRate,
        target: 70,
        icon: Calculator,
        color: "#D4A84C"
      });
    } else {
      recommendations.push({
        id: 5,
        category: "tax",
        priority: "low",
        title: "Tax Efficient",
        description: `Effective tax rate of ${effectiveTaxRate.toFixed(1)}% is well-managed. Continue current strategies.`,
        impact: "Maintain Efficiency",
        action: "Annual tax planning",
        metric: 100 - effectiveTaxRate,
        target: 70,
        icon: CheckCircle,
        color: "#10B981"
      });
    }
    
    // Super contributions
    recommendations.push({
      id: 6,
      category: "super",
      priority: "medium",
      title: "Superannuation Strategy",
      description: `SMSF balance of ${formatCurrency(portfolio.investments.smsf_balance)}. Ensure you're maximizing concessional contributions ($30,000 cap).`,
      impact: formatCurrency(30000 * 0.22) + " potential tax savings",
      action: "Review super contributions",
      metric: 60,
      target: 100,
      icon: PiggyBank,
      color: "#3B82F6"
    });
    
    // Property specific recommendations
    const negativelyGearedCount = portfolio.investments.properties.filter(p => {
      const netRental = p.rental_income - (p.mortgage_amount * p.mortgage_rate / 100) - p.annual_expenses;
      return netRental < 0;
    }).length;
    
    if (negativelyGearedCount > 0) {
      recommendations.push({
        id: 7,
        category: "property",
        priority: "medium",
        title: "Negative Gearing Strategy",
        description: `${negativelyGearedCount} negatively geared ${negativelyGearedCount === 1 ? 'property' : 'properties'}. Ensure depreciation schedules are up to date.`,
        impact: "Maximize Tax Deductions",
        action: "Update depreciation report",
        metric: 50,
        target: 100,
        icon: Building2,
        color: "#8B5CF6"
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const recommendations = generateRecommendations();
  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;
  const mediumPriorityCount = recommendations.filter(r => r.priority === 'medium').length;

  // Radar chart data for portfolio health
  const radarData = [
    { subject: 'Debt Management', A: Math.max(0, 100 - debtToAssetRatio * 2), fullMark: 100 },
    { subject: 'Risk Efficiency', A: sharpeRatio * 150, fullMark: 100 },
    { subject: 'Diversification', A: diversificationScore, fullMark: 100 },
    { subject: 'Liquidity', A: Math.min(100, liquidityRatio * 3), fullMark: 100 },
    { subject: 'Tax Efficiency', A: taxEfficiencyScore, fullMark: 100 },
    { subject: 'Growth Potential', A: expectedReturn * 10, fullMark: 100 }
  ];

  // Priority breakdown for pie chart
  const priorityData = [
    { name: 'High Priority', value: highPriorityCount, color: '#EF4444' },
    { name: 'Medium Priority', value: mediumPriorityCount, color: '#D4A84C' },
    { name: 'Low Priority', value: recommendations.length - highPriorityCount - mediumPriorityCount, color: '#10B981' }
  ].filter(d => d.value > 0);

  return (
    <Layout>
      <div className="space-y-6" data-testid="financial-recommendations-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground">
              Financial Recommendations
            </h1>
            <p className="text-muted-foreground mt-1">
              Dynamic analysis based on your risk profile, debt position, and financial goals
            </p>
          </div>
          <div className="flex gap-2">
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="px-3 py-1">
                {highPriorityCount} High Priority
              </Badge>
            )}
            {mediumPriorityCount > 0 && (
              <Badge className="bg-[#D4A84C] px-3 py-1">
                {mediumPriorityCount} Medium Priority
              </Badge>
            )}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#1a2744]/10 flex items-center justify-center">
                  <Scale className="h-5 w-5 text-[#1a2744]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Debt/Asset Ratio</p>
                  <p className={`text-xl font-bold ${debtToAssetRatio > 50 ? 'text-destructive' : debtToAssetRatio > 30 ? 'text-[#D4A84C]' : 'text-[#10B981]'}`}>
                    {debtToAssetRatio.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D4A84C]/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-[#D4A84C]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className={`text-xl font-bold ${sharpeRatio < 0.3 ? 'text-destructive' : sharpeRatio < 0.5 ? 'text-[#D4A84C]' : 'text-[#10B981]'}`}>
                    {sharpeRatio.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Diversification</p>
                  <p className={`text-xl font-bold ${diversificationScore < 50 ? 'text-destructive' : diversificationScore < 70 ? 'text-[#D4A84C]' : 'text-[#10B981]'}`}>
                    {diversificationScore.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Effective Tax Rate</p>
                  <p className={`text-xl font-bold ${effectiveTaxRate > 35 ? 'text-destructive' : 'text-[#10B981]'}`}>
                    {effectiveTaxRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Health Radar */}
              <Card data-testid="portfolio-health-radar">
                <CardHeader>
                  <CardTitle className="">Portfolio Health Score</CardTitle>
                  <CardDescription>Multi-dimensional analysis of your financial position</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={300}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Score"
                          dataKey="A"
                          stroke="#1a2744"
                          fill="#1a2744"
                          fillOpacity={0.3}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Priority Distribution */}
              <Card data-testid="priority-distribution">
                <CardHeader>
                  <CardTitle className="">Action Priority Distribution</CardTitle>
                  <CardDescription>Breakdown of recommendation priorities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={200}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`item-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  
                  <div className="mt-4 space-y-2">
                    {priorityData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value} items</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top 3 Recommendations */}
            <Card data-testid="top-recommendations">
              <CardHeader>
                <CardTitle className=" flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-[#D4A84C]" />
                  Top Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.slice(0, 3).map((rec) => {
                  const Icon = rec.icon;
                  return (
                    <div 
                      key={rec.id}
                      className="p-4 rounded-lg border hover:border-[#1a2744]/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${rec.color}15` }}
                        >
                          <Icon className="h-6 w-6" style={{ color: rec.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: rec.color, color: rec.color }}
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-[#10B981]" />
                              <span className="text-sm font-medium text-[#10B981]">{rec.impact}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[#1a2744]"
                              onClick={() => handleActionClick(rec.action)}
                              data-testid={`action-${rec.category}`}
                            >
                              {rec.action}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="">All Recommendations</CardTitle>
                <CardDescription>
                  {recommendations.length} personalized recommendations based on your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendations.map((rec) => {
                  const Icon = rec.icon;
                  return (
                    <div 
                      key={rec.id}
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${rec.color}15` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: rec.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{rec.title}</h4>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: rec.color, color: rec.color }}
                            >
                              {rec.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {rec.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                          
                          {/* Progress bar for metric */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Current Score</span>
                              <span>Target: {rec.target}%</span>
                            </div>
                            <Progress value={rec.metric} className="h-2" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium" style={{ color: rec.color }}>{rec.impact}</span>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleActionClick(rec.action)}
                              data-testid={`action-all-${rec.category}`}
                            >
                              {rec.action}
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Debt Metrics */}
              <Card data-testid="debt-metrics">
                <CardHeader>
                  <CardTitle className=" flex items-center gap-2">
                    <Scale className="h-5 w-5 text-[#1a2744]" />
                    Debt Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Debt-to-Asset Ratio</span>
                        <span className="font-semibold">{debtToAssetRatio.toFixed(1)}%</span>
                      </div>
                      <Progress value={debtToAssetRatio} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Target: &lt;50%</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Debt-to-Equity Ratio</span>
                        <span className="font-semibold">{debtToEquityRatio.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(100, debtToEquityRatio)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Target: &lt;100%</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Debt Service Ratio</span>
                        <span className="font-semibold">{debtServiceRatio.toFixed(1)}%</span>
                      </div>
                      <Progress value={debtServiceRatio * 3} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Target: &lt;30% of income</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Metrics */}
              <Card data-testid="risk-metrics">
                <CardHeader>
                  <CardTitle className=" flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#D4A84C]" />
                    Risk Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Expected Return</p>
                      <p className="text-2xl font-bold text-[#10B981]">{expectedReturn}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Volatility</p>
                      <p className="text-2xl font-bold text-[#D4A84C]">{portfolioVolatility}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                      <p className="text-2xl font-bold">{sharpeRatio.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Risk-Adj. Return</p>
                      <p className="text-2xl font-bold">{(riskAdjustedReturn * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  {monteCarloData && (
                    <div className="p-3 rounded-lg bg-[#1a2744]/5">
                      <p className="text-sm font-medium mb-2">10-Year Monte Carlo Results</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Median Outcome: </span>
                          <span className="font-semibold">{formatCurrency(monteCarloData.final_value_median)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Loss Probability: </span>
                          <span className="font-semibold text-destructive">{monteCarloData.probability_of_loss.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Asset Composition */}
              <Card data-testid="asset-composition">
                <CardHeader>
                  <CardTitle className=" flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#10B981]" />
                    Asset Composition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Liquid Assets</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatCurrency(liquidAssets)}</span>
                        <Badge variant="outline">{liquidityRatio.toFixed(0)}%</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Illiquid Assets</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatCurrency(illiquidAssets)}</span>
                        <Badge variant="outline">{(100 - liquidityRatio).toFixed(0)}%</Badge>
                      </div>
                    </div>
                    <Progress value={liquidityRatio} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      Recommended liquidity: 20-40% for balanced portfolio
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Efficiency */}
              <Card data-testid="tax-efficiency">
                <CardHeader>
                  <CardTitle className=" flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-[#3B82F6]" />
                    Tax Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Gross Income</p>
                        <p className="text-xl font-bold">{formatCurrency(annualIncome)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Total Tax</p>
                        <p className="text-xl font-bold text-destructive">{formatCurrency(totalTax)}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Effective Tax Rate</span>
                        <span className="font-semibold">{effectiveTaxRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={effectiveTaxRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tax Efficiency Score</span>
                        <span className="font-semibold text-[#10B981]">{taxEfficiencyScore.toFixed(0)}/100</span>
                      </div>
                      <Progress value={taxEfficiencyScore} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default FinancialRecommendations;
