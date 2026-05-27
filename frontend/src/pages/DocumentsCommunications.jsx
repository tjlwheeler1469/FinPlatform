import { useState } from "react";
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Mail } from "lucide-react";
import DocumentManager from "@/components/DocumentManager";
import ClientMessaging from "@/components/ClientMessaging";

const tabClass = "gap-1.5 px-4 py-2 rounded-full transition-all border border-transparent data-[state=active]:bg-[#1a2744] data-[state=active]:text-white data-[state=active]:border-[#1a2744] data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:border-slate-300";

const DocumentsCommunications = () => {
  const [activeTab, setActiveTab] = useState("documents");

  return (
    <Layout>
      <PageShell
        eyebrow="ADVICE TRAIL"
        title="Documents &amp; communications"
        accent="one paper trail"
        subtitle="Every report and every message — generated, sent, signed, and stored in one place. Auditable, encrypted, and synced with your adviser's compliance dashboard."
        meta="LIVE · ENCRYPTED · AUDIT-READY"
      >
        <div className="space-y-6" data-testid="documents-communications-page">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-0 h-auto w-full justify-start gap-1.5 px-0 p-0">
              <TabsTrigger value="documents" className={tabClass} data-testid="tab-documents">
                <FileText className="h-3.5 w-3.5" /> Documents
              </TabsTrigger>
              <TabsTrigger value="messages" className={tabClass} data-testid="tab-messages">
                <Mail className="h-3.5 w-3.5" /> Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-6">
              <DocumentManager />
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              <ClientMessaging userRole="client" userName="David Thompson" />
            </TabsContent>
          </Tabs>
        </div>
      </PageShell>
    </Layout>
  );
};

export default DocumentsCommunications;
