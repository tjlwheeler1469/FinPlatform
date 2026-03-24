import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, FileText, AlertTriangle, CheckCircle2, XCircle,
  Download, TrendingUp, Users, Clock, BarChart3,
  Activity, Eye, Filter, RefreshCw, ChevronRight,
  Calculator, Scale, FileCheck, AlertCircle, Loader2,
  ArrowUpRight, ArrowDownRight, Building2, ClipboardCheck,
  History, Lock, Unlock, BookOpen
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const COMPLIANCE_COLORS = {
  pass: "#10B981",
  warning: "#F59E0B",
  block: "#EF4444"
};

const AdviceOSDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [breaches, setBreaches] = useState([]);
  
  // Scenario Generator State
  const [showScenarioGenerator, setShowScenarioGenerator] = useState(false);
  const [scenarioInputs, setScenarioInputs] = useState({
    client_id: "client_1",
    adviser_id: "adv_default",
    risk_profile: "balanced",
    investment_timeframe_years: 10,
    initial_investment: 500000,
    monthly_contribution: 2000,
    income_requirement: 0
  });
  const [generatedScenarios, setGeneratedScenarios] = useState(null);
  const [generatingScenarios, setGeneratingScenarios] = useState(false);
  
  // Decision Modal State
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedScenarioSet, setSelectedScenarioSet] = useState(null);
  const [decisionForm, setDecisionForm] = useState({
    selected_scenario_id: "",
    justification_text: "",
    confirmation: {
      reviewed_scenarios: false,
      client_best_interest: false,
      understood_risks: false,
      discussed_with_client: false
    },
    override_occurred: false,
    override_reason: ""
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, scenariosRes, auditRes, breachRes] = await Promise.all([
        fetch(`${API_URL}/api/reports/dashboard/summary`),
        fetch(`${API_URL}/api/reports/scenario-history?limit=20`),
        fetch(`${API_URL}/api/reports/audit-export?limit=50`),
        fetch(`${API_URL}/api/reports/breach-report`)
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setDashboardData(data);
      }
      
      if (scenariosRes.ok) {
        const data = await scenariosRes.json();
        setScenarios(data.scenarios || []);
      }
      
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.audit_logs || []);
      }
      
      if (breachRes.ok) {
        const data = await breachRes.json();
        setBreaches(data.breaches || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const generateScenarios = async () => {
    setGeneratingScenarios(true);
    try {
      const res = await fetch(`${API_URL}/api/scenarios/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenarioInputs)
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedScenarios(data);
        toast.success("Scenarios generated successfully!");
        // Refresh dashboard data
        fetchDashboardData();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to generate scenarios");
      }
    } catch (error) {
      console.error("Error generating scenarios:", error);
      toast.error("Failed to generate scenarios");
    } finally {
      setGeneratingScenarios(false);
    }
  };

  const submitDecision = async () => {
    if (!decisionForm.selected_scenario_id) {
      toast.error("Please select a scenario");
      return;
    }
    if (!decisionForm.confirmation.reviewed_scenarios || 
        !decisionForm.confirmation.client_best_interest ||
        !decisionForm.confirmation.understood_risks) {
      toast.error("Please confirm all required checkboxes");
      return;
    }
    if (!decisionForm.justification_text.trim()) {
      toast.error("Please provide justification for your decision");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/compliance/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_set_id: selectedScenarioSet.id,
          adviser_id: "adv_default",
          selected_scenario_id: decisionForm.selected_scenario_id,
          decision: "approved",
          justification_text: decisionForm.justification_text,
          confirmation: decisionForm.confirmation,
          override_occurred: decisionForm.override_occurred,
          override_reason: decisionForm.override_occurred ? decisionForm.override_reason : null
        })
      });

      if (res.ok) {
        toast.success("Decision recorded successfully!");
        setShowDecisionModal(false);
        setGeneratedScenarios(null);
        fetchDashboardData();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to record decision");
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
      toast.error("Failed to submit decision");
    }
  };

  const initializeDemo = async () => {
    try {
      // Initialize default licensee/adviser
      await fetch(`${API_URL}/api/compliance/init-default`, { method: "POST" });
      // Generate demo data
      await fetch(`${API_URL}/api/reports/generate-demo-data`, { method: "POST" });
      toast.success("Demo data initialized!");
      fetchDashboardData();
    } catch (error) {
      console.error("Error initializing demo:", error);
    }
  };

  const downloadReport = async (reportType) => {
    try {
      const res = await fetch(`${API_URL}/api/reports/download/csv/${reportType}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success(`${reportType} report downloaded`);
      }
    } catch (error) {
      toast.error("Failed to download report");
    }
  };

  if (loading) {
    return (
      <Layout title="AdviceOS" subtitle="Compliance-First Decision Support">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#D4A84C]" />
            <p className="text-muted-foreground">Loading AdviceOS Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const summary = dashboardData?.summary || {
    compliance_score: 100,
    scenarios: { total: 0, last_30_days: 0 },
    compliance_checks: { total: 0, passed: 0, warnings: 0, blocked: 0 },
    breaches: { open: 0, resolved: 0 },
    decisions: { total: 0, approved: 0, overrides: 0 }
  };

  const complianceChartData = [
    { name: "Passed", value: summary.compliance_checks.passed, color: COMPLIANCE_COLORS.pass },
    { name: "Warnings", value: summary.compliance_checks.warnings, color: COMPLIANCE_COLORS.warning },
    { name: "Blocked", value: summary.compliance_checks.blocked, color: COMPLIANCE_COLORS.block }
  ].filter(d => d.value > 0);

  return (
    <Layout title="AdviceOS" subtitle="Compliance-First Decision Support Platform">
      <div className="space-y-6" data-testid="adviceos-dashboard">
        {/* Compliance Disclaimer Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">This tool provides decision support only</p>
                <p className="text-xs text-blue-700 mt-1">
                  This is not financial advice. All scenarios are for comparison purposes only. 
                  The adviser must confirm all outputs before presenting to clients.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-emerald-700">Compliance Score</span>
              </div>
              <p className="text-3xl font-bold text-emerald-700 mt-2">{summary.compliance_score}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#D4A84C]" />
                <span className="text-sm text-muted-foreground">Scenarios</span>
              </div>
              <p className="text-3xl font-bold mt-2">{summary.scenarios.total}</p>
              <p className="text-xs text-muted-foreground">{summary.scenarios.last_30_days} last 30 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Decisions</span>
              </div>
              <p className="text-3xl font-bold mt-2">{summary.decisions.total}</p>
              <p className="text-xs text-muted-foreground">{summary.decisions.overrides} overrides</p>
            </CardContent>
          </Card>
          
          <Card className={summary.breaches.open > 0 ? "border-amber-300 bg-amber-50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${summary.breaches.open > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
                <span className="text-sm text-muted-foreground">Open Breaches</span>
              </div>
              <p className={`text-3xl font-bold mt-2 ${summary.breaches.open > 0 ? "text-amber-600" : ""}`}>
                {summary.breaches.open}
              </p>
              <p className="text-xs text-muted-foreground">{summary.breaches.resolved} resolved</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Audit Entries</span>
              </div>
              <p className="text-3xl font-bold mt-2">{summary.audit_logs || auditLogs.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scenario Generator Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-[#D4A84C]" />
                    Generate Scenarios
                  </CardTitle>
                  <CardDescription>
                    Create multiple scenarios for comparison - NO recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                    onClick={() => setShowScenarioGenerator(true)}
                    data-testid="open-scenario-generator"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    New Scenario Analysis
                  </Button>
                </CardContent>
              </Card>

              {/* Compliance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600" />
                    Compliance Checks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {complianceChartData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={complianceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {complianceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                      <p>No compliance checks yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#D4A84C]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {auditLogs.length > 0 ? (
                    <div className="space-y-3">
                      {auditLogs.slice(0, 10).map((log, idx) => (
                        <div key={log.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="p-2 rounded-full bg-white">
                            {log.action_type === "create" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                            {log.action_type === "approve" && <ClipboardCheck className="h-4 w-4 text-blue-600" />}
                            {log.action_type === "update" && <RefreshCw className="h-4 w-4 text-amber-600" />}
                            {!["create", "approve", "update"].includes(log.action_type) && <Activity className="h-4 w-4 text-gray-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {log.action_type?.toUpperCase()} - {log.entity_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.user_id} • {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Activity className="h-8 w-8 mb-2" />
                      <p>No activity recorded yet</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={initializeDemo}
                      >
                        Initialize Demo Data
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Scenario History</h2>
              <Button 
                className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                onClick={() => setShowScenarioGenerator(true)}
              >
                <Calculator className="h-4 w-4 mr-2" />
                New Scenario
              </Button>
            </div>
            
            <div className="space-y-3">
              {scenarios.length > 0 ? scenarios.map((scenario, idx) => (
                <Card key={scenario.id || idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">Scenario Set: {scenario.id?.slice(-8)}</h3>
                          <Badge variant={
                            scenario.compliance_result === "pass" ? "default" :
                            scenario.compliance_result === "warning" ? "secondary" : "destructive"
                          } className={
                            scenario.compliance_result === "pass" ? "bg-emerald-100 text-emerald-800" :
                            scenario.compliance_result === "warning" ? "bg-amber-100 text-amber-800" : ""
                          }>
                            {scenario.compliance_result || "pending"}
                          </Badge>
                          <Badge variant="outline">
                            {scenario.decision || "pending review"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Client: {scenario.client_id} • {scenario.scenarios?.length || 0} scenarios generated
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(scenario.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No scenarios generated yet</p>
                    <Button 
                      className="mt-4 bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                      onClick={() => setShowScenarioGenerator(true)}
                    >
                      Generate First Scenario
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-700">{summary.compliance_checks.passed}</p>
                  <p className="text-sm text-emerald-600">Passed Checks</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-700">{summary.compliance_checks.warnings}</p>
                  <p className="text-sm text-amber-600">Warnings</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-700">{summary.compliance_checks.blocked}</p>
                  <p className="text-sm text-red-600">Blocked</p>
                </CardContent>
              </Card>
            </div>

            {/* Breaches Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Compliance Breaches
                </CardTitle>
              </CardHeader>
              <CardContent>
                {breaches.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {breaches.map((breach, idx) => (
                        <div key={breach.id || idx} className="p-3 rounded-lg border bg-muted/30">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  breach.severity === "critical" ? "destructive" :
                                  breach.severity === "high" ? "destructive" :
                                  breach.severity === "medium" ? "secondary" : "outline"
                                }>
                                  {breach.severity}
                                </Badge>
                                <Badge variant={breach.status === "open" ? "destructive" : "outline"}>
                                  {breach.status}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium mt-2">{breach.breach_type}</p>
                              <p className="text-xs text-muted-foreground">{breach.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
                    <p>No compliance breaches recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Audit Trail</h2>
              <Button variant="outline" onClick={() => downloadReport("audit-logs")}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <ScrollArea className="h-[500px]">
                  {auditLogs.length > 0 ? (
                    <div className="space-y-2">
                      {auditLogs.map((log, idx) => (
                        <div key={log.id || idx} className="flex items-start gap-3 p-3 rounded border bg-muted/20">
                          <div className="p-2 rounded bg-white border">
                            <Lock className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{log.action_type}</Badge>
                              <Badge variant="secondary">{log.entity_type}</Badge>
                            </div>
                            <p className="text-sm mt-1">Entity: {log.entity_id}</p>
                            <p className="text-xs text-muted-foreground">
                              User: {log.user_id} ({log.user_role}) • {new Date(log.timestamp).toLocaleString()}
                            </p>
                            {log.hash && (
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                Hash: {log.hash.slice(0, 16)}...
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3" />
                      <p>No audit logs recorded</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <h2 className="text-lg font-semibold">Download Reports</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData?.report_types?.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#D4A84C]" />
                      {report.name}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadReport(report.id === "audit_export" ? "audit-logs" : report.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">Audit Logs Export</CardTitle>
                      <CardDescription>Full audit trail for regulatory compliance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" onClick={() => downloadReport("audit-logs")}>
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">Scenarios Export</CardTitle>
                      <CardDescription>Historical scenarios with compliance status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" onClick={() => downloadReport("scenarios")}>
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base">Breaches Export</CardTitle>
                      <CardDescription>Compliance breaches and resolutions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" onClick={() => downloadReport("breaches")}>
                        <Download className="h-4 w-4 mr-2" />
                        Download CSV
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Scenario Generator Dialog */}
      <Dialog open={showScenarioGenerator} onOpenChange={setShowScenarioGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#D4A84C]" />
              Generate Financial Scenarios
            </DialogTitle>
            <DialogDescription>
              This tool generates multiple scenarios for comparison. No scenario is recommended over others.
              Adviser must review and select the appropriate strategy.
            </DialogDescription>
          </DialogHeader>

          {!generatedScenarios ? (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client ID</Label>
                  <Select 
                    value={scenarioInputs.client_id}
                    onValueChange={(v) => setScenarioInputs({...scenarioInputs, client_id: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client_1">James & Sarah Wheeler</SelectItem>
                      <SelectItem value="client_2">Chen Family Trust</SelectItem>
                      <SelectItem value="client_3">Robert Mitchell</SelectItem>
                      <SelectItem value="client_5">Patel SMSF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Risk Profile</Label>
                  <Select 
                    value={scenarioInputs.risk_profile}
                    onValueChange={(v) => setScenarioInputs({...scenarioInputs, risk_profile: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderately_conservative">Moderately Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="moderately_aggressive">Moderately Aggressive</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Initial Investment ($)</Label>
                  <Input 
                    type="number"
                    value={scenarioInputs.initial_investment}
                    onChange={(e) => setScenarioInputs({...scenarioInputs, initial_investment: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Monthly Contribution ($)</Label>
                  <Input 
                    type="number"
                    value={scenarioInputs.monthly_contribution}
                    onChange={(e) => setScenarioInputs({...scenarioInputs, monthly_contribution: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Investment Timeframe (years)</Label>
                  <Input 
                    type="number"
                    value={scenarioInputs.investment_timeframe_years}
                    onChange={(e) => setScenarioInputs({...scenarioInputs, investment_timeframe_years: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Income Requirement ($)</Label>
                  <Input 
                    type="number"
                    value={scenarioInputs.income_requirement}
                    onChange={(e) => setScenarioInputs({...scenarioInputs, income_requirement: parseFloat(e.target.value)})}
                    placeholder="0 for growth focus"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowScenarioGenerator(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                  onClick={generateScenarios}
                  disabled={generatingScenarios}
                >
                  {generatingScenarios ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Generate Scenarios
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Disclaimer */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-3">
                  <p className="text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                    {generatedScenarios.disclaimer}
                  </p>
                </CardContent>
              </Card>

              {/* Generated Scenarios */}
              <div className="space-y-4">
                <h3 className="font-semibold">Generated Scenarios (No Ranking)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {generatedScenarios.scenario_set?.scenarios?.map((scenario, idx) => (
                    <Card key={scenario.scenario_id} className="border-2 hover:border-[#D4A84C] transition-colors">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{scenario.scenario_name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expected Return</span>
                            <span className="font-medium">{scenario.metrics.expected_return_mid}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Volatility</span>
                            <span className="font-medium">{scenario.metrics.volatility}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">10yr Projection</span>
                            <span className="font-medium">{formatCurrency(scenario.metrics.projected_value_10yr)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Income Yield</span>
                            <span className="font-medium">{scenario.metrics.income_yield}%</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">{scenario.rationale}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Trade-offs */}
              {generatedScenarios.scenario_set?.trade_offs && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Trade-Off Analysis
                  </h3>
                  <div className="space-y-2">
                    {generatedScenarios.scenario_set.trade_offs.map((tradeoff, idx) => (
                      <Card key={idx} className="bg-muted/50">
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{tradeoff.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">{tradeoff.impact_description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setGeneratedScenarios(null)}>
                  Modify Inputs
                </Button>
                <Button 
                  className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
                  onClick={() => {
                    setSelectedScenarioSet(generatedScenarios.scenario_set);
                    setShowDecisionModal(true);
                  }}
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Record Adviser Decision
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adviser Decision Dialog */}
      <Dialog open={showDecisionModal} onOpenChange={setShowDecisionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#D4A84C]" />
              Adviser Decision & Confirmation
            </DialogTitle>
            <DialogDescription>
              As the adviser, you must select a scenario and confirm your decision.
              This will be permanently recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div>
              <Label>Select Scenario</Label>
              <Select 
                value={decisionForm.selected_scenario_id}
                onValueChange={(v) => setDecisionForm({...decisionForm, selected_scenario_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a scenario..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedScenarioSet?.scenarios?.map((s) => (
                    <SelectItem key={s.scenario_id} value={s.scenario_id}>
                      {s.scenario_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Adviser Confirmation (Required)</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="reviewed"
                    checked={decisionForm.confirmation.reviewed_scenarios}
                    onCheckedChange={(checked) => setDecisionForm({
                      ...decisionForm,
                      confirmation: {...decisionForm.confirmation, reviewed_scenarios: checked}
                    })}
                  />
                  <label htmlFor="reviewed" className="text-sm">
                    I have reviewed all scenarios and trade-offs
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="bestinterest"
                    checked={decisionForm.confirmation.client_best_interest}
                    onCheckedChange={(checked) => setDecisionForm({
                      ...decisionForm,
                      confirmation: {...decisionForm.confirmation, client_best_interest: checked}
                    })}
                  />
                  <label htmlFor="bestinterest" className="text-sm">
                    This decision is in the client's best interest
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="risks"
                    checked={decisionForm.confirmation.understood_risks}
                    onCheckedChange={(checked) => setDecisionForm({
                      ...decisionForm,
                      confirmation: {...decisionForm.confirmation, understood_risks: checked}
                    })}
                  />
                  <label htmlFor="risks" className="text-sm">
                    I understand and have explained the risks to the client
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="discussed"
                    checked={decisionForm.confirmation.discussed_with_client}
                    onCheckedChange={(checked) => setDecisionForm({
                      ...decisionForm,
                      confirmation: {...decisionForm.confirmation, discussed_with_client: checked}
                    })}
                  />
                  <label htmlFor="discussed" className="text-sm">
                    I have discussed this strategy with the client
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Label>Justification (Required)</Label>
              <Textarea 
                placeholder="Explain why this scenario is appropriate for the client..."
                value={decisionForm.justification_text}
                onChange={(e) => setDecisionForm({...decisionForm, justification_text: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox 
                id="override"
                checked={decisionForm.override_occurred}
                onCheckedChange={(checked) => setDecisionForm({...decisionForm, override_occurred: checked})}
              />
              <label htmlFor="override" className="text-sm text-amber-700">
                I am overriding the system's compliance guidance
              </label>
            </div>

            {decisionForm.override_occurred && (
              <div>
                <Label className="text-amber-700">Override Justification (Required)</Label>
                <Textarea 
                  placeholder="Explain why you are overriding the compliance guidance..."
                  value={decisionForm.override_reason}
                  onChange={(e) => setDecisionForm({...decisionForm, override_reason: e.target.value})}
                  rows={3}
                  className="border-amber-300"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecisionModal(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-[#D4A84C] hover:bg-[#C49A3C] text-black"
              onClick={submitDecision}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Confirm Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdviceOSDashboard;
