import { describe, expect, it } from "vitest";

import {
  evaluateExpression,
  factorial,
  formatResult,
  gcd,
  isPrime,
  lcm,
  solveQuadratic,
} from "./calculator";

describe("expression evaluator", () => {
  it("respects precedence (2+3*4 = 14)", () => {
    expect(evaluateExpression("2+3*4")).toBeCloseTo(14, 10);
  });

  it("handles parentheses ((2+3)*4 = 20)", () => {
    expect(evaluateExpression("(2+3)*4")).toBeCloseTo(20, 10);
  });

  it("handles unary minus and decimals (-2.5*2 = -5)", () => {
    expect(evaluateExpression("-2.5*2")).toBeCloseTo(-5, 10);
  });

  it("hides float dust (0.1+0.2 = 0.3)", () => {
    expect(formatResult(evaluateExpression("0.1+0.2"))).toBe("0.3");
  });

  it("power is right-associative (2^3^2 = 512)", () => {
    expect(evaluateExpression("2^3^2")).toBeCloseTo(512, 10);
  });

  it("percent is postfix (/100): 50+10% = 50.1", () => {
    expect(evaluateExpression("50+10%")).toBeCloseTo(50.1, 10);
  });

  it("implicit multiplication: 2pi, 2(3+4)", () => {
    expect(evaluateExpression("2pi")).toBeCloseTo(2 * Math.PI, 10);
    expect(evaluateExpression("2(3+4)")).toBeCloseTo(14, 10);
  });

  it("division by zero is an error", () => {
    expect(evaluateExpression("5/0")).toBeNaN();
    expect(formatResult(evaluateExpression("5/0"))).toBe("Error");
  });

  it("rejects invalid input", () => {
    expect(evaluateExpression("")).toBeNaN();
    expect(evaluateExpression("2+")).toBeNaN();
    expect(evaluateExpression("(2+3")).toBeNaN();
    expect(evaluateExpression("2&3")).toBeNaN();
    expect(evaluateExpression("foo(2)")).toBeNaN();
  });
});

describe("scientific functions (degrees by default)", () => {
  it("sin 30 = 0.5, cos 60 = 0.5", () => {
    expect(evaluateExpression("sin(30)")).toBeCloseTo(0.5, 10);
    expect(evaluateExpression("cos(60)")).toBeCloseTo(0.5, 10);
  });

  it("snaps cardinal angles (sin 180 = 0, cos 90 = 0)", () => {
    expect(evaluateExpression("sin(180)")).toBe(0);
    expect(evaluateExpression("cos(90)")).toBe(0);
  });

  it("tan 90 is an error (asymptote)", () => {
    expect(evaluateExpression("tan(90)")).toBeNaN();
  });

  it("radian mode works (sin(pi/2) = 1)", () => {
    expect(evaluateExpression("sin(pi/2)", "rad")).toBeCloseTo(1, 10);
  });

  it("log/ln/sqrt/cbrt/abs", () => {
    expect(evaluateExpression("log(1000)")).toBeCloseTo(3, 10);
    expect(evaluateExpression("ln(e)")).toBeCloseTo(1, 10);
    expect(evaluateExpression("sqrt(16)")).toBeCloseTo(4, 10);
    expect(evaluateExpression("cbrt(27)")).toBeCloseTo(3, 10);
    expect(evaluateExpression("abs(-7)")).toBeCloseTo(7, 10);
  });

  it("domain errors are NaN (sqrt(-1), log(0), asin(2))", () => {
    expect(evaluateExpression("sqrt(-1)")).toBeNaN();
    expect(evaluateExpression("log(0)")).toBeNaN();
    expect(evaluateExpression("asin(2)")).toBeNaN();
  });

  it("factorial: 5! = 120, rejects negatives and non-integers", () => {
    expect(evaluateExpression("5!")).toBe(120);
    expect(factorial(0)).toBe(1);
    expect(factorial(-1)).toBeNaN();
    expect(factorial(2.5)).toBeNaN();
  });
});

describe("math helpers", () => {
  it("gcd(48, 18) = 6", () => {
    expect(gcd(48, 18)).toBe(6);
  });

  it("lcm(4, 6) = 12, lcm with zero = 0", () => {
    expect(lcm(4, 6)).toBe(12);
    expect(lcm(0, 5)).toBe(0);
  });

  it("prime detection", () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(17)).toBe(true);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(100)).toBe(false);
  });

  it("quadratic x^2-5x+6 has roots 2 and 3", () => {
    const sol = solveQuadratic(1, -5, 6);
    expect(sol?.discriminant).toBeCloseTo(1, 10);
    expect(sol?.roots.map((r) => Math.round(r)).sort()).toEqual([2, 3]);
  });

  it("quadratic with negative discriminant has no real roots", () => {
    expect(solveQuadratic(1, 0, 1)?.roots).toEqual([]);
  });

  it("degrades to linear when a = 0", () => {
    expect(solveQuadratic(0, 2, -8)).toEqual({ roots: [4], discriminant: NaN, linear: true });
  });
});
