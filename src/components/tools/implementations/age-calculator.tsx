"use client";

import { useMemo, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/ui/material-icon";
import { calculateAge, getNextBirthday, parseDateInput, type AgeBreakdown } from "@/lib/date";
import { getToolBySlug } from "@/lib/tools/registry";

/**
 * Hand-transcribed from the Stitch "Age Calculator" screen — this page has
 * `layout: "custom"` in the registry (see ToolPageShell) because its Stitch
 * design has its own bento-grid results (hero age card, next-birthday card,
 * fun-facts strip) and its own "About" + accordion FAQ section, none of
 * which fit the shared Panel/ResultCard/MiniStat/Faq pieces or
 * ToolPageShell's standard wrapper without diverging from the design
 * anyway. Same call as CgpaCalculatorTool / JsonFormatterTool. The
 * "Related tools" section the standard shell would add is absent from this
 * Stitch screen too.
 *
 * Breadcrumb added after launch (2026-08-09) — see AttendanceCalculatorTool
 * for why (a user-found site-wide consistency pass, not Finance-only).
 * `/tools` didn't exist yet when this page first shipped, which was the
 * original reason it had none; it does now.
 */

const tool = getToolBySlug("age-calculator")!;

const FAQ_ITEMS = [
  {
    question: "How is the exact age calculated?",
    answer:
      "The calculator subtracts your date of birth from the current date (or a specific comparison date you provide). It accounts for varying days in a month and leap years to provide a precise calculation in years, months, and days.",
  },
  {
    question: "Does it account for leap years?",
    answer:
      "Yes. The underlying algorithm accurately calculates the number of days between two dates, naturally incorporating the extra day in February during leap years.",
  },
  {
    question: "Can I calculate age for a future or past date?",
    answer:
      'Yes, by using the optional "Age at the date of" field, you can determine how old someone was on a specific historical date, or how old they will be in the future.',
  },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Dot-matrix "years" grid — one dot per year, filled for years already
 * lived, toward a round 100-year total. 100, not an actuarial life
 * expectancy: this deliberately doesn't claim to predict how long anyone
 * will actually live (which would be presumptuous, inaccurate for an
 * individual, and could read as morbid for a simple utility tool) — it's
 * framed in the UI copy as "if you live to 100," an illustrative, universally
 * understood milestone, not a forecast. Years, not weeks or days: a 90+ year
 * life in days is 30,000+ dots (impractical to render meaningfully); in
 * years it's a manageable 100.
 *
 * Laid out with `flex-wrap`, not a fixed-column grid: this lets the dots
 * naturally wrap to fill the card's actual width (same parent as the "X of
 * 100 years lived" caption above it), so the block reads as a wide band
 * aligned with the card/text rather than a small square stranded in one
 * corner.
 */
const LIFE_GRID_TOTAL_YEARS = 100;

export function AgeCalculatorTool() {
  const [birthDateInput, setBirthDateInput] = useState("");
  const [asOfInput, setAsOfInput] = useState("");

  // Same "only ever computed from user input" reasoning as before — see
  // docs/PLAN.md #4 — plus the next-birthday date, reusing calculateAge's
  // own calendar-aware month/day math instead of duplicating it (see
  // getNextBirthday's doc comment in lib/date.ts).
  const result = useMemo(() => {
    const birthDate = parseDateInput(birthDateInput);
    if (!birthDate) return null;
    const asOfDate = asOfInput ? parseDateInput(asOfInput) : new Date();
    if (!asOfDate) return null;
    if (birthDate.getTime() > asOfDate.getTime()) {
      return { error: "Date of birth is after the “age at the date of” date.", age: null };
    }
    const age: AgeBreakdown = calculateAge(birthDate, asOfDate);
    const nextBirthdayDate = getNextBirthday(birthDate, asOfDate);
    const untilNextBirthday = calculateAge(asOfDate, nextBirthdayDate);
    return {
      error: null,
      age,
      nextBirthday: { date: nextBirthdayDate, months: untilNextBirthday.months, days: untilNextBirthday.days },
      totalMonths: age.years * 12 + age.months,
      totalWeeks: Math.floor(age.totalDays / 7),
      totalHours: age.totalDays * 24,
    };
  }, [birthDateInput, asOfInput]);

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <header className="max-w-2xl">
        <ToolBreadcrumb tool={tool} />
        <h1 className="mt-4 text-headline-lg">Age Calculator</h1>
        <p className="mt-2 text-body-lg text-muted-foreground">
          Calculate your exact age in years, months, days, and discover interesting details like your total days
          lived and time until your next birthday.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Calculator input */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-6 border-b border-border pb-4 text-headline-md">Enter Details</h2>
            <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  required
                  value={birthDateInput}
                  onChange={(event) => setBirthDateInput(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="comparison-date">Age at the date of (Optional)</Label>
                <Input
                  id="comparison-date"
                  type="date"
                  value={asOfInput}
                  onChange={(event) => setAsOfInput(event.target.value)}
                />
              </div>
              <Button type="submit" className="mt-2 w-full">
                <MaterialIcon name="calculate" className="text-[18px]" />
                Calculate Age
              </Button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8">
          {result?.error && (
            <p role="alert" className="text-body-md text-destructive">
              {result.error}
            </p>
          )}

          {result?.age ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Main age result */}
              <div className="relative flex flex-col items-start justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary-container p-8 text-primary-foreground shadow-sm md:col-span-2 lg:col-span-2">
                <div className="absolute -right-12 -bottom-12 opacity-10">
                  <MaterialIcon name="cake" className="text-[160px]" />
                </div>
                <h3 className="mb-2 text-label-sm uppercase tracking-widest opacity-80">Exact Age</h3>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-display font-bold">{result.age.years}</span>
                  <span className="text-headline-md">Years</span>
                </div>
                <div className="flex items-baseline gap-4 text-headline-md opacity-90">
                  <span>
                    {result.age.months} <span className="text-body-md">Months</span>
                  </span>
                  <span>
                    {result.age.days} <span className="text-body-md">Days</span>
                  </span>
                </div>
              </div>

              {/* Next birthday */}
              <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-primary">
                  <MaterialIcon name="event_upcoming" />
                  <h3 className="text-label-sm font-medium">Next Birthday</h3>
                </div>
                <div className="mb-1 text-headline-lg font-semibold text-foreground">
                  {result.nextBirthday.months} Months
                </div>
                <div className="text-body-md text-muted-foreground">and {result.nextBirthday.days} Days</div>
                <div className="mt-4 rounded border-t border-border bg-muted pt-4 pb-2 text-center font-mono text-sm text-muted-foreground">
                  {formatDate(result.nextBirthday.date)}
                </div>
              </div>

              {/* Fun facts */}
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-4 lg:col-span-3">
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 text-center shadow-sm">
                  <span className="mb-1 text-label-sm text-muted-foreground">Total Months</span>
                  <span className="text-headline-md text-foreground">{result.totalMonths.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 text-center shadow-sm">
                  <span className="mb-1 text-label-sm text-muted-foreground">Total Weeks</span>
                  <span className="text-headline-md text-foreground">{result.totalWeeks.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 text-center shadow-sm">
                  <span className="mb-1 text-label-sm text-muted-foreground">Total Days</span>
                  <span className="text-headline-md text-foreground">{result.age.totalDays.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 text-center shadow-sm">
                  <span className="mb-1 text-label-sm text-muted-foreground">Total Hours</span>
                  <span className="text-headline-md text-foreground">{result.totalHours.toLocaleString()}</span>
                </div>
              </div>

              {/* Life in years — dot matrix */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2 lg:col-span-3">
                <div className="mb-1 flex items-center gap-2 text-primary">
                  <MaterialIcon name="grid_view" />
                  <h3 className="text-label-sm font-medium">Your Life in Years</h3>
                </div>
                <p className="mb-5 text-body-md text-muted-foreground">
                  {Math.min(LIFE_GRID_TOTAL_YEARS, result.age.years)} of {LIFE_GRID_TOTAL_YEARS} years lived —
                  each dot is one year. Illustrative only, assuming a life to {LIFE_GRID_TOTAL_YEARS}; not a
                  prediction.
                </p>
                <div
                  role="img"
                  aria-label={`${Math.min(LIFE_GRID_TOTAL_YEARS, result.age.years)} of ${LIFE_GRID_TOTAL_YEARS} years lived`}
                  className="flex flex-wrap gap-2"
                >
                  {Array.from({ length: LIFE_GRID_TOTAL_YEARS }, (_, i) => {
                    const lived = i < result.age.years;
                    return (
                      <div
                        key={i}
                        aria-hidden="true"
                        title={`Year ${i + 1}${lived ? " — lived" : ""}`}
                        className={
                          lived
                            ? "h-4 w-4 shrink-0 rounded-full bg-primary-container"
                            : "h-4 w-4 shrink-0 rounded-full border border-border bg-transparent"
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            !result?.error && (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
                <MaterialIcon name="cake" className="mb-3 text-[40px] text-muted-foreground/60" />
                <p className="text-body-md text-muted-foreground">
                  Enter your date of birth to see your exact age and fun facts.
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Information section */}
      <section className="mx-auto mt-16 max-w-3xl border-t border-border pt-16">
        <h2 className="mb-6 text-headline-md">About the Age Calculator</h2>
        <div className="mb-12 flex flex-col gap-4 text-body-md text-muted-foreground">
          <p>
            The Age Calculator is a simple utility tool designed to determine your exact age in years, months, and
            days based on your date of birth. It uses the standard Gregorian calendar to perform calculations,
            ensuring accuracy regardless of leap years or varying month lengths.
          </p>
          <p>
            Beyond standard age calculation, this tool provides a breakdown of your life in different units of time,
            offering a unique perspective on how many total days, weeks, or hours you&apos;ve experienced.
          </p>
        </div>

        <h3 className="mb-6 text-headline-md">Frequently Asked Questions</h3>
        <div className="flex flex-col gap-4">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-border bg-card [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between p-4 text-label-sm font-medium text-foreground">
                {item.question}
                <MaterialIcon name="expand_more" className="transition duration-300 group-open:-rotate-180" />
              </summary>
              <div className="px-4 pb-4 text-body-md text-muted-foreground">{item.answer}</div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
