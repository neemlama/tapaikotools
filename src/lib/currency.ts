/**
 * Pure currency math — shared by CurrencyConverterTool so tests guard the real formula.
 *
 * Rates are expressed as "units per 1 USD" (USD itself = 1). Conversion is:
 *   converted = amount / rates[from] * rates[to]
 * Live rates come from open.er-api.com (free, no key); FALLBACK_RATES_USD_BASE
 * is only a clearly-labeled offline fallback, not a quote source.
 */

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "Rs" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
];

/** Approximate offline fallback (units per 1 USD). Labeled stale in the UI. */
export const FALLBACK_RATES_USD_BASE: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.5,
  NPR: 133.5,
  JPY: 149.0,
  CNY: 7.24,
  AUD: 1.52,
  CAD: 1.36,
  SGD: 1.34,
  AED: 3.67,
  CHF: 0.89,
};

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code);
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  ratesUsdBase: Record<string, number>,
): number {
  if (!Number.isFinite(amount) || amount < 0) return NaN;
  const fromRate = ratesUsdBase[from];
  const toRate = ratesUsdBase[to];
  if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate <= 0 || toRate <= 0) return NaN;
  if (from === to) return amount;
  return (amount / fromRate) * toRate;
}

/** Rate for "1 unit of `from` = X units of `to`" display line. */
export function unitRate(from: string, to: string, ratesUsdBase: Record<string, number>): number {
  return convertCurrency(1, from, to, ratesUsdBase);
}

export function formatConverted(value: number, currencyCode: string): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}
