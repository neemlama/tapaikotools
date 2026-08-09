"use client";

import { useMemo, useState } from "react";

import { StackedBarChart, type StackedBarDatum } from "@/components/tools/stacked-bar-chart";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";
import { projectInvestment } from "@/lib/tools/finance";

/**
 * Hand-transcribed from the Stitch "Investment Calculator" screen —
 * `layout: "custom"` in the registry (see ToolPageShell) because this
 * design has its own header, its own educational/"Risk vs. Reward"/FAQ
 * sections instead of a generic About/FAQ, and a highlighted "Future
 * Value" metric card with no shared-component equivalent.
 *
 * The chart keeps the app's real `StackedBarChart` (SVG, real hover
 * tooltip, dataviz-skill-validated --chart-principal/--chart-interest
 * colors — see docs/PLAN.md #5) rather than Stitch's own chart markup,
 * which is a static decoration: 6 `<div>`s at hand-picked heights (5%,
 * 15%, 10%, 25%...) labeled "Yr 1, Yr 2, Yr 4, Yr 6, Yr 8, Yr 10" — not
 * real data, and not proportional to the numbers shown elsewhere on the
 * same mockup. Transcribing its literal heights would mean shipping a
 * chart that lies about the very numbers computed above it.
 *
 * Stitch's own mockup also embeds two decorative photos from Google's
 * `lh3.googleusercontent.com` — an ephemeral asset host tied to the Stitch
 * preview, not something to hotlink from a shipped app (no license, no
 * durability guarantee). Replaced with gradient/icon tiles in the same
 * asymmetric two-tile layout; swap in real licensed photos here if/when you
 * have them.
 *
 * Those tiles originally shipped icon-only (`aria-hidden`, no text) as a
 * pure placeholder — but a systematic screenshot review (Phase A, see
 * docs/PLAN.md) flagged them as looking like broken/unfinished content
 * cards, since every other icon-in-a-box on this site pairs the icon with a
 * heading and supporting text. Gave them real (accurate, not fabricated
 * statistics) copy and dropped `aria-hidden` accordingly (2026-08-09) —
 * still trivially swappable for a real photo later, just no longer reads
 * as broken in the meantime.
 */

const tool = getToolBySlug("investment-calculator")!;

const DEFAULTS = { initial: "10000", monthly: "500", rate: "7", years: "10" };

function formatCurrency(value: number, decimals = 0) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

const RISK_TABLE = [
  { asset: "Equities (Stocks)", returnRange: "7-10%", risk: "High", riskClassName: "text-tertiary-container" },
  { asset: "Bonds", returnRange: "4-5%", risk: "Medium", riskClassName: "text-muted-foreground" },
  { asset: "Cash/Savings", returnRange: "1-2%", risk: "Low", riskClassName: "text-primary" },
] as const;

const FAQS = [
  {
    question: "Is inflation factored into these calculations?",
    answer:
      "No, this calculator shows nominal future value. To estimate real purchasing power, subtract the expected inflation rate (historically ~2-3%) from your expected return rate.",
  },
  {
    question: "How is the interest compounded?",
    answer:
      "This tool compounds monthly — your contribution and the previous balance both earn the next month's return. Depending on your specific investment vehicle, compounding may occur daily, monthly, quarterly, or annually.",
  },
] as const;

