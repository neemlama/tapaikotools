"use client";

import { useMemo, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed in full from the Stitch "Universal Unit Converter"
 * screen — registry.ts sets `layout: "custom"` for this tool, so this
 * component owns the entire page (breadcrumb through footer-adjacent
 * content), not just the interactive middle the shared ToolPageShell
 * would otherwise wrap. Same precedent as JSON Formatter/CGPA Calculator.
 *
 * Category set is Length/Weight/Temperature/Speed/Time — matches the
 * Stitch sidebar exactly, which notably does NOT include Volume (dropped
 * from the previous version of this tool) and DOES include Speed/Time
 * (new).
 *
 * Breadcrumb switched to the shared `ToolBreadcrumb` (2026-08-09), replacing
 * a hand-built one that rooted at "Tools" instead of "Home" and had no
 * `aria-label="Breadcrumb"` — an inconsistency a user found while checking
 * every tool's breadcrumb for the wrong-destination bug (see
 * AttendanceCalculatorTool for the broader context).
 */

const tool = getToolBySlug("unit-converter")!;

type CategoryId = "length" | "weight" | "temperature" | "speed" | "time";

interface UnitDef {
  code: string;
  label: string;
  /** Multiplier to the category's base unit. Unused for temperature (special-cased). */
  factor: number;
}

const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: "length", label: "Length", icon: "straighten" },
  { id: "weight", label: "Weight", icon: "scale" },
  { id: "temperature", label: "Temperature", icon: "thermostat" },
  { id: "speed", label: "Speed", icon: "speed" },
  { id: "time", label: "Time", icon: "timer" },
];

const LINEAR_UNITS: Record<Exclude<CategoryId, "temperature">, UnitDef[]> = {
  length: [
    { code: "m", label: "Meters (m)", factor: 1 },
    { code: "km", label: "Kilometers (km)", factor: 1000 },
    { code: "cm", label: "Centimeters (cm)", factor: 0.01 },
    { code: "mm", label: "Millimeters (mm)", factor: 0.001 },
    { code: "in", label: "Inches (in)", factor: 0.0254 },
    { code: "ft", label: "Feet (ft)", factor: 0.3048 },
    { code: "yd", label: "Yards (yd)", factor: 0.9144 },
    { code: "mi", label: "Miles (mi)", factor: 1609.344 },
  ],
  weight: [
    { code: "kg", label: "Kilograms (kg)", factor: 1 },
    { code: "g", label: "Grams (g)", factor: 0.001 },
    { code: "mg", label: "Milligrams (mg)", factor: 0.000001 },
    { code: "lb", label: "Pounds (lb)", factor: 0.45359237 },
    { code: "oz", label: "Ounces (oz)", factor: 0.028349523125 },
  ],
  speed: [
    { code: "m/s", label: "Meters/sec (m/s)", factor: 1 },
    { code: "km/h", label: "Kilometers/hour (km/h)", factor: 1000 / 3600 },
    { code: "mph", label: "Miles/hour (mph)", factor: 0.44704 },
    { code: "kn", label: "Knots (kn)", factor: 0.5144444444 },
    { code: "ft/s", label: "Feet/sec (ft/s)", factor: 0.3048 },
  ],
  time: [
    { code: "s", label: "Seconds (s)", factor: 1 },
    { code: "min", label: "Minutes (min)", factor: 60 },
    { code: "h", label: "Hours (h)", factor: 3600 },
    { code: "d", label: "Days (d)", factor: 86400 },
    { code: "wk", label: "Weeks (wk)", factor: 604800 },
  ],
};

const TEMPERATURE_UNITS: UnitDef[] = [
  { code: "C", label: "Celsius (°C)", factor: 0 },
  { code: "F", label: "Fahrenheit (°F)", factor: 0 },
  { code: "K", label: "Kelvin (K)", factor: 0 },
];

const TEMPERATURE_FORMULAS: Record<string, string> = {
  "C-F": "multiply by 9/5, then add 32",
  "F-C": "subtract 32, then multiply by 5/9",
  "C-K": "add 273.15",
  "K-C": "subtract 273.15",
  "F-K": "subtract 32, multiply by 5/9, then add 273.15",
  "K-F": "subtract 273.15, multiply by 9/5, then add 32",
};

function unitsFor(category: CategoryId): UnitDef[] {
  return category === "temperature" ? TEMPERATURE_UNITS : LINEAR_UNITS[category];
}

