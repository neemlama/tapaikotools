"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { CodeOutput } from "@/components/tools/code-output";
import { Panel } from "@/components/tools/panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatUuid(uuid: string, { uppercase, hyphens }: { uppercase: boolean; hyphens: boolean }) {
  const value = hyphens ? uuid : uuid.replace(/-/g, "");
  return uppercase ? value.toUpperCase() : value;
}

export function UuidGeneratorTool() {
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [uuids, setUuids] = useState<string[]>([]);

  function handleGenerate() {
    const safeCount = Math.min(100, Math.max(1, count));
    const generated = Array.from({ length: safeCount }, () =>
      formatUuid(crypto.randomUUID(), { uppercase, hyphens }),
    );
    setUuids(generated);
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Options">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <Label htmlFor="count">How many</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="mt-2 w-28"
            />
          </div>
          <Checkbox
            id="uppercase"
            label="Uppercase"
            checked={uppercase}
            onChange={(event) => setUppercase(event.target.checked)}
          />
          <Checkbox
            id="hyphens"
            label="Include hyphens"
            checked={hyphens}
            onChange={(event) => setHyphens(event.target.checked)}
          />
          <Button onClick={handleGenerate}>
            <RefreshCw className="h-4 w-4" />
            {uuids.length ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </Panel>

      <Panel title="UUIDs">
        <CodeOutput
          value={uuids.join("\n")}
          placeholder="Click generate to create UUIDs."
          minHeight="12rem"
        />
      </Panel>
    </div>
  );
}
