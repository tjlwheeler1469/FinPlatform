import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Mail, FolderOpen } from "lucide-react";
import DocumentManager from "@/components/DocumentManager";
import ClientMessaging from "@/components/ClientMessaging";

const DocumentsCommunications = () => {
  const [activeTab, setActiveTab] = useState("documents");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Documents & Communications</h1>
          <p className="text-muted-foreground">Manage your reports and messages</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="documents" className="gap-2" data-testid="tab-documents">
              <FileText className="h-4 w-4" /> Documents
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2" data-testid="tab-messages">
              <Mail className="h-4 w-4" /> Messages
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
    </Layout>
  );
};

export default DocumentsCommunications;
