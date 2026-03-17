import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  LineChart,
  RefreshCw,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  XCircle,
  AlertCircle,
  Briefcase,
  BarChart3,
  Wallet,
  PieChart,
  FileText,
  MessageSquare,
  Video,
  Phone,
  MapPin
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
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

const getPriorityColor = (priority) => {
  switch (priority) {
    case "critical": return "bg-red-100 text-red-800 border-red-200";
    case "high": return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
    case "low": return "bg-blue-100 text-blue-800 border-blue-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case "critical": return <XCircle className="h-4 w-4 text-red-600" />;
    case "high": return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case "medium": return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case "low": return <Bell className="h-4 w-4 text-blue-600" />;
    default: return <Bell className="h-4 w-4 text-gray-600" />;
  }
};

const getAlertTypeIcon = (type) => {
  switch (type) {
    case "portfolio_drift": return <PieChart className="h-5 w-5" />;
    case "tax_opportunity": return <DollarSign className="h-5 w-5" />;
    case "compliance_due": return <Shield className="h-5 w-5" />;
    case "idle_cash": return <Wallet className="h-5 w-5" />;
    case "goal_at_risk": return <Target className="h-5 w-5" />;
    case "market_event": return <TrendingUp className="h-5 w-5" />;
    case "fee_optimization": return <BarChart3 className="h-5 w-5" />;
    default: return <Bell className="h-5 w-5" />;
  }
};

