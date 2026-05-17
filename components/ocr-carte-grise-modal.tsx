"use client";

import { useCallback, useRef, useState } from "react";
import {
  Camera,
  Sparkles,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { fileToCompressedBase64, cn } from "@/lib/utils";
import type { CarteGriseData } from "@/app/api/ocr-carte-grise/route";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (data: CarteGriseData) => void;
}

export function OcrCarteGriseModal({ open, onClose, onApply }: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  type ImgType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [type, setType] = useState<ImgType>("image/jpeg");
  const [extracting, setExtracting] = useState(false);
  const [data, setData] = useState<CarteGriseData | null>(null);

  const reset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setBase64(null);
    setData(null);
    setExtracting(false);
  }, [preview]);

  const handleClose = useCallback(() => {
    if (extracting) return;
    reset();
    onClose();
  }, [extracting, reset, onClose]);

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;
      if (!/^image\//.test(file.type)) {
        toast.error("Format non supporté", "JPG, PNG ou WEBP uniquement");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Fichier trop lourd", "10 Mo max");
        return;
      }
      try {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(file));
        const { base64: b64, type: t } = await fileToCompressedBase64(file, 1800, 0.88);
        setBase64(b64);
        setType(t);
        setData(null);
      } catch (e) {
        toast.error(
          "Lecture impossible",
          e instanceof Error ? e.message : "Erreur",
        );
      }
    },
    [preview, toast],
  );

  async function extract() {
    if (!base64 || extracting) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/ocr-carte-grise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: { base64, type } }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error("Extraction échouée", json?.error ?? "Réessayez");
        setExtracting(false);
        return;
      }
      const result = json.data as CarteGriseData;
      if (!result.is_carte_grise) {
        toast.error(
          "Pas une carte grise",
          "Ce document ne semble pas être un certificat d'immatriculation français.",
        );
        setExtracting(false);
        return;
      }
      setData(result);
    } catch (e) {
      toast.error(
        "Erreur réseau",
        e instanceof Error ? e.message : "Connexion impossible",
      );
    } finally {
      setExtracting(false);
    }
  }

  function applyAndClose() {
    if (!data) return;
    onApply(data);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title={
        <span className="inline-flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          Scanner la carte grise
        </span>
      }
      description="Claude Vision lit la carte et pré-remplit le formulaire pour vous."
    >
      <div className="space-y-4">
        {/* Upload zone or preview */}
        {!preview ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/70 bg-muted/30 px-4 py-8 transition-colors hover:border-primary/50 hover:bg-primary/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Upload className="h-4.5 w-4.5" />
              </span>
              <p className="text-[14px] font-medium">Choisir un fichier</p>
              <p className="text-[12px] text-muted-foreground">
                JPG · PNG · WEBP
              </p>
            </button>
            <label
              htmlFor="cg-cam"
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/70 bg-muted/30 px-4 py-8 transition-colors hover:border-primary/50 hover:bg-primary/10 sm:cursor-pointer"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Camera className="h-4.5 w-4.5" />
              </span>
              <p className="text-[14px] font-medium">Prendre une photo</p>
              <p className="text-[12px] text-muted-foreground">Mobile</p>
              <input
                id="cg-cam"
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Carte grise"
              className="max-h-72 w-full object-contain"
            />
            <button
              type="button"
              onClick={() => {
                if (preview) URL.revokeObjectURL(preview);
                setPreview(null);
                setBase64(null);
                setData(null);
              }}
              disabled={extracting}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/85 text-background shadow-lg transition-colors hover:bg-foreground disabled:opacity-50"
              aria-label="Changer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Action button */}
        {preview && !data && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={extracting}>
              Annuler
            </Button>
            <Button onClick={extract} loading={extracting}>
              <Sparkles className="h-3.5 w-3.5" />
              {extracting ? "Lecture en cours…" : "Extraire les informations"}
            </Button>
          </div>
        )}

        {/* Result */}
        {data && (
          <ResultPanel data={data} onApply={applyAndClose} onCancel={handleClose} />
        )}
      </div>
    </Modal>
  );
}

function ResultPanel({
  data,
  onApply,
  onCancel,
}: {
  data: CarteGriseData;
  onApply: () => void;
  onCancel: () => void;
}) {
  const fields: {
    key: keyof CarteGriseData;
    label: string;
    format?: (v: unknown) => string;
  }[] = [
    { key: "plate_number", label: "Immatriculation" },
    { key: "first_registration_date", label: "1ʳᵉ mise en circulation" },
    { key: "make", label: "Marque" },
    { key: "model", label: "Modèle" },
    { key: "version", label: "Version" },
    { key: "fuel_type", label: "Carburant" },
    {
      key: "power_kw",
      label: "Puissance",
      format: (v) =>
        typeof v === "number" ? `${v} kW (~${Math.round(v * 1.36)} ch)` : "",
    },
    {
      key: "engine_displacement",
      label: "Cylindrée",
      format: (v) => (typeof v === "number" ? `${v} cm³` : ""),
    },
    { key: "seats", label: "Places" },
    {
      key: "ptac",
      label: "PTAC",
      format: (v) => (typeof v === "number" ? `${v} kg` : ""),
    },
  ];

  const filledCount = fields.filter((f) => data[f.key] != null).length;
  const confidenceTone =
    data.confidence === "élevé"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : data.confidence === "moyen"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-primary/10 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-[13px] font-medium text-foreground">
            {filledCount} champ{filledCount > 1 ? "s" : ""} extrait
            {filledCount > 1 ? "s" : ""}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset",
            confidenceTone,
          )}
        >
          Confiance : {data.confidence}
        </span>
      </div>

      {data.confidence === "faible" && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-[13px] text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Image peu lisible — vérifiez les valeurs avant validation. Certains
            champs peuvent être incorrects.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-[13px]">
          <tbody className="divide-y divide-border/50">
            {fields.map((f) => {
              const raw = data[f.key];
              const filled = raw != null && raw !== "";
              const display = filled
                ? f.format
                  ? f.format(raw)
                  : String(raw)
                : "Non détecté";
              return (
                <tr key={String(f.key)} className={filled ? "" : "bg-amber-50/30"}>
                  <td className="w-1/2 px-3 py-2 text-muted-foreground">
                    {f.label}
                  </td>
                  <td className="px-3 py-2">
                    {filled ? (
                      <span className="font-medium text-foreground">{display}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-amber-700">
                        <FileWarning className="h-3 w-3" />
                        {display}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.unreadable_fields.length > 0 && (
        <p className="text-[11.5px] text-muted-foreground">
          Champs illisibles : {data.unreadable_fields.join(", ")}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={onApply}>
          <Sparkles className="h-3.5 w-3.5" />
          Appliquer au formulaire ({filledCount})
        </Button>
      </div>
    </div>
  );
}
