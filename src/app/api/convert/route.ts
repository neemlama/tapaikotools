import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to Python FastAPI backend for PDF→DOCX.
 * Keeps the frontend at same origin, avoids CORS, and hides backend URL.
 *
 * Env:
 *  - CONVERTER_API_URL (server) or NEXT_PUBLIC_CONVERTER_API_URL — e.g. http://localhost:8000 or https://your-backend.onrender.com
 *  - Falls back to http://localhost:8000 in dev, and returns 503 with helpful error if backend unreachable.
 */

const BACKEND_URL =
  process.env.CONVERTER_API_URL || process.env.NEXT_PUBLIC_CONVERTER_API_URL || "http://localhost:8000";

export async function GET() {
  // Health proxy
  try {
    const r = await fetch(`${BACKEND_URL}/api/health`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json({ backend: BACKEND_URL, health: j, status: r.ok ? "ok" : "error" }, { status: r.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ backend: BACKEND_URL, error: String(e), hint: "Is Python backend running? cd backend && uvicorn app.main:app --port 8000" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Forward to Python backend
    const backendForm = new FormData();
    backendForm.append("file", file, file.name);

    const backendRes = await fetch(`${BACKEND_URL}/api/convert`, {
      method: "POST",
      body: backendForm as unknown as BodyInit,
      // Don't set Content-Type — fetch will set multipart boundary
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text().catch(() => "");
      let errJson: unknown = null;
      try {
        errJson = JSON.parse(errText);
      } catch {}
      const msg = (errJson as { detail?: string })?.detail || errText || `Backend error ${backendRes.status}`;
      return NextResponse.json({ error: msg }, { status: backendRes.status });
    }

    const docxBuffer = await backendRes.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    const disp = backendRes.headers.get("Content-Disposition");
    if (disp) headers.set("Content-Disposition", disp);
    else headers.set("Content-Disposition", `attachment; filename="${(file.name.replace(/\.pdf$/i, "") || "document")}.docx"`);
    // Pass through warnings
    const warnings = backendRes.headers.get("X-Conversion-Warnings");
    const pages = backendRes.headers.get("X-Conversion-Pages");
    const status = backendRes.headers.get("X-Conversion-Status");
    if (warnings) headers.set("X-Conversion-Warnings", warnings);
    if (pages) headers.set("X-Conversion-Pages", pages);
    if (status) headers.set("X-Conversion-Status", status);

    return new NextResponse(docxBuffer, { status: 200, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isConnRefused = msg.includes("ECONNREFUSED") || msg.includes("fetch failed");
    return NextResponse.json(
      {
        error: isConnRefused
          ? `Converter backend not reachable at ${BACKEND_URL}. Run: cd backend && uvicorn app.main:app --port 8000`
          : msg,
      },
      { status: 502 },
    );
  }
}
