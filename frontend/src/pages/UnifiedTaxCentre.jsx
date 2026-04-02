import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Loader2, Calculator, TrendingUp, Calendar, Scissors, DollarSign, Building2, Receipt, Briefcase } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { cn } from "@/lib/utils";

const TaxAnalysisSync = lazy(() => import("@/pages/TaxAnalysisSync"));
const CGT = lazy(() => import("@/pages/CGT"));
const TaxLossHarvesting = lazy(() => import("@/pages/TaxLossHarvesting"));
const TaxCalendar = lazy(() => import("@/pages/TaxCalendar"));
const BASCalculator = lazy(() => import("@/pages/BASCalculator"));
const IncomeSplitting = lazy(() => import("@/pages/IncomeSplitting"));
const TrustDistributionAnalysis = lazy(() => import("@/pages/TrustDistributionAnalysis"));
const Division7ACalculator = lazy(() => import("@/pages/Division7ACalculator"));

const TAX_TABS = [
  { value: "analysis", label: "Tax Analysis", icon: Calculator },
  { value: "bas", label: "BAS Calculator", icon: Receipt },
  { value: "cgt", label: "Capital Gains", icon: TrendingUp },
  { value: "div7a", label: "Division 7A", icon: Briefcase },
  { value: "harvesting", label: "Tax Loss Harvesting", icon: Scissors },
  { value: "income-split", label: "Income Splitting", icon: DollarSign },
  { value: "calendar", label: "Tax Calendar", icon: Calendar },
  { value: "trusts", label: "Trust Distributions", icon: Building2 },
];

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const TAB_COMPONENTS = {
  analysis: TaxAnalysisSync,
  cgt: CGT,
  harvesting: TaxLossHarvesting,
  calendar: TaxCalendar,
  bas: BASCalculator,
  "income-split": IncomeSplitting,
  trusts: TrustDistributionAnalysis,
  div7a: Division7ACalculator,
};

const UnifiedTaxCentre = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState("analysis");

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  const content = (
    <div className="space-y-4" data-testid="unified-tax-centre">
      {/* Custom tab bar — avoids nested Radix Tabs context conflicts */}
      <div className="inline-flex h-10 items-center justify-start rounded-lg bg-white border p-1 w-full overflow-x-auto gap-0">
        {TAX_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium gap-1 transition-all",
                isActive
                  ? "bg-[#0f1d35] text-white shadow"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              data-testid={`tax-tab-${tab.value}`}
            >
              <Icon className="h-3.5 w-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <ErrorBoundary label={TAX_TABS.find(t => t.value === activeTab)?.label || "Tax"}>
          <Suspense fallback={<TabLoader />}>
            {ActiveComponent && <ActiveComponent embedded />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );

  return embedded ? content : <Layout>{content}</Layout>;
};

export default UnifiedTaxCentre;
