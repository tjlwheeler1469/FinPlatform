// 2026–27 Budget Tax Engine — comprehensive correctness test.
// Run: node /app/frontend/src/lib/auTax.test.mjs
//
// Validates every rule in /app/frontend/src/lib/auTax.js against the verbatim
// policy text extracted from budget.gov.au. Each section is labelled with its
// source paragraph so future auditors can trace the assertion.

import assert from "node:assert/strict";
import {
  TAX_BRACKETS, WATO, ANNOUNCEMENT_DATE, NG_REFORM_DATE, CGT_REFORM_DATE, TRUST_REFORM_DATE,
  CGT_DISCOUNT_PRE_REFORM, CGT_AFFORDABLE_HOUSING_DISCOUNT, CGT_MIN_TAX_RATE, TRUST_MIN_TAX_RATE,
  calculateTax, getMarginalRate, calculateCGT, negativeGearingStatus,
  applyRentalLossDeduction, calculateTrustMinimumTax,
} from "./auTax.js";

let passed = 0, failed = 0;
const t = (name, fn) => {
  try { fn(); console.log("✓", name); passed++; }
  catch (e) { console.log("✗", name, "\n   ", e.message); failed++; }
};

// ---------- Income tax + WATO ----------
t("Stage-3 brackets: $0 → no tax", () => assert.equal(calculateTax(0), 0));
t("Income $50k → 16% on $26,800 + 30% on $5,000 = $5,788 + Medicare", () => {
  const expected = Math.round(26_800 * 0.16 + 5_000 * 0.30 + 50_000 * 0.02);
  assert.equal(calculateTax(50_000, { refDate: new Date("2026-04-01") }), expected);
});
t("WATO not applied pre 1 Jul 2027", () => {
  const pre = calculateTax(60_000, { refDate: new Date("2027-06-30") });
  const post = calculateTax(60_000, { refDate: new Date("2027-07-01") });
  assert.equal(post, pre - WATO.maxOffset);
});
t("WATO max $250 offset post 1 Jul 2027", () => {
  // High income gets full $250 offset
  const pre = calculateTax(200_000, { refDate: new Date("2027-06-30") });
  const post = calculateTax(200_000, { refDate: new Date("2027-07-01") });
  assert.equal(pre - post, 250);
});

// ---------- CGT Path A: pre-reform ----------
t("Pre-reform: held > 12m gets 50% discount", () => {
  const r = calculateCGT({
    income: 100_000, costBase: 200_000, saleProceeds: 400_000,
    purchaseDate: "2018-01-01", saleDate: "2025-01-01", propertyType: "existing",
  });
  assert.equal(r.regime, "pre-reform-50pc-discount");
  assert.equal(r.taxableGain, 100_000); // (400-200) * 50% = 100k discounted
});
t("Main residence always exempt", () => {
  const r = calculateCGT({
    costBase: 500_000, saleProceeds: 2_000_000,
    purchaseDate: "2010-01-01", saleDate: "2030-01-01",
    propertyType: "existing", isMainResidence: true,
  });
  assert.equal(r.cgtPayable, 0);
  assert.equal(r.regime, "main-residence-exempt");
});
t("Pre-1985 assets exempt", () => {
  const r = calculateCGT({
    costBase: 50_000, saleProceeds: 500_000,
    purchaseDate: "1984-01-01", saleDate: "2030-01-01",
    propertyType: "pre-1985",
  });
  assert.equal(r.cgtPayable, 0);
});

// ---------- CGT Path B: post-reform indexation + 30% min tax ----------
t("Post-reform existing: indexation removes inflation portion", () => {
  // Buy $500k, sell $800k after 1 Jul 2027 with 20% cumulative CPI.
  // Indexed cost base = 500k * 1.20 = 600k. Real gain = 800 - 600 = 200k.
  const r = calculateCGT({
    income: 100_000, costBase: 500_000, saleProceeds: 800_000,
    purchaseDate: "2027-08-01", saleDate: "2030-08-01",
    propertyType: "existing", cumulativeCpi: 1.20,
  });
  assert.equal(r.taxableGain, 200_000);
  // 30% of 200k = 60k min tax (vs marginal which is also high here)
  assert.ok(r.cgtPayable >= 60_000, `expected ≥ $60k, got ${r.cgtPayable}`);
});

