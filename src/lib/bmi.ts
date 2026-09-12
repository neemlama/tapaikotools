/** Pure BMI math — shared by BmiCalculatorTool so tests guard the real formula. */
export function calculateBMI(weightKg: number, heightM: number): number {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightM) || heightM <= 0) return NaN;
  return weightKg / (heightM * heightM);
}

export type BMICategory = "Underweight" | "Healthy" | "Overweight" | "Obese";

export function getBMICategory(bmi: number): BMICategory {
  if (bmi >= 30) return "Obese";
  if (bmi >= 25) return "Overweight";
  if (bmi >= 18.5) return "Healthy";
  return "Underweight";
}

export function healthyWeightRange(heightM: number): { min: number; max: number } {
  return { min: 18.5 * heightM * heightM, max: 24.9 * heightM * heightM };
}

export const CM_PER_INCH = 2.54;
export const KG_PER_LB = 0.45359237;

export function inchesToMeters(inches: number): number {
  return (inches * CM_PER_INCH) / 100;
}

export function lbsToKg(lbs: number): number {
  return lbs * KG_PER_LB;
}
