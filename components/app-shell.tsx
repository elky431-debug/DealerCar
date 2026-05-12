"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Car, Plus, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/sidebar-nav";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const AssistantWidgetLazy = dynamic(
  () => import("@/components/assistant-widget").then((m) => m.AssistantWidget),
  { ssr: false },
);

export function AppShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [assistantReady, setAssistantReady] = useState(false);

  // Fermeture auto du drawer mobile à chaque changement de route
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prefetch minimal et différé pour éviter de charger agressivement au boot.
  useEffect(() => {
    const trigger = () => {
      // Routes les plus fréquentes seulement.
      router.prefetch("/dashboard");
      router.prefetch("/garage/vehicules");
    };
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    if (ric) {
      const id = ric(trigger);
      return () => {
        if ((window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback) {
          (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback!(id);
        }
      };
    }
    const t = window.setTimeout(trigger, 600);
    return () => clearTimeout(t);
  }, [router]);

  // Charge l'assistant après le rendu initial pour fluidifier le premier paint.
  useEffect(() => {
    const t = window.setTimeout(() => setAssistantReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials =
    profile?.company_name
      ?.split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "·";

  return (
    <div className="relative min-h-screen bg-background">
      {/* Soft top gradient for atmospheric depth */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(80%_80%_at_70%_0%,hsl(var(--primary)/0.06),transparent_60%)]"
      />

      {/* ───────── Desktop sidebar (fixed width for smoother perf) ───────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden",
          "border-r border-border/60 bg-card",
          "w-64 shadow-[0_0_24px_-16px_rgba(15,23,42,0.15)]",
          "md:flex",
        )}
      >
        <BrandHeader />

        <QuickAddCTA />

        <SidebarNav variant="drawer" />

        <SidebarFooter
          profile={profile}
          initials={initials}
          onLogout={handleLogout}
          variant="drawer"
        />
      </aside>

      {/* ───────── Mobile drawer ───────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-72 flex-col border-r border-border/70 bg-card shadow-2xl">
            <div className="flex h-16 items-center gap-3 border-b border-border px-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-black shadow-sm dark:text-foreground">
                <Car className="h-[18px] w-[18px]" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                DealerLink
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-3 pt-3">
              <Link
                href="/garage/vehicules/nouveau"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3 py-2.5 text-[13.5px] font-medium text-background shadow-[0_4px_14px_-4px_hsl(var(--foreground)/0.3)] transition-all hover:bg-foreground/90"
              >
                <Plus className="h-4 w-4" />
                Nouveau véhicule
              </Link>
            </div>

            <SidebarNav
              variant="drawer"
              onItemClick={() => setMobileOpen(false)}
            />

            <SidebarFooter
              profile={profile}
              initials={initials}
              onLogout={handleLogout}
              variant="drawer"
            />
          </aside>
        </div>
      )}

      {/* ───────── Main ───────── */}
      <div className="flex min-h-screen flex-col md:pl-64">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-background text-black shadow-sm dark:text-foreground">
              <Car className="h-3.5 w-3.5" />
            </span>
            DealerLink
          </span>
          <Link href="/garage/vehicules/nouveau" aria-label="Ajouter un véhicule">
            <Button size="icon" variant="ghost">
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {assistantReady && <AssistantWidgetLazy />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                        */
/* ────────────────────────────────────────────────────────────────────── */

function BrandHeader() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-border/60 px-4 font-semibold">
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-black shadow-[0_4px_12px_-2px_hsl(var(--foreground)/0.22)] dark:text-foreground">
        <Car className="h-[18px] w-[18px]" />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5 dark:ring-white/10" />
      </span>
      <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight">
        DealerLink
      </span>
    </div>
  );
}

/**
 * CTA primaire toujours visible.
 *
 * En rail collapsé : carré 44x44 avec juste le `+`.
 * En rail expandé : bouton plein-largeur avec label.
 *
 * Action #1 d'un marchand au quotidien : ajouter un véhicule.
 */
function QuickAddCTA() {
  return (
    <div className="border-b border-border/40 px-2.5 py-3">
      <Link
        href="/garage/vehicules/nouveau"
        title="Nouveau véhicule"
        className={cn(
          "flex h-11 items-center justify-center gap-2 rounded-xl border border-black/5 bg-black px-3 text-[13.5px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.45)] transition-all duration-200 dark:border-white/10 dark:bg-foreground dark:text-background",
          "hover:-translate-y-0.5 hover:bg-black/90 active:scale-[0.98] dark:hover:bg-foreground/90",
        )}
      >
        <Plus className="h-[18px] w-[18px] shrink-0" />
        <span className="whitespace-nowrap">
          Nouveau véhicule
        </span>
      </Link>
    </div>
  );
}

function SidebarFooter({
  profile,
  initials,
  onLogout,
  variant = "rail",
}: {
  profile: Profile | null;
  initials: string;
  onLogout: () => void;
  variant?: "rail" | "drawer";
}) {
  const isRail = variant === "rail";

  return (
    <div className="border-t border-border/70 p-2.5">
      {profile && (
        <div className="mb-1.5 flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-[13px] font-semibold text-primary ring-1 ring-primary/20">
            {initials}
          </div>
          <div
            className={cn(
              "min-w-0 whitespace-nowrap",
              isRail &&
                "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
            )}
          >
            <p className="truncate text-sm font-medium leading-tight">
              {profile.company_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-1">
        <ThemeToggleButton className="shrink-0" />
        <button
          onClick={onLogout}
          title="Se déconnecter"
          className="flex flex-1 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span
            className={cn(
              isRail &&
                "opacity-0 transition-opacity duration-200 group-hover/sb:opacity-100 group-focus-within/sb:opacity-100",
            )}
          >
            Se déconnecter
          </span>
        </button>
      </div>
    </div>
  );
}