function convertTemperature(fromCode: string, toCode: string, value: number): number {
  let celsius: number;
  if (fromCode === "C") celsius = value;
  else if (fromCode === "F") celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15;

  if (toCode === "C") return celsius;
  if (toCode === "F") return (celsius * 9) / 5 + 32;
  return celsius + 273.15;
}

function convert(category: CategoryId, fromCode: string, toCode: string, value: number): number {
  if (category === "temperature") return convertTemperature(fromCode, toCode, value);
  const units = LINEAR_UNITS[category];
  const from = units.find((u) => u.code === fromCode);
  const to = units.find((u) => u.code === toCode);
  if (!from || !to) return value;
  return (value * from.factor) / to.factor;
}

/** Clean decimal string, no thousands separators (this feeds a <input type="number">, which rejects comma-formatted values). */
function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return String(Math.round(value * 1e6) / 1e6);
}

function formulaText(category: CategoryId, fromCode: string, toCode: string): string {
  if (fromCode === toCode) return "no conversion needed — same unit";
  if (category === "temperature") return TEMPERATURE_FORMULAS[`${fromCode}-${toCode}`] ?? "";
  const units = LINEAR_UNITS[category];
  const from = units.find((u) => u.code === fromCode);
  const to = units.find((u) => u.code === toCode);
  if (!from || !to) return "";
  const categoryLabel = CATEGORIES.find((c) => c.id === category)!.label.toLowerCase();
  return `multiply the ${categoryLabel} value by ${formatResult(from.factor / to.factor)}`;
}

