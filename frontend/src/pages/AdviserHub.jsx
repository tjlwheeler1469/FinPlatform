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
        <div className="flex items-start justify-between gap-4 pb-1 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4A84C]" />
              Practice
            </div>
            <h1 className="text-3xl font-bold text-[#1a2744] mt-1">Client Hub</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {clients.length} households · all client communications, compliance and e-signatures start here
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowClientModal(true)}
              className="bg-[#1a2744] hover:bg-[#1a2744]/90 shadow-sm"
              data-testid="add-client-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </div>
        </div>

        {/* Summary Stats — compact ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-medium">Total AUM</p>
              <p className="text-2xl font-bold mt-0.5">{formatCurrency(totalAUM)}</p>
              <p className="text-[10px] text-white/50 mt-1">Across {clients.length} households</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Active Clients</p>
              <p className="text-2xl font-bold mt-0.5 text-[#1a2744]">{clients.filter((c) => c.status === "active").length}</p>
              <p className="text-[10px] text-emerald-600 mt-1">●︎ Engaged &amp; current</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Prospects</p>
              <p className="text-2xl font-bold mt-0.5 text-[#1a2744]">{clients.filter((c) => c.status === "prospect").length}</p>
              <p className="text-[10px] text-blue-600 mt-1">◐ In pipeline</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Reviews Due</p>
              <p className="text-2xl font-bold mt-0.5 text-amber-600">{clients.filter((c) => c.status === "review").length}</p>
              <p className="text-[10px] text-amber-600 mt-1">⚑ Action needed</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Accounts</p>
              <p className="text-2xl font-bold mt-0.5 text-[#1a2744]">{totalAccounts}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Linked custodians</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-white border h-11 p-1 gap-0.5">
              <TabsTrigger value="clients" className="gap-1.5 text-xs sm:text-sm px-3 rounded-md data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                All Clients
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-1.5 text-xs sm:text-sm px-3 rounded-md data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <PieChart className="h-4 w-4" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5 text-xs sm:text-sm px-3 rounded-md data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Activity className="h-4 w-4" />
                Activity
              </TabsTrigger>
              <div className="w-px bg-gray-200 mx-1 h-6 self-center" />
              <TabsTrigger value="segments" className="gap-1.5 text-xs sm:text-sm px-3 rounded-md data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:shadow-sm" data-testid="hub-tab-segments">
                <Sparkles className="h-4 w-4" />
                Segments
              </TabsTrigger>
              <TabsTrigger value="newsletter" className="gap-1.5 text-xs sm:text-sm px-3 rounded-md data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:shadow-sm" data-testid="hub-tab-newsletter">
                <MailIcon className="h-4 w-4" />
                Comms
              </TabsTrigger>
              <TabsTrigger value="compliance" className="gap-1.5 text-xs sm:text-sm px-3 rounded-md data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:shadow-sm" data-testid="hub-tab-compliance">
                <ShieldCheck className="h-4 w-4" />
                SOA / ROA
              </TabsTrigger>
              <TabsTrigger value="docusign" className="gap-1.5 text-xs sm:text-sm px-3 rounded-md data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:shadow-sm" data-testid="hub-tab-docusign">
                <FileSignature className="h-4 w-4" />
                E-Sign
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
              {filteredClients.map((client) => {
                const tw = client.total_wealth || 0;
                const tier = tw >= 20_000_000 ? { label: "Platinum", accent: "from-slate-600 to-slate-800", ring: "ring-slate-300", chip: "bg-slate-100 text-slate-700 border-slate-200" } :
                             tw >= 10_000_000 ? { label: "Gold", accent: "from-[#D4A84C] to-[#b8892f]", ring: "ring-amber-200", chip: "bg-amber-50 text-amber-700 border-amber-200" } :
                             tw >= 5_000_000 ? { label: "Silver", accent: "from-slate-400 to-slate-500", ring: "ring-slate-200", chip: "bg-slate-50 text-slate-600 border-slate-200" } :
                             { label: "Bronze", accent: "from-amber-700 to-amber-900", ring: "ring-amber-200", chip: "bg-amber-50 text-amber-800 border-amber-200" };
                const statusAccent =
                  client.status === "active" ? { bar: "bg-emerald-500", dot: "bg-emerald-500" } :
                  client.status === "review" ? { bar: "bg-amber-500", dot: "bg-amber-500" } :
                  client.status === "prospect" ? { bar: "bg-blue-500", dot: "bg-blue-500" } :
                  { bar: "bg-slate-300", dot: "bg-slate-300" };
                return (
                  <Card
                    key={client.client_id}
                    className="relative overflow-hidden cursor-pointer border border-gray-200 hover:border-[#1a2744] hover:-translate-y-0.5 hover:shadow-md transition-all group"
                    onClick={() => selectClient(client)}
                    data-testid={`client-card-${client.client_id}`}
                  >
                    {/* Status-coloured left accent bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusAccent.bar}`} />

                    <CardContent className="p-5">
                      {/* Tier chip — top right corner */}
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className={`text-[9px] uppercase tracking-wide ${tier.chip}`}>{tier.label}</Badge>
                      </div>

                      {/* Header */}
                      <div className="flex items-center gap-3 mb-4 pr-16">
                        <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${tier.accent} flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ${tier.ring} flex-shrink-0`}>
                          {client.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-[#1a2744] truncate">{client.name}</h3>
                          <p className="text-[11px] text-muted-foreground truncate">{client.email}</p>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${statusAccent.dot}`} />{client.status}
                          </span>
                        </div>
                      </div>

                      {/* Key metrics */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium">Wealth</p>
                          <p className="text-lg font-bold text-[#1a2744]">{formatCurrency(client.total_wealth)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium">Accounts</p>
                          <p className="text-lg font-bold text-[#1a2744]">{client.accounts?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium">Risk</p>
                          <p className="text-sm font-semibold text-[#1a2744] leading-tight mt-1">{client.risk_profile || "—"}</p>
                        </div>
                      </div>

                      {/* Account breakdown chips */}
                      <div className="mt-3 flex flex-wrap gap-1.5 min-h-[24px]">
                        {client.accounts?.slice(0, 3).map((account, idx) => {
                          const Icon = getAccountIcon(account.type);
                          return (
                            <div key={`item-${idx}`} className="flex items-center gap-1 text-[10px] bg-gray-50 text-gray-700 rounded px-1.5 py-0.5 border border-gray-100">
                              <Icon className="h-2.5 w-2.5" />
                              <span className="font-medium">{formatCurrency(account.balance)}</span>
                            </div>
                          );
                        })}
                        {(client.accounts?.length || 0) > 3 && (
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5">+{client.accounts.length - 3}</span>
                        )}
                      </div>

                      {/* Footer CTA */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Next review:</span>
                          <span className="text-[#1a2744] font-medium">{client.next_review || "Not scheduled"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-[#1a2744] group-hover:text-[#D4A84C] transition-colors">
                          Open profile
                          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
