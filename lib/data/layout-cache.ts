import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Compteurs onglets Garage — mis en cache pour éviter 3× head count à chaque navigation. */
export function getCachedGarageTabCounts(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = createClient();
      const [vehiclesRes, depotsRes, leadsRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("dealer_id", userId),
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("dealer_id", userId)
          .eq("type", "depot"),
        supabase
          .from("vehicle_leads")
          .select("id", { count: "exact", head: true })
          .eq("dealer_id", userId)
          .in("status", ["new", "contacted", "hot"]),
      ]);
      return {
        total: vehiclesRes.count ?? 0,
        depots: depotsRes.count ?? 0,
        leads: leadsRes.count ?? 0,
      };
    },
    ["garage-tab-counts", userId],
    { revalidate: 45 },
  )();
}

/** Nombre de favoris — onglet Recherche. */
export function getCachedFavCount(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = createClient();
      const { count } = await supabase
        .from("favorites")
        .select("vehicle_id", { count: "exact", head: true })
        .eq("dealer_id", userId);
      return count ?? 0;
    },
    ["recherche-fav-count", userId],
    { revalidate: 45 },
  )();
}
