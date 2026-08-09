import { ToolCard } from "@/components/tools/tool-card";
import { getToolsByCategory } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

/**
 * "Related tools" section every tool page gets automatically (rendered by
 * ToolPageShell) — up to 3 other tools in the same category, pulled from
 * the registry. No per-tool authoring needed, matching Stitch's "Related
 * Developer Utilities" pattern seen on its screens.
 */
export function RelatedTools({ tool }: { tool: Tool }) {
  const related = getToolsByCategory(tool.category)
    .filter((candidate) => candidate.slug !== tool.slug)
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-headline-lg">Related tools</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((relatedTool) => (
          <ToolCard key={relatedTool.slug} tool={relatedTool} />
        ))}
      </div>
    </section>
  );
}
