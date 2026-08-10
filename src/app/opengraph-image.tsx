import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site-config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Site-wide default OG image — shown when any page (that doesn't define
 * its own more specific one) is shared on social media/chat apps. `satori`
 * (the renderer behind `ImageResponse`) doesn't load Google Fonts by
 * default, so this intentionally uses the system sans fallback rather than
 * the site's actual Geist/Inter — a real but minor typography gap versus
 * the live site, not worth the added complexity of fetching font files
 * for a single generated image.
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
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#0058c3",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#ffffff",
              color: "#0058c3",
              fontSize: 40,
              fontWeight: 700,
              fontFamily: "sans-serif",
            }}
          >
            T
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff", fontFamily: "sans-serif" }}>
            {siteConfig.name}
          </div>
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, color: "#ffffff", fontFamily: "sans-serif", maxWidth: 900 }}>
          {siteConfig.tagline}
        </div>
        <div style={{ fontSize: 28, color: "#d8e2ff", fontFamily: "sans-serif", marginTop: 24, maxWidth: 800 }}>
          {siteConfig.description}
        </div>
      </div>
    ),
    { ...size },
  );
}
