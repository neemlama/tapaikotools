export interface WeightedRow {
  id: string;
  label: string;
  weight: string; // credits — kept as string to hold the live input value, including ""
  value: string; // grade points — same
}

/** Credit-weighted average, e.g. GPA (weight=credits, value=grade points) or CGPA (weight=semester credits, value=semester GPA). */
export function computeWeightedAverage(rows: WeightedRow[]): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const row of rows) {
    const weight = Number(row.weight);
    const value = Number(row.value);
    if (!Number.isFinite(weight) || !Number.isFinite(value) || weight <= 0) continue;
    totalWeight += weight;
    weightedSum += weight * value;
  }
  return totalWeight === 0 ? 0 : weightedSum / totalWeight;
}

let nextRowId = 1;
/**
 * IDs for rows added after mount (via an "Add row" click, never during
 * initial/SSR render, so there's no hydration concern here). Initial seed
 * rows in each tool's useState should use their own literal IDs like
 * "seed-1"/"seed-2" instead of calling this, so they can never collide
 * with a row created later from this shared counter.
 */
export function createRowId(): string {
  return `row-${nextRowId++}`;
}
