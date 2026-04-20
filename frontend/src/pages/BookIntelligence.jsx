import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { navigateToClient } from "@/lib/navigateToClient";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  PieChart,
  Target,
  Clock,
  RefreshCw,
  FileText,
  Lightbulb,
  ArrowRight,
  Shield,
  Calendar
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

const BookIntelligence = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState([]);
  const [taxOps, setTaxOps] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [sectorAnalysis, setSectorAnalysis] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, insightsRes, taxRes, engRes, sectorRes] = await Promise.all([
        fetch(`${API_URL}/api/book-intelligence/overview`),
        fetch(`${API_URL}/api/book-intelligence/insights`),
        fetch(`${API_URL}/api/book-intelligence/tax-opportunities`),
        fetch(`${API_URL}/api/book-intelligence/engagement-health`),
        fetch(`${API_URL}/api/book-intelligence/sector-analysis`)
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (insightsRes.ok) setInsights((await insightsRes.json()).insights || []);
      if (taxRes.ok) setTaxOps(await taxRes.json());
      if (engRes.ok) setEngagement(await engRes.json());
      if (sectorRes.ok) setSectorAnalysis(await sectorRes.json());
    } catch (error) {
      console.error("Failed to fetch book intelligence:", error);
      toast.error("Failed to load book intelligence");
    }
    setLoading(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(value);
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-white",
      low: "bg-gray-500 text-white"
    };
    return <Badge className={styles[priority] || styles.medium}>{priority}</Badge>;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      risk: AlertTriangle,
      opportunity: Lightbulb,
      compliance: Shield,
      revenue: DollarSign,
      retention: Users,
      market: TrendingUp
    };
    const Icon = icons[category] || Lightbulb;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Analyzing your book...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="book-intelligence">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
              <Brain className="h-7 w-7 text-purple-600" />
              Book Intelligence
            </h1>
            <p className="text-muted-foreground">AI-powered insights across your entire client book</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Book Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{overview?.book_summary?.total_clients || 0}</p>
                <p className="text-sm text-muted-foreground">Total Clients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(overview?.book_summary?.total_aum || 0)}</p>
                <p className="text-sm text-muted-foreground">Total AUM</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(overview?.book_summary?.total_unrealized_gains || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Unrealized Gains</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(overview?.book_summary?.total_unrealized_losses || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Unrealized Losses</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{overview?.book_summary?.average_engagement_score || 0}%</p>
                <p className="text-sm text-muted-foreground">Avg Engagement</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI-Generated Insights
            </CardTitle>
            <CardDescription>Critical findings that need your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No critical insights at this time</p>
            ) : (
              <div className="space-y-4">
                {insights.map((insight, idx) => (
                  <div 
                    key={`item-${idx}`} 
                    className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border"
                    data-testid={`insight-${idx}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      insight.category === 'risk' ? 'bg-red-100 text-red-600' :
                      insight.category === 'opportunity' ? 'bg-green-100 text-green-600' :
                      insight.category === 'retention' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getCategoryIcon(insight.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        {getPriorityBadge(insight.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {insight.affected_clients && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {insight.affected_clients} clients affected
                          </span>
                        )}
                        {insight.impact && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <DollarSign className="h-4 w-4" />
                            {insight.impact}
                          </span>
                        )}
                        {insight.deadline && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <Calendar className="h-4 w-4" />
                            {insight.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const slug = insight.client_id || insight.affected_client_id || insight.client_name;
                        if (slug) navigateToClient(navigate, slug);
                        else navigate('/next-best-actions');
                      }}
                      data-testid={`bookintel-take-action-${insight.id || insight.title?.replace(/\s/g,'-').toLowerCase()}`}
                    >
                      Take Action
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="sector" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sector">Sector Analysis</TabsTrigger>
            <TabsTrigger value="tax">Tax Opportunities</TabsTrigger>
            <TabsTrigger value="engagement">Client Health</TabsTrigger>
          </TabsList>

          {/* Sector Analysis */}
          <TabsContent value="sector">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Book Sector Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sectorAnalysis?.book_allocation && Object.entries(sectorAnalysis.book_allocation)
                    .sort(([,a], [,b]) => b - a)
                    .map(([sector, pct]) => (
                      <div key={sector}>
                        <div className="flex justify-between mb-1">
                          <span className="capitalize font-medium">{sector}</span>
                          <span className={pct > 30 ? "text-red-600 font-bold" : ""}>{pct}%</span>
                        </div>
                        <Progress 
                          value={pct} 
                          className={`h-3 ${pct > 30 ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"}`} 
                        />
                        {pct > 30 && (
                          <p className="text-xs text-red-600 mt-1">
                            Exceeds 30% concentration threshold
                          </p>
                        )}
                      </div>
                    ))}
                </div>
                
                {sectorAnalysis?.concentration_risks?.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Concentration Risks
                    </h4>
                    {sectorAnalysis.concentration_risks.map((risk, idx) => (
                      <p key={`item-${idx}`} className="text-sm text-red-700">
                        {risk.clients_overweight} clients are overweight {risk.sector} ({risk.book_exposure}% vs 30% max)
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Opportunities */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Tax-Loss Harvesting Opportunities
                </CardTitle>
                <CardDescription>
                  {taxOps?.days_to_eofy} days until end of financial year
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(taxOps?.total_harvestable_losses || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Harvestable Losses</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(taxOps?.total_potential_tax_savings || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Potential Tax Savings</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {taxOps?.clients_with_opportunities || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Clients Affected</p>
                  </div>
                </div>

                {/* Client List */}
                <div className="space-y-3">
                  {taxOps?.opportunities?.slice(0, 5).map((opp, idx) => (
                    <div key={`item-${idx}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{opp.client_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(opp.unrealized_losses)} in harvestable losses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatCurrency(opp.potential_tax_savings)}
                        </p>
                        <p className="text-xs text-muted-foreground">tax savings</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4">
                  Execute Tax Harvesting for All
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Health */}
          <TabsContent value="engagement">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  Client Engagement Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {engagement?.at_risk_count || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">At-Risk Clients</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(engagement?.total_revenue_at_risk || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Revenue at Risk</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {engagement?.average_engagement || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Average Engagement</p>
                  </div>
                </div>

                {/* At-Risk Clients */}
                <h4 className="font-semibold mb-3">Clients Needing Attention</h4>
                <div className="space-y-3">
                  {engagement?.at_risk_clients?.map((client, idx) => (
                    <div key={`item-${idx}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          client.engagement_score < 50 ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                          {client.engagement_score}
                        </div>
                        <div>
                          <p className="font-medium">{client.client_name}</p>
                          <p className="text-sm text-muted-foreground">{client.recommended_action}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(client.aum)}</p>
                        <p className="text-xs text-red-600">{formatCurrency(client.revenue_at_risk)} at risk</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-4">
                  Send Outreach to All At-Risk Clients
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default BookIntelligence;
