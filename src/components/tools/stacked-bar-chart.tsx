"use client";

import { useState } from "react";

export interface StackedBarSegment {
  label: string;
  value: number;
  /** Tailwind fill-* class, e.g. "fill-chart-principal" — kept as a class so light/dark resolves via CSS, not JS. */
  fillClassName: string;
  swatchClassName: string;
}

export interface StackedBarDatum {
  label: string;
  segments: StackedBarSegment[]; // same order/labels across every datum
}

const PLOT_HEIGHT = 220;
const BAR_MAX_WIDTH = 24;
const LEFT_PADDING = 56;
const BOTTOM_PADDING = 24;
const SEGMENT_GAP = 2;
const CORNER_RADIUS = 4;

function niceStep(max: number): number {
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough || 1));
  const residual = rough / magnitude;
  const niceResidual = residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1;
  return niceResidual * magnitude;
}

/** Rounded-top, square-baseline rect path — matches the dataviz mark spec (data-end rounded, baseline square). */
function roundedTopPath(x: number, y: number, width: number, height: number) {
  const r = Math.min(CORNER_RADIUS, height, width / 2);
  if (r <= 0) return `M${x},${y} h${width} v${height} h${-width} Z`;
  return `M${x},${y + height} V${y + r} Q${x},${y} ${x + r},${y} H${x + width - r} Q${x + width},${y} ${x + width},${y + r} V${y + height} Z`;
}

/**
 * Stacked bar/column chart per the dataviz skill: fixed-order categorical
 * color per segment, 2px surface gap between stacked segments (the gap is
 * just unpainted space — the panel background shows through), 4px rounded
 * top on the outermost segment only, square baseline, hairline recessive
 * gridlines, a legend (2 series), and a real hover/focus tooltip.
 *
 * Tooltips are a plain positioned HTML <div>, not an SVG <title> child —
 * React 19 hoists any <title> element it finds anywhere in the tree
 * (including inside an <svg>) into <head> as document metadata and empties
 * it in place, which silently breaks the native SVG tooltip mechanism.
 * Confirmed by inspecting the rendered HTML before shipping this.
 */
export function StackedBarChart({
  data,
  formatValue,
}: {
  data: StackedBarDatum[];
  formatValue: (value: number) => string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const totals = data.map((datum) => datum.segments.reduce((sum, seg) => sum + seg.value, 0));
  const maxTotal = Math.max(...totals, 1);
  const step = niceStep(maxTotal);
  const axisMax = Math.ceil(maxTotal / step) * step || step;
  const gridValues = Array.from({ length: Math.round(axisMax / step) + 1 }, (_, i) => i * step);

  const width = Math.max(data.length * 44, 360);
  const barSlot = (width - LEFT_PADDING) / data.length;
  const barWidth = Math.min(BAR_MAX_WIDTH, barSlot * 0.55);

  const active = activeIndex !== null ? data[activeIndex] : null;
  const activeLeftPercent =
    activeIndex !== null ? ((LEFT_PADDING + barSlot * (activeIndex + 0.5)) / width) * 100 : 0;

  function clearIfActive(index: number) {
    setActiveIndex((current) => (current === index ? null : current));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4">
        {data[0].segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2 text-body-md text-foreground">
            <span className={`h-2.5 w-4 rounded-sm ${segment.swatchClassName}`} />
            {segment.label}
          </div>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${PLOT_HEIGHT + BOTTOM_PADDING}`}
          className="w-full"
          role="img"
          aria-label="Wealth growth projection by year"
        >
          {gridValues.map((value) => {
            const y = PLOT_HEIGHT - (value / axisMax) * PLOT_HEIGHT;
            return (
              <g key={value}>
                <line x1={LEFT_PADDING} y1={y} x2={width} y2={y} stroke="var(--color-border)" strokeWidth={1} />
                <text
                  x={LEFT_PADDING - 8}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={10}
                  className="fill-muted-foreground"
                >
                  {formatValue(value)}
                </text>
              </g>
            );
          })}

          {data.map((datum, i) => {
            const x = LEFT_PADDING + barSlot * i + (barSlot - barWidth) / 2;
            let cursorY = PLOT_HEIGHT;

            return (
              <g
                key={datum.label}
                tabIndex={0}
                // Added 2026-08-09 (Phase C follow-up): `outline-none` with no
                // replacement left this bar keyboard-focusable (tabIndex=0,
                // drives the hover tooltip via onFocus) but invisible when
                // focused — same bug class as .range-slider's fix in
                // globals.css. `.chart-bar-group:focus-visible` (a plain CSS
                // rule, not Tailwind's `outline`/`ring` utilities) because
                // Tailwind's bare `outline` utility didn't reliably set
                // `outline-style` on this SVG `<g>` in testing, and
                // box-shadow-based `ring` utilities don't render on SVG
                // shape/group elements at all.
                className="chart-bar-group cursor-pointer outline-none"
                onPointerEnter={() => setActiveIndex(i)}
                onPointerLeave={() => clearIfActive(i)}
                onFocus={() => setActiveIndex(i)}
                onBlur={() => clearIfActive(i)}
              >
                {datum.segments.map((segment, segmentIndex) => {
                  const segmentHeight = axisMax > 0 ? (segment.value / axisMax) * PLOT_HEIGHT : 0;
                  const y = cursorY - segmentHeight;
                  const isOutermost = segmentIndex === datum.segments.length - 1;
                  cursorY = y - SEGMENT_GAP;
                  const dim = activeIndex !== null && activeIndex !== i;

                  return isOutermost ? (
                    <path
                      key={segment.label}
                      d={roundedTopPath(x, y, barWidth, Math.max(segmentHeight, 0))}
                      className={`${segment.fillClassName} transition-opacity`}
                      opacity={dim ? 0.5 : 1}
                    />
                  ) : (
                    <rect
                      key={segment.label}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(segmentHeight, 0)}
                      className={`${segment.fillClassName} transition-opacity`}
                      opacity={dim ? 0.5 : 1}
                    />
                  );
                })}
                <text
                  x={x + barWidth / 2}
                  y={PLOT_HEIGHT + 16}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-muted-foreground"
                >
                  {datum.label}
                </text>
              </g>
            );
          })}
        </svg>

        {active && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-3 py-2 text-body-md whitespace-nowrap text-popover-foreground shadow-md"
            style={{ left: `${activeLeftPercent}%` }}
          >
            <p className="font-medium">{active.label}</p>
            {active.segments.map((segment) => (
              <p key={segment.label} className="text-muted-foreground">
                {segment.label}: {formatValue(segment.value)}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
