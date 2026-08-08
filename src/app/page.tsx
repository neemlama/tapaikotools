import { ToolExplorer } from "@/components/home/tool-explorer";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <>
      <section className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-20 text-center md:px-10">
        <h1 className="text-display">{siteConfig.tagline}</h1>
        <p className="max-w-xl text-body-lg text-muted-foreground">{siteConfig.description}</p>
      </section>
      <ToolExplorer />
    </>
  );
}
