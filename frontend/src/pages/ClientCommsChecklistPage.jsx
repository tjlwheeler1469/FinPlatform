// Thin page wrapper for the Communications Checklist & Timeline,
// moved from the Client Overview tab to its own left-nav route.
import Layout from "@/components/Layout";
import ClientCommsTimeline from "@/components/crm/ClientCommsTimeline";

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

const ClientCommsChecklistPage = () => (
  <Layout>
    <div className="p-4 max-w-[1600px] mx-auto" data-testid="client-comms-checklist-page">
      <ClientCommsTimeline clientId={useClientId()} />
    </div>
  </Layout>
);

export default ClientCommsChecklistPage;
