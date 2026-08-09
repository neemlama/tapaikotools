"use client";

import QRCode from "qrcode";
import { Suspense, useState, useSyncExternalStore, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { MaterialIcon } from "@/components/ui/material-icon";

/**
 * Hand-transcribed from the Stitch "URL Shortener" HTML export the user
 * pasted directly (Phase 4, see docs/PLAN.md #10) — centered no-breadcrumb
 * header (mobile `headline-lg`, desktop `display` size — bigger than every
 * other tool's header, split into two responsive `<h1>`s below since no
 * existing utility spans exactly that pairing), a bordered shortener card,
 * and a Recent History table + 2-card info panel instead of ToolPageShell's
 * standard wrapper. `layout: "custom"` in the registry.
 *
 * Two things intentionally NOT copied from the mockup:
 *  - Its TopNavBar (Finance/Unit Converter/Health/Developer nav + "Sign In"
 *    button) is the same per-tool-screen AI-generation drift already
 *    flagged and rejected project-wide (see docs/PLAN.md #2 — Home's nav
 *    was adopted as canonical everywhere). Renders under the real site
 *    Header/Footer via RootLayout, same as every other tool.
 *  - `hover:bg-surface-tint` / `hover:bg-primary-container` on the primary
 *    buttons — this project's `primary-container` is a distinct, brighter
 *    "fill" role (see globals.css), not a hover state; every primary
 *    button on this site already hovers to `primary-hover` instead
 *    (RandomNumberGeneratorTool made the same call for its own one-off
 *    `surface-tint` hover value).
 *
 * This is a REAL backend, not a mockup: `POST /api/shorten` validates and
 * stores the mapping in Upstash Redis (rate-limited per IP — see
 * lib/rate-limit.ts), and `/s/[code]` (lib/url-shortener.ts) issues the
 * actual 301 redirect. "Recent History" is a per-browser localStorage list
 * of links *this browser* created (read via `useSyncExternalStore`, the
 * React-idiomatic way to read an external store without the
 * `react-hooks/set-state-in-effect` footgun a mount-effect load would hit —
 * same lint constraint noted in UuidGeneratorTool/RandomNumberGeneratorTool)
 * — there's no accounts/auth anywhere on this site, so it can't be a real
 * per-user server-side history. The redirect itself works for anyone who
 * has the link, regardless of which browser created it — only the
 * "history" convenience list is local.
 */

interface HistoryEntry {
  code: string;
  longUrl: string;
  shortUrl: string;
  createdAt: number;
}

const HISTORY_KEY = "dailytools:url-shortener:history";
const MAX_HISTORY = 20;
const EMPTY_HISTORY: HistoryEntry[] = [];

const historyListeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSnapshot: HistoryEntry[] = EMPTY_HISTORY;

function readHistorySnapshot(): HistoryEntry[] {
  if (typeof window === "undefined") return EMPTY_HISTORY;
  const raw = window.localStorage.getItem(HISTORY_KEY);
  // useSyncExternalStore requires a stable reference when nothing changed —
  // re-parsing on every call would return a new array each time and loop.
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  try {
    cachedSnapshot = raw ? (JSON.parse(raw) as HistoryEntry[]) : EMPTY_HISTORY;
  } catch {
    cachedSnapshot = EMPTY_HISTORY;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): HistoryEntry[] {
  return EMPTY_HISTORY;
}

function subscribeToHistory(onChange: () => void): () => void {
  historyListeners.add(onChange);
  // Cross-tab updates; same-tab writes notify listeners directly (see writeHistory).
  window.addEventListener("storage", onChange);
  return () => {
    historyListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeHistory(entries: HistoryEntry[]): void {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  cachedRaw = undefined; // force re-read on next snapshot
  historyListeners.forEach((listener) => listener());
}

function useUrlShortenerHistory() {
  const history = useSyncExternalStore(subscribeToHistory, readHistorySnapshot, getServerSnapshot);
  return {
    history,
    addEntry(entry: HistoryEntry) {
      writeHistory([entry, ...history].slice(0, MAX_HISTORY));
    },
    clear() {
      writeHistory([]);
    },
  };
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

/**
 * Surfaces the `?notfound=1` / `?error=1` query params `/s/[code]`
 * (route.ts) redirects back with when a short code doesn't resolve —
 * otherwise a dead/expired link silently dumps someone on this page with
 * zero explanation. `useSearchParams()` requires a Suspense boundary
 * around whatever reads it (Next.js's own documented pattern) to keep the
 * rest of this page eligible for static prerendering — see where this is
 * used below.
 */
function RedirectNotice() {
  const searchParams = useSearchParams();
  const notFound = searchParams.get("notfound") === "1";
  const hadError = searchParams.get("error") === "1";
  if (!notFound && !hadError) return null;

  return (
    <p role="alert" className="mx-auto max-w-2xl text-center text-body-md text-destructive">
      {notFound
        ? "That short link doesn't exist — it may have been mistyped or never created."
        : "Something went wrong resolving that link. Please try again in a moment."}
    </p>
  );
}

export function UrlShortenerTool() {
  const [longUrlInput, setLongUrlInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; shortUrl: string } | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedHistoryCode, setCopiedHistoryCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const { history, addEntry, clear } = useUrlShortenerHistory();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = longUrlInput.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);
    setResult(null);
    setShowQr(false);
    setQrDataUrl("");

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await response.json()) as { code?: string; shortUrl?: string; error?: string };
      if (!response.ok || !data.code || !data.shortUrl) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult({ code: data.code, shortUrl: data.shortUrl });
      addEntry({ code: data.code, longUrl: trimmed, shortUrl: data.shortUrl, createdAt: Date.now() });
    } catch {
      setError("Network error — please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shortUrl);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 1500);
  }

  async function handleCopyHistoryEntry(entry: HistoryEntry) {
    await navigator.clipboard.writeText(entry.shortUrl);
    setCopiedHistoryCode(entry.code);
    setTimeout(() => setCopiedHistoryCode(null), 1500);
  }

  async function handleToggleQr() {
    if (!result) return;
    if (showQr) {
      setShowQr(false);
      return;
    }
    if (!qrDataUrl) {
      const dataUrl = await QRCode.toDataURL(result.shortUrl, { width: 240, margin: 1 });
      setQrDataUrl(dataUrl);
    }
    setShowQr(true);
  }

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-4 py-12 md:px-10 md:py-16">
      {/* Header */}
      <header className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
        <h1 className="text-headline-lg text-foreground md:hidden">URL Shortener</h1>
        <h1 className="hidden text-display text-foreground md:block">URL Shortener</h1>
        <p className="text-body-lg text-muted-foreground">
          Create short, manageable links instantly. Perfect for sharing on social media, emails, or SMS.
        </p>
      </header>

      <Suspense fallback={null}>
        <RedirectNotice />
      </Suspense>

      {/* Shortener Tool Area */}
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-md border border-border bg-card p-6 shadow-sm md:p-8">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 md:flex-row">
          <div className="relative flex-grow">
            <MaterialIcon
              name="link"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="url"
              required
              value={longUrlInput}
              onChange={(event) => setLongUrlInput(event.target.value)}
              placeholder="Enter Long URL here..."
              className="w-full rounded-md border border-border bg-input py-4 pr-4 pl-12 text-body-lg text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="group flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-headline-md whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? "Shortening…" : "Shorten"}
            <MaterialIcon name="arrow_forward" className="transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        {error && (
          <p role="alert" className="text-body-md text-destructive">
            {error}
          </p>
        )}

        {result && (
          <div className="flex flex-col gap-6 border-t border-border pt-6">
            <div className="flex flex-col items-start justify-between gap-4 rounded-md border border-border bg-surface-low p-4 md:flex-row md:items-center">
              <div className="flex w-full flex-col gap-1 overflow-hidden">
                <span className="text-label-sm text-muted-foreground uppercase tracking-wider">Shortened URL</span>
                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-mono text-sm text-primary hover:underline"
                >
                  {stripProtocol(result.shortUrl)}
                </a>
              </div>
              <div className="flex w-full items-center gap-2 md:w-auto">
                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-body-md text-foreground transition-colors hover:bg-surface-low md:flex-none"
                >
                  <MaterialIcon name={copiedResult ? "check" : "content_copy"} className="text-[18px]" />
                  {copiedResult ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={handleToggleQr}
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm border border-border bg-card px-4 py-2 text-body-md text-foreground transition-colors hover:bg-surface-low md:flex-none"
                >
                  <MaterialIcon name="qr_code_2" className="text-[18px]" />
                  QR Code
                </button>
              </div>
            </div>

            {showQr && qrDataUrl && (
              <div className="flex justify-center">
                {/* Locally generated data URL, not a remote/static asset — next/image adds no benefit here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${result.shortUrl}`}
                  className="h-40 w-40 rounded-sm border border-border bg-white p-2"
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* History & Info Grid */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent History */}
        <div className="flex flex-col rounded-md border border-border bg-card shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border p-6">
            <h2 className="flex items-center gap-2 text-headline-md text-foreground">
              <MaterialIcon name="history" className="text-primary" />
              Recent History
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="text-label-sm text-muted-foreground uppercase tracking-wider transition-colors hover:text-primary"
              >
                Clear
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="p-6 text-body-md text-muted-foreground">Links you shorten will show up here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-surface-low text-label-sm text-muted-foreground uppercase tracking-wider">
                    <th className="border-b border-border p-4 font-medium">Original URL</th>
                    <th className="w-48 border-b border-border p-4 font-medium">Short URL</th>
                    <th className="w-24 border-b border-border p-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-body-md">
                  {history.map((entry) => (
                    <tr key={entry.code} className="group transition-colors hover:bg-surface-low">
                      <td
                        className="max-w-[200px] truncate border-b border-border p-4 text-foreground"
                        title={entry.longUrl}
                      >
                        {entry.longUrl}
                      </td>
                      <td className="border-b border-border p-4 font-mono text-sm text-primary">
                        <a href={entry.shortUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          {stripProtocol(entry.shortUrl)}
                        </a>
                      </td>
                      <td className="border-b border-border p-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleCopyHistoryEntry(entry)}
                          title="Copy"
                          className="p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary"
                        >
                          <MaterialIcon
                            name={copiedHistoryCode === entry.code ? "check" : "content_copy"}
                            className="text-[18px]"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-border bg-surface-low p-6">
            <h3 className="mb-3 flex items-center gap-2 text-headline-md text-foreground">
              <MaterialIcon name="help" className="text-secondary" />
              Why use a URL shortener?
            </h3>
            <p className="text-body-md text-muted-foreground">
              Long URLs can look messy and take up valuable character space, especially on platforms like Twitter or
              in SMS messages. A shortener creates a clean, manageable link that redirects to your original
              destination, improving aesthetics and click-through rates.
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface-low p-6">
            <h3 className="mb-3 flex items-center gap-2 text-headline-md text-foreground">
              <MaterialIcon name="security" className="text-secondary" />
              Is it safe?
            </h3>
            <p className="text-body-md text-muted-foreground">
              Yes. DailyTools URL Shortener uses standard HTTP 301 redirects. We do not inject ads or trackers into
              the redirection process. Your links simply point directly where you intend them to go.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
