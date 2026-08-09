"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/components/ui/material-icon";

/**
 * Hand-transcribed verbatim from the Stitch "QR Code Generator" HTML export
 * the user pasted directly (see docs/PLAN.md #6, same literal-HTML process
 * as Home/Base64) — breadcrumb + `text-headline-lg` header match
 * ToolPageShell's standard shape closely enough (unlike Base64/CGPA) that
 * this keeps `layout: "standard"`; the shell provides breadcrumb/h1/
 * description, this component owns everything below that, including its
 * own "What is a QR Code?" / "How to use" / FAQ sections in place of
 * ToolPageShell's generic About/FAQ (see the `about`/faq-content.ts
 * comments) — same pattern as JsonFormatterTool/WordCounterTool.
 *
 * The mockup has no "Generate" button — typing/adjusting settings updates
 * the preview live, per its own "How to use" copy ("The preview updates in
 * real-time"). Real generation (via the already-installed `qrcode`
 * package) replaces the mockup's static placeholder icon once there's
 * input, PNG/SVG downloads and clipboard-image copy are real, not dead
 * buttons — same "functional, not just a mockup" call as the Home page
 * rebuild (see docs/PLAN.md #6).
 */

const SIZES = { small: 256, medium: 512, large: 1024 } as const;
type SizeKey = keyof typeof SIZES;

const ERROR_CORRECTION = {
  L: "L - Low (7%)",
  M: "M - Medium (15%)",
  Q: "Q - Quartile (25%)",
  H: "H - High (30%)",
} as const;
type EcLevel = keyof typeof ERROR_CORRECTION;

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const FAQ_ITEMS = [
  {
    question: "Do QR codes expire?",
    answer:
      "Static QR codes (like the ones generated here) never expire. The data is hard-coded directly into the pattern. As long as the destination URL or content remains active, the QR code will work.",
  },
  {
    question: "What is Error Correction?",
    answer:
      "Error correction allows a QR code to remain readable even if part of it is damaged, obscured, or contains a logo. Level 'L' allows for 7% damage recovery, while Level 'H' allows up to 30% recovery.",
  },
];

