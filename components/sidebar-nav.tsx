"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
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
  /** Réduit volontairement (icônes seules, sans expand au survol). */
  collapsed?: boolean;
  onItemClick?: () => void;
  className?: string;
}

export function SidebarNav({
  variant,
  collapsed = false,
  onItemClick,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex-1 space-y-1 overflow-y-auto [scrollbar-width:thin]",
        variant === "rail" || collapsed ? "p-2" : "p-3",
        className,
      )}
    >
      {NAV.map((group, gi) => (
        <Group
          key={group.id}
          group={group}
          isFirst={gi === 0}
          variant={variant}
          collapsed={collapsed}
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
  collapsed,
  pathname,
  onItemClick,
}: {
  group: NavGroup;
  isFirst: boolean;
  variant: "rail" | "drawer";
  collapsed: boolean;
  pathname: string;
  onItemClick?: () => void;
}) {
  const groupActive = isGroupActive(group, pathname);
  const railHover = variant === "rail" && !collapsed;

  return (
    <div className="space-y-0.5">
      {group.label && (
        <>
          <p
            className={cn(
              "px-3 pt-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors",
              railHover &&
                "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
              collapsed && "hidden",
              groupActive
                ? "text-foreground"
                : "text-muted-foreground/70",
            )}
          >
            {group.label}
          </p>

          {(variant === "rail" || collapsed) && !isFirst && (
            <div
              className={cn(
                "mx-2 my-2 h-px bg-border/50",
                railHover &&
                  "transition-opacity duration-200 group-hover/sb:opacity-0 group-focus-within/sb:opacity-0",
              )}
            />
          )}
        </>
      )}

      {group.items.map((item) => (
        <Item
          key={item.href}
          item={item}
          variant={variant}
          collapsed={collapsed}
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
  collapsed,
  active,
  onClick,
}: {
  item: NavItem;
  variant: "rail" | "drawer";
  collapsed: boolean;
  active: boolean;
  onClick?: () => void;
}) {
  const [navPending, startNavTransition] = useTransition();
  const Icon = item.icon;
  const isDisabled = item.disabled || item.comingSoon;
  const railHover = variant === "rail" && !collapsed;
  const iconOnly = collapsed || variant === "rail";

  const labelHidden = cn(
    iconOnly && !collapsed && variant === "rail" &&
      "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
    collapsed && "sr-only",
  );

  const content = (
    <>
      <Icon
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-transform",
          active && "scale-105",
        )}
      />
      <span className={cn("flex-1 truncate", labelHidden)}>{item.label}</span>

      {item.badge !== undefined && (
        <span
          className={cn(
            "ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold tabular tracking-tight",
            active
              ? "bg-brand/15 text-brand-dark"
              : "bg-gray-100 text-gray-600",
            railHover &&
              "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
            collapsed && "sr-only",
          )}
        >
          {item.badge}
        </span>
      )}

      {item.comingSoon && (
        <span
          className={cn(
            "ml-auto rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground",
            railHover &&
              "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
            collapsed && "sr-only",
          )}
        >
          Bientôt
        </span>
      )}
    </>
  );

  const baseClasses = cn(
    "relative flex items-center whitespace-nowrap rounded-xl py-2.5 text-[13.5px] font-medium transition-all duration-200",
    iconOnly ? "justify-center gap-0 px-2" : "gap-3 px-3",
    isDisabled && "cursor-not-allowed opacity-50",
    !isDisabled && active ? "dl-sidebar-link-active" : !isDisabled ? "dl-sidebar-link" : "text-muted-foreground",
  );

  const drawerActiveBar = null;

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
      prefetch
      onClick={() => {
        startNavTransition(() => {
          onClick?.();
        });
      }}
      className={cn(baseClasses, navPending && !active && "opacity-80")}
    >
      {drawerActiveBar}
      {content}
    </Link>
  );
}
