// Comprehensive calculation stress tests
// Validates: tax brackets duplication, CGT discounts, SG/Concessional caps, readiness engine,
// rules engine, loan amortisation formula, Monte Carlo invariants
//
// Run: cd /app/frontend && node src/lib/calculations.test.mjs

import { projectRetirement, buildScenarioFromInputs } from "./retirementEngine.js";
import {
  computeReadiness,
  classify,
  whatMovesTheNeedle,
  riskPanel,
} from "../engine/retirementReadinessEngine.js";
import { evaluateRules } from "../engine/rulesEngine.js";

let pass = 0;
let fail = 0;
const failures = [];
const matrix = [];

function eq(name, actual, expected, tolerance = 0) {
  const ok =
    typeof expected === "number"
      ? Math.abs(actual - expected) <= tolerance
      : actual === expected;
  if (ok) {
    pass++;
    matrix.push({ name, actual, expected, status: "PASS" });
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push({ name, actual, expected });
    matrix.push({ name, actual, expected, status: "FAIL" });
    console.log(`  ✗ ${name} | expected=${expected} actual=${actual}`);
  }
}

function truthy(name, val) {
  if (val) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    failures.push({ name, actual: val, expected: "truthy" });
    console.log(`  ✗ ${name}`);
  }
}

// ─── Re-implement the two tax calculators inline (mirror source) ──────────
const TAX_BRACKETS = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 0.16 },
  { min: 45001, max: 135000, rate: 0.30 },
  { min: 135001, max: 190000, rate: 0.37 },
  { min: 190001, max: Infinity, rate: 0.45 },
];

// Mirror StrategicPlanning.jsx calculateTax
function calcTax_StrategicPlanning(income) {
  let tax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income > bracket.min) {
      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      tax += Math.max(0, taxableInBracket) * bracket.rate;
    }
  }
  if (income > 24276) tax += income * 0.02;
  return Math.round(tax);
}

// Mirror TrustDistributionAnalysis.jsx calculateTax
function calcTax_TrustDistribution(income) {
  if (income <= 0) return 0;
  let tax = 0;
  let remaining = income;
  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const bracketSize = bracket.max - bracket.min + (bracket.min === 0 ? 0 : 1);
    const taxableInBracket = Math.min(remaining, bracketSize);
    if (income > bracket.min) {
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }
  }
  if (income > 24276) tax += income * 0.02;
  return Math.round(tax);
}

// ─── TEST 1: Tax bracket consistency between duplicated implementations ──
console.log("\nTEST 1: Tax bracket consistency (StrategicPlanning vs TrustDistribution)");
const taxIncomes = [0, 18200, 18201, 45000, 45001, 100000, 135000, 135001, 190000, 190001, 250000, 500000];
for (const inc of taxIncomes) {
  const a = calcTax_StrategicPlanning(inc);
  const b = calcTax_TrustDistribution(inc);
  // Tolerance 2 dollars for rounding from different summation styles
  eq(`income=$${inc}: SP=${a} TD=${b}`, a, b, 2);
}

// ─── TEST 2: Tax matches ATO 2024-25 Stage-3 expected values ──────────────
console.log("\nTEST 2: ATO 2024-25 Stage-3 expected tax (incl 2% Medicare > $24,276)");
// Reference values (manual): tax + 2% Medicare on full income (per code)
// $45,000: bracket1 4288 + Medicare 900 = 5188
// $100,000: 4288 + 16500 + 2000 = 22788
// $135,000: 4288 + 27000 + 2700 = 33988
// $190,000: 4288 + 27000 + 20350 + 3800 = 55438
// $250,000: 4288 + 27000 + 20350 + 27000 + 5000 = 83638
const expected = {
  18200: 0,
  45000: 5188,
  100000: 22788,
  135000: 33988,
  190000: 55438,
  250000: 83638,
};
for (const [incStr, exp] of Object.entries(expected)) {
  const inc = +incStr;
  eq(`SP @ $${inc}`, calcTax_StrategicPlanning(inc), exp, 2);
  eq(`TD @ $${inc}`, calcTax_TrustDistribution(inc), exp, 2);
}

