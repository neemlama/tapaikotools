import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "What DailyTools is, and why it's built the way it is.",
  alternates: {
    canonical: "/about",
  },
};

/**
 * `/about` — the "About" nav link's actual destination, previously a 404
 * (see docs/PLAN.md Phase 5). No Stitch source exists for this page (the
 * original 22-screen design only covered Home + the 20 tools) — written
 * fresh, matching the established typography/token conventions rather than
 * transcribed from a mockup.
 */
export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-12 md:px-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-headline-lg text-foreground">About DailyTools</h1>
        <p className="text-body-lg text-muted-foreground">
          A growing collection of small, fast, free utilities for everyday tasks — built to just work, without
          getting in your way.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">What this is</h2>
        <p className="text-body-md text-muted-foreground">
          DailyTools is a set of single-purpose calculators, converters, generators, and text/developer utilities —
          things like a CGPA calculator, a JSON formatter, a password generator, a QR code generator. Each one does
          one job, does it on one page, and gets out of your way once you have your answer.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">How it works</h2>
        <p className="text-body-md text-muted-foreground">
          Almost every tool here runs entirely in your browser — your input never leaves your device. There&apos;s no
          sign-up, no account, and nothing to install. The one exception is the URL Shortener, which needs a small
          server-side database to make short links actually redirect for anyone who clicks them; see the{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>{" "}
          for exactly what that stores.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Free, and staying free</h2>
        <p className="text-body-md text-muted-foreground">
          Every tool on this site is free to use, with no usage caps for normal, everyday use. That&apos;s the plan
          going forward too — if a paid tier is ever introduced for a specific feature (like custom short links), the
          tools you already use today stay free.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-headline-md text-foreground">Feedback</h2>
        <p className="text-body-md text-muted-foreground">
          Found a bug, or want a tool that isn&apos;t here yet?{" "}
          <a href="/contact" className="text-primary hover:underline">
            Get in touch
          </a>
          .
        </p>
      </section>
    </div>
  );
}
