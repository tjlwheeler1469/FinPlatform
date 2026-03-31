import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, Building2, Landmark, Bitcoin, PiggyBank, Briefcase, Lock } from "lucide-react";

const SharePortfolio = lazy(() => import("@/pages/SharePortfolio"));
const BondsTrading = lazy(() => import("@/pages/BondsTrading"));
const PropertyPortfolio = lazy(() => import("@/pages/PropertyPortfolio"));
const CryptoPortfolio = lazy(() => import("@/pages/CryptoPortfolio"));
const SuperannuationGuarantee = lazy(() => import("@/pages/SuperannuationGuarantee"));
const ManagedFunds = lazy(() => import("@/pages/ManagedFunds"));
const UnlistedInvestments = lazy(() => import("@/pages/UnlistedInvestments"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const TABS = [
  { value: "shares", label: "Shares & ETFs", icon: BarChart3 },
  { value: "bonds", label: "Bonds", icon: Landmark },
  { value: "property", label: "Property", icon: Building2 },
  { value: "crypto", label: "Crypto", icon: Bitcoin },
  { value: "super", label: "Super", icon: PiggyBank },
  { value: "managed", label: "Managed Funds", icon: Briefcase },
  { value: "unlisted", label: "Unlisted", icon: Lock },
];

const UnifiedInvestments = () => {
  const [tab, setTab] = useState("shares");

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" data-testid="unified-investments">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-white border mb-4 h-10 flex-wrap">
              {TABS.map(({ value, label, icon: Icon }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-[#D4A84C]/10 data-[state=active]:text-[#1a2744]"
                  data-testid={`tab-${value}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="shares" className="mt-0">
              <Suspense fallback={<TabLoader />}><SharePortfolio embedded /></Suspense>
            </TabsContent>
            <TabsContent value="bonds" className="mt-0">
              <Suspense fallback={<TabLoader />}><BondsTrading embedded /></Suspense>
            </TabsContent>
            <TabsContent value="property" className="mt-0">
              <Suspense fallback={<TabLoader />}><PropertyPortfolio embedded /></Suspense>
            </TabsContent>
            <TabsContent value="crypto" className="mt-0">
              <Suspense fallback={<TabLoader />}><CryptoPortfolio embedded /></Suspense>
            </TabsContent>
            <TabsContent value="super" className="mt-0">
              <Suspense fallback={<TabLoader />}><SuperannuationGuarantee embedded /></Suspense>
            </TabsContent>
            <TabsContent value="managed" className="mt-0">
              <Suspense fallback={<TabLoader />}><ManagedFunds embedded /></Suspense>
            </TabsContent>
            <TabsContent value="unlisted" className="mt-0">
              <Suspense fallback={<TabLoader />}><UnlistedInvestments embedded /></Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default UnifiedInvestments;
