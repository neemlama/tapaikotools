"use client";

import { useMemo, useState } from "react";

import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed verbatim from the Stitch "Attendance Calculator" HTML
 * export the user pasted directly (see docs/PLAN.md #6, same literal-HTML
 * process as Base64/QR/Interest/GPA) — own display-size header, no
 * breadcrumb, a bento grid (live status card + two independent goal-seeking
 * cards), and its own accordion FAQ instead of ToolPageShell's standard
 * wrapper. `layout: "custom"` in the registry, same treatment as
 * CgpaCalculatorTool / AgeCalculatorTool.
 *
 * The main percentage/status card is live (the mockup's own script wires
 * total/attended to an `input` listener, recalculating on every keystroke).
 * The two goal-seeking cards ("Reach a Target" / "Safe to Miss") are each
 * click-to-calculate against their own separate button — the mockup only
 * wires those to `click`, and each keeps its own hidden-until-calculated
 * result box — matching Interest/GPA's Calculate-button precedent for
 * exactly this "explicit button, no live script" shape.
 *
 * This page's own container uses a flat `px-margin-desktop` in the mockup
 * (no mobile step-down, unlike literally every other converted page and
 * the shared Header/Footer) — treated as generation drift, not a deliberate
 * choice, and normalized to this site's standard `px-4 md:px-10` so it
 * doesn't cramp small screens. Kept the mockup's `py-16` (taller than the
 * usual `py-12`) since that one's a harmless, self-consistent value.
 */

const GRID_COLS = "grid-cols-1 md:grid-cols-12"; // this mockup's bento grid breaks at md, not lg like its siblings

type Status = "invalid" | "onTrack" | "warning" | "critical";

const STATUS_CONFIG: Record<
  Status,
  { label: string; icon: string; badgeClassName: string; textClassName: string }
> = {
  invalid: {
    label: "Invalid Input",
    icon: "warning",
    badgeClassName: "bg-destructive/10 text-destructive",
    textClassName: "text-muted-foreground",
  },
  onTrack: {
    label: "On Track",
    icon: "check_circle",
    badgeClassName: "bg-primary/10 text-primary",
    textClassName: "text-primary",
  },
  warning: {
    label: "Warning",
    icon: "error",
    badgeClassName: "bg-tertiary/10 text-tertiary",
    textClassName: "text-tertiary",
  },
  critical: {
    label: "Critical",
    icon: "dangerous",
    badgeClassName: "bg-destructive/10 text-destructive",
    textClassName: "text-destructive",
  },
};

type TargetResult =
  | { type: "already"; target: number }
  | { type: "impossible" }
  | { type: "needed"; count: number; target: number };

type MissResult = { type: "atOrBelow"; min: number } | { type: "canMiss"; count: number; min: number };

