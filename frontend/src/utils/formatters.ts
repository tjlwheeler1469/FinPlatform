/**
 * Formatting utilities for Wealth Command.
 * Common formatters used across the application.
 */

export const formatCurrency = (
  value: number | null | undefined,
  currency: string = 'AUD',
  minimumFractionDigits: number = 0
): string => {
  if (value == null || isNaN(value)) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (
  value: number | null | undefined,
  showSign: boolean = true
): string => {
  if (value == null || isNaN(value)) return '0.00%';
  const prefix = showSign && value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
};

export const formatNumber = (
  value: number | null | undefined,
  decimals: number = 0
): string => {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCompactNumber = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '0';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
};

export const formatTimeAgo = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-AU');
  } catch {
    return dateStr;
  }
};

export const formatDate = (
  dateStr: string | null | undefined,
  format: 'short' | 'long' = 'short'
): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (format === 'long') {
      return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString('en-AU');
  } catch {
    return dateStr;
  }
};
