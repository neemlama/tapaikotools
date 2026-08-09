"use client";

import Link from "next/link";
import { useState } from "react";

import { ToolCard } from "@/components/tools/tool-card";
import { MaterialIcon } from "@/components/ui/material-icon";
import { siteConfig } from "@/lib/site-config";
import { CATEGORY_ICONS } from "@/lib/tools/category-icons";
import { categories, getToolBySlug, searchTools } from "@/lib/tools/registry";

/**
 * Exact copy/layout from the Stitch Home export (see docs/PLAN.md #6) — 6
 * literal Popular Tools cards rather than derived from the registry's
 * `popular` flag, since Stitch's own wording for a couple of these
 * (e.g. "Percentage Calculator") doesn't match this registry's tool
 * titles/descriptions 1:1 yet. Slugs are cross-checked against the
 * registry below so a card never links anywhere broken.
 */
const POPULAR_CARDS = [
  {
    slug: "json-formatter",
    icon: "data_object",
    title: "JSON Formatter",
    description: "Beautify, validate, and minify JSON data quickly. Perfect for debugging API responses.",
  },
  {
    slug: "word-counter",
    icon: "text_fields",
    title: "Word Counter",
    description: "Count words, characters, sentences, and paragraphs in real-time as you type or paste.",
  },
  {
    slug: "age-calculator",
    icon: "cake",
    title: "Age Calculator",
    description: "Calculate exact age in years, months, and days based on a specific date of birth.",
  },
  {
    slug: "marks-percentage-calculator",
    icon: "percent",
    title: "Percentage Calculator",
    description:
      "Quickly find percentages, percentage increase/decrease, or what percentage one number is of another.",
  },
  {
    slug: "cgpa-calculator",
    icon: "school",
    title: "CGPA Calculator",
    description: "Easily calculate your Cumulative Grade Point Average based on course credits and grades.",
  },
  {
    slug: "qr-code-generator",
    icon: "qr_code_2",
    title: "QR Generator",
    description: "Generate custom QR codes for URLs, text, Wi-Fi passwords, or contact information instantly.",
  },
] as const;

const SEARCH_CHIPS = ["JSON Formatter", "Word Counter", "CGPA Calc"];

export function HomeContent() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();
  const results = normalizedQuery ? searchTools(normalizedQuery) : [];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-16 px-4 py-16 md:px-10">
      {/* Hero */}
      <section className="flex w-full max-w-3xl flex-col items-center pt-12 pb-12 text-center md:pt-24">
        <h1 className="text-display mb-6">{siteConfig.tagline}</h1>
        <p className="text-body-lg mb-10 max-w-2xl text-muted-foreground">{siteConfig.description}</p>

        <form onSubmit={(event) => event.preventDefault()} className="group relative w-full max-w-xl">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: CGPA calculator, JSON formatter, word counter..."
            aria-label="Search tools"
            className="h-14 w-full rounded-md border border-border-subtle bg-input pl-12 pr-4 text-body-md text-foreground shadow-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm bg-primary-button px-4 py-2 text-label-sm text-primary-foreground transition-all hover:brightness-110"
          >
            Search
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="text-label-sm py-1 text-muted-foreground">Popular:</span>
          {SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setQuery(chip)}
              className="rounded-full border border-border-subtle bg-muted px-3 py-1 text-label-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {normalizedQuery ? (
        <section className="w-full">
          <h2 className="text-headline-lg-mobile md:text-headline-lg border-b border-border-subtle pb-2">
            {results.length > 0
              ? `${results.length} result${results.length === 1 ? "" : "s"} for "${normalizedQuery}"`
              : `No tools match "${normalizedQuery}"`}
          </h2>
          {results.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {results.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Popular Tools bento */}
          <section id="popular" className="w-full scroll-mt-24">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
              <h2 className="text-headline-lg-mobile md:text-headline-lg">Popular Tools</h2>
              <Link href="/tools" className="text-label-sm flex items-center gap-1 text-primary hover:underline">
                View all
                <MaterialIcon name="arrow_forward" className="text-[16px]" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {POPULAR_CARDS.map((card) => {
                const tool = getToolBySlug(card.slug);
                const available = tool?.status === "available";
                const content = (
                  <>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-muted text-primary transition-colors group-hover:bg-primary-button group-hover:text-primary-foreground">
                      <MaterialIcon name={card.icon} />
                    </div>
                    <h3 className="text-headline-md mb-2">{card.title}</h3>
                    <p className="text-body-md line-clamp-2 text-muted-foreground">{card.description}</p>
                  </>
                );
                return available ? (
                  <Link
                    key={card.slug}
                    href={`/tools/${card.slug}`}
                    className="group flex flex-col rounded-md border border-border-subtle bg-card p-6 transition-all duration-200 hover:border-outline hover:shadow-sm"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={card.slug}
                    aria-disabled="true"
                    className="flex flex-col rounded-md border border-border-subtle bg-card p-6 opacity-70"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Categories */}
          <section className="w-full">
            <div className="border-b border-border-subtle pb-2">
              <h2 className="text-headline-lg-mobile md:text-headline-lg">Categories</h2>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/tools?category=${category.id}`}
                  className="group flex flex-col items-center justify-center rounded-md border border-border-subtle bg-card p-6 text-center transition-colors hover:bg-muted"
                >
                  <MaterialIcon
                    name={CATEGORY_ICONS[category.id]}
                    className="mb-3 text-[32px] text-border transition-colors group-hover:text-primary"
                  />
                  <span className="text-label-sm text-foreground">{category.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