export function UnitConverterTool() {
  const [category, setCategory] = useState<CategoryId>("length");
  const [fromCode, setFromCode] = useState("in");
  const [toCode, setToCode] = useState("cm");
  const [value, setValue] = useState("1");
  const [copied, setCopied] = useState(false);

  const units = unitsFor(category);

  function handleCategoryChange(next: CategoryId) {
    const nextUnits = unitsFor(next);
    setCategory(next);
    setFromCode(nextUnits[0].code);
    setToCode(nextUnits[1]?.code ?? nextUnits[0].code);
  }

  function handleSwap() {
    setFromCode(toCode);
    setToCode(fromCode);
  }

  const result = useMemo(() => {
    const numeric = Number(value);
    if (value.trim() === "" || !Number.isFinite(numeric)) return null;
    return convert(category, fromCode, toCode, numeric);
  }, [category, fromCode, toCode, value]);

  const resultDisplay = result === null ? "" : formatResult(result);
  const unitPill = `1 ${fromCode} = ${formatResult(convert(category, fromCode, toCode, 1))} ${toCode}`;

  async function handleCopy() {
    if (!resultDisplay) return;
    try {
      await navigator.clipboard.writeText(resultDisplay);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard denied — fail silently, user can copy manually
    }
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-4 py-16 md:px-10">
      {/* Header */}
      <section className="flex flex-col gap-4 text-center md:text-left">
        <div className="mb-4 flex justify-center md:justify-start">
          <ToolBreadcrumb tool={tool} />
        </div>
        <h1 className="text-display text-foreground">Universal Unit Converter</h1>
        <p className="text-body-lg max-w-2xl text-muted-foreground">
          Effortlessly convert between hundreds of units of measurement across various categories. Precise,
          fast, and designed for professionals.
        </p>
      </section>

      {/* Converter engine */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Category sidebar */}
        <div className="hide-scrollbar flex flex-row gap-2 overflow-x-auto pb-4 lg:col-span-3 lg:flex-col lg:pb-0">
          {CATEGORIES.map((cat) => {
            const active = cat.id === category;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  "flex w-full shrink-0 items-center gap-3 rounded-sm px-4 py-3 text-left font-medium transition-colors",
                  active ? "bg-primary-container text-white" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <MaterialIcon name={cat.icon} className="text-[20px]" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Main converter card */}
        <div className="flex flex-col gap-8 rounded-md border border-border bg-card p-6 shadow-sm md:p-8 lg:col-span-9">
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Swap button — desktop, centered */}
            <button
              type="button"
              onClick={handleSwap}
              aria-label="Swap units"
              className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-accent p-2 text-foreground transition-colors hover:bg-border md:flex"
            >
              <MaterialIcon name="swap_horiz" className="text-[24px]" />
            </button>

            {/* From */}
            <div className="flex flex-col gap-4">
              <label htmlFor="from-value" className="text-label-sm uppercase tracking-wider text-muted-foreground">
                From
              </label>
              <div className="flex flex-col gap-2">
                <input
                  id="from-value"
                  type="number"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="0"
                  className="text-headline-lg w-full rounded-sm border border-border bg-background p-4 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                />
                {/* aria-label, not htmlFor (2026-08-09, Phase C): "from-value"
                    is already claimed by the number input above — this picks
                    the unit, a separate control the visible "From" label was
                    never actually wired to. */}
                <select
                  aria-label="From unit"
                  value={fromCode}
                  onChange={(event) => setFromCode(event.target.value)}
                  className="text-body-md w-full cursor-pointer appearance-none rounded-sm border border-border bg-background p-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                >
                  {units.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap button — mobile */}
            <div className="flex justify-center md:hidden">
              <button
                type="button"
                onClick={handleSwap}
                aria-label="Swap units"
                className="flex items-center justify-center rounded-full border border-border bg-accent p-2 text-foreground transition-colors hover:bg-border"
              >
                <MaterialIcon name="swap_vert" className="text-[24px]" />
              </button>
            </div>

            {/* To */}
            <div className="flex flex-col gap-4">
              <label htmlFor="to-value" className="text-label-sm uppercase tracking-wider text-muted-foreground">
                To
              </label>
              <div className="relative flex flex-col gap-2">
                <input
                  id="to-value"
                  type="number"
                  value={resultDisplay}
                  readOnly
                  className="text-headline-lg w-full rounded-sm border border-border bg-surface-low p-4 text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy Result"
                  aria-label="Copy result"
                  className="absolute right-4 top-4 flex items-center justify-center rounded-sm bg-muted p-1 text-outline transition-colors hover:text-primary"
                >
                  <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[20px]" />
                </button>
                {/* aria-label, not htmlFor — same reasoning as "From unit" above. */}
                <select
                  aria-label="To unit"
                  value={toCode}
                  onChange={(event) => setToCode(event.target.value)}
                  className="text-body-md w-full cursor-pointer appearance-none rounded-sm border border-border bg-background p-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary"
                >
                  {units.map((unit) => (
                    <option key={unit.code} value={unit.code}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Formula context */}
          <div className="mt-4 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-body-md text-muted-foreground sm:flex-row sm:items-center">
            <div>
              <span className="font-medium text-foreground">Formula:</span>{" "}
              {formulaText(category, fromCode, toCode)}
            </div>
            <div className="rounded-sm bg-muted px-4 py-2 font-mono text-sm">{unitPill}</div>
          </div>
        </div>
      </section>

      {/* Educational content */}
      <section className="grid grid-cols-1 gap-6 border-t border-border pt-16 md:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-1 mb-4 md:col-span-2 lg:col-span-3">
          <h2 className="text-headline-md mb-2 text-foreground">Understanding Unit Conversions</h2>
          <p className="max-w-3xl text-muted-foreground">
            A brief guide to common measurement systems and how to navigate between them effectively.
          </p>
        </div>

        <div className="rounded-md border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary-container text-white">
              <MaterialIcon name="public" />
            </div>
            <h3 className="text-headline-md text-foreground">Metric System</h3>
          </div>
          <p className="mb-4 text-muted-foreground">
            The International System of Units (SI) is base-10, making conversions simple by shifting the decimal
            point.
          </p>
          <div className="rounded-sm bg-muted p-3 font-mono text-sm text-foreground">
            1 m = 100 cm
            <br />
            1 km = 1,000 m
          </div>
        </div>

        <div className="rounded-md border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary-container text-white">
              <MaterialIcon name="architecture" />
            </div>
            <h3 className="text-headline-md text-foreground">Imperial System</h3>
          </div>
          <p className="mb-4 text-muted-foreground">
            Primarily used in the USA, this system relies on historical measurements and lacks a uniform base.
          </p>
          <div className="rounded-sm bg-muted p-3 font-mono text-sm text-foreground">
            1 ft = 12 in
            <br />
            1 mi = 5,280 ft
          </div>
        </div>

        <div className="flex flex-col rounded-md border border-border bg-card p-6 md:col-span-2 lg:col-span-1">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-tertiary-container text-white">
              <MaterialIcon name="calculate" />
            </div>
            <h3 className="text-headline-md text-foreground">Precision Notes</h3>
          </div>
          <p className="mb-4 text-muted-foreground">
            When converting for scientific or engineering purposes, significant figures matter. Our tool provides
            standard floating-point precision.
          </p>
          <a
            href="#"
            className="mt-auto flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Read documentation
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </a>
        </div>
      </section>
    </div>
  );
}
