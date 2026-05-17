import Link from "next/link";
import { ClipboardCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBody, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getServerAuth } from "@/lib/supabase/server";
import { formatRelative, formatTitle } from "@/lib/utils";
import {
  INSPECTION_DECISION_LABELS,
  type VehicleInspection,
} from "@/lib/types";
import {
  countCompletedForSteps,
  inspectionStepsCount,
  resolveInspectionSteps,
} from "@/lib/inspection-steps-config";
import { NewInspectionButton } from "./new-inspection-button";

export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  const { supabase, user } = await getServerAuth();
  if (!user) return null;

  const { data } = await supabase
    .from("vehicle_inspections")
    .select("*")
    .eq("dealer_id", user.id)
    .order("updated_at", { ascending: false });

  const inspections = (data ?? []) as VehicleInspection[];

  return (
    <>
      <PageHeader
        eyebrow="Sourcing"
        title="Consultation pré-achat"
        description="Checklist guidée et personnalisable pour sécuriser l'achat d'un véhicule. Ajoutez ou retirez des étapes selon votre méthode."
        actions={<NewInspectionButton />}
      />

      <PageBody>
        {inspections.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck className="h-5 w-5" />}
            title="Démarrez votre première consultation"
            description="Étapes par défaut (Histovec, châssis, CT, carrosserie…) ou checklist sur mesure. Personnalisez chaque consultation depuis le bouton « Étapes »."
            action={<NewInspectionButton variant="primary" />}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {inspections.map((insp) => (
              <InspectionCard key={insp.id} inspection={insp} />
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}

function InspectionCard({ inspection }: { inspection: VehicleInspection }) {
  const steps = resolveInspectionSteps(inspection.steps_config);
  const total = inspectionStepsCount(inspection.steps_config);
  const completed = countCompletedForSteps(steps, inspection.steps_state ?? {});
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const isDone = inspection.completed_at != null;

  const decisionStyle =
    inspection.decision === "go"
      ? "text-success ring-success/30 bg-success/10"
      : inspection.decision === "no_go"
      ? "text-destructive ring-destructive/30 bg-destructive/10"
      : inspection.decision === "uncertain"
      ? "text-warning ring-warning/30 bg-warning/10"
      : "text-muted-foreground ring-border bg-muted/40";

  const subtitle = [
    inspection.vehicle_brand && inspection.vehicle_model
      ? `${formatTitle(inspection.vehicle_brand)} ${formatTitle(inspection.vehicle_model)}`
      : null,
    inspection.vehicle_year ?? null,
    inspection.vehicle_plate ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/sourcing/inspections/${inspection.id}`} className="group">
      <Card className="relative h-full overflow-hidden transition-all duration-150 hover:border-foreground/20 hover:shadow-md">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-semibold tracking-tight">
                {inspection.title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] ring-1 ring-inset ${decisionStyle}`}
            >
              {inspection.decision
                ? INSPECTION_DECISION_LABELS[inspection.decision]
                : isDone
                ? "Terminée"
                : "En cours"}
            </span>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium tabular-nums">
                {completed}/{total} étapes
              </span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
            <span>Mis à jour {formatRelative(inspection.updated_at)}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

