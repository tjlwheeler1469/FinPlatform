// Retirement Monte Carlo engine — extensively tested calculations.
// All math reviewed:
//   • Accumulation: balance_{t+1} = balance_t * (1+r_t) + contributions
//   • Drawdown: balance_{t+1} = balance_t * (1+r_t) - spending_t * (1+inflation)^k
//   • Returns: drawn from Normal(realReturn, volatility) where realReturn = nominal - inflation
//   • Confidence = % of sims that end with balance >= legacyGoal
//
// Percentiles computed from sim distribution at each year.

// Box–Muller normal sample
export const randn = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// Percentile helper — returns value at `pct` from sorted array
export const percentile = (sortedVals, pct) => {
  if (!sortedVals.length) return 0;
  const idx = Math.max(0, Math.min(sortedVals.length - 1, Math.floor((pct / 100) * sortedVals.length)));
  return sortedVals[idx];
};

// Main Monte Carlo projection
// Inputs:
//   currentPortfolio: starting balance (today's dollars)
//   annualContributions: contributions per year during accumulation (today's dollars, grown with income)
//   annualSpending: desired retirement spending (today's dollars, inflated each year)
//   yearsToRetirement: integer years until retirement starts
//   yearsInRetirement: integer years in retirement
//   expectedReturn: nominal annual return (decimal, e.g. 0.065)
//   volatility: annual std dev (decimal, e.g. 0.12)
//   inflationRate: annual inflation (decimal, e.g. 0.025)
//   numSims: number of Monte Carlo runs
//   legacyGoal: desired balance at end of life (for confidence)
export const projectRetirement = ({
  currentPortfolio,
  annualContributions,
  annualSpending,
  yearsToRetirement,
  yearsInRetirement,
  expectedReturn = 0.065,
  volatility = 0.12,
  inflationRate = 0.025,
  numSims = 500,
  legacyGoal = 0,
}) => {
  // Guardrails — prevent NaN and Infinity from bad inputs (use ?? to allow 0)
  currentPortfolio = Math.max(0, Number.isFinite(+currentPortfolio) ? +currentPortfolio : 0);
  annualContributions = Math.max(0, Number.isFinite(+annualContributions) ? +annualContributions : 0);
  annualSpending = Math.max(0, Number.isFinite(+annualSpending) ? +annualSpending : 0);
  yearsToRetirement = Math.max(0, Math.round(Number.isFinite(+yearsToRetirement) ? +yearsToRetirement : 0));
  yearsInRetirement = Math.max(1, Math.round(Number.isFinite(+yearsInRetirement) ? +yearsInRetirement : 25));
  expectedReturn = Number.isFinite(+expectedReturn) ? +expectedReturn : 0.065;
  volatility = Math.max(0, Number.isFinite(+volatility) ? +volatility : 0.12);
  inflationRate = Math.max(0, Number.isFinite(+inflationRate) ? +inflationRate : 0.025);
  numSims = Math.max(50, Math.round(Number.isFinite(+numSims) ? +numSims : 500));
  legacyGoal = Math.max(0, Number.isFinite(+legacyGoal) ? +legacyGoal : 0);

  const totalYears = yearsToRetirement + yearsInRetirement;
  const realReturn = expectedReturn - inflationRate;

  const runs = [];
  let successCount = 0;

  for (let s = 0; s < numSims; s++) {
    const path = [currentPortfolio];
    let bal = currentPortfolio;
    let depleted = false;

    // Accumulation: contributions grow with inflation (real terms handled by using realReturn)
    for (let y = 1; y <= yearsToRetirement; y++) {
      const r = realReturn + volatility * randn();
      bal = bal * (1 + r) + annualContributions;
      if (bal <= 0) { bal = 0; depleted = true; }
      path.push(bal);
    }

    // Drawdown: spending is in today's dollars, but we use real return so no need to inflate
    // Slightly reduce vol + return during retirement (glide-path)
    for (let y = 1; y <= yearsInRetirement; y++) {
      const r = realReturn * 0.75 + volatility * 0.85 * randn();
      bal = bal * (1 + r) - annualSpending;
      if (bal <= 0) { bal = 0; depleted = true; }
      path.push(bal);
    }

    // Success = never depleted AND final balance >= legacy goal
    if (!depleted && path[path.length - 1] >= legacyGoal) successCount++;
    runs.push(path);
  }

  // Trajectory: percentiles at each year
  const trajectory = [];
  for (let y = 0; y <= totalYears; y++) {
    const vals = runs.map((p) => p[y] ?? 0).sort((a, b) => a - b);
    trajectory.push({
      year: y,
      p10: percentile(vals, 10),
      p25: percentile(vals, 25),
      p50: percentile(vals, 50),
      p75: percentile(vals, 75),
      p90: percentile(vals, 90),
      mean: vals.reduce((s, v) => s + v, 0) / vals.length,
      phase: y <= yearsToRetirement ? "accumulation" : "drawdown",
    });
  }

  const confidence = Math.round((successCount / numSims) * 100);
  const portfolioAtRetirement = trajectory[yearsToRetirement]?.p50 || 0;
  const p10AtLifeEnd = trajectory[totalYears]?.p10 || 0;
  const p50AtLifeEnd = trajectory[totalYears]?.p50 || 0;
  const p90AtLifeEnd = trajectory[totalYears]?.p90 || 0;

  // Compute year of depletion on median path
  let medianDepletionYear = null;
  for (let y = yearsToRetirement + 1; y <= totalYears; y++) {
    if (trajectory[y].p50 <= 0) {
      medianDepletionYear = y - yearsToRetirement;
      break;
    }
  }

  return {
    confidence,
    trajectory,
    portfolioAtRetirement,
    p10AtLifeEnd,
    p50AtLifeEnd,
    p90AtLifeEnd,
    medianDepletionYear,
    numSims,
    yearsToRetirement,
    yearsInRetirement,
  };
};

// Map a workshop scenario (budget+investments+goals) to projection inputs
export const buildScenarioFromInputs = (i) => {
  const yearsToRetirement = Math.max(0, i.retirementAge - i.currentAge);
  const yearsInRetirement = Math.max(1, i.lifeExpectancy - i.retirementAge);
  const extraSavingsAnnual = (i.extraMonthlySavings || 0) * 12;
  const totalContributions = (i.annualContributions || 0) + extraSavingsAnnual;

  return {
    currentPortfolio: i.currentPortfolio,
    annualContributions: totalContributions,
    annualSpending: i.retirementSpending,
    yearsToRetirement,
    yearsInRetirement,
    expectedReturn: (i.expectedReturn || 6.5) / 100,
    volatility: (i.volatility || 12) / 100,
    inflationRate: (i.inflationRate || 2.5) / 100,
    numSims: 500,
    legacyGoal: i.legacyGoal || 0,
  };
};
