"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus } from "@/lib/types";

/** Statuts UI (spec) mappés sur les statuts DB existants */
type LeadUiStatus = "contacte" | "relance" | "offre_faite";

const UI_TO_DB: Record<LeadUiStatus, LeadStatus> = {
  contacte: "contacted",
  relance: "hot",
  offre_faite: "won",
};

const DB_TO_UI: Record<string, LeadUiStatus> = {
  new: "contacte",
  contacted: "contacte",
  hot: "relance",
  cold: "relance",
  won: "offre_faite",
  lost: "relance",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Props {
  vehicleId: string;
  userId: string;
  leads: Lead[];
}

export function VehicleClientsTab({ vehicleId, userId, leads: initialLeads }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [leads, setLeads] = useState(initialLeads);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  async function updateStatus(leadId: string, uiStatus: LeadUiStatus) {
    const status = UI_TO_DB[uiStatus];
    const supabase = createClient();
    const { error } = await supabase.from("vehicle_leads").update({ status }).eq("id", leadId);
    if (error) {
      toast.error("Mise à jour impossible", error.message);
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
    startTransition(() => router.refresh());
  }

  async function handleAdd() {
    if (!name.trim()) {
      toast.error("Nom requis");
      return;
    }
    setAdding(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vehicle_leads")
      .insert({
        dealer_id: userId,
        vehicle_id: vehicleId,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        status: "contacted",
      })
      .select("*")
      .single();
    setAdding(false);
    if (error) {
      toast.error("Ajout impossible", error.message);
      return;
    }
    setLeads((prev) => [data as Lead, ...prev]);
    setName("");
    setPhone("");
    setEmail("");
    toast.success("Client ajouté");
    startTransition(() => router.refresh());
  }

  return (
    <div className="max-w-2xl space-y-4">
      {leads.map((lead) => {
        const uiStatus = DB_TO_UI[lead.status] ?? "contacte";
        return (
          <div
            key={lead.id}
            className="mb-2 flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
              {initials(lead.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
              <p className="truncate text-xs text-gray-400">
                {[lead.phone, lead.email].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <select
              value={uiStatus}
              onChange={(e) => updateStatus(lead.id, e.target.value as LeadUiStatus)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs"
            >
              <option value="contacte">Contacté</option>
              <option value="relance">Relance</option>
              <option value="offre_faite">Offre faite</option>
            </select>
          </div>
        );
      })}

      <div className="rounded-xl border border-dashed border-gray-200 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Nouveau prospect
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            placeholder="Nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="dl-input h-9 rounded-lg text-sm"
          />
          <input
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="dl-input h-9 rounded-lg text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="dl-input h-9 rounded-lg text-sm"
          />
        </div>
        <button
          type="button"
          disabled={adding}
          onClick={handleAdd}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-2 text-sm text-gray-500 transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "+ Ajouter un client intéressé"}
        </button>
      </div>
    </div>
  );
}
