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

export interface AmortizationRow {
  month: number;
  principal: number;
  interest: number;
  balance: number;
}

/** Month-by-month principal/interest/balance breakdown for a fixed-rate amortized loan — EMI Calculator's schedule table. */
export function generateAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  months: number,
): AmortizationRow[] {
  const payment = calculateMonthlyPayment(principal, annualRatePercent, months);
  const monthlyRate = annualRatePercent / 100 / 12;
  let balance = principal;
  const rows: AmortizationRow[] = [];
  for (let month = 1; month <= months && balance > 0; month++) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month, principal: principalPaid, interest, balance });
  }
  return rows;
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

export interface InterestYearPoint {
  year: number;
  value: number;
}

/** Year-by-year balance for the Interest Calculator's growth chart — same formulas as calculateSimpleInterest/calculateCompoundInterest, sampled at every year instead of just the final one. */
export function projectInterestGrowth({
  mode,
  principal,
  ratePercent,
  years,
  compoundsPerYear,
}: {
  mode: "simple" | "compound";
  principal: number;
  ratePercent: number;
  years: number;
  compoundsPerYear: number;
}): InterestYearPoint[] {
  const rate = ratePercent / 100;
  const points: InterestYearPoint[] = [{ year: 0, value: principal }];
  for (let year = 1; year <= years; year++) {
    const value =
      mode === "simple"
        ? principal + principal * rate * year
        : principal * Math.pow(1 + rate / compoundsPerYear, compoundsPerYear * year);
    points.push({ year, value });
  }
  return points;
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
