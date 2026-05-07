import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-col gap-4 px-5 pb-6 pt-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-10 sm:pb-8 sm:pt-12">
        <div className="min-w-0">
          {eyebrow && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {eyebrow}
            </span>
          )}
          <h1 className="display-font text-balance text-[30px] font-semibold leading-[1.05] tracking-tight text-foreground sm:text-[36px]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function PageBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-in px-5 pb-12 sm:px-10", className)}
      {...props}
    />
  );
}
