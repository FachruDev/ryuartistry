"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// The CMS is always light, so chart colors can be fixed values from the Naga palette.
const SERIES = "#2f4f8f"; // --glow
const PREVIOUS = "#b4b1a6";
const GRID = "#e7e4da";

export const compact = (n: number) =>
  new Intl.NumberFormat("id-ID", { notation: n >= 10_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow * 4 >= value) ?? 10;
  return step * pow * 4;
}

export type TrendPoint = { label: string; value: number; previous?: number; detail?: string };

/** Area chart for one measure over time, with the previous period as a quiet reference line. */
export function TrendChart({ points, name, previousName = "Periode sebelumnya", height = 260 }: {
  points: TrendPoint[];
  name: string;
  previousName?: string;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 12, right: 12, bottom: 28, left: 40 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const hasPrevious = points.some((p) => p.previous !== undefined);
  const max = niceMax(Math.max(1, ...points.map((p) => Math.max(p.value, p.previous ?? 0))));
  const x = (i: number) => pad.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const line = (key: "value" | "previous") =>
    points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p[key] ?? 0).toFixed(1)}`).join("");
  const area = `${line("value")}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 64))));
  const h = hover !== null ? points[hover] : null;

  return (
    <div>
      {hasPrevious && (
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: SERIES }} /> {name}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: PREVIOUS }} /> {previousName}
          </span>
        </div>
      )}
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className="block touch-none"
            role="img"
            aria-label={`${name}: ${points.map((p) => `${p.label} ${p.value}`).join(", ")}`}
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const rel = (e.clientX - rect.left - pad.left) / Math.max(1, innerW);
              setHover(Math.min(points.length - 1, Math.max(0, Math.round(rel * (points.length - 1)))));
            }}
            onPointerLeave={() => setHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={GRID} />
                <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
                  {compact(t)}
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              (i % labelEvery === 0 && points.length - 1 - i >= labelEvery / 2) || i === points.length - 1 ? (
                <text
                  key={p.label}
                  x={x(i)}
                  y={height - 8}
                  textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
                  className="fill-muted text-[11px]"
                >
                  {p.label}
                </text>
              ) : null,
            )}
            <path d={area} fill={SERIES} fillOpacity={0.1} />
            {hasPrevious && <path d={line("previous")} fill="none" stroke={PREVIOUS} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
            <path d={line("value")} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {hover !== null && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#14213d" strokeOpacity={0.25} />
                <circle cx={x(hover)} cy={y(points[hover].value)} r={4.5} fill={SERIES} stroke="#fbfaf6" strokeWidth={2} />
              </>
            )}
            {hover === null && points.length > 0 && (
              <circle cx={x(points.length - 1)} cy={y(points[points.length - 1].value)} r={4} fill={SERIES} stroke="#fbfaf6" strokeWidth={2} />
            )}
          </svg>
        )}
        {h && hover !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border border-line bg-paper-raised px-3 py-2 text-xs shadow-lg"
            style={{ left: Math.min(Math.max(x(hover) - 72, 0), Math.max(0, width - 150)) }}
          >
            <p className="font-semibold text-muted">{h.label}</p>
            <p className="mt-1 flex items-center gap-2">
              <span className="h-0.5 w-3 rounded-full" style={{ background: SERIES }} />
              <span className="text-sm font-bold text-ink">{h.value.toLocaleString("id-ID")}</span>
              <span className="text-muted">{name.toLowerCase()}</span>
            </p>
            {h.previous !== undefined && (
              <p className="mt-0.5 flex items-center gap-2">
                <span className="h-0.5 w-3 rounded-full" style={{ background: PREVIOUS }} />
                <span className="font-semibold text-ink">{h.previous.toLocaleString("id-ID")}</span>
                <span className="text-muted">sebelumnya</span>
              </p>
            )}
            {h.detail && <p className="mt-1 text-muted">{h.detail}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** 14-ish point trend line for stat tiles; the last point is emphasized. */
export function Sparkline({ values, className = "" }: { values: number[]; className?: string }) {
  const w = 120;
  const h = 32;
  const max = Math.max(1, ...values);
  const x = (i: number) => (values.length <= 1 ? w : (i / (values.length - 1)) * (w - 4) + 2);
  const y = (v: number) => h - 3 - (v / max) * (h - 6);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-8 w-full ${className}`} preserveAspectRatio="none" aria-hidden>
      <path d={`${d}L${x(values.length - 1)},${h}L${x(0)},${h}Z`} fill={SERIES} fillOpacity={0.08} />
      <path d={d} fill="none" stroke={SERIES} strokeOpacity={0.55} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export type BarRow = { key: string; label: ReactNode; value: number; detail?: string; href?: string };

/** Ranked list where each row's background bar shows its share of the leader. */
export function BarList({ rows, valueLabel, empty = "Belum ada data." }: { rows: BarRow[]; valueLabel: string; empty?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div>
      <div className="mb-2 flex justify-between text-[11px] font-semibold uppercase tracking-[0.06em] text-muted/80">
        <span />
        <span>{valueLabel}</span>
      </div>
      <ul className="space-y-1">
        {rows.map((r) => {
          const inner = (
            <>
              <span
                className="absolute inset-y-0 left-0 rounded-md bg-mizu/60 transition-[width] duration-500"
                style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
              />
              <span className="relative min-w-0 flex-1 truncate">{r.label}</span>
              {r.detail && <span className="relative hidden shrink-0 text-xs text-muted sm:inline">{r.detail}</span>}
              <span className="relative w-12 shrink-0 text-right font-semibold tabular-nums">{compact(r.value)}</span>
            </>
          );
          const cls = "relative flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm";
          return (
            <li key={r.key} title={`${typeof r.label === "string" ? r.label : r.key}: ${r.value.toLocaleString("id-ID")} ${valueLabel.toLowerCase()}`}>
              {r.href ? (
                <a href={r.href} className={`${cls} hover:bg-ink/[0.04]`}>
                  {inner}
                </a>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const DAY_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Weekday × hour grid (WIB). One hue, light to dark by number of views. */
export function HourHeatmap({ cells }: { cells: { dow: number; hour: number; views: number }[] }) {
  const [hover, setHover] = useState<{ dow: number; hour: number; views: number } | null>(null);
  const grid = new Map(cells.map((c) => [`${c.dow}-${c.hour}`, c.views]));
  const max = Math.max(1, ...cells.map((c) => c.views));
  const steps = [0.08, 0.25, 0.45, 0.7, 1];
  const shade = (v: number) => (v === 0 ? 0 : steps[Math.min(steps.length - 1, Math.floor((v / max) * (steps.length - 0.001)))]);

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[2px]" onPointerLeave={() => setHover(null)}>
          <span />
          {Array.from({ length: 24 }, (_, h) => (
            <span key={h} className="pb-1 text-center text-[10px] tabular-nums text-muted">
              {h % 3 === 0 ? String(h).padStart(2, "0") : ""}
            </span>
          ))}
          {DAY_SHORT.map((day, d) => (
            <div key={day} className="contents">
              <span className="pr-2 text-right text-[11px] leading-[22px] text-muted">{day}</span>
              {Array.from({ length: 24 }, (_, hour) => {
                const views = grid.get(`${d + 1}-${hour}`) ?? 0;
                const o = shade(views);
                return (
                  <span
                    key={hour}
                    tabIndex={views ? 0 : -1}
                    onPointerEnter={() => setHover({ dow: d, hour, views })}
                    onFocus={() => setHover({ dow: d, hour, views })}
                    className="h-[22px] rounded-[4px] outline-offset-1"
                    style={{ background: o ? `rgb(47 79 143 / ${o})` : GRID }}
                    aria-label={`${day} ${hour}.00: ${views} tayangan`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {hover
            ? `${DAY_SHORT[hover.dow]}, ${String(hover.hour).padStart(2, "0")}.00–${String(hover.hour).padStart(2, "0")}.59 WIB · ${hover.views} tayangan`
            : "Arahkan ke kotak untuk melihat jumlah tayangan."}
        </span>
        <span className="inline-flex items-center gap-1">
          Sepi
          {steps.map((s) => (
            <span key={s} className="size-3 rounded-[3px]" style={{ background: `rgb(47 79 143 / ${s})` }} />
          ))}
          Ramai
        </span>
      </div>
    </div>
  );
}
