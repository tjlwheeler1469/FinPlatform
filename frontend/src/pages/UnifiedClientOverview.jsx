import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, TrendingUp, Gauge, Calculator, Target, PiggyBank, Receipt, Building2, Landmark } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import FloatingActionRail from "@/components/platform/FloatingActionRail";

const PersonalDashboard = lazy(() => import("@/pages/PersonalDashboard"));
const UnifiedInvestments = lazy(() => import("@/pages/UnifiedInvestments"));
const RetirementWorkshop = lazy(() => import("@/pages/RetirementWorkshop"));
const SimpleGoals = lazy(() => import("@/components/SimpleGoals"));
const HouseholdBudget = lazy(() => import("@/pages/HouseholdBudget"));
const UnifiedTaxCentre = lazy(() => import("@/pages/UnifiedTaxCentre"));
const AdviserClientDashboard = lazy(() => import("@/components/AdviserClientDashboard"));
const ClientInvoicing = lazy(() => import("@/components/ClientInvoicing"));
const SuperOptimiser = lazy(() => import("@/components/SuperOptimiser"));
const SMSFOptimizer = lazy(() => import("@/pages/SMSFOptimizer"));

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
      <FloatingActionRail />
      <div className="min-h-screen bg-gray-50" data-testid="unified-client-overview">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 xl:pr-[350px] pt-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white border mb-4 h-10 w-full justify-start gap-0.5 px-1 overflow-x-auto">
              <TabsTrigger value="overview" className={tabTriggerClass} data-testid="client-tab-overview">
                <LayoutDashboard className="h-3.5 w-3.5" /> Overview
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
              <TabsTrigger value="super" className={tabTriggerClass} data-testid="client-tab-super">
                <Landmark className="h-3.5 w-3.5" /> Super &amp; Pension
              </TabsTrigger>
              <TabsTrigger value="smsf" className={tabTriggerClass} data-testid="client-tab-smsf">
                <Building2 className="h-3.5 w-3.5" /> SMSF
              </TabsTrigger>
              <TabsTrigger value="invoicing" className={tabTriggerClass} data-testid="client-tab-invoicing">
                <Receipt className="h-3.5 w-3.5" /> Invoicing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <ErrorBoundary label="Adviser Client Dashboard">
                <Suspense fallback={<TabLoader />}>
                  <AdviserClientDashboard clientId={getClientId()} />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="retirement" className="mt-0">
              <ErrorBoundary label="Retirement">
                <Suspense fallback={<TabLoader />}>
                  <RetirementWorkshop clientId={getClientId()} embedded />
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
                  <SimpleGoals clientId={getClientId()} embedded />
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
            <TabsContent value="super" className="mt-0">
              <ErrorBoundary label="Super & Pension">
                <Suspense fallback={<TabLoader />}>
                  <div className="p-4"><SuperOptimiser clientId={getClientId()} embedded /></div>
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="smsf" className="mt-0">
              <ErrorBoundary label="SMSF">
                <Suspense fallback={<TabLoader />}>
                  <SMSFOptimizer embedded />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>
            <TabsContent value="invoicing" className="mt-0">
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
