// Thin page wrapper so ClientInvoicing can be reached via its own left-nav route.
import Layout from "@/components/Layout";
import { PageShell } from "@/components/PageShell";
import ClientInvoicing from "@/components/ClientInvoicing";
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

const ClientInvoicingPage = () => {
  const clientId = useClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  return (
    <Layout>
      <PageShell
        eyebrow="BILLING · INVOICING"
        title="Invoicing"
        accent="fees, paid and pending"
        subtitle="Generate, send, and reconcile invoices against advice fees, plan reviews, and one-off engagements."
        meta={`ACTIVE CLIENT · ${(client.profile?.name || "").toUpperCase()}`}
      >
        <div data-testid="client-invoicing-page">
          <ClientInvoicing clientId={clientId} />
        </div>
      </PageShell>
    </Layout>
  );
};

export default ClientInvoicingPage;
