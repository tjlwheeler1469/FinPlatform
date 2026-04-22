// Aggregates readiness + rules across the full client book for the Retirement Control Center.
import { CLIENT_DATA } from "@/data/clientData";
import { computeReadiness } from "./retirementReadinessEngine";
import { evaluateRules } from "./rulesEngine";

// All real clients (de-duplicated — aliases like client_1 point to the same object).
const CLIENT_KEYS = ["thompson_family", "chen_family"];

export const buildBook = () => {
  const clients = CLIENT_KEYS.map((id) => {
    const c = CLIENT_DATA[id];
    if (!c) return null;
    const readiness = computeReadiness(c, { numSims: 200 });
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

// Intelligence feed — synthesised system-level insights
export const buildIntelligenceFeed = (book) => {
  const feed = [];
  const belowTarget = book.clients.filter((c) => c.readiness.score < 70);
  if (belowTarget.length > 0) {
    feed.push({
      id: "feed-below70",
      severity: "high",
      tag: "Readiness",
      title: `${belowTarget.length} client${belowTarget.length > 1 ? "s" : ""} below 70% readiness`,
      message: `Average shortfall ${fmtShort(Math.round(belowTarget.reduce((s, c) => s + c.readiness.outcome.fundingGap, 0) / belowTarget.length))} per client.`,
      clients: belowTarget.map((c) => c.id),
    });
  }

  const gapClients = book.clients.filter((c) => (c.raw.retirement?.annual_contributions || 0) < 25000);
  if (gapClients.length > 0) {
    feed.push({
      id: "feed-concessional",
      severity: "medium",
      tag: "Opportunity",
      title: `${gapClients.length} client${gapClients.length > 1 ? "s have" : " has"} concessional contribution opportunities`,
      message: "Capture unused cap before EOFY to reduce taxable income.",
      clients: gapClients.map((c) => c.id),
    });
  }

  // Market-movement impact (mocked — would come from event stream)
  feed.push({
    id: "feed-market",
    severity: "medium",
    tag: "Market",
    title: `${book.clients.length} clients impacted by market movement (ASX -1.8% today)`,
    message: "Sequence-risk clients may be materially affected — review allocations for those within 5 years of retirement.",
    clients: book.clients.map((c) => c.id),
  });

  // Always-on: book summary card
  feed.push({
    id: "feed-summary",
    severity: "info",
    tag: "Book",
    title: `Book snapshot — avg readiness ${book.kpis.avgScore}/100 · total opportunity ${fmtShort(book.kpis.totalOpportunityValue)}`,
    message: `${book.kpis.onTrackPct}% on track · ${book.kpis.atRiskPct}% at risk · total shortfall ${fmtShort(book.kpis.totalShortfall)}.`,
    clients: book.clients.map((c) => c.id),
  });

  // Always-on: EOFY super contribution reminder (date-aware would be nicer; leaving as evergreen)
  feed.push({
    id: "feed-eofy",
    severity: "low",
    tag: "Planning",
    title: "EOFY approaching — review concessional & non-concessional contribution plans",
    message: "Audit each client's super cap usage; last-mile contributions lock in this-FY deductions.",
    clients: book.clients.map((c) => c.id),
  });

  // Delay-retirement upside
  const topDelayClient = book.clients
    .map((c) => ({ id: c.id, name: c.name, uplift: Math.max(0, 100 - c.readiness.score) }))
    .sort((a, b) => b.uplift - a.uplift)[0];
  if (topDelayClient && topDelayClient.uplift > 15) {
    feed.push({
      id: "feed-delay",
      severity: "low",
      tag: "Insight",
      title: `${topDelayClient.name}: delaying retirement by 2 years could lift readiness materially`,
      message: "Run the scenario simulator on their profile to quantify.",
      clients: [topDelayClient.id],
    });
  }

  return feed;
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

// ── helper ──
const fmtShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};
