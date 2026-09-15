"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import {
  convertCurrency,
  convertViaNrb,
  FALLBACK_RATES_USD_BASE,
  formatConverted,
  isSupportedCurrency,
  nrbRatesByCode,
  type NrbRates,
  SUPPORTED_CURRENCIES,
  unitRate,
} from "@/lib/currency";
import { getToolBySlug } from "@/lib/tools/registry";

const tool = getToolBySlug("currency-converter")!;

type RateSource = "market" | "nrb";

const SOURCES: { id: RateSource; label: string; hint: string }[] = [
  { id: "market", label: "Market rate", hint: "Live mid-market, updates daily" },
  { id: "nrb", label: "NRB official", hint: "Nepal Rastra Bank buying/selling reference" },
];

const RELATED_TOOLS: { slug: string; icon: string }[] = [
  { slug: "unit-converter", icon: "straighten" },
  { slug: "interest-calculator", icon: "savings" },
];

const QUICK_EXAMPLES = [
  { label: "100 USD → NPR", value: "≈ Rs 13,350" },
  { label: "1,000 INR → NPR", value: "≈ Rs 1,600" },
  { label: "50 EUR → USD", value: "≈ $54" },
];

interface ErApiResponse {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
}

export function CurrencyConverterTool() {
  const [amountInput, setAmountInput] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NPR");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES_USD_BASE);
  const [ratesSource, setRatesSource] = useState<"live" | "fallback">("fallback");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [source, setSource] = useState<RateSource>("market");
  const [nrb, setNrb] = useState<NrbRates | null>(null);
  const [nrbLoading, setNrbLoading] = useState(false);
  const [nrbError, setNrbError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadLiveRates() {
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ErApiResponse;
        if (data.result !== "success" || !data.rates) throw new Error("bad payload");
        const filtered: Record<string, number> = { USD: 1 };
        for (const c of SUPPORTED_CURRENCIES) {
          const r = data.rates[c.code];
          if (Number.isFinite(r) && (r as number) > 0) filtered[c.code] = r as number;
        }
        if (!cancelled && Number.isFinite(filtered[to]) && Number.isFinite(filtered[from])) {
          setRates(filtered);
          setRatesSource("live");
          setUpdatedAt(data.time_last_update_utc ?? new Date().toUTCString());
        }
      } catch {
        // Keep the clearly-labeled offline fallback — no crash, no silent stale quote.
        if (!cancelled) setRatesSource("fallback");
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    }
    loadLiveRates();
    return () => {
      cancelled = true;
    };
    // Fetch once on mount; conversions re-derive from state below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amount = Number.parseFloat(amountInput);
  const amountValid = Number.isFinite(amount) && amount >= 0 && amountInput.trim() !== "";
  const nrbMap = nrb ? nrbRatesByCode(nrb) : null;
  const usingNrb = source === "nrb" && nrbMap !== null;
  const result = !amountValid
    ? NaN
    : usingNrb
      ? convertViaNrb(amount, from, to, nrbMap)
      : convertCurrency(amount, from, to, rates);
  const rate = usingNrb
    ? convertViaNrb(1, from, to, nrbMap)
    : unitRate(from, to, rates);

  function handleSourceChange(next: RateSource) {
    setSource(next);
    if (next === "nrb" && !nrb && !nrbLoading) {
      setNrbLoading(true);
      setNrbError(null);
      fetch("/api/nrb-rates")
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data: NrbRates) => {
          if (!data || typeof data.date !== "string" || !Array.isArray(data.rates)) {
            throw new Error("bad payload");
          }
          setNrb(data);
        })
        .catch(() => {
          setNrbError("Could not load NRB rates — showing market rates instead.");
        })
        .finally(() => {
          setNrbLoading(false);
        });
    }
  }

  function handleSwap() {
    setFrom(to);
    setTo(from);
  }

  function handleReset() {
    setAmountInput("100");
    setFrom("USD");
    setTo("NPR");
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Currency Converter — TapaikoTools",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Free online currency converter with live exchange rates: USD, EUR, NPR, INR, GBP and more — instant and private.",
    featureList: [
      "Live exchange rates with offline fallback",
      "Nepal Rastra Bank official buying/selling reference",
      "USD, EUR, GBP, INR, NPR, JPY and 6 more currencies",
      "One-tap currency swap",
      "100% client-side — no account needed",
    ],
    url: "https://tapaikotools.neemlama.com.np/tools/currency-converter",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Where do the exchange rates come from?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Live rates are fetched from open.er-api.com. If the network fails, the tool falls back to clearly-labeled approximate offline rates.",
        },
      },
      {
        "@type": "Question",
        name: "How is the conversion calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "All rates are quoted against USD, so the result is amount divided by the source rate times the target rate.",
        },
      },
      {
        "@type": "Question",
        name: "What is the NRB official rate?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nepal Rastra Bank publishes daily buying and selling reference rates against the Nepalese Rupee. This tool converts at the mid of each pair and shows the underlying buy/sell so the spread stays visible.",
        },
      },
      {
        "@type": "Question",
        name: "Is my conversion data sent to a server?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Conversion happens in your browser; only the public rate-table request leaves your device.",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mb-8 flex flex-col gap-4">
        <ToolBreadcrumb tool={tool} />
        <div>
          <h1 className="mb-2 text-headline-lg">Currency Converter</h1>
          <p className="max-w-2xl text-body-lg text-muted-foreground">
            Convert between 12 currencies with live rates — USD, NPR, INR, EUR and more. Free, instant,
            private.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4" role="group" aria-label="Rate source">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSourceChange(s.id)}
                  aria-pressed={source === s.id}
                  title={s.hint}
                  className={
                    source === s.id
                      ? "rounded bg-primary px-3 py-1.5 text-label-sm text-primary-foreground"
                      : "rounded border border-border px-3 py-1.5 text-label-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-label-sm">
              {source === "nrb" ? (
                nrbLoading ? (
                  <span className="text-muted-foreground">Loading NRB official rates…</span>
                ) : nrb ? (
                  <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-400">
                    NRB official · published {nrb.date} · mid of buy/sell
                  </span>
                ) : (
                  <span className="rounded bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-400">
                    {nrbError ?? "NRB rates unavailable"}
                  </span>
                )
              ) : ratesLoading ? (
                <span className="text-muted-foreground">Fetching live rates…</span>
              ) : ratesSource === "live" ? (
                <span className="rounded bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-400">
                  Live market rates{updatedAt ? ` · updated ${updatedAt}` : ""}
                </span>
              ) : (
                <span className="rounded bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-400">
                  Offline fallback rates — approximate, connect to refresh
                </span>
              )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div>
                <label htmlFor="ccAmount" className="mb-2 block text-label-sm">
                  Amount
                </label>
                <input
                  id="ccAmount"
                  type="number"
                  min="0"
                  placeholder="e.g. 100"
                  value={amountInput}
                  onChange={(event) => setAmountInput(event.target.value)}
                  className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex items-end justify-center pb-1">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap currencies"
                  aria-label="Swap from and to currencies"
                  className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <MaterialIcon name="swap_horiz" className="text-[20px]" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-1 md:grid-cols-1 lg:grid-cols-1">
                <div>
                  <label htmlFor="ccFrom" className="mb-2 block text-label-sm">
                    From
                  </label>
                  <select
                    id="ccFrom"
                    value={from}
                    onChange={(event) => {
                      if (isSupportedCurrency(event.target.value)) setFrom(event.target.value);
                    }}
                    className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ccTo" className="mb-2 block text-label-sm">
                    To
                  </label>
                  <select
                    id="ccTo"
                    value={to}
                    onChange={(event) => {
                      if (isSupportedCurrency(event.target.value)) setTo(event.target.value);
                    }}
                    className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded border border-border bg-card px-6 py-3 text-body-md text-foreground transition-colors hover:bg-muted md:w-auto"
              >
                Reset
              </button>
            </div>

            {!amountValid ? (
              <p role="alert" className="mt-4 text-body-md text-destructive">
                Please enter a valid amount (0 or more).
              </p>
            ) : (
              <div className="mt-8 border-t border-border pt-8" role="status" aria-live="polite">
                <div className="rounded border border-border bg-muted p-6 text-center">
                  <span className="mb-2 block text-label-sm tracking-wider text-muted-foreground uppercase">
                    Result
                  </span>
                  <span className="block text-display text-primary">
                    {formatConverted(result, to)}
                  </span>
                  <span className="mt-2 block text-body-md text-muted-foreground">
                    {amountInput} {from} = {formatConverted(result, to)} · 1 {from} ={" "}
                    {Number.isFinite(rate)
                      ? rate.toLocaleString(undefined, { maximumFractionDigits: 4 })
                      : "—"}{" "}
                    {to}
                  </span>
                </div>
              </div>
            )}

            {usingNrb && nrbMap && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-body-md">
                  <caption className="mb-2 text-left text-label-sm text-muted-foreground">
                    NRB reference for the selected pair (NPR per unit)
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-left text-label-sm text-muted-foreground">
                      <th scope="col" className="py-2 pr-4 font-medium">Currency</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Unit</th>
                      <th scope="col" className="py-2 pr-4 font-medium">Buy</th>
                      <th scope="col" className="py-2 font-medium">Sell</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[from, to]
                      .filter((code, i, arr) => arr.indexOf(code) === i)
                      .map((code) =>
                        code === "NPR" ? (
                          <tr key={code} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 font-medium">NPR — Nepalese Rupee</td>
                            <td className="py-2 pr-4 text-muted-foreground" colSpan={3}>
                              base currency
                            </td>
                          </tr>
                        ) : (
                          <tr key={code} className="border-b border-border last:border-0">
                            <td className="py-2 pr-4 font-medium">{code}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{nrbMap[code]?.unit ?? "—"}</td>
                            <td className="py-2 pr-4">{nrbMap[code]?.buy ?? "—"}</td>
                            <td className="py-2">{nrbMap[code]?.sell ?? "—"}</td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-6 rounded border border-border bg-muted/50 p-4 text-label-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">Disclaimer:</strong> rates shown are
              reference rates only — {usingNrb ? "the NRB mid of its published buying/selling pair" : "a mid-market aggregate that varies by source and time"}. Banks,
              remittance operators, and money changers add their own margin, so the rate you actually
              get will differ. Always confirm the final rate before transacting.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">How conversion works</h3>
            <div className="flex flex-col gap-4 text-body-md text-muted-foreground">
              <ul className="list-disc space-y-2 pl-5">
                <li>Market rate: mid-market aggregate quoted against USD — result = amount ÷ from-rate × to-rate.</li>
                <li>NRB official: Nepal Rastra Bank buying/selling reference, converted via NPR at the mid of each pair.</li>
                <li>Live rates refresh on each page load; NRB rates load when you pick that source.</li>
                <li>No account, no history stored — conversion runs in your browser.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">Quick examples</h3>
            <ul className="flex flex-col gap-3 text-body-md">
              {QUICK_EXAMPLES.map((row, i) => (
                <li
                  key={row.label}
                  className={
                    i < QUICK_EXAMPLES.length - 1
                      ? "flex items-center justify-between border-b border-border pb-2"
                      : "flex items-center justify-between"
                  }
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-bold">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">Related Tools</h3>
            <div className="flex flex-col gap-4">
              {RELATED_TOOLS.map(({ slug, icon }) => {
                const related = getToolBySlug(slug);
                if (!related) return null;
                return (
                  <Link
                    key={slug}
                    href={`/tools/${slug}`}
                    className="group block rounded border border-border p-3 transition-colors hover:border-primary"
                  >
                    <div className="flex items-center gap-3">
                      <MaterialIcon name={icon} className="text-primary" />
                      <div>
                        <h4 className="text-body-md font-medium text-foreground transition-colors group-hover:text-primary">
                          {related.title}
                        </h4>
                        <p className="text-label-sm text-muted-foreground">{related.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