const FAQ_ITEMS = [
  {
    question: "What is the standard minimum attendance requirement?",
    answer:
      "While policies vary by institution, a 75% minimum is standard across many universities globally to qualify for final examinations. Always check your specific department's handbook.",
  },
  {
    question: "How is the 'Target Percentage' calculated?",
    answer: (
      <>
        The tool assumes you will attend every single upcoming class. It solves the equation{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
          (Attended + x) / (Total + x) = Target / 100
        </code>{" "}
        to find the minimum number of consecutive classes required.
      </>
    ),
  },
];

export function AttendanceCalculatorTool() {
  const [total, setTotal] = useState("40");
  const [attended, setAttended] = useState("32");
  const [targetPercentage, setTargetPercentage] = useState("85");
  const [minPercentage, setMinPercentage] = useState("75");
  const [targetResult, setTargetResult] = useState<TargetResult | null>(null);
  const [missResult, setMissResult] = useState<MissResult | null>(null);

  const standing = useMemo(() => {
    const totalNum = parseInt(total, 10) || 0;
    const attendedNum = parseInt(attended, 10) || 0;
    if (totalNum === 0 || attendedNum > totalNum) {
      return { status: "invalid" as Status, percentage: null as number | null };
    }
    const percentage = (attendedNum / totalNum) * 100;
    const status: Status = percentage >= 75 ? "onTrack" : percentage >= 60 ? "warning" : "critical";
    return { status, percentage };
  }, [total, attended]);

  const statusConfig = STATUS_CONFIG[standing.status];

  function handleCalcTarget() {
    const totalNum = parseInt(total, 10) || 0;
    const attendedNum = parseInt(attended, 10) || 0;
    const target = Number(targetPercentage) || 0;
    if (totalNum === 0) return;

    const currentPct = (attendedNum / totalNum) * 100;
    if (currentPct >= target) {
      setTargetResult({ type: "already", target });
    } else if (target >= 100) {
      setTargetResult({ type: "impossible" });
    } else {
      const needed = Math.ceil((totalNum * target - attendedNum * 100) / (100 - target));
      setTargetResult({ type: "needed", count: needed, target });
    }
  }

  function handleCalcMiss() {
    const totalNum = parseInt(total, 10) || 0;
    const attendedNum = parseInt(attended, 10) || 0;
    const minTarget = Number(minPercentage) || 0;
    if (totalNum === 0 || minTarget <= 0) return;

    const currentPct = (attendedNum / totalNum) * 100;
    if (currentPct <= minTarget) {
      setMissResult({ type: "atOrBelow", min: minTarget });
    } else {
      const canMiss = Math.floor((attendedNum * 100 - totalNum * minTarget) / minTarget);
      setMissResult({ type: "canMiss", count: Math.max(0, canMiss), min: minTarget });
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-10">
      {/* Header */}
      <header className="mb-12 max-w-2xl">
        <h1 className="mb-4 text-display text-foreground">Attendance Calculator</h1>
        <p className="text-body-lg text-muted-foreground">
          Precisely track your academic standing. Input your current classes to calculate your percentage and
          forecast future attendance goals to stay on track.
        </p>
      </header>

      {/* Bento Grid Layout */}
      <div className={cn("mb-24 grid gap-6", GRID_COLS)}>
        {/* Primary Calculator */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-8 shadow-sm md:col-span-7">
          <div>
            <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-headline-md text-foreground">Current Standing</h2>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1 text-label-sm",
                  statusConfig.badgeClassName,
                )}
              >
                <MaterialIcon name={statusConfig.icon} className="text-[14px]" />
                {statusConfig.label}
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="totalClasses" className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                  Total Classes Conducted
                </label>
                <input
                  id="totalClasses"
                  type="number"
                  min={1}
                  value={total}
                  onChange={(event) => setTotal(event.target.value)}
                  placeholder="e.g., 40"
                  className="w-full rounded border border-border bg-background p-3 font-mono text-sm text-foreground transition-shadow outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="attendedClasses" className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                  Classes Attended
                </label>
                <input
                  id="attendedClasses"
                  type="number"
                  min={0}
                  value={attended}
                  onChange={(event) => setAttended(event.target.value)}
                  placeholder="e.g., 32"
                  className="w-full rounded border border-border bg-background p-3 font-mono text-sm text-foreground transition-shadow outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-low p-6 text-center">
            <p className="mb-2 text-label-sm text-muted-foreground uppercase">Your Attendance Percentage</p>
            <div className={cn("text-display tracking-tight", statusConfig.textClassName)}>
              {standing.percentage === null ? "--%" : `${standing.percentage.toFixed(1)}%`}
            </div>
          </div>
        </div>

        {/* Goal Seeking Tools */}
        <div className="flex flex-col gap-6 md:col-span-5">
          {/* Reach a Target */}
          <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-headline-md text-foreground">
              <MaterialIcon name="trending_up" className="text-secondary" />
              Reach a Target
            </h3>
            <p className="mb-6 text-body-md text-muted-foreground">
              Calculate how many consecutive classes you need to attend to hit your desired percentage.
            </p>
            <div className="mb-4">
              <label htmlFor="targetPercentage" className="mb-2 block text-label-sm text-muted-foreground">
                TARGET PERCENTAGE (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="targetPercentage"
                  type="number"
                  min={1}
                  max={100}
                  value={targetPercentage}
                  onChange={(event) => setTargetPercentage(event.target.value)}
                  className="w-24 rounded border border-border bg-background p-2 font-mono text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleCalcTarget}
                  className="flex-1 rounded border border-border bg-background px-4 py-2 text-label-sm text-foreground transition-colors hover:bg-accent"
                >
                  Calculate
                </button>
              </div>
            </div>
            {targetResult && (
              <div className="rounded border border-primary/30 bg-primary/10 p-4 text-body-md text-foreground">
                {targetResult.type === "already" && (
                  <>
                    You are already above <strong>{targetResult.target}%</strong>.
                  </>
                )}
                {targetResult.type === "impossible" && (
                  <>It is mathematically impossible to reach 100% if you&apos;ve missed a class.</>
                )}
                {targetResult.type === "needed" && (
                  <>
                    You need to attend <strong>{targetResult.count}</strong> more consecutive classes to reach{" "}
                    {targetResult.target}%.
                  </>
                )}
              </div>
            )}
          </div>

          {/* Safe to Miss */}
          <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-headline-md text-foreground">
              <MaterialIcon name="beach_access" className="text-tertiary" />
              Safe to Miss
            </h3>
            <p className="mb-6 text-body-md text-muted-foreground">
              Find out how many classes you can skip while staying above a minimum threshold.
            </p>
            <div className="mb-4">
              <label htmlFor="minPercentage" className="mb-2 block text-label-sm text-muted-foreground">
                MINIMUM THRESHOLD (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="minPercentage"
                  type="number"
                  min={1}
                  max={100}
                  value={minPercentage}
                  onChange={(event) => setMinPercentage(event.target.value)}
                  className="w-24 rounded border border-border bg-background p-2 font-mono text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleCalcMiss}
                  className="flex-1 rounded border border-border bg-background px-4 py-2 text-label-sm text-foreground transition-colors hover:bg-accent"
                >
                  Calculate
                </button>
              </div>
            </div>
            {missResult && (
              <div className="rounded border border-tertiary/30 bg-tertiary/10 p-4 text-body-md text-foreground">
                {missResult.type === "atOrBelow" && (
                  <>
                    You are at or below <strong>{missResult.min}%</strong>. You cannot miss any more classes.
                  </>
                )}
                {missResult.type === "canMiss" &&
                  (missResult.count > 0 ? (
                    <>
                      You can miss <strong>{missResult.count}</strong> upcoming classes and still stay above{" "}
                      {missResult.min}%.
                    </>
                  ) : (
                    <>
                      If you miss the next class, you will drop below <strong>{missResult.min}%</strong>.
                    </>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <section className="max-w-3xl border-t border-border pt-16">
        <h2 className="mb-8 text-headline-lg text-foreground">Frequently Asked Questions</h2>
        <div className="flex flex-col gap-6">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-outline [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-headline-md text-foreground transition-colors group-hover:text-primary">
                {item.question}
                <MaterialIcon
                  name="expand_more"
                  className="shrink-0 text-muted-foreground transition duration-300 group-open:-rotate-180"
                />
              </summary>
              <p className="mt-2 text-body-md text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
