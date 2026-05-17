"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { RepairEstimateModal } from "@/components/repair-estimate-modal";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice } from "@/lib/utils";
import type { VehicleCost } from "@/lib/types";

interface Props {
  vehicleId: string;
  userId: string;
  costs: VehicleCost[];
}

export function VehicleFraisTab({ vehicleId, userId, costs: initialCosts }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [costs, setCosts] = useState(initialCosts);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const total = costs.reduce((s, c) => s + Number(c.amount ?? 0), 0);

  async function handleAdd() {
    const trimmed = label.trim();
    const num = Number(amount);
    if (!trimmed) {
      toast.error("Libellé requis");
      return;
    }
    if (!Number.isFinite(num) || num < 0) {
      toast.error("Montant invalide");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vehicle_costs")
      .insert({
        vehicle_id: vehicleId,
        dealer_id: userId,
        label: trimmed,
        amount: num,
        date: date || new Date().toISOString().slice(0, 10),
        category: "autre",
        source: "manuel",
      })
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error("Ajout impossible", error.message);
      return;
    }
    setCosts((prev) => [data as VehicleCost, ...prev]);
    setLabel("");
    setAmount("");
    toast.success("Frais ajouté");
    startTransition(() => router.refresh());
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce frais ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("vehicle_costs").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible", error.message);
      return;
    }
    setCosts((prev) => prev.filter((c) => c.id !== id));
    startTransition(() => router.refresh());
  }

  const finput =
    "dl-input h-10 rounded-lg text-sm";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          placeholder="Libellé (ex: Révision)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={`${finput} sm:col-span-1`}
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Montant €"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={finput}
        />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={finput} />
      </div>
      <Button type="button" onClick={handleAdd} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
      </Button>

      <div className="mt-4 space-y-2">
        {costs.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun frais enregistré.</p>
        ) : (
          costs.map((cost) => (
            <div
              key={cost.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{cost.label}</p>
                <p className="text-xs text-gray-400">{formatDate(cost.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold tabular-nums text-gray-900">
                  {formatPrice(Number(cost.amount))}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(cost.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex justify-between border-t border-gray-100 pt-3">
        <p className="text-sm font-medium text-gray-500">Total frais</p>
        <p className="text-sm font-bold tabular-nums text-gray-900">{formatPrice(total)}</p>
      </div>

      <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Sparkles className="h-4 w-4 text-brand" />
          Estimation réparations par photo (IA)
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setAiOpen(true)}>
          <Wand2 className="h-4 w-4" />
          Lancer l&apos;estimation
        </Button>
      </div>

      <RepairEstimateModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        vehicleId={vehicleId}
        userId={userId}
        onSaved={() => {
          setAiOpen(false);
          startTransition(() => router.refresh());
        }}
      />
    </div>
  );
}
