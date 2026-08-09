"use client";

import { useState } from "react";

import { ToolBreadcrumb } from "@/components/tools/tool-breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Select } from "@/components/ui/select";
import { secureRandomInt } from "@/lib/random";
import { getToolBySlug } from "@/lib/tools/registry";

/**
 * Hand-transcribed from the Stitch "Lorem Ipsum Generator" screen —
 * `layout: "custom"` in the registry (see ToolPageShell), same call as
 * CgpaCalculatorTool/AgeCalculatorTool/UnixTimestampConverterTool: its own
 * two-column Settings/Output layout (with a floating copy button inside the
 * textarea *and* a toolbar Copy button — both present in the mockup, kept
 * as-is rather than deduplicated), its own two-column SEO grid, and its own
 * gray-panel accordion FAQ don't fit the shared Panel/CodeOutput/CopyButton
 * pieces or ToolPageShell's standard wrapper without diverging from the
 * design anyway.
 *
 * Adds a 4th unit ("Lists", rendered as "- " prefixed lines) the previous
 * version didn't have, and drops the quantity cap from 200 to 100 — both
 * to match this screen's own Settings panel exactly ("Paragraphs / Words /
 * Sentences / Lists", `max="100"`).
 *
 * Breadcrumb added after launch (2026-08-09) — see AttendanceCalculatorTool
 * for why.
 */

const tool = getToolBySlug("lorem-ipsum-generator")!;

const WORD_BANK =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum"
    .split(" ");

const CLASSIC_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit".split(" ");
const CLASSIC_SENTENCE = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

function randomWord() {
  return WORD_BANK[secureRandomInt(WORD_BANK.length)];
}

function randomSentence() {
  const length = 6 + secureRandomInt(10); // 6-15 words
  const words = Array.from({ length }, randomWord);
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function randomParagraph(firstSentence?: string) {
  const sentenceCount = 3 + secureRandomInt(4); // 3-6 sentences
  const sentences = Array.from({ length: sentenceCount }, () => randomSentence());
  if (firstSentence) sentences[0] = firstSentence;
  return sentences.join(" ");
}

type Unit = "paragraphs" | "words" | "sentences" | "lists";

function generate(unit: Unit, count: number, startWithLorem: boolean): string {
  const safeCount = Math.min(100, Math.max(1, count));

  if (unit === "words") {
    const words = startWithLorem ? CLASSIC_WORDS.slice(0, safeCount) : [];
    while (words.length < safeCount) words.push(randomWord());
    return words.join(" ");
  }

  if (unit === "sentences") {
    const sentences = startWithLorem ? [CLASSIC_SENTENCE] : [];
    while (sentences.length < safeCount) sentences.push(randomSentence());
    return sentences.join(" ");
  }

  if (unit === "lists") {
    const items = startWithLorem ? [CLASSIC_SENTENCE] : [];
    while (items.length < safeCount) items.push(randomSentence());
    return items.map((item) => `- ${item}`).join("\n");
  }

  const paragraphs: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    paragraphs.push(randomParagraph(startWithLorem && i === 0 ? CLASSIC_SENTENCE : undefined));
  }
  return paragraphs.join("\n\n");
}

const FAQ_ITEMS = [
  {
    question: "Why do we use it?",
    answer:
      "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English.",
  },
  {
    question: "Where does it come from?",
    answer:
      "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.",
  },
  {
    question: "Is it safe to use?",
    answer:
      "Yes. There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.",
  },
];

