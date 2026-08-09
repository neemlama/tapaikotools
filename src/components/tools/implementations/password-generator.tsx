"use client";

import { useEffect, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import { secureRandomInt } from "@/lib/random";
import { getToolBySlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed from the Stitch "Random Password Generator" screen —
 * `layout: "custom"` in the registry (see ToolPageShell) because this
 * design has its own header, its own "Tips"/"Why Use a Generator?" content
 * instead of a generic About/FAQ, and no related-tools section. Stitch's
 * own design also omitted a breadcrumb, added back the same way as CGPA
 * Calculator's (see ToolBreadcrumb) since that was asked for afterwards.
 */

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const SIMILAR = new Set("il1Lo0O".split(""));

function stripSimilar(pool: string) {
  return pool
    .split("")
    .filter((char) => !SIMILAR.has(char))
    .join("");
}

/** Guarantees at least one character from each selected pool (when length allows), then shuffles. */
function generatePassword(pools: string[], length: number): string {
  const cleanPools = pools.filter((pool) => pool.length > 0);
  if (cleanPools.length === 0) return "";

  const combined = cleanPools.join("");
  const chars: string[] = [];

  if (length >= cleanPools.length) {
    for (const pool of cleanPools) chars.push(pool[secureRandomInt(pool.length)]);
  }
  while (chars.length < length) chars.push(combined[secureRandomInt(combined.length)]);

  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

const tool = getToolBySlug("password-generator")!;

const TIPS = [
  {
    icon: "straighten",
    title: "Length is Key",
    body: "The longer your password, the harder it is to crack. Aim for at least 16 characters for critical accounts.",
  },
  {
    icon: "shuffle",
    title: "Mix it Up",
    body: "Use a combination of uppercase, lowercase, numbers, and symbols to maximize entropy.",
  },
  {
    icon: "key_off",
    title: "Never Reuse",
    body: "Using the same password across multiple sites means one breach compromises everything.",
  },
] as const;

// Corrected 2026-08-09 (Phase B contrast audit): Medium/Strong used
// one-off hex values that never went through any contrast check — Medium
// was 1.79:1 against its own badge background in light mode (essentially
// unreadable), Strong failed in both themes. `--warning`/`--success`
// (globals.css) exist for exactly this ("the password strength meter's
// Weak/Medium/Strong states" per that token's own comment) and are
// verified to clear 4.5:1 as text in both themes — routing through them
// instead of inventing separate hex values.
const STRENGTH_STYLES = {
  Weak: "border-destructive/20 bg-destructive/10 text-destructive",
  Medium: "border-warning/20 bg-warning/10 text-warning",
  Strong: "border-success/20 bg-success/10 text-success",
} as const;

const SEGMENT_COLORS = ["bg-destructive", "bg-warning", "bg-success", "bg-success"] as const;

export function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const pools = (() => {
    const selected = [
      useUpper && UPPER,
      useLower && LOWER,
      useNumbers && NUMBERS,
      useSymbols && SYMBOLS,
    ].filter((pool): pool is string => Boolean(pool));
    return excludeSimilar ? selected.map(stripSimilar) : selected;
  })();
  const canGenerate = pools.some((pool) => pool.length > 0);

  function handleGenerate() {
    if (!canGenerate) return;
    setPassword(generatePassword(pools, length));
    setCopied(false);
  }

  // Fills the display with a real password on first load instead of an
  // empty box, matching Stitch's always-filled mockup. Deliberately a
  // mount-only effect rather than a lazy useState initializer: this needs
  // to run client-only (a build-time SSG pass would otherwise bake one
  // fixed "random" password into the static HTML for every visitor), so
  // the one-frame empty-then-filled flash after hydration is the correct
  // tradeoff here, not a bug the lint rule should block.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPassword(generatePassword([UPPER, LOWER, NUMBERS, SYMBOLS], 16));
  }, []);

  async function handleCopy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // The four checks Stitch's strength meter calls out explicitly, in its
  // exact order — not an invented entropy formula.
  const criteria = [
    { label: "Length > 12", met: password.length > 12 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Numbers", met: /[0-9]/.test(password) },
    { label: "Symbols", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = criteria.filter((c) => c.met).length;
  const strength: "Weak" | "Medium" | "Strong" = metCount <= 1 ? "Weak" : metCount <= 3 ? "Medium" : "Strong";

  return (
    <div className="w-full py-12 md:py-24">
      {/* Breadcrumb — left-aligned regardless of viewport, unlike the
          header below it, since breadcrumbs read left-to-right */}
      <div className="mx-auto mb-6 max-w-[1200px] px-4 md:px-10">
        <ToolBreadcrumb tool={tool} />
      </div>

      <div className="mx-auto max-w-[1200px] px-4 md:px-10">
        {/* Header */}
        <div className="mb-12 max-w-2xl text-center md:text-left">
          <h1 className="text-display text-foreground mb-4">Random Password Generator</h1>
          <p className="text-body-lg text-muted-foreground">
            Generate strong, secure, and customizable passwords instantly to keep your accounts safe.
          </p>
        </div>

        {/* Tool layout (bento grid) */}
        <div className="mb-24 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left column: options */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
              <h2 className="mb-6 border-b border-border-subtle pb-4 text-headline-md text-foreground">
                Configuration
              </h2>

              {/* Length slider */}
              <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <label htmlFor="password-length" className="text-label-sm text-muted-foreground uppercase tracking-wider">
                    Password Length
                  </label>
                  <span className="rounded bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
                    {length}
                  </span>
                </div>
                <input
                  id="password-length"
                  type="range"
                  min={8}
                  max={128}
                  value={length}
                  onChange={(event) => setLength(Number(event.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Checkboxes */}
              <div className="mb-8 flex flex-grow flex-col gap-4">
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={useUpper}
                    onChange={(event) => setUseUpper(event.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-body-md text-foreground transition-colors group-hover:text-primary">
                    Uppercase Letters (A-Z)
                  </span>
                </label>
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={useLower}
                    onChange={(event) => setUseLower(event.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-body-md text-foreground transition-colors group-hover:text-primary">
                    Lowercase Letters (a-z)
                  </span>
                </label>
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={useNumbers}
                    onChange={(event) => setUseNumbers(event.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-body-md text-foreground transition-colors group-hover:text-primary">
                    Numbers (0-9)
                  </span>
                </label>
                <label className="group flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={useSymbols}
                    onChange={(event) => setUseSymbols(event.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-body-md text-foreground transition-colors group-hover:text-primary">
                    Symbols (!@#$...)
                  </span>
                </label>
                <div className="border-t border-border-subtle pt-4">
                  <label className="group flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={excludeSimilar}
                      onChange={(event) => setExcludeSimilar(event.target.checked)}
                      className="h-5 w-5 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-body-md text-foreground transition-colors group-hover:text-primary">
                      Exclude Similar Characters (i, l, 1, L, o, 0, O)
                    </span>
                  </label>
                </div>
              </div>

              {!canGenerate && (
                <p role="alert" className="text-body-md text-destructive">
                  Select at least one character type.
                </p>
              )}
            </div>
          </div>

          {/* Right column: output & strength */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            {/* Output card */}
            <div className="group relative flex flex-col justify-center overflow-hidden rounded-lg border border-border bg-card p-6 md:p-8">
              <div className="pointer-events-none absolute inset-0 bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-[0.02]" />
              <div className="mb-2 flex items-start justify-between">
                <span className="text-label-sm text-muted-foreground uppercase tracking-wider">
                  Generated Password
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    title="Regenerate"
                    aria-label="Regenerate"
                    className="rounded border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-border-subtle hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                  >
                    <MaterialIcon name="refresh" className="text-[20px]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!password}
                    title="Copy to clipboard"
                    aria-label="Copy to clipboard"
                    className="rounded border border-border bg-background p-2 text-muted-foreground transition-colors hover:bg-border-subtle hover:text-primary disabled:pointer-events-none disabled:opacity-50"
                  >
                    <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[20px]" />
                  </button>
                </div>
              </div>
              <div className="relative mb-6 flex min-h-[120px] w-full items-center justify-center rounded-lg bg-[#111] p-6">
                <div className="text-center font-mono text-[24px] leading-tight break-all text-white selection:bg-primary-button selection:text-white md:text-[32px]">
                  {password || " "}
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="flex w-full items-center justify-center gap-2 rounded bg-primary-button px-6 py-4 text-body-lg font-medium text-primary-foreground transition-all duration-200 hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-50"
              >
                <MaterialIcon name="generating_tokens" filled />
                Generate New Password
              </button>
            </div>

            {/* Strength meter card */}
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-headline-md text-foreground">Password Strength</h3>
                <span
                  className={cn(
                    "rounded border px-3 py-1 text-label-sm font-bold uppercase tracking-wide",
                    STRENGTH_STYLES[strength],
                  )}
                >
                  {strength}
                </span>
              </div>
              <div className="mb-6 flex h-3 w-full gap-2 overflow-hidden rounded-full bg-muted">
                {SEGMENT_COLORS.map((color, index) => (
                  <div
                    key={index}
                    className={cn("h-full flex-1 transition-all duration-300", index < metCount ? color : "bg-transparent")}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {criteria.map((criterion) => (
                  <div key={criterion.label} className="flex items-center gap-2">
                    <MaterialIcon
                      name="check_circle"
                      filled={criterion.met}
                      className={cn("text-[16px]", criterion.met ? "text-success" : "text-border")}
                    />
                    <span className="text-body-md text-muted-foreground">{criterion.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEO / content section */}
        <div className="mx-auto max-w-4xl space-y-16">
          <section>
            <h2 className="mb-6 text-headline-lg text-foreground">
              Tips for a Strong Password
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {TIPS.map((tip) => (
                <div key={tip.title} className="rounded border border-border bg-muted p-6">
                  <MaterialIcon name={tip.icon} className="mb-4 block text-[32px] text-primary" />
                  <h3 className="mb-2 text-headline-md text-foreground">{tip.title}</h3>
                  <p className="text-body-md text-muted-foreground">{tip.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-border pt-16">
            <h2 className="mb-6 text-headline-lg text-foreground">
              Why Use a Generator?
            </h2>
            <p className="mb-6 text-body-lg leading-relaxed text-muted-foreground">
              Humans are predictably bad at creating random sequences. We tend to use dates, names, common
              dictionary words, or recognizable keyboard patterns (like &quot;qwerty&quot;). Attackers know this and
              use dictionaries containing millions of common passwords to force their way into accounts.
            </p>
            <p className="text-body-lg leading-relaxed text-muted-foreground">
              A cryptographic random password generator removes human bias. It selects characters from an expanded
              set with true randomness, creating passwords that are practically impossible to guess or crack
              through brute-force methods using current computing power.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