export function InvestmentCalculatorTool() {
  const [initial, setInitial] = useState(DEFAULTS.initial);
  const [monthly, setMonthly] = useState(DEFAULTS.monthly);
  const [rate, setRate] = useState(DEFAULTS.rate);
  const [years, setYears] = useState(DEFAULTS.years);

  const initialNum = Number(initial) || 0;
  const monthlyNum = Number(monthly) || 0;
  const rateNum = Number(rate) || 0;
  const yearsNum = Math.min(50, Math.max(1, Math.round(Number(years) || 0)));

  const projections = useMemo(
    () =>
      projectInvestment({
        initial: initialNum,
        monthlyContribution: monthlyNum,
        annualRatePercent: rateNum,
        years: yearsNum,
      }),
    [initialNum, monthlyNum, rateNum, yearsNum],
  );
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

  function handleReset() {
    setInitial(DEFAULTS.initial);
    setMonthly(DEFAULTS.monthly);
    setRate(DEFAULTS.rate);
    setYears(DEFAULTS.years);
  }

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-4 py-12 md:px-10">
      {/* Header */}
      <section className="flex max-w-2xl flex-col gap-4">
        <ToolBreadcrumb tool={tool} />
        <h1 className="text-display text-foreground">Investment Calculator</h1>
        <p className="text-body-lg text-muted-foreground">
          Project your wealth growth over time. See how compounding interest and consistent contributions can build
          your financial future.
        </p>
      </section>

      {/* Calculator interactive area */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Parameters panel */}
        <div className="flex flex-col gap-6 rounded-lg border border-border bg-background p-6 shadow-sm transition-colors hover:border-outline lg:sticky lg:top-24 lg:col-span-4">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <MaterialIcon name="tune" className="text-primary" />
            <h2 className="text-headline-md text-foreground">Parameters</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="initial" className="text-label-sm text-muted-foreground uppercase tracking-wider">
                Initial Investment ($)
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  $
                </span>
                <input
                  id="initial"
                  type="number"
                  min={0}
                  value={initial}
                  onChange={(event) => setInitial(event.target.value)}
                  className="w-full rounded border border-border bg-input p-2 pl-8 font-mono text-sm text-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="monthly" className="text-label-sm text-muted-foreground uppercase tracking-wider">
                Monthly Contribution ($)
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-muted-foreground">
                  $
                </span>
                <input
                  id="monthly"
                  type="number"
                  min={0}
                  value={monthly}
                  onChange={(event) => setMonthly(event.target.value)}
                  className="w-full rounded border border-border bg-input p-2 pl-8 font-mono text-sm text-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="rate" className="text-label-sm text-muted-foreground uppercase tracking-wider">
                  Annual Return Rate (%)
                </label>
                <span className="font-mono text-sm font-bold text-primary">{rateNum.toFixed(1)}%</span>
              </div>
              <input
                id="rate"
                type="range"
                min={1}
                max={15}
                step={0.1}
                value={Math.min(15, Math.max(1, rateNum))}
                onChange={(event) => setRate(event.target.value)}
                className="range-slider mt-2"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="years" className="text-label-sm text-muted-foreground uppercase tracking-wider">
                  Duration (Years)
                </label>
                <span className="font-mono text-sm font-bold text-primary">{yearsNum}</span>
              </div>
              <input
                id="years"
                type="range"
                min={1}
                max={40}
                step={1}
                value={yearsNum}
                onChange={(event) => setYears(event.target.value)}
                className="range-slider mt-2"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-outline bg-background px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted"
          >
            <MaterialIcon name="refresh" className="text-[18px]" />
            Reset Values
          </button>
        </div>

        {/* Results & visualization */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Key metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-6">
              <span className="flex items-center gap-1 text-label-sm text-muted-foreground uppercase">
                <MaterialIcon name="account_balance_wallet" className="text-[16px]" />
                Total Principal
              </span>
              <div className="mt-2 font-mono text-headline-lg text-foreground">
                {final ? formatCurrency(final.principal) : "—"}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-border border-l-4 border-l-secondary bg-background p-6">
              <span className="flex items-center gap-1 text-label-sm text-muted-foreground uppercase">
                <MaterialIcon name="trending_up" className="text-[16px]" />
                Interest Earned
              </span>
              <div className="mt-2 font-mono text-headline-lg text-secondary">
                {final ? formatCurrency(final.interest) : "—"}
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-primary bg-primary/10 p-6 shadow-sm">
              <span className="flex items-center gap-1 text-label-sm font-bold text-primary uppercase">
                <MaterialIcon name="monetization_on" className="text-[16px]" />
                Future Value
              </span>
              <div className="mt-2 font-mono text-headline-lg font-bold text-primary">
                {final ? formatCurrency(final.total) : "—"}
              </div>
            </div>
          </div>

          {/* Wealth gain chart */}
          <div className="flex min-h-[400px] flex-col gap-6 rounded-lg border border-border bg-background p-6">
            <h3 className="border-b border-border pb-4 text-headline-md text-foreground">Wealth Gain Projection</h3>
            {chartData.length > 0 ? (
              <StackedBarChart data={chartData} formatValue={(v) => formatCurrency(v)} />
            ) : (
              <p className="text-body-md text-muted-foreground">Enter your parameters to see a projection.</p>
            )}
          </div>
        </div>
      </section>

      {/* Educational content */}
      <section className="mt-12 grid grid-cols-1 gap-12 border-t border-border pt-16 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h3 className="text-headline-lg text-foreground">The Importance of Starting Early</h3>
          <p className="text-body-md leading-relaxed text-muted-foreground">
            Compound interest is often called the eighth wonder of the world. By starting your investment journey
            early, you give your money more time to generate earnings, which in turn generate their own earnings.
          </p>
          <div className="rounded-r border-l-4 border-primary bg-muted p-6">
            <p className="font-mono text-sm text-foreground italic">
              &quot;Time in the market beats timing the market.&quot;
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-border bg-gradient-to-br from-primary/10 to-secondary/10 p-4 text-center">
            <MaterialIcon name="query_stats" className="text-[32px] text-primary" />
            <h4 className="text-label-sm font-bold text-foreground">Exponential Growth</h4>
            <p className="text-xs text-muted-foreground">
              Compounding rewards time more than the size of any single contribution.
            </p>
          </div>
          <div className="flex h-48 w-full translate-y-8 flex-col items-center justify-center gap-2 rounded-lg border border-border bg-gradient-to-br from-secondary/10 to-primary/10 p-4 text-center">
            <MaterialIcon name="auto_awesome" className="text-[32px] text-secondary" />
            <h4 className="text-label-sm font-bold text-foreground">Small Habits Compound</h4>
            <p className="text-xs text-muted-foreground">
              Consistent contributions, even modest ones, add up meaningfully over long timelines.
            </p>
          </div>
        </div>
      </section>

      {/* Risk vs reward */}
      <section className="mt-8 flex flex-col items-center gap-8 rounded-xl bg-muted p-8 md:flex-row md:p-12">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-2 text-tertiary">
            <MaterialIcon name="warning" />
            <span className="text-label-sm font-bold tracking-wider uppercase">Considerations</span>
          </div>
          <h3 className="text-headline-lg text-foreground">Risk vs. Reward</h3>
          <p className="text-body-md text-muted-foreground">
            Higher expected returns usually come with higher risk. The 7-10% historical average of the stock market
            includes years of significant losses. Ensure your portfolio allocation matches your timeline and risk
            tolerance.
          </p>
        </div>
        <div className="w-full flex-1 rounded border border-border bg-background p-6">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 font-medium text-muted-foreground">Asset Class</th>
                <th className="pb-2 font-medium text-muted-foreground">Avg Return</th>
                <th className="pb-2 font-medium text-muted-foreground">Risk Level</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {RISK_TABLE.map((row, index) => (
                <tr key={row.asset} className={index < RISK_TABLE.length - 1 ? "border-b border-border/50" : ""}>
                  <td className="py-3 text-foreground">{row.asset}</td>
                  <td className="py-3 text-secondary">{row.returnRange}</td>
                  <td className={`py-3 ${row.riskClassName}`}>{row.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-12 mb-12 flex w-full max-w-3xl flex-col gap-8">
        <h3 className="text-center text-headline-md text-foreground">Frequently Asked Questions</h3>
        <div className="flex flex-col gap-4">
          {FAQS.map((faq) => (
            <div key={faq.question} className="rounded border border-border bg-background p-4">
              <h4 className="mb-2 text-[16px] font-semibold text-foreground">{faq.question}</h4>
              <p className="text-body-md text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
