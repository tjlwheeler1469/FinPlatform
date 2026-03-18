import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Network, Users, Wallet, TrendingUp, TrendingDown, AlertTriangle, Zap, 
  DollarSign, Target, Brain, MessageSquare, RefreshCw, Search,
  ChevronRight, ArrowRight, ArrowUpRight, CheckCircle2, Clock,
  PieChart, BarChart3, Activity, Shield, Sparkles, Send, Eye,
  Building2, Briefcase, User, FileText, Link2, Loader2, X,
  Settings2, SlidersHorizontal, Play, Maximize2, Minimize2, Filter
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import ForceGraph2D from "react-force-graph-2d";

const API = process.env.REACT_APP_BACKEND_URL;

const formatCurrency = (value) => {
  if (!value) return "$0";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

// Node color mapping
const NODE_COLORS = {
  Client: "#3B82F6",
  Portfolio: "#10B981",
  Asset: "#8B5CF6",
  Sector: "#F59E0B",
  Insight: "#EF4444",
  Action: "#EC4899",
  Advisor: "#14B8A6",
  Household: "#6366F1",
  FinancialPlan: "#06B6D4",
};

// Node icon mapping
const NODE_ICONS = {
  Client: User,
  Portfolio: Briefcase,
  Asset: TrendingUp,
  Sector: PieChart,
  Insight: AlertTriangle,
  Action: Zap,
  Advisor: Users,
  Household: Building2,
  FinancialPlan: Target,
};

const KnowledgeGraphDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState([]);
  const [actions, setActions] = useState([]);
  const [retirementRisks, setRetirementRisks] = useState([]);
  const [revenueOpportunities, setRevenueOpportunities] = useState([]);
  const [crossClientRisks, setCrossClientRisks] = useState([]);
  const [activeTab, setActiveTab] = useState("insights");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  
  // Graph visualization state
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphFilter, setGraphFilter] = useState("all");
  const [graphFullscreen, setGraphFullscreen] = useState(false);
  const graphRef = useRef();
  
  // Adjustable action state
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionDetails, setActionDetails] = useState(null);
  const [actionAdjustments, setActionAdjustments] = useState({});
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, insightsRes, actionsRes, retirementRes, revenueRes, risksRes, graphRes] = await Promise.all([
        axios.get(`${API}/api/graph/overview`),
        axios.get(`${API}/api/graph/insights`),
        axios.get(`${API}/api/graph/actions/pending`),
        axios.get(`${API}/api/graph/queries/retirement-risk`),
        axios.get(`${API}/api/graph/queries/revenue-opportunities`),
        axios.get(`${API}/api/graph/queries/cross-client-risks`),
        axios.get(`${API}/api/graph/visualization/data`),
      ]);

      setOverview(overviewRes.data);
      setInsights(insightsRes.data.insights || []);
      setActions(actionsRes.data.actions || []);
      setRetirementRisks(retirementRes.data.results || []);
      setRevenueOpportunities(revenueRes.data.results || []);
      setCrossClientRisks(risksRes.data.results || []);
      setGraphData(graphRes.data);
    } catch (error) {
      console.error("Error fetching graph data:", error);
      toast.error("Failed to load knowledge graph data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter graph data
  const filteredGraphData = useMemo(() => {
    if (graphFilter === "all") return graphData;
    
    const filteredNodes = graphData.nodes?.filter(node => node.label === graphFilter) || [];
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    
    // Include connected nodes
    graphData.links?.forEach(link => {
      if (nodeIds.has(link.source?.id || link.source) || nodeIds.has(link.target?.id || link.target)) {
        const sourceNode = graphData.nodes.find(n => n.id === (link.source?.id || link.source));
        const targetNode = graphData.nodes.find(n => n.id === (link.target?.id || link.target));
        if (sourceNode) nodeIds.add(sourceNode.id);
        if (targetNode) nodeIds.add(targetNode.id);
      }
    });
    
    const finalNodes = graphData.nodes?.filter(node => nodeIds.has(node.id)) || [];
    const finalLinks = graphData.links?.filter(link => 
      nodeIds.has(link.source?.id || link.source) && nodeIds.has(link.target?.id || link.target)
    ) || [];
    
    return { nodes: finalNodes, links: finalLinks };
  }, [graphData, graphFilter]);

  // Handle AI question
  const handleAskQuestion = async () => {
    if (!aiQuestion.trim()) return;
    
    setAiLoading(true);
    setAiAnswer("");
    
    try {
      const response = await axios.post(`${API}/api/graph/ai/ask`, null, {
        params: { question: aiQuestion }
      });
      setAiAnswer(response.data.answer);
    } catch (error) {
      console.error("Error asking AI:", error);
      toast.error("Failed to get AI response");
    } finally {
      setAiLoading(false);
    }
  };

  // Handle opening action for adjustment
  const handleOpenAction = async (action) => {
    setSelectedAction(action);
    setActionDialogOpen(true);
    
    try {
      const response = await axios.get(`${API}/api/graph/actions/${action.id}/details`);
      setActionDetails(response.data);
      
      // Initialize adjustments with defaults
      const defaults = {};
      response.data.adjustable_parameters?.forEach(param => {
        defaults[param.name] = param.default;
      });
      setActionAdjustments(defaults);
    } catch (error) {
      console.error("Error fetching action details:", error);
      toast.error("Failed to load action details");
    }
  };

  // Handle executing action with adjustments
  const handleExecuteAction = async () => {
    if (!selectedAction) return;
    
    setExecutingAction(true);
    try {
      await axios.post(`${API}/api/graph/actions/${selectedAction.id}/adjust`, actionAdjustments);
      toast.success("Action executed successfully!");
      setActionDialogOpen(false);
      setSelectedAction(null);
      setActionDetails(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error executing action:", error);
      toast.error("Failed to execute action");
    } finally {
      setExecutingAction(false);
    }
  };

  // Handle node click in graph
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  // Graph node rendering
  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.name || node.id;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    
    // Draw node circle
    const size = node.val || 8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color || "#6B7280";
    ctx.fill();
    
    // Draw border for selected node
    if (selectedNode?.id === node.id) {
      ctx.strokeStyle = "#D4A84C";
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
    }
    
    // Draw label
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#1a2744";
    ctx.fillText(label, node.x, node.y + size + fontSize);
  }, [selectedNode]);

  const getSeverityColor = (severity) => {
    if (severity >= 5) return "bg-red-100 text-red-700 border-red-300";
    if (severity >= 4) return "bg-orange-100 text-orange-700 border-orange-300";
    if (severity >= 3) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-blue-100 text-blue-700 border-blue-300";
  };

  const getPriorityColor = (priority) => {
    if (priority === 1) return "bg-red-500";
    if (priority === 2) return "bg-orange-500";
    if (priority === 3) return "bg-yellow-500";
    return "bg-gray-500";
  };

  if (loading) {
    return (
      <Layout title="Knowledge Graph" subtitle="Financial Intelligence Platform">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4A84C]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Knowledge Graph" subtitle="AI-Powered Financial Intelligence">
      <div className="space-y-6" data-testid="knowledge-graph-dashboard">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Network className="h-8 w-8 text-[#D4A84C]" />
                <div>
                  <p className="text-white/70 text-xs">Graph Nodes</p>
                  <p className="text-2xl font-bold">{overview?.summary?.total_nodes || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Link2 className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-white/70 text-xs">Relationships</p>
                  <p className="text-2xl font-bold">{overview?.summary?.total_relationships || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-400" />
                <div>
                  <p className="text-white/70 text-xs">Total AUM</p>
                  <p className="text-2xl font-bold">{formatCurrency(overview?.summary?.total_aum)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-400" />
                <div>
                  <p className="text-white/70 text-xs">Active Insights</p>
                  <p className="text-2xl font-bold">{overview?.summary?.active_insights || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#1a2744] to-[#2a3f5f] text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Zap className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-white/70 text-xs">Pending Actions</p>
                  <p className="text-2xl font-bold">{overview?.summary?.pending_actions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Question Box */}
        <Card className="border-[#D4A84C]/30 bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[#D4A84C]" />
              Ask the Knowledge Graph
            </CardTitle>
            <CardDescription>
              Ask natural language questions about your client book
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Which clients are most at risk for retirement?"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAskQuestion()}
                className="flex-1"
                data-testid="ai-question-input"
              />
              <Button 
                onClick={handleAskQuestion} 
                disabled={aiLoading}
                className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                data-testid="ai-ask-btn"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {aiAnswer && (
              <div className="mt-4 p-4 bg-white rounded-lg border" data-testid="ai-answer">
                <p className="text-sm whitespace-pre-wrap">{aiAnswer}</p>
              </div>
            )}
            <div className="mt-2 flex gap-2 flex-wrap">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setAiQuestion("Which clients are most at risk for retirement?")}>
                Retirement risk?
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setAiQuestion("Where are the best revenue opportunities?")}>
                Revenue opportunities?
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setAiQuestion("Which portfolios need rebalancing?")}>
                Rebalancing needed?
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setAiQuestion("What are the top insights this week?")}>
                Top insights?
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="graph" data-testid="tab-graph">
              <Network className="h-4 w-4 mr-2" />
              Graph
            </TabsTrigger>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <Eye className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Insights ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="actions" data-testid="tab-actions">
              <Zap className="h-4 w-4 mr-2" />
              Actions ({actions.length})
            </TabsTrigger>
            <TabsTrigger value="risks" data-testid="tab-risks">
              <Shield className="h-4 w-4 mr-2" />
              Risks
            </TabsTrigger>
            <TabsTrigger value="opportunities" data-testid="tab-opportunities">
              <TrendingUp className="h-4 w-4 mr-2" />
              Opportunities
            </TabsTrigger>
          </TabsList>

          {/* Graph Tab */}
          <TabsContent value="graph" className="space-y-4">
            <div className={`relative ${graphFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
              {/* Graph Controls */}
              <div className="flex items-center justify-between mb-4 p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={graphFilter} onValueChange={setGraphFilter}>
                      <SelectTrigger className="w-[180px]" data-testid="graph-filter">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Nodes</SelectItem>
                        <SelectItem value="Client">Clients</SelectItem>
                        <SelectItem value="Portfolio">Portfolios</SelectItem>
                        <SelectItem value="Asset">Assets</SelectItem>
                        <SelectItem value="Insight">Insights</SelectItem>
                        <SelectItem value="Action">Actions</SelectItem>
                        <SelectItem value="Sector">Sectors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Legend */}
                  <div className="hidden md:flex items-center gap-3">
                    {Object.entries(NODE_COLORS).slice(0, 5).map(([label, color]) => (
                      <div key={label} className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => graphRef.current?.zoomToFit(400)}
                    data-testid="graph-fit-btn"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Fit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGraphFullscreen(!graphFullscreen)}
                    data-testid="graph-fullscreen-btn"
                  >
                    {graphFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Graph Container */}
              <Card className={graphFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[500px]'}>
                <CardContent className="p-0 h-full">
                  <ForceGraph2D
                    ref={graphRef}
                    graphData={filteredGraphData}
                    nodeLabel={node => `${node.label}: ${node.name}`}
                    nodeCanvasObject={nodeCanvasObject}
                    nodeCanvasObjectMode={() => "replace"}
                    linkColor={() => "#CBD5E1"}
                    linkWidth={1.5}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={1}
                    onNodeClick={handleNodeClick}
                    cooldownTicks={100}
                    onEngineStop={() => graphRef.current?.zoomToFit(400)}
                  />
                </CardContent>
              </Card>

              {/* Selected Node Details */}
              {selectedNode && (
                <Card className="mt-4">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: NODE_COLORS[selectedNode.label] || "#6B7280" }} 
                        />
                        {selectedNode.name}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedNode(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      <Badge variant="outline">{selectedNode.label}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {selectedNode.data && Object.entries(selectedNode.data).slice(0, 8).map(([key, value]) => {
                        if (key === 'label' || key === 'id' || key === 'holdings' || key === 'goals') return null;
                        return (
                          <div key={key}>
                            <p className="text-muted-foreground text-xs capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="font-medium">
                              {typeof value === 'number' && key.includes('value') 
                                ? formatCurrency(value) 
                                : String(value)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Node Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Graph Entity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overview?.node_counts && Object.entries(overview.node_counts).map(([label, count]) => {
                      const IconComponent = NODE_ICONS[label] || Network;
                      return (
                        <div key={label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent 
                              className="h-4 w-4" 
                              style={{ color: NODE_COLORS[label] || "#6B7280" }} 
                            />
                            <span className="text-sm">{label}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Relationship Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Relationship Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overview?.relationship_counts && Object.entries(overview.relationship_counts).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-mono text-muted-foreground">{type}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700">Clients at Retirement Risk</p>
                      <p className="text-2xl font-bold text-red-800">{retirementRisks.length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700">Revenue Potential</p>
                      <p className="text-2xl font-bold text-emerald-800">
                        {formatCurrency(revenueOpportunities.reduce((sum, r) => sum + r.total_potential_revenue, 0))}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700">Cross-Client Risks</p>
                      <p className="text-2xl font-bold text-orange-800">{crossClientRisks.length}</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${getSeverityColor(insight.severity)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(insight.severity)}>
                          Severity {insight.severity}
                        </Badge>
                        <Badge variant="outline">{insight.type}</Badge>
                      </div>
                      <h3 className="font-semibold">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                      
                      {insight.affected_clients?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Affected Clients:</p>
                          <div className="flex gap-1 flex-wrap">
                            {insight.affected_clients.map((client) => (
                              <Badge key={client.id} variant="secondary" className="text-xs">
                                {client.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {insight.recommended_actions?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">Recommended Actions:</p>
                          <div className="space-y-1">
                            {insight.recommended_actions.map((action) => (
                              <div key={action.id} className="flex items-center gap-2 text-sm">
                                <ArrowRight className="h-3 w-3" />
                                <span>{action.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  Impact: {action.impact_score}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Actions Tab - With Adjustable Recommendations */}
          <TabsContent value="actions" className="space-y-4">
            {actions.map((action) => (
              <Card key={action.id} data-testid={`action-card-${action.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(action.priority)}`} />
                        <span className="text-xs text-muted-foreground">Priority {action.priority}</span>
                        <Badge variant="outline">{action.type}</Badge>
                        <Badge variant="secondary">Impact: {action.impact_score}</Badge>
                      </div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-muted-foreground">
                          Client: <span className="text-foreground">{action.client?.name}</span>
                        </span>
                        <span className="text-muted-foreground">
                          From: <span className="text-foreground">{action.insight?.title}</span>
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                      onClick={() => handleOpenAction(action)}
                      data-testid={`open-action-btn-${action.id}`}
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-1" />
                      Adjust & Execute
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {actions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-lg">All Caught Up!</h3>
                  <p className="text-muted-foreground">No pending actions at this time.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Risks Tab */}
          <TabsContent value="risks" className="space-y-4">
            <h3 className="font-semibold">Retirement Risks</h3>
            {retirementRisks.map((risk) => (
              <Card key={risk.client_id} className="border-l-4 border-red-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{risk.client_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Age {risk.age} | Retirement at {risk.retirement_age} | {risk.retirement_risk?.years_to_retirement} years remaining
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Funding:</span>
                          <Progress value={risk.retirement_risk?.funding_ratio || 0} className="w-32 h-2" />
                          <span className="text-sm font-medium">{risk.retirement_risk?.funding_ratio}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Required Growth:</span>
                          <span className="text-sm font-medium text-orange-600">
                            {risk.retirement_risk?.required_annual_growth}% p.a.
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {risk.retirement_risk?.risk_factors?.map((factor, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">{factor}</Badge>
                        ))}
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-700">
                      Risk Score: {risk.retirement_risk?.risk_score}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Separator className="my-6" />

            <h3 className="font-semibold">Cross-Client Risks</h3>
            {crossClientRisks.map((risk, i) => (
              <Card key={i} className="border-l-4 border-orange-400">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(risk.severity)}>
                      Severity {risk.severity}
                    </Badge>
                    <Badge variant="outline">{risk.risk_type}</Badge>
                  </div>
                  <h4 className="font-semibold">{risk.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{risk.description}</p>
                  <p className="text-sm mt-2 text-blue-600">{risk.recommendation}</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities" className="space-y-4">
            {revenueOpportunities.map((opp) => (
              <Card key={opp.client_id} className="border-l-4 border-emerald-400">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{opp.client_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Total Value: {formatCurrency(opp.total_value)}
                      </p>
                      <div className="mt-3 space-y-2">
                        {opp.opportunities?.map((opportunity, i) => (
                          <div key={i} className="p-2 bg-emerald-50 rounded">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{opportunity.description}</span>
                              <Badge variant="secondary">{formatCurrency(opportunity.potential_revenue)}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{opportunity.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total Potential</p>
                      <p className="text-xl font-bold text-emerald-600">
                        {formatCurrency(opp.total_potential_revenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Adjustable Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#D4A84C]" />
              Adjust Recommendation
            </DialogTitle>
            <DialogDescription>
              Fine-tune the parameters before executing this action
            </DialogDescription>
          </DialogHeader>

          {actionDetails && (
            <div className="space-y-6">
              {/* Action Info */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{actionDetails.action?.type}</Badge>
                  <Badge variant="secondary">Impact: {actionDetails.action?.impact_score}</Badge>
                </div>
                <h3 className="font-semibold">{actionDetails.action?.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{actionDetails.action?.description}</p>
                
                {actionDetails.client && (
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">Client:</span>{" "}
                      <span className="font-medium">{actionDetails.client.name}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Risk Profile:</span>{" "}
                      <span className="font-medium capitalize">{actionDetails.client.risk_profile}</span>
                    </span>
                    {actionDetails.portfolio && (
                      <span>
                        <span className="text-muted-foreground">Portfolio:</span>{" "}
                        <span className="font-medium">{formatCurrency(actionDetails.portfolio.total_value)}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Adjustable Parameters */}
              <div className="space-y-6">
                <h4 className="font-semibold flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Adjustable Parameters
                </h4>
                
                {actionDetails.adjustable_parameters?.map((param) => (
                  <div key={param.name} className="space-y-3" data-testid={`param-${param.name}`}>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{param.label}</Label>
                      <span className="text-sm font-bold text-[#D4A84C]">
                        {param.unit === "$" && "$"}
                        {actionAdjustments[param.name] ?? param.default}
                        {param.unit !== "$" && ` ${param.unit}`}
                      </span>
                    </div>
                    <Slider
                      value={[actionAdjustments[param.name] ?? param.default]}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      onValueChange={(value) => setActionAdjustments(prev => ({
                        ...prev,
                        [param.name]: value[0]
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{param.unit === "$" ? formatCurrency(param.min) : `${param.min} ${param.unit}`}</span>
                      <span>{param.unit === "$" ? formatCurrency(param.max) : `${param.max} ${param.unit}`}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <Card className="bg-[#D4A84C]/10 border-[#D4A84C]/30">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Execution Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(actionAdjustments).map(([key, value]) => {
                      const param = actionDetails.adjustable_parameters?.find(p => p.name === key);
                      if (!param) return null;
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{param.label}:</span>
                          <span className="font-medium">
                            {param.unit === "$" ? formatCurrency(value) : `${value} ${param.unit}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteAction}
              disabled={executingAction}
              className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
              data-testid="execute-action-btn"
            >
              {executingAction ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Execute Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default KnowledgeGraphDashboard;
