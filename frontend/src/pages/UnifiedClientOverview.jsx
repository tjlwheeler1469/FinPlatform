import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, TrendingUp, Wallet } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const PersonalDashboard = lazy(() => import("@/pages/PersonalDashboard"));
const UnifiedInvestments = lazy(() => import("@/pages/UnifiedInvestments"));

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
              <TabsTrigger value="overview" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="tab-overview">
                <LayoutDashboard className="h-3.5 w-3.5" /> Overview
              </TabsTrigger>
              <TabsTrigger value="investments" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="tab-investments">
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