const CommandCenter = () => {
  const navigate = useNavigate();
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAlertTab, setActiveAlertTab] = useState("all");
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  useEffect(() => {
    fetchDailyDigest();
  }, []);

  const fetchDailyDigest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/command-center/daily-digest`);
      if (response.ok) {
        const data = await response.json();
        setDigest(data);
      } else {
        throw new Error("Failed to fetch digest");
      }
    } catch (error) {
      console.error("Error fetching daily digest:", error);
      toast.error("Failed to load command center data");
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await fetch(`${API_URL}/api/command-center/alerts/${alertId}/dismiss`, {
        method: "POST"
      });
      setDismissedAlerts(prev => new Set([...prev, alertId]));
      toast.success("Alert dismissed");
    } catch (error) {
      toast.error("Failed to dismiss alert");
    }
  };

  const handleAlertAction = (alert) => {
    if (alert.client_id) {
      localStorage.setItem("active_client_id", alert.client_id);
    }
    navigate(alert.action_route);
  };

  const filteredAlerts = digest?.alerts?.filter(a => {
    if (dismissedAlerts.has(a.id)) return false;
    if (activeAlertTab === "all") return true;
    return a.priority === activeAlertTab;
  }) || [];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]" data-testid="command-center-loading">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-[#1a2744]" />
            <p className="text-muted-foreground">Loading Command Center...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="command-center-page">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1a2744] flex items-center gap-2">
              <Zap className="h-7 w-7 text-[#D4A84C]" />
              Command Center
            </h1>
            <p className="text-muted-foreground mt-1">
              {digest?.greeting}, here's your daily intelligence briefing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDailyDigest}
              data-testid="refresh-digest-btn"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate("/ai-copilot")}
              className="bg-gradient-to-r from-[#1a2744] to-[#2a3754] text-white"
              data-testid="ai-copilot-btn"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Copilot
            </Button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs font-medium">Total AUM</p>
                  <p className="text-xl lg:text-2xl font-bold">{formatCurrency(digest?.metrics?.total_aum || 0)}</p>
                  <div className={`flex items-center text-xs mt-1 ${digest?.metrics?.aum_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {digest?.metrics?.aum_change_24h >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span>{Math.abs(digest?.metrics?.aum_change_24h || 0).toFixed(2)}% today</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-[#D4A84C]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Active Clients</p>
                  <p className="text-xl lg:text-2xl font-bold text-[#1a2744]">{digest?.metrics?.active_clients || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">of {digest?.metrics?.total_clients || 0} total</p>
                </div>
                <Users className="h-8 w-8 text-[#1a2744]/20" />
              </div>
            </CardContent>
          </Card>

          <Card className={digest?.summary?.requires_immediate_attention > 0 ? "border-red-200 bg-red-50" : ""}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Urgent Actions</p>
                  <p className={`text-xl lg:text-2xl font-bold ${digest?.summary?.requires_immediate_attention > 0 ? 'text-red-600' : 'text-[#1a2744]'}`}>
                    {digest?.summary?.requires_immediate_attention || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">require attention</p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${digest?.summary?.requires_immediate_attention > 0 ? 'text-red-500' : 'text-gray-200'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Reviews Due</p>
                  <p className="text-xl lg:text-2xl font-bold text-[#1a2744]">{digest?.metrics?.reviews_due_30d || 0}</p>
                  <p className="text-xs text-amber-600 mt-1">{digest?.metrics?.reviews_overdue || 0} overdue</p>
                </div>
                <Calendar className="h-8 w-8 text-[#1a2744]/20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Compliance Score</p>
                  <p className="text-xl lg:text-2xl font-bold text-[#1a2744]">{digest?.metrics?.compliance_score || 0}%</p>
                  <Progress value={digest?.metrics?.compliance_score || 0} className="h-1 mt-2" />
                </div>
                <Shield className="h-8 w-8 text-[#1a2744]/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Alerts Section - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bell className="h-5 w-5 text-[#D4A84C]" />
                      Action Alerts
                    </CardTitle>
                    <CardDescription>Prioritized alerts requiring your attention</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {digest?.summary?.alert_counts?.critical || 0} Critical
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                      {digest?.summary?.alert_counts?.high || 0} High
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeAlertTab} onValueChange={setActiveAlertTab}>
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    <TabsTrigger value="all">All ({digest?.summary?.total_alerts || 0})</TabsTrigger>
                    <TabsTrigger value="critical" className="text-red-600">Critical</TabsTrigger>
                    <TabsTrigger value="high" className="text-orange-600">High</TabsTrigger>
                    <TabsTrigger value="medium" className="text-amber-600">Medium</TabsTrigger>
                    <TabsTrigger value="low" className="text-blue-600">Low</TabsTrigger>
                  </TabsList>
                  
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {filteredAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border transition-all hover:shadow-md ${getPriorityColor(alert.priority)}`}
                          data-testid={`alert-${alert.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              alert.priority === "critical" ? "bg-red-200" :
                              alert.priority === "high" ? "bg-orange-200" :
                              alert.priority === "medium" ? "bg-amber-200" : "bg-blue-200"
                            }`}>
                              {getAlertTypeIcon(alert.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-sm truncate">{alert.title}</h4>
                                <Badge variant="outline" className="text-xs ml-2 shrink-0">
                                  {alert.client_name}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">
                                  Impact: {alert.impact}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-xs"
                                    onClick={() => dismissAlert(alert.id)}
                                  >
                                    Dismiss
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="h-7 text-xs bg-[#1a2744] hover:bg-[#2a3754]"
                                    onClick={() => handleAlertAction(alert)}
                                    data-testid={`alert-action-${alert.id}`}
                                  >
                                    {alert.action_text}
                                    <ChevronRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredAlerts.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                          <p>No alerts in this category</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Tabs>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#D4A84C]" />
                  AI Cross-Client Insights
                </CardTitle>
                <CardDescription>Patterns and opportunities across your client base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {digest?.ai_recommendations?.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-lg border bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(rec.action_route || "/ai-copilot")}
                      data-testid={`recommendation-${rec.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-[#1a2744]">{rec.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {rec.affected_clients} clients
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-green-600">{rec.potential_impact}</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs p-0">
                          {rec.action_text} <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Schedule & Quick Actions */}
          <div className="space-y-4">
            {/* Today's Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#D4A84C]" />
                    Today's Schedule
                  </CardTitle>
                  <Badge variant="outline">{digest?.schedule?.length || 0} meetings</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {digest?.schedule?.map((meeting) => (
                    <div
                      key={meeting.id}
                      className={`p-3 rounded-lg border ${!meeting.prepared ? 'border-amber-200 bg-amber-50' : 'bg-gray-50'}`}
                      data-testid={`meeting-${meeting.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1a2744]">{formatTime(meeting.time)}</span>
                          <span className="text-xs text-muted-foreground">({meeting.duration}m)</span>
                        </div>
                        {!meeting.prepared && (
                          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">
                            Not Prepared
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm mb-1">{meeting.title}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {meeting.location === "Video Call" ? <Video className="h-3 w-3" /> :
                           meeting.location === "Phone" ? <Phone className="h-3 w-3" /> :
                           <MapPin className="h-3 w-3" />}
                          <span>{meeting.location}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs"
                          onClick={() => {
                            localStorage.setItem("active_client_id", meeting.client_id);
                            navigate("/meeting-prep");
                          }}
                          data-testid={`prep-meeting-${meeting.id}`}
                        >
                          Prep <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!digest?.schedule || digest.schedule.length === 0) && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No meetings scheduled today</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#D4A84C]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {digest?.quick_actions?.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center gap-1 hover:bg-[#1a2744] hover:text-white transition-colors"
                      onClick={() => navigate(action.route)}
                      data-testid={`quick-action-${idx}`}
                    >
                      {action.icon === "Calendar" && <Calendar className="h-5 w-5" />}
                      {action.icon === "Shield" && <Shield className="h-5 w-5" />}
                      {action.icon === "TrendingUp" && <TrendingUp className="h-5 w-5" />}
                      {action.icon === "Sparkles" && <Sparkles className="h-5 w-5" />}
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Snapshot */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-[#D4A84C]" />
                  Market Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                    <span className="font-medium text-sm">S&P/ASX 200</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">7,856</span>
                      <span className="text-green-600 text-xs flex items-center">
                        <ArrowUpRight className="h-3 w-3" />
                        +0.42%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                    <span className="font-medium text-sm">AUD/USD</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">0.6545</span>
                      <span className="text-red-600 text-xs flex items-center">
                        <ArrowDownRight className="h-3 w-3" />
                        -0.15%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-gray-50">
                    <span className="font-medium text-sm">RBA Cash Rate</span>
                    <span className="font-bold">4.35%</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full mt-3 text-sm"
                  onClick={() => navigate("/market-data")}
                  data-testid="view-markets-btn"
                >
                  View Full Market Data <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default CommandCenter;
