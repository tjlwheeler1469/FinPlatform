// Input clamping helpers — guard every numeric `+e.target.value` from
// adviser input fields against:
//   - NaN / non-finite numbers (paste of "abc")
//   - Absurd magnitudes (Number.MAX_SAFE_INTEGER, accidental keyboard-mash)
//   - Negative values where they don't make sense (income, expenses, age)
//   - Values that would overflow Monte Carlo math
//
// All bounds expressed in *human* units (per-month dollars, per-year dollars,
// years, %). Each field on the Retirement Workshop / Household Budget /
// Scenario Comparison screens MUST go through these clamps.
//
// We also expose a stable currency-compact formatter so a $1 quintillion
// surplus never line-wraps a comparison table cell.

export const FIELD_BOUNDS = {
  // Cash-flow ($ per month)
  monthlyIncome:        { min: 0, max: 5_000_000, step: 1, default: 0 },
  monthlyExpenses:      { min: 0, max: 5_000_000, step: 1, default: 0 },
  extraMonthlySavings:  { min: 0, max: 1_000_000, step: 1, default: 0 },

  // Portfolio + contributions ($)
  currentPortfolio:     { min: 0, max: 1_000_000_000,   step: 1, default: 0 },
  annualContributions:  { min: 0, max:    5_000_000,    step: 1, default: 0 },
  retirementSpending:   { min: 0, max:    5_000_000,    step: 1, default: 0 },
  legacyGoal:           { min: 0, max:  100_000_000,    step: 1, default: 0 },

  // Ages / years
  currentAge:    { min: 0, max: 120, step: 1, default: 30 },
  retirementAge: { min: 0, max: 120, step: 1, default: 65 },
  lifeExpectancy:{ min: 0, max: 130, step: 1, default: 90 },

  // Rates (whole percent)
  expectedReturn: { min: 0, max: 25, step: 0.1, default: 6.5 },
  volatility:     { min: 0, max: 50, step: 0.1, default: 12 },
  inflationRate:  { min: 0, max: 25, step: 0.1, default: 2.5 },
};

// Generic numeric clamp — handles any browser input (including pasted strings).
// Returns the field's `default` when the input is empty or unparseable.
export const clampField = (rawValue, fieldKey) => {
  const b = FIELD_BOUNDS[fieldKey];
  if (!b) {
    // Unknown field — fall back to a finite-number guard.
    const n = Number(rawValue);
    return Number.isFinite(n) ? n : 0;
  }
  if (rawValue === "" || rawValue === null || rawValue === undefined) return b.default;
  // Strip everything that's not a digit, sign, or dot. Avoids HTML5 number
  // input letting "1e308" through or paste of "$1,000,000".
  const cleaned = String(rawValue).replace(/[^\d.\-]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return b.default;
  if (n < b.min) return b.min;
  if (n > b.max) return b.max;
  // Snap to step for integer-only fields, keep precision for decimals.
  return b.step === 1 ? Math.round(n) : n;
};

// Convenience wrapper for the common React idiom:
//   onChange={(e) => update({ field: clampInput(e.target.value, "field") })}
export const clampInput = clampField;

// Compact currency formatter — never line-wraps a table cell.
// $1 → "$1"
// $1,234 → "$1,234"
// $1,234,567 → "$1.23M"
// $9.61e9 → "$9.61B"
// $1e15 → "$1.00Q"  (quadrillion, mostly to flag bad data)
export const fmtCurrencyCompact = (value) => {
  if (!Number.isFinite(value)) return "$—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e15) return `${sign}$${(value / 1e15).toFixed(2)}Q`;
  if (abs >= 1e12) return `${sign}$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${sign}$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${sign}$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `${sign}$${(value / 1e3).toFixed(1)}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

// Detail formatter — full digits with grouping, used inline in narratives.
export const fmtCurrencyFull = (value) => {
  if (!Number.isFinite(value)) return "$—";
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.round(Math.abs(value)).toLocaleString()}`;
};
