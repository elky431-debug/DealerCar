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
      <div className="flex flex-col gap-4 px-5 pb-6 pt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:px-10 sm:pb-8 sm:pt-12">
        <div className="min-w-0">
          {eyebrow && (
            <span className="dl-eyebrow mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              {eyebrow}
            </span>
          )}
          <h1 className="display-font text-balance text-[28px] font-bold leading-[1.08] tracking-[-0.02em] text-gray-900 sm:text-[34px]">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-gray-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </div>
  );
}

export function PageBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-in px-5 pb-12 sm:px-10", className)} {...props} />
  );
}
