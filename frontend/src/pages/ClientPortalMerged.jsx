import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  PieChart,
  Download,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  Target,
  Sun,
  Moon,
  Bell,
  Home,
  LineChart,
  LogOut,
  Clock,
  AlertCircle,
  Eye,
  Printer,
  Lock,
  Loader2,
  FileSignature,
  ClipboardList
} from "lucide-react";
import { toast } from "sonner";
import ChartContainer from "@/components/ChartContainer";
import DocuSignIntegration from "@/components/DocuSignIntegration";
import DigitalOnboarding from "@/components/DigitalOnboarding";
import {
  PieChart as RechartPie,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", icon: Sun };
  if (hour < 18) return { text: "Good Afternoon", icon: Sun };
  return { text: "Good Evening", icon: Moon };
};

// Mock client data (in production, this would come from API)
const MOCK_CLIENT_DATA = {
  id: 1,
  name: "Wheeler Family",
  primaryContact: "James Wheeler",
  email: "james.wheeler@email.com",
  adviser: {
    name: "David Chen",
    title: "Senior Financial Adviser",
    phone: "0423 456 789",
    email: "david.chen@adviser.com.au",
  },
  riskProfile: "Balanced",
  netWorth: 1978000,
  netWorthChange: 2.3,
  totalAssets: 2920000,
  totalDebt: 942000,
  lastReview: "2024-11-15",
  nextReview: "2025-02-15",
  portfolio: {
    cash: 150000,
    shares: 420000,
    property: 1850000,
    super: 500000,
  },
  goals: [
    { id: 1, name: "Retirement Fund", target: 2000000, current: 1500000, deadline: "2035" },
    { id: 2, name: "Children's Education", target: 200000, current: 85000, deadline: "2028" },
    { id: 3, name: "Pay Off Mortgage", target: 650000, current: 350000, deadline: "2030" },
  ],
  reports: [
    { id: 1, name: "Statement of Advice 2024", date: "2024-11-15", type: "SOA", status: "current" },
    { id: 2, name: "Annual Review Report", date: "2024-11-15", type: "Report", status: "current" },
    { id: 3, name: "Tax Planning Summary FY24", date: "2024-06-30", type: "Tax", status: "archived" },
    { id: 4, name: "Portfolio Performance Q3", date: "2024-09-30", type: "Report", status: "archived" },
  ],
  upcomingActions: [
    { id: 1, text: "Annual review meeting", date: "2025-02-15", type: "meeting" },
    { id: 2, text: "Super contribution deadline", date: "2025-06-30", type: "deadline" },
  ],
  actionItems: [
    { id: 1, text: "Review super contribution strategy", priority: "high", dueDate: "2025-01-15" },
    { id: 2, text: "Sign updated SOA", priority: "medium", dueDate: "2025-01-20" },
  ],
  messages: [
    { id: 1, from: "David Chen", date: "2024-12-20", preview: "Happy holidays! Just a reminder about your upcoming review...", read: true },
    { id: 2, from: "David Chen", date: "2024-11-15", preview: "Your updated SOA is ready for review...", read: true },
  ],
  performanceData: [
    { period: "Jul", value: 1820000 },
    { period: "Aug", value: 1860000 },
    { period: "Sep", value: 1840000 },
    { period: "Oct", value: 1910000 },
    { period: "Nov", value: 1950000 },
    { period: "Dec", value: 1978000 },
  ]
};

const COLORS = ['#1a2744', '#10B981', '#3B82F6', '#D4A84C'];

