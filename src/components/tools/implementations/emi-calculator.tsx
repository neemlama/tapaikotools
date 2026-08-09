"use client";

import { useMemo, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";
import { generateAmortizationSchedule, summarizeLoan } from "@/lib/tools/finance";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed from the Stitch "EMI Calculator" screen — `layout:
 * "custom"` in the registry (see ToolPageShell) because this design has its
 * own header, its own "How it Works"/"Benefits"/"FAQ" bento instead of a
 * generic About/FAQ, and an amortization table with no shared-component
 * equivalent. Loan Calculator keeps its own plain-panel design — only this
 * page needed the standalone treatment. Unlike CGPA/Password Generator,
 * Stitch's own mockup for this page DID include a breadcrumb (labeled
 * "Tools" instead of "Home", and its own inconsistent top nav) — normalized
 * to the site's standard `ToolBreadcrumb` / shared Header rather than
 * transcribed literally, same call the team already made for Home's nav
 * vs. every other screen's drifted nav (see docs/PLAN.md #2).
 */

const tool = getToolBySlug("emi-calculator")!;

function formatCurrency(value: number, decimals = 2) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Splits a currency string into "$978" + ".31" so the cents can render smaller/muted, matching Stitch's result display. */
function splitCurrency(value: number) {
  const [whole, cents] = formatCurrency(value).split(".");
  return { whole, cents };
}

type TenureUnit = "years" | "months";

