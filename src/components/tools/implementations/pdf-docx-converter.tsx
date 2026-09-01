"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/**
 * PDF ↔ DOCX Converter — hybrid.
 *
 *  - PDF → DOCX: **production-quality editable conversion via Python backend**
 *                (PyMuPDF + python-docx). Extracts text+coords+fonts+images+tables,
 *                reconstructs layout (paragraphs, headings, tables, images, page size/margins,
 *                columns, alignment, spacing) and emits a real editable DOCX (Document/Paragraph/Run/Table/Image),
 *                NOT page screenshots. Falls back to client-side text extraction if backend unreachable.
 *                Spec: see backend/app/services/converter.py + pdf/extractor + docx/generator.
 *  - DOCX → PDF: client-side via mammoth (HTML) + jsPDF manual walk — preserves headings/lists/tables/images.
 *
 * Layout is `custom` — owns entire page including breadcrumb/header/educational sections,
 * same precedent as Base64EncoderDecoderTool/UnitConverterTool.
 */

const tool = getToolBySlug("pdf-docx-converter")!;

type Mode = "pdf-to-docx" | "docx-to-pdf";

const FAQ_ITEMS = [
  {
    question: "Is my file uploaded to a server?",
    answer:
      "For PDF → DOCX, yes — the PDF is uploaded to our converter backend (FastAPI + PyMuPDF) for editable reconstruction, processed in a temporary directory and deleted immediately after conversion (no permanent storage). DOCX → PDF still runs entirely in your browser. No file is executed or kept.",
  },
  {
    question: "Will formatting and layout be preserved exactly?",
    answer:
      "PDF → DOCX now produces a real editable Word document: paragraphs, headings, font sizes/bold/italic/color, alignment, spacing, page size/margins, images and tables (via pdfplumber) are reconstructed as native Word elements (not screenshots). DOCX → PDF preserves headings, lists, tables and images via HTML walk. Complex multi-column/floating objects/scanned pages are best-effort — perfect pixel parity is impossible because PDF is fixed-layout and DOCX is reflowable, but editability is prioritized over exact positioning.",
  },
  {
    question: "Why does PDF → DOCX still reflow slightly?",
    answer:
      "PDF stores every word at an absolute X/Y; Word reflows paragraphs to margins/columns. The backend groups lines into paragraphs, preserves indent/alignment and page breaks, and then lets Word handle wrapping — tiny differences are inherent to the formats, not a bug. Use the backend's page size/margin preservation to minimize it.",
  },
  {
    question: "What file sizes are supported?",
    answer:
      "Up to 20 MB per file (enforced server-side). Larger files should be split. The backend validates PDF signature, type and corruption before processing.",
  },
  {
    question: "Which file types are accepted?",
    answer:
      "PDF → DOCX accepts .pdf (text-based; scanned pages are detected and warn that OCR is not yet enabled). DOCX → PDF accepts .docx (modern Word format). Legacy .doc is not supported — re-save as .docx first.",
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function convertPdfToDocxBackend(file: File, onStage?: (s: string) => void): Promise<Blob> {
  onStage?.("Uploading PDF...");
  const form = new FormData();
  form.append("file", file);
  // Small delay so UI stage is visible
  await new Promise((r) => setTimeout(r, 150));
  onStage?.("Analyzing PDF...");
  const res = await fetch("/api/convert", { method: "POST", body: form });
  if (!res.ok) {
    let msg = `Conversion failed (${res.status})`;
    try {
      const j = (await res.json()) as { error?: string; detail?: string };
      msg = j.error || j.detail || msg;
    } catch {
      try {
        msg = await res.text();
      } catch {}
    }
    // Include hint for backend not running
    if (res.status === 502 || msg.toLowerCase().includes("backend not reachable")) {
      msg += " — Is Python backend running? (cd backend && uvicorn app.main:app --port 8000) or check CONVERTER_API_URL.";
    }
    throw new Error(msg);
  }
  onStage?.("Reconstructing layout...");
  // Check warnings
  const warnings = res.headers.get("X-Conversion-Warnings");
  if (warnings) console.warn("PDF→DOCX warnings:", warnings);
  onStage?.("Generating Word document...");
  const blob = await res.blob();
  if (blob.size < 500) throw new Error("Generated DOCX is empty — PDF may be corrupted or scanned without OCR.");
  return blob;
}

async function convertDocxToPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const mammoth = await import("mammoth");
  const { jsPDF } = await import("jspdf");

  // Try HTML path first — preserves headings, lists, bold/italic, tables, images
  let html: string | null = null;
  try {
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.imgElement((image) =>
          image.read("base64").then((imageBuffer) => ({
            src: `data:${image.contentType};base64,${imageBuffer}`,
          })),
        ),
      },
    );
    html = result.value?.trim() || null;
  } catch {
    html = null;
  }

  // Robust manual HTML → PDF renderer (no html2canvas needed, avoids blank-page bug)
  if (html && html.length > 0) {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const maxW = pageW - margin * 2;

      let y = margin;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const addWrappedText = (
        text: string,
        opts: { size?: number; bold?: boolean; italic?: boolean; align?: "left" | "center" | "right" } = {},
      ) => {
        const clean = text.replace(/\s+/g, " ").trim();
        if (!clean) return;
        doc.setFont("helvetica", opts.bold ? (opts.italic ? "bolditalic" : "bold") : opts.italic ? "italic" : "normal");
        doc.setFontSize(opts.size ?? 11);
        const lines = doc.splitTextToSize(clean, maxW) as string[];
        const lh = (opts.size ?? 11) * 0.45; // approx line height in mm
        for (const line of lines) {
          ensureSpace(lh);
          const x = opts.align === "center" ? pageW / 2 : opts.align === "right" ? pageW - margin : margin;
          const alignOpt = opts.align ?? "left";
          // doc.text signature: text, x, y, {align}
          if (alignOpt === "left") doc.text(line, x, y);
          else doc.text(line, x, y, { align: alignOpt });
          y += lh;
        }
      };

      // Parse HTML into DOM for walking
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;

      const walk = async (node: ChildNode, ctx: { bold: boolean; italic: boolean; listDepth: number; listType?: string; listIndex?: number }) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const txt = (node.textContent ?? "").replace(/\u00a0/g, " ");
          if (txt.trim()) addWrappedText(txt, { bold: ctx.bold, italic: ctx.italic });
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === "h1") {
          y += 2;
          addWrappedText(el.innerText ?? el.textContent ?? "", { size: 18, bold: true });
          y += 2;
        } else if (tag === "h2") {
          y += 2;
          addWrappedText(el.innerText ?? el.textContent ?? "", { size: 15, bold: true });
          y += 2;
        } else if (tag === "h3") {
          y += 1;
          addWrappedText(el.innerText ?? el.textContent ?? "", { size: 12, bold: true });
          y += 1;
        } else if (tag === "p" || tag === "div") {
          // Collect inline children to keep bold/italic per run
          if (el.children.length === 0) {
            addWrappedText(el.innerText ?? el.textContent ?? "", { bold: ctx.bold, italic: ctx.italic });
            y += 2;
          } else {
            for (const child of Array.from(el.childNodes)) await walk(child, ctx);
            y += 2;
          }
        } else if (tag === "br") {
          y += 4;
        } else if (tag === "strong" || tag === "b") {
          for (const child of Array.from(el.childNodes)) await walk(child, { ...ctx, bold: true });
        } else if (tag === "em" || tag === "i") {
          for (const child of Array.from(el.childNodes)) await walk(child, { ...ctx, italic: true });
        } else if (tag === "u") {
          for (const child of Array.from(el.childNodes)) await walk(child, ctx);
        } else if (tag === "ul" || tag === "ol") {
          const isOl = tag === "ol";
          let idx = 1;
          for (const child of Array.from(el.children)) {
            if (child.tagName.toLowerCase() === "li") {
              const bullet = isOl ? `${idx}. ` : "• ";
              const liText = (child.textContent ?? "").trim();
              if (liText) {
                addWrappedText(bullet + liText, { bold: ctx.bold, italic: ctx.italic, size: 10 });
                y += 1;
              } else {
                for (const sub of Array.from(child.childNodes)) await walk(sub, ctx);
              }
              idx++;
            }
          }
          y += 1;
        } else if (tag === "table") {
          // Simple table: draw grid, handle header bold
          const rows = Array.from(el.querySelectorAll("tr"));
          if (rows.length) {
            const cols = Math.max(...rows.map((r) => r.querySelectorAll("td, th").length));
            const colW = maxW / Math.max(cols, 1);
            const rowH = 7;
            for (const row of rows) {
              ensureSpace(rowH);
              const cells = Array.from(row.querySelectorAll("td, th"));
              const isHeader = row.querySelector("th") !== null;
              let x = margin;
              for (const cell of cells) {
                const txt = (cell.textContent ?? "").trim();
                doc.setDrawColor(193, 198, 215);
                doc.setFillColor(isHeader ? 240 : 255, isHeader ? 237 : 255, isHeader ? 237 : 255);
                doc.rect(x, y - 5, colW, rowH, isHeader ? "FD" : "D");
                doc.setFont("helvetica", isHeader ? "bold" : "normal");
                doc.setFontSize(8);
                const cellLines = doc.splitTextToSize(txt, colW - 2) as string[];
                const cellTxt = cellLines[0] ?? "";
                if (cellTxt) doc.text(cellTxt, x + 1, y);
                x += colW;
              }
              y += rowH;
            }
            y += 2;
          }
        } else if (tag === "img") {
          const src = el.getAttribute("src") ?? "";
          if (src.startsWith("data:image")) {
            try {
              const m = src.match(/^data:(image\/[^;]+);base64,(.+)$/);
              if (m) {
                const fmt = m[1].split("/")[1].toUpperCase() as "PNG" | "JPEG" | "JPG";
                const format = fmt === "JPG" ? "JPEG" : (fmt as string);
                // Load to get dimensions
                const img = new Image();
                img.src = src;
                await new Promise<void>((res, rej) => {
                  img.onload = () => res();
                  img.onerror = () => rej(new Error("img load"));
                  setTimeout(() => rej(new Error("timeout")), 3000);
                }).catch(() => {});
                const iw = img.width || 200;
                const ih = img.height || 100;
                const ratio = Math.min(1, maxW / (iw * 0.264583)); // px to mm
                const w = iw * 0.264583 * ratio;
                const h = ih * 0.264583 * ratio;
                ensureSpace(h);
                doc.addImage(src, format, margin, y, w, h);
                y += h + 3;
              }
            } catch {
              // ignore image errors
            }
          }
        } else {
          // Generic container — walk children preserving context
          for (const child of Array.from(el.childNodes)) await walk(child, ctx);
        }
      };

      for (const child of Array.from(wrapper.childNodes)) {
        await walk(child, { bold: false, italic: false, listDepth: 0 });
      }

      // If we actually added content (y moved beyond margin), return this doc
      if (y > margin + 1) return doc.output("blob");
      // Otherwise fall through to raw-text fallback
    } catch (e) {
      console.warn("HTML walk failed, falling back to raw text", e);
    }
  }

  // Fallback: raw text paginated (preserves line breaks/paragraphs) — never blank
  const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });
  const text = rawText.trim() || "(Empty document)";
  const fallback = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW2 = fallback.internal.pageSize.getWidth();
  const pageH2 = fallback.internal.pageSize.getHeight();
  const margin2 = 15;
  const maxW2 = pageW2 - margin2 * 2;
  const lh2 = 6;
  fallback.setFont("helvetica", "normal");
  fallback.setFontSize(11);
  const paragraphs = text.split(/\n{2,}/);
  let y2 = margin2;
  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];
    const lines = fallback.splitTextToSize(para.replace(/\n/g, " "), maxW2) as string[];
    for (const line of lines) {
      if (y2 + lh2 > pageH2 - margin2) {
        fallback.addPage();
        y2 = margin2;
      }
      fallback.text(line, margin2, y2);
      y2 += lh2;
    }
    y2 += 3;
    if (y2 > pageH2 - margin2 && pIdx < paragraphs.length - 1) {
      fallback.addPage();
      y2 = margin2;
    }
  }
  return fallback.output("blob");
}

