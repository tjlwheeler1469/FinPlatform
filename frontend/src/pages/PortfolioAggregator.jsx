import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ExternalLink
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
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

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const COLORS = ['#0F392B', '#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

const getAccountIcon = (type) => {
  switch (type) {
    case "bank": return Landmark;
    case "super": return PiggyBank;
    case "brokerage": return TrendingUp;
    case "mortgage": return Home;
    default: return Wallet;
  }
};

const getAccountColor = (type) => {
  switch (type) {
    case "bank": return "#3B82F6";
    case "super": return "#10B981";
    case "brokerage": return "#D4AF37";
    case "mortgage": return "#EF4444";
    default: return "#6366F1";
  }
};

const PortfolioAggregator = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch aggregated portfolio
  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/portfolio/aggregated/hh_wheeler001`);
      setPortfolioData(res.data);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      toast.error("Failed to load portfolio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Sync accounts
  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`${API}/portfolio/sync/hh_wheeler001`);
      toast.success("All accounts synced");
      await fetchPortfolio();
    } catch (error) {
      toast.error("Failed to sync accounts");
    } finally {
      setSyncing(false);
    }
  };

  // Prepare chart data
  const allocationData = portfolioData?.asset_allocation 
    ? Object.entries(portfolioData.asset_allocation).map(([key, value], idx) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: value.amount,
        percent: value.percent,
        color: COLORS[idx % COLORS.length]
      }))
    : [];

  // Group accounts by type
  const accountsByType = portfolioData?.accounts?.reduce((acc, account) => {
    const type = account.account_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {}) || {};

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-[#0F392B]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="portfolio-aggregator-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Manrope'] text-foreground flex items-center gap-3">
              <Wallet className="h-8 w-8 text-[#D4AF37]" />
              Portfolio Aggregator
            </h1>
            <p className="text-muted-foreground mt-1">
              All your financial accounts in one place
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="connect-account-btn">
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
            <Button 
              onClick={handleSync}
              disabled={syncing}
              className="bg-[#0F392B]"
              data-testid="sync-btn"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? "Syncing..." : "Sync All"}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Total Assets</p>
                  <p className="text-2xl font-bold text-green-800">
                    {formatCurrency(portfolioData?.total_assets || 0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Total Liabilities</p>
                  <p className="text-2xl font-bold text-red-800">
                    {formatCurrency(portfolioData?.total_liabilities || 0)}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#0F392B] bg-[#0F392B]/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#0F392B]">Net Worth</p>
                  <p className="text-2xl font-bold text-[#0F392B]">
                    {formatCurrency(portfolioData?.net_worth || 0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-[#0F392B]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Connected Accounts</p>
                  <p className="text-2xl font-bold">
                    {portfolioData?.accounts?.length || 0}
                  </p>
                </div>
                <Link2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Allocation Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Monthly Snapshot */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Snapshot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">Monthly Income</p>
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(portfolioData?.monthly_snapshot?.income || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">Monthly Expenses</p>
                      <p className="text-2xl font-bold text-red-800">
                        {formatCurrency(portfolioData?.monthly_snapshot?.expenses || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[#0F392B]/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm">Monthly Savings</p>
                      <p className="text-xl font-bold text-[#0F392B]">
                        {formatCurrency(portfolioData?.monthly_snapshot?.savings || 0)}
                      </p>
                    </div>
                    <Progress 
                      value={(portfolioData?.monthly_snapshot?.savings_rate || 0) * 100} 
                      className="h-3"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Savings Rate: {((portfolioData?.monthly_snapshot?.savings_rate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Summary by Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(accountsByType).map(([type, accounts]) => {
                const Icon = getAccountIcon(type);
                const color = getAccountColor(type);
                const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
                
                return (
                  <Card key={type}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{type}</p>
                          <p className="text-xs text-muted-foreground">{accounts.length} accounts</p>
                        </div>
                      </div>
                      <p className={`text-2xl font-bold ${totalBalance < 0 ? 'text-red-500' : ''}`}>
                        {totalBalance < 0 ? '-' : ''}{formatCurrency(totalBalance)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            {Object.entries(accountsByType).map(([type, accounts]) => {
              const Icon = getAccountIcon(type);
              const color = getAccountColor(type);
              
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 capitalize">
                      <Icon className="h-5 w-5" style={{ color }} />
                      {type} Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {accounts.map((account) => (
                        <div 
                          key={account.account_id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: `${color}10` }}
                            >
                              <Building2 className="h-6 w-6" style={{ color }} />
                            </div>
                            <div>
                              <p className="font-semibold">{account.account_name}</p>
                              <p className="text-sm text-muted-foreground">{account.institution}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${account.balance < 0 ? 'text-red-500' : ''}`}>
                              {account.balance < 0 ? '-' : ''}{formatCurrency(account.balance)}
                            </p>
                            <div className="flex items-center gap-2 justify-end mt-1">
                              <Badge 
                                variant="outline" 
                                className={account.status === 'connected' ? 'border-green-500 text-green-600' : 'border-yellow-500 text-yellow-600'}
                              >
                                {account.status === 'connected' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                )}
                                {account.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(account.last_synced)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Allocation Tab */}
          <TabsContent value="allocation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Asset Allocation Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allocationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Allocation Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detailed Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allocationData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{item.name}</span>
                          <span className="font-bold">{item.percent.toFixed(1)}%</span>
                        </div>
                        <Progress value={item.percent} className="h-2" />
                      </div>
                      <span className="text-sm text-muted-foreground w-32 text-right">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Link2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800">About Portfolio Aggregation</p>
                <p className="text-sm text-blue-700 mt-1">
                  Connect your bank accounts, superannuation, brokerage accounts, and mortgages to get a 
                  complete picture of your finances. Data is securely synced using Open Banking APIs and 
                  is refreshed automatically. Your credentials are never stored on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PortfolioAggregator;
