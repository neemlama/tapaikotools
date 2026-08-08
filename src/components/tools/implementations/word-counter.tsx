"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/tools/panel";
import { Textarea } from "@/components/ui/textarea";

const WORDS_PER_MINUTE = 200;

function computeStats(text: string) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const sentences = trimmed ? (trimmed.match(/[^.!?]*[.!?]+|[^.!?]+$/g)?.filter((s) => s.trim().length > 0).length ?? 0) : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length : 0;
  const readingMinutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));

  return { words, characters, charactersNoSpaces, sentences, paragraphs, readingMinutes };
}

export function WordCounterTool() {
  const [text, setText] = useState("");
  const stats = useMemo(() => computeStats(text), [text]);

  const statItems: { label: string; value: number | string }[] = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Reading time", value: text.trim() ? `${stats.readingMinutes} min` : "—" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Your text">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste or type your text here…"
          rows={14}
        />
      </Panel>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statItems.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-headline-md">{item.value}</p>
            <p className="mt-1 text-label-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
