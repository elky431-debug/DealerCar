"use client";

import { useRef, useState } from "react";
import {
  Sparkles,
  Loader2,
  Upload,
  FileImage,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn, fileToCompressedBase64, formatDate } from "@/lib/utils";
import type { InspectionStep } from "@/lib/inspection-steps";
import type { InspectionStepState } from "@/lib/types";
import type { CtAnalysisResult } from "@/app/api/inspections/ai/analyze-ct/route";

interface Props {
  step: InspectionStep;
  state: InspectionStepState;
  onStepChange: (patch: Partial<InspectionStepState>) => void;
}

const VERDICT_META: Record<
  CtAnalysisResult["verdict"],
  { label: string; tint: string; icon: React.ReactNode }
> = {
  favorable: {
    label: "Favorable",
    tint: "bg-success/12 text-success ring-success/30",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  favorable_avec_defauts: {
    label: "Favorable avec défauts",
    tint: "bg-warning/12 text-warning ring-warning/30",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  defavorable: {
    label: "Défavorable",
    tint: "bg-destructive/12 text-destructive ring-destructive/30",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  indetermine: {
    label: "Indéterminé",
    tint: "bg-muted text-muted-foreground ring-border",
    icon: <HelpCircle className="h-3.5 w-3.5" />,
  },
};

export function StepAiCt({ state, onStepChange }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [pending, setPending] = useState<
    { base64: string; type: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }[]
  >([]);

  const result = state.aiResult as CtAnalysisResult | undefined;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, 3);
    try {
      const compressed = await Promise.all(
        list.map((f) => fileToCompressedBase64(f, 1800, 0.85)),
      );
      setPending(compressed);
      setPreviews(list.map((f) => URL.createObjectURL(f)));
    } catch (err) {
      toast.error(
        "Lecture du fichier impossible",
        err instanceof Error ? err.message : "Erreur",
      );
    }
  }

  async function analyze() {
    if (pending.length === 0) {
      toast.error("Ajoutez au moins une photo du contrôle technique.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/inspections/ai/analyze-ct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: pending }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      onStepChange({ aiResult: json.result });
      // libère les blobs
      previews.forEach((u) => URL.revokeObjectURL(u));
      setPreviews([]);
      setPending([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(
        "Analyse impossible",
        err instanceof Error ? err.message : "Erreur",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    onStepChange({ aiResult: null });
  }

  const verdict = result ? VERDICT_META[result.verdict] : null;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
            <Sparkles className="h-4 w-4 text-foreground" />
            Analyse du contrôle technique par IA
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            Photographiez le PV de contrôle technique. L&apos;IA extrait les
            défauts, la date, le kilométrage, et un verdict orienté acheteur.
          </p>
        </div>
      </div>

      {!result && (
        <div className="mt-4 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-foreground/30 hover:bg-muted/50"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-[13px] font-medium">
              Ajouter des photos du contrôle technique
            </span>
            <span className="text-[11px] text-muted-foreground">
              Jusqu&apos;à 3 photos · JPG/PNG · auto-compressées
            </span>
          </button>

          {previews.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`CT ${i + 1}`}
                    className="aspect-[3/4] w-full rounded-lg object-cover ring-1 ring-border"
                  />
                ))}
              </div>
              <Button
                onClick={analyze}
                disabled={analyzing}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Analyser le contrôle technique
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      )}

      {result && verdict && (
        <div className="mt-4 space-y-3">
          {/* Verdict + meta */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium ring-1 ring-inset",
                verdict.tint,
              )}
            >
              {verdict.icon}
              {verdict.label}
            </span>
            <ConfidencePill level={result.niveau_confiance} />
          </div>

          {/* Métadonnées */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-center">
            <Meta label="Date CT" value={result.date_controle ? formatDate(result.date_controle) : "—"} />
            <Meta label="Validité" value={result.date_validite ? formatDate(result.date_validite) : "—"} />
            <Meta
              label="Kilométrage"
              value={result.kilometrage ? `${result.kilometrage.toLocaleString("fr-FR")} km` : "—"}
            />
          </div>

          {/* Défauts */}
          <DefaultsList
            label="Défauts critiques"
            tone="critical"
            items={result.defauts_critiques}
          />
          <DefaultsList
            label="Défauts majeurs"
            tone="major"
            items={result.defauts_majeurs}
          />
          <DefaultsList
            label="Défauts mineurs"
            tone="minor"
            items={result.defauts_mineurs}
          />

          {/* Recommandation */}
          {result.recommandation && (
            <div className="rounded-xl bg-foreground/[0.04] p-3 text-[13px] leading-relaxed">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Recommandation
              </p>
              <p className="mt-1 text-foreground">{result.recommandation}</p>
            </div>
          )}

          {result.avertissement && (
            <p className="rounded-xl border border-warning/30 bg-warning/[0.05] p-3 text-[12.5px] text-warning">
              {result.avertissement}
            </p>
          )}

          <button
            type="button"
            onClick={reset}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            Refaire l&apos;analyse avec d&apos;autres photos
          </button>
        </div>
      )}
    </section>
  );
}

function ConfidencePill({
  level,
}: {
  level: CtAnalysisResult["niveau_confiance"];
}) {
  const tint =
    level === "élevé"
      ? "bg-success/10 text-success ring-success/30"
      : level === "moyen"
      ? "bg-warning/10 text-warning ring-warning/30"
      : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] ring-1 ring-inset",
        tint,
      )}
    >
      Confiance {level}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 truncate text-[13px] font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}

function DefaultsList({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "critical" | "major" | "minor";
  items: string[];
}) {
  if (!items || items.length === 0) return null;
  const toneCls =
    tone === "critical"
      ? "bg-destructive/[0.06] border-destructive/25 text-destructive"
      : tone === "major"
      ? "bg-warning/[0.06] border-warning/25 text-warning"
      : "bg-muted/50 border-border text-muted-foreground";

  return (
    <div className={cn("rounded-xl border p-3", toneCls)}>
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em]">
        <FileImage className="h-3 w-3" />
        {label} ({items.length})
      </p>
      <ul className="mt-2 space-y-1 text-[13px] text-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
