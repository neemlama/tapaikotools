import { NextResponse } from "next/server";

import { parseNrbPayload } from "@/lib/currency";

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * GET /api/nrb-rates — proxies Nepal Rastra Bank's official daily reference
 * rates (https://www.nrb.org.np/api/forex/v1/rates) so the Currency Converter
 * can offer an "NRB Official" source without hitting CORS issues in the
 * browser. NRB publishes Sun–Fri only, so we request a 7-day window and take
 * the latest published day. Upstream is cached 6h (rates change once daily).
 */
export async function GET() {
  const today = new Date();
  const from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const url =
    `https://www.nrb.org.np/api/forex/v1/rates` +
    `?page=1&per_page=10&from=${toISODate(from)}&to=${toISODate(today)}`;

  let upstream: unknown;
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) throw new Error(`NRB HTTP ${res.status}`);
    upstream = await res.json();
  } catch {
    return NextResponse.json(
      { error: "Could not reach Nepal Rastra Bank rates. Please use market rates." },
      { status: 502 },
    );
  }

  const parsed = parseNrbPayload(upstream);
  if (!parsed) {
    return NextResponse.json(
      { error: "Unexpected response from Nepal Rastra Bank. Please use market rates." },
      { status: 502 },
    );
  }

  return NextResponse.json(parsed);
}
