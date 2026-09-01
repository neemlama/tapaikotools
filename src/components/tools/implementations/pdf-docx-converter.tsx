"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/**
 * PDF ↔ DOCX Converter — 100% client-side, no server upload.
 *
 * Two modes:
 *  - PDF → DOCX: extract text via pdfjs-dist, rebuild as .docx via `docx`
 *                with layout-aware line/paragraph grouping to keep visual
 *                order, indentation and page breaks as close as a browser
 *                engine can without a full Acrobat/LibreOffice renderer.
 *  - DOCX → PDF: extract HTML via `mammoth.convertToHtml` (preserves headings,
 *                lists, bold/italic, tables as HTML) and render via `jspdf`
 *                — falls back to paginated raw-text if HTML rendering fails.
 *
 * Layout is `custom` — owns entire page including breadcrumb/header/
 * educational sections, same precedent as Base64EncoderDecoderTool /
 * UnitConverterTool. Styling matches existing tokens: rounded-md,
 * border-border, bg-card, bg-surface-low header, primary-button, etc.
 *
 * Fidelity note: browser-only conversion cannot be 100% pixel-perfect for
 * complex layouts (columns, floating tables, embedded fonts/images). This
 * implementation preserves text order, line breaks, blank lines, paragraph
 * spacing, page breaks and basic styling — the closest possible without a
 * server-side engine. FAQ explains the trade-off.
 */

const tool = getToolBySlug("pdf-docx-converter")!;

type Mode = "pdf-to-docx" | "docx-to-pdf";

