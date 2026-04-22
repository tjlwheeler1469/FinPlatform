// Standalone "Messages" page for the client portal — surfaces the existing
// MessagesTab thread under a dedicated left-nav entry so it's reachable
// without needing a dashboard tab. Keeps the adviser chat thread intact
// (localStorage: client_msgs_<clientId>).
import Layout from "@/components/Layout";
import { getActiveClientId } from "@/data/clientData";
import MessagesTab from "@/pages/clientView/MessagesTab";

const ClientMessages = () => {
  const clientId = getActiveClientId();

  return (
    <Layout>
      <div className="max-w-[900px] mx-auto p-4" data-testid="client-messages-page">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#1a2744]">Messages</h1>
          <p className="text-xs text-muted-foreground">Send a message to your adviser — replies appear here.</p>
        </div>
        <MessagesTab clientId={clientId} />
      </div>
    </Layout>
  );
};

export default ClientMessages;
