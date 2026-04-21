import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import ClientModal from "@/components/ClientModal";
import FloatingActionRail from "@/components/platform/FloatingActionRail";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy-load CRM tools so they only hydrate when tab is active
const ClientSegmentations = lazy(() => import("@/components/crm/ClientSegmentations"));
const NewsletterBuilder = lazy(() => import("@/components/crm/NewsletterBuilder"));
const ComplianceTracker = lazy(() => import("@/components/crm/ComplianceTracker"));
const DocuSignMock = lazy(() => import("@/components/crm/DocuSignMock"));
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Target,
  ListTodo,
  Eye,
  ChevronRight,
  Briefcase,
  Star,
  Building2,
  Home,
  PiggyBank,
  Shield,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  SlidersHorizontal,
  PieChart,
  Layers,
  Loader2,
  Mail as MailIcon,
  ShieldCheck,
  FileSignature,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value?.toLocaleString() || 0}`;
};

const getAccountIcon = (type) => {
  const typeStr = (type || "").toLowerCase();
  if (typeStr.includes("super") || typeStr.includes("pension")) return PiggyBank;
  if (typeStr.includes("invest") || typeStr.includes("portfolio")) return TrendingUp;
  if (typeStr.includes("property") || typeStr.includes("home")) return Home;
  if (typeStr.includes("cash") || typeStr.includes("savings") || typeStr.includes("term")) return DollarSign;
  if (typeStr.includes("trust")) return Building2;
  if (typeStr.includes("smsf")) return Shield;
  if (typeStr.includes("business")) return Briefcase;
  return Wallet;
};

const statusColors = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  review: "bg-amber-100 text-amber-800 border-amber-200",
  prospect: "bg-blue-100 text-blue-800 border-blue-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200"
};

const AdviserHub = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // cards, table, portfolio
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/crm/clients`),
        fetch(`${API_URL}/api/crm/analytics`)
      ]);
      
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }
      
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load client data");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectClient = (client) => {
    const clientObj = {
      id: client.client_id,
      client_id: client.client_id,
      name: client.name,
      email: client.email,
      aum: client.total_wealth
    };
    setSelectedClient(clientObj);
    localStorage.setItem("selected_client", JSON.stringify(clientObj));
    window.dispatchEvent(new CustomEvent('client-changed'));
    navigate("/dashboard");
  };

  // Calculate portfolio totals
  const totalAUM = clients.reduce((sum, c) => sum + (c.total_wealth || 0), 0);
  const totalAccounts = clients.reduce((sum, c) => sum + (c.accounts?.length || 0), 0);

  // Group assets by type across all clients
  const assetsByType = {};
  clients.forEach(client => {
    (client.accounts || []).forEach(account => {
      const type = account.type || "Other";
      if (!assetsByType[type]) {
        assetsByType[type] = { total: 0, count: 0 };
      }
      assetsByType[type].total += account.balance || 0;
      assetsByType[type].count += 1;
    });
  });

  return (
    <Layout>
      <FloatingActionRail />
      <div className="space-y-6 xl:pr-[350px]" data-testid="adviser-hub">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Users className="h-7 w-7 text-[#D4A84C]" />
              Client Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              All clients, portfolios, and practice overview in one place
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowClientModal(true)}
              className="bg-[#1a2744] hover:bg-[#1a2744]/90"
              data-testid="add-client-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Total AUM</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalAUM)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-[#D4A84C]" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  <p className="text-2xl font-bold">{clients.filter(c => c.status === "active").length}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prospects</p>
                  <p className="text-2xl font-bold">{clients.filter(c => c.status === "prospect").length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reviews Due</p>
                  <p className="text-2xl font-bold">{clients.filter(c => c.status === "review").length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Accounts</p>
                  <p className="text-2xl font-bold">{totalAccounts}</p>
                </div>
                <Layers className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Clients
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Portfolio Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="segments" className="flex items-center gap-2" data-testid="hub-tab-segments">
                <Sparkles className="h-4 w-4 text-[#D4A84C]" />
                Segmentations
              </TabsTrigger>
              <TabsTrigger value="newsletter" className="flex items-center gap-2" data-testid="hub-tab-newsletter">
                <MailIcon className="h-4 w-4" />
                Comms
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center gap-2" data-testid="hub-tab-compliance">
                <ShieldCheck className="h-4 w-4" />
                SOA / ROA
              </TabsTrigger>
              <TabsTrigger value="docusign" className="flex items-center gap-2" data-testid="hub-tab-docusign">
                <FileSignature className="h-4 w-4" />
                E-Signatures
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="search-input"
                />
              </div>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                {["all", "active", "prospect", "review"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={statusFilter === status ? "bg-[#1a2744]" : ""}
                  >
                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* All Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <Card 
                  key={client.client_id} 
                  className="cursor-pointer hover:border-[#D4A84C] transition-all group"
                  onClick={() => selectClient(client)}
                  data-testid={`client-card-${client.client_id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 bg-[#1a2744]">
                          <AvatarFallback className="text-white bg-[#1a2744]">
                            {client.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusColors[client.status]}>
                        {client.status}
                      </Badge>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Wealth</p>
                        <p className="text-xl font-bold">{formatCurrency(client.total_wealth)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Accounts</p>
                        <p className="text-lg font-semibold">{client.accounts?.length || 0}</p>
                      </div>
                    </div>

                    {/* Account breakdown */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {client.accounts?.slice(0, 3).map((account, idx) => {
                        const Icon = getAccountIcon(account.type);
                        return (
                          <div key={`item-${idx}`} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-1">
                            <Icon className="h-3 w-3" />
                            <span>{formatCurrency(account.balance)}</span>
                          </div>
                        );
                      })}
                      {(client.accounts?.length || 0) > 3 && (
                        <span className="text-xs text-muted-foreground">+{client.accounts.length - 3} more</span>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {client.risk_profile || "Balanced"}
                      </span>
                      <Button variant="ghost" size="sm" className="group-hover:text-[#D4A84C]">
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No clients found matching your search</p>
              </div>
            )}
          </TabsContent>

          {/* Portfolio Overview Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Asset Allocation by Type */}
              <Card className="col-span-full lg:col-span-2">
                <CardHeader>
                  <CardTitle>Portfolio by Asset Type</CardTitle>
                  <CardDescription>Total holdings across all clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(assetsByType).sort((a, b) => b[1].total - a[1].total).map(([type, data]) => {
                      const Icon = getAccountIcon(type);
                      const percentage = totalAUM > 0 ? (data.total / totalAUM) * 100 : 0;
                      return (
                        <div key={type} className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className="h-5 w-5 text-[#1a2744]" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{type}</span>
                              <span className="font-semibold">{formatCurrency(data.total)}</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>{data.count} accounts</span>
                              <span>{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Top Clients by AUM */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Clients by AUM</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...clients].sort((a, b) => (b.total_wealth || 0) - (a.total_wealth || 0)).slice(0, 5).map((client, idx) => (
                      <div 
                        key={client.client_id} 
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => selectClient(client)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-5">#{idx + 1}</span>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-[#1a2744] text-white">
                              {client.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{client.name}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(client.total_wealth)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Client Activity</CardTitle>
                <CardDescription>Latest interactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.slice(0, 8).map((client) => (
                    <div 
                      key={client.client_id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-[#D4A84C] cursor-pointer"
                      onClick={() => selectClient(client)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[#1a2744] text-white">
                            {client.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.recent_activity || "Profile updated"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={statusColors[client.status]}>
                          {client.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {client.last_contact || "Today"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CRM — Segmentations */}
          <TabsContent value="segments" className="space-y-4">
            <ErrorBoundary label="Segmentations">
              <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" /></div>}>
                <ClientSegmentations />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* CRM — Newsletters & Comms */}
          <TabsContent value="newsletter" className="space-y-4">
            <ErrorBoundary label="Newsletter">
              <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" /></div>}>
                <NewsletterBuilder />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* CRM — SOA / ROA Compliance */}
          <TabsContent value="compliance" className="space-y-4">
            <ErrorBoundary label="Compliance">
              <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" /></div>}>
                <ComplianceTracker />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>

          {/* CRM — E-Signatures */}
          <TabsContent value="docusign" className="space-y-4">
            <ErrorBoundary label="E-Signatures">
              <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" /></div>}>
                <DocuSignMock />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>

      {/* Client Create Modal */}
      <ClientModal
        open={showClientModal}
        onOpenChange={setShowClientModal}
        onSuccess={(newClient) => {
          fetchData();
          toast.success(`Client "${newClient.name}" created successfully`);
        }}
      />
    </Layout>
  );
};

export default AdviserHub;