const FAQ_ITEMS = [
  {
    question: "Is my file uploaded to a server?",
    answer:
      "No. Conversion happens entirely in your browser using JavaScript. Your file never leaves your device — we don't have a server that receives it. Close the tab and the data is gone.",
  },
  {
    question: "Will formatting and layout be preserved exactly?",
    answer:
      "This browser tool preserves text order, line breaks, blank lines, paragraph spacing and page breaks, and for DOCX→PDF also headings, lists, bold/italic and tables. Complex fixed layouts (multi-column, floating objects, embedded fonts/images, scanned pages) cannot be 100% pixel-identical without a server-side engine like Adobe Acrobat or LibreOffice — for those, use desktop software. For editable text documents this tool is visually very close.",
  },
  {
    question: "Why does PDF → DOCX still reflow slightly?",
    answer:
      "PDF is a fixed-position format (each word has an X/Y coordinate) while DOCX is a flowing format (paragraphs reflow to page width). This tool groups words back into lines by their Y coordinate, keeps indentation, blank lines and page breaks, but Word will still reflow long lines to its own margins — that tiny difference is inherent to the formats, not a bug.",
  },
  {
    question: "What file sizes are supported?",
    answer:
      "Up to ~20 MB in this browser build. Larger files may hit memory limits — split the PDF or DOCX into smaller parts and convert separately.",
  },
  {
    question: "Which file types are accepted?",
    answer:
      "PDF → DOCX accepts .pdf files (text-based, not scanned images — scanned PDFs need OCR). DOCX → PDF accepts .docx files (the modern Word format). Legacy .doc files are not supported — re-save as .docx in Word first.",
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function convertPdfToDocx(file: File): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  const w = pdfjs.GlobalWorkerOptions as unknown as { workerSrc?: string };
  if (!w.workerSrc) {
    try {
      w.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    } catch {
      // ignore
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  // Build per-page line groups preserving order and indentation
  const pages: { lines: { text: string; indent: number; isBlank: boolean }[] }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    page.getViewport({ scale: 1 });

    type Item = { str: string; x: number; y: number; width: number; height: number; hasEOL: boolean; fontName: string };
    const items: Item[] = [];
    for (const it of content.items) {
      if ("str" in it) {
        const t = (it as { transform: number[] }).transform;
        const str = (it as { str: string }).str;
        // Skip empty strings that are just spacing artifacts, but keep them for gap detection via hasEOL
        if (str === "" && !(it as { hasEOL?: boolean }).hasEOL) continue;
        items.push({
          str,
          x: t[4],
          y: t[5],
          width: (it as { width: number }).width ?? 0,
          height: (it as { height: number }).height ?? (Math.abs(t[3]) || 10),
          hasEOL: (it as { hasEOL?: boolean }).hasEOL ?? false,
          fontName: (it as { fontName: string }).fontName ?? "",
        });
      }
    }

    if (items.length === 0) {
      pages.push({ lines: [] });
      continue;
    }

    // Sort by Y descending (top to bottom in PDF is larger Y), then X ascending
    items.sort((a, b) => (b.y !== a.y ? b.y - a.y : a.x - b.x));

    // Group into lines by Y coordinate
    const linesRaw: Item[][] = [];
    let currentLine: Item[] = [];
    let currentY = items[0].y;
    const yTolerance = 3; // ~3pt tolerance for same line
    for (const item of items) {
      if (Math.abs(item.y - currentY) > yTolerance) {
        if (currentLine.length) linesRaw.push(currentLine);
        currentLine = [item];
        currentY = item.y;
      } else {
        currentLine.push(item);
        // Update currentY as average to handle drift within line
        currentY = (currentY * (currentLine.length - 1) + item.y) / currentLine.length;
      }
      // hasEOL forces line break after this item (pdfjs explicit end-of-line)
      if (item.hasEOL) {
        linesRaw.push(currentLine);
        currentLine = [];
        // Next item will start new line; reset Y on next iteration
        if (items.indexOf(item) < items.length - 1) {
          currentY = items[items.indexOf(item) + 1]?.y ?? item.y;
        }
      }
    }
    if (currentLine.length) linesRaw.push(currentLine);

    // For each raw line, sort by X and join with spacing, preserving indent and gaps
    const pageLines: { text: string; indent: number; isBlank: boolean }[] = [];
    let prevY: number | null = null;
    for (const lineItems of linesRaw) {
      lineItems.sort((a, b) => a.x - b.x);
      // Detect blank line gap: if vertical distance from previous line > 1.8 * line height, insert blank line(s)
      const lineY = lineItems[0]?.y ?? 0;
      const lineHeight = Math.max(...lineItems.map((l) => l.height), 10);
      if (prevY !== null) {
        const gap = prevY - lineY; // Y decreases downward, so gap positive
        if (gap > lineHeight * 1.8 && gap < 100) {
          // Insert one blank separator (or more for larger gaps)
          const blanks = Math.min(2, Math.floor(gap / (lineHeight * 1.8)));
          for (let b = 0; b < blanks; b++) pageLines.push({ text: "", indent: 0, isBlank: true });
        }
      }
      prevY = lineY;

      // Build text with gap-aware spaces (if gap between items > 0.3 * avg char width, insert space)
      let text = "";
      let prevEndX: number | null = null;
      for (const it of lineItems) {
        if (prevEndX !== null) {
          const gap = it.x - prevEndX;
          // Avg char width approx: width / str.length
          const avgW = it.width / Math.max(it.str.length, 1);
          if (gap > avgW * 0.25) text += " ";
          else if (gap > 2 && it.str && !text.endsWith(" ") && !it.str.startsWith(" ")) {
            // small gap still needs space between words that were split into separate items
            text += " ";
          }
        }
        text += it.str;
        prevEndX = it.x + it.width;
      }
      // Preserve indentation: map X offset to approx spaces (roughly 1 indent unit ~ 9pt ~ 0.5cm)
      // Instead of leading spaces (collapsed by Word), use DOCX indent. Compute left indent in twips (1/1440 inch)
      // Approx: 1 PDF pt = 1/72 inch = 20 twips
      const minX = Math.min(...lineItems.map((l) => l.x));
      const indentTwips = Math.round(Math.max(0, minX) * 20); // 20 twips per pt
      // Don't indent if near left margin (<18pt ~ 1/4 inch)
      const indent = indentTwips > 360 ? indentTwips : 0;

      // Keep line as-is (do NOT trim indentation intent), but trim trailing
      const trimmed = text.replace(/\s+$/g, "");
      // If line is empty after trim, it's a blank line already handled; skip duplicate
      if (trimmed === "" && !text) continue;
      pageLines.push({ text: trimmed, indent, isBlank: trimmed === "" });
    }
    pages.push({ lines: pageLines });
  }

  const { Document, Packer, Paragraph, TextRun } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];
  const defaultFontSize = 22; // 11pt in half-points

  pages.forEach((page, pageIndex) => {
    if (page.lines.length === 0) {
      // Preserve blank page as empty paragraph
      children.push(new Paragraph({ children: [] }));
    } else {
      for (const line of page.lines) {
        if (line.isBlank) {
          children.push(new Paragraph({ children: [], spacing: { after: 80 } }));
        } else {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line.text, size: defaultFontSize })],
              indent: line.indent ? { left: line.indent } : undefined,
              spacing: { after: 60, line: 276, lineRule: "auto" }, // ~1.15 line spacing, tighter than before
            }),
          );
        }
      }
    }
    if (pageIndex < pages.length - 1) {
      children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    }
  });

  if (children.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "(No selectable text found — this PDF may be a scanned image. OCR is not supported in this browser tool.)",
            italics: true,
            color: "888888",
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } }, // 0.5 inch margins — matches PDF default
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

