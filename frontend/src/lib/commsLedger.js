// Central client communications ledger — single source of truth for all client
// comms events (emails sent, documents delivered, signatures received).
// Used by the Client Comms Timeline, Compliance Checkboxes, and Vault.
// Storage: localStorage "client_comms_ledger_v1" → { [clientId]: [events...] }

const STORAGE_KEY = "client_comms_ledger_v1";
const VAULT_KEY = "client_vault_v1";

const nowIso = () => new Date().toISOString();
const uid = () => `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const readAll = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
};
const writeAll = (obj) => localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));

const readVault = () => {
  try { return JSON.parse(localStorage.getItem(VAULT_KEY) || "{}"); }
  catch { return {}; }
};
const writeVault = (obj) => localStorage.setItem(VAULT_KEY, JSON.stringify(obj));

const dispatchChange = () => {
  try { window.dispatchEvent(new CustomEvent("comms-ledger-changed")); } catch { /* noop */ }
};

/**
 * Append a new event to a client's ledger.
 * @param {string} clientId - e.g. "thompson_family"
 * @param {object} event - { type, docType?, docName?, title, body?, meta? }
 */
export const logEvent = (clientId, event) => {
  if (!clientId) return null;
  const store = readAll();
  const list = store[clientId] || [];
  const entry = {
    id: uid(),
    ts: nowIso(),
    by: event.by || "adviser",
    ...event,
  };
  store[clientId] = [entry, ...list];
  writeAll(store);
  dispatchChange();
  return entry;
};

export const listEvents = (clientId) => {
  if (!clientId) return [];
  const store = readAll();
  return store[clientId] || [];
};

export const listEventsForClients = (clientIds = []) => {
  const store = readAll();
  const out = [];
  for (const cid of clientIds) {
    for (const e of store[cid] || []) out.push({ ...e, clientId: cid });
  }
  return out.sort((a, b) => (a.ts < b.ts ? 1 : -1));
};

export const clearClientEvents = (clientId) => {
  const store = readAll();
  delete store[clientId];
  writeAll(store);
  dispatchChange();
};

/**
 * Build a per-doc-type status map for a client:
 *   { SOA: { sentAt, signedAt, deliveredBy, signedBy, fileName }, ... }
 * Only the MOST RECENT event per docType is kept.
 */
export const getDocStatusMap = (clientId) => {
  const events = listEvents(clientId);
  const map = {};
  // iterate oldest → newest so newer events overwrite older ones
  for (const e of [...events].reverse()) {
    if (!e.docType) continue;
    const entry = map[e.docType] || { docType: e.docType, docName: e.docName || e.docType };
    if (e.type === "doc_sent") { entry.sentAt = e.ts; entry.sentBy = e.by; entry.deliveryChannel = e.meta?.channel; }
    if (e.type === "doc_viewed") entry.viewedAt = e.ts;
    if (e.type === "doc_signed") { entry.signedAt = e.ts; entry.signedBy = e.by; entry.vaultFileId = e.meta?.vaultFileId; }
    if (e.type === "doc_declined") { entry.declinedAt = e.ts; }
    map[e.docType] = entry;
  }
  return map;
};

/**
 * Vault APIs — stores signed doc blobs (base64 or URL) per client.
 * For the mock we store metadata only; production would put the PDF in object storage.
 */
export const addToVault = (clientId, file) => {
  if (!clientId) return null;
  const store = readVault();
  const list = store[clientId] || [];
  const entry = {
    id: `vault_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    addedAt: nowIso(),
    name: file.name,
    docType: file.docType,
    docName: file.docName,
    size: file.size || "—",
    signedBy: file.signedBy,
    signatureHash: `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}`, // mock
    source: file.source || "mock",
    meta: file.meta || {},
  };
  store[clientId] = [entry, ...list];
  writeVault(store);
  dispatchChange();
  return entry;
};

export const listVault = (clientId) => {
  if (!clientId) return [];
  const store = readVault();
  return store[clientId] || [];
};

export const removeFromVault = (clientId, fileId) => {
  const store = readVault();
  store[clientId] = (store[clientId] || []).filter((f) => f.id !== fileId);
  writeVault(store);
  dispatchChange();
};

// Required doc types for compliance checklist (per client)
export const REQUIRED_DOCS = [
  { id: "FSG", name: "Financial Services Guide" },
  { id: "SOA", name: "Statement of Advice" },
  { id: "ROA", name: "Record of Advice" },
  { id: "FDS", name: "Fee Disclosure Statement" },
  { id: "AnnualReview", name: "Annual Review Pack" },
  { id: "OpIn", name: "Opt-In Renewal" },
];
