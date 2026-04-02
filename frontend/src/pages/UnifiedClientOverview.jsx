import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, TrendingUp, Gauge, Calculator, Zap, FileText } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const PersonalDashboard = lazy(() => import("@/pages/PersonalDashboard"));
const UnifiedInvestments = lazy(() => import("@/pages/UnifiedInvestments"));
const RetirementConfidence = lazy(() => import("@/pages/RetirementConfidence"));
const UnifiedTaxCentre = lazy(() => import("@/pages/UnifiedTaxCentre"));
const NextBestActions = lazy(() => import("@/pages/NextBestActions"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const UnifiedClientOverview = () => {
  const [tab, setTab] = useState("overview");

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" data-testid="unified-client-overview">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white border mb-4 h-10 w-full justify-start gap-0 px-1 overflow-x-auto">
              <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="client-tab-overview">
                <LayoutDashboard className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="client-tab-actions">
                <Zap className="h-3.5 w-3.5" /> Actions
              </TabsTrigger>
              <TabsTrigger value="retirement" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="client-tab-retirement">
                <Gauge className="h-3.5 w-3.5" /> Retirement
              </TabsTrigger>
              <TabsTrigger value="tax" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="client-tab-tax">
                <Calculator className="h-3.5 w-3.5" /> Tax Centre
              </TabsTrigger>
              <TabsTrigger value="investments" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="client-tab-investments">
                <TrendingUp className="h-3.5 w-3.5" /> Investments
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
            <TabsContent value="tax" className="mt-0">
              <ErrorBoundary label="Tax Centre">
                <Suspense fallback={<TabLoader />}>
                  <UnifiedTaxCentre embedded />
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
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UnifiedClientOverview;
