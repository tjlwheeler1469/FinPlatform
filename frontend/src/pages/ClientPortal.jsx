import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  DollarSign,
  Building2,
  PieChart,
  CheckCircle,
  Clock,
  Download,
  MessageCircle,
  Phone,
  Mail,
  ArrowRight,
  Shield,
  Target,
  Lightbulb,
  Sun,
  Moon,
  Bell,
  Home,
  LineChart,
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import ChartContainer from "@/components/ChartContainer";
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

// Sample client data (would come from context/API in real app)
const CLIENT_DATA = {
  id: 1,
  name: "Wheeler Family",
  primaryContact: "James Wheeler",
  email: "james.wheeler@email.com",
  adviser: {
    name: "David Chen",
    title: "Senior Financial Adviser",
    phone: "0423 456 789",
    email: "david.chen@adviser.com.au",
    photo: null
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
  actionItems: [
    { id: 1, text: "Review super contribution strategy", priority: "high", dueDate: "2025-01-15" },
    { id: 2, text: "Sign updated SOA", priority: "medium", dueDate: "2025-01-20" },
  ],
  documents: [
    { id: 1, name: "Statement of Advice 2024", date: "2024-11-15", type: "SOA" },
    { id: 2, name: "Annual Review Report", date: "2024-11-15", type: "Report" },
    { id: 3, name: "Tax Planning Summary", date: "2024-10-01", type: "Tax" },
  ],
  messages: [
    { id: 1, from: "David Chen", date: "2024-12-20", preview: "Happy holidays! Just a reminder about your upcoming review..." },
    { id: 2, from: "David Chen", date: "2024-11-15", preview: "Your updated SOA is ready for review..." },
  ]
};

const COLORS = ['#0F392B', '#10B981', '#3B82F6', '#D4AF37'];

const ClientPortal = () => {
  const navigate = useNavigate();
  const [client, setClient] = useState(CLIENT_DATA);
  const [activeTab, setActiveTab] = useState("overview");
  
  const greeting = getGreeting();
  const today = new Date();

  // Portfolio allocation data
  const allocationData = [
    { name: 'Cash', value: client.portfolio.cash },
    { name: 'Shares', value: client.portfolio.shares },
    { name: 'Property', value: client.portfolio.property },
    { name: 'Super', value: client.portfolio.super },
  ];

  // Performance data (simulated)
  const performanceData = [
    { month: 'Jul', value: client.netWorth * 0.94 },
    { month: 'Aug', value: client.netWorth * 0.95 },
    { month: 'Sep', value: client.netWorth * 0.93 },
    { month: 'Oct', value: client.netWorth * 0.97 },
    { month: 'Nov', value: client.netWorth * 0.99 },
    { month: 'Dec', value: client.netWorth },
  ];

  const daysUntilReview = Math.ceil((new Date(client.nextReview) - today) / (1000 * 60 * 60 * 24));

  const exitPortal = () => {
    localStorage.removeItem("active_client_id");
    navigate("/adviser-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header */}
      <header className="bg-[#0F392B] text-white p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold">{client.name}</h1>
              <p className="text-sm text-white/70">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-white/20">
              <Shield className="h-3 w-3 mr-1" />
              Secure
            </Badge>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={exitPortal}>
              <LogOut className="h-4 w-4 mr-2" /> Exit Portal
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6" data-testid="client-portal-page">
        {/* Greeting Banner */}
        <Card className="bg-gradient-to-r from-[#0F392B] to-[#1a5c45] text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <greeting.icon className="h-6 w-6 text-[#D4AF37]" />
                  <h2 className="text-2xl font-bold">{greeting.text}, {client.primaryContact.split(' ')[0]}</h2>
                </div>
                <p className="text-white/80">
                  {today.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-sm">Your Net Worth</p>
                <p className="text-3xl font-bold">{formatCurrency(client.netWorth)}</p>
                <div className={`flex items-center justify-end gap-1 text-sm ${client.netWorthChange >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {client.netWorthChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {client.netWorthChange >= 0 ? '+' : ''}{client.netWorthChange}% this month
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Items Alert */}
        {client.actionItems.length > 0 && (
          <Card className="border-l-4 border-l-amber-500 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-800">You have {client.actionItems.length} action items</p>
                    <p className="text-sm text-amber-700">{client.actionItems[0].text}</p>
                  </div>
                </div>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border">
            <TabsTrigger value="overview">
              <Home className="h-4 w-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="h-4 w-4 mr-1" /> Goals
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-1" /> Documents
            </TabsTrigger>
            <TabsTrigger value="adviser">
              <User className="h-4 w-4 mr-1" /> My Adviser
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Portfolio Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-[#D4AF37]" />
                    Your Portfolio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Total Assets</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(client.totalAssets)}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Total Debt</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(client.totalDebt)}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg col-span-2">
                        <p className="text-xs text-muted-foreground">Net Worth</p>
                        <p className="text-2xl font-bold text-[#0F392B]">{formatCurrency(client.netWorth)}</p>
                      </div>
                    </div>
                    <div>
                      <ChartContainer height={150}>
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartPie>
                            <Pie
                              data={allocationData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              dataKey="value"
                              label={({ name }) => name}
                            >
                              {allocationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                          </RechartPie>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-[#D4AF37]" />
                    Quick Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Risk Profile</p>
                    <p className="font-bold text-[#0F392B]">{client.riskProfile}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Last Review</p>
                    <p className="font-medium">{new Date(client.lastReview).toLocaleDateString('en-AU')}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${daysUntilReview <= 30 ? 'bg-amber-50 border border-amber-200' : 'bg-muted/50'}`}>
                    <p className="text-xs text-muted-foreground">Next Review</p>
                    <p className="font-bold">{new Date(client.nextReview).toLocaleDateString('en-AU')}</p>
                    <p className={`text-xs mt-1 ${daysUntilReview <= 30 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {daysUntilReview} days away
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-[#D4AF37]" />
                  Performance (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={200}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F392B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0F392B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Area type="monotone" dataKey="value" stroke="#0F392B" strokeWidth={2} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#D4AF37]" />
                  Your Financial Goals
                </CardTitle>
                <CardDescription>Track your progress towards your financial objectives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {client.goals.map(goal => {
                  const progress = (goal.current / goal.target) * 100;
                  return (
                    <div key={goal.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">Target: {goal.deadline}</p>
                        </div>
                        <Badge variant={progress >= 75 ? "default" : progress >= 50 ? "secondary" : "outline"}>
                          {progress.toFixed(0)}%
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-3 mb-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current: {formatCurrency(goal.current)}</span>
                        <span className="font-medium">Target: {formatCurrency(goal.target)}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#D4AF37]" />
                  Your Documents
                </CardTitle>
                <CardDescription>Access your financial documents and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {client.documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-[#0F392B]/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#0F392B]" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(doc.date).toLocaleDateString('en-AU')} • {doc.type}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adviser Tab */}
          <TabsContent value="adviser" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Financial Adviser</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-[#0F392B] text-white flex items-center justify-center text-2xl font-bold">
                      {client.adviser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{client.adviser.name}</h3>
                      <p className="text-muted-foreground">{client.adviser.title}</p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Phone className="h-5 w-5 text-[#0F392B]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{client.adviser.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Mail className="h-5 w-5 text-[#0F392B]" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{client.adviser.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-4">Recent Messages</h4>
                  <div className="space-y-3">
                    {client.messages.map(msg => (
                      <div key={msg.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{msg.from}</p>
                          <p className="text-xs text-muted-foreground">{new Date(msg.date).toLocaleDateString('en-AU')}</p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{msg.preview}</p>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4 bg-[#0F392B]">
                    <MessageCircle className="h-4 w-4 mr-2" /> Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-6 border-t">
          <p>Need help? Contact your adviser or call our support line.</p>
          <p className="mt-1">© 2025 Wheeler Family Portfolio. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

export default ClientPortal;
