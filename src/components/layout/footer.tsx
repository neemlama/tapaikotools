import Link from "next/link";

import { footerNav, siteConfig } from "@/lib/site-config";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
        <div className="grid gap-10 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <span className="text-headline-md">{siteConfig.name}</span>
            <p className="mt-2 text-body-md text-muted-foreground">{siteConfig.tagline}</p>
          </div>

          <FooterColumn title="Product" links={footerNav.product} />
          <FooterColumn title="Legal" links={footerNav.legal} />
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-label-sm text-muted-foreground">
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
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
    <div>
      <h3 className="text-label-sm text-muted-foreground">{title.toUpperCase()}</h3>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-body-md text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
