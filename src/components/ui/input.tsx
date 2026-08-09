import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Field style per the design spec: --input fill, 2px solid ring on focus, no offset. */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-input px-3 text-body-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
