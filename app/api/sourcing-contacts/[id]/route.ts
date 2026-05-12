import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import type { SourcingContact } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Partial<{
    garage_name: string;
    contact_name: string | null;
    phone: string | null;
    city: string | null;
    specialty: string | null;
  }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.garage_name != null) patch.garage_name = body.garage_name.trim();
  if (body.contact_name !== undefined) patch.contact_name = body.contact_name?.trim() || null;
  if (body.phone !== undefined) patch.phone = body.phone?.trim() || null;
  if (body.city !== undefined) patch.city = body.city?.trim() || null;
  if (body.specialty !== undefined) patch.specialty = body.specialty?.trim() || null;

  const { data, error } = await supabase
    .from("sourcing_contacts")
    .update(patch)
    .eq("id", params.id)
    .eq("dealer_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ contact: data as SourcingContact });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { error } = await supabase
    .from("sourcing_contacts")
    .delete()
    .eq("id", params.id)
    .eq("dealer_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
