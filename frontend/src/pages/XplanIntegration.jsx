import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Link2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Users,
  Briefcase,
  Target,
  FileText,
  Clock,
  AlertCircle,
  Zap,
  Database,
  ArrowLeftRight,
  Shield,
  Eye,
  EyeOff,
  Play,
  Loader2,
  ChevronRight,
  Building2,
  Wallet,
  TrendingUp,
  PiggyBank
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const XplanIntegration = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Configuration form
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [configForm, setConfigForm] = useState({
    site_url: "",
    username: "",
    password: "",
    app_id: "wealth-command",
    use_2fa: false
  });
  const [testingConnection, setTestingConnection] = useState(false);
  
  // Synced data
  const [clients, setClients] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);
  
  // Fetch connection status on mount
  useEffect(() => {
    fetchConnectionStatus();
    fetchSyncHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const fetchConnectionStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/xplan/status`);
      setConnectionStatus(response.data);
      
      if (response.data.connected) {
        fetchClients();
      }
    } catch (error) {
      console.error("Error fetching Xplan status:", error);
      setConnectionStatus({ connected: false, mode: "error" });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/xplan/clients`);
      setClients(response.data.clients || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };
  
  const fetchSyncHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/xplan/sync-history`);
      setSyncHistory(response.data.history || []);
    } catch (error) {
      console.error("Error fetching sync history:", error);
    }
  };
  
  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await axios.post(`${API_URL}/api/xplan/test-connection`, {
        site_url: configForm.site_url,
        username: configForm.username,
        password: configForm.password,
        app_id: configForm.app_id
      });
      
      if (response.data.success) {
        toast.success("Connection successful!");
      } else {
        toast.error(response.data.error || "Connection failed");
      }
      return response.data.success;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Connection test failed");
      return false;
    } finally {
      setTestingConnection(false);
    }
  };
  
  const saveConfiguration = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/xplan/configure`, {
        ...configForm,
        auth_method: configForm.use_2fa ? "basic_2fa" : "basic"
      });
      
      if (response.data.success) {
        toast.success("Xplan configuration saved!");
        setConfigDialogOpen(false);
        fetchConnectionStatus();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save configuration");
    }
  };
  
  const enableDemoMode = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/xplan/enable-demo`);
      if (response.data.success) {
        toast.success("Demo mode enabled!");
        fetchConnectionStatus();
      }
    } catch (error) {
      toast.error("Failed to enable demo mode");
    }
  };
  
  const startSync = async (syncType = "full") => {
    setSyncing(true);
    setSyncProgress(0);
    
    try {
      const response = await axios.post(`${API_URL}/api/xplan/sync`, {
        advisor_id: "default",
        sync_type: syncType
      });
      
      if (response.data.success) {
        toast.success("Sync started!");
        
        // Simulate progress
        const interval = setInterval(() => {
          setSyncProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setSyncing(false);
              fetchClients();
              fetchSyncHistory();
              fetchConnectionStatus();
              toast.success("Sync completed!");
              return 100;
            }
            return prev + 10;
          });
        }, 500);
      }
    } catch (error) {
      toast.error("Sync failed");
      setSyncing(false);
    }
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4A84C]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="xplan-integration">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Link2 className="h-7 w-7 text-[#D4A84C]" />
              Xplan Integration
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect to IRESS Xplan - Your System of Record
            </p>
          </div>
          <div className="flex items-center gap-3">
            {connectionStatus?.connected ? (
              <Badge className="bg-emerald-100 text-emerald-700 px-4 py-2">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {connectionStatus.mode === "demo" ? "Demo Mode" : "Connected"}
              </Badge>
            ) : (
              <Badge variant="secondary" className="px-4 py-2">
                <XCircle className="h-4 w-4 mr-2" />
                Not Connected
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={() => setConfigDialogOpen(true)}
              data-testid="configure-xplan-btn"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {connectionStatus?.connected && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-100">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{clients.length}</p>
                    <p className="text-sm text-muted-foreground">Synced Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-100">
                    <RefreshCw className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{formatDate(connectionStatus.last_sync)}</p>
                    <p className="text-sm text-muted-foreground">Last Sync</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-100">
                    <Database className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate max-w-[150px]">{connectionStatus.site_url}</p>
                    <p className="text-sm text-muted-foreground">Xplan Site</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-100">
                    <ArrowLeftRight className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{connectionStatus.sync_status}</p>
                    <p className="text-sm text-muted-foreground">Sync Status</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Synced Clients</TabsTrigger>
            <TabsTrigger value="sync">Sync & Push</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {!connectionStatus?.connected ? (
              <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] text-white">
                <CardContent className="p-8 text-center">
                  <Link2 className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <h2 className="text-2xl font-bold mb-2">Connect to Xplan</h2>
                  <p className="text-white/70 mb-6 max-w-md mx-auto">
                    Link your IRESS Xplan account to sync client data, portfolios, and push insights back to your system of record.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button
                      className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                      onClick={() => setConfigDialogOpen(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Connect Xplan
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                      onClick={enableDemoMode}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Try Demo Mode
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Integration Architecture */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-[#D4A84C]" />
                      Integration Architecture
                    </CardTitle>
                    <CardDescription>
                      How Wealth Command works with Xplan
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                      <div className="p-2 rounded bg-blue-100">
                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">Xplan</p>
                        <p className="text-sm text-blue-700">System of Record • Compliance • Storage</p>
                      </div>
                      <ArrowLeftRight className="h-5 w-5 text-blue-400" />
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
                      <div className="p-2 rounded bg-amber-100">
                        <Zap className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-amber-900">Wealth Command</p>
                        <p className="text-sm text-amber-700">System of Intelligence • Modelling • Actions</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-emerald-600" />
                        <span>Pull: Clients, portfolios, assets, goals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-blue-600" />
                        <span>Push: Strategies, scenarios, documents</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-purple-600" />
                        <span>Sync: Continuous two-way updates</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#D4A84C]" />
                      Data Categories
                    </CardTitle>
                    <CardDescription>
                      What data syncs between systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Users, label: "Client Demographics", desc: "Names, contacts, DOB" },
                        { icon: FileText, label: "Fact Find Data", desc: "Income, expenses, tax" },
                        { icon: Briefcase, label: "Portfolio Holdings", desc: "Investments, super" },
                        { icon: Building2, label: "Assets & Liabilities", desc: "Property, loans" },
                        { icon: Target, label: "Goals & Plans", desc: "Retirement, savings" },
                        { icon: Shield, label: "Risk Profile", desc: "Tolerance, capacity" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <item.icon className="h-5 w-5 text-[#D4A84C] mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Quick Actions */}
            {connectionStatus?.connected && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => startSync("full")}
                      disabled={syncing}
                      className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                      data-testid="full-sync-btn"
                    >
                      {syncing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Full Sync from Xplan
                    </Button>
                    <Button variant="outline" onClick={() => startSync("clients")}>
                      <Users className="h-4 w-4 mr-2" />
                      Sync Clients Only
                    </Button>
                    <Button variant="outline" onClick={() => startSync("portfolios")}>
                      <Briefcase className="h-4 w-4 mr-2" />
                      Sync Portfolios
                    </Button>
                    <Button variant="outline" onClick={() => startSync("goals")}>
                      <Target className="h-4 w-4 mr-2" />
                      Sync Goals
                    </Button>
                  </div>
                  
                  {syncing && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Syncing...</span>
                        <span>{syncProgress}%</span>
                      </div>
                      <Progress value={syncProgress} className="h-2" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Synced Clients from Xplan</CardTitle>
                    <CardDescription>
                      {clients.length} clients synced from your Xplan instance
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => startSync("clients")}
                    disabled={syncing}
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No clients synced yet</p>
                    <p className="text-sm">Click "Full Sync" to pull client data from Xplan</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {clients.map((client) => (
                        <div
                          key={client.entity_id}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                          data-testid={`xplan-client-${client.entity_id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a2744] flex items-center justify-center text-white font-medium">
                              {client.first_name?.[0]}{client.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium">{client.first_name} {client.last_name}</p>
                              <p className="text-sm text-muted-foreground">{client.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <Badge variant="outline">{client.risk_profile || "Not set"}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Synced: {formatDate(client.synced_at)}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync & Push Tab */}
          <TabsContent value="sync" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pull from Xplan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-emerald-600" />
                    Pull from Xplan
                  </CardTitle>
                  <CardDescription>
                    Import data from your Xplan system of record
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { type: "clients", label: "Client Demographics", icon: Users, desc: "Names, contacts, fact find data" },
                    { type: "portfolios", label: "Portfolio Holdings", icon: Briefcase, desc: "Investments, super, platform data" },
                    { type: "assets", label: "Assets & Liabilities", icon: Wallet, desc: "Property, vehicles, loans" },
                    { type: "goals", label: "Goals & Plans", icon: Target, desc: "Financial objectives, timelines" },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startSync(item.type)}
                        disabled={syncing}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Pull
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Push to Xplan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    Push to Xplan
                  </CardTitle>
                  <CardDescription>
                    Send insights and outputs back to Xplan for compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { type: "strategy", label: "Strategy Recommendations", icon: Zap, desc: "Generated advice strategies" },
                    { type: "scenario", label: "Scenario Outputs", icon: TrendingUp, desc: "What-if modelling results" },
                    { type: "document", label: "Documents & Reports", icon: FileText, desc: "SOA inputs, reports" },
                    { type: "note", label: "Notes & Comments", icon: FileText, desc: "Meeting notes, file notes" },
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Select Client</Badge>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Select a client first, then push data from their profile or scenario results.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
                <CardDescription>Recent synchronization activity</CardDescription>
              </CardHeader>
              <CardContent>
                {syncHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sync history yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {syncHistory.map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-4">
                            {log.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : log.status === "failed" ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                            )}
                            <div>
                              <p className="font-medium capitalize">{log.sync_type} Sync</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(log.started_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={log.status === "completed" ? "default" : log.status === "failed" ? "destructive" : "secondary"}>
                              {log.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {log.records_synced} records
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Configuration Dialog */}
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Configure Xplan Connection</DialogTitle>
              <DialogDescription>
                Enter your IRESS Xplan credentials to connect your system of record.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="site_url">Xplan Site URL</Label>
                <Input
                  id="site_url"
                  placeholder="yoursite.xplan.iress.com.au"
                  value={configForm.site_url}
                  onChange={(e) => setConfigForm({ ...configForm, site_url: e.target.value })}
                  data-testid="xplan-site-url-input"
                />
                <p className="text-xs text-muted-foreground">
                  Enter "demo" to use demo mode without real credentials
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Your Xplan username"
                  value={configForm.username}
                  onChange={(e) => setConfigForm({ ...configForm, username: e.target.value })}
                  data-testid="xplan-username-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your Xplan password"
                    value={configForm.password}
                    onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })}
                    data-testid="xplan-password-input"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="app_id">App ID (Optional)</Label>
                <Input
                  id="app_id"
                  placeholder="wealth-command"
                  value={configForm.app_id}
                  onChange={(e) => setConfigForm({ ...configForm, app_id: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="use_2fa"
                    checked={configForm.use_2fa}
                    onCheckedChange={(checked) => setConfigForm({ ...configForm, use_2fa: checked })}
                  />
                  <Label htmlFor="use_2fa">Enable 2FA</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={testConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
              <Button
                className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                onClick={saveConfiguration}
                data-testid="save-xplan-config-btn"
              >
                Save Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default XplanIntegration;
