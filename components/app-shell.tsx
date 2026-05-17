"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { Car, Home, Plus, Menu, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggleButton } from "@/components/theme-toggle";
import { SidebarNav } from "@/components/sidebar-nav";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

/** Charge l’assistant avec retry — évite un crash global si le chunk HMR est périmé. */
function AssistantWidgetGate() {
  const [Widget, setWidget] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(attempt = 0) {
      try {
        const mod = await import("@/components/assistant-widget");
        if (!cancelled) setWidget(() => mod.AssistantWidget);
      } catch {
        if (cancelled) return;
        if (attempt < 2) {
          window.setTimeout(() => void load(attempt + 1), 400 * (attempt + 1));
          return;
        }
        console.warn("[AssistantWidget] chunk indisponible — rechargez la page (Cmd+Shift+R).");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Widget) return null;
  return <Widget />;
}

const SIDEBAR_COLLAPSED_KEY = "dealerlink-sidebar-collapsed";
const SIDEBAR_WIDTH_EXPANDED = "13.75rem"; /* 220px */

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
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "0");
    } catch {
      /* ignore */
    }
  }, []);

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
          "fixed inset-y-0 left-0 z-40 hidden flex-col overflow-visible",
          "border-r border-border/60 bg-card shadow-[0_0_24px_-16px_rgba(15,23,42,0.15)]",
          "w-[220px] md:flex",
        )}
      >
        <BrandHeader collapsed={false} />

        <div className="border-b border-border/40 px-2 py-2">
          <Button
            variant="outline"
            size="sm"
            href="/"
            title="Retour à l'accueil"
            className="h-9 w-full justify-start gap-2 border-border/80 text-[13px] font-medium"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden />
            <span>Retour à l&apos;accueil</span>
          </Button>
        </div>

        <QuickAddCTA collapsed={false} />

        <SidebarNav variant="drawer" collapsed={false} />

        <SidebarFooter
          profile={profile}
          initials={initials}
          onLogout={handleLogout}
          variant="drawer"
          collapsed={false}
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
                href="/"
                onClick={() => setMobileOpen(false)}
                className="mb-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border/80 bg-background text-[13px] font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
              >
                <Home className="h-4 w-4 shrink-0" aria-hidden />
                Retour à l&apos;accueil
              </Link>
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
      <div
        className="flex min-h-screen flex-1 flex-col md:pl-[var(--sidebar-width)]"
        style={{ "--sidebar-width": SIDEBAR_WIDTH_EXPANDED } as React.CSSProperties}
      >
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

      {assistantReady && <AssistantWidgetGate />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                        */
/* ────────────────────────────────────────────────────────────────────── */

function BrandHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center border-b border-border/60 font-semibold",
        collapsed ? "justify-center px-2" : "gap-2 px-3",
      )}
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-black shadow-[0_4px_12px_-2px_hsl(var(--foreground)/0.22)] dark:text-foreground">
        <Car className="h-[18px] w-[18px]" />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5 dark:ring-white/10" />
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[15px] font-semibold tracking-tight">
          DealerLink
        </span>
      )}
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
function QuickAddCTA({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "border-b border-border/40 px-2 py-3",
        collapsed && "flex justify-center",
      )}
    >
      <Link
        href="/garage/vehicules/nouveau"
        title="Nouveau véhicule"
        className={cn(
          "flex h-11 items-center justify-center rounded-xl border border-black/5 bg-black text-[13.5px] font-medium text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.45)] transition-all duration-200 dark:border-white/10 dark:bg-foreground dark:text-background",
          "hover:-translate-y-0.5 hover:bg-black/90 active:scale-[0.98] dark:hover:bg-foreground/90",
          collapsed ? "w-9 gap-0 px-0" : "w-full gap-2 px-3",
        )}
      >
        <Plus className="h-[18px] w-[18px] shrink-0" />
        {!collapsed && <span className="whitespace-nowrap">Nouveau véhicule</span>}
      </Link>
    </div>
  );
}

function SidebarFooter({
  profile,
  initials,
  onLogout,
  collapsed = false,
}: {
  profile: Profile | null;
  initials: string;
  onLogout: () => void;
  variant?: "rail" | "drawer";
  collapsed?: boolean;
}) {

  return (
    <div className="border-t border-border/70 p-2">
      {profile && (
        <div
          className={cn(
            "mb-1.5 flex items-center rounded-lg py-1.5",
            collapsed ? "justify-center px-0" : "gap-3 px-2",
          )}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-[13px] font-semibold text-primary ring-1 ring-primary/20"
            title={profile.company_name}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 whitespace-nowrap">
              <p className="truncate text-sm font-medium leading-tight">{profile.company_name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            </div>
          )}
        </div>
      )}
      <div className={cn("flex items-center", collapsed ? "flex-col gap-1" : "gap-1")}>
        <ThemeToggleButton className="shrink-0" />
        <button
          onClick={onLogout}
          title="Se déconnecter"
          className={cn(
            "flex items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed ? "h-9 w-9 justify-center px-0" : "flex-1 gap-3 whitespace-nowrap px-3 py-2",
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Se déconnecter</span>}
        </button>
      </div>
    </div>
  );
}
