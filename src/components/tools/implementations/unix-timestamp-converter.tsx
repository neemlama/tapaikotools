"use client";

import { useEffect, useMemo, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Select } from "@/components/ui/select";
import { getToolBySlug } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/**
 * Hand-transcribed from the Stitch "Unix Timestamp Converter" screen —
 * `layout: "custom"` in the registry (see ToolPageShell), same call as
 * CgpaCalculatorTool/AgeCalculatorTool/Base64EncoderDecoderTool: its own
 * centered display-size header, a bento-grid tool area (live clock + two
 * conversion cards) instead of the shared Panel stack, and its own "What is
 * Unix Time" / "How to use" / FAQ sections instead of ToolPageShell's
 * generic About+FAQ.
 *
 * The mockup's "Timezone" selector on each card isn't cosmetic — it changes
 * the UTC offset used in the ISO 8601 result / how the entered wall-clock
 * time is interpreted, via the two helpers below.
 *
 * Breadcrumb added after launch (2026-08-09) — see AttendanceCalculatorTool
 * for why. Wrapped in `flex justify-center` since this page's header is
 * centered (not left-aligned like most tools), and the shared
 * `ToolBreadcrumb` doesn't center itself.
 */

const tool = getToolBySlug("unix-timestamp-converter")!;

const TIMEZONES: { label: string; value: string | null }[] = [
  { label: "Local Time", value: null },
  { label: "UTC (GMT)", value: "UTC" },
  { label: "America/New_York (EST/EDT)", value: "America/New_York" },
  { label: "Europe/London (GMT/BST)", value: "Europe/London" },
];

