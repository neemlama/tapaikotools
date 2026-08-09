import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What DailyTools does and doesn't do with your data.",
  alternates: {
    canonical: "/privacy",
  },
};

const LAST_UPDATED = "August 9, 2026";

/**
 * `/privacy` — previously a 404 (see docs/PLAN.md Phase 5). Written to
 * accurately reflect what this codebase actually does — no accounts, no
 * analytics, most tools 100% client-side, URL Shortener the one exception
 * with real server-side storage — not generic boilerplate. Flagged in the
 * closing note as not a substitute for legal review, especially now that a
 * paid tier is being discussed (see chat).
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-10">
      <header className="flex flex-col gap-2 border-b border-border-subtle pb-6">
        <h1 className="text-headline-lg text-foreground">Privacy Policy</h1>
        <p className="text-label-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">The short version</h2>
        <p className="text-body-md text-muted-foreground">
          No accounts, no sign-up, and almost everything runs entirely in your browser — your input never reaches our
          servers at all for the vast majority of tools. The one exception is the URL Shortener, which necessarily
          stores what you submit to it. Details below.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Most tools: nothing leaves your device</h2>
        <p className="text-body-md text-muted-foreground">
          Calculators, converters, generators, and text tools (CGPA calculator, JSON formatter, password generator,
          word counter, and so on) run entirely as JavaScript in your browser. Whatever you type or paste into them
          is processed locally and is never transmitted anywhere.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">URL Shortener: what&apos;s actually stored</h2>
        <ul className="list-disc space-y-2 pl-5 text-body-md text-muted-foreground">
          <li>
            The long URL you submit is stored in our database (Upstash Redis) alongside the short code, so the short
            link can redirect anyone who visits it — this one has to reach our server, that&apos;s how it works.
          </li>
          <li>
            A short-lived counter tied to your IP address is stored temporarily to prevent abuse (rate limiting).
            These counters expire automatically within minutes and aren&apos;t used for anything else.
          </li>
          <li>
            &quot;Recent History&quot; on the URL Shortener page is stored only in your own browser (local storage),
            not on our servers — it&apos;s a personal convenience list, not something we can see.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Local storage</h2>
        <p className="text-body-md text-muted-foreground">
          Your light/dark theme preference is saved in your browser&apos;s local storage so it persists between
          visits. It stays on your device and isn&apos;t sent to us.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Third-party services</h2>
        <p className="text-body-md text-muted-foreground">
          Fonts are loaded from Google Fonts, which means your browser makes a request to Google&apos;s servers to
          fetch them (standard for any site using web fonts — Google can see the request, including your IP address,
          the same as any other resource your browser loads from a third party). We don&apos;t run any analytics,
          advertising, or tracking scripts on this site.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Changes to this policy</h2>
        <p className="text-body-md text-muted-foreground">
          If what this site stores or how it works changes meaningfully, this page will be updated and the date
          above will reflect it.
        </p>
      </section>

      <section className="flex flex-col gap-3 border-t border-border-subtle pt-6">
        <p className="text-label-sm text-muted-foreground">
          This page describes our actual practices as accurately as we can, but it isn&apos;t formal legal advice.
          Questions? <a href="/contact" className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">Contact us</a>.
        </p>
      </section>
    </div>
  );
}
