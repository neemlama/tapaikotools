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
    description: "Calculate your cumulative grade point average across semesters.",
    category: "student-tools",
    icon: GraduationCap,
    status: "coming-soon",
    popular: true,
  },
  {
    slug: "gpa-calculator",
    title: "GPA Calculator",
    description: "Calculate your grade point average for a single term.",
    category: "student-tools",
    icon: GraduationCap,
    status: "coming-soon",
  },
  {
    slug: "attendance-calculator",
    title: "Attendance Calculator",
    description: "Track attendance percentage and how many classes you can safely miss.",
    category: "student-tools",
    icon: CalendarCheck,
    status: "coming-soon",
  },
  {
    slug: "marks-percentage-calculator",
    title: "Marks Percentage Calculator",
    description: "Convert marks obtained into an overall percentage.",
    category: "student-tools",
    icon: Percent,
    status: "coming-soon",
  },

  // Calculators
  {
    slug: "age-calculator",
    title: "Age Calculator",
    description: "Find your exact age in years, months, and days.",
    category: "calculators",
    icon: Cake,
    status: "coming-soon",
    popular: true,
  },

  // Date & Time
  {
    slug: "unix-timestamp-converter",
    title: "Unix Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates.",
    category: "date-time",
    icon: Clock,
    status: "coming-soon",
  },

  // Text Tools
  {
    slug: "word-counter",
    title: "Word Counter",
    description: "Count words, characters, sentences, and reading time.",
    category: "text-tools",
    icon: AlignLeft,
    status: "coming-soon",
    popular: true,
  },
  {
    slug: "lorem-ipsum-generator",
    title: "Lorem Ipsum Generator",
    description: "Generate placeholder text for mockups and layouts.",
    category: "text-tools",
    icon: FileText,
    status: "coming-soon",
  },

  // Developer Tools
  {
    slug: "json-formatter",
    title: "JSON Formatter",
    description: "Beautify, validate, and minify JSON data quickly.",
    category: "developer-tools",
    icon: Braces,
    status: "available",
    popular: true,
  },
  {
    slug: "base64-encoder-decoder",
    title: "Base64 Encoder/Decoder",
    description: "Encode text to Base64 or decode Base64 back to text.",
    category: "developer-tools",
    icon: Binary,
    status: "coming-soon",
  },
  {
    slug: "url-shortener",
    title: "URL Shortener",
    description: "Shorten long URLs into compact, shareable links.",
    category: "developer-tools",
    icon: Link,
    status: "coming-soon",
  },

  // Converters
  {
    slug: "unit-converter",
    title: "Unit Converter",
    description: "Convert between length, weight, temperature, and more.",
    category: "converters",
    icon: Ruler,
    status: "coming-soon",
    popular: true,
  },

  // Generators
  {
    slug: "password-generator",
    title: "Password Generator",
    description: "Generate strong, secure, and customizable passwords instantly.",
    category: "generators",
    icon: KeyRound,
    status: "available",
    popular: true,
  },
  {
    slug: "random-number-generator",
    title: "Random Number Generator",
    description: "Generate random numbers within a custom range.",
    category: "generators",
    icon: Dices,
    status: "coming-soon",
  },
  {
    slug: "uuid-generator",
    title: "UUID Generator",
    description: "Generate RFC-compliant UUIDs for use in your projects.",
    category: "generators",
    icon: Fingerprint,
    status: "coming-soon",
  },
  {
    slug: "qr-code-generator",
    title: "QR Code Generator",
    description: "Turn text or a URL into a downloadable QR code.",
    category: "generators",
    icon: QrCode,
    status: "coming-soon",
  },

  // Finance
  {
    slug: "loan-calculator",
    title: "Loan Calculator",
    description: "Estimate monthly payments and total interest on a loan.",
    category: "finance",
    icon: Landmark,
    status: "coming-soon",
  },
  {
    slug: "emi-calculator",
    title: "EMI Calculator",
    description: "Calculate equated monthly installments for a loan.",
    category: "finance",
    icon: Banknote,
    status: "coming-soon",
  },
  {
    slug: "interest-calculator",
    title: "Interest Calculator",
    description: "Calculate simple or compound interest on a principal amount.",
    category: "finance",
    icon: TrendingUp,
    status: "coming-soon",
  },
  {
    slug: "investment-calculator",
    title: "Investment Calculator",
    description: "Project your wealth growth over time with compounding returns.",
    category: "finance",
    icon: LineChart,
    status: "coming-soon",
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
