import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Target, BarChart3 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const ScenarioModelling = lazy(() => import("@/pages/ScenarioModelling"));
const MonteCarloSimulation = lazy(() => import("@/pages/MonteCarloSimulation"));
const AdviserGoals = lazy(() => import("@/components/AdviserGoals"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const UnifiedGoalsPlanning = () => {
  const [tab, setTab] = useState("goals");

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" data-testid="unified-goals-planning">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white border mb-4 h-10">
              <TabsTrigger value="goals" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="tab-goals">
                <Target className="h-3.5 w-3.5" /> Goals & Scenarios
              </TabsTrigger>
              <TabsTrigger value="monte-carlo" className="gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white" data-testid="tab-monte-carlo">
                <BarChart3 className="h-3.5 w-3.5" /> Monte Carlo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="mt-0 space-y-6">
              <ErrorBoundary label="Household Goals"><Suspense fallback={<TabLoader />}><AdviserGoals embedded /></Suspense></ErrorBoundary>
              <ErrorBoundary label="Goals & Scenarios"><Suspense fallback={<TabLoader />}><ScenarioModelling embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="monte-carlo" className="mt-0">
              <ErrorBoundary label="Monte Carlo"><Suspense fallback={<TabLoader />}><MonteCarloSimulation embedded /></Suspense></ErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UnifiedGoalsPlanning;
