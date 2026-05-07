import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

const VARIANTS: Record<Variant, string> = {
  default: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
  secondary: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
  success: "bg-success/12 text-success ring-1 ring-inset ring-success/25",
  warning: "bg-warning/12 text-warning ring-1 ring-inset ring-warning/25",
  destructive: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
  outline: "bg-transparent text-foreground ring-1 ring-inset ring-border",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-tight",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
