// Centralised Australian tax engine — single source of truth across the
// platform for income tax, CGT, negative gearing and trust distribution
// calculations. Encodes the **2026–27 Federal Budget (handed down 12 May 2026)
// "Negative Gearing and CGT Reform" measure** and the **minimum tax on
// discretionary trusts** measure.
//
// Source documents (extracted verbatim — see /app/memory/CHANGELOG.md):
//   • budget.gov.au — Tax explainer: Negative Gearing and Capital Gains Tax Reform
//   • budget.gov.au — Tax explainer: Minimum tax on discretionary trusts
//   • budget.gov.au — Tax explainer: New tax cuts for Australian workers (WATO)
//
// Key dates encoded:
//   ANNOUNCEMENT_DATE  12 May 2026 19:30 AEST — cut-off for CGT/NG grandfathering
//   NG_REFORM_DATE     1 July 2027            — negative gearing reform commences
//   CGT_REFORM_DATE    1 July 2027            — CGT indexation + 30% min tax commences
//   TRUST_REFORM_DATE  1 July 2028            — 30% minimum tax on discretionary trusts

export const ANNOUNCEMENT_DATE = new Date("2026-05-12T19:30:00+10:00");
export const NG_REFORM_DATE    = new Date("2027-07-01T00:00:00+10:00");
export const CGT_REFORM_DATE   = new Date("2027-07-01T00:00:00+10:00");
export const TRUST_REFORM_DATE = new Date("2028-07-01T00:00:00+10:00");

// ---------- Income tax brackets ----------
// ATO 2024–25 (Stage 3 cuts, effective 1 July 2024) — unchanged in the
// 2026–27 Budget. The Budget instead introduces the Working Australians Tax
// Offset (WATO) which is applied AFTER bracket calculation.
export const TAX_BRACKETS = [
  { min: 0,      max: 18200,    rate: 0,    label: "$0 – $18,200" },
  { min: 18201,  max: 45000,    rate: 0.16, label: "$18,201 – $45,000" },
  { min: 45001,  max: 135000,   rate: 0.30, label: "$45,001 – $135,000" },
  { min: 135001, max: 190000,   rate: 0.37, label: "$135,001 – $190,000" },
  { min: 190001, max: Infinity, rate: 0.45, label: "$190,001+" },
];

// Working Australians Tax Offset — from 1 July 2027.
// Up to $250 offset; effective tax-free threshold rises to $19,985.
export const WATO = {
  effectiveFrom: NG_REFORM_DATE,
  maxOffset: 250,
  effectiveTaxFreeThreshold: 19_985,
  withLitoThreshold: 24_985,
};

// $1,000 Instant Tax Deduction — from 2026-27 income year.
export const INSTANT_DEDUCTION = {
  effectiveFromFY: "2026-27",
  amount: 1000,
};

// Medicare Levy thresholds — increased 2.9% from 1 July 2025.
export const MEDICARE_THRESHOLD = 24_276; // single low-income exemption
export const MEDICARE_RATE = 0.02;

// Trust undistributed-income tax rate (top marginal + Medicare).
export const TRUST_UNDISTRIBUTED_RATE = 0.47;

// ---------- Helpers ----------
const _isDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());
const _toDate = (d) => (_isDate(d) ? d : new Date(d));
const _today = () => new Date();

// ============================================================================
//  Income tax
// ============================================================================

/** Returns income tax for an Australian individual (rounded dollars).
 *  Optionally applies the Working Australians Tax Offset when the
 *  reference date is on/after 1 July 2027. */
export const calculateTax = (income, opts = {}) => {
  if (!income || income <= 0) return 0;
  let tax = 0;
  for (const bracket of TAX_BRACKETS) {
    if (income > bracket.min) {
      const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
      tax += Math.max(0, taxableInBracket) * bracket.rate;
    }
  }
  if (income > MEDICARE_THRESHOLD) tax += income * MEDICARE_RATE;
  // Apply WATO if reference date is on/after the WATO start date.
  const refDate = _toDate(opts.refDate || _today());
  if (refDate >= WATO.effectiveFrom) {
    tax = Math.max(0, tax - WATO.maxOffset);
  }
  return Math.round(tax);
};

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

