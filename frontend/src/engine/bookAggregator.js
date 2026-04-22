// Aggregates readiness + rules across the full client book for the Retirement Control Center.
// Produces a ranked, categorised Intelligence Feed — every item is scored, quantified, actionable, urgent.
import { CLIENT_DATA } from "@/data/clientData";
import { evaluateRules } from "./rulesEngine";
import { whatMovesTheNeedle } from "./retirementReadinessEngine";
import { computeReadinessCached } from "./readinessCache";

// All real clients (de-duplicated — aliases like client_1 point to the same object).
const CLIENT_KEYS = ["thompson_family", "chen_family"];

export const buildBook = () => {
  const clients = CLIENT_KEYS.map((id) => {
    const c = CLIENT_DATA[id];
    if (!c) return null;
    const readiness = computeReadinessCached(id, c, { numSims: 150 });
    const { alerts, opportunities } = evaluateRules(c, readiness);
    const topOpportunity = opportunities[0] || null;
    return { id, name: c.profile?.name || id, advisor: c.profile?.advisor, readiness, alerts, opportunities, topOpportunity, raw: c };
  }).filter(Boolean);

  const onTrack = clients.filter((c) => c.readiness.score >= 75).length;
  const watchlist = clients.filter((c) => c.readiness.score >= 60 && c.readiness.score < 75).length;
  const atRisk = clients.filter((c) => c.readiness.score < 60).length;
  const totalShortfall = clients.reduce((s, c) => s + (c.readiness.outcome.fundingGap || 0), 0);
  const avgScore = clients.length ? Math.round(clients.reduce((s, c) => s + c.readiness.score, 0) / clients.length) : 0;
  const totalOpportunityValue = clients.reduce(
    (s, c) => s + c.opportunities.reduce((t, o) => t + (o.value || 0), 0),
    0
  );

  return {
    clients,
    kpis: {
      totalClients: clients.length,
      onTrackPct: clients.length ? Math.round((onTrack / clients.length) * 100) : 0,
      atRiskPct: clients.length ? Math.round((atRisk / clients.length) * 100) : 0,
      watchlistPct: clients.length ? Math.round((watchlist / clients.length) * 100) : 0,
      totalShortfall,
      avgScore,
      totalOpportunityValue,
    },
  };
};

// ══════════════════════════════════════════════════════════════════════════
// INTELLIGENCE FEED — ranked, quantified, actionable items only
// ══════════════════════════════════════════════════════════════════════════

// Category constants — used for auto-grouping in the UI
export const FEED_CATEGORIES = {
  OPPORTUNITY: "opportunity",   // High-impact opportunities
  RISK: "risk",                 // Risks & threats
  TIME_SENSITIVE: "time_sensitive",  // Cap expiry / EOFY / deadlines
  PORTFOLIO: "portfolio",       // Rebalancing / drift / allocation
  ENGAGEMENT: "engagement",     // Client engagement triggers
};

export const CATEGORY_META = {
  opportunity:     { label: "High-Impact Opportunities", tone: "emerald", accent: "#10b981" },
  risk:            { label: "Risks & Threats",           tone: "rose",    accent: "#e11d48" },
  time_sensitive:  { label: "Time-Sensitive Actions",    tone: "amber",   accent: "#f59e0b" },
  portfolio:       { label: "Portfolio Adjustments",     tone: "sky",     accent: "#0284c7" },
  engagement:      { label: "Client Engagement",         tone: "violet",  accent: "#7c3aed" },
};

// ── Urgency helpers ────────────────────────────────────────────────────
const eofyWindowDays = () => {
  // Australian FY ends 30 June. If we're within 60 days of 30 June → "NOW".
  const now = new Date();
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const eofy = new Date(year, 5, 30); // month is 0-indexed → 5 = June
  const days = Math.round((eofy - now) / (1000 * 60 * 60 * 24));
  return days;
};

const urgencyFromDays = (d) => {
  if (d <= 60) return "NOW";
  if (d <= 180) return "SOON";
  return "MONITOR";
};

// ── Confidence estimator ───────────────────────────────────────────────
// Blends Monte Carlo probability of the underlying projection with
// heuristic certainty about the *applicability* of the rule.
const confidenceFor = (c, baseMin = 72, baseMax = 96) => {
  const prob = c.readiness.outcome.probabilityOfSuccess || 0;
  const mixed = Math.round(baseMin + (prob / 100) * (baseMax - baseMin));
  return Math.min(98, Math.max(55, mixed));
};

