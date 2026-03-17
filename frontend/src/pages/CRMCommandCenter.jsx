import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Plus,
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
  Activity
} from "lucide-react";
import axios from "axios";
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

const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'prospect': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'review': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'inactive': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'urgent': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-amber-500 text-white';
    case 'low': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

// Demo data for a comprehensive CRM view
const DEMO_CLIENTS = [
  {
    id: "client_1",
    name: "James & Sarah Wheeler",
    email: "james.wheeler@email.com",
    phone: "0412 345 678",
    status: "active",
    type: "household",
    wealth: 2850000,
    wealthChange: 125000,
    wealthChangePercent: 4.6,
    lastContact: "2025-12-15",
    nextReview: "2026-01-15",
    advisor: "Mark Thompson",
    riskProfile: "Growth",
    satisfaction: 95,
    accounts: [
      { type: "Super", balance: 890000, icon: PiggyBank },
      { type: "Investment", balance: 650000, icon: TrendingUp },
      { type: "Property", balance: 1200000, icon: Home },
      { type: "Cash", balance: 110000, icon: DollarSign }
    ],
    recentActivity: "Portfolio rebalance completed",
    pendingTasks: 2,
    pendingDocs: 1
  },
  {
    id: "client_2",
    name: "Chen Family Trust",
    email: "michael.chen@email.com",
    phone: "0423 456 789",
    status: "active",
    type: "trust",
    wealth: 5200000,
    wealthChange: -85000,
    wealthChangePercent: -1.6,
    lastContact: "2025-12-10",
    nextReview: "2026-02-20",
    advisor: "Mark Thompson",
    riskProfile: "Balanced",
    satisfaction: 88,
    accounts: [
      { type: "Trust", balance: 2800000, icon: Building2 },
      { type: "Super", balance: 1200000, icon: PiggyBank },
      { type: "Property", balance: 1100000, icon: Home },
      { type: "Cash", balance: 100000, icon: DollarSign }
    ],
    recentActivity: "Tax planning meeting scheduled",
    pendingTasks: 4,
    pendingDocs: 2
  },
  {
    id: "client_3",
    name: "Robert Mitchell",
    email: "r.mitchell@company.com",
    phone: "0434 567 890",
    status: "review",
    type: "individual",
    wealth: 1450000,
    wealthChange: 32000,
    wealthChangePercent: 2.3,
    lastContact: "2025-11-28",
    nextReview: "2025-12-20",
    advisor: "Mark Thompson",
    riskProfile: "Conservative",
    satisfaction: 72,
    accounts: [
      { type: "Super", balance: 680000, icon: PiggyBank },
      { type: "Investment", balance: 420000, icon: TrendingUp },
      { type: "Property", balance: 280000, icon: Home },
      { type: "Cash", balance: 70000, icon: DollarSign }
    ],
    recentActivity: "Annual review overdue",
    pendingTasks: 5,
    pendingDocs: 3
  },
  {
    id: "client_4",
    name: "Emma & David Williams",
    email: "emma.williams@gmail.com",
    phone: "0445 678 901",
    status: "prospect",
    type: "household",
    wealth: 980000,
    wealthChange: 0,
    wealthChangePercent: 0,
    lastContact: "2025-12-12",
    nextReview: null,
    advisor: "Mark Thompson",
    riskProfile: "TBD",
    satisfaction: null,
    accounts: [
      { type: "Super (Est)", balance: 450000, icon: PiggyBank },
      { type: "Property (Est)", balance: 530000, icon: Home }
    ],
    recentActivity: "Discovery meeting completed",
    pendingTasks: 3,
    pendingDocs: 5
  },
  {
    id: "client_5",
    name: "Patel SMSF",
    email: "raj.patel@business.com.au",
    phone: "0456 789 012",
    status: "active",
    type: "smsf",
    wealth: 3100000,
    wealthChange: 180000,
    wealthChangePercent: 6.2,
    lastContact: "2025-12-08",
    nextReview: "2026-03-15",
    advisor: "Mark Thompson",
    riskProfile: "Aggressive",
    satisfaction: 92,
    accounts: [
      { type: "SMSF", balance: 2400000, icon: Shield },
      { type: "Business", balance: 500000, icon: Building2 },
      { type: "Cash", balance: 200000, icon: DollarSign }
    ],
    recentActivity: "SMSF audit completed",
    pendingTasks: 1,
    pendingDocs: 0
  }
];

