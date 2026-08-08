"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { CodeOutput } from "@/components/tools/code-output";
import { Faq } from "@/components/tools/faq";
import { Panel } from "@/components/tools/panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const SIMILAR = new Set("il1Lo0O".split(""));

/**
 * Unbiased random integer in [0, max) via rejection sampling over
 * crypto.getRandomValues. Math.random() is not a CSPRNG and has no place
 * in a password generator; a plain `% max` on the raw random value would
 * also introduce a small modulo bias, which rejection sampling avoids.
 */
function secureRandomInt(max: number): number {
  const range = 2 ** 32;
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % max;
}

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

export function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [password, setPassword] = useState("");

  const pools = useMemo(() => {
    const selected = [
      useUpper && UPPER,
      useLower && LOWER,
      useNumbers && NUMBERS,
      useSymbols && SYMBOLS,
    ].filter((pool): pool is string => Boolean(pool));
    return excludeSimilar ? selected.map(stripSimilar) : selected;
  }, [useUpper, useLower, useNumbers, useSymbols, excludeSimilar]);

  const canGenerate = pools.some((pool) => pool.length > 0);

  function handleGenerate() {
    if (!canGenerate) return;
    setPassword(generatePassword(pools, length));
  }

  // Matches the four checks the Stitch design calls out explicitly for the
  // strength indicator, rather than an invented entropy formula.
  const criteria = [
    { label: "12+ characters", met: password.length >= 12 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Symbol", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = criteria.filter((c) => c.met).length;
  const strength = metCount <= 1 ? "Weak" : metCount <= 3 ? "Medium" : "Strong";
  const strengthClassName =
    strength === "Strong" ? "text-success" : strength === "Medium" ? "text-warning" : "text-destructive";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Parameters">
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-body-md font-medium text-foreground">
                <span>Length</span>
                <span className="font-mono">{length}</span>
              </div>
              <input
                type="range"
                min={4}
                max={64}
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex flex-col gap-3">
              <Checkbox
                id="use-upper"
                label="Uppercase letters"
                checked={useUpper}
                onChange={(event) => setUseUpper(event.target.checked)}
              />
              <Checkbox
                id="use-lower"
                label="Lowercase letters"
                checked={useLower}
                onChange={(event) => setUseLower(event.target.checked)}
              />
              <Checkbox
                id="use-numbers"
                label="Numbers"
                checked={useNumbers}
                onChange={(event) => setUseNumbers(event.target.checked)}
              />
              <Checkbox
                id="use-symbols"
                label="Symbols"
                checked={useSymbols}
                onChange={(event) => setUseSymbols(event.target.checked)}
              />
              <Checkbox
                id="exclude-similar"
                label="Exclude similar characters (i, l, 1, L, o, O, 0)"
                checked={excludeSimilar}
                onChange={(event) => setExcludeSimilar(event.target.checked)}
              />
            </div>

            {!canGenerate && (
              <p className="text-body-md text-destructive">Select at least one character type.</p>
            )}

            <Button onClick={handleGenerate} disabled={!canGenerate}>
              <RefreshCw className="h-4 w-4" />
              {password ? "Regenerate" : "Generate password"}
            </Button>
          </div>
        </Panel>

        <Panel title="Generated password">
          <div className="flex flex-col gap-4">
            <CodeOutput value={password} placeholder="Click generate to create a password." minHeight="4rem" />
            {password && (
              <div>
                <p className={cn("text-body-md font-medium", strengthClassName)}>{strength}</p>
                <ul className="mt-2 grid grid-cols-2 gap-1 text-body-md text-muted-foreground">
                  {criteria.map((criterion) => (
                    <li key={criterion.label} className={criterion.met ? "text-foreground" : undefined}>
                      {criterion.met ? "✓" : "○"} {criterion.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Faq
        items={[
          {
            question: "Is this password sent anywhere?",
            answer:
              "No — it's generated entirely in your browser using the Web Crypto API and never leaves your device.",
          },
          {
            question: "How random is it?",
            answer:
              "Passwords are built from crypto.getRandomValues, a cryptographically secure random source — not Math.random.",
          },
        ]}
      />
    </div>
  );
}
