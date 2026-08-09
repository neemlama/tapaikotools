"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Small icon-only copy button, per the design system's "Copy Buttons"
 * spec. Feedback (check icon) is driven entirely from the click handler,
 * not an effect, so there's no mount-time state to worry about.
 */
export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={handleCopy}
      disabled={!value}
      aria-label="Copy to clipboard"
      className={className}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