const DEMO_TASKS = [
  { id: 1, title: "Annual Review - Robert Mitchell", client: "Robert Mitchell", clientId: "client_3", priority: "urgent", dueDate: "2025-12-20", type: "review" },
  { id: 2, title: "SOA Preparation - Chen Family", client: "Chen Family Trust", clientId: "client_2", priority: "high", dueDate: "2025-12-22", type: "document" },
  { id: 3, title: "Insurance Review - Wheeler", client: "James & Sarah Wheeler", clientId: "client_1", priority: "medium", dueDate: "2025-12-28", type: "review" },
  { id: 4, title: "Discovery Meeting Follow-up", client: "Emma & David Williams", clientId: "client_4", priority: "high", dueDate: "2025-12-19", type: "meeting" },
  { id: 5, title: "SMSF Contribution Strategy", client: "Patel SMSF", clientId: "client_5", priority: "medium", dueDate: "2026-01-05", type: "planning" },
  { id: 6, title: "Tax Planning - Chen Trust", client: "Chen Family Trust", clientId: "client_2", priority: "medium", dueDate: "2026-01-10", type: "planning" },
];

const DEMO_NOTIFICATIONS = [
  { id: 1, message: "Robert Mitchell's annual review is overdue", type: "warning", time: "1 hour ago" },
  { id: 2, message: "New document uploaded by Chen Family", type: "info", time: "3 hours ago" },
  { id: 3, message: "Wheeler portfolio up 4.6% this month", type: "success", time: "Yesterday" },
  { id: 4, message: "Compliance training due in 5 days", type: "warning", time: "Yesterday" },
];

