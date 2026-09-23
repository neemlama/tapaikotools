"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { MaterialIcon } from "@/components/ui/material-icon";
import {
  evaluateExpression,
  factorial,
  formatResult,
  gcd,
  isPrime,
  lcm,
  solveQuadratic,
  type AngleMode,
} from "@/lib/calculator";
import { getToolBySlug } from "@/lib/tools/registry";

const tool = getToolBySlug("calculator")!;

type Mode = "standard" | "scientific" | "math";

const MODES: { id: Mode; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "scientific", label: "Scientific" },
  { id: "math", label: "Math tools" },
];

const RELATED_TOOLS: { slug: string; icon: string }[] = [
  { slug: "percentage-calculator", icon: "percent" },
  { slug: "unit-converter", icon: "straighten" },
];

interface HistoryEntry {
  expr: string;
  result: string;
}

type BtnVariant = "num" | "op" | "eq" | "fn";

function CalcButton({
  label,
  onPress,
  variant = "num",
  ariaLabel,
  wide,
}: {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  ariaLabel?: string;
  wide?: boolean;
}) {
  const styles: Record<BtnVariant, string> = {
    num: "bg-input text-foreground hover:bg-muted",
    op: "bg-muted font-semibold text-primary hover:bg-border",
    eq: "bg-primary-button font-semibold text-primary-foreground hover:opacity-90",
    fn: "bg-muted/60 text-sm text-foreground hover:bg-muted",
  };
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      onClick={onPress}
      className={`rounded-lg border border-border px-2 py-3.5 text-body-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${styles[variant]} ${wide ? "col-span-2" : ""}`}
    >
      {label}
    </button>
  );
}

