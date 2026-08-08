"use client";

import { useState } from "react";

import { CodeOutput } from "@/components/tools/code-output";
import { Faq } from "@/components/tools/faq";
import { Panel } from "@/components/tools/panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SAMPLE = '{\n  "name": "DailyTools",\n  "tools": ["JSON Formatter", "Password Generator"]\n}';

export function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<2 | 4>(2);

  function format(minify: boolean) {
    if (!input.trim()) {
      setError("Paste some JSON first.");
      setOutput("");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(input);
      setOutput(minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON.");
      setOutput("");
    }
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => format(false)}>Format</Button>
        <Button variant="secondary" onClick={() => format(true)}>
          Minify
        </Button>
        <Button variant="ghost" onClick={handleClear}>
          Clear
        </Button>
        <Button variant="ghost" onClick={() => setInput(SAMPLE)}>
          Load sample
        </Button>

        <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-1">
          {([2, 4] as const).map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setIndent(size)}
              className={cn(
                "rounded px-2 py-1 text-label-sm",
                indent === size
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {size} spaces
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-md text-destructive"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Input">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste JSON here…"
            rows={16}
            className="font-mono text-sm"
          />
        </Panel>
        <Panel title="Output">
          <CodeOutput value={output} placeholder="Formatted JSON will appear here." minHeight="24rem" />
        </Panel>
      </div>

      <Faq
        items={[
          {
            question: "Is my JSON uploaded anywhere?",
            answer:
              "No — formatting happens entirely in your browser. Nothing you paste here is sent to a server.",
          },
          {
            question: "What happens if my JSON is invalid?",
            answer:
              "You'll get the parser's error message instead of output, so you can see roughly where the syntax problem is.",
          },
        ]}
      />
    </div>
  );
}
