"use client";

import { useMemo, useState } from "react";

import { LineAreaChart, type LineAreaPoint } from "@/components/tools/line-area-chart";
import { Panel } from "@/components/tools/panel";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/ui/material-icon";
import { generateAmortizationSchedule, summarizeLoan } from "@/lib/tools/finance";
import { getToolBySlug } from "@/lib/tools/registry";

/**
 * Hand-transcribed from the Stitch "Loan Calculator" screen — `layout:
 * "custom"` in the registry (see ToolPageShell), same call as
 * CgpaCalculatorTool/EmiCalculatorTool: its own display-size header, its own
 * 3-tile results row + savings banner + balance chart, and its own
 * "Common Loan Types" / "Tips for Faster Payoff" / icon-toggle FAQ sections.
 * Reuses Panel (its "title + border-b + content" shape fits both bordered
 * cards here) and the existing LineAreaChart +
 * generateAmortizationSchedule/summarizeLoan (already built for
 * Interest/EMI Calculator) rather than inventing new chart or
 * amortization-math code.
 *
 * Breadcrumb added after launch (2026-08-09): this mockup's own top nav had
 * no "Home > ..." trail, so this page originally shipped without one —
 * but that left it inconsistent with EmiCalculatorTool/
 * InvestmentCalculatorTool (same Finance category, both have one), which a
 * user caught in review. Added the shared `ToolBreadcrumb` for consistency
 * within the category rather than leaving the gap.
 */

const tool = getToolBySlug("loan-calculator")!;

const LOAN_TYPES = [
  {
    icon: "home",
    title: "Mortgages",
    description:
      "Long-term loans specifically for purchasing real estate. Typically range from 15 to 30 years with fixed or adjustable rates.",
  },
  {
    icon: "directions_car",
    title: "Auto Loans",
    description:
      "Secured loans for purchasing vehicles. Usually have shorter terms (3-7 years) and lower rates than personal loans.",
  },
  {
    icon: "person",
    title: "Personal Loans",
    description:
      "Unsecured loans that can be used for various purposes like debt consolidation or major purchases. Often have higher interest rates.",
  },
];

const PAYOFF_TIPS = [
  {
    title: "Bi-Weekly Payments",
    description:
      "Instead of one monthly payment, make half-payments every two weeks. This results in one extra full payment per year, significantly reducing total interest.",
  },
  {
    title: "Round Up Payments",
    description:
      "Round your monthly payment up to the nearest $50 or $100. The extra amount goes directly to principal, accelerating payoff without feeling like a major burden.",
  },
  {
    title: "Apply Windfalls",
    description:
      "Use unexpected income like tax refunds, bonuses, or inheritances to make lump-sum principal payments on your highest interest loans first.",
  },
];

