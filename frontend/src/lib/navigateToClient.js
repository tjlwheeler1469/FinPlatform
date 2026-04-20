// Universal helper: set adviser client context + navigate to the client dashboard.
// Use this across all firm-wide adviser pages (Command Center, Intelligence, Alerts)
// so clicking any client reference deep-links to that client's unified dashboard.
import { CLIENT_DATA } from "@/data/clientData";

const CLIENT_SLUG_BY_NAME = Object.fromEntries(
  Object.entries(CLIENT_DATA).flatMap(([slug, c]) => {
    const name = c?.profile?.name?.toLowerCase() || "";
    const last = c?.profile?.last_name?.toLowerCase() || "";
    return [[name, slug], [last, slug], [slug.toLowerCase(), slug]];
  })
);

// Resolve a client id from any of: slug, display name, client_id string
export const resolveClientSlug = (input) => {
  if (!input) return null;
  const key = String(input).toLowerCase().trim();
  if (CLIENT_DATA[input]) return input;
  if (CLIENT_SLUG_BY_NAME[key]) return CLIENT_SLUG_BY_NAME[key];
  // Fuzzy last-name match (e.g., "Patel Holdings" → "client_5")
  for (const [k, slug] of Object.entries(CLIENT_SLUG_BY_NAME)) {
    if (k && key.includes(k) && k.length > 3) return slug;
  }
  return null;
};

// Core helper: switches the app into adviser client context and navigates to /dashboard.
// `targetTab` is optional — if provided, the UnifiedClientOverview tab will be pre-selected.
export const navigateToClient = (navigate, clientRef, opts = {}) => {
  const slug = resolveClientSlug(clientRef) || "thompson_family";
  const client = CLIENT_DATA[slug];
  localStorage.setItem("app_mode", "adviser");
  localStorage.setItem("active_client_id", slug);
  localStorage.setItem(
    "selected_client",
    JSON.stringify({
      id: slug,
      client_id: slug,
      name: client?.profile?.name || slug,
      aum: (client?.assets || []).reduce((s, a) => s + (a.value || 0), 0),
    })
  );
  if (opts.tab) localStorage.setItem("client_overview_default_tab", opts.tab);
  // Broadcast so PortfolioProvider (listening) can swap data without polling.
  window.dispatchEvent(new CustomEvent('client-changed', { detail: { id: slug } }));
  navigate(opts.path || "/dashboard");
};

export const getClientDisplayName = (clientRef) => {
  const slug = resolveClientSlug(clientRef);
  return slug ? CLIENT_DATA[slug]?.profile?.name : clientRef;
};
