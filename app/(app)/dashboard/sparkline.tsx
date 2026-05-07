"use client";

import { cn } from "@/lib/utils";

interface Props {
  values: number[];
  className?: string;
  variant?: "primary" | "emerald" | "muted";
  showArea?: boolean;
}

export function Sparkline({
  values,
  className,
  variant = "primary",
  showArea = true,
}: Props) {
  if (!values.length) {
    return <div className={cn("h-8 w-full", className)} />;
  }
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const W = 100;
  const H = 30;

  const points = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * W;
    const y = H - ((v - min) / Math.max(1, max - min)) * H;
    return [x, y];
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const area =
    `M0,${H} ` +
    points.map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`).join(" ") +
    ` L${W},${H} Z`;

  const stroke =
    variant === "emerald"
      ? "stroke-emerald-500"
      : variant === "muted"
        ? "stroke-muted-foreground/60"
        : "stroke-primary";
  const fill =
    variant === "emerald"
      ? "fill-emerald-500/15"
      : variant === "muted"
        ? "fill-muted-foreground/10"
        : "fill-primary/15";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
    >
      {showArea && <path d={area} className={fill} />}
      <path
        d={path}
        className={cn("fill-none", stroke)}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1][0]}
          cy={points[points.length - 1][1]}
          r={1.5}
          className={cn("fill-background", stroke)}
          strokeWidth={1.2}
        />
      )}
    </svg>
  );
}
