import { ImageResponse } from "next/og";

import { PwaIconArtwork } from "@/lib/pwa-icon";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<PwaIconArtwork size={192} />, { width: 192, height: 192 });
}
