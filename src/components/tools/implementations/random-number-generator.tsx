"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { CodeOutput } from "@/components/tools/code-output";
import { CopyButton } from "@/components/tools/copy-button";
import { Panel } from "@/components/tools/panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secureRandomInt, secureRandomIntInRange } from "@/lib/random";

function generateNumbers(min: number, max: number, count: number, unique: boolean): number[] {
  if (unique) {
    const rangeSize = max - min + 1;
    const pool = Array.from({ length: rangeSize }, (_, i) => min + i);
    const take = Math.min(count, rangeSize);
    // Partial Fisher-Yates: only shuffle as many positions as we need.
    for (let i = 0; i < take; i++) {
      const j = i + secureRandomInt(pool.length - i);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, take);
  }
  return Array.from({ length: count }, () => secureRandomIntInRange(min, max));
}

export function RandomNumberGeneratorTool() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [unique, setUnique] = useState(false);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    if (min > max) {
      setError("Min must be less than or equal to max.");
      return;
    }
    const rangeSize = max - min + 1;
    const safeCount = Math.max(1, Math.min(1000, count));
    if (unique && safeCount > rangeSize) {
      setError(`Only ${rangeSize} unique number${rangeSize === 1 ? "" : "s"} are possible in that range.`);
      return;
    }
    setError(null);
    setNumbers(generateNumbers(min, max, safeCount, unique));
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Range">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="min">Min</Label>
            <Input
              id="min"
              type="number"
              value={min}
              onChange={(event) => setMin(Number(event.target.value))}
              className="mt-2 w-28"
            />
          </div>
          <div>
            <Label htmlFor="max">Max</Label>
            <Input
              id="max"
              type="number"
              value={max}
              onChange={(event) => setMax(Number(event.target.value))}
              className="mt-2 w-28"
            />
          </div>
          <div>
            <Label htmlFor="count">How many</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="mt-2 w-28"
            />
          </div>
          <Checkbox
            id="unique"
            label="No duplicates"
            checked={unique}
            onChange={(event) => setUnique(event.target.checked)}
          />
          <Button onClick={handleGenerate}>
            <RefreshCw className="h-4 w-4" />
            {numbers.length ? "Regenerate" : "Generate"}
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-4 text-body-md text-destructive">
            {error}
          </p>
        )}
      </Panel>

      <Panel title="Result" actions={numbers.length ? <CopyButton value={numbers.join(", ")} /> : undefined}>
        <CodeOutput
          value={numbers.join(", ")}
          placeholder="Click generate to create random numbers."
          minHeight="8rem"
        />
      </Panel>
    </div>
  );
}
