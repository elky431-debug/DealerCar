import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Compteurs onglets Garage — dédoublonnage par requête (React cache).
 * On n’utilise pas `unstable_cache` ici : il interdit `cookies()` alors que
 * `createClient()` lit la session pour RLS.
 */
export const getCachedGarageTabCounts = cache(async (userId: string) => {
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
});

/** Nombre de favoris — onglet Recherche. */
export const getCachedFavCount = cache(async (userId: string) => {
  const supabase = createClient();
  const { count } = await supabase
    .from("favorites")
    .select("vehicle_id", { count: "exact", head: true })
    .eq("dealer_id", userId);
  return count ?? 0;
});
