"use client";

import { useState } from "react";

import { Panel } from "@/components/tools/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Unit = "seconds" | "milliseconds";

function formatDate(date: Date) {
  return {
    local: date.toLocaleString(undefined, { dateStyle: "full", timeStyle: "long" }),
    utc: date.toUTCString(),
    iso: date.toISOString(),
  };
}

export function UnixTimestampConverterTool() {
  const [timestampInput, setTimestampInput] = useState("");
  const [unit, setUnit] = useState<Unit>("seconds");
  const [dateInput, setDateInput] = useState("");

  const timestampNumber = Number(timestampInput);
  const hasTimestampInput = timestampInput.trim() !== "";
  const dateFromTimestamp =
    hasTimestampInput && Number.isFinite(timestampNumber)
      ? new Date(unit === "seconds" ? timestampNumber * 1000 : timestampNumber)
      : null;
  const isValidDateFromTimestamp = dateFromTimestamp !== null && !Number.isNaN(dateFromTimestamp.getTime());

  const parsedDate = dateInput ? new Date(dateInput) : null;
  const isValidParsedDate = parsedDate !== null && !Number.isNaN(parsedDate.getTime());

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Timestamp → Date">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-40 flex-1">
              <Label htmlFor="timestamp">Unix timestamp</Label>
              <Input
                id="timestamp"
                type="text"
                inputMode="numeric"
                value={timestampInput}
                onChange={(event) => setTimestampInput(event.target.value)}
                placeholder="1700000000"
                className="mt-2 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                id="unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value as Unit)}
                className="mt-2 w-36"
              >
                <option value="seconds">Seconds</option>
                <option value="milliseconds">Milliseconds</option>
              </Select>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                setTimestampInput(
                  String(unit === "seconds" ? Math.floor(Date.now() / 1000) : Date.now()),
                )
              }
            >
              Use current time
            </Button>
          </div>

          {hasTimestampInput && !isValidDateFromTimestamp && (
            <p role="alert" className="text-body-md text-destructive">
              Enter a valid timestamp.
            </p>
          )}

          {isValidDateFromTimestamp && dateFromTimestamp && (
            <dl className="grid gap-3 sm:grid-cols-3">
              <StatRow label="Local time" value={formatDate(dateFromTimestamp).local} />
              <StatRow label="UTC" value={formatDate(dateFromTimestamp).utc} />
              <StatRow label="ISO 8601" value={formatDate(dateFromTimestamp).iso} mono />
            </dl>
          )}
        </div>
      </Panel>

      <Panel title="Date → Timestamp">
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="date">Date and time (your local timezone)</Label>
            <Input
              id="date"
              type="datetime-local"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
              className="mt-2 max-w-xs"
            />
          </div>

          {isValidParsedDate && parsedDate && (
            <dl className="grid gap-3 sm:grid-cols-2">
              <StatRow label="Seconds" value={String(Math.floor(parsedDate.getTime() / 1000))} mono />
              <StatRow label="Milliseconds" value={String(parsedDate.getTime())} mono />
            </dl>
          )}
        </div>
      </Panel>
    </div>
  );
}

function StatRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-muted p-3">
      <dt className="text-label-sm text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 break-all text-body-md text-foreground", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
