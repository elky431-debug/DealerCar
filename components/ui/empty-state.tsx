import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card px-6 py-24 text-center shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]",
        className,
      )}
    >
      {icon && (
        <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-[0_8px_20px_-8px_hsl(var(--foreground)/0.4)]">
          {icon}
          <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
        </div>
      )}
      <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
