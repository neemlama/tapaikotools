"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed from the Stitch "JSON Formatter" screen rather than
 * built from the shared Panel/CodeOutput/CopyButton pieces the other tool
 * pages use — this page's IDE-style split view (status dot, dark
 * "Formatted Output" pane, icon+label toolbar) doesn't match those shared
 * components' shape closely enough to reuse without diverging from the
 * design anyway. See the `about`/faq-content.ts comments for the same call
 * on the bento content below.
 */

const PLACEHOLDER = 'Paste JSON here...\n\n{\n  "example": "data"\n}';

type Status = "ready" | "valid" | "invalid";

export function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  // Whether the text currently in `output` is a parser error message rather
  // than formatted JSON — kept separate from `status` because Stitch's own
  // script only recolors the output pane from Format/Minify, never from
  // Validate (Validate flips the status dot but leaves the output pane
  // exactly as it was).
  const [outputIsError, setOutputIsError] = useState(false);
  const [status, setStatus] = useState<Status>("ready");
  const [copied, setCopied] = useState(false);

  function parseOrError(): unknown | undefined {
    const trimmed = input.trim();
    if (!trimmed) {
      setStatus("ready");
      setOutput("");
      setOutputIsError(false);
      return undefined;
    }
    try {
      const parsed: unknown = JSON.parse(input);
      return parsed;
    } catch (err) {
      setStatus("invalid");
      setOutput(err instanceof Error ? err.message : "Invalid JSON.");
      setOutputIsError(true);
      return undefined;
    }
  }

  function handleFormat() {
    const parsed = parseOrError();
    if (parsed === undefined) return;
    setOutput(JSON.stringify(parsed, null, 2));
    setOutputIsError(false);
    setStatus("valid");
  }

  function handleMinify() {
    const parsed = parseOrError();
    if (parsed === undefined) return;
    setOutput(JSON.stringify(parsed));
    setOutputIsError(false);
    setStatus("valid");
  }

  function handleValidate() {
    if (!input.trim()) return;
    try {
      JSON.parse(input);
      setStatus("valid");
    } catch {
      setStatus("invalid");
    }
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setOutputIsError(false);
    setStatus("ready");
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "formatted.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  const statusLabel = status === "valid" ? "Valid JSON" : status === "invalid" ? "Invalid JSON" : "Ready";
  const statusDotClass = status === "valid" ? "bg-success" : status === "invalid" ? "bg-destructive" : "bg-border";
  const statusTextClass =
    status === "valid" ? "text-success" : status === "invalid" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col items-start gap-4 rounded-md border border-border bg-card p-2 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <Button onClick={handleFormat}>
            <MaterialIcon name="code" className="text-[18px]" />
            Format
          </Button>
          <Button variant="secondary" onClick={handleMinify}>
            <MaterialIcon name="compress" className="text-[18px]" />
            Minify
          </Button>
          <Button variant="secondary" onClick={handleValidate}>
            <MaterialIcon name="fact_check" className="text-[18px]" />
            Validate
          </Button>
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto md:justify-end">
          <button
            type="button"
            onClick={handleClear}
            title="Clear"
            aria-label="Clear"
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <MaterialIcon name="delete" />
          </button>
          <div className="mx-1 hidden h-6 w-px bg-border md:block" />
          <Button variant="secondary" onClick={handleCopy}>
            <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[18px]" />
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="secondary" onClick={handleDownload}>
            <MaterialIcon name="download" className="text-[18px]" />
            Download
          </Button>
        </div>
      </div>

      {/* IDE split view */}
      <div className="grid h-[600px] grid-cols-1 gap-1 overflow-hidden rounded-md border border-border bg-border-subtle lg:grid-cols-2">
        {/* Input pane */}
        <div className="flex h-full flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
            <span className="text-label-sm uppercase tracking-wider text-muted-foreground">Input</span>
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", statusDotClass)} />
              <span className={cn("font-mono text-[10px]", statusTextClass)}>{statusLabel}</span>
            </div>
          </div>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent font-mono text-sm focus:ring-0"
          />
        </div>

        {/* Output pane */}
        <div className="group relative flex h-full flex-col border-t border-border bg-[#313030] lg:border-t-0 lg:border-l">
          <div className="flex items-center justify-between border-b border-border bg-[#222] px-4 py-2">
            <span className="text-label-sm uppercase tracking-wider text-white/70">Formatted Output</span>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <pre className="editor-scroll m-0 h-full w-full overflow-auto p-4">
              <code
                className={cn(
                  "block min-h-full font-mono text-sm",
                  // Fixed hex, not `text-destructive` (2026-08-09, Phase B):
                  // this pane's bg-[#313030] doesn't change with site theme,
                  // but `text-destructive` does — in light mode it resolved
                  // to the *light-mode* red (#ba1a1a, tuned for light
                  // backgrounds), rendered on a permanently-dark panel:
                  // 2.04:1, essentially unreadable. Hardcoded to the
                  // dark-mode red value instead, matching this pane's own
                  // fixed white/gray text right above.
                  outputIsError ? "text-[#ff6b6b]" : "text-white/90",
                )}
              >
                {output}
              </code>
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              title="Quick Copy"
              aria-label="Quick copy"
              className="absolute top-4 right-4 rounded-md border border-border bg-card p-2 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-accent focus:opacity-100 group-hover:opacity-100"
            >
              <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[16px]" />
            </button>
          </div>
        </div>
      </div>

      {/* Content section (bento grid) */}
      <section className="mt-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-md border border-border bg-card p-6 md:col-span-2">
            <div className="mb-2 flex items-center gap-3 border-b border-border pb-4">
              <MaterialIcon name="info" className="text-primary" />
              <h2 className="text-headline-md">What is JSON Formatting?</h2>
            </div>
            <p className="text-body-md text-muted-foreground">
              JSON (JavaScript Object Notation) is a lightweight data-interchange format. While it is easy for
              machines to parse and generate, minified JSON can be incredibly difficult for humans to read.
            </p>
            <p className="text-body-md text-muted-foreground">
              Formatting (or &quot;pretty-printing&quot;) adds structural whitespace—spaces, tabs, and line
              breaks—revealing the hierarchical nature of the data. This tool ensures your data structures are
              perfectly indented according to strict 4-space or 2-space technical standards, minimizing cognitive
              load during debugging.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-md border border-border bg-muted p-6">
            <div className="mb-2 border-b border-border pb-4">
              <h2 className="text-headline-md">Quick Guide</h2>
            </div>
            <ol className="flex flex-col gap-4 text-body-md text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-sm font-bold text-white">
                  1
                </span>
                <span>Paste your raw or stringified JSON payload into the left panel.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-sm font-bold text-white">
                  2
                </span>
                <span>
                  Click <strong>Format</strong> to apply standard indentation.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-sm font-bold text-white">
                  3
                </span>
                <span>
                  Use <strong>Minify</strong> to strip all unnecessary whitespace before production deployment.
                </span>
              </li>
            </ol>
          </div>

          <div className="rounded-md border border-border bg-card p-6 md:col-span-3">
            <div className="mb-6 border-b border-border pb-4">
              <h2 className="text-headline-md">Technical FAQ</h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-label-sm text-foreground uppercase tracking-wider">Is my data secure?</h3>
                <p className="text-body-md text-muted-foreground">
                  Yes. This tool operates entirely within your browser using client-side JavaScript. No data is
                  transmitted to our servers for processing.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-label-sm text-foreground uppercase tracking-wider">
                  Does it support JSON Lines (JSONL)?
                </h3>
                <p className="text-body-md text-muted-foreground">
                  Currently, the standard formatter expects a single valid JSON object or array at the root. JSONL
                  parsing is slated for the v2.1 update.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
