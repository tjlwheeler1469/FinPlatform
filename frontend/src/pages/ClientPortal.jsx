import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  DollarSign,
  FileText,
  Home,
  LineChart,
  Lock,
  LogOut,
  Mail,
  MessageSquare,
  PieChart,
  Send,
  Target,
  TrendingUp,
  User,
  Wallet,
  Eye,
  EyeOff,
  Shield
} from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Client Portal Login Component
const ClientLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/client-portal/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("client_portal_token", data.token);
        localStorage.setItem("client_portal_user", JSON.stringify(data.user));
        toast.success("Welcome back!");
        onLogin(data);
      } else {
        const error = await response.json();
        toast.error(error.detail || "Login failed");
      }
    } catch (error) {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a2744] to-[#2a3754] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#1a2744] to-[#2a3754] rounded-2xl flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-[#D4A84C]" />
          </div>
          <CardTitle className="text-2xl">Client Portal</CardTitle>
          <CardDescription>Access your wealth dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="client-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="client-password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#1a2744] hover:bg-[#2a3754]"
              disabled={loading}
              data-testid="client-login-btn"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <p className="font-mono text-xs">client_wheeler@email.com / wheeler2025</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Client Portal Dashboard
const ClientDashboard = ({ user, token, onLogout }) => {
  const [dashboard, setDashboard] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [goals, setGoals] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [dashRes, portfolioRes, goalsRes, docsRes, nwRes] = await Promise.all([
        fetch(`${API_URL}/api/client-portal/dashboard?token=${token}`),
        fetch(`${API_URL}/api/client-portal/portfolio?token=${token}`),
        fetch(`${API_URL}/api/client-portal/goals?token=${token}`),
        fetch(`${API_URL}/api/client-portal/documents?token=${token}`),
        fetch(`${API_URL}/api/client-portal/net-worth?token=${token}`)
      ]);
      
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (portfolioRes.ok) setPortfolio(await portfolioRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (docsRes.ok) setDocuments(await docsRes.json());
      if (nwRes.ok) setNetWorth(await nwRes.json());
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setSendingMessage(true);
    try {
      const response = await fetch(`${API_URL}/api/client-portal/messages/send?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: messageSubject, message: messageContent })
      });
      if (response.ok) {
        toast.success("Message sent to your adviser");
        setMessageSubject("");
        setMessageContent("");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[#1a2744] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1a2744] to-[#2a3754] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-[#D4A84C]" />
              </div>
              <div>
                <h1 className="font-bold">Wealth Command</h1>
                <p className="text-xs text-white/70">Client Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-white/70">{user.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-white hover:bg-white/10">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="contact">Contact Adviser</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Portfolio Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white">
                <CardContent className="pt-6">
                  <p className="text-white/70 text-sm">Portfolio Value</p>
                  <p className="text-3xl font-bold">{formatCurrency(dashboard?.portfolio_summary?.total_value || 0)}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${dashboard?.portfolio_summary?.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboard?.portfolio_summary?.change_24h >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    <span>{formatCurrency(Math.abs(dashboard?.portfolio_summary?.change_24h || 0))} today</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">YTD Return</p>
                  <p className="text-3xl font-bold text-green-600">+{dashboard?.portfolio_summary?.change_ytd_percent?.toFixed(2) || 0}%</p>
                  <p className="text-sm text-muted-foreground mt-2">{formatCurrency(dashboard?.portfolio_summary?.change_ytd || 0)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">Unread Messages</p>
                  <p className="text-3xl font-bold text-[#1a2744]">{dashboard?.unread_messages || 0}</p>
                  <Button variant="link" className="p-0 h-auto text-sm" onClick={() => setActiveTab("contact")}>
                    View messages <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Net Worth Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#D4A84C]" />
                  Net Worth Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Total Assets</p>
                    <p className="text-2xl font-bold text-green-700">{formatCurrency(netWorth?.summary?.total_assets || 0)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">Total Liabilities</p>
                    <p className="text-2xl font-bold text-red-700">{formatCurrency(netWorth?.summary?.total_liabilities || 0)}</p>
                  </div>
                  <div className="p-4 bg-[#1a2744] rounded-lg text-white">
                    <p className="text-sm text-white/70">Net Worth</p>
                    <p className="text-2xl font-bold">{formatCurrency(netWorth?.summary?.net_worth || 0)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Change (MTD)</p>
                    <p className="text-2xl font-bold text-green-600">+{formatCurrency(netWorth?.change_from_last_month?.amount || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#D4A84C]" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.upcoming_appointments?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.upcoming_appointments.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{apt.title}</p>
                          <p className="text-sm text-muted-foreground">{apt.date} at {apt.time}</p>
                        </div>
                        <Badge>{apt.type}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming appointments</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-[#D4A84C]" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio?.holdings?.map((holding, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ 
                          backgroundColor: ['#1a2744', '#D4A84C', '#4A90D9', '#50C878', '#9B59B6'][i % 5] 
                        }}></div>
                        <span>{holding.asset}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{formatCurrency(holding.value)}</span>
                        <Badge variant="outline">{holding.allocation}%</Badge>
                        <span className={holding.return_ytd >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {holding.return_ytd >= 0 ? '+' : ''}{holding.return_ytd}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-[#D4A84C]" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold">{formatCurrency(portfolio?.performance?.total_value || 0)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-sm text-green-600">YTD Return</p>
                    <p className="text-xl font-bold text-green-700">+{portfolio?.performance?.total_return_ytd_percent?.toFixed(2) || 0}%</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-600">Benchmark</p>
                    <p className="text-xl font-bold text-blue-700">{portfolio?.performance?.benchmark_return_ytd?.toFixed(2) || 0}%</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-sm text-purple-600">Outperformance</p>
                    <p className="text-xl font-bold text-purple-700">+{portfolio?.performance?.outperformance?.toFixed(2) || 0}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            {goals?.goals?.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-[#D4A84C]" />
                      {goal.name}
                    </CardTitle>
                    <Badge variant={goal.status === "on_track" ? "default" : "destructive"}>
                      {goal.status === "on_track" ? "On Track" : "Needs Attention"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={goal.progress} className="h-3" />
                    <div className="grid md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Current</p>
                        <p className="font-bold">{formatCurrency(goal.current_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Target</p>
                        <p className="font-bold">{formatCurrency(goal.target_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Contribution</p>
                        <p className="font-bold">{formatCurrency(goal.monthly_contribution)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Projected Outcome</p>
                        <p className="font-bold text-green-600">{formatCurrency(goal.projected_outcome)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#D4A84C]" />
                  Your Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {documents?.documents?.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-[#1a2744]" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.date} • {doc.size}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{doc.category}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Adviser Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#D4A84C]" />
                  Message Your Adviser
                </CardTitle>
                <CardDescription>Send a secure message to your financial adviser</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={sendMessage} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      value={messageSubject}
                      onChange={(e) => setMessageSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Type your message here..."
                      rows={6}
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={sendingMessage} className="bg-[#1a2744] hover:bg-[#2a3754]">
                    <Send className="h-4 w-4 mr-2" />
                    {sendingMessage ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Wealth Command. General information only - not financial advice.</p>
          <p className="mt-1">Consult a licensed financial adviser (AFSL) for personal advice.</p>
        </div>
      </footer>
    </div>
  );
};

// Main Client Portal Component
const ClientPortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for existing session
    const savedToken = localStorage.getItem("client_portal_token");
    const savedUser = localStorage.getItem("client_portal_user");
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (data) => {
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("client_portal_token");
    localStorage.removeItem("client_portal_user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  if (!isAuthenticated) {
    return <ClientLogin onLogin={handleLogin} />;
  }

  return <ClientDashboard user={user} token={token} onLogout={handleLogout} />;
};

export default ClientPortal;