// ── Impact score (0–100) ───────────────────────────────────────────────
// Weighted combination:
//   35% readiness score uplift (capped at 25 pts)
//   30% log-scaled $ impact
//   15% urgency bump
//   10% confidence
//   10% probability-of-success proximity (items that rescue at-risk clients lift)
const computeImpactScore = ({ scoreDelta, financialImpact, urgency, confidence, clientProb }) => {
  const deltaPart = Math.min(25, Math.max(0, scoreDelta)) / 25 * 35;
  const fi = Math.max(0, financialImpact || 0);
  const logFi = Math.log10(1 + fi) / Math.log10(1 + 1_000_000); // $1M saturates
  const moneyPart = Math.min(1, logFi) * 30;
  const urgencyPart = urgency === "NOW" ? 15 : urgency === "SOON" ? 8 : 3;
  const confPart = (Math.max(0, Math.min(100, confidence || 0)) / 100) * 10;
  const rescuePart = (100 - Math.max(0, Math.min(100, clientProb || 100))) / 100 * 10;
  return Math.round(deltaPart + moneyPart + urgencyPart + confPart + rescuePart);
};

// ── Feed item factory ──────────────────────────────────────────────────
const makeItem = ({
  id, category, headline, message,
  scoreDelta, financialImpact, urgency, confidence,
  client, actionHint, icon,
}) => {
  const impactScore = computeImpactScore({
    scoreDelta: scoreDelta || 0,
    financialImpact: financialImpact || 0,
    urgency,
    confidence,
    clientProb: client?.readiness?.outcome?.probabilityOfSuccess,
  });
  return {
    id,
    category,
    headline,
    message,
    impactScore,
    scoreDelta: Math.round(scoreDelta || 0),
    financialImpact: Math.round(financialImpact || 0),
    urgency,
    confidence,
    icon,
    actionHint,
    clientId: client?.id,
    clientName: client?.name,
    actions: [
      { id: "simulate", label: "Simulate" },
      { id: "apply", label: "Apply Strategy" },
      { id: "generate", label: "Generate Advice" },
      { id: "notify", label: "Notify Client" },
    ],
  };
};

