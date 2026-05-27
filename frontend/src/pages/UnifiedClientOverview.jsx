import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LayoutDashboard, TrendingUp, Gauge, Calculator, PiggyBank } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CLIENT_DATA, computeClientTotals } from "@/data/clientData";

const UnifiedInvestments = lazy(() => import("@/pages/UnifiedInvestments"));
const RetirementHub = lazy(() => import("@/pages/RetirementHub"));
const HouseholdBudget = lazy(() => import("@/pages/HouseholdBudget"));
const UnifiedTaxCentre = lazy(() => import("@/pages/UnifiedTaxCentre"));
const AdviserClientDashboard = lazy(() => import("@/components/AdviserClientDashboard"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const tabTriggerClass = "gap-1.5 text-xs sm:text-sm px-4 py-2 rounded-full transition-all border border-transparent data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300";

const fmtAum = (n) => {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
};

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

  const clientId = getClientId();
  const client = CLIENT_DATA[clientId];
  const totals = client ? computeClientTotals(clientId) : { netWorth: 0 };
  const riskProfile = client?.profile?.riskProfile || client?.risk_profile || "—";
  const serviceTier = client?.profile?.service_tier || client?.profile?.tier || "Comprehensive";

  return (
    <Layout>
      <PageShell
        eyebrow={`CLIENT · ${(client?.profile?.name || clientId).toUpperCase()}`}
        title={client?.profile?.name || "Client overview"}
        accent={`${riskProfile.toLowerCase()} · ${serviceTier.toLowerCase()}`}
        subtitle="Every dimension of this client in one cockpit — overview, retirement, investments, budget, tax — all reading from the single source-of-truth household record."
        meta={`AUM ${fmtAum(totals.netWorth)} · RETIRE @ ${client?.retirement?.retirement_age || 67} · ADVISER ${(client?.profile?.advisor || "—").toUpperCase()}`}
        metrics={[
          { label: "Net worth", value: fmtAum(totals.netWorth) },
          { label: "Risk", value: riskProfile },
          { label: "Tier", value: serviceTier },
          { label: "Retire at", value: String(client?.retirement?.retirement_age || 67) },
        ]}
      >
      <div data-testid="unified-client-overview">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-transparent border-0 mb-6 h-auto w-full justify-start gap-1.5 px-0 overflow-x-auto p-0">
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
            <TabsTrigger value="tax" className={tabTriggerClass} data-testid="client-tab-tax">
              <Calculator className="h-3.5 w-3.5" /> Tax
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ErrorBoundary label="Adviser Client Dashboard">
              <Suspense fallback={<TabLoader />}>
                <AdviserClientDashboard clientId={clientId} />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          <TabsContent value="retirement" className="mt-0">
            <ErrorBoundary label="Retirement">
              <Suspense fallback={<TabLoader />}>
                <RetirementHub clientId={clientId} embedded />
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
          <TabsContent value="tax" className="mt-0">
            <ErrorBoundary label="Tax Centre">
              <Suspense fallback={<TabLoader />}>
                <UnifiedTaxCentre embedded />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
      </PageShell>
    </Layout>
  );
};

export default UnifiedClientOverview;
