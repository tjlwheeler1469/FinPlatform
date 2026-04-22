// Retirement Readiness Engine — CORE IP
// 0-100 composite score from 5 weighted factors. Pure JS, no side-effects.
// Inputs: client object (same shape as /app/frontend/src/data/clientData.js).
import { projectRetirement } from "@/lib/retirementEngine";

// ── Asset classification helpers ───────────────────────────────────────────
const LIQUID_TYPES = ["Super", "SMSF", "Shares", "Managed Fund", "Bonds", "Cash", "Alternatives", "Trust Portfolio"];
const GROWTH_TYPES = ["Shares", "Managed Fund", "Alternatives", "Trust Portfolio", "Crypto"];

const sumValue = (rows) => rows.reduce((s, r) => s + (r.value || 0), 0);

const liquidWealth = (client) =>
  sumValue(client.assets.filter((a) => LIQUID_TYPES.includes(a.type)));

const totalWealth = (client) =>
  sumValue(client.assets) - sumValue(client.liabilities || []);

// ── Factor scoring functions ───────────────────────────────────────────────
// Each returns 0-100.

// F1 — Income Sustainability (30%)
// projected income / required income
const scoreIncomeSustainability = (projectedRetirementIncome, requiredIncome) => {
  if (!requiredIncome) return 50;
  const ratio = projectedRetirementIncome / requiredIncome;
  if (ratio >= 1.0) return Math.min(100, 80 + (ratio - 1.0) * 100);   // >100% → 80-100
  if (ratio >= 0.9) return 60 + (ratio - 0.9) * 200;                    // 90-100% → 60-80
  if (ratio >= 0.7) return 40 + (ratio - 0.7) * 100;                    // 70-90% → 40-60
  return Math.max(0, ratio * 57);                                        // <70% → 0-40
};

// F2 — Probability of Success (25%) — Monte Carlo success %
const scoreProbability = (successPct) => {
  if (successPct >= 90) return Math.min(100, 80 + (successPct - 90) * 2);
  if (successPct >= 80) return 60 + (successPct - 80) * 2;
  if (successPct >= 60) return 40 + (successPct - 60) * 1;
  return Math.max(0, successPct * 0.66);
};

// F3 — Funding Adequacy (20%) — assets / required capital
const scoreFunding = (liquidAssets, requiredCapital) => {
  if (!requiredCapital) return 50;
  const ratio = liquidAssets / requiredCapital;
  if (ratio >= 1.0) return Math.min(100, 80 + (ratio - 1.0) * 40);
  if (ratio >= 0.8) return 60 + (ratio - 0.8) * 100;
  if (ratio >= 0.6) return 40 + (ratio - 0.6) * 100;
  return Math.max(0, ratio * 66);
};

// F4 — Risk Exposure (15%) — concentration + sequence + inflation sensitivity
const scoreRisk = (client) => {
  const assets = client.assets || [];
  const total = sumValue(assets) || 1;

  // Concentration — largest single asset %
  const topSingle = Math.max(...assets.map((a) => a.value || 0)) / total;

  // Growth allocation — too-high = high sequence risk late in life
  const growthPct = sumValue(assets.filter((a) => GROWTH_TYPES.includes(a.type))) / total;

  // Inflation sensitivity — cash-heavy portfolios lose purchasing power
  const cashPct = sumValue(assets.filter((a) => a.type === "Cash")) / total;

  const yearsToRetirement = Math.max(0, (client.retirement?.retirement_age || 67) - (client.retirement?.current_age || 50));
  const targetGrowthPct = yearsToRetirement > 20 ? 0.65 : yearsToRetirement > 10 ? 0.55 : 0.40;

  // Score: start 100, penalise deviations
  let s = 100;
  if (topSingle > 0.4) s -= (topSingle - 0.4) * 150;           // concentration penalty
  if (Math.abs(growthPct - targetGrowthPct) > 0.15) s -= 18;    // off-target growth allocation
  if (cashPct > 0.25) s -= (cashPct - 0.25) * 100;             // cash drag
  return Math.max(0, Math.min(100, s));
};

