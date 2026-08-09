import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Hero treatment for a calculator's headline result — solid primary
 * background, large white number. Matches Stitch's calculator screens
 * (e.g. CGPA's blue "Results" card) rather than a plain bordered tile.
 * Use MiniStat for secondary/supporting numbers alongside it.
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
    <div className={cn("rounded-xl bg-primary p-6 text-center text-primary-foreground", className)}>
      <p className="text-label-sm text-primary-foreground/70">{label}</p>
      <p className="mt-1 text-display">{value}</p>
      {note && <p className="mt-1 text-body-md text-primary-foreground/70">{note}</p>}
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
