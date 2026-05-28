import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { PageShell, PillButton } from "@/components/PageShell";
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

  const fetchAllData = useCallback(async (showRefreshToast = false, signal) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [commandRes, monitoringRes, taxRes, intelligenceRes, practiceRes, clientsRes, actionsRes, graphOverviewRes, graphInsightsRes] = await Promise.all([
        fetch(`${API_URL}/api/command-center/daily-digest`, { signal }),
        fetch(`${API_URL}/api/monitoring/daily-scan`, { signal }),
        fetch(`${API_URL}/api/intelligence/tax-opportunities`, { signal }),
        fetch(`${API_URL}/api/monitoring/book-insights`, { signal }),
        fetch(`${API_URL}/api/practice-health/dashboard`, { signal }),
        fetch(`${API_URL}/api/intelligence/comprehensive-analysis`, { signal }),
        fetch(`${API_URL}/api/next-action/today?limit=8`, { signal }),
        fetch(`${API_URL}/api/graph/overview`, { signal }),
        fetch(`${API_URL}/api/graph/insights`, { signal })
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
      // Silently ignore aborted requests (StrictMode double-mount, navigation away)
      if (error?.name === "AbortError") return;
      // Network failures are non-fatal — page still renders with previous/empty state
      if (error?.message?.includes("Failed to fetch")) {
        // transient network blip — log debug-only, don't toast
        return;
      }
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAllData(false, controller.signal);
    const interval = setInterval(() => {
      const c = new AbortController();
      fetchAllData(false, c.signal);
    }, 300000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
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
  // Strip leading emoji glyphs / variation-selectors for the airy hero accent
  const focusAccent = (focusMessage || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
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
      <PageShell
        eyebrow="ADVISER · DAILY OS"
        title="Command center"
        accent={focusAccent || "your firm in one view"}
        subtitle="Every alert, opportunity, and execution surface ranked by impact. Start the day, end the day, and replay every advice decision from one cockpit."
        meta={`LIVE · ${totalClients} households · ${formatCurrency(totalAUM)} AUA`}
        metrics={[
          { label: "AUA", value: formatCurrency(totalAUM), hint: "+2.3% MTD" },
          { label: "Net flows", value: `+${formatCurrency(netFlows)}`, hint: "Inflows" },
          { label: "Revenue YTD", value: formatCurrency(revenue), hint: "+12% YoY" },
          { label: "Risk alerts", value: String(monitoring?.high_priority_alerts || 0), hint: monitoring?.high_priority_alerts > 0 ? "Needs attention" : "All clear" },
        ]}
        actions={
          <>
            <div className="relative hidden md:block w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients, portfolios, insights…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 rounded-full border-slate-300 bg-white text-sm"
              />
            </div>
            <PillButton variant="ghost" onClick={() => navigate('/ai-copilot')} className="hidden lg:inline-flex">
              <Bot className="h-4 w-4 inline -mt-0.5 mr-1.5" /> AI Copilot
            </PillButton>
            <PillButton variant="ghost" onClick={() => navigate('/notifications')} className="relative">
              <Bell className="h-4 w-4 inline -mt-0.5" />
              {monitoring?.total_alerts > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {monitoring.total_alerts}
                </span>
              )}
            </PillButton>
            <PillButton variant="primary" onClick={() => fetchAllData(true)} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 inline -mt-0.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </PillButton>
          </>
        }
      >
        <div className="space-y-4" data-testid="advisor-command-center">

        {/* Practice health pill (one secondary KPI) */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
            Practice health · <span className="font-semibold">{healthScore} {healthGrade}</span> · +3 pts vs Q4
          </span>
        </div>

        {/* ===== Dashboard & Briefing (single, high-level view) ===== */}
        <div className="space-y-4" data-testid="dashboard-briefing">

        {/* ===== NEXT BEST ACTION ENGINE - THE KILLER FEATURE ===== */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 font-serif text-xl text-[#1a2744]">
                  <Zap className="h-5 w-5 text-[#D4A84C]" />
                  Next best actions
                  <span className="text-[10px] tracking-[0.18em] uppercase text-slate-500 font-sans font-semibold ml-2">AI-powered</span>
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 mt-1">{focusMessage}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-mono">
                  {topActions.length} actions · {actionImpact.clients_needing_rebalance || 0} rebalance
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {topActions.slice(0, 4).map((action, i) => {
                const dotColor =
                  action.priority === 'critical' ? 'bg-rose-500' :
                  action.priority === 'high' ? 'bg-amber-500' :
                  'bg-sky-500';
                return (
                <div
                  key={action.id || i}
                  className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => setSelectedAction(action)}
                  data-testid={`next-action-${i}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-slate-600 font-semibold">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                      {action.priority}
                    </span>
                    <span className="text-[10px] tracking-wide uppercase text-slate-400 font-mono">
                      {action.category}
                    </span>
                  </div>
                  <h4 className="font-serif text-[15px] text-[#1a2744] leading-tight mb-2">{action.title}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const slug = resolveClientSlug(action.client_id || action.client_name);
                      if (slug) navigateToClient(navigate, slug);
                      else toast.info(`No client context for "${action.client_name}"`);
                    }}
                    className="text-xs text-slate-600 hover:text-[#1a2744] underline-offset-2 hover:underline mb-3 block text-left"
                    data-testid={`next-action-${i}-client`}
                  >
                    {action.client_name}
                  </button>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{action.description}</p>
                  {action.impact_value && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-[10px] tracking-[0.16em] uppercase text-slate-500">Impact</p>
                      <p className="font-serif text-lg text-[#1a2744] mt-0.5">
                        {typeof action.impact_value === 'number' ? formatCurrency(action.impact_value) : action.impact_value}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">
                      {action.estimated_time}
                    </span>
                    <button
                      className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#1a2744] text-white hover:bg-[#0f1a30] transition-all"
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
                      <Play className="h-3 w-3 inline -mt-0.5 mr-1" />
                      Execute
                    </button>
                  </div>
                </div>
              );
              })}
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
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 font-serif text-xl text-[#1a2744]">
                  <Zap className="h-5 w-5 text-[#D4A84C]" />
                  Advisor intelligence feed
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 mt-1">What requires your attention today</CardDescription>
              </div>
              <span className="text-[10px] tracking-[0.16em] uppercase text-slate-500 font-mono">
                Live · Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Portfolio Drift */}
              <button
                className="text-left p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all"
                onClick={() => navigate('/portfolio-analyzer')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <PieChart className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
                  <span className="font-serif text-3xl text-[#1a2744]">{portfoliosDrifted}</span>
                </div>
                <p className="text-sm font-semibold text-[#1a2744] leading-snug">Portfolios drifted from allocation</p>
                <p className="text-[11px] text-slate-500 mt-1">Rebalancing recommended</p>
              </button>

              {/* Tax Opportunities */}
              <button
                className="text-left p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all"
                onClick={() => navigate('/tax-analysis')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
                  <span className="font-serif text-3xl text-[#1a2744]">{taxOppsCount}</span>
                </div>
                <p className="text-sm font-semibold text-[#1a2744] leading-snug">Tax-loss harvesting opportunities</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  ${taxOpportunities?.total_potential_tax_savings?.toLocaleString() || '28,500'} potential savings
                </p>
              </button>

              {/* Retirement Risks */}
              <button
                className="text-left p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all"
                onClick={() => navigate('/strategic-planning')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Target className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
                  <span className="font-serif text-3xl text-[#1a2744]">{retirementRisks}</span>
                </div>
                <p className="text-sm font-semibold text-[#1a2744] leading-snug">Clients nearing retirement shortfall</p>
                <p className="text-[11px] text-slate-500 mt-1">Action required before EOFY</p>
              </button>

              {/* Idle Cash */}
              <button
                className="text-left p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all"
                onClick={() => navigate('/client-crm')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Wallet className="h-4 w-4 text-slate-400" strokeWidth={1.5} />
                  <span className="font-serif text-3xl text-[#1a2744]">{idleCashClients}</span>
                </div>
                <p className="text-sm font-semibold text-[#1a2744] leading-snug">Clients holding &gt;$150k idle cash</p>
                <p className="text-[11px] text-slate-500 mt-1">Investment opportunity</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid: 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* ===== ZONE 5: CLIENT INSIGHTS PANEL ===== */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-serif text-lg text-[#1a2744]">
                <Users className="h-4 w-4 text-[#D4A84C]" />
                Client insights
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Cross-client intelligence</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {intelligence?.book_wide_insights?.slice(0, 6).map((insight, i) => {
                    const dotColor =
                      insight.severity === 'high' ? 'bg-rose-500' :
                      insight.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400';
                    return (
                    <button
                      key={`item-${i}`}
                      className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors"
                      onClick={() => navigate('/intelligence')}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-slate-600 font-semibold">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {insight.count} clients
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-[#1a2744]">{insight.insight}</p>
                      {insight.action && (
                        <p className="text-xs text-slate-500 mt-1">{insight.action}</p>
                      )}
                    </button>
                  );
                  }) || (
                    <>
                      <button onClick={() => navigate('/intelligence')} className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-slate-600 font-semibold mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" />18 clients</span>
                        <p className="text-sm font-medium text-[#1a2744]">Holding &gt;$150k excess cash</p>
                        <p className="text-xs text-slate-500">Deploy to ETFs for better returns</p>
                      </button>
                      <button onClick={() => navigate('/intelligence')} className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-slate-600 font-semibold mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />11 clients</span>
                        <p className="text-sm font-medium text-[#1a2744]">Overweight technology sector</p>
                        <p className="text-xs text-slate-500">Consider sector rebalancing</p>
                      </button>
                      <button onClick={() => navigate('/intelligence')} className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-slate-600 font-semibold mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />7 clients</span>
                        <p className="text-sm font-medium text-[#1a2744]">Approaching retirement funding gap</p>
                        <p className="text-xs text-slate-500">Increase super contributions</p>
                      </button>
                      <button onClick={() => navigate('/intelligence')} className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-slate-600 font-semibold mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />6 clients</span>
                        <p className="text-sm font-medium text-[#1a2744]">Tax-loss harvesting opportunity</p>
                        <p className="text-xs text-slate-500">$28,500 potential tax savings</p>
                      </button>
                      <button onClick={() => navigate('/intelligence')} className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <span className="flex items-center gap-1.5 text-[10px] tracking-[0.16em] uppercase text-slate-600 font-semibold mb-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-500" />5 clients</span>
                        <p className="text-sm font-medium text-[#1a2744]">Annual review overdue</p>
                        <p className="text-xs text-slate-500">Schedule compliance review</p>
                      </button>
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
              <CardTitle className="flex items-center gap-2 font-serif text-lg text-[#1a2744]">
                <BarChart3 className="h-4 w-4 text-[#D4A84C]" />
                Portfolio alerts
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Requires immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {monitoring?.alerts?.slice(0, 6).map((alert, i) => {
                    const dotColor =
                      alert.severity === 'high' ? 'bg-rose-500' :
                      alert.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400';
                    return (
                    <button
                      key={`item-${i}`}
                      className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors"
                      onClick={() => {
                        const slug = resolveClientSlug(alert.client_id || alert.client_name);
                        if (slug) navigateToClient(navigate, slug);
                        else navigate('/client-crm');
                      }}
                      data-testid={`portfolio-alert-${i}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-[#1a2744]">{alert.client_name}</span>
                        <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {alert.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{alert.message}</p>
                    </button>
                  );
                  }) || (
                    <>
                      <button onClick={() => navigateToClient(navigate, "client_5")} data-testid="portfolio-alert-fallback-0" className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#1a2744]">Patel Holdings</span>
                          <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Critical</span>
                        </div>
                        <p className="text-xs text-slate-500">Portfolio drift 8.2% — rebalancing required</p>
                      </button>
                      <button onClick={() => navigateToClient(navigate, "thompson_family")} data-testid="portfolio-alert-fallback-1" className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#1a2744]">Thompson Family</span>
                          <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />High</span>
                        </div>
                        <p className="text-xs text-slate-500">Single stock concentration &gt;15%</p>
                      </button>
                      <button onClick={() => navigateToClient(navigate, "chen_family")} data-testid="portfolio-alert-fallback-2" className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#1a2744]">Chen Investment Trust</span>
                          <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Medium</span>
                        </div>
                        <p className="text-xs text-slate-500">Underperforming benchmark by 3.2%</p>
                      </button>
                      <button onClick={() => navigateToClient(navigate, "client_3")} data-testid="portfolio-alert-fallback-3" className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#1a2744]">Thompson SMSF</span>
                          <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" />Info</span>
                        </div>
                        <p className="text-xs text-slate-500">Cash allocation above target</p>
                      </button>
                      <button onClick={() => navigateToClient(navigate, "client_6")} data-testid="portfolio-alert-fallback-4" className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[#1a2744]">Liu Family Trust</span>
                          <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />High</span>
                        </div>
                        <p className="text-xs text-slate-500">Overweight AUS equities by 7%</p>
                      </button>
                    </>
                  )}
                </div>
              </ScrollArea>
              <Button
                variant="outline"
                className="w-full mt-3 text-xs rounded-full"
                onClick={() => navigate('/portfolio-analyzer')}
              >
                View all portfolio alerts
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* ===== ZONE 7: TASK & WORKFLOW PANEL ===== */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-serif text-lg text-[#1a2744]">
                <CheckCircle className="h-4 w-4 text-[#D4A84C]" />
                Tasks &amp; workflow
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Your action items</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const dotColor = task.priority === 'high' ? 'bg-rose-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400';
                    return (
                    <button
                      key={task.id}
                      className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-400 transition-colors"
                      onClick={() => {
                        const slug = resolveClientSlug(task.client_id || task.client);
                        if (slug) navigateToClient(navigate, slug);
                        else toast.info(`Opening task: ${task.title}`);
                      }}
                      data-testid={`task-item-${task.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a2744] truncate">{task.title}</p>
                          <p className="text-xs text-slate-500">{task.client}</p>
                        </div>
                        <span className="flex items-center gap-1.5 text-[10px] tracking-wide uppercase text-slate-600 font-semibold ml-2 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {task.due}
                        </span>
                      </div>
                    </button>
                  );
                  })}
                </div>
              </ScrollArea>
              <Button
                variant="outline"
                className="w-full mt-3 text-xs rounded-full"
                onClick={() => navigate('/ai-copilot-advanced')}
              >
                View all tasks
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <ComplianceFooter />

          </div>
        </div>
      </PageShell>
    </Layout>
  );
};

export default AdvisorCommandCenter;