export function EmiCalculatorTool() {
  const [amountInput, setAmountInput] = useState("50000");
  const [rate, setRate] = useState("6.5");
  const [tenureMonths, setTenureMonths] = useState(60);
  const [tenureUnit, setTenureUnit] = useState<TenureUnit>("years");
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  const principal = Number(amountInput.replace(/,/g, "")) || 0;
  const rateNum = Number(rate) || 0;

  const summary = useMemo(
    () => summarizeLoan(principal, rateNum, tenureMonths),
    [principal, rateNum, tenureMonths],
  );
  const schedule = useMemo(
    () => generateAmortizationSchedule(principal, rateNum, tenureMonths),
    [principal, rateNum, tenureMonths],
  );

  const hasResult = principal > 0 && summary.monthlyPayment > 0;
  const principalPct = hasResult ? Math.round((principal / summary.totalPayment) * 100) : 0;
  const interestPct = 100 - principalPct;
  const emi = splitCurrency(summary.monthlyPayment);

  function reformatAmount() {
    setAmountInput(principal ? String(Math.round(principal)) : "");
  }

  const tenureDisplay = tenureUnit === "years" ? Math.round(tenureMonths / 12) : tenureMonths;
  function handleTenureUnitChange(unit: TenureUnit) {
    setTenureUnit(unit);
  }
  function handleTenureDisplayChange(value: number) {
    setTenureMonths(tenureUnit === "years" ? value * 12 : value);
  }

  const visibleRows = scheduleExpanded ? schedule : schedule.slice(0, 12);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-4 py-12 md:px-10">
      {/* Page header */}
      <div className="flex flex-col gap-4">
        <ToolBreadcrumb tool={tool} />
        <h1 className="text-headline-lg text-foreground">EMI Calculator</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          Quickly calculate your Equated Monthly Installment (EMI) for home loans, car loans, or personal loans.
        </p>
      </div>

      {/* Calculator layout */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Configuration panel */}
        <div className="flex flex-col gap-6 rounded-lg border border-border bg-background p-6 lg:col-span-5">
          {/* Loan amount */}
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <label htmlFor="loan-amount" className="text-body-md font-semibold text-foreground">
                Loan Amount
              </label>
              <div className="flex items-center rounded border border-border bg-input px-3 py-1 focus-within:ring-2 focus-within:ring-primary-container">
                <span className="mr-1 text-body-md text-muted-foreground">$</span>
                <input
                  id="loan-amount"
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  onBlur={reformatAmount}
                  className="w-24 border-none bg-transparent p-0 text-right text-body-md text-foreground outline-none focus:ring-0"
                />
              </div>
            </div>
            <input
              type="range"
              min={1000}
              max={1000000}
              step={1000}
              value={Math.min(1000000, Math.max(1000, principal))}
              onChange={(event) => setAmountInput(event.target.value)}
              className="range-slider mt-2"
            />
            <div className="flex justify-between text-label-sm text-muted-foreground">
              <span>$1K</span>
              <span>$1M</span>
            </div>
          </div>

          {/* Interest rate */}
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <label htmlFor="interest-rate" className="text-body-md font-semibold text-foreground">
                Interest Rate
              </label>
              <div className="flex items-center rounded border border-border bg-input px-3 py-1 focus-within:ring-2 focus-within:ring-primary-container">
                <input
                  id="interest-rate"
                  type="text"
                  inputMode="decimal"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  className="w-16 border-none bg-transparent p-0 text-right text-body-md text-foreground outline-none focus:ring-0"
                />
                <span className="ml-1 text-body-md text-muted-foreground">%</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={0.1}
              value={Math.min(20, Math.max(1, rateNum))}
              onChange={(event) => setRate(event.target.value)}
              className="range-slider mt-2"
            />
            <div className="flex justify-between text-label-sm text-muted-foreground">
              <span>1%</span>
              <span>20%</span>
            </div>
          </div>

          {/* Loan tenure */}
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <label htmlFor="loan-tenure" className="text-body-md font-semibold text-foreground">
                Loan Tenure
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded border border-border bg-input px-3 py-1 focus-within:ring-2 focus-within:ring-primary-container">
                  <input
                    id="loan-tenure"
                    type="text"
                    inputMode="numeric"
                    value={tenureDisplay}
                    onChange={(event) => handleTenureDisplayChange(Number(event.target.value) || 0)}
                    className="w-16 border-none bg-transparent p-0 text-right text-body-md text-foreground outline-none focus:ring-0"
                  />
                </div>
                <div className="flex rounded border border-border bg-muted p-1">
                  {(["years", "months"] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => handleTenureUnitChange(unit)}
                      className={cn(
                        "rounded px-3 py-1 text-label-sm transition-colors",
                        tenureUnit === unit
                          ? "border border-border bg-background font-semibold text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {unit === "years" ? "Yr" : "Mo"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <input
              type="range"
              min={tenureUnit === "years" ? 1 : 12}
              max={tenureUnit === "years" ? 30 : 360}
              value={tenureDisplay}
              onChange={(event) => handleTenureDisplayChange(Number(event.target.value))}
              className="range-slider mt-2"
            />
            <div className="flex justify-between text-label-sm text-muted-foreground">
              <span>{tenureUnit === "years" ? "1 Yr" : "12 Mo"}</span>
              <span>{tenureUnit === "years" ? "30 Yrs" : "360 Mo"}</span>
            </div>
          </div>

          <div className="mt-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={reformatAmount}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary-container py-3 text-body-md font-semibold text-on-primary-container transition-opacity hover:opacity-90"
            >
              <MaterialIcon name="autorenew" className="text-[20px]" />
              Recalculate
            </button>
          </div>
        </div>

        {/* Results panel */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Main result card */}
          <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-lg border border-border bg-background p-6 shadow-sm sm:flex-row">
            <div
              aria-hidden="true"
              className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-bl-full bg-primary/10 pointer-events-none"
            />
            <div className="z-10 flex w-full flex-col gap-2 sm:w-auto">
              <span className="text-body-md text-muted-foreground">Your Monthly EMI</span>
              <div className="flex items-baseline gap-1 text-display text-primary">
                <span className="text-[24px] font-semibold">{emi.whole}</span>
                <span className="text-[20px] font-semibold text-muted-foreground">.{emi.cents}</span>
              </div>
            </div>
            <div className="z-10 flex flex-col items-center gap-4">
              <div
                className="relative flex h-[200px] w-[200px] items-center justify-center rounded-full shadow-sm"
                style={{
                  background: hasResult
                    ? `conic-gradient(var(--primary-container) 0% ${principalPct}%, var(--border-subtle) ${principalPct}% 100%)`
                    : "var(--border-subtle)",
                }}
              >
                <div className="flex h-[140px] w-[140px] flex-col items-center justify-center rounded-full bg-background text-center">
                  <span className="text-label-sm text-muted-foreground">Total Payment</span>
                  <span className="text-headline-md font-semibold text-foreground">
                    {hasResult ? formatCurrency(summary.totalPayment, 0) : "—"}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 text-label-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-primary-container" />
                  <span className="text-muted-foreground">Principal ({principalPct}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-border-subtle" />
                  <span className="text-muted-foreground">Interest ({interestPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary results */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-5 transition-colors hover:border-outline">
              <span className="flex items-center gap-2 text-label-sm text-muted-foreground">
                <MaterialIcon name="account_balance" className="text-[16px]" />
                Principal Amount
              </span>
              <span className="text-headline-md font-semibold text-foreground">
                {hasResult ? formatCurrency(principal) : "—"}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-background p-5 transition-colors hover:border-outline">
              <span className="flex items-center gap-2 text-label-sm text-muted-foreground">
                <MaterialIcon name="payments" className="text-[16px]" />
                Total Interest Payable
              </span>
              <span className="text-headline-md font-semibold text-foreground">
                {hasResult ? formatCurrency(summary.totalInterest) : "—"}
              </span>
            </div>
          </div>

          {/* Amortization schedule */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border bg-input p-4">
              <h3 className="text-body-md font-semibold text-foreground">
                Amortization Schedule {scheduleExpanded ? "(Full)" : "(Year 1)"}
              </h3>
              {schedule.length > 12 && (
                <button
                  type="button"
                  onClick={() => setScheduleExpanded((v) => !v)}
                  className="flex items-center gap-1 text-label-sm font-semibold text-primary-container transition-colors hover:text-primary"
                >
                  {scheduleExpanded ? "Collapse Schedule" : "Expand Full Schedule"}
                  <MaterialIcon name={scheduleExpanded ? "expand_less" : "expand_more"} className="text-[16px]" />
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-body-md">
                <thead className="sticky top-0 border-b border-border bg-background text-label-sm text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Month</th>
                    <th className="px-4 py-3 text-right font-medium">Principal</th>
                    <th className="px-4 py-3 text-right font-medium">Interest</th>
                    <th className="px-4 py-3 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-sm text-foreground">
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                        Enter a loan amount to see the schedule.
                      </td>
                    </tr>
                  )}
                  {visibleRows.map((row) => (
                    <tr key={row.month} className="transition-colors hover:bg-input">
                      <td className="px-4 py-2.5">{row.month}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(row.principal)}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{formatCurrency(row.interest)}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Informational sections (bento-style) */}
      <section className="mt-8 grid grid-cols-1 gap-6 border-t border-border pt-12 md:grid-cols-2 lg:grid-cols-3">
        {/* How it Works */}
        <div className="col-span-1 flex flex-col gap-4 rounded-lg border border-border bg-background p-6">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary-container">
            <MaterialIcon name="settings" />
          </div>
          <h3 className="text-headline-md text-foreground">How it Works</h3>
          <p className="text-body-md text-muted-foreground">
            The EMI calculator uses the standard mathematical formula:
            <br />
            <br />
            <code className="block rounded bg-[#111] px-2 py-1 text-center font-mono text-sm text-white">
              E = P x R x (1+R)^N / [(1+R)^N-1]
            </code>
            <br />
            Where <strong>E</strong> is EMI, <strong>P</strong> is Principal Loan Amount, <strong>R</strong> is rate
            of interest calculated on a monthly basis, and <strong>N</strong> is loan tenure in months.
          </p>
        </div>

        {/* Benefits */}
        <div className="col-span-1 flex flex-col gap-4 rounded-lg border border-border bg-background p-6">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-tertiary/10 text-tertiary-container">
            <MaterialIcon name="trending_up" />
          </div>
          <h3 className="text-headline-md text-foreground">Benefits</h3>
          <ul className="flex flex-col gap-3 text-body-md text-muted-foreground">
            <li className="flex items-start gap-2">
              <MaterialIcon name="check_circle" className="mt-0.5 text-[20px] text-primary-container" />
              <span>
                <strong>Financial Planning:</strong> Know your exact monthly commitment before taking a loan.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MaterialIcon name="check_circle" className="mt-0.5 text-[20px] text-primary-container" />
              <span>
                <strong>Time-Saving:</strong> Perform complex calculations instantly without manual errors.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MaterialIcon name="check_circle" className="mt-0.5 text-[20px] text-primary-container" />
              <span>
                <strong>Comparison:</strong> Easily adjust tenure and rates to compare different loan offers
                side-by-side.
              </span>
            </li>
          </ul>
        </div>

        {/* FAQ */}
        <div className="col-span-1 flex flex-col gap-4 rounded-lg border border-border bg-background p-6 md:col-span-2 lg:col-span-1">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded bg-secondary/10 text-secondary-container">
            <MaterialIcon name="help" />
          </div>
          <h3 className="text-headline-md text-foreground">FAQ</h3>
          <div className="flex flex-col gap-4">
            <div className="border-b border-border pb-3 last:border-0 last:pb-0">
              <h4 className="mb-1 text-body-md font-semibold text-foreground">Does EMI change over time?</h4>
              <p className="text-sm text-muted-foreground">
                For fixed-rate loans, the EMI remains constant throughout the tenure. For floating rates, it may
                change.
              </p>
            </div>
            <div className="border-b border-border pb-3 last:border-0 last:pb-0">
              <h4 className="mb-1 text-body-md font-semibold text-foreground">What is an Amortization Schedule?</h4>
              <p className="text-sm text-muted-foreground">
                It&apos;s a table detailing each periodic payment, showing how much goes toward principal vs.
                interest.
              </p>
            </div>
            <div className="border-b border-border pb-3 last:border-0 last:pb-0">
              <h4 className="mb-1 text-body-md font-semibold text-foreground">Can I prepay my loan?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, most banks allow prepayment, which reduces the principal amount and consequently the total
                interest payable.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
