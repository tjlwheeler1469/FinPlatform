/**
 * Shared typed hooks for the Wealth Command Centre.
 * Progressively migrated from JSX to TypeScript.
 */

/**
 * Format large currency values into abbreviated form.
 */
export const formatCompactCurrency = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

/**
 * Color helper for delta values (gain/loss).
 */
export const getDeltaColorClass = (delta: number): string => {
  if (delta > 0) return 'text-green-600';
  if (delta < 0) return 'text-red-600';
  return 'text-gray-600';
};
