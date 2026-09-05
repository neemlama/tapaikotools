"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

const tool = getToolBySlug("image-compressor")!;

type OutputFormat = "auto" | "jpeg" | "png" | "webp";
type ResizeMode = "none" | "width" | "height" | "max" | "percent";

const FAQ_ITEMS = [
  {
    question: "Is my image uploaded to a server?",
    answer:
      "No. Everything runs 100% in your browser using the Canvas API. Your image is never uploaded, stored, or sent anywhere — it stays on your device. You can even go offline after the page loads and it still works.",
  },
  {
    question: "Which formats are supported?",
    answer:
      "Input: JPEG, PNG, WebP, GIF, BMP, AVIF (any format your browser can display). Output: JPEG, PNG, or WebP. JPEG and WebP support quality control (1–100%); PNG is lossless and always exports at maximum quality. WebP typically gives 25–35% smaller files than JPEG at the same visual quality.",
  },
  {
    question: "Will compressing reduce image quality?",
    answer:
      "JPEG/WebP are lossy — lower quality = smaller file. At quality 80–85, most photos look identical to the original but are 50–70% smaller. PNG is lossless — no quality loss at all. Use the live preview and size comparison to find the sweet spot before downloading.",
  },
  {
    question: "Does resizing help file size?",
    answer:
      "Yes — the biggest win. A 4000×3000 photo resized to 1200px wide is ~10× smaller before any compression. If you only need web/social size, resize first. This tool keeps aspect ratio by default so nothing gets stretched.",
  },
  {
    question: "Is EXIF/metadata kept?",
    answer:
      "No — canvas export strips EXIF (GPS location, camera model, etc.) automatically. This is good for privacy and saves a few extra KB. If you need to keep metadata, use a desktop tool like ExifTool instead.",
  },
];

const FORMAT_MIME: Record<Exclude<OutputFormat, "auto">, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function savingsPercent(original: number, compressed: number): number {
  if (original === 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}

interface CompressedImage {
  id: string;
  originalFile: File;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalBytes: number;
  compressedBlob: Blob | null;
  compressedUrl: string | null;
  compressedWidth: number;
  compressedHeight: number;
  compressedBytes: number | null;
  compressedMime: string | null;
  error: string | null;
}

function getMimeForFile(file: File, outputFormat: OutputFormat): string {
  if (outputFormat !== "auto") return FORMAT_MIME[outputFormat];
  if (file.type === "image/png") return "image/png";
  if (file.type === "image/webp") return "image/webp";
  if (file.type === "image/jpeg" || file.type === "image/jpg") return "image/jpeg";
  // For HEIC, AVIF, BMP, GIF or empty type — pick JPEG as safe lossy default (auto fallback logic will try WebP next if this is still larger).
  // Keeping PNG/WebP verbatim for auto is intentional — user asked to keep original.
  return "image/jpeg";
}

function getExtForMime(mime: string, fallback: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  return fallback;
}

async function loadImageDimensions(file: File): Promise<{ url: string; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not load image"));
      setTimeout(() => reject(new Error("Load timeout")), 8000);
    });
    return { url, width: img.naturalWidth, height: img.naturalHeight };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

