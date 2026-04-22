import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FileText,
  LineChart,
  PieChart,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  AlertCircle,
  XCircle,
  Video,
  Phone,
  MapPin,
  Scale,
  Search,
  MessageSquare,
  Send,
  User,
  Building,
  Home,
  Receipt,
  Percent,
  Activity,
  ExternalLink,
  Play,
  Settings,
  Bot,
  LayoutDashboard,
  Globe,
  Sliders
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";
import KnowledgeGraphPanel from "@/components/KnowledgeGraphPanel";
import ClientPackScheduler from "@/components/ClientPackScheduler";
import DecisionCenter from "@/pages/DecisionCenter";
import DailyBriefing from "@/pages/DailyBriefing";
import MarketsStrip from "@/components/MarketsStrip"; // eslint-disable-line no-unused-vars
import { CLIENT_DATA, computeClientTotals } from "@/data/clientData";
import { navigateToClient, resolveClientSlug } from "@/lib/navigateToClient";
import { generateReviewPackPDF } from "@/lib/pdfGenerator";

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// ===== THE ULTIMATE ADVISOR COMMAND CENTER =====
// Following the exact 10-zone layout for the world's best wealth platform

const AdvisorCommandCenter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [graphOverview, setGraphOverview] = useState(null);
  const [graphInsights, setGraphInsights] = useState([]);
  const [topTab, setTopTab] = useState("dashboard");
  
  const [data, setData] = useState({
    commandCenter: null,
    monitoring: null,
    taxOpportunities: null,
    intelligence: null,
    practiceHealth: null,
    clients: null,
    nextActions: null
  });

  const fetchAllData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [commandRes, monitoringRes, taxRes, intelligenceRes, practiceRes, clientsRes, actionsRes, graphOverviewRes, graphInsightsRes] = await Promise.all([
        fetch(`${API_URL}/api/command-center/daily-digest`),
        fetch(`${API_URL}/api/monitoring/daily-scan`),
        fetch(`${API_URL}/api/intelligence/tax-opportunities`),
        fetch(`${API_URL}/api/monitoring/book-insights`),
        fetch(`${API_URL}/api/practice-health/dashboard`),
        fetch(`${API_URL}/api/intelligence/comprehensive-analysis`),
        fetch(`${API_URL}/api/next-action/today?limit=8`),
        fetch(`${API_URL}/api/graph/overview`),
        fetch(`${API_URL}/api/graph/insights`)
      ]);
      
      const [command, monitoring, tax, intelligence, practice, clients, actions, graphOv, graphIns] = await Promise.all([
        commandRes.ok ? commandRes.json() : null,
        monitoringRes.ok ? monitoringRes.json() : null,
        taxRes.ok ? taxRes.json() : null,
        intelligenceRes.ok ? intelligenceRes.json() : null,
        practiceRes.ok ? practiceRes.json() : null,
        clientsRes.ok ? clientsRes.json() : null,
        actionsRes.ok ? actionsRes.json() : null,
        graphOverviewRes.ok ? graphOverviewRes.json() : null,
        graphInsightsRes.ok ? graphInsightsRes.json() : null
      ]);
      
      setData({ 
        commandCenter: command, 
        monitoring: monitoring, 
        taxOpportunities: tax, 
        intelligence: intelligence,
        practiceHealth: practice,
        clients: clients,
        nextActions: actions
      });
      setGraphOverview(graphOv);
      setGraphInsights(graphIns?.insights || []);
      
      if (showRefreshToast) {
        toast.success("Dashboard refreshed");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => fetchAllData(false), 300000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleCopilotQuery = async () => {
    if (!copilotQuery.trim()) return;
    setCopilotLoading(true);
    
    try {
      // Try Knowledge Graph AI first, fall back to copilot
      const graphRes = await fetch(`${API_URL}/api/graph/ai/ask?question=${encodeURIComponent(copilotQuery)}`);
      if (graphRes.ok) {
        const data = await graphRes.json();
        setCopilotResponse(data);
      } else {
        const res = await fetch(`${API_URL}/api/copilot/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: copilotQuery, context: "advisor_command_center" })
        });
        if (res.ok) {
          const data = await res.json();
          setCopilotResponse(data);
        }
      }
    } catch (err) {
      toast.error("AI assistant unavailable");
    } finally {
      setCopilotLoading(false);
    }
  };

  const generateMeetingPrep = async (client) => {
    try {
      const res = await fetch(`${API_URL}/api/meeting-prep/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          client_name: client.name,
          meeting_type: "review",
          portfolio_value: client.aum || 1000000,
          ytd_return: 0.084,
          retirement_probability: client.retirement_probability || 75,
          risk_profile: client.risk_profile || "balanced",
          age: client.age || 45
        })
      });
      
      if (res.ok) {
        const prep = await res.json();
        setSelectedClient({ ...client, meetingPrep: prep });
        toast.success("Meeting prep generated");
      }
    } catch (err) {
      toast.error("Failed to generate meeting prep");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]" data-testid="command-center-loading">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-[#1a2744]" />
            <p className="text-muted-foreground">Loading Command Center...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { commandCenter, monitoring, taxOpportunities, intelligence, practiceHealth, clients, nextActions } = data;

  // HNW portfolio totals derived from centralized clientData.js (up to $25M per client).
  const HNW_SLUGS = ["thompson_family", "chen_family", "client_3", "client_4", "client_5", "client_6", "client_7"];
  const hnwTotals = HNW_SLUGS.reduce((acc, slug) => {
    const t = computeClientTotals(slug);
    acc.aum += t.grossAssets;
    acc.netWorth += t.netWorth;
    return acc;
  }, { aum: 0, netWorth: 0 });

  // Key Metrics — prefer backend, fallback to HNW-scaled totals
  const totalAUM = practiceHealth?.key_metrics?.total_aum || commandCenter?.metrics?.total_aum || hnwTotals.aum;
  const totalClients = practiceHealth?.key_metrics?.total_clients || commandCenter?.metrics?.total_clients || 164;
  const netFlows = Math.round(totalAUM * 0.028); // ~2.8% monthly net inflows
  const revenue = practiceHealth?.key_metrics?.total_revenue || Math.round(totalAUM * 0.011); // ~1.1% of AUM
  const healthScore = practiceHealth?.health_score?.overall_score || 84;
  const healthGrade = practiceHealth?.health_score?.grade || "B+";
  
  // Next Best Actions data
  const topActions = nextActions?.top_actions || [];
  const focusMessage = nextActions?.focus_message || "Loading actions...";
  const actionImpact = nextActions?.impact_summary || {};
  
  // Key Alerts
  const portfoliosDrifted = monitoring?.alert_summary?.allocation_drift || 11;
  const taxOppsCount = taxOpportunities?.total_clients_with_opportunities || 6;
  const retirementRisks = 3;
  const idleCashClients = intelligence?.book_wide_insights?.find(i => i.insight?.includes("idle cash"))?.count || 8;

  // Client list for cross-client intelligence — built from HNW centralized data
  const HNW_CLIENT_LIST = HNW_SLUGS.map((slug, idx) => {
    const c = CLIENT_DATA[slug];
    const t = computeClientTotals(slug);
    const statusMap = ["needs_attention", "on_track", "at_risk", "on_track", "needs_attention", "review_due", "on_track"];
    return {
      id: slug,
      name: c?.profile?.name || slug,
      aum: t.grossAssets,
      risk_profile: c?.profile?.riskProfile || "Balanced",
      status: statusMap[idx % statusMap.length],
      type: idx === 1 || idx === 5 ? "Trust" : idx === 2 ? "SMSF" : idx === 4 ? "Company" : "Family",
      age: c?.profile?.age || 50,
    };
  });
  const clientList = clients?.client_analyses || HNW_CLIENT_LIST;

  // Tasks for workflow panel
  const tasks = commandCenter?.tasks || [
    { id: 1, title: "Meeting with Sarah Chen", due: "Tomorrow 10:00 AM", type: "meeting", priority: "high", client: "Chen Investment Trust" },
    { id: 2, title: "Review estate plan", due: "This week", type: "review", priority: "medium", client: "Thompson SMSF" },
    { id: 3, title: "Client onboarding", due: "Today", type: "onboarding", priority: "high", client: "New Client - David Patel" },
    { id: 4, title: "Annual review preparation", due: "Next week", type: "compliance", priority: "medium", client: "Thompson Family" },
    { id: 5, title: "Rebalancing approval", due: "Today", type: "portfolio", priority: "high", client: "Patel Holdings" }
  ];

  // Market data
  const marketData = {
    asx200: { value: 8245.30, change: 1.2 },
    sp500: { value: 5892.10, change: 0.8 },
    audusd: { value: 0.6534, change: -0.3 },
    bondYield: { value: 4.25, change: 0.05 }
  };

  return (
    <Layout>
      <div className="space-y-4" data-testid="advisor-command-center">
        
        {/* ===== ZONE 1: TOP NAVIGATION BAR ===== */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-[#D4A84C]" />
              <div>
                <h1 className="text-xl font-bold text-[#1a2744]">Adviser Dashboard</h1>
                <p className="text-xs text-muted-foreground">Your daily operating system</p>
              </div>
            </div>
          </div>
          
          {/* Global Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients, portfolios, insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50"
              />
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/ai-copilot')} className="hidden lg:flex">
              <Bot className="h-4 w-4 mr-2" />
              AI Copilot
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/notifications')} className="relative">
              <Bell className="h-4 w-4" />
              {monitoring?.total_alerts > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {monitoring.total_alerts}
                </span>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ===== Dashboard & Briefing (single, high-level view) ===== */}
        <div className="space-y-4" data-testid="dashboard-briefing">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white">
            <CardContent className="pt-4 pb-4">
              <p className="text-white/70 text-xs font-medium">Assets Under Advice</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAUM)}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">+2.3% MTD</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-muted-foreground text-xs font-medium">Clients</p>
              <p className="text-2xl font-bold text-[#1a2744]">{totalClients}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">+3 this month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-muted-foreground text-xs font-medium">Net Flows</p>
              <p className="text-2xl font-bold text-[#1a2744]">+{formatCurrency(netFlows)}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">Inflows</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-muted-foreground text-xs font-medium">Revenue (YTD)</p>
              <p className="text-2xl font-bold text-[#1a2744]">{formatCurrency(revenue)}</p>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">+12% YoY</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className={monitoring?.high_priority_alerts > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <CardContent className="pt-4 pb-4">
              <p className="text-muted-foreground text-xs font-medium">Risk Alerts</p>
              <p className={`text-2xl font-bold ${monitoring?.high_priority_alerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {monitoring?.high_priority_alerts || 0}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle className={`h-3 w-3 ${monitoring?.high_priority_alerts > 0 ? 'text-red-500' : 'text-green-500'}`} />
                <span className={`text-xs ${monitoring?.high_priority_alerts > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {monitoring?.high_priority_alerts > 0 ? 'Needs attention' : 'All clear'}
                </span>
              </div>
            </CardContent>
          </Card>
          
          {/* Practice Health Score */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-4 pb-4">
              <p className="text-muted-foreground text-xs font-medium">Practice Health</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-emerald-600">{healthScore}</p>
                <span className="text-lg font-bold text-emerald-700">{healthGrade}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-xs text-emerald-500">+3 pts vs Q4</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== NEXT BEST ACTION ENGINE - THE KILLER FEATURE ===== */}
        <Card className="border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="h-6 w-6 text-emerald-600" />
                  Next Best Actions
                  <Badge className="bg-emerald-500 text-white text-[10px] ml-2">AI-POWERED</Badge>
                </CardTitle>
                <CardDescription>{focusMessage}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-white">
                  {topActions.length} actions • {actionImpact.clients_needing_rebalance || 0} rebalance
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {topActions.slice(0, 4).map((action, i) => (
                <div 
                  key={action.id || i}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-lg ${
                    action.priority === 'critical' ? 'border-red-400 bg-red-50 hover:border-red-500' :
                    action.priority === 'high' ? 'border-orange-400 bg-orange-50 hover:border-orange-500' :
                    'border-blue-300 bg-blue-50 hover:border-blue-400'
                  }`}
                  onClick={() => setSelectedAction(action)}
                  data-testid={`next-action-${i}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-[10px] ${
                      action.priority === 'critical' ? 'bg-red-500' :
                      action.priority === 'high' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`}>
                      {action.priority?.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {action.category}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{action.title}</h4>
                  {/* Client pill — clickable, navigates to that client's dashboard */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const slug = resolveClientSlug(action.client_id || action.client_name);
                      if (slug) navigateToClient(navigate, slug);
                      else toast.info(`No client context for "${action.client_name}"`);
                    }}
                    className="text-xs text-[#1a2744] font-medium underline-offset-2 hover:underline mb-2 block text-left"
                    data-testid={`next-action-${i}-client`}
                  >
                    👤 {action.client_name}
                  </button>
                  <p className="text-xs text-gray-600 line-clamp-2">{action.description}</p>
                  {action.impact_value && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium text-emerald-600">
                        Impact: {typeof action.impact_value === 'number' ? formatCurrency(action.impact_value) : action.impact_value}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-muted-foreground">
                      {action.estimated_time}
                    </span>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-6 px-2 text-xs bg-[#1a2744] hover:bg-[#1a2744]/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        const slug = resolveClientSlug(action.client_id || action.client_name);
                        if (slug) {
                          navigateToClient(navigate, slug, { tab: action.category?.toLowerCase() });
                        } else {
                          toast.info(`Executing: ${action.title}`);
                        }
                      }}
                      data-testid={`next-action-${i}-execute`}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Execute
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Selected Action Expanded View */}
            {selectedAction && (
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-emerald-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${
                        selectedAction.priority === 'critical' ? 'bg-red-500' :
                        selectedAction.priority === 'high' ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {selectedAction.priority?.toUpperCase()}
                      </Badge>
                      <h3 className="text-lg font-bold">{selectedAction.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedAction.client_name} • {selectedAction.category}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAction(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Action Steps
                    </h4>
                    <ul className="space-y-1">
                      {selectedAction.action_steps?.map((step, i) => (
                        <li key={`item-${i}`} className="text-xs flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Impact
                    </h4>
                    <div className="space-y-2">
                      {selectedAction.impact_value && (
                        <div className="p-2 bg-emerald-50 rounded text-xs">
                          <span className="font-medium text-emerald-700">
                            Value: {typeof selectedAction.impact_value === 'number' ? formatCurrency(selectedAction.impact_value) : selectedAction.impact_value}
                          </span>
                        </div>
                      )}
                      {selectedAction.deadline && (
                        <div className="p-2 bg-orange-50 rounded text-xs">
                          <span className="font-medium text-orange-700">
                            Deadline: {selectedAction.deadline}
                          </span>
                        </div>
                      )}
                      <div className="p-2 bg-blue-50 rounded text-xs">
                        <span className="font-medium text-blue-700">
                          Time: {selectedAction.estimated_time} • Risk: {selectedAction.risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Quick Execute</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        {selectedAction.one_click_action?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" size="sm">
                        <Zap className="h-4 w-4 mr-2" />
                        Execute Now
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/client-wealth?client=${selectedAction.client_id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Tax savings available: <strong className="text-emerald-600">{formatCurrency(actionImpact.potential_tax_savings || 0)}</strong></span>
                <span>Revenue at risk: <strong className="text-orange-600">{formatCurrency(actionImpact.revenue_at_risk || 0)}</strong></span>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/next-best-actions')} data-testid="view-all-actions-btn">
                View All Actions
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===== ZONE 3: ADVISOR INTELLIGENCE FEED ===== */}
        <Card className="border-2 border-[#D4A84C]/30 bg-gradient-to-r from-amber-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="h-6 w-6 text-[#D4A84C]" />
                  Advisor Intelligence Feed
                </CardTitle>
                <CardDescription>What requires your attention today</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Live • Updated {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Portfolio Drift */}
              <div 
                className="p-4 bg-white rounded-lg border border-orange-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/portfolio-analyzer')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <PieChart className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-3xl font-bold text-orange-600">{portfoliosDrifted}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Portfolios drifted from allocation</p>
                <p className="text-xs text-muted-foreground mt-1">Rebalancing recommended</p>
              </div>

              {/* Tax Opportunities */}
              <div 
                className="p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/tax-analysis')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-3xl font-bold text-green-600">{taxOppsCount}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Tax-loss harvesting opportunities</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${taxOpportunities?.total_potential_tax_savings?.toLocaleString() || '28,500'} potential savings
                </p>
              </div>

              {/* Retirement Risks */}
              <div 
                className="p-4 bg-white rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/strategic-planning')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Target className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-3xl font-bold text-red-600">{retirementRisks}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Clients nearing retirement shortfall</p>
                <p className="text-xs text-muted-foreground mt-1">Action required before EOFY</p>
              </div>

              {/* Idle Cash */}
              <div 
                className="p-4 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate('/client-crm')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-3xl font-bold text-blue-600">{idleCashClients}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">Clients holding &gt;$150k idle cash</p>
                <p className="text-xs text-muted-foreground mt-1">Investment opportunity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid: 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* ===== ZONE 5: CLIENT INSIGHTS PANEL ===== */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-[#1a2744]" />
                Client Insights
              </CardTitle>
              <CardDescription className="text-xs">Cross-client intelligence</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {intelligence?.book_wide_insights?.slice(0, 6).map((insight, i) => (
                    <div 
                      key={`item-${i}`} 
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => navigate('/intelligence')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={insight.severity === 'high' ? 'destructive' : insight.severity === 'medium' ? 'default' : 'secondary'} className="text-xs">
                          {insight.count} clients
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">{insight.insight}</p>
                      {insight.action && (
                        <p className="text-xs text-muted-foreground mt-1">{insight.action}</p>
                      )}
                    </div>
                  )) || (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Badge className="bg-blue-500 text-xs mb-1">18 clients</Badge>
                        <p className="text-sm font-medium">Holding &gt;$150k excess cash</p>
                        <p className="text-xs text-muted-foreground">Deploy to ETFs for better returns</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <Badge className="bg-orange-500 text-xs mb-1">11 clients</Badge>
                        <p className="text-sm font-medium">Overweight technology sector</p>
                        <p className="text-xs text-muted-foreground">Consider sector rebalancing</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <Badge className="bg-red-500 text-xs mb-1">7 clients</Badge>
                        <p className="text-sm font-medium">Approaching retirement funding gap</p>
                        <p className="text-xs text-muted-foreground">Increase super contributions</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Badge className="bg-green-500 text-xs mb-1">6 clients</Badge>
                        <p className="text-sm font-medium">Tax-loss harvesting opportunity</p>
                        <p className="text-xs text-muted-foreground">$28,500 potential tax savings</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Badge className="bg-purple-500 text-xs mb-1">5 clients</Badge>
                        <p className="text-sm font-medium">Annual review overdue</p>
                        <p className="text-xs text-muted-foreground">Schedule compliance review</p>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
              <Button 
                variant="outline" 
                className="w-full mt-3 text-xs"
                onClick={() => navigate('/intelligence')}
              >
                View All Cross-Client Insights
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* ===== ZONE 6: PORTFOLIO ALERTS PANEL ===== */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-[#1a2744]" />
                Portfolio Alerts
              </CardTitle>
              <CardDescription className="text-xs">Requires immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {monitoring?.alerts?.slice(0, 6).map((alert, i) => (
                    <div 
                      key={`item-${i}`}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        const slug = resolveClientSlug(alert.client_id || alert.client_name);
                        if (slug) navigateToClient(navigate, slug);
                        else navigate('/client-crm');
                      }}
                      data-testid={`portfolio-alert-${i}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{alert.client_name}</span>
                        <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  )) || (
                    <>
                      <div
                        className="p-3 border-l-4 border-l-red-500 bg-red-50 rounded-r-lg cursor-pointer hover:bg-red-100"
                        onClick={() => navigateToClient(navigate, "client_5")}
                        data-testid="portfolio-alert-fallback-0"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Patel Holdings</span>
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Portfolio drift 8.2% - rebalancing required</p>
                      </div>
                      <div
                        className="p-3 border-l-4 border-l-orange-500 bg-orange-50 rounded-r-lg cursor-pointer hover:bg-orange-100"
                        onClick={() => navigateToClient(navigate, "thompson_family")}
                        data-testid="portfolio-alert-fallback-1"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Thompson Family</span>
                          <Badge className="bg-orange-500 text-xs">High</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Single stock concentration &gt;15%</p>
                      </div>
                      <div
                        className="p-3 border-l-4 border-l-yellow-500 bg-yellow-50 rounded-r-lg cursor-pointer hover:bg-yellow-100"
                        onClick={() => navigateToClient(navigate, "chen_family")}
                        data-testid="portfolio-alert-fallback-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Chen Investment Trust</span>
                          <Badge className="bg-yellow-500 text-black text-xs">Medium</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Underperforming benchmark by 3.2%</p>
                      </div>
                      <div
                        className="p-3 border-l-4 border-l-blue-500 bg-blue-50 rounded-r-lg cursor-pointer hover:bg-blue-100"
                        onClick={() => navigateToClient(navigate, "client_3")}
                        data-testid="portfolio-alert-fallback-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Thompson SMSF</span>
                          <Badge className="bg-blue-500 text-xs">Info</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Cash allocation above target</p>
                      </div>
                      <div
                        className="p-3 border-l-4 border-l-orange-500 bg-orange-50 rounded-r-lg cursor-pointer hover:bg-orange-100"
                        onClick={() => navigateToClient(navigate, "client_6")}
                        data-testid="portfolio-alert-fallback-4"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Liu Family Trust</span>
                          <Badge className="bg-orange-500 text-xs">High</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Overweight AUS equities by 7%</p>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
              <Button 
                variant="outline" 
                className="w-full mt-3 text-xs"
                onClick={() => navigate('/portfolio-analyzer')}
              >
                View All Portfolio Alerts
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* ===== ZONE 7: TASK & WORKFLOW PANEL ===== */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-[#1a2744]" />
                Tasks & Workflow
              </CardTitle>
              <CardDescription className="text-xs">Your action items</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => {
                        const slug = resolveClientSlug(task.client_id || task.client);
                        if (slug) navigateToClient(navigate, slug);
                        else toast.info(`Opening task: ${task.title}`);
                      }}
                      data-testid={`task-item-${task.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.client}</p>
                        </div>
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs ml-2"
                        >
                          {task.due}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button 
                variant="outline" 
                className="w-full mt-3 text-xs"
                onClick={() => navigate('/ai-copilot-advanced')}
              >
                View All Tasks
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <ComplianceFooter />

          </div>
      </div>
    </Layout>
  );
};

export default AdvisorCommandCenter;
