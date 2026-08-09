import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Hero treatment for a calculator's headline result — solid primary
 * background, large white number. Matches Stitch's calculator screens
 * (e.g. CGPA's blue "Results" card) rather than a plain bordered tile.
 * Use MiniStat for secondary/supporting numbers alongside it.
 *
 * `bg-primary-button`, not `bg-primary` (2026-08-09, Phase B) — this is a
 * white-text-on-fill use, the button-optimized token. See globals.css.
 *
 * Label/note text is full-opacity `text-primary-foreground`, not a /70
 * translucent variant (2026-08-09, Phase B): against dark mode's
 * --primary-button (#2f75c9), even /90 white only reaches 4.09:1 — full
 * opacity is the only reduction level that clears 4.5:1 on that fill.
 * Hierarchy against the headline `value` still reads via size/weight
 * (text-label-sm vs text-display) instead of opacity.
 */
export function ResultCard({
  label,
  value,
  note,
  className,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-primary-button p-6 text-center text-primary-foreground", className)}>
      <p className="text-label-sm text-primary-foreground">{label}</p>
      <p className="mt-1 text-display">{value}</p>
      {note && <p className="mt-1 text-body-md text-primary-foreground">{note}</p>}
    </div>
  );
}

/** Plain bordered tile for a secondary/supporting stat — the one shared version of what used to be a local `Stat` copy in 7 different tool files. */
export function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-headline-md">{value}</p>
      <p className="mt-1 text-label-sm text-muted-foreground">{label}</p>
    </div>
  );
}
