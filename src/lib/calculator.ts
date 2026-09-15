/**
 * Pure calculator math — shared by CalculatorTool so tests guard the real logic.
 *
 * A tiny recursive-descent expression evaluator (no `eval`, so pasted input
 * can't run code). Supports + - * / ^ parentheses, implicit multiplication
 * (2π, 2(3+4)), postfix % (percent) and ! (factorial), constants π e, and
 * scientific functions. Trig follows the given angle mode (calculator
 * convention: degrees by default).
 */

export type AngleMode = "deg" | "rad";

const FUNCTIONS = new Set([
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "ln",
  "log",
  "sqrt",
  "cbrt",
  "abs",
]);

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

type Token =
  | { kind: "num"; value: number }
  | { kind: "op"; value: string }
  | { kind: "func"; value: string }
  | { kind: "const"; value: string }
  | { kind: "lparen" }
  | { kind: "rparen" };

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " " || ch === ",") {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      let dots = 0;
      while (j < input.length && /[0-9.]/.test(input[j])) {
        if (input[j] === ".") dots++;
        j++;
      }
      if (dots > 1) return null;
      const value = Number.parseFloat(input.slice(i, j));
      if (!Number.isFinite(value)) return null;
      tokens.push({ kind: "num", value });
      i = j;
      continue;
    }
    if (/[a-zA-Zπ]/.test(ch)) {
      let j = i;
      while (j < input.length && /[a-zA-Zπ]/.test(input[j])) j++;
      const word = input.slice(i, j).toLowerCase().replace("π", "pi");
      if (FUNCTIONS.has(word)) tokens.push({ kind: "func", value: word });
      else if (word in CONSTANTS) tokens.push({ kind: "const", value: word });
      else return null;
      i = j;
      continue;
    }
    if ("+-*/^!%()".includes(ch)) {
      if (ch === "(") tokens.push({ kind: "lparen" });
      else if (ch === ")") tokens.push({ kind: "rparen" });
      else tokens.push({ kind: "op", value: ch === "*" ? "*" : ch });
      i++;
      continue;
    }
    // Allow × ÷ − pasted from the UI labels.
    if (ch === "×") {
      tokens.push({ kind: "op", value: "*" });
      i++;
      continue;
    }
    if (ch === "÷") {
      tokens.push({ kind: "op", value: "/" });
      i++;
      continue;
    }
    if (ch === "−") {
      tokens.push({ kind: "op", value: "-" });
      i++;
      continue;
    }
    return null;
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(
    private tokens: Token[],
    private angle: AngleMode,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  parse(): number {
    if (this.tokens.length === 0) return NaN;
    const value = this.parseExpr();
    return this.pos === this.tokens.length ? value : NaN;
  }

  private parseExpr(): number {
    let value = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t?.kind === "op" && (t.value === "+" || t.value === "-")) {
        this.pos++;
        const rhs = this.parseTerm();
        value = t.value === "+" ? value + rhs : value - rhs;
      } else {
        return value;
      }
    }
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    for (;;) {
      const t = this.peek();
      if (t?.kind === "op" && (t.value === "*" || t.value === "/")) {
        this.pos++;
        const rhs = this.parseFactor();
        if (t.value === "/") {
          if (rhs === 0) return NaN;
          value = value / rhs;
        } else {
          value = value * rhs;
        }
      } else if (t && (t.kind === "num" || t.kind === "const" || t.kind === "func" || t.kind === "lparen")) {
        // Implicit multiplication: 2π, 2(3+4), (1+2)(3+4).
        value = value * this.parseFactor();
      } else {
        return value;
      }
    }
  }

  private parseFactor(): number {
    const base = this.parseUnary();
    const t = this.peek();
    if (t?.kind === "op" && t.value === "^") {
      this.pos++;
      const exp = this.parseFactor(); // right-associative: 2^3^2 = 2^(3^2)
      const result = Math.pow(base, exp);
      return Number.isFinite(result) ? result : NaN;
    }
    return base;
  }

  private parseUnary(): number {
    const t = this.peek();
    if (t?.kind === "op" && (t.value === "+" || t.value === "-")) {
      this.pos++;
      const value = this.parseUnary();
      return t.value === "-" ? -value : value;
    }
    return this.parsePostfix();
  }

  private parsePostfix(): number {
    let value = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t?.kind === "op" && t.value === "!") {
        this.pos++;
        value = factorial(value);
      } else if (t?.kind === "op" && t.value === "%") {
        this.pos++;
        value = value / 100;
      } else {
        return value;
      }
    }
  }

  private parsePrimary(): number {
    const t = this.peek();
    if (!t) return NaN;
    if (t.kind === "num") {
      this.pos++;
      return t.value;
    }
    if (t.kind === "const") {
      this.pos++;
      return CONSTANTS[t.value];
    }
    if (t.kind === "func") {
      this.pos++;
      const next = this.peek();
      if (next?.kind !== "lparen") return NaN;
      this.pos++;
      const arg = this.parseExpr();
      const closing = this.peek();
      if (closing?.kind !== "rparen") return NaN;
      this.pos++;
      return applyFunction(t.value, arg, this.angle);
    }
    if (t.kind === "lparen") {
      this.pos++;
      const value = this.parseExpr();
      const closing = this.peek();
      if (closing?.kind !== "rparen") return NaN;
      this.pos++;
      return value;
    }
    return NaN;
  }
}

