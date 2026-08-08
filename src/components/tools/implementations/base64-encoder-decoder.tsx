"use client";

import { useMemo, useState } from "react";

import { CodeOutput } from "@/components/tools/code-output";
import { Panel } from "@/components/tools/panel";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Correct for any UTF-8 text (emoji, non-Latin scripts, ...) — plain btoa() throws on those. */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

type Mode = "encode" | "decode";

export function Base64EncoderDecoderTool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");

  const { output, error } = useMemo(() => {
    if (!input) return { output: "", error: null as string | null };
    try {
      return { output: mode === "encode" ? encodeBase64(input) : decodeBase64(input), error: null };
    } catch {
      return { output: "", error: "That's not valid Base64." };
    }
  }, [input, mode]);

  return (
    <div className="flex flex-col gap-6">
      <div className="inline-flex w-fit items-center gap-1 rounded-md border border-border p-1">
        {(["encode", "decode"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={cn(
              "rounded px-3 py-1.5 text-body-md capitalize",
              mode === option
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={mode === "encode" ? "Text" : "Base64"}>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={mode === "encode" ? "Type or paste text here…" : "Paste Base64 here…"}
            rows={12}
            className="font-mono text-sm"
          />
        </Panel>
        <Panel title={mode === "encode" ? "Base64" : "Text"}>
          {error ? (
            <p role="alert" className="text-body-md text-destructive">
              {error}
            </p>
          ) : (
            <CodeOutput value={output} placeholder="Output will appear here." minHeight="18rem" />
          )}
        </Panel>
      </div>
    </div>
  );
}
