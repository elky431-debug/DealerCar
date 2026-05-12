import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import {
  buildSourcingHints,
  compatibilityScore,
  matchBand,
  type MatchBand,
} from "@/lib/client-search-matching";
import type { ClientSearch, Vehicle, VehicleImage, VehicleWithRelations } from "@/lib/types";

export const dynamic = "force-dynamic";

type MatchRow = VehicleWithRelations & {
  compatibility_score: number;
  band: MatchBand;
  is_new_listing: boolean;
};

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: search, error: sErr } = await supabase
    .from("client_searches")
    .select("*")
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .single();

  if (sErr || !search) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const cs = search as ClientSearch;

  let q = supabase
    .from("vehicles")
    .select(
      `
      *,
      vehicle_images(*),
      profiles!vehicles_dealer_id_fkey(company_name, phone, location)
    `,
    )
    .eq("status", "available")
    .or(`dealer_id.eq.${user.id},and(visibility.eq.network,dealer_id.neq.${user.id})`);

  const brand = cs.brand.trim();
  const model = cs.model.trim();
  if (brand) q = q.ilike("brand", `%${brand}%`);
  if (model) q = q.ilike("model", `%${model}%`);

  if (cs.budget_min != null) q = q.gte("price", cs.budget_min);
  if (cs.budget_max != null) q = q.lte("price", cs.budget_max);
  if (cs.mileage_max != null) q = q.lte("mileage", cs.mileage_max);
  if (cs.year_min != null) q = q.gte("year", cs.year_min);
  if (cs.geo_zone?.trim()) q = q.ilike("location", `%${cs.geo_zone.trim()}%`);

  const { data: rows, error: vErr } = await q.order("created_at", { ascending: false }).limit(350);

  if (vErr) {
    const { data: fallback, error: fErr } = await supabase
      .from("vehicles")
      .select("*, vehicle_images(*)")
      .eq("status", "available")
      .or(`dealer_id.eq.${user.id},and(visibility.eq.network,dealer_id.neq.${user.id})`)
      .ilike("brand", `%${brand}%`)
      .ilike("model", `%${model}%`)
      .order("created_at", { ascending: false })
      .limit(350);

    if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });
    return await finish(cs, (fallback ?? []) as Vehicle[], params.id, supabase, user.id);
  }

  return await finish(cs, (rows ?? []) as Vehicle[], params.id, supabase, user.id);
}

async function finish(
  cs: ClientSearch,
  vehicles: Vehicle[],
  searchId: string,
  supabase: Awaited<ReturnType<typeof getServerAuth>>["supabase"],
  userId: string,
) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const scored: MatchRow[] = vehicles.map((v) => {
    const score = compatibilityScore(cs, v);
    const band = matchBand(score);
    const created = new Date(v.created_at).getTime();
    return {
      ...(v as VehicleWithRelations),
      vehicle_images: ((v as VehicleWithRelations).vehicle_images ?? [])
        .slice()
        .sort((a: VehicleImage, b: VehicleImage) => a.position - b.position),
      profiles: (v as VehicleWithRelations).profiles ?? null,
      compatibility_score: score,
      band,
      is_new_listing: created >= sevenDaysAgo,
    };
  });

  scored.sort((a, b) => b.compatibility_score - a.compatibility_score);

  const strong = scored.filter((s) => s.band === "strong");
  const close = scored.filter((s) => s.band === "close");
  const stretch = scored.filter((s) => s.band === "stretch");

  const hints = buildSourcingHints(cs, strong.length);

  await supabase
    .from("client_searches")
    .update({
      cached_match_count: strong.length + close.length,
      cached_match_at: new Date().toISOString(),
    })
    .eq("id", searchId)
    .eq("dealer_id", userId);

  return NextResponse.json({
    strong,
    close,
    stretch,
    hints,
    total_scanned: scored.length,
  });
}
