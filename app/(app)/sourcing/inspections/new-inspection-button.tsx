"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function NewInspectionButton({
  variant = "primary",
}: {
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    vehicle_brand: "",
    vehicle_model: "",
    vehicle_year: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Titre requis");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          vehicle_brand: form.vehicle_brand.trim() || undefined,
          vehicle_model: form.vehicle_model.trim() || undefined,
          vehicle_year: form.vehicle_year
            ? Number(form.vehicle_year)
            : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      router.push(`/sourcing/inspections/${json.inspection.id}`);
    } catch (err) {
      toast.error(
        "Création impossible",
        err instanceof Error ? err.message : "Erreur",
      );
    } finally {
      setLoading(false);
    }
  }

  // Suggestion auto du titre depuis marque/modèle
  function autoTitle(brand: string, model: string, year: string) {
    if (form.title) return; // ne pas écraser une saisie utilisateur
    const parts = [brand, model, year].filter(Boolean);
    if (parts.length >= 2) {
      setForm((f) => ({ ...f, title: parts.join(" ") }));
    }
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nouvelle consultation
      </Button>

      <Modal
        open={open}
        onClose={() => !loading && setOpen(false)}
        title="Nouvelle consultation"
        description="Donnez un nom à cette inspection. Vous pourrez préciser le véhicule plus tard si besoin."
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nom de la consultation" required>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Ex: Renault Clio 2020 - vendeur particulier"
              autoFocus
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Marque (optionnel)">
              <Input
                value={form.vehicle_brand}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({ ...f, vehicle_brand: v }));
                  autoTitle(v, form.vehicle_model, form.vehicle_year);
                }}
                placeholder="Renault"
              />
            </Field>
            <Field label="Modèle (optionnel)">
              <Input
                value={form.vehicle_model}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({ ...f, vehicle_model: v }));
                  autoTitle(form.vehicle_brand, v, form.vehicle_year);
                }}
                placeholder="Clio"
              />
            </Field>
          </div>

          <Field label="Année (optionnel)">
            <Input
              type="number"
              min="1990"
              max="2030"
              value={form.vehicle_year}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, vehicle_year: v }));
                autoTitle(form.vehicle_brand, form.vehicle_model, v);
              }}
              placeholder="2020"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Création…
                </>
              ) : (
                <>Démarrer</>
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
