"use client";

import { useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { getToolBySlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

const tool = getToolBySlug("uuid-generator")!;

/**
 * Hand-transcribed verbatim from the Stitch "UUID Generator" HTML export the
 * user pasted directly (same literal-HTML process as Home/Unit
 * Converter/Base64 — see docs/PLAN.md #6/#7) — own display-size header,
 * Configuration/Output two-panel layout, own "What is a UUID?" / "How to
 * use" / FAQ three-column footer section. `layout: "custom"` in the
 * registry, same treatment as the other hand-transcribed tools.
 *
 * Breadcrumb added after launch (2026-08-09) — see AttendanceCalculatorTool
 * for why. Wrapped in `flex justify-center md:justify-start` to match this
 * header's own responsive alignment (centered on mobile, left on desktop).
 *
 * Color/radius classes are this site's existing tokens, not Stitch's raw
 * hex/scale — every value in this page's Stitch tailwind config maps 1:1 to
 * an existing token (surface-container-highest → border-subtle,
 * surface-container-high → accent, surface-container-low → surface-low,
 * outline-variant → border, its "lg" radius (8px) → our rounded-md, its
 * DEFAULT radius (4px) → our rounded-sm), same mapping already established
 * for Home/Unit Converter/Base64.
 *
 * Three deliberate deviations from the literal Stitch script, all flagged
 * here rather than silently "fixed":
 *  - Max quantity is 50 (matching the slider's own `max` and the "How to
 *    use" copy, "up to 50 at a time") — the previous version of this
 *    component allowed up to 100, which contradicted its own copy.
 *  - Stitch's v1 UUID is explicitly commented "// Mock v1 for demo" (just a
 *    timestamp + random digits, not RFC-shaped). Implemented a real RFC
 *    4122 version 1 UUID below instead (60-bit timestamp + random clock
 *    sequence + random node id with the multicast bit set, per the RFC's
 *    own guidance for when no real MAC address is available) — same
 *    "actually correct, not just visually matching" bar as the rest of this
 *    build (e.g. AgeCalculatorTool's real leap-year-aware math). Doesn't
 *    change anything visible.
 *  - Stitch's inline script auto-generates 5 UUIDs on page load. Not
 *    reproduced: doing that here means either calling a browser-only random
 *    API during render (server and client would render different text into
 *    the output, and React 19 does not silently paper over a mismatch
 *    inside a controlled `<textarea>`'s value), or calling it from a
 *    `useEffect`, which the project's `react-hooks/set-state-in-effect`
 *    lint rule flags as an anti-pattern (an Effect that only exists to set
 *    state once on mount, with nothing to actually synchronize against).
 *    Starts empty with a "Click Generate" placeholder instead — the same
 *    click-to-generate convention every other generator on this site
 *    already uses (PasswordGeneratorTool, RandomNumberGeneratorTool).
 */

type UuidVersion = "v4" | "v1";

const VERSION_OPTIONS: { value: UuidVersion; label: string }[] = [
  { value: "v4", label: "Version 4 (Random)" },
  { value: "v1", label: "Version 1 (Time)" },
];

const FAQ_ITEMS = [
  {
    question: "v1 vs v4: Which should I use?",
    answer:
      "v4 is generated randomly and is best for most applications. v1 uses the current time and computer's MAC address, making it useful if you need chronological sorting, but less secure for sensitive IDs.",
  },
  {
    question: "Are these UUIDs truly unique?",
    answer:
      "For v4, the probability of a collision (generating the same UUID twice) is astronomically low. You would need to generate 1 billion UUIDs per second for 85 years to have a 50% chance of a collision.",
  },
];

// BigInt *literals* (e.g. `10000n`) require an ES2020+ compile target; this
// project targets ES2017, so every BigInt below is built via the `BigInt()`
// function instead — functionally identical, just no `n` suffix.

/** 100-nanosecond intervals between the Gregorian epoch (1582-10-15) and the Unix epoch (1970-01-01). */
const GREGORIAN_TO_UNIX_100NS = BigInt("122192928000000000");

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** A real RFC 4122 version 1 (time-based) UUID — see the file-level comment for why. */
function generateUuidV1(): string {
  const timestamp100ns = BigInt(Date.now()) * BigInt(10000) + GREGORIAN_TO_UNIX_100NS;

  const timeLow = (timestamp100ns & BigInt(0xffffffff)).toString(16).padStart(8, "0");
  const timeMid = ((timestamp100ns >> BigInt(32)) & BigInt(0xffff)).toString(16).padStart(4, "0");
  const timeHiAndVersion = (((timestamp100ns >> BigInt(48)) & BigInt(0x0fff)) | BigInt(0x1000))
    .toString(16)
    .padStart(4, "0");

  const clockSeqBytes = randomBytes(2);
  const clockSeq = (((clockSeqBytes[0] << 8) | clockSeqBytes[1]) & 0x3fff) | 0x8000; // variant bits
  const clockSeqHex = clockSeq.toString(16).padStart(4, "0");

  const nodeBytes = randomBytes(6);
  nodeBytes[0] |= 0x01; // multicast bit set — signals "random, not a real MAC" per RFC 4122
  const node = toHex(nodeBytes);

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeqHex}-${node}`;
}

function formatUuid(uuid: string, uppercase: boolean, includeDashes: boolean): string {
  const value = includeDashes ? uuid : uuid.replace(/-/g, "");
  return uppercase ? value.toUpperCase() : value;
}

function generateUuids(version: UuidVersion, count: number, uppercase: boolean, includeDashes: boolean): string[] {
  const makeOne = version === "v4" ? () => crypto.randomUUID() : generateUuidV1;
  return Array.from({ length: count }, () => formatUuid(makeOne(), uppercase, includeDashes));
}

const RANGE_THUMB_CLASSES =
  "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary " +
  "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer " +
  "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary";

function OptionCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
          checked ? "border-primary bg-primary" : "border-border bg-card",
        )}
      >
        {checked && <MaterialIcon name="check" className="text-[16px] text-primary-foreground" />}
      </span>
      <span className="text-body-md text-foreground transition-colors group-hover:text-primary">{label}</span>
    </label>
  );
}

export function UuidGeneratorTool() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [quantity, setQuantity] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [includeDashes, setIncludeDashes] = useState(true);
  const [uuids, setUuids] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    setUuids(generateUuids(version, quantity, uppercase, includeDashes));
    setCopied(false);
  }

  async function handleCopy() {
    if (!uuids.length) return;
    await navigator.clipboard.writeText(uuids.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!uuids.length) return;
    const blob = new Blob([uuids.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "uuids.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <header className="mb-12 text-center md:text-left">
        <div className="flex justify-center md:justify-start">
          <ToolBreadcrumb tool={tool} />
        </div>
        <h1 className="mt-4 mb-4 text-headline-lg text-foreground">UUID Generator</h1>
        <p className="max-w-2xl text-body-lg text-muted-foreground">
          Quickly generate secure, random Universally Unique Identifiers (UUIDs) for your development projects.
          Supports v1 and v4 formats.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Tool Panel */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="rounded-md border border-border-subtle bg-card p-6 shadow-sm">
            <h2 className="mb-6 border-b border-accent pb-4 text-headline-md text-foreground">Configuration</h2>
            <div className="flex flex-col gap-6">
              {/* Version Selector */}
              <div>
                <span className="mb-2 block text-label-sm text-muted-foreground">Version</span>
                <div className="grid grid-cols-2 gap-2">
                  {VERSION_OPTIONS.map((option) => {
                    const active = version === option.value;
                    return (
                      <label key={option.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="uuid_version"
                          className="sr-only"
                          checked={active}
                          onChange={() => setVersion(option.value)}
                        />
                        <span
                          className={cn(
                            "block rounded-sm border px-4 py-2 text-center text-body-md transition-colors",
                            active
                              ? "border-primary-container bg-primary-container text-primary-foreground"
                              : "border-border-subtle text-foreground hover:bg-surface-low",
                          )}
                        >
                          {option.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Slider */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-label-sm text-muted-foreground">Number of UUIDs</span>
                  <span className="font-mono text-sm font-medium text-primary">{quantity}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className={cn(
                    "h-1 w-full cursor-pointer appearance-none rounded-full bg-border",
                    RANGE_THUMB_CLASSES,
                  )}
                />
              </div>

              {/* Formatting Options */}
              <div className="flex flex-col gap-3">
                <span className="mb-1 block text-label-sm text-muted-foreground">Formatting</span>
                <OptionCheckbox label="Uppercase" checked={uppercase} onChange={setUppercase} />
                <OptionCheckbox label="Include Dashes" checked={includeDashes} onChange={setIncludeDashes} />
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={handleGenerate}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-primary py-3 text-label-sm text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <MaterialIcon name="autorenew" />
                Generate UUIDs
              </button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="flex h-full min-h-[400px] flex-col rounded-md border border-border-subtle bg-card shadow-sm">
            <div className="flex items-center justify-between rounded-t-md border-b border-accent bg-surface-low p-4">
              <h2 className="flex items-center gap-2 text-label-sm text-muted-foreground">
                <MaterialIcon name="terminal" className="text-[18px]" />
                Output
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-card px-3 py-1.5 text-label-sm text-foreground transition-colors hover:bg-surface-low"
                >
                  <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[16px]" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-sm border border-border-subtle bg-card px-3 py-1.5 text-label-sm text-foreground transition-colors hover:bg-surface-low"
                >
                  <MaterialIcon name="download" className="text-[16px]" />
                  Save
                </button>
              </div>
            </div>
            {/* Fixed dark terminal pane regardless of site theme — same call
                as JsonFormatterTool's output pane (bg-[#313030]/bg-[#222]),
                matching Stitch's own bg-[#111] literally. */}
            <div className="relative flex-grow overflow-hidden rounded-b-md bg-[#111]">
              <textarea
                readOnly
                value={uuids.join("\n")}
                placeholder="Click Generate UUIDs to create your list."
                className="absolute inset-0 h-full w-full resize-none border-none bg-transparent p-6 font-mono text-sm text-gray-300 placeholder:text-gray-500 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEO Content Sections */}
      <div className="mt-24 grid grid-cols-1 gap-12 border-t border-border-subtle pt-16 md:grid-cols-3">
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-headline-md text-foreground">
            <MaterialIcon name="help" className="text-primary" />
            What is a UUID?
          </h3>
          <p className="mb-4 text-body-md text-muted-foreground">
            A Universally Unique Identifier (UUID) is a 128-bit number used to uniquely identify information in
            computer systems. They are widely used for generating random IDs for databases, session tokens, and
            transaction identifiers without requiring a central authority to ensure uniqueness.
          </p>
          <p className="text-body-md text-muted-foreground">
            The standard string representation contains 32 hexadecimal digits displayed in five groups separated by
            hyphens (8-4-4-4-12).
          </p>
        </section>

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-headline-md text-foreground">
            <MaterialIcon name="school" className="text-primary" />
            How to use
          </h3>
          <ol className="list-inside list-decimal space-y-3 text-body-md text-muted-foreground">
            <li>Select your preferred UUID version (v4 is recommended for most use cases as it is purely random).</li>
            <li>Choose how many UUIDs you need (up to 50 at a time).</li>
            <li>Toggle uppercase letters or remove dashes if your system requires a specific format.</li>
            <li>Click &apos;Generate&apos; to create the list.</li>
            <li>Use the &apos;Copy&apos; button to copy all to clipboard, or &apos;Save&apos; to download as a text file.</li>
          </ol>
        </section>

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-headline-md text-foreground">
            <MaterialIcon name="forum" className="text-primary" />
            FAQ
          </h3>
          <div className="flex flex-col gap-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question}>
                <h4 className="mb-1 text-label-sm font-bold text-foreground">{item.question}</h4>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
