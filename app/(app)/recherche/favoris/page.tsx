import { Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHeader } from "@/components/page-header";
import { VehicleCard } from "@/components/vehicle-card";
import { getServerAuth } from "@/lib/supabase/server";
import { VEHICLE_CARD_LIST_SELECT } from "@/lib/data/vehicle-selects";
import type { VehicleWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FavorisPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const { data: favs } = await supabase
    .from("favorites")
    .select(`vehicle_id, created_at, vehicles(${VEHICLE_CARD_LIST_SELECT})`)
    .eq("dealer_id", user.id)
    .order("created_at", { ascending: false });

  const list: VehicleWithRelations[] = (favs ?? [])
    .map((f) => (f as unknown as { vehicles: VehicleWithRelations | null }).vehicles)
    .filter((v): v is VehicleWithRelations => v != null);

  list.forEach((v) => {
    v.vehicle_images = (v.vehicle_images ?? []).slice().sort((a, b) => a.position - b.position);
  });

  return (
    <>
      <PageHeader
        eyebrow="Recherche"
        title="Favoris"
        description="Les véhicules du réseau que vous avez marqués."
      />
      <PageBody>
        {list.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-5 w-5" />}
            title="Aucun favori pour l'instant"
            description="Cliquez sur le cœur d'un véhicule depuis la recherche pour le retrouver ici."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                href={`/garage/vehicules/${v.id}`}
                isFavorite
                showFavoriteButton
              />
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}
