"use client";

import { useState } from "react";

import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed verbatim from the Stitch "Base64 Encoder/Decoder" HTML
 * export the user pasted directly (see docs/PLAN.md #6, same literal-HTML
 * process as Home) — own display-size header, no breadcrumb, own "What is
 * Base64?" / "How to use" / sidebar FAQ layout. `layout: "custom"` in the
 * registry, same treatment as CgpaCalculatorTool.
 *
 * Encode/Decode are *action* buttons that transform whatever is in Input
 * into Output on click (mockup renders them always-solid / always-outlined,
 * no "active mode" state) — matching JsonFormatterTool's Format/Minify
 * pattern, not this file's previous live-updating mode-toggle version.
 *
 * Color/radius classes are this site's existing tokens, not Stitch's raw
 * hex/scale — every value in this page's Stitch tailwind config matches an
 * existing token 1:1 (surface-container-low → surface-low, surface-variant
 * → border-subtle, outline-variant → border, its local "lg" radius (8px) →
 * our rounded-md, etc.), same mapping already established for Home/CGPA.
 */

/** Correct for any UTF-8 text (emoji, non-Latin scripts, ...) — plain btoa() throws on those. */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

const FAQ_ITEMS = [
  {
    question: "Is this tool secure?",
    answer: "Yes. All encoding and decoding happens locally in your browser. No data is sent to our servers.",
  },
  {
    question: "Can I encode files?",
    answer:
      "Currently, this specific tool is optimized for text strings. For file encoding, please use our File to Base64 tool.",
  },
  {
    question: "Is Base64 encryption?",
    answer: "No. Base64 is encoding, not encryption. It provides no security and can be easily decoded by anyone.",
  },
];

export function Base64EncoderDecoderTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isError, setIsError] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleEncode() {
    if (!input) {
      setOutput("");
      setIsError(false);
      return;
    }
    setOutput(encodeBase64(input));
    setIsError(false);
  }

  function handleDecode() {
    if (!input) {
      setOutput("");
      setIsError(false);
      return;
    }
    try {
      setOutput(decodeBase64(input));
      setIsError(false);
    } catch {
      setOutput("That's not valid Base64.");
      setIsError(true);
    }
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setIsError(false);
  }

  function handleSwap() {
    setInput(output);
    setOutput(input);
    setIsError(false);
  }

  async function handleCopy() {
    if (!output || isError) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (!output || isError) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "base64-output.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <div className="mb-12">
        <h1 className="text-display mb-4 text-foreground">Base64 Encoder / Decoder</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          A professional utility for developers to quickly encode and decode Base64 strings. Paste your text or data
          below to begin.
        </p>
      </div>

      {/* Tool Area */}
      <div className="mb-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Card */}
        <div className="flex h-full flex-col rounded-md border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between rounded-t-md border-b border-border bg-surface-low px-6 py-4">
            <span className="text-headline-md text-foreground">Input</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                title="Clear"
                aria-label="Clear"
                className="rounded p-2 text-muted-foreground transition-colors hover:bg-border-subtle hover:text-primary"
              >
                <MaterialIcon name="delete" className="text-sm" />
              </button>
            </div>
          </div>
          <div className="flex flex-grow flex-col p-6">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Enter text or string to encode/decode..."
              className="min-h-[300px] w-full flex-grow resize-none rounded border border-border bg-card p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Output Card */}
        <div className="relative flex h-full flex-col rounded-md border border-border bg-card shadow-sm">
          {/* Swap Button (Absolute center on Desktop, between on Mobile) */}
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Input/Output"
            aria-label="Swap input and output"
            className="absolute top-1/2 -left-6 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background p-3 text-muted-foreground shadow-md transition-all hover:border-primary hover:text-primary lg:flex"
          >
            <MaterialIcon name="swap_horiz" />
          </button>
          <div className="flex items-center justify-between rounded-t-md border-b border-border bg-surface-low px-6 py-4">
            <span className="text-headline-md text-foreground">Output</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy"
                aria-label="Copy output"
                className="rounded p-2 text-muted-foreground transition-colors hover:bg-border-subtle hover:text-primary"
              >
                <MaterialIcon name={copied ? "check" : "content_copy"} className="text-sm" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                title="Download"
                aria-label="Download output"
                className="rounded p-2 text-muted-foreground transition-colors hover:bg-border-subtle hover:text-primary"
              >
                <MaterialIcon name="download" className="text-sm" />
              </button>
            </div>
          </div>
          <div className="flex flex-grow flex-col rounded-b-md bg-card p-6">
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
              className={cn(
                "min-h-[300px] w-full flex-grow resize-none border-none bg-card p-0 font-mono text-sm placeholder:text-muted-foreground focus:ring-0 focus:outline-none",
                isError ? "text-destructive" : "text-muted-foreground",
              )}
            />
          </div>
        </div>

        {/* Mobile Swap Button */}
        <div className="-my-6 z-10 flex justify-center lg:hidden">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Input/Output"
            aria-label="Swap input and output"
            className="flex items-center justify-center rounded-full border border-border bg-background p-3 text-muted-foreground shadow-md transition-all hover:border-primary hover:text-primary"
          >
            <MaterialIcon name="swap_vert" />
          </button>
        </div>
      </div>

      {/* Action Controls */}
      <div className="mb-24 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={handleEncode}
          className="flex items-center gap-2 rounded bg-primary px-8 py-3 text-label-sm text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          <MaterialIcon name="code" className="text-sm" /> Encode to Base64
        </button>
        <button
          type="button"
          onClick={handleDecode}
          className="flex items-center gap-2 rounded border border-border bg-background px-8 py-3 text-label-sm text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <MaterialIcon name="code_off" className="text-sm" /> Decode from Base64
        </button>
      </div>

      {/* SEO Content Section */}
      <div className="mt-24 grid grid-cols-1 gap-12 border-t border-border pt-12 md:grid-cols-3">
        <div className="col-span-1 space-y-12 md:col-span-2">
          <section>
            <h2 className="mb-6 text-headline-lg text-foreground">What is Base64?</h2>
            <p className="mb-4 text-body-md leading-relaxed text-muted-foreground">
              Base64 is an encoding scheme that represents binary data in an ASCII string format by translating it
              into a radix-64 representation. The term Base64 originates from a specific MIME content transfer
              encoding.
            </p>
            <p className="text-body-md leading-relaxed text-muted-foreground">
              It is commonly used to encode data (like images or documents) so it can be safely transmitted over
              networks that are designed to handle only text, preventing data corruption during transfer.
            </p>
          </section>

          <section>
            <h2 className="mb-6 text-headline-lg text-foreground">How to use this tool</h2>
            <ol className="ml-4 list-inside list-decimal space-y-3 text-body-md text-muted-foreground">
              <li>
                Paste your raw text or existing Base64 string into the <strong>Input</strong> area.
              </li>
              <li>
                Select either <strong>Encode</strong> or <strong>Decode</strong> from the action buttons below.
              </li>
              <li>
                The processed result will instantly appear in the <strong>Output</strong> area.
              </li>
              <li>Use the copy or download buttons in the Output header to save your result.</li>
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
