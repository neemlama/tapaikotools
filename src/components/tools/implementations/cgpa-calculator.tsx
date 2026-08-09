"use client";

import { Download, Plus, X } from "lucide-react";
import { useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getToolBySlug } from "@/lib/tools/registry";
import { createRowId, type WeightedRow } from "@/lib/tools/weighted-average";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed from the Stitch "CGPA Calculator" screen — this page has
 * `layout: "custom"` in the registry (see ToolPageShell) because its Stitch
 * design has its own header and its own info/FAQ layout, neither of which
 * fit the shared shell. GPA Calculator keeps using the shared
 * `WeightedAverageTool` (same underlying math, plain design) — only this
 * page needed the standalone treatment.
 *
 * Stitch's own design omitted a breadcrumb, but it was asked for
 * afterwards — added back via the same `ToolBreadcrumb` the standard shell
 * uses, so it stays byte-for-byte consistent with every other tool page.
 */
const tool = getToolBySlug("cgpa-calculator")!;

type Mode = "semester" | "course";

const MODE_COPY: Record<Mode, { rowLabel: string; rowPlaceholder: string; addLabel: string; toggleLabel: string }> = {
  semester: {
    rowLabel: "Semester",
    rowPlaceholder: "e.g. Fall 2024",
    addLabel: "Add Semester",
    toggleLabel: "Semester-wise (SGPA)",
  },
  course: {
    rowLabel: "Course",
    rowPlaceholder: "e.g. Data Structures",
    addLabel: "Add Course",
    toggleLabel: "Course-wise (Grades)",
  },
};

function seedRows(): WeightedRow[] {
  return [
    { id: "seed-1", label: "Semester 1", weight: "21", value: "8.5" },
    { id: "seed-2", label: "Semester 2", weight: "18", value: "9.1" },
    { id: "seed-3", label: "Semester 3", weight: "", value: "" },
  ];
}

function buildReport(mode: Mode, rows: WeightedRow[], totalCredits: number, totalPoints: number, cgpa: number) {
  const copy = MODE_COPY[mode];
  const lines = [
    "CGPA Report",
    `Generated: ${new Date().toLocaleDateString()}`,
    "",
    `${copy.rowLabel}\tCredits\t${mode === "semester" ? "SGPA" : "Grade"}`,
    ...rows.map((row) => `${row.label || "—"}\t${row.weight || "—"}\t${row.value || "—"}`),
    "",
    `Total Credits: ${totalCredits}`,
    `Total Points: ${totalPoints.toFixed(2)}`,
    `CGPA: ${cgpa.toFixed(2)}`,
  ];
  return lines.join("\n");
}

