import { describe, expect, it } from "vitest";

import { calculateNepalSalaryTax } from "./nepal-tax";

function base(over: Partial<Parameters<typeof calculateNepalSalaryTax>[0]> = {}) {
  return {
    annualGross: 1_200_000,
    filingStatus: "single" as const,
    isSsf: false,
    retirementContrib: 0,
    lifePremium: 0,
    healthPremium: 0,
    isFemaleSole: false,
    ...over,
  };
}

describe("nepal salary tax FY2082/83", () => {
  it("single 12L non-SSF, no deductions = 145,000 (5k+20k+60k+60k)", () => {
    const r = calculateNepalSalaryTax(base(), "2082-83");
    expect(r.taxableIncome).toBe(1_200_000);
    expect(r.annualTax).toBeCloseTo(145_000, 6);
  });

  it("SSF waiver saves first-band 1% (12L single SSF = 140,000)", () => {
    const r = calculateNepalSalaryTax(base({ isSsf: true }), "2082-83");
    expect(r.annualTax).toBeCloseTo(140_000, 6);
    expect(r.bands[0].rate).toBe(0);
  });

  it("couple 12L non-SSF = 116,000 (6k+20k+60k+30k)", () => {
    const r = calculateNepalSalaryTax(base({ filingStatus: "couple" }), "2082-83");
    expect(r.annualTax).toBeCloseTo(116_000, 6);
  });

  it("retirement cap is min(500k, 1/3 of gross)", () => {
    const low = calculateNepalSalaryTax(base({ annualGross: 1_200_000, retirementContrib: 999_999 }), "2082-83");
    expect(low.retirementDeductible).toBe(400_000); // 1/3 binds
    const high = calculateNepalSalaryTax(base({ annualGross: 2_400_000, retirementContrib: 999_999 }), "2082-83");
    expect(high.retirementDeductible).toBe(500_000); // absolute binds
  });

  it("life 40k + health 20k caps apply", () => {
    const r = calculateNepalSalaryTax(base({ lifePremium: 999_999, healthPremium: 999_999 }), "2082-83");
    expect(r.lifeDeductible).toBe(40_000);
    expect(r.healthDeductible).toBe(20_000);
    expect(r.taxableIncome).toBe(1_200_000 - 60_000);
  });

  it("female sole rebate is 10% off final tax, couples excluded", () => {
    const single = calculateNepalSalaryTax(base({ isFemaleSole: true }), "2082-83");
    expect(single.rebate).toBeCloseTo(14_500, 6);
    expect(single.annualTax).toBeCloseTo(130_500, 6);
    const couple = calculateNepalSalaryTax(base({ filingStatus: "couple", isFemaleSole: true }), "2082-83");
    expect(couple.rebate).toBe(0);
  });

  it("SSF low income is zero tax (240k SSF)", () => {
    const r = calculateNepalSalaryTax(base({ annualGross: 240_000, isSsf: true }), "2082-83");
    expect(r.annualTax).toBe(0);
  });

  it("monthly TDS = annual / 12", () => {
    const r = calculateNepalSalaryTax(base(), "2082-83");
    expect(r.monthlyTds).toBeCloseTo(r.annualTax / 12, 6);
  });

  it("unknown FY fails closed", () => {
    expect(() => calculateNepalSalaryTax(base(), "2099-00" as never)).toThrow();
  });
});

describe("nepal salary tax FY2083/84 unified", () => {
  it("120k/mo = 14.4L gross, non-SSF = 54,000 (10k+44k)", () => {
    const r = calculateNepalSalaryTax({ ...base(), annualGross: 1_440_000 }, "2083-84");
    expect(r.annualTax).toBeCloseTo(54_000, 6);
    expect(r.monthlyTds).toBeCloseTo(4_500, 6);
  });

  it("SSF waiver saves 10k on 14.4L (44,000)", () => {
    const r = calculateNepalSalaryTax({ ...base(), annualGross: 1_440_000, isSsf: true }, "2083-84");
    expect(r.annualTax).toBeCloseTo(44_000, 6);
  });

  it("single and couple unified (same result)", () => {
    const s = calculateNepalSalaryTax({ ...base(), annualGross: 1_440_000 }, "2083-84");
    const c = calculateNepalSalaryTax({ ...base(), annualGross: 1_440_000, filingStatus: "couple" }, "2083-84");
    expect(c.annualTax).toBeCloseTo(s.annualTax, 6);
  });
});
