import type { LucideIcon } from "lucide-react";

/**
 * The 8 categories shown on the Stitch Home screen. Order here is the
 * canonical display order used anywhere categories are listed.
 */
export const TOOL_CATEGORIES = [
  "student-tools",
  "calculators",
  "date-time",
  "text-tools",
  "developer-tools",
  "converters",
  "generators",
  "finance",
] as const;

export type ToolCategoryId = (typeof TOOL_CATEGORIES)[number];

export interface ToolCategory {
  id: ToolCategoryId;
  label: string;
  description: string;
}

export interface Tool {
  /** URL slug — the page will live at /tools/{slug} */
  slug: string;
  title: string;
  description: string;
  category: ToolCategoryId;
  icon: LucideIcon;
  /**
   * Every tool starts as "coming-soon" until its page is built (Phase 2/3).
   * The registry is intentionally metadata-only right now — see docs/PLAN.md.
   */
  status: "available" | "coming-soon";
}
