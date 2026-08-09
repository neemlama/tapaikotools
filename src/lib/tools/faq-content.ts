import type { FaqItem } from "@/components/tools/faq";

/**
 * FAQ content keyed by tool slug, rendered by ToolPageShell (via
 * app/tools/[slug]/page.tsx) rather than authored inside each tool's own
 * implementation component. Kept separate from `about` in registry.ts
 * since this is naturally longer/more per-tool than a one-line summary,
 * but the effect is the same: content-driven, not scattered across 19
 * component files.
 */
export const faqContent: Record<string, FaqItem[]> = {
  // "cgpa-calculator" intentionally has no entry here: its Stitch design
  // has its own "Frequently Asked Questions" section (hand-built in
  // CgpaCalculatorTool, exact copy) instead of ToolPageShell's generic FAQ
  // grid — moot anyway since `layout: "custom"` skips the shell's FAQ
  // section entirely, but kept out to avoid dead/unused content.
  "gpa-calculator": [
    {
      question: "What scale should I use for grade points?",
      answer: "Whatever your institution uses — 4.0 and 10.0 are both common. Just be consistent across every row.",
    },
    {
      question: "Do I need to fill in every row?",
      answer:
        "No — rows with an empty credits or grade-points field are ignored, so you can add extra rows and only fill in what you need.",
    },
  ],
  "attendance-calculator": [
    {
      question: "Why 75%?",
      answer:
        "It's a common minimum threshold, but yours may differ — change the \"Required attendance %\" field to match your institution's actual policy.",
    },
    {
      question: "Does this account for future scheduled classes?",
      answer: "No — it works from your current totals only. Re-run it as your attendance changes.",
    },
  ],
  "marks-percentage-calculator": [
    {
      question: "Can subjects have different maximum marks?",
      answer:
        "Yes — each row has its own max marks field, so a subject out of 50 and one out of 100 both factor in correctly.",
    },
    {
      question: "What if I only have one subject?",
      answer: "Remove the extra row — a single subject still computes a correct percentage.",
    },
  ],
  // "age-calculator" intentionally has no entry here: its Stitch design has
  // its own accordion FAQ (hand-built in AgeCalculatorTool, exact copy)
  // instead of ToolPageShell's generic always-visible FAQ grid — an entry
  // here would never render anyway since `layout: "custom"` skips
  // ToolPageShell's wrapper entirely, but keeping it out avoids the
  // stale-duplicate trap "json-formatter" hit above.
  // "unix-timestamp-converter" intentionally has no entry here: its Stitch
  // design has its own FAQ section (hand-built in UnixTimestampConverterTool,
  // exact copy) instead of ToolPageShell's generic always-visible FAQ grid —
  // moot anyway since `layout: "custom"` skips the shell's FAQ section
  // entirely, but kept out to avoid the stale-duplicate trap "json-formatter"
  // hit above.
  "word-counter": [
    {
      question: "How is reading time calculated?",
      answer:
        "Reading time is estimated based on an average adult reading speed of 225 words per minute. We divide your total word count by 225 to give you a standard approximation of how long it will take someone to read your text.",
    },
    {
      question: "Does it count punctuation as words?",
      answer:
        "No. The word counter is designed to identify actual words separated by spaces or standard punctuation breaks. Standalone punctuation marks are not counted as words, though they do count towards your total character count.",
    },
    {
      question: "Is my text saved or sent to a server?",
      answer:
        "No. This tool runs entirely in your web browser using JavaScript. The text you enter is never sent to our servers, saved, or analyzed beyond your local device, ensuring complete privacy and security for your content.",
    },
  ],
  // "lorem-ipsum-generator" intentionally has no entry here: its Stitch
  // design has its own gray-panel FAQ section (hand-built in
  // LoremIpsumGeneratorTool, exact copy) instead of ToolPageShell's generic
  // always-visible FAQ grid — moot anyway since `layout: "custom"` skips
  // the shell's FAQ section entirely, but kept out to avoid the
  // stale-duplicate trap "json-formatter" hit above.
  // "json-formatter" intentionally has no entry here: its Stitch design
  // has its own "Technical FAQ" bento card (hand-built in
  // JsonFormatterTool, exact copy) instead of ToolPageShell's generic
  // always-visible FAQ grid — an entry here would render both.
  // "base64-encoder-decoder" intentionally has no entry here: its Stitch
  // design has its own sidebar "FAQ" card (hand-built in
  // Base64EncoderDecoderTool, exact copy) instead of ToolPageShell's
  // generic FAQ grid — moot anyway since `layout: "custom"` skips the
  // shell's FAQ section entirely, but kept out to avoid dead/unused
  // content. Same call as "cgpa-calculator" above.
  "url-shortener": [
    {
      question: "When will this be available?",
      answer: "URL Shortener needs a backend to store and redirect links, so it's planned for a later phase.",
    },
  ],
  // "unit-converter" intentionally has no entry: layout: "custom" bypasses
  // ToolPageShell's FAQ section entirely — its own "Understanding Unit
  // Conversions" bento takes its place.
  // "password-generator" intentionally has no entry: layout: "custom"
  // bypasses ToolPageShell's FAQ section entirely, and this page's Stitch
  // design has no FAQ section of its own to replace it with either — just
  // "Tips for a Strong Password" and "Why Use a Generator?" (hand-built in
  // PasswordGeneratorTool).
  "random-number-generator": [
    {
      question: "Can min and max be negative?",
      answer: "Yes — any integer range works, as long as min is less than or equal to max.",
    },
    {
      question: 'What does "no duplicates" do at large counts?',
      answer:
        "It samples without replacement, so if you ask for more unique numbers than exist in the range, you'll get a clear error instead of a partial result.",
    },
  ],
  // "uuid-generator" intentionally has no entry here: its Stitch design has
  // its own three-column "What is a UUID?" / "How to use" / "FAQ" section
  // (hand-built in UuidGeneratorTool, exact copy) instead of ToolPageShell's
  // generic FAQ grid — moot anyway since `layout: "custom"` skips the
  // shell's FAQ section entirely, but kept out to avoid dead/unused
  // content. Same call as "base64-encoder-decoder" above.
  // "qr-code-generator" intentionally has no entry here: its Stitch design
  // has its own "Frequently Asked Questions" section (hand-built in
  // QrCodeGeneratorTool, exact copy) instead of ToolPageShell's generic
  // always-visible FAQ grid — an entry here would render both. Same call
  // as "json-formatter" above.
  "loan-calculator": [
    {
      question: "Does this include taxes, insurance, or fees?",
      answer:
        "No — this is principal and interest only. Real monthly payments (like a mortgage escrow) often include more.",
    },
    {
      question: "What if my loan has a variable rate?",
      answer: "This assumes a fixed rate for the full term. For a variable rate, re-run the calculation whenever the rate changes.",
    },
  ],
  "emi-calculator": [
    {
      question: "Is EMI the same as a monthly loan payment?",
      answer:
        "Yes — EMI (Equated Monthly Installment) is just the term commonly used in South Asian banking for a fixed monthly loan payment.",
    },
    {
      question: "Does the EMI change over the loan term?",
      answer:
        "No — it's fixed for the whole tenure; only the split between principal and interest within each payment shifts over time.",
    },
  ],
  "interest-calculator": [
    {
      question: "When would I use simple vs. compound interest?",
      answer:
        "Simple interest is common for short-term loans; most savings accounts, investments, and long-term loans use compound interest, which earns interest on previously earned interest.",
    },
    {
      question: "Does compounding frequency matter much?",
      answer: "Yes, especially over longer periods — monthly compounding earns more than annual compounding at the same nominal rate.",
    },
  ],
  "investment-calculator": [
    {
      question: "Does this account for inflation?",
      answer:
        "No — figures are in nominal (today's) dollars and don't subtract inflation. Subtract your expected inflation rate from the return rate for a rough real-return estimate.",
    },
    {
      question: "How often is growth compounded?",
      answer: "Monthly — your contribution and the previous balance both earn the next month's return.",
    },
  ],
};

export function getFaqForSlug(slug: string): FaqItem[] | undefined {
  return faqContent[slug];
}
