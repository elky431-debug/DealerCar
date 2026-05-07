"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Sparkles,
  Trash2,
  Wrench,
  Loader2,
  ReceiptText,
  Wand2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { RepairEstimateModal } from "@/components/repair-estimate-modal";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice, cn } from "@/lib/utils";
import {
  COST_CATEGORY_LABELS,
  type CostCategory,
  type VehicleCost,
} from "@/lib/types";

interface Props {
  vehicleId: string;
  userId: string;
  vehiclePrice: number;
  purchasePrice: number | null;
  costs: VehicleCost[];
}

export function CostsSection({
  vehicleId,
  userId,
  vehiclePrice,
  purchasePrice,
  costs: initialCosts,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [costs, setCosts] = useState<VehicleCost[]>(initialCosts);
  const [aiOpen, setAiOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("vehicle_costs")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .order("date", { ascending: false });
    if (data) setCosts(data as VehicleCost[]);
  }, [vehicleId]);

  const totalCosts = costs.reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const margin =
    purchasePrice != null ? vehiclePrice - purchasePrice - totalCosts : null;

  async function deleteCost(id: string) {
    if (!confirm("Supprimer cette ligne de frais ?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("vehicle_costs").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible", error.message);
      return;
    }
    setCosts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Frais supprimé");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      {/* IA banner */}
      <div className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_4px_14px_-2px_hsl(221_83%_53%/0.4)]">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[14px] font-semibold tracking-tight">
              Estimer les réparations par photo
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              Uploadez 1 à 5 photos — Claude Vision détecte les dommages et
              chiffre la réparation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAiOpen(true)} className="shrink-0">
            <Wand2 className="h-4 w-4" /> Lancer l'estimation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total des frais" value={formatPrice(totalCosts)} icon={<Wrench />} />
        <Stat
          label="Prix d'achat"
          value={purchasePrice != null ? formatPrice(purchasePrice) : "—"}
          hint={
            purchasePrice == null
              ? "Renseigne le dans Gestion → Historique des ventes pour calculer la marge"
              : undefined
          }
        />
        <Stat
          label="Marge prévisionnelle"
          value={margin != null ? formatPrice(margin) : "—"}
          tone={
            margin == null
              ? "neutral"
              : margin > 0
                ? "positive"
                : "negative"
          }
        />
      </div>

      {/* List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>Lignes de frais</CardTitle>
            <CardDescription>
              {costs.length} ligne{costs.length > 1 ? "s" : ""} · regroupe achat
              de pièces, main d'œuvre, contrôle, etc.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setManualOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {costs.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="h-5 w-5" />}
              title="Aucun frais enregistré"
              description="Ajoute manuellement ou utilise l'estimation IA pour démarrer."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-border/60 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 text-left">Date</th>
                    <th className="pb-2 pr-3 text-left">Catégorie</th>
                    <th className="pb-2 pr-3 text-left">Description</th>
                    <th className="pb-2 pr-3 text-right">Montant</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {costs.map((c) => (
                    <tr key={c.id} className="group">
                      <td className="py-2.5 pr-3 align-top tabular text-muted-foreground">
                        {formatDate(c.date)}
                      </td>
                      <td className="py-2.5 pr-3 align-top">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-medium">
                          {COST_CATEGORY_LABELS[c.category]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 align-top">
                        <div className="flex items-start gap-1.5">
                          {c.source === "ia_estimation" && (
                            <span
                              title="Estimation IA"
                              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-blue-100 text-blue-700"
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">{c.label}</p>
                            {c.notes && (
                              <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">
                                {c.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 align-top text-right">
                        <span className="tabular font-semibold">
                          {formatPrice(Number(c.amount))}
                        </span>
                      </td>
                      <td className="py-2.5 align-top text-right">
                        <button
                          type="button"
                          onClick={() => deleteCost(c.id)}
                          disabled={pending}
                          className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          aria-label="Supprimer"
                        >
                          {pending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/60">
                    <td colSpan={3} className="pt-3 text-right text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                      Total
                    </td>
                    <td className="pt-3 text-right">
                      <span className="tabular text-[15px] font-semibold tracking-tight">
                        {formatPrice(totalCosts)}
                      </span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <RepairEstimateModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        vehicleId={vehicleId}
        userId={userId}
        onSaved={() => {
          refresh();
          startTransition(() => router.refresh());
        }}
      />

      <ManualCostModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        vehicleId={vehicleId}
        userId={userId}
        onSaved={() => {
          refresh();
          startTransition(() => router.refresh());
        }}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
        ? "text-rose-700"
        : "text-foreground";
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {icon && (
          <span className="text-muted-foreground/70 [&_svg]:h-3.5 [&_svg]:w-3.5">
            {icon}
          </span>
        )}
      </div>
      <p className={cn("mt-1 text-[22px] font-semibold tabular leading-none tracking-[-0.02em]", valueClass)}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ManualCostModal({
  open,
  onClose,
  vehicleId,
  userId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  userId: string;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<CostCategory>("reparation");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setLabel("");
    setAmount("");
    setCategory("reparation");
    setDate(new Date().toISOString().slice(0, 10));
    setNotes("");
  }

  async function save() {
    const amt = Number(amount);
    if (!label.trim() || !Number.isFinite(amt) || amt < 0) {
      toast.error("Champs invalides", "Indiquez un libellé et un montant ≥ 0");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("vehicle_costs").insert({
      vehicle_id: vehicleId,
      dealer_id: userId,
      label: label.trim().slice(0, 240),
      amount: amt,
      category,
      date,
      source: "manuel",
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Enregistrement impossible", error.message);
      return;
    }
    toast.success("Frais ajouté");
    reset();
    onClose();
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && (reset(), onClose())}
      size="md"
      title="Ajouter un frais"
      description="Saisissez les dépenses liées à ce véhicule (réparations, CT, préparation…)."
      footer={
        <>
          <Button variant="outline" onClick={() => !saving && (reset(), onClose())}>
            Annuler
          </Button>
          <Button onClick={save} loading={saving}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Libellé" htmlFor="cost-label" required>
          <Input
            id="cost-label"
            placeholder="Ex. Pare-choc avant + main d'œuvre"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={240}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Catégorie" htmlFor="cost-cat">
            <Select
              id="cost-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as CostCategory)}
            >
              {Object.entries(COST_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="cost-date">
            <Input
              id="cost-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Montant" htmlFor="cost-amount" required hint="en €">
          <Input
            id="cost-amount"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Notes" htmlFor="cost-notes">
          <Textarea
            id="cost-notes"
            rows={3}
            placeholder="Détails, fournisseur, n° de facture…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
