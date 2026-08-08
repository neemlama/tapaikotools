"use client";

import { Download, QrCode as QrCodeIcon } from "lucide-react";
import QRCode from "qrcode";
import { useState } from "react";

import { CopyButton } from "@/components/tools/copy-button";
import { Panel } from "@/components/tools/panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SIZES = { Small: 200, Medium: 320, Large: 480 } as const;
type SizeKey = keyof typeof SIZES;

export function QrCodeGeneratorTool() {
  const [text, setText] = useState("");
  const [size, setSize] = useState<SizeKey>("Medium");
  const [dataUrl, setDataUrl] = useState("");
  const [generatedFor, setGeneratedFor] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!text.trim()) {
      setError("Enter some text or a URL first.");
      return;
    }
    try {
      const url = await QRCode.toDataURL(text, { width: SIZES[size], margin: 1 });
      setDataUrl(url);
      setGeneratedFor(text);
      setError(null);
    } catch {
      setError("Couldn't generate a QR code for that input.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel title="Content">
        <div className="flex flex-col gap-4">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Enter text or a URL…"
            rows={4}
          />
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="size">Size</Label>
              <Select
                id="size"
                value={size}
                onChange={(event) => setSize(event.target.value as SizeKey)}
                className="mt-2 w-36"
              >
                {Object.keys(SIZES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={handleGenerate}>
              <QrCodeIcon className="h-4 w-4" />
              Generate QR code
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-body-md text-destructive">
              {error}
            </p>
          )}
        </div>
      </Panel>

      {dataUrl && (
        <Panel title="QR code">
          <div className="flex flex-col items-center gap-4">
            {/* Locally generated data URL, not a remote/static asset — next/image adds no benefit here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt={`QR code encoding: ${generatedFor}`}
              className="rounded-md border border-border"
              width={SIZES[size]}
              height={SIZES[size]}
            />
            <div className="flex gap-2">
              <a href={dataUrl} download="qrcode.png" className={buttonVariants({ variant: "secondary" })}>
                <Download className="h-4 w-4" />
                Download PNG
              </a>
              <CopyButton value={generatedFor} />
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
