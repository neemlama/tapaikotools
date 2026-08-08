import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Small pill-shaped tag, per the Stitch design system's "Data Tags" spec
 * (full/pill rounding). Named/located to match shadcn/ui's Badge so it can
 * be swapped for the real thing without call-site changes if shadcn gets
 * adopted later (see docs/PLAN.md #4).
 */
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-label-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