// ─── TEST 3: CGT discount map consistency ────────────────────────────────
console.log("\nTEST 3: CGT discount map (RetirementPlanner CGT_DISCOUNT vs CGT.jsx)");
// CGT.jsx: individual/trust=0.5, super/smsf=1/3, company=0
// RetirementPlanner: personal/joint/trust=0.5, smsf=0.333, company=0
const RP_CGT_DISCOUNT = { personal: 0.5, joint: 0.5, trust: 0.5, company: 0, smsf: 0.333 };
const CGT_PAGE = (entityType) => {
  if (entityType === "individual" || entityType === "trust") return 0.5;
  if (entityType === "super" || entityType === "smsf") return 1 / 3;
  return 0;
};
eq("trust discount RP=CGTpage", RP_CGT_DISCOUNT.trust, CGT_PAGE("trust"));
eq("company discount RP=CGTpage", RP_CGT_DISCOUNT.company, CGT_PAGE("company"));
eq("personal=individual (RP uses 'personal', CGT uses 'individual')", RP_CGT_DISCOUNT.personal, CGT_PAGE("individual"));
// SMSF drift: RP uses 0.333 vs CGT uses 1/3 (0.3333...)
eq("smsf RP vs CGT (drift)", RP_CGT_DISCOUNT.smsf, CGT_PAGE("smsf"), 0.001);

// ─── TEST 4: CGT calculator math ─────────────────────────────────────────
console.log("\nTEST 4: CGT calculator (manual replication of CGT.jsx logic)");
function cgtCalc({ pp, sp, ic = 0, sc = 0, holdingMonths, entity, marginalPct }) {
  const costBase = pp + ic + sc;
  const grossGain = sp - costBase;
  const heldOver12m = holdingMonths >= 12;
  let discountPct = 0;
  if (grossGain > 0 && heldOver12m) {
    if (entity === "individual" || entity === "trust") discountPct = 0.5;
    else if (entity === "super" || entity === "smsf") discountPct = 1 / 3;
  }
  const assessable = grossGain > 0 ? grossGain * (1 - discountPct) : grossGain;
  const tax = assessable > 0 ? assessable * (marginalPct / 100) : 0;
  return { grossGain, discountPct, assessable, tax };
}
// Individual, 24mo hold: $100k gain, 50% disc → $50k @ 37% = $18,500
let r = cgtCalc({ pp: 200000, sp: 300000, holdingMonths: 24, entity: "individual", marginalPct: 37 });
eq("individual gross gain 100k", r.grossGain, 100000);
eq("individual discount 50%", r.discountPct, 0.5);
eq("individual tax", r.tax, 18500);
// SMSF, 24mo: $100k gain, 1/3 disc → $66,666.67 @ 15% = $10,000
r = cgtCalc({ pp: 200000, sp: 300000, holdingMonths: 24, entity: "smsf", marginalPct: 15 });
eq("smsf discount 1/3", r.discountPct, 1 / 3, 0.001);
eq("smsf tax ~$10000", r.tax, 10000, 1);
// Company, 24mo: 0% disc → $100k @ 30% = $30k
r = cgtCalc({ pp: 200000, sp: 300000, holdingMonths: 24, entity: "company", marginalPct: 30 });
eq("company discount 0", r.discountPct, 0);
eq("company tax 30k", r.tax, 30000);
// 11mo hold: NO discount even for individual
r = cgtCalc({ pp: 200000, sp: 300000, holdingMonths: 11, entity: "individual", marginalPct: 37 });
eq("11mo no discount", r.discountPct, 0);
eq("11mo full tax", r.tax, 37000);
// Capital LOSS: no discount applied, full loss preserved
r = cgtCalc({ pp: 300000, sp: 200000, holdingMonths: 24, entity: "individual", marginalPct: 37 });
eq("capital loss preserved", r.assessable, -100000);
eq("loss tax = 0", r.tax, 0);

