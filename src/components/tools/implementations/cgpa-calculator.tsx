"use client";

import { WeightedAverageTool } from "@/components/tools/weighted-average-tool";

export function CgpaCalculatorTool() {
  return (
    <WeightedAverageTool
      rowNounSingular="semester"
      rowLabel="Semester"
      weightLabel="Credits"
      valueLabel="SGPA"
      helpText="Enter each semester's credit hours and the GPA (SGPA) you earned that semester."
      resultLabel="Your CGPA"
    />
  );
}
