import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import { logClientSearchEvent } from "@/lib/client-search-events";
import type { ClientSearchSourceAssignment, SourceFollowUpStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: SourceFollowUpStatus[] = ["no_response", "pending", "vehicle_found", "declined"];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; assignmentId: string } },
) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: {
    follow_up_status?: SourceFollowUpStatus;
    last_contacted_at?: string | null;
    response_received?: string | null;
    vehicle_available?: boolean | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.follow_up_status != null) {
    if (!ALLOWED.includes(body.follow_up_status)) {
      return NextResponse.json({ error: "Statut suivi invalide" }, { status: 400 });
    }
    patch.follow_up_status = body.follow_up_status;
  }
  if (body.last_contacted_at !== undefined) {
    patch.last_contacted_at = body.last_contacted_at || null;
  }
  if (body.response_received !== undefined) {
    patch.response_received = body.response_received?.trim() || null;
  }
  if (body.vehicle_available !== undefined) patch.vehicle_available = body.vehicle_available;

  const { data, error } = await supabase
    .from("client_search_source_assignments")
    .update(patch)
    .eq("id", params.assignmentId)
    .eq("search_id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await logClientSearchEvent(supabase, params.id, "source_updated", {
    assignment_id: params.assignmentId,
    patch,
  });

  return NextResponse.json({ assignment: data as ClientSearchSourceAssignment });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; assignmentId: string } },
) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("client_search_source_assignments")
    .delete()
    .eq("id", params.assignmentId)
    .eq("search_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logClientSearchEvent(supabase, params.id, "source_removed", {
    assignment_id: params.assignmentId,
  });
  return NextResponse.json({ ok: true });
}
