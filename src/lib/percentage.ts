/** Pure percentage math — shared by PercentageCalculatorTool so tests guard the real formulas. */
export function percentOf(percent: number, value: number): number {
  return (percent / 100) * value;
}

export function whatPercent(part: number, whole: number): number {
  if (whole === 0) return NaN;
  return (part / whole) * 100;
}

export function percentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return NaN;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

export function discountSale(originalPrice: number, discountPercent: number): { sale: number; savings: number } {
  const savings = (originalPrice * discountPercent) / 100;
  return { sale: originalPrice - savings, savings };
}
