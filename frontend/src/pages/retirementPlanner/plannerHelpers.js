// Pure helpers for the Retirement Planner — formatters, constants, tax utilities.
// Kept side-effect-free so they can be unit-tested in isolation.

// AUD currency formatter, no fractional cents.
export const fmt = (v) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

// Compact $ formatter ($12k / $1.85M etc).
export const fmtCompact = (v) => {
  if (!v) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return fmt(v);
};

// 2025 ASFA Retirement Standard (annual, today's $).
export const ASFA = {
  single_modest: 33_134,
  single_comfortable: 52_383,
  couple_modest: 47_731,
  couple_comfortable: 73_875,
};

// 2025 Age Pension single/couple maxima + asset-test thresholds.
export const AGE_PENSION = {
  single_max: 29_754,
  couple_max: 44_855,
  asset_free_single: 314_000,
  asset_free_couple: 470_000,
  taper_per_1k: 78,
};

// Simple asset-test estimator for Age Pension. We treat 60% of liquid
// assets as assessable (excludes principal home + reasonable contents).
export const estimateAgePension = (relationship, assessableAssets) => {
  const max = relationship === "couple" ? AGE_PENSION.couple_max : AGE_PENSION.single_max;
  const threshold = relationship === "couple" ? AGE_PENSION.asset_free_couple : AGE_PENSION.asset_free_single;
  if (assessableAssets <= threshold) return max;
  const overK = (assessableAssets - threshold) / 1000;
  return Math.max(0, max - overK * AGE_PENSION.taper_per_1k);
};

// 2025-26 AU resident marginal rate including Medicare levy.
export const marginalRate = (taxableIncome) => {
  if (taxableIncome <= 18200) return 0;
  if (taxableIncome <= 45000) return 0.16 + 0.02;
  if (taxableIncome <= 135000) return 0.30 + 0.02;
  if (taxableIncome <= 190000) return 0.37 + 0.02;
  return 0.45 + 0.02;
};

// MoneySmart investment-option presets (nominal return p.a., before fees & inflation).
export const INVESTMENT_OPTIONS = [
  { key: "cash",         label: "Cash",         nominal: 3.5, desc: "Lowest risk · cash deposits, term deposits" },
  { key: "conservative", label: "Conservative", nominal: 4.5, desc: "20% growth assets · low risk" },
  { key: "moderate",     label: "Moderate",     nominal: 5.5, desc: "50% growth assets · medium-low risk" },
  { key: "balanced",     label: "Balanced",     nominal: 6.5, desc: "70% growth assets · medium risk (default)" },
  { key: "growth",       label: "Growth",       nominal: 7.5, desc: "85% growth assets · medium-high risk" },
  { key: "high_growth",  label: "High Growth",  nominal: 8.5, desc: "100% growth assets · high risk" },
];

// Shared tailwind class fragments so all planner cards share the same shell.
export const SECTION_CLASS = "rounded-2xl border border-slate-200 bg-white";
export const SECTION_HEAD  = "font-serif text-xl text-[#1a2744] leading-tight";
export const SECTION_SUB   = "text-xs text-slate-500 mt-0.5";
export const EYEBROW       = "text-[10px] tracking-[0.18em] uppercase text-[#D4A84C] font-semibold";
