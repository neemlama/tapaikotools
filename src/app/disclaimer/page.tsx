import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "What DailyTools' calculators and converters are — and aren't — for.",
  alternates: {
    canonical: "/disclaimer",
  },
};

const LAST_UPDATED = "August 9, 2026";

/**
 * `/disclaimer` — previously a 404 (see docs/PLAN.md Phase 5). The
 * substantive point is the finance/academic-calculator disclaimer, since
 * this site has real loan/EMI/interest/investment calculators and
 * grade/GPA calculators that someone could mistake for authoritative
 * numbers.
 */
export default function DisclaimerPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-10">
      <header className="flex flex-col gap-2 border-b border-border-subtle pb-6">
        <h1 className="text-headline-lg text-foreground">Disclaimer</h1>
        <p className="text-label-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">General</h2>
        <p className="text-body-md text-muted-foreground">
          Every tool on DailyTools is provided for general, informational, and convenience purposes. We build each
          calculator and converter to be accurate, but none of them are a substitute for professional advice or an
          official record.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Financial calculators</h2>
        <p className="text-body-md text-muted-foreground">
          The Loan, EMI, Interest, and Investment calculators produce estimates based on the numbers you enter and
          standard formulas. They don&apos;t account for fees, taxes, changing rates, or the specific terms of a real
          loan or investment product, and they are not financial advice. Confirm any real financial decision with
          your bank, lender, or a qualified financial advisor.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Academic calculators</h2>
        <p className="text-body-md text-muted-foreground">
          The GPA, CGPA, Attendance, and Marks/Percentage calculators are study aids. They aren&apos;t official
          academic records, and grading rules genuinely vary between institutions — always confirm results that
          matter (transcripts, eligibility thresholds, and so on) against your institution&apos;s own calculations.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Links to other sites</h2>
        <p className="text-body-md text-muted-foreground">
          Short links created with the URL Shortener redirect to destinations chosen by whoever created them, not by
          us. We don&apos;t control, and aren&apos;t responsible for, the content of external sites a short link
          points to.
        </p>
      </section>

      <section className="flex flex-col gap-3 border-t border-border-subtle pt-6">
        <p className="text-label-sm text-muted-foreground">
          Questions about a specific tool?{" "}
          <a href="/contact" className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
            Contact us
          </a>
          .
        </p>
      </section>
    </div>
  );
}
