// Lightweight in-memory TTL cache for readiness computations. Keyed by (clientId + inputs hash).
// Plus a tiny event bus so market/inflation/input events trigger a cache flush + recalc.
// Also emits compliance audit beacons on every fresh readiness compute.
import { computeReadiness as _computeReadinessRaw } from "./retirementReadinessEngine";

const CACHE = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 200;

const hashInputs = (client) => {
  const r = client.retirement || {};
  const assetsHash = (client.assets || []).reduce((h, a) => h + (a.value || 0), 0);
  return `${client.profile?.user_id || "x"}|${r.current_age}|${r.retirement_age}|${r.annual_contributions}|${r.retirement_spending}|${r.life_expectancy}|${assetsHash}`;
};

const hashOpts = (opts = {}) => `${opts.numSims || 300}|${opts.expectedReturn || ""}|${opts.inflationRate || ""}`;

const prune = () => {
  if (CACHE.size <= MAX_ENTRIES) return;
  const entries = [...CACHE.entries()].sort((a, b) => a[1].at - b[1].at);
  for (let i = 0; i < entries.length - MAX_ENTRIES; i++) CACHE.delete(entries[i][0]);
};

export const getCachedReadiness = (clientId, client, computeFn) => {
  const key = `${clientId}:${hashInputs(client)}`;
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.at < DEFAULT_TTL_MS) return hit.value;
  const value = computeFn();
  CACHE.set(key, { value, at: now });
  prune();
  return value;
};

// Primary wrapper used across the app — memoises computeReadiness by (clientId, inputs, opts).
// Also posts a compliance audit beacon on every fresh compute (fire-and-forget).
export const computeReadinessCached = (clientId, client, opts = {}) => {
  const key = `rr:${clientId || client?.profile?.user_id || "x"}:${hashInputs(client)}:${hashOpts(opts)}`;
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.at < DEFAULT_TTL_MS) return hit.value;
  const value = _computeReadinessRaw(client, opts);
  CACHE.set(key, { value, at: now });
  prune();
  _auditReadiness(clientId, client, value, opts);
  return value;
};

// ── Compliance audit beacon (fire-and-forget, rate-limited) ─────────────────
const AUDIT_DEBOUNCE = new Map(); // clientId -> last sent timestamp
const AUDIT_MIN_INTERVAL_MS = 30_000; // don't flood the backend

const _auditReadiness = (clientId, client, readiness, opts) => {
  try {
    const id = clientId || client?.profile?.user_id || "unknown";
    const last = AUDIT_DEBOUNCE.get(id) || 0;
    if (Date.now() - last < AUDIT_MIN_INTERVAL_MS) return;
    AUDIT_DEBOUNCE.set(id, Date.now());
    const base = process.env.REACT_APP_BACKEND_URL;
    if (!base) return;
    const mode = (typeof window !== "undefined" && window.localStorage?.getItem("app_mode")) || "adviser";
    fetch(`${base}/api/compliance-audit/readiness-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: id,
        client_name: client?.profile?.name || "",
        score: readiness.score,
        classification: readiness.classification?.label || "",
        factors: readiness.factors?.map((f) => ({ id: f.id, score: f.score })) || [],
        inputs: readiness.inputs || {},
        num_sims: opts.numSims || 300,
        actor: mode,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) {
    // audit never blocks the UI
  }
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
// Maintains a market-multiplier (1.0 ± random walk) that downstream readiness consumers
// can use to preview portfolio movement. In production this would hook to a websocket.
let _marketTimer = null;
let _marketMultiplier = 1.0;
let _marketLastTickAt = Date.now();
let _marketLastDelta = 0;
const _pulseListeners = new Set();

const _tick = () => {
  // Small bounded random walk — ±0.6% per tick, clamped to ±4%
  const delta = (Math.random() - 0.5) * 0.012;
  _marketMultiplier = Math.max(0.96, Math.min(1.04, _marketMultiplier * (1 + delta)));
  _marketLastDelta = delta;
  _marketLastTickAt = Date.now();
  // Only meaningful moves trigger recalc (> 0.25%)
  if (Math.abs(delta) > 0.0025) {
    publishRecalc("*", "market-feed");
  }
  _pulseListeners.forEach((cb) => {
    try { cb({ multiplier: _marketMultiplier, delta, at: _marketLastTickAt }); } catch (e) { /* ignore */ }
  });
};

export const startMarketFeed = (intervalMs = 45000) => {
  if (_marketTimer) return;
  _marketTimer = setInterval(_tick, intervalMs);
};
export const stopMarketFeed = () => {
  if (_marketTimer) clearInterval(_marketTimer);
  _marketTimer = null;
};

export const getMarketPulse = () => ({
  multiplier: _marketMultiplier,
  lastDelta: _marketLastDelta,
  lastTickAt: _marketLastTickAt,
  pctFromBaseline: (_marketMultiplier - 1) * 100,
});

export const onMarketPulse = (cb) => {
  _pulseListeners.add(cb);
  return () => _pulseListeners.delete(cb);
};

// Force an immediate tick (useful for manual "pulse now" button).
export const pulseNow = () => _tick();
