import { CopyButton } from "@/components/tools/copy-button";
import { cn } from "@/lib/utils";

/**
 * Monospace output block, styled with the site's normal theme tokens
 * (light/dark aware). Stitch's design spec called for a fixed dark
 * background even on the light theme, but that read as a jarring black
 * box in the actual tool pages — overridden per explicit feedback.
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
    <div className={cn("relative rounded-md border border-border bg-muted", className)}>
      {value && (
        <div className="absolute right-2 top-2">
          <CopyButton value={value} />
        </div>
      )}
      <pre
        style={{ minHeight }}
        className={cn(
          "overflow-auto whitespace-pre-wrap break-words p-4 pr-14 text-foreground",
          mono ? "font-mono text-sm leading-6" : "text-body-lg",
        )}
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </pre>
    </div>
  );
}
