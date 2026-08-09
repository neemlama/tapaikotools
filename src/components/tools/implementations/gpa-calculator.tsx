"use client";

import { useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";
import { createRowId } from "@/lib/tools/weighted-average";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed verbatim from the Stitch "Student GPA Calculator" HTML
 * export the user pasted directly (see docs/PLAN.md #6, same literal-HTML
 * process as Base64/QR/Interest) — own display-size header with a
 * breadcrumb (via the shared ToolBreadcrumb, same as CgpaCalculatorTool),
 * its own course-row grid with a letter-grade dropdown (not a raw
 * grade-points field, unlike the old shared WeightedAverageTool this page
 * used to render — that component is now deleted, nothing else used it),
 * an optional "roll into prior CGPA" section, and its own two-card
 * "How to Calculate GPA" / "GPA vs. CGPA" info section instead of
 * ToolPageShell's standard About/FAQ. `layout: "custom"` in the registry.
 *
 * The mockup's "Calculate GPA" button has no wired-up script at all (its
 * only inline <script> just toggles the prior-CGPA section's visibility) —
 * treated the same as Interest Calculator's real Calculate button: a
 * deliberate click-to-calculate action, not a live-updating field.
 */

const tool = getToolBySlug("gpa-calculator")!;

// Standard 4.0 scale, exactly as the mockup's <select> options — A+ and A
// both map to 4.0 (a common real convention), so keyed by a synthetic id
// rather than value since two options share "4.0".
const GRADE_OPTIONS = [
  { id: "a-plus", label: "A+ (4.0)", points: 4.0 },
  { id: "a", label: "A (4.0)", points: 4.0 },
  { id: "a-minus", label: "A- (3.7)", points: 3.7 },
  { id: "b-plus", label: "B+ (3.3)", points: 3.3 },
  { id: "b", label: "B (3.0)", points: 3.0 },
  { id: "b-minus", label: "B- (2.7)", points: 2.7 },
  { id: "c-plus", label: "C+ (2.3)", points: 2.3 },
  { id: "c", label: "C (2.0)", points: 2.0 },
  { id: "c-minus", label: "C- (1.7)", points: 1.7 },
  { id: "d-plus", label: "D+ (1.3)", points: 1.3 },
  { id: "d", label: "D (1.0)", points: 1.0 },
  { id: "f", label: "F (0.0)", points: 0.0 },
];

function gradePoints(gradeId: string): number | null {
  return GRADE_OPTIONS.find((g) => g.id === gradeId)?.points ?? null;
}

interface CourseRow {
  id: string;
  name: string;
  credits: string;
  grade: string;
  namePlaceholder: string;
  creditsPlaceholder: string;
}

function seedRows(): CourseRow[] {
  return [
    { id: "seed-1", name: "", credits: "", grade: "", namePlaceholder: "e.g. Calculus I", creditsPlaceholder: "3" },
    { id: "seed-2", name: "", credits: "", grade: "", namePlaceholder: "e.g. Physics 101", creditsPlaceholder: "4" },
    { id: "seed-3", name: "", credits: "", grade: "", namePlaceholder: "e.g. English Lit", creditsPlaceholder: "3" },
  ];
}

interface Result {
  gpa: number;
  totalGradePoints: number;
  totalCredits: number;
  newCgpa: number | null;
}

const fieldClassName =
  "w-full rounded-md border border-border bg-input px-3 py-2 text-body-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary";

export function GpaCalculatorTool() {
  const [rows, setRows] = useState<CourseRow[]>(seedRows);
  const [includePrior, setIncludePrior] = useState(false);
  const [priorCredits, setPriorCredits] = useState("");
  const [priorCgpa, setPriorCgpa] = useState("");
  const [result, setResult] = useState<Result>({ gpa: 0, totalGradePoints: 0, totalCredits: 0, newCgpa: null });

  function updateRow(id: string, key: "name" | "credits" | "grade", value: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: createRowId(), name: "", credits: "", grade: "", namePlaceholder: "e.g. Course name", creditsPlaceholder: "3" },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  }

  function clearAll() {
    setRows(seedRows());
    setResult({ gpa: 0, totalGradePoints: 0, totalCredits: 0, newCgpa: null });
  }

  function handleCalculate() {
    let totalGradePoints = 0;
    let totalCredits = 0;
    for (const row of rows) {
      const credits = Number(row.credits);
      const points = gradePoints(row.grade);
      if (!Number.isFinite(credits) || credits <= 0 || points === null) continue;
      totalGradePoints += credits * points;
      totalCredits += credits;
    }
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    let newCgpa: number | null = null;
    if (includePrior) {
      const priorCreditsNum = Math.max(0, Number(priorCredits) || 0);
      const priorCgpaNum = Number(priorCgpa) || 0;
      const combinedCredits = priorCreditsNum + totalCredits;
      const combinedPoints = priorCreditsNum * priorCgpaNum + totalGradePoints;
      newCgpa = combinedCredits > 0 ? combinedPoints / combinedCredits : 0;
    }

    setResult({ gpa, totalGradePoints, totalCredits, newCgpa });
  }

  function handleExportPdf() {
    // Real browser print — choosing "Save as PDF" in the print dialog is a
    // genuine, dependency-free PDF export; no pdf library installed here.
    window.print();
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-4 py-12 md:px-10">
      {/* Header Section */}
      <section className="flex flex-col gap-4">
        <ToolBreadcrumb tool={tool} />
        <h1 className="text-display text-foreground">Student GPA Calculator</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          Calculate your semester Grade Point Average (GPA) or Cumulative GPA (CGPA) accurately based on a standard
          4.0 scale. Add your courses, credits, and grades below.
        </p>
      </section>

      {/* Calculator Interface Layout */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Course Inputs */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-surface-low px-6 py-4">
              <h2 className="text-headline-md text-foreground">Course Entries</h2>
              <button
                type="button"
                onClick={clearAll}
                // hover:underline, not hover:text-primary-hover (2026-08-09,
                // Phase B): --primary-hover is now the button-fill hover
                // shade only — as dark-mode TEXT on background it's below
                // 4.5:1 (it's a darker blue, moving toward the near-black
                // bg, not away from it). Underline gives a visible hover
                // state without depending on a second contrast-checked hue.
                className="flex items-center gap-1 text-label-sm text-primary transition-colors hover:underline"
              >
                <MaterialIcon name="clear_all" className="text-[16px]" />
                Clear All
              </button>
            </div>

            <div className="flex flex-col gap-4 p-6">
              {/* Column Headers */}
              <div className="hidden grid-cols-12 gap-4 px-2 text-label-sm text-muted-foreground sm:grid">
                <div className="col-span-5">Course Name (Optional)</div>
                <div className="col-span-3">Credits</div>
                <div className="col-span-3">Grade</div>
                <div className="col-span-1 text-center">Act</div>
              </div>

              {/* Course Rows */}
              <div className="flex flex-col gap-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className="group grid grid-cols-1 items-center gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-12 sm:gap-4 sm:border-transparent sm:bg-transparent sm:p-0 sm:rounded-none"
                  >
                    <div className="col-span-1 sm:col-span-5">
                      <label className="mb-1 block text-label-sm text-muted-foreground sm:hidden">Course Name</label>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(event) => updateRow(row.id, "name", event.target.value)}
                        placeholder={row.namePlaceholder}
                        className={fieldClassName}
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                      <label className="mb-1 block text-label-sm text-muted-foreground sm:hidden">Credits</label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={row.credits}
                        onChange={(event) => updateRow(row.id, "credits", event.target.value)}
                        placeholder={row.creditsPlaceholder}
                        className={fieldClassName}
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                      <label className="mb-1 block text-label-sm text-muted-foreground sm:hidden">Grade</label>
                      {/* aria-label, not htmlFor (2026-08-09, Phase C): the visible
                          label above is sm:hidden (desktop uses a column header
                          instead) and each row repeats, so a shared id would
                          collide — aria-label gives every row's select an
                          accessible name regardless of viewport. */}
                      <select
                        aria-label={`Grade for ${row.name || `course ${row.id}`}`}
                        value={row.grade}
                        onChange={(event) => updateRow(row.id, "grade", event.target.value)}
                        className={cn(fieldClassName, "appearance-none")}
                      >
                        <option value="" disabled>
                          Select
                        </option>
                        {GRADE_OPTIONS.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 mt-2 flex justify-end sm:col-span-1 sm:mt-0 sm:justify-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                        title="Remove course"
                        aria-label="Remove course"
                        className="rounded-md p-2 text-outline transition-colors hover:bg-destructive/10 hover:text-destructive focus:opacity-100 disabled:pointer-events-none disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <MaterialIcon name="delete" className="text-[20px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <button
                  type="button"
                  onClick={addRow}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted px-4 py-2 text-body-md font-medium text-foreground transition-colors hover:bg-accent"
                >
                  <MaterialIcon name="add" className="text-[20px]" />
                  Add Course
                </button>
                <div className="flex items-center gap-2">
                  <input
                    id="add-prior"
                    type="checkbox"
                    checked={includePrior}
                    onChange={(event) => setIncludePrior(event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="add-prior" className="cursor-pointer text-label-sm text-muted-foreground">
                    Include Prior CGPA
                  </label>
                </div>
              </div>

              {includePrior && (
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface-low p-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-label-sm text-muted-foreground">Prior Cumulative Credits</label>
                    <input
                      type="number"
                      min={0}
                      value={priorCredits}
                      onChange={(event) => setPriorCredits(event.target.value)}
                      placeholder="e.g. 45"
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-label-sm text-muted-foreground">Prior CGPA</label>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      step={0.01}
                      value={priorCgpa}
                      onChange={(event) => setPriorCgpa(event.target.value)}
                      placeholder="e.g. 3.5"
                      className={fieldClassName}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Results & Actions */}
        <div className="sticky top-24 flex flex-col gap-6 lg:col-span-4">
          {/* Results Card */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 -z-10 h-32 w-32 rounded-bl-full bg-primary opacity-5"
            />
            <div className="flex flex-col items-center justify-center gap-2 border-b border-border p-6 text-center">
              <span className="text-label-sm tracking-wider text-muted-foreground uppercase">Your Semester GPA</span>
              <div className="my-2 text-[64px] leading-none font-bold text-primary">{result.gpa.toFixed(2)}</div>
              <span className="text-body-md text-muted-foreground">Based on {result.totalCredits} credits</span>
            </div>
            <div className="flex flex-col gap-4 bg-surface-low p-6">
              <div className="flex items-center justify-between border-b border-dashed border-border py-2">
                <span className="text-body-md text-muted-foreground">Total Grade Points</span>
                <span className="font-mono text-sm font-medium text-foreground">
                  {result.totalGradePoints.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-dashed border-border py-2">
                <span className="text-body-md text-muted-foreground">Total Credits</span>
                <span className="font-mono text-sm font-medium text-foreground">{result.totalCredits}</span>
              </div>
              {result.newCgpa !== null && (
                <div className="flex items-center justify-between border-b border-dashed border-border py-2">
                  <span className="text-body-md font-medium text-foreground">New CGPA</span>
                  <span className="font-mono text-[16px] font-bold text-primary">{result.newCgpa.toFixed(2)}</span>
                </div>
              )}
              <button
                type="button"
                onClick={handleCalculate}
                className="mt-4 w-full rounded-md bg-primary-container py-3 text-body-md font-medium text-primary-foreground shadow-sm transition-[filter] hover:brightness-110"
              >
                Calculate GPA
              </button>
            </div>
          </div>

          {/* Export/Share Tools */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-label-sm text-foreground transition-colors hover:bg-surface-low"
            >
              <MaterialIcon name="download" className="text-[18px]" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-background py-2 text-label-sm text-foreground transition-colors hover:bg-surface-low"
            >
              <MaterialIcon name="link" className="text-[18px]" />
              Copy Link
            </button>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="grid grid-cols-1 gap-8 border-t border-border pt-12 md:grid-cols-2">
        {/* How to calculate */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MaterialIcon name="calculate" />
            </div>
            <h3 className="text-headline-md text-foreground">How to Calculate GPA</h3>
          </div>
          <div className="flex flex-col gap-3 text-body-md text-muted-foreground">
            <p>
              Your Grade Point Average is calculated by dividing the total number of grade points earned by the
              total number of credit hours attempted.
            </p>
            <ol className="mt-2 list-inside list-decimal space-y-2">
              <li>Multiply each course&apos;s credit hours by its grade value (e.g., A = 4.0).</li>
              <li>Add up all the resulting grade points.</li>
              <li>Add up all the credit hours.</li>
              <li>Divide total grade points by total credit hours.</li>
            </ol>
            <div className="mt-4 overflow-x-auto rounded-md bg-[#313030] p-4 font-mono text-sm text-white/90">
              <span className="text-white/50">{"// Example Formula"}</span>
              <br />
              GPA = Total Grade Points / Total Credits
              <br />
              GPA = ( (4.0 * 3) + (3.0 * 4) ) / (3 + 4)
              <br />
              GPA = 24.0 / 7 = 3.42
            </div>
          </div>
        </div>

        {/* GPA vs CGPA */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
              <MaterialIcon name="school" />
            </div>
            <h3 className="text-headline-md text-foreground">GPA vs. CGPA</h3>
          </div>
          <div className="flex flex-col gap-4 text-body-md text-muted-foreground">
            <p>While often used interchangeably, there is a distinct technical difference between the two terms:</p>
            <div className="border-l-2 border-primary py-1 pl-4">
              <strong className="mb-1 block text-foreground">Grade Point Average (GPA)</strong>
              <p className="text-sm">
                Refers to the average obtained in a specific term or semester. It only accounts for the courses
                taken during that short period.
              </p>
            </div>
            <div className="border-l-2 border-secondary py-1 pl-4">
              <strong className="mb-1 block text-foreground">Cumulative Grade Point Average (CGPA)</strong>
              <p className="text-sm">
                Refers to the overall average across all terms or semesters completed so far in your academic
                program. It is the comprehensive measure of your performance.
              </p>
            </div>
            <p className="text-sm">
              To calculate a new CGPA in this tool, check the &quot;Include Prior CGPA&quot; box and enter your
              existing cumulative data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