t("Post-reform new build elects whichever path is cheaper", () => {
  // Big gain, low income → 50% discount likely beats 30% min tax
  const r = calculateCGT({
    income: 50_000, costBase: 500_000, saleProceeds: 1_500_000,
    purchaseDate: "2028-01-01", saleDate: "2033-01-01",
    propertyType: "new", cumulativeCpi: 1.10,
  });
  assert.ok(r.regime.startsWith("new-build-"), `regime=${r.regime}`);
  // Check it's actually the cheaper of the two
  const forcedDiscount = calculateCGT({
    income: 50_000, costBase: 500_000, saleProceeds: 1_500_000,
    purchaseDate: "2028-01-01", saleDate: "2033-01-01",
    propertyType: "new", cumulativeCpi: 1.10, electNewBuildDiscount: true,
  });
  const forcedIndex = calculateCGT({
    income: 50_000, costBase: 500_000, saleProceeds: 1_500_000,
    purchaseDate: "2028-01-01", saleDate: "2033-01-01",
    propertyType: "new", cumulativeCpi: 1.10, electNewBuildDiscount: false,
  });
  assert.ok(r.cgtPayable <= forcedDiscount.cgtPayable);
  assert.ok(r.cgtPayable <= forcedIndex.cgtPayable);
});

t("Affordable housing: 60% discount retained post-reform", () => {
  const r = calculateCGT({
    income: 100_000, costBase: 500_000, saleProceeds: 1_000_000,
    purchaseDate: "2028-01-01", saleDate: "2033-01-01",
    propertyType: "affordable",
  });
  assert.equal(r.regime, "affordable-housing-60pc-discount");
  assert.equal(r.taxableGain, 200_000); // 500k * 40% = 200k taxable
});

t("Means-tested recipient exempt from 30% min tax", () => {
  // Low income, small gain: marginal tax would be well below 30%.
  // Means-tested taxpayer should pay marginal only (NOT the 30% floor).
  const r = calculateCGT({
    income: 20_000, costBase: 100_000, saleProceeds: 200_000,
    purchaseDate: "2028-01-01", saleDate: "2033-01-01",
    propertyType: "existing", cumulativeCpi: 1.0, isMeansTested: true,
  });
  // Real gain $100k; marginal-only tax on $20k + $100k vs $20k base = a low effective rate
  const minTax30 = 100_000 * 0.30; // $30k
  assert.ok(r.cgtPayable < minTax30, `Should bypass min tax: got ${r.cgtPayable} vs ${minTax30}`);
  assert.equal(r.regime, "indexation-no-min-tax");
});

// ---------- CGT Path C: transitional ----------
t("Transitional: pre-2027 portion 50% discount, post-2027 portion indexed", () => {
  const r = calculateCGT({
    income: 100_000, costBase: 500_000, saleProceeds: 1_000_000,
    purchaseDate: "2020-07-01", saleDate: "2030-07-01",
    propertyType: "existing", cumulativeCpi: 1.05,
  });
  assert.equal(r.regime, "transitional-pre-and-post");
  assert.equal(r.breakdown.length, 2);
  assert.equal(r.breakdown[0].portion, "pre-1-Jul-2027");
  assert.equal(r.breakdown[1].portion, "post-1-Jul-2027");
});

// ---------- Negative gearing ----------
t("NG Status A: held at announcement → grandfathered forever", () => {
  const s = negativeGearingStatus({ purchaseDate: "2024-01-01", propertyType: "existing", refDate: "2030-01-01" });
  assert.equal(s.status, "A_grandfathered");
  assert.ok(s.canNegativelyGear);
});
t("NG Status B: purchased post-announcement, pre 1 Jul 2027 → NG until 30 Jun 2027 then quarantined", () => {
  const before = negativeGearingStatus({ purchaseDate: "2026-08-01", propertyType: "existing", refDate: "2027-06-30" });
  assert.equal(before.status, "B_transitional");
  assert.ok(before.canNegativelyGear);
  const after = negativeGearingStatus({ purchaseDate: "2026-08-01", propertyType: "existing", refDate: "2027-07-01" });
  assert.equal(after.status, "B_transitional");
  assert.ok(!after.canNegativelyGear);
  assert.ok(after.quarantined);
});
t("NG Status C: purchased on/after 1 Jul 2027 → no NG, quarantined immediately", () => {
  const s = negativeGearingStatus({ purchaseDate: "2027-07-15", propertyType: "existing", refDate: "2027-08-01" });
  assert.equal(s.status, "C_post_reform");
  assert.ok(!s.canNegativelyGear);
  assert.ok(s.quarantined);
});
t("NG Status D: new build always full NG", () => {
  const old = negativeGearingStatus({ purchaseDate: "2030-01-01", propertyType: "new" });
  assert.equal(old.status, "D_new_build");
  assert.ok(old.canNegativelyGear);
});
t("NG Status E: non-residential unchanged", () => {
  const s = negativeGearingStatus({ purchaseDate: "2030-01-01", propertyType: "shares" });
  assert.equal(s.status, "E_non_residential");
  assert.ok(s.canNegativelyGear);
});

