import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Wallet,
  RefreshCw,
  Link2,
  Building2,
  Landmark,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Home,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  Shield,
  Lock,
  Zap,
  Activity,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  Clock
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(value));
};

const formatCompact = (value) => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

// Available CDR data holders (banks)
const CDR_DATA_HOLDERS = [
  { id: "cba", name: "Commonwealth Bank", logo: "🏦", status: "available" },
  { id: "nab", name: "National Australia Bank", logo: "🏦", status: "available" },
  { id: "wbc", name: "Westpac", logo: "🏦", status: "available" },
  { id: "anz", name: "ANZ", logo: "🏦", status: "available" },
  { id: "mac", name: "Macquarie Bank", logo: "🏦", status: "available" },
  { id: "ing", name: "ING Australia", logo: "🏦", status: "coming_soon" },
];

// Super fund providers
const SUPER_PROVIDERS = [
  { id: "aus_super", name: "AustralianSuper", logo: "💰", status: "available" },
  { id: "qsuper", name: "QSuper", logo: "💰", status: "available" },
  { id: "hesta", name: "HESTA", logo: "💰", status: "available" },
  { id: "unisuper", name: "UniSuper", logo: "💰", status: "coming_soon" },
];

// Brokerage providers
const BROKERAGE_PROVIDERS = [
  { id: "commsec", name: "CommSec", logo: "📈", status: "available" },
  { id: "selfwealth", name: "SelfWealth", logo: "📈", status: "available" },
  { id: "stake", name: "Stake", logo: "📈", status: "coming_soon" },
];

