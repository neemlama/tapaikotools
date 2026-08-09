import { cn } from "@/lib/utils";

/**
 * Monospace output block, styled with the site's normal theme tokens
 * (light/dark aware). Stitch's design spec called for a fixed dark
 * background even on the light theme, but that read as a jarring black
 * box in the actual tool pages — overridden per explicit feedback.
 *
 * No built-in copy button — Stitch's own toolbar puts copy/download icons
 * in the panel's header, not floating over the content, so those actions
 * now live in the wrapping <Panel actions={...}> instead (see each tool
 * implementation for the exact icons it uses).
 */
export function CodeOutput({
  value,
  placeholder,
  className,
  minHeight = "12rem",
  mono = true,
}: {
  value: string;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  /** Set false for plain-text output (e.g. Lorem Ipsum) that shouldn't read as code. */
  mono?: boolean;
}) {
  return (
    <pre
      style={{ minHeight }}
      className={cn(
        "overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-muted p-4 text-foreground",
        mono ? "font-mono text-sm leading-6" : "text-body-lg",
        className,
      )}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </pre>
  );
}
