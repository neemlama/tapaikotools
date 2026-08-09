import { NextResponse, type NextRequest } from "next/server";

import { checkShortenRateLimit } from "@/lib/rate-limit";
import { createShortLink, normalizeLongUrl } from "@/lib/url-shortener";

/**
 * The only publicly-writable endpoint on this site — every other tool is
 * client-only (see docs/PLAN.md #10, Phase 4). Rate-limited per IP and
 * validates the target is a real http(s) URL before ever touching Redis.
 */

function clientIp(request: NextRequest): string {
  // Vercel (and most proxies) set this. Falls back to a shared bucket in
  // environments that don't set it (e.g. plain `next start` with no proxy
  // in front) — still rate-limits *something* rather than silently
  // skipping the check entirely.
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawUrl =
    typeof body === "object" && body !== null && "url" in body && typeof (body as { url: unknown }).url === "string"
      ? (body as { url: string }).url
      : "";

  const { success } = await checkShortenRateLimit(clientIp(request));
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const normalized = normalizeLongUrl(rawUrl, request.nextUrl.host);
  if (!normalized) {
    return NextResponse.json({ error: "Enter a valid http:// or https:// URL." }, { status: 400 });
  }

  try {
    const code = await createShortLink(normalized);
    return NextResponse.json({ code, shortUrl: `${request.nextUrl.origin}/s/${code}` });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
