import { ImageResponse } from "next/og";

import { PwaIconArtwork } from "@/lib/pwa-icon";

export const dynamic = "force-static";

/** iOS home-screen icon — 180px, full-bleed (iOS applies its own rounded mask). */
export async function GET() {
  return new ImageResponse(<PwaIconArtwork size={180} />, { width: 180, height: 180 });
}
