import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useLanguage } from "@/components/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, AlertTriangle, Calculator, History,
  ClipboardCheck, Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  OverviewTab,
  ScenariosTab,
  ComplianceTab,
  AuditTrailTab,
  ReportsTab,
  ScenarioGeneratorDialog,
  DecisionDialog,
} from "@/components/advice_os";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const AdviceOSDashboard = ({ embedded = false }) => {
  const { t } = useLanguage();
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

      if (summaryRes.ok) setDashboardData(await summaryRes.json());
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
    } catch {
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
        setGeneratedScenarios(await res.json());
        toast.success("Scenarios generated successfully!");
        fetchDashboardData();
      } else {
        const error = await res.json();
        toast.error(error.detail || "Failed to generate scenarios");
      }
    } catch {
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
    } catch {
      toast.error("Failed to submit decision");
    }
  };

  const initializeDemo = async () => {
    try {
      await fetch(`${API_URL}/api/compliance/init-default`, { method: "POST" });
      await fetch(`${API_URL}/api/reports/generate-demo-data`, { method: "POST" });
      toast.success("Demo data initialized!");
      fetchDashboardData();
    } catch {
      toast.error("Failed to initialize demo data");
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
    } catch {
      toast.error("Failed to download report");
    }
  };

  if (loading) {
    const loadingContent = (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#D4A84C]" />
            <p className="text-muted-foreground">Loading AdviceOS Dashboard...</p>
          </div>
        </div>
    );
    return embedded ? loadingContent : <Layout title="AdviceOS" subtitle="Compliance-First Decision Support">{loadingContent}</Layout>;
  }

  const summary = dashboardData?.summary || {
    compliance_score: 100,
    scenarios: { total: 0, last_30_days: 0 },
    compliance_checks: { total: 0, passed: 0, warnings: 0, blocked: 0 },
    breaches: { open: 0, resolved: 0 },
    decisions: { total: 0, approved: 0, overrides: 0 }
  };

  const content = (
    <>
      <div className="space-y-6" data-testid="adviceos-dashboard">
        {/* Compliance Disclaimer Banner */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">{t('adviceos.disclaimer')}</p>
                <p className="text-xs text-blue-700 mt-1">
                  {t('adviceos.disclaimerDetail')}
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
                <span className="text-sm text-emerald-700">{t('adviceos.complianceScore')}</span>
              </div>
              <p className="text-3xl font-bold text-emerald-700 mt-2" data-testid="compliance-score">{summary.compliance_score}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#D4A84C]" />
                <span className="text-sm text-muted-foreground">{t('adviceos.scenarios')}</span>
              </div>
              <p className="text-3xl font-bold mt-2">{summary.scenarios.total}</p>
              <p className="text-xs text-muted-foreground">{summary.scenarios.last_30_days} last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">{t('adviceos.decisions')}</span>
              </div>
              <p className="text-3xl font-bold mt-2">{summary.decisions.total}</p>
              <p className="text-xs text-muted-foreground">{summary.decisions.overrides} overrides</p>
            </CardContent>
          </Card>
          <Card className={summary.breaches.open > 0 ? "border-amber-300 bg-amber-50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${summary.breaches.open > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
                <span className="text-sm text-muted-foreground">{t('adviceos.openBreaches')}</span>
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
                <span className="text-sm text-muted-foreground">{t('adviceos.auditEntries')}</span>
              </div>
              <p className="text-3xl font-bold mt-2">{summary.audit_logs || auditLogs.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="overview">{t('adviceos.overview')}</TabsTrigger>
            <TabsTrigger value="scenarios">{t('adviceos.scenarios')}</TabsTrigger>
            <TabsTrigger value="compliance">{t('adviceos.compliance')}</TabsTrigger>
            <TabsTrigger value="audit">{t('adviceos.auditTrail')}</TabsTrigger>
            <TabsTrigger value="reports">{t('adviceos.reports')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              summary={summary}
              auditLogs={auditLogs}
              onOpenScenarioGenerator={() => setShowScenarioGenerator(true)}
              onInitializeDemo={initializeDemo}
            />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenariosTab
              scenarios={scenarios}
              onOpenScenarioGenerator={() => setShowScenarioGenerator(true)}
            />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceTab summary={summary} breaches={breaches} />
          </TabsContent>

          <TabsContent value="audit">
            <AuditTrailTab auditLogs={auditLogs} onDownloadReport={downloadReport} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab
              reportTypes={dashboardData?.report_types}
              onDownloadReport={downloadReport}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ScenarioGeneratorDialog
        open={showScenarioGenerator}
        onOpenChange={setShowScenarioGenerator}
        scenarioInputs={scenarioInputs}
        onInputChange={(updates) => setScenarioInputs(prev => ({ ...prev, ...updates }))}
        generatedScenarios={generatedScenarios}
        generatingScenarios={generatingScenarios}
        onGenerate={generateScenarios}
        onModifyInputs={() => setGeneratedScenarios(null)}
        onRecordDecision={(scenarioSet) => {
          setSelectedScenarioSet(scenarioSet);
          setShowDecisionModal(true);
        }}
      />

      <DecisionDialog
        open={showDecisionModal}
        onOpenChange={setShowDecisionModal}
        selectedScenarioSet={selectedScenarioSet}
        decisionForm={decisionForm}
        onFormChange={(updates) => setDecisionForm(prev => ({ ...prev, ...updates }))}
        onSubmit={submitDecision}
      />
    </>
  );

  return embedded ? content : <Layout title={t('adviceos.title')} subtitle={t('adviceos.subtitle')}>{content}</Layout>;
};

export default AdviceOSDashboard;
