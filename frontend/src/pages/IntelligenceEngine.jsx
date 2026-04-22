import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Brain,
  Calendar,
  ChevronRight,
  DollarSign,
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
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Wallet,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { ComplianceFooter } from "@/components/ComplianceDisclaimer";
import FloatingActionRail from "@/components/platform/FloatingActionRail";

const API_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const IntelligenceEngine = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchComprehensiveAnalysis();
  }, []);

  const fetchComprehensiveAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/intelligence/comprehensive-analysis`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        throw new Error("Failed to fetch analysis");
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
      toast.error("Failed to load intelligence data");
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async () => {
    setGeneratingInsights(true);
    try {
      const response = await fetch(`${API_URL}/api/intelligence/generate-ai-insights`, {
        method: "POST"
      });
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data);
        toast.success("AI insights generated successfully");
      }
    } catch (error) {
      toast.error("Failed to generate AI insights");
    } finally {
      setGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-[#1a2744]" />
            <p className="text-muted-foreground">Analyzing your client base...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* FloatingActionRail hidden — user request */}
      <div className="space-y-6" data-testid="intelligence-engine-page">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[#1a2744] flex items-center gap-2">
              <Brain className="h-7 w-7 text-[#D4A84C]" />
              Cross-Client Intelligence
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered analysis across your entire client book
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchComprehensiveAnalysis}
              data-testid="refresh-analysis-btn"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={generateAIInsights}
              disabled={generatingInsights}
              className="bg-gradient-to-r from-[#1a2744] to-[#2a3754] text-white"
              data-testid="generate-ai-btn"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generatingInsights ? "Generating..." : "Generate AI Insights"}
            </Button>
          </div>
        </div>

        {/* Practice Health Score */}
        <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3754] text-white">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-5 gap-6">
              <div className="md:col-span-2">
                <p className="text-white/70 text-sm mb-2">Practice Health Score</p>
                <div className="flex items-end gap-4">
                  <span className="text-5xl font-bold">{analysis?.practice_summary?.health_score || 0}</span>
                  <span className="text-white/70 mb-2">/100</span>
                </div>
                <Progress value={analysis?.practice_summary?.health_score || 0} className="h-2 mt-3 bg-white/20" />
              </div>
              <div className="text-center">
                <p className="text-white/70 text-sm">Total AUM</p>
                <p className="text-2xl font-bold">{formatCurrency(analysis?.practice_summary?.total_aum || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-sm">Total Clients</p>
                <p className="text-2xl font-bold">{analysis?.practice_summary?.total_clients || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-white/70 text-sm">Avg Client AUM</p>
                <p className="text-2xl font-bold">{formatCurrency(analysis?.practice_summary?.average_client_aum || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#D4A84C]" />
              Priority Actions
            </CardTitle>
            <CardDescription>Top opportunities identified across your client base</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {analysis?.priority_actions?.map((action, idx) => (
                <div
                  key={`item-${idx}`}
                  className={`p-4 rounded-lg border ${idx === 0 ? 'bg-red-50 border-red-200' : idx === 1 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50'}`}
                  data-testid={`priority-action-${idx}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={idx === 0 ? "destructive" : idx === 1 ? "default" : "secondary"}>
                      Priority {action.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{action.category}</span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{action.action}</p>
                  <p className="text-xs text-green-600 font-medium mb-2">Impact: {action.impact}</p>
                  {action.deadline && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <Clock className="h-3 w-3" />
                      Deadline: {action.deadline}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Tabs */}
        <Tabs defaultValue="drift" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="drift">Portfolio Drift</TabsTrigger>
            <TabsTrigger value="tax">Tax Opportunities</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="fees">Fee Optimization</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          {/* Portfolio Drift Tab */}
          <TabsContent value="drift">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-[#D4A84C]" />
                  Portfolio Drift Analysis
                </CardTitle>
                <CardDescription>
                  {analysis?.portfolio_drift?.clients_needing_rebalance || 0} of {analysis?.portfolio_drift?.total_clients || 0} clients need rebalancing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-gray-50 text-center">
                    <p className="text-3xl font-bold text-[#1a2744]">{analysis?.portfolio_drift?.average_drift?.toFixed(1) || 0}%</p>
                    <p className="text-sm text-muted-foreground">Average Drift</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 text-center">
                    <p className="text-3xl font-bold text-orange-600">{analysis?.portfolio_drift?.clients_needing_rebalance || 0}</p>
                    <p className="text-sm text-muted-foreground">Need Rebalance</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 text-center">
                    <p className="text-3xl font-bold text-blue-600">{analysis?.portfolio_drift?.estimated_trades || 0}</p>
                    <p className="text-sm text-muted-foreground">Est. Trades Required</p>
                  </div>
                </div>
                
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {analysis?.portfolio_drift?.drift_by_client?.map((client) => (
                      <div
                        key={client.client_id}
                        className={`p-3 rounded-lg border ${client.needs_rebalance ? 'border-orange-200 bg-orange-50' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{client.client_name}</span>
                          <Badge variant={client.needs_rebalance ? "destructive" : "secondary"}>
                            {client.drift_percentage?.toFixed(1)}% drift
                          </Badge>
                        </div>
                        {client.overweight?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {client.overweight.map((o, i) => (
                              <Badge key={`item-${i}`} variant="outline" className="text-xs bg-red-50 text-red-600">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                {o.asset} +{o.diff?.toFixed(1)}%
                              </Badge>
                            ))}
                          </div>
                        )}
                        {client.underweight?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {client.underweight.map((u, i) => (
                              <Badge key={`item-${i}`} variant="outline" className="text-xs bg-blue-50 text-blue-600">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                {u.asset} -{u.diff?.toFixed(1)}%
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Opportunities Tab */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#D4A84C]" />
                  Tax Optimization Opportunities
                </CardTitle>
                <CardDescription>
                  {analysis?.tax_opportunities?.days_until_eofy || 0} days until EOFY
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-green-50 text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(analysis?.tax_opportunities?.total_potential_tax_savings || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Potential Tax Savings</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 text-center">
                    <p className="text-3xl font-bold text-[#1a2744]">
                      {formatCurrency(analysis?.tax_opportunities?.total_harvestable_losses || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Harvestable Losses</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {formatCurrency(analysis?.tax_opportunities?.total_unused_super_cap || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Unused Super Cap</p>
                  </div>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {analysis?.tax_opportunities?.opportunities_by_client?.map((client) => (
                      <div key={client.client_id} className="p-3 rounded-lg border">
                        <p className="font-medium mb-2">{client.client_name}</p>
                        {client.opportunities?.map((opp, i) => (
                          <div key={`item-${i}`} className="flex items-center justify-between py-1 border-t">
                            <div className="flex items-center gap-2">
                              {opp.type === "tax_loss_harvest" ? (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              ) : (
                                <Wallet className="h-4 w-4 text-blue-500" />
                              )}
                              <span className="text-sm">{opp.description}</span>
                            </div>
                            <Badge variant={opp.priority === "high" ? "destructive" : "secondary"}>
                              Save {formatCurrency(opp.potential_saving)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#D4A84C]" />
                  Client Engagement Analysis
                </CardTitle>
                <CardDescription>
                  {analysis?.engagement?.at_risk_count || 0} clients at risk of disengagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-gray-50 text-center">
                    <p className="text-3xl font-bold text-[#1a2744]">{analysis?.engagement?.average_engagement_score?.toFixed(0) || 0}</p>
                    <p className="text-sm text-muted-foreground">Avg Engagement</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 text-center">
                    <p className="text-3xl font-bold text-red-600">{analysis?.engagement?.at_risk_count || 0}</p>
                    <p className="text-sm text-muted-foreground">At Risk</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 text-center">
                    <p className="text-3xl font-bold text-orange-600">{analysis?.engagement?.reviews_overdue || 0}</p>
                    <p className="text-sm text-muted-foreground">Reviews Overdue</p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 text-center">
                    <p className="text-3xl font-bold text-amber-600">{analysis?.engagement?.clients_not_logged_90_days || 0}</p>
                    <p className="text-sm text-muted-foreground">90+ Days No Login</p>
                  </div>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {analysis?.engagement?.engagement_by_client?.map((client) => (
                      <div
                        key={client.client_id}
                        className={`p-3 rounded-lg border ${client.at_risk ? 'border-red-200 bg-red-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{client.client_name}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                              <span>Last login: {client.days_since_login} days ago</span>
                              <span>Last review: {client.days_since_review} days ago</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {client.review_overdue && (
                              <Badge variant="destructive" className="text-xs">Review Overdue</Badge>
                            )}
                            <div className="text-right">
                              <p className="font-bold">{client.engagement_score}</p>
                              <p className="text-xs text-muted-foreground">score</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fee Optimization Tab */}
          <TabsContent value="fees">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#D4A84C]" />
                  Fee Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                      <p className="text-sm text-green-600 font-medium">Potential Annual Savings</p>
                      <p className="text-4xl font-bold text-green-700">
                        {formatCurrency(analysis?.fee_optimization?.potential_annual_savings || 0)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-muted-foreground">Current Fee Rate</p>
                        <p className="text-2xl font-bold">{analysis?.fee_optimization?.current_fee_rate || 0}%</p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-muted-foreground">Optimal Fee Rate</p>
                        <p className="text-2xl font-bold text-green-600">{analysis?.fee_optimization?.optimal_fee_rate || 0}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{analysis?.fee_optimization?.recommendation}</p>
                    {analysis?.fee_optimization?.platforms_to_contact?.length > 0 && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="font-medium mb-2">Platforms to Contact:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis?.fee_optimization?.platforms_to_contact?.map((platform, i) => (
                            <Badge key={`item-${i}`} variant="outline">{platform}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#D4A84C]" />
                  Goals Analysis
                </CardTitle>
                <CardDescription>
                  {analysis?.goals?.success_rate || 0}% of client goals are on track
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-gray-50 text-center">
                    <p className="text-3xl font-bold text-[#1a2744]">{analysis?.goals?.total_goals || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Goals</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 text-center">
                    <p className="text-3xl font-bold text-green-600">{analysis?.goals?.goals_on_track || 0}</p>
                    <p className="text-sm text-muted-foreground">On Track</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-50 text-center">
                    <p className="text-3xl font-bold text-red-600">{analysis?.goals?.goals_at_risk || 0}</p>
                    <p className="text-sm text-muted-foreground">At Risk</p>
                  </div>
                </div>

                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {analysis?.goals?.all_goals?.map((goal, idx) => (
                      <div
                        key={`item-${idx}`}
                        className={`p-3 rounded-lg border ${!goal.on_track ? 'border-red-200 bg-red-50' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{goal.goal_name}</p>
                            <p className="text-sm text-muted-foreground">{goal.client_name}</p>
                          </div>
                          {goal.on_track ? (
                            <Badge className="bg-green-100 text-green-700">On Track</Badge>
                          ) : (
                            <Badge variant="destructive">At Risk</Badge>
                          )}
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{goal.progress}% complete</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Insights */}
        {aiInsights && (
          <Card className="border-[#D4A84C]/50 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#D4A84C]" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {aiInsights.success ? (
                  <p className="whitespace-pre-wrap">{aiInsights.ai_insights}</p>
                ) : (
                  <ul className="space-y-2">
                    {aiInsights.fallback_insights?.map((insight, i) => (
                      <li key={`item-${i}`}>{insight}</li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <ComplianceFooter />
      </div>
    </Layout>
  );
};

export default IntelligenceEngine;
