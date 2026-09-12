"use client";

import Link from "next/link";
import { useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";

const tool = getToolBySlug("bmi-calculator")!;

const BMI_SCALE = [
  { range: "Below 18.5", label: "Underweight", min: 0 },
  { range: "18.5 – 24.9", label: "Healthy", min: 18.5 },
  { range: "25.0 – 29.9", label: "Overweight", min: 25 },
  { range: "30.0 and above", label: "Obese", min: 30 },
];

function getCategory(bmi: number): string {
  if (bmi >= 30) return "Obese";
  if (bmi >= 25) return "Overweight";
  if (bmi >= 18.5) return "Healthy";
  return "Underweight";
}

const RELATED_TOOLS: { slug: string; icon: string }[] = [
  { slug: "age-calculator", icon: "cake" },
  { slug: "unit-converter", icon: "sync_alt" },
];

const FORMULA_TEXT = "BMI = weight (kg) ÷ height (m)²";

interface Result {
  bmi: number;
  category: string;
  healthyMin: number;
  healthyMax: number;
}

export function BmiCalculatorTool() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [heightInput, setHeightInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleCalculate() {
    const height = Number.parseFloat(heightInput);
    const weight = Number.parseFloat(weightInput);

    if (!Number.isFinite(height) || !Number.isFinite(weight)) {
      setError("Please enter valid numbers for height and weight.");
      setResult(null);
      return;
    }

    let heightM: number;
    let weightKg: number;

    if (unit === "metric") {
      // height in cm, weight in kg
      if (height <= 0 || weight <= 0) {
        setError("Height and weight must be greater than zero.");
        setResult(null);
        return;
      }
      if (height < 50 || height > 300) {
        setError("Please enter a height between 50 cm and 300 cm.");
        setResult(null);
        return;
      }
      if (weight < 10 || weight > 500) {
        setError("Please enter a weight between 10 kg and 500 kg.");
        setResult(null);
        return;
      }
      heightM = height / 100;
      weightKg = weight;
    } else {
      // height in inches, weight in lbs
      if (height <= 0 || weight <= 0) {
        setError("Height and weight must be greater than zero.");
        setResult(null);
        return;
      }
      if (height < 20 || height > 120) {
        setError("Please enter a height between 20 in and 120 in.");
        setResult(null);
        return;
      }
      if (weight < 20 || weight > 1100) {
        setError("Please enter a weight between 20 lbs and 1100 lbs.");
        setResult(null);
        return;
      }
      heightM = height * 0.0254;
      weightKg = weight * 0.45359237;
    }

    const bmi = weightKg / (heightM * heightM);
    if (!Number.isFinite(bmi)) {
      setError("Could not calculate BMI from those values.");
      setResult(null);
      return;
    }

    setError(null);
    setResult({
      bmi,
      category: getCategory(bmi),
      healthyMin: 18.5 * heightM * heightM,
      healthyMax: 24.9 * heightM * heightM,
    });
  }

  function handleReset() {
    setHeightInput("");
    setWeightInput("");
    setResult(null);
    setError(null);
  }

  function handleUnitChange(next: "metric" | "imperial") {
    setUnit(next);
    setHeightInput("");
    setWeightInput("");
    setResult(null);
    setError(null);
  }

  async function handleCopyFormula() {
    await navigator.clipboard.writeText(FORMULA_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const heightLabel = unit === "metric" ? "Height (cm)" : "Height (in)";
  const weightLabel = unit === "metric" ? "Weight (kg)" : "Weight (lbs)";
  const heightPlaceholder = unit === "metric" ? "e.g. 175" : "e.g. 69";
  const weightPlaceholder = unit === "metric" ? "e.g. 70" : "e.g. 154";

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <div className="mb-8 flex flex-col gap-4">
        <ToolBreadcrumb tool={tool} />
        <div>
          <h1 className="mb-2 text-headline-lg">BMI Calculator</h1>
          <p className="max-w-2xl text-body-lg text-muted-foreground">
            Calculate your Body Mass Index instantly. Works with metric and imperial units, 100% in your
            browser.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center justify-between border-b border-border pb-2">
              <h2 className="text-headline-md">Calculate BMI</h2>
              <div className="flex rounded border border-border p-1">
                <button
                  type="button"
                  onClick={() => handleUnitChange("metric")}
                  aria-pressed={unit === "metric"}
                  className={
                    unit === "metric"
                      ? "rounded bg-primary px-3 py-1 text-label-sm text-primary-foreground"
                      : "rounded px-3 py-1 text-label-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => handleUnitChange("imperial")}
                  aria-pressed={unit === "imperial"}
                  className={
                    unit === "imperial"
                      ? "rounded bg-primary px-3 py-1 text-label-sm text-primary-foreground"
                      : "rounded px-3 py-1 text-label-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  Imperial
                </button>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="bmiHeight" className="mb-2 block text-label-sm">
                  {heightLabel}
                </label>
                <input
                  id="bmiHeight"
                  type="number"
                  placeholder={heightPlaceholder}
                  value={heightInput}
                  onChange={(event) => setHeightInput(event.target.value)}
                  className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="bmiWeight" className="mb-2 block text-label-sm">
                  {weightLabel}
                </label>
                <input
                  id="bmiWeight"
                  type="number"
                  placeholder={weightPlaceholder}
                  value={weightInput}
                  onChange={(event) => setWeightInput(event.target.value)}
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded border border-border bg-muted p-6 text-center">
                    <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                      Your BMI
                    </span>
                    <span className="block text-display text-primary">{result.bmi.toFixed(1)}</span>
                  </div>
                  <div className="rounded border border-border bg-muted p-6 text-center">
                    <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                      Category
                    </span>
                    <span className="block text-display text-secondary">{result.category}</span>
                  </div>
                </div>
                <p className="mt-4 text-body-md text-muted-foreground">
                  Healthy weight for your height: {result.healthyMin.toFixed(1)} –{" "}
                  {result.healthyMax.toFixed(1)} kg.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">How BMI is calculated</h3>
            <div className="flex flex-col gap-4 text-body-md text-muted-foreground">
              <p>BMI divides your weight by the square of your height:</p>
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
              <p className="text-label-sm">
                BMI is a screening measure, not a diagnosis. Athletes, pregnant people, and children
                should interpret it with professional guidance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">BMI Categories</h3>
            <ul className="flex flex-col gap-3 text-body-md">
              {BMI_SCALE.map((row, i) => (
                <li
                  key={row.label}
                  className={
                    i < BMI_SCALE.length - 1
                      ? "flex items-center justify-between border-b border-border pb-2"
                      : "flex items-center justify-between"
                  }
                >
                  <span className="text-muted-foreground">{row.range}</span>
                  <span
                    className={
                      result?.category === row.label ? "font-bold text-primary" : "font-bold"
                    }
                  >
                    {row.label}
                  </span>
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
