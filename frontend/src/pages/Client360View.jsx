import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Target,
  ListTodo,
  FolderOpen,
  Eye,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Star,
  Bell,
  Zap,
  Building2,
  Home,
  PiggyBank,
  Shield,
  BarChart3,
  Activity,
  Send,
  Video,
  MapPin,
  Globe,
  CreditCard,
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  RefreshCw,
  History,
  UserCircle,
  Heart,
  Cake,
  GraduationCap,
  Car,
  Plane,
  Gift,
  Calculator
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Comprehensive demo client data
const DEMO_CLIENT_DATA = {
  "client_1": {
    id: "client_1",
    name: "James & Sarah Wheeler",
    email: "james.wheeler@email.com",
    phone: "0412 345 678",
    mobile: "0412 345 678",
    address: "42 Harbour View Drive, Mosman NSW 2088",
    status: "active",
    type: "household",
    clientSince: "2019-03-15",
    dateOfBirth: "1968-07-22",
    age: 56,
    occupation: "Business Owner - Wheeler Consulting",
    employer: "Self-employed",
    riskProfile: "Growth",
    investmentExperience: "Experienced",
    advisor: "Mark Thompson",
    reviewFrequency: "Annual",
    lastReview: "2025-06-15",
    nextReview: "2026-01-15",
    satisfaction: 95,
    nps: 9,
    
    // Wealth Summary
    wealth: {
      total: 2850000,
      change: 125000,
      changePercent: 4.6,
      assetAllocation: {
        equities: 45,
        property: 42,
        fixedIncome: 8,
        cash: 5
      }
    },
    
    // Accounts
    accounts: [
      { id: 1, name: "James Wheeler Super", type: "Superannuation", institution: "AustralianSuper", balance: 520000, change: 28000, changePercent: 5.7, icon: PiggyBank },
      { id: 2, name: "Sarah Wheeler Super", type: "Superannuation", institution: "REST Super", balance: 370000, change: 18500, changePercent: 5.3, icon: PiggyBank },
      { id: 3, name: "Joint Investment Portfolio", type: "Investment", institution: "Macquarie", balance: 650000, change: 42000, changePercent: 6.9, icon: TrendingUp },
      { id: 4, name: "Investment Property - Parramatta", type: "Property", institution: "Direct", balance: 850000, change: 25000, changePercent: 3.0, icon: Home },
      { id: 5, name: "Family Home - Mosman", type: "Property", institution: "Direct", balance: 2200000, change: 110000, changePercent: 5.3, icon: Home },
      { id: 6, name: "Mortgage - Family Home", type: "Liability", institution: "CBA", balance: -850000, change: 12000, changePercent: 1.4, icon: Building2 },
      { id: 7, name: "Emergency Fund", type: "Cash", institution: "ING", balance: 85000, change: 2500, changePercent: 3.0, icon: DollarSign },
      { id: 8, name: "Offset Account", type: "Cash", institution: "CBA", balance: 25000, change: 5000, changePercent: 25.0, icon: DollarSign },
    ],
    
    // Recent Transactions
    transactions: [
      { id: 1, date: "2025-12-14", description: "Dividend - BHP Group", amount: 1250, type: "income", account: "Joint Investment Portfolio" },
      { id: 2, date: "2025-12-12", description: "Buy - Vanguard ETF (VAS)", amount: -15000, type: "investment", account: "Joint Investment Portfolio" },
      { id: 3, date: "2025-12-10", description: "Salary Sacrifice Contribution", amount: 2500, type: "contribution", account: "James Wheeler Super" },
      { id: 4, date: "2025-12-08", description: "Rental Income - Parramatta", amount: 2800, type: "income", account: "Emergency Fund" },
      { id: 5, date: "2025-12-05", description: "Mortgage Payment", amount: -3200, type: "expense", account: "Offset Account" },
      { id: 6, date: "2025-12-01", description: "Interest Earned", amount: 385, type: "income", account: "Emergency Fund" },
      { id: 7, date: "2025-11-28", description: "Sell - Telstra (TLS)", amount: 8500, type: "investment", account: "Joint Investment Portfolio" },
      { id: 8, date: "2025-11-25", description: "Insurance Premium - Life", amount: -450, type: "expense", account: "James Wheeler Super" },
    ],
    
    // Tasks
    tasks: [
      { id: 1, title: "Insurance Review - Life & TPD", priority: "high", dueDate: "2025-12-28", status: "pending", type: "review" },
      { id: 2, title: "Annual SOA Update", priority: "medium", dueDate: "2026-01-15", status: "pending", type: "document" },
      { id: 3, title: "Tax Planning Discussion", priority: "medium", dueDate: "2026-02-01", status: "pending", type: "planning" },
      { id: 4, title: "Super Contribution Strategy", priority: "low", dueDate: "2026-03-15", status: "pending", type: "planning" },
    ],
    
    // Documents
    documents: [
      { id: 1, name: "Statement of Advice 2025", type: "SOA", date: "2025-06-15", status: "signed" },
      { id: 2, name: "Risk Profile Assessment", type: "Assessment", date: "2025-06-10", status: "signed" },
      { id: 3, name: "Insurance Schedule", type: "Insurance", date: "2025-06-15", status: "current" },
      { id: 4, name: "Investment Policy Statement", type: "IPS", date: "2025-06-15", status: "current" },
      { id: 5, name: "Fee Disclosure Statement", type: "FDS", date: "2025-06-15", status: "current" },
      { id: 6, name: "Annual Review Meeting Notes", type: "Notes", date: "2025-06-15", status: "completed" },
    ],
    
    // Communication Timeline
    communications: [
      { id: 1, date: "2025-12-15", type: "call", direction: "outbound", summary: "Discussed portfolio performance and upcoming insurance review", duration: "25 min", by: "Mark Thompson" },
      { id: 2, date: "2025-12-10", type: "email", direction: "outbound", summary: "Sent monthly portfolio update and market commentary", by: "System" },
      { id: 3, date: "2025-12-05", type: "email", direction: "inbound", summary: "Question about super contribution limits", by: "James Wheeler" },
      { id: 4, date: "2025-11-28", type: "meeting", direction: "in-person", summary: "Quarterly review meeting - discussed rebalancing strategy", duration: "1 hr", by: "Mark Thompson" },
      { id: 5, date: "2025-11-15", type: "call", direction: "inbound", summary: "Sarah called about adding to offset account", duration: "10 min", by: "Sarah Wheeler" },
      { id: 6, date: "2025-10-20", type: "email", direction: "outbound", summary: "Tax year-end planning recommendations", by: "Mark Thompson" },
    ],
    
    // Goals
    goals: [
      { id: 1, name: "Retirement at 62", target: 3500000, current: 2850000, progress: 81, targetDate: "2030-07-22", icon: Target },
      { id: 2, name: "Pay off mortgage", target: 850000, current: 110000, progress: 13, targetDate: "2035-01-01", icon: Home },
      { id: 3, name: "Kids' education fund", target: 200000, current: 85000, progress: 43, targetDate: "2028-01-01", icon: GraduationCap },
      { id: 4, name: "European holiday", target: 25000, current: 15000, progress: 60, targetDate: "2026-06-01", icon: Plane },
    ],
    
    // Family Members
    family: [
      { name: "James Wheeler", relationship: "Primary", dob: "1968-07-22", age: 56 },
      { name: "Sarah Wheeler", relationship: "Spouse", dob: "1970-03-15", age: 54 },
      { name: "Emily Wheeler", relationship: "Daughter", dob: "2000-05-10", age: 24 },
      { name: "Tom Wheeler", relationship: "Son", dob: "2003-11-22", age: 21 },
    ],
    
    // Insurance
    insurance: [
      { type: "Life", provider: "TAL", sumInsured: 1500000, premium: 1800, premiumFreq: "annual", status: "active" },
      { type: "TPD", provider: "TAL", sumInsured: 1000000, premium: 1200, premiumFreq: "annual", status: "active" },
      { type: "Income Protection", provider: "OnePath", sumInsured: 15000, premium: 2400, premiumFreq: "annual", status: "active" },
      { type: "Trauma", provider: "TAL", sumInsured: 500000, premium: 950, premiumFreq: "annual", status: "review needed" },
    ],
    
    // Key Dates
    keyDates: [
      { date: "2026-01-15", event: "Annual Review Due", type: "review" },
      { date: "2026-07-22", event: "James turns 58", type: "birthday" },
      { date: "2026-03-15", event: "Sarah turns 56", type: "birthday" },
      { date: "2026-06-30", event: "Tax Year End", type: "tax" },
      { date: "2025-12-25", event: "Wedding Anniversary", type: "personal" },
    ]
  }
};

