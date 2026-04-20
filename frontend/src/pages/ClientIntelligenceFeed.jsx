import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { navigateToClient } from "@/lib/navigateToClient";
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
  AlertCircle
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

const getInsightColor = (priority) => {
  const colors = {
    high: "border-l-red-500 bg-red-50",
    medium: "border-l-yellow-500 bg-yellow-50",
    low: "border-l-blue-500 bg-blue-50"
  };
  return colors[priority] || colors.low;
};

const getPriorityBadgeColor = (priority) => {
  const colors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-blue-100 text-blue-700 border-blue-200"
  };
  return colors[priority] || colors.low;
};

const ClientIntelligenceFeed = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState(null);

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

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading AI insights...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
    <div className="p-6 space-y-6" data-testid="intelligence-feed-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Today's AI Insights</h1>
            <p className="text-muted-foreground">{insights?.date} • {insights?.total_insights} actionable insights</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchInsights}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-3xl font-bold text-red-600">{insights?.critical_count || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Insights</p>
                <p className="text-3xl font-bold">{insights?.total_insights || 0}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients Affected</p>
                <p className="text-3xl font-bold">
                  {insights?.insights?.reduce((acc, i) => acc + (i.clients?.length || i.count || 0), 0) || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actions Needed</p>
                <p className="text-3xl font-bold text-purple-600">
                  {insights?.insights?.filter(i => i.action)?.length || 0}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">All Insights</CardTitle>
            <CardDescription>Click on an insight to see details</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {insights?.insights?.map((insight, index) => {
                  const Icon = getInsightIcon(insight.type);
                  return (
                    <div
                      key={`item-${index}`}
                      className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${getInsightColor(insight.priority)} ${selectedInsight === index ? "ring-2 ring-purple-500" : ""}`}
                      onClick={() => setSelectedInsight(index)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          insight.priority === "high" ? "bg-red-100" : 
                          insight.priority === "medium" ? "bg-yellow-100" : "bg-blue-100"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            insight.priority === "high" ? "text-red-600" : 
                            insight.priority === "medium" ? "text-yellow-600" : "text-blue-600"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge variant="outline" className={getPriorityBadgeColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {insight.count} {insight.count === 1 ? "client" : "clients"}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Insight Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedInsight !== null && insights?.insights?.[selectedInsight] ? (
              <div className="space-y-6">
                {(() => {
                  const insight = insights.insights[selectedInsight];
                  const Icon = getInsightIcon(insight.type);
                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          insight.priority === "high" ? "bg-red-100" : 
                          insight.priority === "medium" ? "bg-yellow-100" : "bg-blue-100"
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            insight.priority === "high" ? "text-red-600" : 
                            insight.priority === "medium" ? "text-yellow-600" : "text-blue-600"
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{insight.title}</h3>
                          <Badge variant="outline" className={getPriorityBadgeColor(insight.priority)}>
                            {insight.priority} priority
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                        <p>{insight.description}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Affected Clients ({insight.clients?.length || insight.count})</h4>
                        <div className="space-y-2">
                          {insight.clients?.slice(0, 5).map((client, idx) => (
                            <div key={`item-${idx}`} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                              <span className="font-medium">{client}</span>
                              <Button variant="ghost" size="sm">
                                View <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          ))}
                          {insight.clients?.length > 5 && (
                            <p className="text-sm text-muted-foreground text-center">
                              +{insight.clients.length - 5} more clients
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Recommended Action</h4>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <p className="text-purple-700">{insight.action}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-[#1a2744] hover:bg-[#1a2744]/90"
                          onClick={() => {
                            const firstClient = insight.clients?.[0];
                            const slug = firstClient?.client_id || firstClient?.id || firstClient?.name;
                            if (slug) navigateToClient(navigate, slug);
                            else navigate('/next-best-actions');
                          }}
                          data-testid={`intel-take-action-${insight.id}`}
                        >
                          Take Action
                        </Button>
                        <Button variant="outline" className="flex-1"
                          onClick={() => { toast.success('Follow-up scheduled'); }}
                          data-testid={`intel-schedule-${insight.id}`}
                        >
                          Schedule Follow-up
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Select an insight to see details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </Layout>
  );
};

export default ClientIntelligenceFeed;
