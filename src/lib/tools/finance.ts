/** Standard amortized-loan monthly payment formula. Shared by Loan and EMI calculators. */
export function calculateMonthlyPayment(principal: number, annualRatePercent: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export interface LoanSummary {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export function summarizeLoan(principal: number, annualRatePercent: number, months: number): LoanSummary {
  const monthlyPayment = calculateMonthlyPayment(principal, annualRatePercent, months);
  const totalPayment = monthlyPayment * months;
  return {
    monthlyPayment,
    totalPayment,
    totalInterest: totalPayment - principal,
  };
}

export function calculateSimpleInterest(principal: number, ratePercent: number, years: number): number {
  return (principal * ratePercent * years) / 100;
}

export function calculateCompoundInterest(
  principal: number,
  ratePercent: number,
  years: number,
  compoundsPerYear: number,
): number {
  const amount = principal * Math.pow(1 + ratePercent / 100 / compoundsPerYear, compoundsPerYear * years);
  return amount - principal;
}

export interface InvestmentYearProjection {
  year: number;
  principal: number;
  interest: number;
  total: number;
}

/** Month-by-month compounding with a fixed monthly contribution, sampled at each year-end for the chart. */
export function projectInvestment({
  initial,
  monthlyContribution,
  annualRatePercent,
  years,
}: {
  initial: number;
  monthlyContribution: number;
  annualRatePercent: number;
  years: number;
}): InvestmentYearProjection[] {
  const monthlyRate = annualRatePercent / 100 / 12;
  const projections: InvestmentYearProjection[] = [];
  let balance = initial;
  let principalContributed = initial;

  for (let month = 1; month <= years * 12; month++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    principalContributed += monthlyContribution;
    if (month % 12 === 0) {
      projections.push({
        year: month / 12,
        principal: principalContributed,
        interest: balance - principalContributed,
        total: balance,
      });
    }
  }

  return projections;
}
