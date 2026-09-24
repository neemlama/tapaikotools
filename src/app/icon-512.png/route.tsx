import { ImageResponse } from "next/og";

import { PwaIconArtwork } from "@/lib/pwa-icon";

export const dynamic = "force-static";

export async function GET() {
  return new ImageResponse(<PwaIconArtwork size={512} />, { width: 512, height: 512 });
}
