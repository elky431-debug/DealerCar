"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  count?: number;
}

interface TabsNavProps {
  tabs: Tab[];
  className?: string;
}

export function TabsNav({ tabs, className }: TabsNavProps) {
  const pathname = usePathname();
  return (
    <div className={cn("px-5 pt-6 sm:px-10", className)}>
      <nav className="inline-flex flex-wrap items-center gap-1 rounded-full border border-border/60 bg-card p-1 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium tracking-tight transition-all duration-200",
                active
                  ? "tab-pill-active"
                  : "text-muted-foreground hover:bg-primary/[0.08] hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "inline-flex h-4 min-w-[20px] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold tabular",
                    active
                      ? "bg-white/25 text-white"
                      : "bg-foreground/[0.06] text-foreground/70",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
