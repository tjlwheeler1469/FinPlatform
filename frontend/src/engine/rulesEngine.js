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

  // ── Expanded Opportunity Engine ─────────────────────────────────────────
  const liquid = readiness.inputs.liquidWealth || 0;
  const superBalance = (client.assets || []).filter((a) => a.type === "Super" || a.type === "SMSF").reduce((s, a) => s + (a.value || 0), 0);
  const smsfBalance = (client.assets || []).filter((a) => a.type === "SMSF").reduce((s, a) => s + (a.value || 0), 0);
  const age = client.retirement?.current_age || 50;

  // R11 — Non-concessional contribution capacity
  // Cap: $120k/yr post-tax, or $360k bring-forward. Flags clients with investable cash > $100k outside super.
  const cashOutsideSuper = (client.assets || [])
    .filter((a) => a.type === "Cash" || a.type === "Shares" || a.type === "Managed Fund")
    .reduce((s, a) => s + (a.value || 0), 0);
  const nonConcessionalCap = 120000;
  if (cashOutsideSuper > 100000 && superBalance < 1_900_000 && age < 75) {
    const headroom = Math.min(cashOutsideSuper * 0.5, 360000);  // cap at bring-forward
    opportunities.push({
      id: "R11",
      severity: "medium",
      type: "opportunity",
      title: "Non-concessional contribution capacity",
      message: `$${Math.round(headroom).toLocaleString()} can be moved into super tax-free (post-tax). Shelters earnings in the 15% super environment vs marginal rates.`,
      value: Math.round(headroom * 0.20),  // ~20% annual tax arbitrage benefit
    });
  }

  // R12 — SMSF suitability (>$500k super + multi-asset appetite)
  if (superBalance > 500_000 && smsfBalance === 0 && age < 70) {
    const smsfSaveBps = 40; // ~40bps fee saving vs retail super above $500k
    opportunities.push({
      id: "R12",
      severity: "low",
      type: "opportunity",
      title: "SMSF may be viable",
      message: `Super balance $${Math.round(superBalance).toLocaleString()} is past the ~$500k efficiency threshold — SMSF unlocks direct assets, property, and potential ${smsfSaveBps}bps fee saving.`,
      value: Math.round(superBalance * (smsfSaveBps / 10000)),
    });
  }

  // R13 — Spouse equalisation (partner super balance disparity)
  const partnerSuper = client.partner?.assets?.super || client.spouse?.super_balance || 0;
  const selfSuper = superBalance;
  if (partnerSuper > 0 && selfSuper > 0) {
    const ratio = Math.min(partnerSuper, selfSuper) / Math.max(partnerSuper, selfSuper);
    if (ratio < 0.5 && Math.max(partnerSuper, selfSuper) > 400_000) {
      const equalisable = Math.round((Math.max(partnerSuper, selfSuper) - Math.min(partnerSuper, selfSuper)) / 2);
      opportunities.push({
        id: "R13",
        severity: "medium",
        type: "opportunity",
        title: "Spouse equalisation — transfer balance cap efficiency",
        message: `Combined super $${Math.round(selfSuper + partnerSuper).toLocaleString()} but skewed ${Math.round(ratio * 100)}/${Math.round((1 - ratio) * 100)}. Equalising $${equalisable.toLocaleString()} via contribution splitting preserves two $1.9M transfer balance caps.`,
        value: Math.round(equalisable * 0.075),  // proxy tax saving
      });
    }
  }

  // R14 — Reversionary pension — binding nomination in place?
  if (age >= 55 && (client.profile?.marital_status === "married" || client.partner || client.spouse)) {
    const hasReversionaryNom = client.estate?.reversionary_pension === true
      || client.super?.reversionary_nomination === true;
    if (!hasReversionaryNom) {
      opportunities.push({
        id: "R14",
        severity: "medium",
        type: "opportunity",
        title: "Reversionary pension nomination missing",
        message: "Nominate your spouse as reversionary pensioner to auto-transfer your pension tax-efficiently on death and preserve the tax-free pension phase.",
      });
    }
  }

  // R15 — Transition to Retirement (TTR) strategy — age 60–64 & working
  if (age >= 60 && age < 65 && (client.retirement?.retirement_age || 67) > 62 && superBalance > 200_000) {
    const ttrSave = Math.round(Math.min(25000, superBalance * 0.04) * 0.175); // rough tax arbitrage
    opportunities.push({
      id: "R15",
      severity: "medium",
      type: "opportunity",
      title: "Transition to Retirement (TTR) pension",
      message: "Age 60+ and still working — a TTR pension can replace salary-sacrificed income with tax-free pension payments while capturing 15%→0% super fund tax.",
      value: ttrSave,
    });
  }

  // R16 — Downsizer contribution (age 55+, property > $500k eligible if downsized)
  const propertyValue = (client.assets || []).filter((a) => a.type === "Property" || a.type === "Real Estate").reduce((s, a) => s + (a.value || 0), 0);
  if (age >= 55 && propertyValue > 800_000) {
    opportunities.push({
      id: "R16",
      severity: "low",
      type: "opportunity",
      title: "Downsizer contribution eligibility",
      message: "Age 55+ with principal residence held >10 years — up to $300k per individual ($600k couple) can be added to super from sale proceeds (ignores caps & work test).",
      value: 300000 * 0.15,
    });
  }

  // R17 — Carry-forward concessional (unused caps from prior 5 yrs, super < $500k)
  if (superBalance < 500_000 && contrib < CONCESSIONAL_CAP && age < 75) {
    opportunities.push({
      id: "R17",
      severity: "low",
      type: "opportunity",
      title: "Carry-forward concessional contributions",
      message: `Super balance under $500k — can sweep up to 5 years of unused concessional caps (up to ~$125k lump) to shelter a high-income year or CGT event.`,
    });
  }

  alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  opportunities.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return { alerts, opportunities };
};
