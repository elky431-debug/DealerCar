"use client";

import { useCallback, useRef, useState } from "react";
import {
  Sparkles,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Camera,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { fileToCompressedBase64, formatPrice, cn } from "@/lib/utils";
import type { RepairEstimate } from "@/app/api/estimate-repair/route";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  userId: string;
  onSaved?: () => void;
}

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface ImageEntry {
  id: string;
  preview: string;
  base64: string;
  type: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
}

export function RepairEstimateModal({ open, onClose, vehicleId, userId, onSaved }: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageEntry[]>([]);
  const [comment, setComment] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [estimate, setEstimate] = useState<RepairEstimate | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setImages([]);
    setComment("");
    setEstimate(null);
    setAnalyzing(false);
    setSaving(false);
  }, []);

  const handleClose = useCallback(() => {
    if (analyzing || saving) return;
    reset();
    onClose();
  }, [analyzing, saving, reset, onClose]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remaining = MAX_PHOTOS - images.length;
      const arr = Array.from(files).slice(0, remaining);
      const next: ImageEntry[] = [];
      for (const f of arr) {
        if (f.size > MAX_FILE_SIZE) {
          toast.error("Fichier trop lourd", `${f.name} dépasse 10 Mo`);
          continue;
        }
        if (!/^image\//.test(f.type)) {
          toast.error("Format non supporté", "JPG, PNG ou WEBP uniquement");
          continue;
        }
        try {
          const { base64, type } = await fileToCompressedBase64(f);
          next.push({
            id: `${Date.now()}-${Math.random()}`,
            preview: URL.createObjectURL(f),
            base64,
            type,
          });
        } catch {
          toast.error("Lecture impossible", f.name);
        }
      }
      if (next.length) setImages((prev) => [...prev, ...next]);
    },
    [images.length, toast],
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  async function analyze() {
    if (images.length === 0 || analyzing) return;
    setAnalyzing(true);
    setEstimate(null);
    try {
      const res = await fetch("/api/estimate-repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: images.map(({ base64, type }) => ({ base64, type })),
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(
          "Erreur d'analyse",
          data?.error ?? "Réessayez dans quelques secondes",
        );
        setAnalyzing(false);
        return;
      }
      setEstimate(data.estimate as RepairEstimate);
    } catch (e) {
      toast.error(
        "Erreur réseau",
        e instanceof Error ? e.message : "Connexion impossible",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveAsCost() {
    if (!estimate || saving) return;
    const avg = Math.round((estimate.cout_total_min + estimate.cout_total_max) / 2);
    if (avg <= 0) {
      toast.error("Aucun coût à enregistrer");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const summary =
      estimate.zones_detectees.length > 0
        ? estimate.zones_detectees
            .map((z) => `${z.zone} (${z.gravite})`)
            .join(", ")
        : "Aucun dommage détecté";
    const notes = `Estimation IA — ${estimate.zones_detectees.length} zone(s) · fourchette ${formatPrice(
      estimate.cout_total_min,
    )} - ${formatPrice(estimate.cout_total_max)}\n${estimate.justification}${
      comment ? `\n\nContexte fourni : ${comment}` : ""
    }`;

    const { error } = await supabase.from("vehicle_costs").insert({
      vehicle_id: vehicleId,
      dealer_id: userId,
      label: `Réparations estimées : ${summary}`.slice(0, 240),
      amount: avg,
      category: "reparation",
      source: "ia_estimation",
      notes,
    });

    setSaving(false);
    if (error) {
      toast.error("Enregistrement impossible", error.message);
      return;
    }
    toast.success(
      "Frais enregistré",
      `${formatPrice(avg)} ajouté à la fiche véhicule`,
    );
    reset();
    onClose();
    onSaved?.();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Estimer les réparations par photo
        </span>
      }
      description="Uploadez 1 à 5 photos des zones endommagées — Claude estime le coût."
    >
      {!estimate && (
        <div className="space-y-4">
          {/* Drop zone */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/10",
              images.length >= MAX_PHOTOS && "pointer-events-none opacity-50",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Upload className="h-4.5 w-4.5" />
            </span>
            <p className="text-[14px] font-medium">
              Glissez vos photos ici ou cliquez pour choisir
            </p>
            <p className="text-[12px] text-muted-foreground">
              JPG · PNG · WEBP — 10 Mo max — {images.length}/{MAX_PHOTOS} photos
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
          </button>

          {/* Thumbnails */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border/60 bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/85 text-background opacity-0 shadow-lg transition-opacity hover:bg-foreground group-hover:opacity-100"
                    aria-label="Supprimer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Comment */}
          <div>
            <label
              htmlFor="repair-comment"
              className="mb-1.5 block text-[13px] font-medium"
            >
              Commentaire (optionnel)
            </label>
            <Textarea
              id="repair-comment"
              rows={2}
              maxLength={500}
              placeholder="Décrivez les dommages, l'historique du véhicule, ce qui est déjà réparé…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={analyzing}>
              Annuler
            </Button>
            <Button
              onClick={analyze}
              disabled={images.length === 0 || analyzing}
              loading={analyzing}
            >
              {analyzing ? "Analyse en cours…" : "Analyser"}
            </Button>
          </div>
        </div>
      )}

      {estimate && (
        <EstimateResult
          estimate={estimate}
          saving={saving}
          onSave={saveAsCost}
          onReset={() => {
            setEstimate(null);
          }}
          onClose={handleClose}
        />
      )}
    </Modal>
  );
}

function EstimateResult({
  estimate,
  saving,
  onSave,
  onReset,
  onClose,
}: {
  estimate: RepairEstimate;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const avgCost = Math.round((estimate.cout_total_min + estimate.cout_total_max) / 2);
  const noDamage = estimate.zones_detectees.length === 0;

  const confidenceTone =
    estimate.niveau_confiance === "élevé"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : estimate.niveau_confiance === "moyen"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";

  const recoConfig: Record<
    RepairEstimate["recommandation"],
    { label: string; icon: React.ReactNode; tone: string }
  > = {
    reparer_avant_vente: {
      label: "Réparer avant la vente",
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "bg-emerald-50 text-emerald-700",
    },
    vendre_en_etat: {
      label: "Vendre en l'état",
      icon: <CheckCircle2 className="h-4 w-4" />,
      tone: "bg-primary/10 text-primary",
    },
    declarer_annonce: {
      label: "Déclarer dans l'annonce",
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: "bg-amber-50 text-amber-700",
    },
  };
  const reco = recoConfig[estimate.recommandation];

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/10 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-[13px] font-medium text-foreground">
            Analyse Claude Vision
          </span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset",
            confidenceTone,
          )}
        >
          Confiance : {estimate.niveau_confiance}
        </span>
      </div>

      {estimate.avertissement && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{estimate.avertissement}</p>
        </div>
      )}

      {/* Zones */}
      {noDamage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" />
          <p className="mt-2 text-[14px] font-medium text-emerald-900">
            Aucun dommage détecté
          </p>
          <p className="mt-1 text-[12.5px] text-emerald-800/80">
            {estimate.justification}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {estimate.zones_detectees.map((z, i) => (
            <ZoneCard key={i} zone={z} />
          ))}
        </div>
      )}

      {/* Total + reco */}
      {!noDamage && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="text-[12.5px] font-medium uppercase tracking-wide text-muted-foreground">
              Coût total estimé
            </p>
            <p className="tabular text-[20px] font-semibold tracking-tight">
              {formatPrice(estimate.cout_total_min)} —{" "}
              {formatPrice(estimate.cout_total_max)}
            </p>
          </div>

          <div className={cn("flex items-start gap-2 rounded-lg p-3 text-[13px]", reco.tone)}>
            <span className="mt-0.5">{reco.icon}</span>
            <div>
              <p className="font-semibold">{reco.label}</p>
              <p className="mt-0.5 opacity-90">{estimate.justification}</p>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onReset}>
          <Camera className="h-3.5 w-3.5" /> Refaire l'analyse
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {!noDamage && (
            <Button onClick={onSave} loading={saving} disabled={avgCost <= 0}>
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Enregistrer comme frais (
                  {formatPrice(avgCost)})
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ZoneCard({ zone }: { zone: RepairEstimate["zones_detectees"][number] }) {
  const tone =
    zone.gravite === "grave"
      ? "border-rose-200 bg-rose-50/40"
      : zone.gravite === "modérée"
        ? "border-amber-200 bg-amber-50/40"
        : "border-emerald-200 bg-emerald-50/40";

  const dot =
    zone.gravite === "grave"
      ? "bg-rose-500"
      : zone.gravite === "modérée"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className={cn("rounded-xl border p-3.5", tone)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[14px] font-semibold">
            <span className={cn("h-2 w-2 rounded-full", dot)} />
            {zone.zone}
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {zone.type_dommage}
          </p>
        </div>
        <p className="tabular text-[14px] font-semibold tracking-tight">
          {formatPrice(zone.cout_min)} – {formatPrice(zone.cout_max)}
        </p>
      </div>
      <p className="mt-2 text-[12.5px] text-foreground/80">
        <span className="font-medium">Réparation :</span>{" "}
        {zone.reparation_recommandee}
      </p>
    </div>
  );
}
