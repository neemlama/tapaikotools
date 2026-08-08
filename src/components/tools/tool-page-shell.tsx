import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { categories } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

/**
 * Shared shell every /tools/[slug] page renders inside: breadcrumb + title
 * + description, consistent container/spacing. Tool-specific UI (params
 * panel, output, FAQ, ...) is passed as children — see docs/PLAN.md #4/#5,
 * this is intentionally just the shell, not a rigid two-panel layout,
 * since tools vary too much in shape to force into one grid.
 */
export function ToolPageShell({ tool, children }: { tool: Tool; children: ReactNode }) {
  const category = categories.find((c) => c.id === tool.category);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-label-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        {category && (
          <>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <Link href={`/#${category.id}`} className="hover:text-foreground">
              {category.label}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-foreground">{tool.title}</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-headline-lg">{tool.title}</h1>
        <p className="mt-2 text-body-lg text-muted-foreground">{tool.description}</p>
      </header>

      <div className="mt-10">{children}</div>
    </div>
  );
}
