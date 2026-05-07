"use client";

import { useState } from "react";
import { Sparkles, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { InspectionStep } from "@/lib/inspection-steps";
import type { InspectionStepState, VehicleInspection } from "@/lib/types";
import type { ChassisLocationResult } from "@/app/api/inspections/ai/chassis-location/route";

interface Props {
  step: InspectionStep;
  state: InspectionStepState;
  inspection: VehicleInspection;
  onStepChange: (patch: Partial<InspectionStepState>) => void;
}

const CONFIDENCE_TINT: Record<
  ChassisLocationResult["locations"][number]["confidence"],
  string
> = {
  élevée: "bg-success/12 text-success ring-success/30",
  moyenne: "bg-warning/12 text-warning ring-warning/30",
  faible: "bg-muted text-muted-foreground ring-border",
};

export function StepAiChassis({
  state,
  inspection,
  onStepChange,
}: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const result = state.aiResult as ChassisLocationResult | undefined;

  const canSearch = Boolean(inspection.vehicle_brand && inspection.vehicle_model);

  async function search() {
    if (!canSearch) {
      toast.error(
        "Marque et modèle requis",
        "Renseignez ces infos sur l'inspection pour activer la recherche.",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        "/api/inspections/ai/chassis-location",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand: inspection.vehicle_brand,
            model: inspection.vehicle_model,
            year: inspection.vehicle_year ?? undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      onStepChange({ aiResult: json.result });
    } catch (err) {
      toast.error(
        "Recherche impossible",
        err instanceof Error ? err.message : "Erreur",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
            <Sparkles className="h-4 w-4 text-foreground" />
            Localisation par IA
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {canSearch
              ? `Cherche les emplacements probables pour ${inspection.vehicle_brand} ${inspection.vehicle_model}${
                  inspection.vehicle_year ? ` (${inspection.vehicle_year})` : ""
                }.`
              : "Renseignez la marque et le modèle de l'inspection (en haut) pour lancer la recherche."}
          </p>
        </div>
        <Button onClick={search} disabled={loading || !canSearch} size="sm">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Recherche…
            </>
          ) : result ? (
            <>
              <Sparkles className="h-4 w-4" /> Relancer
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Lancer la recherche
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="mt-4 space-y-3">
          {result.warning && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/[0.06] p-2.5 text-[12px] text-warning">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {result.warning}
            </div>
          )}

          <ol className="space-y-2">
            {result.locations.map((loc, i) => (
              <li
                key={`${loc.label}-${i}`}
                className="rounded-xl border border-border/60 bg-background p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold tabular-nums text-background">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[13.5px] font-semibold leading-snug">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {loc.label}
                      </p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                        {loc.detail}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ring-1 ring-inset",
                      CONFIDENCE_TINT[loc.confidence],
                    )}
                  >
                    {loc.confidence}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          {result.notes && (
            <p className="rounded-xl bg-muted/50 p-3 text-[12.5px] leading-relaxed text-muted-foreground">
              💡 {result.notes}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
