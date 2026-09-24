/**
 * Shared PWA icon artwork — blue rounded square + white Lucide "Wrench" glyph.
 * Single source of truth for all install-icon routes (192 / 512 / apple-touch).
 * Satori (next/og) has no access to CSS vars or Tailwind, so colors/sizes are literals.
 */
export function PwaIconArtwork({ size }: { size: number }) {
  const stroke = Math.max(2, Math.round(size / 11));
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0058c3",
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z" />
      </svg>
    </div>
  );
}
