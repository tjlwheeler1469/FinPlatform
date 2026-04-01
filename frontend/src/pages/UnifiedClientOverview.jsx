import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, Wallet, TrendingUp, Activity, Target } from "lucide-react";

const PersonalDashboard = lazy(() => import("@/pages/PersonalDashboard"));
const FamilyWealthDashboard = lazy(() => import("@/pages/FamilyWealthDashboard"));
const NetWorthTrend = lazy(() => import("@/pages/NetWorthTrend"));
const DecisionEngine = lazy(() => import("@/pages/DecisionEngine"));
const ScenarioModelling = lazy(() => import("@/pages/ScenarioModelling"));

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
              <TabsTrigger value="net-worth" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="tab-net-worth">
                <Wallet className="h-3.5 w-3.5" /> Net Worth
              </TabsTrigger>
              <TabsTrigger value="wealth-trends" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="tab-wealth-trends">
                <TrendingUp className="h-3.5 w-3.5" /> Wealth Trends
              </TabsTrigger>
              <TabsTrigger value="health" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="tab-health">
                <Activity className="h-3.5 w-3.5" /> Health Score
              </TabsTrigger>
              <TabsTrigger value="goals" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="tab-goals">
                <Target className="h-3.5 w-3.5" /> Goals & Scenarios
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0">
              <Suspense fallback={<TabLoader />}><PersonalDashboard embedded /></Suspense>
            </TabsContent>
            <TabsContent value="net-worth" className="mt-0">
              <Suspense fallback={<TabLoader />}><FamilyWealthDashboard embedded /></Suspense>
            </TabsContent>
            <TabsContent value="wealth-trends" className="mt-0">
              <Suspense fallback={<TabLoader />}><NetWorthTrend embedded /></Suspense>
            </TabsContent>
            <TabsContent value="health" className="mt-0">
              <Suspense fallback={<TabLoader />}><DecisionEngine embedded /></Suspense>
            </TabsContent>
            <TabsContent value="goals" className="mt-0">
              <Suspense fallback={<TabLoader />}><ScenarioModelling embedded /></Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UnifiedClientOverview;
