import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sun,
  Moon,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  DollarSign,
  PieChart,
  Building2,
  LineChart,
  Clock,
  Bell,
  Target,
  Zap,
  RefreshCw,
  X,
  ChevronRight,
  Sparkles,
  FileText,
  Shield
} from "lucide-react";
import { toast } from "sonner";
import { usePortfolio } from "@/App";
import ChartContainer from "@/components/ChartContainer";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value) => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", icon: Sun };
  if (hour < 18) return { text: "Good Afternoon", icon: Sun };
  return { text: "Good Evening", icon: Moon };
};

const DailyBriefing = () => {
  const navigate = useNavigate();
  const { portfolio, familyMembers, sharePortfolio, budget } = usePortfolio();
  const [dismissed, setDismissed] = useState(false);
  const [lastVisit, setLastVisit] = useState(() => {
    const saved = localStorage.getItem("last_briefing_visit");
    return saved ? new Date(saved) : new Date(Date.now() - 86400000); // Default to yesterday
  });

  const greeting = getGreeting();
  const today = new Date();
  const userName = familyMembers[0]?.name?.split(' ')[0] || "there";

  // Calculate portfolio changes
  const totalAssets = portfolio.summary?.totalAssets || 2920000;
  const totalDebt = portfolio.summary?.totalDebt || 942000;
  const netWorth = totalAssets - totalDebt;
  
  // Simulated changes since last visit
  const portfolioChange = {
    netWorth: netWorth * 0.012, // +1.2% simulated
    netWorthPercent: 1.2,
    shares: sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0) * 0.023,
    sharesPercent: 2.3,
    property: -15000, // Slight decrease
    propertyPercent: -0.8,
  };

  // Upcoming deadlines
  const getUpcomingDeadlines = () => {
    const deadlines = [];
    const currentMonth = today.getMonth();
    
    // BAS Quarters
    const basDeadlines = [
      { month: 1, day: 28, label: "Q2 BAS Due", type: "bas" },
      { month: 4, day: 28, label: "Q3 BAS Due", type: "bas" },
      { month: 6, day: 28, label: "Q4 BAS Due", type: "bas" },
      { month: 9, day: 28, label: "Q1 BAS Due", type: "bas" },
    ];

    basDeadlines.forEach(d => {
      const deadline = new Date(today.getFullYear(), d.month, d.day);
      const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      if (daysUntil > 0 && daysUntil <= 60) {
        deadlines.push({
          ...d,
          date: deadline,
          daysUntil,
          urgent: daysUntil <= 14,
          path: "/bas-calculator"
        });
      }
    });

    // Tax return
    if (currentMonth >= 6) {
      const taxDeadline = new Date(today.getFullYear(), 9, 31);
      const daysUntil = Math.ceil((taxDeadline - today) / (1000 * 60 * 60 * 24));
      if (daysUntil > 0) {
        deadlines.push({
          label: "Tax Return Due",
          type: "tax",
          date: taxDeadline,
          daysUntil,
          urgent: daysUntil <= 30,
          path: "/tax-analysis-sync"
        });
      }
    }

    // Super contribution deadline
    if (currentMonth >= 4 && currentMonth <= 5) {
      deadlines.push({
        label: "Super Contribution Deadline",
        type: "super",
        date: new Date(today.getFullYear(), 5, 30),
        daysUntil: Math.ceil((new Date(today.getFullYear(), 5, 30) - today) / (1000 * 60 * 60 * 24)),
        urgent: true,
        path: "/smsf-optimizer"
      });
    }

    return deadlines.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
  };

  // AI-generated recommendations
  const getRecommendations = () => {
    const recommendations = [];
    const debtRatio = (totalDebt / totalAssets) * 100;
    const monthlyIncome = Object.values(budget.income).reduce((a, b) => a + b, 0);
    const monthlyExpenses = Object.values(budget.expenses).reduce((a, b) => a + b, 0);
    const surplus = monthlyIncome - monthlyExpenses;

    // Check debt ratio
    if (debtRatio > 50) {
      recommendations.push({
        id: 1,
        priority: "high",
        icon: AlertTriangle,
        title: "Review Debt Position",
        description: `Your debt-to-asset ratio is ${debtRatio.toFixed(0)}%. Consider accelerating loan repayments.`,
        impact: "Reduce interest costs by up to $5,000/year",
        action: { label: "View Loan Calculator", path: "/loan-calculator" }
      });
    }

    // Check surplus
    if (surplus > 2000) {
      recommendations.push({
        id: 2,
        priority: "medium",
        icon: TrendingUp,
        title: "Invest Monthly Surplus",
        description: `You have ${formatCurrency(surplus)}/month surplus. Consider dollar-cost averaging into ETFs.`,
        impact: `Potential ${formatCurrency(surplus * 12 * 0.07)} growth in 1 year at 7%`,
        action: { label: "View Shares", path: "/share-portfolio" }
      });
    }

    // Super optimization
    const totalSuper = familyMembers.reduce((sum, m) => sum + (m.superBalance || 0), 0);
    const primaryIncome = familyMembers[0]?.taxableIncome || 185000;
    if (primaryIncome > 120000) {
      recommendations.push({
        id: 3,
        priority: "high",
        icon: PieChart,
        title: "Maximize Super Contributions",
        description: "You're in a high tax bracket. Salary sacrificing to super could save significant tax.",
        impact: "Save up to $5,250/year in tax at 37% marginal rate",
        action: { label: "Open SMSF Optimizer", path: "/smsf-optimizer" }
      });
    }

    // Risk profile
    const savedProfile = localStorage.getItem("wheeler_risk_profiles");
    if (!savedProfile) {
      recommendations.push({
        id: 4,
        priority: "medium",
        icon: Shield,
        title: "Complete Risk Assessment",
        description: "Get personalized investment recommendations based on your risk tolerance.",
        impact: "Optimize asset allocation for your goals",
        action: { label: "Take Assessment", path: "/risk-profiler" }
      });
    }

    // Diversification
    const shareValue = sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0);
    if (shareValue > totalAssets * 0.4) {
      recommendations.push({
        id: 5,
        priority: "low",
        icon: PieChart,
        title: "Consider Diversification",
        description: "Shares represent over 40% of your portfolio. Review asset allocation.",
        impact: "Reduce concentration risk",
        action: { label: "View Strategic Planning", path: "/strategic-planning" }
      });
    }

    return recommendations.slice(0, 4);
  };

  // Market summary (simulated)
  const marketSummary = {
    asx200: { value: 7823.5, change: 0.45 },
    audUsd: { value: 0.6542, change: -0.12 },
    rbaRate: { value: 4.35, change: 0 },
  };

  // Portfolio performance data
  const performanceData = [
    { month: 'Jul', value: netWorth * 0.92 },
    { month: 'Aug', value: netWorth * 0.94 },
    { month: 'Sep', value: netWorth * 0.93 },
    { month: 'Oct', value: netWorth * 0.96 },
    { month: 'Nov', value: netWorth * 0.98 },
    { month: 'Dec', value: netWorth },
  ];

  const deadlines = getUpcomingDeadlines();
  const recommendations = getRecommendations();

  // Mark as visited
  useEffect(() => {
    localStorage.setItem("last_briefing_visit", new Date().toISOString());
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  if (dismissed) {
    navigate("/dashboard");
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="daily-briefing-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#D4A84C] to-[#1a2744] flex items-center justify-center">
              <greeting.icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold ">
                {greeting.text}, {userName}
              </h1>
              <p className="text-muted-foreground">
                {today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button variant="ghost" onClick={() => setDismissed(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#1a5c45] text-white">
            <CardContent className="p-4">
              <p className="text-white/70 text-sm">Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(netWorth)}</p>
              <div className={`flex items-center gap-1 text-sm mt-1 ${portfolioChange.netWorthPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {portfolioChange.netWorthPercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {formatPercent(portfolioChange.netWorthPercent)} this week
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm">Shares</p>
              <p className="text-2xl font-bold">{formatCurrency(sharePortfolio.reduce((sum, s) => sum + (s.quantity * s.currentPrice), 0))}</p>
              <div className={`flex items-center gap-1 text-sm mt-1 ${portfolioChange.sharesPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioChange.sharesPercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {formatPercent(portfolioChange.sharesPercent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm">Property</p>
              <p className="text-2xl font-bold">{formatCurrency(portfolio.investments?.properties?.reduce((sum, p) => sum + p.value, 0) || 0)}</p>
              <div className={`flex items-center gap-1 text-sm mt-1 ${portfolioChange.propertyPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioChange.propertyPercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {formatPercent(portfolioChange.propertyPercent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-sm">Monthly Cashflow</p>
              <p className="text-2xl font-bold">
                {formatCurrency(Object.values(budget.income).reduce((a, b) => a + b, 0) - Object.values(budget.expenses).reduce((a, b) => a + b, 0))}
              </p>
              <div className="flex items-center gap-1 text-sm mt-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Surplus
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-[#D4A84C]" />
                  Portfolio Performance (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={200}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="value" stroke="#1a2744" strokeWidth={2} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#D4A84C]" />
                  AI-Powered Recommendations
                </CardTitle>
                <CardDescription>Personalized actions based on your portfolio analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.id}
                    className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <rec.icon className="h-5 w-5 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{rec.title}</p>
                            <Badge variant="outline" className="text-xs capitalize">{rec.priority}</Badge>
                          </div>
                          <p className="text-sm opacity-80 mt-1">{rec.description}</p>
                          <p className="text-xs mt-2 font-medium">
                            <Zap className="h-3 w-3 inline mr-1" />
                            {rec.impact}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => navigate(rec.action.path)}
                      >
                        {rec.action.label}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#D4A84C]" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {deadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                ) : (
                  deadlines.map((deadline, i) => (
                    <div 
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        deadline.urgent ? 'bg-red-50 border border-red-200' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          deadline.urgent ? 'bg-red-100' : 'bg-muted'
                        }`}>
                          {deadline.type === 'bas' && <FileText className={`h-5 w-5 ${deadline.urgent ? 'text-red-600' : ''}`} />}
                          {deadline.type === 'tax' && <DollarSign className={`h-5 w-5 ${deadline.urgent ? 'text-red-600' : ''}`} />}
                          {deadline.type === 'super' && <PieChart className={`h-5 w-5 ${deadline.urgent ? 'text-red-600' : ''}`} />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{deadline.label}</p>
                          <p className={`text-xs ${deadline.urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            {deadline.daysUntil} days remaining
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => navigate(deadline.path)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Market Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#D4A84C]" />
                  Market Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">ASX 200</p>
                    <p className="font-bold">{marketSummary.asx200.value.toLocaleString()}</p>
                  </div>
                  <Badge className={marketSummary.asx200.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {formatPercent(marketSummary.asx200.change)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">AUD/USD</p>
                    <p className="font-bold">{marketSummary.audUsd.value.toFixed(4)}</p>
                  </div>
                  <Badge className={marketSummary.audUsd.change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {formatPercent(marketSummary.audUsd.change)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">RBA Cash Rate</p>
                    <p className="font-bold">{marketSummary.rbaRate.value}%</p>
                  </div>
                  <Badge variant="outline">Unchanged</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#D4A84C]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/copilot")}>
                  <Sparkles className="h-4 w-4 mr-2" /> Ask AI Copilot
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/tax-analysis-sync")}>
                  <DollarSign className="h-4 w-4 mr-2" /> View Tax Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/reports")}>
                  <FileText className="h-4 w-4 mr-2" /> Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DailyBriefing;
