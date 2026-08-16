/**
 * Merge class names, filtering out falsy values
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a number as currency (USD default or THB with custom exchange rate)
 * e.g. 1234.5, "USD" → "$1,234.50"
 * e.g. 1234.5, "THB", 33.10 → "฿40,861.95"
 */
export function formatCurrency(
  value: number,
  currency: "USD" | "THB" = "USD",
  exchangeRate = 1
): string {
  if (typeof value !== "number" || isNaN(value)) return "-";
  const converted = currency === "THB" ? value * exchangeRate : value;
  
  if (currency === "THB") {
    return `฿${new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
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
export function formatNumber(value: number, maxDecimals = 9): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

/**
 * Format a signed currency value with + prefix for positive
 * e.g. 1234.5 → "+$1,234.50", -500 → "-$500.00"
 */
export function formatSignedCurrency(
  value: number,
  currency: "USD" | "THB" = "USD",
  exchangeRate = 1
): string {
  if (typeof value !== "number" || isNaN(value)) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatCurrency(value, currency, exchangeRate)}`;
}

