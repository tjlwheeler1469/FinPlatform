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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Calculator,
  LineChart,
  Bitcoin,
  Coins,
  BookOpen,
  ExternalLink,
  X,
  Landmark
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = API_URL;

// Performance timeframes
const PERFORMANCE_TIMEFRAMES = ["1M", "3M", "6M", "1Y", "2Y", "3Y", "5Y", "10Y"];

// Detailed asset holdings by category
const ASSET_HOLDINGS = {
  stocks: {
    label: "Stocks & ETFs",
    icon: TrendingUp,
    color: "#3B82F6",
    total: 425000,
    holdings: [
      { name: "BHP Group", symbol: "BHP", units: 1200, price: 45.50, value: 54600, change: 5.2, costBase: 48000 },
      { name: "Commonwealth Bank", symbol: "CBA", units: 400, price: 118.50, value: 47400, change: 8.1, costBase: 42000 },
      { name: "CSL Limited", symbol: "CSL", units: 150, price: 295.00, value: 44250, change: -2.3, costBase: 46000 },
      { name: "Vanguard Aus Shares (VAS)", symbol: "VAS", units: 1500, price: 95.50, value: 143250, change: 4.5, costBase: 135000 },
      { name: "iShares S&P 500 (IVV)", symbol: "IVV", units: 120, price: 580.00, value: 69600, change: 12.4, costBase: 58000 },
      { name: "Vanguard Intl (VGS)", symbol: "VGS", units: 450, price: 115.00, value: 51750, change: 9.8, costBase: 45000 },
      { name: "Magellan Global (MGE)", symbol: "MGE", units: 350, price: 42.00, value: 14700, change: -5.2, costBase: 16500 },
    ],
    research: [
      { title: "BHP Group - Mining Outlook 2026", date: "2025-12-10", source: "Macquarie Research", rating: "Outperform", target: 52.00 },
      { title: "Australian Banks Sector Update", date: "2025-12-05", source: "Morgan Stanley", rating: "Equal Weight", target: null },
      { title: "VAS ETF Analysis Q4 2025", date: "2025-11-28", source: "Morningstar", rating: "Gold", target: null },
    ]
  },
  bonds: {
    label: "Bonds & Fixed Income",
    icon: Landmark,
    color: "#F59E0B",
    total: 125000,
    holdings: [
      { name: "Aus Gov 10Y Bond", symbol: "ACGB-34", units: 50000, price: 1.02, value: 51000, yield: 4.2, maturity: "2034-03-15" },
      { name: "Corporate Bond Fund", symbol: "BOND", units: 30000, price: 1.05, value: 31500, yield: 5.1, maturity: "2028-06-30" },
      { name: "Hybrid Securities", symbol: "NABPF", units: 400, price: 98.50, value: 39400, yield: 6.8, maturity: "2027-12-15" },
      { name: "NSW Treasury Bond", symbol: "NSWTC", units: 3000, price: 1.03, value: 3090, yield: 4.5, maturity: "2030-11-20" },
    ],
    research: [
      { title: "Fixed Income Strategy 2026", date: "2025-12-08", source: "UBS", rating: "Overweight", target: null },
      { title: "Corporate Credit Outlook", date: "2025-11-15", source: "JP Morgan", rating: "Neutral", target: null },
    ]
  },
  cash: {
    label: "Cash & Term Deposits",
    icon: PiggyBank,
    color: "#10B981",
    total: 185000,
    holdings: [
      { name: "High Interest Savings", symbol: "ING", units: 1, price: 85000, value: 85000, rate: 5.0, maturity: null },
      { name: "Term Deposit 6M", symbol: "CBA-TD", units: 1, price: 50000, value: 50000, rate: 4.8, maturity: "2026-06-15" },
      { name: "Term Deposit 12M", symbol: "WBC-TD", units: 1, price: 25000, value: 25000, rate: 5.1, maturity: "2026-12-01" },
      { name: "Offset Account", symbol: "CBA-OFF", units: 1, price: 25000, value: 25000, rate: 0, maturity: null },
    ],
    research: [
      { title: "Term Deposit Rate Comparison", date: "2025-12-12", source: "RateCity", rating: "Best Value", target: null },
    ]
  },
  funds: {
    label: "Managed Funds",
    icon: Briefcase,
    color: "#8B5CF6",
    total: 175000,
    holdings: [
      { name: "Magellan Global Fund", symbol: "MGF", units: 3500, price: 32.80, value: 114800, change: -3.2, manager: "Magellan" },
      { name: "Platinum International Fund", symbol: "PIF", units: 2500, price: 24.50, value: 61250, change: 2.8, manager: "Platinum" },
    ],
    research: [
      { title: "Magellan Global Fund Review", date: "2025-12-01", source: "Morningstar", rating: "Silver", target: null },
      { title: "Platinum Intl Fund Analysis", date: "2025-11-20", source: "Lonsec", rating: "Recommended", target: null },
    ]
  },
  crypto: {
    label: "Cryptocurrency",
    icon: Bitcoin,
    color: "#F97316",
    total: 45000,
    holdings: [
      { name: "Bitcoin", symbol: "BTC", units: 0.42, price: 73500, value: 30870, change: 15.2, costBase: 22000 },
      { name: "Ethereum", symbol: "ETH", units: 3.8, price: 3720, value: 14136, change: 8.5, costBase: 10000 },
    ],
    research: [
      { title: "Bitcoin Institutional Outlook 2026", date: "2025-12-14", source: "Fidelity Digital", rating: "Positive", target: 100000 },
    ]
  },
  property: {
    label: "Property",
    icon: Home,
    color: "#EF4444",
    total: 3050000,
    holdings: [
      { name: "Family Home - Mosman", symbol: "PROP-1", units: 1, price: 2200000, value: 2200000, change: 5.3, debt: 850000, rental: 0 },
      { name: "Investment Unit - Parramatta", symbol: "PROP-2", units: 1, price: 850000, value: 850000, change: 3.0, debt: 0, rental: 2800 },
    ],
    research: [
      { title: "Sydney Property Market Update", date: "2025-12-10", source: "CoreLogic", rating: "Moderate Growth", target: null },
      { title: "Parramatta Growth Corridor", date: "2025-11-25", source: "Domain Research", rating: "High Potential", target: null },
    ]
  }
};

