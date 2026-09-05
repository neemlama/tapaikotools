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

function sanitizeFilename(name: string): string {
  // Strip path, control chars, quotes; keep alnum, dot, dash, underscore
  const base = name.split(/[\\/]/).pop() || "document";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "document";
}

export async function GET() {
  // Health proxy — do not leak BACKEND_URL to client in production
  try {
    const r = await fetch(`${BACKEND_URL}/api/health`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    return NextResponse.json({ health: j, status: r.ok ? "ok" : "error" }, { status: r.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json({ error: String(e), hint: "Is Python backend running? cd backend && uvicorn app.main:app --port 8000" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // Server-side validation: size + type (prevent 100MB DoS to backend)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.` }, { status: 413 });
    }
    // Accept pdf or generic (some browsers send octet-stream); check extension as fallback
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    // Sanitize filename to prevent header injection (e.g. 'a\"; filename=\"evil')
    const safeName = sanitizeFilename(file.name);

    // Forward to Python backend
    const backendForm = new FormData();
    backendForm.append("file", file, safeName);

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
    if (disp) {
      // Trust backend only if it does not contain quotes/newlines; otherwise sanitize
      const safeDisp = disp.includes('"') || disp.includes("\n") ? null : disp;
      if (safeDisp) headers.set("Content-Disposition", safeDisp);
      else headers.set("Content-Disposition", `attachment; filename="${sanitizeFilename(file.name.replace(/\.pdf$/i, ""))}.docx"`);
    } else headers.set("Content-Disposition", `attachment; filename="${sanitizeFilename(file.name.replace(/\.pdf$/i, "") || "document")}.docx"`);
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
        error: isConnRefused ? "Converter backend not reachable. Please try again later." : msg,
      },
      { status: 502 },
    );
  }
}
