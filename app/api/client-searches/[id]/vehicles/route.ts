import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import { compatibilityScore } from "@/lib/client-search-matching";
import { logClientSearchEvent } from "@/lib/client-search-events";
import type { ClientSearch, ClientSearchVehicleSlot, ClientSearchVehicleRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_SLOT: ClientSearchVehicleSlot[] = ["saved", "proposed", "seller_contacted"];

/**
 * GET /api/client-searches/:id/vehicles — shortlist
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("client_search_vehicles")
    .select("*")
    .eq("search_id", params.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vehicles: data as ClientSearchVehicleRow[] });
}

/**
 * POST /api/client-searches/:id/vehicles
 * Body: { vehicle_id: string, slot?: ClientSearchVehicleSlot }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { vehicle_id?: string; slot?: ClientSearchVehicleSlot };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const vehicle_id = body.vehicle_id?.trim();
  if (!vehicle_id) return NextResponse.json({ error: "vehicle_id requis" }, { status: 400 });

  const slot = body.slot ?? "saved";
  if (!ALLOWED_SLOT.includes(slot)) return NextResponse.json({ error: "slot invalide" }, { status: 400 });

  const { data: search, error: sErr } = await supabase
    .from("client_searches")
    .select("*")
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .single();

  if (sErr || !search) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { data: vehicle, error: vErr } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicle_id)
    .single();

  if (vErr || !vehicle) return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });

  const score = compatibilityScore(search as ClientSearch, vehicle);

  const { data: row, error: uErr } = await supabase
    .from("client_search_vehicles")
    .upsert(
      {
        search_id: params.id,
        vehicle_id,
        slot,
        compatibility_score: score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "search_id,vehicle_id" },
    )
    .select("*")
    .single();

  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  await logClientSearchEvent(supabase, params.id, "vehicle_shortlist", { vehicle_id, slot });
  return NextResponse.json({ row: row as ClientSearchVehicleRow });
}
