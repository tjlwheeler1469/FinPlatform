// Simplified Client Portal — composition-only wrapper.
// Heavy tab content lives under ./clientView/*.
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, TrendingUp, Gauge,
  PiggyBank, Calculator, Target,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId, computeClientTotals } from "@/data/clientData";
import SimpleGoals from "@/components/SimpleGoals";

import SnapshotTab from "./clientView/SnapshotTab";
import InvestmentsTab from "./clientView/InvestmentsTab";
import RetirementTab from "./clientView/RetirementTab";
import BudgetTab from "./clientView/BudgetTab";
import TaxTab from "./clientView/TaxTab";

const tabClass = "gap-1.5 text-xs sm:text-sm px-4 py-2 rounded-full transition-all border border-transparent flex-shrink-0 data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300";

const fmt = (n) => {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n.toLocaleString()}`;
};

const SimpleClientView = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const firstName = client.profile.first_name || client.profile.name.split(" & ")[0].split(" ")[0];
  const totals = computeClientTotals(clientId);
  const riskProfile = client.profile?.riskProfile || client.risk_profile || "—";

  return (
    <Layout>
      <PageShell
        eyebrow={`HELLO, ${firstName.toUpperCase()}`}
        title="Your wealth"
        accent="calm and at a glance"
        subtitle={`A simple, honest view of where you stand — managed by ${client.profile.advisor || "your adviser"}.`}
        meta="UPDATED JUST NOW · READ-ONLY VIEW"
        metrics={[
          { label: "Net worth", value: fmt(totals.netWorth) },
          { label: "Retire at", value: String(client.retirement?.retirement_age || 67) },
          { label: "Risk", value: riskProfile },
          { label: "Tier", value: client.profile?.service_tier || "Comprehensive" },
        ]}
      >
      <div data-testid="simple-client-view">
        <Tabs defaultValue="snapshot">
          <TabsList className="bg-transparent border-0 mb-6 h-auto w-full justify-start gap-1.5 px-0 overflow-x-auto p-0">
            <TabsTrigger value="snapshot" className={tabClass} data-testid="client-tab-snapshot"><LayoutDashboard className="h-3.5 w-3.5" />Snapshot</TabsTrigger>
            <TabsTrigger value="retirement" className={tabClass} data-testid="client-tab-retire"><Gauge className="h-3.5 w-3.5" />Retirement &amp; Super</TabsTrigger>
            <TabsTrigger value="investments" className={tabClass} data-testid="client-tab-invest"><TrendingUp className="h-3.5 w-3.5" />Investments</TabsTrigger>
            <TabsTrigger value="budget" className={tabClass} data-testid="client-tab-budget"><PiggyBank className="h-3.5 w-3.5" />Budget</TabsTrigger>
            <TabsTrigger value="goals" className={tabClass} data-testid="client-tab-goals"><Target className="h-3.5 w-3.5" />Goals &amp; Scenarios</TabsTrigger>
            <TabsTrigger value="tax" className={tabClass} data-testid="client-tab-tax"><Calculator className="h-3.5 w-3.5" />Tax Centre</TabsTrigger>
          </TabsList>
          <TabsContent value="snapshot" className="pt-2"><SnapshotTab client={client} /></TabsContent>
          <TabsContent value="retirement" className="pt-2"><RetirementTab client={client} /></TabsContent>
          <TabsContent value="investments" className="pt-2"><InvestmentsTab client={client} /></TabsContent>
          <TabsContent value="budget" className="pt-2"><BudgetTab client={client} /></TabsContent>
          <TabsContent value="goals" className="pt-2"><SimpleGoals embedded clientId={clientId} /></TabsContent>
          <TabsContent value="tax" className="pt-2"><TaxTab client={client} /></TabsContent>
        </Tabs>
      </div>
      </PageShell>
    </Layout>
  );
};

export default SimpleClientView;
