// Centralised Australian tax engine — single source of truth for tax bracket
// calculations across the platform. All consumer pages must import from here
// rather than defining their own brackets, so updates only need to happen in
// one file when ATO thresholds change.
//
// Source: ATO 2024–25 (Stage 3 cuts, effective 1 July 2024).

export const TAX_BRACKETS = [
  { min: 0,      max: 18200,    rate: 0,    label: "$0 – $18,200" },
  { min: 18201,  max: 45000,    rate: 0.16, label: "$18,201 – $45,000" },
  { min: 45001,  max: 135000,   rate: 0.30, label: "$45,001 – $135,000" },
  { min: 135001, max: 190000,   rate: 0.37, label: "$135,001 – $190,000" },
  { min: 190001, max: Infinity, rate: 0.45, label: "$190,001+" },
];

// Medicare Levy — 2% above the threshold (low-income offset shading
// is intentionally simplified for high-income adviser clients).
export const MEDICARE_THRESHOLD = 24_276;
export const MEDICARE_RATE = 0.02;

// Australian Trust undistributed-income tax rate (highest marginal + Medicare).
export const TRUST_UNDISTRIBUTED_RATE = 0.47;

/**
 * Calculate total income tax for an Australian individual.
 * Returns rounded dollars.
 */
export const calculateTax = (income) => {
  if (!income || income <= 0) return 0;
  let tax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income > bracket.min) {
      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      tax += Math.max(0, taxableInBracket) * bracket.rate;
    }
  }
  if (income > MEDICARE_THRESHOLD) tax += income * MEDICARE_RATE;
  return Math.round(tax);
};

/**
 * Per-bracket breakdown of how much tax the given income contributes.
 * Used by detail tables / reporting.
 */
export const getTaxBreakdown = (income) => {
  const breakdown = [];
  if (!income || income <= 0) return breakdown;
  for (const bracket of TAX_BRACKETS) {
    if (income <= bracket.min) break;
    const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
    if (taxableInBracket > 0) {
      breakdown.push({
        ...bracket,
        taxable: Math.round(taxableInBracket),
        tax: Math.round(taxableInBracket * bracket.rate),
      });
    }
  }
  return breakdown;
};

/**
 * Marginal tax rate for the next dollar earned at this income.
 */
export const getMarginalRate = (income) => {
  for (const bracket of TAX_BRACKETS) {
    if (income >= bracket.min && income <= bracket.max) return bracket.rate;
  }
  return 0;
};
