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

/* ---- Nepal Rastra Bank official reference rates ---- */

export interface NrbRate {
  code: string;
  /** Foreign-currency units the buy/sell quotes cover (e.g. INR: 100, JPY: 10). */
  unit: number;
  /** NPR per `unit` — what NRB-licensed institutions pay for the currency. */
  buy: number;
  /** NPR per `unit` — what they sell it for. */
  sell: number;
}

export interface NrbRates {
  /** Publication date (YYYY-MM-DD) of the rates. */
  date: string;
  rates: NrbRate[];
}

interface NrbApiRate {
  currency?: { iso3?: unknown; unit?: unknown };
  buy?: unknown;
  sell?: unknown;
}

function toPositiveNumber(value: unknown): number | null {
  const n = typeof value === "string" ? Number.parseFloat(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Picks the latest published day from an NRB /api/forex/v1/rates payload and
 * returns its rates. Pure (no fetch) so tests guard the real parsing —
 * NRB quotes odd units (INR per 100, JPY per 10) that must survive intact.
 */
export function parseNrbPayload(json: unknown): NrbRates | null {
  if (typeof json !== "object" || json === null) return null;
  const payload = (json as { data?: { payload?: unknown } }).data?.payload;
  if (!Array.isArray(payload) || payload.length === 0) return null;

  const days = payload
    .filter(
      (d): d is { date: string; rates: NrbApiRate[] } =>
        typeof d === "object" &&
        d !== null &&
        typeof (d as { date: unknown }).date === "string" &&
        Array.isArray((d as { rates: unknown }).rates),
    )
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (days.length === 0) return null;

  const latest = days[0];
  const rates: NrbRate[] = [];
  for (const r of latest.rates) {
    const code = r.currency?.iso3;
    const unit = toPositiveNumber(r.currency?.unit);
    const buy = toPositiveNumber(r.buy);
    const sell = toPositiveNumber(r.sell);
    if (typeof code !== "string" || !/^[A-Z]{3}$/.test(code) || unit === null || buy === null || sell === null) {
      continue;
    }
    rates.push({ code, unit, buy, sell });
  }
  if (rates.length === 0) return null;
  return { date: latest.date, rates };
}

export function nrbRatesByCode(nrb: NrbRates): Record<string, NrbRate> {
  const map: Record<string, NrbRate> = {};
  for (const r of nrb.rates) map[r.code] = r;
  return map;
}

/** Mid-point NPR value of one unit of `code` (buy+sell)/2 — the fair single number for conversion. */
export function nrbMidNprPerUnit(code: string, rates: Record<string, NrbRate>): number {
  if (code === "NPR") return 1;
  const r = rates[code];
  if (!r || !Number.isFinite(r.unit) || r.unit <= 0) return NaN;
  const mid = (r.buy + r.sell) / 2;
  if (!Number.isFinite(mid) || mid <= 0) return NaN;
  return mid / r.unit;
}

/**
 * Converts via NRB reference rates: amount → NPR at the source mid-rate,
 * NPR → target at the target mid-rate. Uses the mid so one number converts;
 * the UI shows the underlying buy/sell so the spread stays visible.
 */
export function convertViaNrb(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, NrbRate>,
): number {
  if (!Number.isFinite(amount) || amount < 0) return NaN;
  if (from === to) return amount;
  const fromNpr = nrbMidNprPerUnit(from, rates);
  const toNpr = nrbMidNprPerUnit(to, rates);
  if (!Number.isFinite(fromNpr) || !Number.isFinite(toNpr) || toNpr <= 0) return NaN;
  return (amount * fromNpr) / toNpr;
}
