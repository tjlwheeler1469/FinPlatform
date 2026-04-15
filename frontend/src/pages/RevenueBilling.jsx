import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ChartContainer from "@/components/ChartContainer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Calendar,
  Receipt,
  PieChart,
  BarChart3,
  Download,
  Filter,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPie,
  Pie
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const COLORS = ['#1a2744', '#D4A84C', '#10B981', '#3B82F6', '#8B5CF6'];

// Generate mock revenue data
const generateRevenueData = () => {
  const months = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const baseRevenue = 95000 + Math.random() * 30000;
    const fees = baseRevenue * 0.4;
    const commissions = baseRevenue * 0.35;
    const other = baseRevenue * 0.25;
    
    months.push({
      month: date.toLocaleDateString('en-AU', { month: 'short' }),
      fullMonth: date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
      revenue: Math.round(baseRevenue),
      fees: Math.round(fees),
      commissions: Math.round(commissions),
      other: Math.round(other)
    });
  }
  
  return months;
};

// Generate client revenue breakdown
const generateClientRevenue = () => [
  { client: "Patel Family", aum: 4200000, fees: 42000, lastPayment: "2024-11-15" },
  { client: "Thompson Family", aum: 2278000, fees: 29200, lastPayment: "2024-11-10" },
  { client: "Chen Family", aum: 1850000, fees: 18500, lastPayment: "2024-11-12" },
  { client: "Thompson Family", aum: 1650000, fees: 16500, lastPayment: "2024-11-08" },
  { client: "Williams Family", aum: 1420000, fees: 14200, lastPayment: "2024-11-14" }
];

// Revenue by service type
const revenueByService = [
  { name: "Financial Planning", value: 450000, color: "#1a2744" },
  { name: "Investment Mgmt", value: 380000, color: "#D4A84C" },
  { name: "Insurance", value: 150000, color: "#10B981" },
  { name: "SMSF Admin", value: 120000, color: "#3B82F6" },
  { name: "Other", value: 100000, color: "#8B5CF6" }
];

