// Rockstar CRM — best-in-class client relationship management.
// 4 power-tools: Segmentations · Newsletter Builder · Compliance Tracker · DocuSign Mock
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Mail, ShieldCheck, FileSignature, Sparkles } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClientSegmentations from "@/components/crm/ClientSegmentations";
import NewsletterBuilder from "@/components/crm/NewsletterBuilder";
import ComplianceTracker from "@/components/crm/ComplianceTracker";
import DocuSignMock from "@/components/crm/DocuSignMock";

const tabClass = "gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-md transition-colors data-[state=active]:bg-[#1a2744]/10 data-[state=active]:text-[#1a2744] data-[state=active]:font-semibold data-[state=active]:shadow-[inset_0_-2px_0_#D4A84C]";

const RockstarCRM = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" data-testid="rockstar-crm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1a2744] flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-[#D4A84C]" />
                Rockstar CRM
              </h1>
              <p className="text-sm text-muted-foreground">Segmentations · campaigns · legal compliance · e-signatures</p>
            </div>
            <Card className="bg-[#1a2744]/5 border-[#1a2744]/20">
              <CardContent className="p-3 text-xs text-[#1a2744]">
                <span className="font-semibold">Mock mode.</span> Email/e-sign providers use placeholder stubs — bring your keys when ready.
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="segments">
            <TabsList className="bg-white border h-11 w-full justify-start gap-1 px-1 overflow-x-auto mb-4">
              <TabsTrigger value="segments" className={tabClass} data-testid="crm-tab-segments"><Users className="h-3.5 w-3.5" /> Segmentations</TabsTrigger>
              <TabsTrigger value="newsletter" className={tabClass} data-testid="crm-tab-newsletter"><Mail className="h-3.5 w-3.5" /> Newsletters &amp; Comms</TabsTrigger>
              <TabsTrigger value="compliance" className={tabClass} data-testid="crm-tab-compliance"><ShieldCheck className="h-3.5 w-3.5" /> SOA / ROA Compliance</TabsTrigger>
              <TabsTrigger value="docusign" className={tabClass} data-testid="crm-tab-docusign"><FileSignature className="h-3.5 w-3.5" /> E-Signatures</TabsTrigger>
            </TabsList>

            <TabsContent value="segments"><ErrorBoundary label="Segmentations"><ClientSegmentations /></ErrorBoundary></TabsContent>
            <TabsContent value="newsletter"><ErrorBoundary label="Newsletter"><NewsletterBuilder /></ErrorBoundary></TabsContent>
            <TabsContent value="compliance"><ErrorBoundary label="Compliance"><ComplianceTracker /></ErrorBoundary></TabsContent>
            <TabsContent value="docusign"><ErrorBoundary label="DocuSign"><DocuSignMock /></ErrorBoundary></TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default RockstarCRM;
