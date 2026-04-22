// Lightweight in-memory TTL cache for readiness computations. Keyed by (clientId + inputs hash).
// Plus a tiny event bus so market/inflation/input events trigger a cache flush + recalc.
const CACHE = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const hashInputs = (client) => {
  const r = client.retirement || {};
  const assetsHash = (client.assets || []).reduce((h, a) => h + (a.value || 0), 0);
  return `${client.profile?.user_id || "x"}|${r.current_age}|${r.retirement_age}|${r.annual_contributions}|${r.retirement_spending}|${r.life_expectancy}|${assetsHash}`;
};

export const getCachedReadiness = (clientId, client, computeFn) => {
  const key = `${clientId}:${hashInputs(client)}`;
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.at < DEFAULT_TTL_MS) return hit.value;
  const value = computeFn();
  CACHE.set(key, { value, at: now });
  return value;
};

export const invalidateCache = (clientId) => {
  if (!clientId) {
    CACHE.clear();
    return;
  }
  for (const k of CACHE.keys()) if (k.startsWith(`${clientId}:`)) CACHE.delete(k);
};

// ── Event bus ───────────────────────────────────────────────────────────────
const listeners = new Map();

export const onRecalc = (clientId, cb) => {
  const set = listeners.get(clientId) || new Set();
  set.add(cb);
  listeners.set(clientId, set);
  return () => set.delete(cb);
};

// Broadcast e.g. when market moves, inflation changes, or user edits inputs
export const publishRecalc = (clientId, reason = "user-edit") => {
  invalidateCache(clientId);
  (listeners.get(clientId) || []).forEach((cb) => cb(reason));
  (listeners.get("*") || []).forEach((cb) => cb(reason, clientId));
};

// Simulated real-time market feed — polls every 45s and emits a book-wide recalc signal.
// In production this would hook to a websocket.
let _marketTimer = null;
export const startMarketFeed = () => {
  if (_marketTimer) return;
  _marketTimer = setInterval(() => {
    publishRecalc("*", "market-feed");
  }, 45000);
};
export const stopMarketFeed = () => {
  if (_marketTimer) clearInterval(_marketTimer);
  _marketTimer = null;
};
