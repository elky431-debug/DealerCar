import { OPENAI_MODEL, getOpenAIClient } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import type { CostCategory } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const RESPONSE_RULES = `RÈGLES DE RÉPONSE — OBLIGATOIRES :
- Réponds TOUJOURS en moins de 5 lignes maximum.
- Pas d'introduction, pas de conclusion, va droit au fait.
- Pas de "Bien sûr !", "Voici", "En tant qu'assistant…" — commence directement par la réponse.
- Si c'est un chiffre ou une stat : réponds en 1-2 lignes maximum.
- Si c'est une liste : maximum 5 items, format court (tiret + info essentielle).
- Si c'est une annonce à rédiger : max 4 lignes, ton pro mais concis.
- Utilise des chiffres précis tirés des données — jamais de généralités vagues.
- Termine par une action concrète si pertinent (ex : "→ Relancer Marc Laurent").
- N'INVENTE JAMAIS de données qui ne sont pas dans le contexte ci-dessous.
- Si la donnée demandée n'est pas disponible, dis-le en 1 ligne et propose comment l'obtenir.`;

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  price: number | null;
  status: "available" | "reserved" | "sold";
  visibility: "private" | "network";
  type: "stock" | "depot";
  location: string | null;
  created_at: string;
  sold_at: string | null;
  purchase_price: number | null;
  client_price: number | null;
  commission_type: "fixed" | "percent" | null;
  commission_value: number | null;
  deposit_client_name: string | null;
}

interface LeadRow {
  id: string;
  name: string;
  status: "new" | "contacted" | "hot" | "cold" | "won" | "lost";
  updated_at: string;
  vehicles: { brand: string; model: string; year: number } | null;
}

interface CostRow {
  vehicle_id: string;
  amount: number;
  category: CostCategory;
}

function dayDiff(iso: string | null, ref = Date.now()): number {
  if (!iso) return 0;
  return Math.floor((ref - new Date(iso).getTime()) / 86400000);
}

const STATUS_FR: Record<string, string> = {
  available: "disponible",
  reserved: "réservé",
  sold: "vendu",
};
const LEAD_STATUS_FR: Record<string, string> = {
  new: "nouveau",
  contacted: "contacté",
  hot: "chaud",
  cold: "froid",
  won: "gagné",
  lost: "perdu",
};

