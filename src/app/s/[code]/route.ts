import { NextResponse, type NextRequest } from "next/server";

import { clientIp } from "@/lib/client-ip";
import { checkRedirectRateLimit } from "@/lib/rate-limit";
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
  const { success } = await checkRedirectRateLimit(clientIp(request));
  if (!success) {
    return new NextResponse("Too many requests.", { status: 429 });
  }

  const { code } = await context.params;

  let longUrl: string | null;
  try {
    longUrl = await resolveShortLink(code);
  } catch {
    // Redis unreachable, quota exceeded, etc. — fail to the tool page with
    // a clear signal rather than an unhandled 500.
    return NextResponse.redirect(new URL("/tools/url-shortener?error=1", request.url));
  }

  if (!longUrl) {
    return NextResponse.redirect(new URL("/tools/url-shortener?notfound=1", request.url));
  }
  return NextResponse.redirect(longUrl, 301);
}
