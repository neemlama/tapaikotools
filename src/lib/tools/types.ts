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
  /** Surfaced in the Home page's popular-tools shortcuts. */
  popular?: boolean;
  /**
   * 1-2 sentence "about this tool" copy, rendered automatically by
   * ToolPageShell on every tool page — see docs/PLAN.md #6. Data-driven so
   * adding it never requires touching a tool's own implementation file.
   */
  about?: string;
  /**
   * "standard" (default when omitted) renders inside ToolPageShell's usual
   * breadcrumb + header + about/FAQ/related-tools wrapper. "custom" hands
   * the whole page over to the tool's own implementation component instead
   * — for tools whose Stitch design has its own header treatment, its own
   * info/FAQ layout, or simply no breadcrumb/related-tools section, and
   * needs to be transcribed exactly rather than poured into the shared
   * shell. See CgpaCalculatorTool for the reference example.
   */
  layout?: "standard" | "custom";
}
