import {
  AlignLeft,
  Banknote,
  Binary,
  Braces,
  Cake,
  CalendarCheck,
  Clock,
  Dices,
  FileText,
  Fingerprint,
  GraduationCap,
  Landmark,
  LineChart,
  Link,
  Percent,
  QrCode,
  Ruler,
  KeyRound,
  TrendingUp,
} from "lucide-react";

import type { Tool, ToolCategory, ToolCategoryId } from "./types";

/**
 * Category metadata, in canonical display order. Some categories currently
 * have few (or zero) tools — that reflects what Stitch actually designed,
 * not a limit on what belongs there. See docs/PLAN.md #1 for how each tool
 * below was assigned to a category (Stitch only named the categories, not
 * the mapping).
 */
export const categories: ToolCategory[] = [
  {
    id: "student-tools",
    label: "Student Tools",
    description: "Grades, GPA, and attendance calculators for school and college.",
  },
  {
    id: "calculators",
    label: "Calculators",
    description: "General-purpose everyday calculators.",
  },
  {
    id: "date-time",
    label: "Date & Time",
    description: "Work with timestamps, dates, and durations.",
  },
  {
    id: "text-tools",
    label: "Text Tools",
    description: "Count, generate, and manipulate text.",
  },
  {
    id: "developer-tools",
    label: "Developer Tools",
    description: "Everyday utilities for writing and debugging code.",
  },
  {
    id: "converters",
    label: "Converters",
    description: "Convert between units and measurements.",
  },
  {
    id: "generators",
    label: "Generators",
    description: "Generate passwords, IDs, and other random data.",
  },
  {
    id: "finance",
    label: "Finance",
    description: "Loans, interest, and investment calculators.",
  },
];

/**
 * All 20 tools identified in the Stitch design. Metadata only — no tool is
 * implemented yet (Phase 0 scope). Slugs are the intended route under
 * /tools/{slug} once each page is built.
 */
