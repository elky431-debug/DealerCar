import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/vehicle-specs
 *
 * Liste paginée du référentiel ADEME.
 *
 * Query params (tous optionnels) :
 *   - limit  (1-100, défaut 50)
 *   - offset (défaut 0)
 *   - brand  (filtre marque, ILIKE)
 *   - fuel   (filtre énergie exact)
 */
export async function GET(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = clamp(Number(url.searchParams.get("limit")) || 50, 1, 100);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);
  const brand = url.searchParams.get("brand")?.trim();
  const fuel = url.searchParams.get("fuel")?.trim().toUpperCase();

  let query = supabase
    .from("vehicle_specs")
    .select("*", { count: "exact" })
    .order("brand", { ascending: true })
    .order("model_label", { ascending: true })
    .range(offset, offset + limit - 1);

  if (brand) query = query.ilike("brand", `%${brand}%`);
  if (fuel) query = query.eq("fuel_type", fuel);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    pagination: { total: count ?? 0, limit, offset },
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
