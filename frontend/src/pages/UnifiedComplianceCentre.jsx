import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, AlertTriangle, GitBranch } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const AdviceOSDashboard = lazy(() => import("@/pages/AdviceOSDashboard"));
const EnterpriseComplianceDashboard = lazy(() => import("@/pages/EnterpriseComplianceDashboard"));
const BreachRegister = lazy(() => import("@/pages/BreachRegister"));
const RiskControlMapping = lazy(() => import("@/pages/RiskControlMapping"));

const TABS = [
  { value: "adviceos", label: "AdviceOS", icon: Shield },
  { value: "dashboard", label: "Compliance Dashboard", icon: Shield },
  { value: "breaches", label: "Breach Register", icon: AlertTriangle },
  { value: "risk-controls", label: "Risk Controls", icon: GitBranch },
];

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const UnifiedComplianceCentre = () => {
  const [activeTab, setActiveTab] = useState("adviceos");

  return (
    <Layout>
      <div className="space-y-4" data-testid="unified-compliance-centre">
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
            <TabsContent value="adviceos" className="mt-0">
              <ErrorBoundary label="AdviceOS"><Suspense fallback={<TabLoader />}><AdviceOSDashboard embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="dashboard" className="mt-0">
              <ErrorBoundary label="Compliance Dashboard"><Suspense fallback={<TabLoader />}><EnterpriseComplianceDashboard embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="breaches" className="mt-0">
              <ErrorBoundary label="Breach Register"><Suspense fallback={<TabLoader />}><BreachRegister embedded /></Suspense></ErrorBoundary>
            </TabsContent>
            <TabsContent value="risk-controls" className="mt-0">
              <ErrorBoundary label="Risk Controls"><Suspense fallback={<TabLoader />}><RiskControlMapping embedded /></Suspense></ErrorBoundary>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default UnifiedComplianceCentre;
