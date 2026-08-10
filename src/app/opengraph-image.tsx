import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A representative subset of the real registry categories (see
// lib/tools/registry.ts), not all 8 — enough to signal breadth without
// crowding a 1200x630 card. Picked for spread across the two audiences this
// site targets: students (Student Tools) and general/dev users (Calculators,
// Developer Tools, Generators).
const CATEGORY_CHIPS = ["Student Tools", "Calculators", "Developer Tools", "Generators"];

/**
 * Site-wide default OG image — shown when any page (that doesn't define
 * its own more specific one) is shared on social media/chat apps. `satori`
 * (the renderer behind `ImageResponse`) doesn't load Google Fonts by
 * default, so this intentionally uses the system sans fallback rather than
 * the site's actual Geist/Inter — a real but minor typography gap versus
 * the live site, not worth the added complexity of fetching font files
 * for a single generated image.
 *
 * Redesigned 2026-08-10 (was a flat solid-color block with a paragraph of
 * body text — read as plain/unpolished in real link-preview cards, e.g.
 * Messenger). This version: a subtle diagonal gradient + soft off-canvas
 * circles for depth (solid low-opacity shapes, not `filter: blur` — satori
 * doesn't support CSS blur), a tighter/bolder headline, and a row of
 * category chips (pulled from the real category list, not invented) instead
 * of a full sentence — chips scan faster than prose in a preview card people
 * glance at for half a second.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0058c3 0%, #003d8f 100%)",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Decorative depth — soft off-canvas circles, solid low-opacity white */}
        <div
          style={{
            position: "absolute",
            top: -140,
            right: -100,
            width: 420,
            height: 420,
            borderRadius: 999,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            right: 160,
            width: 320,
            height: 320,
            borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
          }}
        />

        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#ffffff",
              color: "#0058c3",
              fontSize: 36,
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            T
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: "#ffffff",
              fontFamily: "sans-serif",
              letterSpacing: -0.5,
            }}
          >
            {siteConfig.name}
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "sans-serif",
            maxWidth: 920,
            lineHeight: 1.1,
            letterSpacing: -1.5,
          }}
        >
          {siteConfig.tagline}
        </div>

        {/* Subtext */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#d8e2ff",
            fontFamily: "sans-serif",
            marginTop: 22,
            maxWidth: 760,
            lineHeight: 1.4,
          }}
        >
          {siteConfig.description}
        </div>

        {/* Category chips — real labels from the tool registry, not invented copy */}
        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
          {CATEGORY_CHIPS.map((chip) => (
            <div
              key={chip}
              style={{
                display: "flex",
                padding: "10px 22px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.28)",
                color: "#ffffff",
                fontSize: 20,
                fontFamily: "sans-serif",
                fontWeight: 500,
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
