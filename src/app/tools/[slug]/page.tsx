import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComingSoonTool } from "@/components/tools/coming-soon";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { getFaqForSlug } from "@/lib/tools/faq-content";
import { toolImplementations } from "@/lib/tools/implementations";
import { getToolBySlug, tools } from "@/lib/tools/registry";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

/**
 * Per-tool metadata — title/description already came from the registry;
 * this also gives each tool its own canonical URL and its own Open
 * Graph/Twitter title+description, rather than silently inheriting the
 * root layout's site-wide ones (Next only merges metadata one key at a
 * time — a page that sets its own top-level `title`/`description` but
 * *not* `openGraph`/`twitter` still inherits the parent's `openGraph`
 * object as a whole, generic title and all). The registry is the only
 * thing that changes to add a new tool; nothing here is slug-specific
 * beyond that.
 */
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.description,
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
    openGraph: {
      title: tool.title,
      description: tool.description,
    },
    twitter: {
      title: tool.title,
      description: tool.description,
    },
  };
}

export default async function ToolPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const Implementation = toolImplementations[tool.slug];

  return (
    <ToolPageShell tool={tool} faq={getFaqForSlug(tool.slug)}>
      {Implementation ? <Implementation /> : <ComingSoonTool tool={tool} />}
    </ToolPageShell>
  );
}
