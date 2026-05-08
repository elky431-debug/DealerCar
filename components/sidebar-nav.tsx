"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NAV,
  isGroupActive,
  isItemActive,
  type NavGroup,
  type NavItem,
} from "@/lib/nav";

/**
 * Sidebar navigation list.
 *
 * Deux variantes visuelles :
 *  - "rail"   : icônes only par défaut, expand au hover du parent (`group/sb`).
 *               Les labels sont controlés par les classes `group-hover/sb:opacity-*` du parent.
 *  - "drawer" : tout est toujours visible (mobile drawer ou layout fixed-expanded).
 *
 * Les items disabled / comingSoon sont rendus mais non cliquables.
 */
export interface SidebarNavProps {
  variant: "rail" | "drawer";
  onItemClick?: () => void;
  className?: string;
}

export function SidebarNav({
  variant,
  onItemClick,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex-1 space-y-1 overflow-y-auto [scrollbar-width:thin]",
        variant === "rail" ? "p-2.5" : "p-3",
        className,
      )}
    >
      {NAV.map((group, gi) => (
        <Group
          key={group.id}
          group={group}
          isFirst={gi === 0}
          variant={variant}
          pathname={pathname}
          onItemClick={onItemClick}
        />
      ))}
    </nav>
  );
}

/* ---------- Group ---------- */

function Group({
  group,
  isFirst,
  variant,
  pathname,
  onItemClick,
}: {
  group: NavGroup;
  isFirst: boolean;
  variant: "rail" | "drawer";
  pathname: string;
  onItemClick?: () => void;
}) {
  const groupActive = isGroupActive(group, pathname);

  return (
    <div className="space-y-0.5">
      {group.label && (
        <>
          {/* Label visible quand expanded (rail collapsed → opacity 0) */}
          <p
            className={cn(
              "px-3 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors",
              variant === "rail" &&
                "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
              groupActive
                ? "text-foreground"
                : "text-muted-foreground/70",
            )}
          >
            {group.label}
          </p>

          {/* Mini séparateur pour le rail collapsed (remplace le label) */}
          {variant === "rail" && !isFirst && (
            <div className="mx-4 my-2 h-px bg-border/50 transition-opacity duration-200 group-hover/sb:opacity-0 group-focus-within/sb:opacity-0" />
          )}
        </>
      )}

      {group.items.map((item) => (
        <Item
          key={item.href}
          item={item}
          variant={variant}
          active={isItemActive(item.href, pathname)}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}

/* ---------- Item ---------- */

function Item({
  item,
  variant,
  active,
  onClick,
}: {
  item: NavItem;
  variant: "rail" | "drawer";
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  const isDisabled = item.disabled || item.comingSoon;

  const content = (
    <>
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-transform",
          active && "scale-105",
        )}
      />
      <span
        className={cn(
          "flex-1 truncate",
          variant === "rail" &&
            "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
        )}
      >
        {item.label}
      </span>

      {/* Badge (counter) — masqué en rail collapsed, sinon à droite */}
      {item.badge !== undefined && (
        <span
          className={cn(
            "ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold tabular tracking-tight",
            active
              ? "bg-background/20 text-background"
              : "bg-foreground/[0.08] text-foreground/80",
            variant === "rail" &&
              "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
          )}
        >
          {item.badge}
        </span>
      )}

      {/* "Bientôt" tag */}
      {item.comingSoon && (
        <span
          className={cn(
            "ml-auto rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground",
            variant === "rail" &&
              "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
          )}
        >
          Bientôt
        </span>
      )}
    </>
  );

  const baseClasses = cn(
    "relative flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-200",
    isDisabled && "cursor-not-allowed opacity-50",
    !isDisabled && active
      ? "bg-gradient-to-r from-foreground to-foreground/90 text-background shadow-[0_10px_24px_-12px_hsl(var(--foreground)/0.65)]"
      : !isDisabled
        ? "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
        : "text-muted-foreground",
  );

  // Drawer mobile : barrette colorée à gauche pour l'item actif
  const drawerActiveBar = variant === "drawer" && active && (
    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-foreground" />
  );

  if (isDisabled) {
    return (
      <div
        title={item.description ?? item.label}
        aria-disabled="true"
        className={baseClasses}
      >
        {drawerActiveBar}
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      title={item.description ?? item.label}
      onClick={onClick}
      className={baseClasses}
    >
      {drawerActiveBar}
      {content}
    </Link>
  );
}
