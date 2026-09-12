import { describe, expect, it } from "vitest";

import { searchTools, tools } from "./registry";
import { TOOL_CATEGORIES } from "./types";

describe("tool registry integrity", () => {
  it("has 24 available tools", () => {
    expect(tools).toHaveLength(24);
    expect(tools.every((t) => t.status === "available")).toBe(true);
  });

  it("slugs are unique and URL-safe", () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("every tool uses a valid category", () => {
    for (const t of tools) expect(TOOL_CATEGORIES).toContain(t.category);
  });

  it("includes the two newest tools", () => {
    const slugs = tools.map((t) => t.slug);
    expect(slugs).toContain("bmi-calculator");
    expect(slugs).toContain("percentage-calculator");
  });
});

describe("searchTools", () => {
  it("exact title match ranks first", () => {
    expect(searchTools("bmi")[0]?.slug).toBe("bmi-calculator");
  });

  it("empty query returns everything", () => {
    expect(searchTools("")).toHaveLength(24);
  });
});