/** Minutes to add to UTC to get wall-clock time in `timeZone` at this instant (positive east of UTC). */
function getOffsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(instant)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** ISO 8601 rendering of an absolute instant, in `timeZone` (or the browser's own zone when null) — offset suffix instead of always "Z", e.g. "2024-05-22T08:48:14-04:00". */
function formatIsoInZone(instant: Date, timeZone: string | null): string {
  const offsetMinutes = timeZone ? getOffsetMinutes(instant, timeZone) : -instant.getTimezoneOffset();
  const wallClock = new Date(instant.getTime() + offsetMinutes * 60000).toISOString().slice(0, 19);
  if (offsetMinutes === 0) return `${wallClock}Z`;
  const sign = offsetMinutes > 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${wallClock}${sign}${hh}:${mm}`;
}

/**
 * Interprets a <input type="datetime-local"> value as wall-clock time *in
 * `timeZone`* (not the browser's own zone) and returns the matching instant.
 * Two-pass offset resolution — same technique libraries like Luxon use —
 * to stay correct across most DST transitions.
 */
function zonedWallClockToInstant(datetimeLocalValue: string, timeZone: string | null): Date | null {
  // datetime-local strings parse as browser-local per spec — used here only
  // to split the string into Y/M/D/h/m/s fields, not for its instant.
  const naive = new Date(datetimeLocalValue);
  if (Number.isNaN(naive.getTime())) return null;
  if (!timeZone) return naive;

  const utcGuess = Date.UTC(
    naive.getFullYear(),
    naive.getMonth(),
    naive.getDate(),
    naive.getHours(),
    naive.getMinutes(),
    naive.getSeconds(),
  );
  const offset1 = getOffsetMinutes(new Date(utcGuess), timeZone);
  const offset2 = getOffsetMinutes(new Date(utcGuess - offset1 * 60000), timeZone);
  return new Date(utcGuess - offset2 * 60000);
}

/** >= 11 digits worth of milliseconds (year ~5138 in seconds) reads as milliseconds, otherwise seconds. */
function detectUnit(value: number): "seconds" | "milliseconds" {
  return Math.abs(value) >= 1e11 ? "milliseconds" : "seconds";
}

function CopyIconButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
      className={cn(
        "absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-sm border border-gray-300 bg-white text-black transition-colors hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[16px]" />
    </button>
  );
}

function TimezoneSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <Select
      id={id}
      value={value ?? "local"}
      onChange={(event) => onChange(event.target.value === "local" ? null : event.target.value)}
    >
      {TIMEZONES.map((tz) => (
        <option key={tz.label} value={tz.value ?? "local"}>
          {tz.label}
        </option>
      ))}
    </Select>
  );
}

const FAQ_ITEMS = [
  {
    question: "What is the Year 2038 problem?",
    answer:
      "The Year 2038 problem is an issue for computing and data storage situations in which time values are stored or calculated as a signed 32-bit integer. The latest time that can be properly represented this way is 03:14:07 UTC on 19 January 2038. After this, systems may interpret the time incorrectly. Modern systems usually use 64-bit integers to avoid this.",
  },
  {
    question: "Are leap seconds counted?",
    answer:
      "No, standard Unix time does not count leap seconds. Every day is treated as if it contains exactly 86,400 seconds. When a leap second occurs, the Unix time number is typically repeated for one second.",
  },
];

export function UnixTimestampConverterTool() {
  // Only ever set inside an effect (never during render), so the server-
  // rendered "—" placeholder can't hydration-mismatch against a client
  // value that changes every second — same reasoning as Password Generator
  // (docs/PLAN.md #4).
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);
  useEffect(() => {
    function tick() {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }
    // The first tick is deferred to a macrotask rather than called
    // synchronously here — react-hooks/set-state-in-effect flags a direct
    // setState call in the effect body itself (cascading-render risk); a
    // 0ms timeout is imperceptible and keeps every update, including the
    // first, driven from a callback instead.
    const initial = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  const [timestampInput, setTimestampInput] = useState("");
  const [timestampZone, setTimestampZone] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState("");
  const [dateZone, setDateZone] = useState<string | null>(null);

  const timestampResult = useMemo(() => {
    const trimmed = timestampInput.trim();
    if (!trimmed) return null;
    const value = Number(trimmed);
    if (!Number.isFinite(value)) return { error: "Enter a valid timestamp.", iso: null };
    const ms = detectUnit(value) === "milliseconds" ? value : value * 1000;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) return { error: "Enter a valid timestamp.", iso: null };
    return { error: null, iso: formatIsoInZone(date, timestampZone) };
  }, [timestampInput, timestampZone]);

  const dateResult = useMemo(() => {
    if (!dateInput) return null;
    const instant = zonedWallClockToInstant(dateInput, dateZone);
    if (!instant || Number.isNaN(instant.getTime())) return { error: "Enter a valid date.", seconds: null };
    return { error: null, seconds: Math.floor(instant.getTime() / 1000) };
  }, [dateInput, dateZone]);

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="mx-auto flex max-w-[1200px] flex-col gap-16 px-4 py-12 md:px-10">
      <header className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
        <div className="flex justify-center">
          <ToolBreadcrumb tool={tool} />
        </div>
        <h1 className="text-display text-foreground">Unix Timestamp Converter</h1>
        <p className="text-body-lg text-muted-foreground">
          Convert Unix timestamps to readable dates and vice versa. Real-time, accurate, and easy to use.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Real-time clock */}
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-6 text-center md:col-span-12">
          <h2 className="text-headline-md text-foreground">Current Unix Timestamp</h2>
          <div className="relative flex w-full max-w-md items-center justify-center gap-4 rounded-lg bg-[#111] p-4">
            <span className="font-mono text-2xl tracking-wider text-white">{currentTimestamp ?? "—"}</span>
            <CopyIconButton value={currentTimestamp !== null ? String(currentTimestamp) : ""} />
          </div>
          <p className="text-body-md text-muted-foreground">Seconds since Jan 01 1970. (UTC)</p>
        </div>

        {/* Unix timestamp to date */}
        <div className="flex flex-col rounded-lg border border-border bg-card md:col-span-6">
          <div className="border-b border-border p-6">
            <h2 className="flex items-center gap-2 text-headline-md text-foreground">
              <MaterialIcon name="schedule" className="text-primary" />
              Unix Timestamp to Date
            </h2>
          </div>
          <form className="flex flex-grow flex-col gap-4 p-6" onSubmit={(event) => event.preventDefault()}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timestamp-input">Enter Timestamp (Seconds or Milliseconds)</Label>
              <Input
                id="timestamp-input"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1716382094"
                value={timestampInput}
                onChange={(event) => setTimestampInput(event.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone-select-1">Timezone</Label>
              <TimezoneSelect id="timezone-select-1" value={timestampZone} onChange={setTimestampZone} />
            </div>
            <Button type="submit" className="mt-2 w-full">
              Convert to Date
            </Button>

            {timestampResult?.error && (
              <p role="alert" className="text-body-md text-destructive">
                {timestampResult.error}
              </p>
            )}

            <div className="relative mt-4 flex min-h-[80px] flex-col justify-center rounded bg-[#111] p-4">
              <div className="mb-1 text-label-sm text-gray-400">Result (ISO 8601)</div>
              <div className="font-mono break-all text-white">{timestampResult?.iso ?? "—"}</div>
              <CopyIconButton value={timestampResult?.iso ?? ""} />
            </div>
          </form>
        </div>

        {/* Date to Unix timestamp */}
        <div className="flex flex-col rounded-lg border border-border bg-card md:col-span-6">
          <div className="border-b border-border p-6">
            <h2 className="flex items-center gap-2 text-headline-md text-foreground">
              <MaterialIcon name="calendar_month" className="text-primary" />
              Date to Unix Timestamp
            </h2>
          </div>
          <form className="flex flex-grow flex-col gap-4 p-6" onSubmit={(event) => event.preventDefault()}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="date-input">Enter Date &amp; Time</Label>
              <Input
                id="date-input"
                type="datetime-local"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="timezone-select-2">Timezone</Label>
              <TimezoneSelect id="timezone-select-2" value={dateZone} onChange={setDateZone} />
            </div>
            <Button type="submit" className="mt-2 w-full">
              Convert to Timestamp
            </Button>

            {dateResult?.error && (
              <p role="alert" className="text-body-md text-destructive">
                {dateResult.error}
              </p>
            )}

            <div className="relative mt-4 flex min-h-[80px] flex-col justify-center rounded bg-[#111] p-4">
              <div className="mb-1 text-label-sm text-gray-400">Result (Seconds)</div>
              <div className="font-mono break-all text-white">{dateResult?.seconds ?? "—"}</div>
              <CopyIconButton value={typeof dateResult?.seconds === "number" ? String(dateResult.seconds) : ""} />
            </div>
          </form>
        </div>
      </section>

      {/* Informational sections (SEO) */}
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-12">
        <article>
          <h3 className="mb-4 text-headline-lg text-foreground">What is Unix Time?</h3>
          <p className="mb-4 text-body-lg text-muted-foreground">
            Unix time (also known as Epoch time, POSIX time, or Unix timestamp) is a system for describing a point
            in time. It is the number of seconds that have elapsed since the Unix epoch, excluding leap seconds.
            The Unix epoch is 00:00:00 UTC on 1 January 1970.
          </p>
          <p className="text-body-lg text-muted-foreground">
            It is widely used in Unix-like and many other operating systems and file formats. Because it is a
            single number representing a point in time regardless of timezone, it makes storing and comparing
            dates in databases and programming much simpler.
          </p>
        </article>

        <article>
          <h3 className="mb-4 text-headline-lg text-foreground">How to use this converter</h3>
          <ol className="list-decimal space-y-2 pl-5 text-body-lg text-muted-foreground">
            <li>
              <strong className="text-foreground">To convert a timestamp to a date:</strong> Paste your Unix
              timestamp (e.g., 1672531199) into the first box. Select your desired timezone, and click &quot;Convert
              to Date&quot;. The tool will automatically detect if it&apos;s in seconds or milliseconds.
            </li>
            <li>
              <strong className="text-foreground">To convert a date to a timestamp:</strong> Use the date picker in
              the second box to select a specific date and time. Choose the appropriate timezone, and click
              &quot;Convert to Timestamp&quot; to get the numerical Unix value.
            </li>
            <li>
              <strong className="text-foreground">Real-time clock:</strong> The large number at the top shows the
              current Unix timestamp updated every second. You can copy it instantly using the copy button.
            </li>
          </ol>
        </article>

        <article>
          <h3 className="mb-4 text-headline-lg text-foreground">FAQ</h3>
          <div className="flex flex-col gap-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question}>
                <h4 className="mb-2 text-headline-md text-foreground">{item.question}</h4>
                <p className="text-body-md text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
