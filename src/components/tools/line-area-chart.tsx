"use client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";

export interface LineAreaPoint {
  label: string;
  value: number;
}

const PLOT_HEIGHT = 220;
const LEFT_PADDING = 64;
const TOP_PADDING = 14; // room for the topmost gridline's value label, which sits centered on that line
const BOTTOM_PADDING = 24;

/** Mirrors StackedBarChart's niceStep — kept local since it's a tiny pure helper, not worth a shared-utils indirection for two call sites. */
function niceStep(max: number): number {
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough || 1));
  const residual = rough / magnitude;
  const niceResidual = residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1;
  return niceResidual * magnitude;
}

/**
 * Single-series line + area chart, per the dataviz skill: 2px round-join
 * line, ~10% opacity area wash, hairline recessive gridlines, no legend (one
 * series — the card title already names it), and a pointer/keyboard
 * crosshair + tooltip so every value stays reachable on hover or focus, not
 * gated behind it. Structurally mirrors StackedBarChart (SVG plot + a plain
 * positioned HTML tooltip div, not an SVG <title> — see that file's comment
 * on why React 19 breaks the native version).
 *
 * The y-axis always starts at 0, unlike the Chart.js mockup's
 * `beginAtZero: false` — an *area* fill encodes magnitude down to its
 * baseline, so a non-zero baseline would visually overstate the growth
 * curve. Deliberate deviation, not a fidelity gap.
 */
export function LineAreaChart({
  data,
  formatValue,
  ariaLabel,
}: {
  data: LineAreaPoint[];
  formatValue: (value: number) => string;
  ariaLabel?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const step = niceStep(maxValue);
  const axisMax = Math.ceil(maxValue / step) * step || step;
  const gridValues = Array.from({ length: Math.round(axisMax / step) + 1 }, (_, i) => i * step);

  const width = Math.max(data.length * 48, 360);
  const height = TOP_PADDING + PLOT_HEIGHT + BOTTOM_PADDING;
  const baselineY = TOP_PADDING + PLOT_HEIGHT;
  const xStep = data.length > 1 ? (width - LEFT_PADDING) / (data.length - 1) : 0;
  const xAt = (i: number) => LEFT_PADDING + xStep * i;
  const yAt = (value: number) => baselineY - (value / axisMax) * PLOT_HEIGHT;

  const linePath = data.map((point, i) => `${i === 0 ? "M" : "L"}${xAt(i)},${yAt(point.value)}`).join(" ");
  const areaPath = `${linePath} L${xAt(data.length - 1)},${baselineY} L${xAt(0)},${baselineY} Z`;

  // Thin x-axis labels to ≤8 evenly-spaced ticks (always including both
  // ends) so a long time span doesn't collide — a fixed stride would leave
  // a cramped near-duplicate between the last regular tick and a
  // force-included final one.
  const tickCount = Math.min(8, data.length);
  const labelIndices = new Set(
    Array.from({ length: tickCount }, (_, i) => Math.round((i * (data.length - 1)) / Math.max(tickCount - 1, 1))),
  );

  const active = activeIndex !== null ? data[activeIndex] : null;
  const activeLeftPercent = activeIndex !== null ? (xAt(activeIndex) / width) * 100 : 0;

  function trackPointer(event: ReactPointerEvent<SVGRectElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const index = xStep > 0 ? Math.round((x - LEFT_PADDING) / xStep) : 0;
    setActiveIndex(Math.min(data.length - 1, Math.max(0, index)));
  }

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={ariaLabel ?? "Line chart"}>
        {gridValues.map((value) => {
          const y = yAt(value);
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

        <path d={areaPath} className="fill-primary" opacity={0.1} />
        <path
          d={linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {active && (
          <>
            <line
              x1={xAt(activeIndex!)}
              y1={TOP_PADDING}
              x2={xAt(activeIndex!)}
              y2={baselineY}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={xAt(activeIndex!)}
              cy={yAt(active.value)}
              r={5}
              className="fill-primary stroke-card"
              strokeWidth={2}
            />
          </>
        )}

        {data.map((point, i) =>
          labelIndices.has(i) ? (
            <text
              key={point.label}
              x={xAt(i)}
              y={baselineY + 16}
              textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
              fontSize={10}
              className="fill-muted-foreground"
            >
              {point.label}
            </text>
          ) : null,
        )}

        {/* Full-plot hit area, bigger than the line itself, per the interaction spec's "hit target bigger than the mark." */}
        <rect
          x={LEFT_PADDING}
          y={TOP_PADDING}
          width={Math.max(width - LEFT_PADDING, 0)}
          height={PLOT_HEIGHT}
          fill="transparent"
          className="cursor-crosshair outline-none"
          tabIndex={0}
          onPointerMove={trackPointer}
          onPointerLeave={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(data.length - 1)}
          onBlur={() => setActiveIndex(null)}
        />
      </svg>

      {active && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-2 text-body-md whitespace-nowrap text-popover-foreground shadow-md"
          style={{ left: `${activeLeftPercent}%` }}
        >
          <p className="font-medium">{active.label}</p>
          <p className="text-muted-foreground">{formatValue(active.value)}</p>
        </div>
      )}
    </div>
  );
}
