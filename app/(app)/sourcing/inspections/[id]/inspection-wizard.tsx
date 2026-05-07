"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/lib/use-debounced";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  INSPECTION_STEPS,
  INSPECTION_STEPS_COUNT,
  countCompleted,
} from "@/lib/inspection-steps";
import type { InspectionStepState, VehicleInspection } from "@/lib/types";
import { StepRenderer } from "./step-renderer";
import { StepHero } from "./step-hero";
import { WizardTopBar } from "./wizard-topbar";

interface Props {
  inspection: VehicleInspection;
}

/**
 * Wizard "focus mode".
 *
 *   ┌──────────────────────────────────────────┐
 *   │  ←  Inspection X       • • • • •     [4/10 ▼]   │  topbar sticky
 *   ├──────────────────────────────────────────┤
 *   │   ╔══════════════════════════════════╗   │
 *   │   ║   Hero illustration + n° + titre  ║   │  step hero
 *   │   ╚══════════════════════════════════╝   │
 *   │       Description, tips, checklist…       │  body centré max-w-2xl
 *   ├──────────────────────────────────────────┤
 *   │   [Précédent]  • progression •  [Valider] │  footer fixe
 *   └──────────────────────────────────────────┘
 *
 * On NE voit PAS toutes les étapes en sidebar (UX demandée).
 * Pour sauter à une autre étape : picker dans la topbar.
 *
 * Raccourcis :  ←  étape précédente   |   →  étape suivante
 */
