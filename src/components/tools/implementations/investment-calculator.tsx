"use client";

import { useMemo, useState } from "react";

import { Faq } from "@/components/tools/faq";
import { Panel } from "@/components/tools/panel";
import { StackedBarChart, type StackedBarDatum } from "@/components/tools/stacked-bar-chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { projectInvestment } from "@/lib/tools/finance";

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function InvestmentCalculatorTool() {
  const [initial, setInitial] = useState("10000");
  const [monthlyContribution, setMonthlyContribution] = useState("200");
  const [annualRate, setAnnualRate] = useState("7");
  const [years, setYears] = useState("10");

  const projections = useMemo(() => {
    const initialNum = Number(initial) || 0;
    const monthlyNum = Number(monthlyContribution) || 0;
    const rateNum = Number(annualRate) || 0;
    const yearsNum = Math.min(50, Math.max(1, Math.round(Number(years) || 0)));
    return projectInvestment({
      initial: initialNum,
      monthlyContribution: monthlyNum,
      annualRatePercent: rateNum,
      years: yearsNum,
    });
  }, [initial, monthlyContribution, annualRate, years]);

  const final = projections.at(-1);

  const chartData: StackedBarDatum[] = projections.map((point) => ({
    label: `Y${point.year}`,
    segments: [
      {
        label: "Principal",
        value: Math.max(0, point.principal),
        fillClassName: "fill-chart-principal",
        swatchClassName: "bg-chart-principal",
      },
      {
        label: "Interest earned",
        value: Math.max(0, point.interest),
        fillClassName: "fill-chart-interest",
        swatchClassName: "bg-chart-interest",
      },
    ],
  }));

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Parameters">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label htmlFor="initial">Initial investment ($)</Label>
            <Input
              id="initial"
              type="number"
              min={0}
              value={initial}
              onChange={(event) => setInitial(event.target.value)}
              className="mt-2 w-36"
            />
          </div>
          <div>
            <Label htmlFor="monthly">Monthly contribution ($)</Label>
            <Input
              id="monthly"
              type="number"
              min={0}
              value={monthlyContribution}
              onChange={(event) => setMonthlyContribution(event.target.value)}
              className="mt-2 w-36"
            />
          </div>
          <div>
            <Label htmlFor="rate">Annual return rate (%)</Label>
            <Input
              id="rate"
              type="number"
              min={0}
              step={0.1}
              value={annualRate}
              onChange={(event) => setAnnualRate(event.target.value)}
              className="mt-2 w-32"
            />
          </div>
          <div>
            <Label htmlFor="years">Duration (years)</Label>
            <Input
              id="years"
              type="number"
              min={1}
              max={50}
              value={years}
              onChange={(event) => setYears(event.target.value)}
              className="mt-2 w-28"
            />
          </div>
        </div>
      </Panel>

      {final && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="Total principal" value={formatCurrency(final.principal)} />
          <Stat label="Interest earned" value={formatCurrency(final.interest)} />
          <Stat label="Future value" value={formatCurrency(final.total)} />
        </div>
      )}

      <Panel title="Wealth growth projection">
        <StackedBarChart data={chartData} formatValue={formatCurrency} />
      </Panel>

      {projections.length > 0 && (
        <details className="rounded-xl border border-border bg-card p-6">
          <summary className="cursor-pointer text-headline-md">Year-by-year breakdown</summary>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-body-md">
              <thead>
                <tr className="border-b border-border text-left text-label-sm text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Year</th>
                  <th className="px-2 py-2 font-medium">Principal</th>
                  <th className="px-2 py-2 font-medium">Interest earned</th>
                  <th className="px-2 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((point) => (
                  <tr key={point.year} className="border-b border-border last:border-0">
                    <td className="px-2 py-2">{point.year}</td>
                    <td className="px-2 py-2">{formatCurrency(point.principal)}</td>
                    <td className="px-2 py-2">{formatCurrency(point.interest)}</td>
                    <td className="px-2 py-2 font-medium">{formatCurrency(point.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <Faq
        items={[
          {
            question: "Does this account for inflation?",
            answer:
              "No — figures are in nominal (today's) dollars and don't subtract inflation. Subtract your expected inflation rate from the return rate for a rough real-return estimate.",
          },
          {
            question: "How often is growth compounded?",
            answer: "Monthly — your contribution and the previous balance both earn the next month's return.",
          },
        ]}
      />
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
