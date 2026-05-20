"use client";

import { useId, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayDatum {
  date: string; // "YYYY-MM-DD"
  added: number;
  sold: number;
}

interface Props {
  days: DayDatum[];
  monthLabel: string; // ex. "Mai 2026"
  todayIndex: number | null; // index dans `days` correspondant à aujourd'hui (sinon null)
  className?: string;
}

const VIEW_W = 1000;

export function ActivityChart({ days, monthLabel, todayIndex, className }: Props) {
  const uid = useId().replace(/:/g, "");
  const gradAdded = `chart-added-${uid}`;
  const gradSold = `chart-sold-${uid}`;

  const [hovered, setHovered] = useState<number | null>(null);

  const totalAdded = days.reduce((s, d) => s + d.added, 0);
  const totalSold = days.reduce((s, d) => s + d.sold, 0);
  const max = useMemo(
    () => Math.max(1, ...days.map((d) => Math.max(d.added, d.sold))),
    [days],
  );
  const isEmpty = days.length === 0 || (totalAdded === 0 && totalSold === 0);

  const H = 200;
  const padX = 16;
  const padTop = 16;
  const padBottom = 12;
  const innerH = H - padTop - padBottom;
  const innerW = Math.max(1, VIEW_W - padX * 2);

  function px(i: number, value: number): [number, number] {
    const n = days.length;
    if (n === 0) return [padX, padTop + innerH];
    const x = n === 1 ? padX + innerW / 2 : padX + (i / (n - 1)) * innerW;
    const y = padTop + innerH - (value / max) * innerH;
    return [x, y];
  }

  const addedPoints = days.map((d, i) => px(i, d.added));
  const soldPoints = days.map((d, i) => px(i, d.sold));

  const baseline = padTop + innerH;
  const addedPath = monotonePath(addedPoints);
  const soldPath = monotonePath(soldPoints);
  const addedAreaSmooth = `${addedPath} L${padX + innerW},${baseline} L${padX},${baseline} Z`;
  const soldAreaSmooth = `${soldPath} L${padX + innerW},${baseline} L${padX},${baseline} Z`;

  const hoverXPercent =
    hovered != null && addedPoints[hovered]
      ? (addedPoints[hovered][0] / VIEW_W) * 100
      : null;

  // Étiquettes axe X : 1, 5, 10, 15, 20, 25, dernier jour
  const xLabels = useMemo(() => {
    if (days.length === 0) return [];
    const candidateDays = [1, 5, 10, 15, 20, 25, days.length];
    const seen = new Set<number>();
    return candidateDays
      .filter((d) => d >= 1 && d <= days.length && !seen.has(d) && seen.add(d))
      .map((d) => ({ day: d, leftPct: ((d - 1) / Math.max(1, days.length - 1)) * 100 }));
  }, [days.length]);

  return (
    <div className={cn("min-w-0 space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Activité — <span className="capitalize">{monthLabel}</span>
          </p>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[14px]">
            <Legend dot="bg-brand" count={totalAdded} label="ajouté" />
            <Legend dot="bg-foreground" count={totalSold} label="vendu" />
          </p>
        </div>
        {!isEmpty && (
          <p className="text-[11.5px] tabular text-muted-foreground/80">
            Pic <span className="font-semibold text-foreground">{max}</span> /jour
          </p>
        )}
      </div>

      {/* Chart */}
      <div className="relative w-full min-w-0">
        <div className="relative w-full" style={{ height: H }}>
          {/* Y-axis indicator (max value) */}
          {!isEmpty && (
            <div
              className="pointer-events-none absolute right-0 z-[2] -translate-y-1/2 rounded-full bg-card px-1.5 text-[10px] font-medium tabular text-muted-foreground/80"
              style={{ top: padTop }}
            >
              {max}
            </div>
          )}

          {/* Grid (4 horizontal guides) */}
          <div
            className="pointer-events-none absolute inset-0 flex flex-col justify-between"
            style={{ paddingTop: padTop, paddingBottom: padBottom }}
          >
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-px w-full border-t border-dashed border-border/40" />
            ))}
          </div>

          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${VIEW_W} ${H}`}
            preserveAspectRatio="none"
            className="relative z-[1] block w-full overflow-visible"
            role="img"
            aria-label={`Graphique d'activité quotidienne pour ${monthLabel}`}
          >
            <defs>
              <linearGradient id={gradAdded} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--dl-brand-rgb))" stopOpacity="0.28" />
                <stop offset="100%" stopColor="rgb(var(--dl-brand-rgb))" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={gradSold} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(15 23 42)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="rgb(15 23 42)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* "Aujourd'hui" : ligne verticale subtile */}
            {todayIndex != null && days[todayIndex] && (
              <g>
                <line
                  x1={addedPoints[todayIndex][0]}
                  x2={addedPoints[todayIndex][0]}
                  y1={padTop}
                  y2={padTop + innerH}
                  stroke="rgb(15 23 42)"
                  strokeOpacity={0.08}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )}

            {!isEmpty && (
              <>
                {/* Areas (cachées si la série est plate à 0) */}
                {totalAdded > 0 && (
                  <path d={addedAreaSmooth} fill={`url(#${gradAdded})`} />
                )}
                {totalSold > 0 && (
                  <path d={soldAreaSmooth} fill={`url(#${gradSold})`} />
                )}

                {/* Lines (dessinées seulement si série non plate) */}
                {totalAdded > 0 && (
                  <path
                    d={addedPath}
                    fill="none"
                    stroke="rgb(var(--dl-brand-rgb))"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: 1,
                      animation: "chart-line-draw 1s cubic-bezier(.4,0,.2,1) 0.05s forwards",
                    }}
                  />
                )}
                {totalSold > 0 && (
                  <path
                    d={soldPath}
                    fill="none"
                    stroke="rgb(15 23 42)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                    style={{
                      strokeDasharray: 1,
                      strokeDashoffset: 1,
                      animation: "chart-line-draw 1s cubic-bezier(.4,0,.2,1) 0.18s forwards",
                    }}
                  />
                )}

                {/* Dots aux jours non-zéro */}
                {addedPoints.map(([x, y], i) =>
                  days[i].added > 0 ? (
                    <g key={`a${i}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={hovered === i ? 7 : 5}
                        fill="rgb(var(--dl-brand-rgb))"
                        fillOpacity={hovered === i ? 0.18 : 0.12}
                        className="transition-all"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={hovered === i ? 4.5 : 3.2}
                        fill="rgb(var(--dl-brand-rgb))"
                        stroke="rgb(255 255 255)"
                        strokeWidth={1.5}
                        className="transition-all"
                        style={{
                          animation: `chart-dot-in 0.35s ease-out ${0.55 + i * 0.015}s backwards`,
                        }}
                      />
                    </g>
                  ) : null,
                )}
                {soldPoints.map(([x, y], i) =>
                  days[i].sold > 0 ? (
                    <g key={`s${i}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={hovered === i ? 7 : 5}
                        fill="rgb(15 23 42)"
                        fillOpacity={hovered === i ? 0.16 : 0.1}
                        className="transition-all"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={hovered === i ? 4.5 : 3.2}
                        fill="rgb(15 23 42)"
                        stroke="rgb(255 255 255)"
                        strokeWidth={1.5}
                        className="transition-all"
                        style={{
                          animation: `chart-dot-in 0.35s ease-out ${0.65 + i * 0.015}s backwards`,
                        }}
                      />
                    </g>
                  ) : null,
                )}

                {/* Crosshair sur hover */}
                {hovered != null && addedPoints[hovered] && (
                  <line
                    x1={addedPoints[hovered][0]}
                    x2={addedPoints[hovered][0]}
                    y1={padTop}
                    y2={padTop + innerH}
                    stroke="rgb(15 23 42)"
                    strokeOpacity={0.18}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Hit areas */}
                {days.map((_, i) => {
                  const cx = addedPoints[i][0];
                  const half = innerW / Math.max(1, days.length - 1) / 2;
                  return (
                    <rect
                      key={i}
                      x={cx - half}
                      y={0}
                      width={half * 2}
                      height={H}
                      fill="transparent"
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      style={{ cursor: "pointer" }}
                    />
                  );
                })}
              </>
            )}
          </svg>

          {hovered != null && !isEmpty && days[hovered] && hoverXPercent != null && (
            <Tooltip datum={days[hovered]} xPercent={hoverXPercent} />
          )}

          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl border border-dashed border-border/70 bg-background/80 px-4 py-3 text-center backdrop-blur-sm">
                <TrendingUp className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Pas encore d'activité ce mois-ci.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Axe X — jours du mois */}
        <div className="relative mt-2 h-4 w-full">
          {xLabels.map(({ day, leftPct }) => (
            <span
              key={day}
              className={cn(
                "absolute -translate-x-1/2 text-[10.5px] font-medium tabular",
                todayIndex != null && day === todayIndex + 1
                  ? "text-foreground"
                  : "text-muted-foreground/70",
              )}
              style={{ left: `${leftPct}%` }}
            >
              {day}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tooltip({ datum, xPercent }: { datum: DayDatum; xPercent: number }) {
  const date = new Date(datum.date);
  const formatted = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const isRightHalf = xPercent > 62;
  return (
    <div
      className="pointer-events-none absolute -top-1 z-10 whitespace-nowrap rounded-lg border border-border/60 bg-card px-3 py-2 text-[12px] shadow-lg"
      style={
        isRightHalf
          ? {
              right: `${100 - xPercent}%`,
              transform: "translateX(50%) translateY(-100%) translateY(-4px)",
            }
          : {
              left: `${xPercent}%`,
              transform: "translateX(-50%) translateY(-100%) translateY(-4px)",
            }
      }
    >
      <p className="mb-1 font-semibold capitalize tracking-tight">{formatted}</p>
      <div className="space-y-0.5">
        <p className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          <span className="tabular font-semibold">{datum.added}</span>
          <span className="text-muted-foreground">
            ajouté{datum.added > 1 ? "s" : ""}
          </span>
        </p>
        <p className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          <span className="tabular font-semibold">{datum.sold}</span>
          <span className="text-muted-foreground">
            vendu{datum.sold > 1 ? "s" : ""}
          </span>
        </p>
      </div>
    </div>
  );
}

function Legend({ dot, count, label }: { dot: string; count: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
      <span className="tabular font-semibold text-foreground">{count}</span>
      <span className="text-muted-foreground">
        {label}
        {count > 1 ? "s" : ""}
      </span>
    </span>
  );
}

/**
 * Interpolation cubique monotone (Fritsch–Carlson) :
 * - Courbe lissée mais sans overshoot (contrairement à Catmull-Rom).
 * - Idéal pour des séries clairsemées avec des sauts brusques.
 */
function monotonePath(points: [number, number][]): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0][0]},${points[0][1]}`;
  if (n === 2) return `M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]}`;

  const dx: number[] = [];
  const dy: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dxi = points[i + 1][0] - points[i][0];
    const dyi = points[i + 1][1] - points[i][1];
    dx.push(dxi);
    dy.push(dyi);
    slope.push(dxi === 0 ? 0 : dyi / dxi);
  }

  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) m.push(0);
    else m.push((slope[i - 1] + slope[i]) / 2);
  }
  m.push(slope[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / slope[i];
      const b = m[i + 1] / slope[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        const t = 3 / h;
        m[i] = t * a * slope[i];
        m[i + 1] = t * b * slope[i];
      }
    }
  }

  let path = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = points[i][0] + dx[i] / 3;
    const y1 = points[i][1] + (m[i] * dx[i]) / 3;
    const x2 = points[i + 1][0] - dx[i] / 3;
    const y2 = points[i + 1][1] - (m[i + 1] * dx[i]) / 3;
    path += ` C${x1.toFixed(2)},${y1.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)} ${points[i + 1][0]},${points[i + 1][1]}`;
  }
  return path;
}
