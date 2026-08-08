import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Card container for a params/output block — 1px border, 24px radius,
 * 24px padding, optional header with a bottom-border separating it from
 * content. Matches the Stitch design system's Cards spec exactly.
 */
export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-6 py-4">
          {title && <h2 className="text-headline-md">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