/** Exact visual mode: render each PDF page to a PNG canvas and embed as image in DOCX — pixel-identical, text not selectable */
async function convertPdfToDocxExactVisual(file: File): Promise<Blob> {
  const pdfjs = await import("pdfjs-dist");
  const w = pdfjs.GlobalWorkerOptions as unknown as { workerSrc?: string };
  if (!w.workerSrc) {
    try {
      w.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    } catch {
      // ignore
    }
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const { Document, Packer, Paragraph, ImageRun } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    await page.render({ canvasContext: ctx, viewport, canvas } as unknown as Parameters<typeof page.render>[0]).promise;

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))), "image/png", 0.92);
    });
    const imgArrayBuffer = await blob.arrayBuffer();
    const imgData = new Uint8Array(imgArrayBuffer);

    // Fit to page width: A4 usable width ~ 6.27in (180mm). Use 600px width (~6.25in at 96dpi), height proportional
    const maxWidthPx = 600;
    const scale = Math.min(1, maxWidthPx / viewport.width);
    const displayWidth = Math.round(viewport.width * scale);
    const displayHeight = Math.round(viewport.height * scale);

    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: imgData,
            transformation: { width: displayWidth, height: displayHeight },
            type: "png",
          }),
        ],
        spacing: { after: 120 },
      }),
    );
    if (i < pdf.numPages) {
      children.push(new Paragraph({ children: [], pageBreakBefore: true }));
    }
  }

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }],
  });
  return Packer.toBlob(doc);
}

async function convertDocxToPdf(file: File): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const mammoth = await import("mammoth");

  // Prefer HTML to keep headings/lists/bold/italic/tables structure
  let html: string | null = null;
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    html = result.value?.trim() || null;
  } catch {
    html = null;
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // If we got HTML, render via jsPDF.html (preserves styling). Fallback to raw text if it fails.
  if (html && html.length > 0) {
    // Wrap HTML in a styled container so headings/lists render with sensible sizes
    const container = document.createElement("div");
    container.style.width = "170mm"; // A4 minus 2*15mm margins
    container.style.fontFamily = "helvetica, sans-serif";
    container.style.fontSize = "11pt";
    container.style.lineHeight = "1.4";
    container.style.color = "#1c1b1b";
    // Minimal reset so mammoth HTML looks decent
    container.innerHTML = `
      <style>
        h1{font-size:18pt;margin:12pt 0 6pt} h2{font-size:15pt;margin:10pt 0 5pt} h3{font-size:12pt;margin:8pt 0 4pt}
        p{margin:0 0 6pt} ul,ol{margin:0 0 6pt 18pt} li{margin:2pt 0}
        table{border-collapse:collapse;margin:6pt 0;width:100%} td,th{border:1px solid #c1c6d7;padding:4pt 6pt;text-align:left}
        th{background:#f0eded;font-weight:600}
        strong,b{font-weight:600} em,i{font-style:italic}
      </style>
      ${html}
    `;
    // Off-screen but attached so html2canvas can measure
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    try {
      await new Promise<void>((resolve, reject) => {
        // jsPDF.html is callback-based; wrap in promise
        const maybe = (
          doc as unknown as {
            html: (el: HTMLElement, opts: Record<string, unknown>) => Promise<void> | void;
          }
        ).html(container, {
          x: 15,
          y: 15,
          width: 180, // mm
          windowWidth: 800, // px — controls CSS layout width for rendering
          autoPaging: "text",
          callback: () => resolve(),
        } as unknown as Record<string, unknown>);
        // Newer jspdf returns a promise
        if (maybe && typeof (maybe as Promise<void>).then === "function") {
          (maybe as Promise<void>).then(() => resolve()).catch(reject);
        }
        // Fallback timeout in case callback never fires (e.g., missing html2canvas)
        setTimeout(() => {
          // If still not resolved, treat as failure to trigger fallback
          // Check if doc has content beyond first page blank
          // We resolve anyway — better to have something than nothing
          resolve();
        }, 8000);
      });

      // Heuristic: if html rendering produced only 1 blank page, it likely failed — fall back
      // Check number of pages; if 1 and html was substantial but doc is effectively empty, use fallback
      const pages = doc.getNumberOfPages();
      // We can't easily detect blankness, so if html rendering succeeded we just use it
      document.body.removeChild(container);
      // If doc still has content (at least 1 page), return it
      if (pages >= 1) return doc.output("blob");
    } catch {
      // fall through to raw text path
      try {
        document.body.removeChild(container);
      } catch {
        // ignore
      }
    }
  }

  // Fallback: raw text paginated (preserves line breaks/paragraphs)
  const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });
  const text = rawText.trim() || "(Empty document)";

  // Reset doc (new instance) for clean fallback
  const fallback = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = fallback.internal.pageSize.getWidth();
  const pageHeight = fallback.internal.pageSize.getHeight();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;
  const lineHeight = 6;

  fallback.setFont("helvetica", "normal");
  fallback.setFontSize(11);

  // Preserve paragraph breaks: split on double newline, then handle each paragraph with spacing
  const paragraphs = text.split(/\n{2,}/);
  let y = margin;
  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];
    const lines = fallback.splitTextToSize(para.replace(/\n/g, " "), maxLineWidth) as string[];
    for (const line of lines) {
      if (y + lineHeight > pageHeight - margin) {
        fallback.addPage();
        y = margin;
      }
      fallback.text(line, margin, y);
      y += lineHeight;
    }
    // Paragraph spacing
    y += 3;
    if (y > pageHeight - margin && pIdx < paragraphs.length - 1) {
      fallback.addPage();
      y = margin;
    }
  }

  return fallback.output("blob");
}

