"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ToolCard } from "@/components/tools/tool-card";
import { categories, getPopularTools, getToolsByCategory, searchTools } from "@/lib/tools/registry";

/**
 * Search + popular shortcuts + category grid for the Home page, all
 * client-side against the static registry (see docs/PLAN.md #4/#5 — no
 * /tools or /search route yet, that's a later phase).
 *
 * Two distinct modes:
 *  - No query: browsing mode — popular shortcuts + the full category grid.
 *  - Query present: a single flat list ranked by match quality
 *    (searchTools), NOT grouped by category. Grouping by category while
 *    searching was the original bug report — a fixed category order means
 *    a highly relevant match (e.g. "Age Calculator" for "age") can end up
 *    buried under less relevant matches that just happen to live in a
 *    category that sorts first.
 */
export function ToolExplorer() {
  const [query, setQuery] = useState("");
  const popularTools = useMemo(() => getPopularTools(), []);

  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(() => searchTools(query), [query]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-24 md:px-10">
      {/* Search */}
      <div className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools…"
          aria-label="Search tools"
          className="w-full rounded-md border border-border bg-input py-3 pl-11 pr-11 text-body-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {normalizedQuery ? (
        <section className="mt-16">
          <h2 className="text-headline-lg">
            {results.length > 0
              ? `${results.length} result${results.length === 1 ? "" : "s"} for “${query.trim()}”`
              : `No tools match “${query.trim()}”`}
          </h2>
          {results.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {popularTools.length > 0 && (
            <section id="popular" className="mt-16 scroll-mt-24">
              <h2 className="text-headline-lg">Popular tools</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {popularTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-16 flex flex-col gap-16">
            {categories.map((category) => {
              const categoryTools = getToolsByCategory(category.id);
              if (categoryTools.length === 0) return null;

              return (
                <section key={category.id} id={category.id} className="scroll-mt-24">
                  <h2 className="text-headline-lg">{category.label}</h2>
                  <p className="mt-1 text-body-md text-muted-foreground">{category.description}</p>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryTools.map((tool) => (
                      <ToolCard key={tool.slug} tool={tool} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