export const tools: Tool[] = [
  // Student Tools
  {
    slug: "cgpa-calculator",
    title: "CGPA Calculator",
    description:
      "Accurately calculate your Cumulative Grade Point Average based on semesters or individual courses. Built for students who need precision without the clutter.",
    // No `about` here on purpose: this page's Stitch design has its own
    // "How is CGPA Calculated?" section (hand-built in CgpaCalculatorTool)
    // instead of ToolPageShell's generic About section — and `layout:
    // "custom"` below means that shell section never renders anyway.
    category: "student-tools",
    icon: GraduationCap,
    status: "available",
    popular: true,
    layout: "custom",
  },
  {
    slug: "gpa-calculator",
    title: "GPA Calculator",
    description: "Calculate your grade point average for a single term.",
    about:
      "Your GPA is the credit-weighted average of the grade points you earned in each course. Add a row per course, enter its credit hours and the grade points you scored, and the average updates as you type.",
    category: "student-tools",
    icon: GraduationCap,
    status: "available",
  },
  {
    slug: "attendance-calculator",
    title: "Attendance Calculator",
    description: "Track attendance percentage and how many classes you can safely miss.",
    about:
      "Most institutions set a minimum attendance percentage you need to stay eligible for exams. Enter your total classes and how many you've attended to see exactly how many you can still miss — or how many you need to attend next — to hit that threshold.",
    category: "student-tools",
    icon: CalendarCheck,
    status: "available",
  },
  {
    slug: "marks-percentage-calculator",
    title: "Marks Percentage Calculator",
    description: "Convert marks obtained into an overall percentage.",
    about:
      "Add every subject's marks obtained and its maximum, and this tool sums them up to your overall percentage — useful when a single test's percentage doesn't tell the whole story.",
    category: "student-tools",
    icon: Percent,
    status: "available",
    popular: true,
  },

  // Calculators
  {
    slug: "age-calculator",
    title: "Age Calculator",
    description:
      "Calculate your exact age in years, months, days, and discover interesting details like your total days lived and time until your next birthday.",
    // No `about` here on purpose, and `layout: "custom"` below: this page's
    // Stitch design has its own bento-grid results, its own "About the Age
    // Calculator" + accordion FAQ section (hand-built in AgeCalculatorTool),
    // and no breadcrumb or related-tools section — see CgpaCalculatorTool
    // for the same call.
    category: "calculators",
    icon: Cake,
    status: "available",
    popular: true,
    layout: "custom",
  },

  // Date & Time
  {
    slug: "unix-timestamp-converter",
    title: "Unix Timestamp Converter",
    description: "Convert Unix timestamps to readable dates and vice versa. Real-time, accurate, and easy to use.",
    // No `about` here on purpose, and `layout: "custom"` below: this page's
    // Stitch design has its own centered display-size header, its own
    // bento-grid tool area (live clock + two conversion cards), and its own
    // "What is Unix Time" / "How to use" / FAQ sections (hand-built in
    // UnixTimestampConverterTool) instead of ToolPageShell's standard
    // wrapper — see CgpaCalculatorTool for the same call.
    category: "date-time",
    icon: Clock,
    status: "available",
    layout: "custom",
  },

  // Text Tools
  {
    slug: "word-counter",
    title: "Word Counter",
    description:
      "A free, precise tool to calculate word count, character count, sentences, and reading time instantly as you type.",
    // No `about` here on purpose: this page's Stitch design folds the
    // "About this tool" copy into its own "How to use" / "What is a Word
    // Counter?" sections (hand-built in WordCounterTool) instead of
    // ToolPageShell's generic About section — see the comment there.
    category: "text-tools",
    icon: AlignLeft,
    status: "available",
    popular: true,
  },
  {
    slug: "lorem-ipsum-generator",
    title: "Lorem Ipsum Generator",
    description:
      "Generate professional placeholder text for your design mockups, wireframes, and development projects. Customize paragraphs, words, or lists instantly.",
    // No `about` here on purpose, and `layout: "custom"` below: this page's
    // Stitch design has its own Settings/Output layout, its own two-column
    // SEO section, and its own gray-panel accordion FAQ (hand-built in
    // LoremIpsumGeneratorTool) instead of ToolPageShell's standard wrapper
    // — see CgpaCalculatorTool for the same call.
    category: "text-tools",
    icon: FileText,
    status: "available",
    layout: "custom",
  },

  // Developer Tools
  {
    slug: "json-formatter",
    title: "JSON Formatter",
    description:
      "Format, validate and minify JSON directly in your browser. A high-performance, strictly structured utility for developers.",
    // No `about` here on purpose: this page's Stitch design folds the
    // "About this tool" copy into its own "What is JSON Formatting?" bento
    // card (hand-built in JsonFormatterTool) instead of ToolPageShell's
    // generic About section — see the comment there.
    category: "developer-tools",
    icon: Braces,
    status: "available",
    popular: true,
  },
  {
    slug: "base64-encoder-decoder",
    title: "Base64 Encoder/Decoder",
    description: "Encode text to Base64 or decode Base64 back to text.",
    // No `about` here on purpose: this page was rebuilt from the literal
    // Stitch HTML export the user pasted directly (see docs/PLAN.md #6),
    // which has its own "What is Base64?" section (hand-built in
    // Base64EncoderDecoderTool, exact copy) instead of ToolPageShell's
    // generic About section — and `layout: "custom"` below means that
    // shell section never renders anyway.
    category: "developer-tools",
    icon: Binary,
    status: "available",
    layout: "custom",
  },
  {
    slug: "url-shortener",
    title: "URL Shortener",
    description: "Shorten long URLs into compact, shareable links.",
    about: "Turns a long URL into a short, shareable link.",
    category: "developer-tools",
    icon: Link,
    status: "coming-soon",
  },

  // Converters
  {
    slug: "unit-converter",
    title: "Universal Unit Converter",
    description:
      "Effortlessly convert between hundreds of units of measurement across various categories. Precise, fast, and designed for professionals.",
    // No `about` — this page's Stitch design has its own embedded
    // "Understanding Unit Conversions" educational section instead of the
    // shared shell's generic About/FAQ (layout: "custom" bypasses that
    // shell entirely — see UnitConverterTool).
    category: "calculators",
    icon: Ruler,
    status: "available",
    layout: "custom",
  },

  // Generators
  {
    slug: "password-generator",
    title: "Random Password Generator",
    description: "Generate strong, secure, and customizable passwords instantly to keep your accounts safe.",
    // No `about` here on purpose: this page's Stitch design folds that copy
    // into its own "Why Use a Generator?" section (hand-built in
    // PasswordGeneratorTool) instead of ToolPageShell's generic About
    // section — and `layout: "custom"` below means that section, plus the
    // shell's FAQ grid (this design has no FAQ at all) and related-tools
    // section, never render anyway.
    category: "generators",
    icon: KeyRound,
    status: "available",
    layout: "custom",
  },
  {
    slug: "random-number-generator",
    title: "Random Number Generator",
    description: "Generate random numbers within a custom range.",
    about:
      "Generates one or more random integers in a range you set, with an optional \"no duplicates\" mode, using the same cryptographically secure randomness as the password generator.",
    category: "generators",
    icon: Dices,
    status: "available",
  },
  {
    slug: "uuid-generator",
    title: "UUID Generator",
    description:
      "Quickly generate secure, random Universally Unique Identifiers (UUIDs) for your development projects. Supports v1 and v4 formats.",
    // No `about` here on purpose, and `layout: "custom"` below: this page
    // was rebuilt from the literal Stitch HTML export the user pasted
    // directly (see docs/PLAN.md #6/#7), which has its own "What is a
    // UUID?" / "How to use" / "FAQ" three-column section (hand-built in
    // UuidGeneratorTool, exact copy) instead of ToolPageShell's generic
    // About/FAQ — moot anyway since `layout: "custom"` skips the shell's
    // sections entirely, but kept out to avoid dead/unused content. Same
    // call as Base64EncoderDecoderTool/UnitConverterTool.
    category: "generators",
    icon: Fingerprint,
    status: "available",
    layout: "custom",
  },
  {
    slug: "qr-code-generator",
    title: "QR Code Generator",
    description:
      "Generate high-quality QR codes instantly. Customize size, error correction, and color to suit your needs. Perfect for URLs, text, vCards, and more.",
    // No `about` here on purpose: this page was rebuilt from the literal
    // Stitch HTML export the user pasted directly (see docs/PLAN.md #6),
    // which has its own "What is a QR Code?" section (hand-built in
    // QrCodeGeneratorTool, exact copy) instead of ToolPageShell's generic
    // About section — see the comment there. Same call as json-formatter.
    category: "generators",
    icon: QrCode,
    status: "available",
    popular: true,
  },

  // Finance
  {
    slug: "loan-calculator",
    title: "Loan Calculator",
    description: "Estimate monthly payments and total interest on a loan.",
    about:
      "Estimates your monthly payment on a standard amortized loan from the principal, interest rate, and term — plus how much of the total you'll pay is interest.",
    category: "finance",
    icon: Landmark,
    status: "available",
  },
  {
    slug: "emi-calculator",
    title: "EMI Calculator",
    description: "Calculate equated monthly installments for a loan.",
    about:
      "Calculates your Equated Monthly Installment (EMI) — the fixed monthly payment that pays off both principal and interest over your chosen loan tenure.",
    category: "finance",
    icon: Banknote,
    status: "available",
  },
  {
    slug: "interest-calculator",
    title: "Interest Calculator",
    description: "Calculate simple or compound interest on a principal amount.",
    about:
      "Calculates interest earned on a principal amount, either simple interest (a flat rate on the original amount) or compound interest at your chosen compounding frequency.",
    category: "finance",
    icon: TrendingUp,
    status: "available",
  },
  {
    slug: "investment-calculator",
    title: "Investment Calculator",
    description: "Project your wealth growth over time with compounding returns.",
    about:
      "Projects how a lump sum plus regular monthly contributions can grow over time with compounding returns — see the year-by-year split between what you contributed and what you earned.",
    category: "finance",
    icon: LineChart,
    status: "available",
  },
];

export function getToolsByCategory(category: ToolCategoryId): Tool[] {
  return tools.filter((tool) => tool.category === category);
}

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getPopularTools(): Tool[] {
  return tools.filter((tool) => tool.popular);
}

/**
 * Ranked search across the registry. Plain substring filtering (matching
 * title OR description with no ranking) buries real matches under
 * incidental ones — e.g. searching "age" also substring-matches "average"
 * and "percentage" in unrelated Student Tools descriptions, which sorted
 * ahead of "Age Calculator" itself once results were grouped by fixed
 * category order. Scoring by match quality and sorting by score fixes
 * that: an exact/prefix/substring title match always outranks a
 * description-only match, regardless of category.
 */
export function searchTools(query: string): Tool[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tools;

  return tools
    .map((tool, index) => {
      const title = tool.title.toLowerCase();
      let score = -1;
      if (title === normalized) score = 0;
      else if (title.startsWith(normalized)) score = 1;
      else if (title.includes(normalized)) score = 2;
      else if (tool.description.toLowerCase().includes(normalized)) score = 3;
      return { tool, score, index };
    })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((entry) => entry.tool);
}
