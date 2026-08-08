import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve conflicting Tailwind utility
 * classes (e.g. `cn("p-2", condition && "p-4")` keeps only `p-4`).
 * Standard shadcn/ui-style helper — kept here so future shadcn components
 * drop in without modification.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
