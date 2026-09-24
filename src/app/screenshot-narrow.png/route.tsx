import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";

/**
 * Portrait promo shot for the PWA manifest (`screenshots`, narrow
 * form-factor) — drives the richer install UI on mobile. Same branding as
 * the wide `opengraph-image` card (blue gradient, headline, category chips),
 * recomposed vertically at 540x960.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0058c3 0%, #003d8f 100%)",
          padding: "60px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: 999,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#ffffff" }}>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.85)", marginTop: 12 }}>
          {siteConfig.tagline}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 36 }}>
          {["Student Tools", "Calculators", "Developer Tools", "Generators"].map((c) => (
            <div
              key={c}
              style={{
                display: "flex",
                fontSize: 20,
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: 999,
                padding: "8px 18px",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 540, height: 960 },
  );
}
