import { describe, expect, it } from "vitest";

import {
  calculateCompoundInterest,
  calculateMonthlyPayment,
  calculateSimpleInterest,
  generateAmortizationSchedule,
  projectInterestGrowth,
  projectInvestment,
  summarizeLoan,
} from "./finance";

describe("calculateMonthlyPayment", () => {
  it("returns 0 for non-positive principal or months", () => {
    expect(calculateMonthlyPayment(0, 5, 12)).toBe(0);
    expect(calculateMonthlyPayment(10000, 5, 0)).toBe(0);
  });

  it("splits principal evenly at 0% interest", () => {
    expect(calculateMonthlyPayment(12000, 0, 12)).toBeCloseTo(1000, 6);
  });

  it("matches known EMI value (100000 @ 10% for 12 months ≈ 8791.59)", () => {
    expect(calculateMonthlyPayment(100000, 10, 12)).toBeCloseTo(8791.59, 1);
  });
});

describe("summarizeLoan", () => {
  it("total = monthly * months and interest = total - principal", () => {
    const s = summarizeLoan(10000, 6, 12);
    expect(s.totalPayment).toBeCloseTo(s.monthlyPayment * 12, 6);
    expect(s.totalInterest).toBeCloseTo(s.totalPayment - 10000, 6);
  });
});

describe("generateAmortizationSchedule", () => {
  it("ends at zero balance with one row per month", () => {
    const rows = generateAmortizationSchedule(5000, 5, 6);
    expect(rows).toHaveLength(6);
    expect(rows[rows.length - 1].balance).toBeCloseTo(0, 6);
  });

  it("never loops forever when payment cannot cover interest", () => {
    const rows = generateAmortizationSchedule(100000, 1200, 12);
    expect(rows.length).toBeLessThanOrEqual(12);
  });
});

describe("interest", () => {
  it("simple interest: (P*R*T)/100", () => {
    expect(calculateSimpleInterest(1000, 5, 2)).toBe(100);
  });

  it("compound interest exceeds simple for same inputs", () => {
    const simple = calculateSimpleInterest(1000, 10, 5);
    const compound = calculateCompoundInterest(1000, 10, 5, 12);
    expect(compound).toBeGreaterThan(simple);
  });

  it("projectInterestGrowth starts at principal and grows", () => {
    const points = projectInterestGrowth({ mode: "compound", principal: 1000, ratePercent: 10, years: 3, compoundsPerYear: 12 });
    expect(points[0]).toEqual({ year: 0, value: 1000 });
    expect(points).toHaveLength(4);
    expect(points[3].value).toBeGreaterThan(points[1].value);
  });
});

describe("projectInvestment", () => {
  it("contributions accumulate and interest is non-negative", () => {
    const rows = projectInvestment({ initial: 1000, monthlyContribution: 100, annualRatePercent: 6, years: 2 });
    expect(rows).toHaveLength(2);
    expect(rows[1].principal).toBe(1000 + 100 * 24);
    expect(rows[1].interest).toBeGreaterThanOrEqual(0);
    expect(rows[1].total).toBeCloseTo(rows[1].principal + rows[1].interest, 4);
  });
});
