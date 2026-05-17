import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "accent";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gray-900 text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.25)] hover:bg-black active:bg-gray-950 focus-visible:ring-gray-900/30",
  secondary:
    "bg-white text-gray-900 border border-gray-200/90 shadow-sm hover:bg-gray-50 focus-visible:ring-gray-900/15",
  outline:
    "border border-gray-200/90 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-gray-900/15",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-900/10",
  accent:
    "bg-brand text-brand-foreground shadow-[0_4px_14px_-4px_rgba(13,148,136,0.35)] hover:bg-brand-dark focus-visible:ring-brand/40",
  destructive:
    "bg-destructive text-destructive-foreground shadow-[0_4px_14px_-4px_hsl(var(--destructive)/0.4)] hover:bg-destructive/90 focus-visible:ring-destructive/40",
  success:
    "bg-success text-success-foreground shadow-[0_4px_14px_-4px_hsl(var(--success)/0.4)] hover:bg-success/90 focus-visible:ring-success/40",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[13px] rounded-lg",
  md: "h-10 px-4 text-[13.5px] rounded-xl",
  lg: "h-11 px-6 text-[15px] rounded-xl",
  icon: "h-10 w-10 rounded-xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, href, ...props },
    ref,
  ) => {
    const classes = cn(
      "inline-flex select-none items-center justify-center gap-2 font-medium tracking-tight transition-all duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf8]",
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
