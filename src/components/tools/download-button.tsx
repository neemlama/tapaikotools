"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Client-side text-file download — no server round trip needed for any of these tools' output. */
export function DownloadButton({
  value,
  filename,
  mimeType = "text/plain",
}: {
  value: string;
  filename: string;
  mimeType?: string;
}) {
  function handleDownload() {
    if (!value) return;
    const blob = new Blob([value], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={handleDownload}
      disabled={!value}
      aria-label={`Download ${filename}`}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
