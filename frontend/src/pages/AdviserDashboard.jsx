import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  Building2,
  PieChart,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  Download,
  Send,
  UserPlus,
  BarChart3,
  Target,
  Bell,
  Settings,
  Briefcase,
  ArrowUpRight,
  ChevronRight,
  RefreshCw,
  Shield,
  Sparkles,
  LineChart
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";
import ChartContainer from "@/components/ChartContainer";
import { CLIENT_DATA, computeClientTotals } from "@/data/clientData";
import { navigateToClient } from "@/lib/navigateToClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartPie,
  Pie,
  Cell
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0
  }).format(value);
};

const formatCompactCurrency = (value) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
};

// Build Adviser dashboard rows from the centralized HNW client dataset.
// This keeps numbers in sync with clientData.js (single source of truth, up to $25M+ per client).
const CLIENT_META = {
  thompson_family: { id: 1, type: "Family", status: "active", lastReview: "2024-11-15", nextReview: "2025-02-15", alerts: 2, soaStatus: "current", complianceScore: 95,
    tasks: [
      { id: 1, text: "Review super contributions", priority: "high", due: "2025-01-15" },
      { id: 2, text: "Annual tax planning meeting", priority: "medium", due: "2025-02-01" },
    ] },
  chen_family: { id: 2, type: "Trust", status: "active", lastReview: "2024-10-20", nextReview: "2025-01-20", alerts: 1, soaStatus: "review", complianceScore: 88,
    tasks: [{ id: 1, text: "Trust distribution review", priority: "high", due: "2025-01-10" }] },
  client_3: { id: 3, type: "SMSF", status: "active", lastReview: "2024-12-01", nextReview: "2025-03-01", alerts: 0, soaStatus: "current", complianceScore: 100, tasks: [] },
  client_4: { id: 4, type: "Family", status: "active", lastReview: "2024-11-05", nextReview: "2025-02-05", alerts: 0, soaStatus: "current", complianceScore: 92, tasks: [] },
  client_5: { id: 5, type: "Company", status: "review", lastReview: "2024-09-15", nextReview: "2024-12-15", alerts: 3, soaStatus: "overdue", complianceScore: 72,
    tasks: [
      { id: 1, text: "Div 7A loan review", priority: "high", due: "2025-01-05" },
      { id: 2, text: "Company structure review", priority: "medium", due: "2025-01-20" },
      { id: 3, text: "BAS lodgement", priority: "urgent", due: "2025-01-28" },
    ] },
  client_6: { id: 6, type: "Trust", status: "active", lastReview: "2024-10-28", nextReview: "2025-01-28", alerts: 1, soaStatus: "review", complianceScore: 85,
    tasks: [{ id: 1, text: "Partnership distribution plan", priority: "medium", due: "2025-02-10" }] },
  client_7: { id: 7, type: "Family", status: "onboarding", lastReview: null, nextReview: "2025-01-30", alerts: 0, soaStatus: "pending", complianceScore: 60,
    tasks: [{ id: 1, text: "Complete onboarding", priority: "urgent", due: "2025-01-10" }] },
};

const MOCK_CLIENTS = Object.entries(CLIENT_META).map(([slug, meta]) => {
  const client = CLIENT_DATA[slug];
  const { grossAssets, totalLiabilities, netWorth } = computeClientTotals(slug);
  const monthlyIncome = Math.round((client?.profile?.incomeHousehold || 0) / 12);
  return {
    slug,
    id: meta.id,
    name: client?.profile?.name || slug,
    email: client?.profile?.email || "",
    phone: client?.profile?.phone || "",
    type: meta.type,
    status: meta.status,
    riskProfile: client?.profile?.riskProfile || null,
    lastReview: meta.lastReview,
    nextReview: meta.nextReview,
    netWorth,
    netWorthChange: +(((client?.assets || []).reduce((a, x) => a + (x.value * (x.change || 0) / 100), 0) / Math.max(1, grossAssets)) * 100).toFixed(1),
    totalAssets: grossAssets,
    totalDebt: totalLiabilities,
    monthlyIncome,
    tasks: meta.tasks,
    alerts: meta.alerts,
    soaStatus: meta.soaStatus,
    complianceScore: meta.complianceScore,
  };
});

const COLORS = ['#1a2744', '#10B981', '#3B82F6', '#D4A84C', '#EF4444'];

