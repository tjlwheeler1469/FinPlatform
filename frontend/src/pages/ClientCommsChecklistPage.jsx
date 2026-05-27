// Thin page wrapper for the Communications Checklist & Timeline,
// moved from the Client Overview tab to its own left-nav route.
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import ClientCommsTimeline from "@/components/crm/ClientCommsTimeline";
import { CLIENT_DATA } from "@/data/clientData";

const useClientId = () => {
  try {
    const saved = localStorage.getItem("selected_client");
    if (saved) {
      const c = JSON.parse(saved);
      return c?.id || c?.client_id || "thompson_family";
    }
  } catch { /* ignore */ }
  return "thompson_family";
};

const ClientCommsChecklistPage = () => {
  const clientId = useClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  return (
    <Layout>
      <PageShell
        eyebrow="ADVISER · COMMUNICATIONS"
        title="Comms checklist"
        accent="every touchpoint logged"
        subtitle="Audit-ready timeline of every email, call, meeting, FDS reminder, and signed document — for a single household."
        meta={`ACTIVE CLIENT · ${(client.profile?.name || "").toUpperCase()}`}
      >
        <div data-testid="client-comms-checklist-page">
          <ClientCommsTimeline clientId={clientId} />
        </div>
      </PageShell>
    </Layout>
  );
};

export default ClientCommsChecklistPage;