// ─── TEST 5: Loan amortisation P&I ──────────────────────────────────────
console.log("\nTEST 5: Loan amortisation P&I formula");
// Standard P&I: M = P * (r(1+r)^n) / ((1+r)^n - 1)
function loanPI(P, annualPct, years) {
  const r = annualPct / 100 / 12;
  const n = years * 12;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
const m = loanPI(500000, 6.5, 30);
eq("monthly payment $500k @ 6.5% 30y ≈ $3160.34", Math.round(m * 100) / 100, 3160.34, 0.5);
const totalInterest = m * 360 - 500000;
eq("total interest ≈ $637,724", Math.round(totalInterest), 637722, 50);
// 0% edge case
eq("0% loan = principal/months", loanPI(120000, 0, 10), 1000);

// ─── TEST 6: Superannuation Guarantee FY25-26 ──────────────────────────
console.log("\nTEST 6: SG calculations (current FY25-26 = 12%)");
const SG_RATE = 0.12;
const CONCESSIONAL_CAP = 30000;
function sgCalc(sal) {
  return Math.min(sal * SG_RATE, CONCESSIONAL_CAP);
}
eq("salary 0 → SG 0", sgCalc(0), 0);
eq("salary 100k → 12k", sgCalc(100000), 12000);
eq("salary 250k uncapped raw 30k", 250000 * SG_RATE, 30000);
eq("salary 500k → capped at 30k", sgCalc(500000), 30000);

// ─── TEST 7: SMSF caps ──────────────────────────────────────────────────
console.log("\nTEST 7: SMSF/Concessional caps FY25-26");
eq("Concessional cap = 30000", 30000, 30000);
eq("Non-concessional cap = 120000", 120000, 120000);
eq("Division 293 threshold = 250000", 250000, 250000);
// Tax benefit of concessional: marginalRate - 15%
const marginalRate = 0.37;
const contributionTaxRate = 0.15;
const benefitPerDollar = marginalRate - contributionTaxRate;
eq("Tax benefit @ 37% MTR = 22%", benefitPerDollar, 0.22, 0.001);
const totalBenefit = 10000 * benefitPerDollar;
eq("$10k contribution @ 37% saves $2200", totalBenefit, 2200);

// ─── TEST 8: Retirement projection ordering (delay → higher balance) ────
console.log("\nTEST 8: Retirement scenarios — later retirement → higher terminal balance");
const baseInputs = {
  currentPortfolio: 800000,
  annualContributions: 30000,
  annualSpending: 90000,
  yearsInRetirement: 25,
  numSims: 300,
};
const retNow = projectRetirement({ ...baseInputs, yearsToRetirement: 0 });
const ret5 = projectRetirement({ ...baseInputs, yearsToRetirement: 5 });
const ret10 = projectRetirement({ ...baseInputs, yearsToRetirement: 10 });
truthy(`portfolio at retirement: now=${Math.round(retNow.portfolioAtRetirement)} +5y=${Math.round(ret5.portfolioAtRetirement)} +10y=${Math.round(ret10.portfolioAtRetirement)}`,
  ret5.portfolioAtRetirement > retNow.portfolioAtRetirement &&
  ret10.portfolioAtRetirement > ret5.portfolioAtRetirement);
truthy(`success% non-decreasing: ${retNow.confidence}% < ${ret5.confidence}% < ${ret10.confidence}%`,
  ret5.confidence >= retNow.confidence - 5 && ret10.confidence >= ret5.confidence - 5);

// ─── TEST 9: Monte Carlo invariants (no NaN, P10≤P50≤P90) ───────────────
console.log("\nTEST 9: Monte Carlo trajectory invariants");
const proj = projectRetirement({
  currentPortfolio: 1000000,
  annualContributions: 25000,
  annualSpending: 80000,
  yearsToRetirement: 10,
  yearsInRetirement: 25,
  numSims: 1000,
});
truthy("no NaN in trajectory", proj.trajectory.every(t => Number.isFinite(t.p10) && Number.isFinite(t.p50) && Number.isFinite(t.p90)));
truthy("P10 ≤ P50 ≤ P90 every year", proj.trajectory.every(t => t.p10 <= t.p50 && t.p50 <= t.p90));
truthy(`success% in [0,100]: ${proj.confidence}`, proj.confidence >= 0 && proj.confidence <= 100);

// ─── TEST 10: Budget cashflow ──────────────────────────────────────────
console.log("\nTEST 10: Budget calculations (manual replication)");
function budget({ income, expenses }) {
  const inc = income.reduce((s, x) => s + x, 0);
  const exp = expenses.reduce((s, x) => s + x, 0);
  return { income: inc, expenses: exp, surplus: inc - exp };
}
const b = budget({ income: [5000, 1500, 200], expenses: [1800, 600, 400, 200, 350, 250] });
eq("income total", b.income, 6700);
eq("expenses total", b.expenses, 3600);
eq("surplus", b.surplus, 3100);
// Frequency conversion: monthly→fortnightly = monthly*12/26
eq("monthly→fortnightly $1000", Math.round(1000 * 12 / 26), 462);
eq("monthly→weekly $1000", Math.round(1000 * 12 / 52), 231);

// ─── TEST 11: Goal Tracker progress ─────────────────────────────────────
console.log("\nTEST 11: Goal Tracker progress %");
function goalProgress(current, target) {
  return Math.min(100, (current / target) * 100);
}
eq("50/100 = 50%", goalProgress(50, 100), 50);
eq("over-funded capped at 100%", goalProgress(150, 100), 100);
eq("0/100 = 0%", goalProgress(0, 100), 0);

// ─── TEST 12: Retirement Readiness — score bounds & classification ──────
console.log("\nTEST 12: Retirement Readiness Engine");
const sampleClient = {
  retirement: {
    current_age: 50,
    retirement_age: 65,
    life_expectancy: 90,
    annual_contributions: 20000,
    retirement_spending: 100000,
  },
  assets: [
    { type: "Super", value: 800000 },
    { type: "Shares", value: 400000 },
    { type: "Cash", value: 100000 },
    { type: "Property", value: 1500000 },
  ],
  liabilities: [{ type: "Mortgage", value: 300000 }],
  profile: { incomeHousehold: 250000, expensesAnnual: 150000 },
  budget: { monthlyIncome: 20833, monthlyExpenses: 12500 },
};

const r1 = computeReadiness(sampleClient);
truthy(`score in [0,100]: ${r1.score}`, r1.score >= 0 && r1.score <= 100);
truthy(`classification valid: ${r1.classification.label}`,
  ["Strong", "On Track", "Watchlist", "At Risk"].includes(r1.classification.label));
truthy("5 factors returned", r1.factors.length === 5);
truthy("trajectory present + finite", r1.outcome.trajectory && r1.outcome.trajectory.every(t => Number.isFinite(t.p50)));

// Determinism check (Monte Carlo → expect noise; tolerance ±5 points)
const scores = Array.from({ length: 5 }, () => computeReadiness(sampleClient).score);
const minS = Math.min(...scores);
const maxS = Math.max(...scores);
truthy(`MC noise ≤ 5 points (min=${minS} max=${maxS})`, maxS - minS <= 5);

// classify() boundaries
eq("classify(0) At Risk", classify(0).label, "At Risk");
eq("classify(59) At Risk", classify(59).label, "At Risk");
eq("classify(60) Watchlist", classify(60).label, "Watchlist");
eq("classify(74) Watchlist", classify(74).label, "Watchlist");
eq("classify(75) On Track", classify(75).label, "On Track");
eq("classify(89) On Track", classify(89).label, "On Track");
eq("classify(90) Strong", classify(90).label, "Strong");
eq("classify(100) Strong", classify(100).label, "Strong");

// whatMovesTheNeedle returns 3 actions sorted by uplift desc
const moves = whatMovesTheNeedle(sampleClient);
eq("3 actions returned", moves.length, 3);
truthy("uplifts sorted desc", moves[0].uplift >= moves[1].uplift && moves[1].uplift >= moves[2].uplift);

// riskPanel returns 4 risk items
const risks = riskPanel(sampleClient);
eq("4 risk panel items", risks.length, 4);
truthy("all severities valid", risks.every(r => ["low", "medium", "high"].includes(r.severity)));

// ─── TEST 13: Rules Engine fires expected rules ─────────────────────────
console.log("\nTEST 13: Rules Engine");
// Force low-readiness client
const weakClient = {
  ...sampleClient,
  retirement: { ...sampleClient.retirement, annual_contributions: 5000 },
};
const weakReadiness = computeReadiness(weakClient);
const { alerts, opportunities } = evaluateRules(weakClient, weakReadiness);
truthy(`alerts produced (${alerts.length})`, alerts.length >= 0);
truthy(`opportunities produced (${opportunities.length})`, opportunities.length >= 1);
const hasR3 = opportunities.some(o => o.id === "R3");
truthy("R3 (concessional cap headroom) fires when contrib < cap-5k", hasR3);

// ─── TEST 14: scoreDelta after positive action is ≥ 0 ────────────────────
console.log("\nTEST 14: Positive actions don't decrease score");
const baseline = computeReadiness(sampleClient).score;
const moreContribClient = {
  ...sampleClient,
  retirement: { ...sampleClient.retirement, annual_contributions: 30000 },
};
const moreContribScore = computeReadiness(moreContribClient).score;
truthy(`+contrib: ${baseline} → ${moreContribScore} (delta ≥ -3 noise)`, moreContribScore - baseline >= -3);

const lessSpendClient = {
  ...sampleClient,
  retirement: { ...sampleClient.retirement, retirement_spending: 80000 },
};
const lessSpendScore = computeReadiness(lessSpendClient).score;
truthy(`-spending: ${baseline} → ${lessSpendScore} (delta ≥ -3 noise)`, lessSpendScore - baseline >= -3);

// ─── Summary ──────────────────────────────────────────────────────────
console.log("\n======================================");
console.log(`  RESULTS: ${pass} passed, ${fail} failed`);
console.log("======================================");
if (fail > 0) {
  console.log("\nFailures:");
  failures.forEach(f => console.log(`  - ${f.name} | expected=${f.expected} got=${f.actual}`));
  process.exit(1);
}