// Default to client_1 if no client selected
const getClientData = (clientId) => {
  return DEMO_CLIENT_DATA[clientId] || DEMO_CLIENT_DATA["client_1"];
};

const Client360View = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get client from localStorage or URL params
  const storedClient = localStorage.getItem("selected_client");
  const clientId = searchParams.get("id") || (storedClient ? JSON.parse(storedClient).id : "client_1");
  const client = getClientData(clientId);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'income': return 'text-emerald-600';
      case 'contribution': return 'text-blue-600';
      case 'investment': return 'text-purple-600';
      case 'expense': return 'text-red-600';
      default: return 'text-foreground';
    }
  };

  const getCommIcon = (type) => {
    switch (type) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'meeting': return Users;
      case 'video': return Video;
      default: return MessageSquare;
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-360-view">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/crm-command-center")}
            data-testid="back-to-crm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CRM
          </Button>
        </div>

        {/* Client Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-[#1a2744] to-[#2a3f5f] p-6 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white/20">
                  <AvatarFallback className="bg-[#D4A84C] text-[#1a2744] text-2xl font-bold">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">{client.name}</h1>
                    <Badge className="bg-emerald-500 text-white">{client.status}</Badge>
                    {client.satisfaction >= 90 && (
                      <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-white/70">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" /> {client.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" /> {client.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {client.address.split(',')[1]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                    <span>Client since {formatDate(client.clientSince)}</span>
                    <span>•</span>
                    <span>Advisor: {client.advisor}</span>
                    <span>•</span>
                    <span>Risk Profile: {client.riskProfile}</span>
                  </div>
                </div>
              </div>

              {/* Wealth Summary */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-white/60 text-sm">Total Wealth</p>
                  <p className="text-3xl font-bold">{formatCurrency(client.wealth.total)}</p>
                  <p className={`text-sm flex items-center justify-end gap-1 ${
                    client.wealth.changePercent >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {client.wealth.changePercent >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {client.wealth.changePercent >= 0 ? "+" : ""}{formatCurrency(client.wealth.change)} ({client.wealth.changePercent}%)
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" className="bg-white text-[#1a2744] hover:bg-white/90">
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                    <Mail className="h-4 w-4 mr-2" /> Email
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-[#D4A84C]/50 text-[#D4A84C] hover:bg-[#D4A84C]/10"
                    onClick={() => {
                      localStorage.setItem("selected_client", JSON.stringify(client));
                      navigate(`/transaction-modeler?client=${client.id}`);
                    }}
                    data-testid="transaction-modeler-btn"
                  >
                    <Calculator className="h-4 w-4 mr-2" /> Model Transaction
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 bg-muted/30">
            <div className="text-center">
              <p className="text-2xl font-bold">{client.accounts.length}</p>
              <p className="text-xs text-muted-foreground">Accounts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{client.tasks.filter(t => t.status === 'pending').length}</p>
              <p className="text-xs text-muted-foreground">Open Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{client.documents.length}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{client.satisfaction}%</p>
              <p className="text-xs text-muted-foreground">Satisfaction</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{client.nps}</p>
              <p className="text-xs text-muted-foreground">NPS Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatDate(client.nextReview)}</p>
              <p className="text-xs text-muted-foreground">Next Review</p>
            </div>
          </div>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="communications">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Goals */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-[#D4A84C]" />
                    Financial Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client.goals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <goal.icon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{goal.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                        </span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{goal.progress}% complete</span>
                        <span>Target: {formatDate(goal.targetDate)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Family Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#D4A84C]" />
                    Family
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.family.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#1a2744]/10 text-[#1a2744] text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.relationship}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">Age {member.age}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Asset Allocation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                    Asset Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(client.wealth.assetAllocation).map(([asset, percent]) => (
                    <div key={asset} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{asset.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-medium">{percent}%</span>
                      </div>
                      <Progress value={percent} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Insurance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#D4A84C]" />
                    Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.insurance.map((ins, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{ins.type}</p>
                        <p className="text-xs text-muted-foreground">{ins.provider}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(ins.sumInsured)}</p>
                        <Badge className={ins.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                          {ins.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Key Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#D4A84C]" />
                    Key Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.keyDates.slice(0, 5).map((kd, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`w-2 h-2 rounded-full ${
                        kd.type === 'review' ? 'bg-amber-500' :
                        kd.type === 'birthday' ? 'bg-pink-500' :
                        kd.type === 'tax' ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{kd.event}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(kd.date)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.accounts.map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`account-${account.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          account.type === 'Liability' ? 'bg-red-100' : 'bg-[#1a2744]/10'
                        }`}>
                          <account.icon className={`h-5 w-5 ${account.type === 'Liability' ? 'text-red-600' : 'text-[#1a2744]'}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{account.name}</h4>
                          <p className="text-sm text-muted-foreground">{account.institution} • {account.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${account.balance < 0 ? 'text-red-600' : ''}`}>
                          {formatCurrency(Math.abs(account.balance))}
                        </p>
                        <p className={`text-sm flex items-center justify-end gap-1 ${
                          account.changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {account.changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {account.changePercent >= 0 ? '+' : ''}{account.changePercent}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50" data-testid={`txn-${txn.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground w-20">
                          {formatDate(txn.date)}
                        </div>
                        <div>
                          <p className="font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{txn.account}</p>
                        </div>
                      </div>
                      <span className={`font-medium ${getTransactionColor(txn.type)}`}>
                        {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tasks & Actions</CardTitle>
                  <Button size="sm" className="bg-[#1a2744]">
                    <Plus className="h-4 w-4 mr-2" /> Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {client.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border" data-testid={`task-${task.id}`}>
                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">Due: {formatDate(task.dueDate)}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Complete
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Documents</CardTitle>
                  <Button size="sm" className="bg-[#1a2744]">
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50" data-testid={`doc-${doc.id}`}>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type} • {formatDate(doc.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          doc.status === 'signed' ? 'text-emerald-600 border-emerald-300' :
                          doc.status === 'current' ? 'text-blue-600 border-blue-300' : ''
                        }>{doc.status}</Badge>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communications Timeline Tab */}
          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Communication Timeline</CardTitle>
                  <Button size="sm" className="bg-[#1a2744]">
                    <Plus className="h-4 w-4 mr-2" /> Log Activity
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                  <div className="space-y-6">
                    {client.communications.map((comm) => {
                      const CommIcon = getCommIcon(comm.type);
                      return (
                        <div key={comm.id} className="relative pl-10" data-testid={`comm-${comm.id}`}>
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-[#1a2744] flex items-center justify-center">
                            <CommIcon className="h-4 w-4 text-[#1a2744]" />
                          </div>
                          <div className="p-4 rounded-lg border bg-card">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="capitalize">{comm.type}</Badge>
                                  <Badge variant="secondary" className="capitalize">{comm.direction}</Badge>
                                  {comm.duration && (
                                    <span className="text-xs text-muted-foreground">{comm.duration}</span>
                                  )}
                                </div>
                                <p className="mt-2">{comm.summary}</p>
                                <p className="text-xs text-muted-foreground mt-2">By: {comm.by}</p>
                              </div>
                              <span className="text-sm text-muted-foreground">{formatDate(comm.date)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Client360View;
