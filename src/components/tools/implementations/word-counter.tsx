"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Textarea } from "@/components/ui/textarea";

/**
 * Hand-transcribed from the Stitch "Word Counter" screen rather than built
 * from the shared Panel/ResultCard/MiniStat/CopyButton pieces the other
 * tool pages use — this page's floating textarea toolbar, paired
 * Words/Characters tiles, and highlighted-last-row breakdown card don't
 * match those shared components' shape closely enough to reuse without
 * diverging from the design anyway. Same call as JsonFormatterTool; see
 * the `about`/faq-content.ts comments for the same reasoning applied to
 * the "How to use" / "What is a Word Counter?" copy below.
 */

const WORDS_PER_MINUTE = 225;

function computeStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed ? (trimmed.match(/[^.!?]*[.!?]+|[^.!?]+$/g)?.filter((s) => s.trim().length > 0).length ?? 0) : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;

  return { words, characters, charactersNoSpaces, sentences, paragraphs };
}

function readingTimeLabel(words: number): string {
  if (words === 0) return "0 min";
  if (words < WORDS_PER_MINUTE) return "< 1 min";
  return `~ ${Math.ceil(words / WORDS_PER_MINUTE)} min`;
}

export function WordCounterTool() {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const stats = useMemo(() => computeStats(text), [text]);

  async function handleCopy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const breakdownStats = [
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
  ];

  return (
    <div className="flex flex-col gap-12">
      <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="relative h-[500px] w-full rounded-xl border border-border bg-card transition-all focus-within:border-transparent focus-within:ring-2 focus-within:ring-ring">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type or paste your text here to begin counting…"
              className="h-full resize-none rounded-none border-0 bg-transparent px-6 py-6 text-body-lg focus:ring-0"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setText("")} disabled={!text}>
                <MaterialIcon name="delete" className="text-[16px]" />
                Clear
              </Button>
              <Button size="sm" onClick={handleCopy} disabled={!text}>
                <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[16px]" />
                {copied ? "Copied!" : "Copy Text"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-6">
              <span className="text-label-sm uppercase tracking-wider text-muted-foreground">Words</span>
              <span className="text-headline-lg text-primary">{stats.words}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-6">
              <span className="text-label-sm uppercase tracking-wider text-muted-foreground">Characters</span>
              <span className="text-headline-lg text-foreground">{stats.characters}</span>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            {breakdownStats.map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-border p-4">
                <span className="text-body-md font-medium">{item.label}</span>
                <span className="font-mono text-sm font-medium text-muted-foreground">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-muted p-4">
              <span className="flex items-center gap-2 text-body-md font-medium">
                <MaterialIcon name="schedule" className="text-[18px] text-primary" />
                Reading Time
              </span>
              <span className="font-mono text-sm font-medium text-primary">{readingTimeLabel(stats.words)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex max-w-3xl flex-col gap-12">
        <div className="flex flex-col gap-4">
          <h2 className="text-headline-lg">How to use the Word Counter</h2>
          <div className="flex flex-col gap-4 text-body-md text-muted-foreground">
            <p>
              Using the DailyTools Word Counter is straightforward and immediate. Simply type directly into the
              large text area above, or paste text you&apos;ve copied from another document, website, or
              application.
            </p>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>
                <strong className="text-foreground">Real-time Updates:</strong> As soon as you type or paste, the
                metrics panel on the right will update instantly.
              </li>
              <li>
                <strong className="text-foreground">Clearing Content:</strong> Use the &quot;Clear&quot; button to
                wipe the text area clean and reset all counters to zero.
              </li>
              <li>
                <strong className="text-foreground">Copying:</strong> Click the &quot;Copy Text&quot; button to
                quickly copy the entire contents of the text area to your clipboard.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-headline-lg">What is a Word Counter?</h2>
          <div className="flex flex-col gap-4 text-body-md text-muted-foreground">
            <p>
              A word counter is a digital utility designed to analyze a given body of text and provide quantitative
              data about its structure. While its primary function is determining the total number of words, modern
              word counters provide deeper insights.
            </p>
            <p>
              Professionals across various fields rely on word counts. Writers need to meet editorial guidelines;
              students have strict assignment length requirements; marketers optimize SEO descriptions based on
              character limits; and social media managers must stay within platform-specific constraints. Our tool
              provides all the necessary metrics—including character counts with and without spaces, sentence
              tallies, and estimated reading times—to ensure your text meets its specific requirements.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
