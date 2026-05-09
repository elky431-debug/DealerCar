import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/vehicle-specs/:id
 * Détail d'une fiche ADEME.
 */
export async function GET(
  _req: Request,
  ctx: { params: { id: string } },
) {
  const { supabase, user } = await getServerAuth();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("vehicle_specs")
    .select("*")
    .eq("id", ctx.params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
