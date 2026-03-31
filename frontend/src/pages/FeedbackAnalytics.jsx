import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw, 
  Sparkles,
  Activity,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Zap,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const FeedbackAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [learningStatus, setLearningStatus] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  const advisorId = "default";

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statusRes, recsRes, analyticsRes, insightsRes] = await Promise.all([
        fetch(`${API_URL}/api/feedback-loop/learning-status`),
        fetch(`${API_URL}/api/feedback-loop/recommendations/${advisorId}`),
        fetch(`${API_URL}/api/feedback-loop/analytics/${advisorId}`),
        fetch(`${API_URL}/api/feedback-loop/insights/${advisorId}`)
      ]);

      if (statusRes.ok) setLearningStatus(await statusRes.json());
      if (recsRes.ok) {
        const data = await recsRes.json();
        setRecommendations(data.recommendations || []);
      }
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (insightsRes.ok) {
        const data = await insightsRes.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error("Error fetching feedback data:", error);
      toast.error("Failed to load feedback analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (recommendationId, actionType, feedbackType) => {
    try {
      const response = await fetch(`${API_URL}/api/feedback-loop/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_id: recommendationId,
          action_type: actionType,
          feedback_type: feedbackType,
          advisor_id: advisorId
        })
      });

      if (response.ok) {
        toast.success(`Feedback recorded: ${feedbackType}`);
        fetchAllData();
      }
    } catch (error) {
      toast.error("Failed to record feedback");
    }
  };

  const simulateLearning = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/feedback-loop/simulate-learning?advisor_id=${advisorId}&num_actions=10`,
        { method: "POST" }
      );
      if (response.ok) {
        toast.success("Learning data simulated successfully");
        fetchAllData();
      }
    } catch (error) {
      toast.error("Failed to simulate learning data");
    }
  };

  const getPriorityColor = (urgency) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "rebalance": return <RefreshCw className="h-5 w-5" />;
      case "tax_harvest": return <DollarSign className="h-5 w-5" />;
      case "client_outreach": return <Activity className="h-5 w-5" />;
      case "compliance_review": return <CheckCircle2 className="h-5 w-5" />;
      case "fee_optimization": return <TrendingUp className="h-5 w-5" />;
      case "cash_deployment": return <Zap className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading feedback analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="feedback-analytics-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Brain className="h-7 w-7 text-[#D4A84C]" />
              Feedback & Learning Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track how the system learns from your decisions to provide better recommendations
            </p>
          </div>
          <Button onClick={simulateLearning} variant="outline" data-testid="simulate-learning-btn">
            <Sparkles className="h-4 w-4 mr-2" />
            Simulate Learning Data
          </Button>
        </div>

        {/* Learning Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Learning Status</p>
                  <p className="text-2xl font-bold capitalize">
                    {learningStatus?.learning_system?.status || "No Data"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data Points</p>
                  <p className="text-2xl font-bold">
                    {learningStatus?.learning_system?.total_feedback_points || 0}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-2xl font-bold">
                    {learningStatus?.recommendation_improvement?.current_accuracy || "70%"}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                  <p className="text-2xl font-bold">
                    {analytics?.summary?.acceptance_rate?.toFixed(1) || 0}%
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <ThumbsUp className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Personalized Actions</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Personalized Recommendations */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  Actions ranked by your preferences and past decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div 
                      key={rec.recommendation_id || index} 
                      className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow"
                      data-testid={`recommendation-${index}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[#1a2744]/10 flex items-center justify-center text-[#1a2744]">
                            {getActionIcon(rec.action_type?.value || rec.action_type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground">{rec.reason}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getPriorityColor(rec.urgency)}>
                                {rec.urgency} priority
                              </Badge>
                              <Badge variant="outline">
                                Impact: ${rec.impact?.toLocaleString()}
                              </Badge>
                              <Badge variant="secondary">
                                Score: {(rec.personalized_score * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleFeedback(rec.recommendation_id, rec.action_type?.value || rec.action_type, "accepted")}
                            data-testid={`accept-btn-${index}`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleFeedback(rec.recommendation_id, rec.action_type?.value || rec.action_type, "rejected")}
                            data-testid={`reject-btn-${index}`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recommendations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No recommendations yet. Click "Simulate Learning Data" to generate sample recommendations.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>
                  Patterns and insights learned from your decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div 
                      key={`item-${index}`} 
                      className="p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-white"
                      data-testid={`insight-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                          <div className="mt-2">
                            <Progress value={insight.confidence * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Confidence: {(insight.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No insights yet. The system will learn from your feedback over time.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Analytics */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Last {analytics?.period_days || 90} days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Actions</span>
                      <span className="font-bold">{analytics?.summary?.total_actions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Portfolio Impact</span>
                      <span className="font-bold text-emerald-600">
                        ${(analytics?.summary?.portfolio_impact || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Revenue Impact</span>
                      <span className="font-bold text-blue-600">
                        ${(analytics?.summary?.revenue_impact || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tax Savings</span>
                      <span className="font-bold text-purple-600">
                        ${(analytics?.summary?.tax_savings || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Time Saved</span>
                      <span className="font-bold">
                        {analytics?.summary?.time_saved_hours?.toFixed(1) || 0} hours
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                  <CardDescription>How the system adapts to you</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Data Points</span>
                        <span className="text-sm font-medium">
                          {analytics?.learning_progress?.data_points_collected || 0}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((analytics?.learning_progress?.data_points_collected || 0) / 50 * 100, 100)} 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Preferences Learned</span>
                        <span className="text-sm font-medium">
                          {analytics?.learning_progress?.preferences_learned || 0}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((analytics?.learning_progress?.preferences_learned || 0) * 10, 100)} 
                      />
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Recommendation Accuracy</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {analytics?.learning_progress?.recommendation_accuracy || "70%"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analytics?.learning_progress?.improvement_from_baseline || "+0%"} from baseline
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Learned Preferences</CardTitle>
                <CardDescription>Actions you typically accept or reject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-emerald-600 mb-3 flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4" />
                      Preferred Actions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analytics?.preferences?.preferred_actions?.length > 0 ? (
                        analytics.preferences.preferred_actions.map((action, i) => (
                          <Badge key={`item-${i}`} variant="secondary" className="bg-emerald-100 text-emerald-800">
                            {action.replace(/_/g, " ")}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No preferences learned yet</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4" />
                      Avoided Actions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analytics?.preferences?.avoided_actions?.length > 0 ? (
                        analytics.preferences.avoided_actions.map((action, i) => (
                          <Badge key={`item-${i}`} variant="secondary" className="bg-red-100 text-red-800">
                            {action.replace(/_/g, " ")}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No preferences learned yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default FeedbackAnalytics;
