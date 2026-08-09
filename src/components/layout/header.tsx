"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MaterialIcon } from "@/components/ui/material-icon";
import { primaryNav, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function isNavItemActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href.startsWith("/#")) return false; // same-page anchor, not a route
  return pathname.startsWith(href);
}

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 md:px-10">
        <Link href="/" className="text-headline-md font-bold shrink-0">
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {primaryNav.map((item) => {
            const active = isNavItemActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-body-md pb-1 transition-colors",
                  active
                    ? "border-b-2 border-primary font-bold text-primary"
                    : "font-medium text-muted-foreground hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          {/*
           * Was a dead `<button>` with no onClick at all — a user reported
           * "the search bar isn't working," which was accurate: clicking it
           * did nothing (2026-08-09). The site's real search lives on
           * `/tools` (ToolsBrowser); this now actually takes you there
           * instead of just looking like a search control.
           */}
          <Link
            href="/tools"
            aria-label="Search tools"
            className="inline-flex h-9 w-9 items-center justify-center text-primary transition-colors hover:opacity-80"
          >
            <MaterialIcon name="search" />
          </Link>
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center text-primary transition-colors hover:opacity-80 md:hidden"
          >
            <MaterialIcon name={mobileNavOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-t border-border transition-[max-height] duration-200 ease-in-out md:hidden",
          mobileNavOpen ? "max-h-72" : "max-h-0 border-t-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileNavOpen(false)}
              className="rounded-md px-2 py-2 text-body-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
