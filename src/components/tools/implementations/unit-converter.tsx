"use client";

import { ArrowLeftRight } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel } from "@/components/tools/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const LINEAR_UNITS = {
  length: {
    Meters: 1,
    Kilometers: 1000,
    Centimeters: 0.01,
    Millimeters: 0.001,
    Miles: 1609.344,
    Yards: 0.9144,
    Feet: 0.3048,
    Inches: 0.0254,
  },
  weight: {
    Kilograms: 1,
    Grams: 0.001,
    Milligrams: 0.000001,
    Pounds: 0.45359237,
    Ounces: 0.028349523125,
  },
  volume: {
    Liters: 1,
    Milliliters: 0.001,
    "US Gallons": 3.785411784,
    "US Quarts": 0.946352946,
    "US Cups": 0.2365882365,
    "US Fluid Ounces": 0.0295735295625,
  },
} as const;

type LinearCategory = keyof typeof LINEAR_UNITS;
type Category = LinearCategory | "temperature";

const CATEGORY_LABELS: Record<Category, string> = {
  length: "Length",
  weight: "Weight",
  volume: "Volume",
  temperature: "Temperature",
};

const TEMPERATURE_UNITS = ["Celsius", "Fahrenheit", "Kelvin"] as const;

function unitsForCategory(category: Category): readonly string[] {
  return category === "temperature" ? TEMPERATURE_UNITS : Object.keys(LINEAR_UNITS[category]);
}

function convertTemperature(from: string, to: string, value: number): number {
  let celsius: number;
  if (from === "Celsius") celsius = value;
  else if (from === "Fahrenheit") celsius = ((value - 32) * 5) / 9;
  else celsius = value - 273.15;

  if (to === "Celsius") return celsius;
  if (to === "Fahrenheit") return (celsius * 9) / 5 + 32;
  return celsius + 273.15;
}

function convert(category: Category, from: string, to: string, value: number): number {
  if (category === "temperature") return convertTemperature(from, to, value);
  const units: Record<string, number> = LINEAR_UNITS[category];
  return (value * units[from]) / units[to];
}

export function UnitConverterTool() {
  const [category, setCategory] = useState<Category>("length");
  const [fromUnit, setFromUnit] = useState("Meters");
  const [toUnit, setToUnit] = useState("Feet");
  const [value, setValue] = useState("1");

  function handleCategoryChange(next: Category) {
    const units = unitsForCategory(next);
    setCategory(next);
    setFromUnit(units[0]);
    setToUnit(units[1] ?? units[0]);
  }

  const result = useMemo(() => {
    const numeric = Number(value);
    if (value === "" || !Number.isFinite(numeric)) return null;
    return convert(category, fromUnit, toUnit, numeric);
  }, [category, fromUnit, toUnit, value]);

  const units = unitsForCategory(category);

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Convert">
        <div className="flex flex-col gap-5">
          <div className="max-w-xs">
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value as Category)}
              className="mt-2"
            >
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_LABELS[key]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="mt-2 w-32"
              />
            </div>
            <div>
              <Label htmlFor="from-unit">From</Label>
              <Select
                id="from-unit"
                value={fromUnit}
                onChange={(event) => setFromUnit(event.target.value)}
                className="mt-2 w-40"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Swap units"
              onClick={() => {
                setFromUnit(toUnit);
                setToUnit(fromUnit);
              }}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            <div>
              <Label htmlFor="to-unit">To</Label>
              <Select
                id="to-unit"
                value={toUnit}
                onChange={(event) => setToUnit(event.target.value)}
                className="mt-2 w-40"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </Panel>

      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-label-sm text-muted-foreground">
          {value || 0} {fromUnit} =
        </p>
        <p className="mt-1 text-display">
          {result === null ? "—" : Number(result.toFixed(6)).toLocaleString()} {result !== null && toUnit}
        </p>
      </div>
    </div>
  );
}
