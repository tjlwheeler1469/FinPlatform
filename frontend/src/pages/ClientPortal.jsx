import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SmartInsights from "@/components/SmartInsights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Bell,
  FileText,
  User,
  PieChart,
  MessageSquare,
  Gauge,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Sun,
  Brain,
  Calendar,
  RefreshCw
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  RadialBarChart,
  RadialBar
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const formatCurrency = (val) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val || 0);

const getConfidenceColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
};

const getConfidenceLabel = (score) => {
  if (score >= 80) return 'On Track';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Attention';
  return 'At Risk';
};

// CLIENT PORTAL - SIMPLIFIED VIEW
// Only shows: Overview with Net Worth, Retirement Confidence, Goals, and Pending Actions
// All combined into a single, clean dashboard page

const ClientPortal = () => {
  const [loading, setLoading] = useState(true);
  const [clientId] = useState("portal_001");
  const [dashboard, setDashboard] = useState(null);
  const [portfolios, setPortfolios] = useState(null);
  const [goals, setGoals] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [retirementConfidence, setRetirementConfidence] = useState(null);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, portRes, goalsRes, nwRes, notifRes, retireRes] = await Promise.all([
        fetch(`${API_URL}/api/client-portal/dashboard/${clientId}`),
        fetch(`${API_URL}/api/client-portal/portfolios/${clientId}`),
        fetch(`${API_URL}/api/client-portal/goals/${clientId}`),
        fetch(`${API_URL}/api/client-portal/net-worth/${clientId}`),
        fetch(`${API_URL}/api/client-portal/notifications/${clientId}`),
        fetch(`${API_URL}/api/hybrid-engine/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Realistic 50-year-old married couple (Client view)
            client_id: clientId,
            current_age: 50,
            retirement_age: 67,
            life_expectancy: 92,
            // Combined net worth around $1.6M for average married 50-year-olds
            current_portfolio: 1609800,
            // Combined super contributions (employer + salary sacrifice)
            annual_contributions: 42000,
            // ASFA comfortable retirement standard for couples
            retirement_spending: 72000,
            expected_return: 0.065,
            return_volatility: 0.12,
            inflation_rate: 0.03,
            num_simulations: 3000,
            enable_dynamic_spending: true,
            mode: 'background'
          })
        })
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (portRes.ok) setPortfolios(await portRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (nwRes.ok) setNetWorth(await nwRes.json());
      if (notifRes.ok) setNotifications((await notifRes.json()).notifications || []);
      if (retireRes.ok) setRetirementConfidence(await retireRes.json());
    } catch (error) {
      console.error("Failed to fetch client data:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your financial dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const pendingActions = notifications.filter(n => n.type === 'action_required').length;
  const confidenceScore = retirementConfidence?.confidence_score || 0;
  const yearsToRetirement = retirementConfidence?.inputs?.years_to_retirement || 20;

  // Portfolio data for Smart Insights
  const portfolioDataForInsights = {
    totalValue: netWorth?.net_worth || dashboard?.summary?.net_worth || 0,
    byType: netWorth?.assets || {},
    net_worth: netWorth?.net_worth || dashboard?.summary?.net_worth || 0
  };

  // Net worth breakdown for pie chart
  const netWorthData = netWorth?.assets 
    ? Object.entries(netWorth.assets)
        .filter(([_, v]) => v > 0)
        .slice(0, 6)
        .map(([key, value], idx) => ({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value,
          fill: CHART_COLORS[idx % CHART_COLORS.length]
        }))
    : [];

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-portal">
        {/* Header with Date (Daily Briefing style) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sun className="h-8 w-8 text-amber-500" />
              Welcome, {dashboard?.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Hero Stats Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboard?.summary?.net_worth || netWorth?.net_worth)}</p>
              <p className={`text-sm ${(dashboard?.summary?.net_worth_change_pct || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {(dashboard?.summary?.net_worth_change_pct || 0) >= 0 ? '↑' : '↓'} {Math.abs(dashboard?.summary?.net_worth_change_pct || 0).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Retirement Confidence</p>
              <p className="text-2xl font-bold">{confidenceScore.toFixed(0)}%</p>
              <p className={`text-sm ${confidenceScore >= 80 ? 'text-green-300' : confidenceScore >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                {getConfidenceLabel(confidenceScore)}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Goals on Track</p>
              <p className="text-2xl font-bold">{dashboard?.summary?.goals_on_track || goals?.summary?.on_track || 0}/{dashboard?.summary?.goals_count || goals?.summary?.total_goals || 0}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Years to Retirement</p>
              <p className="text-2xl font-bold">{yearsToRetirement}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Column 1: Retirement Confidence */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Retirement Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="60%" 
                      outerRadius="100%" 
                      data={[{ value: confidenceScore, fill: getConfidenceColor(confidenceScore) }]}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar dataKey="value" cornerRadius={10} background />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold" style={{ color: getConfidenceColor(confidenceScore) }}>
                      {confidenceScore.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <Badge 
                  className={
                    confidenceScore >= 80 ? 'bg-green-500' 
                    : confidenceScore >= 60 ? 'bg-blue-500' 
                    : confidenceScore >= 40 ? 'bg-amber-500' 
                    : 'bg-red-500'
                  }
                >
                  {getConfidenceLabel(confidenceScore)}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Monte Carlo Success</span>
                  <span className="font-medium">{retirementConfidence?.monte_carlo?.success_rate_percent?.toFixed(0) || '--'}%</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Median Outcome</span>
                  <span className="font-medium">{formatCurrency(retirementConfidence?.monte_carlo?.percentiles?.p50_median)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Net Worth */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-green-600" />
                Net Worth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-green-600">{formatCurrency(dashboard?.summary?.net_worth || netWorth?.net_worth)}</p>
                <p className="text-sm text-green-600">
                  <ArrowUp className="h-3 w-3 inline" /> +{(dashboard?.summary?.net_worth_change_pct || 5.2).toFixed(1)}% YTD
                </p>
              </div>
              
              {netWorthData.length > 0 && (
                <div className="h-[160px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={netWorthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {netWorthData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-muted-foreground">Assets</p>
                  <p className="font-semibold text-green-700">
                    {formatCurrency(Object.values(netWorth?.assets || {}).reduce((a, b) => a + b, 0))}
                  </p>
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <p className="text-muted-foreground">Liabilities</p>
                  <p className="font-semibold text-red-700">-{formatCurrency(netWorth?.liabilities?.total || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Column 3: Goals & Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Goals Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-700">{goals?.summary?.on_track || 0}</p>
                  <p className="text-xs text-muted-foreground">On Track</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-amber-700">{goals?.summary?.at_risk || 0}</p>
                  <p className="text-xs text-muted-foreground">At Risk</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-700">{goals?.summary?.total_goals || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {(goals?.goals || []).slice(0, 3).map((goal) => (
                  <div key={goal.goal_id} className="p-2 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{goal.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {goal.progress_pct}%
                      </Badge>
                    </div>
                    <Progress value={goal.progress_pct} className="h-1.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Insights Section */}
        <SmartInsights 
          clientId={clientId}
          portfolioData={portfolioDataForInsights}
          retirementData={retirementConfidence}
          isAdvisor={false}
          compact={true}
          maxInsights={4}
        />

        {/* Pending Actions & Notifications */}
        {(pendingActions > 0 || notifications.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Pending Actions
                {pendingActions > 0 && (
                  <Badge variant="destructive">{pendingActions}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No pending actions</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {notifications.slice(0, 4).map((notif) => (
                    <div 
                      key={notif.notification_id} 
                      className={`p-3 rounded-lg flex items-start gap-3 ${
                        notif.type === 'action_required' ? 'bg-red-50 border border-red-200' : 'bg-muted/30'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.type === 'action_required' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {notif.type === 'action_required' ? (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Bell className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                      </div>
                      {notif.type === 'action_required' && (
                        <Button size="sm" variant="destructive">Action</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Advisor Contact Footer */}
        <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{dashboard?.advisor?.name || 'Your Financial Advisor'}</p>
                <p className="text-sm text-muted-foreground">Your Financial Advisor</p>
              </div>
            </div>
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Advisor
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ClientPortal;
