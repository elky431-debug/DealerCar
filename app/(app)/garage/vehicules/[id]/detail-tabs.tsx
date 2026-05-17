"use client";

import Link from "next/link";
import { Info, Wallet, FileText, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Icônes serializable-safe pour les tabs.
 * On passe une `iconKey` (string) depuis le Server Component et on
 * la résout ici côté client. Évite l'erreur "Functions cannot be passed
 * directly to Client Components".
 */
const ICONS: Record<string, LucideIcon> = {
  info: Info,
  wallet: Wallet,
  document: FileText,
  users: Users,
};

interface Tab {
  id: string;
  label: string;
  count?: number;
  iconKey?: keyof typeof ICONS;
}

interface Props {
  base: string;
  active: string;
  tabs: Tab[];
}

export function VehicleDetailTabs({ base, active, tabs }: Props) {
  return (
    <div className="sticky top-0 z-20 -mt-2 border-b page-header-bar">
      <nav className="flex gap-0.5 overflow-x-auto px-5 sm:px-10">
        {tabs.map((t) => {
          const isActive = active === t.id;
          const href = t.id === "details" ? base : `${base}?tab=${t.id}`;
          const Icon = t.iconKey ? ICONS[t.iconKey] : null;
          return (
            <Link
              key={t.id}
              href={href}
              scroll={false}
              className={cn(
                "group relative flex shrink-0 items-center gap-2 px-3 py-3.5 text-[13.5px] font-medium tracking-tight transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground/70 group-hover:text-foreground",
                  )}
                />
              )}
              {t.label}
              {typeof t.count === "number" && t.count > 0 && (
                <span
                  className={cn(
                    "min-w-[18px] rounded-full px-1.5 py-0.5 text-center text-[10.5px] font-semibold leading-none tabular-nums",
                    isActive
                      ? "bg-primary/12 text-primary ring-1 ring-inset ring-primary/15"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.count}
                </span>
              )}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-foreground"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