export const getMarginalRate = (income) => {
  for (const bracket of TAX_BRACKETS) {
    if (income >= bracket.min && income <= bracket.max) return bracket.rate;
  }
  return 0;
};

// ============================================================================
//  Capital Gains Tax — 2026–27 Budget reform
// ============================================================================
//
// Pre 1 July 2027 (or assets held at announcement, sold under transitional rules):
//   - 50% discount for individuals held > 12 months
//   - Main residence exempt
//   - Affordable housing: 60% discount
//   - Small business CGT concessions unchanged
//
// Post 1 July 2027:
//   - 50% discount REMOVED
//   - Replaced by cost-base **indexation** plus a **30% minimum tax** on the
//     real capital gain
//   - Exception 1: NEW BUILDS — investor can ELECT 50% discount OR
//     indexation+30% minimum tax (whichever favours them)
//   - Exception 2: Means-tested income-support recipients exempt from min tax
//   - Exception 3: Main residence still exempt
//   - Exception 4: Affordable housing 60% discount retained
//   - Exception 5: Small business CGT concessions unchanged
//   - Exception 6: Pre-1985 gains accrued before 1 July 2027 remain exempt
//
// Transitional (asset bought pre-1 Jul 2027, sold after):
//   - 50% discount applies to gains accrued up to 30 June 2027
//   - Indexation + 30% min tax applies to gains from 1 July 2027 onward
//   - Asset's value at 1 July 2027 = new cost base (apportion or get valuation)

export const CGT_DISCOUNT_PRE_REFORM = 0.50;
export const CGT_AFFORDABLE_HOUSING_DISCOUNT = 0.60;
export const CGT_MIN_TAX_RATE = 0.30;

/** Calculates CGT for an individual disposal under the new regime.
 *
 *  @param {object} args
 *    income            taxable income excluding the gain
 *    costBase          original cost base (before any indexation)
 *    saleProceeds      proceeds of disposal
 *    purchaseDate      Date of acquisition
 *    saleDate          Date of disposal (defaults to today)
 *    propertyType      "new" | "existing" | "non-property" | "affordable"
 *                      | "small-business" | "pre-1985"
 *    isMainResidence   bool — fully exempt if true
 *    isMeansTested     bool — exempt from min tax if true (post-reform)
 *    cumulativeCpi     decimal multiplier for indexation (e.g. 1.07 = 7% CPI
 *                      growth from purchase → sale). Caller provides; defaults
 *                      to 1.0 (no indexation) so unit tests are deterministic.
 *    valueAt1Jul2027   optional override of the cost base at 1 July 2027 for
 *                      transitional assets. Default = pro-rata between
 *                      costBase and saleProceeds by date.
 *    electNewBuildDiscount  bool — for new builds, FORCE the 50% discount path
 *                      instead of indexation+min-tax (default: choose better).
 *
 *  Returns:
 *    { taxableGain, cgtPayable, regime, breakdown }
 */