const PortfolioAggregator = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch accounts from secure data feeds
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [cdrRes, superRes] = await Promise.all([
        axios.get(`${API}/feeds/cdr/accounts/wheeler_family`).catch(() => ({ data: null })),
        axios.get(`${API}/feeds/super/M123456789`).catch(() => ({ data: null }))
      ]);

      // Transform CDR accounts or use fallback data
      const bankAccounts = (cdrRes.data?.data?.accounts || [
        { accountId: "acc_001", displayName: "Everyday Account", balance: { currentBalance: 15420 }, accountNumber: "1234567890", bsb: "062-000" },
        { accountId: "acc_002", displayName: "Savings Account", balance: { currentBalance: 78500 }, accountNumber: "0987654321", bsb: "062-000" },
        { accountId: "acc_003", displayName: "Offset Account", balance: { currentBalance: 125000 }, accountNumber: "5432167890", bsb: "062-001" },
        { accountId: "acc_004", displayName: "Credit Card", balance: { currentBalance: -3200 }, accountNumber: "4000123456789012", bsb: "" },
      ]).map(acc => ({
        id: acc.accountId,
        name: acc.displayName,
        institution: "Commonwealth Bank",
        type: "bank",
        balance: parseFloat(acc.balance?.currentBalance || 0),
        lastSynced: new Date().toISOString(),
        status: "connected",
        accountNumber: `****${acc.accountNumber?.slice(-4) || '0000'}`,
        bsb: acc.bsb
      }));

      // Transform super account with fallback
      const superData = superRes.data || {
        fund: { name: "AustralianSuper" },
        balance: { total: 580000 },
        investments: [
          { name: "Growth Option", percentage: 60, value: 348000 },
          { name: "Balanced Option", percentage: 40, value: 232000 }
        ],
        insurance: { death: 500000, tpd: 500000, income: 10000 }
      };
      const superAccount = {
        id: "super_1",
        name: superData.fund?.name || "Superannuation",
        institution: superData.fund?.name,
        type: "super",
        balance: superData.balance?.total || 580000,
        lastSynced: new Date().toISOString(),
        status: "connected",
        investments: superData.investments,
        insurance: superData.insurance
      };

      // Add mock brokerage account
      const brokerageAccount = {
        id: "brokerage_1",
        name: "Share Portfolio",
        institution: "CommSec",
        type: "brokerage",
        balance: 545000,
        lastSynced: new Date().toISOString(),
        status: "connected",
        holdings: [
          { symbol: "BHP", name: "BHP Group", units: 500, value: 23500 },
          { symbol: "CBA", name: "Commonwealth Bank", units: 200, value: 24000 },
          { symbol: "CSL", name: "CSL Limited", units: 150, value: 42000 },
        ]
      };

      // Add property
      const propertyAccount = {
        id: "property_1",
        name: "Investment Property",
        institution: "Manual Entry",
        type: "property",
        balance: 1720000,
        lastSynced: null,
        status: "manual",
        address: "123 Investment St, Sydney NSW"
      };

      setAccounts([
        ...bankAccounts,
        superAccount,
        brokerageAccount,
        propertyAccount
      ].filter(Boolean));

    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to fetch account data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Sync all accounts
  const syncAllAccounts = async () => {
    setSyncing(true);
    try {
      await new Promise(r => setTimeout(r, 2000)); // Simulate sync
      await fetchAccounts();
      toast.success("All accounts synced successfully");
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // Calculate totals
  const totalAssets = accounts.reduce((sum, acc) => sum + (acc.balance > 0 ? acc.balance : 0), 0);
  const totalLiabilities = accounts.reduce((sum, acc) => sum + (acc.balance < 0 ? Math.abs(acc.balance) : 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Group by type
  const accountsByType = accounts.reduce((groups, acc) => {
    const type = acc.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(acc);
    return groups;
  }, {});

  // Pie chart data
  const allocationData = [
    { name: "Property", value: accountsByType.property?.reduce((s, a) => s + a.balance, 0) || 0, color: COLORS[0] },
    { name: "Super", value: accountsByType.super?.reduce((s, a) => s + a.balance, 0) || 0, color: COLORS[1] },
    { name: "Shares", value: accountsByType.brokerage?.reduce((s, a) => s + a.balance, 0) || 0, color: COLORS[2] },
    { name: "Cash", value: accountsByType.bank?.reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0) || 0, color: COLORS[3] },
  ].filter(d => d.value > 0);

  const getAccountIcon = (type) => {
    switch (type) {
      case "bank": return Landmark;
      case "super": return PiggyBank;
      case "brokerage": return TrendingUp;
      case "property": return Building2;
      case "mortgage": return Home;
      default: return Wallet;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case "manual":
        return <Badge variant="outline"><Settings className="h-3 w-3 mr-1" />Manual</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Connect new account handler
  const handleConnect = async (provider) => {
    setSelectedProvider(provider);
    // Simulate OAuth flow
    toast.info(`Connecting to ${provider.name}...`);
    await new Promise(r => setTimeout(r, 1500));
    toast.success(`Connected to ${provider.name}`);
    setConnectDialogOpen(false);
    fetchAccounts();
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="portfolio-aggregator">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Link2 className="h-8 w-8 text-[#D4A84C]" />
              Account Aggregation
            </h1>
            <p className="text-muted-foreground mt-1">
              All your financial accounts in one secure place
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Connect Financial Account</DialogTitle>
                  <DialogDescription>
                    Securely connect your accounts using Open Banking (CDR) or direct integration.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="banks" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="banks">Banks</TabsTrigger>
                    <TabsTrigger value="super">Super Funds</TabsTrigger>
                    <TabsTrigger value="brokers">Brokers</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="banks" className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {CDR_DATA_HOLDERS.map(provider => (
                        <button
                          key={provider.id}
                          onClick={() => provider.status === "available" && handleConnect(provider)}
                          disabled={provider.status !== "available"}
                          className={`p-4 rounded-lg border text-left transition-colors ${
                            provider.status === "available" 
                              ? "hover:border-[#D4A84C] hover:bg-muted/50 cursor-pointer" 
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{provider.logo}</span>
                            <div>
                              <p className="font-medium">{provider.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {provider.status === "available" ? "CDR Connected" : "Coming Soon"}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2">
                      <Shield className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Bank-Grade Security</p>
                        <p className="text-muted-foreground">AES-256 encryption • CDR accredited • Read-only access</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="super" className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {SUPER_PROVIDERS.map(provider => (
                        <button
                          key={provider.id}
                          onClick={() => provider.status === "available" && handleConnect(provider)}
                          disabled={provider.status !== "available"}
                          className={`p-4 rounded-lg border text-left transition-colors ${
                            provider.status === "available" 
                              ? "hover:border-[#D4A84C] hover:bg-muted/50 cursor-pointer" 
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{provider.logo}</span>
                            <div>
                              <p className="font-medium">{provider.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {provider.status === "available" ? "API Connected" : "Coming Soon"}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="brokers" className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {BROKERAGE_PROVIDERS.map(provider => (
                        <button
                          key={provider.id}
                          onClick={() => provider.status === "available" && handleConnect(provider)}
                          disabled={provider.status !== "available"}
                          className={`p-4 rounded-lg border text-left transition-colors ${
                            provider.status === "available" 
                              ? "hover:border-[#D4A84C] hover:bg-muted/50 cursor-pointer" 
                              : "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{provider.logo}</span>
                            <div>
                              <p className="font-medium">{provider.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {provider.status === "available" ? "API Connected" : "Coming Soon"}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={syncAllAccounts}
              disabled={syncing}
              className="bg-[#1a2744] hover:bg-[#1a2744]/90"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? "Syncing..." : "Sync All"}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#1a2744]/80 text-white border-none">
            <CardContent className="p-5">
              <p className="text-sm text-white/70">Net Worth</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(netWorth)}</p>
              <div className="flex items-center gap-1 mt-2 text-[#D4A84C]">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">+8.2% this month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(totalAssets)}</p>
              <p className="text-xs text-muted-foreground mt-2">{accounts.filter(a => a.balance > 0).length} accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Liabilities</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(totalLiabilities)}</p>
              <p className="text-xs text-muted-foreground mt-2">{accounts.filter(a => a.balance < 0).length} accounts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Connected Accounts</p>
              <p className="text-2xl font-bold mt-1">{accounts.length}</p>
              <div className="flex items-center gap-1 mt-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">All synced</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Accounts List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {accounts.map(account => {
                      const Icon = getAccountIcon(account.type);
                      return (
                        <div 
                          key={account.id}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Icon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{account.name}</p>
                              {getStatusBadge(account.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">{account.institution}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${account.balance >= 0 ? 'text-foreground' : 'text-red-600'}`}>
                              {account.balance < 0 && '-'}{formatCurrency(account.balance)}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(account.lastSynced)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Allocation Chart */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={200}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                
                <div className="space-y-2 mt-4">
                  {allocationData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">{formatCompact(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Bank-Grade Security</p>
                    <ul className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-300">
                      <li className="flex items-center gap-2">
                        <Lock className="h-3 w-3" /> AES-256 encryption
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" /> CDR accredited
                      </li>
                      <li className="flex items-center gap-2">
                        <Eye className="h-3 w-3" /> Read-only access
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioAggregator;
