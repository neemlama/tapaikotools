"use client";

import { useState } from "react";

import { LineAreaChart } from "@/components/tools/line-area-chart";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { calculateCompoundInterest, calculateSimpleInterest, projectInterestGrowth } from "@/lib/tools/finance";
import { getToolBySlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed verbatim from the Stitch "Interest Calculator" HTML
 * export the user pasted directly (see docs/PLAN.md #6, same literal-HTML
 * process as Home/Base64/QR) — own display-size header, and no
 * About/FAQ/related-tools section at all below the calculator+chart grid.
 * `layout: "custom"` in the registry, same treatment as CgpaCalculatorTool.
 *
 * The mockup has a real "Calculate" button (not a live-updating field, per
 * the mockup's own script only recalculating on button click / tab switch)
 * — matches Base64's Encode/Decode action-button pattern, not QR's live
 * preview (QR's mockup copy explicitly says "updates in real-time"; this
 * one doesn't). The chart replaces the mockup's Chart.js canvas with the
 * dataviz-skill hand-rolled LineAreaChart used elsewhere in this codebase
 * (see that file for why: no chart.js/recharts dependency exists here).
 *
 * Breadcrumb added after launch (2026-08-09): the literal Stitch export had
 * none, so this page originally shipped without one — but that left it
 * inconsistent with EmiCalculatorTool/InvestmentCalculatorTool (same
 * Finance category, both have one), which a user caught in review. Added
 * the shared `ToolBreadcrumb` for consistency within the category rather
 * than leaving the gap.
 */

const tool = getToolBySlug("interest-calculator")!;

const FREQUENCIES = {
  "1": "Annually (1/yr)",
  "2": "Semi-Annually (2/yr)",
  "4": "Quarterly (4/yr)",
  "12": "Monthly (12/yr)",
  "365": "Daily (365/yr)",
} as const;
type FrequencyKey = keyof typeof FREQUENCIES;
type Mode = "simple" | "compound";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatAxisCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

interface Result {
  interest: number;
  total: number;
  chartData: { label: string; value: number }[];
}

export function InterestCalculatorTool() {
  const [mode, setMode] = useState<Mode>("simple");
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("5");
  const [time, setTime] = useState("10");
  const [frequency, setFrequency] = useState<FrequencyKey>("12");

  function computeResult(activeMode: Mode): Result {
    const p = Math.max(0, Number(principal) || 0);
    const r = Number(rate) || 0;
    const t = Math.max(0, Math.round(Number(time) || 0));
    const n = Number(frequency) || 1;

    const interest =
      activeMode === "simple" ? calculateSimpleInterest(p, r, t) : calculateCompoundInterest(p, r, t, n);
    const points = projectInterestGrowth({ mode: activeMode, principal: p, ratePercent: r, years: t, compoundsPerYear: n });

    return {
      interest,
      total: p + interest,
      chartData: points.map((point) => ({ label: `Year ${point.year}`, value: point.value })),
    };
  }

  const [result, setResult] = useState<Result>(() => computeResult("simple"));

  function handleModeChange(next: Mode) {
    setMode(next);
    setResult(computeResult(next));
  }

  function handleCalculate() {
    setResult(computeResult(mode));
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <header className="mb-12">
        <ToolBreadcrumb tool={tool} />
        <h1 className="text-display mt-4 mb-4 text-foreground">Interest Calculator</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          Calculate simple and compound interest to understand how your money grows over time. A vital tool for
          personal finance planning.
        </p>
      </header>

      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Calculator Input Column */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="flex flex-col gap-6 rounded-md border border-border bg-card p-6">
            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => handleModeChange("simple")}
                className={cn(
                  "flex-1 py-3 text-center text-body-md transition-colors",
                  mode === "simple"
                    ? "border-b-2 border-primary font-semibold text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                Simple Interest
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("compound")}
                className={cn(
                  "flex-1 py-3 text-center text-body-md transition-colors",
                  mode === "compound"
                    ? "border-b-2 border-primary font-semibold text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                Compound Interest
              </button>
            </div>

            {/* Form Inputs */}
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="principal" className="mb-1 block text-label-sm text-muted-foreground">
                  Principal Amount ($)
                </label>
                <input
                  id="principal"
                  type="number"
                  min={0}
                  step={100}
                  value={principal}
                  onChange={(event) => setPrincipal(event.target.value)}
                  className="w-full rounded border border-border bg-input px-3 py-2 text-body-md text-foreground transition-colors focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rate" className="mb-1 block text-label-sm text-muted-foreground">
                    Interest Rate (%)
                  </label>
                  <input
                    id="rate"
                    type="number"
                    min={0}
                    step={0.1}
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                    className="w-full rounded border border-border bg-input px-3 py-2 text-body-md text-foreground transition-colors focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="time" className="mb-1 block text-label-sm text-muted-foreground">
                    Time Period (Years)
                  </label>
                  <input
                    id="time"
                    type="number"
                    min={1}
                    step={1}
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="w-full rounded border border-border bg-input px-3 py-2 text-body-md text-foreground transition-colors focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              {mode === "compound" && (
                <div>
                  <label htmlFor="frequency" className="mb-1 block text-label-sm text-muted-foreground">
                    Compounding Frequency
                  </label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value as FrequencyKey)}
                    className="w-full rounded border border-border bg-input px-3 py-2 text-body-md text-foreground focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {(Object.keys(FREQUENCIES) as FrequencyKey[]).map((key) => (
                      <option key={key} value={key}>
                        {FREQUENCIES[key]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCalculate}
              className="mt-2 w-full rounded bg-primary px-5 py-2.5 text-body-md font-medium text-primary-foreground transition-[filter] hover:brightness-110"
            >
              Calculate
            </button>
          </div>
        </div>

        {/* Results & Chart Column */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md bg-surface-low p-6">
              <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                Total Interest
              </span>
              <div className="text-headline-lg text-primary">{formatCurrency(result.interest)}</div>
            </div>
            <div className="rounded-md bg-surface-low p-6">
              <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                Total Final Amount
              </span>
              <div className="text-headline-lg text-foreground">{formatCurrency(result.total)}</div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex min-h-[300px] flex-grow flex-col rounded-md border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-headline-md text-foreground">Growth Projection</h3>
              <MaterialIcon name="show_chart" className="text-muted-foreground" />
            </div>
            <div className="flex-grow">
              <LineAreaChart
                data={result.chartData}
                formatValue={formatAxisCurrency}
                ariaLabel="Interest growth projection by year"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
