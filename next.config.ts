import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only for Docker self-hosting.
  // Vercel must use the default output — standalone breaks its builder
  // (missing .next/next-server.js.nft.json -> build exit 1).
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,
};

export default nextConfig;
