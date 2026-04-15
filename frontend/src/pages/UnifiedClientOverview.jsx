import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, TrendingUp, Gauge, Calculator, Zap, UserCircle, Target, PiggyBank } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const PersonalDashboard = lazy(() => import("@/pages/PersonalDashboard"));
const UnifiedInvestments = lazy(() => import("@/pages/UnifiedInvestments"));
const RetirementConfidence = lazy(() => import("@/pages/RetirementConfidence"));
const UnifiedTaxCentre = lazy(() => import("@/pages/UnifiedTaxCentre"));
const NextBestActions = lazy(() => import("@/pages/NextBestActions"));
const ScenarioModelling = lazy(() => import("@/pages/ScenarioModelling"));
const ScenarioEngine = lazy(() => import("@/components/ScenarioEngine"));
const HouseholdBudget = lazy(() => import("@/pages/HouseholdBudget"));
const ClientProfileTab = lazy(() => import("@/components/ClientProfileTab"));
const ClientInvoicing = lazy(() => import("@/components/ClientInvoicing"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const tabTriggerClass = "gap-1.5 text-xs sm:text-sm px-2.5 py-1.5 rounded-md transition-colors data-[state=active]:bg-[#1a2744]/10 data-[state=active]:text-[#1a2744] data-[state=active]:font-semibold data-[state=active]:shadow-[inset_0_-2px_0_#D4A84C]";

const UnifiedClientOverview = () => {
  const [tab, setTab] = useState("overview");

  const getClientId = () => {
    try {
      const saved = localStorage.getItem("selected_client");
      if (saved) {
        const client = JSON.parse(saved);
        return client?.id || client?.client_id || "thompson_family";
      }
    } catch { /* ignore */ }
    return "thompson_family";
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" data-testid="unified-client-overview">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white border mb-4 h-10 w-full justify-start gap-0.5 px-1 overflow-x-auto">
              <TabsTrigger value="overview" className={tabTriggerClass} data-testid="client-tab-overview">
                <LayoutDashboard className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="actions" className={tabTriggerClass} data-testid="client-tab-actions">
                <Zap className="h-3.5 w-3.5" /> Actions
              </TabsTrigger>
              <TabsTrigger value="retirement" className={tabTriggerClass} data-testid="client-tab-retirement">
                <Gauge className="h-3.5 w-3.5" /> Retirement
              </TabsTrigger>
              <TabsTrigger value="investments" className={tabTriggerClass} data-testid="client-tab-investments">
                <TrendingUp className="h-3.5 w-3.5" /> Investments
              </TabsTrigger>
              <TabsTrigger value="budget" className={tabTriggerClass} data-testid="client-tab-budget">
                <PiggyBank className="h-3.5 w-3.5" /> Budget
              </TabsTrigger>
              <TabsTrigger value="goals" className={tabTriggerClass} data-testid="client-tab-goals">
                <Target className="h-3.5 w-3.5" /> Goals
              </TabsTrigger>
              <TabsTrigger value="tax" className={tabTriggerClass} data-testid="client-tab-tax">
                <Calculator className="h-3.5 w-3.5" /> Tax Centre
              </TabsTrigger>
              <TabsTrigger value="profile" className={tabTriggerClass} data-testid="client-tab-profile">
                <UserCircle className="h-3.5 w-3.5" /> Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <ErrorBoundary label="Overview">
                <Suspense fallback={<TabLoader />}>
                  <PersonalDashboard embedded />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="actions" className="mt-0">
              <ErrorBoundary label="Actions">
                <Suspense fallback={<TabLoader />}>
                  <NextBestActions embedded />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="retirement" className="mt-0">
              <ErrorBoundary label="Retirement">
                <Suspense fallback={<TabLoader />}>
                  <RetirementConfidence embedded />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="investments" className="mt-0">
              <ErrorBoundary label="Investments">
                <Suspense fallback={<TabLoader />}>
                  <UnifiedInvestments embedded />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="budget" className="mt-0">
              <ErrorBoundary label="Budget">
                <Suspense fallback={<TabLoader />}>
                  <HouseholdBudget embedded />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="goals" className="mt-0">
              <ErrorBoundary label="Goals">
                <Suspense fallback={<TabLoader />}>
                  <ScenarioEngine embedded />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="tax" className="mt-0">
              <ErrorBoundary label="Tax Centre">
                <Suspense fallback={<TabLoader />}>
                  <UnifiedTaxCentre embedded />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="profile" className="mt-0 space-y-6">
              <ErrorBoundary label="Profile">
                <Suspense fallback={<TabLoader />}>
                  <ClientProfileTab clientId={getClientId()} />
                </Suspense>
              </ErrorBoundary>
              <ErrorBoundary label="Invoicing">
                <Suspense fallback={<TabLoader />}>
                  <ClientInvoicing clientId={getClientId()} />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UnifiedClientOverview;
