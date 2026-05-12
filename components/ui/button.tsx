import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-foreground text-background shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.3)] hover:bg-foreground/90 active:bg-foreground focus-visible:ring-foreground/30",
  secondary:
    "bg-card text-foreground border border-border/70 shadow-sm hover:bg-accent focus-visible:ring-ring/30",
  outline:
    "border border-border/80 bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/30",
  ghost:
    "hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-ring/20",
  destructive:
    "bg-destructive text-destructive-foreground shadow-[0_4px_14px_-4px_hsl(var(--destructive)/0.4)] hover:bg-destructive/90 focus-visible:ring-destructive/40",
  success:
    "bg-success text-success-foreground shadow-[0_4px_14px_-4px_hsl(var(--success)/0.4)] hover:bg-success/90 focus-visible:ring-success/40",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[13.5px]",
  lg: "h-12 px-6 text-[15px]",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Si défini, rend un lien Next avec les mêmes styles qu’un bouton. */
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, href, ...props },
    ref,
  ) => {
    const classes = cn(
      "inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium tracking-tight transition-all duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
      "active:scale-[0.98]",
      VARIANTS[variant],
      SIZES[size],
      className,
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} disabled={disabled || loading} className={classes} {...props}>
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
