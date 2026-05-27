import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, Building2, Landmark, Bitcoin, Briefcase, Lock, DollarSign, Shield, PiggyBank, Eye } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import InvestmentsOverview from "@/components/InvestmentsOverview";

const SharePortfolio = lazy(() => import("@/pages/SharePortfolio"));
const BondsTrading = lazy(() => import("@/pages/BondsTrading"));
const PropertyPortfolio = lazy(() => import("@/pages/PropertyPortfolio"));
const CryptoPortfolio = lazy(() => import("@/pages/CryptoPortfolio"));
const SuperannuationGuarantee = lazy(() => import("@/pages/SuperannuationGuarantee"));
const SMSFOptimizer = lazy(() => import("@/pages/SMSFOptimizer"));
const ManagedFunds = lazy(() => import("@/pages/ManagedFunds"));
const UnlistedInvestments = lazy(() => import("@/pages/UnlistedInvestments"));
const CashDeposits = lazy(() => import("@/pages/CashDeposits"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const TABS = [
  { value: "overview", label: "Overview", icon: Eye },
  { value: "bonds", label: "Bonds", icon: Landmark },
  { value: "cash", label: "Cash & TDs", icon: DollarSign },
  { value: "crypto", label: "Crypto", icon: Bitcoin },
  { value: "managed", label: "Managed Funds", icon: Briefcase },
  { value: "property", label: "Property", icon: Building2 },
  { value: "shares", label: "Shares & ETFs", icon: BarChart3 },
  { value: "smsf", label: "SMSF", icon: PiggyBank },
  { value: "super", label: "Super & Pension", icon: Shield },
  { value: "unlisted", label: "Unlisted", icon: Lock },
];

const UnifiedInvestments = ({ embedded = false }) => {
  const [tab, setTab] = useState("overview");

  const content = (
      <div data-testid="unified-investments">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-transparent border-0 mb-6 h-auto w-full justify-start gap-1.5 px-0 p-0 overflow-x-auto">
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="gap-1.5 text-xs px-4 py-2 rounded-full border border-transparent whitespace-nowrap data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300"
                data-testid={`tab-${value}`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <ErrorBoundary label="Investments Overview"><InvestmentsOverview /></ErrorBoundary>
          </TabsContent>
          <TabsContent value="shares" className="mt-0">
            <ErrorBoundary label="Shares & ETFs"><Suspense fallback={<TabLoader />}><SharePortfolio embedded /></Suspense></ErrorBoundary>
          </TabsContent>
          <TabsContent value="bonds" className="mt-0">
            <ErrorBoundary label="Bonds"><Suspense fallback={<TabLoader />}><BondsTrading embedded /></Suspense></ErrorBoundary>
          </TabsContent>
          <TabsContent value="property" className="mt-0">
            <ErrorBoundary label="Property"><Suspense fallback={<TabLoader />}><PropertyPortfolio embedded /></Suspense></ErrorBoundary>
          </TabsContent>
          <TabsContent value="crypto" className="mt-0">
            <ErrorBoundary label="Crypto"><Suspense fallback={<TabLoader />}><CryptoPortfolio embedded /></Suspense></ErrorBoundary>
          </TabsContent>
          <TabsContent value="cash" className="mt-0">
            <ErrorBoundary label="Cash & TDs"><Suspense fallback={<TabLoader />}><CashDeposits embedded /></Suspense></ErrorBoundary>
          </TabsContent>
          <TabsContent value="super" className="mt-0">
            <ErrorBoundary label="Super & Pension"><Suspense fallback={<TabLoader />}><SuperannuationGuarantee embedded /></Suspense></ErrorBoundary>
          </TabsContent>
          <TabsContent value="smsf" className="mt-0">
            <ErrorBoundary label="SMSF"><Suspense fallback={<TabLoader />}><SMSFOptimizer embedded /></Suspense></ErrorBoundary>
          </TabsContent>
          <TabsContent value="managed" className="mt-0">
            <ErrorBoundary label="Managed Funds"><Suspense fallback={<TabLoader />}><ManagedFunds embedded /></Suspense></ErrorBoundary>
          </TabsContent>
          <TabsContent value="unlisted" className="mt-0">
            <ErrorBoundary label="Unlisted"><Suspense fallback={<TabLoader />}><UnlistedInvestments embedded /></Suspense></ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
  );

  const shell = (
    <PageShell
      eyebrow="WEALTH · INVESTMENTS"
      title="Investments"
      accent="shares · bonds · property · super"
      subtitle="Every asset class in one cockpit. Drift, performance, and recommended actions — all reading from the unified portfolio store."
      meta={`${TABS.length - 1} ASSET CLASSES TRACKED`}
    >
      {content}
    </PageShell>
  );

  return embedded ? content : <Layout>{shell}</Layout>;
};

export default UnifiedInvestments;