// ── Build feed items for a single client ──────────────────────────────
const itemsForClient = (client) => {
  const items = [];
  const r = client.readiness;
  const top = whatMovesTheNeedle(client.raw);
  const eofyDays = eofyWindowDays();
  const baseSpend = client.raw.retirement?.retirement_spending || 150000;
  const lifeYears = (client.raw.retirement?.life_expectancy || 92) - (client.raw.retirement?.retirement_age || 67);

  // ── (a) Top "what moves the needle" actions — High-Impact Opportunities
  top.forEach((a, i) => {
    if (a.uplift <= 0) return;
    // lifetime $ impact: rough = uplift/100 * yearsRetired * annualSpend
    const financialImpact = Math.round((a.uplift / 100) * lifeYears * baseSpend);
    items.push(makeItem({
      id: `${client.id}-need-${a.id}`,
      category: FEED_CATEGORIES.OPPORTUNITY,
      headline: `${client.name}: ${a.label}`,
      message: `Projected readiness after change: ${a.score}/100. Lifetime outcome shifts by ~${shortMoney(financialImpact)}.`,
      scoreDelta: a.uplift,
      financialImpact,
      urgency: i === 0 ? "NOW" : "SOON",
      confidence: confidenceFor(client, 78 - i * 3, 95 - i * 3),
      client,
      icon: "sparkles",
      actionHint: "One-click simulation on the client hub.",
    }));
  });

  // ── (b) Critical/high alerts → Risks & Threats
  r && client.alerts.forEach((a) => {
    if (a.severity !== "critical" && a.severity !== "high") return;
    items.push(makeItem({
      id: `${client.id}-alert-${a.id}`,
      category: FEED_CATEGORIES.RISK,
      headline: `${client.name}: ${a.title}`,
      message: a.message,
      scoreDelta: a.severity === "critical" ? -15 : -8,
      financialImpact: Math.abs(r.outcome.fundingGap || 0) * 0.2,
      urgency: a.severity === "critical" ? "NOW" : "SOON",
      confidence: confidenceFor(client, 80, 94),
      client,
      icon: "alert-triangle",
      actionHint: "Review and mitigate before next review cycle.",
    }));
  });

  // ── (c) Rule-engine opportunities (non-concessional, SMSF, TTR, downsizer…) → Opportunity
  client.opportunities.forEach((o) => {
    if (["R3", "R11", "R12", "R13", "R14", "R15", "R16", "R17"].includes(o.id)) {
      const fi = o.value || r.outcome.fundingGap * 0.1 || 50000;
      const isConcessional = ["R3", "R17"].includes(o.id);
      items.push(makeItem({
        id: `${client.id}-opp-${o.id}`,
        category: isConcessional ? FEED_CATEGORIES.TIME_SENSITIVE : FEED_CATEGORIES.OPPORTUNITY,
        headline: `${client.name}: ${o.title}`,
        message: o.message,
        scoreDelta: o.severity === "high" ? 8 : o.severity === "medium" ? 5 : 3,
        financialImpact: fi,
        urgency: isConcessional ? urgencyFromDays(eofyDays) : "SOON",
        confidence: confidenceFor(client, 76, 93),
        client,
        icon: "target",
        actionHint: isConcessional ? `EOFY in ${eofyDays} days — act before 30 June to lock in.` : "Implementation window open.",
      }));
    }
  });

  // ── (d) Portfolio adjustments — concentration or allocation drift
  const concAlert = client.alerts.find((a) => a.id === "R6");
  if (concAlert) {
    items.push(makeItem({
      id: `${client.id}-portfolio-conc`,
      category: FEED_CATEGORIES.PORTFOLIO,
      headline: `${client.name}: Concentration risk — rebalance`,
      message: concAlert.message,
      scoreDelta: 6,
      financialImpact: (r.inputs.liquidWealth || 0) * 0.02,
      urgency: "SOON",
      confidence: confidenceFor(client, 80, 92),
      client,
      icon: "activity",
      actionHint: "Trim largest holding to target band.",
    }));
  }
  const seqAlert = client.alerts.find((a) => a.id === "R5");
  if (seqAlert) {
    items.push(makeItem({
      id: `${client.id}-portfolio-seq`,
      category: FEED_CATEGORIES.PORTFOLIO,
      headline: `${client.name}: Glide-path de-risk`,
      message: seqAlert.message,
      scoreDelta: 7,
      financialImpact: (r.inputs.liquidWealth || 0) * 0.025,
      urgency: "NOW",
      confidence: confidenceFor(client, 82, 94),
      client,
      icon: "activity",
      actionHint: "Shift 10–15% from growth → defensive to reduce sequence risk.",
    }));
  }

  // ── (e) Engagement triggers — below-target score needs adviser touch
  if (r.score < 70) {
    items.push(makeItem({
      id: `${client.id}-engage-review`,
      category: FEED_CATEGORIES.ENGAGEMENT,
      headline: `${client.name}: Schedule strategy review`,
      message: `Readiness ${r.score}/100 — client likely to benefit from a targeted session on funding and timing.`,
      scoreDelta: 4,
      financialImpact: r.outcome.fundingGap * 0.05 || 75000,
      urgency: r.score < 60 ? "NOW" : "SOON",
      confidence: 88,
      client,
      icon: "users",
      actionHint: "Book a 45-min review and issue an updated SOA pack.",
    }));
  }

  return items;
};

// Aggregate intelligence feed across the book — ranked, deduped, capped.
export const buildIntelligenceFeed = (book, limit = 15) => {
  const all = book.clients.flatMap(itemsForClient);

  // Add one book-level market signal (always monitorable context)
  all.push({
    id: "book-market-pulse",
    category: FEED_CATEGORIES.PORTFOLIO,
    headline: "Book-wide: ASX market movement",
    message: `${book.clients.length} clients exposed. Sequence-risk clients within 5yrs of retirement warrant allocation review.`,
    impactScore: 32,
    scoreDelta: 0,
    financialImpact: 0,
    urgency: "MONITOR",
    confidence: 80,
    clientId: null,
    clientName: "All clients",
    icon: "activity",
    actionHint: "Monitor allocation drift across the book.",
    actions: [{ id: "simulate", label: "Review book" }],
  });

  // Rank by impact, return top N
  return all
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, limit);
};

export const groupFeedByCategory = (feed) => {
  const groups = {};
  for (const key of Object.values(FEED_CATEGORIES)) groups[key] = [];
  feed.forEach((item) => {
    if (groups[item.category]) groups[item.category].push(item);
  });
  return groups;
};

// Priority clients — top N ranked by combined risk/opportunity urgency
export const rankPriorityClients = (book, limit = 10) => {
  return book.clients
    .map((c) => {
      const urgency = (100 - c.readiness.score) * 1.0
        + c.alerts.filter((a) => a.severity === "critical").length * 25
        + c.alerts.filter((a) => a.severity === "high").length * 10
        + (c.topOpportunity?.value || 0) / 50000;
      return { ...c, urgency };
    })
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, limit);
};

// ── formatting helpers ──
const shortMoney = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};
