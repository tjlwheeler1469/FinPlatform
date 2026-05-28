// Shared helpers for the AdviserClientDashboard cards.
export const fmt = (v) => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v || 0}`;
};

// Map a simulation item from the Intelligence Feed into concrete slider
// adjustments for the Live Scenario engine. Pure function, deterministic.
// Returns null if no meaningful mapping exists.
export const mapSimulationToSliders = (sim, current, client) => {
  if (!sim) return null;
  const cat = String(sim.category || "").toLowerCase();
  const headline = String(sim.headline || "").toLowerCase();
  const next = { ...current };

  // 1) Portfolio / rebalance — pull volatility down toward Balanced (12σ)
  if (cat.includes("portfolio") || /rebalance|allocation|drift|equity/.test(headline)) {
    next.volatility = Math.max(8, Math.min(current.volatility, 12));
  }

  // 2) Contributions / super
  if (cat.includes("super") || cat.includes("contribution") || /contribut|salary sacrific|concessional/.test(headline)) {
    const yearsToRet = Math.max(1, current.retireAge - client.profile.age);
    const inferredYearly = Number.isFinite(sim.financialImpact)
      ? Math.max(5_000, Math.round(Math.abs(sim.financialImpact) / yearsToRet / 1000) * 1000)
      : 15_000;
    next.annualContrib = Math.min(300_000, current.annualContrib + inferredYearly);
  }

  // 3) Tax savings → contributions
  if (cat.includes("tax") || /tax|cgt|deduction|harvesting/.test(headline)) {
    const yearsToRet = Math.max(1, current.retireAge - client.profile.age);
    const inferred = Number.isFinite(sim.financialImpact)
      ? Math.max(2_000, Math.round(Math.abs(sim.financialImpact) / yearsToRet / 1000) * 1000)
      : 5_000;
    next.annualContrib = Math.min(300_000, current.annualContrib + inferred);
  }

  // 4) Spending trim
  if (cat.includes("spend") || /budget|expense|drift|spending/.test(headline)) {
    next.annualSpend = Math.max(50_000, Math.round(current.annualSpend * 0.94));
  }

  // 5) Retirement timing — delay by 2 years to test sequencing buffer
  if (/sequenc|retirement age|delay|defer/.test(headline) || cat.includes("retirement")) {
    next.retireAge = Math.min(75, current.retireAge + 2);
  }

  // Default to contribution boost if nothing matched but the strategy is positive.
  if (
    next.retireAge === current.retireAge &&
    next.annualSpend === current.annualSpend &&
    next.annualContrib === current.annualContrib &&
    next.volatility === current.volatility &&
    Number.isFinite(sim.financialImpact) && sim.financialImpact > 0
  ) {
    const yearsToRet = Math.max(1, current.retireAge - client.profile.age);
    next.annualContrib = Math.min(300_000, current.annualContrib + Math.max(5_000, Math.round(sim.financialImpact / yearsToRet / 1000) * 1000));
  }

  return next;
};
