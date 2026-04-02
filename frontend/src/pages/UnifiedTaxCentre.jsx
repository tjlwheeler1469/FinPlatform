import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calculator, TrendingUp, Calendar, Scissors, DollarSign, Building2, Receipt, Briefcase } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const TaxAnalysisSync = lazy(() => import("@/pages/TaxAnalysisSync"));
const CGT = lazy(() => import("@/pages/CGT"));
const TaxLossHarvesting = lazy(() => import("@/pages/TaxLossHarvesting"));
const TaxCalendar = lazy(() => import("@/pages/TaxCalendar"));
const BASCalculator = lazy(() => import("@/pages/BASCalculator"));
const IncomeSplitting = lazy(() => import("@/pages/IncomeSplitting"));
const TrustDistributionAnalysis = lazy(() => import("@/pages/TrustDistributionAnalysis"));
const Division7ACalculator = lazy(() => import("@/pages/Division7ACalculator"));

const TABS = [
  { value: "analysis", label: "Tax Analysis", icon: Calculator },
  { value: "cgt", label: "Capital Gains", icon: TrendingUp },
  { value: "harvesting", label: "Tax Loss Harvesting", icon: Scissors },
  { value: "calendar", label: "Tax Calendar", icon: Calendar },
  { value: "bas", label: "BAS Calculator", icon: Receipt },
  { value: "income-split", label: "Income Splitting", icon: DollarSign },
  { value: "trusts", label: "Trust Distributions", icon: Building2 },
  { value: "div7a", label: "Division 7A", icon: Briefcase },
];

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const UnifiedTaxCentre = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState("analysis");

  const content = (
      <div className="space-y-4" data-testid="unified-tax-centre">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border h-10 w-full justify-start gap-0 overflow-x-auto px-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs gap-1 data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white whitespace-nowrap"
                  data-testid={`tab-${tab.value}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="analysis" className="mt-0">
              <ErrorBoundary label="Tax Analysis"><Suspense fallback={<TabLoader />}><TaxAnalysisSync embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="cgt" className="mt-0">
              <ErrorBoundary label="Capital Gains"><Suspense fallback={<TabLoader />}><CGT embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="harvesting" className="mt-0">
              <ErrorBoundary label="Tax Loss Harvesting"><Suspense fallback={<TabLoader />}><TaxLossHarvesting embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="calendar" className="mt-0">
              <ErrorBoundary label="Tax Calendar"><Suspense fallback={<TabLoader />}><TaxCalendar embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="bas" className="mt-0">
              <ErrorBoundary label="BAS Calculator"><Suspense fallback={<TabLoader />}><BASCalculator embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="income-split" className="mt-0">
              <ErrorBoundary label="Income Splitting"><Suspense fallback={<TabLoader />}><IncomeSplitting embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="trusts" className="mt-0">
              <ErrorBoundary label="Trust Distributions"><Suspense fallback={<TabLoader />}><TrustDistributionAnalysis embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="div7a" className="mt-0">
              <ErrorBoundary label="Division 7A"><Suspense fallback={<TabLoader />}><Division7ACalculator embedded /></Suspense></ErrorBoundary>
            </TabsContent>
          </div>
        </Tabs>
      </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default UnifiedTaxCentre;