export function CalculatorTool() {
  const [mode, setMode] = useState<Mode>("standard");
  const [display, setDisplay] = useState("");
  const [evaluated, setEvaluated] = useState(false);
  const [angle, setAngle] = useState<AngleMode>("deg");
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const evaluate = useCallback(
    (expr: string) => {
      const value = evaluateExpression(expr, angle);
      const text = formatResult(value);
      setDisplay(text);
      setEvaluated(true);
      if (text !== "Error" && expr.trim() !== "" && expr !== text) {
        setHistory((h) => [{ expr, result: text }, ...h].slice(0, 20));
      }
    },
    [angle],
  );

  const press = useCallback(
    (key: string) => {
      if (key === "C") {
        setDisplay("");
        setEvaluated(false);
        return;
      }
      if (key === "back") {
        setDisplay((d) => (d === "Error" || evaluated ? "" : d.slice(0, -1)));
        setEvaluated(false);
        return;
      }
      if (key === "eq") {
        if (display !== "" && display !== "Error") evaluate(display);
        return;
      }
      if (key === "neg") {
        setDisplay((d) => {
          if (d === "Error" || d === "") return d;
          return d.startsWith("-") ? d.slice(1) : `-${d}`;
        });
        setEvaluated(false);
        return;
      }
      // Memory keys.
      if (key === "MC") {
        setMemory(0);
        return;
      }
      if (key === "MR") {
        const text = formatResult(memory);
        setDisplay((d) => (d === "Error" || evaluated ? text : d + text));
        setEvaluated(false);
        return;
      }
      if (key === "M+" || key === "M-") {
        const value = evaluateExpression(display === "Error" ? "" : display, angle);
        if (Number.isFinite(value)) setMemory((m) => (key === "M+" ? m + value : m - value));
        return;
      }
      // Digits, operators, functions: fresh start after = unless continuing with an operator.
      setDisplay((d) => {
        const base = d === "Error" ? "" : d;
        if (evaluated) {
          setEvaluated(false);
          return /^[0-9.(a-zA-Zπ]/.test(key) ? key : base + key;
        }
        return base + key;
      });
    },
    [display, evaluated, angle, memory, evaluate],
  );

  // Physical-keyboard support for the two keypad modes.
  useEffect(() => {
    if (mode === "math") return;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) {
        return;
      }
      if (/^[0-9+\-*/^().%!]$/.test(event.key)) {
        event.preventDefault();
        press(event.key === "*" ? "*" : event.key);
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        press("eq");
      } else if (event.key === "Backspace") {
        event.preventDefault();
        press("back");
      } else if (event.key === "Escape") {
        press("C");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, press]);

  // SEO: FAQ JSON-LD only — SoftwareApplication + Breadcrumb are rendered
  // centrally in src/app/tools/[slug]/page.tsx via SITE_URL.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Does the scientific calculator use degrees or radians?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Both — it defaults to degrees like a physical calculator and has a one-tap DEG/RAD toggle.",
        },
      },
      {
        "@type": "Question",
        name: "What order of operations does it follow?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Standard math precedence: parentheses, powers (right-associative), then multiplication/division, then addition/subtraction.",
        },
      },
      {
        "@type": "Question",
        name: "What math tools are included?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Greatest common divisor, least common multiple, prime checking, factorial, and a quadratic equation solver with discriminant.",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mb-8 flex flex-col gap-4">
        <ToolBreadcrumb tool={tool} />
        <div>
          <h1 className="mb-2 text-headline-lg">Calculator</h1>
          <p className="max-w-2xl text-body-lg text-muted-foreground">
            Standard arithmetic, scientific functions, and handy math tools — with keyboard support,
            memory keys, and history. Free, instant, private.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  aria-pressed={mode === m.id}
                  className={
                    mode === m.id
                      ? "rounded bg-primary px-3 py-1.5 text-label-sm text-primary-foreground"
                      : "rounded border border-border px-3 py-1.5 text-label-sm text-muted-foreground hover:text-foreground"
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === "math" ? (
              <MathToolsPanel />
            ) : (
              <>
                <div
                  role="status"
                  aria-live="polite"
                  aria-label="Calculator display"
                  className="mb-4 min-h-[76px] overflow-x-auto rounded-lg border border-border bg-[#111] p-4 text-right font-mono text-3xl break-all text-white"
                >
                  {display === "" ? <span className="text-white/40">0</span> : display}
                </div>
                <div className="mb-4 flex items-center justify-between text-label-sm text-muted-foreground">
                  <span>
                    {mode === "scientific" && (
                      <button
                        type="button"
                        onClick={() => setAngle((a) => (a === "deg" ? "rad" : "deg"))}
                        aria-pressed={angle === "deg"}
                        title="Toggle degrees / radians"
                        className="rounded border border-border px-2 py-1 font-semibold hover:text-foreground"
                      >
                        {angle === "deg" ? "DEG" : "RAD"}
                      </button>
                    )}
                  </span>
                  <span>
                    {memory !== 0 && <span className="mr-3 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">M</span>}
                    You can also type — Enter calculates, Esc clears.
                  </span>
                </div>

                {mode === "standard" ? (
                  <div className="grid grid-cols-4 gap-2">
                    <CalcButton label="C" variant="fn" onPress={() => press("C")} ariaLabel="Clear" />
                    <CalcButton label="⌫" variant="fn" onPress={() => press("back")} ariaLabel="Backspace" />
                    <CalcButton label="%" variant="op" onPress={() => press("%")} ariaLabel="Percent" />
                    <CalcButton label="÷" variant="op" onPress={() => press("/")} ariaLabel="Divide" />
                    <CalcButton label="7" onPress={() => press("7")} />
                    <CalcButton label="8" onPress={() => press("8")} />
                    <CalcButton label="9" onPress={() => press("9")} />
                    <CalcButton label="×" variant="op" onPress={() => press("*")} ariaLabel="Multiply" />
                    <CalcButton label="4" onPress={() => press("4")} />
                    <CalcButton label="5" onPress={() => press("5")} />
                    <CalcButton label="6" onPress={() => press("6")} />
                    <CalcButton label="−" variant="op" onPress={() => press("-")} ariaLabel="Subtract" />
                    <CalcButton label="1" onPress={() => press("1")} />
                    <CalcButton label="2" onPress={() => press("2")} />
                    <CalcButton label="3" onPress={() => press("3")} />
                    <CalcButton label="+" variant="op" onPress={() => press("+")} ariaLabel="Add" />
                    <CalcButton label="±" onPress={() => press("neg")} ariaLabel="Toggle sign" />
                    <CalcButton label="0" onPress={() => press("0")} />
                    <CalcButton label="." onPress={() => press(".")} ariaLabel="Decimal point" />
                    <CalcButton label="=" variant="eq" onPress={() => press("eq")} ariaLabel="Equals" />
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    <CalcButton label="MC" variant="fn" onPress={() => press("MC")} ariaLabel="Memory clear" />
                    <CalcButton label="MR" variant="fn" onPress={() => press("MR")} ariaLabel="Memory recall" />
                    <CalcButton label="M+" variant="fn" onPress={() => press("M+")} ariaLabel="Memory add" />
                    <CalcButton label="M−" variant="fn" onPress={() => press("M-")} ariaLabel="Memory subtract" />
                    <CalcButton label="C" variant="fn" onPress={() => press("C")} ariaLabel="Clear" />
                    <CalcButton label="sin" variant="fn" onPress={() => press("sin(")} />
                    <CalcButton label="cos" variant="fn" onPress={() => press("cos(")} />
                    <CalcButton label="tan" variant="fn" onPress={() => press("tan(")} />
                    <CalcButton label="⌫" variant="fn" onPress={() => press("back")} ariaLabel="Backspace" />
                    <CalcButton label="÷" variant="op" onPress={() => press("/")} ariaLabel="Divide" />
                    <CalcButton label="asin" variant="fn" onPress={() => press("asin(")} />
                    <CalcButton label="acos" variant="fn" onPress={() => press("acos(")} />
                    <CalcButton label="atan" variant="fn" onPress={() => press("atan(")} />
                    <CalcButton label="(" onPress={() => press("(")} ariaLabel="Open parenthesis" />
                    <CalcButton label=")" onPress={() => press(")")} ariaLabel="Close parenthesis" />
                    <CalcButton label="ln" variant="fn" onPress={() => press("ln(")} />
                    <CalcButton label="log" variant="fn" onPress={() => press("log(")} />
                    <CalcButton label="√" variant="fn" onPress={() => press("sqrt(")} ariaLabel="Square root" />
                    <CalcButton label="7" onPress={() => press("7")} />
                    <CalcButton label="8" onPress={() => press("8")} />
                    <CalcButton label="9" onPress={() => press("9")} />
                    <CalcButton label="×" variant="op" onPress={() => press("*")} ariaLabel="Multiply" />
                    <CalcButton label="x²" variant="fn" onPress={() => press("^2")} ariaLabel="Square" />
                    <CalcButton label="xʸ" variant="fn" onPress={() => press("^")} ariaLabel="Power" />
                    <CalcButton label="4" onPress={() => press("4")} />
                    <CalcButton label="5" onPress={() => press("5")} />
                    <CalcButton label="6" onPress={() => press("6")} />
                    <CalcButton label="−" variant="op" onPress={() => press("-")} ariaLabel="Subtract" />
                    <CalcButton label="1/x" variant="fn" onPress={() => press("^(-1)")} ariaLabel="Reciprocal" />
                    <CalcButton label="x!" variant="fn" onPress={() => press("!")} ariaLabel="Factorial" />
                    <CalcButton label="1" onPress={() => press("1")} />
                    <CalcButton label="2" onPress={() => press("2")} />
                    <CalcButton label="3" onPress={() => press("3")} />
                    <CalcButton label="+" variant="op" onPress={() => press("+")} ariaLabel="Add" />
                    <CalcButton label="π" variant="fn" onPress={() => press("pi")} ariaLabel="Pi" />
                    <CalcButton label="e" variant="fn" onPress={() => press("e")} ariaLabel="Euler's number" />
                    <CalcButton label="%" variant="op" onPress={() => press("%")} ariaLabel="Percent" />
                    <CalcButton label="0" onPress={() => press("0")} />
                    <CalcButton label="." onPress={() => press(".")} ariaLabel="Decimal point" />
                    <CalcButton label="=" variant="eq" onPress={() => press("eq")} ariaLabel="Equals" />
                  </div>
                )}

                {history.length > 0 && (
                  <div className="mt-6 border-t border-border pt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-label-sm tracking-wider text-muted-foreground uppercase">History</h3>
                      <button
                        type="button"
                        onClick={() => setHistory([])}
                        className="text-label-sm text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                    <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto text-body-md">
                      {history.map((h, i) => (
                        <li key={`${h.expr}-${i}`}>
                          <button
                            type="button"
                            onClick={() => {
                              setDisplay(h.expr);
                              setEvaluated(false);
                            }}
                            title="Reuse this expression"
                            className="flex w-full items-center justify-between gap-3 rounded px-2 py-1 text-left hover:bg-muted"
                          >
                            <span className="truncate font-mono text-muted-foreground">{h.expr}</span>
                            <span className="shrink-0 font-mono font-semibold text-primary">= {h.result}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 border-b border-border pb-2 text-headline-md">Tips</h3>
            <ul className="flex flex-col gap-3 text-body-md text-muted-foreground">
              <li>% is percent — 50+10% gives 50.1.</li>
              <li>^ is power and right-associative: 2^3^2 = 512.</li>
              <li>Tap a history entry to reuse it.</li>
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

function MathField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-label-sm">
        {label}
      </label>
      <input
        id={id}
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-border bg-input p-3 text-body-md text-foreground transition-all focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
      />
    </div>
  );
}

function MathToolsPanel() {
  const [gcdA, setGcdA] = useState("48");
  const [gcdB, setGcdB] = useState("18");
  const [primeN, setPrimeN] = useState("17");
  const [factN, setFactN] = useState("5");
  const [qa, setQa] = useState("1");
  const [qb, setQb] = useState("-5");
  const [qc, setQc] = useState("6");

  const a = Number.parseInt(gcdA, 10);
  const b = Number.parseInt(gcdB, 10);
  const pairValid = Number.isInteger(a) && Number.isInteger(b);

  const p = Number.parseInt(primeN, 10);
  const primeValid = Number.isInteger(p);

  const f = Number.parseInt(factN, 10);
  const factValid = Number.isInteger(f) && f >= 0 && f <= 170;
  const factValue = factValid ? factorial(f) : NaN;

  const ca = Number.parseFloat(qa);
  const cb = Number.parseFloat(qb);
  const cc = Number.parseFloat(qc);
  const quadValid = Number.isFinite(ca) && Number.isFinite(cb) && Number.isFinite(cc);
  const quad = quadValid ? solveQuadratic(ca, cb, cc) : null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-body-md font-semibold">GCD & LCM</h3>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <MathField id="gcdA" label="First number" value={gcdA} onChange={setGcdA} placeholder="e.g. 48" />
          <MathField id="gcdB" label="Second number" value={gcdB} onChange={setGcdB} placeholder="e.g. 18" />
        </div>
        {pairValid ? (
          <p className="text-body-md">
            GCD = <strong className="text-primary">{gcd(a, b)}</strong>
            {" · "}LCM = <strong className="text-primary">{lcm(a, b)}</strong>
          </p>
        ) : (
          <p role="alert" className="text-body-md text-destructive">Enter two whole numbers.</p>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-body-md font-semibold">Prime check</h3>
        <div className="mb-3">
          <MathField id="primeN" label="Number" value={primeN} onChange={setPrimeN} placeholder="e.g. 17" />
        </div>
        {primeValid ? (
          <p className="text-body-md">
            {p} is {isPrime(p) ? <strong className="text-primary">prime</strong> : <strong>not prime</strong>}.
          </p>
        ) : (
          <p role="alert" className="text-body-md text-destructive">Enter a whole number.</p>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-body-md font-semibold">Factorial</h3>
        <div className="mb-3">
          <MathField id="factN" label="Number (0–170)" value={factN} onChange={setFactN} placeholder="e.g. 5" />
        </div>
        {factValid ? (
          <p className="break-all text-body-md">
            {f}! = <strong className="text-primary">{factValue.toLocaleString("en-US")}</strong>
          </p>
        ) : (
          <p role="alert" className="text-body-md text-destructive">Enter a whole number from 0 to 170.</p>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-3 text-body-md font-semibold">Quadratic solver (ax² + bx + c = 0)</h3>
        <div className="mb-3 grid grid-cols-3 gap-3">
          <MathField id="qa" label="a" value={qa} onChange={setQa} placeholder="1" />
          <MathField id="qb" label="b" value={qb} onChange={setQb} placeholder="-5" />
          <MathField id="qc" label="c" value={qc} onChange={setQc} placeholder="6" />
        </div>
        {!quadValid || quad === null ? (
          <p role="alert" className="text-body-md text-destructive">Enter valid coefficients.</p>
        ) : quad.linear ? (
          <p className="text-body-md">
            Linear equation — x = <strong className="text-primary">{formatResult(quad.roots[0])}</strong>
          </p>
        ) : quad.roots.length === 0 ? (
          <p className="text-body-md">
            No real roots <span className="text-muted-foreground">(discriminant {formatResult(quad.discriminant)})</span>
          </p>
        ) : (
          <p className="text-body-md">
            x ={" "}
            {quad.roots.map((r, i) => (
              <span key={r}>
                {i > 0 && ", "}
                <strong className="text-primary">{formatResult(r)}</strong>
              </span>
            ))}{" "}
            <span className="text-muted-foreground">(discriminant {formatResult(quad.discriminant)})</span>
          </p>
        )}
      </div>
    </div>
  );
}
