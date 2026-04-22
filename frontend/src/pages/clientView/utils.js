// Shared utilities for the client-facing view. Pure functions only.
export const fmt = (v) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v || 0);

export const fmtShort = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${Math.round(v || 0)}`;
};

export const ALLOC_COLORS = ["#1a2744", "#D4A84C", "#10b981", "#8b5cf6", "#06b6d4", "#f43f5e"];
