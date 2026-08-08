import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import type { Tool } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

/**
 * Renders a tool as a live link when its registry status is "available",
 * or as a non-interactive card with a "Coming soon" badge otherwise — so
 * the site never ships a link to a page that doesn't exist yet. Flipping
 * a tool's status in the registry (once its page is built) is the only
 * change needed to make its card go live everywhere it's rendered.
 */
export function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const isAvailable = tool.status === "available";

  const cardClassName = cn(
    "flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-6 transition-colors",
    isAvailable && "hover:border-primary",
  );

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
          <Icon className="h-5 w-5" />
        </span>
        {!isAvailable && <Badge>Coming soon</Badge>}
      </div>
      <div>
        <h3 className="text-headline-md">{tool.title}</h3>
        <p className="mt-1 text-body-md text-muted-foreground">{tool.description}</p>
      </div>
    </>
  );

  if (isAvailable) {
    return (
      <Link href={`/tools/${tool.slug}`} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cn(cardClassName, "opacity-80")} aria-disabled="true">
      {content}
    </div>
  );
}
