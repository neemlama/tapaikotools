import type { ToolCategoryId } from "@/lib/tools/types";

/**
 * Material Symbols icon per category — shared by Home, `/tools`, and
 * `/categories` so the same category always shows the same icon everywhere
 * it's rendered, rather than three independently-maintained copies of this
 * map drifting out of sync.
 */
export const CATEGORY_ICONS: Record<ToolCategoryId, string> = {
  "student-tools": "school",
  calculators: "calculate",
  "date-time": "calendar_month",
  "text-tools": "format_color_text",
  "developer-tools": "code",
  converters: "sync_alt",
  generators: "auto_awesome",
  finance: "account_balance_wallet",
  "image-tools": "imagesmode",
};