export function LoremIpsumGeneratorTool() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(5);
  const [startWithLorem, setStartWithLorem] = useState(true);
  // Pre-populated on mount, matching the Stitch mockup's own screenshot
  // (which ships with sample output already visible, not an empty box) — a
  // pure function of the initial state above, so unlike Date.now() or
  // Math.random() this can't hydration-mismatch: server and client both
  // evaluate the same generate("paragraphs", 5, true) once, and secureRandomInt
  // only runs client-side after that (never during SSR).
  const [output, setOutput] = useState(() => generate("paragraphs", 5, true));
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    setOutput(generate(unit, count, startWithLorem));
    setCopied(false);
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lorem-ipsum.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    // A plain <div>, not <main> — RootLayout already provides the page's
    // one <main> landmark; this "custom layout" component renders inside
    // it (see ToolPageShell), so a second <main> here would be invalid.
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-10">
      <header className="mb-12 max-w-2xl">
        <ToolBreadcrumb tool={tool} />
        <h1 className="mt-4 text-headline-lg">Lorem Ipsum Generator</h1>
        <p className="mt-4 text-body-lg text-muted-foreground">
          Generate professional placeholder text for your design mockups, wireframes, and development projects.
          Customize paragraphs, words, or lists instantly.
        </p>
      </header>

      <div className="flex flex-col items-start gap-8 lg:flex-row">
        {/* Settings panel */}
        <div className="flex w-full shrink-0 flex-col gap-6 rounded-lg border border-border bg-card p-6 lg:w-1/3">
          <h2 className="border-b border-border pb-2 text-headline-md">Settings</h2>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lorem-type">Type</Label>
            <Select id="lorem-type" value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
              <option value="paragraphs">Paragraphs</option>
              <option value="words">Words</option>
              <option value="sentences">Sentences</option>
              <option value="lists">Lists</option>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lorem-count">Quantity</Label>
            <Input
              id="lorem-count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
            />
          </div>

          <Checkbox
            id="start-with-lorem"
            label='Start with "Lorem ipsum dolor sit amet..."'
            checked={startWithLorem}
            onChange={(event) => setStartWithLorem(event.target.checked)}
          />

          <Button onClick={handleGenerate} className="mt-2 w-full">
            <MaterialIcon name="magic_button" className="text-[18px]" />
            Generate Text
          </Button>
        </div>

        {/* Output area */}
        <div className="flex w-full flex-col gap-4 lg:w-2/3">
          <div className="flex items-end justify-between border-b border-border pb-2">
            <h2 className="text-headline-md">Output</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleCopy} disabled={!output}>
                <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[16px]" />
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="secondary" onClick={handleDownload} disabled={!output}>
                <MaterialIcon name="download" className="text-[16px]" />
                Download
              </Button>
            </div>
          </div>

          <div className="relative w-full">
            <textarea
              value={output}
              readOnly
              className="h-[400px] w-full resize-none overflow-y-auto rounded-lg border border-border bg-card p-6 text-body-md leading-relaxed text-foreground focus:ring-1 focus:ring-border focus:outline-none"
            />
            {/* Floating quick-copy button inside the text area — present
                alongside the toolbar Copy button above in the Stitch mockup,
                not a duplicate to clean up. */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={!output}
              title="Copy to clipboard"
              aria-label="Copy to clipboard"
              className="absolute top-4 right-4 rounded border border-border bg-card p-2 text-foreground shadow-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>

      {/* SEO content */}
      <section className="mt-24 grid grid-cols-1 gap-12 border-t border-border pt-16 md:grid-cols-2">
        <div>
          <h3 className="mb-4 text-headline-md">What is Lorem Ipsum?</h3>
          <p className="mb-4 text-body-md text-muted-foreground">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry&apos;s standard dummy text ever since the 1500s, when an unknown printer took a galley of type
            and scrambled it to make a type specimen book.
          </p>
          <p className="text-body-md text-muted-foreground">
            It has survived not only five centuries, but also the leap into electronic typesetting, remaining
            essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing
            Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including
            versions of Lorem Ipsum.
          </p>
        </div>
        <div>
          <h3 className="mb-4 text-headline-md">History of dummy text</h3>
          <p className="mb-4 text-body-md text-muted-foreground">
            Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical
            Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at
            Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a
            Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the
            undoubtable source.
          </p>
          <p className="text-body-md text-muted-foreground">
            Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of &quot;de Finibus Bonorum et Malorum&quot; (The
            Extremes of Good and Evil) by Cicero, written in 45 BC.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16 rounded-lg bg-muted p-8">
        <h3 className="mb-6 text-center text-headline-md">Frequently Asked Questions</h3>
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group border-b border-border pb-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-label-sm font-medium">
                {item.question}
                <MaterialIcon
                  name="keyboard_arrow_down"
                  className="text-[20px] transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 pl-2 text-body-md text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
