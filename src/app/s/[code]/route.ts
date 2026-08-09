import { NextResponse, type NextRequest } from "next/server";

import { resolveShortLink } from "@/lib/url-shortener";

/**
 * The actual redirect a short link hits. `/s/<code>` rather than a
 * root-level `/<code>` — we don't own a short branded domain like the
 * Stitch mockup's `dtls.co`, and a root-level catch-all would risk
 * colliding with real routes (`/tools`, `/about`, …) as the site grows.
 *
 * 301 (permanent): matches this tool's own "Is it safe?" copy ("standard
 * HTTP 301 redirects").
 */
export async function GET(request: NextRequest, context: RouteContext<"/s/[code]">) {
  const { code } = await context.params;
  const longUrl = await resolveShortLink(code);
  if (!longUrl) {
    return NextResponse.redirect(new URL("/tools/url-shortener?notfound=1", request.url));
  }
  return NextResponse.redirect(longUrl, 301);
}
