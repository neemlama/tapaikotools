import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ComingSoonTool } from "@/components/tools/coming-soon";
import { ToolPageShell } from "@/components/tools/tool-page-shell";
import { siteConfig } from "@/lib/site-config";
import { SITE_URL } from "@/lib/site-url";
import { getFaqForSlug } from "@/lib/tools/faq-content";
import { toolImplementations } from "@/lib/tools/implementations";
import { categories, getToolBySlug, tools } from "@/lib/tools/registry";

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
    title: `${tool.title} — Free Online | ${siteConfig.name}`,
    description: tool.description,
    keywords: [tool.title, `${tool.title} online`, `${tool.title} free`, "tapaikotools", ...siteConfig.keywords],
    alternates: {
      canonical: `/tools/${tool.slug}`,
    },
    openGraph: {
      title: `${tool.title} | ${siteConfig.name}`,
      description: tool.description,
      url: `/tools/${tool.slug}`,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: tool.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.title} | ${siteConfig.name}`,
      description: tool.description,
    },
  };
}

export default async function ToolPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  const Implementation = toolImplementations[tool.slug];

  // Central SEO baseline for all 27 tools (why: only 5/27 had
  // SoftwareApplication JSON-LD, hand-written inside client components —
  // custom-layout tools bypass ToolPageShell so per-component blocks don't
  // scale. Server-rendered here so every tool gets rich-result eligibility
  // without touching 22 files. Per-tool FAQPage blocks stay in their own
  // components for now — removed/duplicated in a follow-up commit).
  const category = categories.find((c) => c.id === tool.category);
  const toolUrl = `${SITE_URL}/tools/${tool.slug}`;
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.title} — ${siteConfig.name}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: tool.description,
    url: toolUrl,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "All Tools", item: `${SITE_URL}/tools` },
      ...(category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: category.label,
              item: `${SITE_URL}/tools?category=${category.id}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: category ? 4 : 3,
        name: tool.title,
        item: toolUrl,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ToolPageShell tool={tool} faq={getFaqForSlug(tool.slug)}>
        {Implementation ? <Implementation /> : <ComingSoonTool tool={tool} />}
      </ToolPageShell>
    </>
  );
}
