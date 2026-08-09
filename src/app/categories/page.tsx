import type { Metadata } from "next";
import Link from "next/link";

import { MaterialIcon } from "@/components/ui/material-icon";
import { CATEGORY_ICONS } from "@/lib/tools/category-icons";
import { categories, getToolsByCategory } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse DailyTools' free utilities by category.",
  alternates: {
    canonical: "/categories",
  },
};

/**
 * `/categories` — the "Categories" nav link's actual destination,
 * previously a 404 (see docs/PLAN.md Phase 5). Static/server-only, no
 * interactivity needed: each card just links into `/tools?category=<id>`,
 * which does the actual filtering (see ToolsBrowser).
 */
export default function CategoriesPage() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-12 md:px-10">
      <header className="flex flex-col gap-4">
        <h1 className="text-headline-lg text-foreground">Categories</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          Every tool on DailyTools, grouped by what it&apos;s for.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const toolCount = getToolsByCategory(category.id).length;
          return (
            <Link
              key={category.id}
              href={`/tools?category=${category.id}`}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary transition-colors group-hover:bg-primary-button group-hover:text-primary-foreground">
                  <MaterialIcon name={CATEGORY_ICONS[category.id]} />
                </span>
                <span className="text-label-sm text-muted-foreground">
                  {toolCount} tool{toolCount === 1 ? "" : "s"}
                </span>
              </div>
              <div>
                <h2 className="text-headline-md text-foreground">{category.label}</h2>
                <p className="mt-1 text-body-md text-muted-foreground">{category.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
