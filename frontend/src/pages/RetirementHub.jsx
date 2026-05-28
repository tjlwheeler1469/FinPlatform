// RetirementHub — embeds the merged Retirement Planner only.
// The standalone Contribution Calculator was folded into Retirement Planner
// Step 4 (Other assets, savings & contribution strategy) and removed from
// the platform.
import { lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const RetirementPlannerMoneySmart = lazy(() => import("@/pages/RetirementPlannerMoneySmart"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const RetirementHub = ({ embedded = false, clientId: propClientId }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  const superTotal = (client.assets || [])
    .filter((a) => a.type === "Super" || a.type === "SMSF")
    .reduce((s, a) => s + a.value, 0);
  const netWorth = (client.assets || []).reduce((s, a) => s + a.value, 0)
    - (client.liabilities || []).reduce((s, l) => s + l.value, 0);

  const content = (
    <div className="space-y-4" data-testid="retirement-hub">
      <ErrorBoundary label="Retirement Planner">
        <Suspense fallback={<TabLoader />}>
          <RetirementPlannerMoneySmart embedded clientId={clientId} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );

  return embedded ? content : (
    <Layout>
      <PageShell
        eyebrow="HOUSEHOLD · RETIREMENT"
        title="Retirement hub"
        accent="planner · contributions · projections"
        subtitle={`Project retirement income and find the contribution mix that closes the gap. One MoneySmart-aligned flow for ${client.profile?.name || "you"}.`}
        meta={`HOUSEHOLD · NET WORTH ${fmt(netWorth)} · SUPER ${fmt(superTotal)}`}
      >
        {content}
      </PageShell>
    </Layout>
  );
};

export default RetirementHub;
