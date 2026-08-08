import { siteConfig } from "@/lib/site-config";

/**
 * Placeholder only — proves the layout/fonts/theme foundation works.
 * The real Home page (hero, search, category grid) is Phase 1.
 */
export default function Home() {
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-24 text-center md:px-10">
      <h1 className="text-display">{siteConfig.name}</h1>
      <p className="text-body-lg max-w-xl text-muted-foreground">{siteConfig.description}</p>
      <p className="text-label-sm text-muted-foreground">
        Phase 0 foundation — tools land in the next phases.
      </p>
    </div>
  );
}