const AdviserDashboard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState(MOCK_CLIENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedClients, setSelectedClients] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate aggregates
  const totalAUM = clients.reduce((sum, c) => sum + c.totalAssets, 0);
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === "active").length;
  const urgentTasks = clients.reduce((sum, c) => sum + c.tasks.filter(t => t.priority === "urgent" || t.priority === "high").length, 0);
  const pendingReviews = clients.filter(c => {
    const nextReview = new Date(c.nextReview);
    return nextReview <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }).length;

  // Client type distribution
  const typeDistribution = [
    { name: "Family", value: clients.filter(c => c.type === "Family").length },
    { name: "Trust", value: clients.filter(c => c.type === "Trust").length },
    { name: "SMSF", value: clients.filter(c => c.type === "SMSF").length },
    { name: "Company", value: clients.filter(c => c.type === "Company").length },
  ];

  // AUM by client — full list, formatted for $10M+ HNW range
  const aumByClient = clients
    .map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), value: c.totalAssets }))
    .sort((a, b) => b.value - a.value);

  // Filter clients
  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesType = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const toggleClientSelection = (clientId) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const selectAllClients = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "review": return "bg-amber-100 text-amber-800";
      case "onboarding": return "bg-blue-100 text-blue-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSOAStatusColor = (status) => {
    switch (status) {
      case "current": return "text-green-600";
      case "review": return "text-amber-600";
      case "overdue": return "text-red-600";
      case "pending": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const viewClientPortal = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    navigateToClient(navigate, client?.slug || clientId);
  };

  const viewClientCompliance = (clientId) => {
    localStorage.setItem("active_client_id", clientId.toString());
    navigate("/compliance");
  };

  const handleActionClick = (action, clientId) => {
    localStorage.setItem("active_client_id", clientId?.toString() || "client_1");
    switch (action) {
      case "wealth":
        navigate("/client-wealth");
        break;
      case "compliance":
        navigate("/compliance");
        break;
      case "insights":
        navigate("/client-insights");
        break;
      case "meeting":
        navigate("/meeting-prep");
        break;
      case "scenario":
        navigate("/decision-center");
        break;
      default:
        navigate("/client-crm");
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="adviser-dashboard-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold  flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-[#D4A84C]" />
              Adviser Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your client portfolio and track performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3 text-green-600" />
              AFSL Compliant
            </Badge>
            <Button className="bg-[#1a2744]">
              <UserPlus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total AUM</p>
                <DollarSign className="h-4 w-4 text-[#D4A84C]" />
              </div>
              <p className="text-2xl font-bold" title={formatCurrency(totalAUM)}>{formatCompactCurrency(totalAUM)}</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> +3.2% this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <Users className="h-4 w-4 text-[#D4A84C]" />
              </div>
              <p className="text-2xl font-bold">{totalClients}</p>
              <p className="text-xs text-muted-foreground mt-1">{activeClients} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Urgent Tasks</p>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">{urgentTasks}</p>
              <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Reviews Due</p>
                <Calendar className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-amber-600">{pendingReviews}</p>
              <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Avg Compliance</p>
                <Shield className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">
                {Math.round(clients.reduce((sum, c) => sum + c.complianceScore, 0) / clients.length)}%
              </p>
              <Progress value={clients.reduce((sum, c) => sum + c.complianceScore, 0) / clients.length} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="h-4 w-4 mr-1" /> Clients ({totalClients})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckCircle className="h-4 w-4 mr-1" /> Tasks ({urgentTasks})
            </TabsTrigger>
            <TabsTrigger value="compliance">
              <Shield className="h-4 w-4 mr-1" /> Compliance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AUM by Client */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assets Under Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer height={280}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={aumByClient} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" tickFormatter={(v) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : `$${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="value" fill="#1a2744" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Client Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Client Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <ChartContainer height={150} className="flex-1">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <RechartPie>
                          <Pie
                            data={typeDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            dataKey="value"
                          >
                            {typeDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartPie>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="space-y-2">
                      {typeDistribution.map((type, i) => (
                        <div key={type.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                          <span className="text-sm">{type.name}: {type.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Clients Requiring Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients.filter(c => c.alerts > 0 || c.status === "review").slice(0, 4).map(client => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a2744] text-white flex items-center justify-center font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.type} • {client.tasks.length} tasks pending</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {client.alerts > 0 && (
                          <Badge variant="destructive">{client.alerts} alerts</Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={() => viewClientPortal(client.id)}>
                          View <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search clients..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="review">Needs Review</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Trust">Trust</SelectItem>
                  <SelectItem value="SMSF">SMSF</SelectItem>
                  <SelectItem value="Company">Company</SelectItem>
                </SelectContent>
              </Select>
              {selectedClients.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedClients.length} selected</Badge>
                  <Button size="sm" variant="outline">
                    <Mail className="h-4 w-4 mr-1" /> Email
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" /> Export
                  </Button>
                </div>
              )}
            </div>

            {/* Client List */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 text-left">
                          <Checkbox 
                            checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                            onCheckedChange={selectAllClients}
                          />
                        </th>
                        <th className="p-3 text-left text-sm font-medium">Client</th>
                        <th className="p-3 text-left text-sm font-medium">Type</th>
                        <th className="p-3 text-left text-sm font-medium">Status</th>
                        <th className="p-3 text-left text-sm font-medium">Net Worth</th>
                        <th className="p-3 text-left text-sm font-medium">Risk Profile</th>
                        <th className="p-3 text-left text-sm font-medium">SOA</th>
                        <th className="p-3 text-left text-sm font-medium">Compliance</th>
                        <th className="p-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map(client => (
                        <tr key={client.id} className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <Checkbox 
                              checked={selectedClients.includes(client.id)}
                              onCheckedChange={() => toggleClientSelection(client.id)}
                            />
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#1a2744] text-white flex items-center justify-center text-sm font-bold">
                                {client.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{client.name}</p>
                                <p className="text-xs text-muted-foreground">{client.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{client.type}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={getStatusColor(client.status)}>{client.status}</Badge>
                          </td>
                          <td className="p-3">
                            <div>
                              <p className="font-medium" title={formatCurrency(client.netWorth)}>{formatCompactCurrency(client.netWorth)}</p>
                              <p className={`text-xs ${client.netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {client.netWorthChange >= 0 ? '+' : ''}{client.netWorthChange}%
                              </p>
                            </div>
                          </td>
                          <td className="p-3">
                            {client.riskProfile ? (
                              <Badge variant="secondary">{client.riskProfile}</Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">Pending</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`text-sm font-medium ${getSOAStatusColor(client.soaStatus)}`}>
                              {client.soaStatus.charAt(0).toUpperCase() + client.soaStatus.slice(1)}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Progress value={client.complianceScore} className="w-16 h-2" />
                              <span className="text-xs">{client.complianceScore}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => viewClientPortal(client.id)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <FileText className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Client Tasks</CardTitle>
                <CardDescription>Tasks across all clients sorted by priority</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients
                    .flatMap(c => c.tasks.map(t => ({ ...t, clientName: c.name, clientId: c.id })))
                    .sort((a, b) => {
                      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                      return priorityOrder[a.priority] - priorityOrder[b.priority];
                    })
                    .map((task, i) => (
                      <div key={`${task.clientId}-${task.id}`} className={`flex items-center justify-between p-4 rounded-lg border ${
                        task.priority === 'urgent' ? 'bg-red-50 border-red-200' :
                        task.priority === 'high' ? 'bg-amber-50 border-amber-200' :
                        'bg-muted/50'
                      }`}>
                        <div className="flex items-center gap-4">
                          <Checkbox />
                          <div>
                            <p className="font-medium">{task.text}</p>
                            <p className="text-sm text-muted-foreground">
                              {task.clientName} • Due: {new Date(task.due).toLocaleDateString('en-AU')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={
                            task.priority === 'urgent' ? 'bg-red-600' :
                            task.priority === 'high' ? 'bg-amber-600' :
                            'bg-blue-600'
                          }>{task.priority}</Badge>
                          <Button size="sm" variant="outline" onClick={() => viewClientPortal(task.clientId)}>
                            Open
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="h-10 w-10 mx-auto text-green-600 mb-2" />
                  <p className="text-3xl font-bold">{clients.filter(c => c.complianceScore >= 90).length}</p>
                  <p className="text-sm text-muted-foreground">Fully Compliant</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-10 w-10 mx-auto text-amber-600 mb-2" />
                  <p className="text-3xl font-bold">{clients.filter(c => c.complianceScore >= 70 && c.complianceScore < 90).length}</p>
                  <p className="text-sm text-muted-foreground">Needs Review</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-10 w-10 mx-auto text-red-600 mb-2" />
                  <p className="text-3xl font-bold">{clients.filter(c => c.complianceScore < 70).length}</p>
                  <p className="text-sm text-muted-foreground">Action Required</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance Status by Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.map(client => (
                    <div key={client.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a2744] text-white flex items-center justify-center font-bold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SOA: <span className={getSOAStatusColor(client.soaStatus)}>{client.soaStatus}</span>
                            {client.lastReview && ` • Last review: ${new Date(client.lastReview).toLocaleDateString('en-AU')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs">Compliance</span>
                            <span className="text-xs font-medium">{client.complianceScore}%</span>
                          </div>
                          <Progress 
                            value={client.complianceScore} 
                            className={`h-2 ${
                              client.complianceScore >= 90 ? '[&>div]:bg-green-600' :
                              client.complianceScore >= 70 ? '[&>div]:bg-amber-600' :
                              '[&>div]:bg-red-600'
                            }`}
                          />
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default AdviserDashboard;
