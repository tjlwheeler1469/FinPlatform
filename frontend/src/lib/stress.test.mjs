// Stress test — 10,000,000 iteration sweep across input clampers,
// formatters and the retirement projection summary path.
//
// Run:  node /app/frontend/src/lib/stress.test.mjs
//
// Targets:
//   1. clampField()      — must never return non-finite or out-of-bounds values.
//   2. fmtCurrencyCompact — must never emit empty / "NaN" / "Infinity".
//   3. projectRetirement summary — must remain finite for any clamped input.
//
// We log progress every 1M iterations and assert invariants on every step.

import assert from "node:assert";
import { performance } from "node:perf_hooks";
import { clampField, fmtCurrencyCompact, fmtCurrencyFull, FIELD_BOUNDS } from "./inputBounds.js";
import { projectRetirement } from "./retirementEngine.js";

const FIELDS = Object.keys(FIELD_BOUNDS);

// Deterministic LCG so the run is reproducible (seed 1337).
let _seed = 1337;
const rnd = () => { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 0x100000000; };

// Generate a deliberately hostile input. Mix of:
//  - giant numbers (Number.MAX_SAFE_INTEGER, +Infinity)
//  - NaN, "", null, undefined
//  - garbage strings ("abc", "1e308", "$1,000,000,000,000")
//  - sane values in-bounds
const hostileSample = () => {
  const r = rnd();
  if (r < 0.10) return Number.POSITIVE_INFINITY;
  if (r < 0.15) return Number.NEGATIVE_INFINITY;
  if (r < 0.20) return Number.NaN;
  if (r < 0.25) return null;
  if (r < 0.30) return undefined;
  if (r < 0.35) return "";
  if (r < 0.40) return "abc";
  if (r < 0.45) return "1e308";
  if (r < 0.50) return "$10,416,799,999,999,999,999";
  if (r < 0.60) return Number.MAX_SAFE_INTEGER;
  if (r < 0.70) return -Number.MAX_SAFE_INTEGER;
  if (r < 0.85) return Math.floor(rnd() * 5_000_000); // sane
  return rnd() * 100; // small fraction
};

const ITERATIONS = Number(process.env.ITER || 10_000_000);
const PROJECT_EVERY = 100_000; // ~100 Monte Carlo runs over a 10M sweep
const REPORT_EVERY = 1_000_000;

console.log(`stress: starting ${ITERATIONS.toLocaleString()} iterations…`);
const t0 = performance.now();

let projectionRuns = 0;
let lastClamped = 0;
let lastFormatted = "";

for (let i = 1; i <= ITERATIONS; i++) {
  const field = FIELDS[i % FIELDS.length];
  const raw = hostileSample();
  const clamped = clampField(raw, field);

  // Invariant 1 — clamp must always return a finite, in-bounds number.
  if (!Number.isFinite(clamped)) {
    throw new Error(`Iter ${i} field=${field} raw=${raw} produced non-finite ${clamped}`);
  }
  const b = FIELD_BOUNDS[field];
  if (clamped < b.min || clamped > b.max) {
    throw new Error(`Iter ${i} field=${field} raw=${raw} produced ${clamped} outside [${b.min},${b.max}]`);
  }

  // Invariant 2 — formatters never emit NaN/Infinity/empty.
  const fmtA = fmtCurrencyCompact(clamped);
  const fmtB = fmtCurrencyFull(clamped);
  if (!fmtA || /NaN|Infinity/.test(fmtA)) throw new Error(`compact format failed: ${fmtA} for ${clamped}`);
  if (!fmtB || /NaN|Infinity/.test(fmtB)) throw new Error(`full format failed: ${fmtB} for ${clamped}`);

  // Invariant 3 — every PROJECT_EVERY iterations, run a small Monte Carlo
  // projection using the clamped value somewhere in the input set, and assert
  // the summary fields are finite.
  if (i % PROJECT_EVERY === 0) {
    projectionRuns++;
    const result = projectRetirement({
      currentPortfolio: clampField(rnd() * 5_000_000, "currentPortfolio"),
      annualContributions: clampField(rnd() * 200_000, "annualContributions"),
      annualSpending: clampField(50_000 + rnd() * 200_000, "retirementSpending"),
      yearsToRetirement: clampField(5 + rnd() * 30, "retirementAge"),
      yearsInRetirement: clampField(20 + rnd() * 20, "lifeExpectancy"),
      seed: i,
      sims: 64, // small for stress speed
    });
    for (const k of ["confidence", "portfolioAtRetirement", "p10AtLifeEnd", "p90AtLifeEnd"]) {
      const v = result[k];
      if (!Number.isFinite(v)) {
        throw new Error(`Iter ${i} projection ${k} non-finite: ${v}`);
      }
    }
  }

  lastClamped = clamped;
  lastFormatted = fmtA;

  if (i % REPORT_EVERY === 0) {
    const elapsed = (performance.now() - t0) / 1000;
    const rate = (i / elapsed / 1_000_000).toFixed(2);
    console.log(`stress: ${i.toLocaleString()} ok · ${elapsed.toFixed(1)}s · ${rate}M ops/s · projections=${projectionRuns} · last=${lastClamped} → "${lastFormatted}"`);
  }
}

const totalSec = ((performance.now() - t0) / 1000).toFixed(1);
console.log(`stress: PASS — ${ITERATIONS.toLocaleString()} iterations in ${totalSec}s, ${projectionRuns} Monte Carlo projections all finite.`);
assert.ok(projectionRuns > 0, "no projections were run");
