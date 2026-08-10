import type { Metadata } from "next";

import { MaterialIcon } from "@/components/ui/material-icon";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with TapaikoTools.",
  alternates: {
    canonical: "/contact",
  },
};

// Real contact address, confirmed by the site owner (2026-08-09) — was a
// deliberate placeholder before this (see docs/PLAN.md Phase 5 / chat).
const CONTACT_EMAIL = "lamaneem64@gmail.com";

/**
 * `/contact` — previously a 404 (see docs/PLAN.md Phase 5). Simple by
 * design: a real support inbox is a bigger decision (personal email vs. a
 * dedicated alias vs. a form service) than something to pick unilaterally.
 */
export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 md:px-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-headline-lg text-foreground">Contact</h1>
        <p className="text-body-lg text-muted-foreground">
          Found a bug, have a tool idea, or something else on your mind? We&apos;d like to hear it.
        </p>
      </header>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-primary">
          <MaterialIcon name="mail" />
        </span>
        <div>
          <p className="text-label-sm text-muted-foreground">Email</p>
          <p className="text-headline-md text-foreground">{CONTACT_EMAIL}</p>
        </div>
      </a>

      <p className="text-body-md text-muted-foreground">
        TapaikoTools is a small, independently-run project, so replies may take a little while — but every message
        gets read.
      </p>

      <p className="text-label-sm text-muted-foreground">
        A product of{" "}
        <a
          href="https://neemlama.com.np"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        >
          Neem J. Lama
        </a>
        .
      </p>
    </div>
  );
}
