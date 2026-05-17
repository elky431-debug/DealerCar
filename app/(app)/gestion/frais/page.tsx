import Link from "next/link";
import { Sparkles, Wrench, ReceiptText, ArrowUpRight } from "lucide-react";
import { PageBody, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getServerAuth } from "@/lib/supabase/server";
import { formatDate, formatPrice, publicImageUrl, cn } from "@/lib/utils";
import {
  COST_CATEGORY_LABELS,
  type VehicleCost,
  type Vehicle,
  type VehicleImage,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface CostWithVehicle extends VehicleCost {
  vehicles: Pick<Vehicle, "id" | "brand" | "model" | "year" | "status"> & {
    vehicle_images: VehicleImage[];
  };
}

export default async function FraisPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const [{ data: costsData }, { data: vehiclesData }] = await Promise.all([
    supabase
      .from("vehicle_costs")
      .select(
        "*, vehicles(id, brand, model, year, status, vehicle_images(storage_path, position))",
      )
      .eq("dealer_id", user.id)
      .order("date", { ascending: false }),
    supabase
      .from("vehicles")
      .select("id, brand, model, year, status, vehicle_images(storage_path, position)")
      .eq("dealer_id", user.id)
      .neq("status", "sold")
      .order("created_at", { ascending: false }),
  ]);

  const costs = (costsData ?? []) as CostWithVehicle[];
  const vehicles = (vehiclesData ?? []) as (Pick<
    Vehicle,
    "id" | "brand" | "model" | "year" | "status"
  > & { vehicle_images: VehicleImage[] })[];

  // Aggrégations par véhicule
  const byVehicle = new Map<
    string,
    {
      total: number;
      count: number;
      iaCount: number;
      vehicle: CostWithVehicle["vehicles"];
    }
  >();
  for (const c of costs) {
    const k = c.vehicle_id;
    const cur = byVehicle.get(k);
    if (cur) {
      cur.total += Number(c.amount ?? 0);
      cur.count += 1;
      if (c.source === "ia_estimation") cur.iaCount += 1;
    } else {
      byVehicle.set(k, {
        total: Number(c.amount ?? 0),
        count: 1,
        iaCount: c.source === "ia_estimation" ? 1 : 0,
        vehicle: c.vehicles,
      });
    }
  }

  const totalAll = costs.reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const iaCountAll = costs.filter((c) => c.source === "ia_estimation").length;
  const recent = costs.slice(0, 12);

  return (
    <>
      <PageHeader
        eyebrow="Gestion"
        title="Frais & Réparations"
        description="Suivez le coût réel de chaque véhicule. Estimez les réparations en photo avec l'IA."
      />
      <PageBody className="space-y-6">
        {/* Banner IA */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.5)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[15px] font-semibold tracking-tight">
                  Estimation des réparations par photo
                </p>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                  Sur chaque véhicule, ouvrez l'onglet{" "}
                  <span className="font-medium text-foreground">Frais</span> et
                  cliquez sur{" "}
                  <span className="font-medium text-foreground">
                    Lancer l'estimation
                  </span>
                  . Uploadez 1 à 5 photos — Claude détecte les dommages et chiffre
                  la réparation.
                </p>
              </div>
            </div>
            <Link href="/garage/vehicules">
              <Button>
                Choisir un véhicule
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Frais cumulés (tout stock)" value={formatPrice(totalAll)} />
          <Stat label="Lignes enregistrées" value={String(costs.length)} />
          <Stat
            label="Estimations IA"
            value={String(iaCountAll)}
            hint={iaCountAll > 0 ? "auto-générées par photo" : "aucune pour l'instant"}
          />
        </div>

        {/* Vehicles with costs */}
        <Card>
          <CardHeader>
            <CardTitle>Frais par véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            {byVehicle.size === 0 ? (
              <EmptyState
                icon={<Wrench className="h-5 w-5" />}
                title="Aucun frais enregistré"
                description="Ouvrez la fiche d'un véhicule, onglet Frais, pour démarrer."
              />
            ) : (
              <ul className="space-y-2">
                {Array.from(byVehicle.entries())
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([id, info]) => {
                    const cover = info.vehicle?.vehicle_images
                      ?.slice()
                      .sort((a, b) => a.position - b.position)[0];
                    return (
                      <li key={id}>
                        <Link
                          href={`/garage/vehicules/${id}?tab=costs`}
                          className="group flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border/60 hover:bg-muted/40"
                        >
                          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={publicImageUrl(cover.storage_path)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-medium tracking-tight">
                              {info.vehicle?.brand} {info.vehicle?.model}{" "}
                              <span className="font-normal text-muted-foreground tabular">
                                · {info.vehicle?.year}
                              </span>
                            </p>
                            <p className="text-[12px] text-muted-foreground">
                              {info.count} ligne{info.count > 1 ? "s" : ""}
                              {info.iaCount > 0 && (
                                <span className="ml-2 inline-flex items-center gap-1 text-primary">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  {info.iaCount} IA
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="shrink-0 text-right">
                            <span className="block text-[14px] font-semibold tabular tracking-tight">
                              {formatPrice(info.total)}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              total
                            </span>
                          </p>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent costs (table) */}
        {recent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Derniers frais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-border/60 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-3 text-left">Date</th>
                      <th className="pb-2 pr-3 text-left">Véhicule</th>
                      <th className="pb-2 pr-3 text-left">Catégorie</th>
                      <th className="pb-2 pr-3 text-left">Description</th>
                      <th className="pb-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {recent.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2.5 pr-3 align-top tabular text-muted-foreground">
                          {formatDate(c.date)}
                        </td>
                        <td className="py-2.5 pr-3 align-top">
                          <Link
                            href={`/garage/vehicules/${c.vehicle_id}?tab=costs`}
                            className="font-medium hover:underline"
                          >
                            {c.vehicles?.brand} {c.vehicles?.model}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3 align-top">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-medium">
                            {COST_CATEGORY_LABELS[c.category]}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 align-top">
                          <div className="flex items-start gap-1.5">
                            {c.source === "ia_estimation" && (
                              <span
                                title="Estimation IA"
                                className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-primary/15 text-primary"
                              >
                                <Sparkles className="h-2.5 w-2.5" />
                              </span>
                            )}
                            <span className={cn(c.source === "ia_estimation" && "min-w-0")}>{c.label}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="tabular font-semibold">
                            {formatPrice(Number(c.amount))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick access to vehicles in stock */}
        {vehicles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <ReceiptText className="h-4 w-4 text-muted-foreground" />
                Lancer une estimation IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-[12.5px] text-muted-foreground">
                Choisissez un véhicule de votre stock pour ouvrir directement l'onglet Frais.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {vehicles.slice(0, 12).map((v) => {
                  const cover = v.vehicle_images
                    ?.slice()
                    .sort((a, b) => a.position - b.position)[0];
                  return (
                    <Link
                      key={v.id}
                      href={`/garage/vehicules/${v.id}?tab=costs`}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-2.5 transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-[0_8px_24px_-12px_hsl(var(--foreground)/0.18)]"
                    >
                      <div className="h-10 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        {cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={publicImageUrl(cover.storage_path)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium tracking-tight">
                          {v.brand} {v.model}
                        </p>
                        <p className="text-[11px] tabular text-muted-foreground">
                          {v.year}
                        </p>
                      </div>
                      <Sparkles className="h-3.5 w-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-semibold tabular leading-none tracking-[-0.02em]">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
