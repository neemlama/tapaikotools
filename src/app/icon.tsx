import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Generated favicon — replaces `create-next-app`'s default Next.js logo
 * (deleted `app/favicon.ico`; per Next's own docs, a favicon can't be
 * code-generated, only `icon`/`apple-icon` can, so this is the correct
 * modern replacement path). A monogram, not the full "DailyTools"
 * wordmark: Header/Footer deliberately use text-only branding with no logo
 * mark (see docs/PLAN.md #2), but a wordmark doesn't read at 16-32px, so a
 * single-letter mark is the sensible exception for an icon this small.
 * `--primary` from globals.css, hardcoded as a literal hex since
 * `ImageResponse`'s renderer (satori) doesn't have access to CSS custom
 * properties or Tailwind classes.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0058c3",
          borderRadius: 7,
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        D
      </div>
    ),
    { ...size },
  );
}
