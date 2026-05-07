"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import type { InspectionStep, FormFieldDef } from "@/lib/inspection-steps";
import type { InspectionStepState, VehicleInspection } from "@/lib/types";
import { StepAiChassis } from "./step-ai-chassis";
import { StepAiCt } from "./step-ai-ct";
import { StepAiTires } from "./step-ai-tires";

interface Props {
  step: InspectionStep;
  state: InspectionStepState;
  inspection: VehicleInspection;
  onStepChange: (patch: Partial<InspectionStepState>) => void;
  onInspectionChange: (
    patch: Partial<
      Pick<
        VehicleInspection,
        | "title"
        | "vehicle_brand"
        | "vehicle_model"
        | "vehicle_year"
        | "vehicle_plate"
        | "vehicle_vin"
        | "buyer_first_name"
        | "buyer_last_name"
      >
    >,
  ) => void;
}

/**
 * Dispatcher : choisit le composant à rendre selon le `kind` de l'étape.
 * Pour ajouter un nouveau type d'étape, créer un composant et l'ajouter ici.
 */
export function StepRenderer({
  step,
  state,
  inspection,
  onStepChange,
  onInspectionChange,
}: Props) {
  switch (step.kind) {
    case "ai_chassis":
      return (
        <>
          <StepAiChassis
            step={step}
            state={state}
            inspection={inspection}
            onStepChange={onStepChange}
          />
          <ChecklistBlock step={step} state={state} onStepChange={onStepChange} />
          <NotesBlock state={state} onStepChange={onStepChange} />
        </>
      );

    case "ai_ct":
      return (
        <>
          <StepAiCt step={step} state={state} onStepChange={onStepChange} />
          <ChecklistBlock step={step} state={state} onStepChange={onStepChange} />
          <NotesBlock state={state} onStepChange={onStepChange} />
        </>
      );

    case "ai_tires":
      return (
        <>
          <FormBlock
            step={step}
            state={state}
            inspection={inspection}
            onStepChange={onStepChange}
            onInspectionChange={onInspectionChange}
          />
          <StepAiTires step={step} state={state} />
          <ChecklistBlock step={step} state={state} onStepChange={onStepChange} />
          <NotesBlock state={state} onStepChange={onStepChange} />
        </>
      );

    case "form":
      return (
        <>
          <FormBlock
            step={step}
            state={state}
            inspection={inspection}
            onStepChange={onStepChange}
            onInspectionChange={onInspectionChange}
          />
          <NotesBlock state={state} onStepChange={onStepChange} />
        </>
      );

    case "checklist":
    default:
      return (
        <>
          <ChecklistBlock step={step} state={state} onStepChange={onStepChange} />
          <NotesBlock state={state} onStepChange={onStepChange} />
        </>
      );
  }
}

/* ─────────── Checklist ─────────── */

export function ChecklistBlock({
  step,
  state,
  onStepChange,
}: {
  step: InspectionStep;
  state: InspectionStepState;
  onStepChange: (patch: Partial<InspectionStepState>) => void;
}) {
  if (!step.checks || step.checks.length === 0) return null;

  const checks = state.checks ?? {};
  const total = step.checks.length;
  const done = step.checks.filter((c) => checks[c.id]).length;

  function toggle(id: string) {
    onStepChange({
      checks: { ...checks, [id]: !checks[id] },
    });
  }

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]"
      aria-label="Checklist"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Checklist
        </h3>
        <span className="text-[11.5px] tabular-nums text-muted-foreground">
          {done}/{total}
        </span>
      </div>

      <ul className="space-y-1.5">
        {step.checks.map((c) => {
          const checked = Boolean(checks[c.id]);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => toggle(c.id)}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all duration-150 active:scale-[0.99]",
                  checked
                    ? "border-success/30 bg-success/[0.06]"
                    : "border-border/60 bg-background hover:border-foreground/20 hover:bg-foreground/[0.02]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ring-inset transition-colors",
                    checked
                      ? "bg-success text-success-foreground ring-success"
                      : "bg-background ring-border group-hover:ring-foreground/30",
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13.5px] font-medium leading-snug text-foreground">
                    {c.label}
                    {c.severity === "critical" && (
                      <span className="rounded-full bg-destructive/12 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-destructive">
                        Critique
                      </span>
                    )}
                    {c.severity === "warning" && (
                      <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-warning">
                        Attention
                      </span>
                    )}
                  </span>
                  {c.hint && (
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
                      {c.hint}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ─────────── Notes ─────────── */

export function NotesBlock({
  state,
  onStepChange,
}: {
  state: InspectionStepState;
  onStepChange: (patch: Partial<InspectionStepState>) => void;
}) {
  return (
    <Field label="Notes (optionnel)">
      <Textarea
        value={state.notes ?? ""}
        onChange={(e) => onStepChange({ notes: e.target.value })}
        placeholder="Détails, observations, points à vérifier…"
        rows={3}
      />
    </Field>
  );
}

/* ─────────── Form (form ou ai_tires) ─────────── */

/**
 * Champs liés à l'étape Histovec (step1) sont stockés sur l'inspection
 * elle-même (vehicle_plate, vehicle_vin, buyer_first_name, buyer_last_name)
 * pour pouvoir les réutiliser ailleurs (notamment l'étape 3 chassis IA).
 *
 * Les autres formulaires sont stockés dans state.data.
 */
const ROOT_FIELDS = new Set([
  "buyer_first_name",
  "buyer_last_name",
  "vehicle_plate",
  "vehicle_vin",
]);

export function FormBlock({
  step,
  state,
  inspection,
  onStepChange,
  onInspectionChange,
}: {
  step: InspectionStep;
  state: InspectionStepState;
  inspection: VehicleInspection;
  onStepChange: (patch: Partial<InspectionStepState>) => void;
  onInspectionChange: (
    patch: Partial<
      Pick<
        VehicleInspection,
        | "vehicle_plate"
        | "vehicle_vin"
        | "buyer_first_name"
        | "buyer_last_name"
      >
    >,
  ) => void;
}) {
  if (!step.fields || step.fields.length === 0) return null;

  const data = state.data ?? {};

  function getValue(f: FormFieldDef): string {
    if (ROOT_FIELDS.has(f.id)) {
      const v = inspection[f.id as keyof VehicleInspection];
      return v == null ? "" : String(v);
    }
    const v = data[f.id];
    return v == null ? "" : String(v);
  }

  function setValue(f: FormFieldDef, v: string) {
    if (ROOT_FIELDS.has(f.id)) {
      onInspectionChange({
        [f.id]: v.trim() ? v : null,
      } as never);
    } else {
      onStepChange({
        data: {
          ...data,
          [f.id]: f.type === "number" ? (v ? Number(v) : null) : v,
        },
      });
    }
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Informations
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {step.fields.map((f) => (
          <Field
            key={f.id}
            label={f.label}
            required={f.required}
            hint={f.hint}
            className={f.type === "textarea" ? "sm:col-span-2" : undefined}
          >
            {f.type === "textarea" ? (
              <Textarea
                value={getValue(f)}
                onChange={(e) => setValue(f, e.target.value)}
                placeholder={f.placeholder}
              />
            ) : (
              <Input
                type={f.type === "number" ? "number" : "text"}
                value={getValue(f)}
                onChange={(e) => setValue(f, e.target.value)}
                placeholder={f.placeholder}
              />
            )}
          </Field>
        ))}
      </div>
    </section>
  );
}
