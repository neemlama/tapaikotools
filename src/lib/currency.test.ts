import { describe, expect, it } from "vitest";

import {
  convertCurrency,
  convertViaNrb,
  FALLBACK_RATES_USD_BASE,
  isSupportedCurrency,
  nrbMidNprPerUnit,
  parseNrbPayload,
  unitRate,
} from "./currency";

const RATES = { USD: 1, NPR: 100, INR: 80 } as Record<string, number>;

describe("currency converter", () => {
  it("converts USD -> NPR via USD-base rates", () => {
    expect(convertCurrency(1, "USD", "NPR", RATES)).toBeCloseTo(100, 6);
  });

  it("converts NPR -> USD (inverse)", () => {
    expect(convertCurrency(100, "NPR", "USD", RATES)).toBeCloseTo(1, 6);
  });

  it("converts NPR -> INR through the USD base", () => {
    // 200 NPR = 2 USD = 160 INR
    expect(convertCurrency(200, "NPR", "INR", RATES)).toBeCloseTo(160, 6);
  });

  it("same currency returns the amount unchanged", () => {
    expect(convertCurrency(42.5, "NPR", "NPR", RATES)).toBeCloseTo(42.5, 6);
  });

  it("unitRate gives the 1-unit display rate", () => {
    expect(unitRate("USD", "NPR", RATES)).toBeCloseTo(100, 6);
  });

  it("returns NaN for negative amounts", () => {
    expect(convertCurrency(-5, "USD", "NPR", RATES)).toBeNaN();
  });

  it("returns NaN for unknown currency codes", () => {
    expect(convertCurrency(10, "USD", "XXX", RATES)).toBeNaN();
    expect(convertCurrency(10, "XXX", "USD", RATES)).toBeNaN();
  });

  it("fallback table covers every supported currency with positive rates", () => {
    for (const c of ["USD", "EUR", "GBP", "INR", "NPR", "JPY", "CNY", "AUD", "CAD", "SGD", "AED", "CHF"]) {
      expect(isSupportedCurrency(c)).toBe(true);
      expect(FALLBACK_RATES_USD_BASE[c]).toBeGreaterThan(0);
    }
  });
});

const NRB_FIXTURE = {
  data: {
    payload: [
      {
        date: "2026-09-14",
        rates: [
          { currency: { iso3: "USD", unit: 1 }, buy: "152.00", sell: "153.00" },
          { currency: { iso3: "INR", unit: 100 }, buy: "160.00", sell: "160.15" },
        ],
      },
      {
        date: "2026-09-15",
        rates: [
          { currency: { iso3: "USD", unit: 1 }, buy: "152.59", sell: "153.19" },
          { currency: { iso3: "INR", unit: 100 }, buy: "160.00", sell: "160.15" },
          { currency: { iso3: "JPY", unit: 10 }, buy: "9.86", sell: "9.90" },
        ],
      },
    ],
  },
};

describe("NRB official rates", () => {
  it("picks the latest published day", () => {
    const parsed = parseNrbPayload(NRB_FIXTURE);
    expect(parsed?.date).toBe("2026-09-15");
    expect(parsed?.rates).toHaveLength(3);
  });

  it("rejects garbage payloads", () => {
    expect(parseNrbPayload(null)).toBeNull();
    expect(parseNrbPayload({})).toBeNull();
    expect(parseNrbPayload({ data: { payload: [] } })).toBeNull();
  });

  it("mid NPR per unit respects odd units (INR per 100, JPY per 10)", () => {
    const parsed = parseNrbPayload(NRB_FIXTURE)!;
    const map = Object.fromEntries(parsed.rates.map((r) => [r.code, r]));
    expect(nrbMidNprPerUnit("USD", map)).toBeCloseTo(152.89, 6);
    expect(nrbMidNprPerUnit("INR", map)).toBeCloseTo(1.60075, 6);
    expect(nrbMidNprPerUnit("JPY", map)).toBeCloseTo(0.988, 6);
    expect(nrbMidNprPerUnit("NPR", map)).toBe(1);
  });

  it("converts USD -> NPR at the NRB mid", () => {
    const parsed = parseNrbPayload(NRB_FIXTURE)!;
    const map = Object.fromEntries(parsed.rates.map((r) => [r.code, r]));
    expect(convertViaNrb(1, "USD", "NPR", map)).toBeCloseTo(152.89, 6);
    expect(convertViaNrb(152.89, "NPR", "USD", map)).toBeCloseTo(1, 6);
  });

  it("converts cross-pairs through NPR (USD -> INR)", () => {
    const parsed = parseNrbPayload(NRB_FIXTURE)!;
    const map = Object.fromEntries(parsed.rates.map((r) => [r.code, r]));
    // 100 USD = 15289 NPR = 15289 / 1.60075 INR
    expect(convertViaNrb(100, "USD", "INR", map)).toBeCloseTo(15289 / 1.60075, 4);
  });

  it("returns NaN for unknown codes and negative amounts", () => {
    const parsed = parseNrbPayload(NRB_FIXTURE)!;
    const map = Object.fromEntries(parsed.rates.map((r) => [r.code, r]));
    expect(convertViaNrb(10, "USD", "EUR", map)).toBeNaN();
    expect(convertViaNrb(-5, "USD", "NPR", map)).toBeNaN();
  });
});
