import type { Metadata } from "next";

import { ToolsBrowser } from "@/components/tools/tools-browser";

export const metadata: Metadata = {
  title: "All Tools",
  description: "Browse every free tool on DailyTools — calculators, converters, generators, and more.",
  // Fixed, not request-derived — the `?category=` filter (see ToolsBrowser)
  // is client-side state on this same page, not a distinct piece of
  // content, so every filtered view should point search engines back at
  // this one canonical URL rather than being indexed as separate pages.
  alternates: {
    canonical: "/tools",
  },
};

export default function ToolsIndexPage() {
  return <ToolsBrowser />;
}
