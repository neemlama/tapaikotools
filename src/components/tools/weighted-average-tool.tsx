"use client";

import { useState } from "react";

import { EditableTable, type EditableTableColumn } from "@/components/tools/editable-table";
import { Panel } from "@/components/tools/panel";
import { computeWeightedAverage, createRowId, type WeightedRow } from "@/lib/tools/weighted-average";

function seedRows(): WeightedRow[] {
  return [
    { id: "seed-1", label: "", weight: "", value: "" },
    { id: "seed-2", label: "", weight: "", value: "" },
    { id: "seed-3", label: "", weight: "", value: "" },
  ];
}

/**
 * Shared skeleton for GPA and CGPA — both are "credit-weighted average of
 * rows" with different labels, so this is configured twice rather than
 * duplicated (see docs/PLAN.md #4, same reasoning as EditableTable).
 */
export function WeightedAverageTool({
  rowNounSingular,
  rowLabel,
  weightLabel,
  valueLabel,
  helpText,
  resultLabel,
  weightStep = 0.5,
  valueStep = 0.01,
}: {
  rowNounSingular: string;
  rowLabel: string;
  weightLabel: string;
  valueLabel: string;
  helpText: string;
  resultLabel: string;
  weightStep?: number;
  valueStep?: number;
}) {
  const [rows, setRows] = useState<WeightedRow[]>(seedRows);

  const columns: EditableTableColumn<WeightedRow>[] = [
    { key: "label", label: rowLabel, type: "text", className: "w-40" },
    { key: "weight", label: weightLabel, type: "number", min: 0, step: weightStep, className: "w-24" },
    { key: "value", label: valueLabel, type: "number", min: 0, step: valueStep, className: "w-28" },
  ];

  function updateRow(id: string, key: keyof WeightedRow & string, value: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  const hasValidData = rows.some(
    (row) => Number(row.weight) > 0 && row.value !== "" && Number.isFinite(Number(row.value)),
  );
  const average = computeWeightedAverage(rows);

  return (
    <div className="flex flex-col gap-6">
      <Panel title={`${rowLabel}s`}>
        <div className="flex flex-col gap-3">
          <p className="text-body-md text-muted-foreground">{helpText}</p>
          <EditableTable
            columns={columns}
            rows={rows}
            onChange={updateRow}
            onAdd={() => setRows((prev) => [...prev, { id: createRowId(), label: "", weight: "", value: "" }])}
            onRemove={(id) => setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev))}
            addLabel={`Add ${rowNounSingular}`}
          />
        </div>
      </Panel>

      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-label-sm text-muted-foreground">{resultLabel}</p>
        <p className="mt-1 text-display">{hasValidData ? average.toFixed(2) : "—"}</p>
      </div>
    </div>
  );
}
