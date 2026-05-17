"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  badge?: "MVP+" | "V2";
}

const TABS: Tab[] = [
  { href: "/gestion/documents", label: "Documents & Admin", badge: "MVP+" },
  { href: "/gestion/ventes", label: "Historique des ventes", badge: "MVP+" },
  { href: "/gestion/annonces", label: "Annonces", badge: "MVP+" },
  { href: "/gestion/frais", label: "Frais & Réparations", badge: "MVP+" },
  { href: "/gestion/garage", label: "Mon garage", badge: "MVP+" },
  { href: "/gestion/sourcing", label: "Fournisseurs", badge: "V2" },
];

export function GestionTabs() {
  const pathname = usePathname();
  return (
    <div className="px-5 pt-6 sm:px-10">
      <nav className="dl-tabs-track flex-wrap rounded-2xl">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition-all duration-200",
                active ? "dl-tab-active" : "dl-tab-inactive",
              )}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    "inline-flex h-4 items-center rounded-full px-1.5 text-[9.5px] font-bold uppercase tracking-wider",
                    active
                      ? "bg-white/25 text-white"
                      : tab.badge === "V2"
                        ? "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200"
                        : "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
