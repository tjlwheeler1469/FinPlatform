// Thin page wrapper so ClientInvoicing can be reached via its own left-nav route.
import Layout from "@/components/Layout";
import ClientInvoicing from "@/components/ClientInvoicing";

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

const ClientInvoicingPage = () => (
  <Layout>
    <div className="p-4 max-w-[1600px] mx-auto" data-testid="client-invoicing-page">
      <ClientInvoicing clientId={useClientId()} />
    </div>
  </Layout>
);

export default ClientInvoicingPage;