export const calculateCGT = ({
  income = 0,
  costBase,
  saleProceeds,
  purchaseDate,
  saleDate,
  propertyType = "non-property",
  isMainResidence = false,
  isMeansTested = false,
  cumulativeCpi = 1.0,
  valueAt1Jul2027,
  electNewBuildDiscount,
}) => {
  if (isMainResidence) {
    return { taxableGain: 0, cgtPayable: 0, regime: "main-residence-exempt", breakdown: [] };
  }
  if (propertyType === "pre-1985") {
    return { taxableGain: 0, cgtPayable: 0, regime: "pre-1985-exempt", breakdown: [] };
  }
  if (propertyType === "small-business") {
    // Concessions unchanged. Caller responsible for applying them; here we
    // return the un-discounted gain for visibility.
    const gain = Math.max(0, saleProceeds - costBase);
    return { taxableGain: gain, cgtPayable: 0, regime: "small-business-concessions", breakdown: [{ note: "Apply 15-year/50%/retirement/rollover concessions externally", gain }] };
  }

  const pDate = _toDate(purchaseDate);
  const sDate = _toDate(saleDate || _today());
  const grossGain = Math.max(0, saleProceeds - costBase);
  if (grossGain === 0) {
    return { taxableGain: 0, cgtPayable: 0, regime: "no-gain", breakdown: [] };
  }

  const held12m = (sDate - pDate) / (1000 * 60 * 60 * 24) >= 365;

  // ---------- Path A: pure pre-reform (purchase + sale both pre-1 Jul 2027) ----------
  if (sDate < CGT_REFORM_DATE) {
    const discount = propertyType === "affordable" ? CGT_AFFORDABLE_HOUSING_DISCOUNT : CGT_DISCOUNT_PRE_REFORM;
    const discounted = held12m ? grossGain * (1 - discount) : grossGain;
    const cgt = calculateTax(income + discounted) - calculateTax(income);
    return {
      taxableGain: Math.round(discounted),
      cgtPayable: Math.max(0, Math.round(cgt)),
      regime: "pre-reform-50pc-discount",
      breakdown: [{ portion: "all", grossGain, discount, taxable: discounted }],
    };
  }

  // ---------- Path B: pure post-reform (purchase + sale both post-1 Jul 2027) ----------
  if (pDate >= CGT_REFORM_DATE) {
    // New builds: investor elects whichever path is better
    if (propertyType === "new") {
      const _discount = _pathDiscount(income, grossGain, held12m, isMeansTested);
      const _index    = _pathIndexation(income, costBase, saleProceeds, cumulativeCpi, isMeansTested);
      const elected = electNewBuildDiscount === true ? _discount
                     : electNewBuildDiscount === false ? _index
                     : (_discount.cgtPayable <= _index.cgtPayable ? _discount : _index);
      return { ...elected, regime: `new-build-${elected.regime}` };
    }
    // Affordable housing: 60% discount unchanged
    if (propertyType === "affordable") {
      const discounted = held12m ? grossGain * (1 - CGT_AFFORDABLE_HOUSING_DISCOUNT) : grossGain;
      const cgt = calculateTax(income + discounted, { refDate: sDate }) - calculateTax(income, { refDate: sDate });
      return {
        taxableGain: Math.round(discounted),
        cgtPayable: Math.max(0, Math.round(cgt)),
        regime: "affordable-housing-60pc-discount",
        breakdown: [{ portion: "all", grossGain, discount: CGT_AFFORDABLE_HOUSING_DISCOUNT, taxable: discounted }],
      };
    }
    // Default: indexation + 30% minimum tax
    return _pathIndexation(income, costBase, saleProceeds, cumulativeCpi, isMeansTested, sDate);
  }

  // ---------- Path C: transitional (purchase pre-reform, sale post-reform) ----------
  // 50% discount on gains accrued up to 30 June 2027.
  // Indexation + 30% min tax on gains from 1 July 2027.
  const v2027 = valueAt1Jul2027 ?? _proRataValueAt2027(costBase, saleProceeds, pDate, sDate);
  const preGain = Math.max(0, v2027 - costBase);
  const postGain = Math.max(0, saleProceeds - v2027);

  const preDiscounted = held12m ? preGain * (1 - CGT_DISCOUNT_PRE_REFORM) : preGain;
  const indexedPost = _pathIndexation(income + preDiscounted, v2027, saleProceeds, cumulativeCpi, isMeansTested, sDate);

  const taxableGain = Math.round(preDiscounted + indexedPost.taxableGain);
  // Marginal tax on the pre-reform discounted portion (stack onto already-existing income)
  const cgtOnPre = calculateTax(income + preDiscounted, { refDate: sDate }) - calculateTax(income, { refDate: sDate });
  const cgtPayable = Math.max(0, Math.round(cgtOnPre + indexedPost.cgtPayable));

  return {
    taxableGain,
    cgtPayable,
    regime: "transitional-pre-and-post",
    breakdown: [
      { portion: "pre-1-Jul-2027", grossGain: preGain, discount: CGT_DISCOUNT_PRE_REFORM, taxable: Math.round(preDiscounted), cgt: Math.round(cgtOnPre) },
      { portion: "post-1-Jul-2027", grossGain: postGain, indexedCostBase: Math.round(v2027 * cumulativeCpi), realGain: indexedPost.taxableGain, cgt: indexedPost.cgtPayable },
    ],
  };
};