// Performance history data (mock)
const generatePerformanceData = (months) => {
  const data = [];
  let value = 2500000;
  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthlyReturn = (Math.random() - 0.3) * 0.05; // -1.5% to +3.5%
    value = value * (1 + monthlyReturn);
    data.push({
      date: date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
      value: Math.round(value),
      benchmark: Math.round(value * (0.95 + Math.random() * 0.1))
    });
  }
  return data;
};

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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="transactions">Activity</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="communications">Timeline</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
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

          {/* Holdings Tab - Detailed Asset Breakdown */}
          <TabsContent value="holdings" className="space-y-6">
            {/* Net Worth Breakdown by Asset Class */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                  Net Worth Breakdown by Asset Class
                </CardTitle>
                <CardDescription>Click on any asset category to view detailed holdings and research</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {Object.entries(ASSET_HOLDINGS).map(([key, category]) => {
                    const Icon = category.icon;
                    return (
                      <Dialog key={key}>
                        <DialogTrigger asChild>
                          <Card 
                            className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-[#D4A84C]"
                            data-testid={`asset-category-${key}`}
                          >
                            <CardContent className="p-4 text-center">
                              <div 
                                className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <Icon className="h-6 w-6" style={{ color: category.color }} />
                              </div>
                              <p className="font-semibold text-lg">{formatCurrency(category.total)}</p>
                              <p className="text-xs text-muted-foreground">{category.label}</p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {category.holdings.length} holdings
                              </Badge>
                            </CardContent>
                          </Card>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Icon className="h-5 w-5" style={{ color: category.color }} />
                              {category.label} - {formatCurrency(category.total)}
                            </DialogTitle>
                            <DialogDescription>
                              Detailed holdings and research reports
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="h-[60vh] pr-4">
                            {/* Holdings Table */}
                            <div className="space-y-4">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Wallet className="h-4 w-4" /> Holdings ({category.holdings.length})
                              </h4>
                              <div className="space-y-2">
                                {category.holdings.map((holding, idx) => (
                                  <Card key={idx} className="bg-muted/30">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">{holding.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {holding.symbol} • {holding.units.toLocaleString()} units @ ${holding.price?.toLocaleString() || 'N/A'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold">{formatCurrency(holding.value)}</p>
                                          {holding.change !== undefined && (
                                            <p className={`text-sm ${holding.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                              {holding.change >= 0 ? '+' : ''}{holding.change}%
                                            </p>
                                          )}
                                          {holding.yield !== undefined && (
                                            <p className="text-sm text-muted-foreground">Yield: {holding.yield}%</p>
                                          )}
                                          {holding.rate !== undefined && (
                                            <p className="text-sm text-muted-foreground">Rate: {holding.rate}%</p>
                                          )}
                                        </div>
                                      </div>
                                      {holding.costBase && (
                                        <div className="mt-2 pt-2 border-t text-sm text-muted-foreground flex justify-between">
                                          <span>Cost Base: {formatCurrency(holding.costBase)}</span>
                                          <span className={holding.value > holding.costBase ? 'text-emerald-600' : 'text-red-600'}>
                                            P&L: {formatCurrency(holding.value - holding.costBase)} ({((holding.value - holding.costBase) / holding.costBase * 100).toFixed(1)}%)
                                          </span>
                                        </div>
                                      )}
                                      {holding.maturity && (
                                        <p className="text-sm text-muted-foreground mt-1">Maturity: {formatDate(holding.maturity)}</p>
                                      )}
                                      {holding.debt !== undefined && holding.debt > 0 && (
                                        <p className="text-sm text-red-600 mt-1">Outstanding Debt: {formatCurrency(holding.debt)}</p>
                                      )}
                                      {holding.rental !== undefined && holding.rental > 0 && (
                                        <p className="text-sm text-emerald-600 mt-1">Monthly Rental: {formatCurrency(holding.rental)}</p>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>

                              {/* Research Reports */}
                              {category.research && category.research.length > 0 && (
                                <>
                                  <Separator className="my-4" />
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" /> Research Reports
                                  </h4>
                                  <div className="space-y-2">
                                    {category.research.map((report, idx) => (
                                      <Card key={idx} className="bg-blue-50/50 border-blue-200">
                                        <CardContent className="p-3">
                                          <div className="flex items-start justify-between">
                                            <div>
                                              <p className="font-medium">{report.title}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {report.source} • {formatDate(report.date)}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <Badge variant="outline" className="bg-white">
                                                {report.rating}
                                              </Badge>
                                              {report.target && (
                                                <p className="text-sm text-emerald-600 mt-1">Target: ${report.target}</p>
                                              )}
                                            </div>
                                          </div>
                                          <Button variant="link" size="sm" className="px-0 mt-2">
                                            <ExternalLink className="h-3 w-3 mr-1" /> View Full Report
                                          </Button>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Total Summary */}
            <Card className="bg-gradient-to-r from-[#1a2744] to-[#2a3f5f] text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70">Total Portfolio Value</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(Object.values(ASSET_HOLDINGS).reduce((sum, cat) => sum + cat.total, 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70">Total Holdings</p>
                    <p className="text-2xl font-bold">
                      {Object.values(ASSET_HOLDINGS).reduce((sum, cat) => sum + cat.holdings.length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceSection />
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

          {/* Contact Advisor Tab */}
          <TabsContent value="contact" className="space-y-6">
            <ContactAdvisorSection client={client} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

// Performance Section Component
const PerformanceSection = () => {
  const [timeframe, setTimeframe] = useState("1Y");
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    const monthsMap = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12, "2Y": 24, "3Y": 36, "5Y": 60, "10Y": 120 };
    setPerformanceData(generatePerformanceData(monthsMap[timeframe] || 12));
  }, [timeframe]);

  const startValue = performanceData[0]?.value || 0;
  const endValue = performanceData[performanceData.length - 1]?.value || 0;
  const totalReturn = startValue ? ((endValue - startValue) / startValue * 100) : 0;

  return (
    <>
      {/* Timeframe Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-[#D4A84C]" />
                Portfolio Performance
              </CardTitle>
              <CardDescription>Historical returns vs benchmark</CardDescription>
            </div>
            <div className="flex gap-1">
              {PERFORMANCE_TIMEFRAMES.map(tf => (
                <Button
                  key={tf}
                  size="sm"
                  variant={timeframe === tf ? "default" : "outline"}
                  onClick={() => setTimeframe(tf)}
                  className={timeframe === tf ? "bg-[#D4A84C] text-black hover:bg-[#C49A3C]" : ""}
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#666" tick={{ fontSize: 11 }} />
                <YAxis 
                  stroke="#666" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => [formatCurrency(value), ""]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Portfolio"
                  stroke="#3B82F6"
                  fill="url(#colorPortfolio)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="benchmark"
                  name="Benchmark"
                  stroke="#9CA3AF"
                  fill="url(#colorBenchmark)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Return ({timeframe})</p>
            <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Starting Value</p>
            <p className="text-2xl font-bold">{formatCurrency(startValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Current Value</p>
            <p className="text-2xl font-bold">{formatCurrency(endValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Absolute Gain/Loss</p>
            <p className={`text-2xl font-bold ${endValue >= startValue ? 'text-emerald-600' : 'text-red-600'}`}>
              {endValue >= startValue ? '+' : ''}{formatCurrency(endValue - startValue)}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Contact Advisor Section Component
const ContactAdvisorSection = ({ client }) => {
  const [contactMethod, setContactMethod] = useState("platform");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in subject and message");
      return;
    }
    
    setSending(true);
    try {
      const response = await axios.post(`${API}/api/client-contact/send-message`, {
        client_id: client.id || "client_demo",
        client_name: client.name,
        advisor_email: "mark.thompson@wealthcommand.io",
        advisor_name: client.advisor || "Mark Thompson",
        subject: subject,
        message: message,
        contact_method: contactMethod,
        priority: "normal"
      });
      
      if (response.data.status === "delivered") {
        toast.success(response.data.confirmation || "Message sent successfully!");
        setSubject("");
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleQuickAction = async (actionType) => {
    try {
      const response = await axios.post(`${API}/api/client-contact/quick-action`, {
        client_id: client.id || "client_demo",
        client_name: client.name,
        action_type: actionType,
        details: {}
      });
      
      toast.success(response.data.message || `${actionType} request submitted!`);
    } catch (error) {
      console.error("Error processing quick action:", error);
      toast.error("Failed to process request. Please try again.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Advisor Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-[#D4A84C]" />
            Your Advisor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#1a2744] text-white text-xl">MT</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{client.advisor}</p>
              <p className="text-sm text-muted-foreground">Senior Financial Advisor</p>
              <Badge className="mt-1 bg-emerald-100 text-emerald-700">Available</Badge>
            </div>
          </div>
          <Separator />
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>mark.thompson@wealthcommand.io</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>+61 2 9123 4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Next Review: {formatDate(client.nextReview)}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" /> Call
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Video className="h-4 w-4 mr-2" /> Video
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#D4A84C]" />
            Send a Message
          </CardTitle>
          <CardDescription>Choose how you'd like to contact your advisor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contact Method Toggle */}
          <div className="flex gap-2">
            <Button
              variant={contactMethod === "platform" ? "default" : "outline"}
              onClick={() => setContactMethod("platform")}
              className={contactMethod === "platform" ? "bg-[#1a2744]" : ""}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Platform Message
            </Button>
            <Button
              variant={contactMethod === "email" ? "default" : "outline"}
              onClick={() => setContactMethod("email")}
              className={contactMethod === "email" ? "bg-[#1a2744]" : ""}
            >
              <Mail className="h-4 w-4 mr-2" />
              Direct Email
            </Button>
          </div>

          {contactMethod === "platform" && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p className="font-medium">Secure Platform Messaging</p>
              <p>Messages are encrypted and stored within Wealth Command. Your advisor typically responds within 24 hours.</p>
            </div>
          )}

          {contactMethod === "email" && (
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              <p className="font-medium">Email Communication</p>
              <p>This will send an email directly to your advisor. For sensitive information, consider using platform messaging.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Question about portfolio rebalancing"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {contactMethod === "platform" ? "Message will be visible in your timeline" : "A copy will be sent to your email"}
            </p>
            <Button 
              className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
              onClick={handleSend}
              disabled={!subject || !message || sending}
            >
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {contactMethod === "email" ? "Email" : "Message"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              onClick={() => handleQuickAction("schedule_meeting")}
              data-testid="quick-action-schedule-meeting"
            >
              <Calendar className="h-6 w-6 mb-2" />
              <span>Schedule Meeting</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              onClick={() => handleQuickAction("request_statement")}
              data-testid="quick-action-request-statement"
            >
              <FileText className="h-6 w-6 mb-2" />
              <span>Request Statement</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              onClick={() => handleQuickAction("upload_document")}
              data-testid="quick-action-upload-document"
            >
              <Upload className="h-6 w-6 mb-2" />
              <span>Upload Document</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col"
              onClick={() => handleQuickAction("set_reminder")}
              data-testid="quick-action-set-reminder"
            >
              <Bell className="h-6 w-6 mb-2" />
              <span>Set Reminder</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Client360View;
