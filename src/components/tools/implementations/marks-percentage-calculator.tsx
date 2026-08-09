"use client";

import { useState } from "react";

import { EditableTable, type EditableTableColumn } from "@/components/tools/editable-table";
import { Panel } from "@/components/tools/panel";
import { ResultCard } from "@/components/tools/result-card";

interface MarksRow {
  id: string;
  label: string;
  obtained: string;
  max: string;
}

const columns: EditableTableColumn<MarksRow>[] = [
  { key: "label", label: "Subject", type: "text", className: "w-40" },
  { key: "obtained", label: "Marks obtained", type: "number", min: 0, className: "w-32" },
  { key: "max", label: "Max marks", type: "number", min: 0, className: "w-28" },
];

let nextId = 1;

export function MarksPercentageCalculatorTool() {
  const [rows, setRows] = useState<MarksRow[]>([
    { id: "seed-1", label: "", obtained: "", max: "" },
    { id: "seed-2", label: "", obtained: "", max: "" },
  ]);

  function updateRow(id: string, key: keyof MarksRow & string, value: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  let totalObtained = 0;
  let totalMax = 0;
  let hasValidData = false;
  for (const row of rows) {
    const obtained = Number(row.obtained);
    const max = Number(row.max);
    if (row.obtained === "" || row.max === "" || !Number.isFinite(obtained) || !Number.isFinite(max) || max <= 0) {
      continue;
    }
    totalObtained += obtained;
    totalMax += max;
    hasValidData = true;
  }
  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Subjects">
        <div className="flex flex-col gap-3">
          <p className="text-body-md text-muted-foreground">
            Add each subject&rsquo;s marks obtained and maximum marks — the overall percentage is calculated
            across all of them.
          </p>
          <EditableTable
            columns={columns}
            rows={rows}
            onChange={updateRow}
            onAdd={() => setRows((prev) => [...prev, { id: `row-${nextId++}`, label: "", obtained: "", max: "" }])}
            onRemove={(id) => setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev))}
            addLabel="Add subject"
          />
        </div>
      </Panel>

      <ResultCard
        label="Overall percentage"
        value={hasValidData ? `${percentage.toFixed(2)}%` : "—"}
        note={hasValidData ? `${totalObtained} / ${totalMax} marks` : undefined}
      />
    </div>
  );
}
