import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * A styled native checkbox (accent-color, not a custom-drawn box). Native
 * checkboxes are already keyboard/screen-reader accessible with zero extra
 * JS, which is enough for this site's simple toggle needs — see
 * docs/PLAN.md #4 for why Radix/shadcn isn't pulled in yet.
 */
export function Checkbox({
  className,
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-body-md text-foreground">
      <input
        type="checkbox"
        id={id}
        className={cn(
          "h-4 w-4 rounded-sm border border-border accent-primary focus:outline-none focus:ring-2 focus:ring-ring",
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
}
