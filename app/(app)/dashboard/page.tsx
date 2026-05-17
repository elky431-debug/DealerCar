import Link from "next/link";
import {
  Plus,
  Search,
  ArrowUpRight,
  Car,
  Users,
  Network,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageBody, PageHeader } from "@/components/page-header";
import { getServerAuth } from "@/lib/supabase/server";
import { formatPrice, formatRelative, publicImageUrl, cn } from "@/lib/utils";
import type { Profile, Vehicle, VehicleImage } from "@/lib/types";
import { ActivityChart } from "./activity-chart";
import { Sparkline } from "./sparkline";

export const dynamic = "force-dynamic";

interface DayRow {
  date: string; // "YYYY-MM-DD"
  added: number;
  sold: number;
}

const MONTH_LABELS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export default async function DashboardPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const dayKey = (d: Date | string): string => {
    const date = typeof d === "string" ? new Date(d) : d;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // dernier jour du mois
  const daysInMonth = monthEnd.getDate();
  const monthLabel = `${MONTH_LABELS_FR[now.getMonth()]} ${now.getFullYear()}`;
  const todayIndex = now.getDate() - 1; // 0-based

  const [
    { data: profile },
    { data: ownVehicles },
    { count: activeLeads },
    { data: recentLeads },
    { data: recentVehicles },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>(),
    supabase
      .from("vehicles")
      .select(
        "id, status, type, visibility, price, brand, model, year, mileage, location, created_at, sold_at, vehicle_images(storage_path, position)",
      )
      .eq("dealer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vehicle_leads")
      .select("id", { count: "exact", head: true })
      .eq("dealer_id", user.id)
      .in("status", ["new", "contacted", "hot"]),
    supabase
      .from("vehicle_leads")
      .select("id, name, status, created_at, vehicles(brand, model)")
      .eq("dealer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("vehicles")
      .select("id, brand, model, year, price, status, vehicle_images(storage_path, position)")
      .eq("dealer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const list = (ownVehicles ?? []) as (Vehicle & { vehicle_images: VehicleImage[] })[];
  const total = list.length;
  const available = list.filter((v) => v.status === "available").length;
  const reserved = list.filter((v) => v.status === "reserved").length;
  const sold = list.filter((v) => v.status === "sold").length;
  const networkVisible = list.filter(
    (v) => v.visibility === "network" && v.status === "available",
  ).length;

  const stockValue = list
    .filter((v) => v.status !== "sold")
    .reduce((s, v) => s + Number(v.price ?? 0), 0);
  const soldValue = list
    .filter((v) => v.status === "sold")
    .reduce((s, v) => s + Number(v.price ?? 0), 0);
  const avgStockPrice = total - sold > 0 ? stockValue / (total - sold) : 0;
  const sellThrough =
    sold + available > 0 ? Math.round((sold / (sold + available)) * 100) : 0;

  // Build daily activity series for current month
  const daily: DayRow[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), i + 1);
    daily.push({ date: dayKey(d), added: 0, sold: 0 });
  }
  const dayIndexMap = new Map(daily.map((d, i) => [d.date, i]));
  for (const v of list) {
    if (v.created_at) {
      const k = dayKey(v.created_at);
      if (dayIndexMap.has(k)) daily[dayIndexMap.get(k)!].added++;
    }
    if (v.sold_at) {
      const k = dayKey(v.sold_at);
      if (dayIndexMap.has(k)) daily[dayIndexMap.get(k)!].sold++;
    }
  }

  const soldThisMonth = daily.reduce((s, d) => s + d.sold, 0);
  const addedThisMonth = daily.reduce((s, d) => s + d.added, 0);

  // Sparkline : évolution cumulée du stock sur le mois (par jour)
  const stockEvol: number[] = [];
  let running =
    list.length -
    list.filter((v) => v.created_at && new Date(v.created_at) >= monthStart).length;
  for (const d of daily) {
    running += d.added - d.sold;
    stockEvol.push(running);
  }

  // Build event feed
  type Event = {
    type: "added" | "sold" | "lead";
    when: string;
    title: string;
    detail?: string;
    href: string;
  };
  const events: Event[] = [];
  for (const v of list.slice(0, 12)) {
    events.push({
      type: "added",
      when: v.created_at,
      title: `${v.brand} ${v.model}`,
      detail: `${formatPrice(Number(v.price))} · ajouté au stock`,
      href: `/garage/vehicules/${v.id}`,
    });
    if (v.sold_at && v.status === "sold") {
      events.push({
        type: "sold",
        when: v.sold_at,
        title: `${v.brand} ${v.model}`,
        detail: `Vendu ${formatPrice(Number(v.price))}`,
        href: `/garage/vehicules/${v.id}`,
      });
    }
  }
  for (const lead of (recentLeads ?? []) as Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
    vehicles?: { brand?: string; model?: string } | null;
  }>) {
    const veh = lead.vehicles
      ? `sur ${lead.vehicles.brand} ${lead.vehicles.model}`
      : undefined;
    events.push({
      type: "lead",
      when: lead.created_at,
      title: lead.name,
      detail: veh ? `Lead ${veh}` : "Nouveau lead",
      href: `/garage/clients`,
    });
  }
  events.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
  const feed = events.slice(0, 8);

  const recents = (recentVehicles ?? []) as (Pick<
    Vehicle,
    "id" | "brand" | "model" | "year" | "price" | "status"
  > & { vehicle_images: { storage_path: string; position: number }[] })[];

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <PageHeader
        eyebrow="Tableau de bord"
        title={`Bonjour ${profile?.company_name ?? ""}`.trim()}
        description={summaryLine({
          total,
          available,
          stockValue,
          activeLeads: activeLeads ?? 0,
        })}
        actions={
          <>
            <Link href="/recherche/reseau">
              <Button variant="secondary">
                <Search className="h-4 w-4" />
                Rechercher dans le réseau
              </Button>
            </Link>
            <Link href="/garage/vehicules/nouveau">
              <Button>
                <Plus className="h-4 w-4" />
                Ajouter un véhicule
              </Button>
            </Link>
          </>
        }
      />
      <PageBody className="space-y-6 pb-14">
        {/* Top row : chart + stack of mini-stats */}
        <div className="grid min-w-0 gap-5 lg:grid-cols-[1fr_320px]">
          <section className="min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-[0_8px_24px_-18px_hsl(var(--foreground)/0.22)] sm:p-6">
            <ActivityChart days={daily} monthLabel={monthLabel} todayIndex={todayIndex} />
          </section>

          <section className="space-y-3">
            <MiniStat
              label="Valeur stock"
              value={formatPrice(stockValue)}
              hint={`${total - sold} véhicule${total - sold > 1 ? "s" : ""} en cours`}
              spark={stockEvol}
              variant="primary"
            />
            <MiniStat
              label="Ventes ce mois"
              value={String(soldThisMonth)}
              hint={`${formatPrice(soldValue)} de CA cumulé`}
              spark={daily.map((d) => d.sold)}
              variant="emerald"
            />
            <MiniStat
              label="Ajouts ce mois"
              value={String(addedThisMonth)}
              hint={`Sell-through ${sellThrough}%`}
              spark={daily.map((d) => d.added)}
              variant="muted"
            />
          </section>
        </div>

        {/* Inventory cards row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InventoryCard
            label="Véhicules"
            value={total}
            sub={
              available > 0
                ? `${available} disponible${available > 1 ? "s" : ""}`
                : "Aucun disponible"
            }
            href="/garage/vehicules"
            icon={Car}
          />
          <InventoryCard
            label="Réservés"
            value={reserved}
            sub={
              reserved > 0
                ? "À confirmer"
                : "Aucune réservation"
            }
            href="/garage/vehicules?status=reserved"
            icon={Clock}
            tone="amber"
          />
          <InventoryCard
            label="Clients à recontacter"
            value={activeLeads ?? 0}
            sub={
              (activeLeads ?? 0) > 0
                ? "Leads actifs à suivre"
                : "Aucun lead actif"
            }
            href="/garage/clients"
            icon={Users}
            tone="brand"
          />
          <InventoryCard
            label="Visibles réseau"
            value={networkVisible}
            sub={
              networkVisible > 0
                ? `Sur ${available} disponibles`
                : "Activez le partage"
            }
            href="/garage/vehicules?visibility=network"
            icon={Network}
            tone="emerald"
          />
        </div>

        {/* Bottom row : Recent activity + Recent vehicles */}
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          {/* Activity feed */}
          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-[0_8px_24px_-18px_hsl(var(--foreground)/0.22)] sm:p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[15px] font-semibold tracking-tight">Activité récente</h3>
              <Link
                href="/garage/vehicules"
                className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {feed.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-background p-8 text-center text-[13px] text-muted-foreground">
                <Sparkles className="mx-auto mb-2 h-4 w-4" />
                Pas encore d'activité. Ajoutez un véhicule pour commencer.
              </div>
            ) : (
              <ol className="mt-5 space-y-1.5">
                {feed.map((e, i) => (
                  <FeedItem key={i} event={e} />
                ))}
              </ol>
            )}
          </section>

          {/* Recent vehicles */}
          <section className="rounded-3xl border border-border/60 bg-card p-5 shadow-[0_8px_24px_-18px_hsl(var(--foreground)/0.22)] sm:p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-[15px] font-semibold tracking-tight">Derniers véhicules</h3>
              <Link
                href="/garage/vehicules/nouveau"
                className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                Ajouter <Plus className="h-3 w-3" />
              </Link>
            </div>

            {recents.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border/70 bg-background p-8 text-center text-[13px] text-muted-foreground">
                Aucun véhicule pour l'instant.
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {recents.map((v) => {
                  const cover = v.vehicle_images
                    ?.slice()
                    .sort((a, b) => a.position - b.position)[0];
                  return (
                    <li key={v.id}>
                      <Link
                        href={`/garage/vehicules/${v.id}`}
                        className="flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-all hover:-translate-y-0.5 hover:border-border/60 hover:bg-muted/45"
                      >
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={publicImageUrl(cover.storage_path)}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium tracking-tight">
                            {v.brand} {v.model}{" "}
                            <span className="font-normal text-muted-foreground tabular">
                              · {v.year}
                            </span>
                          </p>
                          <p className="text-[12px] tabular text-muted-foreground">
                            {formatPrice(Number(v.price))}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium tabular",
                            v.status === "available" && "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
                            v.status === "reserved" && "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
                            v.status === "sold" && "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
                          )}
                        >
                          {v.status === "available" && "Dispo"}
                          {v.status === "reserved" && "Réservé"}
                          {v.status === "sold" && "Vendu"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {total > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-gradient-to-r from-muted/50 to-muted/20 p-3 text-[12.5px]">
                <span className="text-muted-foreground">Prix moyen au stock</span>
                <span className="tabular font-semibold">{formatPrice(avgStockPrice)}</span>
              </div>
            )}
          </section>
        </div>
      </PageBody>
    </div>
  );
}

function summaryLine({
  total,
  available,
  stockValue,
  activeLeads,
}: {
  total: number;
  available: number;
  stockValue: number;
  activeLeads: number;
}): string {
  if (total === 0) return "Bienvenue. Ajoutez votre premier véhicule pour démarrer.";
  const parts: string[] = [];
  parts.push(
    `${total} véhicule${total > 1 ? "s" : ""}${available !== total ? ` · ${available} disponible${available > 1 ? "s" : ""}` : ""}`,
  );
  parts.push(`valeur ${formatPrice(stockValue)}`);
  if (activeLeads > 0) parts.push(`${activeLeads} lead${activeLeads > 1 ? "s" : ""} actif${activeLeads > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

function MiniStat({
  label,
  value,
  hint,
  spark,
  variant,
}: {
  label: string;
  value: string;
  hint: string;
  spark: number[];
  variant: "primary" | "emerald" | "muted";
}) {
  const tone =
    variant === "emerald"
      ? "from-emerald-500/10 to-emerald-500/0"
      : variant === "muted"
        ? "from-foreground/8 to-foreground/0"
        : "from-primary/12 to-primary/0";

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", tone)} />
      <div className="flex items-baseline justify-between">
        <p className="relative text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="relative mt-1 text-[23px] font-semibold tabular leading-none tracking-[-0.02em]">
        {value}
      </p>
      <p className="relative mt-1 text-[12px] text-muted-foreground">{hint}</p>
      <Sparkline values={spark} variant={variant} className="relative mt-3 h-8" />
    </div>
  );
}

function InventoryCard({
  label,
  value,
  sub,
  href,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  sub: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "emerald" | "amber" | "brand";
}) {
  const accent =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700"
        : tone === "brand"
          ? "bg-primary/10 text-primary"
          : "bg-muted text-foreground/70";

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-primary/[0.06] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", accent)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
      </div>
      <p className="relative mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="relative mt-0.5 text-[26px] font-semibold tabular leading-none tracking-[-0.02em]">
        {value}
      </p>
      <p className="relative mt-1 text-[12px] text-muted-foreground">{sub}</p>
    </Link>
  );
}

function FeedItem({ event }: { event: { type: "added" | "sold" | "lead"; when: string; title: string; detail?: string; href: string } }) {
  const config = {
    added: {
      dot: "bg-emerald-500",
      icon: <Plus className="h-3 w-3" />,
      verb: "Ajouté",
    },
    sold: {
      dot: "bg-foreground",
      icon: <TrendingUp className="h-3 w-3" />,
      verb: "Vendu",
    },
    lead: {
      dot: "bg-primary",
      icon: <Users className="h-3 w-3" />,
      verb: "Lead",
    },
  } as const;
  const c = config[event.type];

  return (
    <li>
      <Link
        href={event.href}
        className="group flex items-start gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-all hover:border-border/60 hover:bg-muted/40"
      >
        <span
          className={cn(
            "relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-background",
            c.dot,
          )}
        >
          {c.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] tracking-tight">
            <span className="font-medium">{event.title}</span>
            {event.detail && (
              <span className="text-muted-foreground"> · {event.detail}</span>
            )}
          </p>
          <p className="text-[11.5px] tabular text-muted-foreground/80">
            {formatRelative(event.when)}
          </p>
        </div>
        <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
      </Link>
    </li>
  );
}
