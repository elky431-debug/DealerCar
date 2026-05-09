import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import type {
  InspectionDecision,
  InspectionStepState,
  VehicleInspection,
} from "@/lib/types";

export const dynamic = "force-dynamic";

interface PatchBody {
  title?: string;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_plate?: string | null;
  vehicle_vin?: string | null;
  buyer_first_name?: string | null;
  buyer_last_name?: string | null;
  current_step?: number;
  /** Patch partiel du steps_state : on merge serveur. */
  step_patch?: { id: string; state: InspectionStepState };
  decision?: InspectionDecision | null;
  decision_notes?: string | null;
  /** Marque l'inspection comme terminée (set completed_at = now). */
  complete?: boolean;
}

/**
 * PATCH /api/inspections/:id
 * Mise à jour partielle. Pour le state d'une étape on accepte un
 * `step_patch` qui est mergé avec le steps_state existant.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  // Lire l'existant pour le merge de steps_state (un PATCH simple écrase tout sinon)
  const { data: existing, error: readErr } = await supabase
    .from("vehicle_inspections")
    .select("steps_state")
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .maybeSingle();

  if (readErr || !existing) {
    return NextResponse.json({ error: "Inspection introuvable" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};

  // Champs simples
  if (body.title !== undefined) update.title = body.title;
  if (body.vehicle_brand !== undefined) update.vehicle_brand = body.vehicle_brand;
  if (body.vehicle_model !== undefined) update.vehicle_model = body.vehicle_model;
  if (body.vehicle_year !== undefined) update.vehicle_year = body.vehicle_year;
  if (body.vehicle_plate !== undefined) update.vehicle_plate = body.vehicle_plate;
  if (body.vehicle_vin !== undefined) update.vehicle_vin = body.vehicle_vin;
  if (body.buyer_first_name !== undefined) update.buyer_first_name = body.buyer_first_name;
  if (body.buyer_last_name !== undefined) update.buyer_last_name = body.buyer_last_name;
  if (body.current_step !== undefined) update.current_step = body.current_step;
  if (body.decision !== undefined) update.decision = body.decision;
  if (body.decision_notes !== undefined) update.decision_notes = body.decision_notes;
  if (body.complete) update.completed_at = new Date().toISOString();

  // Merge step_patch sur steps_state existant
  if (body.step_patch) {
    const current =
      (existing.steps_state as Record<string, InspectionStepState>) ?? {};
    const previous = current[body.step_patch.id] ?? {};
    update.steps_state = {
      ...current,
      [body.step_patch.id]: {
        ...previous,
        ...body.step_patch.state,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Aucune modification" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("vehicle_inspections")
    .update(update)
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ inspection: data as VehicleInspection });
}

/**
 * DELETE /api/inspections/:id
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("vehicle_inspections")
    .delete()
    .eq("id", params.id)
    .eq("dealer_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
