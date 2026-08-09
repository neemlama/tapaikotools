"use client";

import Link from "next/link";
import { useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";

/**
 * Hand-transcribed from the Stitch "Marks & Percentage Calculator" screen —
 * `layout: "custom"` in the registry (see ToolPageShell), same call as
 * GpaCalculatorTool: its own two-column layout (calculator + info card,
 * "Standard Grading Scale" / "Related Student Tools" sidebar) doesn't fit
 * ToolPageShell's standard wrapper. The mockup's breadcrumb ("Tools >
 * Education > Marks Calculator") doesn't match this site's real category
 * taxonomy — normalized to the shared ToolBreadcrumb instead, same call
 * already made for GpaCalculatorTool/EmiCalculatorTool.
 *
 * Replaces the previous version's multi-subject running-total design (a
 * `WeightedAverageTool`-style row table) — this Stitch screen is a single
 * marks-obtained/total-marks pair that also predicts a letter grade, a
 * different tool shape entirely, not a restyle of the old one.
 *
 * The mockup's own script only computes on "Calculate" click (and hides the
 * result until then) rather than live-updating, and uses native `alert()`
 * for invalid input — kept the click-to-calculate behavior (matches
 * GpaCalculatorTool/InterestCalculatorTool's own mockups) but swapped the
 * alert() for this site's normal inline `role="alert"` message.
 *
 * "Related Student Tools" links to two *real* tools via the registry
 * (GPA Calculator, matching the mockup; Attendance Calculator in place of
 * the mockup's "Study Timer", which isn't a tool this site has) rather than
 * a dead link, pulling each card's title/description from the registry
 * itself so they can't drift out of sync with the real page.
 */

const tool = getToolBySlug("marks-percentage-calculator")!;

const GRADE_SCALE = [
  { range: "90% - 100%", grade: "A+", min: 90 },
  { range: "80% - 89%", grade: "A", min: 80 },
  { range: "70% - 79%", grade: "B", min: 70 },
  { range: "60% - 69%", grade: "C", min: 60 },
  { range: "50% - 59%", grade: "D", min: 50 },
  { range: "Below 50%", grade: "F", min: 0 },
];

function getGrade(percentage: number): string {
  return GRADE_SCALE.find((g) => percentage >= g.min)?.grade ?? "F";
}

const RELATED_TOOLS: { slug: string; icon: string }[] = [
  { slug: "gpa-calculator", icon: "calculate" },
  { slug: "attendance-calculator", icon: "event_available" },
];

const FORMULA_TEXT = "Percentage = (Marks Obtained ÷ Total Marks) × 100";

interface Result {
  percentage: number;
  grade: string;
}

export function MarksPercentageCalculatorTool() {
  const [obtainedInput, setObtainedInput] = useState("");
  const [totalInput, setTotalInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCalculate() {
    const obtained = Number.parseFloat(obtainedInput);
    const total = Number.parseFloat(totalInput);

    if (!Number.isFinite(obtained) || !Number.isFinite(total) || total === 0) {
      setError("Please enter valid numbers. Total marks cannot be zero.");
      setResult(null);
      return;
    }
    if (obtained > total) {
      setError("Marks obtained cannot be greater than total marks.");
      setResult(null);
      return;
    }

    const percentage = (obtained / total) * 100;
    setError(null);
    setResult({ percentage, grade: getGrade(percentage) });
  }

  function handleReset() {
    setObtainedInput("");
    setTotalInput("");
    setResult(null);
    setError(null);
  }

  async function handleCopyFormula() {
    await navigator.clipboard.writeText(FORMULA_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <div className="mb-8 flex flex-col gap-4">
        <ToolBreadcrumb tool={tool} />
        <div>
          <h1 className="mb-2 text-headline-lg">Marks &amp; Percentage Calculator</h1>
          <p className="max-w-2xl text-body-lg text-muted-foreground">
            Quickly calculate your exam percentage and predict your grade. Ideal for students, teachers, and
            parents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calculator + info (left) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 border-b border-border pb-2 text-headline-md">Calculate Percentage</h2>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="marksObtained" className="mb-2 block text-label-sm">
                  Marks Obtained
                </label>
                <input
                  id="marksObtained"
                  type="number"
                  placeholder="e.g. 85"
                  value={obtainedInput}
                  onChange={(event) => setObtainedInput(event.target.value)}
                  className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="totalMarks" className="mb-2 block text-label-sm">
                  Total Marks
                </label>
                <input
                  id="totalMarks"
                  type="number"
                  placeholder="e.g. 100"
                  value={totalInput}
                  onChange={(event) => setTotalInput(event.target.value)}
                  className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCalculate}
                className="w-full rounded bg-primary px-6 py-3 text-body-md font-medium text-primary-foreground transition-opacity hover:opacity-90 md:w-auto"
              >
                Calculate
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded border border-border bg-card px-6 py-3 text-body-md text-foreground transition-colors hover:bg-muted md:w-auto"
              >
                Reset
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-4 text-body-md text-destructive">
                {error}
              </p>
            )}

            {result && (
              <div className="mt-8 border-t border-border pt-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded border border-border bg-muted p-6 text-center">
                    <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                      Percentage
                    </span>
                    <span className="block text-display text-primary">{result.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="rounded border border-border bg-muted p-6 text-center">
                    <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                      Predicted Grade
                    </span>
                    <span className="block text-display text-secondary">{result.grade}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">How to Calculate Percentage</h3>
            <div className="flex flex-col gap-4 text-body-md text-muted-foreground">
              <p>Calculating your marks percentage is a simple mathematical process:</p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>Take the total marks you obtained.</li>
                <li>Divide it by the maximum possible total marks.</li>
                <li>Multiply the result by 100.</li>
              </ol>
              <div className="relative mt-4 rounded bg-[#111] p-4 font-mono text-sm text-white">
                <code>{FORMULA_TEXT}</code>
                <button
                  type="button"
                  onClick={handleCopyFormula}
                  title="Copy to clipboard"
                  aria-label="Copy formula to clipboard"
                  className="absolute top-2 right-2 rounded bg-white/10 p-1 text-white transition-colors hover:bg-white/20"
                >
                  <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[16px]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (right) */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">Standard Grading Scale</h3>
            <ul className="flex flex-col gap-3 text-body-md">
              {GRADE_SCALE.map((row, i) => (
                <li
                  key={row.grade}
                  className={i < GRADE_SCALE.length - 1 ? "flex items-center justify-between border-b border-border pb-2" : "flex items-center justify-between"}
                >
                  <span className="text-muted-foreground">{row.range}</span>
                  <span className={row.grade === "F" ? "font-bold text-destructive" : "font-bold"}>{row.grade}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">Related Student Tools</h3>
            <div className="flex flex-col gap-4">
              {RELATED_TOOLS.map(({ slug, icon }) => {
                const related = getToolBySlug(slug);
                if (!related) return null;
                return (
                  <Link
                    key={slug}
                    href={`/tools/${slug}`}
                    className="group block rounded border border-border p-3 transition-colors hover:border-primary"
                  >
                    <div className="flex items-center gap-3">
                      <MaterialIcon name={icon} className="text-primary" />
                      <div>
                        <h4 className="text-body-md font-medium text-foreground transition-colors group-hover:text-primary">
                          {related.title}
                        </h4>
                        <p className="text-label-sm text-muted-foreground">{related.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
