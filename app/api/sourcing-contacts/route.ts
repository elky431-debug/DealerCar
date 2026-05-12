import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/supabase/server";
import { logClientSearchEvent } from "@/lib/client-search-events";
import type { SourcingContact } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/sourcing-contacts
 */
export async function GET() {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabase
    .from("sourcing_contacts")
    .select("*")
    .eq("dealer_id", user.id)
    .order("garage_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data as SourcingContact[] });
}

/**
 * POST /api/sourcing-contacts
 * Body: { garage_name, contact_name?, phone?, city?, specialty? }
 */
export async function POST(req: Request) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: {
    garage_name?: string;
    contact_name?: string | null;
    phone?: string | null;
    city?: string | null;
    specialty?: string | null;
    search_id?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const garage_name = (body.garage_name ?? "").trim();
  if (!garage_name) {
    return NextResponse.json({ error: "Nom du garage requis" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sourcing_contacts")
    .insert({
      dealer_id: user.id,
      garage_name,
      contact_name: body.contact_name?.trim() || null,
      phone: body.phone?.trim() || null,
      city: body.city?.trim() || null,
      specialty: body.specialty?.trim() || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const contact = data as SourcingContact;
  if (body.search_id) {
    await supabase.from("client_search_source_assignments").insert({
      search_id: body.search_id,
      contact_id: contact.id,
    });
    await logClientSearchEvent(supabase, body.search_id, "source_added", {
      contact_id: contact.id,
      garage_name: contact.garage_name,
    });
  }

  return NextResponse.json({ contact });
}
