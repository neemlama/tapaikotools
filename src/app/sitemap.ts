import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";
import { tools } from "@/lib/tools/registry";

const STATIC_ROUTES = ["", "/tools", "/categories", "/about", "/contact", "/privacy", "/terms", "/disclaimer"];

/**
 * Only lists `status: "available"` tools — a "coming soon" placeholder
 * page has nothing worth indexing, and shouldn't rank for a tool that
 * doesn't actually work yet.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  const toolEntries = tools
    .filter((tool) => tool.status === "available")
    .map((tool) => ({
      url: `${SITE_URL}/tools/${tool.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [...staticEntries, ...toolEntries];
}
