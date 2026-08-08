"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/tools/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateAge, parseDateInput, type AgeBreakdown } from "@/lib/date";

export function AgeCalculatorTool() {
  const [birthDateInput, setBirthDateInput] = useState("");
  const [asOfInput, setAsOfInput] = useState("");

  // Only ever computed in response to user input (never on initial render),
  // so falling back to `new Date()` here can't cause a build-time-vs-view-time
  // hydration mismatch — see docs/PLAN.md #4 for the same reasoning applied
  // to Password Generator.
  const result: { error: string | null; age: AgeBreakdown | null } | null = useMemo(() => {
    const birthDate = parseDateInput(birthDateInput);
    if (!birthDate) return null;
    const asOfDate = asOfInput ? parseDateInput(asOfInput) : new Date();
    if (!asOfDate) return null;
    if (birthDate.getTime() > asOfDate.getTime()) {
      return { error: "Date of birth is after the “as of” date.", age: null };
    }
    return { error: null, age: calculateAge(birthDate, asOfDate) };
  }, [birthDateInput, asOfInput]);

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Dates">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="birth-date">Date of birth</Label>
            <Input
              id="birth-date"
              type="date"
              value={birthDateInput}
              onChange={(event) => setBirthDateInput(event.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="as-of">As of (defaults to today)</Label>
            <Input
              id="as-of"
              type="date"
              value={asOfInput}
              onChange={(event) => setAsOfInput(event.target.value)}
              className="mt-2"
            />
          </div>
        </div>
      </Panel>

      {result?.error && (
        <p role="alert" className="text-body-md text-destructive">
          {result.error}
        </p>
      )}

      {result?.age && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Years" value={result.age.years} />
          <Stat label="Months" value={result.age.months} />
          <Stat label="Days" value={result.age.days} />
          <Stat label="Total days" value={result.age.totalDays} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-headline-md">{value}</p>
      <p className="mt-1 text-label-sm text-muted-foreground">{label}</p>
    </div>
  );
}
