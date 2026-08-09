"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ToolCard } from "@/components/tools/tool-card";
import { MaterialIcon } from "@/components/ui/material-icon";
import { CATEGORY_ICONS } from "@/lib/tools/category-icons";
import { categories, searchTools, tools } from "@/lib/tools/registry";
import type { ToolCategoryId } from "@/lib/tools/types";

/**
 * `/tools` — the "All Tools" nav link's actual destination, previously a
 * 404 (see docs/PLAN.md Phase 5). Search reuses the same ranked
 * `searchTools` as Home; category filtering reads `?category=<id>` so
 * Home's category tiles and this page's own filter chips both drive the
 * same URL-as-source-of-truth state, rather than duplicating filter logic.
 *
 * `useSearchParams()` needs a Suspense boundary to keep the rest of the
 * page eligible for static prerendering (Next's documented pattern — same
 * approach as UrlShortenerTool's RedirectNotice).
 */
function ToolsBrowserInner() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") as ToolCategoryId | null;
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim();

  const results = normalizedQuery
    ? searchTools(normalizedQuery)
    : activeCategory
      ? tools.filter((tool) => tool.category === activeCategory)
      : tools;

  const activeCategoryLabel = activeCategory ? categories.find((c) => c.id === activeCategory)?.label : null;

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-12 md:px-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-headline-lg text-foreground">All Tools</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          Every free tool on DailyTools in one place — {tools.length} tools and counting, no sign-up required.
        </p>

        <div className="relative w-full max-w-xl">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-outline"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools..."
            aria-label="Search tools"
            className="h-12 w-full rounded-md border border-border-subtle bg-input pr-4 pl-12 text-body-md text-foreground shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/tools"
            className={`rounded-full border px-3 py-1 text-label-sm transition-colors ${
              !activeCategory
                ? "border-primary bg-primary-container text-primary-foreground"
                : "border-border-subtle bg-muted text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/tools?category=${category.id}`}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-label-sm transition-colors ${
                activeCategory === category.id
                  ? "border-primary bg-primary-container text-primary-foreground"
                  : "border-border-subtle bg-muted text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <MaterialIcon name={CATEGORY_ICONS[category.id]} className="text-[16px]" />
              {category.label}
            </Link>
          ))}
        </div>
      </header>

      <section>
        <div className="border-b border-border-subtle pb-2">
          <h2 className="text-headline-md text-foreground">
            {normalizedQuery
              ? `${results.length} result${results.length === 1 ? "" : "s"} for "${normalizedQuery}"`
              : activeCategoryLabel
                ? `${activeCategoryLabel} (${results.length})`
                : `All tools (${results.length})`}
          </h2>
        </div>
        {results.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-body-md text-muted-foreground">No tools match that search.</p>
        )}
      </section>
    </div>
  );
}

export function ToolsBrowser() {
  return (
    <Suspense fallback={null}>
      <ToolsBrowserInner />
    </Suspense>
  );
}