export function QrCodeGeneratorTool() {
  const [text, setText] = useState("");
  const [size, setSize] = useState<SizeKey>("medium");
  const [ecLevel, setEcLevel] = useState<EcLevel>("M");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fgValid = HEX_COLOR.test(fgColor);
  const bgValid = HEX_COLOR.test(bgColor);

  // Live preview: regenerates whenever content or settings change, debounced
  // lightly so a burst of keystrokes doesn't fire a QR render per keypress.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (!text.trim() || !fgValid || !bgValid) {
        setDataUrl("");
        setError(null);
        return;
      }
      QRCode.toDataURL(text, {
        width: SIZES[size],
        margin: 1,
        errorCorrectionLevel: ecLevel,
        color: { dark: fgColor, light: bgColor },
      })
        .then((url) => {
          if (cancelled) return;
          setDataUrl(url);
          setError(null);
        })
        .catch(() => {
          if (cancelled) return;
          setDataUrl("");
          setError("Couldn't generate a QR code for that input.");
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text, size, ecLevel, fgColor, bgColor, fgValid, bgValid]);

  function handleDownloadPng() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "qrcode.png";
    link.click();
  }

  async function handleDownloadSvg() {
    if (!text.trim() || !fgValid || !bgValid) return;
    const svg = await QRCode.toString(text, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: ecLevel,
      color: { dark: fgColor, light: bgColor },
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qrcode.svg";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyImage() {
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard image writes need a secure context/permission — non-fatal if unsupported or denied.
    }
  }

  return (
    <div className="flex flex-col gap-16">
      {/* Tool Canvas Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Configuration */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Content Card */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="border-b border-border pb-2 text-headline-md text-foreground">Content</h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="qr-input" className="text-label-sm text-foreground">
                Enter URL or Text
              </label>
              <textarea
                id="qr-input"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="https://example.com or Hello World!"
                rows={4}
                className="w-full rounded-lg border border-border bg-input p-3 text-body-md text-foreground transition-shadow focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Settings Card */}
          <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="border-b border-border pb-2 text-headline-md text-foreground">Configuration</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Size Dropdown */}
              <div className="flex flex-col gap-2">
                <label htmlFor="qr-size" className="text-label-sm text-foreground">
                  Size
                </label>
                <div className="relative">
                  <select
                    id="qr-size"
                    value={size}
                    onChange={(event) => setSize(event.target.value as SizeKey)}
                    className="w-full appearance-none rounded-lg border border-border bg-input p-3 pr-10 text-body-md text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="small">Small (256x256)</option>
                    <option value="medium">Medium (512x512)</option>
                    <option value="large">Large (1024x1024)</option>
                  </select>
                  <MaterialIcon
                    name="expand_more"
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-outline"
                  />
                </div>
              </div>

              {/* Error Correction */}
              <div className="flex flex-col gap-2">
                <label htmlFor="qr-ec" className="text-label-sm text-foreground">
                  Error Correction
                </label>
                <div className="relative">
                  <select
                    id="qr-ec"
                    value={ecLevel}
                    onChange={(event) => setEcLevel(event.target.value as EcLevel)}
                    className="w-full appearance-none rounded-lg border border-border bg-input p-3 pr-10 text-body-md text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {(Object.keys(ERROR_CORRECTION) as EcLevel[]).map((level) => (
                      <option key={level} value={level}>
                        {ERROR_CORRECTION[level]}
                      </option>
                    ))}
                  </select>
                  <MaterialIcon
                    name="expand_more"
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-outline"
                  />
                </div>
              </div>

              {/* Color Settings */}
              <div className="flex flex-col gap-2 md:col-span-2">
                <span className="text-label-sm text-foreground">Colors</span>
                {/*
                 * flex-col on mobile, flex-row from sm: up. Previously
                 * `flex gap-4` unconditionally — two `flex-1` hex inputs
                 * side-by-side never got a mobile-stacking rule, and flex
                 * items don't shrink below their content's natural minimum
                 * width by default, so the row forced 201px of horizontal
                 * overflow on a 390px viewport (found in the Phase A sweep,
                 * confirmed via DOM diagnostic — see docs/PLAN.md).
                 */}
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Foreground</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fgValid ? fgColor : "#000000"}
                        onChange={(event) => setFgColor(event.target.value)}
                        aria-label="Foreground color"
                        className="h-10 w-10 cursor-pointer rounded border border-border bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(event) => setFgColor(event.target.value)}
                        aria-label="Foreground color hex value"
                        className="min-w-0 flex-1 rounded-lg border border-border bg-input p-2 font-mono text-sm text-foreground uppercase focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Background</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgValid ? bgColor : "#ffffff"}
                        onChange={(event) => setBgColor(event.target.value)}
                        aria-label="Background color"
                        className="h-10 w-10 cursor-pointer rounded border border-border bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(event) => setBgColor(event.target.value)}
                        aria-label="Background color hex value"
                        className="min-w-0 flex-1 rounded-lg border border-border bg-input p-2 font-mono text-sm text-foreground uppercase focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Actions */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="border-b border-border pb-2 text-headline-md text-foreground">Preview</h2>

            {/* QR Code Canvas Area */}
            <div className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface-low p-8">
              {dataUrl ? (
                // Locally generated data URL, not a remote/static asset — next/image adds no benefit here.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dataUrl} alt={`QR code encoding: ${text}`} className="h-full w-full object-contain" />
              ) : (
                <div className="relative flex h-full w-full items-center justify-center border border-border bg-white shadow-sm">
                  <MaterialIcon name="qr_code_2" className="text-[96px] text-foreground/70" />
                  <div className="absolute inset-x-0 top-0 h-1 w-full translate-y-[200%] bg-gradient-to-b from-transparent via-primary/20 to-transparent animate-scan" />
                </div>
              )}
            </div>
            {error && (
              <p role="alert" className="text-body-md text-destructive">
                {error}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={!dataUrl}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-label-sm text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                <MaterialIcon name="download" className="text-sm" />
                Download PNG
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  disabled={!dataUrl}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-label-sm text-foreground transition-colors hover:bg-surface-low disabled:pointer-events-none disabled:opacity-50"
                >
                  <MaterialIcon name="code" className="text-sm" />
                  SVG
                </button>
                <button
                  type="button"
                  onClick={handleCopyImage}
                  disabled={!dataUrl}
                  className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-label-sm text-foreground transition-colors hover:bg-surface-low disabled:pointer-events-none disabled:opacity-50"
                >
                  <MaterialIcon name={copied ? "check" : "content_copy"} className="text-sm" />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Content Section */}
      <div className="flex max-w-4xl flex-col gap-12">
        <article className="flex flex-col gap-4">
          <h2 className="border-b border-border pb-2 text-headline-lg text-foreground">What is a QR Code?</h2>
          <div className="space-y-4 text-body-md text-muted-foreground">
            <p>
              A QR code (Quick Response code) is a two-dimensional matrix barcode invented in 1994 by the Japanese
              automotive company Denso Wave. Unlike standard 1D barcodes that only hold information horizontally, QR
              codes store data both horizontally and vertically, allowing them to hold significantly more
              information.
            </p>
            <p>
              When scanned with a smartphone camera or a dedicated QR reader app, the encoded data is instantly
              extracted. This data can be a website URL, contact information (vCard), plain text, email address, or
              even Wi-Fi network credentials.
            </p>
          </div>
        </article>

        <article className="flex flex-col gap-4">
          <h2 className="border-b border-border pb-2 text-headline-lg text-foreground">How to use this generator</h2>
          <ol className="list-decimal space-y-3 pl-5 text-body-md text-muted-foreground">
            <li>
              <strong className="text-foreground">Enter your content:</strong> Type or paste the URL, text, or data
              you want to encode into the input field.
            </li>
            <li>
              <strong className="text-foreground">Adjust settings:</strong> Select the desired image size and error
              correction level. Higher error correction makes the code more robust against damage but increases its
              density.
            </li>
            <li>
              <strong className="text-foreground">Customize colors:</strong> Choose foreground and background
              colors. Ensure there is sufficient contrast between the two for reliable scanning (dark foreground on
              a light background is standard).
            </li>
            <li>
              <strong className="text-foreground">Download or Copy:</strong> The preview updates in real-time. Once
              satisfied, click &quot;Download PNG&quot; for a standard image, &quot;SVG&quot; for a scalable vector
              graphic, or &quot;Copy&quot; to paste the image directly into your workflow.
            </li>
          </ol>
        </article>

        <article className="flex flex-col gap-6">
          <h2 className="border-b border-border pb-2 text-headline-lg text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="rounded-lg border border-border bg-card p-4">
                <h3 className="mb-2 text-headline-md text-foreground">{item.question}</h3>
                <p className="text-body-md text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
