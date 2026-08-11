/**
 * Merge class names, filtering out falsy values
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a number as USD currency with commas and 2 decimal places
 * e.g. 1234.5 → "$1,234.50"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as percentage with sign and 2 decimal places
 * e.g. 12.345 → "+12.35%", -3.1 → "-3.10%"
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format a number with commas
 * e.g. 1234567 → "1,234,567"
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a signed currency value with + prefix for positive
 * e.g. 1234.5 → "+$1,234.50", -500 → "-$500.00"
 */
export function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatCurrency(value)}`;
}
