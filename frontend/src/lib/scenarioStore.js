// Global Scenario Store — single in-memory source of truth so editing
// adviser inputs on ANY page (Retirement Workshop, Household Budget, Tax tab,
// SOA builder) propagates everywhere. Persists to localStorage per client so
// the adviser can switch clients without losing draft scenarios.

import { useSyncExternalStore } from "react";
import { CLIENT_DATA, getActiveClientId } from "@/data/clientData";

const STORAGE_KEY = "wealth_command_scenario_v1";

// ----- defaults -----
const buildDefaultScenario = (client) => {
  const liquidAssets = (client?.assets || [])
    .filter((a) => ["Super", "Shares", "Managed Fund", "Cash", "Trust Portfolio", "SMSF", "Bonds", "Alternatives"].includes(a.type))
    .reduce((s, a) => s + (a.value || 0), 0);
  return {
    clientId: client?.client_id || "default",
    // Cash-flow (per-month dollars)
    monthlyIncome:        Math.round((client?.profile?.incomeHousehold || 185000) / 12),
    monthlyExpenses:      Math.round((client?.profile?.expensesAnnual || 95000) / 12),
    extraMonthlySavings:  0,
    // Investments
    currentPortfolio:    liquidAssets || 0,
    annualContributions: client?.retirement?.annual_contributions || 30000,
    expectedReturn:      6.5,
    volatility:          12,
    inflationRate:       2.5,
    // Goals / ages
    currentAge:    client?.retirement?.current_age || 50,
    retirementAge: client?.retirement?.retirement_age || 65,
    lifeExpectancy:client?.retirement?.life_expectancy || 92,
    retirementSpending: client?.retirement?.retirement_spending || 80000,
    legacyGoal:    0,
    // Budget 2026–27 reform inputs
    propertyType:        "existing",   // "new" | "existing" | "non-property"
    propertyPurchaseDate:"2024-01-01", // ISO date
    propertyCostBase:    0,
    propertyValue:       0,
    propertyRentalIncome:0,
    propertyExpenses:    0,
    cumulativeCpi:       1.0,
    isMeansTested:       false,
    // Trust
    hasDiscretionaryTrust: false,
    trustDistributedIncome: 0,
    trustIsCorporate: false,
    trustIsTestamentaryExisting: false,
    trustFrankingCredits: 0,
  };
};

// ----- store mechanics -----
const _loadAll = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
};
const _saveAll = (obj) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch {}
};

// In-memory cache so `getScenario(id)` returns a STABLE reference between
// updates. Without this, useSyncExternalStore triggers an infinite re-render
// (React detects "snapshot changed" because every parse returns a new object).
let _cache = null;
const _ensureCache = () => {
  if (_cache === null) _cache = _loadAll();
  return _cache;
};
const _invalidate = () => { _cache = null; };

let _listeners = new Set();
const _notify = () => _listeners.forEach((l) => l());

export const getScenario = (clientIdParam) => {
  const clientId = clientIdParam || getActiveClientId();
  const all = _ensureCache();
  if (all[clientId]) return all[clientId];
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const def = buildDefaultScenario(client);
  all[clientId] = def;
  _saveAll(all);
  return def;
};

export const setScenario = (clientIdParam, patch) => {
  const clientId = clientIdParam || getActiveClientId();
  const all = _ensureCache();
  const cur = all[clientId] || getScenario(clientId);
  all[clientId] = { ...cur, ...patch };
  _saveAll(all);
  _notify();
};

export const resetScenario = (clientIdParam) => {
  const clientId = clientIdParam || getActiveClientId();
  const client = CLIENT_DATA[clientId] || CLIENT_DATA.thompson_family;
  const def = buildDefaultScenario(client);
  const all = _ensureCache();
  all[clientId] = def;
  _saveAll(all);
  _notify();
};

const _subscribe = (cb) => { _listeners.add(cb); return () => _listeners.delete(cb); };

/** React hook: returns the active client's scenario, re-renders on any update.
 *  Listens to localStorage changes from other tabs as well so two windows stay
 *  in sync.
 *  @example const scenario = useScenario();   // active client
 *  @example const scenario = useScenario("emma_williams");
 */
export const useScenario = (clientIdParam) => {
  const clientId = clientIdParam || getActiveClientId();
  return useSyncExternalStore(
    (cb) => {
      const off = _subscribe(cb);
      const storageHandler = (e) => { if (e.key === STORAGE_KEY) { _invalidate(); cb(); } };
      window.addEventListener("storage", storageHandler);
      return () => { off(); window.removeEventListener("storage", storageHandler); };
    },
    () => getScenario(clientId),
    () => getScenario(clientId),
  );
};

/** Returns an updater callable. Usage:
 *  const update = useScenarioUpdater();
 *  update({ monthlyIncome: 50000 });
 */
export const useScenarioUpdater = (clientIdParam) => {
  const clientId = clientIdParam || getActiveClientId();
  return (patch) => setScenario(clientId, patch);
};