async function buildSystemPrompt(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    return `Tu es l'assistant DealerLink.\n\n${RESPONSE_RULES}`;
  }

  const [{ data: profile }, { data: vehicles }, { data: leads }, { data: costs }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("company_name, location")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("vehicles")
        .select(
          "id, brand, model, year, mileage, price, status, visibility, type, location, created_at, sold_at, purchase_price, client_price, commission_type, commission_value, deposit_client_name",
        )
        .eq("dealer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("vehicle_leads")
        .select("id, name, status, updated_at, vehicles(brand, model, year)")
        .eq("dealer_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(40),
      supabase
        .from("vehicle_costs")
        .select("vehicle_id, amount, category")
        .eq("dealer_id", user.id),
    ]);

  const list = (vehicles ?? []) as VehicleRow[];
  const leadsList = (leads ?? []) as unknown as LeadRow[];
  const costsList = (costs ?? []) as CostRow[];

  const costsByVehicle = new Map<string, number>();
  for (const c of costsList) {
    costsByVehicle.set(
      c.vehicle_id,
      (costsByVehicle.get(c.vehicle_id) ?? 0) + Number(c.amount ?? 0),
    );
  }

  const inStock = list.filter((v) => v.status !== "sold");
  const available = list.filter((v) => v.status === "available");
  const reserved = list.filter((v) => v.status === "reserved");
  const sold = list.filter((v) => v.status === "sold");
  const networkVisible = available.filter((v) => v.visibility === "network");
  const deposits = list.filter((v) => v.type === "depot" && v.status !== "sold");

  const stockValue = inStock.reduce((s, v) => s + Number(v.price ?? 0), 0);
  const stockOldThan60 = inStock.filter((v) => dayDiff(v.created_at) > 60);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const soldThisMonth = sold.filter(
    (v) => v.sold_at && new Date(v.sold_at) >= monthStart,
  );
  const monthRevenue = soldThisMonth.reduce(
    (s, v) => s + Number(v.price ?? 0),
    0,
  );
  const monthMargin = soldThisMonth.reduce((s, v) => {
    const purchase = Number(v.purchase_price ?? 0);
    const repairs = costsByVehicle.get(v.id) ?? 0;
    return s + (Number(v.price ?? 0) - purchase - repairs);
  }, 0);

  const potentialMargins = inStock
    .map((v) => {
      const purchase = Number(v.purchase_price ?? 0);
      const repairs = costsByVehicle.get(v.id) ?? 0;
      return {
        v,
        margin: purchase > 0 ? Number(v.price ?? 0) - purchase - repairs : null,
      };
    })
    .filter((x) => x.margin != null)
    .sort((a, b) => b.margin! - a.margin!);

  const topMargin = potentialMargins[0];

  const leadsToFollowUp = leadsList
    .filter((l) => ["new", "contacted", "hot"].includes(l.status))
    .filter((l) => dayDiff(l.updated_at) >= 3)
    .slice(0, 12);

  const depositCommission = deposits.reduce((s, v) => {
    if (v.commission_type === "fixed") return s + Number(v.commission_value ?? 0);
    if (v.commission_type === "percent" && v.client_price != null) {
      return (
        s +
        (Number(v.client_price) * Number(v.commission_value ?? 0)) / 100
      );
    }
    return s;
  }, 0);

  const fmtEUR = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  const fmtKm = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " km";

  const todayFr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const garageName = profile?.company_name ?? "votre garage";
  const marginPct =
    monthRevenue > 0 ? ` (${((monthMargin / monthRevenue) * 100).toFixed(1)}%)` : "";

  return `Tu es l'assistant de ${garageName} sur DealerLink, une plateforme B2B de marchands automobiles.

${RESPONSE_RULES}

DONNÉES DU GARAGE (${todayFr}) :

INVENTAIRE : ${list.length} véhicules · ${available.length} dispo · ${reserved.length} réservés · ${sold.length} vendus · ${networkVisible.length} au réseau · valeur stock ${fmtEUR(stockValue)} · ${stockOldThan60.length} en stock +60j

STOCK :
${
  inStock.length === 0
    ? "(aucun)"
    : inStock
        .slice(0, 50)
        .map((v) => {
          const days = dayDiff(v.created_at);
          const repairs = costsByVehicle.get(v.id) ?? 0;
          const purchase = Number(v.purchase_price ?? 0);
          const margin =
            purchase > 0 ? Number(v.price ?? 0) - purchase - repairs : null;
          const tags: string[] = [
            STATUS_FR[v.status],
            v.visibility === "network" ? "réseau" : "privé",
            `${days}j stock`,
          ];
          if (v.type === "depot") tags.push("DÉPÔT");
          if (margin != null) tags.push(`marge ${fmtEUR(margin)}`);
          if (repairs > 0) tags.push(`frais ${fmtEUR(repairs)}`);
          return `- ${v.brand} ${v.model} ${v.year} · ${fmtKm(v.mileage)} · ${fmtEUR(Number(v.price ?? 0))} · ${tags.join(" · ")}`;
        })
        .join("\n")
}

DÉPÔTS-VENTE :
${
  deposits.length === 0
    ? "(aucun)"
    : deposits
        .slice(0, 30)
        .map((v) => {
          const com =
            v.commission_type === "fixed"
              ? fmtEUR(Number(v.commission_value ?? 0))
              : v.commission_type === "percent" && v.client_price != null
                ? `${v.commission_value}% (~${fmtEUR((Number(v.client_price) * Number(v.commission_value ?? 0)) / 100)})`
                : "—";
          return `- ${v.brand} ${v.model} ${v.year} · ${v.deposit_client_name ?? "—"} · ${fmtEUR(Number(v.price ?? 0))} · commission ${com}`;
        })
        .join("\n")
}

PROSPECTS :
${
  leadsList.length === 0
    ? "(aucun)"
    : leadsList
        .slice(0, 25)
        .map((l) => {
          const days = dayDiff(l.updated_at);
          const veh = l.vehicles
            ? `${l.vehicles.brand} ${l.vehicles.model} ${l.vehicles.year}`
            : "—";
          return `- ${l.name} · ${veh} · ${LEAD_STATUS_FR[l.status]} · dernière action ${days}j`;
        })
        .join("\n")
}

À RELANCER (statut actif, MAJ ≥ 3j) — ${leadsToFollowUp.length} :
${
  leadsToFollowUp.length === 0
    ? "(aucun)"
    : leadsToFollowUp
        .map((l) => {
          const days = dayDiff(l.updated_at);
          const veh = l.vehicles ? ` (${l.vehicles.brand} ${l.vehicles.model})` : "";
          return `- ${l.name}${veh} · ${LEAD_STATUS_FR[l.status]} · +${days}j`;
        })
        .join("\n")
}

VENTES CE MOIS : ${soldThisMonth.length} ventes · ${fmtEUR(monthRevenue)} CA · ${fmtEUR(monthMargin)} marge${marginPct}

PERFORMANCE : top marge stock = ${
    topMargin
      ? `${topMargin.v.brand} ${topMargin.v.model} ${topMargin.v.year} (${fmtEUR(topMargin.margin!)})`
      : "indisponible — renseigner les prix d'achat dans Gestion → Historique des ventes"
  } · commissions dépôts cumulées potentielles ${fmtEUR(depositCommission)}`;
}

export async function POST(req: Request) {
  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) =>
      m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
  );
  if (messages.length === 0) {
    return new Response("Aucun message.", { status: 400 });
  }

  let client;
  try {
    client = getOpenAIClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Configuration IA manquante.";
    return new Response(msg, { status: 500 });
  }

  let systemPrompt: string;
  try {
    systemPrompt = await buildSystemPrompt();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur contexte garage";
    return new Response(msg, { status: 500 });
  }

  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        const stream = await client.chat.completions.create({
          model: OPENAI_MODEL,
          stream: true,
          max_tokens: 1200,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "stream error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