const RevenueBilling = () => {
  const [timeRange, setTimeRange] = useState("12");
  const [revenueData, setRevenueData] = useState([]);
  const [clientRevenue, setClientRevenue] = useState([]);
  const [practiceData, setPracticeData] = useState(null);

  useEffect(() => {
    setRevenueData(generateRevenueData());
    setClientRevenue(generateClientRevenue());
    
    // Fetch practice overview
    const fetchPractice = async () => {
      try {
        const res = await axios.get(`${API}/enterprise/practice-overview`);
        setPracticeData(res.data);
      } catch (error) {
        console.error("Error fetching practice data:", error);
      }
    };
    fetchPractice();
  }, []);

  // Calculate summary metrics
  const totalRevenue = revenueData.reduce((sum, m) => sum + m.revenue, 0);
  const avgMonthlyRevenue = totalRevenue / (revenueData.length || 1);
  const lastMonthRevenue = revenueData[revenueData.length - 1]?.revenue || 0;
  const prevMonthRevenue = revenueData[revenueData.length - 2]?.revenue || 0;
  const monthOverMonth = prevMonthRevenue > 0 
    ? ((lastMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
    : 0;
  
  const totalAUM = clientRevenue.reduce((sum, c) => sum + c.aum, 0);
  const totalClients = practiceData?.total_clients || 47;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-bold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="revenue-billing-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  text-foreground flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-[#D4A84C]" />
              Revenue & Billing
            </h1>
            <p className="text-muted-foreground mt-1">
              Track practice revenue, client fees, and billing
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Months</SelectItem>
                <SelectItem value="6">6 Months</SelectItem>
                <SelectItem value="12">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-[#1a2744] bg-[#1a2744]/5">
            <CardContent className="pt-6">
              <p className="text-sm text-[#1a2744]">Total AUM</p>
              <p className="text-2xl font-bold text-[#1a2744]" data-testid="total-aum">
                {formatCurrency(practiceData?.total_aum || totalAUM)}
              </p>
              <p className="text-sm text-muted-foreground">{totalClients} clients</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-[#D4A84C] bg-[#D4A84C]/5">
            <CardContent className="pt-6">
              <p className="text-sm text-[#D4A84C]">YTD Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">
                Avg {formatCurrency(avgMonthlyRevenue)}/mo
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">{formatCurrency(lastMonthRevenue)}</p>
              <div className={`flex items-center gap-1 text-sm ${monthOverMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthOverMonth >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {Math.abs(monthOverMonth).toFixed(1)}% vs last month
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg Fee per Client</p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalRevenue / totalClients)}
              </p>
              <p className="text-sm text-muted-foreground">annual</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue breakdown by type</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer height={350}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="feesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a2744" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1a2744" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="commissionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4A84C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#D4A84C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="fees"
                    name="Fees"
                    stackId="1"
                    stroke="#1a2744"
                    fill="url(#feesGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="commissions"
                    name="Commissions"
                    stackId="1"
                    stroke="#D4A84C"
                    fill="url(#commissionsGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="other"
                    name="Other"
                    stackId="1"
                    stroke="#10B981"
                    fill="#10B98130"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue by Service & Top Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Service */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#D4A84C]" />
                Revenue by Service
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer height={250}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <RechartsPie>
                    <Pie
                      data={revenueByService}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {revenueByService.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Clients by Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-[#D4A84C]" />
                Top Clients by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clientRevenue.map((client, index) => (
                  <div 
                    key={`item-${index}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold`}
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.client}</p>
                        <p className="text-sm text-muted-foreground">
                          AUM: {formatCurrency(client.aum)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1a2744]">{formatCurrency(client.fees)}</p>
                      <p className="text-xs text-muted-foreground">annual fees</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#D4A84C]" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Invoice #</th>
                    <th className="text-left py-3 px-4 font-medium">Client</th>
                    <th className="text-left py-3 px-4 font-medium">Service</th>
                    <th className="text-left py-3 px-4 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "INV-2024-001", client: "Thompson Family", service: "Annual Review", amount: 2500, date: "2024-11-15", status: "paid" },
                    { id: "INV-2024-002", client: "Chen Family", service: "Financial Plan", amount: 3500, date: "2024-11-12", status: "paid" },
                    { id: "INV-2024-003", client: "Patel Family", service: "SMSF Admin", amount: 1800, date: "2024-11-10", status: "pending" },
                    { id: "INV-2024-004", client: "Thompson Family", service: "Investment Review", amount: 1500, date: "2024-11-08", status: "paid" },
                    { id: "INV-2024-005", client: "Williams Family", service: "Insurance Review", amount: 800, date: "2024-11-05", status: "overdue" }
                  ].map((invoice, index) => (
                    <tr key={`item-${index}`} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-sm">{invoice.id}</td>
                      <td className="py-3 px-4">{invoice.client}</td>
                      <td className="py-3 px-4">{invoice.service}</td>
                      <td className="py-3 px-4 font-semibold">{formatCurrency(invoice.amount)}</td>
                      <td className="py-3 px-4">{invoice.date}</td>
                      <td className="py-3 px-4">
                        <Badge className={
                          invoice.status === 'paid' ? 'bg-green-500' :
                          invoice.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                        }>
                          {invoice.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Adviser Performance */}
        {practiceData?.advisers && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[#D4A84C]" />
                Adviser Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {practiceData.advisers.map((adviser, index) => (
                  <div key={`item-${index}`} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {adviser.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold">{adviser.name}</p>
                        <p className="text-sm text-muted-foreground">{adviser.clients} clients</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">AUM</span>
                        <span className="font-semibold">{formatCurrency(adviser.aum)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Est. Revenue</span>
                        <span className="font-semibold text-[#1a2744]">{formatCurrency(adviser.aum * 0.01)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RevenueBilling;
