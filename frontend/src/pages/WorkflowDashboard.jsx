import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import {
  GitBranch,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  FileCheck,
  Calculator,
  RefreshCw,
  ChevronRight,
  Plus,
  Calendar,
  Zap
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL;

const WorkflowDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, templatesRes, instancesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/workflow/dashboard`),
        fetch(`${API_URL}/api/workflow/templates`),
        fetch(`${API_URL}/api/workflow/instances`),
        fetch(`${API_URL}/api/workflow/stats`)
      ]);

      if (dashRes.ok) setDashboard(await dashRes.json());
      if (templatesRes.ok) setTemplates((await templatesRes.json()).templates || []);
      if (instancesRes.ok) setInstances((await instancesRes.json()).workflows || []);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error("Failed to fetch workflow data:", error);
      toast.error("Failed to load workflow data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startWorkflow = async (templateKey, clientId = "demo_client", clientName = "Demo Client") => {
    try {
      const res = await fetch(
        `${API_URL}/api/workflow/quick-start/${templateKey}?client_id=${clientId}&client_name=${encodeURIComponent(clientName)}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        toast.success(`Workflow started: ${data.workflow?.name}`);
        fetchData();
      } else {
        toast.error("Failed to start workflow");
      }
    } catch (error) {
      toast.error("Failed to start workflow");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-500/10 text-green-600 border-green-500/20",
      completed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      paused: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      cancelled: "bg-gray-500/10 text-gray-600 border-gray-500/20",
      failed: "bg-red-500/10 text-red-600 border-red-500/20"
    };
    return <Badge className={styles[status] || styles.active}>{status}</Badge>;
  };

  const getStepIcon = (stepType) => {
    const icons = {
      manual: Users,
      automated: Zap,
      approval: CheckCircle,
      document: FileCheck,
      notification: AlertCircle
    };
    const Icon = icons[stepType] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#1a2744] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading workflow data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="workflow-dashboard">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2744]">Workflow Engine</h1>
            <p className="text-muted-foreground">Automate client onboarding, reviews, and compliance tasks</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Select onValueChange={(val) => startWorkflow(val)}>
              <SelectTrigger className="w-[200px]">
                <Plus className="h-4 w-4 mr-2" />
                <SelectValue placeholder="New Workflow" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id.replace("template_", "")}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Play className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totals?.active || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Workflows</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totals?.completed || 0}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboard?.summary?.steps_needing_action || 0}</p>
                  <p className="text-sm text-muted-foreground">Actions Needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.performance?.avg_completion_days || 0} days</p>
                  <p className="text-sm text-muted-foreground">Avg. Completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Workflows</TabsTrigger>
            <TabsTrigger value="actions">Action Items</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Active Workflows */}
          <TabsContent value="active" className="space-y-4">
            {instances.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Workflows</h3>
                  <p className="text-muted-foreground mb-4">Start a new workflow from the templates above</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {instances.map((workflow) => (
                  <Card key={workflow.workflow_id} data-testid={`workflow-${workflow.workflow_id}`}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{workflow.name}</h3>
                            {getStatusBadge(workflow.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Client: {workflow.client_name} | Step {workflow.current_step} of {workflow.total_steps}
                          </p>
                          <Progress value={workflow.progress_percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {workflow.progress_percentage}% complete
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Action Items */}
          <TabsContent value="actions" className="space-y-4">
            {dashboard?.action_items?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                  <p className="text-muted-foreground">No workflow actions requiring your attention</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {dashboard?.action_items?.map((item, idx) => (
                  <Card key={`item-${idx}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          {getStepIcon(item.step_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{item.step_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.step_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.workflow_name} • {item.client_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{item.estimated_duration}</p>
                          <Button size="sm" className="mt-2">Complete</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>{template.total_steps} steps</span>
                      <span>~{template.estimated_duration_days} days</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.step_types?.map((type, idx) => (
                        <Badge key={`item-${idx}`} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => startWorkflow(template.id.replace("template_", ""))}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Workflow
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default WorkflowDashboard;