// Login Component
const ClientLogin = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    adviserCode: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/client/login" : "/api/client/register";
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password, 
            name: formData.name,
            adviser_code: formData.adviserCode || null
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Authentication failed");
      }

      const data = await response.json();
      sessionStorage.setItem("client_token", data.token);
      // Only store non-sensitive client data (name, id - not token)
      sessionStorage.setItem("client_session", JSON.stringify({ client_id: data.client_id, name: data.name, email: data.email }));
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      onLogin(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Demo login for testing
  const handleDemoLogin = () => {
    const demoData = {
      client_id: "demo_client",
      email: "demo@wheeler.com.au",
      name: "James Wheeler",
      token: "demo_token",
      adviser_name: "David Chen"
    };
    sessionStorage.setItem("client_token", demoData.token);
    sessionStorage.setItem("client_session", JSON.stringify({ client_id: demoData.client_id, name: demoData.name, email: demoData.email }));
    toast.success("Demo login successful!");
    onLogin(demoData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a2744] flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <CardDescription>
            {isLogin ? "Sign in to access your financial dashboard" : "Create your client account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="James Wheeler"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                  data-testid="client-name-input"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="james@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="client-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="client-password-input"
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="adviserCode">Adviser Code (optional)</Label>
                <Input
                  id="adviserCode"
                  type="text"
                  placeholder="Enter your adviser's code"
                  value={formData.adviserCode}
                  onChange={(e) => setFormData({ ...formData, adviserCode: e.target.value })}
                  data-testid="adviser-code-input"
                />
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-[#1a2744] hover:bg-[#1a5c45]"
              disabled={loading}
              data-testid="client-login-btn"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Please wait...</>
              ) : (
                <><Lock className="h-4 w-4 mr-2" /> {isLogin ? "Sign In" : "Create Account"}</>
              )}
            </Button>
          </form>

          <div className="mt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleDemoLogin}
              data-testid="demo-login-btn"
            >
              <User className="h-4 w-4 mr-2" /> Try Demo Account
            </Button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-[#1a2744] hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
            <p>Secure client access powered by Wheeler Financial</p>
            <p className="mt-1">AFSL Compliant • Your data is protected</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Client Portal (Read-Only Dashboard)
const ClientDashboard = ({ clientAuth, onLogout }) => {
  const navigate = useNavigate();
  const [client] = useState(MOCK_CLIENT_DATA);
  const [activeTab, setActiveTab] = useState("summary");
  
  const greeting = getGreeting();
  const today = new Date();

  const allocationData = [
    { name: 'Cash', value: client.portfolio.cash, percent: ((client.portfolio.cash / client.totalAssets) * 100).toFixed(1) },
    { name: 'Shares', value: client.portfolio.shares, percent: ((client.portfolio.shares / client.totalAssets) * 100).toFixed(1) },
    { name: 'Property', value: client.portfolio.property, percent: ((client.portfolio.property / client.totalAssets) * 100).toFixed(1) },
    { name: 'Super', value: client.portfolio.super, percent: ((client.portfolio.super / client.totalAssets) * 100).toFixed(1) },
  ];

  const daysUntilReview = Math.ceil((new Date(client.nextReview) - today) / (1000 * 60 * 60 * 24));

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/client/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    sessionStorage.removeItem("client_token");
    sessionStorage.removeItem("client_session");
    onLogout();
  };

  const exitPortal = () => {
    localStorage.setItem("app_mode", "personal");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Responsive */}
      <header className="bg-[#1a2744] text-white p-3 sm:p-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm sm:text-base">{clientAuth?.name || client.name}</h1>
              <p className="text-xs sm:text-sm text-white/70 hidden sm:block">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <Badge className="bg-white/20 gap-1 text-xs hidden sm:flex">
              <Shield className="h-3 w-3" /> Secure
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3" 
              onClick={handleLogout}
              data-testid="client-logout-btn"
            >
              <LogOut className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Logout</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3" 
              onClick={exitPortal}
              data-testid="exit-portal-btn"
            >
              <span className="hidden sm:inline">Exit Portal</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6" data-testid="client-portal-dashboard">
        {/* Greeting - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <greeting.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#D4A84C]" />
              {greeting.text}, {(clientAuth?.name || client.primaryContact).split(' ')[0]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {daysUntilReview <= 30 && (
              <Badge className="bg-amber-100 text-amber-800 gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                Review in {daysUntilReview} days
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">Read-Only</Badge>
          </div>
        </div>

        {/* Action Items Alert */}
        {client.actionItems.length > 0 && (
          <Card className="border-l-4 border-l-amber-500 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-800">You have {client.actionItems.length} action items</p>
                  <p className="text-sm text-amber-700">{client.actionItems[0].text}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics - Read Only */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Net Worth</p>
              <p className="text-2xl font-bold text-[#1a2744]">{formatCurrency(client.netWorth)}</p>
              <div className={`flex items-center gap-1 text-xs mt-1 ${client.netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {client.netWorthChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {client.netWorthChange >= 0 ? '+' : ''}{client.netWorthChange}% this month
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(client.totalAssets)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Debt</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(client.totalDebt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Risk Profile</p>
              <p className="text-xl font-bold">{client.riskProfile}</p>
              <Badge variant="outline" className="mt-1 text-xs">Balanced allocation</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border grid grid-cols-3 sm:grid-cols-6 w-full">
            <TabsTrigger value="summary" data-testid="tab-summary">
              <Home className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Summary</span>
            </TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">
              <FileText className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="goals" data-testid="tab-goals">
              <Target className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="esign" data-testid="tab-esign">
              <FileSignature className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">E-Sign</span>
            </TabsTrigger>
            <TabsTrigger value="onboarding" data-testid="tab-onboarding">
              <ClipboardList className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Onboarding</span>
            </TabsTrigger>
            <TabsTrigger value="contact" data-testid="tab-contact">
              <User className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Adviser</span>
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Allocation */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-[#D4A84C]" />
                    Portfolio Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <ChartContainer height={150} className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartPie>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            dataKey="value"
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </RechartPie>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="space-y-2">
                      {allocationData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">{item.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Net Worth Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-[#D4A84C]" />
                    Net Worth Trend (6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={150}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={client.performanceData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Area type="monotone" dataKey="value" stroke="#1a2744" strokeWidth={2} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#D4A84C]" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {client.upcomingActions.map(action => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {action.type === 'meeting' ? (
                          <Calendar className="h-5 w-5 text-[#1a2744]" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{action.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(action.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#D4A84C]" />
                  Your Reports & Documents
                </CardTitle>
                <CardDescription>Download your financial documents and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {client.reports.map(report => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded flex items-center justify-center ${
                          report.type === 'SOA' ? 'bg-[#1a2744]/10' :
                          report.type === 'Tax' ? 'bg-amber-100' :
                          'bg-blue-100'
                        }`}>
                          <FileText className={`h-5 w-5 ${
                            report.type === 'SOA' ? 'text-[#1a2744]' :
                            report.type === 'Tax' ? 'text-amber-600' :
                            'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{report.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{new Date(report.date).toLocaleDateString('en-AU')}</span>
                            <span>•</span>
                            <span>{report.type}</span>
                            {report.status === 'current' && (
                              <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Print Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Need a portfolio summary?</p>
                    <p className="text-sm text-muted-foreground">Generate a one-page summary of your current position</p>
                  </div>
                  <Button variant="outline">
                    <Printer className="h-4 w-4 mr-2" /> Print Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#D4A84C]" />
                  Your Financial Goals
                </CardTitle>
                <CardDescription>Track your progress towards your objectives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {client.goals.map(goal => {
                  const progress = (goal.current / goal.target) * 100;
                  const remaining = goal.target - goal.current;
                  return (
                    <div key={goal.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">Target by {goal.deadline}</p>
                        </div>
                        <Badge className={
                          progress >= 75 ? 'bg-green-100 text-green-800' :
                          progress >= 50 ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }>
                          {progress.toFixed(0)}% complete
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-3 mb-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Achieved: {formatCurrency(goal.current)}</span>
                        <span className="text-muted-foreground">Remaining: {formatCurrency(remaining)}</span>
                        <span className="font-medium">Target: {formatCurrency(goal.target)}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Want to update your goals?</p>
                    <p className="text-sm text-muted-foreground">
                      Contact your adviser to discuss changes to your financial goals or add new objectives.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Financial Adviser</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[#1a2744] text-white flex items-center justify-center text-2xl font-bold">
                      {client.adviser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{client.adviser.name}</h3>
                      <p className="text-muted-foreground">{client.adviser.title}</p>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <a href={`tel:${client.adviser.phone}`} className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <Phone className="h-5 w-5 text-[#1a2744]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{client.adviser.phone}</p>
                      </div>
                    </a>
                    <a href={`mailto:${client.adviser.email}`} className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <Mail className="h-5 w-5 text-[#1a2744]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{client.adviser.email}</p>
                      </div>
                    </a>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-4">Recent Messages</h4>
                  <div className="space-y-3">
                    {client.messages.map(msg => (
                      <div key={msg.id} className="p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{msg.from}</p>
                          <p className="text-xs text-muted-foreground">{new Date(msg.date).toLocaleDateString('en-AU')}</p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{msg.preview}</p>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4 bg-[#1a2744]">
                    <MessageCircle className="h-4 w-4 mr-2" /> Send Message to Adviser
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Review Info */}
            <Card className="border-l-4 border-l-[#D4A84C]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Your Next Review</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(client.nextReview).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" /> Request Reschedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* E-Signature Tab */}
          <TabsContent value="esign" className="space-y-6">
            <DocuSignIntegration 
              onSignatureComplete={(request) => {
                toast.success(`Document signed: ${request.document_name}`);
              }}
            />
          </TabsContent>

          {/* Digital Onboarding Tab */}
          <TabsContent value="onboarding" className="space-y-6">
            <DigitalOnboarding 
              clientId={clientAuth?.id || "client_wheeler"}
              onComplete={(data) => {
                toast.success("Fact-find completed successfully!");
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-6 border-t mt-8">
          <p>Need help? Contact your adviser directly or call our support line.</p>
          <p className="mt-1">© 2025 Wheeler Financial. All rights reserved. | AFSL Compliant</p>
        </div>
      </main>
    </div>
  );
};

// Main Component with Auth Wrapper
const ClientPortalMerged = () => {
  const [clientAuth, setClientAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const token = sessionStorage.getItem("client_token");
      const storedSession = sessionStorage.getItem("client_session");
      
      if (token && storedSession) {
        try {
          // Verify token with backend
          const response = await fetch(`${API_URL}/api/client/me`, {
            headers: {
              "Authorization": `Bearer ${token}`
            },
            credentials: "include"
          });

          if (response.ok) {
            const data = await response.json();
            setClientAuth(data);
          } else {
            // Token invalid, use stored data for demo
            const sessionData = JSON.parse(storedSession);
            if (token === "demo_token") {
              setClientAuth({ ...sessionData, token: "demo_token" });
            } else {
              // Clear invalid session
              sessionStorage.removeItem("client_token");
              sessionStorage.removeItem("client_session");
            }
          }
        } catch (error) {
          // Network error, use stored data for demo
          const data = JSON.parse(storedData);
          if (data.token === "demo_token") {
            setClientAuth(data);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1a2744]" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!clientAuth) {
    return <ClientLogin onLogin={setClientAuth} />;
  }

  return <ClientDashboard clientAuth={clientAuth} onLogout={() => setClientAuth(null)} />;
};

export default ClientPortalMerged;
