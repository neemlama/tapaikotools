/**
 * Site-wide constants: name, tagline, and nav/footer links.
 *
 * The Stitch screens didn't agree with each other on header nav — Home
 * showed "Home / All Tools / Categories / Popular", some tool pages showed
 * something else. We standardize on Home's nav as the one canonical set
 * (see docs/PLAN.md #2).
 */
export const siteConfig = {
  name: "DailyTools",
  tagline: "Free Tools for Everyday Tasks",
  description:
    "A collection of simple, fast, and free utilities to help you format code, calculate grades, manage text, and more. No sign-up required.",
};

export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "All Tools", href: "/tools" },
  { label: "Categories", href: "/categories" },
  { label: "Popular", href: "/#popular" },
] as const;

export const footerNav = {
  product: [
    { label: "All Tools", href: "/tools" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
} as const;
