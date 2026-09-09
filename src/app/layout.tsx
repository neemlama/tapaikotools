import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";
import { SITE_URL } from "@/lib/site-url";

import "./globals.css";

// Geist = headings/labels/UI, Inter = body, JetBrains Mono = code/tool
// output — see docs/PLAN.md #3 for why these three.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0058c3",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  publisher: siteConfig.author,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [`${SITE_URL}/opengraph-image`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      url: SITE_URL,
      name: siteConfig.name,
      logo: `${SITE_URL}/icon`,
      sameAs: ["https://github.com/neemlama/tapaikotools"],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      {/*
       * Material Symbols Outlined — Stitch's icon system throughout its
       * generated pages. `precedence` is required on a bare <link
       * rel="stylesheet"> in React 19 — without it, React treats it as a
       * plain host element rather than a hoistable stylesheet resource,
       * which threw a real hydration error here ("<link> cannot be a child
       * of <html>") caught by testing dark mode, not assumed away. With
       * `precedence` set, React dedupes and hoists it into <head> correctly
       * regardless of where in the tree it's rendered — confirmed working.
       */}
      <link href="https://fonts.googleapis.com" rel="preconnect" />
      <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- this rule targets the Pages Router's per-page pattern; the root layout *is* App Router's global-scope equivalent of _document.js. */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
        precedence="default"
      />
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
      {/* Sibling of <body>, inside <html> — the exact placement from Next's
          own docs for @next/third-parties' GoogleAnalytics component.
          Skipped entirely when the env var is unset (local dev, or a
          deploy that hasn't configured GA yet) rather than rendering with
          an empty gaId. Tracks route changes automatically (App Router
          client-side navigations fire pageviews via browser history
          events) — no manual pathname listener needed. */}
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </html>
  );
}
