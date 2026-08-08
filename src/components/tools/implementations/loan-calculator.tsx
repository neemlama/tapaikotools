"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/tools/panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { summarizeLoan } from "@/lib/tools/finance";

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value);
}

export function LoanCalculatorTool() {
  const [principal, setPrincipal] = useState("20000");
  const [rate, setRate] = useState("6.5");
  const [termYears, setTermYears] = useState("5");

  const summary = useMemo(() => {
    const principalNum = Number(principal) || 0;
    const rateNum = Number(rate) || 0;
    const months = Math.max(1, Math.round((Number(termYears) || 0) * 12));
    if (principalNum <= 0) return null;
    return summarizeLoan(principalNum, rateNum, months);
  }, [principal, rate, termYears]);

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Loan details">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="principal">Loan amount ($)</Label>
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
            <Label htmlFor="term">Loan term (years)</Label>
            <Input
              id="term"
              type="number"
              min={0.5}
              step={0.5}
              value={termYears}
              onChange={(event) => setTermYears(event.target.value)}
              className="mt-2 w-28"
            />
          </div>
        </div>
      </Panel>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Monthly payment" value={formatCurrency(summary.monthlyPayment)} />
          <Stat label="Total interest" value={formatCurrency(summary.totalInterest)} />
          <Stat label="Total repayment" value={formatCurrency(summary.totalPayment)} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-headline-md">{value}</p>
      <p className="mt-1 text-label-sm text-muted-foreground">{label}</p>
    </div>
  );
}
