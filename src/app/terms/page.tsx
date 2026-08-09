import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using DailyTools.",
  alternates: {
    canonical: "/terms",
  },
};

const LAST_UPDATED = "August 9, 2026";

/**
 * `/terms` — previously a 404 (see docs/PLAN.md Phase 5). Standard,
 * honest terms for a free browser-based utility site — not a template
 * copied wholesale from elsewhere. Same "not formal legal advice" caveat
 * as /privacy.
 */
export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 md:px-10">
      <header className="flex flex-col gap-2 border-b border-border-subtle pb-6">
        <h1 className="text-headline-lg text-foreground">Terms of Service</h1>
        <p className="text-label-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Using DailyTools</h2>
        <p className="text-body-md text-muted-foreground">
          DailyTools provides free utilities (calculators, converters, generators, and similar tools) for personal
          and professional use. By using this site, you agree to these terms.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Acceptable use</h2>
        <p className="text-body-md text-muted-foreground">Don&apos;t use DailyTools to:</p>
        <ul className="list-disc space-y-2 pl-5 text-body-md text-muted-foreground">
          <li>Break the law, or infringe anyone else&apos;s rights.</li>
          <li>
            Use the URL Shortener to create links to phishing pages, malware, spam, or other harmful or deceptive
            content.
          </li>
          <li>
            Attempt to disrupt the service — for example, automated scripts designed to overwhelm a tool or bypass
            its rate limits.
          </li>
        </ul>
        <p className="text-body-md text-muted-foreground">
          We reserve the right to disable a short link, or restrict access to the site, in response to abuse.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">No warranty</h2>
        <p className="text-body-md text-muted-foreground">
          DailyTools is provided &quot;as is,&quot; without warranty of any kind. We do our best to make every
          calculator and converter accurate, but we don&apos;t guarantee the results are error-free or fit for any
          particular purpose — see the{" "}
          <a href="/disclaimer" className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
            Disclaimer
          </a>{" "}
          for more on this.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Service changes</h2>
        <p className="text-body-md text-muted-foreground">
          Tools may be added, changed, or discontinued at any time, and we don&apos;t guarantee uninterrupted uptime.
          Short links created with the URL Shortener are intended to keep working indefinitely, but aren&apos;t
          guaranteed to.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Limitation of liability</h2>
        <p className="text-body-md text-muted-foreground">
          To the fullest extent permitted by law, DailyTools isn&apos;t liable for any damages arising from your use
          of, or inability to use, this site or its tools.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Changes to these terms</h2>
        <p className="text-body-md text-muted-foreground">
          If these terms change, this page will be updated and the date above will reflect it. Continued use of the
          site after a change means you accept the updated terms.
        </p>
      </section>

      <section className="flex flex-col gap-3 border-t border-border-subtle pt-6">
        <p className="text-label-sm text-muted-foreground">
          This page describes our actual terms as clearly as we can, but it isn&apos;t formal legal advice. Questions?{" "}
          <a href="/contact" className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
            Contact us
          </a>
          .
        </p>
      </section>
    </div>
  );
}
