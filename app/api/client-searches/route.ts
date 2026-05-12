import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import { sourcingDifficultyMeta } from "@/lib/client-search-matching";
import { logClientSearchEvent } from "@/lib/client-search-events";
import type { ClientSearch, ClientSearchGearbox, ClientSearchPriority, ClientSearchStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS: ClientSearchStatus[] = [
  "active",
  "vehicle_found",
  "negotiating",
  "completed",
  "abandoned",
];
const ALLOWED_PRIORITY: ClientSearchPriority[] = ["normal", "urgent", "premium"];
const ALLOWED_GEARBOX: (ClientSearchGearbox | null)[] = ["automatic", "manual", null];

/**
 * GET /api/client-searches
 */
export async function GET() {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("client_searches")
    .select("*")
    .eq("dealer_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ searches: data as ClientSearch[] });
}

/**
 * POST /api/client-searches — création
 */
export async function POST(req: Request) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const client_name = String(body.client_name ?? "").trim();
  const brand = String(body.brand ?? "").trim();
  const model = String(body.model ?? "").trim();
  if (!client_name || !brand || !model) {
    return NextResponse.json(
      { error: "client_name, brand et model sont requis" },
      { status: 400 },
    );
  }

  const status = (body.status as string) || "active";
  if (!ALLOWED_STATUS.includes(status as ClientSearchStatus)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }
  const priority = (body.priority as string) || "normal";
  if (!ALLOWED_PRIORITY.includes(priority as ClientSearchPriority)) {
    return NextResponse.json({ error: "Priorité invalide" }, { status: 400 });
  }

  let gearbox: ClientSearchGearbox | null = (body.gearbox as ClientSearchGearbox) ?? null;
  if (body.gearbox === "" || body.gearbox == null) gearbox = null;
  else if (!ALLOWED_GEARBOX.includes(gearbox)) {
    return NextResponse.json({ error: "Boîte invalide" }, { status: 400 });
  }

  const row = {
    dealer_id: user.id,
    client_name,
    client_phone: body.client_phone ? String(body.client_phone).trim() || null : null,
    client_notes: body.client_notes ? String(body.client_notes).trim() || null : null,
    brand,
    model,
    version: body.version ? String(body.version).trim() || null : null,
    fuel: body.fuel ? String(body.fuel).trim() || null : null,
    gearbox,
    budget_min: body.budget_min != null && body.budget_min !== "" ? Number(body.budget_min) : null,
    budget_max: body.budget_max != null && body.budget_max !== "" ? Number(body.budget_max) : null,
    mileage_max:
      body.mileage_max != null && body.mileage_max !== "" ? parseInt(String(body.mileage_max), 10) : null,
    year_min: body.year_min != null && body.year_min !== "" ? parseInt(String(body.year_min), 10) : null,
    geo_zone: body.geo_zone ? String(body.geo_zone).trim() || null : null,
    distance_max_km:
      body.distance_max_km != null && body.distance_max_km !== ""
        ? parseInt(String(body.distance_max_km), 10)
        : null,
    priority: priority as ClientSearchPriority,
    status: status as ClientSearchStatus,
    internal_notes: body.internal_notes ? String(body.internal_notes).trim() || null : null,
    sourcing_progress:
      body.sourcing_progress != null ? Math.min(100, Math.max(0, Number(body.sourcing_progress))) : 0,
  };

  const meta = sourcingDifficultyMeta(row as unknown as ClientSearch);

  const { data, error } = await supabase
    .from("client_searches")
    .insert({
      ...row,
      is_rare: meta.isRare,
      difficulty_score: meta.difficulty,
      eta_days_min: meta.etaMin,
      eta_days_max: meta.etaMax,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const search = data as ClientSearch;
  await logClientSearchEvent(supabase, search.id, "created", { client_name, brand, model });
  return NextResponse.json({ search });
}
