import { useState, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

const PersonalDashboard = lazy(() => import("@/pages/PersonalDashboard"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-[#D4A84C]" />
  </div>
);

const UnifiedDashboard = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" data-testid="unified-dashboard">
        <ErrorBoundary label="Dashboard">
          <Suspense fallback={<TabLoader />}>
            <PersonalDashboard embedded />
          </Suspense>
        </ErrorBoundary>
      </div>
    </Layout>
  );
};

export default UnifiedDashboard;
