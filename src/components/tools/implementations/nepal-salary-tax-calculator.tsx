"use client";

import { useMemo, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { Checkbox } from "@/components/ui/checkbox";
import { MaterialIcon } from "@/components/ui/material-icon";
import { NEPAL_TAX_2082_83, calculateNepalSalaryTax } from "@/lib/tools/nepal-tax";
import { getToolBySlug } from "@/lib/tools/registry";

const tool = getToolBySlug("salary-tax-calculator")!;

function formatNpr(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-NP")}`;
}

export function NepalSalaryTaxCalculatorTool() {
  const [monthly, setMonthly] = useState("100000");
  const [bonus, setBonus] = useState("0");
  const [filingStatus, setFilingStatus] = useState<"single" | "couple">("single");
  const [isSsf, setIsSsf] = useState(true);
  const [retirement, setRetirement] = useState("0");
  const [life, setLife] = useState("0");
  const [health, setHealth] = useState("0");
  const [isFemaleSole, setIsFemaleSole] = useState(false);

  const result = useMemo(() => {
    const annualGross = (Number(monthly) || 0) * 12 + (Number(bonus) || 0);
    return {
      annualGross,
      ...calculateNepalSalaryTax({
        annualGross,
        filingStatus,
        isSsf,
        retirementContrib: Number(retirement) || 0,
        lifePremium: Number(life) || 0,
        healthPremium: Number(health) || 0,
        isFemaleSole,
      }),
    };
  }, [monthly, bonus, filingStatus, isSsf, retirement, life, health, isFemaleSole]);

  const inputClass =
    "w-full rounded-sm border border-border bg-input px-3 py-2 font-mono text-sm text-foreground focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none";

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-12 md:px-10 md:py-16">
      <div className="space-y-4">
        <ToolBreadcrumb tool={tool} />
        <h1 className="text-headline-lg text-foreground">Nepal Salary Tax Calculator</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          Estimate annual income tax for salaried employees in Nepal. FY-locked, band-by-band, 100% in your browser.
        </p>
        <p className="max-w-2xl rounded-sm border border-border bg-surface-low p-3 text-body-md text-muted-foreground">
          {NEPAL_TAX_2082_83.label} only — source: {NEPAL_TAX_2082_83.source} (verified{" "}
          {NEPAL_TAX_2082_83.verifiedOn}). Estimate only, not tax advice. Confirm with IRD, your employer, or a CA.
          FY 2083/84 uses different slabs and is not applied here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5 rounded-md border border-border bg-card p-6">
          <h2 className="border-b border-border pb-4 text-headline-md text-foreground">Income</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="salary-monthly" className="text-label-sm text-muted-foreground">
                Monthly gross (Rs)
              </label>
              <input
                id="salary-monthly"
                type="number"
                min={0}
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="salary-bonus" className="text-label-sm text-muted-foreground">
                Annual bonus (Rs)
              </label>
              <input
                id="salary-bonus"
                type="number"
                min={0}
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label-sm text-muted-foreground">Filing status</span>
            <div className="flex gap-2">
              {(["single", "couple"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilingStatus(s)}
                  className={`flex-1 rounded-sm border px-3 py-2 text-label-sm transition-colors ${
                    filingStatus === s
                      ? "border-primary bg-primary-button text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-primary"
                  }`}
                >
                  {s === "single" ? "Single" : "Couple (joint)"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Checkbox
              id="salary-ssf"
              label="SSF contributor (1% first-band waived)"
              checked={isSsf}
              onChange={(e) => setIsSsf(e.target.checked)}
            />
            <Checkbox
              id="salary-female"
              label="Female sole filer, employment income only (10% rebate)"
              checked={isFemaleSole}
              onChange={(e) => setIsFemaleSole(e.target.checked)}
            />
          </div>

          <h2 className="border-b border-border pb-4 text-headline-md text-foreground">Deductions claimed</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="salary-retirement" className="text-label-sm text-muted-foreground">
                SSF / EPF / CIT annual total (Rs) — cap min(5L, 1/3 income)
              </label>
              <input
                id="salary-retirement"
                type="number"
                min={0}
                value={retirement}
                onChange={(e) => setRetirement(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="salary-life" className="text-label-sm text-muted-foreground">
                  Life insurance (max 40k)
                </label>
                <input
                  id="salary-life"
                  type="number"
                  min={0}
                  value={life}
                  onChange={(e) => setLife(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="salary-health" className="text-label-sm text-muted-foreground">
                  Health insurance (max 20k)
                </label>
                <input
                  id="salary-health"
                  type="number"
                  min={0}
                  value={health}
                  onChange={(e) => setHealth(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-md border border-border bg-card p-6">
          <h2 className="border-b border-border pb-4 text-headline-md text-foreground">Result</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-sm bg-primary-button p-4 text-primary-foreground">
              <p className="text-label-sm opacity-80">Annual tax</p>
              <p className="font-mono text-xl font-semibold">{formatNpr(result.annualTax)}</p>
            </div>
            <div className="rounded-sm border border-border p-4">
              <p className="text-label-sm text-muted-foreground">Monthly TDS</p>
              <p className="font-mono text-xl font-semibold text-foreground">{formatNpr(result.monthlyTds)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p className="text-muted-foreground">
              Annual gross: <span className="font-mono text-foreground">{formatNpr(result.annualGross)}</span>
            </p>
            <p className="text-muted-foreground">
              Taxable: <span className="font-mono text-foreground">{formatNpr(result.taxableIncome)}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-label-sm font-medium text-foreground">Band-by-band breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-label-sm text-muted-foreground">
                    <th className="py-2 pr-4">Band</th>
                    <th className="py-2 pr-4">Rate</th>
                    <th className="py-2 pr-4 text-right">In band</th>
                    <th className="py-2 text-right">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {result.bands.map((b) => (
                    <tr key={b.label} className="border-t border-border">
                      <td className="py-2 pr-4 text-muted-foreground">{b.label}</td>
                      <td className="py-2 pr-4 font-mono text-foreground">{b.rate}%</td>
                      <td className="py-2 pr-4 text-right font-mono text-foreground">
                        {formatNpr(b.taxableInBand)}
                      </td>
                      <td className="py-2 text-right font-mono text-foreground">{formatNpr(b.tax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.rebate > 0 && (
              <p className="text-sm text-muted-foreground">
                Female rebate: <span className="font-mono text-foreground">−{formatNpr(result.rebate)}</span>
              </p>
            )}
          </div>

          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MaterialIcon name="info" className="mt-0.5 text-base" />
            Verify with your payslip TDS and IRD. If your employer uses FY 2083/84 slabs, do not use this result.
          </p>
        </div>
      </div>
    </div>
  );
}
