// Simplified Client Portal — composition-only wrapper.
// Heavy tab content lives under ./clientView/*.
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard, TrendingUp, Gauge,
  PiggyBank, Calculator, Target,
} from "lucide-react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import SimpleGoals from "@/components/SimpleGoals";

import SnapshotTab from "./clientView/SnapshotTab";
import InvestmentsTab from "./clientView/InvestmentsTab";
import RetirementTab from "./clientView/RetirementTab";
import BudgetTab from "./clientView/BudgetTab";
import TaxTab from "./clientView/TaxTab";

const SimpleClientView = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto p-4" data-testid="simple-client-view">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#1a2744]">Hello, {client.profile.name.split(" & ")[0]}</h1>
          <p className="text-xs text-muted-foreground">A calm, simple view of your wealth · managed by {client.profile.advisor || "your adviser"}</p>
        </div>
        <Tabs defaultValue="snapshot">
          <TabsList className="bg-white border w-full justify-start h-10 overflow-x-auto">
            <TabsTrigger value="snapshot" className="gap-1.5 flex-shrink-0" data-testid="client-tab-snapshot"><LayoutDashboard className="h-3.5 w-3.5" />Snapshot</TabsTrigger>
            <TabsTrigger value="retirement" className="gap-1.5 flex-shrink-0" data-testid="client-tab-retire"><Gauge className="h-3.5 w-3.5" />Retirement &amp; Super</TabsTrigger>
            <TabsTrigger value="investments" className="gap-1.5 flex-shrink-0" data-testid="client-tab-invest"><TrendingUp className="h-3.5 w-3.5" />Investments</TabsTrigger>
            <TabsTrigger value="budget" className="gap-1.5 flex-shrink-0" data-testid="client-tab-budget"><PiggyBank className="h-3.5 w-3.5" />Budget</TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5 flex-shrink-0" data-testid="client-tab-goals"><Target className="h-3.5 w-3.5" />Goals &amp; Scenarios</TabsTrigger>
            <TabsTrigger value="tax" className="gap-1.5 flex-shrink-0" data-testid="client-tab-tax"><Calculator className="h-3.5 w-3.5" />Tax Centre</TabsTrigger>
          </TabsList>
          <TabsContent value="snapshot" className="pt-4"><SnapshotTab client={client} /></TabsContent>
          <TabsContent value="retirement" className="pt-4"><RetirementTab client={client} /></TabsContent>
          <TabsContent value="investments" className="pt-4"><InvestmentsTab client={client} /></TabsContent>
          <TabsContent value="budget" className="pt-4"><BudgetTab client={client} /></TabsContent>
          <TabsContent value="goals" className="pt-4"><SimpleGoals embedded clientId={clientId} /></TabsContent>
          <TabsContent value="tax" className="pt-4"><TaxTab client={client} /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SimpleClientView;
