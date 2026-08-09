import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { categories } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

/**
 * Home / Category / Tool breadcrumb. Pulled out of ToolPageShell so
 * "custom" layout tools (see the `layout` field's doc comment in
 * lib/tools/types.ts) can render the exact same breadcrumb themselves —
 * e.g. CgpaCalculatorTool, whose Stitch design omitted one but was asked
 * for it back — without duplicating the markup.
 */
export function ToolBreadcrumb({ tool }: { tool: Tool }) {
  const category = categories.find((c) => c.id === tool.category);

  return (
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
  );
}
