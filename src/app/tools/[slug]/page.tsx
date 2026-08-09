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

export async function generateMetadata(props: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return { title: tool.title, description: tool.description };
}

export default async function ToolPage(props: PageProps<"/tools/[slug]">) {
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