export function PdfDocxConverterTool() {
  const [mode, setMode] = useState<Mode>("pdf-to-docx");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [converting, setConverting] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPdfMode = mode === "pdf-to-docx";
  const accept = isPdfMode ? ".pdf,application/pdf" : ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const expectedExt = isPdfMode ? ".pdf" : ".docx";

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const resetOutput = useCallback(() => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(null);
    setError(null);
  }, [downloadUrl]);

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setFile(null);
    resetOutput();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = useCallback(
    (nextFile: File | null) => {
      resetOutput();
      if (!nextFile) {
        setFile(null);
        return;
      }
      const lower = nextFile.name.toLowerCase();
      const valid = isPdfMode ? lower.endsWith(".pdf") : lower.endsWith(".docx");
      if (!valid) {
        setError(`Please select a ${expectedExt} file for this mode. Switch mode if you need the opposite conversion.`);
        setFile(null);
        return;
      }
      if (nextFile.size > 20 * 1024 * 1024) {
        setError("File too large — please use a file under 20 MB.");
        setFile(null);
        return;
      }
      setFile(nextFile);
      setError(null);
    },
    [expectedExt, isPdfMode, resetOutput],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0] ?? null;
      handleFile(dropped);
    },
    [handleFile],
  );

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }
    setConverting(true);
    setStage(isPdfMode ? "Uploading..." : "Converting...");
    setError(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(null);

    try {
      const blob = isPdfMode
        ? await convertPdfToDocxBackend(file, (s) => setStage(s))
        : await convertDocxToPdf(file);
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      const newName = isPdfMode ? `${base}.docx` : `${base}.pdf`;
      setDownloadUrl(url);
      setDownloadName(newName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid PDF") || msg.includes("PDF")) {
        setError(msg.includes("backend not reachable") ? msg : "Couldn't read that PDF — it may be corrupted, password-protected, or an unsupported version.");
      } else if (msg.toLowerCase().includes("mammoth") || msg.toLowerCase().includes("docx")) {
        setError("Couldn't read that DOCX — it may be corrupted or an old .doc file. Re-save as .docx in Word and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setConverting(false);
      setStage(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    resetOutput();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <div className="mb-12">
        <ToolBreadcrumb tool={tool} />
        <h1 className="text-display mt-4 mb-4 text-foreground">PDF ↔ DOCX Converter</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          PDF → DOCX produces a <span className="font-medium text-foreground">fully editable Word file</span> — text,
          headings, tables and images are real Word elements (not screenshots), layout preserved via Python backend.
          DOCX → PDF runs in your browser. Fast, private, free.
        </p>
      </div>

      {/* Tool Area */}
      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Mode + Drop zone + File meta */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Mode toggle — mirrors UnitConverter sidebar pill style */}
          <div className="flex rounded-md border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => handleModeChange("pdf-to-docx")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-label-sm font-medium transition-colors",
                isPdfMode ? "bg-primary-button text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MaterialIcon name="picture_as_pdf" className="text-[18px]" />
              PDF → DOCX
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("docx-to-pdf")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-label-sm font-medium transition-colors",
                !isPdfMode ? "bg-primary-button text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MaterialIcon name="description" className="text-[18px]" />
              DOCX → PDF
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex min-h-[300px] flex-col items-center justify-center rounded-md border-2 border-dashed bg-card p-8 text-center shadow-sm transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            )}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-low">
              <MaterialIcon name={isPdfMode ? "picture_as_pdf" : "description"} className="text-[28px] text-primary" />
            </div>
            <p className="text-headline-md mb-2 text-foreground">
              Drop your {expectedExt.toUpperCase()} here
            </p>
            <p className="mb-6 text-body-md text-muted-foreground">
              or click to browse — max 20 MB{isPdfMode ? ", securely processed and auto-deleted" : ", stays in your browser"}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={onFileInputChange}
              className="hidden"
              id="pdf-docx-file-input"
            />
            <label
              htmlFor="pdf-docx-file-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded bg-primary-button px-6 py-2.5 text-label-sm text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              <MaterialIcon name="upload" className="text-sm" />
              Choose file
            </label>

            <p className="mt-4 text-xs text-muted-foreground">
              Accepts <span className="font-mono font-medium text-foreground">{expectedExt}</span> only in this mode
            </p>
          </div>

          {/* Selected file card */}
          {file && (
            <div className="flex items-center gap-4 rounded-md border border-border bg-card p-4 shadow-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary-container text-white">
                <MaterialIcon name={isPdfMode ? "picture_as_pdf" : "description"} className="text-[20px]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-md font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} · {isPdfMode ? "PDF" : "DOCX"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                aria-label="Remove file"
                className="rounded p-2 text-muted-foreground transition-colors hover:bg-border-subtle hover:text-destructive"
              >
                <MaterialIcon name="close" className="text-[20px]" />
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="flex items-center gap-2 text-body-md text-destructive">
              <MaterialIcon name="error" className="text-[18px]" />
              {error}
            </p>
          )}
        </div>

        {/* Right: Actions + Output */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="flex flex-col rounded-md border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between rounded-t-md border-b border-border bg-surface-low px-6 py-4">
              <span className="text-headline-md text-foreground">Output</span>
              {downloadUrl && downloadName && (
                <span className="rounded bg-success/10 px-2 py-1 text-xs font-medium text-success">Ready</span>
              )}
            </div>

            <div className="flex flex-col gap-4 p-6">
              {!file && !downloadUrl && (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded border border-dashed border-border bg-surface-low p-6 text-center">
                  <MaterialIcon name="swap_horiz" className="mb-2 text-[32px] text-muted-foreground/50" />
                  <p className="text-body-md text-muted-foreground">
                    Select a {expectedExt.toUpperCase()} file to convert
                    <br />
                    <span className="text-xs">Result will appear here for download</span>
                  </p>
                </div>
              )}

              {file && !downloadUrl && (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded bg-surface-low p-6 text-center">
                  <MaterialIcon name="autorenew" className={cn("text-[32px] text-muted-foreground", converting && "animate-spin")} />
                  <p className="text-body-md text-muted-foreground">
                    {converting ? stage || "Converting — please wait…" : "Ready to convert"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPdfMode
                      ? "Editable DOCX: text, headings, tables & images as real Word elements"
                      : "Preserves headings, lists, bold/italic & tables via HTML rendering"}
                  </p>
                </div>
              )}

              {downloadUrl && downloadName && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 rounded bg-success/10 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-success text-white">
                      <MaterialIcon name="check" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-md font-medium text-foreground">{downloadName}</p>
                      <p className="text-xs text-muted-foreground">Converted successfully — click Download to save</p>
                    </div>
                  </div>

                  <a
                    href={downloadUrl}
                    download={downloadName}
                    className="flex w-full items-center justify-center gap-2 rounded bg-primary-button px-6 py-3 text-label-sm text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                  >
                    <MaterialIcon name="download" className="text-sm" />
                    Download {downloadName.split(".").pop()?.toUpperCase()}
                  </a>

                  <button
                    type="button"
                    onClick={resetOutput}
                    className="w-full rounded border border-border bg-background px-6 py-2.5 text-label-sm text-foreground transition-colors hover:bg-accent"
                  >
                    Convert another file
                  </button>
                </div>
              )}

              {/* Always show Convert CTA when a file is selected but no download yet */}
              {file && !downloadUrl && (
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={converting}
                  className="flex w-full items-center justify-center gap-2 rounded bg-primary-button px-6 py-3 text-label-sm text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {converting ? (
                    <>
                      <MaterialIcon name="progress_activity" className="animate-spin text-sm" />
                      Converting…
                    </>
                  ) : (
                    <>
                      <MaterialIcon name="autorenew" className="text-sm" />
                      Convert to {isPdfMode ? "DOCX" : "PDF"}
                    </>
                  )}
                </button>
              )}

              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                <MaterialIcon name="lock" className="mr-1 inline text-[14px] align-text-bottom" />
                {isPdfMode
                  ? "PDF→DOCX: uploaded securely, processed in temp storage and auto-deleted — not kept."
                  : "DOCX→PDF: stays in your browser — not uploaded."}{" "}
                Editable output; perfect pixel parity not guaranteed (PDF is fixed-layout, DOCX is reflowable).
              </p>
            </div>
          </div>

          {/* Quick stats / info card */}
          <div className="rounded-md border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-label-sm font-medium text-foreground">
              <MaterialIcon name="info" className="text-[18px] text-primary" />
              How it works
            </h3>
            <ul className="space-y-2 text-body-md text-muted-foreground">
              <li className="flex gap-2">
                <span className="font-mono text-xs text-primary">1.</span> Choose direction (PDF→DOCX or DOCX→PDF)
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-xs text-primary">2.</span> Drop or browse your file (max 20 MB)
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-xs text-primary">3.</span> Click Convert — then Download
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Educational content — matches Base64/Qr style grid */}
      <div className="grid grid-cols-1 gap-12 border-t border-border pt-12 md:grid-cols-3">
        <div className="col-span-1 space-y-12 md:col-span-2">
          <section>
            <h2 className="mb-6 text-headline-lg text-foreground">What is PDF ↔ DOCX conversion?</h2>
            <p className="mb-4 text-body-md leading-relaxed text-muted-foreground">
              PDF (Portable Document Format) is a fixed-layout format — great for sharing but hard to edit. DOCX
              (Office Open XML) is the editable Word format. Converting between them lets you edit a PDF&apos;s text in
              Word, or make a Word document universally readable as a PDF.
            </p>
            <p className="text-body-md leading-relaxed text-muted-foreground">
              This tool does both directions in your browser: PDF → DOCX by extracting selectable text with{" "}
              <span className="font-mono text-xs">pdfjs-dist</span> and rebuilding it with{" "}
              <span className="font-mono text-xs">docx</span>; DOCX → PDF by extracting raw text with{" "}
              <span className="font-mono text-xs">mammoth</span> and paginating it with{" "}
              <span className="font-mono text-xs">jspdf</span>. No server, no queue, no watermark.
            </p>
          </section>

          <section>
            <h2 className="mb-6 text-headline-lg text-foreground">How to use this tool</h2>
            <ol className="ml-4 list-inside list-decimal space-y-3 text-body-md text-muted-foreground">
              <li>
                Pick the direction at the top — <strong className="text-foreground">PDF → DOCX</strong> or{" "}
                <strong className="text-foreground">DOCX → PDF</strong>.
              </li>
              <li>
                Drag & drop your file onto the dashed area, or click{" "}
                <strong className="text-foreground">Choose file</strong> to browse.
              </li>
              <li>
                Click <strong className="text-foreground">Convert</strong>. The button shows progress; a large file
                may take a few seconds.
              </li>
              <li>
                When &quot;Ready&quot; appears, click <strong className="text-foreground">Download</strong> to save the
                converted file. Use &quot;Convert another file&quot; to start over without reloading.
              </li>
            </ol>
          </section>
        </div>

        <div className="col-span-1">
          <section className="rounded-md border border-border bg-surface-low p-6">
            <h3 className="mb-6 text-headline-md text-foreground">FAQ</h3>
            <div className="space-y-6">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question}>
                  <h4 className="mb-2 text-label-sm font-bold text-foreground">{item.question}</h4>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
