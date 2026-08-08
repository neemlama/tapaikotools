"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { CodeOutput } from "@/components/tools/code-output";
import { Faq } from "@/components/tools/faq";
import { Panel } from "@/components/tools/panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { secureRandomInt } from "@/lib/random";

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

type Unit = "words" | "sentences" | "paragraphs";

function generate(unit: Unit, count: number, startWithLorem: boolean): string {
  const safeCount = Math.min(200, Math.max(1, count));

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

  const paragraphs: string[] = [];
  for (let i = 0; i < safeCount; i++) {
    paragraphs.push(randomParagraph(startWithLorem && i === 0 ? CLASSIC_SENTENCE : undefined));
  }
  return paragraphs.join("\n\n");
}

export function LoremIpsumGeneratorTool() {
  const [unit, setUnit] = useState<Unit>("paragraphs");
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Options">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <Label htmlFor="count">How many</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="mt-2 w-24"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select
              id="unit"
              value={unit}
              onChange={(event) => setUnit(event.target.value as Unit)}
              className="mt-2 w-36"
            >
              <option value="words">Words</option>
              <option value="sentences">Sentences</option>
              <option value="paragraphs">Paragraphs</option>
            </Select>
          </div>
          <Checkbox
            id="start-with-lorem"
            label={'Start with "Lorem ipsum..."'}
            checked={startWithLorem}
            onChange={(event) => setStartWithLorem(event.target.checked)}
          />
          <Button onClick={() => setOutput(generate(unit, count, startWithLorem))}>
            <RefreshCw className="h-4 w-4" />
            {output ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </Panel>

      <Panel title="Generated text">
        <CodeOutput
          value={output}
          placeholder="Click generate to create placeholder text."
          minHeight="14rem"
          mono={false}
        />
      </Panel>

      <Faq
        items={[
          {
            question: "Why use Lorem Ipsum instead of real text?",
            answer:
              "It has a natural-looking distribution of letters and word lengths without being distractingly readable, so it doesn't pull attention away from a layout or design during review.",
          },
        ]}
      />
    </div>
  );
}
