// Standalone "Messages" page for the client portal — surfaces the existing
// MessagesTab thread under a dedicated left-nav entry so it's reachable
// without needing a dashboard tab. Keeps the adviser chat thread intact
// (localStorage: client_msgs_<clientId>).
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";
import MessagesTab from "@/pages/clientView/MessagesTab";

const ClientMessages = () => {
  const clientId = getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;

  return (
    <Layout>
      <PageShell
        eyebrow="MESSAGES"
        title="Talk to your adviser"
        accent="encrypted, just between us"
        subtitle={`Direct line to ${client.profile?.advisor || "your adviser"}. Replies appear here — usually within a business day.`}
        meta="ENCRYPTED · DELIVERY CONFIRMED · NO ATTACHMENTS"
      >
        <div className="max-w-[900px]" data-testid="client-messages-page">
          <MessagesTab clientId={clientId} />
        </div>
      </PageShell>
    </Layout>
  );
};

export default ClientMessages;