const CRMCommandCenter = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState(DEMO_CLIENTS);
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Calculate summary stats
  const totalAUM = clients.reduce((sum, c) => sum + c.wealth, 0);
  const activeClients = clients.filter(c => c.status === "active").length;
  const prospects = clients.filter(c => c.status === "prospect").length;
  const reviewsDue = clients.filter(c => c.status === "review").length;
  const urgentTasks = tasks.filter(t => t.priority === "urgent" || t.priority === "high").length;

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectClient = (client) => {
    localStorage.setItem("selected_client", JSON.stringify({
      id: client.id,
      name: client.name,
      email: client.email
    }));
    navigate("/client-360");
  };

  const handleQuickAction = (action, client) => {
    switch (action) {
      case "wealth":
        localStorage.setItem("selected_client", JSON.stringify({ id: client.id, name: client.name }));
        navigate("/client-wealth");
        break;
      case "tasks":
        navigate(`/workflows?client=${client.id}`);
        break;
      case "documents":
        navigate(`/reports?client=${client.id}`);
        break;
      case "call":
        toast.success(`Calling ${client.name}...`);
        break;
      case "email":
        toast.success(`Opening email to ${client.email}`);
        break;
      default:
        break;
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="crm-command-center">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2744] via-[#1a2744] to-[#2a3f5f] p-8 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A84C]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="h-8 w-8 text-[#D4A84C]" />
                  Client Command Center
                </h1>
                <p className="text-white/70 mt-2 text-lg">
                  Your complete view of all clients, tasks, and opportunities
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="bg-white text-[#1a2744] hover:bg-white/90" data-testid="add-client-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  New Client
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" data-testid="quick-search-btn">
                  <Search className="h-4 w-4 mr-2" />
                  Quick Search
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/60 text-sm">Total AUM</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalAUM)}</p>
                <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> +3.2% this month
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/60 text-sm">Active Clients</p>
                <p className="text-2xl font-bold mt-1">{activeClients}</p>
                <p className="text-white/60 text-xs mt-1">{clients.length} total</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/60 text-sm">Prospects</p>
                <p className="text-2xl font-bold mt-1">{prospects}</p>
                <p className="text-blue-400 text-xs mt-1">In pipeline</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/60 text-sm">Reviews Due</p>
                <p className="text-2xl font-bold mt-1 text-amber-400">{reviewsDue}</p>
                <p className="text-amber-400 text-xs mt-1">Action needed</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-white/60 text-sm">Urgent Tasks</p>
                <p className="text-2xl font-bold mt-1 text-red-400">{urgentTasks}</p>
                <p className="text-red-400 text-xs mt-1">High priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Client List - 2 columns */}
          <div className="xl:col-span-2 space-y-4">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="client-search"
                    />
                  </div>
                  <div className="flex gap-2">
                    {["all", "active", "prospect", "review"].map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                        className={statusFilter === status ? "bg-[#1a2744]" : ""}
                        data-testid={`filter-${status}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Cards */}
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <Card 
                  key={client.id} 
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleSelectClient(client)}
                  data-testid={`client-card-${client.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-14 w-14 border-2 border-[#D4A84C]/20">
                        <AvatarFallback className="bg-[#1a2744] text-white text-lg font-semibold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg group-hover:text-[#1a2744]">
                                {client.name}
                              </h3>
                              <Badge className={getStatusColor(client.status)}>
                                {client.status}
                              </Badge>
                              {client.satisfaction && client.satisfaction >= 90 && (
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {client.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {client.phone}
                              </span>
                            </div>
                          </div>

                          {/* Wealth Display */}
                          <div className="text-right">
                            <p className="text-2xl font-bold">{formatCurrency(client.wealth)}</p>
                            <p className={`text-sm flex items-center justify-end gap-1 ${
                              client.wealthChangePercent >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}>
                              {client.wealthChangePercent >= 0 ? (
                                <ArrowUpRight className="h-4 w-4" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4" />
                              )}
                              {client.wealthChangePercent >= 0 ? "+" : ""}{client.wealthChangePercent}%
                            </p>
                          </div>
                        </div>

                        {/* Account Breakdown */}
                        <div className="flex flex-wrap gap-3 mt-4">
                          {client.accounts.map((account, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                              <account.icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{account.type}</span>
                              <span className="text-sm text-muted-foreground">{formatCurrency(account.balance)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Quick Actions & Info */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Last: {new Date(client.lastContact).toLocaleDateString()}
                            </span>
                            {client.nextReview && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Review: {new Date(client.nextReview).toLocaleDateString()}
                              </span>
                            )}
                            {client.pendingTasks > 0 && (
                              <Badge variant="outline" className="text-amber-600 border-amber-300">
                                <ListTodo className="h-3 w-3 mr-1" />
                                {client.pendingTasks} tasks
                              </Badge>
                            )}
                            {client.pendingDocs > 0 && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                <FileText className="h-3 w-3 mr-1" />
                                {client.pendingDocs} docs
                              </Badge>
                            )}
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleQuickAction("wealth", client); }}
                              data-testid={`quick-wealth-${client.id}`}
                            >
                              <Wallet className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleQuickAction("tasks", client); }}
                              data-testid={`quick-tasks-${client.id}`}
                            >
                              <ListTodo className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleQuickAction("documents", client); }}
                              data-testid={`quick-docs-${client.id}`}
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleQuickAction("call", client); }}
                              data-testid={`quick-call-${client.id}`}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleQuickAction("email", client); }}
                              data-testid={`quick-email-${client.id}`}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Tasks Panel */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-[#D4A84C]" />
                    Today's Tasks
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/workflows")}>
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/workflows?task=${task.id}`)}
                    data-testid={`task-${task.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                        {task.priority}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.client} • Due {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-[#D4A84C]" />
                    Notifications
                  </CardTitle>
                  <Badge variant="secondary">{notifications.length} new</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    data-testid={`notification-${notif.id}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notif.type === "warning" ? "bg-amber-500" :
                      notif.type === "success" ? "bg-emerald-500" : "bg-blue-500"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#D4A84C]" />
                  Practice Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Client Satisfaction</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Review Compliance</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Document Completion</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Revenue Target</span>
                    <span className="font-medium text-emerald-600">105%</span>
                  </div>
                  <Progress value={100} className="h-2 bg-emerald-100" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CRMCommandCenter;
