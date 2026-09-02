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
  Files,
  Fingerprint,
  GraduationCap,
  ImageDown,
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
  {
    id: "image-tools",
    label: "Image Tools",
    description: "Compress, resize and optimize images — 100% in your browser.",
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
    title: "Student GPA Calculator",
    description:
      "Calculate your semester Grade Point Average (GPA) or Cumulative GPA (CGPA) accurately based on a standard 4.0 scale. Add your courses, credits, and grades below.",
    // No `about` here on purpose, and `layout: "custom"` below: this page's
    // Stitch design has its own display-size header (with a breadcrumb —
    // rendered via the shared ToolBreadcrumb, same as CgpaCalculatorTool)
    // and its own "How to Calculate GPA" / "GPA vs. CGPA" info cards instead
    // of ToolPageShell's standard wrapper — see CgpaCalculatorTool for the
    // same call.
    category: "student-tools",
    icon: GraduationCap,
    status: "available",
    layout: "custom",
  },
  {
    slug: "attendance-calculator",
    title: "Attendance Calculator",
    description:
      "Precisely track your academic standing. Input your current classes to calculate your percentage and forecast future attendance goals to stay on track.",
    // No `about` here on purpose, and `layout: "custom"` below: this page's
    // Stitch design has its own bento-grid layout (live status card + two
    // independent goal-seeking cards) and its own accordion FAQ section
    // instead of ToolPageShell's standard wrapper — see CgpaCalculatorTool
    // for the same call.
    category: "student-tools",
    icon: CalendarCheck,
    status: "available",
    layout: "custom",
  },
  {
    slug: "marks-percentage-calculator",
    title: "Marks & Percentage Calculator",
    description: "Quickly calculate your exam percentage and predict your grade. Ideal for students, teachers, and parents.",
    // No `about` here on purpose, and `layout: "custom"` below: this page's
    // Stitch design has its own breadcrumb (via the shared ToolBreadcrumb,
    // same as GpaCalculatorTool) and its own "How to Calculate Percentage" /
    // "Standard Grading Scale" / "Related Student Tools" layout instead of
    // ToolPageShell's standard wrapper — see CgpaCalculatorTool for the
    // same call.
    category: "student-tools",
    icon: Percent,
    status: "available",
    popular: true,
    layout: "custom",
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
    description: "Create short, manageable links instantly. Perfect for sharing on social media, emails, or SMS.",
    // No `about` here on purpose, and `layout: "custom"` below: this page
    // was rebuilt from the literal Stitch HTML export the user pasted
    // directly (Phase 4, see docs/PLAN.md #10), which has its own centered
    // header and its own "Why use a URL shortener?" / "Is it safe?" info
    // cards instead of ToolPageShell's standard wrapper — moot anyway since
    // `layout: "custom"` skips the shell's sections entirely.
    category: "developer-tools",
    icon: Link,
    status: "available",
    layout: "custom",
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
  {
    slug: "pdf-docx-converter",
    title: "PDF ↔ DOCX Converter",
    description:
      "Convert PDF to DOCX and DOCX to PDF instantly — 100% in your browser. No upload to any server, private and free.",
    // No `about` here on purpose, and `layout: "custom"` below: this
    // tool owns its entire page (header, drop-zone, mode toggle,
    // educational sections, FAQ) rather than the shared shell — same
    // precedent as UnitConverterTool/Base64EncoderDecoderTool.
    category: "converters",
    icon: Files,
    status: "available",
    popular: true,
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
    description: "Generate a sequence of random numbers within a specified range. Fast, free, and secure.",
    // No `about` here on purpose, and `layout: "custom"` below: this page
    // was rebuilt from the literal Stitch HTML export the user pasted
    // directly (see docs/PLAN.md #6/#7/#8/#9), which has its own centered,
    // no-breadcrumb header and its own "How It Works" / "Uses for Random
    // Numbers" / FAQ sections instead of ToolPageShell's standard wrapper —
    // moot anyway since `layout: "custom"` skips the shell's sections
    // entirely, but kept out to avoid dead/unused content. Same call as
    // UuidGeneratorTool/UnitConverterTool.
    category: "generators",
    icon: Dices,
    status: "available",
    layout: "custom",
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
    description:
      "Calculate your monthly payments, total interest, and see how extra payments can save you time and money.",
    // No `about` here on purpose, and `layout: "custom"` below: this page's
    // Stitch design has its own results row + savings banner + balance
    // chart, and its own "Common Loan Types" / "Tips for Faster Payoff" /
    // FAQ sections (hand-built in LoanCalculatorTool) instead of
    // ToolPageShell's standard wrapper — see CgpaCalculatorTool for the
    // same call.
    category: "finance",
    icon: Landmark,
    status: "available",
    layout: "custom",
  },
  {
    slug: "emi-calculator",
    title: "EMI Calculator",
    description:
      "Quickly calculate your Equated Monthly Installment (EMI) for home loans, car loans, or personal loans.",
    // No `about` here on purpose: this page's Stitch design folds that copy
    // into its own "How it Works" bento card, and has its own "Benefits"
    // and "FAQ" cards too (all hand-built in EmiCalculatorTool) instead of
    // ToolPageShell's generic About/FAQ sections — and `layout: "custom"`
    // below means those shell sections never render anyway.
    category: "finance",
    icon: Banknote,
    status: "available",
    layout: "custom",
  },
  {
    slug: "interest-calculator",
    title: "Interest Calculator",
    description:
      "Calculate simple and compound interest to understand how your money grows over time. A vital tool for personal finance planning.",
    // No `about` here on purpose, and `layout: "custom"` below: this page's
    // Stitch design has its own display-size header and no About, FAQ, or
    // related-tools section at all below its calculator+chart grid — see
    // CgpaCalculatorTool for the same call. (Does have a breadcrumb now,
    // added after launch for consistency with the other Finance tools —
    // see InterestCalculatorTool's own comment.)
    category: "finance",
    icon: TrendingUp,
    status: "available",
    layout: "custom",
  },
  {
    slug: "investment-calculator",
    title: "Investment Calculator",
    description:
      "Project your wealth growth over time. See how compounding interest and consistent contributions can build your financial future.",
    // No `about` here on purpose: this page's Stitch design folds that copy
    // into its own "Importance of Starting Early" / "Risk vs. Reward"
    // sections, and has its own centered FAQ section too (all hand-built in
    // InvestmentCalculatorTool) instead of ToolPageShell's generic
    // About/FAQ sections — and `layout: "custom"` below means those shell
    // sections never render anyway.
    category: "finance",
    icon: LineChart,
    status: "available",
    layout: "custom",
  },

  // Image Tools
  {
    slug: "image-compressor",
    title: "Image Compressor",
    description:
      "Compress and resize JPEG, PNG, WebP images instantly — 100% in your browser. Reduce file size without visible quality loss. Free, private, no upload.",
    // No `about` here on purpose, and `layout: "custom"` below: this tool owns its entire page (hero, drop-zone, quality/format/resize controls, before/after preview with size savings, educational sections, FAQ with JSON-LD) rather than the shared shell — same precedent as PdfDocxConverterTool.
    category: "image-tools",
    icon: ImageDown,
    status: "available",
    popular: true,
    layout: "custom",
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
