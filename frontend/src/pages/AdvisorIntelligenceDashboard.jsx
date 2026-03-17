import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Scale
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";

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

const formatFullCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Advisor Intelligence Dashboard - The Daily Operating System
const AdvisorIntelligenceDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    commandCenter: null,
    monitoring: null,
    taxOpportunities: null,
    intelligence: null
  });

  const fetchAllData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [commandRes, monitoringRes, taxRes, intelligenceRes] = await Promise.all([
        fetch(`${API_URL}/api/command-center/daily-digest`),
        fetch(`${API_URL}/api/monitoring/daily-scan`),
        fetch(`${API_URL}/api/intelligence/tax-opportunities`),
        fetch(`${API_URL}/api/monitoring/book-insights`)
      ]);
      
      const [command, monitoring, tax, intelligence] = await Promise.all([
        commandRes.ok ? commandRes.json() : null,
        monitoringRes.ok ? monitoringRes.json() : null,
        taxRes.ok ? taxRes.json() : null,
        intelligenceRes.ok ? intelligenceRes.json() : null
      ]);
      
      setData({ commandCenter: command, monitoring: monitoring, taxOpportunities: tax, intelligence: intelligence });
      
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
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchAllData(false), 300000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]" data-testid="intelligence-loading">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-[#1a2744]" />
            <p className="text-muted-foreground">Loading Intelligence Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { commandCenter, monitoring, taxOpportunities, intelligence } = data;
  const totalAUM = commandCenter?.metrics?.total_aum || 0;
  const totalClients = commandCenter?.metrics?.total_clients || 0;

  // Calculate key alerts
  const portfoliosDrifted = monitoring?.alert_summary?.allocation_drift || 0;
  const taxOppsCount = taxOpportunities?.total_clients_with_opportunities || 0;
  const idleCashClients = intelligence?.book_wide_insights?.find(i => i.insight.includes("idle cash"))?.count || 0;
  const retirementRisks = intelligence?.book_wide_insights?.find(i => i.insight.includes("retirement"))?.count || 0;

  return (
    <Layout>
      <div className="space-y-6" data-testid="advisor-intelligence-dashboard">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1a2744] flex items-center gap-2">
              <Brain className="h-8 w-8 text-[#D4A84C]" />
              Advisor Intelligence Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {commandCenter?.greeting} • Your daily briefing is ready
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Last updated: {new Date().toLocaleTimeString()}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              data-testid="refresh-btn"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium">Assets Under Advice</p>
                  <p className="text-2xl lg:text-3xl font-bold">{formatCurrency(totalAUM)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-[#D4A84C]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Clients</p>
                  <p className="text-2xl lg:text-3xl font-bold text-[#1a2744]">{totalClients}</p>
                </div>
                <Users className="h-10 w-10 text-[#1a2744]/20" />
              </div>
            </CardContent>
          </Card>

          <Card className={monitoring?.high_priority_alerts > 0 ? "border-red-200 bg-red-50" : ""}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Alerts Today</p>
                  <p className={`text-2xl lg:text-3xl font-bold ${monitoring?.high_priority_alerts > 0 ? 'text-red-600' : 'text-[#1a2744]'}`}>
                    {monitoring?.total_alerts || 0}
                  </p>
                </div>
                <Bell className={`h-10 w-10 ${monitoring?.high_priority_alerts > 0 ? 'text-red-500' : 'text-gray-200'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Meetings Today</p>
                  <p className="text-2xl lg:text-3xl font-bold text-[#1a2744]">
                    {commandCenter?.schedule?.length || 0}
                  </p>
                </div>
                <Calendar className="h-10 w-10 text-[#1a2744]/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Alerts Summary - The Key Section */}
        <Card className="border-2 border-[#D4A84C]/30 bg-gradient-to-r from-amber-50/50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-6 w-6 text-[#D4A84C]" />
              Today's Alerts
            </CardTitle>
            <CardDescription>Portfolio monitoring detected the following issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Portfolios Drifted */}
              <div 
                className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${portfoliosDrifted > 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border'}`}
                onClick={() => navigate("/intelligence")}
                data-testid="alert-drift"
              >
                <div className="flex items-center gap-2 mb-2">
                  <PieChart className={`h-5 w-5 ${portfoliosDrifted > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">Portfolios Drifted</span>
                </div>
                <p className={`text-3xl font-bold ${portfoliosDrifted > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {portfoliosDrifted}
                </p>
                <p className="text-xs text-muted-foreground mt-1">from allocation</p>
              </div>

              {/* Tax-Loss Opportunities */}
              <div 
                className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${taxOppsCount > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border'}`}
                onClick={() => navigate("/tax-analysis")}
                data-testid="alert-tax"
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className={`h-5 w-5 ${taxOppsCount > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">Tax Opportunities</span>
                </div>
                <p className={`text-3xl font-bold ${taxOppsCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {taxOppsCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">clients with savings</p>
              </div>

              {/* Retirement Risks */}
              <div 
                className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${retirementRisks > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border'}`}
                onClick={() => navigate("/intelligence")}
                data-testid="alert-retirement"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className={`h-5 w-5 ${retirementRisks > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">Retirement Risks</span>
                </div>
                <p className={`text-3xl font-bold ${retirementRisks > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                  {retirementRisks}
                </p>
                <p className="text-xs text-muted-foreground mt-1">funding shortfalls</p>
              </div>

              {/* Idle Cash */}
              <div 
                className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${idleCashClients > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border'}`}
                onClick={() => navigate("/intelligence")}
                data-testid="alert-cash"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className={`h-5 w-5 ${idleCashClients > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-semibold text-sm">Idle Cash</span>
                </div>
                <p className={`text-3xl font-bold ${idleCashClients > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {idleCashClients}
                </p>
                <p className="text-xs text-muted-foreground mt-1">holding &gt;$150k cash</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Priority Actions & Book Insights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Book-Wide Insights */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-[#D4A84C]" />
                  Cross-Client Intelligence
                </CardTitle>
                <CardDescription>AI-detected patterns across your entire client book</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intelligence?.book_wide_insights?.map((insight, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-lg border bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate("/intelligence")}
                      data-testid={`insight-${idx}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-[#1a2744]">{insight.insight}</p>
                          <p className="text-xs text-muted-foreground mt-1">{insight.action}</p>
                        </div>
                        <Badge variant={insight.count > 5 ? "destructive" : "secondary"} className="ml-2">
                          {insight.count} clients
                        </Badge>
                      </div>
                      {insight.clients?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {insight.clients.slice(0, 3).map((client, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {client.name}
                            </Badge>
                          ))}
                          {insight.clients.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{insight.clients.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-3"
                  onClick={() => navigate("/intelligence")}
                >
                  View Full Analysis <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Tax Opportunities Summary */}
            {taxOpportunities && taxOpportunities.total_potential_tax_savings > 0 && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <DollarSign className="h-5 w-5" />
                    Tax Optimization Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-white">
                      <p className="text-xs text-muted-foreground">Total Potential Savings</p>
                      <p className="text-2xl font-bold text-green-700">
                        {formatFullCurrency(taxOpportunities.total_potential_tax_savings)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white">
                      <p className="text-xs text-muted-foreground">Harvestable Losses</p>
                      <p className="text-2xl font-bold text-[#1a2744]">
                        {formatFullCurrency(taxOpportunities.total_harvestable_losses)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white">
                      <p className="text-xs text-muted-foreground">Days Until EOFY</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {taxOpportunities.days_until_eofy}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate("/tax-analysis")}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Execute Tax Strategies <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Schedule & Quick Actions */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#D4A84C]" />
                    Today's Meetings
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {commandCenter?.schedule?.map((meeting) => (
                    <div
                      key={meeting.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${!meeting.prepared ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}
                      onClick={() => {
                        localStorage.setItem("active_client_id", meeting.client_id);
                        navigate("/meeting-prep");
                      }}
                      data-testid={`meeting-${meeting.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#1a2744]">{formatTime(meeting.time)}</span>
                        {!meeting.prepared && (
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                            Prep Now
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm">{meeting.client_name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {meeting.location === "Video Call" ? <Video className="h-3 w-3" /> :
                         meeting.location === "Phone" ? <Phone className="h-3 w-3" /> :
                         <MapPin className="h-3 w-3" />}
                        <span>{meeting.type} • {meeting.duration}min</span>
                      </div>
                    </div>
                  ))}
                  {(!commandCenter?.schedule || commandCenter.schedule.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No meetings today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#D4A84C]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3"
                    onClick={() => navigate("/ai-copilot")}
                  >
                    <Sparkles className="h-5 w-5 mr-3 text-[#D4A84C]" />
                    <div className="text-left">
                      <p className="font-medium">AI Wealth Copilot</p>
                      <p className="text-xs text-muted-foreground">Ask anything about clients</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3"
                    onClick={() => navigate("/meeting-prep")}
                  >
                    <Clock className="h-5 w-5 mr-3 text-[#D4A84C]" />
                    <div className="text-left">
                      <p className="font-medium">30-Second Briefing</p>
                      <p className="text-xs text-muted-foreground">Instant client prep</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3"
                    onClick={() => navigate("/compliance")}
                  >
                    <Shield className="h-5 w-5 mr-3 text-[#D4A84C]" />
                    <div className="text-left">
                      <p className="font-medium">Compliance Check</p>
                      <p className="text-xs text-muted-foreground">{commandCenter?.metrics?.reviews_due_30d || 0} reviews due</p>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-auto py-3"
                    onClick={() => navigate("/market-data")}
                  >
                    <TrendingUp className="h-5 w-5 mr-3 text-[#D4A84C]" />
                    <div className="text-left">
                      <p className="font-medium">Market Overview</p>
                      <p className="text-xs text-muted-foreground">ASX & global markets</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Score */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Compliance Health</span>
                  <span className="text-lg font-bold text-[#1a2744]">{commandCenter?.metrics?.compliance_score || 0}%</span>
                </div>
                <Progress value={commandCenter?.metrics?.compliance_score || 0} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{commandCenter?.metrics?.reviews_overdue || 0} overdue</span>
                  <span>{commandCenter?.metrics?.reviews_due_30d || 0} due in 30d</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default AdvisorIntelligenceDashboard;
