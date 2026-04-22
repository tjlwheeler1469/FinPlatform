// Client360View — Adviser's 360° client dashboard.
// Composition-only page. Heavy sections live in ./client360/*.
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, ArrowUpRight, ArrowDownRight, Download, Upload, Plus, FileText,
} from "lucide-react";
import RetirementWorkshop from "@/pages/RetirementWorkshop";
import AdviserClientInputs from "@/components/AdviserClientInputs";
import HouseholdBudget from "@/pages/HouseholdBudget";
import UnifiedInvestments from "@/pages/UnifiedInvestments";
import UnifiedTaxCentre from "@/pages/UnifiedTaxCentre";
import AdviserGoals from "@/components/AdviserGoals";
import MeetingMode from "@/components/MeetingMode";
import PortfolioRebalancing from "@/pages/PortfolioRebalancing";

import ClientHeader from "./client360/ClientHeader";
import OverviewTab from "./client360/OverviewTab";
import HoldingsTab from "./client360/HoldingsTab";
import PerformanceSection from "./client360/PerformanceSection";
import ContactAdvisorSection from "./client360/ContactAdvisorSection";
import { formatCurrency, formatDate, getTransactionColor, getCommIcon, getClientData } from "./client360/utils";

const TAB_DEFS = [
  { value: "overview", label: "Overview" },
  { value: "retirement", label: "Retirement" },
  { value: "budget", label: "Budget" },
  { value: "goals", label: "Goals" },
  { value: "investments-view", label: "Investments" },
  { value: "rebalance", label: "Rebalance" },
  { value: "tax", label: "Tax" },
  { value: "profile-inputs", label: "Profile & Inputs" },
  { value: "holdings", label: "Holdings" },
  { value: "performance", label: "Performance" },
  { value: "accounts", label: "Accounts" },
  { value: "transactions", label: "Activity" },
  { value: "documents", label: "Documents" },
  { value: "communications", label: "Timeline" },
  { value: "contact", label: "Contact" },
];

const Client360View = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [meetingMode, setMeetingMode] = useState(false);

  const storedClient = localStorage.getItem("selected_client");
  const clientId = searchParams.get("id") || (storedClient ? JSON.parse(storedClient).id : "client_1");
  const client = getClientData(clientId);

  if (meetingMode) return <MeetingMode client={client} onExit={() => setMeetingMode(false)} />;

  const handleModel = () => {
    localStorage.setItem("selected_client", JSON.stringify(client));
    window.dispatchEvent(new CustomEvent("client-changed"));
    navigate(`/transaction-modeler?client=${client.id}`);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="client-360-view">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/crm-command-center")} data-testid="back-to-crm" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to CRM
          </Button>
        </div>

        <ClientHeader client={client} onModel={handleModel} onMeeting={() => setMeetingMode(true)} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white border h-10 w-full justify-start gap-0 rounded-lg px-1 overflow-x-auto">
            {TAB_DEFS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-sm data-[state=active]:bg-[#0f1d35] data-[state=active]:text-white data-[state=active]:shadow-sm" data-testid={`tab-${tab.value}`}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6"><OverviewTab client={client} /></TabsContent>

          <TabsContent value="retirement" className="space-y-6" data-testid="tab-content-retirement">
            <RetirementWorkshop embedded clientId={clientId} />
          </TabsContent>

          <TabsContent value="budget" className="space-y-6" data-testid="tab-content-budget">
            <HouseholdBudget embedded />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6" data-testid="tab-content-goals">
            <AdviserGoals embedded clientId={clientId} />
          </TabsContent>

          <TabsContent value="investments-view" className="space-y-6" data-testid="tab-content-investments-view">
            <UnifiedInvestments embedded />
          </TabsContent>

          <TabsContent value="tax" className="space-y-6" data-testid="tab-content-tax">
            <UnifiedTaxCentre embedded />
          </TabsContent>

          <TabsContent value="profile-inputs" className="space-y-6" data-testid="tab-content-profile-inputs">
            <AdviserClientInputs clientId={clientId} client={client} />
          </TabsContent>

          <TabsContent value="holdings" className="space-y-6"><HoldingsTab /></TabsContent>

          <TabsContent value="performance" className="space-y-6"><PerformanceSection /></TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.accounts.map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`account-${account.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${account.type === "Liability" ? "bg-red-100" : "bg-[#1a2744]/10"}`}>
                          <account.icon className={`h-5 w-5 ${account.type === "Liability" ? "text-red-600" : "text-[#1a2744]"}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{account.name}</h4>
                          <p className="text-sm text-muted-foreground">{account.institution} • {account.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${account.balance < 0 ? "text-red-600" : ""}`}>{formatCurrency(Math.abs(account.balance))}</p>
                        <p className={`text-sm flex items-center justify-end gap-1 ${account.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {account.changePercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {account.changePercent >= 0 ? "+" : ""}{account.changePercent}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Transactions</CardTitle>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50" data-testid={`txn-${txn.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground w-20">{formatDate(txn.date)}</div>
                        <div>
                          <p className="font-medium">{txn.description}</p>
                          <p className="text-xs text-muted-foreground">{txn.account}</p>
                        </div>
                      </div>
                      <span className={`font-medium ${getTransactionColor(txn.type)}`}>
                        {txn.amount >= 0 ? "+" : ""}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Documents</CardTitle>
                  <Button size="sm" className="bg-[#1a2744]"><Upload className="h-4 w-4 mr-2" /> Upload</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50" data-testid={`doc-${doc.id}`}>
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">{doc.type} • {formatDate(doc.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          doc.status === "signed" ? "text-emerald-600 border-emerald-300"
                          : doc.status === "current" ? "text-blue-600 border-blue-300" : ""
                        }>{doc.status}</Badge>
                        <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communications">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Communication Timeline</CardTitle>
                  <Button size="sm" className="bg-[#1a2744]"><Plus className="h-4 w-4 mr-2" /> Log Activity</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                  <div className="space-y-6">
                    {client.communications.map((comm) => {
                      const CommIcon = getCommIcon(comm.type);
                      return (
                        <div key={comm.id} className="relative pl-10" data-testid={`comm-${comm.id}`}>
                          <div className="absolute left-0 w-8 h-8 rounded-full bg-white border-2 border-[#1a2744] flex items-center justify-center">
                            <CommIcon className="h-4 w-4 text-[#1a2744]" />
                          </div>
                          <div className="p-4 rounded-lg border bg-card">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="capitalize">{comm.type}</Badge>
                                  <Badge variant="secondary" className="capitalize">{comm.direction}</Badge>
                                  {comm.duration && <span className="text-xs text-muted-foreground">{comm.duration}</span>}
                                </div>
                                <p className="mt-2">{comm.summary}</p>
                                <p className="text-xs text-muted-foreground mt-2">By: {comm.by}</p>
                              </div>
                              <span className="text-sm text-muted-foreground">{formatDate(comm.date)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <ContactAdvisorSection client={client} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Client360View;
