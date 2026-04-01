import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, BarChart3, Building2, LineChart } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const StockResearch = lazy(() => import("@/pages/StockResearch"));
const BrokerResearch = lazy(() => import("@/pages/BrokerResearch"));
const InvestmentComparison = lazy(() => import("@/pages/InvestmentComparison"));
const PropertyComparison = lazy(() => import("@/pages/PropertyComparison"));

const TABS = [
  { value: "stocks", label: "Stock Research", icon: LineChart },
  { value: "broker", label: "Broker Research", icon: Search },
  { value: "compare", label: "Investment Comparison", icon: BarChart3 },
  { value: "property", label: "Property Comparison", icon: Building2 },
];

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const UnifiedResearchCentre = () => {
  const [activeTab, setActiveTab] = useState("stocks");

  return (
    <Layout>
      <div className="space-y-4" data-testid="unified-research-centre">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border h-10 w-full justify-start gap-0 overflow-x-auto px-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-sm gap-1.5 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white"
                  data-testid={`tab-${tab.value}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="stocks" className="mt-0">
              <ErrorBoundary label="Stock Research"><Suspense fallback={<TabLoader />}><StockResearch embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="broker" className="mt-0">
              <ErrorBoundary label="Broker Research"><Suspense fallback={<TabLoader />}><BrokerResearch embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="compare" className="mt-0">
              <ErrorBoundary label="Investment Comparison"><Suspense fallback={<TabLoader />}><InvestmentComparison embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="property" className="mt-0">
              <ErrorBoundary label="Property Comparison"><Suspense fallback={<TabLoader />}><PropertyComparison embedded /></Suspense></ErrorBoundary>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UnifiedResearchCentre;
