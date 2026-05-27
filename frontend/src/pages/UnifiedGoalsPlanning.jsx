import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
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

const tabClass = "gap-1.5 px-4 py-2 rounded-full transition-all border border-transparent data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300";

const UnifiedGoalsPlanning = () => {
  const [tab, setTab] = useState("goals");

  return (
    <Layout>
      <PageShell
        eyebrow="ADVISER · SCENARIOS"
        title="Goals &amp; scenarios"
        accent="what-if · stress · plan"
        subtitle="Set household goals, stress-test retirement, and run Monte Carlo simulations — every scenario syncs back to the unified household record."
        meta="MONTE CARLO · 500-RUN BASELINE"
      >
        <div data-testid="unified-goals-planning">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-transparent border-0 mb-6 h-auto w-full justify-start gap-1.5 px-0 p-0">
              <TabsTrigger value="goals" className={tabClass} data-testid="tab-goals">
                <Target className="h-3.5 w-3.5" /> Goals &amp; Scenarios
              </TabsTrigger>
              <TabsTrigger value="monte-carlo" className={tabClass} data-testid="tab-monte-carlo">
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
      </PageShell>
    </Layout>
  );
};

export default UnifiedGoalsPlanning;
