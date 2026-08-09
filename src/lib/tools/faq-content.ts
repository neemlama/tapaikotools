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
  // "gpa-calculator" intentionally has no entry here: its Stitch design has
  // its own "How to Calculate GPA" / "GPA vs. CGPA" info cards (hand-built
  // in GpaCalculatorTool, exact copy) instead of ToolPageShell's generic FAQ
  // grid — moot anyway since `layout: "custom"` skips the shell's FAQ
  // section entirely, but kept out to avoid dead/unused content. Same call
  // as "cgpa-calculator" above.
  // "attendance-calculator" intentionally has no entry here: its Stitch
  // design has its own accordion FAQ (hand-built in
  // AttendanceCalculatorTool, exact copy) instead of ToolPageShell's
  // generic always-visible FAQ grid — moot anyway since `layout: "custom"`
  // skips the shell's FAQ section entirely, but kept out to avoid the
  // stale-duplicate trap "json-formatter" hit above.
  // "marks-percentage-calculator" intentionally has no entry here: its
  // Stitch design has its own "How to Calculate Percentage" / "Standard
  // Grading Scale" sidebar (hand-built in MarksPercentageCalculatorTool)
  // instead of ToolPageShell's generic FAQ grid — moot anyway since
  // `layout: "custom"` skips the shell's FAQ section entirely, but kept out
  // to avoid the stale-duplicate trap noted elsewhere in this file. (Also no
  // longer accurate — those FAQ answers were about the old multi-subject
  // row-table version of this tool, which this Stitch screen replaces.)
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
  // "loan-calculator" intentionally has no entry here: its Stitch design has
  // its own icon-toggle FAQ section (hand-built in LoanCalculatorTool, exact
  // copy) instead of ToolPageShell's generic always-visible FAQ grid — moot
  // anyway since `layout: "custom"` skips the shell's FAQ section entirely,
  // but kept out to avoid the stale-duplicate trap noted elsewhere in this
  // file.
  // "emi-calculator" intentionally has no entry here: its Stitch design has
  // its own "FAQ" bento card (hand-built in EmiCalculatorTool, exact copy)
  // instead of ToolPageShell's generic FAQ grid — moot anyway since
  // `layout: "custom"` skips the shell's FAQ section entirely, but kept out
  // to avoid the stale-duplicate trap noted elsewhere in this file.
  // "interest-calculator" intentionally has no entry here: `layout:
  // "custom"` bypasses ToolPageShell's FAQ section entirely, and this
  // page's Stitch design has no FAQ section of its own to replace it with
  // either — just the calculator + growth chart. Same call as
  // "password-generator" above.
  // "investment-calculator" intentionally has no entry here: its Stitch
  // design has its own centered "Frequently Asked Questions" section
  // (hand-built in InvestmentCalculatorTool, exact copy) instead of
  // ToolPageShell's generic FAQ grid — moot anyway since `layout: "custom"`
  // skips the shell's FAQ section entirely, but kept out to avoid the
  // stale-duplicate trap noted elsewhere in this file.
};

export function getFaqForSlug(slug: string): FaqItem[] | undefined {
  return faqContent[slug];
}
