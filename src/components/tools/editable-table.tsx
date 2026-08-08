"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EditableTableColumn<Row> {
  key: keyof Row & string;
  label: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * Generic add/edit/remove row table — GPA, CGPA, and Marks Percentage are
 * all "dynamic rows -> weighted result" UIs with different column shapes,
 * so this is written generic over the row type rather than duplicated 3x.
 */
export function EditableTable<Row extends { id: string }>({
  columns,
  rows,
  onChange,
  onAdd,
  onRemove,
  addLabel = "Add row",
}: {
  columns: EditableTableColumn<Row>[];
  rows: Row[];
  onChange: (id: string, key: keyof Row & string, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-body-md">
          <thead>
            <tr className="border-b border-border text-left text-label-sm text-muted-foreground">
              {columns.map((col) => (
                <th key={col.key} className="px-2 py-2 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-2">
                    <Input
                      type={col.type ?? "text"}
                      min={col.min}
                      max={col.max}
                      step={col.step}
                      value={String(row[col.key] ?? "")}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        onChange(row.id, col.key, event.target.value)
                      }
                      className={col.className ?? "w-28"}
                    />
                  </td>
                ))}
                <td className="px-2 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(row.id)}
                    aria-label="Remove row"
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="secondary" size="sm" onClick={onAdd} className="self-start">
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}