// F5 — Flexibility (10%) — income buffer, contribution headroom, retirement timing options
const scoreFlexibility = (client) => {
  const income = client.profile?.incomeHousehold || (client.budget?.monthlyIncome || 0) * 12;
  const expenses = client.profile?.expensesAnnual || (client.budget?.monthlyExpenses || 0) * 12;
  const savingsRate = income > 0 ? (income - expenses) / income : 0;

  const concessionalCap = 30000;
  const currentContrib = client.retirement?.annual_contributions || 0;
  const capHeadroom = Math.max(0, (concessionalCap - currentContrib)) / concessionalCap;

  const age = client.retirement?.current_age || 50;
  const timingFlex = age < 55 ? 1.0 : age < 60 ? 0.7 : 0.4;

  // Weighted: savings rate dominates, headroom & timing secondary
  const score = savingsRate * 60 + capHeadroom * 20 + timingFlex * 20;
  return Math.max(0, Math.min(100, score * 100 / 100));
};

// ── Classification ─────────────────────────────────────────────────────────
export const classify = (score) => {
  if (score >= 90) return { label: "Strong", tone: "emerald", color: "#10b981" };
  if (score >= 75) return { label: "On Track", tone: "blue", color: "#3b82f6" };
  if (score >= 60) return { label: "Watchlist", tone: "amber", color: "#f59e0b" };
  return { label: "At Risk", tone: "rose", color: "#ef4444" };
};

// ── What-moves-the-needle: recompute score under alternative scenarios ────
const probeWithOverrides = (client, overrides) => {
  const merged = {
    ...client,
    retirement: { ...client.retirement, ...overrides },
  };
  return computeReadiness(merged).score;
};

// ── Main entry point ───────────────────────────────────────────────────────
export const computeReadiness = (client, opts = {}) => {
  const currentAge = client.retirement?.current_age || 50;
  const retireAge = client.retirement?.retirement_age || 67;
  const lifeExp = client.retirement?.life_expectancy || 92;
  const annualContributions = client.retirement?.annual_contributions || 0;
  const annualSpending = client.retirement?.retirement_spending || 150000;
  const liquid = liquidWealth(client);

  // Monte Carlo projection (reused from existing engine)
  const proj = projectRetirement({
    currentPortfolio: liquid,
    annualContributions,
    annualSpending,
    yearsToRetirement: Math.max(0, retireAge - currentAge),
    yearsInRetirement: Math.max(1, lifeExp - retireAge),
    numSims: opts.numSims || 300,
  });

  // Projected retirement income (median) = portfolio at retirement / years in retirement, real
  const yearsRetired = Math.max(1, lifeExp - retireAge);
  const projectedIncome = proj.portfolioAtRetirement > 0 ? (proj.portfolioAtRetirement * 0.045) : 0; // 4.5% safe withdrawal
  const requiredCapital = annualSpending * 25; // 4% rule

  // Factor scores
  const f1 = scoreIncomeSustainability(projectedIncome, annualSpending);
  const f2 = scoreProbability(proj.confidence);
  const f3 = scoreFunding(liquid, requiredCapital);
  const f4 = scoreRisk(client);
  const f5 = scoreFlexibility(client);

  const score = Math.round(f1 * 0.30 + f2 * 0.25 + f3 * 0.20 + f4 * 0.15 + f5 * 0.10);
  const classification = classify(score);

  // Funding gap
  const fundingGap = Math.max(0, requiredCapital - liquid);

  // Years of sustainability (on P50)
  const yearsSustainability = proj.medianDepletionYear !== null ? proj.medianDepletionYear : yearsRetired;

  return {
    score,
    classification,
    factors: [
      { id: "income", label: "Income Sustainability", weight: 30, score: Math.round(f1) },
      { id: "probability", label: "Probability of Success", weight: 25, score: Math.round(f2) },
      { id: "funding", label: "Funding Adequacy", weight: 20, score: Math.round(f3) },
      { id: "risk", label: "Risk Exposure", weight: 15, score: Math.round(f4) },
      { id: "flexibility", label: "Flexibility & Resilience", weight: 10, score: Math.round(f5) },
    ],
    outcome: {
      sustainableIncome: Math.round(projectedIncome),
      probabilityOfSuccess: proj.confidence,
      fundingGap: Math.round(fundingGap),
      yearsSustainability,
      portfolioAtRetirement: Math.round(proj.portfolioAtRetirement),
      confidenceBands: {
        p10: Math.round(proj.p10AtLifeEnd),
        p50: Math.round(proj.p50AtLifeEnd),
        p90: Math.round(proj.p90AtLifeEnd),
      },
      trajectory: proj.trajectory,
    },
    inputs: { currentAge, retireAge, lifeExp, annualContributions, annualSpending, liquidWealth: liquid, totalWealth: totalWealth(client), requiredCapital },
  };
};

