import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import type { VehicleInspection } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/inspections — liste les inspections du dealer.
 */
export async function GET() {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("vehicle_inspections")
    .select("*")
    .eq("dealer_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ inspections: data as VehicleInspection[] });
}

/**
 * POST /api/inspections — crée une nouvelle inspection.
 * Body : { title, vehicle_brand?, vehicle_model?, vehicle_year? }
 */
export async function POST(req: Request) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: {
    title?: string;
    vehicle_brand?: string;
    vehicle_model?: string;
    vehicle_year?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Titre requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("vehicle_inspections")
    .insert({
      dealer_id: user.id,
      title,
      vehicle_brand: body.vehicle_brand?.trim() || null,
      vehicle_model: body.vehicle_model?.trim() || null,
      vehicle_year: body.vehicle_year ?? null,
      current_step: 1,
      steps_state: {},
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ inspection: data as VehicleInspection });
}
