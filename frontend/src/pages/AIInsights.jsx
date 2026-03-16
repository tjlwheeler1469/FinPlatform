import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  PiggyBank, 
  Receipt,
  RefreshCw,
  ChevronRight,
  Calendar,
  Users,
  Target,
  ArrowUpRight,
  AlertCircle,
  Clock,
  DollarSign,
  Shield,
  FileText,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const getInsightIcon = (type) => {
  const icons = {
    retirement_risk: AlertTriangle,
    early_retirement: TrendingUp,
    tax_optimization: PiggyBank,
    spending_alert: Receipt,
    rebalance_needed: RefreshCw
  };
  return icons[type] || AlertCircle;
};

const getPriorityColor = (priority) => {
  const colors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-blue-100 text-blue-700 border-blue-200"
  };
  return colors[priority] || colors.low;
};

const getPriorityBorder = (priority) => {
  const colors = {
    high: "border-l-4 border-l-red-500",
    medium: "border-l-4 border-l-amber-500",
    low: "border-l-4 border-l-blue-500"
  };
  return colors[priority] || colors.low;
};

export default function AIInsights() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/api/copilot/todays-insights`);
      setInsights(response.data);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to load insights");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (insight, actionType) => {
    // Navigate to appropriate page based on action
    switch (actionType) {
      case "view_client":
        localStorage.setItem("active_client_id", insight.client_id || "client_1");
        navigate("/client-wealth");
        break;
      case "view_scenario":
        navigate("/decision-center");
        break;
      case "schedule_review":
        navigate("/client-crm");
        break;
      case "view_tax":
        navigate("/tax-analysis-sync");
        break;
      default:
        toast.info(`Action: ${actionType}`);
    }
  };

  const filterInsights = (insightList, filter) => {
    if (filter === "all") return insightList;
    return insightList?.filter(i => i.priority === filter) || [];
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const allInsights = insights?.insights || [];
  const highPriority = filterInsights(allInsights, "high");
  const mediumPriority = filterInsights(allInsights, "medium");
  const lowPriority = filterInsights(allInsights, "low");

  return (
    <Layout>
      <div className="space-y-6" data-testid="ai-insights-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-[#D4A84C]" />
              Today's AI Insights
            </h1>
            <p className="text-muted-foreground mt-1">
              {insights?.date || new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchInsights}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2d3a5c] text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Insights</p>
                  <p className="text-3xl font-bold">{insights?.summary?.total || 0}</p>
                </div>
                <Sparkles className="h-8 w-8 text-[#D4A84C]" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">High Priority</p>
                  <p className="text-3xl font-bold text-red-600">{insights?.summary?.high || 0}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Medium Priority</p>
                  <p className="text-3xl font-bold text-amber-600">{insights?.summary?.medium || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Opportunities</p>
                  <p className="text-3xl font-bold text-blue-600">{insights?.summary?.low || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Insights ({allInsights.length})</TabsTrigger>
            <TabsTrigger value="high" className="text-red-600">High Priority ({highPriority.length})</TabsTrigger>
            <TabsTrigger value="medium" className="text-amber-600">Medium ({mediumPriority.length})</TabsTrigger>
            <TabsTrigger value="low" className="text-blue-600">Opportunities ({lowPriority.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <InsightsList insights={allInsights} onAction={handleAction} />
          </TabsContent>
          <TabsContent value="high" className="mt-4">
            <InsightsList insights={highPriority} onAction={handleAction} />
          </TabsContent>
          <TabsContent value="medium" className="mt-4">
            <InsightsList insights={mediumPriority} onAction={handleAction} />
          </TabsContent>
          <TabsContent value="low" className="mt-4">
            <InsightsList insights={lowPriority} onAction={handleAction} />
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suggested Actions</CardTitle>
            <CardDescription>Based on today's insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate("/decision-center")}
              >
                <Target className="h-6 w-6 text-[#D4A84C]" />
                <span>Run Scenario Analysis</span>
                <span className="text-xs text-muted-foreground">For at-risk clients</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate("/meeting-prep")}
              >
                <Calendar className="h-6 w-6 text-[#D4A84C]" />
                <span>Prepare for Meetings</span>
                <span className="text-xs text-muted-foreground">AI-powered briefings</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate("/compliance")}
              >
                <Shield className="h-6 w-6 text-[#D4A84C]" />
                <span>Review Compliance</span>
                <span className="text-xs text-muted-foreground">Check pending items</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Insights List Component
function InsightsList({ insights, onAction }) {
  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No insights in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map((insight, idx) => {
        const IconComponent = getInsightIcon(insight.type);
        return (
          <Card key={idx} className={`${getPriorityBorder(insight.priority)} hover:shadow-md transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  insight.priority === 'high' ? 'bg-red-100' :
                  insight.priority === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  <IconComponent className={`h-5 w-5 ${
                    insight.priority === 'high' ? 'text-red-600' :
                    insight.priority === 'medium' ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{insight.description}</p>
                  
                  {/* Affected Clients */}
                  {insight.affected_clients && insight.affected_clients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {insight.affected_clients.map((client, cidx) => (
                        <Badge key={cidx} variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {client}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Items */}
                  {insight.action_items && insight.action_items.length > 0 && (
                    <div className="bg-muted rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                      <ul className="space-y-1">
                        {insight.action_items.map((action, aidx) => (
                          <li key={aidx} className="text-sm text-muted-foreground flex items-center gap-2">
                            <ChevronRight className="h-3 w-3" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => onAction(insight, "view_client")}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Client
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onAction(insight, "view_scenario")}
                    >
                      <Target className="h-4 w-4 mr-1" />
                      Run Scenario
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onAction(insight, "schedule_review")}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule Review
                    </Button>
                  </div>
                </div>
                
                {/* Impact Badge */}
                {insight.potential_impact && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Potential Impact</p>
                    <p className="font-bold text-lg text-green-600">{insight.potential_impact}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