t("Quarantined loss only offsets other residential income", () => {
  const status = { canNegativelyGear: false, quarantined: true };
  const r = applyRentalLossDeduction({ rentalLoss: 20_000, otherResidentialIncome: 12_000, status });
  assert.equal(r.deductibleNow, 12_000);
  assert.equal(r.carriedForward, 8_000);
  assert.equal(r.appliedAgainstWages, 0);
});
t("Un-quarantined loss offsets wages in full", () => {
  const status = { canNegativelyGear: true, quarantined: false };
  const r = applyRentalLossDeduction({ rentalLoss: 20_000, otherResidentialIncome: 0, status });
  assert.equal(r.deductibleNow, 20_000);
  assert.equal(r.appliedAgainstWages, 20_000);
});

// ---------- Discretionary trusts ----------
t("Trust min tax: pre 1 Jul 2028 → no min tax", () => {
  const r = calculateTrustMinimumTax({ distributedIncome: 100_000, refDate: "2028-06-30" });
  assert.equal(r.minimumTax, 0);
});
t("Trust min tax: 30% of distributed income post 1 Jul 2028", () => {
  const r = calculateTrustMinimumTax({ distributedIncome: 100_000, refDate: "2028-07-01" });
  assert.equal(r.minimumTax, 30_000);
  assert.equal(r.netTrustTax, 30_000);
  assert.equal(r.beneficiaryCredit, 30_000);
  assert.equal(r.regime, "non-refundable-credit");
});
t("Trust min tax: franking credits reduce net trust tax", () => {
  const r = calculateTrustMinimumTax({ distributedIncome: 100_000, frankingCreditsAvailable: 12_000, refDate: "2028-07-01" });
  assert.equal(r.minimumTax, 30_000);
  assert.equal(r.netTrustTax, 18_000);
});
t("Trust min tax: corporate beneficiary gets NO credit", () => {
  const r = calculateTrustMinimumTax({ distributedIncome: 100_000, isCorporateBeneficiary: true, refDate: "2028-07-01" });
  assert.equal(r.minimumTax, 30_000);
  assert.equal(r.beneficiaryCredit, 0);
  assert.equal(r.regime, "corporate-no-credit");
});
t("Trust min tax: testamentary trust existing at announcement excluded", () => {
  const r = calculateTrustMinimumTax({ distributedIncome: 100_000, isTestamentaryExisting: true, refDate: "2030-07-01" });
  assert.equal(r.minimumTax, 0);
});

// ---------- Boundary / date integrity ----------
t("Key dates correct", () => {
  assert.equal(ANNOUNCEMENT_DATE.toISOString(), "2026-05-12T09:30:00.000Z");
  assert.equal(NG_REFORM_DATE.toISOString(), "2027-06-30T14:00:00.000Z");
  assert.equal(CGT_REFORM_DATE.toISOString(), "2027-06-30T14:00:00.000Z");
  assert.equal(TRUST_REFORM_DATE.toISOString(), "2028-06-30T14:00:00.000Z");
});

t("Constants match Budget rates", () => {
  assert.equal(CGT_DISCOUNT_PRE_REFORM, 0.50);
  assert.equal(CGT_AFFORDABLE_HOUSING_DISCOUNT, 0.60);
  assert.equal(CGT_MIN_TAX_RATE, 0.30);
  assert.equal(TRUST_MIN_TAX_RATE, 0.30);
});

console.log(`\n${passed}/${passed + failed} passed`);
if (failed > 0) process.exit(1);
