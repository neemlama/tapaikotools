import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Generated favicon — replaces `create-next-app`'s default Next.js logo
 * (deleted `app/favicon.ico`; per Next's own docs, a favicon can't be
 * code-generated, only `icon`/`apple-icon` can, so this is the correct
 * modern replacement path).
 *
 * Wrench glyph, not the earlier "D" monogram (2026-08-09, per request: a
 * license-free icon that reads as "tool" instead of a letter). Path data is
 * Lucide's "Wrench" icon (the `lucide-react` package, ISC license — free
 * for any use, no attribution required), inlined as a raw SVG path rather
 * than imported as a component: `ImageResponse`'s renderer (satori) walks a
 * plain svg/path element tree, and inlining sidesteps any risk of it
 * choking on lucide-react's own component wrapper. This also matches the
 * site's existing icon-system split — lucide-react is already the icon set
 * used for non-Stitch-transcribed chrome (see `MaterialIcon`'s doc comment
 * for the other half of that split), so reaching for a lucide glyph here
 * doesn't introduce a third system.
 * `--primary` from globals.css, hardcoded as a literal hex since satori
 * doesn't have access to CSS custom properties or Tailwind classes.
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
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
