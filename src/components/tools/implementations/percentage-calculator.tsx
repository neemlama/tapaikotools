"use client";

import Link from "next/link";
import { useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";

const tool = getToolBySlug("percentage-calculator")!;

type Mode = "percent-of" | "what-percent" | "change" | "discount";

const MODES: { id: Mode; label: string }[] = [
  { id: "percent-of", label: "X% of Y" },
  { id: "what-percent", label: "X is what % of Y" },
  { id: "change", label: "% Change" },
  { id: "discount", label: "Discount" },
];

const COMMON = [
  { label: "10% of 100", value: "10" },
  { label: "15% tip on 50", value: "7.5" },
  { label: "20% off 200", value: "160 sale" },
  { label: "25% of 80", value: "20" },
];

const RELATED_TOOLS: { slug: string; icon: string }[] = [
  { slug: "marks-percentage-calculator", icon: "percent" },
  { slug: "bmi-calculator", icon: "favorite" },
];

function getLabels(mode: Mode): { aLabel: string; bLabel: string; aPlaceholder: string; bPlaceholder: string } {
  switch (mode) {
    case "percent-of":
      return { aLabel: "Percentage (X %)", bLabel: "Value (Y)", aPlaceholder: "e.g. 20", bPlaceholder: "e.g. 150" };
    case "what-percent":
      return { aLabel: "Part (X)", bLabel: "Whole (Y)", aPlaceholder: "e.g. 30", bPlaceholder: "e.g. 120" };
    case "change":
      return { aLabel: "Old value", bLabel: "New value", aPlaceholder: "e.g. 50", bPlaceholder: "e.g. 75" };
    case "discount":
      return { aLabel: "Original price", bLabel: "Discount %", aPlaceholder: "e.g. 200", bPlaceholder: "e.g. 25" };
  }
}

const FORMULA_TEXT = "X% of Y = (X ÷ 100) × Y";

export function PercentageCalculatorTool() {
  const [mode, setMode] = useState<Mode>("percent-of");
  const [aInput, setAInput] = useState("");
  const [bInput, setBInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [subResult, setSubResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCalculate() {
    const a = Number.parseFloat(aInput);
    const b = Number.parseFloat(bInput);

    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setError("Please enter valid numbers in both fields.");
      setResult(null);
      setSubResult(null);
      return;
    }

    let main = "";
    let sub: string | null = null;

    if (mode === "percent-of") {
      main = `${((a / 100) * b).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      sub = `${a}% of ${b} = ${main}`;
    } else if (mode === "what-percent") {
      if (b === 0) {
        setError("Whole (Y) cannot be zero.");
        setResult(null);
        setSubResult(null);
        return;
      }
      const pct = (a / b) * 100;
      main = `${pct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
      sub = `${a} is ${main} of ${b}`;
    } else if (mode === "change") {
      if (a === 0) {
        setError("Old value cannot be zero for % change.");
        setResult(null);
        setSubResult(null);
        return;
      }
      const pct = ((b - a) / Math.abs(a)) * 100;
      const dir = pct > 0 ? "increase" : pct < 0 ? "decrease" : "no change";
      main = `${pct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
      sub = `${dir} from ${a} to ${b} (${(b - a).toLocaleString(undefined, { maximumFractionDigits: 2 })} difference)`;
    } else {
      if (a < 0 || b < 0 || b > 100) {
        setError("Enter a valid price and a discount between 0 and 100.");
        setResult(null);
        setSubResult(null);
        return;
      }
      const savings = (a * b) / 100;
      const sale = a - savings;
      main = `${sale.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
      sub = `You save ${savings.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${b}% off ${a})`;
    }

    setError(null);
    setResult(main);
    setSubResult(sub);
  }

  function handleReset() {
    setAInput("");
    setBInput("");
    setResult(null);
    setSubResult(null);
    setError(null);
  }

  function handleModeChange(next: Mode) {
    setMode(next);
    setAInput("");
    setBInput("");
    setResult(null);
    setSubResult(null);
    setError(null);
  }

  async function handleCopyFormula() {
    await navigator.clipboard.writeText(FORMULA_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const labels = getLabels(mode);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <div className="mb-8 flex flex-col gap-4">
        <ToolBreadcrumb tool={tool} />
        <div>
          <h1 className="mb-2 text-headline-lg">Percentage Calculator</h1>
          <p className="max-w-2xl text-body-lg text-muted-foreground">
            Find X% of Y, what percent one number is of another, percent change, and sale discounts.
            Free, instant, private.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModeChange(m.id)}
                  aria-pressed={mode === m.id}
                  className={
                    mode === m.id
                      ? "rounded bg-primary px-3 py-1.5 text-label-sm text-primary-foreground"
                      : "rounded border border-border px-3 py-1.5 text-label-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="pctA" className="mb-2 block text-label-sm">
                  {labels.aLabel}
                </label>
                <input
                  id="pctA"
                  type="number"
                  placeholder={labels.aPlaceholder}
                  value={aInput}
                  onChange={(event) => setAInput(event.target.value)}
                  className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="pctB" className="mb-2 block text-label-sm">
                  {labels.bLabel}
                </label>
                <input
                  id="pctB"
                  type="number"
                  placeholder={labels.bPlaceholder}
                  value={bInput}
                  onChange={(event) => setBInput(event.target.value)}
                  className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCalculate}
                className="w-full rounded bg-primary-button px-6 py-3 text-body-md font-medium text-primary-foreground transition-opacity hover:opacity-90 md:w-auto"
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
                <div className="rounded border border-border bg-muted p-6 text-center">
                  <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                    Result
                  </span>
                  <span className="block text-display text-primary">{result}</span>
                  {subResult && <span className="mt-2 block text-body-md text-muted-foreground">{subResult}</span>}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">Common formulas</h3>
            <div className="flex flex-col gap-4 text-body-md text-muted-foreground">
              <ul className="list-disc space-y-2 pl-5">
                <li>X% of Y = (X / 100) x Y</li>
                <li>X is what % of Y = (X / Y) x 100</li>
                <li>% change = ((New - Old) / Old) x 100</li>
                <li>Sale price = Original - (Original x Discount / 100)</li>
              </ul>
              <div className="relative mt-2 rounded bg-[#111] p-4 font-mono text-sm text-white">
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

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">Quick examples</h3>
            <ul className="flex flex-col gap-3 text-body-md">
              {COMMON.map((row, i) => (
                <li
                  key={row.label}
                  className={
                    i < COMMON.length - 1
                      ? "flex items-center justify-between border-b border-border pb-2"
                      : "flex items-center justify-between"
                  }
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">Related Tools</h3>
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
