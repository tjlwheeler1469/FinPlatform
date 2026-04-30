// Determinism regression — ensures seedable RNG produces identical outputs.
import { projectRetirement } from "../../src/lib/retirementEngine.js";

const baseInput = {
  currentPortfolio: 1_000_000,
  annualContributions: 30_000,
  annualSpending: 80_000,
  yearsToRetirement: 15,
  yearsInRetirement: 25,
  numSims: 200,
};

const r1 = projectRetirement({ ...baseInput, seed: 42 });
const r2 = projectRetirement({ ...baseInput, seed: 42 });
const r3 = projectRetirement({ ...baseInput, seed: 99 });

let pass = 0, fail = 0;
const eq = (label, a, b) => {
  if (Math.abs(a - b) < 0.0001) { pass++; console.log(`  ✓ ${label} (${a})`); }
  else { fail++; console.log(`  ✗ ${label} got ${a}, expected ${b}`); }
};

console.log("\nSeedable RNG determinism");
eq("seed=42 confidence reproducible", r1.confidence, r2.confidence);
eq("seed=42 portfolioAtRetirement reproducible", r1.portfolioAtRetirement, r2.portfolioAtRetirement);
eq("seed=42 trajectory[5].p50 reproducible", r1.trajectory[5].p50, r2.trajectory[5].p50);
console.log(`  · seed=42 confidence = ${r1.confidence}%, seed=99 confidence = ${r3.confidence}% (should differ slightly)`);
if (r1.confidence === r3.confidence && r1.portfolioAtRetirement === r3.portfolioAtRetirement) {
  fail++; console.log("  ✗ different seeds should produce different results");
} else { pass++; console.log("  ✓ different seeds produce different distributions"); }

console.log(`\n  RESULTS: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
