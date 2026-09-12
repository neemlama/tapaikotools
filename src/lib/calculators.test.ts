import { describe, expect, it } from "vitest";

import { calculateBMI, getBMICategory, healthyWeightRange, inchesToMeters, lbsToKg } from "./bmi";
import { discountSale, percentChange, percentOf, whatPercent } from "./percentage";

describe("BMI", () => {
  it("70kg / 1.75m ≈ 22.86 (Healthy)", () => {
    const bmi = calculateBMI(70, 1.75);
    expect(bmi).toBeCloseTo(22.86, 2);
    expect(getBMICategory(bmi)).toBe("Healthy");
  });

  it("category boundaries", () => {
    expect(getBMICategory(18.49)).toBe("Underweight");
    expect(getBMICategory(18.5)).toBe("Healthy");
    expect(getBMICategory(24.99)).toBe("Healthy");
    expect(getBMICategory(25)).toBe("Overweight");
    expect(getBMICategory(29.99)).toBe("Overweight");
    expect(getBMICategory(30)).toBe("Obese");
  });

  it("healthy range for 1.75m ≈ 56.7–76.3 kg", () => {
    const { min, max } = healthyWeightRange(1.75);
    expect(min).toBeCloseTo(56.66, 1);
    expect(max).toBeCloseTo(76.26, 1);
  });

  it("imperial conversion matches metric result", () => {
    const metric = calculateBMI(70, 1.75);
    const imperial = calculateBMI(lbsToKg(154.32), inchesToMeters(68.9));
    expect(imperial).toBeCloseTo(metric, 1);
  });

  it("returns NaN for zero height", () => {
    expect(calculateBMI(70, 0)).toBeNaN();
  });
});

describe("percentage", () => {
  it("20% of 150 = 30", () => {
    expect(percentOf(20, 150)).toBeCloseTo(30, 6);
  });

  it("30 is 25% of 120", () => {
    expect(whatPercent(30, 120)).toBeCloseTo(25, 6);
  });

  it("whole=0 gives NaN", () => {
    expect(whatPercent(5, 0)).toBeNaN();
  });

  it("50 -> 75 is +50% change", () => {
    expect(percentChange(50, 75)).toBeCloseTo(50, 6);
  });

  it("old=0 gives NaN", () => {
    expect(percentChange(0, 75)).toBeNaN();
  });

  it("25% off 200 = 150 sale, 50 savings", () => {
    expect(discountSale(200, 25)).toEqual({ sale: 150, savings: 50 });
  });
});
