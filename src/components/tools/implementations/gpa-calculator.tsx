"use client";

import { WeightedAverageTool } from "@/components/tools/weighted-average-tool";

export function GpaCalculatorTool() {
  return (
    <WeightedAverageTool
      rowNounSingular="course"
      rowLabel="Course"
      weightLabel="Credits"
      valueLabel="Grade points"
      helpText="Enter each course's credit hours and the grade points you earned, on whatever scale your institution uses (e.g. 4.0 or 10.0)."
      resultLabel="Your GPA"
    />
  );
}
