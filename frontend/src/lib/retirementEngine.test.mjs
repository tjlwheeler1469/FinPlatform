// Unit tests for retirementEngine — verifies mathematical correctness.
// Run via: node retirementEngine.test.mjs

import { projectRetirement, buildScenarioFromInputs, percentile } from "./retirementEngine.js";

let passed = 0;
let failed = 0;

const assert = (cond, msg) => {
  if (cond) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
};

const approx = (a, b, tol = 0.01) => Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1);

// ============ TEST 1: Percentile helper ============
console.log("\nTEST 1: percentile helper");
{
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert(percentile(arr, 50) === 6, "p50 of 1-10 = 6");
  assert(percentile(arr, 10) === 2, "p10 of 1-10 = 2");
  assert(percentile(arr, 90) === 10, "p90 of 1-10 = 10");
  assert(percentile([], 50) === 0, "empty array returns 0");
}

// ============ TEST 2: Basic projection — strong plan ============
console.log("\nTEST 2: Strong retirement plan (should have >90% confidence)");
{
  // 45yo, $1M portfolio, $50k/yr contributions, retire at 65, spend $60k/yr
  // Real return ~4%, 20 years accumulation. Math check:
  // FV = 1M * 1.04^20 + 50k * ((1.04^20 - 1)/0.04) = ~2.19M + ~1.49M = ~3.68M
  // Annual drawdown 4% = $147k/yr, spending only $60k → should last indefinitely
  const r = projectRetirement({
    currentPortfolio: 1_000_000,
    annualContributions: 50_000,
    annualSpending: 60_000,
    yearsToRetirement: 20,
    yearsInRetirement: 25,
    expectedReturn: 0.07,
    volatility: 0.12,
    inflationRate: 0.025,
    numSims: 1000,
  });
  assert(r.confidence >= 85, `confidence ${r.confidence}% should be >= 85%`);
  assert(r.portfolioAtRetirement > 2_000_000, `portfolioAtRetirement ${r.portfolioAtRetirement.toFixed(0)} should be > $2M`);
  assert(r.trajectory.length === 46, `trajectory length ${r.trajectory.length} = 46 (0..45)`);
}

// ============ TEST 3: Weak plan — should have <50% confidence ============
console.log("\nTEST 3: Weak plan (should have <50% confidence)");
{
  // 45yo, $100k portfolio, $10k/yr contrib, retire at 55, spend $80k/yr for 35 years
  // Math: FV at retirement ~$220k. Spending $80k/yr → depletes in ~3yrs
  const r = projectRetirement({
    currentPortfolio: 100_000,
    annualContributions: 10_000,
    annualSpending: 80_000,
    yearsToRetirement: 10,
    yearsInRetirement: 35,
    expectedReturn: 0.06,
    volatility: 0.12,
    inflationRate: 0.025,
    numSims: 1000,
  });
  assert(r.confidence < 20, `confidence ${r.confidence}% should be < 20%`);
  assert(r.medianDepletionYear !== null && r.medianDepletionYear < 10, `median depletion year ${r.medianDepletionYear} should be < 10`);
}

// ============ TEST 4: Monotonicity — more contributions = higher confidence ============
console.log("\nTEST 4: Monotonicity (more contributions → higher confidence)");
{
  const baseInputs = {
    currentPortfolio: 500_000,
    annualSpending: 70_000,
    yearsToRetirement: 15,
    yearsInRetirement: 25,
    expectedReturn: 0.065,
    volatility: 0.12,
    inflationRate: 0.025,
    numSims: 1000,
  };
  const low = projectRetirement({ ...baseInputs, annualContributions: 10_000 });
  const mid = projectRetirement({ ...baseInputs, annualContributions: 30_000 });
  const high = projectRetirement({ ...baseInputs, annualContributions: 80_000 });
  assert(low.confidence < mid.confidence, `low ${low.confidence}% < mid ${mid.confidence}%`);
  assert(mid.confidence < high.confidence, `mid ${mid.confidence}% < high ${high.confidence}%`);
  assert(low.portfolioAtRetirement < mid.portfolioAtRetirement, `low portfolio < mid portfolio`);
  assert(mid.portfolioAtRetirement < high.portfolioAtRetirement, `mid portfolio < high portfolio`);
}

// ============ TEST 5: Monotonicity — more spending = lower confidence ============
console.log("\nTEST 5: Monotonicity (more spending → lower confidence)");
{
  const baseInputs = {
    currentPortfolio: 800_000,
    annualContributions: 30_000,
    yearsToRetirement: 15,
    yearsInRetirement: 25,
    expectedReturn: 0.065,
    volatility: 0.12,
    inflationRate: 0.025,
    numSims: 1000,
  };
  const low = projectRetirement({ ...baseInputs, annualSpending: 40_000 });
  const high = projectRetirement({ ...baseInputs, annualSpending: 120_000 });
  assert(low.confidence > high.confidence, `low-spend ${low.confidence}% > high-spend ${high.confidence}%`);
}