const FAQ_ITEMS = [
  {
    question: "What is amortization?",
    answer:
      "Amortization is the process of spreading out a loan into a series of fixed payments over time. While the payment amount remains the same, the breakdown of how much goes towards interest versus principal changes. Early in the loan, most of the payment covers interest, while later payments mainly reduce the principal balance.",
  },
  {
    question: "Does paying extra principal reduce my monthly payment?",
    answer:
      "Generally, no. Paying extra principal will shorten the life of the loan and reduce the total interest you pay over time, but your required monthly payment will typically remain the same until the loan is fully paid off (unless you request a 'recast' from your lender, which re-calculates payments based on the new, lower balance).",
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatAxisCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(" ") : "under a month";
}

/**
 * Same month-by-month simulation as the Stitch mockup's own script — used
 * only for the savings banner's two numbers, not the chart (which always
 * plots the standard, no-extra-payment schedule from generateAmortizationSchedule).
 */
function simulateWithExtraPayments(
  principal: number,
  annualRatePercent: number,
  standardMonths: number,
  standardMonthlyPayment: number,
  extraPerMonth: number,
): { months: number; totalInterest: number } {
  const monthlyRate = annualRatePercent / 100 / 12;
  const payment = standardMonthlyPayment + extraPerMonth;
  let balance = principal;
  let months = 0;
  let totalInterest = 0;
  const safetyCap = standardMonths * 2;

  while (balance > 0 && months < safetyCap) {
    months++;
    const interestForMonth = balance * monthlyRate;
    totalInterest += interestForMonth;
    let principalPaid = payment - interestForMonth;
    if (principalPaid > balance) principalPaid = balance;
    balance -= principalPaid;
  }

  return { months, totalInterest };
}

export function LoanCalculatorTool() {
  const [principal, setPrincipal] = useState("250000");
  const [rate, setRate] = useState("5.5");
  const [termYears, setTermYears] = useState("30");
  const [extraPayment, setExtraPayment] = useState("0");

  const principalNum = Number(principal) || 0;
  const rateNum = Number(rate) || 0;
  const months = Math.max(1, Math.round((Number(termYears) || 0) * 12));
  const extraNum = Math.max(0, Number(extraPayment) || 0);

  const summary = useMemo(
    () => (principalNum > 0 ? summarizeLoan(principalNum, rateNum, months) : null),
    [principalNum, rateNum, months],
  );

  const schedule = useMemo(
    () => (principalNum > 0 ? generateAmortizationSchedule(principalNum, rateNum, months) : []),
    [principalNum, rateNum, months],
  );

  const chartData: LineAreaPoint[] = useMemo(() => {
    if (!principalNum || schedule.length === 0) return [];
    const yearly = schedule.filter((row) => row.month % 12 === 0);
    const finalRow = schedule[schedule.length - 1];
    const points: LineAreaPoint[] = [{ label: "Year 0", value: principalNum }];
    for (const row of yearly) points.push({ label: `Year ${row.month / 12}`, value: row.balance });
    if (finalRow.month % 12 !== 0) points.push({ label: `Month ${finalRow.month}`, value: finalRow.balance });
    return points;
  }, [schedule, principalNum]);

  const savings = useMemo(() => {
    if (!summary || extraNum <= 0) return null;
    const withExtra = simulateWithExtraPayments(principalNum, rateNum, months, summary.monthlyPayment, extraNum);
    const interestSaved = summary.totalInterest - withExtra.totalInterest;
    const monthsSaved = months - withExtra.months;
    return interestSaved > 0 ? { interestSaved, monthsSaved } : null;
  }, [summary, principalNum, rateNum, months, extraNum]);

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <header className="mb-12">
        <ToolBreadcrumb tool={tool} />
        <h1 className="text-display mt-4 mb-4">Loan Calculator</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          Calculate your monthly payments, total interest, and see how extra payments can save you time and money.
        </p>
      </header>

      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Loan details */}
        <div className="lg:col-span-4">
          <Panel title="Loan Details">
            <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="loan-amount" className="text-label-sm text-muted-foreground uppercase">
                  Loan Amount ($)
                </Label>
                <Input
                  id="loan-amount"
                  type="number"
                  min={0}
                  step={1000}
                  value={principal}
                  onChange={(event) => setPrincipal(event.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="interest-rate" className="text-label-sm text-muted-foreground uppercase">
                  Interest Rate (%)
                </Label>
                <Input
                  id="interest-rate"
                  type="number"
                  min={0}
                  step={0.1}
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="loan-term" className="text-label-sm text-muted-foreground uppercase">
                  Loan Term (Years)
                </Label>
                <Input
                  id="loan-term"
                  type="number"
                  min={1}
                  step={1}
                  value={termYears}
                  onChange={(event) => setTermYears(event.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <Label htmlFor="extra-payment" className="text-label-sm text-muted-foreground uppercase">
                  Extra Monthly Payment ($) <span className="ml-1 text-xs text-primary">(Optional)</span>
                </Label>
                <Input
                  id="extra-payment"
                  type="number"
                  min={0}
                  step={50}
                  value={extraPayment}
                  onChange={(event) => setExtraPayment(event.target.value)}
                  className="font-mono"
                />
              </div>
              <Button type="submit" className="w-full">
                Calculate
              </Button>
            </form>
          </Panel>
        </div>

        {/* Summary & chart */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-6">
              <span className="mb-2 block text-label-sm text-muted-foreground uppercase">Monthly Payment</span>
              <span className="text-headline-lg text-primary">
                {summary ? formatCurrency(summary.monthlyPayment) : "—"}
              </span>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-6">
              <span className="mb-2 block text-label-sm text-muted-foreground uppercase">Total Interest</span>
              <span className="text-headline-lg">{summary ? formatCurrency(summary.totalInterest) : "—"}</span>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-6">
              <span className="mb-2 block text-label-sm text-muted-foreground uppercase">Total Payment</span>
              <span className="text-headline-lg">{summary ? formatCurrency(summary.totalPayment) : "—"}</span>
            </div>
          </div>

          {savings && (
            <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-muted p-6">
              <MaterialIcon name="savings" className="text-primary" />
              <div>
                <h4 className="text-headline-md">
                  You save <span className="font-bold text-primary">{formatCurrency(savings.interestSaved)}</span> in
                  interest
                </h4>
                <p className="mt-1 text-body-md text-muted-foreground">
                  And pay off your loan <span className="font-bold text-foreground">{formatDuration(savings.monthsSaved)}</span>{" "}
                  earlier by making extra payments.
                </p>
              </div>
            </div>
          )}

          <Panel title="Loan Balance Over Time">
            {chartData.length > 0 ? (
              <LineAreaChart data={chartData} formatValue={formatAxisCurrency} ariaLabel="Loan balance by year" />
            ) : (
              <p className="text-body-md text-muted-foreground">Enter a loan amount to see the balance chart.</p>
            )}
          </Panel>
        </div>
      </div>

      {/* Educational content */}
      <div className="flex flex-col gap-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="mb-6 flex items-center gap-3 text-headline-lg">
              <MaterialIcon name="account_balance" className="text-primary" />
              Common Loan Types
            </h3>
            <ul className="flex flex-col gap-6">
              {LOAN_TYPES.map((type) => (
                <li key={type.title} className="flex gap-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                    <MaterialIcon name={type.icon} className="text-sm" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-headline-md">{type.title}</h4>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="mb-6 flex items-center gap-3 text-headline-lg">
              <MaterialIcon name="lightbulb" className="text-primary" />
              Tips for Faster Payoff
            </h3>
            <div className="flex flex-col gap-4">
              {PAYOFF_TIPS.map((tip) => (
                <div
                  key={tip.title}
                  className="rounded-md border border-border bg-muted p-4 transition-colors hover:border-outline"
                >
                  <h4 className="mb-2 text-headline-md">{tip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-auto w-full max-w-3xl py-8">
          <h3 className="text-display mb-10 text-center">Frequently Asked Questions</h3>
          <div className="flex flex-col gap-4">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.question}
                className="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between p-6">
                  <span className="text-headline-md">{item.question}</span>
                  <span className="relative ml-1.5 h-5 w-5 shrink-0">
                    <MaterialIcon name="add" className="absolute inset-0 group-open:hidden" />
                    <MaterialIcon name="remove" className="absolute inset-0 hidden group-open:block" />
                  </span>
                </summary>
                <div className="border-t border-border px-6 pt-4 pb-6 text-muted-foreground">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