// Helper: 50% discount path (for new build election)
function _pathDiscount(income, grossGain, held12m, isMeansTested) {
  const discounted = held12m ? grossGain * (1 - CGT_DISCOUNT_PRE_REFORM) : grossGain;
  const cgt = calculateTax(income + discounted) - calculateTax(income);
  return {
    taxableGain: Math.round(discounted),
    cgtPayable: Math.max(0, Math.round(cgt)),
    regime: "discount-50pc",
    breakdown: [{ portion: "all", grossGain, discount: CGT_DISCOUNT_PRE_REFORM, taxable: discounted }],
  };
}

// Helper: indexation + 30% minimum tax path
function _pathIndexation(income, costBase, saleProceeds, cumulativeCpi, isMeansTested, refDate) {
  const indexedCostBase = costBase * (cumulativeCpi || 1);
  const realGain = Math.max(0, saleProceeds - indexedCostBase);
  if (realGain === 0) {
    return { taxableGain: 0, cgtPayable: 0, regime: "indexation-min-tax", breakdown: [{ portion: "all", grossGain: 0, indexedCostBase, realGain: 0 }] };
  }
  // Tax = max(marginal-rate tax on real gain, 30% of real gain), unless means-tested
  const marginalCgt = calculateTax(income + realGain, { refDate }) - calculateTax(income, { refDate });
  const minTax = isMeansTested ? 0 : realGain * CGT_MIN_TAX_RATE;
  const cgt = Math.max(marginalCgt, minTax);
  return {
    taxableGain: Math.round(realGain),
    cgtPayable: Math.max(0, Math.round(cgt)),
    regime: isMeansTested ? "indexation-no-min-tax" : "indexation-min-tax",
    breakdown: [{
      portion: "all",
      indexedCostBase: Math.round(indexedCostBase),
      realGain: Math.round(realGain),
      marginalCgt: Math.round(marginalCgt),
      minTax: Math.round(minTax),
      applied: cgt === minTax ? "30% minimum" : "marginal",
    }],
  };
}

// Helper: linear interpolation of value at 1 July 2027 when no valuation given.
function _proRataValueAt2027(costBase, saleProceeds, pDate, sDate) {
  const totalDays = (sDate - pDate) / (1000 * 60 * 60 * 24);
  if (totalDays <= 0) return costBase;
  const daysToCutover = (CGT_REFORM_DATE - pDate) / (1000 * 60 * 60 * 24);
  const t = Math.max(0, Math.min(1, daysToCutover / totalDays));
  return costBase + (saleProceeds - costBase) * t;
}

// ============================================================================
//  Negative Gearing — 2026–27 Budget reform
// ============================================================================
//
// Rules (residential investment property only):
//
//  Status A — Held at announcement (purchased pre 12 May 2026 19:30 AEST):
//    Full negative gearing retained forever (until sold). Grandfathered.
//
//  Status B — Purchased 12 May 2026 → 30 June 2027:
//    Negative gearing allowed during this period (until 30 June 2027), then
//    losses quarantined from 1 July 2027 (only deductible against residential
//    property income, including capital gains).
//
//  Status C — Purchased from 1 July 2027 onwards:
//    NO negative gearing. Losses immediately quarantined (only deductible
//    against residential property income, including capital gains).
//
//  Status D — NEW BUILDS:
//    Full negative gearing retained, regardless of purchase date.
//
//  Status E — Non-residential investment (commercial, shares, etc.):
//    Unchanged. Full deductibility against all income.

/** Returns negative-gearing status + deductibility rule for a given property.
 *
 *  @returns {object}
 *    status              "A_grandfathered" | "B_transitional" | "C_post_reform" | "D_new_build" | "E_non_residential"
 *    canNegativelyGear   bool (current FY)
 *    quarantined         bool — losses only offset residential income
 *    rationale           plain-English explanation
 */
