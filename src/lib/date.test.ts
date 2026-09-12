import { describe, expect, it } from "vitest";

import { calculateAge, getNextBirthday, parseDateInput } from "./date";

describe("parseDateInput", () => {
  it("parses valid YYYY-MM-DD as local date", () => {
    const d = parseDateInput("2024-01-15");
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(0);
    expect(d?.getDate()).toBe(15);
  });

  it("rejects roll-over like Feb 31", () => {
    expect(parseDateInput("2024-02-31")).toBeNull();
  });

  it("rejects wrong format", () => {
    expect(parseDateInput("15-01-2024")).toBeNull();
    expect(parseDateInput("")).toBeNull();
  });
});

describe("calculateAge", () => {
  it("exact anniversary gives whole years", () => {
    const age = calculateAge(new Date(2000, 0, 1), new Date(2025, 0, 1));
    expect(age).toMatchObject({ years: 25, months: 0, days: 0 });
  });

  it("handles Jan 31 -> Mar 1 without negative days (clamped anniversary)", () => {
    const age = calculateAge(new Date(2024, 0, 31), new Date(2024, 2, 1));
    expect(age.days).toBeGreaterThanOrEqual(0);
    expect(age.months).toBe(1);
  });

  it("handles leap-day birthday", () => {
    const age = calculateAge(new Date(2020, 1, 29), new Date(2021, 1, 28));
    expect(age.years).toBe(1);
    expect(age.days).toBeGreaterThanOrEqual(0);
  });
});

describe("getNextBirthday", () => {
  it("returns this year if not yet passed", () => {
    const next = getNextBirthday(new Date(2000, 5, 15), new Date(2025, 0, 1));
    expect(next.getFullYear()).toBe(2025);
    expect(next.getMonth()).toBe(5);
  });

  it("clamps Feb 29 to Feb 28 in non-leap years", () => {
    const next = getNextBirthday(new Date(2020, 1, 29), new Date(2023, 0, 1));
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });
});
