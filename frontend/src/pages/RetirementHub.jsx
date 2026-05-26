// RetirementHub — combined Retirement Planner · Contribution Calculator
// (Super & Pension + SMSF) in one page.
// Single source of truth: pulls from CLIENT_DATA so sub-tabs share consistent
// salary, super balance, and assets — no duplicate inputs across tabs.
import { useMemo, useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Gauge, Calculator, Loader2, Landmark, GitCompare } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const RetirementWorkshop = lazy(() => import("@/pages/RetirementWorkshop"));
const SuperOptimiser = lazy(() => import("@/components/SuperOptimiser"));
const SMSFOptimizer = lazy(() => import("@/pages/SMSFOptimizer"));
const ContributionPathCompare = lazy(() => import("@/components/ContributionPathCompare"));

const fmt = (v) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const tabClass = "gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-md transition-colors data-[state=active]:bg-[#1a2744]/10 data-[state=active]:text-[#1a2744] data-[state=active]:font-semibold data-[state=active]:shadow-[inset_0_-2px_0_#D4A84C]";

const RetirementHub = ({ embedded = false, clientId: propClientId }) => {
  const clientId = propClientId || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const [showCompare, setShowCompare] = useState(false);

  // Portfolio-integrated defaults derived from CLIENT_DATA (single source).
  // These flow into SuperOptimiser so caps/contributions reflect client context.
  const superDefaults = useMemo(() => {
    const superAssets = (client.assets || []).filter((a) => a.type === "Super");
    const superBalance = superAssets.reduce((s, a) => s + a.value, 0);
    return {
      salary: client.profile?.incomeHousehold || 0,
      age: client.profile?.age || 50,
      superBalance: superBalance || 0,
      unusedConcessionalFY: 0,
    };
  }, [client]);

  const portfolioTotals = useMemo(() => {
    const assets = (client.assets || []).reduce((s, a) => s + a.value, 0);
    const liab = (client.liabilities || []).reduce((s, l) => s + l.value, 0);
    const superTotal = (client.assets || []).filter((a) => a.type === "Super" || a.type === "SMSF").reduce((s, a) => s + a.value, 0);
    return { netWorth: assets - liab, superTotal, retirementGoal: (client.retirement?.retirement_spending || 0) * 25 };
  }, [client]);

  const content = (
    <div className="space-y-4" data-testid="retirement-hub">
      {/* Context strip — shared portfolio numbers so sub-tabs align */}
      <Card className="bg-gradient-to-r from-[#1a2744]/5 to-[#D4A84C]/5 border-[#D4A84C]/30">
        <CardContent className="p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-[#D4A84C]" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Household</p>
              <p className="text-sm font-bold text-[#1a2744]">{client.profile?.name || "—"}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net Worth</p>
            <p className="text-lg font-bold text-[#1a2744]" data-testid="rh-networth">{fmt(portfolioTotals.netWorth)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Super / SMSF</p>
            <p className="text-lg font-bold text-[#1a2744]" data-testid="rh-super">{fmt(portfolioTotals.superTotal)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Retirement Target (25×)</p>
            <p className="text-lg font-bold text-[#D4A84C]" data-testid="rh-target">{fmt(portfolioTotals.retirementGoal)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Retire Age</p>
            <p className="text-lg font-bold text-[#1a2744]">{client.retirement?.retirement_age || 67}</p>
          </div>
          <div className="ml-auto text-[10px] text-muted-foreground italic max-w-xs text-right">
            All three tools below use the same household data — edits in one flow into the others.
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="plan">
        <TabsList className="bg-white border h-10 w-full justify-start gap-1 px-1 overflow-x-auto">
          <TabsTrigger value="plan" className={tabClass} data-testid="rh-tab-plan"><Gauge className="h-3.5 w-3.5" /> Retirement Planner</TabsTrigger>
          <TabsTrigger value="super" className={tabClass} data-testid="rh-tab-super"><Calculator className="h-3.5 w-3.5" /> Contribution Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="pt-3">
          <ErrorBoundary label="Retirement Planner">
            <Suspense fallback={<TabLoader />}>
              <RetirementWorkshop clientId={clientId} embedded />
            </Suspense>
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="super" className="pt-3 space-y-6">
          {/* Compare contribution paths toggle — APRA vs SMSF side-by-side. */}
          <div className="flex justify-end">
            <Button
              variant={showCompare ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCompare((v) => !v)}
              className={showCompare ? "bg-[#1a2744] text-white" : ""}
              data-testid="toggle-compare-paths"
            >
              <GitCompare className="h-3.5 w-3.5 mr-1.5" />
              {showCompare ? "Hide path comparison" : "Compare contribution paths"}
            </Button>
          </div>
          {showCompare && (
            <ErrorBoundary label="Compare contribution paths">
              <Suspense fallback={<TabLoader />}>
                <ContributionPathCompare defaults={superDefaults} />
              </Suspense>
            </ErrorBoundary>
          )}
          {/* Concessional / non-concessional contribution scenarios */}
          <ErrorBoundary label="Super & Pension contributions">
            <Suspense fallback={<TabLoader />}>
              <SuperOptimiser clientId={clientId} embedded defaults={superDefaults} />
            </Suspense>
          </ErrorBoundary>
          {/* SMSF-specific contribution optimisation (merged in from the
              old standalone SMSF tab — see iter 211 change request). */}
          <div className="pt-2 border-t border-dashed border-[#D4A84C]/40">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="h-4 w-4 text-[#D4A84C]" />
              <h3 className="text-sm font-semibold text-[#1a2744]">SMSF contribution optimiser</h3>
              <span className="text-[10px] text-muted-foreground italic">— spouse / personal / Div 293 modelling for self-managed funds</span>
            </div>
            <ErrorBoundary label="SMSF contribution optimiser">
              <Suspense fallback={<TabLoader />}>
                <SMSFOptimizer embedded clientId={clientId} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return embedded ? content : <Layout><div className="p-6">{content}</div></Layout>;
};

export default RetirementHub;