// ============ TEST 6: Deterministic check with zero volatility ============
console.log("\nTEST 6: Zero volatility → deterministic (P10 == P50 == P90)");
{
  const r = projectRetirement({
    currentPortfolio: 500_000,
    annualContributions: 30_000,
    annualSpending: 50_000,
    yearsToRetirement: 10,
    yearsInRetirement: 20,
    expectedReturn: 0.06,
    volatility: 0.0,   // NO randomness
    inflationRate: 0.025,
    numSims: 100,
  });
  // With zero volatility, all sims equal → P10 == P50 == P90
  const mid = r.trajectory[5];
  assert(approx(mid.p10, mid.p50) && approx(mid.p50, mid.p90), `zero vol: p10 ${mid.p10.toFixed(0)} ≈ p50 ${mid.p50.toFixed(0)} ≈ p90 ${mid.p90.toFixed(0)}`);

  // Check FV formula: balance at retirement with realReturn=3.5%
  // FV = 500k*1.035^10 + 30k*((1.035^10-1)/0.035) = ~705k + ~352k = ~1.057M
  const portfolioAtRet = r.portfolioAtRetirement;
  assert(portfolioAtRet > 1_000_000 && portfolioAtRet < 1_150_000, `zero-vol portfolio at retirement ~$1.05M, got ${portfolioAtRet.toFixed(0)}`);
}

// ============ TEST 7: Input guardrails (negative values) ============
console.log("\nTEST 7: Input guardrails (negative/invalid inputs)");
{
  const r = projectRetirement({
    currentPortfolio: -100_000,  // negative
    annualContributions: NaN,
    annualSpending: 50_000,
    yearsToRetirement: -5,  // negative
    yearsInRetirement: 0,
    expectedReturn: 0.06,
    volatility: 0.1,
    numSims: 100,
  });
  assert(r.confidence >= 0 && r.confidence <= 100, `confidence ${r.confidence} in [0,100]`);
  assert(!isNaN(r.portfolioAtRetirement), `portfolioAtRetirement not NaN`);
  assert(r.trajectory.every((t) => !isNaN(t.p50)), `no NaN in trajectory`);
}

// ============ TEST 8: buildScenarioFromInputs ============
console.log("\nTEST 8: buildScenarioFromInputs mapping");
{
  const inputs = {
    currentAge: 50,
    retirementAge: 67,
    lifeExpectancy: 92,
    monthlyIncome: 10000,
    monthlyExpenses: 6000,
    extraMonthlySavings: 500,
    currentPortfolio: 1_500_000,
    annualContributions: 120_000,
    expectedReturn: 6.5,
    volatility: 12,
    inflationRate: 2.5,
    retirementSpending: 180_000,
    legacyGoal: 0,
  };
  const mapped = buildScenarioFromInputs(inputs);
  assert(mapped.yearsToRetirement === 17, `yearsToRetirement ${mapped.yearsToRetirement} = 17`);
  assert(mapped.yearsInRetirement === 25, `yearsInRetirement ${mapped.yearsInRetirement} = 25`);
  assert(mapped.annualContributions === 120_000 + 500 * 12, `contributions include extra savings: ${mapped.annualContributions}`);
  assert(approx(mapped.expectedReturn, 0.065), `expectedReturn 0.065`);
  assert(approx(mapped.volatility, 0.12), `volatility 0.12`);
}

// ============ TEST 9: Trajectory length + phase markers ============
console.log("\nTEST 9: Trajectory length and phase consistency");
{
  const r = projectRetirement({
    currentPortfolio: 500_000,
    annualContributions: 25_000,
    annualSpending: 60_000,
    yearsToRetirement: 10,
    yearsInRetirement: 25,
    expectedReturn: 0.06,
    volatility: 0.1,
    numSims: 200,
  });
  assert(r.trajectory.length === 36, `trajectory length ${r.trajectory.length} = 36 (0..35)`);
  assert(r.trajectory[0].phase === "accumulation" && r.trajectory[5].phase === "accumulation", `years 0-10 accumulation`);
  assert(r.trajectory[11].phase === "drawdown" && r.trajectory[35].phase === "drawdown", `years 11+ drawdown`);
  assert(r.trajectory[0].p50 === 500_000, `year 0 p50 = starting portfolio`);
}

// ============ TEST 10: Percentile ordering (p10 <= p50 <= p90) ============
console.log("\nTEST 10: Percentile ordering");
{
  const r = projectRetirement({
    currentPortfolio: 800_000,
    annualContributions: 40_000,
    annualSpending: 70_000,
    yearsToRetirement: 15,
    yearsInRetirement: 20,
    expectedReturn: 0.07,
    volatility: 0.15,
    numSims: 1000,
  });
  for (let y = 0; y < r.trajectory.length; y++) {
    const t = r.trajectory[y];
    if (!(t.p10 <= t.p50 && t.p50 <= t.p90)) {
      console.error(`Year ${y}: p10=${t.p10}, p50=${t.p50}, p90=${t.p90}`);
      failed++;
      break;
    }
  }
  assert(r.trajectory.every((t) => t.p10 <= t.p50 && t.p50 <= t.p90), `p10 ≤ p50 ≤ p90 at every year`);
}

// ============ SUMMARY ============
console.log(`\n======================================`);
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log(`======================================\n`);
if (failed > 0) process.exit(1);
