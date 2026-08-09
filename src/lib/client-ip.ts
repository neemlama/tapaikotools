import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate-limiting. Vercel (and most proxies) set
 * `x-forwarded-for` reliably before a request reaches the app; environments
 * with no such proxy in front (e.g. plain `next start` with nothing else)
 * won't have it, so this falls back to a shared "unknown" bucket rather
 * than skipping rate limiting entirely. Shared between the two route
 * handlers that need it — see docs/PLAN.md #10 for the known limitation
 * that a client can spoof this header if there's no trusted proxy setting
 * it, which per-IP rate limiting alone can't defend against.
 */
export function clientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
