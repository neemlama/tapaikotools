import { cn } from "@/lib/utils";

/**
 * Material Symbols Outlined ligature icon — Stitch's icon system. Used
 * specifically for content translated directly from a Stitch page (see
 * docs/PLAN.md), where matching the exact icon glyph matters more than
 * consistency with the lucide-react icons used in already-built chrome.
 */
export function MaterialIcon({
  name,
  className,
  filled = false,
}: {
  /** Material Symbols icon name, e.g. "search", "data_object". */
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("material-symbols-outlined select-none", className)}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}` }}
    >
      {name}
    </span>
  );
}