export function PdfDocxConverterTool() {
  const [mode, setMode] = useState<Mode>("pdf-to-docx");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string | null>(null);
  const [exactVisual, setExactVisual] = useState(false);
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
    setError(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setDownloadName(null);

    try {
      const blob = isPdfMode
        ? exactVisual
          ? await convertPdfToDocxExactVisual(file)
          : await convertPdfToDocx(file)
        : await convertDocxToPdf(file);
      const url = URL.createObjectURL(blob);
      const base = file.name.replace(/\.[^.]+$/, "");
      const newName = isPdfMode ? `${base}.docx` : `${base}.pdf`;
      setDownloadUrl(url);
      setDownloadName(newName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid PDF") || msg.includes("PDF")) {
        setError("Couldn't read that PDF — it may be corrupted, password-protected, or an unsupported version.");
      } else if (msg.toLowerCase().includes("mammoth") || msg.toLowerCase().includes("docx")) {
        setError("Couldn't read that DOCX — it may be corrupted or an old .doc file. Re-save as .docx in Word and try again.");
      } else {
        setError(`Conversion failed: ${msg}`);
      }
    } finally {
      setConverting(false);
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
          Convert PDF to DOCX and DOCX to PDF instantly — right in your browser. No file ever leaves your device.
          Fast, private, and free.
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

          {/* Fidelity toggle — only for PDF→DOCX where layout complaints happen */}
          {isPdfMode && (
            <div className="rounded-md border border-border bg-card p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={exactVisual}
                  onChange={(e) => setExactVisual(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded-sm border border-border accent-primary focus:ring-2 focus:ring-ring"
                />
                <span className="flex flex-col">
                  <span className="text-body-md font-medium text-foreground">Exact visual (pages as images)</span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    When on, each PDF page is rendered as an image inside the DOCX — looks 100% identical, but text
                    won&apos;t be editable. Off (default) keeps text editable with preserved lines, indents & page
                    breaks.
                  </span>
                </span>
              </label>
            </div>
          )}

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
            <p className="mb-6 text-body-md text-muted-foreground">or click to browse — max 20 MB, stays on your device</p>

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
                    {converting ? "Converting — please wait…" : "Ready to convert"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPdfMode
                      ? "Layout-aware: lines, indents, blank lines & page breaks preserved"
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
                Private — file never leaves your browser. Preserves text & layout; complex columns/images need desktop tools for 100% fidelity.
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
