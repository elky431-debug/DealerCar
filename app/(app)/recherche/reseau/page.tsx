import { Search as SearchIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHeader } from "@/components/page-header";
import { VehicleCard } from "@/components/vehicle-card";
import { SearchFilters } from "./search-filters";
import { createClient } from "@/lib/supabase/server";
import type { VehicleWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: {
    q?: string;
    min?: string;
    max?: string;
    location?: string;
    type?: string;
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("visibility", "network")
    .eq("status", "available")
    .neq("dealer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(120);

  const q = searchParams.q?.trim();
  if (q) query = query.or(`brand.ilike.%${q}%,model.ilike.%${q}%`);
  const min = numberOrNull(searchParams.min);
  const max = numberOrNull(searchParams.max);
  if (min != null) query = query.gte("price", min);
  if (max != null) query = query.lte("price", max);
  const location = searchParams.location?.trim();
  if (location) query = query.ilike("location", `%${location}%`);
  const type = searchParams.type;
  if (type && ["stock", "depot"].includes(type)) query = query.eq("type", type);

  const [vehiclesRes, favRes] = await Promise.all([
    query,
    supabase.from("favorites").select("vehicle_id").eq("dealer_id", user.id),
  ]);

  const list = (vehiclesRes.data ?? []) as VehicleWithRelations[];
  const favSet = new Set((favRes.data ?? []).map((f) => f.vehicle_id));
  list.forEach((v) => {
    v.vehicle_images = (v.vehicle_images ?? []).slice().sort((a, b) => a.position - b.position);
  });

  return (
    <>
      <PageHeader
        eyebrow="Recherche"
        title="Réseau marchands"
        description="Tous les véhicules disponibles partagés par les autres marchands."
      />
      <PageBody className="space-y-6">
        <SearchFilters defaults={searchParams} />

        {list.length === 0 ? (
          <EmptyState
            icon={<SearchIcon className="h-5 w-5" />}
            title="Aucun véhicule trouvé"
            description="Affinez ou élargissez vos critères de recherche."
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {list.length} véhicule{list.length > 1 ? "s" : ""} dans le réseau
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((v) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  href={`/garage/vehicules/${v.id}`}
                  isFavorite={favSet.has(v.id)}
                  showFavoriteButton
                />
              ))}
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}

function numberOrNull(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