export function InspectionWizard({ inspection: initial }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [inspection, setInspection] = useState(initial);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const [currentIdx, setCurrentIdx] = useState(
    Math.max(0, (initial.current_step ?? 1) - 1),
  );
  const currentStep = INSPECTION_STEPS[currentIdx];

  // Pour animer la transition de step (fade subtil)
  const [transitionKey, setTransitionKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const completedCount = useMemo(
    () => countCompleted(inspection.steps_state ?? {}),
    [inspection.steps_state],
  );
  const progressPct = Math.round(
    (completedCount / INSPECTION_STEPS_COUNT) * 100,
  );

  /* ─── Patch serveur ─── */

  const sendPatch = useCallback(
    async (
      payload:
        | { step_patch: { id: string; state: InspectionStepState } }
        | { current_step: number }
        | { complete: boolean }
        | Partial<
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
              | "decision"
              | "decision_notes"
            >
          >,
    ) => {
      setSavingState("saving");
      try {
        const res = await fetch(`/api/inspections/${inspection.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erreur de sauvegarde");
        setInspection(json.inspection as VehicleInspection);
        setSavingState("saved");
        setTimeout(() => setSavingState("idle"), 1500);
      } catch (err) {
        setSavingState("idle");
        toast.error(
          "Sauvegarde impossible",
          err instanceof Error ? err.message : "Erreur",
        );
      }
    },
    [inspection.id, toast],
  );

  const debouncedPatch = useDebouncedCallback(sendPatch, 700);

  /* ─── Mutations locales optimistes ─── */

  const updateStepState = useCallback(
    (stepId: string, patch: Partial<InspectionStepState>) => {
      setInspection((prev) => ({
        ...prev,
        steps_state: {
          ...(prev.steps_state ?? {}),
          [stepId]: {
            ...(prev.steps_state?.[stepId] ?? {}),
            ...patch,
          },
        },
      }));
      debouncedPatch({ step_patch: { id: stepId, state: patch } });
    },
    [debouncedPatch],
  );

  const updateInspection = useCallback(
    (
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
    ) => {
      setInspection((prev) => ({ ...prev, ...patch }));
      debouncedPatch(patch);
    },
    [debouncedPatch],
  );

  /* ─── Navigation ─── */

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(INSPECTION_STEPS_COUNT - 1, idx));
      if (clamped === currentIdx) return;
      setCurrentIdx(clamped);
      setTransitionKey((k) => k + 1);
      // Scroll en haut du contenu, pas du document complet (la topbar reste sticky)
      window.scrollTo({ top: 0, behavior: "smooth" });
      sendPatch({ current_step: clamped + 1 });
    },
    [currentIdx, sendPatch],
  );

  const validateAndNext = useCallback(() => {
    const stepId = currentStep.id;
    updateStepState(stepId, { done: true });
    if (currentIdx < INSPECTION_STEPS_COUNT - 1) {
      // Petit délai pour laisser voir le check
      setTimeout(() => goTo(currentIdx + 1), 220);
    } else {
      sendPatch({ complete: true });
      toast.success("Consultation terminée", "Bonne décision !");
    }
  }, [currentStep.id, currentIdx, goTo, sendPatch, toast, updateStepState]);

  const skip = useCallback(() => {
    if (currentIdx < INSPECTION_STEPS_COUNT - 1) goTo(currentIdx + 1);
  }, [currentIdx, goTo]);

  const back = useCallback(() => {
    if (currentIdx > 0) goTo(currentIdx - 1);
  }, [currentIdx, goTo]);

  /* ─── Raccourcis clavier ←  →  ─── */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ne pas intercepter si l'utilisateur tape dans un input/textarea
      const t = e.target as HTMLElement | null;
      const isTyping =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (isTyping) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentIdx < INSPECTION_STEPS_COUNT - 1) goTo(currentIdx + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIdx > 0) goTo(currentIdx - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentIdx, goTo]);

  /* ─── Suppression ─── */

  const [deleting, setDeleting] = useState(false);
  async function deleteInspection() {
    if (!confirm("Supprimer cette consultation ? Action irréversible.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/inspections/${inspection.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? "Erreur");
      }
      router.push("/sourcing/inspections");
      router.refresh();
    } catch (err) {
      toast.error(
        "Suppression impossible",
        err instanceof Error ? err.message : "Erreur",
      );
      setDeleting(false);
    }
  }

  const stepState = inspection.steps_state?.[currentStep.id] ?? {};
  const isStepDone = Boolean(stepState.done);
  const isLastStep = currentIdx === INSPECTION_STEPS_COUNT - 1;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <WizardTopBar
        title={inspection.title}
        currentIdx={currentIdx}
        stepsState={inspection.steps_state ?? {}}
        onNavigate={goTo}
        savingState={savingState}
        completedCount={completedCount}
      />

      {/* Container centré, max 720px pour la lisibilité */}
      <main
        ref={contentRef}
        className="mx-auto w-full max-w-[760px] px-4 pb-32 pt-6 sm:px-6 sm:pt-10"
      >
        {/* Animation fade entre étapes via key */}
        <div key={transitionKey} className="space-y-6 animate-in">
          <StepHero step={currentStep} done={isStepDone} />

          {currentStep.description && (
            <p className="text-[15px] leading-relaxed text-foreground/85">
              {currentStep.description}
            </p>
          )}

          {currentStep.tips && currentStep.tips.length > 0 && (
            <div className="space-y-2">
              {currentStep.tips.map((t) => (
                <div
                  key={t.title}
                  className="rounded-2xl border border-border/60 bg-muted/40 p-4"
                >
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t.title}
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">
                    {t.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {currentStep.redFlags && currentStep.redFlags.length > 0 && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/[0.06] p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                Ne pas acheter si
              </p>
              <ul className="mt-2.5 space-y-1.5 text-[13.5px] text-destructive/90">
                {currentStep.redFlags.map((rf) => (
                  <li key={rf} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />
                    {rf}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <StepRenderer
            step={currentStep}
            state={stepState}
            inspection={inspection}
            onStepChange={(patch) => updateStepState(currentStep.id, patch)}
            onInspectionChange={updateInspection}
          />

          {currentStep.footnote && (
            <p className="text-[12.5px] italic text-muted-foreground">
              {currentStep.footnote}
            </p>
          )}
        </div>

        {/* Lien suppression discret en bas du contenu */}
        <div className="mt-12 flex justify-center pt-6">
          <button
            type="button"
            onClick={deleteInspection}
            disabled={deleting}
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground/70 transition-colors hover:text-destructive disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Supprimer cette consultation
          </button>
        </div>
      </main>

      {/* Footer fixe : nav prev/next */}
      <WizardFooter
        currentIdx={currentIdx}
        progressPct={progressPct}
        completedCount={completedCount}
        isStepDone={isStepDone}
        isLastStep={isLastStep}
        canSkip={Boolean(currentStep.optional)}
        onBack={back}
        onSkip={skip}
        onNext={() => goTo(currentIdx + 1)}
        onValidate={validateAndNext}
      />
    </div>
  );
}

/* ─────────────────── Footer fixe ─────────────────── */

function WizardFooter({
  currentIdx,
  progressPct,
  completedCount,
  isStepDone,
  isLastStep,
  canSkip,
  onBack,
  onSkip,
  onNext,
  onValidate,
}: {
  currentIdx: number;
  progressPct: number;
  completedCount: number;
  isStepDone: boolean;
  isLastStep: boolean;
  canSkip: boolean;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
  onValidate: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[760px] items-center gap-3 px-4 py-3 sm:px-6">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={currentIdx === 0}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Précédent</span>
        </Button>

        {/* Progress circulaire au centre */}
        <div className="hidden flex-1 items-center justify-center gap-3 sm:flex">
          <ProgressRing pct={progressPct} />
          <div className="text-[11.5px] leading-tight">
            <p className="font-semibold tabular-nums text-foreground">
              {completedCount}/{INSPECTION_STEPS_COUNT}
            </p>
            <p className="text-muted-foreground">étapes validées</p>
          </div>
        </div>

        {/* Mobile : barre simple au centre */}
        <div className="flex flex-1 items-center justify-center gap-2 sm:hidden">
          <div className="h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10.5px] font-medium tabular-nums text-muted-foreground">
            {progressPct}%
          </span>
        </div>

        {canSkip && !isStepDone && (
          <Button variant="ghost" onClick={onSkip} className="hidden sm:inline-flex">
            Passer
          </Button>
        )}

        {isStepDone && !isLastStep ? (
          <Button onClick={onNext} className="shrink-0">
            <span className="hidden sm:inline">Suivante</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={onValidate} className="shrink-0">
            {isLastStep ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Terminer</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Valider l&apos;étape</span>
                <span className="sm:hidden">Valider</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Anneau de progression SVG ─────────────────── */

function ProgressRing({ pct }: { pct: number }) {
  const size = 32;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rotate-[-90deg]"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--muted))"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="hsl(var(--foreground))"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 400ms ease-out" }}
      />
    </svg>
  );
}