function toRadians(x: number, angle: AngleMode): number {
  return angle === "deg" ? (x * Math.PI) / 180 : x;
}

function fromRadians(x: number, angle: AngleMode): number {
  return angle === "deg" ? (x * 180) / Math.PI : x;
}

function applyFunction(name: string, arg: number, angle: AngleMode): number {
  if (!Number.isFinite(arg)) return NaN;
  switch (name) {
    case "sin":
    case "cos":
    case "tan": {
      // Snap near-zero results (sin 180°, cos 90°) instead of showing float dust.
      const raw =
        name === "sin"
          ? Math.sin(toRadians(arg, angle))
          : name === "cos"
            ? Math.cos(toRadians(arg, angle))
            : Math.tan(toRadians(arg, angle));
      if (name === "tan" && angle === "deg" && Number.isInteger(arg / 90) && !Number.isInteger(arg / 180)) {
        return NaN; // exact asymptote: tan 90°, 270°, …
      }
      return Math.abs(raw) < 1e-14 ? 0 : raw;
    }
    case "asin":
    case "acos": {
      if (arg < -1 || arg > 1) return NaN;
      const r = name === "asin" ? Math.asin(arg) : Math.acos(arg);
      return fromRadians(r, angle);
    }
    case "atan":
      return fromRadians(Math.atan(arg), angle);
    case "ln":
      return arg > 0 ? Math.log(arg) : NaN;
    case "log":
      return arg > 0 ? Math.log10(arg) : NaN;
    case "sqrt":
      return arg >= 0 ? Math.sqrt(arg) : NaN;
    case "cbrt":
      return Math.cbrt(arg);
    case "abs":
      return Math.abs(arg);
    default:
      return NaN;
  }
}

/** n! for non-negative integers up to 170 (171! overflows to Infinity). */
export function factorial(n: number): number {
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 170) return NaN;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** Evaluates an expression string. Returns NaN for invalid input or math errors. */
export function evaluateExpression(input: string, angle: AngleMode = "deg"): number {
  const tokens = tokenize(input);
  if (!tokens) return NaN;
  return new Parser(tokens, angle).parse();
}

/**
 * Display formatting: hides float dust (0.1+0.2 → 0.3), keeps up to 10
 * significant digits, falls back to exponential for very large/small values.
 */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  if (Object.is(value, -0)) return "0";
  const rounded = Number.parseFloat(value.toPrecision(10));
  return String(rounded);
}

/* ---- Mathematical helpers (Math mode) ---- */

export function gcd(a: number, b: number): number {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return NaN;
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function lcm(a: number, b: number): number {
  if (!Number.isInteger(a) || !Number.isInteger(b)) return NaN;
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
}

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export interface QuadraticSolution {
  /** Real roots (0, 1, or 2). Empty means no real roots. */
  roots: number[];
  discriminant: number;
  /** True when a = 0 and the equation degraded to linear. */
  linear?: boolean;
}

export function solveQuadratic(a: number, b: number, c: number): QuadraticSolution | null {
  for (const v of [a, b, c]) if (!Number.isFinite(v)) return null;
  if (a === 0) {
    if (b === 0) return null;
    return { roots: [-c / b], discriminant: NaN, linear: true };
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return { roots: [], discriminant };
  if (discriminant === 0) return { roots: [-b / (2 * a)], discriminant };
  const root = Math.sqrt(discriminant);
  return { roots: [(-b - root) / (2 * a), (-b + root) / (2 * a)], discriminant };
}
