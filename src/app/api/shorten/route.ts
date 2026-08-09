import { NextResponse, type NextRequest } from "next/server";

import { clientIp } from "@/lib/client-ip";
import { checkGlobalDailyLimit, checkShortenRateLimit } from "@/lib/rate-limit";
import { createShortLink, normalizeLongUrl } from "@/lib/url-shortener";

/**
 * The only publicly-writable endpoint on this site — every other tool is
 * client-only (see docs/PLAN.md #10, Phase 4). Rate-limited per IP *and*
 * against a global daily cap (see lib/rate-limit.ts — per-IP limiting alone
 * doesn't stop a distributed abuser using many IPs), and validates the
 * target is a real http(s) URL before ever touching Redis.
 */
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

  const { success: withinIpLimit } = await checkShortenRateLimit(clientIp(request));
  if (!withinIpLimit) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const { success: withinGlobalLimit } = await checkGlobalDailyLimit();
  if (!withinGlobalLimit) {
    return NextResponse.json(
      { error: "This tool has hit its daily link-creation limit. Please try again tomorrow." },
      { status: 429 },
    );
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
