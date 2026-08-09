"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/tools/panel";
import { MiniStat, ResultCard } from "@/components/tools/result-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { summarizeLoan } from "@/lib/tools/finance";

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
}

/**
 * Same amortized-payment formula as Loan Calculator (see lib/tools/finance),
 * but framed the way EMI is normally quoted — tenure in months rather than
 * a year count — so the two tools feel distinct rather than a duplicate.
 */
export function EmiCalculatorTool() {
  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate] = useState("9");
  const [tenureMonths, setTenureMonths] = useState("60");

  const summary = useMemo(() => {
    const principalNum = Number(principal) || 0;
    const rateNum = Number(rate) || 0;
    const months = Math.max(1, Math.round(Number(tenureMonths) || 0));
    if (principalNum <= 0) return null;
    return summarizeLoan(principalNum, rateNum, months);
  }, [principal, rate, tenureMonths]);

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Loan details">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="principal">Loan amount</Label>
            <Input
              id="principal"
              type="number"
              min={0}
              value={principal}
              onChange={(event) => setPrincipal(event.target.value)}
              className="mt-2 w-36"
            />
          </div>
          <div>
            <Label htmlFor="rate">Annual interest rate (%)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              step={0.1}
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              className="mt-2 w-32"
            />
          </div>
          <div>
            <Label htmlFor="tenure">Tenure (months)</Label>
            <Input
              id="tenure"
              type="number"
              min={1}
              value={tenureMonths}
              onChange={(event) => setTenureMonths(event.target.value)}
              className="mt-2 w-28"
            />
          </div>
        </div>
      </Panel>

      {summary && (
        <div className="flex flex-col gap-4">
          <ResultCard label="Monthly EMI" value={formatCurrency(summary.monthlyPayment)} />
          <div className="grid grid-cols-2 gap-4">
            <MiniStat label="Total interest" value={formatCurrency(summary.totalInterest)} />
            <MiniStat label="Total payment" value={formatCurrency(summary.totalPayment)} />
          </div>
        </div>
      )}
    </div>
  );
}
