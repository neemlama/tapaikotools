import type { ReactNode } from "react";

import { Faq, type FaqItem } from "@/components/tools/faq";
import { RelatedTools } from "@/components/tools/related-tools";
import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import type { Tool } from "@/lib/tools/types";

/**
 * Shared shell every /tools/[slug] page renders inside: breadcrumb + title
 * + description, the tool's own interactive UI (children), then — data-
 * driven, so no per-tool implementation file needs to change — an "About"
 * blurb, an FAQ grid (if content exists for this slug), and a "Related
 * tools" section. Matches the layout order seen across Stitch's tool
 * screens: interactive tool first, then explanation, then FAQ, then
 * related utilities. See docs/PLAN.md #6.
 */
export function ToolPageShell({
  tool,
  faq,
  children,
}: {
  tool: Tool;
  faq?: FaqItem[];
  children: ReactNode;
}) {
  // "custom" layout tools own their entire page — exact Stitch transcription
  // (own header treatment, own info/FAQ sections, sometimes no breadcrumb or
  // related-tools section) instead of this shell's standard wrapper. See
  // the `layout` field's doc comment in lib/tools/types.ts.
  if (tool.layout === "custom") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <ToolBreadcrumb tool={tool} />

      <header className="mt-4 max-w-2xl">
        <h1 className="text-headline-lg">{tool.title}</h1>
        <p className="mt-2 text-body-lg text-muted-foreground">{tool.description}</p>
      </header>

      <div className="mt-10">{children}</div>

      {tool.about && (
        <section className="mt-16 max-w-3xl">
          <h2 className="text-headline-lg">About this tool</h2>
          <p className="mt-3 text-body-lg text-muted-foreground">{tool.about}</p>
        </section>
      )}

      {faq && faq.length > 0 && (
        <section className="mt-16">
          <h2 className="text-headline-lg">Frequently asked questions</h2>
          <div className="mt-6">
            <Faq items={faq} />
          </div>
        </section>
      )}

      <RelatedTools tool={tool} />
    </div>
  );
}
