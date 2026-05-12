import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import { sourcingDifficultyMeta } from "@/lib/client-search-matching";
import { logClientSearchEvent } from "@/lib/client-search-events";
import type {
  ClientSearch,
  ClientSearchGearbox,
  ClientSearchPriority,
  ClientSearchSourceAssignment,
  ClientSearchStatus,
  ClientSearchVehicleRow,
  SourcingContact,
} from "@/lib/types";

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

  const [{ data: assignments }, { data: shortlist }, { data: events }] = await Promise.all([
    supabase
      .from("client_search_source_assignments")
      .select("*, sourcing_contacts(*)")
      .eq("search_id", params.id),
    supabase.from("client_search_vehicles").select("*").eq("search_id", params.id),
    supabase
      .from("client_search_events")
      .select("*")
      .eq("search_id", params.id)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  await supabase
    .from("client_searches")
    .update({ last_opened_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("dealer_id", user.id);

  return NextResponse.json({
    search: search as ClientSearch,
    assignments: (assignments ?? []) as (ClientSearchSourceAssignment & {
      sourcing_contacts: SourcingContact | null;
    })[],
    shortlist: (shortlist ?? []) as ClientSearchVehicleRow[],
    events: events ?? [],
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: existing, error: exErr } = await supabase
    .from("client_searches")
    .select("*")
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .single();

  if (exErr || !existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  const str = (k: string) => (body[k] != null ? String(body[k]).trim() || null : undefined);

  if (body.client_name != null) patch.client_name = String(body.client_name).trim();
  if (body.client_phone !== undefined) patch.client_phone = str("client_phone");
  if (body.client_notes !== undefined) patch.client_notes = str("client_notes");
  if (body.brand != null) patch.brand = String(body.brand).trim();
  if (body.model != null) patch.model = String(body.model).trim();
  if (body.version !== undefined) patch.version = str("version");
  if (body.fuel !== undefined) patch.fuel = str("fuel");
  if (body.gearbox !== undefined) {
    const g = body.gearbox as string | null;
    if (g === "" || g == null) patch.gearbox = null;
    else if (!ALLOWED_GEARBOX.includes(g as ClientSearchGearbox)) {
      return NextResponse.json({ error: "Boîte invalide" }, { status: 400 });
    } else patch.gearbox = g;
  }
  if (body.budget_min !== undefined)
    patch.budget_min = body.budget_min === "" || body.budget_min == null ? null : Number(body.budget_min);
  if (body.budget_max !== undefined)
    patch.budget_max = body.budget_max === "" || body.budget_max == null ? null : Number(body.budget_max);
  if (body.mileage_max !== undefined)
    patch.mileage_max =
      body.mileage_max === "" || body.mileage_max == null ? null : parseInt(String(body.mileage_max), 10);
  if (body.year_min !== undefined)
    patch.year_min =
      body.year_min === "" || body.year_min == null ? null : parseInt(String(body.year_min), 10);
  if (body.geo_zone !== undefined) patch.geo_zone = str("geo_zone");
  if (body.distance_max_km !== undefined)
    patch.distance_max_km =
      body.distance_max_km === "" || body.distance_max_km == null
        ? null
        : parseInt(String(body.distance_max_km), 10);
  if (body.priority != null) {
    if (!ALLOWED_PRIORITY.includes(body.priority as ClientSearchPriority)) {
      return NextResponse.json({ error: "Priorité invalide" }, { status: 400 });
    }
    patch.priority = body.priority;
  }
  if (body.status != null) {
    if (!ALLOWED_STATUS.includes(body.status as ClientSearchStatus)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (body.internal_notes !== undefined) patch.internal_notes = str("internal_notes");
  if (body.sourcing_progress != null) {
    patch.sourcing_progress = Math.min(100, Math.max(0, Number(body.sourcing_progress)));
  }
  if (body.is_rare != null) patch.is_rare = Boolean(body.is_rare);

  const merged = { ...existing, ...patch } as ClientSearch;
  if (
    patch.brand != null ||
    patch.model != null ||
    patch.budget_max != null ||
    patch.mileage_max != null ||
    patch.year_min != null ||
    patch.geo_zone !== undefined ||
    patch.distance_max_km !== undefined ||
    patch.priority != null
  ) {
    const meta = sourcingDifficultyMeta(merged);
    patch.difficulty_score = meta.difficulty;
    patch.eta_days_min = meta.etaMin;
    patch.eta_days_max = meta.etaMax;
    if (body.is_rare == null) patch.is_rare = meta.isRare;
  }

  if (patch.status != null && patch.status !== existing.status) {
    await logClientSearchEvent(supabase, params.id, "status_change", {
      from: existing.status,
      to: patch.status,
    });
  }

  const { data, error } = await supabase
    .from("client_searches")
    .update(patch)
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ search: data as ClientSearch });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("client_searches")
    .delete()
    .eq("id", params.id)
    .eq("dealer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
