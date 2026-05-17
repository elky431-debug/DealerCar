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
      <nav className="dl-tabs-track">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium tracking-tight transition-all duration-200",
                active ? "dl-tab-active" : "dl-tab-inactive",
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "inline-flex h-4 min-w-[20px] items-center justify-center rounded-full px-1 text-[10.5px] font-semibold tabular",
                    active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600",
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
