import Link from "next/link";

import { footerNav, siteConfig } from "@/lib/site-config";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-muted">
      <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-8 px-4 py-12 md:flex-row md:px-10">
        <div className="flex flex-col gap-4">
          <span className="text-headline-md font-bold">{siteConfig.name}</span>
          <p className="max-w-xs text-body-md text-muted-foreground">{siteConfig.footerTagline}</p>
          {/* Dynamic year rather than a hardcoded one — a live site benefits
              from always being correct, unlike a point-in-time mockup. */}
          <p className="mt-2 text-label-sm text-muted-foreground">
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap gap-12 md:gap-24">
          <FooterColumn title="Navigation" links={footerNav.navigation} />
          <FooterColumn title="Legal" links={footerNav.legal} />
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-label-sm font-semibold uppercase tracking-wider text-foreground">{title}</span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-body-md text-muted-foreground underline transition-colors hover:text-primary"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