export const negativeGearingStatus = ({ purchaseDate, propertyType, refDate }) => {
  const ref = _toDate(refDate || _today());
  const pDate = _toDate(purchaseDate);

  if (propertyType !== "new" && propertyType !== "existing") {
    return {
      status: "E_non_residential",
      canNegativelyGear: true,
      quarantined: false,
      rationale: "Non-residential or non-property — negative gearing rules unchanged.",
    };
  }
  if (propertyType === "new") {
    return {
      status: "D_new_build",
      canNegativelyGear: true,
      quarantined: false,
      rationale: "New build — full negative gearing retained against all income (2026–27 Budget incentive).",
    };
  }
  // Existing dwelling — depends on purchase date relative to 12 May 2026 / 1 Jul 2027
  if (pDate < ANNOUNCEMENT_DATE) {
    return {
      status: "A_grandfathered",
      canNegativelyGear: true,
      quarantined: false,
      rationale: "Held at announcement (pre 12 May 2026, 7:30pm AEST) — grandfathered, full negative gearing retained until sold.",
    };
  }
  if (pDate < NG_REFORM_DATE) {
    if (ref < NG_REFORM_DATE) {
      return {
        status: "B_transitional",
        canNegativelyGear: true,
        quarantined: false,
        rationale: "Purchased post-announcement but before 1 July 2027 — negative gearing permitted until 30 June 2027.",
      };
    }
    return {
      status: "B_transitional",
      canNegativelyGear: false,
      quarantined: true,
      rationale: "Purchased post-announcement, now past 1 July 2027 — losses quarantined to residential property income (incl. capital gains).",
    };
  }
  return {
    status: "C_post_reform",
    canNegativelyGear: false,
    quarantined: true,
    rationale: "Purchased on/after 1 July 2027 — no negative gearing. Losses only deductible against residential property income (incl. capital gains).",
  };
};

/** Apply the rental-loss quarantining rules and return the net deduction.
 *
 *  @param {object} args
 *    rentalLoss           positive number = rental expenses - rental income
 *    otherResidentialIncome   rental income from other residential properties + residential capital gains
 *    wageAndSalaryIncome  used only when canNegativelyGear=true
 *    status               object returned by negativeGearingStatus()
 *
 *  @returns
 *    { deductibleNow, carriedForward, appliedAgainstWages }
 */
export const applyRentalLossDeduction = ({ rentalLoss, otherResidentialIncome = 0, status }) => {
  if (!rentalLoss || rentalLoss <= 0) return { deductibleNow: 0, carriedForward: 0, appliedAgainstWages: 0 };
  if (status.canNegativelyGear) {
    return { deductibleNow: rentalLoss, carriedForward: 0, appliedAgainstWages: rentalLoss };
  }
  // Quarantined — only offset other residential income
  const used = Math.min(rentalLoss, Math.max(0, otherResidentialIncome));
  return {
    deductibleNow: used,
    carriedForward: rentalLoss - used,
    appliedAgainstWages: 0,
  };
};

// ============================================================================
//  Discretionary trusts — 30% minimum tax (from 1 July 2028)
// ============================================================================

export const TRUST_MIN_TAX_RATE = 0.30;

/** Minimum tax payable by a discretionary trust on its distributed income.
 *
 *  @param {object} args
 *    distributedIncome     total income distributed to beneficiaries this FY
 *    isCorporateBeneficiary  bool — corporate beneficiaries get NO refund of trust tax
 *    isTestamentaryExisting  bool — testamentary trusts existing at announcement excluded
 *    frankingCreditsAvailable  decimal $ — applied first against minimum tax
 *    refDate                Date — defaults to today; rule only applies post 1 Jul 2028
 *
 *  @returns
 *    { minimumTax, netTrustTax, beneficiaryCredit, regime }
 */
export const calculateTrustMinimumTax = ({
  distributedIncome,
  isCorporateBeneficiary = false,
  isTestamentaryExisting = false,
  frankingCreditsAvailable = 0,
  refDate,
}) => {
  const ref = _toDate(refDate || _today());
  if (ref < TRUST_REFORM_DATE || isTestamentaryExisting || !distributedIncome || distributedIncome <= 0) {
    return { minimumTax: 0, netTrustTax: 0, beneficiaryCredit: 0, regime: "no-min-tax" };
  }
  const grossMin = distributedIncome * TRUST_MIN_TAX_RATE;
  // Trustees must apply franking credits first
  const netTrustTax = Math.max(0, grossMin - Math.max(0, frankingCreditsAvailable));
  return {
    minimumTax: Math.round(grossMin),
    netTrustTax: Math.round(netTrustTax),
    beneficiaryCredit: isCorporateBeneficiary ? 0 : Math.round(netTrustTax),
    regime: isCorporateBeneficiary ? "corporate-no-credit" : "non-refundable-credit",
  };
};
