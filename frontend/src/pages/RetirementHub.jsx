// RetirementHub — combined Retirement Planner + Contribution Calculator
// using the new MoneySmart-style flows. Wrapped in PageShell so it shares
// the same airy aesthetic as the rest of the platform.
import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { PageShell, PillButton } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, Calculator, Loader2, GitCompare } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const RetirementPlannerMoneySmart = lazy(() => import("@/pages/RetirementPlannerMoneySmart"));
const ContributionCalculator = lazy(() => import("@/pages/ContributionCalculator"));
const ContributionPathCompare = lazy(() => import("@/components/ContributionPathCompare"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const tabClass = "gap-1.5 px-4 py-2 rounded-full transition-all border border-transparent data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300";

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const RetirementHub = ({ embedded = false, clientId: propClientId }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const [showCompare, setShowCompare] = useState(false);

  const superTotal = (client.assets || [])
    .filter((a) => a.type === "Super" || a.type === "SMSF")
    .reduce((s, a) => s + a.value, 0);
  const netWorth = (client.assets || []).reduce((s, a) => s + a.value, 0)
    - (client.liabilities || []).reduce((s, l) => s + l.value, 0);

  const superDefaults = {
    salary: client.profile?.incomeHousehold || 0,
    age: client.profile?.age || 50,
    superBalance: superTotal,
    unusedConcessionalFY: 0,
  };

  const content = (
    <div className="space-y-4" data-testid="retirement-hub">
      <Tabs defaultValue="plan">
        <TabsList className="bg-transparent border-0 h-auto w-full justify-start gap-1.5 px-0 p-0 mb-2">
          <TabsTrigger value="plan" className={tabClass} data-testid="rh-tab-plan">
            <Gauge className="h-3.5 w-3.5" /> Retirement Planner
          </TabsTrigger>
          <TabsTrigger value="super" className={tabClass} data-testid="rh-tab-super">
            <Calculator className="h-3.5 w-3.5" /> Contribution Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="pt-3">
          <ErrorBoundary label="Retirement Planner">
            <Suspense fallback={<TabLoader />}>
              <RetirementPlannerMoneySmart embedded clientId={clientId} />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="super" className="pt-3 space-y-6">
          <div className="flex justify-end">
            <PillButton
              variant={showCompare ? "primary" : "ghost"}
              onClick={() => setShowCompare((v) => !v)}
              data-testid="toggle-compare-paths"
            >
              <GitCompare className="h-3.5 w-3.5 inline -mt-0.5 mr-1.5" />
              {showCompare ? "Hide path comparison" : "Compare contribution paths"}
            </PillButton>
          </div>
          {showCompare && (
            <ErrorBoundary label="Compare contribution paths">
              <Suspense fallback={<TabLoader />}>
                <ContributionPathCompare defaults={superDefaults} />
              </Suspense>
            </ErrorBoundary>
          )}
          <ErrorBoundary label="Contribution Calculator">
            <Suspense fallback={<TabLoader />}>
              <ContributionCalculator embedded />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );

  return embedded ? content : (
    <Layout>
      <PageShell
        eyebrow="HOUSEHOLD · RETIREMENT"
        title="Retirement hub"
        accent="planner · contributions"
        subtitle={`Project your retirement income and find the contribution mix that closes the gap. Two MoneySmart-aligned calculators, one set of numbers — for ${client.profile?.name || "you"}.`}
        meta={`HOUSEHOLD · NET WORTH ${fmt(netWorth)} · SUPER ${fmt(superTotal)}`}
      >
        {content}
      </PageShell>
    </Layout>
  );
};

export default RetirementHub;
