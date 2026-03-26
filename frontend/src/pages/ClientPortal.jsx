import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
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
  ChevronRight
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

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
            client_id: clientId,
            current_age: 45,
            retirement_age: 65,
            life_expectancy: 90,
            current_portfolio: 800000,
            annual_contributions: 30000,
            retirement_spending: 80000,
            expected_return: 0.07,
            return_volatility: 0.15,
            inflation_rate: 0.025,
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

  const formatCurrency = (val) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val || 0);

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

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-portal">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {dashboard?.name?.split(' ')[0]}!</h2>
          <p className="text-blue-100 mb-4">Your advisor: {dashboard?.advisor?.name}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboard?.summary?.net_worth)}</p>
              <p className={`text-sm ${dashboard?.summary?.net_worth_change_pct >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {dashboard?.summary?.net_worth_change_pct >= 0 ? '↑' : '↓'} {Math.abs(dashboard?.summary?.net_worth_change_pct || 0).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Retirement Confidence</p>
              <p className="text-2xl font-bold">{confidenceScore.toFixed(0)}%</p>
              <p className={`text-sm ${confidenceScore >= 80 ? 'text-green-300' : confidenceScore >= 60 ? 'text-yellow-300' : 'text-red-300'}`}>
                {confidenceScore >= 80 ? 'On Track' : confidenceScore >= 60 ? 'Good' : 'Needs Attention'}
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Goals on Track</p>
              <p className="text-2xl font-bold">{dashboard?.summary?.goals_on_track}/{dashboard?.summary?.goals_count}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Pending Actions</p>
              <p className="text-2xl font-bold">{pendingActions}</p>
            </div>
          </div>
        </div>

        {/* Simplified 3-Tab Structure */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="investments" data-testid="tab-investments">Investments</TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">Actions</TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW - Net Worth, Retirement Confidence, Key Metrics */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Net Worth Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-blue-600" />
                    Net Worth Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-blue-600">{formatCurrency(netWorth?.net_worth)}</p>
                    <p className="text-sm text-muted-foreground">Total Net Worth</p>
                  </div>
                  {netWorth?.assets && (
                    <div className="h-[180px] mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={Object.entries(netWorth.assets)
                              .filter(([_, v]) => v > 0)
                              .slice(0, 6)
                              .map(([key, value], idx) => ({
                                name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                value,
                                fill: CHART_COLORS[idx % CHART_COLORS.length]
                              }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {Object.entries(netWorth?.assets || {})
                              .filter(([_, v]) => v > 0)
                              .slice(0, 6)
                              .map((_, idx) => (
                                <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
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
                      <p className="font-semibold text-green-700">{formatCurrency(netWorth?.assets?.total || Object.values(netWorth?.assets || {}).reduce((a, b) => a + b, 0))}</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-muted-foreground">Liabilities</p>
                      <p className="font-semibold text-red-700">-{formatCurrency(netWorth?.liabilities?.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Retirement Confidence */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    Retirement Confidence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p 
                      className="text-5xl font-bold"
                      style={{ 
                        color: confidenceScore >= 80 ? '#22c55e' 
                             : confidenceScore >= 60 ? '#3b82f6' 
                             : confidenceScore >= 40 ? '#f59e0b' 
                             : '#ef4444' 
                      }}
                    >
                      {confidenceScore.toFixed(0)}%
                    </p>
                    <Badge 
                      className={
                        confidenceScore >= 80 ? 'bg-green-500' 
                        : confidenceScore >= 60 ? 'bg-blue-500' 
                        : confidenceScore >= 40 ? 'bg-amber-500' 
                        : 'bg-red-500'
                      }
                    >
                      {confidenceScore >= 80 ? 'On Track' 
                       : confidenceScore >= 60 ? 'Good' 
                       : confidenceScore >= 40 ? 'Needs Attention' 
                       : 'At Risk'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monte Carlo Success</span>
                      <span className="font-medium">{retirementConfidence?.monte_carlo?.success_rate_percent?.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Years to Retirement</span>
                      <span className="font-medium">{retirementConfidence?.inputs?.years_to_retirement || 20} years</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Projected Balance</span>
                      <span className="font-medium">{formatCurrency(retirementConfidence?.monte_carlo?.percentiles?.p50_median)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Progress value={confidenceScore} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Based on {(retirementConfidence?.monte_carlo?.num_simulations || 3000).toLocaleString()} simulations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: INVESTMENTS - Portfolio summary, Asset allocation */}
          <TabsContent value="investments" className="space-y-4">
            {/* Portfolio Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(portfolios?.summary?.total_value)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Portfolios</p>
                  <p className="text-2xl font-bold">{portfolios?.summary?.portfolio_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">YTD Return</p>
                  <p className={`text-2xl font-bold ${(portfolios?.summary?.weighted_ytd_return || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(portfolios?.summary?.weighted_ytd_return || 0) >= 0 ? '+' : ''}{portfolios?.summary?.weighted_ytd_return || 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Cards */}
            {portfolios?.portfolios?.map((portfolio) => (
              <Card key={portfolio.portfolio_id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                      <CardDescription>{portfolio.risk_profile}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(portfolio.value)}</p>
                      <Badge className={portfolio.change_ytd >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {portfolio.change_ytd >= 0 ? '+' : ''}{portfolio.change_ytd}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {portfolio.holdings?.slice(0, 4).map((holding, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 text-sm">
                        <div>
                          <span className="font-medium">{holding.symbol}</span>
                          <span className="text-muted-foreground ml-2">{holding.name?.substring(0, 20)}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(holding.value)}</span>
                          <span className={`ml-2 ${holding.change_1d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {holding.change_1d >= 0 ? '+' : ''}{holding.change_1d}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* TAB 3: ACTIONS - Goals progress, Pending documents, Notifications */}
          <TabsContent value="actions" className="space-y-4">
            {/* Goals Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Your Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-700">{goals?.summary?.on_track || 0}</p>
                    <p className="text-xs text-muted-foreground">On Track</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-amber-700">{goals?.summary?.at_risk || 0}</p>
                    <p className="text-xs text-muted-foreground">At Risk</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-700">{goals?.summary?.total_goals || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {goals?.goals?.slice(0, 3).map((goal) => (
                    <div key={goal.goal_id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{goal.name}</span>
                        <Badge variant={goal.status === 'on_track' ? 'default' : 'secondary'}>
                          {goal.progress_pct}%
                        </Badge>
                      </div>
                      <Progress value={goal.progress_pct} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(goal.current_amount)}</span>
                        <span>{formatCurrency(goal.target_amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Actions */}
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
                  <div className="space-y-3">
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

            {/* Documents Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Recent Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "Statement of Advice 2025", status: "signed", date: "Jun 15" },
                    { name: "Fee Disclosure Statement", status: "pending", date: "Dec 1" },
                    { name: "Q3 Portfolio Report", status: "available", date: "Oct 1" }
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.date}</p>
                        </div>
                      </div>
                      <Badge variant={doc.status === 'pending' ? 'destructive' : doc.status === 'signed' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Advisor Contact */}
        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{dashboard?.advisor?.name}</p>
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
