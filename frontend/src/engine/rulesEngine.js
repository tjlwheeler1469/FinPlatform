// Rules Engine — deterministic, fires against a readiness result to produce alerts + opportunities.
// Each rule: { id, when: (ctx) => bool, emit: (ctx) => Alert }
// Alert = { id, severity, type, title, message, action?, href? }

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

const CONCESSIONAL_CAP = 30000;

export const evaluateRules = (client, readiness) => {
  const alerts = [];
  const opportunities = [];

  // R1 — Score < 60 → critical
  if (readiness.score < 60) {
    alerts.push({
      id: "R1",
      severity: "critical",
      type: "alert",
      title: "Retirement readiness critical",
      message: `Score ${readiness.score}/100 — plan not funded. Immediate adviser review required.`,
    });
  } else if (readiness.score < 75) {
    alerts.push({
      id: "R1b",
      severity: "high",
      type: "alert",
      title: "Retirement readiness on watchlist",
      message: `Score ${readiness.score}/100 — material gap between plan and outcome.`,
    });
  }

  // R2 — Probability < 70 → high
  if (readiness.outcome.probabilityOfSuccess < 70) {
    alerts.push({
      id: "R2",
      severity: "high",
      type: "alert",
      title: `Probability of success ${readiness.outcome.probabilityOfSuccess}%`,
      message: "1-in-3+ chance of depleting capital — simulate delay, rebalance, or increased saving.",
      href: "/strategic-planning",
    });
  }

  // R3 — Concessional gap
  const contrib = client.retirement?.annual_contributions || 0;
  const gap = CONCESSIONAL_CAP - contrib;
  if (gap > 5000) {
    const upliftAnnual = Math.round(gap * 0.62);  // assume ~38% marginal tax saved
    opportunities.push({
      id: "R3",
      severity: "medium",
      type: "opportunity",
      title: "Unused concessional contribution headroom",
      message: `$${gap.toLocaleString()} of annual cap unused — salary-sac capture up to $${upliftAnnual.toLocaleString()}/yr net after tax.`,
      value: upliftAnnual,
    });
  }

  // R4 — Funding gap
  if (readiness.outcome.fundingGap > 0) {
    opportunities.push({
      id: "R4",
      severity: readiness.outcome.fundingGap > 500000 ? "high" : "medium",
      type: "opportunity",
      title: "Funding gap vs 4% rule",
      message: `Target $${Math.round(readiness.inputs.requiredCapital).toLocaleString()} · current liquid $${Math.round(readiness.inputs.liquidWealth).toLocaleString()} · gap $${Math.round(readiness.outcome.fundingGap).toLocaleString()}.`,
      value: readiness.outcome.fundingGap,
    });
  }

  // R5 — Years to retirement < 5 & growth > 70% → sequence risk
  const yearsToRet = readiness.inputs.retireAge - readiness.inputs.currentAge;
  const assets = client.assets || [];
  const total = assets.reduce((s, a) => s + (a.value || 0), 0) || 1;
  const GROWTH = ["Shares", "Managed Fund", "Alternatives", "Trust Portfolio", "Crypto"];
  const growthPct = assets.filter((a) => GROWTH.includes(a.type)).reduce((s, a) => s + (a.value || 0), 0) / total;
  if (yearsToRet < 5 && growthPct > 0.65) {
    alerts.push({
      id: "R5",
      severity: "high",
      type: "risk",
      title: "Sequence-of-returns risk elevated",
      message: `Only ${yearsToRet}yr to retirement with ${(growthPct * 100).toFixed(0)}% growth assets — consider glide-path de-risking.`,
    });
  }

  // R6 — Concentration > 40%
  const topSingle = Math.max(...assets.map((a) => a.value || 0)) / total;
  if (topSingle > 0.4) {
    alerts.push({
      id: "R6",
      severity: "medium",
      type: "risk",
      title: "Concentration risk",
      message: `Single holding is ${(topSingle * 100).toFixed(0)}% of wealth — reduces portfolio resilience.`,
    });
  }

  // R7 — Cash drag > 25%
  const cashPct = assets.filter((a) => a.type === "Cash").reduce((s, a) => s + (a.value || 0), 0) / total;
  if (cashPct > 0.25) {
    opportunities.push({
      id: "R7",
      severity: "medium",
      type: "opportunity",
      title: "Cash drag on long-term returns",
      message: `${(cashPct * 100).toFixed(0)}% in cash — real returns lag inflation by ~2-3%/yr. Consider laddered term deposits or fixed income.`,
    });
  }

  // R8 — Debt at high rate (credit card or >8% mortgage)
  for (const l of (client.liabilities || [])) {
    if (l.rate >= 15) {
      alerts.push({
        id: "R8",
        severity: "high",
        type: "alert",
        title: "High-rate debt",
        message: `${l.name} at ${l.rate}% — paying this down returns a guaranteed ${l.rate}% (beats most market returns).`,
      });
    }
  }

  // R9 — Insurance gap (no life insurance while pre-retirement)
  if (yearsToRet > 10 && !(client.insurance?.length)) {
    opportunities.push({
      id: "R9",
      severity: "medium",
      type: "opportunity",
      title: "Life + TPD insurance gap",
      message: "Pre-retirement with dependents and no active policy — review protection cover.",
    });
  }

  // R10 — Spending > 4% of liquid — unsustainable withdrawal
  const spend = client.retirement?.retirement_spending || 0;
  if (readiness.inputs.liquidWealth > 0 && spend / readiness.inputs.liquidWealth > 0.055) {
    alerts.push({
      id: "R10",
      severity: "high",
      type: "risk",
      title: "Withdrawal rate above 5.5%",
      message: `Planned spend ${((spend / readiness.inputs.liquidWealth) * 100).toFixed(1)}% of liquid assets — historical sustainable is 3–4.5%.`,
    });
  }

  alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  opportunities.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return { alerts, opportunities };
};