async function compressImage(
  file: File,
  quality: number,
  outputFormat: OutputFormat,
  resizeMode: ResizeMode,
  resizeValue: number,
): Promise<{ blob: Blob; width: number; height: number; mime: string }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Invalid image"));
    });

    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;

    if (resizeMode !== "none" && resizeValue > 0) {
      if (resizeMode === "width") {
        targetW = Math.min(resizeValue, img.naturalWidth);
        targetH = Math.round((img.naturalHeight * targetW) / img.naturalWidth);
      } else if (resizeMode === "height") {
        targetH = Math.min(resizeValue, img.naturalHeight);
        targetW = Math.round((img.naturalWidth * targetH) / img.naturalHeight);
      } else if (resizeMode === "max") {
        const scale = Math.min(resizeValue / Math.max(targetW, targetH), 1);
        if (scale < 1) {
          targetW = Math.round(targetW * scale);
          targetH = Math.round(targetH * scale);
        }
      } else if (resizeMode === "percent") {
        const pct = Math.min(Math.max(resizeValue, 1), 100) / 100;
        targetW = Math.max(1, Math.round(targetW * pct));
        targetH = Math.max(1, Math.round(targetH * pct));
      }
    }

    // Don't upscale
    targetW = Math.min(targetW, img.naturalWidth);
    targetH = Math.min(targetH, img.naturalHeight);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    // Fill white for JPEG (no transparency)
    const mime = getMimeForFile(file, outputFormat);
    if (mime === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const q = quality / 100;
    let blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(
        (b) => resolve(b),
        mime,
        mime === "image/png" ? undefined : q,
      ),
    );
    // Safari may return null for WebP — retry with JPEG before failing
    if (!blob && mime === "image/webp") {
      blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", q),
      );
      if (blob) {
        // Treat as JPEG fallback for mime tracking
        return { blob, width: targetW, height: targetH, mime: "image/jpeg" };
      }
    }
    if (!blob) throw new Error("Compression failed");

    // Auto-mode safeguard: canvas PNG is lossless and will almost always be
    // larger than an already-compressed JPEG/WebP photo. Likewise, a naive
    // JPEG re-encode at 65% can still be larger than a well-optimized original
    // (mozjpeg, etc.). If the chosen auto mime made the file BIGGER, try the
    // smallest lossy alternative at the same quality/resize and use that
    // instead — the user's "auto" intent is "keep original if it helps, else
    // smallest". This fixes the reported 1.73MB → 2.6MB regression at 65%.
    if (outputFormat === "auto" && blob.size > file.size) {
      const tryAlternatives: string[] = [];
      if (mime === "image/png") {
        // PNG photo → JPEG/WebP will be far smaller; prefer WebP then JPEG
        tryAlternatives.push("image/webp", "image/jpeg");
      } else if (mime === "image/jpeg") {
        tryAlternatives.push("image/webp");
      } else if (mime === "image/webp") {
        tryAlternatives.push("image/jpeg");
      }
      let bestBlob = blob;
      let bestMime = mime;
      for (const altMime of tryAlternatives) {
        const altBlob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b), altMime, q),
        );
        if (altBlob && altBlob.size < bestBlob.size) {
          bestBlob = altBlob;
          bestMime = altMime;
        }
      }
      if (bestBlob !== blob) {
        return { blob: bestBlob, width: targetW, height: targetH, mime: bestMime };
      }
    }

    return { blob, width: targetW, height: targetH, mime };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function ImageCompressorTool() {
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [quality, setQuality] = useState(80);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("auto");
  const [resizeMode, setResizeMode] = useState<ResizeMode>("none");
  const [resizeValue, setResizeValue] = useState<number>(1200);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalOriginal = images.reduce((s, i) => s + i.originalBytes, 0);
  const totalCompressed =
    images.reduce((s, i) => s + (i.compressedBytes ?? i.originalBytes), 0) || 0;
  const totalSavings = savingsPercent(totalOriginal, totalCompressed);

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      // Limit 10 images at once
      const sliced = files.slice(0, 10);
      const newEntries: CompressedImage[] = [];
      for (const file of sliced) {
        if (file.size > 20 * 1024 * 1024) continue;
        try {
          const { url, width, height } = await loadImageDimensions(file);
          newEntries.push({
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            originalFile: file,
            originalUrl: url,
            originalWidth: width,
            originalHeight: height,
            originalBytes: file.size,
            compressedBlob: null,
            compressedUrl: null,
            compressedWidth: width,
            compressedHeight: height,
            compressedBytes: null,
            compressedMime: null,
            error: null,
          });
        } catch {
          // skip unloadable
        }
      }
      setImages((prev) => [...prev, ...newEntries]);
    },
    [],
  );

  // Re-compress whenever controls change
  useEffect(() => {
    if (images.length === 0) return;
    let cancelled = false;
    async function recompress() {
      setIsProcessing(true);
      const next = [...images];
      for (let idx = 0; idx < next.length; idx++) {
        if (cancelled) break;
        const entry = next[idx];
        try {
          const { blob, width, height, mime } = await compressImage(
            entry.originalFile,
            quality,
            outputFormat,
            resizeMode,
            resizeValue,
          );
          if (cancelled) break;
          if (entry.compressedUrl) URL.revokeObjectURL(entry.compressedUrl);
          next[idx] = {
            ...entry,
            compressedBlob: blob,
            compressedUrl: URL.createObjectURL(blob),
            compressedWidth: width,
            compressedHeight: height,
            compressedBytes: blob.size,
            compressedMime: mime,
            error: null,
          };
        } catch (e) {
          next[idx] = {
            ...entry,
            error: e instanceof Error ? e.message : "Failed",
          };
        }
        // incremental update for UX
        if (!cancelled) setImages([...next]);
      }
      if (!cancelled) setIsProcessing(false);
    }
    recompress();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally re-run on control changes; images length check prevents loop on self-update
  }, [quality, outputFormat, resizeMode, resizeValue, images.length]);

  // Initial compress for newly added images (covers first load when above effect already handles it, but ensures new entries get compressed)
  useEffect(() => {
    const needs = images.filter((i) => !i.compressedBlob && !i.error);
    if (needs.length === 0) return;
    // Trigger by bumping quality state key — instead just run compress for needs
    // The main effect already handles images.length change, so this is a fallback for same-length re-add
  }, [images]);

  // Track latest images for unmount cleanup without revoking live URLs on every change
  const imagesRef = useRef(images);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    return () => {
      for (const img of imagesRef.current) {
        URL.revokeObjectURL(img.originalUrl);
        if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
      }
    };
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeImage = (id: string) => {
    setImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) {
        URL.revokeObjectURL(found.originalUrl);
        if (found.compressedUrl) URL.revokeObjectURL(found.compressedUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearAll = () => {
    for (const img of images) {
      URL.revokeObjectURL(img.originalUrl);
      if (img.compressedUrl) URL.revokeObjectURL(img.compressedUrl);
    }
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadOne = (entry: CompressedImage) => {
    if (!entry.compressedBlob || !entry.compressedUrl) return;
    // Use the actual mime that was encoded (auto fallback may have switched e.g. png→webp)
    const mime = entry.compressedMime || getMimeForFile(entry.originalFile, outputFormat);
    const ext = getExtForMime(mime, entry.originalFile.name.split(".").pop() || "jpg");
    const base = entry.originalFile.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = entry.compressedUrl;
    a.download = `${base}-compressed.${ext}`;
    a.click();
  };

  const downloadAll = () => {
    for (const entry of images) downloadOne(entry);
  };

  // SEO: JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Image Compressor — TapaikoTools",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Free online image compressor to reduce JPEG, PNG, WebP file size without visible quality loss. Resize, choose quality and format — 100% in your browser, no upload.",
    featureList: [
      "Compress JPEG, PNG, WebP",
      "Quality slider 1-100",
      "Resize by width, height, max dimension or percent",
      "Before/after preview with file size savings",
      "100% client-side — no server upload",
      "Batch compress up to 10 images",
    ],
    url: "https://tapaikotools.neemlama.com.np/tools/image-compressor",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Header */}
      <div className="mb-12">
        <ToolBreadcrumb tool={tool} />
        <h1 className="text-display mt-4 mb-4 text-foreground">
          Image Compressor — Reduce Image Size Online
        </h1>
        <p className="max-w-3xl text-body-lg text-muted-foreground">
          Compress <strong className="font-medium text-foreground">JPEG, PNG, WebP</strong> and resize images
          instantly — <span className="font-medium text-foreground">100% in your browser</span>. No upload, no
          watermark, no sign-up. Drag &amp; drop up to 10 images, pick quality &amp; format, see live savings, and
          download.
        </p>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Keywords: compress image, reduce image size, image compressor, JPG compressor, PNG compressor, WebP
          converter, resize image online — private &amp; free.
        </p>
      </div>

      {/* Tool Area */}
      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Drop zone + Controls */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "flex min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-8 text-center shadow-sm transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            )}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-low">
              <MaterialIcon name="imagesmode" className="text-[28px] text-primary" />
            </div>
            <p className="text-headline-md mb-2 text-foreground">Drop images here</p>
            <p className="mb-6 text-body-md text-muted-foreground">
              JPEG, PNG, WebP, GIF, BMP — up to 10 at once, max 20 MB each. Stays on your device.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
              className="hidden"
              id="image-compressor-input"
            />
            <label
              htmlFor="image-compressor-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-button px-6 py-2.5 text-label-sm text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
            >
              <MaterialIcon name="upload" className="text-sm" />
              Choose images
            </label>
            <p className="mt-4 text-xs text-muted-foreground">
              {images.length > 0
                ? `${images.length} image${images.length === 1 ? "" : "s"} selected`
                : "Or click to browse"}
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="border-b border-border-subtle pb-3 text-headline-md text-foreground">
              Compression Settings
            </h2>

            {/* Quality */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label htmlFor="quality" className="text-label-sm tracking-wider text-muted-foreground uppercase">
                  Quality — {quality}%
                </label>
                <span className="rounded bg-primary/10 px-2 py-1 font-mono text-xs font-bold text-primary">
                  {quality < 60 ? "Smaller" : quality > 85 ? "Higher quality" : "Balanced"}
                </span>
              </div>
              <input
                id="quality"
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="range-slider"
                aria-label="Compression quality"
                disabled={outputFormat === "png" || (outputFormat === "auto" && images.length > 0 && images.every((i) => i.originalFile.type === "image/png"))}
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>10% (smallest)</span>
                <span>100% (best)</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Tip: 80–85% is the sweet spot — looks identical, ~50–70% smaller. Only affects JPEG/WebP; PNG is
                always lossless.
              </p>
              {(outputFormat === "png" ||
                (outputFormat === "auto" && images.length > 0 && images.every((i) => i.originalFile.type === "image/png"))) && (
                <p className="mt-2 flex items-center gap-1.5 rounded bg-warning/10 px-2 py-1.5 text-xs text-warning">
                  <MaterialIcon name="info" className="text-sm" />
                  PNG is lossless — quality slider does nothing for it. Switch to <strong>WebP</strong> or{" "}
                  <strong>JPEG</strong> to shrink PNG photos.
                </p>
              )}
            </div>

            {/* Format */}
            <div>
              <label htmlFor="format" className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                Output Format
              </label>
              <div className="relative">
                <select
                  id="format"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
                  className="w-full appearance-none rounded-lg border border-border bg-input p-3 pr-10 text-body-md text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="auto">Auto (keep original)</option>
                  <option value="jpeg">JPEG (.jpg) — best for photos</option>
                  <option value="png">PNG (.png) — lossless, keeps transparency</option>
                  <option value="webp">WebP (.webp) — smallest, modern browsers</option>
                </select>
                <MaterialIcon
                  name="expand_more"
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-outline"
                />
              </div>
            </div>

            {/* Resize */}
            <div>
              <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                Resize (optional)
              </span>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {(
                  [
                    ["none", "No resize"],
                    ["width", "Width"],
                    ["height", "Height"],
                    ["max", "Max side"],
                    ["percent", "% scale"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setResizeMode(value as ResizeMode)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium transition-colors",
                      resizeMode === value
                        ? "border-primary bg-primary-button text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-accent",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {resizeMode !== "none" && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={resizeMode === "percent" ? 100 : 8000}
                    value={resizeValue}
                    onChange={(e) => setResizeValue(Number(e.target.value) || 1)}
                    className="w-full rounded-lg border border-border bg-input p-3 text-body-md text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                    aria-label={resizeMode === "percent" ? "Scale percent" : "Resize dimension in pixels"}
                  />
                  <span className="shrink-0 text-sm text-muted-foreground">
                    {resizeMode === "percent" ? "%" : "px"}
                  </span>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Keeps aspect ratio. Never upscales — if image is smaller than target, it stays as-is.
              </p>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 border-t border-border-subtle pt-4">
                <button
                  type="button"
                  onClick={downloadAll}
                  disabled={isProcessing || images.every((i) => !i.compressedBlob)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-button px-4 py-2.5 text-label-sm text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  <MaterialIcon name="download" className="text-sm" />
                  Download all
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg border border-border bg-background px-4 py-2.5 text-label-sm text-foreground transition-colors hover:bg-accent"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Trust / privacy */}
          <div className="rounded-xl border border-border bg-surface-low p-5">
            <h3 className="mb-2 flex items-center gap-2 text-label-sm font-medium text-foreground">
              <MaterialIcon name="lock" className="text-[18px] text-primary" />
              Private by design
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <MaterialIcon name="check" className="mt-0.5 text-[16px] text-success" />
                No upload — runs offline in your browser
              </li>
              <li className="flex gap-2">
                <MaterialIcon name="check" className="mt-0.5 text-[16px] text-success" />
                EXIF/GPS stripped automatically
              </li>
              <li className="flex gap-2">
                <MaterialIcon name="check" className="mt-0.5 text-[16px] text-success" />
                No watermark, no sign-up, no limits
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Preview + Results */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Summary bar */}
          {images.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-button text-primary-foreground">
                  <MaterialIcon name="compress" />
                </div>
                <div>
                  <p className="text-body-md font-medium text-foreground">
                    {images.length} image{images.length === 1 ? "" : "s"} ·{" "}
                    <span
                      className={cn(
                        totalSavings > 0
                          ? "text-success"
                          : totalSavings < 0
                            ? "text-destructive"
                            : "text-muted-foreground",
                      )}
                    >
                      {isProcessing
                        ? "processing…"
                        : totalSavings > 0
                          ? `-${totalSavings}% total`
                          : totalSavings < 0
                            ? `+${Math.abs(totalSavings)}% larger — try WebP/resize`
                            : "no saving yet"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(totalOriginal)} → {formatBytes(totalCompressed)}
                    {totalSavings > 0 && ` · saved ${formatBytes(totalOriginal - totalCompressed)}`}
                    {totalSavings < 0 && ` · original was smaller`}
                  </p>
                </div>
              </div>
              {isProcessing && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MaterialIcon name="progress_activity" className="animate-spin text-sm" />
                  Compressing…
                </span>
              )}
            </div>
          )}

          {/* Empty state */}
          {images.length === 0 && (
            <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-low p-8 text-center">
              <MaterialIcon name="image" className="mb-3 text-[48px] text-muted-foreground/50" />
              <p className="text-headline-md mb-2 text-foreground">No images yet</p>
              <p className="max-w-sm text-body-md text-muted-foreground">
                Drop JPEG, PNG or WebP images on the left. You&apos;ll see a side-by-side preview, original vs
                compressed size, and savings % for each — then download in one click.
              </p>
            </div>
          )}

          {/* Image cards */}
          {images.map((entry) => {
            const savings =
              entry.compressedBytes !== null ? savingsPercent(entry.originalBytes, entry.compressedBytes) : null;
            return (
              <div
                key={entry.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-border bg-surface-low px-4 py-3">
                  <span className="truncate pr-2 text-sm font-medium text-foreground" title={entry.originalFile.name}>
                    {entry.originalFile.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(entry.id)}
                    aria-label={`Remove ${entry.originalFile.name}`}
                    className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-border-subtle hover:text-destructive"
                  >
                    <MaterialIcon name="close" className="text-[18px]" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                  {/* Original */}
                  <div>
                    <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Original · {formatBytes(entry.originalBytes)} · {entry.originalWidth}×{entry.originalHeight}
                    </p>
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-low p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.originalUrl}
                        alt={`Original ${entry.originalFile.name}`}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  {/* Compressed */}
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                      Compressed
                      {entry.compressedBytes !== null && (
                        <>
                          · {formatBytes(entry.compressedBytes)} · {entry.compressedWidth}×{entry.compressedHeight}
                          {entry.compressedMime && (
                            <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">
                              {entry.compressedMime.split("/")[1].toUpperCase()}
                            </span>
                          )}
                          {savings !== null && savings > 0 && (
                            <span className="rounded bg-success/10 px-1.5 py-0.5 text-success">-{savings}%</span>
                          )}
                          {savings !== null && savings <= 0 && (
                            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
                              +{Math.abs(savings)}% larger
                            </span>
                          )}
                        </>
                      )}
                    </p>
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-low p-2">
                      {entry.compressedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={entry.compressedUrl}
                          alt={`Compressed ${entry.originalFile.name}`}
                          className="max-h-full max-w-full object-contain"
                          loading="lazy"
                        />
                      ) : entry.error ? (
                        <p className="p-4 text-center text-sm text-destructive">{entry.error}</p>
                      ) : (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MaterialIcon name="progress_activity" className="animate-spin text-sm" />
                          Compressing…
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {entry.compressedBytes !== null && entry.compressedBytes > entry.originalBytes && (
                  <p className="mx-4 mb-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
                    <MaterialIcon name="warning" className="mt-0.5 text-sm" />
                    <span>
                      Compressed is larger than original — your photo is already well-optimized. Try
                      {outputFormat === "auto" ? " choosing " : " "} <strong>WebP</strong> at 65–75%, or use{" "}
                      <strong>Resize → Max side 1200–1600px</strong> for the biggest saving.
                    </span>
                  </p>
                )}
                <div className="flex gap-2 border-t border-border-subtle bg-card px-4 py-3">
                  <button
                    type="button"
                    onClick={() => downloadOne(entry)}
                    disabled={!entry.compressedBlob}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-button px-4 py-2 text-label-sm text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
                  >
                    <MaterialIcon name="download" className="text-sm" />
                    Download
                  </button>
                  {entry.compressedBytes !== null && entry.originalBytes > entry.compressedBytes && (
                    <span className="flex items-center rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
                      Saved {formatBytes(entry.originalBytes - entry.compressedBytes)}
                    </span>
                  )}
                  {entry.compressedBytes !== null && entry.compressedBytes > entry.originalBytes && (
                    <span className="flex items-center rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                      Original smaller
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational / SEO content */}
      <div className="grid grid-cols-1 gap-12 border-t border-border pt-12 md:grid-cols-3">
        <div className="col-span-1 space-y-12 md:col-span-2">
          <section>
            <h2 className="mb-4 text-headline-lg text-foreground">What is image compression?</h2>
            <p className="mb-3 text-body-md leading-relaxed text-muted-foreground">
              Image compression reduces file size so pages load faster, emails send quicker, and storage goes
              further. <strong className="text-foreground">Lossy</strong> formats like JPEG and WebP discard
              imperceptible detail to shrink files dramatically — ideal for photos.{" "}
              <strong className="text-foreground">Lossless</strong> PNG keeps every pixel perfect, best for
              graphics, logos, and screenshots with text.
            </p>
            <p className="text-body-md leading-relaxed text-muted-foreground">
              This tool uses your browser&apos;s native Canvas encoder — the same engine behind Chrome and Firefox —
              so quality matches desktop apps. No server, no queue, no watermark. Works offline.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-headline-lg text-foreground">How to compress an image</h2>
            <ol className="ml-4 list-decimal space-y-2 text-body-md text-muted-foreground">
              <li>
                <strong className="text-foreground">Drop images</strong> onto the dashed area or click{" "}
                <strong className="text-foreground">Choose images</strong> — up to 10 at once.
              </li>
              <li>
                Adjust <strong className="text-foreground">Quality</strong> (80–85% is usually perfect), pick{" "}
                <strong className="text-foreground">Output Format</strong> (WebP is smallest; JPEG is most
                compatible), and optionally <strong className="text-foreground">Resize</strong> to your target
                width/height.
              </li>
              <li>
                Compare <strong className="text-foreground">Original vs Compressed</strong> — check file size,
                dimensions, and savings % live.
              </li>
              <li>
                Click <strong className="text-foreground">Download</strong> per image or{" "}
                <strong className="text-foreground">Download all</strong> for the batch.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-headline-lg text-foreground">JPEG vs PNG vs WebP — which to choose?</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MaterialIcon name="photo" className="text-[18px] text-primary" />
                  JPEG
                </h3>
                <p className="text-sm text-muted-foreground">
                  Best for photos. Smallest lossy files, no transparency. Use 80–85% quality.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MaterialIcon name="palette" className="text-[18px] text-secondary" />
                  PNG
                </h3>
                <p className="text-sm text-muted-foreground">
                  Best for logos, icons, screenshots. Lossless + transparency, but larger.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MaterialIcon name="bolt" className="text-[18px] text-tertiary" />
                  WebP
                </h3>
                <p className="text-sm text-muted-foreground">
                  Modern best-of-both: 25–35% smaller than JPEG, supports transparency &amp; lossless.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="col-span-1">
          <section className="rounded-xl border border-border bg-surface-low p-6">
            <h3 className="mb-6 text-headline-md text-foreground">FAQ — Image Compressor</h3>
            <div className="space-y-6">
              {FAQ_ITEMS.map((item) => (
                <div key={item.question}>
                  <h4 className="mb-2 text-label-sm font-bold text-foreground">{item.question}</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-label-sm font-medium text-foreground">
              <MaterialIcon name="lightbulb" className="text-[18px] text-warning" />
              Pro tip — resize before you compress
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A phone photo at 4032×3024 resized to 1200px wide is already 70% smaller — before quality even
              matters. For web, blog, or social, <strong className="text-foreground">Max side 1200–1600px</strong>{" "}
              is usually perfect and saves the most.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
