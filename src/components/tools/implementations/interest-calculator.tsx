"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/tools/panel";
import { MiniStat, ResultCard } from "@/components/tools/result-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { calculateCompoundInterest, calculateSimpleInterest } from "@/lib/tools/finance";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
}

const COMPOUND_FREQUENCIES = { Annually: 1, "Semi-annually": 2, Quarterly: 4, Monthly: 12 } as const;

type Mode = "simple" | "compound";

export function InterestCalculatorTool() {
  const [mode, setMode] = useState<Mode>("compound");
  const [principal, setPrincipal] = useState("10000");
  const [rate, setRate] = useState("5");
  const [years, setYears] = useState("5");
  const [frequency, setFrequency] = useState<keyof typeof COMPOUND_FREQUENCIES>("Annually");

  const result = useMemo(() => {
    const principalNum = Number(principal) || 0;
    const rateNum = Number(rate) || 0;
    const yearsNum = Number(years) || 0;
    if (principalNum <= 0) return null;
    const interest =
      mode === "simple"
        ? calculateSimpleInterest(principalNum, rateNum, yearsNum)
        : calculateCompoundInterest(principalNum, rateNum, yearsNum, COMPOUND_FREQUENCIES[frequency]);
    return { interest, total: principalNum + interest };
  }, [mode, principal, rate, years, frequency]);

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex w-fit items-center gap-1 rounded-md border border-border p-1">
        {(["simple", "compound"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={cn(
              "rounded px-3 py-1.5 text-body-md capitalize",
              mode === option
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <Panel title="Details">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="principal">Principal ($)</Label>
            <Input
              id="principal"
              type="number"
              min={0}
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              className="mt-2 w-36"
            />
          </div>
          <div>
            <Label htmlFor="rate">Annual rate (%)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              step={0.1}
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              className="mt-2 w-32"
            />
          </div>
          <div>
            <Label htmlFor="years">Time (years)</Label>
            <Input
              id="years"
              type="number"
              min={0}
              step={0.5}
              value={years}
              onChange={(event) => setYears(event.target.value)}
              className="mt-2 w-28"
            />
          </div>
          {mode === "compound" && (
            <div>
              <Label htmlFor="frequency">Compounding</Label>
              <Select
                id="frequency"
                value={frequency}
                onChange={(event) => setFrequency(event.target.value as keyof typeof COMPOUND_FREQUENCIES)}
                className="mt-2 w-40"
              >
                {Object.keys(COMPOUND_FREQUENCIES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Panel>

      {result && (
        <div className="flex flex-col gap-4">
          <ResultCard label="Final amount" value={formatCurrency(result.total)} />
          <MiniStat label="Interest earned" value={formatCurrency(result.interest)} />
        </div>
      )}
    </div>
  );
}
