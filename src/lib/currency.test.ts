import { describe, expect, it } from "vitest";

import { convertCurrency, FALLBACK_RATES_USD_BASE, isSupportedCurrency, unitRate } from "./currency";

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
