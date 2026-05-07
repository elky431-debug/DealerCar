"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ClipboardCopy,
  Save,
  Camera,
  Sparkles,
  ShieldCheck,
  Film,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn, formatMileage, formatPrice } from "@/lib/utils";
import type { VehicleWithRelations } from "@/lib/types";

interface Props {
  vehicle: VehicleWithRelations;
}

interface ChecklistItem {
  key: "photos_ok" | "clean_ok" | "ct_ok" | "video_ok";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

const CHECKLIST: ChecklistItem[] = [
  { key: "photos_ok", label: "Photos prises", icon: Camera, desc: "8 à 12 photos minimum" },
  { key: "clean_ok", label: "Véhicule propre", icon: Sparkles, desc: "Carrosserie + intérieur" },
  { key: "ct_ok", label: "Contrôle technique", icon: ShieldCheck, desc: "À jour ou récent" },
  { key: "video_ok", label: "Vidéo réalisée", icon: Film, desc: "Tour rapide intérieur/extérieur" },
];

export function ListingEditor({ vehicle }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, startTransition] = useTransition();

  const [title, setTitle] = useState(vehicle.listing_title ?? "");
  const [description, setDescription] = useState(vehicle.description ?? "");
  const [checks, setChecks] = useState({
    photos_ok: vehicle.photos_ok,
    clean_ok: vehicle.clean_ok,
    ct_ok: vehicle.ct_ok,
    video_ok: vehicle.video_ok,
  });
  const [busy, setBusy] = useState(false);

  const dirty =
    (vehicle.listing_title ?? "") !== title ||
    (vehicle.description ?? "") !== description ||
    vehicle.photos_ok !== checks.photos_ok ||
    vehicle.clean_ok !== checks.clean_ok ||
    vehicle.ct_ok !== checks.ct_ok ||
    vehicle.video_ok !== checks.video_ok;

  const score = Object.values(checks).filter(Boolean).length;

  async function save() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("vehicles")
      .update({
        listing_title: title || null,
        description: description || null,
        ...checks,
      })
      .eq("id", vehicle.id);
    setBusy(false);
    if (error) {
      toast.error("Sauvegarde impossible", error.message);
      return;
    }
    toast.success("Annonce enregistrée");
    startTransition(() => router.refresh());
  }

  function copyListing() {
    const computedTitle = title || `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
    const lines = [
      computedTitle.toUpperCase(),
      "",
      `${vehicle.brand} ${vehicle.model} · ${vehicle.year} · ${formatMileage(vehicle.mileage)}`,
      `Prix : ${formatPrice(vehicle.price)}`,
      `Localisation : ${vehicle.location}`,
      "",
      description || "—",
    ];
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast.success("Annonce copiée", "Prête à coller sur Leboncoin, La Centrale, etc."))
      .catch(() => toast.error("Copie impossible"));
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Annonce
          </p>
          <h2 className="text-[24px] font-semibold tracking-tight">
            {vehicle.brand} {vehicle.model}{" "}
            <span className="font-normal text-muted-foreground tabular">{vehicle.year}</span>
          </h2>
          <p className="text-[13px] text-muted-foreground tabular">
            {formatPrice(vehicle.price)} · {formatMileage(vehicle.mileage)} · {vehicle.location}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/garage/vehicules/${vehicle.id}`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-3.5 w-3.5" /> Fiche véhicule
            </Button>
          </Link>
          <Button type="button" variant="secondary" onClick={copyListing}>
            <ClipboardCopy className="h-4 w-4" /> Copier l'annonce
          </Button>
          <Button type="button" onClick={save} loading={busy} disabled={!dirty}>
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Editor */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
            <Field
              label="Titre de l'annonce"
              hint="Court, percutant. Ex: « Renault Clio 1.5 dCi · 2018 · 87 000 km · CT OK »"
            >
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
              />
            </Field>

            <div className="mt-4">
              <Field
                label="Description"
                hint="Décrivez l'historique, l'état, les options. Évitez le jargon."
              >
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={9}
                  placeholder="Véhicule entretenu, factures à l'appui, équipement complet…"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Qualité
              </h3>
              <span
                className={cn(
                  "tabular text-[13px] font-semibold",
                  score === 4 ? "text-emerald-600" : "text-foreground",
                )}
              >
                {score}/4
              </span>
            </div>

            {/* Mini progress */}
            <div className="mb-4 flex h-1.5 gap-1 rounded-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex-1 rounded-full",
                    i < score ? "bg-emerald-500" : "bg-muted",
                  )}
                />
              ))}
            </div>

            <ul className="space-y-1">
              {CHECKLIST.map((item) => {
                const on = checks[item.key];
                const Icon = item.icon;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => setChecks((c) => ({ ...c, [item.key]: !c[item.key] }))}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                        on
                          ? "border-emerald-200 bg-emerald-50/60"
                          : "border-border/60 bg-background hover:border-foreground/30",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                          on
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {on ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium tracking-tight">{item.label}</p>
                        <p className="text-[11.5px] text-muted-foreground">{item.desc}</p>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
