import { NextResponse } from "next/server";
import { OPENAI_MODEL, getOpenAIClient } from "@/lib/openai";
import { getServerAuth } from "@/lib/supabase/server";
import type { ClientSearch, SourcingContact } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

type Channel = "whatsapp" | "sms" | "email";
type Tone = "professional" | "quick" | "friendly";

function toneHint(t: Tone): string {
  switch (t) {
    case "professional":
      return "Ton professionnel, courtois, phrases complètes, sans emoji excessif.";
    case "quick":
      return "Très court, style SMS, aller à l'essentiel, 2–4 phrases max.";
    case "friendly":
      return "Ton chaleureux et terrain, tutoiement si naturel, 1 emoji max à la fin si approprié.";
    default:
      return "";
  }
}

function channelHint(c: Channel): string {
  switch (c) {
    case "whatsapp":
      return "Format message WhatsApp : paragraphes courts, une seule question claire à la fin.";
    case "sms":
      return "Format SMS : 300 caractères max si possible, pas de formule trop longue.";
    case "email":
      return "Format email court : objet suggéré + corps en 3–5 lignes max.";
    default:
      return "";
  }
}

function summarizeSearch(cs: ClientSearch): string {
  const parts: string[] = [];
  parts.push(`${cs.brand} ${cs.model}${cs.version ? ` ${cs.version}` : ""}`);
  if (cs.gearbox === "automatic") parts.push("boîte auto");
  if (cs.gearbox === "manual") parts.push("boîte manuelle");
  if (cs.fuel?.trim()) parts.push(`carburant ${cs.fuel}`);
  if (cs.budget_min != null || cs.budget_max != null) {
    const a = cs.budget_min != null ? `${cs.budget_min}€` : null;
    const b = cs.budget_max != null ? `${cs.budget_max}€` : null;
    if (a && b) parts.push(`budget ${a}–${b}`);
    else if (b) parts.push(`budget max ${b}`);
    else if (a) parts.push(`budget min ${a}`);
  }
  if (cs.mileage_max != null) parts.push(`km max ${cs.mileage_max}`);
  if (cs.year_min != null) parts.push(`année min ${cs.year_min}`);
  if (cs.geo_zone?.trim()) parts.push(`zone ${cs.geo_zone}`);
  return parts.join(", ");
}

/**
 * POST /api/client-searches/:id/ai-message
 * Body: { contact_id: string, channel?: Channel, tone?: Tone }
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await getServerAuth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { contact_id?: string; channel?: Channel; tone?: Tone };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const contact_id = body.contact_id?.trim();
  if (!contact_id) return NextResponse.json({ error: "contact_id requis" }, { status: 400 });

  const channel: Channel = body.channel ?? "whatsapp";
  const tone: Tone = body.tone ?? "friendly";
  if (!["whatsapp", "sms", "email"].includes(channel)) {
    return NextResponse.json({ error: "Canal invalide" }, { status: 400 });
  }
  if (!["professional", "quick", "friendly"].includes(tone)) {
    return NextResponse.json({ error: "Style invalide" }, { status: 400 });
  }

  const [{ data: search, error: sErr }, { data: contact, error: cErr }] = await Promise.all([
    supabase
      .from("client_searches")
      .select("*")
      .eq("id", params.id)
      .eq("dealer_id", user.id)
      .single(),
    supabase
      .from("sourcing_contacts")
      .select("*")
      .eq("id", contact_id)
      .eq("dealer_id", user.id)
      .single(),
  ]);

  if (sErr || !search) return NextResponse.json({ error: "Recherche introuvable" }, { status: 404 });
  if (cErr || !contact) return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });

  const cs = search as ClientSearch;
  const ct = contact as SourcingContact;
  const greet = ct.contact_name?.trim() || "toi";
  const summary = summarizeSearch(cs);

  let subject: string | undefined;
  if (channel === "email") {
    subject = `Recherche ${cs.brand} ${cs.model} — ${cs.client_name}`;
  }

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `Tu es un assistant pour un marchand automobile en France. Tu rédiges des messages à envoyer à des garages partenaires pour sourcer un véhicule pour un client.
${toneHint(tone)}
${channelHint(channel)}
Ne invente pas de stock ni de prix. Demande simplement si une opportunité existe dans leurs arrivages.
Réponds UNIQUEMENT avec le texte du message (pas d'explication).`,
        },
        {
          role: "user",
          content: `Contact : ${greet} (${ct.garage_name}${ct.specialty ? `, spécialité : ${ct.specialty}` : ""}).
Recherche client (${cs.client_name}) : ${summary}.
Commence par une salutation courte avec le prénom ou « Salut » si pas de prénom.`,
        },
      ],
      max_tokens: 400,
      temperature: 0.65,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json({ error: "Réponse IA vide" }, { status: 502 });
    }

    return NextResponse.json({ message: text, subject, channel, tone });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur IA";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
