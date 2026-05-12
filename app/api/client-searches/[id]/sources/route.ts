import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import { logClientSearchEvent } from "@/lib/client-search-events";

export const dynamic = "force-dynamic";

/**
 * POST /api/client-searches/:id/sources
 * Body: { contact_ids: string[] }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { contact_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const ids = (body.contact_ids ?? []).filter(Boolean);
  if (!ids.length) return NextResponse.json({ error: "contact_ids requis" }, { status: 400 });

  const { data: search, error: sErr } = await supabase
    .from("client_searches")
    .select("id")
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .single();

  if (sErr || !search) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const rows = ids.map((contact_id) => ({
    search_id: params.id,
    contact_id,
  }));

  const { error } = await supabase.from("client_search_source_assignments").upsert(rows, {
    onConflict: "search_id,contact_id",
    ignoreDuplicates: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logClientSearchEvent(supabase, params.id, "sources_linked", { contact_ids: ids });
  return NextResponse.json({ ok: true });
}
