"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/tools/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * canSkip: max additional classes you can miss (attended stays the same,
 * total grows) while staying at/above the required percentage.
 * needToAttend: min consecutive classes you'd need to attend (both attended
 * and total grow) to reach the required percentage.
 * Both are solved algebraically from the percentage inequality, not
 * searched for — see docs/PLAN.md for the worked example this was checked
 * against.
 */
function computeAttendance(total: number, attended: number, requiredPercent: number) {
  const currentPercent = total > 0 ? (attended / total) * 100 : 0;

  if (currentPercent >= requiredPercent) {
    const maxTotal = requiredPercent > 0 ? Math.floor((attended * 100) / requiredPercent) : Infinity;
    return { currentPercent, canSkip: Math.max(0, maxTotal - total), needToAttend: 0 };
  }

  const denominator = 100 - requiredPercent;
  const needToAttend =
    denominator > 0 ? Math.ceil((requiredPercent * total - 100 * attended) / denominator) : Infinity;
  return { currentPercent, canSkip: 0, needToAttend: Math.max(0, needToAttend) };
}

export function AttendanceCalculatorTool() {
  const [total, setTotal] = useState("");
  const [attended, setAttended] = useState("");
  const [required, setRequired] = useState("75");

  const result: { error: string | null; stats: ReturnType<typeof computeAttendance> | null } | null = useMemo(() => {
    const totalNum = Number(total);
    const attendedNum = Number(attended);
    const requiredNum = Number(required);
    if (!total || !attended || !Number.isFinite(totalNum) || !Number.isFinite(attendedNum) || totalNum <= 0) {
      return null;
    }
    if (attendedNum > totalNum) {
      return { error: "Classes attended can't exceed total classes.", stats: null };
    }
    if (attendedNum < 0) return { error: "Classes attended can't be negative.", stats: null };
    return { error: null, stats: computeAttendance(totalNum, attendedNum, requiredNum) };
  }, [total, attended, required]);

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Attendance">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="total">Total classes held</Label>
            <Input
              id="total"
              type="number"
              min={0}
              value={total}
              onChange={(event) => setTotal(event.target.value)}
              className="mt-2 w-36"
            />
          </div>
          <div>
            <Label htmlFor="attended">Classes attended</Label>
            <Input
              id="attended"
              type="number"
              min={0}
              value={attended}
              onChange={(event) => setAttended(event.target.value)}
              className="mt-2 w-36"
            />
          </div>
          <div>
            <Label htmlFor="required">Required attendance %</Label>
            <Input
              id="required"
              type="number"
              min={0}
              max={100}
              value={required}
              onChange={(event) => setRequired(event.target.value)}
              className="mt-2 w-36"
            />
          </div>
        </div>
      </Panel>

      {result?.error && (
        <p role="alert" className="text-body-md text-destructive">
          {result.error}
        </p>
      )}

      {result?.stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Current attendance" value={`${result.stats.currentPercent.toFixed(1)}%`} />
          {result.stats.canSkip > 0 ? (
            <Stat label="Classes you can still miss" value={String(result.stats.canSkip)} />
          ) : (
            <Stat label="Classes you must attend next" value={String(result.stats.needToAttend)} />
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-headline-md">{value}</p>
      <p className="mt-1 text-label-sm text-muted-foreground">{label}</p>
    </div>
  );
}
