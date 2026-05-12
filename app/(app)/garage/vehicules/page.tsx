import Link from "next/link";
import { Plus, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHeader } from "@/components/page-header";
import { VehicleCard } from "@/components/vehicle-card";
import { VehicleListFilters } from "./list-filters";
import { StatsRibbon } from "./stats-ribbon";
import { getServerAuth } from "@/lib/supabase/server";
import { VEHICLE_CARD_LIST_SELECT } from "@/lib/data/vehicle-selects";
import type { VehicleWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { status?: string; type?: string; visibility?: string; q?: string };
}

export default async function VehiclesListPage({ searchParams }: PageProps) {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  let filtered = supabase
    .from("vehicles")
    .select(VEHICLE_CARD_LIST_SELECT)
    .eq("dealer_id", user.id)
    .order("created_at", { ascending: false });

  const status = searchParams.status;
  const type = searchParams.type;
  const visibility = searchParams.visibility;
  const q = searchParams.q?.trim();

  if (status && ["available", "reserved", "sold"].includes(status)) filtered = filtered.eq("status", status);
  if (type && ["stock", "depot"].includes(type)) filtered = filtered.eq("type", type);
  if (visibility && ["private", "network"].includes(visibility))
    filtered = filtered.eq("visibility", visibility);
  if (q) {
    filtered = filtered.or(`brand.ilike.%${q}%,model.ilike.%${q}%`);
  }

  const [{ data: vehicles }, { data: allVehicles }] = await Promise.all([
    filtered,
    supabase.from("vehicles").select("status, visibility, price").eq("dealer_id", user.id),
  ]);

  const list = (vehicles ?? []) as unknown as VehicleWithRelations[];
  list.forEach((v) => {
    v.vehicle_images = (v.vehicle_images ?? []).slice().sort((a, b) => a.position - b.position);
  });

  const all = allVehicles ?? [];
  const total = all.length;
  const available = all.filter((v) => v.status === "available").length;
  const reserved = all.filter((v) => v.status === "reserved").length;
  const sold = all.filter((v) => v.status === "sold").length;
  const inNetwork = all.filter((v) => v.visibility === "network").length;
  const totalValue = all
    .filter((v) => v.status !== "sold")
    .reduce((sum, v) => sum + (v.price ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Garage"
        title="Mes véhicules"
        description="Tout votre stock et vos dépôts-ventes."
        actions={
          <Link href="/garage/vehicules/nouveau">
            <Button>
              <Plus className="h-4 w-4" />
              Ajouter un véhicule
            </Button>
          </Link>
        }
      />
      <PageBody className="space-y-6">
        {total > 0 && (
          <StatsRibbon
            total={total}
            available={available}
            reserved={reserved}
            sold={sold}
            inNetwork={inNetwork}
            totalValue={totalValue}
          />
        )}

        <VehicleListFilters defaults={searchParams} />

        {list.length === 0 ? (
          <EmptyState
            icon={<Car className="h-5 w-5" />}
            title="Aucun véhicule"
            description="Ajoutez votre premier véhicule pour commencer à gérer votre stock."
            action={
              <Link href="/garage/vehicules/nouveau">
                <Button>
                  <Plus className="h-4 w-4" />
                  Ajouter un véhicule
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                href={`/garage/vehicules/${v.id}`}
                showOwnerBadges
              />
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
