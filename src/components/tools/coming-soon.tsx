import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { Tool } from "@/lib/tools/types";

/** Fallback content for a valid tool slug that hasn't been built yet. */
export function ComingSoonTool({ tool }: { tool: Tool }) {
  const Icon = tool.icon;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-foreground">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-body-lg text-muted-foreground">
        {tool.title} isn&rsquo;t built yet — it&rsquo;s on the roadmap.
      </p>
      <Link href="/" className={buttonVariants({ variant: "secondary" })}>
        Back to all tools
      </Link>
    </div>
  );
}
