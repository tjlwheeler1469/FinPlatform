import { useState, useEffect } from "react";
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
  MessageSquare
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

// Color palette for charts
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1'];

const ClientPortal = () => {
  const [loading, setLoading] = useState(true);
  const [clientId] = useState("portal_001");
  const [dashboard, setDashboard] = useState(null);
  const [portfolios, setPortfolios] = useState(null);
  const [goals, setGoals] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, portRes, goalsRes, nwRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/api/client-portal/dashboard/${clientId}`),
        fetch(`${API_URL}/api/client-portal/portfolios/${clientId}`),
        fetch(`${API_URL}/api/client-portal/goals/${clientId}`),
        fetch(`${API_URL}/api/client-portal/net-worth/${clientId}`),
        fetch(`${API_URL}/api/client-portal/notifications/${clientId}`)
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (portRes.ok) setPortfolios(await portRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (nwRes.ok) setNetWorth(await nwRes.json());
      if (notifRes.ok) setNotifications((await notifRes.json()).notifications || []);
    } catch (error) {
      console.error("Failed to fetch client data:", error);
    }
    setLoading(false);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val || 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" data-testid="client-portal">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Wealth Command</h1>
              <p className="text-xs text-muted-foreground">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {dashboard?.summary?.unread_notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {dashboard.summary.unread_notifications}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{dashboard?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Welcome back, {dashboard?.name?.split(' ')[0]}!</h2>
          <p className="text-blue-100 mb-4">Your advisor: {dashboard?.advisor?.name}</p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Net Worth</p>
              <p className="text-2xl font-bold">{formatCurrency(dashboard?.summary?.net_worth)}</p>
              <p className={`text-sm ${dashboard?.summary?.net_worth_change_pct >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {dashboard?.summary?.net_worth_change_pct >= 0 ? '↑' : '↓'} {Math.abs(dashboard?.summary?.net_worth_change_pct || 0).toFixed(1)}% this month
              </p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Goals on Track</p>
              <p className="text-2xl font-bold">{dashboard?.summary?.goals_on_track}/{dashboard?.summary?.goals_count}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Pending Actions</p>
              <p className="text-2xl font-bold">{dashboard?.summary?.pending_documents}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-blue-100 text-sm">Next Meeting</p>
              <p className="text-lg font-bold">{dashboard?.summary?.upcoming_meetings > 0 ? 'Scheduled' : 'None'}</p>
            </div>
          </div>
        </div>

        {dashboard?.latest_insight && (
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{dashboard.latest_insight.title}</h4>
                <p className="text-sm text-muted-foreground">{dashboard.latest_insight.message}</p>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolios">Portfolios</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-blue-600" />Net Worth Breakdown</CardTitle></CardHeader>
                <CardContent>
                  {netWorth?.assets && Object.keys(netWorth.assets).length > 0 ? (
                    <>
                      <div className="h-[200px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                            <Pie
                              data={Object.entries(netWorth.assets)
                                .filter(([_, v]) => v > 0)
                                .map(([key, value], idx) => ({
                                  name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                  value,
                                  fill: CHART_COLORS[idx % CHART_COLORS.length]
                                }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {Object.entries(netWorth.assets)
                                .filter(([_, v]) => v > 0)
                                .map((_, idx) => (
                                  <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                          </RechartsPie>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(netWorth.assets).map(([key, value], idx) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                              <span className="capitalize text-sm">{key.replace(/_/g, ' ')}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(value)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex items-center justify-between text-red-600">
                          <span className="text-sm">Liabilities</span>
                          <span className="font-medium">-{formatCurrency(netWorth?.liabilities?.total)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      {netWorth?.assets && Object.entries(netWorth.assets).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="capitalize text-sm">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{formatCurrency(value)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex items-center justify-between text-red-600">
                        <span className="text-sm">Liabilities</span>
                        <span className="font-medium">-{formatCurrency(netWorth?.liabilities?.total)}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-orange-600" />Notifications</CardTitle></CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No new notifications</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.slice(0, 3).map((notif) => (
                        <div key={notif.notification_id} className={`p-3 rounded-lg ${notif.read ? 'bg-muted/30' : 'bg-blue-50 border border-blue-200'}`}>
                          <Badge variant={notif.type === 'action_required' ? 'destructive' : 'secondary'} className="text-xs mb-1">{notif.type.replace(/_/g, ' ')}</Badge>
                          <h5 className="font-medium text-sm">{notif.title}</h5>
                          <p className="text-xs text-muted-foreground">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="portfolios" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                  <p className="text-3xl font-bold text-green-700">{formatCurrency(portfolios?.summary?.total_value)}</p>
                </CardContent>
              </Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">Portfolios</p><p className="text-3xl font-bold">{portfolios?.summary?.portfolio_count}</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-sm text-muted-foreground">YTD Return</p><p className={`text-3xl font-bold ${portfolios?.summary?.weighted_ytd_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>{portfolios?.summary?.weighted_ytd_return >= 0 ? '+' : ''}{portfolios?.summary?.weighted_ytd_return}%</p></CardContent></Card>
            </div>
            
            {/* Portfolio Performance Chart */}
            {portfolios?.portfolios && portfolios.portfolios.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Portfolio Performance (YTD)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={portfolios.portfolios.map(p => ({
                          name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                          return: p.change_ytd,
                          value: p.value
                        }))}
                        layout="vertical"
                        margin={{ left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'return' ? `${value}%` : formatCurrency(value),
                            name === 'return' ? 'YTD Return' : 'Value'
                          ]}
                        />
                        <Bar 
                          dataKey="return" 
                          fill="#10B981"
                          radius={[0, 4, 4, 0]}
                        >
                          {portfolios.portfolios.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.change_ytd >= 0 ? '#10B981' : '#EF4444'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
            {portfolios?.portfolios?.map((portfolio) => (
              <Card key={portfolio.portfolio_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div><CardTitle>{portfolio.name}</CardTitle><CardDescription>{portfolio.risk_profile} • {formatCurrency(portfolio.value)}</CardDescription></div>
                    <Badge className={portfolio.change_ytd >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{portfolio.change_ytd >= 0 ? '+' : ''}{portfolio.change_ytd}% YTD</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {portfolio.holdings?.slice(0, 5).map((holding, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div><p className="font-medium">{holding.symbol}</p><p className="text-xs text-muted-foreground">{holding.name}</p></div>
                        <div className="text-right"><p className="font-medium">{formatCurrency(holding.value)}</p><p className={`text-xs ${holding.change_1d >= 0 ? 'text-green-600' : 'text-red-600'}`}>{holding.change_1d >= 0 ? '+' : ''}{holding.change_1d}%</p></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <Card className="bg-green-50"><CardContent className="pt-6 text-center"><Target className="h-8 w-8 text-green-600 mx-auto mb-2" /><p className="text-2xl font-bold text-green-700">{goals?.summary?.on_track}</p><p className="text-sm text-muted-foreground">On Track</p></CardContent></Card>
              <Card className="bg-yellow-50"><CardContent className="pt-6 text-center"><Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" /><p className="text-2xl font-bold text-yellow-700">{goals?.summary?.at_risk}</p><p className="text-sm text-muted-foreground">At Risk</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><Target className="h-8 w-8 text-blue-600 mx-auto mb-2" /><p className="text-2xl font-bold">{goals?.summary?.total_goals}</p><p className="text-sm text-muted-foreground">Total Goals</p></CardContent></Card>
            </div>
            {goals?.goals?.map((goal) => (
              <Card key={goal.goal_id} className={goal.status === 'at_risk' ? 'border-yellow-300' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div><h4 className="font-semibold">{goal.name}</h4><p className="text-sm text-muted-foreground">Target: {new Date(goal.target_date).toLocaleDateString()}</p></div>
                    <Badge variant={goal.status === 'on_track' ? 'default' : goal.status === 'at_risk' ? 'secondary' : 'destructive'}>{goal.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Progress</span><span>{goal.progress_pct}%</span></div>
                    <Progress value={goal.progress_pct} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground"><span>{formatCurrency(goal.current_amount)}</span><span>{formatCurrency(goal.target_amount)}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" />Your Documents</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[{name:"Statement of Advice 2025",type:"SOA",date:"Jun 15, 2025",status:"signed"},{name:"Fee Disclosure Statement",type:"FDS",date:"Dec 1, 2025",status:"pending"},{name:"Q3 2025 Portfolio Report",type:"Report",date:"Oct 1, 2025",status:"available"}].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FileText className="h-5 w-5 text-blue-600" /></div>
                        <div><p className="font-medium">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.type} • {doc.date}</p></div>
                      </div>
                      <Button variant={doc.status === 'pending' ? 'default' : 'outline'} size="sm">{doc.status === 'pending' ? 'Sign Now' : 'View'}</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center"><User className="h-6 w-6" /></div>
              <div><p className="font-semibold">{dashboard?.advisor?.name}</p><p className="text-sm text-muted-foreground">Your Financial Advisor</p></div>
            </div>
            <Button><MessageSquare className="h-4 w-4 mr-2" />Contact Advisor</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientPortal;