export function CgpaCalculatorTool() {
  const [mode, setMode] = useState<Mode>("semester");
  const [rows, setRows] = useState<WeightedRow[]>(seedRows);

  function updateRow(id: string, key: "label" | "weight" | "value", value: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: createRowId(), label: "", weight: "", value: "" }]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  }

  function clearAll() {
    setRows([{ id: createRowId(), label: "", weight: "", value: "" }]);
  }

  const validRows = rows.filter(
    (row) => Number(row.weight) > 0 && row.value !== "" && Number.isFinite(Number(row.value)),
  );
  const hasValidData = validRows.length > 0;
  const totalCredits = validRows.reduce((sum, row) => sum + Number(row.weight), 0);
  const totalPoints = validRows.reduce((sum, row) => sum + Number(row.weight) * Number(row.value), 0);
  const cgpa = totalCredits === 0 ? 0 : totalPoints / totalCredits;

  const copy = MODE_COPY[mode];

  function handleExport() {
    const report = buildReport(mode, rows, totalCredits, totalPoints, cgpa);
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cgpa-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="w-full py-12 md:py-24">
      {/* Breadcrumb — left-aligned regardless of viewport, unlike the
          header below it, since breadcrumbs read left-to-right */}
      <div className="mx-auto mb-6 max-w-[1200px] px-4 md:px-10">
        <ToolBreadcrumb tool={tool} />
      </div>

      {/* Header */}
      <header className="mx-auto mb-12 max-w-[1200px] px-4 text-center md:px-10 md:text-left">
        <h1 className="text-display text-foreground mb-4">CGPA Calculator</h1>
        <p className="text-body-lg text-muted-foreground mx-auto max-w-2xl md:mx-0">
          Accurately calculate your Cumulative Grade Point Average based on semesters or individual courses. Built
          for students who need precision without the clutter.
        </p>
      </header>

      {/* Calculator layout */}
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 md:px-10 lg:grid-cols-12 lg:items-start">
        {/* Left column: input form */}
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm lg:col-span-8">
          {/* Toggle header */}
          <div className="flex gap-4 border-b border-border bg-muted p-4">
            {(Object.keys(MODE_COPY) as Mode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={cn(
                  "flex-1 rounded-md px-4 py-2 text-center text-label-sm transition-colors",
                  mode === option
                    ? "border-2 border-primary bg-card font-semibold text-primary"
                    : "border border-border bg-card font-medium text-muted-foreground hover:bg-muted",
                )}
              >
                {MODE_COPY[option].toggleLabel}
              </button>
            ))}
          </div>

          {/* Data entry area */}
          <div className="p-6">
            <div className="mb-2 grid grid-cols-12 gap-4 px-2 text-label-sm text-muted-foreground">
              <div className="col-span-5 md:col-span-6">{copy.rowLabel}</div>
              <div className="col-span-3">Credits</div>
              <div className="col-span-3 md:col-span-2">{mode === "semester" ? "SGPA" : "Grade"}</div>
              <div className="col-span-1 text-center" />
            </div>

            <div className="mb-6 flex flex-col gap-3">
              {rows.map((row, index) => (
                <div key={row.id} className="group grid grid-cols-12 items-center gap-4">
                  <div className="col-span-5 md:col-span-6">
                    <Input
                      type="text"
                      value={row.label}
                      onChange={(event) => updateRow(row.id, "label", event.target.value)}
                      placeholder={`${copy.rowLabel === "Semester" ? "e.g. Fall" : "e.g. Data Structures"} ${index + 1}`}
                      className="h-auto rounded bg-card py-2"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      value={row.weight}
                      onChange={(event) => updateRow(row.id, "weight", event.target.value)}
                      placeholder="0"
                      className="h-auto rounded bg-card py-2"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={row.value}
                      onChange={(event) => updateRow(row.id, "value", event.target.value)}
                      placeholder="0.0"
                      className="h-auto rounded bg-card py-2"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      aria-label="Remove row"
                      className="p-1 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:text-destructive focus:opacity-100 disabled:pointer-events-none disabled:opacity-0"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-4 border-t border-border pt-6">
              <Button variant="secondary" onClick={addRow} className="rounded bg-muted">
                <Plus className="h-[18px] w-[18px]" />
                {copy.addLabel}
              </Button>
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto rounded border border-border bg-card px-4 py-2 text-label-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Right column: results panel */}
        <div className="lg:sticky lg:top-24 lg:col-span-4">
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl bg-primary p-6 text-primary-foreground shadow-sm">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"
            />
            <h2 className="mb-6 text-headline-md font-semibold">Results</h2>
            <div className="mb-6 flex flex-col items-center justify-center border-b border-white/20 py-8">
              <span className="mb-2 text-label-sm tracking-wider text-white/70 uppercase">Estimated CGPA</span>
              <div className="text-[64px] leading-none font-bold tracking-tight">
                {hasValidData ? cgpa.toFixed(2) : "—"}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-body-md text-white/80">Total Credits</span>
                <span className="text-headline-md font-semibold">{hasValidData ? totalCredits : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body-md text-white/80">Total Points</span>
                <span className="text-headline-md font-semibold">
                  {hasValidData ? totalPoints.toFixed(2) : "—"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={!hasValidData}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded bg-white px-4 py-3 text-label-sm font-bold text-primary transition-colors hover:bg-card disabled:pointer-events-none disabled:opacity-50"
            >
              <Download className="h-[18px] w-[18px]" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Information & instructions */}
      <div className="mx-auto mt-24 max-w-[1200px] px-4 md:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-6 text-headline-lg text-foreground">How is CGPA Calculated?</h3>
            <p className="mb-4 text-body-md text-muted-foreground">
              The Cumulative Grade Point Average (CGPA) is the weighted average of all your semesters. It is
              calculated by dividing the sum of total grade points earned across all semesters by the total number
              of credits attempted.
            </p>
            <div className="relative mb-4 rounded-lg bg-[#313030] p-4 font-mono text-sm text-white/90">
              CGPA = Σ (Semester Credits × SGPA) / Σ (Total Credits)
            </div>
            <p className="text-body-md text-muted-foreground">
              For course-wise calculation, replace SGPA with individual course grades and semester credits with
              course credits. Most universities utilize a 10-point scale, though some use a 4.0 scale.
            </p>
          </div>

          <div>
            <h3 className="mb-6 text-headline-lg text-foreground">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <h4 className="mb-2 text-headline-md text-foreground">
                  What is the difference between SGPA and CGPA?
                </h4>
                <p className="text-body-md text-muted-foreground">
                  SGPA (Semester Grade Point Average) measures your performance in a single semester, while CGPA
                  (Cumulative Grade Point Average) is the overall average across all completed semesters.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background p-4">
                <h4 className="mb-2 text-headline-md text-foreground">Can I convert CGPA to a percentage?</h4>
                <p className="text-body-md text-muted-foreground">
                  Yes, though the formula varies by university. A common standard formulation (often used by CBSE
                  and Indian universities) is to multiply the CGPA by 9.5 to get the approximate percentage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