// Top 3 actions ranked by score uplift.
export const whatMovesTheNeedle = (client) => {
  const baseline = computeReadiness(client, { numSims: 200 }).score;
  const candidates = [
    {
      id: "contrib_up",
      label: "Increase concessional contributions to the $30k cap",
      apply: (c) => ({ annual_contributions: Math.min(30000, (c.retirement?.annual_contributions || 0) + 10000) }),
    },
    {
      id: "delay_retirement",
      label: "Delay retirement by 2 years",
      apply: (c) => ({ retirement_age: (c.retirement?.retirement_age || 67) + 2 }),
    },
    {
      id: "reduce_spending",
      label: "Reduce retirement spending by 10%",
      apply: (c) => ({ retirement_spending: Math.round((c.retirement?.retirement_spending || 150000) * 0.9) }),
    },
    {
      id: "part_time",
      label: "Transition to part-time work for 3 years",
      apply: (c) => ({
        retirement_age: (c.retirement?.retirement_age || 67) + 3,
        annual_contributions: Math.max(0, (c.retirement?.annual_contributions || 0) - 20000),
      }),
    },
    {
      id: "lift_allocation",
      label: "Rebalance to target growth allocation",
      // Proxied via a modest probability boost (risk score bump not re-run through projection)
      apply: () => ({}),
      proxyUplift: 4,
    },
  ];

  const results = candidates.map((c) => {
    if (c.proxyUplift) return { ...c, score: baseline + c.proxyUplift, uplift: c.proxyUplift };
    const s = probeWithOverrides(client, c.apply(client));
    return { id: c.id, label: c.label, score: s, uplift: s - baseline };
  });

  return results.sort((a, b) => b.uplift - a.uplift).slice(0, 3);
};

// Simple risk panel summary
export const riskPanel = (client) => {
  const assets = client.assets || [];
  const total = sumValue(assets) || 1;
  const topSingle = Math.max(...assets.map((a) => a.value || 0)) / total;
  const growthPct = sumValue(assets.filter((a) => GROWTH_TYPES.includes(a.type))) / total;
  const cashPct = sumValue(assets.filter((a) => a.type === "Cash")) / total;
  const yearsToRetirement = Math.max(0, (client.retirement?.retirement_age || 67) - (client.retirement?.current_age || 50));

  return [
    {
      id: "longevity",
      label: "Longevity risk",
      severity: (client.retirement?.life_expectancy || 92) - (client.retirement?.retirement_age || 67) > 25 ? "medium" : "low",
      message: `Planning to ${client.retirement?.life_expectancy || 92} — a 5-year longevity surprise would add ~${Math.round(((client.retirement?.retirement_spending || 150000) * 5) / 1_000_000 * 10) / 10}M of required capital.`,
    },
    {
      id: "sequence",
      label: "Sequence-of-returns risk",
      severity: yearsToRetirement < 5 && growthPct > 0.6 ? "high" : yearsToRetirement < 10 && growthPct > 0.7 ? "medium" : "low",
      message: `Growth allocation ${(growthPct * 100).toFixed(0)}% with ${yearsToRetirement} years to retirement.`,
    },
    {
      id: "inflation",
      label: "Inflation sensitivity",
      severity: cashPct > 0.3 ? "high" : cashPct > 0.15 ? "medium" : "low",
      message: `${(cashPct * 100).toFixed(0)}% of assets in cash — real purchasing power drops ~2–3%/yr.`,
    },
    {
      id: "concentration",
      label: "Concentration risk",
      severity: topSingle > 0.4 ? "high" : topSingle > 0.25 ? "medium" : "low",
      message: `Largest holding is ${(topSingle * 100).toFixed(0)}% of total assets.`,
    },
  ];
};
